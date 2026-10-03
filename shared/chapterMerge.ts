import { Activity, Course, Progress, chapterName, chaptersOf, chapterActivityKey } from './model';

export interface ChapterMergePreview {
  sourceName: string;
  targetName: string;
  activities: { id: string; title: string; alreadyInTarget: boolean }[];
  affectedStudents: number;
  confirmationToken: string;
  blockedReason?: string;
}

export function chapterMergePublishedBlocker(published: Course | undefined, sourceName: string, targetName: string): string {
  if (!published || !chaptersOf(published)[sourceName]) return '';
  if (published.units.some(u => chapterName(u) === sourceName)) return `學生端（已發布版本）的「${sourceName}」仍有次單元，請先發布後再合併`;
  if (!chaptersOf(published)[targetName]) return `學生端（已發布版本）尚無「${targetName}」，請先發布後再合併`;
  return '';
}

/** bootstrap adds presentation metadata; Firestore map key order is not meaningful. */
export function chapterMergeDraftFingerprint(course: Course): string {
  const { archived: _archived, publishedAt: _publishedAt, ...draft } = course;
  const stable = (value: any): any => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, stable(value[key])])) : value;
  return JSON.stringify(stable(draft));
}

/** Target settings and activity definitions win; missing dates and class fields inherit source. */
export function mergeChapterCourse(course: Course, sourceName: string, targetName: string): Course {
  const chapters = chaptersOf(course), source = chapters[sourceName], target = chapters[targetName];
  if (sourceName === targetName || !source || !target) throw Error('請選擇不同且存在的來源與目標單元');
  if (course.units.some(u => chapterName(u) === sourceName)) throw Error('來源單元還有次單元，不能合併');
  const activities = [...target.activities], ids = new Set(activities.map(a => a.id));
  for (const activity of source.activities) if (!ids.has(activity.id)) { activities.push(activity); ids.add(activity.id); }
  if (activities.length > 30) throw Error('合併後活動超過每單元 30 個上限');
  const nextChapters = { ...chapters, [targetName]: { ...target, activities, opensAt: target.opensAt || source.opensAt, dueAt: target.dueAt || source.dueAt } };
  delete nextChapters[sourceName];
  const chapterOverrides = Object.fromEntries(Object.entries(course.chapterOverrides || {}).map(([classId, settings]) => {
    const from = settings[sourceName], to = settings[targetName];
    const next = { ...settings };
    if (from) {
      next[targetName] = { ...from, ...to };
      for (const field of ['opensAt', 'dueAt'] as const) if (!to?.[field] && from[field]) next[targetName][field] = from[field];
    }
    delete next[sourceName];
    return [classId, next];
  }));
  // Inferred legacy Chapters may contain an undefined research setting; Firestore rejects it.
  return JSON.parse(JSON.stringify({ ...course, chapters: nextChapters, chapterOrder: (course.chapterOrder || Object.keys(chapters)).filter(name => name !== sourceName), chapterOverrides }));
}

/** Keep every source key. Completion and furthest position can only increase. */
export function mergedChapterProgress(progress: Progress, source: string, target: string, activityIds: readonly string[]): Progress {
  const activities = { ...(progress.activities || {}) };
  for (const activityId of activityIds) {
    const from = activities[chapterActivityKey(source, activityId)];
    if (!from) continue;
    const key = chapterActivityKey(target, activityId), to = activities[key];
    activities[key] = { ...from, ...to, completed: !!(from.completed || to?.completed), position: Math.max(from.position || 0, to?.position || 0), updatedAt: Math.max(from.updatedAt || 0, to?.updatedAt || 0) };
  }
  return { ...progress, activities };
}

export function mergeActivityList(draft: Course, published: Course | undefined, source: string, target: string): ChapterMergePreview['activities'] {
  const seen = new Set<string>(), targetIds = new Set([draft, published].flatMap(c => c ? (chaptersOf(c)[target]?.activities || []).map(a => a.id) : []));
  return [draft, published].flatMap(c => c ? chaptersOf(c)[source]?.activities || [] : []).filter((a: Activity) => !seen.has(a.id) && !!seen.add(a.id)).map(a => ({ id: a.id, title: a.title, alreadyInTarget: targetIds.has(a.id) }));
}
