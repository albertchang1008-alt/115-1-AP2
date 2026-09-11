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
    complete() { add({ type: 'completed' }); },
  };
  if (parent !== window) parent.postMessage({ type: 'ready' }, '*');
})();
