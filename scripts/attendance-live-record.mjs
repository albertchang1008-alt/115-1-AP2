// 課堂點名投影 60 秒即時更新驗證與錄影腳本
// 用法：node scripts/attendance-live-record.mjs --out <輸出目錄>
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';

const outIdx = process.argv.indexOf('--out');
const outDir = outIdx !== -1 && process.argv[outIdx + 1]
  ? path.resolve(process.argv[outIdx + 1])
  : path.join(os.tmpdir(), 'attendance-live-verify');

fs.mkdirSync(outDir, { recursive: true });

const bundle = buildSync({
  entryPoints: ['tests/fixtures/attendance-ui.tsx'],
  bundle: true,
  write: false,
  outfile: 'ui.js',
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
}).outputFiles;

const server = http.createServer((req, res) => {
  const name = (req.url || '/').split('?')[0];
  if (name === '/') {
    return res
      .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      .end(
        '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>課堂點名｜投影錄影</title><link rel="stylesheet" href="/ui.css"><div id="root"></div><script src="/ui.js"></script></html>',
      );
  }
  const f = bundle.find((x) => path.basename(x.path) === name.slice(1));
  if (!f) return res.writeHead(404).end();
  res
    .writeHead(200, { 'Content-Type': name.endsWith('.css') ? 'text/css' : 'text/javascript' })
    .end(f.contents);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;

const tempVideoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'att-vid-'));

const browser = await chromium.launch();
const log = [];

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  await page.route('**/*', (r) =>
    r.request().url().startsWith(base) ? r.continue() : r.abort(),
  );

  await page.goto(`${base}?screen=admin-live`);
  const projection = page.getByRole('region', { name: '投影畫面' });
  await projection.waitFor();

  // 點擊「延長 1 分鐘」以確保剩餘時間超過 90 秒
  const extendBtn = page.getByRole('button', { name: '延長 1 分鐘', exact: true });
  await extendBtn.waitFor();
  await extendBtn.click();
  await page.waitForTimeout(500);

  const sampleState = async (elapsed) => {
    const countdown = await projection.locator('.att-proj-time').textContent();
    const token = await page.evaluate(() => window.attendanceFixture?.live?.token || '');
    const code = await projection.locator('.att-proj-code').textContent();
    const signed = await projection.locator('.att-proj-box').filter({ hasText: '已簽到' }).locator('b').textContent();
    const qrSvg = await projection.getByRole('img', { name: '簽到 QR' }).innerHTML();

    return {
      t: elapsed,
      countdown: countdown?.trim(),
      code: code?.trim(),
      token,
      signed: signed?.trim(),
      qrLen: qrSvg.length,
    };
  };

  const startTime = Date.now();
  let currentElapsed = 0;

  while (currentElapsed <= 60) {
    const state = await sampleState(currentElapsed);
    log.push(state);
    process.stdout.write(`t=${currentElapsed}s: countdown=${state.countdown}, signed=${state.signed}, token=${state.token}\n`);

    if (currentElapsed >= 60) break;
    await page.waitForTimeout(5000);
    currentElapsed = Math.min(60, Math.round((Date.now() - startTime) / 1000));
  }

  // 關閉 context 以儲存錄影檔案
  await page.close();
  await context.close();

  // 尋找產生的影片檔
  const videoFiles = fs.readdirSync(tempVideoDir).filter((f) => f.endsWith('.webm'));
  assert(videoFiles.length > 0, '未產生錄影檔案');
  const sourceVideoPath = path.join(tempVideoDir, videoFiles[0]);
  const targetVideoPath = path.join(outDir, 'attendance-live-60s.webm');
  fs.copyFileSync(sourceVideoPath, targetVideoPath);

  // 寫入採樣記錄檔
  const logPath = path.join(outDir, 'recording-log.json');
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8');

  // 驗證條件
  const initial = log[0];
  const final = log[log.length - 1];

  const toSeconds = (time) => {
    const [minutes, seconds] = time.split(':').map(Number);
    return 60 * minutes + seconds;
  };

  assert(toSeconds(final.countdown) < toSeconds(initial.countdown), '倒數計時必須減少');
  assert.notEqual(final.token, initial.token, 'QR token 必須在 60 秒期間換段更新');
  assert(Number(final.signed.split('／')[0]) > Number(initial.signed.split('／')[0]), '已簽到人數必須隨時間增加');

  console.log(`錄影與驗證成功！\n影片：${targetVideoPath}\n記錄：${logPath}`);
} finally {
  await browser.close();
  server.close();
  try {
    fs.rmSync(tempVideoDir, { recursive: true, force: true });
  } catch {}
}
