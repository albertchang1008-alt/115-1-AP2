import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadTeacherFigures} from '../materials-src/apply-kit/teacher-figures.mjs';
import {compileApplyStudentScript} from '../materials-src/apply-kit/scripted-compile.mjs';
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('materials-src/apply-kit/teacher-figures.js','utf8'),ctx);
const get=(slug,n)=>loadTeacherFigures('materials-src/'+slug)[n-1];
const render=(a,state={},step={})=>ctx.renderTeacherFigure(a,{state,step,txt:s=>s});
test('three approved 90 images replace all seven temporary figure policies without altering source raster',()=>{
 for(const [slug,ns]of [['fluid-compartments',[1]],['urine-concentration',[1,2,3,5,6]],['filtration-clearance',[2]]])for(const n of ns){const a=get(slug,n);assert.equal(a.kind,'anatomy');assert.ok(a.src.endsWith(`IMG-${slug}-90.png`));assert.equal(a.missingId,undefined);assert.equal(a.image.split(',')[1],fs.readFileSync(a.src).toString('base64'));}
 const all=JSON.parse(fs.readFileSync('materials-src/apply-kit/teacher-figures.json')).entries;
 assert.equal(all.filter(e=>e.kind==='missing').length,0);
});
test('human water starts at zero, follows slider and is clipped inside the teacher silhouette',()=>{
 const a=get('fluid-compartments',1);
 for(const value of [0,40,60,100]){const h=render(a,{slider:value});assert.match(h,/data-body-water clip-path="url\(#teacher-body-water\)"/);assert.ok(h.includes(a.bodyClip));const y=Number(h.match(/data-water-level x="0" y="([^"]+)"/)[1]);assert.equal(y,a.height*(.953-value*.932/100));}
 assert.match(render(a),/data-water-level[^>]+height="0"/);
});
test('new continuous nephron uses native anchor percentages, no inactive arrows or previous-node water',()=>{
 for(const [n,label]of [[2,'下降枝'],[3,'上升枝'],[5,'ADH']]){
  const a=get('urine-concentration',n);const xy=ctx.teacherPoint(a,label,0);assert.ok(Math.abs(xy[0]-a.width*a.anchors[label][0]/100)<1e-9);assert.ok(Math.abs(xy[1]-a.height*a.anchors[label][1]/100)<1e-9);
  assert.doesNotMatch(render(a),/data-transport-arrow/);
  const h=render(a,{visited:[0]});const arrows=[...h.matchAll(/data-transport-arrow="([^"]+)" d="M([^ ]+) ([^H]+)H([^"]+)"[^>]*>/g)];assert.equal(arrows.length,3);
  for(const arrow of arrows){assert.match(arrow[0],/marker-end="url\(#teacher-arrow\)"/);assert.equal(arrow[1],n===3?'NaCl':'water');if(n===3){assert.ok(Math.abs(Number(arrow[4])-a.width*.73)<1e-9);assert.ok(Number(arrow[4])<a.width*.77);}if(n===5)assert.ok(Number(arrow[2])>Number(arrow[4]));}
  assert.equal((h.match(/data-water-channel/g)||[]).length,n===5?3:0);assert.equal((h.match(/data-gradient-tick/g)||[]).length,4);assert.match(h,/data-cortex-boundary/);
 }
});
test('filtration has four independent physical targets including wall layer, but only the three filter layers in correct sequence',()=>{
 const S=compileApplyStudentScript('materials-src/filtration-clearance'),step=S.nodes[1].steps[0],a=get('filtration-clearance',2);
 assert.equal(step.type,'locate');assert.equal(step.spatial.points.length,4);assert.deepEqual(step.spatial.required,[0,1,2]);assert.ok(a.anchors['鮑氏囊壁層'][0]>a.anchors['足細胞'][0]);assert.ok(Math.abs(step.spatial.points[3][0]-a.width*.95)<1e-9);
});
test('scripted anatomical location tasks use label then image placement rather than text matching',()=>{
 const entries=JSON.parse(fs.readFileSync('materials-src/apply-kit/teacher-figures.json')).entries;
 for(const slug of new Set(entries.map(e=>e.slug).filter(s=>s!=='acid-base-homeostasis'))){const s=compileApplyStudentScript('materials-src/'+slug);for(const n of s.nodes)for(const st of n.steps){const instruction=[st.question,st.instruction].filter(Boolean).map(id=>s.units[id]?.text||id).join('');if(/圖上|指出位置|放到切面圖/.test(instruction))assert.notEqual(st.type,'matching',`${slug} ${instruction}`);}}
});

test('eight sizes: wall is independently selectable, wrong placement resets the whole step, correct labels do not overlap',async()=>{
 const {chromium}=await import('playwright'),{renderApply}=await import('../materials-src/apply-kit/render.mjs'),{finishScriptedNode,performScriptedStep}=await import('../scripts/lib/apply-script-browser.mjs');
 const path=await import('node:path'),{pathToFileURL}=await import('node:url');
 const slug='filtration-clearance',baseDir=path.resolve('materials-src/'+slug),S=compileApplyStudentScript(baseDir),folder=path.resolve('docs/urinary-release/apply9-final/new-figures/wall-regression');fs.mkdirSync(folder,{recursive:true});
 const file=folder+'/preview.html';fs.writeFileSync(file,renderApply(JSON.parse(fs.readFileSync(baseDir+'/apply.json')),{baseDir,view:'course'}));
 const b=await chromium.launch();try{for(const [width,height]of [[360,667],[390,844],[414,896],[768,1024],[820,1180],[1024,1366],[1280,800],[844,390]]){
  const p=await b.newPage({viewport:{width,height}});await p.goto(pathToFileURL(file).href);await p.locator('#start').click();await finishScriptedNode(p,S.nodes[0]);await p.locator('#next-node').click();await p.locator('#begin-action').click();
  if(await p.locator('#locate-skip').count())await p.locator('#locate-skip').click();
  assert.equal(await p.locator('[data-spatial-target]').count(),4);
  for(const row of [0,1,2]){await p.locator(`[data-spatial-card="${row}"]`).click();await p.locator(`[data-spatial-target="${row===2?3:row}"]`).click();}
  await p.locator('#locate-check').click();await p.locator('#strict-retry').waitFor();
  if([390,1280].includes(width))await p.screenshot({path:folder+`/${width}x${height}-wall-wrong.png`});
  await p.locator('#strict-retry').click();assert.deepEqual(await p.evaluate(()=>window.StudentScriptUI.getState().course.locate.values),[null,null,null,null]);
  await performScriptedStep(p,S.nodes[1].steps[0]);
  const overlaps=await p.locator('[data-spatial-stamp]').evaluateAll(es=>es.flatMap((e,i)=>es.slice(i+1).filter(f=>{const a=e.getBoundingClientRect(),b=f.getBoundingClientRect();return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);}).map(f=>e.textContent+' / '+f.textContent)));
  assert.deepEqual(overlaps,[],`${width}x${height}`);
  if([390,1280].includes(width))await p.screenshot({path:folder+`/${width}x${height}-correct-labels.png`});await p.close();
 }}finally{await b.close();}
});
