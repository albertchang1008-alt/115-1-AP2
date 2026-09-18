// syncBankTabFromSheet 應該依 Sheet 內容自動建立缺少的單元，不要求老師先在
// 後台手動建一次；課程本身仍必須已存在（title/term/teacherIds 沒有合理預設值）。
// 用實際 syncBankTabFromSheet 配合記憶體資料庫測試，不連線正式資料庫。
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
const handlers = require('../lib/functions/src/index.js');
const { getFirestore } = require('firebase-admin/firestore');

function withMemoryDb() {
  const db = getFirestore();
  const originals = { doc: db.doc, batch: db.batch, runTransaction: db.runTransaction };
  const data = new Map();
  db.doc = (path) => ({
    path,
    id: path.split('/').at(-1),
    get: async () => ({ exists: data.has(path), data: () => data.get(path) }),
    collection: (name) => ({ doc: (id) => db.doc(`${path}/${name}/${id}`) }),
  });
  db.batch = () => {
    const writes = [];
    return {
      set(ref, value) { writes.push([ref.path, value]); },
      async commit() { writes.forEach(([path, value]) => data.set(path, value)); },
    };
  };
  db.runTransaction = async (txFn) => {
    const writes = [];
    const result = await txFn({
      get: (ref) => ref.get(),
      update: (ref, value) => writes.push([ref.path, { ...(data.get(ref.path) || {}), ...value }]),
      set: (ref, value) => writes.push([ref.path, value]),
    });
    writes.forEach(([path, value]) => data.set(path, value));
    return result;
  };
  return { data, restore: () => Object.assign(db, originals) };
}

test('次單元在課程草稿裡不存在時，同步會自動建立單元（依單元/次單元欄）', async () => {
  const ctx = withMemoryDb();
  try {
    const headers = ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'];
    const rows = [headers, ['ap2', 'q1', '血液', '紅血球與血紅素', '題目一', '甲', '乙', 'A']];
    ctx.data.set('courses/ap2', { teacherIds: ['teacher'], draft: { id: 'ap2', classIds: [], units: [] } });

    const results = await handlers.syncBankTabFromSheet(rows, '題庫', 'teacher');
    assert.equal(results.length, 1);
    assert.equal(results[0].error, undefined);
    assert.equal(results[0].created, true, '課程草稿原本沒有這個次單元，應該標記為新建立');

    const course = ctx.data.get('courses/ap2');
    const unit = course.draft.units.find((u) => u.id === '紅血球與血紅素');
    assert.ok(unit, '應該自動新增一個 id=次單元 的單元');
    assert.equal(unit.title, '紅血球與血紅素');
    assert.equal(unit.group, '血液', '單元欄應該寫進 Unit.group 純作分組顯示');
    assert.equal(unit.bankVersion, results[0].version);
    assert.equal(unit.required, true);
    assert.equal(unit.visibility, 'hidden', 'Sheet 新增的次單元必須先由教師看板開放');
    assert.equal(course.draft.classIds.length, 0, '不應該動到既有的班級設定');
  } finally { ctx.restore(); }
});

test('次單元已存在時，再次同步只更新版本與分組，不重複新增', async () => {
  const ctx = withMemoryDb();
  try {
    const headers = ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'];
    ctx.data.set('courses/ap2', {
      teacherIds: ['teacher'],
      draft: { id: 'ap2', classIds: ['A'], units: [{ id: 'u1', title: '舊標題', description: '', required: false, threshold: 60, opensAt: '', dueAt: '', bankVersion: 'old', activities: [] }] },
    });
    const rows = [headers, ['ap2', 'q1', '心臟', 'u1', '題目一', '甲', '乙', 'A']];

    const results = await handlers.syncBankTabFromSheet(rows, '題庫', 'teacher');
    assert.equal(results[0].created, false);
    const course = ctx.data.get('courses/ap2');
    assert.equal(course.draft.units.length, 1, '不應該多新增一筆');
    const unit = course.draft.units[0];
    assert.equal(unit.title, '舊標題', '既有欄位（老師自訂的標題、必修、門檻等）應該保留');
    assert.equal(unit.required, false);
    assert.equal(unit.group, '心臟', '單元欄應該更新既有單元的分組');
    assert.equal(unit.bankVersion, results[0].version);
    assert.equal(unit.visibility, undefined, '既有次單元的區域設定不可被同步覆寫');
  } finally { ctx.restore(); }
});

test('課程本身不存在時明確報錯，不會自動建立課程', async () => {
  const ctx = withMemoryDb();
  try {
    const headers = ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'];
    const rows = [headers, ['no-such-course', 'q1', '血液', 'u1', '題目一', '甲', '乙', 'A']];
    const results = await handlers.syncBankTabFromSheet(rows, '題庫', 'teacher');
    assert.match(results[0].error, /課程不存在/);
  } finally { ctx.restore(); }
});

test('非該課程授權教師時報錯，不會自動建立單元', async () => {
  const ctx = withMemoryDb();
  try {
    const headers = ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'];
    ctx.data.set('courses/ap2', { teacherIds: ['other-teacher'], draft: { id: 'ap2', classIds: [], units: [] } });
    const rows = [headers, ['ap2', 'q1', '血液', 'u1', '題目一', '甲', '乙', 'A']];
    const results = await handlers.syncBankTabFromSheet(rows, '題庫', 'teacher');
    assert.match(results[0].error, /未獲授權/);
    assert.equal(ctx.data.get('courses/ap2').draft.units.length, 0);
  } finally { ctx.restore(); }
});

test('以課程分頁同步時，表內舊課程代碼不可指向另一門課', async () => {
  const ctx = withMemoryDb();
  try {
    const headers = ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'];
    const rows = [headers, ['other-course', 'q1', '血液', 'u1', '題目一', '甲', '乙', 'A']];
    ctx.data.set('courses/ap2', { teacherIds: ['teacher'], draft: { id: 'ap2', classIds: [], units: [] } });
    const results = await handlers.syncBankTabFromSheet(rows, 'ap2', 'teacher', 'ap2');
    assert.match(results[0].error, /課程代碼.*不一致/);
    assert.equal(ctx.data.get('courses/ap2').draft.units.length, 0, '不得留下跨課程的題庫或單元寫入');
  } finally { ctx.restore(); }
});

test('版本未變仍會補建 Chapter，之後的新單元會 append 到 chapterOrder', async () => {
  const ctx = withMemoryDb();
  try {
    const headers = ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'];
    const first = [headers, ['ap2', 'q1', '血液', '紅血球', '題目一', '甲', '乙', 'A']];
    ctx.data.set('courses/ap2', { teacherIds: ['teacher'], draft: { id: 'ap2', classIds: [], units: [] } });
    const initial = await handlers.syncBankTabFromSheet(first, '題庫', 'teacher');
    const saved = ctx.data.get('courses/ap2');
    saved.draft.chapters = {};
    saved.draft.chapterOrder = [];
    ctx.data.set('courses/ap2', saved);
    await handlers.syncBankTabFromSheet(first, '題庫', 'teacher');
    assert.ok(ctx.data.get('courses/ap2').draft.chapters['血液'], '同版題庫仍須補建 Chapter');
    const next = [headers, ['ap2', 'q1', '血液', '紅血球', '題目一', '甲', '乙', 'A'], ['ap2', 'q2', '心臟', '心音', '題目二', '甲', '乙', 'B']];
    await handlers.syncBankTabFromSheet(next, '題庫', 'teacher');
    assert.deepEqual(ctx.data.get('courses/ap2').draft.chapterOrder, ['血液', '心臟']);
    assert.equal(initial[0].error, undefined);
  } finally { ctx.restore(); }
});

test('同步把 Sheet 已移除的分類保存為 staleUnits，供教師 UI 確認清理', async () => {
  const ctx = withMemoryDb();
  try {
    const headers = ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'];
    ctx.data.set('courses/ap2', { teacherIds: ['teacher'], draft: { id: 'ap2', classIds: [], units: [{ id: '舊分類', title: '舊分類', group: '舊單元', required: true, threshold: 80, opensAt: '', dueAt: '', bankVersion: 'old', activities: [] }] } });
    const result = await handlers.syncBankTabFromSheet([headers, ['ap2', 'q1', '血液', '紅血球', '題目', '甲', '乙', 'A']], '題庫', 'teacher');
    assert.deepEqual(result[0].staleUnits, ['舊分類']);
    assert.deepEqual(ctx.data.get('courses/ap2').draft.staleUnits, ['舊分類']);
  } finally { ctx.restore(); }
});
