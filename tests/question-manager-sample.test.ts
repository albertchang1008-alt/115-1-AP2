import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sampleQuestionDiff,
  sampleFieldType,
  type SampleQuestion,
} from '../shared/questionManagerSample';
const q: SampleQuestion = {
  interaction: {
    slideId: 'sample-P01',
    title: '課堂活動',
    fields: [
      { id: 'f1', label: '選擇活動起點', kind: 'choice', options: ['閱讀題幹', '小組討論'] },
    ],
  },
  keys: { f1: { answer: '閱讀題幹', explanation: '先閱讀題幹。' } },
  rounds: 0,
  page: 1,
};
test('樣張差異預覽列出正解與解析的舊→新內容，保留原稿', () => {
  const next = structuredClone(q);
  next.keys.f1 = { answer: '小組討論', explanation: '先交換想法。' };
  assert.deepEqual(sampleQuestionDiff(q, next), [
    { label: '第 1 欄・正確答案', before: '閱讀題幹', after: '小組討論' },
    { label: '第 1 欄・解析', before: '先閱讀題幹。', after: '先交換想法。' },
  ]);
  assert.equal(q.keys.f1.answer, '閱讀題幹');
  assert.deepEqual(sampleQuestionDiff(q, q), []);
});
test('樣張將固定是非選項辨識為 choice，並顯示新增／刪除的差異', () => {
  assert.equal(
    sampleFieldType({ id: 'f1', label: '示範', kind: 'choice', options: ['○ 對', '✕ 錯'] }),
    '是非',
  );
  assert.equal(sampleQuestionDiff(undefined, q)[0].label, '新增整題');
  assert.equal(sampleQuestionDiff(q, undefined)[0].label, '刪除整題');
});
