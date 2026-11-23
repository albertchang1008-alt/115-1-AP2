# 1.15.10 全套 Check 驗收報告：點名開關＋ag2 平台（佇列 #67）

## 給 Claude 的摘要
- 對象：.worktrees/attendance（codex/attendance-feature-toggle，HEAD 2804f51c，merge e23db762）；版本 1.15.10。
- 全套 npm run check：PASS（exit 0）；前端測試 320/320、後端測試 131/131、TS/Vite build PASS、Functions build 67 函式 PASS。
- 閱讀規範：17 份教材、4864 畫面、0 issues / 0 staticIssues / 0 errors PASS。
- UI 回歸：node scripts/attendance-ui-check.mjs PASS（Playwright Chrome；學生 34、教師 5、7 組互動、0 failure / pageError）。
- 抽查 1（點名開關）：CourseEditor 390 寬預設與特大保存草稿正常，功能區不出框，側欄即時切換，存檔無 publish/start 呼叫。
- 抽查 2（ag2 辨識）：completionBoard.ts 與 activityHistory.ts 正確支援 /-ag\d+$/，前後端 19/19 測試 PASS。
- 抽查 3（教材網址）：materials.ts 4 筆 ag2 均指向 ap2-materials 獨立站，非 ag2 仍維持本站網址。
- 抽查 4（單元上限）：MAX_COURSE_UNITS=120，52 與 120 PASS，121 拋出拒絕 PASS。
- 可攜性路徑自查：本次變動 10 個程式／測試檔 grep '/Users/' 與 '/private/tmp' 為 0 筆（exit 1）。
- 偏離：無；未 push、未併 main、未部署、未開正式課程點名旗標、未登錄活動。

## 驗收環境與對象
- 執行環境：macOS Darwin arm64（Apple Silicon M-series），Node.js v22.23.2。
- 工作樹路徑：`/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/attendance`。
- 分支：`codex/attendance-feature-toggle`。
- 驗收提交：HEAD `2804f51ccd9f4bc2316fa9b5b3fdfb1598b01160`（merge `e23db762`）。
- 版本確認：`npm run version:check` 回傳 `版本一致：1.15.10`（exit 0）。

## 完整 check 執行結果
執行指令：`npm run check`（`npm test && npm run build && npm --prefix functions test && npm run readability:check`）。
- **Exit Code**: 0。
- **Functions pretest build**:
  - `node scripts/check-runtime.cjs && tsc && node scripts/check-entry.cjs`
  - 後端入口載入通過：67 個函式（未連接雲端）。
- **前端單元測試**（`tsx --test --test-concurrency=2 tests/*.test.ts`）：
  - 320 tests, 320 pass, 0 fail, 0 skipped, 0 cancelled。
- **前端建置**（`npm run version:check && tsc -b && vite build`）：
  - TypeScript 型別檢查 PASS。
  - Vite build PASS（產出 index.html 與 assets chunks）。
- **後端單元測試**（`npm --prefix functions test`）：
  - 131 tests, 131 pass, 0 fail, 0 skipped, 0 cancelled。
- **閱讀規範檢查**（`node --experimental-strip-types scripts/readability-check.mjs`）：
  - 檢查教材數：17 份（全部重新檢查）。
  - 畫面總數：4,864 screens。
  - 結果：17 pass, 0 fail, 0 skipped, 0 issues, 0 staticIssues, 0 errors。

## 點名開關 UI 回歸驗證
執行指令：`node scripts/attendance-ui-check.mjs --out <repo外證據目錄>`。
- **Exit Code**: 0。
- **測試結果 JSON**：
  ```json
  {
    "pass": true,
    "studentScreens": 34,
    "teacherScreens": 5,
    "checked": 39,
    "functionalChecks": [
      "copy-clipboard, gmail, 44px",
      "copy-reject, gmail, 44px",
      "copy-missing, gmail, 44px",
      "control-enabled",
      "control-disabled",
      "control-preview",
      "feature-toggle: save on/off, independent navigation, no publish"
    ],
    "failures": [],
    "pageErrors": []
  }
  ```
- **UI 互動與回歸斷言**：
  1. 學生端 17 畫面 × 2 種字級（預設 1.0、特大 1.3）共 34 畫面，可讀性幾何檢查無違規。
  2. 教師端 5 畫面（開始點名、即時投影碼、同裝置提醒、修改紀錄、已寄通知）冒煙測試 PASS。
  3. 剪貼簿 3 種模式（clipboard, reject, missing）退路與 Gmail 開啟參數（to, su, body, authuser）驗證 PASS；操作按鈕高度均 ≥ 44px。
  4. 授課控制台 3 種狀態（enabled, disabled, preview）獨立性與徽章即時切換 PASS。
  5. 點名開關獨立開關流程：
     - CourseEditor 預設 attendance: false，側欄無點名入口。
     - 勾選點名後，未點保存草稿前側欄依然無入口。
     - 點擊「保存草稿」後，features.attendance 寫入 true，側欄出現「點名」按鈕。
     - 390 寬預設與特大字級下，功能設定區塊（fieldset）右界均 ≤ 視窗寬度，無溢出。
     - 側欄「點名」點擊可獨立進入開始點名與試簽介面。
     - 取消勾選並再次保存草稿，attendance 回復 false，側欄點名入口移除。
     - 全程 saveCourse 僅 2 次，publishCourse 與 attendanceStart 為 0 次。

## 核心抽查驗證

### 1. 390 寬預設與特大功能區
- 驗證方法：透過 Playwright 於 390×844 視窗動態設定 `--font-scale: 1` 與 `--font-scale: 1.3`，檢查 `fieldset.getBoundingClientRect().right <= innerWidth + 1`，並截圖存證。
- 存證截圖：
  - `ui-feature-toggle-390-default.png`（390 寬預設）
  - `ui-feature-toggle-390-xlarge.png`（390 寬特大）
- 結果：PASS，排版不出框，文字跟隨縮放。

### 2. 完成度看板與學習紀錄辨識 ag2 版本
- 驗證方法：
  - `shared/completionBoard.ts`: `recordedMaterial = (materialVersion) => /-ag\d+$/.test(materialVersion || '')`。
  - `functions/src/activityHistory.ts`: `backfillVersions` 以 `/-ag\d+$/` 篩選版本。
  - 執行 `npx tsx --test tests/completion-board.test.ts` 與 `cd functions && node --test tests/activity-history.test.cjs`。
- 結果：PASS，ag1、ag2 及多位數 agN 皆能正確辨識與計入，排除非結尾或非互動教材；前後端針對此邏輯之測試均通過。

### 3. 四筆 ag2 教材網址指向 ap2-materials
- 驗證方法：檢視 `shared/materials.ts` 與執行 `tests/material-ag2.test.ts`。
  - `gi-wall-overview-ag2` → `https://albertchang1008-alt.github.io/ap2-materials/gi-wall-overview/index.html`
  - `oral-cavity-ag2` → `https://albertchang1008-alt.github.io/ap2-materials/oral-cavity/index.html`
  - `swallowing-esophagus-ag2` → `https://albertchang1008-alt.github.io/ap2-materials/swallowing-esophagus/index.html`
  - `stomach-ag2` → `https://albertchang1008-alt.github.io/ap2-materials/stomach/index.html`
- 結果：PASS（4 筆分母與網址測試 2/2 PASS；非 ag2 教材沿用原站網址）。

### 4. 單元數上限 > 120 被拒
- 驗證方法：檢視 `shared/courseValidation.ts` 中的 `MAX_COURSE_UNITS = 120`，並執行 `tests/course-unit-limit.test.ts`。
- 斷言：52 個與 120 個通過，121 個單元時拋出 `題目分類最多 120 個（目前 121 個）` 錯誤。
- 結果：PASS。

## 可攜性路徑自查（第 11 條）
針對本次合併涉及變動之程式與測試檔：
- `src/App.tsx`
- `scripts/attendance-ui-check.mjs`
- `tests/fixtures/attendance-ui.tsx`
- `shared/completionBoard.ts`
- `shared/materials.ts`
- `shared/version.ts`
- `functions/src/activityHistory.ts`
- `functions/tests/activity-history.test.cjs`
- `tests/completion-board.test.ts`
- `tests/material-ag2.test.ts`

執行：
`grep -nE '/Users/|/private/tmp' <上述檔案>`
結果：命中 0 筆（exit code 1），無寫死本機個人或暫存路徑。

## 存證檔案資訊
證據目錄（repo 外）：`課程平台-驗收證據/2026-11-23/check-1.15.10-ag38/`
保存期限：至 2026-11-30。
檔案清單：
- `ui-feature-toggle-390-default.png`：CourseEditor 功能設定 390 預設字級截圖
- `ui-feature-toggle-390-xlarge.png`：CourseEditor 功能設定 390 特大字級截圖
- `ui-control-pending-1440.png`：授課控制台 1440 寬度待通知按鈕截圖
- `ui-my-390-default.png`：學生端我的出缺席 390 預設字級截圖
- `ui-my-390-xlarge.png`：學生端我的出缺席 390 特大字級截圖
- `ui-result.json`：UI 回歸自動化測試結果輸出

## 限制遵守確認
- [x] 未 push 到遠端。
- [x] 未合併 main。
- [x] 未執行正式部署。
- [x] 未啟用正式課程點名旗標。
- [x] 未登錄正式教材活動。
- [x] 未修改產品與測試程式碼（純驗收）。
- [x] 未變動工作樹外無關檔案。
