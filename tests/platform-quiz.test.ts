import assert from 'node:assert/strict';
import test from 'node:test';
import { parseQuizHash, platformScoreDistribution, quizHash } from '../shared/platformQuiz';
import { researchCsv } from '../shared/zuvioExt';

test('platform quiz deep link only carries valid scope and sitting identifiers', () => {
  const sittingId = '16d0d163-f284-4608-905d-19106c696047';
  const hash = quizHash('合成課_一', sittingId);
  assert.deepEqual(parseQuizHash(hash), { courseId: '合成課_一', sittingId });
  assert.equal(parseQuizHash(hash + '?token=x'), null);
  assert.equal(parseQuizHash('#/course/%zz/quiz/' + sittingId), null);
});

test('platform distribution uses true percentages at the boundaries and keeps empty cohorts distinguishable', () => {
  const result = platformScoreDistribution([0, 9.99, 10, 10.01, 89.99, 90, 100], 100);
  assert.deepEqual(result.bins.map(({ count }) => count), [2, 2, 0, 0, 0, 0, 0, 0, 1, 2]);
  assert.equal(result.median, 10.01);
  assert.equal(platformScoreDistribution([80], 80).bins[9].count, 1);
  assert.equal(platformScoreDistribution([5, 15], 20).median, 10);
  assert.equal(platformScoreDistribution([], 80).mean, null);
});

test('research CSV appends makeup and leaves legacy field order intact', () => {
  const example = { classId: 'fixture', sittingLabel: '練習', startsAt: null, mood: null,
    preExamStatus: 'none' as const, correct: 1, score: 4, answers: {} };
  const csv = researchCsv({ title: '示範', score: 4, items: [] }, [example, { ...example, makeup: 2 }], true);
  const [header, noMakeup, makeup] = csv.trimEnd().split(/\r?\n/);
  assert.match(header, /答對題數.*,.*補考/);
  assert.match(noMakeup, /,""$/);
  assert.match(makeup, /,2$/);
});
