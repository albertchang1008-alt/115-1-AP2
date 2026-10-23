import { approvedQuestionRewrites } from '../scripts/apply-script-question-rewrites.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { metrics } from '../scripts/lib/acidbase-full-browser.mjs';
test('full prototype has no dropdowns or modal feedback paths', () => {
  const source = fs.readFileSync(
    process.env.ACIDBASE_UX_SOURCE || 'materials-src/apply-kit/full.js',
    'utf8',
  );
  assert.doesNotMatch(source, /<select\b|showModal\s*\(|createElement\(['"]dialog/);
});
test('authored questions, options, diagnoses, citations, and canonical graph remain identical except the exact teacher-approved acid question rewrite', () => {
  for (const file of [
    'materials-src/acid-base-homeostasis/full.json',
    'materials-src/acid-base-homeostasis/apply.json',
    'materials-src/acid-base-homeostasis/content.json',
    'docs/classroom/mindmap-relay/acidbase.relay.json',
  ])
    if (file.endsWith('/full.json')) {
      const expected = JSON.parse(execFileSync('git', ['show', `6598178:${file}`]));
      for (const node of expected.nodes) delete node.micro;
      assert.deepEqual(
        JSON.parse(fs.readFileSync(file)),
        expected,
        file + ': only obsolete node.micro deletions are allowed',
      );
    } else if (file.endsWith('/apply.json')) {
      const expected = JSON.parse(execFileSync('git', ['show', `6598178:${file}`]));
      const draft = approvedQuestionRewrites().find(
        (d) => d.id === 'acid-base-homeostasis-case-q04',
      );
      const q = expected.learning.questions.cases.find((q) => (q.value || q).id === draft.id);
      Object.assign(q.value || q, {
        stem: draft.stem,
        options: draft.options,
        answer: draft.answer,
      });
      assert.deepEqual(
        JSON.parse(fs.readFileSync(file)),
        expected,
        'only the exact teacher-approved acid rewrite is allowed',
      );
    } else
      assert.deepEqual(
        fs.readFileSync(file),
        execFileSync('git', ['show', `6598178:${file}`]),
        file,
      );
});
test('layout audit detects screen-scaled SVG lettering below 14px', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent(
      '<svg width="200" height="100" viewBox="0 0 1000 500"><text x="10" y="60" font-size="30">小字</text></svg>',
    );
    const result = await metrics(page);
    assert.ok(result.small.some((r) => r.name === 'svg-text' && r.size < 14));
  } finally {
    await browser.close();
  }
});
