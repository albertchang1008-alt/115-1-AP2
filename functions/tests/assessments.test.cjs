const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createAssessmentHandlers,
  assertPracticeBank,
  storeAssessmentSources,
} = require('../lib/functions/src/assessments.js');
const { publicExamQuestion, examGrade, examAnswers } = require('../lib/shared/assessment.js');
const questions = Array.from({ length: 7 }, (_, i) => ({
  id: 'q' + i,
  text: '題目' + i,
  options: [
    { id: 'a', text: '甲' },
    { id: 'b', text: '乙' },
  ],
  answer: 'a',
  explanation: '私有解析',
  socratic: { trace: '私有追溯' },
  source: '私有來源',
}));
function fixture() {
  const data = new Map(),
    clone = (x) => (x == null ? x : structuredClone(x));
  let queue = Promise.resolve();
  function ref(path) {
    return {
      path,
      id: path.split('/').at(-1),
      get: async () => snap(path),
      collection: (name) => collection(path + '/' + name),
      set: async (v, o) => data.set(path, o?.merge ? { ...data.get(path), ...clone(v) } : clone(v)),
      update: async (v) => data.set(path, { ...data.get(path), ...clone(v) }),
      get parent() {
        return { parent: ref(path.split('/').slice(0, -2).join('/')) };
      },
    };
  }
  function snap(path) {
    return {
      exists: data.has(path),
      ref: ref(path),
      id: path.split('/').at(-1),
      data: () => clone(data.get(path)),
    };
  }
  function collection(path) {
    return {
      path,
      doc: (id) => ref(path + '/' + id),
      get: async () => ({
        docs: [...data.keys()]
          .filter(
            (x) => x.startsWith(path + '/') && x.split('/').length === path.split('/').length + 1,
          )
          .map(snap),
      }),
      where() {
        return this;
      },
    };
  }
  const db = {
    doc: ref,
    collection,
    runTransaction(fn) {
      const run = queue.then(async () => {
        const writes = [];
        const r = await fn({
          get: (x) => x.get(),
          create: (r, v) => {
            assert(!data.has(r.path));
            writes.push(() => data.set(r.path, clone(v)));
          },
          set: (r, v) => writes.push(() => data.set(r.path, clone(v))),
          update: (r, v) =>
            writes.push(() => data.set(r.path, { ...data.get(r.path), ...clone(v) })),
        });
        writes.forEach((f) => f());
        return r;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
  data.set('courses/c', { features: { assessments: true }, teacherIds: ['t'], draft: { classIds: ['A'] } });
  data.set('courses/c/assessmentSources/pretest', { questions });
  data.set('courses/c/assessmentSources/posttest', {
    questions: questions.map((q) => ({ ...q, id: 'post' + q.id })),
  });
  const access = async (req, id, teacher) => {
    if (!req.auth) throw Error('請先登入');
    if (id !== 'c') throw Error('課程不存在');
    const p = req.auth;
    if (teacher && !p.teacher) throw Error('需要教師權限');
    return { p, c: data.get('courses/c') };
  };
  const h = createAssessmentHandlers(db, access, { region: 'asia-east1' }),
    teacher = { uid: 't', teacher: true },
    student = { uid: 's', classId: 'A', studentId: 'S1', name: '測試' },
    req = (auth, extra = {}) => ({ auth, data: { courseId: 'c', ...extra } }),
    call = (name, auth, extra) => h[name].run(req(auth, extra));
  return { db, data, h, teacher, student, call };
}
test('測驗公開 DTO 沒有答案／解析／引導式解析；未作答是零，分數只由私有答案決定', () => {
  const q = publicExamQuestion(questions[0]);
  assert.deepEqual(Object.keys(q), ['id', 'text', 'options']);
  assert.equal(examGrade(questions, {}).correct, 0);
  assert.equal(examGrade(questions, { q0: 'a', q1: 'b' }).correct, 1);
  assert.throws(() => examAnswers(questions, { bad: 'a' }));
  assert.throws(() => examAnswers(questions, { q0: 'x' }));
  assert.throws(() => examAnswers(questions, []));
});
test('正式場次僅一次；重整與同時開始使用相同選項顺序；重送交卷不重批也不接受竄改分數', async () => {
  const f = fixture(),
    now = Date.now();
  const { id } = await f.call('prepareAssessment', f.teacher, {
    kind: 'pretest',
    classIds: ['A'],
    opensAt: now - 1000,
    closesAt: now + 600000,
  });
  await f.call('controlAssessment', f.teacher, { examId: id, action: 'open' });
  const [a, b] = await Promise.all([
    f.call('startAssessment', f.student, { examId: id }),
    f.call('startAssessment', f.student, { examId: id }),
  ]);
  assert.deepEqual(a.session.questions, b.session.questions);
  assert.equal(a.session.startedAt, b.session.startedAt);
  assert.equal(a.session.expiresAt - a.session.startedAt, 480000);
  assert(!JSON.stringify(a).includes('私有'));
  const first = await f.call('saveAssessment', f.student, {
    examId: id,
    revision: 0,
    answers: { q0: 'a' },
    score: 100,
  });
  assert.equal(first.session.revision, 1);
  assert(!('score' in first.session));
  await assert.rejects(
    f.call('saveAssessment', f.student, { examId: id, revision: 0, answers: { q0: 'b' } }),
    /另一個視窗/,
  );
  const done = await f.call('saveAssessment', f.student, {
    examId: id,
    revision: 1,
    answers: { q0: 'a' },
    submit: true,
    score: 100,
  });
  assert.equal(done.session.state, 'submitted');
  assert(!('score' in done.session));
  const repeat = await f.call('saveAssessment', f.student, {
    examId: id,
    revision: 1,
    answers: { q0: 'b' },
    submit: true,
  });
  assert.deepEqual(repeat.session, done.session);
  const s = f.data.get(`courses/c/assessments/${id}/assessmentSessions/s`);
  assert.equal(s.correct, 1);
  assert.equal(s.score, 14);
  assert.equal(
    [...f.data.keys()].some((x) => x.includes('/progress/') || x.includes('/attempts/')),
    false,
  );
});
test('逾时不接納新選答；伺服器以最後存檔批改；其他班／教師不可建立學生成績', async () => {
  const f = fixture(),
    now = Date.now();
  const { id } = await f.call('prepareAssessment', f.teacher, {
    kind: 'pretest',
    classIds: ['A'],
    opensAt: now - 1000,
    closesAt: now + 600000,
  });
  await f.call('controlAssessment', f.teacher, { examId: id, action: 'open' });
  await assert.rejects(
    f.call('startAssessment', { ...f.student, classId: 'B' }, { examId: id }),
    /此班級/,
  );
  await assert.rejects(f.call('startAssessment', f.teacher, { examId: id }), /預覽/);
  await f.call('startAssessment', f.student, { examId: id });
  const p = `courses/c/assessments/${id}/assessmentSessions/s`;
  f.data.get(p).expiresAt = now - 1;
  const r = await f.call('saveAssessment', f.student, {
    examId: id,
    revision: 0,
    answers: { q0: 'a' },
    submit: true,
  });
  assert.equal(r.session.reason, 'timeout');
  assert.equal(f.data.get(p).correct, 0);
});
test('教師控制：前測結束才能開後測；後測結束才能公布；公布後不可重開同來源', async () => {
  const f = fixture(),
    now = Date.now(),
    config = { classIds: ['A'], opensAt: now - 1000, closesAt: now + 600000 };
  const pre = (await f.call('prepareAssessment', f.teacher, { ...config, kind: 'pretest' })).id,
    post = (await f.call('prepareAssessment', f.teacher, { ...config, kind: 'posttest' })).id;
  await assert.rejects(
    f.call('controlAssessment', f.teacher, { examId: post, action: 'open' }),
    /先結束/,
  );
  await f.call('controlAssessment', f.teacher, { examId: pre, action: 'open' });
  await f.call('startAssessment', f.student, { examId: pre });
  await f.call('saveAssessment', f.student, {
    examId: pre,
    revision: 0,
    answers: { q0: 'a' },
    submit: true,
  });
  await f.call('controlAssessment', f.teacher, { examId: pre, action: 'close' });
  await assert.rejects(
    f.call('controlAssessment', f.teacher, { examId: pre, action: 'release' }),
    /所有後測/,
  );
  await f.call('controlAssessment', f.teacher, { examId: post, action: 'open' });
  await f.call('controlAssessment', f.teacher, { examId: post, action: 'close' });
  await f.call('controlAssessment', f.teacher, { examId: pre, action: 'release' });
  const r = await f.call('startAssessment', f.student, { examId: pre });
  assert.equal(r.session.correct, 1);
  assert.equal(r.results[0].answer, 'a');
  await assert.rejects(
    f.call('controlAssessment', f.student, { examId: pre, action: 'release' }),
    /教師/,
  );
  assert([...f.data.keys()].some((x) => x.includes('/audit/')));
});
test('一般題庫版本與綜合練習都不可繞過正式題目隔離', () => {
  const c = { assessmentSources: { pretest: ['q0'] }, assessmentSourceUnits: ['前測'] };
  assert.throws(() => assertPracticeBank(c, '舊卷', ['q0']), /不可/);
  assert.throws(() => assertPracticeBank(c, '前測', []), /不可/);
  assert.doesNotThrow(() => assertPracticeBank(c, '練習', ['ordinary']));
});
test('試卷一旦凍結，重新同步不改已開始或已建立的試卷', async () => {
  const f = fixture(),
    now = Date.now(),
    id = (
      await f.call('prepareAssessment', f.teacher, {
        kind: 'pretest',
        classIds: ['A'],
        opensAt: now - 1000,
        closesAt: now + 600000,
      })
    ).id;
  f.data.get('courses/c/assessmentSources/pretest').questions[0].text = '新版';
  assert.equal(f.data.get(`courses/c/assessments/${id}`).questions[0].text, '題目0');
  await assert.rejects(
    f.call('prepareAssessment', f.teacher, {
      kind: 'pretest',
      classIds: ['A'],
      opensAt: now - 1000,
      closesAt: now + 600000,
    }),
    /已有正式測驗/,
  );
});

test('無日期即可建立；舊試卷未來／過期時段不限制教師手動開放，每人完整八分鐘', async () => {
  for (const shift of [-86400000, 86400000]) {
    const f = fixture();
    const { id } = await f.call('prepareAssessment', f.teacher, { kind: 'pretest', classIds: ['A'] });
    // Simulate an existing, frozen scheduled exam without recreating its questions.
    const entry = [...f.data.entries()].find(([key]) => key.endsWith('/' + id));
    assert(entry);
    const [examPath, exam] = entry;
    assert(!('opensAt' in exam));
    assert(!('closesAt' in exam));
    f.data.set(examPath, { ...exam, opensAt: Date.now() + shift, closesAt: Date.now() + shift + 1000 });
    await assert.rejects(f.call('startAssessment', f.student, { examId: id }), /尚未開放/);
    await f.call('controlAssessment', f.teacher, { examId: id, action: 'open' });
    const a = await f.call('startAssessment', f.student, { examId: id });
    assert.equal(a.controlMode, 'manual');
    assert.equal(a.session.expiresAt - a.session.startedAt, 480000);
    assert(!('opensAt' in a));
    assert(!('closesAt' in a));
    assert.deepEqual(f.data.get(examPath).questions, exam.questions);
    await f.call('saveAssessment', f.student, { examId: id, revision: 0, answers: { q0: 'a' } });
    await f.call('controlAssessment', f.teacher, { examId: id, action: 'close' });
    const done = await f.call('saveAssessment', f.student, { examId: id, revision: 1, answers: { q0: 'b' } });
    assert.equal(done.session.state, 'submitted');
    assert.equal(done.session.answers.q0, 'a');
    await assert.rejects(f.call('startAssessment', { ...f.student, uid: 'new' }, { examId: id }), /已結束/);
    await assert.rejects(f.call('controlAssessment', f.teacher, { examId: id, action: 'open' }), /已結束/);
  }
});

test('舊作答續考保留原截止時間，不延長倒數', async () => {
  const f = fixture();
  const { id } = await f.call('prepareAssessment', f.teacher, { kind: 'pretest', classIds: ['A'] });
  await f.call('controlAssessment', f.teacher, { examId: id, action: 'open' });
  await f.call('startAssessment', f.student, { examId: id });
  const entry = [...f.data.entries()].find(([key]) => key.endsWith('/assessmentSessions/s'));
  const [path, session] = entry;
  const deadline = Date.now() + 30000;
  f.data.set(path, { ...session, expiresAt: deadline });
  const resumed = await f.call('startAssessment', f.student, { examId: id });
  assert.equal(resumed.session.expiresAt, deadline);
});
