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

const WIDGETS = { 'ecg-sim': () => window.EcgSim, 'bp-cuff': () => Heart2.cuff };
const QUESTION_TYPES = { label: () => window.EcgLabel };

function renderLab(lab, figures) {
  const widget = lab.widget && WIDGETS[lab.widget]?.();
  const prediction = lab.predict ? `<h3>${esc(lab.predict.question)}</h3><div class="options predict">${lab.predict.options.map((o,i)=>`<button data-answer="${i}">${esc(o)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p>` : '';
  const visual = lab.widget ? `<div class="lab-widget" data-widget="${esc(lab.widget)}">${widget ? widget.html(lab) : ''}</div>`
    : `<div class="state-figure" data-lab-state="${lab.states[0].id}" data-state="${lab.states[0].id}">${figures[lab.figure]}</div><div class="state-controls">${lab.states.map((x,i)=>`<button data-lab-state="${x.id}" aria-pressed="${!i}">${esc(x.label)}</button>`).join('')}</div><p class="state-explain" aria-live="polite">${esc(lab.states[0].explain)}</p>`;
  return `<section class="lab"><h2>${esc(lab.title)}</h2><p>${esc(lab.intro)}</p>${visual}${prediction}</section>`;
}

function renderQuestion(q) {
  const type = q.type && q.type !== 'mcq' ? QUESTION_TYPES[q.type]?.() : null;
  if (type) return `<h3>${esc(q.stem)}</h3><div class="q-widget" data-type="${esc(q.type)}">${type.html(q)}</div>`;
  return `<h3>${esc(q.stem)}</h3><div class="options">${shuffle(q.options.map((text, answer) => ({ text, answer }))).map(o => `<button data-answer="${o.answer}">${esc(o.text)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p>`;
}

// Normalize punctuation before comparison; split compound points to retain only new clauses.
function summaryClauses(text) {
  return text.split(/[。；;\n]+/).map(s=>s.trim()).filter(Boolean);
}
function summaryKey(text) { return text.replace(/[\s，、：:（）()「」『』]/g,''); }
function summaryRow(row) {
  const seen=[];
  return row.map((cell,i)=>{
    if(i===0)return cell;
    const keep=[];
    for(const clause of summaryClauses(cell)) {
      const key=summaryKey(clause);
      if(!key || seen.some(s=>s===key || (s.length>=6 && key.length>=6 && (s.includes(key)||key.includes(s)))))continue;
      seen.push(key);keep.push(clause);
    }
    return keep.join('；') || '—';
  });
}
function renderSummary(content) {
  const table = content.summaryTable || {headers:['主題','關鍵概念','整理重點'], rows:content.nodes.map(n => [n.title,n.summary,n.points.join('；')])};
  const rows=table.rows.map(summaryRow);
  return `<section class="learning-summary" aria-labelledby="summary-title"><h2 id="summary-title">重點整理表</h2><p>把相關概念放在一起比較；回到知識節點可看完整圖解。</p><table><caption>${esc(content.title)}｜概念比較</caption><thead><tr>${table.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>i?`<td${cell==='—'?' class="summary-empty-cell"':''} data-label="${esc(table.headers[i])}">${esc(cell)}</td>`:`<th scope="row">${esc(cell)}</th>`).join('')}</tr>`).join('')}</tbody></table></section>`;
}

export function render(content, figures) {
  const stage = (rows, kind) => rows.map((q, i) => `<article class="stage" data-kind="${kind}" data-question-id="${q.id}" data-index="${i}" ${i ? 'hidden' : ''}>${renderQuestion(q)}</article>`).join('');
  return `<main class="kit" data-slug="${content.slug}">`
    + `<header class="hero"><p>${esc(content.label)}</p><h1>${esc(content.title)}</h1><p>${esc(content.subtitle)}</p></header>`
    + (content.experience === 'guided' ? '<div class="prefs-bar"><label>字級 <select data-pref="font"><option value="1">標準</option><option value="1.15">較大</option><option value="1.3">最大</option></select></label></div><button type="button" data-go-quiz>兩階段隨堂診斷</button>' : '')
    + `<section class="stats">${content.stats.map(x => `<div class="tile"><strong>${esc(x.value)}</strong>${esc(x.label)}</div>`).join('')}</section>`
    + renderLab(content.lab, figures)
    + `<section><h2>知識節點</h2><div class="nodes">${content.nodes.map(n => `<button class="node-button" data-node="${n.id}" aria-expanded="false" aria-controls="detail-${n.id}"><strong>${esc(n.title)}</strong><br>${esc(n.summary)}</button>`).join('')}`
    + content.nodes.map(n => `<article class="node-detail" id="detail-${n.id}" data-node-id="${n.id}" hidden><div class="node-figure" role="img" aria-label="${esc(n.title)} 示意圖">${figures[n.figure]}</div>${n.caption?`<p class="figure-caption">${esc(n.caption)}</p>`:''}<h2>${esc(n.title)}</h2><p>${esc(n.concept)}</p><ul>${n.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul><div class="clinical"><strong>${esc(n.clinical.title)}</strong><br>${esc(n.clinical.text)}</div>${n.reference?`<p class="material-reference">${esc(n.reference)}</p>`:''}<button type="button" data-close-node="${n.id}">收合</button></article>`).join('')
    + `</div></section>`
    + (content.overview?.type === 'factor-tree' ? Heart2.tree(content.overview) : '')
    + (content.extras ? Heart2.extras(content.extras, figures) : '')
    + (content.misconceptions ? Heart2.misconceptions(content.misconceptions) : '')
    + renderSummary(content)
    + `<section class="quiz"><h2>第一關｜先備知識</h2>${stage(content.foundation, 'foundation')}<h2>第二關｜情境應用</h2>${stage(content.cases, 'case').replace('data-index="0"', 'data-index="0" hidden')}</section>`
    + '<p class="complete-banner" hidden role="status">本輪第二關五題全對，已通關！</p>'
    + `<footer class="credits">${(content.credits || []).map(esc).join('<br>')}</footer></main>`;
}

export function mount(content, figures) {
  document.body.innerHTML = render(content, figures);
  const guided = content.experience === 'guided';
  document.querySelector('[data-go-quiz]')?.addEventListener('click', () => document.querySelector('.quiz').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  document.querySelector('[data-pref="font"]')?.addEventListener('change', e => document.documentElement.style.setProperty('--font-scale', e.target.value));
  document.querySelector('[data-pref="theme"]')?.addEventListener('change', e => document.documentElement.dataset.theme = e.target.value);
  const selectPanel = id => document.querySelectorAll('.state-figure [data-panel]').forEach(g => { g.style.display = g.dataset.panel === id ? '' : 'none'; });
  selectPanel(content.lab.states?.[0]?.id);
  const CL = window.CourseLearning || { explore() {}, nodeTime() {}, answer() {}, hint() {}, complete() {} };

  // 知識節點：第一次展開送 explore；收合或分頁隱藏時送前景停留秒數
  const opened = new Map(), explored = new Set();
  const buttons = [...document.querySelectorAll('.node-button')];
  const closeNode = id => {
    document.querySelector('#detail-' + id).hidden = true;
    buttons.find(b => b.dataset.node === id)?.setAttribute('aria-expanded', 'false');
    const start = opened.get(id);
    if (start !== undefined) CL.nodeTime(id, (performance.now() - start) / 1000);
    opened.delete(id);
  };
  // 詳細內容橫跨所在列；依實際卡片位置定位，亦支援窄版與字級調整。
  const placeDetail = id => {
    const button = buttons.find(b => b.dataset.node === id);
    const detail = document.querySelector('#detail-' + id);
    detail.hidden = true;
    const rowTop = button.offsetTop;
    const last = buttons.filter(b => b.offsetTop === rowTop).at(-1);
    last.after(detail);
    detail.hidden = false;
  };
  const revealNode = id => {
    const button = buttons.find(b => b.dataset.node === id);
    const detail = document.querySelector('#detail-' + id);
    if (!button || !detail) return;
    buttons.filter(b => b.dataset.node !== id && b.getAttribute('aria-expanded') === 'true').forEach(b => closeNode(b.dataset.node));
    const wasClosed = detail.hidden;
    placeDetail(id);
    button.setAttribute('aria-expanded', 'true');
    if (wasClosed) {
      if (!explored.has(id)) { explored.add(id); CL.explore(id); }
      opened.set(id, performance.now());
    }
    // 精簡卡片與詳細內容頂端一起留在視窗中。
    button.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  buttons.forEach(b => b.addEventListener('click', () => {
    if (b.getAttribute('aria-expanded') === 'true') closeNode(b.dataset.node);
    else revealNode(b.dataset.node);
  }));
  document.querySelectorAll('[data-close-node]').forEach(b => b.addEventListener('click', () => {
    closeNode(b.dataset.closeNode);
    const button = buttons.find(x => x.dataset.node === b.dataset.closeNode);
    button.focus({ preventScroll: true });
    button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
  new ResizeObserver(() => {
    const active = buttons.find(b => b.getAttribute('aria-expanded') === 'true');
    if (active) placeDetail(active.dataset.node);
  }).observe(document.querySelector('.nodes'));
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
      selectPanel(id);
      document.querySelectorAll('button[data-lab-state]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      document.querySelector('.state-explain').textContent = content.lab.states.find(x => x.id === id).explain;
    }));
  }
  document.querySelector('.predict')?.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const ok = +b.dataset.answer === content.lab.predict.answer;
      const feedback = b.parentElement.nextElementSibling;
      b.parentElement.querySelectorAll('button').forEach(x => { x.classList.remove('predict-correct','predict-wrong'); x.setAttribute('aria-pressed',String(x===b)); });
      b.classList.add(ok ? 'predict-correct' : 'predict-wrong');
      feedback.className = `feedback predict-result ${ok ? 'ok' : 'warn'}`;
      feedback.textContent = ok ? `✓ 答對了！${content.lab.predict.feedback}` : '✗ 尚未答對。再比對圖中的狀態與箭頭，想想變化方向後再試一次。';
    });
  if(content.overview?.type==='factor-tree') Heart2.mountTree(document.querySelector('.factor-tree'),content.overview,revealNode);

  // 兩關題目：逐題答對才解鎖；第二關全部答對才送 complete
  let foundation = 0, cases = 0, completionSent = false;
  // 學習成果在最後一題答對時成立；呈現結果不應是回報前提。
  const reportCompletion = () => {
    if (completionSent) return;
    completionSent = true;
    CL.complete();
  };
  const openForReview = revealNode;
  const restartCases = () => {
    cases = 0;
    completionSent = false;
    document.querySelector('.complete-banner').hidden = true;
    document.querySelectorAll('[data-kind="case"]').forEach((item, index) => {
      item.hidden = index !== 0;
      if (guided) item.innerHTML = renderQuestion(content.cases[index]);
      item.querySelectorAll('button[data-answer]').forEach(button => { button.disabled = false; });
      const feedback = item.querySelector('.feedback'); if (feedback) feedback.textContent = '';
    });
  };
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
      if (next) show(next); else { reportCompletion(); if (guided) document.querySelector('.complete-banner').hidden = false; }
    }
  };
  document.querySelectorAll('.stage').forEach(stage => {
    const kind = stage.dataset.kind, rows = kind === 'foundation' ? content.foundation : content.cases;
    const q = rows[+stage.dataset.index];
    const type = q.type && q.type !== 'mcq' ? QUESTION_TYPES[q.type]?.() : null;
    if (type) { type.mount(stage.querySelector('.q-widget'), q, CL, () => advance(stage, kind)); return; }
    stage.addEventListener('click', e => {
      const b = e.target.closest('button[data-answer]'); if (!b || b.disabled || stage.hidden) return;
      const ok = +b.dataset.answer === q.answer;
      CL.answer(q.id, ok);
      const feedback = stage.querySelector('.feedback');
      if (!ok) {
        CL.hint?.(q.id);
        if (kind === 'foundation') { feedback.textContent = `提示：${q.hint}`; return; }
        stage.querySelectorAll('button[data-answer]').forEach(x => { x.disabled = true; });
        feedback.textContent = `提示：${q.hint} `;
        const review = document.createElement('button'); review.type = 'button'; review.textContent = '前往對應節點複習';
        const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = '重新挑戰本關'; retry.disabled = true;
        review.addEventListener('click', () => { openForReview(q.nodeId); retry.disabled = false; });
        retry.addEventListener('click', restartCases);
        feedback.append(review, retry); return;
      }
      feedback.textContent = '答對，繼續下一題。';
      stage.querySelectorAll('button').forEach(x => { x.disabled = true; });
      if (kind === 'case' && cases === content.cases.length - 1) reportCompletion();
      if (guided) {
        feedback.textContent = '答對。' + (q.explain || '');
        const next = document.createElement('button'); next.type = 'button';
        next.textContent = kind === 'case' && cases === content.cases.length - 1 ? '查看通關結果' : '繼續下一題';
        next.addEventListener('click', () => { advance(stage, kind); document.querySelector('.stage:not([hidden]), .complete-banner:not([hidden])')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, { once: true });
        feedback.append(next);
      } else setTimeout(() => advance(stage, kind), 250);
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
