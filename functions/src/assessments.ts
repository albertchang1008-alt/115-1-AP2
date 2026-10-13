import { featureAccess } from './features';
import { Firestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { randomInt, randomUUID } from 'node:crypto';
import { Question, safeId, validateQuestions } from '../../shared/model';
import { ExamKind, examAnswers, examGrade, publicExamQuestion } from '../../shared/assessment';

function fail(message: string): never {
  throw new HttpsError('failed-precondition', message);
}
const kinds: ExamKind[] = ['pretest', 'posttest'];
const shuffle = <T>(items: T[]) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
export function reservedQuestionIds(c: any): Set<string> {
  return new Set(kinds.flatMap((k) => (c.assessmentSources?.[k] || []) as string[]));
}
export function assertPracticeBank(c: any, unitId: string, questionIds: string[]) {
  if (
    (c.assessmentSourceUnits || []).includes(unitId) ||
    questionIds.some((x) => reservedQuestionIds(c).has(x))
  )
    fail('正式前後測題目不可透過一般練習取得或交卷');
}
export async function storeAssessmentSources(
  db: Firestore,
  courseId: string,
  c: any,
  units: Map<string, { group?: string; questions: Question[] }>,
) {
  const reserved = reservedQuestionIds(c);
  if (!reserved.size) return;
  const all = [...units.values()].flatMap((x) => x.questions);
  const sourceUnits = [...units]
    .filter(([, v]) => v.questions.length && v.questions.every((q) => reserved.has(q.id)))
    .map(([id]) => id);
  for (const kind of kinds) {
    const ids = c.assessmentSources[kind] as string[];
    const questions = ids.map((id) => all.find((q) => q.id === id));
    if (questions.some((q) => !q) || !ids.length || ids.length > 100 || new Set(ids).size !== ids.length)
      fail('前後測來源必須各有 1–100 題且 ID 不重複，請核對題目 ID');
    const errors = validateQuestions(questions as Question[]);
    if (errors.length) fail(errors.join('；'));
    await db
      .doc(`courses/${courseId}/assessmentSources/${kind}`)
      .set({ questions, updatedAt: Date.now() });
  }
  await db.doc(`courses/${courseId}`).update({ assessmentSourceUnits: sourceUnits });
  for (const [unitId, v] of units) {
    v.questions = v.questions.filter((q) => !reserved.has(q.id));
    if (!v.questions.length) units.delete(unitId);
  }
}

export function createAssessmentHandlers(
  db: Firestore,
  access: (req: any, id: string, teacher?: boolean) => Promise<any>,
  options: any,
) {
  access = featureAccess(access, 'assessments');
  const root = (courseId: string) => db.collection(`courses/${courseId}/assessments`);
  const locate = (req: any) => {
    const examId = req.data?.examId;
    if (typeof examId !== 'string' || !safeId(examId)) fail('測驗識別碼格式錯誤');
    return root(req.data.courseId).doc(examId);
  };
  const checkClass = (p: any, e: any) => {
    if (!p.teacher && !e.classIds.includes(p.classId))
      throw new HttpsError('permission-denied', '測驗未開放給此班級');
  };
  const finish = (s: any, e: any, at: number, reason: string) => ({
    ...s,
    state: 'submitted',
    submittedAt: at,
    reason,
    ...examGrade(e.questions, s.answers),
  });
  const expired = (s: any, e: any, at: number) =>
    s.state === 'active' && (at >= s.expiresAt || e.state === 'closed');
  const dto = (e: any, s: any, at: number) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    classIds: e.classIds,
    state: e.state,
    durationSeconds: e.durationSeconds,
    controlMode: 'manual',
    createdAt: e.createdAt,
    ...(e.openedAt ? { openedAt: e.openedAt } : {}),
    ...(e.closedAt ? { closedAt: e.closedAt } : {}),
    released: e.released,
    total: e.questions.length,
    serverAt: at,
    ...(s
      ? {
          session: {
            state: s.state,
            startedAt: s.startedAt,
            expiresAt: s.expiresAt,
            revision: s.revision,
            answers: s.answers,
            ...(s.state === 'submitted'
              ? {
                  submittedAt: s.submittedAt,
                  reason: s.reason,
                  ...(e.released ? { correct: s.correct, total: s.total, score: s.score } : {}),
                }
              : {}),
            ...(s.state === 'active' ? { questions: s.questions } : {}),
          },
        }
      : {}),
    ...(e.released && s?.state === 'submitted'
      ? {
          results: e.questions.map((q: Question) => ({
            ...publicExamQuestion(q),
            selected: s.answers[q.id] || '',
            answer: q.answer,
            explanation: q.explanation,
          })),
        }
      : {}),
  });
  const audit = (tx: any, ref: any, uid: string, action: string, at: number, details: any = {}) =>
    tx.set(ref.collection('audit').doc(randomUUID()), { uid, action, at, ...details });
  const getAssessments = onCall(options, async (req) => {
    const { p } = await access(req, req.data.courseId);
    const docs = await root(req.data.courseId).get();
    const now = Date.now();
    const rows = [];
    for (const d of docs.docs) {
      const e = d.data();
      if (!p.teacher && !e.classIds.includes(p.classId)) continue;
      const ref = d.ref.collection('assessmentSessions').doc(p.uid);
      const s = await db.runTransaction(async (tx) => {
        const [es, ss] = await Promise.all([tx.get(d.ref), tx.get(ref)]);
        const current = es.data()!,
          session = ss.data();
        if (session && expired(session, current, now)) {
          const done = finish(session, current, now, 'timeout');
          tx.set(ref, done);
          return done;
        }
        return session;
      });
      rows.push(dto(e, s, now));
    }
    return { assessments: rows };
  });
  const prepareAssessment = onCall(options, async (req) => {
    const { p, c } = await access(req, req.data.courseId, true);
    const { kind, classIds } = req.data;
    if (
      !kinds.includes(kind) ||
      !Array.isArray(classIds) ||
      !classIds.length ||
      classIds.some((id: any) => !c.draft.classIds.includes(id))
    )
      fail('請選擇測驗及課程班級');
    const source = (
      await db.doc(`courses/${req.data.courseId}/assessmentSources/${kind}`).get()
    ).data();
    if (!source?.questions?.length || source.questions.length > 100) fail('請先同步完整題庫的前後測來源');
    const examId = kind + '-' + randomUUID(),
      at = Date.now(),
      ref = root(req.data.courseId).doc(examId);
    const makeupOf = req.data.makeupOf || '',
      reason = String(req.data.reason || '').trim();
    if (makeupOf && (!safeId(makeupOf) || !reason)) fail('補考需指定原測驗並填理由');
    const others = await root(req.data.courseId).get();
    const target = others.docs.find((d) => d.id === makeupOf);
    if (makeupOf && (!target || target.data().kind !== kind)) fail('補考原測驗不存在或種類不同');
    if (
      !makeupOf &&
      others.docs.some(
        (d) =>
          d.data().kind === kind &&
          !d.data().makeupOf &&
          d.data().classIds.some((x: string) => classIds.includes(x)),
      )
    )
      fail('本班已有正式測驗；補考請指定原測驗及理由');
    await db.runTransaction(async (tx) => {
      const cr = db.doc(`courses/${req.data.courseId}`);
      const locked = await tx.get(cr);
      const active = await tx.get(root(req.data.courseId));
      if (
        !makeupOf &&
        active.docs.some(
          (d) =>
            d.data().kind === kind &&
            !d.data().makeupOf &&
            d.data().classIds.some((x: string) => classIds.includes(x)),
        )
      )
        fail('本班已有正式測驗；補考請指定原測驗及理由');
      if (!locked.data()?.teacherIds?.includes(p.uid)) fail('課程權限已變更');
      tx.create(ref, {
        id: examId,
        kind,
        title: kind === 'pretest' ? '前測' : '後測',
        classIds: [...new Set(classIds)],
        controlMode: 'manual',
        durationSeconds: 480,
        state: 'prepared',
        released: false,
        questions: source.questions,
        createdAt: at,
        createdBy: p.uid,
        makeupOf,
        reason,
      });
      tx.update(cr, { assessmentUpdatedAt: at });
      audit(tx, ref, p.uid, 'prepare', at);
    });
    return { id: examId };
  });
  const controlAssessment = onCall(options, async (req) => {
    const { p } = await access(req, req.data.courseId, true);
    const ref = locate(req),
      action = req.data.action,
      at = Date.now();
    if (!['open', 'close', 'release'].includes(action)) fail('操作無效');
    // Use a course-level lock as well as the exam lock: opening and releasing cannot race.
    return db.runTransaction(async (tx) => {
      const cr = db.doc(`courses/${req.data.courseId}`),
        course = await tx.get(cr),
        all = await tx.get(root(req.data.courseId));
      if (!course.data()?.teacherIds?.includes(p.uid)) fail('課程權限已變更');
      const e = all.docs.find((d) => d.id === ref.id)?.data();
      if (!e) fail('測驗不存在');
      if (action === 'open') {
        if (e.state !== 'prepared') fail('測驗已開放或已結束');
        if (
          e.kind === 'posttest' &&
          e.classIds.some(
            (cl: string) =>
              !all.docs.some(
                (d) =>
                  d.data().kind === 'pretest' &&
                  d.data().classIds.includes(cl) &&
                  d.data().state === 'closed',
              ) ||
              all.docs.some(
                (d) =>
                  d.data().kind === 'pretest' &&
                  d.data().classIds.includes(cl) &&
                  d.data().state !== 'closed',
              ),
          )
        )
          fail('請先結束本班前測');
        if (
          all.docs.some(
            (d) =>
              d.data().released && d.data().classIds.some((cl: string) => e.classIds.includes(cl)),
          )
        )
          fail('本班已公布答案，無法再開放使用相同來源的測驗');
        tx.update(ref, { state: 'open', openedAt: at, controlMode: 'manual' });
      } else if (action === 'close') {
        if (e.state === 'closed') return { ok: true };
        tx.update(ref, { state: 'closed', closedAt: at });
      } else {
        if (e.state !== 'closed') fail('請先結束測驗');
        const post = all.docs.filter(
          (d) =>
            d.data().kind === 'posttest' &&
            d.data().classIds.some((cl: string) => e.classIds.includes(cl)),
        );
        if (
          !post.length ||
          post.some((d) => d.data().state !== 'closed') ||
          all.docs.some(
            (d) =>
              d.data().state === 'open' &&
              d.data().classIds.some((cl: string) => e.classIds.includes(cl)),
          )
        )
          fail('本班所有後測結束後才可公布成績與解析');
        tx.update(ref, { released: true, releasedAt: at });
      }
      tx.update(cr, { assessmentUpdatedAt: at });
      audit(tx, ref, p.uid, action, at);
      return { ok: true };
    });
  });
  const startAssessment = onCall(options, async (req) => {
    const { p } = await access(req, req.data.courseId);
    if (p.teacher) fail('教師請使用試卷預覽，不建立正式作答');
    const ref = locate(req),
      sr = ref.collection('assessmentSessions').doc(p.uid);
    return db.runTransaction(async (tx) => {
      const [es, ss] = await Promise.all([tx.get(ref), tx.get(sr)]),
        e = es.data();
      if (!e) fail('測驗不存在');
      checkClass(p, e);
      let s = ss.data();
      const at = Date.now();
      if (s) {
        if (expired(s, e, at)) {
          s = finish(s, e, at, 'timeout');
          tx.set(sr, s);
        }
        return dto(e, s, at);
      }
      if (e.state !== 'open') fail('測驗尚未開放或已結束');
      s = {
        uid: p.uid,
        classId: p.classId,
        studentId: p.studentId || '',
        name: p.name || '',
        state: 'active',
        startedAt: at,
        expiresAt: at + e.durationSeconds * 1000,
        revision: 0,
        answers: {},
        questions: e.questions.map((q: Question) => ({
          ...publicExamQuestion(q),
          options: shuffle(q.options).map((o) => ({ id: o.id, text: o.text })),
        })),
      };
      tx.create(sr, s);
      return dto(e, s, at);
    });
  });
  const saveAssessment = onCall(options, async (req) => {
    const { p } = await access(req, req.data.courseId);
    if (p.teacher) fail('預覽不能寫入成績');
    const ref = locate(req),
      sr = ref.collection('assessmentSessions').doc(p.uid);
    return db.runTransaction(async (tx) => {
      const [es, ss] = await Promise.all([tx.get(ref), tx.get(sr)]),
        e = es.data();
      let s = ss.data();
      const at = Date.now();
      if (!e || !s) fail('請先開始測驗');
      checkClass(p, e);
      if (expired(s, e, at)) {
        s = finish(s, e, at, 'timeout');
        tx.set(sr, s);
        return dto(e, s, at);
      }
      if (s.state === 'submitted') return dto(e, s, at);
      if (!Number.isInteger(req.data.revision) || req.data.revision !== s.revision)
        throw new HttpsError('aborted', '作答已在另一個視窗更新，請重新載入');
      let answers;
      try {
        answers = examAnswers(e.questions, req.data.answers);
      } catch (err) {
        fail((err as Error).message);
      }
      s = { ...s, answers, revision: s.revision + 1, savedAt: at };
      if (req.data.submit === true) s = finish(s, e, at, 'manual');
      tx.set(sr, s);
      return dto(e, s, at);
    });
  });
  const previewAssessment = onCall(options, async (req) => {
    await access(req, req.data.courseId, true);
    const e = (await locate(req).get()).data();
    if (!e) fail('測驗不存在');
    return { questions: e.questions, title: e.title };
  });
  const assessmentReport = onCall(options, async (req) => {
    await access(req, req.data.courseId, true);
    const exams = await root(req.data.courseId).get();
    const sessions = [];
    for (const d of exams.docs) {
      const e = d.data(),
        rows = await d.ref.collection('assessmentSessions').get();
      for (const row of rows.docs) {
        const s = await db.runTransaction(async (tx) => {
          const [current, exam] = await Promise.all([tx.get(row.ref), tx.get(d.ref)]);
          const s = current.data()!,
            e = exam.data()!;
          if (expired(s, e, Date.now())) {
            const done = finish(s, e, Date.now(), 'timeout');
            tx.set(row.ref, done);
            return done;
          }
          return s;
        });
        sessions.push({
          examId: e.id,
          kind: e.kind,
          makeupOf: e.makeupOf,
          classId: s.classId,
          uid: s.uid,
          studentId: s.studentId,
          name: s.name,
          state: s.state,
          startedAt: s.startedAt,
          submittedAt: s.submittedAt || 0,
          ...(s.state === 'submitted'
            ? { correct: s.correct, total: s.total, score: s.score, reason: s.reason }
            : {}),
        });
      }
    }
    const enrolled = await db
      .collection('enrollments')
      .where('courseId', '==', req.data.courseId)
      .get();
    return {
      sessions,
      roster: enrolled.docs.map((d) => {
        const r = d.data();
        return { studentId: r.studentId, name: r.name, classId: r.classId, enabled: r.enabled };
      }),
    };
  });
  const expireAssessments = onSchedule(
    { ...options, schedule: 'every 1 minutes', timeZone: 'Asia/Taipei' },
    async () => {
      const due = await db
        .collectionGroup('assessmentSessions')
        .where('state', '==', 'active')
        .where('expiresAt', '<=', Date.now())
        .limit(200)
        .get();
      for (const row of due.docs)
        await db.runTransaction(async (tx) => {
          const [ss, es] = await Promise.all([tx.get(row.ref), tx.get(row.ref.parent.parent!)]);
          const s = ss.data(),
            e = es.data();
          if (s && e && expired(s, e, Date.now()))
            tx.set(row.ref, finish(s, e, Date.now(), 'timeout'));
        });
    },
  );
  return {
    getAssessments,
    prepareAssessment,
    controlAssessment,
    startAssessment,
    saveAssessment,
    previewAssessment,
    assessmentReport,
    expireAssessments,
  };
}
