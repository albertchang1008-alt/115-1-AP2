import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright';

test('Zuvio 清理失敗時顯示通知，重試成功後移除清理按鈕', async () => {
  const bundle = buildSync({
    stdin: {
      contents: `
        import React, { useState } from 'react';
        import { createRoot } from 'react-dom/client';
        import ZuvioExams from './src/ZuvioExams';
        import { sampleZuvioApi } from './src/zuvioApi';
        import { SAMPLE_POOL } from './shared/zuvioSamplePool';

        const base = sampleZuvioApi(SAMPLE_POOL);
        let failCleanup = true;
        const api = {
          ...base,
          async deleteResults(examId, sittingId, cleanupOnly) {
            if (examId !== 'demo-exam' || sittingId !== 's1' || cleanupOnly !== true) {
              throw new Error('清理呼叫參數錯誤');
            }
            if (failCleanup) {
              failCleanup = false;
              throw new Error('清理暫時失敗，請重試');
            }
            await base.deleteResults(examId, sittingId, cleanupOnly);
          },
        };

        function Fixture() {
          const [toast, setToast] = useState('');
          return <><div role="status">{toast}</div><ZuvioExams api={api} notify={setToast} /></>;
        }

        async function mount() {
          await base.deleteResults('demo-exam', 's1');
          const { summary } = await base.getExam('demo-exam');
          summary.sittings.find(({ id }) => id === 's1').pendingCleanup = true;
          createRoot(document.getElementById('root')).render(<Fixture />);
        }
        void mount();
      `,
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  }).outputFiles[0].text;

  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  try {
    const page = await browser.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundle });
    await page.getByRole('tab', { name: '考卷與場次' }).click();
    await page.getByRole('row').filter({ hasText: '11/3 呼吸小考' }).getByRole('button', { name: '開啟' }).click();
    const sitting = page.getByRole('row').filter({ hasText: '甲班 第1次' });
    const cleanup = sitting.getByRole('button', { name: '清理殘留成績', exact: true });
    await cleanup.click();
    await page.getByRole('status').getByText('清理暫時失敗，請重試', { exact: true }).waitFor();
    assert.equal(await cleanup.isVisible(), true);

    await cleanup.click();
    await cleanup.waitFor({ state: 'detached' });
    assert.equal(await sitting.getByRole('button', { name: '匯入成績', exact: true }).isVisible(), true);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }
});
