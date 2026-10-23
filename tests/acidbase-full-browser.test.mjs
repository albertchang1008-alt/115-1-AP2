import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { loadFull } from '../materials-src/apply-kit/full-render.mjs';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { performFullNode, chooseFullValue } from '../scripts/lib/acidbase-full-browser.mjs';
const base = path.resolve('materials-src/acid-base-homeostasis'),
  data = loadFull(JSON.parse(fs.readFileSync(path.join(base, 'full.json'), 'utf8')), base, {
    legacy: true,
  }),
  graph = JSON.parse(fs.readFileSync(path.resolve(base, data.mindmapSource), 'utf8'));
test('real UI: sequential N05, prerequisite lock, paired retry after rereading, hidden trace, persistence and once-only completion', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acidbase-ui-')),
    file = path.join(dir, 'course.html');
  fs.writeFileSync(file, renderApply(data, { baseDir: base, view: 'course-legacy' }));
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } }),
      page = await context.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.events = [];
      window.CourseLearning = Object.fromEntries(
        ['explore', 'nodeTime', 'answer', 'hint', 'complete'].map((k) => [
          k,
          (...args) => window.events.push({ k, args }),
        ]),
      );
    });
    await page.goto(pathToFileURL(file).href);
    const stored = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('acidbase-full:2026-10-20-v1')));
    const completeCount = () =>
      page.evaluate(() => window.events.filter((e) => e.k === 'complete').length);
    await page.evaluate(() => window.AcidbaseUI.setView('quiz'));
    assert.equal(await page.locator('#unlock-node').isVisible(), true);
    assert.equal(await page.locator('#quiz-submit').count(), 0);
    await page.locator('[data-node="4"]').click();
    assert.match(await page.locator('#wrong-figure-label').innerText(), /這是錯的圖/);
    assert.equal(await page.locator('[data-choice]').count(), 0, '第1步不得出現N05四選一');
    assert.match(await page.locator('#flip-h').textContent(), /血液 ← H⁺/);
    await page.locator('#flip-h').click();
    assert.match(await page.locator('#flip-h').textContent(), /H⁺ → 管液/);
    assert.equal(await page.locator('[data-choice]').count(), 0);
    await page.locator('#flip-bicarb').click();
    await page.locator('#diagram-next').click();
    assert.equal(
      await page.locator('[data-choice]').count(),
      0,
      'N05 has no retired multiple-choice question',
    );
    await page.locator('#task-submit').click();
    assert.match(await page.locator('#wrong-figure-label').innerText(), /已校正/);
    await page.locator('#corrected-next').click();
    // A partial/wrong graph submission does not reveal either of this node's links.
    await page.locator('#gap-submit').click();
    assert.equal(await page.locator('#figure .revealed').count(), 0);
    assert.equal(await page.locator('dialog').count(), 0);
    for (const [j, id] of data.nodes[4].edges.entries()) {
      const e = graph.edges.find((e) => e.id === id);
      await chooseFullValue(
        page,
        'gap-' + j,
        e.sign === 'up' && j % 2 === 0 ? '↑' : graph.nodes.find((n) => n.id === e.from).label,
      );
      await page.locator('#gap-submit').click();
    }
    for (const i of [0, 1, 2, 3, 5]) await performFullNode(page, data, graph, i);
    assert.equal(await page.locator('#mindmap-dock line').count(), 11);
    await page.evaluate(() => window.AcidbaseUI.setView('map'));
    assert.equal(await page.locator('#memory-cover').isVisible(), true);
    assert.equal(await page.locator('#mindmap').count(), 0);
    async function recall() {
      await chooseFullValue(page, 'trace-buffer', '仍在體內，減少pH波動');
      await chooseFullValue(page, 'trace-lung', 'CO₂');
      await chooseFullValue(page, 'trace-kidney', 'H⁺向尿端、HCO₃⁻回血');
      await page.locator('#trace-check').click();
    }
    await recall();
    assert.equal(await completeCount(), 0);
    assert.equal(await page.locator('#completion').isVisible(), false);
    await page.evaluate(() => window.AcidbaseUI.setView('quiz'));
    for (const q of data.foundation) {
      await page.getByRole('button', { name: q.options[q.answer], exact: true }).click();
      await page.locator('#quiz-submit').click();
    }
    let saved = await stored();
    for (const g of saved.order.slice(0, saved.order.indexOf('R'))) {
      const q = data.pool.find((q) => q.group === g && q.side === saved.sides[g]);
      await page.getByRole('button', { name: q.options[q.answer], exact: true }).click();
      await page.locator('#quiz-submit').click();
      if (q.reasons) {
        await page.getByRole('button', { name: q.reasons[q.reasonAnswer], exact: true }).click();
        await page.locator('#quiz-submit').click();
      }
    }
    const qR = data.pool.find((q) => q.group === 'R' && q.side === saved.sides.R);
    await page.getByRole('button', { name: qR.options[qR.answer], exact: true }).click();
    await page.locator('#quiz-submit').click();
    assert.equal(await page.getByText('答案符合，理由未支持。', { exact: false }).count(), 0);
    await page
      .getByRole('button', { name: qR.reasons[(qR.reasonAnswer + 1) % 4], exact: true })
      .click();
    await page.locator('#quiz-submit').click();
    assert.match(await page.locator('#work').innerText(), /答案符合，理由未支持/);
    assert.equal(await page.locator('#retry-cases').isDisabled(), true);
    assert.equal(await completeCount(), 0);
    // A reload must not erase the reread requirement or silently reuse the same question.
    await page.reload();
    await page.evaluate(() => window.AcidbaseUI.setView('quiz'));
    assert.equal(await page.locator('#retry-cases').isDisabled(), true);
    await page.locator('#review-node').click();
    await page.locator('#return-quiz').click();
    await page.locator('#retry-cases').click();
    const retry = await stored();
    for (const g of ['P', 'R', 'K', 'N', 'S']) assert.notEqual(retry.sides[g], saved.sides[g]);
    assert.equal(retry.trace, false);
    for (const g of retry.order) {
      const q = data.pool.find((q) => q.group === g && q.side === retry.sides[g]);
      await page.getByRole('button', { name: q.options[q.answer], exact: true }).click();
      await page.locator('#quiz-submit').click();
      if (q.reasons) {
        await page.getByRole('button', { name: q.reasons[q.reasonAnswer], exact: true }).click();
        await page.locator('#quiz-submit').click();
      }
    }
    assert.equal(await completeCount(), 0);
    await page.locator('#go-trace').click();
    assert.equal(await page.locator('#memory-cover').isVisible(), true);
    await recall();
    assert.equal(await completeCount(), 1);
    assert.equal(await page.locator('#completion').isVisible(), true);
    await page.locator('#cover-again').click();
    await recall();
    assert.equal(await completeCount(), 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.ok(
      await page
        .locator('#mindmap .revealed')
        .evaluateAll((es) => es.every((e) => getComputedStyle(e).animationName === 'none')),
    );
    await page.reload();
    assert.equal(await completeCount(), 0);
    assert.equal((await stored()).sent, true);
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
