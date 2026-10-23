import { placeScriptCards, retryScript, finishScriptNode } from './lib/acidbase-script-browser.mjs';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const { chromium } = createRequire(path.join(root, 'package.json'))('playwright');
const { renderApply } = await import(
  pathToFileURL(path.join(root, 'materials-src/apply-kit/render.mjs'))
);
const { compileStudentScript } = await import(
  pathToFileURL(path.join(root, 'materials-src/apply-kit/student-script.mjs'))
);
if (!process.argv[2]) throw new Error('Usage: node scripts/acidbase-v3-review.mjs <evidence-dir>');
const out = path.resolve(process.argv[2]),
  base = path.resolve('materials-src/acid-base-homeostasis'),
  data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'))),
  S = compileStudentScript(base);
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'independent.html');
fs.writeFileSync(file, renderApply(data, { baseDir: base, view: 'course' }));
const browser = await chromium.launch();
const errors = [],
  events = [],
  seen = [];
try {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => errors.push(e.message));
  await p.exposeFunction('independentEvent', () => events.push('complete'));
  await p.addInitScript(
    () => (window.CourseLearning = { complete: () => window.independentEvent() }),
  );
  await p.goto(pathToFileURL(file).href);
  async function snap(name, description) {
    await p.evaluate(async () =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations === 1)
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    await p.screenshot({ path: path.join(out, name + '.png') });
    seen.push({ name, description, text: await p.locator('body').innerText() });
  }
  const click = async (selector) => {
    await retryScript(p);
    await p.locator(selector).click();
  };
  await snap('opening', '獨立新頁面：完整開場與開始按鈕。');
  await click('#start');
  const arrows = () =>
    p.locator('[data-arrow]').evaluateAll((gs) =>
      gs.map((g) => {
        const a = g.querySelector('.s-flow').getBoundingClientRect(),
          label = g.querySelector('.arrow-badge-bg').getBoundingClientRect(),
          text = g.querySelector('text').getBoundingClientRect();
        return {
          arrow: { x: a.x, y: a.y, width: a.width, height: a.height },
          badge: { x: label.x, y: label.y, width: label.width, height: label.height },
          text: { x: text.x, y: text.y, width: text.width, height: text.height },
          gap: a.y - (label.y + label.height),
          path: g.querySelector('.s-flow').getAttribute('d'),
        };
      }),
    );
  const geometry = [];
  for (let i = 0; i < 6; i++) {
    await snap(`N0${i + 1}-before`, '首次進關，未預選；依畫面操作。');
    if (i < 3) {
      await placeScriptCards(p, i, { wrong: true });
      await snap(`N0${i + 1}-wrong`, '依實際配對操作故意答錯，再統一檢查核可回饋。');
      await placeScriptCards(p, i);
    }

    if (i === 0) {
      await click('[data-answer="0"]');
      await click('[data-answer="1"]');
    }
    if (i === 1) {
      await click('#next-action');
      await click('[data-answer="1"]');
      await click('[data-answer="0"]');
    }
    if (i === 3) {
      await click('#breathe');
      await click('[data-answer="1"]');
      await snap('N04-wrong', '呼氣後故意選錯pH方向，再依回饋修正。');
      await click('[data-answer="0"]');
    }
    if (i === 4) {
      geometry.push({ name: 'before', arrows: await arrows() });
      await click('#submit-arrow');
      await snap('N05-wrong', '原反向箭頭直接送出，只有錯箭頭框紅。');
      await click('[data-arrow="0"]');
      geometry.push({ name: 'one-flipped', arrows: await arrows() });
      await snap('N05-one-flipped', '只翻H⁺，核對標籤是否貼線並跟隨方向。');
      await click('[data-arrow="1"]');
      await click('#submit-arrow');
      geometry.push({ name: 'correct', arrows: await arrows() });
    }
    if (i === 5) {
      await click('[data-answer="1"]');
      await snap('N06-wrong', '故意選HCO₃⁻承接尿中酸，依回饋修正。');
      await click('[data-answer="0"]');
      await click('[data-answer="1"]');
      await click('[data-answer="0"]');
    }
    if (i !== 4) {
      const m = S.nodes[i].micro;
      await snap(`N0${i + 1}-micro`, '真正顯示的五個小檢核採v3白話原文。');
      await click(`#hint-toggle`);
      await snap(`N0${i + 1}-micro-hint`, '點提示後顯示v3小檢核提示。');
      await click('#hint-toggle');
      const wrong = (m.answer + 1) % 4;
      await click(`[data-micro="${wrong}"]`);
      await click('#micro-submit');
      await snap(`N0${i + 1}-micro-wrong`, '故意答錯一個v3小檢核，顯示該選項原句回饋。');
      await retryScript(p);
      await finishScriptNode(p, S, i, { skipMicro: true });
      await click(`[data-micro="${m.answer}"]`);
      await click('#micro-submit');
    }
    await snap(`N0${i + 1}-correct`, '依畫面完成操作與小檢核，下一關按鈕可見。');
    await click('#next-node');
  }
  await snap('ending', '結尾遮圖，依序回答三組人手。');
  await click('[data-trace="1"]');
  await click('[data-trace="0"]');
  await click('#hint-toggle');
  await click('#trace-review');
  await snap('ending-review', '回看按鈕實際帶回該關。');
  await click('#return-quiz');
  for (let j = 1; j < 3; j++) await click('[data-trace="0"]');
  await snap('ending-full', '三格答對後全圖與結語。');
  await click('#enter-assessment');
  await snap('transition', '考核前鼓勵頁，核對頂端標題。');
  const title = await p.locator('h1').innerText();
  await click('#start-quiz');
  await snap('assessment', '進入正式考核，題幹原文未改。');
  for (let k = 0; k < 5; k++) {
    const { model } = await p.evaluate(() => window.StudentScriptUI.getState()),
      q = data.pool.find((q) => q.group === model.order[k] && q.side === model.sides[q.group]);
    await click(`[data-pool="${q.answer}"]`);
    await click('#pool-submit');
    if (q.reasons) {
      await click(`[data-pool="${q.reasonAnswer}"]`);
      await click('#pool-submit');
    }
  }
  await snap('assessment-complete', '五組考核全對，完成事件一次。');
  const result = {
    title,
    geometry,
    errors,
    completionEvents: events.length,
    steps: seen,
    scriptSha256: S.sha256,
  };
  fs.writeFileSync(
    path.join(out, 'independent-results.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
  console.log(JSON.stringify({ title, errors, complete: events.length, captures: seen.length }));
} finally {
  await browser.close();
}
