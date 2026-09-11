import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryApi, previewApi, sampleCourse, sampleQuestions, API } from '../src/service';
import { emptyProgress, Attempt } from '../shared/model';
test('教師預覽作答、影片進度與報表操作不呼叫正式寫入', async () => {
  const calls: string[] = [];
  const source: API = {
    preview: false,
    async call<T>(name: string) {
      calls.push(name);
      if (name === 'getBank') return { questions: sampleQuestions } as T;
      throw Error('禁止正式資料操作：' + name);
    },
  };
  const c = sampleCourse();
  const api = await previewApi(source, c, true);
  await api.call('getBank', {
    courseId: c.id,
    unitId: c.units[0].id,
    version: c.units[0].bankVersion,
  });
  const attempt: Attempt = {
    id: 'preview-attempt',
    courseId: c.id,
    unitId: c.units[0].id,
    version: c.units[0].bankVersion,
    mode: 'flashcard',
    answers: [],
    score: 100,
    full: true,
    clientAt: 1,
    duration: 5,
  };
  await api.call('submitAttempt', { attempt });
  await api.call('saveActivity', {
    unitId: c.units[0].id,
    activityId: 'welcome',
    position: 3,
    completed: true,
  });
  await api.call('updateReports');
  assert.deepEqual(calls, ['getBank']);
  assert.equal((await api.call('getProgress')).units[c.units[0].id].best, 100);
});
test('預覽重設與不同預覽 instance 不共用進度', async () => {
  const a = memoryApi(),
    b = memoryApi();
  const p = emptyProgress();
  p.units.orientation = { best: 100, attempts: 1, updatedAt: 1 };
  await a.call('setPreviewProgress', { progress: p });
  assert.equal((await a.call('getProgress')).units.orientation.best, 100);
  assert.deepEqual((await b.call('getProgress')).units, {});
});
test('一般錯題索引保留歷史，複習答對不清除', async () => {
  const a = memoryApi();
  const base: Attempt = {
    id: 'a',
    courseId: 'example-course',
    unitId: 'orientation',
    version: 'example-v1',
    mode: 'quiz',
    answers: [{ questionId: 'example-1', selected: 'b', correct: false, seconds: 1 }],
    score: 0,
    full: true,
    clientAt: 1,
    duration: 1,
  };
  await a.call('submitAttempt', { attempt: base });
  await a.call('submitAttempt', {
    attempt: {
      ...base,
      id: 'b',
      mode: 'review',
      score: 100,
      answers: [{ ...base.answers[0], correct: true }],
    },
  });
  assert.deepEqual((await a.call('getProgress')).units.orientation.wrong['example-v1'], [
    'example-1',
  ]);
  assert.equal((await a.call('getProgress')).units.orientation.best, 0);
});
