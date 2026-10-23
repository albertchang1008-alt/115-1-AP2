import {verifyDerivedImages} from '../materials-src/apply-kit/derived-images.mjs';
import {questionBaseline} from './lib/urinary-question-baseline.mjs';
import {checkPreAnswerContent} from './lib/pre-answer-audit.mjs';
import {validateApprovedQuestionChanges} from './apply-script-question-rewrites.mjs';
import{isFull}from'../materials-src/apply-kit/full-render.mjs';
import{checkFullContent}from'../materials-src/apply-kit/full-check.mjs';
import{checkFlowRoutes}from'../materials-src/apply-kit/flow-check.mjs';
import{checkSemantics}from'../materials-src/apply-kit/semantics.mjs';
import fs from'node:fs';import path from'node:path';import{execFileSync}from'node:child_process';import{fileURLToPath,pathToFileURL}from'node:url';import{chromium}from'playwright';import{validateApply,unwrap}from'../materials-src/apply-kit/model.mjs';import{renderApply}from'../materials-src/apply-kit/render.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const metadata=new Set(['kind','mode','relation','anchorRef','anchorView','directionApproval','slug','version','id','initialState','src','type','side','direction','dir','targetStateId','term','compactTerms','terms','from','to','schemaVersion','width','height','y','anchor','a','correctOrder','points']);
export function checkApplyContent(data,{cardsDir,progressPath,repoRoot=ROOT,baseDir}={}){
 verifyDerivedImages(repoRoot);
 if(isFull(data)){
  const result=checkFullContent(data,{cardsDir,progressPath,baseDir});
  if(result.pass){
   const legacy=JSON.parse(fs.readFileSync(path.resolve(baseDir,data.legacyApply),'utf8'));
   const embedded=checkApplyContent(legacy,{cardsDir,progressPath,repoRoot,baseDir});
   result.errors.push(...embedded.errors.map(e=>'embedded lab: '+e));
   result.matches.push(...embedded.matches.map(m=>({...m,path:'embeddedLab.'+m.path})));
   result.sourceUids=[...new Set([...result.sourceUids,...embedded.sourceUids])];
   result.displayFields+=embedded.displayFields;result.pass=result.errors.length===0;
  }
  return result;
 }
 const errors=validateApply(data),matches=[],uids=new Set(),display=[];let progress=new Map();
 try{for(const line of fs.readFileSync(progressPath,'utf8').split('\n').filter(Boolean)){const row=JSON.parse(line);if(progress.has(row.uid))errors.push(`progress: duplicate uid ${row.uid}`);progress.set(row.uid,row)}}catch(e){errors.push(`progress: ${e.message}`)}
 const cards=new Map();const cite=(sources,p)=>{if(!Array.isArray(sources)||!sources.length){errors.push(`${p}: sources required`);return;}for(const ref of sources){if(!ref||!/^[a-z0-9-]+$/.test(ref.uid||'')||typeof ref.quote!=='string'||!ref.quote.trim()){errors.push(`${p}: invalid citation`);continue}uids.add(ref.uid);try{if(!cards.has(ref.uid))cards.set(ref.uid,fs.readFileSync(path.join(cardsDir,ref.uid+'.md'),'utf8'));const raw=cards.get(ref.uid);const header=raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]||'';const field=k=>header.split('\n').find(line=>line.startsWith(k+':'))?.slice(k.length+1).trim().replace(/^['"]|['"]$/g,'');if(field('review_status')!=='reviewed')errors.push(`${p}: card ${ref.uid} is not reviewed`);if(field('uid')!==ref.uid)errors.push(`${p}: card uid mismatch ${ref.uid}`);if(progress.get(ref.uid)?.status!=='reviewed')errors.push(`${p}: progress ${ref.uid} is not reviewed`);if(!raw.includes(ref.quote))errors.push(`${p}: quote not found in ${ref.uid}`);else matches.push({path:p,uid:ref.uid,quote:ref.quote,line:raw.slice(0,raw.indexOf(ref.quote)).split('\n').length})}catch(e){errors.push(`${p}: ${e.message}`)}}};
 const scan=(v,p='',meta=false)=>{if(Array.isArray(v)){v.forEach((x,i)=>scan(x,`${p}[${i}]`,meta));return}if(v&&typeof v==='object'){
   if(Object.hasOwn(v,'text')&&(typeof v.text!=='object'||v.text===null)){if(typeof v.text!=='string')errors.push(`${p}: text must be string`);else display.push({path:p,text:v.text});cite(v.sources,p);return}
   if(Object.hasOwn(v,'value')){cite(v.sources,p);if(p.startsWith('learning.questions')){const collect=q=>{if(typeof q==='string')display.push({path:p,text:q});else if(Array.isArray(q))q.forEach(collect);else if(q&&typeof q==='object')Object.entries(q).filter(([k])=>!['id','nodeId','sources','uid'].includes(k)).forEach(([,x])=>collect(x))};collect(v.value)}return}
   if(v.sources)cite(v.sources,p);for(const[k,x]of Object.entries(v))if(!['sources','directionSources','fromSources','toSources'].includes(k))scan(x,p?`${p}.${k}`:k,meta||metadata.has(k));return
  }if(typeof v==='number'&&!meta)errors.push(`${p}: display number lacks {value,sources}`);if(typeof v==='string'&&!meta&&!['→','＝'].includes(v))errors.push(`${p}: display string lacks {text,sources}`)
 };scan(data);errors.push(...checkFlowRoutes(data,{cite,baseDir}));errors.push(...checkSemantics(data,{root:ROOT,cite,baseDir}));
 const terms=JSON.parse(fs.readFileSync(path.join(ROOT,'materials-src/apply-kit/taiwan-terms.json'),'utf8'));
 for(const item of display){let text=item.text;for(const allowed of terms.approvedTerms)text=text.replaceAll(allowed,'');for(const bad of terms.blacklist)if(text.includes(bad))errors.push(`${item.path}: banned Taiwan term ${bad}`);for(const ch of [...text])if(terms.simplifiedOnly.includes(ch))errors.push(`${item.path}: simplified character ${ch}`);if(/<\/?[a-z][^>]*>/i.test(text))errors.push(`${item.path}: HTML markup in display text`);for(const uid of uids)if(item.text.includes(uid))errors.push(`${item.path}: source uid visible in display text: ${uid}`)}
 try{const c=unwrap(data),baseline=questionBaseline(c.slug);for(const kind of['foundation','cases'])if(!validateApprovedQuestionChanges(baseline[kind],c.learning.questions[kind],ROOT))errors.push(`questions.${kind}: differs from c8fb122 outside exact teacher-approved rewrites`);if(JSON.stringify(c.learning.questions.predict)!==JSON.stringify(baseline.lab.predict))errors.push('questions.predict: differs from c8fb122')}catch(e){errors.push(`question baseline: ${e.message}`)}
 return{pass:errors.length===0,errors:[...new Set(errors)],matches,sourceUids:[...uids],displayFields:display.length,skipped:0};
}
export async function checkStudentHtml(htmls,uids){const errors=[];const browser=await chromium.launch({headless:true});try{for(const [name,html]of Object.entries(htmls)){const page=await browser.newPage();page.on('pageerror',e=>errors.push(`${name}: ${e.message}`));await page.setContent(html,{waitUntil:'load'});await page.evaluate(()=>{document.querySelectorAll('[hidden]').forEach(e=>e.hidden=false);document.querySelectorAll('dialog').forEach(e=>e.removeAttribute('open'))});for(const frame of page.frames()){const text=await frame.evaluate(()=>[document.body?.innerText||'',...[...document.querySelectorAll('svg text')].map(e=>e.textContent)].join('\n'));const policy=JSON.parse(fs.readFileSync(path.join(ROOT,'materials-src/apply-kit/taiwan-terms.json'),'utf8'));let checked=text;for(const term of policy.approvedTerms)checked=checked.replaceAll(term,'');for(const bad of policy.blacklist)if(checked.includes(bad))errors.push(`${name}: rendered banned Taiwan term ${bad}`);for(const ch of [...checked])if(policy.simplifiedOnly.includes(ch))errors.push(`${name}: rendered simplified character ${ch}`);for(const uid of uids)if(text.includes(uid))errors.push(`${name}: source uid visible: ${uid}`)}await page.close()}}finally{await browser.close()}return errors}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2),get=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1]},file=args[0],out=get('--out');
 if(!file||!get('--cards')||!get('--progress'))throw Error('Usage: apply-content-check.mjs <apply.json> --cards <01_knowledge> --progress <todo_all.jsonl> [--out result.json] [--student-html fixture.html]');
 let result;try{const data=JSON.parse(fs.readFileSync(file,'utf8'));result=checkApplyContent(data,{cardsDir:get('--cards'),progressPath:get('--progress'),baseDir:path.dirname(path.resolve(file))});if(result.pass){const baseDir=path.dirname(path.resolve(file));const htmls={lab:get('--student-html')?fs.readFileSync(get('--student-html'),'utf8'):renderApply(data,{baseDir}),course:renderApply(data,{baseDir,view:'course'})};result.errors.push(...await checkStudentHtml(htmls,result.sourceUids));const before=await checkPreAnswerContent(data,{baseDir,html:get('--student-html')?fs.readFileSync(get('--student-html'),'utf8'):undefined});result.preAnswer=before;result.errors.push(...before.errors.map(e=>'pre-answer: '+JSON.stringify(e)));result.pass=!result.errors.length}}catch(e){result={pass:false,errors:[e.message],skipped:0}}
 if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n')}console.log(JSON.stringify({pass:result.pass,displayFields:result.displayFields,quotes:result.matches?.length,errors:result.errors,skipped:0},null,2));if(!result.pass)process.exitCode=1;
}
