import type { Progress } from './model';
import type { ZExamView, ZResult } from './zuvio';

export const MOOD_QUESTION = '你現在的狀態比較像哪一個？';
export const MOOD_SUBNOTE = '只會讓老師看到匿名人數分布；不會記名，也不影響成績';

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
    label: '🌋 小火山要爆了：好煩、好想罵人、想逃跑',
    teacherNote: '高激發負向；考前恐慌或抗拒',
    feedback: '先把氣吐出來也沒關係。這份考卷不是在決定你這個人，現在只要先把會的幾題穩穩寫完就好。',
  },
  {
    code: 'yellow_rubberband',
    color: '#E09F1F',
    label: '⚡ 橡皮筋拉好緊：緊張、腦袋一直轉停不下來',
    teacherNote: '焦慮緊繃；過度在意表現',
    feedback: '緊張代表你在乎，但也讓腦袋太用力了。先看第一題就好，不確定的題目先跳過，等一下再回頭。',
  },
  {
    code: 'blue_caterpillar',
    color: '#3B82C4',
    label: '🌧️ 濕濕的毛毛蟲：好累、沒力氣、有點低落',
    teacherNote: '低能量負向；疲憊、無力',
    feedback: '今天辛苦了。累的時候不需要硬逼自己滿分，照你現在能做到的步調，一題一題慢慢走過就好。',
  },
  {
    code: 'green_flow',
    color: '#3D9970',
    label: '🌿 順順的微風：平靜、準備好了、可以專心',
    teacherNote: '穩定專注；理想應考狀態',
    feedback: '很好的節奏。把剛才腦袋裡的重點留住，穩穩讀題、不要急著搶快。',
  },
  {
    code: 'gray_fog',
    color: '#7A828C',
    label: '🌫️ 腦袋起霧了：空空的、什麼都沒記起來、不知道要幹嘛',
    teacherNote: '麻木解離或完全沒準備',
    feedback: '起霧的時候先別責怪自己。進考題後先找關鍵字，能認出哪幾個概念就算賺到哪幾個。',
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

export interface PreExamAttemptLite {
  unitId: string;
  at: number;
}

export function classifyPreExamPractice(input: {
  startsAt: number;
  unitIds: string[];
  attempts: PreExamAttemptLite[];
  progress?: Partial<Progress> | null;
}): {
  status: PreExamStatus;
  attemptCount: number;
  passedUnitCount: number;
  activityCount: number;
} {
  const unitSet = new Set(input.unitIds);
  const relevantAttempts = input.attempts.filter(
    (a) => unitSet.has(a.unitId) && Number.isFinite(a.at) && a.at < input.startsAt,
  );
  const units = input.progress?.units || {};
  let passedUnitCount = 0;
  for (const unitId of unitSet) {
    const passedAt = units[unitId]?.passedAt;
    if (typeof passedAt === 'number' && passedAt < input.startsAt) passedUnitCount++;
  }
  const activityHistory = input.progress?.activityHistory || {};
  let activityCount = 0;
  for (const h of Object.values(activityHistory)) {
    const first = h?.firstCompletedAt;
    if (typeof first === 'number' && first < input.startsAt) activityCount++;
  }

  let status: PreExamStatus = 'none';
  if (passedUnitCount > 0) status = 'passed';
  else if (relevantAttempts.length > 0) status = 'practiced';
  else if (activityCount > 0) status = 'infographic_only';

  return {
    status,
    attemptCount: relevantAttempts.length,
    passedUnitCount,
    activityCount,
  };
}

export interface MoodRecordLite {
  uid: string;
  mood: MoodCode;
}

export interface MoodResultPair {
  uid: string;
  mood?: MoodCode;
  score: number;
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
): MoodReportSummary {
  const counts = Object.fromEntries(MOOD_CODES.map((c) => [c, 0])) as Record<MoodCode, number>;
  const highCounts = Object.fromEntries(MOOD_CODES.map((c) => [c, 0])) as Record<MoodCode, number>;
  const lowCounts = Object.fromEntries(MOOD_CODES.map((c) => [c, 0])) as Record<MoodCode, number>;

  let totalResponded = 0;
  for (const p of pairs) {
    if (!p.mood || !(p.mood in counts)) continue;
    totalResponded++;
    counts[p.mood]++;
    if (p.score >= threshold) highCounts[p.mood]++;
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

    for (const p of pairs) {
      const prev = prevMoods[p.uid];
      if (!prev || !p.mood) continue;
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
  mood: MoodCode | null;
  preExamStatus: PreExamStatus;
  recentHistory?: Array<{
    score: number | null;
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
  mood: MoodCode | null;
  preExamStatus: PreExamStatus;
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
    const lowScore = st.score !== null && st.score < threshold;

    if (st.mood === 'red_volcano') tags.push('情緒：小火山');
    if (lowScore && (st.mood === 'blue_caterpillar' || st.mood === 'gray_fog')) {
      tags.push('低分＋低能量／霧');
    }
    if (st.preExamStatus === 'passed' && lowScore) {
      tags.push('已達標仍低分');
    }

    const combined = [
      { score: st.score, mood: st.mood, preExamStatus: st.preExamStatus },
      ...(st.recentHistory || []),
    ];

    let consecutiveGrey = 0;
    for (const h of combined) {
      if (h.preExamStatus === 'none') consecutiveGrey++;
      else break;
    }
    if (st.preExamStatus === 'none' && consecutiveGrey >= 2) {
      tags.push('連續未練習');
    }
    if (consecutiveGrey >= 3) {
      streakNotes.push(`最近 ${consecutiveGrey} 場皆灰`);
    }

    let consecutiveLow = 0;
    for (const h of combined) {
      if (h.score !== null && h.score < threshold) consecutiveLow++;
      else break;
    }
    if (consecutiveLow >= 2) streakNotes.push(`連續 ${consecutiveLow} 場低於 ${threshold}`);

    let consecutiveRedOrFog = 0;
    for (const h of combined) {
      if (h.mood === 'red_volcano' || h.mood === 'gray_fog') consecutiveRedOrFog++;
      else break;
    }
    if (consecutiveRedOrFog >= 2) streakNotes.push(`連續 ${consecutiveRedOrFog} 場紅／霧`);

    if (tags.length > 0 || streakNotes.length > 0) {
      entries.push({
        uid: st.uid,
        studentId: st.studentId,
        name: st.name,
        maskedName: maskStudentName(st.name),
        classId: st.classId,
        score: st.score,
        mood: st.mood,
        preExamStatus: st.preExamStatus,
        tags,
        streakNotes,
      });
    }
  }
  return entries.sort((a, b) => b.tags.length - a.tags.length || (a.score ?? 999) - (b.score ?? 999));
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
  preExamStatus: PreExamStatus;
  score: number | null;
  correct: number | null;
  answers: Record<string, string>;
}

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
    '考前練習',
    '總分',
    '答對題數',
    ...view.items.map((_, i) => `Q${i + 1}`),
  ];
  const data = rows.map((r) => [
    ...(deidentified ? [r.researchId || ''] : [r.studentId || '', r.name || '']),
    r.classId,
    r.sittingLabel,
    r.startsAt ? new Date(r.startsAt).toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }) : '',
    r.mood || '',
    r.preExamStatus,
    r.score,
    r.correct,
    ...view.items.map((it) => r.answers[it.questionId] || ''),
  ]);
  return formatCsvLines(headers, data);
}
