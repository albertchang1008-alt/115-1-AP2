import type { Attempt, Progress, Unit } from './model';
import {
  ANSWER_INTEGRITY,
  type IntegrityRow,
  type IntegrityStudent,
  type IntegrityUnitStats,
} from './answerIntegrity';
export interface TimingStats {
  schema: 1;
  classId: string;
  complete: boolean;
  attempts: number;
  seconds: number;
  questions: number;
  first: {
    id: string;
    at: number;
    score: number;
    seconds: number | null;
    questions: number;
    cv: number | null;
  } | null;
  leaveCount: number;
  leaveSeconds: number;
  invalidCount: number;
}
export function emptyTiming(complete = true, classId = ''): TimingStats {
  return {
    schema: 1,
    classId,
    complete,
    attempts: 0,
    seconds: 0,
    questions: 0,
    first: null,
    leaveCount: 0,
    leaveSeconds: 0,
    invalidCount: 0,
  };
}
const nonnegative = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function addTiming(
  old: TimingStats | undefined,
  a: Attempt,
  unit: Partial<Unit> = {},
  complete = true,
): TimingStats | undefined {
  if (a.mode !== 'quiz' || !a.full || unit.review) return old;
  const t =
      old?.schema === 1 && old.classId === (a.classId || '')
        ? { ...old }
        : emptyTiming(old?.attempts ? false : complete, a.classId || ''),
    count = a.answers?.length || 0,
    values = (a.answers || []).map((r) => r.seconds),
    valid = values.every(nonnegative);
  const seconds =
    count && nonnegative(a.duration)
      ? a.duration
      : count && valid
        ? values.reduce((s, n) => s + n, 0)
        : null;
  t.attempts++;
  if (seconds !== null) {
    t.seconds += seconds;
    t.questions += count;
  }
  t.leaveCount += Number.isInteger(a.leaveCount) && a.leaveCount! >= 0 ? a.leaveCount! : 0;
  t.leaveSeconds += nonnegative(a.leaveSeconds) ? a.leaveSeconds : 0;
  t.invalidCount += a.integrity === 'left-screen' ? 1 : 0;
  const at = Number.isFinite(a.clientAt) ? a.clientAt : 0;
  if (!t.first || at < t.first.at || (at === t.first.at && a.id.localeCompare(t.first.id) < 0)) {
    const mean = valid && count ? values.reduce((s, n) => s + n, 0) / count : 0;
    t.first = {
      id: a.id,
      at,
      score: a.score,
      seconds,
      questions: count,
      cv:
        valid && count >= ANSWER_INTEGRITY.minCvQuestions && mean > 0
          ? Math.sqrt(values.reduce((s, n) => s + (n - mean) ** 2, 0) / count) / mean
          : null,
    };
  }
  return t;
}
export function withoutTiming(p: Progress): Progress {
  return {
    ...p,
    units: Object.fromEntries(
      Object.entries(p.units || {}).map(([id, { timing: _t, ...v }]) => [id, v]),
    ),
  };
}
export function timingUnitStats(
  unit: Pick<Unit, 'id' | 'title'>,
  students: IntegrityStudent[],
  progress: Map<string, Progress>,
  compare = true,
): IntegrityUnitStats & { missingTiming: number } {
  let missingTiming = 0;
  const rows: IntegrityRow[] = students.map((s) => {
    const p = progress.get(s.uid)?.units?.[unit.id],
      t = p?.timing;
    const ready = t?.schema === 1 && t.complete && t.classId === s.classId;
    if ((p?.attempts || 0) > 0 && !ready) missingTiming++;
    return {
      ...s,
      attempts: ready ? t.attempts : 0,
      average: ready && t.questions ? t.seconds / t.questions : null,
      firstAverage:
        ready && t.first?.seconds !== null && t.first?.questions
          ? t.first.seconds / t.first.questions
          : null,
      firstScore: ready ? (t.first?.score ?? null) : null,
      firstCv: ready ? (t.first?.cv ?? null) : null,
      best: typeof p?.best === 'number' && p.best >= 0 ? p.best : null,
      leaveCount: ready ? t.leaveCount : 0,
      leaveSeconds: ready ? t.leaveSeconds : 0,
      invalidCount: ready ? t.invalidCount : 0,
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
  return { unitId: unit.id, title: unit.title, rows, medianSeconds, missingTiming };
}
