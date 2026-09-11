import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forClass, completion, safeCode } from '../shared/model';
import { sampleCourse } from '../src/service';
import { parseBankSheet, parseRosterSheet } from '../shared/sheets';
import { emptyLearning, reduceLearning } from '../shared/learning';
test('班級可明確取消全部單元，必做與提供分開，來源不被更改', () => {
  const course = sampleCourse(); course.classUnits = { a: [], b: [course.units[0].id] };
  assert.equal(forClass(course, 'a').units.length, 0);
  assert.equal(forClass(course, 'b').units.length, 1);
  assert.equal(completion(forClass(course, 'a'), { units: {}, activities: {} }).total, 0);
  assert.ok(course.units.length);
});
test('v1.9 中文雙解析、圖片及空白選項保持正解代碼', () => {
  const groups = parseBankSheet([['課程代碼','題目ID','題型','問題','選項A','選項B','選項C','解答','解析','核心概念','① 先看題幹','圖片網址'],['anatomy','q1','圖片','問題','甲','','丙','C','完整解析','概念','線索','https://example.com/a.png']], 'unit01');
  const q = groups.get('anatomy')![0]; assert.equal(q.answer, 'c'); assert.equal(q.options[1].id, 'c'); assert.equal(q.socratic?.hint1, '線索'); assert.equal(q.questionType, 'image');
  assert.throws(() => parseBankSheet([['課程代碼','題目ID','問題','解答'],['a','q','','A']], 'unit01'));
});
test('同一學生可以跨課程，單一課程不能重複歸屬兩班', () => {
  const headers = ['課程代碼','班級代碼','學號','姓名','學校信箱','啟用'];
  const row = ['a','A','001','學生','student@ctcn.edu.tw','TRUE'];
  assert.equal(parseRosterSheet([headers, row, ['b', ...row.slice(1)]]).length, 2);
  assert.throws(() => parseRosterSheet([headers, row, ['a','B',...row.slice(2)]]));
});
test('重玩不覆蓋首次錯誤，通關不改變首次結果', () => {
  let s = reduceLearning(emptyLearning(), [{ id:'a',type:'answer',questionId:'q1',correct:false }]);
  s = reduceLearning(s, [{ id:'b',type:'answer',questionId:'q1',correct:true }, { id:'c',type:'completed' }]);
  assert.equal(s.completed, true); assert.equal(s.answers.q1.firstCorrect, false); assert.equal(s.answers.q1.attempts, 2);
  assert.throws(() => reduceLearning(s, [{ id:'d',type:'time',seconds:5000 }]));
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
    ['課程代碼', '題目ID', '題型', '問題', '選項A', '選項B', '解答'],
    ['解剖生理', 'q1', '單選', '細胞膜的主要成分？', '磷脂質', '澱粉', 'A'],
  ], '第一章細胞');
  assert.equal(groups.get('解剖生理')!.length, 1);
});
