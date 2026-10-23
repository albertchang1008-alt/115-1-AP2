# 給 Claude 的摘要

- #6b 兩阻擋已修，基底 `1b9c0937`，接續分支 `release/urinary-2026-10-22`；僅本機 commit [Codex]，未 push／按同步／部署。
- Excel 與真實 Sheet 依題目ID定位，各只改44個次單元格；全頁回讀21,184格、Excel 9,996個現有格，其他內容不變。
- 真實 Sheet 全矩陣 parseBankSheet PASS：655個啟用題目，泌尿／體液10單元各11題；不是合成代碼測試。
- 酸鹼送出的確認題ID與診斷分母改為連字號，仍 acid-base-homeostasis-v1，questionTotal=15；note同步。
- 正式 SDK 全流程攔截10教材×手機／桌面，共686事件，逐筆 validEvent PASS，20次通關均能 reduceLearning；含點負例確實拒絕。
- npm run check PASS：前端206、Functions 61測試，build PASS；十份 SCRIPT_DIFF 缺0、多0，layout全過。
- 檔案：student.js、urinary-release-build.mjs、shared/materials.ts、酸鹼HTML／README、銀行匯出與名稱對照、兩份測試及型別、Excel、證據目錄 blockers/。
- 偏離：為避免重新匯出復發，補了四個識別碼對照並更新 manifest 的44格；顯示標題不動。兩次check曾因新增測試型別宣告與酸鹼helper回傳格式失敗，均已修正後重跑全套。
- Claude抽查（5項）：44格清單、真實Sheet解析、酸鹼5個新ID、含點負例、10份SDK事件／completed紀錄。

## 1. 工作範圍與備份

工作樹：`/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/urinary-release-2026-10-22`，分支 `release/urinary-2026-10-22`；根目錄其他分支／未提交工作保留。Excel修改的是本發布工作樹 `html/資訊圖表題庫_上傳用.xlsx`。未混入#28誘答改寫，未修改題幹、選項、正解或教師reviewed，沒有讀寫真實學生紀錄。

操作前備份全部存於 git 忽略的 `docs/sheet-backups/`，**未加入 commit**：

- `2026-10-22-blockers-excel-before.xlsx`：原Excel完整檔案，SHA256 `237dc14792f9ea8abaa0dc39c1c7fec040a101b01c41970a5fef804a1efe7b10`。
- `2026-10-22-blockers-sheet-before.json`：整頁662×32個 userEnteredValue（包含空白）、44格ID對照、目標欄格式／驗證等metadata。
- Google原生整頁備份：[備份連結](https://docs.google.com/spreadsheets/d/1HKjfahRnFwqslV7NwJescdfatgR-dgnL5SFg9atN3WQ/edit)，只複製115-1-AP2分頁，不含名冊分頁；備份結果另存 `2026-10-22-blockers-native-backup.json`。
- `2026-10-22-blockers-sheet-after.json`：實際回讀的整頁矩陣，供解析重跑。沒有用人工合法化副本取代正式資料。

## 2. 次單元44格修改與逐格比對

目標：[正式題庫](https://docs.google.com/spreadsheets/d/1JU-XoFaDHYGcBqmlmcflUsHswUmMJXk39yETk9o3QPk/edit#gid=1633868463)，分頁115-1-AP2（sheetId 1633868463）。Sheet定位題目ID在C欄、次單元在F欄；Excel定位題目ID在B欄、次單元在D欄。所有列先驗證ID與原值，再執行一次44個 updateCells，field mask 僅 userEnteredValue。

| 舊次單元 | 新次單元ID | Excel格 | Sheet格 | 題數 |
|---|---|---|---|---|
| 腎臟位置、構造與功能 | 腎臟位置構造與功能 | D306:D316 | F553:F563 | 11 |
| 腎元、腎血流與近腎絲球器 | 腎元腎血流與近腎絲球器 | D317:D327 | F564:F574 | 11 |
| 腎小管再吸收、分泌與排泄 | 腎小管再吸收分泌與排泄 | D339:D349 | F586:F596 | 11 |
| 電解質、滲透與離子平衡 | 電解質滲透與離子平衡 | D394:D404 | F641:F651 | 11 |

整頁Sheet比較21,184格，差異恰44、非預期差異0；F553:F662的110格格式、驗證、note、chip metadata也回讀一致。沒有改表頭、列序、啟用、篩選、其他分頁或名冊。Excel用artifact-tool產生修改值，再只將44格值嵌回原壓縮檔，以保留全部原格式；回讀9,996個現有格，差異恰44，其他ZIP成員逐bytes一致。

最新匯出稿與實際Sheet的110題、2,310個對應欄位也逐格一致（缺課程代碼／題型／圖片網址三欄為既有Sheet格式，未補欄）；見 [sheet-bank-consistency.json](blockers/sheet-bank-consistency.json)。

證據：[sheet-verification.json](blockers/sheet-verification.json)、[excel-verification.json](blockers/excel-verification.json)、[excel-changes.json](blockers/excel-changes.json)。Excel最終SHA256 `a563ef4c4f820d4ba13ec5ccd39dc3181a9fa4474fd8024d8d4eca8b18b4643d`。

四組原生Sheet畫面與Excel呈現均已檢查，無改欄寬／列高／換行／樣式：[Sheet腎臟](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/sheet-after.png)、[腎元](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/sheet-nephron-after.png)、[腎小管](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/sheet-tubular-after.png)、[電解質](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/sheet-electrolyte-after.png)，Excel對應 `blockers/excel-*-after.png`。

### 真實Sheet解析輸出

`parse-real-sheet.ts` 直接載入實際Sheet回讀的整頁矩陣，呼叫現行 `parseBankSheet(matrix,'115-1-AP2','115-1-AP2')`，未替換其他值。661個資料列中655個啟用題目；既有6列停用狀態不動。完整輸出：[actual-sheet-parse.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/actual-sheet-parse.txt)。

```json
{
  "pass": true,
  "source": "Actual Google Sheet readback; no synthetic unit IDs",
  "rows": 662,
  "columns": 32,
  "courseId": "115-1-AP2",
  "parsedQuestions": 655,
  "urinaryUnits": [
    {
      "id": "腎臟位置構造與功能",
      "chapter": "泌尿系統",
      "questions": 11
    },
    {
      "id": "腎元腎血流與近腎絲球器",
      "chapter": "泌尿系統",
      "questions": 11
    },
    {
      "id": "腎絲球過濾與清除率",
      "chapter": "泌尿系統",
      "questions": 11
    },
    {
      "id": "腎小管再吸收分泌與排泄",
      "chapter": "泌尿系統",
      "questions": 11
    },
    {
      "id": "逆流機制與尿液濃縮",
      "chapter": "泌尿系統",
      "questions": 11
    },
    {
      "id": "尿液通路與排尿控制",
      "chapter": "泌尿系統",
      "questions": 11
    },
    {
      "id": "體液分布與細胞內外液",
      "chapter": "體液電解質與酸鹼平衡",
      "questions": 11
    },
    {
      "id": "水分收支與鈉水調節",
      "chapter": "體液電解質與酸鹼平衡",
      "questions": 11
    },
    {
      "id": "電解質滲透與離子平衡",
      "chapter": "體液電解質與酸鹼平衡",
      "questions": 11
    },
    {
      "id": "酸鹼緩衝與肺腎調節",
      "chapter": "體液電解質與酸鹼平衡",
      "questions": 11
    }
  ]
}
```

上述10個ID是教師同步後建活動時要對應的次單元識別；Chapter仍為「泌尿系統」或「體液電解質與酸鹼平衡」，不是把教材顯示標題直接當ID。這次沒有按平台同步，也沒有建立活動／勾班／發布課程。

### 其他名稱出現位置與匯出防復發

完整路徑、行號及命中名稱見 [name-usage.json](blockers/name-usage.json)（73個既有版控檔案）。

| 類別 | 位置／處理 |
|---|---|
| 題庫識別碼 | scripts/urinary-release-bank.mjs 現使用 scripts/lib/urinary-unit-ids.mjs 的四個明確對照；只處理指定名稱，沒有全域放寬safeCode或任意刪標點。manifest恰44個row[3]更新，其他資料一樣。 |
| 登錄顯示 | shared/materials.ts:90、91、93、98 的label保留原標點；note原本沒有四個次單元名稱。public/materials/README.md對應標題保留。 |
| 教材標題與單元文字 | materials-src/四slug的apply.json與content.json、public/materials/四slug-v1/index.html 保留原標點，不改顯示文字。四slug為kidney-anatomy、nephron-circulation、tubular-handling、electrolyte-balance。 |
| 講義標題／舊報告與測試證據 | Excel講義標題／Sheet講義標題維持原文；舊bank與stage2、apply9、release-today等報告記錄原名仍正確反映歷史，不批量覆蓋。新報告與最新manifest清楚區分顯示文字與同步ID。 |

## 3. 酸鹼事件ID修正與診斷分母

`materials-src/apply-kit/student.js` 的送出ID由 n序號.micro 改為 n序號-micro；`scripts/urinary-release-build.mjs` 的 assessmentIds 同步。學生腳本內部單位ID如 n1.micro.stem 是文案索引，不是送往後端的questionId，保持不動。

正式 `acid-base-homeostasis-v1/index.html` 已由生成器重建，沒有手改HTML；尚未上線所以不升版。五個確認題為 `n1-micro`、`n2-micro`、`n3-micro`、`n4-micro`、`n6-micro`。另10題P/R/K/N/S配對池仍原ID，questionTotal仍15，登錄note與README同步說明。其他九份HTML不變。`shared/learning.ts` 與 Functions 契約都未修改。

## 4. 十份正式HTML的全流程事件測試

新增 `tests/material-urinary-events.test.ts`，使用既有手機390×844與桌面1280×800完整作答流程，實際操作答錯、整步重來、確認題錯整關重來、結尾錯從第一格重來、兩階段考核／酸鹼配對考核，直到通關。

`release-tracking-proof.mjs` 現從本機正式 course-learning.js 讀取SDK，僅在pending.push的位置旁記錄同一事件物件；沒有另造簡化SDK。每筆含真實UUID與SDK正規化後的type／questionId等欄位，逐筆送入現行validEvent，再按30筆一批送入同一reduceLearning，確認completed可到達。題目事件還要出現在正式HTML的分母metadata。測試沒有向Google、Firestore或正式學生API寫學習紀錄；這不是線上後端試送或教師上線後驗收。

含點負例 `questionId:'n1.micro'` 必須 validEvent=false，reduceLearning及攔截檢查器都拋錯；改成n1-micro即通過格式。新增單元ID匯出回歸測試，確認10單元合法、只有指定44格去頓號。

| 教材 | 手機事件數 | 桌面事件數 | 不合法事件 | completed | SCRIPT_DIFF | 畫面檢查PASS |
|---|---|---|---|---|---|---|
| acid-base-homeostasis | 62 | 62 | 0 | 1＋1 | 缺0／多0 PASS | 162 |
| electrolyte-balance | 30 | 29 | 0 | 1＋1 | 缺0／多0 PASS | 169 |
| filtration-clearance | 33 | 29 | 0 | 1＋1 | 缺0／多0 PASS | 160 |
| fluid-compartments | 29 | 27 | 0 | 1＋1 | 缺0／多0 PASS | 156 |
| kidney-anatomy | 33 | 29 | 0 | 1＋1 | 缺0／多0 PASS | 166 |
| nephron-circulation | 30 | 27 | 0 | 1＋1 | 缺0／多0 PASS | 171 |
| tubular-handling | 35 | 31 | 0 | 1＋1 | 缺0／多0 PASS | 164 |
| urinary-route-micturition | 36 | 31 | 0 | 1＋1 | 缺0／多0 PASS | 179 |
| urine-concentration | 39 | 33 | 0 | 1＋1 | 缺0／多0 PASS | 168 |
| water-sodium-regulation | 32 | 29 | 0 | 1＋1 | 缺0／多0 PASS | 167 |

每份完整匿名事件見 `blockers/verify/<slug>/tracking-390x844.json` 與 `tracking-1280x800.json`；SCRIPT_DIFF原始JSON／文字同目錄。事件數含SDK依停留時間發出的time，所以每次重跑可能不同。畫面與事件匯總見 [summary.json](blockers/summary.json)。未將巨大臨時HTML副本或整頁備份加入commit。

## 5. 指令、實際輸出與邊界

```bash
# release工作樹，Node22.23.2
node --experimental-strip-types --input-type=module -e "import {buildApprovedUrinary} from './scripts/urinary-release-build.mjs'; await buildApprovedUrinary('acid-base-homeostasis');"
node scripts/urinary-release-bank.mjs
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/blockers/parse-real-sheet.ts
npm run check
node --experimental-strip-types docs/urinary-release/blockers/verify-ten.mjs
```

- [npm-check.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/npm-check.txt)：完整最終輸出（包含十份verify及新測試，未略過）。
- [npm-check-first-type-errors.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/npm-check-first-type-errors.txt)：首次十份全流程通過後，build發現新JS測試helper缺宣告的實際失敗；已補d.mts型別宣告並重跑完整check，不使用ts-ignore或放寬strict。
- [npm-check-second-helper-shape.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/npm-check-second-helper-shape.txt)：第二次全流程完成，但測試收尾把酸鹼回傳summary誤當成wrapper；已按實際API修正宣告與分支，最終全套重跑通過。
- [typecheck.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/typecheck.txt)：補宣告後tsc -b成功（空stdout）。
- [unit-id-regression.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/unit-id-regression.txt)：單元ID／十份正式檔回歸2/2通過。
- [verify-ten.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/verify-ten.txt)：確認剛完成流程的HTML副本與正式檔完全相同，重驗十份登錄、SCRIPT_DIFF、layout及原始事件，無重用其他版本的證據。
- [build-acidbase.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/build-acidbase.txt)、[bank-export.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/bank-export.txt)、[excel-readback.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/blockers/output/excel-readback.txt) 為實際建置／回讀輸出。

最終npm摘要（完整輸出可核對兩組tests/pass/fail）：

```text
前端 tests 206 / pass 206 / fail 0
build: version 1.9.1 一致，tsc -b 與 Vite 成功
Functions tests 61 / pass 61 / fail 0
十份正式HTML × 2尺寸：validEvent invalid=0，completed=20

```

備份不commit；後端契約未動；不push、不部署、不按平台同步。#28維持既有教師停點，不混入本次修改。根目錄#6b停-等Claude，週誌與handoff檢查另附收工輸出。

## 收工紀錄

根目錄唯一佇列僅更新#6b為停-等Claude；#28未動。週誌透過devlog.py寫入docs/devlog/2026-W43.md。

```text
PASS devlog: /Users/HHC/Documents/ChatGPT/課程平台1.0/docs/devlog/2026-W43.md
PASS handoff: 1698/4000字；queue: 22/25件；週誌與索引合規
```
