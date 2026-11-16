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
  MOOD_QUESTION,
  MOOD_STATES,
  MOOD_SUBNOTE,
  analyzeExam,
  buildCareList,
  calcScorePercentage,
  classifyPreExamPractice,
  itemAnalysisCsv,
  maskStudentName,
  researchCsv,
  summarizeMoodResults,
  summarizePreExamReport,
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
      score: 90,
      percentage: 90,
      mood: 'yellow_rubberband',
      preExamStatus: 'passed',
      practicedItemCount: 2,
      coverage: 100,
    },
    {
      uid: 'u2',
      studentId: 'S002',
      name: '李華',
      classId: 'A',
      score: 65,
      percentage: 65,
      mood: 'blue_caterpillar',
      preExamStatus: 'none',
      practicedItemCount: 0,
      coverage: 0,
      recentHistory: [
        { score: 70, percentage: 70, mood: 'blue_caterpillar', preExamStatus: 'none' },
      ],
    },
    {
      uid: 'u3',
      studentId: 'S003',
      name: '陳大同',
      classId: 'A',
      score: 60,
      percentage: 60,
      mood: 'green_flow',
      preExamStatus: 'practiced',
      practicedItemCount: 1,
      coverage: 50,
      hasWrongInExam: true,
    },
    {
      uid: 'u4',
      studentId: 'S004',
      name: '林小美',
      classId: 'A',
      score: 88,
      percentage: 88,
      mood: 'gray_fog',
      preExamStatus: 'passed',
      recentHistory: [
        { score: 90, percentage: 90, mood: 'gray_fog', preExamStatus: 'passed' },
        { score: 75, percentage: 75, mood: 'gray_fog', preExamStatus: 'practiced' },
      ],
    },
    {
      uid: 'u5',
      studentId: 'S005',
      name: '張小強',
      classId: 'A',
      score: 95,
      percentage: 95,
      mood: 'green_flow',
      preExamStatus: 'passed',
    },
  ]);

  assert.equal(care.length, 4);
  assert.equal(maskStudentName('王小明'), '王○明');
  assert.equal(maskStudentName('李華'), '李○');
  const c1 = care.find((c) => c.uid === 'u1')!;
  const c2 = care.find((c) => c.uid === 'u2')!;
  const c3 = care.find((c) => c.uid === 'u3')!;
  const c4 = care.find((c) => c.uid === 'u4')!;
  assert.ok(c1.tags.includes('表現好但緊繃'));
  assert.ok(c2.tags.includes('可能需要鷹架（連續）'));
  assert.equal(c2.practiceGroup, '沒練習＋低分＋藍色');
  assert.ok(c3.tags.includes('自評與表現有落差'));
  assert.equal(c3.practiceGroup, '有練習＋答錯＋綠色');
  assert.ok(c4.tags.includes('持續疏離'));
  assert.ok(c4.streakNotes.some((n) => n.includes('最近 3 場皆灰')));
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


test('F1：逐題考前練習（練過／練過且答錯過／沒練過）、同單元別題不誤算、聚合報表與研究CSV欄位', () => {
  // 同單元僅練過別題 q_other，未練考卷 q1/q2 -> status 應為 none，且 coverage=0
  const onlyOther = classifyPreExamPractice({
    startsAt: 1000,
    unitIds: ['u1'],
    questionIds: ['q1', 'q2'],
    allowedActivityIds: [],
    attempts: [{ unitId: 'u1', at: 500, answers: [{ questionId: 'q_other', correct: true }] }],
    progress: {},
  });
  assert.equal(onlyOther.status, 'none');
  assert.equal(onlyOther.coverage, 0);
  assert.deepEqual(onlyOther.itemStatuses, { q1: 'none', q2: 'none' });

  // q1 練過且答對，q2 練過且曾答錯，q3 沒練過
  const mixed = classifyPreExamPractice({
    startsAt: 1000,
    unitIds: ['u1', 'u2'],
    questionIds: ['q1', 'q2', 'q3'],
    allowedActivityIds: ['chapter:C1_act1'],
    attempts: [
      {
        unitId: 'u1',
        at: 400,
        answers: [
          { questionId: 'q1', correct: true },
          { questionId: 'q2', correct: false },
        ],
      },
      { unitId: 'u2', at: 600, answers: [{ questionId: 'q2', correct: true }] },
    ],
    progress: {
      units: { u1: { best: 80, attempts: 1, updatedAt: 400 } },
      activityHistory: { 'chapter:C1_act1': { opens: 1, completions: 1, firstCompletedAt: 700 } },
    },
  });
  assert.equal(mixed.status, 'practiced');
  assert.equal(mixed.practicedItemCount, 2);
  assert.equal(mixed.practicedWrongItemCount, 1);
  assert.equal(mixed.coverage, 66.67);
  assert.equal(mixed.passedUnits, false);
  assert.equal(mixed.completedActivities, true);
  assert.deepEqual(mixed.itemStatuses, { q1: 'practiced', q2: 'practiced_wrong', q3: 'none' });

  // 聚合報表：練過 vs 沒練過答對率 + 覆蓋率區間
  const view = makeTinyView(2);
  const preDetail = summarizePreExamReport(view, [
    { answers: { q1: 'a', q2: 'a' }, percentage: 100, coverage: 100, itemStatuses: { q1: 'practiced', q2: 'practiced' } },
    { answers: { q1: 'a', q2: 'b' }, percentage: 50, coverage: 50, itemStatuses: { q1: 'practiced_wrong', q2: 'none' } },
    { answers: { q1: 'b', q2: 'b' }, percentage: 0, coverage: 0, itemStatuses: { q1: 'none', q2: 'none' } },
  ]);
  assert.equal(preDetail.avgCoverage, 50);
  assert.equal(preDetail.byQuestion[0].practicedCount, 2);
  assert.equal(preDetail.byQuestion[0].practicedAccuracy, 1);
  assert.equal(preDetail.byQuestion[0].unpracticedCount, 1);
  assert.equal(preDetail.byQuestion[0].unpracticedAccuracy, 0);

  // 研究 CSV 包含填答時間、百分比、覆蓋率、次單元達標、圖表走完、逐題對錯與逐題考前練習
  const csv = researchCsv(
    view,
    [
      {
        researchId: 'R1',
        classId: 'A',
        sittingLabel: 'S1',
        startsAt: 1700000000000,
        mood: 'green_flow',
        moodSubmittedAt: 1700000060000,
        preExamStatus: 'practiced',
        coverage: 50,
        passedUnits: false,
        completedActivities: true,
        score: 5,
        percentage: 50,
        correct: 1,
        answers: { q1: 'a', q2: 'b' },
        itemPreExam: { q1: 'practiced', q2: 'practiced_wrong' },
      },
    ],
    true,
  );
  const headerLine = csv.split('\r\n')[0];
  assert.ok(headerLine.includes('情緒填答時間'));
  assert.ok(headerLine.includes('分數百分比'));
  assert.ok(headerLine.includes('考前練習覆蓋率(%)'));
  assert.ok(headerLine.includes('次單元考前達標'));
  assert.ok(headerLine.includes('圖表考前走完'));
  assert.ok(headerLine.includes('Q1_作答'));
  assert.ok(headerLine.includes('Q1_對錯'));
  assert.ok(headerLine.includes('Q1_考前練習'));
  assert.ok(csv.includes('"\'practiced_wrong"'));
});

test('F3：80%門檻以百分比比較（滿分10、100、136），非原始分數', () => {
  // 滿分 10 分：答對 1 題 (10/10 = 100%) 應為高分，原 score=10 不應誤判為低於 80
  const tiny10 = makeTinyView(1);
  const res10 = summarizeMoodResults(
    tiny10,
    [{ uid: 'u1', mood: 'green_flow', score: 10, correct: 1, percentage: calcScorePercentage(1, 1, 10, 10) ?? 0, answers: { q1: 'a' } }],
    80,
  );
  assert.equal(res10.byScore.find((x) => x.code === 'green_flow')?.highCount, 1);
  assert.equal(res10.byScore.find((x) => x.code === 'green_flow')?.lowCount, 0);

  // 滿分 136 分：score=80 (58.82%) 應為低分，不應因 >=80 誤判高分
  assert.equal(calcScorePercentage(20, 34, 80, 136), 58.82);
  const care136 = buildCareList([
    { uid: 'u2', studentId: 'S2', name: '張生', classId: 'A', score: 80, percentage: 58.82, mood: 'green_flow', preExamStatus: 'none' },
  ], 80);
  assert.equal(care136.length, 1);
  assert.ok(care136[0].tags.includes('自評與表現有落差'));
});

test('F4：學生告知不得宣稱不記名且五狀態文字須完全符合附錄原文', () => {
  assert.equal(MOOD_QUESTION, '剛寫完這份測驗，你現在的內在狀態最像哪一種？');
  assert.equal(MOOD_SUBNOTE, '此題不計分，老師會看到你的選擇，用來調整教學');
  assert.ok(!MOOD_SUBNOTE.includes('不記名') && !MOOD_SUBNOTE.includes('匿名'));
  assert.equal(MOOD_STATES[0].label, '像快噴發的火山（煩躁、不甘心、覺得題目很刁鑽）');
  assert.equal(MOOD_STATES[1].feedback, '你已經全力以赴了，現在可以先把橡皮筋放鬆，看看哪些觀念其實比你以為的更穩固。');
  assert.equal(MOOD_STATES[4].teacherNote, '情緒隔離或科目疏離');
});

test('F7：兩場情緒轉變只配對後場一次、去重學號不膨脹', () => {
  const view = makeTinyView(1);
  const allPairs = [
    { uid: 'S1', mood: 'blue_caterpillar' as const, score: 50, correct: 0, percentage: 0, answers: { q1: 'b' } },
    { uid: 'S1', mood: 'green_flow' as const, score: 100, correct: 1, percentage: 100, answers: { q1: 'a' } },
  ];
  const laterOnly = [allPairs[1]];
  const res = summarizeMoodResults(view, allPairs, 80, { S1: 'blue_caterpillar' }, laterOnly);
  assert.equal(res.shifts?.totalPaired, 1);
  assert.equal(res.shifts?.unchanged, 0);
  assert.equal(res.shifts?.toGreen, 1);
});

test('F9：圖表考前走完僅計入考卷相關次單元', () => {
  const res = classifyPreExamPractice({
    startsAt: 1000,
    unitIds: ['u1'],
    questionIds: ['q1'],
    allowedActivityIds: ['chapter:C1_u1act'],
    attempts: [],
    progress: {
      units: {},
      activityHistory: { unrelated_act: { opens: 1, completions: 1, firstCompletedAt: 100 } },
    },
  });
  assert.equal(res.activityCount, 0);
  assert.equal(res.completedActivities, false);
  assert.equal(res.status, 'none');
});
