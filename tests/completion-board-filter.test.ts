import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  boardStatuses,
  chapterCellState,
  chapterDetailItems,
  classCompletionSummary,
  completionBoardCourse,
  defaultBoardPreferences,
  detailItemVisible,
  filteredClassCompletionSummary,
  maskStudentId,
  matrixChapters,
  projectionName,
  readBoardPreferences,
  saveBoardPreferences,
  statusMatrix,
} from '../shared/completionBoard';
import { chapterCompletion, emptyProgress, type Course, type Progress } from '../shared/model';
import {
  fixtureCourse as c,
  fixtureRows as rows,
  fixtureNow as now,
} from './fixtures/completion-board-data';

test('遮名：姓名中間字改O、學號留末3碼', () => {
  assert.equal(projectionName('呂驛岑'), '呂O岑');
  assert.equal(projectionName('呂岑'), '呂O');
  assert.equal(projectionName('歐陽娜娜'), '歐OO娜');
  assert.equal(projectionName('Amy'), 'AOy');
  assert.equal(projectionName('林'), 'O');
  assert.equal(projectionName('  '), '');
  assert.equal(maskStudentId('110510045'), '＊＊＊045');
  assert.equal(maskStudentId('12'), '＊＊＊');
});

test('偏好只記狀態篩選；預設只勾進行中；storage失敗退回預設', () => {
  assert.deepEqual(defaultBoardPreferences(), { statuses: ['inProgress'] });
  const mem = new Map<string, string>();
  const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  assert.deepEqual(readBoardPreferences(() => storage), { statuses: ['inProgress'] });
  assert.equal(saveBoardPreferences(() => storage, { statuses: ['notStarted', 'inProgress'] }), true);
  assert.deepEqual(readBoardPreferences(() => storage), { statuses: ['inProgress', 'notStarted'] });
  assert.equal([...mem.values()].some((v) => /name|projection|mask/i.test(v)), false, '不記遮名狀態');
  const broken = () => {
    throw Error('blocked');
  };
  assert.deepEqual(readBoardPreferences(broken), { statuses: ['inProgress'] });
  assert.equal(saveBoardPreferences(broken, { statuses: ['done'] }), false);
  for (const bad of ['{', '{"statuses":[]}', '{"statuses":["x"]}', '{"statuses":"done"}'])
    assert.deepEqual(readBoardPreferences(() => ({ getItem: () => bad })), { statuses: ['inProgress'] });
});

test('全部勾選：矩陣、計量與現行完全相同', () => {
  for (const cl of c.classIds) {
    const course = completionBoardCourse(c, cl),
      m = statusMatrix(course, rows[cl], boardStatuses, now);
    assert.deepEqual(m.chapters.map((x) => x.name), matrixChapters(course).map((x) => x.name));
    assert.equal(m.rows.length, rows[cl].length);
    for (const row of m.rows)
      for (const { name } of m.chapters)
        assert.deepEqual(row.cells.get(name), chapterCellState(course, name, row.student.progress, now));
    const { matched, ...rest } = filteredClassCompletionSummary(c, cl, rows[cl], boardStatuses, now);
    assert.deepEqual(rest, classCompletionSummary(c, cl, rows[cl], now));
    assert.equal(matched, rows[cl].length);
  }
});

test('只勾進行中：只留進行中的格、列、欄；計量為符合人數占全班', () => {
  const cl = '護二甲',
    course = completionBoardCourse(c, cl),
    m = statusMatrix(course, rows[cl], ['inProgress'], now);
  const expected = rows[cl].filter((r) =>
    matrixChapters(course).some(({ name }) => chapterCellState(course, name, r.progress, now).state === 'inProgress'),
  );
  assert.deepEqual(m.rows.map((r) => r.student.studentId), expected.map((r) => r.studentId));
  assert(m.rows.length > 0 && m.rows.length < rows[cl].length);
  for (const row of m.rows) for (const cell of row.cells.values()) assert.equal(cell.state, 'inProgress');
  for (const { name } of m.chapters) assert(m.rows.some((row) => row.cells.has(name)), `${name} 欄應有進行中`);
  assert(m.chapters.length < matrixChapters(course).length, '沒有人進行中的章節整欄隱藏');
  const s = filteredClassCompletionSummary(c, cl, rows[cl], ['inProgress'], now),
    full = classCompletionSummary(c, cl, rows[cl], now);
  assert.equal(s.matched, m.rows.length);
  assert.equal(s.count, full.count);
  assert.equal(s.allDone, full.allDone);
  assert.equal(s.averageDone, full.averageDone);
  for (const { name } of m.chapters) {
    const n = m.rows.filter((row) => row.cells.has(name)).length;
    assert.equal(s.rates[name].done, n);
    assert.equal(s.rates[name].percent, (100 * n) / rows[cl].length);
  }
  const overdueOnly = statusMatrix(course, rows[cl], ['inProgress', 'notStarted'], now, true);
  assert(overdueOnly.rows.every((row) => row.overdue > 0), '與只看有逾期取交集');
});

test('明細：必做活動逐項與chapterCompletion一致；舊鍵相容；選做與YouTube預設選看不列', () => {
  const course = completionBoardCourse(c, '護二甲');
  for (const r of rows.護二甲) {
    const items = chapterDetailItems(course, '血液', r.progress),
      cc = chapterCompletion(course, '血液', r.progress);
    assert.equal(items.activities.length, 1);
    assert.equal(items.activities.filter((x) => x.done).length, cc.completedActivities);
    assert.equal(items.categories.length, 2);
  }
  assert.deepEqual(chapterDetailItems(course, '心臟', emptyProgress()).activities, [], '沒有必做活動的章節');
  const legacy = structuredClone(c) as Course;
  delete legacy.chapters;
  delete legacy.chapterOverrides;
  legacy.units.find((u) => u.id === 'blood1')!.activities = [
    { ...c.chapters!.血液.activities[0] },
  ];
  const lp: Progress = { units: {}, activities: { blood1_read: { position: 7, completed: true, updatedAt: now } } };
  const lc = completionBoardCourse(legacy, '護二甲'),
    li = chapterDetailItems(lc, '血液', lp);
  assert.equal(li.activities.length, 1);
  assert.equal(li.activities[0].done, true, '舊課程 unitId_activityId 相容');
  assert.equal(li.activities[0].position, 7);
  assert.equal(chapterCompletion(lc, '血液', lp).completedActivities, 1);
  const yt = structuredClone(c) as Course;
  const base = { phase: 'after' as const, url: '', description: '' };
  yt.chapters!.心臟.activities = [
    { ...base, id: 'v1', title: '必看影片', type: 'youtube', required: true } as any,
    { ...base, id: 'v2', title: '延伸影片', type: 'youtube' } as any,
    { ...base, id: 'h1', title: '選做圖表', type: 'html', tracking: 'interactive', required: false } as any,
  ];
  const yc = completionBoardCourse(yt, '護二甲'),
    yp: Progress = { units: {}, activities: { 'chapter:心臟_v1': { position: 300, completed: true, updatedAt: now } } };
  const yi = chapterDetailItems(yc, '心臟', yp);
  assert.deepEqual(yi.activities.map((x) => x.activity.id), ['v1']);
  assert.equal(yi.activities[0].done, true);
  assert.equal(chapterCompletion(yc, '心臟', yp).completedActivities, 1);
});

test('明細依篩選顯示：已完成需勾完成；未完成勾任一非完成狀態', () => {
  assert.equal(detailItemVisible(true, ['inProgress']), false);
  assert.equal(detailItemVisible(false, ['inProgress']), true);
  assert.equal(detailItemVisible(true, ['done']), true);
  assert.equal(detailItemVisible(false, ['done']), false);
  assert.equal(detailItemVisible(false, ['notOpen']), true);
});
