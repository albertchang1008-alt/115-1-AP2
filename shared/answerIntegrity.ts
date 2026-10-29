import type { Attempt, Unit } from './model';

export const ANSWER_INTEGRITY = Object.freeze({
  maxLeaves: 3,
  maxLeaveSeconds: 60,
  warnLeaveSeconds: 45,
  fastRatio: 2 / 3,
  uniformCv: 0.25,
  minCvQuestions: 8,
  firstScore: 100,
  maxReportedLeaves: 10_000,
  maxReportedSeconds: 604_800,
  maxAttemptReads: 10_000,
  maxRosterReads: 2_000,
});
export type LeaveMetrics = { leaveCount: number; leaveSeconds: number };
export function validateLeaveMetrics(input: {
  leaveCount?: unknown;
  leaveSeconds?: unknown;
  duration: number;
}): LeaveMetrics | null {
  if (input.leaveCount === undefined && input.leaveSeconds === undefined) return null;
  if (
    !Number.isFinite(input.duration) ||
    input.duration < 0 ||
    !Number.isInteger(input.leaveCount) ||
    (input.leaveCount as number) < 0 ||
    (input.leaveCount as number) > ANSWER_INTEGRITY.maxReportedLeaves ||
    typeof input.leaveSeconds !== 'number' ||
    !Number.isFinite(input.leaveSeconds) ||
    input.leaveSeconds < 0 ||
    input.leaveSeconds > ANSWER_INTEGRITY.maxReportedSeconds ||
    input.leaveSeconds > input.duration + 2 ||
    (input.leaveCount === 0 && input.leaveSeconds !== 0)
  )
    throw Error('離開畫面紀錄格式或範圍無效');
  return { leaveCount: input.leaveCount as number, leaveSeconds: input.leaveSeconds };
}
export function integrityApplies(a: Pick<Attempt, 'mode' | 'full'>, unit: Pick<Unit, 'review'>) {
  return a.mode === 'quiz' && a.full && !unit.review;
}
export function exceedsLeaveLimit(m: LeaveMetrics) {
  return (
    m.leaveCount > ANSWER_INTEGRITY.maxLeaves || m.leaveSeconds > ANSWER_INTEGRITY.maxLeaveSeconds
  );
}
/** Always replace client-supplied integrity; missing metrics are legacy-compatible. */
export function classifyAttemptIntegrity(a: Attempt, unit: Pick<Unit, 'review'>): Attempt {
  const metrics = validateLeaveMetrics(a);
  const clean = { ...a };
  delete clean.integrity;
  if (metrics && integrityApplies(a, unit) && exceedsLeaveLimit(metrics))
    clean.integrity = 'left-screen';
  return clean;
}
export function leaveNotice(m: LeaveMetrics, applies: boolean) {
  const first = `你已離開作答畫面 ${m.leaveCount} 次（共 ${m.leaveSeconds} 秒）`;
  if (!applies) return `${first}，已記錄。本模式僅記錄離開情況，不因此作廢。`;
  if (exceedsLeaveLimit(m))
    return `${first}，已超過上限。本次作答不列入最高有效分數與達標，仍可查看分數與解析。`;
  if (m.leaveCount === ANSWER_INTEGRITY.maxLeaves)
    return `${first}。再離開 1 次，本次作答將不列入成績。${m.leaveSeconds >= ANSWER_INTEGRITY.warnLeaveSeconds ? `累計時間也已接近上限，超過 ${ANSWER_INTEGRITY.maxLeaveSeconds} 秒同樣不列入成績。` : ''}`;
  if (m.leaveSeconds >= ANSWER_INTEGRITY.warnLeaveSeconds)
    return `${first}，已記錄。累計時間已接近上限，超過 ${ANSWER_INTEGRITY.maxLeaveSeconds} 秒，本次作答將不列入成績。`;
  return `${first}，已記錄。離開超過 ${ANSWER_INTEGRITY.maxLeaves} 次或累計超過 ${ANSWER_INTEGRITY.maxLeaveSeconds} 秒，本次作答不列入成績。`;
}
export type IntegrityStudent = { uid: string; name: string; studentId: string; classId: string };
export type IntegrityRow = IntegrityStudent & {
  attempts: number;
  average: number | null;
  firstAverage: number | null;
  firstScore: number | null;
  firstCv: number | null;
  best: number | null;
  leaveCount: number;
  leaveSeconds: number;
  invalidCount: number;
  reasons: ('fast' | 'uniform')[];
};
export type IntegrityUnitStats = {
  unitId: string;
  title: string;
  medianSeconds: number | null;
  rows: IntegrityRow[];
};
export type IntegrityStatsResponse = {
  scope: 'student' | 'class';
  units: IntegrityUnitStats[];
  reads: { attempts: number; roster: number; progress: number };
  generatedAt: number;
};
export function isTestClass(value: string) {
  return value.trim().toLowerCase() === 'test';
}
function attemptTime(a: Attempt) {
  const count = a.answers?.length || 0;
  if (!count) return null;
  if (typeof a.duration === 'number' && Number.isFinite(a.duration) && a.duration >= 0)
    return { seconds: a.duration, count };
  const seconds = a.answers.map((r) => r.seconds);
  return seconds.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)
    ? { seconds: seconds.reduce((n, v) => n + v, 0), count }
    : null;
}
function timeCv(a: Attempt | undefined) {
  const values = a?.answers?.map((r) => r.seconds) || [];
  if (
    values.length < ANSWER_INTEGRITY.minCvQuestions ||
    !values.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)
  )
    return null;
  const mean = values.reduce((s, n) => s + n, 0) / values.length;
  return mean > 0
    ? Math.sqrt(values.reduce((s, n) => s + (n - mean) ** 2, 0) / values.length) / mean
    : null;
}
export function computeIntegrityUnitStats(
  unit: Pick<Unit, 'id' | 'title' | 'review'>,
  students: IntegrityStudent[],
  attempts: Attempt[],
  compare = true,
): IntegrityUnitStats {
  const rows: IntegrityRow[] = students
    .filter((s) => !isTestClass(s.classId))
    .map((s) => {
      const records = attempts
        .filter(
          (a) =>
            a.uid === s.uid &&
            a.classId === s.classId &&
            a.unitId === unit.id &&
            integrityApplies(a, unit),
        )
        .sort((a, b) => a.clientAt - b.clientAt || a.id.localeCompare(b.id));
      const usable = records
        .map(attemptTime)
        .filter((v): v is { seconds: number; count: number } => v !== null);
      const first = records[0],
        firstTime = first && attemptTime(first),
        valid = records.filter((a) => a.integrity !== 'left-screen');
      return {
        ...s,
        attempts: records.length,
        average: usable.length
          ? usable.reduce((sum, v) => sum + v.seconds, 0) /
            usable.reduce((sum, v) => sum + v.count, 0)
          : null,
        firstAverage: firstTime ? firstTime.seconds / firstTime.count : null,
        firstScore: first?.score ?? null,
        firstCv: timeCv(first),
        best: valid.length ? Math.max(...valid.map((a) => a.score)) : null,
        leaveCount: records.reduce(
          (sum, a) =>
            sum + (Number.isInteger(a.leaveCount) && a.leaveCount! >= 0 ? a.leaveCount! : 0),
          0,
        ),
        leaveSeconds: records.reduce(
          (sum, a) =>
            sum +
            (typeof a.leaveSeconds === 'number' &&
            Number.isFinite(a.leaveSeconds) &&
            a.leaveSeconds >= 0
              ? a.leaveSeconds
              : 0),
          0,
        ),
        invalidCount: records.filter((a) => a.integrity === 'left-screen').length,
        reasons: [],
      };
    });
  const values = rows.flatMap((r) => (r.average === null ? [] : [r.average])).sort((a, b) => a - b),
    mid = Math.floor(values.length / 2);
  const medianSeconds =
    compare && values.length
      ? values.length % 2
        ? values[mid]
        : (values[mid - 1] + values[mid]) / 2
      : null;
  for (const r of rows)
    if (compare && r.firstScore === ANSWER_INTEGRITY.firstScore) {
      if (
        medianSeconds !== null &&
        r.firstAverage !== null &&
        r.firstAverage < medianSeconds * ANSWER_INTEGRITY.fastRatio
      )
        r.reasons.push('fast');
      if (r.firstCv !== null && r.firstCv < ANSWER_INTEGRITY.uniformCv) r.reasons.push('uniform');
    }
  return { unitId: unit.id, title: unit.title, medianSeconds, rows };
}
export function integrityFastRatioLabel() {
  return ANSWER_INTEGRITY.fastRatio === 2 / 3
    ? '2/3'
    : `${Number((ANSWER_INTEGRITY.fastRatio * 100).toFixed(1))}%`;
}
export function integrityReasonText(
  row: Pick<IntegrityRow, 'reasons' | 'firstAverage' | 'firstCv'>,
) {
  return [
    '僅供查看，不代表作弊。',
    ...row.reasons.map((r) =>
      r === 'fast'
        ? `偏快：第一次每題平均秒數低於全班中位數的 ${integrityFastRatioLabel()}。`
        : `每題時間平均：第一次每題時間的變異係數小於 ${ANSWER_INTEGRITY.uniformCv}（至少 ${ANSWER_INTEGRITY.minCvQuestions} 題且秒數完整）。`,
    ),
  ].join('');
}
export type IntegritySortKey = 'average' | 'firstAverage' | 'leaveCount' | 'best' | 'studentId';
export function sortedIntegrityRows(
  rows: IntegrityRow[],
  key: IntegritySortKey,
  descending: boolean,
  markedOnly: boolean,
) {
  return rows
    .filter((r) => !markedOnly || r.reasons.length > 0 || r.invalidCount > 0)
    .sort((a, b) => {
      const av = a[key],
        bv = b[key];
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      const order = typeof av === 'string' ? av.localeCompare(bv as string) : av - (bv as number);
      return (
        (descending ? -order : order) ||
        a.studentId.localeCompare(b.studentId) ||
        a.uid.localeCompare(b.uid)
      );
    });
}
