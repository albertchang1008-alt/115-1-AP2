import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
const spy = 'window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>{const e={k,args};events.push(e);window.captureEvent?.(e);} ]));';
const checkLayout = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
try {
  for (const slug of ['blood-pressure-regulation', 'lymphatic-system', 'hemodynamics']) {
    const content = JSON.parse(fs.readFileSync(path.join(root, 'materials-src', slug, 'content.json'), 'utf8'));
    for (const width of [390, 1280]) {
      // 兩個完整流程：最後答對即關頁、以及按結果鈕後不得重複回報。
      for (const closeWithoutResult of [true, false]) {
        const page = await browser.newPage({ viewport: { width, height: 844 } });
        const errors = [], captured = [], nodes = [], states = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        await page.exposeFunction('captureEvent', e => captured.push(e));
        await page.route('**/materials/course-learning.js', route => route.fulfill({ body: spy, contentType: 'application/javascript' }));
        await page.goto(new URL('file://' + path.join(root, 'public/materials', slug + '-v1', 'index.html')).href);
        assert.equal(await page.evaluate(() => events.length), 0);
        for (const state of content.lab.states) {
          await page.locator('button[data-lab-state="' + state.id + '"]').click();
          const measured = await page.evaluate(id => {
            const svg = document.querySelector('.state-figure svg');
            const panels = [...svg.querySelectorAll('[data-panel]')].filter(g => getComputedStyle(g).display !== 'none');
            if (panels.length !== 1 || panels[0].dataset.panel !== id) throw Error('SVG 狀態未切換');
            const texts = [...svg.querySelectorAll('text')].filter(t => getComputedStyle(t).display !== 'none' && (!t.closest('[data-panel]') || t.closest('[data-panel]') === panels[0]));
            for (const t of texts) {
              const b = t.getBBox(), v = svg.viewBox.baseVal;
              if (b.x < 0 || b.y < 0 || b.x + b.width > v.width || b.y + b.height > v.height) throw Error('主圖文字裁切：' + t.textContent);
            }
            if (document.querySelector('.kit').dataset.slug === 'hemodynamics') {
              const pipe = panels[0].querySelector('rect').getBBox();
              const label = [...panels[0].querySelectorAll('text')].find(t => t.textContent.startsWith('半徑：')).getBBox();
              if (label.y <= pipe.y + pipe.height + 2) throw Error('管壁壓到半徑標籤');
            }
            if (document.querySelector('.kit').dataset.slug === 'lymphatic-system') {
              const marker = svg.querySelector('marker'), route = panels[0].querySelector('path[marker-end]');
              if (marker.getAttribute('markerUnits') !== 'userSpaceOnUse' || +marker.getAttribute('markerWidth') > 9) throw Error('箭頭仍隨粗線放大');
              const end = route.getPointAtLength(route.getTotalLength()), targetX = id === 'right' ? 176 : 224;
              if (Math.hypot(end.x - targetX, end.y - 144) < 8) throw Error('箭頭蓋住靜脈角');
              if (id === 'leg' && !route.getAttribute('d').includes('L200 240V165')) throw Error('胸管未沿中線上行');
            }
            return Math.min(...texts.map(t => parseFloat(getComputedStyle(t).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width));
          }, state.id);
          states.push({ id: state.id, minPx: measured }); assert(measured >= 12);
          await checkLayout(page);
          if (closeWithoutResult) await page.locator('.state-figure').screenshot({ path: path.join(root, 'materials-src', slug, 'shots', width + '-detail-lab-' + state.id + '.png') });
        }
        for (const node of content.nodes) {
          const button = page.locator('[data-node="' + node.id + '"]');
          await button.click();
          const minPx = await page.locator('#detail-' + node.id + ' svg').evaluate(svg => {
            const texts = [...svg.querySelectorAll('text')], v = svg.viewBox.baseVal;
            for (const t of texts) { const b = t.getBBox(); if (b.x < 0 || b.y < 0 || b.x + b.width > v.width || b.y + b.height > v.height) throw Error('節點文字裁切：' + t.textContent); }
            return Math.min(...texts.map(t => parseFloat(getComputedStyle(t).fontSize) * svg.getBoundingClientRect().width / v.width));
          });
          nodes.push({ id: node.id, minPx }); assert(minPx >= 12);
          await checkLayout(page);
          if (closeWithoutResult) await page.locator('#detail-' + node.id + ' .node-figure').screenshot({ path: path.join(root, 'materials-src', slug, 'shots', width + '-detail-node-' + node.id + '.png') });
          await button.click(); await button.click();
        }
        assert.deepEqual(await page.evaluate(() => events.filter(e => e.k === 'explore').map(e => e.args[0]).sort()), content.nodes.map(n => n.id).sort());
        await page.locator('[data-pref="font"]').selectOption('1.3'); await checkLayout(page);
        await page.locator('[data-pref="font"]').selectOption('1');
        for (let i = 0; i < content.foundation.length; i++) {
          const stage = page.locator('[data-kind="foundation"][data-index="' + i + '"]');
          if (!i) { await stage.locator('[data-answer="1"]').click(); assert.match(await stage.locator('.feedback').innerText(), /提示/); }
          await stage.locator('[data-answer="' + content.foundation[i].answer + '"]').click();
          assert.match(await stage.locator('.feedback').innerText(), /答對/);
          assert.equal(await stage.isVisible(), true);
          await stage.locator('.feedback button').click();
        }
        const first = page.locator('[data-kind="case"][data-index="0"]');
        await first.locator('[data-answer="1"]').click();
        assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), 0);
        const retry = first.getByText('重新挑戰本關', { exact: true });
        assert.equal(await retry.isDisabled(), true, '複習前不得重試');
        await first.getByText('前往對應節點複習', { exact: true }).click();
        assert.equal(await retry.isEnabled(), true);
        await retry.click();
        for (let i = 0; i < content.cases.length; i++) {
          const stage = page.locator('[data-kind="case"][data-index="' + i + '"]');
          assert.equal(await stage.locator('[data-answer]').count(), 4);
          await stage.locator('[data-answer="' + content.cases[i].answer + '"]').click();
          const final = i === content.cases.length - 1;
          assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), final ? 1 : 0);
          if (!final) await stage.locator('.feedback button').click();
        }
        assert.equal(await page.locator('.complete-banner').isVisible(), false, '未按結果鈕仍留在最後解析');
        const completeBeforeResult = captured.filter(e => e.k === 'complete').length;
        assert.equal(completeBeforeResult, 1);
        if (!closeWithoutResult) {
          await page.getByText('查看通關結果', { exact: true }).click();
          assert.equal(await page.locator('.complete-banner').isVisible(), true);
          assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), 1);
        }
        await checkLayout(page);
        assert.deepEqual(errors, []);
        await page.close();
        assert.equal(captured.filter(e => e.k === 'complete').length, 1, '關頁前已回報，不依賴結果鈕');
        results.push({ slug, width, flow: closeWithoutResult ? 'close-without-result' : 'show-result', states, nodes, explore: 6, retryRequiresReview: true, completeBeforeResult, completeAfterClose: 1, errors });
      }
    }
  }
  fs.writeFileSync(path.join(root, 'docs', 'PHYSIOLOGY_MATERIALS_VERIFY.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map(r => ({ slug: r.slug, width: r.width, flow: r.flow, mainMinPx: Math.min(...r.states.map(s => s.minPx)), nodeMinPx: Math.min(...r.nodes.map(n => n.minPx)), completeBeforeResult: r.completeBeforeResult, errors: r.errors })), null, 2));
} finally { await browser.close(); }
