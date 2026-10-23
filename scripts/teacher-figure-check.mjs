// Reproduce the original-raster UI checks without publishing or changing content.
import fs from 'node:fs';
import path from 'node:path';
import {checkApplyScript} from './lib/apply-script-check.mjs';
import {checkScriptLayout} from './lib/acidbase-script-layout.mjs';
const args=process.argv.slice(2);
const manifest=JSON.parse(fs.readFileSync('materials-src/apply-kit/teacher-figures.json'));
const slugs=args.filter(a=>!a.startsWith('--'));
const chosen=slugs.length?slugs:[...new Set(manifest.entries.map(e=>e.slug))];
const sizeArg=args.find(a=>a.startsWith('--sizes='));
const sizes=sizeArg?.slice(8).split(',').map(size=>size.split('x').map(Number));
if(sizes?.some(pair=>pair.length!==2||pair.some(n=>!Number.isFinite(n)||n<1)))throw Error('Invalid --sizes=390x844,1280x800');
for(const slug of chosen) {
 if(!manifest.entries.some(e=>e.slug===slug))throw Error('Unknown figure slug '+slug);
 const out=path.resolve(args.find(a=>a.startsWith('--out-root='))?.slice(11)||'docs/urinary-release/apply9-final/teacher-figures',slug);
 try {
  if(slug==='acid-base-homeostasis') {
   const file=path.resolve('materials-src',slug,'full.json');
   const summary=await checkScriptLayout(JSON.parse(fs.readFileSync(file)),{file,out,sizes});
   console.log(JSON.stringify({slug,summary}));if(summary.fail)process.exitCode=1;
  } else {
   const result=await checkApplyScript(path.resolve('materials-src',slug,'apply.json'),{out,sizes});
   console.log(JSON.stringify({slug,...result}));if(result.summary.fail||!result.diff.pass)process.exitCode=1;
  }
 } catch(error) {console.error(slug,error);process.exitCode=1;}
}
