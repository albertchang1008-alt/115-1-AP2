# 課堂點名 #67：半自動通知全套測試與 Emulator 實走報告（第二輪）

## 給 Claude 的摘要
- 對象：Antigravity（Gemini 3.8 Flash）｜工作樹：.worktrees/attendance（feature/attendance，b0915d02）。
- A. 全套：全部 PASS。前端測試 304/304 PASS、0 FAIL、0 skipped；後端測試 129/129 PASS、0 FAIL、0 skipped；attendance.test.cjs 17/17 PASS；前後端 build（67 函式）與 17 份可讀性 PASS。UI 檢查 39 畫面與 6 組功能全 PASS。
- B. 並行（真 Firestore 交易）：race 腳本 **pass: true** 且 **sawRaceWithinARound: true**（第 4 回合 signedOk: 28, refusedClosed: 2，counts absent: 2, present: 28），6×30 人，failures 與 warnings 均為 0。
- C. 半自動通知實走（Emulator，demo- 專案）：7/7 步驟全部 PASS。開旗標→開始點名→2生簽到(QR+碼)→結束→確認→產生草稿→標記(並行2次防重)→更正信與舊expect回stale→撤銷(草稿復原)→24h逾期拒撤銷→權限與旗標防線→導師彙整(無提示/全確認提示/含#索引logId撤銷與復原/補充彙整只含新節次)。
- D. 個人路徑：本次修改檔與點名專屬程式碼 grep 0 筆。全目錄既有命中 11 筆（未修改之歷史腳本與舊測試），分界清楚。代寄信符號 grep 0 筆。
- 未測項與原因：無（全依交辦規範實跑通過）。
- 環境：macOS、Node v22.23.2、firebase-tools 15.36.0、npm v10.9.8。
- 截圖保存至 2026-11-30（路徑：repo 外證據資料夾）。
- 抽查建議：1. race 第 4 回合並行紀錄；2. 導師彙整 #索引 logId 撤銷流程；3. attendance.test.cjs 17 支。

---

## 1. 執行環境與指令
- 工作目錄：`/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/attendance`
- 分支與 Commit：`feature/attendance`（`b0915d02`）
- Node.js 版本：`v22.23.2`（透過 nvm 切換）
- npm 版本：`v10.9.8`
- Firebase Tools 版本：`15.36.0`
- 證據保存路徑：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/attendance-semiauto-2`（截圖保存至 2026-11-30）
- 暫時驗證腳本：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/attendance-semiauto/test-semiauto.mjs`

---

## 2. 全套建置與測試（階段 A）
1. **後端建置**（`npm --prefix functions run build`）：
   - PASS，載入 67 個函式（未連接雲端）。
2. **點名專屬後端測試**（`node --test functions/tests/attendance.test.cjs`）：
   - 17 tests、17 pass、0 fail、0 skipped。
   - 包含 Codex 審查新增的 4 支回歸測試：
     - 仍在點名中的節次阻擋導師提示，試簽不影響
     - 學生舊通知不顯示撤銷，最新通知在 24 小時邊界仍可撤銷且序號不退
     - 導師撤銷綁定單次標記；舊分頁與並行雙按不可撤銷另一筆
     - 導師標記交易內重讀節次，並行取消確認回 stale 且不寫通知
3. **全套檢查**（`npm run check`）：
   - 前端測試（`tsx --test --test-concurrency=2 tests/*.test.ts`）：304 tests、304 pass、0 fail、0 skipped。
   - 前端建置（`npm run version:check && tsc -b && vite build`）：PASS（版本 1.15.8）。
   - 後端全套測試（`npm --prefix functions test`）：129 tests、129 pass、0 fail、0 skipped。
   - 可讀性檢查（`npm run readability:check`）：17 份教材全 PASS（4864 screens、0 issues、0 staticIssues、0 errors）。
4. **UI 畫面與功能檢查**（`node scripts/attendance-ui-check.mjs`）：
   - PASS。學生端 34 畫面（17 畫面×預設/特大）＋教師端 5 分頁＝39 畫面全數檢查通過。
   - 6 組功能驗證全數通過：`copy-clipboard, gmail, 44px`、`copy-reject, gmail, 44px`、`copy-missing, gmail, 44px`、`control-enabled`、`control-disabled`、`control-preview`。
   - failures: 0、pageErrors: 0。

---

## 3. 真 Firestore Emulator 並行交易測試（階段 B）
指令：
```bash
npx firebase emulators:exec --only firestore --project demo-attendance-race "node scripts/attendance-emulator-race.mjs"
```
執行結果：
- `pass`: **true**
- `sawRaceWithinARound`: **true**
- `source`: Firestore Emulator 127.0.0.1:8080（demo-attendance-race）
- `rounds`: 6，每回合 30 人
- 回合明細：
  - Round 1 (delay 0ms): signedOk 0, refusedClosed 30, counts `{ absent: 30, present: 0 }`
  - Round 2 (delay 15ms): signedOk 30, refusedClosed 0, counts `{ absent: 0, present: 30 }`
  - Round 3 (delay 30ms): signedOk 30, refusedClosed 0, counts `{ absent: 0, present: 30 }`
  - Round 4 (delay 45ms): **signedOk 28, refusedClosed 2, counts `{ absent: 2, present: 28 }`**（精確捕捉同回合內並行競爭）
  - Round 5 (delay 60ms): signedOk 30, refusedClosed 0, counts `{ absent: 0, present: 30 }`
  - Round 6 (delay 75ms): signedOk 30, refusedClosed 0, counts `{ absent: 0, present: 30 }`
- `failures`: []
- `warnings`: []

---

## 4. 半自動通知 Emulator 實走測試（階段 C）
指令：
```bash
npx firebase emulators:exec --only firestore --project demo-attendance-semiauto "node /Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/attendance-semiauto/test-semiauto.mjs"
```
實走測試步驟與結果：
1. **步驟 0**：建立示範課程、合成名冊 (3人) 與導師設定 → **PASS**。
2. **步驟 1**：開旗標 → 開始點名 → 學生1(QR)與學生2(數字碼)簽到 → 結束 → 確認該節（未確認前無學生草稿且提示 1 節未確認）→ **PASS**。
3. **步驟 2**：`attendanceNotifyDrafts` 檢驗：出 1 封學生3未到信（收件人 `student3@example.edu`，expect `{status: 'absent', notifySeq: 0}`）；內文無「成績、分數、情緒、關心、同裝置、修改原因、裝置」禁止字樣；回應無 Firestore 內部欄位（`_ref`、`_converter`）→ **PASS**。
4. **步驟 3**：`attendanceMarkNotified` 同一草稿並行 2 次送出（`Promise.all`）：合計 `marked=1`、`already=1`；再取草稿該信消失；log 出現標記且 `canUndo=true` → **PASS**。
5. **步驟 4**：`attendanceSetStatus` 把該生改準時 → 出現更正信（kind: `correction`, expect: `{notifySeq: 1, status: 'present'}`）；用舊 expect 標記回 `stale=1`；改回 absent 準備步驟 5 → **PASS**。
6. **步驟 5**：`attendanceUndoNotified` 撤銷最新一筆 → 回到待通知（草稿重新出現）；重新標記後將 Firestore 紀錄之 `markedAt` 改為 25 小時前，測試超過 24 小時不可撤銷，拋出「超過 24 小時，不能撤銷」預期例外 → **PASS**。
7. **步驟 6**：權限與旗標防線：學生身分呼叫 NotifyDrafts／MarkNotified／UndoNotified 全部拋出 `permission-denied`；課程旗標 attendance 關閉時全部拋出 `尚未開放此功能` → **PASS**。
8. **步驟 7**：導師彙整與撤銷：
   - 開啟第 2 節並 end（未 confirm）：同班兩節只確認一節時無彙整提示（`ready: false`，提示 1 節未確認）→ PASS。
   - 確認第 2 節：兩節都確認後提示彙整（`ready: true`, `supplement: false`, `periods: [1, 2]`）→ PASS。
   - 標記導師彙整已寄：log.id 含有 `#索引`（格式如 `digest__...#0`）且 `canUndo=true` → PASS。
   - 撤銷導師彙整：傳入含 `#索引` 的 log.id 呼叫 `attendanceUndoNotified` 成功撤銷，草稿重新回到 ready 狀態；重新標記已寄 → PASS。
   - 確認第 3 節：出「（補充）」且只含新節次（`ready: true`, `supplement: true`, `periods: [3]`, 主旨含「（補充）」）→ PASS。

全程僅使用合成資料（`example.edu`、`demo-` 專案），未寄發任何真實郵件。

---

## 5. 路徑與代寄信 grep 自查（階段 D）
1. **個人路徑 grep**：
   - 本次點名相關檔案（`functions/src/attendance.ts`、`shared/attendance.ts`、`src/AttendanceAdmin.tsx`、`src/AttendancePendingBadge.tsx`、`src/TeachingControl.tsx`、`functions/tests/attendance.test.cjs`、`tests/attendance.test.ts`、`scripts/attendance-emulator-race.mjs`、`scripts/attendance-ui-check.mjs`）：**0 筆**。
   - 全目錄 grep `grep -rnE "/Users/|/private/tmp" functions/src src shared scripts tests`：命中既有 **11 筆**，均為未修改之歷史檔案（`micro-immuno-report.py`、`prune-evidence.py`、`preview-status-verify.mjs`、`content-browser-check.mjs`、`classroom-reveal-verify.mjs`、`fluid-content.py`、`urinary-content-audit.mjs`、`micro-immuno-figures.py`、`apply-final-ui.test.mjs`），無新增個人路徑。
2. **移除代寄信符號 grep**：
   - 產品程式碼與設定檔（`functions/src`、`src`、`shared`、`apps-script`、`scripts`）：**0 筆**。
   - 僅在 `functions/tests/attendance.test.cjs` 內保留負例斷言（驗證 callable 拒絕 mailerKey 與舊端點不存在）。
