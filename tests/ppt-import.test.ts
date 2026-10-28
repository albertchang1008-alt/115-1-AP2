import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  TRUE_FALSE_OPTIONS,
  buildDeckSlideId,
  computeDeckReimportDiff,
  mergeDeckClassroomConfig,
  normalizeDeckId,
  parseQuestionTableRows,
  splitLegacyCombinedDeck,
} from '../shared/pptImport';
import { parseXlsxQuestionSheet } from '../src/pptImportFiles';
import {
  nextPointerToolOnKey,
  shouldYieldPointerShortcut,
} from '../src/SlidePointerTools';
import { verifyPptImport1120 } from '../scripts/ppt-import-1.12.0-verify.mjs';

test('題目表解析：支援單選、排序、是非（對/錯/O/X 自動產生 ○ 對／✕ 錯，底層以 choice 儲存）', () => {
  const deckId = normalizeDeckId('呼吸複習');
  const rows = [
    {
      rowNumber: 2,
      page: 3,
      kind: '單選',
      stem: '有關成人左右主支氣管解剖構造的比較，下列何者正確？',
      options: [
        '右主支氣管較寬、較短且走向較垂直',
        '左主支氣管較寬、較短且走向較垂直',
        '右主支氣管分出兩條肺葉支氣管',
        '終末細支氣管管壁仍具完整透明軟骨環',
      ],
      answer: 'A',
      explanation: '右主支氣管較寬短且垂直，異物較易掉入右側。',
    },
    {
      rowNumber: 3,
      page: 5,
      kind: '排序',
      stem: '請依序排列平靜吸氣的生理事件順序：',
      options: [
        '肺泡內壓低於大氣壓',
        '橫膈與外肋間肌收縮',
        '氣流順壓力差流入肺泡',
        '胸廓擴張且肋膜腔負壓更負',
      ],
      answer: 'B D A C',
      explanation: '吸氣肌先收縮使胸廓擴張，肺泡壓下降後氣流才流入。',
    },
    {
      rowNumber: 4,
      page: 7,
      kind: '是非',
      stem: '動脈血 CO₂ 升高時，CO₂ 可跨越血腦障壁進入腦脊髓液轉化為 H⁺ 刺激延腦中樞化學受器。',
      options: ['', '', '', '', '', ''],
      answer: '對',
      explanation: '血腦障壁對 CO₂ 通透性高，中樞化學受器主要感應腦脊髓液 H⁺ 濃度變化。',
    },
    {
      rowNumber: 5,
      page: 8,
      kind: '是非',
      stem: '平靜呼氣時主要依賴腹直肌與內肋間肌主動劇烈收縮來排出氣體。',
      options: [],
      answer: 'X',
      explanation: '平靜呼氣為被動過程，依賴肺與胸廓彈性回縮。',
    },
  ];

  const res = parseQuestionTableRows(rows, 10, deckId);
  assert.equal(res.canImport, true);
  assert.deepEqual(res.errors, []);
  assert.equal(res.interactions.length, 4);

  // Verify True/False stored as underlying 'choice' with ['○ 對', '✕ 錯']
  const tf1SlideId = buildDeckSlideId(deckId, 7);
  const tf2SlideId = buildDeckSlideId(deckId, 8);
  const tf1Inter = res.interactions.find((q) => q.slideId === tf1SlideId)!;
  assert.equal(tf1Inter.fields[0].kind, 'choice');
  assert.deepEqual(tf1Inter.fields[0].options, [...TRUE_FALSE_OPTIONS]);
  assert.equal(res.answerKeys[tf1SlideId].f1.answer, '○ 對');
  assert.equal(res.answerKeys[tf2SlideId].f1.answer, '✕ 錯');

  // Verify Order answer mapped in sequence
  const orderSlideId = buildDeckSlideId(deckId, 5);
  assert.deepEqual(res.answerKeys[orderSlideId].f1.answer, [
    '橫膈與外肋間肌收縮',
    '胸廓擴張且肋膜腔負壓更負',
    '肺泡內壓低於大氣壓',
    '氣流順壓力差流入肺泡',
  ]);
});

test('題目表防呆檢查：涵蓋所有錯誤類型且有錯誤時禁止匯入（canImport = false）', () => {
  const deckId = 'test-deck';
  const badRows = [
    // 1. Page out of range (> 8)
    {
      rowNumber: 2,
      page: 12,
      kind: '單選',
      stem: '頁碼超標題',
      options: ['甲', '乙'],
      answer: 'A',
      explanation: '正常解析',
    },
    // 2. Fewer than 2 options
    {
      rowNumber: 3,
      page: 2,
      kind: '單選',
      stem: '選項不足題',
      options: ['只有一個選項'],
      answer: 'A',
      explanation: '',
    },
    // 3. More than 6 options
    {
      rowNumber: 4,
      page: 3,
      kind: '單選',
      stem: '選項過多題',
      options: ['1', '2', '3', '4', '5', '6', '7'],
      answer: 'A',
      explanation: '',
    },
    // 4. Single-choice answer out of option range (only 3 options, answer D)
    {
      rowNumber: 5,
      page: 4,
      kind: '單選',
      stem: '答案超範圍題',
      options: ['甲', '乙', '丙'],
      answer: 'D',
      explanation: '',
    },
    // 5. Incomplete order answer (4 options, only 3 letters in answer)
    {
      rowNumber: 6,
      page: 5,
      kind: '排序',
      stem: '排序不完整題',
      options: ['步驟一', '步驟二', '步驟三', '步驟四'],
      answer: 'B A C',
      explanation: '',
    },
    // 6. Invalid True/False answer
    {
      rowNumber: 7,
      page: 6,
      kind: '是非',
      stem: '是非答案錯誤題',
      options: [],
      answer: 'C',
      explanation: '',
    },
    // 7. Explanation > 300 chars
    {
      rowNumber: 8,
      page: 7,
      kind: '是非',
      stem: '解析超長題',
      options: [],
      answer: 'O',
      explanation: '字'.repeat(301),
    },
    // 8. Duplicate page question (page 7 again)
    {
      rowNumber: 9,
      page: 7,
      kind: '是非',
      stem: '同頁重複出題',
      options: [],
      answer: '錯',
      explanation: '',
    },
  ];

  const res = parseQuestionTableRows(badRows, 8, deckId);
  assert.equal(res.canImport, false);
  assert.equal(res.interactions.length, 0);
  assert(res.errors.some((e) => e.includes('頁碼超出簡報總頁數')));
  assert(res.errors.some((e) => e.includes('選項少於 2 個')));
  assert(res.errors.some((e) => e.includes('選項多於 6 個')));
  assert(res.errors.some((e) => e.includes('超出已填選項範圍')));
  assert(res.errors.some((e) => e.includes('不完整或超出範圍')));
  assert(res.errors.some((e) => e.includes('是非題答案')));
  assert(res.errors.some((e) => e.includes('超過 300 字上限')));
  assert(res.errors.some((e) => e.includes('同一頁重複出題')));
});

test('合併進 classroomConfig 時完整保留其他簡報舊題，且重新匯入正確計算新增／變更／刪除差異', () => {
  const existingInteractions = [
    {
      slideId: 'R-REV-04',
      title: '舊呼吸第4頁',
      fields: [{ id: 'f1', label: '舊題1', kind: 'choice' as const, options: ['A1', 'B1'] }],
    },
    {
      slideId: 'deck-uri-P03',
      title: '舊泌尿第3頁',
      fields: [{ id: 'f1', label: '舊題2', kind: 'choice' as const, options: ['U1', 'U2'] }],
    },
  ];
  const existingAnswerKeys = {
    'R-REV-04': { f1: { answer: 'A1', explanation: '舊解析1' } },
    'deck-uri-P03': { f1: { answer: 'U2', explanation: '舊解析2' } },
  };

  // First import of deck "cardio"
  const parsed1 = parseQuestionTableRows(
    [
      {
        rowNumber: 2,
        page: 2,
        kind: '是非',
        stem: '竇房結為正常心臟節律點。',
        options: [],
        answer: 'O',
        explanation: 'SA node 自律性最高。',
      },
      {
        rowNumber: 3,
        page: 4,
        kind: '單選',
        stem: '心室去極化對應哪個心電圖波段？',
        options: ['P 波', 'QRS 複合波', 'T 波'],
        answer: 'B',
        explanation: 'QRS 代表心室去極化。',
      },
    ],
    5,
    'cardio',
  );
  assert.equal(parsed1.canImport, true);

  const merged1 = mergeDeckClassroomConfig({
    existingInteractions,
    existingAnswerKeys,
    deckId: 'cardio',
    newDeckInteractions: parsed1.interactions,
    newDeckAnswerKeys: parsed1.answerKeys,
  });

  // Both legacy decks' questions AND new cardio questions exist
  assert.equal(merged1.interactions.length, 4);
  assert(merged1.interactions.some((q) => q.slideId === 'R-REV-04'));
  assert(merged1.interactions.some((q) => q.slideId === 'deck-uri-P03'));
  assert(merged1.interactions.some((q) => q.slideId === 'cardio-P02'));
  assert(merged1.interactions.some((q) => q.slideId === 'cardio-P04'));
  assert.equal(merged1.answerKeys['R-REV-04'].f1.answer, 'A1');
  assert.equal(merged1.answerKeys['deck-uri-P03'].f1.answer, 'U2');

  // Re-import deck "cardio": keep P02 unchanged, modify P04 explanation, delete P04? Wait: let's modify P02, remove P04, add P05
  const oldSlides = [1, 2, 3, 4, 5].map((n) => ({
    id: buildDeckSlideId('cardio', n),
    title: `第 ${n} 頁`,
    html: `<section>P${n}</section>`,
    notes: '',
    answerPage: false,
  }));
  const newSlides = [1, 2, 3, 5, 6].map((n) => ({
    id: buildDeckSlideId('cardio', n),
    title: n === 3 ? '第 3 頁（更新標題）' : `第 ${n} 頁`,
    html: `<section>P${n}</section>`,
    notes: '',
    answerPage: false,
  }));

  const parsed2 = parseQuestionTableRows(
    [
      {
        rowNumber: 2,
        page: 2,
        kind: '是非',
        stem: '竇房結為正常心臟節律點（已更新題幹）。',
        options: [],
        answer: '對',
        explanation: 'SA node 自律性最高。',
      },
      {
        rowNumber: 3,
        page: 5,
        kind: '單選',
        stem: '新增第 5 頁互動題',
        options: ['選項甲', '選項乙'],
        answer: 'A',
        explanation: '新增解析',
      },
    ],
    6,
    'cardio',
  );

  const diff = computeDeckReimportDiff({
    existingDeck: { slides: oldSlides },
    newSlides,
    existingInteractions: merged1.interactions,
    existingAnswerKeys: merged1.answerKeys,
    newInteractions: parsed2.interactions,
    newAnswerKeys: parsed2.answerKeys,
    deckId: 'cardio',
  });

  assert.equal(diff.isUpdate, true);
  assert.deepEqual(diff.slides.added, ['cardio-P06']);
  assert.deepEqual(diff.slides.changed, ['cardio-P03']);
  assert.deepEqual(diff.slides.removed, ['cardio-P04']);
  assert.deepEqual(diff.questions.added, ['cardio-P05']);
  assert.deepEqual(diff.questions.changed, ['cardio-P02']);
  assert.deepEqual(diff.questions.removed, ['cardio-P04']);
});

test('docs/classroom-decks/題目表範本.xlsx 可直接由前端 ZIP+XML 解析器讀取且不依賴私有路徑', async () => {
  const tplPath = path.resolve('docs/classroom-decks/題目表範本.xlsx');
  assert(fs.existsSync(tplPath), 'repo 內必須包含 docs/classroom-decks/題目表範本.xlsx');
  const buf = fs.readFileSync(tplPath);
  const parsed = await parseXlsxQuestionSheet(buf, 14, 'template-check');
  assert.equal(parsed.canImport, true);
  assert.equal(parsed.items.length, 3);
  assert.deepEqual(
    parsed.items.map((i) => i.rawKind),
    ['單選', '排序', '是非'],
  );
});

test('28 頁合併簡報可遷移拆分為「呼吸複習」與「泌尿＋體液複習」', () => {
  const combinedSlides = Array.from({ length: 28 }, (_, i) => ({
    id: i < 14 ? `R-REV-${String(i + 1).padStart(2, '0')}` : `U-REV-${String(i - 13).padStart(2, '0')}`,
    title: `頁 ${i + 1}`,
    html: '<section></section>',
    notes: '',
    answerPage: false,
  }));
  const split = splitLegacyCombinedDeck({ title: '合併簡報', slides: combinedSlides });
  assert.equal(split.respiratoryDeck.id, 'respiratory-review');
  assert.equal(split.respiratoryDeck.title, '呼吸複習');
  assert.equal(split.respiratoryDeck.slides.length, 14);
  assert.equal(split.urinaryDeck.id, 'urinary-fluid-review');
  assert.equal(split.urinaryDeck.title, '泌尿＋體液複習');
  assert.equal(split.urinaryDeck.slides.length, 14);
});

test('四種指示工具快捷鍵狀態機與輸入框讓位規則（M 放大鏡、S 聚光燈、L 雷射筆、Z 框選放大、Esc）', () => {
  // Activate & toggle off same key
  assert.deepEqual(nextPointerToolOnKey('none', null, 'm'), {
    tool: 'magnifier',
    clearBox: true,
    handled: true,
  });
  assert.deepEqual(nextPointerToolOnKey('magnifier', null, 'M'), {
    tool: 'none',
    clearBox: true,
    handled: true,
  });
  assert.deepEqual(nextPointerToolOnKey('none', null, 's'), {
    tool: 'spotlight',
    clearBox: true,
    handled: true,
  });
  assert.deepEqual(nextPointerToolOnKey('spotlight', null, 'l'), {
    tool: 'laser',
    clearBox: true,
    handled: true,
  });
  assert.deepEqual(nextPointerToolOnKey('laser', null, 'z'), {
    tool: 'zoombox',
    clearBox: true,
    handled: true,
  });

  // In zoombox with an active zoomed region, first Esc returns to full slide while keeping zoombox tool
  assert.deepEqual(
    nextPointerToolOnKey('zoombox', { x: 0.1, y: 0.1, w: 0.4, h: 0.4 }, 'Escape'),
    {
      tool: 'zoombox',
      clearBox: true,
      handled: true,
    },
  );
  // Second Esc (when no zoomed box) closes the tool
  assert.deepEqual(nextPointerToolOnKey('zoombox', null, 'Escape'), {
    tool: 'none',
    clearBox: true,
    handled: true,
  });

  // Shortcut yields when modifier keys are pressed or inside form controls
  assert.equal(shouldYieldPointerShortcut({ ctrlKey: true }), true);
  assert.equal(shouldYieldPointerShortcut({ metaKey: true }), true);
  assert.equal(
    shouldYieldPointerShortcut({
      target: { closest: (sel: string) => (sel.includes('input') ? {} : null) } as any,
    }),
    true,
  );
  assert.equal(
    shouldYieldPointerShortcut({
      target: { closest: () => null } as any,
    }),
    false,
  );
});

test('1.12.0 瀏覽器端整合驗收：多份簡報切換、PDF＋xlsx 匯入預覽、是非題大按鈕作答、四種指示工具（M/S/L/Z）與 PDF 向量重繪', async () => {
  const res = await verifyPptImport1120();
  assert.equal(res.passed, true);
});

