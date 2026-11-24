# #65 全套測試實跑報告 R6（Antigravity，2026-11-23）

## 給驗證者的摘要
- **PASS**：全套檢查零失敗通過，未改任何程式或測試，未升版本。
- 基準分支：`.worktrees/zuvio-exams`（`feature/zuvio-exams`／`a7dcb3a1`），版本 `1.15.9`。
- 環境：macOS、Node `v22.23.2`、npm `v10.9.8`；以 `set -o pipefail` 執行。
- 前端測試：**347/347 PASS**、0 fail、0 skipped（耗時 259.9s）。
- 後端測試：**155/155 PASS**、0 fail、0 skipped（耗時 1.27s）。
- 後端入口：載入通過 67 個函式（未連接雲端）。
- 前端建置：`npm run build` PASS（`✓ built in 3.56s`）。
- 閱讀規範：`npm run readability:check` PASS（17 份均 SKIP 未變更，0 fail、0 issues、0 staticIssues）。
- 可攜性 grep：變更之測試、腳本與程式碼無 `/Users/`、`/private/tmp`（**0 命中**）。
- 完整 Log：已記錄於 repo 外 `/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r6/npm-run-check.log`（截圖／日誌保存至 2026-11-30）。
- 抽查 5 項：①前端 347/347 PASS；②後端 155/155 PASS；③Functions 67 函式載入；④閱讀規範 17/17 零 issue；⑤路徑 grep 0 命中。

---

## 一、執行環境與版本檢查
- **執行時間**：2026-11-23 23:09（Asia/Taipei）
- **工作樹路徑**：`.worktrees/zuvio-exams`
- **Git Commit**：`a7dcb3a1`（`fix(zuvio-ext): add cleanupOnly mode for safe pendingCleanup retry [Antigravity]`）
- **Node / npm 版本**：`v22.23.2` / `v10.9.8`
- **版本檢查**（`npm run version:check`）：
  - 輸出：`版本一致：1.15.9`
  - 結果：**PASS**

---

## 二、npm run check 全套數據

指令：`set -o pipefail && npm run check 2>&1 | tee /Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r6/npm-run-check.log | tail -40`

### 1. 前端測試（`npm test`）
- `tests 347`
- `pass 347`
- `fail 0`
- `skipped 0`
- `duration_ms 259860.717542`（~259.9 秒）
- 結果：**PASS**

### 2. 前端建置（`npm run build`）
- Vite build 完成：`✓ built in 3.56s`
- 結果：**PASS**

### 3. 後端編譯與測試（`npm --prefix functions test`）
- 後端編譯：`node scripts/check-runtime.cjs && tsc && node scripts/check-entry.cjs`
  - 「後端入口載入通過：67 個函式（未連接雲端）。」
- 後端測試（`node --test tests/*.test.cjs`）：
  - `tests 155`
  - `pass 155`
  - `fail 0`
  - `skipped 0`
  - `duration_ms 1271.981625`（~1.27 秒）
- 結果：**PASS**

### 4. 閱讀規範檢查（`npm run readability:check`）
- 指令：`node --experimental-strip-types scripts/readability-check.mjs`
- 輸出：
  - `READABILITY 未變更跳過 17 份；需要檢查 0 份`
  - `{"materials":17,"pass":17,"fail":0,"skipped":17,"screens":0,"issues":0,"staticIssues":0,"errors":0}`
- 數據：
  - `materials`: 17
  - `pass`: 17
  - `fail`: 0
  - `skipped`: 17
  - `issues`: 0
  - `staticIssues`: 0
- 結果：**17/17 PASS**

---

## 三、可攜性路徑自查（grep）
- 指令：`git diff --name-only origin/main HEAD | grep -E '\.(ts|tsx|js|cjs|mjs|py|json|css|csv)$' | xargs grep -En "(/Users/|/private/tmp)"`
- 結果：**0 命中**（無硬編碼本機 macOS 或私有暫存路徑）。

---

## 四、證據儲存與保存期限
- **完整執行 Log**：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r6/npm-run-check.log`
- **保存期限**：依固定決策鐵則 13、14，證據保存 7 天至 **2026-11-30**。
