import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const echoSlugs='kidney-anatomy nephron-circulation filtration-clearance tubular-handling urine-concentration urinary-route-micturition fluid-compartments water-sodium-regulation electrolyte-balance acid-base-homeostasis'.split(' ');
// Explicit subject terms make the secondary heuristic inspectable; generic question words are excluded.
export const echoKeywords=`碳酸氫根 碳酸 氫離子 二氧化碳 血紅素 紅血球 銨離子 緩衝 呼吸 代謝 酸中毒 鹼中毒 pH HCO₃⁻ H₂CO₃ CO₂ NH₃ NH₄⁺ NaCl MgCl₂ Mg²⁺ Cl⁻ Na⁺ K⁺ PTH ADH RAAS ACE V2 GFR RPF FF PAH 鈉離子 鉀離子 氯離子 鎂離子 氯化鎂 氯化鈉 葡萄糖 酵素 神經肌肉 鈉通道 水通道 溶質 滲透 細胞內 細胞外 血漿 組織間液 蛋白質 白蛋白 副甲狀腺素 鈣 磷 鈉 鉀 水量 尿量 尿比重 密度 腎絲球過濾率 腎絲球 血管 靜水壓 腎血漿流量 腎血流量 腎錐體 腎乳頭 鮑氏囊 菊糖 肌酸酐 清除率 皮質 髓質 腎上腺 腎臟 腎柱 腎被膜 脂肪囊 腎筋膜 膀胱 紅血球生成 維生素D 腎小體 腎小管 腎元 近曲小管 遠曲小管 亨利氏環 近髓質 刷狀緣 近腎絲球器 近腎絲球細胞 緻密斑 入球小動脈 出球小動脈 管周微血管 直血管 腎素 過濾分率 分泌 再吸收 共同運輸 醛固酮 輸尿管 尿道 交叉 蠕動 尿道外括約肌 尿道內括約肌 括約肌 骨骼肌 逼尿肌 迫尿肌 膀胱三角 陰神經 下降枝 上升枝 逆流交換 逆流增強 集尿管 受器 抗利尿激素 代謝水 無知覺蒸散 口渴 血管收縮素 血管收縮`.split(/\s+/);
export function normalizeEcho(text){return String(text).normalize('NFKC').replace(/[\p{P}\p{Z}\s]/gu,'').toLowerCase();}
export function longestEcho(a,b){
 const x=[...normalizeEcho(a)],y=[...normalizeEcho(b)];let prior=new Array(y.length+1).fill(0),length=0,end=0;
 for(let i=0;i<x.length;i++){const row=new Array(y.length+1).fill(0);for(let j=0;j<y.length;j++)if(x[i]===y[j]){row[j+1]=prior[j]+1;if(row[j+1]>length){length=row[j+1];end=i+1;}}prior=row;}
 return {length,text:x.slice(end-length,end).join('')};
}
export const echoFingerprint=q=>createHash('sha256').update(JSON.stringify({stem:q.stem,options:q.options,answer:q.answer})).digest('hex');
export function scanQuestion(q,{keywords=echoKeywords}={}){
 if(q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)throw Error('Invalid four-choice question '+q.id);
 const matches=q.options.map(o=>longestEcho(q.stem,o)),correct=matches[q.answer],distractorMax=Math.max(...matches.filter((_,i)=>i!==q.answer).map(m=>m.length));
 const uniqueKeywords=[...new Set(keywords)].filter(k=>normalizeEcho(q.stem).includes(normalizeEcho(k))&&q.options.every((o,i)=>normalizeEcho(o).includes(normalizeEcho(k))===(i===q.answer)));
 const findings=[];
 if(correct.length>=6&&correct.length>distractorMax)findings.push({rule:'longest-exclusive',correct,distractorMax});
 if(uniqueKeywords.length)findings.push({rule:'keyword-exclusive',keywords:uniqueKeywords});
 return {id:q.id,sha256:echoFingerprint(q),stem:q.stem,options:q.options,answer:q.answer,matches,findings};
}
export function loadEchoQuestions(root=ROOT){
 const full=JSON.parse(fs.readFileSync(path.join(root,'materials-src/acid-base-homeostasis/full.json'))),qs=[...full.foundation,...full.pool].map(q=>({scope:'full',slug:'acid-base-homeostasis',q}));
 for(const slug of echoSlugs){const data=JSON.parse(fs.readFileSync(path.join(root,'materials-src',slug,'apply.json')));for(const stage of ['foundation','cases'])for(const w of data.learning.questions[stage])qs.push({scope:'bank',slug,stage,q:w.value||w});}
 if(qs.length!==126)throw Error('Expected 16 full + 110 bank questions');return qs;
}
export function auditEcho(questions,reviews=[]){
 const keys=new Set();for(const r of reviews){if(keys.has(r.key))throw Error('Duplicate review '+r.key);keys.add(r.key);}
 const rows=questions.map(({q,...meta})=>{
  const row={...meta,...scanQuestion(q)},review=reviews.find(r=>r.key===meta.scope+':'+q.id);
  row.disposition=row.findings.length?'FAIL':'PASS';
  if(row.findings.length&&review&&review.sha256===row.sha256&&review.reason?.trim()&&row.findings.every(f=>review.rules.includes(f.rule))){row.disposition='REVIEWED_ALLOW';row.reason=review.reason;}
  return row;
 });
 return {pass:rows.every(r=>r.disposition!=='FAIL'),questions:rows.length,flagged:rows.filter(r=>r.findings.length).length,allowed:rows.filter(r=>r.disposition==='REVIEWED_ALLOW').length,unresolved:rows.filter(r=>r.disposition==='FAIL').length,keywordVocabulary:echoKeywords,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2),get=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1]},out=get('--out'),reviewFile=get('--reviews')||path.join(ROOT,'docs/urinary-release/answer-echo-fix/allowances.json');
 const negative=args.includes('--negative-probe');
 const questions=negative?[{scope:'fixture',q:{id:'negative-answer-echo',stem:'氫離子增加讓血液變酸，原因是什麼？',options:['氫離子增加讓血液變酸','二氧化碳已經呼出','酸被帶到體外','接酸的幫手增加'],answer:0}}]:loadEchoQuestions();
 const result=auditEcho(questions,negative?[]:fs.existsSync(reviewFile)?JSON.parse(fs.readFileSync(reviewFile)):[]);
 if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify({pass:result.pass,questions:result.questions,flagged:result.flagged,allowed:result.allowed,unresolved:result.unresolved}));
 for(const r of result.rows.filter(r=>r.findings.length))console.log(JSON.stringify({scope:r.scope,id:r.id,disposition:r.disposition,findings:r.findings}));
 if(!result.pass)process.exitCode=1;
}
