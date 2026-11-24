## 給 Claude 的摘要

- #69 原提交 `37b7188d` 與已上線的 `781bed78` 整合為本機 `1b6ce43a`（1.16.1）。`src/App.tsx` 自動合併，13 個版本衝突均以主線內容為底同步。其餘 #69 程式及測試與原提交相同。
- Mac、Colima 的 `READABILITY_ALL=1 npm run check` 各有前端 362/362、後端 158/158，皆 0 failed、0 skipped。Vite 建置完成。兩端各量測 17 份、4,864 畫面，0 問題、0 執行錯誤、0 跳過。
- Colima 最終 11 步 PASS、0 FAIL，見 `ubuntu-replay-1b6ce43a-2252/summary.txt`。原 Playwright 下載連續兩次逾時，改用同版官方 ZIP 的容器內暫存快取。共用樣式變更使 07 步重測 17 份。驗收由 Claude 裁定，教師手機實點待部署後執行。
- 抽查 1 核對 `781bed78..1b6ce43a` 的 `src/App.tsx` 與版本檔；`02-tree.log` 的 tree 為 `527595b2`。
- 抽查 2 讀 Mac 的 `mac-npm-check.log` 與 Ubuntu 的 `06-check-all.log`，核對分類排序、舊章節設定、後端保存／發布／同步測試，以及建置結果。
- 抽查 3 讀 `05-pw-install.log`、`ubuntu-local-cache-tool.diff` 與 `browser-archives.sha256`，核對瀏覽器版件與重試範圍。
- 抽查 4 讀 Ubuntu `07-readability-hit.log` 至 `10-clean.log`，核對完整重播與工作樹狀態。

# #69 題目分類排序 1.16.1 主線整合（2026-11-24）

## 主線整合與版號

- 原 #69 提交為 `37b7188d`。以佇列記載的已上線提交與 `origin/main` `781bed78` 作為第二父提交。本機 `main` 指向 `75f3b6af`，因此以 `781bed78` 為整合基準。保留原 #69 提交供後續查核。
- `src/App.tsx` 自動合併。其餘 #69 的程式及測試與原提交逐檔相同。13 個衝突都在版本同步檔。先採主線檔案內容，再以 `npm run version:sync` 同步 1.16.1。相對 `781bed78`，各版本同步檔只改版號欄或版本列。
- `git diff --check 781bed78 1b6ce43a` 結束碼 0。四份 #69 測試與 fixture 的寫死系統路徑 grep 為 0 命中，見 `paths.log`。

## Playwright 下載重試

- Colima 第一次使用原工具的 30 秒逾時，第二次用暫存工具副本延長到 120 秒，兩次都在 05 步下載 Playwright Chromium 時失敗。停止兩個失敗容器後，另從 Chrome for Testing 與 Playwright 官方端點預取 Chromium、Headless Shell 與 FFmpeg，三個 ZIP 都通過 `unzip -tq`。
- 重播的暫存工具副本只調整 05 步的下載來源。容器透過 loopback 提供原版 ZIP，仍由 `npx playwright install chromium` 驗證並安裝相同版件，完整測試仍以非 root 的 `runner` 執行。工具差異及 SHA-256 檔放 Mac 證據夾。
- 失敗取證為同日 `ubuntu-replay-1b6ce43a-2246/05-pw-install.log`、`ubuntu-replay-1b6ce43a-2249/05-pw-install.log`。

## 原始檢查結果

| 檢查 | Mac arm64、Node 22.23.2 | Ubuntu 24.04.5 x86_64、Node 22.23.5、runner UID 1001 |
|---|---|---|
| 完整 `READABILITY_ALL=1 npm run check` | 結束碼 0 | 06 步結束碼 0 |
| 前端、Functions | 362/362、158/158，0 failed、0 skipped | 362/362、158/158，0 failed、0 skipped |
| TypeScript、Vite、版本檢查 | 建置完成、版本一致 1.16.1 | 建置完成、版本一致 1.16.1 |
| 全量可讀性 | 17/17 份、4,864 畫面，0 跳過、0 畫面問題、0 靜態問題、0 執行錯誤 | 17/17 份、4,864 畫面，同為 0 跳過與 0 問題 |
| 分類按鈕可讀性 | 專項測試涵蓋 390×844、1280×800 及預設、特大兩種字級，按鈕高度 ≥44 px、無水平溢位 | 同一專項測試執行完成 |
| 重播附加步驟 | — | 07 步因共用樣式指紋改變，全量再查 17 份、4,864 畫面、0 問題。08 版本、09 Zuvio 瀏覽器流程、10 工作樹乾淨皆結束碼 0 |

Colima 最終摘要列出 00–10 共 11 步 PASS、0 FAIL，工具結束碼 0。重播工作樹 tree 為 `527595b2334fca62b0a3365ae7ba8613df67d8df`，與 `1b6ce43a^{tree}` 一致。Claude 依原始證據作驗收裁定。

## 證據

證據位於 repo 同層的 `課程平台-驗收證據/2026-11-24/`，截圖保存至 2026-12-01。

- Mac、路徑檢查、瀏覽器檔案校驗及暫存重播工具的差異在 `unit-category-order/1.16.1-1b6ce43a/`。
- 最終 Colima 紀錄在 `ubuntu-replay-1b6ce43a-2252/`，含 `summary.txt`、步驟日誌及 `zuvio-browser/`。截圖保留作存證。
- 前一版功能規格與證據路徑見同目錄的 `UNIT_CATEGORY_ORDER_REPORT_2026-11-24.md`。原 Claude 覆核在同日證據夾 `unit-category-order/claude-replay/linux/CLAUDE_REVIEW_69_2026-11-24.md`。

`origin/main` 仍指向 `781bed78`。#69 留在 `codex/unit-category-order` 等 Claude 覆核與教師部署。#70 的工作樹等 #69 進主線後再建立。
