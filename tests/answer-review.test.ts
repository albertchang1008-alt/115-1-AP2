import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSync } from 'esbuild';
import { chromium, type Browser, type Page } from 'playwright';
import type { Attempt } from '../shared/model';
import { readabilityMetrics } from '../scripts/lib/readability-metrics.mjs';

const url = 'http://localhost/';
const guideCorrect = '想再鞏固，可以回資訊圖表複習 👉 平面圖形的特徵 ↗';
const guideWrong = '這個觀念在資訊圖表裡有圖解，點進去再看一次 👉 平面圖形的特徵 ↗';
const themes = ['ocean', 'forest', 'violet', 'blossom', 'blossom-rose', 'blossom-violet', 'night'];
const evidence = process.env.ANSWER_REVIEW_EVIDENCE;
let browser: Browser;
let bundle: string;
let style: string;

before(async () => {
  bundle = buildSync({
    entryPoints: ['tests/fixtures/answer-review.tsx'],
    bundle: true,
    write: false,
    jsx: 'automatic',
    format: 'iife',
    platform: 'browser',
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  }).outputFiles[0].text;
  style = readFileSync('src/style.css', 'utf8').replace(/@import[^;]+;/g, '');
  browser = await (process.env.CHROME_PATH
    ? chromium.launch({ executablePath: process.env.CHROME_PATH })
    : chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch()));
  if (evidence) mkdirSync(evidence, { recursive: true });
});
after(async () => { await browser?.close(); });

async function mount(page: Page, kind: string, theme = 'blossom', size = 'default') {
  page.setDefaultTimeout(8_000);
  page.on('pageerror', (error) => console.error(error));
  await page.route('**/*', (route) => route.request().url() === url
    ? route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="zh-Hant"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div></html>',
    })
    : route.abort());
  await page.goto(url);
  await page.evaluate(([theme, size]) => {
    localStorage.setItem('course-theme', theme);
    localStorage.setItem('course-font-scale', size);
  }, [theme, size]);
  await page.addStyleTag({ content: style });
  await page.addScriptTag({ content: bundle });
  await page.evaluate((kind) => (window as any).answerReviewTest.mount(kind), kind);
}
function submissions(page: Page): Promise<Attempt[]> {
  return page.evaluate(() => (window as any).answerReviewTest.submitted);
}
function button(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true });
}
const dialog = (page: Page) => page.getByRole('dialog', { name: /確定交卷/ });
const quizChoice = (page: Page, name: string) => page.getByRole('radio', { name, exact: true });

async function answerWithSkip(page: Page) {
  const options = page.getByRole('radio');
  await options.nth(3).waitFor();
  assert.deepEqual(await options.allTextContents(), ['長方形', '三角形', '圓形', '六邊形']);
  await quizChoice(page, '圓形').click();
  await button(page, '下一題').click();
  await button(page, '下一題').click();
  await quizChoice(page, '三角形').click();
  await button(page, '完成並提交').click();
  await dialog(page).waitFor();
}
async function assertMixedVerdicts(page: Page) {
  const cards = page.locator('.reviewanswer');
  await cards.nth(2).waitFor();
  assert.deepEqual(await cards.locator('.review-verdict').allTextContents(), ['✅ 答對', '⚪ 未作答', '❌ 答錯']);
  assert.deepEqual(await cards.locator('.your-answer').allTextContents(), ['你的答案：圓形', '你的答案：未作答', '你的答案：三角形']);
  assert.deepEqual(await cards.locator('.lecture-guide').allTextContents(), [guideCorrect, guideWrong, guideWrong]);
  assert.equal(await cards.nth(0).getByText('查看補強教材 ↗', { exact: true }).count(), 1);
  assert.equal(await cards.nth(0).locator('.lecture-guide a').count(), 1);
  assert.equal(await cards.nth(0).locator('.lecture-guide a').getAttribute('href'), 'https://example.test/materials/shapes/');
  assert.deepEqual(await cards.evaluateAll((nodes) => nodes.map((node) => node.classList[1])), ['is-ok', 'is-skip', 'is-bad']);
  assert.equal(await cards.nth(0).locator('.right').textContent(), '✓ 圓形（正確答案・你的選擇）');
  assert.equal(await cards.nth(2).locator('.picked').textContent(), '✗ 三角形（你的選擇）');
  assert.equal(await cards.nth(2).locator('.right').textContent(), '✓ 圓形（正確答案）');
  assert.deepEqual(await cards.nth(1).locator('.review-options li').allTextContents(), ['• 長方形', '• 三角形', '✓ 圓形（正確答案）', '• 六邊形']);
  const counts = await page.locator('.result-counts span').allTextContents();
  assert.deepEqual(counts, ['答對：1 題', '答錯：1 題', '未作答：1 題']);
  assert.equal(counts.reduce((sum, item) => sum + Number(item.match(/\d+/)?.[0]), 0), await cards.count());
  const score = (await submissions(page))[0].score;
  assert.equal(score, 33);
}

test('完整測驗／複習考：交卷確認、鍵盤取消、跳回首題未作答、三態與洗牌後原選項 ID', async () => {
  for (const kind of ['full', 'review']) {
    const page = await browser.newPage();
    try {
      await mount(page, kind);
      await answerWithSkip(page);
      assert.equal(await dialog(page).getByRole('heading').innerText(), '還有 1 題未作答，確定交卷？');
      assert.equal(await button(page, '回到第一題未作答').evaluate((node) => node === document.activeElement), true);
      assert.deepEqual(await submissions(page), []);
      await page.keyboard.press('Escape');
      await dialog(page).waitFor({ state: 'detached' });
      assert.equal(await button(page, '完成並提交').evaluate((node) => node === document.activeElement), true);
      await button(page, '完成並提交').click();
      await button(page, '回到第一題未作答').click();
      await page.getByRole('heading', { name: '示例乙：哪個圖形沒有頂點？' }).waitFor();
      await page.waitForFunction(() => document.activeElement === document.querySelector('.options button'));
      assert.deepEqual(await submissions(page), []);
      await button(page, '下一題').click();
      assert.equal(await quizChoice(page, '三角形').getAttribute('aria-checked'), 'true');
      await button(page, '完成並提交').click();
      await button(page, '確定交卷').click();
      await assertMixedVerdicts(page);
      assert.deepEqual((await submissions(page))[0].answers.map((answer) => answer.selected), ['d', '', 'a']);
      assert.equal(await page.locator('.quiz-timeout').count(), 0);
      if (kind === 'review') await page.getByText('圖形 1/1 ・ 曲線 0/2', { exact: true }).waitFor();
    } finally { await page.close(); }
  }
});

test('全部作答直接交卷；抽題練習須逐題作答、鎖定並顯示選擇', async () => {
  for (const kind of ['full', 'draw']) {
    const page = await browser.newPage();
    try {
      await mount(page, kind);
      if (kind === 'draw') assert.equal(await button(page, '下一題').isDisabled(), true);
      for (let i = 0; i < 3; i++) {
        if (kind === 'draw' && i === 2) assert.equal(await button(page, '完成並提交').isDisabled(), true);
        await quizChoice(page, '圓形').click();
        if (kind === 'draw') {
          await page.locator('.feedback .your-answer').getByText('圓形', { exact: false }).waitFor();
          await page.locator('.feedback').getByText(guideCorrect, { exact: true }).waitFor();
          assert.equal(await quizChoice(page, '圓形').isDisabled(), true);
        }
        if (i < 2) await button(page, '下一題').click();
      }
      await button(page, '完成並提交').click();
      await page.locator('.quizresult').waitFor();
      assert.equal(await dialog(page).count(), 0);
      assert.equal(await page.locator('.quiz-timeout').count(), 0);
      assert.equal((await submissions(page)).length, 1);
    } finally { await page.close(); }
  }
});

test('時間到時關閉未作答確認並只交卷一次；全答完省略未作答件數', async () => {
  for (const kind of ['partial', 'complete', 'draw']) {
    const page = await browser.newPage();
    try {
      await page.clock.install();
      await mount(page, kind === 'draw' ? 'draw' : 'full');
      if (kind === 'partial') await answerWithSkip(page);
      if (kind === 'complete') {
        for (let i = 0; i < 3; i++) {
          await quizChoice(page, '圓形').click();
          if (i < 2) await button(page, '下一題').click();
        }
      }
      await page.clock.fastForward(181_000);
      await page.locator('.quiz-timeout').waitFor();
      const expected = { partial: '，未作答 1 題', complete: '', draw: '，未作答 3 題' }[kind];
      assert.equal(await page.locator('.quiz-timeout').textContent(), '時間到，已自動交卷' + expected);
      assert.equal(await dialog(page).count(), 0);
      await page.clock.fastForward(2_000);
      assert.equal((await submissions(page)).length, 1);
    } finally { await page.close(); }
  }
});

test('閃卡、綜合練習、錯題複習回饋與結果以選項文字顯示，教師和無連結情境略過引導句', async () => {
  for (const kind of ['flashcards', 'mixed', 'wrong', 'guides']) {
    const page = await browser.newPage();
    try {
      await mount(page, kind);
      if (kind === 'guides') {
        for (const scope of ['#teacher-guide', '#unknown-guide', '#missing-guide']) {
          const region = page.locator(scope);
          await region.waitFor();
          assert.equal(await region.locator('.lecture-guide').count(), 0);
          assert.equal(await region.getByRole('link').count(), scope === '#missing-guide' ? 1 : 2);
        }
      } else if (kind === 'flashcards') {
        await button(page, '翻面').click();
        await page.getByText('你的答案：未作答', { exact: true }).waitFor();
        await page.getByText(guideWrong, { exact: true }).waitFor();
        await button(page, '我會').click();
        await button(page, '圓形').click();
        await button(page, '翻面').click();
        await page.getByText('你的答案：圓形', { exact: true }).waitFor();
        await page.getByText(guideCorrect, { exact: true }).waitFor();
        assert.deepEqual(await submissions(page), []);
      } else {
        await button(page, '三角形').click();
        await button(page, '送出答案').click();
        await page.getByText('你的答案：三角形', { exact: true }).waitFor();
        await page.getByText(guideWrong, { exact: true }).waitFor();
        await button(page, '下一題').click();
        await button(page, '圓形').click();
        await button(page, '送出答案').click();
        await page.getByText('你的答案：圓形', { exact: true }).waitFor();
        await page.getByText(guideCorrect, { exact: true }).waitFor();
        await button(page, '查看結果').click();
        await page.locator('.reviewanswer').nth(1).waitFor();
        assert.deepEqual(await page.locator('.reviewanswer .your-answer').allTextContents(), ['你的答案：三角形', '你的答案：圓形']);
      }
    } finally { await page.close(); }
  }
});

test('結果卡、引導句與確認視窗符合 7 色系 × 2 視窗 × 2 字級的閱讀規範', async () => {
  for (const theme of themes) {
    for (const width of [390, 1280]) {
      for (const scale of [1, 1.3]) {
        const label = `${width}-${theme}-${scale === 1 ? 'default' : 'xlarge'}`;
        const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 800 } });
        try {
          await page.clock.install();
          await mount(page, 'full', theme, scale === 1 ? 'default' : 'xlarge');
          await answerWithSkip(page);
          assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
          const modal = await page.evaluate(readabilityMetrics, { scale });
          const modalIssues = modal.issues.filter(({ selector }) => /quiz-submit-dialog|^#quiz-submit-title$|^html$/.test(selector));
          assert.equal(modal.controls.filter(({ selector }) => selector.includes('quiz-submit-dialog')).length, 2);
          assert.deepEqual(modalIssues, [], `確認視窗 ${label}`);
          if (evidence && theme === 'night' && (width === 390 ? scale === 1.3 : scale === 1)) {
            await page.screenshot({ path: join(evidence, `${label}-confirm.png`), animations: 'disabled' });
          }
          await page.clock.fastForward(181_000);
          await assertMixedVerdicts(page);
          assert.equal(await page.locator('.quiz-timeout').textContent(), '時間到，已自動交卷，未作答 1 題');
          const result = await page.evaluate(readabilityMetrics, { scale });
          assert.deepEqual(result.issues, [], `結果頁 ${label}`);
          assert.ok(result.texts.some((text) => text.text === '你的答案：' && text.cssPx >= 18 * scale - 0.05));
          assert.notEqual(await page.locator('.is-skip').evaluate((node) => getComputedStyle(node).backgroundColor),
            await page.locator('.is-bad').evaluate((node) => getComputedStyle(node).backgroundColor));
          if (evidence && scale === 1 && theme === (width === 390 ? 'blossom' : 'night')) {
            await page.screenshot({ path: join(evidence, `${label}-results.png`), fullPage: true, animations: 'disabled' });
          }
          console.log(`PASS ${label} 確認視窗＋結果頁：${result.texts.length} 個文字元素，${result.controls.length} 個可點區域`);
        } finally { await page.close(); }
      }
    }
  }
});
