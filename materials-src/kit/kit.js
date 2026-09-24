// 教材元件庫：由 content.json 產生單檔互動教材（六節點＋兩關題目＋SDK 回報）。
// 擴充點：lab.widget（例如 "ecg-sim"）與題型 type（例如 "label"），由 materials-src/widgets/ 提供。
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Fisher–Yates 洗牌（無偏差）
const shuffle = rows => {
  const a = [...rows];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const WIDGETS = { 'ecg-sim': () => window.EcgSim };
const QUESTION_TYPES = { label: () => window.EcgLabel };

function renderLab(lab, figures) {
  const widget = lab.widget && WIDGETS[lab.widget]?.();
  if (lab.widget) {
    return `<section class="lab"><h2>${esc(lab.title)}</h2><p>${esc(lab.intro)}</p><div class="lab-widget" data-widget="${esc(lab.widget)}">${widget ? widget.html(lab) : ''}</div></section>`;
  }
  return `<section class="lab"><h2>${esc(lab.title)}</h2><p>${esc(lab.intro)}</p>`
    + `<div class="state-figure" data-lab-state="${lab.states[0].id}" data-state="${lab.states[0].id}">${figures[lab.figure]}</div>`
    + `<div class="state-controls">${lab.states.map((x, i) => `<button data-lab-state="${x.id}" aria-pressed="${!i}">${esc(x.label)}</button>`).join('')}</div>`
    + `<p class="state-explain" aria-live="polite">${esc(lab.states[0].explain)}</p>`
    + `<h3>${esc(lab.predict.question)}</h3><div class="options predict">${lab.predict.options.map((o, i) => `<button data-answer="${i}">${esc(o)}</button>`).join('')}</div>`
    + `<p class="feedback" aria-live="polite"></p></section>`;
}

function renderQuestion(q) {
  const type = q.type && q.type !== 'mcq' ? QUESTION_TYPES[q.type]?.() : null;
  if (type) return `<h3>${esc(q.stem)}</h3><div class="q-widget" data-type="${esc(q.type)}">${type.html(q)}</div>`;
  return `<h3>${esc(q.stem)}</h3><div class="options">${shuffle(q.options.map((text, answer) => ({ text, answer }))).map(o => `<button data-answer="${o.answer}">${esc(o.text)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p>`;
}

export function render(content, figures) {
  const stage = (rows, kind) => rows.map((q, i) => `<article class="stage" data-kind="${kind}" data-index="${i}" ${i ? 'hidden' : ''}>${renderQuestion(q)}</article>`).join('');
  return `<main class="kit" data-slug="${content.slug}">`
    + `<header class="hero"><p>${esc(content.label)}</p><h1>${esc(content.title)}</h1><p>${esc(content.subtitle)}</p></header>`
    + `<section class="stats">${content.stats.map(x => `<div class="tile"><strong>${esc(x.value)}</strong>${esc(x.label)}</div>`).join('')}</section>`
    + renderLab(content.lab, figures)
    + `<section><h2>知識節點</h2><div class="nodes">${content.nodes.map(n => `<button class="node-button" data-node="${n.id}" aria-expanded="false" aria-controls="detail-${n.id}"><img alt="" src="data:image/svg+xml,${encodeURIComponent(figures[n.figure])}"><strong>${esc(n.title)}</strong><br>${esc(n.summary)}</button>`).join('')}</div>`
    + content.nodes.map(n => `<article class="node-detail" id="detail-${n.id}" data-node-id="${n.id}" hidden><img class="node-figure" alt="${esc(n.title)} 示意圖" src="data:image/svg+xml,${encodeURIComponent(figures[n.figure])}"><h2>${esc(n.title)}</h2><p>${esc(n.concept)}</p><ul>${n.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul><div class="clinical"><strong>${esc(n.clinical.title)}</strong><br>${esc(n.clinical.text)}</div></article>`).join('')
    + `</section>`
    + `<section class="quiz"><h2>第一關｜先備知識</h2>${stage(content.foundation, 'foundation')}<h2>第二關｜情境應用</h2>${stage(content.cases, 'case').replace('data-index="0"', 'data-index="0" hidden')}</section>`
    + `<footer class="credits">${(content.credits || []).map(esc).join('<br>')}</footer></main>`;
}

export function mount(content, figures) {
  document.body.innerHTML = render(content, figures);
  const CL = window.CourseLearning || { explore() {}, nodeTime() {}, answer() {}, hint() {}, complete() {} };

  // 知識節點：第一次展開送 explore；收合或分頁隱藏時送前景停留秒數
  const opened = new Map(), explored = new Set();
  document.querySelectorAll('[data-node]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.node, d = document.querySelector('#detail-' + id), was = d.hidden;
    d.hidden = !was; b.setAttribute('aria-expanded', String(was));
    if (was) { if (!explored.has(id)) { explored.add(id); CL.explore(id); } opened.set(id, performance.now()); }
    else { const start = opened.get(id); if (start) CL.nodeTime(id, (performance.now() - start) / 1000); opened.delete(id); }
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { for (const [id, start] of opened) CL.nodeTime(id, (performance.now() - start) / 1000); opened.clear(); }
  });

  // 情境實驗室
  if (content.lab.widget) {
    const root = document.querySelector('.lab-widget');
    WIDGETS[content.lab.widget]?.()?.mount(root, content.lab, CL);
  } else {
    document.querySelectorAll('button[data-lab-state]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.labState;
      const fig = document.querySelector('.state-figure');
      fig.dataset.labState = id; fig.dataset.state = id; // data-state 供圖檔內 CSS 切換狀態
      document.querySelectorAll('button[data-lab-state]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      document.querySelector('.state-explain').textContent = content.lab.states.find(x => x.id === id).explain;
    }));
    document.querySelector('.predict').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const ok = +b.dataset.answer === content.lab.predict.answer;
      b.parentElement.nextElementSibling.textContent = ok ? content.lab.predict.feedback : '再比對圖中的狀態與箭頭。';
    });
  }

  // 兩關題目：逐題答對才解鎖；第二關全部答對才送 complete
  let foundation = 0, cases = 0;
  const show = el => { el.hidden = false; el.dispatchEvent(new CustomEvent('stage-show')); };
  const advance = (stage, kind) => {
    stage.hidden = true;
    if (kind === 'foundation') {
      foundation++;
      const next = document.querySelector(`[data-kind="foundation"][data-index="${foundation}"]`);
      show(next || document.querySelector('[data-kind="case"][data-index="0"]'));
    } else {
      cases++;
      const next = document.querySelector(`[data-kind="case"][data-index="${cases}"]`);
      if (next) show(next); else CL.complete();
    }
  };
  document.querySelectorAll('.stage').forEach(stage => {
    const kind = stage.dataset.kind, rows = kind === 'foundation' ? content.foundation : content.cases;
    const q = rows[+stage.dataset.index];
    const type = q.type && q.type !== 'mcq' ? QUESTION_TYPES[q.type]?.() : null;
    if (type) { type.mount(stage.querySelector('.q-widget'), q, CL, () => advance(stage, kind)); return; }
    stage.addEventListener('click', e => {
      const b = e.target.closest('button[data-answer]'); if (!b) return;
      const ok = +b.dataset.answer === q.answer;
      CL.answer(q.id, ok);
      const feedback = stage.querySelector('.feedback');
      if (!ok) { CL.hint?.(q.id); feedback.textContent = `提示：${q.hint}`; return; }
      feedback.textContent = '答對，繼續下一題。';
      stage.querySelectorAll('button').forEach(x => { x.disabled = true; });
      setTimeout(() => advance(stage, kind), 250);
    });
  });
}

// 舊版三段節律圖（ecg-rate.svg）的狀態切換；保留相容
document.addEventListener('click', event => {
  const button = event.target.closest('button[data-lab-state]'); if (!button) return;
  const figure = document.querySelector('.state-figure'), state = button.dataset.labState; if (!figure) return;
  figure.querySelectorAll('.slow,.rest,.fast').forEach(group => { group.style.display = group.classList.contains(state) ? 'block' : 'none'; });
});
document.addEventListener('DOMContentLoaded', () => {
  const figure = document.querySelector('.state-figure');
  figure?.querySelector('.slow')?.style.setProperty('display', 'block');
});
