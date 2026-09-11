import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregate,
  applyAttempt,
  completion,
  emptyProgress,
  grade,
  validateQuestions,
  validateRoster,
  youtubeId,
  Attempt,
  Report,
  Seen,
  Course,
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
  assert.ok(validateRoster([{ ...r, email: 's@example.com' }]).length);
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
  assert.deepEqual(completion(c, emptyProgress()), { done: 0, total: 1 });
});
