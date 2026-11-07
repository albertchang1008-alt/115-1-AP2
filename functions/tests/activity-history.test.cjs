// 1.15.6 看板「開啟／走完」紀錄：sessions、計數、首次完成、補登與教師專用查詢。
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-activity-history-test' });
const handlers = require('../lib/functions/src/index.js');
const { getFirestore } = require('firebase-admin/firestore');
const { memoryDb } = require('./helpers/reflection-memory.cjs');
const { saveLearningBatch } = require('../lib/functions/src/learningBatches.js');
const { emptyLearning, reduceLearning } = require('../lib/shared/learning.js');
const { SESSION_LIMIT, estimateSessions, BACKFILL_FROM, applySessionEvents } = require('../lib/shared/activityHistory.js');

const diag = 'courses/c/diagnostics/d';
const ev = (id, type, extra = {}) => ({ id, type, ...extra });
function sender(t) {
  const ctx = memoryDb();
  t.after(ctx.restore);
  const db = getFirestore(), calls = [];
  let clock = 1000;
  t.mock.method(Date, 'now', () => clock);
  const send = (events) => saveLearningBatch(db, db.doc(diag), { uid: 'u', unitId: 'unit', classId: 'A' }, events, (tx, at, info) => {
    calls.push(info);
    tx.set(db.doc('courses/c/progress/u'), { activityHistory: { k: info.history }, ...(info.completed ? { activities: { k: { position: 1, completed: true } } } : {}) }, { merge: true });
  });
  return { ctx, send, calls, tick: (ms) => { clock += ms; }, doc: () => ctx.data.get(diag) };
}

test('新 session 加一次開啟；同 session 多批次與重送不重複；完成只算一次；首次完成不被覆蓋', async (t) => {
  const s = sender(t);
  await s.send([ev('a1', 'explore', { nodeId: 'x-node-L1-p1', sid: 's1' })]);
  assert.deepEqual(s.calls.at(-1), { completed: false, newSession: true, history: { opens: 1, completions: 0, lastAt: 1000 } });
  s.tick(5000);
  await s.send([ev('a2', 'explore', { nodeId: 'x-node-L3-view', sid: 's1' }), ev('a1', 'explore', { nodeId: 'x-node-L1-p1', sid: 's1' })]);
  assert.equal(s.calls.length, 1, '同一次開啟的後續批次不寫 progress');
  assert.deepEqual(s.doc().sessions.s1, { startedAt: 1000, lastAt: 6000, maxLevel: 3 });
  s.tick(1000);
  await s.send([ev('done1', 'completed', { sid: 's1' })]);
  await s.send([ev('done2', 'completed', { sid: 's1' })]);
  assert.equal(s.doc().history.completions, 1, '同一次走完只算一次');
  assert.equal(s.doc().history.firstCompletedAt, 7000);
  s.tick(60000);
  await s.send([ev('b1', 'hint', { questionId: 'q', sid: 's2' })]);
  s.tick(1000);
  await s.send([ev('b2', 'completed', { sid: 's2' })]);
  assert.deepEqual(s.doc().history, { opens: 2, completions: 2, firstCompletedAt: 7000, lastAt: 67000 });
  assert.deepEqual(s.ctx.data.get('courses/c/progress/u').activityHistory.k, { opens: 2, completions: 2, firstCompletedAt: 7000, lastAt: 67000 });
  assert.equal(s.doc().sessions.s2.completedAt, 68000);
});

test('舊平台沒帶 sessionId：summary 與 1.15.5 相同、不記分次，只在完成時寫 progress', async (t) => {
  const s = sender(t);
  const events = [ev('h', 'hint', { questionId: 'q' }), ev('e', 'explore', { nodeId: 'n-L2-x' }), ev('c', 'completed')];
  const result = await s.send(events);
  assert.deepEqual(result.summary, reduceLearning(emptyLearning(), events));
  assert.equal(s.doc().sessions, undefined);
  assert.deepEqual(s.doc().history, { opens: 0, completions: 0, firstCompletedAt: 1000 });
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].completed, true);
  s.tick(10);
  await s.send([ev('h2', 'hint', { questionId: 'q' })]);
  assert.equal(s.calls.length, 1, '沒有新開啟也沒有完成時不多寫');
});

test('sessions 只留最近 50 次；maxLevel 解析不到就不寫', () => {
  let state;
  for (let i = 0; i < SESSION_LIMIT + 5; i++) state = applySessionEvents(state, [ev('x' + i, 'explore', { nodeId: 'plain-node', sid: 'sid' + i })], 100 + i);
  const keys = Object.keys(state.sessions);
  assert.equal(keys.length, SESSION_LIMIT);
  assert.equal(keys.includes('sid0'), false);
  assert.equal(state.history.opens, SESSION_LIMIT + 5);
  assert.equal('maxLevel' in state.sessions.sid54, false);
});

test('格式不合的 sessionId 整批拒收', async (t) => {
  const ctx = memoryDb();
  t.after(ctx.restore);
  const { validEvent } = require('../lib/shared/learning.js');
  assert.equal(validEvent(ev('a', 'completed', { sid: 'bad id' })), false);
  assert.equal(validEvent(ev('a', 'completed', { sid: 'x'.repeat(101) })), false);
  assert.equal(validEvent(ev('a', 'completed', { sid: 'c7f0a1d2-0b5e-4c1e-9d2a-1234567890ab' })), true);
});

test('補登：30 分鐘切分、完成判定與首次完成；11/04 前的不算', () => {
  const m = 60000, t0 = BACKFILL_FROM + 3600000;
  const { sessions, counters } = estimateSessions([
    { at: BACKFILL_FROM - 1, events: [{ type: 'completed' }] },
    { at: t0, events: [{ type: 'explore', nodeId: 'k-node-L1-p1' }] },
    { at: t0 + 29 * m, events: [{ type: 'explore', nodeId: 'k-node-L4-view' }] },
    { at: t0 + 60 * m, events: [{ type: 'explore', nodeId: 'k-node-L1-p1' }] },
    { at: t0 + 70 * m, events: [{ type: 'completed' }] },
  ]);
  assert.deepEqual(Object.keys(sessions), [`est-${t0}`, `est-${t0 + 60 * m}`]);
  assert.equal(sessions[`est-${t0}`].maxLevel, 4);
  assert.equal(sessions[`est-${t0}`].completedAt, undefined);
  assert.equal(sessions[`est-${t0 + 60 * m}`].completedAt, t0 + 70 * m);
  assert.deepEqual(counters, { opens: 2, completions: 1, firstCompletedAt: t0 + 70 * m, lastAt: t0 + 60 * m });
});

const teacher = { uid: 'teacher', token: { teacher: true, email: 't@example.edu' } };
const student = { uid: 'u', token: { email: 's@example.edu', email_verified: true, firebase: { sign_in_provider: 'google.com' } } };
function seedCourse(ctx) {
  const act = (id, materialVersion) => ({ id, type: 'html', title: id, phase: 'before', url: '', required: true, tracking: 'interactive', materialVersion, nodeTotal: 10, questionTotal: 5 });
  const course = { id: 'c', title: '測試', classIds: ['A'], units: [{ id: 'unit', title: '分類', group: '泌尿', threshold: 80, opensAt: '', dueAt: '', activities: [], required: true }],
    chapters: { 泌尿: { title: '泌尿', description: '', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [act('new', 'kidney-anatomy-ag1'), act('old', 'heart-structure-v2')] } } };
  ctx.data.set('courses/c', { teacherIds: ['teacher'], rosterVersion: 2, draft: course, published: course });
}

test('補登 callable：dryRun 不寫；正式執行保留真實 session；重跑不重複累加；學生不可呼叫', async (t) => {
  const ctx = memoryDb();
  t.after(ctx.restore);
  seedCourse(ctx);
  const t0 = BACKFILL_FROM + 3600000, docPath = 'courses/c/diagnostics/u_chapter-%E6%B3%8C%E5%B0%BF_new_kidney-anatomy-ag1';
  ctx.data.set(docPath, { uid: 'u', classId: 'A', unitId: 'unit', chapterName: '泌尿', activityId: 'new', materialVersion: 'kidney-anatomy-ag1',
    sessions: { real: { startedAt: t0 + 10 * 3600000, lastAt: t0 + 10 * 3600000 } }, history: { opens: 1, completions: 0, lastAt: t0 + 10 * 3600000 } });
  ctx.data.set(docPath + '/events/e1', { id: 'e1', type: 'explore', nodeId: 'k-node-L2-p1', receivedAt: t0 });
  ctx.data.set(docPath + '/batches/b1', { receivedAt: t0 + 5 * 60000, eventIds: ['e1', 'c1'], events: [{ id: 'e1', type: 'explore', nodeId: 'k-node-L2-p1' }, { id: 'c1', type: 'completed' }] });
  ctx.data.set(docPath + '/batches/b2', { receivedAt: t0 + 10 * 3600000, eventIds: ['r1'], events: [{ id: 'r1', type: 'explore', nodeId: 'k-node-L1-p1', sid: 'real' }] });
  ctx.data.set('courses/c/diagnostics/u_chapter-x_old_heart-structure-v2', { uid: 'u', materialVersion: 'heart-structure-v2', activityId: 'old', chapterName: '泌尿' });
  await assert.rejects(handlers.backfillActivityHistory.run({ auth: student, data: { courseId: 'c' } }));
  const dry = await handlers.backfillActivityHistory.run({ auth: teacher, data: { courseId: 'c' } });
  assert.deepEqual([dry.dryRun, dry.diagnostics, dry.students, dry.estimatedSessions, dry.estimatedCompletions, dry.writes], [true, 1, 1, 1, 1, 2]);
  assert.equal(ctx.data.get(docPath).backfill, undefined, 'dryRun 不寫入');
  await handlers.backfillActivityHistory.run({ auth: teacher, data: { courseId: 'c', dryRun: false } });
  const d = ctx.data.get(docPath);
  assert.deepEqual(Object.keys(d.sessions).sort(), [`est-${t0}`, 'real']);
  assert.equal(d.sessions[`est-${t0}`].completedAt, t0 + 5 * 60000);
  assert.deepEqual(ctx.data.get('courses/c/progress/u').activityHistory['chapter:泌尿_new'],
    { opens: 2, completions: 1, firstCompletedAt: t0 + 5 * 60000, lastAt: t0 + 10 * 3600000, estimated: true });
  const again = await handlers.backfillActivityHistory.run({ auth: teacher, data: { courseId: 'c', dryRun: false } });
  assert.equal(again.skipped, 1);
  await handlers.backfillActivityHistory.run({ auth: teacher, data: { courseId: 'c', dryRun: false, force: true } });
  assert.equal(ctx.data.get('courses/c/progress/u').activityHistory['chapter:泌尿_new'].opens, 2, '重跑不重複累加');
  const sessions = await handlers.getActivitySessions.run({ auth: teacher, data: { courseId: 'c', uid: 'u', chapterName: '泌尿', activityId: 'new' } });
  assert.deepEqual(sessions.sessions.map((s) => !!s.estimated), [true, false]);
  await assert.rejects(handlers.getActivitySessions.run({ auth: student, data: { courseId: 'c', uid: 'u', chapterName: '泌尿', activityId: 'new' } }));
});

test('逐次作答：只回時間、分數、模式、是否完整，依時間排序且最多 50 筆', async (t) => {
  const ctx = memoryDb();
  t.after(ctx.restore);
  seedCourse(ctx);
  for (let i = 0; i < 55; i++) ctx.data.set(`courses/c/attempts/a${i}`, { uid: 'u', unitId: 'unit', classId: 'A', clientAt: 1000 + (54 - i), score: i, mode: 'quiz', full: true, answers: [{ questionId: 'q', selected: 'a', correct: true }] });
  ctx.data.set('courses/c/attempts/other', { uid: 'v', unitId: 'unit', clientAt: 1, score: 1, mode: 'quiz', full: true });
  const r = await handlers.getStudentUnitAttempts.run({ auth: teacher, data: { courseId: 'c', uid: 'u', unitId: 'unit' } });
  assert.equal(r.rows.length, 50);
  assert.equal(r.total, 55);
  assert.equal(r.truncated, true);
  assert.deepEqual(Object.keys(r.rows[0]).sort(), ['clientAt', 'full', 'leftScreen', 'mode', 'score']);
  assert.ok(r.rows.every((x, i) => i === 0 || r.rows[i - 1].clientAt <= x.clientAt));
  await assert.rejects(handlers.getStudentUnitAttempts.run({ auth: student, data: { courseId: 'c', uid: 'u', unitId: 'unit' } }));
});
