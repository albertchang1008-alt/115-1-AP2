import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {approvedUrinarySlugs} from '../urinary-release-build.mjs';
const run=promisify(execFile),out=process.env.RELEASE_EVIDENCE+'/content';fs.mkdirSync(out,{recursive:true});
const jobs=approvedUrinarySlugs.filter(slug=>slug!=='acid-base-homeostasis').map(slug=>[slug,'apply']);jobs.push(['acid-base-homeostasis','full']);let next=0;
await Promise.all([0,1].map(async()=>{while(next<jobs.length){const[slug,kind]=jobs[next++];
 const args=['--import','/Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs','scripts/apply-content-check.mjs',`materials-src/${slug}/${kind}.json`,'--cards','/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge','--progress','/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl','--out',`${out}/${slug}-${kind}.json`];
 try{const r=await run(process.execPath,args,{maxBuffer:4000000});fs.writeFileSync(`${out}/${slug}-${kind}.log`,r.stdout+r.stderr);console.log(slug+'/'+kind+': PASS');}catch(e){fs.writeFileSync(`${out}/${slug}-${kind}.log`,e.stdout+e.stderr);console.log(slug+'/'+kind+': FAIL');process.exitCode=1;}
}}));
