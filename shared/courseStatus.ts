import { Course, Unit, chapterName, chaptersOf, orderedChapters, forClass, unitVisibility } from './model';

export const OPEN_STATUS = { hidden: '尚未開放', current: '目前學習', archived: '已考完' } as const;
export type StudentUpdateStatus = '已更新到學生端' | '有修改未更新' | '尚未更新到學生端';
function stable(value: unknown): string {
  const normalize = (v: any): any => Array.isArray(v) ? v.map(normalize) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => [k, normalize(v[k])])) : v;
  return JSON.stringify(normalize(value));
}
export function selectedClasses(course: Course, unitId: string): string[] {
  return course.classIds.filter(id => !course.classUnits?.[id] || course.classUnits[id].includes(unitId));
}
export function defaultPreviewClass(course: Course, remembered?: string | null): string {
  if (remembered && course.classIds.includes(remembered)) return remembered;
  let chosen = '', most = -1;
  for (const cl of course.classIds) {
    const count = course.units.filter(u => !course.classUnits?.[cl] || course.classUnits[cl].includes(u.id)).length;
    if (count > most) { chosen = cl; most = count; }
  }
  return chosen;
}
/** A derived view only: class exclusions still apply and the input is never changed. */
export function studentPreviewCourse(course: Course, classId: string, showHidden = false): Course {
  return forClass(showHidden ? { ...course, units: course.units.map(u => unitVisibility(u) === 'hidden' ? { ...u, visibility: 'current' as const } : u) } : course, classId);
}
function unitContent(course: Course, unit: Unit) {
  const { visibility, archiveLabel, archivedAt, visibilityUpdatedAt, ...content } = unit;
  const name = chapterName(unit);
  return {
    content, chapter: chaptersOf(course)[name],
    course: { title: course.title, description: course.description, term: course.term },
    chapterPosition: orderedChapters(course).findIndex(r => r.name === name),
    classes: course.classIds.map(id => ({ id, name: course.classNames?.[id] || id,
      selected: selectedClasses(course, unit.id).includes(id),
      override: course.chapterOverrides?.[id]?.[name] || {}, legacyOverride: course.classOverrides?.[id]?.[unit.id] || {} })),
  };
}
export function studentUpdateStatus(draft: Course, published: Course | undefined, unit: Unit): StudentUpdateStatus {
  const current = published?.units.find(u => u.id === unit.id);
  if (!published || !current) return '尚未更新到學生端';
  if (!draft.units.some(u => u.id === unit.id)) return '有修改未更新';
  return stable(unitContent(draft, unit)) === stable(unitContent(published, current)) ? '已更新到學生端' : '有修改未更新';
}
export function visibleClasses(published: Course | undefined, unitId: string): string[] {
  return published?.classIds.filter(cl => forClass(published, cl).units.some(u => u.id === unitId)) || [];
}
export function studentHiddenReasons(published: Course | undefined, unitId: string): string[] {
  const unit = published?.units.find(u => u.id === unitId);
  if (!published || !unit) return ['尚未更新到學生端'];
  const reasons: string[] = [];
  if (unitVisibility(unit) === 'hidden') reasons.push('尚未開放');
  if (!selectedClasses(published, unitId).length) reasons.push('沒有勾選班級');
  return reasons;
}
export function courseStatusRows(draft: Course, published?: Course) {
  const ids = new Set(draft.units.map(u => u.id));
  const units = [...orderedChapters(draft).flatMap(r => r.units), ...(published?.units.filter(u => !ids.has(u.id)) || [])];
  return units.map(unit => ({
    unit, chapter: chapterName(unit), removed: !ids.has(unit.id),
    visibility: OPEN_STATUS[unitVisibility(unit)], classes: selectedClasses(draft, unit.id),
    status: studentUpdateStatus(draft, published, unit), visibleClasses: visibleClasses(published, unit.id),
    reasons: studentHiddenReasons(published, unit.id),
  }));
}
export interface ChangeCounts { added: number; modified: number; removed: number; }
function counts(before: Map<string, unknown>, after: Map<string, unknown>): ChangeCounts {
  return {
    added: [...after.keys()].filter(k => !before.has(k)).length,
    modified: [...after.keys()].filter(k => before.has(k) && stable(before.get(k)) !== stable(after.get(k))).length,
    removed: [...before.keys()].filter(k => !after.has(k)).length,
  };
}
export function studentUpdateSummary(draft: Course, published?: Course) {
  const chapters = (c?: Course) => new Map(c ? Object.entries(chaptersOf(c)).map(([id, value]) => [id, { value, order: (c.chapterOrder || orderedChapters(c).map(r => r.name)).indexOf(id) }]) : []);
  const units = (c?: Course) => new Map(c?.units.map(u => [u.id, unitContent(c, u)]) || []);
  const activities = (c?: Course) => new Map(c ? [...Object.entries(chaptersOf(c)).flatMap(([name, chapter]) => chapter.activities.map((a, i) => [JSON.stringify(['chapter', name, a.id]), { activity: a, order: i }] as [string, unknown])), ...c.units.flatMap(u => u.activities.filter(a => !chaptersOf(c)[chapterName(u)]?.activities.some(shared => shared.id === a.id && stable(shared) === stable(a))).map((a, i) => [JSON.stringify(['unit', u.id, a.id]), { activity: a, order: i }] as [string, unknown]))] : []);
  const named = (u: Unit) => `${chapterName(u)}／${u.title}`;
  return {
    chapters: counts(chapters(published), chapters(draft)), units: counts(units(published), units(draft)), activities: counts(activities(published), activities(draft)),
    hidden: draft.units.filter(u => unitVisibility(u) === 'hidden').map(named),
    currentWithoutClasses: draft.units.filter(u => unitVisibility(u) === 'current' && !selectedClasses(draft, u.id).length).map(named),
    selectedHidden: draft.units.filter(u => unitVisibility(u) === 'hidden' && selectedClasses(draft, u.id).length > 0).map(named),
  };
}
/** Teacher copy only; callable identifiers and persisted data are unchanged. */
export function studentUpdateCopy(message: string) { return message.replaceAll('學生端（已發布版本）', '學生端').replaceAll('已發布版本', '學生端版本').replaceAll('發布', '更新到學生端'); }

/** Chapter pills summarize classifications, counting only when visibility is mixed. */
export function openingStatusTags(units: Unit[]) {
  const order = ['current', 'hidden', 'archived'] as const;
  const counts = order.map(visibility => ({ visibility, count: units.filter(u => unitVisibility(u) === visibility).length })).filter(r => r.count > 0);
  return counts.map(r => ({ ...r, label: OPEN_STATUS[r.visibility] + (counts.length > 1 ? ` ${r.count}` : '') }));
}
export function attentionStatusTags(draft: Course, published: Course | undefined, units: Unit[]) {
  const statuses = new Set(units.map(u => studentUpdateStatus(draft, published, u)));
  return (['尚未更新到學生端', '有修改未更新'] as const).filter(s => statuses.has(s));
}
