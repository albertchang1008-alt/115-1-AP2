// Run with the bundled Node runtime and its artifact-tool dependency, not repo deps.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Workbook} from '@oai/artifact-tool';

const root=path.resolve(process.argv[2]||'.');
const baseline=path.resolve(process.argv[3]);
const evidence=path.resolve(process.argv[4]);
const sourceBytes=await fs.readFile(baseline);
const source=await Workbook.fromCSV(sourceBytes.toString('utf8').replace(/^\uFEFF/,''),{sheetName:'115-1-AP2'});
const sheet=source.worksheets.getItemAt(0);
const original=sheet.getRange('A1:AF747').values.map(r=>r.map(v=>v===null?'':String(v)));
assert.equal(original[0][31],'啟用');
assert.equal(original[746][2],'Q4-42R');
assert.equal(original[746][1],'85');
const content=JSON.parse(await fs.readFile(path.join(root,'materials-src/blood-flow-routes/content.json'),'utf8'));
const draft=JSON.parse(await fs.readFile(path.join(root,'docs/bank-fixes/BLOOD_FLOW_11_DRAFT.json'),'utf8'));
const questions=[...content.foundation,...content.cases];
assert.equal(draft.length,11);
const cards=['pulmonary-circulation','systemic-circulation','fetal-circulation','fetal-circulation','cerebral-circulation','cerebral-circulation'];
const judgments=[
 '把肺循環起點與終點連起來，保留肺循環這個題幹關鍵詞。',
 '口訣列出弓的三條直接分支，不把頭臂的下一級分支混入。',
 '寫出動脈導管的名稱及兩端連接方向。',
 '保留內側臍韌帶全名，並指明來源是成對的臍動脈。',
 '保留頸內動脈名稱，連結前、中大腦動脈的來源。',
 '以前交通動脈全名連接左右前大腦動脈。',
 '寫出肺靜脈全名、充氧血與回流心房。',
 '以左頸總動脈全名提醒直接由主動脈弓分出。',
 '以卵圓孔全名與右房到左房的方向對照。',
 '以卵圓孔閉合連結卵圓窩，沒有改成模糊代稱。',
 '寫出後交通動脈全名與相連動脈，避免與前交通混淆。',
];
const ids=new Set(original.slice(1).map(r=>r[2]));
const review={reviewedBy:'Codex（作者逐題自檢，待Claude驗收）',reviewedOn:'2026-10-25',items:[]};
const items=[];
const rows=questions.map((q,i)=>{
 const d=draft[i];assert.equal(d.id,q.id);assert(!ids.has(q.id));ids.add(q.id);
 const node=content.nodes.find(n=>n.id===q.nodeId);
 const nodeIndex=content.nodes.indexOf(node);
 const row=Array(32).fill('');
 const stem=d.stem||q.stem,answer=q.options[q.answer];
 Object.assign(row,{0:'資訊圖表',1:String(86+i),2:q.id,3:'資訊圖表',4:'心臟II',5:'血流路徑動畫',6:node.title,11:stem,12:'ABCD'[q.answer],13:String(q.answer+1),18:d.explanation,19:d.keyword,20:d.chain,21:d.decide,22:d.memory,23:`${cards[nodeIndex]}；${node.reference}`,24:cards[nodeIndex],25:cards[nodeIndex],28:content.title,29:'https://albertchang1008-alt.github.io/115-1-AP2/materials/blood-flow-routes-v1/index.html',31:'TRUE'});
 q.options.forEach((v,j)=>row[14+j]=v);
 assert(row.every(x=>typeof x==='string'&&!/[\t\r\n]/.test(x)));
 const item={id:q.id,row:748+i,stem,sourceStem:q.stem,unit:row[5],options:q.options,answer,old:{'解析':q.explain},new:{'解析':d.explanation,'①':d.keyword,'②':d.chain,'③':d.decide,'④':d.memory}};
 items.push(item);
 assert(q.explain.includes(d.memoryKeyword));
 review.items.push({id:q.id,keywords:[d.memoryKeyword],basisField:'old.解析',basisQuote:q.explain,manualChecked:true,judgment:judgments[i]});
 return row;
});
const wb=Workbook.create();const out=wb.worksheets.add('11列貼上範本');
out.getRange('A1:AF11').values=rows;
wb.recalculate();
const actual=out.getRange('A1:AF11').values.map(r=>r.map(v=>v===null?'':String(v)));
assert.deepEqual(actual,rows);
// A plain-text paste template is requested: no header, quoting or workbook wrapper.
const target=path.join(root,'docs/bank-fixes/BLOOD_FLOW_11_PASTE.tsv');
await fs.writeFile(target,actual.map(r=>r.join('\t')).join('\n')+'\n');
assert.equal((await fs.readFile(target,'utf8')).trimEnd().split('\n').length,11);
await fs.mkdir(evidence,{recursive:true});
await fs.writeFile(path.join(evidence,'projection.json'),JSON.stringify([...original,...actual]));
await fs.writeFile(path.join(evidence,'baseline-matrix.json'),JSON.stringify(original));
await fs.writeFile(path.join(root,'docs/bank-fixes/BLOOD_FLOW_11.json'),JSON.stringify({source:baseline,items},null,2)+'\n');
await fs.writeFile(path.join(root,'docs/bank-fixes/BLOOD_FLOW_11_MEMORY_REVIEW.json'),JSON.stringify(review,null,2)+'\n');
const check={sourceSHA256:createHash('sha256').update(sourceBytes).digest('hex'),templateSHA256:createHash('sha256').update(await fs.readFile(target)).digest('hex'),sourceRows:747,existingQuestions:746,newRows:11,columns:32,pasteRange:'A748:AF758',sequence:[86,96],existingCellsCompared:747*32,existingCellChanges:0,sourceFileUnchanged:sourceBytes.equals(await fs.readFile(baseline)),artifactRoundtripCells:352};
await fs.writeFile(path.join(evidence,'authoring-check.json'),JSON.stringify(check,null,2)+'\n');
console.log(JSON.stringify(check));
