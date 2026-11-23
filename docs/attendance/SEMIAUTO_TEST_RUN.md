# 課堂點名 #67：半自動通知全套測試與 Emulator 實走報告

## 給 Claude 的摘要
- 對象：Antigravity（Gemini 3.8 Flash）｜工作樹：.worktrees/attendance（feature/attendance，50c5ead9）。
- A. 全套：npm run check 全部 PASS。前端測試 304/304 PASS、0 FAIL、0 skipped；後端測試 125/125 PASS、0 FAIL、0 skipped；attendance.test.cjs 13/13 PASS；前後端 build 與 17 份可讀性 PASS。
- B. 並行（真 Firestore 交易）：race 腳本 sawRaceWithinARound: true；但 pass: false。FAIL 原文第一行：「第 1 回合：counts {"absent":30,"present":0} 與實際 {"present":0,"absent":30} 不一致」（JSON.stringify 鍵順序比對差異，數值一致；只跑不改未修程式）。
- C. 半自動通知實走（Emulator，demo- 專案）：7/7 步驟全部 PASS。開旗標→開始點名→2生簽到(QR+碼)→結束→確認→產生草稿→標記(並行2次防重)→撤銷(草稿復原)→改準時出更正→24h逾期拒撤銷→權限與旗標防線→導師彙整與補充彙整。不寄任何信。
- D. 個人路徑：修改檔與點名程式碼 grep /Users/、/private/tmp 均 0 筆。代寄信符號 grep 0 筆。
- UI 檢查：attendance-ui-check.mjs 39 畫面 PASS（學生 34＋教師 5），0 錯誤。
- 環境：Node v22.23.2、firebase-tools 15.30.2、npm v10.9.8。
- 截圖保存至 2026-11-26（路徑：課程平台-驗收證據/2026-11-19/attendance）。
- 偏離：無修改任何專案程式碼；race 腳本鍵順序比對問題保留給 Codex 裁定修訂。
- 抽查建議：1. race 腳本 JSON.stringify 鍵比對；2. test-semiauto.mjs 7/7 實走步驟；3. attendance.test.cjs 13 支。

---

## 1. 執行環境與指令
- 工作目錄：`/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/attendance`
- 分支與 Commit：`feature/attendance`（`50c5ead9`，乾淨工作區）
- Node.js 版本：`v22.23.2`
- npm 版本：`v10.9.8`
- Firebase Tools 版本：`15.30.2`
- 證據保存路徑：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-19/attendance`（截圖保存至 2026-11-26）
- 暫時驗證腳本：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-19/attendance-semiauto/test-semiauto.mjs`

---

## 2. 全套建置與測試（`npm run check`）
執行 `npm run check`（包含前端測試、前後端建置、後端測試、可讀性檢查）：
- **後端建置**（`npm --prefix functions run build`）：PASS，載入 67 個函式。
- **前端測試**（`tsx --test --test-concurrency=2 tests/*.test.ts`）：
  - tests: **304**
  - pass: **304**
  - fail: **0**
  - skipped: **0**
- **前端建置**（`npm run version:check && tsc -b && vite build`）：PASS。
- **後端測試**（`npm --prefix functions test`）：
  - tests: **125**
  - pass: **125**
  - fail: **0**
  - skipped: **0**
- **可讀性檢查**（`npm run readability:check`）：
  - 17 份教材全部 PASS（4864 screens, 0 issues, 0 staticIssues, 0 errors）。
- **點名專屬測試**（`node --test functions/tests/attendance.test.cjs`）：
  - tests: **13**
  - pass: **13**
  - fail: **0**
  - skipped: **0**

---

## 3. UI 畫面檢查與可讀性（`attendance-ui-check.mjs`）
指令：`node scripts/attendance-ui-check.mjs --out /Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-19/attendance`
- 執行結果：
  ```json
  {
    "pass": true,
    "studentScreens": 34,
    "teacherScreens": 5,
    "checked": 39,
    "failures": [],
    "pageErrors": []
  }
  ```
- 產出截圖：共 39 張（學生端 17 畫面×預設/特大 34 張＋教師端 5 分頁），存放於證據資料夾，保存至 2026-11-26。

---

## 4. 並行測試（`attendance-emulator-race.mjs`）
指令：`npx firebase emulators:exec --only firestore --project demo-attendance-race "node scripts/attendance-emulator-race.mjs"`
- 執行結果：
  - `sawRaceWithinARound`: **true**（第 4 回合 signedOk: 28, refusedClosed: 2）
  - `pass`: **false**
  - FAIL 原文第一行：
    `第 1 回合：counts {"absent":30,"present":0} 與實際 {"present":0,"absent":30} 不一致`
  - 失敗原因分析：
    在 `scripts/attendance-emulator-race.mjs:109` 比對 `JSON.stringify(s.counts) !== JSON.stringify(actual)`，Firestore 存入之物件屬性順序為 `{"absent":..., "present":...}`，而測試腳本構造的 `actual` 物件為 `{present: ..., absent: ...}`。兩者數值完全一致（例如第 4 回合 absent 2, present 28），但因直接進行 JSON 字串全等比對導致誤判。
    依「只跑不改；失敗就記錄，不修程式」原則，未修改測試腳本，完整保留原始狀態。

---

## 5. 半自動通知 Emulator 實走測試
指令：`npx firebase emulators:exec --only firestore --project demo-attendance-semiauto "node /Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-19/attendance-semiauto/test-semiauto.mjs"`
測試步驟與結果：
1. **步驟 0**：建立示範課程、合成名冊 (3人) 與導師設定 → PASS
2. **步驟 1**：開旗標 → 開始點名 → 學生1(QR token) 與 學生2(4位數字碼) 簽到 → 結束點名 → 確認該節（未確認前無草稿）→ PASS
3. **步驟 2**：`attendanceNotifyDrafts` 檢驗：出 1 封學生3未到信；驗證內文不含「成績、分數、情緒、關心、同裝置、修改原因、裝置」等字樣；回應無 Firestore 內部欄位（如 `_ref`、`_converter`）→ PASS
4. **步驟 3**：`attendanceMarkNotified` 並行 2 次送出同一草稿（`Promise.all`）：合計 `marked=1`、`already=1`；再取草稿該信已消失；log 產生標記紀錄且 `canUndo=true` → PASS
5. **步驟 4**：`attendanceSetStatus` 把該生改準時 → 出現更正信（kind: `correction`, notifySeq: 1）；用舊 expect 標記回 `stale=1` → PASS
6. **步驟 5**：`attendanceUndoNotified` 撤銷最新一筆 → 回到待通知（學生3草稿復原）；重新標記後將資料庫 `markedAt` 改為 25 小時前，測試超過 24 小時不可撤銷，拋出「超過 24 小時，不能撤銷」預期例外 → PASS
7. **步驟 6**：權限與旗標防線：學生身分呼叫 NotifyDrafts／MarkNotified／UndoNotified 全部拋出 `permission-denied`；課程旗標關閉時全部拋出 `尚未開放此功能` → PASS
8. **步驟 7**：導師彙整：第 1 節確認但第 2 節未確認時無彙整提示（`ready: false`）；兩節皆確認後提示彙整（`ready: true`, periods: `[1, 2]`）；標記已寄後，再確認第 3 節，出補充彙整（`supplement: true`, periods: `[3]`, 主旨含「（補充）」）→ PASS
- 全程未發送任何真實郵件。

---

## 6. 個人路徑與移除項目 grep 檢驗
1. **個人路徑 grep**：
   - 指令：`git show 50c5ead9 | grep -E "^\+[^+]" | grep -E "/Users/|/private/tmp"`
   - 結果：**0 筆**。
   - 點名專屬檔案 grep（`functions/src/attendance.ts`、`src/AttendanceAdmin.tsx`、`shared/attendance.ts` 等）：**0 筆**。
2. **移除代寄信符號 grep**：
   - 指令：`grep -rn --exclude-dir=node_modules "MailApp\|appsScript\|mailerKey\|attendanceSendMail\|attendanceMailTick\|forceResend\|uncertain" functions src shared apps-script tests scripts`
   - 結果：僅在 `functions/tests/attendance.test.cjs` 內作為負例斷言驗證（確認函式不在 handler 中、設定拒絕 mailerKey），產品程式碼與設定檔中完全 **0 筆**。
