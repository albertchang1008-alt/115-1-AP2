// 第一關標示題（題型 "label"）：先自己標，再對答案。
// 依賴 ecg-model.js、ecg-draw.js。規格：docs/ECG_SIM_LABEL_SPEC.md §4.2。
window.EcgLabel = (() => {
  function html() {
    return `<div class="ecg-label">
  <div class="ecg-scope ecg-lscope">
    <canvas class="ecg-layer ecg-lgrid" aria-hidden="true"></canvas>
    <canvas class="ecg-layer ecg-ltrace" aria-hidden="true"></canvas>
    <canvas class="ecg-layer ecg-lover" role="img" aria-label="作答用心電圖：按住左右拖曳框出答案，或使用下方的起點、終點滑桿"></canvas>
    <div class="ecg-lbl">LEAD II • 25 mm/s • 10 mm/mV • 小格 0.04 秒・大格 0.20 秒</div>
  </div>
  <div class="ecg-sel">在心電圖上按住左右拖曳，框出你的答案。</div>
  <div class="ecg-ranges">
    <label>起點 <input class="ecg-start" type="range" min="0" step="0.01" value="0"></label>
    <label>終點 <input class="ecg-end" type="range" min="0" step="0.01" value="0"></label>
  </div>
  <div class="ecg-row">
    <button type="button" class="ecg-check" disabled>對答案</button>
    <button type="button" class="ecg-clear">重新框選</button>
    <button type="button" class="ecg-reveal" hidden>顯示正確位置</button>
  </div>
  <div class="ecg-fb" aria-live="polite" hidden></div>
</div>`;
  }

  // q: { id, target, tol, hint, explain }；onPass() 由元件庫前進到下一題
  function mount(el, q, CL, onPass) {
    const $ = s => el.querySelector(s);
    const scope = $('.ecg-lscope'), startIn = $('.ecg-start'), endIn = $('.ecg-end');
    let W = 0, H = 0, pxmm = 10, pxps = 250, base = 0, view = 3, g, c, o;
    const hr = 60 + Math.floor(Math.random() * 36);          // 每題隨機 60–95 bpm
    const beats = makeStrip(hr, 4, Math.random());             // 起點隨機落在心動週期中
    let sel = null, tries = 0, hinted = false, revealed = false, passed = false, answer = null;
    const mv = t => mvAt(beats, t);
    const box = e => (Math.abs(e) / 0.04).toFixed(1);

    function resize() {
      if (!scope.clientWidth) return; // 題目尚未顯示
      W = scope.clientWidth;
      view = W >= 700 ? 3 : 2; pxmm = W / (view * 25); pxps = pxmm * 25;
      H = Math.round(Math.max(190, Math.min(320, pxmm * 26)));
      scope.style.height = H + 'px';
      g = ecgSizeCanvas($('.ecg-lgrid'), W, H); c = ecgSizeCanvas($('.ecg-ltrace'), W, H); o = ecgSizeCanvas($('.ecg-lover'), W, H);
      base = Math.round(H * 0.64);
      startIn.max = endIn.max = String(view);
      if (sel) sel = [Math.min(sel[0], view), Math.min(sel[1], view)];
      draw();
    }
    function draw() {
      ecgGrid(g, W, H, pxmm, base, 0);
      c.clearRect(0, 0, W, H); c.strokeStyle = '#34d399'; c.lineWidth = 2.4; c.lineJoin = 'round'; c.beginPath();
      for (let x = 0; x <= W; x += 0.5) { const y = base - mv(x / pxps) * 10 * pxmm; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      overlay();
    }
    function overlay() {
      o.clearRect(0, 0, W, H);
      if (answer && (passed || revealed)) {
        const [a, z] = answer.map(t => t * pxps);
        o.fillStyle = 'rgba(74,222,128,0.18)'; o.fillRect(a, 0, z - a, H);
        o.strokeStyle = '#4ade80'; o.lineWidth = 2;
        for (const x of [a, z]) { o.beginPath(); o.moveTo(x, 0); o.lineTo(x, H); o.stroke(); }
        ecgPill(o, `正確：${featureNames[q.target]}`, (a + z) / 2, H - 14, '#4ade80');
      }
      if (sel) {
        const [a, z] = sel.map(t => t * pxps);
        o.fillStyle = 'rgba(253,224,71,0.16)'; o.fillRect(a, 0, z - a, H);
        o.strokeStyle = '#fde047'; o.lineWidth = 1.5; o.setLineDash([5, 4]);
        for (const x of [a, z]) { o.beginPath(); o.moveTo(x, 0); o.lineTo(x, H); o.stroke(); }
        o.setLineDash([]);
        ecgPill(o, `你的答案 ${(sel[1] - sel[0]).toFixed(2)} 秒`, (a + z) / 2, 34, '#fde047');
      }
    }
    function setSel(a, b) {
      if (passed) return;
      sel = [Math.max(0, Math.min(a, b)), Math.min(view, Math.max(a, b))];
      startIn.value = sel[0].toFixed(2); endIn.value = sel[1].toFixed(2);
      const d = sel[1] - sel[0];
      $('.ecg-sel').textContent = `你框的範圍：${d.toFixed(3)} 秒 ＝ ${(d / 0.04).toFixed(1)} 小格`;
      $('.ecg-check').disabled = d <= 0;
      overlay();
    }

    // 拖曳框選
    const ov = $('.ecg-lover');
    ov.style.touchAction = 'none';
    let drag = null;
    const tAt = e => Math.max(0, Math.min(W, e.clientX - ov.getBoundingClientRect().left)) / pxps;
    ov.addEventListener('pointerdown', e => { if (passed) return; drag = tAt(e); ov.setPointerCapture(e.pointerId); });
    ov.addEventListener('pointermove', e => { if (drag === null) return; const t = tAt(e); if (Math.abs(t - drag) * pxps >= 3) setSel(drag, t); });
    ov.addEventListener('pointerup', () => { drag = null; });
    // 鍵盤替代：起點／終點滑桿
    startIn.addEventListener('input', () => setSel(+startIn.value, sel ? sel[1] : +startIn.value));
    endIn.addEventListener('input', () => setSel(sel ? sel[0] : +endIn.value, +endIn.value));

    function hintOnce() { if (!hinted) { hinted = true; CL.hint?.(q.id); } }
    $('.ecg-check').addEventListener('click', () => {
      if (!sel || passed) return;
      const r = grade(q.target, sel, beats, view, q.tol);
      CL.answer?.(q.id, r.ok);
      const fb = $('.ecg-fb'); fb.hidden = false;
      if (r.ok) {
        passed = true; answer = r.best.range;
        const d = sel[1] - sel[0], ans = answer[1] - answer[0];
        const extra = q.target === 'RR'
          ? `你量到 R-R ＝ ${d.toFixed(2)} 秒，所以心率 ＝ 60 ÷ ${d.toFixed(2)} ≈ <b>${Math.round(60 / d)} 次/分</b>（本圖實際 ${hr} 次/分）。R-R 越短，心率越快。`
          : (q.explain || '');
        fb.className = 'ecg-fb ok';
        fb.innerHTML = `<b>答對了！</b>你框了 ${d.toFixed(3)} 秒（${(d / 0.04).toFixed(1)} 小格），標準答案 ${ans.toFixed(3)} 秒（${(ans / 0.04).toFixed(1)} 小格）。<br>${extra}`;
        $('.ecg-check').disabled = true; $('.ecg-reveal').hidden = true; $('.ecg-clear').disabled = true;
        startIn.disabled = endIn.disabled = true;
        overlay();
        setTimeout(onPass, 1600);
        return;
      }
      tries++; hintOnce();
      const parts = [];
      if (r.best) {
        parts.push(Math.abs(r.best.e1) > q.tol ? `起點${r.best.e1 < 0 ? '太早' : '太晚'} ${box(r.best.e1)} 小格` : '起點正確');
        parts.push(Math.abs(r.best.e2) > q.tol ? `終點${r.best.e2 < 0 ? '太早' : '太晚'} ${box(r.best.e2)} 小格` : '終點正確');
      }
      fb.className = 'ecg-fb no';
      fb.innerHTML = (r.confusedWith ? `<b>你框的比較像「${featureNames[r.confusedWith]}」。</b>` : `<b>還差一點：</b>${parts.join('，')}。`)
        + `<br>提示：${q.hint}` + (revealed ? '<br>請對照綠色的正確位置，自己再框一次。' : '');
      if (tries >= 2 && !revealed) $('.ecg-reveal').hidden = false;
    });
    $('.ecg-clear').addEventListener('click', () => {
      if (passed) return;
      sel = null; $('.ecg-check').disabled = true;
      $('.ecg-sel').textContent = '在心電圖上按住左右拖曳，框出你的答案。';
      overlay();
    });
    $('.ecg-reveal').addEventListener('click', () => {
      const cs = candidates(q.target, beats, view);
      answer = (sel && closest(q.target, sel, beats, view)?.range) || cs[Math.floor(cs.length / 2)];
      revealed = true; CL.hint?.(q.id);
      const ans = answer[1] - answer[0], fb = $('.ecg-fb');
      fb.hidden = false; fb.className = 'ecg-fb no';
      fb.innerHTML = `<b>正確位置已用綠色標出</b>（${ans.toFixed(3)} 秒 ＝ ${(ans / 0.04).toFixed(1)} 小格）。對照你黃色的框，看看差在哪裡，<b>再自己框一次</b>才能進下一題。`;
      $('.ecg-reveal').hidden = true;
      overlay();
    });

    el.__ecg = { get beats() { return beats; }, get view() { return view; }, get pxps() { return pxps; } }; // 供自動化驗收使用
    resize();
    el.closest('.stage')?.addEventListener('stage-show', resize);
    addEventListener('resize', () => { if (scope.clientWidth && scope.clientWidth !== W) resize(); });
    return { resize };
  }

  return { html, mount };
})();
