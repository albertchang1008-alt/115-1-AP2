# 閱讀規範跳過未變更教材測試報告（2026-11-17，Antigravity）

## 給 Claude 的摘要
- 測試分支：`perf/readability-incremental`（worktree `.worktrees/readability-incremental`），基準 commit `8cab59e7`。
- 環境：macOS 26.7.1 (darwin-arm64, Apple Silicon)、Google Chrome 157.0.8103.79、Node.js v26.13.1、npm 11.20.0。
- 第 1 步：提交 Claude 修正（F1、S1、S2）為 commit `19085f4a`。
- 第 2 步 `npm ci`：根目錄 11.9s、functions 1.8s，PASS。
- 第 3 步 `npm run readability:record`：17:43.54（320.82s user, 72.64s sys），17/17 PASS（4864 screens, 0 issues）；`scripts/readability-cache.json` 正確寫入 `environment` 欄位（darwin-arm64, Chrome 157.0.8103.79）；單獨提交為 commit `f42d4d70`。
- 第 4 步 `npm run check`：4:34.90（213.20s user, 53.75s sys），整套測試全過（前端 300+ 支、後端 112 支、build PASS）；閱讀規範印出「未變更跳過 17 份；需要檢查 0 份」，`tests/readability-cache.test.ts` 8/8 PASS（含「檢查模式不寫專案內的檔」）；跑完 `git status` 乾淨。
- 第 5 步 F1 驗證：在 git 忽略的 `materials-src/airway-structure/shots/` 加入測試檔，跑 `npm run readability:check` 仍跳過 17 份，刪檔後 `git status` 乾淨，PASS。
- 判定：**全部步驟 PASS**。

---

## 一、測試環境資訊
- 作業系統：macOS 26.7.1 (darwin-arm64)
- 瀏覽器：Google Chrome 157.0.8103.79
- 執行環境：Node.js v26.13.1、npm 11.20.0
- 工作分支：`perf/readability-incremental`（worktree `.worktrees/readability-incremental`）

---

## 二、各步驟執行紀錄

### 步驟 1：提交 Claude 審查修正
確認 `git status` 僅包含 Claude 之修改檔案（`scripts/lib/readability-cache.mjs`、`.d.mts`、`scripts/readability-check.mjs`、`scripts/readability-check.d.mts`、`tests/readability-cache.test.ts`、兩份文件），合併為一個 commit：
- Commit SHA: `19085f4a`
- Commit Message: `fix(check): 指紋只算 git 追蹤檔、記錄環境、補不寫檔測試 [Claude]`

### 步驟 2：套件安裝（`npm ci`）
- 根目錄 `npm ci`：耗時 11.91 秒（added 168 packages, audited 169 packages, 0 errors）
- `functions/` 目錄 `npm ci`：耗時 1.84 秒（added 267 packages, audited 268 packages, 0 errors）
- 結果：PASS

### 步驟 3：重建通過紀錄（`npm run readability:record`）
因為 F1 修正指紋計算方式，共用指紋更新，17 份教材重新完整度量：
- 輸出：`READABILITY 未變更跳過 0 份；需要檢查 17 份 （檢查程式、平台播放器或共用檔有變更，全部重新檢查）`
- 度量結果：17 份全數 PASS（4,864 個畫面，0 issues，0 errors）
- 耗時：17 分 43.54 秒（17:43.54，user: 320.82s, sys: 72.64s）
- 紀錄檔核對：`scripts/readability-cache.json` 包含預期之環境欄位：
  ```json
  "environment": {
    "platform": "darwin-arm64",
    "chrome": "157.0.8103.79"
  }
  ```
- 單獨提交 commit：
  - Commit SHA: `f42d4d70`
  - Commit Message: `chore(check): 重建閱讀規範通過紀錄（Mac）[Antigravity]`

### 步驟 4：整套檢查（`npm run check`）
- 執行指令：`npm run check`（`npm test && npm run build && npm --prefix functions test && npm run readability:check`）
- 前端單元與整合測試：全過
- Functions build 與 112 支測試：全過（0 fail, 0 skipped）
- Vite 前端 build：PASS
- `tests/readability-cache.test.ts`：8/8 PASS（含「檢查模式不寫專案內的檔」）
- 閱讀規範檢查輸出：
  ```text
  READABILITY 未變更跳過 17 份；需要檢查 0 份 
  READABILITY airway-structure SKIP 未變更（內容與檢查程式都和上次通過時相同）
  ...（其餘 16 份皆 SKIP）
  {"materials":17,"pass":17,"fail":0,"skipped":17,"screens":0,"issues":0,"staticIssues":0,"errors":0}
  ```
- 整套耗時：4 分 34.90 秒（04:34.90，user: 213.20s, sys: 53.75s）
- 對比原本每次部署 24–30+ 分鐘，顯著節省約 20 分鐘。
- 檢查後工作目錄狀態：`nothing to commit, working tree clean`（未產生或污染任何檔案）。

### 步驟 5：F1 驗證（git 忽略目錄隔離測試）
- 在 `materials-src/airway-structure/shots/` 下新增檔案 `dummy-f1-test.txt`（確認被 `.gitignore` 忽略）。
- 執行 `npm run readability:check`：輸出 `READABILITY 未變更跳過 17 份；需要檢查 0 份`，證實 git 忽略目錄中的檔案變動不會使指紋失效。
- 刪除測試檔案後再次確認 `git status`，工作目錄保持乾淨。
- 結果：PASS

### 步驟 6：`readability:all`
依指示省略（耗時等同步驟 3 之 17:43.54）。

---

## 三、結論與建議
1. 閱讀規範檢查「未變更跳過」機制在 Mac 上實測完全正常，整套 `npm run check` 時間從 24~30 分鐘降至 4.5 分鐘。
2. F1、S1、S2 驗證全數通過，快取比對準確且檢查模式零寫檔。
3. 建議交付 Claude（Opus）進行部署前最後驗收。
