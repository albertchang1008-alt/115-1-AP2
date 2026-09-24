import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// @ts-ignore 純 JS 模組
import { prFor, makeBeat, features, makeStrip, candidates, grade, rPeak } from '../materials-src/widgets/ecg-model.js';

const close = (a: number, b: number, eps = 0.001) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

test('心率 40／75／150／195 的間期符合規格 §2.1', () => {
  const expect: Record<number, [number, number, number]> = { 40: [0.19, 0.49, 1.01], 75: [0.16, 0.358, 0.442], 150: [0.13, 0.253, 0.147], 195: [0.121, 0.222, 0.086] };
  for (const [hr, [pr, qt, dia]] of Object.entries(expect)) {
    const rr = 60 / Number(hr), b = makeBeat(0, rr, Number(hr), rr);
    close(b.pr, pr); close(b.qt, qt); close(rr - b.qt, dia);
    assert.equal(b.qrs, 0.09);
    assert.ok(b.pr >= 0.12 && b.pr <= 0.20);
  }
  close(prFor(30), 0.19); close(prFor(250), 0.12);
});

test('心率 195 時 T 波結束到下一個 P 波起點 ≤ 0（波形重疊）', () => {
  const rr = 60 / 195, b = makeBeat(0, rr, 195, rr);
  assert.ok(rr - b.pr - b.qt <= 0);
});

test('QT 由前一個 R-R 決定：同一拍的參數不因之後心率改變而改變', () => {
  const b = makeBeat(0, 0.8, 75, 0.8), snapshot = { ...b };
  makeBeat(0.8, 0.4, 150, 0.8); // 下一拍才用新心率
  assert.deepEqual(b, snapshot);
  close(makeBeat(0, 0.4, 150, 0.8).qt, 0.4 * Math.sqrt(0.8));
});

test('標示題判定：正確框選、PR 段誤框、QRS 兩端過寬', () => {
  const beats = makeStrip(75, 4, 0.3), view = 3;
  const pr = candidates('PRi', beats, view)[0];
  assert.equal(grade('PRi', pr, beats, view, 0.03).ok, true);
  const seg = candidates('PRs', beats, view)[0];
  const wrong = grade('PRi', seg, beats, view, 0.03);
  assert.equal(wrong.ok, false); assert.equal(wrong.confusedWith, 'PRs');
  const qrs = candidates('QRS', beats, view)[0];
  const wide = grade('QRS', [qrs[0] - 0.03, qrs[1] + 0.03], beats, view, 0.025);
  assert.equal(wide.ok, false); assert.ok(wide.best.e1 < 0 && wide.best.e2 > 0);
});

test('只計入完整落在畫面內的波段；R-R 由 R 峰到下一個 R 峰', () => {
  const beats = makeStrip(60, 4, 0.9), view = 2;
  for (const key of ['P', 'QRS', 'T', 'RR']) for (const [a, z] of candidates(key, beats, view)) assert.ok(a >= 0 && z <= view);
  const f = features(beats[1], beats[2]);
  close(f.RR[1] - f.RR[0], 1.0); close(f.RR[0], rPeak(beats[1]));
});

test('ECG 建置檔：單檔、含 SDK、無 CDN、包含 widget 與全部題目 ID', () => {
  const html = fs.readFileSync('public/materials/ecg-basics-v1/index.html', 'utf8');
  const content = JSON.parse(fs.readFileSync('materials-src/ecg-basics/content.json', 'utf8'));
  assert.match(html, /course-learning\.js/); assert.doesNotMatch(html, /cdn\.|tailwind/i);
  assert.match(html, /window\.EcgSim/); assert.match(html, /window\.EcgLabel/);
  for (const item of [...content.nodes, ...content.foundation, ...content.cases]) assert.match(html, new RegExp(item.id));
  assert.equal(content.foundation.filter((q: any) => q.type === 'label').length, 4);
});
