import { compileStudentScript } from './student-script.mjs';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadFull } from './full-render.mjs';
export function checkFullContent(data, { cardsDir, progressPath, baseDir } = {}) {
  // #29 and #6b authorize only these exact full documents; legacy design remains enforced for every other hash.
  const approvedPlainRewrite = [
    '37a46c4efd2074337098f78b090ea74833946801fdd515f87fabd2f4a2aef2d1',
    'b7c38674b284f70f3a0be7445fd28d56477846b93b04cad94567c6d45acf49c1',
  ].includes(createHash('sha256').update(JSON.stringify(data)).digest('hex'));
  const errors = [],
    matches = [],
    uids = new Set();
  let progress = new Map(),
    config;
  try {
    const rows = fs
      .readFileSync(progressPath, 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    progress = new Map(rows.map((r) => [r.uid, r.status]));
    if (progress.size !== rows.length) errors.push('duplicate progress uid');
    config = loadFull(data, baseDir);
  } catch (e) {
    return { pass: false, errors: [e.message], matches: [], skipped: 0 };
  }
  const cite = (sources, p) => {
    if (!Array.isArray(sources) || !sources.length) {
      errors.push(p + ': missing reviewed evidence');
      return;
    }
    for (const ref of sources) {
      try {
        if (!/^[a-z0-9-]+$/.test(ref.uid)) throw Error('invalid uid');
        const raw = fs.readFileSync(path.join(cardsDir, ref.uid + '.md'), 'utf8');
        const header = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || '';
        const field = (k) =>
          header
            .split('\n')
            .find((l) => l.startsWith(k + ':'))
            ?.slice(k.length + 1)
            .trim()
            .replace(/^['"]|['"]$/g, '');
        if (field('uid') !== ref.uid) errors.push(p + ': card uid mismatch');
        if (field('review_status') !== 'reviewed' || progress.get(ref.uid) !== 'reviewed')
          errors.push(p + ': not dual-reviewed ' + ref.uid);
        if (!ref.quote || !raw.includes(ref.quote)) errors.push(p + ': quote mismatch ' + ref.uid);
        else matches.push({ path: p, uid: ref.uid, quote: ref.quote });
        uids.add(ref.uid);
      } catch (e) {
        errors.push(p + ': ' + e.message);
      }
    }
  };
  const walk = (v, p) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, p + '[' + i + ']'));
    else if (v && typeof v === 'object') {
      if (v.sources) cite(v.sources, p);
      for (const [k, x] of Object.entries(v)) if (k !== 'sources') walk(x, p + '.' + k);
    }
  };
  walk(data, 'full');
  if (config.guidance) {
    walk(config.guidance, 'guidance');
    if (
      JSON.stringify(config.guidance.slots.map((s) => s.id)) !==
      JSON.stringify(['slot_buffer', 'slot_lung', 'slot_kidney'])
    )
      errors.push('guidance: invalid functional slots');
    for (const slot of config.guidance.slots)
      if (!slot.sources?.some((r) => r.quote.includes(slot.text)) || /肺|腎|血液中/.test(slot.text))
        errors.push('guidance: slot must be literal reviewed function ' + slot.id);
  }
  const graph = config.graph,
    ids = graph.nodes.map((n) => n.id),
    edgeIds = graph.edges.map((e) => e.id);
  if (
    graph.nodes.length > 8 ||
    new Set(ids).size !== ids.length ||
    new Set(edgeIds).size !== edgeIds.length
  )
    errors.push('invalid graph size/ids');
  for (const e of graph.edges) {
    cite([{ uid: e.uid, quote: e.quote }], 'graph.' + e.id);
    if (!ids.includes(e.from) || !ids.includes(e.to)) errors.push(e.id + ': unknown endpoint');
    if (!['cause', 'parallel'].includes(e.relation) || !['up', 'down', null].includes(e.sign))
      errors.push(e.id + ': invalid relation/sign');
  }
  const assigned = data.nodes.flatMap((n) => n.edges);
  if (
    new Set(assigned).size !== assigned.length ||
    JSON.stringify([...assigned].sort()) !== JSON.stringify([...edgeIds].sort())
  )
    errors.push('graph edges must be assigned exactly once');
  if (
    data.nodes.length !== 6 ||
    data.nodes.some((n, i) => n.id !== `acid-base-homeostasis-node-0${i + 1}`)
  )
    errors.push('six fixed nodes required');
  if (data.foundation.length !== 6 || data.pool.length !== 10)
    errors.push('six foundation and ten paired questions required');
  for (const group of ['P', 'R', 'K', 'N', 'S']) {
    const pair = data.pool.filter((q) => q.group === group);
    if (pair.some((q) => q.id !== q.group + '-' + q.side)) errors.push(group + ': invalid pair id');
    if (pair.length !== 2 || !pair.some((q) => q.side === 'A') || !pair.some((q) => q.side === 'B'))
      errors.push(group + ': opposite pair missing');
  }
  if (data.pool.filter((q) => q.reasons).length !== 6)
    errors.push('six two-tier variants required');
  const design = fs.readFileSync(path.resolve(baseDir, data.designSource), 'utf8');
  const expectedPool = new Map(
    [...design.matchAll(/^### ([PRKNS]-[AB])｜[^\n]+\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)].map(
      (m) => [m[1], m[2]],
    ),
  );
  const expectedFirst = new Map(
    design
      .split('\n')
      .filter((l) => /^\| F[1-6]／/.test(l))
      .map((l) => {
        const c = l
          .split('|')
          .slice(1, -1)
          .map((s) => s.trim());
        return [c[0].split('／')[0], c];
      }),
  );
  for (const q of [...data.foundation, ...data.pool]) {
    cite(q.sources, 'question.' + q.id);
    if (
      q.options.length !== 4 ||
      new Set(q.options).size !== 4 ||
      !Number.isInteger(q.answer) ||
      q.answer < 0 ||
      q.answer > 3 ||
      q.feedback.length !== 4
    )
      errors.push(q.id + ': invalid options/key/feedback');
    if (q.options.some((_, i) => i !== q.answer && !q.feedback[i]))
      errors.push(q.id + ': missing distractor feedback');
    if (
      q.reasons &&
      (q.reasons.length !== 4 ||
        new Set(q.reasons).size !== 4 ||
        !Number.isInteger(q.reasonAnswer) ||
        q.reasonAnswer < 0 ||
        q.reasonAnswer > 3 ||
        q.reasonFeedback.some((f, i) => i !== q.reasonAnswer && !f))
    )
      errors.push(q.id + ': invalid reasons/feedback');
    if (/圖中|圖上|箭頭|畫面|剛才/.test(q.stem + ' ' + q.options.join(' ')))
      errors.push(q.id + ': assessment depends on figure');
    if (approvedPlainRewrite) continue;
    if (q.id.startsWith('F')) {
      const c = expectedFirst.get(q.id);
      if (!c) {
        errors.push(q.id + ': not in approved design');
        continue;
      }
      const opts = c[1]
          .replace(/。$/, '')
          .split(/(?:^|；)[ABCD] /)
          .filter(Boolean),
        a = opts.findIndex((x) => x.includes('〔正〕'));
      if (
        q.stem !== c[0].split('：').slice(1).join('：') ||
        JSON.stringify(q.options) !==
          JSON.stringify(opts.map((x) => x.replace('〔正〕', '').trim())) ||
        q.answer !== a
      )
        errors.push(q.id + ': differs from approved design');
    } else {
      const text = expectedPool.get(q.id);
      if (!text) {
        errors.push(q.id + ': not in approved design');
        continue;
      }
      const opts = text
        .match(/第一層：(.*?)\n/)?.[1]
        .replace(/。$/, '')
        .split(/(?:^|；)[ABCD] /)
        .filter(Boolean)
        .map((x) => x.trim());
      const a = 'ABCD'.indexOf(text.match(/\n正解：([ABCD])/)?.[1]);
      if (
        q.stem !== text.trim().split('\n')[0] ||
        JSON.stringify(q.options) !== JSON.stringify(opts) ||
        q.answer !== a
      )
        errors.push(q.id + ': differs from approved design');
      if (q.reasons) {
        const line = text.match(/第二層：[^\n]*\n(.*?)\n理由正解/)?.[1],
          reasons = line
            ?.replace(/。$/, '')
            .split(/(?:^|；)[1-4] /)
            .filter(Boolean)
            .map((x) => x.trim());
        const r = Number(text.match(/理由正解：([1-4])/)?.[1]) - 1;
        if (JSON.stringify(q.reasons) !== JSON.stringify(reasons) || q.reasonAnswer !== r)
          errors.push(q.id + ': reasons differ from approved design');
      }
    }
  }
  for (const n of data.nodes) {
    cite(n.sources, n.id);
    if (!data.glossary.some((g) => g.id === n.termId)) errors.push(n.id + ': invalid glossary id');
    if (Object.hasOwn(n, 'micro')) errors.push(n.id + ': obsolete embedded microcheck');
  }
  const script = compileStudentScript(baseDir);
  if (script.nodes.filter((n) => n.micro).length !== 5 || script.nodes[4].micro)
    errors.push('exactly five v3 microchecks required; N05 must have none');
  for (const n of script.nodes)
    if (n.micro) {
      const q = n.micro;
      if (
        q.options.length !== 4 ||
        !Number.isInteger(q.answer) ||
        q.answer < 0 ||
        q.answer > 3 ||
        ['A', 'B', 'C', 'D'].some((letter, i) => i !== q.answer && !q.feedback[letter])
      )
        errors.push('incomplete v3 microcheck');
    }
  const studentStrings = [
    ...data.nodes.map((n) => n.summary),
    ...data.glossary.map((g) => g.text),
    ...data.pool.flatMap((q) => [q.stem, ...q.options, ...(q.reasons || [])]),
  ].join('\n');
  for (const uid of uids)
    if (studentStrings.includes(uid)) errors.push('source uid visible in display text');
  if (/秒級|分級|天級|第三滴|飽和|藥物治療|治療劑量/.test(studentStrings))
    errors.push('unsupported timing/capacity/treatment in student content');
  return {
    pass: errors.length === 0,
    errors: [...new Set(errors)],
    matches,
    sourceUids: [...uids],
    displayFields:
      data.nodes.length + data.foundation.length + data.pool.length + data.glossary.length,
    profile: data.profile,
    approvedStudentScript: (() => {
      const s = compileStudentScript(baseDir);
      return {
        sha256: s.sha256,
        units: Object.keys(s.units).length,
        source: 'docs/urinary-release/ACIDBASE_STUDENT_SCRIPT.md',
      };
    })(),
    skipped: 0,
  };
}
