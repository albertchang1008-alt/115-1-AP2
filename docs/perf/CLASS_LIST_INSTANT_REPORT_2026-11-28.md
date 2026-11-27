# #76 班級列表與小考成績分布（1.17.5）

## 給 Claude 的摘要

- 基準 `b7228f67`（1.17.4）。實作在 `.worktrees/class-list-instant` 的 `feature/class-list-instant`。
- 班級入口修改 `src/teacherClassDirectories.ts`、`src/App.tsx`、`src/AttendanceAdmin.tsx`、`src/ZuvioExams.tsx`、`src/PlatformQuizTeacher.tsx`。
- 分數區間修改 `shared/platformQuiz.ts`、`src/platform-quiz.css` 及 `src/ZuvioExams.tsx`；另同步 13 份版號檔。
- 驗證新增 `scripts/class-list-instant-browser.mjs`、`tests/fixtures/class-list-instant-browser.tsx`、`tests/teacher-class-directories.test.ts`，更新 `tests/platform-quiz.test.ts`。
- PASS 5 項：前端相關測試 28/28、Functions 162/162、建置、版號、靜態自查。已觀察到的新程式 FAIL 為 0。
- 偏離：Mac 背景 Chrome 無法啟動。完整 `npm test` 未出總結，班級列表缺 6 個計時值，390 圖表缺動態量測與截圖。Colima 未執行。證據存於 repo 外的系統暫存目錄。
- 抽查 4 項：兩個入口的本機快取與登入預抓、選班後才發明細請求、分數邊界與換算註記、Ubuntu 390 預設／特大的五欄與字級。

## 實作

- localStorage 依教師帳號、課程和入口分鍵，只存 `classId`、`name`、`test`。無法讀寫或解析時走伺服器，成功回應仍可保留於當前頁面記憶體。空列表視為已讀取。
- 教師後台在目前課程功能開啟時，以 `requestIdleCallback`（無該 API 則用短延遲）預抓 `attendanceClassCards` 與 `zuvioClassDirectory`。入口先同步取班級快照，再於背景複查。共享同時進行的請求，欄位與排序相同時沿用既有班級陣列。點名有明確刷新需求時，會在已發出的請求之後再查一次。
- 點名的進行中狀態從伺服器回應讀取。班級明細仍在點選後由 `attendanceSessions` 或帶 `classId` 的 `zuvioListExams` 取得。
- 成績分布先將原始分數換算並四捨五入至整數，再計入 0–59、60–69、70–79、80–89、90–100 分。滿分為 0 時計入第一格；平均、中位數、最高與最低維持原始分數。圖表朗讀分數區間與人數，柱上方顯示人數，滿分非 100 時附「已換算為百分制」。
- 390 寬以五欄配置，標籤、柱上人數與註記跟隨平台字級。較窄的圖表容器會把「分」移到各標籤下一行。
- `App` 的 `initialApi` 接受合成服務以實際走教師工作空間入口。預設服務仍由 Firebase 登入流程啟動。

## 驗證

Mac 使用 Node 22.23.2。開工時本機 `origin/main` 指向 1.17.3，因此以指定 1.17.4 提交開分支。

| 指令或檢查 | 結果 |
|---|---|
| `npm test` | 環境阻擋。Functions 預先建置成功。TAP 已輸出 139 個通過、11 個 Chrome 啟動錯誤，本機已中止首輪，未有全套 TAP 總結。加時限重試輸出 21 個通過、3 個啟動錯誤後卡住。送出中斷後重試程序仍在，沙盒也拒絕終止該程序。 |
| `node_modules/.bin/tsx --test tests/attendance.test.ts tests/platform-quiz.test.ts tests/teacher-class-directories.test.ts tests/zuvio.test.ts` | PASS，28/28。含五格標籤、各邊界、59.5→60、0、100、滿分 0、合計人數、快取隔離／欄位白名單、同值保留、寫入受阻與失敗後重讀。 |
| `npm --prefix functions test` | PASS，162/162，0 skipped。 |
| `npm run build`、`npm run version:check` | PASS。TypeScript 與 Vite 成功，版本為 1.17.5。Vite 有大型 chunk 提示。工作樹內 `handoff.md` 只同步版本行。 |
| 靜態自查 | PASS。官方可讀性 CSS 掃描 11 檔、0 問題。新圖表的 6 個字級宣告均乘平台比例，防止縮小。圖表樣式 tasteskill 靜態 lint 0 FAIL／0 WARN。腳本語法與 `git diff --check` 通過。以 `grep -nE '/private/tmp\|/Users/\|/Applications/'` 檢查本件變更測試、fixture、驗證腳本，0 命中。 |
| `node scripts/class-list-instant-browser.mjs` | 環境阻擋。合成 fixture 已 bundling；系統 Chrome 啟動時 SIGABRT，Chromium headless shell 啟動時 `bootstrap_check_in` 拒絕（`Permission denied (1100)`）。在 `b7228f67` 另跑原有結果卡 Playwright 測試，重現同一權限錯誤。 |

### 班級列表計時

| 入口 | 無快取 | 有快取（≤100 ms） | 預抓完成（≤100 ms） |
|---|---|---|---|
| 點名 | 環境阻擋 | 環境阻擋 | 環境阻擋 |
| 試務中心 → 班級小考 | 環境阻擋 | 環境阻擋 | 環境阻擋 |

腳本用獨立瀏覽器工作階段、合成班級及固定 300 ms 回應延遲，自點擊側欄至第一個班級按鈕在視窗中可見計時。另驗證無快取的載入提示、背景更名時保留同一個班級按鈕、明細只在點選後發出，以及 390×844 圖表預設／特大字級、標籤同一行、柱底對齊、文字對比與換算註記。

### Ubuntu 重播與證據

Colima 停止中，尚待 Ubuntu 24.04 非 root、Node 22、系統 Chrome 重播。請備妥依賴，確認 1.17.5 後執行下列指令，將計時值及 390 動態結果寫入 Claude 裁定。

```sh
npm test
npm --prefix functions test
npm run build
npm run version:check
CHROME_PATH="$(command -v google-chrome)" node scripts/class-list-instant-browser.mjs
```

本機證據目錄為 `/var/folders/yj/vdv7pq_j6q1c696kx53s9nmc0000gp/T/ap2-class-list-instant.nomZSI`。內有 `npm-test.log`、`suite-force-exit.log`、`functions-direct.log`、`related.log`、`build-final.log`、`browser.log`、`baseline-chrome.log`。同目錄的 `class-list-instant.bundle` 包含 1.17.4 基準與 1.17.5。以含有 `ca40f51c` 及其祖先 `48a112d0` 的 repo 執行 `git bundle verify`。這輪未產生截圖。若同日補跑，截圖保存至 2026-12-05。

`prune-evidence.py` dry-run 列出 2026-11-20 到期證據 71.149 MB。依夜間鐵則保留工作樹外證據。
