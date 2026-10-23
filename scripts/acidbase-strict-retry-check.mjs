import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { compileStudentScript } from '../materials-src/apply-kit/student-script.mjs';
import { placeScriptCards, finishScriptNode } from './lib/acidbase-script-browser.mjs';
import { metrics } from './lib/acidbase-full-browser.mjs';
export async function checkStrictRetry(out, { shots = true, route = 'all' } = {}) {
  fs.mkdirSync(out, { recursive: true });
  const base = path.resolve('materials-src/acid-base-homeostasis'),
    data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'))),
    script = compileStudentScript(base);
  const file = path.join(out, 'strict-preview.html');
  fs.writeFileSync(file, renderApply(data, { baseDir: base, view: 'course' }));
  const browser = await chromium.launch(),
    results = [];
  try {
    for (const [width, height] of [
      [390, 844],
      [1280, 800],
      [844, 390],
    ]) {
      const p = await browser.newPage({ viewport: { width, height } });
      p.setDefaultTimeout(6000);
      const state = () => p.evaluate(() => window.StudentScriptUI.getState());
      const order = (selector) =>
        p.locator(selector).evaluateAll((es) => es.map((e) => e.textContent));
      const snap = async (name) => {
        const m = await metrics(p);
        const r = {
          name: `${width}x${height}-${name}`,
          pass:
            !m.outside.length &&
            !m.clipping.length &&
            !m.small.length &&
            m.scrollWidth <= width &&
            m.scrollHeight <= height,
          metrics: m,
        };
        results.push(r);
        if (shots) await p.screenshot({ path: path.join(out, r.name + '.png') });
      };
      // Fixed RNG exercises the fallback: retry must differ even if random shuffle repeats.
      await p.addInitScript(() => {
        Math.random = () => 0;
      });
      await p.goto(pathToFileURL(file).href);
      await p.locator('#start').click();
      if (route === 'step' || route === 'all') {
        await p.locator('#match-skip').click();
        // One correct row plus two wrong rows must all be cleared.
        for (const [row, choice] of [
          [0, 0],
          [1, 2],
          [2, 1],
        ]) {
          await p.locator(`[data-match-role="${row}"]`).click();
          await p.locator(`[data-match-choice="${choice}"]`).click();
        }
        const before = (await state()).course.match.order;
        await p.locator('#match-check').click();
        assert.equal(await p.locator('.matching-feedback').first().isVisible(), true);
        assert.equal(
          await p.locator('#strict-retry').count(),
          0,
          'explanation precedes retry button',
        );
        assert.equal(await p.locator('[data-match-role="0"]').isDisabled(), true);
        await p.locator('#strict-retry').waitFor();
        await p.reload();
        assert.equal((await state()).course.retry, 'step');
        assert.equal(await p.locator('[data-match-role="0"]').isDisabled(), true);
        await p.evaluate(() =>
          window.dispatchEvent(
            new MessageEvent('message', {
              source: window.parent,
              data: { type: 'init', protocolVersion: 1, guideScope: 'retry-account-new-scope' },
            }),
          ),
        );
        assert.equal(await p.locator('[data-guide-step]').count(), 0);
        await snap('step-explanation');
        await p.locator('#strict-retry').click();
        assert.deepEqual((await state()).course.match.values, [null, null, null]);
        assert.notDeepEqual((await state()).course.match.order, before);
        assert.equal(await p.locator('.selected,.wrong,.fixed,[data-map-edge]').count(), 0);
        await snap('step-restarted');
      }
      if (route === 'node' || route === 'all') {
        await placeScriptCards(p, 0);
        await p.locator('[data-answer="1"]').click();
        const before = await order('[data-micro]');
        assert.equal(await p.locator('[data-map-edge]').count(), 0);
        await p.locator(`[data-micro="${(script.nodes[0].micro.answer + 1) % 4}"]`).click();
        await p.locator('#micro-submit').click();
        await p.locator('#strict-retry').waitFor();
        await snap('node-explanation');
        await p.locator('#strict-retry').click();
        assert.equal((await state()).course.stage, 0);
        assert.deepEqual((await state()).model.nodes[0], {
          task: false,
          micro: false,
          edges: false,
        });
        assert.deepEqual((await state()).course.match.values, [null, null, null]);
        assert.equal(await p.locator('[data-map-edge],.selected,.wrong').count(), 0);
        await snap('node-restarted');
        await placeScriptCards(p, 0);
        await p.locator('[data-answer="1"]').click();
        assert.notDeepEqual(await order('[data-micro]'), before);
        await p.locator(`[data-micro="${script.nodes[0].micro.answer}"]`).click();
        await p.locator('#micro-submit').click();
        await p.locator('#next-node').click();
      } else {
        await finishScriptNode(p, script, 0);
        await p.locator('#next-node').click();
      }
      if (route === 'trace' || route === 'all') {
        for (let i = 1; i < 6; i++) {
          if (i === 4) {
            await p.locator('[data-arrow="0"]').click();
            await p.locator('#submit-arrow').click();
            await p.locator('#strict-retry').click();
            assert.equal((await state()).course.h, false);
            assert.equal((await state()).course.b, false);
          }
          await finishScriptNode(p, script, i);
          await p.locator('#next-node').click();
        }
        const before = await order('[data-trace]');
        await p.locator('[data-trace="0"]').click();
        await p.locator('[data-trace="0"]').click();
        await p.locator('[data-trace="1"]').click();
        await p.locator('#strict-retry').waitFor();
        await snap('trace-explanation');
        await p.locator('#strict-retry').click();
        assert.equal((await state()).course.traceIndex, 0);
        assert.equal((await state()).model.trace, false);
        assert.equal(await p.locator('[data-map-edge],.wrong,.selected').count(), 0);
        assert.equal(await p.locator('.map-covered').count(), 1);
        assert.notDeepEqual(await order('[data-trace]'), before);
        await snap('trace-restarted');
      }
      await p.close();
    }
  } finally {
    await browser.close();
  }
  const r = { version: script.version, route, results, pass: results.every((r) => r.pass) };
  fs.writeFileSync(path.join(out, 'strict-results.json'), JSON.stringify(r, null, 2));
  return r;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const r = await checkStrictRetry(
    path.resolve(process.argv[2] || 'docs/urinary-release/acidbase-full/ux-match/strict-retry'),
  );
  console.log(JSON.stringify(r));
  if (!r.pass) process.exitCode = 1;
}
