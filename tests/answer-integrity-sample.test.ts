import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sampleInvalid,
  sampleCohort,
  sampleStudentUnit,
  type IntegritySampleAttempt,
  type IntegritySampleData,
} from '../shared/answerIntegritySample';
const unit = { id: 'u', title: '示範單元', threshold: 100 };
function a(
  uid: string,
  seconds: number,
  score: number,
  extra: Partial<IntegritySampleAttempt> = {},
): IntegritySampleAttempt {
  return {
    id: `${uid}-${seconds}`,
    uid,
    courseId: 'sample',
    unitId: 'u',
    classId: 'sample',
    version: 'v1',
    mode: 'quiz',
    full: true,
    clientAt: 1,
    score,
    duration: seconds * 2,
    answers: [1, 2].map((i) => ({ questionId: `q${i}`, selected: '示範', correct: true, seconds })),
    ...extra,
  };
}
test('樣張投影嚴格採超過3次或60秒；舊紀錄及非完整單元模式保持有效', () => {
  assert.equal(sampleInvalid(a('x', 10, 100, { leaveCount: 3, leaveSeconds: 60 }), unit), false);
  assert.equal(sampleInvalid(a('x', 10, 100, { leaveCount: 4, leaveSeconds: 60 }), unit), true);
  assert.equal(sampleInvalid(a('x', 10, 100, { leaveCount: 3, leaveSeconds: 61 }), unit), true);
  assert.equal(sampleInvalid(a('x', 10, 100), unit), false);
  assert.equal(
    sampleInvalid(a('x', 10, 100, { mode: 'flashcard', leaveCount: 4, leaveSeconds: 61 }), unit),
    false,
  );
  assert.equal(
    sampleInvalid(a('x', 10, 100, { full: false, leaveCount: 4, leaveSeconds: 61 }), unit),
    false,
  );
  assert.equal(
    sampleInvalid(a('x', 10, 100, { leaveCount: 4, leaveSeconds: 61 }), { ...unit, review: true }),
    false,
  );
});
test('樣張班級比較排除test班與複習考，偏快標記須同時首次達門檻', () => {
  const data: IntegritySampleData = {
    source: 'emulator',
    units: [unit, { id: 'review', title: '複習', threshold: 100, review: true }],
    students: [
      { uid: 'n', name: '正常', classId: 'sample', studentId: 'n' },
      { uid: 'f', name: '偏快', classId: 'sample', studentId: 'f' },
      { uid: 't', name: '測試', classId: 'test', studentId: 't' },
    ],
    attempts: [
      a('n', 20, 80),
      a('n', 40, 100, { clientAt: 2 }),
      a('f', 5, 100),
      a('t', 1, 100, { classId: 'test' }),
      a('n', 1, 100, { unitId: 'review' }),
    ],
  };
  const result = sampleCohort(data, unit);
  assert.equal(result.median, 17.5);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows.find((r) => r.student.uid === 'f')!.flag, true);
  assert.equal(result.rows.find((r) => r.student.uid === 'n')!.flag, false);
  assert.equal(result.rows[0].average, 30);
  assert.equal(result.rows[0].firstAverage, 20);
});
test('樣張無效100分不蓋掉舊80分，但練習次數與時間仍列出', () => {
  const data: IntegritySampleData = {
    source: 'emulator',
    units: [unit],
    students: [{ uid: 'x', name: '示範', classId: 'sample', studentId: 'x' }],
    attempts: [a('x', 30, 80), a('x', 32, 100, { clientAt: 2, leaveCount: 4, leaveSeconds: 42 })],
  };
  const r = sampleStudentUnit(data, 'x', unit);
  assert.equal(r.best, 80);
  assert.equal(r.attempts, 2);
  assert.equal(r.invalid, 1);
  assert.equal(r.average, 31);
  assert.equal(r.hasLegacy, true);
});
