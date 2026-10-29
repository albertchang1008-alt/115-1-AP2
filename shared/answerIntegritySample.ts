import type { Attempt } from './model';
export type IntegritySampleAttempt = Attempt & {
  leaveCount?: number;
  leaveSeconds?: number;
  integrity?: 'left-screen';
};
export type IntegritySampleUnit = {
  id: string;
  title: string;
  threshold: number;
  review?: boolean;
};
export type IntegritySampleData = {
  source: 'emulator';
  students: { uid: string; name: string; classId: string; studentId: string }[];
  units: IntegritySampleUnit[];
  attempts: IntegritySampleAttempt[];
};
export const SAMPLE_LEAVE_LIMITS = { count: 3, seconds: 60 } as const;
/** Sample-only projection. No production submission/progress code imports this module. */
export function sampleInvalid(a: IntegritySampleAttempt, unit: IntegritySampleUnit) {
  return (
    !unit.review &&
    a.mode === 'quiz' &&
    a.full &&
    a.leaveCount !== undefined &&
    (a.leaveCount > SAMPLE_LEAVE_LIMITS.count ||
      (a.leaveSeconds || 0) > SAMPLE_LEAVE_LIMITS.seconds)
  );
}
export function sampleUnitAttempts(data: IntegritySampleData, uid: string, unitId: string) {
  return data.attempts
    .filter(
      (a) =>
        a.uid === uid &&
        a.unitId === unitId &&
        a.mode === 'quiz' &&
        a.full &&
        a.classId !== 'test' &&
        !data.units.find((u) => u.id === a.unitId)?.review,
    )
    .sort((a, b) => a.clientAt - b.clientAt || a.id.localeCompare(b.id));
}
export function sampleAverage(attempts: IntegritySampleAttempt[]) {
  let seconds = 0,
    count = 0;
  for (const a of attempts) {
    if (!a.answers.length) continue;
    seconds += a.answers.every((x) => Number.isFinite(x.seconds) && x.seconds >= 0)
      ? a.answers.reduce((n, x) => n + x.seconds, 0)
      : a.duration;
    count += a.answers.length;
  }
  return count ? seconds / count : null;
}
export function sampleStudentUnit(
  data: IntegritySampleData,
  uid: string,
  unit: IntegritySampleUnit,
) {
  const attempts = sampleUnitAttempts(data, uid, unit.id),
    valid = attempts.filter((a) => !sampleInvalid(a, unit));
  return {
    attempts: attempts.length,
    average: sampleAverage(attempts),
    firstAverage: sampleAverage(attempts.slice(0, 1)),
    firstScore: attempts[0]?.score ?? null,
    best: valid.length ? Math.max(...valid.map((a) => a.score)) : null,
    leaves: attempts.reduce((n, a) => n + (a.leaveCount || 0), 0),
    leaveSeconds: attempts.reduce((n, a) => n + (a.leaveSeconds || 0), 0),
    invalid: attempts.filter((a) => sampleInvalid(a, unit)).length,
    hasLegacy: attempts.some((a) => a.leaveCount === undefined),
  };
}
export function sampleCohort(data: IntegritySampleData, unit: IntegritySampleUnit) {
  const rows = data.students
    .filter((s) => s.classId !== 'test')
    .map((student) => ({ student, ...sampleStudentUnit(data, student.uid, unit) }));
  const values = rows.flatMap((r) => (r.average === null ? [] : [r.average])).sort((a, b) => a - b),
    middle = Math.floor(values.length / 2);
  const median = !values.length
    ? null
    : values.length % 2
      ? values[middle]
      : (values[middle - 1] + values[middle]) / 2;
  return {
    median,
    rows: rows.map((r) => ({
      ...r,
      flag:
        median !== null &&
        r.firstAverage !== null &&
        r.firstScore !== null &&
        r.firstScore >= unit.threshold &&
        r.firstAverage < median / 2,
    })),
  };
}
export function sampleSeconds(value: number | null) {
  return value === null ? '尚無資料' : `${Number(value.toFixed(1))} 秒`;
}
