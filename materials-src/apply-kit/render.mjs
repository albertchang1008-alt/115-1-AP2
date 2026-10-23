import {verifyDerivedImages} from './derived-images.mjs';
import {createHash} from 'node:crypto';
import {hasStudentPlan, renderScriptedApply} from './scripted-render.mjs';
import{isFull,renderFull}from'./full-render.mjs';
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import{unwrap,validateApply}from'./model.mjs';
const kit=path.dirname(fileURLToPath(import.meta.url));
const json=v=>JSON.stringify(v).replace(/</g,'\\u003c');const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function image(base,src){const f=path.resolve(base,src);if(!fs.existsSync(f))throw Error(`Missing asset: ${src}`);if(f.endsWith('.svg')){const m=verifyDerivedImages();return fs.readFileSync(f,'utf8').replace(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g,(all,b64)=>{const sha=createHash('sha256').update(Buffer.from(b64,'base64')).digest('hex'),d=m.images.find(d=>d.sourceSha256===sha);return d?'data:image/webp;base64,'+fs.readFileSync(path.resolve(kit,'../..',d.path)).toString('base64'):all;});}const raw=fs.readFileSync(f),sha=createHash('sha256').update(raw).digest('hex'),d=verifyDerivedImages().images.find(d=>d.sourceSha256===sha);return d?'data:image/webp;base64,'+fs.readFileSync(path.resolve(kit,'../..',d.path)).toString('base64'):`data:image/png;base64,${raw.toString('base64')}`;}
export function renderApply(data,{baseDir,view='lab'}={}){
 if(view==='course' && hasStudentPlan(baseDir))return renderScriptedApply(data,{baseDir});
 if(isFull(data)){const legacy=JSON.parse(fs.readFileSync(path.resolve(baseDir,data.legacyApply),'utf8'));return renderFull(data,{baseDir,legacy:view==='course-legacy',labHtml:renderApply(legacy,{baseDir,view:'lab'})});}
 const errors=validateApply(data);if(errors.length)throw Error(errors.join('\n'));
 const c=unwrap(data),lab=structuredClone(c.lab);lab.figure.src=image(baseDir,lab.figure.src);
 if(data.schemaVersion===2)for(const s of lab.states){s.changes=s.changes.map(x=>({...x,terms:x.bindings.map(b=>b.term),termLabels:x.bindings.map(b=>b.label)}));}
 const body=fs.readFileSync(path.join(kit,'lab.html'),'utf8').replace('{{HEADER}}',esc(lab.header)).replace('{{REFERENCE_HEADING}}',esc(lab.referenceHeading||'' )).replace('{{TABS}}',lab.states.map(s=>`<button class="btn-tab" data-state="${esc(s.id)}">${esc(s.name)}</button>`).join(''));
 const labHtml=`<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.title)}</title><style>${fs.readFileSync(path.join(kit,'lab.css'),'utf8')}</style></head><body>${body}<script>${fs.readFileSync(path.join(kit,'flow.js'),'utf8')}\n${fs.readFileSync(path.join(kit,'lab.js'),'utf8')}\nmountApplyLab(${json(lab)});</script></body></html>`;
 if(view==='lab')return labHtml;
 if(!['course','course-legacy'].includes(view))throw Error('Unknown view');
 const prune=v=>Array.isArray(v)?v.map(prune):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['sources','uid'].includes(k)).map(([k,x])=>[k,prune(x)])):v;const learning=prune(c.learning);for(const n of learning.nodes)n.figure=image(baseDir,n.figure.src);
 return`<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.title)}</title><style>${fs.readFileSync(path.join(kit,'learning.css'),'utf8')}</style></head><body><script>${fs.readFileSync(path.join(kit,'flow.js'),'utf8')}\n${fs.readFileSync(path.join(kit,'learning.js'),'utf8')}\nmountApplyLearning(${json({slug:c.slug,title:c.title,learning,labHtml})});</script></body></html>`;
}
