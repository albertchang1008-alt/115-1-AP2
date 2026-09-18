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
test('教師課程編輯器以 Chapter 編輯並提供題目分類唯讀與舊資料清理', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const editor = source.slice(source.indexOf('function CourseEditor('), source.indexOf('function Bank('));
  assert.match(editor, /orderedChapters\(draft\)/, '左側只依 Chapter 排列');
  assert.match(editor, /chapterOrder: order/, '上下移要寫入 chapterOrder');
  assert.match(editor, /ChapterOverrides/, '各班覆寫寫入 chapterOverrides');
  assert.match(editor, /changeChapter\(\{ activities:/, '活動寫入 Chapter');
  assert.match(editor, /題目分類（來自 Sheet 次單元）/);
  assert.match(editor, /以下活動掛在舊的題目分類上，請搬到單元/);
  assert.match(editor, /Sheet 已無對應的舊題目分類/);
  assert.match(editor, /全部移除/);
});
test('Chapter 活動編輯器保留完整教材欄位並以中文類型呈現', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const editor = source.slice(source.indexOf('function ChapterActivityEditor('), source.indexOf('type CourseEditorProps'));
  assert.match(editor, /探索節點總數/);
  assert.match(editor, /nodeTotal: entry\.nodeTotal/);
  assert.match(editor, /闖關題目總數/);
  assert.match(editor, /questionTotal: entry\.questionTotal/);
  assert.match(editor, /YouTube 開始秒數/);
  assert.match(editor, /YouTube 結束秒數/);
  assert.match(editor, /Object\.entries\(MATERIAL_CATALOG\)/);
  assert.match(editor, /<Field label="學習說明">/);
  assert.match(editor, /<option value="youtube">YouTube 影片<\/option>/);
  assert.match(editor, /<option value="html">互動 HTML 教材<\/option>/);
  assert.match(editor, /<option value="link">外部教材<\/option>/);
  assert.doesNotMatch(editor, /<option value="quiz">/);
});
test('新 CourseEditor 在草稿尚未保存時阻止直接離開', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const editor = source.slice(source.indexOf('function CourseEditor('), source.indexOf('function Bank('));
  assert.match(editor, /window\.addEventListener\('beforeunload', warn\)/);
  assert.match(editor, /window\.removeEventListener\('beforeunload', warn\)/);
  assert.match(editor, /event\.returnValue = ''/);
});
test('停用的 LegacyCourseEditor 與專用 helper 已移除', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /LegacyCourseEditor/);
  assert.doesNotMatch(source, /function unitWarning/);
  assert.doesNotMatch(source, /function ClassOverrides/);
  assert.doesNotMatch(source, /const makeUnit/);
  assert.doesNotMatch(source, /\bsafeCode\b|\bunitTree\b|\bisTabFallbackUnit\b/);
});
test('學生首頁與單元頁以 Chapter 彙整活動及題目分類', async () => {
  const source = await readFile(new URL('../src/Student.tsx', import.meta.url), 'utf8');
  assert.match(source, /currentChapters = orderedChapters\(course\)/);
  assert.match(source, /chapterCompletion\(course, name, progress\)/);
  assert.match(source, /已達標分類/);
  assert.match(source, /chapter\.activities\.filter/);
  assert.match(source, /chapterUnits\.map\(\(classification\) => <PracticeRow/);
  assert.match(source, /最高分 \{best\} \/ 門檻 \{threshold\}/);
  assert.match(source, /chapterActivityKey\(selectedChapterName, activity\.id\)/);
  assert.match(source, /parseStudentRoute\(`#\/course\/\$\{encodeURIComponent\(course\.id\)\}\$\{path\}`/);
});
test('練習分頁每個題目分類是一列並保留四種入口', async () => {
  const [source, css] = await Promise.all([
    readFile(new URL('../src/Student.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
  ]);
  const row = source.slice(source.indexOf('function PracticeRow('), source.indexOf('function ReadingPage('));
  assert.match(source, /className=\{tab === 'practice' \? 'practice-list' : 'activitycards'\}/);
  assert.equal((source.match(/完整測驗與完整閃卡計入最高成績/g) || []).length, 1);
  assert.match(row, /className="practice-row"/);
  assert.match(row, />完整測驗<\/button>/);
  assert.match(row, />完整閃卡<\/button>/);
  assert.match(row, /\[10, 20, 30\]\.map/);
  assert.match(row, /`\/quiz\?mode=draw&n=\$\{n\}`/);
  assert.match(row, /wrongcards\?range=7d/);
  assert.match(row, /disabled=\{busy \|\| !wrong\}/);
  assert.match(row, /badge green/);
  assert.doesNotMatch(source, /function PracticeCards/);
  assert.match(css, /\.practice-row \{ display:grid/);
  assert.match(css, /@media \(max-width: 600px\) \{\s*\.practice-row \{ grid-template-columns:1fr 1fr; grid-template-areas:"title score" "full flash" "draw draw" "wrong wrong"; overflow-x:visible; \}\s*\.practice-draw \{ justify-content:space-between; \}\s*\.practice-draw button \{ flex:1; \}/);
});
test('教師單元與班級對照表使用精確中文文案', async () => {
  const [app, setup] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/CourseSetup.tsx', import.meta.url), 'utf8'),
  ]);
  const editor = app.slice(app.indexOf('function CourseEditor('), app.indexOf('function Bank('));
  assert.match(editor, /\u00b7 單元設定/);
  assert.doesNotMatch(editor, /Chapter 單元設定/);
  assert.match(setup, /全部（\{allIds\.length\} 個分類）/);
  assert.doesNotMatch(setup, /全部（\{allIds\.length\} 節）/);
});
test('教師總覽的單元、必做、活動與達標門檻讀取 Chapter', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const overview = source.slice(source.indexOf('function Overview('), source.indexOf('function Metric('));
  assert.match(overview, /const chapters = orderedChapters\(course\)/);
  assert.match(overview, /chapter\.activities\.length/);
  assert.match(overview, /chapter\.threshold/);
  assert.doesNotMatch(overview, /course\.units\.reduce\(\(n, u\) => n \+ u\.activities/);
});
test('Chapter 互動教材把 chapterName 傳到 LearningBridge 與後端', async () => {
  const [player, bridge] = await Promise.all([readFile(new URL('../src/Player.tsx', import.meta.url), 'utf8'), readFile(new URL('../src/LearningBridge.ts', import.meta.url), 'utf8')]);
  assert.match(player, /chapterName\?: string/);
  assert.match(player, /learningBridge\(api, \{ courseId, unitId, \.\.\.\(chapterName/);
  assert.match(bridge, /chapterName\?: string/);
  assert.match(bridge, /chapterName \? `chapter:/);
});
test('學習進度看板只可整組移動同一單元的題目分類', async () => {
  const source = await readFile(new URL('../src/ProgressBoard.tsx', import.meta.url), 'utf8');
  assert.match(source, /整個單元移到/);
  assert.match(source, /unitIds: rows\.map\(\(u\) => u\.id\)/);
  assert.match(source, /整組移到…/);
  assert.doesNotMatch(source, /unitIds: \[u\.id\]/, '1.4.0 不可個別移動題目分類');
});
test('題庫管理頁可直接設定同步 Google Sheet 網址', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const bank = source.slice(source.indexOf('function Bank('), source.indexOf('function RosterPage('));
  assert.match(bank, /同步檔案設定/);
  assert.match(bank, /Google Sheet 網址或 ID/);
  assert.match(bank, /saveSheetConfig/);
  assert.match(bank, /getSyncStatus/);
});
test('題庫同步找不到分頁時顯示後端實際讀到的分頁名稱', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const bank = source.slice(source.indexOf('function Bank('), source.indexOf('function RosterPage('));
  assert.match(bank, /sourceCourseId === course\.id/);
  assert.match(bank, /availableTabs/);
  assert.match(bank, /平台實際讀到/);
});
test('題庫同步有驗證錯誤時顯示次單元與實際後端訊息', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const bank = source.slice(source.indexOf('function Bank('), source.indexOf('function RosterPage('));
  assert.match(bank, /filter\(\(bank: any\) => bank\.error\)\.slice\(0, 3\)/);
  assert.match(bank, /bank\.unitId \|\| bank\.sourceTab/);
  assert.match(bank, /題庫同步有未完成項目：\$\{errors\}/);
});
test('平台設定固定放在側欄底部，不會被長導覽清單推到畫面外', async () => {
  const [app, css] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
  ]);
  assert.match(app, /tabs\.filter\(\(\[id\]\) => id !== 'settings'\)/);
  assert.match(app, /className=\{'sidebar-settings'/);
  assert.match(css, /nav \{[\s\S]*?overflow-y: auto/);
  assert.match(css, /\.sidebar-settings \{/);
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

test('學習進度看板依課程與教材設定的單元順序排列', async () => {
  const source = await readFile(new URL('../src/ProgressBoard.tsx', import.meta.url), 'utf8');
  assert.match(source, /orderedChapters\(course\)/);
  assert.doesNotMatch(source, /grouped\(units\)/);
});

test('選擇教材版本時自動帶入 GitHub Pages 教材網址，並可一鍵帶入建議網址', async () => {
  const { materialPageUrl } = await import('../shared/materials');
  assert.equal(materialPageUrl('course-orientation-v1'), 'https://albertchang1008-alt.github.io/115-1-AP2/materials/course-orientation-v1/index.html');
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(source, /url: materialPageUrl\(slug\)/);
  assert.match(source, /帶入此網址/);
});

test('單元學習活動可上移下移，並提供晴空粉色系', async () => {
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(source, /onMove=\{\(offset\)/);
  assert.match(source, /onClick=\{\(\) => onMove\(-1\)\}>上移/);
  const picker = await readFile(new URL('../src/ThemePicker.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.match(picker, /value="blossom">晴空粉/);
  assert.match(css, /data-theme='blossom'\] \{ --blue: #0ea5e9/);
});

test('測驗結果以答對／答錯分色卡逐選項標示正確答案與本次選擇', async () => {
  const source = await readFile(new URL('../src/Student.tsx', import.meta.url), 'utf8');
  assert.match(source, /'is-ok' : 'is-bad'/);
  assert.match(source, /（正確答案）/);
  assert.match(source, /（本次選擇）/);
  assert.match(source, /count-bad/);
});
