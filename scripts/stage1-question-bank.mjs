// Run a temporary copy with the bundled Artifact Tool runtime; preserve old OOXML.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';

const [root,temp,python]=process.argv.slice(2);
assert(root&&temp&&python,'Arguments: repository temporary-dir bundled-python');
const baseline=path.join(temp,'baseline.xlsx');
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(baseline));
const sheet=wb.worksheets.getItem('題庫'),notes=wb.worksheets.getItem('說明');
const oldRows=sheet.getRange('A2:X162').values,usedIds=new Set(oldRows.map(r=>r[1]));
assert.equal(oldRows.length,161);assert.equal(usedIds.size,161);
const slugs=['cardiac-output','blood-pressure-measurement','capillary-exchange','major-vessels','blood-types','lymphoid-organs'];
const rows=[],expected=[],sources=[];
for(const [index,slug] of slugs.entries()) {
 const html=await fs.readFile(`${root}/public/materials/${slug}-v1/index.html`,'utf8');
 const c=JSON.parse(await fs.readFile(`${root}/materials-src/${slug}/content.json`,'utf8'));
 assert(html.includes('\nmount('+JSON.stringify(c).replace(/</g,'\\u003c')+','));
 const chapter=index<4?'心臟II':index===4?'血液':'淋巴系統';
 const url=`https://albertchang1008-alt.github.io/115-1-AP2/materials/${slug}-v1/index.html`;
 sources.push([c.title,`11 題｜${url}；單元：${chapter}；6 先備＋5 情境`]);
 for(const [i,q] of [...c.foundation,...c.cases].entries()) {
  assert(!usedIds.has(q.id),q.id);usedIds.add(q.id);
  assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
  const node=c.nodes.find(n=>n.id===q.nodeId),correct=q.options[q.answer],code='ABCD'[q.answer];
  assert(node&&q.hint&&q.explain);
  rows.push([null,q.id,chapter,c.title,i+1,'TRUE','單選',q.stem,...q.options,code,q.answer+1,q.explain,`「${node.title}」：${q.hint}`,`${q.hint} → 回到「${node.title}」比較：${node.summary}`,`選擇「${correct}」。${q.explain}`,q.explain,null,null,c.title,url,null]);
  expected.push({slug,chapter,title:c.title,id:q.id,sequence:i+1,stem:q.stem,options:q.options,correct,code,zuvio:q.answer+1,url});
 }
}
assert.equal(rows.length,66);
for(let i=0;i<66;i++)sheet.getRange(`A${163+i}:X${163+i}`).copyFrom(sheet.getRange('A162:X162'),'all');
sheet.getRange('A163:X228').values=rows;
sheet.getRange('A163:X228').format.autofitRows();
notes.getRange('B23').values=[['227 題']];
for(let i=0;i<6;i++)notes.getRange(`A${29+i}:B${29+i}`).copyFrom(notes.getRange('A28:B28'),'all');
notes.getRange('A29:B34').values=sources;
notes.getRange('A29:B34').format.autofitRows();
wb.recalculate();assert.deepEqual(sheet.getRange('A2:X162').values,oldRows);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:10},maxChars:1000})).ndjson);
await fs.writeFile(`${temp}/expected.json`,JSON.stringify(expected,null,2));
await(await SpreadsheetFile.exportXlsx(wb)).save(`${temp}/authored.xlsx`);
const dest=`${root}/html/資訊圖表題庫_上傳用.xlsx`;
const preserved=spawnSync(python,[`${root}/scripts/stage1-question-bank-preserve.py`,baseline,`${temp}/authored.xlsx`,dest,`${temp}/expected.json`,`${root}/docs/STAGE1_QUESTION_BANK_VERIFY.json`],{encoding:'utf8'});
assert.equal(preserved.status,0,preserved.stdout+preserved.stderr);console.log(preserved.stdout);
const final=await SpreadsheetFile.importXlsx(await FileBlob.load(dest));
assert.deepEqual(final.worksheets.getItem('題庫').getRange('A2:X162').values,oldRows);
assert.deepEqual(final.worksheets.getItem('題庫').getRange('A163:X228').values,rows);
for(const [sheetName,range,name] of [['題庫','H163:N164','new-questions'],['題庫','O173:S173','new-guides'],['題庫','C217:G219','lymphoid-chapter'],['說明','A29:B34','sources']]) {
 const image=await final.render({sheetName,range,scale:1,format:'png'});
 await fs.writeFile(`${temp}/${name}.png`,new Uint8Array(await image.arrayBuffer()));
}
console.log('66 appended, 161 preserved, 227 total.');
