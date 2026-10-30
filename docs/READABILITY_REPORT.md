# 教材閱讀規範：A現況量測與B腎臟樣張（#42）

## 給 Claude 的摘要

- 狀態：A檢查器完成；B樣張PASS，停-等教師；正式17份現況FAIL，未做C、不得部署。
- 分支：feature/readability；worktree：.worktrees/readability；基底origin/main=45b9e266（開工fetch確認），版號保持1.14.0。
- 檔案：scripts/readability-check.mjs、readability-sample.mjs、scripts/lib/readability-*、apply-kit/readability.*、tests/readability.test.ts。
- 正式量測：17份／4848畫面狀態，169044次問題、0流程錯誤；靜態175處FAIL，教師專用宣告17處附理由排除。
- 樣張：390預設／特大178狀態、0問題；字級事件與放大後闖關狀態保持PASS。
- npm run check：前端268／後端98全過、0 skipped；建置及version:check PASS；新增閱讀門檻exit 1，原因為上述現況FAIL。
- 保護比對：666個既有教材來源／發布檔0變動，49份發布HTML SHA列入證據；無正式資料寫入、push或部署。
- 偏離：遵守B停點，未全面改17份或學生端src；保留嚴格FAIL，不用教材問題豁免湊綠燈。
- 抽查1–3：下方三組390截圖（過關／轉場）、baseline/summary.json、preservation.json。
- 證據：/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability；截圖保存至2026-11-06。

## 實際驗證輸出

```text
npm run check
frontend: tests 268, pass 268, fail 0, skipped 0
backend:  tests 98, pass 98, fail 0, skipped 0
version:check 1.14.0 PASS; tsc + vite build PASS
readability: {"materials": 17, "pass": 0, "fail": 17, "screens": 4848, "issues": 169044, "staticIssues": 175, "errors": 0}
exit 1 （正式現況門檻未通過）

node scripts/readability-sample.mjs --out /tmp/codex-readability/sample-review
after: materials 1, pass 1, fail 0, screens 178, issues 0, errors 0
exit 0
```

新加4項檢查器測試包括正反例、平台字級、點擊高／裁字／溢出／重疊、點陣圖保守處理及有理由的精確CSS白名單，已納入268項測試。完整輸出見證據npm-check-final.log及sample-review.log。最後加強「必須乘比例，不能只引用變數」的靜態反例後，另重跑4項檢查器測試，4/4、0 skipped；static-final.json與全量量測中的175項問題及17筆教師排除逐筆一致，見unit-final.log。

## 17份修改前基準

下表跨390×844與1280×800、預設與特大四組走訪；「最小字級」包含SVG等所有角色，「最小內文」只列body角色。小於角色下限、未接平台字級、對比不足及圖像待核對等都保留FAIL。

| 正式教材 | 狀態數 | 結果 | 問題次數 | 最小字級px | 最小內文px |
|---|---:|---|---:|---:|---:|
| airway-structure-v1 | 204 | FAIL | 14544 | 13.28 | 16.00 |
| lungs-pleura-v1 | 204 | FAIL | 14524 | 12.89 | 16.00 |
| breathing-mechanics-v1 | 204 | FAIL | 16340 | 12.89 | 16.00 |
| lung-function-v1 | 204 | FAIL | 18480 | 12.89 | 16.00 |
| gas-exchange-v1 | 204 | FAIL | 14700 | 12.89 | 16.00 |
| o2-co2-transport-v1 | 204 | FAIL | 15888 | 12.89 | 16.00 |
| respiratory-control-v1 | 204 | FAIL | 15624 | 12.89 | 16.00 |
| kidney-anatomy-v1 | 348 | FAIL | 7601 | 14.00 | 14.00 |
| nephron-circulation-v1 | 342 | FAIL | 6760 | 14.00 | 14.00 |
| filtration-clearance-v1 | 352 | FAIL | 6792 | 14.00 | 14.00 |
| tubular-handling-v1 | 336 | FAIL | 6002 | 14.00 | 14.00 |
| urine-concentration-v1 | 344 | FAIL | 5117 | 14.00 | 14.00 |
| urinary-route-micturition-v2 | 358 | FAIL | 6114 | 14.00 | 14.00 |
| fluid-compartments-v1 | 320 | FAIL | 5966 | 14.00 | 14.00 |
| water-sodium-regulation-v1 | 342 | FAIL | 5259 | 14.00 | 14.00 |
| electrolyte-balance-v1 | 338 | FAIL | 4561 | 14.00 | 14.00 |
| acid-base-homeostasis-v1 | 340 | FAIL | 4772 | 14.00 | 14.00 |

## A：檢查器與量測方式

- `scripts/readability-check.mjs` 已接到 `npm run check` 最後一關。對17份正式發布HTML量測390×844、1280×800，以及預設／特大四種組合；排尿教材使用目前發布的v2，其餘為v1。
- 呼吸7份走圖像狀態、預測、各節點、基礎題、情境題、錯答提示、回節點複習、重試及完成。泌尿／體液10份沿用既有實際闖關走訪，新增觀察回呼，量測開場、引導各步、節點、提示、微測驗、錯答／正答、過關、轉場與考核；原有測試呼叫方式不變。
- 依實際DOM量測字級、SVG縮放後字級、行高、文字背景對比、點擊高度、裁字與水平溢出；選項重疊探針涵蓋`.answer-options button`、`.options button`、`[data-pool]`、`[data-micro]`。既有教材幾何回歸測試另外保留。
- `course-font-scale`直接設為平台的default／xlarge，沒有在測試端強塞CSS變數來掩蓋教材未接設定的問題。網路請求攔截，學習SDK替身只在本機記錄；不呼叫正式平台。
- 點陣圖中文字不能從DOM可靠讀出字級；沒有獨立放大鈕就列`raster-labels-unverified`，不當作字級已通過。SVG／CSS對比以元素及祖先CSS背景計算；圖像內部色彩和文字仍需人工看圖，這不是OCR或逐像素認證。
- `scripts/lib/readability-static.mjs`掃描apply-kit CSS與學生共用src CSS，固定font-size及font shorthand未接`--font-scale`即FAIL。`scripts/readability-allowlist.json`僅17筆可定位的教師專用宣告，每筆列來源與理由；學生共用樣式、17份教材問題沒有豁免。歷史樣張CSS及其他舊教材只列警告。
- 計數是各尺寸／字級／狀態中的問題出現次數，同一元素跨畫面會重複計算，不能解讀為獨立錯誤元素數。原始JSON附每一畫面的selector、量測值與下限。隨機選項順序可能令裁字問題的次數小幅不同。

## B：腎臟樣張

只新增opt-in的`materials-src/apply-kit/readability.css`、`readability.js`、`readability-preview.mjs`。正式renderer沒有載入它們；`scripts/readability-sample.mjs`只在倉庫外產生預覽，教師核可前不全面套用。

- 預設：內文／選項17px、題幹18px、標題20px；最小點擊高49.19px。
- 特大：內文／選項22.1px、題幹23.4px、標題26px；最小點擊高57.34px。
- 過關短回饋22px（特大28.6px）；完成／轉場主標24px（特大31.2px）並垂直置中，手機以正常垂直捲動容納內容。
- 89個狀態×兩字級＝178個狀態，0問題、0流程錯誤；無水平溢出、選項重疊或按鈕裁字。`storage`事件切字級即時更新。
- 圖像有獨立放大鈕，放大到至少1000px、可在圖框內平移；關閉後`StudentScriptUI.getState()`與開啟前深度比對相同。圖框內平移不等於整頁水平溢出。
- 原版390預設89個狀態有2051次問題：字級980、行高252、對比254、點擊高度501、點陣圖待核對64；內文／選項最小14px、最小點擊高28px。調整後相同走訪路徑全部0。

### 手機截圖（390×844）

證據根目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/`。**截圖保存至2026-11-06**。

| 畫面 | 目前 | 調整後預設 | 調整後特大 |
|---|---|---|---|
| 開場 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/before-opening.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/after-default-opening.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/after-xlarge-opening.png) |
| 節點過關回饋 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/before-N1-passed.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/after-default-N1-passed.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/after-xlarge-N1-passed.png) |
| 開始考核轉場 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/before-transition.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/after-default-transition.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/after-xlarge-transition.png) |
| 恭喜過關完成 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/before-complete.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/after-default-complete.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability/sample/after-xlarge-complete.png) |

## 不變性與範圍

`preservation.json`將origin/main（45b9e266）中所有666個已追蹤的materials-src及public/materials檔案逐位元組比較：0個變動；其中49份發布HTML的SHA256亦完整列出。本次只有新增的預覽樣式／橋接及測試觀察工具；原資料、教材文字、題目／答案、reviewed卡、判定程式、已通關紀錄與事件格式均未修改。

遵守共享kit規則，另將泌尿／體液10份由核可renderer重建到證據的`sample/ten-previews/`，沒有寫回public。`sample/ten-preview-builds.json`列每份SHA256、nodeTotal、questionTotal；這是既有正式renderer的重建，不是宣稱10份都已改為大字。

本輪偏離／限制：為遵守B樣張停點，未執行C的17份全面改版及src學生樣式修正；嚴格門檻保留FAIL。未給既有教材問題加白名單，未略過測試。這份是供教師核可方向的樣張報告，不能作為17份教材已達閱讀規範的驗收證明。

## 重現與證據

在`.worktrees/readability`使用Node22.23.2：

```sh
npm ci
npm --prefix functions ci
npm run check
# 本階段預期閱讀現況門檻exit 1；前三段測試／建置必須通過
npm run readability:check -- --out /tmp/readability-current
node scripts/readability-sample.mjs --out /tmp/readability-sample
# 樣張指令應exit 0，after/summary.json應178狀態、0問題
```

原始證據：`baseline/summary.json`及17份`baseline/<slug>.json`、`sample/before/`、`sample/after/`、`sample/comparison.json`、`sample/zoom-and-state-proof.json`、`sample/ten-preview-builds.json`、`npm-check-final.log`、`preservation.json`、`manifest.sha256`。不將大型原始輸出或截圖納入Git。

## 給教師的待辦

請比較三組390寬截圖，確認預設17px、特大22.1px的內文、加大的過關訊息、置中的轉場，以及較長畫面可垂直捲動的方向。核可後再交Codex執行任務C：17份與學生端CSS全面修正、共享kit十份重建、檢查全部PASS後交Claude；本輪停在#42「停-等教師」。沒有push、部署、正式資料寫入或學生公告。
