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
  function collection(p, filters = [], order = null, lim = Infinity, afterDoc = null) {
    return {
      path: p,
      doc: (id) => ref(p + '/' + id),
      where: (f, op, v) => collection(p, [...filters, [f, op, v]], order, lim, afterDoc),
      orderBy: (f, dir = 'asc') => collection(p, filters, [f, dir], lim, afterDoc),
      limit: (n) => collection(p, filters, order, n, afterDoc),
      startAfter: (d) => collection(p, filters, order, lim, d),
      async get() {
        const toVal = (x) => {
          if (x && typeof x.toMillis === 'function') return x.toMillis();
          if (x && typeof x.seconds === 'number') return x.seconds * 1000;
          return x;
        };
        let docs = [...data.keys()]
          .filter((k) => k.startsWith(p + '/') && k.split('/').length === p.split('/').length + 1)
          .map(snap);
        docs = docs.filter((d) =>
          filters.every(([f, op, v]) => {
            const val = toVal(d.data()[f]);
            const cmp = toVal(v);
            if (op === '==') return val === cmp;
            if (op === '<') return val < cmp;
            if (op === '<=') return val <= cmp;
            if (op === '>') return val > cmp;
            if (op === '>=') return val >= cmp;
            if (op === 'in') return Array.isArray(v) && v.includes(d.data()[f]);
            return false;
          }),
        );
        if (order) docs.sort((a, b) => (toVal(a.data()[order[0]]) > toVal(b.data()[order[0]]) ? 1 : -1) * (order[1] === 'desc' ? -1 : 1) || a.id.localeCompare(b.id));
        if (afterDoc) {
          const idx = docs.findIndex((d) => d.id === afterDoc.id);
          if (idx >= 0) docs = docs.slice(idx + 1);
        }
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

function setup({ moodEnabled = true, handlerOptions = {} } = {}) {
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
  const h = createZuvioHandlers(db, access, handlerOptions);
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

  // 寫入 s2 情緒與成績（用 green_flow 與 blue_caterpillar 驗證規畫 4.2 與三型）
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId, sittingId: s2.id, durationMinutes: 10 });
  await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: s2.id, mood: 'green_flow' });
  await call(h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: s2.id, mood: 'blue_caterpillar' });

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
  assert.equal(rep1.moodSummary.counts.green_flow, 1);
  assert.equal(rep2.analysis.summary.students, 2);

  // 修改開考時間後快取失效重算
  await call(h.zuvioUpdateSittingStart, 'T1', { courseId: 'C1', examId, sittingId: s2.id, startsAt: startsAt - 1000 });
  const rep3 = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], threshold: 80 });
  assert.equal(rep3.preExamCounts.passed, 0);
  assert.equal(rep3.preExamCounts.none, 2);

  // 關懷名單（含遮罩姓名＋規畫 4.2／三型規則）
  const care = await call(h.zuvioCareList, 'T1', { courseId: 'C1', examId, sittingId: s2.id, threshold: 80 });
  assert.equal(care.entries.length, 2);
  assert.ok(care.entries.some((e) => e.maskedName === '王○明' && e.tags.includes('自評與表現有落差')));
  assert.ok(care.entries.some((e) => e.maskedName === '李○' && e.tags.includes('可能需要鷹架') && e.practiceGroup === '沒練習＋低分＋藍色'));

  // 三種 CSV 匯出
  const csvItem = await call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], kind: 'itemAnalysis' });
  assert.ok(csvItem.csv.includes('難度P'));
  const csvAnon = await call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], kind: 'researchAnon' });
  assert.ok(!csvAnon.csv.includes('王小明') && !csvAnon.csv.includes('S01'));
  assert.ok(csvAnon.csv.includes('研究代碼'));
  assert.ok(csvAnon.csv.includes('Q1_考前練習'));
  const csvNamed = await call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [s2.id], kind: 'researchNamed' });
  assert.ok(csvNamed.filename.includes('含個資'));
  assert.ok(csvNamed.csv.includes('王小明') && csvNamed.csv.includes('S01'));
});

test('F1/F2/F6/F7/F8 後端驗證：未來快取不凍結、只採信receivedAt、兩場去重與跨卷應參與場次', async () => {
  const { db, h, call, roster } = setup({ moodEnabled: true });
  const futureStart = Date.now() + 3600 * 1000;
  const examId = '33333333-3333-4333-8333-333333333333';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: '未來場次測試',
    score: 50,
    classIds: ['A'],
    items: [
      { questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] },
      { questionId: 'q3', unitId: 'u2', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] },
    ],
  });
  const sFut = await call(h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId,
    label: '未來場',
    date: '2026-11-20',
    classIds: ['A'],
    startsAt: futureStart,
  });

  // F6：開考前首查 none=2
  const rBefore = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sFut.id] });
  assert.equal(rBefore.preExamCounts.none, 2);

  // F8：student uid2 送出一筆 receivedAt > futureStart 但 clientAt < futureStart 的作答 -> 不應算入
  db.data.set('courses/C1/attempts/att_fake', {
    uid: 'uid2',
    classId: 'A',
    unitId: 'u1',
    receivedAt: futureStart + 5000,
    clientAt: futureStart - 5000,
    answers: [{ questionId: 'q0', correct: true }],
  });
  // F1/F6：student uid1 送出一筆真正 receivedAt < futureStart 的逐題作答 -> 應立即更新為 practiced=1
  db.data.set('courses/C1/attempts/att_real', {
    uid: 'uid1',
    classId: 'A',
    unitId: 'u1',
    receivedAt: Date.now() - 1000,
    clientAt: Date.now() - 1000,
    answers: [{ questionId: 'q0', correct: false }],
  });
  const rAfter = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sFut.id] });
  assert.equal(rAfter.preExamCounts.practiced, 1);
  assert.equal(rAfter.preExamCounts.none, 1);

  // F7：兩場情緒比較（故意將 sittingIds 反序傳入）只配對後場 1 次
  const t1 = Date.now() - 200000;
  const t2 = Date.now() - 100000;
  const exam2Id = '44444444-4444-4444-8444-444444444444';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: exam2Id,
    title: '兩場比較',
    score: 100,
    classIds: ['A', 'B'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sa = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: exam2Id, label: '早場', date: '2026-11-10', classIds: ['A'], startsAt: t1 });
  const sb = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: exam2Id, label: '晚場', date: '2026-11-11', classIds: ['A'], startsAt: t2 });
  const sOtherClass = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: exam2Id, label: 'B班場', date: '2026-11-12', classIds: ['B'], startsAt: t2 + 10000 });

  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: exam2Id, sittingId: sa.id, durationMinutes: 10 });
  await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: sa.id, mood: 'blue_caterpillar' });
  await call(h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: sa.id, mood: 'gray_fog' });
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: exam2Id, sittingId: sb.id, durationMinutes: 10 });
  await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: sb.id, mood: 'green_flow' });
  await call(h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: sb.id, mood: 'gray_fog' });

  const view2 = (await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId: exam2Id })).view;
  for (const sId of [sa.id, sb.id]) {
    const m2 = fakeZuvioExport(view2, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => 0);
    const p2 = parseZuvioMatrix(m2);
    const pr = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId: exam2Id, sittingId: sId, parsed: p2, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
    await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId: exam2Id, sittingId: sId, parsed: p2, confirm: true, previewId: pr.previewId });
  }
  const compRep = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId: exam2Id, sittingIds: [sb.id, sa.id] });
  assert.equal(compRep.moodSummary.shifts.totalPaired, 2);
  assert.equal(compRep.moodSummary.shifts.toGreen, 1);
  assert.equal(compRep.moodSummary.shifts.unchanged, 1);

  // F2：跨考卷最近 3 場皆灰（在第一張考卷再給 uid2 一場 gray_fog，且中間夾一個 B 班場次不應中斷 A 班連續）
  const exam3Id = '55555555-5555-4555-8555-555555555555';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: exam3Id,
    title: '第三場',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sc = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: exam3Id, label: '第三場', date: '2026-11-13', classIds: ['A'], startsAt: t2 + 20000 });
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: exam3Id, sittingId: sc.id, durationMinutes: 10 });
  await call(h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: sc.id, mood: 'gray_fog' });
  const care3 = await call(h.zuvioCareList, 'T1', { courseId: 'C1', examId: exam3Id, sittingId: sc.id, threshold: 80 });
  const u2Entry = care3.entries.find((e) => e.studentId === 'S02');
  assert.ok(u2Entry && u2Entry.tags.includes('持續疏離'));
  assert.ok(sOtherClass.id);
});


test('R2/R3/R5/R7 後端驗證：多班歷史不遮蔽、跨頁完整讀取與超量不定稿、旗標關閉保護、無成績情緒統計', async () => {
  // R5：zuvioMood 關閉時，所有新增教師/學生 callable 拒絕，zuvioReport 保留 #61 舊聚合不回傳擴充欄位
  const off = setup({ moodEnabled: false });
  const offExamId = '66666666-6666-4666-8666-666666666666';
  await off.call(off.h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: offExamId,
    title: '關旗標測試',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const offSit = await off.call(off.h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId: offExamId,
    label: 'S1',
    date: '2026-11-10',
    classIds: ['A'],
  });
  await assert.rejects(() => off.call(off.h.zuvioUpdateSittingStart, 'T1', { courseId: 'C1', examId: offExamId, sittingId: offSit.id, startsAt: Date.now() }));
  await assert.rejects(() => off.call(off.h.zuvioCareList, 'T1', { courseId: 'C1', examId: offExamId, sittingId: offSit.id }));
  await assert.rejects(() => off.call(off.h.zuvioExportCsv, 'T1', { courseId: 'C1', examId: offExamId, sittingIds: [offSit.id], kind: 'researchAnon' }));
  await assert.rejects(() => off.call(off.h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: offExamId, sittingId: offSit.id }));
  const offRep = await off.call(off.h.zuvioReport, 'T1', { courseId: 'C1', examId: offExamId, sittingIds: [offSit.id] });
  assert.equal(offRep.moodEnabled, false);
  assert.equal(offRep.moodSummary, undefined);
  assert.equal(offRep.preExamDetail, undefined);

  // R3：分頁完整讀取超過單頁（例如 pageSize=3，寫入 7 筆，第 7 筆才包含本卷 q0）
  const paged = setup({ moodEnabled: true, handlerOptions: { prepPageSize: 3, prepMaxAttempts: 20 } });
  const pExamId = '77777777-7777-4777-8777-777777777777';
  const tNow = Date.now() - 1000;
  await paged.call(paged.h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: pExamId,
    title: '分頁測試',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const pSit = await paged.call(paged.h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId: pExamId,
    label: 'P1',
    date: '2026-11-11',
    classIds: ['A'],
    startsAt: tNow,
  });
  for (let i = 0; i < 6; i++) {
    paged.db.data.set(`courses/C1/attempts/other_${i}`, {
      uid: 'uid1',
      classId: 'A',
      unitId: 'u1',
      receivedAt: tNow - (i + 1) * 100,
      answers: [{ questionId: 'q_other', correct: true }],
    });
  }
  paged.db.data.set('courses/C1/attempts/target_7', {
    uid: 'uid1',
    classId: 'A',
    unitId: 'u1',
    receivedAt: tNow - 5000,
    answers: [{ questionId: 'q0', correct: true }],
  });
  const pRep = await paged.call(paged.h.zuvioReport, 'T1', { courseId: 'C1', examId: pExamId, sittingIds: [pSit.id] });
  assert.equal(pRep.preExamIncomplete, false);
  assert.equal(pRep.preExamCounts.practiced, 1);

  // R3 超量上限：prepMaxAttempts=4，有 5 筆資料 -> 必須標記 preExamIncomplete=true 且 finalized=false
  const capped = setup({ moodEnabled: true, handlerOptions: { prepPageSize: 2, prepMaxAttempts: 4 } });
  const cExamId = '88888888-8888-4888-8888-888888888888';
  await capped.call(capped.h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: cExamId,
    title: '超量測試',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const cSit = await capped.call(capped.h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId: cExamId,
    label: 'C1',
    date: '2026-11-11',
    classIds: ['A'],
    startsAt: tNow,
  });
  for (let i = 0; i < 5; i++) {
    capped.db.data.set(`courses/C1/attempts/cap_${i}`, {
      uid: 'uid1',
      classId: 'A',
      unitId: 'u1',
      receivedAt: tNow - (i + 1) * 100,
      answers: [{ questionId: 'q_other', correct: true }],
    });
  }
  const cRep = await capped.call(capped.h.zuvioReport, 'T1', { courseId: 'C1', examId: cExamId, sittingIds: [cSit.id] });
  assert.equal(cRep.preExamIncomplete, true);
  assert.equal(capped.db.data.get(`courses/C1/zuvioExams/${cExamId}/prep/${cSit.id}`).finalized, false);

  // R7：無成績場次有 2 人填情緒 -> zuvioReport 顯示 totalResponded=2，且兩場只有早場有成績時仍算配對轉變
  const r7 = setup({ moodEnabled: true });
  const r7ExamId = '99999999-9999-4999-8999-999999999999';
  await r7.call(r7.h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: r7ExamId,
    title: '無成績情緒',
    score: 100,
    classIds: ['A', 'B'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const r7s1 = await r7.call(r7.h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: r7ExamId, label: 'R7-1', date: '2026-11-10', classIds: ['A', 'B'], startsAt: tNow - 100000 });
  const r7s2 = await r7.call(r7.h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: r7ExamId, label: 'R7-2', date: '2026-11-11', classIds: ['A', 'B'], startsAt: tNow });
  await r7.call(r7.h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: r7ExamId, sittingId: r7s1.id });
  await r7.call(r7.h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: r7s1.id, mood: 'blue_caterpillar' });
  await r7.call(r7.h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: r7s1.id, mood: 'gray_fog' });
  await r7.call(r7.h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: r7ExamId, sittingId: r7s2.id });
  await r7.call(r7.h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: r7s2.id, mood: 'green_flow' });
  await r7.call(r7.h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: r7s2.id, mood: 'gray_fog' });

  const repNoRes = await r7.call(r7.h.zuvioReport, 'T1', { courseId: 'C1', examId: r7ExamId, sittingIds: [r7s2.id] });
  assert.equal(repNoRes.moodSummary.totalResponded, 2);
  assert.equal(repNoRes.moodSummary.counts.green_flow, 1);
  assert.equal(repNoRes.moodSummary.byScore.find((x) => x.code === 'green_flow').total, 0);
  const repShiftNoRes = await r7.call(r7.h.zuvioReport, 'T1', { courseId: 'C1', examId: r7ExamId, sittingIds: [r7s1.id, r7s2.id] });
  assert.equal(repShiftNoRes.moodSummary.shifts.totalPaired, 2);
  assert.equal(repShiftNoRes.moodSummary.shifts.toGreen, 1);

  // R2：多班歷史遮蔽（目標 A、B 兩班；中間插 6 場僅 B 班；A 班較早 2 場皆 gray_fog，應仍抓到並標持續疏離）
  const bExamId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  await r7.call(r7.h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: bExamId,
    title: 'B班干擾場',
    score: 100,
    classIds: ['A', 'B'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  // A 班極早場 gray_fog (連同 r7s1、r7s2 湊成 A 班最近 3 場皆灰)
  const aEarly = await r7.call(r7.h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: bExamId, label: 'A早場', date: '2026-11-01', classIds: ['A'], startsAt: tNow - 500000 });
  await r7.call(r7.h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: bExamId, sittingId: aEarly.id });
  await r7.call(r7.h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: aEarly.id, mood: 'gray_fog' });
  // 中間插 6 場純 B 班場次
  for (let i = 0; i < 6; i++) {
    await r7.call(r7.h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: bExamId, label: `B${i}`, date: `2026-11-12`, classIds: ['B'], startsAt: tNow - 1000 - i * 100 });
  }
  const careMulti = await r7.call(r7.h.zuvioCareList, 'T1', { courseId: 'C1', examId: r7ExamId, sittingId: r7s2.id });
  const s02 = careMulti.entries.find((e) => e.studentId === 'S02');
  assert.ok(s02 && s02.tags.includes('持續疏離'), 'A 班歷史不應被 B 班 6 場遮蔽');
});


test('B1：16班／32個不同歷史場次不截斷，全班與逐班查詢一致', async () => {
  const { db, h, call } = setup({ moodEnabled: true });
  const classIds = Array.from({ length: 16 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`);
  const course = db.data.get('courses/C1');
  course.published.classIds = classIds;
  db.data.set('courses/C1', course);

  const students16 = classIds.map((cl, i) => ({
    uid: `b1_uid_${i + 1}`,
    studentId: `B1S${String(i + 1).padStart(2, '0')}`,
    name: `學生${i + 1}`,
    classId: cl,
    enabled: true,
  }));
  for (const s of students16) {
    db.data.set(`courses/C1/studentIds/${s.studentId}`, { email: `${s.studentId}@x` });
    db.data.set(`enrollments/C1__${s.studentId}@x`, { courseId: 'C1', ...s });
  }
  const access16 = async (req, courseId, teacherOnly) => {
    const uid = req.auth?.uid;
    if (teacherOnly && uid !== 'T1') throw new Error('forbidden');
    if (uid === 'T1') return { p: { uid: 'T1', teacher: true, classId: '' }, c: db.data.get(`courses/${courseId}`) };
    const st = students16.find((r) => r.uid === uid);
    if (!st) throw new Error('unauth');
    return { p: { uid: st.uid, teacher: false, classId: st.classId, studentId: st.studentId }, c: db.data.get(`courses/${courseId}`) };
  };
  const h16 = createZuvioHandlers(db, access16, {});
  const call16 = (fn, uid, data) => fn.run({ auth: { uid }, data });

  const tBase = Date.now() - 1000000;
  // 建立兩張歷史考卷，各有 16 個不同班級場次（共 32 個獨立歷史場次）
  for (let histNo = 1; histNo <= 2; histNo++) {
    const hExamId = `10000000-0000-4000-8000-00000000000${histNo}`;
    await call16(h16.zuvioCreateExam, 'T1', {
      courseId: 'C1',
      examId: hExamId,
      title: `歷史考卷${histNo}`,
      score: 100,
      classIds,
      items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
    });
    for (let i = 0; i < 16; i++) {
      const s = await call16(h16.zuvioCreateSitting, 'T1', {
        courseId: 'C1',
        examId: hExamId,
        label: `H${histNo}-${classIds[i]}`,
        date: `2026-11-0${histNo}`,
        classIds: [classIds[i]],
        startsAt: tBase + histNo * 100000 + i * 100,
      });
      await call16(h16.zuvioOpenMood, 'T1', { courseId: 'C1', examId: hExamId, sittingId: s.id });
      await call16(h16.zuvioSubmitMood, students16[i].uid, { courseId: 'C1', sittingId: s.id, mood: 'gray_fog' });
    }
  }

  // 建立目標考卷與包含全部 16 班的場次
  const targetExamId = '20000000-0000-4000-8000-000000000000';
  await call16(h16.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: targetExamId,
    title: '16班期末考',
    score: 100,
    classIds,
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const targetSit = await call16(h16.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId: targetExamId,
    label: '全16班場次',
    date: '2026-11-15',
    classIds,
    startsAt: Date.now() - 1000,
  });
  await call16(h16.zuvioOpenMood, 'T1', { courseId: 'C1', examId: targetExamId, sittingId: targetSit.id });
  for (const st of students16) {
    await call16(h16.zuvioSubmitMood, st.uid, { courseId: 'C1', sittingId: targetSit.id, mood: 'gray_fog' });
  }

  const allCare = await call16(h16.zuvioCareList, 'T1', { courseId: 'C1', examId: targetExamId, sittingId: targetSit.id });
  assert.equal(allCare.entries.length, 16, '全班查詢應含全部 16 班，不應因 30 場截斷漏末班');
  assert.ok(allCare.entries.every((e) => e.tags.includes('持續疏離')));

  const lastCare = await call16(h16.zuvioCareList, 'T1', { courseId: 'C1', examId: targetExamId, sittingId: targetSit.id, classId: 'C16' });
  assert.equal(lastCare.entries.length, 1);
  assert.ok(lastCare.entries[0].tags.includes('持續疏離'));
  assert.deepEqual(
    allCare.entries.find((e) => e.classId === 'C16'),
    lastCare.entries[0],
  );
  assert.ok(h);
});

test('B2：超量不完整資料同時驗證 Report、CareList、researchAnon、researchNamed 與 itemAnalysis', async () => {
  const { db, h, call, roster } = setup({ moodEnabled: true, handlerOptions: { prepPageSize: 2, prepMaxAttempts: 4 } });
  const tNow = Date.now() - 1000;
  const examId = '30000000-0000-4000-8000-000000000000';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'B2超量',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sit = await call(h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId,
    label: 'B2場',
    date: '2026-11-16',
    classIds: ['A'],
    startsAt: tNow,
  });
  for (let i = 0; i < 4; i++) {
    db.data.set(`courses/C1/attempts/b2_other_${i}`, {
      uid: 'uid1',
      classId: 'A',
      unitId: 'u1',
      receivedAt: tNow - (i + 1) * 100,
      answers: [{ questionId: 'q_other', correct: true }],
    });
  }
  // 第 5 筆才包含本卷 q0（模擬超過上限）
  db.data.set('courses/C1/attempts/b2_target_5', {
    uid: 'uid1',
    classId: 'A',
    unitId: 'u1',
    receivedAt: tNow - 5000,
    answers: [{ questionId: 'q0', correct: true }],
  });

  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId, sittingId: sit.id });
  await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: sit.id, mood: 'blue_caterpillar' });

  const view = (await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId })).view;
  const m = fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => 1); // 全部答錯 0%
  const parsed = parseZuvioMatrix(m);
  const prev = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed, confirm: true, previewId: prev.previewId });

  const rep = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sit.id] });
  assert.equal(rep.preExamIncomplete, true);
  assert.equal(db.data.get(`courses/C1/zuvioExams/${examId}/prep/${sit.id}`).finalized, false);

  const care = await call(h.zuvioCareList, 'T1', { courseId: 'C1', examId, sittingId: sit.id, threshold: 80 });
  assert.equal(care.preExamIncomplete, true);
  const s01 = care.entries.find((e) => e.studentId === 'S01');
  assert.ok(s01);
  assert.equal(s01.preExamIncomplete, true);
  assert.notEqual(s01.practiceGroup, '沒練習＋低分＋藍色');
  assert.equal(s01.practiceGroup, '練習資料不完整');

  await assert.rejects(() => call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [sit.id], kind: 'researchAnon' }));
  await assert.rejects(() => call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [sit.id], kind: 'researchNamed' }));
  const itemCsv = await call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [sit.id], kind: 'itemAnalysis' });
  assert.ok(itemCsv.csv.includes('難度P'));
});


test('C1：共享歷史與單班歷史混用按時間排序，全班／單班及目標班序 [A,B] 與 [B,A] 皆一致', async () => {
  const { db, h, call } = setup({ moodEnabled: true });
  const tBase = Date.now() - 1000000;
  const hExamId = '40000000-0000-4000-8000-000000000000';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: hExamId,
    title: 'C1歷史',
    score: 100,
    classIds: ['A', 'B'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  // H1（最舊，A+B 共用）：B 填 gray_fog
  const h1 = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: hExamId, label: 'H1', date: '2026-11-01', classIds: ['A', 'B'], startsAt: tBase + 1000 });
  // H2（次舊，A+B 共用）：B 填 gray_fog
  const h2 = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: hExamId, label: 'H2', date: '2026-11-02', classIds: ['A', 'B'], startsAt: tBase + 2000 });
  // H3（最新，僅 B）：B 填 blue_caterpillar
  const h3 = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: hExamId, label: 'H3', date: '2026-11-03', classIds: ['B'], startsAt: tBase + 3000 });

  for (const s of [h1, h2]) {
    await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: hExamId, sittingId: s.id });
    await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: s.id, mood: 'gray_fog' }); // A班 uid1 皆灰
    await call(h.zuvioSubmitMood, 'uid3', { courseId: 'C1', sittingId: s.id, mood: 'gray_fog' }); // B班 uid3 在 H1/H2 灰
  }
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: hExamId, sittingId: h3.id });
  await call(h.zuvioSubmitMood, 'uid3', { courseId: 'C1', sittingId: h3.id, mood: 'blue_caterpillar' }); // B班 uid3 在最新 H3 為藍

  const tExamId = '50000000-0000-4000-8000-000000000000';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: tExamId,
    title: 'C1目標',
    score: 100,
    classIds: ['A', 'B'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const tSitAB = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: tExamId, label: 'T-AB', date: '2026-11-10', classIds: ['A', 'B'], startsAt: tBase + 10000 });
  const tSitBA = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: tExamId, label: 'T-BA', date: '2026-11-10', classIds: ['B', 'A'], startsAt: tBase + 10000 });

  for (const tSit of [tSitAB, tSitBA]) {
    await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: tExamId, sittingId: tSit.id });
    await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: tSit.id, mood: 'gray_fog' });
    await call(h.zuvioSubmitMood, 'uid3', { courseId: 'C1', sittingId: tSit.id, mood: 'gray_fog' });
  }

  // 全班查詢 [A, B]
  const allAB = await call(h.zuvioCareList, 'T1', { courseId: 'C1', examId: tExamId, sittingId: tSitAB.id });
  // 全班查詢 [B, A]
  const allBA = await call(h.zuvioCareList, 'T1', { courseId: 'C1', examId: tExamId, sittingId: tSitBA.id });
  // 單班查詢 A、B
  const onlyA = await call(h.zuvioCareList, 'T1', { courseId: 'C1', examId: tExamId, sittingId: tSitAB.id, classId: 'A' });
  const onlyB = await call(h.zuvioCareList, 'T1', { courseId: 'C1', examId: tExamId, sittingId: tSitAB.id, classId: 'B' });

  // A 班 uid1 最近 3 場 (T, H2, H1) 皆灰 -> 持續疏離；B 班 uid3 最近 3 場 (T灰, H3藍, H2灰) -> 不得誤標持續疏離
  assert.equal(onlyA.entries.some((e) => e.studentId === 'S01' && e.tags.includes('持續疏離')), true);
  assert.equal(onlyB.entries.some((e) => e.studentId === 'S03' && e.tags.includes('持續疏離')), false);
  assert.equal(allAB.entries.some((e) => e.studentId === 'S03' && e.tags.includes('持續疏離')), false);
  assert.equal(allBA.entries.some((e) => e.studentId === 'S03' && e.tags.includes('持續疏離')), false);
  assert.deepEqual(allAB.entries, allBA.entries);
  assert.deepEqual(allAB.entries.filter((e) => e.classId === 'A'), onlyA.entries);
  assert.deepEqual(allAB.entries.filter((e) => e.classId === 'B'), onlyB.entries);
});
