import {
  Course,
  Progress,
  chapterActivityKey,
  chapterCompletion,
  chapterName,
  chapterRequiredActivityProgress,
  chaptersOf,
  completion,
  emptyProgress,
  forClass,
  orderedChapters,
  unitVisibility,
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
    overdue: result.eligible && due < now && !result.done,
    lateDone:
      result.eligible && result.done && units.some((u) => (p.units?.[u.id]?.passedAt || 0) > due),
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
  const visible = completionBoardCourse(course, classId),
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
  const visible = completionBoardCourse(course, classId);
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

export const boardStatuses = ['done', 'inProgress', 'notStarted', 'notOpen'] as const;
/** 只記狀態篩選；遮名不記憶，每次開啟一律遮名（教師 2026-11-05 11:35）。 */
export type BoardPreferences = { statuses: ChapterCellStatus[]; showArchived?: boolean };
export const boardPreferenceKey = 'course-completion-board-display';
export const defaultBoardPreferences = (): BoardPreferences => ({ statuses: ['inProgress'] });
export function readBoardPreferences(storage: () => Pick<Storage, 'getItem'>): BoardPreferences {
  try {
    const value = JSON.parse(storage().getItem(boardPreferenceKey) ?? 'null');
    if (!Array.isArray(value?.statuses) || !value.statuses.length
        || !value.statuses.every((status: ChapterCellStatus) => boardStatuses.includes(status))) {
      return defaultBoardPreferences();
    }
    return {
      statuses: boardStatuses.filter((status) => value.statuses.includes(status)),
      ...(value.showArchived === true ? { showArchived: true } : {}),
    };
  } catch {
    return defaultBoardPreferences();
  }
}
export function saveBoardPreferences(storage: () => Pick<Storage, 'setItem'>, value: BoardPreferences) {
  try {
    storage().setItem(boardPreferenceKey, JSON.stringify({ statuses: value.statuses, ...(value.showArchived ? { showArchived: true } : {}) }));
    return true;
  } catch {
    return false;
  }
}
export const maskStudentId = (id: string) => {
  const chars = Array.from(id.trim());
  return chars.length <= 3 ? '＊＊＊' : '＊＊＊' + chars.slice(-3).join('');
};
/** 姓名中間字改 O：呂O、呂O岑、四字以上保留首尾；英文名同規則（空白也遮）。 */
export function projectionName(name: string) {
  const chars = Array.from(name.trim());
  if (!chars.length) return '';
  if (chars.length === 1) return 'O';
  if (chars.length === 2) return chars[0] + 'O';
  return chars[0] + 'O'.repeat(chars.length - 2) + chars.at(-1);
}

/** Preserve the legacy key lookup when forClass has inferred chapters. */
export function completionBoardCourse(course: Course, classId: string) {
  const visible = forClass(course, classId);
  return course.chapters ? visible : { ...visible, chapters: undefined };
}

export function statusMatrix(course: Course, students: CompletionStudent[], statuses: readonly ChapterCellStatus[], now: number, onlyOverdue = false) {
  const chapters = matrixChapters(course);
  const all = boardStatuses.every((status) => statuses.includes(status));
  const rows = students.map((student) => {
    const cells = new Map(chapters.map(({ name }) => [name, chapterCellState(course, name, student.progress, now)]));
    for (const [name, cell] of cells) if (!statuses.includes(cell.state)) cells.delete(name);
    const required = [...cells.values()].filter((cell) => cell.eligible);
    return {
      student, cells,
      done: required.filter((cell) => cell.state === 'done').length,
      total: required.length,
      overdue: [...cells.values()].filter((cell) => cell.overdue).length,
    };
  }).filter((row) => (all || row.cells.size > 0) && (!onlyOverdue || row.overdue > 0));
  return { rows, chapters: all ? chapters : chapters.filter(({ name }) => rows.some((row) => row.cells.has(name))) };
}

/**
 * 依狀態篩選的班級摘要。全部勾選時與 classCompletionSummary 完全相同。
 * 篩選時：各章比率改為「符合篩選的格子數／全班人數」；matched 為至少一格符合的人數；
 * overdue 只計符合篩選且逾期者；人數、全部完成、平均完成仍以完整名冊計算（加總權重不變）。
 */
export function filteredClassCompletionSummary(course: Course, classId: string, rows: CompletionStudent[], statuses: readonly ChapterCellStatus[], now: number) {
  const full = classCompletionSummary(course, classId, rows, now);
  if (boardStatuses.every((status) => statuses.includes(status))) return { ...full, matched: full.count };
  const matrix = statusMatrix(completionBoardCourse(course, classId), rows, statuses, now);
  const rates: Record<string, ChapterRate> = {};
  for (const { name, chapter } of matrix.chapters) {
    const done = matrix.rows.filter((row) => row.cells.has(name)).length;
    rates[name] = { done, total: rows.length, percent: rows.length ? 100 * done / rows.length : null, required: chapter.required, dueAt: chapter.dueAt };
  }
  return { ...full, rates, matched: matrix.rows.length, overdue: matrix.rows.filter((row) => row.overdue > 0).length };
}

/** 學生章節明細的逐項資料；完成判定與 chapterCompletion 共用。 */
export function chapterDetailItems(course: Course, name: string, p: Progress) {
  const categories = course.units
    .filter((u) => chapterName(u) === name)
    .map((unit) => {
      const entry = p.units?.[unit.id];
      return { unit, entry, done: !!unit.bankVersion && (entry?.best ?? -1) >= unit.threshold };
    });
  const legacyUnit = !course.chapters ? course.units.find((u) => chapterName(u) === name) : undefined;
  const activities = chapterRequiredActivityProgress(course, name, p).map((row) => {
    const key = chapterActivityKey(name, row.activity.id), legacyKey = legacyUnit ? `${legacyUnit.id}_${row.activity.id}` : '';
    const record = p.activities?.[key] ?? (legacyKey ? p.activities?.[legacyKey] : undefined);
    const history = p.activityHistory?.[key] ?? (legacyKey ? p.activityHistory?.[legacyKey] : undefined);
    return { ...row, done: row.completed, position: record?.position || 0, history, legacyUnitId: legacyUnit?.id };
  });
  return { categories, activities };
}
/** 明細項目是否顯示：已完成者需勾「完成」；未完成者勾任一非完成狀態即顯示。 */
export function detailItemVisible(done: boolean, statuses: readonly ChapterCellStatus[]) {
  return done ? statuses.includes('done') : statuses.some((status) => status !== 'done');
}

/** 互動教材是否屬於有紀錄的新版（17 份 Antigravity 教材，materialVersion 以 -ag1 結尾）。 */
export const recordedMaterial = (materialVersion: string | undefined) => /-ag1$/.test(materialVersion || '');
/** 題目分類細目：標出第一次達標的那一次（完整測驗、未離開畫面、分數達門檻）。 */
export function markFirstPass<T extends { score: number; mode: string; full: boolean; leftScreen?: boolean }>(rows: T[], threshold: number) {
  const i = rows.findIndex((r) => r.mode === 'quiz' && r.full && !r.leftScreen && r.score >= threshold);
  return rows.map((r, j) => ({ ...r, firstPass: j === i }));
}

/** 已考完的單元：底下的分類全部標為「已考完」（與學生首頁「已考完的單元」相同規則）。 */
export function archivedChapterNames(course: Course) {
  return orderedChapters(course)
    .filter(({ units }) => units.length > 0 && units.every((u) => unitVisibility(u) === 'archived'))
    .map(({ name }) => name);
}
/** 看板用：拿掉已考完的單元，完成度只算剩下的單元；不改任何資料。 */
export function withoutArchivedChapters(course: Course): Course {
  const names = new Set(archivedChapterNames(course));
  if (!names.size) return course;
  return {
    ...course,
    units: course.units.filter((u) => !names.has(chapterName(u))),
    ...(course.chapters ? { chapters: Object.fromEntries(Object.entries(course.chapters).filter(([name]) => !names.has(name))) } : {}),
    ...(course.chapterOrder ? { chapterOrder: course.chapterOrder.filter((name) => !names.has(name)) } : {}),
  };
}
