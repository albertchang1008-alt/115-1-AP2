// Run with the bundled @oai/artifact-tool runtime. Append-only; requires an immutable baseline.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
import { physiologySlugs, readBuiltMaterial } from './materials-html-content.mjs';

const [root, baseline, temp, python] = process.argv.slice(2);
assert(root && baseline && temp && python, 'Arguments: repository baseline.xlsx temporary-dir bundled-python');
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(baseline));
const sheet = wb.worksheets.getItem('題庫'), notes = wb.worksheets.getItem('說明');
const oldRows = sheet.getRange('A2:X107').values;
assert.equal(oldRows.length, 106);
const usedIds = new Set(oldRows.map(r => r[1]));
assert.equal(usedIds.size, 106);

// Each pair is specific to the question: key cues, then a question-led reasoning chain.
// Traditional explanations of the first two materials are grounded in their approved nodes.
const guides = {
  'blood-vessels': [
    ['離心、交換、回心', '離開心臟先進哪類血管？→ 在哪裡交換物質？→ 交換後由哪類血管回心？', '動脈帶離心臟，微血管交換物質，靜脈送回心臟。'],
    ['直接接觸血液、最內側', '血液流在管腔內嗎？→ 哪一膜位於管腔最內側？→ 中膜與外膜會直接接觸血液嗎？', '內膜的內皮直接接觸血液；中膜含平滑肌，外膜在最外側。'],
    ['中膜、承受高壓', '剛離開心臟的血液壓力較高嗎？→ 哪類血管需要較厚的平滑肌與彈性纖維？', '動脈的中膜通常最發達，有助承受高壓及調節管徑。'],
    ['交換、薄壁、短距離', '交換物質需要跨過管壁嗎？→ 管壁厚還是薄較容易交換？→ 哪個選項描述薄壁？', '微血管主要由單層內皮與基底膜構成，薄壁縮短交換距離。'],
    ['下肢、逆流、單向門', '下肢血液回心時可能向下倒流嗎？→ 哪個構造像只能向心臟開啟的門？', '靜脈瓣膜可減少逆流；骨骼肌擠壓靜脈可協助回流。'],
    ['總截面積、很多細管', '題目問單根管徑還是所有血管加總的面積？→ 哪類血管雖細但數目最多？', '微血管單根很細但數目多，總截面積最大。'],
    ['厚壁、圓管腔、中膜', '厚壁需要較多平滑肌與彈性纖維嗎？→ 這是哪類承受高壓血管的特徵？', '動脈的中膜較發達，模型中的厚壁與較圓管腔符合動脈。'],
    ['小腿肌肉、回流', '肌肉收縮會擠壓周圍血管嗎？→ 哪類血管配合瓣膜把血液送回心臟？', '小腿肌肉幫浦配合靜脈瓣膜，協助下肢靜脈回流。'],
    ['血流最慢、總截面積最大', '總流量相近時，總截面積增加會讓流速快還是慢？→ 哪個網絡面積最大？', '微血管網總截面積最大、平均流速最慢，有利充分交換。'],
    ['紅血球單列、細小管腔', '單列通過表示管腔寬還是細？→ 哪種血管既細又只有薄壁？', '微血管管腔極細，紅血球常以單列通過。'],
    ['回彈、射血緩衝', '射血時哪種血管先擴張？→ 心室舒張時哪種血管的回彈可維持血流？', '大動脈射血時擴張、舒張時回彈，可緩衝間歇射血並維持血流。'],
  ],
  'circulation-routes': [
    ['體循環、主動脈、腔靜脈', '主動脈從哪個心室出發？→ 全身交換後的血液經腔靜脈回到哪個心房？', '體循環由左心室出發，經全身交換後回到右心房。'],
    ['肺動脈、肺靜脈、換氧前後', '到肺泡前的血液缺氧還是充氧？→ 換氧後經肺靜脈返回的血液含氧量如何？', '肺動脈攜帶缺氧血到肺；肺靜脈攜帶換氧後的充氧血回左心房。'],
    ['串聯、總血流量', '血液是否接著走過肺循環與體循環？→ 若兩者流量長期不同，會在某處累積嗎？', '肺循環與體循環串聯，正常平衡時兩者總血流量相同。'],
    ['消化道、先進肝臟', '題目要找進肝臟還是離開肝臟的血管？→ 哪條靜脈連接消化道與肝臟？', '消化道吸收的養分經肝門靜脈先進入肝臟，再由肝靜脈離開。'],
    ['冠狀動脈、起點', '冠狀動脈要把充氧血送給心肌嗎？→ 左心室剛射出的血液先進入哪條大血管？', '左、右冠狀動脈直接分支自升主動脈根部，供應心肌。'],
    ['胎兒、兩條大動脈間的旁路', '題目連接的是心房還是大動脈？→ 哪個導管連接肺動脈幹與主動脈？', '動脈導管連接肺動脈幹與主動脈；卵圓孔連接兩個心房。'],
    ['腳趾回心、下一次換氧', '全身回流的缺氧血先到右心嗎？→ 右心室再把血液送到哪裡吸收氧氣？', '全身缺氧血回到右心後，經肺動脈到肺泡周圍微血管換氧。'],
    ['午餐養分、肝門脈', '消化道吸收的養分會先經肝門靜脈嗎？→ 這條血管先送到哪個器官？', '消化道吸收的養分先經肝門靜脈送入肝臟處理。'],
    ['心肌本身、專屬供血', '心腔內有血就能取代心肌自己的血液供應嗎？→ 哪條循環從升主動脈根部供應心肌？', '冠狀循環由冠狀動脈供應心肌，靜脈血經冠狀靜脈竇回右心房。'],
    ['保護肺泡、低阻力', '全身迴路與肺迴路哪個阻力較低？→ 薄的肺泡微血管需要較高還是較低壓力？', '肺循環壓力與阻力較低，有助保護薄的肺泡微血管。'],
    ['動脈導管、出生後遺跡', '肺開始換氣後還需要這條繞肺旁路嗎？→ 動脈導管閉鎖後留下哪種韌帶？', '動脈導管出生後閉鎖形成動脈韌帶；卵圓孔則留下卵圓窩。'],
  ],
  'blood-pressure-regulation': [
    ['血壓升高、伸展、負回饋', '伸展增加會使受器放電增加嗎？→ 延腦整合後要降低還是加強交感作用？→ 心率如何變？'],
    ['氣體、酸鹼、化學訊號', '受器監測的是機械伸展還是血中化學成分？→ 氧氣、二氧化碳與氫離子屬哪一類？'],
    ['腎素、RAAS 起點', 'RAAS 起點要釋放的是腎素還是醛固酮？→ 腎臟哪類細胞負責釋放腎素？'],
    ['ADH、水再吸收', 'ADH 使水留在體內還是排到尿中？→ 集合管的水再吸收因此增加還是減少？'],
    ['ANP、排鈉排水', '心房伸展反映體液增加嗎？→ ANP 要協助保留還是排出鈉與水？'],
    ['CO、TPR、乘積', 'MAP 近似哪兩個變因的乘積？→ 兩個因子都增加，乘積會增加還是減少？'],
    ['站起、血壓下降、反射', '血壓下降使壓力受器伸展與放電增多還是減少？→ 交感反應要怎樣協助血壓回升？'],
    ['O₂ 下降、CO₂ 與 H⁺ 增加', '刺激是管壁伸展還是氣體與酸鹼變化？→ 哪種受器直接監測這些化學變化？'],
    ['腎灌流下降、第一步', '先啟動 RAAS 的訊號是什麼？→ 腎臟最先釋放腎素還是直接釋放醛固酮？'],
    ['心房伸展、降低過多血容量', '要減少血容量，應保留還是排出鈉水？→ 哪個心房來源激素促進排出？'],
    ['頸動脈竇、伸展增加', '血壓上升會使受器放電增加還是減少？→ 負回饋會讓交感與心率上升還是下降？'],
  ],
  'lymphatic-system': [
    ['組織間隙、淋巴微管', '液體原本位在細胞內還是組織間隙？→ 進入淋巴微管後改稱什麼？'],
    ['蛋白質、紅血球、部位差異', '淋巴會回收組織液中的蛋白質嗎？→ 健康淋巴通常有大量紅血球嗎？→ 組成是否因部位而異？'],
    ['不是動力、血管與淋巴管', '骨骼肌、管壁收縮與呼吸壓差能推進淋巴嗎？→ 左心室是否直接把血液泵入淋巴管？'],
    ['左下肢、引流區域', '胸管收集兩側下肢嗎？→ 左下肢屬右上方小區域還是胸管的大區域？'],
    ['右淋巴管、右上方區域', '右淋巴管引流整個右半身嗎？→ 右上肢與右下肢，哪個才屬它的範圍？'],
    ['輸入、淋巴結、輸出', '哪種管把淋巴帶入淋巴結？→ 過濾後由哪種管帶離？'],
    ['肌肉擠壓、瓣膜防倒流', '肌肉收縮提供推力嗎？→ 瓣膜負責製造淋巴還是減少倒流？'],
    ['人體右手、右靜脈角', '右手屬哪條淋巴管的引流區？→ 那條管最後匯入左還是右靜脈角？'],
    ['右腳、兩側下肢', '右腳是否位在右上方引流區？→ 兩側下肢的淋巴主要經哪條管、哪個靜脈角？'],
    ['吸氣、胸腔壓降低', '胸腔壓降低會產生朝胸腔的壓差嗎？→ 配合瓣膜，這個壓差如何幫助回流？'],
    ['T 淋巴球、成熟而非活化', '題目問細胞成熟還是免疫活化？→ T 細胞與 B 細胞的成熟場所是否相同？'],
  ],
  'hemodynamics': [
    ['固定壓差、阻力加倍', 'Q = ΔP／R 中哪個量固定？→ 分母加倍、分子不變，流量變為多少？'],
    ['半徑加倍、四次方反比', '2 的四次方是多少？→ 阻力與半徑四次方成反比，阻力應乘以還是除以 16？'],
    ['血比容、體積比例', '分子是紅血球體積還是所有血球數？→ 分母是血漿還是全血體積？'],
    ['總流量相同、總截面積', '平均流速 v = Q／A 嗎？→ 很多微血管的面積加總後變大，速度如何變？'],
    ['理想層流、管中央', '緊貼管壁的流層受阻較大嗎？→ 管中央與管壁哪裡較快？'],
    ['120／80、脈壓、MAP', '120 − 80 等於多少？→ 舒張壓加三分之一脈壓為多少？→ 是否等於兩個壓力的簡單平均？'],
    ['血比容升高、黏度、阻力', '紅血球體積比例升高，黏度通常如何變？→ 阻力增加、壓差固定時流量如何變？'],
    ['半徑減半、阻力反比四次方', '半徑變為一半，四次方變為多少？→ 取倒數後阻力變為幾倍？'],
    ['分支總截面積加倍、Q 固定', '用的是單根面積還是分支總面積？→ v = Q／A 的分母加倍時，平均速度如何變？'],
    ['突然變徑、高速、流線', '理想層流的流線平順嗎？→ 高速與幾何變化會使擾流更容易還是更不容易出現？'],
    ['TPR 固定、CO 減少', 'MAP ≈ CO × TPR 中哪個因子固定？→ 另一個因子減少，乘積如何變？'],
  ],
};

const rows=[], expected=[], sources=[];
let globalIndex=0;
for (const slug of physiologySlugs) {
  const {content:c}=readBuiltMaterial(root,slug);
  assert.deepEqual(c, JSON.parse(await fs.readFile(`${root}/materials-src/${slug}/content.json`, 'utf8')));
  const questions=[...c.foundation,...c.cases];
  assert.equal(questions.length,11);
  assert.equal(guides[slug].length,11);
  const url=`https://albertchang1008-alt.github.io/115-1-AP2/materials/${slug}-v1/index.html`;
  sources.push([c.title,`11 題｜public/materials/${slug}-v1/index.html（已登錄、待部署）；6 先備＋5 情境；單元＝次單元＝${c.title}`]);
  questions.forEach((q,i)=>{
    assert(!usedIds.has(q.id),`Duplicate ID: ${q.id}`); usedIds.add(q.id);
    assert.equal(q.options.length,4); assert.equal(new Set(q.options).size,4);
    // Deterministic shuffle of distractors, with balanced correct positions; rerunnable audits.
    const correct=q.options[q.answer], position=[2,0,3,1][globalIndex++%4];
    const wrong=q.options.filter((_,j)=>j!==q.answer);
    let seed=[...q.id].reduce((v,x)=>(v*31+x.charCodeAt(0))>>>0,17);
    for(let j=wrong.length-1;j>0;j--) { seed=(Math.imul(seed,1664525)+1013904223)>>>0; const k=seed%(j+1); [wrong[j],wrong[k]]=[wrong[k],wrong[j]]; }
    const options=[...wrong]; options.splice(position,0,correct);
    if (options.every((v,j)=>v===q.options[j])) { const indexes=[0,1,2,3].filter(j=>j!==position); [options[indexes[0]],options[indexes[1]]]=[options[indexes[1]],options[indexes[0]]]; }
    const [keyword,chain,legacyExplanation]=guides[slug][i], explain=q.explain||legacyExplanation;
    assert(explain && keyword && chain);
    const code='ABCD'[position];
    rows.push([null,q.id,c.title,c.title,i+1,'TRUE','單選',q.stem,...options,code,position+1,explain,`「${keyword}」：${q.hint}`,chain,`選擇「${correct}」。${explain}`,explain,null,null,c.title,url,null]);
    expected.push({slug,title:c.title,id:q.id,sequence:i+1,stem:q.stem,options:q.options,correct,code,zuvio:position+1,url});
  });
}
assert.equal(rows.length,55);
for(let i=0;i<55;i++) sheet.getRange(`A${108+i}:X${108+i}`).copyFrom(sheet.getRange('A2:X2'),'all');
sheet.getRange('A108:X162').values=rows;
sheet.getRange('C108:D162').format.wrapText=true;
sheet.getRange('P108:S162').format.wrapText=true;
sheet.getRange('V108:W162').format.wrapText=true;
sheet.getRange('A108:X162').format.autofitRows();
// Keep the existing total in place and append sources strictly after the current table.
notes.getRange('B23').values=[['161 題']];
for(let i=0;i<5;i++) notes.getRange(`A${24+i}:B${24+i}`).copyFrom(notes.getRange('A22:B22'),'all');
notes.getRange('A24:B28').values=sources;
notes.getRange('A24:B28').format.autofitRows();
wb.recalculate();
assert.deepEqual(sheet.getRange('A2:X107').values,oldRows);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:10},maxChars:1000})).ndjson);
await fs.writeFile(`${temp}/expected.json`,JSON.stringify(expected,null,2));
await (await SpreadsheetFile.exportXlsx(wb)).save(`${temp}/authored.xlsx`);

// Artifact Tool authors the appended rows. A narrow OOXML splice preserves every old
// row's exact XML and all other ZIP parts; re-exporting the old rows is not permitted.
const dest=path.join(root,'html/資訊圖表題庫_上傳用.xlsx');
const preservation=spawnSync(python,[`${root}/scripts/materials-question-bank-preserve.py`,baseline,`${temp}/authored.xlsx`,dest,`${temp}/expected.json`,`${root}/docs/MATERIALS_REGISTRATION_VERIFY.json`],{encoding:'utf8'});
if(preservation.status!==0) throw Error(preservation.stdout+preservation.stderr);
console.log(preservation.stdout);
const final=await SpreadsheetFile.importXlsx(await FileBlob.load(dest));
assert.deepEqual(final.worksheets.getItem('題庫').getRange('A2:X107').values,oldRows);
assert.deepEqual(final.worksheets.getItem('題庫').getRange('A108:X162').values,rows);
for (const [sheetName,range,name] of [['題庫','H108:N109','new-questions'],['題庫','O157:S157','map-guides'],['題庫','O162:S162','last-guides'],['說明','A23:B28','new-sources']]) {
 const image=await final.render({sheetName,range,scale:1,format:'png'});
 await fs.writeFile(`${temp}/${name}.png`,new Uint8Array(await image.arrayBuffer()));
}
console.log('55 appended; 106 original rows preserved; 161 total.');
