const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.FIREBASE_CONFIG=JSON.stringify({projectId:'demo-course-platform'});
const handlers=require('../lib/functions/src/index.js');const {getFirestore}=require('firebase-admin/firestore');const {completion,chapterCompletion}=require('../lib/shared/model.js');
const chapter=(activities=[])=>({title:'單元',description:'',required:true,threshold:80,opensAt:'',dueAt:'',activities});
const activity=id=>({id,title:id,type:'html',tracking:'interactive',phase:'before',url:'https://example.com/',description:''});
const entry=(completed,position=1,updatedAt=1)=>({completed,position,updatedAt});
test('教師合併 transaction：預覽、同 ID 去重、進度只增、設定目標優先、完成度與發布隔離',async()=>{
 const db=getFirestore(),originals={doc:db.doc,runTransaction:db.runTransaction},data=new Map();let logId=0,writes=0;
 const snap=path=>({exists:data.has(path),id:path.split('/').at(-1),ref:db.doc(path),data:()=>structuredClone(data.get(path))});
 db.doc=path=>({path,get:async()=>snap(path),collection:name=>({path:`${path}/${name}`,doc:id=>db.doc(`${path}/${name}/${id||'log'+ ++logId}`)})});
 db.runTransaction=async fn=>{const pending=[];const result=await fn({get:async ref=>ref.get?ref.get():{docs:[...data.keys()].filter(p=>p.startsWith(ref.path+'/')&&!p.slice(ref.path.length+1).includes('/')).map(snap)},update:(ref,value)=>pending.push([ref.path,{...data.get(ref.path),...value}]),create:(ref,value)=>pending.push([ref.path,value])});pending.forEach(([p,v])=>{data.set(p,v);writes++;});return result;};
 try{
 const draft={id:'ap2',title:'草稿名稱',classIds:['A','B'],units:[{id:'u',group:'心臟II',bankVersion:'v1',...chapter()}],chapters:{舊單元:{...chapter([activity('a'),activity('b')]),opensAt:'2026-10-01T00:00',dueAt:'2026-11-01T00:00'},心臟II:{...chapter([activity('a')]),dueAt:'2026-12-01T00:00'}},chapterOrder:['舊單元','心臟II'],chapterOverrides:{A:{舊單元:{threshold:70,required:false,opensAt:'2026-10-02T00:00'},心臟II:{threshold:90,required:true,opensAt:''}},B:{舊單元:{dueAt:'2026-11-02T00:00'}}}};
 const published={...structuredClone(draft),title:'正式名稱'};published.chapters.心臟II.threshold=90;
 data.set('courses/ap2',{teacherIds:['teacher'],draft:structuredClone(draft),published:structuredClone(published)});
 data.set('courses/ap2/progress/s1',{units:{u:{best:95}},activities:{'chapter:舊單元_a':entry(true,8,3),'chapter:舊單元_b':entry(true),'chapter:心臟II_a':entry(false,2,5),other:entry(false)},diagnosticMetadata:{keep:true}});
 data.set('courses/ap2/progress/s2',{units:{u:{best:95}},activities:{'chapter:舊單元_a':entry(false,2),'chapter:心臟II_a':entry(true,10,8)}});
 data.set('courses/ap2/progress/s3',{units:{},activities:{other:entry(true)}});
 data.set('courses/ap2/progress/s4',{units:{u:{best:95}}});
 data.set('courses/ap2/research/example',{value:'keep'});data.set('courses/ap2/diagnostics/example',{value:'keep'});
 const req={auth:{uid:'teacher',token:{teacher:true}},data:{courseId:'ap2',sourceName:'舊單元',targetName:'心臟II',preview:true,expectedDraft:{publishedAt:123,archived:false,...draft}}};
 const preview=await handlers.mergeChapter.run(req);assert.equal(preview.affectedStudents,2);assert.deepEqual(preview.activities.map(a=>[a.id,a.alreadyInTarget]),[['a',true],['b',false]]);assert.equal(writes,0);
 await assert.rejects(handlers.mergeChapter.run({...req,auth:{uid:'other',token:{teacher:true}}}),/未獲授權/);
 await assert.rejects(handlers.mergeChapter.run({...req,auth:{uid:'student',token:{email:'student@ctcn.edu.tw',email_verified:true,firebase:{sign_in_provider:'google.com'}}}}),/課程未開放/);
 await assert.rejects(handlers.mergeChapter.run({...req,data:{...req.data,preview:false,confirmationToken:'fake'}}),/重新預覽/);assert.equal(writes,0);
 data.set('courses/ap2/progress/new-student',{activities:{'chapter:舊單元_b':entry(true)}});await assert.rejects(handlers.mergeChapter.run({...req,data:{...req.data,preview:false,confirmationToken:preview.confirmationToken}}),/受影響學生已變動/);data.delete('courses/ap2/progress/new-student');assert.equal(writes,0);
 const oldPublished=structuredClone(data.get('courses/ap2').published);data.get('courses/ap2').published.units.push({...draft.units[0],id:'legacy',group:'舊單元'});const blocked=await handlers.mergeChapter.run(req);assert.match(blocked.blockedReason,/學生端（已發布版本）.*仍有次單元，請先發布後再合併/);assert.equal(blocked.confirmationToken,'');await assert.rejects(handlers.mergeChapter.run({...req,data:{...req.data,preview:false,confirmationToken:preview.confirmationToken}}),/請先發布後再合併/);data.get('courses/ap2').published=oldPublished;assert.equal(writes,0);
 // Settings changing after preview must force another explicit confirmation.
 data.get('courses/ap2').draft.description='changed';await assert.rejects(handlers.mergeChapter.run({...req,data:{...req.data,preview:false,confirmationToken:preview.confirmationToken}}),/草稿剛被更新/);delete data.get('courses/ap2').draft.description;
 const result=await handlers.mergeChapter.run({...req,data:{...req.data,preview:false,confirmationToken:preview.confirmationToken}});
 assert.deepEqual(result.course.chapters.心臟II.activities.map(a=>a.id),['a','b']);assert.equal(result.course.chapters.舊單元,undefined);assert.deepEqual(result.course.chapterOrder,['心臟II']);
 assert.equal(result.course.chapters.心臟II.opensAt,'2026-10-01T00:00');assert.equal(result.course.chapters.心臟II.dueAt,'2026-12-01T00:00');
 assert.deepEqual(result.course.chapterOverrides.A.心臟II,{threshold:90,required:true,opensAt:'2026-10-02T00:00'});assert.equal(result.course.chapterOverrides.A.舊單元,undefined);assert.equal(result.course.chapterOverrides.B.心臟II.dueAt,'2026-11-02T00:00');
 const course=data.get('courses/ap2');assert.equal(course.published.title,'正式名稱');assert.equal(course.published.chapters.心臟II.threshold,90);
 const s1=data.get('courses/ap2/progress/s1'),s2=data.get('courses/ap2/progress/s2');assert.deepEqual(s1.activities['chapter:心臟II_a'],entry(true,8,5));assert.deepEqual(s2.activities['chapter:心臟II_a'],entry(true,10,8));assert(s1.activities['chapter:舊單元_a'].completed);assert(s1.activities['chapter:舊單元_b'].completed);assert.deepEqual(s1.diagnosticMetadata,{keep:true});assert.equal(chapterCompletion(course.published,'心臟II',s1).done,true);assert.deepEqual(completion(course.published,s1),{done:1,total:1});assert.deepEqual(completion(course.published,s2),{done:0,total:1});assert.equal(chapterCompletion(course.published,'心臟II',s1).totalRequired,3);
 assert.deepEqual(data.get('courses/ap2/progress/s3'),{units:{},activities:{other:entry(true)}});assert.deepEqual(data.get('courses/ap2/research/example'),{value:'keep'});assert.deepEqual(data.get('courses/ap2/diagnostics/example'),{value:'keep'});
 // A source that still owns a category must never merge, even with a teacher token.
 data.set('courses/ap2',{teacherIds:['teacher'],draft:{...draft,units:[...draft.units,{...draft.units[0],id:'old',group:'舊單元'}]}});await assert.rejects(handlers.mergeChapter.run({...req,data:{...req.data,expectedDraft:undefined}}),/還有次單元/);
 }finally{Object.assign(db,originals);}
});
