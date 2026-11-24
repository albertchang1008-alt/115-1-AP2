// 去識別化 W8 成績檔：從 xlsx bytes → 解析 → 比對考卷 → 還原答案 → 報表，每題答對人數須與 Zuvio 原檔一致
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readXlsxFirstSheetMatrix } from '../src/pptImportFiles';
import { parseZuvioMatrix, matchExam, buildResults, examReport, type ZExamView } from '../shared/zuvio';

const dir = new URL('./fixtures/zuvio/', import.meta.url);
const csvRows = readFileSync(new URL('W8-import.csv', dir), 'utf8').replace(/^﻿/, '').split('\r\n').map((l) => l.split(','));
const expected = JSON.parse(readFileSync(new URL('W8-results-expected.json', dir), 'utf8'));
const view: ZExamView = {
  title: csvRows[1][1], score: 4,
  items: csvRows.filter((r) => r[0] === 'a').map((r, i) => {
    const opts = r.slice(4).filter(Boolean).map((t, k) => ({ id: 'abcdefgh'[k], text: t }));
    return { questionId: 'W8-' + (i + 1), unitId: 'u', version: 'v', optionOrder: opts.map((o) => o.id), text: r[1], options: opts, answer: 'abcdefgh'[Number(r[3]) - 1] };
  }),
};

test('去識別化 W8：解析、比對、還原與每題答對人數', async () => {
  const m = await readXlsxFirstSheetMatrix(readFileSync(new URL('W8-results-anon.xlsx', dir)));
  const p = parseZuvioMatrix(m);
  assert.equal(p.title, view.title);
  assert.equal(p.blocks.length, 34);
  assert.ok(!JSON.stringify(p).includes('學生0'), '解析結果不含姓名');
  const match = matchExam(view, p);
  assert.deepEqual(match.blocking, [], match.blocking.join('；'));
  assert.ok(match.garbled >= 1, '原檔第 1 題有亂碼選項');
  const r = buildResults(view, p, match, () => ({ classId: 'A', enabled: true }), ['A']);
  assert.deepEqual(r.blocking, []);
  assert.equal(r.results.size, expected.students);
  const rep = examReport(view, [...r.results.values()], (u) => u);
  assert.deepEqual(rep.questions.map((q) => q.ok), expected.correctByQuestion);
});
