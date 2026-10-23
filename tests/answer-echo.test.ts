import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {normalizeEcho,longestEcho,scanQuestion,auditEcho,echoFingerprint,loadEchoQuestions} from '../scripts/answer-echo-check.mjs';
const base={id:'probe',stem:'甲乙，丙丁 戊己',options:['甲乙丙丁戊己','甲乙丙丁戊','另一個意思','沒有重複'],answer:0};
test('對字掃描：忽略標點空白，NFKC化學符號與英文字母大小寫一致',()=>{
 assert.equal(normalizeEcho(' HCO₃⁻， pH '),normalizeEcho('hco3⁻ph'));
 assert.deepEqual(longestEcho(base.stem,base.options[0]),{length:6,text:'甲乙丙丁戊己'});
});
test('對字掃描：6字正解獨有會FAIL，5字及同長誘答不誤判成長字串提示',()=>{
 assert.equal(auditEcho([{scope:'fixture',q:base}]).pass,false);
 assert.equal(scanQuestion({...base,stem:'甲乙丙丁戊'},{keywords:[]}).findings.length,0);
 assert.equal(scanQuestion({...base,options:[...base.options.slice(0,1),'甲乙丙丁戊己',...base.options.slice(2)]},{keywords:[]}).findings.length,0);
});
test('對字掃描：只有正解重複關鍵詞，即使少於6字也另列；誘答有同詞即不列',()=>{
 const q={id:'keyword',stem:'腎臟有什麼作用？',options:['腎臟的功能','心臟的功能','肝臟的功能','胃的功能'],answer:0};
 assert(scanQuestion(q).findings.some(f=>f.rule==='keyword-exclusive'&&f.keywords?.includes('腎臟')));
 assert(!scanQuestion({...q,options:['腎臟的功能','腎臟的另一種功能','肝臟的功能','胃的功能']}).findings.some(f=>f.rule==='keyword-exclusive'));
});
test('對字掃描：逐題理由只接受精確內容雜湊，額外改字或挪答案會恢復FAIL',()=>{
 const allow={key:'fixture:probe',sha256:echoFingerprint(base),rules:['longest-exclusive'],reason:'測試用明確理由'};
 assert.equal(auditEcho([{scope:'fixture',q:base}],[allow]).pass,true);
 assert.equal(auditEcho([{scope:'fixture',q:{...base,stem:base.stem+'新增字'}}],[allow]).pass,false);
 const moved={...base,options:[base.options[1],base.options[0],...base.options.slice(2)],answer:1};
 assert.equal(auditEcho([{scope:'fixture',q:moved}],[allow]).pass,false);
 assert.equal(auditEcho([{scope:'different',q:base}],[allow]).pass,false);
 assert.equal(auditEcho([{scope:'fixture',q:base}],[{...allow,reason:''}]).pass,false);
});
test('126題完整掃描沒有未處理命中；兩題放行不是一般規則豁免',()=>{
 const reviews=JSON.parse(fs.readFileSync('docs/urinary-release/answer-echo-fix/allowances.json','utf8'));
 const r=auditEcho(loadEchoQuestions(),reviews);assert.equal(r.questions,126);assert.equal(r.pass,true);assert.equal(r.unresolved,0);assert.equal(r.allowed,2);
});
test('R/S四題僅保留四種名稱，正解位置與配對維持前版',()=>{
 const data=JSON.parse(fs.readFileSync('materials-src/acid-base-homeostasis/full.json','utf8'));
 const before=JSON.parse(fs.readFileSync('docs/urinary-release/answer-echo-fix/changes.json','utf8')).fullBefore;
 for(const q of data.pool.filter((q:{id:string})=>['R-A','R-B','S-A','S-B'].includes(q.id))){
  assert.deepEqual([...q.options].sort(),['呼吸性酸中毒','呼吸性鹼中毒','代謝性酸中毒','代謝性鹼中毒'].sort());
  const b=before.pool.find((x:{id:string})=>x.id===q.id);assert.deepEqual([q.id,q.group,q.side,q.node,q.answer],[b.id,b.group,b.side,b.node,b.answer]);
 }
});
test('獨立CLI負例真的以非0退出，不能把掃到的提示當成PASS',()=>{
 const result=spawnSync(process.execPath,['scripts/answer-echo-check.mjs','--negative-probe'],{encoding:'utf8'});
 assert.equal(result.status,1);assert.match(result.stdout,/"pass":false/);assert.match(result.stdout,/longest-exclusive/);
});
