import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { checkStrictRetry } from '../scripts/acidbase-strict-retry-check.mjs';
for (const route of ['step', 'node', 'trace'])
  test(`strict retry: ${route} clears the entire scope, blocks correction and changes option order`, async () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'acidbase-strict-'));
    try {
      const r = await checkStrictRetry(out, { shots: false, route });
      assert.equal(r.pass, true, JSON.stringify(r.results.filter((r) => !r.pass)));
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });
