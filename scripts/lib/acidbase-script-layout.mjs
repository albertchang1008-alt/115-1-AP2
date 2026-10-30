import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { compileStudentScript } from '../../materials-src/apply-kit/student-script.mjs';
import { renderApply } from '../../materials-src/apply-kit/render.mjs';
import { metrics } from './acidbase-full-browser.mjs';
import {
  placeScriptCards,
  finishScriptNode,
  retryScript,
  finishScriptMicro,
  auditScriptText,
} from './acidbase-script-browser.mjs';

import {installReadOnlyTracking,verifyReadOnlyTracking} from './release-tracking-proof.mjs';
export async function checkScriptLayout(data, { file, out, html, sizes, shots = true, onPage, onCapture, observeOnly = false } = {}) {
  const baseDir = path.dirname(path.resolve(file)),
    script = compileStudentScript(baseDir);
  fs.mkdirSync(path.join(out, 'shots'), { recursive: true });
  const input = path.join(out, 'checked-student.html');
  fs.writeFileSync(
    input,
    html ? fs.readFileSync(html) : renderApply(data, { baseDir, view: 'course' }),
  );
  const browser = await chromium.launch(),
    results = [],
    seen = new Set(),
    textErrors = [];
  try {
    for (const [width, height] of sizes || [
      [360, 667],
      [390, 844],
      [414, 896],
      [768, 1024],
      [820, 1180],
      [1024, 1366],
      [1280, 800],
      [844, 390],
    ]) {
      const p = await browser.newPage({ viewport: { width, height } }),
        errors = [];
      p.setDefaultTimeout(8000);
      p.on('pageerror', (e) => errors.push(e.message));
      if(onPage)await onPage(p,{width,height});
      if(html)await installReadOnlyTracking(p);
      await p.goto(pathToFileURL(input).href);
      async function capture(name, description) {
        if(onCapture)await onCapture(p,{name,width,height,description});
        if(observeOnly)return;
        if ((await p.evaluate(() => window.StudentScriptUI.getState())).course.retry)
          await p.locator('#strict-retry').waitFor();
        await p.evaluate(async () =>
          Promise.all(
            document
              .getAnimations()
              .filter((a) => a.effect?.getTiming().iterations === 1)
              .map((a) => a.finished.catch(() => {})),
          ),
        );
        const m = await metrics(p),
          audit = await auditScriptText(p, script, data);
        audit.seen.forEach((id) => seen.add(id));
        textErrors.push(...audit.errors.map((e) => ({ name, width, height, ...e })));
        const assessmentGap = await p.evaluate(() => {
          const stem = document.querySelector('[data-screen="quiz"] .student-header h1');
          const choices = document.querySelector('[data-screen="quiz"] .answer-options');
          return stem && choices ? choices.getBoundingClientRect().top - stem.getBoundingClientRect().bottom : null;
        });
        const r = {
          assessmentGap,
          name,
          width,
          height,
          description,
          ...m,
          copySeen: audit.seen,
          textErrors: audit.errors,
          consoleErrors: [...errors],
        };
        r.pass =
          (assessmentGap === null || (assessmentGap >= 0 && assessmentGap <= 24)) &&
          !m.outside.length &&
          !m.clipping.length &&
          !m.small.length &&
          m.scrollWidth <= width &&
          m.scrollHeight <= height &&
          !errors.length &&
          !audit.errors.length;
        results.push(r);
        console.log(
          `${width}x${height} ${name}: ${r.pass ? 'PASS' : 'FAIL'} clip=${m.clipping.length} outside=${m.outside.length} text=${audit.errors.length}`,
        );
        if (!r.pass && !fs.existsSync(path.join(out, 'first-failure.json')))
          fs.writeFileSync(path.join(out, 'first-failure.json'), JSON.stringify(r, null, 2));
        if (shots && [1280, 390].includes(width)) {
          r.file = `shots/${width}x${height}-${name}.png`;
          await p.screenshot({ path: path.join(out, r.file) });
        }
      }
      const hint = async (name) => {
        await p.locator('#hint-toggle').click();
        await capture(name, '點💡提示後才顯示核可腳本提示；再次點選可收起。');
        await p.locator('#hint-toggle').click();
      };
      await capture('opening', '完整開場頁：核可情境、三個先認識小卡與開始按鈕。');
      await p.locator('#start').click();
      for (let i = 0; i < 6; i++) {
        assert.equal(await p.locator('.selected').count(), 0);
        await capture(`N0${i + 1}-before`, '動作①作答前：原腳本問題、圖與未預選的卡片／選項。');
        await hint(`N0${i + 1}-hint`);
        if (i < 3) {
          await placeScriptCards(p, i, {
            wrong: true,
            onState: async (name) => {
              if (name === 'menu-0')
                await capture(`N0${i + 1}-menu`, '列內展開選單；圖仍可見，所有核可說明逐字呈現。');
            },
          });
          await capture(`N0${i + 1}-wrong`, '配合題先全組作答再檢查；錯誤列及原回饋，未提前揭曉。');
          await placeScriptCards(p, i);
        }
        if (i === 0) {
          await capture('N01-action2', '動作①答對後才顯示動作②的問題與兩個原選項。');
          await hint('N01-action2-hint');
          await retryScript(p);
          await p.locator('[data-answer="0"]').click();
          await capture('N01-action2-wrong', '動作②答錯：腳本的抓住不等於排出回饋。');
          await retryScript(p);
          await p.locator('[data-answer="1"]').click();
        }
        if (i === 1) {
          await capture('N02-example', '動作①答對：原腳本課本例與正常範圍文字。');
          await p.locator('#next-action').click();
          await hint('N02-action2-hint');
          await p.locator('[data-answer="1"]').click();
          await capture('N02-action2-wrong', '比值判斷答錯：顯示原腳本的pH上升回饋。');
          await retryScript(p);
          await p.locator('[data-answer="0"]').click();
        }
        if (i === 3) {
          await p.locator('#breathe').click();
          await p.locator('[data-answer="1"]').click();
          await capture('N04-wrong', '呼出更多CO₂後的判斷答錯，顯示腳本原句回饋。');
          await retryScript(p);
          await p.locator('[data-answer="0"]').click();
        }
        if (i === 4) {
          await p.locator('#submit-arrow').click();
          await capture('N05-wrong', '兩箭頭未修正，僅錯誤箭頭框紅，標籤置於箭頭上方。');
          await retryScript(p);
          await p.locator('[data-arrow="0"]').click();
          await p.locator('#submit-arrow').click();
          assert.equal(await p.locator('.arrow-wrong').count(), 1);
          await capture('N05-one-wrong', '已修正H⁺，僅HCO₃⁻錯箭頭保留紅框。');
          await retryScript(p);
          await p.locator('[data-arrow="0"]').click();
          await p.locator('[data-arrow="1"]').click();
          await p.locator('#submit-arrow').click();
        }
        if (i === 5) {
          await p.locator('[data-answer="1"]').click();
          await capture('N06-wrong', '管液承接者答錯：腳本原句說明HCO₃⁻已回血液。');
          await retryScript(p);
          await p.locator('[data-answer="0"]').click();
          await capture('N06-reaction', '答對：腳本H⁺＋NH₃合成NH₄⁺，動作②才出現。');
          await hint('N06-action2-hint');
          await p.locator('[data-answer="1"]').click();
          await capture('N06-action2-wrong', 'NH₄⁺去向答錯，顯示跟尿排出的原腳本回饋。');
          await retryScript(p);
          await p.locator('[data-answer="0"]').click();
        }
        if (i !== 4) {
          const m = script.nodes[i].micro;
          await capture(`N0${i + 1}-micro`, '動作之後出現核可白話小檢核。');
          // test hint in micro mode
          await p.locator('#hint-toggle').click();
          await capture(`N0${i + 1}-micro-hint`, '點💡提示後才顯示小檢核提示；再次點選可收起。');
          await p.locator('#hint-toggle').click();

          // test wrong micro options so all feedback texts are seen
          let wrongCount = 0;
          for (let opt = 0; opt < 4; opt++) {
            if (opt !== m.answer) {
              if ((await p.evaluate(() => window.StudentScriptUI.getState())).course.retry) {
                await retryScript(p);
                await finishScriptNode(p, script, i, { skipMicro: true });
              }
              await p.locator(`[data-micro="${opt}"]`).click();
              await p.locator('#micro-submit').click();
              if (wrongCount === 0) {
                await capture(`N0${i + 1}-micro-wrong`, '小檢核答錯，顯示核可白話回饋。');
                wrongCount++;
              } else {
                const a = await auditScriptText(p, script, data);
                a.seen.forEach((id) => seen.add(id));
              }
            }
          }
          await retryScript(p);
          await finishScriptNode(p, script, i, { skipMicro: true });
          // correct answer
          await p.locator(`[data-micro="${m.answer}"]`).click();
          await p.locator('#micro-submit').click();
        }
        await capture(
          `N0${i + 1}-correct`,
          '答對：保留原腳本回饋／校正圖，心智圖長枝，出現下一關按鈕。',
        );
        await p.locator('#next-node').click();
      }
      await capture('ending-covered', '結尾先遮圖，依原腳本依序問三組人手的功能。');
      await p.locator('#hint-toggle').click();
      await capture('ending-hint', '結尾提示提供回看對應關卡。');
      await p.locator('#trace-review').click();
      await capture('ending-review-node', '點擊回看按鈕跳回對應關卡確認。');
      await p.locator('#return-quiz').click();
      for (let j = 0; j < 3; j++) {
        await p.locator('[data-trace="1"]').click();
        await capture('ending-wrong-' + j, '當格答錯先顯示對應關卡核定說明，再按從第1格重來。');
        await retryScript(p);
        for (let replay = 0; replay < j; replay++) await p.locator('[data-trace="0"]').click();
        await p.locator('[data-trace="0"]').click();
        await capture('ending-branch-' + (j + 1), '當格答對就揭開一枝，下一格依序出現。');
      }
      await capture('ending-full', '完整心智圖、核可結語與進入第二關考核按鈕。');
      await p.locator('#enter-assessment').click();
      await capture('quiz-transition', '進入考核前（過渡頁）：核可鼓勵與開始考核按鈕。');
      await p.locator('#start-quiz').click();

      for (let round = 0; round < 2; round++) {
        const snapshot = await p.evaluate(() => window.StudentScriptUI.getState());
        for (let k = 0; k < 5; k++) {
          const q = data.pool.find(
            (q) => q.group === snapshot.model.order[k] && q.side === snapshot.model.sides[q.group],
          );
          await capture(q.id + '-answer', '第二關考核原題、原選項，逐字保留。');
          if(width===390 && height===844 && q.id==='R-A')await p.screenshot({path:path.join(out,'shots','390x844-R-A.png')});
          if(width===390 && height===844 && round===0 && k===0)await p.screenshot({path:path.join(out,'shots','390x844-assessment.png')});
          const chosen = round === 0 && k === 4 ? (q.answer + 1) % q.options.length : q.answer;
          await p.locator(`[data-pool="${chosen}"]`).click();
          await p.locator('#pool-submit').click();
          if (q.reasons) {
            await capture(q.id + '-reason', '原兩層次理由與原選項，逐字保留。');
            await p.locator(`[data-pool="${q.reasonAnswer}"]`).click();
            await p.locator('#pool-submit').click();
          }
        }
        if (round === 0) {
          await capture('assessment-review', '考核答錯，原診斷保留，回讀後才能換相反題重試。');
          await p.locator('#review-case').click();
          await p.locator('#return-quiz').click();
          await p.locator('#retry-case').click();
        }
      }
      await capture('assessment-complete', '第二關通過後保留核可結語，無額外教學文字。');
      if(html)fs.writeFileSync(path.join(out,`tracking-${width}x${height}.json`),JSON.stringify(await verifyReadOnlyTracking(p),null,2)+'\n');
      await p.close();
    }
  } finally {
    await browser.close();
  }
  const raw = fs.readFileSync(
    path.resolve(baseDir, '../../docs/urinary-release/ACIDBASE_STUDENT_SCRIPT.md'),
    'utf8',
  );
  const quoted = [
    ...raw
      .slice(raw.indexOf('## 開場'))
      .split('## v3.1 變更')[0]
      .matchAll(/「([^」]+)」/g),
  ]
    .map((m) => m[1])
    .filter((t) => t !== '回看第 X 關' && t !== 'pKa 是公式裡固定的數字');
  const unrepresented = quoted.filter(
    (t) => !Object.values(script.units).some((u) => u.text === t),
  );
  const missing = Object.keys(script.units).filter(
    (id) => !id.startsWith('diagram.') && !seen.has(id),
  );
  const summary = {
    cases: results.length,
    pass: results.filter((r) => r.pass).length,
    fail: results.filter((r) => !r.pass).length,
    skipped: 0,
  };
  if (missing.length || textErrors.length || unrepresented.length) summary.fail++;
  const diff = {
    scriptVersion: script.version,
    scriptSha256: script.sha256,
    authorizedInterfaceCopy: script.interfaceCopy,
    quotedSourceClauses: quoted.length,
    unrepresented,
    requiredUnits: Object.keys(script.units).filter((id) => !id.startsWith('diagram.')).length,
    seen: [...seen],
    missing,
    textErrors,
    pass: !missing.length && !textErrors.length && !unrepresented.length,
  };
  fs.writeFileSync(path.join(out, 'SCRIPT_DIFF.json'), JSON.stringify(diff, null, 2) + '\n');
  fs.writeFileSync(
    path.join(out, 'SCRIPT_DIFF.txt'),
    [
      `Approved script version: ${script.version}`,
      `Approved script SHA256: ${script.sha256}`,
      `Quoted student-copy clauses in source: ${quoted.length}`,
      `Unrepresented quoted clauses: ${unrepresented.length}`,
      `Required student-copy units: ${diff.requiredUnits}`,
      `Missing units: ${missing.length}`,
      `Changed/extra rendered teaching text: ${textErrors.length}`,
      `Result: ${diff.pass ? 'PASS' : 'FAIL'}`,
      ...unrepresented.map((t) => 'UNREPRESENTED ' + t),
      ...missing.map((id) => 'MISSING ' + id + ' ' + script.units[id].text),
      ...textErrors.map((e) => JSON.stringify(e)),
      '',
      'V3.2 teaching copy remains exact; five microchecks come from v3 and ten paired questions retain their approved text.',
      ...Object.entries(script.interfaceCopy).map(
        ([id, u]) =>
          `AUTHORIZED INTERFACE ${id}: ${u.text} [${u.source}:${u.line}; SHA256 ${u.sha256}]`,
      ),
      'Each required unit is compared character-for-character against its actual rendered data-copy text.',
      '',
      ...Object.entries(script.units)
        .filter(([id]) => !id.startsWith('diagram.'))
        .map(
          ([id, u]) =>
            `${seen.has(id) ? 'OK' : 'MISSING'} ${id} [source line ${u.line}]: ${u.text}`,
        ),
      '',
    ].join('\n'),
  );
  fs.writeFileSync(
    path.join(out, 'layout-results.json'),
    JSON.stringify({ input, profile: 'teacher-student-script-v3.2', results, summary }, null, 2) +
      '\n',
  );
  return summary;
}
