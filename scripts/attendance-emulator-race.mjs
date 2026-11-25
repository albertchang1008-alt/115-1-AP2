// 課堂點名並行測試（#67 關鍵審查偏離 6 的條件）：在真的 Firestore 交易上驗證「結束點名」與「簽到」同時發生。
//
// 用法（需要 Firestore Emulator 與 demo- 專案；先 npm --prefix functions run build）：
//   npx firebase emulators:exec --only firestore --project demo-attendance-race "node scripts/attendance-emulator-race.mjs"
// 選項：--rounds 6（回合數）、--students 30（每回合簽到人數，至少 20）
//       --memory：不連 Emulator，改用測試用的記憶體 Firestore 跑同一套流程（只用來檢查這支腳本本身，不能當作並行驗證）。
//
// 每一回合：開始點名 → 同時送出全部學生的簽到（掃 QR 與數字碼各半）→ 途中按〔提前結束〕→ 檢查：
//   1. 每位學生只有 1 筆紀錄
//   2. 所有準時紀錄的 signedAt ≤ closedAt＋寬限
//   3. 節次的 counts 與實際紀錄一致；回覆「簽到成功」的人都是準時，沒有被蓋成未到；回覆失敗的人都是未到
// 不寫入任何正式專案；學生資料全部是合成的。不列入 npm run check。
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const arg = (name, fallback) => (process.argv.includes(name) ? Number(process.argv[process.argv.indexOf(name) + 1]) : fallback);
const rounds = arg('--rounds', 6);
const students = Math.max(20, arg('--students', 30));
const memory = process.argv.includes('--memory');
const host = process.env.FIRESTORE_EMULATOR_HOST || '';
const project = process.env.GCLOUD_PROJECT || '';
if (!memory && (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host) || !/^demo-/.test(project))) {
  console.error('只允許本機 demo- 專案的 Firestore Emulator（請用上方的 emulators:exec 指令執行）');
  process.exit(2);
}
let lib;
try {
  lib = require('./lib/functions/src/attendance.js');
} catch {
  console.error('找不到 functions/lib：請先執行 npm --prefix functions run build');
  process.exit(2);
}
const shared = require('./lib/shared/attendance.js');
let db;
if (memory) db = require('./tests/helpers/attendance-memory.cjs').memoryDb();
else {
  const { initializeApp } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  initializeApp({ projectId: project });
  db = getFirestore();
}

const COURSE = 'attendance-race';
const course = { features: { attendance: true }, rosterVersion: 2, published: { title: '並行測試（合成）' } };
const owner = { uid: 'race-teacher', teacher: true, name: '示範教師', email: 'teacher@example.edu' };
const member = (i) => ({ uid: `race-${i}`, email: `race${i}@example.edu`, classId: 'R', name: `示範學生 ${i}`, studentId: `R${String(i).padStart(3, '0')}` });
const access = async (req, id, teacherOnly) => {
  if (id !== COURSE || !req.auth) throw new Error('permission');
  if (req.auth.teacher) return { p: req.auth, c: { ...course, classIds: ['R'] } };
  if (teacherOnly) throw new Error('permission');
  return { p: req.auth, c: course };
};
const h = lib.createAttendanceHandlers(db, access, {});
const call = (name, data, auth = owner) => h[name].run({ data: { courseId: COURSE, ...data }, auth });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 清掉上一次的測試資料，建立合成名冊
if (!memory) await db.recursiveDelete(db.doc(`courses/${COURSE}`));
await db.doc(`courses/${COURSE}`).set(course);
for (let i = 1; i <= students; i++) await db.doc(`enrollments/${COURSE}__race${i}@example.edu`).set({ ...member(i), courseId: COURSE, enabled: true });

const failures = [];
const warnings = []; // 不影響三項檢查，但值得看：例如交易競爭造成的拒絕
const summary = [];
for (let round = 1; round <= rounds; round++) {
  const { session } = await call('attendanceStart', { classIds: ['R'], durationSec: 30 });
  const live = await call('attendanceLive', {});
  // 每一回合在不同的時間點按結束：第 1 回合幾乎同時，之後逐回合延後一點
  const endDelay = (round - 1) * 15;
  const replies = new Array(students);
  const checkIns = Array.from({ length: students }, (_, k) => k + 1).map(async (i) => {
    await sleep(Math.floor(Math.random() * 40));
    try {
      const by = i % 2 ? { token: live.token } : { code: live.code };
      replies[i - 1] = (await call('attendanceCheckIn', { ...by, deviceId: `race-device-${i}` }, member(i))).result;
    } catch (e) {
      replies[i - 1] = 'refused:' + (e.details?.reason || e.code || e.message);
    }
  });
  // 交易競爭太激烈時 Firestore 可能回 ABORTED：比照老師再按一次，最多重試 5 次並記錄次數。
  let endRetries = 0;
  const end = sleep(endDelay).then(async () => {
    for (;;) {
      try {
        return await call('attendanceControl', { action: 'end' });
      } catch (e) {
        if (/沒有進行中/.test(e.message)) return null; // 前一次其實已經結束
        if (++endRetries > 5) throw e;
        await sleep(50);
      }
    }
  });
  await Promise.all([...checkIns, end]);
  // 讀名冊（會補上未到），再直接讀 Firestore 的原始資料來比對
  const roster = await call('attendanceRoster', { sessionId: session.id });
  const s = (await db.doc(`courses/${COURSE}/attendance/${session.id}`).get()).data();
  const raw = (await db.collection(`courses/${COURSE}/attendance/${session.id}/records`).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
  const fail = (msg) => failures.push(`第 ${round} 回合：${msg}`);
  // 1. 每位學生只有 1 筆紀錄
  if (raw.length !== students) fail(`紀錄 ${raw.length} 筆，應為 ${students} 筆`);
  if (new Set(raw.map((r) => r.email)).size !== raw.length || raw.some((r) => r.id !== r.email)) fail('有學生出現重複或鍵不一致的紀錄');
  // 2. 準時紀錄的時間不晚於結束＋寬限
  const present = raw.filter((r) => r.status === 'present');
  for (const r of present) if (!(r.signedAt <= s.closedAt + shared.ATTENDANCE_GRACE_MS)) fail(`${r.email} 的 signedAt 晚於 closedAt＋寬限（${r.signedAt - s.closedAt}ms）`);
  // 3. counts 一致；回覆與紀錄一致
  const actual = { present: present.length, absent: raw.length - present.length };
  if (s.status !== 'closed' || s.settled !== true) fail('節次沒有完成結算');
  if (s.counts?.present !== actual.present || s.counts?.absent !== actual.absent) fail(`counts ${JSON.stringify(s.counts)} 與實際 ${JSON.stringify(actual)} 不一致`);
  if (roster.session.counts?.present !== actual.present || roster.session.counts?.absent !== actual.absent) fail('名冊回傳的 counts 與實際不一致');
  for (let i = 1; i <= students; i++) {
    const r = raw.find((x) => x.email === member(i).email);
    const ok = replies[i - 1] === 'ok';
    if (!r) continue;
    if (ok && r.status !== 'present') fail(`${r.email} 收到簽到成功，紀錄卻是未到（被蓋掉）`);
    if (!ok && r.status !== 'absent') fail(`${r.email} 收到 ${replies[i - 1]}，紀錄卻是準時`);
    if (!ok && replies[i - 1] !== 'refused:closed') warnings.push(`第 ${round} 回合：${r.email} 被拒絕的原因不是「已結束」：${replies[i - 1]}`);
  }
  summary.push({ round, endDelayMs: endDelay, signedOk: replies.filter((x) => x === 'ok').length, refusedClosed: replies.filter((x) => x === 'refused:closed').length, endRetries, counts: s.counts });
}
const mixed = summary.some((x) => x.signedOk > 0 && x.refusedClosed > 0);
const result = {
  pass: !failures.length,
  source: memory ? '記憶體模擬（不是並行驗證）' : `Firestore Emulator ${host}（${project}）`,
  rounds,
  studentsPerRound: students,
  // 至少要有一回合是「有人簽到成功、也有人被結束擋下」，才算真的測到同時發生
  sawRaceWithinARound: mixed,
  summary,
  failures,
  warnings,
};
console.log(JSON.stringify(result, null, 2));
if (!memory && !mixed) console.error('提醒：沒有任何回合同時出現成功與被擋下的簽到，請加大 --rounds 或 --students 重跑。');
assert.equal(result.pass, true, '並行檢查未通過');
if (!memory) await db.recursiveDelete(db.doc(`courses/${COURSE}`));
process.exit(0);
