/* Include this script in an interactive HTML material. No student identity is exposed. */
(() => {
  const sdkUrl = document.currentScript?.src;
  const preserveFonts = () => {
    const root = document.documentElement;
    if (root.dataset.readability !== 'on') return;
    const tools = [...document.querySelectorAll('[data-readability-zoom]')].map(
      (e) => [e, e.style.display],
    );
    for (const [e] of tools) e.style.display = 'none';
    root.removeAttribute('data-readability');
    // Read every original size before writing variables: inheritance cannot feed back.
    const rows = [...document.querySelectorAll('body,body *')]
      .filter(
        (e) =>
          !(e instanceof SVGElement) &&
          !e.closest('svg,dialog.course-readability-zoom'),
      )
      .map((e) => [e, getComputedStyle(e).fontSize]);
    for (const [e, size] of rows)
      e.style.setProperty('--readability-original-font', size);
    root.dataset.readability = 'on';
    for (const [e, display] of tools) e.style.display = display;
    // Use the material's own responsive arrow-label layout, never custom coordinates.
    if (window.StudentScriptUI) {
      window.dispatchEvent(new Event('resize'));
      displayObserver.takeRecords();
    }
  };
  const installZoom = () => {
    if (document.documentElement.dataset.readability !== 'on') return;
    for (const region of document.querySelectorAll(
      '.diagram-region,.node-figure,.state-figure',
    )) {
      if (
        region.closest('dialog') ||
        region.querySelector('[data-readability-zoom]')
      )
        continue;
      const graphic = region.matches('svg')
        ? region
        : region.querySelector('svg,img');
      if (!graphic) continue;
      // SVG roots cannot contain HTML controls: attach the independent button to their parent.
      const host = region.matches('svg') ? region.parentElement : region;
      if (host.querySelector(':scope > [data-readability-zoom]')) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.readabilityZoom = 'true';
      button.textContent = '🔍';
      button.setAttribute('aria-label', '放大圖像');
      button.onclick = () => {
        const dialog = document.createElement('dialog');
        dialog.className = 'course-readability-zoom';
        const close = document.createElement('button');
        close.textContent = '關閉';
        close.setAttribute('aria-label', '關閉放大圖像');
        const pane = document.createElement('div');
        pane.className = 'course-readability-zoom-pane';
        const copy = graphic.cloneNode(true);
        copy.style.position = 'static';
        copy.style.transform = 'none';
        copy.style.width =
          Math.max(
            1200,
            graphic.viewBox?.baseVal.width || graphic.naturalWidth || 1200,
          ) + 'px';
        copy.style.height = 'auto';
        copy.style.maxWidth = 'none';
        copy.style.maxHeight = 'none';
        copy.setAttribute('role', 'img');
        for (const e of copy.querySelectorAll(
          '[role=button],[role=radio],[tabindex],[data-arrow-label],[data-figure-control]',
        )) {
          e.removeAttribute('role');
          e.removeAttribute('tabindex');
          e.removeAttribute('data-arrow-label');
          e.removeAttribute('data-figure-control');
        }
        pane.append(copy);
        dialog.append(close, pane);
        document.body.append(dialog);
        const leave = () => {
          dialog.close();
          dialog.remove();
          button.focus();
        };
        close.onclick = leave;
        dialog.addEventListener('cancel', (e) => {
          e.preventDefault();
          leave();
        });
        dialog.showModal();
      };
      host.append(button);
    }
  };
  const displayObserver = new MutationObserver((records) => {
    installZoom();
    if (records.some((r) => !(r.target instanceof SVGElement))) preserveFonts();
  });
  displayObserver.observe(document.documentElement, {
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'hidden'],
    subtree: true,
  });
  const display = (d) => {
    if (
      d.protocolVersion !== 1 ||
      ![0.875, 1, 1.15, 1.3].includes(d.fontScale) ||
      typeof d.overlay !== 'boolean'
    )
      return;
    const root = document.documentElement;
    root.style.setProperty('--font-scale', String(d.fontScale));
    if (!d.overlay) {
      root.removeAttribute('data-readability');
      root.removeAttribute('data-readability-kit');
      document.getElementById('course-readability-overlay')?.remove();
      document
        .querySelectorAll('[data-readability-zoom],.course-readability-zoom')
        .forEach((e) => e.remove());
      return;
    }
    root.dataset.readability = 'on';
    root.dataset.readabilityKit =
      document.querySelector('.scripted-course') || window.StudentScriptUI
        ? 'apply-kit-script'
        : document.querySelector('[data-node],.learning-app,.lab')
          ? 'learning-kit'
          : 'other';
    installZoom();
    preserveFonts();

    if (!document.getElementById('course-readability-overlay') && sdkUrl) {
      const css = document.createElement('link');
      css.id = 'course-readability-overlay';
      css.rel = 'stylesheet';
      css.onload = () => {
        preserveFonts();
      };
      css.href = new URL('readability-overlay.css', sdkUrl).href;
      document.head.append(css);
    }
  };
  let context = null, pending = [], lastAction = Date.now(), lastTick = Date.now();
  const flush = () => {
    if (!context || !pending.length || parent === window) return;
    parent.postMessage({ ...context, type: 'learning-events', events: pending.slice(0, 30) }, '*');
  };
  const add = (event) => {
    if (pending.length >= 2000) return;
    pending.push({ id: crypto.randomUUID(), ...event }); flush();
  };
  window.addEventListener('message', (event) => {
    if (event.source !== parent || !event.data) return;
    const d = event.data;
    if (d.type === 'display-prefs') { display(d); return; }
    if (d.type === 'init' && d.protocolVersion === 1 && d.activityId && d.sessionId) {
      context = { protocolVersion: 1, activityId: d.activityId, sessionId: d.sessionId, materialVersion: d.materialVersion };
      flush();
    }
    if (d.type === 'learning-ack' && context && d.sessionId === context.sessionId && Array.isArray(d.accepted)) pending = pending.filter((e) => !d.accepted.includes(e.id));
  });
  ['pointerdown', 'keydown', 'touchstart'].forEach((type) => window.addEventListener(type, () => { lastAction = Date.now(); }, { passive: true }));
  setInterval(() => {
    const now = Date.now(), seconds = Math.min(15, Math.floor((now - lastTick) / 1000)); lastTick = now;
    if (!document.hidden && now - lastAction < 60000 && seconds > 0) add({ type: 'time', seconds });
    flush();
  }, 15000);
  document.addEventListener('visibilitychange', flush);
  window.CourseLearning = {
    explore(nodeId) { add({ type: 'explore', nodeId }); },
    answer(questionId, correct) { add({ type: 'answer', questionId: String(questionId), correct: !!correct }); },
    hint(questionId) { add({ type: 'hint', questionId: String(questionId) }); },
    nodeTime(nodeId, seconds) { if (!Number.isFinite(seconds)) return; const whole = Math.min(60, Math.floor(seconds)); if (whole > 0) add({ type: 'node_time', nodeId: String(nodeId), seconds: whole }); },
    complete() { add({ type: 'completed' }); },
    // 給長條捲動版面的教材用：幫內容區塊加 data-node-id，呼叫一次這個方法即可自動用
    // IntersectionObserver 偵測捲動進度，不用每份教材各自重寫一次觀察器邏輯。
    // 節點第一次進入畫面時送一次 explore(nodeId)；離開畫面或分頁被隱藏時，把這段
    // 可見期間累積的秒數送一次 nodeTime(nodeId, seconds)（上限由 nodeTime 內部處理）。
    trackScrollNodes(selector = '[data-node-id]', threshold = 0.4) {
      const nodes = document.querySelectorAll(selector);
      const seen = new Set();
      const enteredAt = new Map();
      const flush = (nodeId, now) => {
        const start = enteredAt.get(nodeId);
        if (start == null) return;
        enteredAt.delete(nodeId);
        const seconds = (now - start) / 1000;
        if (seconds > 0) this.nodeTime(nodeId, seconds);
      };
      const observer = new IntersectionObserver((entries) => {
        const now = performance.now();
        entries.forEach((entry) => {
          const nodeId = entry.target.dataset.nodeId;
          if (!nodeId) return;
          if (entry.isIntersecting) {
            if (!seen.has(nodeId)) {
              seen.add(nodeId);
              this.explore(nodeId);
            }
            if (!enteredAt.has(nodeId)) enteredAt.set(nodeId, now);
          } else {
            flush(nodeId, now);
          }
        });
      }, { threshold });
      nodes.forEach((node) => observer.observe(node));
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          const now = performance.now();
          enteredAt.forEach((_, nodeId) => flush(nodeId, now));
        }
      });
      return observer;
    },
  };
  if (parent !== window) parent.postMessage({ type: 'ready' }, '*');
})();
