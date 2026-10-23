import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function compileStudentScript(baseDir) {
  const file = path.resolve(baseDir, '../../docs/urinary-release/ACIDBASE_STUDENT_SCRIPT.md'),
    raw = fs.readFileSync(file, 'utf8'),
    lines = raw.split('\n'),
    units = {};

  const put = (id, text, line) => {
    if (typeof text !== 'string' || !text) throw Error('Missing approved script text: ' + id);
    units[id] = { text, line };
    return id;
  };

  for (const [kind, text] of Object.entries({
    step: '再試一次',
    node: '重新開始這一關',
    trace: '從第 1 格重來',
  })) {
    const at = lines.findIndex((l) => l.includes('〔' + text + '〕'));
    if (at < 0) throw Error('Missing approved retry button ' + kind);
    put('retry.' + kind, text, at + 1);
  }

  const section = (prefix) => {
    const start = lines.findIndex((l) => l.startsWith('## ' + prefix));
    if (start < 0) throw Error('Missing script section ' + prefix);
    let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
    if (end < 0) end = lines.length;
    return lines.slice(start, end).map((text, i) => ({ text, line: start + i + 1 }));
  };

  const subSection = (prefix) => {
    const start = lines.findIndex((l) => l.startsWith('### ' + prefix));
    if (start < 0) throw Error('Missing script subSection ' + prefix);
    let end = lines.findIndex((l, i) => i > start && (l.startsWith('### ') || l.startsWith('## ')));
    if (end < 0) end = lines.length;
    return lines.slice(start, end).map((text, i) => ({ text, line: start + i + 1 }));
  };

  const line = (rows, label, index = 0) => {
    const found = rows.filter((r) => r.text.includes(label))[index];
    if (!found) throw Error('Missing script field ' + label);
    return found;
  };

  const q = (r) => r.text.match(/「([^」]*)」/)?.[1];
  const after = (r) =>
    r.text
      .replace(/^\s*- \*\*[^*]+\*\*\s*/, '')
      .replace(/※/g, '')
      .trim();

  const questions = (rows, label, id, index = 0) => {
    const r = line(rows, label, index);
    put(id, q(r), r.line);
    return id;
  };

  const options = (r, id) =>
    [...r.text.matchAll(/〔([^〕]+)〕/g)].map((m, i) => put(id + '.' + i, m[1], r.line));

  const fragment = (id, text) => {
    const i = lines.findIndex((l) => l.includes(text));
    if (i < 0) throw Error('Unapproved fragment ' + text);
    return put(id, text, i + 1);
  };

  // 開場
  const intro = section('開場');
  put('intro.title', '開場', intro[0].line);
  questions(intro, '**畫面：**', 'intro.copy');
  const basicsStart = intro.findIndex((r) => r.text.includes('先認識'));
  const introBasics = intro
    .slice(basicsStart + 1)
    .filter((r) => /^  - /.test(r.text))
    .map((r, i) =>
      put('intro.basics.' + i, r.text.replace(/^  - /, '').replace(/※/g, '').trim(), r.line),
    );
  options(line(intro, '**按鈕：**'), 'intro.button');

  // 第 1-6 關
  const nodes = [];
  for (let i = 1; i <= 6; i++) {
    const rows = section('第 ' + i + ' 關');
    const n = {
      title: put('n' + i + '.title', rows[0].text.slice(3), rows[0].line),
      hints: [],
      errors: [],
    };
    const basic = rows.find((r) => r.text.includes('**先認識：**'));
    if (basic) n.basics = put('n' + i + '.basics', after(basic), basic.line);
    const qr = rows.find((r) => r.text.includes('**問題：**'));
    if (qr) n.question = put('n' + i + '.question', q(qr), qr.line);
    rows
      .filter((r) => r.text.includes('**💡提示：**'))
      .forEach((r, j) => n.hints.push(put('n' + i + '.hint.' + j, q(r), r.line)));

    if (i === 3) {
      const errRow = rows.find((r) => r.text.includes('答錯'));
      const errQuotes = [...errRow.text.matchAll(/「([^」]+)」/g)].map((m) => m[1]);
      errQuotes.forEach((eq, j) => n.errors.push(put('n3.error.' + j, eq, errRow.line)));
    } else {
      rows
        .filter((r) => r.text.includes('答錯') && q(r))
        .forEach((r, j) => n.errors.push(put('n' + i + '.error.' + j, q(r), r.line)));
    }

    const act = rows.filter((r) => r.text.includes('**動作 '));
    n.actions = act.map((r, j) => {
      const text = q(r) || after(r);
      put('n' + i + '.action.' + j, text, r.line);
      return { text: 'n' + i + '.action.' + j, options: options(r, 'n' + i + '.options.' + j) };
    });

    if (i === 1) {
      n.slots = rows
        .filter((r) => /^  - 「/.test(r.text))
        .map((r, j) => put('n1.slot.' + j, q(r), r.line));
      n.cards = ['緩衝', '肺', '腎'].map((t, j) => fragment('n1.card.' + j, t));
    }
    if (i === 2) {
      n.cards = ['HCO₃⁻', 'H₂CO₃'].map((t, j) => fragment('n2.card.' + j, t));
      n.slots = ['上面', '下面'].map((t, j) => fragment('n2.slot.' + j, t));
      const r = line(rows, '答對');
      n.success = put('n2.success', q(r), r.line);
    }
    if (i === 3) {
      const places = line(rows, '**地方：**'),
        cards = line(rows, '**卡片：**');
      n.slots = after(places)
        .replace(/。$/, '')
        .split('、')
        .map((t, j) => put('n3.slot.' + j, t, places.line));
      n.cards = after(cards)
        .replace(/。$/, '')
        .split('、')
        .map((t, j) => put('n3.card.' + j, t, cards.line));
      const r = line(rows, '答對');
      n.success = put('n3.success', q(r), r.line);
    }
    if (i === 4) n.options = options(qr, 'n4.options');
    if (i === 5) {
      const r = line(rows, '答對');
      n.success = put('n5.success', q(r), r.line);
      n.columns = ['血液', '腎小管壁', '管液（之後會變成尿）'].map((t, j) =>
        fragment('n5.column.' + j, t),
      );
    }
    if (i === 6) {
      const r = line(rows, '答對');
      n.success = put('n6.success', r.text.replace(/^\s*- 答對：/, '').trim(), r.line);
    }

    // v3 增補：小檢核（第 5 關沒有）
    if (i !== 5) {
      const mRows = subSection('第 ' + i + ' 關｜確認');
      const stemRow = mRows.find((r) => /^- 「/.test(r.text));
      const hintRow = mRows.find((r) => /💡「/.test(r.text));
      const optRows = mRows.filter((r) => /^\s*- [A-D] /.test(r.text));
      const fbRows = mRows.filter((r) => /^\s*- [A-D]：/.test(r.text));

      n.micro = {
        stem: put('n' + i + '.micro.stem', q(stemRow), stemRow.line),
        hint: put('n' + i + '.micro.hint', hintRow.text.match(/💡「([^」]+)」/)[1], hintRow.line),
        options: optRows.map((r, j) => {
          const text = r.text
            .replace(/^\s*- [A-D] /, '')
            .replace(/（正）/, '')
            .trim();
          return put('n' + i + '.micro.option.' + j, text, r.line);
        }),
        answer: optRows.findIndex((r) => r.text.includes('（正）')),
        feedback: {},
      };
      fbRows.forEach((r) => {
        const letter = r.text.match(/^\s*- ([A-D])：/)[1];
        const text = q(r);
        n.micro.feedback[letter] = put('n' + i + '.micro.feedback.' + letter, text, r.line);
      });
    }

    nodes.push(n);
  }

  // 結尾
  const end = section('結尾');
  put('end.title', end[0].text.slice(3), end[0].line);
  const ei = end.find((r) => r.text.includes('畫面寫'));
  put('end.copy', q(ei), ei.line);
  const trace = end
    .filter((r) => /^  \d\. /.test(r.text))
    .map((r, i) => ({
      question: put('end.question.' + i, q(r), r.line),
      options: options(r, 'end.options.' + i),
    }));
  const ef = end.find((r) => r.text.includes('全部答完'));
  put('end.final', q(ef), ef.line);
  options(line(end, '接著是'), 'end.button');

  // v3 增補：進入考核前（過渡頁）與考核結果
  const transRows = subSection('進入考核前（過渡頁）');
  const introRow = transRows.find((r) => /^- 「/.test(r.text));
  put('quiz.transition.copy', q(introRow), introRow.line);
  options(introRow, 'quiz.transition.button');
  const wrongRow = transRows.find((r) => r.text.includes('考核答錯時'));
  put('quiz.result.retry', q(wrongRow), wrongRow.line);
  const passRow = transRows.find((r) => r.text.includes('考核全對時'));
  put('quiz.result.pass', q(passRow), passRow.line);

  // 心智圖片語
  const diagram = [
    'H⁺',
    'HCO₃⁻',
    'H₂CO₃',
    'CO₂',
    'NH₃',
    'NH₄⁺',
    'pH',
    '緩衝',
    '肺',
    '腎',
    '血液',
    '管液',
    '心智圖',
    '鹼／酸',
  ];
  diagram.forEach((t, i) => fragment('diagram.' + i, t));

  // Layout copy expressly authorized after v3; keep it separate from teaching units.
  const interfaceFile = path.resolve(
    baseDir,
    '../../CODEX_TASK_acidbase-v3-review-fix_2026-10-21.md',
  );
  const interfaceRaw = fs.readFileSync(interfaceFile, 'utf8');
  const interfaceLine = interfaceRaw
    .split('\n')
    .findIndex((line) => line.includes('改成「準備考核」'));
  if (interfaceLine < 0) throw Error('Missing authorized transition heading');
  const interfaceCopy = {
    transitionTitle: {
      text: '準備考核',
      source: path.basename(interfaceFile),
      line: interfaceLine + 1,
      sha256: crypto.createHash('sha256').update(interfaceRaw).digest('hex'),
    },
  };
  // Matching UI copy is authorized by the teacher's matching-operation specification.
  const matchingFile = path.resolve(baseDir, '../../docs/MATCHING_QUESTION_UI.md');
  const matchingRaw = fs.readFileSync(matchingFile, 'utf8');
  const matchingCopy = {
    pick: '選擇說明',
    check: '檢查配對',
    help: '操作說明',
    skip: '略過引導',
    understood: '知道了',
    swap: '交換兩列',
    cancel: '取消',
    correct: '配對正確',
    wrong: '請再想想',
    fixed: '已固定於正確列',
    used: '目前配給：',
    guide1: '先點選一個角色，決定你要幫誰配對。',
    guide2: '再從選單中，選出你認為屬於這個角色的工作說明。',
    guide3: '已完成一組！請配好另外幾組，再按「檢查配對」。想修改時，點原本的說明即可。',
  };
  for (let count = 0; count <= 3; count++) matchingCopy['progress' + count] = `已完成 ${count}／3`;
  for (const [id, text] of Object.entries(matchingCopy))
    interfaceCopy['match.' + id] = {
      text,
      source: path.basename(matchingFile),
      line: matchingRaw.split('\n').findIndex((l) => l.includes('基本流程')) + 1,
      sha256: crypto.createHash('sha256').update(matchingRaw).digest('hex'),
    };
  return {
    version: '3.2',
    interfaceCopy,
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    units,
    nodes,
    introBasics,
    trace,
  };
}
