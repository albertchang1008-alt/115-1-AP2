import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'docs/stage1-screenshots');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),results=[];
const sdk='window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>events.push({k,args})]));';
const waitScroll=async()=>new Promise(r=>setTimeout(r,800));
try{
 for(const slug of ['cardiac-electrical','rbc-homeostasis'])for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
  page.on('requestfailed',r=>console.log('FAILED REQUEST',slug,width,r.url(),r.failure()));
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route('**/materials/course-learning.js',r=>r.fulfill({body:sdk,contentType:'application/javascript'}));
  await page.goto('file://'+path.join(root,'public/materials',slug+'-v1/index.html'));
  assert.equal(await page.evaluate(()=>events.length),0,'No load-time explore');
  const questions=await page.evaluate(slug=>slug==='cardiac-electrical'?[...A,...B].map(q=>({id:q[0],stem:q[1],options:q[2],answer:0})): [...FOUNDATION_QUESTIONS,...CASE_QUESTIONS].map(q=>({id:q.id,stem:q.title,options:q.options,answer:q.answer})),slug);
  const nodeCount=slug==='cardiac-electrical'?9:6,geometry=[],labels=[];
  for(let i=1;i<=nodeCount;i++){
   const button=slug==='cardiac-electrical'?page.locator('#nodes .node').nth(i-1):page.locator('#flow-card-node-0'+i);
   await button.click();await waitScroll();
   const detail=slug==='cardiac-electrical'?page.locator('#vis'):page.locator('#node-card-0'+i);
   const top=await detail.evaluate(el=>el.getBoundingClientRect().top);
   assert(top>=-1&&top<844,`${slug} node ${i}: detail top ${top}`);geometry.push({node:i,top});
   const nodeLabels=await page.evaluate(()=>[...document.querySelectorAll('svg text')].filter(t=>t.getBoundingClientRect().width>0).map(t=>({text:t.textContent,px:parseFloat(getComputedStyle(t).fontSize)*t.ownerSVGElement.getBoundingClientRect().width/t.ownerSVGElement.viewBox.baseVal.width})).filter(x=>Number.isFinite(x.px)));
   assert(!nodeLabels.some(t=>t.px<12),JSON.stringify(nodeLabels.filter(t=>t.px<12)));labels.push(...nodeLabels);
   if([1,4].includes(i))await page.screenshot({path:path.join(output,`${slug}-${width}-node-${i}.png`)});
   await button.click();
  }
  assert.deepEqual(await page.evaluate(()=>events.filter(e=>e.k==='explore').map(e=>e.args[0]).sort()),Array.from({length:nodeCount},(_,i)=>`${slug}-node-${String(i+1).padStart(2,'0')}`).sort());
  assert((await page.evaluate(()=>events.filter(e=>e.k==='nodeTime').length))>=nodeCount-1);
  if(slug==='cardiac-electrical'){
   await page.locator('#quiz').click();
   for(let i=0;i<6;i++){
    const q=await page.evaluate(()=>list[idx]);await page.locator('#opts').getByRole('button',{name:q[2][0],exact:true}).click();await page.locator('#next').click();
   }
   // Wrong once, finish the round, verify retry gate until the review link is used.
   const wrong=await page.evaluate(()=>list[idx][2][1]);await page.locator('#opts').getByRole('button',{name:wrong,exact:true}).click();
   for(let i=0;i<5;i++){
    const q=await page.evaluate(()=>list[idx]);await page.locator('#opts').getByRole('button',{name:q[2][0],exact:true}).click();await page.locator('#next').click();
   }
   assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),0);
   assert.equal(await page.locator('#retry').isDisabled(),true);
   await page.locator('#failLinks button').first().click();await waitScroll();
   await page.screenshot({path:path.join(output,`${slug}-${width}-review.png`)});
   await page.locator('#quiz').click();await page.locator('#retry').click();
   for(let i=0;i<5;i++){
    const q=await page.evaluate(()=>list[idx]);await page.locator('#opts').getByRole('button',{name:q[2][0],exact:true}).click();
    assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),i===4?1:0);
    await page.locator('#next').click();
   }
  }else{
   await page.locator('#btn-mode-quiz').click();
   for(let i=0;i<6;i++){
    const q=await page.evaluate(()=>FOUNDATION_QUESTIONS[s1CurrentIndex]);await page.locator('#s1-options-container').getByRole('button',{name:q.options[q.answer],exact:true}).click();await page.locator('#s1-next-btn').click();
   }
   const first=await page.evaluate(()=>s2Questions[s2CurrentIndex]);const wrong=first.options.find((_,i)=>i!==first.answer);
   await page.locator('#s2-options-container').getByRole('button',{name:wrong,exact:true}).click();
   assert.equal(await page.locator('#s2-next-btn').isDisabled(),true);
   await page.locator('#s2-review-link').click();await page.waitForTimeout(2200);
   await page.screenshot({path:path.join(output,`${slug}-${width}-review.png`)});
   await page.locator('#btn-mode-quiz').click();await page.locator('#s2-next-btn').click();
   for(let i=1;i<5;i++){
    const q=await page.evaluate(()=>s2Questions[s2CurrentIndex]);await page.locator('#s2-options-container').getByRole('button',{name:q.options[q.answer],exact:true}).click();await page.locator('#s2-next-btn').click();
   }
   assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),0);
   await page.locator('#btn-retry-s2').click();
   for(let i=0;i<5;i++){
    const q=await page.evaluate(()=>s2Questions[s2CurrentIndex]);await page.locator('#s2-options-container').getByRole('button',{name:q.options[q.answer],exact:true}).click();
    assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),i===4?1:0);
    await page.locator('#s2-next-btn').click();
   }
  }
  assert.equal(await page.evaluate(()=>events.filter(e=>e.k==='complete').length),1);
  // SVG labels and raster diagram load state.
  const finalLabels=await page.evaluate(()=>[...document.querySelectorAll('svg text')].filter(t=>t.getBoundingClientRect().width>0).map(t=>({text:t.textContent,px:parseFloat(getComputedStyle(t).fontSize)*t.ownerSVGElement.getBoundingClientRect().width/t.ownerSVGElement.viewBox.baseVal.width})).filter(x=>Number.isFinite(x.px)));
  assert(!finalLabels.some(t=>t.px<12),JSON.stringify(finalLabels.filter(t=>t.px<12)));
  assert(await page.evaluate(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0)));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  results.push({slug,width,nodeCount,geometry,questions,labels,noInitialExplore:true,exploreOnce:true,nodeTime:true,retryRequiresReview:true,completeOnFinalAnswer:true,errors});await page.close();
 }
 fs.writeFileSync(path.join(root,'docs/STAGE1_DRAFTS_VERIFY.json'),JSON.stringify(results,null,2)+'\n');console.log(results.map(({questions,labels,...r})=>r));
}finally{await browser.close()}
