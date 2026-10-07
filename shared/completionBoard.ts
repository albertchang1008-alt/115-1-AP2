import {
  Course,
  Progress,
  chapterCompletion,
  chapterName,
  chaptersOf,
  completion,
  emptyProgress,
  forClass,
  orderedChapters,
  parseCourseTime,
} from './model';

export type ChapterCellStatus = 'notOpen' | 'done' | 'inProgress' | 'notStarted';
/** Display-only: callers pass the course after forClass; v3 completion is unchanged. */
export function chapterCellState(course: Course, name: string, p: Progress, now = Date.now()) {
  const chapter = chaptersOf(course)[name],
    result = chapterCompletion(course, name, p);
  const units = course.units.filter((u) => chapterName(u) === name);
  const opens = chapter?.opensAt ? parseCourseTime(chapter.opensAt) : NaN;
  const due = chapter?.dueAt ? parseCourseTime(chapter.dueAt) : NaN;
  const started =
    units.some((u) => (p.units?.[u.id]?.attempts || 0) > 0) || result.completedActivities > 0;
  const state: ChapterCellStatus =
    !result.done && opens > now
      ? 'notOpen'
      : result.done
        ? 'done'
        : started
          ? 'inProgress'
          : 'notStarted';
  return {
    state,
    overdue: due < now && !result.done,
    lateDone: result.done && units.some((u) => (p.units?.[u.id]?.passedAt || 0) > due),
    eligible: result.eligible,
  };
}
export const chapterStateLabels: Record<ChapterCellStatus, string> = {
  notOpen: '未開放',
  done: '完成',
  inProgress: '進行中',
  notStarted: '未開始',
};
export function chapterCellLabel(cell: ReturnType<typeof chapterCellState>) {
  return cell.overdue ? '逾期未完成' : cell.lateDone ? '逾期完成' : chapterStateLabels[cell.state];
}
export interface CompletionStudent {
  name: string;
  studentId: string;
  email: string;
  classId: string;
  enabled: boolean;
  uid?: string | null;
  progress: Progress;
}
export interface ChapterRate {
  done: number;
  total: number;
  percent: number | null;
  required: boolean;
  dueAt: string;
}
export function classCompletionSummary(
  course: Course,
  classId: string,
  rows: CompletionStudent[],
  now = Date.now(),
) {
  const visible = forClass(course, classId),
    chapters = orderedChapters(visible);
  const sums = rows.map((r) => completion(visible, r.progress || emptyProgress()));
  const rates: Record<string, ChapterRate> = {};
  for (const { name, chapter } of chapters) {
    const done = rows.filter(
      (r) => chapterCompletion(visible, name, r.progress || emptyProgress()).done,
    ).length;
    rates[name] = {
      done,
      total: rows.length,
      percent: rows.length ? (done / rows.length) * 100 : null,
      required: chapter.required,
      dueAt: chapter.dueAt,
    };
  }
  return {
    classId,
    count: rows.length,
    allDone: sums.filter((x) => x.total > 0 && x.done === x.total).length,
    overdue: rows.filter((r) =>
      chapters.some(
        ({ name }) => chapterCellState(visible, name, r.progress || emptyProgress(), now).overdue,
      ),
    ).length,
    doneSum: sums.reduce((s, n) => s + n.done, 0),
    totalSum: sums.reduce((s, n) => s + n.total, 0),
    averageDone: rows.length ? sums.reduce((s, n) => s + n.done, 0) / rows.length : null,
    requiredTotal: completion(visible, emptyProgress()).total,
    rates,
  };
}
/** Sum people and chapter denominators, never average class percentages. */
export function allClassCompletionSummary(summaries: ReturnType<typeof classCompletionSummary>[]) {
  const count = summaries.reduce((s, x) => s + x.count, 0);
  const rates: Record<string, ChapterRate> = {};
  for (const summary of summaries)
    for (const [name, rate] of Object.entries(summary.rates)) {
      const previous = rates[name];
      rates[name] = {
        done: (previous?.done || 0) + rate.done,
        total: (previous?.total || 0) + rate.total,
        percent: null,
        required: (previous?.required ?? false) || rate.required,
        dueAt: previous?.dueAt === rate.dueAt || !previous ? rate.dueAt : '各班不同',
      };
    }
  for (const rate of Object.values(rates))
    rate.percent = rate.total ? (rate.done / rate.total) * 100 : null;
  const doneSum = summaries.reduce((s, x) => s + x.doneSum, 0),
    totalSum = summaries.reduce((s, x) => s + x.totalSum, 0);
  return {
    classId: '全部班級',
    count,
    allDone: summaries.reduce((s, x) => s + x.allDone, 0),
    overdue: summaries.reduce((s, x) => s + x.overdue, 0),
    doneSum,
    totalSum,
    averageDone: count ? doneSum / count : null,
    requiredTotal: count ? totalSum / count : null,
    rates,
  };
}
export function matrixChapters(course: Course) {
  return orderedChapters(course).sort(
    (a, b) => Number(b.chapter.required) - Number(a.chapter.required),
  );
}
export function matrixCsv(
  course: Course,
  classId: string,
  rows: CompletionStudent[],
  now = Date.now(),
): Record<string, string | number>[] {
  const visible = forClass(course, classId);
  return rows.map((r) => ({
    姓名: r.name,
    學號: r.studentId,
    班級: classId,
    已完成: completion(visible, r.progress).done,
    應完成: completion(visible, r.progress).total,
    ...Object.fromEntries(
      matrixChapters(visible).map(({ name, chapter }) => [
        chapter.title || name,
        chapterCellLabel(chapterCellState(visible, name, r.progress, now)),
      ]),
    ),
  }));
}
