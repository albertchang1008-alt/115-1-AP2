import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spatialStep} from './spatial-policy.mjs';
export function compileApplyStudentScript(baseDir) {
  const slug = path.basename(baseDir),
    file = path.resolve(baseDir, '../../docs/urinary-release/scripts', slug + '.md');
  const raw = fs.readFileSync(file, 'utf8'),
    lines = raw.split('\n'),
    units = {},
    required = new Set();
  const put = (id, text, at, must = true) => {
    if (!text || !lines[at]?.includes(text))
      throw Error(`${slug}: unapproved source text ${id}: ${text}`);
    units[id] = { text, line: at + 1 };
    if (must) required.add(id);
    return id;
  };
  const fragment = (text) => {
    const prior = Object.entries(units).find(([, unit]) => unit.text === text);
    if (prior) return prior[0];
    const at = lines.findIndex((l) => l.includes(text));
    return put(
      'fragment.' + crypto.createHash('sha256').update(text).digest('hex').slice(0, 12),
      text,
      at,
      false,
    );
  };
  const quotes = (text) => [...text.matchAll(/「([^」]+)」/g)].map((m) => m[1]);
  const choices = (text, at, prefix) =>
    [...text.matchAll(/〔([^〕]+)〕/g)].map((m, j) => put(prefix + '.option.' + j, m[1], at));
  const title = put('title', lines[0].replace(/^# /, '').split('｜學生腳本')[0], 0);
  const introAt = lines.findIndex((l) => l.startsWith('## 開場')) + 1;
  const intro = put('intro', quotes(lines[introAt])[0], introAt),
    introButton = choices(lines[introAt], introAt, 'intro')[0];
  const nodes = [];
  for (let i = 1; i <= 6; i++) {
    const start = lines.findIndex((l) => l.startsWith('## 第 ' + i + ' 關'));
    let end = lines.findIndex((l, j) => j > start && l.startsWith('## '));
    if (end < 0) end = lines.length;
    const n = {
      title: put('n' + i + '.title', lines[start].slice(3), start),
      errors: [],
      actions: [],
      options: [],
      success: [],
      extra: [],
    };
    const p = 'n' + i;
    let inMicro = false;
    for (let at = start + 1; at < end; at++) {
      const line = lines[at],
        field = line.match(/^- \*\*([^*]+)\*\*\s*(.*)$/);
      if (field) {
        inMicro = false;
        const label = field[1],
          body = field[2];
        if (label.startsWith('先認識')) n.basics = put(p + '.basics', body, at);
        else if (label.startsWith('問題')) {
          n.question = put(p + '.question', quotes(body)[0], at);
          n.options = choices(body, at, p + '.question');
        } else if (label.startsWith('動作')) {
          const qs = quotes(body),
            opts = choices(body, at, p + '.action.' + n.actions.length);
          const text = opts.length ? qs[0] : body;
          n.actions.push({
            text: text ? put(p + '.action.' + n.actions.length + '.text', text, at) : null,
            options: opts,
          });
        } else if (label.startsWith('💡提示')) n.hint = put(p + '.hint', quotes(body)[0], at);
        else if (label.startsWith('答對') || label.startsWith('補充'))
          (quotes(body).length ? quotes(body) : [body]).forEach((t) =>
            n.success.push(put(p + '.success.' + n.success.length, t, at)),
          );
        else if (label.startsWith('答錯'))
          quotes(body).forEach((t) => n.errors.push(put(p + '.error.' + n.errors.length, t, at)));
        else if (label.startsWith('確認')) {
          n.micro = {
            stem: put(p + '.micro.stem', quotes(body)[0], at),
            options: [],
            answer: 0,
            feedback: {},
          };
          inMicro = true;
        }
      } else if (inMicro && /^\s+- [A-D] /.test(line)) {
        const m = line.match(/^\s+- ([A-D]) (.*?)(（正）)?$/);
        const j = n.micro.options.length;
        n.micro.options.push(put(p + '.micro.option.' + j, m[2], at));
        if (m[3]) n.micro.answer = j;
      } else if (line.includes('答錯回饋')) {
        const found = [...line.matchAll(/([A-D])?「([^」]+)」/g)];
        if (inMicro)
          for (const [j, m] of found.entries()) {
            const id = put(p + '.micro.feedback.' + j, m[2], at);
            if (m[1]) n.micro.feedback[m[1].charCodeAt(0) - 65] = id;
            else n.micro.defaultFeedback = id;
          }
        else if (n.actions.length)
          n.actions.at(-1).feedback = found.map((m, j) =>
            put(p + '.action.' + (n.actions.length - 1) + '.feedback.' + j, m[2], at),
          );
      } else if (/^\s+- 〔/.test(line)) {
        n.options.push(...choices(line, at, p + '.list.' + n.options.length));
      } else if (/^\s+- [^*].*：/.test(line)) {
        // Explicit teaching pairs (e.g. inulin/creatinine/PAH) are visible instructions.
        n.extra.push(put(p + '.extra.' + n.extra.length, line.trim().slice(2), at));
      }
    }
    if (!n.question) throw Error(`${slug} node ${i}: missing question`);
    nodes.push(n);
  }
  const endAt = lines.findIndex((l) => l.startsWith('## 結尾')),
    trace = [];
  let endCopy, final, transition;
  for (let at = endAt; at < lines.length; at++) {
    const line = lines[at];
    if (/^\s*\d\. /.test(line))
      trace.push({
        question: put('trace.' + trace.length + '.question', quotes(line)[0], at),
        options: choices(line, at, 'trace.' + trace.length),
      });
    if (line.includes('**畫面')) endCopy = put('end.copy', quotes(line)[0], at);
    if (line.includes('**結語')) final = put('end.final', quotes(line)[0], at);
    if (line.includes('**過渡頁空格')) transition = quotes(line)[0];
  }
  const commonFile = path.resolve(baseDir, '../../docs/urinary-release/scripts/_README.md'),
    commonRaw = fs.readFileSync(commonFile, 'utf8');
  const common = {
    transition: commonRaw.match(/「(太棒了！[^」]+)」/)[1].replace('＿＿＿', transition),
    pass: commonRaw.match(/全對：「([^」]+)」/)[1],
    retry: commonRaw.match(/考核答錯：「([^」]+)」/)[1],
    instruction: '請先點選一個項目，再選擇對應的說明。',
    chartX: '過濾出來的葡萄糖（mg/min）', chartY: '量',
    chartBlue: '被回收的葡萄糖', chartOrange: '尿中的葡萄糖',
    figurePlasma: '血漿', figureUrine: '尿液', renalCortex: '皮質', renalMedulla: '髓質', renalGradient: '越深越濃 ↓',
    chart375: '375', figureBlood: '血液', figureFiltrate: '濾液',
    step: '再試一次',
    node: '重新開始這一關',
    trace: '從第 1 格重來',
  };
  const matching = {
    pick: '選擇說明',
    check: '檢查配對',
    help: '操作說明',
    skip: '略過引導',
    understood: '知道了',
    swap: '交換兩列',
    cancel: '取消',
    correct: '配對正確',
    wrong: '請再想想',
    used: '目前配給：',
    guide1: '先點選一個項目，決定你要配對的內容。',
    guide2: '再從選單中，選出對應的說明。',
    guide3: '已完成一組！請配好另外幾組，再按「檢查配對」。想修改時，點原本的說明即可。',
  };
  for (let j = 0; j <= 8; j++) matching['progress' + j] = `已完成 ${j}／${j}`; // replaced per actual row count in player
  const planFile = path.join(baseDir, 'student-plan.json'),
    plan = JSON.parse(fs.readFileSync(planFile));
  function compileStep(step, i, j) {
    const n = nodes[i],
      action = n.actions[step.action ?? 0];
    const resolve = (text) => fragment(text);
    const stepCopy = step.copyAction
      ? action?.text
      : j === 0
        ? n.actions.find((a) => !a.options.length)?.text
        : undefined;
    return {
      ...step,
      key: `n${i + 1}.s${j}`,
      matchingCopy: slug === 'filtration-clearance' && i === 2 ? {guide1: '先點選一個物質，再選它過得去還是過不去。', guide2: '選擇這個物質過得去還是過不去。'} : {},
      instruction: stepCopy,
      question: step.useActionQuestion ? action?.text || n.question : n.question,
      cards: (step.roles || []).map(resolve),
      slots: (step.choices || []).map(resolve),
      options:
        step.sourceOptions === 'question'
          ? n.options
          : step.sourceOptions === 'action'
            ? action?.options || []
            : (step.choices || []).map(resolve),
      feedback: (step.rowFeedback || []).map((t) => [resolve(t)]),
      error: step.errors
        ? step.errors.map(resolve)
        : step.useActionQuestion
          ? action?.feedback || n.errors
          : n.errors,
      success: n.success,
      expected: step.expected,
      labels: (step.labels || []).map(resolve),
      reveals: (step.reveals || []).map(resolve),
    };
  }
  Object.assign(common,{'locate.scroll':'可左右、上下捲動圖面，查看所有位置。','locate.view':'查看位置','locate.guide':'先點一個標籤，再點圖上它所在的位置','locate.help':'操作說明','locate.skip':'略過引導','locate.arrow0':'←','locate.arrow1':'→'});
  for(let i=0;i<8;i++)common['locate.point'+i]=String.fromCharCode(65+i);
  const compiled = plan.nodes.map((node, i) => ({
    ...nodes[i],
    ...node,
    steps: node.steps.map((s, j) => spatialStep(slug,i+1,j,compileStep(s,i,j),fragment)),
  }));
  return {
    slug,
    version: 'teacher-2026-10-21-v3.2',
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    planSha256: crypto.createHash('sha256').update(fs.readFileSync(planFile)).digest('hex'),
    source: path.relative(path.resolve(baseDir, '../..'), file),
    units,
    required: [...required],
    title,
    intro,
    introButton,
    nodes: compiled,
    trace,
    endCopy,
    final,
    common,
    matching,
    sourceHashes: {
      script: crypto.createHash('sha256').update(raw).digest('hex'),
      common: crypto.createHash('sha256').update(commonRaw).digest('hex'),
    },
  };
}
