import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import { MOOD_STUDENT_STATES } from '../shared/zuvioExt.ts';

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

const chromePath = process.env.CHROME_PATH;
const browser = await (chromePath
  ? chromium.launch({ executablePath: chromePath })
  : chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
).catch((error) => {
  server.close();
  throw error;
});
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

async function capture(page, filename, description, fullPage = true) {
  const png = await page.screenshot({ path: path.join(outDir, filename), fullPage, animations: 'disabled' });
  const evidence = { filename, description, sha256: createHash('sha256').update(png).digest('hex') };
  results.screenshots.push(evidence);
  return evidence;
}

async function assertUnobscured(button) {
  await button.scrollIntoViewIfNeeded();
  const unobscured = await button.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const xs = [rect.left + 3, rect.left + rect.width / 2, rect.right - 3];
    const ys = [rect.top + 3, rect.top + rect.height / 2, rect.bottom - 3];
    return xs.every((x) => ys.every((y) => element.contains(document.elementFromPoint(x, y))));
  });
  assert.ok(unobscured, `場次操作按鈕被遮住：${await button.innerText()}`);
}

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
  await capture(page, '01-make-exam.png', `次單元比例與 ${pickedCount} 題出題預覽`);
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
  await capture(page, '02-exam-detail-sittings.png', '考卷明細與新增的甲班第 1 次場次');
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
  await capture(page, '03-import-preview.png', '示範成績比對通過與匯入預覽');

  // Confirm import
  const confirmBtn = page.locator('button:has-text("確認匯入")');
  await confirmBtn.click();
  await page.locator('.z-import').waitFor({ state: 'detached' });

  // Verify sitting row updated to "已匯入 XX 人"
  await page.waitForSelector('tr:has-text("甲班 第1次") td:has-text("已匯入")');
  const importText = await page.locator('tr:has-text("甲班 第1次") td:has-text("已匯入")').textContent();
  console.log(`[Zuvio E2E] Sitting imported text: ${importText}`);
  await capture(page, '04-imported-results.png', `確認匯入後的場次狀態「${importText}」`);
  results.importResults = true;

  // Step 4: 重新匯入 (Re-import Results)
  console.log('[Zuvio E2E] Step 4: 重新匯入...');
  const reimportBtn = page.locator('tr:has-text("甲班 第1次") button:has-text("重新匯入")');
  await reimportBtn.click();
  await page.waitForSelector('.z-import');

  await page.locator('button:has-text("載入示範成績檔")').click();
  await page.waitForSelector('button:has-text("確認匯入（取代這一場原有成績）")');
  await capture(page, '05-reimport-preview.png', '重新匯入預覽與取代原有成績確認按鈕');

  await page.locator('button:has-text("確認匯入（取代這一場原有成績）")').click();
  await page.locator('.z-import').waitFor({ state: 'detached' });
  await page.waitForSelector('tr:has-text("甲班 第1次") td:has-text("已匯入")');
  results.reimportResults = true;

  // Step 5: 刪除成績 (Delete Results)
  console.log('[Zuvio E2E] Step 5: 刪除成績...');
  const sittingRow = page.getByRole('row').filter({ hasText: '甲班 第1次' });
  const toast = page.locator('#test-toast');
  const deleteBtn = sittingRow.getByRole('button', { name: '刪除成績', exact: true });
  const cleanupBtn = sittingRow.getByRole('button', { name: '清理殘留成績', exact: true, includeHidden: true });
  await toast.filter({ hasText: '成績已匯入' }).waitFor({ state: 'visible' });
  assert.equal(await cleanupBtn.count(), 0, '刪除前應無待清理按鈕');
  await assertUnobscured(deleteBtn);
  const beforeCleanup = await capture(page, '06-before-cleanup.png', '刪除前，場次仍有成績並可執行刪除');
  await deleteBtn.click(); // dialog is auto-accepted

  await sittingRow.getByRole('cell', { name: '尚未匯入', exact: true }).waitFor();
  assert.equal(await toast.count(), 0, '刪除成績後應移除上一個匯入提示');
  results.deleteResults = true;

  // Step 6: 清理殘留成績 (Cleanup Residual Results)
  console.log('[Zuvio E2E] Step 6: 清理殘留成績...');
  await cleanupBtn.waitFor({ state: 'visible' });
  await assertUnobscured(cleanupBtn);
  const pendingCleanup = await capture(page, '07-pending-cleanup.png', '成績已刪除，清理殘留成績按鈕可見且未被遮擋');
  await cleanupBtn.click();

  await cleanupBtn.waitFor({ state: 'detached' });
  assert.equal(await toast.count(), 0, '清理後應維持提示框已移除');
  const remainingImportBtn = sittingRow.getByRole('button', { name: '匯入成績', exact: true });
  await assertUnobscured(remainingImportBtn);
  const afterCleanup = await capture(page, '08-after-cleanup.png', '清理完成，清理按鈕已移除，匯入按鈕未被遮擋');

  const cleanupCheck = await page.evaluate(() => window.__lastCleanupOnly);
  assert.equal(cleanupCheck, true, '清理殘留成績必須呼叫 deleteResults(..., cleanupOnly: true)');
  assert.equal(new Set([beforeCleanup.sha256, pendingCleanup.sha256, afterCleanup.sha256]).size, 3,
    '06、07、08 三個清理狀態的截圖 SHA-256 必須兩兩不同');
  results.cleanupResidual = true;

  // Step 7: 試題分析頁 (Report & Item Analysis)
  console.log('[Zuvio E2E] Step 7: 試題分析報表頁...');
  // Switch to report tab
  await page.locator('button[role="tab"]:has-text("報表")').click();
  await page.waitForSelector('label:has-text("考卷") select');
  await page.locator('label:has-text("考卷") select').selectOption('demo-exam');
  const summary = page.locator('section.z-card').filter({
    has: page.getByRole('heading', { name: /^甲表：整卷統計與信度/ }),
  });
  await summary.waitFor();

  const rawScores = await page.evaluate(() => window.__zuvioFixtureScores('demo-exam', 's1'));
  assert.ok(rawScores.length > 1 && rawScores.every((score) => score.trim() && Number.isFinite(Number(score))),
    '甲班第 1 次示範場次必須有可計算樣本 SD 的合成總分');
  const scores = rawScores.map(Number);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const sd = Math.sqrt(scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / (scores.length - 1));
  const scoreMetric = summary.locator('.z-metric').filter({ has: page.getByText('平均數', { exact: true }) });
  const meanText = (await scoreMetric.locator('b').innerText()).trim();
  const sdText = (await scoreMetric.getByText(/^SD\s/).innerText()).replace(/^SD\s+/, '').trim();
  const displayed = { mean: Number(meanText), sd: Number(sdText) };
  // The report displays at most two places after rounding.
  const roundingTolerance = 0.005 + 1e-9;
  for (const [name, text, expected] of [['平均數', meanText, mean], ['SD', sdText, sd]]) {
    assert.match(text, /^-?\d+(?:\.\d{1,2})?$/, `甲表${name}需為數字`);
    assert.ok(Math.abs(Number(text) - expected) <= roundingTolerance,
      `甲表${name} ${text} 與示範總分計算值 ${expected} 不符`);
  }
  results.itemAnalysisStats = { sampleSize: scores.length, displayed, expected: { mean, sd } };

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
  assert.ok(metrics.hasKR20 && metrics.hasMean && metrics.hasSD && metrics.hasSEM && metrics.hasCoverage,
    '甲表必須包含 KR-20、平均數、SD、SEM 與考前練習');
  assert.ok(metrics.hasItemAnalysisTable, '必須包含乙表試題分析');

  await capture(page, '09-report-item-analysis.png', `合成場次甲表平均數 ${meanText}、SD ${sdText}，以及乙表試題分析`);
  results.itemAnalysisReport = true;

  // Step 8: 情緒分布與關懷名單 (Mood Distribution)
  console.log('[Zuvio E2E] Step 8: 課前情緒分布與關懷名單...');
  assert.ok(metrics.hasMoodTable, '必須包含課前情緒分布與成績交叉表');
  assert.ok(metrics.hasCareList, '必須包含關懷名單');

  // Click masked name button in care list to reveal real name/ID
  const careBtn = page.locator('button.z-care-btn').first();
  const textBefore = await careBtn.innerText();
  await careBtn.click();
  assert.notEqual(await careBtn.innerText(), textBefore, '點擊遮碼姓名按鈕應展開合成姓名與學號');

  await capture(page, '10-report-mood-distribution.png', '情緒分布交叉表與展開遮碼後的合成關懷名單');
  results.moodDistribution = true;

  await page.close();

  // ----------------------------------------------------
  // Phase 2: Student Mood Card in Mobile View (390x844)
  // ----------------------------------------------------
  console.log('[Zuvio E2E] Step 9: 學生端情緒卡 (390x844 手機可讀性與互動)...');
  const studentPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await studentPage.goto(`${baseUrl}?view=student-mood`, { waitUntil: 'load' });
  await studentPage.waitForSelector('.zext-q');
  const moodButtons = studentPage.getByRole('radio');
  const moodLabels = await moodButtons.locator('.zext-mood-label').allInnerTexts();
  assert.equal(await moodButtons.count(), MOOD_STUDENT_STATES.length, '情緒選項數需符合共用定義');
  assert.deepEqual(moodLabels, MOOD_STUDENT_STATES.map(({ label }) => label), '情緒選項文字及順序需符合共用定義');
  results.studentMoodOptions = { count: moodLabels.length, labels: moodLabels };

  // Measure readability according to docs/READABILITY_STANDARD.md
  const readability = await studentPage.evaluate(() => {
    const qEl = document.querySelector('.zext-q');
    const subEl = document.querySelector('.zext-subnote');
    const btns = Array.from(document.querySelectorAll('.zext-mood-btn'));

    const qFont = parseFloat(window.getComputedStyle(qEl).fontSize);
    const subFont = parseFloat(window.getComputedStyle(subEl).fontSize);
    const minBtnH = Math.min(...btns.map((b) => b.getBoundingClientRect().height));
    const btnFonts = btns.map((b) => parseFloat(window.getComputedStyle(b).fontSize));
    const bodyW = document.documentElement.scrollWidth;
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
  assert.ok(readability.qFont >= 19, `題幹字級需 >= 19px，實測 ${readability.qFont}px`);
  assert.ok(readability.subFont >= 18, `說明字級需 >= 18px，實測 ${readability.subFont}px`);
  assert.ok(readability.minBtnFont >= 18, `選項字級需 >= 18px，實測 ${readability.minBtnFont}px`);
  assert.ok(readability.minBtnH >= 44, `選項點擊高度需 >= 44px，實測 ${readability.minBtnH}px`);
  assert.ok(!readability.overflow, '手機 390 寬度不得有水平溢位');
  await capture(studentPage, '11-student-mood-card-initial.png', `390px 手機畫面，顯示 ${moodLabels.length} 個共用情緒選項`, false);

  const firstMood = MOOD_STUDENT_STATES[0];
  const moodBtn = moodButtons.first();
  await moodBtn.click();
  assert.equal(await moodBtn.getAttribute('aria-checked'), 'true');

  // Click submit
  const submitBtn = studentPage.locator('.zext-submit');
  await submitBtn.click();

  // Wait for feedback card
  const feedback = studentPage.locator('.zext-feedback-text');
  await feedback.waitFor();
  assert.equal(await studentPage.evaluate(() => window.__submittedMood), firstMood.code);
  assert.equal(await feedback.innerText(), firstMood.feedback);
  const feedbackFont = await feedback.evaluate((text) => parseFloat(getComputedStyle(text).fontSize));
  assert.ok(feedbackFont >= 18, `回饋字級需 >= 18px，實測 ${feedbackFont}px`);
  results.studentReadability = { ...readability, feedbackFont };
  results.readabilityPass = true;

  await capture(studentPage, '12-student-mood-card-feedback.png', `送出「${firstMood.label}」後的對應回饋`, false);
  results.studentMoodCard = true;

  await studentPage.close();

} finally {
  await browser.close();
  server.close();
}

// Write manifest.json
assert.equal(results.screenshots.length, 12, '必須存下 12 張驗收截圖');
const evidenceDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date());
const expiresAt = new Date(Date.parse(evidenceDate) + 7 * 86400000).toISOString().slice(0, 10);
const manifest = {
  date: evidenceDate,
  expiresAt,
  target: '#65 Zuvio 出題＋擴充上線準備 1.16.0 真實瀏覽器驗證',
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  worktreeDirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  results,
  summary: {
    pass: Object.values(results).every((v) => (typeof v === 'boolean' ? v : true)),
    totalScreenshots: results.screenshots.length,
  },
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(JSON.stringify(manifest, null, 2));
