import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {validateMaterialContent} from '../shared/materialKit.ts';

const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'docs/micro-immuno-review-screenshots');fs.mkdirSync(out,{recursive:true});
const fontPath=process.env.MI_CJK_FONT||'/tmp/micro-immuno-NotoSansCJKtc-Regular.otf';
const font64=fs.readFileSync(fontPath).toString('base64');
const results=[],sdk=[],errors=[],contentChecks=[],themeChecks=[];
const browser=await chromium.launch({channel:'chrome'});
async function open(slug,width,font='system-ui',scheme='light',motion='reduce'){
 const page=await browser.newPage({viewport:{width,height:width===390?844:800},deviceScaleFactor:1,colorScheme:scheme,reducedMotion:motion});
 page.on('pageerror',e=>errors.push({slug,width,font,error:e.message}));
 page.on('console',m=>{if(m.type()==='error')errors.push({slug,width,font,console:m.text()});});
 await page.route('**/*',r=>{
  if(r.request().url().endsWith('/course-learning.js'))return r.fulfill({contentType:'application/javascript',body:'window.__events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>window.__events.push({kind:k,args})]));'});
  if(/^https?:/.test(r.request().url()))return r.abort();
  return r.continue();
 });
 await page.goto(pathToFileURL(path.join(root,`public/materials/${slug}-v1/index.html`)).href);
 if(font==='Noto Sans CJK TC'){
  await page.evaluate(async data=>{const f=new FontFace('MI Audit Noto CJK TC',`url(data:font/otf;base64,${data})`);await f.load();document.fonts.add(f);},font64);
  await page.addStyleTag({content:'body,svg text{font-family:"MI Audit Noto CJK TC",sans-serif!important}'});
 }
 if(font==='sans-serif')await page.addStyleTag({content:'body,svg text{font-family:Arial,sans-serif!important}'});
 await page.evaluate(()=>document.fonts.ready);
 return page;
}
async function geometry(page,selector){
 return page.locator(selector).evaluate(svg=>{
  const W=svg.viewBox.baseVal.width,H=svg.viewBox.baseVal.height;
  const ratio=svg.getBoundingClientRect().width/W;
  const texts=[...svg.querySelectorAll('text')].filter(t=>t.getBoundingClientRect().width>0).map(t=>{
   const b=t.getBBox(),m=svg.getScreenCTM().inverse().multiply(t.getScreenCTM()),p1=new DOMPoint(b.x,b.y).matrixTransform(m),p2=new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(m);return {legend:t.classList.contains("legend-item")||t.classList.contains("legend-group"),text:t.textContent,x:p1.x,y:p1.y,w:p2.x-p1.x,h:p2.y-p1.y,px:parseFloat(getComputedStyle(t).fontSize)*ratio,fontFamily:getComputedStyle(t).fontFamily,right:p2.x,clipped:p1.x<0||p1.y<0||p2.x>W||p2.y>H};
  });
  const collisions=[];
  for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
   const a=texts[i],b=texts[j],dx=Math.max(b.x-a.x-a.w,a.x-b.x-b.w,0),dy=Math.max(b.y-a.y-a.h,a.y-b.y-b.h,0);
   const distance=Math.hypot(dx,dy);if(distance<3)collisions.push({a:a.text,b:b.text,distance});
  }
  const rasterHeight=Number(svg.dataset.rasterHeight||0);
  const anchors=[...svg.querySelectorAll('.callout')].map(g=>{
   const c=g.querySelector('circle'),x=+g.dataset.sourceX,y=+g.dataset.sourceY,px=+g.dataset.anchorX,py=+g.dataset.anchorY;
   const expectedY=y*900+(svg.querySelector('[id^="upper-I03"]')?(y*900<435?60:120):0);
   const offset=Math.hypot(+c.getAttribute('cx')-px,+c.getAttribute('cy')-py);
   return {label:g.dataset.label,group:g.dataset.group,number:+g.dataset.number,xRatio:x,yRatio:y,cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy'),anchorX:px,anchorY:py,offset,withinImage:x>=0&&x<=1&&y>=0&&y<=1,positionMatches:Math.abs(px-x*1200)<.1&&Math.abs(py-expectedY)<.1&&offset<=60};
  });
  const readingOrder=items=>{
   let pending=[...items];const reading=[];
   while(pending.length){const top=Math.min(...pending.map(a=>a.cy)),row=pending.filter(a=>a.cy<=top+60).sort((a,b)=>a.cx-b.cx);reading.push(...row);pending=pending.filter(a=>!row.includes(a));}
   return reading;
  };
  const groupOrderChecks=[];
  let nextNumber=1;
  const groupNames=[...new Set([...svg.querySelectorAll('.legend-item')].map(t=>t.dataset.group))];
  for(const group of groupNames){
   let reading=readingOrder(anchors.filter(a=>a.group===group));
   const priority=reading.find(a=>a.label===svg.dataset.priorityLabel);
   if(priority)reading=[priority,...reading.filter(a=>a!==priority)];
   const first=svg.dataset.numberingMode==='group-continuous'?nextNumber:1;
   groupOrderChecks.push({group,numbers:reading.map(a=>a.number),expectedStart:first,ok:reading.every((a,i)=>a.number===first+i)});
   nextNumber+=reading.length;
  }
  const markerCollisions=[];
  const circles=[...svg.querySelectorAll('.callout circle')].map(c=>({label:c.parentElement.dataset.label,x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')+parseFloat(getComputedStyle(c).strokeWidth)/2}));
  for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++){
   const a=circles[i],b=circles[j],gap=Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r;
   if(gap<0)markerCollisions.push({a:a.label,b:b.label,gap});
  }
  const legendCollisions=[];const legends=texts.filter(t=>t.legend);
  for(let i=0;i<legends.length;i++)for(let j=i+1;j<legends.length;j++){
   const a=legends[i],b=legends[j];
   if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)legendCollisions.push({a:a.text,b:b.text});
  }
  const legendColumnOK=legends.every(t=>Math.abs(t.x-15)<.1);
  const note=texts.find(t=>t.text==='細胞質');
  const cytoplasmSeparated=!note||legends.every(t=>note.y+note.h+3<=t.y);
  const lymphTitle=texts.find(t=>t.text==='淋巴系'),bCell=anchors.find(a=>a.label==='淋巴系：B 細胞');
  const lymphHeadingOK=!bCell||(lymphTitle&&Math.abs(lymphTitle.x+lymphTitle.w/2-bCell.cx)<40&&lymphTitle.y+lymphTitle.h+3<bCell.cy-32);
  const outline=svg.querySelector('.bacterium-outline'),drug50s=[...svg.querySelectorAll('.drug-50s')];
  const drugOutlineGaps=[];
  if(outline){
   const points=Array.from({length:4097},(_,i)=>outline.getPointAtLength(outline.getTotalLength()*i/4096));
   for(const t of drug50s){const b=t.getBBox();const gap=Math.min(...points.map(p=>Math.hypot(Math.max(b.x-p.x,p.x-b.x-b.width,0),Math.max(b.y-p.y,p.y-b.y-b.height,0))))-parseFloat(getComputedStyle(outline).strokeWidth)/2-parseFloat(getComputedStyle(t).strokeWidth)/2;
    drugOutlineGaps.push({text:t.textContent,gap});
   }
  }
  const leaders=[...svg.querySelectorAll('.leader')].map(el=>{
   const matrix=svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
   const p1=el.getPointAtLength(0).matrixTransform(matrix),p2=el.getPointAtLength(el.getTotalLength()).matrixTransform(matrix);
   return {a:{x:p1.x,y:p1.y},b:{x:p2.x,y:p2.y},length:el.getTotalLength()};
  });
  const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const on=(a,b,c)=>Math.abs(orient(a,b,c))<.001&&c.x>=Math.min(a.x,b.x)-.001&&c.x<=Math.max(a.x,b.x)+.001&&c.y>=Math.min(a.y,b.y)-.001&&c.y<=Math.max(a.y,b.y)+.001;
  const intersections=[];
  for(let i=0;i<leaders.length;i++)for(let j=i+1;j<leaders.length;j++){
   const {a,b}=leaders[i],{a:c,b:d}=leaders[j],o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);
   if((o1*o2<0&&o3*o4<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))intersections.push({i,j});
  }
  const igm=svg.querySelector('.igm-pentamer'),iga=svg.querySelector('.iga-dimer'),ribo=svg.querySelector('.ribosome');
  const structure={};
  if(ribo)structure.ribosome={count:svg.querySelectorAll('.ribosome').length,subunits:ribo.querySelectorAll('ellipse').length,largeAboveSmall:+ribo.querySelector('.subunit-50s').getAttribute('cy')<+ribo.querySelector('.subunit-30s').getAttribute('cy')};
  if(igm){
   const polygon=igm.querySelector('polygon'),vs=[...polygon.points].map(p=>({x:p.x,y:p.y}));
   const tailDistances=[...igm.querySelectorAll('.antibody-monomer')].map(g=>{const m=svg.getScreenCTM().inverse().multiply(g.getScreenCTM()),p=new DOMPoint(0,100).matrixTransform(m);return Math.min(...vs.map(v=>Math.hypot(v.x-p.x,v.y-p.y)));});
   structure.igm={monomers:tailDistances.length,vertices:vs.length,maxTailDistance:Math.max(...tailDistances),jChain:!!igm.querySelector('.j-chain')};
  }
  if(iga){
   const monomers=[...iga.querySelectorAll('.antibody-monomer')];
   const tails=monomers.map(g=>new DOMPoint(0,100).matrixTransform(svg.getScreenCTM().inverse().multiply(g.getScreenCTM())));
   const j=iga.querySelector('.j-chain'),ends=[j.getPointAtLength(0),j.getPointAtLength(j.getTotalLength())];
   const component=iga.querySelector('.secretory-component');
   const samples=Array.from({length:201},(_,i)=>component.getPointAtLength(component.getTotalLength()*i/200));
   const fcContactDistances=monomers.map(g=>{const m=svg.getScreenCTM().inverse().multiply(g.getScreenCTM());const points=[new DOMPoint(-9,75).matrixTransform(m),new DOMPoint(9,75).matrixTransform(m)];return Math.min(...points.flatMap(p=>samples.map(e=>Math.hypot(p.x-e.x,p.y-e.y))));});
   structure.iga={monomers:monomers.length,jTouchesBothFc:tails.every(p=>ends.some(e=>Math.hypot(p.x-e.x,p.y-e.y)<.1)),secretoryComponentTouchesFc:fcContactDistances.every(d=>d<13.4),fcContactDistances};
  }
  return {minPx:Math.min(...texts.map(t=>t.px)),texts,collisions,markerCollisions,legendCollisions,legendColumnOK,cytoplasmSeparated,lymphHeadingOK,drugOutlineGaps,anchors,groupOrderChecks,leaders,intersections,rasterHeight,heightRatio:rasterHeight?H/rasterHeight:null,structure,overflow:document.documentElement.scrollWidth>innerWidth};
 });
}
async function audit(page,slug,width,font,kind,id,selector,theme='warm',capture=true){
 const g=await geometry(page,selector),failures=[];
 if(g.minPx<(width===390?12:14))failures.push('font below minimum');
 if(g.texts.some(t=>t.clipped))failures.push('text outside viewBox');
 if(g.collisions.length)failures.push('text spacing below 3 viewBox units');
 if(g.markerCollisions.length)failures.push('overlapping numbered circles');
 if(g.legendCollisions.length)failures.push('overlapping legend text boxes');
 if(!g.legendColumnOK)failures.push('legend groups not in single column');
 if(!g.cytoplasmSeparated)failures.push('cytoplasm not above legend');
 if(!g.lymphHeadingOK)failures.push('lymph title not above B/T/NK column');
 if(g.drugOutlineGaps.some(d=>d.gap<12))failures.push('50S drug label gap below 12');
 if(font==='Noto Sans CJK TC'&&g.texts.some(t=>t.legend&&t.w>1080))failures.push('Noto legend width above 90%');
 if(g.overflow)failures.push('horizontal overflow');
 if(g.anchors.some(a=>!a.withinImage||!a.positionMatches))failures.push('invalid anchor coordinate or offset over 60');
 if(g.groupOrderChecks.some(g=>!g.ok))failures.push('group numbers outside reading order');
 if(g.intersections.length)failures.push('intersecting leaders');
 if(g.rasterHeight&&g.heightRatio>1.45+1e-8)failures.push('raster viewBox height over 1.45');
 if(g.rasterHeight&&g.leaders.some(l=>l.length>60))failures.push('raster leader over 60');
 if(g.structure.ribosome&&!(g.structure.ribosome.count===1&&g.structure.ribosome.subunits===2&&g.structure.ribosome.largeAboveSmall))failures.push('ribosome structure');
 if(g.structure.igm&&!(g.structure.igm.monomers===5&&g.structure.igm.vertices===5&&g.structure.igm.maxTailDistance<.1&&g.structure.igm.jChain))failures.push('IgM connected Fc ring');
 if(g.structure.iga&&!(g.structure.iga.monomers===2&&g.structure.iga.jTouchesBothFc&&g.structure.iga.secretoryComponentTouchesFc))failures.push('IgA Fc connection');
 const name=`${slug}-${width}-${font==='system-ui'?'system':font==='sans-serif'?'fallback':'noto'}-${kind}-${id}.png`;
 if(process.env.MI_FAST)capture=false;
 if(capture)await page.locator(selector).screenshot({path:path.join(out,name)});
 results.push({slug,width,font,theme,kind,id,screenshot:capture?name:null,...g,failures});
}
try{
 for(const slug of ['micro-bacteria-review','immuno-concepts-review']){
  const c=JSON.parse(fs.readFileSync(path.join(root,`materials-src/${slug}/content.json`))),original=JSON.parse(fs.readFileSync(path.join(root,`docs/micro-immuno-review/${slug}.content.json`)));
  validateMaterialContent(c);const clone={...c,credits:original.credits};assert.deepEqual(clone,original);
  const built=fs.readFileSync(path.join(root,`public/materials/${slug}-v1/index.html`),'utf8');
  const start=built.lastIndexOf('\nmount(')+7;let end=start,depth=0,quoted=false,escaped=false;
  for(;end<built.length;end++){const ch=built[end];if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;}else if(ch==='"')quoted=true;else if(ch==='{')depth++;else if(ch==='}'&&--depth===0){end++;break;}}
  assert.deepEqual(JSON.parse(built.slice(start,end)),c);
  const expectedCredits=original.credits.map(o=>Object.values(o).join('｜'));
  assert.deepEqual(c.credits,[...expectedCredits,'插圖由 AI（Gemini／ChatGPT）生成，經授課教師審訂（2026-10-10）']);
  contentChecks.push({slug,identicalExceptApprovedCredits:true,builtPayloadIdentical:true,validation:true,htmlBytes:fs.statSync(path.join(root,`public/materials/${slug}-v1/index.html`)).size});
  for(const font of ['system-ui','Noto Sans CJK TC','sans-serif'])for(const width of [1280,390]){
   if(process.env.MI_LAYOUT_ONLY&&width!==390)continue;
   const page=await open(slug,width,font,'light','no-preference');
   assert.deepEqual(await page.locator('.node-button').evaluateAll(rows=>rows.map(r=>r.dataset.node)),c.nodes.map(n=>n.id));
   assert.deepEqual(await page.locator('.stage').evaluateAll(rows=>rows.map(r=>r.dataset.questionId)),[...c.foundation,...c.cases].map(q=>q.id));
   for(const theme of process.env.MI_LAYOUT_ONLY?['warm']:['warm','cool']){
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    for(const state of c.lab.states){
     await page.locator(`button[data-lab-state="${state.id}"]`).click();await page.waitForTimeout(450);
     await audit(page,slug,width,font,'lab',state.id,'.state-figure svg',theme,theme==='warm');
     const visible=await page.locator('.state-figure').evaluate(el=>({state:el.dataset.state,secondary:el.querySelector('.secondary-response')?getComputedStyle(el.querySelector('.secondary-response')).display:null,positive:el.querySelector('.gram-positive')?getComputedStyle(el.querySelector('.gram-positive')).fill:null,negative:el.querySelector('.gram-negative')?getComputedStyle(el.querySelector('.gram-negative')).fill:null}));
     assert.equal(visible.state,state.id);
     if(slug==='immuno-concepts-review')assert.equal(visible.secondary,state.id==='primary'?'none':'inline');
     else{
      if(['crystal-violet','iodine','unstained'].includes(state.id))assert.equal(visible.positive,visible.negative);
      else assert.notEqual(visible.positive,visible.negative);
     }
     results.at(-1).stateAppearance=visible;
    }
    for(const n of c.nodes){
     await page.locator(`[data-node="${n.id}"]`).click();
     await audit(page,slug,width,font,'node',n.tag,`#detail-${n.id} svg`,theme,theme==='warm');
     await page.locator(`[data-close-node="${n.id}"]`).click();
    }
    if(font==='system-ui'&&!process.env.MI_FAST)await page.screenshot({path:path.join(out,`${slug}-${width}-${theme}-page.png`),fullPage:true});
   }
   await page.close();
  }
  for(const width of process.env.MI_LAYOUT_ONLY?[]:[1280,390]){
   const page=await open(slug,width,'system-ui','dark','reduce');
   const themeInfo=await page.evaluate(()=>({osDark:matchMedia('(prefers-color-scheme:dark)').matches,rootTheme:document.documentElement.dataset.theme||'default',background:getComputedStyle(document.documentElement).backgroundColor,themeSelectorAvailable:!!document.querySelector('[data-pref="theme"]')}));
   themeChecks.push({slug,width,...themeInfo,note:'Existing kit has warm/cool only; OS dark does not add a dark page skin. SVG white canvas keeps labels readable.'});
   if(!process.env.MI_FAST)await page.screenshot({path:path.join(out,`${slug}-${width}-os-dark-page.png`),fullPage:true});
   if(width===390){
    await page.locator(`button[data-lab-state="${c.lab.states.at(-1).id}"]`).click();
    const reduced=await page.locator('.state-figure svg').evaluate(svg=>({prefersReduce:matchMedia('(prefers-reduced-motion:reduce)').matches,transitions:[...svg.querySelectorAll('.gram-positive,.gram-negative')].map(el=>getComputedStyle(el).transitionDuration)}));
    assert.equal(reduced.prefersReduce,true);assert.ok(reduced.transitions.every(t=>t==='0s'));
    themeChecks.push({slug,width,reducedMotion:reduced});
    if(!process.env.MI_FAST)await page.screenshot({path:path.join(out,`${slug}-390-reduced-motion.png`),fullPage:true});
   }
   await page.close();
  }
  // Real DOM quiz interactions against offline SDK recorder, both required widths.
  for(const width of process.env.MI_LAYOUT_ONLY?[]:[1280,390]){
   const page=await open(slug,width);
   const node=c.nodes[0];await page.locator(`[data-node="${node.id}"]`).click();await page.waitForTimeout(120);
   await page.locator(`[data-close-node="${node.id}"]`).click();await page.locator(`[data-node="${node.id}"]`).click();await page.locator(`[data-close-node="${node.id}"]`).click();
   let events=await page.evaluate(()=>__events);assert.equal(events.filter(e=>e.kind==='explore'&&e.args[0]===node.id).length,1);
   assert.ok(events.filter(e=>e.kind==='nodeTime').length===2);assert.ok(events.filter(e=>e.kind==='nodeTime').every(e=>e.args[1]>0));
   const before=events.length;for(const s of c.lab.states)await page.locator(`button[data-lab-state="${s.id}"]`).click();
   if(slug==='immuno-concepts-review'){const slider=page.getByRole('slider',{name:'拖動免疫反應時間軸'});await slider.focus();await slider.press('End');assert.equal(await page.locator('.time-readout').textContent(),'再次反應：IgG 維持');await slider.press('Home');assert.equal(await page.locator('.time-readout').textContent(),'潛伏期');}
   await page.locator(`.predict [data-answer="${c.lab.predict.answer}"]`).click();assert.equal((await page.evaluate(()=>__events)).length,before);
   const f=c.foundation[0],wrong=(f.answer+1)%f.options.length;
   await page.locator(`.stage[data-kind="foundation"][data-index="0"] [data-answer="${wrong}"]`).click();
   assert.equal(await page.locator('.stage[data-kind="foundation"][data-index="1"]').isVisible(),false);
   for(let i=0;i<c.foundation.length;i++){
    const stage=page.locator(`.stage[data-kind="foundation"][data-index="${i}"]`);
    await stage.locator(`[data-answer="${c.foundation[i].answer}"]`).click();await stage.getByRole('button',{name:'繼續下一題',exact:true}).click();
   }
   assert.equal((await page.evaluate(()=>__events)).filter(e=>e.kind==='complete').length,0);
   const caseStage=page.locator('.stage[data-kind="case"][data-index="0"]');
   await caseStage.locator(`[data-answer="${(c.cases[0].answer+1)%4}"]`).click();
   assert.equal(await caseStage.getByRole('button',{name:'重新挑戰本關'}).isDisabled(),true);
   assert.equal((await page.evaluate(()=>__events)).filter(e=>e.kind==='complete').length,0);
   await caseStage.getByRole('button',{name:'前往對應節點複習'}).click();
   assert.equal(await page.locator(`#detail-${c.cases[0].nodeId}`).isVisible(),true);
   await caseStage.getByRole('button',{name:'重新挑戰本關'}).click();
   for(let i=0;i<c.cases.length;i++){
    const stage=page.locator(`.stage[data-kind="case"][data-index="${i}"]`);
    await stage.locator(`[data-answer="${c.cases[i].answer}"]`).click();
    assert.equal((await page.evaluate(()=>__events)).filter(e=>e.kind==='complete').length,i===c.cases.length-1?1:0);
    await stage.getByRole('button',{name:i===c.cases.length-1?'查看通關結果':'繼續下一題',exact:true}).click();
   }
   events=await page.evaluate(()=>__events);assert.equal(events.filter(e=>e.kind==='complete').length,1);
   assert.equal(events.filter(e=>e.kind==='answer').length,13);
   assert.equal(events.filter(e=>e.kind==='answer'&&!e.args[1]).length,2);
   assert.equal(await page.locator('.complete-banner').isVisible(),true);
   sdk.push({slug,width,ok:true,events});await page.close();
  }
 }
}catch(e){errors.push({error:e.stack});}finally{await browser.close();}
const failed=results.filter(r=>r.failures.length);
const report={ok:!failed.length&&!errors.length,geometryStates:results.length,failedStates:failed.length,pageErrors:errors,fontPath,fonts:['system-ui','Noto Sans CJK TC','sans-serif'],contentChecks,themeChecks,sdk,results};
fs.writeFileSync(path.join(root,'docs/micro-immuno-review/verification-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ok:report.ok,states:results.length,failures:failed.map(r=>({slug:r.slug,width:r.width,font:r.font,theme:r.theme,kind:r.kind,id:r.id,failures:r.failures,collisions:r.collisions,markerCollisions:r.markerCollisions,legendCollisions:r.legendCollisions,drugOutlineGaps:r.drugOutlineGaps,clipped:r.texts.filter(t=>t.clipped)})),errors,sdkFlows:sdk.length},null,2));
if(!report.ok)process.exitCode=1;
