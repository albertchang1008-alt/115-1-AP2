import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addTiming, emptyTiming, timingUnitStats, withoutTiming } from '../shared/timingStats';
import { applyAttempt, emptyProgress, type Attempt } from '../shared/model';
import { buildUsageDaily, combineUsageDaily, dayStart } from '../shared/usageStats';
const unit = { id: 'u', title: 'u' },
  student = { uid: 's', studentId: '01', name: '假資料', classId: 'A' };
const a = (id: string, at: number, extra: any = {}): Attempt => ({
  id,
  clientAt: at,
  courseId: 'c',
  unitId: 'u',
  mode: 'quiz',
  full: true,
  version: 'v',
  duration: 80,
  score: 100,
  answers: Array.from({ length: 8 }, (_, i) => ({
    questionId: 'q' + i,
    selected: 'a',
    correct: true,
    seconds: 10,
  })),
  ...extra,
});
test('同批作答亂序累加＝重算：首次tie、invalid、非完整、缺秒數與review排除', () => {
  const attempts = [
    a('later', 20, { leaveCount: 4, leaveSeconds: 61, integrity: 'left-screen' }),
    a('z', 10),
    a('a', 10, { duration: 40 }),
    a('draw', 5, { full: false }),
    a('review', 1, { mode: 'review' }),
  ];
  let p = emptyProgress();
  for (const x of attempts) p = applyAttempt(p, x, unit);
  let rebuilt = emptyTiming();
  for (const x of [...attempts].reverse()) rebuilt = addTiming(rebuilt, x, unit)!;
  assert.deepEqual(p.units.u.timing, rebuilt);
  assert.equal(rebuilt.first!.id, 'a');
  assert.equal(rebuilt.attempts, 3);
  assert.equal(rebuilt.seconds, 200);
  assert.equal(rebuilt.invalidCount, 1);
  assert.equal(addTiming(undefined, a('r', 1), { review: {} as any }), undefined);
  assert.equal(withoutTiming(p).units.u.timing, undefined);
  assert.ok(p.units.u.timing);
});
test('既有未補算progress不把局部累加冒充完整；零題及缺資料不造CV', () => {
  const p = applyAttempt(
    { units: { u: { best: 80, attempts: 2, updatedAt: 1 } }, activities: {} },
    a('new', 3),
    unit,
  );
  assert.equal(p.units.u.timing!.complete, false);
  const out = timingUnitStats(unit, [student], new Map([['s', p]]));
  assert.equal(out.missingTiming, 1);
  assert.equal(out.rows[0].average, null);
  const t = addTiming(undefined, a('x', 1, { answers: [], duration: NaN }), unit)!;
  assert.equal(t.questions, 0);
  assert.equal(t.first!.cv, null);
});
test('每日摘要合併等同逐筆、週跨台灣日界去重、12格熱度與截止比例', () => {
  const start = dayStart('2026-10-30'),
    now = start + 1000,
    units = [{ ...unit, dueAt: new Date(start).toISOString() }] as any;
  const records = [
    { uid: 's', kind: 'attempt' as const, unitId: 'u', at: start - 1 },
    { uid: 's', kind: 'learning' as const, at: start + 1 },
  ];
  const days = ['2026-10-29', '2026-10-30'].map((date) =>
    buildUsageDaily(records, [student], units, 'A', date, now),
  );
  assert.equal(days[0].slots[11], 1);
  assert.equal(days[1].slots[0], 1);
  const merged = combineUsageDaily(days, records, [student], units, now);
  assert.equal(merged.weekly.at(-1)!.users, 1);
  assert.equal(
    merged.heat.flat().reduce((a, b) => a + b, 0),
    2,
  );
  assert.equal(merged.deadlines[0].ratio, 1);
  assert.equal(merged.recent.length, 1);
});
