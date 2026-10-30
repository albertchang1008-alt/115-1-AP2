import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';
export async function verifyUpdateBanner(out) {
  const current = fs.readFileSync('VERSION', 'utf8').trim(),
    next = current.replace(/\.(\d+)$/, (_m, patch) => `.${Number(patch) + 1}`);
  assert.notEqual(next, current, 'next deployment must differ for patch releases too');
  async function bundle(version) {
    const output = (
      await build({
        entryPoints: ['tests/fixtures/update-banner.tsx'],
        bundle: true,
        write: false,
        outfile: 'app.js',
        format: 'iife',
        platform: 'browser',
        define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
        plugins: [
          {
            name: 'deployment-version',
            setup(build) {
              build.onLoad({ filter: /\/shared\/version\.ts$/ }, () => ({
                contents: `export const VERSION=${JSON.stringify(version)};`,
                loader: 'ts',
              }));
            },
          },
        ],
      })
    ).outputFiles;
    return {
      js: output.find((x) => x.path.endsWith('.js')).text,
      css: output.find((x) => x.path.endsWith('.css')).text,
    };
  }
  const bundles = { [current]: await bundle(current), [next]: await bundle(next) };
  let deployed = current,
    fail = false,
    documents = 0,
    requests = [];
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/course/version.json')) {
      requests.push({ url: req.url, cache: req.headers['cache-control'] });
      if (fail) {
        res.writeHead(503);
        res.end('offline');
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ version: deployed }));
      return;
    }
    if (req.url === '/course/') {
      documents++;
      res.setHeader('Content-Type', 'text/html');
      res.end(
        `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${bundles[deployed].css}</style><div id="root"></div><script>${bundles[deployed].js}</script>`,
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/course/`,
    browser = await chromium.launch({ channel: 'chrome' }),
    errors = [],
    checks = [];
  if (out) fs.mkdirSync(out, { recursive: true });
  const shot = async (page, name) => {
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      name + ' overflow',
    );
    if (out) {
      await new Promise((r) => setTimeout(r, 250));
      await page.screenshot({ path: path.join(out, name + '.png'), animations: 'disabled' });
    }
  };
  async function fresh(width = 1920, height = 1080) {
    const p = await browser.newPage({ viewport: { width, height } });
    p.on('pageerror', (e) => errors.push(e.message));
    await p.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
    await p.clock.install({ time: new Date('2026-10-30T08:45:00+08:00') });
    await p.clock.pauseAt(new Date('2026-10-30T08:45:01+08:00'));
    const initial = p.waitForResponse((r) => r.url().includes('/version.json'));
    await p.goto(url);
    await initial;
    await p.getByRole('heading', { name: '課程總覽', exact: true }).waitFor();
    await p.waitForFunction(() => document.querySelector('strong')?.textContent);
    return p;
  }
  const foreground = (page) =>
    page.evaluate(() => {
      window.__hidden = false;
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__hidden });
      document.dispatchEvent(new Event('visibilitychange'));
    });
  try {
    let page = await fresh();
    await page.waitForFunction(() => document.readyState === 'complete');
    assert.equal(await page.getByRole('complementary', { name: '平台新版提示' }).count(), 0);
    let count = requests.length;
    await foreground(page);
    await page.evaluate(() => dispatchEvent(new Event('online')));
    await page.clock.runFor(1);
    assert.equal(requests.length, count);
    checks.push('相同版本不顯示、同分鐘前景／online節流');
    await page.evaluate(() => {
      window.__hidden = true;
    });
    await page.clock.runFor(1800000);
    assert.equal(requests.length, count);
    checks.push('背景30分鐘不抓取');
    deployed = next;
    await foreground(page);
    const ready = page.getByRole('button', { name: '平台已更新，點這裡載入新版', exact: true });
    await ready.waitFor();
    assert.equal(requests.length, count + 1);
    assert.ok(requests.at(-1).url.includes('_='));
    await page.getByRole('button', { name: '暫時關閉新版提示' }).click();
    assert.equal(await ready.count(), 0);
    await foreground(page);
    await ready.waitFor();
    assert.equal(requests.length, count + 1);
    checks.push('關閉後下次前景重現、不繞過節流');
    await shot(page, '01-normal-1920');
    const before = documents;
    await ready.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction((v) => document.querySelector('strong')?.textContent === v, next);
    assert.equal(documents, before + 1);
    assert.equal(await ready.count(), 0);
    checks.push('鍵盤點擊手動reload後確實載入新版bundle');
    count = requests.length;
    const periodic = page.waitForResponse((r) => r.url().includes('/version.json'));
    await page.clock.runFor(1800000);
    await periodic;
    assert.equal(requests.length, count + 1);
    checks.push('前景30分鐘定時檢查');
    await page.close();
    deployed = current;
    page = await fresh();
    await page.clock.runFor(61000);
    await page.evaluate(() => window.bannerFixture.setView('quiz'));
    await page.getByRole('heading', { name: /示範題：/ }).waitFor();
    await page.getByRole('radio').first().click();
    deployed = next;
    await foreground(page);
    const blocked = page.getByRole('button', { name: '平台已更新，交卷後再載入新版', exact: true });
    await blocked.waitFor();
    assert.equal(await blocked.isDisabled(), true);
    assert.equal(await page.getByRole('radio').first().isChecked(), true);
    const n = documents;
    await blocked.evaluate((el) => el.click());
    assert.equal(documents, n);
    await shot(page, '02-answering-1920');
    const submit = page.getByRole('button', { name: '完成並提交', exact: true });
    await submit.click();
    assert.equal(await blocked.isDisabled(), true, '儲存中仍不可reload');
    await page.clock.runFor(600);
    await page.getByRole('button', { name: '平台已更新，點這裡載入新版', exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole('button', { name: '平台已更新，點這裡載入新版', exact: true })
        .isEnabled(),
      true,
    );
    assert.equal(documents, n);
    checks.push('交卷保存完成才解鎖，無自動reload');
    for (const mode of ['review', 'flash', 'practice', 'assessment', 'interaction']) {
      await page.evaluate((v) => window.bannerFixture.setView(v), mode);
      if (mode === 'assessment')
        await page.getByRole('button', { name: '繼續原作答', exact: true }).click();
      await blocked.waitFor();
      assert.equal(await blocked.isDisabled(), true, mode);
      await page.evaluate(() => window.bannerFixture.setView('home'));
      await page.getByRole('button', { name: '平台已更新，點這裡載入新版', exact: true }).waitFor();
      assert.equal(
        await page
          .getByRole('button', { name: '平台已更新，點這裡載入新版', exact: true })
          .isEnabled(),
        true,
        mode + ' exit',
      );
    }
    checks.push('複習考、閃卡、錯題／綜合共用練習、正式評量、課堂互動進行中皆保護');
    await page.close();
    deployed = current;
    page = await fresh(390, 844);
    await page.clock.runFor(61000);
    deployed = next;
    await foreground(page);
    await page.getByRole('button', { name: '平台已更新，點這裡載入新版', exact: true }).waitFor();
    await shot(page, '03-normal-390');
    await page.evaluate(() => window.bannerFixture.setView('quiz'));
    await page.getByRole('heading', { name: /示範題：/ }).waitFor();
    await page.getByRole('radio').first().click();
    await page.getByRole('button', { name: '平台已更新，交卷後再載入新版', exact: true }).waitFor();
    await shot(page, '04-answering-390');
    const bannerBox = await page.getByRole('complementary', { name: '平台新版提示' }).boundingBox(),
      top = await page.locator('.quiz-topbar').boundingBox(),
      submitMobile = page.getByRole('button', { name: '完成並提交', exact: true }),
      bottom = await submitMobile.boundingBox();
    assert.ok(top.y >= bannerBox.y + bannerBox.height - 1);
    assert.ok(bottom.y >= bannerBox.y + bannerBox.height && bottom.y + bottom.height <= 844);
    checks.push('390提示不遮上方返回與底部提交、答案保留');
    await page.close();
    fail = true;
    deployed = current;
    page = await fresh();
    await page.clock.runFor(10);
    assert.equal(await page.getByRole('complementary', { name: '平台新版提示' }).count(), 0);
    await page.clock.runFor(61000);
    fail = false;
    deployed = next;
    await page.evaluate(() => dispatchEvent(new Event('online')));
    await page.getByRole('button', { name: '平台已更新，點這裡載入新版', exact: true }).waitFor();
    checks.push('失敗靜默、online恢復後再檢查');
    await page.close();
    assert.deepEqual(errors, []);
    const result = {
      pass: true,
      current,
      next,
      checks,
      errors,
      versionRequests: requests.length,
      documents,
      requestExample: requests[0],
      autoReload: false,
    };
    if (out)
      fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
    return result;
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--out');
  console.log(
    JSON.stringify(await verifyUpdateBanner(i >= 0 ? process.argv[i + 1] : undefined), null, 2),
  );
}
