import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export async function verifyGuide(shots = false) {
  const bundle = buildSync({ entryPoints: ['tests/fixtures/student-guide.tsx'], bundle:true,write:false,format:'iife',platform:'browser',define:{ 'import.meta.env':'{}','process.env.NODE_ENV':'"production"' } }).outputFiles[0].text;
  const css = (await fs.readFile('src/style.css','utf8')).replace(/^@import[^;]+;\s*/,'');
  const browser = await chromium.launch({channel:'chrome'}); const report=[];
  const out='public/guide/img'; if(shots) await fs.mkdir(out,{recursive:true});
  try {
    for(const width of [1280,390]) {
      const page=await browser.newPage({viewport:{width,height:950}}); const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',async r=>{
        const url=new URL(r.request().url());
        if(url.hostname==='guide.test') {
          if(url.pathname.includes('/materials/')) return r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width"><h1>測試班閱讀教材</h1><p>此範例僅用於介面驗收。</p>'});
          return r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>'});
        }
        if(url.hostname.includes('github.io')) return r.fulfill({contentType:'text/html',body:'<h1>測試教材</h1>'});
        return r.abort();
      });
      await page.goto('https://guide.test/'); await page.addStyleTag({content:css});await page.addScriptTag({content:bundle});
      await page.getByRole('region',{name:'首次使用提示'}).waitFor();
      const tip=page.getByRole('region',{name:'首次使用提示'});
      await tip.getByRole('button',{name:'下一張'}).click();assert.match(await tip.innerText(),/單元頁的分頁/);
      await tip.getByRole('button',{name:'下一張'}).click();assert.match(await tip.innerText(),/完成度怎麼算/);
      await tip.getByRole('button',{name:'開始使用'}).click();assert.equal(await tip.count(),0);
      assert.equal(await page.evaluate(()=>localStorage.getItem('course-guide-seen:guide-test:guide-test-student')),'1');
      await page.evaluate(()=>window.guideTest.render('unit')); await page.getByRole('tab',{name:/^課前/}).waitFor();
      await page.evaluate(()=>window.guideTest.render('home'));assert.equal(await tip.count(),0);
      assert.equal(await page.getByRole('link',{name:'？使用說明'}).getAttribute('href'),'./guide/index.html');
      await page.evaluate(()=>{localStorage.removeItem('course-guide-seen:guide-test:guide-test-student');window.guideTest.render('home-skip');});
      await tip.waitFor();await tip.getByRole('button',{name:'略過提示'}).click();await page.evaluate(()=>window.guideTest.render('home-again'));assert.equal(await tip.count(),0);
      await page.evaluate(()=>window.guideTest.render('tips-other'));await tip.waitFor();await tip.getByRole('button',{name:'略過提示'}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('course-guide-seen:tips-other:other-test-student')),'1');
      await page.evaluate(()=>{window.originalStorage={get:Storage.prototype.getItem,set:Storage.prototype.setItem};Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};window.guideTest.render('tips-blocked');});await tip.waitFor();await tip.getByRole('button',{name:'略過提示'}).click();assert.equal(await tip.count(),0);
      await page.evaluate(()=>{Storage.prototype.getItem=window.originalStorage.get;Storage.prototype.setItem=window.originalStorage.set;window.guideTest.render('home');});
      const shot=async(name)=>{
        const marks={home:['.todo-strip','① 待辦入口'],completion:['.progress-unit-list','② 必做單元完成項目'],unit:['.unit-tabs','③ 學習階段分頁'],practice:['.practice-list','④ 完整測驗才計分'],reflection:['textarea','⑤ 必做題填寫後送出'],login:['a[href="./guide/index.html"]','⑥ 未登入也能看說明'],answers:['.options','⑦ 選項每次打散'],material:['.activitycards','⑧ 看活動類型與完成条件'],settings:['.settings-sheet','⑨ 色系與字級']};
        const [selector,label]=marks[name];
        const target=page.locator(selector).first(); if(await target.count()) await target.scrollIntoViewIfNeeded();
        await page.evaluate(({selector,label})=>{
          const el=document.querySelector(selector); if(!el) return;
          const rect=el.getBoundingClientRect(); const badge=document.createElement('div');badge.id='guide-shot-label';badge.textContent=label;
          Object.assign(badge.style,{position:'fixed',top:Math.max(4,Math.min(innerHeight-40,rect.top-32))+'px',left:Math.max(4,Math.min(innerWidth-230,rect.left))+'px',zIndex:'1000',background:'#075985',color:'#fff',padding:'4px 8px',borderRadius:'4px',fontSize:'14px',fontFamily:'system-ui'});document.body.append(badge);
        },{selector,label});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}-${width}: overflow`);
        if(shots) await page.screenshot({path:`${out}/${name}-${width}.jpg`,fullPage:false,type:'jpeg',quality:65});
        await page.locator('#guide-shot-label').evaluateAll(els=>els.forEach(el=>el.remove()));
      };
      await page.getByRole('button',{name:'查看全部待辦',exact:true}).click();await shot('home');await shot('completion');
      await page.evaluate(()=>window.guideTest.render('unit'));await page.getByRole('tab',{name:/^課前/}).waitFor();await shot('unit');
      await page.getByRole('tab',{name:/^練習/}).click();await shot('practice');
      await page.evaluate(()=>window.guideTest.render('reflection'));await page.getByText('測試班反思',{exact:true}).waitFor();await shot('reflection');
      await page.evaluate(()=>window.guideTest.render('login'));await page.getByRole('link',{name:'第一次使用？看使用說明'}).waitFor();await shot('login');
      // Capture real settings controls and an actual practice quiz/result using the same test-only API.
      await page.evaluate(()=>window.guideTest.render('unit'));await page.getByRole('tab',{name:/^練習/}).click();
      await page.getByRole('button',{name:/^完整測驗/}).first().click();
      await page.locator('.quiz').waitFor({timeout:5000}).catch(async e=>{console.log(await page.evaluate(()=>({hash:location.hash,notices:window.guideTest.notices,body:document.body.innerText})));throw e;});await shot('answers');
      // Use the activity card view to show type and completion labels without loading any remote material.
      await page.evaluate(()=>window.guideTest.render('unit'));await page.getByRole('tab',{name:/^課前/}).click();await shot('material');
      await page.getByRole('button',{name:'顯示設定',exact:true}).click();await shot('settings');
      await page.evaluate(()=>window.guideTest.render('teacher'));
      const preIds=page.getByLabel('前測來源題目 ID（逗號分隔，保存後同步題庫）');await preIds.fill('');await preIds.pressSequentially('q1,q2');assert.equal(await preIds.inputValue(),'q1,q2');
      await page.getByRole('button',{name:'保存草稿',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.guideTest.saved.assessmentSources.pretest),['q1','q2']);
      assert.deepEqual(errors,[]);report.push({width,tips:true,links:true,overflow:false,errors});await page.close();
    }
  } finally { await browser.close(); }
  if(shots) await fs.writeFile('docs/unify-1.9.0/guide-ui-verification.json',JSON.stringify(report,null,2)+'\n');
  return report;
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url))) console.log(JSON.stringify(await verifyGuide(process.argv.includes('--shots')),null,2));
