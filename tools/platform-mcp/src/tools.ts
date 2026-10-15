import { z } from 'zod';
import { ALL_MATERIAL_CATALOG } from '../../../shared/materials.ts';
import { completion, forClass, type Course } from '../../../shared/model.ts';
import { SafeError } from './config.js';
import { safeOutput } from './privacy.js';
import { courseProjection } from './course.js';
import type { Call } from './callable.js';
const courseId = z.string().min(1).max(50).regex(/^[\p{L}\p{N}_-]+$/u);
export const toolSchemas = {
  list_courses: z.object({}).strict(),
  get_course_draft: z.object({courseId}).strict(),
  get_published: z.object({courseId}).strict(),
  diff_draft_published: z.object({courseId}).strict(),
  get_sync_status: z.object({}).strict(),
  list_materials: z.object({courseId}).strict(),
  get_completion_summary: z.object({courseId, classId:courseId}).strict(),
};
export type ToolName = keyof typeof toolSchemas;
function unavailable(tool: string) {
  return {available:false, code:'READONLY_BACKEND_GAP', tool, reason:'目前沒有純唯讀課程列表／草稿 callable；bootstrap 會寫入 profile，禁止作為替代。需另案新增唯讀後端，本輪不修改。'};
}
function numericStats(value: any): any {
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.map(numericStats);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([k]) => !/email|name|uid|studentId|By|sheetId|cursor|next/i.test(k)).map(([k,v]) => [k,numericStats(v)]));
  return undefined;
}
function syncProjection(data: any) {
  const status = data.status || {};
  return {
    scope:'project', lastSyncedAt:status.lastSyncedAt || null, lastRosterSyncedAt:status.lastRosterSyncedAt || null,
    syncing:status.syncing === true,
    // Raw errors may contain names/emails; expose only presence and known error count.
    hasError:!!status.lastError || status.lastResult?.hasErrors === true,
    bankResults:(status.lastResult?.banks || []).map((b: any) => ({
      courseId:b.courseId, unitId:b.unitId, count:b.count, created:b.created === true,
      hasError:!!b.error, staleUnits:b.staleUnits || [],
    })),
    rosterResult: {count:status.lastRosterResult?.count ?? null, hasError:!!status.lastRosterResult?.error},
    errorDetail:'錯誤全文可能含個資，唯讀連接器只回傳是否有錯誤。',
    staleUnitsScope:'最近一次同步結果；目前草稿 staleUnits 無唯讀入口，不能保證代表最新草稿。',
  };
}
export async function executeTool(name: ToolName, input: unknown, call: Call): Promise<unknown> {
  const args = toolSchemas[name].parse(input) as any;
  let result: unknown;
  if (name === 'list_courses' || name === 'get_course_draft' || name === 'diff_draft_published') result = unavailable(name);
  else if (name === 'get_published') result = { available:true, course:courseProjection(await call('getPublished',args)) };
  else if (name === 'get_sync_status') result = syncProjection(await call('getSyncStatus',{}));
  else if (name === 'list_materials') {
    const published = courseProjection(await call('getPublished', {courseId:args.courseId})) as any;
    const usage: Record<string,unknown[]> = {};
    for (const [owner, data] of [...Object.entries(published.chapters || {}), ...published.units.map((u: any) => [u.id,u]) ] as [string,any][]) {
      for (const a of data.activities || []) {
        for (const slug of Object.keys(ALL_MATERIAL_CATALOG)) {
          // A materialVersion normally holds v1, so identify catalog by the actual path.
          let path = ''; try { path = new URL(a.url).pathname; } catch {}
          if (path === '/115-1-AP2/materials/' + slug + '/index.html') (usage[slug] ||= []).push({owner, activityId:a.id});
        }
      }
    }
    result = {source:'shared/materials.ts', usageScope:'published-only', draftUsage:'unknown: 無純唯讀草稿入口', materials:Object.entries(ALL_MATERIAL_CATALOG).map(([slug,entry]) => ({slug,...entry,usedInPublished:!!usage[slug],usage:usage[slug] || []}))};
  } else {
    // PII from getCompletion lives only in memory. No raw logging, caching or MCP result.
    let after = '', pages = 0, students = 0, enabledStudents = 0, completedStudents = 0;
    let completedRequiredChapters = 0, requiredChapterOpportunities = 0;
    const seen = new Set<string>();
    while (true) {
      if (++pages > 100) throw new SafeError('COMPLETION_PAGE_LIMIT: 未回傳不完整統計。');
      const data = await call('getCompletion', {...args, ...(after ? {after} : {})});
      if (!Array.isArray(data.rows)) throw new SafeError('INVALID_COMPLETION_RESPONSE');
      const course = forClass(data.course as Course,args.classId);
      for (const row of data.rows) {
        students++;
        if (row.enabled !== true) continue;
        enabledStudents++;
        const c = completion(course,row.progress || {units:{},activities:{}});
        completedRequiredChapters += c.done;
        requiredChapterOpportunities += c.total;
        if (c.total > 0 && c.done === c.total) completedStudents++;
      }
      const next = data.next;
      if (!next) break;
      if (typeof next !== 'string' || seen.has(next)) throw new SafeError('INVALID_COMPLETION_CURSOR');
      seen.add(next); after = next;
    }
    result = {students,enabledStudents,completedStudents,completedRequiredChapters,requiredChapterOpportunities,pages};
  }
  return safeOutput(result);
}
