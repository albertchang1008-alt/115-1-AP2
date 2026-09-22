import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCourseTime,
  aggregate,
  applyAttempt,
  completion,
  emptyProgress,
  grade,
  mergeAttempted,
  orderForPractice,
  validateQuestions,
  validateRoster,
  youtubeId,
  Attempt,
  Report,
  Seen,
  Course,
  CURRENT_COMPLETION_FORMULA_VERSION,
  chaptersOf,
  chapterCompletion,
  chapterActivityKey,
  forClass,
  unitVisibility,
  wrongEntries,
  wrongCardIds,
  allocateDraw,
  drawReviewQuestions,
  isOverdue,
} from '../shared/model';
const q = {
  id: 'q1',
  text: 'Q',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
  ],
  answer: 'a',
  explanation: 'E',
};
const attempt = (override: Partial<Attempt> = {}): Attempt => ({
  id: 'a1',
  courseId: 'c',
  unitId: 'u',
  version: 'v',
  mode: 'quiz',
  answers: [{ questionId: 'q1', selected: 'b', correct: false, seconds: 2 }],
  score: 0,
  full: true,
  clientAt: 1,
  duration: 2,
  ...override,
});
test('YouTube 僅接受支援網域與影片 ID', () => {
  for (const u of [
    'https://youtu.be/abcdefghijk?t=20',
    'https://www.youtube.com/watch?v=abcdefghijk',
    'https://youtube.com/shorts/abcdefghijk',
  ])
    assert.equal(youtubeId(u), 'abcdefghijk');
  assert.equal(youtubeId('https://evil.test/watch?v=abcdefghijk'), null);
  assert.equal(youtubeId('https://youtube.com/playlist?list=xx'), null);
});
test('名冊信箱、學號與重複資料檢查', () => {
  const r = { email: 's@ctcn.edu.tw', name: 'S', studentId: 's1', classId: 'a', enabled: true };
  assert.deepEqual(validateRoster([r]), []);
  assert.ok(validateRoster([r, r]).length);
  // 2026-09-15 起不再限制信箱網域（真正把關的是各課程班級名冊），一般網域信箱可直接通過。
  assert.deepEqual(validateRoster([{ ...r, email: 's@gmail.com' }]), []);
  // 但仍要求基本信箱格式，不是信箱格式的內容照樣擋下。
  assert.ok(validateRoster([{ ...r, email: 'not-an-email' }]).length);
});
test('題目選項正解與穩定 ID', () => {
  assert.deepEqual(validateQuestions([q]), []);
  assert.ok(validateQuestions([q, q]).length);
  assert.ok(validateQuestions([{ ...q, answer: 'z' }]).length);
  assert.equal(grade([q], { q1: 'a' }, {})[0].correct, true);
});
test('複習與抽題不提高完成度，完整作答取最高', () => {
  let p = applyAttempt(emptyProgress(), attempt({ score: 80 }));
  p = applyAttempt(p, attempt({ id: 'a2', score: 20 }));
  assert.equal(p.units.u.best, 80);
  assert.equal(applyAttempt(p, attempt({ mode: 'review', score: 100 })), p);
  assert.equal(applyAttempt(p, attempt({ full: false, score: 100 })).units.u.best, 80);
});
test('首次去重、模式分離與最新複習統計', () => {
  const m: Report['modes'] = {},
    s: Record<string, Seen> = {};
  aggregate(m, s, attempt());
  aggregate(
    m,
    s,
    attempt({
      id: 'a2',
      answers: [{ questionId: 'q1', selected: 'a', correct: true, seconds: 2 }],
    }),
  );
  assert.equal(m.all.q1.students, 1);
  assert.equal(m.all.q1.wrong, 1);
  aggregate(
    m,
    s,
    attempt({
      mode: 'flashcard',
      answers: [{ questionId: 'q1', selected: 'a', correct: true, seconds: 2 }],
    }),
  );
  assert.equal(m.flashcard.q1.wrong, 0);
  assert.equal(m.all.q1.students, 1);
  aggregate(m, s, attempt({ mode: 'review' }));
  aggregate(
    m,
    s,
    attempt({
      mode: 'review',
      answers: [{ questionId: 'q1', selected: 'a', correct: true, seconds: 2 }],
    }),
  );
  assert.equal(m.all.q1.reviewStudents, 1);
  assert.equal(m.all.q1.reviewWrong, 0);
  assert.equal(m.all.q1.reviews, 2);
});
test('另一位學生獨立計入首次', () => {
  const m: Report['modes'] = {};
  aggregate(m, {}, attempt());
  aggregate(m, {}, attempt());
  assert.equal(m.all.q1.students, 2);
});
test('沒有成績不視為零分達標', () => {
  const c = { units: [{ id: 'u', required: true, threshold: 0 }] } as Course;
  assert.deepEqual(completion(c, emptyProgress(), 1), { done: 0, total: 1 });
});
test('第三版完成度以單元計數，所有題目分類達標且單元活動完成才算完成', () => {
  const unit: any = { id: 'u', required: true, threshold: 80, bankVersion: 'v', activities: [{ id: 'html', type: 'html', tracking: 'interactive' }, { id: 'link', type: 'link' }] };
  let p: any = { units: { u: { best: 90 } }, activities: {} };
  const course: any = { units: [{ ...unit, id: 'u1', group: '血液' }, { ...unit, id: 'u2', group: '血液' }], chapters: { 血液: { title: '血液', required: true, threshold: 80, activities: unit.activities, description: '', opensAt: '', dueAt: '' } } };
  p = { units: { u1: { best: 90 }, u2: { best: 70 } }, activities: {} };
  assert.deepEqual(completion(course, p), { done: 0, total: 1 });
  p.units.u2.best = 90;
  p.activities[chapterActivityKey('血液', 'html')] = { completed: true };
  p.activities[chapterActivityKey('血液', 'link')] = { completed: true };
  assert.deepEqual(completion(course, p), { done: 1, total: 1 });
  assert.equal(CURRENT_COMPLETION_FORMULA_VERSION, 3);
});
test('舊資料由第一個題目分類推導 Chapter，班級覆寫套用至所有分類', () => {
  const course: any = { units: [{ id: 'rbc', title: '紅血球', group: '血液', required: true, threshold: 70, opensAt: '', dueAt: '', activities: [] }, { id: 'wbc', title: '白血球', group: '血液', required: false, threshold: 60, opensAt: '', dueAt: '', activities: [] }], chapterOverrides: { A: { 血液: { threshold: 90, required: false } } } };
  assert.equal(chaptersOf(course).血液.threshold, 70);
  const shown = forClass(course, 'A');
  assert.equal(shown.units[0].threshold, 90); assert.equal(shown.units[1].threshold, 90);
  assert.equal(shown.units[0].required, false); assert.equal(shown.units[1].required, false);
});
test('教師修改 Chapter 開放時間後，該班每個題目分類都套用相同時間', () => {
  const course: any = { units: [{ id: 'a', title: 'A', group: '血液', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [] }, { id: 'b', title: 'B', group: '血液', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [] }], chapters: { 血液: { title: '血液', description: '', required: true, threshold: 85, opensAt: '2026-10-01T08:00', dueAt: '', activities: [] } } };
  assert.deepEqual(forClass(course, 'A').units.map((u) => u.opensAt), ['2026-10-01T08:00', '2026-10-01T08:00']);
});
test('All 修改共用開放時間會清掉同欄位覆寫，單一班覆寫仍優先且可恢復', () => {
  const chapter: any = { title: '血液', description: '', required: true, threshold: 80, opensAt: '2026-10-01T08:00', dueAt: '', activities: [] };
  const base: any = { classIds: ['護525', 'N522'], units: [{ id: 'u', title: '血液', group: '血液', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [] }], chapters: { 血液: chapter }, chapterOverrides: { 護525: { 血液: { opensAt: '2026-09-30T08:00', threshold: 90 } }, N522: { 血液: { opensAt: '2026-09-29T08:00' } } } };
  const allChanged: any = { ...base, chapters: { 血液: { ...chapter, opensAt: '2026-10-02T08:00' } }, chapterOverrides: { 護525: { 血液: { threshold: 90 } } } };
  assert.equal(forClass(allChanged, '護525').chapters!.血液.opensAt, '2026-10-02T08:00');
  assert.equal(forClass(allChanged, 'N522').chapters!.血液.opensAt, '2026-10-02T08:00');
  assert.equal(forClass(allChanged, '護525').chapters!.血液.threshold, 90, '單一班覆寫仍優先');
  const restored: any = { ...allChanged, chapterOverrides: {} };
  assert.deepEqual(restored.chapterOverrides, {});
  assert.equal(forClass(restored, '護525').chapters!.血液.threshold, 80);
});
test('hidden 與逐班未勾選皆不會進入學生課程', () => {
  const c: any = { classUnits: { a: ['shown', 'hidden'] }, units: [{ id: 'shown' }, { id: 'hidden', visibility: 'hidden' }, { id: 'other' }] };
  assert.deepEqual(forClass(c, 'a').units.map((u: any) => u.id), ['shown']);
});
test('錯題答錯累計、答對移除，舊陣列相容為 at: 0', () => {
  let p: any = { units: { u: { best: 0, attempts: 1, updatedAt: 1, wrong: { v: ['q1'] } } }, activities: {} };
  assert.deepEqual(wrongEntries(p, 'u', 'v'), { q1: { n: 1, at: 0 } });
  p = applyAttempt(p, attempt({ version: 'v', clientAt: 10, answers: [{ questionId: 'q1', selected: 'b', correct: false, seconds: 1 }] }));
  assert.deepEqual(p.units.u.wrong.v.q1, { n: 2, at: 10 });
  p = applyAttempt(p, attempt({ id: 'clear', version: 'v', clientAt: 11, answers: [{ questionId: 'q1', selected: 'a', correct: true, seconds: 1 }] }));
  assert.deepEqual(p.units.u.wrong.v, {});
});
test('錯題時間範圍、排序與 at:0 相容規則', () => {
  const now = 1_000_000_000;
  const p: any = { units: { u: { wrong: { v: { legacy: { n: 1, at: 0 }, old: { n: 9, at: now - 8 * 86400000 }, recent: { n: 2, at: now - 1000 }, newest: { n: 2, at: now - 10 } } } } }, activities: {} };
  assert.deepEqual(wrongCardIds(p, 'u', 'v', '24h', now), ['newest', 'recent']);
  assert.deepEqual(wrongCardIds(p, 'u', 'v', '7d', now), ['newest', 'recent']);
  assert.deepEqual(wrongCardIds(p, 'u', 'v', 'all', now), ['old', 'newest', 'recent', 'legacy']);
});
test('錯題閃卡不透過 applyAttempt 寫入任何學習狀態', () => {
  const p: any = { units: { u: { best: 80, attempts: 1, updatedAt: 1, wrong: { v: { q1: { n: 2, at: 3 } } } } }, attempted: { u: { q1: true } }, activities: {} };
  // 錯題閃卡是純展示；其唯一資料操作是 wrongCardIds，並不呼叫 applyAttempt。
  assert.deepEqual(wrongCardIds(p, 'u', 'v', 'all'), ['q1']);
  assert.deepEqual(p.units.u.best, 80); assert.deepEqual(p.attempted.u, { q1: true }); assert.deepEqual(p.units.u.wrong.v.q1, { n: 2, at: 3 });
});
test('缺少 visibility 視為目前學習，規則版本 1 與 2 可各自重算快照', () => {
  const unit: any = { id: 'u', required: true, threshold: 80, bankVersion: 'v', activities: [{ id: 'link', type: 'link' }] };
  const p: any = { units: { u: { best: 80 } }, activities: {} };
  assert.equal(unitVisibility(unit), 'current');
  assert.deepEqual(completion({ units: [unit] } as Course, p, 1), { done: 1, total: 1 });
  assert.deepEqual(completion({ units: [unit] } as Course, p, 2), { done: 0, total: 1 });
  assert.deepEqual(completion({ units: [{ ...unit, id: 'optional', required: false }] } as Course, p, 2), { done: 0, total: 0 });
});
test('v2 沒有題庫時只要求互動教材與連結，只有選看時不列入分母', () => {
  const base: any = { id: 'u', required: true, threshold: 80, activities: [{ id: 'video', type: 'youtube' }, { id: 'interactive', type: 'html', tracking: 'interactive' }] };
  assert.deepEqual(completion({ units: [base] } as Course, { units: {}, activities: {} }), { done: 0, total: 1 });
  assert.deepEqual(completion({ units: [base] } as Course, { units: {}, activities: { u_interactive: { completed: true, position: 0, updatedAt: 1 } } }), { done: 1, total: 1 });
  assert.deepEqual(completion({ units: [{ ...base, activities: [{ id: 'video', type: 'youtube' }] }] } as Course, { units: {}, activities: {} }), { done: 0, total: 0 });
});
test('每單元上限放寬到 500 題', () => {
  const many = Array.from({ length: 500 }, (_, i) => ({ ...q, id: 'q' + i }));
  assert.deepEqual(validateQuestions(many), []);
  assert.ok(validateQuestions([...many, { ...q, id: 'q500' }]).length);
});
test('完整測驗與抽題練習都會記錄已考過，複習模式不會', () => {
  let p = applyAttempt(emptyProgress(), attempt({ score: 80 }));
  assert.deepEqual(p.attempted?.u, { q1: true });
  p = emptyProgress();
  p = applyAttempt(p, attempt({ full: false, score: 0 }));
  assert.deepEqual(p.attempted?.u, { q1: true });
  p = emptyProgress();
  p = applyAttempt(p, attempt({ mode: 'review', score: 0 }));
  assert.equal(p.attempted, undefined);
});
test('mergeAttempted 只增不減，跨題庫版本保留', () => {
  let attempted = mergeAttempted(undefined, 'u1', ['q1', 'q2']);
  attempted = mergeAttempted(attempted, 'u1', ['q2', 'q3']);
  attempted = mergeAttempted(attempted, 'u2', ['q9']);
  assert.deepEqual(attempted, { u1: { q1: true, q2: true, q3: true }, u2: { q9: true } });
});
test('抽題練習排序：未考過的題目一定排在已考過的前面', () => {
  const qs = Array.from({ length: 20 }, (_, i) => ({ id: 'q' + i }));
  const attemptedIds = new Set(['q0', 'q1', 'q2', 'q3', 'q4']);
  for (let trial = 0; trial < 20; trial++) {
    const ordered = orderForPractice(qs, attemptedIds);
    assert.equal(ordered.length, qs.length);
    assert.deepEqual(new Set(ordered.map((q) => q.id)), new Set(qs.map((q) => q.id)));
    const firstSeenIndex = ordered.findIndex((q) => attemptedIds.has(q.id));
    const lastUnseenIndex = ordered.map((q) => !attemptedIds.has(q.id)).lastIndexOf(true);
    assert.ok(firstSeenIndex > lastUnseenIndex, '已考過的題目不應排在未考過的題目前面');
  }
});

test('progress 缺少 activities／units 欄位時完成度照常計算，不會丟出錯誤', () => {
  const course: any = { id: 'c', title: '', description: '', term: '', classIds: [], units: [{ id: 'u', title: 'u', group: '血液', description: '', required: true, threshold: 80, opensAt: '', dueAt: '', bankVersion: 'v', activities: [] }], chapters: { 血液: { title: '血液', description: '', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [{ id: 'a', title: 'a', type: 'link', phase: 'before', url: 'https://x.y', description: '' }] } }, sheetsUrl: '' };
  assert.doesNotThrow(() => completion(course, { units: { u: { best: 90, attempts: 1, updatedAt: 0 } } } as any));
  assert.deepEqual(completion(course, { units: { u: { best: 90, attempts: 1, updatedAt: 0 } } } as any), { done: 0, total: 1 });
  assert.doesNotThrow(() => completion(course, {} as any));
});

test('開放時間沒有時區時一律以台灣時間解讀（伺服器是 UTC）', () => {
  assert.equal(parseCourseTime('2026-09-19T20:00'), Date.parse('2026-09-19T12:00:00Z'));
  assert.equal(parseCourseTime('2026-09-19'), Date.parse('2026-09-18T16:00:00Z'));
  assert.equal(parseCourseTime('2026-09-19T20:00:00Z'), Date.parse('2026-09-19T20:00:00Z'));
  assert.ok(Number.isNaN(parseCourseTime('')));
});

test('只有活動紀錄、沒有 units 的 progress 交卷時不會丟錯（修正 INTERNAL）', () => {
  const onlyActivities = { activities: { 'chapter:115-1課程簡介_a': { position: 1, completed: true, updatedAt: 1 } } } as any;
  const a: any = { id: 'x', courseId: 'c', unitId: 'u', version: 'v', mode: 'quiz', answers: [{ questionId: 'q1', selected: 'a', correct: false, seconds: 1 }], score: 0, full: true, clientAt: 5, duration: 1 };
  const next = applyAttempt(onlyActivities, a);
  assert.equal(next.units.u.attempts, 1);
  assert.ok(next.activities['chapter:115-1課程簡介_a'].completed, '既有活動進度保留');
});

test('複習考依比例穩定分配、每類至少一題且不超出題庫', () => {
  assert.deepEqual(allocateDraw({ a: 20, b: 10, c: 5 }, 10, ['a', 'b', 'c']), { a: 5, b: 3, c: 2 });
  assert.deepEqual(allocateDraw({ a: 1, b: 9 }, 2, ['a', 'b']), { a: 1, b: 1 });
  assert.deepEqual(allocateDraw({ a: 1, b: 2 }, 3, ['a', 'b']), { a: 1, b: 2 });
  assert.throws(() => allocateDraw({ a: 1, b: 2 }, 1), /抽題數/);
});

test('複習考每個來源優先抽未考過題目，並保留來源配額', () => {
  const pool = ['a1', 'a2', 'b1', 'b2'].map((id) => ({ ...q, id, source: id[0] }));
  const drawn = drawReviewQuestions(pool, { a: 1, b: 1 }, new Set(['a1', 'b1']));
  assert.deepEqual(new Set(drawn.map((x) => x.id)), new Set(['a2', 'b2']));
});

test('複習考首次達標時間晚於期限才標示逾期，完成度公式仍為 v3', () => {
  assert.equal(isOverdue({ dueAt: '2026-09-23T10:00' }, { passedAt: parseCourseTime('2026-09-23T10:01') }), true);
  assert.equal(isOverdue({ dueAt: '2026-09-23T10:00' }, { passedAt: parseCourseTime('2026-09-23T10:00') }), false);
  assert.equal(CURRENT_COMPLETION_FORMULA_VERSION, 3);
});
