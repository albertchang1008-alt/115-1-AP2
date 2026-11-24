# #61 延伸功能實作報告（批次 A：試題分析、課前情緒、考前練習、關懷名單與 CSV 匯出）

## 給驗證者的摘要
1. 對象：Antigravity（Gemini 3.8 Flash），接手 `.worktrees/zuvio-exams`（分支 `feature/zuvio-exams`）。
2. 版本號依指示暫維持 `1.15.8` 未更動。
3. 新增純函式模組 [shared/zuvioExt.ts](file:///Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/zuvio-exams/shared/zuvioExt.ts) 與功能旗標 `zuvioMood`（預設關閉）[shared/features.ts](file:///Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/zuvio-exams/shared/features.ts)。
4. 後端 [functions/src/zuvioExams.ts](file:///Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/zuvio-exams/functions/src/zuvioExams.ts) 新增 9 支 callable 並擴充 `zuvioCreateSitting`（`startsAt`）與 `zuvioReport`。
5. 前端完成學生不可跳過全螢幕情緒卡 [src/ZuvioMoodCard.tsx](file:///Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/zuvio-exams/src/ZuvioMoodCard.tsx)、授課頁即時開關 [src/ClassroomInteraction.tsx](file:///Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/zuvio-exams/src/ClassroomInteraction.tsx)、報表甲乙表與關懷名單 [src/ZuvioExams.tsx](file:///Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/zuvio-exams/src/ZuvioExams.tsx)。
6. `npx tsc --noEmit` 與 `npm --prefix functions run build`（67 個函式）均通過。
7. 相關單檔測試全數通過：`tests/zuvio-ext.test.ts`、`tests/zuvio.test.ts`、`tests/zuvio-e2e.test.ts`（17/17 PASS）與 `functions/tests/zuvio-ext.test.cjs`、`functions/tests/zuvio-exams.test.cjs`（10/10 PASS）。
8. 尚未執行全套 `npm run check`（依分工交由下一棒執行）。
9. 實作與測試均不含 `/Users` 或 `/private/tmp` 硬編碼路徑。
10. 批次 B（C2 平台首答比較、D 題庫預覽累計統計、待複核題目頁）依指示暫緩。

## 實作檔案清單
- `shared/features.ts`：新增 `zuvioMood` 功能旗標（預設關閉），並在 `functions/src/index.ts` `saveCourse` 保留既有值。
- `shared/zuvioExt.ts`：情緒五狀態常數（依交辦附錄原文）、`analyzeExam`（甲乙表、KR-20、SEM、P、D、點二系列 `r_pb`、誘答與疑似錯鍵標記）、`classifyPreExamPractice`、`summarizeMoodResults`、`buildCareList`、`maskStudentName`、`itemAnalysisCsv`、`researchCsv`（文字欄一律加 `'` 前綴）。
- `functions/src/zuvioExams.ts` & `functions/src/index.ts`：新增 `zuvioUpdateSittingStart`、`zuvioOpenMood`、`zuvioCloseMood`、`zuvioGetMoodLive`、`zuvioDeleteMood`、`zuvioGetActiveMood`、`zuvioSubmitMood`（含 3 秒寬限期與防重複覆寫）、`zuvioCareList`、`zuvioExportCsv`（去識別研究代碼沿用 `reflectionSalt` HMAC-SHA256）。
- `src/zuvioApi.ts`、`src/ZuvioMoodCard.tsx`、`src/zuvio-ext-sample.css`、`src/App.tsx`、`src/ClassroomInteraction.tsx`、`src/ZuvioExams.tsx`：前端 API 與 UI 串接。
- `tests/zuvio-ext.test.ts`、`functions/tests/zuvio-ext.test.cjs`：單元與後端整合測試。

## W8 去識別匯出檔實測數據（`tests/fixtures/zuvio/W8-results-anon.xlsx`）
- 總樣本數：35 人（34 題，每題 4 分，滿分 136）。
- 整卷統計：Mean = `85.03`、SD = `28.29`、Min = `36`、Max = `132`、KR-20 = `0.8782`、SEM = `9.87`。
- **第 30 題（Q30）指標**：
  - 正解 `D`、作答 35 人、未答 0 人
  - 難度 `P = 0.2000`
  - 鑑別度 `D = 0.2222`（高分組 9 人中 2 人選 D；低分組 9 人中 0 人選 D）
  - 點二系列 `r_pb = 0.2141`
  - 誘答分布：`A` 總 4（高 1 / 低 1）、`B` 總 14（高 1 / 低 7）、`C` 總 10（高 5 / 低 1，高分組選錯多於正解 `keySuspect: true`）、`D*` 總 7（高 2 / 低 0）
  - 異常標記：`["疑似錯鍵"]`（全卷唯一觸發 `疑似錯鍵` 之題目；其餘 Q1/Q3/Q5/Q6/Q10/Q11/Q15/Q29 僅標記 `誘答未選`）。

## 單一場次考前練習 Firestore 讀取數估算
以一場 50 位學生、1 個班級、考卷涵蓋 3 個次單元為例：
1. **首次計算並寫入 `prep/${sittingId}` 快取**：
   - `enrollments` 班級名冊查詢：約 50 reads
   - `attempts` 依 `(classId, unitId)` 查詢 3 次單元：約 100–200 reads（僅限該班該單元紀錄，不掃全課程）
   - `progress/${uid}` 批次 `db.getAll`（每批 100 筆）：50 reads
   - 合計首次約 **200–300 reads**（寫入 1 筆快取文件）。
2. **後續查詢（`zuvioReport` / `zuvioCareList` / `zuvioExportCsv`）**：
   - 只要 `startsAt` 未變更，直接讀取 `prep/${sittingId}`：**1 read**（在 `functions/tests/zuvio-ext.test.cjs` 中已驗證命中快取後 `reads` 顯著下降）。
   - 若教師透過 `zuvioUpdateSittingStart` 修改開考時間，交易會同步刪除 `prep/${sittingId}` 並於下次報表重算。


## 完整驗證結果（Antigravity 2026-11-13）

- **驗證環境**：macOS（Node.js v22.23.2）於 `.worktrees/zuvio-exams`（分支 `feature/zuvio-exams`）。
- **驗證指令**：`npm run check`（含 `npm test`、`npm run build`、`npm --prefix functions test`、`npm run readability:check`）。
- **驗證結果**：**全部 PASS**
  1. **前端測試（`npm test`）**：PASS（所有測試通過，含 `preview.test.ts` 41/41、`reflection-react.test.ts`、`completion-board-react.test.ts` 等）。
  2. **前端建置（`npm run build`）**：PASS（Vite 建置成功，無型別或模組錯誤）。
  3. **後端建置與測試（`npm --prefix functions test`）**：PASS（入口載入 67 個函式無誤；測試 122/122 PASS，0 fail，0 skipped）。
  4. **手機可讀性檢查（`npm run readability:check`）**：PASS（17/17 教材通過，4864 screens，issues=0）。
  5. **Zuvio 專項單檔測試**：
     - `tests/zuvio-ext.test.ts`、`tests/zuvio.test.ts`、`tests/zuvio-e2e.test.ts`：17/17 PASS。
     - `functions/tests/zuvio-ext.test.cjs`、`functions/tests/zuvio-exams.test.cjs`：10/10 PASS。
- **微調修正**：
  - 測試初期遭遇 esbuild 在 bundle `App.tsx` 時報錯（`Cannot import "src/zuvio-ext-sample.css" into a JavaScript file without an output path configured`）。
  - 原因：`src/ZuvioMoodCard.tsx` 於元件內重複匯入 CSS，而 `src/main.tsx` 原已全域引入該樣式。
  - 修正：移除 `src/ZuvioMoodCard.tsx` 之 `import './zuvio-ext-sample.css';`，已提交 commit `d26b4954`（結尾 `[Antigravity]`）。重測後全數通過。
