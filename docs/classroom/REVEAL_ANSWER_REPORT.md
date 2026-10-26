# 課堂互動「公佈答案」與學生回饋（甲案）完成報告

## 給 Codex 的摘要
- **結論**：佇列 `#37` 退修項 **F1、F2 全數修正並補齊回歸測試**（版本 `1.11.0`，分支 `feature/classroom-reveal`，以 `origin/main` `75f3b6af` 為底）。
- **本輪退修修正重點（F1、F2）**：
  1. **F1 修正（未公佈輪次移除或使答案鍵失效後不顯示公佈鍵；已公佈快照保留）**：
     - `shared/classroom.ts`：新增 `extractValidSlideKey`，要求題目每個欄位均具備對應該輪選項之合法答案鍵。
     - `functions/src/classroom.ts`：未公佈輪次不再將 `hasAnswerKey: true` 固化於 Firestore 輪次文件；`decorateRoundWithKey` 與 `classroomInteractionReport` 僅在 `Boolean(r.reveal || extractSlideKey(keyData, r))` 為真時附加 `hasAnswerKey: true`（否則剝離舊 `hasAnswerKey`）；`saveClassroomConfig` 更新 `interactions` 時自動清理失效之 `answerKeys`。已公佈輪次 (`r.reveal`) 之快照與 `hasAnswerKey: true` 完整保留。
     - `src/ClassroomInteraction.tsx`：`TeacherInteraction` 對未公佈輪次同時檢驗 `Boolean(pageRound.hasAnswerKey)` 與 `extractValidSlideKey(pageRound, answerKeys)`，即使收到過期 `hasAnswerKey: true` 但 `answerKeys` 已清空／失效時亦不顯示「公佈答案」按鈕。
  2. **F2 修正（學生紀錄完整取得本班已公佈紀錄，不先全課程 limit 100 截斷）**：
     - `functions/src/classroom.ts`：`studentClassroomHistory` 改用單欄位索引查詢 `rounds(courseId).where('classIds', 'array-contains', p.classId).get()`（無需額外複合索引），再篩選 `status === 'closed' && Boolean(r.reveal)` 並依 `openedAt` 升冪排序，徹底消除別班新輪次擠掉本班紀錄及本班超過 100 輪被截斷的問題。
- **測試與 Emulator 結果**：`npm run check` 全數通過（前端與全量驗證 236 項 `0 fail / 0 skipped`，後端 `functions` 78 項 `0 fail / 0 skipped`）；Firestore Emulator 完整一輪含 F1、F2 回歸驗證（別班 +105 輪與本班 >100 輪共 108 輪）全數 `PASS`。
- **證據路徑**：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal/`（含 `emulator-roundtrip.json`、`ui-verification.json`、`stale-answer-key-fixed-1440.png` 及 16 張 1440px/390px 截圖，保留至 `2026-11-02`）。

---

## 一、退修項目 F1、F2 根因與修正對照

| 退修項目 | 根因分析 | 修正方式與回歸測試 |
|---|---|---|
| **F1：移除或使答案鍵失效後，未公佈輪次仍顯示「公佈答案」** | 1. 後端 `open`/`close` 將 `hasAnswerKey: true` 寫入輪次文件，`classroomInteractionReport` 以 `r.reveal \|\| r.hasAnswerKey \|\| extractSlideKey(...)` 做 OR，且 `hasKey` 為 false 時未剝離 `r` 原有的 `hasAnswerKey`。<br>2. 前端 `TeacherInteraction` 以 `pageRound.hasAnswerKey \|\| answerKeys[slideId]` 判斷，未以 `extractValidSlideKey` 雙重把關。 | - **後端**：新增 `decorateRoundWithKey(r, keyData)`，未公佈輪次僅依當下 `extractSlideKey(keyData, r)` 動態決定 `hasAnswerKey` 並主動剝離殘留屬性；`saveClassroomConfig` 修改 `interactions` 時自動透過 `safeFilterAnswerKeys` 清理失效答案鍵；已公佈輪次 (`r.reveal`) 快照維持不變。<br>- **前端**：`TeacherInteraction` 使用 `extractValidSlideKey(pageRound, answerKeys)` 驗證，當 `answerKeys` 清空或失效時隱藏「公佈答案」，重新保存合法鍵後立即恢復顯示。<br>- **回歸測試**：`functions/tests/classroom.test.cjs`、`verify-classroom-reveal-emulator.cjs`、`scripts/classroom-reveal-verify.mjs`（含 `stale-ui` 過期旗標直測）。 |
| **F2：其他班級新輪次使本班舊紀錄消失（全課程 limit 100 截斷）** | `studentClassroomHistory` 先對全課程 `classroomRounds` 執行 `.orderBy('openedAt', 'desc').limit(100)`，再於記憶體篩選 `p.classId` 與 `reveal`，導致別班新增 100 輪後本班紀錄被截斷為 0 輪。 | - **後端**：改為 `.where('classIds', 'array-contains', p.classId).get()` 直接查詢該生所屬班級全部輪次（使用 Firestore 內建單欄 `array-contains` 索引），篩選 `status === 'closed' && Boolean(r.reveal)` 後依 `openedAt` 升冪排序。<br>- **回歸測試**：於 `functions/tests/classroom.test.cjs` 與真實 Emulator `verify-classroom-reveal-emulator.cjs` 新增「別班寫入 105 輪較新已公佈紀錄」與「本班累積 108 輪（>100 輪）已公佈紀錄」測試，驗證本班紀錄 0 遺漏、時序正確且跨班／跨生隔離。 |

---

## 二、規格 1–8 實作與驗證對照

| 規格項目 | 實作檔案與設計要點 | 驗證方式與結果 |
|---|---|---|
| **1. 後端答案設定 `answerKeys`（與題目分開）** | - 儲存路徑：`courses/{c}/classroomConfig/answerKeys`<br>- 結構：`{ answerKeys: { [slideId]: { [fieldId]: { answer, explanation? } } } }`<br>- `firestore.rules` 維持預設 `allow read, write: if false;`，學生端無法直讀 Firestore | `tests/classroom.test.ts`、`functions/tests/classroom.test.cjs`：驗證合法與非法 `slideId`/`fieldId`、choice/order 規則、多欄位完整性、300 字上限與無 `undefined` 屬性 |
| **2. 教師設定頁與工具** | - `ClassroomConfigEditor` 新增「設定答案與解析」`<details>` 區塊與 `保存答案與解析`<br>- 無答案鍵、移除答案鍵或題目選項變更使答案鍵失效時，未公佈輪次不顯示「公佈答案」按鈕 | `scripts/classroom-reveal-verify.mjs`：驗證 `NO-KEY-SLIDE`、清空答案鍵 `{}`、過期 `hasAnswerKey: true` 均不顯示「公佈答案」，恢復合法鍵後顯示 |
| **3. 教師「公佈答案」動作（reveal）** | - `controlClassroomInteraction` 新增 `action: 'reveal'`<br>- 僅允許在 `round.status === 'closed'` 時執行；未收題呼叫拋出 `failed-precondition`<br>- 公佈時將當下 `answerKeys[round.slideId]` 快照寫入 `round.reveal = { revealedAt, key }`，具備冪等性且不受事後修改或清空 `answerKeys` 影響 | `functions/tests/classroom.test.cjs` 與 `verify-classroom-reveal-emulator.cjs`：驗證 open 狀態拒絕 reveal、重複 reveal 冪等、事後修改或清空 `answerKeys` 不改變已公佈場次快照與「已公佈」狀態 |
| **4. 學生端即時回饋** | - **公佈前（open 或 closed 未 reveal）**：`getClassroomInteraction` 經 `studentPromptRound`/`studentResultsRound` 剝離所有答案資訊；已送出學生顯示「`已送出，等待老師公佈答案`」<br>- **公佈後（closed 且有 reveal）**：回傳 `reveal` 與 `judgement`；單選題顯示選項 `✓`/`✗`、正解、解析與全班分佈；排序題顯示第 1..N 步逐項 `✓`/`✗` 與完整正確順序；未作答學生顯示「未作答」、正解、解析與全班分佈（不標個人對錯） | 負向測試確認 reveal 前 JSON 不含 `reveal`/`answer`/`explanation`/`judgement`；Playwright 1440px/390px 驗證未作答／答對／答錯三態與排序逐步回饋 |
| **5. 學生「課堂互動紀錄」頁** | - 新增 Callable `studentClassroomHistory`：以 `.where('classIds', 'array-contains', p.classId)` 取得本班全部輪次，篩選 `status === 'closed' && Boolean(r.reveal)`，依 `openedAt` 時間順序排列，合併該生 `responses/{uid}` 與 `judgeResponses`<br>- 前端 `StudentClassroomHistory` 面板可隨時展開檢視所有已公佈題目、個人作答、對錯、正解與解析 | 驗證跨班級隔離（B 班 105 輪不影響 A 班，且 B 班看不見 A 班）、本班 >100 輪（108 輪）完整回傳、跨學生作答隔離、未公佈場次不出現，以及 UI 展開檢視完整紀錄 |
| **6. 不變條件** | - 完全不寫入 `progress`、`passedAt`、`researchEvents` 或計分資料<br>- `interactions` JSON 結構維持不變，舊輪次無 `reveal` 完全相容 | Emulator 與單元測試確認 `courses/{c}/progress` 為空 (`empty === true`)，既有 MI 12 頁互動測試全數通過 |
| **7. 複習課 8 題答案鍵** | - 產出 `/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/review-all.answerKeys.json`（另附分單元 `respiratory.answerKeys.json`、`urinary-fluid.answerKeys.json`）<br>- `R-REV-04/07/10/13` 與 `U-REV-04/07/10/13` 之 `explanation` 僅使用核定大綱答案頁（`05/08/11/14`）原句 | `tests/classroom.test.ts` 自動載入 `review-all.interactions.json` + `review-all.answerKeys.json` 執行 `validateAnswerKeys` 通過（8 題，每題解析 ≤ 300 字） |
| **8. 彩排頁與合併工具同步** | - 備份私有資料夾至 `backups/_backup_reveal_20261026-212850/`<br>- 更新 `rehearsal.html`、`merge-interactions.html`、`START_HERE.md`、`RUN_SHEET.md`、`TEACHER_CLASSROOM_STEPS.md` | Playwright 自動操作 `rehearsal.html` 與 `merge-interactions.html` 並截圖存證 |

---

## 三、測試與 Emulator 驗收數據

1. **前端與全量驗證 (`npm test` & `npm run build`)**：
   - `tests/*.test.ts`：236 項測試全數 PASS（`0 fail`、`0 skipped`），包含 `tests/classroom.test.ts` 之 `validateAnswerKeys`、`extractValidSlideKey`、`judgeResponses` 單元測試與 Playwright `1440px`/`390px` 雙視角 UI 驗收（含 F1 答案鍵移除／恢復與過期旗標回歸測試）。
   - `npm run version:check`：`版本一致：1.11.0`。
2. **後端測試 (`npm --prefix functions test`)**：
   - `functions/tests/*.test.cjs`：78 項測試全數 PASS（`0 fail`、`0 skipped`），包含 56 個 Cloud Functions 入口註冊檢查與 `classroom.test.cjs` 之公佈前不洩漏負向測試、公佈快照不可變測試、F1（移除答案鍵／修改選項使答案鍵失效／重新保存）與 F2（別班 105 輪＋本班 108 輪）回歸測試。
3. **Firestore Emulator 完整一輪驗證 (`verify-classroom-reveal-emulator.cjs`)**：
   - 指令：`EMULATOR_REPORT_PATH="/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal/emulator-roundtrip.json" firebase emulators:exec --project course-platform-reveal-test --only firestore "node functions/scripts/verify-classroom-reveal-emulator.cjs"`
   - 結果：13 項檢查（含 `f1UnrevealedKeyRemovedOrInvalidatedHidesReveal: "PASS"` 與 `f2HistoryNotEvictedBy105OtherClassAndSupportsOver100OwnClass: "PASS"`）全數 `PASS`。

---

## 四、外部驗收證據清單

路徑：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal/`（截圖保存至 `2026-11-02`）

- `emulator-roundtrip.json`：Firestore Emulator 完整一輪與 F1、F2 回歸驗證紀錄
- `ui-verification.json`：Playwright 1440px / 390px UI 驗收結果（`passed: true`, `errors: []`）
- `stale-answer-key-fixed-1440.png`：F1 過期 `round.hasAnswerKey: true` 搭配空 `answerKeys: {}` 時不顯示「公佈答案」按鈕之截圖證據
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

## 五、正式上線部署指令清單（供老師決定上線時執行）

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
