import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';

const outArgIdx = process.argv.indexOf('--out');
const outDir = outArgIdx !== -1 && process.argv[outArgIdx + 1]
  ? path.resolve(process.argv[outArgIdx + 1])
  : path.join(os.tmpdir(), 'zuvio-browser-evidence');

fs.mkdirSync(outDir, { recursive: true });

console.log(`[Zuvio E2E] Bundling browser fixture...`);
const bundle = buildSync({
  entryPoints: ['tests/fixtures/zuvio-browser-fixture.tsx'],
  bundle: true,
  write: false,
  outfile: 'ui.js',
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  loader: { '.png': 'file', '.svg': 'text' },
}).outputFiles;

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/' || urlPath === '/index.html') {
    return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`
      <!doctype html>
      <html lang="zh-Hant">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Zuvio 出題與成績回收全流程驗收</title>
          <link rel="stylesheet" href="/ui.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="/ui.js"></script>
        </body>
      </html>
    `);
  }
  const f = bundle.find((x) => path.basename(x.path) === urlPath.slice(1));
  if (!f) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': urlPath.endsWith('.css') ? 'text/css' : 'text/javascript' }).end(f.contents);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/`;
console.log(`[Zuvio E2E] Test server listening on ${baseUrl}`);

const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const results = {
  makeExam: false,
  examDetail: false,
  importResults: false,
  reimportResults: false,
  deleteResults: false,
  cleanupResidual: false,
  itemAnalysisReport: false,
  moodDistribution: false,
  studentMoodCard: false,
  readabilityPass: false,
  screenshots: [],
};

try {
  // ----------------------------------------------------
  // Phase 1: Teacher console desktop view (1280x800)
  // ----------------------------------------------------
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('dialog', async (dialog) => {
    console.log(`[Dialog] ${dialog.type()}: ${dialog.message()}`);
    await dialog.accept();
  });

  // Step 1: 出題 (Make Exam)
  console.log('[Zuvio E2E] Step 1: 出題...');
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.waitForSelector('.zuvio');

  // Select two unit checkboxes
  const unitCheckboxes = page.locator('.z-unit input[type="checkbox"]');
  const count = await unitCheckboxes.count();
  assert.ok(count >= 2, '次單元核取方塊需 >= 2');
  await unitCheckboxes.nth(0).check();
  await unitCheckboxes.nth(1).check();

  // Set total questions to 10
  const totalInput = page.locator('label:has-text("總題數") input[type="number"]');
  await totalInput.fill('10');

  // Click draw
  const drawBtn = page.locator('button.primary:has-text("抽題")');
  const drawBtnText = await drawBtn.textContent();
  console.log(`[Zuvio E2E] Draw button text: ${drawBtnText}`);
  await drawBtn.click();
  await page.waitForSelector('.z-qs > li');
  const pickedCount = await page.locator('.z-qs > li').count();
  console.log(`[Zuvio E2E] Picked questions count: ${pickedCount}`);
  assert.ok(pickedCount > 0, '抽題預覽題數需大於 0');

  // Fill exam title
  const titleInput = page.locator('label:has-text("考卷名稱") input');
  await titleInput.fill('115-1 呼吸與排泄隨堂測驗');

  // Save screenshot 01
  const shot1 = path.join(outDir, '01-make-exam.png');
  await page.screenshot({ path: shot1, fullPage: true });
  results.screenshots.push('01-make-exam.png');
  results.makeExam = true;

  // Click create exam and download CSV
  const createBtn = page.locator('button:has-text("建立考卷並下載 CSV")');
  await createBtn.click();

  // Wait for transition to Exams tab & ExamDetail
  console.log('[Zuvio E2E] Step 2: 考卷明細與新增場次...');
  await page.waitForSelector('button:has-text("← 考卷列表")');
  await page.waitForSelector('h3:has-text("115-1 呼吸與排泄隨堂測驗")');

  // Add new sitting: label = "甲班 第1次", class = "甲班"
  const sittingLabelInput = page.locator('label:has-text("新增場次") input');
  await sittingLabelInput.fill('甲班 第1次');
  const classCheckbox = page.locator('.z-new label.z-check:has-text("甲班") input');
  if (await classCheckbox.count()) {
    await classCheckbox.check();
  }
  const addSittingBtn = page.locator('.z-new button:has-text("新增")');
  await addSittingBtn.click();

  await page.waitForSelector('td:has-text("甲班 第1次")');
  const shot2 = path.join(outDir, '02-exam-detail-sittings.png');
  await page.screenshot({ path: shot2, fullPage: true });
  results.screenshots.push('02-exam-detail-sittings.png');
  results.examDetail = true;

  // Step 3: 匯入成績 (Import Results)
  console.log('[Zuvio E2E] Step 3: 匯入成績...');
  const importBtn = page.locator('tr:has-text("甲班 第1次") button:has-text("匯入成績")');
  await importBtn.click();
  await page.waitForSelector('.z-import');

  // Click 載入示範成績檔
  const demoFileBtn = page.locator('button:has-text("載入示範成績檔")');
  await demoFileBtn.click();

  await page.waitForSelector('.z-preview');
  await page.waitForSelector('.z-ok:has-text("考卷比對通過")');
  const shot3 = path.join(outDir, '03-import-preview.png');
  await page.screenshot({ path: shot3, fullPage: true });
  results.screenshots.push('03-import-preview.png');

  // Confirm import
  const confirmBtn = page.locator('button:has-text("確認匯入")');
  await confirmBtn.click();

  // Verify sitting row updated to "已匯入 XX 人"
  await page.waitForSelector('tr:has-text("甲班 第1次") td:has-text("已匯入")');
  const importText = await page.locator('tr:has-text("甲班 第1次") td:has-text("已匯入")').textContent();
  console.log(`[Zuvio E2E] Sitting imported text: ${importText}`);
  const shot4 = path.join(outDir, '04-imported-results.png');
  await page.screenshot({ path: shot4, fullPage: true });
  results.screenshots.push('04-imported-results.png');
  results.importResults = true;

  // Step 4: 重新匯入 (Re-import Results)
  console.log('[Zuvio E2E] Step 4: 重新匯入...');
  const reimportBtn = page.locator('tr:has-text("甲班 第1次") button:has-text("重新匯入")');
  await reimportBtn.click();
  await page.waitForSelector('.z-import');

  await page.locator('button:has-text("載入示範成績檔")').click();
  await page.waitForSelector('button:has-text("確認匯入（取代這一場原有成績）")');
  const shot5 = path.join(outDir, '05-reimport-preview.png');
  await page.screenshot({ path: shot5, fullPage: true });
  results.screenshots.push('05-reimport-preview.png');

  await page.locator('button:has-text("確認匯入（取代這一場原有成績）")').click();
  await page.waitForSelector('tr:has-text("甲班 第1次") td:has-text("已匯入")');
  results.reimportResults = true;

  // Step 5: 刪除成績 (Delete Results)
  console.log('[Zuvio E2E] Step 5: 刪除成績...');
  const deleteBtn = page.locator('tr:has-text("甲班 第1次") button:has-text("刪除成績")');
  await deleteBtn.click(); // dialog is auto-accepted

  // Verify sitting shows "尚未匯入"
  await page.waitForSelector('tr:has-text("甲班 第1次") td:has-text("尚未匯入")');
  const shot6 = path.join(outDir, '06-deleted-results.png');
  await page.screenshot({ path: shot6, fullPage: true });
  results.screenshots.push('06-deleted-results.png');
  results.deleteResults = true;

  // Step 6: 清理殘留成績 (Cleanup Residual Results)
  console.log('[Zuvio E2E] Step 6: 清理殘留成績...');
  // The wrapped API sets pendingCleanup: true after delete, so "清理殘留成績" button should appear
  await page.waitForSelector('button:has-text("清理殘留成績")');
  const shot7 = path.join(outDir, '07-pending-cleanup.png');
  await page.screenshot({ path: shot7, fullPage: true });
  results.screenshots.push('07-pending-cleanup.png');

  // Click "清理殘留成績"
  const cleanupBtn = page.locator('button:has-text("清理殘留成績")');
  await cleanupBtn.click();

  // Wait for button to disappear
  await page.waitForSelector('button:has-text("清理殘留成績")', { state: 'detached' });
  const shot8 = path.join(outDir, '08-after-cleanup.png');
  await page.screenshot({ path: shot8, fullPage: true });
  results.screenshots.push('08-after-cleanup.png');

  const cleanupCheck = await page.evaluate(() => window.__lastCleanupOnly);
  assert.equal(cleanupCheck, true, '清理殘留成績必須呼叫 deleteResults(..., cleanupOnly: true)');
  results.cleanupResidual = true;

  // Step 7: 試題分析頁 (Report & Item Analysis)
  console.log('[Zuvio E2E] Step 7: 試題分析報表頁...');
  // Switch to report tab
  await page.locator('button[role="tab"]:has-text("報表")').click();
  await page.waitForSelector('label:has-text("考卷") select');
  await page.locator('label:has-text("考卷") select').selectOption('demo-exam');
  await page.waitForSelector('h3:has-text("甲表：整卷統計與信度")');

  // Verify statistics in 甲表
  const metrics = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasKR20: text.includes('KR-20'),
      hasMean: text.includes('平均數'),
      hasSD: text.includes('SD'),
      hasSEM: text.includes('SEM'),
      hasCoverage: text.includes('考前練習'),
      hasItemAnalysisTable: text.includes('乙表：逐題難度、鑑別度、r_pb 與誘答分析'),
      hasMoodTable: text.includes('考前情緒分布與成績交叉'),
      hasCareList: text.includes('關懷名單'),
    };
  });
  assert.ok(metrics.hasKR20 && metrics.hasMean && metrics.hasSEM, '甲表必須包含 KR-20、平均數與 SEM');
  assert.ok(metrics.hasItemAnalysisTable, '必須包含乙表試題分析');

  const shot9 = path.join(outDir, '09-report-item-analysis.png');
  await page.screenshot({ path: shot9, fullPage: true });
  results.screenshots.push('09-report-item-analysis.png');
  results.itemAnalysisReport = true;

  // Step 8: 情緒分布與關懷名單 (Mood Distribution)
  console.log('[Zuvio E2E] Step 8: 課前情緒分布與關懷名單...');
  assert.ok(metrics.hasMoodTable, '必須包含課前情緒分布與成績交叉表');
  assert.ok(metrics.hasCareList, '必須包含關懷名單');

  // Click masked name button in care list to reveal real name/ID
  const careBtn = page.locator('button.z-care-btn').first();
  if (await careBtn.count()) {
    const textBefore = await careBtn.textContent();
    await careBtn.click();
    const textAfter = await careBtn.textContent();
    assert.notEqual(textBefore, textAfter, '點擊遮碼姓名按鈕應展開真實姓名與學號');
  }

  const shot10 = path.join(outDir, '10-report-mood-distribution.png');
  await page.screenshot({ path: shot10, fullPage: true });
  results.screenshots.push('10-report-mood-distribution.png');
  results.moodDistribution = true;

  await page.close();

  // ----------------------------------------------------
  // Phase 2: Student Mood Card in Mobile View (390x844)
  // ----------------------------------------------------
  console.log('[Zuvio E2E] Step 9: 學生端情緒卡 (390x844 手機可讀性與互動)...');
  const studentPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await studentPage.goto(`${baseUrl}?view=student-mood`, { waitUntil: 'load' });
  await studentPage.waitForSelector('.zext-q');

  // Measure readability according to docs/READABILITY_STANDARD.md
  const readability = await studentPage.evaluate(() => {
    const qEl = document.querySelector('.zext-q');
    const subEl = document.querySelector('.zext-subnote');
    const btns = Array.from(document.querySelectorAll('.zext-mood-btn'));
    const submitBtn = document.querySelector('.zext-submit-btn');

    const qFont = parseFloat(window.getComputedStyle(qEl).fontSize);
    const subFont = parseFloat(window.getComputedStyle(subEl).fontSize);
    const minBtnH = Math.min(...btns.map((b) => b.getBoundingClientRect().height));
    const btnFonts = btns.map((b) => parseFloat(window.getComputedStyle(b).fontSize));
    const bodyW = document.body.scrollWidth;
    const viewW = window.innerWidth;

    return {
      qFont,
      subFont,
      minBtnH,
      minBtnFont: Math.min(...btnFonts),
      overflow: bodyW > viewW,
    };
  });

  console.log('[Readability Metrics]', readability);
  assert.ok(readability.qFont >= 18, `標題/題幹字級需 >= 18px，實測 ${readability.qFont}px`);
  assert.ok(readability.minBtnH >= 44, `選項點擊高度需 >= 44px，實測 ${readability.minBtnH}px`);
  assert.ok(!readability.overflow, '手機 390 寬度不得有水平溢位');
  results.readabilityPass = true;

  const shot11 = path.join(outDir, '11-student-mood-card-initial.png');
  await studentPage.screenshot({ path: shot11 });
  results.screenshots.push('11-student-mood-card-initial.png');

  // Select mood button (first one: 微風：充滿活力、進入心流)
  const moodBtn = studentPage.locator('.zext-mood-btn').first();
  await moodBtn.click();

  // Click submit
  const submitBtn = studentPage.locator('.zext-submit');
  await submitBtn.click();

  // Wait for feedback card
  await studentPage.waitForSelector('.zext-feedback-box');
  const feedbackFont = await studentPage.evaluate(() => {
    const fb = document.querySelector('.zext-feedback-text');
    return parseFloat(window.getComputedStyle(fb).fontSize);
  });
  assert.ok(feedbackFont >= 18, `回饋字級需 >= 18px，實測 ${feedbackFont}px`);

  const shot12 = path.join(outDir, '12-student-mood-card-feedback.png');
  await studentPage.screenshot({ path: shot12 });
  results.screenshots.push('12-student-mood-card-feedback.png');
  results.studentMoodCard = true;

  await studentPage.close();

} finally {
  await browser.close();
  server.close();
}

// Write manifest.json
const manifest = {
  date: '2026-11-24',
  expiresAt: '2026-12-01',
  target: '#65 Zuvio 出題＋擴充上線準備 1.16.0 真實瀏覽器驗證',
  commit: 'd13cf24a',
  results,
  summary: {
    pass: Object.values(results).every((v) => (typeof v === 'boolean' ? v : true)),
    totalScreenshots: results.screenshots.length,
  },
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(JSON.stringify(manifest, null, 2));
