import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patchQuestion, questionSnapshot } from '../shared/questionManager';
import { exportQuestionWorkbook } from '../src/questionWorkbook';
import { parseXlsxQuestionSheet } from '../src/pptImportFiles';
import type { Interaction, AnswerKeys } from '../shared/classroom';
const q: Interaction = {
  slideId: 'demo-P01',
  title: '活動標題',
  fields: [{ id: 'f1', label: '活動起點', kind: 'choice', options: ['閱讀', '討論'] }],
};
const keys: AnswerKeys = { 'demo-P01': { f1: { answer: '閱讀', explanation: '閱讀題幹。' } } };
const legacy: Interaction = { ...q, slideId: 'R-REV-04' };
const snapshot = questionSnapshot([q], keys, q.slideId);
test('單題 patch 保留順序、其他簡報、legacy、無關鍵；新增刪除只影響目標', () => {
  const list = [legacy, q, { ...q, slideId: 'other-P01' }],
    allKeys = { ...keys, 'R-REV-04': keys[q.slideId] };
  const next = { ...snapshot, interaction: { ...q, title: '修改標題' } };
  const saved = patchQuestion(list, allKeys, q.slideId, snapshot, next);
  assert.deepEqual(saved.interactions, [legacy, next.interaction, list[2]]);
  assert.deepEqual(saved.answerKeys, allKeys);
  const deleted = patchQuestion(saved.interactions, saved.answerKeys, q.slideId, next, {
    interaction: null,
    keys: {},
  });
  assert.deepEqual(deleted.interactions, [legacy, list[2]]);
  assert.equal(deleted.answerKeys[q.slideId], undefined);
  assert.deepEqual(
    patchQuestion([], {}, q.slideId, { interaction: null, keys: {} }, snapshot).interactions,
    [q],
  );
});
test('舊快照衝突、不合法 choice/order、局部變更是非選項、undefined、其他 slideId 拒絕', () => {
  assert.throws(
    () => patchQuestion([q], keys, q.slideId, { ...snapshot, keys: {} }, snapshot),
    /CONFLICT/,
  );
  for (const answer of ['不存在', ['閱讀', '閱讀']])
    assert.throws(() =>
      patchQuestion([q], keys, q.slideId, snapshot, {
        interaction: {
          ...q,
          fields: [{ ...q.fields[0], kind: Array.isArray(answer) ? 'order' : 'choice' }],
        },
        keys: { f1: { answer } },
      }),
    );
  assert.throws(
    () =>
      patchQuestion([q], keys, q.slideId, snapshot, {
        interaction: { ...q, fields: [{ ...q.fields[0], options: ['○ 對', '改掉'] }] },
        keys: { f1: { answer: '○ 對' } },
      }),
    /是非/,
  );
  assert.throws(
    () => patchQuestion([q], keys, q.slideId, snapshot, { interaction: legacy, keys: {} }),
    /目標/,
  );
  assert.throws(
    () =>
      patchQuestion([q], keys, q.slideId, snapshot, {
        ...snapshot,
        keys: { f1: { answer: '閱讀', explanation: undefined } },
      }),
    /undefined/,
  );
});
test('真正 xlsx bytes 經 #38 解析器 round-trip：choice/order/是非、多欄、特殊字、20選項、標題與解析', async () => {
  const order = {
    id: 'sequence',
    label: '排序 & <比較>',
    kind: 'order' as const,
    options: ['一', '二', '三'],
  };
  const many = {
    id: 'many',
    label: '更多選項',
    kind: 'choice' as const,
    options: Array.from({ length: 20 }, (_, i) => '選項' + i),
  };
  const item = {
    interaction: {
      ...q,
      fields: [
        q.fields[0],
        order,
        { id: 'tf', label: '確認', kind: 'choice' as const, options: ['○ 對', '✕ 錯'] },
        many,
      ],
    },
    keys: {
      ...keys[q.slideId],
      sequence: { answer: ['三', '一', '二'], explanation: '先後\n順序' },
      tf: { answer: '✕ 錯' },
      many: { answer: '選項19' },
    },
    rounds: 3,
    page: 1,
  };
  const result = await parseXlsxQuestionSheet(exportQuestionWorkbook([item]), 2, 'demo');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.interactions, [item.interaction]);
  assert.deepEqual(result.answerKeys, { [q.slideId]: item.keys });
});

test('#38正式匯入提交 questionRows 保留完整版欄位，與前端xlsx解析同結果', async () => {
  const { questionMatrix } = await import('../shared/questionWorkbook');
  const { parseQuestionTableRows } = await import('../shared/pptImport');
  const item = {
    interaction: { ...q, fields: [q.fields[0], { ...q.fields[0], id: 'f2', label: '第二欄' }] },
    keys: { ...keys[q.slideId], f2: { answer: '討論', explanation: '' } },
    rounds: 0,
    page: 1,
  };
  const matrix = questionMatrix([item]);
  const fromBackend = parseQuestionTableRows(
    matrix.slice(1).map((r, i) => ({ rowNumber: i + 2, managedCells: r })),
    2,
    'demo',
  );
  const fromXlsx = await parseXlsxQuestionSheet(exportQuestionWorkbook([item]), 2, 'demo');
  assert.deepEqual(fromBackend, fromXlsx);
  assert.deepEqual(fromBackend.interactions, [item.interaction]);
  assert.deepEqual(fromBackend.answerKeys, { [q.slideId]: item.keys });
});
