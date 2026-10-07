import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chapterCellState,
  classCompletionSummary,
  allClassCompletionSummary,
  matrixCsv,
  chapterCellLabel,
} from '../shared/completionBoard';
import {
  chapterCompletion,
  completion,
  forClass,
  parseCourseTime,
  emptyProgress,
  orderedChapters,
} from '../shared/model';
import {
  fixtureCourse as c,
  fixtureRows as rows,
  fixtureNow as now,
} from './fixtures/completion-board-data';
import { loadCompletionClass } from '../src/CompletionBoard';
import type { API } from '../src/service';
const visible = forClass(c, '護二甲');
test('chapterCellState：未開放仍計分，已完成優先，未開始／作答／活動／逾期與缺passedAt', () => {
  const before = JSON.stringify(c);
  const empty = emptyProgress();
  assert.equal(chapterCellState(visible, '呼吸系統', empty, now).state, 'notOpen');
  assert.equal(completion(visible, empty).total, 3);
  assert.equal(chapterCellState(visible, '呼吸系統', rows.護二甲[0].progress, now).state, 'done');
  assert.equal(chapterCellState(visible, '心臟', empty, now).state, 'notStarted');
  assert.equal(chapterCellState(visible, '心臟', rows.護二甲[1].progress, now).state, 'inProgress');
  assert.equal(chapterCellState(visible, '血液', rows.護二甲[3].progress, now).state, 'inProgress');
  assert.equal(chapterCellState(visible, '血液', empty, now).overdue, true);
  assert.equal(chapterCellState(visible, '血液', rows.護二甲[1].progress, now).lateDone, true);
  assert.equal(chapterCellState(visible, '血液', rows.護二甲[0].progress, now).lateDone, false);
  const p = structuredClone(rows.護二甲[1].progress);
  delete p.units.blood1.passedAt;
  delete p.units.blood2.passedAt;
  assert.equal(chapterCellState(visible, '血液', p, now).lateDone, false);
  const due = parseCourseTime(visible.chapters!.血液.dueAt);
  assert.equal(chapterCellState(visible, '血液', empty, due).overdue, false);
  assert.equal(chapterCellState(visible, '血液', empty, due + 1).overdue, true);
  assert.equal(JSON.stringify(c), before);
});
test('兩班完整名冊、可見性與覆寫：矩陣n/m和計分完成格一致，全部班級加總重算', () => {
  const summaries = c.classIds.map((cl) => classCompletionSummary(c, cl, rows[cl], now));
  for (const cl of c.classIds) {
    const visible = forClass(c, cl),
      s = classCompletionSummary(c, cl, rows[cl], now);
    for (const r of rows[cl]) {
      const cells = orderedChapters(visible).map(({ name }) =>
        chapterCellState(visible, name, r.progress, now),
      );
      assert.equal(
        completion(visible, r.progress).done,
        cells.filter((x) => x.eligible && x.state === 'done').length,
      );
      assert.equal(completion(visible, r.progress).total, cells.filter((x) => x.eligible).length);
    }
    for (const { name } of orderedChapters(visible)) {
      const done = rows[cl].filter((r) => chapterCompletion(visible, name, r.progress).done).length;
      assert.equal(s.rates[name].percent, (done / rows[cl].length) * 100);
    }
  }
  assert.equal(summaries[0].count, 8);
  assert.equal(summaries[1].count, 10);
  assert.equal(summaries[0].requiredTotal, 3);
  assert.equal(summaries[1].requiredTotal, 2);
  assert.equal(summaries[1].rates.呼吸系統, undefined);
  assert.notEqual(summaries[0].rates.血液.dueAt, summaries[1].rates.血液.dueAt);
  assert.equal(summaries[0].rates.補充.required, false);
  const total = allClassCompletionSummary(summaries);
  assert.equal(total.count, 18);
  assert.equal(total.allDone, 3);
  assert.equal(
    total.doneSum,
    summaries.reduce((s, x) => s + x.doneSum, 0),
  );
  assert.equal(
    total.overdue,
    summaries.reduce((s, x) => s + x.overdue, 0),
  );
  assert.equal(total.rates.血液.percent, (4 / 18) * 100);
  assert.notEqual(
    total.rates.血液.percent,
    (summaries[0].rates.血液.percent! + summaries[1].rates.血液.percent!) / 2,
  );
  assert.equal(total.rates.呼吸系統.total, 8, '不可見的班不計該欄分母');
  assert.equal(total.requiredTotal, 44 / 18);
  const zero = classCompletionSummary(c, '護二甲', [], now);
  assert.equal(zero.rates.血液.percent, null);
  assert.equal(zero.averageDone, null);
  const optionalOverride = structuredClone(c);
  optionalOverride.chapterOverrides!.護二乙.補充 = { required: true };
  const optionalSummary = classCompletionSummary(optionalOverride, '護二乙', rows.護二乙, now);
  assert.equal(optionalSummary.requiredTotal, 3, '班級可把同一單元覆寫為必做');
  assert.equal(optionalSummary.rates.補充.required, true);
  assert.equal(summaries[0].rates.補充.required, false, '另一班維持選看');
  assert.equal(rows.護二甲[5].uid, null);
  assert.equal(summaries[0].rates.血液.total, 8, '未登入學生仍在分母');
});
test('CSV使用同一格子狀態且只含傳入篩選名單；不把無成績改成零分', () => {
  const csv = matrixCsv(c, '護二甲', [rows.護二甲[1], rows.護二甲[5]], now);
  assert.equal(csv.length, 2);
  assert.equal(csv[0].血液, '逾期完成');
  assert.equal(csv[1].呼吸系統, '未開放');
  assert.equal(csv[0].已完成, 1);
  assert.equal(csv[0].應完成, 3);
  assert.equal(
    chapterCellLabel(chapterCellState(visible, '血液', rows.護二甲[5].progress, now)),
    '逾期未完成',
  );
  assert.equal(rows.護二甲[5].progress.units.blood1, undefined);
});
test('既有getCompletion分頁讀完53人；失敗不回傳部分名單、重複游標不無限讀取', async () => {
  const pages = [
    {
      course: c,
      rows: Array.from({ length: 50 }, (_, i) => ({ ...rows.護二甲[0], studentId: String(i) })),
      next: '49',
    },
    {
      course: c,
      rows: Array.from({ length: 3 }, (_, i) => ({ ...rows.護二甲[0], studentId: String(i + 50) })),
      next: null,
    },
  ];
  const calls: any[] = [],
    progress: number[] = [];
  const api = {
    preview: false,
    async call(name: string, data: any) {
      calls.push({ name, data });
      return pages.shift();
    },
  } as API;
  const loaded = await loadCompletionClass(api, c.id, '護二甲', (n) => progress.push(n));
  assert.equal(loaded.rows.length, 53);
  assert.deepEqual(progress, [50, 53]);
  assert.deepEqual(
    calls.map((x) => x.data.after),
    ['', '49'],
  );
  assert(calls.every((x) => x.name === 'getCompletion'));
  let n = 0;
  await assert.rejects(
    () =>
      loadCompletionClass(
        {
          preview: false,
          async call() {
            if (n++) throw Error('離線');
            return { course: c, rows: [rows.護二甲[0]], next: 'cursor' } as any;
          },
        },
        c.id,
        '護二甲',
        () => {},
      ),
    /離線/,
  );
  await assert.rejects(
    () =>
      loadCompletionClass(
        {
          preview: false,
          async call() {
            return { course: c, rows: [], next: 'cursor' } as any;
          },
        },
        c.id,
        '護二甲',
        () => {},
      ),
    /游標重複/,
  );
  n = 0;
  await assert.rejects(
    () =>
      loadCompletionClass(
        {
          preview: false,
          async call() {
            return { course: n++ ? { ...c, publishedAt: 2 } : c, rows: [], next: 'cursor' } as any;
          },
        },
        c.id,
        '護二甲',
        () => {},
      ),
    /重新發布/,
  );
});
