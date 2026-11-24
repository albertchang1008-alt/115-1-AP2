/**
 * Zuvio 出題與成績回收（規格 docs/zuvio-exam/ZUVIO_EXAM_SPEC_1.16.0.md 第 9 節）。
 * 純函式：前端、後端、測試共用；不碰 Firestore、不碰 DOM。
 */
export interface ZQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  answer: string; // 正確選項 id
  image?: string;
  questionType?: string;
}
export interface ZPoolEntry { unitId: string; unitTitle: string; group: string; version: string; question: ZQuestion }
export interface ZItem { questionId: string; unitId: string; version: string; optionOrder: string[] }
export interface ZExamView { title: string; score: number; items: (ZItem & { text: string; options: { id: string; text: string }[]; answer: string })[] }

export const CSV_FORMAT = 1;
const NO_SHUFFLE = /以上|皆是|皆非|皆正確|皆錯誤/;
const FORMULA = /^[=+\-@\t\r]/;

/** 出題排除：圖片題、正式前後測保留題、無法安全輸出（公式開頭）的題目 */
export function eligibility(q: ZQuestion, reserved: Set<string>) {
  if (q.questionType === 'image' || q.image) return 'image';
  if (reserved.has(q.id)) return 'reserved';
  if (FORMULA.test(q.text) || q.options.some((o) => FORMULA.test(o.text))) return 'unsafe';
  if (q.options.length < 2 || !q.options.some((o) => o.id === q.answer)) return 'invalid';
  return '';
}

export function shuffle<T>(list: T[], rand: () => number) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function optionOrderFor(q: ZQuestion, doShuffle: boolean, rand: () => number) {
  const ids = q.options.map((o) => o.id);
  return doShuffle && !q.options.some((o) => NO_SHUFFLE.test(o.text)) ? shuffle(ids, rand) : ids;
}

/** 抽題：各次單元題數＋各單元「整單元隨機」；優先少出過；不重複 */
export function drawItems(
  pool: ZPoolEntry[],
  request: { units: Record<string, number>; groups: Record<string, number> },
  usage: Record<string, { n: number }>,
  rand: () => number,
  preferFresh = true,
) {
  const taken = new Set<string>();
  const out: ZPoolEntry[] = [];
  const short: string[] = [];
  const pick = (cands: ZPoolEntry[], n: number, label: string) => {
    let c = shuffle(cands.filter((e) => !taken.has(e.question.id)), rand);
    if (preferFresh) c = c.sort((a, b) => (usage[a.question.id]?.n || 0) - (usage[b.question.id]?.n || 0));
    const got = c.slice(0, n);
    got.forEach((e) => { taken.add(e.question.id); out.push(e); });
    if (got.length < n) short.push(`${label} 只抽到 ${got.length} 題`);
  };
  for (const [unitId, n] of Object.entries(request.units)) if (n > 0) pick(pool.filter((e) => e.unitId === unitId), n, pool.find((e) => e.unitId === unitId)?.unitTitle || unitId);
  for (const [group, n] of Object.entries(request.groups)) if (n > 0) pick(pool.filter((e) => e.group === group), n, group);
  return { picked: out, short };
}

/** Zuvio 匯入 CSV（UTF-8 BOM、CRLF、檔尾無換行；格式以 W8 夾具逐位元驗證） */
export function zuvioCsv(title: string, score: number | string, items: { text: string; options: string[]; answerIndex: number }[]) {
  const width = 4 + Math.max(4, ...items.map((i) => i.options.length));
  const pad = (r: (string | number)[]) => { const x = r.map(String); while (x.length < width) x.push(''); return x; };
  const cell = (v: string) => (/[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
  const rows = [
    pad(['題型', '題目敘述', '配分(測驗題目小題請填入分數)', '正解(填入數字,設定第幾個選項為正解)', '選項(不限數量)']),
    pad(['4', title]),
    ...items.map((i) => pad(['a', i.text, score, i.answerIndex + 1, ...i.options])),
  ];
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}
export function examCsv(view: ZExamView) {
  return zuvioCsv(view.title, view.score, view.items.map((it) => ({
    text: it.text,
    options: it.optionOrder.map((id) => it.options.find((o) => o.id === id)!.text),
    answerIndex: it.optionOrder.indexOf(it.answer),
  })));
}

// ---------------- Zuvio「下載數據」xlsx 解析 ----------------
export interface ZBlock { n: number; stem: string; score: string; correctNo: number; options: { no: number; text: string }[]; responses: { studentId: string; answerText: string; row: number }[] }
export interface ZParsed { title: string; blocks: ZBlock[]; summaryIds: string[]; problems: string[] }
export const LIMITS = { rows: 10000, cols: 80, cells: 300000, blocks: 100, options: 10, students: 300 };

const cellOf = (r: string[] | undefined, i: number) => String(r?.[i] ?? '').trim();
/** 依表頭狀態機切區塊；回傳時已丟棄姓名與作答人名欄 */
export function parseZuvioMatrix(m: string[][]): ZParsed {
  const problems: string[] = [];
  if (m.length > LIMITS.rows) return { title: '', blocks: [], summaryIds: [], problems: ['列數超過上限'] };
  let cells = 0;
  for (const r of m) { if (r.length > LIMITS.cols) return { title: '', blocks: [], summaryIds: [], problems: ['欄數超過上限'] }; cells += r.length; }
  if (cells > LIMITS.cells) return { title: '', blocks: [], summaryIds: [], problems: ['儲存格數超過上限'] };
  if (cellOf(m[0], 0) !== '資料夾名稱') problems.push('第一列不是 Zuvio 匯出格式（應為「資料夾名稱」）');
  let title = '';
  const summaryIds: string[] = [];
  const blocks: ZBlock[] = [];
  let mode: 'top' | 'summary' | 'block' | 'options' | 'students' = 'top';
  let cur: ZBlock | null = null;
  for (let i = 0; i < m.length; i++) {
    const r = m[i];
    const a = cellOf(r, 0);
    const head = /^第(\d+)題[:：]/.exec(a);
    if (head) {
      if (!/單選/.test(a)) problems.push(`第${head[1]}題不是單選題`);
      cur = { n: Number(head[1]), stem: '', score: '', correctNo: 0, options: [], responses: [] };
      blocks.push(cur);
      mode = 'block';
      continue;
    }
    if (mode === 'top') {
      if (a === '題幹') title = cellOf(r, 1);
      if (a === '學號' && cellOf(r, 1) === '姓名') mode = 'summary';
      continue;
    }
    if (mode === 'summary') {
      if (a && a !== '學號') summaryIds.push(a);
      continue;
    }
    if (!cur) continue;
    if (mode === 'block') {
      if (a === '問題敘述' && !cur.stem) cur.stem = cellOf(r, 1);
      else if (a === '配分') cur.score = cellOf(r, 1);
      else if (a === '正解') cur.correctNo = Number(cellOf(r, 1));
      else if (a === '選項編號') mode = 'options';
      continue;
    }
    if (mode === 'options') {
      if (a === '學號' && cellOf(r, 1) === '姓名') { mode = 'students'; continue; }
      if (/^\d+$/.test(a)) cur.options.push({ no: Number(a), text: String(r?.[1] ?? '') });
      continue;
    }
    if (mode === 'students') {
      if (!a || a === '學號') continue;
      cur.responses.push({ studentId: a, answerText: String(r?.[4] ?? ''), row: i + 1 });
    }
  }
  if (blocks.length > LIMITS.blocks) problems.push('題數超過上限');
  for (const b of blocks) {
    if (b.options.length > LIMITS.options) problems.push(`第${b.n}題選項過多`);
    if (b.responses.length > LIMITS.students) problems.push(`第${b.n}題作答人數超過上限`);
  }
  return { title, blocks, summaryIds, problems };
}

// ---------------- 考卷比對（錯卷一律阻擋）＋答案還原 ----------------
const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, '');
export interface ZMatch { blocking: string[]; optionMap: Record<number, Record<number, string>>; garbled: number }
/** 規格 9.3：名稱、題數、題序、配分、正解序號、選項數、選項文字（每題至多 1 個亂碼，位置唯一）都要相符 */
export function matchExam(view: ZExamView, p: ZParsed): ZMatch {
  const blocking = [...p.problems];
  const optionMap: ZMatch['optionMap'] = {};
  let garbled = 0;
  if (norm(p.title) !== norm(view.title)) blocking.push(`考卷名稱不同：檔案「${p.title}」／紀錄「${view.title}」`);
  if (p.blocks.length !== view.items.length) blocking.push(`題數不同：檔案 ${p.blocks.length}／紀錄 ${view.items.length}`);
  p.blocks.forEach((b, i) => {
    if (b.n !== i + 1) blocking.push(`題序不連續（第 ${i + 1} 個區塊標為第 ${b.n} 題）`);
    const it = view.items[i];
    if (!it) return;
    const want = it.optionOrder.map((id) => it.options.find((o) => o.id === id)!.text);
    if (Number(b.score) !== Number(view.score)) blocking.push(`第${b.n}題配分不同`);
    if (b.correctNo !== it.optionOrder.indexOf(it.answer) + 1) blocking.push(`第${b.n}題正解位置不同`);
    if (b.options.length !== want.length) { blocking.push(`第${b.n}題選項數不同`); return; }
    const mismatch = b.options.filter((o, k) => o.no !== k + 1 || norm(o.text) !== norm(want[k]));
    const stemOk = norm(b.stem) === norm(it.text);
    if (mismatch.length > 1) blocking.push(`第${b.n}題有 ${mismatch.length} 個選項文字不同`);
    else if (mismatch.length === 1 && !stemOk) blocking.push(`第${b.n}題題幹與選項都不同`);
    else if (!stemOk) blocking.push(`第${b.n}題題幹不同（若為亂碼請重新匯出）`);
    if (mismatch.length === 1) garbled++;
    const texts = b.options.map((o) => o.text);
    if (new Set(texts).size !== texts.length) blocking.push(`第${b.n}題選項文字重複，無法還原學生答案`);
    optionMap[b.n] = Object.fromEntries(b.options.map((o, k) => [o.no, it.optionOrder[k]]));
  });
  return { blocking, optionMap, garbled };
}

export interface ZRosterInfo { classId: string; enabled: boolean; numericOnlyMatch?: boolean }
export interface ZResult { classId: string; answers: Record<string, string>; correct: number; score: number }
export type ZCounts = { notInRoster: number; disabled: number; wrongClass: number; needTextId: number; duplicate: number };
/** 由比對結果還原每位學生作答；回傳的錯誤列表只留遮碼學號與列號（不入資料庫） */
export function buildResults(
  view: ZExamView,
  p: ZParsed,
  match: ZMatch,
  lookup: (studentId: string) => ZRosterInfo | null,
  sittingClassIds: string[],
) {
  const counts: ZCounts = { notInRoster: 0, disabled: 0, wrongClass: 0, needTextId: 0, duplicate: 0 };
  const blocking = [...match.blocking];
  const details: string[] = [];
  const maskId = (s: string) => (s.length <= 3 ? '＊＊＊' : '＊＊＊' + s.slice(-3));
  const ids = new Set<string>();
  for (const b of p.blocks) {
    const seen = new Set<string>();
    for (const r of b.responses) {
      if (seen.has(r.studentId)) { counts.duplicate++; blocking.push(`第${b.n}題有重複學號（第 ${r.row} 列）`); }
      seen.add(r.studentId);
      ids.add(r.studentId);
    }
  }
  const results = new Map<string, ZResult>();
  const accepted = new Map<string, string>();
  for (const sid of ids) {
    const info = lookup(sid);
    if (!info) { counts.notInRoster++; details.push(`不在名冊：${maskId(sid)}`); continue; }
    if (info.numericOnlyMatch) { counts.needTextId++; details.push(`學號格式需重新匯出為文字：${maskId(sid)}`); continue; }
    if (!info.enabled) { counts.disabled++; continue; }
    if (!sittingClassIds.includes(info.classId)) { counts.wrongClass++; continue; }
    accepted.set(sid, info.classId);
  }
  if (counts.needTextId) blocking.push(`${counts.needTextId} 位學生的學號在檔案中是數字格式且可能少了前導零，請在 Zuvio 匯出時保留文字格式`);
  for (const [sid, classId] of accepted) results.set(sid, { classId, answers: {}, correct: 0, score: 0 });
  p.blocks.forEach((b, i) => {
    const it = view.items[i];
    if (!it) return;
    const textToNo = new Map(b.options.map((o) => [o.text, o.no]));
    const answered = new Set<string>();
    for (const r of b.responses) {
      const res = results.get(r.studentId);
      if (!res) continue;
      answered.add(r.studentId);
      if (r.answerText.trim() === '') { res.answers[it.questionId] = ''; continue; }
      const no = textToNo.get(r.answerText);
      const opt = no === undefined ? undefined : match.optionMap[b.n]?.[no];
      if (!opt) { blocking.push(`第${b.n}題有回答對不到選項（第 ${r.row} 列）`); continue; }
      res.answers[it.questionId] = opt;
      if (opt === it.answer) { res.correct++; res.score += Number(view.score); }
    }
    for (const [sid, res] of results) if (!answered.has(sid)) res.answers[it.questionId] = '';
  });
  return { results, counts, blocking: [...new Set(blocking)], details };
}

// ---------------- 報表 ----------------
export function examReport(view: ZExamView, results: ZResult[], subunitTitle: (unitId: string) => string) {
  const n = results.length;
  const questions = view.items.map((it, i) => {
    const dist: Record<string, number> = Object.fromEntries(it.options.map((o) => [o.id, 0]));
    let blank = 0, ok = 0;
    for (const r of results) {
      const a = r.answers[it.questionId];
      if (!a) blank++;
      else { dist[a] = (dist[a] || 0) + 1; if (a === it.answer) ok++; }
    }
    return { no: i + 1, questionId: it.questionId, unitId: it.unitId, text: it.text, answer: it.answer, options: it.optionOrder.map((id) => ({ id, text: it.options.find((o) => o.id === id)!.text, count: dist[id] || 0 })), ok, blank, rate: n ? ok / n : 0 };
  });
  const sub = new Map<string, { ok: number; cells: number }>();
  for (const q of questions) {
    const s = sub.get(q.unitId) || { ok: 0, cells: 0 };
    s.ok += q.ok; s.cells += n;
    sub.set(q.unitId, s);
  }
  const classes = new Map<string, { n: number; total: number }>();
  for (const r of results) {
    const c = classes.get(r.classId) || { n: 0, total: 0 };
    c.n++; c.total += r.correct;
    classes.set(r.classId, c);
  }
  return {
    students: n,
    questions,
    subunits: [...sub].map(([unitId, s]) => ({ unitId, title: subunitTitle(unitId), rate: s.cells ? s.ok / s.cells : 0 })),
    classes: [...classes].map(([classId, c]) => ({ classId, students: c.n, avgCorrect: c.n ? c.total / c.n : 0 })),
  };
}
/** 兩場比較：只回傳人數，不回傳名單 */
export function compareSittings(view: ZExamView, a: Map<string, ZResult>, b: Map<string, ZResult>) {
  return view.items.map((it, i) => {
    let both = 0, wrongToRight = 0, rightToWrong = 0;
    for (const [sid, ra] of a) {
      const rb = b.get(sid);
      if (!rb) continue;
      both++;
      const okA = ra.answers[it.questionId] === it.answer, okB = rb.answers[it.questionId] === it.answer;
      if (!okA && okB) wrongToRight++;
      if (okA && !okB) rightToWrong++;
    }
    const rate = (m: Map<string, ZResult>) => (m.size ? [...m.values()].filter((r) => r.answers[it.questionId] === it.answer).length / m.size : 0);
    return { no: i + 1, questionId: it.questionId, rateA: rate(a), rateB: rate(b), both, wrongToRight, rightToWrong };
  });
}

/** 依比例分配總題數到勾選的次單元（最大餘數法；每個次單元不超過可出題數，超出部分轉給其他次單元） */
export function allocate(units: { unitId: string; n: number }[], total: number, mode: 'proportional' | 'equal') {
  const out: Record<string, number> = Object.fromEntries(units.map((u) => [u.unitId, 0]));
  let left = Math.max(0, Math.floor(total));
  let open = units.filter((u) => u.n > 0);
  while (left > 0 && open.length) {
    const w = open.map((u) => (mode === 'equal' ? 1 : u.n));
    const sum = w.reduce((a, b) => a + b, 0);
    const quota = open.map((u, i) => (left * w[i]) / sum);
    const give = open.map((u, i) => Math.min(Math.floor(quota[i]), u.n - out[u.unitId]));
    let given = give.reduce((a, b) => a + b, 0);
    open.forEach((u, i) => (out[u.unitId] += give[i]));
    const rest = open
      .map((u, i) => ({ u, r: quota[i] - Math.floor(quota[i]) }))
      .filter(({ u }) => out[u.unitId] < u.n)
      .sort((a, b) => b.r - a.r || b.u.n - a.u.n);
    for (const { u } of rest) {
      if (given >= left) break;
      out[u.unitId]++;
      given++;
    }
    if (given === 0) break;
    left -= given;
    open = open.filter((u) => out[u.unitId] < u.n);
  }
  return out;
}
