import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { memoryApi, previewApi, sampleCourse, sampleQuestions, API, cachedBank, clearBankCache } from '../src/service';
import { emptyProgress, Attempt } from '../shared/model';
import { parseStudentRoute } from '../src/studentRoute';
import { defaultTab } from '../src/Student';

test('學生 hash 路由可解析、保留 tab 並拒絕其他課程或不完整路由', () => {
  assert.deepEqual(parseStudentRoute('#/course/%E8%AA%B2%E7%A8%8B/unit/%E8%A1%80%E6%B6%B2?tab=post', '課程'), { kind: 'unit', unitId: '血液', tab: 'post' });
  assert.deepEqual(parseStudentRoute('#/course/%E8%AA%B2%E7%A8%8B/unit/u/activity/a', '課程'), { kind: 'activity', unitId: 'u', activityId: 'a' });
  assert.deepEqual(parseStudentRoute('#/course/%E8%AA%B2%E7%A8%8B/unit/u/quiz?mode=draw&n=10', '課程'), { kind: 'quiz', unitId: 'u', mode: 'draw', count: 10 });
  assert.equal(parseStudentRoute('#/course/別的課程', '課程'), null);
  assert.equal(parseStudentRoute('#/course/課程/unit/u/unknown', '課程'), null);
  assert.deepEqual(parseStudentRoute('#/course/%E8%AA%B2%E7%A8%8B/mixed?n=20', '課程'), { kind: 'mixed', count: 20 });
  assert.equal(parseStudentRoute('#/course/%E8%AA%B2%E7%A8%8B/unit/u/review', '課程'), null, '學生端不再提供錯題複習作答路由');
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
test('作答與閱讀固定頂部列，並提供學生顯示設定面板', async () => {
  const source = await readFile(new URL('../src/Student.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.match(source, /className="sectionhead quiz-topbar"/);
  assert.match(source, /aria-label="離開測驗"/);
  assert.match(source, /className="reading-page"/);
  assert.match(source, /aria-label="離開閱讀"/);
  assert.match(source, /aria-label="顯示設定"/);
  assert.match(source, /history\.pushState\(\{ studentSettings: true \}/);
  assert.match(css, /\.quiz-topbar \{ position:fixed/);
  assert.match(css, /\.quiz-bottom \{ position:fixed/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.reading-page \{ position:fixed/);
  assert.match(css, /\.settings-sheet/);
});
test('教師偏好列不作為 app grid 的子節點', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.match(source, /<>\s*<div className="prefs-bar">/);
  assert.match(source, /<div className="app">\s*<aside/);
  assert.match(css, /\.prefs-bar \{ position: fixed/);
});
test('學習進度看板可整組移動同一單元的次單元', async () => {
  const source = await readFile(new URL('../src/ProgressBoard.tsx', import.meta.url), 'utf8');
  assert.match(source, /整個單元移到/);
  assert.match(source, /unitIds: rows\.map\(\(u\) => u\.id\)/);
  assert.match(source, /整組移到…/);
  assert.match(source, /unitIds: \[u\.id\]/, '個別次單元移動仍可用');
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
  assert.equal((await a.call('getProgress')).units.orientation.wrong['example-v1']['example-1'].n, 1);
  assert.equal((await a.call('getProgress')).units.orientation.best, 0);
});
function storage() {
  const map = new Map<string, string>();
  return { get length() { return map.size; }, key: (i: number) => [...map.keys()][i] || null, getItem: (k: string) => map.get(k) || null, setItem: (k: string, v: string) => map.set(k, v), removeItem: (k: string) => map.delete(k), clear: () => map.clear() };
}
test('題庫快取命中、版本淘汰、毀損與配額失敗都可安全退回', async () => {
  const old = (globalThis as any).localStorage; const s = storage(); (globalThis as any).localStorage = s;
  try {
    let calls = 0; const api: API = { preview: false, async call<T>(name: string) { calls++; assert.equal(name, 'getBank'); return { questions: sampleQuestions } as T; } };
    await cachedBank(api, 'c', 'u', 'v1'); await cachedBank(api, 'c', 'u', 'v1'); assert.equal(calls, 1, '命中不可呼叫後端');
    await cachedBank(api, 'c', 'u', 'v2'); assert.equal(calls, 2); assert.equal(s.getItem('bank:preview:c:u:v1'), null, '新版本刪除舊鍵');
    s.setItem('bank:preview:c:u:v2', '{bad'); await cachedBank(api, 'c', 'u', 'v2'); assert.equal(calls, 3, '毀損快取須退回後端');
    const broken: any = { ...s, setItem() { throw Error('quota'); } }; (globalThis as any).localStorage = broken;
    await assert.doesNotReject(cachedBank(api, 'c', 'x', 'v1'));
    (globalThis as any).localStorage = s; clearBankCache(); assert.equal(s.length, 0, '登出會清除 bank 快取');
  } finally { (globalThis as any).localStorage = old; }
});
test('題庫快取超過 3 MB 時以最後使用時間淘汰', async () => {
  const old = (globalThis as any).localStorage; const s = storage(); (globalThis as any).localStorage = s;
  try {
    s.setItem('bank:preview:c:old1:v', 'x'.repeat(1_600_000)); s.setItem('bank:preview:c:old1:v:at', '1');
    s.setItem('bank:preview:c:old2:v', 'x'.repeat(1_600_000)); s.setItem('bank:preview:c:old2:v:at', '2');
    const api: API = { preview: false, async call<T>() { return { questions: sampleQuestions } as T; } };
    await cachedBank(api, 'c', 'new', 'v');
    assert.equal(s.getItem('bank:preview:c:old1:v'), null, '最久未使用者先淘汰');
    assert.ok(s.getItem('bank:preview:c:old2:v'));
  } finally { (globalThis as any).localStorage = old; }
});
test('錯題閃卡與首頁排列採純前端資料，沒有額外 callable', async () => {
  const source = await readFile(new URL('../src/Student.tsx', import.meta.url), 'utf8');
  assert.match(source, /wrongCardIds\(progress/);
  assert.match(source, /閃卡不會寫入資料/);
  assert.match(source, /if \(!counts\[range\]\) setRange\(counts\['7d'\] \? '7d' : 'all'\)/, '7 天沒有題目要自動選全部');
  assert.match(source, /setQs\(\(x\) => \[\.\.\.x\.slice/, '再看一次只調整本輪卡片佇列');
  assert.ok(source.indexOf('還沒完成') < source.indexOf('unitgrid'), '待辦位於單元清單之前');
  assert.match(source, /currentUnits\.filter/);
  assert.doesNotMatch(source, /start\('review'/);
  assert.match(source, /submitMixedAttempts/);
  assert.match(source, /\[\.\.\.shuffle\(wrong\), \.\.\.shuffle\(unseen\), \.\.\.shuffle\(other\)\]/);
});
