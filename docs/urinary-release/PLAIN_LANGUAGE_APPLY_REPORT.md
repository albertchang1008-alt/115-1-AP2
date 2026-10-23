# 給 Claude 的摘要

- #29 A五項修正與B寫回完成；codex/plain-language-110基底abe28fd5已包含release，未另造合併提交。
- 檔案：10份apply.json、9份既有版本HTML、Excel、110題稿件與精確內容雜湊；酸鹼full.json與正式HTML逐byte未變。
- PASS：來源／Excel／實際Sheet的990個指定欄位值一致；ID、正解位置、分類、②、⑤及其他列不變。
- PASS：十份verify、SCRIPT_DIFF缺0多0、content-check、8尺寸80條全流程；6552個畫面、2649筆事件逐筆validEvent有效。
- PASS：npm run check（前端208／Functions61、build）；檢查器29案。附完整實際輸出與3張390×844手機截圖。
- Excel比較9,996格、Sheet比較21,184格，各實改921格；整頁備份不commit。
- 教師本對話更正數量為9份一般教材＋酸鹼樣張共10份，不升既有v1／v2版本。
- 檢查器僅加精確核可SHA及兩個合法台灣用語片語；額外改字、改答案、真正禁用詞仍拒絕。
- 教師確認未同步且本批未有作答，故不實作錯題遷移。不push、不部署、不按同步；Functions不動。
- 抽查5項：尿濃縮foundation-q05、電解質foundation-q01／q04、水鈉case-q04、精確雜湊負例、Sheet回讀證據。

## 五項修正

| 項目 | 最終處理 |
|---|---|
| 解析與③不能綁字母 | 110題引用選項內容，①③④與解析無選項字母；ADH／ACE與維生素D是名詞。4個範例同步更正。 |
| V1誘答有課本爭議 | 尿濃縮foundation-q05第三項改「用V2受器，增加鈉通道，讓鈉更容易通過」；①改問水／鈉通道，不再提示V1。第一項正解位置不變。 |
| 定義只在需要處 | 水鈉case-q03及foundation-q04的定義留解析；case-q04題幹與選項改用「轉換幫手ACE」，酵素說明只在解析。詞義放在使用該詞的欄位。 |
| ①④配合新選項 | 電解質foundation-q04：①問細胞外最多的正電小粒子是鈉或鉀；④「鈉在外，鉀在內」。逐題閱讀其餘109題提示、記憶句，沒有舊誘答殘留。 |
| q01解析改順 | 電解質foundation-q01：「選『2顆』的同學，是把鎂帶的『2份電』當成了顆數。」正解仍為原位置的3顆。 |

新誘答的reviewed卡原句：

> adh-water-reabsorption：「ADH 作用於 V2 受器，提高腺苷酸環化酶活性、增加水通道數目」

> adh-water-reabsorption：「ADH 直接調整水通透性；醛固酮主要促進鈉再吸收，兩者保水方式不同。」

新迷思把水通道換成鈉通道，與兩句來源分工不符；不拿課本V1／V2編號衝突判定誘答。34張reviewed卡、106段逐字原句，卡片與reviewed狀態沒有變動。完整路徑、行號與SHA見[proposal](plain-language-110/proposal.json)，逐題舊新對照見[110題稿件](PLAIN_LANGUAGE_110.md)。語意等價及小六可讀性是作者審稿，沒有冒稱做過真實學生閱讀測試。

## 寫回、備份與一致性

教材只換兩階段題的stem、options、hint、explain及對應引文；節點、配合題、答錯重來（丙）、ID、answer、nodeId、⑤與版本保留。9份HTML由buildApprovedUrinary產生，preview:true保留既有登錄，不執行平台同步；verify逐份核對正式HTML、登錄分母及render。酸鹼11題只更新題庫來源／表格列，正式full題池不換。

- Excel依ID定位題庫306–415列，僅H、I:L、O、P、R、S。
- Sheet依ID定位115-1-AP2的553–662列，僅L、O:S、T、V:W。
- 各授權990格、實改921格，69格原本已相同。正解代碼、Zuvio解答、分類、②、⑤、其他列與工作表不變。
- Excel完整備份：docs/sheet-backups/plain-language-apply/excel-before.xlsx。用artifact-tool編輯，再只把授權值嵌回原ZIP；其他ZIP成員逐byte相同。
- Sheet[整頁雲端備份](https://docs.google.com/spreadsheets/d/1jEmc_niOK9unKTWCLBB2_gfjPQEmGTMQlFLCJq85txw/edit)，已確認662列×32欄。原始及最終完整矩陣留在同一git忽略目錄，不commit備份。
- 首次寫330個精確範圍，末次複查case-q04再改該列3格；最後重新讀取整頁對第一次備份，改動範圍仍限原990格。

[Excel逐格證據](plain-language-apply/excel-verification.json)｜[Sheet逐格證據](plain-language-apply/sheet-verification.json)｜[三方一致性](plain-language-apply/bank-consistency.json)｜[實際Sheet解析輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/parse-sheet-output.txt)｜[新manifest](plain-language-apply/bank-manifest.json)

實際Sheet回讀矩陣經parseBankSheet成功解析655題啟用題，其中本批110題全部找到，選項與正解代碼一致；既有6題停用未改。

## 驗證與實際輸出

8尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。真實course-learning.js佇列在本機攔截，逐筆validEvent及reduceLearning；實際走答錯、重來、全對、六節點與一次completed，不送真實學生紀錄。

首輪npm run check已跑十份八尺寸；最後case-q04修正後重跑水鈉八尺寸，其他九份HTML與已捕獲畫面逐byte相同。最後npm run check再跑十份兩個基本尺寸、全部測試與build，沒有用舊輸出代替最後版本。

~~~json
{
  "pass": true,
  "materials": 10,
  "ordinaryRebuilt": 9,
  "acidFullUnchanged": true,
  "viewports": 8,
  "materialViewportFlows": 80,
  "layoutCases": 6552,
  "events": 2649,
  "invalidEvents": 0
}
~~~

| 教材 | 畫面數 | SCRIPT_DIFF缺／多 | 登錄與事件 |
|---|---:|---|---|
| kidney-anatomy | 652 | 0／0 | PASS，8尺寸 |
| nephron-circulation | 675 | 0／0 | PASS，8尺寸 |
| filtration-clearance | 628 | 0／0 | PASS，8尺寸 |
| tubular-handling | 644 | 0／0 | PASS，8尺寸 |
| urine-concentration | 654 | 0／0 | PASS，8尺寸 |
| urinary-route-micturition | 701 | 0／0 | PASS，8尺寸 |
| fluid-compartments | 618 | 0／0 | PASS，8尺寸 |
| water-sodium-regulation | 659 | 0／0 | PASS，8尺寸 |
| electrolyte-balance | 673 | 0／0 | PASS，8尺寸 |
| acid-base-homeostasis | 648 | 0／0 | PASS，8尺寸 |


[十份完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/verify-ten-output.txt)｜[逐份JSON](plain-language-apply/verify-ten.json)｜[首輪八尺寸npm輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/npm-check-first.log)｜[最後水鈉八尺寸](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/final-water-eight.log)

十份正式入口content-check輸出（九份apply＋酸鹼full；full也檢查embedded apply）：

~~~text
nephron-circulation/apply: PASS
kidney-anatomy/apply: PASS
tubular-handling/apply: PASS
filtration-clearance/apply: PASS
urine-concentration/apply: PASS
urinary-route-micturition/apply: PASS
fluid-compartments/apply: PASS
water-sodium-regulation/apply: PASS
electrolyte-balance/apply: PASS
acid-base-homeostasis/full: PASS

~~~

[逐份內容檢查](plain-language-apply/content/)包括學生HTML與作答前檢查。額外試過酸鹼legacy apply獨立CLI，因舊lab入口沒有正式播放器的#start而timeout；它不是本次正式入口。保留[額外探針原始輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/content-browser-extra-probe.log)；正式full與內嵌apply引文檢查均PASS。

檢查器調整：water v1只接受本次完整文件SHA，額外改標題、提示、引文仍拒絕；台灣用語清單只加入「過濾過程／過濾過去」避免跨字誤判，真正「濾過」仍拒絕。110題核可清單鎖住原始與新題完整內容SHA，額外改題幹、選項、解析、正解均拒絕。

最終npm run check摘要（[完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/npm-check.log)）：

~~~text
# tests 208
# suites 0
# pass 208
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 220706.584917

# tests 61
# suites 0
# pass 61
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 572.351209
~~~

檢查器回歸測試摘要（[29案完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/checker-regression.log)）：

~~~text
1..29
# tests 29
# suites 0
# pass 29
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 14245.819084

~~~

重現指令：

~~~sh
python3 docs/urinary-release/plain-language-110/validate.py --applied
python3 docs/urinary-release/plain-language-apply/verify-bank.py
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/plain-language-apply/parse-sheet.mjs
node docs/urinary-release/plain-language-apply/content-browser-check.mjs
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/plain-language-apply/verify-eight.mjs
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/plain-language-apply/verify-ten.mjs
node --test tests/apply-final-ui.test.mjs tests/apply-neutral.test.mjs tests/apply-kit.test.mjs
npm run check
~~~

## 390×844第二關手機截圖

腎臟與尿液濃縮是本次重建；酸鹼依交辦維持原full題池。

![腎臟第二關](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/phone-kidney.png)

![尿液濃縮第二關](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/phone-urine-concentration.png)

![酸鹼第二關，full題池不變](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/phone-acidbase.png)

Google Sheets原生100%縮放，保留欄寬、凍結列與換行：

![實際Sheet寫回](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/plain-language-apply/sheet-native-after.png)

## 錯題與上線邊界

教師確認本批尚未同步、學生尚未作答，沒有讀寫學生資料或實作遷移。先前歷史情境方案保留：若已存在舊版作答，正解文字改寫88題會被現行wrongCarry排除，不能把「同義」當成系統已支援承接；日後有舊作答時須另案核可精確內容對照。本次沒有Functions改動。

部署範圍為前端9份靜態教材與題庫資料；酸鹼正式HTML、Functions與版本號不變。Excel／Sheet準備好供教師後續同步，本機HTML尚未推送。沒有push、部署、按同步或勾班。根目錄另放相同報告供Claude接手，實作保留於本worktree。
