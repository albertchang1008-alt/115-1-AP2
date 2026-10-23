import fs from 'node:fs';import path from 'node:path';import {checkPreAnswerContent} from './lib/pre-answer-audit.mjs';
const args=process.argv.slice(2),slug=args[0],at=args.indexOf('--out'),out=path.resolve(at<0?'docs/urinary-release/release-today/A/pre-answer/'+slug:args[at+1]);
const baseDir=path.resolve('materials-src',slug),file=slug==='acid-base-homeostasis'?'full.json':'apply.json';
const r=await checkPreAnswerContent(JSON.parse(fs.readFileSync(path.join(baseDir,file))),{baseDir,out,sizes:[[360,667],[390,844],[414,896],[768,1024],[820,1180],[1024,1366],[1280,800],[844,390]]});
console.log(JSON.stringify({slug,pass:r.pass,cases:r.cases.length,errors:r.errors}));if(!r.pass)process.exitCode=1;
