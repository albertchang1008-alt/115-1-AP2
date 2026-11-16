// 課堂點名樣張（佇列 #67 第一階段）：全部是合成資料，不含任何真實學生、教師或導師資料。
// 有設定本機 demo Firestore Emulator 時，資料先寫進 Emulator 再讀回；沒有時直接用記憶體內的同一份資料。
import { createRequire } from 'node:module';

export const courseId = 'attendance-sample';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '';
const project = process.env.GCLOUD_PROJECT || '';
export const useEmulator = !!emulatorHost;
if (useEmulator && (!/^(127\.0\.0\.1|localhost):\d+$/.test(emulatorHost) || !/^demo-/.test(project)))
  throw Error('只允許本機 demo Firestore Emulator');

// 固定種子，讓每次產生的樣張完全相同。
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const pad = (n, w = 2) => String(n).padStart(w, '0');

function buildSample() {
  const rand = rng(67);
  const classes = [
    { id: 'demo-a', name: '示範甲班', mentorName: '示範導師甲', mentorEmail: 'mentor-a@example.edu' },
    { id: 'demo-b', name: '示範乙班', mentorName: '示範導師乙', mentorEmail: 'mentor-b@example.edu' },
  ];
  const students = [];
  for (let i = 1; i <= 60; i++)
    students.push({
      uid: `demo-${pad(i)}`,
      seat: i,
      studentId: `0990${pad(i, 3)}`, // 開頭是 0，用來示範「學號以文字輸出」
      name: `示範學生 ${pad(i)}`,
      classId: 'demo-a',
      email: `s0990${pad(i, 3)}@example.edu`,
    });
  const sessionDefs = [
    { id: '2026-11-02-p3', date: '2026-11-02', weekday: '一', period: 3, start: '09:10', mailed: true },
    { id: '2026-11-04-p5', date: '2026-11-04', weekday: '三', period: 5, start: '13:10', mailed: true },
    { id: '2026-11-09-p3', date: '2026-11-09', weekday: '一', period: 3, start: '09:10', mailed: true },
    { id: '2026-11-11-p5', date: '2026-11-11', weekday: '三', period: 5, start: '13:10', mailed: true, backfilled: true },
    { id: '2026-11-16-p3', date: '2026-11-16', weekday: '一', period: 3, start: '09:10', mailed: false },
    { id: '2026-11-16-p4', date: '2026-11-16', weekday: '一', period: 4, start: '10:10', mailed: false },
  ];
  // 幾位固定的示範情境，其餘隨機。
  const habitual = new Set(['demo-17', 'demo-42']); // 常曠課
  const sessions = sessionDefs.map((def, si) => {
    const records = students.map((s) => {
      const miss = habitual.has(s.uid) ? rand() < 0.7 : rand() < 0.05;
      const sec = 4 + Math.floor(rand() * 52);
      return miss
        ? { uid: s.uid, status: 'absent' }
        : { uid: s.uid, status: 'present', signedAt: `${def.start}:${pad(sec)}`, via: rand() < 0.88 ? 'qr' : 'code' };
    });
    return { ...def, classId: 'demo-a', className: '示範甲班', durationSec: 60, codeSec: 60, qrSec: 15, records, si };
  });
  // 今天第 3 節：固定成容易看懂的情境。
  const today = sessions[4];
  const set = (uid, patch) => {
    const r = today.records.find((x) => x.uid === uid);
    for (const k of Object.keys(r)) if (k !== 'uid') delete r[k];
    Object.assign(r, patch);
  };
  for (const r of today.records) if (r.status === 'absent') set(r.uid, { status: 'present', signedAt: '09:10:31', via: 'qr' });
  set('demo-05', { status: 'absent' });
  set('demo-17', { status: 'absent' });
  set('demo-23', { status: 'absent', locked: true, wrongCount: 5 });
  set('demo-31', { status: 'absent' });
  set('demo-42', { status: 'absent' });
  set('demo-58', { status: 'absent' });
  set('demo-09', { status: 'cancelled', edited: true });
  set('demo-36', { status: 'cancelled', edited: true });
  set('demo-11', { status: 'present', signedAt: '09:10:22', via: 'qr', sameDevice: 'demo-12' });
  set('demo-12', { status: 'present', signedAt: '09:10:41', via: 'qr', sameDevice: 'demo-11' });
  set('demo-07', { status: 'present', signedAt: '09:10:12', via: 'qr' });
  // 「我的出缺席」示範帳號（demo-07）：各種狀態都出現一次。
  for (const [i, patch] of [
    [0, { status: 'present', signedAt: '09:10:18', via: 'qr' }],
    [1, { status: 'absent' }],
    [2, { status: 'cancelled', edited: true }],
    [3, { status: 'present', signedAt: '13:10:09', via: 'code' }],
  ]) {
    const r = sessions[i].records.find((x) => x.uid === 'demo-07');
    for (const k of Object.keys(r)) if (k !== 'uid') delete r[k];
    Object.assign(r, patch);
  }
  // 今天第 4 節：點名進行中（投影畫面用）。
  const live = sessions[5];
  live.live = { signed: 45, total: 60, remainSec: 42, code: '4729', codeRemainSec: 42, qrRemainSec: 9, token: 'DEMO.b3c1f0a9.k7Qm2x' };
  live.records.forEach((r, i) => {
    for (const k of Object.keys(r)) if (k !== 'uid') delete r[k];
    Object.assign(r, i < 45 ? { status: 'present', signedAt: `10:10:${pad(3 + Math.floor(i / 3))}`, via: 'qr' } : { status: 'pending' });
  });
  for (const s of sessions) {
    const done = s.records.filter((r) => r.status !== 'pending');
    s.counts = {
      present: done.filter((r) => r.status === 'present').length,
      absent: done.filter((r) => r.status === 'absent').length,
      cancelled: done.filter((r) => r.status === 'cancelled').length,
    };
  }
  const audit = [
    { id: 'a4', at: '2026-11-16 12:05', sessionId: '2026-11-16-p3', uid: 'demo-36', from: 'absent', to: 'cancelled', reason: '手機沒電，下課後當面確認有到', by: '示範教師' },
    { id: 'a3', at: '2026-11-16 09:20', sessionId: '2026-11-16-p3', uid: 'demo-09', from: 'absent', to: 'cancelled', reason: '相機掃不到，助教確認在場', by: '示範教師' },
    { id: 'a2', at: '2026-11-11 15:02', sessionId: '2026-11-11-p5', uid: 'demo-28', from: 'cancelled', to: 'absent', reason: '點錯人，改回', by: '示範教師' },
    { id: 'a1', at: '2026-11-11 15:01', sessionId: '2026-11-11-p5', uid: 'demo-28', from: 'absent', to: 'cancelled', reason: '', by: '示範教師' },
  ];
  return {
    source: 'memory',
    synthetic: true,
    course: { id: courseId, code: '115-1-AP2', name: '解剖生理學（二）', term: '115-1', teacherName: '示範教師', teacherEmail: 'teacher@example.edu' },
    platformUrl: 'https://platform.example.invalid/',
    classes,
    students,
    sessions,
    audit,
    me: 'demo-07',
  };
}

let db;
function emulatorDb() {
  if (db) return db;
  const require = createRequire(new URL('../../functions/package.json', import.meta.url));
  const { initializeApp } = require('firebase-admin/app'),
    { getFirestore } = require('firebase-admin/firestore');
  initializeApp({ projectId: project });
  return (db = getFirestore());
}

export async function seedSample() {
  const data = buildSample();
  if (!useEmulator) return;
  const ref = emulatorDb().doc(`courses/${courseId}`);
  await emulatorDb().recursiveDelete(ref);
  const { sessions, audit, ...course } = data;
  await ref.set(course);
  for (const { records, ...s } of sessions) {
    await ref.collection('attendance').doc(s.id).set(s);
    const batch = emulatorDb().batch();
    for (const r of records) batch.set(ref.collection('attendance').doc(s.id).collection('records').doc(r.uid), r);
    await batch.commit();
  }
  for (const a of audit) await ref.collection('attendanceAudit').doc(a.id).set(a);
}

export async function readSample() {
  if (!useEmulator) return buildSample();
  const ref = emulatorDb().doc(`courses/${courseId}`);
  const course = (await ref.get()).data();
  const sessions = [];
  for (const d of (await ref.collection('attendance').get()).docs) {
    const records = (await d.ref.collection('records').get()).docs.map((r) => r.data());
    records.sort((a, b) => a.uid.localeCompare(b.uid));
    sessions.push({ ...d.data(), records });
  }
  sessions.sort((a, b) => a.si - b.si);
  const audit = (await ref.collection('attendanceAudit').get()).docs.map((a) => a.data()).sort((a, b) => b.id.localeCompare(a.id));
  return { ...course, source: 'emulator', sessions, audit };
}
