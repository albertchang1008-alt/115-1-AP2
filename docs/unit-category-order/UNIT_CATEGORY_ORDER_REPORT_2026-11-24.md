## 給 Claude 的摘要

- #69 在「課程與教材 → 單元設定 → 題目分類」加入同章上移／下移，沿用既有保存草稿與更新到學生端流程。
- 程式 `src/App.tsx`、`src/style.css`、`shared/courseStatus.ts`。測試 `tests/unit-category-order.test.ts`、`tests/fixtures/unit-category-order.tsx`、`tests/preview.test.ts`、`functions/tests/wrong-carry.test.cjs`。版本檔同步至 1.15.12。
- `npm run check` PASS，前端 322/322、後端 132/132，兩套 0 skipped。可讀性 17/17、4,864 畫面、0 跳過、0 問題。版號與路徑檢查 PASS。
- 待驗為 Claude 的 Ubuntu 非 root 重播。補登畫面依教材版本試算，已驗證重排前後補登範圍相同。正式資料及 Sheet 由測試替身代替。
- 抽查 1 檢視 `src/App.tsx` 的 `moveCategory` 只交換同章一般分類，首尾停用。
- 抽查 2 執行 `tests/unit-category-order.test.ts` 逐欄比對草稿與確認發布後的學生首頁、練習、看板明細。
- 抽查 3 執行 `functions/tests/wrong-carry.test.cjs` 實跑後端保存、發布與同步，檢查複習考原位、新分類附加及補登範圍。
- 抽查 4 核對 驗收資料夾 `admin-390.png`、`admin-1280.png` 與完整檢查紀錄。
- 抽查 5 以 `unit-category-order.bundle` 在 Ubuntu 非 root 跑完整檢查，並核對部署順序。

# 題目分類排序驗收報告（2026-11-24）

## 操作及資料流

- 在消化系統的「題目分類」將總覽按三次「上移」，後台順序成為「總覽 → 口腔 → 咽吞嚥 → 胃」。保存草稿即可保留設定，確認「更新到學生端」後學生可見。
- 將同章的一般分類在原始陣列中所佔的兩個位置互換。班級適用範圍、覆寫、題庫版本、題數、可見性、錯題延續及其他欄位從同一物件保留。其他章及複習考固定在原位置。排序變動顯示在既有「有修改未更新」標籤與更新確認摘要。
- 舊資料可能靠首個分類推導章節說明、門檻及活動。點按時草稿仍只更動 `units`。既有的草稿保存流程原先推導章節的分類仍在時，以調整前的章節設定補齊受影響的舊章節，避免移動首項時改變有效章節設定。
- 學生端 `forClass` 維持陣列順序，首頁及練習分頁用新順序顯示同進度狀態的分類。練習分頁沿用已達標與未達標分區、未達標區內進行中的分類優先。完成度看板以發布版本顯示章節明細。
- 一次性補登在完成度看板全班畫面。其 `backfillVersions` 查詢的是活動教材版本，依版本字串排序，重排後取得同一份版本清單。測試使用模擬資料確認這個後端查詢範圍。
- `saveCourse` 驗證並保存原陣列，`publishCourse` 發布既有草稿。Sheet 同步從交易內的最新草稿讀取陣列，更新既有分類的原位置，新分類接在尾端。回歸測試用次序不同的模擬 Sheet 列實跑既有 callable 與同步器，另確認同步後重新發布仍保留原順序。

## 驗證

- 本機環境 macOS arm64、Node 22.23.2、Playwright 1.63.0。完整輸出在驗收資料夾的 `npm-check.log`。
- `npm run check` 前端 322/322、後端 132/132，兩套均 0 failed、0 skipped。TypeScript、Vite 建置及後端入口載入 PASS。Vite 有 minify 後、gzip 前超過 900 kB 的 chunk 警告。
- `npm run version:check` PASS（1.15.12）。`git diff --check` PASS。
- 可讀性 PASS。正式檢查範圍 17/17 份、4,864 畫面，0 跳過、0 畫面問題、0 靜態 CSS 問題、0 執行錯誤。完整摘要見 `readability-summary.json`。
- #69 瀏覽器量測兩種視窗（390×844、1280×800）與兩種字級（預設、特大）。每種組合的 8 個排序按鈕都高 ≥44 px、位於分類清單內，頁面無水平溢位。390 寬裁切圖抽查可辨識分類名稱、變更標籤和首尾停用狀態。
- 用 `grep -nE` 自查四份改動的測試與 fixture，macOS、Windows、個人家目錄及寫死的暫存路徑 0 命中。截圖輸出位置由 `UNIT_CATEGORY_ORDER_EVIDENCE` 傳入。

### 自修清單

- 合成 Sheet 題目 ID 換成符合既有題庫驗證的值。後端專項 7/7 通過。
- 讓瀏覽器測試的字型路由回傳空 CSS，避免測試引用外部字型。以發布按鈕可用作為狀態載入完成條件，將學生首頁「展開消化系統」限定在章節卡，避免命中綜合練習的同名按鈕。看板測試依既有介面先載入班級，再勾選合成進度對應的「未開始」。

## 版號及部署前跟進

- 基準為 GitHub `main` 與本機 `origin/main` 同一提交 `e08096c4c18856491087aced7beece37a3ffc3ae`（1.15.10）。工作分支為 `codex/unit-category-order`。
- #69 排 1.15.12。待 #67 `fix/attendance-live-refresh`（`58a2ef51`，1.15.11）正式進入 `origin/main`，讓 #69 跟進當時主線，保留 1.15.12 並重跑檢查。#65 `feature/zuvio-exams`（`28a95256`，1.16.0）接著跟進包含 #67 和 #69 的主線，保留 1.16.0 與既有部署前置條件，重驗兩線在 `src/App.tsx` 的整合及版本。
- 若 #65 已先上線，#69 跟進含 #67、#65 的主線，改排當時未占用的下一個修訂版（主線仍是 1.16.0 時為 1.16.1）。以 `version:sync` 同步版本檔並重跑完整檢查。
- 隔離工作樹的 `handoff.md` 版本列由 `version:sync` 同步。共用工作樹的交接規則沿用原檔。
- 教師部署並實點時，在 115-1-AP2 的消化系統將總覽上移三次、保存草稿並確認更新到學生端。正式調整由教師執行。

## 證據及 Ubuntu 重播

截圖保存至 2026-12-01。檔案位於課程平台 repo 同層的 `課程平台-驗收證據/2026-11-24/unit-category-order/`。`admin-390.png`、`admin-1280.png` 是 390×844 及 1280×800 視窗中的題目分類區裁切圖，使用合成資料。需要重取時，把 `UNIT_CATEGORY_ORDER_EVIDENCE` 設為證據目錄，再執行 `npx tsx --test tests/unit-category-order.test.ts`。

`unit-category-order.bundle` 是基於上述 `origin/main` 的增量 bundle。請在 Ubuntu 的乾淨 `origin` clone 中驗收（可用淺層 clone），使用 Node 22、非 root 帳號及已安裝 Google Chrome 的環境，既有測試會使用 `channel: 'chrome'`。傳入 bundle 絕對路徑為第一個 shell 參數。

```sh
test "$(id -u)" -ne 0 || exit 1
base=e08096c4c18856491087aced7beece37a3ffc3ae
git cat-file -e "${base}^{commit}" || git fetch --depth=1 origin "$base"
git bundle verify "$1"
git fetch "$1" refs/heads/codex/unit-category-order
git switch --detach FETCH_HEAD
npm ci
npm ci --prefix functions
npx playwright install chromium
npm run check
npm run version:check
```
