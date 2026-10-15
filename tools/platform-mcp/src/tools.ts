import { z } from 'zod';
import { ALL_MATERIAL_CATALOG } from '../../../shared/materials.ts';
import { safeOutput } from './privacy.js';
import { courseProjection, diffSummary } from './course.js';
import type { Call } from './callable.js';
import {SafeError} from './config.js';
export const courseId = z.string().min(1).max(50).regex(/^[-a-zA-Z0-9_\u3400-\u4dbf\u4e00-\u9fff]+$/);
export const toolSchemas = {
  list_courses:z.object({}).strict(),
  get_course_draft:z.object({courseId}).strict(),
  get_published:z.object({courseId}).strict(),
  diff_draft_published:z.object({courseId}).strict(),
  get_sync_status:z.object({}).strict(),
  list_materials:z.object({courseId}).strict(),
  get_completion_summary:z.object({courseId,classId:courseId}).strict(),
};
export type ToolName = keyof typeof toolSchemas;
function summaryProjection(data:any) {
 const fields=['students','enabledStudents','completedStudents','completedRequiredChapters','requiredChapterOpportunities'];
 if(fields.some(k=>!Number.isFinite(data?.[k]) || data[k]<0) || !Array.isArray(data.chapters)) throw new SafeError('INVALID_COMPLETION_SUMMARY');
 return {...Object.fromEntries(fields.map(k=>[k,data[k]])),chapters:data.chapters.map((c:any)=>{
   if(typeof c.chapterId!=='string' || !Number.isFinite(c.completed) || !Number.isFinite(c.opportunities)) throw new SafeError('INVALID_COMPLETION_SUMMARY');
   return {chapterId:c.chapterId,completed:c.completed,opportunities:c.opportunities};
 })};
}
export function syncProjection(data:any) {
 const status=data.status || {};
 return {scope:'project',lastSyncedAt:status.lastSyncedAt || null,lastRosterSyncedAt:status.lastRosterSyncedAt || null,syncing:status.syncing===true,
 hasError:!!status.lastError || status.lastResult?.hasErrors===true,
 bankResults:(status.lastResult?.banks || []).map((b:any)=>({courseId:b.courseId,unitId:b.unitId,count:b.count,created:b.created===true,hasError:!!b.error,staleUnits:b.staleUnits || []})),
 errorDetail:'錯誤全文可能含個資，僅回傳錯誤旗標。',staleUnitsScope:'最近一次同步結果；即時草稿 staleUnits 請讀 get_course_draft。'};
}
export async function executeTool(name:ToolName,input:unknown,call:Call):Promise<unknown> {
 const args=toolSchemas[name].parse(input) as any;
 let result:any;
 if(name==='list_courses') {
   const data=await call('listManagedCourses',{});
   result={courses:data.courses.map((c:any)=>({courseId:c.courseId,title:c.title,term:c.term,hasDraft:c.hasDraft===true,hasPublished:c.hasPublished===true,revision:c.revision}))};
 }
 else if(name==='get_course_draft') {const d=await call('getCourseDraft',args);result={course:courseProjection(d.course),revision:d.revision};}
 else if(name==='get_published') result={available:true,course:courseProjection(await call('getPublished',args))};
 else if(name==='diff_draft_published') {
   const draft=await call('getCourseDraft',args);
   const published=await call('getPublished',args);
   const comparable=(v:any)=>Object.fromEntries(Object.entries(courseProjection(v)).filter(([k])=>!['publishedAt','revision','archived'].includes(k)));
   result={revision:draft.revision,...diffSummary(comparable(draft.course),comparable(published))};
 } else if(name==='get_sync_status') result=syncProjection(await call('getSyncStatus',{}));
 else if(name==='get_completion_summary') result=summaryProjection(await call('getCompletionSummary',args));
 else {
   const draft=await call('getCourseDraft',args);
   const published=await call('getPublished',args);
   const usage:Record<string,any[]>={};
   for(const [scope,c] of [['draft',draft.course],['published',published]] as const) {
     for(const [owner,d] of [...Object.entries(c.chapters || {}),...c.units.map((u:any)=>[u.id,u])] as [string,any][]) {
       for(const a of d.activities || []) for(const slug of Object.keys(ALL_MATERIAL_CATALOG)) {
         let url:URL;try{url=new URL(a.url);}catch{continue;}
         if(url.origin==='https://albertchang1008-alt.github.io' && url.pathname==='/115-1-AP2/materials/'+slug+'/index.html') (usage[slug] ||= []).push({scope,owner,activityId:a.id});
       }
     }
   }
   result={source:'shared/materials.ts',revision:draft.revision,materials:Object.entries(ALL_MATERIAL_CATALOG).map(([slug,entry])=>({slug,...entry,usedInDraft:(usage[slug]||[]).some(x=>x.scope==='draft'),usedInPublished:(usage[slug]||[]).some(x=>x.scope==='published'),usage:usage[slug]||[]}))};
 }
 return safeOutput(result);
}
