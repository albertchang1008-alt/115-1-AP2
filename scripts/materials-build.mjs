import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { validateMaterialContent } from '../shared/materialKit.ts';
import { ROOT, MATERIALS_DIR, upsertCatalogEntry, syncCatalog } from './materials.mjs';
const slug=process.argv[2]; if(!slug) throw Error('用法：npm run materials:build <slug>');
const src=path.join(ROOT,'materials-src',slug), content=JSON.parse(fs.readFileSync(path.join(src,'content.json'),'utf8')); validateMaterialContent(content);
if(content.slug!==slug) throw Error(`slug：內容檔為 ${content.slug}，路徑為 ${slug}`);
const figures={}; for(const file of new Set([content.lab.figure,...content.nodes.map(n=>n.figure)])) figures[file]=fs.readFileSync(path.join(ROOT,'materials-src/figures',file),'utf8');
const out=path.join(MATERIALS_DIR,`${slug}-${content.version}`), index=path.join(out,'index.html');
const ids=[...content.nodes,...content.foundation,...content.cases].map(x=>x.id).sort();
if(fs.existsSync(index)){const old=fs.readFileSync(index,'utf8'), m=old.match(/<meta name="material-ids" content="([^"]*)"/); if(!m||m[1].split(',').sort().join(',')!==ids.join(',')) throw Error(`版本 ${content.version} 的節點／題目 ID 有變動，請改版號`); console.log('ID 集合相同：允許覆寫純視覺／文字修訂。');}
fs.mkdirSync(out,{recursive:true}); const css=fs.readFileSync(path.join(ROOT,'materials-src/kit/kit.css'),'utf8'); const js=fs.readFileSync(path.join(ROOT,'materials-src/kit/kit.js'),'utf8').replace(/export /g,'');
const data=JSON.stringify(content).replace(/</g,'\\u003c'), figs=JSON.stringify(figures).replace(/</g,'\\u003c');
fs.writeFileSync(index,`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="material-ids" content="${ids.join(',')}"><title>${content.title}</title><style>${css}</style></head><body><script src="https://albertchang1008-alt.github.io/115-1-AP2/materials/course-learning.js"></script><script>window.CourseLearning=window.CourseLearning||{explore(){},nodeTime(){},answer(){},complete(){}};</script><script>${js}\nmount(${data},${figs});</script></body></html>`);
upsertCatalogEntry(`${slug}-${content.version}`,{label:content.label,tracking:'interactive',nodeTotal:content.nodes.length,questionTotal:content.foundation.length+content.cases.length,note:'先備 6 題逐題解鎖；病例 5 題全對才通關'}); await syncCatalog(); console.log(`已建置 ${index}`);
