import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertReadonly,assertWrite,READONLY_CALLABLES,WRITE_CALLABLES,CallableClient} from '../src/callable.js';
import {requireTeacher} from '../src/auth.js';
import {safeOutput,privacyFindings} from '../src/privacy.js';
import {diffSummary} from '../src/course.js';
import {executeTool,toolSchemas} from '../src/tools.js';
import {WriteTools} from '../src/writes.js';
import {createServer} from '../src/server.js';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
const course:any={id:'MCP-TEST',title:'test',term:'115-1',description:'',classIds:['test'],units:[],chapters:{chapter:{title:'chapter',description:'',required:true,threshold:80,opensAt:'',dueAt:'',activities:[]}},sheetsUrl:'https://private.invalid'};
const args={mode:'preview',courseId:course.id,chapter:'chapter',patch:{threshold:90}};
function context(now=()=>1000) {
 let revision=0, current=structuredClone(course);
 const writes:any[]=[];
 const read=async(name:string)=>{
  if(name==='getCourseDraft') return {course:structuredClone(current),revision};
  if(name==='getPublished') return structuredClone(course);
  if(name==='listManagedCourses') return {courses:[{courseId:course.id,title:'test',term:'115-1',hasDraft:true,hasPublished:true,revision}]};
  if(name==='getSyncStatus') return {status:{lastSyncedAt:1}};
  throw Error(name);
 };
 const write=async(name:string,data:any)=>{writes.push({name,data});return name==='syncSheet'?{banks:[{questionChanges:{added:1,updated:2,retained:3,reset:2}}],hasErrors:false}:{ok:true,revision:++revision};};
 return {engine:new WriteTools(read,write,now),read,writes,bump:()=>revision++,modify:()=>current.chapters.chapter.threshold=60};
}
test('read and write allowlists are separate; legacy PII and unsafe get functions rejected before token/network',async()=>{
 let touched=false;const client=new CallableClient(async()=>{touched=true;return '';});
 for(const name of ['saveCourse','publishCourse','syncSheet','patchCourseDraft','bootstrap','getReflections','getAssessments','assessmentReport','getCompletion','getRoster','getPublished/../saveCourse']) {assert.throws(()=>assertReadonly(name));await assert.rejects(client.call(name,{}));}
 assert.equal(touched,false);
 assert.deepEqual(READONLY_CALLABLES,['listManagedCourses','getCourseDraft','getPublished','getSyncStatus','getCompletionSummary']);
 assert.deepEqual(WRITE_CALLABLES,['patchCourseDraft','syncSheet']);
 for(const name of ['saveCourse','publishCourse','syncRoster','deleteCourse','getPublished']) assert.throws(()=>assertWrite(name));
});
test('privacy removes nested names/IDs/credentials, scans output, and preserves material/activity UUIDs',()=>{
 const out=safeOutput({email:'fixture@example.edu',姓名:'fixture-name',學號:'11151001',uid:'secret',nested:[{name:'fixture-name',student_id:'11151001',title:'fixture@example.edu 11151001',refreshToken:'private'}],byUid:{secret:{}},'11151001':{best:100},roster:[{name:'fixture-name'}],counts:{total:3}});
 for(const forbidden of ['fixture@example.edu','11151001','fixture-name','secret','private','byUid','roster']) assert.ok(!JSON.stringify(out).includes(forbidden));
 assert.equal(privacyFindings(out),0);assert.throws(()=>safeOutput({numeric:11151001}),/PRIVACY_SCAN_FAILED/);
 const id='e2ec185c-21e6-4700-86fe-a123456789fb';assert.deepEqual(safeOutput({id}),{id});
});
test('missing or nonboolean teacher claim refuses startup',()=>{
 for(const teacher of [undefined,false,'true',1]) assert.throws(()=>requireTeacher({teacher}),/TEACHER_CLAIM_REQUIRED/);
 assert.doesNotThrow(()=>requireTeacher({teacher:true}));
});
test('diff is stable across key order and detects arrays/additions/removals',()=>{
 assert.equal(diffSummary({a:1,b:2},{b:2,a:1}).changed,false);
 assert.deepEqual(diffSummary({a:[1],b:2,'c/d':true},{a:[2],c:3}),{changed:true,changedPathCount:4,paths:['/a','/b','/c~1d','/c']});
});
test('all seven read tools use actual new backend contracts, and draft diff reads both true versions',async()=>{
 const ctx=context();
 const list:any=await executeTool('list_courses',{},ctx.read);assert.equal(list.courses[0].courseId,course.id);
 const d:any=await executeTool('get_course_draft',{courseId:course.id},ctx.read);assert.equal(d.revision,0);assert.equal(d.course.sheetsUrl,undefined);
 const before:any=await executeTool('diff_draft_published',{courseId:course.id},ctx.read);assert.equal(before.changed,false);
 ctx.modify();const after:any=await executeTool('diff_draft_published',{courseId:course.id},ctx.read);assert.equal(after.changed,true);
 const materials:any=await executeTool('list_materials',{courseId:course.id},ctx.read);assert.equal(materials.materials.length,38);assert.equal(materials.draftUsage,undefined);
});
test('completion tool only invokes backend summary, never obtains roster/individual progress',async()=>{
 const result:any=await executeTool('get_completion_summary',{courseId:course.id,classId:'test'},async(name)=>{assert.equal(name,'getCompletionSummary');return {students:2,enabledStudents:2,completedStudents:1,completedRequiredChapters:1,requiredChapterOpportunities:2,chapters:[{chapterId:'chapter',completed:1,opportunities:2}]};});
 assert.equal(result.completedStudents,1);assert.equal(privacyFindings(result),0);
});
test('sync errors are flags, never free form names/emails or Sheet identifiers',async()=>{
 const r:any=await executeTool('get_sync_status',{},async()=>({sheetId:'private',status:{lastError:'fixture-name fixture@example.edu 11151001'}}));
 assert.equal(r.hasError,true);assert.ok(!JSON.stringify(r).includes('fixture'));
});
test('actual callable transport is AP2 fixed endpoint and correct envelope',async()=>{
 const client=new CallableClient(async()=>'fixture-token',async(url,init)=>{assert.equal(url,'https://asia-east1-ap2-7ed91.cloudfunctions.net/getPublished');assert.deepEqual(JSON.parse(init?.body as string),{data:{courseId:course.id}});return new Response(JSON.stringify({result:course}));});
 assert.deepEqual(await client.call('getPublished',{courseId:course.id}),course);
});
test('App Check/401 permanently stops this client and never exposes raw failure',async()=>{
 let calls=0;const client=new CallableClient(async()=>'fixture-token',async()=>{calls++;return new Response(JSON.stringify({error:{message:'App Check fixture@example.edu'}}),{status:401});});
 await assert.rejects(client.call('getPublished',{}),/APP_CHECK_OR_AUTH_BLOCKED/);await assert.rejects(client.call('getPublished',{}),/APP_CHECK_BLOCKED/);assert.equal(calls,1);
});
test('schemas reject arbitrary endpoint/project or traversal',()=>{
 assert.equal(toolSchemas.get_published.safeParse({courseId:course.id,projectId:'mi-bd885'}).success,false);
 assert.equal(toolSchemas.get_published.safeParse({courseId:'../../other'}).success,false);
});
test('write preview shows before-after and never writes; apply requires teacher approval and one-use confirmation',async()=>{
 const ctx=context();const p:any=await ctx.engine.execute('update_chapter_settings',args);assert.equal(ctx.writes.length,0);assert.equal(p.expectedRevision,0);assert.equal(p.changes[0].before,80);assert.equal(p.changes[0].after,90);
 await assert.rejects(ctx.engine.execute('update_chapter_settings',{...args,mode:'apply',confirmationCode:p.confirmationCode}),/TEACHER_APPROVAL_REQUIRED/);
 const result:any=await ctx.engine.execute('update_chapter_settings',{...args,mode:'apply',teacherApproved:true,confirmationCode:p.confirmationCode});assert.equal(result.revision,1);assert.equal(ctx.writes[0].name,'patchCourseDraft');assert.equal(ctx.writes[0].data.expectedRevision,0);
 await assert.rejects(ctx.engine.execute('update_chapter_settings',{...args,mode:'apply',teacherApproved:true,confirmationCode:p.confirmationCode}),/CONFIRMATION_INVALID/);
});
test('confirmation rejects expired, changed payload/tool/course, stale revision and unversioned draft changes',async()=>{
 for(const kind of ['expired','payload','tool','course','revision','draft']) {
  let now=1000;const ctx=context(()=>now);const p:any=await ctx.engine.execute('update_chapter_settings',args);
  const input:any={...args,mode:'apply',teacherApproved:true,confirmationCode:p.confirmationCode};let tool:any='update_chapter_settings';
  if(kind==='expired') now+=600000;
  if(kind==='payload') input.patch={threshold:70};
  if(kind==='tool') {tool='update_activity';input.activityId='a';}
  if(kind==='course') input.courseId='OTHER';
  if(kind==='revision') ctx.bump();
  if(kind==='draft') ctx.modify();
  await assert.rejects(ctx.engine.execute(tool,input));assert.equal(ctx.writes.length,0);
 }
});
test('all activity tools build strict white-listed ops and invalid fields/order fail at preview',async()=>{
 const ctx=context();
 const a={id:'a',title:'a',type:'youtube',phase:'after',url:'https://www.youtube.com/watch?v=4wSVj0flWH8',description:'',required:false};
 const p:any=await ctx.engine.execute('add_activity',{mode:'preview',courseId:course.id,chapter:'chapter',activity:a});
 await ctx.engine.execute('add_activity',{mode:'apply',teacherApproved:true,confirmationCode:p.confirmationCode,courseId:course.id,chapter:'chapter',activity:a});
 assert.equal(ctx.writes[0].data.ops[0].op,'addActivity');
 await assert.rejects(ctx.engine.execute('update_chapter_settings',{...args,patch:{teacherIds:['bad']}}));
 await assert.rejects(ctx.engine.execute('reorder_activities',{mode:'preview',courseId:course.id,chapter:'chapter',activityIds:['absent']}));
});
test('sync preview makes scope/reset explicit, binds status and all revisions, and returns exact backend question counts',async()=>{
 const ctx=context();const p:any=await ctx.engine.execute('sync_sheet',{mode:'preview',resetWrong:true});
 assert.equal(p.scope,'all-managed-courses');assert.equal(ctx.writes.length,0);
 const r:any=await ctx.engine.execute('sync_sheet',{mode:'apply',resetWrong:true,teacherApproved:true,confirmationCode:p.confirmationCode});
 assert.equal(ctx.writes[0].name,'syncSheet');assert.deepEqual(ctx.writes[0].data.expectedRevisions,{[course.id]:0});assert.deepEqual(r.counts,{added:1,updated:2,retained:3,reset:2});
 const changed:any=await ctx.engine.execute('sync_sheet',{mode:'preview'});ctx.bump();
 await assert.rejects(ctx.engine.execute('sync_sheet',{mode:'apply',teacherApproved:true,confirmationCode:changed.confirmationCode}),/PREVIEW_STALE/);
});
test('SDK exposes exactly seven read and five destructive two-step write tools, with sanitized results',async()=>{
 const [ct,st]=InMemoryTransport.createLinkedPair();const ctx=context();const server=createServer(ctx.read,async()=>({ok:true}));const client=new Client({name:'fixture',version:'1'});
 await server.connect(st);await client.connect(ct);
 try {
  const list=await client.listTools();assert.equal(list.tools.length,12);assert.equal(list.tools.filter(t=>t.annotations?.readOnlyHint).length,7);
  assert.equal(list.tools.filter(t=>t.annotations?.destructiveHint===true && t.annotations.readOnlyHint===false).length,5);
  assert.ok(list.tools.filter(t=>t.annotations?.destructiveHint).every(t=>t.description?.includes('取得同意')));
  const result=await client.callTool({name:'get_course_draft',arguments:{courseId:course.id}});assert.equal(result.isError,undefined);assert.ok(!JSON.stringify(result).includes('private.invalid'));
 }finally{await client.close();await server.close();}
});
test('sync unknown question counts stay null; private data in a write preview is refused',async()=>{
 const ctx=context();const engine=new WriteTools(ctx.read,async()=>({banks:[{questionChanges:{added:null,updated:null,retained:null,reset:4}}]}));
 const preview:any=await engine.execute('sync_sheet',{mode:'preview',resetWrong:true});
 const result:any=await engine.execute('sync_sheet',{mode:'apply',resetWrong:true,teacherApproved:true,confirmationCode:preview.confirmationCode});
 assert.deepEqual(result.counts,{added:null,updated:null,retained:null,reset:4});assert.equal(result.countsComplete,false);
 await assert.rejects(engine.execute('update_chapter_settings',{...args,patch:{description:'fixture@example.test'}}),/WRITE_CONTAINS_PRIVATE_DATA/);
});
