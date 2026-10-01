// 在記憶體載入其他教材與目前kit，不寫入或重建已驗收的public教材。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const kit = fs.readFileSync(path.join(root, 'materials-src/kit/kit.js'), 'utf8').replace(/^export /gm, '');
const css = fs.readFileSync(path.join(root, 'materials-src/kit/kit.css'), 'utf8');
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const slug of ['heart-structure', 'cardiac-cycle', 'cardiac-conduction', 'ecg-basics', 'blood-vessels', 'circulation-routes']) {
    const content = JSON.parse(fs.readFileSync(path.join(root, 'materials-src', slug, 'content.json'), 'utf8'));
    const figures = Object.fromEntries([...new Set([content.lab.figure, ...content.nodes.map(n => n.figure)].filter(Boolean))].map(f => [f, fs.readFileSync(path.join(root, 'materials-src/figures', f), 'utf8')]));
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setContent('<html><head><style>' + css + '</style></head><body></body></html>');
    await page.addScriptTag({ content: 'window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>events.push({k,args})]));' });
    if (content.lab.widget) {
      const widgets = ['ecg-model.js', 'ecg-draw.js', 'ecg-sim.js', 'ecg-label.js'].map(f => fs.readFileSync(path.join(root, 'materials-src/widgets', f), 'utf8').replace(/^export /gm, '')).join('\n');
      await page.addScriptTag({ content: widgets });
    }
    await page.addScriptTag({ content: kit });
    await page.evaluate(({ content, figures }) => mount(content, figures), { content, figures });
    assert.equal(await page.evaluate(() => events.length), 0);
    for (const n of content.nodes) await page.locator('[data-node="' + n.id + '"]').click();
    assert.equal(await page.evaluate(() => events.filter(e => e.k === 'explore').length), 6);
    for (let i = 0; i < content.foundation.length; i++) {
      const stage = page.locator('[data-kind="foundation"][data-index="' + i + '"]');
      await stage.waitFor({ state: 'visible' });
      const q = content.foundation[i];
      if (q.type === 'label') {
        await stage.locator('.q-widget').evaluate((el, target) => {
          const state = el.__ecg, range = candidates(target, state.beats, state.view)[0];
          if (!range) throw Error('ECG標示候選範圍缺失');
          const a = el.querySelector('.ecg-start'), b = el.querySelector('.ecg-end');
          a.value = range[0].toFixed(2); a.dispatchEvent(new Event('input'));
          b.value = range[1].toFixed(2); b.dispatchEvent(new Event('input'));
        }, q.target);
        await stage.locator('.ecg-check').click();
      } else await stage.locator('[data-answer="' + q.answer + '"]').click();
    }
    const first = page.locator('[data-kind="case"][data-index="0"]');
    await first.waitFor({ state: 'visible' });
    await first.locator('[data-answer="' + ((content.cases[0].answer + 1) % 4) + '"]').click();
    assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), 0);
    assert.equal(await first.getByText('重新挑戰本關').isDisabled(), true);
    await first.getByText('前往對應節點複習').click();
    await first.getByText('重新挑戰本關').click();
    for (let i = 0; i < content.cases.length; i++) {
      const stage = page.locator('[data-kind="case"][data-index="' + i + '"]');
      await stage.waitFor({ state: 'visible' });
      await stage.locator('[data-answer="' + content.cases[i].answer + '"]').click();
      assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), i === content.cases.length - 1 ? 1 : 0);
    }
    await page.waitForFunction(() => document.querySelector('[data-kind="case"][data-index="4"]').hidden);
    assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), 1);
    assert.deepEqual(errors, []);
    results.push({ slug, inMemoryOnly: true, explored: 6, foundationPassed: content.foundation.length, retryRequiresReview: true, completeOnLastAnswer: 1, errors });
    await page.close();
  }
  fs.writeFileSync(path.join(root, 'docs/MATERIAL_KIT_REGRESSION_VERIFY.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
