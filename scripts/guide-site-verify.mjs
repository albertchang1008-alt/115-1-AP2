import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const site = process.argv[2];
assert(['ap2','mi'].includes(site));
const output = 'docs/unify-1.9.0';
const root = path.resolve('dist');
const browser=await chromium.launch({channel:'chrome'}), report=[];
try {
  for(const width of [1280,390]) {
    const page=await browser.newPage({viewport:{width,height:950}}), errors=[], requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',async r=>{
      const url=new URL(r.request().url()); requests.push(url.href);
      assert.equal(url.hostname,'guide-static.test','static guide must not request external dependencies');
      const file=path.resolve(root,'.'+url.pathname);
      assert(file.startsWith(root+'/'));
      const type=file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':file.endsWith('.jpg')?'image/jpeg':'text/html; charset=utf-8';
      await r.fulfill({contentType:type,body:await fs.readFile(file)});
    });
    await page.goto('https://guide-static.test/guide/index.html');
    await page.getByRole('heading',{name:'從登入到完成，一步一步來'}).waitFor();
    assert.match(await page.locator('header').innerText(),site==='ap2'?/115-1 AP2/:/115-MI/);
    assert.equal(await page.locator('header a').getAttribute('href'),site==='ap2'?'https://albertchang1008-alt.github.io/115-1-AP2/':'https://albertchang1008-alt.github.io/115-MI/');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.getByLabel('文字大小').selectOption('small');
    await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
    const min=await page.evaluate(()=>Math.min(...[...document.querySelectorAll('main *')].filter(e=>e.textContent.trim() && e.getBoundingClientRect().height>0).map(e=>parseFloat(getComputedStyle(e).fontSize))));
    assert(min>=12,`minimum font ${min}`);
    await page.getByLabel('系統色系').selectOption('night');
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'night');
    await page.getByLabel('文字大小').selectOption('xlarge');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--font-scale').trim()),'1.3');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.getByLabel('文字大小').selectOption('default');await page.getByLabel('系統色系').selectOption('blossom');
    await page.evaluate(()=>document.querySelectorAll('details').forEach((d,i)=>d.open=i<3));
    await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));assert.equal(await page.locator('details:not([open])').count(),0);
    await page.evaluate(()=>dispatchEvent(new Event('afterprint')));assert.equal(await page.locator('details[open]').count(),3);
    await page.evaluate(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode()));});
    await page.screenshot({path:`${output}/guide-${site}-${width}.png`,fullPage:true});
    assert.deepEqual(errors,[]);report.push({site,width,minFont:min,overflow:false,print:true,requests:requests.length,externalRequests:0,errors});await page.close();
  }
  const size=(await Promise.all((await fs.readdir('public/guide/img')).map(async f=>(await fs.stat('public/guide/img/'+f)).size))).reduce((a,b)=>a+b,0);
  assert(size<3*1024*1024);
  const materials=await fs.readdir('dist/materials',{withFileTypes:true});const folders=materials.filter(d=>d.isDirectory()).map(d=>d.name).sort();
  if(site==='mi') assert.deepEqual(folders,['immuno-concepts-review-v1','micro-bacteria-review-v1']);
  else assert(folders.includes('heart-structure-v2') && folders.includes('blood-composition-v1'));
  const chp=(await fs.readdir('dist')).filter(s=>s.startsWith('CHP'));
  assert.equal(chp.length,site==='mi'?3:0);
  await fs.writeFile(`${output}/guide-${site}-verification.json`,JSON.stringify({report,imageBytes:size,materials:folders,legacyCHP:chp},null,2)+'\n');
  console.log(JSON.stringify({site,imageBytes:size,report,materials:folders.length,legacyCHP:chp.length}));
} finally {await browser.close();}
