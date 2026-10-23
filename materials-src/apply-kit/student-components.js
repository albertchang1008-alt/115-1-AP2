// Shared by acid-base and the nine scripted materials. Answers stay in original indices.
function createStudentInteractionCore(state) {
  function order(key, count, renew = false) {
    state.orders ||= {};
    const prior = state.orders[key];
    if (prior && !renew) return prior;
    const values = Array.from({ length: count }, (_, j) => j);
    for (let j = count - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [values[j], values[k]] = [values[k], values[j]];
    }
    if (prior && count > 1 && values.every((v, j) => v === prior[j])) values.push(values.shift());
    return (state.orders[key] = values);
  }
  return {
    order,
    reshuffle() {
      for (const [key, values] of Object.entries(state.orders || {}))
        order(key, values.length, true);
    },
    fail(kind) {
      state.retry = kind;
      state.retryAt = Date.now() + 400;
    },
    retryReady() {
      return !!state.retry && Date.now() >= state.retryAt;
    },
    freshMatch(key, rows, choices = rows) {
      return {
        values: Array(rows).fill(null),
        locked: [],
        complete: false,
        order: order(key, choices),
        feedback: [],
      };
    },
  };
}
function renderStudentMatching({ n, m, ui, errors, retry, txt, mi, button }) {
  const count = m.values.filter((v) => v !== null).length;
  const guide = ui.guideStep
    ? `<aside class="matching-guide" role="status" data-guide-step="${ui.guideStep}"><p>${mi('guide' + ui.guideStep)}</p><div>${button('match-skip', mi('skip'))}${ui.guideStep === 3 ? button('match-understood', mi('understood')) : ''}</div></aside>`
    : '';
  const rows = n.cards
    .map((id, row) => {
      const fixed = m.locked.includes(row),
        value = m.values[row],
        active = ui.openRow === row;
      const menu =
        active && !ui.pendingSwap
          ? `<section class="matching-menu" aria-label="選擇工作說明">${m.order
              .map((value) => {
                const used = n.unique === false ? -1 : m.values.findIndex((v) => v === value);
                return `<button data-match-choice="${value}">${txt(n.slots[value])}${used >= 0 && used !== row ? `<small>${mi('used')} ${txt(n.cards[used])}</small>` : ''}</button>`;
              })
              .join('')}${button('match-close', mi('cancel'))}</section>`
          : '';
      return `<div class="matching-row ${errors.includes(row) ? 'wrong' : ''} ${fixed ? 'fixed' : ''} ${active ? 'active-row' : ''}">
      <button data-match-role="${row}" ${fixed ? 'disabled' : ''} aria-expanded="${active}">${txt(id)}</button>
      <button data-match-open="${row}" ${fixed ? 'disabled' : ''} aria-expanded="${active}">${value === null ? mi('pick') : txt(n.slots[value])}</button>
      ${errors.includes(row) ? `<small>${mi('wrong')}</small><p class="matching-feedback" data-row-feedback="${row}">${(m.feedback?.[row] || []).map(txt).join(' ')}</p>` : ''}${menu}
      ${ui.pendingSwap?.row === row ? `<div class="matching-swap" role="status"><p>${mi('used')} ${txt(n.cards[ui.pendingSwap.other])}</p>${button('match-swap', mi('swap'))}${button('match-cancel', mi('cancel'))}</div>` : ''}</div>`;
    })
    .join('');
  return `<section class="matching-ui"><div class="matching-tools">${mi('progress' + count)}${button('match-help', mi('help'))}</div>${guide}<div class="matching-rows guide-${ui.guideStep || 0} ${ui.openRow !== null && !ui.pendingSwap ? 'picking' : ''}">${rows}</div>${!m.complete && !retry ? `<button id="match-check" ${count < n.cards.length ? 'disabled' : ''}>${mi('check')}</button>` : m.complete ? `<p role="status">${mi('correct')}</p>` : ''}</section>`;
}
function bindStudentMatching({ n, m, ui, render, save, closeGuide, onCheck }) {
  const by = (id) => document.getElementById(id);
  const close = () => {
    ui.pendingSwap = null;
    ui.openRow = null;
    if (ui.guideStep === 2) ui.guideStep = 1;
    render();
  };
  document.querySelectorAll('[data-match-role],[data-match-open]').forEach(
    (b) =>
      (b.onclick = () => {
        const row = Number(b.dataset.matchRole ?? b.dataset.matchOpen);
        if (m.locked.includes(row)) return;
        ui.openRow = row;
        ui.pendingSwap = null;
        if (ui.guideStep === 1) ui.guideStep = 2;
        render();
        by('match-close')?.focus();
      }),
  );
  document.querySelectorAll('[data-match-choice]').forEach(
    (b) =>
      (b.onclick = () => {
        const value = Number(b.dataset.matchChoice),
          other = n.unique === false ? -1 : m.values.findIndex((v) => v === value);
        if (other >= 0 && other !== ui.openRow) {
          ui.pendingSwap = { row: ui.openRow, other, value };
          render();
          by('match-swap')?.focus();
          return;
        }
        m.values[ui.openRow] = value;
        ui.openRow = null;
        if (ui.guideStep === 2) ui.guideStep = 3;
        save();
        render();
      }),
  );
  if (by('match-swap'))
    by('match-swap').onclick = () => {
      const { row, other, value } = ui.pendingSwap;
      if (m.locked.includes(other)) return;
      m.values[other] = m.values[row];
      m.values[row] = value;
      ui.pendingSwap = null;
      ui.openRow = null;
      if (ui.guideStep === 2) ui.guideStep = 3;
      save();
      render();
    };
  for (const id of ['match-cancel', 'match-close']) if (by(id)) by(id).onclick = close;
  if (by('match-help'))
    by('match-help').onclick = () => {
      ui.guideStep = m.complete ? 3 : 1;
      render();
    };
  for (const id of ['match-skip', 'match-understood']) if (by(id)) by(id).onclick = closeGuide;
  if (by('match-check'))
    by('match-check').onclick = () => {
      if (m.values.some((v) => v === null)) return;
      const wrong = m.values
        .map((v, row) => (v !== (n.expected?.[row] ?? row) ? row : -1))
        .filter((v) => v >= 0);
      m.complete = !wrong.length;
      m.locked = m.complete ? n.cards.map((_, row) => row) : [];
      ui.guideStep = null;
      onCheck(wrong);
    };
  document.querySelector('.matching-menu')?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}
