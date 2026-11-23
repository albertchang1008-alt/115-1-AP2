# #65 V3 切場舊回應與 D1 延遲清理／預覽／#61 退步修正報告（Hydrogen，2026-11-23）

## 給驗證者的摘要
- 分支與基底：`.worktrees/zuvio-exams`（`feature/zuvio-exams`），基於 `f43f596a`；保留 V1、V2 修正與前棒所有報告，版本維持 `1.15.9`。
- 改動檔案：`functions/src/zuvioExams.ts`、`src/ClassroomInteraction.tsx`、`functions/tests/zuvio-ext.test.cjs`、`tests/zuvio-mood-ui.test.ts`、`docs/zuvio-exam/EXT_V3D1_REFIX_R3_REPORT_2026-11-23.md`。
- **D1／#1（延遲清理保護）**：`cleanup` 改為只刪 `revision < beforeRevision` 的已被取代舊代明細；舊匯入或舊刪除的延遲清理不再誤刪較新有效或待提交代次。
- **D1／#2（預覽防呆與獨立 `gen`）**：`confirm=false` 與 `confirm=true` 統一採 `Math.max(results?.revision || 0, deletedRevision || 0)`；`confirm=true` 先驗證 `prevRef` 有效且每次產生獨立 `gen = randomUUID()`，失敗／重送／刪除前舊預覽皆不寫入明細。
- **#61／#3（無情緒匯入不受測驗上限阻斷）**：僅於 `c.features?.zuvioMood` 開啟時執行 `protectedIds` 與 `analyzeExam`，保留 #61 在 51+ 測驗文件下的既有確認匯入。
- **V3（切場與操作回應綁定）**：`TeacherZuvioMoodPanel` 選單 `onChange` 立即 `setLive(null)` 並以 `selectionRef` + `visibleLive` 守護輪詢、`openMood` 與 `closeMood` 回應，切場或清空後舊回應不覆蓋目前畫面。
- 相關測試 PASS：後端 `15/15`、純函式 `12/12`、UI `4/4`（0 skipped）；兩端 build PASS；Codex `fullcheck-replay.cjs` 9 項全 PASS；可攜性 grep 0 命中。
- 未驗：全套 `npm run check`（交 Gemini 3.8 Flash 新對話）、Ubuntu 非 root 與教師手機實點。
- 抽查 5 項：① `functions/src/zuvioExams.ts:362-458`；② `src/ClassroomInteraction.tsx:1101-1156,1182-1262,1313-1327`；③ `functions/tests/zuvio-ext.test.cjs:1148-1210`；④ `tests/zuvio-mood-ui.test.ts:318-403`；⑤ `fullcheck-replay.cjs` 輸出。

---

## 一、修正明細與精確行號

| 編號 | 問題 | 修法說明 | 檔案與行號 |
|---|---|---|---|
| **D1 清理** | `cleanup` 依 `gen !== keepGen` 刪除，延遲清理誤刪較新代明細 | 改為 `cleanup(col, sittingId, beforeRevision)` 只刪 `typeof rev === 'number' && rev < beforeRevision`；`zuvioDeleteResults` 亦於交易計算 `deletedRevision` 後傳入。 | `functions/src/zuvioExams.ts:424-458` |
| **D1 預覽／重送** | 確認失敗前以 `previewId` 為 `gen` 先寫明細，且未比較 `deletedRevision` | 預覽與確認皆採 `Math.max(results?.revision || 0, deletedRevision || 0)`；確認先預檢 `prevRef` 且每次產生獨立 `gen = randomUUID()`，交易內再重驗後原子提交。 | `functions/src/zuvioExams.ts:362-423` |
| **#61 退步** | `zuvioMood=false` 仍跑 `protectedIds` 受 50 測驗上限阻斷 | 僅在 `c.features?.zuvioMood` 為 `true` 時執行 `protectedIds`、`buildView` 與 `analyzeExam`，關閉時不阻斷 #61 匯入。 | `functions/src/zuvioExams.ts:379-388` |
| **V3 切場** | 切場後舊 `live` 仍暫留，且 `openMood`／`closeMood`／`poll` 舊回應覆蓋新場 | `onChange` 立即清空 `live` 並更新 `selectionRef`；以 `sameSelection` 守護 `poll`、`openMood`、`closeMood` 回寫；以 `visibleLive` 綁定畫面與結束鈕。 | `src/ClassroomInteraction.tsx:1101-1156,1182-1262,1313-1327` |

## 二、測試與重播證據
- **編譯與相關測試**（Node v22.23.2）：
  - `npm --prefix functions run build`：PASS（67 函式入口）
  - `npm run build`：PASS（`version:check` 1.15.9、`tsc -b`、`vite build`）
  - `node --test functions/tests/zuvio-ext.test.cjs`：**15/15 PASS**（新增 `D1 延遲清理與預覽重送防護：舊匯入／舊刪除清理不誤刪新代明細；重送／過期預覽不改寫有效成績；zuvioMood=false 不受測驗上限阻斷`）
  - `./node_modules/.bin/tsx --test tests/zuvio-ext.test.ts tests/zuvio-mood-ui.test.ts`：**16/16 PASS**（新增 `V3 UI 延遲與切場：A 切 B 時延遲 B 不先顯示 A 舊統計；結束／開啟未回時切場，放行舊回應不覆蓋目前畫面`）
- **Codex 全套重播腳本**（`zuvio-fullcheck/fullcheck-replay.cjs`）：
  - `V2`：`openAfterArchive: "failed-precondition"`, `currentOpenAfterArchive: false`, `visibleWhileArchived: false`, `visibleAfterUnarchiveWithoutOpeningAgain: false`
  - `V3`：`noSelectionOpen: true`, `examOnlyResult: "invalid-argument"`
  - `D1ImportGuard`：`confirmation: "accepted"`, `committedResults: true`, `remainingPreviews: 0`, `hasCache: false`
  - `D1CacheKeys`：5 項全 `true`；`D1Backfill`：`generationAdvanced: true`, `newCachePreserved: true`
  - `D1StaleImportCleanup` / `D1StaleDeleteCleanup`：皆維持 `activeRows: 1`, `sittingMatched: 1`, `analysisStudents: 1`, `gradeReportStudents: 1`
  - `D1StalePreview` / `D1ChangedRetry`：皆回 `failed-precondition`，原成績與快取不變（`gradeReportCorrect: 1`, `cachedCorrectRate: 1`）
- **可攜性 grep**：`functions/src/zuvioExams.ts`、`functions/tests/zuvio-ext.test.cjs`、`src/ClassroomInteraction.tsx`、`tests/zuvio-mood-ui.test.ts` 均 0 命中 `/Users/` 或 `/private/tmp`。
