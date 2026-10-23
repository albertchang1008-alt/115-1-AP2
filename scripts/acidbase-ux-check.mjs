import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { performFullNode, metrics, chooseFullValue } from './lib/acidbase-full-browser.mjs';
const base = path.resolve('materials-src/acid-base-homeostasis'),
  data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'))),
  graph = JSON.parse(fs.readFileSync(path.resolve(base, data.mindmapSource)));
const out = path.resolve(process.argv[2] || 'docs/urinary-release/acidbase-full/ux-codex');
fs.mkdirSync(path.join(out, 'shots'), { recursive: true });
const browser = await chromium.launch(),
  results = [];
try {
  for (const [width, height] of [
    [1280, 800],
    [390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setContent(renderApply(data, { baseDir: base, view: 'course' }));
    async function capture(name, description) {
      await page.evaluate(async () => {
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations === 1)
            .map((a) => a.finished.catch(() => {})),
        );
      });
      const m = await metrics(page),
        extra = await page.evaluate(() => ({
          selects: document.querySelectorAll('#figure select,#work select').length,
          dialogs: document.querySelectorAll('dialog').length,
          bottomTabs: document.querySelectorAll('.bottom-nav,.bottom-tabs,.footer-tabs').length,
          svg: !!document.querySelector('#figure svg'),
          dock: !!document.querySelector('#mindmap-dock'),
          dockEdges: document.querySelectorAll('#mindmap-dock line').length,
          svgRatio:
            document.querySelector('#figure .task-svg')?.getBoundingClientRect().height /
            document.querySelector('#figure').clientHeight,
        }));
      const pass =
        !m.outside.length &&
        !m.clipping.length &&
        !m.small.length &&
        m.scrollWidth <= width &&
        m.scrollHeight <= height &&
        !errors.length &&
        !extra.selects &&
        !extra.dialogs &&
        !extra.bottomTabs &&
        extra.svg &&
        extra.dock &&
        (!name.startsWith('N01-') || extra.svgRatio >= 0.6);
      const filename = `${width}x${height}-${name}.png`;
      await page.screenshot({ path: path.join(out, 'shots', filename) });
      results.push({
        name,
        width,
        height,
        description,
        file: `shots/${filename}`,
        pass,
        ...m,
        ...extra,
        errors: [...errors],
      });
      console.log(
        `${width} ${name}: ${pass ? 'PASS' : 'FAIL'} clip=${m.clipping.length} outside=${m.outside.length}`,
      );
    }
    for (let i = 0; i < 6; i++) {
      await page.locator(`[data-node="${i}"]`).click();
      await capture(
        `N0${i + 1}-before`,
        `N0${i + 1} 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。`,
      );
      if (i === 0) {
        await page.locator('[data-tag="肺"]').click();
        await page.locator('#slot-buffer').click();
        await page.locator('[data-boundary="能"]').click();
      }
      if (i === 1) await chooseFullValue(page, 'numerator', 'H₂CO₃');
      if (i === 4) {
        const q = data.nodes[i].micro;
        await page
          .getByRole('button', { name: q.options[(q.answer + 1) % q.options.length], exact: true })
          .click();
      }
      await page.locator('#task-submit').click();
      assert.ok(
        (await page.locator('#figure .field-error,#figure.figure-error').count()) > 0,
        '錯處必須在圖上標出',
      );
      assert.equal(await page.locator('dialog').count(), 0);
      if (i === 0) assert.match(await page.locator('#slot-buffer').innerText(), /肺/);
      if (i === 1)
        assert.equal(
          await page
            .locator('[data-field="numerator"][data-value="H₂CO₃"]')
            .getAttribute('aria-pressed'),
          'true',
        );
      await capture(
        `N0${i + 1}-wrong`,
        `N0${i + 1} 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。`,
      );
      if (i === 0) await page.locator('#slot-buffer').click();
      await performFullNode(page, data, graph, i, {
        resume: true,
        afterTask: async () => {
          const next = page.locator(i === 4 ? '#corrected-next' : '#task-next');
          assert.equal(await next.isVisible(), true);
          assert.match(await next.innerText(), /下一步 →/);
          await capture(
            `N0${i + 1}-right`,
            `N0${i + 1} 答對：操作圖保留正確狀態，顯示「下一步 →」。`,
          );
        },
      });
      assert.equal(
        await page.locator('#mindmap-dock line').count(),
        data.nodes.slice(0, i + 1).reduce((n, row) => n + row.edges.length, 0),
      );
    }
    await page.locator('#next-node').click();
    assert.equal(await page.locator('#mindmap-dock line').count(), 0, '遮圖時不能從右下角偷看');
    await capture(
      'trace-before',
      '一滴酸追蹤作答前：完整關係圖與右下角小圖都遮住，保留三個功能分支的 SVG 選項。',
    );
    await page.locator('#trace-check').click();
    await capture('trace-wrong', '一滴酸追蹤答錯：錯誤功能分支用紅框標出，原圖仍遮住，無彈窗。');
    await chooseFullValue(page, 'trace-buffer', '仍在體內，減少pH波動');
    await chooseFullValue(page, 'trace-lung', 'CO₂');
    await chooseFullValue(page, 'trace-kidney', 'H⁺向尿端、HCO₃⁻回血');
    await page.locator('#trace-check').click();
    await capture(
      'trace-right',
      '一滴酸追蹤答對：揭開完整心智圖，分開核對緩衝、肺、腎的功能，沒有重複排出同一顆酸。',
    );
    await page.close();
  }
} finally {
  await browser.close();
}
const summary = {
  cases: results.length,
  pass: results.filter((r) => r.pass).length,
  fail: results.filter((r) => !r.pass).length,
  skipped: 0,
};
fs.writeFileSync(
  path.join(out, 'UX_RESULTS.json'),
  JSON.stringify({ results, summary }, null, 2) + '\n',
);
console.log(JSON.stringify(summary));
if (summary.fail) process.exitCode = 1;
