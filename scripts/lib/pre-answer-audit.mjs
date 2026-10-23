import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {renderApply} from '../../materials-src/apply-kit/render.mjs';
import {compileApplyStudentScript} from '../../materials-src/apply-kit/scripted-compile.mjs';
import {unwrap} from '../../materials-src/apply-kit/model.mjs';
import {compileStudentScript} from '../../materials-src/apply-kit/student-script.mjs';
import {performScriptedStep,beginScripted,auditApplyScript} from './apply-script-browser.mjs';
import {placeScriptCards,finishScriptMicro,auditScriptText} from './acidbase-script-browser.mjs';

// Candidate text, the question, region names and a deliberately opened hint are not
// revealed solutions. Answer prose, paired relationships, completed markings and
// nonzero prefilled answers are checked separately from those necessary surfaces.
export async function auditPreAnswerPage(page,{script,node,step,acid=false,priorLearningIds=[]}) {
 return page.evaluate(({units,node,step,acid,priorLearningIds})=>{
  const errors=[],visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
  for(const el of document.querySelectorAll('[data-copy]')){
   if(!visible(el)||el.closest('.hint-box'))continue;
   const id=el.dataset.copy,text=units[id]?.text||el.textContent;
   if(priorLearningIds.includes(id))continue;
   const answerProse=/\.(success|error|feedback|extra)(\.|$)/.test(id)||/^(success|error|feedback)\./.test(id);
   const inQuestion=el.closest('h1,h2')&&(id===node.title||id===node.question||id===node.micro?.stem||id===step?.question||(acid&&node.actions?.some(a=>a.text===id)));
   const instruction=!inQuestion&&(id===step?.instruction || /\.action\.\d+\.text$/.test(id)||/\.action\d+\.text$/.test(id));
   const neutralInstruction=/^(請先|點卡|按〔|打開.+開關，觀察)/.test(text)&&!/[→＝]/.test(text);
   if(answerProse||(instruction&&!neutralInstruction))errors.push({kind:'answer-before-response',id,text});
  }
  for(const el of document.querySelectorAll('.spatial-stamp,.script-feedback,.slider-result,.script-extra'))if(visible(el)&&el.textContent.trim()&&!(el.querySelector('[data-copy]')&&[...el.querySelectorAll('[data-copy]')].every(e=>priorLearningIds.includes(e.dataset.copy))))errors.push({kind:'revealed-before-response',text:el.textContent});
  for(const el of document.querySelectorAll('input[type=range]'))if(visible(el)&&Number(el.value)!==Number(el.min||0))errors.push({kind:'prefilled-value',value:el.value});
  if(document.querySelector('[data-spatial-stamp],.placed,.match-correct'))errors.push({kind:'prefilled-placement'});
  return errors;
 },{units:script.units,node,step,acid,priorLearningIds});
}
export async function auditNoBareCopyRows(page) {
 return page.evaluate(()=>[...document.querySelectorAll('.response-region div,.spatial-workspace div')].filter(e=>!e.className&&!e.id&&e.children.length>1&&[...e.children].every(c=>c.matches('span[data-copy]'))&&e.getBoundingClientRect().height>0).map(e=>({kind:'unstyled-copy-list',text:e.textContent})));
}
export async function auditTargetGeometry(page) {
 const first=await page.evaluate(()=>{
  const errors=[],targets=[...document.querySelectorAll('[data-spatial-target],.diagram-hotspot')].filter(e=>e.getBoundingClientRect().width>0);
  for(const [i,e]of targets.entries()){
   const a=e.getBoundingClientRect();if(a.width<44||a.height<44)errors.push({kind:'target-under-44',i});
   for(const [j,f]of targets.entries())if(j>i){const b=f.getBoundingClientRect(),distance=Math.hypot((a.x+a.width/2)-(b.x+b.width/2),(a.y+a.height/2)-(b.y+b.height/2));if(distance<44-.1)errors.push({kind:'target-centres-overlap',i,j,distance});}
  }
  return errors;
 });
 const targets=page.locator('[data-spatial-target],.diagram-hotspot');
 for(let i=0;i<await targets.count();i++){
  const target=targets.nth(i);if(!await target.isVisible())continue;
  const nav=page.locator(`[data-spatial-view="${i}"]`);
  if(await nav.count())await nav.click();else await target.scrollIntoViewIfNeeded();
  const valid=await target.evaluate(el=>{const a=el.getBoundingClientRect(),frame=el.closest('[data-spatial-scroll]')?.getBoundingClientRect()||{left:0,top:0,right:innerWidth,bottom:innerHeight};return a.left>=Math.max(0,frame.left)-1&&a.top>=Math.max(0,frame.top)-1&&a.right<=Math.min(innerWidth,frame.right)+1&&a.bottom<=Math.min(innerHeight,frame.bottom)+1;});
  if(!valid)first.push({kind:'target-unreachable-or-clipped',i});
 }
 return first;
}
export async function checkPreAnswerContent(data,{baseDir,html,sizes=[[390,844]],out}={}) {
 const acid=path.basename(baseDir)==='acid-base-homeostasis',script=acid?compileStudentScript(baseDir):compileApplyStudentScript(baseDir);
 const browser=await chromium.launch(),cases=[],errors=[];
 const input=html||renderApply(data,{baseDir,view:'course'});
 try{for(const [width,height]of sizes){
  const p=await browser.newPage({viewport:{width,height}});p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push({kind:'page-error',error:e.message}));await p.setContent(input);await p.locator('#start').click();
  async function inspect(n,j){
   const found=await auditPreAnswerPage(p,{script,node:script.nodes[n],step:script.nodes[n].steps?.[j],acid,priorLearningIds:acid&&n===5&&j===1?['n6.success']:[]});const copy=acid?await auditScriptText(p,script,data):await auditApplyScript(p,script,unwrap(data).learning.questions);found.push(...copy.errors,...await auditTargetGeometry(p),...await auditNoBareCopyRows(p));
   const record={node:n+1,step:j+1,width,height,errors:found,pass:!found.length};cases.push(record);if(found.length)errors.push(...found.map(e=>({...e,node:n+1,step:j+1,width,height})));
   if(out&&[390,1280].includes(width)){fs.mkdirSync(path.join(out,'shots'),{recursive:true});await p.screenshot({path:path.join(out,'shots',`${width}x${height}-N${n+1}-S${j+1}-before.png`)});}
  }
  for(let n=0;n<6;n++){
   if(acid){
    await inspect(n,0);if(n<3)await placeScriptCards(p,n);
    if(n===0){await inspect(n,1);await p.locator('[data-answer="1"]').click();}
    if(n===1){await p.locator('#next-action').click();await inspect(n,1);await p.locator('[data-answer="0"]').click();}
    if(n===3){await p.locator('#breathe').click();await inspect(n,1);await p.locator('[data-answer="0"]').click();}
    if(n===4){await p.locator('[data-arrow="0"]').click();await p.locator('[data-arrow="1"]').click();await p.locator('#submit-arrow').click();}
    if(n===5){await p.locator('[data-answer="0"]').click();await inspect(n,1);await p.locator('[data-answer="0"]').click();}
    errors.push(...await auditNoBareCopyRows(p));if(n!==4)await inspect(n,99);await finishScriptMicro(p,script,n);
   }
   else{await beginScripted(p);for(let j=0;j<script.nodes[n].steps.length;j++){await inspect(n,j);await performScriptedStep(p,script.nodes[n].steps[j]);errors.push(...await auditNoBareCopyRows(p));await p.locator('#next-step').click();}const micro=script.nodes[n].micro;if(micro){await inspect(n,99);await p.locator(`[data-micro="${micro.answer}"]`).click();await p.locator('#micro-submit').click();}}
   if(n<5)await p.locator('#next-node').click();
  }
  await p.close();
 }}finally{await browser.close();}
 const result={pass:!errors.length,cases,errors};if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'pre-answer.json'),JSON.stringify(result,null,2)+'\n');}return result;
}
