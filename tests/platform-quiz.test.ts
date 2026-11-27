import assert from 'node:assert/strict';
import test from 'node:test';
import { parseQuizHash, platformScoreDistribution, quizHash, quizLeaveCsv, summarizeQuizLeaves } from '../shared/platformQuiz';
import { researchCsv } from '../shared/zuvioExt';

test('platform quiz deep link only carries valid scope and sitting identifiers', () => {
  const sittingId = '16d0d163-f284-4608-905d-19106c696047';
  const hash = quizHash('合成課_一', sittingId);
  assert.deepEqual(parseQuizHash(hash), { courseId: '合成課_一', sittingId });
  assert.equal(parseQuizHash(hash + '?token=x'), null);
  assert.equal(parseQuizHash('#/course/%zz/quiz/' + sittingId), null);
});

test('platform distribution rounds to whole points before counting the five score intervals', () => {
  const scores = [0, 59.49, 59.5, 69.49, 69.5, 79.49, 79.5, 89.49, 89.5, 100];
  const result = platformScoreDistribution(scores, 100);
  assert.deepEqual(result.bins.map(({ label }) => label), [
    '0–59 分', '60–69 分', '70–79 分', '80–89 分', '90–100 分',
  ]);
  assert.deepEqual(result.bins.map(({ count }) => count), [2, 2, 2, 2, 2]);
  assert.equal(result.bins.reduce((total, bin) => total + bin.count, 0), scores.length);
  assert.equal(platformScoreDistribution([119], 200).bins[1].count, 1);
  assert.equal(platformScoreDistribution([80], 80).bins[4].count, 1);
  assert.deepEqual(platformScoreDistribution([0, 10], 0).bins.map(({ count }) => count), [2, 0, 0, 0, 0]);
  assert.equal(result.min, 0);
  assert.equal(result.max, 100);
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

test('leave summary counts episodes per student, tracks who is away now, and keeps rounds apart (#73)', () => {
  const ev = (studentId: string, round: number, episode: number, kind: 'leave' | 'return', at: number, seconds?: number) =>
    ({ studentId, round, episode, kind, at, visit: 'v', ...(seconds === undefined ? {} : { seconds }) });
  const events = [
    ev('a', 0, 1, 'leave', 100), ev('a', 0, 1, 'return', 112, 12),
    ev('a', 0, 2, 'leave', 200), ev('a', 0, 2, 'return', 204, 4),
    ev('b', 0, 1, 'leave', 300),
    ev('c', 0, 1, 'leave', 50), ev('c', 0, 2, 'leave', 400), ev('c', 0, 2, 'return', 409, 9),
    ev('a', 1, 1, 'leave', 900),
  ];
  const round0 = summarizeQuizLeaves(events, 0);
  assert.deepEqual(round0.a, { count: 2, seconds: 16, episodes: [{ at: 100, seconds: 12 }, { at: 200, seconds: 4 }] });
  assert.equal(round0.b.awaySince, 300);
  // 較早的離開沒有記到返回，但之後又完整離開並回來：不算離開中
  assert.equal(round0.c.awaySince, undefined);
  assert.equal(round0.c.count, 2);
  assert.equal(summarizeQuizLeaves(events, 1).a.count, 1);
  assert.equal(summarizeQuizLeaves(events).a.count, 3);
  assert.deepEqual(summarizeQuizLeaves([], 0), {});
  const csv = quizLeaveCsv([{ name: '合成, 甲', summary: round0.a }, { name: '合成乙', summary: round0.b }], (at) => 't' + at);
  assert.ok(csv.startsWith('\ufeff姓名,離開次數,離開總秒數,'));
  assert.ok(csv.includes('"合成, 甲",2,16,t100／12；t200／4'));
  assert.ok(csv.includes('合成乙,1,0,t300／未回'));
});
