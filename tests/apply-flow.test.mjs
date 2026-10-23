import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {validateApply} from '../materials-src/apply-kit/model.mjs';
import {renderApply} from '../materials-src/apply-kit/render.mjs';
const file='materials-src/apply-examples/water-sodium-regulation/apply.json';
const source={uid:'renin-angiotensin-aldosterone',quote:'腎素催化血液中的血管收縮素原轉換成血管收縮素 I'};
const text=x=>({text:x,sources:[source]});
function fixture(){const d=JSON.parse(fs.readFileSync(file));const n=d.learning.nodes[3];n.flowRoutes=[{id:'test-flow',width:1122,height:1402,segments:[{from:text('血管收縮素原'),to:text('血管收縮素 I'),points:[[320,530],[750,540]],sources:[source]}]}];return d}
test('flow geometry rejects out-of-image points and duplicate route ids',()=>{let d=fixture();d.learning.nodes[3].flowRoutes[0].segments[0].points[0][0]=-1;assert.match(validateApply(d).join(),/flowRoutes/);d=fixture();d.learning.nodes[3].flowRoutes.push(d.learning.nodes[3].flowRoutes[0]);assert.match(validateApply(d).join(),/flowRoutes/)});
test('flow runs in both responsive SVG coordinate frames and reduced motion stays static',async()=>{const d=fixture(),browser=await chromium.launch();try{for(const width of[1280,390]){const p=await browser.newPage({viewport:{width,height:844}});await p.setContent(renderApply(d,{baseDir:path.dirname(path.resolve(file)),view:'course-legacy'}));await p.locator('#guide-close').click();await p.locator('[data-view=nodes]').click();await p.locator(`[data-node="${d.learning.nodes[3].id}"]`).click();const paths=p.locator('.flow-route-path:visible');assert.equal(await paths.count(),1);const a=await paths.first().evaluate(e=>getComputedStyle(e).strokeDashoffset);await p.waitForTimeout(180);const b=await paths.first().evaluate(e=>getComputedStyle(e).strokeDashoffset);assert.notEqual(a,b);await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await paths.first().evaluate(e=>getComputedStyle(e).animationName),'none');await p.close()}}finally{await browser.close()}});

import {checkFlowRoutes} from '../materials-src/apply-kit/flow-check.mjs';
test('flow evidence rejects missing, reverse, unrelated and unordered sources',()=>{
 const good=fixture();assert.deepEqual(checkFlowRoutes(good,{cite:()=>{}}),[]);
 for(const mode of['missing','reverse','unrelated','unordered']){const d=fixture(),s=d.learning.nodes[3].flowRoutes[0].segments[0];if(mode==='missing')s.sources=[];if(mode==='reverse')[s.from,s.to]=[s.to,s.from];if(mode==='unrelated')s.sources=[{...source,quote:'腎素參與血壓調節。'}];if(mode==='unordered')s.sources=[{...source,quote:'血管收縮素原與血管收縮素 I 都是名詞。'}];assert.match(checkFlowRoutes(d,{cite:()=>{}}).join(),/flow evidence/,mode)}
});
test('correct sequence plays each segment once; wrong sequence never starts playback',async()=>{
 const d=fixture(),n=d.learning.nodes[3];n.flowRoutes[0].segments.push(structuredClone(n.flowRoutes[0].segments[0]));const browser=await chromium.launch();try{const p=await browser.newPage();await p.setContent(renderApply(d,{baseDir:path.dirname(path.resolve(file)),view:'course-legacy'}));await p.locator('#guide-close').click();await p.locator('[data-view=nodes]').click();await p.locator(`[data-node="${n.id}"]`).click();const root=p.locator('#detail-'+n.id);
 await root.locator('.sequence-list').evaluate((list,order)=>{for(const i of order)list.append(list.querySelector('[data-step="'+i+'"]'))},[...n.lookTask.correctOrder].reverse());await root.locator('[data-sequence]').click();assert.equal(await root.locator('[data-playback=playing]').count(),0);
 await root.locator('.sequence-list').evaluate((list,order)=>{for(const i of order)list.append(list.querySelector('[data-step="'+i+'"]'))},n.lookTask.correctOrder);await root.locator('[data-sequence]').click();assert(await root.locator('[data-flow-segment="0"].flow-active').count()>0);assert.equal(await root.locator('[data-flow-segment="1"].flow-active').count(),0);await p.waitForTimeout(700);assert(await root.locator('[data-flow-segment="1"].flow-active').count()>0);await p.waitForTimeout(700);assert.equal(await root.locator('.flow-active').count(),0);assert(await root.locator('[data-playback=complete]').count()>0);
 await p.emulateMedia({reducedMotion:'reduce'});await root.locator('[data-sequence]').click();assert.equal(await root.locator('.flow-active').count(),0);assert.equal(await root.locator('[data-playback=playing]').count(),0);
 }finally{await browser.close()}
});
test('negated relationship is not valid movement evidence',()=>{const d=fixture(),s=d.learning.nodes[3].flowRoutes[0].segments[0];s.sources=[{...source,quote:'血管收縮素原不會轉成血管收縮素 I'}];assert.match(checkFlowRoutes(d,{cite:()=>{}}).join(),/flow evidence/)});
