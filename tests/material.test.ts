import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { materialUrl } from '../shared/model';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HtmlMaterial } from '../src/Player';
import type { API } from '../src/service';

test('教材接受 Pages 子路徑、自訂網域與版本參數，拒絕非 HTTPS 與帳密網址', () => {
  for (const url of [
    'https://teacher.github.io/course/materials/v1/index.html?v=1#start',
    'https://learn.example.edu/教材/index.html',
  ]) {
    assert.equal(materialUrl(url), new URL(url).href);
  }
  for (const value of [
    undefined,
    '',
    '/index.html',
    'http://example.com',
    'javascript:alert(1)',
    'data:text/html,test',
    'https://user:password@example.com/',
    'https://',
  ]) {
    assert.equal(materialUrl(value), null);
  }
});

test('學生與預覽共用教材元件直接嵌入 Pages，無效網址不呈現 iframe', () => {
  const activity = {
    id: 'html-1',
    title: '教材',
    description: '',
    type: 'html' as const,
    phase: 'before' as const,
    url: 'https://teacher.github.io/materials/v1/index.html',
  };
  const render = (url: string) =>
    renderToStaticMarkup(
      createElement(HtmlMaterial, {
        api: {} as API,
        courseId: 'course-1',
        unitId: 'unit-1',
        uid: 'student-1',
        activity: { ...activity, url },
        onSave: () => {},
      }),
    );
  const html = render(activity.url);
  assert.ok(html.includes(`src="${activity.url}"`));
  assert.ok(html.includes('sandbox="allow-scripts"'));
  assert.ok(!html.includes('allow-same-origin'));
  const invalid = render('javascript:alert(1)');
  assert.ok(!invalid.includes('<iframe'));
  assert.ok(invalid.includes('disabled=""'));
});

test('血液組成教材使用 SDK、固定診斷分母與滿分通關', async () => {
  const html = await readFile(new URL('../public/materials/blood-composition-v1/index.html', import.meta.url), 'utf8');
  assert.match(html, /<script src="\.\.\/course-learning\.js"><\/script>/);
  assert.equal((html.match(/data-node="blood-composition-/g) || []).length, 6);
  assert.equal((html.match(/id:'blood-composition-q0/g) || []).length, 5);
  assert.match(html, /const TIME_LIMIT_SECONDS = 45/);
  assert.match(html, /function shuffleQuestions\(\)/);
  assert.match(html, /roundQuestions = shuffleQuestions\(\)/);
  assert.match(html, /streak === caseQuestions\.length/);
  assert.match(html, /CL\.complete\(\)/);
  assert.match(html, /const GA4_MEASUREMENT_ID = 'G-VQVRD53N2N'/);
  assert.match(html, /CL\.nodeTime\(nodeId, seconds\)/);
  assert.match(html, /血液探索家/);
  assert.match(html, /function fireworks\(\)/);
});

test('課程介紹圖卡以十題全對作為教材完成條件', async () => {
  const html = await readFile(new URL('../public/materials/course-orientation-v1/index.html', import.meta.url), 'utf8');
  assert.match(html, /url\("background\.png"\)/);
  assert.match(html, /<script src="\.\.\/course-learning\.js"><\/script>/);
  assert.equal((html.match(/id: 'course-orientation-q\d\d'/g) || []).length, 10);
  assert.match(html, /CourseLearning\.answer\(q\.id, isCorrect\)/);
  assert.match(html, /score === questions\.length/);
  assert.match(html, /CourseLearning\.complete\(\)/);
  assert.equal((html.match(/data-node-id="course-orientation-[\w-]+"/g) || []).length, 8);
  // 捲動節點追蹤已改用 course-learning.js 的共用方法，不再自己刻 IntersectionObserver。
  assert.match(html, /CourseLearning\?\.trackScrollNodes\?\.\(\)/);
});

test('course-learning.js 的 trackScrollNodes 是可重用的捲動節點追蹤方法', async () => {
  const js = await readFile(new URL('../public/materials/course-learning.js', import.meta.url), 'utf8');
  assert.match(js, /trackScrollNodes\(selector = '\[data-node-id\]', threshold = 0\.4\)/);
  assert.match(js, /new IntersectionObserver/);
  assert.match(js, /this\.explore\(nodeId\)/);
  assert.match(js, /this\.nodeTime\(nodeId, seconds\)/);
  assert.match(js, /Number\.isFinite\(seconds\)/);
  assert.match(js, /whole > 0/);
});

test('止血與血液氣體運送教材保有節點與兩層驗收追蹤', async () => {
  const cases = [
    ['hemostasis-mechanisms-v1', 'hemostasis-mechanisms', 'hemostasis', 6],
    ['blood-gas-transport-v1', 'blood-gas-transport', 'blood-gas-transport', 6],
  ] as const;
  for (const [version, nodePrefix, questionPrefix, expectedNodes] of cases) {
    const html = await readFile(new URL(`../public/materials/${version}/index.html`, import.meta.url), 'utf8');
    assert.match(html, /course-learning\.js/);
    assert.equal((html.match(new RegExp(`data-node-id="${nodePrefix}-node-\\d\\d"`, 'g')) || []).length, expectedNodes);
    assert.equal((html.match(new RegExp(`id:\\s*'${questionPrefix}-foundation-q\\d\\d'`, 'g')) || []).length, 6);
    assert.equal((html.match(new RegExp(`id:\\s*'${questionPrefix}-case-q\\d\\d'`, 'g')) || []).length, 5);
    assert.match(html, /CourseLearning\.complete/);
  }
});

test('新增心臟與紅血球教材含情境實驗室、穩定事件與兩階段通關追蹤', async () => {
  const cases = [
    ['../html/心臟構造.html', 'heart-structure'],
    ['../html/心臟血液供應.html', 'coronary-circulation'],
    ['../html/紅血球的恆定機制.html', 'rbc-homeostasis'],
  ] as const;
  for (const [file, prefix] of cases) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(html, /情境實驗室/);
    assert.match(html, /先猜一猜/);
    assert.match(html, /prefers-reduced-motion/);
    assert.match(html, /materials\/course-learning\.js/);
    assert.match(html, new RegExp(`const MATERIAL_ID = '${prefix}'`));
    assert.equal((html.match(new RegExp(`id: '${prefix}-foundation-q\\d\\d'`, 'g')) || []).length, 6);
    assert.equal((html.match(new RegExp(`id: '${prefix}-case-q\\d\\d'`, 'g')) || []).length, 5);
    assert.match(html, /trackComplete\(\)/);
    assert.match(html, /grid-template-columns:minmax\(0,1fr\) auto/);
    assert.match(html, /\.sim-arrow \{ display:none; \}/);
  }
});

test('紅血球教材以 HbA 四聚體與全流程圖呈現恆定機制', async () => {
  const html = await readFile(new URL('../html/紅血球的恆定機制.html', import.meta.url), 'utf8');
  assert.match(html, /紅血球恆定全流程/);
  assert.match(html, /HbA：α₂β₂（四聚體）/);
  assert.match(html, /每個珠蛋白次單元包覆 1 個 heme/);
  assert.match(html, /heme 中心 Fe²⁺ 可逆結合 1 個 O₂/);
  assert.match(html, /合計最多攜帶 4 個 O₂ 分子/);
  assert.match(html, /網狀內皮系統/);
  assert.match(html, /攜氧恢復 → 缺氧刺激下降/);
});

test('血液單元前測（blood-pre-v1）保有 10 題滿分通關與 CL 別名追蹤', async () => {
  const html = await readFile(new URL('../public/materials/blood-pre-v1/index.html', import.meta.url), 'utf8');
  assert.match(html, /course-learning\.js/);
  assert.match(html, /var CL = window\.CourseLearning/);
  // 節點 id 是用 CARDS／TREE／SEQS 三個陣列＋變數組出來的，不是固定屬性，見
  // shared/materials.ts 裡這份教材的註解；這裡改成驗證三個陣列本身的長度，
  // 跟教材自己的 `TOTAL = CARDS.length + TREE.length + SEQS.length + 1` 對得上。
  // CARDS 跟 QUIZ 的物件都有 `q:` 欄位，所以先各自切出陣列區塊的文字範圍再數，
  // 不能直接對整份檔案數 `q:` 出現次數，否則兩個陣列的筆數會混在一起。
  const cardsBlock = html.slice(html.indexOf('var CARDS'), html.indexOf('var TREE'));
  const treeBlock = html.slice(html.indexOf('var TREE'), html.indexOf('var SEQS'));
  const seqsBlock = html.slice(html.indexOf('var SEQS'), html.indexOf('var QUIZ'));
  const quizBlock = html.slice(html.indexOf('var QUIZ'));
  assert.equal((cardsBlock.match(/\{id:"[\w-]+",/g) || []).length, 12);
  assert.equal((treeBlock.match(/\{id:"[\w-]+",\s*lbl:/g) || []).length, 5);
  assert.equal((seqsBlock.match(/\{id:"[\w-]+",\s*t:"[^"]+",\s*src:/g) || []).length, 4);
  assert.equal((quizBlock.match(/\{id:"blood-q\d\d"/g) || []).length, 10);
  assert.match(html, /CL\.complete\(\)/);
  assert.match(html, /perfect = right === QUIZ\.length/);
});

test('血液單元後測（blood-post-v1）保有五關闖關與 CL 別名追蹤', async () => {
  const html = await readFile(new URL('../public/materials/blood-post-v1/index.html', import.meta.url), 'utf8');
  assert.match(html, /course-learning\.js/);
  assert.match(html, /var CL = window\.CourseLearning/);
  // 節點 id 來自 N 物件的 key＋FLOWS／PAIRS 陣列，不是固定屬性，見
  // shared/materials.ts 裡這份教材的註解；這裡驗證 N 物件的相異 key 數量
  // （用「換行後貼齊左邊的字串 key:{」這個排版規則抓，跟教材原始碼的排版風格綁在一起，
  // 如果之後重新排版這個物件，這條斷言要跟著調整抓取規則)。
  assert.equal((html.match(/\n\s*"[\w-]+":\{/g) || []).length, 32);
  assert.equal((html.match(/\{a:"[^"]+",b:/g) || []).length, 10);
  assert.equal((html.match(/\{id:"bp-q\d\d"/g) || []).length, 15);
  assert.match(html, /CL\.complete\(\)/);
  assert.match(html, /var all=STAGES\.every/);
});
