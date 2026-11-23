# #65 V2／V3／D1 複審退修報告（Hydrogen，2026-11-23）

## 給驗證者的摘要
- 分支與基底：`.worktrees/zuvio-exams`（`feature/zuvio-exams`），基於 `86b165ee`；保留 V1 修正與前棒所有報告，版本維持 `1.15.9`。
- 改動檔案：`functions/src/zuvioExams.ts`、`src/ClassroomInteraction.tsx`、`src/zuvioApi.ts`、`functions/tests/zuvio-ext.test.cjs`、`tests/zuvio-mood-ui.test.ts`、`docs/zuvio-exam/EXT_V2V3D1_REFIX_REPORT_2026-11-23.md`。
- **V2（P2）**：`zuvioOpenMood` 於交易內重讀 `examRef` 檢查 `archived` 與場次有效性，與 `zuvioArchiveExam` 共用交易前提；解除封存不恢復舊卡片。
- **V3（P2）**：`TeacherZuvioMoodPanel` 選無場次考卷或清空場次時清除 `live` 且停用結束鈕，不送單參數 `getMoodLive`；`closeMood` 綁定目標 `sittingId` 並檢查 `closedRes.closed !== false`。
- **D1（P1／P2）**：`zuvioImportResults` 先跑 `protectedIds` 與 `analyzeExam`，再於同交易寫入成績 metadata 與 `analysis/{sittingId}`；`ensureSittingAnalysis` 懶回填改為交易內核對 `revision` 與 `gen`。
- 相關測試 PASS：後端 `14/14`（原 7＋V1／V2／V3／D1 7 項）、純函式 `12/12`、UI `3/3`（含 V3 `TeacherZuvioMoodPanel`），0 skipped；兩端 build PASS；可攜性 grep 0 命中。
- 重播結果：舊重播 `replay.cjs` 全 PASS；複審重播 `zuvio-ext-rereview/replay.cjs` 於 V2 競態交錯時如期以 `HttpsError: 考卷已封存`（`failed-precondition`）拒絕寫入。
- 未驗：全套 `npm run check`（交 Gemini 3.8 Flash 新對話）、Ubuntu 非 root 與教師手機實點。
- 抽查 5 項：① `functions/src/zuvioExams.ts:455-505`（V2 交易）；② `src/ClassroomInteraction.tsx:1122-1197`（V3 部分選擇與結束）；③ `functions/src/zuvioExams.ts:366-412,894-942`（D1 同交易與懶回填）；④ `functions/tests/zuvio-ext.test.cjs:1016-1148`；⑤ `tests/zuvio-mood-ui.test.ts:240-316`。

---

## 一、修正明細與精確行號

| 編號 | 退修原因 | 修法說明 | 檔案與行號 |
|---|---|---|---|
| **V2** | `zuvioOpenMood` 於交易外讀考卷，與 `zuvioArchiveExam` 交錯可寫入 `open: true` | `zuvioOpenMood` 改於 `db.runTransaction` 內讀取 `exRef` 與 `classroomStateRef`，再次驗證 `!e.archived` 與場次存在後才寫入 `zuvioMoodState/current`；保留送出交易檢查與一般結束 3 秒寬限，解除封存不恢復舊卡片。 | `functions/src/zuvioExams.ts:455-505` |
| **V3** | 部分選擇（有 `examId` 無 `sittingId`）送單參數請求並保留舊 `live`、可誤按結束 | `TeacherZuvioMoodPanel` 於 `examId && !sittingId` 時立即 `setLive(null)` 且不輪詢；`closeMood` 綁定 `sittingId \|\| live?.state?.sittingId` 並依 `closedRes.closed !== false` 顯示訊息；`zuvioApi.ts` `closeMood` 回傳型別補上 `closed?: boolean`。 | `src/ClassroomInteraction.tsx:1091,1122-1137,1182-1198,1273-1279`；`src/zuvioApi.ts:45` |
| **D1** | 保護名單查詢失敗卻已提交成績；交易外寫入與懶回填會在刪除後重建摘要 | `zuvioImportResults` 將 `protectedIds`、`buildView`、`analyzeExam` 移至交易前執行，失敗時不寫成績也不耗預覽；將 `analysis/{sittingId}` 寫入移入同一 `db.runTransaction`。`ensureSittingAnalysis` 懶回填改為交易內核對 `curSitting.results.revision` 與 `gen` 相符才寫入。 | `functions/src/zuvioExams.ts:366-412,894-942` |

## 二、測試與重播證據
- **後端建置與測試**：`npm --prefix functions run build` PASS（67 函式）；`node --test functions/tests/zuvio-ext.test.cjs` **14/14 PASS**（0 skipped），新增：
  - `V2 競態與解除封存：開啟與封存交錯時交易保證一致，解除封存後不恢復舊卡片`
  - `V3 後端：單參數請求回 invalid-argument、同卷跨場與省略參數狀態一致`
  - `D1 原子性與延遲回填防護：保護名單超限失敗不提交成績也不耗預覽；刪除或新代後不重建覆蓋`
- **前端建置、純函式與 UI 測試**：`npm run build` PASS；`./node_modules/.bin/tsx --test tests/zuvio-ext.test.ts` **12/12 PASS**；`./node_modules/.bin/tsx --test tests/zuvio-mood-ui.test.ts` **3/3 PASS**（新增 `V3 UI：TeacherZuvioMoodPanel 切到無場次考卷或清空場次時清除舊 live 且停用結束鈕，closed=false 不誤報已結束`）。
- **合成重播**：
  - `zuvio-ext-review/replay.cjs`：V1–V3 原案例全數符合預期。
  - `zuvio-ext-rereview/replay.cjs`：V2 競態步於 `zuvioOpenMood` 交易內觸發 `HttpsError: 考卷已封存`（`failed-precondition`）並正確中止，未寫入 `open: true`。
- **可攜性 grep**：`functions/src/zuvioExams.ts`、`functions/tests/zuvio-ext.test.cjs`、`src/ClassroomInteraction.tsx`、`src/zuvioApi.ts`、`tests/zuvio-mood-ui.test.ts` 均 0 命中 `/Users/` 或 `/private/tmp`。
