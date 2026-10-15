// Respiratory raster labels V2 (select a slug; stage one defaults to lungs-pleura): actual rendered boxes, leaders, anchors, focus states and review screenshots.
import {measureRasterPlates} from './respiratory-raster-verify.mjs';
import fs from 'node:fs';import path from 'node:path';import {chromium} from 'playwright';
const slug=process.argv[2]||'lungs-pleura';
const repair=process.argv.includes('--repair'),auditOnly=process.argv.includes('--audit-only');
const affected={ 'gas-exchange':['overview-state-1','overview-state-2','overview-state-3','node-01','node-02','node-03','node-04','node-05','node-06'],'respiratory-control':['overview-state-1','overview-state-2','overview-state-3','node-01','node-02','node-04','node-05','node-06'],'breathing-mechanics':['overview-state-1','overview-state-2','overview-state-3','node-01','node-02','node-03','node-04','node-06'],'o2-co2-transport':['overview-state-1','overview-state-2','overview-state-3','node-01','node-05','node-06'],'lung-function':['overview-state-1','overview-state-2','overview-state-3','node-01','node-02','node-03','node-04','node-05','node-06']};
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'docs/respiratory-screenshots/v2/'+slug);fs.mkdirSync(out,{recursive:true});
const content=JSON.parse(fs.readFileSync(root+'/materials-src/'+slug+'/content.json'));
const raw=JSON.parse(fs.readFileSync(root+'/materials-src/figures/raster/'+slug+'/labels.json'));const manifest=raw.figures||raw;
const browser=await chromium.launch({channel:'chrome'}),report={measurements:[],errors:[]};
try{for(const width of (process.argv.includes('--breakpoints')?[767,768]:[1280,390])){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:2,reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.route('**/course-learning.js',r=>r.fulfill({body:'window.CourseLearning={explore(){},nodeTime(){},answer(){},hint(){},complete(){}}'}));
 await page.addInitScript(() => {const scroll=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(o){return scroll.call(this,{...o,behavior:'instant'})}});
 const previewFile=process.argv.includes('--html-file')?path.resolve(process.argv[process.argv.indexOf('--html-file')+1]):root+'/public/materials/'+slug+'-'+content.version+'/index.html';
 await page.goto('file://'+previewFile);await page.evaluate(()=>document.fonts.ready);
 const measureFigure=svg=>{
  const ratio=svg.getBoundingClientRect().width/svg.viewBox.baseVal.width,rootBox=svg.getBoundingClientRect(),v={x:0,y:0,width:rootBox.width/ratio,height:rootBox.height/ratio};
  const visible=t=>{const b=t.getBoundingClientRect();return b.width>0||b.height>0};
  const world=q=>({x:(q.x-rootBox.x)/ratio,y:(q.y-rootBox.y)/ratio});
  const boxWorld=t=>{const b=t.getBoundingClientRect();return {x:(b.x-rootBox.x)/ratio,y:(b.y-rootBox.y)/ratio,width:b.width/ratio,height:b.height/ratio}};
  const all=[...svg.querySelectorAll('text')].filter(t=>t.getBoundingClientRect().width>0);const boxes=all.map(t=>{const b=boxWorld(t);return {label:t.getAttribute('aria-label')||t.textContent,x:b.x,y:b.y,w:b.width,h:b.height,px:t.getScreenCTM()?parseFloat(getComputedStyle(t).fontSize)*Math.hypot(t.getScreenCTM().a,t.getScreenCTM().b):0,red:getComputedStyle(t).fill==='rgb(180, 35, 58)',bold:parseInt(getComputedStyle(t).fontWeight)>=700,clipped:b.x<v.x||b.y<v.y||b.x+b.width>v.x+v.width||b.y+b.height>v.y+v.height}});
  const htmlLabels=[...svg.querySelectorAll('[data-html-label]')].filter(t=>t.getBoundingClientRect().width>0);
  htmlLabels.forEach(t=>{const b=t.getBoundingClientRect(),f=t.closest('foreignObject').getBoundingClientRect(); boxes.push({label:t.dataset.htmlLabel,x:(b.x-rootBox.x)/ratio,y:(b.y-rootBox.y)/ratio,w:b.width/ratio,h:b.height/ratio,px:parseFloat(getComputedStyle(t).fontSize)*ratio,red:getComputedStyle(t).color==='rgb(180, 35, 58)',bold:parseInt(getComputedStyle(t).fontWeight)>=700,clipped:b.bottom>f.bottom+1||b.right>f.right+1});});
  const bars=[...svg.querySelectorAll('.data-bar,.data-segment')].filter(visible).map(b=>({value:Number(b.dataset.value),max:Number(b.dataset.max),width:b.width.baseVal.value}));
  const segments=[...svg.querySelectorAll('.data-segment')].filter(visible).map(b=>({key:b.dataset.key,x:b.x.baseVal.value}));
  const badBars=bars.filter(b=>Math.abs(b.width-1500*b.value/b.max)>.001);
  const volumeBands=[...svg.querySelectorAll('.volume-band')].filter(visible).map(b=>({low:Number(b.dataset.low),high:Number(b.dataset.high),height:b.height.baseVal.value,y:b.y.baseVal.value}));
  const fevCurves=[...svg.querySelectorAll('.fev-curve')].filter(visible).map(p=>{const length=p.getTotalLength(),start=p.getPointAtLength(0),end=p.getPointAtLength(length);const atX=x=>{let lo=0,hi=length;for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(p.getPointAtLength(mid).x<x)lo=mid;else hi=mid}const q=p.getPointAtLength((lo+hi)/2);return [q.x,q.y]};const samples=Array.from({length:101},(_,i)=>atX(start.x+(end.x-start.x)*i/100)),slopes=samples.slice(1).map((q,i)=>(samples[i][1]-q[1])/(q[0]-samples[i][0]));return {series:p.dataset.series,fev:Number(p.dataset.fev),fvc:Number(p.dataset.fvc),path:p.getAttribute('d'),atOne:atX(Number(p.dataset.oneX||600)),end:[end.x,end.y],monotonic:slopes.every(s=>s>=-.002),concave:slopes.every((s,i)=>!i||s<=slopes[i-1]+.005),slopes};});
  const fevPoints=[...svg.querySelectorAll('.fev-point')].filter(visible).map(p=>({value:Number(p.dataset.value),x:p.cx.baseVal.value,y:p.cy.baseVal.value}));
  const uses=[...svg.querySelectorAll('use')].filter(u=>u.getBoundingClientRect().width>0).map(u=>{const a=document.querySelector(u.getAttribute('href'));const m=u.getCTM();return {resolved:!!a,ratio:m?Math.abs(m.a-m.d):Infinity};});
  const punctuationHeads=[];
  htmlLabels.forEach(t=>{const walker=document.createTreeWalker(t,NodeFilter.SHOW_TEXT);for(let node;node=walker.nextNode();){const chars=[];for(let i=0;i<node.textContent.length;i++){const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const b=range.getBoundingClientRect();if(b.width)chars.push({c:node.textContent[i],x:b.x,y:b.y});}chars.forEach((c,i)=>{if(/[。，、；：？！）］】〉》]/.test(c.c)&&i>0&&!chars.slice(0,i).some(a=>Math.abs(a.y-c.y)<1))punctuationHeads.push(node.textContent);});}});
  // S2-4: inspect every rendered line, including native HTML wrapping.
  const terms=['中樞化學受器','周邊化學受器','終末細支氣管','呼吸性細支氣管','化學受器訊息','牽張受器訊息','肺牽張受器','腦脊髓液','血腦障壁','肺泡壓','肺內壓','胸膜內壓','胸內壓','肺間壓','外肋間肌','內肋間肌','肋間肌','胸鎖乳突肌','肺小動脈收縮','肺小動脈','肺微血管','組織微血管','血紅素','碳酸酐酶','碳醯胺基血紅素','血基質','肺餘容積','潮氣容積','吸氣儲備容積','呼氣儲備容積','呼吸性酸中毒','呼吸性鹼中毒','肺泡通氣量','死腔通氣量','總通氣量','頸動脈體','主動脈體','呼吸深度','呼吸頻率','順應性較大','順應性較小'];
  const wordBreaks=[],singleCharacterLines=[],renderedLines=[],textRects=[];
  for(const el of [...all,...htmlLabels]){
   const chars=[],walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let index=0;
   for(let n;n=walker.nextNode();){for(let j=0;j<n.textContent.length;j++,index++){const range=document.createRange();range.setStart(n,j);range.setEnd(n,j+1);const b=range.getBoundingClientRect();if(b.width&&b.height)chars.push({c:n.textContent[j],index,x:b.x,y:b.y,w:b.width,h:b.height});}}
   if(!chars.length)continue;
   const groups=[];for(const c of chars){let g=groups.find(g=>Math.abs(g.y-c.y)<1);if(!g){g={y:c.y,chars:[]};groups.push(g)}g.chars.push(c)}
   const rawText=el.textContent,label=el.getAttribute('aria-label')||el.dataset.htmlLabel||rawText;
   const lines=groups.map(g=>{const left=Math.min(...g.chars.map(c=>c.x)),right=Math.max(...g.chars.map(c=>c.x+c.w)),bottom=Math.max(...g.chars.map(c=>c.y+c.h));return {text:g.chars.map(c=>c.c).join(''),indices:g.chars.map(c=>c.index),x:left,y:g.y,w:right-left,h:bottom-g.y}});
   renderedLines.push({label,lines:lines.map(l=>l.text)});textRects.push(...lines.map(l=>({...l,label})));
   if(lines.length>1){
    for(const l of lines){const han=l.text.match(/[\u3400-\u9fff]/g)||[];if(han.length===1&&l.text.replace(/[\u3400-\u9fff\s。，、；：？！（）①②③④⑤⑥⑦⑧⑨]/g,'')==='')singleCharacterLines.push({label,line:l.text});}
    const atomic=[...terms,...[...rawText.matchAll(/(?:P(?:CO₂|O₂)\s*約?\s*)?\d+(?:\.\d+)?\s*(?:mmHg|mL\/dL\/mmHg|mL\/min|次\/min|mL|L\/分|L|%)/g)].map(m=>m[0])];
    for(const term of new Set(atomic)){let start=rawText.indexOf(term);while(start>=0){const covered=lines.filter(l=>l.indices.some(i=>i>=start&&i<start+term.length));if(covered.length>1)wordBreaks.push({label,term,lines:covered.map(l=>l.text)});start=rawText.indexOf(term,start+1)}}
   }
  }
  // S2-6: visible text vs arrow stroke AND marker head, with a 4 CSS px gap.
  const arrowTextHits=[],arrowGeometry=[];
  const arrowEls=[...svg.querySelectorAll('path.flow-arrow')].filter(p=>p.getBoundingClientRect().width>0||p.getBoundingClientRect().height>0);
  const pointIn=(p,b,pad=0)=>p.x>b.x-pad&&p.x<b.x+b.w+pad&&p.y>b.y-pad&&p.y<b.y+b.h+pad;
  for(const [i,p] of arrowEls.entries()){
   const len=p.getTotalLength(),matrix=p.getScreenCTM();if(!matrix||!len)continue;
   const world=q=>new DOMPoint(q.x,q.y).matrixTransform(matrix),stroke=parseFloat(getComputedStyle(p).strokeWidth)*Math.hypot(matrix.a,matrix.b),samples=[];
   const count=Math.max(2,Math.ceil(len/2));for(let j=0;j<=count;j++)samples.push(world(p.getPointAtLength(len*j/count)));
   const marker=getComputedStyle(p).markerEnd.match(/#([^\)"']+)/)?.[1],mark=marker?document.getElementById(marker):null,head=[];
   if(mark){const end=world(p.getPointAtLength(len)),prev=world(p.getPointAtLength(Math.max(0,len-.1))),d=Math.hypot(end.x-prev.x,end.y-prev.y),ux=(end.x-prev.x)/d,uy=(end.y-prev.y)/d;
    const type=mark.querySelector('path')?.getAttribute('d')||'',local=type.includes('L4')?[[0,0],[4,2],[0,4],[0,0]]:[[3,0],[3,4]];
    for(let j=1;j<local.length;j++)for(let f=0;f<=1;f+=.05){const x=(local[j-1][0]*(1-f)+local[j][0]*f-3)*stroke,y=(local[j-1][1]*(1-f)+local[j][1]*f-2)*stroke;head.push({x:end.x+ux*x-uy*y,y:end.y+uy*x+ux*y});}
   }
   for(const b of textRects){if(samples.some(q=>pointIn(q,b,4+stroke/2))||head.some(q=>pointIn(q,b,4)))arrowTextHits.push({label:b.label,line:b.text,arrow:i,markerHead:head.some(q=>pointIn(q,b,4))});}
   arrowGeometry.push({index:i,samples:samples.length,marker:!!mark,strokePx:stroke});
  }

  const overlaps=[],anchorHits=[],lineHits=[],crossings=[];
  const inside=(p,b)=>p.x>b.x-4&&p.x<b.x+b.w+4&&p.y>b.y-4&&p.y<b.y+b.h+4;
  const intersect=(a,b,c,d)=>{const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0};
  const lines=[...svg.querySelectorAll('polyline.lead:not(.halo)')].filter(t=>t.getBoundingClientRect().width>0).map(p=>({label:p.parentElement.dataset.label,points:[...p.points].map(q=>world(new DOMPoint(q.x,q.y).matrixTransform(p.getScreenCTM())))}));
  const anchors=[...svg.querySelectorAll('[data-anchor]')].filter(t=>t.getBoundingClientRect().width>0).map(c=>({label:c.parentElement.dataset.label,...world(new DOMPoint(c.cx.baseVal.value,c.cy.baseVal.value).matrixTransform(c.getScreenCTM()))}));
  boxes.forEach((b,i)=>{boxes.slice(i+1).forEach(c=>{if(b.x<c.x+c.w&&b.x+b.w>c.x&&b.y<c.y+c.h&&b.y+b.h>c.y)overlaps.push([b.label,c.label])});anchors.forEach(a=>{if(a.label!==b.label&&inside(a,b))anchorHits.push([b.label,a.label])});lines.forEach(l=>{if(l.label===b.label)return;const corners=[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}];if(l.points.some(p=>inside(p,b))||l.points.slice(1).some((z,i)=>corners.some((c,j)=>intersect(l.points[i],z,c,corners[(j+1)%4]))))lineHits.push([b.label,l.label])})});
  lines.forEach((l,i)=>lines.slice(i+1).forEach(k=>{if(l.points.slice(1).some((b,i)=>k.points.slice(1).some((d,j)=>intersect(l.points[i],b,k.points[j],d))))crossings.push([l.label,k.label])}));
  const annotationIds=[...svg.querySelectorAll('[data-annotation-id]')].filter(visible).map(t=>({id:t.dataset.annotationId,kind:t.dataset.annotationKind}));
  const duplicateNumbers=annotationIds.filter((a,i)=>annotationIds.some((b,j)=>j<i&&b.id===a.id));
  const labelMode=innerWidth>=768?'desktop':'mobile';
  const directLabelCount=[...svg.querySelectorAll('[data-direct-label]')].filter(visible).length,keyCount=[...svg.querySelectorAll('[data-number-key]')].filter(visible).length;
  const layoutFailure=svg.classList.contains('r2-responsive')&&(labelMode==='desktop'?annotationIds.some(a=>a.kind==='label')||!directLabelCount||!!keyCount:!!directLabelCount||!annotationIds.some(a=>a.kind==='label')||!keyCount);
  const distortedImages=[...svg.querySelectorAll('image')].filter(t=>t.getBoundingClientRect().width>0).filter(t=>{const m=t.getCTM();return Math.abs(m.a-m.d)>.001||Math.abs(m.b)>.001||Math.abs(m.c)>.001}).length;return {directLabelCount,keyCount,annotationIds,duplicateNumbers,labelMode,layoutFailure,wordBreaks,singleCharacterLines,renderedLines,arrowTextHits,arrowGeometry,segments,badBars,volumeBands,fevCurves,fevPoints,uses,punctuationHeads,distortedImages,minPx:Math.min(...boxes.map(b=>b.px)),boxes,overlaps,anchorHits,lineHits,crossings};
 };
 if(process.argv.includes('--check-fixtures')&&width===1280){
  const cases=[
   {name:'同圖重複編號',svg:'<text data-annotation-id="1" data-annotation-kind="step" x="20" y="40">①</text><text data-annotation-id="1" data-annotation-kind="label" x="60" y="40">1</text>',expect:'duplicate'},
   {name:'步驟數字與標籤字母',svg:'<text data-annotation-id="1" data-annotation-kind="step" x="20" y="40">①</text><text data-annotation-id="A" data-annotation-kind="label" x="60" y="40">A</text>',expect:'clear'},
   {name:'拆開醫學詞＋單字行',svg:'<text font-size="30" x="20" y="45"><tspan>中樞化學受</tspan><tspan x="20" dy="50">器</tspan></text>',expect:'word'},
   {name:'數值與單位拆行',svg:'<text font-size="30" x="20" y="35"><tspan>肺內壓</tspan><tspan x="20" dy="45">760</tspan><tspan x="20" dy="45">mmHg</tspan></text>',expect:'unit'},
   {name:'只碰到箭頭頭部',svg:'<defs><marker id="fixture-head" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2L0 4Z"/></marker></defs><path class="flow-arrow" d="M50 100H180" stroke="#444" stroke-width="8" marker-end="url(#fixture-head)"/><text font-size="30" x="190" y="112">CO₂</text>',expect:'head'},
   {name:'距離足夠',svg:'<defs><marker id="fixture-head" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2L0 4Z"/></marker></defs><path class="flow-arrow" d="M50 100H180" stroke="#444" stroke-width="8" marker-end="url(#fixture-head)"/><text font-size="30" x="230" y="112">CO₂</text>',expect:'clear'},
   {name:'合法指定斷行',svg:'<text font-size="30" x="20" y="45"><tspan>肺內壓</tspan><tspan x="20" dy="50">（肺泡壓）</tspan></text>',expect:'clear'}
  ];report.fixtureChecks=[];
  for(const c of cases){await page.evaluate(markup=>{const el=document.createElement('div');el.id='verifier-fixture';el.style='position:absolute;top:0;left:0;width:400px;background:white';el.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="400" viewBox="0 0 400 160">'+markup+'</svg>';document.body.append(el)},c.svg);const m=await page.locator('#verifier-fixture svg').evaluate(measureFigure);const pass=c.expect==='duplicate'?m.duplicateNumbers.length>0:c.expect==='word'?m.wordBreaks.length>0&&m.singleCharacterLines.length>0:c.expect==='unit'?m.wordBreaks.some(w=>w.term.includes('mmHg')):c.expect==='head'?m.arrowTextHits.some(h=>h.markerHead):!m.duplicateNumbers.length&&!m.arrowTextHits.length&&!m.wordBreaks.length&&!m.singleCharacterLines.length;report.fixtureChecks.push({name:c.name,ok:pass,duplicateNumbers:m.duplicateNumbers,wordBreaks:m.wordBreaks,singleCharacterLines:m.singleCharacterLines,arrowTextHits:m.arrowTextHits});if(!pass)report.errors.push('verifier fixture failed: '+c.name);await page.locator('#verifier-fixture').evaluate(e=>e.remove());}
 }

 async function inspect(name,selector,state){
 const locator=page.locator(selector);await locator.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const m=await locator.evaluate(measureFigure);
 const rawSpec=manifest[state?name+'-'+state:name]||manifest[name],spec=rawSpec.layouts?.[width>=768?'desktop':'mobile']||rawSpec,expected=state&&spec.states?spec.states[state]:spec.red;
 for(const datum of spec.data||[]){
  if(datum.type==='volume-band'){const actual=m.volumeBands.find(b=>b.low===datum.low&&b.high===datum.high);if(!actual||Math.abs(actual.height-datum.height)>.001)report.errors.push(`${width} ${name}: volume interval mismatch`);}
  if(datum.type==='FEV curve'){const curve=m.fevCurves.find(c=>c.series===datum.series),point=m.fevPoints.find(p=>p.value===datum.atOneSecond);if(!curve||!point||curve.atOne.some((value,i)=>Math.abs(value-datum.atOneSecondXY[i])>.002)||curve.end.some((value,i)=>Math.abs(value-datum.plateauXY[i])>.002)||(datum.concave&&(!curve.concave||!curve.monotonic)))report.errors.push(`${width} ${name}: FEV curve mismatch/concavity`);}
  if(datum.type==='segment'&&datum.x!==undefined){const actual=m.segments?.find(z=>z.key===datum.label);if(!actual||Math.abs(actual.x-datum.x)>.001)report.errors.push(`${width} ${name}: capacity alignment`);}
 }
 let plates=spec.plates||(spec.source?[{source:spec.source,sourceSize:spec.sourceSize}]:[]);
 if(slug==='airway-structure')plates=await locator.evaluate(svg=>[...svg.querySelectorAll('svg')].filter(s=>s.querySelector(':scope > image')&&s.getBoundingClientRect().width>0).map(s=>{const im=s.querySelector(':scope > image');return {source:'approved-airway-inline-raster',sourceSize:[Number(im.getAttribute('width')),Number(im.getAttribute('height'))]}}));
 m.rasterChecks=await measureRasterPlates(locator,plates);
 if(m.rasterChecks.some(p=>!p.ok))report.errors.push(`${width} ${name} ${state||''}: raster not painted/decoded (>20% non-white required)`);
 if(slug==='breathing-mechanics'&&['node-01','node-03'].includes(name)&&width>=1280&&m.rasterChecks.some(p=>p.widthCss<600))report.errors.push(`${width} ${name}: plate width below 600 CSS px`);
 const actual=m.boxes.filter(b=>b.red&&b.bold).map(b=>b.label);
 if(JSON.stringify([...expected].sort())!==JSON.stringify([...new Set(actual)].sort()))report.errors.push(`${width} ${name} ${state||''}: incorrect red labels ${actual}`);
 if(m.minPx<(width===390?12:13)||m.boxes.some(b=>b.clipped)||m.overlaps.length||m.anchorHits.length||m.lineHits.length||m.crossings.length||m.distortedImages||m.badBars.length||m.uses.some(u=>!u.resolved||u.ratio>.001)||m.punctuationHeads.length)report.errors.push(`${width} ${name}: geometry failure`);
 if(m.duplicateNumbers.length||m.layoutFailure)report.errors.push(`${width} ${name} ${state||''}: duplicate annotation/layout failure`);
 if(m.wordBreaks.length||m.singleCharacterLines.length)report.errors.push(`${width} ${name} ${state||''}: word/single-character line failure`);
 if(m.arrowTextHits.length)report.errors.push(`${width} ${name} ${state||''}: text-arrow collision (<4px)`);
 const slot=state?name+'-'+state:name,file=`${width}-${slot}.png`;
 if(!auditOnly&&(!repair||(process.argv.includes('--r3')?({'o2-co2-transport':['node-02'],'breathing-mechanics':['node-01','node-03']}[slug]||[]).includes(slot):process.argv.includes('--r2')?!!manifest[slot].layouts:affected[slug].includes(slot))))await locator.screenshot({path:path.join(out,file)});
 if(!auditOnly&&!process.argv.includes('--r3')&&slug==='o2-co2-transport'&&width===1280&&state)await page.locator('.lab').screenshot({path:path.join(out,`${width}-${slot}-interactive.png`)});
 report.measurements.push({width,name,state,file,...m});
 }
 for(const state of content.lab.states){await page.locator(`button[data-lab-state="${state.id}"]`).click();await inspect('overview','.state-figure > .anatomy-main > svg',state.id)}
 for(let i=0;i<content.nodes.length;i++){const node=content.nodes[i];await page.locator(`[data-node="${node.id}"]`).click();await inspect(`node-0${i+1}`,`#detail-${node.id} > .node-figure > svg`);await page.locator(`[data-node="${node.id}"]`).click()}
 if(slug==='o2-co2-transport'){
 const slider=page.getByRole('slider',{name:'氧分壓 PO₂'});
 for(const [state,k] of [['state-1',26],['state-2',31],['state-3',21]]){
  await page.locator(`button[data-lab-state="${state}"]`).click();
  for(const p of [0,40,100]){await slider.fill(String(p));const actual=await page.locator('.oxygen-probe').evaluate(c=>[Number(c.getAttribute('cx')),Number(c.getAttribute('cy'))]);const saturation=p?100*p**2.7/(k**2.7+p**2.7):0;if(Math.abs(actual[0]-(60+3.6*p))>1e-8||Math.abs(actual[1]-(350-2.7*saturation))>1e-8)report.errors.push(`${width} oxygen probe ${state} ${p}`);}
  await page.locator('.state-figure').scrollIntoViewIfNeeded();const box=await page.locator('.state-figure svg').boundingBox();await page.mouse.click(box.x+box.width*(60+3.6*70)/480,box.y+box.width*200/480);if(Number(await slider.inputValue())!==70)report.errors.push(`${width} oxygen pointer ${state}`);
 }
 await slider.fill('40');report.oxygenContract={viewBoxWidth:480,k:[26,31,21],sliderValues:[0,40,100],pointerPO2:70};
 }
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))report.errors.push(`${width}: horizontal overflow`);
 await page.close();
}}finally{await browser.close()}
if(report.fixtureChecks)fs.writeFileSync(root+'/docs/respiratory-screenshots/v2/repair-verifier-fixtures.json',JSON.stringify(report.fixtureChecks,null,2)+'\n');
report.ok=!report.errors.length;const reportPath=auditOnly?path.join('/tmp/respiratory-labels-audit',slug+'-audit.json'):out+'/verification.json';fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:report.ok,errors:report.errors,measurements:report.measurements.map(m=>({width:m.width,name:m.name,minPx:m.minPx,overlaps:m.overlaps,anchorHits:m.anchorHits,lineHits:m.lineHits,crossings:m.crossings,wordBreaks:m.wordBreaks,singleCharacterLines:m.singleCharacterLines,arrowTextHits:m.arrowTextHits,clipped:m.boxes.filter(b=>b.clipped)}))},null,2));if(!report.ok)process.exitCode=1;
