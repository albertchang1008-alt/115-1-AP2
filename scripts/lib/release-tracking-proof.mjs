import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validEvent,reduceLearning,emptyLearning} from '../../shared/learning.ts';
// Capture the real SDK queue locally. No network writes or student records.
export async function installReadOnlyTracking(page){
 const sdk=fs.readFileSync(new URL('../../public/materials/course-learning.js',import.meta.url),'utf8');
 const needle='pending.push({ id: crypto.randomUUID(), ...event }); flush();';
 assert.equal(sdk.split(needle).length,2,'SDK capture point changed');
 const instrumented='window.releaseEvents=[];\n'+sdk.replace(needle,
  'const captured={ id: crypto.randomUUID(), ...event }; window.releaseEvents.push(captured); pending.push(captured); flush();');
 await page.route('**/course-learning.js',route=>route.fulfill({contentType:'application/javascript',body:instrumented}));
}
export function validateCapturedEvents(events,questionIds){
 assert(events?.length,'正式 HTML 沒有載入 SDK 或沒有送事件');
 for(const event of events)assert(validEvent(event),'後端拒絕教材事件：'+JSON.stringify(event));
 assert.equal(events.filter(e=>e.type==='completed').length,1,'通關必須且只發送一次 completed');
 assert.equal(new Set(events.filter(e=>e.type==='explore').map(e=>e.nodeId)).size,6,'六節點須發送 explore');
 assert(events.some(e=>e.type==='answer'&&e.correct===false),'必須實際答錯');
 assert(events.some(e=>e.type==='answer'&&e.correct===true),'必須實際答對');
 for(const event of events.filter(e=>e.type==='answer'))assert(questionIds.has(event.questionId),'診斷分母漏掉作答ID：'+event.questionId);
 let summary=emptyLearning();
 for(let i=0;i<events.length;i+=30)summary=reduceLearning(summary,events.slice(i,i+30));
 assert.equal(summary.completed,true);
 return events;
}
export async function verifyReadOnlyTracking(page){
 const events=await page.evaluate(()=>window.releaseEvents);
 const known=await page.locator('meta[name="material-assessment-ids"]').getAttribute('content');
 assert(known,'缺少診斷題目ID清單');
 return validateCapturedEvents(events,new Set(known.split(',')));
}
