import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'..'),file=path.join(root,'docs/micro-immuno-review-preview.html'),html=fs.readFileSync(file,'utf8');
const data=JSON.parse(html.match(/const data=(.*?);/s)[1]);assert.equal(data.length,140);
for(const item of data)assert.ok(fs.statSync(path.join(root,'docs/micro-immuno-review-screenshots',item.file)).size>0);
const browser=await chromium.launch({channel:'chrome'}),errors=[],results=[];
try{for(const width of [1280,390]){
 const page=await browser.newPage({viewport:{width,height:844}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(pathToFileURL(file).href);await page.locator('#width').selectOption(String(width));
 assert.equal(await page.locator('#grid article').count(),11);
 await page.locator('#font').selectOption('noto');await page.locator('#kind').selectOption('node');assert.equal(await page.locator('#grid article').count(),6);
 await page.locator('#subject').selectOption('immuno-concepts-review');assert.equal(await page.locator('#grid article').count(),8);
 await page.locator('#kind').selectOption('lab');assert.equal(await page.locator('#grid article').count(),2);
 await page.locator('#font').selectOption('fallback');await page.locator('#kind').selectOption('node');assert.equal(await page.locator('#grid article').count(),8);
 await page.locator('#font').selectOption('system');await page.locator('#kind').selectOption('page');assert.equal(await page.locator('#grid article').count(),width===390?4:3);
 await page.locator('#kind').selectOption('all');if(width===1280)await page.locator('#subject').selectOption('micro-bacteria-review');
 await page.evaluate(async()=>{const imgs=[...document.images];imgs.forEach(im=>im.loading='eager');await Promise.all(imgs.map(im=>im.complete?Promise.resolve():new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;})));});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
 await page.screenshot({path:path.join(root,`docs/micro-immuno-review-screenshots/gallery-${width}.png`),fullPage:true});
 results.push({width,filtersWork:true,allReferencedImagesExist:true,visibleImagesLoaded:true,horizontalOverflow:overflow});await page.close();
}}finally{await browser.close();}
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'docs/micro-immuno-review/gallery-checks.json'),JSON.stringify({ok:true,entries:data.length,errors,results},null,2)+'\n');console.log(JSON.stringify({ok:true,entries:data.length,results}));
