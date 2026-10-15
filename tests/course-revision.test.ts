import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveDraftWithRevision} from '../src/courseRevision';
import {memoryApi,sampleCourse} from '../src/service';
import {applyDraftOps,REVISION_CONFLICT} from '../shared/courseDraft';
test('admin save carries originally read revision, returns new revision, and legacy draft starts at zero',async()=>{
 const calls:any[]=[];
 const api:any={call:async(name:string,data:any)=>{calls.push({name,data});return {revision:1};}};
 const result=await saveDraftWithRevision(api,sampleCourse());
 assert.equal(calls[0].data.expectedRevision,0);assert.equal(result.revision,1);
 await saveDraftWithRevision(api,{...sampleCourse(),revision:6});assert.equal(calls[1].data.expectedRevision,6);
});
test('admin conflict keeps local content and displays exact refresh message without automatic overwrite/retry',async()=>{
 const draft={...sampleCourse(),revision:1,title:'unsaved'};
 let n=0;
 const api:any={call:async()=>{n++;throw {details:{reason:'REVISION_CONFLICT'},message:'server reject'};}};
 await assert.rejects(saveDraftWithRevision(api,draft),new RegExp(REVISION_CONFLICT));
 assert.equal(draft.title,'unsaved');assert.equal(draft.revision,1);assert.equal(n,1);
});
test('memory preview also rejects a stale admin editor after another save',async()=>{
 const api=memoryApi(sampleCourse());
 const old=structuredClone(sampleCourse());const saved=await saveDraftWithRevision(api,old);assert.equal(saved.revision,1);
 await assert.rejects(saveDraftWithRevision(api,old),new RegExp(REVISION_CONFLICT));
 const saved2=await saveDraftWithRevision(api,saved);assert.equal(saved2.revision,2);
});
test('client patch model rejects illegal fields and exact-permutation ordering',()=>{
 const c:any={...sampleCourse(),chapters:{c:{title:'c',activities:[{id:'a'},{id:'b'}]}}};
 assert.throws(()=>applyDraftOps(c,[{op:'updateChapterSettings',chapter:'c',patch:{classIds:[]}}]),/白名單/);
 assert.throws(()=>applyDraftOps(c,[{op:'reorderActivities',chapter:'c',activityIds:['a','a']}]),/排序/);
 const next=applyDraftOps(c,[{op:'reorderActivities',chapter:'c',activityIds:['b','a']}]);
 assert.deepEqual(next.chapters!.c.activities.map(a=>a.id),['b','a']);assert.deepEqual(c.chapters.c.activities.map((a:any)=>a.id),['a','b']);
});
