const { test } = require('node:test'),
  assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-stats-unit' });
const h = require('../lib/functions/src/index.js'),
  { memoryDb } = require('./helpers/reflection-memory.cjs'),
  { drainReports } = require('../lib/functions/src/reportDrain.js');
const teacher = { uid: 'teacher', token: { teacher: true } },
  student = {
    uid: 's',
    token: {
      email: 's@example.edu',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    },
  },
  cid = 'stats-test';
function seed(ctx) {
  const u = {
      id: 'u',
      title: 'U',
      visibility: 'current',
      bankVersion: 'v',
      threshold: 100,
      required: true,
      activities: [],
      opensAt: '',
      dueAt: '',
    },
    c = { id: cid, title: '假資料', classIds: ['A', 'test'], units: [u] };
  ctx.data.set('courses/' + cid, {
    teacherIds: ['teacher'],
    rosterVersion: 2,
    published: c,
    draft: c,
  });
  ctx.data.set('enrollments/' + cid + '__s@example.edu', {
    courseId: cid,
    classId: 'A',
    email: 's@example.edu',
    uid: 's',
    enabled: true,
    studentId: '01',
  });
  ctx.data.set('courses/' + cid + '/progress/s', {
    uid: 's',
    classId: 'A',
    units: { u: { best: 80, attempts: 1, updatedAt: 1 } },
    activities: {},
  });
  ctx.data.set('courses/' + cid + '/attempts/old', {
    id: 'old',
    uid: 's',
    classId: 'A',
    unitId: 'u',
    mode: 'quiz',
    full: true,
    clientAt: 1,
    duration: 80,
    score: 80,
    answers: [{ questionId: 'q', seconds: 80 }],
  });
}
const req = (data) => ({ auth: teacher, data: { courseId: cid, classId: 'A', ...data } });
test('rebuild預設dryRun零寫入、確認與跨權限、分批重試冪等、不改best', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    const writes = ctx.writes.length,
      p = await h.rebuildStats.run(req({}));
    assert.equal(p.dryRun, true);
    assert.equal(ctx.writes.length, writes);
    await assert.rejects(h.rebuildStats.run(req({ dryRun: false })));
    await assert.rejects(h.rebuildStats.run({ ...req({}), auth: student }));
    const first = await h.rebuildStats.run(
      req({ dryRun: false, confirm: true, planHash: p.planHash, cursor: 0, limit: 1 }),
    );
    assert.equal(first.nextCursor, 1);
    const saved = ctx.data.get(`courses/${cid}/progress/s`);
    assert.equal(saved.units.u.best, 80);
    assert.equal(saved.units.u.timing.seconds, 80);
    assert.equal(saved.units.u.timing.complete, true);
    await h.rebuildStats.run(
      req({ dryRun: false, confirm: true, planHash: p.planHash, cursor: 0, limit: 1 }),
    );
    assert.deepEqual(ctx.data.get(`courses/${cid}/progress/s`), saved);
    const stats = await h.getAnswerIntegrityStats.run(req({ unitId: 'u' }));
    assert.equal(stats.reads.attempts, 0);
    assert.equal(stats.units[0].rows[0].average, 80);
  } finally {
    ctx.restore();
  }
});
test('完成度摘要：未登入仍列待完成、MCP優先快取及課程變動失效', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    ctx.data.set('enrollments/' + cid + '__new@example.edu', {
      courseId: cid,
      classId: 'A',
      email: 'new@example.edu',
      enabled: true,
      studentId: '02',
    });
    const s = await h.getCompletionDaily.run(req({ refresh: true }));
    assert.equal(s.board.count, 2);
    assert.equal(s.units[0].pending, 2);
    const m = await h.getCompletionSummary.run(req({}));
    assert.equal(m.source, 'completionDaily');
    assert.equal(m.enabledStudents, 2);
    ctx.data.get('courses/' + cid).published.title = '變動';
    const miss = await h.getCompletionDaily.run(req({}));
    assert.equal(miss.cached, false);
  } finally {
    ctx.restore();
  }
});
test('排程drain超過200筆直到清空與60秒預留期限積壓記錄', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    for (let i = 0; i < 225; i++)
      ctx.data.set(`courses/${cid}/attempts/p${i}`, { processed: false });
    let calls = 0;
    const batch = async () => {
      calls++;
      const rows = [...ctx.data]
        .filter(([k, v]) => k.includes('/attempts/') && v.processed === false)
        .slice(0, 20);
      for (const [k, v] of rows) ctx.data.set(k, { ...v, processed: true });
      return { processed: rows.length, hasMore: rows.length === 20 };
    };
    let out = await drainReports(
      require('firebase-admin/firestore').getFirestore(),
      cid,
      batch,
      1000,
      () => 0,
    );
    assert.equal(out.processedRun, 225);
    assert.equal(out.backlog, 0);
    assert.ok(calls > 10);
    ctx.data.set(`courses/${cid}/attempts/new`, { processed: false });
    out = await drainReports(
      require('firebase-admin/firestore').getFirestore(),
      cid,
      batch,
      0,
      () => 0,
    );
    assert.equal(out.backlog, 1);
    assert.equal(out.timedOut, true);
  } finally {
    ctx.restore();
  }
});
test('研究證據超過2000筆完整分頁，超出上限明確錯誤', async () => {
  const ctx = memoryDb();
  try {
    seed(ctx);
    ctx.data.set(`courses/${cid}/research/r`, {
      uid: 's',
      classId: 'A',
      unitId: 'u',
      version: 'v',
      summary: { questions: { q: { lastAt: 0 } } },
    });
    for (let i = 0; i < 2101; i++)
      ctx.data.set(`courses/${cid}/attempts/z${i.toString().padStart(5, '0')}`, {
        uid: 's',
        classId: 'A',
        unitId: 'u',
        version: 'v',
        receivedAt: { toMillis: () => 10 },
        answers: [{ questionId: 'q', correct: true }],
      });
    // Test-double clone cannot copy Timestamp methods; use real Timestamp, normalized by the helper.
    for (const [k, v] of ctx.data)
      if (k.includes('/attempts/z'))
        v.receivedAt = require('firebase-admin/firestore').Timestamp.fromMillis(10);
    const out = await h.getExplanationResearchEvidence.run(req({ unitId: 'u' }));
    assert.equal(out.rows.length, 1);
    assert.equal(out.rows[0].followUp.laterAttempts, 2101);
    const { readPages } = require('../lib/functions/src/statsAggregation.js');
    await assert.rejects(
      readPages(
        () =>
          require('firebase-admin/firestore').getFirestore().collection(`courses/${cid}/attempts`),
        1000,
      ),
      (e) => e.code === 'resource-exhausted',
    );
  } finally {
    ctx.restore();
  }
});
