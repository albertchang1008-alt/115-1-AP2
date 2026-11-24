# #65 全套檢查實跑報告（Antigravity，2026-11-23）

## 給 Claude 的摘要
- **PASS**：全套 `npm run check` 零失敗執行通過，未更動任何程式與測試程式碼。
- 基準分支：`.worktrees/zuvio-exams`（`feature/zuvio-exams`／`86b165ee`），領先 `origin/main`（`5e649242`）12 commits，落後 0。
- 環境：macOS、Node `v22.23.2`、npm `v10.9.8`。
- 前端測試：**343/343 PASS**、0 fail、0 skipped（耗時 257.8s）。
- 後端建置與入口：67 個函式通過（未連接雲端）。
- 前端建置：`✓ built in 3.57s`，無錯誤退出。
- 後端測試：**148/148 PASS**、0 fail、0 skipped（耗時 1.16s）。
- 閱讀規範：**17/17 PASS**（17 份均 SKIP 未變更，0 fail、0 issues）。
- 總耗時：`4分33.55秒`（user 223.97s, system 51.02s）。
- 工作目錄：執行後 `git status` 保持乾淨（無未追蹤建置產物殘留）。
- 抽查 5 項：①前端 343 測試零 FAIL；②後端 148 測試零 FAIL；③Functions 67 函式載入正常；④Vite build 正常產生；⑤閱讀規範 17/17 完整通過。

---

## 一、執行環境與版本確認
- **執行時間**：2026-11-23 20:03（Asia/Taipei）
- **工作樹路徑**：`.worktrees/zuvio-exams`
- **Git Commit**：`86b165ee`（`fix(zuvio-ext): resolve V1-V3 defects and add D1 item analysis cache [Antigravity]`）
- **遠端分支比對**：
  - `git fetch origin`：完成
  - `git rev-list --count HEAD..origin/main`：`0`（未落後 `origin/main`）
- **Node / npm 版本**：`v22.23.2` / `v10.9.8`
- **套件安裝**：根目錄與 `functions/` 分別執行 `npm ci` PASS。

---

## 二、npm run check 全套執行數據

指令：`npm run check`（`npm test && npm run build && npm --prefix functions test && npm run readability:check`）

### 1. 前端測試（`npm test`）
- `tests 343`
- `suites 0`
- `pass 343`
- `fail 0`
- `skipped 0`
- `duration_ms 257825.074334`（~257.8 秒）
- 結果：**PASS**

### 2. 前端建置（`npm run build`）
- Vite build 完成：`✓ built in 3.57s`
- 狀態碼：`0`
- 結果：**PASS**

### 3. 後端編譯與測試（`npm --prefix functions test`）
- 後端編譯：`node scripts/check-runtime.cjs && tsc && node scripts/check-entry.cjs`
  - 「後端入口載入通過：67 個函式（未連接雲端）。」
- 後端測試（`node --test tests/*.test.cjs`）：
  - `tests 148`
  - `suites 0`
  - `pass 148`
  - `fail 0`
  - `skipped 0`
  - `duration_ms 1157.456167`（~1.16 秒）
- 結果：**PASS**

### 4. 閱讀規範檢查（`npm run readability:check`）
- 指令：`node --experimental-strip-types scripts/readability-check.mjs`
- 輸出：
  - `READABILITY 未變更跳過 17 份；需要檢查 0 份`
  - `{"materials":17,"pass":17,"fail":0,"skipped":17,"screens":0,"issues":0,"staticIssues":0,"errors":0}`
- 結果：**17/17 PASS**

### 5. 總耗時與資源
- `npm run check 223.97s user 51.02s system 100% cpu 4:33.55 total`
- 總執行時間：4 分 33.55 秒

---

## 三、工作目錄清潔度確認
執行完畢後 `git status` 狀態：
- 無任何建置產物、暫存檔殘留於追蹤目錄
- 狀態乾淨
