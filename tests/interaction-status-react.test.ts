import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyInteractionStatus } from '../scripts/interaction-status-verify.mjs';
test('MI互動：常駐狀態／頁綁定確認／伺服器倒數與保留答案／加時／黑屏／1280及390與1.2字級', async () => {
  assert.equal((await verifyInteractionStatus()).length, 2);
});
