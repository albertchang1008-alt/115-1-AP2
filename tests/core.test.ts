import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
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
  forClass,
  unitVisibility,
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
test('第二版完成度同時要求達標、互動教材與外部連結', () => {
  const unit: any = { id: 'u', required: true, threshold: 80, bankVersion: 'v', activities: [{ id: 'html', type: 'html', tracking: 'interactive' }, { id: 'link', type: 'link' }] };
  let p: any = { units: { u: { best: 90 } }, activities: {} };
  assert.equal(completion({ units: [unit] } as Course, p).done, 0);
  p.activities.u_html = { completed: true }; assert.equal(completion({ units: [unit] } as Course, p).done, 0);
  p.activities.u_link = { completed: true }; assert.equal(completion({ units: [unit] } as Course, p).done, 1);
  assert.equal(CURRENT_COMPLETION_FORMULA_VERSION, 2);
});
test('hidden 與逐班未勾選皆不會進入學生課程', () => {
  const c: any = { classUnits: { a: ['shown', 'hidden'] }, units: [{ id: 'shown' }, { id: 'hidden', visibility: 'hidden' }, { id: 'other' }] };
  assert.deepEqual(forClass(c, 'a').units.map((u: any) => u.id), ['shown']);
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
