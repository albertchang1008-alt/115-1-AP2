import fs from 'node:fs';
import postcss from 'postcss';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { displayPreferences } from '../shared/displayPrefs';
import { validateCourseDraft } from '../shared/courseValidation';
// @ts-ignore Browser-only verification adapter.
import { platformPage } from '../scripts/lib/readability-platform.mjs';
test('閱讀開關：預設開、全課關、排除優先與全部教材', () => {
  const overlay = postcss.parse(
    fs.readFileSync(
      new URL('../public/materials/readability-overlay.css', import.meta.url),
      'utf8',
    ),
  );
  overlay.walkRules((r) => {
    for (const selector of r.selectors)
      assert(selector.includes("[data-readability='on']"), selector);
  });
  overlay.walkDecls((d) =>
    assert(!['order', 'flex-direction', 'grid-row', 'grid-column'].includes(d.prop), d.prop),
  );

  const a = {
    url: 'https://example.com/materials/kidney-anatomy-v1/index.html',
    materialVersion: 'kidney-anatomy-v1',
  };
  assert.equal(displayPreferences(undefined, a, 1).overlay, true);
  assert.equal(
    displayPreferences({ features: { readabilityOverlay: false } }, a, 1).overlay,
    false,
  );
  assert.equal(
    displayPreferences({ features: { readabilityOverlayExclusions: ['kidney-anatomy-v1'] } }, a, 1)
      .overlay,
    false,
  );
  assert.equal(
    displayPreferences(undefined, { ...a, materialVersion: 'lung-function-v1' }, 1).overlay,
    true,
  );
  const c: any = {
    id: 'sample',
    title: '樣張',
    term: 'test',
    classIds: [],
    units: [],
    features: { readabilityOverlay: true, readabilityOverlayExclusions: ['kidney-anatomy-v1'] },
  };
  assert.doesNotThrow(() => validateCourseDraft(c));
  assert.throws(() => validateCourseDraft({ ...c, features: { readabilityOverlay: 'true' } }));
  assert.throws(() =>
    validateCourseDraft({ ...c, features: { readabilityOverlayExclusions: ['../bad'] } }),
  );
});
test('真實Player opaque iframe：字級即時送出、關閉還原、來源與資料驗證、不新增學習事件', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const p = await platformPage(browser, {
      viewport: { width: 390, height: 844 },
      slug: 'kidney-anatomy',
      scale: 1,
    });
    await p.goto();
    assert.equal(await p.platformPage.locator('iframe').getAttribute('sandbox'), 'allow-scripts');
    const storage = await p.evaluate(() => {
      try {
        localStorage.getItem('course-font-scale');
        return false;
      } catch {
        return true;
      }
    });
    assert.equal(storage, true);
    assert.equal(await p.evaluate(() => document.documentElement.dataset.readability), 'on');
    const before = await p.evaluate(() => (window as any).StudentScriptUI.getState());
    await p.platformPage.getByRole('combobox', { name: '文字大小' }).selectOption('xlarge');
    await p
      .platformFrame()
      .waitForFunction(
        () => document.documentElement.style.getPropertyValue('--font-scale') === '1.3',
      );
    assert.deepEqual(await p.evaluate(() => (window as any).StudentScriptUI.getState()), before);
    await p.platformPage.evaluate(() =>
      (window as any).configureCourse({ readabilityOverlay: false }),
    );
    await p.platformFrame().waitForFunction(() => !document.documentElement.dataset.readability);
    await p.evaluate(() => parent.postMessage({ type: 'ready' }, '*'));
    await p.platformPage.waitForTimeout(100);
    assert.equal(await p.evaluate(() => document.documentElement.dataset.readability), undefined);
    await p.platformPage.evaluate(() =>
      (window as any).configureCourse({
        readabilityOverlay: true,
        readabilityOverlayExclusions: ['kidney-anatomy-v1'],
      }),
    );
    await p.platformPage.waitForTimeout(100);
    assert.equal(await p.evaluate(() => document.documentElement.dataset.readability), undefined);
    await p.platformPage.evaluate(() =>
      (window as any).configureCourse({ readabilityOverlay: true }),
    );
    await p
      .platformFrame()
      .waitForFunction(() => document.documentElement.dataset.readability === 'on');
    await p.evaluate(() =>
      window.postMessage(
        { type: 'display-prefs', protocolVersion: 1, fontScale: 1, overlay: false },
        '*',
      ),
    );
    assert.equal(await p.evaluate(() => document.documentElement.dataset.readability), 'on');
    await p.platformPage.evaluate(() =>
      document
        .querySelector('iframe')!
        .contentWindow!.postMessage(
          { type: 'display-prefs', protocolVersion: 1, fontScale: 99, overlay: false },
          '*',
        ),
    );
    assert.equal(await p.evaluate(() => document.documentElement.dataset.readability), 'on');
    await p.platformPage.evaluate(() =>
      document
        .querySelector('iframe')!
        .contentWindow!.postMessage(
          { type: 'display-prefs', protocolVersion: 1, fontScale: 1.3, overlay: false },
          '*',
        ),
    );
    await p.platformFrame().waitForFunction(() => !document.documentElement.dataset.readability);
    assert.equal(await p.locator('#course-readability-overlay').count(), 0);
    assert.equal(await p.locator('[data-readability-zoom]').count(), 0);
    const events = await p.platformPage.evaluate(() =>
      (window as any).platformMessages
        .filter((m: any) => m.type === 'learning-events')
        .flatMap((m: any) => m.events),
    );
    assert(!events.some((e: any) => e.type === 'completed'));
    await p.platformPage.evaluate(() =>
      document
        .querySelector('iframe')!
        .contentWindow!.postMessage(
          { type: 'display-prefs', protocolVersion: 1, fontScale: 1.3, overlay: true },
          '*',
        ),
    );
    await p
      .platformFrame()
      .waitForFunction(() => document.documentElement.dataset.readability === 'on');
    await p.locator('#start').click();
    const order = await p.evaluate(() => {
      const a = document.querySelector('.student-main')!;
      const figure = a.querySelector('.diagram-region')!,
        response = a.querySelector('.response-region')!;
      return {
        first: a.firstElementChild?.className,
        figureTop: figure.getBoundingClientRect().top,
        responseTop: response.getBoundingClientRect().top,
      };
    });
    assert(order.first.includes('diagram-region'));
    assert(order.figureTop <= order.responseTop);
    const beforeZoom = await p.evaluate(() => (window as any).StudentScriptUI.getState());
    await p.locator('[data-readability-zoom]').first().click();
    assert(
      await p
        .locator('.course-readability-zoom-pane > svg')
        .evaluate(
          (e: Element) =>
            e.getBoundingClientRect().width >= 1200 && getComputedStyle(e).maxHeight === 'none',
        ),
    );
    await p.getByRole('button', { name: '關閉放大圖像' }).click();
    assert.deepEqual(
      await p.evaluate(() => (window as any).StudentScriptUI.getState()),
      beforeZoom,
    );

    await p.close();
  } finally {
    await browser.close();
  }
});
test('非互動教材亦收到字級；排除教材不掛overlay，不啟動互動context', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const p = await platformPage(browser, {
      viewport: { width: 390, height: 844 },
      slug: 'cardiac-output',
      scale: 1.3,
      tracking: 'manual',
      exclusions: ['cardiac-output-v1'],
    });
    await p.goto();
    assert.equal(
      await p.evaluate(() => document.documentElement.style.getPropertyValue('--font-scale')),
      '1.3',
    );
    assert.equal(await p.evaluate(() => document.documentElement.dataset.readability), undefined);
    assert.equal(await p.locator('#course-readability-overlay').count(), 0);
    await p.close();
  } finally {
    await browser.close();
  }
});
