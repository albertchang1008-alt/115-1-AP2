# 泌尿六份與體液四份完整交付報告

已完成階段一至四：10份本機preview、60節點、110題＋10題預測、200張最終截圖。未build／登錄／Excel或Sheet／push／合併main／部署。卡片、進度檔及原圖未寫入。

- [十份並列HTML截圖集](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/screenshots.html)：可切1280／390、初始頁／三態／六節點，點圖放大並開啟完整互動preview。
- [最終180圖面案例與20初始頁驗證](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/final/verification.json)。
- [目前有效引線錨點與crop](ANCHOR_TABLE.md)；[全部資料層圖位](data/SLOT_MAP.md)。

## 階段一：出處、腎臟試作與尿路C

Commit：`16d41e7`。六份共同A小修；腎臟1份完成標籤試作，尿路1份補第六節與兩題。

| 教材 | A範圍 | B／C與本階段驗證 |
|---|---|---|
| kidney-anatomy | 中文reference／credits，sources保留 | B：18圖面案例、35crop與20標準shots通過 |
| nephron-circulation | 中文reference／credits，sources保留 | A-only全JSON比對通過 |
| filtration-clearance | 中文reference／credits，sources保留；指定clinical開頭 | A-only全JSON比對通過 |
| tubular-handling | 中文reference／credits，sources保留 | A-only全JSON比對通過 |
| urine-concentration | 中文reference／credits，sources保留 | A-only全JSON比對通過 |
| urinary-route-micturition | 中文reference／credits，sources保留 | C：reviewed來源、第六節與兩題、20標準shots通過 |

尿路新增題目ID依既有保護升為v2，保留舊v1。詳[階段一報告](STAGE1_COMPLETE_REPORT.md)；舊STAGE2_REPORT為前輪停點歷史，已由本次授權續作完成。

## 階段二：其餘五份泌尿標籤

Commit：`e312f82`。5份、28張標籤圖，76圖面案例、132crop與100標準shots通過。

| 教材 | 標籤圖面案例 | 標準shots | 內容／來源／正解 |
|---|---|---|---|
| nephron-circulation | 16／16 | 20／20 | 通過；未改既有題目與sources |
| filtration-clearance | 14／14 | 20／20 | 通過；未改既有題目與sources |
| tubular-handling | 12／12 | 20／20 | 通過；未改既有題目與sources |
| urine-concentration | 18／18 | 20／20 | 通過；未改既有題目與sources |
| urinary-route-micturition | 16／16 | 20／20 | 通過；未改既有題目與sources |

最終補足資料層後的整份驗證見下方總表。錨點、鉀／鈉方向與男女分格等審查備註詳[階段二報告](STAGE2_COMPLETE_REPORT.md)。

## 階段三：泌尿資料層

Commit：`aaabf65`。3份、6個獨立資料圖＋PCT原生比例條。

| 教材 | 資料圖位 | 資料圖面案例 | 標準shots |
|---|---|---|---|
| nephron-circulation | node-06 | 2／2 | 20／20 |
| filtration-clearance | node-04、05 | 4／4 | 20／20 |
| tubular-handling | node-02、03、04、06 | 8／8 | 20／20 |

採55＋0－15－30＝10 mmHg、Na⁺67%／水75%、Tmax375 mg/min；RPF660／GFR125、FF約0.19，腎血流不標數字。比例與曲線尺度經量測，保留1e-9比例門檻。詳[階段三報告](STAGE3_COMPLETE_REPORT.md)。

## 階段四：四份體液與完整畫面交件

Commit：本報告所在提交，訊息`完成階段四與十份教材畫面交付 [Codex]`（最終SHA由git log查閱）。4份、24節點、44題＋4預測、80最終截圖。

| 教材 | 節點／先備／情境／狀態 | 最終圖面案例 | 標準shots | 預測位置 |
|---|---|---|---|---|
| fluid-compartments | 6／6／5／3 | 18／18 | 20／20 | 2 |
| water-sodium-regulation | 6／6／5／3 | 18／18 | 20／20 | 3 |
| electrolyte-balance | 6／6／5／3 | 18／18 | 20／20 | 0 |
| acid-base-homeostasis | 6／6／5／3 | 18／18 | 20／20 | 1 |

詳[階段四報告](STAGE4_COMPLETE_REPORT.md)。14張體液原圖已核對pass及SHA；精確粒子模型、尿腔符號為審查指定原生疊層。體液四個slug僅新增210藍色配色鍵。

## 十份最終驗證

| 教材 | schema／NodeText | 圖面案例 | 初始頁 | 標準shots | pageerror／越界／重疊／水平捲動 |
|---|---|---|---|---|---|
| kidney-anatomy | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| nephron-circulation | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| filtration-clearance | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| tubular-handling | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| urine-concentration | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| urinary-route-micturition | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| fluid-compartments | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| water-sodium-regulation | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| electrolyte-balance | 通過 | 18／18 | 2／2 | 20／20 | 0 |
| acid-base-homeostasis | 通過 | 18／18 | 2／2 | 20／20 | 0 |

最小實際圖內字級：1280桌機 18.94px（門檻13）、390手機 13.67px（門檻12）；尿路node-06無圖中文字，依交辦保留佔位與「本節圖待製作」。文字與題目已完成。

- 最終圖面以final/verification.json及其SVG SHA為準；過程報告保留先前失敗與修正，不冒充最終結果。
- 本機runtime只有Node，執行 `node --experimental-strip-types scripts/material-node-audit.mjs`（即npm run materials:validate-nodes同一入口）及 `node node_modules/tsx/dist/cli.mjs --test tests/material*.test.ts`，未觸發pretest或build。
- 全庫節點稽核通過：21個已登錄學生版本、實際34個content.json。既有工具成功訊息把來源數固定寫15，未修改工具；實際迴圈讀取全部來源。見final/node-audit.log及final/scope-and-source-audit.json。
- 共用教材測試20通過、0失敗、0 skipped：final/shared-tests.log。
- 十份33張來源卡及唯一進度列皆reviewed；卡片SHA與早期來源證據一致。內容及用詞：content-audit.json；完整繁體掃描：traditional-chinese-audit.json。
- 其中electrolyte-osmolarity與calcium-phosphate-balance的needs_review仍為true；本交辦明確核可附條件使用，已排除mEq換算公式與降鈣素分泌細胞身分，不改卡片或進度旗標。見final/conditional-source-flags.json。
- 既有泌尿選項未重排；新增體液48筆輪替的正解文字前後一致，見fluid/answer-text-comparison.json。
- 截圖集40組切換、400次圖片載入、十份preview連結、放大／關閉與加寬操作通過：final/gallery-verification.json。
- 精確粒子數及編號不遮擋的四個實際畫面檢查：final/particle-visibility.json。
- 160保護檔案、原圖與副本、共用程式及四鍵新增的比對：final/scope-and-source-audit.json。

## 跳過的疑義與邊界

- mEq原書換算公式有單位疑點：只教電荷當量、價數與粒子數概念，不出數值換算題。
- 降鈣素分泌細胞不標；疾病、藥物、處置與診斷延伸不納入。
- 腎血流兩來源數值不同：不標數字；PCT採本文67%／75%，不混表格另一值。
- 尿pH採約6.0、表列4.6–8.0，不將另註最低4.5併成一個範圍。
- 不使用50 kg女性自編計算例；體液比例依課本與spec核定示例。
- 電解質01原右側燒杯數量不準，依既有審查用clip隱去，由原生模型呈現6→6／12／18，不改PNG或另畫解剖。
- 無需使用未reviewed卡，也沒有待補來源才可呈現的題目；尿路06圖依交辦保留佔位。

## 箭頭與符號顏色

| 用途 | 色碼 | 畫法 |
|---|---|---|
| 水／濾液；CO₂依通用文法亦用藍 | #0072B2 | 實心粗箭頭 |
| 離子移動 | #CC79A7 | 實心粗箭頭 |
| 尿液 | #E69F00 | 實心粗箭頭 |
| 血流 | #D55E00 | 實心粗箭頭 |
| 神經／激素訊號 | #444444 | 細虛線箭頭 |
| 引線／圓點 | #333333／#222222 | 無箭頭引線＋端點 |
| 重點 | #b4233a | 紅色粗體 |
| 精確粒子模型：葡萄糖／Na／Cl／Mg | #555555／#0072B2／#009E73／#E69F00 | 一份分子以細框分組；避免紅綠配對 |

RAAS訊號箭頭以①–⑤標示步驟，手機結構標籤A–G與步驟分開。沒有新增需要抑制T端或三種程度粗細的情境；不為湊文法編入未核定的調節機轉或程度數值。

## 自寫腳本修正與交接

- 腎臟驗證器累計2/2：前輪SVG元素回呼、這輪fullPage crop座標；完整18案例與全部幾何門檻保留。
- 錨點擷取overview欄位1次；報告stdin編碼1次；資料圖產生器選擇器與整數尺度1次；最終擷取DOM容器1次。各自修正後成功，沒有超過兩次仍失敗的工具。
- 收工額外旗標檢查誤把reviewed視為needs_review必為false；修正欄位語意，僅接受交辦明列兩張附條件卡，並檢查疑義公式與細胞身分未使用（1次修正後成功）。必需reviewed與共用檢查保留，未修改審核狀態。
- Swift快取目錄改到/tmp屬執行環境修正，原繁體檢查未改。
- 所有教材不合格項均修圖層後重驗；未放寬共用或自寫檢查。舊證據保留在stage2/history*與labels/history/。
- 到此停止，交Claude總驗收。正式登錄、Excel／Sheet、push、合併與部署仍待後續明確交辦。


## 圖面修訂（36fcbec＋本輪）

2026-10-17 收尾：A、B完成，十份圖面修訂完成、驗證通過、待教師看畫面。基底為 Antigravity `36fcbec`；本輪提交訊息「泌尿體液圖面收尾、驗證與交件文件 [Codex]」，SHA以本報告所在提交為準。

- Antigravity完成U-1～U-4／F-1～F-9圖層修訂；本輪補腎元腎素6號實際錨點、CO₂靜脈側入肺箭頭及體液短說明。桌機用中文引線、手機6號引線均接[520,680]顆粒。
- A-3字串實際在總覽與node-01，兩處均改為「體重 100%」與「全長＝體重；藍色段＝總水量 60%」；node-02原無該字串，核對兩色比例圖且未改動。兩尺寸均正常。
- [16項修正前後對照](FIX_BEFORE_AFTER_2026-10-17.md)：U-1～U-4、F-1～F-9、A-1～A-3各一列；40張歷史截圖從649b98b原樣取出並記SHA。F-7另用git show取出的歷史preview擷取完整state-3頁（非build），兩尺寸確認課本p.29由有變無。
- [截圖集](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/screenshots.html)重新索引本輪200張final截圖；完整初始頁＋三態＋六節點、1280／390。原worktree已有的截圖／crop及稽核dirty保留，列為前輪繼承成果；本輪final證據獨立重拍。

| 驗證 | 本輪結果 | 證據 |
|---|---|---|
| 10份preview與標準shots | 各20張，200／200，0錯誤 | final/preview-*-2026-10-17.log、shots-*-2026-10-17.json／log |
| final verification | ok=true，180案例＋20初始頁，0 errors／pageerror | [verification.json](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/final/verification.json)、[log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/final/capture-2026-10-17.log) |
| 圖中文字、引線與頁面 | 無重疊／交叉／越界／水平捲動；字級達1280≥13px、390≥12px；底圖無拉伸 | 同上，各case實測 |
| 全庫節點稽核 | 21已登錄教材＋目前全部34份content.json通過 | [node log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/final/node-audit-2026-10-17.log)；工具成功訊息固定寫15，未改工具 |
| 共用教材測試 | 20 passed、0 failed、0 skipped | [tests log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/final/shared-tests-2026-10-17.log) |
| 截圖集操作 | 40組切換、400次圖片載入、10份preview連結及放大／Escape／加寬正常 | [gallery JSON](final/gallery-verification.json)、[log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/final/gallery-2026-10-17.log) |
| F-7完整頁補證 | 4張，舊版有課本p.29、本輪無；0 pageerror | [補證](final/F7-full-page-2026-10-17.json) |
| 保護範圍 | 176檔與36fcbec逐byte相同；所有content.json相同 | [scope](final/scope-2026-10-17.json) |

箭頭色表沿用本報告原規範，本輪只更動CO₂箭頭座標，顏色不變：

| 用途 | 色碼 | 畫法 |
|---|---|---|
| 水／濾液／CO₂ | #0072B2 | 粗實線箭頭 |
| 離子移動 | #CC79A7 | 粗實線箭頭 |
| 尿液 | #E69F00 | 粗實線箭頭 |
| 血流 | #D55E00 | 粗實線箭頭 |
| 神經／激素訊號 | #444444 | 細虛線箭頭 |
| 引線／端點；重點文字 | #333333／#222222；#b4233a | 無箭頭引線；紅色粗體 |

CO₂靜脈側至肺原圖座標[540,275]→[440,240]；經氣管呼出[470,250]→[555,170]→[560,20]保留。腎素新錨點與兩尺寸crop已同步[ANCHOR_TABLE.md](ANCHOR_TABLE.md)。目前有效解剖／流程錨點共261條（早期260為當時紀錄，其他歷史264描述不作本輪數量依據）。

本輪無腳本失敗或重跑修復，未修改共用驗證器、測試、kit核心或原底圖；未build、登錄、Excel／Sheet、push、merge或部署。C卡片小事屬另一專案，依序於本輪教材commit後執行，其結果另行回報。
