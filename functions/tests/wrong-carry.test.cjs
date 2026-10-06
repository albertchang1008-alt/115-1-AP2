// Actual callables and shared front/server fixture; no remote database.
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
const handlers = require('../lib/functions/src/index.js');
const { effectiveWrong, updateWrong, forClass } = require('../lib/shared/model.js');
const fixture = require('../../tests/fixtures/wrong-carry.json');
const { getFirestore } = require('firebase-admin/firestore');
const teacher = { uid: 'teacher', token: { teacher: true } };
const headers = ['課程代碼', '題目ID', '單元', '次單元', '問題', '選項A', '選項B', '正確答案代碼'];
const rows = (text = '題目', answer = 'A') => [
  headers,
  ['ap2', 'q', '血液', 'u', text, '甲', '乙', answer],
  ['ap2', 'removed', '血液', 'u', '第二題', '甲', '乙', 'A'],
];
function memory() {
  const db = getFirestore(),
    originals = { doc: db.doc, batch: db.batch, runTransaction: db.runTransaction },
    data = new Map(),
    reads = [],
    writes = [];
  const put = (path, value) => {
    writes.push(path);
    data.set(path, structuredClone(value));
  };
  let rejectRead;
  db.doc = (path) => ({
    path,
    id: path.split('/').at(-1),
    get: async () => {
      reads.push(path);
      if (path === rejectRead) throw Error('read failed');
      return { exists: data.has(path), data: () => structuredClone(data.get(path)) };
    },
    collection: (name) => ({ doc: (id) => db.doc(`${path}/${name}/${id}`) }),
  });
  db.batch = () => {
    const pending = [];
    return {
      set: (r, v) => pending.push([r.path, v]),
      commit: async () => pending.forEach(([p, v]) => put(p, v)),
    };
  };
  db.runTransaction = async (fn) => {
    const pending = [];
    const result = await fn({
      get: (r) => r.get(),
      set: (r, v) => pending.push([r.path, v]),
      create: (r, v) => pending.push([r.path, v]),
      update: (r, patch) => {
        const value = structuredClone(data.get(r.path) || {});
        for (const [key, v] of Object.entries(patch)) {
          const parts = key.split('.');
          let target = value;
          for (const p of parts.slice(0, -1)) target = target[p] ??= {};
          target[parts.at(-1)] = v;
        }
        pending.push([r.path, value]);
      },
    });
    pending.forEach(([p, v]) => put(p, v));
    return result;
  };
  data.set('courses/ap2', {
    teacherIds: ['teacher'],
    rosterVersion: 2,
    draft: { id: 'ap2', classIds: ['A'], units: [] },
  });
  return {
    data,
    reads,
    writes,
    failRead: (path) => {
      rejectRead = path;
    },
    restore: () => Object.assign(db, originals),
  };
}
async function sync(ctx, rs = rows(), reset = false) {
  const result = await handlers.syncBankTabFromSheet(rs, 'ap2', 'teacher', 'ap2', reset);
  assert.equal(result[0].error, undefined);
  return result[0];
}
test('④ 連續同步→發布：carry 統計、鏈與 forClass 保留；同步零 progress 寫入', async () => {
  const ctx = memory();
  try {
    const sentinel = { sentinel: true };
    ctx.data.set('courses/ap2/progress/student', sentinel);
    const v1 = await sync(ctx),
      v2 = await sync(ctx, rows('改題幹'));
    assert.deepEqual(v2.carry, { kept: 2, changed: 0, removed: 0 });
    const v3 = await sync(ctx, rows('改題幹', 'B').slice(0, 2));
    assert.deepEqual(v3.carry, { kept: 0, changed: 1, removed: 1 });
    const unit = ctx.data.get('courses/ap2').draft.units[0];
    assert.deepEqual(unit.wrongCarry[v2.version], { from: v1.version, drop: [] });
    assert.deepEqual(unit.wrongCarry[v3.version], { from: v2.version, drop: ['q', 'removed'] });
    const draftCourse = ctx.data.get('courses/ap2');
    draftCourse.draft.units[0].visibility = 'current';
    ctx.data.set('courses/ap2', draftCourse);
    const published = await handlers.publishCourse.run({
      auth: teacher,
      data: { courseId: 'ap2' },
    });
    assert.deepEqual(published.units[0].wrongCarry, unit.wrongCarry);
    assert.deepEqual(ctx.data.get('courses/ap2').published.units[0].wrongCarry, unit.wrongCarry);
    assert.deepEqual(forClass(published, 'A').units[0].wrongCarry, unit.wrongCarry);
    assert.deepEqual(ctx.data.get('courses/ap2/progress/student'), sentinel);
    assert(ctx.writes.every((p) => !p.includes('/progress/')));
    assert(ctx.reads.includes(`banks/ap2_u_${v1.version}/grading/answers`));
    const old = { wrong: { [v1.version]: { q: { n: 4, at: 1 } } } };
    assert.deepEqual(effectiveWrong(old, unit, v3.version), {});
  } finally {
    ctx.restore();
  }
});
test('④ 全部重算不讀舊版，未改版不寫 carry，也不新增 carry 結果', async () => {
  const ctx = memory();
  try {
    const v1 = await sync(ctx);
    ctx.reads.length = 0;
    const v2 = await sync(ctx, rows('改題幹'), true);
    assert.equal(v2.carry, 'reset');
    assert.deepEqual(ctx.data.get('courses/ap2').draft.units[0].wrongCarry[v2.version], {
      from: v1.version,
      drop: '*',
    });
    assert(ctx.reads.every((p) => !p.startsWith(`banks/ap2_u_${v1.version}`)));
    const before = structuredClone(ctx.data.get('courses/ap2').draft.units[0]);
    ctx.reads.length = 0;
    const same = await sync(ctx, rows('改題幹'), true);
    assert.equal(same.carry, undefined);
    assert.deepEqual(ctx.data.get('courses/ap2').draft.units[0], before);
    assert(ctx.reads.every((p) => !p.includes('/grading/') && !p.includes('/chunks/')));
  } finally {
    ctx.restore();
  }
});
for (const failure of ['manifest', 'chunk'])
  test('④ 舊版 ' + failure + ' 不可讀：同步成功並回傳 failed', async () => {
    const ctx = memory();
    try {
      const old = await sync(ctx),
        path = `banks/ap2_u_${old.version}`;
      if (failure === 'manifest') ctx.data.delete(path);
      else ctx.failRead(path + '/chunks/' + ctx.data.get(path).chunks[0]);
      const next = await sync(ctx, rows('改題幹'));
      assert.equal(next.carry, 'failed');
      assert.equal(ctx.data.get('courses/ap2').draft.units[0].wrongCarry[next.version].drop, '*');
      assert(ctx.writes.every((p) => !p.includes('/progress/')));
    } finally {
      ctx.restore();
    }
  });
test('④ 新版本第一次伺服器交卷：共用 fixture 延續、重批、實體化，保留舊資料且無舊題庫讀取', async () => {
  const ctx = memory();
  try {
    const unit = {
      ...fixture.unit,
      title: '分類',
      required: true,
      threshold: 80,
      opensAt: '',
      dueAt: '',
      activities: [],
      visibility: 'current',
    };
    const course = { id: 'ap2', classIds: ['A'], units: [unit] };
    ctx.data.set('courses/ap2', {
      teacherIds: ['teacher'],
      rosterVersion: 2,
      draft: course,
      published: course,
    });
    ctx.data.set('courses/ap2/progress/student', fixture.progress);
    ctx.data.set('enrollments/ap2__student@ctcn.edu.tw', { classId: 'A', enabled: true });
    ctx.data.set('banks/ap2_u_v3', {
      count: 2,
      questionOptions: { q: ['a', 'b'], removed: ['a', 'b'] },
    });
    ctx.data.set('banks/ap2_u_v3/grading/answers', { answers: { q: 'a', removed: 'a' } });
    assert.deepEqual(effectiveWrong(fixture.progress.units.u, unit, 'v3'), fixture.expected);
    const auth = {
      uid: 'student',
      token: {
        email: 'student@ctcn.edu.tw',
        email_verified: true,
        firebase: { sign_in_provider: 'google.com' },
      },
    };
    const attempt = {
      id: 'carry-submit',
      courseId: 'ap2',
      unitId: 'u',
      version: 'v3',
      mode: 'review',
      full: false,
      score: 100,
      clientAt: 1,
      duration: 1,
      answers: [{ questionId: 'q', selected: 'b', correct: true, seconds: 1 }],
    };
    const result = await handlers.submitAttempt.run({ auth, data: { attempt } });
    assert.equal(result.attempt.answers[0].correct, false);
    assert.deepEqual(
      result.progress.units.u.wrong.v3,
      updateWrong(fixture.expected, result.attempt.answers, result.progress.units.u.updatedAt)
        .entries,
    );
    assert.equal(result.progress.units.u.wrong.v3.q.n, 5);
    assert.equal(result.progress.units.u.wrong.v3.q.ok, undefined);
    assert.deepEqual(result.progress.units.u.wrong.v3.removed, fixture.expected.removed);
    assert.deepEqual(result.progress.units.u.wrong.v1, fixture.progress.units.u.wrong.v1);
    assert.equal(result.progress.units.u.best, 80);
    assert.equal(result.progress.attempted, undefined);
    assert(
      ctx.reads.every(
        (p) =>
          !p.startsWith('banks/') ||
          ['banks/ap2_u_v3', 'banks/ap2_u_v3/grading/answers'].includes(p),
      ),
    );
  } finally {
    ctx.restore();
  }
});
test('④ 複習考重建不帶入 wrongCarry，不寫 progress', async () => {
  const ctx = memory();
  try {
    const bank = await sync(ctx);
    const data = ctx.data.get('courses/ap2');
    data.draft.units.push({
      id: 'exam',
      title: '複習考',
      group: 'exam',
      bankVersion: 'old',
      review: { history: [] },
      wrongCarry: { old: { from: 'older', drop: [] } },
      wrongCarryOrder: ['old'],
    });
    ctx.data.set('courses/ap2', data);
    await handlers.buildReviewExam.run({
      auth: teacher,
      data: { courseId: 'ap2', name: 'exam', sourceUnitIds: ['u'], drawCount: 1 },
    });
    const exam = ctx.data.get('courses/ap2').draft.units.find((u) => u.id === 'exam');
    assert.equal(exam.wrongCarry, undefined);
    assert.equal(exam.wrongCarryOrder, undefined);
    assert(ctx.writes.every((p) => !p.includes('/progress/')));
    assert(bank.version);
  } finally {
    ctx.restore();
  }
});
