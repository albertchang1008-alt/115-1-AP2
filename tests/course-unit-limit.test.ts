import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCourseDraft, MAX_COURSE_UNITS } from '../shared/courseValidation';

const unit = (i: number) => ({ id: `分類${i}`, title: `分類${i}`, description: '', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [], group: '單元', visibility: 'current' });
const course = (n: number): any => ({ id: 'limit-test', title: '上限測試', term: '115-1', classIds: [], units: Array.from({ length: n }, (_, i) => unit(i)) });

test('題目分類上限 120：52、120 通過，121 拒絕並說明數量', () => {
  assert.equal(MAX_COURSE_UNITS, 120);
  assert.doesNotThrow(() => validateCourseDraft(course(52)));
  assert.doesNotThrow(() => validateCourseDraft(course(120)));
  assert.throws(() => validateCourseDraft(course(121)), /題目分類最多 120 個（目前 121 個）/);
});
test('班級上限仍為 50', () => {
  assert.throws(() => validateCourseDraft({ ...course(1), classIds: Array.from({ length: 51 }, (_, i) => `c${i}`) }), /班級最多 50 個/);
});
