import {buildSync} from 'esbuild';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
export async function verifyPreviewStatus({out}={}){
 if(out)await fs.mkdir(out,{recursive:true});
 const bundle=buildSync({entryPoints:['tests/fixtures/preview-status.tsx'],bundle:true,write:false,format:'esm',platform:'browser',define:{'import.meta.env':'{}','process.env.NODE_ENV':'"production"'}}).outputFiles[0].text;
 const css=(await fs.readFile('src/style.css','utf8')).replace(/^@import[^;]+;\s*/,'');
 const browser=await chromium.launch({channel:'chrome'}),reports=[];
 try{for(const [width,height] of [[1280,800],[390,844]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[],network=[];
  page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname==='preview-status.test')return r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>'});network.push(url.origin);return r.abort();});
  await page.goto('http://preview-status.test/#courses');await page.addStyleTag({content:css});await page.addScriptTag({type:'module',content:bundle});
  const table=page.getByRole('region',{name:'開放狀態總覽'});
  await page.locator('[data-status-unit="new"]').waitFor();
  const shot=async name=>{assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' overflow');if(out)await page.screenshot({path:path.join(out,`${name}-${width}x${height}.png`),animations:'disabled'});};
  assert.match(await page.locator('[data-status-unit="current"]').innerText(),/已更新到學生端/);
  assert.match(await page.locator('[data-status-unit="modified"]').innerText(),/有修改未更新/);
  assert.match(await page.locator('[data-status-unit="new"]').innerText(),/尚未更新到學生端/);
  assert.match(await page.locator('[data-status-unit="unassigned"]').innerText(),/沒有勾選班級/);
  await table.scrollIntoViewIfNeeded();await shot('overview');
  const writes=()=>page.evaluate(()=>(window.previewStatusTest.calls).filter(c=>['saveCourse','publishCourse','setUnitVisibility'].includes(c.name)));
  assert.equal((await writes()).length,0);
  await page.getByRole('button',{name:'更新到學生端',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();
  assert.match(await dialog.innerText(),/尚未開放的單元，學生仍然看不到/);assert.match(await dialog.innerText(),/目前學習，但沒有任何班級勾選/);assert.match(await dialog.innerText(),/已勾選班級，但仍尚未開放/);assert.match(await dialog.innerText(),/活動：新增 0、修改 1、移除 0/);
  await shot('update-confirm');await dialog.getByRole('button',{name:'取消',exact:true}).click();assert.equal((await writes()).length,0);
  // Published preview shows exactly the selected student's view, not unsaved draft additions.
  const navigate=async name=>{if(width<600){await page.getByRole('button',{name:'切換選單',exact:true}).click();}await page.locator('aside nav').getByRole('button',{name,exact:true}).click();};
  await navigate('教學總覽');await page.getByRole('button',{name:'預覽前台',exact:true}).click();
  await page.getByLabel('預覽班級').waitFor();assert.equal(await page.getByLabel('預覽班級').inputValue(),'test-b');
  const toggle=page.getByLabel('把尚未開放的單元當作已開放');assert.equal(await toggle.isChecked(),false);
  await page.getByText('心臟基礎',{exact:true}).first().waitFor();
  assert.equal(await page.locator('.previewdevice').getByText('呼吸調節',{exact:true}).count(),0);assert.equal(await page.locator('.previewdevice').getByText('新教材單元',{exact:true}).count(),0);await shot('preview-off');
  await toggle.check();await page.locator('.preview-simulation-warning').waitFor();await page.locator('.previewdevice').getByText('呼吸調節',{exact:true}).first().waitFor();await shot('preview-on');
  await page.getByLabel('預覽班級').selectOption('test-a');assert.equal(await page.locator('.previewdevice').getByText('呼吸調節',{exact:true}).count(),0);
  await page.getByRole('button',{name:'返回教師後台',exact:true}).click();await page.getByRole('button',{name:'預覽前台',exact:true}).click();await page.getByLabel('預覽班級').waitFor();assert.equal(await page.getByLabel('預覽班級').inputValue(),'test-a');assert.equal(await toggle.isChecked(),false);assert.equal((await writes()).length,0);
  await page.getByRole('button',{name:'返回教師後台',exact:true}).click();await navigate('學習進度');
  await page.getByText('這裡的變更會立即對學生生效，不需要更新到學生端',{exact:true}).waitFor();await page.getByLabel('新教材單元 整個單元移到').waitFor();
  await page.waitForFunction(()=>!document.querySelector('select[aria-label="新教材單元 整個單元移到"]').disabled);assert((await page.locator('.progress-row > select').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width))).every(w=>w>=132));await shot('progress');
  await page.getByLabel('新教材單元 整個單元移到').selectOption('current');await page.getByText('學生端還沒有這個單元，請先到課程與教材更新到學生端',{exact:true}).first().waitFor();await page.locator('.progress-row').filter({hasText:'新教材單元'}).scrollIntoViewIfNeeded();await shot('progress-missing');
  await navigate('課程與教材');await page.locator('[data-status-unit="new"]').waitFor();
  assert.match(await page.locator('[data-status-unit="new"]').innerText(),/尚未更新到學生端/);
  // Failure cannot be mistaken for absence, nor bypass the confirmation.
  await page.evaluate(()=>window.previewStatusTest.failPublished(true));await page.getByRole('button',{name:'重新讀取學生端',exact:true}).click();await page.getByRole('alert').waitFor();assert(await page.getByRole('button',{name:'更新到學生端',exact:true}).isDisabled());
  await page.evaluate(()=>window.previewStatusTest.failPublished(false));await page.getByRole('button',{name:'重新讀取學生端',exact:true}).click();await page.locator('[data-status-unit="new"]').waitFor();
  await page.getByRole('button',{name:'更新到學生端',exact:true}).click();await dialog.waitFor();await dialog.getByRole('button',{name:'確定更新到學生端',exact:true}).click();await dialog.waitFor({state:'detached'});await page.getByRole('status').filter({hasText:'已更新到學生端'}).waitFor();
  const finalWrites=await writes();assert.equal(finalWrites.filter(c=>c.name==='publishCourse').length,1);assert.equal(finalWrites.filter(c=>c.name==='saveCourse').length,1);assert.equal(finalWrites.filter(c=>c.name==='setUnitVisibility').length,1);
  assert(finalWrites.every(c=>(c.data.courseId||c.data.course?.id)==='MCP-TEST'));assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  reports.push({width,height,courseId:'MCP-TEST',screenshots:6,overflow:false,previewWrites:0,updateCalls:1,errors,externalNetworkRequests:network});await context.close();
 }}finally{await browser.close();}
 if(out)await fs.writeFile(path.join(out,'browser-verification.json'),JSON.stringify(reports,null,2)+'\n');return reports;
}
if(process.argv.includes('--shots'))console.log(JSON.stringify(await verifyPreviewStatus({out:process.env.PREVIEW_STATUS_EVIDENCE||'/private/tmp/preview-status-ui-evidence'}),null,2));
