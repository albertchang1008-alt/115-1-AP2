import fs from 'node:fs';import path from 'node:path';import {pathToFileURL}from'node:url';import{chromium}from'playwright';
import{renderApply}from'../materials-src/apply-kit/render.mjs';import{compileApplyStudentScript}from'../materials-src/apply-kit/scripted-compile.mjs';
import{performScriptedStep,retryScripted,auditApplyScript}from'./lib/apply-script-browser.mjs';import{metrics}from'./lib/acidbase-full-browser.mjs';import{unwrap}from'../materials-src/apply-kit/model.mjs';
for(const slug of process.argv.slice(2)){
 const baseDir=path.resolve('materials-src',slug),data=JSON.parse(fs.readFileSync(baseDir+'/apply.json')),S=compileApplyStudentScript(baseDir),out=path.resolve('docs/urinary-release/apply9-final/label-on-figure/spotchecks',slug);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/preview.html',renderApply(data,{baseDir,view:'course'}));
 const browser=await chromium.launch(),results=[];try{const p=await browser.newPage({viewport:{width:390,height:844}});await p.goto(pathToFileURL(out+'/preview.html').href);await p.locator('#start').click();
 async function capture(name){const m=await metrics(p),a=await auditApplyScript(p,S,unwrap(data).learning.questions);const pass=!m.outside.length&&!m.clipping.length&&!m.small.length&&!a.errors.length&&m.scrollWidth<=390&&m.scrollHeight<=844;await p.screenshot({path:out+'/'+name+'.png'});results.push({name,pass,...m,textErrors:a.errors});if(!pass)process.exitCode=1;}
 for(const [n,node]of S.nodes.entries()){
 if(await p.locator('#begin-action').count())await p.locator('#begin-action').click();
 for(const [j,s]of node.steps.entries()){
 if(s.type==='locate'){
 await capture(`N${n+1}-S${j+1}-before`);await performScriptedStep(p,s,{wrong:true});await p.locator('#strict-retry').waitFor();await capture(`N${n+1}-S${j+1}-wrong`);await retryScripted(p);
 }
 await performScriptedStep(p,s);if(s.type==='locate')await capture(`N${n+1}-S${j+1}-correct`);await p.locator('#next-step').click();
 }
 if(node.micro){await p.locator(`[data-micro="${node.micro.answer}"]`).click();await p.locator('#micro-submit').click();}if(n<5)await p.locator('#next-node').click();
 }
 }finally{await browser.close();}fs.writeFileSync(out+'/checks.json',JSON.stringify(results,null,2)+'\n');console.log(slug,results.length,results.filter(r=>!r.pass).length);
}
