# #67 課堂點名投影即時更新 1.15.11 驗收報告（Antigravity 3.8，2026-11-24）

## 給 Claude 的摘要
- **PASS**。基準為工作樹 `.worktrees/attendance-live`（分支 `fix/attendance-live-refresh`，commit `58a2ef51`，版本 1.15.11）。
- `npm run check` PASS：前端 328/328（0 fail / 0 skipped）、前端 build PASS、後端 131/131、Functions 67 個入口、閱讀規範 17 份 4,864 畫面 0 違規。
- UI 檢查 `node scripts/attendance-ui-check.mjs` PASS：學生 34＋教師 5 畫面（共 39 畫面），8 項操作，0 failure，0 pageError。
- 真實瀏覽器 60 秒錄影：投影畫面開著放 60 秒（起始剩餘 102 秒），名單在不重新整理下由 45 增至 56 人，QR token 換段 4 次，數字碼依 18 秒換碼 3 次。
- 偏離與限制：無偏離；僅使用合成／測試資料，未碰正式資料；不 push、不合併 main、不部署。
- 可攜性：`grep -nE '(/private/tmp|/Users/|/var/folders|/tmp/|process\.getuid|sudo)'` 0 命中，腳本採 `os.tmpdir()`，無環境鎖定。
- 證據與錄影已置於 repo 外，保存至 2026-12-01；附 git bundle 供 Claude 做 Ubuntu 非 root 重播。
- 抽查 1｜投影每秒平滑倒數（1:42 → 0:42，共 60 秒），到期前不中斷。
- 抽查 2｜學生簽到名單每 5 秒隨後端回應自動更新（45/60 → 56/60），無須重新整理。
- 抽查 3｜QR 憑證 token 每 15 秒定期更換（.0. → .1. → .2. → .3. → .4.），投影 QR SVG 即時重繪。
- 抽查 4｜數字碼每 18 秒換碼（4729 → 4730 → 4731 → 4732），畫面更換倒數與後端精準吻合。
- 抽查 5｜全套測試（前端 328、後端 131）與閱讀規範（17/17 份）均維持 0 fail / 0 skipped。

## 驗收數據與執行結果

| 項目 | 執行指令／標準 | 結果 | 備註／證據路徑 |
|---|---|---|---|
| 工作目錄與分支 | `git branch --show-current` | `fix/attendance-live-refresh` | commit `58a2ef51`，基於 `origin/main`（`e08096c4`）超前 1 commit |
| 套件安裝 | `npm ci`、`npm --prefix functions ci` | PASS | 依 lockfile 乾淨安裝完成 |
| 後端函式入口檢查 | Functions build | PASS | 67 個函式入口載入通過（未連接雲端） |
| 前端單元／整合測試 | `npm test`（`tsx --test`） | PASS | 328 pass / 0 fail / 0 skipped（含 7 個假時鐘測試） |
| 前端建置與版本檢查 | `npm run build` | PASS | `version:check` 1.15.11 PASS、`tsc -b` PASS、`vite build` PASS |
| 後端測試 | `npm --prefix functions test` | PASS | 131 pass / 0 fail / 0 skipped |
| 閱讀規範全檢 | `npm run readability:check` | PASS | 17 份教材全數通過、4,864 畫面 0 違規 |
| UI 畫面與操作檢查 | `node scripts/attendance-ui-check.mjs` | PASS | 39 畫面、8 項操作通過，failures: 0，pageErrors: 0 |
| 真實瀏覽器 60 秒錄影 | `node scripts/attendance-live-record.mjs` | PASS | 影片與取樣紀錄存證於 repo 外 |
| 可攜性檢查 | `grep -nE '(/private/tmp\|/Users/\|...)'` | PASS | 0 命中，無寫死路徑 |
| Git Bundle | `git bundle create ...` | PASS | 校驗 OK，供 Ubuntu 非 root 重播 |

## 真實瀏覽器 60 秒即時更新實測紀錄

- **環境**：Playwright Chromium（1280×720 全畫面錄影）。
- **場次設定**：合成測試場次，起始剩餘時間經「延長 1 分鐘」擴展至 102 秒（>90 秒）。
- **錄影存證路徑**：`~/Documents/ChatGPT/課程平台-驗收證據/2026-11-24/attendance-live-1.15.11/attendance-live-60s.webm`（大小 2.6MB）。
- **採樣紀錄檔**：`~/Documents/ChatGPT/課程平台-驗收證據/2026-11-24/attendance-live-1.15.11/recording-log.json`。
- **保存期限**：證據與錄影保存至 **2026-12-01**。

### 取樣時序（每 5 秒紀錄）
- **t=0s**：倒數 `1:42`、數字碼 `4729`（倒數 12s 更換）、QR token `.0.`、已簽到 `45／60`
- **t=5s**：倒數 `1:37`、數字碼 `4729`（倒數 7s 更換）、QR token `.0.`、已簽到 `46／60`
- **t=10s**：倒數 `1:32`、數字碼 `4729`（倒數 2s 更換）、QR token `.1.`（換段）、已簽到 `46／60`
- **t=15s**：倒數 `1:27`、數字碼 `4730`（換碼，倒數 15s 更換）、QR token `.1.`、已簽到 `47／60`
- **t=20s**：倒數 `1:22`、數字碼 `4730`（倒數 10s 更換）、QR token `.1.`、已簽到 `48／60`
- **t=25s**：倒數 `1:17`、數字碼 `4730`（倒數 5s 更換）、QR token `.2.`（換段）、已簽到 `49／60`
- **t=30s**：倒數 `1:12`、數字碼 `4731`（換碼，倒數 18s 更換）、QR token `.2.`、已簽到 `51／60`
- **t=35s**：倒數 `1:07`、數字碼 `4731`（倒數 13s 更換）、QR token `.2.`、已簽到 `52／60`
- **t=40s**：倒數 `1:02`、數字碼 `4731`（倒數 8s 更換）、QR token `.3.`（換段）、已簽到 `52／60`
- **t=45s**：倒數 `0:57`、數字碼 `4731`（倒數 3s 更換）、QR token `.3.`、已簽到 `53／60`
- **t=50s**：倒數 `0:52`、數字碼 `4732`（換碼，倒數 16s 更換）、QR token `.3.`、已簽到 `54／60`
- **t=55s**：倒數 `0:47`、數字碼 `4732`（倒數 11s 更換）、QR token `.4.`（換段）、已簽到 `55／60`
- **t=60s**：倒數 `0:42`、數字碼 `4732`（倒數 6s 更換）、QR token `.4.`、已簽到 `56／60`

### 驗證結論
1. **即時更新性**：投影幕在 60 秒期間完全無需手動重新整理，已簽到人數由 45 增至 56 人（隨每 5 秒輪詢遞增），倒數每秒平滑遞減。
2. **安全性憑證輪換**：QR token 每 15 秒切換一次區段，QR 圖片隨之重繪；數字碼每 18 秒切換一組新 4 位碼，完全符合防止翻拍與非現場簽到的安全規範。
3. **無連線異常或畫面閃爍**：全程渲染流暢，0 頁面錯誤、0 逾時中斷。

## Git Bundle 供 Claude 覆核
- **檔案路徑**：`~/Documents/ChatGPT/課程平台-驗收證據/2026-11-24/attendance-live-1.15.11/attendance-live-58a2ef51.bundle`
- **包含 Ref**：`58a2ef51dbd1c4e1f991bd37a0b33d94eff6df11 refs/heads/fix/attendance-live-refresh`
- **基底 Ref**：`e08096c4c18856491087aced7beece37a3ffc3ae`（`origin/main`）
- **校驗狀態**：`git bundle verify` 檢查確認 OK。
