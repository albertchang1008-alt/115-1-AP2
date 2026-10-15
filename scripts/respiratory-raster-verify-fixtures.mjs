// R3 checker regression: detect missing/blank/hidden rasters; render each
// hemoglobin layout alone, without borrowing resources from the other layout.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {chromium} from 'playwright';import {measureRasterPlates} from './respiratory-raster-verify.mjs';
const root=path.resolve(import.meta.dirname,'..'),browser=await chromium.launch({channel:'chrome'}),checks=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=2;const x=c.getContext('2d');x.fillStyle='#0072B2';x.fillRect(0,0,2,2);const blue=c.toDataURL();x.fillStyle='white';x.fillRect(0,0,2,2);return {blue,white:c.toDataURL()}});
 for(const c of [
  {name:'valid-inline-raster',image:`<image href="${png.blue}" width="2" height="2"/>`,expected:true},
  {name:'decoded-but-white',image:`<image href="${png.white}" width="2" height="2"/>`,expected:false},
  {name:'missing-use-resource',image:'<use href="#missing"/>',expected:false},
  {name:'hidden-layer-resource',defs:`<g style="display:none"><defs><image id="hidden-image" href="${png.blue}" width="2" height="2"/></defs></g>`,image:'<use href="#hidden-image"/>',expected:false}
 ]){
  await page.setContent(`<style>body{margin:0;background:white}</style><svg width="300" height="300" viewBox="0 0 300 300">${c.defs||''}<svg x="20" y="20" width="260" height="260" viewBox="0 0 2 2">${c.image}</svg></svg>`);
  const result=await measureRasterPlates(page.locator('body > svg'),[{source:c.name,sourceSize:[2,2]}]);assert.equal(result.every(r=>r.ok),c.expected,c.name);checks.push({name:c.name,expected:c.expected,ok:true,result});
 }
 await page.close();
 const svg=fs.readFileSync(path.join(root,'materials-src/figures/o2-co2-transport-node-02.svg'),'utf8');
 const spec=JSON.parse(fs.readFileSync(path.join(root,'materials-src/figures/raster/o2-co2-transport/labels.json'))).figures['node-02'];
 for(const width of [1280,390]){
  const p=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:2});
  await p.setContent('<style>body{margin:0;background:white}body>svg{display:block;width:100%;max-width:760px}</style>'+svg);
  const mode=width>=768?'desktop':'mobile';await p.locator(mode==='desktop'?'.r2-mobile':'.r2-desktop').evaluate(e=>e.remove());
  const result=await measureRasterPlates(p.locator('body > svg'),spec.layouts[mode].plates);assert(result.every(r=>r.ok&&r.inline),'isolated '+mode);checks.push({name:'isolated-hemoglobin-'+mode,width,ok:true,result});await p.close();
 }
}finally{await browser.close()}
fs.writeFileSync(path.join(root,'docs/respiratory-screenshots/v2/r3-raster-fixtures.json'),JSON.stringify({ok:true,checks},null,2)+'\n');console.log(JSON.stringify({ok:true,checks:checks.length}));
