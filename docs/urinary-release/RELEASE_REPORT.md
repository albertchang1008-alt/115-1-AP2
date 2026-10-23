# 給 Claude 的摘要
- A、B 已完成；發布分支 `release/urinary-2026-10-22`，根目錄維持原分支。
- A：八尺寸 6,552 案、作答前 1,048 案 PASS；十份 SCRIPT_DIFF 缺 0 多 0；故意洩漏順序的資料確實 FAIL。
- B：十份正式 build＋登錄 PASS；正式 HTML 全流程／SDK 呼叫 1,662 案 PASS，未送出真實學習紀錄。
- 最終 npm run check：前端 193/193、Functions 61/61、TypeScript／Vite PASS；material 21/21、教材回歸 75/75 PASS。
- Excel 附加110題：題庫305→415列（含表頭）、原346列（含說明）逐格不變；獨立題庫414題。
- Sheet附加110題：552→662列（含表頭）；排除0、跳過0；舊17,664格及新3,520格回讀全符，無重複ID。
- 合入：降費 ba41abbb（origin/main已含，合併顯示已是最新）；A修正52143988；合併commit527aa908。
- 檔案：apply-kit修正、scripts/urinary-release-*、materials-build.mjs／materials.mjs、shared/materials.ts、十份HTML、Excel、sheet-write-verification.json。
- 偏離／必要修補：正式build改接核可播放器；診斷分母含確認題；酸鹼保留核可10題配對池，獨立入庫仍取6＋5；②無核可提問鏈則留空。
- 未push、未部署、未按平台同步；整頁Sheet及Excel備份均不commit。#6b交Claude驗收。
- 抽查5項：filtration N2手機作答前／D定位、答對後樣式、fluid N1、fluid-case-q03改寫、Sheet553列起與Excel對照。

## 正式教材與版本
下表「入庫」只計兩階段題；「診斷」涵蓋實際 CourseLearning.answer 的全部相異ID，包含學習確認題。通關依核可腳本規則，不以診斷題目池大小取代。

|slug|正式路徑|入庫|診斷|正式檔驗證|
|---|---|---:|---:|---:|
|kidney-anatomy|`public/materials/kidney-anatomy-v1/index.html`|11|15|166/166 PASS|
|nephron-circulation|`public/materials/nephron-circulation-v1/index.html`|11|14|171/171 PASS|
|filtration-clearance|`public/materials/filtration-clearance-v1/index.html`|11|15|160/160 PASS|
|tubular-handling|`public/materials/tubular-handling-v1/index.html`|11|16|164/164 PASS|
|urine-concentration|`public/materials/urine-concentration-v1/index.html`|11|17|168/168 PASS|
|urinary-route-micturition|`public/materials/urinary-route-micturition-v2/index.html`|11|16|179/179 PASS|
|fluid-compartments|`public/materials/fluid-compartments-v1/index.html`|11|14|156/156 PASS|
|water-sodium-regulation|`public/materials/water-sodium-regulation-v1/index.html`|11|15|167/167 PASS|
|electrolyte-balance|`public/materials/electrolyte-balance-v1/index.html`|11|15|169/169 PASS|
|acid-base-homeostasis|`public/materials/acid-base-homeostasis-v1/index.html`|11|15|162/162 PASS|

## A 修正與證據
[A完整報告](release-today/A/REPORT.md)、[總表與來源SHA](release-today/A/summary.json)。
順序說明與教學配對延到答對／明確答錯後，進入確認題清除前一步回饋與配對標記；候選標籤與題幹保留。酸鹼N6第二步只保留前一步已學的反應式，不保留當步去向答案。
核可的答案清單改為正常樣式，不刪腳本文字。手機目標至少44×44px、中心距離至少48px，圖框內可雙向捲動，A–D查看按鈕逐一置中；自動檢查實際確認各目標完整可達。
修正前後390與1280截圖在 [before](release-today/A/before/) 與 [after](release-today/A/after/)。故意注入核可順序原句，content-check回傳exit 1，見 [負例實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/A/output/negative-content-check.txt)。

## B 建置與追蹤接線
原 materials:build 仍採舊kit模板，直接執行會蓋掉核可播放器。新增 urinary-release-build.mjs，十份只走 renderApply 的核可course模式，接既有 course-learning.js，再登錄。
目錄已改為ALL_MATERIAL_CATALOG；修正寫入工具的舊定位與TypeScript載入方式。新增型別宣告，最終TypeScript全過。未更動其他教材的HTML或登錄項目。
正式檔逐位元比對最新render＋SDK／metadata；每份390與1280跑錯誤、重來、正確作答與通關。SDK由測試攔截，確認6個節點explore、正確／錯誤answer、唯一complete，以及每一個answer ID都在診斷分母清單。
酸鹼full.json的核可播放器使用10題配對池（每輪5組）及5個確認題；Excel／Sheet來源依本次指定，採apply.json核可6＋5題。兩者分開列明，未擅自替換酸鹼樣張考核。
[最終十次build輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/build-diagnostic-final.txt)；[verify 0](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/verify-final-0.txt)、[verify 1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/verify-final-1.txt)、[verify 2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/verify-final-2.txt)。
各份SCRIPT_DIFF、layout-results、registration與實際追蹤事件保存在 release-today/B/verify/<slug>/；未納入重複的大型預覽HTML。

## 題庫、備份與回讀
[逐題獨立作答審查](release-today/B/STANDALONE_REVIEW.md)列110個ID與各題理由；[bank-manifest.json](release-today/B/bank-manifest.json)保留來源SHA、原題四選項、答案與欄位矩陣。
11份教師核可改寫（含fluid-case-q03 19:12版）均已採用；44題誘答照交辦保留。節點任務、確認題、心智圖及lab.predict不入庫，無看圖才能作答的題目需排除。
五段欄位只沿用核可hint／explain／sources：①hint；②來源沒有另一份核可提問鏈，留空；③核對原答案＋解析；④沿用解析；⑤原來源。未自行編寫新教學敘述。
Excel `html/資訊圖表題庫_上傳用.xlsx`：新增306–415列、說明42–51列；原有所有儲存格逐格不變，其他ZIP成員逐位元不變，僅工作表範圍與新增ID樣式隨附加擴充。
用artifact-tool讀入、附加、重算、匯出新列；為保留原檔，只把artifact寫出的新增列接回原XML。最終成品再由artifact-tool重讀110×24格與10列說明；空白null與空字串按空格比較。
[Excel回讀證據](release-today/B/excel/verification.json)、[原工具輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/excel-artifact.txt)、[成品重讀輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/excel-readback.txt)。
Sheet：[115-1-AP2](https://docs.google.com/spreadsheets/d/1JU-XoFaDHYGcBqmlmcflUsHswUmMJXk39yETk9o3QPk/edit#gid=1633868463)，只附加A553:AF662。
整頁備份包含552列×32欄及空白格、原公式、格式、驗證與rich chips資料；CSV＋native CellData JSON，均在 docs/sheet-backups/2026-10-22-urinary-before.*；Excel原檔在同目錄2026-10-22-urinary-excel-before.xlsx，三者皆被gitignore排除。
寫入前再比對全頁值未變。首次批次因範本列被篩選而被Google原子拒絕，確認列數仍552；改用已備份的原生格式直接設定新格，沒有改篩選或原列。新增列最後自動列高，以完整顯示長解析。
回讀舊17,664格的值、公式、格式、驗證與chip均相同；新3,520格與Excel依表頭／別名逐格比對。最後列高調整後再比對全頁21,184格值全符。
Sheet單獨欄位依304個既有資訊圖表題的填法；zuvio、primary卡、引用卡片、教師覆核註記填法混合而留空。既有AF啟用寫TRUE，未加表頭。
[逐格驗證](sheet-write-verification.json)、[實際API回覆](release-today/B/output/sheet-operations.json)、[原生畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/sheet-after.png)。

## 最終檢查實際輸出
- `npm run materials:validate-nodes`：[輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/materials-validate-nodes-final.txt)，21份既有教材＋10份核可腳本共60節點PASS。
- `node --import tsx --test tests/material*.test.ts`：[輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/material-tests-final.txt)，21/21 PASS。
- 教材回歸群組：[輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/lesson-regression.txt)，75/75 PASS。
- `npm run check`：[最終完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/release-today/B/output/npm-check-complete.txt)，前端193/193、Functions61/61，版本1.9.1、TypeScript與Vite PASS。
- 初次build舊目錄定位、TypeScript宣告缺漏均已修正；先前失敗輸出留在B/output，以上最終檔為交件依據。

## 合併、交接與操作界線
`origin/main=ba41abbb0a4c064bdc9063bf9ebd8bf00b1f6b1f`；先merge codex/reduce-function-costs得到Already up to date，再無衝突合入codex/apply9-final的52143988，合併commit527aa908。
本機發布工作樹：`.worktrees/urinary-release-2026-10-22`。根目錄佇列只更新#6b及本筆週誌，不把其他人的未提交修改混入發布commit。
本次沒有push、部署、平台同步、建立活動、改單元狀態、勾班或改teacher reviewed。部署前由Claude驗收，再由教師決定發布與平台後台操作。
後端saveExplanationResearchEvents已由教師於09:16完成部署；降費前端已在main。此次待發布的是十份教材、前端教材目錄與題庫引用；沒有新增Functions程式更動。
收工的check_handoff實際輸出見 release-today/B/output/check-handoff.txt。
