import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..'),out=root+'/docs/learning-refresh-screenshots';fs.mkdirSync(out,{recursive:true});
const manual=JSON.parse(fs.readFileSync(root+'/materials-src/manual-presentation-targets.json','utf8'));
const kits=fs.readdirSync(root+'/materials-src').filter(s=>fs.existsSync(root+`/materials-src/${s}/content.json`));
const targets=[...kits.map(s=>s+'-v1'),...manual],results=[],browser=await chromium.launch({channel:'chrome'});
const sdk='window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>events.push({k,args})]));';
try{for(const id of targets)for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.route('**/course-learning.js',r=>r.fulfill({body:sdk,contentType:'application/javascript'}));
 await page.goto('file://'+root+`/public/materials/${id}/index.html`);
 assert.equal(await page.locator('.learning-summary').count(),1,id+' summary');
 assert(await page.locator('.learning-summary').isVisible(),id+' summary visible on reading page');
 assert.equal(await page.locator('[data-pref="theme"]').count(),0);
 const geometry=await page.locator('.learning-summary').evaluate(el=>({summaryWidth:el.getBoundingClientRect().width,tableWidth:el.querySelector('table').getBoundingClientRect().width,font:parseFloat(getComputedStyle(el.querySelector('td')).fontSize),rows:el.querySelectorAll('tbody tr').length,accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()}));
 assert(geometry.rows>=4);assert(geometry.font>=16);assert(geometry.tableWidth<=geometry.summaryWidth);assert(geometry.accent);
 if(width===390)assert((await page.locator('.learning-summary caption').boundingBox()).height<200,id+' mobile caption must wrap horizontally');
 let feedback=null;
 if(kits.includes(id.replace(/-v1$/,''))){
  const content=JSON.parse(fs.readFileSync(root+`/materials-src/${id.replace(/-v1$/,'')}/content.json`));
  assert.equal(await page.evaluate(()=>events.length),0);
  if(content.lab.predict){
   const correct=content.lab.predict.answer,wrong=(correct+1)%content.lab.predict.options.length;
   await page.locator(`.predict [data-answer="${wrong}"]`).click();assert.match(await page.locator('.predict-result').textContent(),/✗ 尚未答對/);
   assert(await page.locator(`.predict [data-answer="${wrong}"]`).evaluate(el=>el.classList.contains('predict-wrong')));
   await page.locator(`.predict [data-answer="${correct}"]`).click();assert.match(await page.locator('.predict-result').textContent(),/✓ 答對了/);
   assert(await page.locator(`.predict [data-answer="${correct}"]`).evaluate(el=>el.classList.contains('predict-correct')));feedback=true;
  }
 }
 if(id==='rbc-homeostasis-v1'){
  assert.equal(await page.locator('.visual-art svg').count(),4);
  const art=await page.locator('.visual-art').evaluateAll(xs=>xs.map(x=>({background:getComputedStyle(x).backgroundImage,text:x.textContent})));assert(art.every(a=>a.background==='none'));assert.equal(new Set(art.map(a=>a.text)).size,4);
  await page.locator('[data-rbc-answer="wrong"]').click();assert.match(await page.locator('#rbc-predict-feedback').textContent(),/尚未答對/);
  await page.locator('[data-rbc-answer="correct"]').click();assert.match(await page.locator('#rbc-predict-feedback').textContent(),/答對了/);
  const sizes=await page.locator('.visual-art svg').evaluateAll(xs=>xs.flatMap(svg=>[...svg.querySelectorAll('text')].map(t=>parseFloat(getComputedStyle(t).fontSize)*svg.getBoundingClientRect().width/svg.viewBox.baseVal.width)));assert(Math.min(...sizes)>=12,'RBC flow font '+Math.min(...sizes));
  await page.locator('.visual-flow').screenshot({path:out+`/rbc-flow-${width}.png`});
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' overflow');assert.deepEqual(errors,[],id+' errors');
 await page.locator('.learning-summary').screenshot({path:out+`/${id}-summary-${width}.png`});
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+`/${id}-palette-${width}.png`});
 if(['cardiac-output-v1','capillary-exchange-v1'].includes(id))await page.locator('.lab').screenshot({path:out+`/${id}-correct-${width}.png`});
 results.push({id,width,...geometry,feedback,noOverflow:true,errors});await page.close();
}
 const accents=results.filter(r=>r.width===390).map(r=>r.accent);assert.equal(new Set(accents).size,targets.length,'Every infographic has a distinct fixed accent');
 fs.writeFileSync(root+'/docs/LEARNING_REFRESH_VERIFY.json',JSON.stringify(results,null,2)+'\n');console.log('Passed '+results.length+' scenarios, '+targets.length+' unique palettes.');
}finally{await browser.close()}
