import { createRequire } from 'node:module';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
if (
  !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') ||
  !/^demo-/.test(process.env.GCLOUD_PROJECT || '')
)
  throw Error('只允許本機 demo Firestore Emulator');
const { initializeApp } = require('firebase-admin/app'),
  { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: process.env.GCLOUD_PROJECT });
export const db = getFirestore();
const courseId = 'answer-integrity-sample';
const students = ['正常', '偏快', '離開 1 次', '離開 4 次'].map((scenario, i) => ({
  uid: `demo-${i + 1}`,
  name: `示範學生 ${String(i + 1).padStart(2, '0')}`,
  studentId: `DEMO-${String(i + 1).padStart(2, '0')}`,
  classId: '示範班',
  scenario,
}));
students.push({
  uid: 'demo-test',
  name: '測試資料',
  studentId: 'TEST',
  classId: 'test',
  scenario: '排除',
});
const units = [
  { id: 'respiration', title: '呼吸系統', threshold: 100 },
  { id: 'urinary', title: '泌尿系統', threshold: 100 },
  { id: 'review', title: '複習考（不納入）', threshold: 100, review: true },
];
let serial = 0;
function attempt(uid, unitId, seconds, score, leaveCount, leaveSeconds, extra = {}) {
  const id = `sample-${++serial}`;
  return {
    id,
    courseId,
    unitId,
    uid,
    version: 'sample-v1',
    mode: 'quiz',
    full: true,
    classId: uid === 'demo-test' ? 'test' : '示範班',
    clientAt: 1793232000000 + serial * 600000,
    receivedAt: 1793232000000 + serial * 600000,
    score,
    duration: seconds * 10,
    answers: Array.from({ length: 10 }, (_, i) => ({
      questionId: `demo-q${i + 1}`,
      selected: '示範選項',
      correct: i < score / 10,
      seconds,
    })),
    ...(leaveCount === undefined ? {} : { leaveCount, leaveSeconds }),
    ...extra,
  };
}
const attempts = [
  attempt('demo-1', 'respiration', 32, 80),
  attempt('demo-1', 'respiration', 28, 100, 0, 0),
  attempt('demo-2', 'respiration', 7, 100, 0, 0),
  attempt('demo-2', 'respiration', 9, 100, 0, 0),
  attempt('demo-3', 'respiration', 28, 90, 1, 12),
  attempt('demo-4', 'respiration', 31, 80),
  attempt('demo-4', 'respiration', 32, 100, 4, 42, { integrity: 'left-screen' }),
  attempt('demo-1', 'urinary', 35, 90, 1, 8),
  attempt('demo-1', 'review', 2, 100, 0, 0),
  attempt('demo-test', 'respiration', 1, 100, 0, 0),
  attempt('demo-1', 'respiration', 1, 100, 4, 75, { mode: 'review', full: false }),
];
export async function seedSample() {
  await db.doc(`courses/${courseId}`).set({ title: '作答統計虛構樣張', units });
  for (const s of students)
    await db.doc(`enrollments/${courseId}__${s.uid}`).set({ ...s, courseId, enabled: true });
  for (const a of attempts) await db.doc(`courses/${courseId}/attempts/${a.id}`).set(a);
}
export async function readSample() {
  const [course, ss, aa] = await Promise.all([
    db.doc(`courses/${courseId}`).get(),
    db.collection('enrollments').where('courseId', '==', courseId).get(),
    db.collection(`courses/${courseId}/attempts`).get(),
  ]);
  return {
    source: 'emulator',
    units: course.data().units,
    students: ss.docs.map((s) => s.data()).sort((a, b) => a.uid.localeCompare(b.uid)),
    attempts: aa.docs.map((a) => a.data()),
  };
}
