import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { renderApply } from '../../materials-src/apply-kit/render.mjs';
import { performFullNode, metrics, chooseFullValue } from './acidbase-full-browser.mjs';
export async function checkFullLayout(data, { file, out, html } = {}) {
  fs.mkdirSync(path.join(out, 'shots'), { recursive: true });
  fs.rmSync(path.join(out, 'first-failure.json'), { force: true });
  const baseDir = path.dirname(path.resolve(file)),
    input = path.join(out, 'checked-full.html');
  fs.writeFileSync(
    input,
    html ? fs.readFileSync(html, 'utf8') : renderApply(data, { baseDir, view: 'course' }),
  );
  const graph = JSON.parse(fs.readFileSync(path.resolve(baseDir, data.mindmapSource), 'utf8'));
  const browser = await chromium.launch({ headless: true }),
    results = [];
  try {
    for (const [width, height] of [
      [360, 667],
      [390, 844],
      [414, 896],
      [768, 1024],
      [820, 1180],
      [1024, 1366],
      [1280, 800],
      [844, 390],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } }),
        page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(pathToFileURL(input).href);
      async function capture(state) {
        const result = { state, ...(await metrics(page)), consoleErrors: [...errors] };
        result.pass =
          result.scrollWidth <= width &&
          result.scrollHeight <= height &&
          !result.outside.length &&
          !result.clipping.length &&
          !result.small.length &&
          !errors.length;
        results.push(result);
        if (!result.pass && !fs.existsSync(path.join(out, 'first-failure.json')))
          fs.writeFileSync(path.join(out, 'first-failure.json'), JSON.stringify(result, null, 2));
        console.log(
          `${width}x${height} ${state}: ${result.pass ? 'PASS' : 'FAIL'} out=${result.outside.length} clip=${result.clipping.length} small=${result.small.length}`,
        );
        if ([1280, 390].includes(width)) {
          await page.evaluate(async () => {
            await Promise.all(
              document
                .getAnimations()
                .filter((a) => a.effect?.getTiming().iterations === 1)
                .map((a) => a.finished.catch(() => {})),
            );
          });
          await page.screenshot({
            path: path.join(out, 'shots', `${width}x${height}-${state}.png`),
          });
        }
      }
      // Exercises actual controls; never inject completed flags or bypass the tasks.
      for (let i = 0; i < 6; i++) {
        await page.locator(`[data-node="${i}"]`).click();
        await capture(`node-0${i + 1}-before`);
        await performFullNode(page, data, graph, i, {
          afterTask: async () => capture(`node-0${i + 1}-after-task`),
        });
        await capture(`node-0${i + 1}-after`);
        if ([0, 2, 5].includes(i)) await capture(`mindmap-stage-${i + 1}`);
      }
      await page.evaluate(() => window.AcidbaseUI.setView('map'));
      await capture('trace-covered');
      await chooseFullValue(page, 'trace-buffer', '仍在體內，減少pH波動');
      await chooseFullValue(page, 'trace-lung', 'CO₂');
      await chooseFullValue(page, 'trace-kidney', 'H⁺向尿端、HCO₃⁻回血');
      await page.locator('#trace-check').click();
      await capture('trace-revealed');
      // First-stage and both polarity variants are measured independently, through the real assessment UI.
      await page.evaluate(() => window.AcidbaseUI.setView('quiz'));
      for (const q of data.foundation) {
        await capture(q.id);
        await page.getByRole('button', { name: q.options[q.answer], exact: true }).click();
        await page.locator('#quiz-submit').click();
      }
      for (let attempt = 0; attempt < 2; attempt++) {
        const saved = await page.evaluate(() =>
          JSON.parse(localStorage.getItem('acidbase-full:2026-10-20-v1')),
        );
        for (const group of saved.order || ['P', 'R', 'K', 'N', 'S']) {
          const q = data.pool.find(
            (q) => q.group === group && q.side === (saved.sides?.[group] || saved.side),
          );
          await capture(q.id + '-answer');
          const chosen =
            attempt === 0 && group === (saved.order || ['P', 'R', 'K', 'N', 'S']).at(-1)
              ? (q.answer + 1) % 4
              : q.answer;
          await page.getByRole('button', { name: q.options[chosen], exact: true }).click();
          await page.locator('#quiz-submit').click();
          if (q.reasons) {
            await capture(q.id + '-reason');
            await page
              .getByRole('button', { name: q.reasons[q.reasonAnswer], exact: true })
              .click();
            await page.locator('#quiz-submit').click();
          }
        }
        if (attempt === 0) {
          await capture('wrong-case-review');
          await page.locator('#review-node').click();
          await page.locator('#return-quiz').click();
          await page.locator('#retry-cases').click();
        }
      }
      await capture('case-passed');
      await page.locator('#go-trace').click();
      await capture('final-trace-covered');
      await chooseFullValue(page, 'trace-buffer', '仍在體內，減少pH波動');
      await chooseFullValue(page, 'trace-lung', 'CO₂');
      await chooseFullValue(page, 'trace-kidney', 'H⁺向尿端、HCO₃⁻回血');
      await page.locator('#trace-check').click();
      await capture('completed');
      await page.evaluate(() => window.AcidbaseUI.setView('glossary'));
      for (const term of data.glossary) {
        await page.locator(`[data-term="${term.id}"]`).click();
        await capture('glossary-' + term.id);
      }
      await context.close();
    }
    const summary = {
      cases: results.length,
      pass: results.filter((r) => r.pass).length,
      fail: results.filter((r) => !r.pass).length,
      skipped: 0,
    };
    fs.writeFileSync(
      path.join(out, 'layout-results.json'),
      JSON.stringify({ input, profile: data.profile, results, summary }, null, 2) + '\n',
    );
    return summary;
  } finally {
    await browser.close();
  }
}
