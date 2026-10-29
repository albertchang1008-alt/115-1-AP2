import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANSWER_INTEGRITY,
  classifyAttemptIntegrity,
  validateLeaveMetrics,
  leaveNotice,
  computeIntegrityUnitStats,
  sortedIntegrityRows,
  integrityReasonText,
} from '../shared/answerIntegrity';
import { applyAttempt, emptyProgress, type Attempt, type Unit } from '../shared/model';
import { createLeaveTracker } from '../src/leaveTracker';
const unit: Pick<Unit, 'id' | 'title' | 'threshold' | 'review'> = {
  id: 'u',
  title: '示範',
  threshold: 100,
};
const attempt = (id: string, seconds = 30, extra: Partial<Attempt> = {}): Attempt => ({
  id,
  uid: id,
  classId: 'A',
  courseId: 'demo',
  unitId: 'u',
  version: 'v1',
  mode: 'quiz',
  full: true,
  score: 100,
  clientAt: 1,
  duration: seconds * 8,
  answers: Array.from({ length: 8 }, (_, i) => ({
    questionId: `q${i}`,
    selected: 'a',
    correct: true,
    seconds: i % 2 ? seconds * 1.8 : seconds * 0.2,
  })),
  ...extra,
});
test('完整測驗嚴格 >3 或 >60，其他模式僅記錄，舊紀錄不回溯', () => {
  for (const [count, seconds, invalid] of [
    [3, 60, false],
    [4, 60, true],
    [3, 61, true],
  ] as const) {
    const a = classifyAttemptIntegrity(
      attempt('x', 30, { leaveCount: count, leaveSeconds: seconds }),
      unit,
    );
    assert.equal(a.integrity === 'left-screen', invalid);
  }
  assert.equal(
    classifyAttemptIntegrity(attempt('old', 30, { integrity: 'left-screen' }), unit).integrity,
    undefined,
  );
  for (const mode of ['review', 'flashcard'] as const)
    assert.equal(
      classifyAttemptIntegrity(attempt('x', 30, { mode, leaveCount: 4, leaveSeconds: 61 }), unit)
        .integrity,
      undefined,
    );
  assert.equal(
    classifyAttemptIntegrity(
      attempt('draw', 30, { full: false, leaveCount: 4, leaveSeconds: 61 }),
      unit,
    ).integrity,
    undefined,
  );
  assert.equal(
    classifyAttemptIntegrity(attempt('review-unit', 30, { leaveCount: 4, leaveSeconds: 61 }), {
      review: {},
    } as any).integrity,
    undefined,
  );
  const invalid = classifyAttemptIntegrity(
    attempt('x', 30, { leaveCount: 4, leaveSeconds: 42 }),
    unit,
  );
  let p = emptyProgress();
  p.units.u = { best: 80, attempts: 1, fullAttempts: 1, updatedAt: 1, passedAt: 123 };
  p = applyAttempt(p, invalid);
  assert.equal(p.units.u.best, 80);
  assert.equal(p.units.u.attempts, 2);
  assert.equal(p.units.u.fullAttempts, 2);
  assert.equal(p.units.u.passedAt, 123);
});
test('拒絕偽造型別、非有限數與不合理範圍；舊欄位缺省相容', () => {
  assert.equal(validateLeaveMetrics({ duration: 20 }), null);
  for (const fields of [
    { leaveCount: '4', leaveSeconds: 20 },
    { leaveCount: 4.1, leaveSeconds: 20 },
    { leaveCount: -1, leaveSeconds: 0 },
    { leaveCount: 1, leaveSeconds: NaN },
    { leaveCount: 1, leaveSeconds: Infinity },
    { leaveCount: 10001, leaveSeconds: 0 },
    { leaveCount: 0, leaveSeconds: 3 },
    { leaveCount: 1 },
    { leaveCount: 1, leaveSeconds: 25 },
  ])
    assert.throws(() => validateLeaveMetrics({ duration: 20, ...fields } as any));
});
test('第三次與45秒預警，已超限不誤稱只需再離開一次', () => {
  assert.match(leaveNotice({ leaveCount: 3, leaveSeconds: 20 }, true), /再離開 1 次/);
  assert.match(leaveNotice({ leaveCount: 1, leaveSeconds: 45 }, true), /接近上限/);
  assert.match(leaveNotice({ leaveCount: 3, leaveSeconds: 45 }, true), /超過 60 秒/);
  assert(!leaveNotice({ leaveCount: 3, leaveSeconds: 45 }, true).includes('${'));
  assert.match(leaveNotice({ leaveCount: 3, leaveSeconds: 61 }, true), /已超過上限/);
  assert.match(leaveNotice({ leaveCount: 4, leaveSeconds: 70 }, false), /本模式僅記錄/);
});
test('首次100分的偏快／CV原因獨立，題數不足或缺秒數不判CV', () => {
  const students = ['fast', 'uniform', 'normal'].map((uid) => ({
    uid,
    classId: 'A',
    name: uid,
    studentId: uid,
  }));
  const fast = attempt('fast', 10),
    uniform = attempt('uniform', 30, {
      answers: attempt('uniform').answers.map((a) => ({ ...a, seconds: 30 })),
    }),
    normal = attempt('normal', 50, { score: 90 });
  const stats = computeIntegrityUnitStats(unit, students, [fast, uniform, normal]);
  assert.equal(stats.medianSeconds, 30);
  assert.deepEqual(stats.rows[0].reasons, ['fast']);
  assert.deepEqual(stats.rows[1].reasons, ['uniform']);
  assert.deepEqual(stats.rows[2].reasons, []);
  assert.match(integrityReasonText(stats.rows[1]), /每題時間平均/);
  const fewer = { ...uniform, answers: uniform.answers.slice(0, 7) };
  assert.equal(computeIntegrityUnitStats(unit, [students[1]], [fewer]).rows[0].firstCv, null);
  const missing = {
    ...uniform,
    answers: uniform.answers.map((a, i) => (i ? a : ({ ...a, seconds: undefined } as any))),
  };
  assert.equal(computeIntegrityUnitStats(unit, [students[1]], [missing]).rows[0].firstCv, null);
  assert.equal(ANSWER_INTEGRITY.fastRatio, 2 / 3);
});
test('統計忽略其他班／模式／複習考；不重新作廢無標記的舊紀錄，支援排序及標記篩選', () => {
  const students = [
    { uid: 'a', classId: 'A', name: 'a', studentId: '01' },
    { uid: 'b', classId: 'A', name: 'b', studentId: '02' },
    { uid: 'test', classId: 'test', name: 'test', studentId: '03' },
  ];
  const old = attempt('a', 30, { score: 80, leaveCount: 4, leaveSeconds: 61 }),
    invalid = attempt('a', 40, { id: 'a2', clientAt: 2, integrity: 'left-screen' }),
    b = attempt('b', 10);
  const s = computeIntegrityUnitStats(unit, students, [
    old,
    invalid,
    b,
    attempt('a', 1, { full: false }),
    attempt('test', 1, { classId: 'test' }),
  ]);
  assert.equal(s.rows.length, 2);
  assert.equal(s.rows[0].best, 80);
  assert.equal(s.rows[0].invalidCount, 1);
  assert.equal(s.rows[0].attempts, 2);
  assert.equal(s.rows[0].firstAverage, 30);
  assert.equal(sortedIntegrityRows(s.rows, 'average', false, false)[0].uid, 'b');
  assert.equal(sortedIntegrityRows(s.rows, 'best', true, true).length, 2);
  assert.deepEqual(
    computeIntegrityUnitStats({ ...unit, review: {} as any }, students, [b]).rows.map(
      (r) => r.attempts,
    ),
    [0, 0],
  );
});
function trackerFixture() {
  let time = 0,
    hidden = false,
    focused = true;
  const doc = new EventTarget() as Document;
  Object.defineProperty(doc, 'hidden', { get: () => hidden });
  doc.hasFocus = () => focused;
  const win = new EventTarget() as Window;
  const notices: any[] = [];
  const tracker = createLeaveTracker(
    doc,
    win,
    (m) => notices.push(m),
    () => time,
  );
  return {
    tracker,
    notices,
    advance: (ms: number) => (time += ms),
    blur() {
      focused = false;
      win.dispatchEvent(new Event('blur'));
    },
    hide() {
      hidden = true;
      doc.dispatchEvent(new Event('visibilitychange'));
    },
    visible() {
      hidden = false;
      doc.dispatchEvent(new Event('visibilitychange'));
    },
    focus() {
      focused = true;
      win.dispatchEvent(new Event('focus'));
    },
  };
}
test('blur＋hidden合併一段離開；返回後才提示，交卷仍離開時結算並卸載監聽', () => {
  const f = trackerFixture();
  f.blur();
  f.hide();
  f.advance(12000);
  f.focus();
  assert.equal(f.notices.length, 0);
  f.visible();
  assert.deepEqual(f.notices, [{ leaveCount: 1, leaveSeconds: 12 }]);
  f.hide();
  f.blur();
  f.advance(1500);
  assert.deepEqual(f.tracker.stop(), { leaveCount: 2, leaveSeconds: 14 });
  f.focus();
  f.visible();
  f.blur();
  f.advance(10000);
  assert.deepEqual(f.tracker.stop(), { leaveCount: 2, leaveSeconds: 14 });
  assert.equal(f.notices.length, 1);
});

test('2/3與CV=0.25邊界不標記，99分即使時間平均也不標記', () => {
  const students = ['a', 'b', 'c'].map((uid, i) => ({
    uid,
    classId: 'A',
    name: uid,
    studentId: String(i),
  }));
  const boundary = computeIntegrityUnitStats(unit, students, [
    attempt('a', 20),
    attempt('b', 30, { score: 80 }),
    attempt('c', 40, { score: 80 }),
  ]);
  assert.deepEqual(boundary.rows[0].reasons, []);
  const cvBoundary = attempt('a', 30, {
    answers: attempt('a').answers.map((a, i) => ({ ...a, seconds: i % 2 ? 5 : 3 })),
  });
  const cv = computeIntegrityUnitStats(unit, [students[0]], [cvBoundary]);
  assert.equal(cv.rows[0].firstCv, 0.25);
  assert.deepEqual(cv.rows[0].reasons, []);
  const notPerfect = attempt('a', 10, {
    score: 99,
    answers: attempt('a').answers.map((a) => ({ ...a, seconds: 10 })),
  });
  assert.deepEqual(
    computeIntegrityUnitStats(unit, [students[0]], [notPerfect]).rows[0].reasons,
    [],
  );
});

test('手機回到visible即結算，即使沒有focus事件；延後focus不重計', () => {
  const f = trackerFixture();
  f.blur();
  f.hide();
  f.advance(45000);
  f.visible();
  assert.deepEqual(f.notices, [{ leaveCount: 1, leaveSeconds: 45 }]);
  f.focus();
  assert.equal(f.notices.length, 1);
  f.tracker.stop();
});
