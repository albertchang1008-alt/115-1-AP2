import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forClass, completion, safeCode, validateRoster } from '../shared/model';
import { sampleCourse } from '../src/service';
import { looksLikeBankSheet, parseBankSheet, parseRosterSheet } from '../shared/sheets';
import { emptyLearning, reduceLearning } from '../shared/learning';
test('班級可明確取消全部單元，必做與提供分開，來源不被更改', () => {
  const course = sampleCourse(); course.classUnits = { a: [], b: [course.units[0].id] };
  assert.equal(forClass(course, 'a').units.length, 0);
  assert.equal(forClass(course, 'b').units.length, 1);
  assert.equal(completion(forClass(course, 'a'), { units: {}, activities: {} }).total, 0);
  assert.ok(course.units.length);
});
test('中文雙解析、圖片及空白選項保持正確答案代碼', () => {
  const groups = parseBankSheet([['課程代碼','題目ID','題型','問題','選項A','選項B','選項C','正確答案代碼','解析','核心概念','① 先看題幹','圖片網址'],['anatomy','q1','圖片','問題','甲','','丙','C','完整解析','概念','線索','https://example.com/a.png']], 'unit01');
  const q = groups.get('anatomy')!.get('unit01')!.questions[0]; assert.equal(q.answer, 'c'); assert.equal(q.options[1].id, 'c'); assert.equal(q.socratic?.hint1, '線索'); assert.equal(q.questionType, 'image');
  assert.throws(() => parseBankSheet([['課程代碼','題目ID','問題','正確答案代碼'],['a','q','','A']], 'unit01'));
});
test('單一分頁可依「次單元」拆成多個題庫，「單元」欄只是分組標籤', () => {
  const rows = [
    ['課程代碼', '題目ID', '單元', '次單元', '題序', '問題', '選項A', '選項B', '正確答案代碼', '啟用'],
    ['ap2', 'q1', '血液', '紅血球', '2', '問題一', '甲', '乙', 'A', ''],
    ['ap2', 'q2', '血液', '紅血球', '1', '問題二', '甲', '乙', 'B', ''],
    ['ap2', 'q3', '血液', '白血球', '', '問題三', '甲', '乙', 'A', ''],
    ['ap2', 'q4', '', '白血球', '', '問題四', '甲', '乙', 'A', 'FALSE'],
  ];
  const groups = parseBankSheet(rows, '題庫');
  const course = groups.get('ap2')!;
  assert.deepEqual([...course.keys()].sort(), ['白血球', '紅血球']);
  assert.equal(course.get('紅血球')!.group, '血液');
  assert.equal(course.get('紅血球')!.questions.length, 2);
  assert.equal(course.get('紅血球')!.questions[0].order, 2);
  // 白血球第二列「單元」欄空白，沿用第一列已填的「血液」，不算衝突
  assert.equal(course.get('白血球')!.group, '血液');
  // 啟用＝FALSE 的列直接略過，不進題庫
  assert.equal(course.get('白血球')!.questions.length, 1);
});
test('課程代碼分頁可讀正式題庫欄位，不要求每列重複課程代碼', () => {
  const rows = [
    ['題庫', '序號', '題目ID', '單元', '次單元', '題目', '正確答案代碼', 'Zuvio解答', '選項A', '選項B', '③對答案'],
    ['Q1', '7', '2543795', '心臟', '心動週期與心音', '第一心音由何者產生？', 'B', 'B', '半月瓣關閉', '房室瓣關閉', '答案是房室瓣關閉。'],
  ];
  assert.ok(looksLikeBankSheet(rows));
  const groups = parseBankSheet(rows, '115-1-AP2', '115-1-AP2');
  const q = groups.get('115-1-AP2')!.get('心動週期與心音')!.questions[0];
  assert.equal(q.id, '2543795');
  assert.equal(q.answer, 'b');
  assert.equal(q.order, 7);
  assert.equal(q.socratic?.decide, '答案是房室瓣關閉。');
});
test('Zuvio解答不會影響平台使用正確答案代碼', () => {
  const rows = [
    ['題庫', '題目ID', '單元', '題目', '正確答案代碼', 'Zuvio解答', '選項A', '選項B'],
    ['', '1', '課程簡介', '題目一', 'B', 'A', '錯誤選項', '正確選項'],
  ];
  const q = parseBankSheet(rows, '115-1-AP2', '115-1-AP2').get('115-1-AP2')!.get('115-1-AP2')!.questions[0];
  assert.equal(q.answer, 'b');
});
test('同一次單元的「單元」欄填了不同值要報錯', () => {
  const rows = [
    ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'],
    ['ap2', 'q1', '血液', '紅血球', '問題一', '甲', '乙', 'A'],
    ['ap2', 'q2', '心臟', '紅血球', '問題二', '甲', '乙', 'A'],
  ];
  assert.throws(() => parseBankSheet(rows, '題庫'), /同時出現在單元/);
});
test('沒有「次單元」欄時，退回用分頁名當單元（向後相容）', () => {
  const groups = parseBankSheet([
    ['課程代碼', '題目ID', '問題', '選項A', '選項B', '正確答案代碼'],
    ['ap2', 'q1', '問題一', '甲', '乙', 'A'],
  ], 'unit01');
  assert.equal(groups.get('ap2')!.get('unit01')!.questions.length, 1);
});
test('同一學生可以跨課程，單一課程不能重複歸屬兩班', () => {
  const headers = ['課程代碼','班級代碼','學號','姓名','學校信箱','啟用'];
  const row = ['a','A','001','學生','student@ctcn.edu.tw','TRUE'];
  assert.equal(parseRosterSheet([headers, row, ['b', ...row.slice(1)]]).length, 2);
  assert.throws(() => parseRosterSheet([headers, row, ['a','B',...row.slice(2)]]));
});
test('班級名冊可由單一課程分頁推得課程代碼與授課班級', () => {
  const rows = parseRosterSheet([
    ['授課班級', '學號', '姓名', 'Gmail'],
    ['護525', '001', '學生甲', 'student@ctcn.edu.tw'],
  ], [], '115-1-AP2');
  assert.deepEqual(rows[0], { courseId: '115-1-AP2', classId: '護525', studentId: '001', name: '學生甲', email: 'student@ctcn.edu.tw', enabled: true });
});
test('重玩不覆蓋首次錯誤，通關不改變首次結果', () => {
  let s = reduceLearning(emptyLearning(), [{ id:'a',type:'answer',questionId:'q1',correct:false }]);
  s = reduceLearning(s, [{ id:'b',type:'answer',questionId:'q1',correct:true }, { id:'c',type:'completed' }]);
  assert.equal(s.completed, true); assert.equal(s.answers.q1.firstCorrect, false); assert.equal(s.answers.q1.attempts, 2);
  assert.throws(() => reduceLearning(s, [{ id:'d',type:'time',seconds:5000 }]));
});
test('逐圖卡停留時間累計，並保留每題所有嘗試次數', () => {
  const s = reduceLearning(emptyLearning(), [
    { id:'node-1', type:'node_time', nodeId:'blood-composition-rbc', seconds:15 },
    { id:'node-2', type:'node_time', nodeId:'blood-composition-rbc', seconds:9 },
    { id:'answer-1', type:'answer', questionId:'q1', correct:false },
    { id:'answer-2', type:'answer', questionId:'q1', correct:true },
  ]);
  assert.equal(s.nodeSeconds['blood-composition-rbc'], 24);
  assert.equal(s.answers.q1.firstCorrect, false);
  assert.equal(s.answers.q1.attempts, 2);
});
test('課程、單元、班級代碼可用中文，仍拒絕空白與符號', () => {
  for (const v of ['護525', '解剖生理115-1', 'anatomy_1', '護理一甲']) assert.ok(safeCode(v), v);
  for (const v of ['', '護 525', '護/525', '護.525', '護525！', 'a'.repeat(51)]) assert.ok(!safeCode(v), v);
  const rows = parseRosterSheet([
    ['課程代碼', '班級代碼', '學號', '姓名', '學校信箱', '啟用'],
    ['解剖生理', '護525', '001', '學生', 'student@ctcn.edu.tw', 'TRUE'],
  ]);
  assert.equal(rows[0].classId, '護525');
  assert.equal(rows[0].courseId, '解剖生理');
  const groups = parseBankSheet([
    ['課程代碼', '題目ID', '題型', '問題', '選項A', '選項B', '正確答案代碼'],
    ['解剖生理', 'q1', '單選', '細胞膜的主要成分？', '磷脂質', '澱粉', 'A'],
  ], '第一章細胞');
  assert.equal(groups.get('解剖生理')!.get('第一章細胞')!.questions.length, 1);
});
test('2026-09-15 起名冊信箱不再限制網域，但仍要求基本格式', () => {
  const row = { courseId: 'a', classId: 'A', studentId: 'T001', name: '測試學生', email: 'tester@example.com', enabled: true };
  assert.equal(validateRoster([row]).length, 0);
  assert.equal(validateRoster([{ ...row, email: 'student@ctcn.edu.tw' }]).length, 0);
  assert.equal(validateRoster([{ ...row, email: 'not-an-email' }]).length, 1);
});

test('題序留白不把 undefined 寫入 Firestore；錯誤題序明確指出列號', () => {
  const headers = ['課程代碼', '題目ID', '問題', '選項A', '選項B', '正確答案代碼', '題序'];
  const row = ['ap2', 'q1', '問題', '甲', '乙', 'A', ''];
  const q = parseBankSheet([headers, row], 'unit01').get('ap2')!.get('unit01')!.questions[0];
  assert.equal(Object.hasOwn(q, 'order'), false);
  assert.deepEqual(q, JSON.parse(JSON.stringify(q)));
  assert.throws(() => parseBankSheet([headers, [...row.slice(0, -1), '不是數字']], 'unit01'), /第 2 列題序/);
});
