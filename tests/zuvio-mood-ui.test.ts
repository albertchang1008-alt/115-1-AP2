import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';

test('F5/R4：實際 ZuvioMoodOverlay 手機390預設與特大可讀性（含錯誤態>=18px、重試與完成態）', async () => {
  const bundle = buildSync({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { ZuvioMoodOverlay } from './src/ZuvioMoodCard';
        const prompt = { active: true, examId: 'e1', sittingId: 's1', sittingLabel: '第1場', closesAt: Date.now() + 60000 };
        let tries = 0;
        createRoot(document.getElementById('root')).render(
          React.createElement(ZuvioMoodOverlay, {
            prompt,
            onSubmit: async () => {
              tries++;
              if (tries === 1) throw new Error('網路暫時不穩，請再試一次');
              return { ok: true, alreadySubmitted: false, mood: 'green_flow', feedback: '很棒的節奏！趁著記憶最清晰的時候，順手把幾道不確定的題目確認一下就大功告成了。' };
            },
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
      assert.ok(metrics.qSize >= 19 * scale - 0.1);
      assert.ok(metrics.subnoteSize >= 18 * scale - 0.1);
      for (const s of metrics.btnSizes) assert.ok(s >= 18 * scale - 0.1);
      for (const h of metrics.btnHeights) assert.ok(h >= 44);
      assert.ok(metrics.submitSize >= 18 * scale - 0.1);
      assert.ok(metrics.submitHeight >= 44);
      assert.ok(metrics.scrollWidth <= metrics.innerWidth);

      // 選取第一個選項並首次送出（預期失敗並顯示 >=18px 錯誤訊息）
      await page.click('.zext-mood-btn');
      await page.click('.zext-submit');
      await page.waitForSelector('.zext-err');
      const errMetrics = await page.evaluate(() => {
        const err = document.querySelector('.zext-err')!;
        return {
          text: err.textContent || '',
          size: parseFloat(getComputedStyle(err).fontSize),
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });
      assert.ok(errMetrics.text.includes('網路暫時不穩'));
      assert.ok(errMetrics.size >= 18 * scale - 0.1, `errSize=${errMetrics.size} < ${18 * scale}`);
      assert.ok(errMetrics.scrollWidth <= errMetrics.innerWidth);

      // 重試送出成功，檢查完成態可讀性
      await page.click('.zext-submit');
      await page.waitForSelector('.zext-feedback-text');
      const doneMetrics = await page.evaluate(() => {
        const fb = document.querySelector('.zext-feedback-text')!;
        const backBtn = document.querySelector('.zext-submit') as HTMLElement;
        return {
          fbSize: parseFloat(getComputedStyle(fb).fontSize),
          backSize: parseFloat(getComputedStyle(backBtn).fontSize),
          backHeight: backBtn.getBoundingClientRect().height,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });
      assert.ok(doneMetrics.fbSize >= 18 * scale - 0.1);
      assert.ok(doneMetrics.backSize >= 18 * scale - 0.1);
      assert.ok(doneMetrics.backHeight >= 44);
      assert.ok(doneMetrics.scrollWidth <= doneMetrics.innerWidth);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test('R1/R2/R5：Report 元件實際渲染無成績場次、逐題練過比較、關心新欄位及關旗標隱藏', async () => {
  const bundle = buildSync({
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { Report } from './src/ZuvioExams';
        import { sampleZuvioApi } from './src/zuvioApi';
        import { SAMPLE_POOL } from './shared/zuvioSamplePool';

        const base = sampleZuvioApi(SAMPLE_POOL);
        const mode = window.__REPORT_MODE__;
        const fakeApi = {
          ...base,
          async listExams() {
            if (mode === 'no-results') {
              return [{
                id: 'e_future', title: '未來考卷', createdAt: Date.now(), count: 2, score: 50, archived: false,
                sittings: [{ id: 's_fut', label: '未來場次', date: '2026-11-20', startsAt: Date.now() + 86400000, classIds: ['A'] }],
              }];
            }
            return [{
              id: 'e_done', title: '已考考卷', createdAt: Date.now(), count: 2, score: 50, archived: false,
              sittings: [{ id: 's_done', label: '正式場次', date: '2026-11-15', startsAt: Date.now() - 86400000, classIds: ['A'], results: { importedAt: Date.now(), revision: 1, matched: 2, counts: {} } }],
            }];
          },
          async fullReport() {
            if (mode === 'flag-off') {
              return {
                report: { students: 2, questions: [{ no: 1, questionId: 'q1', unitId: 'u1', text: '題1', answer: 'a', options: [], ok: 2, blank: 0, rate: 1 }], subunits: [{ unitId: 'u1', title: '腎絲球', rate: 1 }], classes: [] },
                compare: null,
                moodEnabled: false,
              };
            }
            const hasRes = mode !== 'no-results';
            return {
              report: { students: hasRes ? 2 : 0, questions: [{ no: 1, questionId: 'q1', unitId: 'u1', text: '題1', answer: 'a', options: [], ok: 1, blank: 0, rate: 0.5 }], subunits: [{ unitId: 'u1', title: '腎絲球', rate: 0.5 }], classes: [] },
              compare: null,
              moodEnabled: true,
              analysis: { summary: { students: hasRes ? 2 : 0, lowSample: true, itemCount: 1, mean: 50, sd: 0, min: 50, max: 50, kr20: null, kr20Low: false, sem: null, group27Count: 1, scoreBins: [] }, items: [{ qid: 'q1', label: 'Q1', type: 'u1', correctKey: 'A', n: 2, answered: 2, blank: 0, p: 0.5, d: 1, rpb: 0, distractors: [], flags: [] }] },
              moodSummary: { counts: { red_volcano: 0, yellow_rubberband: 0, blue_caterpillar: 1, green_flow: 1, gray_fog: 0 }, totalResponded: 2, threshold: 80, byScore: [{ code: 'blue_caterpillar', label: '毛毛蟲', color: '#3B82C4', highCount: 0, lowCount: 1, total: 1, passRate: 0 }], byQuestion: [], shifts: null },
              preExamCounts: { passed: 0, practiced: 1, infographic_only: 0, none: 1 },
              preExamDetail: { avgCoverage: 50, hasResults: hasRes, byQuestion: [{ qid: 'q1', label: 'Q1', practicedCount: 1, practicedCorrect: 1, practicedAccuracy: 1, practicedD: 1, practicedWrongCount: 0, practicedWrongCorrect: 0, practicedWrongAccuracy: null, unpracticedCount: 1, unpracticedCorrect: 0, unpracticedAccuracy: 0, unpracticedD: 0 }], coverageBands: [{ label: '0%', count: 1, avgPercentage: hasRes ? 0 : null }, { label: '100%', count: 1, avgPercentage: hasRes ? 100 : null }] },
              preExamIncomplete: mode === 'incomplete',
            };
          },
          async careList() {
            const inc = mode === 'incomplete';
            return {
              threshold: 80,
              preExamIncomplete: inc,
              entries: [{ uid: 'u1', studentId: 'S1', name: '王小明', maskedName: '王○明', classId: 'A', score: 40, percentage: 40, mood: 'blue_caterpillar', preExamStatus: 'none', preExamCoverage: 0, preExamIncomplete: inc, practiceGroup: inc ? '練習資料不完整' : '沒練習＋低分＋藍色', tags: ['可能需要鷹架'], streakNotes: [] }],
            };
          },
        };
        createRoot(document.getElementById('root')).render(
          React.createElement(Report, { api: fakeApi, initial: '', moodEnabled: mode !== 'flag-off' })
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

  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  try {
    for (const mode of ['no-results', 'with-results', 'incomplete', 'flag-off']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>`);
      await page.evaluate((m) => { (window as any).__REPORT_MODE__ = m; }, mode);
      await page.addScriptTag({ content: bundle });
      await page.waitForSelector('.z-card');
      await page.waitForTimeout(150);
      const txt = await page.evaluate(() => document.body.innerText);

      if (mode === 'no-results') {
        assert.ok(txt.includes('尚無成績'));
        assert.ok(txt.includes('考前練習詳細統計'));
        assert.ok(txt.includes('全班平均題目覆蓋率 50%'));
        assert.ok(txt.includes('高分門檻 (%)'));
      } else if (mode === 'with-results') {
        assert.ok(txt.includes('逐題：練過 vs 沒練過答對率與鑑別度'));
        assert.ok(txt.includes('練習分類'));
        assert.ok(txt.includes('沒練習＋低分＋藍色'));
        assert.ok(txt.includes('none（0%）'));
      } else if (mode === 'incomplete') {
        assert.ok(txt.includes('考前練習資料不完整'));
        assert.ok(txt.includes('資料不完整'));
        assert.ok(txt.includes('練習資料不完整'));
        assert.ok(!txt.includes('沒練習＋低分＋藍色'));
        const btns = await page.evaluate(() =>
          [...document.querySelectorAll('button')].map((b) => ({ text: b.textContent || '', disabled: (b as HTMLButtonElement).disabled })),
        );
        assert.equal(btns.find((b) => b.text.includes('試題分析 CSV'))?.disabled, false);
        assert.equal(btns.find((b) => b.text.includes('研究 CSV（去識別）'))?.disabled, true);
        assert.equal(btns.find((b) => b.text.includes('研究 CSV（具名'))?.disabled, true);
      } else if (mode === 'flag-off') {
        assert.ok(txt.includes('場次摘要'));
        assert.ok(!txt.includes('考前練習詳細統計'));
        assert.ok(!txt.includes('關懷名單'));
        assert.ok(!txt.includes('研究 CSV'));
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
