import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { performFullNode, metrics, chooseFullValue } from './lib/acidbase-full-browser.mjs';
const base = path.resolve('materials-src/acid-base-homeostasis'),
  data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'))),
  graph = JSON.parse(fs.readFileSync(path.resolve(base, data.mindmapSource))),
  out = path.resolve(process.argv[2] || 'docs/urinary-release/acidbase-full/ux-guide');
fs.mkdirSync(path.join(out, 'shots'), { recursive: true });
const b = await chromium.launch(),
  results = [];
try {
  for (const [width, height] of [
    [1280, 800],
    [390, 844],
  ]) {
    const page = await b.newPage({ viewport: { width, height } }),
      errors = [];
    page.setDefaultTimeout(12000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setContent(renderApply(data, { baseDir: base, view: 'course' }));
    async function capture(name, description) {
      if (name !== 'N01-demo')
        await page.evaluate(async () =>
          Promise.all(
            document
              .getAnimations()
              .filter((a) => a.effect?.getTiming().iterations === 1)
              .map((a) => a.finished.catch(() => {})),
          ),
        );
      const m = await metrics(page);
      const guide = await page.locator('#action-guide').innerText();
      const targets = await page
        .locator('.guide-active')
        .evaluateAll((es) =>
          es.map((e) => ({ text: e.textContent.trim().slice(0, 80), id: e.id })),
        );
      const file = `shots/${width}x${height}-${name}.png`;
      await page.screenshot({ path: path.join(out, file) });
      const pass =
        !m.outside.length &&
        !m.clipping.length &&
        !m.small.length &&
        m.scrollHeight <= height &&
        m.scrollWidth <= width &&
        !errors.length &&
        !!guide;
      results.push({
        name,
        width,
        height,
        file,
        description,
        guide,
        targets,
        ...m,
        errors: [...errors],
        pass,
      });
      console.log(
        `${width} ${name}: ${pass ? 'PASS' : 'FAIL'} clip=${m.clipping.length} outside=${m.outside.length}`,
      );
    }
    await page.waitForTimeout(1900);
    await capture(
      'N01-demo',
      'N01 自動示範：上方說明點標籤、點功能格，標籤飛向功能格；學生尚未被要求答題。',
    );
    await page.locator('[data-tag="化學緩衝"]').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('#demo-ghost'));
    for (let i = 0; i < 6; i++) {
      await page.locator(`[data-node="${i}"]`).click();
      assert.equal(await page.locator('#task-submit').count(), 0);
      assert.equal(
        await page.locator('#work [data-choice],#work [data-field],#work [data-boundary]').count(),
        0,
      );
      await capture(
        `N0${i + 1}-step1`,
        `N0${i + 1} 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。`,
      );
      if (i === 1) {
        await chooseFullValue(page, 'numerator', 'H₂CO₃');
        await chooseFullValue(page, 'denominator', 'HCO₃⁻');
        await page.locator('#diagram-next').click();
        await capture(
          'N02-repair',
          'N02 圖上配錯後：分子格重新亮起，題目保持隱藏，可直接改正後繼續。',
        );
      }
      await performFullNode(page, data, graph, i, {
        resume: true,
        afterOperation: async () => {
          assert.equal(await page.locator('#task-submit').isVisible(), true);
          await capture(
            `N0${i + 1}-step2`,
            `N0${i + 1} 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。`,
          );
        },
      });
    }
    await page.locator('#next-node').click();
    await capture(
      'trace-step1',
      '結尾第1格：只亮緩衝判斷，後兩格暫時不能作答；完整圖與右下角小圖都遮住。',
    );
    await chooseFullValue(page, 'trace-buffer', '仍在體內，減少pH波動');
    await capture('trace-step2', '結尾第2格：緩衝選定後，只亮肺端排出物。');
    await chooseFullValue(page, 'trace-lung', 'CO₂');
    await capture('trace-step3', '結尾第3格：前兩格選定後，只亮腎端去向。');
    await chooseFullValue(page, 'trace-kidney', 'H⁺向尿端、HCO₃⁻回血');
    await page.locator('#trace-check').click();
    await page.close();
  }
} finally {
  await b.close();
}
const summary = {
  cases: results.length,
  pass: results.filter((r) => r.pass).length,
  fail: results.filter((r) => !r.pass).length,
  skipped: 0,
};
fs.writeFileSync(
  path.join(out, 'GUIDE_RESULTS.json'),
  JSON.stringify({ results, summary }, null, 2) + '\n',
);
console.log(JSON.stringify(summary));
if (summary.fail) process.exitCode = 1;
