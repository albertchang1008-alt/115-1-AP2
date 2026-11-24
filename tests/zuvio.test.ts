import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  zuvioCsv, examCsv, drawItems, optionOrderFor, eligibility, parseZuvioMatrix, matchExam, buildResults, examReport, compareSittings,
  type ZExamView, type ZRosterInfo,
} from '../shared/zuvio';
import { SAMPLE_POOL } from '../shared/zuvioSamplePool';
import { fakeZuvioExport } from '../shared/zuvioSample';

const fixture = readFileSync(new URL('./fixtures/zuvio/W8-import.csv', import.meta.url), 'utf8');
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function viewOf(entries = SAMPLE_POOL, title = 'W8課前1', shuffleOpts = false): ZExamView {
  return {
    title, score: 4,
    items: entries.map((e) => ({ questionId: e.question.id, unitId: e.unitId, version: e.version, optionOrder: optionOrderFor(e.question, shuffleOpts, rand), text: e.question.text, options: e.question.options, answer: e.question.answer })),
  };
}
const students = Array.from({ length: 30 }, (_, i) => ({ studentId: 'T' + String(i + 1).padStart(3, '0'), name: '學生' + (i + 1) }));
const roster = new Map<string, ZRosterInfo>(students.map((s, i) => [s.studentId, { classId: ['甲班', '乙班', '丙班'][i % 3], enabled: true }]));
const lookup = (id: string) => roster.get(id) || null;

test('CSV：以 W8 原檔逐位元相同', () => {
  assert.equal(examCsv(viewOf()), fixture);
});

test('CSV：欄位含逗號、引號、換行時正確加引號', () => {
  const csv = zuvioCsv('名,稱', 4, [{ text: '題"幹', options: ['甲,乙', '丙\n丁'], answerIndex: 1 }]);
  assert.ok(csv.includes('"名,稱"'));
  assert.ok(csv.includes('"題""幹"'));
  assert.ok(csv.includes('"丙\n丁"'));
  assert.ok(csv.includes(',4,2,'));
});

test('打亂選項：正解序號跟著換；含「以上皆是」不打亂', () => {
  const q = { id: 'x', text: 'q', options: [{ id: 'a', text: '一' }, { id: 'b', text: '二' }, { id: 'c', text: '以上皆是' }], answer: 'c' };
  assert.deepEqual(optionOrderFor(q, true, rand), ['a', 'b', 'c']);
  const v = viewOf(SAMPLE_POOL.slice(0, 10), 'T', true);
  const lines = examCsv(v).split('\r\n').slice(2);
  lines.forEach((l, i) => {
    const cols = l.split(',');
    const ans = v.items[i].options.find((o) => o.id === v.items[i].answer)!.text;
    assert.equal(cols[4 + Number(cols[3]) - 1], ans);
  });
});

test('出題排除：圖片、保留題、公式開頭', () => {
  const base = SAMPLE_POOL[0].question;
  assert.equal(eligibility({ ...base, image: 'x.png' }, new Set()), 'image');
  assert.equal(eligibility(base, new Set([base.id])), 'reserved');
  assert.equal(eligibility({ ...base, text: '=1+1' }, new Set()), 'unsafe');
  assert.equal(eligibility(base, new Set()), '');
});

test('抽題：不重複、優先少出過、不足時回報', () => {
  const usage = Object.fromEntries(SAMPLE_POOL.filter((e) => e.unitId === 'gfr').slice(0, 3).map((e) => [e.question.id, { n: 5 }]));
  const { picked, short } = drawItems(SAMPLE_POOL, { units: { gfr: 2, airway: 9 }, groups: { 泌尿: 3 } }, usage, rand);
  assert.equal(new Set(picked.map((p) => p.question.id)).size, picked.length);
  assert.ok(picked.filter((p) => p.unitId === 'gfr').slice(0, 2).every((p) => !usage[p.question.id]));
  assert.ok(short.some((s) => s.includes('呼吸道')));
});

test('成績解析：不含姓名；亂碼選項靠選項表對回；答案正確', () => {
  const v = viewOf(SAMPLE_POOL.slice(0, 8), '小考A', true);
  const ans = (si: number, ii: number) => (si === 0 ? null : (si + ii) % v.items[ii].optionOrder.length);
  const m = fakeZuvioExport(v, students, ans, { garble: { item: 0, option: 0 } });
  const p = parseZuvioMatrix(m);
  assert.equal(p.title, '小考A');
  assert.equal(p.blocks.length, 8);
  assert.ok(!JSON.stringify(p).includes('學生1'), '解析結果不得含姓名');
  const match = matchExam(v, p);
  assert.deepEqual(match.blocking, []);
  assert.equal(match.garbled, 1);
  const r = buildResults(v, p, match, lookup, ['甲班', '乙班', '丙班']);
  assert.deepEqual(r.blocking, []);
  assert.equal(r.results.size, 30);
  const s2 = r.results.get('T002')!;
  v.items.forEach((it, ii) => assert.equal(s2.answers[it.questionId], it.optionOrder[(1 + ii) % it.optionOrder.length]));
  assert.ok(Object.values(r.results.get('T001')!.answers).every((a) => a === ''), '空白＝未答');
});

test('錯卷：名稱、題數、選項重排、兩個亂碼全部阻擋', () => {
  const v = viewOf(SAMPLE_POOL.slice(0, 5), '小考A');
  const ans = () => 0;
  assert.ok(matchExam(v, parseZuvioMatrix(fakeZuvioExport(v, students, ans, { titleOverride: '小考B' }))).blocking.length);
  assert.ok(matchExam({ ...v, items: v.items.slice(0, 4) }, parseZuvioMatrix(fakeZuvioExport(v, students, ans))).blocking.length);
  const reordered = { ...v, items: v.items.map((it, i) => (i === 2 ? { ...it, optionOrder: [...it.optionOrder].reverse() } : it)) };
  assert.ok(matchExam(reordered, parseZuvioMatrix(fakeZuvioExport(v, students, ans))).blocking.length, '選項順序不同');
  const m = fakeZuvioExport(v, students, ans);
  const j = m.findIndex((r) => r[0] === '選項編號');
  m[j + 1][1] = '亂一'; m[j + 2][1] = '亂二';
  assert.ok(matchExam(v, parseZuvioMatrix(m)).blocking.some((b) => b.includes('個選項文字不同')));
});

test('名冊：不在名冊、停用、他班、數字學號、重複學號', () => {
  const v = viewOf(SAMPLE_POOL.slice(0, 3), 'Q');
  const list = [...students.slice(0, 4), { studentId: 'X999', name: '外' }, { studentId: '12', name: '數' }];
  const look = (id: string): ZRosterInfo | null =>
    id === 'X999' ? null : id === '12' ? { classId: '甲班', enabled: true, numericOnlyMatch: true } : id === 'T002' ? { classId: '甲班', enabled: false } : id === 'T003' ? { classId: '丁班', enabled: true } : { classId: '甲班', enabled: true };
  const p = parseZuvioMatrix(fakeZuvioExport(v, list, () => 0));
  const r = buildResults(v, p, matchExam(v, p), look, ['甲班']);
  assert.equal(r.counts.notInRoster, 1);
  assert.equal(r.counts.disabled, 1);
  assert.equal(r.counts.wrongClass, 1);
  assert.equal(r.counts.needTextId, 1);
  assert.ok(r.blocking.length, '數字學號阻擋');
  assert.ok(r.details.every((d) => !d.includes('X999')), '錯誤訊息遮碼');
  const dup = parseZuvioMatrix(fakeZuvioExport(v, [students[0], students[0]], () => 0));
  assert.ok(buildResults(v, dup, matchExam(v, dup), lookup, ['甲班', '乙班', '丙班']).counts.duplicate > 0);
});

test('回答對不到選項：阻擋，不當成未答', () => {
  const v = viewOf(SAMPLE_POOL.slice(0, 2), 'Q');
  const m = fakeZuvioExport(v, students.slice(0, 2), () => 0);
  const i = m.findIndex((r) => r[0] === 'T001' && r.length === 5);
  m[i][4] = '不存在的選項';
  const p = parseZuvioMatrix(m);
  assert.ok(buildResults(v, p, matchExam(v, p), lookup, ['甲班', '乙班', '丙班']).blocking.some((b) => b.includes('對不到')));
});

test('報表與兩場比較', () => {
  const v = viewOf(SAMPLE_POOL.slice(0, 4), 'Q');
  const run = (f: (si: number, ii: number) => number | null) => {
    const p = parseZuvioMatrix(fakeZuvioExport(v, students, f));
    return buildResults(v, p, matchExam(v, p), lookup, ['甲班', '乙班', '丙班']).results;
  };
  const right = (ii: number) => v.items[ii].optionOrder.indexOf(v.items[ii].answer);
  const first = run((si, ii) => (si < 10 ? right(ii) : (right(ii) + 1) % v.items[ii].optionOrder.length));
  const second = run((si, ii) => (si < 20 ? right(ii) : (right(ii) + 1) % v.items[ii].optionOrder.length));
  const rep = examReport(v, [...first.values()], (u) => u);
  assert.equal(rep.students, 30);
  assert.ok(Math.abs(rep.questions[0].rate - 10 / 30) < 1e-9);
  const cmp = compareSittings(v, first, second);
  assert.equal(cmp[0].wrongToRight, 10);
  assert.equal(cmp[0].rightToWrong, 0);
});

test('次單元分配：比例、平均、上限轉移、總數相符', async () => {
  const { allocate } = await import('../shared/zuvio');
  const units = [{ unitId: 'a', n: 20 }, { unitId: 'b', n: 10 }, { unitId: 'c', n: 2 }];
  const p = allocate(units, 16, 'proportional');
  assert.equal(p.a + p.b + p.c, 16);
  assert.ok(p.a > p.b && p.b >= p.c);
  const e = allocate(units, 15, 'equal');
  assert.equal(e.c, 2, '上限');
  assert.equal(e.a + e.b + e.c, 15);
  assert.ok(Math.abs(e.a - e.b) <= 1);
  const all = allocate(units, 99, 'equal');
  assert.deepEqual(all, { a: 20, b: 10, c: 2 }, '超過總量時全給');
});
