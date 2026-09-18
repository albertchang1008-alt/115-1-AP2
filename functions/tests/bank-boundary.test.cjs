// Runs the actual callable handlers against an in-memory database; no cloud connection.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
const handlers = require('../lib/functions/src/index.js');
const { getFirestore } = require('firebase-admin/firestore');
const { parseBankSheet } = require('../lib/shared/sheets.js');
test('區域 transaction 只以既有單元為基礎覆寫區域欄位，不複製其他草稿欄位', () => {
  const source = fs.readFileSync(require.resolve('../lib/functions/src/index.js'), 'utf8');
  assert.match(source, /return \{ \.\.\.unit, visibility: next, archiveLabel:/);
  assert.match(source, /published: update\(published\)/);
  assert.doesNotMatch(source, /published:\s*draft/);
});
test('答案表是私有批改資料，舊題庫 fallback 與綜合交卷均有防護', () => {
  const source = fs.readFileSync(require.resolve('../lib/functions/src/index.js'), 'utf8');
  assert.match(source, /collection\('grading'\)\.doc\('answers'\)/);
  assert.match(source, /if \(!gradingFallbackWarned\.has\(warningKey\)\)/, '每版本只警告一次');
  assert.match(source, /answersById\.get\(r\.questionId\) === r\.selected/, '前端 correct 不可參與批改');
  assert.match(source, /exports\.submitMixedAttempts/, '綜合交卷有專用入口');
  assert.match(source, /tx\.set\(progressRef/, '混合交卷只寫一次 progress');
  const mixed = source.slice(source.indexOf('exports.submitMixedAttempts = (0'), source.indexOf('exports.saveActivity = (0'));
  assert.match(mixed, /return db\.runTransaction/, '所有 mixed 寫入都由同一交易包覆，交易失敗不會提交半套資料');
  const getBank = source.slice(source.indexOf('exports.getBank'), source.indexOf('exports.getProgress'));
  assert.doesNotMatch(getBank, /grading/, 'getBank 不可回傳私有答案表');
});
test('題庫發布與 500 題交卷串接：留白題序、重送去重、超量拒絕', async () => {
  const db = getFirestore();
  const originals = { doc: db.doc, batch: db.batch, runTransaction: db.runTransaction };
  const data = new Map();
  const validate = (v) => {
    assert.notEqual(v, undefined, 'Firestore 文件不可包含 undefined');
    if (v && typeof v === 'object') Object.values(v).forEach(validate);
  };
  db.doc = (path) => ({
    path, id: path.split('/').at(-1),
    get: async () => ({ exists: data.has(path), data: () => data.get(path) }),
    collection: (name) => ({ doc: (id) => db.doc(`${path}/${name}/${id}`) }),
  });
  db.batch = () => {
    const writes = [];
    return { set(ref, value) { validate(value); writes.push([ref.path, value]); }, async commit() { writes.forEach(([path, value]) => data.set(path, value)); } };
  };
  db.runTransaction = async (fn) => {
    const writes = [];
    const result = await fn({ get: (ref) => ref.get(), create: (ref, value) => writes.push([ref.path, value]), set: (ref, value) => writes.push([ref.path, value]) });
    writes.forEach(([path, value]) => data.set(path, value)); return result;
  };
  try {
    const headers = ['課程代碼','題目ID','問題','選項A','選項B','正確答案代碼'];
    const rows = Array.from({ length: 500 }, (_, i) => ['ap2', 'q'.repeat(90) + i, '題目 ' + i, '甲', '乙', 'A']);
    const questions = parseBankSheet([headers, ...rows], 'unit01').get('ap2').get('unit01').questions;
    const course = { id:'ap2', classIds:['A'], units:[{ id:'unit01', opensAt:'', required:true }] };
    data.set('courses/ap2', { teacherIds:['teacher'], rosterVersion:2, draft:course, published:course });
    data.set('enrollments/ap2__student@ctcn.edu.tw', { email:'student@ctcn.edu.tw', studentId:'S1', classId:'A', enabled:true });
    const teacher = { uid:'teacher', token:{ teacher:true } };
    const bank = await handlers.publishQuestions.run({ auth:teacher, data:{ courseId:'ap2', unitId:'unit01', questions } });
    assert.equal(bank.count, 500);
    const repeatBank = await handlers.publishQuestions.run({ auth:teacher, data:{ courseId:'ap2', unitId:'unit01', questions:[...questions].reverse() } });
    assert.equal(repeatBank.version, bank.version, '列順序變動不產生新版本');
    const auth = { uid:'student', token:{ email:'student@ctcn.edu.tw', email_verified:true, firebase:{ sign_in_provider:'google.com' } } };
    const attempt = { id:'attempt1', courseId:'ap2', unitId:'unit01', version:bank.version, mode:'quiz', full:true, score:0, clientAt:Date.now(), duration:500, answers: questions.map((q) => ({ questionId:q.id, selected:'a', correct:false, seconds:1 })) };
    const result = await handlers.submitAttempt.run({ auth, data:{ attempt } });
    assert.equal(result.progress.units.unit01.best, 100);
    assert.equal(data.get('courses/ap2/attempts/attempt1').score, 100, '後端必須忽略竄改的前端 score/correct，依題庫正解批改');
    const repeated = await handlers.submitAttempt.run({ auth, data:{ attempt } });
    assert.equal(repeated.duplicate, true);
    assert.equal(repeated.progress.units.unit01.attempts, 1);
    await assert.rejects(handlers.submitAttempt.run({ auth, data:{ attempt:{ ...attempt, id:'too-many', answers:[...attempt.answers, { questionId:'extra', selected:'a', correct:true, seconds:1 }] } } }), /作答格式錯誤/);
    assert.equal(data.has('courses/ap2/attempts/too-many'), false);
  } finally { Object.assign(db, originals); }
});
