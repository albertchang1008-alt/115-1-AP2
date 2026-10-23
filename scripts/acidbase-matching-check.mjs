import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { compileStudentScript } from '../materials-src/apply-kit/student-script.mjs';
import {
  finishScriptNode,
  finishScriptMicro,
  auditScriptText,
} from './lib/acidbase-script-browser.mjs';
import { metrics } from './lib/acidbase-full-browser.mjs';

export async function checkMatching(
  out,
  {
    shots = true,
    sizes = [
      [390, 844],
      [1280, 800],
    ],
  } = {},
) {
  fs.mkdirSync(out, { recursive: true });
  const base = path.resolve('materials-src/acid-base-homeostasis'),
    data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'))),
    script = compileStudentScript(base);
  const file = path.join(out, 'matching-preview.html');
  fs.writeFileSync(file, renderApply(data, { baseDir: base, view: 'course' }));
  const browser = await chromium.launch(),
    results = [],
    errors = [];
  try {
    for (const [width, height] of sizes) {
      const p = await browser.newPage({ viewport: { width, height } });
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(pathToFileURL(file).href);
      await p.locator('#start').click();
      const snap = async (node, state, description) => {
        const name = `${width}x${height}-N0${node + 1}-${state}`;
        const geometry = await metrics(p),
          audit = await auditScriptText(p, script, data);
        const pass =
          !geometry.clipping.length &&
          !geometry.outside.length &&
          !geometry.small.length &&
          geometry.scrollWidth <= width &&
          geometry.scrollHeight <= height &&
          !audit.errors.length;
        if (shots) await p.screenshot({ path: path.join(out, name + '.png') });
        results.push({ name, description, pass, geometry, textErrors: audit.errors });
      };
      for (const node of [0, 2]) {
        if (node === 2) {
          await finishScriptNode(p, script, 1);
          await p.locator('#next-node').click();
        }
        assert.equal(await p.locator('[data-guide-step="1"]').count(), 1);
        assert.equal(await p.locator('#match-check').isDisabled(), true);
        assert.equal(await p.locator('.matching-reference .lit').count(), 0);
        assert.equal(await p.locator('[data-answer]').count(), 0);
        await snap(node, 'guide1', '首次進入：先選角色，無預選、無正誤提示，圖仍保留。');
        await p.locator('[data-match-role="0"]').click();
        await snap(node, 'guide2', '點角色後才展開說明選單，第二步引導指向真實選項。');
        await p.locator('[data-match-choice="1"]').click();
        await snap(node, 'guide3', '自行選一段說明後第三步提示；未判斷對錯，不代填。');
        await p.locator('#match-understood').click();
        await p.locator('#match-help').click();
        await p.locator('#match-skip').click();
        await snap(node, 'skip', '操作說明可重看與略過，作答保留。');
        await p.reload();
        assert.equal(
          await p.locator('[data-guide-step]').count(),
          0,
          'completed guide does not auto-open after reload',
        );
        assert.equal(
          (await p.evaluate(() => window.StudentScriptUI.getState())).course.match.values[0],
          1,
        );
        await p.locator('[data-match-role="1"]').click();
        await p.locator('[data-match-choice="1"]').click();
        const before = (await p.evaluate(() => window.StudentScriptUI.getState())).course.match
          .values;
        assert.equal(await p.locator('.matching-row .matching-swap').count(), 1);
        assert.equal(await p.locator('[role="dialog"]').count(), 0);
        await snap(node, 'exchange', '選到已使用說明：明確交換兩列或取消，未暗中更動原答案。');
        await p.locator('#match-cancel').click();
        assert.deepEqual(
          (await p.evaluate(() => window.StudentScriptUI.getState())).course.match.values,
          before,
        );
        await p.locator('[data-match-role="1"]').click();
        await p.locator('[data-match-choice="1"]').click();
        await p.locator('#match-swap').click();
        assert.deepEqual(
          (await p.evaluate(() => window.StudentScriptUI.getState())).course.match.values,
          [null, 1, null],
        );
        for (const [row, choice] of [
          [0, 0],
          [1, 2],
          [2, 1],
        ]) {
          await p.locator(`[data-match-role="${row}"]`).click();
          await p.locator(`[data-match-choice="${choice}"]`).click();
        }
        assert.equal(await p.locator('#match-check').isDisabled(), false);
        assert.equal(
          await p.locator('.matching-row.fixed').count(),
          0,
          'no correctness before submit',
        );
        await p.locator('#match-check').click();
        assert.equal(await p.locator('[data-match-role="0"]').isDisabled(), true);
        assert.equal(await p.locator('.matching-row.wrong').count(), 2);
        assert.equal(await p.locator('[data-row-feedback]').count(), 2);
        for (const row of [1, 2]) assert.ok((await p.locator(`[data-row-feedback="${row}"]`).innerText()).length > 0);
        assert.ok((await p.locator('#student-figure').boundingBox()).height >= 70);
        await snap(node, 'retry-wrong-rows', '統一檢查答錯先說明，再試一次清空所有列。');
        assert.equal(await p.locator('.matching-row.fixed').count(), 0);
        await p.locator('#strict-retry').click();
        assert.deepEqual(
          (await p.evaluate(() => window.StudentScriptUI.getState())).course.match.values,
          [null, null, null],
        );
        const prior = await p.locator('[data-map-edge]').count();
        for (let row = 0; row < 3; row++) {
          await p.locator(`[data-match-role="${row}"]`).click();
          await p.locator(`[data-match-choice="${row}"]`).click();
        }
        await p.locator('#match-check').click();
        assert.equal(await p.locator('.matching-reference .lit').count(), 3);
        assert.equal(
          await p.locator('[data-map-edge]').count(),
          prior,
          'branch awaits whole-node pass',
        );
        assert.equal(await p.locator('[data-answer]').count(), 0);
        await snap(node, 'correct', '配對全對後圖上三區亮起；整關確認通過才長枝。');
        await p.locator('#match-next').click();
        if (node === 0) {
          assert.equal(await p.locator('[data-answer]').count(), 2);
          await p.locator('[data-answer="1"]').click();
        }
        await finishScriptMicro(p, script, node);
        await p.locator('#next-node').click();
      }
      await p.close();
    }
  } finally {
    await browser.close();
  }
  const result = {
    scriptVersion: script.version,
    scriptSha256: script.sha256,
    results,
    errors,
    pass: !errors.length && results.every((r) => r.pass),
  };
  fs.writeFileSync(path.join(out, 'matching-results.json'), JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(
    path.join(out, 'SHOTS.md'),
    '# 配合題截圖\n\n' +
      results
        .map((r) => `- [${r.name}](${r.name}.png)：${r.description} ${r.pass ? 'PASS' : 'FAIL'}`)
        .join('\n') +
      '\n',
  );
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const r = await checkMatching(
    path.resolve(process.argv[2] || 'docs/urinary-release/acidbase-full/ux-match'),
  );
  console.log(
    JSON.stringify({
      pass: r.pass,
      states: r.results.length,
      failures: r.results.filter((x) => !x.pass).map((x) => x.name),
      errors: r.errors,
    }),
  );
  if (!r.pass) process.exitCode = 1;
}
