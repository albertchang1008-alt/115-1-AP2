import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
if (
  !/^(localhost|127\.0\.0\.1):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') ||
  !/^demo-/.test(process.env.GCLOUD_PROJECT || '')
)
  throw Error('Local demo Emulator only');
const require = createRequire(new URL('../functions/package.json', import.meta.url)),
  h = require('../functions/lib/functions/src/index.js'),
  { getFirestore, Timestamp } = require('firebase-admin/firestore'),
  db = getFirestore();
const out = path.resolve(
  process.argv[process.argv.indexOf('--out') + 1] || '/tmp/stats-aggregation',
);
fs.mkdirSync(out, { recursive: true });
const cid = 'aggregation-demo',
  uid = 'stats-student',
  teacher = { uid: 'stats-teacher', token: { teacher: true } },
  student = {
    uid,
    token: {
      email: 'stats@example.test',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    },
  },
  unit = {
    id: 'u',
    title: '摘要示範',
    threshold: 100,
    required: true,
    visibility: 'current',
    bankVersion: 'v',
    opensAt: '',
    dueAt: '',
    activities: [],
  },
  course = { id: cid, title: '彙總假課程', classIds: ['A', 'test'], units: [unit] };
await db
  .doc(`courses/${cid}`)
  .set({
    teacherIds: [teacher.uid],
    rosterVersion: 2,
    published: course,
    draft: course,
    dailyReports: true,
  });
await db
  .doc(`enrollments/${cid}__stats@example.test`)
  .set({
    courseId: cid,
    classId: 'A',
    uid,
    email: 'stats@example.test',
    enabled: true,
    studentId: '01',
    name: '彙總學生',
  });
await db
  .doc(`banks/${cid}_u_v`)
  .set({
    count: 8,
    questionOptions: Object.fromEntries(Array.from({ length: 8 }, (_, i) => ['q' + i, ['a', 'b']])),
  });
await db
  .doc(`banks/${cid}_u_v/grading/answers`)
  .set({ answers: Object.fromEntries(Array.from({ length: 8 }, (_, i) => ['q' + i, 'a'])) });
const req = (data = {}) => ({ auth: teacher, data: { courseId: cid, classId: 'A', ...data } }),
  a = (id, at, extra = {}) => ({
    id,
    courseId: cid,
    unitId: 'u',
    mode: 'quiz',
    full: true,
    version: 'v',
    clientAt: at,
    duration: 100,
    leaveCount: 0,
    leaveSeconds: 0,
    answers: Array.from({ length: 8 }, (_, i) => ({
      questionId: 'q' + i,
      selected: 'a',
      correct: false,
      seconds: i % 2 ? 20 : 5,
    })),
    ...extra,
  });
for (const x of [
  a('later', 20),
  a('first-z', 10),
  a('first-a', 10, { leaveCount: 4, leaveSeconds: 61 }),
])
  await h.submitAttempt.run({ auth: student, data: { attempt: x } });
let p = (await db.doc(`courses/${cid}/progress/${uid}`).get()).data(),
  timing = structuredClone(p.units.u.timing);
assert.equal(timing.attempts, 3);
assert.equal(timing.first.id, 'first-a');
assert.equal(timing.invalidCount, 1);
const replay = await h.submitAttempt.run({ auth: student, data: { attempt: a('later', 20) } });
assert.equal(replay.duplicate, true);
assert.equal(replay.progress.units.u.timing, undefined);
assert.equal((await h.getProgress.run({auth:student,data:{courseId:cid}})).units.u.timing,undefined);
assert.deepEqual(
  (await db.doc(`courses/${cid}/progress/${uid}`).get()).data().units.u.timing,
  timing,
);
const before = (await db.collection(`courses/${cid}/statsPrivate`).get()).size,
  plan = await h.rebuildStats.run(req());
assert.equal(plan.dryRun, true);
assert.equal((await db.collection(`courses/${cid}/statsPrivate`).get()).size, before);
await assert.rejects(
  h.rebuildStats.run(req({ dryRun: false, planHash: plan.planHash })),
  (e) => e.code === 'failed-precondition',
);
const apply = (cursor, limit = 1) =>
  h.rebuildStats.run(req({ dryRun: false, confirm: true, planHash: plan.planHash, cursor, limit }));
await apply(0);
assert.deepEqual(
  (await db.doc(`courses/${cid}/progress/${uid}`).get()).data().units.u.timing,
  timing,
);
// Inject an actual submission between scan and rebuild transaction to test safe retry.
const original = db.runTransaction.bind(db);
db.runTransaction = async (...args) => {
  db.runTransaction = original;
  await h.submitAttempt.run({ auth: student, data: { attempt: a('racing', 30) } });
  return original(...args);
};
await assert.rejects(apply(0), (e) => e.code === 'aborted');
db.runTransaction = original;
await apply(0);
assert.equal(
  (await db.doc(`courses/${cid}/progress/${uid}`).get()).data().units.u.timing.attempts,
  4,
);
let cursor = 1;
while (cursor !== null) {
  cursor = (await apply(cursor, 5)).nextCursor;
}
const stats = await h.getAnswerIntegrityStats.run(req({ unitId: 'u' }));
assert.equal(stats.reads.attempts, 0);
assert.equal(stats.reads.progress, 1);
const summary = await h.getCompletionSummary.run(req());
assert.equal(summary.source, 'completionDaily');
assert.equal(summary.enabledStudents, 1);
const { taipeiDay } = require('../functions/lib/shared/usageStats.js');
await h.dailyStats.run({ scheduleTime: new Date().toISOString() });
const date = taipeiDay(Date.now() - 86400000),
  ref = db.doc(`courses/${cid}/usageDaily/A_${date.replaceAll('-', '')}`),
  one = (await ref.get()).data();
await h.dailyStats.run({ scheduleTime: new Date().toISOString() });
const two = (await ref.get()).data();
delete one.generatedAt;
delete two.generatedAt;
assert.deepEqual(one, two);
await db
  .doc(`courses/${cid}/research/r`)
  .set({
    uid,
    classId: 'A',
    unitId: 'u',
    version: 'v',
    summary: { questions: { q0: { lastAt: 1 } } },
  });
for (let offset = 0; offset < 2105; offset += 400) {
  const batch = db.batch();
  for (let i = offset; i < Math.min(offset + 400, 2105); i++)
    batch.set(db.doc(`courses/${cid}/attempts/research-${String(i).padStart(5, '0')}`), {
      id: 'research-' + i,
      uid,
      classId: 'A',
      unitId: 'u',
      version: 'v',
      mode: 'review',
      full: false,
      processed: true,
      receivedAt: Timestamp.now(),
      answers: [{ questionId: 'q0', correct: true }],
    });
  await batch.commit();
}
const ev = await h.getExplanationResearchEvidence.run(req({ unitId: 'u' }));
assert.equal(ev.rows[0].followUp.laterAttempts, 2109);
const { readPages } = require('../functions/lib/functions/src/statsAggregation.js');
await assert.rejects(
  readPages(() => db.collection(`courses/${cid}/attempts`), 1000),
  (e) => e.code === 'resource-exhausted',
);
// Existing four submissions also await dailyReports; add 225 more pending attempts.
for (let offset = 0; offset < 225; offset += 100) {
  const batch = db.batch();
  for (let i = offset; i < Math.min(offset + 100, 225); i++)
    batch.set(db.doc(`courses/${cid}/attempts/pending-${String(i).padStart(4, '0')}`), {
      id: 'pending-' + i,
      uid,
      classId: 'A',
      unitId: 'u',
      version: 'v',
      mode: 'quiz',
      full: true,
      processed: false,
      score: 100,
      clientAt: 1,
      duration: 10,
      receivedAt: Timestamp.now(),
      answers: [{ questionId: 'q0', correct: true, seconds: 10 }],
    });
  await batch.commit();
}
await h.dailyReports.run({ scheduleTime: new Date().toISOString() });
const job = (await db.doc(`courses/${cid}/jobs/aggregate`).get()).data();
assert.equal(job.backlog, 0);
assert.equal(job.processedRun, 229);
assert.ok(job.batches > 10);
for (const name of [
  'getAnswerIntegrityStats',
  'getClassUsageStats',
  'getCompletionDaily',
  'rebuildStats',
])
  for (const auth of [student, null, { uid: 'foreign', token: { teacher: true } }])
    await assert.rejects(h[name].run({ auth, data: { courseId: cid, classId: 'A', unitId: 'u' } }));
// Actual client rules: all new collections deny both reads and writes.
const clientRequire = createRequire(new URL('../package.json', import.meta.url)),
  { initializeApp, deleteApp } = clientRequire('firebase/app'),
  {
    getFirestore: getClient,
    connectFirestoreEmulator,
    getDoc,
    setDoc,
    doc,
  } = clientRequire('firebase/firestore'),
  app = initializeApp(
    { projectId: process.env.GCLOUD_PROJECT, apiKey: 'fake' },
    'aggregation-rules',
  ),
  client = getClient(app),
  [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
connectFirestoreEmulator(client, host, Number(port), {
  mockUserToken: { sub: uid, user_id: uid, email: 'stats@example.test' },
});
for (const collection of ['usageDaily', 'completionDaily', 'statsPrivate']) {
  const ref = doc(client, `courses/${cid}/${collection}/probe`);
  await assert.rejects(getDoc(ref), (e) => e.code === 'permission-denied');
  await assert.rejects(setDoc(ref, { probe: true }), (e) => e.code === 'permission-denied');
}
await deleteApp(app);
const result = {
  pass: true,
  realFirestore: true,
  incrementEqualsRebuild: true,
  replayIdempotent: true,
  concurrentRebuildAborts: true,
  dryRunNoWrites: true,
  scheduleIdempotent: true,
  evidenceFollowUp: 2109,
  evidenceNoTruncation: true,
  reportsProcessed: job.processedRun,
  reportsBacklog: job.backlog,
  reportsBatches: job.batches,
  studentRulesReadWriteDenied: 6,
  teacherOnlyCalls: true,
  timingReads: stats.reads,
  completionSource: summary.source,
};
fs.writeFileSync(
  path.join(out, 'aggregation-verification.json'),
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
