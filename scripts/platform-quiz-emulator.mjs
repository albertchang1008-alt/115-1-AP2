import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, limit, onSnapshot, query, setDoc } from 'firebase/firestore';

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT;
if (!projectId?.startsWith('demo-') || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || ''))
  throw Error('Only run this test on a loopback Firestore emulator and demo project.');
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createZuvioHandlers } = require('./lib/functions/src/zuvioExams.js');
const app = initializeApp({ projectId });
const db = getFirestore(app);
const counts = { reads: 0, writes: 0 };
const real = new WeakMap();
const methods = new Set(['doc', 'collection', 'collectionGroup', 'where', 'limit', 'orderBy', 'startAfter', 'batch']);

function countRead(result) {
  counts.reads += Array.isArray(result) ? result.length : typeof result?.size === 'number' ? Math.max(1, result.size) : 1;
  return result;
}

function track(object, writeBuffer) {
  const proxy = new Proxy(object, {
    get(target, key) {
      const method = Reflect.get(target, key, target);
      if (typeof method !== 'function') return method;
      return (...args) => {
        if (key === 'runTransaction') {
          let committed = 0;
          const [callback, ...rest] = args;
          return method.call(target, (tx) => {
            const pending = { writes: 0 };
            return Promise.resolve(callback(track(tx, pending))).then((result) => { committed = pending.writes; return result; });
          }, ...rest).then((result) => { counts.writes += committed; return result; });
        }
        const input = args.map((arg) => real.get(arg) || arg);
        const result = method.apply(target, input);
        if (methods.has(key)) return track(result, key === 'batch' ? { writes: 0 } : undefined);
        if (key === 'get' || key === 'getAll') return result.then(countRead);
        if (['set', 'create', 'update', 'delete'].includes(key)) {
          if (writeBuffer) {
            writeBuffer.writes++;
            return proxy;
          }
          return result.then((value) => { counts.writes++; return value; });
        }
        if (key === 'commit' && writeBuffer) return result.then((value) => { counts.writes += writeBuffer.writes; return value; });
        return result;
      };
    },
  });
  real.set(proxy, object);
  return proxy;
}
const measured = track(db);
const access = async (req, courseId, teacherOnly) => {
  const c = (await measured.doc('courses/' + courseId).get()).data();
  if (!c || !req.auth) throw Error('denied');
  if (req.auth.uid.startsWith('teacher') && c.teacherIds.includes(req.auth.uid))
    return { p: { teacher: true, uid: req.auth.uid }, c };
  if (teacherOnly) throw Error('denied');
  const member = (await measured.doc('enrollments/' + courseId + '__' + req.auth.email).get()).data();
  if (!member?.enabled) throw Error('denied');
  return { p: { ...member, uid: req.auth.uid, teacher: false }, c };
};
const handlers = createZuvioHandlers(measured, access, {});
const course = 'platform-quiz-fixture';
const part = 'one';
const foreign = 'two';
const unit = 'sample-unit';
const bank = 'synthetic-version';
const teacher = { uid: 'teacher-one' };
const teacher2 = { uid: 'teacher-two' };
const student = (i, classId = part) => ({ uid: classId + '-fixture-' + i, email: classId + '-fixture-' + i + '@example.test' });
const studentId = (i) => 'SIM' + String(i).padStart(3, '0');
const call = (name, auth, data = {}) => handlers[name].run({ auth, data: { courseId: course, ...data } });
const cRef = db.doc('courses/' + course);
const controlRef = (id) => cRef.collection('platformQuizzes').doc(id);
const examRef = (id) => cRef.collection('zuvioExams').doc(id);
const getTeacher = (id) => call('quizTeacherGet', teacher, { sittingId: id });
const action = (id, quiz, action, extra = {}, auth = teacher) =>
  call('quizControl', auth, { sittingId: id, action, ctl: quiz.ctl, round: quiz.round, ...extra });
const examId = randomUUID();
const title = '合成小考';
const qItems = Array.from({ length: 20 }, (_, i) => ({ questionId: 'sample-' + i, unitId: unit, version: bank, optionOrder: ['a', 'b'] }));
const answers = Object.fromEntries(qItems.map((item) => [item.questionId, 'a']));
const seed = [
  [cRef, { teacherIds: [teacher.uid, teacher2.uid], rosterVersion: 2, features: { zuvioExams: true, zuvioMood: true },
    published: { classIds: [part, foreign, 'test'], units: [{ id: unit, title: '合成分類', bankVersion: bank }] } }],
  [db.doc('banks/' + [course, unit, bank].join('_')), { unitId: unit, version: bank, chunks: ['0'] }],
  [db.doc('banks/' + [course, unit, bank].join('_') + '/chunks/0'), { questions: qItems.map((it, i) => ({
    id: it.questionId, text: '合成題幹 ' + i,
    options: [{ id: 'a', text: '合成選項甲' }, { id: 'b', text: i === 0 ? '以上皆是' : '合成選項乙' }],
    explanation: '合成解析', answer: 'a',
  })) }],
  [db.doc('banks/' + [course, unit, bank].join('_') + '/grading/answers'), { answers }],
  ...Array.from({ length: 54 }, (_, i) => [db.doc('enrollments/' + course + '__' + student(i).email),
    { courseId: course, classId: part, studentId: studentId(i), uid: student(i).uid, name: '合成學生 ' + i, enabled: true }]),
  [db.doc('enrollments/' + course + '__' + student(0, foreign).email),
    { courseId: course, classId: foreign, studentId: 'SIM-foreign', name: '合成其他班級', enabled: true }],
];
const env = await initializeTestEnvironment({
  projectId, firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});
const token = (user) => ({ email: user.email, email_verified: true, firebase: { sign_in_provider: 'google.com' } });
const studentDb = env.authenticatedContext(student(0).uid, token(student(0))).firestore();
const otherDb = env.authenticatedContext(student(0, foreign).uid, token(student(0, foreign))).firestore();
const teacherDb = env.authenticatedContext(teacher.uid, { teacher: true }).firestore();
const strangerDb = env.authenticatedContext('teacher-other', { teacher: true }).firestore();
const signalPath = 'quizSignals/' + course + '_' + part;
const snapshots = [];
let stop;
async function createSitting(label) {
  return call('zuvioCreateSitting', teacher, { examId, label, date: '2026-11-25', classIds: [part], durationSeconds: 600 });
}
async function open(sitting) {
  const announced = await getTeacher(sitting.id);
  await action(sitting.id, announced.quiz, 'announce');
  const beforeOpen = await getTeacher(sitting.id);
  await action(sitting.id, beforeOpen.quiz, 'open');
}
function checkNoAnswers(view) {
  assert.equal(view.result, undefined);
  assert.ok(view.questions?.every((question) => !('answer' in question) && !('explanation' in question)));
}
async function burst(label, callOne) {
  const launched = performance.now();
  const sendTimes = [];
  const duration = [];
  const results = await Promise.allSettled(Array.from({ length: 54 }, async (_, i) => {
    const start = performance.now();
    sendTimes.push(start - launched);
    try { return await callOne(i); }
    finally { duration.push(performance.now() - start); }
  }));
  duration.sort((a, b) => a - b);
  const failures = results.filter((res) => res.status === 'rejected');
  console.log(JSON.stringify({ burst: label, count: 54, launchWindowMs: Math.round(Math.max(...sendTimes)),
    p95Ms: Math.round(duration[Math.ceil(duration.length * .95) - 1]), p99Ms: Math.round(duration[Math.ceil(duration.length * .99) - 1]),
    failures: failures.length }));
  if (failures.length) throw failures[0].reason;
  return results.map((row) => row.value);
}
try {
  await env.clearFirestore();
  const batch = db.batch();
  for (const [ref, row] of seed) batch.set(ref, row);
  await batch.commit();
  const args = { examId, title, answerMode: 'platform', score: 4, classIds: [part, foreign], items: qItems };
  assert.equal((await call('zuvioCreateExam', teacher, args)).csv, null);
  assert.equal((await call('zuvioCreateExam', teacher, args)).csv, null);
  await assert.rejects(call('zuvioCreateExam', teacher, { ...args, answerMode: 'zuvio' }));
  await assert.rejects(call('zuvioCreateExam', teacher, { ...args, examId: randomUUID(), classIds: [part, 'test'] }));
  const managed = await createSitting('同時作答');
  const id = managed.id;
  const monitorPath = controlRef(id).path + '/monitor/summary';
  const eventPath = controlRef(id).path + '/events';
  assert.equal((await assertSucceeds(getDoc(doc(studentDb, signalPath)))).exists(), false);
  stop = onSnapshot(doc(studentDb, signalPath), (snapshot) => snapshots.push(snapshot.data()?.state || 'missing'),
    (error) => snapshots.push(error.code));
  const countsBefore = { ...counts };
  const prepared = await getTeacher(id);
  const announcements = await Promise.allSettled([action(id, prepared.quiz, 'announce'), action(id, prepared.quiz, 'announce', {}, teacher2)]);
  assert.equal(announcements.filter((result) => result.status === 'fulfilled').length, 1);
  await assertSucceeds(getDoc(doc(studentDb, signalPath)));
  await assertFails(getDoc(doc(otherDb, signalPath)));
  await assertFails(getDoc(doc(studentDb, monitorPath)));
  await assertFails(getDoc(doc(strangerDb, monitorPath)));
  await assertSucceeds(getDoc(doc(teacherDb, monitorPath)));
  await assertFails(getDocs(query(collection(studentDb, eventPath), limit(80))));
  await assertSucceeds(getDocs(query(collection(teacherDb, eventPath), limit(80))));
  await assertSucceeds(getDocs(query(collection(teacherDb, eventPath), limit(500))));
  await assertFails(getDocs(query(collection(teacherDb, eventPath), limit(501))));
  await assertFails(setDoc(doc(studentDb, signalPath), { state: 'open' }));
  await assert.rejects(call('quizGet', student(0, foreign), { sittingId: id }), /未開放/);
  await assert.rejects(call('quizStart', student(0), { sittingId: id, round: 0 }));
  const announced = await getTeacher(id);
  assert.equal(announced.quiz.state, 'announced');
  await action(id, announced.quiz, 'open');
  await assert.rejects(call('zuvioDeleteResults', teacher, { examId, sittingId: id }));
  await assert.rejects(call('zuvioOpenMood', teacher, { examId, sittingId: id, durationMinutes: 10 }));
  const starts = await burst('start', (i) => call('quizStart', student(i), { sittingId: id, round: 0 }));
  assert.equal(new Set(starts.map((row) => row.deadline)).size, 1);
  assert.ok(new Set(starts.map((row) => row.questions.map((q) => q.id).join())).size > 1);
  starts.forEach((view) => {
    checkNoAnswers(view);
    assert.deepEqual(view.questions.find((q) => q.id === 'sample-0').options.map((o) => o.id), ['a', 'b']);
  });
  assert.deepEqual((await call('quizStart', student(0), { sittingId: id, round: 0 })).questions, starts[0].questions);
  let stage = await getTeacher(id);
  await action(id, stage.quiz, 'extendStudent', { studentId: studentId(0), seconds: 120 });
  assert.equal((await call('quizGet', student(0), { sittingId: id })).deadline, starts[0].deadline + 120000);
  assert.equal((await call('quizGet', student(1), { sittingId: id })).deadline, starts[1].deadline);
  let saveCount = 0;
  for (let seq = 1; seq <= 30; seq++) {
    await Promise.all(Array.from({ length: 54 }, async (_, i) => {
      const view = await call('quizSave', student(i), { sittingId: id, round: 0, seq, answers });
      assert.equal(view.savedSeq, seq);
      assert.equal(view.result, undefined);
      saveCount++;
    }));
  }
  assert.equal(saveCount, 1620);
  assert.equal((await call('quizSave', student(0), { sittingId: id, round: 0, seq: 29, answers: {} })).savedSeq, 30);
  await assert.rejects(call('quizSave', student(0), { sittingId: id, round: 0, seq: 31, answers: { 'sample-0': 'c' } }), /不屬於/);
  const visits = Array.from({ length: 54 }, () => randomUUID());
  for (let episode = 1; episode <= 3; episode++) {
    for (const kind of ['leave', 'return']) {
      await Promise.all(Array.from({ length: 54 }, (_, i) => call('quizLeave', student(i), {
        sittingId: id, round: 0, visit: visits[i], episode, kind, ...(kind === 'return' ? { seconds: 3 } : {}),
      })));
    }
  }
  await call('quizLeave', student(0), { sittingId: id, round: 0, visit: visits[0], episode: 1, kind: 'leave' });
  assert.equal((await controlRef(id).collection('events').get()).size, 324);
  const submissions = await burst('submit', (i) => call('quizSave', student(i), {
    sittingId: id, round: 0, seq: 31, answers, submit: true,
  }));
  assert.ok(submissions.every((view) => view.moodRequired && !view.result));
  const snapshot = (await controlRef(id).collection('monitor').doc('summary').get()).data();
  assert.equal(Object.values(snapshot.students).filter((row) => row.startedRound === 0 && row.submittedRound === 0).length, 54);
  stage = await getTeacher(id);
  const race = await Promise.allSettled([action(id, stage.quiz, 'end'), action(id, stage.quiz, 'extend', { seconds: 60 }, teacher2)]);
  assert.equal(race.filter((result) => result.status === 'fulfilled').length, 1);
  stage = await getTeacher(id);
  if (stage.quiz.state === 'open') await action(id, stage.quiz, 'end');
  const complete = await getTeacher(id);
  assert.equal(complete.quiz.state, 'released');
  assert.equal(complete.scores.length, 54);
  // #73：結束並公布後，教師仍讀得到本場全部切出紀錄（學生讀不到的規則測試見上方）
  assert.equal(complete.events.length, 324);
  assert.ok(complete.events.every((row, i, all) => i === 0 || all[i - 1].at <= row.at));
  assert.equal(complete.scores.find((row) => row.studentId === studentId(0)).extendedSeconds, 120);
  assert.ok(complete.scores.every((row) => row.score === 80));
  assert.equal((await call('quizGet', student(0), { sittingId: id })).result, undefined);
  await call('quizMood', student(0), { sittingId: id, mood: 'green_flow' });
  const released = await call('quizGet', student(0), { sittingId: id });
  assert.equal(released.result.score, 80);
  assert.equal(released.result.questions[0].id, starts[0].questions[0].id);
  assert.equal(released.result.questions[0].answer, 'a');
  const result = await call('zuvioReport', teacher, { examId, sittingIds: [id], classId: part });
  assert.equal(result.platformStats.bins[9].count, 54);
  assert.equal(result.platformStats.median, 80);
  const csv = await call('zuvioExportCsv', teacher, { examId, sittingIds: [id], classId: part, kind: 'itemAnalysis' });
  assert.ok(csv.csv);
  await assert.rejects(call('zuvioReport', teacher, { examId, sittingIds: [id], classId: foreign }));
  assert.ok(snapshots.includes('announced') && snapshots.includes('open') && snapshots.includes('released'));
  console.log(JSON.stringify({ scope: 'one 54-person sitting plus negative paths, checks and a report',
    adminReads: counts.reads - countsBefore.reads, adminWrites: counts.writes - countsBefore.writes,
    saveCalls: saveCount, leaveEvents: 324, resultRows: complete.scores.length, reconciliationDifferences: 0,
    studentSignalStates: [...new Set(snapshots)], directRulesReadsExcluded: true }));

  const repeat = await createSitting('同場補考');
  await open(repeat);
  await call('quizStart', student(0), { sittingId: repeat.id, round: 0 });
  await call('quizStart', student(1), { sittingId: repeat.id, round: 0 });
  await call('quizSave', student(0), { sittingId: repeat.id, round: 0, seq: 1, answers, submit: true });
  let current = await getTeacher(repeat.id);
  await controlRef(repeat.id).update({ deadline: Date.now() - 500, finalDeadline: Date.now() - 500 });
  await assert.rejects(call('quizSave', student(1), { sittingId: repeat.id, round: 0, seq: 1, answers }));
  await handlers.quizExpireDue.run({});
  current = await getTeacher(repeat.id);
  assert.equal(current.quiz.state, 'released');
  assert.equal(current.scores.length, 2);
  assert.equal(current.scores.find((row) => row.studentId === studentId(1)).score, 0);
  const auto = await call('quizGet', student(1), { sittingId: repeat.id });
  assert.equal(auto.moodRequired, true);
  assert.equal(auto.result, undefined);
  assert.equal((await call('quizRecentMood', student(1))).sittingId, repeat.id);
  const round0 = await examRef(examId).get();
  await assert.rejects(action(repeat.id, current.quiz, 'makeup', { studentIds: [studentId(0)] }), /未開始/);
  await action(repeat.id, current.quiz, 'makeup', { studentIds: [studentId(2)] });
  assert.equal((await call('quizRecentMood', student(1))).sittingId, repeat.id);
  await call('quizMood', student(1), { sittingId: repeat.id, mood: 'green_flow' });
  assert.equal((await call('quizRecentMood', student(1))).sittingId, null);
  await assert.rejects(call('quizStart', student(3), { sittingId: repeat.id, round: 1 }));
  await assert.rejects(call('quizSave', student(0), { sittingId: repeat.id, round: 0, seq: 2, answers, submit: true }), /輪次/);
  const makeup = await call('quizStart', student(2), { sittingId: repeat.id, round: 1 });
  assert.equal(makeup.round, 1);
  current = await getTeacher(repeat.id);
  assert.equal(current.quiz.deadline - current.quiz.openedAt, 600000);
  await call('quizSave', student(2), { sittingId: repeat.id, round: 1, seq: 1, answers, submit: true });
  await action(repeat.id, current.quiz, 'end');
  const round1 = await examRef(examId).get();
  const first = round0.data().sittings.find((row) => row.id === repeat.id).results;
  const second = round1.data().sittings.find((row) => row.id === repeat.id).results;
  assert.notEqual(first.gen, second.gen);
  assert.equal(first.revision + 1, second.revision);
  const after = await getTeacher(repeat.id);
  assert.equal(after.scores.length, 3);
  assert.equal(after.scores.find((row) => row.studentId === studentId(2)).makeup, 1);
  assert.equal(after.scores.find((row) => row.studentId === studentId(0)).score, 80);
  console.log('PASS board permissions, dose of concurrent control, timeout, one-round mood, stale save and makeup generation');
} finally {
  stop?.();
  await env.cleanup();
  await db.terminate();
  await deleteApp(app);
}
