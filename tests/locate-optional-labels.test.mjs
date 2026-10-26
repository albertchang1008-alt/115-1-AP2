// 回歸測試（2026-10-26 學生回報）：定位題中「選填但有正確位置」的標籤，
// 學生放在正確位置不可判錯；放錯位置仍須判錯。
// 既有 helper（performScriptedStep）只放必答標籤，測不到這種作答方式，所以另立此測試。
// 會自動掃描十份泌尿／體液教材，日後新增的同類步驟也會被涵蓋。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {renderApply} from '../materials-src/apply-kit/render.mjs';
import {compileApplyStudentScript} from '../materials-src/apply-kit/scripted-compile.mjs';
import {approvedUrinarySlugs} from '../scripts/urinary-release-build.mjs';
import {beginScripted, performScriptedStep, state} from '../scripts/lib/apply-script-browser.mjs';

const optionalRows = (s) =>
  s.type === 'locate'
    ? s.cards.map((_, r) => r).filter((r) => !s.spatial.required.includes(r) && s.spatial.expected[r] >= 0)
    : [];

// acid-base-homeostasis 用另一套腳本（無 docs/urinary-release/scripts/<slug>.md），不經此播放器的定位題。
const targets = approvedUrinarySlugs
  .filter((slug) => fs.existsSync(path.resolve('docs/urinary-release/scripts', slug + '.md')))
  .map((slug) => ({slug, S: compileApplyStudentScript(path.resolve('materials-src', slug))}))
  .filter(({S}) => S.nodes.some((n) => n.steps.some((s) => optionalRows(s).length)));

test('至少有一份教材含選填定位標籤（掃描本身有效）', () => {
  assert.ok(targets.some((t) => t.slug === 'nephron-circulation'));
});

async function place(p, row, target) {
  await p.locator(`[data-spatial-card="${row}"]`).click();
  await p.locator(`[data-spatial-target="${target}"]`).click();
}

for (const {slug, S} of targets)
  test(`${slug}：選填標籤放對位置算對、放錯位置算錯`, async () => {
    const baseDir = path.resolve('materials-src', slug),
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locate-optional-')),
      file = path.join(dir, 'preview.html');
    fs.writeFileSync(file, renderApply(JSON.parse(fs.readFileSync(path.join(baseDir, 'apply.json'))), {baseDir, view: 'course'}));
    const browser = await chromium.launch();
    try {
      const p = await browser.newPage({viewport: {width: 390, height: 844}});
      await p.goto(pathToFileURL(file).href);
      await p.locator('#start').click();
      let checked = 0;
      for (const [i, node] of S.nodes.entries()) {
        await beginScripted(p);
        for (const s of node.steps) {
          const optional = optionalRows(s);
          if (optional.length) {
            const spec = s.spatial,
              n = spec.points.length;
            if (await p.locator('#locate-skip').count()) await p.locator('#locate-skip').click();
            // 1) 必答放對，但把第一個選填標籤放在錯的位置 → 必須判錯
            const wrongTarget = [...Array(n).keys()].find(
              (t) => t !== spec.expected[optional[0]] && !spec.required.some((r) => spec.expected[r] === t),
            );
            if (wrongTarget !== undefined) {
              for (const r of spec.required) await place(p, r, spec.expected[r]);
              await place(p, optional[0], wrongTarget);
              await p.locator('#locate-check').click();
              assert.equal((await state(p)).phase, 'action', `${slug} N${i + 1}：選填標籤放錯應判錯`);
              await p.locator('#strict-retry').click();
              if (await p.locator('#locate-skip').count()) await p.locator('#locate-skip').click();
            }
            // 2) 必答與所有選填標籤都放在正確位置 → 必須通過（學生回報的情境）
            for (const r of [...spec.required, ...optional]) await place(p, r, spec.expected[r]);
            if (spec.directions) for (const r of spec.required) await p.locator(`[data-spatial-direction="${r}"]`).click();
            await p.locator('#locate-check').click();
            assert.equal((await state(p)).phase, 'step-passed', `${slug} N${i + 1}：標籤全部放對卻被判錯`);
            checked++;
          } else await performScriptedStep(p, s);
          await p.locator('#next-step').click();
        }
        if (node.micro) {
          await p.locator(`[data-micro="${node.micro.answer}"]`).click();
          await p.locator('#micro-submit').click();
        }
        if (i < S.nodes.length - 1) await p.locator('#next-node').click();
      }
      assert.ok(checked > 0);
    } finally {
      await browser.close();
    }
  });
