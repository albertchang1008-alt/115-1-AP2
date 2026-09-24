// ECG 教學模型（純函式）：監視器、放大檢視與標示題共用。
// 數值依 docs/ECG_SIM_LABEL_SPEC.md §2.1；以秒為單位，每一拍以 P 波起點為 0。

export const featureNames = {
  P: 'P 波', PRi: 'PR 間隔', PRs: 'PR 段', QRS: 'QRS 群波',
  ST: 'ST 段', T: 'T 波', QT: 'QT 間隔', RR: 'R-R 間期'
};

// 房室傳導隨自律神經小幅變化：迷走延長、交感縮短（仍在 0.12–0.20 s 內）
export function prFor(hr) {
  const pts = [[40, 0.19], [75, 0.16], [150, 0.13], [200, 0.12]];
  if (hr <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (hr <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return y0 + (y1 - y0) * (hr - x0) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
}

// 建立一拍。rr＝這一拍到下一拍的間隔；prevRR＝前一個 R-R（決定 QT，Bazett）
export function makeBeat(start, rr, hr, prevRR = rr) {
  const pDur = hr > 150 ? 0.08 : 0.09, pr = prFor(hr), qrs = 0.09;
  const qt = 0.40 * Math.sqrt(prevRR);
  const tDur = Math.min(0.16, 0.75 * (qt - qrs));
  return { start, rr, pDur, pr, qrs, qt, tDur, tStart: pr + qt - tDur, end: pr + qt };
}

// 單一拍在 x 秒（相對該拍 P 起點）的電位（mV）
export function beatMv(b, x) {
  if (x < 0 || x > b.end) return 0;
  if (x < b.pDur) return 0.15 * Math.sin(Math.PI * x / b.pDur);
  const q = x - b.pr;
  if (q >= 0 && q < 0.02) return -0.10 * (q / 0.02);
  if (q >= 0.02 && q < 0.05) return -0.10 + 1.30 * ((q - 0.02) / 0.03);
  if (q >= 0.05 && q < 0.08) return 1.20 - 1.45 * ((q - 0.05) / 0.03);
  if (q >= 0.08 && q < 0.09) return -0.25 + 0.25 * ((q - 0.08) / 0.01);
  const t = x - b.tStart;
  if (t >= 0 && t < b.tDur) {
    let u = t / b.tDur;
    u = u < 0.62 ? u / 0.62 * 0.5 : 0.5 + (u - 0.62) / 0.38 * 0.5; // 上升慢、下降快
    return 0.30 * Math.sin(Math.PI * u);
  }
  return 0;
}

// 多拍疊加（心率很快時 P 波會疊到前一個 T 波上）
export function mvAt(beats, t) {
  let s = 0;
  for (const b of beats) s += beatMv(b, t - b.start);
  return s;
}

export function rPeak(b) { return b.start + b.pr + 0.05; }

// 一拍的各波段（絕對時間）；next 存在時才有 R-R
export function features(b, next) {
  const s = b.start;
  const f = {
    P: [s, s + b.pDur], PRi: [s, s + b.pr], PRs: [s + b.pDur, s + b.pr],
    QRS: [s + b.pr, s + b.pr + b.qrs], ST: [s + b.pr + b.qrs, s + b.tStart],
    T: [s + b.tStart, s + b.end], QT: [s + b.pr, s + b.end]
  };
  if (next) f.RR = [rPeak(b), rPeak(next)];
  return f;
}

// 固定心率的一段心電圖（標示題用）：起點隨機落在心動週期中
export function makeStrip(hr, seconds, offset) {
  const rr = 60 / hr, beats = [];
  for (let st = -offset * rr; st < seconds + rr; st += rr) beats.push(makeBeat(st, rr, hr, rr));
  return beats;
}

// 所有完整落在 [0, view] 秒內的某類波段
export function candidates(key, beats, view) {
  const out = [];
  for (let i = 0; i < beats.length; i++) {
    const r = features(beats[i], beats[i + 1])[key];
    if (r && r[0] >= -1e-6 && r[1] <= view + 1e-6) out.push(r);
  }
  return out;
}

// 最接近的波段與起訖誤差（秒）
export function closest(key, sel, beats, view) {
  let best = null;
  for (const r of candidates(key, beats, view)) {
    const e1 = sel[0] - r[0], e2 = sel[1] - r[1], m = Math.max(Math.abs(e1), Math.abs(e2));
    if (!best || m < best.m) best = { range: r, e1, e2, m };
  }
  return best;
}

// 判定：起點與終點誤差都 ≤ tol 才算對；答錯時若框選符合另一種波段，回報 confusedWith
export function grade(target, sel, beats, view, tol, confuseTol = 0.03) {
  const best = closest(target, sel, beats, view);
  const ok = !!best && Math.abs(best.e1) <= tol && Math.abs(best.e2) <= tol;
  let confusedWith = null;
  if (!ok) {
    let bestOther = null;
    for (const key of Object.keys(featureNames)) {
      if (key === target) continue;
      const m = closest(key, sel, beats, view);
      if (m && m.m <= confuseTol && (!bestOther || m.m < bestOther.m)) bestOther = { key, m: m.m };
    }
    confusedWith = bestOther ? bestOther.key : null;
  }
  return { ok, best, confusedWith };
}

// 心率區間的生理說明（非診斷用語）
export function physioZone(hr) {
  if (hr < 60) return 'slow';
  if (hr < 100) return 'rest';
  if (hr < 180) return 'fast';
  return 'max';
}
