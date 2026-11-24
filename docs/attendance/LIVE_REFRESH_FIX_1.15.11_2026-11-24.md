# 給 Claude 的摘要

- #67／1.15.11。從 GitHub `origin/main` 的 `e08096c4` 建立 `fix/attendance-live-refresh`，工作樹 `.worktrees/attendance-live`。
- 變更檔案為 `src/AttendanceAdmin.tsx`、`scripts/attendance-ui-check.mjs`、`tests/attendance-live.test.ts`、`tests/fixtures/attendance-ui.tsx`、版本同步檔與本報告。
- PASS：點名測試 18/18（含 7 個假時鐘案例），UI 39 個畫面與 8 項操作檢查，TypeScript、版本同步與可攜性自查。FAIL：0。根目錄交接檢查 PASS。
- 偏離交辦：無。macOS 非 root 實跑。全套 `npm run check`、Ubuntu 非 root 實跑及 60 秒瀏覽器錄影留給 Antigravity 3.8。
- 抽查 1｜每秒減少三種倒數，5 秒更新已簽數，QR 與數字碼在各自的換段時讀取。
- 抽查 2｜歸零立即查詢，既有 5 秒寬限結束時才依後端回應觸發 `onEnded`。
- 抽查 3｜隱藏時暫停、回前景立即查詢，慢請求期間最多一筆，卸載立即清除計時器。
- 抽查 4｜失敗保留簽到資料和畫面，顯示「連線中…」，重試成功後清除提示。
- 抽查 5｜`attendance-ui-check.mjs` 使用模擬後端在 Chromium 開投影 20 秒，核對倒數、QR token、呈現的 QR 及簽到人數。

## 本件交辦與實作

1.15.10 投影只在首次載入與手動操作後讀取 `attendanceLive`。點名倒數、已簽到數與憑證凍結，QR 在後端接受的兩個區段過後失效。1.15.11 修正投影前端並以合成資料複驗。後端程式與 API 維持原樣。

投影依最近一次伺服器回應的剩餘毫秒數，每秒更新顯示。讀取時間取下一個 QR 換段、數字碼換段、場次歸零或 5 秒輪詢的最早時點。到期但後端仍回傳開放場次時，畫面維持 0:00，待寬限結束再確認。只有後端回傳已無進行中場次才觸發 `onEnded`。正式點名切往節次與名冊；試簽顯示原有結束提示。

輪詢及手動操作共用同一筆進行中請求。隱藏時停止投影計時與自動讀取。回前景時若已有進行中請求，等該筆完成後再讀。卸載清除逾時、每秒計時與可見性監聽，忽略晚到回應。讀取失敗保留最近一次成功資料，並於下一個換段或最多 5 秒後重試。

`version:sync` 將工作樹內的 `handoff.md` 版本行同步至 1.15.11。根目錄的交接規則未改。佇列與週誌位於根目錄，這次只更新 #67 和本週紀錄。

## 驗證

| 指令或項目 | 結果 |
|---|---|
| `node --import tsx --test tests/attendance-live.test.ts tests/attendance.test.ts` | PASS，18 項，0 失敗，0 跳過。用 Playwright 假時鐘推進 1、5、9、12、42 與 47.001 秒，並驗證模擬斷線、慢請求、提前結束、延長與卸載。 |
| `node scripts/attendance-ui-check.mjs` | PASS，學生端 34 個畫面（390×844，預設與特大）；教師端 5 個畫面，8 項操作，0 失敗，0 頁面錯誤。 |
| 投影 20 秒 | 倒數 0:42 → 0:22，mock token 及投影上的 QR 同步更換，已簽到 45／60 → 48／60。 |
| `node_modules/.bin/tsc -b --pretty false`、`git diff --check` | PASS。 |
| `npm run version:sync`、`npm run version:check` | PASS，1.15.11。 |
| `grep -nE '(/private/tmp\|/Users/\|/var/folders\|/tmp/\|process\.getuid\|sudo)'` | 新增和修改的測試、fixture 與 UI 檢查皆無命中。Chromium 採 Playwright 隨附版本，測試資料與 bundle 留在記憶體。 |
| 根目錄 `python3 scripts/check_handoff.py` | PASS，佇列 25/25 件，交接文件與週誌合規。 |

本輪以自動檢查輸出為證據，未產生截圖。若另存 2026-11-24 驗收畫面，截圖保存至 2026-12-01。

## 自修紀錄

- 獨立工作樹初跑缺少 QR 與 PDF 套件。用鎖檔從本機 npm 快取安裝，型別與打包均通過。
- 首輪假時鐘的觀測函式在 Node 轉譯後帶入瀏覽器缺少的輔助函式。改由測試 fixture 的瀏覽器 bundle 載入後，背景、併發與卸載檢查均通過。

## 交給 Antigravity 3.8

從根目錄 `handoff.md`、`CODEX_QUEUE.md` 的 #67 與本報告接手。到指定工作樹跑全套 `npm run check`、`node scripts/attendance-ui-check.mjs`，另用真實瀏覽器開投影畫面連續錄影 60 秒。使用合成或測試場次，場次須至少剩 90 秒，並讓簽到人數在錄影期間變化。若用現有 mock，可先按「延長 1 分鐘」。錄影保留在 repo 之外並記錄證據路徑。完成後只更新 #67 並附下一棒的交棒 prompt。不上傳正式學生資料、不 push、不合併 main、不部署。
