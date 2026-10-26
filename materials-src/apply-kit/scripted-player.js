function mountApplyScripted(config) {
  const S = config.studentScript,
    U = S.units,
    storageKey = `apply-script:label-on-figure-v1:${S.slug}:${S.sha256}:${S.planSha256}`;
  const esc = (text) =>
    String(text ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const txt = (id) => {
    if (!U[id]) throw Error('Unapproved copy ' + id);
    return `<span data-copy="${id}">${esc(U[id].text)}</span>`;
  };
  const common = (text) => `<span data-common>${esc(text)}</span>`;
  const authorized = (key) => `<span data-interface="${key}">${esc(S.common[key])}</span>`;
  const button = (id, text) => `<button id="${id}" type="button">${text}</button>`;
  const emit = (kind, ...args) => {
    try {
      window.CourseLearning?.[kind]?.(...args);
    } catch {}
  };
  let c = {
    screen: 'intro',
    node: 0,
    step: 0,
    done: [],
    traceIndex: 0,
    feedback: [],
    errors: [],
    retry: null,
    selected: [],
    visited: [],
    signs: [],
    arrows: [],
    progress: 0,
    slider: 0,
    microAnswer: null,
    quizStage: 'foundation',
    quizIndex: 0,
    quizAnswer: null,
    sent: false,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (
      saved?.version === 1 &&
      saved.scriptSha === S.sha256 &&
      Array.isArray(saved.course?.done) &&
      saved.course.node >= 0 &&
      saved.course.node < 6
    )
      c = { ...c, ...saved.course };
  } catch {}
  const core = createStudentInteractionCore(c),
    ui = { guideStep: null, openRow: null, pendingSwap: null };
  let guideScope = 'preview';
  const save = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ version: 1, scriptSha: S.sha256, course: c }),
      );
    } catch {}
  };
  const n = () => S.nodes[c.node],
    step = () => n().steps[c.step];
  const guideKey = () => `${step()?.type==='locate'?'figure-locate:v1':'acidbase-matching-guide:v1'}:${guideScope}:${S.slug}:N${c.node + 1}`;
  const seenGuide = () => {
    try {
      return localStorage.getItem(guideKey()) === 'done';
    } catch {
      return false;
    }
  };
  const closeGuide = () => {
    try {
      localStorage.setItem(guideKey(), 'done');
    } catch {}
    ui.guideStep = null;
    c.locateGuide=false;
    render();
  };
  const mi = (id) =>
    `<span data-interface="match.${id}">${esc(id.startsWith('progress') ? `已完成 ${Number(id.slice(8))}／${step().cards.length}` : (step().matchingCopy?.[id] || S.matching[id]))}</span>`;
  function clearStep() {
    c.feedback = [];
    c.errors = [];
    c.retry = null;
    c.hint = false;
    c.selected = [];
    c.visited = [];
    c.signs = [];
    c.arrows = [];
    c.progress = 0;
    c.slider = 0;
    c.microAnswer = null;
    c.success = false;
    ui.openRow = null;
    ui.pendingSwap = null;
    if(step()?.type==='locate'){c.locate={values:Array(step().cards.length).fill(null),picked:null,order:[],directions:Array(step().cards.length).fill(false)};c.locateGuide=!seenGuide();}
    if (step()?.type === 'matching') {
      c.match = core.freshMatch(step().key, step().cards.length, step().slots.length);
      ui.guideStep = seenGuide() ? null : 1;
    } else ui.guideStep = null;
  }
  function enterNode(i, review = false) {
    c.screen = 'node';
    c.node = i;
    c.step = 0;
    c.phase = S.nodes[i].basics ? 'basics' : 'action';
    c.review = review;
    clearStep();
    save();
    render();
  }
  function retry() {
    const scope = c.retry;
    core.reshuffle();
    if (scope === 'trace') {
      c.traceIndex = 0;
      c.tracePassed = false;
      c.screen = 'trace';
    } else if (scope === 'node') {
      c.step = 0;
      c.phase = 'action';
      c.done = c.done.filter((i) => i !== c.node);
    }
    clearStep();
    save();
    render();
  }
  function fail(scope, feedback, errors = ['answer']) {
    c.feedback = feedback.filter(Boolean);
    c.errors = errors;
    core.fail(scope);
    save();
    render();
  }
  function passNode() {
    if (!c.done.includes(c.node)) {
      c.done.push(c.node);
      emit('explore', `${S.slug}-node-0${c.node + 1}`);
    }
    c.phase = 'passed';
    c.feedback = n().success;
    c.errors = [];
    c.selected = [];
    c.success = true;
    save();
    render();
  }
  function passStep() {
    c.success = true;
    c.feedback = step().success;
    c.errors = [];
    c.phase = 'step-passed';
    ui.guideStep = null;
    save();
    render();
  }
  function advanceStep() {
    if (c.step + 1 < n().steps.length) {
      c.step++;
      c.phase = 'action';
      clearStep();
    } else if (n().micro) {
      c.phase = 'micro';
      clearStep();
    } else {
      passNode();
      return;
    }
    save();
    render();
  }
  function failureCopy() {
    return step().error?.length
      ? step().error
      : n().errors.length
        ? n().errors
        : n().success.length
          ? n().success
          : n().basics
            ? [n().basics]
            : [n().question];
  }
  function feedbackHtml() {
    if(c.screen==='node'&&step().type==='locate'&&c.phase==='action'&&c.retry==='step'&&c.errors.every(r=>Number.isInteger(r))){
      const rows=c.errors.map(row=>`<p data-row-feedback="${row}">${txt(step().cards[row])} ${(step().feedback[row]||[]).map(txt).join(' ')}</p>`).join('');
      return `<div class="script-feedback error" role="status">${rows}${!step().feedback.some(f=>f?.length)?failureCopy().map(txt).join(' '):''}</div>`;
    }
    return c.feedback?.length
      ? `<div class="script-feedback ${c.errors.length ? 'error' : 'success'}" role="status">${c.feedback.map(txt).join(' ')}</div>`
      : '';
  }
  function retryButton() {
    return core.retryReady() ? button('strict-retry', authorized(c.retry)) : '';
  }
  function mapHtml(full = false) {
    const count = c.screen === 'trace' ? Math.min(c.traceIndex * 2, 6) : c.done.length;
    if (!full)
      return `<div class="script-map mini-map" aria-label="心智圖"><svg viewBox="0 0 100 100">${Array.from(
        { length: 6 },
        (_, i) => {
          const a = (i * Math.PI) / 3,
            x = 50 + 35 * Math.cos(a),
            y = 50 + 35 * Math.sin(a);
          return `<path d="M50 50L${x} ${y}" stroke="${c.done.includes(i) ? '#397b91' : '#dce9ee'}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="5" fill="${c.done.includes(i) ? '#397b91' : '#edf4f8'}"/>`;
        },
      ).join('')}<circle cx="50" cy="50" r="7" fill="#a8c5d1"/></svg></div>`;
    return `<div class="scripted-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${S.nodes.map((_, i) => `<path data-map-edge="${i}" d="M50 50L${i % 2 ? 82 : 18} ${15 + Math.floor(i / 2) * 35}" stroke="${i < count ? '#397b91' : '#dce9ee'}" stroke-width="1"/>`).join('')}</svg><div class="map-center">${txt(S.title)}</div>${S.nodes.map((node, i) => `<div class="map-branch ${i < count ? 'revealed' : ''}" style="left:${i % 2 ? 68 : 1}%;top:${6 + Math.floor(i / 2) * 34}%">${i < count ? txt(node.title) : ''}</div>`).join('')}</div>`;
  }
  function choiceButtons(options, attribute, selected = []) {
    return `<div class="answer-options figure-options">${core
      .order(`${c.screen}.${c.node}.${c.step}.${attribute}.${c.traceIndex}`, options.length)
      .map(
        (i) =>
          `<button data-${attribute}="${i}" class="${selected.includes(i) ? 'selected' : ''}" aria-pressed="${selected.includes(i)}">${txt(options[i])}</button>`,
      )
      .join('')}</div>`;
  }
  function operationHtml() {
    const s = step();
    if (s.type === 'matching')
      return renderStudentMatching({
        n: s,
        m: c.match,
        ui,
        errors: c.errors,
        retry: c.retry,
        txt,
        mi,
        button,
      });
    if (['choice', 'point', 'sequence', 'explore', 'multi'].includes(s.type))
      return choiceButtons(s.options, 'operation', c.selected);
    if (s.type === 'arrows')
      return `<div class="arrow-controls">${s.expected.map((_, j) => `<button data-arrow="${j}" aria-pressed="${!!c.arrows[j]}">${txt(s.options[j] || s.options[0])}${common(c.arrows[j] ? ' →' : ' ←')}</button>`).join('')}</div>`;
    if (s.type === 'signs')
      return `<div class="equation-controls">${s.labels.map((id, j) => `${j === 0 ? '' : j > 1 ? `<button data-sign="${j - 2}">${c.signs[j - 2] === undefined ? common('□') : txt(s.options[c.signs[j - 2]])}</button>` : ''}${txt(id)}${j === 0 ? common('＝') : ''}`).join('')}</div>`;
    if (s.type === 'slider') {
      const min = s.min ?? (s.unit === '%' ? 0 : s.unit === 'mL' ? 0 : 0);
      const max = s.max ?? (s.unit === '%' ? 100 : s.unit === 'mL' ? 500 : 600);
      const stepVal = s.stepVal ?? (s.unit === '%' ? 5 : s.unit === 'mL' ? 50 : 25);
      const unit = s.unit ?? ' mg/min';
      const threshold = s.threshold ?? (s.unit === '%' ? 60 : s.unit === 'mL' ? 300 : 375);
      const reach = c.slider >= threshold;
      return `<label class="slider-control">${s.unit === '%' ? '' : txt(s.options[0])}<input aria-label="${esc(U[s.question].text)}" id="glucose-slider" type="range" min="${min}" max="${max}" step="${stepVal}" value="${c.slider}"><output>${common(c.slider + unit)}</output></label>${s.unit === '%' && (c.success || c.retry) ? `<ul class="answer-review-options">${s.options.map(id=>`<li>${txt(id)}</li>`).join('')}</ul>` : ''}${reach && s.labels?.[1] ? `<p class="slider-result">${txt(s.labels[1])}</p>` : ''}`;
    }
    return '';
  }
  function nodeHtml() {
    const node = n(),
      s = step(),
      micro = c.phase === 'micro',
      basics = c.phase === 'basics',
      locating = s.type==='locate',
      matching = s.type === 'matching' && ['action', 'step-passed'].includes(c.phase);
    let bottom = '';
    if (c.retry) bottom = retryButton();
    else if (basics) bottom = button('begin-action', common('開始作答'));
    else if (c.phase === 'passed') bottom = button('next-node', common('下一關 →'));
    else if (c.phase === 'step-passed') bottom = button('next-step', common('下一步 →'));
    else if (micro) bottom = button('micro-submit', common('送出'));
    else if (['multi', 'arrows', 'signs'].includes(s.type))
      bottom = button('operation-submit', common('送出'));
    else if(s.type==='locate')bottom=`<button id="locate-check" ${c.locate.values.filter(v=>v!==null).length<s.spatial.required.length?'disabled':''}>${common('送出')}</button>`;
    else if (s.type === 'slider') {
      const threshold = s.threshold ?? (s.unit === '%' ? 60 : s.unit === 'mL' ? 300 : 375);
      bottom = s.unit === '%' ? '' : `<button id="slider-next" ${c.slider <= threshold ? 'disabled' : ''}>${common('下一步 →')}</button>`;
    }
    const q = micro ? node.micro.stem : s.question;
    return `<section class="student-screen scripted-course ${locating?'spatial-course':''} ${matching ? 'matching-screen' : ''}" data-screen="node" data-node="${c.node}" data-phase="${c.phase}" data-step="${c.step}"><header class="student-header"><div class="heading-row"><h1>${txt(node.title)}</h1>${!basics ? button('hint-toggle', common('💡提示')) : ''}</div>${!basics ? `<h2>${txt(q)}</h2>` : ''}${c.hint ? `<aside class="hint-box">${txt(node.hint)}</aside>` : ''}</header><main class="student-main ${matching ? 'matching-main' : ''}"><section class="diagram-region" id="student-figure">${renderScriptedFigure({ node, step: s, state: c, txt, controls: !basics && !micro && c.phase !== 'passed', order: core.order(`${c.screen}.${c.node}.${c.step}.operation.${c.traceIndex}`, s.options.length), operation: !basics && !micro && !matching && c.phase !== 'passed' ? operationHtml() : '' })}</section><section class="response-region">${basics ? `<div class="recognition">${txt(node.basics)}</div>` : micro ? choiceButtons(node.micro.options, 'micro', c.microAnswer === null ? [] : [c.microAnswer]) : matching ? operationHtml() : ''}${!basics && s.instruction && !s.hideInstruction && (c.success || c.retry) ? `<p class="action-instruction">${txt(s.instruction)}</p>` : ''}${!basics && c.step === 0 && node.extra.length && (c.success || c.retry) ? `<div class="script-extra">${node.extra.map(txt).join(' ')}</div>` : ''}${c.visited?.length && s.reveals?.length ? `<div class="recognition">${c.visited.map((j) => txt(s.reveals[j])).join(' ')}</div>` : ''}${feedbackHtml()}${c.review ? button('return-review', common('返回')) : ''}</section></main><footer class="student-footer">${bottom}</footer><aside class="student-dock">${mapHtml()}</aside></section>`;
  }
  function bindSpatial() {
    const s=step(),spec=s.spatial,m=c.locate;
    const active=()=>c.phase==='action'&&!c.retry;
    document.querySelectorAll('[data-spatial-card]').forEach(b=>b.onclick=()=>{if(!active())return;m.picked=Number(b.dataset.spatialCard);save();render();});
    const place=target=> {
      if(!active()||m.picked===null)return;
      const row=m.picked,other=target<0?-1:m.values.findIndex((v,i)=>i!==row&&v===target);
      if(other>=0)m.values[other]=m.values[row];
      m.values[row]=target;m.order=m.order.filter(r=>r!==row);m.order.push(row);m.picked=null;save();render();
    };
    document.querySelectorAll('[data-spatial-target]').forEach(b=>b.onclick=e=>{e.stopPropagation();let target=Number(b.dataset.spatialTarget);if(e.detail){const box=document.querySelector('.spatial-canvas').getBoundingClientRect(),w=spec.crop[2],h=spec.crop[3];target=spec.points.map(([x,y],i)=>({i,d:Math.hypot(box.x+x/w*box.width-e.clientX,box.y+y/h*box.height-e.clientY)})).sort((a,b)=>a.d-b.d)[0].i;}place(target);});
    document.querySelectorAll('[data-spatial-view]').forEach(b=>b.onclick=()=>document.querySelector(`[data-spatial-target="${b.dataset.spatialView}"]`)?.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
    const canvas=document.querySelector('.spatial-canvas');if(canvas)canvas.onclick=()=>place(-1);
    document.querySelectorAll('[data-spatial-direction]').forEach(b=>b.onclick=()=>{if(!active())return;const row=Number(b.dataset.spatialDirection);m.directions[row]=!m.directions[row];save();render();});
    const help=document.getElementById('locate-help');if(help)help.onclick=()=>{c.locateGuide=true;render();};
    const skip=document.getElementById('locate-skip');if(skip)skip.onclick=closeGuide;
    const check=document.getElementById('locate-check');if(check)check.onclick=()=> {
      if(!active())return;
      // Optional labels may be placed at their own correct spot; only misplaced optional labels or distractors (expected<0) count as wrong.
      let wrong=s.cards.map((_,r)=>r).filter(r=>spec.required.includes(r)?m.values[r]!==spec.expected[r]:m.values[r]!==null&&m.values[r]>=0&&m.values[r]!==spec.expected[r]);
      if(spec.sequence){const prefix=spec.unorderedPrefix||0;const sequence=m.order.filter(r=>spec.required.includes(r));if(sequence.slice(prefix).some((r,i)=>r!==spec.sequence[prefix+i])||prefix&&new Set(sequence.slice(0,prefix)).size!==prefix)wrong=[...new Set([...wrong,...spec.required])];}
      if(spec.directions)wrong=[...new Set([...wrong,...spec.required.filter(r=>!m.directions[r])])];
      if(wrong.length){c.feedback=[...new Set(wrong.flatMap(r=>s.feedback[r]?.length?s.feedback[r]:failureCopy()))];c.errors=wrong;core.fail('step');save();render();}
      else {c.visited=spec.required;c.success=true;closeGuide();passStep();}
    };
  }
  function bindNode() {
    const node = n(),
      s = step();
    const by = (id) => document.getElementById(id);
    if (by('begin-action'))
      by('begin-action').onclick = () => {
        c.phase = 'action';
        save();
        render();
      };
    if (by('hint-toggle'))
      by('hint-toggle').onclick = () => {
        c.hint = !c.hint;
        render();
      };
    if(s.type==='locate')bindSpatial();
    if (s.type === 'matching' && ['action', 'step-passed'].includes(c.phase))
      bindStudentMatching({
        n: s,
        m: c.match,
        ui,
        render,
        save,
        closeGuide,
        onCheck(wrong) {
          c.errors = wrong;
          c.feedback = [];
          c.match.feedback = s.cards.map((id, row) =>
            wrong.includes(row)
              ? s.feedback[row]?.length
                ? s.feedback[row]
                : [id, s.slots[s.expected[row]]]
              : [],
          );
          if (wrong.length) {
            core.fail('step');
            save();
            render();
          } else {
            closeGuide();
            passStep();
          }
        },
      });
    if (s.blindHotspots && c.phase === 'action' && !c.retry) {
      document.querySelector('.scripted-svg').onclick = () => fail('step', failureCopy());
    }
    document.querySelectorAll('[data-operation]').forEach(
      (b) =>
        (b.onclick = () => {
          const value = Number(b.dataset.operation);
          if (s.type === 'choice' || s.type === 'point') {
            if (value === s.answer) passStep();
            else fail('step', failureCopy());
          } else if (s.type === 'sequence') {
            if (c.progress < (s.unorderedPrefix || 0) ? s.expected.slice(0,s.unorderedPrefix).includes(value) && !c.selected.includes(value) : value === s.expected[c.progress]) {
              c.progress++;
              c.selected.push(value);
              if (c.progress === s.expected.length) passStep();
              else {
                save();
                render();
              }
            } else fail('step', failureCopy());
          } else if (s.type === 'explore') {
            if (!c.visited.includes(value)) c.visited.push(value);
            c.selected = [...c.visited];
            if (c.visited.length === s.options.length) {
              c.phase = 'step-passed';
              c.success = true;
            }
            save();
            render();
          } else {
            c.selected = c.selected.includes(value)
              ? c.selected.filter((v) => v !== value)
              : [...c.selected, value];
            save();
            render();
          }
        }),
    );
    document.querySelectorAll('[data-sign]').forEach(
      (b) =>
        (b.onclick = () => {
          const j = Number(b.dataset.sign);
          const values = core.order(
            `${c.screen}.${c.node}.${c.step}.operation.${c.traceIndex}`,
            s.options.length,
          );
          c.signs[j] = values[(values.indexOf(c.signs[j]) + 1) % values.length];
          save();
          render();
        }),
    );
    document.querySelectorAll('[data-arrow]').forEach(
      (b) =>
        (b.onclick = () => {
          const j = Number(b.dataset.arrow);
          c.arrows[j] = !c.arrows[j];
          save();
          render();
        }),
    );
    if (by('operation-submit'))
      by('operation-submit').onclick = () => {
        const ok =
          s.type === 'multi'
            ? s.expected.length === c.selected.length &&
              s.expected.every((i) => c.selected.includes(i))
            : s.type === 'signs'
              ? s.expected.every((v, j) => c.signs[j] === v)
              : s.expected.every((v, j) => c.arrows[j] === v);
        if (ok) passStep();
        else fail('step', failureCopy());
      };
    if (by('glucose-slider')) {
      const range = by('glucose-slider');
      range.oninput = (e) => {
        c.slider = Number(e.target.value);
        save();
        const template = document.createElement('template');
        template.innerHTML = renderScriptedFigure({node:n(), step:s, state:c, txt, controls:false});
        document.querySelector('.scripted-svg').replaceWith(template.content.querySelector('.scripted-svg'));
        document.querySelector('.slider-control output').innerHTML = common(c.slider + (s.unit ?? ' mg/min'));
        const next = by('slider-next');
        if (next) next.disabled = c.slider <= (s.threshold ?? (s.unit === '%' ? 60 : s.unit === 'mL' ? 300 : 375));
      };
      const submitWater = () => {
        if (c.slider === s.threshold) passStep();
        else fail('step', failureCopy());
      };
      if (s.unit === '%') {
        range.onpointerup = submitWater;
        range.onkeyup = e => { if (e.key === 'Enter') submitWater(); };
      }
    }
    if (by('slider-next')) by('slider-next').onclick = passStep;
    if (by('next-step')) by('next-step').onclick = advanceStep;
    document.querySelectorAll('[data-micro]').forEach(
      (b) =>
        (b.onclick = () => {
          c.microAnswer = Number(b.dataset.micro);
          save();
          render();
        }),
    );
    if (by('micro-submit')) {
      by('micro-submit').disabled = c.microAnswer === null;
      by('micro-submit').onclick = () => {
        const ok = c.microAnswer === node.micro.answer;
        emit('answer', `${S.slug}-node-0${c.node + 1}-micro`, ok);
        if (ok) passNode();
        else fail('node', [node.micro.feedback[c.microAnswer] || node.micro.defaultFeedback]);
      };
    }
    if (by('next-node'))
      by('next-node').onclick = () => {
        if (c.node < 5) enterNode(c.node + 1);
        else {
          c.screen = 'trace';
          c.traceIndex = 0;
          c.feedback = [];
          c.errors = [];
          save();
          render();
        }
      };
    if (by('return-review'))
      by('return-review').onclick = () => {
        c.screen = 'assessment';
        c.reviewed = true;
        c.review = false;
        c.feedback = [];
        c.errors = [];
        c.retry = null;
        save();
        render();
      };
  }
  function traceHtml() {
    const j = c.traceIndex;
    return `<section class="student-screen scripted-course" data-screen="trace"><header class="student-header"><h1>${common('結尾')}</h1>${S.endCopy ? `<h2>${txt(S.endCopy)}</h2>` : ''}</header><main class="student-main"><section class="diagram-region ${j === 0 ? 'map-covered' : ''}" id="student-figure">${j === 0 ? '' : mapHtml(true)}</section><section class="response-region">${j < 3 ? `<h2>${txt(S.trace[j].question)}</h2>${choiceButtons(S.trace[j].options, 'trace')}` : `<p>${txt(S.final)}</p>`}${feedbackHtml()}</section></main><footer class="student-footer">${c.retry ? retryButton() : j === 3 ? button('enter-assessment', common('下一步 →')) : ''}</footer></section>`;
  }
  function bindTrace() {
    document.querySelectorAll('[data-trace]').forEach(
      (b) =>
        (b.onclick = () => {
          if (Number(b.dataset.trace) === 0) {
            c.traceIndex++;
            c.feedback = [];
            c.errors = [];
            if (c.traceIndex === 3) c.tracePassed = true;
            save();
            render();
          } else fail('trace', [S.final]);
        }),
    );
    const b = document.getElementById('enter-assessment');
    if (b)
      b.onclick = () => {
        c.screen = 'transition';
        save();
        render();
      };
  }
  function assessmentHtml() {
    const q = config.questions[c.quizStage][c.quizIndex];
    if (c.assessmentPassed)
      return `<section class="student-screen scripted-course"><main class="intro-region"><h1>${authorized('pass')}</h1><p>${txt(S.final)}</p></main></section>`;
    return `<section class="student-screen scripted-course" data-screen="assessment"><header class="student-header"><h1><span data-original>${esc(q.stem)}</span></h1></header><main class="quiz-region"><div class="answer-options">${core
      .order('quiz.' + q.id, q.options.length)
      .map(
        (i) =>
          `<button data-pool="${i}" class="${c.quizAnswer === i ? 'selected' : ''}"><span data-original>${esc(q.options[i])}</span></button>`,
      )
      .join(
        '',
      )}</div>${c.quizWrong ? `<div class="script-feedback error">${authorized('retry')}<p data-original>${esc(c.moreGuide ? q.explain : q.hint)}</p></div>${!c.moreGuide ? button('more-guide', common('看第二層引導')) : button('review-node', common('回看對應節點'))}${c.reviewed ? button('retry-assessment', authorized('step')) : ''}` : button('pool-submit', common('送出'))}</main></section>`;
  }
  function bindAssessment() {
    const by = (id) => document.getElementById(id),
      q = config.questions[c.quizStage][c.quizIndex];
    document.querySelectorAll('[data-pool]').forEach((b) => {
      b.disabled = !!c.quizWrong;
      b.onclick = () => {
        c.quizAnswer = Number(b.dataset.pool);
        save();
        render();
      };
    });
    if (by('pool-submit')) {
      by('pool-submit').disabled = c.quizAnswer === null;
      by('pool-submit').onclick = () => {
        const ok = c.quizAnswer === q.answer;
        emit('answer', q.id, ok);
        if (!ok) {
          c.quizWrong = true;
          c.moreGuide = false;
          c.reviewed = false;
        } else {
          c.quizAnswer = null;
          c.quizIndex++;
          if (c.quizIndex === config.questions[c.quizStage].length) {
            if (c.quizStage === 'foundation') {
              c.quizStage = 'cases';
              c.quizIndex = 0;
            } else {
              c.assessmentPassed = true;
              if (c.done.length === 6 && c.tracePassed && !c.sent) {
                c.sent = true;
                emit('complete');
              }
            }
          }
        }
        save();
        render();
      };
    }
    if (by('more-guide'))
      by('more-guide').onclick = () => {
        c.moreGuide = true;
        save();
        render();
      };
    if (by('review-node'))
      by('review-node').onclick = () =>
        enterNode(Math.max(0, config.nodeIds.indexOf(q.nodeId)), true);
    if (by('retry-assessment'))
      by('retry-assessment').onclick = () => {
        c.quizIndex = 0;
        c.quizWrong = false;
        c.moreGuide = false;
        c.reviewed = false;
        c.quizAnswer = null;
        core.reshuffle();
        save();
        render();
      };
  }
  function render() {
    const oldFrame=document.querySelector('[data-spatial-scroll]'),oldScreen=document.querySelector('[data-screen="node"]');
    const scroll=oldFrame&&Number(oldScreen?.dataset.node)===c.node&&Number(oldScreen?.dataset.step)===c.step?{top:oldFrame.scrollTop,left:oldFrame.scrollLeft}:null;
    let html;
    if (c.screen === 'intro')
      html = `<section class="student-screen intro-screen scripted-course"><header class="student-header"><h1>${txt(S.title)}</h1></header><main class="intro-region"><h2>${txt(S.intro)}</h2>${button('start', txt(S.introButton))}</main></section>`;
    else if (c.screen === 'node') html = nodeHtml();
    else if (c.screen === 'trace') html = traceHtml();
    else if (c.screen === 'transition')
      html = `<section class="student-screen scripted-course" data-screen="transition"><header class="student-header"><h1>${common('準備考核')}</h1></header><main class="intro-region"><h2>${authorized('transition')}</h2>${button('start-quiz', common('開始考核'))}</main></section>`;
    else html = assessmentHtml();
    document.body.innerHTML = html;
    const by = (id) => document.getElementById(id);
    if (by('start')) by('start').onclick = () => enterNode(0);
    if (c.screen === 'node') bindNode();
    if (c.screen === 'trace') bindTrace();
    if (c.screen === 'assessment' && !c.assessmentPassed) bindAssessment();
    if (by('start-quiz'))
      by('start-quiz').onclick = () => {
        c.screen = 'assessment';
        save();
        render();
      };
    if (c.phase === 'step-passed' || c.phase === 'passed')
      document
        .querySelectorAll('[data-operation],[data-sign],[data-arrow],#glucose-slider')
        .forEach((b) => (b.disabled = true));
    if (c.retry) {
      document
        .querySelectorAll('button:not(#strict-retry):not(#hint-toggle),input')
        .forEach((b) => (b.disabled = true));
      if (by('strict-retry')) by('strict-retry').onclick = retry;
      else
        setTimeout(
          () => {
            if (c.retry) render();
          },
          Math.max(1, c.retryAt - Date.now()),
        );
    }
    positionFigureControls();
    layoutSpatialStamps();
    const newFrame=document.querySelector('[data-spatial-scroll]');if(scroll&&newFrame){newFrame.scrollTop=scroll.top;newFrame.scrollLeft=scroll.left;}
    window.StudentScriptUI = {
      getState: () => ({ course: c }),
      reset: () => {
        localStorage.removeItem(storageKey);
        location.reload();
      },
    };
  }
  function positionFigureControls() {
    const root = document.querySelector('.scripted-figure');
    const svg = root?.querySelector('svg');
    if (!svg) return;
    const m = svg.getScreenCTM(),
      bounds = root.getBoundingClientRect();
    if (!m) return;
    root.querySelector('.teacher-leaders')?.remove();
    const callouts = [...root.querySelectorAll('.diagram-hotspot:not(.blind-hotspot)')];
    const leaderLines=[];
    root.querySelectorAll('[data-figure-control]').forEach((button) => {
      const x = Number(button.dataset.x),
        y = Number(button.dataset.y);
      let px = m.a * x + m.c * y + m.e - bounds.left;
      let py = m.b * x + m.d * y + m.f - bounds.top;
      if(root.dataset.figureKind==='anatomy' && callouts.length>1 && callouts.includes(button)) {
        const index=Number(button.dataset.operation), rows=Math.ceil(callouts.length/2);
        const bx=index%2 ? bounds.width-button.offsetWidth/2-8 : button.offsetWidth/2+8;
        const by=24+Math.floor(index/2)*Math.max(40,(bounds.height-76)/Math.max(1,rows-1));
        leaderLines.push(`<path d="M${px} ${py}L${bx} ${by}"/><circle cx="${px}" cy="${py}" r="3"/>`);
        px=bx;py=by;
      }
      button.style.left =
        Math.max(
          button.offsetWidth / 2 + 2,
          Math.min(bounds.width - button.offsetWidth / 2 - 2, px),
        ) + 'px';
      button.style.top =
        Math.max(
          button.offsetHeight / 2 + 2,
          Math.min(bounds.height - button.offsetHeight / 2 - 2, py),
        ) + 'px';
    });
    if(leaderLines.length)root.insertAdjacentHTML('beforeend',`<svg class="teacher-leaders" viewBox="0 0 ${bounds.width} ${bounds.height}" preserveAspectRatio="none" aria-hidden="true">${leaderLines.join('')}</svg>`);
  }
  window.addEventListener('resize', ()=>{positionFigureControls();layoutSpatialStamps();});
  window.addEventListener('message', (event) => {
    if (
      event.source !== window.parent ||
      event.data?.type !== 'init' ||
      event.data.protocolVersion !== 1 ||
      !/^[-\w]{16,100}$/.test(event.data.guideScope || '')
    )
      return;
    guideScope = event.data.guideScope;
    if(c.screen==='node' && step()?.type==='locate'){c.locateGuide=!c.retry&&!seenGuide();render();}
    if (c.screen === 'node' && step()?.type === 'matching') {
      ui.guideStep = c.retry || seenGuide() ? null : 1;
      render();
    }
  });
  if (window.parent !== window) window.parent.postMessage({ type: 'ready' }, '*');
  if (c.screen === 'node' && step()?.type === 'matching') {
    if (!c.match?.values) clearStep();
    ui.guideStep = c.retry || seenGuide() ? null : 1;
  }
  render();
}
