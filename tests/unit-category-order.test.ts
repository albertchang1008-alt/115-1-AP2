import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { chromium, type Locator, type Page } from 'playwright';
import type { Course } from '../shared/model';

declare global {
  interface Window {
    categoryOrderTest: { course: Course; saved(): Course; published(): Promise<Course>; mount(view: string): Promise<void> };
  }
}

const bundle = buildSync({
  entryPoints: ['tests/fixtures/unit-category-order.tsx'],
  bundle: true, write: false, format: 'esm', platform: 'browser', jsx: 'automatic',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
}).outputFiles[0].text;
const css = readFile(new URL('../src/style.css', import.meta.url), 'utf8');
const ids = ['overview', 'heart', 'mouth', 'exam', 'swallow', 'stomach'];
const titles = ['總覽', '口腔', '咽吞嚥', '胃'];

async function openEditor(page: Page, legacy = false) {
  page.setDefaultTimeout(8_000);
  await page.route('**/*', (route) => new URL(route.request().url()).hostname === 'category-order.test'
    ? route.fulfill({ contentType: 'text/html', body: '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>' })
    : route.abort());
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto('http://category-order.test/' + (legacy ? '?legacy' : ''));
  await page.addStyleTag({ content: await css });
  await page.addScriptTag({ type: 'module', content: bundle });
  await page.getByRole('heading', { name: '題目分類（來自 Sheet 次單元）' }).waitFor();
  await page.getByRole('button', { name: '更新到學生端', exact: true }).and(page.locator(':enabled')).waitFor();
}

const order = (page: Page) => page.locator('.classification-row strong').allTextContents();
const move = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function assertMoveButtonsFit(list: Locator) {
  const dimensions = await list.evaluate((element) => {
    const doc = element.ownerDocument.documentElement;
    const bounds = element.getBoundingClientRect();
    const controls = [...element.querySelectorAll('button')].map((button) => button.getBoundingClientRect());
    return { heights: controls.map(({ height }) => height), fit: doc.scrollWidth <= doc.clientWidth &&
      controls.every(({ left, right }) => left >= bounds.left && right <= bounds.right) };
  });
  assert.equal(dimensions.heights.length, 8);
  assert(dimensions.heights.every((h) => h >= 44), JSON.stringify(dimensions));
  assert(dimensions.fit, JSON.stringify(dimensions));
}

test('後台分類排序、首尾、欄位、發布與學生端及完成度明細', async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : undefined);
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openEditor(page);
    assert.deepEqual(await order(page), ['口腔', '咽吞嚥', '胃', '總覽']);
    assert(await move(page, '上移 口腔').isDisabled());
    assert(await move(page, '下移 總覽').isDisabled());
    assert(await move(page, '下移 口腔').isEnabled());

    await move(page, '上移 總覽').click();
    assert.deepEqual(await order(page), ['口腔', '咽吞嚥', '總覽', '胃']);
    await move(page, '下移 總覽').click();
    assert.deepEqual(await order(page), ['口腔', '咽吞嚥', '胃', '總覽']);
    for (let i = 0; i < 3; i++) await move(page, '上移 總覽').click();
    assert.deepEqual(await order(page), titles);
    assert(await move(page, '上移 總覽').isDisabled());
    assert(await move(page, '下移 胃').isDisabled());
    assert.equal(await page.locator('.classification-row').getByText('有修改未更新', { exact: true }).count(), 4);

    const list = page.locator('.classification-list');
    const evidence = process.env.UNIT_CATEGORY_ORDER_EVIDENCE;
    for (const [width, height] of [[390, 844], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      await assertMoveButtonsFit(list);
      if (evidence) await list.screenshot({ path: path.join(evidence, `admin-${width}.png`) });
      await page.evaluate(() => document.documentElement.style.setProperty('--font-scale', '1.3'));
      await assertMoveButtonsFit(list);
      await page.evaluate(() => document.documentElement.style.removeProperty('--font-scale'));
    }

    await page.locator('.unitmenu').getByRole('button', { name: /^循環系統/ }).click();
    assert.deepEqual(await order(page), ['心臟']);
    assert(await move(page, '上移 心臟').isDisabled());
    assert(await move(page, '下移 心臟').isDisabled());
    await page.locator('.unitmenu').getByRole('button', { name: /^複習考/ }).click();
    assert(await page.getByRole('heading', { name: '複習考題目池' }).isVisible());
    assert.equal(await page.locator('.classification-row button').count(), 0);

    await move(page, '保存草稿').click();
    await page.getByText('草稿已保存 · 單元設定').waitFor();
    const { before, saved, published } = await page.evaluate(async () => {
      const test = window.categoryOrderTest;
      return { before: test.course, saved: test.saved(), published: await test.published() };
    });
    const expectedCourse = { ...before, units: ids.map(id => before.units.find(u => u.id === id)), revision: saved.revision };
    assert.deepEqual(saved, expectedCourse);
    assert.deepEqual(published.units, before.units);
    await move(page, '更新到學生端').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByText('單元：新增 0、修改 4、移除 0', { exact: true }).waitFor();
    await dialog.getByRole('button', { name: '確定更新到學生端' }).click();
    await dialog.waitFor({ state: 'detached' });
    const updated = await page.evaluate(() => window.categoryOrderTest.published());
    const { publishedAt, revision, ...remaining } = updated;
    assert(publishedAt);
    assert.deepEqual({ ...remaining, revision: saved.revision }, expectedCourse);

    await page.evaluate(() => window.categoryOrderTest.mount('student'));
    const card = page.locator('.progress-unit').filter({ has: page.getByRole('heading', { name: '消化系統', exact: true }) });
    await card.getByRole('button', { name: '展開消化系統' }).click();
    assert.deepEqual((await card.locator('.progress-item strong').allTextContents()).filter(title => titles.includes(title)), titles);
    await card.getByRole('button', { name: /還沒達標：總覽/ }).click();
    const practice = page.locator('.practice-row-title strong');
    await practice.first().waitFor();
    assert.deepEqual(await practice.allTextContents(), titles);
    assert.equal(await page.locator('.practice-row .practice-full').count(), 4);

    await page.evaluate(() => window.categoryOrderTest.mount('completion'));
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await page.getByRole('button', { name: '更新', exact: true }).click();
    await page.getByRole('checkbox', { name: /未開始/ }).check();
    const matrix = page.getByRole('table', { name: 'A學生單元矩陣' });
    await matrix.getByRole('button', { name: /消化系統：/ }).click();
    const categories = page.locator('.completion-category-list h4');
    await categories.first().waitFor();
    assert.deepEqual(await categories.allTextContents(), titles);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('未顯式設定 chapters 的舊課程調整首項時保留原章節設定', async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : undefined);
  try {
    const page = await browser.newPage();
    await openEditor(page, true);
    for (let i = 0; i < 3; i++) await move(page, '上移 總覽').click();
    await move(page, '保存草稿').click();
    await page.getByText('草稿已保存 · 單元設定').waitFor();
    const saved = await page.evaluate(() => window.categoryOrderTest.saved());
    assert.deepEqual(saved.units.map(u => u.id), ids);
    assert.equal(saved.chapters?.消化系統.threshold, 75);
    assert.equal(saved.chapters?.消化系統.description, '舊章節說明');
    assert.deepEqual(saved.chapterOrder, ['消化系統', '循環系統', '複習考']);
  } finally {
    await browser.close();
  }
});
