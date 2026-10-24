import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..'),out=process.env.BLOOD_EVIDENCE_DIR||root+'/docs/blood-flow-routes-screenshots';
const content=JSON.parse(fs.readFileSync(root+'/materials-src/blood-flow-routes/content.json','utf8'));
const fontPath=process.env.BLOOD_CJK_FONT||'/Applications/Airiti Reader.app/Wrapper/AiritiApp.app/NotoSansTC-Regular.otf';
const font64=fs.readFileSync(fontPath).toString('base64');
import {auditTrail} from './blood-flow-trail-audit.mjs';
import {auditLabels} from './blood-flow-v2-label-audit.mjs';

const browser=await chromium.launch({channel:'chrome'}),results=[],errors=[];
async function open(width,font,motion='no-preference',colorScheme='light'){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:motion,colorScheme});
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:''}));await page.route('https://fonts.gstatic.com/**',r=>r.abort());
 await page.route('**/materials/course-learning.js',r=>r.fulfill({body:'window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>events.push({k,args})]));'}));
 await page.goto('file://'+root+'/public/materials/blood-flow-routes-v1/index.html',{waitUntil:'domcontentloaded'});
 if(font!=='system-ui'){await page.evaluate(async data=>{const f=new FontFace('Audit Noto CJK',`url(data:font/otf;base64,${data})`);await f.load();document.fonts.add(f);},font64);await page.addStyleTag({content:'.flow-map svg text{font-family:"Audit Noto CJK"!important}'});}
 await page.evaluate(()=>document.fonts.ready);await page.locator('.blood-flow').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY));return page;
}
try{
 for(const font of ['system-ui',process.env.BLOOD_CJK_FONT?'Noto Sans CJK TC':'Noto Sans TC'])for(const width of [1280,390]){
  const page=await open(width,font,process.env.BLOOD_FAST?'reduce':'no-preference');
  for(const mode of content.lab.modes.filter(m=>!process.env.BLOOD_MODE||m.id===process.env.BLOOD_MODE)){
   await page.locator(`button[data-flow-mode="${mode.id}"]`).click();
   for(const birth of (mode.id==='fetal'?['before','after']:['before']).filter(b=>!process.env.BLOOD_BIRTH||b===process.env.BLOOD_BIRTH)){
    if(mode.id==='fetal')await page.locator(`button[data-birth="${birth}"]`).click();
    const steps=birth==='after'?content.lab.postnatal:mode.steps;
    for(let i=0;i<steps.length;i++){
     if(i)await page.locator(`.flow-dots [data-step="${i}"]`).click();
     if(birth!=='after'&&!process.env.BLOOD_FAST)await page.waitForFunction(()=>!!document.querySelector('.flow-map svg').dataset.travelComplete,{},{timeout:2600});
     await page.waitForTimeout(500);await page.locator('.blood-flow').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY));
     const audit=await auditLabels(page);assert(audit.texts.length>=1);const trail=await auditTrail(page);const particles=await page.locator('.flow-particle').count();
     const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,map:document.querySelector('.flow-map').getBoundingClientRect().toJSON(),card:document.querySelector('.flow-card').getBoundingClientRect().toJSON(),next:document.querySelector('[data-flow-next]').getBoundingClientRect().toJSON(),events:window.events?.length||0}));
     assert.equal(await page.locator('.flow-card h3').innerText(),steps[i].title);assert.equal(await page.locator('.flow-small').innerText(),steps[i].text);assert.equal(await page.locator('.flow-source').innerText(),steps[i].source);
     const failures=['collisions','pairs','clipped','small','tooFar','haloMissing'].filter(k=>audit[k].length);
     if(!trail.ok)failures.push('trail/arrows');
     if(layout.overflow||layout.events||particles>30||(width===390&&(layout.map.top<0||layout.card.bottom>900||layout.next.bottom>900)))failures.push('layout/SDK/particles');
     const name=`v2-${mode.id}${birth==='after'?'-after':''}-step-${String(i+1).padStart(2,'0')}-${width}${font==='system-ui'?'':'-noto'}.png`;
     if(!process.env.BLOOD_FAST)await page.screenshot({path:out+'/'+name});
     results.push({font,actualFont:font==='system-ui'?'system-ui':process.env.BLOOD_CJK_FONT?'Noto Sans CJK TC':'Noto Sans TC',width,mode:mode.id,birth,step:i+1,screenshot:process.env.BLOOD_FAST?null:name,audit,trail,particles,layout,failures});
     if(failures.length)console.log(JSON.stringify({font,width,mode:mode.id,birth,step:i+1,failures,trail:trail.ok?undefined:trail,issues:Object.fromEntries(failures.filter(k=>k in audit).map(k=>[k,audit[k]])),layout:failures.includes('layout/SDK/particles')?layout:undefined}));
    }
   }
  }
  // Postnatal switch must always begin at first closure; next advances to second.
  await page.locator('button[data-flow-mode="fetal"]').click();for(const b of ['after','before','after'])await page.locator(`button[data-birth="${b}"]`).click();assert.equal(await page.locator('.flow-dots [aria-current="step"]').innerText(),'1');await page.locator('[data-flow-next]').click();assert.equal(await page.locator('.flow-dots [aria-current="step"]').innerText(),'2');
  if(!process.env.BLOOD_FAST&&font==='system-ui'){
   for(const mode of content.lab.modes.filter(m=>!process.env.BLOOD_MODE||m.id===process.env.BLOOD_MODE)){await page.locator(`button[data-flow-mode="${mode.id}"]`).click();await page.emulateMedia({colorScheme:'dark'});await page.waitForTimeout(1400);await page.screenshot({path:out+`/v2-${mode.id}-dark-${width}.png`});await page.emulateMedia({colorScheme:'light'});}
  }
  await page.close();
 }
 if(!process.env.BLOOD_FAST){
  const p=await open(390,'system-ui','reduce');for(const m of content.lab.modes){await p.locator(`button[data-flow-mode="${m.id}"]`).click();await p.waitForTimeout(500);assert.equal(await p.locator('.flow-particle').count(),0);assert(await p.locator('.flow-fill').evaluateAll(ps=>ps.every(p=>+p.style.strokeDashoffset===0)));await p.screenshot({path:out+`/v2-${m.id}-reduced-390.png`});}await p.close();
 }
 const failures=results.filter(r=>r.failures.length);fs.writeFileSync(out+(process.env.BLOOD_MODE?'/v2-'+process.env.BLOOD_MODE+'-checks.json':'/v2-checks.json'),JSON.stringify({ok:!failures.length&&!errors.length,fontPath,fontNote:'Noto Sans TC: Traditional Chinese CJK OTF (Airiti Reader)',states:results.length,errors,results},null,2));console.log(JSON.stringify({states:results.length,failures:failures.length,pageerrors:errors.length}));if(failures.length||errors.length)process.exitCode=1;
}finally{await browser.close();}
