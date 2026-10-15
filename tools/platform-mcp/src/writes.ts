import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {applyDraftOps,type DraftOp} from '../../../shared/courseDraft.ts';
import {validateCourseDraft} from '../../../shared/courseValidation.ts';
import {safeOutput,privacyFindings} from './privacy.js';
import {courseId,syncProjection} from './tools.js';
import {SafeError} from './config.js';
import type {Call} from './callable.js';
export const writeSchemas = {
 add_activity:z.object({mode:z.enum(['preview','apply']),courseId,chapter:z.string().min(1).max(200),activity:z.record(z.unknown()),confirmationCode:z.string().optional(),teacherApproved:z.boolean().optional()}).strict(),
 update_activity:z.object({mode:z.enum(['preview','apply']),courseId,chapter:z.string().min(1).max(200),activityId:z.string(),patch:z.record(z.unknown()),confirmationCode:z.string().optional(),teacherApproved:z.boolean().optional()}).strict(),
 reorder_activities:z.object({mode:z.enum(['preview','apply']),courseId,chapter:z.string().min(1).max(200),activityIds:z.array(z.string()).max(30),confirmationCode:z.string().optional(),teacherApproved:z.boolean().optional()}).strict(),
 update_chapter_settings:z.object({mode:z.enum(['preview','apply']),courseId,chapter:z.string().min(1).max(200),patch:z.record(z.unknown()),confirmationCode:z.string().optional(),teacherApproved:z.boolean().optional()}).strict(),
 sync_sheet:z.object({mode:z.enum(['preview','apply']),resetWrong:z.boolean().default(false),confirmationCode:z.string().optional(),teacherApproved:z.boolean().optional()}).strict(),
};
export type WriteTool = keyof typeof writeSchemas;
function stable(v:any):string {return JSON.stringify(v,(_k,x)=>x && typeof x==='object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])) : x);}
const hash=(v:unknown)=>createHash('sha256').update(stable(v)).digest('hex');
function changes(before:any,after:any,path=''):any[] {
 if(stable(before)===stable(after)) return [];
 if(before && after && typeof before==='object' && typeof after==='object' && !Array.isArray(before) && !Array.isArray(after)) return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>changes(before[k],after[k],path+'/'+k.replace(/~/g,'~0').replace(/\//g,'~1')));
 return [{path:path||'/',before:before ?? null,after:after ?? null}];
}
interface Ticket {tool:WriteTool;payloadHash:string;stateHash:string;expiresAt:number;requestId:string;}
export class WriteTools {
 private tickets = new Map<string,Ticket>();
 constructor(private read:Call,private write:Call,private now=Date.now) {}
 private async snapshot(tool:WriteTool,args:any) {
  if(tool==='sync_sheet') {
   const [status,list]=await Promise.all([this.read('getSyncStatus',{}),this.read('listManagedCourses',{})]);
   if(list.courses.length>100) throw new SafeError('SYNC_COURSE_LIMIT: 既有同步最多100門課，請先縮小管理範圍；不回傳部分預覽。');
   const revisions=Object.fromEntries(list.courses.map((c:any)=>[c.courseId,c.revision]));
   return {binding:{revisions,statusHash:hash(status)},expectedRevisions:revisions,syncStateHash:hash(status),status:syncProjection(status)};
  }
  const draft=await this.read('getCourseDraft',{courseId:args.courseId});
  return {binding:{revision:draft.revision,course:draft.course},course:draft.course,revision:draft.revision};
 }
 private operation(tool:WriteTool,args:any):DraftOp {
  if(tool==='add_activity') return {op:'addActivity',chapter:args.chapter,activity:args.activity};
  if(tool==='update_activity') return {op:'updateActivity',chapter:args.chapter,activityId:args.activityId,patch:args.patch};
  if(tool==='reorder_activities') return {op:'reorderActivities',chapter:args.chapter,activityIds:args.activityIds};
  return {op:'updateChapterSettings',chapter:args.chapter,patch:args.patch};
 }
 async execute(tool:WriteTool,input:unknown):Promise<unknown> {
  const parsed=writeSchemas[tool].parse(input) as any;
  const {mode,confirmationCode,teacherApproved,...payload}=parsed;
  if(privacyFindings(payload)) throw new SafeError('WRITE_CONTAINS_PRIVATE_DATA: 不接受email、學號或token寫入課程。');
  const payloadHash=hash({tool,payload});
  if(mode==='preview') {
   const current=await this.snapshot(tool,payload);
   let preview:any;
   if(tool==='sync_sheet') preview={scope:'all-managed-courses',explanation:'同步此教師名下所有對應Sheet課程的題庫與草稿；不發布、不同步名冊。Sheet內容尚未預讀，不能預估題數。resetWrong='+payload.resetWrong,expectedRevisions:current.expectedRevisions,syncStatus:current.status};
   else {
    const next=applyDraftOps(current.course,[this.operation(tool,payload)]);
    validateCourseDraft(next);
    preview={courseId:payload.courseId,expectedRevision:current.revision,changes:changes(current.course,next)};
   }
   const code=randomBytes(24).toString('hex'),expiresAt=this.now()+600000;
   for(const [key,ticket] of this.tickets) if(ticket.expiresAt<=this.now()) this.tickets.delete(key);
   if(this.tickets.size>=100) throw new SafeError('TOO_MANY_PREVIEWS');
   const ticket={tool,payloadHash,stateHash:hash(current.binding),expiresAt,requestId:randomUUID()};
   // Keep only hashes/metadata. No raw draft/sync errors/PII cached between steps.
   const result=safeOutput({...preview,confirmationCode:code,expiresAt,requestId:ticket.requestId,requirement:'套用前必須把預覽內容給教師看，並取得同意；確認碼一次有效、10分鐘到期。'});
   this.tickets.set(hash(code),ticket);
   return result;
  }
  if(teacherApproved!==true) throw new SafeError('TEACHER_APPROVAL_REQUIRED');
  if(!confirmationCode) throw new SafeError('CONFIRMATION_REQUIRED');
  const key=hash(confirmationCode),ticket=this.tickets.get(key);
  this.tickets.delete(key); // Every apply attempt consumes the code, even conflict/expiry.
  if(!ticket || ticket.expiresAt<=this.now()) throw new SafeError('CONFIRMATION_INVALID_OR_EXPIRED');
  if(ticket.tool!==tool || ticket.payloadHash!==payloadHash) throw new SafeError('CONFIRMATION_DIFF_CHANGED');
  const current=await this.snapshot(tool,payload);
  if(hash(current.binding)!==ticket.stateHash) throw new SafeError('PREVIEW_STALE: 差異或revision已變，請重新預覽。');
  if(tool==='sync_sheet') {
   const result=await this.write('syncSheet',{resetWrong:payload.resetWrong,expectedRevisions:current.expectedRevisions,expectedSyncStateHash:current.syncStateHash});
   const banks=result.banks || [];
   const stats=banks.map((b:any)=>b.questionChanges);
   const counts=Object.fromEntries(['added','updated','retained','reset'].map(k=>[k,stats.every((s:any)=>s && typeof s[k]==='number') ? stats.reduce((n:number,s:any)=>n+s[k],0) : null]));
   const complete=Object.values(counts).every(v=>typeof v==='number');
   return safeOutput({applied:true,hasErrors:result.hasErrors===true,counts,countsComplete:complete,note:complete?'重置依錯題延續規則計算，可能與新增／更新／保留題數重疊。':'全部重算不讀舊版，或部分舊題庫缺可靠比較資料；無法確認的題數為null，不推測。'});
  }
  return safeOutput(await this.write('patchCourseDraft',{courseId:payload.courseId,expectedRevision:current.revision,ops:[this.operation(tool,payload)],requestId:ticket.requestId}));
 }
}
