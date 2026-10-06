import { wrongCarryDrop, appendWrongCarry } from '../shared/wrongCarry';
import carryFixture from './fixtures/wrong-carry.json';
import { mixedScope, selectPracticeRows } from '../shared/practice';
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
  unitCompletion,
  chapterActivityKey,
  forClass,
  unitVisibility,
  wrongEntries,
  effectiveWrong,
  updateWrong,
  wrongGroups,
  reviewIds,
  reviewCounts,
  taipeiDay,
  allocateDraw,
  drawReviewQuestions,
  isOverdue,
  reviewAttemptIsFull,
  isRequiredActivity,
  itemStatusForCategory,
  itemStatusForActivity,
  summarizeUnit,
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
test('複習、閃卡與抽題不提高完成度，只有完整測驗取最高', () => {
  let p = applyAttempt(emptyProgress(), attempt({ score: 80 }));
  p = applyAttempt(p, attempt({ id: 'a2', score: 20 }));
  assert.equal(p.units.u.best, 80);
  assert.equal(applyAttempt(p, attempt({ mode: 'review', score: 100 })).units.u.best, 80);
  assert.equal(applyAttempt(p, attempt({ mode: 'flashcard', score: 100 })).units.u.best, 80);
  assert.equal(applyAttempt(p, attempt({ full: false, score: 100 })).units.u.best, 80);
});
test('活動必做覆寫優先，未設定沿用既有類型推導', () => {
  assert.equal(isRequiredActivity({ type: 'youtube', required: true }), true);
  assert.equal(isRequiredActivity({ type: 'link', required: false }), false);
  assert.equal(isRequiredActivity({ type: 'link' }), true);
  assert.equal(isRequiredActivity({ type: 'html', tracking: 'interactive' }), true);
  assert.equal(isRequiredActivity({ type: 'youtube' }), false);
});
test('進度狀態函式辨識分類、活動與單元待辦', () => {
  const base: any = { id: 'u', title: '分類', required: true, threshold: 80, opensAt: '', dueAt: '2026-09-20T00:00', bankVersion: 'v', questionCount: 10, activities: [{ id: 'a', title: '互動', type: 'html', tracking: 'interactive', phase: 'during', required: true }] };
  let p: any = { units: { u: { best: 70, attempts: 1, updatedAt: 1, wrong: { v: { q: { n: 1, at: 1 } } } } }, attempted: { u: { q: true } }, activities: { u_a: { position: 2, completed: false, updatedAt: 1 } } };
  assert.equal(itemStatusForCategory(base, p, Date.parse('2026-09-01')).status, 'partial');
  assert.equal(itemStatusForActivity(base.activities[0], 'u', p).status, 'partial');
  const s = summarizeUnit(base, p, Date.parse('2026-09-21'));
  assert.equal(s.state, 'overdue'); assert.equal(s.doneCount, 0); assert.equal(s.next?.kind, 'category');
  assert.equal(itemStatusForCategory({ ...base, opensAt: '2026-10-01T00:00' }, p, Date.parse('2026-09-01')).status, 'locked');
  p = { units: {}, activities: {} };
  assert.equal(itemStatusForCategory(base, p).status, 'todo');
  const optional = summarizeUnit({ ...base, required: false, activities: [{ ...base.activities[0], required: false }] }, p, Date.parse('2026-09-21'));
  assert.equal(optional.state, 'done'); assert.equal(optional.totalCount, 0); assert.equal(optional.next?.required, false);
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
test('第三版完成度以單元計數，所有必做題目分類達標且必做活動完成才算完成', () => {
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
test('v3 採計必做單元內所有已發布分類，忽略舊分類 required 值', () => {
  const base: any = { title: '分類', group: '單元', threshold: 80, opensAt: '', dueAt: '', activities: [], bankVersion: 'v' };
  const course: any = { units: [{ ...base, id: 'required', required: true }, { ...base, id: 'optional', required: false }, { ...base, id: 'empty', required: true, bankVersion: '' }], chapters: { 單元: { title: '單元', description: '', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [] } } };
  const progress: any = { units: { required: { best: 90 } }, activities: {} };
  assert.equal(chapterCompletion(course, '單元', progress, 3).done, false);
  assert.equal(chapterCompletion(course, '單元', progress, 3).totalRequired, 2);
  const summary = summarizeUnit({ ...course.chapters.單元, id: '單元', bankVersion: '', categories: course.units, activityOwnerKey: 'chapter:單元' }, progress);
  assert.equal(summary.state, 'inProgress');
  assert.deepEqual(summary.requiredItems.map((item) => item.id), ['required', 'optional']);
  assert.deepEqual(summary.optionalItems, []);
});
test('summarizeUnit 不把未發布題庫的分類列入進度項目', () => {
  const published: any = { id: 'published', title: '已發布', required: true, threshold: 80, opensAt: '', dueAt: '', bankVersion: 'v', activities: [] };
  const unpublished: any = { ...published, id: 'unpublished', title: '未發布', bankVersion: '' };
  const summary = summarizeUnit({ ...published, id: 'chapter', bankVersion: '', categories: [published, unpublished] }, emptyProgress());
  assert.deepEqual([...summary.requiredItems, ...summary.optionalItems].map((item) => item.id), ['published']);
});
test('選看單元把其下分類與活動全部視為選做', () => {
  const category: any = { id: 'category', title: '分類', required: true, threshold: 80, opensAt: '', dueAt: '', bankVersion: 'v', activities: [] };
  const activity: any = { id: 'read', title: '閱讀', type: 'link', phase: 'before', url: '', description: '', required: true };
  const summary = summarizeUnit({ ...category, id: 'chapter', required: false, bankVersion: '', categories: [category], activities: [activity] }, emptyProgress());
  assert.equal(summary.requiredItems.length, 0);
  assert.deepEqual(summary.optionalItems.map((item) => item.id), ['category', 'read']);
  assert.equal(summary.next?.required, false);
});
test('summarizeUnit 與 v3 chapterCompletion 對分類、活動及舊鍵一致', () => {
  const category: any = { id: 'cat', title: '必做分類', group: '單元', required: true, threshold: 80, opensAt: '', dueAt: '', bankVersion: 'v', activities: [] };
  const activity: any = { id: 'read', title: '閱讀', type: 'link', phase: 'before', url: 'https://example.com', description: '' };
  const course: any = { units: [category, { ...category, id: 'optional', title: '選做分類', required: false }, { ...category, id: 'empty', title: '無題庫', bankVersion: '' }], chapters: { 單元: { title: '單元', description: '', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [activity] } } };
  const cases: any[] = [
    { units: {}, activities: {} },
    { units: { cat: { best: 90 } }, activities: {} },
    { units: { cat: { best: 90 } }, activities: { 'chapter:單元_read': { completed: true } } },
    { units: { cat: { best: 90 }, optional: { best: 0 } }, activities: { 'chapter:單元_read': { completed: true } } },
  ];
  for (const progress of cases) {
    const summary = summarizeUnit({ ...course.chapters.單元, id: '單元', bankVersion: '', categories: course.units, activityOwnerKey: 'chapter:單元' }, progress);
    assert.equal(summary.state === 'done', chapterCompletion(course, '單元', progress, 3).done);
  }
  const legacyCourse: any = { units: [{ ...category, group: undefined, title: '舊單元', activities: [activity] }] };
  const legacyProgress: any = { units: { cat: { best: 90 } }, activities: { cat_read: { completed: true } } };
  const legacySummary = summarizeUnit({ ...chaptersOf(legacyCourse).舊單元, id: '舊單元', bankVersion: '', categories: legacyCourse.units, activityOwnerKey: 'chapter:舊單元' }, legacyProgress);
  assert.equal(legacySummary.state === 'done', chapterCompletion(legacyCourse, '舊單元', legacyProgress, 3).done);
});
test('舊資料由第一個題目分類推導 Chapter，班級覆寫套用至所有分類', () => {
  const course: any = { units: [{ id: 'rbc', title: '紅血球', group: '血液', required: true, threshold: 70, opensAt: '', dueAt: '', bankVersion: 'v', activities: [] }, { id: 'wbc', title: '白血球', group: '血液', required: false, threshold: 60, opensAt: '', dueAt: '', bankVersion: 'v', activities: [] }], chapterOverrides: { A: { 血液: { threshold: 90, required: false } } } };
  assert.equal(chaptersOf(course).血液.threshold, 70);
  const shown = forClass(course, 'A');
  assert.equal(shown.units[0].threshold, 90); assert.equal(shown.units[1].threshold, 90);
  assert.equal(shown.chapters!.血液.required, false);
  assert.equal(shown.units[0].required, false); assert.equal(shown.units[1].required, false);
  assert.equal(unitCompletion(shown.units[0], emptyProgress(), 1).eligible, false);
  assert.equal(unitCompletion(shown.units[0], emptyProgress(), 2).eligible, false);
  const required = forClass(course, 'B');
  assert.equal(unitCompletion(required.units[0], emptyProgress(), 1).eligible, true);
  assert.equal(unitCompletion(required.units[0], emptyProgress(), 2).eligible, true);
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
  assert.deepEqual(wrongEntries(p, 'u', 'v', { id: 'u', bankVersion: 'v' }), { q1: { n: 1, at: 0 } });
  p = applyAttempt(p, attempt({ version: 'v', clientAt: 10, answers: [{ questionId: 'q1', selected: 'b', correct: false, seconds: 1 }] }));
  assert.deepEqual(p.units.u.wrong.v.q1, { n: 2, at: 10 });
  p = applyAttempt(p, attempt({ id: 'clear', version: 'v', clientAt: 11, answers: [{ questionId: 'q1', selected: 'a', correct: true, seconds: 1 }] }));
  assert.deepEqual(p.units.u.wrong.v.q1, { n: 2, at: 10, ok: 11 });
});
test('錯題閃卡不透過 applyAttempt 寫入任何學習狀態', () => {
  const p: any = { units: { u: { best: 80, attempts: 1, updatedAt: 1, wrong: { v: { q1: { n: 2, at: 3 } } } } }, attempted: { u: { q1: true } }, activities: {} };
  // 錯題閃卡是純展示；其唯一資料操作是 wrongEntries，並不呼叫 applyAttempt。
  assert.deepEqual(Object.keys(wrongEntries(p, 'u', 'v', { id: 'u', bankVersion: 'v' })), ['q1']);
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

test('複習考首次達標時間晚於期限才標示逾期，完成度公式為 v3', () => {
  assert.equal(isOverdue({ dueAt: '2026-09-23T10:00' }, { passedAt: parseCourseTime('2026-09-23T10:01') }), true);
  assert.equal(isOverdue({ dueAt: '2026-09-23T10:00' }, { passedAt: parseCourseTime('2026-09-23T10:00') }), false);
  assert.equal(CURRENT_COMPLETION_FORMULA_VERSION, 3);
});

test('複習考交卷須符合歷史版本的題數與來源配額，舊組卷仍可採計', () => {
  const history = [{ version: 'old', drawCount: 3, allocation: { a: 2, b: 1 }, builtAt: 1 }, { version: 'new', drawCount: 2, allocation: { a: 1, b: 1 }, builtAt: 2 }];
  const sources = { a1: 'a', a2: 'a', b1: 'b', b2: 'b' };
  assert.equal(reviewAttemptIsFull(history, 'old', ['a1', 'a2', 'b1'], sources), true);
  assert.equal(reviewAttemptIsFull(history, 'old', ['a1', 'b1'], sources), false, '題數不足不得採計');
  assert.equal(reviewAttemptIsFull(history, 'old', ['a1', 'b1', 'b2'], sources), false, '來源配額不符不得採計');
  assert.equal(reviewAttemptIsFull(history, 'new', ['a1', 'b1'], sources), true);
});
test('1.7.0 台北日界線、移除保留累計、同日答對與再次答錯', () => {
  const before = Date.parse('2026-10-05T15:59:00Z'), after = Date.parse('2026-10-05T16:01:00Z');
  const bad = [{ questionId: 'q', selected: 'b', correct: false, seconds: 0 }], good = [{ ...bad[0], correct: true }];
  assert.equal(taipeiDay(after) - taipeiDay(before), 1);
  let r = updateWrong({}, bad, before);
  assert.deepEqual(r.entries.q, { n: 1, at: before });
  r = updateWrong(r.entries, good, before + 1000);
  assert.equal(r.entries.q.ok, before + 1000);
  assert.equal(r.summary.todayCorrect, 1);
  assert.equal(Object.keys(wrongGroups(r.entries, before).today).length, 1);
  r = updateWrong(r.entries, good, after);
  assert.deepEqual(r.entries.q, { n: 1, at: before, rm: after });
  assert.deepEqual(updateWrong(r.entries, good, after + 1).entries, r.entries);
  assert.deepEqual(wrongGroups(r.entries, after), { today: {}, due: {} });
  const p: any = { units: { u: { wrong: { v: r.entries } } }, activities: {} };
  assert.equal(Object.keys(wrongEntries(p, 'u', 'v', { id: 'u', bankVersion: 'v' })).length, 0);
  assert.equal(effectiveWrong(p.units.u, { id: 'u', bankVersion: 'v' }, 'v').q.n, 1);
  r = updateWrong(r.entries, bad, after);
  assert.deepEqual(r.entries.q, { n: 2, at: after });
  assert.deepEqual(updateWrong({ q: { n: 3, at: 0 } }, good, after).entries.q, { n: 3, at: 0, rm: after });
  assert.deepEqual(effectiveWrong({ wrong: { v: ['q'] } } as any, { id: 'u', bankVersion: 'v' }, 'v'), { q: { n: 1, at: 0 } });
});
test('1.7.0 待複習排序與題數邊界', () => {
  const now = Date.parse('2026-10-06T02:00:00Z');
  const e = { today: { n: 100, at: now, ok: now }, older: { n: 2, at: 1 }, newer: { n: 2, at: 2 }, most: { n: 3, at: 3 }, removed: { n: 99, at: 1, rm: 2 } };
  assert.deepEqual(reviewIds(e, 2, now), ['most', 'older']);
  for (const [n, expected] of [[10, [10,20,30,50]], [37,[10,20,30,50,37]], [50,[10,20,30,50]], [60,[10,20,30,50]]] as const) assert.deepEqual(reviewCounts(n), expected);
});
test('1.7.0 綜合範圍：三態、合計、未作答、移除標記、候選不變與新分類預設包含',()=>{
  const unit=(id:string,group?:string)=>({id,group,title:id,bankVersion:'v',questionCount:4,visibility:'current',required:false}) as any;
  const p:any={units:{a:{wrong:{v:{q1:{n:2,at:0},q2:{n:1,at:Date.now()},q3:{n:9,at:0,rm:1}}}}},activities:{},attempted:{a:{q1:true}}};
  const units=[unit('a','血液'),unit('b','血液'),unit('c'),{...unit('hidden'),visibility:'hidden'},{...unit('archived'),visibility:'archived'},{...unit('exam'),review:{}},{...unit('empty'),bankVersion:''}];
  const s=mixedScope(units,p,['b','missing','hidden']);
  assert.deepEqual(s.selected.map(u=>u.id),['a','c']);assert.deepEqual(s.excluded,['b']);assert.equal(s.total,8);assert.equal(s.due,1);assert.equal(s.today,1);assert.equal(s.unseen,7);
  assert.equal(s.groups[0].partial,true);assert.equal(s.groups[0].checked,false);assert.equal(s.groups[1].name,'未分類');assert.equal(s.groups[1].checked,true);
  assert.equal(mixedScope([...units,unit('new','血液')],p,s.excluded).selected.some(u=>u.id==='new'),true);
  assert.equal(mixedScope(units,p,['a','b','c']).count,0);
});
test('1.7.0 閃卡今天優先、抽題待複習優先／今天歸其他、跨分類錯題排序取前N才洗牌',()=>{
  const now=Date.parse('2026-10-06T02:00:00Z'),unit:any={id:'u',bankVersion:'v'};
  const rows=['today','due1','due2','unseen','other','removed'].map(id=>({q:{...q,id},unit}));
  const p:any={units:{u:{wrong:{v:{today:{n:10,at:now},due1:{n:3,at:0},due2:{n:2,at:0},removed:{n:99,at:0,rm:1}}}}},activities:{},attempted:{u:{other:true,removed:true}}};
  assert.deepEqual(selectPracticeRows(rows,p,'flashcard',1,now).map(r=>r.q.id),['today']);
  assert.deepEqual(selectPracticeRows(rows,p,'quiz',2,now).map(r=>r.q.id).sort(),['due1','due2']);
  assert.equal(selectPracticeRows(rows,p,'quiz',3,now)[2].q.id,'unseen');
  assert.deepEqual(selectPracticeRows(rows,p,'review',1,now).map(r=>r.q.id),['due1']);
  for(const mode of ['flashcard','quiz'] as const){const picked=selectPracticeRows(rows,p,mode,99,now);assert.equal(picked.length,rows.length);assert.equal(new Set(picked.map(r=>r.q.id)).size,rows.length);}
  const u2:any={id:'u2',bankVersion:'v'};p.units.u2={wrong:{v:{due1:{n:4,at:0}}}};
  const picked=selectPracticeRows([...rows,{q:{...q,id:'due1'},unit:u2}],p,'review',2,now);
  assert.deepEqual(picked.map(r=>`${r.unit.id}:${r.q.id}`).sort(),['u2:due1','u:due1'].sort());
});

test('④ 正解文字比較：刪題、答案、選項數、題型重置；文字空白、換序與展示修改延續', () => {
  const base = ['deleted', 'answer', 'count', 'type', 'display', 'space', 'shuffle'].map(id => ({...q,id}));
  const next = base.filter(x=>x.id!=='deleted').map(x => {
    if(x.id==='answer') return {...x,answer:'b'};
    if(x.id==='count') return {...x,options:[...x.options,{id:'c',text:'C'}]};
    if(x.id==='type') return {...x,questionType:'image' as const};
    if(x.id==='display') return {...x,text:'新題幹',explanation:'新解析',image:'https://example.test/image.png',order:42,options:[x.options[0],{id:'b',text:'新干擾'}]};
    if(x.id==='space') return {...x,options:[{id:'a',text:' \n A  \t'},x.options[1]]};
    if(x.id==='shuffle') return {...x,answer:'b',options:[{id:'a',text:'B'},{id:'b',text:'A'}]};
    return x;
  }).reverse();
  assert.deepEqual(wrongCarryDrop(base,Object.fromEntries(base.map(x=>[x.id,'a'])),next),{drop:['answer','count','deleted','type'],kept:3,changed:3,removed:1});
  assert.equal(wrongCarryDrop([{...q,options:[{id:'a',text:' A  B '},{id:'b',text:'C'}]}],{q1:'a'},[{...q,questionType:'single',options:[{id:'a',text:'A\nB'},{id:'b',text:'C'}]}]).kept,1);
});
test('④ 共用 fixture：多段延續累積 drop，保留 n/at/ok/rm，不改舊資料', () => {
  const original=structuredClone(carryFixture.progress);
  assert.deepEqual(effectiveWrong(carryFixture.progress.units.u,carryFixture.unit,'v3'),carryFixture.expected);
  assert.deepEqual(carryFixture.progress,original);
  assert.deepEqual(wrongEntries(carryFixture.progress,'u','v3',carryFixture.unit),{q:carryFixture.expected.q});
  assert.deepEqual(effectiveWrong({...carryFixture.progress.units.u,wrong:{v3:{}}},carryFixture.unit,'v3'),{});
  assert.deepEqual(effectiveWrong({...carryFixture.progress.units.u,wrong:{v3:{direct:{n:9,at:4}},v1:carryFixture.expected}},carryFixture.unit,'v3'),{direct:{n:9,at:4}});
  assert.deepEqual(effectiveWrong({wrong:{v1:['q','changed']}} as any,carryFixture.unit,'v2'),{q:{n:1,at:0}});
});
test('④ 延續防護：中斷、全部重算、循環、10段上限、單段扣除', () => {
  const progress={wrong:{v0:{q:{n:2,at:0,ok:1,rm:2},drop:{n:1,at:0}}}} as any;
  assert.deepEqual(effectiveWrong(progress,{wrongCarry:{v1:{from:'v0',drop:['drop']}}},'v1'),{q:progress.wrong.v0.q});
  assert.deepEqual(effectiveWrong(progress,{},'v1'),{});
  assert.deepEqual(effectiveWrong(progress,{wrongCarry:{v1:{from:'v0',drop:'*'}}},'v1'),{});
  assert.deepEqual(effectiveWrong(progress,{wrongCarry:{v1:{from:'v2',drop:[]},v2:{from:'v1',drop:[]}}},'v1'),{});
  const wrongCarry=Object.fromEntries(Array.from({length:11},(_,i)=>['v'+(i+1),{from:'v'+i,drop:[]}]));
  assert.deepEqual(effectiveWrong(progress,{wrongCarry},'v10'),progress.wrong.v0);
  assert.deepEqual(effectiveWrong(progress,{wrongCarry},'v11'),{});
});
test('④ 最近十筆按寫入順序保留，資料庫 map 排序不影響順序', () => {
  let unit: ReturnType<typeof appendWrongCarry>={wrongCarry:{},wrongCarryOrder:[]};
  for(let i=0;i<13;i++) unit=appendWrongCarry(unit,'hash'+i,{from:'hash'+(i-1),drop:[]});
  unit.wrongCarry=Object.fromEntries(Object.entries(unit.wrongCarry).sort());
  unit=appendWrongCarry(unit,'new',{from:'hash12',drop:[]});
  assert.deepEqual(unit.wrongCarryOrder,[...Array.from({length:9},(_,i)=>'hash'+(i+4)),'new']);
  assert.equal(Object.keys(unit.wrongCarry).length,10);
  assert.equal(unit.wrongCarry.hash3,undefined);
});
