import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyReflection } from '../scripts/reflection-verify.mjs';
test('反思React＋實際callable：建活動、發布、作答、修改、草稿、唯讀、教師彙整CSV與預覽隔離（1280／390）', async () => {
  assert.equal((await verifyReflection()).length, 2);
});
