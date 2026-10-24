import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { compileStudentScript } from '../materials-src/apply-kit/student-script.mjs';
import { auditScriptText, finishScriptNode } from '../scripts/lib/acidbase-script-browser.mjs';
import { createAcidbaseModel } from '../materials-src/apply-kit/full-model.mjs';
const base = path.resolve('materials-src/acid-base-homeostasis'),
  data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'))),
  script = compileStudentScript(base);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'student-script-test-')),
  fixture = path.join(temp, 'course.html');
fs.writeFileSync(fixture, renderApply(data, { baseDir: base, view: 'course' }));
after(() => fs.rmSync(temp, { recursive: true, force: true }));
test('approved script compilation preserves exact source text and paired-question data', () => {
  const raw = fs.readFileSync('docs/urinary-release/ACIDBASE_STUDENT_SCRIPT.md', 'utf8');
  for (const [id, u] of Object.entries(script.units)) assert.ok(raw.includes(u.text), id);
  for (const q of [
    ...raw
      .slice(raw.indexOf('## 開場'))
      .split('## v3.1 變更')[0]
      .matchAll(/「([^」]+)」/g),
  ]
    .map((m) => m[1])
    .filter((t) => t !== '回看第 X 關' && t !== 'pKa 是公式裡固定的數字'))
    assert.ok(
      Object.values(script.units).some((u) => u.text === q),
      'Unrepresented source clause ' + q,
    );
  assert.ok(Object.values(script.units).every((u) => !u.text.includes('※')));
  assert.ok(Object.values(script.units).some((u) => u.text === 'pKa 是公式裡固定的數字。pKa 不變時，如果鹼／酸的比值變大，pH 會怎樣？'));
  assert.equal(script.nodes.length, 6);
  assert.equal(script.trace.length, 3);
  assert.equal(Object.keys(script.units).filter((id) => !id.startsWith('diagram.')).length, 149);
});
test('mobile N01: nonblank grid, no preselection, hint toggle, exact copy and negative diff', async () => {
  const b = await chromium.launch();
  try {
    for (const corruption of [
      null,
      '{not-json}',
      JSON.stringify({ version: 3, model: { nodes: [] }, course: { screen: 'node' } }),
    ]) {
      const p = await b.newPage({ viewport: { width: 390, height: 844 } });
      await p.addInitScript((value) => {
        if (value && !localStorage.getItem('acidbase-student-script:2026-10-21-v3.2'))
          localStorage.setItem('acidbase-student-script:2026-10-21-v3.2', value);
      }, corruption);
      await p.goto(pathToFileURL(fixture).href);
      assert.equal(await p.locator('#start').isVisible(), true);
      await p.locator('#start').click();
      assert.equal(await p.locator('.selected').count(), 0);
      assert.equal(await p.locator('[data-match-role]').count(), 3);
      assert.equal(await p.locator('[data-match-open]').count(), 3);
      assert.ok((await p.locator('#student-figure').boundingBox()).height >= 70);
      assert.equal(await p.locator('.hint-box').count(), 0);
      await p.locator('#hint-toggle').click();
      assert.equal(
        await p.locator('.hint-box').innerText(),
        script.units[script.nodes[0].hints[0]].text,
      );
      await p.locator('#hint-toggle').click();
      assert.equal(await p.locator('.hint-box').count(), 0);
      assert.deepEqual((await auditScriptText(p, script, data)).errors, []);
      await p.locator('[data-match-role="1"]').click();
      await p.locator('[data-match-choice="1"]').click();
      await p.reload();
      assert.equal(await p.locator('[data-match-open]').count(), 3);
      assert.equal(
        await p.locator('[data-match-open="1"]').innerText(),
        script.units['n1.slot.1'].text,
      );
      await p
        .locator('[data-copy="n1.question"]')
        .evaluate((e) => (e.textContent += '自行加的說明'));
      assert.ok((await auditScriptText(p, script, data)).errors.some((e) => e.kind === 'changed'));
      await p.locator('main').evaluate((e) => {
        const p = document.createElement('p');
        p.textContent = '腳本沒有這句';
        e.append(p);
      });
      assert.ok(
        (await auditScriptText(p, script, data)).errors.some((e) => e.kind === 'extra-text'),
      );
      await p.close();
    }
  } finally {
    await b.close();
  }
});
test('script flow uses real actions, omits N05 microcheck, reveals trace branch by branch and completes once after unchanged paired quiz', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    let completed = 0;
    p.on('pageerror', (e) => {
      throw e;
    });
    await p.exposeFunction('trackComplete', () => completed++);
    await p.addInitScript(
      () => (window.CourseLearning = { complete: () => window.trackComplete() }),
    );
    await p.goto(pathToFileURL(fixture).href);
    await p.locator('#start').click();
    for (let i = 0; i < 6; i++) {
      await finishScriptNode(p, script, i);
      if (i === 4) assert.equal(await p.locator('[data-micro]').count(), 0);
      assert.equal(await p.locator('#next-node').isVisible(), true);
      await p.locator('#next-node').click();
    }
    assert.equal(await p.locator('[data-map-edge]').count(), 0);
    let count = 0;
    for (let j = 0; j < 3; j++) {
      await p.locator('[data-trace="0"]').click();
      const next = await p.locator('[data-map-edge]').count();
      assert.ok(next > count);
      count = next;
    }
    assert.equal(count, 11);
    await p.locator('#enter-assessment').click();
    assert.equal(await p.locator('#start-quiz').isVisible(), true);
    await p.locator('#start-quiz').click();
    for (let k = 0; k < 5; k++) {
      const { model } = await p.evaluate(() => window.StudentScriptUI.getState()),
        q = data.pool.find((q) => q.group === model.order[k] && q.side === model.sides[q.group]);
      await p.locator(`[data-pool="${q.answer}"]`).click();
      await p.locator('#pool-submit').click();
      if (q.reasons) {
        await p.locator(`[data-pool="${q.reasonAnswer}"]`).click();
        await p.locator('#pool-submit').click();
      }
    }
    await p.waitForFunction(() => window.StudentScriptUI.getState().model.sent === true);
    assert.equal(completed, 1);
    await p.emulateMedia({ reducedMotion: 'reduce' });
    assert.ok(
      await p
        .locator('*')
        .evaluateAll((es) => es.every((e) => getComputedStyle(e).animationName === 'none')),
    );
  } finally {
    await b.close();
  }
});
test('script eligibility still requires all six nodes, five actual microchecks, trace and correct paired reasons', () => {
  const m = createAcidbaseModel(),
    s = m.fresh();
  s.scriptMode = true;
  assert.equal(m.canComplete(s), false);
  for (let i = 0; i < 6; i++) {
    m.markNode(s, i, 'task', true);
    m.markNode(s, i, 'micro', true);
    m.markNode(s, i, 'edges', true);
  }
  s.casePassed = true;
  s.cases = ['P-A', 'R-A', 'K-A', 'N-A', 'S-A'];
  assert.equal(m.canComplete(s), false);
  s.trace = true;
  assert.equal(m.complete(s), true);
  assert.equal(m.complete(s), false);
});
