import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..'),base='99bca1d',read=p=>fs.readFileSync(root+'/'+p,'utf8'),old=p=>execFileSync('git',['show',`${base}:${p}`],{cwd:root}).toString();
const config=JSON.parse(read('scripts/material-taiwan-terms.json'));
const normalize=s=>Object.entries(config.replacements).reduce((t,[a,b])=>t.replaceAll(a,b),s);
const report={base,scanTerms:config.scanTerms,forbiddenMatches:[],pendingTeacher:[],preservation:[],predictions:[]};
for(const dir of ['materials-src','public/materials']){
 function scan(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  const p=path.join(folder,e.name);if(e.isDirectory())scan(p);else{
   const s=fs.readFileSync(p).toString(),rel=path.relative(root,p);
   for(const term of config.scanTerms)if(s.includes(term))report.forbiddenMatches.push({path:rel,term});
  }
 }}scan(root+'/'+dir);
}
assert.deepEqual(report.forbiddenMatches,[]);
for(const slug of fs.readdirSync(root+'/materials-src').filter(s=>fs.existsSync(root+`/materials-src/${s}/content.json`))){
 const p=`materials-src/${slug}/content.json`,now=JSON.parse(read(p)),before=JSON.parse(normalize(old(p)));
 for(const type of ['foundation','cases'])assert.deepEqual(now[type],before[type],slug+' quiz only authorized wording');
 assert.deepEqual(now.nodes.map(n=>n.id),before.nodes.map(n=>n.id));
 assert.equal(now.lab.predict?.answer,before.lab.predict?.answer);assert.deepEqual(now.lab.predict?.options,before.lab.predict?.options);
 report.preservation.push({slug,nodeIdsUnchanged:true,questionIdsAndAnswerCodesUnchanged:true,questionChangesOnlyTaiwanTerms:true});
}
const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(m=>m[0]);
for(const id of JSON.parse(read('materials-src/manual-presentation-targets.json'))){
 const p=`public/materials/${id}/index.html`;assert.deepEqual(scripts(read(p)),scripts(normalize(old(p))),id+' script unchanged');
 report.preservation.push({id,scriptAndQuizUnchanged:true});
}
const out=root+'/docs/taiwan-terms-screenshots';fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome'});
try{for(const [slug,feedback] of Object.entries(config.predictionFeedback))for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.route('**/course-learning.js',r=>r.fulfill({contentType:'application/javascript',body:'window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>events.push({k,args})]));'}));
 await page.goto('file://'+root+`/public/materials/${slug}-v1/index.html`);
 const data=JSON.parse(read(`materials-src/${slug}/content.json`));assert.equal(data.lab.predict.feedback,feedback);assert.equal(await page.evaluate(()=>events.length),0);
 const correct=data.lab.predict.answer,wrong=(correct+1)%data.lab.predict.options.length;
 await page.locator(`.predict [data-answer="${wrong}"]`).click();assert.match(await page.locator('.predict-result').textContent(),/尚未答對/);
 await page.locator(`.predict [data-answer="${correct}"]`).click();
 assert.equal(await page.locator('.predict-result').textContent(),'✓ 答對了！'+feedback);
 assert.equal(await page.evaluate(()=>events.length),0,'Prediction adds no tracking event');
 const font=await page.locator('.predict-result').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));assert(font>=16);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 await page.locator('.lab').screenshot({path:`${out}/${slug}-${width}.png`});
 report.predictions.push({slug,width,feedback,font,noOverflow:true,errors,noAdditionalTrackingEvents:true});await page.close();
}}finally{await browser.close();}
fs.writeFileSync(root+'/docs/TAIWAN_TERMS_VERIFY.json',JSON.stringify(report,null,2)+'\n');
console.log('Forbidden terms=0; 15 kit + 11 manual ID/answer preservation passed; 12 prediction scenarios passed.');
