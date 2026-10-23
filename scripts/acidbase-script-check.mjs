import fs from 'node:fs';import path from 'node:path';import{checkScriptLayout}from'./lib/acidbase-script-layout.mjs';
const file=path.resolve('materials-src/acid-base-homeostasis/full.json'),out=path.resolve(process.argv[2]||'docs/urinary-release/acidbase-full/ux-script'),work=path.join(out,'text-check');
const summary=await checkScriptLayout(JSON.parse(fs.readFileSync(file)),{file,out:work,sizes:[[1280,800],[390,844]],shots:false});
for(const name of ['SCRIPT_DIFF.txt','SCRIPT_DIFF.json'])fs.copyFileSync(path.join(work,name),path.join(out,name));
console.log(JSON.stringify(summary));if(summary.fail)process.exitCode=1;
