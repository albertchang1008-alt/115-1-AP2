// Local mock data only: captures the same React components used by the student UI.
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/practice-modes-1.7.0-screenshots';
await mkdir(out, { recursive: true });
const bundle = buildSync({
  entryPoints: ['tests/fixtures/practice-modes.tsx'],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
}).outputFiles[0].text;
const css = await readFile('src/style.css', 'utf8'),
  browser = await chromium.launch({ channel: 'chrome' }),
  checks = [];
try {
  for (const [device, width, height] of [
    ['desktop', 1280, 900],
    ['mobile', 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('http://localhost/', (r) =>
      r.fulfill({
        contentType: 'text/html',
        body: '<meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div>',
      }),
    );
    await page.goto('http://localhost/');
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: bundle });
    async function mount(kind) {
      await page.evaluate((kind) => window.practiceTest.mount(kind), kind);
    }
    async function shot(name) {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) throw Error(`${device}/${name}: horizontal overflow`);
      await page.screenshot({ path: `${out}/${name}-${device}.png`, fullPage: true });
      checks.push({ device, name, width, height, overflow });
    }
    await mount('flash');
    await page.getByRole('button', { name: '翻面', exact: true }).waitFor();
    await shot('flashcard-front');
    await page.getByRole('button', { name: 'B. 另一選項', exact: true }).click();
    await page.getByRole('button', { name: '翻面', exact: true }).click();
    await page.getByText('你選的是 B，正解是 A', { exact: true }).waitFor();
    await shot('flashcard-back');
    await mount('wrong');
    await page.getByRole('button', { name: '全部 37 題', exact: true }).waitFor();
    await shot('wrong-choices');
    await page.getByRole('button', { name: '10 題', exact: true }).click();
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: '正確選項', exact: true }).click();
      await page.getByRole('button', { name: '送出答案', exact: true }).click();
      await page
        .getByRole('button', { name: i === 9 ? '查看結果' : '下一題', exact: true })
        .click();
    }
    await page.getByText('已移除 10 題・仍答錯 0 題', { exact: true }).waitFor();
    await shot('wrong-result');
    await mount('today');
    await page
      .getByText('這 37 題今天剛錯，先用閃卡看解析，明天再來重做', { exact: true })
      .waitFor();
    await shot('today-only');
    await mount('mixed');
    await page
      .getByText('已選 3 個分類・共 44 題（待複習 37、今天剛錯 1、未作答 44）', { exact: true })
      .waitFor();
    await shot('mixed-default');
    await page.getByRole('button', { name: '展開血液', exact: true }).click();
    await page.getByLabel('血液第二分類', { exact: false }).uncheck();
    await shot('mixed-partial');
    await page.getByRole('button', { name: '全不選', exact: true }).click();
    await page.getByText('請至少勾選一個分類', { exact: true }).waitFor();
    await shot('mixed-none');
    if (errors.length) throw Error(errors.join('\n'));
    await page.close();
  }
  await writeFile(
    `${out}/checks.json`,
    JSON.stringify(
      { data: 'local synthetic fixture; no production sign-in, reads or writes', checks },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Captured ${checks.length} screenshots; all pages without horizontal overflow or JavaScript errors.`,
  );
} finally {
  await browser.close();
}
