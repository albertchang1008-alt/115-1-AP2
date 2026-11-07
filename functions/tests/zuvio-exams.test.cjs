const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createZuvioHandlers } = require('../lib/functions/src/zuvioExams.js');
const { parseZuvioMatrix } = require('../lib/shared/zuvio.js');
const { fakeZuvioExport } = require('../lib/shared/zuvioSample.js');

// ---------- 記憶體 Firestore（支援本功能用到的操作） ----------
function memoryDb() {
  const data = new Map();
  const clone = (x) => (x == null ? x : structuredClone(x));
  let ops = { reads: 0, writes: 0 };
  let queue = Promise.resolve();
  const snap = (p) => ({ exists: data.has(p), id: p.split('/').at(-1), ref: ref(p), data: () => clone(data.get(p)) });
  function ref(p) {
    return {
      path: p, id: p.split('/').at(-1),
      get: async () => { ops.reads++; return snap(p); },
      set: async (v) => { ops.writes++; data.set(p, clone(v)); },
      update: async (v) => { ops.writes++; data.set(p, { ...data.get(p), ...clone(v) }); },
      delete: async () => { ops.writes++; data.delete(p); },
      collection: (n) => collection(p + '/' + n),
    };
  }
  function collection(p, filters = [], order = null, lim = Infinity) {
    const q = {
      path: p,
      doc: (id) => ref(p + '/' + id),
      where: (f, op, v) => collection(p, [...filters, [f, op, v]], order, lim),
      orderBy: (f, dir = 'asc') => collection(p, filters, [f, dir], lim),
      limit: (n) => collection(p, filters, order, n),
      async get() {
        let docs = [...data.keys()].filter((k) => k.startsWith(p + '/') && k.split('/').length === p.split('/').length + 1).map(snap);
        docs = docs.filter((d) => filters.every(([f, op, v]) => op === '==' && d.data()[f] === v));
        if (order) docs.sort((a, b) => (a.data()[order[0]] > b.data()[order[0]] ? 1 : -1) * (order[1] === 'desc' ? -1 : 1));
        docs = docs.slice(0, lim);
        ops.reads += Math.max(1, docs.length);
        return { docs, empty: !docs.length, size: docs.length };
      },
    };
    return q;
  }
  const db = {
    data, ops: () => ops, resetOps: () => (ops = { reads: 0, writes: 0 }),
    doc: ref, collection: (p) => collection(p),
    batch() {
      const w = [];
      return {
        set: (r, v) => w.push(() => data.set(r.path, clone(v))),
        delete: (r) => w.push(() => data.delete(r.path)),
        commit: async () => { ops.writes += w.length; w.forEach((f) => f()); },
      };
    },
    runTransaction(fn) {
      const run = queue.then(async () => {
        const w = [];
        const r = await fn({
          get: (x) => x.get(),
          create: (r, v) => { if (data.has(r.path)) throw Error('already exists'); w.push(() => data.set(r.path, clone(v))); },
          set: (r, v) => w.push(() => data.set(r.path, clone(v))),
          update: (r, v) => w.push(() => data.set(r.path, { ...data.get(r.path), ...clone(v) })),
          delete: (r) => w.push(() => data.delete(r.path)),
        });
        ops.writes += w.length;
        w.forEach((f) => f());
        return r;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
  return db;
}

// ---------- 合成課程：W8 示範題分成 3 個次單元 ----------
const W8 = readFileSync(path.join(__dirname, '../../tests/fixtures/zuvio/W8-import.csv'), 'utf8').replace(/^﻿/, '').split('\r\n')
  .map((l) => l.split(',')).filter((r) => r[0] === 'a');
function setup() {
  const db = memoryDb();
  const units = [
    { id: 'resp', title: '呼吸', group: '呼吸系統', bankVersion: 'v1', activities: [] },
    { id: 'kidney', title: '腎臟', group: '泌尿系統', bankVersion: 'v1', activities: [] },
    { id: 'hidden', title: '隱藏', group: '泌尿系統', bankVersion: 'v1', visibility: 'hidden', activities: [] },
  ];
  const qs = W8.slice(0, 12).map((r, i) => ({
    id: 'q' + (i + 1), text: r[1], options: r.slice(4, 8).filter(Boolean).map((t, k) => ({ id: 'abcd'[k], text: t })), answer: 'abcd'[Number(r[3]) - 1],
  }));
  const parts = { resp: qs.slice(0, 6), kidney: qs.slice(6, 11), hidden: qs.slice(11) };
  for (const u of units) {
    const list = parts[u.id];
    db.data.set(`banks/C_${u.id}_v1`, { courseId: 'C', unitId: u.id, version: 'v1', chunks: ['0'], count: list.length });
    db.data.set(`banks/C_${u.id}_v1/chunks/0`, { questions: list.map(({ answer, ...q }) => ({ ...q, answer })) });
    db.data.set(`banks/C_${u.id}_v1/grading/answers`, { answers: Object.fromEntries(list.map((q) => [q.id, q.answer])) });
  }
  db.data.set('courses/C', {
    teacherIds: ['t'], rosterVersion: 2, features: { zuvioExams: true },
    assessmentSources: { pretest: ['q6'], posttest: [] },
    published: { id: 'C', units, classIds: ['甲', '乙'], chapters: {} },
  });
  for (let i = 1; i <= 40; i++) {
    const s = 'T' + String(i).padStart(3, '0'), email = `s${i}@ctcn.edu.tw`;
    db.data.set(`courses/C/studentIds/${s}`, { email });
    db.data.set(`enrollments/C__${email}`, { courseId: 'C', studentId: s, classId: i <= 20 ? '甲' : '乙', enabled: i !== 5, email });
  }
  const access = async (req, id, teacherOnly) => {
    if (!req.auth) throw Error('請先登入');
    const c = db.data.get('courses/' + id);
    if (!c) throw Error('課程不存在');
    if (req.auth.teacher && !c.teacherIds.includes(req.auth.uid)) throw Error('未獲授權管理此課程');
    if (teacherOnly && !req.auth.teacher) throw Error('課程未開放');
    return { p: req.auth, c: structuredClone(c) };
  };
  const h = createZuvioHandlers(db, access, {});
  const T = { uid: 't', teacher: true }, S = { uid: 's', teacher: false }, OTHER = { uid: 'x', teacher: true };
  const call = (name, auth, data) => h[name].run({ auth, data: { courseId: 'C', ...data } });
  return { db, h, call, T, S, OTHER };
}
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

async function makeExam(f, n = 1, extra = {}) {
  const pool = await f.call('zuvioPool', f.T, {});
  const items = pool.entries.slice(0, 4).map((e) => ({ questionId: e.question.id, unitId: e.unitId, version: e.version, optionOrder: [...e.question.options.map((o) => o.id)].reverse() }));
  return { pool, items, res: await f.call('zuvioCreateExam', f.T, { examId: uuid(n), title: '期中小考', score: 5, classIds: ['甲', '乙'], items, ...extra }) };
}

test('權限：學生、未登入、他課教師、旗標關閉全部拒絕', async () => {
  const f = setup();
  await assert.rejects(f.call('zuvioPool', f.S, {}));
  await assert.rejects(f.h.zuvioPool.run({ data: { courseId: 'C' } }));
  await assert.rejects(f.call('zuvioPool', f.OTHER, {}));
  f.db.data.get('courses/C').features.zuvioExams = false;
  await assert.rejects(f.call('zuvioPool', f.T, {}), /尚未開放此功能/);
});

test('題庫：排除隱藏分類、保留題；回傳正解與班級可見性', async () => {
  const f = setup();
  const p = await f.call('zuvioPool', f.T, {});
  assert.ok(!p.entries.some((e) => e.unitId === 'hidden'));
  assert.ok(!p.entries.some((e) => e.question.id === 'q6'), '保留題');
  assert.equal(p.excluded.reserved, 1);
  assert.ok(p.entries.every((e) => e.question.answer));
  assert.deepEqual(p.unitClasses.resp, ['甲', '乙']);
});

test('建立考卷：CSV 與重新下載逐位元相同；冪等重送；各種偽造被拒', async () => {
  const f = setup();
  const { items, res } = await makeExam(f);
  assert.ok(res.csv.startsWith('﻿題型'));
  const again = await f.call('zuvioCreateExam', f.T, { examId: uuid(1), title: '期中小考', score: 5, classIds: ['甲', '乙'], items });
  assert.equal(again.csv, res.csv, '冪等');
  const got = await f.call('zuvioGetExam', f.T, { examId: uuid(1) });
  assert.equal(got.csv, res.csv);
  const base = { examId: uuid(2), title: 'X', score: 5, classIds: ['甲'], items };
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, score: 4.5 }), /整數/);
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, title: '=HYPERLINK()' }));
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, classIds: ['丙'] }));
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, examId: 'abc' }));
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, items: [{ ...items[0], version: 'v0' }] }));
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, items: [{ ...items[0], optionOrder: ['a', 'a', 'b', 'c'] }] }));
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, items: [items[0], items[0]] }));
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, items: [{ ...items[0], questionId: 'q6', unitId: 'resp' }] }), /保留題|不存在/);
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, items: [{ questionId: 'q12', unitId: 'hidden', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }] }));
  await assert.rejects(f.call('zuvioCreateExam', f.T, { ...base, extra: 1 }), /不允許/);
});

test('場次：班級限制；出過次數以場次計', async () => {
  const f = setup();
  const { items } = await makeExam(f);
  await assert.rejects(f.call('zuvioCreateSitting', f.T, { examId: uuid(1), label: 'A', date: '2026-11-10', classIds: ['丙'] }));
  await f.call('zuvioCreateSitting', f.T, { examId: uuid(1), label: '甲 第1次', date: '2026-11-10', classIds: ['甲'] });
  await f.call('zuvioCreateSitting', f.T, { examId: uuid(1), label: '乙 第1次', date: '2026-11-11', classIds: ['乙'] });
  const p = await f.call('zuvioPool', f.T, {});
  assert.equal(p.usage[items[0].questionId].n, 2);
});

async function importFlow(f, sittingLabel, classIds, answerFn, opts) {
  const s = await f.call('zuvioCreateSitting', f.T, { examId: uuid(1), label: sittingLabel, date: '2026-11-10', classIds });
  const { view } = await f.call('zuvioGetExam', f.T, { examId: uuid(1) });
  const students = Array.from({ length: 24 }, (_, i) => ({ studentId: 'T' + String(i + 1).padStart(3, '0'), name: '學生' + (i + 1) }));
  students.push({ studentId: 'Z999', name: '外人' });
  const parsed = parseZuvioMatrix(fakeZuvioExport(view, students, answerFn, opts));
  const pv = await f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: s.id, parsed });
  return { s, view, parsed, pv };
}

test('匯入：預覽不寫成績；確認後報表正確；姓名不入庫；名冊計數', async () => {
  const f = setup();
  await makeExam(f);
  const { s, view, parsed, pv } = await importFlow(f, '甲 第1次', ['甲'], (si, ii) => (si % 2 ? 0 : 3), { garble: { item: 1, option: 2 } });
  assert.deepEqual(pv.blocking, []);
  assert.equal(pv.garbled, 1);
  assert.equal(pv.counts.notInRoster, 1);
  assert.equal(pv.counts.disabled, 1);
  assert.equal(pv.counts.wrongClass, 4, 'T021–T024 是乙班');
  assert.equal(pv.matched, 19);
  assert.ok(![...f.db.data.keys()].some((k) => k.includes('/results/')), '預覽零寫入');
  await f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: s.id, parsed, confirm: true, previewId: pv.previewId });
  const dump = JSON.stringify([...f.db.data.entries()]);
  assert.ok(!dump.includes('學生1'), '姓名不得寫入資料庫');
  assert.ok(!dump.includes('Z999'), '不在名冊的學號不得留存');
  const { report } = await f.call('zuvioReport', f.T, { examId: uuid(1), sittingIds: [s.id] });
  assert.equal(report.students, 19);
  const q0 = view.items[0];
  const pos = q0.optionOrder.indexOf(q0.answer);
  const expect = [...Array(24).keys()].filter((i) => i + 1 !== 5 && i < 20).filter((si) => (si % 2 ? 0 : 3) === pos).length;
  assert.equal(report.questions[0].ok, expect);
  await assert.rejects(f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: s.id, parsed, confirm: true, previewId: pv.previewId }), /失效/);
});

test('錯卷阻擋、竄改 payload、過期與重匯整份替換、刪除成績', async () => {
  const f = setup();
  await makeExam(f);
  const wrong = await importFlow(f, '甲', ['甲'], () => 0, { titleOverride: '別的考卷' });
  assert.ok(wrong.pv.blocking.length);
  assert.equal(wrong.pv.previewId, '');
  const ok = await importFlow(f, '甲2', ['甲'], () => 0);
  const tampered = structuredClone(ok.parsed);
  tampered.blocks[0].responses[0].answerText = tampered.blocks[0].options[1].text;
  await assert.rejects(f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: ok.s.id, parsed: tampered, confirm: true, previewId: ok.pv.previewId }), /變更/);
  await f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: ok.s.id, parsed: ok.parsed, confirm: true, previewId: ok.pv.previewId });
  // 重匯人數變少：舊結果不殘留
  const fewer = structuredClone(ok.parsed);
  fewer.blocks.forEach((b) => (b.responses = b.responses.slice(0, 5)));
  const pv2 = await f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: ok.s.id, parsed: fewer });
  await f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: ok.s.id, parsed: fewer, confirm: true, previewId: pv2.previewId });
  const left = [...f.db.data.keys()].filter((k) => k.includes('/results/'));
  assert.equal(left.length, 4, 'T001–T005 去掉停用的 T005');
  const r = await f.call('zuvioReport', f.T, { examId: uuid(1), sittingIds: [ok.s.id] });
  assert.equal(r.report.students, 4);
  await f.call('zuvioDeleteResults', f.T, { examId: uuid(1), sittingId: ok.s.id });
  assert.equal([...f.db.data.keys()].filter((k) => k.includes('/results/')).length, 0);
  const r2 = await f.call('zuvioReport', f.T, { examId: uuid(1), sittingIds: [ok.s.id] });
  assert.equal(r2.report.students, 0);
  await assert.rejects(f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: ok.s.id, parsed: fewer, confirm: true, previewId: pv2.previewId }), /失效/);
});

test('兩場比較與保留題後來外流防護', async () => {
  const f = setup();
  const { items } = await makeExam(f);
  const a = await importFlow(f, '第1次', ['甲'], () => 0);
  await f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: a.s.id, parsed: a.parsed, confirm: true, previewId: a.pv.previewId });
  const right = (ii) => a.view.items[ii].optionOrder.indexOf(a.view.items[ii].answer);
  const b = await importFlow(f, '重考', ['甲'], (si, ii) => right(ii));
  await f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: b.s.id, parsed: b.parsed, confirm: true, previewId: b.pv.previewId });
  const r = await f.call('zuvioReport', f.T, { examId: uuid(1), sittingIds: [a.s.id, b.s.id] });
  assert.equal(r.compare.length, items.length);
  assert.ok(r.compare.every((c) => c.rightToWrong === 0));
  // 某題後來被列為保留題：明細遮蔽、不能重新下載、報表不顯示題幹
  f.db.data.get('courses/C').assessmentSources.posttest = [items[0].questionId];
  const got = await f.call('zuvioGetExam', f.T, { examId: uuid(1) });
  assert.equal(got.csv, null);
  assert.ok(!JSON.stringify(got.view).includes(a.view.items[0].text));
  const rep = await f.call('zuvioReport', f.T, { examId: uuid(1), sittingIds: [a.s.id] });
  assert.ok(!JSON.stringify(rep.report).includes(a.view.items[0].text));
});

test('輸入界限：超量學生、超大 payload、非法鍵', async () => {
  const f = setup();
  await makeExam(f);
  const s = await f.call('zuvioCreateSitting', f.T, { examId: uuid(1), label: 'X', date: '2026-11-10', classIds: ['甲'] });
  const big = { title: 'x', summaryIds: [], problems: [], blocks: [{ n: 1, stem: 'x', score: '5', correctNo: 1, options: [], responses: Array.from({ length: 301 }, (_, i) => ({ studentId: 'T' + i, answerText: '', row: i })) }] };
  await assert.rejects(f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: s.id, parsed: big }), /上限/);
  await assert.rejects(f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: s.id, parsed: { ...big, blocks: [], junk: 1 } }), /不允許/);
  const evil = { title: 'x', summaryIds: [], problems: [], blocks: [{ n: 1, stem: 'x', score: '5', correctNo: 1, options: [], responses: [{ studentId: '__proto__', answerText: '', row: 1 }] }] };
  await assert.rejects(f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: s.id, parsed: evil }), /學號/);
  await assert.rejects(f.call('zuvioImportResults', f.T, { examId: uuid(1), sittingId: s.id, parsed: { ...big, title: 'x'.repeat(1_100_000) } }), /1 MB/);
});
