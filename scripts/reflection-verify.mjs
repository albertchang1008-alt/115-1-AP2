import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
export async function verifyReflection(screenshots = false) {
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
  const f = require('../functions/lib/functions/src/index.js');
  const helper = require('../functions/tests/helpers/reflection-memory.cjs');
  const model = require('../functions/lib/shared/model.js');
  const bundle = buildSync({
    entryPoints: ['tests/fixtures/reflection.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  }).outputFiles[0].text;
  const css = await fs.readFile('src/style.css', 'utf8'),
    out = 'docs/reflection-activity-1.8.0-screenshots';
  if (screenshots) await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' }),
    results = [];
  try {
    for (const width of [1280, 390]) {
      const ctx = helper.memoryDb(),
        fixture = helper.seed(ctx);
      fixture.course.chapters['心臟基礎'].activities = [];
      ctx.data.get('courses/reflection-test').draft = structuredClone(fixture.course);
      ctx.data.get('courses/reflection-test').published = structuredClone(fixture.course);
      const page = await browser.newPage({
          viewport: { width, height: 950 },
          acceptDownloads: true,
        }),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('https://reflection.test/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.startsWith('/api/')) {
          const name = path.slice(5),
            { data, role } = JSON.parse(route.request().postData());
          try {
            const result = await f[name].run({ auth: helper.auth(role), data });
            await route.fulfill({ contentType: 'application/json', body: JSON.stringify(result) });
          } catch (e) {
            await route.fulfill({
              status: 400,
              contentType: 'application/json',
              body: JSON.stringify({ error: e.message }),
            });
          }
          return;
        }
        await route.fulfill({
          contentType: 'text/html',
          body: '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>',
        });
      });
      await page.goto('https://reflection.test/');
      await page.addStyleTag({ content: css });
      await page.evaluate((c) => (window.reflectionSeed = c), fixture.course);
      await page.addScriptTag({ content: bundle });
      const shot = async (name) => {
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
          `${width}/${name}: horizontal overflow`,
        );
        if (screenshots)
          await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
      };
      const mount = async (view, next) => {
        const instance = await page.evaluate(
          ([v, c]) => window.reflectionTest.mount(v, c),
          [view, next],
        );
        await page.locator(`[data-reflection-instance="${instance}"]`).waitFor();
      };
      try {
        // Actual CourseEditor -> saveCourse -> publishCourse.
        await page.getByRole('button', { name: '新增活動', exact: true }).first().click();
        const dialog = page.getByRole('dialog', { name: '新增活動' });
        await dialog.getByRole('radio', { name: '課後練習' }).click();
        await dialog.locator('select').first().selectOption('reflection');
        await dialog.locator('select').last().selectOption('true');
        await dialog.getByRole('button', { name: '建立', exact: true }).click();
        const editor = page.getByRole('region', { name: '反思題目編輯器' });
        await editor.waitFor();
        assert.equal(await editor.locator('fieldset').count(), 3);
        const originalIds = await editor.locator('code').allTextContents();
        await editor.getByRole('button', { name: '第1題下移', exact: true }).click();
        assert.deepEqual(await editor.locator('code').allTextContents(), [
          originalIds[1],
          originalIds[0],
          originalIds[2],
        ]);
        await editor.getByRole('button', { name: '第2題上移', exact: true }).click();
        await editor.getByRole('button', { name: '新增反思題目', exact: true }).click();
        assert.equal(await editor.locator('fieldset').count(), 4);
        await editor.getByRole('button', { name: '刪除第4題', exact: true }).click();
        await page
          .getByRole('dialog', { name: '變更反思題目警告' })
          .getByRole('button', { name: '確認變更', exact: true })
          .click();
        assert.equal(await editor.locator('fieldset').count(), 3);
        await editor.getByRole('button', { name: '套用課後反思範本' }).click();
        await page
          .getByRole('dialog', { name: '變更反思題目警告' })
          .getByRole('button', { name: '確認變更', exact: true })
          .click();
        assert.deepEqual(await editor.locator('code').allTextContents(), originalIds);
        assert.equal(await editor.locator('input[value="concept-change"]').count(), 0);
        await editor.getByLabel('第1題字數上限', { exact: true }).fill('30');
        await page.getByRole('button', { name: '發布課程', exact: true }).click();
        await page.waitForFunction(() => window.reflectionTest.notices.includes('課程已發布'));
        const published = ctx.data.get('courses/reflection-test').published;
        assert.equal(published.chapters['心臟基礎'].activities[0].type, 'reflection');
        await shot('teacher-editor');
        // Student UI through real Student route, with callable test double.
        await mount('student', published);
        const text = page.getByRole('textbox', {
          name: published.chapters['心臟基礎'].activities[0].reflection.prompts[0].text,
        });
        const submit = page.getByRole('button', { name: '送出反思', exact: true });
        await submit.waitFor();
        await page.waitForFunction(() => !document.querySelector('button[type=submit]').disabled);
        await submit.click();
        await page.getByRole('alert').filter({ hasText: '請回答必做題' }).waitFor();
        await text.fill('a'.repeat(40));
        assert.equal((await text.inputValue()).length, 30);
        await text.fill('原本我只背答案，現在理解血流方向');
        await page.getByRole('button', { name: '案例討論', exact: true }).click();
        await shot('student-draft');
        await page.evaluate(() => window.reflectionTest.setFail(true));
        await submit.click();
        await page.getByRole('alert').filter({ hasText: '測試網路中斷' }).waitFor();
        assert.equal(await text.inputValue(), '原本我只背答案，現在理解血流方向');
        // Remount recovers local draft and never assumes a failed submit completed the activity.
        await mount('student', published);
        await text.waitFor();
        assert.equal(await text.inputValue(), '原本我只背答案，現在理解血流方向');
        assert.equal(
          ctx.data.has(
            'courses/reflection-test/reflections/chapter:心臟基礎_' +
              published.chapters['心臟基礎'].activities[0].id +
              '/responses/student-uid',
          ),
          false,
        );
        await page.evaluate(() => window.reflectionTest.setFail(false));
        await page.waitForFunction(() => !document.querySelector('button[type=submit]').disabled);
        await submit.click();
        await page.getByRole('button', { name: '修改', exact: true }).waitFor();
        await shot('student-submitted');
        await page.getByRole('button', { name: '返回單元', exact: true }).click();
        const completedCard = page.getByRole('button', {
          name: '課後反思，反思，必做，已完成',
          exact: true,
        });
        await completedCard.waitFor();
        await shot('student-completion');
        await completedCard.click();
        await page.getByRole('button', { name: '修改', exact: true }).waitFor();

        const key = 'chapter:心臟基礎_' + published.chapters['心臟基礎'].activities[0].id;
        assert(
          ctx.data.get('courses/reflection-test/progress/student-uid').activities[key].completed,
        );
        await page.getByRole('button', { name: '修改', exact: true }).click();
        await text.fill('原本以為一樣，現在知道肺體循環不同');
        await submit.click();
        await page.getByRole('button', { name: '修改', exact: true }).waitFor();
        assert.equal(
          ctx.data.get('courses/reflection-test/reflections/' + key + '/responses/student-uid')
            .editCount,
          1,
        );
        const locked = structuredClone(published);
        locked.chapters['心臟基礎'].dueAt = '2000-01-01T23:59';
        await mount('student', locked);
        await page.getByText('單元已截止，只能查看。', { exact: true }).waitFor();
        await page.getByText('原本以為一樣，現在知道肺體循環不同', { exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: '修改', exact: true }).count(), 0);
        await shot('student-readonly');
        const noEdit = structuredClone(published);
        noEdit.chapters['心臟基礎'].activities[0].reflection.allowEdit = false;
        await mount('student', noEdit);
        await page.getByText('教師設定送出後不能修改。', { exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: '修改', exact: true }).count(), 0);
        // Teacher results and both actual downloads, including old snapshot preserved after a text edit.
        await mount('results', published);
        await page.getByRole('button', { name: '讀取反思結果', exact: true }).click();
        await page.getByText('已作答 1 人／名冊 3 人', { exact: true }).waitFor();
        await page.locator('details summary').click();
        await page.getByText(/115002/).waitFor();
        assert.equal(await page.getByRole('meter', { name: '案例討論：1人' }).count(), 1);
        await shot('teacher-results');
        await page.getByLabel('反思班級', { exact: true }).selectOption('護二甲');
        await page.getByRole('button', { name: '讀取反思結果', exact: true }).click();
        await page.getByText('已作答 1 人／名冊 2 人', { exact: true }).waitFor();
        await page.getByLabel('反思班級', { exact: true }).selectOption('護二乙');
        await page.getByRole('button', { name: '讀取反思結果', exact: true }).click();
        await page.getByText('已作答 0 人／名冊 1 人', { exact: true }).waitFor();
        assert(await page.getByRole('button', { name: '匯出具名 CSV', exact: true }).isDisabled());
        await page.getByLabel('反思班級', { exact: true }).selectOption('');
        await page.getByRole('button', { name: '讀取反思結果', exact: true }).click();
        await page.getByText('已作答 1 人／名冊 3 人', { exact: true }).waitFor();

        const csvs = {};
        for (const [label, kind] of [
          ['匯出具名 CSV', 'named'],
          ['匯出去識別 CSV', 'anonymous'],
        ]) {
          const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: label, exact: true }).click(),
          ]);
          const content = await fs.readFile(await download.path(), 'utf8');
          assert(content.startsWith('\ufeff'));
          csvs[kind] = content;
        }
        assert.match(csvs.named, /115001/);
        assert.doesNotMatch(csvs.anonymous, /115001|測試同學|student@example.edu|student-uid/);
        assert.match(csvs.anonymous, /[a-f0-9]{64}/);
        // Open CSV in a simple local table, not a separate invented export screenshot.
        const Papa = require('papaparse');
        const parsed = Papa.parse(csvs.named.replace(/^\ufeff/, ''));
        await page.evaluate((rows) => window.reflectionTest.showCsv(rows), parsed.data);
        await shot('csv-open');
        // Edit a live question/option: warning, stable IDs, and old answers retain their snapshots.
        await mount('editor', published);
        await page.locator('.activityeditor summary').click();
        await editor.waitFor();
        await editor.getByLabel('第1題題目文字', { exact: true }).fill('新版：今天理解了什麼？');
        const option = editor.getByLabel('第2題選項3', { exact: true });
        await option.fill('案例比較');
        await option.press('Tab');
        await page
          .getByRole('dialog', { name: '變更反思題目警告' })
          .getByRole('button', { name: '取消變更', exact: true })
          .click();
        assert.equal(await option.inputValue(), '案例討論');
        await option.fill('案例比較');
        await option.press('Tab');
        await page
          .getByRole('dialog', { name: '變更反思題目警告' })
          .getByRole('button', { name: '確認變更', exact: true })
          .click();
        assert.deepEqual(await editor.locator('code').allTextContents(), originalIds);
        await page.getByRole('button', { name: '發布課程', exact: true }).click();
        await page.waitForFunction(() =>
          window.reflectionTest.course.chapters[
            '心臟基礎'
          ].activities[0].reflection.prompts[1].options.includes('案例比較'),
        );
        const revised = ctx.data.get('courses/reflection-test').published;
        const stored = ctx.data.get(
          'courses/reflection-test/reflections/' + key + '/responses/student-uid',
        );
        assert.equal(stored.promptsSnapshot[1].options[2], '案例討論');
        await mount('results', revised);
        await page.getByRole('button', { name: '讀取反思結果', exact: true }).click();
        await page.getByRole('meter', { name: '案例討論：1人' }).waitFor();
        await shot('teacher-snapshot');

        // Preview must not call either formal reflection endpoint or change stored progress.
        const old = structuredClone(ctx.data.get('courses/reflection-test/progress/student-uid'));
        await page.evaluate(() => window.reflectionTest.setPreview(true));
        const beforeCalls = await page.evaluate(
          () =>
            window.reflectionTest.calls.filter(
              (c) => c.name === 'saveReflection' || c.name === 'getMyReflection',
            ).length,
        );
        await mount('preview', published);
        await text.fill('預覽文字');
        await page.getByRole('button', { name: '案例討論', exact: true }).click();
        await submit.click();
        await page.getByRole('alert').filter({ hasText: '教師預覽' }).waitFor();
        assert.equal(
          await page.evaluate(
            () =>
              window.reflectionTest.calls.filter(
                (c) => c.name === 'saveReflection' || c.name === 'getMyReflection',
              ).length,
          ),
          beforeCalls,
        );
        assert.deepEqual(ctx.data.get('courses/reflection-test/progress/student-uid'), old);
        await shot('student-preview');
        // Reflect activity completion contributes just as any required activity does.
        const progress = ctx.data.get('courses/reflection-test/progress/student-uid');
        assert.equal(model.CURRENT_COMPLETION_FORMULA_VERSION, 3);
        assert.equal(model.requiredActivities(published.chapters['心臟基礎']).length, 1);
        assert.equal(progress.activities[key].completed, true);
        assert.deepEqual(errors, []);
        results.push({
          width,
          passed: true,
          callables: [
            ...new Set(await page.evaluate(() => window.reflectionTest.calls.map((c) => c.name))),
          ],
          screenshots: screenshots ? 9 : 0,
        });
      } catch (e) {
        console.error('UI errors', errors);
        console.error((await page.locator('body').innerText()).slice(-5000));
        await page.screenshot({
          path: '/tmp/reflection-failure-' + width + '.png',
          fullPage: true,
        });
        throw e;
      } finally {
        ctx.restore();
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (screenshots)
    await fs.writeFile(
      'docs/reflection-activity-1.8.0-verification.json',
      JSON.stringify(results, null, 2) + '\n',
    );
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(await verifyReflection(process.argv.includes('--screenshots')), null, 2),
  );
