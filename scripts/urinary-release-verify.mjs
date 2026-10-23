import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {approvedUrinarySlugs,approvedUrinaryDocument} from './urinary-release-build.mjs';
import {checkApplyScript} from './lib/apply-script-check.mjs';
import {checkScriptLayout} from './lib/acidbase-script-layout.mjs';
import {auditOne,loadCatalog} from './materials.mjs';
const slugs=process.argv.slice(2),catalog=await loadCatalog();
for(const slug of slugs.length?slugs:approvedUrinarySlugs){
 const d=approvedUrinaryDocument(slug),html=path.resolve('public/materials',d.version,'index.html'),out=path.resolve('docs/urinary-release/release-today/B/verify',slug);
 assert.equal(fs.readFileSync(html,'utf8'),d.html,'正式檔必須完全來自核可腳本的最新 render，不可回退舊模板');
 const audit=auditOne(d.version);assert(audit.hasScript&&audit.hasComplete);assert.equal(audit.nodeTotal,6);assert.equal(audit.questionTotal,d.assessmentIds.length);assert.equal(catalog[d.version].questionTotal,d.assessmentIds.length);
 const options={html,out,sizes:[[390,844],[1280,800]],shots:false};
 const file=path.resolve('materials-src',slug,slug==='acid-base-homeostasis'?'full.json':'apply.json');
 const result=slug==='acid-base-homeostasis'?await checkScriptLayout(JSON.parse(fs.readFileSync(file)),{...options,file}):await checkApplyScript(file,options);
 assert.equal((result.summary||result).fail,0);if(result.diff)assert(result.diff.pass);
 fs.writeFileSync(path.join(out,'registration.json'),JSON.stringify({pass:true,slug,path:html,sha256:d.sha,audit,catalog:catalog[d.version]},null,2)+'\n');
 console.log(JSON.stringify({slug,pass:true,summary:result.summary||result,registration:'PASS',tracking:'PASS (SDK mocked; no live records)'}));
}
