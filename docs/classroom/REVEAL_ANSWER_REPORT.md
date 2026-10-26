# 課堂互動「公佈答案」與學生回饋（甲案）完成報告

## 給 Codex 的摘要
- **結論**：佇列 `#37` 課堂互動「公佈答案」與學生回饋（甲案）全數依規格 1–8 完成實作與驗證（版本 `1.11.0`，分支 `feature/classroom-reveal`）。
- **核心變更**：
  1. `shared/classroom.ts`：新增 `AnswerKeys`/`RoundReveal`/`RoundJudgement`/`StudentHistoryItem` 型別、`validateAnswerKeys`（choice/order 驗證與解析 ≤300 字）、`judgeResponses`、`studentPromptRound`/`studentResultsRound`。
  2. `functions/src/classroom.ts` & `functions/src/index.ts`：`answerKeys` 獨立存於 `courses/{c}/classroomConfig/answerKeys`；`controlClassroomInteraction` 支援 `action: 'reveal'`（僅限 `closed`、公佈時寫入 `round.reveal` 快照、具冪等性）；`getClassroomInteraction` 在 reveal 前絕不回傳答案／解析／判定；新增 `studentClassroomHistory`（56 個雲端函式）。
  3. `src/ClassroomInteraction.tsx` & `src/style.css`：教師端新增「設定答案與解析」JSON 編輯器與收題後「公佈答案／已公佈」按鈕；學生端新增 `StudentRevealFeedback`（含排序逐步 ✓/✗）與 `StudentClassroomHistory`（「課堂互動紀錄」面板）。
  4. 私有套件同步：產出 `review-all.answerKeys.json`（8 題，解析逐字取自核定大綱答案頁），更新 `rehearsal.html`、`merge-interactions.html`、`START_HERE.md`、`RUN_SHEET.md`、`TEACHER_CLASSROOM_STEPS.md`。
- **測試結果**：`npm run check` 全數通過（前端與全量驗證 236 項 `0 fail / 0 skipped`，後端 `functions` 78 項 `0 fail / 0 skipped`），另完成真實 Firestore Emulator 完整一輪驗證。
- **證據路徑**：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal/`（含 1440px/390px 教師與學生三態、排序回饋、互動紀錄、彩排頁、合併工具共 16 張截圖與 `emulator-roundtrip.json`、`ui-verification.json`，保留至 `2026-11-02`）。

---

## 一、規格 1–8 實作與驗證對照

| 規格項目 | 實作檔案与設計要點 | 驗證方式與結果 |
|---|---|---|
| **1. 後端答案設定 `answerKeys`（與題目分開）** | - 儲存路徑：`courses/{c}/classroomConfig/answerKeys`<br>- 結構：`{ answerKeys: { [slideId]: { [fieldId]: { answer, explanation? } } } }`<br>- `firestore.rules` 維持預設 `allow read, write: if false;`，學生端無法直讀 Firestore | `tests/classroom.test.ts`、`functions/tests/classroom.test.cjs`：驗證合法與非法 `slideId`/`fieldId`、choice/order 規則、300 字上限與無 `undefined` 屬性 |
| **2. 教師設定頁與工具** | - `ClassroomConfigEditor` 新增「設定答案與解析」`<details>` 區塊與 `保存答案與解析`<br>- `classroomInteractionReport` 計算 `hasAnswerKey`，無答案鍵之題目不顯示「公佈答案」按鈕 | `scripts/classroom-reveal-verify.mjs`：驗證 `NO-KEY-SLIDE` 收題後不顯示「公佈答案」，有答案鍵之題目正常顯示 |
| **3. 教師「公佈答案」動作（reveal）** | - `controlClassroomInteraction` 新增 `action: 'reveal'`<br>- 僅允許在 `round.status === 'closed'` 時執行；未收題呼叫拋出 `failed-precondition`<br>- 公佈時將當下 `answerKeys[round.slideId]` 快照寫入 `round.reveal = { revealedAt, key }`，具備冪等性且不受事後修改 `answerKeys` 影響 | `functions/tests/classroom.test.cjs` 與 `verify-classroom-reveal-emulator.cjs`：驗證 open 狀態拒絕 reveal、重複 reveal 冪等、事後修改 `answerKeys` 不改變已公佈場次快照 |
| **4. 學生端即時回饋** | - **公佈前（open 或 closed 未 reveal）**：`getClassroomInteraction` 經 `studentPromptRound`/`studentResultsRound` 剝離所有答案資訊；已送出學生顯示「`已送出，等待老師公佈答案`」<br>- **公佈後（closed 且有 reveal）**：回傳 `reveal` 與 `judgement`；單選題顯示選項 `✓`/`✗`、正解、解析與全班分佈；排序題顯示第 1..N 步逐項 `✓`/`✗` 與完整正確順序；未作答學生顯示「未作答」、正解、解析與全班分佈（不標個人對錯） | 負向測試確認 reveal 前 JSON 不含 `reveal`/`answer`/`explanation`/`judgement`；Playwright 1440px/390px 驗證未作答／答對／答錯三態與排序逐步回饋 |
| **5. 學生「課堂互動紀錄」頁** | - 新增 Callable `studentClassroomHistory`：篩選該生 `classId` 且 `status === 'closed' && Boolean(r.reveal)` 之場次，依 `openedAt` 時間順序排列，合併該生 `responses/{uid}` 與 `judgeResponses`<br>- 前端 `StudentClassroomHistory` 面板可隨時展開檢視所有已公佈題目、個人作答、對錯、正解與解析 | 驗證跨班級隔離（B 班看不見 A 班場次）、跨學生作答隔離、未公佈場次不出現，以及 UI 展開檢視 2 題完整紀錄 |
| **6. 不變條件** | - 完全不寫入 `progress`、`passedAt`、`researchEvents` 或計分資料<br>- `interactions` JSON 結構維持不變，舊輪次無 `reveal` 完全相容 | Emulator 與單元測試確認 `courses/{c}/progress` 為空 (`empty === true`)，既有 MI 12 頁互動測試全數通過 |
| **7. 複習課 8 題答案鍵** | - 產出 `/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/review-all.answerKeys.json`（另附分單元 `respiratory.answerKeys.json`、`urinary-fluid.answerKeys.json`）<br>- `R-REV-04/07/10/13` 與 `U-REV-04/07/10/13` 之 `explanation` 僅使用核定大綱答案頁（`05/08/11/14`）原句 | `tests/classroom.test.ts` 自動載入 `review-all.interactions.json` + `review-all.answerKeys.json` 執行 `validateAnswerKeys` 通過（8 題，每題解析 ≤ 300 字） |
| **8. 彩排頁與合併工具同步** | - 備份私有資料夾至 `backups/_backup_reveal_20261026-212850/`<br>- 更新 `rehearsal.html`：支援「開題 → 投票 → 收題 → 公佈答案 → 進答案頁」，3 支手機模擬答對／答錯／未作答三態與「課堂互動紀錄」，自動演示納入公佈答案步驟<br>- 更新 `merge-interactions.html`：支援同時驗證與合併 `interactions` + `answerKeys`<br>- 同步更新 `START_HERE.md`、`RUN_SHEET.md`、`TEACHER_CLASSROOM_STEPS.md` | Playwright 自動操作 `rehearsal.html` 與 `merge-interactions.html` 並截圖存證 |

---

## 二、測試與 Emulator 驗收數據

1. **前端與全量驗證 (`npm test` & `npm run build`)**：
   - `tests/*.test.ts`：236 項測試全數 PASS（`0 fail`、`0 skipped`），包含 `tests/classroom.test.ts` 新增之 `validateAnswerKeys`/`judgeResponses` 單元測試與 Playwright `1440px`/`390px` 雙視角 UI 驗收。
   - `npm run version:check`：`版本一致：1.11.0`。
2. **後端測試 (`npm --prefix functions test`)**：
   - `functions/tests/*.test.cjs`：78 項測試全數 PASS（`0 fail`、`0 skipped`），包含 56 個 Cloud Functions 入口註冊檢查與 `classroom.test.cjs` 之公佈前不洩漏負向測試、公佈快照不可變測試、跨班與跨生隔離測試。
3. **Firestore Emulator 完整一輪驗證 (`verify-classroom-reveal-emulator.cjs`)**：
   - 指令：`firebase emulators:exec --project course-platform-reveal-test --only firestore "node functions/scripts/verify-classroom-reveal-emulator.cjs"`
   - 流程：`saveClassroomConfig` → `open` → 負向檢查（open 拒絕 reveal、學生端無答案洩漏）→ `submit`（答對生、答錯生）→ `close` → 負向檢查（closed 未 reveal 無答案洩漏、`studentClassroomHistory` 為空）→ `reveal`（含重複呼叫冪等性、事後修改 `answerKeys` 快照不變性）→ `getClassroomInteraction`（驗證答對 `✓`、答錯 `✗`、未作答三態與 `R-REV-07` 排序題逐步對錯 `[true, false, false, true]`）→ `studentClassroomHistory` → `classroomInteractionRecords` → 確認 `progress` 零寫入。
   - 結果：全數 `PASS`，輸出保存於 `/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal/emulator-roundtrip.json`。

---

## 三、外部驗收證據清單

路徑：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal/`（保留至 `2026-11-02`）

- `emulator-roundtrip.json`：Firestore Emulator 完整一輪驗證紀錄
- `ui-verification.json`：Playwright 1440px / 390px UI 驗收結果（`overflow: false`, `errors: []`）
- `teacher-before-reveal-1440.png` / `teacher-before-reveal-390.png`：教師收題後顯示「公佈答案」按鈕
- `teacher-after-reveal-1440.png` / `teacher-after-reveal-390.png`：教師公佈答案後按鈕變為「已公佈（disabled）」
- `student-unanswered-1440.png` / `student-unanswered-390.png`：未作答學生於公佈後看到正解、解析與全班統計（不標個人 ✓/✗）
- `student-correct-1440.png` / `student-correct-390.png`：答對學生於公佈後看到「✓ 本題答對」、選項 ✓、正解、解析與全班統計
- `student-wrong-1440.png` / `student-wrong-390.png`：答錯學生於公佈後看到「✗ 本題答錯」、所選 ✗、正解、解析與全班統計
- `student-order-feedback-1440.png` / `student-order-feedback-390.png`：排序題公佈後顯示第 1..4 步逐項 ✓/✗ 與完整正確順序
- `student-history-1440.png` / `student-history-390.png`：學生展開「課堂互動紀錄（已公佈 2 題）」頁面
- `rehearsal-reveal-1440.png`：私有彩排頁 `rehearsal.html` 公佈答案與 3 支模擬手機三態回饋畫面
- `merge-interactions-answerkeys-1440.png`：私有合併工具 `merge-interactions.html` 同時驗證合併 `interactions` 與 `answerKeys` 畫面

---

## 四、正式上線部署指令清單（供老師決定上線時執行）

> 本輪僅在本機分支 `feature/classroom-reveal` 完成實作與驗證，**未 push、未部署、未寫入正式環境**。當老師確認驗收通過並決定正式上線時，請依序執行：

1. **合併分支並再次執行完整檢查**：
   ```bash
   git checkout main
   git merge --no-ff feature/classroom-reveal
   npm run check
   ```
2. **部署 Cloud Functions（新增 `studentClassroomHistory` 及更新 `getClassroomConfig` / `saveClassroomConfig` / `controlClassroomInteraction` / `getClassroomInteraction` / `classroomInteractionReport`）**：
   ```bash
   firebase deploy --only functions
   ```
3. **部署前端 Hosting（更新 `1.11.0` 教師與學生課堂互動介面）**：
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
4. **匯入複習課 8 題互動與答案鍵**：
   - 開啟 `/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/merge-interactions.html`，貼入平台既有設定執行合併。
   - 於教師後台「課堂互動」分別展開「設定互動題目」與「設定答案與解析」，貼上合併後的 JSON 並保存。
