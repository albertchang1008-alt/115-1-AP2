const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^127\.0\.0\.1:\d+$/, 'Local Firestore emulator required');
const [root, label] = process.argv.slice(2);
assert(['before', 'after', 'same-input'].includes(label));
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-learning-cost' });
const load = createRequire(path.join(root, 'functions/package.json'));
const { saveLearningEvents } = load('./lib/functions/src/index.js');
const { readUsageRange } = load('./lib/functions/src/usageStats.js');
const { getFirestore } = load('firebase-admin/firestore');
const db = getFirestore();
const cases = JSON.parse(fs.readFileSync(0, 'utf8'));
const runId = require('node:crypto').randomUUID().slice(0, 8);
const epoch = Date.parse('2026-11-05T10:00:00+08:00');
const auth = {
  uid: 'fixture',
  token: { email: 'fixture@example.test', email_verified: true, firebase: { sign_in_provider: 'google.com' } },
};

// Observe the Admin SDK calls that reach the emulator. Missing document reads
// count once, and an empty query is counted at the one-read billing minimum.
let counts;
const docProto = Object.getPrototypeOf(db.doc('fixture/reference'));
const queryProto = Object.getPrototypeOf(db.collection('fixture').where('x', '==', 1));
const docGet = docProto.get, queryGet = queryProto.get, transact = db.runTransaction;
docProto.get = async function (...args) {
  if (counts) counts.reads++;
  return docGet.apply(this, args);
};
queryProto.get = async function (...args) {
  const snapshot = await queryGet.apply(this, args);
  if (counts) counts.reads += Math.max(1, snapshot.size);
  return snapshot;
};
db.runTransaction = function (fn, ...options) {
  return transact.call(this, async tx => {
    if (!counts) return fn(tx);
    counts.transactions++;
    const get = tx.get.bind(tx);
    tx.get = async ref => {
      const snapshot = await get(ref);
      counts.reads += Math.max(1, snapshot.size ?? 1);
      return snapshot;
    };
    for (const operation of ['set', 'create']) {
      const write = tx[operation].bind(tx);
      tx[operation] = (...args) => {
        counts.writes++;
        return write(...args);
      };
    }
    return fn(tx);
  }, ...options);
};

async function run(slug, trace) {
  const courseId = 'fixture-' + runId + '-' + label + '-' + slug;
  const activity = { id: 'material', type: 'html', tracking: 'interactive', materialVersion: slug };
  const unit = { id: 'unit', title: 'Synthetic unit', group: 'chapter', opensAt: '', activities: [] };
  const course = { id: courseId, classIds: ['A'], units: [unit], chapters: { chapter: { activities: [activity] } } };
  await db.doc('courses/' + courseId).set({ published: course, rosterVersion: 2 });
  await db.doc('enrollments/' + courseId + '__' + auth.token.email).set({
    uid: auth.uid, email: auth.token.email, name: 'Fixture', studentId: 'fixture', classId: 'A', enabled: true,
  });

  const realNow = Date.now;
  let result;
  counts = { reads: 0, writes: 0, transactions: 0 };
  try {
    for (const { offset, events } of trace) {
      Date.now = () => epoch + offset;
      result = await saveLearningEvents.run({
        auth, data: { courseId, unitId: unit.id, chapterName: 'chapter', activityId: activity.id, materialVersion: slug, events },
      });
      assert.deepEqual(result.accepted, events.map(e => e.id));
    }
  } finally {
    Date.now = realNow;
  }
  const ingest = counts;
  counts = { reads: 0, writes: 0, transactions: 0 };
  const usage = await readUsageRange(db, courseId, 'A', course, [{ uid: auth.uid }], epoch, epoch + 86400000);
  const stats = counts;
  counts = undefined;
  const diagnostic = db.doc('courses/' + courseId + '/diagnostics/fixture_chapter-chapter_material_' + slug);
  const saved = (await diagnostic.get()).data();
  assert.deepEqual(saved.summary, result.summary);
  const progress = (await db.doc('courses/' + courseId + '/progress/fixture').get()).data().activities['chapter:chapter_material'];
  assert.deepEqual(progress, { position: 1, completed: true });
  const events = trace.flatMap(x => x.events);
  return {
    calls: trace.length, events: events.length, timeEvents: events.filter(e => e.type === 'time').length,
    durationSeconds: trace.at(-1).offset / 1000,
    ingest, stats: { reads: stats.reads, legacyDocs: usage.reads.events, batchDocs: usage.reads.batches || 0, records: usage.records.length },
    summary: saved.summary, progress,
  };
}

async function verifyHistoryQueries() {
  const { saveLearningBatch } = load('./lib/functions/src/learningBatches.js');
  const { emptyLearning } = load('./lib/shared/learning.js');
  const ref = db.doc('courses/fixture-history-' + runId + '/diagnostics/fixture');
  const event = id => ({ id, type: 'hint', questionId: 'q' });
  const recentEventIds = Array.from({ length: 600 }, (_, i) => 'recent-' + i);
  await ref.set({ summary: { ...emptyLearning(), hints: 602 }, recentEventIds, hasLegacyLearningEvents: true });
  await ref.collection('events').doc('legacy').set({ ...event('legacy'), receivedAt: epoch });
  await ref.collection('batches').doc('old').set({ receivedAt: epoch, eventIds: ['old'], events: [event('old')], typeCounts: { hint: 1 } });
  const replay = await saveLearningBatch(db, ref, {}, ['legacy', 'old', recentEventIds[599], 'fresh'].map(event), () => {});
  assert.deepEqual(replay.accepted, ['legacy', 'old', recentEventIds[599], 'fresh']);
  assert.equal(replay.summary.hints, 603);
  const batches = await ref.collection('batches').get();
  assert.equal(batches.size, 2);
  assert(batches.docs.some(d => JSON.stringify(d.data().eventIds) === '["fresh"]'));
}

(async () => {
  const result = {};
  try {
    for (const [slug, trace] of Object.entries(cases)) result[slug] = await run(slug, trace);
    if (label === 'after') await verifyHistoryQueries();
    console.log(JSON.stringify(result));
  } finally {
    await db.terminate();
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
