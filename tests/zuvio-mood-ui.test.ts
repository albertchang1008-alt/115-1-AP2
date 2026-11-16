import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';

test('F5：實際 ZuvioMoodOverlay 手機390預設與特大可讀性（字級>=18px、按鈕高>=44px、無溢出、選取狀態）', async () => {
  const bundle = buildSync({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { ZuvioMoodOverlay } from './src/ZuvioMoodCard';
        const prompt = { active: true, examId: 'e1', sittingId: 's1', sittingLabel: '第1場', closesAt: Date.now() + 60000 };
        createRoot(document.getElementById('root')).render(
          React.createElement(ZuvioMoodOverlay, {
            prompt,
            onSubmit: async () => ({ ok: true, alreadySubmitted: false, mood: 'green_flow', feedback: 'ok' }),
            onDismissAfterSubmit: () => {},
          })
        );
      `,
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' },
  }).outputFiles[0].text;

  const css = [
    fs.readFileSync('src/style.css', 'utf8'),
    fs.readFileSync('src/zuvio-exams.css', 'utf8'),
    fs.readFileSync('src/zuvio-ext-sample.css', 'utf8'),
  ].join('\n');

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div></body></html>`;

  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  try {
    for (const scale of [1, 1.3]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.setContent(html, { waitUntil: 'load' });
      await page.addScriptTag({ content: bundle });
      await page.waitForSelector('.zext-q');
      await page.evaluate((sc) => {
        document.documentElement.style.setProperty('--font-scale', String(sc));
      }, scale);

      const metrics = await page.evaluate(() => {
        const q = document.querySelector('.zext-q')!;
        const subnote = document.querySelector('.zext-subnote')!;
        const btns = [...document.querySelectorAll('.zext-mood-btn')] as HTMLElement[];
        const submit = document.querySelector('.zext-submit') as HTMLElement;
        return {
          qSize: parseFloat(getComputedStyle(q).fontSize),
          subnoteSize: parseFloat(getComputedStyle(subnote).fontSize),
          subnoteText: subnote.textContent || '',
          btnSizes: btns.map((b) => parseFloat(getComputedStyle(b).fontSize)),
          btnHeights: btns.map((b) => b.getBoundingClientRect().height),
          submitSize: parseFloat(getComputedStyle(submit).fontSize),
          submitHeight: submit.getBoundingClientRect().height,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });

      assert.equal(metrics.subnoteText, '此題不計分，老師會看到你的選擇，用來調整教學');
      assert.ok(metrics.qSize >= 19 * scale - 0.1, `qSize=${metrics.qSize} < ${19 * scale}`);
      assert.ok(metrics.subnoteSize >= 18 * scale - 0.1, `subnoteSize=${metrics.subnoteSize} < ${18 * scale}`);
      for (const s of metrics.btnSizes) assert.ok(s >= 18 * scale - 0.1, `btnSize=${s}`);
      for (const h of metrics.btnHeights) assert.ok(h >= 44, `btnHeight=${h} < 44`);
      assert.ok(metrics.submitSize >= 18 * scale - 0.1, `submitSize=${metrics.submitSize}`);
      assert.ok(metrics.submitHeight >= 44, `submitHeight=${metrics.submitHeight} < 44`);
      assert.ok(metrics.scrollWidth <= metrics.innerWidth, `overflow: ${metrics.scrollWidth} > ${metrics.innerWidth}`);

      // 點選第一個選項，驗證選取狀態
      await page.click('.zext-mood-btn');
      const selected = await page.evaluate(() => {
        const first = document.querySelector('.zext-mood-btn')!;
        const submit = document.querySelector('.zext-submit') as HTMLButtonElement;
        return {
          hasClass: first.classList.contains('is-selected'),
          ariaChecked: first.getAttribute('aria-checked'),
          submitDisabled: submit.disabled,
        };
      });
      assert.equal(selected.hasClass, true);
      assert.equal(selected.ariaChecked, 'true');
      assert.equal(selected.submitDisabled, false);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
