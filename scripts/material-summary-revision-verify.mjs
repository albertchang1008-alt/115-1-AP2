import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {palette,studentPaletteGroups} from '../materials-src/kit/presentation.mjs';
const root=path.resolve(import.meta.dirname,'..'),base='39f33b8',read=p=>fs.readFileSync(path.join(root,p),'utf8'),old=p=>execFileSync('git',['show',`${base}:${p}`],{cwd:root});
const kits=fs.readdirSync(root+'/materials-src').filter(s=>fs.existsSync(root+`/materials-src/${s}/content.json`));
const manual=JSON.parse(read('materials-src/manual-presentation-targets.json')),targets=[...kits.map(s=>s+'-v1'),...manual];
const report={base,materials:[],preservation:{},palette:{},draftMarkers:[]};
for(const slug of kits){
 const p=`materials-src/${slug}/content.json`,now=JSON.parse(read(p)),before=JSON.parse(old(p));
 for(const key of ['foundation','cases'])assert.deepEqual(now[key],before[key],slug+' '+key);
 assert.deepEqual(now.lab.predict,before.lab.predict,slug+' prediction');
 assert.deepEqual(now.nodes.map(n=>n.id),before.nodes.map(n=>n.id),slug+' node IDs');
}
for(const id of manual){
 const p=`public/materials/${id}/index.html`,scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(m=>m[0]);
 assert.deepEqual(scripts(read(p)),scripts(old(p).toString()),id+' scripts/quiz unchanged');
}
const xlsx='html/資訊圖表題庫_上傳用.xlsx',bytes=fs.readFileSync(root+'/'+xlsx);assert(bytes.equals(old(xlsx)),'Excel bit identical');
report.preservation={kitQuestionArraysUnchanged:kits.length,manualScriptsUnchanged:manual.length,nodeIdsUnchanged:true,excelBitIdentical:true,excelSHA256:createHash('sha256').update(bytes).digest('hex')};
function scan(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())scan(p);else {const s=fs.readFileSync(p).toString();if(/⚠️|請教師|教師決定|待教師/.test(s))report.draftMarkers.push(path.relative(root,p));}}}
scan(root+'/materials-src');scan(root+'/public/materials');assert.deepEqual(report.draftMarkers,[]);
const hue=id=>Number(palette(id).accent.match(/hsl\((\d+)/)[1]),distance=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
const active=[...new Set(Object.values(studentPaletteGroups).flat())];
report.palette.studentMaterialCount=active.length;report.palette.global25DegreeFeasible=active.length<=14;
report.palette.groups=Object.fromEntries(Object.entries(studentPaletteGroups).map(([group,ids])=>{
 const pairs=ids.flatMap((a,i)=>ids.slice(i+1).map(b=>({a,b,degrees:distance(hue(a),hue(b))})));assert(pairs.every(p=>p.degrees>=25),group);
 return [group,{materials:ids.map(id=>({id,hue:hue(id)})),minimumDegrees:Math.min(...pairs.map(p=>p.degrees))}];
}));
report.palette.highlightedPairs=[['cardiac-conduction-v2','cardiac-electrical-v1'],['circulation-routes-v1','blood-gas-transport-v2'],['heart-structure-v2','coronary-circulation-v1']].map(([a,b])=>({a,b,degrees:distance(hue(a),hue(b))}));assert(report.palette.highlightedPairs.every(p=>p.degrees>=25));
report.palette.crossUnitPairsBelow25=active.flatMap((a,i)=>active.slice(i+1).filter(b=>distance(hue(a),hue(b))<25).map(b=>({a,b,degrees:distance(hue(a),hue(b))})));
const key=s=>s.replace(/[\s，、：:（）()「」『』]/g,''),clauses=s=>s.split(/[。；;\n]+/).map(key).filter(s=>s&&s!=='—');
const browser=await chromium.launch({channel:'chrome'});
try{for(const id of targets)for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/course-learning.js',r=>r.fulfill({contentType:'application/javascript',body:'window.CourseLearning={explore(){},nodeTime(){},answer(){},hint(){},complete(){}}'}));
 await page.goto('file://'+root+`/public/materials/${id}/index.html`);
 const rows=await page.locator('.learning-summary tbody tr').evaluateAll(rs=>rs.map(r=>[...r.querySelectorAll('th,td')].map(c=>c.textContent.trim())));
 assert(rows.length>=4,id);
 const duplicates=[];
 rows.forEach((row,i)=>{const seen=[];row.slice(1).forEach(cell=>{for(const sentence of clauses(cell)){if(seen.some(s=>s===sentence || (s.length>=6 && sentence.length>=6 && (s.includes(sentence)||sentence.includes(s)))))duplicates.push({row:i+1,sentence});seen.push(sentence);}})});
 assert.deepEqual(duplicates,[],id+' duplicate clauses');
 if(id==='blood-types-v1'){
  const abo=rows.find(r=>r[0]==='ABO 系統').join('；');for(const type of ['A 型：','B 型：','AB 型：','O 型：'])assert(abo.includes(type),type+' missing');
 }
 const geometry=await page.locator('.learning-summary').evaluate(el=>({font:parseFloat(getComputedStyle(el.querySelector('td')).fontSize),width:el.getBoundingClientRect().width,tableWidth:el.querySelector('table').getBoundingClientRect().width}));
 assert(geometry.font>=16);assert(geometry.tableWidth<=geometry.width);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 if(['blood-types-v1','capillary-exchange-v1','major-vessels-v1'].includes(id)){
  const dir=root+'/docs/summary-revision-screenshots';fs.mkdirSync(dir,{recursive:true});await page.locator('.learning-summary').screenshot({path:`${dir}/${id}-${width}.png`});
 }
 report.materials.push({id,viewportWidth:width,rowCount:rows.length,duplicateClauses:duplicates,...geometry,noOverflow:true,errors,rows});await page.close();
}}finally{await browser.close();}
fs.writeFileSync(root+'/docs/SUMMARY_REVISION_VERIFY.json',JSON.stringify(report,null,2)+'\n');
console.log(`Passed ${targets.length} summary tables / ${report.materials.length} viewport scenarios; draft markers=0; questions/IDs/Excel unchanged.`);
console.log(JSON.stringify(report.palette,null,2));
