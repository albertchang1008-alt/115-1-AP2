import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import { resolveChapterUnit } from '../src/ChapterUnitPicker';
import type { Course } from '../shared/model';

test('兩層選單處理無題庫的單元及舊課程，不改寫來源資料', () => {
  const c = { units: [{ id: 'u', title: '分類', group: '單元' }], chapters: { empty: { title: '空單元' } }, chapterOrder: ['empty', '單元'] } as unknown as Course;
  const before = JSON.stringify(c);
  assert.deepEqual(resolveChapterUnit(c, { chapterName: '', unitId: '' }), { chapterName: 'empty', unitId: '' });
  assert.deepEqual(resolveChapterUnit(c, { chapterName: '單元', unitId: 'removed' }), { chapterName: '單元', unitId: 'u' });
  assert.deepEqual(resolveChapterUnit(c, { chapterName: '', unitId: 'u' }, true), { chapterName: '', unitId: 'all' });
  assert.deepEqual(resolveChapterUnit({ units: [] } as unknown as Course, { chapterName: 'removed', unitId: 'u' }), { chapterName: '', unitId: '' });
  assert.equal(JSON.stringify(c), before);
});

test('題庫／報表兩層連動、換單元重設及清空資料，研究選單依看板順序分組', async () => {
  const bundle = buildSync({ entryPoints: ['tests/fixtures/chapter-unit-picker.tsx'], bundle: true, write: false, format: 'iife', platform: 'browser', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' } }).outputFiles[0].text;
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('http://picker.test/', r => r.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }));
    await page.goto('http://picker.test/');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => (window as any).pickerTest.mount('bank'));
    const chapter = page.getByLabel('單元', { exact: true }), unit = page.getByLabel('次單元', { exact: true });
    await chapter.waitFor();
    assert.deepEqual(await chapter.locator('option').allTextContents(), ['心臟II', '血液', '尚無題庫']);
    assert.equal(await chapter.inputValue(), 'B');
    assert.deepEqual(await unit.locator('option').allTextContents(), ['心輸出量', '血壓測量']);
    await page.getByRole('button', { name: '讀取已連接版本' }).click();
    await page.getByText('已載入 b1', { exact: false }).waitFor();
    await unit.selectOption('b2');
    assert.equal(await page.locator('.questionpreview').count(), 0);
    assert(await page.getByText('version-b2', { exact: true }).isVisible());
    await page.getByRole('button', { name: '讀取已連接版本' }).click();
    await page.getByText('已載入 b2', { exact: false }).waitFor();
    assert.deepEqual(await page.evaluate(() => (window as any).pickerTest.calls.filter((c: any) => c.name === 'getBank').map((c: any) => [c.data.unitId, c.data.version])), [['b1','version-b1'],['b2','version-b2']]);
    await chapter.selectOption('A');
    assert.equal(await unit.inputValue(), 'a1');
    assert.deepEqual(await unit.locator('option').allTextContents(), ['血液成分與血漿']);
    assert.equal(await page.locator('.questionpreview').count(), 0);
    await chapter.selectOption('B');
    assert.equal(await unit.inputValue(), 'b1', '回到原單元也重設為第一個次單元');
    await chapter.selectOption('empty');
    assert(await unit.isDisabled());
    assert(await page.getByRole('button', { name: '讀取已連接版本' }).isDisabled());

    await page.evaluate(() => (window as any).pickerTest.mount('analysis'));
    await page.waitForFunction(() => (window as any).pickerTest.pending.length === 1);
    assert.equal(await chapter.inputValue(), '');
    assert(await unit.isDisabled());
    await page.evaluate(() => (window as any).pickerTest.resolve(0));
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 3);
    await chapter.selectOption('B');
    await page.waitForFunction(() => (window as any).pickerTest.pending.length === 2);
    assert.equal(await unit.inputValue(), 'b1');
    assert.equal(await page.locator('tbody tr').count(), 0, '換單元立即清空已載入資料');
    await page.evaluate(() => (window as any).pickerTest.resolve(1));
    await page.getByRole('button', { name: 'question-b1', exact: true }).waitFor();
    await unit.selectOption('b2');
    assert(await page.getByRole('button', { name: 'question-b2', exact: true }).isVisible());
    await chapter.selectOption('A');
    await page.waitForFunction(() => (window as any).pickerTest.pending.length === 3);
    assert.equal(await unit.inputValue(), 'a1');
    await chapter.selectOption('');
    await page.waitForFunction(() => (window as any).pickerTest.pending.length === 4);
    assert(await unit.isDisabled());
    await page.evaluate(() => (window as any).pickerTest.resolve(3));
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 3);
    await page.evaluate(() => (window as any).pickerTest.resolve(2, []));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('tbody tr').count(), 3, '較晚回來的舊請求不得覆蓋新選擇');
    assert((await page.evaluate(() => (window as any).pickerTest.calls.filter((c: any) => c.name === 'getReports').every((c: any) => c.data.courseId === 'picker-test' && c.data.classId === 'A' && !('unitId' in c.data)))));

    await page.evaluate(() => (window as any).pickerTest.mount('research'));
    await page.getByText('HTML→題庫解析研究資料', { exact: true }).waitFor();
    assert.deepEqual(await unit.locator('optgroup').evaluateAll(groups => groups.map(g => (g as HTMLOptGroupElement).label)), ['心臟II', '血液']);
    assert.deepEqual(await unit.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value)), ['b1','b2','a1']);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
