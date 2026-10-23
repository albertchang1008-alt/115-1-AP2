/** Pure prerequisite and paired-retry state; no scores, timers, or clinical simulation. */
export function createAcidbaseModel() {
  const groups = ['P', 'R', 'K', 'N', 'S'];
  const order = () =>
    groups
      .map((v) => ({ v, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map((x) => x.v);
  const fresh = () => ({
    nodes: Array.from({ length: 6 }, () => ({ task: false, micro: false, edges: false })),
    foundation: [],
    order: order(),
    side: 'A',
    sides: Object.fromEntries(groups.map((g) => [g, Math.random() < 0.5 ? 'A' : 'B'])),
    cases: [],
    casePassed: false,
    trace: false,
    sent: false,
  });
  const nodeReady = (state, i) => ['task', 'micro', 'edges'].every((k) => state.nodes[i]?.[k]);
  const allNodes = (state) =>
    state.nodes.length === 6 && state.nodes.every((_, i) => nodeReady(state, i));
  const learningReady = (state) =>
    state.scriptMode
      ? [0, 1, 2, 3, 5].every((i) => state.nodes[i]?.micro)
      : state.foundation.length === 6;
  const canComplete = (state) =>
    allNodes(state) &&
    learningReady(state) &&
    state.casePassed &&
    state.cases.length === 5 &&
    state.trace;
  const pair = (config, state) =>
    (state.order || groups).map((g) =>
      config.pool.find((q) => q.group === g && q.side === (state.sides?.[g] || state.side)),
    );
  function markNode(state, i, step, correct) {
    if (!Number.isInteger(i) || i < 0 || i > 5 || !['task', 'micro', 'edges'].includes(step))
      throw Error('節點狀態無效');
    if (!correct) return false;
    if (step === 'micro' && !state.nodes[i].task) return false;
    if (step === 'edges' && !state.nodes[i].micro) return false;
    state.nodes[i][step] = true;
    return true;
  }
  function answerFoundation(state, i, correct) {
    if (!nodeReady(state, i) || state.foundation.length !== i || !correct) return false;
    state.foundation.push(i);
    return true;
  }
  function answerCase(state, q, answer, reason) {
    if (
      !allNodes(state) ||
      !learningReady(state) ||
      (state.order || groups)[state.cases.length] !== q.group ||
      q.side !== (state.sides?.[q.group] || state.side)
    )
      return false;
    const ok = answer === q.answer && (!q.reasons || reason === q.reasonAnswer);
    if (ok) {
      state.cases.push(q.id);
      state.casePassed = state.cases.length === 5;
    }
    return ok;
  }
  function retry(state) {
    state.order = order();
    if (state.sides) for (const g of groups) state.sides[g] = state.sides[g] === 'A' ? 'B' : 'A';
    state.side = state.side === 'A' ? 'B' : 'A';
    state.cases = [];
    state.casePassed = false;
    state.trace = false;
  }
  function complete(state) {
    if (!canComplete(state) || state.sent) return false;
    state.sent = true;
    return true;
  }
  return {
    fresh,
    nodeReady,
    allNodes,
    canComplete,
    pair,
    markNode,
    answerFoundation,
    answerCase,
    retry,
    complete,
  };
}
