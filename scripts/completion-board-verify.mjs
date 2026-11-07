import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import Papa from 'papaparse';
import { pathToFileURL } from 'node:url';
export async function verifyCompletionBoard(screenshots = false) {
  const out = 'docs/completion-board-1.7.1-screenshots';
  if (screenshots) await fs.mkdir(out, { recursive: true });
  const bundle = buildSync({
    entryPoints: ['tests/fixtures/completion-board.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  }).outputFiles[0].text;
  const css = await fs.readFile('src/style.css', 'utf8'),
    browser = await chromium.launch({ channel: 'chrome' }),
    results = [];
  try {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.route('http://completion.test/', (r) =>
        r.fulfill({
          contentType: 'text/html',
          body: '<meta name="viewport" content="width=device-width,initial-scale=1"><main style="padding:24px;min-width:0"><div id="root"></div></main>',
        }),
      );
      await page.goto('http://completion.test/');
      await page.evaluate(() => localStorage.clear());
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: bundle });
      const shot = async (name) => {
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
          `${width}/${name} overflow`,
        );
        if (screenshots)
          await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
      };
      await page.getByRole('heading', { name: '各班比較', exact: true }).waitFor();
      // 狀態篩選預設只勾進行中；全部勾選後下列既有數字必須與 1.15.3 相同。
      const statusBoxes = ['● 完成', '◐ 進行中', '○ 未開始', '⊘ 未開放'];
      assert.deepEqual(
        await Promise.all(statusBoxes.map((n) => page.getByLabel(n, { exact: true }).isChecked())),
        [false, true, false, false],
        '預設只勾進行中',
      );
      assert(await page.getByLabel('◐ 進行中', { exact: true }).isDisabled(), '至少保留一個狀態');
      for (const n of statusBoxes) await page.getByLabel(n, { exact: true }).check();
      assert.equal(await page.getByLabel('顯示姓名', { exact: true }).isChecked(), false, '預設遮名');
      assert.equal(
        await page.evaluate(() => window.completionTest.calls.length),
        0,
        '進入頁面不自動讀全部班級',
      );
      assert(await page.getByRole('button', { name: '匯出各班比較 CSV' }).isDisabled());
      await page.getByRole('button', { name: '更新全部班級' }).click();
      await page.getByRole('button', { name: '匯出各班比較 CSV' }).waitFor({ state: 'visible' });
      await page.waitForFunction(
        () => !document.querySelector('.completion-toolbar button:last-child').disabled,
      );
      assert.deepEqual(
        await page.evaluate(() => window.completionTest.calls.map((x) => x.data.classId)),
        ['護二甲', '護二乙'],
      );
      const comparison = await page
        .getByRole('table', { name: '各班完成度比較' })
        .locator('tbody tr')
        .evaluateAll((rs) =>
          rs.map((r) => [...r.querySelectorAll('td')].map((t) => t.textContent.trim())),
        );
      assert.equal(comparison[0][0], '18');
      assert.equal(comparison[1][0], '8');
      assert.equal(comparison[2][0], '10');
      assert.equal(comparison[0][1], '3');
      assert.equal(comparison[0][4], '22%');
      assert.equal(comparison[2][6], '—');
      await shot('comparison');
      const csv = async (button) => {
        const promise = page.waitForEvent('download');
        await button.click();
        const download = await promise;
        return Papa.parse(await fs.readFile(await download.path(), 'utf8'), {
          header: true,
          skipEmptyLines: true,
        }).data;
      };
      const firstCsv = await csv(page.getByRole('button', { name: '匯出各班比較 CSV' }));
      assert.equal(firstCsv.length, 3);
      assert.equal(firstCsv[0].人數, '18');
      await page.getByRole('button', { name: '護二甲', exact: true }).click();
      const matrix = page.getByRole('table', { name: '護二甲學生單元矩陣' });
      await matrix.waitFor();
      const html = await page.evaluate(() => document.body.outerHTML);
      assert.equal(/同學|陳盈宥/.test(html), false, '遮名時 DOM（含 title、aria-label）沒有完整姓名');
      assert(html.includes('林OO2') && html.includes('＊＊＊002'), '姓名中間改O、學號留末3碼');
      await page.getByLabel('顯示姓名', { exact: true }).check();
      assert.equal(
        await page.evaluate(() => window.completionTest.calls.length),
        2,
        '快取班級資料，不重讀',
      );
      const secondRates = await matrix.locator('tbody tr').first().locator('td').allTextContents();
      assert.deepEqual(
        secondRates.slice(0, 4).map((s) => s.trim()),
        [
          comparison[1][4],
          comparison[1][5],
          comparison[1][6],
          comparison[1][7].replace('選看', '').trim(),
        ],
      );
      const rowConsistency = await matrix.locator('tbody tr').evaluateAll((rs) =>
        rs.slice(1).map((r) => {
          const cells = [...r.querySelectorAll('td')],
            done = cells.slice(0, 3).filter((t) => t.querySelector('.state-done')).length;
          return { shown: cells[4].textContent.trim(), done };
        }),
      );
      for (const row of rowConsistency) assert.equal(row.shown, `${row.done}／3`);
      assert(await page.getByText('停用', { exact: false }).isVisible());
      await shot('matrix');
      const selected = page.getByRole('button', { name: '林同學2 血液：逾期完成', exact: true });
      await selected.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      assert(await dialog.getByText('首次達標：', { exact: false }).first().isVisible());
      assert(await dialog.getByRole('heading', { name: '必做活動（已完成 1／1）', exact: true }).isVisible());
      assert(await dialog.getByText('首次完成：', { exact: false }).first().isVisible());
      assert(await dialog.getByText('開啟 3 次（含推估）', { exact: false }).first().isVisible());
      const before = await page.evaluate(() => window.completionTest.calls.length);
      assert.equal(
        await page.evaluate(() => window.completionTest.calls.filter((x) => /Attempts|Sessions/.test(x.name)).length),
        0,
        '展開前不讀細目',
      );
      await dialog.getByRole('button', { name: '展開互動教材細目', exact: true }).click();
      await dialog.getByText('停在第 4 關', { exact: true }).waitFor();
      assert.equal(await dialog.getByText('推估', { exact: true }).count(), 2);
      await dialog.getByRole('button', { name: '展開血液成分細目', exact: true }).click();
      await dialog.getByText('85 ✓ 達標', { exact: true }).waitFor();
      assert.equal(await dialog.getByText('✓ 達標', { exact: false }).count(), 1, '只標第一次達標');
      assert.equal(await page.evaluate(() => window.completionTest.calls.length), before + 2);
      assert.equal(await dialog.getByRole('heading', { name: '血液成分', exact: true }).count(), 1);
      assert.equal(await dialog.getByRole('heading', { name: '紅血球', exact: true }).count(), 1);
      await shot('popover');
      await page.keyboard.press('Escape');
      assert.equal(await dialog.count(), 0);
      assert.equal(await selected.evaluate((el) => document.activeElement === el), true);
      await page.getByLabel('搜尋學生', { exact: true }).fill('陳盈宥');
      assert.equal(await matrix.locator('tbody tr').count(), 2);
      const secondCsv = await csv(page.getByRole('button', { name: '匯出 CSV', exact: true }));
      assert.equal(secondCsv.length, 1);
      assert.equal(secondCsv[0].姓名, '陳盈宥');
      assert.equal(secondCsv[0].已完成, '3');
      assert.equal(secondCsv[0].呼吸系統, '完成');
      await matrix.getByRole('button', { name: '查看', exact: true }).click();
      await page.getByRole('heading', { name: '陳盈宥', exact: true }).waitFor();
      await page.getByRole('button', { name: '讀取最近 20 組作答' }).click();
      assert.equal(
        await page.evaluate(() => window.completionTest.calls.at(-1).name),
        'getHistory',
      );
      await page.getByRole('button', { name: '關閉', exact: true }).click();
      await page.getByLabel('搜尋學生', { exact: true }).fill('');
      await page.getByLabel('只看有逾期', { exact: true }).check();
      const overdue = (await matrix.locator('tbody tr').count()) - 1;
      assert.equal(overdue, 6);
      await page.getByLabel('排序', { exact: true }).selectOption('overdue');
      assert.equal(await matrix.locator('tbody tr').nth(1).locator('.is-overdue').count(), 1);
      await page.getByLabel('只看有逾期', { exact: true }).uncheck();
      await page.getByLabel('排序', { exact: true }).selectOption('done');
      assert.equal(
        await matrix.locator('tbody tr').nth(1).locator('.completion-fraction').textContent(),
        '0／3',
      );
      await page.getByRole('button', { name: '各班比較', exact: true }).click();
      assert.equal(await matrix.count(), 0);
      await page.getByRole('button', { name: '護二乙', exact: true }).click();
      await page.getByRole('table', { name: '護二乙學生單元矩陣' }).waitFor();
      assert.equal(await page.getByRole('columnheader', { name: /呼吸系統/ }).count(), 0);
      assert.equal(
        await page.evaluate(
          () => window.completionTest.calls.filter((x) => x.name === 'getCompletion').length,
        ),
        2,
      );
      await page.evaluate(() => window.completionTest.setFail(true));
      await page.getByRole('button', { name: '更新', exact: true }).click();
      await page.waitForFunction(() => window.completionTest.notices.length === 1);
      assert.equal(
        await page.getByRole('table', { name: '護二乙學生單元矩陣' }).locator('tbody tr').count(),
        11,
        '失敗仍保留前次完整快取',
      );
      // 只勾進行中：只剩進行中格子；明細只列未完成項目；取消顯示姓名立即遮回。
      const inProgressMatrix = page.getByRole('table', { name: '護二乙學生單元矩陣' });
      for (const n of ['● 完成', '○ 未開始', '⊘ 未開放'])
        await page.getByLabel(n, { exact: true }).uncheck();
      const states = await inProgressMatrix
        .locator('.completion-cell')
        .evaluateAll((bs) => bs.map((b) => b.className.match(/state-(\w+)/)[1]));
      assert(states.length > 0 && states.every((x) => x === 'inProgress'), JSON.stringify(states));
      assert(await page.getByText('依狀態篩選（進行中）', { exact: false }).first().isVisible());
      await page.getByLabel('顯示姓名', { exact: true }).uncheck();
      assert.equal(/同學|陳盈宥/.test(await page.evaluate(() => document.body.outerHTML)), false);
      await shot('filtered');
      await inProgressMatrix.locator('.completion-cell').first().click();
      const filteredDialog = page.getByRole('dialog');
      await filteredDialog.waitFor();
      assert.equal(await filteredDialog.getByText('首次達標：', { exact: false }).count(), 0, '已達標分類隱藏');
      await page.keyboard.press('Escape');
      for (const n of ['● 完成', '○ 未開始', '⊘ 未開放'])
        await page.getByLabel(n, { exact: true }).check();
      assert.deepEqual(errors, []);
      results.push({
        width,
        rows: 18,
        weightedRate: comparison[0][4],
        classRateConsistent: true,
        studentTotalsConsistent: true,
        cache: true,
        filteredCsv: true,
        studentDetail: true,
        overdueFilter: overdue,
        errors,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  if (screenshots)
    await fs.writeFile(`${out}/checks.json`, JSON.stringify(results, null, 2) + '\n');
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await verifyCompletionBoard(true), null, 2));
