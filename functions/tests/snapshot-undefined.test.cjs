const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
const { createSnapshot, patchCourseDraft, buildReviewExam } = require('../lib/functions/src/index.js');
const { forClass } = require('../lib/shared/model.js');
const { memoryDb, noUndefined, serialize } = require('./helpers/snapshot-memory.cjs');
const teacher = { uid: 'teacher', token: { teacher: true, email: 'teacher@example.edu' } };
function course(legacy = false) {
  return { id: 'ap2', title: '測試課程', description: '', term: '115-1', sheetsUrl: '', classIds: ['A'],
    units: [{ id: 'u', title: '分類', group: 'chapter', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [] }],
    ...(legacy ? {} : { chapters: { chapter: { title: '單元', description: '', required: true, activities: [] } } }),
  };
}
for (const legacy of [false, true]) {
  test(`forClass 深層無 undefined，SDK 實際編碼（${legacy ? '舊課程推導' : '省略選填設定'}）`, () => {
    const shown = forClass(course(legacy), 'A');
    noUndefined(shown);
    serialize('snapshots/fixture', { course: shown });
    for (const field of ['research', ...(legacy ? [] : ['threshold', 'opensAt', 'dueAt'])])
      assert.equal(Object.hasOwn(shown.units[0], field), false, field);
  });
  test(`createSnapshot 真正 callable 寫入路徑可序列化（legacy=${legacy}）`, async () => {
    const ctx = memoryDb();
    try {
      const c = course(legacy);
      ctx.data.set('courses/ap2', { teacherIds: ['teacher'], rosterVersion: 2, draft: c, published: c });
      const result = await createSnapshot.run({ auth: teacher, data: { courseId: 'ap2', classId: 'A', snapshotId: 'snapshot' } });
      assert.equal(result.done, true);
      const saved = ctx.data.get('courses/ap2/snapshots/snapshot');
      noUndefined(saved);
      assert.deepEqual(saved.course, forClass(c, 'A'));
      assert.equal(saved.status, 'complete');
      assert(ctx.writes.some(w => w.proto.update.fields.course));
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        assert.match(process.env.FIRESTORE_EMULATOR_HOST, /^(127\.0\.0\.1|localhost):\d+$/);
        const { Firestore } = require('@google-cloud/firestore');
        const local = new Firestore({ projectId: 'demo-snapshot-fix', ignoreUndefinedProperties: false });
        const ref = local.doc(`snapshotRegression/legacy-${legacy}`);
        try {
          await ref.create(saved);
          assert.deepEqual((await ref.get()).data(), saved);
        } finally { await ref.delete(); await local.terminate(); }
      }
    } finally { ctx.restore(); }
  });
}
test('有值／班級覆寫／false／0／空字串完整保留；不回退到 Unit 舊值、不修改輸入', () => {
  const c = course(), before = structuredClone(c);
  c.units[0].research = { enabled: true };
  const absent = forClass(c, 'A');
  assert.equal(Object.hasOwn(absent.units[0], 'research'), false);
  delete c.units[0].research;
  assert.deepEqual(c, before);
  c.chapters.chapter = { ...c.chapters.chapter, research: { enabled: true }, threshold: 90, opensAt: '2026-10-01T08:00', dueAt: '2026-10-02T08:00' };
  c.chapterOverrides = { A: { chapter: { required: false, research: { enabled: false }, threshold: 0, opensAt: '', dueAt: '' } } };
  const input = structuredClone(c), shown = forClass(c, 'A');
  for (const field of ['required', 'research', 'threshold', 'opensAt', 'dueAt'])
    assert.deepEqual(shown.units[0][field], c.chapterOverrides.A.chapter[field]);
  const common = forClass(c, 'B');
  for (const field of ['research', 'threshold', 'opensAt', 'dueAt']) assert.deepEqual(common.units[0][field], c.chapters.chapter[field]);
  serialize('snapshots/fixture', { course: shown });
  assert.deepEqual(c, input);
});
test('同類寫入：patchCourseDraft 推導舊課程 Chapter 可通過 SDK 序列化', async () => {
  const ctx = memoryDb();
  try {
    ctx.data.set('courses/ap2', { teacherIds: ['teacher'], draft: course(true), revision: 0 });
    await patchCourseDraft.run({ auth: teacher, data: { courseId: 'ap2', expectedRevision: 0,
      requestId: '00000000-0000-4000-8000-000000000001', ops: [{ op: 'updateChapterSettings', chapter: 'chapter', patch: { threshold: 85 } }] } });
    const draft = ctx.data.get('courses/ap2').draft;
    noUndefined(draft);
    assert.equal(draft.chapters.chapter.threshold, 85);
  } finally { ctx.restore(); }
});

test('同類寫入：重建無 chapterOrder 的既有複習考不寫 undefined', async () => {
  const ctx = memoryDb();
  try {
    const c = course(true);
    c.units[0].bankVersion = 'v1';
    c.units.push({ id: 'exam', title: '複習考', group: 'exam', bankVersion: 'old', review: { history: [] } });
    ctx.data.set('courses/ap2', { teacherIds: ['teacher'], draft: c });
    ctx.data.set('banks/ap2_u_v1', { chunks: ['0'] });
    ctx.data.set('banks/ap2_u_v1/chunks/0', { questions: [{ id: 'q', text: '題目', options: [{ id: 'a', text: '甲' }, { id: 'b', text: '乙' }], answer: 'a', explanation: '' }] });
    await buildReviewExam.run({ auth: teacher, data: { courseId: 'ap2', name: 'exam', sourceUnitIds: ['u'], drawCount: 1 } });
    assert.equal(Object.hasOwn(ctx.data.get('courses/ap2').draft, 'chapterOrder'), false);
    assert.notEqual(ctx.data.get('courses/ap2').draft.units[1].bankVersion, 'old');
    noUndefined(ctx.data.get('courses/ap2'));
  } finally { ctx.restore(); }
});
