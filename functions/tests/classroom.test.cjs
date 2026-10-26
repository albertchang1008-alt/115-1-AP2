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
      collection(
        path,
        (row) =>
          (!filter || filter(row)) &&
          (op === 'array-contains'
            ? Array.isArray(row?.[field]) && row[field].includes(value)
            : row?.[field] === value),
      ),
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

test('公佈答案（reveal）：公佈前不洩漏答案、open狀態拒絕reveal、快照不可變與冪等、choice/order對錯判定、跨班與跨生隔離、歷史頁只列已公佈', async () => {
  const { call, student, docs, setClock } = setup();
  const c1Predict = interactions.find((d) => d.slideId === 'c1-predict');
  const c2First = interactions.find((d) => d.slideId === 'c2-first');
  const correctChoice = c1Predict.fields[0].options[1];
  const wrongChoice = c1Predict.fields[0].options[0];
  const correctOrder = [...c2First.fields[0].options].reverse();
  const correctHeat = c2First.fields[1].options[0];

  // Save answerKeys for c1-predict (choice) and c2-first (order + choice), leave c1-toxin without answerKey
  const savedCfg = await call('saveClassroomConfig', {
    answerKeys: {
      'c1-predict': {
        [c1Predict.fields[0].id]: {
          answer: correctChoice,
          explanation: '此為單選題原始解析句子。',
        },
      },
      'c2-first': {
        order: {
          answer: correctOrder,
          explanation: '此為排序題原始解析句子。',
        },
        heat: {
          answer: correctHeat,
          explanation: '加熱條件解析句子。',
        },
      },
    },
  });
  assert.equal(Object.keys(savedCfg.answerKeys).length, 2);

  // Student cannot call saveClassroomConfig or getClassroomConfig
  await assert.rejects(call('getClassroomConfig', { includeAnswerKeys: true }, student(1)));
  await assert.rejects(call('saveClassroomConfig', { answerKeys: {} }, student(1)));

  // 1. Open c1-predict for class A
  setClock(200000);
  const { round: r1 } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
  });
  assert.equal(r1.hasAnswerKey, true);

  // Calling reveal while status === 'open' MUST be rejected
  await assert.rejects(
    call('controlClassroomInteraction', { action: 'reveal', roundId: r1.id }),
    /請先結束作答再公佈答案/,
  );
  // Student cannot call reveal
  await assert.rejects(
    call('controlClassroomInteraction', { action: 'reveal', roundId: r1.id }, student(1)),
  );

  // Student 1 submits correct answer; Student 2 submits wrong answer; Student 3 does not submit
  const fid = c1Predict.fields[0].id;
  await call(
    'submitClassroomInteraction',
    { roundId: r1.id, answers: { [fid]: correctChoice } },
    student(1),
  );
  await call(
    'submitClassroomInteraction',
    { roundId: r1.id, answers: { [fid]: wrongChoice } },
    student(2),
  );

  // Negative test while open: student API response must NOT leak answerKey / explanation / reveal / judgement
  for (const s of [student(1), student(2), student(3)]) {
    const preOpen = await call('getClassroomInteraction', {}, s);
    const serialized = JSON.stringify(preOpen);
    assert(!serialized.includes('此為單選題原始解析句子'));
    assert(!serialized.includes('"reveal"'));
    assert(!serialized.includes('"judgement"'));
    assert(!serialized.includes('"explanation"'));
    assert(!serialized.includes('"hasAnswerKey"'));
  }
  // History while open must NOT include unrevealed round
  assert.deepEqual((await call('studentClassroomHistory', {}, student(1))).rounds, []);

  // 2. Close r1 (still unrevealed)
  setClock(210000);
  await call('controlClassroomInteraction', { action: 'close', roundId: r1.id });

  // Negative test after close but BEFORE reveal: student API still must NOT leak reveal / explanation / judgement
  for (const s of [student(1), student(2), student(3)]) {
    const preReveal = await call('getClassroomInteraction', {}, s);
    const serialized = JSON.stringify(preReveal);
    assert(!serialized.includes('此為單選題原始解析句子'));
    assert(!serialized.includes('"reveal"'));
    assert(!serialized.includes('"judgement"'));
    assert(!serialized.includes('"explanation"'));
  }
  assert.deepEqual((await call('studentClassroomHistory', {}, student(1))).rounds, []);

  // 3. Reveal r1
  setClock(220000);
  const revealed1 = await call('controlClassroomInteraction', { action: 'reveal', roundId: r1.id });
  assert.equal(revealed1.round.reveal.revealedAt, 220000);
  assert.equal(revealed1.round.reveal.key[fid].answer, correctChoice);

  // Idempotency + Snapshot immutability: modify answerKeys AFTER reveal and call reveal again
  await call('saveClassroomConfig', {
    answerKeys: {
      'c1-predict': {
        [fid]: {
          answer: wrongChoice,
          explanation: '事後竄改的解析文字',
        },
      },
      'c2-first': savedCfg.answerKeys['c2-first'],
    },
  });
  setClock(250000);
  const revealedAgain = await call('controlClassroomInteraction', {
    action: 'reveal',
    roundId: r1.id,
  });
  assert.equal(revealedAgain.round.reveal.revealedAt, 220000);
  assert.equal(revealedAgain.round.reveal.key[fid].answer, correctChoice);
  assert.equal(revealedAgain.round.reveal.key[fid].explanation, '此為單選題原始解析句子。');

  // Verify student feedback for Student 1 (correct), Student 2 (wrong), Student 3 (unanswered)
  const s1After = await call('getClassroomInteraction', {}, student(1));
  assert.equal(s1After.submitted, true);
  assert.equal(s1After.judgement.allCorrect, true);
  assert.equal(s1After.judgement.fields[fid].correct, true);
  assert.equal(s1After.reveal.key[fid].explanation, '此為單選題原始解析句子。');
  assert(!JSON.stringify(s1After).includes('學生2'));

  const s2After = await call('getClassroomInteraction', {}, student(2));
  assert.equal(s2After.submitted, true);
  assert.equal(s2After.judgement.allCorrect, false);
  assert.equal(s2After.judgement.fields[fid].correct, false);
  assert.equal(s2After.judgement.fields[fid].expected, correctChoice);
  assert.equal(s2After.judgement.fields[fid].actual, wrongChoice);

  const s3After = await call('getClassroomInteraction', {}, student(3));
  assert.equal(s3After.submitted, false);
  assert.equal(s3After.judgement.answered, false);
  assert.equal(s3After.judgement.allCorrect, false);
  assert.equal(s3After.reveal.key[fid].answer, correctChoice);

  // 4. Open & close & reveal c2-first (order question)
  setClock(300000);
  const { round: r2 } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c2-first',
    classIds: ['A'],
  });
  const partialOrder = [correctOrder[0], correctOrder[2], correctOrder[1], correctOrder[3]];
  await call(
    'submitClassroomInteraction',
    { roundId: r2.id, answers: { order: correctOrder, heat: correctHeat } },
    student(1),
  );
  await call(
    'submitClassroomInteraction',
    { roundId: r2.id, answers: { order: partialOrder, heat: correctHeat } },
    student(2),
  );
  setClock(310000);
  await call('controlClassroomInteraction', { action: 'close', roundId: r2.id });
  setClock(320000);
  await call('controlClassroomInteraction', { action: 'reveal', roundId: r2.id });

  const s2OrderAfter = await call('getClassroomInteraction', {}, student(2));
  assert.equal(s2OrderAfter.judgement.allCorrect, false);
  assert.deepEqual(s2OrderAfter.judgement.fields.order.stepCorrect, [true, false, false, true]);
  assert.equal(s2OrderAfter.judgement.fields.heat.correct, true);

  // 5. Open & close c1-toxin (no answerKey configured) -> reveal is rejected, not in student history
  setClock(400000);
  const { round: r3 } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-toxin',
    classIds: ['A'],
  });
  assert.equal('hasAnswerKey' in r3, false);
  setClock(410000);
  await call('controlClassroomInteraction', { action: 'close', roundId: r3.id });
  await assert.rejects(
    call('controlClassroomInteraction', { action: 'reveal', roundId: r3.id }),
    /尚未設定答案/,
  );

  // 6. Verify studentClassroomHistory for Student 1, Student 2, Student 3, and Class B student
  const h1 = await call('studentClassroomHistory', {}, student(1));
  assert.equal(h1.rounds.length, 2);
  assert.deepEqual(
    h1.rounds.map((r) => r.id),
    [r1.id, r2.id],
  );
  assert.equal(h1.rounds[0].judgement.allCorrect, true);
  assert.equal(h1.rounds[1].judgement.allCorrect, true);

  const h2 = await call('studentClassroomHistory', {}, student(2));
  assert.equal(h2.rounds.length, 2);
  assert.equal(h2.rounds[0].judgement.allCorrect, false);
  assert.equal(h2.rounds[1].judgement.allCorrect, false);
  assert(!JSON.stringify(h2).includes('學生1'));

  const h3 = await call('studentClassroomHistory', {}, student(3));
  assert.equal(h3.rounds.length, 2);
  assert.equal(h3.rounds[0].submitted, false);
  assert.equal(h3.rounds[0].answers, null);

  // Cross-class isolation: Class B student sees 0 rounds from Class A
  const hClassB = await call('studentClassroomHistory', {}, { ...student(9), classId: 'B' });
  assert.deepEqual(hClassB.rounds, []);

  // 7. F1 Regression: removing or invalidating answerKeys clears hasAnswerKey on unrevealed round while keeping revealed snapshots
  setClock(420000);
  const { round: r4 } = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'c1-predict',
    classIds: ['A'],
  });
  assert.equal(r4.hasAnswerKey, true);
  setClock(430000);
  const closedR4 = await call('controlClassroomInteraction', {
    action: 'close',
    roundId: r4.id,
  });
  assert.equal(closedR4.round.hasAnswerKey, true);

  // Remove answerKeys -> unrevealed r4 must no longer report hasAnswerKey, while revealed r1 keeps its snapshot
  await call('saveClassroomConfig', { answerKeys: {} });
  const repAfterClear = await call('classroomInteractionReport', {
    roundId: r4.id,
    history: true,
  });
  assert.equal(repAfterClear.round.hasAnswerKey, undefined);
  const r4InHist = repAfterClear.rounds.find((x) => x.id === r4.id);
  assert.equal(r4InHist.hasAnswerKey, undefined);
  const r1InHist = repAfterClear.rounds.find((x) => x.id === r1.id);
  assert.equal(r1InHist.hasAnswerKey, true);
  assert.equal(r1InHist.reveal.key[fid].answer, correctChoice);
  await assert.rejects(
    call('controlClassroomInteraction', { action: 'reveal', roundId: r4.id }),
    /尚未設定答案/,
  );

  // Re-save valid answerKey -> unrevealed r4 gets hasAnswerKey: true back
  await call('saveClassroomConfig', {
    answerKeys: {
      'c1-predict': { [fid]: { answer: correctChoice, explanation: '重新設定之合法解析' } },
    },
  });
  const repAfterRestore = await call('classroomInteractionReport', { roundId: r4.id });
  assert.equal(repAfterRestore.round.hasAnswerKey, true);

  // Invalidate answerKey by modifying c1-predict options in interactions -> r4 loses hasAnswerKey
  const mutatedInteractions = structuredClone(interactions);
  const mutPredict = mutatedInteractions.find((d) => d.slideId === 'c1-predict');
  mutPredict.fields[0].options = ['全新選項甲', '全新選項乙'];
  await call('saveClassroomConfig', { interactions: mutatedInteractions });
  const cfgAfterMutate = await call('getClassroomConfig', { includeAnswerKeys: true });
  assert.deepEqual(cfgAfterMutate.answerKeys, {});
  const repAfterMutate = await call('classroomInteractionReport', { roundId: r4.id });
  assert.equal(repAfterMutate.round.hasAnswerKey, undefined);

  // Restore original interactions + valid answerKey -> r4 can now be revealed, and r1 snapshot is still untouched
  await call('saveClassroomConfig', {
    interactions,
    answerKeys: {
      'c1-predict': { [fid]: { answer: correctChoice, explanation: '恢復後解析' } },
    },
  });
  const repAfterRevalid = await call('classroomInteractionReport', { roundId: r4.id });
  assert.equal(repAfterRevalid.round.hasAnswerKey, true);
  setClock(440000);
  const revealedR4 = await call('controlClassroomInteraction', {
    action: 'reveal',
    roundId: r4.id,
  });
  assert.equal(revealedR4.round.reveal.key[fid].explanation, '恢復後解析');
  const repR1StillImmutable = await call('classroomInteractionReport', { roundId: r1.id });
  assert.equal(repR1StillImmutable.round.reveal.key[fid].explanation, '此為單選題原始解析句子。');

  // 8. F2 Regression: 100+ newer Class B rounds must not evict Class A history; Class A > 100 rounds all returned in order
  for (let i = 0; i < 105; i++) {
    const bId = `b-round-${i}`;
    docs.set(`courses/${MI_CLASSROOM_COURSE}/classroomRounds/${bId}`, {
      ...c1Predict,
      id: bId,
      number: i + 1,
      classIds: ['B'],
      status: 'closed',
      openedAt: 500000 + i,
      closedAt: 500000 + i,
      total: 0,
      counts: {},
      hasAnswerKey: true,
      reveal: {
        revealedAt: 500000 + i,
        key: { [fid]: { answer: correctChoice } },
      },
    });
  }
  const h1After105ClassB = await call('studentClassroomHistory', {}, student(1));
  assert.deepEqual(
    h1After105ClassB.rounds.map((r) => r.id),
    [r1.id, r2.id, r4.id],
    '其他班級新增超過 100 輪不得擠掉本班已公佈紀錄',
  );

  for (let i = 0; i < 105; i++) {
    const aId = `a-extra-${String(i).padStart(3, '0')}`;
    docs.set(`courses/${MI_CLASSROOM_COURSE}/classroomRounds/${aId}`, {
      ...c1Predict,
      id: aId,
      number: i + 10,
      classIds: ['A'],
      status: 'closed',
      openedAt: 700000 + i,
      closedAt: 700000 + i,
      total: 1,
      counts: {},
      hasAnswerKey: true,
      reveal: {
        revealedAt: 700000 + i,
        key: { [fid]: { answer: correctChoice } },
      },
    });
  }
  const h1Over100Own = await call('studentClassroomHistory', {}, student(1));
  assert.equal(h1Over100Own.rounds.length, 108, '本班超過 100 輪已公佈紀錄應完整回傳');
  for (let i = 1; i < h1Over100Own.rounds.length; i++) {
    assert(
      h1Over100Own.rounds[i].openedAt >= h1Over100Own.rounds[i - 1].openedAt,
      '紀錄必須維持時間升冪排序',
    );
  }

  // No writes outside classroom paths
  assert([...docs.keys()].every((p) => p.includes('/classroom') || p.startsWith('enrollments/')));
});
