import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyCompletionBoard } from '../scripts/completion-board-verify.mjs';
test('完成度看板React：兩層導航、格子明細、快取、覆寫一致性、篩選CSV、既有StudentDetail及更新失敗', async () => {
  const results = await verifyCompletionBoard();
  assert.equal(results.length, 2);
});
