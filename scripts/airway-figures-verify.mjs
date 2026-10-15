// Airway V2: actual rendered boxes, leaders, anchors, focus states and review screenshots.
import fs from 'node:fs';import path from 'node:path';import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'docs/respiratory-screenshots/airway-v2');fs.mkdirSync(out,{recursive:true});
const content=JSON.parse(fs.readFileSync(root+'/materials-src/airway-structure/content.json'));
const manifest=JSON.parse(fs.readFileSync(root+'/materials-src/figures/raster/airway-structure/labels.json'));
const browser=await chromium.launch({channel:'chrome'}),report={measurements:[],errors:[]};
try{for(const width of [1280,390]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:2,reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.route('**/course-learning.js',r=>r.fulfill({body:'window.CourseLearning={explore(){},nodeTime(){},answer(){},hint(){},complete(){}}'}));
 await page.goto('file://'+root+'/public/materials/airway-structure-v1/index.html');await page.evaluate(()=>document.fonts.ready);
 async function inspect(name,selector,state){
 const locator=page.locator(selector);await locator.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const m=await locator.evaluate(svg=>{
  const ratio=svg.getBoundingClientRect().width/svg.viewBox.baseVal.width,v=svg.viewBox.baseVal;
  const all=[...svg.querySelectorAll('text')];const boxes=all.map(t=>{const b=t.getBBox();return {label:t.getAttribute('aria-label')||t.textContent,x:b.x,y:b.y,w:b.width,h:b.height,px:parseFloat(getComputedStyle(t).fontSize)*ratio,red:getComputedStyle(t).fill==='rgb(180, 35, 58)',bold:parseInt(getComputedStyle(t).fontWeight)>=700,clipped:b.x<v.x||b.y<v.y||b.x+b.width>v.x+v.width||b.y+b.height>v.y+v.height}});
  const overlaps=[],anchorHits=[],lineHits=[],crossings=[];
  const inside=(p,b)=>p.x>b.x-4&&p.x<b.x+b.w+4&&p.y>b.y-4&&p.y<b.y+b.h+4;
  const intersect=(a,b,c,d)=>{const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0};
  const lines=[...svg.querySelectorAll('polyline.lead:not(.halo)')].map(p=>({label:p.parentElement.dataset.label,points:[...p.points].map(p=>({x:p.x,y:p.y}))}));
  const anchors=[...svg.querySelectorAll('[data-anchor]')].map(c=>({label:c.parentElement.dataset.label,x:c.cx.baseVal.value,y:c.cy.baseVal.value}));
  boxes.forEach((b,i)=>{boxes.slice(i+1).forEach(c=>{if(b.x<c.x+c.w&&b.x+b.w>c.x&&b.y<c.y+c.h&&b.y+b.h>c.y)overlaps.push([b.label,c.label])});anchors.forEach(a=>{if(a.label!==b.label&&inside(a,b))anchorHits.push([b.label,a.label])});lines.forEach(l=>{if(l.label===b.label)return;const corners=[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}];if(l.points.some(p=>inside(p,b))||l.points.slice(1).some((z,i)=>corners.some((c,j)=>intersect(l.points[i],z,c,corners[(j+1)%4]))))lineHits.push([b.label,l.label])})});
  lines.forEach((l,i)=>lines.slice(i+1).forEach(k=>{if(l.points.slice(1).some((b,i)=>k.points.slice(1).some((d,j)=>intersect(l.points[i],b,k.points[j],d))))crossings.push([l.label,k.label])}));
  return {minPx:Math.min(...boxes.map(b=>b.px)),boxes,overlaps,anchorHits,lineHits,crossings};
 });
 const spec=manifest[name],expected=state?spec.states[state]:spec.red;const actual=m.boxes.filter(b=>b.red&&b.bold).map(b=>b.label);
 if(JSON.stringify([...expected].sort())!==JSON.stringify([...new Set(actual)].sort()))report.errors.push(`${width} ${name} ${state||''}: incorrect red labels ${actual}`);
 if(m.minPx<(width===390?12:13)||m.boxes.some(b=>b.clipped)||m.overlaps.length||m.anchorHits.length||m.lineHits.length||m.crossings.length)report.errors.push(`${width} ${name}: geometry failure`);
 const file=`${width}-${state?'overview-'+state:name}.png`;await locator.screenshot({path:path.join(out,file)});
 report.measurements.push({width,name,state,file,...m});
 }
 for(const state of content.lab.states){await page.locator(`button[data-lab-state="${state.id}"]`).click();await inspect('overview','.state-figure > .anatomy-main > svg',state.id)}
 for(let i=0;i<content.nodes.length;i++){const node=content.nodes[i];await page.locator(`[data-node="${node.id}"]`).click();await inspect(`node-0${i+1}`,`#detail-${node.id} > .node-figure > svg`);await page.locator(`[data-node="${node.id}"]`).click()}
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))report.errors.push(`${width}: horizontal overflow`);
 await page.close();
}}finally{await browser.close()}
report.ok=!report.errors.length;fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:report.ok,errors:report.errors,measurements:report.measurements.map(m=>({width:m.width,name:m.name,minPx:m.minPx,overlaps:m.overlaps,anchorHits:m.anchorHits,lineHits:m.lineHits,crossings:m.crossings,clipped:m.boxes.filter(b=>b.clipped)}))},null,2));if(!report.ok)process.exitCode=1;
