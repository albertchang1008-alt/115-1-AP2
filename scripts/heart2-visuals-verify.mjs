// Both visual specs: byte preservation, visual QA, interactive behavior and complete flows.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..'),base='f0f9028',out=path.join(root,'docs/heart2-visuals-screenshots');fs.mkdirSync(out,{recursive:true});
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),old=p=>execFileSync('git',['show',`${base}:${p}`],{cwd:root,maxBuffer:64*1024*1024}),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const slugs=['cardiac-output','major-vessels','blood-pressure-measurement','capillary-exchange'];
const preservation=[];
for(const slug of slugs){
 const p=`materials-src/${slug}/content.json`,s=read(p),o=old(p).toString(),c=JSON.parse(s),before=JSON.parse(o);
 const extract=(s,key)=>s.slice(s.indexOf(`  "${key}":`),s.indexOf(key==='foundation'?'  "cases":':'  "credits":'));
 for(const k of ['foundation','cases']){assert.equal(extract(s,k),extract(o,k),slug+' '+k+' exact bytes');preservation.push({slug,section:k,sha256:hash(extract(s,k)),bytesUnchanged:true});}
 assert.deepEqual(c.lab.predict,before.lab.predict);assert.deepEqual(c.nodes.map(n=>n.id),before.nodes.map(n=>n.id));
 const prediction=s=>s.match(/    "predict": (\{[\s\S]*?^    \})/m)[1];assert.equal(prediction(s),prediction(o));preservation.push({slug,section:'lab.predict',sha256:hash(prediction(s)),bytesUnchanged:true});
 preservation.push({slug,section:'node IDs',sha256:hash(JSON.stringify(c.nodes.map(n=>n.id))),bytesUnchanged:true});
 const built=read(`public/materials/${slug}-v1/index.html`);assert(built.includes(JSON.stringify(c).replace(/</g,'\\u003c')));
}
const manual='public/materials/cardiac-electrical-v1/index.html',m=read(manual),before=old(manual).toString();
for(const key of ['N','A','B']){const extract=s=>s.match(new RegExp('const '+key+'=(.*?);\\n'))[1];assert.equal(extract(m),extract(before));preservation.push({slug:'cardiac-electrical',section:key,sha256:hash(extract(m)),bytesUnchanged:true});}
const tracking=s=>s.slice(s.indexOf('/* 平台紀錄：'),s.indexOf('const visual=')).replace(/const HEART2_VISUALS=.*?;\n/,'');
assert.equal(tracking(m),tracking(before));
// Quiz script and all original tracking calls remain literally unchanged.
const quiz=s=>s.slice(s.indexOf('/* 兩階段')>=0?s.indexOf('/* 兩階段'):s.indexOf('let stage='));
if(quiz(m).length>0)assert.equal(quiz(m),quiz(before));
for(const p of ['html/資訊圖表題庫_上傳用.xlsx','public/materials/ecg-basics-v1/index.html','materials-src/ecg-basics/content.json','shared/materials.ts']){const now=fs.readFileSync(path.join(root,p));assert(now.equals(old(p)),p);preservation.push({path:p,sha256:hash(now),bytesUnchanged:true});}
const config=JSON.parse(read('scripts/material-taiwan-terms.json')),scan=[];
for(const dir of ['materials-src','public/materials']){const walk=p=>{for(const f of fs.readdirSync(p,{withFileTypes:true})){const q=path.join(p,f.name);if(f.isDirectory())walk(q);else{const s=fs.readFileSync(q).toString();for(const term of config.scanTerms)if(s.includes(term))scan.push({path:path.relative(root,q),term});for(const term of ['⚠️','請教師','教師決定','待教師'])if(s.includes(term))scan.push({path:path.relative(root,q),term});}}};walk(path.join(root,dir));}assert.deepEqual(scan,[]);
const unchangedPublic=[];
for(const p of execFileSync('git',['ls-files','public/materials'],{cwd:root}).toString().trim().split('\n')){if([...slugs,'cardiac-electrical'].some(slug=>p===`public/materials/${slug}-v1/index.html`))continue;assert(fs.readFileSync(path.join(root,p)).equals(old(p)),p+' unauthorized public edit');unchangedPublic.push(p);}
for(const slug of fs.readdirSync(path.join(root,'materials-src')).filter(s=>fs.existsSync(path.join(root,`materials-src/${s}/content.json`))&&!slugs.includes(s))){const p=`materials-src/${slug}/content.json`;assert(fs.readFileSync(path.join(root,p)).equals(old(p)),p+' unchanged other content');preservation.push({path:p,sha256:hash(old(p)),bytesUnchanged:true});}
if(process.argv.includes('--preservation-only')){fs.writeFileSync(path.join(root,'docs/HEART2_VISUALS_PRESERVATION.json'),JSON.stringify({base,preservation,unchangedPublic,scanMatches:scan},null,2)+'\n');console.log('Preservation and full terminology / draft scan passed');process.exit(0);}
const results=[],sdk='window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>events.push({k,args})]));';
const browser=await chromium.launch({channel:'chrome'});
const measurement=async loc=>loc.evaluate(el=>[...el.querySelectorAll('svg text')].filter(t=>t.getBoundingClientRect().width>0).map(t=>{const s=t.ownerSVGElement,r=s.getBoundingClientRect().width/s.viewBox.baseVal.width,b=t.getBBox();return {text:t.textContent,px:parseFloat(getComputedStyle(t).fontSize)*r,clipped:b.x<-.5||b.y<-.5||b.x+b.width>s.viewBox.baseVal.width+.5||b.y+b.height>s.viewBox.baseVal.height+.5};}));
try{for(const slug of [...slugs,'cardiac-electrical'])for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844}}),errors=[],shots=[],labels=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.route('**/materials/course-learning.js',r=>r.fulfill({body:sdk,contentType:'application/javascript'}));await page.goto('file://'+path.join(root,`public/materials/${slug}-v1/index.html`));
 assert.equal(await page.evaluate(()=>events.length),0);
 const shot=async(name,loc)=>{const file=`${slug}-${width}-${name}.png`;await loc.screenshot({path:path.join(out,file)});shots.push(file);labels.push(...await measurement(loc));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);};
 if(slug==='cardiac-electrical'){
  for(const i of [0,3,7]){await page.locator('#nodes .node').nth(i).click();await shot(`node-${i+1}`,page.locator('#vis'));}
  await shot('misconceptions',page.locator('.misconceptions'));
  for(let i=0;i<9;i++)await page.locator('#nodes .node').nth(i).click();
  await page.locator('#quiz').click();
  for(let i=0;i<6;i++){const q=await page.evaluate(()=>list[idx]);await page.locator('#opts').getByRole('button',{name:q[2][0],exact:true}).click();await page.locator('#next').click();}
  const wrong=await page.evaluate(()=>list[idx][2][1]);await page.locator('#opts').getByRole('button',{name:wrong,exact:true}).click();
  for(let i=0;i<5;i++){const q=await page.evaluate(()=>list[idx]);await page.locator('#opts').getByRole('button',{name:q[2][0],exact:true}).click();await page.locator('#next').click();}
  assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),0);assert(await page.locator('#retry').isDisabled());await page.locator('#failLinks button').first().click();await page.locator('#quiz').click();await page.locator('#retry').click();
  for(let i=0;i<5;i++){const q=await page.evaluate(()=>list[idx]);await page.locator('#opts').getByRole('button',{name:q[2][0],exact:true}).click();assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),i===4?1:0);await page.locator('#next').click();}
 }else{
  const c=JSON.parse(read(`materials-src/${slug}/content.json`));
  if(c.lab.widget==='bp-cuff'){
   for(const p of [150,120,100,80,70]){await page.locator('#cuff-pressure').fill(String(p));assert.equal(await page.locator('.bp-cuff').getAttribute('data-phase'),p>120?'closed':p>80?'turbulent':'open');await shot('cuff-'+p,page.locator('.lab'));}
   await page.locator('#cuff-pressure').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#cuff-pressure').inputValue(),'71');
   await page.locator('[data-cuff-reset]').click();await page.locator('[data-cuff-play]').click();await page.waitForTimeout(1100);assert.equal(await page.locator('#cuff-pressure').inputValue(),'147');await shot('cuff-auto',page.locator('.lab'));await page.locator('[data-cuff-play]').click();
  }else{for(const state of c.lab.states){await page.locator(`button[data-lab-state="${state.id}"]`).click();await shot('lab-'+state.id,page.locator('.lab'));}}
  await page.locator(`.predict [data-answer="${c.lab.predict.answer}"]`).click();assert.equal(await page.locator('.predict-result').textContent(),'✓ 答對了！'+c.lab.predict.feedback);
  if(c.overview){
   const tree=page.locator('.factor-tree'),leaf=slug==='cardiac-output'?'afterload':'lymph-flow';
   await shot('tree-unselected',tree);await tree.locator(`[data-factor="${leaf}"]`).click();assert.match(await tree.locator('[data-factor="root"]').textContent(),/↓ 減少/);await shot('tree-up',tree);
   await tree.locator('[data-factor-change="-1"]').click();assert.match(await tree.locator('[data-factor="root"]').textContent(),/↑ 增加/);await shot('tree-down',tree);
   if(slug==='cardiac-output'){await tree.locator('[data-factor="too-fast"]').click();assert.match(await tree.locator('#factor-explain').textContent(),/CO 不一定增加/);await shot('tree-too-fast',tree);}
   for(const [factor,sign] of Object.entries(slug==='cardiac-output'?{ne:1,ach:-1,epinephrine:1,preload:1,contractility:1,afterload:-1}:{hydrostatic:1,oncotic:-1,'lymph-flow':-1})){
    await tree.locator(`[data-factor="${factor}"]`).click();for(const dir of [1,-1]){await tree.locator(`[data-factor-change="${dir}"]`).click();assert.match(await tree.locator('[data-factor="root"]').textContent(),sign*dir>0?/↑ 增加/:/↓ 減少/);}
   }
   await tree.locator('[data-factor-reset]').click();assert.equal(await tree.locator('.factor-active').count(),0);
   assert.equal(await tree.locator('[data-factor-change="1"]').getAttribute('aria-pressed'),'true');
  }
  if(c.extras)await shot('pulse',page.locator('.extras'));await shot('misconceptions',page.locator('.misconceptions'));
  assert.equal(await page.evaluate(()=>events.length),0,'new widgets / predictions / overview add no tracking');
  // Every leaf uses native buttons; keyboard activation and related-node reveal use existing IDs.
  if(c.overview){const tree=page.locator('.factor-tree');await tree.locator('[data-factor]').nth(2).focus();await page.keyboard.press('Enter');await tree.locator('[data-factor-node]').click();assert.equal(await page.locator('.node-detail:not([hidden])').count(),1);}
  for(const n of c.nodes){const b=page.locator(`[data-node="${n.id}"]`);if(await b.getAttribute('aria-expanded')!=='true')await b.click();await shot(n.id,page.locator('#detail-'+n.id));
   if(slug==='major-vessels'&&n.id.endsWith('06')){const targets=await page.locator('#detail-'+n.id+' svg').evaluate(svg=>{const paths=[...svg.querySelectorAll('path')].filter(p=>+p.getAttribute('stroke-width')>=4&&p.getAttribute('stroke')==='#1769aa');return [...svg.querySelectorAll('circle')].filter(c=>c.getAttribute('r')==='3').map(c=>{const x=+c.getAttribute('cx'),y=+c.getAttribute('cy');return {x,y,onVessel:paths.some(p=>{for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)if(p.isPointInStroke(new DOMPoint(x+a,y+b)))return true;return false;})};});});assert(targets.every(t=>t.onVessel),JSON.stringify(targets));
    const overlap=await page.locator('#detail-'+n.id+' svg').evaluate(svg=>{const ts=[...svg.querySelectorAll('text')].map(t=>({s:t.textContent,b:t.getBBox()}));return ts.flatMap((t,i)=>ts.slice(i+1).filter(u=>Math.min(t.b.x+t.b.width,u.b.x+u.b.width)>Math.max(t.b.x,u.b.x)&&Math.min(t.b.y+t.b.height,u.b.y+u.b.height)>Math.max(t.b.y,u.b.y)).map(u=>[t.s,u.s]));});assert.deepEqual(overlap,[]);
   }await b.click();}
  for(let i=0;i<c.foundation.length;i++){const stage=page.locator(`[data-kind="foundation"][data-index="${i}"]`);await stage.locator(`[data-answer="${c.foundation[i].answer}"]`).click();await stage.locator('.feedback button').click();}
  const first=page.locator('[data-kind="case"][data-index="0"]');await first.locator(`[data-answer="${(c.cases[0].answer+1)%4}"]`).click();assert(await first.getByText('重新挑戰本關').isDisabled());assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),0);await first.getByText('前往對應節點複習').click();await first.getByText('重新挑戰本關').click();
  for(let i=0;i<c.cases.length;i++){const stage=page.locator(`[data-kind="case"][data-index="${i}"]`);await stage.locator(`[data-answer="${c.cases[i].answer}"]`).click();assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),i===4?1:0);await stage.locator('.feedback button').click();}
 }
 const expected=slug==='cardiac-electrical'?9:6,explored=await page.evaluate(()=>events.filter(e=>e.k==='explore').map(e=>e.args[0]));assert.equal(explored.length,expected);assert.equal(new Set(explored).size,expected);assert((await page.evaluate(()=>events.filter(e=>e.k==='nodeTime').length))>=expected-1);
 const bad=labels.filter(t=>t.px<12||t.clipped);assert.deepEqual(errors,[]);assert.deepEqual(bad,[],slug+' '+width+' text geometry');
 results.push({slug,width,shots,minimumFigureTextPx:Math.min(...labels.map(t=>t.px)),noClipping:true,noOverflow:true,exploreOnce:expected,nodeTime:true,retryRequiresReview:true,completeOnFinalAnswer:true,newWidgetsNoEvents:true,errors});await page.close();console.log(slug,width,'passed');
}}finally{await browser.close();fs.writeFileSync(path.join(root,'docs/HEART2_VISUALS_VERIFY.json'),JSON.stringify({base,preservation,unchangedPublic,scanMatches:scan,results},null,2)+'\n');}
