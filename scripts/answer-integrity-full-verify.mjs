import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
if (
  !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') ||
  !/^demo-/.test(process.env.GCLOUD_PROJECT || '')
)
  throw Error('Only local demo Emulator allowed');
const require = createRequire(new URL('../functions/package.json', import.meta.url)),
  handlers = require('../functions/lib/functions/src/index.js'),
  db = require('firebase-admin/firestore').getFirestore();
const out = path.resolve(
  process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1]
    : '/tmp/answer-integrity-full',
);
fs.mkdirSync(out, { recursive: true });
const courseId = 'integrity-full-demo',
  studentAuth = {
    uid: 'demo-student',
    token: {
      email: 'demo-student@example.test',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    },
  },
  teacherAuth = {
    uid: 'demo-teacher',
    token: { teacher: true, email: 'demo-teacher@example.test' },
  };
const unit = {
    id: 'u',
    title: '示範單元',
    required: true,
    threshold: 100,
    opensAt: '',
    dueAt: '',
    activities: [],
    group: '示範章節',
    bankVersion: 'v1',
    questionCount: 8,
    visibility: 'current',
    research: { enabled: false },
  },
  course = {
    id: courseId,
    title: '虛構驗收課程',
    classIds: ['A', 'test'],
    units: [unit],
    chapters: { 示範章節: { title: '示範章節', activities: [], required: true } },
  };
const questions = Array.from({ length: 8 }, (_, i) => ({
  id: `q${i}`,
  text: `示範活動第 ${i + 1} 題：先完成哪個步驟？`,
  options: [
    { id: 'a', text: '閱讀題幹' },
    { id: 'b', text: '交換想法' },
  ],
  answer: 'a',
  explanation: '介面驗證題：本次活動先閱讀題幹。',
}));
const progress = {
  units: { u: { best: 80, attempts: 1, fullAttempts: 1, updatedAt: 1 } },
  activities: {},
};
const student = { uid: studentAuth.uid, name: '示範學生', studentId: 'DEMO-01', classId: 'A' };
await db
  .doc(`courses/${courseId}`)
  .set({ teacherIds: [teacherAuth.uid], rosterVersion: 2, draft: course, published: course });
const people = [
  student,
  { uid: 'demo-fast', name: '偏快示範', studentId: 'DEMO-02', classId: 'A' },
  { uid: 'demo-uniform', name: '時間平均示範', studentId: 'DEMO-03', classId: 'A' },
  { uid: 'demo-normal', name: '一般示範', studentId: 'DEMO-04', classId: 'A' },
  { uid: 'demo-test', name: 'test對照', studentId: 'TEST', classId: 'test' },
];
for (const s of people) {
  const email = `${s.uid}@example.test`;
  await db.doc(`enrollments/${courseId}__${email}`).set({ ...s, email, courseId, enabled: true });
  await db.doc(`profiles/${s.uid}`).set({ email, ...s, teacher: false });
}
await db
  .doc(`banks/${courseId}_u_v1`)
  .set({ count: 8, questionOptions: Object.fromEntries(questions.map((q) => [q.id, ['a', 'b']])) });
await db
  .doc(`banks/${courseId}_u_v1/grading/answers`)
  .set({ answers: Object.fromEntries(questions.map((q) => [q.id, 'a'])) });
await db.doc(`courses/${courseId}/progress/${student.uid}`).set(progress);
function attempt(uid, id, average, score = 100, extra = {}) {
  return {
    id,
    courseId,
    unitId: 'u',
    version: 'v1',
    uid,
    classId: uid === 'demo-test' ? 'test' : 'A',
    mode: 'quiz',
    full: true,
    clientAt: 1,
    receivedAt: require('firebase-admin/firestore').Timestamp.fromMillis(1),
    score,
    duration: average * 8,
    answers: questions.map((q, i) => ({
      questionId: q.id,
      selected: 'a',
      correct: true,
      seconds: i % 2 ? average * 1.8 : average * 0.2,
    })),
    ...extra,
  };
}
for (const a of [
  attempt(student.uid, 'old', 30, 80),
  attempt('demo-fast', 'fast', 8),
  attempt('demo-uniform', 'uniform', 30, 100, {
    answers: questions.map((q) => ({
      questionId: q.id,
      selected: 'a',
      correct: true,
      seconds: 30,
    })),
  }),
  attempt('demo-normal', 'normal', 40, 80),
  attempt('demo-test', 'test', 1),
])
  await db.doc(`courses/${courseId}/attempts/${a.id}`).set(a);
const usageNow = Date.now();
await db
  .doc(`courses/${courseId}/diagnostics/usage-demo`)
  .set({ uid: student.uid, classId: 'A', unitId: 'u', updatedAt: usageNow });
await db
  .doc(`courses/${courseId}/diagnostics/usage-demo/events/recent`)
  .set({ receivedAt: usageNow - 1000 });
await db
  .doc(`courses/${courseId}/diagnostics/usage-demo/events/yesterday`)
  .set({ receivedAt: usageNow - 86400000 });
await db
  .doc(`courses/${courseId}/diagnostics/usage-test`)
  .set({ uid: 'demo-test', classId: 'test', unitId: 'u' });
await db
  .doc(`courses/${courseId}/diagnostics/usage-test/events/recent`)
  .set({ receivedAt: usageNow });
for (const auth of [studentAuth, null, { uid: 'foreign', token: { teacher: true } }])
  await assert.rejects(handlers.getClassUsageStats.run({ auth, data: { courseId, classId: 'A' } }));
const plan = await handlers.rebuildStats.run({
  auth: teacherAuth,
  data: { courseId, classId: 'A' },
});
let cursor = 0;
do {
  const r = await handlers.rebuildStats.run({
    auth: teacherAuth,
    data: {
      courseId,
      classId: 'A',
      dryRun: false,
      confirm: true,
      planHash: plan.planHash,
      cursor,
      limit: 5,
    },
  });
  cursor = r.nextCursor;
} while (cursor !== null);
const usage = await handlers.getClassUsageStats.run({
  auth: teacherAuth,
  data: { courseId, classId: 'A' },
});
assert.equal(usage.recent.length, 1);
assert.equal(usage.recent[0].uid, student.uid);
assert.equal(
  usage.daily.reduce((n, d) => n + d.records, 0),
  2,
);

const statsRequest = { courseId, classId: 'A', unitId: 'u' };
for (const auth of [studentAuth, null, { uid: 'foreign', token: { teacher: true } }])
  await assert.rejects(handlers.getAnswerIntegrityStats.run({ auth, data: statsRequest }));
const before = await handlers.getAnswerIntegrityStats.run({
  auth: teacherAuth,
  data: statsRequest,
});
assert.equal(before.units[0].rows.length, 4);
assert.equal(
  before.units[0].rows.find((r) => r.uid === 'demo-fast').reasons.includes('fast'),
  true,
);
assert.equal(
  before.units[0].rows.find((r) => r.uid === 'demo-uniform').reasons.includes('uniform'),
  true,
);
const bad = attempt(student.uid, 'bad-type', 30, 100, { leaveCount: '4', leaveSeconds: 20 });
await assert.rejects(handlers.submitAttempt.run({ auth: studentAuth, data: { attempt: bad } }));
assert.equal((await db.doc(`courses/${courseId}/attempts/bad-type`).get()).exists, false);
const source = buildSync({
  entryPoints: ['tests/fixtures/answer-integrity-full.tsx'],
  bundle: true,
  write: false,
  outfile: 'bundle.js',
  format: 'iife',
  platform: 'browser',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
}).outputFiles;
const calls = [];
const allowed = new Set([
  'submitAttempt',
  'submitMixedAttempts',
  'getAnswerIntegrityStats',
  'getClassUsageStats',
  'getCompletionDaily',
  'rebuildStats',
  'recordPracticeLeaves',
  'getHistory',
]);
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api') {
      let body = '';
      for await (const b of req) {
        body += b;
        if (body.length > 400000) throw Error('Payload too big');
      }
      const input = JSON.parse(body);
      if (!allowed.has(input.name)) throw Error('Unsupported fixture API');
      const auth = input.role === 'teacher' ? teacherAuth : studentAuth;
      calls.push({ name: input.name, role: input.role, data: input.data });
      const result = await handlers[input.name].run({ auth, data: input.data });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      const data = JSON.stringify({ course, questions, student, progress }).replace(
        /</g,
        '\\u003c',
      );
      res.end(
        `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><div id="root"></div><script>window.__INTEGRITY_FIXTURE__=${data}</script><script src="/bundle.js"></script></html>`,
      );
      return;
    }
    const file = source.find((f) => path.basename(f.path) === req.url?.slice(1));
    if (file) {
      res.writeHead(200, {
        'Content-Type': req.url.endsWith('.css') ? 'text/css' : 'text/javascript',
      });
      res.end(file.contents);
    } else {
      res.writeHead(404);
      res.end();
    }
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: e.message }));
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`,
  browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
  await page.clock.install({ time: new Date('2026-10-30T00:00:00+08:00') });
  await page.clock.pauseAt(new Date('2026-10-30T00:00:01+08:00'));
  await page.goto(url);
  await page.getByText('平均每題 30 秒 · 第一次作答平均每題 30 秒', { exact: true }).waitFor();
  await page.screenshot({ path: path.join(out, '01-profile-1920.png') });
  await page.getByRole('button', { name: '使用情況', exact: true }).click();
  await page.getByRole('button', { name: '查看使用情況', exact: true }).click();
  await page.getByRole('heading', { name: '最近 10 分鐘有活動：1 人' }).waitFor();
  await page.screenshot({ path: path.join(out, '05-usage-1920.png'), fullPage: true });
  await page.getByRole('button', { name: '完成度摘要', exact: true }).click();
  await page.getByRole('button', { name: '查看班級摘要', exact: true }).click();
  await page.getByText(/更新時間：/).waitFor();
  await page.screenshot({ path: path.join(out, '06-completion-daily-1920.png') });
  await page.getByRole('button', { name: '預覽補算統計', exact: true }).click();
  await page.getByRole('heading', { name: '補算預覽：A 班' }).waitFor();
  await page.screenshot({ path: path.join(out, '07-rebuild-preview-1920.png') });
  await page.getByRole('button', { name: '取消補算', exact: true }).click();
  await page.getByRole('button', { name: '預覽補算統計', exact: true }).click();
  await page.getByRole('button', { name: '確認補算本班統計', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '補算完成' }).waitFor();
  await page.getByRole('button', { name: '全班總覽', exact: true }).click();
  await page.getByRole('button', { name: '查看作答時間' }).click();
  await page.getByRole('checkbox', { name: '只看有標記' }).waitFor();
  await page.getByRole('button', { name: /最高有效分數/ }).click();
  await page.getByRole('checkbox', { name: '只看有標記' }).check();
  await page.getByRole('button', { name: '⚠ 每題時間平均', exact: true }).hover();
  await page.getByRole('tooltip').filter({ hasText: '每題時間平均' }).waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(out, '02-class-flags-1920.png') });
  assert.equal(await page.locator('tbody tr').count(), 2);
  await page.getByRole('button', { name: '開始完整測驗', exact: true }).click();
  await page.getByRole('button', { name: '完成並提交' }).count();
  await page.getByRole('heading', { name: questions[0].text }).waitFor();
  await page.evaluate(() => {
    window.__integrityHidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => window.__integrityHidden,
    });
    document.hasFocus = () => !window.__integrityHidden;
  });
  const leave = async (ms) => {
    await page.evaluate(() => {
      dispatchEvent(new Event('blur'));
      window.__integrityHidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(ms);
    await page.evaluate(() => {
      window.__integrityHidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
      dispatchEvent(new Event('focus'));
    });
  };
  const notice = page.getByRole('dialog', { name: '離開作答畫面提示' });
  for (let i = 0; i < 2; i++) {
    await leave(1000);
    await notice.getByRole('button', { name: '繼續作答' }).click();
  }
  await leave(43000);
  await notice.getByRole('status').filter({ hasText: '再離開 1 次' }).waitFor();
  assert((await notice.innerText()).includes('接近上限'));
  await page.screenshot({ path: path.join(out, '03-third-leave-warning-1920.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: path.join(out, '03-third-leave-warning-390.png') });
  await notice.getByRole('button', { name: '繼續作答' }).click();
  await leave(16000);
  await notice.getByRole('status').filter({ hasText: '已超過上限' }).waitFor();
  await notice.getByRole('button', { name: '繼續作答' }).click();
  for (let i = 0; i < questions.length; i++) {
    await page.getByRole('radio').first().click();
    await page
      .getByRole('button', {
        name: i === questions.length - 1 ? '完成並提交' : '下一題',
        exact: true,
      })
      .click();
  }
  await page.getByText('本次不列入成績', { exact: true }).waitFor();
  await page.getByText('已保存', { exact: true }).waitFor();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: path.join(out, '04-invalid-result-1920.png') });
  assert.equal(await page.getByRole('button', { name: '再作答一次' }).isEnabled(), true);
  const stored = (await db.doc(`courses/${courseId}/progress/${student.uid}`).get()).data();
  assert.equal(stored.units.u.best, 80);
  assert.equal(stored.units.u.attempts, 2);
  assert.equal(stored.units.u.passedAt, undefined);
  const records = (
    await db.collection(`courses/${courseId}/attempts`).where('uid', '==', student.uid).get()
  ).docs.map((d) => d.data());
  const invalid = records.find((a) => a.integrity === 'left-screen');
  assert.equal(invalid.leaveCount, 4);
  assert.equal(invalid.leaveSeconds, 61);
  await page.evaluate(() => {
    dispatchEvent(new Event('blur'));
    dispatchEvent(new Event('focus'));
  });
  assert.equal(await notice.count(), 0, '結果頁不得繼續監聽');
  await page.getByRole('button', { name: '開始閃卡', exact: true }).click();
  await leave(1000);
  await notice.getByRole('status').filter({ hasText: '本模式僅記錄' }).waitFor();
  await notice.getByRole('button', { name: '繼續作答' }).click();
  await page.getByRole('button', { name: '離開閃卡', exact: true }).click();
  await page.getByRole('button', { name: '查看作答時間' }).waitFor();
  const sessions = await db.collection(`courses/${courseId}/practiceLeaves`).get();
  assert.equal(sessions.docs.length, 1);
  assert.equal(sessions.docs[0].data().leaveCount, 1);
  assert.equal(
    (await db.doc(`courses/${courseId}/progress/${student.uid}`).get()).data().units.u.attempts,
    2,
  );
  await page.getByRole('button', { name: '查看作答時間' }).click();
  await page.getByRole('checkbox', { name: '只看有標記' }).check();
  await page.getByText('1 次未列成績', { exact: true }).waitFor();
  assert.equal(await page.locator('tbody tr').count(), 3, '篩選須同時保留⚠與未列成績紀錄');
  await page.getByRole('button', { name: /^平均每題/ }).click();
  const ascending = await page.locator('tbody tr td:nth-child(4)').allTextContents();
  const numeric = ascending.map((s) => parseFloat(s));
  assert.deepEqual(
    numeric,
    [...numeric].sort((a, b) => a - b),
  );
  await page.getByRole('button', { name: /^平均每題/ }).click();
  const descending = (await page.locator('tbody tr td:nth-child(4)').allTextContents()).map((s) =>
    parseFloat(s),
  );
  assert.deepEqual(
    descending,
    [...numeric].sort((a, b) => b - a),
  );
  // A timer callback must flush the current question, not its initial render closure.
  await page.getByRole('button', { name: '開始完整測驗', exact: true }).click();
  await page.getByRole('heading', { name: questions[0].text }).waitFor();
  await page.clock.runFor(1000);
  await page.getByRole('button', { name: '下一題', exact: true }).click();
  await page.getByRole('heading', { name: questions[1].text }).waitFor();
  await page.clock.fastForward(480000);
  await page.getByText('已保存', { exact: true }).waitFor();
  const timeoutAttempt = (
    await db.collection(`courses/${courseId}/attempts`).where('uid', '==', student.uid).get()
  ).docs
    .map((d) => d.data())
    .find((a) => !records.some((old) => old.id === a.id));
  assert.equal(timeoutAttempt.answers[0].seconds, 1);
  assert.ok(timeoutAttempt.answers[1].seconds >= 479);
  assert.equal(timeoutAttempt.leaveCount, 0);
  // Real client rules probe, not an Admin SDK permission simulation.
  const clientRequire = createRequire(new URL('../package.json', import.meta.url)),
    { initializeApp, deleteApp } = clientRequire('firebase/app'),
    { getFirestore, connectFirestoreEmulator, getDoc, doc } = clientRequire('firebase/firestore');
  const app = initializeApp(
    { projectId: process.env.GCLOUD_PROJECT, apiKey: 'fake' },
    'integrity-rules',
  );
  const client = getFirestore(app);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(client, host, Number(port), {
    mockUserToken: { sub: student.uid, user_id: student.uid, email: 'demo-student@example.test' },
  });
  await assert.rejects(
    getDoc(doc(client, `courses/${courseId}/attempts/old`)),
    (e) => e.code === 'permission-denied',
  );
  await assert.rejects(
    getDoc(doc(client, `courses/${courseId}/practiceLeaves/${sessions.docs[0].id}`)),
    (e) => e.code === 'permission-denied',
  );
  await deleteApp(app);
  assert.deepEqual(errors, []);
  const result = {
    pass: true,
    project: process.env.GCLOUD_PROJECT,
    realFirestore: true,
    teacherStats: true,
    usageStats: true,
    usageReads: usage.reads,
    studentUnauthForeignTeacherDenied: true,
    rulesStudentReadsDenied: true,
    thirdWarning: true,
    seconds45Warning: true,
    invalidAttempt: {
      leaveCount: invalid.leaveCount,
      leaveSeconds: invalid.leaveSeconds,
      score: invalid.score,
    },
    progress: {
      best: stored.units.u.best,
      attempts: stored.units.u.attempts,
      passedAtPresent: Object.hasOwn(stored.units.u, 'passedAt'),
    },
    flashcardRecordOnly: true,
    sortingAndFilter: true,
    timeoutCurrentQuestionTiming: true,
    uiApiCalls: calls.length,
    statsReads: before.reads,
    errors,
  };
  fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
