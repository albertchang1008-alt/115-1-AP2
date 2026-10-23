// Preview only: writes exclusively to the explicitly requested output folder.
import fs from'node:fs';import path from'node:path';import{renderApply}from'../materials-src/apply-kit/render.mjs';
const [file,out]=process.argv.slice(2);if(!file||!out)throw Error('Usage: node scripts/apply-preview.mjs <apply.json> <preview-output>');
const target=path.resolve(out);if(target.includes(`${path.sep}public${path.sep}`))throw Error('Preview cannot write public');fs.mkdirSync(target,{recursive:true});const data=JSON.parse(fs.readFileSync(file,'utf8'));for(const view of['lab','course'])fs.writeFileSync(path.join(target,`${view}.html`),renderApply(data,{baseDir:path.dirname(path.resolve(file)),view}));console.log(`Preview only: ${target}`);
