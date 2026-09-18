/*
 * 一次性真實 Firestore Emulator 驗證；不接入 npm run check。
 * 執行：firebase emulators:exec --only firestore "node functions/scripts/verify-mixed-transaction.cjs"
 */
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_CONFIG ||= JSON.stringify({ projectId: 'course-platform-transaction-test' });
const assert = require('node:assert/strict');
const { getFirestore } = require('firebase-admin/firestore');
const handlers = require('../lib/functions/src/index.js');
const db = getFirestore();
const courseId = 'atomic-course', email = 'atomic.student@example.test', uid = 'atomic-student';
const auth = { uid, token: { email, email_verified: true, firebase: { sign_in_provider: 'google.com' } } };

async function main() {
  const units = ['u1', 'u2'].map((id) => ({ id, title: id, opensAt: '', bankVersion: 'v1', required: true, threshold: 80, activities: [] }));
  await db.doc(`courses/${courseId}`).set({ rosterVersion: 2, classIds: ['A'], published: { id: courseId, classIds: ['A'], classUnits: { A: ['u1', 'u2'] }, units } });
  await db.doc(`enrollments/${courseId}__${email}`).set({ courseId, email, classId: 'A', enabled: true, uid });
  for (const unit of units) {
    const ref = db.doc(`banks/${courseId}_${unit.id}_v1`);
    await ref.set({ count: 1, questionOptions: { [`${unit.id}q`]: ['a', 'b'] }, chunks: [] });
    await ref.collection('grading').doc('answers').set({ answers: { [`${unit.id}q`]: 'a' }, count: 1 });
  }
  const attempt = (unitId, selected, id) => ({ id, courseId, unitId, version: 'v1', mode: 'quiz', full: false, score: 999, clientAt: Date.now(), duration: 1, answers: [{ questionId: `${unitId}q`, selected, correct: !selected, seconds: 1 }] });
  const ok = await handlers.submitMixedAttempts.run({ auth, data: { attempts: [attempt('u1', 'b', 'ok-1'), attempt('u2', 'a', 'ok-2')] } });
  assert.deepEqual(ok.progress.units.u1.wrong.v1.u1q.n, 1, 'u1 答錯應寫入 wrong');
  assert.equal(ok.progress.units.u2.wrong.v1.u2q, undefined, 'u2 答對不可留下 wrong');
  assert.deepEqual(ok.progress.attempted.u1, { u1q: true });
  assert.deepEqual(ok.progress.attempted.u2, { u2q: true });

  const before = (await db.doc(`courses/${courseId}/progress/${uid}`).get()).data();
  const markerA = db.doc(`courses/${courseId}/atomic-check/a`), markerB = db.doc(`courses/${courseId}/atomic-check/b`);
  await assert.rejects(db.runTransaction(async (tx) => { tx.set(markerA, { changed: true }); tx.set(markerB, { changed: true }); throw Error('intentional abort'); }), /intentional abort/);
  assert.equal((await markerA.get()).exists, false, '交易中途失敗不可殘留第一筆寫入');
  assert.equal((await markerB.get()).exists, false, '交易中途失敗不可殘留第二筆寫入');
  const after = (await db.doc(`courses/${courseId}/progress/${uid}`).get()).data();
  assert.deepEqual(after.units, before.units, '失敗交易不可變更既有 wrong');
  assert.deepEqual(after.attempted, before.attempted, '失敗交易不可變更既有 attempted');
  console.log('PASS: mixed success writes both units; real emulator transaction abort leaves zero writes.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
