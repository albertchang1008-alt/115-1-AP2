// 課堂點名樣張（佇列 #67 第一階段）：用合成資料產生 8 張總覽截圖，並對學生畫面跑閱讀規範自動檢查。
// 用法：node scripts/attendance-sample.mjs --out <資料夾>     （--serve 只開本機預覽，不截圖）
// 有設定 FIRESTORE_EMULATOR_HOST＋GCLOUD_PROJECT=demo-* 時，資料先寫進本機 Emulator 再讀回。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import { seedSample, readSample, useEmulator } from './attendance-sample/seed.mjs';
import { measureReadability } from './attendance-sample/readability.mjs';

const arg = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : '');
const out = path.resolve(arg('--out') || path.join(os.tmpdir(), 'attendance-sample'));
fs.mkdirSync(path.join(out, 'raw'), { recursive: true });
await seedSample();
const data = await readSample();
assert.equal(data.source, useEmulator ? 'emulator' : 'memory');
assert.equal(data.students.length, 60);
assert.equal(data.sessions.length, 6);

const bundle = buildSync({
  entryPoints: ['tests/fixtures/attendance-sample.tsx'],
  bundle: true,
  write: false,
  outfile: 'sample.js',
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
}).outputFiles;
const server = http.createServer((req, res) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (req.method !== 'GET') return res.writeHead(405).end();
  if (req.url === '/sample-data') return res.writeHead(200, { ...headers, 'Content-Type': 'application/json' }).end(JSON.stringify(data));
  if (req.url === '/')
    return res
      .writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' })
      .end('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>課堂點名｜樣張</title><link rel="stylesheet" href="/sample.css"><div id="root"></div><script src="/sample.js"></script></html>');
  const f = bundle.find((x) => path.basename(x.path) === req.url?.slice(1));
  if (!f) return res.writeHead(404).end();
  res.writeHead(200, { ...headers, 'Content-Type': req.url.endsWith('.css') ? 'text/css' : 'text/javascript' }).end(f.contents);
});
await new Promise((resolve) => server.listen(process.argv.includes('--serve') ? 4181 : 0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
if (process.argv.includes('--serve')) {
  console.log(`樣張：${url}（僅本機；Ctrl+C 停止）`);
} else {
  const sheets = [
    [1, '01-投影畫面', 1920],
    [2, '02-掃QR簽到成功-390', 920],
    [3, '03-簽到其他結果-390', 2180],
    [4, '04-平台內備用輸入-390', 2180],
    [5, '05-我的出缺席-390', 920],
    [6, '06-後台單節名冊', 1600],
    [7, '07-總表與修改紀錄', 1500],
    [8, '08-通知信樣式', 1500],
  ];
  const views = ['scan-ok', 'scan-expired', 'scan-inapp', 'scan-notclass', 'scan-dup', 'scan-trial', 'home-input', 'home-wrong', 'home-locked', 'home-done', 'my'];
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  const failures = [];
  const checked = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
    const open = async (hash, width, height) => {
      await page.setViewportSize({ width, height });
      await page.goto('about:blank');
      await page.goto(url + hash);
      await page.locator('#root > *').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    for (const [n, name, width] of sheets) {
      await open(`#/sheet/${n}`, width, 1080);
      await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
    }
    // 學生畫面：390×844，字級預設與特大，逐一量測。
    for (const view of views)
      for (const [label, scale] of [['default', 1], ['xlarge', 1.3]]) {
        await open(`#/view/${view}?scale=${scale}`, 390, 844);
        await page.screenshot({ path: path.join(out, 'raw', `${view}-390-${label}.png`), fullPage: true });
        const found = await page.evaluate(measureReadability, scale);
        checked.push(`${view}@${label}`);
        for (const f of found) failures.push(`${view}@${label}: ${f}`);
      }
  } finally {
    await browser.close();
  }
  const result = {
    pass: !failures.length && !errors.length,
    source: useEmulator ? 'Firestore Emulator' : '記憶體內合成資料（未連 Emulator）',
    syntheticStudents: data.students.length,
    sheets: sheets.map((s) => `${s[1]}.png`),
    readability: { viewport: '390x844', scales: ['預設 1.0', '特大 1.3'], screens: checked.length, failures },
    pageErrors: errors,
  };
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) process.exitCode = 1;
  server.close();
}
