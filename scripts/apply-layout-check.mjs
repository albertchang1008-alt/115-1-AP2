import {hasStudentPlan} from '../materials-src/apply-kit/scripted-render.mjs';
import {checkApplyScript} from './lib/apply-script-check.mjs';
import{checkScriptLayout}from'./lib/acidbase-script-layout.mjs';
import{isFull}from'../materials-src/apply-kit/full-render.mjs';
import{checkFullLayout}from'./lib/acidbase-full-layout.mjs';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import{renderApply}from'../materials-src/apply-kit/render.mjs';import{unwrap}from'../materials-src/apply-kit/model.mjs';
const args=process.argv.slice(2),get=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1]},file=args[0];
if(!file||!get('--out'))throw Error('Usage: apply-layout-check.mjs <apply.json> --out <evidence-directory> [--html bad-fixture.html]');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
if(hasStudentPlan(path.dirname(path.resolve(file)))){const r=await checkApplyScript(file,{out:path.resolve(get('--out')),html:get('--html')});console.log(JSON.stringify({summary:r.summary,diff:r.diff}));process.exit(r.summary.fail||!r.diff.pass?1:0);}

if(isFull(data)){const summary=await checkScriptLayout(data,{file,out:path.resolve(get('--out')),html:get('--html')});console.log(JSON.stringify(summary));process.exit(summary.fail?1:0);}
const states=unwrap(data).lab.states.map(s=>s.id);
const out=path.resolve(get('--out'));if(out.includes(`${path.sep}public${path.sep}`))throw Error('Check output cannot write public');fs.mkdirSync(path.join(out,'shots'),{recursive:true});
const input=path.join(out,'checked-lab.html');fs.writeFileSync(input,get('--html')?fs.readFileSync(get('--html'),'utf8'):renderApply(data,{baseDir:path.dirname(path.resolve(file))}));
const sizes=[[360,667],[390,844],[414,896],[768,1024],[820,1180],[1024,1366],[1280,800],[844,390]];
const browser=await chromium.launch({headless:true});
const results=[];
for(const [w,h] of sizes){
 const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(pathToFileURL(input).href);await page.evaluate(()=>document.fonts.ready);
 for(const state of states){
  await page.locator(`button[data-state="${state}"]`).click();await page.waitForTimeout(750);
  const data=await page.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
   const selector=e=>e.id?'#'+e.id:e.tagName.toLowerCase()+'.'+[...e.classList].join('.');
   const visible=e=>{const c=getComputedStyle(e);const b=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&b.width>0&&b.height>0};
   const ownText=e=>[...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
   const clipping=[],undersized=[],outside=[],svgClipping=[],overlaps=[];
   const vp={right:innerWidth,bottom:innerHeight};
   for(const e of document.querySelectorAll('body *')){
    if(!visible(e)||e instanceof SVGElement||['SCRIPT','STYLE'].includes(e.tagName))continue;
    const r=box(e),c=getComputedStyle(e),text=e.textContent.trim();
    if(r.x<-.75||r.y<-.75||r.right>vp.right+.75||r.bottom>vp.bottom+.75)outside.push({selector:selector(e),text:text.slice(0,80),box:r});
    if(ownText(e)){
     if(e.scrollWidth>e.clientWidth+1)clipping.push({selector:selector(e),text,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,textOverflow:c.textOverflow});
     const badge=e.matches('.solid-badge,.top-badge,.shape-marker');const min=badge?12:14;
     if(parseFloat(c.fontSize)<min)undersized.push({selector:selector(e),text,fontSize:parseFloat(c.fontSize),min});
    }
   }
   const svg=document.querySelector('svg'),svgb=box(svg),pane=box(document.querySelector('.figure-pane'));
   for(const t of svg.querySelectorAll('text')){
    if(!visible(t))continue;
    const r=box(t),m=t.getScreenCTM(),scale=Math.hypot(m.a,m.b),size=parseFloat(getComputedStyle(t).fontSize)*scale,badge=!!t.closest('.p2p-badge-slot');
    if(size<(badge?12:14))undersized.push({selector:selector(t),text:t.textContent,fontSize:size,designFont:parseFloat(getComputedStyle(t).fontSize),scale,min:badge?12:14});
    if(r.x<svgb.x-.75||r.right>svgb.right+.75||r.y<svgb.y-.75||r.bottom>svgb.bottom+.75)svgClipping.push({selector:selector(t),text:t.textContent,box:r,svgBox:svgb});
   }
   for(const group of svg.querySelectorAll('[data-tag]')){
    const label=[...group.querySelectorAll('.p2p-lbl-text')].find(visible),badge=group.querySelector('.p2p-badge-slot');
    if(!label||!badge||!visible(badge))continue;const a=box(label),b=box(badge);
    if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)overlaps.push({tag:group.dataset.tag,text:label.textContent,label:a,badge:b});
   }
   const sc=document.querySelector('.changes-scroll-area'),main=document.querySelector('main'),panel=document.querySelector('.panel-pane');
   return {activeState:document.querySelector('.btn-tab.active').dataset.state,svgState:svg.getAttribute('class'),main:box(main),figure:pane,panel:box(panel),direction:getComputedStyle(main).flexDirection,documentSize:{sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.documentElement.scrollHeight,ch:document.documentElement.clientHeight},scrollList:{scrollHeight:sc.scrollHeight,clientHeight:sc.clientHeight},clipping,undersized,outside,svgClipping,overlaps,changes:[...document.querySelectorAll('.factor-card')].map(e=>({text:e.innerText,box:box(e)})),animations:document.getAnimations().map(a=>({name:a.animationName,playState:a.playState,iterations:a.effect.getTiming().iterations})),visibleIndicators:[...document.querySelectorAll('.organ-indicator')].filter(visible).map(e=>({class:e.getAttribute('class'),transform:getComputedStyle(e).transform,box:box(e)}))};
  });
  data.width=w;data.height=h;data.state=state;data.consoleErrors=errors;
  const stateConfig=unwrap(JSON.parse(fs.readFileSync(file,'utf8'))).lab.states.find(s=>s.id===state);data.neutralChecks=await page.evaluate(({mode,relation})=>({focusBadges:mode==='focus'?document.querySelectorAll('.label-layer .solid-badge,.factor-card .solid-badge,.factor-card .shape-marker,#causal-flow .solid-badge,.organ-indicator').length:0,parallelArrows:relation==='parallel'?document.querySelectorAll('#causal-flow .causal-link').length:0}),stateConfig);
  data.pass=data.neutralChecks.focusBadges===0&&data.neutralChecks.parallelArrows===0&&data.consoleErrors.length===0&&data.documentSize.sw<=data.documentSize.cw&&data.documentSize.sh<=data.documentSize.ch&&data.clipping.length===0&&data.undersized.length===0&&data.outside.length===0&&data.svgClipping.length===0&&data.overlaps.length===0&&data.scrollList.scrollHeight<=data.scrollList.clientHeight+1;
  await page.screenshot({path:path.join(out,'shots',`${w}x${h}-${state}.png`)});
  // Open the actual unchanged-items control, record whether expansion clips/scrolls.
  await page.locator('#p2p-toggle-unchanged').click();
  data.expanded=await page.evaluate(()=>{const e=document.querySelector('#p2p-unchanged-tags'),p=document.querySelector('.panel-pane'),list=document.querySelector('.changes-scroll-area');return {open:e.classList.contains('open'),bottom:e.getBoundingClientRect().bottom,panelBottom:p.getBoundingClientRect().bottom,clientHeight:list.clientHeight,scrollHeight:list.scrollHeight}});
  await page.locator('#p2p-toggle-unchanged').click();
  results.push(data);console.log(`${w}x${h} ${state}: ${data.pass?'PASS':'FAIL'} clip=${data.clipping.length} small=${data.undersized.length} outside=${data.outside.length} svgClip=${data.svgClipping.length} overlap=${data.overlaps.length} list=${data.scrollList.scrollHeight}/${data.scrollList.clientHeight}`);
 }
 await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();await page.goto(pathToFileURL(input).href);
const reduced=[];for(const state of states.slice(-2)){await page.locator(`button[data-state="${state}"]`).click();await page.waitForTimeout(100);reduced.push(await page.evaluate(()=>({state:document.querySelector('.btn-tab.active').dataset.state,match:matchMedia('(prefers-reduced-motion: reduce)').matches,animations:document.getAnimations().map(a=>({name:a.animationName,playState:a.playState})),indicators:[...document.querySelectorAll('.organ-indicator')].map(e=>({class:e.getAttribute('class'),display:getComputedStyle(e).display,animation:getComputedStyle(e).animationName}))})));await page.screenshot({path:path.join(out,'shots',`reduced-motion-${state}.png`)});}
await context.close();await browser.close();
fs.writeFileSync(path.join(out,'layout-results.json'),JSON.stringify({input,results,reduced,summary:{cases:results.length,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,skipped:0}},null,2)+'\n');

if(results.some(r=>!r.pass))process.exitCode=1;
