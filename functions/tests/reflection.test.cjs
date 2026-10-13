const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
const f = require('../lib/functions/src/index.js');
const {
  memoryDb,
  seed,
  auth,
  request,
  courseId,
  chapterId,
  activityId,
} = require('./helpers/reflection-memory.cjs');
const key = `chapter:${chapterId}_${activityId}`,
  responsePath = `courses/${courseId}/reflections/${key}/responses/student-uid`,
  progressPath = `courses/${courseId}/progress/student-uid`;
const run = (name, data = request(), role = 'student') => f[name].run({ auth: auth(role), data });
test('反思交易：名冊身分、快照、完成進度同筆寫入、重送次數、原送出時間與既有成績保留', async () => {
  const c = memoryDb();
  seed(c);
  try {
    c.data.get('enrollments/' + courseId + '__student@example.edu').uid = 'forged-roster-uid';
    c.data.set(progressPath, {
      units: { heart: { best: 90, attempts: 1, updatedAt: 1 } },
      activities: { old: { completed: true, position: 8, updatedAt: 1 } },
    });
    const first = await run('saveReflection', { ...request(), uid: 'evil', name: '偽造姓名' });
    assert.equal(first.response.name, '測試同學');
    assert.equal(first.response.uid, 'student-uid');
    assert.equal(first.response.editCount, 0);
    assert.equal(first.progress.activities[key].completed, true);
    assert.equal(first.progress.activities.old.completed, true);
    assert.equal(first.progress.units.heart.best, 90);
    assert.deepEqual(c.transactions.at(-1), [
      `courses/${courseId}/reflections/${key}/responses/student-uid`,
      progressPath,
    ]);
    assert(!JSON.stringify(first).includes('偽造'));
    c.data.get('courses/' + courseId).published.chapters[
      chapterId
    ].activities[0].reflection.prompts[0].text = '題目改文字';
    assert.equal(
      (await run('getMyReflection')).response.promptsSnapshot[0].text,
      '原本我以為，現在我知道',
    );
    const second = await run(
      'saveReflection',
      request({ change: ' 我現在能連結機轉 ', activity: '討論' }),
    );
    assert.equal(second.response.editCount, 1);
    assert.equal(second.response.submittedAt, first.response.submittedAt);
    assert.equal(second.response.answers.change, '我現在能連結機轉');
    assert.equal(second.response.promptsSnapshot[0].text, '題目改文字');
    const before = structuredClone([...c.data]);
    c.failCommit(true);
    await assert.rejects(run('saveReflection'), /atomic commit failure/);
    assert.deepEqual([...c.data], before);
  } finally {
    c.restore();
  }
});
test('反思權限：未登入、非名冊、其他課程教師、學生讀全班、教師預覽、本人隔離', async () => {
  const c = memoryDb();
  seed(c);
  try {
    await assert.rejects(f.saveReflection.run({ data: request() }), /請先登入/);
    const outsider = {
      uid: 'outside',
      token: {
        email: 'no@example.edu',
        email_verified: true,
        firebase: { sign_in_provider: 'google.com' },
      },
    };
    await assert.rejects(f.saveReflection.run({ auth: outsider, data: request() }), /名冊/);
    await assert.rejects(
      f.getReflections.run({
        auth: { uid: 'unauthorized', token: { teacher: true } },
        data: request(),
      }),
      /授權/,
    );
    await assert.rejects(run('getReflections'), /課程未開放/);
    await assert.rejects(run('saveReflection', request(), 'teacher'), /預覽/);
    await run('saveReflection');
    assert.equal((await run('getMyReflection', request(), 'other')).response, null);
    assert(!c.writes.some((x) => x.ref.path.includes('outside')));
  } finally {
    c.restore();
  }
});
test('反思防線：未發布、隱藏、班級限制、未開放、台灣截止、禁止重送、非反思、saveActivity不可繞過', async () => {
  for (const mutate of [
    (x) => delete x.published,
    (x) => (x.published.units[0].visibility = 'hidden'),
    (x) => (x.published.classUnits = { 護二甲: [] }),
    (x) => (x.published.chapters[chapterId].opensAt = '2099-10-12T09:00'),
    (x) =>
      (x.published.chapterOverrides = { 護二甲: { [chapterId]: { dueAt: '2000-01-01T23:59' } } }),
    (x) => (x.published.chapters[chapterId].activities[0].type = 'link'),
  ]) {
    const c = memoryDb();
    seed(c);
    try {
      mutate(c.data.get('courses/' + courseId));
      await assert.rejects(run('saveReflection'));
      assert.equal(c.writes.length, 0);
    } finally {
      c.restore();
    }
  }
  const c = memoryDb();
  seed(c);
  try {
    await run('saveReflection');
    c.data.get('courses/' + courseId).published.chapters[
      chapterId
    ].activities[0].reflection.allowEdit = false;
    await assert.rejects(run('saveReflection'), /不允許修改/);
    await assert.rejects(
      run('saveActivity', {
        courseId,
        unitId: 'heart',
        chapterName: chapterId,
        activityId,
        position: 0,
        completed: true,
      }),
      /不能直接標記/,
    );
  } finally {
    c.restore();
  }
});
test('反思答案：未知題目、非字串、控制字元、空必做、超長、錯選項均拒絕且不寫入', async () => {
  const c = memoryDb();
  seed(c);
  try {
    for (const answers of [
      { change: '', activity: '圖表' },
      { change: 'x'.repeat(21), activity: '圖表' },
      { change: 'ok', activity: '錯選項' },
      { change: 'ok', activity: '圖表', extra: 'x' },
      { change: 123, activity: '圖表' },
      { change: 'x\u0000y', activity: '圖表' },
      { change: 'x\ty', activity: '圖表' },
    ])
      await assert.rejects(run('saveReflection', request(answers)));
    assert.equal(c.writes.length, 0);
  } finally {
    c.restore();
  }
});
test('教師彙整：未作答名單、班級、舊快照選項、穩定雜湊、salt私有與保存', async () => {
  const c = memoryDb();
  seed(c);
  try {
    await run('saveReflection');
    let report = await run('getReflections', { ...request(), classId: '護二甲' }, 'teacher');
    assert.equal(report.rosterCount, 2);
    assert.deepEqual(
      report.missing.map((x) => x.studentId),
      ['115002'],
    );
    assert.equal(report.rows.length, 1);
    assert.equal(report.choiceCounts[0].options['圖表'], 1);
    const hash = report.rows[0].researchId;
    assert.match(hash, /^[a-f0-9]{64}$/);
    assert(!JSON.stringify(report).includes('reflectionSalt'));
    assert.equal((await run('getReflections', request(), 'teacher')).rows[0].researchId, hash);
    const course = c.data.get('courses/' + courseId);
    course.published.chapters[chapterId].activities[0].reflection.prompts[1].options = [
      '新的選項',
      '另一選項',
    ];
    report = await run('getReflections', request(), 'teacher');
    assert.equal(report.choiceCounts[0].options['圖表'], 1);
    assert.equal(report.rows[0].promptsSnapshot[1].options[0], '圖表');
    assert.equal(
      (await run('getReflections', { ...request(), classId: '護二乙' }, 'teacher')).rows.length,
      0,
    );
    assert.notEqual(f.reflectionResearchId('other', '115001', course.reflectionSalt), hash);
    assert.notEqual(f.reflectionResearchId(courseId, '115002', course.reflectionSalt), hash);
    await run('saveCourse', { course: course.draft }, 'teacher');
    assert.equal(c.data.get('courses/' + courseId).reflectionSalt, course.reflectionSalt);
  } finally {
    c.restore();
  }
});

test('反思換行後端可保存並正規化，Tab 仍拒絕', async () => {
  const c = memoryDb(); seed(c);
  try {
    await run('saveReflection', request({ change: '甲\r\n乙\r丙', activity: '圖表' }));
    const response = [...c.data.values()].find(x => x.answers?.change);
    assert.equal(response.answers.change, '甲\n乙\n丙');
    await assert.rejects(run('saveReflection', request({ change: '甲\t乙', activity: '圖表' })));
  } finally { c.restore(); }
});
