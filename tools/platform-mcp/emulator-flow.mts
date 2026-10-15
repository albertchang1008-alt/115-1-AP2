import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {WriteTools} from './src/writes.ts';
import {executeTool} from './src/tools.ts';
import {safeOutput,privacyFindings} from './src/privacy.ts';
import {saveDraftWithRevision} from '../../src/courseRevision.ts';
const project='demo-platform-mcp';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8480' || process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9499' || process.env.GCLOUD_PROJECT!==project) throw Error('EMULATOR_ONLY: demo project and localhost emulator hosts required');
const require=createRequire(new URL('../../functions/package.json',import.meta.url));
const {initializeApp}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
initializeApp({projectId:project});const db=getFirestore(),auth=getAuth();
const checks:string[]=[];
async function identity(uid:string,teacher:boolean) {
 await auth.createUser({uid,email:uid+'@example.test',emailVerified:true});
 const custom=await auth.createCustomToken(uid,{teacher});
 const response=await fetch('http://127.0.0.1:9499/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-emulator-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:custom,returnSecureToken:true})});
 if(!response.ok) throw Error('EMULATOR_AUTH_FAILED');
 const data=await response.json() as any;return data.idToken as string;
}
const teacherToken=await identity('emulator-teacher',true),otherToken=await identity('emulator-other',true),studentToken=await identity('emulator-student',false);
async function callAs(token:string,name:string,data:any) {
 const response=await fetch('http://127.0.0.1:5501/'+project+'/asia-east1/'+name,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({data}),redirect:'error'});
 const raw=await response.json() as any;
 if(!response.ok || raw.error) {const e:any=Error(raw.error?.message || 'EMULATOR_CALL_FAILED');e.status=raw.error?.status;e.details=raw.error?.details;throw e;}
 return raw.result;
}
const read=(name:string,data:any)=>callAs(teacherToken,name,data);
const c:any={id:'MCP-TEST',title:'MCP Emulator fixture',term:'115-1',description:'',sheetsUrl:'',classIds:['test'],units:[{id:'unit',title:'unit',group:'chapter',required:true,threshold:80,opensAt:'',dueAt:'',bankVersion:'',activities:[]}],chapters:{chapter:{title:'chapter',description:'',required:true,threshold:80,opensAt:'',dueAt:'',activities:[]}},chapterOrder:['chapter']};
const published=structuredClone(c);published.chapters.chapter.activities=[{id:'p',title:'published fixture',type:'link',phase:'after',url:'https://example.org',description:'',required:true}];
await db.doc('courses/MCP-TEST').set({teacherIds:['emulator-teacher'],rosterVersion:2,draft:c,published});
await db.doc('courses/OTHER').set({teacherIds:['emulator-other'],draft:{...c,id:'OTHER'}});
for(const [id,done] of [['fixture-one',true],['fixture-two',false]] as const) {
 await db.doc('enrollments/'+id).set({courseId:'MCP-TEST',email:id+'@example.test',classId:'test',enabled:true,studentId:id,name:'Synthetic fixture'});
 await db.doc('profiles/'+id).set({email:id+'@example.test'});
 await db.doc('courses/MCP-TEST/progress/'+id).set({units:{},activities:{'chapter:chapter_p':{completed:done}}});
}
const initial=await read('getCourseDraft',{courseId:c.id});assert.equal(initial.revision,0);
assert.equal((await read('listManagedCourses',{})).courses.length,1);checks.push('pure read list/draft legacy revision0');
assert.equal((await db.doc('profiles/emulator-teacher').get()).exists,false);checks.push('read callables do not bootstrap/write profile');
await assert.rejects(callAs(otherToken,'getCourseDraft',{courseId:c.id}));
await assert.rejects(callAs(studentToken,'getCourseDraft',{courseId:c.id}));checks.push('non-teacher and cross-course denied');
let now=1000;const writer=new WriteTools(read,read,()=>now);
const activity={id:'a',title:'activity fixture',type:'youtube',phase:'after',url:'https://www.youtube.com/watch?v=4wSVj0flWH8',description:'',required:false};
const add={courseId:c.id,chapter:'chapter',activity};
const preview:any=await writer.execute('add_activity',{mode:'preview',...add});
assert.equal((await read('getCourseDraft',{courseId:c.id})).revision,0);
const applied:any=await writer.execute('add_activity',{mode:'apply',...add,teacherApproved:true,confirmationCode:preview.confirmationCode});
assert.equal(applied.revision,1);checks.push('connector preview/apply adds activity atomically');
const replay=await read('patchCourseDraft',{courseId:c.id,expectedRevision:0,requestId:preview.requestId,ops:[{op:'addActivity',chapter:'chapter',activity}]});
assert.equal(replay.duplicate,true);assert.equal(replay.revision,1);checks.push('requestId replay does not increment revision or duplicate audit');
await assert.rejects(read('patchCourseDraft',{courseId:c.id,expectedRevision:0,requestId:randomUUID(),ops:[{op:'updateChapterSettings',chapter:'chapter',patch:{threshold:90}}]}),e=>(e as any).status==='FAILED_PRECONDITION');
await assert.rejects(saveDraftWithRevision({call:read}, {...initial.course,revision:0}),/草稿已在其他地方被修改，請重新整理後再編輯/);
assert.equal((await read('getCourseDraft',{courseId:c.id})).revision,1);checks.push('stale patch and real admin save helper both rejected without overwriting');
for(const [tool,data] of [
 ['add_activity',{...add,activity:{...activity,id:'b'}}],
 ['update_activity',{courseId:c.id,chapter:'chapter',activityId:'a',patch:{required:true}}],
 ['reorder_activities',{courseId:c.id,chapter:'chapter',activityIds:['b','a']}],
 ['update_chapter_settings',{courseId:c.id,chapter:'chapter',patch:{threshold:90}}],
] as const) {const p:any=await writer.execute(tool,{mode:'preview',...data});await writer.execute(tool,{mode:'apply',...data,teacherApproved:true,confirmationCode:p.confirmationCode});}
checks.push('all four patch ops work through connector and callable');
const change={courseId:c.id,chapter:'chapter',patch:{required:false}};
const stale:any=await writer.execute('update_chapter_settings',{mode:'preview',...change});
await read('patchCourseDraft',{courseId:c.id,expectedRevision:5,requestId:randomUUID(),ops:[{op:'updateChapterSettings',chapter:'chapter',patch:{threshold:95}}]});
await assert.rejects(writer.execute('update_chapter_settings',{mode:'apply',...change,teacherApproved:true,confirmationCode:stale.confirmationCode}),/PREVIEW_STALE/);
const expired:any=await writer.execute('update_chapter_settings',{mode:'preview',...change});now+=600000;
await assert.rejects(writer.execute('update_chapter_settings',{mode:'apply',...change,teacherApproved:true,confirmationCode:expired.confirmationCode}),/EXPIRED/);checks.push('changed revision and expired confirmation denied');
const latest=await read('getCourseDraft',{courseId:c.id});
const saved=await saveDraftWithRevision({call:read},{...latest.course,revision:latest.revision});assert.equal(saved.revision,7);checks.push('fresh admin save advances revision and audits admin-ui');
const race=await Promise.allSettled([96,97].map(threshold=>read('patchCourseDraft',{courseId:c.id,expectedRevision:7,requestId:randomUUID(),ops:[{op:'updateChapterSettings',chapter:'chapter',patch:{threshold}}]})));
assert.equal(race.filter(x=>x.status==='fulfilled').length,1);assert.equal(race.filter(x=>x.status==='rejected').length,1);checks.push('concurrent revision7 patches allow exactly one commit');
const sameRequest={courseId:c.id,expectedRevision:8,requestId:randomUUID(),ops:[{op:'updateChapterSettings',chapter:'chapter',patch:{threshold:99}}]};
const same=await Promise.all([read('patchCourseDraft',sameRequest),read('patchCourseDraft',sameRequest)]);
assert.equal(same.filter(x=>x.duplicate===true).length,1);checks.push('concurrent same requestId applies once and returns one duplicate');
const audits=await db.collection('courses/MCP-TEST/auditLog').get();assert.equal(audits.size,9);
const auditRows=audits.docs.map((d:any)=>d.data());
assert.ok(auditRows.some((x:any)=>x.source==='admin-ui'));assert.ok(auditRows.some((x:any)=>x.source==='platform-mcp'));
assert.doesNotMatch(JSON.stringify(auditRows),/@example|Synthetic fixture|fixture-one|fixture-two|idToken|refreshToken|answers|roster/);
assert.deepEqual(await read('getPublished',{courseId:c.id}),published);checks.push('audit metadata only; published unchanged');
const auditUrl='http://127.0.0.1:8480/v1/projects/'+project+'/databases/(default)/documents/courses/MCP-TEST/auditLog/'+audits.docs[0].id;
const getRule=(token:string)=>fetch(auditUrl,{headers:{Authorization:'Bearer '+token}});
assert.equal((await getRule(teacherToken)).status,200);
assert.equal((await getRule(otherToken)).status,403);assert.equal((await getRule(studentToken)).status,403);
assert.equal((await fetch(auditUrl,{method:'PATCH',headers:{Authorization:'Bearer '+teacherToken,'Content-Type':'application/json'},body:JSON.stringify({fields:{fake:{booleanValue:true}}})})).status,403);
checks.push('Firestore audit rules allow owner teacher read only; other/student read and client write denied');
await db.doc('sync/config').set({sheetId:'emulator-placeholder-only'});
await assert.rejects(read('syncSheet',{expectedRevisions:{'MCP-TEST':9},expectedSyncStateHash:'0'.repeat(64)}),/同步來源或狀態已變動/);
assert.equal((await db.doc('sync/status').get()).exists,false);checks.push('sync stale source/status hash rejected before lease or external Sheet access');
const summary:any=await executeTool('get_completion_summary',{courseId:c.id,classId:'test'},read);assert.equal(summary.completedStudents,1);assert.equal(summary.students,2);
assert.doesNotMatch(JSON.stringify(summary),/fixture|email|uid|progress|roster/);checks.push('backend completion numbers only; no PII transported to connector');
const readonlyResults:Record<string,unknown>={};
for(const [name,args] of Object.entries({list_courses:{},get_course_draft:{courseId:c.id},get_published:{courseId:c.id},diff_draft_published:{courseId:c.id},get_sync_status:{},list_materials:{courseId:c.id},get_completion_summary:{courseId:c.id,classId:'test'}})) {
 const result=await executeTool(name as any,args,read);assert.equal(privacyFindings(result),0);readonlyResults[name]=result;
}
checks.push('all seven connector read tools use actual emulator callables and scan zero PII');
const output=safeOutput({mode:'firebase-emulator',project,productionCalls:0,checks,checkCount:checks.length,finalRevision:9,auditCount:audits.size,completion:summary,privacyFindings:0});
assert.equal(privacyFindings(output),0);
await mkdir(new URL('../../docs/platform-mcp/stage3/',import.meta.url),{recursive:true});
await writeFile(new URL('../../docs/platform-mcp/stage3/emulator-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
await writeFile(new URL('../../docs/platform-mcp/stage3/emulator-readonly.json',import.meta.url),JSON.stringify({mode:'firebase-emulator',privacyFindings:0,tools:readonlyResults},null,2)+'\n');
console.log('Emulator PASS: '+checks.length+' checks; privacy findings 0; production calls 0');
await db.terminate();
