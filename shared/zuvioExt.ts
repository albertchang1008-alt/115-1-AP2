import type { Progress } from './model';
import type { ZExamView, ZResult } from './zuvio';

export const MOOD_QUESTION = '剛寫完這份測驗，你現在的內在狀態最像哪一種？';
export const MOOD_SUBNOTE = '此題不計分，老師會看到你的選擇，用來調整教學';

export const MOOD_CODES = [
  'red_volcano',
  'yellow_rubberband',
  'blue_caterpillar',
  'green_flow',
  'gray_fog',
] as const;

export type MoodCode = (typeof MOOD_CODES)[number];

export interface MoodStudentState {
  code: MoodCode;
  color: string;
  label: string;
  feedback: string;
}

export interface MoodStateMeta extends MoodStudentState {
  teacherNote: string;
}

export const MOOD_STATES: readonly MoodStateMeta[] = [
  {
    code: 'red_volcano',
    color: '#D9534F',
    label: '像快噴發的火山（煩躁、不甘心、覺得題目很刁鑽）',
    teacherNote: '挫敗感強，容易因情緒抗拒檢討錯題',
    feedback: '這份測驗確實不容易！先深呼吸三口氣，等情緒降溫後，我們再一起拆解卡住的地方。',
  },
  {
    code: 'yellow_rubberband',
    color: '#E09F1F',
    label: '像拉滿的橡皮筋（心跳快、腦袋還在高速運轉、怕粗心）',
    teacherNote: '高度焦慮或完美主義',
    feedback: '你已經全力以赴了，現在可以先把橡皮筋放鬆，看看哪些觀念其實比你以為的更穩固。',
  },
  {
    code: 'blue_caterpillar',
    color: '#3B82C4',
    label: '像沒電的毛毛蟲（腦袋一片空白、無力、想直接放棄）',
    teacherNote: '認知超載或準備不足',
    feedback: '辛苦了，大腦剛剛消耗了很多能量。今天先不用一次看完所有錯題，挑一題最簡單的弄懂就好。',
  },
  {
    code: 'green_flow',
    color: '#3D9970',
    label: '像順流的小船／跳跳糖（寫得很順、有掌握感、甚至有點興奮）',
    teacherNote: '心流或準備充分',
    feedback: '很棒的節奏！趁著記憶最清晰的時候，順手把幾道不確定的題目確認一下就大功告成了。',
  },
  {
    code: 'gray_fog',
    color: '#7A828C',
    label: '像隔著一層霧／碎玻璃（說不上來、沒什麼感覺、只是想趕快交卷）',
    teacherNote: '情緒隔離或科目疏離',
    feedback: '有時候「沒感覺」也是大腦保護自己的一種方式。先休息一下，隨時準備好了再回來看解析。',
  },
] as const;

export const MOOD_STUDENT_STATES: readonly MoodStudentState[] = MOOD_STATES.map(
  ({ code, color, label, feedback }) => ({ code, color, label, feedback }),
);

export const MOOD_BY_CODE = Object.fromEntries(MOOD_STATES.map((s) => [s.code, s])) as Record<
  MoodCode,
  MoodStateMeta
>;

export type PreExamStatus = 'passed' | 'practiced' | 'infographic_only' | 'none';

export interface ScoreBin {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface DistractorStat {
  option: string;
  isKey: boolean;
  total: number;
  high: number;
  low: number;
  unused: boolean;
  keySuspect: boolean;
}

export interface ItemAnalysisRow {
  qid: string;
  label: string;
  type: string;
  correctKey: string;
  n: number;
  answered: number;
  blank: number;
  p: number;
  d: number;
  rpb: number;
  distractors: DistractorStat[];
  flags: string[];
}

export interface ExamItemAnalysis {
  summary: {
    students: number;
    lowSample: boolean;
    itemCount: number;
    mean: number;
    sd: number;
    min: number;
    max: number;
    kr20: number | null;
    kr20Low: boolean;
    sem: number | null;
    group27Count: number;
    scoreBins: ScoreBin[];
  };
  items: ItemAnalysisRow[];
}

const SCORE_BINS: Array<{ label: string; min: number; max: number }> = [
  { label: '0-9', min: 0, max: 9 },
  { label: '10-19', min: 10, max: 19 },
  { label: '20-29', min: 20, max: 29 },
  { label: '30-39', min: 30, max: 39 },
  { label: '40-49', min: 40, max: 49 },
  { label: '50-59', min: 50, max: 59 },
  { label: '60-69', min: 60, max: 69 },
  { label: '70-79', min: 70, max: 79 },
  { label: '80-89', min: 80, max: 89 },
  { label: '90-100', min: 90, max: 100 },
];

const round4 = (v: number) => Math.round(v * 10000) / 10000;
const round2 = (v: number) => Math.round(v * 100) / 100;

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  const den = Math.sqrt(vx * vy);
  return den > 0 ? num / den : 0;
}

export function analyzeExam(view: ZExamView, results: ZResult[]): ExamItemAnalysis {
  const n = results.length;
  const k = view.items.length;
  const scores = results.map((r) => r.score);
  const corrects = results.map((r) => r.correct);

  const mean = n ? round2(scores.reduce((a, b) => a + b, 0) / n) : 0;
  const min = n ? Math.min(...scores) : 0;
  const max = n ? Math.max(...scores) : 0;
  const sampleVarScore =
    n > 1 ? scores.reduce((a, s) => a + (s - mean) * (s - mean), 0) / (n - 1) : 0;
  const sd = round2(Math.sqrt(sampleVarScore));

  const meanCorrect = n ? corrects.reduce((a, b) => a + b, 0) / n : 0;
  const popVarCorrect =
    n > 0 ? corrects.reduce((a, c) => a + (c - meanCorrect) * (c - meanCorrect), 0) / n : 0;

  const maxPossible = k * (view.score || 1);
  const binScores = results.map((r) =>
    maxPossible > 100 && k > 0 ? Math.round((r.correct / k) * 100) : r.score,
  );
  const scoreBins: ScoreBin[] = SCORE_BINS.map((b) => ({
    ...b,
    count: binScores.filter((s) => s >= b.min && s <= b.max).length,
  }));

  const indexed = results.map((r, idx) => ({ r, idx }));
  indexed.sort((a, b) => b.r.correct - a.r.correct || b.r.score - a.r.score || a.idx - b.idx);
  const k27 = n >= 2 ? Math.max(1, Math.round(n * 0.27)) : 0;
  const highSet = new Set(indexed.slice(0, k27).map((x) => x.idx));
  const lowSet = new Set(indexed.slice(Math.max(0, n - k27)).map((x) => x.idx));

  let sumPq = 0;
  const items: ItemAnalysisRow[] = view.items.map((it, qIdx) => {
    const itemScores = new Array<number>(n);
    const remTotals = new Array<number>(n);
    const totalCounts = new Map<string, number>();
    const highCounts = new Map<string, number>();
    const lowCounts = new Map<string, number>();

    const optIds = it.optionOrder?.length ? it.optionOrder : it.options.map((o) => o.id);
    const optLabelMap = new Map(it.options.map((o, i) => [o.id, `${String.fromCharCode(65 + i)}. ${o.text}`]));
    for (const opt of optIds) {
      totalCounts.set(opt, 0);
      highCounts.set(opt, 0);
      lowCounts.set(opt, 0);
    }

    let answered = 0;
    let correctCount = 0;
    let highCorrect = 0;
    let lowCorrect = 0;

    for (let i = 0; i < n; i++) {
      const r = results[i];
      const raw = (r.answers[it.questionId] || '').trim();
      const isRight = raw !== '' && raw === it.answer ? 1 : 0;
      if (raw !== '') {
        answered++;
        totalCounts.set(raw, (totalCounts.get(raw) || 0) + 1);
        if (highSet.has(i)) highCounts.set(raw, (highCounts.get(raw) || 0) + 1);
        if (lowSet.has(i)) lowCounts.set(raw, (lowCounts.get(raw) || 0) + 1);
      }
      if (isRight) {
        correctCount++;
        if (highSet.has(i)) highCorrect++;
        if (lowSet.has(i)) lowCorrect++;
      }
      itemScores[i] = isRight;
      remTotals[i] = r.correct - isRight;
    }

    const p = n ? correctCount / n : 0;
    sumPq += p * (1 - p);
    const d = k27 > 0 ? highCorrect / k27 - lowCorrect / k27 : 0;
    const rpb = k > 1 && n >= 2 ? pearson(itemScores, remTotals) : 0;

    const optionOrder = [...optIds];
    for (const seen of totalCounts.keys()) {
      if (!optionOrder.includes(seen)) optionOrder.push(seen);
    }
    const keyHigh = highCounts.get(it.answer) || 0;
    const distractors: DistractorStat[] = optionOrder.map((opt, idx) => {
      const isKey = opt === it.answer;
      const total = totalCounts.get(opt) || 0;
      const high = highCounts.get(opt) || 0;
      const low = lowCounts.get(opt) || 0;
      const unused = !isKey && total === 0 && n > 0;
      const keySuspect =
        !isKey && total > 0 && ((high > keyHigh && high > low) || (rpb < 0 && high >= low));
      const letter = optLabelMap.has(opt) ? String.fromCharCode(65 + idx) : opt;
      return { option: letter, isKey, total, high, low, unused, keySuspect };
    });

    const flags: string[] = [];
    if (distractors.some((x) => x.unused)) flags.push('誘答未選');
    if (rpb < 0 || d < 0) flags.push('負鑑別／反向');
    if (distractors.some((x) => x.keySuspect)) flags.push('疑似錯鍵');

    return {
      qid: it.questionId,
      label: `Q${qIdx + 1}`,
      type: it.unitId,
      correctKey: optIds.includes(it.answer) ? String.fromCharCode(65 + optIds.indexOf(it.answer)) : it.answer,
      n,
      answered,
      blank: n - answered,
      p: round4(p),
      d: round4(d),
      rpb: round4(rpb),
      distractors,
      flags,
    };
  });

  const rawKr20 =
    k > 1 && n > 1 && popVarCorrect > 0 ? (k / (k - 1)) * (1 - sumPq / popVarCorrect) : null;
  const kr20 = rawKr20 !== null ? round4(rawKr20) : null;
  const sem =
    kr20 !== null && n > 1 ? round2(sd * Math.sqrt(Math.max(0, 1 - Math.min(1, kr20)))) : null;

  return {
    summary: {
      students: n,
      lowSample: n < 30,
      itemCount: k,
      mean,
      sd,
      min,
      max,
      kr20,
      kr20Low: kr20 !== null && kr20 < 0.5,
      sem,
      group27Count: k27,
      scoreBins,
    },
    items,
  };
}

export type ItemPreExamStatus = 'practiced' | 'practiced_wrong' | 'none';

export interface PreExamAttemptLite {
  unitId: string;
  at: number;
  answers?: Array<{ questionId: string; correct: boolean }>;
}

export interface PreExamClassification {
  status: PreExamStatus;
  attemptCount: number;
  passedUnitCount: number;
  activityCount: number;
  itemStatuses: Record<string, ItemPreExamStatus>;
  practicedItemCount: number;
  practicedWrongItemCount: number;
  coverage: number;
  passedUnits: boolean;
  completedActivities: boolean;
}

export function classifyPreExamPractice(input: {
  startsAt: number;
  unitIds: string[];
  questionIds?: string[];
  allowedActivityIds?: string[];
  attempts: PreExamAttemptLite[];
  progress?: Partial<Progress> | null;
}): PreExamClassification {
  const unitSet = new Set(input.unitIds);
  const relevantAttempts = input.attempts.filter(
    (a) => unitSet.has(a.unitId) && Number.isFinite(a.at) && a.at < input.startsAt,
  );
  const questionIds = input.questionIds || [];
  const questionSet = new Set(questionIds);
  const seenRight = new Set<string>();
  const seenWrong = new Set<string>();
  for (const att of relevantAttempts) {
    for (const ans of att.answers || []) {
      const qid = ans?.questionId;
      if (!qid || (questionSet.size > 0 && !questionSet.has(qid))) continue;
      if (ans.correct) seenRight.add(qid);
      else seenWrong.add(qid);
    }
  }
  const itemStatuses: Record<string, ItemPreExamStatus> = {};
  let practicedItemCount = 0;
  let practicedWrongItemCount = 0;
  for (const qid of questionIds) {
    if (seenWrong.has(qid)) {
      itemStatuses[qid] = 'practiced_wrong';
      practicedItemCount++;
      practicedWrongItemCount++;
    } else if (seenRight.has(qid)) {
      itemStatuses[qid] = 'practiced';
      practicedItemCount++;
    } else {
      itemStatuses[qid] = 'none';
    }
  }
  const coverage = questionIds.length > 0 ? round2((practicedItemCount / questionIds.length) * 100) : 0;

  const units = input.progress?.units || {};
  let passedUnitCount = 0;
  for (const unitId of unitSet) {
    const passedAt = units[unitId]?.passedAt;
    if (typeof passedAt === 'number' && passedAt < input.startsAt) passedUnitCount++;
  }
  const activityHistory = input.progress?.activityHistory || {};
  const allowedActSet = input.allowedActivityIds ? new Set(input.allowedActivityIds) : null;
  let activityCount = 0;
  for (const [actKey, h] of Object.entries(activityHistory)) {
    if (allowedActSet && !allowedActSet.has(actKey)) continue;
    const first = h?.firstCompletedAt;
    if (typeof first === 'number' && first < input.startsAt) activityCount++;
  }

  const hasPracticedExam = questionIds.length > 0 ? practicedItemCount > 0 : relevantAttempts.length > 0;
  let status: PreExamStatus = 'none';
  if (passedUnitCount > 0) status = 'passed';
  else if (hasPracticedExam) status = 'practiced';
  else if (activityCount > 0) status = 'infographic_only';

  return {
    status,
    attemptCount: relevantAttempts.length,
    passedUnitCount,
    activityCount,
    itemStatuses,
    practicedItemCount,
    practicedWrongItemCount,
    coverage,
    passedUnits: passedUnitCount > 0,
    completedActivities: activityCount > 0,
  };
}

export interface PreExamQuestionStat {
  qid: string;
  label: string;
  practicedCount: number;
  practicedCorrect: number;
  practicedAccuracy: number | null;
  practicedWrongCount: number;
  practicedWrongCorrect: number;
  practicedWrongAccuracy: number | null;
  unpracticedCount: number;
  unpracticedCorrect: number;
  unpracticedAccuracy: number | null;
}

export interface PreExamCoverageBand {
  label: string;
  count: number;
  avgPercentage: number | null;
}

export interface PreExamDetailReport {
  avgCoverage: number;
  byQuestion: PreExamQuestionStat[];
  coverageBands: PreExamCoverageBand[];
}

export function summarizePreExamReport(
  view: ZExamView,
  rows: Array<{
    answers: Record<string, string>;
    percentage: number | null;
    coverage: number;
    itemStatuses: Record<string, ItemPreExamStatus>;
  }>,
): PreExamDetailReport {
  const byQuestion: PreExamQuestionStat[] = view.items.map((it, qIdx) => {
    let practicedCount = 0;
    let practicedCorrect = 0;
    let practicedWrongCount = 0;
    let practicedWrongCorrect = 0;
    let unpracticedCount = 0;
    let unpracticedCorrect = 0;
    for (const r of rows) {
      const right = (r.answers[it.questionId] || '').trim() === it.answer;
      const st = r.itemStatuses?.[it.questionId] || 'none';
      if (st === 'practiced' || st === 'practiced_wrong') {
        practicedCount++;
        if (right) practicedCorrect++;
        if (st === 'practiced_wrong') {
          practicedWrongCount++;
          if (right) practicedWrongCorrect++;
        }
      } else {
        unpracticedCount++;
        if (right) unpracticedCorrect++;
      }
    }
    return {
      qid: it.questionId,
      label: `Q${qIdx + 1}`,
      practicedCount,
      practicedCorrect,
      practicedAccuracy: practicedCount > 0 ? round4(practicedCorrect / practicedCount) : null,
      practicedWrongCount,
      practicedWrongCorrect,
      practicedWrongAccuracy: practicedWrongCount > 0 ? round4(practicedWrongCorrect / practicedWrongCount) : null,
      unpracticedCount,
      unpracticedCorrect,
      unpracticedAccuracy: unpracticedCount > 0 ? round4(unpracticedCorrect / unpracticedCount) : null,
    };
  });

  const bandDefs = [
    { label: '0%', min: 0, max: 0 },
    { label: '1-49%', min: 0.01, max: 49.99 },
    { label: '50-99%', min: 50, max: 99.99 },
    { label: '100%', min: 100, max: 100 },
  ];
  const coverageBands: PreExamCoverageBand[] = bandDefs.map((b) => {
    const matched = rows.filter((r) => r.coverage >= b.min && r.coverage <= b.max);
    const withPct = matched.filter((r) => typeof r.percentage === 'number');
    const avgPercentage =
      withPct.length > 0 ? round2(withPct.reduce((s, r) => s + (r.percentage as number), 0) / withPct.length) : null;
    return { label: b.label, count: matched.length, avgPercentage };
  });

  const avgCoverage = rows.length > 0 ? round2(rows.reduce((s, r) => s + r.coverage, 0) / rows.length) : 0;
  return { avgCoverage, byQuestion, coverageBands };
}

export function calcScorePercentage(
  correct: number | null | undefined,
  itemCount: number,
  score?: number | null,
  maxScore?: number | null,
): number | null {
  if (typeof score === 'number' && typeof maxScore === 'number' && maxScore > 0) {
    return round2((score / maxScore) * 100);
  }
  if (typeof correct === 'number' && itemCount > 0) {
    return round2((correct / itemCount) * 100);
  }
  return null;
}

export interface MoodRecordLite {
  uid: string;
  mood: MoodCode;
}

export interface MoodResultPair {
  uid: string;
  mood?: MoodCode;
  score: number;
  correct?: number;
  percentage?: number;
  answers: Record<string, string>;
}

export interface MoodReportSummary {
  counts: Record<MoodCode, number>;
  totalResponded: number;
  threshold: number;
  byScore: Array<{
    code: MoodCode;
    label: string;
    color: string;
    highCount: number;
    lowCount: number;
    total: number;
    passRate: number;
  }>;
  byQuestion: Array<{
    qid: string;
    label: string;
    stats: Record<MoodCode, { count: number; correct: number; accuracy: number | null }>;
  }>;
  shifts: {
    totalPaired: number;
    toGreen: number;
    toFogOrRed: number;
    unchanged: number;
    transitions: Array<{ from: MoodCode; to: MoodCode; count: number }>;
  } | null;
}

export function summarizeMoodResults(
  view: ZExamView,
  pairs: MoodResultPair[],
  threshold = 80,
  prevMoods?: Record<string, MoodCode>,
  shiftLaterPairs?: MoodResultPair[],
): MoodReportSummary {
  const counts = Object.fromEntries(MOOD_CODES.map((c) => [c, 0])) as Record<MoodCode, number>;
  const highCounts = Object.fromEntries(MOOD_CODES.map((c) => [c, 0])) as Record<MoodCode, number>;
  const lowCounts = Object.fromEntries(MOOD_CODES.map((c) => [c, 0])) as Record<MoodCode, number>;

  let totalResponded = 0;
  for (const p of pairs) {
    if (!p.mood || !(p.mood in counts)) continue;
    totalResponded++;
    counts[p.mood]++;
    const pct =
      typeof p.percentage === 'number'
        ? p.percentage
        : typeof p.correct === 'number' && view.items.length > 0
          ? round2((p.correct / view.items.length) * 100)
          : p.score;
    if (pct >= threshold) highCounts[p.mood]++;
    else lowCounts[p.mood]++;
  }

  const byScore = MOOD_STATES.map((s) => {
    const highCount = highCounts[s.code];
    const lowCount = lowCounts[s.code];
    const total = highCount + lowCount;
    return {
      code: s.code,
      label: s.label,
      color: s.color,
      highCount,
      lowCount,
      total,
      passRate: total ? round4(highCount / total) : 0,
    };
  });

  const byQuestion = view.items.map((it, qIdx) => {
    const stats = Object.fromEntries(
      MOOD_CODES.map((c) => [c, { count: 0, correct: 0, accuracy: null as number | null }]),
    ) as Record<MoodCode, { count: number; correct: number; accuracy: number | null }>;

    for (const p of pairs) {
      if (!p.mood || !(p.mood in stats)) continue;
      stats[p.mood].count++;
      if ((p.answers[it.questionId] || '').trim() === it.answer) stats[p.mood].correct++;
    }
    for (const c of MOOD_CODES) {
      if (stats[c].count > 0) stats[c].accuracy = round4(stats[c].correct / stats[c].count);
    }
    return { qid: it.questionId, label: `Q${qIdx + 1}`, stats };
  });

  let shifts: MoodReportSummary['shifts'] = null;
  if (prevMoods) {
    let totalPaired = 0;
    let toGreen = 0;
    let toFogOrRed = 0;
    let unchanged = 0;
    const transMap = new Map<string, number>();
    const targetPairs = shiftLaterPairs ?? pairs;
    const seen = new Set<string>();

    for (const p of targetPairs) {
      if (seen.has(p.uid)) continue;
      const prev = prevMoods[p.uid];
      if (!prev || !p.mood) continue;
      seen.add(p.uid);
      totalPaired++;
      if (prev === p.mood) unchanged++;
      if (prev !== 'green_flow' && p.mood === 'green_flow') toGreen++;
      if (
        (prev === 'green_flow' || prev === 'yellow_rubberband') &&
        (p.mood === 'red_volcano' || p.mood === 'gray_fog')
      ) {
        toFogOrRed++;
      }
      const key = `${prev}->${p.mood}`;
      transMap.set(key, (transMap.get(key) || 0) + 1);
    }

    const transitions = [...transMap.entries()]
      .map(([k, count]) => {
        const [from, to] = k.split('->') as [MoodCode, MoodCode];
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count);

    shifts = { totalPaired, toGreen, toFogOrRed, unchanged, transitions };
  }

  return { counts, totalResponded, threshold, byScore, byQuestion, shifts };
}

export interface CareStudentInput {
  uid: string;
  studentId: string;
  name: string;
  classId: string;
  score: number | null;
  percentage?: number | null;
  mood: MoodCode | null;
  preExamStatus: PreExamStatus;
  practicedItemCount?: number;
  coverage?: number;
  hasWrongInExam?: boolean;
  recentHistory?: Array<{
    score: number | null;
    percentage?: number | null;
    mood: MoodCode | null;
    preExamStatus: PreExamStatus;
  }>;
}

export interface CareListEntry {
  uid: string;
  studentId: string;
  name: string;
  maskedName: string;
  classId: string;
  score: number | null;
  percentage: number | null;
  mood: MoodCode | null;
  preExamStatus: PreExamStatus;
  preExamCoverage: number;
  practiceGroup: string | null;
  tags: string[];
  streakNotes: string[];
}

export function maskStudentName(name: string): string {
  const chars = [...(name || '').trim()];
  if (chars.length <= 1) return chars.length === 1 ? '○' : '';
  if (chars.length === 2) return `${chars[0]}○`;
  return `${chars[0]}${'○'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

export function buildCareList(students: CareStudentInput[], threshold = 80): CareListEntry[] {
  const entries: CareListEntry[] = [];
  for (const st of students) {
    const tags: string[] = [];
    const streakNotes: string[] = [];
    const pct = typeof st.percentage === 'number' ? st.percentage : st.score;
    const highScore = pct !== null && pct >= threshold;
    const lowScore = pct !== null && pct < threshold;
    const hasPracticed =
      (st.practicedItemCount ?? 0) > 0 ||
      (st.coverage ?? 0) > 0 ||
      st.preExamStatus === 'passed' ||
      st.preExamStatus === 'practiced';

    if (highScore && st.mood === 'yellow_rubberband') {
      tags.push('表現好但緊繃');
    }
    if (lowScore && st.mood === 'blue_caterpillar') {
      tags.push('可能需要鷹架');
    }
    if (lowScore && st.mood === 'green_flow') {
      tags.push('自評與表現有落差');
    }

    const combined = [
      { score: st.score, percentage: pct, mood: st.mood, preExamStatus: st.preExamStatus },
      ...(st.recentHistory || []).map((h) => ({
        score: h.score,
        percentage: typeof h.percentage === 'number' ? h.percentage : h.score,
        mood: h.mood,
        preExamStatus: h.preExamStatus,
      })),
    ];

    let consecutiveBlueLow = 0;
    for (const h of combined) {
      if (h.percentage !== null && h.percentage < threshold && h.mood === 'blue_caterpillar') {
        consecutiveBlueLow++;
      } else {
        break;
      }
    }
    if (consecutiveBlueLow >= 2) {
      const idx = tags.indexOf('可能需要鷹架');
      if (idx >= 0) tags[idx] = '可能需要鷹架（連續）';
      else tags.push('可能需要鷹架（連續）');
      streakNotes.push(`連續 ${consecutiveBlueLow} 場低分＋藍色`);
    }

    let consecutiveGray = 0;
    for (const h of combined) {
      if (h.mood === 'gray_fog') consecutiveGray++;
      else break;
    }
    if (consecutiveGray >= 3) {
      tags.push('持續疏離');
      streakNotes.push(`最近 ${consecutiveGray} 場皆灰`);
    }

    let practiceGroup: string | null = null;
    if (lowScore && st.mood === 'blue_caterpillar') {
      practiceGroup = hasPracticed ? '有練習＋低分＋藍色' : '沒練習＋低分＋藍色';
    } else if (st.mood === 'green_flow' && hasPracticed && (st.hasWrongInExam || lowScore)) {
      practiceGroup = '有練習＋答錯＋綠色';
    }

    if (tags.length > 0 || streakNotes.length > 0 || practiceGroup !== null) {
      entries.push({
        uid: st.uid,
        studentId: st.studentId,
        name: st.name,
        maskedName: maskStudentName(st.name),
        classId: st.classId,
        score: st.score,
        percentage: pct,
        mood: st.mood,
        preExamStatus: st.preExamStatus,
        preExamCoverage: st.coverage ?? 0,
        practiceGroup,
        tags,
        streakNotes,
      });
    }
  }
  return entries.sort((a, b) => b.tags.length - a.tags.length || (a.percentage ?? 999) - (b.percentage ?? 999));
}

export function csvTextCell(value: unknown): string {
  const raw = String(value ?? '');
  const safe = raw === '' ? '' : `'${raw}`;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export function csvNumCell(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '""';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return csvTextCell(value);
}

export function formatCsvLines(headers: string[], rows: Array<Array<string | number | null>>): string {
  const head = headers.map((h) => csvTextCell(h)).join(',');
  const body = rows.map((row) =>
    row.map((cell) => (typeof cell === 'number' ? csvNumCell(cell) : csvTextCell(cell))).join(','),
  );
  return '\ufeff' + [head, ...body].join('\r\n');
}

export function itemAnalysisCsv(
  title: string,
  analysis: ExamItemAnalysis,
): string {
  const maxOpts = Math.max(4, ...analysis.items.map((x) => x.distractors.length));
  const headers = [
    '試卷',
    '題號',
    '題型',
    '正答',
    '作答人數',
    '未作答',
    '難度P',
    '鑑別度D',
    '點二系列r_pb',
    '異常標記',
    ...Array.from({ length: maxOpts }, (_, i) => `選項${i + 1}`),
  ];
  const rows = analysis.items.map((item) => [
    title,
    item.label,
    item.type,
    item.correctKey,
    item.answered,
    item.blank,
    item.p,
    item.d,
    item.rpb,
    item.flags.join('；'),
    ...Array.from({ length: maxOpts }, (_, i) => {
      const d = item.distractors[i];
      if (!d) return '';
      return `${d.option}${d.isKey ? '*' : ''}: 總${d.total}(高${d.high}/低${d.low})`;
    }),
  ]);
  return formatCsvLines(headers, rows);
}

export interface ResearchCsvRow {
  researchId?: string;
  studentId?: string;
  name?: string;
  classId: string;
  sittingLabel: string;
  startsAt: number | null;
  mood: MoodCode | null;
  moodSubmittedAt?: number | null;
  preExamStatus: PreExamStatus;
  coverage?: number | null;
  passedUnits?: boolean;
  completedActivities?: boolean;
  score: number | null;
  percentage?: number | null;
  correct: number | null;
  answers: Record<string, string>;
  itemPreExam?: Record<string, ItemPreExamStatus>;
}

const fmtTaipeiTime = (ms: number | null | undefined) =>
  typeof ms === 'number' && Number.isFinite(ms)
    ? new Date(ms).toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' })
    : '';

export function researchCsv(
  view: ZExamView,
  rows: ResearchCsvRow[],
  deidentified: boolean,
): string {
  const headers = [
    ...(deidentified ? ['研究代碼'] : ['學號', '姓名']),
    '班級',
    '場次',
    '開考時間',
    '情緒狀態',
    '情緒填答時間',
    '考前練習',
    '考前練習覆蓋率(%)',
    '次單元考前達標',
    '圖表考前走完',
    '總分',
    '分數百分比',
    '答對題數',
    ...view.items.flatMap((_, i) => [`Q${i + 1}_作答`, `Q${i + 1}_對錯`, `Q${i + 1}_考前練習`]),
  ];
  const data = rows.map((r) => [
    ...(deidentified ? [r.researchId || ''] : [r.studentId || '', r.name || '']),
    r.classId,
    r.sittingLabel,
    fmtTaipeiTime(r.startsAt),
    r.mood || '',
    fmtTaipeiTime(r.moodSubmittedAt),
    r.preExamStatus,
    r.coverage ?? null,
    r.passedUnits === undefined ? '' : r.passedUnits ? '是' : '否',
    r.completedActivities === undefined ? '' : r.completedActivities ? '是' : '否',
    r.score,
    r.percentage ?? null,
    r.correct,
    ...view.items.flatMap((it) => {
      const ans = (r.answers[it.questionId] || '').trim();
      const hasRes = r.score !== null || ans !== '';
      const isRight = !hasRes ? '' : ans === it.answer ? 1 : 0;
      const itemSt = r.itemPreExam?.[it.questionId] || 'none';
      return [ans, isRight, itemSt];
    }),
  ]);
  return formatCsvLines(headers, data);
}
