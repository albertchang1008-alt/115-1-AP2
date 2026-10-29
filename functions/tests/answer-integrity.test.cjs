const { test } = require('node:test'),
  assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-integrity-unit' });
const {
  submitAttempt,
  submitMixedAttempts,
  getAnswerIntegrityStats,
  recordPracticeLeaves,
} = require('../lib/functions/src/index.js');
const { memoryDb } = require('./helpers/reflection-memory.cjs');
const auth = {
    uid: 'student',
    token: {
      email: 'fixture@example.edu',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    },
  },
  teacher = { uid: 'teacher', token: { teacher: true } };
const courseId = 'integrity-test',
  unit = {
    id: 'u',
    title: '示範',
    threshold: 100,
    opensAt: '',
    dueAt: '',
    activities: [],
    visibility: 'current',
    required: true,
    bankVersion: 'v1',
  };
function seed(ctx) {
  const course = { id: courseId, title: 'test', classIds: ['A', 'test'], units: [unit] };
  ctx.data.set(`courses/${courseId}`, {
    teacherIds: ['teacher'],
    rosterVersion: 2,
    draft: course,
    published: course,
  });
  ctx.data.set(`enrollments/${courseId}__fixture@example.edu`, {
    courseId,
    classId: 'A',
    uid: 'student',
    studentId: '01',
    name: '示範',
    enabled: true,
    email: 'fixture@example.edu',
  });
  ctx.data.set(`banks/${courseId}_u_v1`, {
    count: 8,
    questionOptions: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`q${i}`, ['a', 'b']])),
  });
  ctx.data.set(`banks/${courseId}_u_v1/grading/answers`, {
    answers: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`q${i}`, 'a'])),
  });
}
function a(id, extra = {}) {
  return {
    id,
    courseId,
    unitId: 'u',
    version: 'v1',
    mode: 'quiz',
    full: true,
    clientAt: 1,
    duration: 80,
    score: 0,
    answers: Array.from({ length: 8 }, (_, i) => ({
      questionId: `q${i}`,
      selected: 'a',
      correct: false,
      seconds: 10,
    })),
    ...extra,
  };
}
const send = (attempt) => submitAttempt.run({ auth, data: { attempt } });
for (const [count, seconds, invalid] of [
  [3, 60, false],
  [4, 60, true],
  [3, 61, true],
])
  test(`真實submitAttempt ${count}次/${seconds}秒：判分與progress`, async () => {
    const ctx = memoryDb();
    try {
      seed(ctx);
      const r = await send(
        a(`a-${count}-${seconds}`, { leaveCount: count, leaveSeconds: seconds }),
      );
      assert.equal(r.attempt.score, 100);
      assert.equal(r.attempt.integrity === 'left-screen', invalid);
      assert.equal(r.progress.units.u.best, invalid ? -1 : 100);
      assert.equal(!!r.progress.units.u.passedAt, !invalid);
      assert.equal(r.progress.units.u.attempts, 1);
      assert.equal(
        ctx.data.get(`courses/${courseId}/attempts/a-${count}-${seconds}`).integrity ===
          'left-screen',
        invalid,
      );
    } finally {
      ctx.restore();
    }
  });
test('無效重送不重計次數，不改舊best與passedAt；舊客戶端正常達標', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    ctx.data.set(`courses/${courseId}/progress/student`, {
      units: { u: { best: 80, attempts: 1, fullAttempts: 1, updatedAt: 1, passedAt: 123 } },
      activities: {},
    });
    const r = await send(a('invalid', { leaveCount: 4, leaveSeconds: 42 }));
    assert.equal(r.progress.units.u.best, 80);
    assert.equal(r.progress.units.u.passedAt, 123);
    assert.equal(r.progress.units.u.attempts, 2);
    assert.equal(
      (await send(a('invalid', { leaveCount: 0, leaveSeconds: 0 }))).progress.units.u.attempts,
      2,
    );
    const old = await send(a('legacy'));
    assert.equal(old.attempt.integrity, undefined);
    assert.equal(old.progress.units.u.best, 100);
  } finally {
    ctx.restore();
  }
});
test('字串／負值／缺欄位拒絕且不落地，client integrity不能自訂', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    for (const m of [
      { leaveCount: '4', leaveSeconds: 10 },
      { leaveCount: -1, leaveSeconds: 0 },
      { leaveCount: 1 },
      { leaveCount: 0, leaveSeconds: 5 },
    ])
      await assert.rejects(send(a('bad', m)), /離開畫面/);
    assert.equal(ctx.data.has(`courses/${courseId}/attempts/bad`), false);
    assert.equal(
      (await send(a('spoof', { integrity: 'left-screen', leaveCount: 0, leaveSeconds: 0 }))).attempt
        .integrity,
      undefined,
    );
  } finally {
    ctx.restore();
  }
});
test('抽題／錯題／閃卡提交與綜合練習只記錄不作廢', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    for (const mode of ['quiz', 'review', 'flashcard']) {
      const r = await send(
        a(`practice-${mode}`, { mode, full: false, leaveCount: 4, leaveSeconds: 61 }),
      );
      assert.equal(r.attempt.integrity, undefined);
      assert.equal(r.attempt.leaveCount, 4);
      assert.equal(r.progress.units.u.best, -1);
    }
    const r = await submitMixedAttempts.run({
      auth,
      data: {
        attempts: [
          a('mixed', { full: false, leaveCount: 4, leaveSeconds: 61, integrity: 'left-screen' }),
        ],
      },
    });
    assert.equal(r.attempts[0].integrity, undefined);
    assert.equal(r.progress.units.u.best, -1);
  } finally {
    ctx.restore();
  }
});
test('教師統計拒絕學生／未登入／其他教師／test班，僅讀本課本班資料', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    await send(a('saved', { leaveCount: 0, leaveSeconds: 0 }));
    ctx.data.set(`enrollments/${courseId}__duplicate@example.edu`, {
      courseId,
      classId: 'A',
      uid: 'student',
      studentId: '01',
      name: '示範',
      enabled: true,
      email: 'duplicate@example.edu',
    });
    const data = { courseId, classId: 'A', unitId: 'u' };
    for (const denied of [auth, null, { uid: 'other', token: { teacher: true } }])
      await assert.rejects(getAnswerIntegrityStats.run({ auth: denied, data }));
    await assert.rejects(
      getAnswerIntegrityStats.run({ auth: teacher, data: { ...data, classId: 'test' } }),
    );
    const r = await getAnswerIntegrityStats.run({ auth: teacher, data });
    assert.equal(r.units[0].rows.length, 1);
    assert.equal(r.units[0].rows[0].average, 10);
    assert.equal(r.units[0].rows[0].reasons.includes('uniform'), true);
    await assert.rejects(
      getAnswerIntegrityStats.run({
        auth: teacher,
        data: { courseId, classId: 'A', uid: 'foreign' },
      }),
    );
    assert.equal(ctx.data.has(`courses/${courseId}/progress/teacher`), false);
  } finally {
    ctx.restore();
  }
});
test('閃卡metadata只記自己的session且不寫progress，學生不能讀教師統計', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    const data = {
      courseId,
      sessionId: 'flash-1',
      mode: 'flashcard',
      unitIds: ['u'],
      duration: 80,
      leaveCount: 4,
      leaveSeconds: 61,
    };
    const r = await recordPracticeLeaves.run({ auth, data });
    assert.equal(r.ok, true);
    assert.equal(ctx.data.get(`courses/${courseId}/practiceLeaves/flash-1`).uid, 'student');
    assert.equal(ctx.data.has(`courses/${courseId}/progress/student`), false);
    assert.equal((await recordPracticeLeaves.run({ auth, data })).duplicate, true);
    await assert.rejects(recordPracticeLeaves.run({ auth: teacher, data }));
    await assert.rejects(
      recordPracticeLeaves.run({ auth, data: { ...data, sessionId: 'bad', unitIds: ['foreign'] } }),
    );
  } finally {
    ctx.restore();
  }
});

test('超出統計讀取上限時明確拒絕，不回傳部分資料當完整統計', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    for (let i = 0; i <= 10000; i++)
      ctx.data.set(`courses/${courseId}/attempts/cap-${i}`, { classId: 'A', unitId: 'u' });
    await assert.rejects(
      getAnswerIntegrityStats.run({ auth: teacher, data: { courseId, classId: 'A', unitId: 'u' } }),
      (e) => e.code === 'resource-exhausted',
    );
    assert.equal(ctx.data.has(`courses/${courseId}/progress/teacher`), false);
  } finally {
    ctx.restore();
  }
});
test('教師使用情況唯讀：學生／外課教師／test被拒，排除跨班與停用學生，舊進度無時間不推估',async()=>{
 const ctx=memoryDb();try {seed(ctx);const {getClassUsageStats}=require('../lib/functions/src/index.js'), now=Date.now();
 ctx.data.set(`courses/${courseId}/attempts/recent`,{uid:'student',classId:'A',unitId:'u',clientAt:now-1000});
 ctx.data.set(`courses/${courseId}/attempts/foreign`,{uid:'foreign',classId:'A',unitId:'u',clientAt:now});
 ctx.data.set(`courses/${courseId}/progress/student`,{activities:{u_act:{completed:true,updatedAt:now},u_old:{completed:true}}});
 ctx.data.set(`courses/${courseId}/diagnostics/d`,{uid:'student',classId:'A',unitId:'u'});
 ctx.data.set(`courses/${courseId}/diagnostics/d/events/e`,{receivedAt:now-2000});
 for(const a of [auth,null,{uid:'foreign',token:{teacher:true}}])await assert.rejects(getClassUsageStats.run({auth:a,data:{courseId,classId:'A'}}));
 await assert.rejects(getClassUsageStats.run({auth:teacher,data:{courseId,classId:'test'}}));
 const writes=ctx.writes.length, out=await getClassUsageStats.run({auth:teacher,data:{courseId,classId:'A'}});
 assert.equal(out.recent.length,1);assert.equal(out.daily.at(-1).users,1);assert.equal(out.daily.at(-1).records,3);assert.equal(out.reads.events,1);assert.equal(ctx.writes.length,writes);
 }finally{ctx.restore();}
});
