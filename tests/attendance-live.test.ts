import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSync } from 'esbuild';
import { chromium, type Page } from 'playwright';

declare global {
  interface Window {
    attendanceFixture: {
      live: { requests: number[]; token: string; rejectNext: boolean; delayMs: number; maxActive: number };
      unmount: () => void;
    };
    projectionTest: { timers: Map<number, string>; setHidden: (value: boolean) => void };
  }
}

const base = 'http://attendance.test';
const time = new Date('2026-11-24T01:00:00Z');
const fixture = buildSync({
  entryPoints: ['tests/fixtures/attendance-ui.tsx'],
  bundle: true,
  write: false,
  outfile: 'ui.js',
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
}).outputFiles.find((file) => file.path.endsWith('/ui.js'))!.text;

const countdown = (page: Page) => page.locator('.att-proj-time').textContent();
const qr = (page: Page) => page.getByRole('img', { name: '簽到 QR' }).innerHTML();
const code = (page: Page) => page.locator('.att-proj-code b').textContent();
const signed = (page: Page) =>
  page.locator('.att-proj-box').filter({ hasText: '已簽到' }).locator('b').textContent();
const mock = (page: Page) => page.evaluate(() => window.attendanceFixture.live);
const timers = (page: Page) =>
  page.evaluate(() => [...window.projectionTest.timers.values()].sort());
const setHidden = (page: Page, value: boolean) =>
  page.evaluate((hidden) => window.projectionTest.setHidden(hidden), value);

test('點名投影以假時鐘驗證即時更新', async (t) => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : undefined);
  t.after(() => browser.close());
  const withProjection = async (check: (page: Page) => Promise<void>) => {
    const page = await browser.newPage();
    try {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.setDefaultTimeout(3000);
      page.setDefaultNavigationTimeout(15_000); // Wall-clock startup in Ubuntu. Projection timings use the fake clock.
      await page.clock.install({ time });
      await page.clock.pauseAt(new Date(time.getTime() + 1000));
      await page.route(base + '/**', (route) => {
        if (route.request().url() === base + '/ui.js')
          return route.fulfill({ contentType: 'text/javascript', body: fixture });
        return route.fulfill({
          contentType: 'text/html; charset=utf-8',
          body: `<!doctype html><html lang="zh-Hant"><div id="root"></div>
            <script src="/ui.js"></script></html>`,
        });
      });
      await page.goto(base + '/?screen=admin-live&projection-probe');
      await page.getByRole('button', { name: '回到投影' }).click();
      // Navigation and LiveView's initial effect can finish in different React tasks.
      await page.clock.runFor(1);
      await page.getByRole('region', { name: '投影畫面' }).waitFor();
      await check(page);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  };

  await t.test('每秒更新三種倒數，5 秒更新人數，QR 與數字碼各在換段時更新', () =>
    withProjection(async (page) => {
      const firstQr = await qr(page);
      const firstToken = (await mock(page)).token;
      assert.equal(await countdown(page), '0:42');
      assert.equal(await signed(page), '45／60');

      await page.clock.runFor(999);
      assert.equal(await countdown(page), '0:41');
      assert.equal(await page.locator('.att-proj-qr small').textContent(), 'QR 8 秒後更換');
      assert.equal(await page.locator('.att-proj-code small').textContent(), '11 秒後更換');
      await page.clock.runFor(3999);
      assert.deepEqual((await mock(page)).requests, [0]);
      await page.clock.runFor(1);
      assert.deepEqual((await mock(page)).requests, [0, 5000]);
      assert.equal(await signed(page), '46／60');

      await page.clock.runFor(3999);
      assert.equal(await qr(page), firstQr);
      await page.clock.runFor(1);
      assert.deepEqual((await mock(page)).requests, [0, 5000], '換 QR 不等後端');
      assert.equal((await mock(page)).token, firstToken);
      assert.notEqual(await qr(page), firstQr);
      assert.equal(await code(page), '4 7 2 9');
      await page.clock.runFor(3000);
      assert.deepEqual((await mock(page)).requests, [0, 5000, 10000], '換數字碼不等後端');
      assert.equal(await code(page), '4 7 3 0');
    }));

  await t.test('歸零立即重讀且只在寬限結束後觸發 onEnded', () =>
    withProjection(async (page) => {
      await page.clock.runFor(41999);
      assert.equal(await countdown(page), '0:00');
      assert.equal((await mock(page)).requests.at(-1), 42000);
      await page.clock.runFor(5000);
      assert.equal(await countdown(page), '0:00');
      assert.equal(await page.title(), '');
      await page.clock.runFor(1);
      await page.getByRole('heading', { name: '本筆修改紀錄' }).waitFor();
      assert.equal(await page.title(), '點名已結束，未簽到的記為未到');
      assert.equal((await mock(page)).requests.at(-1), 47001);
    }));

  await t.test('背景暫停計時及 API，回前景立即重讀', () =>
    withProjection(async (page) => {
      await setHidden(page, true);
      assert.deepEqual(await timers(page), []);
      await page.clock.runFor(20000);
      assert.equal(await countdown(page), '0:42');
      assert.deepEqual((await mock(page)).requests, [0]);
      await setHidden(page, false);
      assert.deepEqual((await mock(page)).requests, [0, 20001]);
      assert.equal(await countdown(page), '0:22');
      assert.equal(await signed(page), '49／60');
    }));

  await t.test('前一筆請求未回時，回前景的重讀依序送出', () =>
    withProjection(async (page) => {
      await page.evaluate(() => (window.attendanceFixture.live.delayMs = 12000));
      await page.clock.runFor(4999);
      assert.deepEqual((await mock(page)).requests, [0, 5000]);
      await setHidden(page, true);
      await page.clock.runFor(6000);
      await page.evaluate(() => (window.attendanceFixture.live.delayMs = 0));
      await setHidden(page, false);
      await page.clock.runFor(5999);
      assert.deepEqual((await mock(page)).requests, [0, 5000]);
      await page.clock.runFor(1);
      assert.deepEqual((await mock(page)).requests, [0, 5000, 17000]);
      assert.equal((await mock(page)).maxActive, 1);
    }));

  await t.test('連線失敗保留舊畫面，換段重試成功後移除提示', () =>
    withProjection(async (page) => {
      const firstQr = await qr(page);
      await page.evaluate(() => (window.attendanceFixture.live.rejectNext = true));
      await page.clock.runFor(4999);
      assert.equal(await page.getByRole('status').textContent(), '連線中…');
      assert.equal(await qr(page), firstQr);
      assert.equal(await code(page), '4 7 2 9');
      assert.equal(await signed(page), '45／60');
      await page.clock.runFor(4000);
      assert.deepEqual((await mock(page)).requests, [0, 5000]);
      assert.notEqual(await qr(page), firstQr, '連線失敗仍使用已預取的 QR');
      await page.clock.runFor(1000);
      assert.deepEqual((await mock(page)).requests, [0, 5000, 10000]);
      assert.equal(await page.getByRole('status').count(), 0);
    }));

  await t.test('手動延長與提前結束會立即更新投影', () =>
    withProjection(async (page) => {
      await page.getByRole('button', { name: '延長 1 分鐘' }).click();
      assert.equal(await countdown(page), '1:42');
      await page.getByRole('button', { name: '提前結束' }).click();
      await page.getByRole('heading', { name: '本筆修改紀錄' }).waitFor();
      assert.equal(await page.title(), '點名已結束，未簽到的記為未到');
      assert.equal((await mock(page)).requests.length, 3);
    }));

  await t.test('卸載立即清除計時器，後續時間及切回前景均無請求', () =>
    withProjection(async (page) => {
      assert.deepEqual(await timers(page), ['timeout', 'timeout']);
      await page.evaluate(() => window.attendanceFixture.unmount());
      assert.deepEqual(await timers(page), []);
      await setHidden(page, true);
      await setHidden(page, false);
      await page.clock.runFor(60000);
      assert.deepEqual((await mock(page)).requests, [0]);
    }));
});
