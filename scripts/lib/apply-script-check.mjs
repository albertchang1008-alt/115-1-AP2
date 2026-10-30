import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { renderApply } from '../../materials-src/apply-kit/render.mjs';
import { compileApplyStudentScript } from '../../materials-src/apply-kit/scripted-compile.mjs';
import { unwrap } from '../../materials-src/apply-kit/model.mjs';
import { metrics } from './acidbase-full-browser.mjs';
import {
  state,
  retryScripted,
  beginScripted,
  performScriptedStep,
  finishScriptedActions,
  auditApplyScript,
} from './apply-script-browser.mjs';
export const scriptSizes = [
  [360, 667],
  [390, 844],
  [414, 896],
  [768, 1024],
  [820, 1180],
  [1024, 1366],
  [1280, 800],
  [844, 390],
];
import {installReadOnlyTracking,verifyReadOnlyTracking} from './release-tracking-proof.mjs';
export async function checkApplyScript(
  file,
  { out, sizes = scriptSizes, shots = true, negative = true, html, onPage, onCapture, observeOnly = false } = {},
) {
  const baseDir = path.dirname(path.resolve(file)),
    data = JSON.parse(fs.readFileSync(file)),
    S = compileApplyStudentScript(baseDir),
    q = unwrap(data).learning.questions;
  fs.mkdirSync(out, { recursive: true });
  const input = path.join(out, 'preview.html');
  fs.writeFileSync(
    input,
    html ? fs.readFileSync(html) : renderApply(data, { baseDir, view: 'course' }),
  );
  const browser = await chromium.launch(),
    results = [],
    seen = new Set(),
    textErrors = [],
    exceptions = [];
  try {
    for (const [width, height] of sizes) {
      const p = await browser.newPage({ viewport: { width, height } });
      p.setDefaultTimeout(7000);
      p.on('pageerror', (e) => exceptions.push(e.message));
      if(onPage)await onPage(p,{width,height});
      if(html)await installReadOnlyTracking(p);
      await p.goto(pathToFileURL(input).href);
      async function capture(name, description) {
        if(onCapture)await onCapture(p,{name,width,height,description});
        if(observeOnly)return;
        if ((await state(p)).retry) await p.locator('#strict-retry').waitFor();
        const m = await metrics(p),
          a = await auditApplyScript(p, S, q);
        a.seen.forEach((id) => seen.add(id));
        textErrors.push(...a.errors.map((e) => ({ name, width, height, ...e })));
        const assessmentGap = await p.evaluate(() => {
          const stem = document.querySelector('[data-screen="assessment"] .student-header h1');
          const choices = document.querySelector('[data-screen="assessment"] .answer-options');
          return stem && choices ? choices.getBoundingClientRect().top - stem.getBoundingClientRect().bottom : null;
        });
        const r = {
          assessmentGap,
          name,
          width,
          height,
          description,
          ...m,
          textErrors: a.errors,
          pass:
            (assessmentGap === null || (assessmentGap >= 0 && assessmentGap <= 24)) &&
            !m.outside.length &&
            !m.clipping.length &&
            !m.small.length &&
            m.scrollWidth <= width &&
            m.scrollHeight <= height &&
            !a.errors.length,
        };
        results.push(r);
        console.log(`${S.slug} ${width}x${height} ${name}: ${r.pass ? 'PASS' : 'FAIL'}`);
        if ((shots && [390, 1280].includes(width)) || (width===390 && height===844 && name==='foundation-1' && ['kidney-anatomy','urine-concentration'].includes(S.slug))) {
          fs.mkdirSync(path.join(out, 'shots'), { recursive: true });
          r.file = `shots/${width}x${height}-${name}.png`;
          await p.screenshot({ path: path.join(out, r.file) });
        }
        if (!r.pass && !fs.existsSync(path.join(out, 'first-failure.json')))
          fs.writeFileSync(path.join(out, 'first-failure.json'), JSON.stringify(r, null, 2));
      }
      await capture('opening', '教師核可開場，尚未開始作答。');
      await p.locator('#start').click();
      for (let i = 0; i < 6; i++) {
        const node = S.nodes[i];
        if (node.basics) {
          await capture(`N${i + 1}-basics`, '先認識完整呈現，先教再問，不彈窗。');
          await beginScripted(p);
        }
        await capture(`N${i + 1}-before`, '動作前：圖與完整問題，無預選答案。');
        await p.locator('#hint-toggle').click();
        await capture(`N${i + 1}-hint`, '由學生點選後才呈現原腳本提示。');
        await p.locator('#hint-toggle').click();
        for (let j = 0; j < node.steps.length; j++) {
          const s = node.steps[j];
          if (negative && s.type !== 'explore' && (s.type !== 'slider' || s.unit === '%')) {
            await performScriptedStep(p, s, { wrong: true });
            await capture(
              `N${i + 1}-S${j + 1}-wrong`,
              '答錯先顯示原文說明，再出現再試一次；整步清空重做。',
            );
            await retryScripted(p);
            assert.deepEqual((await state(p)).selected, []);
            await capture(
              `N${i + 1}-S${j + 1}-restarted`,
              '按重來後所有選取與該步狀態清空、選項重洗。',
            );
          }
          await performScriptedStep(p, s);
          await capture(`N${i + 1}-S${j + 1}-correct`, '本動作依實際操作答對，下一步才解鎖。');
          await p.locator('#next-step').click();
        }
        if (node.micro) {
          await capture(`N${i + 1}-micro`, '核可確認題與完整選項，未預選。');
          if (negative)
            for (let opt = 0; opt < node.micro.options.length; opt++)
              if (
                opt !== node.micro.answer &&
                (width === 390 ||
                  opt ===
                    Array.from({ length: node.micro.options.length }, (_, i) => i).find(
                      (i) => i !== node.micro.answer,
                    ))
              ) {
                await p.locator(`[data-micro="${opt}"]`).click();
                await p.locator('#micro-submit').click();
                await capture(
                  `N${i + 1}-micro-wrong-${opt}`,
                  '錯誤確認題先說明，再按重新開始這一關回動作①。',
                );
                await retryScripted(p);
                assert.equal((await state(p)).step, 0);
                await finishScriptedActions(p, node);
              }
          await p.locator(`[data-micro="${node.micro.answer}"]`).click();
          await p.locator('#micro-submit').click();
        }
        await capture(`N${i + 1}-passed`, '整關真正通過後才長出心智圖分枝。');
        assert.ok((await state(p)).done.includes(i));
        await p.locator('#next-node').click();
      }
      await capture('ending-covered', '心智圖遮住，從第一格開始。');
      for (let j = 0; j < 3; j++) {
        if (negative) {
          await p.locator('[data-trace="1"]').click();
          await capture(`ending-${j + 1}-wrong`, '結尾錯誤先說明，再從第1格重新遮圖重來。');
          await retryScripted(p);
          assert.equal((await state(p)).traceIndex, 0);
          for (let k = 0; k < j; k++) await p.locator('[data-trace="0"]').click();
        }
        await p.locator('[data-trace="0"]').click();
        await capture(`ending-${j + 1}-correct`, '依序答對一格，揭開心智圖分枝。');
      }
      await p.locator('#enter-assessment').click();
      await capture('transition', '使用核定共通鼓勵與本份空格，才進入兩階段。');
      await p.locator('#start-quiz').click();
      for (const stage of ['foundation', 'cases']) {
        if (negative) {
          await p
            .locator(`[data-pool="${(q[stage][0].answer + 1) % q[stage][0].options.length}"]`)
            .click();
          await p.locator('#pool-submit').click();
          await capture(`${stage}-wrong`, '正式考核原提示；先看解析與節點，再整階段重來。');
          await p.locator('#more-guide').click();
          await capture(`${stage}-explain`, '原題第二層解析未改。');
          await p.locator('#review-node').click();
          await p.locator('#return-review').click();
          await p.locator('#retry-assessment').click();
        }
        for (let j = 0; j < q[stage].length; j++) {
          await capture(`${stage}-${j + 1}`, '兩階段原題及已核可改寫，全部選項逐字呈現。');
          await p.locator(`[data-pool="${q[stage][j].answer}"]`).click();
          await p.locator('#pool-submit').click();
        }
      }
      await capture('complete', '兩階段全對、六關與結尾全部完成才通關。');
      assert.equal((await state(p)).sent, true);
      if(html)fs.writeFileSync(path.join(out,`tracking-${width}x${height}.json`),JSON.stringify(await verifyReadOnlyTracking(p),null,2)+'\n');
      await p.close();
    }
  } finally {
    await browser.close();
  }
  const missing = S.required.filter((id) => !seen.has(id));
  const summary = {
    cases: results.length,
    pass: results.filter((r) => r.pass).length,
    fail: results.filter((r) => !r.pass).length,
    skipped: 0,
  };
  const diff = {
    scriptVersion: S.version,
    scriptSha256: S.sha256,
    sourceHashes: S.sourceHashes,
    requiredUnits: S.required.length,
    missing,
    textErrors,
    exceptions,
    pass: !missing.length && !textErrors.length && !exceptions.length,
  };
  fs.writeFileSync(path.join(out, 'SCRIPT_DIFF.json'), JSON.stringify(diff, null, 2) + '\n');
  fs.writeFileSync(
    path.join(out, 'SCRIPT_DIFF.txt'),
    `Approved script: ${S.source}\nSHA256: ${S.sha256}\nRequired units: ${S.required.length}\nMissing: ${missing.length}\nChanged/extra: ${textErrors.length}\nResult: ${diff.pass ? 'PASS' : 'FAIL'}\n` +
      missing.map((id) => `MISSING ${id}: ${S.units[id].text}`).join('\n') +
      '\n',
  );
  fs.writeFileSync(
    path.join(out, 'layout-results.json'),
    JSON.stringify({ input, summary, exceptions, results }, null, 2) + '\n',
  );
  fs.writeFileSync(
    path.join(out, 'SHOTS.md'),
    '# 截圖\n\n' +
      results
        .filter((r) => r.file)
        .map((r) => `- [${r.width}×${r.height} ${r.name}](${r.file})：${r.description}`)
        .join('\n') +
      '\n',
  );
  return { summary, diff };
}
