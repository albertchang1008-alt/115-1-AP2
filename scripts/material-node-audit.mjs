// Audit the actual 21 student editions, including static and hand-authored formats.
import fs from 'node:fs';import path from 'node:path';import {chromium} from 'playwright';
import {validateNodeText,validateMaterialContent} from '../shared/materialKit.ts';
import {studentPaletteGroups} from '../materials-src/kit/presentation.mjs';
import {approvedUrinarySlugs,approvedUrinaryDocument} from './urinary-release-build.mjs';
const root=path.resolve(import.meta.dirname,'..');export const targets=[...new Set(Object.values(studentPaletteGroups).flat())];
const browser=await chromium.launch({channel:'chrome'}),results=[];
try{for(const slug of targets){const page=await browser.newPage();await page.route('**/course-learning.js',r=>r.fulfill({body:'window.CourseLearning={explore(){},nodeTime(){},answer(){},hint(){},complete(){}}'}));await page.goto('file://'+root+`/public/materials/${slug}/index.html`);let nodes,format;
const html=fs.readFileSync(root+`/public/materials/${slug}/index.html`,'utf8');
if(html.includes('\nmount(')){// The built payload is a JSON object; parse balanced braces without evaluating scripts.
const start=html.lastIndexOf('\nmount(')+7;let depth=0,quoted=false,escaped=false,end=start;for(;end<html.length;end++){const ch=html[end];if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;}else if(ch==='"')quoted=true;else if(ch==='{')depth++;else if(ch==='}'&&--depth===0){end++;break;}}
const content=JSON.parse(html.slice(start,end));validateMaterialContent(content);nodes=content.nodes;format='kit';
}else if(slug==='cardiac-electrical-v1'){const start=html.indexOf('const N=')+8;let depth=0,quoted=false,escaped=false,end=start;for(;end<html.length;end++){const ch=html[end];if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;}else if(ch==='"')quoted=true;else if(ch==='[')depth++;else if(ch===']'&&--depth===0){end++;break;}}nodes=JSON.parse(html.slice(start,end)).map((n,i)=>({id:`node-${i+1}`,concept:n.concept,points:n.f.map(([label,text])=>`${label}：${text}`),clinical:{text:n.life}}));format='handwritten-json';
}else{nodes=await page.evaluate(()=>{const clean=el=>el?.textContent?.trim()||'';const cards=[...document.querySelectorAll('.detail-card[id^="node-card-"] .core-concept, .node-card[data-node-id] .card-summary')].map(el=>({card:el.parentElement,lead:el}));if(!cards.length)document.querySelectorAll('details.card[data-node]').forEach(card=>cards.push({card,lead:card.querySelector('summary .muted')}));return cards.map(({card,lead},i)=>({id:card.id||card.closest('[data-node-id]')?.dataset.nodeId||card.dataset.node||`node-${i+1}`,summary:clean(lead),concept:clean(lead),points:[...card.querySelectorAll('ul li')].map(clean),clinical:{text:clean(card.querySelector('.clinical-box,.detail'))}}));});format='static-html';}
if(!nodes.length)throw Error(`${slug}: zero nodes extracted`);const errors=validateNodeText(nodes);results.push({slug,format,nodes:nodes.length,errors});await page.close();}
for(const p of fs.readdirSync(root+'/materials-src').filter(s=>fs.existsSync(root+`/materials-src/${s}/content.json`)))validateMaterialContent(JSON.parse(fs.readFileSync(root+`/materials-src/${p}/content.json`)));
// v3.2 uses the teacher's step-by-step script, not the old paragraph/card schema.
// Check the actual shipped document against that renderer; its per-step browser
// and SCRIPT_DIFF proof is produced by urinary-release-verify.mjs.
for(const slug of approvedUrinarySlugs){const d=approvedUrinaryDocument(slug),html=fs.readFileSync(root+`/public/materials/${d.version}/index.html`,'utf8');const errors=html===d.html?[]:['built document differs from approved student-script renderer'];results.push({slug:d.version,format:'approved-student-script',nodes:d.nodes.length,errors});}
fs.writeFileSync(root+'/docs/HEART2_C2_NODE_AUDIT.json',JSON.stringify({materials:results.length,results},null,2)+'\n');if(results.some(r=>r.errors.length))throw Error(JSON.stringify(results.filter(r=>r.errors.length)));console.log(`All ${targets.length} existing student materials and all kit sources passed node text validation; ${approvedUrinarySlugs.length} approved student-script editions (60 nodes) exactly match their built documents`);
}finally{await browser.close();}
