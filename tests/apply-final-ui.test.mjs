import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {renderApply} from '../materials-src/apply-kit/render.mjs';
import {compileApplyStudentScript} from '../materials-src/apply-kit/scripted-compile.mjs';
import {finishScriptedNode} from '../scripts/lib/apply-script-browser.mjs';
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('materials-src/apply-kit/student-figures.js','utf8'),ctx);
const figure=(name,value)=>ctx.renderScriptedFigure({node:{figure:name,title:'title'},step:{type:'slider',options:[],labels:[]},state:{slider:value},txt:id=>id,controls:false});
test('葡萄糖曲線只畫到目前負荷，橘線超過375才出現，軸與圖例可見',()=>{
 const a=figure('glucose-slider',0), b=figure('glucose-slider',375), c=figure('glucose-slider',400);
 assert.doesNotMatch(a,/data-curve=/);assert.match(b,/data-curve="reabsorbed"/);assert.doesNotMatch(b,/data-curve="urine"/);assert.match(c,/data-curve="urine"/);
 for(const label of ['過濾出來的葡萄糖（mg/min）','量','被回收的葡萄糖','尿中的葡萄糖','375']) assert.ok(a.includes(label));
});
test('體液水位依實際滑桿值升降，不使用預置60%',()=>{
 assert.match(figure('body-water',0),/height="0" fill="#5eaec4"/);assert.match(figure('body-water',60),/height="43.8"/);
});
async function browserCase(slug,fn){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'apply-final-')),baseDir=path.resolve('materials-src',slug), S=compileApplyStudentScript(baseDir),file=path.join(dir,'preview.html');
 fs.writeFileSync(file,renderApply(JSON.parse(fs.readFileSync(path.join(baseDir,'apply.json'))),{baseDir,view:'course'}));
 const browser=await chromium.launch();try{const p=await browser.newPage({viewport:{width:390,height:844}});await p.goto(pathToFileURL(file).href);await p.locator('#start').click();await fn(p,S);}finally{await browser.close();fs.rmSync(dir,{recursive:true,force:true});}
}
test('體液真實拖動時不判分，放開才判分，零值不露60%',()=>browserCase('fluid-compartments',async p=>{
 await p.locator('#begin-action').click();assert.equal(await p.locator('.slider-control output').innerText(),'0%');assert.doesNotMatch(await p.locator('.diagram-region').innerText(),/60%/);
 const b=await p.locator('#glucose-slider').boundingBox();const x=b.x+8+(b.width-16)*.4,y=b.y+b.height/2;
 await p.mouse.move(b.x+8,y);await p.mouse.down();await p.mouse.move(x,y,{steps:8});assert.equal(await p.locator('.script-feedback.error').count(),0);assert.equal(await p.locator('#strict-retry').count(),0);
 assert.match(await p.locator('.slider-control output').innerText(),/40%/);await p.mouse.up();await p.locator('#strict-retry').waitFor();await p.locator('#strict-retry').click();assert.equal(await p.locator('.slider-control output').innerText(),'0%');
}));
test('尿路三處定位無預標與文字答案，44px熱區，錯點整步重置',()=>browserCase('urinary-route-micturition',async(p,S)=>{
 await finishScriptedNode(p,S.nodes[0]);await p.locator('#next-node').click();await p.locator('#begin-action').click();
 assert.equal(await p.locator('[data-found-location]').count(),0);assert.equal(await p.locator('.on-figure [data-operation]').count(),0);
 const buttons=p.locator('[data-spatial-target]');assert.equal(await buttons.count(),3);
 for(const b of await buttons.all()){const r=await b.boundingBox();assert.ok(r.width>=44&&r.height>=44);}
 await p.locator('[data-spatial-target="0"]').click();assert.equal(await p.locator('[data-spatial-stamp]').count(),0);
 await p.locator('[data-spatial-card="0"]').click();await p.locator('[data-spatial-target="1"]').click();
 assert.equal(await p.locator('[data-spatial-stamp="0"]').count(),1);assert.equal(await p.locator('#strict-retry').count(),0);
 for(const i of [1,2]){await p.locator(`[data-spatial-card="${i}"]`).click();await p.locator(`[data-spatial-target="${i===1?0:2}"]`).click();}
 await p.locator('#locate-check').click();await p.locator('#strict-retry').click();assert.equal(await p.locator('[data-spatial-stamp]').count(),0);
}));
test('水鈉舊樣張僅允許核定改題，其他文字仍被凍結檢查擋下',async()=>{
 const {checkSemantics}=await import('../materials-src/apply-kit/semantics.mjs');
 const original=JSON.parse(fs.readFileSync('materials-src/apply-examples/water-sodium-regulation/apply.json'));
 const approved=JSON.parse(fs.readFileSync('materials-src/water-sodium-regulation/apply.json'));
 const options={root:process.cwd(),cite:()=>{}};
 assert.deepEqual(checkSemantics(original,options),[]);assert.deepEqual(checkSemantics(approved,options),[]);
 const bad=structuredClone(approved);bad.title.text+='任意改字';assert.ok(checkSemantics(bad,options).some(e=>e.includes('frozen v1')));
 const badHint=structuredClone(approved);const q=badHint.learning.questions.cases[0];(q.value||q).hint+='任意改提示';assert.ok(checkSemantics(badHint,options).some(e=>e.includes('frozen v1')));
});
test('尿路先配長度，再問男性三段；兩輸尿管口可先點任一側',()=>browserCase('urinary-route-micturition',async(p,S)=>{
 for(let i=0;i<2;i++){await finishScriptedNode(p,S.nodes[i]);await p.locator('#next-node').click();}
 await p.locator('#begin-action').click();
 for(const i of [1,0,2]){await p.locator(`[data-spatial-card="${i}"]`).click();await p.locator(`[data-spatial-target="${i}"]`).click();}
 await p.locator("#locate-check").click();
 await p.locator('#next-step').click();
 const {performScriptedStep}=await import('../scripts/lib/apply-script-browser.mjs');
 await performScriptedStep(p,S.nodes[2].steps[1]);await p.locator('#next-step').click();await p.locator('[data-micro="0"]').click();await p.locator('#micro-submit').click();await p.locator('#next-node').click();await p.locator('#begin-action').click();
 assert.doesNotMatch(await p.locator('body').innerText(),/請從膀胱往外/);
 await performScriptedStep(p,S.nodes[3].steps[0]);await p.locator('#next-step').click();assert.match(await p.locator('h2').innerText(),/請從膀胱往外/);
}));
test('電解質水流只在答對後顯示正向水流，不預選方向',()=>{
 const render=state=>ctx.renderScriptedFigure({node:{figure:'osmosis-direction',title:'title'},step:{type:'point',options:[],labels:[]},state,txt:id=>id,controls:false});
 assert.doesNotMatch(render({}),/M35 50 H65/);assert.match(render({success:true}),/M35 50 H65/);
});
test('濾過物質分類引導正確，手機參考圖實際圖寬至少八成且標籤不壓圖',()=>browserCase('filtration-clearance',async(p,S)=>{
 for(let i=0;i<2;i++){await finishScriptedNode(p,S.nodes[i]);await p.locator('#next-node').click();}
 await p.locator('#begin-action').click();assert.equal(await p.locator('[data-interface="match.guide1"]').innerText(),'先點選一個物質，再選它過得去還是過不去。');
 const m=await p.evaluate(()=>{const svg=document.querySelector('.scripted-svg'),ctm=svg.getScreenCTM();return {width:svg.viewBox.baseVal.width*ctm.a,viewport:innerWidth,labelBottom:document.querySelector('.filter-side-labels').getBoundingClientRect().bottom,plotTop:ctm.f};});
 assert.ok(m.width>=m.viewport*.8,JSON.stringify(m));assert.ok(m.labelBottom<m.plotTop,JSON.stringify(m));
}));
test('電解質方向按鈕作答前使用相同中性色，CSS優先序不洩答',()=>browserCase('electrolyte-balance',async(p,S)=>{
 await finishScriptedNode(p,S.nodes[0]);await p.locator('#next-node').click();await p.locator('#begin-action').click();
 const colors=await p.evaluate(()=>[getComputedStyle(document.querySelector('[data-operation="0"]'),'::after').color,getComputedStyle(document.querySelector('[data-operation="1"]'),'::before').color]);assert.equal(colors[0],colors[1]);assert.equal(colors[0],'rgb(57, 123, 145)');
}));
test('葡萄糖作用結論不在滑桿操作前洩露，操作完成後保留核定原句',()=>browserCase('tubular-handling',async(p,S)=>{
 for(let i=0;i<3;i++){await finishScriptedNode(p,S.nodes[i]);await p.locator('#next-node').click();}
 await p.locator('#begin-action').click();assert.equal(await p.locator('.action-instruction').count(),0);
 await p.locator('#glucose-slider').press('End');await p.locator('#slider-next').click();assert.match(await p.locator('.action-instruction').innerText(),/尿中出現葡萄糖/);
}));
test('腎元梯度標籤在答對後仍留在圖內，不壓住選項',()=>browserCase('urine-concentration',async(p,S)=>{
 await p.locator('#begin-action').click();
 const {performScriptedStep}=await import('../scripts/lib/apply-script-browser.mjs');await performScriptedStep(p,S.nodes[0].steps[0]);
 const overlaps=await p.evaluate(()=>[...document.querySelectorAll('.renal-regions span')].flatMap(label=>[...document.querySelectorAll('.on-figure button')].filter(button=>{const a=label.getBoundingClientRect(),b=button.getBoundingClientRect();return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);}).map(()=>label.textContent)));
 assert.deepEqual(overlaps,[]);
 const labelClear=await p.evaluate(()=>{const label=document.querySelector('[data-interface=renalCortex]').getBoundingClientRect(),svg=document.querySelector('.teacher-svg'),m=svg.getScreenCTM();const capsule={left:m.e+svg.viewBox.baseVal.width*.12*m.a,right:m.e+svg.viewBox.baseVal.width*.33*m.a,top:m.f+svg.viewBox.baseVal.height*.06*m.d,bottom:m.f+svg.viewBox.baseVal.height*.23*m.d};return label.right<=capsule.left||label.bottom<=capsule.top||label.left>=capsule.right||label.top>=capsule.bottom;});assert.ok(labelClear,'cortex label must not cover the teacher capsule outline');
}));
test('手機配合題的 ChatGPT 圖保有可讀高度，標籤不壓在圖框',()=>browserCase('kidney-anatomy',async p=>{
 await p.locator('#begin-action').click();
 const h=await p.locator('.teacher-svg').evaluate(svg=>svg.viewBox.baseVal.height*svg.getScreenCTM().d);
 assert.ok(h>=100,`reference height ${h}`);assert.equal(await p.locator('.figure-legend:visible').count(),0);
}));
test('過濾膜正確位置但順序顛倒仍須重來；壁層有獨立熱區',()=>browserCase('filtration-clearance',async(p,S)=>{
 await finishScriptedNode(p,S.nodes[0]);await p.locator('#next-node').click();await p.locator('#begin-action').click();
 assert.equal(await p.locator('[data-spatial-target]').count(),4);
 for(const i of [2,1,0]){await p.locator(`[data-spatial-card="${i}"]`).click();await p.locator(`[data-spatial-target="${i}"]`).click();}
 await p.locator('#locate-check').click();await p.locator('#strict-retry').click();assert.equal(await p.locator('[data-spatial-stamp]').count(),0);
 await p.locator('[data-spatial-card="3"]').click();await p.locator('[data-spatial-target="3"]').click();assert.equal(await p.locator('[data-spatial-stamp="3"]').count(),1);
}));

test('#29 water v1 approval is exact; further text or evidence changes remain forbidden',async()=>{
 const {checkSemantics}=await import('../materials-src/apply-kit/semantics.mjs');
 const root=process.cwd(),data=JSON.parse(fs.readFileSync(path.join(root,'materials-src/water-sodium-regulation/apply.json'),'utf8'));
 const options={root,cite:()=>{}};
 assert.deepEqual(checkSemantics(data,options),[]);
 for(const edit of [d=>d.title.text+='未核可',d=>d.learning.questions.cases[0].value.hint+='未核可',d=>d.learning.questions.cases[0].sources.push({uid:'fake',quote:'fake'})]){
  const changed=structuredClone(data);edit(changed);assert(checkSemantics(changed,options).some(e=>e.includes('frozen v1')));
 }
});

test('#29 Taiwan terminology allows the literal phrase 過濾過程 but still rejects 濾過',async()=>{
 const {checkApplyContent}=await import('../scripts/apply-content-check.mjs');
 const baseDir=path.join(process.cwd(),'materials-src/filtration-clearance');
 const data=JSON.parse(fs.readFileSync(path.join(baseDir,'apply.json'),'utf8'));
 const cardsDir='/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge';
 const options={baseDir,cardsDir,progressPath:path.join(cardsDir,'../todo_all.jsonl')};
 assert.equal(checkApplyContent(data,options).pass,true);
 const bad=structuredClone(data);bad.learning.questions.cases[0].value.hint+='腎絲球濾過';
 assert(checkApplyContent(bad,options).errors.some(e=>e.includes('banned Taiwan term 濾過')));
});
