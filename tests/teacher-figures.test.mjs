import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadTeacherFigures,validateTeacherFigurePolicies} from '../materials-src/apply-kit/teacher-figures.mjs';
const manifest=JSON.parse(fs.readFileSync('materials-src/apply-kit/teacher-figures.json'));
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('materials-src/apply-kit/teacher-figures.js','utf8')+'\n'+fs.readFileSync('materials-src/apply-kit/student-figures.js','utf8'),ctx);
const render=(figure,state={})=>ctx.renderScriptedFigure({node:{figure,title:'title'},step:{type:'explore',options:[],labels:[]},state,txt:s=>s,controls:false});
test('concentration: continuous tubule, constant width, separate collecting duct, cortex boundary and depth ticks',()=> {
 const html=render('loop-down');assert.match(html,/data-continuous-tubule[^>]+stroke-width="8"[^>]+stroke-linejoin="round"/);assert.match(html,/data-collecting-duct/);assert.match(html,/data-cortex-boundary/);assert.equal((html.match(/data-gradient-tick/g)||[]).length,4);for(const word of ['皮質','髓質','越深越濃'])assert.ok(html.includes(word));
});
test('concentration: three complete, stage-specific transport arrows; salt does not reach collecting duct',()=> {
 for(const [name,substance] of [['loop-down','water'],['loop-up','NaCl'],['adh','water']]) {
  assert.doesNotMatch(render(name),/data-transport=/);
  const html=render(name,{visited:[0]}); const arrows=[...html.matchAll(/<path data-transport="([^"]+)" d="([^"]+)"[^>]+>/g)];
  assert.equal(arrows.length,3);
  for(const a of arrows) {assert.equal(a[1],substance);assert.match(a[0],/marker-end="url\(#figure-arrow\)"/);if(name==='loop-up')assert.match(a[2],/^M65 \d+H74$/);if(name==='adh')assert.match(a[2],/^M79 \d+H69$/);}
  assert.equal((html.match(/data-water-channel/g)||[]).length,name==='adh'?3:0);
 }
 // Returning from an active ADH node cannot leave water arrows on an unvisited down limb.
 render('adh',{visited:[0]});assert.doesNotMatch(render('loop-down'),/data-transport=/);
});
test('60 nodes have explicit anatomy/data/missing policy; teacher image hashes are checked',()=> {
 assert.equal(manifest.entries.length,60);assert.equal(new Set(manifest.entries.map(e=>e.key)).size,60);
 const dataNames=new Set(['blood-tube','clearance','equation','glucose-slider','concentration','compartments-beaker','ecf-breakdown','icf-ecf-ions','water-balance','electrolyte-dissociation','meq-valency','matching-reference','fluid-summary','ratio-board','reaction-svg']);
 for(const e of manifest.entries) {assert.ok(['anatomy','data','missing'].includes(e.kind));if(e.kind==='data')assert.ok(dataNames.has(e.current),e.key+' '+e.current);if(e.kind==='missing')assert.ok(e.reason&&e.missingId);}
 for(const slug of new Set(manifest.entries.map(e=>e.slug))) {const assets=loadTeacherFigures('materials-src/'+slug);assert.equal(assets.length,6);for(const e of assets.filter(a=>a.kind==='anatomy'))assert.match(e.image,/^data:image\/webp;base64,/);}
});
test('anatomy renderer uses only certified WebP derivatives, and projects hotspots through crop',()=> {
 const asset=loadTeacherFigures('materials-src/urinary-route-micturition')[1];
 const [x,y]=ctx.teacherPoint(asset,'腎盂交接處',0);assert.equal(x,asset.positions[0][0]/100*asset.width-asset.crop[0]);assert.equal(y,asset.positions[0][1]/100*asset.height-asset.crop[1]);
 const html=ctx.renderScriptedFigure({node:{figure:'ureter-constrictions',title:'title',teacherFigure:asset},step:{type:'point',blindHotspots:true,options:['腎盂交接處','髂外動脈及靜脈交叉處','進入膀胱處']},state:{selected:[0]},txt:s=>s});assert.match(html,/data-teacher-image=/);assert.doesNotMatch(html,/data-continuous-tubule/);assert.equal((html.match(/data-found-location=/g)||[]).length,1);
});

test('anatomy cannot silently enter the data whitelist or an unlisted missing-image exception',()=> {
 const data=structuredClone(manifest.entries);data[0].kind='data';assert.throws(()=>validateTeacherFigurePolicies(data),/data whitelist/);
 const missing=structuredClone(manifest.entries);missing[0].kind='missing';missing[0].missingId='G99';missing[0].reason='bypass';assert.throws(()=>validateTeacherFigurePolicies(missing),/Unlisted/);
});
