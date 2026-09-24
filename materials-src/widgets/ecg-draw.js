// ECG 繪圖工具：校正方格、標籤（含碰撞避讓）、量測線與逐拍標示。
// 依賴 ecg-model.js 的 features、featureNames。

function ecgGrid(g, W, H, pxmm, base, x0 = 0) {
  g.fillStyle = '#050d1a';
  g.fillRect(0, 0, W, H);
  g.lineWidth = 1;
  for (let i = 0; x0 + i * pxmm <= W + 1; i++) {
    const x = Math.round(x0 + i * pxmm) + 0.5;
    g.strokeStyle = i % 5 === 0 ? 'rgba(16,185,129,0.30)' : 'rgba(16,185,129,0.09)';
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  }
  for (let j = 0; ; j++) {
    const up = base - j * pxmm, down = base + j * pxmm;
    if (up < 0 && down > H) break;
    for (const y of j === 0 ? [up] : [up, down]) {
      if (y < 0 || y > H) continue;
      g.strokeStyle = j % 5 === 0 ? 'rgba(16,185,129,0.30)' : 'rgba(16,185,129,0.09)';
      g.beginPath(); g.moveTo(x0, Math.round(y) + 0.5); g.lineTo(W, Math.round(y) + 0.5); g.stroke();
    }
  }
}

// 1 mV 校正方波（高 10 mm、寬 0.2 s），畫在左側保留區，不與波形重疊
function ecgCalPulse(g, pxmm, base) {
  const x0 = pxmm * 1.5, x1 = x0 + pxmm * 5;
  g.strokeStyle = 'rgba(253,224,71,0.85)'; g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x0 - pxmm, base); g.lineTo(x0, base); g.lineTo(x0, base - 10 * pxmm);
  g.lineTo(x1, base - 10 * pxmm); g.lineTo(x1, base); g.lineTo(x1 + pxmm, base);
  g.stroke();
}

function ecgPill(c, text, cx, cy0, col, placed) {
  c.font = '700 12px system-ui,-apple-system,sans-serif';
  const w = c.measureText(text).width + 12, x = cx - w / 2;
  let cy = cy0;
  if (placed) {
    for (const off of [0, 20, 40, -20, 60]) {
      const y = cy0 + off;
      if (!placed.some(p => x < p.x + p.w + 4 && p.x < x + w + 4 && Math.abs(p.y - y) < 19)) { cy = y; break; }
    }
    placed.push({ x, w, y: cy });
    if (cy !== cy0) {
      c.strokeStyle = col; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx, cy0); c.lineTo(cx, cy + (cy > cy0 ? -9 : 9)); c.stroke();
    }
  }
  c.fillStyle = 'rgba(5,13,26,0.88)'; c.strokeStyle = col; c.lineWidth = 1;
  c.beginPath();
  if (c.roundRect) c.roundRect(x, cy - 9, w, 18, 6); else c.rect(x, cy - 9, w, 18);
  c.fill(); c.stroke();
  c.fillStyle = col; c.textBaseline = 'middle'; c.textAlign = 'center';
  c.fillText(text, cx, cy + 0.5);
}

function ecgBracket(c, [a, z], y, yFrom, col, text, W, placed) {
  if (!(z > a) || a < -2 || z > W + 2) return;
  c.strokeStyle = col; c.lineWidth = 1; c.setLineDash([3, 3]);
  for (const x of [a, z]) { c.beginPath(); c.moveTo(x, yFrom); c.lineTo(x, y); c.stroke(); }
  c.setLineDash([]); c.lineWidth = 2;
  c.beginPath();
  c.moveTo(a, y); c.lineTo(z, y);
  c.moveTo(a, y - 5); c.lineTo(a, y + 5); c.moveTo(z, y - 5); c.lineTo(z, y + 5);
  c.stroke();
  ecgPill(c, text, (a + z) / 2, y, col, placed);
}

// o: { tToX, base, pxmm, H, W, mv, b, nb, layers:{wave,intv,mech} }
function ecgAnnotate(c, o) {
  const { tToX, base, pxmm, H, W, mv, b, nb, layers } = o;
  const F = features(b, nb), X = r => [tToX(r[0]), tToX(r[1])];
  const inView = ([a, z]) => z > a && a >= -2 && z <= W + 2;
  const sDepth = 0.25 * 10 * pxmm, rTop = base - 1.2 * 10 * pxmm;
  const placed = [];
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (layers.wave) {
    for (const [k, col, lab] of [['P', '#60a5fa', 'P 波'], ['QRS', '#f87171', 'QRS'], ['T', '#4ade80', 'T 波']]) {
      const [a, z] = X(F[k]);
      if (!inView([a, z])) continue;
      c.strokeStyle = col; c.lineWidth = 4.5; c.beginPath();
      let top = base;
      for (let x = a; x <= z + 0.01; x += 0.5) {
        const y = base - mv(F[k][0] + (x - a) / (z - a) * (F[k][1] - F[k][0])) * 10 * pxmm;
        if (x === a) c.moveTo(x, y); else c.lineTo(x, y);
        top = Math.min(top, y);
      }
      c.stroke();
      ecgPill(c, lab, (a + z) / 2, k === 'QRS' ? rTop - 12 : top - 14, col, placed);
    }
  }
  if (layers.intv) {
    for (const [k, col] of [['PRs', '#fbbf24'], ['ST', '#f472b6']]) {
      const [a, z] = X(F[k]);
      if (!inView([a, z]) || z - a < 2) continue;
      c.strokeStyle = col; c.lineWidth = 6;
      c.beginPath(); c.moveTo(a, base); c.lineTo(z, base); c.stroke();
      ecgPill(c, featureNames[k], (a + z) / 2, base + sDepth + 12, col, placed);
    }
    const r1 = base + sDepth + 34;
    ecgBracket(c, X(F.PRi), r1, base, '#fbbf24', 'PR 間隔', W, placed);
    ecgBracket(c, X(F.QT), r1 + 22, base, '#5eead4', 'QT 間隔', W, placed);
    if (F.RR) ecgBracket(c, X(F.RR), rTop - (layers.wave ? 34 : 12), rTop, '#c4b5fd', 'R-R 間期', W, placed);
  }
  if (layers.mech) {
    const nextQ = nb ? nb.start + nb.pr : b.start + b.rr + b.pr;
    const bands = [
      ['心房收縮', [b.start + b.pDur * 0.5, b.start + b.pr + 0.03], '251,191,36'],
      ['心室收縮', [b.start + b.pr + 0.03, b.start + b.end], '248,113,113'],
      ['心室舒張', [b.start + b.end, nextQ + 0.03], '56,189,248']
    ];
    const y = H - 19;
    c.font = '700 11px system-ui,-apple-system,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [lab, r, rgb] of bands) {
      const [a, z] = X(r);
      if (!inView([a, z])) continue;
      c.fillStyle = `rgba(${rgb},0.35)`; c.fillRect(a, y, z - a, 15);
      c.strokeStyle = `rgba(${rgb},0.9)`; c.lineWidth = 1; c.strokeRect(a + 0.5, y + 0.5, z - a - 1, 14);
      if (z - a > c.measureText(lab).width + 6) { c.fillStyle = '#fff'; c.fillText(lab, (a + z) / 2, y + 8); }
    }
  }
  c.restore();
}

// 設定 canvas 的 CSS 尺寸與 devicePixelRatio
function ecgSizeCanvas(cv, W, H) {
  const d = window.devicePixelRatio || 1;
  cv.width = Math.round(W * d); cv.height = Math.round(H * d);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const c = cv.getContext('2d');
  c.setTransform(d, 0, 0, d, 0, 0);
  return c;
}
