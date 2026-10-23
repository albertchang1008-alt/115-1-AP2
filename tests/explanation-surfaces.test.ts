import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';

test('分析題目詳情、學生公布結果及教師試卷預覽都安全呈現粗體與換行', async () => {
  const bundle = buildSync({ entryPoints: ['tests/fixtures/explanation-surfaces.tsx'], bundle: true, write: false, format: 'iife', platform: 'browser', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' } }).outputFiles[0].text;
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const surface of ['analysis', 'student', 'teacher']) {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => route.request().url() === 'http://explanation.test/'
        ? route.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }) : route.abort());
      await page.goto('http://explanation.test/');
      await page.addStyleTag({ content: readFileSync('src/style.css', 'utf8').replace(/@import[^;]+;/g, '') });
      await page.addScriptTag({ content: bundle });
      await page.evaluate(kind => (window as any).explanationSurfaceTest.mount(kind), surface);
      if (surface === 'analysis') await page.getByRole('button', { name: 'render-safety-question', exact: true }).click();
      if (surface === 'student') await page.getByRole('button', { name: '查看交卷狀態', exact: true }).click();
      if (surface === 'teacher') await page.getByRole('button', { name: '教師試卷預覽', exact: true }).click();
      const explanation = page.locator('p.preserve-lines').filter({ hasText: '第一段' });
      await explanation.waitFor();
      assert.deepEqual(await explanation.locator('strong').allTextContents(), ['第一段', '末段'], surface);
      assert((await explanation.innerText()).startsWith('第一段\n第二行\n第三行\n末段 **未配對'), surface);
      assert.equal(await explanation.evaluate(node => getComputedStyle(node).whiteSpace), 'pre-wrap', surface);
      assert.equal(await explanation.locator('script,img,br').count(), 0, surface);
      assert((await explanation.textContent())!.includes('<script>window.injectionRan=true</script>'), surface);
      assert.equal(await page.evaluate(() => (window as any).injectionRan), undefined, surface);
      assert.deepEqual(errors, [], surface);
      const calls = await page.evaluate(() => (window as any).explanationSurfaceTest.calls as string[]);
      assert(calls.every(name => ['getReports', 'getBank', 'getAssessments', 'startAssessment', 'previewAssessment'].includes(name)));
      console.log('PASS explanation surface: ' + surface + ' / strong + br + escaped HTML + no execution');
      await page.close();
    }
  } finally { await browser.close(); }
});
