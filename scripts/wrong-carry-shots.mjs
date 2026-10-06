// Actual teacher React UI, synthetic data; no live Firestore or Sheet.
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/practice-modes-1.7.0-screenshots';
await mkdir(out, { recursive: true });
const bundle = buildSync({
  entryPoints: ['tests/fixtures/wrong-carry-sync.tsx'],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
}).outputFiles[0].text;
const browser = await chromium.launch({ channel: 'chrome' }),
  checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('http://localhost/', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }),
  );
  await page.goto('http://localhost/');
  await page.addStyleTag({ content: await readFile('src/style.css', 'utf8') });
  await page.addScriptTag({ content: bundle });
  await page.evaluate(() => window.carryTest.mount());
  const checkbox = page.getByRole('checkbox', {
    name: '這次改版後，錯題全部重新計算',
    exact: true,
  });
  await checkbox.waitFor();
  if (await checkbox.isChecked()) throw Error('default should be unchecked');
  async function shot(name) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw Error('overflow');
    await page.screenshot({ path: `${out}/${name}-desktop.png`, fullPage: true });
    checks.push({ name, width: 1280, height: 1000, overflow });
  }
  await shot('sync-checkbox');
  await page.getByRole('button', { name: '同步題庫', exact: true }).click();
  await page
    .getByText('錯題延續：保留 37 題，重置 3 題（正解改變 2、刪除 1）', { exact: false })
    .waitFor();
  await shot('sync-carry');
  await checkbox.check();
  await page.getByRole('button', { name: '同步題庫', exact: true }).click();
  await page.getByText('錯題已全部重新計算', { exact: false }).waitFor();
  await shot('sync-reset');
  await checkbox.uncheck();
  await page.evaluate(() => window.carryTest.setMode('failed'));
  await page.getByRole('button', { name: '同步題庫', exact: true }).click();
  await page.getByText('舊版題庫讀取失敗，錯題重新計算', { exact: false }).waitFor();
  await shot('sync-failed');
  if (errors.length) throw Error(errors.join('\n'));
  await writeFile(
    `${out}/wrong-carry-checks.json`,
    JSON.stringify({ checks, errors }, null, 2) + '\n',
  );
} finally {
  await browser.close();
}
