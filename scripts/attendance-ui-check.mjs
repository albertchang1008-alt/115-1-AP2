// 課堂點名正式畫面檢查（交辦第 3 節測試 8）：用假的 API 把學生端每個狀態叫出來，
// 在 390×844、字級預設與特大下量測閱讀規範；教師端各分頁做冒煙檢查。不連後端、不寄信。
// 用法：node scripts/attendance-ui-check.mjs [--out <資料夾>]（有 --out 才存截圖）
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import http from 'node:http';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import { measureReadability } from './attendance-sample/readability.mjs';

const out = process.argv.includes('--out')
  ? path.resolve(process.argv[process.argv.indexOf('--out') + 1])
  : '';
if (out) fs.mkdirSync(out, { recursive: true });
const bundle = buildSync({
  entryPoints: ['tests/fixtures/attendance-ui.tsx'],
  bundle: true,
  write: false,
  outfile: 'ui.js',
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
}).outputFiles;
const server = http.createServer((req, res) => {
  const name = (req.url || '/').split('?')[0];
  if (name === '/')
    return res
      .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      .end(
        '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>課堂點名｜畫面檢查</title><link rel="stylesheet" href="/ui.css"><div id="root"></div><script src="/ui.js"></script></html>',
      );
  const f = bundle.find((x) => path.basename(x.path) === name.slice(1));
  if (!f) return res.writeHead(404).end();
  res
    .writeHead(200, { 'Content-Type': name.endsWith('.css') ? 'text/css' : 'text/javascript' })
    .end(f.contents);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const TOKEN = '#/attend?c=115-1-AP2&t=2026-11-16-p03-aaaa.3.AAAAAAAAAAAAAAAAAAAAAA';
// [畫面, 網址 hash, 畫面上必須出現的文字, 開啟後的操作]
const student = [
  ['attend-ok', TOKEN, '已簽到 09:10'],
  ['attend-duplicate', TOKEN, '你已經簽到過了'],
  ['attend-trial', TOKEN, '試簽成功'],
  ['attend-expired', TOKEN, 'QR 已過期'],
  ['attend-not-in-class', TOKEN, '你不在這一節點名的班級'],
  ['attend-closed', TOKEN, '點名已經結束'],
  ['attend-locked', TOKEN, '這一節不能再輸入數字碼'],
  ['attend-login', TOKEN, '用學校 Google 帳號登入'],
  ['attend-inapp', TOKEN, '請改用 Safari 或 Chrome 開啟'],
  ['attend-code', '#/attend?c=115-1-AP2', '請輸入投影幕上的 4 位數字碼'],
  ['attend-wrong', '#/attend?c=115-1-AP2', '還可以再試 3 次', 'code'],
  ['banner-input', '', '老師正在點名'],
  ['banner-wrong', '', '還可以再試 3 次', 'code'],
  ['banner-locked', '', '這一節不能再輸入數字碼'],
  ['banner-done', '', '已簽到 09:10'],
  ['banner-idle', '', '我的出缺席'],
  ['my', '', '對紀錄有疑問，請直接洽老師。'],
];
const teacher = [
  ['admin-start', '開始點名'],
  ['admin-live', '4 7 2 9'],
  ['admin-sessions', '同裝置提醒'],
  ['admin-summary', '修改紀錄（學生看不到）'],
  ['admin-notify', '已寄，標記已通知'],
];
const failures = [];
const errors = [];
const checked = [];
const functionalChecks = [];
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const open = async (screen, hash, scale, width, height, userAgent) => {
    const context = await browser.newContext({
      viewport: { width, height },
      ...(userAgent ? { userAgent } : {}),
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on('pageerror', (e) => errors.push(`${screen}: ${e.message}`));
    await page.route('**/*', (r) =>
      r.request().url().startsWith(base) ? r.continue() : r.abort(),
    );
    await page.goto(`${base}?screen=${screen}&scale=${scale}${hash}`);
    await page.locator('#root > *').first().waitFor();
    return { page, context };
  };
  for (const [screen, hash, text, action] of student)
    for (const [label, scale] of [
      ['default', 1],
      ['xlarge', 1.3],
    ]) {
      const ua =
        screen === 'attend-inapp'
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari Line/14.0.0'
          : undefined;
      const { page, context } = await open(screen, hash, scale, 390, 844, ua);
      try {
        if (action === 'code') {
          await page.getByLabel('第 1 位').fill('1234');
          await page.getByRole('button', { name: '簽到', exact: true }).click();
        }
        await page.getByText(text, { exact: false }).first().waitFor({ timeout: 5000 });
        for (const f of await page.evaluate(measureReadability, scale))
          failures.push(`${screen}@${label}: ${f}`);
        if (out && screen === 'my')
          await page.screenshot({ path: path.join(out, `ui-${screen}-390-${label}.png`), fullPage: true });
      } catch (e) {
        failures.push(`${screen}@${label}: ${String(e.message).split('\n')[0]}`);
      }
      checked.push(`${screen}@${label}`);
      await context.close();
    }
  for (const [screen, text] of teacher) {
    const { page, context } = await open(screen, '', 1, 1440, 900);
    try {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: 5000 });

    } catch (e) {
      failures.push(`${screen}: ${String(e.message).split('\n')[0]}`);
    }
    checked.push(screen);
    await context.close();
  }
  // 真瀏覽器操作：三個複製鍵（含拒絕／缺少 Clipboard API 的退路）、編碼與 44px。
  for (const mode of ['clipboard', 'reject', 'missing']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript((mode) => {
      window.copied = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'missing' ? undefined : {
        writeText: async text => {
          if (mode === 'reject') throw new Error('合成剪貼簿拒絕');
          window.copied.push(['clipboard', text]);
        },
      } });
      document.execCommand = command => {
        if (command !== 'copy') return false;
        window.copied.push(['fallback', document.querySelector('textarea[readonly]').value]);
        return true;
      };
    }, mode);
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on('pageerror', e => errors.push(`copy-${mode}: ${e.message}`));
    await page.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    try {
      await page.goto(`${base}?screen=admin-notify`);
      const card = page.locator('.att-draft').first();
      await card.getByRole('button', { name: '複製收件人', exact: true }).waitFor();
      for (const label of ['收件人', '主旨', '內文']) {
        await card.getByRole('button', { name: `複製${label}`, exact: true }).click();
      }
      assert.equal(await card.getByRole('button', { name: '已複製', exact: true }).count(), 3);
      const draft = await page.evaluate(() => window.attendanceFixture.drafts.student[0]);
      assert.deepEqual(await page.evaluate(() => window.copied), [draft.to, draft.subject, draft.text].map(text => [mode === 'clipboard' ? 'clipboard' : 'fallback', text]));
      assert.equal(await page.locator('textarea[readonly]').count(), 0, '退路用完移除文字框');
      const url = new URL(await card.getByRole('link', { name: '開啟 Gmail' }).getAttribute('href'));
      assert.equal(url.origin + url.pathname, 'https://mail.google.com/mail/');
      for (const [param, field] of [['to', 'to'], ['su', 'subject'], ['body', 'text']]) assert.equal(url.searchParams.get(param), draft[field]);
      assert.equal(url.searchParams.get('authuser'), 'teacher@example.edu');
      const heights = await card.locator('.att-draft-actions button, .att-draft-actions a').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
      assert.equal(heights.length, 5);
      assert(heights.every(h => h >= 44), '複製、Gmail、標記按鈕均至少 44px');
      await page.waitForTimeout(2100);
      assert.equal(await card.getByRole('button', { name: '已複製', exact: true }).count(), 0, '兩秒後復原');
      functionalChecks.push(`copy-${mode}, gmail, 44px`);
    } catch (e) { failures.push(`copy-${mode}: ${e.message.split('\n')[0]}`); }
    await context.close();
  }
  for (const screen of ['control-enabled', 'control-disabled', 'control-preview']) {
    const { page, context } = await open(screen, '', 1, 1440, 900);
    try {
      if (screen === 'control-enabled') {
        const button = page.getByRole('button', { name: /開始點名/ });
        await button.getByLabel('待通知 3 封').waitFor();
        if (out) await page.screenshot({ path: path.join(out, 'ui-control-pending-1440.png'), fullPage: true });
        await page.evaluate(() => {
          window.attendanceFixture.drafts.digest[0].ready = true;
          window.dispatchEvent(new Event('focus'));
        });
        await button.getByLabel('待通知 4 封').waitFor();
        await page.evaluate(() => {
          window.attendanceFixture.drafts.student = [];
          window.attendanceFixture.drafts.digest = [];
          window.dispatchEvent(new Event('focus'));
        });
        await button.locator('.att-badge').waitFor({ state: 'detached' });
        await button.click();
        assert.equal(await page.evaluate(() => location.hash), '#attendance');
      } else {
        await page.getByRole('heading', { name: '授課控制台' }).waitFor();
        assert.equal(await page.getByRole('button', { name: /開始點名/ }).count(), 0);
        assert.deepEqual(await page.evaluate(() => window.attendanceFixture.calls), [], '旗標關或預覽不讀點名資料');
      }
      functionalChecks.push(screen);
    } catch (e) { failures.push(`${screen}: ${e.message.split('\n')[0]}`); }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
const result = {
  pass: !failures.length && !errors.length,
  studentScreens: student.length * 2,
  teacherScreens: teacher.length,
  checked: checked.length,
  functionalChecks,
  failures,
  pageErrors: errors,
};
if (out) fs.writeFileSync(path.join(out, 'ui-result.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
