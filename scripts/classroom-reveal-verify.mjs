import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function verifyClassroomReveal(outDir = '') {
  if (outDir) await fs.mkdir(outDir, { recursive: true });
  const bundle = buildSync({
    entryPoints: ['tests/fixtures/classroom-reveal.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  }).outputFiles[0].text;
  const css = await fs.readFile('src/style.css', 'utf8');
  const browser = await chromium.launch({ channel: 'chrome' });
  const report = [];

  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 960 } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('http://reveal.test/', (r) =>
        r.fulfill({
          contentType: 'text/html',
          body: '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>',
        }),
      );
      await page.goto('http://reveal.test/');
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: bundle });
      await page.getByLabel('選擇互動題').waitFor();

      const checkOverflow = async (stepName) => {
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        assert.equal(over, false, `${width}/${stepName}: 發生水平溢位`);
      };
      const shot = async (name) => {
        await checkOverflow(name);
        if (outDir) {
          await page.screenshot({ path: `${outDir}/${name}-${width}.png`, fullPage: true });
        }
      };

      const teacherPane = page.getByTestId('teacher-pane');
      const correctPane = page.getByTestId('student-correct-pane');
      const wrongPane = page.getByTestId('student-wrong-pane');
      const unansweredPane = page.getByTestId('student-unanswered-pane');

      // 1. Check ClassroomConfigEditor answerKeys panel
      await page.getByLabel('切換檢視角色').selectOption('teacher');
      await teacherPane.getByText('設定答案與解析', { exact: true }).click();
      const akTextarea = teacherPane.getByLabel('答案與解析設定 JSON');
      await akTextarea.waitFor();
      assert.match(await akTextarea.inputValue(), /R-REV-04/);
      await teacherPane.getByRole('button', { name: '保存答案與解析', exact: true }).click();
      await teacherPane.getByText('設定答案與解析', { exact: true }).click();
      await checkOverflow('config-editor');

      // 2. Question without answer key does NOT show 公佈答案 button after close
      await teacherPane.getByLabel('選擇互動題').selectOption('NO-KEY-SLIDE');
      await teacherPane.getByRole('button', { name: '開放作答', exact: true }).click();
      await teacherPane.getByRole('button', { name: '結束作答', exact: true }).click();
      assert.equal(
        await teacherPane.getByRole('button', { name: '公佈答案', exact: true }).count(),
        0,
        '無答案鍵之題目收題後不應顯示公佈答案按鈕',
      );

      // 3. Open R-REV-04 (choice)
      await teacherPane.getByLabel('選擇互動題').selectOption('R-REV-04');
      await teacherPane.getByRole('button', { name: '開放作答', exact: true }).click();

      // Switch to 'all' to let correct & wrong students submit
      await page.getByLabel('切換檢視角色').selectOption('all');

      await correctPane.getByRole('button', { name: '進入互動', exact: true }).waitFor();
      await correctPane.getByRole('button', { name: '進入互動', exact: true }).click();
      await correctPane
        .getByRole('radio', {
          name: /主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）/,
        })
        .check();
      await correctPane.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
      await correctPane.getByText('已送出，等待老師公佈答案', { exact: true }).waitFor();

      await wrongPane.getByRole('button', { name: '進入互動', exact: true }).click();
      await wrongPane
        .getByRole('radio', {
          name: /主支氣管進入肺門後直接分支為終末細支氣管/,
        })
        .check();
      await wrongPane.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
      await wrongPane.getByText('已送出，等待老師公佈答案', { exact: true }).waitFor();

      // Negative check while open: no reveal feedback or explanation shown
      assert.equal(await page.locator('.reveal-feedback').count(), 0);
      assert.equal(
        await correctPane.locator('.reveal-feedback').count(),
        0,
        '收題與公佈前不可顯示回饋區塊',
      );

      // Teacher closes round
      await teacherPane.getByRole('button', { name: '結束作答', exact: true }).click();
      await teacherPane.getByRole('button', { name: '公佈答案', exact: true }).waitFor();

      // Wait for student poll to pick up closed status
      await correctPane.locator('.poll-results').waitFor({ timeout: 8000 });

      // Negative check after close before reveal
      assert.equal(
        await correctPane.locator('.reveal-feedback').count(),
        0,
        '收題後未公佈前不可洩漏回饋區塊',
      );
      assert.equal(
        (await correctPane.innerText()).includes('至細支氣管軟骨消失'),
        false,
        '收題後未公佈前學生端不可出現解析文字',
      );

      // Capture teacher before reveal
      await page.getByLabel('切換檢視角色').selectOption('teacher');
      await shot('teacher-before-reveal');

      // F1 UI Regression: removing answerKeys hides 公佈答案 on unrevealed round; restoring brings it back
      await teacherPane.getByText('設定答案與解析', { exact: true }).click();
      const savedAkJson = await akTextarea.inputValue();
      await akTextarea.fill('{}');
      await teacherPane.getByRole('button', { name: '保存答案與解析', exact: true }).click();
      assert.equal(
        await teacherPane.getByRole('button', { name: '公佈答案', exact: true }).count(),
        0,
        '移除答案鍵後，未公佈輪次不可繼續顯示公佈答案按鈕',
      );
      await akTextarea.fill(savedAkJson);
      await teacherPane.getByRole('button', { name: '保存答案與解析', exact: true }).click();
      await teacherPane.getByText('設定答案與解析', { exact: true }).click();
      await teacherPane.getByRole('button', { name: '公佈答案', exact: true }).waitFor();

      // Teacher clicks 公佈答案
      await teacherPane.getByRole('button', { name: '公佈答案', exact: true }).click();
      await teacherPane.getByRole('button', { name: '已公佈', exact: true }).waitFor();
      assert.equal(
        await teacherPane.getByRole('button', { name: '已公佈', exact: true }).isDisabled(),
        true,
      );
      await shot('teacher-after-reveal');

      // F1 UI Regression on revealed round: removing answerKeys keeps 已公佈 button and snapshot intact
      await teacherPane.getByRole('button', { name: '回投影片', exact: true }).click();
      await teacherPane.getByText('設定答案與解析', { exact: true }).click();
      await akTextarea.fill('{}');
      await teacherPane.getByRole('button', { name: '保存答案與解析', exact: true }).click();
      await teacherPane.getByRole('button', { name: '已公佈', exact: true }).waitFor();
      await akTextarea.fill(savedAkJson);
      await teacherPane.getByRole('button', { name: '保存答案與解析', exact: true }).click();
      await teacherPane.getByText('設定答案與解析', { exact: true }).click();

      // Check Student Unanswered after reveal
      await page.getByLabel('切換檢視角色').selectOption('unanswered');
      if (await unansweredPane.getByRole('button', { name: '進入互動', exact: true }).count()) {
        await unansweredPane.getByRole('button', { name: '進入互動', exact: true }).click();
      }
      await unansweredPane.locator('.reveal-feedback').waitFor({ timeout: 8000 });
      assert.match(await unansweredPane.locator('.reveal-feedback').innerText(), /未作答/);
      assert.match(
        await unansweredPane.locator('.reveal-feedback').innerText(),
        /至細支氣管軟骨消失/,
      );
      assert.equal(
        await unansweredPane.locator('.reveal-summary.correct, .reveal-summary.wrong').count(),
        0,
      );
      await shot('student-unanswered');

      // Check Student Correct after reveal
      await page.getByLabel('切換檢視角色').selectOption('correct');
      if (await correctPane.getByRole('button', { name: /查看/ }).count()) {
        await correctPane.getByRole('button', { name: /查看/ }).click();
      }
      await correctPane.locator('.reveal-feedback').waitFor({ timeout: 8000 });
      assert.match(
        await correctPane.locator('.reveal-summary.correct').innerText(),
        /✓ 本題答對/,
      );
      assert.match(
        await correctPane.locator('.reveal-feedback').innerText(),
        /至細支氣管軟骨消失/,
      );
      await shot('student-correct');

      // Check Student Wrong after reveal
      await page.getByLabel('切換檢視角色').selectOption('wrong');
      if (await wrongPane.getByRole('button', { name: /查看/ }).count()) {
        await wrongPane.getByRole('button', { name: /查看/ }).click();
      }
      await wrongPane.locator('.reveal-feedback').waitFor({ timeout: 8000 });
      assert.match(
        await wrongPane.locator('.reveal-summary.wrong').innerText(),
        /✗ 本題答錯/,
      );
      assert.match(
        await wrongPane.locator('.reveal-feedback').innerText(),
        /至細支氣管軟骨消失/,
      );
      await shot('student-wrong');

      // 4. Open R-REV-07 (order question) -> submit -> close -> reveal
      await page.getByLabel('切換檢視角色').selectOption('all');
      await teacherPane.getByLabel('選擇互動題').selectOption('R-REV-07');
      await teacherPane.getByRole('button', { name: '開放作答', exact: true }).click();

      const orderOptions = [
        '橫膈膜與外肋間肌收縮使胸腔擴大',
        '胸膜腔密閉負壓增加（胸內壓更負）',
        '肺泡向外擴張，肺內壓降至低於大氣壓',
        '外界空氣順壓力差流入肺泡',
      ];
      if (await correctPane.getByRole('button', { name: '進入互動', exact: true }).count()) {
        await correctPane.getByRole('button', { name: '進入互動', exact: true }).click();
      }
      await correctPane.getByRole('combobox').first().waitFor({ timeout: 8000 });
      const correctSelects = correctPane.getByRole('combobox');
      for (let i = 0; i < 4; i++) {
        await correctSelects.nth(i).selectOption(orderOptions[i]);
      }
      await correctPane.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
      await correctPane.getByText('已送出，等待老師公佈答案', { exact: true }).waitFor();

      if (await wrongPane.getByRole('button', { name: '進入互動', exact: true }).count()) {
        await wrongPane.getByRole('button', { name: '進入互動', exact: true }).click();
      }
      await wrongPane.getByRole('combobox').first().waitFor({ timeout: 8000 });
      const wrongOrder = [orderOptions[0], orderOptions[2], orderOptions[1], orderOptions[3]];
      const wrongSelects = wrongPane.getByRole('combobox');
      for (let i = 0; i < 4; i++) {
        await wrongSelects.nth(i).selectOption(wrongOrder[i]);
      }
      await wrongPane.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
      await wrongPane.getByText('已送出，等待老師公佈答案', { exact: true }).waitFor();

      await teacherPane.getByRole('button', { name: '結束作答', exact: true }).click();
      await teacherPane.getByRole('button', { name: '公佈答案', exact: true }).click();
      await teacherPane.getByRole('button', { name: '已公佈', exact: true }).waitFor();

      await page.getByLabel('切換檢視角色').selectOption('wrong');
      if (await wrongPane.getByRole('button', { name: /查看/ }).count()) {
        await wrongPane.getByRole('button', { name: /查看/ }).click();
      }
      await wrongPane.locator('.reveal-order-steps').waitFor({ timeout: 8000 });
      const stepsText = await wrongPane.locator('.reveal-order-steps').innerText();
      assert.match(stepsText, /第1步[\s\S]*✓/);
      assert.match(stepsText, /第2步[\s\S]*✗/);
      assert.match(stepsText, /第3步[\s\S]*✗/);
      assert.match(stepsText, /第4步[\s\S]*✓/);
      await shot('student-order-feedback');

      // 5. Check StudentClassroomHistory (課堂互動紀錄)
      await wrongPane.getByRole('button', { name: '課堂互動紀錄', exact: true }).click();
      const historyPanel = wrongPane.getByLabel('課堂互動紀錄');
      await historyPanel.waitFor();
      await wrongPane.getByText('課堂互動紀錄（已公佈 2 題）').waitFor();
      assert.equal(await historyPanel.locator('.history-round-card').count(), 2);
      await shot('student-history');

      assert.deepEqual(errors, []);
      report.push({ width, passed: true, errors });
      await page.close();
    }

    // 6. Direct stale hasAnswerKey UI regression test (stale round.hasAnswerKey:true with answerKeys:{})
    {
      const staleEntry = `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { TeacherInteraction } from './src/ClassroomInteraction';
        const def = {
          slideId: 'slide37',
          title: 'Synthetic',
          fields: [{ id: 'f1', kind: 'choice', label: 'Synthetic field', options: ['A', 'B'] }]
        };
        const staleRound = {
          ...def,
          id: 'round37',
          number: 1,
          status: 'closed',
          openedAt: 1000,
          closedAt: 2000,
          classIds: ['A'],
          total: 0,
          counts: {},
          hasAnswerKey: true
        };
        const api = {
          preview: false,
          call: async (name) =>
            name === 'getClassroomConfig'
              ? { interactions: [def], answerKeys: {} }
              : name === 'classroomInteractionReport'
                ? { round: staleRound, activeRound: null, serverNow: Date.now() }
                : { rows: [] }
        };
        createRoot(document.getElementById('root')).render(
          <TeacherInteraction
            api={api}
            course={{ id: 'synthetic', classIds: ['A'], features: { classroomInteraction: true } }}
            slideId="slide37"
            black={false}
            privateRecords
          />
        );
      `;
      const staleBundle = buildSync({
        stdin: { contents: staleEntry, loader: 'tsx', resolveDir: process.cwd() },
        bundle: true,
        write: false,
        format: 'iife',
        platform: 'browser',
        define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
      }).outputFiles[0].text;
      const stalePage = await browser.newPage({ viewport: { width: 1440, height: 600 } });
      await stalePage.setContent('<div id="root"></div>');
      await stalePage.addStyleTag({ content: css });
      await stalePage.addScriptTag({ content: staleBundle });
      await stalePage.getByRole('button', { name: '再投一輪', exact: true }).waitFor();
      assert.equal(
        await stalePage.getByRole('button', { name: '公佈答案', exact: true }).count(),
        0,
        '即使傳入過期 round.hasAnswerKey:true，當 getClassroomConfig.answerKeys 為空時不可顯示公佈答案按鈕',
      );
      if (outDir) {
        await stalePage.screenshot({
          path: `${outDir}/stale-answer-key-fixed-1440.png`,
          fullPage: true,
        });
      }
      await stalePage.close();
    }

    // 7. If outDir is specified, also verify & screenshot private rehearsal.html & merge-interactions.html
    if (outDir) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
      await page.goto(
        pathToFileURL('/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/rehearsal.html').href,
      );
      await page.locator('#btnOpenPoll').waitFor();
      await page.selectOption('#selJump', '3');
      await page.click('#btnOpenPoll');
      await page.click('#btnVoteAll');
      await page.click('#btnClosePoll');
      await page.click('#btnRevealAnswer');
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${outDir}/rehearsal-reveal-1440.png`, fullPage: true });

      await page.goto(
        pathToFileURL(
          '/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/merge-interactions.html',
        ).href,
      );
      await page.click('#btnTestExisting');
      await page.click('#btnMerge');
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `${outDir}/merge-interactions-answerkeys-1440.png`,
        fullPage: true,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  if (outDir) {
    await fs.writeFile(`${outDir}/ui-verification.json`, JSON.stringify(report, null, 2) + '\n');
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out =
    process.argv[2] ||
    '/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal';
  console.log(JSON.stringify(await verifyClassroomReveal(out), null, 2));
}
