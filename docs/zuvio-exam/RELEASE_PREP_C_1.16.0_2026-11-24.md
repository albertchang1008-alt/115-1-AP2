# 1.16.0 上線準備 C 段（#65／#68b）

## 給 Claude 的摘要

- 合併 `71a232df` 的父提交為 A／B 後的 `6050421e` 與 `origin/main` 的 `bb8038b1`（1.15.11）。平台版本維持 1.16.0。
- #68b PASS。修改 `scripts/lib/readability-cache.mjs`、`tests/readability-cache.test.ts`，重建 `scripts/readability-cache.json`。README／TXT 編輯與共用 CSS／JS 編輯均通過回歸測試。17 份個別指紋一致。快取 common `5bcd7db0…` → `7a9149de…`，提交後重查跳過 17 份、檢查 0 份。
- 夾具 PASS。`tests/fixtures/zuvio-browser-fixture.tsx`、`scripts/zuvio-browser-e2e.mjs` 驗證刪除前看得到匯入提示，刪除及清理後 DOM 已移除提示。12 張 PNG 的 SHA-256 與 manifest 相符。
- Mac PASS。前端 360/360、後端 157/157、教材 17/17（4,864 個量測畫面）。全套 0 fail、0 skipped，`version:check` 為 1.16.0。
- 1.15.11 發布門檻 PASS（Actions #99 的 build 與 deploy 均成功）。Ubuntu 非 root 尚待 Claude 重播。Firestore 索引與 test 課實際流程仍由教師處理。
- 抽查：① 合併父提交與版本。② README／TXT 與 CSS／JS 共用指紋測試。③ 全量與快取命中輸出。④ 合成 e2e 的提示框斷言與 06–08 manifest。⑤ bundle ref 與 Actions #99。

## 同步 1.15.11

`git fetch origin main` 後，`FETCH_HEAD` 與 `origin/main` 都是 `bb8038b182dc2284c3f02f5d2d6cdfe9a9959c2a`。工作樹原先乾淨，分支為 `feature/zuvio-exams`。合併時 13 檔衝突均落在版本行，保留 1.16.0 並留下自動合併的其餘內容。以 `git diff` 確認點名元件、點名夾具及測試與 `bb8038b1` 一致。A／B 報告及覆核沿用原存證。

教師已完成 Functions 部署。GitHub Actions #99 於台灣時間 14:16:12 對 `main` 的 `bb8038b1` 結束，workflow 結果 `success`。`build`（含 `npm run check`）及 `deploy` 均成功。 [GitHub Actions #99](https://github.com/albertchang1008-alt/115-1-AP2/actions/runs/45336012030)

## #68b 共用教材指紋

`public/materials/` 根目錄的 Markdown 與純文字說明（`.md`、`.markdown`、`.txt`）只供維護者閱讀，播放器載入的現有共用檔為 `readability-overlay.css` 與 `course-learning.js`。只在共用根目錄檔案清單排除這些說明，保留共用 CSS、JS 及其他資產的內容雜湊、個別教材規則、checker／platform closure、檢查時檔案追蹤、靜態檢查及量測門檻。

| 位置 | common SHA-256 |
|---|---|
| 重建前已提交的快取 | `5bcd7db0e141b1e0113ced1e0f75db3e34af784c8aa4b12160a8ba800a1155d9` |
| 併入 main 後、套用 #68b 前實算 | `8cf9799ec98ed50544af68151668c4dd267cc656f7d85894c2b52fffd1de7f5f` |
| 套用 #68b 後實算，與重建後已提交的快取相同 | `7a9149de1fcbac00254e999b78706554136e05e36a6714ddc2b73598cbcd8b87` |

共用檔計數 35 → 34。17 份個別教材指紋與舊快取逐份一致。共用雜湊也納入 checker 本身，因此本次修正須重新量測並產生通過紀錄。

Mac 在全量 `npm run check` 通過後，以 `npm run readability:record` 再量測 17 份，快取記入 macOS arm64／Chrome 158.0.8127.37 並提交於 `166f1607`。提交後再次執行 `npm run readability:check`，原始摘要如下。

```text
# npm run check
READABILITY 未變更跳過 0 份；需要檢查 17 份 （檢查程式、平台播放器或共用檔有變更，全部重新檢查）
{"materials":17,"pass":17,"fail":0,"skipped":0,"screens":4864,"issues":0,"staticIssues":0,"errors":0}
```

```text
# npm run readability:record
READABILITY 未變更跳過 0 份；需要檢查 17 份 （檢查程式、平台播放器或共用檔有變更，全部重新檢查）
READABILITY 已更新通過紀錄 scripts/readability-cache.json（請一併 commit）
{"materials":17,"pass":17,"fail":0,"skipped":0,"screens":4864,"issues":0,"staticIssues":0,"errors":0}
```

```text
# npm run readability:check（快取提交後）
READABILITY 未變更跳過 17 份；需要檢查 0 份
{"materials":17,"pass":17,"fail":0,"skipped":17,"screens":0,"issues":0,"staticIssues":0,"errors":0}
```

## 提示框與瀏覽器回歸

本次 Zuvio 變更限於夾具和 e2e。合成 API 完成刪除或清理後清空上一個通知。e2e 先確認「成績已匯入」可見，再斷言刪除與清理兩步驟後通知元素均已移除。e2e 支援用 `CHROME_PATH` 指定系統 Chrome。預設先嘗試 Chrome channel，再使用 Playwright Chromium。

Node 22.23.2 於乾淨的 `f5817ac0` 執行 `node scripts/zuvio-browser-e2e.mjs --out <證據路徑>`，manifest 為 `summary.pass: true`、`worktreeDirty: false`。06／07／08 雜湊互異，12 張 PNG 重算 SHA-256 均相符。甲表平均 21.1、SD 5.23，五種情緒選項通過比對。390×844 預設量測題幹 21px、說明與選項 18px、最小按鈕高 82px，無水平溢出。截圖只作自動存證，保存至 2026-12-01。

## 可攜性與 Ubuntu 重播

- Mac arm64、Node 22.23.2、非 root（UID 502）。初次用受限 shell 嘗試直接執行 tsx，IPC socket 回報 EPERM。正式全套與瀏覽器驗證使用可建立本機 socket 的執行環境。
- 對 `6050421e..f5817ac0` 新增或修改的 8 份 `scripts/`／`tests/` 程式，以 `grep -nHE '/Users/|/private/tmp|/var/folders/|/home/HHC/' <檔案>` 自查，0 命中。暫存由 `os.tmpdir()`／`RUNNER_TEMP` 或命令參數指定。
- repo 外證據目錄為 `課程平台-驗收證據/2026-11-24/zuvio-1.16.0-release-prep-c/`。內含全套檢查、重建、命中、版本與 Zuvio e2e 日誌、教材摘要、Actions 狀態及 `zuvio-1.16.0-c.bundle`。
- Bundle 包含 `refs/heads/feature/zuvio-exams`，以 `bb8038b1` 的完整歷史為基礎。`git bundle verify` 列出的另三個前置提交 `bff2281a`、`5e649242`、`e08096c4` 都是 `bb8038b1` 的祖先。在具備該歷史的獨立 repo 驗證 bundle，再以 `git fetch <bundle> refs/heads/feature/zuvio-exams` 與 `git switch --detach FETCH_HEAD` 取出待驗版本。
- Ubuntu 非 root 以 Node 22、系統 Google Chrome，先跑 `npm ci` 和 `npm ci --prefix functions`，再跑 `READABILITY_ALL=1 npm run check` 驗證全部教材、`npm run readability:check` 驗證快取、`npm run version:check`，以及上述合成 e2e。交回前核對 worktree 乾淨。
