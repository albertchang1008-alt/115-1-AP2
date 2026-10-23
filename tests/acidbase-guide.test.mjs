import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { loadFull } from '../materials-src/apply-kit/full-render.mjs';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { performFullNode, chooseFullValue } from '../scripts/lib/acidbase-full-browser.mjs';
const base = path.resolve('materials-src/acid-base-homeostasis'),
  data = loadFull(JSON.parse(fs.readFileSync(path.join(base, 'full.json'))), base, {
    legacy: true,
  }),
  graph = JSON.parse(fs.readFileSync(path.resolve(base, data.mindmapSource)));
test('novice guidance: demo resets without credit, question DOM absent before operations, highlight follows the current action', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.setContent(renderApply(data, { baseDir: base, view: 'course-legacy' }));
    await p.waitForSelector('#demo-ghost');
    assert.equal(await p.locator('#task-submit').count(), 0);
    assert.equal(await p.locator('[data-tag="化學緩衝"]').isDisabled(), true);
    await p.waitForFunction(() => !document.querySelector('#demo-ghost'));
    assert.match(await p.locator('#action-guide').innerText(), /換你了/);
    assert.equal((await p.evaluate(() => window.AcidbaseUI.getState())).nodes[0].task, false);
    assert.match(await p.locator('#slot-buffer').innerText(), /接收或釋放 H⁺/);
    assert.doesNotMatch(await p.locator('#slot-buffer').innerText(), /化學緩衝/);
    await p.locator('[data-tag="化學緩衝"]').click();
    assert.equal(await p.locator('.slot-target .guide-active').count(), 3);
    await p.locator('#replay-demo').click();
    await p.waitForSelector('#demo-ghost');
    await p.waitForFunction(() => !document.querySelector('#demo-ghost'));
    assert.equal((await p.evaluate(() => window.AcidbaseUI.getState())).nodes[0].task, false);
    for (let i = 0; i < 6; i++) {
      await p.locator(`[data-node="${i}"]`).click();
      assert.equal(
        await p
          .locator('#work [data-choice],#work [data-field],#work [data-boundary],#task-submit')
          .count(),
        0,
      );
      assert.equal(await p.locator('#diagram-next').isDisabled(), true);
      if (i === 1) {
        await chooseFullValue(p, 'numerator', 'H₂CO₃');
        await chooseFullValue(p, 'denominator', 'HCO₃⁻');
        await p.locator('#diagram-next').click();
        assert.equal(await p.locator('#task-submit').count(), 0);
        assert.equal(await p.locator('[data-field="numerator"]').first().isEnabled(), true);
        assert.match(await p.locator('#action-guide').innerText(), /分子/);
      }
      await performFullNode(p, data, graph, i, {
        resume: true,
        afterOperation: async () => {
          assert.equal(await p.locator('#task-submit').count(), 1);
          assert.equal(await p.locator('#task-submit').isDisabled(), i !== 4);
          if (i === 4) {
            assert.equal(await p.locator('button#flip-h').count(), 0);
            assert.equal(await p.locator('svg #flip-h').count(), 1);
            assert.match(await p.locator('#flip-h').textContent(), /H⁺ → 管液/);
          }
        },
      });
    }
    await p.locator('#next-node').click();
    assert.equal(await p.locator('[data-field="trace-lung"]').first().isDisabled(), true);
    await chooseFullValue(p, 'trace-buffer', '酸已全部離體');
    assert.equal(await p.locator('[data-field="trace-lung"]').first().isEnabled(), true);
    await chooseFullValue(p, 'trace-lung', 'CO₂');
    await chooseFullValue(p, 'trace-kidney', 'H⁺向尿端、HCO₃⁻回血');
    await p.locator('#trace-check').click();
    assert.equal(await p.locator('dialog').count(), 0);
    await chooseFullValue(p, 'trace-buffer', '仍在體內，減少pH波動');
    await p.locator('#trace-check').click();
    assert.equal(await p.locator('#mindmap').isVisible(), true);
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.locator('[data-node="0"]').click();
    assert.ok(
      await p
        .locator('.guide-active')
        .evaluateAll((es) => es.every((e) => getComputedStyle(e).animationName === 'none')),
    );
  } finally {
    await b.close();
  }
});
