const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClassroomHandlers } = require('../lib/functions/src/classroom.js');
const MI_CLASSROOM_COURSE = '115-1-MI-國考精準對焦';
const { interactions } = require('../../docs/unify-1.9.0/mi-interactions.json');
function setup() {
  let clock = 100000;
  const docs = new Map([[`courses/${MI_CLASSROOM_COURSE}/classroomConfig/interactions`, { interactions }]]);
  let queue = Promise.resolve();
  const snap = (path) => ({
    data: () => (docs.has(path) ? structuredClone(docs.get(path)) : undefined),
  });
  const collection = (path, filter) => ({
    where: (field, op, value) =>
      collection(path, (row) => (!filter || filter(row)) && row[field] === value),
    doc: (id) => ref(path + '/' + id),
    orderBy: () => ({
      limit: () => ({
        get: async () => ({
          docs: [...docs.keys()]
            .filter(
              (k) =>
                k.startsWith(path + '/') &&
                !k.slice(path.length + 1).includes('/') &&
                (!filter || filter(docs.get(k))),
            )
            .map((k) => snap(k))
            .sort((a, b) => b.data().openedAt - a.data().openedAt)
            .slice(0, 100),
        }),
      }),
    }),
    get: async () => ({
      docs: [...docs.keys()]
        .filter(
          (k) =>
            k.startsWith(path + '/') &&
            !k.slice(path.length + 1).includes('/') &&
            (!filter || filter(docs.get(k))),
        )
        .map((k) => snap(k)),
    }),
  });
  const ref = (path) => ({
    path,
    get: async () => snap(path),
    collection: (name) => collection(path + '/' + name),
  });
  const db = {
    doc: ref,
    collection,
    runTransaction: async (fn) => {
      let release;
      const prior = queue;
      queue = new Promise((r) => (release = r));
      await prior;
      const writes = [];
      try {
        const out = await fn({
          get: async (r) => {
            assert.equal(writes.length, 0, 'all reads before writes');
            return snap(r.path);
          },
          set: (r, v) => writes.push([r.path, structuredClone(v)]),
        });
        writes.forEach(([k, v]) => docs.set(k, v));
        return out;
      } finally {
        release();
      }
    },
  };
  const access = async (req, id, teacher) => {
    if (!req.auth) throw Error('unauthenticated');
    if (teacher && (!req.auth.teacher || req.auth.uid !== 'owner')) throw Error('permission');
    if (id !== MI_CLASSROOM_COURSE) throw Error('permission');
    return { p: req.auth, c: { features: { classroomInteraction: true }, classIds: ['A', 'B'], rosterVersion: 2 } };
  };
  const h = createClassroomHandlers(db, access, { region: 'asia-east1' }, () => clock);
  const call = (name, data = {}, auth = { uid: 'owner', teacher: true }) =>
    h[name].run({ data: { courseId: MI_CLASSROOM_COURSE, ...data }, auth });
  const student = (i) => ({ uid: 's' + i, classId: 'A', name: '學生' + i, studentId: 'ID' + i });
  return {
    docs,
    call,
    student,
    setClock: (value) => {
      clock = value;
    },
  };
}
test('教師限定操作；學生跨班／跨課程／未登入被拒絕，未公布不含統計或私有答案', async () => {
  const { call, student } = setup();
  const open = { action: 'open', slideId: 'c1-toxin', classIds: ['A'] };
  for (const auth of [null, student(1), { uid: 'other', teacher: true }])
    await assert.rejects(call('controlClassroomInteraction', open, auth));
  await assert.rejects(call('controlClassroomInteraction', { ...open, courseId: 'AP2' }));
  await assert.rejects(call('controlClassroomInteraction', { ...open, classIds: ['C'] }));
  const { round } = await call('controlClassroomInteraction', open);
  const a = await call('getClassroomInteraction', {}, student(1));
  assert.equal(a.round.id, round.id);
  for (const key of ['counts', 'texts', 'total', 'notes', 'html', 'answer', 'results'])
    assert(!JSON.stringify(a).includes('"' + key + '"'));
  assert.equal(
    (await call('getClassroomInteraction', {}, { ...student(2), classId: 'B' })).round,
    null,
  );
  await assert.rejects(
    call(
      'submitClassroomInteraction',
      { roundId: round.id, answers: { pick: '內毒素' } },
      { ...student(2), classId: 'B' },
    ),
  );
  for (const name of ['classroomInteractionReport', 'classroomInteractionRecords'])
    await assert.rejects(call(name, { roundId: round.id }, student(1)));
  await assert.rejects(call('getClassroomInteraction', {}, null));
});
test('54人併發提交／重送只計一份、答案鎖定、關閉阻止新提交，兩輪與私人紀錄分開', async () => {
  const { call, student, docs } = setup();
  const { round } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-toxin',
    classIds: ['A'],
  });
  await assert.rejects(
    call('controlClassroomInteraction', { action: 'open', slideId: 'c2-predict', classIds: ['A'] }),
  );
  await assert.rejects(
    call(
      'submitClassroomInteraction',
      { roundId: round.id, answers: { pick: '內毒素', reason: '自由文字' } },
      student(99),
    ),
  );
  assert.equal((await call('classroomInteractionReport')).round.total, 0);
  const submit = (i) =>
    call(
      'submitClassroomInteraction',
      {
        roundId: round.id,
        answers: { pick: i % 2 ? '內毒素' : '外毒素', reason: round.fields[1].options[0] },
      },
      student(i),
    );
  await Promise.all(Array.from({ length: 54 }, (_, i) => Promise.all([submit(i), submit(i)])));
  const locked = await call(
    'submitClassroomInteraction',
    { roundId: round.id, answers: { pick: '內毒素', reason: round.fields[1].options[1] } },
    student(0),
  );
  assert.equal(locked.answers.pick, '外毒素');
  const result = await call('classroomInteractionReport');
  assert.equal(result.round.total, 54);
  assert.deepEqual(result.round.counts.pick, [27, 27]);
  assert(!('texts' in result.round));
  assert.deepEqual(result.round.counts.reason, [54, 0, 0, 0]);
  assert(!JSON.stringify(result).includes('學生0'));
  assert(!JSON.stringify(result).includes('s0'));
  await assert.rejects(call('controlClassroomInteraction', { action: 'hide', roundId: round.id }));
  await call('controlClassroomInteraction', { action: 'close', roundId: round.id });
  await assert.rejects(submit(60));
  assert.equal((await submit(0)).submitted, true);
  assert.equal((await call('getClassroomInteraction', {}, student(0))).results.total, 54);
  const rows = (await call('classroomInteractionRecords', { roundId: round.id })).rows;
  assert.equal(rows.length, 54);
  assert(rows.some((r) => r.name === '學生0'));
  const next = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-toxin',
    classIds: ['A'],
  });
  assert.equal(next.round.number, 2);
  assert.equal(next.round.total, 0);
  assert.equal((await call('getClassroomInteraction', {}, student(0))).submitted, false);
  assert.equal((await call('classroomInteractionReport', { roundId: round.id })).round.total, 54);
  assert(
    [...docs.keys()].every((p) => p.includes('/classroom')),
    'no exam/progress writes',
  );
});
test('收票與提交競爭序列化；無效作答不計票', async () => {
  const { call, student } = setup();
  const { round } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
  });
  await assert.rejects(
    call(
      'submitClassroomInteraction',
      { roundId: round.id, answers: { pick: '假選項' } },
      student(1),
    ),
  );
  await assert.rejects(call('controlClassroomInteraction', { action: 'bogus', roundId: round.id }));
  await Promise.all([
    call('controlClassroomInteraction', { action: 'close', roundId: round.id }),
    assert.rejects(
      call(
        'submitClassroomInteraction',
        { roundId: round.id, answers: { pick: round.fields[0].options[0] } },
        student(1),
      ),
    ),
  ]);
  assert.equal((await call('classroomInteractionReport')).round.total, 0);
});

test('伺服器倒數／3秒寬限／過期拒絕與舊場次不限時，重送不改票數', async () => {
  const { call, student, setClock } = setup();
  const { round, serverNow } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
    durationSeconds: 30,
  });
  assert.equal(round.deadlineAt, 130000);
  assert.equal(serverNow, 100000);
  const send = (i) =>
    call(
      'submitClassroomInteraction',
      { roundId: round.id, answers: { pick: round.fields[0].options[0] } },
      student(i),
    );
  setClock(129999);
  await send(1);
  setClock(130001);
  await send(2);
  setClock(133000);
  await send(3);
  setClock(133001);
  await assert.rejects(send(4), /時間到，作答已截止/);
  await send(1);
  assert.equal((await call('classroomInteractionReport')).round.total, 3);
  await call('controlClassroomInteraction', { action: 'close', roundId: round.id });
  const legacy = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
  });
  assert.equal('deadlineAt' in legacy.round, false);
  setClock(9999999);
  await call(
    'submitClassroomInteraction',
    { roundId: legacy.round.id, answers: { pick: legacy.round.fields[0].options[0] } },
    student(5),
  );
});
test('加時教師限定、目前倒數開放輪限定；過期可恢復完整30秒', async () => {
  const { call, student, setClock } = setup();
  const { round } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
    durationSeconds: 60,
  });
  const extend = { action: 'extend', roundId: round.id };
  await assert.rejects(call('controlClassroomInteraction', extend, student(1)));
  assert.equal((await call('controlClassroomInteraction', extend)).round.deadlineAt, 190000);
  setClock(200000);
  assert.equal((await call('controlClassroomInteraction', extend)).round.deadlineAt, 230000);
  await call('controlClassroomInteraction', { action: 'close', roundId: round.id });
  await assert.rejects(call('controlClassroomInteraction', extend));
  const unlimited = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
    durationSeconds: 0,
  });
  await assert.rejects(
    call('controlClassroomInteraction', { action: 'extend', roundId: unlimited.round.id }),
  );
});
test('跨頁確認交易同時關舊開新；過期確認與競爭不會關掉他人新輪', async () => {
  const { call, docs } = setup();
  docs.set('enrollments/member1', { courseId: MI_CLASSROOM_COURSE, classId: 'A', enabled: true });
  docs.set('enrollments/member2', { courseId: MI_CLASSROOM_COURSE, classId: 'B', enabled: true });
  docs.set('enrollments/disabled', { courseId: MI_CLASSROOM_COURSE, classId: 'A', enabled: false });
  docs.set('enrollments/other', { courseId: 'AP2', classId: 'A', enabled: true });
  const { round } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
  });
  assert.equal(round.eligibleCount, 1);
  const request = {
    action: 'open',
    slideId: 'c1-toxin',
    classIds: ['A', 'B'],
    replaceRoundId: round.id,
    durationSeconds: 60,
  };
  const results = await Promise.allSettled([
    call('controlClassroomInteraction', request),
    call('controlClassroomInteraction', request),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const next = results.find((r) => r.status === 'fulfilled').value.round;
  assert.equal(next.eligibleCount, 2);
  const all = [...docs.values()].filter((r) => r.status);
  assert.equal(all.filter((r) => r.status === 'open').length, 1);
  assert.equal(all.find((r) => r.id === round.id).status, 'closed');
  const report = await call('classroomInteractionReport', { roundId: round.id });
  assert.equal(report.round.id, round.id);
  assert.equal(report.activeRound.id, next.id);
  assert.equal(
    (await call('classroomInteractionReport', { slideId: 'c1-predict' })).round.id,
    round.id,
  );
  await assert.rejects(
    call('controlClassroomInteraction', { ...request, replaceRoundId: 'stale' }),
  );
  await call('controlClassroomInteraction', { action: 'close', roundId: next.id });
  await assert.rejects(call('controlClassroomInteraction', request));
});
test('舊場次本頁查詢相容，無有效倒數不能開放且不寫資料', async () => {
  const { call, docs } = setup();
  await assert.rejects(
    call('controlClassroomInteraction', {
      action: 'open',
      slideId: 'c1-predict',
      classIds: ['A'],
      durationSeconds: -1,
    }),
  );
  assert.equal(docs.size, 1); // pre-seeded definitions; invalid request adds no records
  const { round } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
  });
  const path = `courses/${MI_CLASSROOM_COURSE}/classroomState/current`;
  const current = docs.get(path);
  delete current.latestBySlide;
  docs.set(path, current);
  assert.equal(
    (await call('classroomInteractionReport', { slideId: 'c1-predict' })).round.id,
    round.id,
  );
  assert.equal(
    (await call('classroomInteractionReport', { slideId: 'no-interaction' })).round,
    null,
  );
});
