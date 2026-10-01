import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProgressUnitCard } from '../src/Student';
import { studentNameFixture, NameScenario } from './fixtures/student-name';

function render(state: NameScenario, required = true, name = '王小明') {
  const { row, progress } = studentNameFixture(state, required, name);
  return renderToStaticMarkup(createElement(ProgressUnitCard, { index: 1, row, progress, route: () => {}, studentName: name }));
}

test('已完成與逾期完成卡顯示本人姓名，姓名緊接在完成標籤下方', () => {
  for (const state of ['done', 'late'] as const) {
    const html=render(state);
    assert.match(html, state === 'late' ? /已完成（逾期）/ : /已完成/);
    assert.match(html, /class="progress-status-stack"><span class="status status-done">[^<]+<\/span><span class="status completion-student-name"/);
    assert.match(html, /aria-label="學生姓名：王小明">王小明<\/span>/);
  }
});
test('進行中、未開始、逾期未完成與鎖定卡都不顯示姓名', () => {
  for (const state of ['inProgress','todo','overdue','locked'] as const) {
    const html=render(state);
    assert.doesNotMatch(html, /completion-student-name|王小明/);
  }
});
test('完成但沒有姓名不顯示空標籤；有姓名去頭尾空白並以文字呈現', () => {
  assert.doesNotMatch(render('done',true,'   '),/completion-student-name/);
  assert.match(render('done',true,' 王小明 '),/title="王小明"/);
  assert.match(render('done',true,'<學生>'),/&lt;學生&gt;/);
  assert.match(render('done',true,'預覽學生'),/學生姓名：預覽學生/);
});
test('選看單元也在確實完成後顯示姓名，空必做集合不誤當看完', () => {
  assert.match(render('done',false),/已完成.*completion-student-name.*王小明/);
  for (const state of ['inProgress','todo','overdue','locked'] as const) assert.doesNotMatch(render(state,false),/completion-student-name|王小明/);
});
