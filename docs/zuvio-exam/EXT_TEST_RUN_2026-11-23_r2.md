# #65 全套檢查實跑報告 R2（Antigravity，2026-11-23）

## 給驗證者的摘要
- **PASS**：全套檢查零失敗通過，未更動任何程式、測試、題庫或教材，未升版本。
- 基準分支：`.worktrees/zuvio-exams`（`feature/zuvio-exams`／`f43f596a`），版本 `1.15.9`。
- 環境：macOS、Node `v22.23.2`、npm `v10.9.8`；以 `set -o pipefail` 執行。
- `version:check`：**PASS**（版本一致：1.15.9）。
- 前端測試：**344/344 PASS**、0 fail、0 skipped（耗時 261.6s）。
- 前端建置：`✓ built in 3.35s`，狀態碼 0。
- 後端建置與入口：67 個函式載入通過（未連接雲端）。
- 後端測試：**151/151 PASS**、0 fail、0 skipped（耗時 1.13s）。
- 閱讀規範：**17/17 PASS**（17 份均 SKIP 未變更，0 fail、0 issues、0 staticIssues）。
- 可攜性 grep：變更之程式／測試／腳本無 `/Users/`、`/private/tmp`（**0 命中**）。
- 完整 Log：已記錄於 repo 外 `/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r2/npm-run-check.log`（截圖／日誌保存至 2026-11-30）。
- 抽查 5 項：①前端 344/344 PASS；②後端 151/151 PASS；③Functions 67 函式載入；④閱讀規範 17/17 零 issue；⑤路徑 grep 0 命中。

---

## 一、執行環境與版本檢查
- **執行時間**：2026-11-23 20:50（Asia/Taipei）
- **工作樹路徑**：`.worktrees/zuvio-exams`
- **Git Commit**：`f43f596a`（`fix(zuvio-ext): fix V2 open/archive race, V3 partial selection, and D1 tx consistency [Antigravity]`）
- **Node / npm 版本**：`v22.23.2` / `v10.9.8`
- **版本檢查**（`npm run version:check`）：
  - 輸出：`版本一致：1.15.9`
  - 結果：**PASS**

---

## 二、npm run check 全套數據

指令：`set -o pipefail && npm run check 2>&1 | tee /Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r2/npm-run-check.log`

### 1. 前端測試（`npm test`）
- `tests 344`
- `pass 344`
- `fail 0`
- `skipped 0`
- `duration_ms 261580.8815`（~261.6 秒）
- 結果：**PASS**

### 2. 前端建置（`npm run build`）
- Vite build 完成：`✓ built in 3.35s`
- 結果：**PASS**

### 3. 後端編譯與測試（`npm --prefix functions test`）
- 後端編譯：`node scripts/check-runtime.cjs && tsc && node scripts/check-entry.cjs`
  - 「後端入口載入通過：67 個函式（未連接雲端）。」
- 後端測試（`node --test tests/*.test.cjs`）：
  - `tests 151`
  - `pass 151`
  - `fail 0`
  - `skipped 0`
  - `duration_ms 1125.058541`（~1.13 秒）
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
- **完整執行 Log**：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r2/npm-run-check.log`
- **保存期限**：依固定決策鐵則 13、14，證據保存 7 天至 **2026-11-30**。
