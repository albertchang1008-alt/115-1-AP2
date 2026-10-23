import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {urinaryUnitId} from './lib/urinary-unit-ids.mjs';
import {unwrap} from '../materials-src/apply-kit/model.mjs';
import {approvedUrinarySlugs} from './urinary-release-build.mjs';
// 人工逐題閱讀題幹和四個選項後的獨立作答判定；不以「圖」字關鍵字一刀切。
const reasons={
 'kidney-anatomy':['題幹直接問器官位置','直接問腎柱構造','已指明尿液自乳頭流出','已指明由內而外方向','以文字詢問器官分工','直接指名紅血球生成素','已描述錐體間且與皮質連續','已給乳頭後與尿流方向','已給腎盂到膀胱及排到體外','已改寫器官鄰近與組成關係','已給只以尿量歸納的限制'],
 'nephron-circulation':['直接問腎元組成','直接比較兩型腎元','已給刷狀緣與立方上皮','已指明腎絲球前後的血流','已給感測管液鈉的條件','直接問FF公式','已給長環與皮髓交界位置','已給血流剛離開出球的起點','已給髓質深處與扁平上皮','已改寫分泌腎素的細胞位置','已給錯用全部血流的算法'],
 'filtration-clearance':['直接問過濾方向','文字列出三層構造候選','已指明正常血漿與濾液比較','直接問促進過濾的壓力','已給公式及欲解釋的量','已給只過濾的物質處理條件','已給一小時與每分鐘的換算條件','已給69 mL/min結果與單位','直接比較菊糖與肌酸酐','已給PAH等同全部血流的主張','已給濾液與血漿的葡萄糖濃度比較'],
 'tubular-handling':['已給管液回血液方向','直接問物質收支式','已給近曲葡萄糖與水的回收','直接問最大轉運量的定義','直接問醛固酮的鈉鉀作用','已給僅見濃度高的證據限制','已給血液進入管液方向','已給其他量固定與再吸收增加','已給尿濃度相同與流量差異','已給正常負荷與完整運輸條件','已給醛固酮增加的條件'],
 'urine-concentration':['直接問濃縮所需兩條件','直接問下降枝性質','已指明上升枝回收鹽','直接問直血管角色','直接問ADH通水機轉','已給其他條件相同與ADH較多','已給回收NaCl而不通水條件','已給錯誤角色稱呼供修正','已給集尿管水通道與通透性增加','已給高梯度但不易通水兩條件','已改寫並明示ADH較少及比較基準'],
 'urinary-route-micturition':['直接問送尿與防逆流機轉','直接問輸尿管中段狹窄','直接問三角的三個開口','直接問隨意骨骼肌括約肌','直接問排尿反射組合','直接問尿量比重與pH定義','已描述斜行穿壁與受壓閉合','已給腎盂到膀胱的尿流方向','已改寫三角由哪三開口界定','已給意識控制排尿出口需求','已給每日尿量與比重兩種紀錄'],
 'fluid-compartments':['已給標準60%示例','已明示以總水量為分母','已改寫並給血漿20%與間液80%','已給4%與16%的標準示例','直接比較血漿與組織間液','已給女性55%及男性65%條件','已給體重與60%標準條件','已明示血管內的血漿','教師19:12核可改寫，60%、4%、16%及不同資料假設均已給','已給同體重成年男女比較','已改寫並描述小離子與蛋白質差異'],
 'water-sodium-regulation':['直接問每日攝取來源','已給沒有明顯流汗的條件','直接問口渴與ADH分工','直接問RAAS血管收縮訊號','直接問兩種激素的直接作用','直接問鈉濃度的量與水條件','三項1500、800、200數值已完整給定','已給沒有流汗等同沒有皮膚失水的主張','已改寫遠端鈉再吸收與鉀分泌增加條件','已明示從腎素往後追蹤','已給同鈉量且水量增加條件'],
 'electrolyte-balance':['已給同起始分子數與完全解離','已給只通水不通溶質膜條件','直接比較當量與粒子概念','直接問內外液主要陽離子','直接問PTH腎端鈣磷作用','直接問鎂的作用','已給等起始分子數與兩種物質','已給二價誤當兩粒子的錯誤主張','問判讀前應確認的膜條件，無需既有圖','已改寫細胞膜與小管方向的整理','已改寫氯離子與PTH作用配對'],
 'acid-base-homeostasis':['直接問維持酸鹼的三系統','直接問碳酸公式分子分母','直接問血紅素的所在','已給呼吸與CO2排出增加','直接問腎排酸留鹼方向','已給NH3承接H+的反應','公式6.1＋log(26/1.3)已完整給出','已給接住H+與是否離體的主張','已給CO2離體需求','已改寫為H+及HCO3-移動方向的文字條件','已給尿液排出更多H+的條件']
};
export function approvedBank(){
 const questions=[],descriptionRows=[],review=[];
 const plain=JSON.parse(fs.readFileSync(path.resolve('docs/urinary-release/plain-language-110/proposal.json'),'utf8'));
 const approved=new Map(plain.questions.map(q=>[q.id,q.after]));
 // #6b: preserve the original 110 approvals and overlay only this exact eight-question revision.
 const echoRaw=fs.readFileSync(path.resolve('docs/urinary-release/answer-echo-fix/changes.json'),'utf8');
 assert.equal(createHash('sha256').update(echoRaw).digest('hex'),'c2ffae2c00788a134c4f637a44b74fe742fcece13d00b62fab1e17f5708ea1e1','answer-echo approval document changed');
 const echo=JSON.parse(echoRaw).bankChanges;assert.equal(echo.length,8);assert.equal(new Set(echo.map(q=>q.id)).size,8);
 for(const change of echo){const prior=approved.get(change.id);assert(prior);assert.deepEqual([change.before.stem,change.before.options,change.before.hint,change.before.explain],[prior.stem,prior.options,prior.hint,prior.explain]);approved.set(change.id,{...prior,...change.after,...change.guidance});}
 const headers=['課程代碼','題目ID','單元','次單元','題序','啟用','題型','問題','選項A','選項B','選項C','選項D','正確答案代碼','Zuvio解答','解析','①先想關鍵字','②提問鏈','③回頭選答案','④一句話記憶','⑤追溯原子卡','圖片網址','講義標題','講義連結','補救資源'];
 for(const [index,slug]of approvedUrinarySlugs.entries()){
  const file=path.resolve('materials-src',slug,'apply.json'),raw=fs.readFileSync(file,'utf8'),c=unwrap(JSON.parse(raw));
  assert.equal(c.learning.questions.foundation.length,6);assert.equal(c.learning.questions.cases.length,5);
  const unit=index<6?'泌尿系統':'體液電解質與酸鹼平衡',url=`https://albertchang1008-alt.github.io/115-1-AP2/materials/${slug}-${c.version}/index.html`;
  const qs=[...c.learning.questions.foundation,...c.learning.questions.cases];
  for(const [i,q]of qs.entries()){
   assert.equal(q.options.length,4);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);assert(q.stem&&q.explain&&reasons[slug][i]);
   const row=['',q.id,unit,urinaryUnitId(c.title),i+1,'TRUE','單選',q.stem,...q.options,'ABCD'[q.answer],String(q.answer+1),q.explain,q.hint||'','','選擇「'+q.options[q.answer]+'」。'+q.explain,q.explain,(q.sources||[]).join('\n'),'',c.title,url,''];
   const a=approved.get(q.id);if(a){assert.deepEqual([q.stem,q.options,q.hint,q.explain],[a.stem,a.options,a.hint,a.explain]);row[17]=a.decide;row[18]=a.memory;}
   questions.push({slug,stage:i<6?'foundation':'cases',id:q.id,source:file,sourceSha256:createHash('sha256').update(raw).digest('hex'),row});
   review.push({id:q.id,standalone:true,reason:reasons[slug][i],stem:q.stem,options:q.options,answer:q.answer,approvedRewrite:['acid-base-homeostasis-case-q04','fluid-compartments-foundation-q03','fluid-compartments-case-q03','electrolyte-balance-case-q04','electrolyte-balance-case-q05','fluid-compartments-case-q05','kidney-anatomy-case-q04','water-sodium-regulation-case-q03','urine-concentration-case-q05','urinary-route-micturition-case-q03','nephron-circulation-case-q04'].includes(q.id)});
  }
  descriptionRows.push([c.title,`11 題｜public/materials/${slug}-${c.version}/index.html；單元：${unit}；核可兩階段6＋5；不含節點小檢核與lab.predict`]);
 }
 assert.equal(new Set(questions.map(q=>q.id)).size,110);
 return {headers,questions,descriptionRows,review,excluded:[],guidancePolicy:'①保留核可hint；②來源無獨立提問鏈，留空，不另編未核可文字；③核對核可答案及解析；④沿用解析；⑤逐字來源。'};
}
if(process.argv[1]?.endsWith('urinary-release-bank.mjs')){
 const bank=approvedBank(),out='docs/urinary-release/release-today/B';fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(out+'/bank-manifest.json',JSON.stringify(bank,null,2)+'\n');
 fs.writeFileSync(out+'/STANDALONE_REVIEW.md','# 給 Claude 的摘要\n- 逐題閱讀十份apply.json中6先備＋5病例題，共110題；均可獨立作答，排除0題。\n- 11份教師核可改寫含fluid-case-q03已比對；44題誘答原樣保留。\n- 不取節點任務、確認題、心智圖、lab.predict；酸鹼正式樣張的10題配對池不另外入庫。\n- 詳細原題四選項與答案見bank-manifest.json；未修改任何核可題目。\n\n|題目ID|獨立作答依據|\n|---|---|\n'+bank.review.map(q=>`|${q.id}|${q.reason}|`).join('\n')+'\n');
 console.log(JSON.stringify({questions:bank.questions.length,excluded:bank.excluded.length,approvedRewrites:bank.review.filter(q=>q.approvedRewrite).length}));
}
