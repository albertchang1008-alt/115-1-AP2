/* Include this script in an interactive HTML material. No student identity is exposed. */
(() => {
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
    nodeTime(nodeId, seconds) { if (Number.isFinite(seconds) && seconds > 0) add({ type: 'node_time', nodeId: String(nodeId), seconds: Math.min(60, Math.floor(seconds)) }); },
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
