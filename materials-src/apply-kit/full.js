function mountAcidbaseFull(config) {
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const shuffle = (rows) =>
    [...rows]
      .map((v) => ({ v, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map((x) => x.v);
  const key = 'acidbase-full:2026-10-20-v1';
  let state = Model.fresh(),
    view = 'learn',
    node = 0,
    term = 'buffer',
    step = 'task',
    draft = {},
    answer = null,
    reason = null,
    tier = 1,
    feedback = '',
    reviewNeeded = false,
    reviewed = false,
    quizKind = 'foundation',
    quizIndex = 0,
    traceRevealed = false;
  let diagErrors = [];
  let gapIndex = 0;
  let demoSeen = false,
    demoRunning = false,
    demoToken = 0,
    recentFlip = '';
  const sdk = window.CourseLearning || {};
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (
      saved &&
      Array.isArray(saved.nodes) &&
      saved.nodes.length === 6 &&
      Array.isArray(saved.foundation) &&
      Array.isArray(saved.cases) &&
      ['A', 'B'].includes(saved.side)
    )
      state = saved;
  } catch {}
  if (state.pendingReview) {
    view = 'quiz';
    reviewNeeded = true;
    feedback = state.pendingReview.feedback;
    node = state.pendingReview.node;
  }
  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  };
  const emit = (name, ...args) => {
    try {
      sdk[name]?.(...args);
    } catch {}
  };
  const byId = (id) => document.getElementById(id);
  const arrowText = (chemical, target) =>
    target === '血液' ? '血液 ← ' + chemical : chemical + ' → 管液';
  const choiceField = (id, label, options, value) =>
    `<fieldset class="diagram-field ${diagErrors.includes(id) ? 'field-error' : ''}" id="${id}"><legend>${esc(label)}</legend><div class="field-options">${options.map((o) => `<button type="button" data-field="${id}" data-value="${esc(o)}" aria-pressed="${value === o}" class="${value === o ? 'selected' : ''}">${esc(o)}</button>`).join('')}</div></fieldset>`;
  const choices = (rows, attr, selected) =>
    `<div class="choice-grid">${shuffle(rows.map((text, i) => ({ text, i })))
      .map(
        (o) =>
          `<button ${attr}="${o.i}" class="choice ${selected === o.i ? 'selected' : ''}" aria-pressed="${selected === o.i}">${esc(o.text)}</button>`,
      )
      .join('')}</div>`;
  const qhtml = (q) => `<h2>${esc(q.stem)}</h2>${choices(q.options, 'data-choice', answer)}`;
  const activeEdges = () =>
    new Set(config.nodes.flatMap((n, i) => (state.nodes[i].edges ? n.edges : [])));
  function mapHtml(hidden = false) {
    if (hidden)
      return '<div class="memory-cover" id="memory-cover"><h2>先憑記憶追蹤一滴酸</h2><p>關係圖已遮住，完成三個功能判斷後再揭開核對。</p></div>';
    const edgeIds = activeEdges(),
      nodes = config.graph.nodes,
      edges = config.graph.edges;
    const positions = nodes.map((_, i) =>
      i === 0
        ? { x: 50, y: 50 }
        : {
            x: 50 + 35 * Math.cos(-Math.PI / 2 + ((i - 1) * 2 * Math.PI) / (nodes.length - 1)),
            y: 50 + 34 * Math.sin(-Math.PI / 2 + ((i - 1) * 2 * Math.PI) / (nodes.length - 1)),
          },
    );
    const lines = edges
      .map((e) => {
        const a = positions[nodes.findIndex((n) => n.id === e.from)],
          b = positions[nodes.findIndex((n) => n.id === e.to)],
          on = edgeIds.has(e.id);
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const trim = Math.min(
          0.44,
          Math.min(13 / (Math.abs(dx) || 1e-9), 9.5 / (Math.abs(dy) || 1e-9)),
        );
        const marker = e.relation === 'parallel' ? 'full-parallel-arrow' : 'full-cause-arrow';
        return `<line data-edge="${e.id}" class="${on ? 'revealed' : 'locked'} ${e.relation}" x1="${a.x + dx * trim}" y1="${a.y + dy * trim}" x2="${b.x - dx * trim}" y2="${b.y - dy * trim}" ${on ? `marker-end="url(#${marker})" ${e.relation === 'parallel' ? `marker-start="url(#${marker})"` : ''}` : ''}/>`;
      })
      .join('');
    return `<div class="full-map" id="mindmap" aria-label="內建心智圖"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="full-cause-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#176d9f"/></marker><marker id="full-parallel-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#784ca4"/></marker></defs>${lines}</svg>${edges
      .filter((e) => edgeIds.has(e.id) && e.sign)
      .map((e) => {
        const a = positions[nodes.findIndex((n) => n.id === e.from)],
          b = positions[nodes.findIndex((n) => n.id === e.to)];
        return `<span data-map-sign="${e.id}" class="map-sign solid-badge badge-solid-${e.sign}" style="left:${a.x * 0.35 + b.x * 0.65}%;top:${a.y * 0.35 + b.y * 0.65}%">${e.sign === 'up' ? '↑' : '↓'}</span>`;
      })
      .join(
        '',
      )}${nodes.map((n, i) => `<div data-map-node="${n.id}" class="map-node" style="left:${positions[i].x}%;top:${positions[i].y}%">${esc(n.label).replace(/HCO₃⁻|H₂CO₃|CO₂|H⁺|NH₄⁺|NH₃|7\.35–7\.45/g, (t) => `<span class="chem">${t}</span>`)}</div>`).join('')}<p class="map-count">${edgeIds.size}／${edges.length}；藍因果／紫協同</p></div>`;
  }
  function routeMapEdges() {
    const map = byId('mindmap');
    if (!map) return;
    const root = map.getBoundingClientRect();
    if (!root.width || !root.height) return;
    const boxes = new Map(
      config.graph.nodes.map((n) => {
        const r = map.querySelector(`[data-map-node="${n.id}"]`).getBoundingClientRect();
        return [n.id, { x: r.x - root.x, y: r.y - root.y, w: r.width, h: r.height }];
      }),
    );
    const occupied = [];
    for (const edge of config.graph.edges) {
      const line = map.querySelector(`[data-edge="${edge.id}"]`),
        a = boxes.get(edge.from),
        b = boxes.get(edge.to);
      const x = a.x + a.w / 2,
        y = a.y + a.h / 2,
        dx = b.x + b.w / 2 - x,
        dy = b.y + b.h / 2 - y;
      const exit = (box) =>
        Math.min(
          0.48,
          (box.w / 2 + 3) / (Math.abs(dx) || 1e-9),
          (box.h / 2 + 3) / (Math.abs(dy) || 1e-9),
        );
      const ta = exit(a),
        tb = exit(b),
        start = { x: x + dx * ta, y: y + dy * ta },
        end = { x: x + dx * (1 - tb), y: y + dy * (1 - tb) };
      for (const [k, v] of Object.entries({
        x1: (start.x / root.width) * 100,
        y1: (start.y / root.height) * 100,
        x2: (end.x / root.width) * 100,
        y2: (end.y / root.height) * 100,
      }))
        line.setAttribute(k, v);
      const badge = map.querySelector(`[data-map-sign="${edge.id}"]`);
      if (!badge) continue;
      const br = badge.getBoundingClientRect(),
        w = br.width,
        h = br.height;
      let point = null;
      const length = Math.hypot(dx, dy) || 1;
      search: for (const offset of [0, -12, 12, -24, 24, -40, 40]) {
        for (const f of [0.5, 0.32, 0.68, 0.2, 0.8, 0.12, 0.88]) {
          const p = {
            x: start.x + (end.x - start.x) * f - (dy / length) * offset,
            y: start.y + (end.y - start.y) * f + (dx / length) * offset,
          };
          const box = { x: p.x - w / 2 - 0.5, y: p.y - h / 2 - 0.5, w: w + 1, h: h + 1 };
          const overlaps = (r) =>
            box.x < r.x + r.w && box.x + box.w > r.x && box.y < r.y + r.h && box.y + box.h > r.y;
          if (
            box.x >= 0 &&
            box.y >= 0 &&
            box.x + box.w <= root.width &&
            box.y + box.h <= root.height &&
            ![...boxes.values(), ...occupied].some(overlaps)
          ) {
            point = p;
            occupied.push(box);
            break search;
          }
        }
      }
      if (point) {
        badge.style.left = (point.x / root.width) * 100 + '%';
        badge.style.top = (point.y / root.height) * 100 + '%';
      }
    }
  }
  function graphGap() {
    const n = config.nodes[node],
      i = gapIndex,
      e = config.graph.edges.find((e) => e.id === n.edges[i]);
    const from = config.graph.nodes.find((n) => n.id === e.from).label,
      to = config.graph.nodes.find((n) => n.id === e.to).label;
    return `<h2>補上這一段關係 ${i + 1}／${n.edges.length}</h2><p>比較條件相同；比值方向由課本公式作定性推論。</p>${
      e.sign === 'up' && i % 2 === 0
        ? choiceField('gap-' + i, `${from} → ${to}`, ['↑', '↓'], draft['gap-' + i])
        : choiceField(
            'gap-' + i,
            `補上「${to}」的來源節點`,
            config.graph.nodes
              .filter((n) => [e.from, e.to, 'node_chem_buffer', 'node_renal_system'].includes(n.id))
              .map((n) => n.label),
            draft['gap-' + i],
          )
    }<button id="gap-submit" class="primary">核對並長出連結</button>`;
  }
  function wireValues() {
    document.querySelectorAll('[data-field]').forEach((b) => {
      b.onclick = () => {
        draft[b.dataset.field] = b.dataset.value;
        diagErrors = diagErrors.filter((id) => id !== b.dataset.field);
        b.closest('fieldset').classList.remove('field-error');
        document.querySelectorAll(`[data-field="${b.dataset.field}"]`).forEach((other) => {
          const on = other === b;
          other.classList.toggle('selected', on);
          other.setAttribute('aria-pressed', String(on));
        });
        applyGuidance();
      };
    });
  }
  const svgStart = (name, paths) =>
    `<svg class="task-svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="${name}"><defs><marker id="flow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#24798c"/></marker></defs>${paths}</svg>`;
  const overlay = (x, y, w, h, html, extra = '') =>
    `<div class="diagram-overlay ${extra}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%">${html}</div>`;
  const hit = (id, text, selected = false, error = false) =>
    `<button type="button" id="${id}" class="diagram-hit ${selected ? 'selected' : ''} ${error ? 'field-error' : ''}" aria-pressed="${selected}">${text}</button>`;
  const band = (x, y, w, h, color = '#eef7fb') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}" stroke="#a8c7d3" stroke-width=".4"/>`;
  const pipe = (d, extra = '') =>
    `<path d="${d}" class="diagram-flow ${state.nodes[node]?.task ? 'flow-active' : ''} ${extra}" fill="none" stroke="#24798c" stroke-width="1.2" marker-end="url(#flow-head)"/>`;
  function miniMapSvg() {
    if (view === 'map' && Model.allNodes(state) && !traceRevealed)
      return '<span class="dock-covered">已遮圖</span>';
    const edgeIds = activeEdges(),
      nodes = config.graph.nodes,
      edges = config.graph.edges;
    const positions = nodes.map((_, i) =>
      i === 0
        ? { x: 50, y: 50 }
        : {
            x: 50 + 35 * Math.cos(-Math.PI / 2 + ((i - 1) * 2 * Math.PI) / (nodes.length - 1)),
            y: 50 + 34 * Math.sin(-Math.PI / 2 + ((i - 1) * 2 * Math.PI) / (nodes.length - 1)),
          },
    );
    return `<svg viewBox="0 0 100 100" class="dock-svg"><defs><marker id="mini-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#176d9f"/></marker></defs>${edges
      .filter((e) => edgeIds.has(e.id))
      .map((e) => {
        const a = positions[nodes.findIndex((n) => n.id === e.from)],
          b = positions[nodes.findIndex((n) => n.id === e.to)];
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#176d9f" stroke-width="1.8" marker-end="url(#mini-arrow)"/>`;
      })
      .join('')}${nodes
      .map((n, i) => {
        const p = positions[i];
        return `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${edgeIds.size ? '#2f8290' : '#aac4ce'}"/>`;
      })
      .join('')}</svg>`;
  }
  function operationItems() {
    const field = (id, label) => ({ key: id, selector: `#${id} button`, label, done: !!draft[id] });
    const action = (id, label, done) => ({
      key:
        { 'accept-h': 'bound', 'flip-h': 'arrow_h', 'flip-bicarb': 'arrow_bicarb', nh3: 'bound' }[
          id
        ] || id,
      selector: '#' + id,
      label,
      done,
    });
    return [
      [
        action('slot-buffer', '把標籤放進功能格', !!draft.slot_buffer),
        action('slot-lung', '把標籤放進功能格', !!draft.slot_lung),
        action('slot-kidney', '把標籤放進功能格', !!draft.slot_kidney),
      ],
      [field('numerator', '點分子格中的一個選項'), field('denominator', '點分母格中的一個選項')],
      [
        action('accept-h', '點圖上的「緩衝物承接H⁺」', !!draft.bound),
        field('carbonate', '為碳酸／HCO₃⁻選一個所在'),
        field('hemoglobin', '為血紅素選一個所在'),
        field('phosphate', '為磷酸鹽／銨選一個所在'),
      ],
      [action('effective', '點圖上的「有效CO₂排出增加」', !!draft.effective)],
      [
        action('flip-h', '點亮起的 H⁺ 箭頭本體，翻轉方向', draft.h === '管液'),
        action('flip-bicarb', '點亮起的 HCO₃⁻ 箭頭本體，翻轉方向', draft.bicarb === '血液'),
      ],
      [
        action('pick-h', '先點圖上的 H⁺', !!draft.pickH),
        action('nh3', '再點圖上的 NH₃，承接 H⁺', !!draft.bound),
        field('destination', '為 NH₄⁺選一個去向'),
      ],
    ][node];
  }
  function operationFaults() {
    const expected = [
      { slot_buffer: '化學緩衝', slot_lung: '肺', slot_kidney: '腎臟' },
      { numerator: 'HCO₃⁻', denominator: 'H₂CO₃' },
      { bound: true, carbonate: '細胞外', hemoglobin: '血球', phosphate: '尿端攜酸' },
      { effective: true },
      { h: '管液', bicarb: '血液' },
      { bound: true, destination: '尿端' },
    ][node];
    return Object.entries(expected)
      .filter(([id, value]) => draft[id] !== value)
      .map(([id]) => (id === 'h' ? 'arrow_h' : id === 'bicarb' ? 'arrow_bicarb' : id));
  }
  function guideHtml() {
    return `<div class="guide-heading"><h2 id="action-guide" aria-live="polite"></h2>${view === 'learn' && node === 0 && step === 'task' && !draft.diagramChecked ? '<button id="replay-demo" type="button">再看一次示範</button>' : ''}</div>`;
  }
  function startDemo() {
    if (demoRunning) return;
    demoRunning = true;
    const token = ++demoToken;
    const tag = document.querySelector('[data-tag="化學緩衝"]'),
      slot = byId('slot-buffer');
    if (!tag || !slot) {
      demoRunning = false;
      return;
    }
    const ghost = tag.cloneNode(true);
    ghost.removeAttribute('data-tag');
    ghost.id = 'demo-ghost';
    ghost.disabled = true;
    ghost.textContent = '化學緩衝';
    document.body.append(ghost);
    const a = tag.getBoundingClientRect(),
      b = slot.getBoundingClientRect();
    ghost.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;`;
    const guide = byId('action-guide');
    guide.textContent = '示範：先點標籤，再點功能格';
    for (const delay of [700, 1400, 3000])
      setTimeout(() => {
        if (token !== demoToken) return;
        const here = view === 'learn' && node === 0 && !draft.diagramChecked;
        if (delay === 700 && here) {
          tag.classList.add('guide-active');
          guide.textContent = '示範：① 點「化學緩衝」標籤';
        }
        if (delay === 1400 && here) {
          slot.classList.add('guide-active');
          guide.textContent = '示範：② 點功能格，標籤放進去';
          ghost.classList.add('demo-fly');
          ghost.style.left = b.left + 'px';
          ghost.style.top = b.top + 'px';
        }
        if (delay === 3000) {
          ghost.remove();
          demoSeen = true;
          demoRunning = false;
          if (here) applyGuidance();
        }
      }, delay);
    applyGuidance();
  }
  function applyGuidance() {
    const guide = byId('action-guide');
    if (!guide) return;
    const root = byId('figure');
    document
      .querySelectorAll('.guide-active,.guide-muted')
      .forEach((e) => e.classList.remove('guide-active', 'guide-muted'));
    const focus = (selectors, scope) => {
      const active = [...document.querySelectorAll(selectors)];
      document.querySelectorAll(scope).forEach((e) => {
        const on = active.includes(e);
        e.classList.toggle('guide-active', on);
        e.classList.toggle('guide-muted', !on);
        if (e instanceof HTMLButtonElement) e.disabled = !on;
        else e.setAttribute('aria-disabled', String(!on));
      });
    };
    if (view === 'map' && !traceRevealed) {
      const ids = ['trace-buffer', 'trace-lung', 'trace-kidney'],
        index = ids.findIndex((id) => !draft[id] || byId(id)?.classList.contains('field-error'));
      guide.textContent =
        index < 0
          ? '④ 三格已選好，點「提交回憶，再揭開核對」'
          : `${['①', '②', '③'][index]} ${['先選緩衝接住H⁺之後的狀態', '再選肺端排出物', '最後選腎端兩個去向'][index]}`;
      focus(index < 0 ? '#trace-check' : `#${ids[index]} button`, '#figure button,#trace-check');
      return;
    }
    if (view !== 'learn') return;
    const label =
      step === 'task'
        ? draft.diagramChecked
          ? '② 第 2 步：選答案，再點「送出」'
          : '① 第 1 步：圖上操作'
        : step === 'micro'
          ? '② 選出你的答案，再點「核對小檢核」'
          : step === 'edges'
            ? '③ 選一個選項，補上這段心智圖連結'
            : '④ 完成這一步，點「下一步 →」';
    guide.textContent = label;
    if (byId('replay-demo')) byId('replay-demo').disabled = false;
    if (byId('replay-demo'))
      byId('replay-demo').onclick = () => {
        demoSeen = false;
        startDemo();
      };
    if (step === 'task' && !draft.diagramChecked) {
      if (node === 0 && !demoSeen) {
        if (!demoRunning) {
          startDemo();
          return;
        }
        guide.textContent = '示範中：先看標籤怎麼放進功能格';
        focus('#demo-ghost', '#figure button,#diagram-next');
        byId('replay-demo').disabled = true;
        return;
      }
      if (node === 0) {
        document
          .querySelectorAll('[data-tag]')
          .forEach(
            (b) =>
              (b.disabled = ['slot_buffer', 'slot_lung', 'slot_kidney'].some(
                (k) => draft[k] === b.dataset.tag,
              )),
          );
        const full = ['slot_buffer', 'slot_lung', 'slot_kidney'].every((k) => draft[k]);
        const selected = !!draft.selectedTag;
        guide.textContent =
          full && diagErrors.length
            ? '① 點紅框裡已放的標籤取回，再重新配對'
            : full
              ? '① 配對放好了，點「完成圖上操作，開始答題 →」'
              : selected
                ? `① 已選「${draft.selectedTag}」，點一個功能格放入`
                : '換你了！① 點一張標籤';
        const selectors =
          full && diagErrors.length
            ? '.slot-target .field-error'
            : full
              ? '#diagram-next'
              : selected
                ? '.slot-target button'
                : '[data-tag]:not(:disabled)';
        // Previously placed slots remain available to retrieve, without revealing the correct target.
        focus(selectors, '#figure [data-tag],#figure .slot-target button,#diagram-next');
        if (!full)
          document.querySelectorAll('.slot-target button').forEach((e) => {
            if (!e.textContent.includes('點此放入')) e.disabled = false;
          });
      } else {
        const next = operationItems().find((x) => !x.done || diagErrors.includes(x.key));
        guide.textContent = next ? '① ' + next.label : '① 操作完成，點「完成圖上操作，開始答題 →」';
        focus(
          next ? next.selector : '#diagram-next',
          '#figure button,#figure [role="button"],#diagram-next',
        );
      }
    } else if (step === 'task') {
      root.classList.add('answer-phase');
      const filled =
        node === 4
          ? true
          : !!draft[
              node === 0
                ? 'boundary'
                : node === 1 || node === 3
                  ? 'prediction'
                  : node === 2
                    ? 'boundary'
                    : 'retain'
            ];
      guide.textContent =
        filled && !diagErrors.length ? '② 已選好，現在點「送出」' : '② 第 2 步：點一個答案';
      focus(
        filled && !diagErrors.length
          ? '#task-submit'
          : '#work [data-field],#work [data-boundary],#work [data-choice]',
        '#figure button,#figure [role="button"],#work button:not(#open-term-btn)',
      );
    } else if (step === 'micro') {
      focus(
        answer !== null && !byId('feedback')?.classList.contains('inline-error')
          ? '#micro-submit'
          : '#work [data-choice]',
        '#figure button,#figure [role="button"],#work [data-choice],#micro-submit',
      );
    } else if (step === 'edges') {
      focus('#work [data-field],#gap-submit', '#work [data-field],#gap-submit');
    } else
      focus(
        '#task-next,#corrected-next,#next-node',
        '#figure button,#figure [role="button"],#task-next,#corrected-next,#next-node',
      );
  }
  function taskFigure() {
    const progress = state.nodes[node];
    const field = (id, label, opts) => choiceField(id, label, opts, draft[id]);
    let drawing = '',
      controls = '',
      title = config.nodes[node].title;
    if (node === 0) {
      const slots = config.guidance.slots.map((s) => [s.id, s.text]);
      drawing = svgStart(
        '血液與三種功能格',
        band(2, 3, 28, 90, '#fff1f1') +
          `<path d="M7 15C25 5 25 40 7 32S25 50 7 65S25 90 7 87" fill="none" stroke="#cf6671" stroke-width="3"/>` +
          slots
            .map(
              (_, i) =>
                band(48, 3 + i * 32, 50, 26) + pipe(`M30 48Q40 ${16 + i * 32} 47 ${16 + i * 32}`),
            )
            .join('') +
          `<circle cx="53" cy="15" r="3" fill="#6aa3bb"/><circle cx="53" cy="47" r="3" fill="#6aa3bb"/><circle cx="53" cy="79" r="3" fill="#6aa3bb"/>`,
      );
      controls =
        overlay(3, 35, 25, 32, '<strong>血液<br>H⁺ 進來</strong>') +
        slots
          .map(([id, label], i) =>
            overlay(
              57,
              4 + i * 32,
              40,
              26,
              hit(
                id.replace('slot_', 'slot-'),
                `<span>${label}</span><strong>${esc(draft[id] || '點此放入')}</strong>`,
                !!draft[id],
                diagErrors.includes(id),
              ),
              'slot-target',
            ),
          )
          .join('');
      return `<div class="functional-board"><h2>${title}</h2><div class="svg-stage n01-stage">${drawing}${controls}</div><div class="tag-row">${['化學緩衝', '肺', '腎臟'].map((t) => `<button data-tag="${t}" class="tag-pill ${draft.selectedTag === t ? 'selected' : ''}" ${slots.some(([id]) => draft[id] === t) ? 'disabled' : ''}>${t}</button>`).join('')}</div></div>`;
    }
    if (node === 1) {
      drawing = svgStart(
        '鹼酸比的分子與分母',
        band(4, 4, 92, 90) + `<path d="M12 49H88" stroke="#24798c" stroke-width="1.3"/>`,
      );
      controls =
        overlay(7, 6, 86, 39, field('numerator', '分子', ['HCO₃⁻', 'H₂CO₃'])) +
        overlay(7, 54, 86, 39, field('denominator', '分母', ['HCO₃⁻', 'H₂CO₃']));
      return `<div class="functional-board"><h2>pH＝pKa＋log（鹼／酸）</h2><div class="svg-stage">${drawing}${controls}</div><p>課本例：6.1＋log（26/1.3）≈7.4</p><p>這是課本參考值，不是病人數據。</p></div>`;
    }
    if (node === 2) {
      drawing = svgStart(
        'H⁺由緩衝物承接與緩衝所在',
        band(2, 2, 96, 23, '#fff5f5') +
          `<circle cx="14" cy="13" r="8" fill="#efc4c6"/>` +
          pipe('M24 13H55') +
          band(2, 30, 96, 21) +
          band(2, 54, 96, 21, '#fff3f3') +
          band(2, 78, 96, 21, '#fff9e5'),
      );
      controls =
        overlay(3, 3, 21, 20, '<strong>H⁺</strong>') +
        overlay(
          56,
          3,
          41,
          20,
          hit(
            'accept-h',
            draft.bound ? '已承接H⁺' : '緩衝物承接H⁺',
            !!draft.bound,
            diagErrors.includes('bound'),
          ),
        ) +
        overlay(4, 30, 92, 21, field('carbonate', '碳酸／HCO₃⁻', ['細胞外', '血球', '尿端攜酸'])) +
        overlay(4, 54, 92, 21, field('hemoglobin', '血紅素', ['細胞外', '血球', '尿端攜酸'])) +
        overlay(4, 78, 92, 21, field('phosphate', '磷酸鹽／銨', ['細胞外', '血球', '尿端攜酸']));
    }
    if (node === 3) {
      drawing = svgStart(
        '肺與有效CO₂排出',
        `<path d="M49 6V33M51 33L32 43M51 33L70 43" fill="none" stroke="#548899" stroke-width="2"/><path d="M43 20C18 18 10 50 24 61Q42 68 46 39Z M57 20C82 18 90 50 76 61Q58 68 54 39Z" fill="#d5edf4" stroke="#548899" stroke-width="1"/>` +
          pipe('M50 62V80') +
          band(8, 79, 84, 18),
      );
      controls =
        overlay(8, 24, 84, 25, '<strong>肺<br>CO₂ 排出</strong>') +
        overlay(
          9,
          80,
          82,
          16,
          hit('effective', '有效CO₂排出增加', !!draft.effective, diagErrors.includes('effective')),
        );
    }
    if (node === 4) {
      const good = progress.task || draft.diagramChecked,
        h = (draft.h || '血液') === '管液',
        b = (draft.bicarb || '管液') === '血液';
      drawing = svgStart(
        '血液、腎小管壁、管液；點箭頭翻轉',
        band(1, 2, 29, 96, '#fff2f3') +
          band(34, 2, 32, 96, '#e8f0ff') +
          band(70, 2, 29, 96, '#fff9df') +
          `<path d="M65 17l-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3" fill="none" stroke="#7e9dc7" stroke-width=".6"/>` +
          `<g id="flip-h" role="button" tabindex="0" aria-label="翻轉 H⁺ 箭頭"><title>${arrowText('H⁺', h ? '管液' : '血液')}</title>${pipe(h ? 'M15 43H85' : 'M85 43H15', recentFlip === 'h' ? 'flip-motion' : '')}<rect x="12" y="37" width="76" height="12" class="arrow-touch"/></g><g id="flip-bicarb" role="button" tabindex="0" aria-label="翻轉 HCO₃⁻ 箭頭"><title>${arrowText('HCO₃⁻', b ? '血液' : '管液')}</title>${pipe(b ? 'M85 76H15' : 'M15 76H85', recentFlip === 'bicarb' ? 'flip-motion' : '')}<rect x="12" y="70" width="76" height="12" class="arrow-touch"/></g>`,
      );
      controls =
        overlay(1, 3, 29, 14, '<strong>血液</strong>') +
        overlay(34, 3, 32, 14, '<strong>腎小管壁</strong>') +
        overlay(70, 3, 29, 14, '<strong>管液</strong>') +
        overlay(
          30,
          29,
          40,
          9,
          `<span class="arrow-caption">${esc(arrowText('H⁺', h ? '管液' : '血液'))}</span>`,
        ) +
        overlay(
          25,
          62,
          50,
          9,
          `<span class="arrow-caption">${esc(arrowText('HCO₃⁻', b ? '血液' : '管液'))}</span>`,
        );
      return `<div class="functional-board"><h2 id="wrong-figure-label" class="${good ? 'corrected-label' : 'wrong-label'}">${good ? '已校正：正確方向' : '這是錯的圖（找錯練習）'}</h2><div class="svg-stage">${drawing}${controls}</div></div>`;
    }
    if (node === 5) {
      drawing = svgStart(
        'H⁺與NH₃結合，尿端攜酸與血液留鹼',
        band(1, 2, 98, 50, '#fff9e7') +
          `<circle cx="17" cy="25" r="12" fill="#f4cdcb"/><path d="M35 25H42M38.5 21V29" stroke="#24798c" stroke-width="1"/><circle cx="63" cy="25" r="17" fill="#d8eff1"/>` +
          pipe('M64 46V53') +
          band(2, 53, 96, 45),
      );
      controls =
        overlay(4, 10, 25, 30, hit('pick-h', 'H⁺', !!draft.pickH, diagErrors.includes('bound'))) +
        overlay(
          44,
          9,
          49,
          32,
          hit(
            'nh3',
            draft.bound ? 'NH₄⁺已形成' : 'NH₃承接',
            !!draft.bound,
            diagErrors.includes('bound'),
          ),
        ) +
        overlay(
          4,
          63,
          92,
          30,
          field('destination', '形成的NH₄⁺應往哪裡？', ['尿端', '保留在血液']),
        );
      return `<div class="functional-board"><h2>${title}</h2><div class="svg-stage">${drawing}${controls}</div><button id="phosphate-info" class="term-pill">看磷酸鹽承接H⁺</button><p id="phosphate-note">${draft.phosphateView ? '磷酸鹽也能承接H⁺排出。' : ''}</p></div>`;
    }
    return `<div class="functional-board"><h2>${title}</h2><div class="svg-stage">${drawing}${controls}</div></div>`;
  }
  function taskPanel() {
    if (!draft.diagramChecked)
      return '<h2>第 1 步：圖上操作</h2><p>跟著圖上方的指示，操作亮起的元件。</p><button id="diagram-next" class="primary big-next">完成圖上操作，開始答題 →</button>';
    if (node === 0) {
      const b = draft.boundary;
      const errBoundary = diagErrors.includes('boundary');
      return `<h2>只有緩衝承接H⁺，能否說酸已離體？</h2>

        <div class="big-choice-grid ${errBoundary ? 'choice-error' : ''}">
          <button type="button" class="choice-big ${b === '不能' || b === '尚不能' ? 'selected' : ''}" data-boundary="不能">不能（仍在體內）</button>
          <button type="button" class="choice-big ${b === '能' || b === '已全部離體' ? 'selected' : ''}" data-boundary="能">能（已離體）</button>
        </div>

        <button id="task-submit" class="primary big-submit">送出驗證</button>`;
    }
    if (node === 4) {
      return `<h2>${esc(config.nodes[node].summary)}</h2><button id="task-submit" class="primary big-submit">送出驗證</button>`;
    }
    const details = [
      null,
      ['先預測：鹼／酸比增加，pH朝哪個方向？', ['上升', '下降'], 'prediction'],
      ['承接H⁺是否等於已跨越體外界線？', ['否', '是'], 'boundary'],
      [
        '先預測有效CO₂排出增加時的酸負荷與pH',
        ['減酸、pH朝上升方向', '酸增加、pH朝下降方向'],
        'prediction',
      ],
      null,
      ['形成的NH₄⁺應往哪裡？', ['尿端', '保留在血液'], 'destination'],
    ];
    const [originalTitle, options, id] = details[node];
    const title = node === 5 ? '排銨與保留HCO₃⁻的功能' : originalTitle;
    return `<h2>${title}</h2>${node === 5 ? choiceField('retain', '排銨與保留HCO₃⁻的功能', ['同方向排酸留鹼', '互相抵銷'], draft.retain) : choiceField(id, '在圖上完成操作，再做預測', options, draft[id])}<button id="task-submit" class="primary">送出</button>`;
  }
  function bindTask() {
    wireValues();
    if (byId('diagram-next'))
      byId('diagram-next').onclick = () => {
        const faults = operationFaults();
        if (faults.length) {
          diagErrors = faults;
          feedback =
            node === 4
              ? '兩條箭頭尚未一致：H⁺應往管液，HCO₃⁻回血。請整組比較。'
              : config.nodes[node].summary + '　請回圖上核對後重試。';
          render();
          showFeedback();
          return;
        }
        draft.diagramChecked = true;
        feedback = '';
        diagErrors = [];
        render();
      };

    // N01 Tag clicks
    document.querySelectorAll('[data-tag]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const tag = btn.dataset.tag;
        draft.selectedTag = draft.selectedTag === tag ? null : tag;
        render();
      };
    });

    // N01 Slot clicks
    document.querySelectorAll('.slot-target button').forEach((slot) => {
      slot.onclick = () => {
        const slotKey = slot.id.replace('slot-', 'slot_');
        if (draft[slotKey]) {
          draft[slotKey] = null;
        } else if (draft.selectedTag) {
          ['slot_buffer', 'slot_lung', 'slot_kidney'].forEach((k) => {
            if (draft[k] === draft.selectedTag) draft[k] = null;
          });
          draft[slotKey] = draft.selectedTag;
          draft.selectedTag = null;
        }
        diagErrors = diagErrors.filter((e) => e !== slotKey);
        render();
      };
    });

    // N01 Boundary button clicks
    document.querySelectorAll('[data-boundary]').forEach((btn) => {
      btn.onclick = () => {
        draft.boundary = btn.dataset.boundary;
        diagErrors = diagErrors.filter((e) => e !== 'boundary');
        render();
      };
    });

    if (byId('accept-h'))
      byId('accept-h').onclick = () => {
        draft.bound = true;
        render();
      };
    if (byId('effective'))
      byId('effective').onclick = () => {
        draft.effective = true;
        render();
      };
    if (byId('flip-h'))
      byId('flip-h').onclick = () => {
        if (state.nodes[node].task || draft.diagramChecked) return;
        recentFlip = 'h';
        draft.h = (draft.h || '血液') === '血液' ? '管液' : '血液';
        diagErrors = diagErrors.filter((e) => e !== 'arrow_h');
        render();
      };
    if (byId('flip-bicarb'))
      byId('flip-bicarb').onclick = () => {
        if (state.nodes[node].task || draft.diagramChecked) return;
        recentFlip = 'bicarb';
        draft.bicarb = (draft.bicarb || '管液') === '管液' ? '血液' : '管液';
        diagErrors = diagErrors.filter((e) => e !== 'arrow_bicarb');
        render();
      };
    if (byId('pick-h'))
      byId('pick-h').onclick = () => {
        draft.pickH = true;
        render();
      };
    if (byId('nh3'))
      byId('nh3').onclick = () => {
        if (draft.pickH) {
          draft.bound = true;
          render();
        }
      };
    if (byId('phosphate-info'))
      byId('phosphate-info').onclick = () => {
        draft.phosphateView = true;
        byId('phosphate-note').textContent = '磷酸鹽也能承接H⁺排出。';
      };
    for (const id of ['flip-h', 'flip-bicarb'])
      if (byId(id))
        byId(id).onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            byId(id).dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        };
    bindChoices();
    if (byId('task-submit'))
      byId('task-submit').onclick = () => {
        diagErrors = [];
        let ok = false;
        if (node === 0) {
          const bOk = draft.slot_buffer === '化學緩衝' || draft.buffer === '減少pH波動';
          const lOk = draft.slot_lung === '肺' || draft.lung === '排CO₂';
          const kOk = draft.slot_kidney === '腎臟' || draft.kidney === '排酸留鹼';
          const boundOk = ['不能', '尚不能'].includes(draft.boundary);

          if (!bOk) diagErrors.push('slot_buffer');
          if (!lOk) diagErrors.push('slot_lung');
          if (!kOk) diagErrors.push('slot_kidney');
          if (!boundOk) diagErrors.push('boundary');

          ok = bOk && lOk && kOk && boundOk;
          if (!ok) {
            feedback = '緩衝減少波動，肺與腎調整酸的去路。請回圖上核對紅框處後重試。';
          }
        } else if (node === 4) {
          const hOk = (draft.h || '血液') === '管液';
          const bOk = (draft.bicarb || '管液') === '血液';

          if (!hOk) diagErrors.push('arrow_h');
          if (!bOk) diagErrors.push('arrow_bicarb');

          ok = hOk && bOk;
          if (!ok) {
            feedback = '兩條箭頭尚未一致：H⁺應往管液，HCO₃⁻回血。請整組比較。';
          }
        } else {
          ok = [
            null,
            () =>
              draft.numerator === 'HCO₃⁻' &&
              draft.denominator === 'H₂CO₃' &&
              draft.prediction === '上升',
            () =>
              draft.bound &&
              draft.carbonate === '細胞外' &&
              draft.hemoglobin === '血球' &&
              draft.phosphate === '尿端攜酸' &&
              draft.boundary === '否',
            () => draft.effective && draft.prediction === '減酸、pH朝上升方向',
            null,
            () => draft.bound && draft.destination === '尿端' && draft.retain === '同方向排酸留鹼',
          ][node]();
          if (!ok) {
            const fields =
              node === 1
                ? ['numerator', 'denominator', 'prediction']
                : node === 2
                  ? ['bound', 'carbonate', 'hemoglobin', 'phosphate', 'boundary']
                  : node === 3
                    ? ['effective', 'prediction']
                    : ['bound', 'destination', 'retain'];
            const expected = {
              numerator: 'HCO₃⁻',
              denominator: 'H₂CO₃',
              prediction: node === 1 ? '上升' : '減酸、pH朝上升方向',
              bound: true,
              carbonate: '細胞外',
              hemoglobin: '血球',
              phosphate: '尿端攜酸',
              boundary: '否',
              effective: true,
              destination: '尿端',
              retain: '同方向排酸留鹼',
            };
            diagErrors = fields.filter((id) => draft[id] !== expected[id]);
            feedback = config.nodes[node].summary + '　請回圖上核對後重試。';
          }
        }

        if (!ok) {
          emit('hint', config.nodes[node].id);
          render();
          showFeedback();
          return;
        }

        // Correct!
        if (node === 0) {
          draft.buffer = '減少pH波動';
          draft.lung = '排CO₂';
          draft.kidney = '排酸留鹼';
          draft.boundary = '尚不能';
        }
        gapIndex = 0;
        state.nodes[node].visual = structuredClone(draft);
        Model.markNode(state, node, 'task', true);
        if (node === 4) Model.markNode(state, node, 'micro', true);
        save();
        feedback = '操作與預測符合本節關係。';
        step = node === 4 ? 'edges' : 'micro';
        answer = null;
        draft = {};
        diagErrors = [];
        render();
      };
  }
  function bindChoices() {
    document.querySelectorAll('[data-choice]').forEach(
      (b) =>
        (b.onclick = () => {
          answer = +b.dataset.choice;
          byId('feedback')?.classList.remove('inline-error');
          document.querySelectorAll('[data-choice]').forEach((x) => {
            x.classList.toggle('selected', x === b);
            x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
          });
          applyGuidance();
        }),
    );
  }
  function showFeedback() {
    const f = byId('feedback');
    if (f) {
      f.textContent = feedback;
      f.classList.add('inline-error');
    }
    byId('figure')?.classList.add('figure-error');
    document
      .querySelectorAll('[data-choice].selected')
      .forEach((b) => b.classList.add('field-error'));
    applyGuidance();
  }
  function termHtml() {
    const t = config.glossary.find((t) => t.id === term);
    return `<section class="term-box"><h2 class="term-caption">名詞說明：${esc(t.name)}</h2><p class="term-text">${esc(t.text)}</p></section>`;
  }
  function finish() {
    if (Model.complete(state)) {
      emit('complete');
      save();
    }
    if (Model.canComplete(state)) byId('completion').hidden = false;
  }
  function learn() {
    const n = config.nodes[node];
    term = n.termId;
    if (reviewNeeded && node === state.pendingReview?.node) reviewed = true;
    const progress = state.nodes[node];
    step =
      progress.task && !progress.taskViewed && node !== 4
        ? 'ack'
        : progress.edges
          ? 'done'
          : node === 4 && progress.micro && !progress.correctedViewed
            ? 'corrected'
            : progress.micro
              ? 'edges'
              : progress.task
                ? 'micro'
                : 'task';
    if (progress.task && ['micro', 'corrected', 'done', 'ack'].includes(step))
      draft = { ...(progress.visual || {}) };
    if (progress.task) draft = { ...(progress.visual || {}), ...draft };
    const figure = step === 'edges' ? mapHtml() : taskFigure();
    let panel =
      step === 'ack'
        ? `<h2>操作與預測符合本節關係。</h2><p>${esc(n.summary)}</p><button id="task-next" class="primary big-next">下一步 →</button>`
        : step === 'corrected'
          ? `<h2>已校正：正確方向</h2><p>${esc(n.summary)}</p><button id="corrected-next" class="primary big-next">下一步 →</button>`
          : step === 'task'
            ? taskPanel()
            : step === 'micro'
              ? qhtml(n.micro) +
                '<button id="micro-submit" class="primary big-next">核對小檢核 ➔</button>'
              : step === 'edges'
                ? graphGap()
                : `<h2>已完成本節點！</h2><p>${esc(n.summary)}</p><p>操作 → 圖面 → 考題語言：${esc(n.summary)}</p><button id="next-node" class="primary big-next">下一步 →</button>`;
    byId('figure').innerHTML = guideHtml() + figure;
    byId('work').innerHTML =
      (node === 0 && step === 'task'
        ? '<p class="story">急診任務：為團隊說明酸被接住後的去路。</p>'
        : '') +
      panel +
      `<p id="feedback" class="feedback" aria-live="polite">${esc(feedback)}</p>` +
      `<div class="term-launch-row"><button class="term-pill" id="open-term-btn" aria-expanded="false">${esc(config.glossary.find((t) => t.id === n.termId)?.name)}</button><div id="inline-term" hidden>${termHtml()}</div></div>`;
    if (reviewNeeded && reviewed) {
      const back = document.createElement('button');
      back.id = 'return-quiz';
      back.className = 'primary';
      back.textContent = '回到考核';
      back.onclick = () => {
        view = 'quiz';
        render();
      };
      byId('work').append(back);
    }
    if (byId('open-term-btn')) {
      byId('open-term-btn').onclick = () => {
        const box = byId('inline-term');
        box.hidden = !box.hidden;
        byId('open-term-btn').setAttribute('aria-expanded', String(!box.hidden));
      };
    }
    if (progress.task || draft.diagramChecked)
      document.querySelectorAll('#figure button').forEach((e) => (e.disabled = true));
    if (step === 'ack')
      byId('task-next').onclick = () => {
        progress.taskViewed = true;
        save();
        feedback = '';
        render();
      };
    else if (step === 'corrected')
      byId('corrected-next').onclick = () => {
        state.nodes[node].correctedViewed = true;
        save();
        render();
      };
    else if (step === 'task') bindTask();
    else if (step === 'micro') {
      bindChoices();
      byId('micro-submit').onclick = () => {
        if (answer === null) return;
        const q = n.micro,
          ok = answer === q.answer;
        emit('answer', q.id, ok);
        if (ok) {
          Model.markNode(state, node, 'micro', true);
          save();
          answer = null;
          draft = {};
          feedback = '把本節關係補進心智圖。';
          gapIndex = 0;
          render();
        } else {
          feedback = q.feedback[answer] || n.summary;
          emit('hint', q.id);
          showFeedback();
        }
      };
    } else if (step === 'edges') {
      wireValues();
      byId('gap-submit').onclick = () => {
        const ok = n.edges.slice(0, gapIndex + 1).every((id, i) => {
          const e = config.graph.edges.find((e) => e.id === id),
            expected =
              e.sign === 'up' && i % 2 === 0
                ? '↑'
                : config.graph.nodes.find((n) => n.id === e.from).label;
          return draft['gap-' + i] === expected;
        });
        if (ok) {
          if (gapIndex < n.edges.length - 1) {
            gapIndex++;
            feedback = '';
            render();
            return;
          }
          Model.markNode(state, node, 'edges', true);
          save();
          feedback = '心智圖新增這一段連結。';
          draft = {};
          render();
        } else {
          feedback = '連結尚未完整：依箭頭起點、終點與本節方向再核對。';
          emit('hint', n.id);
          showFeedback();
        }
      };
    } else
      byId('next-node').onclick = () => {
        feedback = '';
        answer = null;
        draft = {};
        gapIndex = 0;
        if (node < 5) node++;
        else {
          view = 'map';
          draft = {};
          traceRevealed = false;
        }
        render();
      };
  }
  function quiz() {
    byId('figure').innerHTML = '';
    if (reviewNeeded) {
      feedback = state.pendingReview?.feedback || feedback;
      byId('work').innerHTML =
        `<h2>回讀後再挑戰</h2><p>${esc(feedback)}</p><button id="review-node">回到對應節點</button><button id="retry-cases" ${reviewed ? '' : 'disabled'}>重新挑戰（換相反題）</button>`;
      byId('review-node').onclick = () => {
        view = 'learn';
        render();
      };
      byId('retry-cases').onclick = () => {
        if (!reviewed) return;
        Model.retry(state);
        delete state.pendingReview;
        save();
        reviewNeeded = false;
        reviewed = false;
        quizKind = 'cases';
        quizIndex = 0;
        tier = 1;
        answer = null;
        reason = null;
        feedback = '';
        render();
      };
      return;
    }
    if (state.foundation.length === 6 && quizKind === 'foundation') {
      quizKind = 'cases';
      quizIndex = state.cases.length;
    }
    if (state.casePassed) {
      byId('work').innerHTML =
        '<h2>第二關全對</h2><p>尚須完成心智圖的一滴酸回憶，才會回報通關。</p><button id="go-trace" class="primary">遮圖回憶一滴酸</button>';
      byId('go-trace').onclick = () => {
        view = 'map';
        traceRevealed = false;
        draft = {};
        render();
      };
      return;
    }
    const q =
      quizKind === 'foundation'
        ? config.foundation[quizIndex]
        : Model.pair(config, state)[quizIndex];
    if (!q) {
      byId('work').innerHTML = '<h2>完成節點後開始練習</h2>';
      return;
    }
    if (!Model.nodeReady(state, q.node) || (quizKind === 'cases' && !Model.allNodes(state))) {
      byId('work').innerHTML =
        `<h2>先完成節點的圖上任務、小檢核與補連結</h2><p>${esc(config.nodes[q.node].title)}</p><button id="unlock-node">前往對應節點</button>`;
      byId('unlock-node').onclick = () => {
        node = q.node;
        view = 'learn';
        render();
      };
      return;
    }
    const rows = tier === 2 ? q.reasons : q.options,
      selected = tier === 2 ? reason : answer;
    byId('work').innerHTML =
      `<div class="quiz-heading">${quizKind === 'foundation' ? '第一關' : '第二關'} ${quizIndex + 1}／${quizKind === 'foundation' ? 6 : 5}${q.reasons ? ' · 答案＋理由' : ''}</div><h2>${esc(q.stem)}</h2>${tier === 2 ? `<p>第一層已鎖定：${esc(q.options[answer])}。請選擇支持本題判斷的理由。</p>` : ''}${choices(rows, 'data-quiz-choice', selected)}<button id="quiz-submit" class="primary">${q.reasons && tier === 1 ? '鎖定答案，選理由' : '整題送出'}</button><p id="feedback" class="feedback" aria-live="polite">${esc(feedback)}</p>`;
    document.querySelectorAll('[data-quiz-choice]').forEach(
      (b) =>
        (b.onclick = () => {
          if (tier === 2) reason = +b.dataset.quizChoice;
          else answer = +b.dataset.quizChoice;
          document.querySelectorAll('[data-quiz-choice]').forEach((x) => {
            x.classList.toggle('selected', x === b);
            x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
          });
          applyGuidance();
        }),
    );
    byId('quiz-submit').onclick = () => {
      if ((tier === 1 ? answer : reason) === null) return;
      if (q.reasons && tier === 1) {
        tier = 2;
        feedback = '';
        render();
        return;
      }
      const aok = answer === q.answer,
        rok = !q.reasons || reason === q.reasonAnswer;
      emit('answer', q.id, aok && rok);
      if (quizKind === 'foundation') {
        if (Model.answerFoundation(state, quizIndex, aok)) {
          quizIndex++;
          answer = null;
          tier = 1;
          feedback = '';
          save();
          render();
        } else {
          feedback = q.feedback[answer] || config.nodes[q.node].summary;
          byId('feedback').textContent = feedback;
          byId('quiz-submit').disabled = true;
          const b = document.createElement('button');
          b.textContent = '回讀對應節點';
          b.onclick = () => {
            node = q.node;
            view = 'learn';
            answer = null;
            render();
          };
          byId('work').append(b);
        }
        return;
      }
      if (Model.answerCase(state, q, answer, reason)) {
        quizIndex++;
        answer = null;
        reason = null;
        tier = 1;
        feedback = '';
        save();
        render();
        return;
      }
      const pattern = q.reasons
        ? aok
          ? '答案符合，理由未支持。'
          : rok
            ? '理由正確，情境方向需重新連結。'
            : '請分別核對答案與理由的關係。'
        : '';
      feedback =
        pattern +
        ' ' +
        (!aok ? q.feedback[answer] || '請核對題幹條件。' : '') +
        ' ' +
        (!rok ? q.reasonFeedback[reason] || '請核對因果關係。' : '');
      node = q.node;
      reviewNeeded = true;
      reviewed = false;
      state.pendingReview = { node: q.node, feedback };
      save();
      emit('hint', q.id);
      render();
    };
  }
  function trace() {
    const all = Model.allNodes(state),
      show = all && traceRevealed;
    byId('figure').innerHTML = mapHtml(all && !show);
    if (!all) {
      byId('work').innerHTML =
        '<h2>心智圖逐步成長</h2><p>請先完成六個節點的圖上任務、小檢核與補連結。結尾會遮圖，讓你憑記憶核對。</p><button id="back-node">繼續節點</button>';
      byId('back-node').onclick = () => {
        node = state.nodes.findIndex((_, i) => !Model.nodeReady(state, i));
        view = 'learn';
        render();
      };
      return;
    }
    if (!show) {
      byId('figure').innerHTML =
        guideHtml() +
        `<div class="functional-board trace-board"><h2 id="memory-cover">先憑記憶追蹤一滴酸</h2><div class="svg-stage trace-stage">${svgStart('一滴酸的三個功能分支，關係圖已遮住', band(1, 2, 98, 28) + band(1, 36, 98, 28) + band(1, 70, 98, 28))}${overlay(3, 3, 94, 26, choiceField('trace-buffer', '緩衝接住H⁺之後', ['仍在體內，減少pH波動', '酸已全部離體'], draft['trace-buffer']))}${overlay(3, 37, 94, 26, choiceField('trace-lung', '肺端排出物', ['CO₂', '直接呼出HCO₃⁻'], draft['trace-lung']))}${overlay(3, 71, 94, 26, choiceField('trace-kidney', '腎端兩個去向', ['H⁺向尿端、HCO₃⁻回血', 'H⁺回血、HCO₃⁻向尿端'], draft['trace-kidney']))}</div></div>`;
      byId('work').innerHTML =
        `<h2>一滴酸：先回憶，再揭圖</h2><p>這是功能分工追蹤，不是同一顆酸先由肺、又由腎排兩次。</p><button id="trace-check" class="primary">提交回憶，再揭開核對</button><p id="feedback" class="feedback">${esc(feedback)}</p>`;
      wireValues();
      byId('trace-check').onclick = () => {
        if (
          draft['trace-buffer'] === '仍在體內，減少pH波動' &&
          draft['trace-lung'] === 'CO₂' &&
          draft['trace-kidney'] === 'H⁺向尿端、HCO₃⁻回血'
        ) {
          state.trace = true;
          traceRevealed = true;
          save();
          render();
          finish();
        } else {
          feedback = '把暫時承接、肺排CO₂、腎排酸留鹼分開想，再試一次。';
          for (const [id, expected] of [
            ['trace-buffer', '仍在體內，減少pH波動'],
            ['trace-lung', 'CO₂'],
            ['trace-kidney', 'H⁺向尿端、HCO₃⁻回血'],
          ])
            byId(id).classList.toggle('field-error', draft[id] !== expected);
          showFeedback();
        }
      };
    } else {
      byId('work').innerHTML =
        `<h2>揭圖核對：三系統配合</h2><div class="trace-branches"><p>緩衝：暫時承接H⁺ → 減少波動</p><p>肺：CO₂排出 → 可減酸</p><p>腎：H⁺向尿端／HCO₃⁻回血 → 排酸留鹼</p></div><p>圖的閱讀順序不是生理啟動時間，也不表示所有酸都由肺排掉。</p><button id="cover-again">再遮圖回憶</button><button id="go-cases">下一步 →</button>`;
      byId('cover-again').onclick = () => {
        traceRevealed = false;
        draft = {};
        render();
      };
      byId('go-cases').onclick = () => {
        view = 'quiz';
        quizIndex = state.foundation.length < 6 ? state.foundation.length : state.cases.length;
        quizKind = state.foundation.length < 6 ? 'foundation' : 'cases';
        render();
      };
      finish();
    }
  }
  function glossary() {
    byId('figure').innerHTML =
      '<div class="functional-board"><h2>名詞說明</h2><p>點選右側清單，閱讀完整名稱與簡稱。</p></div>';
    byId('work').innerHTML =
      `<h2>名詞說明</h2><div class="term-menu">${config.glossary.map((t, i) => `<button data-term="${t.id}" class="${term === t.id ? 'selected' : ''}">${esc(t.name)}</button>`).join('')}</div>${termHtml()}`;
    document.querySelectorAll('[data-term]').forEach(
      (b) =>
        (b.onclick = () => {
          term = b.dataset.term;
          render();
        }),
    );
  }
  function render() {
    document.body.dataset.view = view;
    document.body.dataset.step = step;
    const completedCount = state.nodes.filter((_, i) => Model.nodeReady(state, i)).length;
    document.body.innerHTML = `<header class="top-bar"><div class="top-title-group"><span class="unit-title">酸鹼三系統</span><span class="scenario-brief">急診情境：三系統分工維持酸鹼平衡</span></div><div class="stepper-dots" role="navigation" aria-label="節點進度">${config.nodes.map((n, i) => `<button data-node="${i}" class="step-dot ${i === node && view === 'learn' ? 'active' : ''} ${Model.nodeReady(state, i) ? 'completed' : ''}" title="${esc(n.title)}" aria-label="${esc(n.title)}">${Model.nodeReady(state, i) ? '●' : i === node && view === 'learn' ? '◉' : '○'}</button>`).join('')}</div><span class="progress-indicator">已完成 ${completedCount}／6</span></header><main class="viewport-screen"><section class="figure-pane" id="figure" aria-label="圖上操作與內建心智圖"></section><section class="panel-pane" id="work" aria-label="學習與考核"></section></main><aside class="mindmap-dock" id="mindmap-dock" data-view="map" title="點擊放大心智圖"><div class="dock-header">心智圖 🔍</div><div class="dock-preview">${miniMapSvg()}</div></aside><div id="completion" role="status" ${Model.canComplete(state) ? '' : 'hidden'}>第二關全對＋心智圖完成，本單元通關！</div>`;
    window.AcidbaseUI = {
      setView: (v) => {
        view = v;
        if (view === 'map') {
          traceRevealed = false;
          draft = {};
        }
        if (view === 'quiz') {
          quizKind = state.foundation.length < 6 ? 'foundation' : 'cases';
          quizIndex = quizKind === 'foundation' ? state.foundation.length : state.cases.length;
        }
        feedback = '';
        answer = null;
        reason = null;
        tier = 1;
        render();
      },
      getState: () => state,
      getNode: () => node,
      getStep: () => step,
    };
    if (byId('mindmap-dock')) {
      byId('mindmap-dock').onclick = () => {
        view = 'map';
        traceRevealed = false;
        draft = {};
        render();
      };
    }
    document.querySelectorAll('[data-node]').forEach(
      (b) =>
        (b.onclick = () => {
          diagErrors = [];
          gapIndex = 0;
          node = +b.dataset.node;
          view = 'learn';
          draft = {};
          answer = null;
          feedback = '';
          emit('explore', config.nodes[node].id);
          render();
        }),
    );
    if (view === 'learn') {
      learn();
      document.body.dataset.step = step;
    } else if (view === 'quiz') quiz();
    else if (view === 'map') trace();
    else if (view === 'glossary') glossary();
    else {
      byId('figure').innerHTML = `<iframe id="lab-frame" title="情境實驗室"></iframe>`;
      byId('work').innerHTML = '';
      byId('lab-frame').srcdoc = config.labHtml;
    }
    if (Model.canComplete(state)) finish();
    routeMapEdges();
    applyGuidance();
    recentFlip = '';
  }
  window.addEventListener('resize', routeMapEdges);
  render();
}
