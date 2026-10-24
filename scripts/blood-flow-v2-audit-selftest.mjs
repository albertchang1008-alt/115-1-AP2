import {auditLabels} from './blood-flow-v2-label-audit.mjs';import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:900}}),results=[];
try{for(const [name,body,field] of [
 ['far-referred-vessel','<path id="target" class="base is-current" d="M140 10 V90" stroke="red" stroke-width="8"/><text class="callout" data-label-paths="target" x="10" y="50">文字</text>','tooFar'],
 ['wrong-nearby-vessel','<path id="target" d="M140 10 V90" stroke="red" stroke-width="8"/><path id="near" class="base is-current" d="M50 10 V90" stroke="red" stroke-width="8"/><text class="callout" data-label-paths="target" x="10" y="50">文字</text>','tooFar'],
 ['trail-crosses-halo-text','<path class="base is-trail" d="M50 10 V90" stroke="red" stroke-width="8" opacity=".7"/><text x="40" y="50" style="paint-order:stroke;stroke:white;stroke-width:4">文字</text>','collisions'],
 ['current-crosses-halo-text','<path class="base is-current" d="M50 10 V90" stroke="red" stroke-width="8"/><text x="40" y="50" style="paint-order:stroke;stroke:white;stroke-width:4">文字</text>','collisions'],
 ['pale-background-behind-halo','<path class="base" d="M50 10 V90" stroke="pink" stroke-width="8"/><text x="40" y="50" style="paint-order:stroke;stroke:white;stroke-width:4">文字</text>',null],
 ['vessel-crosses-text'  ,'<path class="base is-current" d="M50 10 V90" stroke="red" stroke-width="8"/><text x="40" y="50">文字</text>','collisions'],
 ['insufficient-gap','<text x="40" y="50">文字</text><text x="41" y="51">標籤</text>','pairs'],
 ['outside-frame','<text x="-10" y="50">文字</text>','clipped'],
 ['mobile-too-small','<text x="40" y="50" font-size="5">文字</text>','small'],
 ['hidden-label-not-counted','<text x="40" y="50" opacity="0">文字</text><text x="40" y="50">標籤</text>',null],
 ['heart-occludes-vessel','<g class="back"><path class="base is-current" data-layer="back" d="M50 10 V90" stroke="red" stroke-width="8"/></g><g class="hrt"><path d="M35 20 H100 V70 H35 Z" fill="pink"/></g><text x="40" y="50">文字</text>',null]
 ]){await page.setContent(`<div class="flow-map"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="390" height="240"><g data-view="test">${body}</g></svg></div>`);const a=await auditLabels(page);if(field)assert(a[field].length>0,name);else{assert.deepEqual(a.collisions,[],name);assert.deepEqual(a.pairs,[],name);}results.push({name,field,passed:true,audit:a});}fs.writeFileSync(path.join(process.env.BLOOD_EVIDENCE_DIR||path.resolve(import.meta.dirname,'../docs/blood-flow-routes-screenshots'),'v2-audit-selftest.json'),JSON.stringify({ok:true,results},null,2));console.log('11 audit controls passed');}finally{await browser.close();}
