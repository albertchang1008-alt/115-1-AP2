import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Course,Unit} from '../shared/model';
import {OPEN_STATUS, defaultPreviewClass, selectedClasses, studentPreviewCourse, studentUpdateStatus, visibleClasses, studentHiddenReasons, studentUpdateSummary, courseStatusRows} from '../shared/courseStatus';
import {previewClassPreference, rememberPreviewClass} from '../src/previewPreferences';
import {readPublishedCourse} from '../src/usePublishedCourse';
const unit=(id='u'):Unit=>({id,title:id,description:'',required:true,threshold:80,opensAt:'',dueAt:'',bankVersion:'v1',activities:[],visibility:'current'});
function course():Course{return {id:'MCP-TEST',title:'本機測試',description:'',term:'115-1',sheetsUrl:'',classIds:['A','B','C'],units:[unit('u'),unit('v')],classUnits:{A:['u'],B:['u','v'],C:[]}};}

test('預覽班級記憶、最多勾選、同數穩定、未設定等於全選、移除班級及空班級',()=>{
 const c=course();assert.equal(defaultPreviewClass(c),'B');assert.equal(defaultPreviewClass(c,'A'),'A');assert.equal(defaultPreviewClass(c,'removed'),'B');
 delete c.classUnits!.A;assert.equal(defaultPreviewClass(c),'A');assert.deepEqual(selectedClasses(c,'v'),['A','B']);assert.equal(defaultPreviewClass({...c,classIds:[]}), '');
});
test('班級記憶按教師與課程隔離，localStorage停用或滿額仍可預覽',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),m=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>m.get(k)||null,setItem:(k:string,v:string)=>m.set(k,v)}});
 try{
  const c=course();assert.equal(previewClassPreference(c,'t'),'B');rememberPreviewClass(c,'t','A');assert.equal(previewClassPreference(c,'t'),'A');assert.equal(previewClassPreference(c,'other'),'B');assert.equal(previewClassPreference({...c,id:'OTHER-TEST'},'t'),'B');
  rememberPreviewClass(c,'t','nonexistent');assert.equal(previewClassPreference(c,'t'),'A');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('disabled');}});
  assert.equal(previewClassPreference(c,'t'),'B');assert.doesNotThrow(()=>rememberPreviewClass(c,'t','A'));
 }finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete (globalThis as any).localStorage;}
});
test('模擬只將hidden視為current，班級未勾仍排除，草稿與已考完不改動',()=>{
 const c=course();c.units[0].visibility='hidden';c.units[1].visibility='archived';const before=structuredClone(c);
 assert.deepEqual(studentPreviewCourse(c,'A').units,[]);assert.deepEqual(studentPreviewCourse(c,'A',true).units.map(u=>u.id),['u']);assert.equal(studentPreviewCourse(c,'B',true).units[1].visibility,'archived');assert.deepEqual(c,before);
});
test('開放狀態×學生端版本×班級勾選矩陣，以學生端資料判斷當下可見',()=>{
 let cases=0;
 for(const visibility of ['hidden','current','archived'] as const)for(const version of ['same','modified','missing'])for(const checked of [true,false,'implicit'] as const){
  const p=course();p.units[0].visibility=visibility;p.classIds=['A'];p.classUnits=checked==='implicit'?{}:{A:checked?['u']:[]};
  const d=structuredClone(p);if(version==='modified')d.units[0].title+='（新）';const published=version==='missing'?undefined:p;
  const row=courseStatusRows(d,published)[0];assert.equal(row.visibility,OPEN_STATUS[visibility]);assert.equal(row.status,version==='same'?'已更新到學生端':version==='modified'?'有修改未更新':'尚未更新到學生端');
  assert.deepEqual(row.visibleClasses,version!=='missing'&&visibility!=='hidden'&&checked!==false?['A']:[]);cases++;
 }
 assert.equal(cases,27);
});
test('草稿勾選不能冒充學生已開放，立即生效欄位不算未更新，分類與活動更動會算',()=>{
 const p=course(),d=structuredClone(p);p.classUnits={A:[],B:[],C:[]};d.classUnits={A:['u'],B:[],C:[]};
 assert.equal(studentUpdateStatus(d,p,d.units[0]),'有修改未更新');assert.deepEqual(visibleClasses(p,'u'),[]);assert.deepEqual(studentHiddenReasons(p,'u'),['沒有勾選班級']);
 const a=course(),b=structuredClone(a);b.revision=10;b.publishedAt=100;b.units[0].visibility='hidden';b.units[0].visibilityUpdatedAt=1;b.studentNotice='立即生效';assert.equal(studentUpdateStatus(b,a,b.units[0]),'已更新到學生端');
 b.units[0].bankVersion='v2';assert.equal(studentUpdateStatus(b,a,b.units[0]),'有修改未更新');
});
test('確認清單包括新增／修改／移除與尚未開放、空班級警告，無重複活動計數',()=>{
 const p=course(),d=structuredClone(p);d.units=[{...unit('u'),title:'改名'}, {...unit('new'),group:'新章節',visibility:'hidden'}, {...unit('none'),visibility:'current'}];d.classUnits={A:['new'],B:[],C:[]};
 const s=studentUpdateSummary(d,p);assert.equal(s.units.added,2);assert.equal(s.units.removed,1);assert(s.units.modified>0);assert.equal(s.hidden.length,1);assert.deepEqual(s.selectedHidden,s.hidden);assert(s.currentWithoutClasses.some(s=>s.endsWith('／none')));
 const same=studentUpdateSummary(p,structuredClone(p));for(const k of ['chapters','units','activities'] as const)assert.deepEqual(same[k],{added:0,modified:0,removed:0});
 const rows=courseStatusRows(d,p);assert(rows.some(r=>r.unit.id==='v'&&r.removed&&r.status==='有修改未更新'));
});
test('已發布資料讀取失敗不當成尚未更新，只辨識不存在的課程',async()=>{
 const missing={preview:true,async call(){throw Error('尚未發布課程');}};assert.equal(await readPublishedCourse(missing,'MCP-TEST'),undefined);
 await assert.rejects(readPublishedCourse({preview:true,async call(){throw Error('permission-denied');}},'MCP-TEST'),/permission-denied/);
});

test('確認活動計數不重複計入舊課程推導的Chapter鏡像，精確計新增／修改／移除',()=>{
 const p=course();p.units[0].activities=[{id:'old',title:'舊活動',type:'link',phase:'before',url:'https://example.test',description:''}];
 const d=structuredClone(p);d.units[0].activities[0].title='改活動';
 assert.deepEqual(studentUpdateSummary(d,p).activities,{added:0,modified:1,removed:0});
 const n=structuredClone(p);n.units[0].activities.push({id:'new',title:'新活動',type:'link',phase:'after',url:'https://example.test',description:''});
 assert.deepEqual(studentUpdateSummary(n,p).activities,{added:1,modified:0,removed:0});
 const r=structuredClone(p);r.units[0].activities=[];assert.deepEqual(studentUpdateSummary(r,p).activities,{added:0,modified:0,removed:1});
});
