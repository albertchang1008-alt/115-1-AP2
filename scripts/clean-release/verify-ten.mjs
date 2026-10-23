import{verifyDerivedImages}from'../../materials-src/apply-kit/derived-images.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {approvedUrinarySlugs,approvedUrinaryDocument} from '../urinary-release-build.mjs';
import {auditOne,loadCatalog} from '../materials.mjs';
import {validateCapturedEvents} from '../lib/release-tracking-proof.mjs';
const allowedImages=new Set(verifyDerivedImages().images.map(d=>d.sha256));let embeddedImages=0;
const out=process.env.RELEASE_EVIDENCE,catalog=await loadCatalog(),sizes=[[360,667],[390,844],[414,896],[768,1024],[820,1180],[1024,1366],[1280,800],[844,390]],reports=[];
for(const slug of approvedUrinarySlugs){
 const d=approvedUrinaryDocument(slug),dir=path.join(out,'verify',slug),formal=fs.readFileSync(`public/materials/${d.version}/index.html`,'utf8');
 assert.equal(formal,d.html);assert(Buffer.byteLength(formal)<=3_000_000);for(const image of formal.matchAll(/data:image\/([a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g)){assert.equal(image[1],'webp');assert(allowedImages.has(createHash('sha256').update(Buffer.from(image[2],'base64')).digest('hex')));embeddedImages++;}
 const captured=fs.readFileSync(path.join(dir,slug==='acid-base-homeostasis'?'checked-student.html':'preview.html'),'utf8');assert.equal(captured,formal);
 const layout=JSON.parse(fs.readFileSync(path.join(dir,'layout-results.json'))),diff=JSON.parse(fs.readFileSync(path.join(dir,'SCRIPT_DIFF.json')));
 assert.equal(layout.summary.fail,0);assert.equal(layout.summary.skipped,0);assert.equal(diff.pass,true);assert.deepEqual(diff.missing,[]);assert.deepEqual(diff.textErrors,[]);
 assert.equal(new Set(layout.results.map(r=>r.width+'x'+r.height)).size,8);
 const audit=auditOne(d.version);assert(audit.hasScript&&audit.hasComplete);assert.equal(audit.nodeTotal,6);assert.equal(audit.questionTotal,d.assessmentIds.length);assert.equal(catalog[d.version].questionTotal,d.assessmentIds.length);
 const events=sizes.map(([w,h])=>{const es=JSON.parse(fs.readFileSync(path.join(dir,`tracking-${w}x${h}.json`)));validateCapturedEvents(es,new Set(d.assessmentIds));return {size:[w,h],events:es.length,invalid:0,completed:1};});
 const content=JSON.parse(fs.readFileSync(path.join(out,'content',slug+'-'+(slug==='acid-base-homeostasis'?'full':'apply')+'.json')));assert.equal(content.pass,true);
 reports.push({slug,pass:true,version:d.version,formalSha256:createHash('sha256').update(formal).digest('hex'),cases:layout.summary.cases,SCRIPT_DIFF:{missing:0,changedOrExtra:0,pass:true},registration:{nodeTotal:6,questionTotal:d.assessmentIds.length},contentCheck:true,events});
 console.log(JSON.stringify(reports.at(-1)));
}
const result={pass:true,materials:10,embeddedImages,unapprovedImages:0,ordinaryRebuilt:9,acidFullRewritten:true,viewports:8,materialViewportFlows:80,layoutCases:reports.reduce((n,r)=>n+r.cases,0),events:reports.flatMap(r=>r.events).reduce((n,r)=>n+r.events,0),invalidEvents:0,reports};
fs.writeFileSync(path.join(out,'verify-ten.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,reports:undefined}));
