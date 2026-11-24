# #65（合批 #61）合併 origin/main 與升版 1.16.0 報告（Antigravity Hydrogen，2026-11-24）

## 給 Claude 的摘要
- **PASS（相關測試與建置全過），交 3.8 接手全套與真實瀏覽器驗收。** 分支 `feature/zuvio-exams` 已合併 `origin/main`（`e08096c4`，1.15.10）並升版至 `1.16.0`。
- 唯一衝突檔：`src/App.tsx:1085`（課程功能勾選列），已合併保留 `attendance`（點名）、`zuvioExams`（Zuvio 出題）、`zuvioMood`（課前情緒簽到）。
- 版本同步：`VERSION` 改 `1.16.0`，`npm run version:sync` 與 `npm run version:check` 通過。
- 建置與後端：`npm --prefix functions run build` 67 函式通過；`npm run build` 通過；`zuvio-ext.test.cjs`＋`zuvio-exams.test.cjs` 26/26 PASS；`attendance.test.cjs` 17/17 PASS（0 fail / 0 skipped）。
- 前端相關測試：`tests/zuvio*.test.ts`、`tests/attendance.test.ts`、`tests/material-ag2.test.ts`、`tests/completion-board.test.ts`、`tests/course-unit-limit.test.ts` 共 50/50 PASS（0 fail / 0 skipped）；`node scripts/attendance-ui-check.mjs` 39 畫面 PASS。
- 偏離與未驗：無程式邏輯修改；全套 `npm run check` 與真實瀏覽器 `test` 課程實測交 3.8 執行。
- 抽查 5 項：① `shared/features.ts` `featureNames` 同時含 `attendance`、`zuvioExams`、`zuvioMood`；② `src/App.tsx` 課程功能勾選同時含點名與 Zuvio 兩項；③ `functions/src/index.ts` `saveCourse` 保留全部旗標；④ `shared/completionBoard.ts` 與 `functions/src/activityHistory.ts` 保留 `/-ag\d+$/`、`shared/materials.ts` 保留 4 筆 `ag2`；⑤ `shared/courseValidation.ts` 保留 `MAX_COURSE_UNITS = 120`。

## 衝突與合併細節
| 檔案 | 衝突／檢查原因 | 解法與驗證 |
|---|---|---|
| `src/App.tsx` | `1085` 行課程功能勾選陣列（HEAD 有 `zuvioExams`/`zuvioMood`，`origin/main` 有 `attendance`） | 合併為 `['assessments', 'teachingConsole', 'classroomInteraction', 'attendance', 'zuvioExams', 'zuvioMood']` 與對應中文標籤；`npm run build` 與 `attendance-ui-check.mjs` 通過 |
| `shared/features.ts` | 自動合併後核對 | 確認 `featureNames` 同時包含 `attendance`、`zuvioExams`、`zuvioMood` |
| `functions/src/index.ts` | 自動合併後核對 `saveCourse` | 保留 `normalizeCourseFeatures(course.features)` 與 `zuvioExams`／`zuvioMood` fallback |
| `shared/completionBoard.ts`、`functions/src/activityHistory.ts`、`shared/materials.ts`、`shared/courseValidation.ts` | 確認 1.15.10 改動未被蓋掉 | `/-ag\d+$/`、4 筆 `ag2`、`MAX_COURSE_UNITS = 120` 均存在，對應測試全過 |

## 執行指令與結果
- `npm run version:sync && npm run version:check`：版本一致 `1.16.0`。
- `npm --prefix functions run build`：後端入口載入通過 67 個函式。
- `node --test functions/tests/zuvio-ext.test.cjs functions/tests/zuvio-exams.test.cjs`：26/26 PASS，0 fail，0 skipped。
- `node --test functions/tests/attendance.test.cjs`：17/17 PASS，0 fail，0 skipped。
- `npm run build`：通過（`tsc -b && vite build`）。
- `npx tsx --test --test-concurrency=2 tests/zuvio-e2e.test.ts tests/zuvio-ext.test.ts tests/zuvio-mood-ui.test.ts tests/zuvio.test.ts tests/attendance.test.ts tests/material-ag2.test.ts tests/completion-board.test.ts tests/course-unit-limit.test.ts`：50/50 PASS，0 fail，0 skipped。
- `node scripts/attendance-ui-check.mjs`：`pass: true`，39 畫面、0 failures、0 pageErrors。
