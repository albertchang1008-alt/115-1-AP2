import { Course, Activity, Chapter, chaptersOf } from './model';
export const REVISION_CONFLICT = '草稿已在其他地方被修改，請重新整理後再編輯';
export function courseRevision(raw: {revision?: unknown} | undefined): number {
  const value = raw?.revision ?? 0;
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) >= Number.MAX_SAFE_INTEGER) throw Error('草稿 revision 無效');
  return value as number;
}
export function assertExpectedRevision(current: number, expected: unknown, optional = false) {
  if (optional && expected === undefined) return;
  if (!Number.isSafeInteger(expected) || expected !== current) throw Error(REVISION_CONFLICT);
}
export type DraftOp =
  | {op:'addActivity'; chapter:string; activity:Activity}
  | {op:'updateActivity'; chapter:string; activityId:string; patch:Partial<Omit<Activity,'id'>>}
  | {op:'reorderActivities'; chapter:string; activityIds:string[]}
  | {op:'updateChapterSettings'; chapter:string; patch:Record<string,unknown>};
const activityFields = ['title','type','phase','url','start','end','description','tracking','required','reflection','materialVersion','nodeTotal','questionTotal'];
const chapterFields = ['title','description','required','threshold','opensAt','dueAt'];
function object(v: any) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function allowedKeys(value: any, keys: string[]) {
  if (!object(value) || Object.keys(value).some(k => !keys.includes(k) || ['__proto__','constructor','prototype'].includes(k))) throw Error('非白名單欄位');
}
export function applyDraftOps(course: Course, ops: unknown): Course {
  if (!Array.isArray(ops) || !ops.length || ops.length > 30) throw Error('每次需有1–30個op');
  const next = structuredClone(course);
  next.chapters = structuredClone(chaptersOf(next));
  for (const input of ops) {
    if (!object(input) || typeof input.chapter !== 'string' || !Object.hasOwn(next.chapters,input.chapter)) throw Error('找不到單元');
    const chapter: Chapter = next.chapters[input.chapter];
    if (input.op === 'addActivity') {
      allowedKeys(input,['op','chapter','activity']);
      allowedKeys(input.activity,['id',...activityFields]);
      if (chapter.activities.some(a => a.id === input.activity.id)) throw Error('活動ID重複');
      chapter.activities.push(structuredClone(input.activity));
    } else if (input.op === 'updateActivity') {
      allowedKeys(input,['op','chapter','activityId','patch']);
      allowedKeys(input.patch,activityFields);
      const at = chapter.activities.findIndex(a => a.id === input.activityId);
      if (at < 0) throw Error('找不到活動');
      chapter.activities[at] = {...chapter.activities[at],...structuredClone(input.patch)};
    } else if (input.op === 'reorderActivities') {
      allowedKeys(input,['op','chapter','activityIds']);
      const ids = input.activityIds;
      if (!Array.isArray(ids) || ids.length !== chapter.activities.length || new Set(ids).size !== ids.length || ids.some((id: unknown) => !chapter.activities.some(a => a.id === id))) throw Error('活動排序需包含全部活動且不可重複');
      chapter.activities = ids.map((id: string) => chapter.activities.find(a => a.id === id)!);
    } else if (input.op === 'updateChapterSettings') {
      allowedKeys(input,['op','chapter','patch']);
      allowedKeys(input.patch,chapterFields);
      Object.assign(chapter,structuredClone(input.patch));
    } else throw Error('非白名單op');
  }
  return next;
}
/** Store only schema-defined keys/counts in auditLog; never titles/URLs/text/student values. */
export function operationSummary(ops: DraftOp[]) {
  return ops.map(op => ({
    op:op.op,
    fields:op.op === 'updateActivity' || op.op === 'updateChapterSettings' ? Object.keys(op.patch).sort() : [],
    itemCount:op.op === 'reorderActivities' ? op.activityIds.length : 1,
  }));
}
export function projectCourse(course: Course): Partial<Course> {
  const keys = ['id','title','description','term','classIds','classNames','classUnits','units','chapters','chapterOrder','classOverrides','chapterOverrides','publishedAt','staleUnits','studentNotice','features'] as const;
  return Object.fromEntries(keys.filter(k => course[k] !== undefined).map(k => [k,course[k]]));
}
