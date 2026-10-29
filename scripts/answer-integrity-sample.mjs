import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import { seedSample, readSample } from './answer-integrity-sample/seed.mjs';
const out = path.resolve(
  process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1]
    : '/tmp/answer-integrity-sample',
);
fs.mkdirSync(out, { recursive: true });
await seedSample();
const initial = await readSample();
assert.equal(initial.source, 'emulator');
assert.equal(initial.attempts.length, 11);
const bundle = buildSync({
  entryPoints: ['tests/fixtures/answer-integrity-sample.tsx'],
  bundle: true,
  write: false,
  outfile: 'sample.js',
  format: 'iife',
  platform: 'browser',
  define: { 'process.env.NODE_ENV': '"development"' },
}).outputFiles;
const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405);
    res.end();
    return;
  }
  const headers = { 'Cache-Control': 'no-store' };
  if (req.url === '/sample-data') {
    res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(await readSample()));
  } else if (req.url === '/') {
    res.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>作答統計與離開提示｜樣張</title><link rel="stylesheet" href="/sample.css"><div id="root"></div><script src="/sample.js"></script></html>',
    );
  } else {
    const f = bundle.find((f) => path.basename(f.path) === req.url?.slice(1));
    if (!f) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      ...headers,
      'Content-Type': req.url.endsWith('.css') ? 'text/css' : 'text/javascript',
    });
    res.end(f.contents);
  }
});
await new Promise((resolve) =>
  server.listen(process.argv.includes('--serve') ? 4180 : 0, '127.0.0.1', resolve),
);
const url = `http://127.0.0.1:${server.address().port}/`;
if (process.argv.includes('--serve')) console.log(`樣張：${url}（僅本機；Ctrl+C 停止）`);
else {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
    await page.goto(url);
    await page.getByRole('heading', { name: '示範學生 01', exact: true }).waitFor();
    await page.getByText('平均每題 30 秒', { exact: true }).waitFor();
    await page.getByText('第一次作答平均每題 32 秒', { exact: true }).waitFor();
    await page.getByText('離開畫面 1 次（共 8 秒）', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, '01-student-profile-1920.png') });
    await page.getByRole('button', { name: '全班總覽', exact: true }).click();
    await page.getByRole('heading', { name: '全班作答時間' }).waitFor();
    await page.getByText('29 秒', { exact: true }).waitFor();
    const flag = page.getByRole('button', { name: '⚠ 時間偏短', exact: true });
    assert.equal(await flag.count(), 1);
    await flag.hover();
    await page.getByRole('tooltip').waitFor({ state: 'visible' });
    assert((await page.getByRole('tooltip').innerText()).includes('僅供查看，不代表作弊'));
    await page.screenshot({ path: path.join(out, '02-class-overview-1920.png') });
    await page.getByRole('button', { name: '學生離開提示', exact: true }).click();
    const prompt = page.getByRole('dialog', { name: '離開作答畫面提示' });
    await prompt.getByRole('heading', { name: '你已離開作答畫面 1 次', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: '全班作答時間' }).count(), 0);
    await page.screenshot({ path: path.join(out, '03-student-return-prompt-1920.png') });
    await prompt.getByRole('button', { name: '繼續作答' }).click();
    await page.getByLabel('示範情境').selectOption('four');
    await prompt.getByRole('heading', { name: '你已離開作答畫面 4 次', exact: true }).waitFor();
    await prompt.getByText(/依目前紀錄，本次將不列入最高有效分數與達標/).waitFor();
    await prompt.getByRole('button', { name: '繼續作答' }).click();
    await page.getByRole('button', { name: '無效作答結果', exact: true }).click();
    await page.getByRole('heading', { name: '本次作答結果' }).waitFor();
    await page.getByText('80 分', { exact: true }).waitFor();
    await page.getByText('本次不列入成績', { exact: true }).waitFor();
    await page.getByRole('button', { name: '再作答一次' }).waitFor();
    await page.screenshot({ path: path.join(out, '04-invalid-result-1920.png') });
    await page.getByRole('button', { name: '查看本次解析' }).click();
    await page.getByRole('heading', { name: '本次解析（示範）' }).waitFor();
    await page.getByRole('button', { name: '再作答一次' }).click();
    await prompt.waitFor({ state: 'detached' });
    await page.getByText('已離開 0 次 · 累計 0 秒', { exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('示範情境').selectOption('one');
    await prompt.waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await prompt.getByRole('button', { name: '繼續作答' }).click();
    assert.deepEqual(await readSample(), initial, '樣張操作不得改寫原始假作答');
    assert.deepEqual(errors, []);
    const result = {
      pass: true,
      project: process.env.GCLOUD_PROJECT,
      source: 'Firestore Emulator',
      fakeAttempts: 11,
      cohortStudents: 4,
      medianSeconds: 29,
      flagged: 1,
      screenshots: [
        '01-student-profile-1920.png',
        '02-class-overview-1920.png',
        '03-student-return-prompt-1920.png',
        '04-invalid-result-1920.png',
      ],
      checks: [
        '個人檔案平均與首次秒數',
        '離開次數新行',
        '排除test班與複習考／其他模式',
        '全班中位數29秒',
        '僅一筆偏快標記',
        'tooltip不代表作弊',
        '學生畫面不顯示教師總覽',
        '離開1次提示',
        '離開4次將不列成績',
        '無效100分仍保留舊80分',
        '可看解析及再作答',
        '390寬提示不溢出',
        'Emulator原資料不變',
        '無瀏覽器例外',
      ],
    };
    fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
