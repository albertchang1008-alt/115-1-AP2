import fs from 'node:fs';
import path from 'node:path';
import {compileApplyStudentScript} from '../materials-src/apply-kit/scripted-compile.mjs';
import {spatialRules} from '../materials-src/apply-kit/spatial-policy.mjs';
const root='docs/urinary-release/apply9-final',out=root+'/label-on-figure';
const entries=JSON.parse(fs.readFileSync('materials-src/apply-kit/teacher-figures.json')).entries;
const slugs=[...new Set(entries.map(e=>e.slug))],summary=[];
for(const slug of slugs){
 const dir=out+'/final/'+slug,layout=JSON.parse(fs.readFileSync(dir+'/layout-results.json')),diff=JSON.parse(fs.readFileSync(dir+'/SCRIPT_DIFF.json'));
 if(layout.summary.fail||!diff.pass)throw Error(slug+' has failing checks');
 if(new Set(layout.results.map(r=>r.width+'x'+r.height)).size!==8)throw Error(slug+' missing sizes');
 fs.rmSync(dir+'/first-failure.json',{force:true});
 summary.push({slug,layout:layout.summary,scriptDiff:diff.pass,requiredUnits:diff.requiredUnits});
 const shots=layout.results.filter(r=>r.file);
 fs.writeFileSync(dir+'/SHOTS.md','# 截圖\n\n'+shots.map(r=>`- [${r.width}×${r.height} ${r.name}](${r.file})：${r.description}`).join('\n')+'\n');
}
const spots=slugs.flatMap(slug=>{const file=out+'/spotchecks/'+slug+'/checks.json';return fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):[];});if(spots.length!==72||spots.some(r=>!r.pass))throw Error('Spatial spot checks incomplete or failing');
const cases=summary.reduce((s,r)=>s+r.layout.cases,0);
const changed=new Set(Object.keys(spatialRules).map(k=>k.split(':').slice(0,2).join(':')));
const lines=['# 給 Claude 的摘要','',
 '- 共用定位介面：先選標籤→原圖錨點；23 關／24 步驟，kidney N2 已修。',
 `- PASS：十份 SCRIPT_DIFF、八尺寸 ${cases}/${cases}、content-check 10/10、npm run check。`,
 '- PASS：相關測試74/74（含新定位與新底圖）；圖寬≥80%、熱區≥44px、錯誤清空重排與統一送出。',
 '- 檔案：spatial-policy.mjs、spatial-figure.js、scripted-player.js／CSS、FIGURE_MAP.md、測試與本報告。',
 '- 偏離：長圖在圖框內捲動，固定標籤盤／送出；保持圖寬，避免橫式縮成小圖。',
 '- 抽查：kidney N2、filtration N2、nephron N1、urinary N4、水鈉 N2。',
 '- 未更動核定腳本／student-plan／題庫／教師 reviewed；未 push、合併或部署。',
 '', '## 操作與保留規則','',
 '首次引導：「先點一個標籤，再點圖上它所在的位置」。未選標籤時點圖不作答；標籤可重新定位，佔用位置就地交換。放置過程不判分，按送出後統一檢查；錯誤回饋後依丙規則整步清空並重排。順序題另檢查點選順序；膀胱兩側輸尿管口保留任一側先點。方向題在圖上放完標籤後調整真實箭頭，再統一送出。',
 '', '圖框內捲動是明確的局部查看操作；頁面與送出鈕不跟著溢出。八尺寸檢查仍檢查圖框／標籤盤／頁面邊界及字級，只排除圖框內刻意捲動的內容超出視窗；另逐一驗證 24 步驟在八尺寸的圖寬、44px、錨點投影和可到達性。密集錨點放大局部原圖，按原圖座標投影；重疊熱區按點擊位置到真實錨點的距離解析，與所選答案無關。',
 '', '## 逐關盤點與390×844前後畫面','',
 '修改前取自 7e96c3af 的既有 teacher-figures 截圖；未重製舊畫面。修改後為本次實際瀏覽器通關截圖。部分舊關原為直接點選／順序按鈕，也統一為標籤→位置。資料圖保留資料元件，定位到分區而非文字選單。',
 '', '| 教材／關 | 最終操作與理由 | 修改前 | 修改後 |','|---|---|---|---|'];
for(const slug of slugs){
 const S=slug==='acid-base-homeostasis'?null:compileApplyStudentScript('materials-src/'+slug);
 for(let n=1;n<=6;n++){
 const steps=S?.nodes[n-1].steps||[];const loc=steps.map((s,i)=>[s,i]).filter(([s])=>s.type==='locate');
 const key=slug+':'+n,dir='label-on-figure/final/'+slug+'/shots/';
 if(changed.has(key)){
 const before=`label-on-figure/before/${slug}-N${n}.png`;
 if(!fs.existsSync(root+'/'+before))throw Error('Missing '+before);
 const after=loc.map(([s,i])=>`[步驟${i+1}作答前](label-on-figure/spotchecks/${slug}/N${n}-S${i+1}-before.png)／[答錯](label-on-figure/spotchecks/${slug}/N${n}-S${i+1}-wrong.png)／[答對](label-on-figure/spotchecks/${slug}/N${n}-S${i+1}-correct.png)`).join('；');
 lines.push(`| ${slug} N${n} | ${loc.map(([s,i])=>`S${i+1} 標籤→${s.spatial.data?'資料分區':'原圖錨點'}${s.spatial.sequence?'（順序）':''}`).join('；')} | [修改前](${before}) | ${after} |`);
 }else{
 const modes=[...new Set(steps.map(s=>s.type))].join('／');
 const reason=slug==='acid-base-homeostasis'?'文字角色／公式／化學緩衝或方向操作，沒有圖上定位選單':steps.some(s=>s.type==='matching')?'文字角色對工作／定義／類別，保留逐列配對':`保留 ${modes}；不是圖上標籤配對`;
 lines.push(`| ${slug} N${n} | ${reason} | — | [目前畫面](${dir}390x844-N${slug==='acid-base-homeostasis'?String(n).padStart(2,'0'):n}-before.png) |`);
 }
 }}
lines.push('', '## 錨點與底圖','',
 '座標來源為 FIGURE_MAP／teacher-figures.json；spatial-policy.mjs 明列每步使用的鍵與原圖 crop。水鈉 N2 補上腎(38%,61%)、肺(86%,23%)、皮膚(86.6%,44%)、腸(80%,60%)：題目要尿液→腎、糞便→腸，不能沿用「尿液」的膀胱圖示或「糞便」圖示作器官熱區。',
 '', 'filtration N2 沿用教師新 G03 原圖，四個實體位置各自可點；壁層為核定腳本的干擾項，只有內皮→基底膜→足細胞是通過路徑。新圖接入依 CODEX_TASK_apply9-integrate-new-figures_2026-10-22.md，PNG 不改寫。腎元新圖的下降枝／上升枝／ADH 等箭頭沿用 FIGURE_MAP 與教師23:18規則。',
 '', '## 驗收索引','', '最終置標避讓後，另以八尺寸192組幾何測試與72張手機實拍複驗；文字以引線連回真實錨點，不互壓或蓋住熱區。完整流程結果及SCRIPT_DIFF在下表。', '', '| 教材 | 八尺寸 | SCRIPT_DIFF | 完整預覽 |','|---|---|---|---|');
for(const r of summary)lines.push(`| ${r.slug} | [${r.layout.pass}/${r.layout.cases}](label-on-figure/final/${r.slug}/layout-results.json) | [PASS](label-on-figure/final/${r.slug}/SCRIPT_DIFF.json) | [開啟](label-on-figure/${changed.has(r.slug+':1')||Object.keys(spatialRules).some(k=>k.startsWith(r.slug+':'))?'spotchecks':'final'}/${r.slug}/${r.slug==='acid-base-homeostasis'?'checked-student':'preview'}.html) |`);
lines.push('', '驗證命令：`node scripts/teacher-figure-check.mjs --out-root=docs/urinary-release/apply9-final/label-on-figure/final`；`node --test tests/apply-*.test.mjs tests/acidbase-*.test.mjs tests/teacher-figures.test.mjs tests/label-on-figure.test.mjs tests/new-teacher-figures.test.mjs`；`npm run check`。content-check 完整引文紀錄在 [content](label-on-figure/content)。', '', '原始腳本與 student-plan SHA 由各份 SCRIPT_DIFF 留存；本次未修改其來源。教師視覺裁定維持待試用，不自行標 reviewed。');
fs.writeFileSync(root+'/LABEL_ON_FIGURE.md',lines.join('\n')+'\n');
fs.writeFileSync(out+'/SUMMARY.json',JSON.stringify({changedNodes:changed.size,changedSteps:Object.keys(spatialRules).length,cases,summary},null,2)+'\n');
for(const f of fs.readdirSync(out+'/final')){const folder=out+'/final/'+f;for(const name of fs.readdirSync(folder))if(/\.(md|txt)$/.test(name)){const file=folder+'/'+name;fs.writeFileSync(file,fs.readFileSync(file,'utf8').trimEnd()+'\n');}}
console.log({cases,changedNodes:changed.size,changedSteps:Object.keys(spatialRules).length});
