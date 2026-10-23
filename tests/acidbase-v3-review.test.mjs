import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { compileStudentScript } from '../materials-src/apply-kit/student-script.mjs';
import { finishScriptNode, auditScriptText } from '../scripts/lib/acidbase-script-browser.mjs';
const base = path.resolve('materials-src/acid-base-homeostasis'),
  data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'))),
  script = compileStudentScript(base),
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acidbase-v3-review-')),
  file = path.join(dir, 'course.html');
fs.writeFileSync(file, renderApply(data, { baseDir: base, view: 'course' }));
after(() => fs.rmSync(dir, { recursive: true, force: true }));
async function start(p) {
  await p.goto(pathToFileURL(file).href);
  await p.locator('#start').click();
}
async function through(p, count) {
  for (let i = 0; i < count; i++) {
    await finishScriptNode(p, script, i);
    await p.locator('#next-node').click();
  }
}
test('retired embedded microchecks are absent from authored and default browser data', () => {
  assert.ok(
    data.nodes.every((n) => !Object.hasOwn(n, 'micro')),
    'full.json must not retain the obsolete question objects',
  );
  const html = renderApply(data, { baseDir: base, view: 'course' });
  assert.doesNotMatch(html, /"id":"micro-0[1-6]"/);
});
test('transition uses the expressly authorized heading while v3 teaching copy stays strict', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await start(p);
    await through(p, 6);
    for (let j = 0; j < 3; j++) await p.locator('[data-trace="0"]').click();
    await p.locator('#enter-assessment').click();
    assert.equal(await p.locator('h1').innerText(), '準備考核');
    assert.deepEqual((await auditScriptText(p, script, data)).errors, []);
    const task = fs.readFileSync('CODEX_TASK_acidbase-v3-review-fix_2026-10-21.md', 'utf8');
    assert.ok(task.includes('「準備考核」'));
    await p.locator('[data-interface]').evaluate((e) => (e.textContent += '未核可說明'));
    assert.ok((await auditScriptText(p, script, data)).errors.length > 0);
    await p.locator('[data-interface]').evaluate((e) => (e.textContent = '準備考核'));
    await p.locator('main').evaluate((e) => {
      const x = document.createElement('span');
      x.dataset.interface = 'transitionTitle';
      x.textContent = '準備考核';
      e.append(x);
    });
    assert.ok(
      (await auditScriptText(p, script, data)).errors.length > 0,
      'authorized heading must not become a general text bypass',
    );
  } finally {
    await b.close();
  }
});
test('N05 labels stay directly above their own complete arrows at all widths, on flip and resize', async () => {
  const b = await chromium.launch();
  try {
    const sizes = [
      [360, 667],
      [390, 844],
      [414, 896],
      [768, 1024],
      [820, 1180],
      [1024, 1366],
      [1280, 800],
      [844, 390],
    ];
    for (const [width, height] of sizes) {
      const p = await b.newPage({ viewport: { width, height } });
      await start(p);
      await through(p, 4);
      const measure = () =>
        p.locator('[data-arrow]').evaluateAll((gs) =>
          gs.map((g) => {
            const line = g.querySelector('.s-flow'),
              a = line.getBoundingClientRect(),
              badge = g.querySelector('.arrow-badge-bg').getBoundingClientRect(),
              text = g.querySelector('text').getBoundingClientRect(),
              svg = g.ownerSVGElement.getBoundingClientRect();
            return {
              gap:
                a.y -
                (parseFloat(getComputedStyle(line).strokeWidth) *
                  Math.hypot(line.getScreenCTM().c, line.getScreenCTM().d)) /
                  2 -
                badge.bottom,
              badge: { x: badge.x, y: badge.y, width: badge.width, height: badge.height },
              text: { x: text.x, y: text.y, width: text.width, height: text.height },
              inside:
                a.x >= svg.x &&
                a.right <= svg.right &&
                a.y >= svg.y &&
                a.y <= svg.bottom &&
                badge.y >= svg.y &&
                badge.right <= svg.right,
              path: line.getAttribute('d'),
            };
          }),
        );
      let before = await measure();
      for (const r of before) {
        assert.ok(r.gap >= 0 && r.gap <= 5, `${width}x${height}: badge-arrow gap ${r.gap}`);
        assert.ok(r.inside);
        assert.ok(r.badge.height >= r.text.height);
        assert.ok(r.badge.height <= 28);
      }
      await p.locator('[data-arrow="0"]').click();
      let flipped = await measure();
      assert.ok(flipped[0].badge.x < before[0].badge.x - 5, 'H+ label follows the reversed arrow');
      assert.equal(flipped[1].path, before[1].path);
      await p.locator('[data-arrow="1"]').click();
      await p.locator('#submit-arrow').click();
      const correctArrows=await measure();
      assert.match(correctArrows[0].path,/M85 .*H15/, 'H+ goes from blood on right into tubular fluid on left');
      assert.match(correctArrows[1].path,/M15 .*H85/, 'HCO3 goes toward blood on right');
      for (const r of correctArrows) {
        assert.ok(r.gap >= 0 && r.gap <= 5);
        assert.ok(r.inside);
      }
      await p.setViewportSize({ width: width === 390 ? 414 : 390, height: 844 });
      await p.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      for (const r of await measure()) {
        assert.ok(r.gap >= 0 && r.gap <= 5, 'resize must relayout badges');
        assert.ok(r.inside);
      }
      await p.close();
    }
  } finally {
    await b.close();
  }
});
