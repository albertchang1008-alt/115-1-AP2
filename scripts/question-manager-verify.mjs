import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
function minimalPdf() {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1920 1080] /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ];
  let txt = '%PDF-1.4\n',
    offsets = [0];
  for (const [i, obj] of objs.entries()) {
    offsets.push(Buffer.byteLength(txt));
    txt += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  }
  const at = Buffer.byteLength(txt);
  txt += `xref\n0 5\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((o) => String(o).padStart(10, '0') + ' 00000 n \n')
    .join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${at}\n%%EOF\n`;
  return Buffer.from(txt);
}
const out = process.env.QM_OUT || '/private/tmp/question-manager-ui';
fs.mkdirSync(out, { recursive: true });
const files = buildSync({
  entryPoints: ['tests/fixtures/question-manager.tsx'],
  outfile: 'fixture.js',
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  define: { 'process.env.NODE_ENV': '"development"' },
}).outputFiles;
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    res.end(
      '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script src="/fixture.js"></script></html>',
    );
    return;
  }
  const file = files.find((f) => '/' + path.basename(f.path) === req.url);
  if (!file) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader('Content-Type', req.url.endsWith('.css') ? 'text/css' : 'text/javascript');
  res.end(file.contents);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome' }),
  page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true }),
  errors = [],
  external = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
await page.route('**/*', (r) => {
  if (r.request().url().startsWith(base)) r.continue();
  else {
    external.push(r.request().url());
    r.abort();
  }
});
const checks = [];
const shot = async (name) => page.screenshot({ path: path.join(out, name + '.png') });
try {
  await page.goto(base);
  await page.getByRole('button', { name: '題目管理', exact: true }).click();
  await page.getByRole('textbox', { name: '題目標題', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '學生學習進度', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: '前測／後測', exact: true }).count(), 1);
  await page.getByText('已有 3 輪作答', { exact: true }).waitFor();
  await page
    .frameLocator('iframe[title="投影片縮圖"]')
    .getByRole('heading', { name: '課堂投影片 1', exact: true })
    .waitFor();
  await shot('01-overview-1920');
  checks.push('正式控制台入口、實際分頁、縮圖、輪數警告');
  await page.getByRole('textbox', { name: '題目標題', exact: true }).fill('暖身討論：先讀題幹');
  await shot('02-editing-1920');
  await page.getByRole('button', { name: '檢視差異並儲存 →', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await shot('03-diff-1920');
  await page.getByRole('button', { name: '確認儲存', exact: true }).click();
  await page.getByText('已儲存修改。', { exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => window.qmFixture.interactions[0].title),
    '暖身討論：先讀題幹',
  );
  checks.push('差異預覽確認後單題儲存');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '↓ 下載題目表 .xlsx', exact: true }).click();
  const download = await downloadEvent;
  const filename = path.join(out, 'export.xlsx');
  await download.saveAs(filename);
  const bytes = [...fs.readFileSync(filename)];
  const parsed = await page.evaluate(
    async (b) => window.qmParse(new Uint8Array(b), 4, 'demo'),
    bytes,
  );
  assert.deepEqual(parsed.errors, []);
  const fixture = await page.evaluate(() => window.qmFixture);
  assert.deepEqual(parsed.interactions, [fixture.interactions[0]]);
  assert.deepEqual(parsed.answerKeys, { 'demo-P01': fixture.answerKeys['demo-P01'] });
  await shot('04-downloaded-1920');
  checks.push('實際下載xlsx→#38瀏覽器解析完全一致');
  await page.getByRole('textbox', { name: '題目標題', exact: true }).fill('未儲存草稿');
  await page.evaluate(() => {
    window.qmFixture.interactions[0].title = '其他分頁的標題';
  });
  await page.getByRole('button', { name: '檢視差異並儲存 →', exact: true }).click();
  await page.getByRole('button', { name: '確認儲存', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'CONFLICT' }).waitFor();
  await shot('05-conflict-1920');
  checks.push('兩分頁衝突顯示且不覆蓋');
  await page.getByRole('button', { name: '重新載入題目', exact: true }).click();
  await page.getByRole('textbox', { name: '題目標題', exact: true }).waitFor();
  await page.getByLabel('新增題目頁碼').selectOption('demo-P03');
  await page.getByRole('button', { name: '＋ 新增一題', exact: true }).click();
  await page.getByRole('button', { name: '檢視差異並儲存 →', exact: true }).click();
  await page.getByRole('button', { name: '確認儲存', exact: true }).click();
  await page.getByText('已儲存修改。', { exact: true }).waitFor();
  assert(
    await page.evaluate(() => window.qmFixture.interactions.some((q) => q.slideId === 'demo-P03')),
  );
  checks.push('指定空白頁新增');
  await page.getByRole('button', { name: '刪除整題', exact: true }).click();
  await page.getByRole('button', { name: '確認刪除', exact: true }).click();
  await page.getByText('已刪除題目。', { exact: true }).waitFor();
  assert(
    !(await page.evaluate(() =>
      window.qmFixture.interactions.some((q) => q.slideId === 'demo-P03'),
    )),
  );
  checks.push('差異確認刪除整題');
  await page.getByRole('combobox', { name: '選擇簡報', exact: true }).selectOption('legacy');
  await page.getByText('舊版題目，無對應投影片', { exact: true }).waitFor();
  checks.push('legacy可編輯並明示無投影片');
  await page.setViewportSize({ width: 390, height: 844 });
  await shot('06-mobile-390');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.getByRole('button', { name: '簡報播放', exact: true }).click();
  await page.getByRole('button', { name: '＋ 匯入投影片＋題目表', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal
    .getByLabel('投影片 PDF')
    .setInputFiles({ name: 'demo.pdf', mimeType: 'application/pdf', buffer: minimalPdf() });
  await modal.getByLabel('題目表 (.xlsx)').setInputFiles(filename);
  await modal.getByRole('button', { name: '確認匯入並合併題目', exact: true }).click();
  await modal.waitFor({ state: 'hidden' });
  const imported = await page.evaluate(() => window.qmFixture);
  assert.deepEqual(
    imported.interactions.find((q) => q.slideId === 'demo-P01'),
    parsed.interactions[0],
  );
  assert.deepEqual(imported.answerKeys['demo-P01'], parsed.answerKeys['demo-P01']);
  assert(imported.interactions.some((q) => q.slideId === 'R-REV-04'));
  await shot('07-import-roundtrip-1920');
  checks.push('下載xlsx→正式#38匯入視窗→questionRows提交→完整保留標題與舊題');
  assert.deepEqual(errors, []);
  assert(external.every((url) => url.startsWith('https://fonts.googleapis.com/')));
  checks.push('0 pageerror；既有字型請求已阻擋，未發生外部連線');
  fs.writeFileSync(
    path.join(out, 'ui-results.json'),
    JSON.stringify({ passed: checks.length, failed: 0, checks, errors, external }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length, failed: 0, checks }));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
