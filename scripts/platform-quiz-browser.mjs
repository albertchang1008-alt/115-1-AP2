import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';

const options = process.argv.slice(2);
const out = options[0] === '--out' && options[1] ? path.resolve(options[1]) : fs.mkdtempSync(path.join(os.tmpdir(), 'platform-quiz-browser-'));
fs.mkdirSync(out, { recursive: true });
const files = buildSync({
  entryPoints: ['tests/fixtures/platform-quiz-browser.tsx'], bundle: true, write: false,
  outfile: 'ui.js', format: 'iife', platform: 'browser', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
}).outputFiles;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(
    '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/ui.css"><style>.pq-fixture-shell{width:min(100% - 32px,1200px);margin:16px auto}</style><main id="root"></main><script src="/ui.js"></script>',
  );
  const file = files.find((candidate) => path.basename(candidate.path) === pathname.slice(1));
  if (!file) return res.writeHead(404).end();
  return res.writeHead(200, { 'Content-Type': pathname.endsWith('.css') ? 'text/css' : 'application/javascript' }).end(file.contents);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const host = 'http://127.0.0.1:' + server.address().port;
const browser = await (process.env.CHROME_PATH
  ? chromium.launch({ executablePath: process.env.CHROME_PATH })
  : chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
).catch((error) => { server.close(); throw error; });

const student = ['waiting', 'ready', 'answering', 'confirm', 'submitted', 'mood', 'feedback', 'released'];
const teacher = ['classes', 'class-quizzes', 'prepare', 'monitor', 'crowd', 'results'];
const problems = [];
const screens = [];
const lifecycle = [];
async function goto(page, screen, scale) {
  await page.goto(host + '/?screen=' + screen + '&scale=' + scale);
  await page.locator(student.includes(screen) ? '[data-quiz-screen]' : '[data-quiz-teacher]').waitFor();
}

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', (error) => problems.push({ type: 'JS', message: error.message }));
    for (const scale of ['default', 'xlarge']) {
      for (const screen of [...student, ...teacher]) {
        await goto(page, screen, scale);
        if (screen === 'results') await page.getByRole('heading', { name: '成績分布' }).waitFor();
        const measurements = await page.evaluate(({ screen, isStudent, scale }) => {
          const root = document.querySelector(isStudent ? '[data-quiz-screen]' : '[data-quiz-teacher]');
          const failed = [];
          const minimum = scale === 'xlarge' ? 1.3 : 1;
          const visible = (node) => !!node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
          const requiredSize = (node) => node.classList.contains('pq-question') ? 19 : node.matches('h1,h2,h3') ? 21 : 18;
          const colorCanvas = document.createElement('canvas');
          colorCanvas.width = 1;
          colorCanvas.height = 1;
          const colorContext = colorCanvas.getContext('2d', { willReadFrequently: true });
          const levels = (css) => {
            colorContext.clearRect(0, 0, 1, 1);
            colorContext.fillStyle = css;
            colorContext.fillRect(0, 0, 1, 1);
            return [...colorContext.getImageData(0, 0, 1, 1).data];
          };
          function background(node) {
            for (let element = node; element; element = element.parentElement) {
              const parsed = levels(getComputedStyle(element).backgroundColor);
              if (parsed[3] === 255) return parsed.slice(0, 3);
            }
            return [255, 255, 255];
          }
          const luminance = (pixels) => pixels.reduce((sum, byte, i) => {
            const channel = byte / 255;
            return sum + (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
          }, 0);
          for (const el of root.querySelectorAll(isStudent ? 'h1,h2,h3,p,button,span.pq-time' : 'button')) {
            if (!visible(el)) continue;
            const style = getComputedStyle(el);
            const size = parseFloat(style.fontSize);
            const height = el.getBoundingClientRect().height;
            const disabled = el instanceof HTMLButtonElement && el.disabled;
            if (isStudent && size + .1 < requiredSize(el) * minimum) failed.push('文字字級 ' + el.tagName + ' ' + size);
            if (isStudent && el.matches('button') && height < 44) failed.push('按鈕點擊高度 ' + height);
            if (isStudent && !disabled) {
              const a = luminance(levels(style.color).slice(0, 3));
              const b = luminance(background(el));
              if ((Math.max(a, b) + .05) / (Math.min(a, b) + .05) < 4.5) failed.push('文字對比 ' + el.tagName);
            }
            if (el.scrollWidth - el.clientWidth > 2 && getComputedStyle(el).overflowX === 'visible') failed.push('文字溢出 ' + el.tagName);
          }
          if (document.documentElement.scrollWidth - innerWidth > 1) failed.push('頁面橫向溢出');
          // 即時監看 v3（#73）：名字至少 18px，按鈕點擊高度至少 44px
          for (const el of root.querySelectorAll('.pq-live button, .pq-live-chips li, .pq-live-away li, .pq-live-repeat li')) {
            if (!visible(el)) continue;
            if (el.matches('button') && !el.matches('.pq-live-quiet') && el.getBoundingClientRect().height < 44) failed.push('監看按鈕高度 ' + el.textContent);
            if (el.matches('.pq-live-chips li, .pq-live-chips button, .pq-live-away li, .pq-live-repeat li') && parseFloat(getComputedStyle(el).fontSize) + .1 < 18) failed.push('監看名字字級 ' + el.textContent);
          }
          const optionBoxes = [...root.querySelectorAll('.pq-options button')].map((el) => el.getBoundingClientRect());
          if (optionBoxes.some((rect, i) => i > 0 && rect.top < optionBoxes[i - 1].bottom)) failed.push('選項重疊');
          return { screen, scale, width: innerWidth, failed };
        }, { screen, isStudent: student.includes(screen), scale });
        screens.push(measurements);
        if (measurements.failed.length) problems.push(measurements);
        if (viewport.width === 390 && screen === 'answering')
          await page.screenshot({ path: path.join(out, 'student-390-' + scale + '.png'), animations: 'disabled' });
        if (viewport.width === 390 && scale === 'default' && screen === 'monitor')
          await page.screenshot({ path: path.join(out, 'teacher-monitor-390.png'), animations: 'disabled' });
        if (scale === 'default' && screen === 'crowd')
          await page.screenshot({ path: path.join(out, 'teacher-crowd-' + viewport.width + '.png'), animations: 'disabled', fullPage: true });
      }
    }
    await page.close();
  }
  {
    // 教室投影寬度（#73）：54 人的監看頁在 1920×1080 一頁看完
    const wide = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    wide.on('pageerror', (error) => problems.push({ type: 'JS', message: error.message }));
    await goto(wide, 'crowd', 'default');
    await wide.addStyleTag({ content: '.pq-fixture-shell{width:min(100% - 32px,1840px)}' });
    const fits = await wide.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1);
    screens.push({ screen: 'crowd', scale: 'default', width: 1920, failed: fits ? [] : ['1920×1080 需要捲動'] });
    if (!fits) problems.push({ screen: 'crowd', width: 1920, failed: ['1920×1080 需要捲動'] });
    await wide.screenshot({ path: path.join(out, 'teacher-crowd-1920.png'), animations: 'disabled' });
    await wide.getByRole('button', { name: '放大 QR' }).click();
    await wide.getByRole('dialog', { name: '掃描進入小考' }).waitFor();
    await wide.screenshot({ path: path.join(out, 'teacher-qr-1920.png'), animations: 'disabled' });
    await wide.keyboard.press('Escape');
    assert.equal(await wide.getByRole('dialog').count(), 0);
    await goto(wide, 'results', 'default');
    await wide.getByRole('heading', { name: /切出畫面紀錄/ }).waitFor();
    await wide.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await goto(page, 'ready', 'default');
  await page.getByRole('button', { name: '開始作答' }).click();
  await page.getByRole('button', { name: '在同一題選擇另一個答案' }).click();
  assert.equal(await page.getByRole('button', { name: '在同一題選擇另一個答案' }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: '交卷', exact: true }).click();
  await page.getByRole('button', { name: '確認交卷' }).click();
  await page.locator('.pq-options button').first().click();
  await page.getByRole('button', { name: '送出', exact: true }).click();
  await page.getByRole('button', { name: '繼續' }).click();
  await page.getByRole('heading', { name: '已交卷' }).waitFor();
  const snapshot = () => page.evaluate(() => {
    const { calls, active, disposals, subscriptions } = window.quizMonitorTest.stats;
    return { calls, active, disposals, subscriptions };
  });
  const setHidden = (hidden) => page.evaluate((flag) => window.quizMonitorTest.setHidden(flag), hidden);
  async function zero(label, waitMs = 150) {
    const start = await snapshot();
    assert.equal(start.active, 0, label);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    assert.deepEqual(await snapshot(), start, label);
    lifecycle.push({ label, milliseconds: waitMs, newCalls: 0, newSubscriptions: 0, active: 0 });
  }
  await goto(page, 'monitor', 'default');
  assert.equal((await snapshot()).active, 2);
  await page.getByRole('button', { name: '關閉監看' }).click();
  await setHidden(true);
  await setHidden(false);
  const minute = process.env.QUIZ_CLOSE_WINDOW_MS ? Number(process.env.QUIZ_CLOSE_WINDOW_MS) : 60000;
  await zero('手動關閉後切背景與前景', minute);
  await goto(page, 'monitor', 'default');
  await page.getByRole('button', { name: '← 合成甲班的小考' }).click();
  await zero('離開場次');
  await goto(page, 'monitor', 'default');
  await page.getByRole('button', { name: '切換到別的課程' }).click();
  await zero('切換課程');
  await goto(page, 'monitor', 'default');
  await setHidden(true);
  await zero('背景分頁');
  const beforeFocus = await snapshot();
  await setHidden(false);
  const resumed = await snapshot();
  assert.equal(resumed.subscriptions - beforeFocus.subscriptions, 2);
  assert.equal(resumed.active, 2);
  await goto(page, 'monitor', 'default');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: '結束測驗', exact: true }).click();
  await page.getByRole('heading', { name: '班級成績' }).waitFor();
  await zero('同頁結束');
  await goto(page, 'monitor', 'default');
  await page.evaluate(() => window.quizMonitorTest.closeServer());
  await page.getByRole('heading', { name: '正在批改' }).waitFor();
  await setHidden(true);
  await setHidden(false);
  await zero('另一位教師結束');
  await page.close();
} finally {
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ screens, problems, lifecycle }, null, 2));
  console.log(JSON.stringify({ measuredScreens: screens.length, problems, lifecycle, evidence: out }, null, 2));
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
assert.equal(problems.length, 0);
