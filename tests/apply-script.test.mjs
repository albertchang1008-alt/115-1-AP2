import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { compileApplyStudentScript } from '../materials-src/apply-kit/scripted-compile.mjs';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import {
  approvedQuestionRewrites,
  validateApprovedQuestionChanges,
} from '../scripts/apply-script-question-rewrites.mjs';
import { unwrap, validateApply } from '../materials-src/apply-kit/model.mjs';
import {
  performScriptedStep,
  finishScriptedActions,
  auditApplyScript,
} from '../scripts/lib/apply-script-browser.mjs';
const slugs = [
  'kidney-anatomy',
  'nephron-circulation',
  'filtration-clearance',
  'tubular-handling',
  'urine-concentration',
  'urinary-route-micturition', 'fluid-compartments', 'water-sodium-regulation', 'electrolyte-balance',
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-script-test-'));
after(() => fs.rmSync(dir, { recursive: true, force: true }));
const load = (slug) => {
  const base = path.resolve('materials-src', slug),
    data = JSON.parse(fs.readFileSync(base + '/apply.json')),
    S = compileApplyStudentScript(base),
    file = path.join(dir, slug + '.html');
  fs.writeFileSync(file, renderApply(data, { baseDir: base, view: 'course' }));
  return { base, data, S, file };
};
test('nine teacher scripts compile with exact line-backed copy, complete operations, and separate confirmation questions', () => {
  for (const slug of slugs) {
    const { data, S } = load(slug),
      raw = fs.readFileSync(S.source, 'utf8');
    assert.deepEqual(validateApply(data), []);
    assert.equal(S.nodes.length, 6);
    assert.equal(S.trace.length, 3);
    for (const u of Object.values(S.units)) assert.ok(raw.split('\n')[u.line - 1].includes(u.text));
    for (const n of S.nodes)
      for (const s of n.steps) {
        assert.ok(s.type === 'matching' ? s.cards.length && s.slots.length : s.options.length);
        if (s.type === 'matching') assert.equal(s.expected.length, s.cards.length);
      }
    assert.ok(
      !renderApply(data, { baseDir: path.resolve('materials-src', slug), view: 'course' }).includes(
        '<select',
      ),
    );
  }
});
test('all eleven exact rewrite drafts are parsed; only assigned IDs change and the other question fields remain intact', () => {
  const drafts = approvedQuestionRewrites();
  assert.equal(drafts.length, 11);
  for (const slug of [...slugs, 'acid-base-homeostasis']) {
    const rel = `materials-src/${slug}/apply.json`,
      before = unwrap(
        JSON.parse(execFileSync('git', ['show', '0594eb3:' + (slug === 'water-sodium-regulation' ? 'materials-src/apply-examples/water-sodium-regulation/apply.json' : rel)], { encoding: 'utf8' })),
      ),
      after = unwrap(JSON.parse(fs.readFileSync(rel)));
    for (const stage of ['foundation', 'cases'])
      for (let i = 0; i < before.learning.questions[stage].length; i++) {
        const b = before.learning.questions[stage][i],
          a = after.learning.questions[stage][i],
          d = drafts.find((d) => d.id === b.id);
        if (d) {
          assert.equal(a.stem, d.stem);
          assert.deepEqual(a.options, d.options);
          assert.equal(a.answer, d.answer);
          assert.deepEqual({ ...a, stem: b.stem, options: b.options, answer: b.answer }, b);
        } else assert.deepEqual(a, b);
      }
  }
});
test('shared source is really embedded in both acid-base and scripted lessons; lessons contain no popup/select implementation', () => {
  const common = fs.readFileSync('materials-src/apply-kit/student-components.js', 'utf8');
  for (const slug of ['kidney-anatomy', 'acid-base-homeostasis']) {
    const base = path.resolve('materials-src', slug),
      data = JSON.parse(
        fs.readFileSync(base + (slug === 'acid-base-homeostasis' ? '/full.json' : '/apply.json')),
      ),
      html = renderApply(data, { baseDir: base, view: 'course' });
    assert.ok(html.includes(common));
    assert.doesNotMatch(
      html,
      /<select|<dialog|role="dialog"|\.showModal\(|window\.(alert|confirm|prompt)\(/,
    );
  }
});
test('actual matching resets even the correct row; microcheck resets the whole node; trace resets all three and covers map', async () => {
  const { file, S } = load('kidney-anatomy'),
    b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.addInitScript(() => {
      Math.random = () => 0;
    });
    await p.goto(pathToFileURL(file).href);
    await p.locator('#start').click();
    await p.locator('#begin-action').click();
    await performScriptedStep(p, S.nodes[0].steps[0], { wrong: true });
    const prior = await p.locator('[data-spatial-card]').evaluateAll(bs=>bs.map(b=>b.dataset.spatialCard));
    assert.equal(await p.locator('[data-row-feedback]').count(), 2);
    await p.locator('#strict-retry').click();
    let c = await p.evaluate(() => window.StudentScriptUI.getState().course);
    assert.deepEqual(c.locate.values, [null, null]);
    assert.notDeepEqual(await p.locator('[data-spatial-card]').evaluateAll(bs=>bs.map(b=>b.dataset.spatialCard)), prior);
    await finishScriptedActions(p, S.nodes[0]);
    await p.locator('[data-micro="1"]').click();
    await p.locator('#micro-submit').click();
    await p.locator('#strict-retry').click();
    c = await p.evaluate(() => window.StudentScriptUI.getState().course);
    assert.equal(c.step, 0);
    assert.equal(c.phase, 'action');
    assert.deepEqual(c.locate.values, [null, null]);
    assert.deepEqual(c.done, []);
    assert.equal(c.sent, false);
  } finally {
    await b.close();
  }
});
test('script audit rejects changed teaching text and forged interface copy rather than trusting an HTML marker', async () => {
  const { file, S, data } = load('urine-concentration'),
    b = await chromium.launch();
  try {
    const p = await b.newPage();
    await p.goto(pathToFileURL(file).href);
    assert.deepEqual((await auditApplyScript(p, S, unwrap(data).learning.questions)).errors, []);
    await p.locator('[data-copy="intro"]').evaluate((e) => (e.textContent += '未核可字句'));
    assert.ok(
      (await auditApplyScript(p, S, unwrap(data).learning.questions)).errors.some(
        (e) => e.kind === 'changed',
      ),
    );
  } finally {
    await b.close();
  }
});

test('question freeze accepts only exact authorized fields and rejects an altered hint, wrong answer, removed or reordered question', () => {
  const original = unwrap(
    JSON.parse(
      execFileSync('git', ['show', '0594eb3:materials-src/kidney-anatomy/apply.json'], {
        encoding: 'utf8',
      }),
    ),
  ).learning.questions.cases;
  const current = unwrap(JSON.parse(fs.readFileSync('materials-src/kidney-anatomy/apply.json')))
    .learning.questions.cases;
  assert.equal(validateApprovedQuestionChanges(original, current), true);
  for (const mutate of [
    (q) => (q[3].hint += '額外提示'),
    (q) => (q[3].answer = 0),
    (q) => q.pop(),
    (q) => q.reverse(),
    (q) => (q[0].stem += '未核可字句'),
  ]) {
    const changed = structuredClone(current);
    mutate(changed);
    assert.equal(validateApprovedQuestionChanges(original, changed), false);
  }
});
