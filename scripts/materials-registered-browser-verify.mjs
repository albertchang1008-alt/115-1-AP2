import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { physiologySlugs,readBuiltMaterial } from './materials-html-content.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await chromium.launch({channel:'chrome'});
const results=[];
const sdk='window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>{const e={k,args};events.push(e);window.captureEvent(e);} ]));';
const layout=async page=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
const measure=async svg=>svg.evaluate(s=>{
  const ratio=s.getBoundingClientRect().width/s.viewBox.baseVal.width;
  const texts=[...s.querySelectorAll('text')].filter(t=>{
    for(let p=t;p&&p!==s.parentElement;p=p.parentElement) if(getComputedStyle(p).display==='none') return false;
    return true;
  });
  return Math.min(...texts.map(t=>parseFloat(getComputedStyle(t).fontSize)*ratio));
});
try {
  for(const slug of physiologySlugs) {
    const {content:c}=readBuiltMaterial(root,slug);
    for(const width of [390,1280]) {
      const page=await browser.newPage({viewport:{width,height:844}});
      const errors=[],captured=[],states=[],nodes=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
      await page.exposeFunction('captureEvent',e=>captured.push(e));
      await page.route('**/materials/course-learning.js',r=>r.fulfill({body:sdk,contentType:'application/javascript'}));
      await page.goto(new URL('file://'+path.join(root,'public/materials',slug+'-v1','index.html')).href);
      await layout(page);
      for(const state of c.lab.states) {
        await page.locator(`button[data-lab-state="${state.id}"]`).click();
        const minPx=await measure(page.locator('.state-figure svg'));
        assert(minPx>=12); states.push({id:state.id,minPx}); await layout(page);
      }
      for(const node of c.nodes) {
        const button=page.locator(`[data-node="${node.id}"]`);
        await button.click();
        const minPx=await measure(page.locator(`#detail-${node.id} svg`));
        assert(minPx>=12);nodes.push({id:node.id,minPx});await layout(page);
        await button.click();await button.click();
      }
      assert.deepEqual(captured.filter(e=>e.k==='explore').map(e=>e.args[0]).sort(),c.nodes.map(n=>n.id).sort());
      for(let i=0;i<6;i++) {
        const stage=page.locator(`[data-kind="foundation"][data-index="${i}"]`);
        await stage.waitFor({state:'visible'});
        await stage.locator(`[data-answer="${c.foundation[i].answer}"]`).click();
        if(c.experience==='guided') await stage.locator('.feedback button').click();
      }
      const first=page.locator('[data-kind="case"][data-index="0"]');
      await first.waitFor({state:'visible'});
      await first.locator(`[data-answer="${(c.cases[0].answer+1)%4}"]`).click();
      assert.equal(captured.filter(e=>e.k==='complete').length,0);
      const retry=first.getByText('重新挑戰本關',{exact:true});
      assert.equal(await retry.isDisabled(),true);
      await first.getByText('前往對應節點複習',{exact:true}).click();
      assert.equal(await retry.isEnabled(),true);await retry.click();
      for(let i=0;i<5;i++) {
        const stage=page.locator(`[data-kind="case"][data-index="${i}"]`);
        await stage.waitFor({state:'visible'});
        await stage.locator(`[data-answer="${c.cases[i].answer}"]`).click();
        assert.equal(captured.filter(e=>e.k==='complete').length,i===4?1:0);
        if(c.experience==='guided'&&i<4) await stage.locator('.feedback button').click();
      }
      await layout(page);assert.deepEqual(errors,[]);
      await page.close();
      assert.equal(captured.filter(e=>e.k==='complete').length,1);
      results.push({slug,width,states,nodes,exploreIds:c.nodes.map(n=>n.id),exploreCount:6,retryRequiresReview:true,completeWithoutResultClick:1,completeAfterClose:1,consoleErrors:errors,horizontalOverflow:false});
    }
  }
  fs.writeFileSync(path.join(root,'docs/MATERIALS_REGISTERED_BROWSER_VERIFY.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results.map(r=>({slug:r.slug,width:r.width,mainMinPx:Math.min(...r.states.map(s=>s.minPx)),nodesMinPx:Math.min(...r.nodes.map(n=>n.minPx)),completeAfterClose:r.completeAfterClose,consoleErrors:r.consoleErrors})),null,2));
} finally {await browser.close();}
