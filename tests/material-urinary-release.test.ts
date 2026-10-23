import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {approvedUrinarySlugs,approvedUrinaryDocument} from '../scripts/urinary-release-build.mjs';
import {auditOne} from '../scripts/materials.mjs';
test('十份正式教材使用核可播放器與底圖，追蹤入口及實際考核分母一致',()=>{
 for(const slug of approvedUrinarySlugs){
  const d=approvedUrinaryDocument(slug),html=fs.readFileSync(`public/materials/${d.version}/index.html`,'utf8');
  assert.equal(html,d.html,slug);
  assert(html.indexOf('course-learning.js')<html.indexOf(slug==='acid-base-homeostasis'?'function mountStudentScript':'function mountApplyScripted'));
  assert(html.includes('data:image/webp;base64,'),slug+': 核可原圖的固定參數衍生底圖');
  const a=auditOne(d.version);assert(a.hasScript&&a.hasComplete);assert.equal(a.nodeTotal,6);assert.equal(a.questionTotal,d.assessmentIds.length);
 }
});

test('十份題庫匯出採合法單元 ID，只去除教師指定四個名稱的頓號', async()=>{
 const {approvedBank}=await import('../scripts/urinary-release-bank.mjs');
 const {parseBankSheet}=await import('../shared/sheets');
 const {urinaryUnitRenames,urinaryUnitId}=await import('../scripts/lib/urinary-unit-ids.mjs');
 const bank=approvedBank();
 const groups=parseBankSheet([bank.headers,...bank.questions.map(q=>q.row)],'115-1-AP2','115-1-AP2').get('115-1-AP2')!;
 assert.equal(groups.size,10);
 let renamed=0;
 for(const q of bank.questions){
  const title=String(q.row[21]);
  assert.equal(q.row[3],urinaryUnitId(title));
  if(title in urinaryUnitRenames){assert.equal(q.row[3],title.replaceAll('、',''));renamed++;}
  else assert.equal(q.row[3],title);
 }
 assert.equal(renamed,44);
});
