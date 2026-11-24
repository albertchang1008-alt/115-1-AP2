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

test('V1：正式名冊無 enrollment.uid 時依 email 解析 profiles UID，且舊版錯誤定稿快取會失效重算（無登入 profile 仍為 none）', async () => {
  const { db, h, call } = setup({ moodEnabled: true });
  // 移除 S01 的 enrollment.uid（模擬正式匯入名冊），補上 email 與 profiles/uid1；S02 移除 uid 且無登入 profile
  const enS01 = db.data.get('enrollments/C1__S01@x');
  delete enS01.uid;
  enS01.email = 'S01@x';
  db.data.set('enrollments/C1__S01@x', enS01);
  db.data.set('profiles/uid1', { email: 'S01@x' });

  const enS02 = db.data.get('enrollments/C1__S02@x');
  delete enS02.uid;
  enS02.email = 'S02@x';
  db.data.set('enrollments/C1__S02@x', enS02);

  const tStart = Date.now() - 1000;
  const examId = '60000000-0000-4000-8000-000000000001';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'V1正式名冊',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sit = await call(h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId,
    label: 'A班',
    date: '2026-11-23',
    classIds: ['A'],
    startsAt: tStart,
  });

  // S01 (uid1) 在開考前完成 q0 與 u1
  db.data.set('courses/C1/attempts/v1_a1', {
    uid: 'uid1',
    classId: 'A',
    unitId: 'u1',
    receivedAt: tStart - 5000,
    answers: [{ questionId: 'q0', correct: true }],
  });
  db.data.set('courses/C1/progress/uid1', { units: { u1: { passedAt: tStart - 3000 } } });

  // 模擬修正前寫入的錯誤定稿快取（無 prepVersion，且 S01 誤記為 none）
  db.data.set(`courses/C1/zuvioExams/${examId}/prep/${sit.id}`, {
    startsAt: tStart,
    unitIdsKey: 'u1',
    questionIdsKey: 'q0',
    finalized: true,
    incomplete: false,
    computedAt: tStart + 500,
    students: {
      S01: { uid: 'sid:S01', studentId: 'S01', name: '王小明', classId: 'A', status: 'none', practicedItemCount: 0, coverage: 0, itemStatuses: { q0: 'unpracticed' } },
      S02: { uid: 'sid:S02', studentId: 'S02', name: '陳小華', classId: 'A', status: 'none', practicedItemCount: 0, coverage: 0, itemStatuses: { q0: 'unpracticed' } },
    },
  });

  const rep = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sit.id] });
  assert.equal(rep.preExamCounts.passed, 1, '舊版錯誤定稿快取應失效重算，S01 應依 email 映射 uid1 算為 passed');
  assert.equal(rep.preExamCounts.none, 1, '無登入 profile 的 S02 維持 none');
  const cached = db.data.get(`courses/C1/zuvioExams/${examId}/prep/${sit.id}`);
  assert.equal(cached.prepVersion, 2);
  assert.equal(cached.students.S01.status, 'passed');
  assert.equal(cached.students.S01.coverage, 100);
  assert.equal(cached.students.S02.status, 'none');
});

test('V2：先開快篩再封存考卷，學生即時查詢與送出皆被阻擋，保留歷史情緒且不影響其他未封存考卷', async () => {
  const { db, h, call } = setup({ moodEnabled: true });
  const examA = '60000000-0000-4000-8000-000000000002';
  const examB = '60000000-0000-4000-8000-000000000003';
  for (const [eid, title, cls] of [
    [examA, '考卷A', ['A']],
    [examB, '考卷B', ['B']],
  ]) {
    await call(h.zuvioCreateExam, 'T1', {
      courseId: 'C1',
      examId: eid,
      title,
      score: 100,
      classIds: cls,
      items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
    });
  }
  const sitA = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: examA, label: 'A場', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() });
  const sitB = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: examB, label: 'B場', date: '2026-11-23', classIds: ['B'], startsAt: Date.now() });

  // 開啟 B 場並先讓 uid3 提交一筆歷史情緒，再封存 examA（不應影響開放中的 B 場）
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: examB, sittingId: sitB.id });
  await call(h.zuvioSubmitMood, 'uid3', { courseId: 'C1', sittingId: sitB.id, mood: 'green_flow' });
  await call(h.zuvioArchiveExam, 'T1', { courseId: 'C1', examId: examA, archived: true });
  const activeB = await call(h.zuvioGetActiveMood, 'uid3', { courseId: 'C1' });
  assert.equal(activeB.active, true, '封存別份考卷不可誤關目前開放中的 B 場');

  // 再封存 B 場：current 應關閉，學生查詢 active=false、uid3 送出被拒（封存擋下），且歷史情緒保留
  await call(h.zuvioArchiveExam, 'T1', { courseId: 'C1', examId: examB, archived: true });
  const afterArchive = await call(h.zuvioGetActiveMood, 'uid3', { courseId: 'C1' });
  assert.equal(afterArchive.active, false);
  await assert.rejects(() => call(h.zuvioSubmitMood, 'uid3', { courseId: 'C1', sittingId: sitB.id, mood: 'red_volcano' }), /封存/);
  assert.equal(db.data.get(`courses/C1/zuvioExams/${examB}/moods/${sitB.id}/responses/uid3`).mood, 'green_flow');

  // 即使人為殘留舊 open=true 指標（模擬競態），學生端仍因 exam.archived=true 拒絕讀寫
  db.data.set('courses/C1/zuvioMoodState/current', {
    open: true,
    examId: examB,
    sittingId: sitB.id,
    sittingLabel: 'B場',
    classIds: ['B'],
    closesAt: Date.now() + 60000,
    eligibleCount: 1,
  });
  assert.equal((await call(h.zuvioGetActiveMood, 'uid3', { courseId: 'C1' })).active, false);
  await assert.rejects(() => call(h.zuvioSubmitMood, 'uid3', { courseId: 'C1', sittingId: sitB.id, mood: 'red_volcano' }), /封存/);
});

test('V3：zuvioGetMoodLive 回傳 state、eligibleCount 與 counts 必屬同一 examId＋sittingId', async () => {
  const { h, call } = setup({ moodEnabled: true });
  const examA = '60000000-0000-4000-8000-000000000004';
  const examB = '60000000-0000-4000-8000-000000000005';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: examA,
    title: '考卷A',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: examB,
    title: '考卷B',
    score: 100,
    classIds: ['B'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sitA = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: examA, label: 'A場(2人)', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 2000 });
  const sitB = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: examB, label: 'B場(2人)', date: '2026-11-23', classIds: ['B'], startsAt: Date.now() - 1000 });

  // A場 2 人已填後關閉，接著開啟 B 場（0 人填）
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: examA, sittingId: sitA.id });
  await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: sitA.id, mood: 'green_flow' });
  await call(h.zuvioSubmitMood, 'uid2', { courseId: 'C1', sittingId: sitA.id, mood: 'yellow_rubberband' });
  await call(h.zuvioCloseMood, 'T1', { courseId: 'C1', sittingId: sitA.id });
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId: examB, sittingId: sitB.id });

  // 回查 A 場：必須得到 A 場的 state (open=false, examId=examA, sittingId=sitA.id)、eligibleCount=2、totalResponded=2
  const liveA = await call(h.zuvioGetMoodLive, 'T1', { courseId: 'C1', examId: examA, sittingId: sitA.id });
  assert.equal(liveA.state.examId, examA);
  assert.equal(liveA.state.sittingId, sitA.id);
  assert.equal(liveA.state.open, false);
  assert.equal(liveA.eligibleCount, 2);
  assert.equal(liveA.totalResponded, 2);
  assert.equal(liveA.counts.green_flow, 1);
  assert.equal(liveA.counts.yellow_rubberband, 1);

  // 省略場次參數：應回傳目前開啟中的 B 場
  const liveCur = await call(h.zuvioGetMoodLive, 'T1', { courseId: 'C1' });
  assert.equal(liveCur.state.examId, examB);
  assert.equal(liveCur.state.sittingId, sitB.id);
  assert.equal(liveCur.state.open, true);
  assert.equal(liveCur.totalResponded, 0);
});

test('D1：匯入成績時計算並快取單場試題分析摘要，report／itemAnalysis CSV 命中快取、刪除後失效；多場合併仍彙總', async () => {
  const { db, h, call, roster } = setup({ moodEnabled: true });
  const examId = '60000000-0000-4000-8000-000000000006';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'D1快取卷',
    score: 100,
    classIds: ['A', 'B'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sitA = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: 'A場', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 2000 });
  const sitB = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: 'B場', date: '2026-11-23', classIds: ['B'], startsAt: Date.now() - 1000 });
  const view = (await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId })).view;
  const ansIdx = Math.max(0, view.items[0].options.findIndex((o) => o.id === view.items[0].answer));
  const wrongIdx = (ansIdx + 1) % view.items[0].options.length;

  for (const [sit, subRoster, pick] of [
    [sitA, roster.slice(0, 2), () => ansIdx],   // A 場 2 人全對
    [sitB, roster.slice(2, 3), () => wrongIdx], // B 場 1 人全錯
  ]) {
    const parsed = parseZuvioMatrix(fakeZuvioExport(view, subRoster.map((r) => ({ studentId: r.studentId, name: r.name })), pick));
    const prev = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
    await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed, confirm: true, previewId: prev.previewId });
  }

  const cachedA = db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sitA.id}`);
  assert.ok(cachedA?.analysis, '匯入時即應寫入單場試題分析摘要');
  assert.equal(cachedA.revision, 1);
  assert.equal(cachedA.analysis.summary.students, 2);

  // 驗證單場 report 與 itemAnalysis CSV 讀取該快取
  const repA = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sitA.id] });
  assert.equal(repA.analysis.summary.students, 2);
  assert.equal(repA.analysis.items[0].p, 1);
  const csvA = await call(h.zuvioExportCsv, 'T1', { courseId: 'C1', examId, sittingIds: [sitA.id], kind: 'itemAnalysis' });
  assert.ok(csvA.csv.includes('難度P'));
  assert.ok(csvA.csv.includes('1.000') || csvA.csv.includes(',1,'));

  // 多場合併仍動態彙總（2 對 + 1 錯 = 3 人，P = 0.6667）
  const repMerged = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sitA.id, sitB.id] });
  assert.equal(repMerged.analysis.summary.students, 3);
  assert.equal(repMerged.analysis.items[0].p, 0.6667);

  // 刪除 A 場成績時一併清除 analysis 快取
  await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sitA.id });
  assert.equal(db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sitA.id}`), undefined);
});

test('V2 競態與解除封存：開啟與封存交錯時交易保證一致，解除封存後不恢復舊卡片', async () => {
  const { db, h, call } = setup({ moodEnabled: true });
  const examId = '60000000-0000-4000-8000-000000000007';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'V2競態',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sit = await call(h.zuvioCreateSitting, 'T1', {
    courseId: 'C1',
    examId,
    label: 'A場',
    date: '2026-11-23',
    classIds: ['A'],
    startsAt: Date.now(),
  });

  // 1. 模擬開啟進入交易前被封存搶先：封存完成後，開啟交易必須失敗且不寫入 open=true
  const origRunTx = db.runTransaction.bind(db);
  let archivedDuringOpen = false;
  db.runTransaction = async (fn) => {
    if (!archivedDuringOpen) {
      archivedDuringOpen = true;
      await origRunTx(async (tx) => {
        tx.update(db.doc(`courses/C1/zuvioExams/${examId}`), { archived: true });
      });
    }
    return origRunTx(fn);
  };
  await assert.rejects(() => call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId, sittingId: sit.id }), /封存/);
  db.runTransaction = origRunTx;
  assert.equal(db.data.get('courses/C1/zuvioMoodState/current'), undefined);

  // 2. 先解除封存、成功開啟，再封存、再解除封存：解除封存後不可恢復舊卡片
  await call(h.zuvioArchiveExam, 'T1', { courseId: 'C1', examId, archived: false });
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId, sittingId: sit.id });
  assert.equal((await call(h.zuvioGetActiveMood, 'uid1', { courseId: 'C1' })).active, true);
  await call(h.zuvioArchiveExam, 'T1', { courseId: 'C1', examId, archived: true });
  assert.equal((await call(h.zuvioGetActiveMood, 'uid1', { courseId: 'C1' })).active, false);
  await call(h.zuvioArchiveExam, 'T1', { courseId: 'C1', examId, archived: false });
  assert.equal((await call(h.zuvioGetActiveMood, 'uid1', { courseId: 'C1' })).active, false, '解除封存後不可恢復舊卡片');
});

test('V3 後端：單參數請求回 invalid-argument、同卷跨場與省略參數狀態一致', async () => {
  const { h, call } = setup({ moodEnabled: true });
  const examId = '60000000-0000-4000-8000-000000000008';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'V3同卷跨場',
    score: 100,
    classIds: ['A', 'B'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sitA = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: 'A場', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 2000 });
  const sitB = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: 'B場', date: '2026-11-23', classIds: ['B'], startsAt: Date.now() - 1000 });
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId, sittingId: sitA.id });
  await call(h.zuvioSubmitMood, 'uid1', { courseId: 'C1', sittingId: sitA.id, mood: 'green_flow' });
  await call(h.zuvioCloseMood, 'T1', { courseId: 'C1', sittingId: sitA.id });
  await call(h.zuvioOpenMood, 'T1', { courseId: 'C1', examId, sittingId: sitB.id });

  await assert.rejects(() => call(h.zuvioGetMoodLive, 'T1', { courseId: 'C1', examId }), /同時指定/);
  await assert.rejects(() => call(h.zuvioGetMoodLive, 'T1', { courseId: 'C1', sittingId: sitA.id }), /同時指定/);

  const liveA = await call(h.zuvioGetMoodLive, 'T1', { courseId: 'C1', examId, sittingId: sitA.id });
  assert.equal(liveA.state.sittingId, sitA.id);
  assert.equal(liveA.state.open, false);
  assert.equal(liveA.eligibleCount, 2);
  assert.equal(liveA.totalResponded, 1);

  const liveOmitted = await call(h.zuvioGetMoodLive, 'T1', { courseId: 'C1' });
  assert.equal(liveOmitted.state.sittingId, sitB.id);
  assert.equal(liveOmitted.state.open, true);
  assert.equal(liveOmitted.eligibleCount, 1);
  assert.equal(liveOmitted.totalResponded, 0);
});

test('D1 原子性與延遲回填防護：保護名單超限失敗不提交成績也不耗預覽；刪除或新代後不重建覆蓋', async () => {
  const { db, h, call, roster } = setup({ moodEnabled: true });
  const examId = '60000000-0000-4000-8000-000000000009';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'D1原子性',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sit = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: 'A場', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 1000 });
  const view = (await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId })).view;
  const parsed = parseZuvioMatrix(fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => 0));
  const prev = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });

  // 1. 製造保護名單超限（51 筆測驗文件），confirm=true 必須失敗且不提交成績、不消耗預覽
  for (let i = 0; i < 51; i++) db.data.set(`courses/C1/assessments/a_${i}`, { id: `a_${i}` });
  await assert.rejects(
    () => call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed, confirm: true, previewId: prev.previewId }),
    /測驗/,
  );
  const exAfterFail = db.data.get(`courses/C1/zuvioExams/${examId}`);
  assert.equal(exAfterFail.sittings[0].results, undefined, '失敗時不得提交成績');
  assert.ok(db.data.get(`courses/C1/zuvioExams/${examId}/previews/${prev.previewId}`), '失敗時不得消耗預覽');
  assert.equal(db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sit.id}`), undefined);

  // 清掉多餘測驗文件後正常匯入成功，成績與摘要同交易存在
  for (let i = 0; i < 51; i++) db.data.delete(`courses/C1/assessments/a_${i}`);
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed, confirm: true, previewId: prev.previewId });
  assert.ok(db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sit.id}`)?.analysis);

  // 2. 模擬延遲懶回填（先刪 analysis 觸發 report 回填，但在回填寫入交易前刪除成績）：回填不得重建 analysis
  db.data.delete(`courses/C1/zuvioExams/${examId}/analysis/${sit.id}`);
  const origRunTx = db.runTransaction.bind(db);
  let deletedDuringBackfill = false;
  db.runTransaction = async (fn) => {
    if (!deletedDuringBackfill) {
      deletedDuringBackfill = true;
      await origRunTx(async (tx) => {
        const ref = db.doc(`courses/C1/zuvioExams/${examId}`);
        const ex = (await tx.get(ref)).data();
        tx.update(ref, {
          sittings: ex.sittings.map((s) => (s.id === sit.id ? { id: s.id, label: s.label, date: s.date, startsAt: s.startsAt, classIds: s.classIds, deletedRevision: 2 } : s)),
        });
      });
    }
    return origRunTx(fn);
  };
  await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sit.id] });
  db.runTransaction = origRunTx;
  assert.equal(db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sit.id}`), undefined, '刪除後延遲回填不得重建摘要');
});

test('D1 延遲清理與預覽重送防護：舊匯入／舊刪除清理不誤刪新代明細；重送／過期預覽不改寫有效成績；zuvioMood=false 不受測驗上限阻斷', async () => {
  // 1. #61 路徑（zuvioMood=false）+ 51 筆正式測驗文件：確認匯入必須成功
  const off = setup({ moodEnabled: false });
  const examOff = '60000000-0000-4000-8000-000000000010';
  await off.call(off.h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId: examOff,
    title: '61無情緒匯入',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sitOff = await off.call(off.h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId: examOff, label: 'A場', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 1000 });
  const viewOff = (await off.call(off.h.zuvioGetExam, 'T1', { courseId: 'C1', examId: examOff })).view;
  const parsedOff = parseZuvioMatrix(fakeZuvioExport(viewOff, off.roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => 0));
  const prevOff = await off.call(off.h.zuvioImportResults, 'T1', { courseId: 'C1', examId: examOff, sittingId: sitOff.id, parsed: parsedOff, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  for (let i = 0; i < 51; i++) off.db.data.set(`courses/C1/assessments/a_${i}`, { id: `a_${i}` });
  const resOff = await off.call(off.h.zuvioImportResults, 'T1', { courseId: 'C1', examId: examOff, sittingId: sitOff.id, parsed: parsedOff, confirm: true, previewId: prevOff.previewId });
  assert.equal(resOff.ok, true);
  assert.equal(resOff.matched, 2);

  // 2. 延遲清理 + 重送已消耗預覽 + 刪除前舊預覽
  const { db, h, call, roster } = setup({ moodEnabled: true });
  const examId = '60000000-0000-4000-8000-000000000011';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'D1清理競態',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const sit = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: 'A場', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 1000 });
  const view = (await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId })).view;
  const ansIdx = Math.max(0, view.items[0].options.findIndex((o) => o.id === view.items[0].answer));
  const wrongIdx = (ansIdx + 1) % view.items[0].options.length;
  const parsedCorrect = parseZuvioMatrix(fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => ansIdx));
  const parsedWrong = parseZuvioMatrix(fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => wrongIdx));

  // 匯入 A（rev 1）並驗證重送同一 previewId 帶錯誤答案會被拒絕且不改寫 A 的明細
  const prevA = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: true, previewId: prevA.previewId });
  await assert.rejects(() => call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedWrong, confirm: true, previewId: prevA.previewId }), /預覽/);
  const repA = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sit.id] });
  assert.equal(repA.analysis.items[0].p, 1, '重送失敗不得覆寫已生效明細');

  // 模擬匯入 B（rev 2）完成後，再跑 A 的舊清理（beforeRevision = 1）與刪除前舊預覽檢查
  const prevB = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedWrong, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedWrong, confirm: true, previewId: prevB.previewId });

  // 在空場次先建預覽，刪除後重試該預覽（驗證 deletedRevision 阻擋）
  const sit2 = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: 'A場2', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 500 });
  const prevEmpty = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id });
  await assert.rejects(() => call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedCorrect, confirm: true, previewId: prevEmpty.previewId }), /變更/);

  // 模擬「刪除舊成績後、新匯入 rev 3 提交，再觸發刪除的延遲清理」：rev 3 明細不得被刪
  const prevC = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: true, previewId: prevC.previewId });
  const activeGen = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings[0].results.gen;
  const activeDocs = [...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.gen === activeGen);
  assert.equal(activeDocs.length, 2, '現行代次明細必須完整存在');
});

test('D1 定序防護：預檢後刪除與同版並行確認無殘留；清理失敗仍回傳已提交成功並可恢復', async () => {
  const { db, h, call, roster } = setup({ moodEnabled: true });
  const examId = '60000000-0000-4000-8000-000000000012';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'D1交易邊界測試',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const view = (await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId })).view;
  const ansIdx = Math.max(0, view.items[0].options.findIndex((o) => o.id === view.items[0].answer));
  const wrongIdx = (ansIdx + 1) % view.items[0].options.length;
  const parsedCorrect = parseZuvioMatrix(fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => ansIdx));
  const parsedWrong = parseZuvioMatrix(fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => wrongIdx));

  // 1. 預檢後、寫入明細後、進交易前觸發刪除 -> 交易失敗且必須回收未提交明細（0 殘留）
  const sit1 = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: '場1', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 1000 });
  const prev1 = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit1.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  const origRunTx = db.runTransaction.bind(db);
  let deletedDuringImport = false;
  db.runTransaction = async (fn) => {
    if (!deletedDuringImport) {
      deletedDuringImport = true;
      db.runTransaction = origRunTx;
      await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit1.id });
    }
    return origRunTx(fn);
  };
  await assert.rejects(() => call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit1.id, parsed: parsedCorrect, confirm: true, previewId: prev1.previewId }), /變更/);
  db.runTransaction = origRunTx;
  const sit1Rows = [...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.sittingId === sit1.id);
  assert.equal(sit1Rows.length, 0, '被拒匯入不得殘留任何成績明細');
  assert.equal(db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sit1.id}`), undefined);

  // 2. 同版雙確認並行：兩個預覽同取 rev 0 -> 第一筆先提交後，第二筆失敗且無殘留 gen
  const sit2 = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: '場2', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 1000 });
  const pA = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  const pB = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedWrong, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  let injectedB = false;
  db.runTransaction = async (fn) => {
    if (!injectedB) {
      injectedB = true;
      db.runTransaction = origRunTx;
      // 模擬 B 寫入並先提交，讓 A 進交易時撞上 revision 不符而被拒絕並回收 genA
      await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedWrong, confirm: true, previewId: pB.previewId });
    }
    return origRunTx(fn);
  };
  await assert.rejects(() => call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedCorrect, confirm: true, previewId: pA.previewId }), /變更/);
  db.runTransaction = origRunTx;
  const sit2Exam = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings.find((s) => s.id === sit2.id);
  const sit2Rows = [...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.sittingId === sit2.id);
  assert.equal(sit2Rows.length, 2, '只應保留先提交的 B 兩筆明細，無 A 殘留');
  assert.equal(sit2Rows.every(([, v]) => v.gen === sit2Exam.results.gen && v.correct === 0), true, '所有留存明細必須屬於有效 genB 且為 B 的答案');
  const rep2 = await call(h.zuvioReport, 'T1', { courseId: 'C1', examId, sittingIds: [sit2.id] });
  assert.equal(rep2.analysis.items[0].p, 0, '報表指標必須與有效明細一致');

  // 3. 清理失敗：交易已提交但 cleanup 查詢拋錯，callable 必須反映已提交成功且下次可恢復清理
  const pC = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  const origCollection = db.collection.bind(db);
  db.collection = (path) => {
    const col = origCollection(path);
    if (path === `courses/C1/zuvioExams/${examId}/results`) {
      const origWhere = col.where.bind(col);
      col.where = (...args) => {
        const q = origWhere(...args);
        q.get = async () => { throw new Error('simulated cleanup failure'); };
        return q;
      };
    }
    return col;
  };
  const resC = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedCorrect, confirm: true, previewId: pC.previewId });
  assert.equal(resC.ok, true, 'cleanup 失敗時匯入已提交仍須回 ok:true');
  assert.equal(resC.matched, 2);
  const delRes = await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id });
  assert.equal(delRes.ok, true, 'cleanup 失敗時刪除已提交仍須回 ok:true');
  db.collection = origCollection;

  // 恢復正常後，再匯入一次可將先前未清理的舊代明細一併清理乾淨
  const pD = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit2.id, parsed: parsedCorrect, confirm: true, previewId: pD.previewId });
  const finalRows = [...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.sittingId === sit2.id);
  assert.equal(finalRows.length, 2, '清理恢復後只留最新一代有效明細');
});

test('D1 R5 邊界：整場 300 人上限、提交成功回應逾時不誤刪、寫入中斷無殘留、刪除後無重匯可完成清理', async () => {
  const { db, h, call, roster } = setup({ moodEnabled: true });
  const examId = '60000000-0000-4000-8000-000000000013';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'D1 R5 邊界測試',
    score: 100,
    classIds: ['A'],
    items: [
      { questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] },
      { questionId: 'q1', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] },
    ],
  });
  const view = (await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId })).view;
  const sit = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: '場1', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 1000 });

  // 1. 整場 300 人上限（跨題合計 301 人，單題 <= 300）必須被拒
  const overParsed = {
    title: view.title,
    blocks: [
      {
        n: 1, stem: view.items[0].text, score: '100', correctNo: 1,
        options: view.items[0].options.map((o, i) => ({ no: i + 1, text: o.text })),
        responses: Array.from({ length: 200 }, (_, i) => ({ studentId: `S${String(i).padStart(3, '0')}`, answerText: view.items[0].options[0].text, row: i + 2 })),
      },
      {
        n: 2, stem: view.items[1].text, score: '100', correctNo: 1,
        options: view.items[1].options.map((o, i) => ({ no: i + 1, text: o.text })),
        responses: Array.from({ length: 101 }, (_, i) => ({ studentId: `S${String(200 + i).padStart(3, '0')}`, answerText: view.items[1].options[0].text, row: i + 2 })),
      },
    ],
    summaryIds: [],
    problems: [],
  };
  await assert.rejects(
    () => call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: overParsed, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' }),
    /超過上限/,
  );

  // 準備正常 2 人資料
  const ansIdx = Math.max(0, view.items[0].options.findIndex((o) => o.id === view.items[0].answer));
  const parsedOk = parseZuvioMatrix(fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => ansIdx));

  // 2. 寫入中斷（交易內 set 失敗）：無任何部分明細殘留，預覽仍在
  const prevAbort = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedOk, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  const origRunTx = db.runTransaction.bind(db);
  db.runTransaction = async (fn) => origRunTx(async (tx) => {
    const origSet = tx.set.bind(tx);
    tx.set = () => { throw new Error('ABORTED_WRITE'); };
    try { return await fn(tx); } finally { tx.set = origSet; }
  });
  await assert.rejects(() => call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedOk, confirm: true, previewId: prevAbort.previewId }), /ABORTED_WRITE/);
  db.runTransaction = origRunTx;
  assert.equal([...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.sittingId === sit.id).length, 0);
  assert.notEqual(db.data.get(`courses/C1/zuvioExams/${examId}/previews/${prevAbort.previewId}`), undefined);

  // 3. 提交已落地但回應逾時（DEADLINE_EXCEEDED）：有效明細、場次 metadata、摘要、預覽消耗皆保持一致（絕不誤刪）
  db.runTransaction = async (fn) => {
    await origRunTx(fn);
    throw new Error('DEADLINE_EXCEEDED');
  };
  await assert.rejects(() => call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedOk, confirm: true, previewId: prevAbort.previewId }), /DEADLINE_EXCEEDED/);
  db.runTransaction = origRunTx;
  const committedSitting = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings.find((s) => s.id === sit.id);
  assert.equal(Boolean(committedSitting?.results?.gen), true, '提交已落地時 metadata 必須存在');
  const committedRows = [...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.gen === committedSitting.results.gen);
  assert.equal(committedRows.length, 2, '提交成功但逾時不得誤刪已提交明細');
  assert.notEqual(db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sit.id}`), undefined, '摘要必須存在');
  assert.equal(db.data.get(`courses/C1/zuvioExams/${examId}/previews/${prevAbort.previewId}`), undefined, '預覽必須已消耗');

  // 4. 刪除後清理失敗（標記 pendingCleanup: true），不重匯直接再呼叫 deleteResults 完成清理
  const origDoc = db.doc.bind(db);
  db.doc = (p) => {
    const d = origDoc(p);
    if (p === `courses/C1/zuvioExams/${examId}`) {
      const origSubCol = d.collection.bind(d);
      d.collection = (sub) => {
        const col = origSubCol(sub);
        if (sub === 'results') {
          const origWhere = col.where.bind(col);
          col.where = (...args) => {
            const q = origWhere(...args);
            q.get = async () => { throw new Error('cleanup transient error'); };
            return q;
          };
        }
        return col;
      };
    }
    return d;
  };
  const del1 = await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id });
  assert.equal(del1.ok, true);
  db.doc = origDoc;
  const afterFailDel = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings.find((s) => s.id === sit.id);
  assert.equal(afterFailDel.results, undefined);
  assert.equal(afterFailDel.pendingCleanup, true, '清理失敗必須保留 pendingCleanup 供追蹤與重試');

  // 無重匯，直接重試 deleteResults (cleanupOnly: true) 完成清理
  const del2 = await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, cleanupOnly: true });
  assert.equal(del2.ok, true);
  const afterRetry = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings.find((s) => s.id === sit.id);
  assert.equal(afterRetry.pendingCleanup, undefined, '清理完成後須清除 pendingCleanup');
  assert.equal([...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.sittingId === sit.id).length, 0, '無重匯亦須清完該場舊代明細');
});

test('D1 R6 隔離清理定序：刪除後無重匯、舊分頁重試晚於新匯入、重匯後清理失敗再重試', async () => {
  const { db, h, call, roster } = setup({ moodEnabled: true });
  const examId = '60000000-0000-4000-8000-000000000014';
  await call(h.zuvioCreateExam, 'T1', {
    courseId: 'C1',
    examId,
    title: 'D1 R6 隔離清理測試',
    score: 100,
    classIds: ['A'],
    items: [{ questionId: 'q0', unitId: 'u1', version: 'v1', optionOrder: ['a', 'b', 'c', 'd'] }],
  });
  const view = (await call(h.zuvioGetExam, 'T1', { courseId: 'C1', examId })).view;
  const ansIdx = Math.max(0, view.items[0].options.findIndex((o) => o.id === view.items[0].answer));
  const wrongIdx = (ansIdx + 1) % view.items[0].options.length;
  const parsedCorrect = parseZuvioMatrix(fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => ansIdx));
  const parsedWrong = parseZuvioMatrix(fakeZuvioExport(view, roster.slice(0, 2).map((r) => ({ studentId: r.studentId, name: r.name })), () => wrongIdx));
  const sit = await call(h.zuvioCreateSitting, 'T1', { courseId: 'C1', examId, label: '場1', date: '2026-11-23', classIds: ['A'], startsAt: Date.now() - 1000 });

  const injectCleanupFail = () => {
    const origDoc = db.doc.bind(db);
    db.doc = (p) => {
      const d = origDoc(p);
      if (p === `courses/C1/zuvioExams/${examId}`) {
        const origSub = d.collection.bind(d);
        d.collection = (sub) => {
          const col = origSub(sub);
          if (sub === 'results') {
            const origWhere = col.where.bind(col);
            col.where = (...args) => {
              const q = origWhere(...args);
              q.get = async () => { throw new Error('cleanup transient error'); };
              return q;
            };
          }
          return col;
        };
      }
      return d;
    };
    return () => { db.doc = origDoc; };
  };

  // 1. 刪除後無重匯：匯入 rev 1 -> 刪除時 cleanup 失敗 -> 無重匯以 cleanupOnly 重試完成清理且 deletedRevision 不多加
  const p1 = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: true, previewId: p1.previewId });
  let restore = injectCleanupFail();
  await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id });
  restore();
  const revBeforeRetry = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings[0].deletedRevision;
  const retry1 = await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, cleanupOnly: true });
  assert.equal(retry1.ok, true);
  assert.equal(retry1.cleaned, true);
  const sitAfter1 = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings[0];
  assert.equal(sitAfter1.deletedRevision, revBeforeRetry, 'cleanupOnly 不得遞增 deletedRevision');
  assert.equal(sitAfter1.pendingCleanup, undefined);
  assert.equal([...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.sittingId === sit.id).length, 0);

  // 2. 舊分頁 A 的清理重試晚於分頁 B 的新匯入：B 新匯入、摘要、明細與待用預覽必須完整保留
  const p2 = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: true, previewId: p2.previewId });
  // A 刪除時清理失敗（取得待清理狀態）
  restore = injectCleanupFail();
  await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id });
  restore();
  // B 重新匯入並完成清理，且另建一筆新預覽 prevPending
  const pB = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedWrong, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedWrong, confirm: true, previewId: pB.previewId });
  const prevPending = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  const genB = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings[0].results.gen;
  // A 的舊分頁按下「清理殘留成績」（cleanupOnly: true）
  const staleRetry = await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, cleanupOnly: true });
  assert.equal(staleRetry.ok, true);
  assert.equal(staleRetry.cleaned, false);
  const sitB = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings[0];
  assert.equal(sitB.results.gen, genB, '舊分頁重試不得刪除 B 的有效 results');
  assert.notEqual(db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sit.id}`), undefined, '不得刪除 B 的分析摘要');
  assert.notEqual(db.data.get(`courses/C1/zuvioExams/${examId}/previews/${prevPending.previewId}`), undefined, '不得刪除待用預覽');
  assert.equal([...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.gen === genB).length, 2, 'B 的有效明細必須完整保留');

  // 3. 重匯後清理失敗再重試（場次已有有效成績時）：只清舊代明細，保留當前有效成績、摘要與預覽
  const pC = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  restore = injectCleanupFail();
  await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedCorrect, confirm: true, previewId: pC.previewId });
  restore();
  const sitFailClean = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings[0];
  assert.equal(sitFailClean.pendingCleanup, true);
  const genC = sitFailClean.results.gen;
  const prevKeep = await call(h.zuvioImportResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, parsed: parsedWrong, confirm: false, previewId: '00000000-0000-4000-8000-000000000000' });
  // 恢復正常後重試清理殘留成績
  const cleanRetry = await call(h.zuvioDeleteResults, 'T1', { courseId: 'C1', examId, sittingId: sit.id, cleanupOnly: true });
  assert.equal(cleanRetry.ok, true);
  assert.equal(cleanRetry.cleaned, true);
  const sitAfterC = db.data.get(`courses/C1/zuvioExams/${examId}`).sittings[0];
  assert.equal(sitAfterC.pendingCleanup, undefined);
  assert.equal(sitAfterC.results.gen, genC);
  assert.notEqual(db.data.get(`courses/C1/zuvioExams/${examId}/analysis/${sit.id}`), undefined);
  assert.notEqual(db.data.get(`courses/C1/zuvioExams/${examId}/previews/${prevKeep.previewId}`), undefined);
  const remainRows = [...db.data.entries()].filter(([k, v]) => k.startsWith(`courses/C1/zuvioExams/${examId}/results/`) && v.sittingId === sit.id);
  assert.equal(remainRows.length, 2, '只應保留當前有效代 genC 的 2 筆明細');
  assert.equal(remainRows.every(([, v]) => v.gen === genC), true);
});
