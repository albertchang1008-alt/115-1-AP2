import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readXlsxFirstSheetMatrix } from '../src/pptImportFiles';
import {
  parseZuvioMatrix,
  matchExam,
  buildResults,
  type ZExamView,
  type ZResult,
} from '../shared/zuvio';
import {
  analyzeExam,
  classifyPreExamPractice,
  summarizeMoodResults,
  buildCareList,
  maskStudentName,
  itemAnalysisCsv,
  researchCsv,
} from '../shared/zuvioExt';

function makeTinyView(nItems = 2): ZExamView {
  return {
    title: '小測',
    score: 10,
    items: Array.from({ length: nItems }, (_, i) => ({
      questionId: `q${i + 1}`,
      unitId: `u${i + 1}`,
      version: 'v1',
      optionOrder: ['a', 'b', 'c', 'd'],
      text: `題${i + 1}`,
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' },
      ],
      answer: 'a',
    })),
  };
}

test('analyzeExam：人工可核對小樣本計算（mean, SD, KR-20, SEM, P, D, r_pb, <30 警示）', () => {
  const view = makeTinyView(2);
  // 4 students:
  // s1: q1=a, q2=a -> correct=2, score=100
  // s2: q1=a, q2=a -> correct=2, score=100
  // s3: q1=a, q2=b -> correct=1, score=50
  // s4: q1=b, q2=b -> correct=0, score=0
  const results: ZResult[] = [
    { classId: 'A', answers: { q1: 'a', q2: 'a' }, correct: 2, score: 100 },
    { classId: 'A', answers: { q1: 'a', q2: 'a' }, correct: 2, score: 100 },
    { classId: 'A', answers: { q1: 'a', q2: 'b' }, correct: 1, score: 50 },
    { classId: 'A', answers: { q1: 'b', q2: 'b' }, correct: 0, score: 0 },
  ];

  const a = analyzeExam(view, results);
  assert.equal(a.summary.students, 4);
  assert.equal(a.summary.lowSample, true);
  assert.equal(a.summary.mean, 62.5);
  assert.equal(a.summary.min, 0);
  assert.equal(a.summary.max, 100);
  // sample SD of [100, 100, 50, 0] = sqrt(6875 / 3) = 47.87135... -> 47.87
  assert.equal(a.summary.sd, 47.87);

  // p1 = 0.75 (p*q = 0.1875), p2 = 0.5 (p*q = 0.25), sumPq = 0.4375
  // corrects = [2, 2, 1, 0], mean=1.25, popVar = (0.5625+0.5625+0.0625+1.5625)/4 = 2.75/4 = 0.6875
  // KR20 = (2/1) * (1 - 0.4375 / 0.6875) = 2 * (1 - 0.6363636) = 0.7273
  assert.equal(a.summary.kr20, 0.7273);
  assert.equal(a.summary.kr20Low, false);
  // SEM = 47.87135 * sqrt(1 - 0.72727) ~= 25.00
  assert.ok(a.summary.sem !== null && Math.abs(a.summary.sem - 25) < 0.05);

  // Q1: p=0.75, k27=1 -> high(s1)=1, low(s4)=0 => D=1
  // Q1 r_pb against Q2=[1,1,0,0]: [1,1,1,0] vs [1,1,0,0] -> corr = 0.5774
  assert.equal(a.items[0].p, 0.75);
  assert.equal(a.items[0].d, 1);
  assert.equal(a.items[0].rpb, 0.5774);
  assert.ok(a.items[0].flags.includes('誘答未選')); // C and D unused
});

test('analyzeExam：負鑑別／疑似錯鍵與匿名 W8 fixture（含 Q30）', async () => {
  const dir = new URL('./fixtures/zuvio/', import.meta.url);
  const csvRows = readFileSync(new URL('W8-import.csv', dir), 'utf8')
    .replace(/^\ufeff/, '')
    .split('\r\n')
    .map((l) => l.split(','));
  const view: ZExamView = {
    title: csvRows[1][1],
    score: 4,
    items: csvRows
      .filter((r) => r[0] === 'a')
      .map((r, i) => {
        const opts = r
          .slice(4)
          .filter(Boolean)
          .map((t, k) => ({ id: 'abcdefgh'[k], text: t }));
        return {
          questionId: 'W8-' + (i + 1),
          unitId: 'u',
          version: 'v',
          optionOrder: opts.map((o) => o.id),
          text: r[1],
          options: opts,
          answer: 'abcdefgh'[Number(r[3]) - 1],
        };
      }),
  };
  const m = await readXlsxFirstSheetMatrix(readFileSync(new URL('W8-results-anon.xlsx', dir)));
  const parsed = parseZuvioMatrix(m);
  const match = matchExam(view, parsed);
  const built = buildResults(view, parsed, match, () => ({ classId: 'A', enabled: true }), ['A']);
  const results = [...built.results.values()];

  const analysis = analyzeExam(view, results);
  assert.equal(analysis.summary.students, results.length);
  assert.equal(analysis.summary.lowSample, false);
  assert.equal(analysis.items.length, 34);
  const q30 = analysis.items[29];
  assert.equal(q30.label, 'Q30');
  assert.ok(q30.p >= 0 && q30.p <= 1);
  assert.ok(Number.isFinite(q30.d) && Number.isFinite(q30.rpb));
  console.log('W8 summary:', JSON.stringify({ ...analysis.summary, scoreBins: undefined }));
  console.log('W8 Q30:', JSON.stringify(q30));
  console.log('W8 flagged:', JSON.stringify(analysis.items.filter((x) => x.flags.length > 0).map((x) => ({ label: x.label, p: x.p, d: x.d, rpb: x.rpb, flags: x.flags }))));

  // Synthetic reverse-keyed item: high scorers pick B, low scorers pick A (key=A)
  const badView = makeTinyView(2);
  const badResults: ZResult[] = [
    { classId: 'A', answers: { q1: 'a', q2: 'b' }, correct: 1, score: 50 },
    { classId: 'A', answers: { q1: 'a', q2: 'b' }, correct: 1, score: 50 },
    { classId: 'A', answers: { q1: 'a', q2: 'a' }, correct: 2, score: 100 },
    { classId: 'A', answers: { q1: 'b', q2: 'a' }, correct: 1, score: 50 },
    { classId: 'A', answers: { q1: 'b', q2: 'a' }, correct: 1, score: 50 },
    { classId: 'A', answers: { q1: 'b', q2: 'a' }, correct: 1, score: 50 },
  ];
  // In badResults: high scorer on q1 (a=1) picks b on q2 (score 0), low scorer on q1 (b=0) picks a on q2 (score 1)
  const badAnalysis = analyzeExam(badView, badResults);
  assert.ok(badAnalysis.items[1].rpb < 0);
  assert.ok(badAnalysis.items[1].flags.includes('負鑑別／反向'));
});

test('classifyPreExamPractice：以 startsAt 嚴格切分達標／練過／僅看教材／未練', () => {
  const startsAt = 1000;
  assert.equal(
    classifyPreExamPractice({
      startsAt,
      unitIds: ['u1'],
      attempts: [{ unitId: 'u1', at: 500 }],
      progress: { units: { u1: { best: 90, attempts: 1, updatedAt: 500, passedAt: 500 } } },
    }).status,
    'passed',
  );
  // passed AFTER startsAt does not count; attempt BEFORE startsAt counts as practiced
  assert.equal(
    classifyPreExamPractice({
      startsAt,
      unitIds: ['u1'],
      attempts: [{ unitId: 'u1', at: 900 }],
      progress: { units: { u1: { best: 90, attempts: 2, updatedAt: 1500, passedAt: 1500 } } },
    }).status,
    'practiced',
  );
  // attempt AFTER startsAt ignored; activityHistory before startsAt counts as infographic_only
  assert.equal(
    classifyPreExamPractice({
      startsAt,
      unitIds: ['u1'],
      attempts: [{ unitId: 'u1', at: 1200 }],
      progress: {
        units: {},
        activityHistory: { '01-intro': { opens: 1, completions: 1, firstCompletedAt: 800 } },
      },
    }).status,
    'infographic_only',
  );
  assert.equal(
    classifyPreExamPractice({
      startsAt,
      unitIds: ['u1'],
      attempts: [{ unitId: 'u1', at: 1200 }],
      progress: {
        units: {},
        activityHistory: { '01-intro': { opens: 1, completions: 1, firstCompletedAt: 1200 } },
      },
    }).status,
    'none',
  );
});

test('summarizeMoodResults & buildCareList：門檻切換、跨場變化與 4 標籤規則', () => {
  const view = makeTinyView(2);
  const moodSummary = summarizeMoodResults(
    view,
    [
      { uid: 'u1', mood: 'red_volcano', score: 75, answers: { q1: 'a', q2: 'b' } },
      { uid: 'u2', mood: 'green_flow', score: 85, answers: { q1: 'a', q2: 'a' } },
      { uid: 'u3', mood: 'gray_fog', score: 60, answers: { q1: 'b', q2: 'b' } },
    ],
    80,
    { u1: 'green_flow', u2: 'yellow_rubberband', u3: 'gray_fog' },
  );
  assert.equal(moodSummary.counts.red_volcano, 1);
  assert.equal(moodSummary.byScore.find((x) => x.code === 'red_volcano')?.lowCount, 1);
  assert.equal(moodSummary.shifts?.toGreen, 1);
  assert.equal(moodSummary.shifts?.toFogOrRed, 1);

  const care = buildCareList([
    {
      uid: 'u1',
      studentId: 'S001',
      name: '王小明',
      classId: 'A',
      score: 70,
      mood: 'red_volcano',
      preExamStatus: 'passed',
    },
    {
      uid: 'u2',
      studentId: 'S002',
      name: '李華',
      classId: 'A',
      score: 65,
      mood: 'gray_fog',
      preExamStatus: 'none',
      recentHistory: [
        { score: 70, mood: 'gray_fog', preExamStatus: 'none' },
        { score: 85, mood: 'green_flow', preExamStatus: 'none' },
      ],
    },
    {
      uid: 'u3',
      studentId: 'S003',
      name: '陳大同',
      classId: 'A',
      score: 95,
      mood: 'green_flow',
      preExamStatus: 'passed',
    },
  ]);

  assert.equal(care.length, 2);
  assert.equal(maskStudentName('王小明'), '王○明');
  assert.equal(maskStudentName('李華'), '李○');
  const c1 = care.find((c) => c.uid === 'u1')!;
  const c2 = care.find((c) => c.uid === 'u2')!;
  assert.ok(c1.tags.includes('情緒：小火山'));
  assert.ok(c1.tags.includes('已達標仍低分'));
  assert.ok(c2.tags.includes('低分＋低能量／霧'));
  assert.ok(c2.tags.includes('連續未練習'));
  assert.ok(c2.streakNotes.some((n) => n.includes('最近 3 場皆灰')));
});

test('CSV 匯出：文字欄加單引號防公式注入且去識別不含姓名與學號', () => {
  const view = makeTinyView(2);
  const analysis = analyzeExam(view, [
    { classId: 'A', answers: { q1: 'a', q2: 'a' }, correct: 2, score: 100 },
  ]);
  const itemCsv = itemAnalysisCsv('=CMD()', analysis);
  assert.ok(itemCsv.startsWith('\ufeff'));
  assert.ok(itemCsv.includes('"\'=CMD()"'));

  const anonCsv = researchCsv(
    view,
    [
      {
        researchId: 'R_HASH_1',
        studentId: 'B12345',
        name: '王小明',
        classId: '=A',
        sittingLabel: '場次1',
        startsAt: 1700000000000,
        mood: 'green_flow',
        preExamStatus: 'passed',
        score: 100,
        correct: 2,
        answers: { q1: 'a', q2: 'a' },
      },
    ],
    true,
  );
  assert.ok(!anonCsv.includes('王小明'));
  assert.ok(!anonCsv.includes('B12345'));
  assert.ok(anonCsv.includes('"\'R_HASH_1"'));
  assert.ok(anonCsv.includes('"\'=A"'));

  const namedCsv = researchCsv(
    view,
    [
      {
        studentId: 'B12345',
        name: '王小明',
        classId: 'A',
        sittingLabel: '場次1',
        startsAt: 1700000000000,
        mood: 'green_flow',
        preExamStatus: 'passed',
        score: 100,
        correct: 2,
        answers: { q1: 'a', q2: 'a' },
      },
    ],
    false,
  );
  assert.ok(namedCsv.includes('"\'B12345"'));
  assert.ok(namedCsv.includes('"\'王小明"'));
});
