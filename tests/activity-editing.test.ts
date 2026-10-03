import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Activity } from '../shared/model';
import { autoTitle, groupByPhase, insertActivity, materialTitle, moveWithinPhase, requiredLabel } from '../src/activityEditing';

const a = (id: string, phase: Activity['phase'], extra: Partial<Activity> = {}): Activity => ({ id, title: id, type: 'youtube', phase, url: '', description: '', ...extra });

test('教材名稱去掉「圖卡」，只在預設／空白／上一份自動名稱時帶入', () => {
  assert.equal(materialTitle('hemostasis-mechanisms-v2'), '止血機制與凝血');
  assert.equal(autoTitle({ title: '新活動' }, 'hemostasis-mechanisms-v2'), '止血機制與凝血');
  assert.equal(autoTitle({ title: '  ' }, 'blood-gas-transport-v2'), '血液氣體運送');
  assert.equal(autoTitle({ title: '止血機制與凝血', materialVersion: 'hemostasis-mechanisms-v2' }, 'blood-gas-transport-v2'), '血液氣體運送');
  assert.equal(autoTitle({ title: '止血機制與凝血圖卡', materialVersion: 'hemostasis-mechanisms-v2' }, 'blood-gas-transport-v2'), '血液氣體運送');
  assert.equal(autoTitle({ title: '老師自訂', materialVersion: 'hemostasis-mechanisms-v2' }, 'blood-gas-transport-v2'), '老師自訂');
});

test('必做標籤區分手動設定與依類型推導', () => {
  assert.deepEqual(requiredLabel(a('x', 'before')), { required: false, text: '選做（依類型）' });
  assert.deepEqual(requiredLabel(a('x', 'before', { type: 'link' })), { required: true, text: '必做（依類型）' });
  assert.deepEqual(requiredLabel(a('x', 'before', { required: true })), { required: true, text: '必做' });
  assert.deepEqual(requiredLabel(a('x', 'before', { type: 'link', required: false })), { required: false, text: '選做' });
});

test('新活動插在同階段最後，分組與同階段內移動保留其他順序', () => {
  const list = [a('b1', 'before'), a('a1', 'after'), a('b2', 'before'), a('a2', 'after')];
  assert.deepEqual(insertActivity(list, a('n', 'before')).map((x) => x.id), ['b1', 'a1', 'b2', 'n', 'a2']);
  assert.deepEqual(insertActivity(list, a('d', 'during')).map((x) => x.id), ['b1', 'a1', 'b2', 'd', 'a2']);
  assert.deepEqual(insertActivity(list, a('z', 'after')).map((x) => x.id), ['b1', 'a1', 'b2', 'a2', 'z']);
  assert.deepEqual(insertActivity([], a('n', 'during')).map((x) => x.id), ['n']);
  assert.deepEqual(groupByPhase(list).map((g) => g.items.map((x) => x.index)), [[0, 2], [], [1, 3]]);
  assert.deepEqual(moveWithinPhase(list, 2, -1).map((x) => x.id), ['b2', 'a1', 'b1', 'a2']);
  assert.equal(moveWithinPhase(list, 0, -1), list);
  assert.equal(moveWithinPhase(list, 3, 1), list);
});
