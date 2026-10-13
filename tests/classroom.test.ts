import { interactions } from '../scripts/mi-interactions';
const MI_CLASSROOM_COURSE = '115-1-MI-國考精準對焦';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateResponses,
  tally,
  PollRound,
  interactionSeconds,
  interactionExpired,
  interactionTimeLabel,
} from '../shared/classroom';
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
