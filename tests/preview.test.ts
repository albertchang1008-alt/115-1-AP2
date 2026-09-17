import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { memoryApi, previewApi, sampleCourse, sampleQuestions, API } from '../src/service';
import { emptyProgress, Attempt } from '../shared/model';
import { parseStudentRoute } from '../src/studentRoute';
import { defaultTab } from '../src/Student';

test('學生 hash 路由可解析、保留 tab 並拒絕其他課程或不完整路由', () => {
  assert.deepEqual(parseStudentRoute('#/course/%E8%AA%B2%E7%A8%8B/unit/%E8%A1%80%E6%B6%B2?tab=post', '課程'), { kind: 'unit', unitId: '血液', tab: 'post' });
  assert.deepEqual(parseStudentRoute('#/course/%E8%AA%B2%E7%A8%8B/unit/u/activity/a', '課程'), { kind: 'activity', unitId: 'u', activityId: 'a' });
  assert.deepEqual(parseStudentRoute('#/course/%E8%AA%B2%E7%A8%8B/unit/u/quiz?mode=draw&n=10', '課程'), { kind: 'quiz', unitId: 'u', mode: 'draw', count: 10 });
  assert.equal(parseStudentRoute('#/course/別的課程', '課程'), null);
  assert.equal(parseStudentRoute('#/course/課程/unit/u/unknown', '課程'), null);
});
test('次單元預設開啟第一個尚有必做活動的標籤，否則第一個有內容標籤', () => {
  const u: any = { id: 'u', activities: [{ id: 'video', phase: 'before', type: 'youtube' }, { id: 'link', phase: 'during', type: 'link' }] };
  assert.equal(defaultTab(u, emptyProgress()), 'class');
  assert.equal(defaultTab(u, { units: {}, activities: { u_link: { completed: true, position: 0, updatedAt: 1 } } }), 'pre');
});
test('完整測驗延後鎖定，抽題與錯題在送出選項後才揭示回饋', async () => {
  const source = await readFile(new URL('../src/Student.tsx', import.meta.url), 'utf8');
  assert.match(source, /mode !== 'quiz' \|\| !full/);
  assert.match(source, /locked\[q\.id\] &&/);
  assert.match(source, /正確答案：/);
});
test('還沒完成清單依規格預設截斷五項，並提供展開控制', async () => {
  const source = await readFile(new URL('../src/Student.tsx', import.meta.url), 'utf8');
  assert.match(source, /slice\(0, outstandingAll \? undefined : 5\)/);
  assert.match(source, /查看全部/);
});
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
