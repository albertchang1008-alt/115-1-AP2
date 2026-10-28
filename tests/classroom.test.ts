import { interactions } from '../scripts/mi-interactions';
const MI_CLASSROOM_COURSE = '115-1-MI-國考精準對焦';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateResponses,
  validateAnswerKeys,
  extractValidSlideKey,
  judgeResponses,
  tally,
  PollRound,
  interactionSeconds,
  interactionExpired,
  interactionTimeLabel,
} from '../shared/classroom';
import fs from 'node:fs';
import { verifyClassroomReveal } from '../scripts/classroom-reveal-verify.mjs';
test('12頁全部選項式，拒絕自由文字與重複排序，沒有答案鍵', () => {
  assert.equal(interactions.length, 12);
  assert.equal(new Set(interactions.map((d) => d.slideId)).size, 12);
  assert(!JSON.stringify(interactions).includes('answerPage'));
  for (const def of interactions) {
    for (const f of def.fields) {
      assert(['choice', 'order'].includes(f.kind));
      assert.equal(new Set(f.options).size, f.options.length);
    }
    const answers = Object.fromEntries(
      def.fields.map((f) => [f.id, f.kind === 'order' ? [...f.options].reverse() : f.options[0]]),
    );
    assert.deepEqual(validateResponses(def, answers), answers);
    assert.throws(() => validateResponses(def, {}));
    assert.throws(() => validateResponses(def, { ...answers, unknown: '自由文字' }));
    assert.throws(() => validateResponses(def, { ...answers, [def.fields[0].id]: '自由輸入' }));
  }
  const def = interactions.find((d) => d.slideId === 'c2-first')!;
  assert.throws(() =>
    validateResponses(def, {
      order: def.fields[0].options.map(() => def.fields[0].options[0]),
      heat: '56℃',
    }),
  );
});
test('所有互動54人計票，每題及排序位置總票数一致，統計不存身分與文字', () => {
  for (const def of interactions) {
    let r: PollRound = {
      ...def,
      id: 'test',
      number: 1,
      status: 'open',
      classIds: ['A'],
      openedAt: 1,
      total: 0,
      counts: {},
    };
    for (let i = 0; i < 54; i++)
      r = tally(
        r,
        validateResponses(
          def,
          Object.fromEntries(
            def.fields.map((f) => [
              f.id,
              f.kind === 'order' ? [...f.options].reverse() : f.options[i % f.options.length],
            ]),
          ),
        ),
      );
    assert.equal(r.total, 54);
    for (const counts of Object.values(r.counts))
      assert.equal(
        counts.reduce((a, b) => a + b, 0),
        54,
      );
    assert(!('texts' in r));
    assert(!('uid' in r));
  }
});
test('舊短答格式不能再接受任意內容', () => {
  const legacy = {
    slideId: 'legacy',
    title: '舊版',
    fields: [{ id: 'reason', label: '理由', kind: 'text', options: [] }],
  };
  assert.throws(() => validateResponses(legacy as any, { reason: '任意文字' }), /格式已停用/);
});

test('倒數顯示到零就停、舊資料顯示已開時間，格式與10秒界線', () => {
  const round = { openedAt: 1000, deadlineAt: 61000 };
  assert.equal(interactionSeconds(round, 51000), 10);
  assert.equal(interactionExpired(round, 61000), true);
  assert.equal(interactionSeconds(round, 99999), 0);
  assert.equal(interactionSeconds({ openedAt: 1000 }, 62000), 61);
  assert.equal(interactionExpired({}, 99999), false);
  assert.equal(interactionTimeLabel(61), '1:01');
});

test('validateAnswerKeys 驗證 choice/order 正解與 300 字解析限制，且對齊複習課 8 題答案鍵', () => {
  // CI 不可讀教師私有資料夾：以同結構合成 8 題（4 單元 × choice/order）驗證規則。
  const reviewIds = ['R-REV-04', 'R-REV-07', 'R-REV-10', 'R-REV-13', 'U-REV-04', 'U-REV-07', 'U-REV-10', 'U-REV-13'];
  const reviewInteractions = reviewIds.map((slideId) =>
    slideId.endsWith('07')
      ? { slideId, title: slideId, fields: [{ id: 'f1', label: '排序', kind: 'order', options: ['甲事件', '乙事件', '丙事件', '丁事件'] }] }
      : { slideId, title: slideId, fields: [{ id: 'f1', label: '單選', kind: 'choice', options: ['選項一', '選項二', '選項三'] }] },
  );
  const reviewAnswerKeys = Object.fromEntries(
    reviewInteractions.map((d) => [
      d.slideId,
      { f1: { answer: d.fields[0].kind === 'order' ? [...d.fields[0].options].reverse() : d.fields[0].options[1], explanation: '合成解析' } },
    ]),
  );
  // 本機若設定 REVIEW_DECKS_DIR，另核對教師私有 8 題答案鍵（CI 不設定）。
  const privateDir = process.env.REVIEW_DECKS_DIR;
  if (privateDir) {
    const realInteractions = JSON.parse(fs.readFileSync(`${privateDir}/review-all.interactions.json`, 'utf8'));
    const realKeys = JSON.parse(fs.readFileSync(`${privateDir}/review-all.answerKeys.json`, 'utf8'));
    assert.equal(Object.keys(validateAnswerKeys(realInteractions, realKeys)).length, 8);
  }
  const valid = validateAnswerKeys(reviewInteractions, reviewAnswerKeys);
  assert.equal(Object.keys(valid).length, 8);
  assert(!JSON.stringify(valid).includes('undefined'));

  // Reject unknown slideId or fieldId
  assert.throws(
    () => validateAnswerKeys(reviewInteractions, { 'NO-SUCH-SLIDE': { f1: { answer: 'x' } } }),
    /找不到互動題目/,
  );
  assert.throws(
    () => validateAnswerKeys(reviewInteractions, { 'R-REV-04': { badField: { answer: 'x' } } }),
    /找不到欄位/,
  );
  // Reject invalid choice answer
  assert.throws(
    () => validateAnswerKeys(reviewInteractions, { 'R-REV-04': { f1: { answer: '不存在的選項' } } }),
    /正解必須是該題 options 之一/,
  );
  // Reject incomplete or duplicate order answer
  const r07Opts = reviewInteractions.find((d: any) => d.slideId === 'R-REV-07').fields[0].options;
  assert.throws(
    () => validateAnswerKeys(reviewInteractions, { 'R-REV-07': { f1: { answer: r07Opts.slice(0, 3) } } }),
    /完整排列/,
  );
  assert.throws(
    () =>
      validateAnswerKeys(reviewInteractions, {
        'R-REV-07': { f1: { answer: [r07Opts[0], r07Opts[0], r07Opts[1], r07Opts[2]] } },
      }),
    /完整排列/,
  );
  // Reject explanation > 300 chars
  assert.throws(
    () =>
      validateAnswerKeys(reviewInteractions, {
        'R-REV-04': {
          f1: {
            answer: reviewInteractions[0].fields[0].options[1],
            explanation: '字'.repeat(301),
          },
        },
      }),
    /不可超過 300 字/,
  );

  // judgeResponses for choice and order (correct, wrong, partial steps, unanswered)
  const r04 = reviewInteractions.find((d: any) => d.slideId === 'R-REV-04');
  const r04Key = valid['R-REV-04'];
  const cRight = judgeResponses(r04, r04Key, { f1: r04Key.f1.answer });
  assert.equal(cRight.answered, true);
  assert.equal(cRight.allCorrect, true);
  assert.equal(cRight.fields.f1.correct, true);

  const cWrong = judgeResponses(r04, r04Key, { f1: r04.fields[0].options[0] });
  assert.equal(cWrong.answered, true);
  assert.equal(cWrong.allCorrect, false);
  assert.equal(cWrong.fields.f1.correct, false);

  const cNone = judgeResponses(r04, r04Key, null);
  assert.equal(cNone.answered, false);
  assert.equal(cNone.allCorrect, false);
  assert.equal(cNone.fields.f1.correct, false);
  assert.equal('actual' in cNone.fields.f1, false);

  const r07 = reviewInteractions.find((d: any) => d.slideId === 'R-REV-07');
  const r07Key = valid['R-REV-07'];
  const expectedOrder = r07Key.f1.answer as string[];
  const oRight = judgeResponses(r07, r07Key, { f1: expectedOrder });
  assert.equal(oRight.allCorrect, true);
  assert.deepEqual(oRight.fields.f1.stepCorrect, [true, true, true, true]);

  const partialOrder = [expectedOrder[0], expectedOrder[2], expectedOrder[1], expectedOrder[3]];
  const oPartial = judgeResponses(r07, r07Key, { f1: partialOrder });
  assert.equal(oPartial.allCorrect, false);
  assert.deepEqual(oPartial.fields.f1.stepCorrect, [true, false, false, true]);

  // extractValidSlideKey checks removed, invalidated, or incomplete field keys
  assert.deepEqual(extractValidSlideKey(r04, valid), r04Key);
  assert.equal(extractValidSlideKey(r04, {}), null);
  assert.equal(
    extractValidSlideKey(r04, { 'R-REV-04': { f1: { answer: '不存在的選項' } } }),
    null,
  );
  const multiFieldSlide = {
    slideId: 'MULTI',
    title: '多欄位',
    fields: [
      { id: 'f1', label: '欄位1', kind: 'choice' as const, options: ['A', 'B'] },
      { id: 'f2', label: '欄位2', kind: 'choice' as const, options: ['X', 'Y'] },
    ],
  };
  assert.equal(
    extractValidSlideKey(multiFieldSlide, { MULTI: { f1: { answer: 'A' } } }),
    null,
  );
  assert.deepEqual(
    extractValidSlideKey(multiFieldSlide, {
      MULTI: { f1: { answer: 'A' }, f2: { answer: 'Y' } },
    }),
    { f1: { answer: 'A' }, f2: { answer: 'Y' } },
  );
});

test('UI 驗收：公佈答案前後教師按鈕、學生三態與排序逐步 ✓/✗、課堂互動紀錄、1440/390 無溢位', async () => {
  const res = await verifyClassroomReveal();
  assert.equal(res.length, 2);
  assert.equal(res.every((r) => r.passed), true);
});

