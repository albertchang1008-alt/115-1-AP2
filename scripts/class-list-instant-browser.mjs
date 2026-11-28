import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';

const out = process.argv[2] === '--out' && process.argv[3] ? path.resolve(process.argv[3])
  : fs.mkdtempSync(path.join(os.tmpdir(), 'class-list-instant-'));
fs.mkdirSync(out, { recursive: true });
const files = buildSync({
  entryPoints: ['tests/fixtures/class-list-instant-browser.tsx'], bundle: true, write: false,
  outfile: 'ui.js', format: 'iife', platform: 'browser', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
}).outputFiles;
const browser = await (process.env.CHROME_PATH
  ? chromium.launch({ executablePath: process.env.CHROME_PATH })
  : chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch()));
const host = 'http://class-list-instant.test';
const html = '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/ui.css"><div id="root"></div><script src="/ui.js"></script>';
const summary = { lists: [], chart: [], pageErrors: [] };
const endpoints = [
  { tabName: '點名', detail: 'attendanceSessions', row: '.att-class-card' },
  { tabName: '試務中心', detail: 'zuvioListExams', row: '.pq-class-grid button' },
];

async function configure(page) {
  // Keep fixtures offline, including the production stylesheet's webfont.
  await page.route('**/*', (route) => {
    const { origin, pathname } = new URL(route.request().url());
    if (origin !== host) return route.abort();
    if (pathname === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
    const file = files.find((candidate) => path.basename(candidate.path) === pathname.slice(1));
    if (!file) return route.fulfill({ status: 404 });
    return route.fulfill({ contentType: pathname.endsWith('.css') ? 'text/css' : 'application/javascript', body: file.text });
  });
  page.on('pageerror', (error) => summary.pageErrors.push(error.message));
}

async function prefetch(page) {
  await page.waitForFunction(() => window.classListTest.idlePending());
  await page.evaluate(() => window.classListTest.runIdle());
  await page.waitForFunction(() => Object.keys(localStorage).filter((key) => key.startsWith('teacher-class-directory-v1:')).length === 2);
  assert.deepEqual(await page.evaluate(() => window.classListTest.calls.map(({ name }) => name).filter(
    (name) => !['bootstrap', 'getReports'].includes(name),
  ).sort()), ['attendanceClassCards', 'zuvioClassDirectory']);
}

async function measureList(page, target, scenario) {
  const tab = page.locator('nav').getByRole('button', { name: target.tabName, exact: true });
  const result = await tab.evaluate((button, selector) => new Promise((resolve, reject) => {
    const start = performance.now();
    let loadingSeen = false;
    button.click();
    function frame() {
      loadingSeen ||= [...document.querySelectorAll('[role="status"]')].some((el) => el.textContent === '載入中…');
      const row = document.querySelector(selector);
      const box = row?.getBoundingClientRect();
      const elapsed = performance.now() - start;
      if (box && box.height > 0 && box.bottom > 0 && box.top < innerHeight && getComputedStyle(row).visibility === 'visible') {
        window.measuredClassRow = row;
        resolve({ milliseconds: Math.round(elapsed * 10) / 10, loadingSeen, firstRow: row.querySelector('strong').textContent });
      } else if (elapsed > 3000) reject(Error('班級列表未出現'));
      else requestAnimationFrame(frame);
    }
    frame();
  }), target.row);
  summary.lists.push({ target: target.tabName, scenario, ...result });
  assert.match(result.firstRow, /^合成甲班/);
  assert.equal(result.loadingSeen, scenario === '無快取');
  if (scenario !== '無快取') assert.ok(result.milliseconds <= 100, JSON.stringify(result));
}

async function verifyChart(page, scale, maxScore) {
  const labels = ['0–59 分', '60–69 分', '70–79 分', '80–89 分', '90–100 分'];
  const counts = [2, 1, 1, 1, 3];
  await page.goto(host + '/?chart&scale=' + scale + '&max=' + maxScore);
  const chart = page.getByRole('group', { name: '分數區間成績分布' });
  await chart.waitFor();
  const bins = chart.getByRole('group');
  assert.equal(await bins.count(), 5);
  for (const [i, label] of labels.entries()) assert.equal(await bins.nth(i).getAttribute('aria-label'), label + '，' + counts[i] + ' 人');
  assert.equal(await page.getByText('已換算為百分制', { exact: true }).count(), Number(maxScore !== 100));
  const measured = await chart.evaluate((element) => {
    const rect = (node) => node.getBoundingClientRect();
    const size = (node) => parseFloat(getComputedStyle(node).fontSize);
    const textBounds = (node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    const section = element.closest('section');
    const note = section.querySelector('.pq-distribution-note');
    const luminance = (color) => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number);
      return channels.reduce((total, byte, i) => {
        const channel = byte / 255;
        const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        return total + linear * [0.2126, 0.7152, 0.0722][i];
      }, 0);
    };
    const contrast = (node) => {
      const a = luminance(getComputedStyle(node).color);
      const b = luminance(getComputedStyle(section).backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    return {
      pageWidth: document.documentElement.scrollWidth,
      titleSize: size(section.querySelector('h3')),
      noteSize: note ? size(note) : null,
      bins: [...element.children].map((bin) => {
        const [count, bar, label] = bin.children;
        const [range, unit] = label.children;
        return {
          labelSize: size(label), countSize: size(count), count: Number(count.textContent),
          baseline: rect(bar).bottom, onOneLine: Math.abs(rect(range).top - rect(unit).top) < 1,
          clips: [count, label].some((node) => textBounds(node).width > rect(bin).width + 1),
          countAboveBar: rect(count).bottom <= rect(bar).top + 1,
          contrast: Math.min(contrast(label), contrast(count)),
        };
      }),
    };
  });
  summary.chart.push({ scale, maxScore, ...measured });
  assert.equal(measured.pageWidth, 390);
  assert.ok(measured.titleSize + 0.01 >= 21 * scale);
  if (maxScore !== 100) assert.ok(measured.noteSize + 0.01 >= 14 * scale);
  assert.deepEqual(measured.bins.map(({ count }) => count), counts);
  for (const bin of measured.bins) {
    assert.ok(bin.labelSize + 0.01 >= 12 * scale && bin.countSize + 0.01 >= 18 * scale, JSON.stringify(bin));
    assert.ok(bin.onOneLine && !bin.clips && bin.countAboveBar, JSON.stringify(bin));
    assert.ok(Math.abs(bin.baseline - measured.bins[0].baseline) < 1, JSON.stringify(bin));
    assert.ok(bin.contrast >= 4.5, JSON.stringify(bin));
  }
  if (maxScore !== 100) await page.screenshot({ path: path.join(out, 'score-bins-390-' + scale + '.png') });
}

try {
  for (const target of endpoints) {
    for (const scenario of ['無快取', '有快取', '預抓完成']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await configure(page);
      await page.goto(host);
      const nav = page.locator('nav').getByRole('button', { name: target.tabName, exact: true });
      await nav.waitFor();
      if (scenario !== '無快取') await prefetch(page);
      if (scenario === '有快取') {
        await page.goto(host + '/?rename');
        await nav.waitFor();
      }
      await measureList(page, target, scenario);
      if (scenario === '有快取') {
        assert.equal(summary.lists.at(-1).firstRow, '合成甲班');
        await page.waitForFunction((selector) => document.querySelector(selector + ' strong')?.textContent === '合成甲班新名稱', target.row);
        assert.equal(await page.evaluate((selector) => document.querySelector(selector) === window.measuredClassRow, target.row), true);
      }
      assert.equal(await page.evaluate((name) => window.classListTest.calls.some((call) => call.name === name), target.detail), false);
      await page.locator(target.row).first().click();
      await page.waitForFunction((name) => window.classListTest.calls.some((call) => call.name === name && call.classId === 'fixture-class'), target.detail);
      await page.close();
    }
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await configure(page);
  await verifyChart(page, 1, 200);
  await verifyChart(page, 1.3, 200);
  await verifyChart(page, 1, 100);
  assert.deepEqual(summary.pageErrors, []);
} finally {
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
}
