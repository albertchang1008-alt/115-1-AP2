import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
test('題目管理正式控制台瀏覽器：縮圖、差異、輪數、並發、xlsx、增刪與legacy', () => {
  const r = spawnSync(process.execPath, ['scripts/question-manager-verify.mjs'], {
    encoding: 'utf8',
    timeout: 120000,
  });
  assert.equal(r.status, 0, r.stdout + '\n' + r.stderr);
});
