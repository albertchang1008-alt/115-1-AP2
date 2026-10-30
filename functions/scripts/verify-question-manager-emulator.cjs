// Safety: requires real local emulator; never connects to a production database.
if (!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || ''))
  throw Error('Local Firestore Emulator required');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-question-manager' });
const assert = require('node:assert/strict'),
  fs = require('node:fs');
const handlers = require('../lib/functions/src/index.js'),
  { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore(),
  courseId = 'question-manager-fixture';
const teacher = {
  uid: 'qm-teacher',
  token: {
    email: 'qm.teacher@example.test',
    email_verified: true,
    teacher: true,
    firebase: { sign_in_provider: 'google.com' },
  },
};
const student = {
  uid: 'qm-student',
  token: {
    email: 'qm.student@example.test',
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  },
};
const q = {
  slideId: 'demo-P01',
  title: '課堂示範',
  fields: [{ id: 'f1', label: '請選活動起點', kind: 'choice', options: ['閱讀', '討論'] }],
};
const keys = { f1: { answer: '閱讀', explanation: '先閱讀題幹。' } };
const call = (name, data = {}, auth = teacher) =>
  handlers[name].run({ auth, data: { courseId, ...data } });
const pass = [];
async function check(name, fn) {
  await fn();
  pass.push(name);
  console.log('PASS', name);
}
(async () => {
  await db.doc(`courses/${courseId}`).set({
    rosterVersion: 2,
    teacherIds: [teacher.uid],
    classIds: ['A'],
    features: { teachingConsole: true, classroomInteraction: true },
    draft: {
      id: courseId,
      units: [],
      classIds: ['A'],
      features: { teachingConsole: true, classroomInteraction: true },
    },
    published: {
      id: courseId,
      units: [],
      classIds: ['A'],
      features: { teachingConsole: true, classroomInteraction: true },
    },
  });
  await db.doc(`enrollments/${courseId}__${student.token.email}`).set({
    courseId,
    email: student.token.email,
    uid: student.uid,
    classId: 'A',
    studentId: 'fixture',
    name: '測試學生',
    enabled: true,
  });
  await call('saveClassroomConfig', {
    interactions: [q, { ...q, slideId: 'R-REV-04' }, { ...q, slideId: 'other-P01' }],
    answerKeys: { [q.slideId]: keys, 'R-REV-04': keys, 'other-P01': keys },
  });
  const old = {
    slideId: q.slideId,
    status: 'closed',
    classIds: ['A'],
    openedAt: 1,
    fields: q.fields,
    title: q.title,
    reveal: { revealedAt: 2, key: keys },
  };
  await db.doc(`courses/${courseId}/classroomRounds/old`).set(old);
  const snap = { interaction: q, keys },
    next = { interaction: { ...q, title: '修改後' }, keys };
  const args = { slideId: q.slideId, expected: snap, next };
  await check('teacher save + legacy/other deck preserve', async () => {
    await call('updateClassroomQuestions', args);
    const cfg = await call('getClassroomConfig', { includeAnswerKeys: true });
    assert.equal(cfg.interactions[0].title, '修改後');
    assert.deepEqual(cfg.interactions.slice(1), [
      { ...q, slideId: 'R-REV-04' },
      { ...q, slideId: 'other-P01' },
    ]);
    assert.deepEqual(cfg.answerKeys['R-REV-04'], keys);
  });
  await check('student denied', () =>
    assert.rejects(
      call('updateClassroomQuestions', args, student),
      (e) => e.code === 'permission-denied',
    ),
  );
  await check('anonymous denied', () =>
    assert.rejects(
      call('updateClassroomQuestions', args, null),
      (e) => e.code === 'unauthenticated',
    ),
  );
  await check('student config denied', () =>
    assert.rejects(
      call(
        'getClassroomConfig',
        { includeAnswerKeys: true, includeQuestionManager: true },
        student,
      ),
      (e) => e.code === 'permission-denied',
    ),
  );
  await check('stale concurrent update rejected', () =>
    assert.rejects(call('updateClassroomQuestions', args), (e) => e.code === 'aborted'),
  );
  await check('actual concurrent transactions one winner', async () => {
    const a = { ...args, expected: next, next: { interaction: { ...q, title: '第二次' }, keys } };
    const r = await Promise.allSettled([
      call('updateClassroomQuestions', a),
      call('updateClassroomQuestions', {
        ...a,
        next: { interaction: { ...q, title: '競爭' }, keys },
      }),
    ]);
    assert.equal(r.filter((x) => x.status === 'fulfilled').length, 1);
    assert.equal(r.filter((x) => x.status === 'rejected' && x.reason.code === 'aborted').length, 1);
  });
  await check('invalid answer atomic rollback', async () => {
    const cfg = await call('getClassroomConfig', { includeAnswerKeys: true });
    const expected = { interaction: cfg.interactions[0], keys: cfg.answerKeys[q.slideId] };
    await assert.rejects(
      call('updateClassroomQuestions', {
        slideId: q.slideId,
        expected,
        next: { interaction: q, keys: { f1: { answer: '非法' } } },
      }),
      (e) => e.code === 'invalid-argument',
    );
    assert.deepEqual(await call('getClassroomConfig', { includeAnswerKeys: true }), cfg);
  });
  await check('round count + published snapshot unchanged', async () => {
    const cfg = await call('getClassroomConfig', {
      includeQuestionManager: true,
      includeAnswerKeys: true,
      slideIds: ['demo-P02'],
    });
    assert.equal(cfg.roundCounts[q.slideId], 1);
    assert.equal(cfg.roundCounts['demo-P02'], 0);
    assert.deepEqual((await db.doc(`courses/${courseId}/classroomRounds/old`).get()).data(), old);
  });
  await check('Firestore REST client cannot directly read keys', async () => {
    const url = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-question-manager/databases/(default)/documents/courses/${courseId}/classroomConfig/answerKeys`;
    const r = await fetch(url);
    assert.equal(r.status, 403);
    const seconds = Math.floor(Date.now() / 1000);
    const token =
      [
        { alg: 'none', typ: 'JWT' },
        {
          aud: 'demo-question-manager',
          iss: 'https://securetoken.google.com/demo-question-manager',
          sub: student.uid,
          user_id: student.uid,
          email: student.token.email,
          iat: seconds,
          exp: seconds + 3600,
          firebase: { sign_in_provider: 'google.com' },
        },
      ]
        .map((v) => Buffer.from(JSON.stringify(v)).toString('base64url'))
        .join('.') + '.';
    const asStudent = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    assert.equal(asStudent.status, 403);
  });
  await check(
    'export rows through real #38 callable preserve exact multi-field questions',
    async () => {
      const { questionMatrix } = require('../lib/shared/questionWorkbook.js');
      const question = {
        ...q,
        title: '獨立標題：完整版往返',
        fields: [
          q.fields[0],
          { id: 'second', label: '順序', kind: 'order', options: ['起點', '終點'] },
        ],
      };
      const key = { ...keys, second: { answer: ['終點', '起點'], explanation: '示範順序。' } };
      const matrix = questionMatrix([{ interaction: question, keys: key, page: 1 }]);
      const payload = {
        deckId: 'demo',
        title: '本機匯入示範',
        slides: [
          {
            id: q.slideId,
            title: '不同的投影片標題',
            html: '<section style="width:1920px;height:1080px"><h1>示範</h1></section>',
            notes: '',
            answerPage: false,
          },
        ],
        questionRows: matrix.slice(1).map((r, i) => ({ rowNumber: i + 2, managedCells: r })),
      };
      const dry = await call('saveTeachingDeck', { ...payload, dryRun: true });
      assert.equal(dry.questionCount, 1);
      const saved = await call('saveTeachingDeck', payload);
      assert.equal(saved.questionCount, 1);
      const cfg = await call('getClassroomConfig', { includeAnswerKeys: true });
      assert.deepEqual(
        cfg.interactions.find((v) => v.slideId === q.slideId),
        question,
      );
      assert.deepEqual(cfg.answerKeys[q.slideId], key);
      assert(cfg.interactions.some((v) => v.slideId === 'R-REV-04'));
      assert(cfg.interactions.some((v) => v.slideId === 'other-P01'));
      assert.deepEqual((await db.doc(`courses/${courseId}/classroomRounds/old`).get()).data(), old);
    },
  );
  await check('no grade/progress/research writes', async () => {
    for (const collection of ['progress', 'researchEvents', 'attempts'])
      assert.equal((await db.collection(collection).get()).size, 0);
  });
  if (process.env.QM_EVIDENCE)
    fs.writeFileSync(
      process.env.QM_EVIDENCE,
      JSON.stringify(
        { projectId: 'demo-question-manager', passed: pass.length, failed: 0, checks: pass },
        null,
        2,
      ),
    );
  console.log(`${pass.length} PASS, 0 FAIL`);
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
