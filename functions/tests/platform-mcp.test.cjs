const {test} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
process.env.FIREBASE_CONFIG = JSON.stringify({projectId:'demo-platform-mcp'});
const h = require('../lib/functions/src/index.js');
const {memoryDb} = require('./helpers/reflection-memory.cjs');
const teacher = {uid:'teacher',token:{teacher:true}};
const stranger = {uid:'stranger',token:{teacher:true}};
const student = {uid:'student',token:{email:'fixture@example.edu',email_verified:true,firebase:{sign_in_provider:'google.com'}}};
const course = () => ({id:'MCP-TEST',title:'Emulator fixture',term:'115-1',description:'',sheetsUrl:'https://private.invalid',classIds:['test'],units:[],chapters:{chapter:{title:'chapter',description:'',required:true,threshold:80,opensAt:'',dueAt:'',activities:[]}},chapterOrder:['chapter']});
function seed(ctx) {ctx.data.set('courses/MCP-TEST',{teacherIds:['teacher'],rosterVersion:2,draft:course(),published:course()});ctx.data.set('courses/OTHER',{teacherIds:['stranger'],draft:{...course(),id:'OTHER'}});}
const req = (data,auth=teacher) => ({data,auth});
const patch = (expectedRevision=0,requestId=randomUUID()) => ({courseId:'MCP-TEST',expectedRevision,requestId,ops:[{op:'updateChapterSettings',chapter:'chapter',patch:{threshold:90}}]});
test('pure reads expose managed courses/draft/revision0 but no profile writes, roster or sheet URL',async()=>{
 const ctx=memoryDb();try{seed(ctx);const list=await h.listManagedCourses.run(req({}));assert.equal(list.courses.length,1);assert.equal(list.courses[0].revision,0);
 const draft=await h.getCourseDraft.run(req({courseId:'MCP-TEST'}));assert.equal(draft.revision,0);assert.equal(draft.course.sheetsUrl,undefined);assert.equal(draft.teacherIds,undefined);
 assert.equal(ctx.writes.length,0);
 await assert.rejects(h.getCourseDraft.run(req({courseId:'OTHER'})),/未獲授權/);
 await assert.rejects(h.listManagedCourses.run(req({},student)),/教師權限/);
 }finally{ctx.restore();}
});
test('patch atomically advances legacy revision0 and idempotent requestId cannot apply twice or be reused with changed content',async()=>{
 const ctx=memoryDb();try{seed(ctx);const input=patch();const r=await h.patchCourseDraft.run(req(input));assert.equal(r.revision,1);assert.equal(ctx.data.get('courses/MCP-TEST').draft.chapters.chapter.threshold,90);
 const repeated=await h.patchCourseDraft.run(req(input));assert.equal(repeated.duplicate,true);assert.equal(repeated.revision,1);
 assert.equal([...ctx.data.keys()].filter(x=>x.includes('/auditLog/')).length,1);
 await assert.rejects(h.patchCourseDraft.run(req({...input,ops:[{op:'updateChapterSettings',chapter:'chapter',patch:{threshold:70}}]})),/requestId/);
 await assert.rejects(h.patchCourseDraft.run(req(patch())),/草稿已在其他地方/);
 await assert.rejects(h.saveCourse.run(req({course:course(),expectedRevision:0})),/草稿已在其他地方/);
 const saved=await h.saveCourse.run(req({course:course(),expectedRevision:1}));assert.equal(saved.revision,2);
 await assert.rejects(h.patchCourseDraft.run(req(patch(1))),/草稿已在其他地方/);
 assert.equal(ctx.data.get('courses/MCP-TEST').published.chapters.chapter.threshold,80);
 }finally{ctx.restore();}
});
test('patch rejects unknown ops, fields, wrong permissions, other courses and invalid settings without audit or revision changes',async()=>{
 const ctx=memoryDb();try{seed(ctx);
 for(const ops of [[{op:'deleteCourse',chapter:'chapter'}],[{op:'updateChapterSettings',chapter:'chapter',patch:{classIds:[]}}],[{op:'updateChapterSettings',chapter:'chapter',patch:{threshold:101}}],[{op:'updateChapterSettings',chapter:'chapter',patch:{required:'yes'}}]]) await assert.rejects(h.patchCourseDraft.run(req({...patch(),ops})));
 await assert.rejects(h.patchCourseDraft.run(req(patch(),stranger)),/未獲授權/);
 await assert.rejects(h.patchCourseDraft.run(req(patch(),student)),/教師權限/);
 await assert.rejects(h.patchCourseDraft.run(req({...patch(),courseId:'OTHER'})),/未獲授權/);
 assert.equal(ctx.data.get('courses/MCP-TEST').revision,undefined);assert.equal(ctx.writes.length,0);
 }finally{ctx.restore();}
});
test('all four ops validate as saveCourse, preserve unrelated settings, and audit stores only metadata, never raw text/email/student information',async()=>{
 const ctx=memoryDb();try{seed(ctx);
 const activity={id:'a',title:'fixture-name fixture@example.edu 11151001',type:'youtube',phase:'after',url:'https://www.youtube.com/watch?v=4wSVj0flWH8',description:'fixture-private',required:false};
 const input={...patch(),ops:[{op:'addActivity',chapter:'chapter',activity},{op:'updateActivity',chapter:'chapter',activityId:'a',patch:{title:'new fixture-name'}},{op:'reorderActivities',chapter:'chapter',activityIds:['a']},{op:'updateChapterSettings',chapter:'chapter',patch:{required:false}}]};
 await h.patchCourseDraft.run(req(input));
 const root=ctx.data.get('courses/MCP-TEST');assert.deepEqual(root.draft.classIds,['test']);assert.equal(root.draft.chapters.chapter.activities[0].title,'new fixture-name');
 const logs=[...ctx.data].filter(([k])=>k.includes('/auditLog/')).map(([,v])=>v);
 assert.equal(logs[0].actorUid,'teacher');assert.equal(logs[0].source,'platform-mcp');assert.equal(logs[0].fromRevision,0);assert.equal(logs[0].toRevision,1);
 assert.doesNotMatch(JSON.stringify(logs),/fixture-name|fixture-private|fixture@example|11151001|token|answers/);
 await assert.rejects(h.saveCourse.run(req({course:{...root.draft,chapters:{chapter:{...root.draft.chapters.chapter,threshold:101}}},expectedRevision:1})));
 }finally{ctx.restore();}
});
test('atomic commit failure leaves no draft/revision/audit/idempotency half-write',async()=>{
 const ctx=memoryDb();try{seed(ctx);ctx.failCommit(true);await assert.rejects(h.patchCourseDraft.run(req(patch())),/atomic commit/);
 assert.equal(ctx.data.get('courses/MCP-TEST').revision,undefined);assert.equal([...ctx.data.keys()].filter(x=>x.includes('/auditLog/')||x.includes('/patchRequests/')).length,0);
 }finally{ctx.restore();}
});
test('completion summary computes backend-only numbers and chapter totals without returning roster/progress',async()=>{
 const ctx=memoryDb();try{seed(ctx);let raw=course();raw.chapters.chapter.activities=[{id:'a',title:'a',type:'link',required:true}];
 raw.units=[{id:'unit',title:'unit',group:'chapter',required:true,bankVersion:'',activities:[]}];
 ctx.data.get('courses/MCP-TEST').published=raw;
 ctx.data.set('enrollments/fixture',{courseId:'MCP-TEST',classId:'test',enabled:true,email:'fixture@example.edu',studentId:'11151001',name:'fixture-name'});
 ctx.data.set('profiles/private-uid',{email:'fixture@example.edu'});
 ctx.data.set('courses/MCP-TEST/progress/private-uid',{units:{},activities:{'chapter:chapter_a':{completed:true}}});
 const result=await h.getCompletionSummary.run(req({courseId:'MCP-TEST',classId:'test'}));
 assert.equal(result.students,1);assert.equal(result.completedStudents,1);assert.deepEqual(result.chapters,[{chapterId:'chapter',completed:1,opportunities:1}]);
 assert.doesNotMatch(JSON.stringify(result),/fixture|11151001|private-uid|email|progress|name/);assert.equal(ctx.writes.length,0);
 }finally{ctx.restore();}
});
test('sync with stale confirmed revisions rejects before lease or external Sheet reads',async()=>{
 const ctx=memoryDb();try{seed(ctx);ctx.data.set('sync/config',{sheetId:'emulator-only-placeholder'});
 await h.patchCourseDraft.run(req(patch()));const before=ctx.writes.length;
 await assert.rejects(h.syncSheet.run(req({expectedRevisions:{'MCP-TEST':0}})),/草稿已在其他地方/);
 assert.equal(ctx.writes.length,before);assert.equal(ctx.data.has('sync/status'),false);
 await assert.rejects(h.syncSheet.run(req({expectedRevisions:{OTHER:0}})),/可管理課程已變動/);
 assert.equal(ctx.data.has('sync/status'),false);
 }finally{ctx.restore();}
});
