# #42 閱讀加大全面版與設定保存

## 給 Claude 的摘要

- 結論：本機 PASS（macOS，Node 22.23.2）；Linux 非 root 實跑尚未做，待 Claude。
- 分支 feature/readability（.worktrees/readability）；內容基準 36de9666，已整合 origin/main=7bc637a1，版號 1.15.1；HEAD 見根目錄 CODEX_QUEUE.md 位置欄。
- 最終 gate：`RUNNER_TEMP=/tmp/rfin npm run check` 前端 284/284、後端 101/101、0 skipped；17/17 份、4,864 狀態、閱讀／靜態問題 0、錯誤 0（`npm-check-final.log`，gate 原始資料 `gate-npm-check/`）。
- 如實紀錄：另一次獨立 gate 在 airway-structure 預設字級出現 Playwright「browser has been closed」（16/17、errors 1、閱讀問題 0），npm run check 內的同一 gate 及單獨重跑 airway-structure 均 PASS；判為瀏覽器暫時性中斷，原始輸出保留 `gate-first-run-16of17*`。Claude 請在 Linux 觀察是否重現。
- 保護：49 份教材 HTML 與 36de9666 逐檔相同（0 變動）、materials-src 0 變動、course-learning.js 自 `let context` 起學習尾段不變（`preservation-final.json`）。
- 部署：functions `saveCourse`、`bootstrap`（專案 ap2-7ed91）先部署；前端 `git push origin feature/readability:main`，詳見「部署清單」。皆未執行。
- bundle：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-full/readability-full.bundle`（含 feature/readability 全部提交，驗證用）；用法見「Linux 驗收」。
- 抽查：①Player 送 display-prefs 與 sandbox 不變 ②saveCourse 非教師／revision 衝突拒絕 ③acid-base 的 tracking 4 份 ④32 份舊教材警告 965 處（不擋）⑤Linux 實跑。
- 不改教材 HTML、題目、答案、reviewed 卡與闖關判定；未 push、未部署、未寫正式資料；截圖保存至 2026-11-06。

## 最終驗證輸出（本次重跑，2026-10-30 21:00–21:42）

| 項目 | 結果 | 原始輸出（證據資料夾） |
|---|---|---|
| npm run check（前端／後端／build／readability:check） | 284/284、101/101、skipped 0；17/17、4,864 狀態、0 問題 | `npm-check-final.log`、`gate-npm-check/` |
| 獨立 gate 首次 | 16/17，airway-structure 瀏覽器中斷（非閱讀問題） | `gate-first-run-16of17.log`、`gate-first-run-16of17/` |
| airway-structure 單獨重跑 | PASS，204 狀態、0 問題 | `gate-airway-rerun.log`、`gate-airway-rerun/` |
| 保護雜湊 | 49 份 HTML 0 變動；SDK 學習尾段不變 | `preservation-final.json` |
| Firestore Emulator 7 組 | pass（整合時 19:49；functions 與 SDK 之後未改，僅文件／版本橫幅檢查變動） | `settings-integrated.log` |

`npm-check-final.log` 末尾的 check-exit 行因包裝腳本 tty 錯誤未寫入，以最終摘要行判定 PASS（已在該檔註記）。四組合＝390×844、1280×800 外框 × 預設、特大。事件紀錄：64 份 events-*.json 均 pass、completedCalls=1；acid-base 的 4 份 tracking（各 62 筆）。

## 平台情境與字級保護

實際Player的HtmlMaterial與FontSizePicker在本機隔離頁運作，沿用`sandbox="allow-scripts"`，不加allow-same-origin、不用srcdoc。教材不能讀平台localStorage；由Player透過protocolVersion=1的display-prefs送字級與overlay布林。SDK只接受parent、合法字級與布林，初次載入、ready、字級切換與設定變動均送出；晚到ready使用最新設定。非互動教材同樣接收顯示偏好。

取消三份樣張限制，全部實際載入SDK的49份教材可套用。CSS限定data-readability=on，分apply-kit-script／learning-kit／other。缺省開啟，教師可關閉或指定materialVersion排除。關閉時清除CSS、標記及放大工具，既有學習context與事件流程保留。

SDK在原樣式情境逐元素量出計算字級，透過自訂變數讓CSS取max(原字級,規範字級×scale)。內文與選項18、題幹19、標題21、行高1.6、點擊高44；不把原來較大的標題壓小。檢查器同時比較CSS字級與SVG實際螢幕字級，若小於原版同元素即FAIL。參考量測呼叫原教材自己的responsive resize，使原生箭頭標籤使用正確縮放比例；沒有硬改SVG標籤座標。

不改DOM版面順序。短訊息垂直置中，圖面依自然高度伸展；空間標示題保留原生平移座標。低於圖字門檻的圖須有獨立可操作的放大入口；點陣圖不能以font-size推斷文字大小，無放大替代即FAIL。放大複本為唯讀圖像，關閉後原題狀態不變。

## 檢查涵蓋與保護

17份以390×844、1280×800外框，各預設與特大四組合完整走訪；平台閱讀列48px，iframe高度分別796、752。涵蓋引導、六節點、錯答／正答、回饋、過關、轉場、考核與完成；按畫面量測字級、行高、對比、水平溢出、選項重疊、按鈕水平與垂直裁字。測試會檢查同一元素原版／overlay字級，不以單一全頁最小值代替角色門檻。圖字可低於內文18px，仍須符合圖字12px或放大替代規則。

64份事件紀錄（16份×四組合）加acid-base-homeostasis的4份tracking紀錄（各62筆事件，由checkScriptLayout驗證）；事件紀錄須各有completedCalls=1、有效questionId／nodeId、錯答與正答、六節點及reduceLearning結果。HTML與materials-src逐檔比對36de9666；SDK從let context起的學習佇列與事件程式原文不變。原HTML的重建與雜湊測試照常執行。

靜態檢查保留169筆既有apply-kit來源宣告白名單：依13:15決定不改原HTML及其來源，改由SDK overlay接管字級。每筆列出檔案、selector、property、value與理由；動態17份四組合仍是必過門檻，未將動態閱讀失敗加入白名單。學生端src新增的固定字級已改為乘font-scale。

## 開關後端保存（原#42b）

saveCourse沿用既有教師權限、課程teacherIds、交易與expectedRevision；正規化並保存readabilityOverlay與排除清單，缺省true及空陣列。bootstrap的教師及學生分支回傳相同設定；既有三個features布林維持獨立。根層設定優先，缺欄時相容既有draft／published設定；不改published教材、不批次遷移課程，不更動班級勾選。

驗證含非教師與跨課程拒絕、true／false＋排除清單往返、缺省開啟、非法型別／路徑／重複／過量項目拒絕、revision衝突不覆寫。真實Firestore Emulator使用demo-readability、127.0.0.1:8157及合成教師／學生，腳本對非demo專案與非本機Emulator會先拒絕。未連正式Firestore。

## 舊教材警告的範圍

其餘32份僅量390寬初始畫面，預設／特大共64組；不是完整作答流程驗收。所有外部字型、舊GA及其他非本機資源請求均由測試攔截，不會為驗收產生正式追蹤。依任務這些警告不擋17份期中教材，但仍列出具體問題，不能視為所有教材已達標。

## 32 份舊教材：64 組初始畫面

僅量 390 寬初始畫面（預設／特大），不是作答流程驗收。64 組均載入、流程例外 0；閱讀探針共 965 處（contrast 235、font-size 264、control-clipped-vertical 24、background-unverifiable 434、raster-labels-unverified 6、target-height 2）。ecg-basics-v1 特大首次載入逾時，以原程式重跑後完成（`legacy-ecg-retry/`）。外部字型、舊 GA 請求均被攔截。依任務不擋 17 份期中教材，但不代表所有教材達標。原始：`legacy/`、`legacy-consolidated.json`。

## 與樣張、歷史基準的關係

13:15 三份樣張證據保留於前輪 readability-overlay 證據資料夾（保存至 2026-11-06）。原 B 的 opt-in 檔保留為歷史樣張，現行 49 份 HTML 無新增引用；正式路徑為 Player→display-prefs→course-learning.js→readability-overlay.css。

## 部署清單（只列出，未執行）

先由 Claude 審核並補 Linux 實跑，教師核可後才能執行。origin/main=7bc637a1（21:43 fetch），閱讀分支已包含；部署前若主線前進，先停止、整合及重測，不強推。

Functions（專案 `ap2-7ed91`）：`saveCourse`、`bootstrap`；先後端、後再前端。其他 functions、Storage 規則、索引、既有課程資料不動。

```sh
cd /Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/readability
git fetch origin
git merge-base --is-ancestor origin/main HEAD || exit 1
npm run check
firebase deploy --project ap2-7ed91 --only functions:saveCourse,functions:bootstrap
git push origin feature/readability:main
```

GitHub Actions 綠勾後，教師在後台保存閱讀開關與排除清單，重載學生頁核對 bootstrap。全關或排除某份即可停用 overlay，不需回寫教材或通關紀錄。

## Linux 驗收（Claude）

bundle：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-full/readability-full.bundle`（`git bundle verify` 已通過，見 `bundle-verify.log`；內容 feature/readability 全部提交）。

```sh
git clone -b feature/readability <bundle路徑> rd && cd rd
npm ci && npm --prefix functions ci && npx playwright install --with-deps chromium
npm run check   # 非 root；RUNNER_TEMP 或 os.tmpdir() 為暫存
```

## 證據索引

- `npm-check-final.log`、`gate-npm-check/`（17 份 JSON、截圖、事件）；`gate-first-run-16of17*`、`gate-airway-rerun*`。
- `preservation-final.json`、`settings-integrated*`、`legacy*`、`context.json`、`manifest.sha256`。
- 前輪遺留：`integrated-check.log`（整合後完整 PASS，20:16）、`frozen-check.log`（整合前）、`integrated-check-first-failure.log`。

截圖及大型輸出位於 repo 外；保存至 2026-11-06。本輪未 push、未部署、未讀寫正式學生資料。
