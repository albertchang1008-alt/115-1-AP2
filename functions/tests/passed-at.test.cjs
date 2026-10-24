// Exercise actual backend callables; all persisted writes use the SDK-backed local harness.
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
const { submitAttempt, submitMixedAttempts } = require('../lib/functions/src/index.js');
const { isOverdue } = require('../lib/shared/model.js');
const { memoryDb } = require('./helpers/snapshot-memory.cjs');
const student = { uid: 'student', token: { email: 'fixture@example.edu', email_verified: true, firebase: { sign_in_provider: 'google.com' } } };
const progressPath = 'courses/ap2/progress/student';
const start = Date.parse('2026-10-18T12:00:00+08:00');
const ids = ['q1', 'q2', 'q3', 'q4', 'q5'];
function seed(ctx, review = false, mixed = false) {
  const unit = { id: 'u', title: '分類', group: 'chapter', required: true, threshold: 80, opensAt: '', dueAt: '2026-10-17T23:59', activities: [], bankVersion: 'v1', visibility: 'current' };
  if (review) unit.review = { sourceUnitIds: ['s1', 's2'], sourceVersions: { s1: 'v1', s2: 'v1' }, drawCount: 4, allocation: { s1: 2, s2: 2 }, builtAt: 1,
    history: [{ version: 'v1', drawCount: 4, allocation: { s1: 2, s2: 2 }, builtAt: 1 }] };
  const units = mixed ? [unit, { ...unit, id: 'v' }] : [unit];
  const course = { id: 'ap2', title: '測試', classIds: ['A'], units };
  ctx.data.set('courses/ap2', { teacherIds: ['teacher'], rosterVersion: 2, draft: course, published: course });
  ctx.data.set('enrollments/ap2__fixture@example.edu', { classId: 'A', enabled: true });
  for (const u of units) {
    ctx.data.set(`banks/ap2_${u.id}_v1`, { count: 5, questionOptions: Object.fromEntries(ids.map(id => [id, ['a', 'b']])),
      questionSources: { q1: 's1', q2: 's1', q3: 's1', q4: 's2', q5: 's2' } });
    ctx.data.set(`banks/ap2_${u.id}_v1/grading/answers`, { answers: Object.fromEntries(ids.map(id => [id, 'a'])) });
  }
  return unit;
}
function attempt(id, { unitId = 'u', mode = 'quiz', full = true, questions = ids, wrong = [], score = 100 } = {}) {
  return { id, courseId: 'ap2', unitId, version: 'v1', mode, full, score, clientAt: 1, duration: 5,
    answers: questions.map(questionId => ({ questionId, selected: wrong.includes(questionId) ? 'b' : 'a', correct: true, seconds: 1 })) };
}
const send = a => submitAttempt.run({ auth: student, data: { attempt: a } });
function persisted(ctx, unitId = 'u') { return ctx.data.get(progressPath)?.units[unitId]; }
function noPass(ctx, result, unitId = 'u') {
  assert.equal(Object.hasOwn(result.progress.units[unitId], 'passedAt'), false);
  assert.equal(Object.hasOwn(persisted(ctx, unitId), 'passedAt'), false);
}
test('一般分類：低於門檻不寫；首次完整測驗剛好達標寫伺服器時間；更高分／重送不改 passedAt', async t => {
  const ctx = memoryDb();
  let now = start;
  t.mock.method(Date, 'now', () => now);
  try {
    seed(ctx);
    const low = await send(attempt('low', { wrong: ['q1', 'q2'], score: 100 }));
    assert.equal(low.attempt.score, 60);
    assert.equal(low.attempt.full, true);
    noPass(ctx, low);
    now += 1000;
    const first = await send(attempt('first', { wrong: ['q1'], score: 0 }));
    assert.equal(first.attempt.score, 80);
    assert.equal(first.progress.units.u.passedAt, now);
    assert.equal(persisted(ctx).passedAt, now);
    const passedAt = now;
    now += 1000;
    const higher = await send(attempt('higher'));
    assert.equal(higher.progress.units.u.best, 100);
    assert.equal(higher.progress.units.u.passedAt, passedAt);
    assert.equal(persisted(ctx).passedAt, passedAt);
    now += 1000;
    const duplicate = await send(attempt('higher'));
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.progress.units.u.passedAt, passedAt);
    assert.equal(persisted(ctx).passedAt, passedAt);
  } finally { ctx.restore(); }
});
for (const [label, options] of [
  ['閃卡（即使聲稱 full=true）', { mode: 'flashcard', full: true }],
  ['抽題（即使涵蓋全部題目）', { mode: 'quiz', full: false }],
  ['抽題（部分題目）', { mode: 'quiz', full: false, questions: ['q1', 'q2'] }],
  ['不完整測驗（偽稱 full=true）', { mode: 'quiz', full: true, questions: ['q1', 'q2'] }],
  ['錯題複習（即使聲稱 full=true）', { mode: 'review', full: true }],
]) test(`${label}：滿分也不寫 passedAt、不增加完整測驗最高分`, async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    const result = await send(attempt('practice', options));
    assert.equal(result.attempt.score, 100);
    noPass(ctx, result);
    assert.equal(persisted(ctx).best, -1);
    assert.equal(persisted(ctx).fullAttempts, 0);
  } finally { ctx.restore(); }
});
for (const mode of ['quiz', 'review']) test(`綜合練習 ${mode}：兩分類滿分均不寫 passedAt`, async () => {
  const ctx = memoryDb();
  try {
    seed(ctx, false, true);
    const result = await submitMixedAttempts.run({ auth: student, data: { attempts: [
      attempt('mixed-u', { mode, full: false }), attempt('mixed-v', { unitId: 'v', mode, full: false }),
    ] } });
    for (const unitId of ['u', 'v']) {
      noPass(ctx, result, unitId);
      assert.equal(persisted(ctx, unitId).best, -1);
      assert.equal(persisted(ctx, unitId).fullAttempts, 0);
    }
  } finally { ctx.restore(); }
});
test('複習考：不足 N 或配額錯誤即使滿分不達標；期限後抽滿 N／配額首次達標記逾期完成', async t => {
  const ctx = memoryDb();
  let now = start;
  t.mock.method(Date, 'now', () => now);
  try {
    const unit = seed(ctx, true);
    const short = await send(attempt('short', { questions: ['q1', 'q4', 'q5'] }));
    assert.equal(short.attempt.score, 100);
    assert.equal(short.attempt.full, false);
    noPass(ctx, short);
    const quota = await send(attempt('quota', { questions: ['q1', 'q2', 'q3', 'q4'] }));
    assert.equal(quota.attempt.full, false);
    noPass(ctx, quota);
    const low = await send(attempt('review-low', { questions: ['q1', 'q2', 'q4', 'q5'], wrong: ['q1'] }));
    assert.equal(low.attempt.full, true);
    assert.equal(low.attempt.score, 75);
    noPass(ctx, low);
    now += 1000;
    const full = await send(attempt('review-full', { questions: ['q1', 'q2', 'q4', 'q5'], full: false }));
    assert.equal(full.attempt.full, true, '由後端題數與配額判定完整作答');
    assert.equal(full.progress.units.u.passedAt, now);
    assert.equal(persisted(ctx).passedAt, now);
    assert.equal(isOverdue(unit, persisted(ctx)), true);
    const passedAt = now;
    now += 1000;
    const later = await send(attempt('review-later', { questions: ['q1', 'q2', 'q4', 'q5'] }));
    assert.equal(later.progress.units.u.passedAt, passedAt);
    assert.equal(persisted(ctx).passedAt, passedAt);
  } finally { ctx.restore(); }
});
