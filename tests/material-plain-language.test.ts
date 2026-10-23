import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {questionBaseline} from '../scripts/lib/urinary-question-baseline.mjs';
import {validateApprovedQuestionChanges} from '../scripts/apply-script-question-rewrites.mjs';

test('白話核可清單只接受110題的完整內容，額外修改選項／正解／解析皆拒絕',()=>{
 const slugs=['kidney-anatomy','nephron-circulation','filtration-clearance','tubular-handling','urine-concentration','urinary-route-micturition','fluid-compartments','water-sodium-regulation','electrolyte-balance','acid-base-homeostasis'];
 let count=0;
 for(const slug of slugs){
  const baseline=questionBaseline(slug);
  const source=JSON.parse(fs.readFileSync(`materials-src/${slug}/apply.json`,'utf8'));
  for(const kind of ['foundation','cases'] as const){
   const after=source.learning.questions[kind].map((w:{value:Record<string,unknown>})=>w.value);
   assert(validateApprovedQuestionChanges(baseline[kind],after));count+=after.length;
   for(const field of ['stem','explain','answer','options']){
    const changed=structuredClone(after);
    if(field==='answer')changed[0].answer=(Number(changed[0].answer)+1)%4;
    else if(field==='options')changed[0].options[0]+='未核可';
    else changed[0][field]+='未核可';
    assert.equal(validateApprovedQuestionChanges(baseline[kind],changed),false,slug+field);
   }
  }
 }
 assert.equal(count,110);
});
test('110題解析與①③④引用內容且不綁字母，提示移除舊誘答與非必要定義',()=>{
 const p=JSON.parse(fs.readFileSync('docs/urinary-release/plain-language-110/proposal.json','utf8'));
 for(const q of p.questions){
  const a=q.after;
  for(const key of ['explain','hint','decide','memory'])assert(!/(?<![A-Za-z0-9])[A-D](?![A-Za-z0-9])/.test(a[key].replaceAll('維生素D','維生素Ｄ')),q.id+key);
  assert(a.decide.includes('「'+a.options[q.answerIndex]+'」'));
  if(['wc3','wf4','wc4'].includes(q.code))assert(!/水通透性|叫做酵素/.test(a.stem));
  if(q.code==='uf5'){assert(!JSON.stringify(a).includes('V1'));assert.equal(a.options[2],'用V2受器，增加鈉通道，讓鈉更容易通過');}
  if(q.code==='ef4'){assert(!a.hint.includes('連一點都沒有'));assert.equal(a.memory,'鈉在外，鉀在內');}
 }
});
