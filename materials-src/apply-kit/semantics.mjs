import {approvedQuestionRewrites} from '../../scripts/apply-script-question-rewrites.mjs';
import{createHash}from'node:crypto';
import fs from'node:fs';import path from'node:path';import{unwrap}from'./model.mjs';
export function checkSemantics(data,{root,cite,baseDir}){
 const errors=[],c=unwrap(data);if(data.schemaVersion!==2){if(c.slug!=='water-sodium-regulation')errors.push('schemaVersion: new materials require v2; only teacher-approved water/sodium v1 is retained');else {
 const baseline=JSON.parse(fs.readFileSync(path.join(root,'materials-src/apply-examples/water-sodium-regulation/apply.json'),'utf8'));
 const approved=structuredClone(baseline),drafts=approvedQuestionRewrites(root);
 for(const stage of ['foundation','cases'])for(const wrapped of approved.learning.questions[stage]){
  const q=wrapped.value||wrapped,draft=drafts.find(d=>d.id===q.id);
  if(draft)Object.assign(q,{stem:draft.stem,options:draft.options,answer:draft.answer});
 }
 // #29 teacher-approved unversioned sample: exact whole-document hash only; all unrelated v1 edits remain rejected.
 const plainApproved=createHash('sha256').update(JSON.stringify(data)).digest('hex')==='3f3fe289802355c9cb8723871495987af11461e6e7ec31580a2fee81e91da436';
 if(!plainApproved&&JSON.stringify(data)!==JSON.stringify(baseline)&&JSON.stringify(data)!==JSON.stringify(approved))errors.push('schemaVersion: frozen v1 sample only; changed data must migrate to v2');
 }return errors;}
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'materials-src/apply-kit/anchor-assets.json'),'utf8'));const approvals=JSON.parse(fs.readFileSync(path.join(root,'materials-src/apply-kit/direction-approvals.json'),'utf8')).approvals;const view=c.lab.figure.anchorView||'overview',asset=catalog[c.slug+':'+view];if(c.slug!=='water-sodium-regulation'){if(!asset||asset.width!==c.lab.figure.width||asset.height!==c.lab.figure.height)errors.push('figure: dimensions/view differ from canonical raster');else if(baseDir){const raw=fs.readFileSync(path.resolve(baseDir,c.lab.figure.src));if(createHash('sha256').update(raw).digest('hex')!==asset.sha256)errors.push('figure: raster differs from canonical anchor asset')}}
 const points=new Map();const table=fs.readFileSync(path.join(root,'docs/urinary-release/ANCHOR_TABLE.md'),'utf8');for(const line of table.split('\n')){const m=line.match(/^\| ([a-z-]+) \| ([^|]+) \| ([^|]+) \| \[(\d+), (\d+)\]/);if(m)points.set(`${m[1]}:${m[2].trim()}:${m[3].trim()}`,[+m[4],+m[5]])}
 const text=v=>v&&typeof v==='object'?v.text:v;const directional={up:/增加|上升|促進|升高|興奮|升壓/,down:/減少|降低|下降|抑制|減酸|較少/,same:/維持|平衡|不變|等於/};
 const inspect=(raw,p)=>{if(raw.kind==='focus'){const values=[raw.name,raw.detail,raw.badge,raw.short,raw.full,raw.label,raw.compactLabel].map(text).filter(x=>typeof x==='string');if(values.some(x=>/[↑↓▲▼]/.test(x)))errors.push(`${p}: focus cannot display direction glyphs`)}else if(raw.kind==='change'){
  const approved=approvals.some(a=>a.id===raw.directionApproval&&a.slug===c.slug&&a.itemId===raw.id&&a.direction===raw.direction);if(approved)return;cite(raw.directionSources,p+'.directionSources');if(!raw.directionSources?.some(r=>directional[raw.direction]?.test(r.quote||'')))errors.push(`${p}: direction evidence must state explicit ${raw.direction} change`);
 }};
 const anchor=(raw,p,coordinate)=>{if(raw.circulating){if(raw.anchorRef)errors.push(`${p}: circulating cannot reference organ anchor`);return;}if(raw.anchorView&&raw.anchorView!==view)errors.push(`${p}: anchor view mismatch`);const key=`${c.slug}:${view}:${raw.anchorRef}`,expected=points.get(key);if(!expected||!Array.isArray(coordinate))errors.push(`${p}: anchor reference absent from frozen table`);else{const actual=[coordinate[0]*c.lab.figure.width,coordinate[1]*c.lab.figure.height];if(actual.some((x,i)=>Math.abs(x-expected[i])>.5))errors.push(`${p}: anchor outside ${raw.anchorRef} table point ±0.5px`);}};
 for(const[sidx,s]of data.lab.states.entries()){
  const p=`lab.states[${sidx}]`;for(const [group,rows]of Object.entries({changes:s.changes,labels:s.labels,flow:(s.flowStages||[]).flatMap(x=>Array.isArray(x)?x:[])}))for(const[i,x]of(rows||[]).entries())inspect(x,`${p}.${group}[${i}]`);
  for(const[i,l]of(s.labels||[]).entries())anchor(l,`${p}.labels[${i}]`,l.anchor);
  for(const[i,l]of(s.indicators||[]).entries())anchor(l,`${p}.indicators[${i}]`,l.a);
  for(const[i,e]of(s.edges||[]).entries())if(e.relation==='cause'){if(!e.fromSources?.length||!e.toSources?.length)errors.push(`${p}.edges[${i}]: cause endpoint citations required`);cite(e.fromSources,`${p}.edges[${i}].fromSources`);cite(e.toSources,`${p}.edges[${i}].toSources`)}
  if(s.mode==='focus')for(const x of s.intake||[])if(/[↑↓▲▼]/.test(text(x.status)||''))errors.push(`${p}: focus intake cannot display direction glyphs`);
 }
 return errors;
}
