import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Course,Unit} from '../shared/model';
import {openingStatusTags,attentionStatusTags} from '../shared/courseStatus';
const unit=(id:string,visibility:Unit['visibility']):Unit=>({id,title:id,group:'甲章',description:'',required:true,threshold:80,opensAt:'',dueAt:'',bankVersion:'fixture-v1',activities:[],visibility});
const course=(units:Unit[]):Course=>({id:'MCP-TEST',title:'本機',description:'',term:'115-1',sheetsUrl:'',classIds:[],units});
test('章節分類全同時只顯示一個狀態且不加數量',()=>{
 for(const state of ['hidden','current','archived'] as const){const result=openingStatusTags([unit('a',state),unit('b',state)]);assert.equal(result.length,1);assert.equal(result[0].count,2);assert(!/\d/.test(result[0].label));}
 assert.deepEqual(openingStatusTags([]),[]);
});
test('混合分類精確加總三種狀態，單分類沿用一個標籤',()=>{
 const units=[unit('a','current'),unit('b','current'),unit('c','current'),unit('d','hidden'),unit('e','archived')];
 assert.deepEqual(openingStatusTags(units).map(t=>t.label),['目前學習 3','尚未開放 1','已考完 1']);
 assert.deepEqual(openingStatusTags([units[3]]).map(t=>t.label),['尚未開放']);
});
test('舊分類未設visibility依既有規則顯示，不更動原資料',()=>{
 const u=unit('legacy',undefined),before=structuredClone(u);assert.equal(openingStatusTags([u])[0].label,'目前學習');assert.deepEqual(u,before);
});
test('學生端只顯示需注意的狀態，章節警告去重且不列已更新',()=>{
 const units=[unit('a','current'),unit('b','hidden'),unit('c','archived')],p=course(units),d=structuredClone(p);
 assert.deepEqual(attentionStatusTags(d,p,d.units),[]);d.units[0].title='有修改';d.units[1].bankVersion='v2';d.units.push(unit('new','hidden'));
 assert.deepEqual(attentionStatusTags(d,p,d.units),['尚未更新到學生端','有修改未更新']);
 assert.deepEqual(attentionStatusTags(d,p,[d.units[2]]),[]);assert.deepEqual(attentionStatusTags(d,undefined,d.units),['尚未更新到學生端']);
});
