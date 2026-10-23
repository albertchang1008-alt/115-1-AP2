import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {chromium} from 'playwright';
import {compileApplyStudentScript} from '../materials-src/apply-kit/scripted-compile.mjs';
import {spatialRules} from '../materials-src/apply-kit/spatial-policy.mjs';
const slugs=[...new Set(Object.keys(spatialRules).map(k=>k.split(':')[0])),'urine-concentration'];
test('圖上動作不得使用逐列選單，24步驟共用圖上定位',()=>{
 let count=0;
 for(const slug of slugs){const S=compileApplyStudentScript('materials-src/'+slug);
 for(const node of S.nodes)for(const step of node.steps){
 const text=[step.instruction,step.question].map(id=>S.units[id]?.text||id||'').join(' ');
 if(/圖上|指出位置|放到.*位置/.test(text))assert.notEqual(step.type,'matching',`${slug}: ${text}`);
 if(step.type==='locate'){count++;assert.ok(step.spatial.points.length);}
 }}assert.equal(count,24);
});
test('24定位步驟八尺寸：圖寬80%、熱區44px、原始錨點投影與可捲動到達',async()=>{
 const context=vm.createContext({});for(const file of ['teacher-figures.js','spatial-figure.js'])vm.runInContext(fs.readFileSync('materials-src/apply-kit/'+file,'utf8'),context);
 const css=fs.readFileSync('materials-src/apply-kit/student.css','utf8')+fs.readFileSync('materials-src/apply-kit/scripted.css','utf8');
 const browser=await chromium.launch();try{
 for(const [width,height]of [[360,667],[390,844],[414,896],[768,1024],[820,1180],[1024,1366],[1280,800],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}});
 for(const slug of slugs){const S=compileApplyStudentScript('materials-src/'+slug);
 for(const node of S.nodes)for(const step of node.steps)if(step.type==='locate'){
 const html=context.renderSpatialFigure({node,step,state:{phase:'action',locate:{values:step.cards.map((_,r)=>step.spatial.required.includes(r)?step.spatial.expected[r]:null)}},txt:id=>S.units[id]?.text||id});
 await page.setContent(`<style>${css}</style><main class="student-main spatial-course"><section class="diagram-region">${html}</section></main><script>${context.layoutSpatialStamps.toString()};layoutSpatialStamps()</script>`);
 const collisions=await page.evaluate(()=>{const labels=[...document.querySelectorAll('[data-spatial-stamp]')],targets=[...document.querySelectorAll('[data-spatial-target]')];const hit=(a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1;};return labels.flatMap((a,i)=>[...labels.slice(i+1),...targets].filter(b=>hit(a,b)).map(b=>[a.textContent,b.textContent]));});assert.deepEqual(collisions,[],`${slug} ${width} labels`);
 const geometry=await page.evaluate(()=>{const canvas=document.querySelector('.spatial-canvas').getBoundingClientRect();return{canvas:canvas.width,targets:[...document.querySelectorAll('[data-spatial-target]')].map(b=>{const r=b.getBoundingClientRect();return{width:r.width,height:r.height,x:(r.x+r.width/2-canvas.x)/canvas.width,y:(r.y+r.height/2-canvas.y)/canvas.height};})};});
 assert.ok(geometry.canvas>=width*.8,`${slug} width ${width}: ${geometry.canvas}`);
 for(const [i,a]of geometry.targets.entries())for(const b of geometry.targets.slice(i+1))assert.ok(Math.hypot((a.x-b.x)*geometry.canvas,(a.y-b.y)*step.spatial.crop[3]/step.spatial.crop[2]*geometry.canvas)>=44-.1,`${slug} ${width}: centres >=44px`);
 for(const [i,p]of geometry.targets.entries()){assert.ok(p.width>=44&&p.height>=44);assert.ok(Math.abs(p.x-step.spatial.points[i][0]/step.spatial.crop[2])<.002);assert.ok(Math.abs(p.y-step.spatial.points[i][1]/step.spatial.crop[3])<.002);
 await page.locator(`[data-spatial-target="${i}"]`).scrollIntoViewIfNeeded();assert.ok(await page.locator(`[data-spatial-target="${i}"]`).isVisible());}
 }}await page.close();
 }}finally{await browser.close();}
});
