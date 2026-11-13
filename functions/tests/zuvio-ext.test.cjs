const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createZuvioHandlers } = require('../lib/functions/src/zuvioExams.js');
const { parseZuvioMatrix } = require('../lib/shared/zuvio.js');
const { fakeZuvioExport } = require('../lib/shared/zuvioSample.js');

function memoryDb() {
  const data = new Map();
  const clone = (x) => (x == null ? x : structuredClone(x));
  let ops = { reads: 0, writes: 0 };
  let queue = Promise.resolve();
  const snap = (p) => ({ exists: data.has(p), id: p.split('/').at(-1), ref: ref(p), data: () => clone(data.get(p)) });
  function ref(p) {
    return {
      path: p,
      id: p.split('/').at(-1),
      get: async () => { ops.reads++; return snap(p); },
      set: async (v, opts) => {
        ops.writes++;
        data.set(p, opts?.merge ? { ...(data.get(p) || {}), ...clone(v) } : clone(v));
      },
      update: async (v) => { ops.writes++; data.set(p, { ...data.get(p), ...clone(v) }); },
      delete: async () => { ops.writes++; data.delete(p); },
      collection: (n) => collection(p + '/' + n),
    };
  }
  function collection(p, filters = [], order = null, lim = Infinity) {
    return {
      path: p,
      doc: (id) => ref(p + '/' + id),
      where: (f, op, v) => collection(p, [...filters, [f, op, v]], order, lim),
      orderBy: (f, dir = 'asc') => collection(p, filters, [f, dir], lim),
      limit: (n) => collection(p, filters, order, n),
      async get() {
        let docs = [...data.keys()]
          .filter((k) => k.startsWith(p + '/') && k.split('/').length === p.split('/').length + 1)
          .map(snap);
        docs = docs.filter((d) =>
          filters.every(([f, op, v]) => {
            const val = d.data()[f];
            if (op === '==') return val === v;
            if (op === 'in') return Array.isArray(v) && v.includes(val);
            return false;
          }),
        );
        if (order) docs.sort((a, b) => (a.data()[order[0]] > b.data()[order[0]] ? 1 : -1) * (order[1] === 'desc' ? -1 : 1));
        docs = docs.slice(0, lim);
        ops.reads += Math.max(1, docs.length);
        return { docs, empty: !docs.length, size: docs.length };
      },
    };
  }
  return {
    data,
    ops: () => ops,
    resetOps: () => (ops = { reads: 0, writes: 0 }),
    doc: ref,
    collection: (p) => collection(p),
    getAll: async (...refs) => {
      ops.reads += refs.length;
      return refs.map((r) => snap(r.path));
    },
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
          set: (r, v, opts) => w.push(() => data.set(r.path, opts?.merge ? { ...(data.get(r.path) || {}), ...clone(v) } : clone(v))),
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
}

const W8 = readFileSync(path.join(__dirname, '../../tests/fixtures/zuvio/W8-import.csv'), 'utf8')
  .replace(/^\ufeff/, '')
  .split('\r\n')
  .map((l) => l.split(','))
  .filter((r) => r[0] === 'a');

function setup({ moodEnabled = true } = {}) {
  const db = memoryDb();
  const units = [
    { id: 'u1', title: '腎絲球', bankVersion: 'v1', chapterId: 'c1', visibility: 'current' },
    { id: 'u2', title: '呼吸', bankVersion: 'v1', chapterId: 'c1', visibility: 'current' },
  ];
  const course = {
    rosterVersion: 2,
    features: { zuvioExams: true, zuvioMood: moodEnabled },
    published: { classIds: ['A', 'B'], units },
  };
  db.data.set('courses/C1', course);

  const qs = W8.slice(0, 6).map((r, i) => ({
    id: 'q' + i,
    text: r[1],
    options: r.slice(4).filter(Boolean).map((t, k) => ({ id: 'abcd'[k], text: t })),
    answer: 'abcd'[Number(r[3]) - 1],
  }));
  ['u1', 'u2'].forEach((u, ui) => {
    const slice = qs.slice(ui * 3, ui * 3 + 3);
    db.data.set(`banks/C1_${u}_v1`, { unitId: u, version: 'v1', chunks: ['0'] });
    db.data.set(`banks/C1_${u}_v1/chunks/0`, { questions: slice });
    db.data.set(`banks/C1_${u}_v1/grading/answers`, { answers: Object.fromEntries(slice.map((q) => [q.id, q.answer])) });
  });

  const roster = [
    { uid: 'uid1', studentId: 'S01', name: '王小明', classId: 'A', enabled: true },
    { uid: 'uid2', studentId: 'S02', name: '李華', classId: 'A', enabled: true },
    { uid: 'uid3', studentId: 'S03', name: '陳大同', classId: 'B', enabled: true },
  ];
  for (const s of roster) {
    db.data.set(`courses/C1/studentIds/${s.studentId}`, { email: `${s.studentId}@x` });
    db.data.set(`enrollments/C1__${s.studentId}@x`, { courseId: 'C1', ...s });
  }

  const access = async (req, courseId, teacherOnly) => {
    const uid = req.auth?.uid;
    if (teacherOnly && uid !== 'T1') throw new Error('forbidden');
    if (uid === 'T1') return { p: { uid: 'T1', teacher: true, classId: '' }, c: db.data.get(`courses/${courseId}`) };
    const st = roster.find((r) => r.uid === uid);
    if (!st) throw new Error('unauth');
    return { p: { uid: st.uid, teacher: false, classId: st.classId, studentId: st.studentId }, c: db.data.get(`courses/${courseId}`) };
  };
  const h = createZuvioHandlers(db, access, {});
  const call = (fn, uid, data) => fn.run({ auth: { uid }, data });
  return { db, h, call, roster };
}

test('zuvioMood：功能旗標關閉時拒絕、開啟後權限／跨班／不可改／3 秒寬限', async () => {
  const off = setup({ moodEnabled: false });
  await assert.rejects(() => off.call(off.h.zuvioGetActiveMood, 'uid1', { courseId: 'C1' }));
  await assert.rejects(() => off.call(off.h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: '00000000-0000-4000-8000-000000000001', sittingId: '00000000-0000-4000-8000-000000000002' }));

  const { db, h, call } = setup({ moodEnabled: true });
  const examId = '11111111-1111-4111-8111-111111111111';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: '課前考',
    score: 10,
    classIds: ['A', 'B'],
    items: [
      { questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] },
      { questionId: 'q3', unitId: 'u2', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] },
    ],
  });
  const sitting = await call(h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId,
    label: 'A班第1場',
    date: '2026-11-13',
    classIds: ['A'],
    startsAt: 1700000000000,
  });

  const opened = await call(h.zuvioOpenMood, 'T1', {
    courseId: 'C1',
    examId,
    sittingId: sitting.id,
    durationMinutes: 10,
  });
  assert.equal(opened.open, true);
  assert.equal(opened.eligibleCount, 2);
  assert.ok(db.data.get('courses/C1/classroomState/current').pollingActiveUntil > Date.now());

  // 學生端不洩漏 teacherNote
  const activeA = await call(h.zuvioGetActiveMood, 'uid1', { courseId: 'C1' });
  assert.equal(activeA.active, true);
  assert.equal(activeA.submitted, false);
  assert.ok(!JSON.stringify(activeA).includes('teacherNote'));

  // 他班學生（B 班）看不到也送不出
  const activeB = await call(h.zuvioGetActiveMood, 'uid3', { courseId: 'C1' });
  assert.equal(activeB.active, false);
  await assert.rejects(() => call(h.zuvioSubmitMood, 'uid3', { courseId: 'C1', sittingId: sitting.id, mood: 'green_flow' }));

  // 提交後不可更改
  const sub1 = await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: sitting.id, mood: 'red_volcano' });
  assert.equal(sub1.alreadySubmitted, false);
  assert.equal(sub1.mood, 'red_volcano');
  const sub1Again = await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: sitting.id, mood: 'green_flow' });
  assert.equal(sub1Again.alreadySubmitted, true);
  assert.equal(sub1Again.mood, 'red_volcano');

  // 教師即時統計只給人數，不含學生姓名
  const live = await call(h.zuvioGetMoodLive, 'T1', { courseId: 'C1', examId, sittingId: sitting.id });
  assert.equal(live.totalResponded, 1);
  assert.equal(live.counts.red_volcano, 1);
  assert.ok(!JSON.stringify(live).includes('王小明'));

  // 教師關閉後 3 秒寬限期仍可送出，超過 3 秒拒絕
  await call(h.zuvioCloseMood, 'T1', { courseId: 'C1', sittingId: sitting.id });
  const sub2 = await call(h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: sitting.id, mood: 'green_flow' });
  assert.equal(sub2.alreadySubmitted, false);

  // 模擬已關閉超過 3 秒
  const st = db.data.get('courses/C1/zuvioMoodState/current');
  db.data.set('courses/C1/zuvioMoodState/current', { ...st, closedAt: Date.now() - 4000 });
  await assert.rejects(() => call(h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: sitting.id, mood: 'gray_fog' }));
});

test('考前練習切分、快取讀取數估算、關懷名單與三種 CSV 匯出', async () => {
  const { db, h, call, roster } = setup({ moodEnabled: true });
  const startsAt = 1700001000000;
  const examId = '22222222-2222-4222-8222-222222222222';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'W8測試',
    score: 50,
    classIds: ['A'],
    items: [
      { questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] },
      { questionId: 'q3', unitId: 'u2', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] },
    ],
  });
  const s1 = await call(h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId,
    label: '第1場',
    date: '2026-11-12',
    classIds: ['A'],
    startsAt: startsAt - 100000,
  });
  const s2 = await call(h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId,
    label: '第2場',
    date: '2026-11-13',
    classIds: ['A'],
    startsAt,
  });

  // uid1: passedAt < startsAt -> passed
  db.data.set('courses/C1/progress/uid1', { units: { u1: { best: 90, attempts: 1, updatedAt: startsAt - 500, passedAt: startsAt - 500 } } });
  // uid2: 沒有考前練習 -> none (且連續兩場皆灰)

  // 寫入 s2 情緒與成績
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId, sittingId: s2.id, durationMinutes: 10 });
  await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: s2.id, mood: 'red_volcano' });
  await call(h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: s2.id, mood: 'gray_fog' });

  const examDoc = await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId });
  const view = examDoc.view;
  const m = fakeZuvioExport(
    view,
    roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })),
    () => 1, // pick B (check wrong/low score)
  );
  const parsed = parseZuvioMatrix(m);
  const prev = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: s2.id, parsed, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: s2.id, parsed, confirm: true, previewId: prev.previewId });

  // 第一次報表（建立 prep 快取）與第二次報表（命中快取）比較 Firestore reads
  db.resetOps();
  const rep1 = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], threshold: 80 });
  const firstReads = db.ops().reads;
  db.resetOps();
  const rep2 = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], threshold: 80 });
  const cachedReads = db.ops().reads;
  assert.ok(cachedReads < firstReads, `快取命中應降低 reads（first=${firstReads}, cached=${cachedReads}）`);
  assert.equal(rep1.preExamCounts.passed, 1);
  assert.equal(rep1.preExamCounts.none, 1);
  assert.equal(rep1.moodSummary.counts.red_volcano, 1);
  assert.equal(rep2.analysis.summary.students, 2);

  // 修改開考時間後快取失效重算
  await call(h.zuvioUpdateSittingStart, 'T1', { courseId: 'C1', examId, sittingId: s2.id, startsAt: startsAt - 1000 });
  const rep3 = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], threshold: 80 });
  assert.equal(rep3.preExamCounts.passed, 0);
  assert.equal(rep3.preExamCounts.none, 2);

  // 關懷名單（含遮罩姓名＋連續未練習）
  const care = await call(h.zuvioCareList, 'T1', { courseId: 'C1', examId, sittingId: s2.id, threshold: 80 });
  assert.equal(care.entries.length, 2);
  assert.ok(care.entries.some((e) => e.maskedName === '王○明' && e.tags.includes('情緒：小火山')));
  assert.ok(care.entries.some((e) => e.maskedName === '李○' && e.tags.includes('連續未練習')));

  // 三種 CSV 匯出
  const csvItem = await call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], kind: 'itemAnalysis' });
  assert.ok(csvItem.csv.includes('難度P'));
  const csvAnon = await call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], kind: 'researchAnon' });
  assert.ok(!csvAnon.csv.includes('王小明') && !csvAnon.csv.includes('S01'));
  assert.ok(csvAnon.csv.includes('研究代碼'));
  const csvNamed = await call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], kind: 'researchNamed' });
  assert.ok(csvNamed.filename.includes('含個資'));
  assert.ok(csvNamed.csv.includes('王小明') && csvNamed.csv.includes('S01'));
});
