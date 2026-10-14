import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
export async function verifyStaticGuide(shots = false, built = false) {
  const site = process.env.VITE_SITE_ID || 'ap2';
  const base = site === 'mi' ? '/115-MI/' : '/115-1-AP2/';
  const root = built ? 'dist' : 'public';
  const out = `docs/unify-1.9.0/guide-homescreen-${site}`;
  if (shots) await fs.mkdir(out, { recursive: true });
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    try {
      assert(pathname.startsWith(base));
      const relative = pathname.slice(base.length) || 'index.html';
      assert(!relative.includes('..'));
      const body = await fs.readFile(path.join(root, relative));
      const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.webmanifest':'application/manifest+json' };
      res.writeHead(200, { 'Content-Type': types[path.extname(relative)] || 'application/octet-stream' }); res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'chrome' });
  const report = [];
  try {
    if (built) {
      const index = await fs.readFile('dist/index.html', 'utf8');
      const manifestHref = index.match(/<link[^>]*rel="manifest"[^>]*href="([^"]+)"/)[1];
      const appleHref = index.match(/<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]+)"/)[1];
      const manifestUrl = new URL(manifestHref, origin + base);
      assert(manifestUrl.pathname.startsWith(base));
      const response = await fetch(manifestUrl); assert.equal(response.status, 200);
      const manifest = await response.json(); assert.equal(manifest.display, 'standalone');
      for (const url of [new URL(appleHref, origin + base), ...manifest.icons.map(icon => new URL(icon.src, manifestUrl))]) {
        assert(url.pathname.startsWith(base)); assert.equal((await fetch(url)).status, 200);
      }
      assert.equal(JSON.parse(await fs.readFile('dist/site.json', 'utf8')).id, site);
    }
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      assert.equal((await page.goto(origin + base + 'guide/index.html')).status(), 200);
      const steps = page.locator('details[id^="step-"]'); assert.equal(await steps.count(), 11);
      for (let i = 1; i <= 11; i++) assert.match(await page.locator(`#step-${i} summary`).innerText(), new RegExp(`^${i}\\. `));
      assert.equal(await page.locator('#step-2 summary').innerText(), '2. 加到手機主畫面');
      assert.equal(await page.locator('#step-2 img').count(), 0);
      assert.equal(await page.locator('#step-2 ol').count(), 2);
      assert.equal(await page.locator('#step-2 ol li').count(), 10);
      assert.equal(await page.locator('#step-2 ul li').count(), 5);
      await page.locator('details').evaluateAll(nodes => nodes.forEach(node => node.open = true));
      assert.match(await page.locator('main').innerText(), /加入主畫面/);
      assert.match(await page.locator('main').innerText(), /加到主畫面/);
      await page.locator('img').evaluateAll(images => Promise.all(images.map(img => { img.loading = 'eager'; return img.decode(); })));
      for (const size of ['default', 'xlarge']) {
        await page.locator('#size').selectOption(size);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      await page.locator('#size').selectOption('default');
      const fonts = await page.locator('#step-2 h3, #step-2 li').evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
      assert(fonts.every(size => size >= 16));
      if (shots) await page.screenshot({ path: `${out}/guide-${width}.png`, fullPage: true });
      await page.emulateMedia({ media: 'print' });
      assert.equal(await page.locator('.prefs-bar').isVisible(), false);
      assert.equal(await page.locator('#step-2 ol').first().isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (shots && width === 1280) await page.pdf({ path: `${out}/guide-print.pdf`, format: 'A4', printBackground: true });
      assert.deepEqual(errors, []);
      report.push({ site, width, sections: 11, minFont: Math.min(...fonts), overflow: false, print: true, errors, builtAssetsHttp200: built });
      await page.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
  if (shots) await fs.writeFile(`${out}/verification.json`, JSON.stringify(report, null, 2) + '\n');
  return report;
}
export async function verifyGuide(shots = false) {
  await verifyStaticGuide();
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
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}-${width}: overflow`);
        // Compose a separate caption band outside the unmodified application screenshot.
        const capture=await page.screenshot({fullPage:false,type:'png'});
        const framed=await browser.newPage({viewport:{width,height:998}});
        try {
          await framed.setContent('<style>*{box-sizing:border-box}body{margin:0}header{height:48px;display:flex;align-items:center;padding:0 12px;background:white;color:#075985;font:600 14px system-ui}img{display:block;width:100%;height:950px}</style><header></header><img>');
          await framed.locator('header').evaluate((el,text)=>el.textContent=text,label);
          await framed.locator('img').evaluate((el,data)=>el.src=data,'data:image/png;base64,'+capture.toString('base64'));
          await framed.locator('img').evaluate(el=>el.decode());
          const caption=await framed.locator('header').boundingBox(), content=await framed.locator('img').boundingBox();
          assert(caption && content && caption.y+caption.height<=content.y, 'caption must stay outside app content');
          if(shots) await framed.screenshot({path:`${out}/${name}-${width}.jpg`,type:'jpeg',quality:65});
        } finally { await framed.close(); }
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
      assert.equal(await page.getByText('課程功能（預設關閉；保存草稿即對學生生效，不需發布）',{exact:true}).count(),1);
      const postIds=page.getByLabel('後測來源題目 ID（逗號分隔）');
      const save=async(warning)=>{
        await page.getByRole('button',{name:'保存草稿',exact:true}).click();
        await page.waitForFunction(()=>window.guideTest.notices.at(-1)?.startsWith('草稿已保存'));
        assert.equal(await page.evaluate(()=>window.guideTest.notices.at(-1).includes('提醒：')),warning);
        await page.evaluate(()=>window.guideTest.notices.length=0);
      };
      await postIds.fill('');await save(true);
      assert.deepEqual(await page.evaluate(()=>window.guideTest.saved.assessmentSources.pretest),['q1','q2']);
      await preIds.fill('');await postIds.fill('q3');await save(true);
      assert.deepEqual(await page.evaluate(()=>window.guideTest.saved.assessmentSources),{pretest:[],posttest:['q3']});
      await postIds.fill('');await save(true);
      await preIds.fill('q1');await postIds.fill('q3');await save(false);
      await page.getByLabel('正式前後測',{exact:true}).uncheck();
      await save(false);
      assert.deepEqual(errors,[]);report.push({width,tips:true,links:true,captionOutsideContent:true,assessmentSourceWarnings:true,featureLegend:true,overflow:false,errors});await page.close();
    }
  } finally { await browser.close(); }
  if(shots) await fs.writeFile('docs/unify-1.9.0/guide-ui-verification.json',JSON.stringify(report,null,2)+'\n');
  return report;
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url))) console.log(JSON.stringify(await (process.argv.includes('--guide-only') ? verifyStaticGuide(process.argv.includes('--shots'), process.argv.includes('--dist')) : verifyGuide(process.argv.includes('--shots'))),null,2));
