// ECG 心率模擬器（lab widget "ecg-sim"）：即時掃描監視器、暫停選拍＋放大標示、卡尺。
// 依賴 ecg-model.js、ecg-draw.js。規格：docs/ECG_SIM_LABEL_SPEC.md §2–§3。
window.EcgSim = (() => {
  const SPEED = 25, GAIN = 10; // mm/s、mm/mV
  const PRESETS = [[40, '40'], [52, '52 運動員靜息'], [75, '75 安靜'], [100, '100'], [150, '150'], [195, '195 接近最大心率']];
  const PHYSIO = {
    slow: '<b>較慢心率區間（&lt;60）：</b>迷走神經釋放乙醯膽鹼，經 M₂ 受體增加 K⁺ 外流、減少 I<sub>f</sub> 與 Ca²⁺ 電流，竇房結第 4 期自動去極化變慢；房室結傳導也變慢，所以 PR 略為延長（仍在正常範圍）。PR 與 QRS 幾乎不變，<b>變長的主要是舒張期</b>。耐力運動員靜息 50 次左右屬正常生理現象。',
    rest: '<b>安靜範圍（60–100）：</b>正常安靜時，竇房結每分鐘約放電 70~80 次。心率在這個範圍內上下變動，主要來自迷走神經（副交感）張力的增減：迷走張力增加心跳變慢，減少則心跳變快。',
    fast: '<b>較快心率區間（&gt;100）：需要交感神經興奮。</b>正腎上腺素經 β₁ 受體增加 I<sub>f</sub> 與 L 型 Ca²⁺ 電流，竇房結放電加快；房室結傳導加快使 PR 縮短，QT 也稍縮短。但 QT 縮得比 R-R 少，所以<b>舒張期被大幅壓縮</b>，心室充血時間變少。',
    max: '<b>接近最大心率（青少年約 200 次）：</b>舒張期只剩不到 0.1 秒，P 波貼近前一個 T 波。心率再快，心室來不及充血，每搏輸出量開始下降，這也是最大心率有上限的原因之一。'
  };

  function html(lab) {
    const e = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return `<div class="ecg-sim">
  <div class="ecg-ctrl">
    <div class="ecg-hr"><span class="ecg-hr-out">75</span><small>bpm 目標心率</small></div>
    <div class="ecg-chips">${PRESETS.map(([v, t]) => `<button type="button" class="ecg-chip" data-hr="${v}" aria-pressed="${v === 75}">${t}</button>`).join('')}</div>
  </div>
  <input class="ecg-slider" type="range" min="40" max="200" value="75" step="1" aria-label="目標心率（每分鐘次數）">
  <div class="ecg-scale" aria-hidden="true"><span>40</span><span>60</span><span>100</span><span>150</span><span>200</span></div>
  <div class="ecg-row">
    <label class="ecg-tg"><input type="checkbox" class="ecg-rsa">呼吸性竇性心律不整 <small>（吸氣變快、吐氣變慢）</small></label>
    <label class="ecg-tg"><input type="checkbox" class="ecg-lag">自律神經反應時間 <small>（迷走神經幾乎立即反應，交感神經需數秒）</small></label>
    <button type="button" class="ecg-pause">暫停</button>
  </div>
  <div class="ecg-status" aria-live="off"></div>
  <div class="ecg-physio"></div>
  <div class="ecg-scope">
    <canvas class="ecg-layer ecg-grid" aria-hidden="true"></canvas>
    <canvas class="ecg-layer ecg-trace" aria-hidden="true"></canvas>
    <canvas class="ecg-layer ecg-over" tabindex="0" role="img" aria-label="心電圖監視器（Lead II）。暫停後可用左右方向鍵選擇心跳、Esc 關閉放大檢視。"></canvas>
    <div class="ecg-lbl"></div>
  </div>
  <p class="ecg-hint">按「暫停」後：<b>點一下</b>某一拍（或用 ←／→）→ 下方放大並標示該拍（可切換標示圖層）；<b>按住拖曳</b> → 卡尺量時間。</p>
  <div class="ecg-zoom-wrap" hidden>
    <div class="ecg-zoom-head">
      <div><b>放大檢視：選取的這一拍</b><small>紙速與振幅同樣是 25 mm/s、10 mm/mV，只是放大顯示；方格仍是 0.04 秒／0.1 mV。</small></div>
      <button type="button" class="ecg-zoom-close">關閉</button>
    </div>
    <div class="ecg-layers" role="group" aria-label="標示圖層">
    <span>標示圖層</span>
    <label class="ecg-tg"><input type="checkbox" class="ecg-lay-wave" checked>波形（P／QRS／T）</label>
    <label class="ecg-tg"><input type="checkbox" class="ecg-lay-intv" checked>間隔與段（PR、QT、R-R／PR 段、ST 段）</label>
    <label class="ecg-tg"><input type="checkbox" class="ecg-lay-mech">對應的機械事件 <small>（約略時間）</small></label>
  </div>
    <div class="ecg-zoom">
      <canvas class="ecg-layer ecg-zgrid" aria-hidden="true"></canvas>
      <canvas class="ecg-layer ecg-ztrace" aria-hidden="true"></canvas>
      <canvas class="ecg-layer ecg-zover" aria-hidden="true"></canvas>
    </div>
  </div>
  <div class="ecg-reads"></div>
  <div class="ecg-bar-cap"><span>一次心跳（R-R）中的時間分配</span><span class="ecg-bar-rr"></span></div>
  <div class="ecg-bar"><div class="ecg-sys"></div><div class="ecg-dia"></div></div>
  <p class="ecg-gap"></p>
  <p class="ecg-sr" aria-live="polite"></p>
  <p class="ecg-note">${e(lab.note || '')}</p>
</div>`;
  }

  function mount(root) {
    const $ = s => root.querySelector(s);
    const scope = $('.ecg-scope'), gridCv = $('.ecg-grid'), traceCv = $('.ecg-trace'), overCv = $('.ecg-over');
    let g, ctx, cx;
    const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = { target: 75, paused: reduceMotion, rsa: false, lag: false };

    // ---- geometry ----
    let W = 0, H = 0, dpr = 1, pxmm = 5, pxps = 125, base = 0, X0 = 0, SW = 0, secs = 6;
    // ---- simulation ----
    let simTime = 0, scanX = 0, lastPt = null, beats = [], nextBeatAt = 0.25, prevRR = 0.8, effHR = 75, lastShown = null;

    function resize() {
      W = scope.clientWidth; dpr = window.devicePixelRatio || 1;
      secs = W >= 700 ? 6 : 2.5;
      pxmm = W / (secs * SPEED); pxps = pxmm * SPEED;
      H = Math.round(Math.max(180, Math.min(280, pxmm * 30)));
      scope.style.height = H + 'px';
      g = ecgSizeCanvas(gridCv, W, H); ctx = ecgSizeCanvas(traceCv, W, H); cx = ecgSizeCanvas(overCv, W, H);
      base = Math.round(H * 0.62);
      X0 = Math.round(pxmm * 8); SW = W - X0;
      ecgGrid(g, W, H, pxmm, base, 0);
      ecgCalPulse(g, pxmm, base);
      g.fillStyle = 'rgba(5,13,26,0.55)'; g.fillRect(0, 0, X0 - 2, H); ecgCalPulse(g, pxmm, base);
      scanX = simTime > 0 ? (simTime * pxps) % SW : 0;
      redrawAll();
      $('.ecg-lbl').textContent = W >= 700
        ? `LEAD II • 25 mm/s • 10 mm/mV • 小格 0.04 秒／0.1 mV・大格 0.20 秒／0.5 mV・畫面約 ${(SW / pxps).toFixed(1)} 秒`
        : 'II • 25 mm/s • 小格 0.04 s • 大格 0.20 s';
      if (st.paused) drawOverlay();
    }

    const mv = t => mvAt(beats, t);
    const tToX = t => { let s = scanX - (simTime - t) * pxps; if (s < 0) s += SW; return X0 + s; };
    const xToT = x => { const s = x - X0; if (s < 0) return null; return s <= scanX ? simTime - (scanX - s) / pxps : simTime - (scanX + SW - s) / pxps; };
    const yOf = t => base - mv(t) * GAIN * pxmm;
    const eraseW = () => Math.max(18, pxmm * 4);

    function redrawAll() {
      ctx.clearRect(0, 0, W, H); lastPt = null;
      const step = dpr > 1 ? 0.5 : 1;
      ctx.lineWidth = 2.2; ctx.strokeStyle = '#34d399'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const segs = [[0, scanX, s => simTime - (scanX - s) / pxps], [scanX + eraseW(), SW, s => simTime - (scanX + SW - s) / pxps]];
      for (const [a, b, tf] of segs) {
        if (b - a < 1) continue;
        ctx.beginPath(); let started = false;
        for (let s = a; s <= b; s += step) {
          const t = tf(s); if (t < 0) { started = false; continue; }
          const y = yOf(t);
          if (!started) { ctx.moveTo(X0 + s, y); started = true; } else ctx.lineTo(X0 + s, y);
          if (a === 0) lastPt = [s, y];
        }
        ctx.stroke();
      }
    }

    function hrInstant(t) {
      let hr = effHR;
      if (st.rsa) {
        const vagal = Math.max(0, Math.min(1, (110 - effHR) / 50));
        hr *= 1 + 0.08 * vagal * Math.sin(2 * Math.PI * t / 4);
      }
      return hr;
    }

    let lastStatus = 0;
    function status(force) {
      const now = performance.now();
      if (!force && now - lastStatus < 200) return;
      lastStatus = now;
      const parts = [];
      const beatHR = lastShown ? Math.round(60 / lastShown.rr) : st.target;
      parts.push(`<span class="ecg-pill">這一拍 <b>${beatHR}</b> bpm</span>`);
      if (st.rsa) {
        const ph = Math.sin(2 * Math.PI * simTime / 4);
        const vagal = Math.max(0, Math.min(1, (110 - effHR) / 50));
        parts.push(vagal < 0.05
          ? '<span class="ecg-pill">呼吸：心率 &gt;110 時迷走張力低，呼吸變異幾乎消失</span>'
          : `<span class="ecg-pill ${ph >= 0 ? 'in' : 'ex'}">呼吸：${ph >= 0 ? '吸氣 ↑ 迷走張力降低 → R-R 變短' : '吐氣 ↓ 迷走張力增加 → R-R 變長'}</span>`);
      }
      if (st.lag && Math.abs(effHR - st.target) >= 1) {
        const up = st.target > effHR;
        parts.push(`<span class="ecg-pill adj">自律神經調整中：${Math.round(effHR)} → 目標 ${st.target} bpm（${up && effHR >= 100 ? '交感神經需數秒' : up ? '迷走撤除，約 1 秒' : '迷走神經幾乎立即'}）</span>`);
      }
      if (st.paused) parts.push('<span class="ecg-pill">已暫停：開關與心率在「繼續」後生效</span>');
      $('.ecg-status').innerHTML = parts.join('');
    }
    function update(dt) {
      if (st.lag) {
        const up = st.target > effHR;
        const tau = up ? (effHR >= 100 ? 6 : 1.2) : 0.8;
        effHR += (st.target - effHR) * (1 - Math.exp(-dt / tau));
      } else effHR = st.target;
      const t1 = simTime + dt;
      // 心率只影響「下一拍」：排程下一拍時才讀取心率
      while (nextBeatAt <= t1 + 0.5) {
        const rr = 60 / hrInstant(nextBeatAt);
        beats.push(makeBeat(nextBeatAt, rr, effHR, prevRR));
        prevRR = rr; nextBeatAt += rr;
      }
      // 逐像素計算波形（不是每個畫面只取一點）
      const step = dpr > 1 ? 0.5 : 1;
      ctx.lineWidth = 2.2; ctx.strokeStyle = '#34d399'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      let remaining = dt * pxps, t = simTime;
      while (remaining > 1e-9) {
        const seg = Math.min(remaining, SW - scanX), xs = scanX, xe = scanX + seg, ts = t;
        ctx.clearRect(X0 + xs + 1, 0, Math.min(eraseW(), SW - xs), H);
        ctx.beginPath();
        if (lastPt) ctx.moveTo(X0 + lastPt[0], lastPt[1]); else ctx.moveTo(X0 + xs, yOf(ts));
        for (let s = lastPt ? lastPt[0] + step : xs; s <= xe; s += step) {
          const y = yOf(ts + (s - xs) / pxps);
          ctx.lineTo(X0 + s, y); lastPt = [s, y];
        }
        ctx.stroke();
        scanX = xe; t += seg / pxps; remaining -= seg;
        if (scanX >= SW - 1e-6) { scanX = 0; lastPt = null; }
      }
      simTime = t1;
      beats = beats.filter(b => b.start + b.end > simTime - secs - 2);
      const done = beats.filter(b => b.start + b.pr <= simTime);
      const cur = done.length ? done[done.length - 1] : beats[0];
      if (cur && cur !== lastShown) { lastShown = cur; showReads(cur); }
      status();
    }

    // ---- readouts ----
    let lastZone = '', lastSr = 0;
    function showReads(b) {
      const f3 = x => x.toFixed(3), hr = 60 / b.rr, dia = b.rr - b.qt;
      const items = [
        ['心率', Math.round(hr), 'bpm'], ['R-R', b.rr.toFixed(2), '秒'],
        ['PR', f3(b.pr), '正常 0.12–0.20'], ['QRS', f3(b.qrs), '正常 ＜0.12'],
        ['QT', f3(b.qt), '隨心率小幅變化'], ['舒張期 (R-R−QT)', f3(dia), '秒']
      ];
      $('.ecg-reads').innerHTML = items.map(([k, v, n]) => `<div class="ecg-rd"><div class="k">${k}</div><div class="v">${v}</div><div class="n">${n}</div></div>`).join('');
      const s = Math.max(0, Math.min(1, b.qt / b.rr));
      $('.ecg-sys').style.width = (s * 100) + '%'; $('.ecg-dia').style.width = ((1 - s) * 100) + '%';
      $('.ecg-sys').textContent = s > 0.18 ? `收縮 QT ${Math.round(s * 100)}%` : '';
      $('.ecg-dia').textContent = (1 - s) > 0.18 ? `舒張 ${Math.round((1 - s) * 100)}%` : `${Math.round((1 - s) * 100)}%`;
      $('.ecg-bar-rr').textContent = `R-R ${b.rr.toFixed(2)} 秒`;
      const gap = b.rr - b.pr - b.qt;
      $('.ecg-gap').innerHTML = gap < 0.02
        ? `<b>T 波結束到下一個 P 波開始只剩 ${Math.max(0, gap).toFixed(2)} 秒${gap < 0 ? '（已重疊）' : ''}：</b>心率很快時 P 波會貼上甚至疊進前一個 T 波，這是真實心電圖的現象。`
        : `T 波結束到下一個 P 波開始：${gap.toFixed(2)} 秒。`;
      const zone = physioZone(effHR);
      if (zone !== lastZone) { $('.ecg-physio').innerHTML = PHYSIO[zone]; lastZone = zone; }
      const now = performance.now();
      if (now - lastSr > 1000) {
        lastSr = now;
        $('.ecg-sr').textContent = `心率 ${Math.round(hr)}，R-R ${b.rr.toFixed(2)} 秒，PR ${b.pr.toFixed(2)}，QRS ${b.qrs.toFixed(2)}，QT ${b.qt.toFixed(2)}，舒張期 ${dia.toFixed(2)} 秒`;
      }
    }

    // ---- paused tools: select beat / zoom / caliper ----
    let drag = null, calSpan = null, sel = null;
    const layers = () => ({ wave: $('.ecg-lay-wave').checked, intv: $('.ecg-lay-intv').checked, mech: $('.ecg-lay-mech').checked });
    const drawn = () => beats.filter(b => rPeak(b) <= simTime && rPeak(b) >= simTime - SW / pxps + 0.05);
    function selectBeat(b) {
      if (!b) return;
      const i = beats.indexOf(b), nb = beats[i + 1] && rPeak(beats[i + 1]) <= simTime ? beats[i + 1] : null;
      sel = { b, nb }; calSpan = null; drawOverlay();
    }
    function selectAt(x) {
      const t = xToT(x); if (t === null) return;
      let best = null, bd = 1e9;
      for (const b of drawn()) { const d = Math.abs(rPeak(b) - t); if (d < bd) { bd = d; best = b; } }
      selectBeat(best);
    }
    function drawOverlay() {
      cx.clearRect(0, 0, W, H);
      if (sel) {
        const a = tToX(sel.b.start - 0.03), z = tToX(sel.b.start + sel.b.end + 0.03);
        if (z > a) {
          cx.fillStyle = 'rgba(96,165,250,0.16)'; cx.fillRect(a, 0, z - a, H);
          cx.strokeStyle = 'rgba(96,165,250,0.9)'; cx.lineWidth = 1.5; cx.strokeRect(a + 0.5, 0.5, z - a - 1, H - 1);
          ecgPill(cx, '放大 ↓', (a + z) / 2, H - 14, '#93c5fd');
        }
      }
      if (calSpan) drawCal(calSpan[0], calSpan[1]);
      renderZoom();
    }
    function drawCal(a, b) {
      const dts = (b - a) / pxps;
      cx.strokeStyle = '#fde047'; cx.lineWidth = 1.5; cx.setLineDash([4, 3]);
      for (const x of [a, b]) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
      cx.setLineDash([]); cx.beginPath(); cx.moveTo(a, 24); cx.lineTo(b, 24); cx.stroke();
      const txt = `${dts.toFixed(3)} 秒 ＝ ${(dts / 0.04).toFixed(1)} 小格`;
      cx.font = '12px ui-monospace,Menlo,monospace'; cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
      const tw = cx.measureText(txt).width + 12, tx = Math.min(Math.max(a, 4), W - tw - 4);
      cx.fillStyle = 'rgba(15,23,42,0.9)'; cx.fillRect(tx, 30, tw, 20);
      cx.fillStyle = '#fde047'; cx.fillText(txt, tx + 6, 44);
    }
    function renderZoom() {
      const wrap = $('.ecg-zoom-wrap');
      if (!sel) { wrap.hidden = true; return; }
      wrap.hidden = false;
      const { b, nb } = sel, box = $('.ecg-zoom'), ZW = box.clientWidth;
      const nbR = nb ? rPeak(nb) : null;
      let t0 = b.start - 0.12;
      const need = (nbR ? nbR + 0.12 : b.start + b.end + 0.15) - t0;
      const target = Math.max(11, Math.min(22, ZW / 50));
      const win = Math.max(ZW / (SPEED * target), need);
      t0 -= (win - need) / 2;
      const zpx = ZW / (win * SPEED), zps = zpx * SPEED;
      const ZH = Math.round(165 + 14.5 * zpx), zbase = Math.round(64 + 12 * zpx);
      box.style.height = ZH + 'px';
      const zg = ecgSizeCanvas($('.ecg-zgrid'), ZW, ZH), zt = ecgSizeCanvas($('.ecg-ztrace'), ZW, ZH), zo = ecgSizeCanvas($('.ecg-zover'), ZW, ZH);
      ecgGrid(zg, ZW, ZH, zpx, zbase, 0);
      zt.strokeStyle = '#34d399'; zt.lineWidth = 2.6; zt.lineJoin = 'round'; zt.beginPath();
      let started = false;
      for (let x = 0; x <= ZW; x += 0.5) {
        const t = t0 + x / zps; if (t > simTime) break;
        const y = zbase - mv(t) * GAIN * zpx;
        if (started) zt.lineTo(x, y); else { zt.moveTo(x, y); started = true; }
      }
      zt.stroke();
      ecgAnnotate(zo, { tToX: t => (t - t0) * zps, base: zbase, pxmm: zpx, H: ZH, W: ZW, mv, b, nb, layers: layers() });
    }
    function clearTools() { calSpan = null; sel = null; drag = null; cx.clearRect(0, 0, W, H); $('.ecg-zoom-wrap').hidden = true; }

    const pos = e => e.clientX - overCv.getBoundingClientRect().left;
    overCv.style.touchAction = 'pan-y';
    overCv.addEventListener('pointerdown', e => { if (!st.paused) return; drag = { x0: pos(e), moved: false }; overCv.setPointerCapture(e.pointerId); });
    overCv.addEventListener('pointermove', e => {
      if (!drag) return; const x = pos(e);
      if (Math.abs(x - drag.x0) > 4) drag.moved = true;
      if (drag.moved) { calSpan = [Math.max(X0, Math.min(drag.x0, x)), Math.max(drag.x0, x)]; drawOverlay(); }
    });
    overCv.addEventListener('pointerup', () => { if (!drag) return; if (!drag.moved) selectAt(drag.x0); drag = null; });
    overCv.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sel) { sel = null; drawOverlay(); e.preventDefault(); return; }
      if (!st.paused || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      const list = drawn(); if (!list.length) return;
      let i = sel ? list.indexOf(sel.b) : -1;
      if (i < 0) i = list.length - 1; else i = Math.max(0, Math.min(list.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
      selectBeat(list[i]);
    });
    $('.ecg-zoom-close').addEventListener('click', () => { sel = null; drawOverlay(); });
    ['.ecg-lay-wave', '.ecg-lay-intv', '.ecg-lay-mech'].forEach(s => $(s).addEventListener('change', () => { if (sel) renderZoom(); }));

    // ---- controls ----
    const slider = $('.ecg-slider');
    function setTarget(v) {
      st.target = v; slider.value = v; $('.ecg-hr-out').textContent = v; status(true);
      root.querySelectorAll('.ecg-chip').forEach(c => c.setAttribute('aria-pressed', String(+c.dataset.hr === v)));
    }
    slider.addEventListener('input', e => setTarget(parseInt(e.target.value, 10)));
    root.querySelectorAll('.ecg-chip').forEach(c => c.addEventListener('click', () => setTarget(+c.dataset.hr)));
    $('.ecg-rsa').addEventListener('change', e => { st.rsa = e.target.checked; status(true); });
    $('.ecg-lag').addEventListener('change', e => { st.lag = e.target.checked; status(true); });
    const pauseBtn = $('.ecg-pause');
    function setPaused(p) {
      st.paused = p; pauseBtn.textContent = p ? '繼續' : '暫停';
      pauseBtn.setAttribute('aria-pressed', String(p));
      if (!p) clearTools();
      status(true);
    }
    pauseBtn.addEventListener('click', () => setPaused(!st.paused));

    // ---- loop ----
    let lastTs = 0;
    function loop(ts) {
      if (!lastTs) lastTs = ts;
      let dt = (ts - lastTs) / 1000; lastTs = ts;
      if (dt > 0.25) dt = 0; // 分頁隱藏後回來：跳過，不讓時間變形
      if (!st.paused && dt > 0) update(dt);
      requestAnimationFrame(loop);
    }
    resize();
    for (let i = 0; i < 60 * (secs - 0.5); i++) update(1 / 60); // 預先填滿畫面
    setPaused(st.paused);
    addEventListener('resize', () => { const w = scope.clientWidth; if (w && w !== W) resize(); else if (sel) renderZoom(); });
    requestAnimationFrame(loop);
    return { resize };
  }

  return { html, mount };
})();
