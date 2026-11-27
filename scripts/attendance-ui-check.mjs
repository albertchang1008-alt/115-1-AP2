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
  define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
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
  ['attend-makeup', TOKEN, '已補點（09:42）'],
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
  ['classes', '點名班級'],
  ['records', '已點紀錄'],
  ['detail', '同裝置提醒'],
  ['summary', '學生總表'],
  ['notify', '本筆全部標記已通知'],
];
const openClass = (page) => page.getByRole('button', { name: /^示範甲班/ }).first().click();
const openSummary = (page) => page.getByRole('button', { name: /^學生總表/ }).click();
const openNotify = (page) => page.getByRole('button', { name: /^通知（/ }).click();
const failures = [];
const errors = [];
const checked = [];
const functionalChecks = [];
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}).catch((error) => {
  server.close();
  throw error;
});
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
        if (screen === 'my') {
          assert.deepEqual(await page.locator('.att-mine-stats b').allTextContents(), ['3', '2', '1']);
          assert.equal(await page.getByText('11/16（一）09:20', { exact: true }).count(), 1);
          assert.equal(await page.getByText('11/16（一）09:10', { exact: true }).count(), 1);
          await page.getByText('準時（補點 11/16 09:42）').waitFor();
          await page.getByText('老師已更正', { exact: true }).waitFor();
        }
        if (out && screen === 'my')
          await page.screenshot({ path: path.join(out, `ui-${screen}-390-${label}.png`), fullPage: true });
      } catch (e) {
        failures.push(`${screen}@${label}: ${String(e.message).split('\n')[0]}`);
      }
      checked.push(`${screen}@${label}`);
      await context.close();
    }
  for (const width of [390, 1280]) for (const [screen, text] of teacher) {
    const { page, context } = await open('admin-flow', '', 1, width, width === 390 ? 844 : 800);
    try {
      if (screen !== 'classes') await openClass(page);
      if (screen === 'detail') await page.locator('button.att-record-link').filter({ hasText: '2026-11-16 09:10' }).click();
      if (screen === 'summary') await openSummary(page);
      if (screen === 'notify') await openNotify(page);
      await page.getByText(text, { exact: false }).first().waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '頁面不水平溢出');
      if (out) await page.screenshot({ path: path.join(out, `ui-teacher-${screen}-${width}.png`), fullPage: false });
    } catch (e) {
      failures.push(`${screen}@${width}: ${String(e.message).split('\n')[0]}`);
    }
    checked.push(`${screen}@${width}`);
    await context.close();
  }

  {
    const { page, context } = await open('admin-flow', '', 1, 1280, 800);
    try {
      assert.match(await page.locator('.att-class-card').last().textContent(), /測試班/);
      await openClass(page);
      await page.getByRole('button', { name: '新增點名', exact: true }).click();
      assert.equal(await page.getByLabel('開放幾分鐘').inputValue(), '1');
      assert.equal(await page.getByLabel('數字碼更換（秒）').isVisible(), false);
      await page.getByText('進階', { exact: true }).click();
      assert.equal(await page.getByLabel('數字碼更換（秒）').inputValue(), '60');
      assert.equal(await page.getByLabel('QR 更換（秒）').inputValue(), '15');
      await page.getByLabel('開放幾分鐘').fill('2');
      await page.getByRole('button', { name: '開始點名', exact: true }).click();
      await page.getByRole('status').filter({ hasText: '點名建立中…' }).waitFor();
      await page.getByRole('img', { name: '簽到 QR' }).waitFor();
      const { start, extraLiveReads } = await page.evaluate(() => ({
        start: window.attendanceFixture.requests.find(r => r.name === 'attendanceStart' && !r.data.warm).data,
        extraLiveReads: window.attendanceFixture.requests.filter(r => r.name === 'attendanceLive' && !r.data.warm).length,
      }));
      assert.equal(extraLiveReads, 0, '第一組碼由開始點名回應直接顯示');
      assert.deepEqual(start, { courseId: '115-1-AP2', classIds: ['demo-a'], durationSec: 120, codeSec: 60, qrSec: 15, trial: false });
      await page.getByRole('button', { name: '提前結束' }).click();
      await page.getByRole('heading', { name: '本筆修改紀錄' }).waitFor();
      await page.getByRole('checkbox', { name: '選取 示範學生 01' }).check();
      await page.getByLabel('批次修改原因（選填）').fill('合成批次更正');
      await page.getByRole('button', { name: '改為準時', exact: true }).click();
      await page.waitForFunction(() => window.attendanceFixture.requests.some(r => r.name === 'attendanceSetStatus'));
      const edit = await page.evaluate(() => window.attendanceFixture.requests.find(r => r.name === 'attendanceSetStatus').data);
      assert.deepEqual([edit.reason, edit.status], ['合成批次更正', 'present']);
      await page.getByRole('button', { name: '← 班級紀錄' }).click();
      await page.getByRole('button', { name: '新增點名', exact: true }).click();
      assert.equal(await page.getByLabel('開放幾分鐘').inputValue(), '2');
      await page.getByRole('button', { name: '取消', exact: true }).click();
      await openSummary(page);
      await page.getByText('補 09:10', { exact: true }).waitFor();
      const downloadPending = page.waitForEvent('download');
      await page.getByRole('button', { name: '匯出 Excel' }).click();
      const workbook = await downloadPending;
      const bytes = fs.readFileSync(await workbook.path());
      assert.match(workbook.suggestedFilename(), /\.xlsx$/);
      assert.equal(bytes.subarray(0, 4).toString('hex'), '504b0304');
      for (const label of ['學生統計', '每次點名', '補點時間', '2026-11-16 10:15', '0990001']) assert(bytes.includes(label), label);
      await page.getByRole('button', { name: '2026-11-16 09:10', exact: true }).click();
      await page.getByRole('heading', { name: '本筆修改紀錄' }).waitFor();
      await page.getByRole('button', { name: '刪除這筆點名', exact: true }).click();
      const confirm = page.getByRole('dialog');
      await confirm.getByText('已寄出的學生或導師通知無法撤回。').waitFor();
      await confirm.getByRole('button', { name: '取消', exact: true }).click();
      await page.getByRole('button', { name: '← 班級紀錄' }).click();
      await page.getByRole('button', { name: '2026-11-16 09:10 的操作' }).click();
      await page.getByRole('button', { name: '刪除這筆點名', exact: true }).click();
      await confirm.getByLabel('刪除原因（選填）').fill('合成刪除原因');
      await confirm.getByRole('button', { name: '確定刪除' }).click();
      await page.getByText('已刪除（1）').click();
      await page.getByRole('button', { name: '復原' }).click();
      await page.getByText('已刪除（0）').waitFor();
      await page.getByRole('button', { name: /^2026-11-16 09:10/ }).first().waitFor();
      functionalChecks.push('class-first: start, default duration, end→detail, bulk reason, XLSX, matrix navigation, delete, restore');
    } catch (e) { failures.push(`class-first: ${e.message.split('\n')[0]}`); }
    await context.close();
  }
  {
    const { page, context } = await open('admin-live', '', 1, 1440, 900);
    try {
      await page.getByRole('button', { name: '回到投影' }).click();
      const projection = page.getByRole('region', { name: '投影畫面' });
      await projection.waitFor();
      const snapshot = async () => ({
        countdown: await projection.locator('.att-proj-time').textContent(),
        token: await page.evaluate(() => window.attendanceFixture.live.token),
        qr: await projection.getByRole('img', { name: '簽到 QR' }).innerHTML(),
        signed: await projection.locator('.att-proj-box').filter({ hasText: '已簽到' }).locator('b').textContent(),
      });
      const before = await snapshot();
      await page.waitForTimeout(20_000);
      const after = await snapshot();
      const toSeconds = (time) => {
        const [minutes, seconds] = time.split(':').map(Number);
        return 60 * minutes + seconds;
      };
      assert(toSeconds(after.countdown) < toSeconds(before.countdown), '投影倒數應減少');
      assert.notEqual(after.token, before.token, 'mock 回傳新 QR token');
      assert.notEqual(after.qr, before.qr, '投影 QR 應隨 token 更新');
      assert(Number(after.signed.split('／')[0]) > Number(before.signed.split('／')[0]), '已簽到應增加');
      functionalChecks.push(`admin-live 20s: ${before.countdown} → ${after.countdown}, QR changed, ${before.signed} → ${after.signed}`);
    } catch (e) {
      failures.push(`admin-live 20s: ${e.message.split('\n')[0]}`);
    } finally {
      await context.close();
    }
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
      await page.goto(`${base}?screen=admin-flow`);
      await openClass(page);
      await openNotify(page);
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
  // 實際 CourseEditor → 保存草稿 → 側欄點名：授課控制台關閉仍可獨立開／關點名。
  {
    const { page, context } = await open('feature-toggle', '#courses', 1, 1440, 900);
    try {
      const attendance = page.getByRole('checkbox', { name: '點名', exact: true });
      await attendance.waitFor();
      assert.equal(await attendance.isChecked(), false);
      assert.equal(await page.locator('nav').getByRole('button', { name: '點名', exact: true }).count(), 0);
      await attendance.check();
      assert.equal(await page.locator('nav').getByRole('button', { name: '點名', exact: true }).count(), 0, '未保存不開放');
      await page.getByRole('button', { name: '保存草稿', exact: true }).click();
      const nav = page.locator('nav').getByRole('button', { name: '點名', exact: true });
      await nav.waitFor();
      const saved = await page.evaluate(async () => (await window.attendanceToggleTest.read()).courses[0]);
      assert.deepEqual(saved.features, { assessments: false, teachingConsole: false, classroomInteraction: true, attendance: true });
      assert.equal(await page.locator('nav').getByRole('button', { name: '授課控制台', exact: true }).count(), 0);
      // 手機字級兩態，只存課程功能區域各一張，並量測文字與頁面不出框。
      for (const [label, scale] of [['default', 1], ['xlarge', 1.3]]) {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(scale => document.documentElement.style.setProperty('--font-scale', String(scale)), scale);
        const fieldset = attendance.locator('xpath=ancestor::fieldset');
        assert(await fieldset.evaluate(el => el.getBoundingClientRect().right <= innerWidth + 1), '功能區不出框');
        if (out) await fieldset.screenshot({ path: path.join(out, `ui-feature-toggle-390-${label}.png`) });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      await nav.click();
      await page.getByRole('heading', { name: '點名班級', exact: true }).waitFor();
      await openClass(page);
      await page.getByRole('button', { name: '試簽（不算點名）', exact: true }).waitFor();
      await page.locator('nav').getByRole('button', { name: '課程與教材', exact: true }).click();
      await attendance.waitFor();
      assert.equal(await attendance.isChecked(), true, '重開編輯仍為啟用');
      await attendance.uncheck();
      await page.getByRole('button', { name: '保存草稿', exact: true }).click();
      await nav.waitFor({ state: 'detached' });
      const state = await page.evaluate(async () => ({ data: await window.attendanceToggleTest.read(), calls: window.attendanceToggleTest.calls }));
      assert.equal(state.data.courses[0].features.attendance, false);
      assert.equal(state.data.courses[0].features.classroomInteraction, true, '保留原本功能');
      assert.equal(state.calls.filter(c => c.name === 'saveCourse').length, 2);
      assert.equal(state.calls.filter(c => c.name === 'publishCourse').length, 0, '不需更新到學生端');
      assert.equal(state.calls.filter(c => c.name === 'attendanceStart').length, 0, '檢查入口不建立正式節次');
      functionalChecks.push('feature-toggle: save on/off, independent navigation, no publish');
    } catch (e) { failures.push(`feature-toggle: ${e.message.split('\n')[0]}`); }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
const result = {
  pass: !failures.length && !errors.length,
  studentScreens: student.length * 2,
  teacherScreens: teacher.length * 2,
  checked: checked.length,
  functionalChecks,
  failures,
  pageErrors: errors,
};
if (out) fs.writeFileSync(path.join(out, 'ui-result.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
