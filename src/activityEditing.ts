import type { Activity, Phase } from '../shared/model';
import { isRequiredActivity } from '../shared/model';
import { MATERIAL_CATALOG } from '../shared/materials';

export const PHASE_ORDER: Phase[] = ['before', 'during', 'after'];
export const ACTIVITY_TYPE_LABEL: Record<Activity['type'], string> = { html: '互動教材', youtube: '影片', link: '外部教材', quiz: '測驗' };

/** 目錄名稱多以「圖卡」結尾；學生看到的活動名稱不需要這兩個字。 */
export function materialTitle(slug: string) {
  const label = MATERIAL_CATALOG[slug]?.label || '';
  return label.replace(/\s*圖卡$/, '').trim() || label;
}

/** 名稱仍是預設值、空白，或是上一份教材自動帶入的名稱時，才換成新教材名稱；教師自訂的名稱不覆蓋。 */
export function autoTitle(activity: Pick<Activity, 'title' | 'materialVersion'>, nextSlug: string) {
  const title = activity.title.trim();
  const previous = activity.materialVersion && MATERIAL_CATALOG[activity.materialVersion] ? materialTitle(activity.materialVersion) : '';
  const replaceable = !title || title === '新活動' || (!!previous && (title === previous || title === MATERIAL_CATALOG[activity.materialVersion!].label));
  return replaceable && MATERIAL_CATALOG[nextSlug] ? materialTitle(nextSlug) : activity.title;
}

export function requiredLabel(activity: Activity) {
  const required = isRequiredActivity(activity);
  return { required, text: (required ? '必做' : '選做') + (activity.required === undefined ? '（依類型）' : '') };
}

/** 新活動放在同階段（含較早階段）最後一個活動之後，而不是整張清單最底。 */
export function insertActivity(list: Activity[], activity: Activity) {
  const rank = PHASE_ORDER.indexOf(activity.phase);
  let at = -1;
  list.forEach((a, i) => { if (PHASE_ORDER.indexOf(a.phase) <= rank) at = i; });
  const next = [...list];
  next.splice(at + 1, 0, activity);
  return next;
}

/** 依階段分組，保留原陣列順序與索引。 */
export function groupByPhase(list: Activity[]) {
  return PHASE_ORDER.map((phase) => ({ phase, items: list.map((activity, index) => ({ activity, index })).filter((x) => x.activity.phase === phase) }));
}

/** 在同一階段內與相鄰活動交換位置；跨階段請改「階段」欄位。 */
export function moveWithinPhase(list: Activity[], index: number, offset: -1 | 1) {
  const phase = list[index]?.phase;
  const same = list.map((a, i) => (a.phase === phase ? i : -1)).filter((i) => i >= 0);
  const pos = same.indexOf(index), to = same[pos + offset];
  if (to === undefined) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
