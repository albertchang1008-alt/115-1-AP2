function mountStudentScript(config) {
  const S = config.studentScript,
    U = S.units,
    Model = createAcidbaseModel(),
    KEY = 'acidbase-student-script:2026-10-21-v3.2';
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const txt = (id) => {
    if (!U[id]) throw Error('Unapproved copy id ' + id);
    return `<span data-copy="${id}">${esc(U[id].text)}</span>`;
  };
  const svgTxt = (id) => `<tspan data-copy="${id}">${esc(U[id].text)}</tspan>`;
  const interfaceTxt = (id) =>
    `<span data-interface="${id}">${esc(S.interfaceCopy[id].text)}</span>`;
  const generic = (label) => `<span data-common>${esc(label)}</span>`;
  const button = (id, text, on = false) =>
    `<button id="${id}" type="button" aria-pressed="${on}" class="${on ? 'selected' : ''}">${text}</button>`;
  let model = Model.fresh(),
    course = {
      screen: 'intro',
      node: 0,
      stage: 0,
      done: [],
      basics: [],
      traceIndex: 0,
      selected: null,
      placements: [],
      h: false,
      b: false,
      feedback: [],
      error: [],
      hint: false,
      microAnswer: null,
      poolAnswer: null,
      poolReason: null,
      tier: 1,
      review: null,
    },
    basicsVisible = false;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (
      saved?.version === 3 &&
      saved.scriptSha === S.sha256 &&
      saved.model?.nodes?.length === 6 &&
      saved.model.nodes.every(
        (n) => n && ['task', 'micro', 'edges'].every((k) => typeof n[k] === 'boolean'),
      ) &&
      Array.isArray(saved.model.cases) &&
      ['P', 'R', 'K', 'N', 'S'].every((g) => ['A', 'B'].includes(saved.model.sides?.[g])) &&
      Array.isArray(saved.course?.done) &&
      ['intro', 'node', 'trace', 'transition', 'quiz'].includes(saved.course?.screen) &&
      Number.isInteger(saved.course.node) &&
      saved.course.node >= 0 &&
      saved.course.node < 6
    ) {
      model = saved.model;
      course = { ...course, ...saved.course };
      course.placements = Array.isArray(course.placements)
        ? course.placements.map((v) => (v === null ? undefined : v))
        : [];
      course.done = [...new Set(course.done)];
    }
  } catch {}
  let guideScope = 'preview';
  const matchUI = { guideStep: null, openRow: null, pendingSwap: null };
  const interaction = createStudentInteractionCore(course);
  const isMatching = () => [0, 2].includes(course.node);
  const guideKey = () =>
    `acidbase-matching-guide:v1:${guideScope}:${config.slug || 'acid-base-homeostasis'}:N${course.node + 1}`;
  const seenGuide = () => {
    try {
      return localStorage.getItem(guideKey()) === 'done';
    } catch {
      return false;
    }
  };
  function closeGuide() {
    try {
      localStorage.setItem(guideKey(), 'done');
    } catch {}
    matchUI.guideStep = null;
    render();
  }
  const optionOrder = interaction.order;
  const reshuffle = interaction.reshuffle;
  const failRetry = interaction.fail;
  function retryHtml() {
    if (!course.retry || Date.now() < course.retryAt) return '';
    return button('strict-retry', txt('retry.' + course.retry));
  }
  function clearAttempt() {
    course.selected = null;
    course.placements = [];
    course.h = false;
    course.b = false;
    course.feedback = [];
    course.error = [];
    course.hint = false;
    course.microAnswer = null;
    course.retry = null;
    matchUI.openRow = null;
    matchUI.pendingSwap = null;
  }
  function retryAttempt() {
    const kind = course.retry;
    reshuffle();
    clearAttempt();
    if (kind === 'trace') {
      course.traceIndex = 0;
      model.trace = false;
    } else {
      if (kind === 'node') course.stage = 0;
      course.done = course.done.filter((i) => i !== course.node);
      model.nodes[course.node] = { task: false, micro: false, edges: false };
      if (isMatching() && course.stage === 0) freshMatch();
    }
    save();
    render();
  }
  function freshMatch() {
    course.match = interaction.freshMatch('match.' + course.node, 3);
    matchUI.openRow = null;
    matchUI.pendingSwap = null;
    matchUI.guideStep = seenGuide() ? null : 1;
  }
  function matchingReference() {
    const n = current(),
      active = course.match?.complete;
    return `${teacherImage(course.node)}<div class="matching-reference" aria-label="配對對照圖">${n.cards.map((id, j) => `<div class="reference-block ${active ? 'lit' : ''}" data-reference="${j}">${txt(id)}</div>`).join('')}</div>`;
  }
  const mi = (id) => interfaceTxt('match.' + id);
  function matchingHtml() {
    return renderStudentMatching({
      n: current(),
      m: course.match,
      ui: matchUI,
      errors: course.error,
      retry: course.retry,
      txt,
      mi,
      button,
    });
  }
  function bindMatching() {
    const n = current(),
      m = course.match;
    bindStudentMatching({
      n,
      m,
      ui: matchUI,
      render,
      save,
      closeGuide,
      onCheck(wrong) {
        course.error = wrong;
        course.feedback = [];
        m.feedback = n.cards.map((_, row) =>
          wrong.includes(row)
            ? [course.node === 2 ? n.errors[row] : row === 2 ? n.errors[0] : n.slots[row]]
            : [],
        );
        if (!wrong.length) {
          course.stage = 'match-correct';
          try {
            localStorage.setItem(guideKey(), 'done');
          } catch {}
        } else {
          failRetry('step');
          emit('hint', config.nodes[course.node].id);
        }
        save();
        render();
      },
    });
  }
  window.addEventListener('message', (event) => {
    if (
      event.source !== window.parent ||
      event.data?.type !== 'init' ||
      event.data.protocolVersion !== 1
    )
      return;
    const scope = event.data.guideScope;
    if (typeof scope !== 'string' || !/^[\w-]{16,100}$/.test(scope) || scope === guideScope) return;
    guideScope = scope;
    if (course.screen === 'node' && isMatching() && course.stage === 0) {
      matchUI.guideStep = course.retry || seenGuide() ? null : 1;
      render();
    }
  });
  if (window.parent !== window) window.parent.postMessage({ type: 'ready' }, '*');

  if (course.screen === 'node' && isMatching()) {
    if (!course.match?.values) freshMatch();
    else matchUI.guideStep = course.retry || seenGuide() ? null : 1;
  }
  model.scriptMode = true;
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 3, scriptSha: S.sha256, model, course }));
    } catch {}
  };
  const emit = (name, ...args) => {
    try {
      window.CourseLearning?.[name]?.(...args);
    } catch {}
  };
  const current = () => S.nodes[course.node];
  function enterNode(i, review = false) {
    course.screen = 'node';
    course.node = i;
    course.retry = null;
    course.stage = 0;
    course.placements = [];
    course.selected = null;
    course.feedback = [];
    course.error = [];
    course.h = false;
    course.b = false;
    course.hint = false;
    course.microAnswer = null;
    if ([0, 2].includes(i)) freshMatch();
    basicsVisible = !course.basics.includes(i);
    if (basicsVisible) course.basics.push(i);
    if (review) course.isReview = true;
    save();
    render();
  }
  const labels = [6, 7, 8, 9, 13, 3, 0, 1];
  function mapHtml(ids = null) {
    const active = new Set(ids || course.done.flatMap((i) => config.nodes[i].edges));
    const activeNodes = new Set(
      course.done.flatMap((i) => [config.nodes[i].id, ...(config.nodes[i].edges || [])]),
    );
    const positions = config.graph.nodes.map((_, i) =>
      i === 0
        ? { x: 50, y: 50 }
        : {
            x: 50 + 35 * Math.cos(-Math.PI / 2 + ((i - 1) * 2 * Math.PI) / 7),
            y: 50 + 34 * Math.sin(-Math.PI / 2 + ((i - 1) * 2 * Math.PI) / 7),
          },
    );
    return `<div class="script-map" aria-label="心智圖"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${config.graph.edges
      .map((e) => {
        const a = positions[config.graph.nodes.findIndex((n) => n.id === e.from)],
          b = positions[config.graph.nodes.findIndex((n) => n.id === e.to)];
        return `<line class="map-skeleton-edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#d8e7ee" stroke-width="0.8" stroke-dasharray="2,2"/>`;
      })
      .join('')}${config.graph.nodes
      .map(
        (n, i) =>
          `<circle class="map-skeleton-node" cx="${positions[i].x}" cy="${positions[i].y}" r="${i === 0 ? 5 : 3.5}" fill="#edf4f8" stroke="#b2cbd7" stroke-width="0.6"/>`,
      )
      .join('')}${config.graph.edges
      .filter((e) => active.has(e.id))
      .map((e) => {
        const a = positions[config.graph.nodes.findIndex((n) => n.id === e.from)],
          b = positions[config.graph.nodes.findIndex((n) => n.id === e.to)];
        return `<path data-map-edge="${e.id}" d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="${e.relation === 'parallel' ? '#8865a4' : '#267991'}" stroke-width="1.2"/>`;
      })
      .join(
        '',
      )}</svg>${config.graph.nodes.map((n, i) => `<div class="script-map-label" style="left:${positions[i].x}%;top:${positions[i].y}%">${txt('diagram.' + labels[i])}</div>`).join('')}</div>`;
  }
  const svg = (shapes) =>
    `<svg class="student-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><marker id="s-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#267991"/></marker></defs>${shapes}</svg>`;
  const flow = (d, extra = '') =>
    `<path class="s-flow ${extra}" d="${d}" fill="none" stroke="#267991" stroke-width="1.2" marker-end="url(#s-arrow)"/>`;
  function teacherImage(i) {
    const asset=config.teacherFigures.find(e=>e.node===i+1);
    return asset?.kind==='anatomy' ? `<div class="acid-teacher-reference">${renderTeacherFigure(asset)}</div>` : '';
  }
  const teacherBackdrop = (i) => {
    const asset=config.teacherFigures.find(e=>e.node===i+1);
    return `<svg x="0" y="0" width="100" height="100" viewBox="${asset.crop.join(' ')}" preserveAspectRatio="xMidYMid meet"><image href="${asset.image}" width="${asset.width}" height="${asset.height}"/></svg>`;
  };
  function diagram() {
    const i = course.node,
      n = current();
    if ([0, 2].includes(i)) return matchingReference();
    if (i < 3) {
      const slots = n.slots;
      return `<div class="match-layout"><div class="match-board">${svg(i === 1 ? '<path d="M8 49H92" stroke="#267991" stroke-width="1.4"/>' : slots.map((_, j) => `<rect x="3" y="${3 + j * 32}" width="94" height="28" rx="3" fill="${['#f4f9fb', '#fef3f2', '#fff9e7'][j]}" stroke="#a7c8d6" stroke-width=".4"/>`).join(''))}${slots.map((id, j) => `<button class="work-slot ${course.error.includes(j) ? 'wrong' : ''}" data-slot="${j}" style="top:${i === 1 ? j * 51 + 3 : j * 32 + 3}%;height:${i === 1 ? 43 : 28}%">${txt(id)}${course.placements[j] !== undefined ? `<strong>${txt(n.cards[course.placements[j]])}</strong>` : ''}</button>`).join('')}</div><div class="card-tray">${optionOrder(
        'cards.' + i,
        n.cards.length,
      )
        .map((j) => {
          const id = n.cards[j];
          return `<button data-card="${j}" class="${course.selected === j ? 'selected' : ''}" aria-pressed="${course.selected === j}" ${course.placements.includes(j) ? 'disabled' : ''}>${txt(id)}</button>`;
        })
        .join('')}</div></div>`;
    }
    if (i === 3)
      return `<div class="science-board">${svg(teacherBackdrop(i) + flow('M50 40V12', course.stage !== 0 ? 'thick animate-flow' : ''))}<div class="science-label">${txt('diagram.3')}</div>${course.stage === 0 ? `<div class="science-control">${button('breathe', txt(n.actions[0].options[0]))}</div>` : ''}</div>`;
    if (i === 4) {
      const arrows = [0, 1]
        .map((j) => {
          const right = j === 0 ? !course.h : course.b;
          const y = j === 0 ? 44 : 60;
          return `<g data-arrow="${j}" tabindex="0" role="button" aria-label="${j === 0 ? 'H⁺' : 'HCO₃⁻'}" class="${course.error.includes(j) ? 'arrow-wrong' : ''}"><rect x="10" y="${y - 20}" width="80" height="28" fill="transparent"/>${flow(right ? `M15 ${y}H85` : `M85 ${y}H15`, course.stage === 'success' ? 'animate-flow' : '')}<circle class="arrow-hint-ring" cx="${right ? 75 : 25}" cy="${y}" r="4"/><g data-arrow-label data-label-x="${right ? 57 : 43}"><rect class="arrow-badge-bg" rx="5" fill="#ffffff" stroke="#9bbecb" stroke-width="1"/><text x="0" y="0" dominant-baseline="central" text-anchor="middle">${svgTxt('diagram.' + j)}</text></g></g>`;
        })
        .join('');
      return `<div class="science-board">${svg(teacherBackdrop(i) + arrows)}<div class="column-labels">${[...n.columns].reverse().map((id) => `<div>${txt(id)}</div>`).join('')}</div></div>`;
    }
    const formed = course.stage !== 0;
    return `<div class="science-board">${svg((formed ? '<circle class="reaction-form" cx="50" cy="35" r="22" fill="#d7edf0"/>' : '<circle cx="21" cy="35" r="16" fill="#f2cdcf"/><circle cx="73" cy="35" r="22" fill="#d7edf0"/>') + flow('M25 70H85', formed ? 'animate-flow' : ''))}<div class="reaction-labels ${formed ? 'formed' : ''}">${formed ? `<div>${txt('diagram.5')}</div>` : `<div>${txt('diagram.0')}</div><div></div>`}</div></div>`;
  }
  function actionQuestion() {
    const n = current(),
      i = course.node,
      a = course.stage;
    if (a === 'micro') return txt(n.micro.stem);
    if (a === 'match-correct') return txt(n.question);
    if (a === 'success' || a === 'action-correct') return '';
    if (i === 0) return a === 0 ? txt(n.question) : txt(n.actions[1].text);
    if (i === 1) return a === 0 ? txt(n.question) : txt(n.actions[1].text);
    if (i === 2) return txt(n.question);
    if (i === 3) return a === 0 ? '' : txt(n.question);
    if (i === 4) return txt(n.question);
    return txt(n.actions[a].text);
  }
  const original = (t) => `<span data-original>${esc(t)}</span>`;
  function answerOptions() {
    const n = current(),
      i = course.node,
      a = course.stage;
    if (['success', 'micro'].includes(a)) return '';
    let opts =
      i === 0 || i === 1
        ? a === 1
          ? n.actions[1].options
          : []
        : i === 3
          ? a === 1
            ? n.options
            : []
          : i === 5
            ? n.actions[a].options
            : [];
    return opts.length
      ? `<div class="answer-options">${optionOrder('answer.' + i + '.' + a, opts.length)
          .map((j) => {
            const id = opts[j];
            return `<button data-answer="${j}" class="${course.selected === j ? 'selected' : ''}" aria-pressed="${course.selected === j}">${txt(id)}</button>`;
          })
          .join('')}</div>`
      : '';
  }
  function microOptionsHtml() {
    const n = current(),
      i = course.node;
    if (!n.micro) return '';
    const perm = optionOrder('micro.' + i, n.micro.options.length);
    return perm
      .map(
        (origIdx) =>
          `<button data-micro="${origIdx}" class="${course.microAnswer === origIdx ? 'selected' : ''}">${txt(n.micro.options[origIdx])}</button>`,
      )
      .join('');
  }
  function hintText() {
    const n = current(),
      a = course.stage;
    if (a === 'micro') return n.micro?.hint;
    return n.hints[
      (course.node === 0 || course.node === 1 || course.node === 5) && a === 1 ? 1 : 0
    ];
  }
  function feedbackHtml() {
    return course.feedback.length
      ? `<div class="script-feedback ${course.error.length ? 'error' : 'success'}" role="status">${course.feedback.map((id) => (id.startsWith('original:') ? original(id.slice(9)) : txt(id))).join(' ')}</div>`
      : '';
  }
  function nodeScreen() {
    const n = current(),
      i = course.node,
      a = course.stage;
    const hint = hintText();
    let bottom = '';
    if (a === 'match-correct') bottom = button('match-next', generic('下一步 →'));
    else if (a === 'success') bottom = button('next-node', generic('下一關 →'));
    else if (a === 'micro') bottom = '';
    else if (a === 'action-correct') bottom = button('next-action', generic('下一步 →'));
    else if (i === 4) bottom = button('submit-arrow', generic('送出'));
    else if (a === 0 && (i === 1 || i === 3)) bottom = txt(n.actions[0].text);
    const small =
      basicsVisible && n.basics ? `<div class="recognition">${txt(n.basics)}</div>` : '';
    const micro = a === 'micro';
    const matching = [0, 2].includes(i) && [0, 'match-correct'].includes(a);
    return `<section class="student-screen ${matching ? 'matching-screen' : ''}" data-screen="node" data-node="${i}" data-action="${a}"><header class="student-header"><div class="heading-row"><h1>${txt(n.title)}</h1>${button('hint-toggle', generic('💡提示'))}</div>${small}<h2 id="student-question">${actionQuestion()}</h2>${matching && a === 0 ? `<p class="matching-instruction">${txt(n.actions[0].text)}</p>` : ''}${course.hint && hint ? `<aside class="hint-box">${txt(hint)}</aside>` : ''}</header><main class="student-main ${micro ? 'micro-mode' : ''}"><section class="diagram-region" id="student-figure">${diagram()}</section><section class="response-region">${matching ? matchingHtml() : micro ? `<div class="answer-options">${microOptionsHtml()}</div>${button('micro-submit', generic('送出'))}` : answerOptions()}${feedbackHtml()}${course.isReview ? button('return-quiz', generic('返回')) : ''}</section></main><footer class="student-footer">${course.retry ? retryHtml() : bottom}</footer><aside class="student-dock">${mapHtml()}</aside></section>`;
  }
  function finishAction() {
    const i = course.node;
    course.selected = null;
    course.error = [];
    course.hint = false;
    if (i === 1 && course.stage === 0) {
      course.feedback = [current().success];
      course.stage = 'action-correct';
    } else if (i === 3 && course.stage === 0) {
      course.stage = 1;
      course.feedback = [];
    } else if ((i === 0 || i === 5) && course.stage === 0) {
      course.stage = 1;
      course.feedback = i === 5 ? [current().success] : [];
    } else finishNodeActions();
    save();
    render();
  }
  function finishNodeActions() {
    const i = course.node;
    course.feedback = i === 4 ? [current().success] : [];
    if(i!==4)course.placements=[];
    Model.markNode(model, i, 'task', true);
    course.stage = i === 4 ? 'success' : 'micro';
    course.microAnswer = null;
    if (i === 4) {
      if (!course.done.includes(i)) course.done.push(i);
      Model.markNode(model, i, 'micro', true);
      Model.markNode(model, i, 'edges', true);
    }
    emit('explore', config.nodes[i].id);
  }
  function bindNode() {
    const n = current(),
      i = course.node;
    if ([0, 2].includes(i) && [0, 'match-correct'].includes(course.stage)) bindMatching();
    if (by('match-next'))
      by('match-next').onclick = () => {
        course.stage = 0;
        finishAction();
      };
    by('hint-toggle').onclick = () => {
      course.hint = !course.hint;
      render();
    };
    document.querySelectorAll('[data-card]').forEach(
      (b) =>
        (b.onclick = () => {
          course.selected = Number(b.dataset.card);
          course.feedback = [];
          render();
        }),
    );
    document.querySelectorAll('[data-slot]').forEach(
      (b) =>
        (b.onclick = () => {
          if (course.stage !== 0) return;
          const j = Number(b.dataset.slot);
          if (course.selected === null) {
            if (course.placements[j] !== undefined) {
              delete course.placements[j];
              course.error = [];
              render();
            }
            return;
          }
          const card = course.selected;
          const ok = j === card;
          if (ok) {
            course.placements[j] = card;
            course.error = [];
            course.feedback = [];
            course.selected = null;
            if (n.cards.every((_, k) => course.placements[k] === k)) {
              finishAction();
              return;
            }
          } else {
            course.error = [j];
            course.feedback = i === 2 ? [n.errors[card]] : [n.errors[0]];
            course.selected = null;
            failRetry('step');
            emit('hint', config.nodes[i].id);
          }
          save();
          render();
        }),
    );
    document.querySelectorAll('[data-answer]').forEach(
      (b) =>
        (b.onclick = () => {
          const value = Number(b.dataset.answer);
          const good = i === 0 ? 1 : i === 1 ? 0 : i === 3 ? 0 : i === 5 ? 0 : 0;
          course.selected = value;
          if (value === good) {
            finishAction();
            return;
          }
          failRetry('step');
          course.error = ['answer'];
          course.feedback = [n.errors[course.stage === 1 && n.errors.length > 1 ? 1 : 0]];
          emit('hint', config.nodes[i].id);
          save();
          render();
        }),
    );
    if (by('breathe')) by('breathe').onclick = () => finishAction();
    document.querySelectorAll('[data-arrow]').forEach((g) => {
      g.onclick = () => {
        if (course.stage !== 'success') {
          if (g.dataset.arrow === '0') course.h = !course.h;
          else course.b = !course.b;
          course.error = [];
          course.feedback = [];
          save();
          render();
        }
      };
      g.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      };
    });
    if (by('submit-arrow'))
      by('submit-arrow').onclick = () => {
        if (course.h && course.b) {
          finishNodeActions();
          save();
          render();
        } else {
          course.error = [...(!course.h ? [0] : []), ...(!course.b ? [1] : [])];
          course.feedback = [n.errors[0]];
          failRetry('step');
          save();
          render();
        }
      };
    if (by('next-action'))
      by('next-action').onclick = () => {
        course.stage = 1;
        course.feedback = [];
        course.hint = false;
        save();
        render();
      };
    document.querySelectorAll('[data-micro]').forEach(
      (b) =>
        (b.onclick = () => {
          course.microAnswer = Number(b.dataset.micro);
          render();
        }),
    );
    if (by('micro-submit'))
      by('micro-submit').onclick = () => {
        if (course.microAnswer === null) return;
        const ok = course.microAnswer === n.micro.answer;
        emit('answer', 'n' + (i + 1) + '-micro', ok);
        if (ok) {
          if (!course.done.includes(i)) course.done.push(i);
          Model.markNode(model, i, 'micro', true);
          Model.markNode(model, i, 'edges', true);
          course.stage = 'success';
          course.feedback = i === 2 ? [n.success] : [];
          course.error = [];
          course.hint = false;
        } else {
          const letter = ['A', 'B', 'C', 'D'][course.microAnswer];
          const fbId = n.micro.feedback[letter];
          course.feedback = [fbId];
          course.error = ['micro'];
          failRetry('node');
        }
        save();
        render();
      };
    if (by('next-node'))
      by('next-node').onclick = () => {
        if (i < 5) enterNode(i + 1);
        else {
          course.screen = 'trace';
          course.traceIndex = 0;
          course.feedback = [];
          course.hint = false;
          save();
          render();
        }
      };
    if (by('return-quiz'))
      by('return-quiz').onclick = () => {
        if (course.traceReturn !== undefined) {
          course.screen = 'trace';
          course.traceIndex = course.traceReturn;
          delete course.traceReturn;
          course.review = null;
          course.isReview = false;
        } else {
          course.isReview = false;
          course.screen = 'quiz';
          course.reviewed = true;
        }
        save();
        render();
      };
  }
  function traceScreen() {
    const j = course.traceIndex;
    const groups = [
      config.graph.edges
        .filter((e) => e.from === 'node_chem_buffer' || e.to === 'node_chem_buffer')
        .map((e) => e.id),
      config.graph.edges
        .filter((e) => /resp_system|co2_excretion/.test(e.from + ' ' + e.to))
        .map((e) => e.id),
      config.graph.edges.map((e) => e.id),
    ];
    const shown = j === 0 ? [] : groups.slice(0, j).flat();
    return `<section class="student-screen" data-screen="trace"><header class="student-header"><div class="heading-row"><h1>${txt('end.title')}</h1>${j < 3 ? button('hint-toggle', generic('💡提示')) : ''}</div><h2>${txt(j < 3 ? 'end.copy' : 'end.final')}</h2>${course.hint && j < 3 ? button('trace-review', generic('回看第 ' + [1, 4, 5][j] + ' 關')) : ''}</header><main class="student-main"><section class="diagram-region ${j === 0 ? 'map-covered' : ''}" id="student-figure">${j === 0 ? '' : mapHtml(shown)}</section><section class="response-region">${
      j < 3
        ? `<h2>${txt(S.trace[j].question)}</h2><div class="answer-options">${optionOrder(
            'trace.' + j,
            S.trace[j].options.length,
          )
            .map((k) => {
              const id = S.trace[j].options[k];
              return `<button data-trace="${k}" class="${course.error.includes(k) ? 'wrong' : ''}">${txt(id)}</button>`;
            })
            .join('')}</div>`
        : button('enter-assessment', txt('end.button.0'))
    }${feedbackHtml()}</section></main><footer class="student-footer">${retryHtml()}</footer></section>`;
  }
  function bindTrace() {
    if (by('hint-toggle'))
      by('hint-toggle').onclick = () => {
        course.hint = !course.hint;
        render();
      };
    if (by('trace-review'))
      by('trace-review').onclick = () => {
        course.traceReturn = course.traceIndex;
        enterNode([0, 3, 4][course.traceIndex], true);
      };
    document.querySelectorAll('[data-trace]').forEach(
      (b) =>
        (b.onclick = () => {
          if (Number(b.dataset.trace) === 0) {
            course.traceIndex++;
            course.feedback = [];
            course.error = [];
            course.hint = false;
            if (course.traceIndex === 3) model.trace = true;
          } else {
            course.error = [Number(b.dataset.trace)];
            course.feedback = [
              S.nodes[[0, 3, 4][course.traceIndex]].errors[course.traceIndex === 0 ? 1 : 0],
            ];
            failRetry('trace');
          }
          save();
          render();
        }),
    );
    if (by('enter-assessment'))
      by('enter-assessment').onclick = () => {
        course.screen = 'transition';
        course.review = null;
        save();
        render();
      };
  }
  function transitionScreen() {
    return `<section class="student-screen transition-screen" data-screen="transition"><header class="student-header"><h1>${interfaceTxt('transitionTitle')}</h1></header><main class="intro-region"><h2>${txt('quiz.transition.copy')}</h2>${button('start-quiz', txt('quiz.transition.button.0'))}</main></section>`;
  }
  function bindTransition() {
    if (by('start-quiz'))
      by('start-quiz').onclick = () => {
        course.screen = 'quiz';
        course.review = null;
        save();
        render();
      };
  }
  function quizScreen() {
    if (course.review && course.review !== true)
      return `<section class="student-screen"><header class="student-header"><h1>${generic('返回')}</h1></header><main class="quiz-region"><div class="quiz-note">${txt('quiz.result.retry')}</div>${original(course.review)}${button('review-case', generic('回看第 ' + (course.reviewNode + 1) + ' 關'))}${button('retry-case', generic('再試一次'))}</main></section>`;
    if (model.casePassed)
      return `<section class="student-screen"><main class="quiz-region"><div class="quiz-note">${txt('quiz.result.pass')}</div>${txt('end.final')}</main></section>`;
    const q = Model.pair(config, model)[model.cases.length],
      rows = course.tier === 2 ? q.reasons : q.options;
    return `<section class="student-screen" data-screen="quiz"><header class="student-header"><h1>${original(q.stem)}</h1></header><main class="quiz-region"><div class="answer-options">${rows.map((text, j) => `<button data-pool="${j}" class="${(course.tier === 2 ? course.poolReason : course.poolAnswer) === j ? 'selected' : ''}">${original(text)}</button>`).join('')}</div>${button('pool-submit', generic('送出'))}</main></section>`;
  }
  function bindQuiz() {
    document.querySelectorAll('[data-pool]').forEach(
      (b) =>
        (b.onclick = () => {
          if (course.tier === 2) course.poolReason = Number(b.dataset.pool);
          else course.poolAnswer = Number(b.dataset.pool);
          render();
        }),
    );
    if (by('pool-submit'))
      by('pool-submit').onclick = () => {
        const q = Model.pair(config, model)[model.cases.length];
        if (course.poolAnswer === null || (course.tier === 2 && course.poolReason === null)) return;
        if (q.reasons && course.tier === 1) {
          course.tier = 2;
          save();
          render();
          return;
        }
        const ok = Model.answerCase(model, q, course.poolAnswer, course.poolReason);
        emit('answer', q.id, ok);
        if (ok) {
          course.poolAnswer = null;
          course.poolReason = null;
          course.tier = 1;
          if (model.casePassed && Model.complete(model)) emit('complete');
        } else {
          course.review = q.feedback[course.poolAnswer] || q.reasonFeedback?.[course.poolReason];
          course.reviewNode = q.node;
          course.reviewed = false;
        }
        save();
        render();
      };
    if (by('review-case')) by('review-case').onclick = () => enterNode(course.reviewNode, true);
    if (by('retry-case')) {
      by('retry-case').disabled = !course.reviewed;
      by('retry-case').onclick = () => {
        Model.retry(model);
        model.trace = course.traceIndex === 3;
        course.review = null;
        course.poolAnswer = null;
        course.poolReason = null;
        course.tier = 1;
        save();
        render();
      };
    }
  }
  const by = (id) => document.getElementById(id);
  function render() {
    let html;
    if (course.screen === 'intro')
      html = `<section class="student-screen intro-screen" data-screen="intro"><header class="student-header"><h1>${txt('intro.title')}</h1></header><main class="intro-region"><h2>${txt('intro.copy')}</h2><div class="recognition">${S.introBasics.map((id) => `<p>${txt(id)}</p>`).join('')}</div>${button('start', txt('intro.button.0'))}</main></section>`;
    else if (course.screen === 'node') html = nodeScreen();
    else if (course.screen === 'trace') html = traceScreen();
    else if (course.screen === 'transition') html = transitionScreen();
    else html = quizScreen();
    document.body.innerHTML = html;
    if (by('start')) by('start').onclick = () => enterNode(0);
    if (course.screen === 'node') bindNode();
    if (course.screen === 'trace') bindTrace();
    if (course.screen === 'transition') bindTransition();
    if (course.screen === 'quiz') bindQuiz();
    if (by('return-quiz') && course.traceReturn !== undefined)
      by('return-quiz').onclick = () => {
        course.screen = 'trace';
        course.traceIndex = course.traceReturn;
        delete course.traceReturn;
        course.review = null;
        course.isReview = false;
        save();
        render();
      };
    if (course.retry) {
      document
        .querySelectorAll(
          '.response-region button:not(#strict-retry), .diagram-region button, .student-footer button:not(#strict-retry)',
        )
        .forEach((b) => (b.disabled = true));
      document.querySelectorAll('[data-arrow]').forEach((g) => {
        g.onclick = null;
        g.onkeydown = null;
        g.setAttribute('aria-disabled', 'true');
      });
      if (by('strict-retry')) by('strict-retry').onclick = retryAttempt;
      else
        setTimeout(
          () => {
            if (course.retry) render();
          },
          Math.max(1, course.retryAt - Date.now()),
        );
    }
    positionArrowLabels();
    window.StudentScriptUI = {
      getState: () => ({ course, model }),
      reset: () => {
        localStorage.removeItem(KEY);
        location.reload();
      },
    };
  }
  function positionArrowLabels() {
    document.querySelectorAll('[data-arrow-label]').forEach((group) => {
      const m = group.ownerSVGElement.getScreenCTM();
      if (!m) return;
      const sx = Math.hypot(m.a, m.b),
        sy = Math.hypot(m.c, m.d);
      if (!sx || !sy) return;
      const line = group.parentElement.querySelector('.s-flow');
      const text = group.querySelector('text');
      text.style.fontSize = '14px';
      const width = Math.ceil(text.getComputedTextLength()) + 16,
        height = 24;
      const rect = group.querySelector('rect');
      rect.setAttribute('x', -width / 2);
      rect.setAttribute('y', -height / 2);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      const halfStroke = (parseFloat(getComputedStyle(line).strokeWidth) * sy) / 2;
      const y = line.getBBox().y - (halfStroke + 3 + height / 2) / sy;
      group.setAttribute(
        'transform',
        `translate(${group.dataset.labelX} ${y}) scale(${1 / sx} ${1 / sy})`,
      );
    });
  }
  window.addEventListener('resize', positionArrowLabels);
  render();
}
