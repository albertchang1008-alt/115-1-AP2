import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {type LearningEvent,validEvent,reduceLearning,emptyLearning} from '../shared/learning';
import {approvedUrinarySlugs,approvedUrinaryDocument} from '../scripts/urinary-release-build.mjs';
import {checkApplyScript} from '../scripts/lib/apply-script-check.mjs';
import {checkScriptLayout} from '../scripts/lib/acidbase-script-layout.mjs';
import {validateCapturedEvents} from '../scripts/lib/release-tracking-proof.mjs';

test('含點的酸鹼事件負例會被後端及全流程驗證拒絕',()=>{
 const invalid={id:'negative-event',type:'answer' as const,questionId:'n1.micro',correct:false};
 assert.equal(validEvent(invalid),false);
 assert.throws(()=>reduceLearning(emptyLearning(),[invalid]),/教材事件格式無效/);
 assert.throws(()=>validateCapturedEvents([invalid],new Set(['n1.micro'])),/後端拒絕教材事件/);
 assert.equal(validEvent({...invalid,questionId:'n1-micro'}),true);
});
test('十份正式 HTML：答錯、整步與整關重來、結尾重來、通關事件逐筆符合 validEvent', {timeout:1800000,concurrency:3}, async(t)=>{
 await Promise.all(approvedUrinarySlugs.map(slug=>t.test(slug,async()=>{
  const d=approvedUrinaryDocument(slug),html=path.resolve('public/materials',d.version,'index.html');
  assert.equal(fs.readFileSync(html,'utf8'),d.html);
  const out=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'urinary-events-')),slug);
  const file=path.resolve('materials-src',slug,slug==='acid-base-homeostasis'?'full.json':'apply.json');
  const opts={html,out,sizes:[[390,844],[1280,800]],shots:false};
  const result=slug==='acid-base-homeostasis'?await checkScriptLayout(JSON.parse(fs.readFileSync(file,'utf8')),{...opts,file}):await checkApplyScript(file,opts);
  const summary='summary' in result?result.summary:result;
  assert.equal(summary.fail,0,slug);if('diff' in result&&result.diff)assert.equal(result.diff.pass,true);
  const reports=opts.sizes.map(([w,h])=>{
   const events:LearningEvent[]=JSON.parse(fs.readFileSync(path.join(out,`tracking-${w}x${h}.json`),'utf8'));
   assert(events.every(validEvent));
   return {size:[w,h],events:events.length,types:[...new Set(events.map(e=>e.type))],completed:events.filter(e=>e.type==='completed').length,invalid:events.filter(e=>!validEvent(e))};
  });
  console.log('EVENT_CONTRACT '+JSON.stringify({slug,pass:true,reports}));
 })));
});
