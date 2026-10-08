// 名冊以試算表為準：同一學號換信箱時，選課資料自動搬到新信箱；互換信箱等不明情況仍擋下。
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
const { importRoster } = require('../lib/functions/src/index.js');
const { getFirestore } = require('firebase-admin/firestore');

function memoryDb() {
  const db = getFirestore(), originals = { doc: db.doc, runTransaction: db.runTransaction };
  const data = new Map();
  const ref = (path) => ({ path, get: async () => ({ id: path.split('/').at(-1), exists: data.has(path), data: () => data.get(path) }), set: async (v) => data.set(path, v) });
  db.doc = ref;
  db.runTransaction = async (fn) => {
    const writes = [];
    const result = await fn({ get: (r) => r.get(), set: (r, v) => writes.push(() => data.set(r.path, v)), update: (r, v) => writes.push(() => data.set(r.path, { ...data.get(r.path), ...v })), delete: (r) => writes.push(() => data.delete(r.path)) });
    writes.forEach((w) => w());
    return result;
  };
  return { data, restore: () => Object.assign(db, originals) };
}
const teacher = { uid: 'teacher', token: { teacher: true, email: 't@example.edu' } };
const C = 'AP2';
function seed(ctx) {
  ctx.data.set(`courses/${C}`, { rosterVersion: 2, teacherIds: ['teacher'], draft: { id: C, title: C, classIds: ['A'], units: [] } });
  ctx.data.set(`enrollments/${C}__s1@school.edu`, { courseId: C, classId: 'A', studentId: 's1', name: '林同學', email: 's1@school.edu', enabled: true });
  ctx.data.set(`courses/${C}/studentIds/s1`, { email: 's1@school.edu' });
}
const row = (email, studentId = 's1') => ({ classId: 'A', studentId, name: '林同學', email, enabled: true });

test('同一學號換信箱：舊信箱選課刪除、新信箱建立、學號改指新信箱', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    const r = await importRoster.run({ auth: teacher, data: { courseId: C, rows: [row('s1@gmail.com')] } });
    assert.equal(r.emailChanged, 1);
    assert.equal(ctx.data.has(`enrollments/${C}__s1@school.edu`), false);
    assert.equal(ctx.data.get(`enrollments/${C}__s1@gmail.com`).studentId, 's1');
    assert.equal(ctx.data.get(`courses/${C}/studentIds/s1`).email, 's1@gmail.com');
    const again = await importRoster.run({ auth: teacher, data: { courseId: C, rows: [row('s1@gmail.com')] } });
    assert.equal(again.changed, false);
    assert.equal(again.emailChanged, 0);
  } finally { ctx.restore(); }
});
test('舊信箱仍在名冊中（疑似互換）時擋下，不改任何資料', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    await assert.rejects(importRoster.run({ auth: teacher, data: { courseId: C, rows: [row('s1@gmail.com'), row('s1@school.edu', 's2')] } }), /此課程學號已屬於其他信箱：s1/);
    assert.equal(ctx.data.has(`enrollments/${C}__s1@school.edu`), true);
    assert.equal(ctx.data.has(`enrollments/${C}__s1@gmail.com`), false);
  } finally { ctx.restore(); }
});
test('舊信箱的選課學號不一致時擋下', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    ctx.data.set(`enrollments/${C}__s1@school.edu`, { courseId: C, classId: 'A', studentId: 'other', name: 'X', email: 's1@school.edu', enabled: true });
    await assert.rejects(importRoster.run({ auth: teacher, data: { courseId: C, rows: [row('s1@gmail.com')] } }), /學號不一致/);
  } finally { ctx.restore(); }
});
