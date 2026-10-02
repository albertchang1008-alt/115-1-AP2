// 1.6.3：實際重建教材的節點版面、追蹤與通關回歸。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
const output=path.join(root,'docs/stage1-screenshots');fs.mkdirSync(output,{recursive:true});
try {
  for (const slug of ['cardiac-output','blood-pressure-measurement','capillary-exchange','major-vessels','blood-types','lymphoid-organs','ecg-basics']) {
    for(const width of [390,1280]) {
    const content = JSON.parse(fs.readFileSync(path.join(root, 'materials-src', slug, 'content.json'), 'utf8'));
    const figures = Object.fromEntries([...new Set([content.lab.figure, ...content.nodes.map(n => n.figure)].filter(Boolean))].map(f => [f, fs.readFileSync(path.join(root, 'materials-src/figures', f), 'utf8')]));
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('**/materials/course-learning.js',route=>route.fulfill({contentType:'application/javascript',body:'window.events=[];window.CourseLearning=Object.fromEntries(["explore","nodeTime","answer","hint","complete"].map(k=>[k,(...args)=>events.push({k,args})]));'}));
    await page.goto('file://'+path.join(root,'public/materials',slug+'-v1/index.html'));
    assert.equal(await page.evaluate(() => events.length), 0);
    const figureMeasures=[];
    const measure=async locator=>{
      const results=await locator.evaluateAll(svgs=>svgs.map(svg=>{
        const ratio=svg.getBoundingClientRect().width/svg.viewBox.baseVal.width;
        const texts=[...svg.querySelectorAll('text')].filter(t=>{for(let p=t;p&&p!==svg.parentElement;p=p.parentElement)if(getComputedStyle(p).display==='none')return false;return true}).map(t=>{const b=t.getBBox();return {text:t.textContent,px:parseFloat(getComputedStyle(t).fontSize)*ratio,clipped:b.x<0||b.y<0||b.x+b.width>svg.viewBox.baseVal.width||b.y+b.height>svg.viewBox.baseVal.height}});
        return {minPx:Math.min(...texts.map(t=>t.px)),texts};
      }));
      for(const m of results){assert(m.minPx>=12,slug+': min font '+m.minPx);assert(!m.texts.some(t=>t.clipped),slug+': clipped text '+JSON.stringify(m.texts.filter(t=>t.clipped)));}
      return results;
    };
    if(content.lab.states)for(const state of content.lab.states){
      await page.locator(`button[data-lab-state="${state.id}"]`).click();
      figureMeasures.push({id:state.id,measures:await measure(page.locator('.state-figure svg'))});
      await page.locator('.state-figure').screenshot({path:path.join(output,`${slug}-${width}-lab-${state.id}.png`)});
    }
    const visibleDetail=()=>page.locator('.node-detail:not([hidden])');
    const geometry=[];
    const checkOpen=async n=>{
      await page.waitForFunction(id=>{
        const b=document.querySelector(`[data-node="${id}"]`),d=document.querySelector('#detail-'+id);
        const br=b.getBoundingClientRect(),dr=d.getBoundingClientRect();
        return br.top>=0&&dr.top>=0&&dr.top<innerHeight;
      },n.id);
      // 等平滑捲動停穩，避免只量到動畫途中。
      await page.waitForTimeout(700);
      assert.equal(await visibleDetail().count(),1);
      const measured=await page.evaluate(id=>{
        const b=document.querySelector(`[data-node="${id}"]`),d=document.querySelector('#detail-'+id);
        const br=b.getBoundingClientRect(),dr=d.getBoundingClientRect();
        const row=[...document.querySelectorAll('.node-button')].filter(x=>x.offsetTop===b.offsetTop);
        return {cardTop:br.top,detailTop:dr.top,detailLeft:dr.left,detailWidth:dr.width,rowBottom:Math.max(...row.map(x=>x.getBoundingClientRect().bottom)),gridWidth:document.querySelector('.nodes').getBoundingClientRect().width};
      },n.id);
      assert(measured.cardTop>=0&&measured.detailTop<844&&measured.detailTop>=measured.rowBottom);
      assert(Math.abs(measured.detailWidth-measured.gridWidth)<1);
      assert.equal(await page.locator('.node-button img,.node-button svg').count(),0);
      assert.equal(await page.locator(`#detail-${n.id} .node-figure svg`).count(),1);
      assert.equal(await page.locator(`[data-node="${n.id}"]`).getAttribute('aria-expanded'),'true');
      geometry.push({id:n.id,...measured});
    };
    for(const index of [0,3]) {
      const n=content.nodes[index];
      await page.locator(`[data-node="${n.id}"]`).click();await checkOpen(n);
      await page.screenshot({path:path.join(output,`${slug}-${width}-node-${index+1}.png`)});
    }
    assert.equal(await page.locator('#detail-'+content.nodes[0].id).isVisible(),false);
    await visibleDetail().locator('[data-close-node]').click();
    assert.equal(await visibleDetail().count(),0);
    await page.waitForTimeout(700);
    await page.screenshot({path:path.join(output,`${slug}-${width}-collapsed.png`)});
    // 卡片再次點擊也收合；切換及收合均產生一次 nodeTime。
    const n=content.nodes[0];await page.locator(`[data-node="${n.id}"]`).click();
    await page.locator(`[data-node="${n.id}"]`).click();assert.equal(await visibleDetail().count(),0);
    assert.deepEqual(await page.evaluate(()=>events.filter(e=>e.k==='nodeTime').map(e=>e.args[0])),[content.nodes[0].id,content.nodes[3].id,content.nodes[0].id]);
    for (const n of content.nodes) {await page.locator('[data-node="' + n.id + '"]').click();figureMeasures.push({id:n.id,measures:await measure(page.locator(`#detail-${n.id} svg`))});await page.locator(`#detail-${n.id}`).screenshot({path:path.join(output,`${slug}-${width}-detail-${n.id}.png`)});}
    assert.deepEqual(await page.evaluate(() => events.filter(e => e.k === 'explore').map(e=>e.args[0]).sort()),content.nodes.map(n=>n.id).sort());
    for (let i = 0; i < content.foundation.length; i++) {
      const stage = page.locator('[data-kind="foundation"][data-index="' + i + '"]');
      await stage.waitFor({ state: 'visible' });
      const q = content.foundation[i];
      if (q.type === 'label') {
        await stage.locator('.q-widget').evaluate((el, target) => {
          const state = el.__ecg, range = candidates(target, state.beats, state.view)[0];
          if (!range) throw Error('ECG標示候選範圍缺失');
          const a = el.querySelector('.ecg-start'), b = el.querySelector('.ecg-end');
          a.value = range[0].toFixed(2); a.dispatchEvent(new Event('input'));
          b.value = range[1].toFixed(2); b.dispatchEvent(new Event('input'));
        }, q.target);
        await stage.locator('.ecg-check').click();
      } else {await stage.locator('[data-answer="' + q.answer + '"]').click();if(content.experience==='guided') await stage.locator('.feedback button').click();}
    }
    const first = page.locator('[data-kind="case"][data-index="0"]');
    await first.waitFor({ state: 'visible' });
    await first.locator('[data-answer="' + ((content.cases[0].answer + 1) % 4) + '"]').click();
    assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), 0);
    assert.equal(await first.getByText('重新挑戰本關').isDisabled(), true);
    await first.getByText('前往對應節點複習').click();
    await checkOpen(content.nodes.find(n=>n.id===content.cases[0].nodeId));
    await page.screenshot({path:path.join(output,`${slug}-${width}-review.png`)});
    await first.getByText('重新挑戰本關').click();
    for (let i = 0; i < content.cases.length; i++) {
      const stage = page.locator('[data-kind="case"][data-index="' + i + '"]');
      await stage.waitFor({ state: 'visible' });
      await stage.locator('[data-answer="' + content.cases[i].answer + '"]').click();
      assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), i === content.cases.length - 1 ? 1 : 0);
      if(content.experience==='guided') await stage.locator('.feedback button').click();
    }
    await page.waitForFunction(() => document.querySelector('[data-kind="case"][data-index="4"]').hidden);
    assert.equal(await page.evaluate(() => events.filter(e => e.k === 'complete').length), 1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors, []);
    results.push({ slug, width, figureMeasures, geometry, accordion:true, closeButton:true, explored: 6, foundationPassed: content.foundation.length, retryRequiresReview: true, completeOnLastAnswer: 1, errors });
    await page.close();
    }
  }
  fs.writeFileSync(path.join(root, 'docs/STAGE1_KIT_VERIFY.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
