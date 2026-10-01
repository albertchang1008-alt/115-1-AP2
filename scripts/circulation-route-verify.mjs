import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route('**/materials/course-learning.js', route => route.fulfill({ body: fs.readFileSync(path.join(root, 'public/materials/course-learning.js'), 'utf8'), contentType: 'application/javascript' }));
    await page.goto(new URL('file://' + path.join(root, 'public/materials/circulation-routes-v1/index.html')).href);
    for (const state of ['pulmonary', 'systemic', 'special']) {
      await page.locator('button[data-lab-state="' + state + '"]').click();
      const result = await page.evaluate(() => {
        const svg = document.querySelector('.state-figure svg');
        const artery = svg.querySelector('[data-route="pulmonary-artery"]');
        const coronary = svg.querySelector('[data-route="coronary-artery"]');
        const effectiveOpacity = element => {
          let opacity = 1;
          for (let e = element; e && e !== svg; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
          return opacity;
        };
        const labels = [...svg.querySelectorAll('text')];
        const intersects = (line, text) => {
          const b = text.getBBox(), pad = parseFloat(getComputedStyle(line).strokeWidth) / 2;
          for (let d = 0; d <= line.getTotalLength(); d += 1) {
            const p = line.getPointAtLength(d);
            if (p.x >= b.x - pad && p.x <= b.x + b.width + pad && p.y >= b.y - pad && p.y <= b.y + b.height + pad) return true;
          }
          return false;
        };
        const right = labels.find(t => t.textContent === '右心室');
        const heart = labels.filter(t => ['右心房', '右心室', '左心房', '左心室'].includes(t.textContent));
        const arrows = [...svg.querySelectorAll('path')].filter(p => p.getAttribute('d') === 'M145 190V230M255 190V230');
        const clipped = labels.filter(t => { const b = t.getBBox(), v = svg.viewBox.baseVal; return b.x < 0 || b.y < 0 || b.x + b.width > v.width || b.y + b.height > v.height; }).map(t => t.textContent);
        return {
          arteryGrouped: artery.closest('.pulmonary') !== null,
          arteryOpacity: effectiveOpacity(artery),
          pulmonaryPaths: svg.querySelectorAll('.pulmonary path').length,
          orphanBlue: [...svg.querySelectorAll('path[stroke="#3175ad"]')].filter(p => !p.closest('.pulmonary,.systemic,.special')).length,
          rightLabelOverlap: [artery, ...arrows].some(p => intersects(p, right)),
          coronaryLabelOverlap: heart.some(t => intersects(coronary, t)),
          coronaryLabel: labels.find(t => t.textContent.startsWith('冠狀動脈'))?.textContent,
          minPx: Math.min(...labels.map(t => parseFloat(getComputedStyle(t).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width)),
          clipped
        };
      });
      assert.equal(result.arteryGrouped, true);
      assert.equal(result.arteryOpacity, state === 'pulmonary' ? 1 : 0.18);
      assert.equal(result.pulmonaryPaths, 2);
      assert.equal(result.orphanBlue, 0);
      assert.equal(result.rightLabelOverlap, false);
      assert.equal(result.coronaryLabelOverlap, false);
      assert.match(result.coronaryLabel, /分布到心肌/);
      assert.deepEqual(result.clipped, []);
      assert(result.minPx >= 12);
      await page.locator('.state-figure').screenshot({ path: path.join(root, 'materials-src/circulation-routes/shots', width + '-overview-' + state + '.png') });
      results.push({ width, state, ...result });
    }
    await page.close();
  }
  fs.writeFileSync(path.join(root, 'docs/CIRCULATION_ROUTE_MINOR_VERIFY.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
