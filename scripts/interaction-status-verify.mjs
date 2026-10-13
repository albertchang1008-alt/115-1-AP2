import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export async function verifyInteractionStatus(shots = false) {
  const out = 'docs/interaction-status-screenshots';
  if (shots) await fs.mkdir(out, { recursive: true });
  const bundle = buildSync({
    entryPoints: ['tests/fixtures/interaction-status.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  }).outputFiles[0].text;
  const css = await fs.readFile('src/style.css', 'utf8');
  const browser = await chromium.launch({ channel: 'chrome' }),
    report = [];
  try {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('http://interaction.test/', (r) =>
        r.fulfill({
          contentType: 'text/html',
          body: '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>',
        }),
      );
      // A phone wall clock one day wrong must not change the server-anchored countdown.
      await page.addInitScript(() => {
        const original = Date.now;
        Date.now = () => original() + 86400000;
      });
      await page.goto('http://interaction.test/');
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: bundle });
      await page.getByLabel('選擇投影片').waitFor();
      const bar = page.getByLabel('互動常駐狀態');
      const shot = async (name) => {
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
          `${width}/${name}: overflow`,
        );
        if (shots) await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: !(await page.evaluate(() => !!document.fullscreenElement)) });
      };
      assert.match(await bar.innerText(), /目前沒有開放/);
      assert.equal(await page.getByRole('button', { name: '開放作答', exact: true }).count(), 0);
      for (let i = 0; i < 13; i++) {
        await page.getByLabel('選擇投影片').selectOption(String(i));
        assert.equal(await bar.count(), 1);
      }
      await page.getByLabel('選擇投影片').selectOption('1');
      assert.equal(await page.getByLabel('倒數時間').inputValue(), '60');
      await shot('idle');
      await page.getByRole('button', { name: '開放作答', exact: true }).click();
      await page.getByRole('button', { name: '進入互動', exact: true }).waitFor();
      await page.getByRole('button', { name: '進入互動', exact: true }).click();
      const first = page.getByRole('radio').first();
      await first.check();
      await page.getByRole('button', { name: '快轉 51 秒', exact: true }).click();
      await page.locator('.interaction-timer.urgent').waitFor();
      await shot('student-ten-seconds');
      assert(!(await first.isDisabled()));
      await page.getByRole('button', { name: '快轉 30 秒', exact: true }).click();
      await page.locator('.classroom-statusbar.expired').waitFor();
      await page.waitForFunction(
        () => document.querySelector('.classroom-student fieldset')?.disabled,
      );
      assert(await first.isChecked());
      assert(await first.isDisabled());
      assert.equal(
        await page.getByRole('button', { name: '確認送出並鎖定', exact: true }).count(),
        0,
      );
      await shot('expired-retains-answer');
      await page.getByRole('button', { name: '＋30 秒', exact: true }).click();
      await page.locator('.classroom-statusbar.open').waitFor();
      await page.waitForFunction(
        () => !document.querySelector('.classroom-student fieldset')?.disabled,
      );
      assert(!(await first.isDisabled()));
      await page.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
      await page.getByText('已送出，作答已鎖定。等待教師統整。').waitFor();
      await page.waitForFunction(() =>
        document.querySelector('.classroom-statusbar').textContent.includes('已收 1／54'),
      );
      await shot('extended-and-submitted');
      await page.getByLabel('選擇投影片').selectOption('0');
      assert.equal(await page.getByRole('button', { name: '開放作答', exact: true }).count(), 0);
      assert.match(await bar.innerText(), /革蘭氏/);
      await shot('other-slide-active');
      await page.getByLabel('選擇投影片').selectOption('2');
      await page.getByRole('button', { name: '開放作答', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await shot('replace-confirm');
      await page.getByRole('button', { name: '取消', exact: true }).click();
      assert.match(await bar.innerText(), /革蘭氏/);
      await page.getByRole('button', { name: '開放作答', exact: true }).click();
      await page.getByRole('button', { name: '結束並開放本頁', exact: true }).click();
      await page.waitForFunction(() =>
        document.querySelector('.classroom-statusbar').textContent.includes('討論點1'),
      );
      await shot('replaced');
      await page.getByRole('button', {name:'快轉 51 秒',exact:true}).click();
      await page.getByRole('button', {name:'快轉 30 秒',exact:true}).click();
      await page.locator('.classroom-statusbar.expired').waitFor();
      await page.getByRole('button', {name:'顯示結果',exact:true}).click();
      await page.getByLabel('即時投票結果').waitFor();
      assert.match(await bar.innerText(),/目前沒有開放/);
      await shot('expired-show-results-closes');
      await page.getByRole('button', {name:'回投影片',exact:true}).click();

      await page.getByRole('button', { name: '暫時黑屏', exact: true }).click();
      assert.equal(await bar.count(), 0);
      await shot('black');
      await page.getByRole('button', { name: '恢復投影片', exact: true }).click();
      await page.getByRole('button', { name: '再投一輪', exact: true }).waitFor();
      await page.getByLabel('倒數時間').selectOption('0');
      await page.getByRole('button', { name: '再投一輪', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: '＋30 秒', exact: true }).count(), 0);
      assert.match(await bar.innerText(), /已開放/);
      await shot('unlimited');
      await page.getByText('歷次結果',{exact:true}).click();
      await page.getByLabel('歷次互動').selectOption('round-2');
      await page.getByLabel('即時投票結果').waitFor();
      assert.match(await bar.innerText(),/第2輪/);
      await shot('history-keeps-active');
      await page.getByRole('button',{name:'回投影片',exact:true}).click();
      await page.getByText('歷次結果',{exact:true}).click();

      await page.evaluate(() => document.documentElement.style.setProperty('--font-scale', '1.2'));
      await shot('font-1.2');
      await page.getByRole('button', { name: '全螢幕簡報', exact: true }).click();
      await page.getByRole('button', { name: '回控制台', exact: true }).waitFor();
      assert.equal(await bar.count(), 1);
      await shot('fullscreen-1.2');
      await page.getByRole('button', { name: '下一頁', exact: true }).click();
      assert.equal(await bar.count(), 1);
      await page.getByRole('button', { name: '暫時黑屏', exact: true }).click();
      assert.equal(await bar.count(), 0);
      await shot('fullscreen-black');
      await page.getByRole('button', { name: '恢復投影片', exact: true }).click();
      await page.getByRole('button', { name: '回控制台', exact: true }).click();
      assert.deepEqual(errors, []);
      report.push({ width, fontScale: 1.2, allSlides: 13, errors, passed: true });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  if (shots) await fs.writeFile(`${out}/verification.json`, JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await verifyInteractionStatus(true)));
