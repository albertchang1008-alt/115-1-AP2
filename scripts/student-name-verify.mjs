// Real Student component + local fixture API; no sign-in, cloud requests or student writes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'docs/student-name-1.6.2-screenshots');
await fs.mkdir(output,{recursive:true});
const server=await createServer({root,server:{host:'127.0.0.1',port:0}});
await server.listen();
const port=server.httpServer.address().port;
const browser=await chromium.launch({channel:'chrome'});
const results=[];
try {
  for(const width of [390,1280]) {
    for(const state of ['done','late','inProgress']) {
      for(const size of ['default','xlarge']) {
        const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
        page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
        await page.goto(`http://127.0.0.1:${port}/tests/fixtures/student-name-preview.html?state=${state}`);
        await page.locator('.progress-unit .status').getByText(state==='late'?'已完成（逾期）':state==='done'?'已完成':'進行中',{exact:true}).waitFor();
        // Exercise the actual largest font option, not just an injected CSS variable.
        if(size==='xlarge') {
          await page.getByRole('button',{name:'顯示設定',exact:true}).click();
          await page.getByLabel('文字大小',{exact:true}).selectOption('xlarge');
          await page.getByRole('button',{name:'關閉顯示設定',exact:true}).click();
          await page.locator('.settings-sheet').waitFor({state:'hidden'});
        }
        const completed=state!=='inProgress';
        await page.evaluate(()=>document.fonts.ready);
        assert.equal(await page.locator('.completion-student-name').count(),completed?1:0);
        const measurement=await page.evaluate(()=>{
          const card=document.querySelector('.progress-unit'),status=card.querySelector('.progress-status-stack .status'),name=card.querySelector('.completion-student-name');
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
          const style=e=>{const s=getComputedStyle(e);return {fontSize:s.fontSize,lineHeight:s.lineHeight,paddingTop:s.paddingTop,paddingRight:s.paddingRight,paddingBottom:s.paddingBottom,paddingLeft:s.paddingLeft};};
          return {horizontalOverflow:document.documentElement.scrollWidth>innerWidth,card:rect(card),status:rect(status),name:name?rect(name):null,statusStyle:style(status),nameStyle:name?style(name):null,fontScale:getComputedStyle(document.documentElement).getPropertyValue('--font-scale').trim(),headerOverflow:card.querySelector('header').scrollWidth>card.querySelector('header').clientWidth};
        });
        assert.equal(measurement.horizontalOverflow,false);
        assert.equal(measurement.headerOverflow,false);
        if(completed) {
          assert.equal(await page.locator('.completion-student-name').innerText(),'王小明');
          assert.deepEqual(measurement.nameStyle,measurement.statusStyle);
          assert.equal(measurement.name.height,measurement.status.height);
          assert.equal(measurement.name.x,measurement.status.x);
          assert(measurement.name.y>=measurement.status.bottom);
        }
        assert.deepEqual(errors,[]);
        const screenshot=`${width}-${state}-${size}.png`;
        await page.screenshot({path:path.join(output,screenshot),fullPage:true});
        results.push({width,state,size,screenshot,...measurement,consoleErrors:errors});
        console.log(`${width}px ${state} ${size}: pass`);
        await page.close();
      }
    }
  }
  // Additional name/privacy and optional-card boundaries at mobile maximum font.
  for(const {state,suffix} of [{state:'done',suffix:'&preview=1'},{state:'done',suffix:'&long=1'},{state:'done',suffix:'&optional=1'},{state:'todo',suffix:'&optional=1'}]) {
    const page=await browser.newPage({viewport:{width:390,height:900}});
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/student-name-preview.html?state=${state}${suffix}`);
    await page.locator('.progress-unit').waitFor();
    await page.getByRole('button',{name:'顯示設定',exact:true}).click();
    await page.getByLabel('文字大小',{exact:true}).selectOption('xlarge');
    await page.getByRole('button',{name:'關閉顯示設定',exact:true}).click();
    await page.locator('.settings-sheet').waitFor({state:'hidden'});
    await page.evaluate(()=>document.fonts.ready);
    if(state==='todo') {
      assert.equal(await page.locator('.completion-student-name').count(),0);
    } else {
      await page.locator('.completion-student-name').waitFor();
      if(suffix.includes('preview')) assert.equal(await page.locator('.completion-student-name').innerText(),'預覽學生');
      if(suffix.includes('long')) {
        const name=page.locator('.completion-student-name');
        assert.equal(await name.evaluate(e=>getComputedStyle(e).textOverflow),'ellipsis');
        assert.equal(await name.getAttribute('title'),await name.innerText());
      }
    }
    const boundaryLayout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,wide:[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth&&e.getClientRects().length).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})).slice(-8)}));
    assert.equal(boundaryLayout.scrollWidth>boundaryLayout.width,false,JSON.stringify({suffix,...boundaryLayout}));
    results.push({width:390,state,size:'xlarge',boundary:suffix,horizontalOverflow:false});
    await page.close();
  }
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify({flows:results.length,screenshots:12,errors:0,output},null,2));
} finally {await browser.close();await server.close();}
