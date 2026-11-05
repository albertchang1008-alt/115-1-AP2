const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-learning-batches-test' });
require('../lib/functions/src/index.js');
const { getFirestore } = require('firebase-admin/firestore');
const { memoryDb } = require('./helpers/reflection-memory.cjs');
const { saveLearningBatch, RECENT_LEARNING_EVENT_LIMIT } = require('../lib/functions/src/learningBatches.js');
const { positiveCache } = require('../lib/functions/src/learningAccessCache.js');
const { readUsageRange } = require('../lib/functions/src/usageStats.js');
const { emptyLearning, reduceLearning } = require('../lib/shared/learning.js');

const diag = 'courses/c/diagnostics/d';
const hint = (id) => ({ id, type: 'hint', questionId: 'q' });
const send = (db, events, onComplete = () => {}) =>
  saveLearningBatch(db, db.doc(diag), { uid: 'u', unitId: 'unit', classId: 'A' }, events, onComplete);

test('same batch, duplicate in a batch, and cross-batch replay are acknowledged once in the summary', async (t) => {
  const ctx = memoryDb();
  t.after(ctx.restore);
  const db = getFirestore(), a = hint('a'), b = hint('b');
  const completed = { id: 'done', type: 'completed' };
  const complete = (tx, at) => tx.set(db.doc('courses/c/progress/u'), { completed: true, at });
  assert.deepEqual((await send(db, [a, a, completed], complete)).accepted, ['a', 'a', 'done']);
  const firstWrites = ctx.writes.length;
  assert.equal(firstWrites, 3);
  await send(db, [a, a, completed], complete);
  assert.equal(ctx.writes.length, firstWrites);
  const result = await send(db, [a, b, completed], complete);
  assert.deepEqual(result.accepted, ['a', 'b', 'done']);
  assert.deepEqual(result.summary, reduceLearning(emptyLearning(), [a, completed, b]));
  assert.equal(ctx.writes.length, firstWrites + 2);
  assert.deepEqual(ctx.writes.filter(w => w.ref.path.includes('/batches/')).map(w => w.v.typeCounts), [
    { hint: 1, completed: 1 }, { hint: 1 },
  ]);
  assert.equal(ctx.writes.filter(w => w.ref.path.includes('/events/')).length, 0);
});

test('a receipt evicted from the 600-ID window and a pre-deploy receipt are not counted twice', async (t) => {
  const ctx = memoryDb();
  t.after(ctx.restore);
  const db = getFirestore(), legacy = hint('legacy');
  ctx.data.set(diag, { summary: reduceLearning(emptyLearning(), [legacy]) });
  ctx.data.set(diag + '/events/legacy', { ...legacy, receivedAt: 123 });
  const all = Array.from({ length: RECENT_LEARNING_EVENT_LIMIT + 1 }, (_, i) => hint('h' + i));
  for (let i = 0; i < all.length; i += 30) await send(db, all.slice(i, i + 30));
  assert.equal(ctx.data.get(diag).recentEventIds.length, 600);
  assert.equal(ctx.data.get(diag).recentEventIds.includes(all[0].id), false);
  const before = ctx.writes.length;
  const result = await send(db, [legacy, all[0], all.at(-1)]);
  assert.deepEqual(result.accepted, ['legacy', all[0].id, all.at(-1).id]);
  assert.equal(result.summary.hints, 602);
  assert.equal(ctx.writes.length, before);
});

test('usage reads legacy events and one record per batch, ignoring duplicated IDs and out-of-range data', async (t) => {
  const ctx = memoryDb();
  t.after(ctx.restore);
  const db = getFirestore();
  ctx.data.set(diag, { uid: 'u', unitId: 'unit', classId: 'A', updatedAt: 199 });
  ctx.data.set(diag + '/events/legacy', { receivedAt: 105 });
  ctx.data.set(diag + '/events/old', { receivedAt: 99 });
  ctx.data.set(diag + '/batches/overlap', { receivedAt: 110, eventIds: ['legacy'] });
  ctx.data.set(diag + '/batches/mixed', { receivedAt: 115, eventIds: ['legacy', 'fresh', 'fresh-2'] });
  ctx.data.set(diag + '/batches/late', { receivedAt: 200, eventIds: ['late'] });
  const out = await readUsageRange(db, 'c', 'A', { units: [{ id: 'unit' }] }, [{ uid: 'u' }], 100, 200);
  assert.deepEqual(out.records.map(x => x.at), [105, 115]);
  assert.deepEqual(out.reads, { attempts: 0, diagnostics: 1, events: 1, batches: 2, progress: 0 });
});

test('positive access cache expires without refreshing on hits and does not cache a failed membership', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1000 });
  const course = positiveCache(60000, 32), member = positiveCache(300000, 32);
  assert.equal(await member('a', async () => undefined), undefined);
  assert.equal(await member('a', async () => 'allowed'), 'allowed');
  assert.equal(await course('c', async () => 'old'), 'old');
  t.mock.timers.tick(59999);
  assert.equal(await course('c', async () => 'new'), 'old');
  t.mock.timers.tick(1);
  assert.equal(await course('c', async () => 'new'), 'new');
  assert.equal(await member('a', async () => undefined), 'allowed');
  t.mock.timers.tick(240000);
  assert.equal(await member('a', async () => undefined), undefined);
});
