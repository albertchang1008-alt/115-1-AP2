import { randomUUID } from 'node:crypto';
import { FieldPath, type DocumentReference, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { isTestClass } from '../../shared/answerIntegrity';
import { safeCode } from '../../shared/model';
import { LIMITS, optionOrderFor, shuffle, type ZExamView } from '../../shared/zuvio';
import { MOOD_BY_CODE, MOOD_CODES, type MoodCode } from '../../shared/zuvioExt';
import {
  quizSignalKey, quizSittingId, type QuizControl, type QuizLeaveEvent, type QuizMonitor, type QuizQuestion,
  type QuizStudentView,
} from '../../shared/platformQuiz';
import { featureAccess } from './features';

type Paper = ZExamView & { explanations: Record<string, string> };
type Order = { id: string; options: string[] }[];
type Session = {
  studentId: string;
  uid: string;
  classId: string;
  round: number;
  startedAt: number;
  submittedAt?: number;
  order: Order;
  answers: Record<string, string>;
  seq: number;
  state: 'active' | 'submitted' | 'expired';
  moodRequired: boolean;
  extendedSeconds?: number;
};
type RosterRow = { studentId: string; name?: string; classId: string };
type CallAccess = (req: any, courseId: string, teacher?: boolean) => Promise<any>;
type Hooks = {
  paper(courseId: string, exam: any, course: any): Promise<Paper>;
  roster(courseId: string, course: any, classes: string[]): Promise<RosterRow[]>;
  prep(courseId: string, course: any, exam: DocumentReference, sitting: any, units: string[], questions: string[]): Promise<{ incomplete: boolean }>;
  analysis(paper: Paper, results: ReturnType<typeof grade>[], revision: number, gen: string, now: number): Record<string, unknown>;
  cleanup(exam: DocumentReference, sittingId: string, revision: number): Promise<void>;
};

const MOOD_WINDOW = 30 * 60_000;
const MAX_SECONDS = 4 * 3600;

function reject(message: string, code: 'failed-precondition' | 'invalid-argument' | 'permission-denied' | 'aborted' = 'failed-precondition'): never {
  throw new HttpsError(code, message);
}

function boundedInt(value: unknown, low: number, high: number) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < low || value > high)
    reject('數值超出可用範圍', 'invalid-argument');
  return value;
}

function studentKey(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 40 &&
    !/[\/\\.\x00-\x1f]/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value);
}

function frozenOrder(paper: Paper): Order {
  return shuffle(paper.items, Math.random).map((item) => ({
    id: item.questionId,
    options: optionOrderFor({ ...item, id: item.questionId }, true, Math.random),
  }));
}

function orderedQuestions(paper: Paper, order: Order): QuizQuestion[] {
  const items = new Map(paper.items.map((item) => [item.questionId, item]));
  return order.map(({ id, options }) => {
    const item = items.get(id)!;
    const texts = new Map(item.options.map((option) => [option.id, option.text]));
    return { id, text: item.text, options: options.map((id) => ({ id, text: texts.get(id)! })) };
  });
}

function validAnswers(order: Order, input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) reject('答案格式錯誤', 'invalid-argument');
  const options = new Map(order.map((row) => [row.id, new Set(row.options)]));
  const entries = Object.entries(input);
  if (entries.length > order.length) reject('作答題數有誤', 'invalid-argument');
  return Object.fromEntries(entries.map(([id, choice]) => {
    const allowed = options.get(id);
    if (!allowed || typeof choice !== 'string' || (choice !== '' && !allowed.has(choice)))
      reject('選答不屬於這份考卷', 'invalid-argument');
    return [id, choice];
  }));
}

function grade(paper: Paper, session: Session) {
  const answers = Object.fromEntries(paper.items.map((item) => [item.questionId, session.answers[item.questionId] || '']));
  const correct = paper.items.filter((item) => answers[item.questionId] === item.answer).length;
  return {
    studentId: session.studentId, classId: session.classId, answers, correct, score: correct * paper.score,
    ...(session.round ? { makeup: session.round } : {}),
    ...(Object.values(answers).every((answer) => !answer) ? { blankStart: true } : {}),
    ...(session.extendedSeconds ? { extendedSeconds: session.extendedSeconds } : {}),
  };
}

export function preparedQuiz(courseId: string, examId: string, title: string, count: number, label: string, classId: string, duration?: unknown): QuizControl {
  return {
    courseId, examId, title, itemCount: count, label, classId, state: 'prepared', round: 0, ctl: 0,
    baseSeconds: duration === undefined ? count * 30 : boundedInt(duration, 1, MAX_SECONDS),
    extendSeconds: 0, openedAt: 0, deadline: 0, finalDeadline: 0, extensions: {}, makeupIds: [],
    releasedAt: 0, releasedAtByRound: {}, closedAt: 0, releasedRound: -1,
  };
}

export function createPlatformQuizHandlers(db: Firestore, access: CallAccess, options: any, hooks: Hooks) {
  const authenticate = featureAccess(access, 'zuvioExams');
  const refFor = (courseId: string, sittingId: string) => db.doc('courses/' + courseId + '/platformQuizzes/' + sittingId);
  const examFor = (quiz: QuizControl) => db.doc('courses/' + quiz.courseId + '/zuvioExams/' + quiz.examId);
  const monitorFor = (ref: DocumentReference) => ref.collection('monitor').doc('summary');
  const sessionFor = (ref: DocumentReference, student: string) => ref.collection('sessions').doc(student);
  const paperFor = (ref: DocumentReference) => ref.collection('private').doc('paper');
  const rosterFor = (ref: DocumentReference) => ref.collection('private').doc('roster');
  const moodFor = (quiz: QuizControl, sittingId: string, uid: string) =>
    examFor(quiz).collection('moods').doc(sittingId).collection('responses').doc(uid);
  const signalFor = (quiz: QuizControl) => db.collection('quizSignals').doc(quizSignalKey(quiz.courseId, quiz.classId));
  const readQuiz = (data: unknown) => {
    if (!data) reject('找不到小考');
    return data as QuizControl;
  };
  const readPaper = (data: unknown) => {
    if (!data) reject('考卷尚未開放');
    return data as Paper;
  };
  const identifiers = (data: any) => {
    const courseId = data?.courseId;
    const sittingId = data?.sittingId;
    if (typeof courseId !== 'string' || !safeCode(courseId) ||
        typeof sittingId !== 'string' || !quizSittingId.test(sittingId))
      reject('課程或小考代碼格式錯誤', 'invalid-argument');
    return { courseId, sittingId, ref: refFor(courseId, sittingId) };
  };
  const qualify = (p: any, quiz: QuizControl, session?: Session) => {
    if (p.teacher || p.classId !== quiz.classId || !studentKey(p.studentId) || (session && session.uid !== p.uid))
      reject('此小考未開放給你的帳號', 'permission-denied');
  };
  const inRound = (quiz: QuizControl, studentId: string) => !quiz.round || quiz.makeupIds.includes(studentId);
  const studentDeadline = (quiz: QuizControl, studentId: string) => quiz.deadline + (quiz.extensions[studentId] || 0) * 1000;

  function mirrorControl(tx: Transaction, ref: DocumentReference, quiz: QuizControl) {
    tx.set(ref, quiz);
    tx.set(monitorFor(ref), {
      state: quiz.state, ctl: quiz.ctl, round: quiz.round, deadline: quiz.deadline,
      finalDeadline: quiz.finalDeadline, makeupIds: quiz.makeupIds,
    }, { merge: true });
    tx.set(signalFor(quiz), { sittingId: ref.id, state: quiz.state, deadline: quiz.deadline });
  }

  function monitorFailure() {
    logger.warn('Platform quiz monitor write deferred');
  }
  // Each student writes independent fields. A delayed start cannot overwrite the submitted field.
  async function mirrorSession(ref: DocumentReference, session: Session) {
    const field = new FieldPath('students', session.studentId, session.state === 'active' ? 'startedRound' : 'submittedRound');
    await monitorFor(ref).update(field, session.round).catch(monitorFailure);
  }

  function sessionView(
    ref: DocumentReference, quiz: QuizControl, session: Session | undefined, paper: Paper | undefined,
    moodRecorded: boolean, moodEnabled: boolean, studentId: string,
  ): QuizStudentView {
    const now = Date.now();
    const deadline = studentDeadline(quiz, studentId);
    const canStart = quiz.state === 'open' && now < quiz.deadline && inRound(quiz, studentId) && !session;
    const out: QuizStudentView = {
      sittingId: ref.id, title: quiz.title, label: quiz.label, state: quiz.state, round: quiz.round,
      serverAt: now, deadline, count: quiz.itemCount, canStart,
    };
    if (!session) return out;
    const visibleState = session.state === 'active' && (quiz.state !== 'open' || now >= deadline || session.round !== quiz.round)
      ? 'expired' : session.state;
    out.round = session.round;
    out.session = { state: visibleState, seq: session.seq, answers: session.answers };
    if (visibleState === 'active' && paper) out.questions = orderedQuestions(paper, session.order);
    const released = session.round <= quiz.releasedRound && session.state !== 'active';
    const moodRequired = moodEnabled && session.moodRequired && !moodRecorded &&
      (session.state === 'submitted' || (released && now < (quiz.releasedAtByRound?.[session.round] || quiz.releasedAt) + MOOD_WINDOW));
    if (moodRequired) out.moodRequired = true;
    if (released && !moodRequired && paper) {
      const row = grade(paper, session);
      const answer = new Map(paper.items.map((item) => [item.questionId, item.answer]));
      out.result = {
        score: row.score, max: paper.score * quiz.itemCount, correct: row.correct, makeup: row.makeup || 0,
        extendedSeconds: row.extendedSeconds || 0,
        questions: orderedQuestions(paper, session.order).map((question) => ({
          ...question, answer: answer.get(question.id)!, explanation: paper.explanations[question.id] || '',
          selected: session.answers[question.id] || '',
        })),
      };
    }
    return out;
  }

  const quizGet = onCall(options, async (req) => {
    const { ref, courseId, sittingId } = identifiers(req.data);
    const { p, c } = await authenticate(req, courseId);
    const quiz = readQuiz((await ref.get()).data());
    qualify(p, quiz);
    const session = (await sessionFor(ref, p.studentId).get()).data() as Session | undefined;
    qualify(p, quiz, session);
    if (quiz.state === 'prepared' || (quiz.round > 0 && !session && !inRound(quiz, p.studentId)))
      reject('此小考尚未開放給你的帳號');
    const [paper, mood] = session ? await Promise.all([paperFor(ref).get(), moodFor(quiz, sittingId, p.uid).get()]) : [];
    return sessionView(ref, quiz, session, paper?.data() as Paper | undefined, !!mood?.exists, c.features?.zuvioMood === true, p.studentId);
  });

  const quizStart = onCall(options, async (req) => {
    const { ref, courseId, sittingId } = identifiers(req.data);
    const { p, c } = await authenticate(req, courseId);
    if (!studentKey(p.studentId)) reject('名冊身分有誤', 'permission-denied');
    const requestedRound = boundedInt(req.data.round, 0, LIMITS.students);
    const sr = sessionFor(ref, p.studentId);
    const paper = readPaper((await paperFor(ref).get()).data());
    const order = frozenOrder(paper);
    const roster = (await rosterFor(ref).get()).data()?.ids as string[] | undefined;
    const { quiz, session } = await db.runTransaction(async (tx) => {
      const [control, stored] = await tx.getAll(ref, sr);
      const quiz = readQuiz(control.data());
      const current = stored.data() as Session | undefined;
      qualify(p, quiz, current);
      if (quiz.round !== requestedRound) reject('場次輪次已更新，請重新檢查', 'aborted');
      if (current?.round === requestedRound) return { quiz, session: current };
      if (current || quiz.state !== 'open' || !inRound(quiz, p.studentId) || !roster?.includes(p.studentId) || Date.now() >= quiz.deadline)
        reject('此輪已停止接受作答，或未開放給你');
      const session: Session = {
        uid: p.uid, studentId: p.studentId, classId: p.classId, round: quiz.round,
        startedAt: Date.now(), order, answers: {}, seq: 0, state: 'active', moodRequired: c.features?.zuvioMood === true,
      };
      tx.create(sr, session);
      return { quiz, session };
    });
    await mirrorSession(ref, session);
    const mood = session.state !== 'active' && (await moodFor(quiz, sittingId, p.uid).get()).exists;
    return sessionView(ref, quiz, session, paper, mood, c.features?.zuvioMood === true, p.studentId);
  });

  const quizSave = onCall(options, async (req) => {
    const { ref, courseId, sittingId } = identifiers(req.data);
    const { p, c } = await authenticate(req, courseId);
    if (!studentKey(p.studentId)) reject('名冊身分有誤', 'permission-denied');
    const round = boundedInt(req.data.round, 0, LIMITS.students);
    const seq = boundedInt(req.data.seq, 1, Number.MAX_SAFE_INTEGER);
    const submit = req.data.submit === true;
    const automatic = req.data.automatic === true && submit;
    const sr = sessionFor(ref, p.studentId);
    const { quiz, session } = await db.runTransaction(async (tx) => {
      const [control, stored] = await tx.getAll(ref, sr);
      const quiz = readQuiz(control.data());
      const session = stored.data() as Session | undefined;
      qualify(p, quiz, session);
      if (quiz.round !== round || (session && session.round !== round)) reject('場次輪次已更新，請重新檢查', 'aborted');
      if (!session) reject('請先開始小考');
      if (session.state !== 'active') return { quiz, session };
      const now = Date.now();
      if (quiz.state !== 'open') reject('這一輪已結束，正在結算');
      const deadline = studentDeadline(quiz, p.studentId);
      if (now >= deadline) {
        if (!automatic) reject('作答時間已到，使用最後一次存檔');
        const expired: Session = {
          ...session, state: 'expired', submittedAt: now,
          extendedSeconds: quiz.extensions[p.studentId] || 0,
        };
        tx.set(sr, expired);
        return { quiz, session: expired };
      }
      if (automatic) return { quiz, session }; // A teacher may have just extended this student's time.
      if (seq <= session.seq) {
        if (submit) reject('答案已在另一個畫面更新，請重新確認', 'aborted');
        return { quiz, session };
      }
      const next: Session = {
        ...session, seq, answers: validAnswers(session.order, req.data.answers),
        ...(submit ? { state: 'submitted' as const, submittedAt: now, extendedSeconds: quiz.extensions[p.studentId] || 0 } : {}),
      };
      tx.set(sr, next);
      return { quiz, session: next };
    });
    const finished = session.state !== 'active';
    if (finished) await mirrorSession(ref, session);
    const mood = finished && (await moodFor(quiz, sittingId, p.uid).get()).exists;
    const view = sessionView(ref, quiz, session, undefined, mood, c.features?.zuvioMood === true, p.studentId);
    return { ...view, savedSeq: session.seq };
  });

  const quizMood = onCall(options, async (req) => {
    const { ref, courseId, sittingId } = identifiers(req.data);
    const { p, c } = await authenticate(req, courseId);
    if (!c.features?.zuvioMood || !studentKey(p.studentId)) reject('此課程未開放情緒簽到', 'permission-denied');
    const mood = req.data.mood as MoodCode;
    if (!MOOD_CODES.includes(mood)) reject('請選擇情緒狀態', 'invalid-argument');
    const selected = await db.runTransaction(async (tx) => {
      const [control, stored] = await tx.getAll(ref, sessionFor(ref, p.studentId));
      const quiz = readQuiz(control.data());
      const session = stored.data() as Session | undefined;
      qualify(p, quiz, session);
      if (!session) reject('請先交卷');
      const moodRef = moodFor(quiz, sittingId, p.uid);
      const old = await tx.get(moodRef);
      if (old.exists) return old.data()!.mood as MoodCode;
      if (!sessionView(ref, quiz, session, undefined, false, true, p.studentId).moodRequired)
        reject('情緒簽到時間已結束或尚未交卷');
      tx.create(moodRef, { uid: p.uid, classId: p.classId, studentId: p.studentId, mood, submittedAt: Date.now() });
      return mood;
    });
    return { mood: selected, feedback: MOOD_BY_CODE[selected].feedback };
  });

  const quizLeave = onCall(options, async (req) => {
    const { ref, courseId } = identifiers(req.data);
    const { p } = await authenticate(req, courseId);
    if (!studentKey(p.studentId)) reject('名冊身分有誤', 'permission-denied');
    const round = boundedInt(req.data.round, 0, LIMITS.students);
    const episode = boundedInt(req.data.episode, 1, 120);
    const kind = req.data.kind;
    const visit = req.data.visit;
    if ((kind !== 'leave' && kind !== 'return') || typeof visit !== 'string' || !quizSittingId.test(visit))
      reject('離開紀錄格式有誤', 'invalid-argument');
    const seconds = kind === 'return' ? boundedInt(req.data.seconds, 0, MAX_SECONDS) : undefined;
    const doc = ref.collection('events').doc(String(round) + '_' + p.studentId + '_' + visit + '_' + episode + '_' + kind);
    const [control, stored] = await db.getAll(ref, sessionFor(ref, p.studentId));
    const quiz = readQuiz(control.data());
    const session = stored.data() as Session | undefined;
    qualify(p, quiz, session);
    if (!session || round !== session.round || round !== quiz.round) reject('此輪作答已結束', 'aborted');
    if (quiz.state !== 'open' || session.state !== 'active') return { ok: true };
    const event: QuizLeaveEvent & { visit: string } = {
      studentId: p.studentId, round, episode, kind, at: Date.now(), visit, ...(seconds === undefined ? {} : { seconds }),
    };
    try {
      await doc.create(event);
    } catch (error) {
      if ((error as { code?: number }).code !== 6) throw error;
    }
    return { ok: true };
  });

  async function finish(ref: DocumentReference, quiz: QuizControl) {
    // Once closing, this round's answers and deadlines are immutable.
    const exam = examFor(quiz);
    const [paperDoc, all] = await Promise.all([paperFor(ref).get(), ref.collection('sessions').get()]);
    const paper = readPaper(paperDoc.data());
    const finished = all.docs.map((doc) => {
      const session = doc.data() as Session;
      if (session.state !== 'active') return { doc, session, changed: false };
      return {
        doc, changed: true,
        session: {
          ...session, state: 'expired' as const, submittedAt: quiz.closedAt,
          extendedSeconds: quiz.extensions[session.studentId] || 0,
        },
      };
    });
    const changed = finished.filter((row) => row.changed);
    if (changed.length) {
      const batch = db.batch();
      for (const { doc, session } of changed) batch.set(doc.ref, session);
      await batch.commit();
    }
    const rows = finished.map(({ session }) => grade(paper, session));
    const gen = randomUUID();
    const now = Date.now();
    const priorRevision = await db.runTransaction(async (tx) => {
      const [currentDoc, examDoc] = await tx.getAll(ref, exam);
      const current = readQuiz(currentDoc.data());
      if (current.state !== 'closing' || current.round !== quiz.round || current.ctl !== quiz.ctl) return null;
      const examData = examDoc.data();
      const sitting = examData?.sittings.find((s: any) => s.id === ref.id);
      if (!sitting) reject('找不到場次');
      const revision = (sitting.results?.revision || 0) + 1;
      for (const row of rows)
        tx.set(exam.collection('results').doc(gen + '_' + row.studentId), { ...row, sittingId: ref.id, gen, revision });
      const counts = { notInRoster: 0, disabled: 0, wrongClass: 0, needTextId: 0, duplicate: 0 };
      const results = { gen, revision, matched: rows.length, importedAt: now, counts, average: rows.length
        ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length : null };
      tx.update(exam, { sittings: examData!.sittings.map((s: any) => s.id === ref.id
        ? { ...s, results, platformState: 'released', round: quiz.round } : s) });
      tx.set(exam.collection('analysis').doc(ref.id), hooks.analysis(paper, rows, revision, gen, now));
      mirrorControl(tx, ref, { ...current, state: 'released', ctl: current.ctl + 1, releasedRound: current.round, releasedAt: now,
        releasedAtByRound: { ...current.releasedAtByRound, [current.round]: now },
      });
      return revision;
    });
    if (priorRevision !== null) {
      if (priorRevision > 1) await hooks.cleanup(exam, ref.id, priorRevision).catch(() => logger.warn('Platform quiz result cleanup deferred'));
    }
  }

  async function preparePaper(ref: DocumentReference, quiz: QuizControl, course: any) {
    const exam = (await examFor(quiz).get()).data();
    if (!exam || exam.answerMode !== 'platform' || exam.archived) reject('找不到可用的考卷');
    const [paper, roster] = await Promise.all([
      hooks.paper(quiz.courseId, exam, course),
      hooks.roster(quiz.courseId, course, [quiz.classId]),
    ]);
    if (roster.length > LIMITS.students || roster.some((row) => !studentKey(row.studentId)) ||
        new Set(roster.map((row) => row.studentId)).size !== roster.length)
      reject('名冊學號無效、重複或超過場次人數上限');
    if (!roster.length) reject('這一班沒有可作答的學生');
    if (Buffer.byteLength(JSON.stringify(paper), 'utf8') > 800_000) reject('考卷過大，請減少題數');
    return { paper, roster };
  }

  async function closeDue(ref: DocumentReference, version: number) {
    const quiz = await db.runTransaction(async (tx) => {
      const quiz = readQuiz((await tx.get(ref)).data());
      if (quiz.state === 'closing') return quiz;
      if (quiz.state !== 'open' || quiz.ctl !== version || quiz.finalDeadline > Date.now()) return null;
      const closing: QuizControl = { ...quiz, state: 'closing', ctl: quiz.ctl + 1, closedAt: Date.now() };
      mirrorControl(tx, ref, closing);
      return closing;
    });
    if (quiz) await finish(ref, quiz);
  }

  const quizExpireDue = onSchedule({ ...options, schedule: 'every 1 minutes', timeZone: 'Asia/Taipei' }, async () => {
    const active = await db.collectionGroup('platformQuizzes').where('state', 'in', ['open', 'closing']).get();
    const due = active.docs.filter((doc) => doc.data().state === 'closing' || doc.data().finalDeadline <= Date.now());
    const outcomes = await Promise.allSettled(due.map((doc) => closeDue(doc.ref, doc.data().ctl)));
    if (outcomes.some((outcome) => outcome.status === 'rejected')) throw Error('部分小考尚未結算，下一輪會重試');
  });

  const quizTeacherGet = onCall(options, async (req) => {
    const { courseId, ref } = identifiers(req.data);
    const { c } = await authenticate(req, courseId, true);
    const quiz = readQuiz((await ref.get()).data());
    if (quiz.state !== 'prepared') {
      const monitor = (await monitorFor(ref).get()).data() as QuizMonitor;
      const rows = await ref.collection('sessions').get();
      const sessions = rows.docs.map((doc) => doc.data() as Session);
      // The live projection is best effort. Opening the screen repairs any missed projection from the source data.
      for (const session of sessions) {
        const shown = monitor.students[session.studentId];
        if (!shown) continue;
        const complete = session.state !== 'active' || session.round <= quiz.releasedRound;
        if ((complete ? shown.submittedRound : shown.startedRound) !== session.round) {
          if (quiz.state === 'open' && session.round === quiz.round) await monitorFor(ref).update(
            new FieldPath('students', session.studentId, complete ? 'submittedRound' : 'startedRound'), session.round,
          ).catch(monitorFailure);
        }
        shown.startedRound ??= session.round;
        if (complete) shown.submittedRound = session.round;
      }
      const paper = quiz.releasedRound >= 0 ? readPaper((await paperFor(ref).get()).data()) : null;
      const scores = paper ? sessions.filter((session) => session.round <= quiz.releasedRound)
        .map((session) => {
          const { studentId, score, makeup, extendedSeconds, blankStart } = grade(paper, session);
          return { studentId, score, makeup: makeup || 0, extendedSeconds: extendedSeconds || 0, blankStart: !!blankStart };
        }) : [];
      return { quiz, monitor, scores };
    }
    const roster = await hooks.roster(courseId, c, [quiz.classId]);
    return { quiz, monitor: {
      state: quiz.state, round: quiz.round, ctl: quiz.ctl, deadline: 0, finalDeadline: 0,
      makeupIds: [], prep: 'none', students: Object.fromEntries(roster.map((row) => [row.studentId, { name: row.name || '未登記姓名' }])),
    } satisfies QuizMonitor };
  });

  const quizControl = onCall(options, async (req) => {
    const { ref, courseId } = identifiers(req.data);
    const { p, c } = await authenticate(req, courseId, true);
    const action = req.data.action;
    if (!['duration', 'announce', 'open', 'extend', 'extendStudent', 'end', 'makeup'].includes(action))
      reject('操作無效', 'invalid-argument');
    const expected = boundedInt(req.data.ctl, 0, Number.MAX_SAFE_INTEGER);
    const before = readQuiz((await ref.get()).data());
    if (!c.published?.classIds?.includes(before.classId)) reject('班級已不在發布名冊');
    const openingPaper = action === 'announce' && before.state === 'prepared'
      ? await preparePaper(ref, before, c) : null;
    const next = await db.runTransaction(async (tx) => {
      const [stored, examDoc, courseDoc] = await tx.getAll(ref, examFor(before), db.collection('courses').doc(courseId));
      const current = readQuiz(stored.data());
      const exam = examDoc.data();
      if (!exam || exam.answerMode !== 'platform' || exam.archived || !courseDoc.data()?.teacherIds?.includes(p.uid) ||
          !courseDoc.data()?.features?.zuvioExams || !courseDoc.data()?.published?.classIds?.includes(current.classId))
        reject('考卷、班級或管理權限已變更');
      if (action === 'end' && (current.state === 'closing' || current.state === 'released') && req.data.round === current.round)
        return current;
      if (current.ctl !== expected) reject('小考狀態已更新，請重新整理', 'aborted');
      const now = Date.now();
      const quiz = { ...current, ctl: current.ctl + 1 };
      const target = exam.sittings.find((s: any) => s.id === ref.id);
      if (!target) reject('找不到場次');
      const state = current.state;
      if (req.data.round !== current.round) reject('場次輪次已更新，請重新整理', 'aborted');
      if (action === 'duration') {
        if (state !== 'prepared' && state !== 'announced') reject('作答已經開始');
        quiz.baseSeconds = boundedInt(req.data.seconds, 1, MAX_SECONDS);
      } else if (action === 'announce' || action === 'open' || action === 'makeup') {
        const scope = db.collection('quizSignalScopes').doc(signalFor(quiz).id);
        const [active, scopeDoc, rosterDoc] = await tx.getAll(signalFor(quiz), scope, rosterFor(ref));
        const signal = active.data();
        if (scopeDoc.exists && (scopeDoc.data()?.courseId !== courseId || scopeDoc.data()?.classId !== quiz.classId))
          reject('此班級的小考訊號代碼與其他課程衝突');
        if (signal?.sittingId !== ref.id && ['announced', 'open', 'closing'].includes(signal?.state))
          reject('這班已有另一場小考');
        if (action === 'makeup') {
          if (state !== 'released') reject('請等目前場次批改完成');
          const ids: unknown = req.data.studentIds;
          if (!Array.isArray(ids) || !ids.length || ids.length > LIMITS.students ||
              ids.some((id) => !studentKey(id) || !rosterDoc.data()?.ids?.includes(id)) || new Set(ids).size !== ids.length)
            reject('請選擇本場缺考學生', 'invalid-argument');
          const existing = await tx.getAll(...ids.map((id) => sessionFor(ref, id)));
          if (existing.some((doc) => doc.exists)) reject('只能選擇未開始過的學生');
          quiz.round++;
          quiz.makeupIds = [...ids];
          quiz.extensions = {};
          quiz.extendSeconds = 0;
        } else if ((action === 'announce' && state !== 'prepared') || (action === 'open' && state !== 'announced')) {
          reject('本場狀態無法再次公告或開放');
        }
        if (state === 'prepared' && !openingPaper) reject('請重新準備考卷', 'aborted');
        if (openingPaper) {
          tx.set(paperFor(ref), openingPaper.paper);
          tx.set(rosterFor(ref), { ids: openingPaper.roster.map((row) => row.studentId) });
          tx.set(monitorFor(ref), {
            prep: 'none',
            students: Object.fromEntries(openingPaper.roster.map((row) => [row.studentId, { name: row.name || '未登記姓名' }])),
          }, { merge: true });
        }
        if (!scopeDoc.exists) tx.create(scope, { courseId, classId: quiz.classId });
        quiz.state = action === 'announce' ? 'announced' : 'open';
        if (quiz.state === 'open') {
          quiz.openedAt = now;
          quiz.deadline = now + quiz.baseSeconds * 1000;
          quiz.finalDeadline = quiz.deadline;
          if (!quiz.round && c.features?.zuvioMood)
            tx.set(monitorFor(ref), { prep: 'pending' }, { merge: true });
        }
      } else {
        if (state !== 'open') reject('這一輪目前未開放');
        if (action === 'end') {
          quiz.state = 'closing';
          quiz.closedAt = now;
        } else {
          const seconds = boundedInt(req.data.seconds, 1, 3600);
          if (action === 'extendStudent') {
            const studentId = req.data.studentId;
            if (!studentKey(studentId)) reject('請選擇學生', 'invalid-argument');
            const session = (await tx.get(sessionFor(ref, studentId))).data() as Session | undefined;
            if (session?.state !== 'active' || session.round !== quiz.round || now >= studentDeadline(current, studentId))
              reject('這位學生已停止作答');
            quiz.extensions = { ...quiz.extensions, [studentId]: boundedInt((quiz.extensions[studentId] || 0) + seconds, 1, MAX_SECONDS) };
            tx.update(monitorFor(ref), new FieldPath('students', studentId, 'extendedSeconds'), quiz.extensions[studentId]);
          } else {
            if (now >= current.deadline) reject('全班作答時間已到');
            quiz.extendSeconds = boundedInt(quiz.extendSeconds + seconds, 1, MAX_SECONDS);
            quiz.deadline += seconds * 1000;
          }
          quiz.finalDeadline = quiz.deadline + Math.max(0, ...Object.values(quiz.extensions)) * 1000;
        }
      }
      tx.update(examFor(quiz), { sittings: exam.sittings.map((s: any) => s.id === ref.id
        ? { ...s, platformState: quiz.state, round: quiz.round, ...(!quiz.round && action === 'open' ? { startsAt: now } : {}) } : s) });
      if (quiz.state === 'prepared') tx.set(ref, quiz); // Do not notify students in other sittings about draft-only changes.
      else mirrorControl(tx, ref, quiz);
      return quiz;
    });
    if (next.state === 'closing') await finish(ref, next);
    if (action === 'open' && next.round === 0 && c.features?.zuvioMood) {
      try {
        const exam = examFor(next);
        const ec = (await exam.get()).data()!;
        const sitting = ec.sittings.find((s: any) => s.id === ref.id);
        const prep = await hooks.prep(courseId, c, exam, sitting, ec.items.map((it: any) => it.unitId), ec.items.map((it: any) => it.questionId));
        await monitorFor(ref).set({ prep: prep.incomplete ? 'incomplete' : 'complete' }, { merge: true });
      } catch {
        await monitorFor(ref).set({ prep: 'incomplete' }, { merge: true }).catch(monitorFailure);
      }
    }
    return { ok: true };
  });

  return { quizGet, quizStart, quizSave, quizMood, quizLeave, quizTeacherGet, quizControl, quizExpireDue };
}

export function assertQuizClassSeparation(classIds: string[]) {
  if (classIds.some(isTestClass) && classIds.some((id) => !isTestClass(id)))
    reject('測試班與正式班必須分開出題');
}
