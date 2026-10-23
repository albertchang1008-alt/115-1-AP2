#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path
import json,hashlib,re,shutil
R=Path(__file__).resolve().parents[1];E=R/'docs/urinary-release';v=json.loads((E/'final/verification.json').read_text());assert v['ok'] and len(v['cases'])==180 and len(v['initialPages'])==20
for x in v['cases']:
 assert hashlib.sha256((R/'materials-src/figures'/x['figure']).read_bytes()).hexdigest()==x['sha256'],x['figure']
 assert (E/'final'/x['screenshot']).exists()
for f in ['gallery-verification.json','particle-visibility.json','scope-and-source-audit.json']:assert json.loads((E/'final'/f).read_text())['ok'],f
assert json.loads((E/'data/verification.json').read_text())['ok']
slugs=list(dict.fromkeys(x['slug']for x in v['initialPages']));contents={s:json.loads((R/f'materials-src/{s}/content.json').read_text())for s in slugs}
for s in slugs:
 q=json.loads((R/f'materials-src/{s}/shots/report.json').read_text());assert q['ok'] and len(q['shots'])==20,s
log=(E/'final/shared-tests.log').read_text();assert re.search(r'pass 20\b',log) and re.search(r'fail 0\b',log) and re.search(r'skipped 0\b',log)
hant=json.loads((E/'traditional-chinese-audit.json').read_text());assert not hant['differences']
# Definitive anchor table, including native symbols expressed in original-image coordinates.
rows=json.loads((E/'labels/anchors.json').read_text());kidney=json.loads((E/'stage2/anchors.json').read_text());table=['# 最終引線錨點對照','','座標使用原圖像素座標系。功能說明沒有解剖錨點；原生粒子／尿腔符號另註。crop為實際渲染的端點畫面，未改PNG。','','| 教材 | 圖位 | 標籤 | 座標 | 類型 | crop |','|---|---|---|---|---|---|'];count=0
for slug,slot,source,labels in [('kidney-anatomy',slot,x['source'],x['labels'])for slot,x in kidney['figures'].items()]+[(x['slug'],x['slot'],x['source'],x['labels'])for x in rows]:
 for l in labels:
  a=l['sourceAnchor'];native=(slug=='electrolyte-balance'and l['label']in ['1粒子','2粒子','3粒子','解離粒子'])or(slug=='acid-base-homeostasis'and slot=='node-06'and l['label']in ['NH₃','NH₄⁺','磷酸鹽']);kind='功能說明'if a is None else'原生疊層符號'if native else'底圖／流程位置';crop=('stage2/crops/'+slot+'-anchor-'+str(l['index'])+'.png')if slug=='kidney-anatomy'else('labels/crops/'+slug+'-'+slot+'-'+str(l['index'])+'.png')
  if a is not None:assert (E/crop).exists();count+=1
  table.append('| '+slug+' | '+slot+' | '+l['label']+' | '+str(a or '—')+' | '+kind+' | '+('[crop]('+crop+')'if a is not None else'—')+' |')
(E/'ANCHOR_TABLE.md').write_text('\n'.join(table)+'\n');assert count==260,count
# All 16 originally separated data prompts (3 overview states share one SVG), plus PCT.
data=json.loads((E/'data/slots.json').read_text());table=['# 最終資料層對照','','14個獨立SVG圖檔涵蓋原規格16個資料層製圖段落（體液總覽三態共用1圖）；另有近曲小管底圖上的原生比例條。共15筆圖層／17個狀態圖位。','','| 圖位 | 來源卡與頁碼 | 數值／標籤 | 1280 | 390 |','|---|---|---|---|---|'];datacount=0
for d in data:
 for state in ['state-1','state-2','state-3']if d['slot']=='overview'else[None]:
  suffix=d['slot']+('-'+state if state else'');datacount+=1;table.append('| '+d['slug']+'-'+suffix+' | '+'；'.join(d['sources'])+' | '+'、'.join(x if isinstance(x,str)else x['label']for x in d['labels'])+'；'+str(d['values'])+' | [圖](../final/screenshots/'+d['slug']+'-1280-'+suffix+'.png) | [圖](../final/screenshots/'+d['slug']+'-390-'+suffix+'.png) |')
assert len(data)==15 and datacount==17;(E/'data/SLOT_MAP.md').write_text('\n'.join(table)+'\n')
# Preserve superseded initial fluid failure evidence outside the active report paths.
old=E/'labels/verification-fluid-compartments_water-sodium-regulation_electrolyte-balance_acid-base-homeostasis.json'
if old.exists():
 dst=E/'labels/history/initial-fluid-label-audit.json';dst.parent.mkdir(exist_ok=True);shutil.move(old,dst)
for name in ['water-sodium-regulation-node-03-1.png','water-sodium-regulation-node-03-3.png']:
 p=E/'labels/crops'/name
 if p.exists():
  dst=E/'labels/history/crops-before-manual-refinement'/name;dst.parent.mkdir(exist_ok=True);shutil.move(p,dst)
# Success output in the legacy shared audit has a hard-coded '15'; retain the tool.
for name in ['STAGE1_COMPLETE_REPORT.md','STAGE3_COMPLETE_REPORT.md']:
 p=E/name;s=p.read_text().replace('15 kit sources','當時全部30份 kit sources（工具成功訊息固定寫15）').replace('21已登錄／15來源','21已登錄／當時全部30份來源（工具成功訊息固定寫15）');p.write_text(s)
minfont={w:min(x['minPx']for x in v['cases']if x['width']==w and x['texts'])for w in [1280,390]}
# Stage four report.
s=['# 完整製作：階段四報告','','四份體液教材完成：24節點、44題與4題預測；各6先備＋5情境、總覽3態。四份各有20張最終截圖，合計80張。','','| 教材 | schema／NodeText／reviewed來源 | 最終圖面案例 | 標準shots | 預測正解位置 |','|---|---|---|---|---|']
for slug in slugs[6:]:s.append('| '+slug+' | 通過 | 18／18 | 20／20 | '+str(contents[slug]['lab']['predict']['answer'])+' |')
s+=['','- 最終十份並列截圖集：[screenshots.html](screenshots.html)。寬度與畫面選單可讀全部200張圖；點圖放大，附十份完整preview連結。','- 14張體液原圖的審查快照及SHA：fluid/asset-review.json；主目錄原檔與worktree副本均未改。','- 錨點／crop：[ANCHOR_TABLE.md](ANCHOR_TABLE.md)；資料層：[data/SLOT_MAP.md](data/SLOT_MAP.md)。','- 電解質01照審查只顯示左欄原分子，原右側錯誤粒子數以SVG clip隱去；精確原生模型為同6份起始分子對應6、12、18粒子，每份以外框分組。手機編號避開所有分子與粒子；final/particle-visibility.json在兩尺寸、兩圖證明36粒子可見且0編號遮擋。原圖檔未裁改。','- 酸鹼06於管腔側原生疊加NH₃、NH₄⁺及磷酸鹽符號，H⁺承接和尿液排出方向分開。','- RAAS依①–⑤標明訊號順序，手機結構標籤改A–G避免混淆；兩尺寸18案例通過。','- 水與離子箭頭通過相應通道；ADH與口渴用功能說明，避免誤指水分子或腦幹。激素只教作用，不延伸腺體構造。','- 比例圖共同分母清楚；14獨立原生SVG＋PCT條涵蓋全部核定資料位。全系列箭頭色表見COMPLETE_REPORT。','- 選項輪替前後48筆正解文字逐題相同：fluid/answer-text-comparison.json；44題循環0→1→2→3，預測接續為2、3、0、1。','- 中文出處列用書名及合併頁碼；RAAS使用實際reviewed卡的第5章來源，不把舊spec的CH09頁碼冒充該卡frontmatter。','- 用詞掃描只有「鈉尿肽」子字串命中，完整詞為spec明定的「心房利鈉尿肽」，人工核對通過，掃描設定不修改；疾病、藥物、處置詞無命中。','- electrolyte-osmolarity與calcium-phosphate-balance雖reviewed仍保留needs_review=true；依交辦附條件使用，疑義公式與分泌細胞身分已排除，旗標不改。見final/conditional-source-flags.json。',
f'- Hans-Hant完整稽核：十份與70圖檔、{hant["strings"]}段文字，0差異。首次Swift快取無寫入權，將module cache指定/tmp後同一支腳本成功，未改檢查。','- 新最終擷取腳本初次DOM定位漏掉anatomy-main容器，修正定位後200張與180案例成功（1/2次）；沒有刪除檢查。','- 保護範圍：160既有檔案SHA比對；共用程式僅四個210藍色配色新增鍵，其餘共用核心／驗證器／測試、原圖及既有來源卡不變。','- 本階段commit為本報告所在提交，訊息「完成階段四與十份教材畫面交付 [Codex]」。停止交Claude總驗收。']
(E/'STAGE4_COMPLETE_REPORT.md').write_text('\n'.join(s)+'\n')
# Primary requested handoff report.
s=['# 泌尿六份與體液四份完整交付報告','','已完成階段一至四：10份本機preview、60節點、110題＋10題預測、200張最終截圖。未build／登錄／Excel或Sheet／push／合併main／部署。卡片、進度檔及原圖未寫入。','','- [十份並列HTML截圖集](screenshots.html)：可切1280／390、初始頁／三態／六節點，點圖放大並開啟完整互動preview。','- [最終180圖面案例與20初始頁驗證](final/verification.json)。','- [260條引線錨點與crop](ANCHOR_TABLE.md)；[全部資料層圖位](data/SLOT_MAP.md)。','','## 階段一：出處、腎臟試作與尿路C','','Commit：`16d41e7`。六份共同A小修；腎臟1份完成標籤試作，尿路1份補第六節與兩題。','','| 教材 | A範圍 | B／C與本階段驗證 |','|---|---|---|']
for slug in slugs[:6]:s.append('| '+slug+' | 中文reference／credits，sources保留'+('；指定clinical開頭'if slug=='filtration-clearance'else'')+' | '+('B：18圖面案例、35crop與20標準shots通過'if slug=='kidney-anatomy'else'C：reviewed來源、第六節與兩題、20標準shots通過'if slug=='urinary-route-micturition'else'A-only全JSON比對通過')+' |')
s+=['','尿路新增題目ID依既有保護升為v2，保留舊v1。詳[階段一報告](STAGE1_COMPLETE_REPORT.md)；舊STAGE2_REPORT為前輪停點歷史，已由本次授權續作完成。','','## 階段二：其餘五份泌尿標籤','','Commit：`e312f82`。5份、28張標籤圖，76圖面案例、132crop與100標準shots通過。','','| 教材 | 標籤圖面案例 | 標準shots | 內容／來源／正解 |','|---|---|---|---|']
for slug,n in zip(slugs[1:6],[16,14,12,18,16]):s.append('| '+slug+' | '+str(n)+'／'+str(n)+' | 20／20 | 通過；未改既有題目與sources |')
s+=['','最終補足資料層後的整份驗證見下方總表。錨點、鉀／鈉方向與男女分格等審查備註詳[階段二報告](STAGE2_COMPLETE_REPORT.md)。','','## 階段三：泌尿資料層','','Commit：`aaabf65`。3份、6個獨立資料圖＋PCT原生比例條。','','| 教材 | 資料圖位 | 資料圖面案例 | 標準shots |','|---|---|---|---|']
for slug,slots,n in [('nephron-circulation','node-06',2),('filtration-clearance','node-04、05',4),('tubular-handling','node-02、03、04、06',8)]:s.append('| '+slug+' | '+slots+' | '+str(n)+'／'+str(n)+' | 20／20 |')
s+=['','採55＋0－15－30＝10 mmHg、Na⁺67%／水75%、Tmax375 mg/min；RPF660／GFR125、FF約0.19，腎血流不標數字。比例與曲線尺度經量測，保留1e-9比例門檻。詳[階段三報告](STAGE3_COMPLETE_REPORT.md)。','','## 階段四：四份體液與完整畫面交件','','Commit：本報告所在提交，訊息`完成階段四與十份教材畫面交付 [Codex]`（最終SHA由git log查閱）。4份、24節點、44題＋4預測、80最終截圖。','','| 教材 | 節點／先備／情境／狀態 | 最終圖面案例 | 標準shots | 預測位置 |','|---|---|---|---|---|']
for slug in slugs[6:]:s.append('| '+slug+' | 6／6／5／3 | 18／18 | 20／20 | '+str(contents[slug]['lab']['predict']['answer'])+' |')
s+=['','詳[階段四報告](STAGE4_COMPLETE_REPORT.md)。14張體液原圖已核對pass及SHA；精確粒子模型、尿腔符號為審查指定原生疊層。體液四個slug僅新增210藍色配色鍵。','','## 十份最終驗證','','| 教材 | schema／NodeText | 圖面案例 | 初始頁 | 標準shots | pageerror／越界／重疊／水平捲動 |','|---|---|---|---|---|---|']
for slug in slugs:s.append('| '+slug+' | 通過 | 18／18 | 2／2 | 20／20 | 0 |')
s+=['',f'最小實際圖內字級：1280桌機 {minfont[1280]:.2f}px（門檻13）、390手機 {minfont[390]:.2f}px（門檻12）；尿路node-06無圖中文字，依交辦保留佔位與「本節圖待製作」。文字與題目已完成。','', '- 最終圖面以final/verification.json及其SVG SHA為準；過程報告保留先前失敗與修正，不冒充最終結果。','- 本機runtime只有Node，執行 `node --experimental-strip-types scripts/material-node-audit.mjs`（即npm run materials:validate-nodes同一入口）及 `node node_modules/tsx/dist/cli.mjs --test tests/material*.test.ts`，未觸發pretest或build。',
'- 全庫節點稽核通過：21個已登錄學生版本、實際34個content.json。既有工具成功訊息把來源數固定寫15，未修改工具；實際迴圈讀取全部來源。見final/node-audit.log及final/scope-and-source-audit.json。','- 共用教材測試20通過、0失敗、0 skipped：final/shared-tests.log。','- 十份33張來源卡及唯一進度列皆reviewed；卡片SHA與早期來源證據一致。內容及用詞：content-audit.json；完整繁體掃描：traditional-chinese-audit.json。','- 其中electrolyte-osmolarity與calcium-phosphate-balance的needs_review仍為true；本交辦明確核可附條件使用，已排除mEq換算公式與降鈣素分泌細胞身分，不改卡片或進度旗標。見final/conditional-source-flags.json。',
'- 既有泌尿選項未重排；新增體液48筆輪替的正解文字前後一致，見fluid/answer-text-comparison.json。','- 截圖集40組切換、400次圖片載入、十份preview連結、放大／關閉與加寬操作通過：final/gallery-verification.json。','- 精確粒子數及編號不遮擋的四個實際畫面檢查：final/particle-visibility.json。','- 160保護檔案、原圖與副本、共用程式及四鍵新增的比對：final/scope-and-source-audit.json。','','## 跳過的疑義與邊界','','- mEq原書換算公式有單位疑點：只教電荷當量、價數與粒子數概念，不出數值換算題。','- 降鈣素分泌細胞不標；疾病、藥物、處置與診斷延伸不納入。','- 腎血流兩來源數值不同：不標數字；PCT採本文67%／75%，不混表格另一值。','- 尿pH採約6.0、表列4.6–8.0，不將另註最低4.5併成一個範圍。','- 不使用50 kg女性自編計算例；體液比例依課本與spec核定示例。','- 電解質01原右側燒杯數量不準，依既有審查用clip隱去，由原生模型呈現6→6／12／18，不改PNG或另畫解剖。','- 無需使用未reviewed卡，也沒有待補來源才可呈現的題目；尿路06圖依交辦保留佔位。','','## 箭頭與符號顏色','','| 用途 | 色碼 | 畫法 |','|---|---|---|','| 水／濾液；CO₂依通用文法亦用藍 | #0072B2 | 實心粗箭頭 |','| 離子移動 | #CC79A7 | 實心粗箭頭 |','| 尿液 | #E69F00 | 實心粗箭頭 |','| 血流 | #D55E00 | 實心粗箭頭 |','| 神經／激素訊號 | #444444 | 細虛線箭頭 |','| 引線／圓點 | #333333／#222222 | 無箭頭引線＋端點 |','| 重點 | #b4233a | 紅色粗體 |','| 精確粒子模型：葡萄糖／Na／Cl／Mg | #555555／#0072B2／#009E73／#E69F00 | 一份分子以細框分組；避免紅綠配對 |','','RAAS訊號箭頭以①–⑤標示步驟，手機結構標籤A–G與步驟分開。沒有新增需要抑制T端或三種程度粗細的情境；不為湊文法編入未核定的調節機轉或程度數值。','','## 自寫腳本修正與交接','','- 腎臟驗證器累計2/2：前輪SVG元素回呼、這輪fullPage crop座標；完整18案例與全部幾何門檻保留。','- 錨點擷取overview欄位1次；報告stdin編碼1次；資料圖產生器選擇器與整數尺度1次；最終擷取DOM容器1次。各自修正後成功，沒有超過兩次仍失敗的工具。','- 收工額外旗標檢查誤把reviewed視為needs_review必為false；修正欄位語意，僅接受交辦明列兩張附條件卡，並檢查疑義公式與細胞身分未使用（1次修正後成功）。必需reviewed與共用檢查保留，未修改審核狀態。',
'- Swift快取目錄改到/tmp屬執行環境修正，原繁體檢查未改。','- 所有教材不合格項均修圖層後重驗；未放寬共用或自寫檢查。舊證據保留在stage2/history*與labels/history/。','- 到此停止，交Claude總驗收。正式登錄、Excel／Sheet、push、合併與部署仍待後續明確交辦。']
(E/'COMPLETE_REPORT.md').write_text('\n'.join(s)+'\n')
print('Complete report written; 260 anchor crops, 17 data state slots, all source hashes match final captures.')
