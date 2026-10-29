import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeUsageStats } from '../shared/usageStats';
import type { Unit } from '../shared/model';
test('使用情況：台灣日界、28天、每日與週去重、熱度、近10分鐘、截止24小時', () => {
  const now = Date.parse('2026-10-30T00:05:00+08:00'),
    uid = 's',
    students = [{ uid, name: '假資料', studentId: '01' }],
    due = now - 60000;
  const unit = { id: 'u', title: '單元', dueAt: new Date(due).toISOString() } as Unit;
  const out = computeUsageStats(
    [
      { uid, kind: 'attempt', unitId: 'u', at: now - 120000 },
      { uid, kind: 'learning', at: now - 120000 },
      { uid, kind: 'progress', at: Date.parse('2026-10-29T23:59:00+08:00') },
      { uid, kind: 'attempt', unitId: 'u', at: due + 1000 },
      { uid: 'test', kind: 'attempt', at: now },
      { uid, kind: 'attempt', at: now + 1 },
      { uid, kind: 'attempt', at: now - 29 * 86400000 },
      { uid, kind: 'learning', at: NaN },
    ],
    students,
    [unit],
    now,
  );
  assert.equal(out.daily.length, 28);
  assert.equal(out.daily.at(-1)!.date, '2026-10-30');
  assert.equal(out.daily.at(-1)!.users, 1);
  assert.equal(out.daily.at(-2)!.users, 1);
  assert.equal(out.weekly.at(-1)!.users, 1);
  assert.equal(
    out.heat.flat().reduce((a, b) => a + b, 0),
    4,
  );
  assert.equal(out.heat[4][0], 3);
  assert.equal(out.heat[3][11], 1);
  assert.equal(out.recent.length, 1);
  assert.equal(out.recent[0].at, due + 1000);
  assert.equal(out.deadlines[0].ratio, 0.5);
});
test('使用情況：空資料保留28天零值、無分母不捏造比例，review不列截止比例', () => {
  const out = computeUsageStats(
    [],
    [],
    [
      { id: 'u', title: '無作答', dueAt: '2026-10-30' },
      { id: 'r', review: {} as any, dueAt: '2026-10-30' },
    ] as Unit[],
    Date.now(),
  );
  assert.equal(out.daily.length, 28);
  assert.ok(out.daily.every((d) => d.users === 0));
  assert.equal(out.deadlines.length, 1);
  assert.equal(out.deadlines[0].ratio, null);
  assert.deepEqual(out.recent, []);
});
