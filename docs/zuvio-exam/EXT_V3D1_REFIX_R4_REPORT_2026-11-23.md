# #65 D1 交易失敗回收／清理異常與 V3 往返切場／建場回應修正報告（Hydrogen，2026-11-23）

## 給驗證者的摘要

- **分支與基底**：`.worktrees/zuvio-exams`（`feature/zuvio-exams`），基於 `3f8ac043`；保留 V1／V2／#61 關閉情緒匯入與保護題遮蔽，版本維持 `1.15.9`。
- **修改檔案**：`functions/src/zuvioExams.ts`、`src/ClassroomInteraction.tsx`、`functions/tests/zuvio-ext.test.cjs`、`tests/zuvio-mood-ui.test.ts`、`docs/zuvio-exam/EXT_V3D1_REFIX_R4_REPORT_2026-11-23.md`。
- **D1 P1（失效確認回收未提交明細）**：`zuvioImportResults` 的 `db.runTransaction` 外包 `try/catch`；若交易拒絕，僅刪除該次未提交 `gen` 之 `${gen}_${s}` 文件並保留原例外，不傷有效或其他待提交代次。
- **D1 P2（清理失敗不誤報）**：`zuvioImportResults` 與 `zuvioDeleteResults` 在交易提交後的 `cleanup` 外包 `try/catch` 記警告，使 callable 仍回傳 `{ ok: true, ... }`，且舊代明細留較小 `revision` 不影響報表並可於後續操作恢復清理。
- **V3 P2（往返切場與晚到建場）**：`TeacherZuvioMoodPanel` 增設 `selectionSeqRef` 與 `liveOrderRef`/`appliedLiveOrderRef` 隔離 `A → B → A` 往返及同場舊輪詢；`createSitting`／`refreshExams` 依目前選擇序號與考卷／課程判斷，晚到回應不覆蓋目前考卷或場次選擇。
- **相關測試 PASS**：`npm --prefix functions run build` PASS（67 函式）；`functions/tests/zuvio-ext.test.cjs` **16/16 PASS**（0 skipped）；`tests/zuvio-mood-ui.test.ts` **5/5 PASS**（0 skipped）。
- **可攜性檢查**：`grep -nHE '/Users/|/private/tmp|/tmp/'` 4 支修改檔 0 命中（`GREP_CLEAN`）；`git diff --check` 通過。
- **未驗**：全套 `npm run check`、`npm run build`、`npm run readability:check`（交 Gemini 3.8 Flash 新對話）、Ubuntu 非 root 與教師手機實點。
- **抽查 5 項**：① `functions/src/zuvioExams.ts:400-448`；② `functions/src/zuvioExams.ts:475-482`；③ `src/ClassroomInteraction.tsx:1101-1260`；④ `functions/tests/zuvio-ext.test.cjs:1213-1300`；⑤ `tests/zuvio-mood-ui.test.ts:404-522`。

---

## 一、修正明細

| 項目 | 問題說明 | 修法說明 | 檔案與位置 |
|---|---|---|---|
| **D1 P1** | `confirm=true` 先寫入 `gen` 明細，交易失敗後未回收，導致被拒匯入殘留成績列 | 於 `db.runTransaction` 外加 `try/catch`；失敗時分批刪除該次 `gen` 的 `${gen}_${s}` 文件再拋出原錯誤 | `functions/src/zuvioExams.ts:400-443` |
| **D1 P2** | 交易提交後 `cleanup` 拋錯會令已生效之匯入／刪除向教師回報失敗 | 於 `zuvioImportResults` 與 `zuvioDeleteResults` 之 `cleanup` 外加 `try/catch` 記錄警告，維持回傳已提交成功狀態並保留後續清理可恢復性 | `functions/src/zuvioExams.ts:444-450,475-482` |
| **V3 往返** | `A → B → A` 切回原場次時三個 ID 相同，舊操作後續查詢可覆寫較新統計 | 增設 `selectionSeqRef`（每次切換遞增）與 `liveOrderRef`/`appliedLiveOrderRef`，`applyLive` 同時比對 `seq`、三個 ID 與較新請求序號 | `src/ClassroomInteraction.tsx:1101-1255` |
| **V3 建場** | 在考卷 A 按建立場次未回前切到考卷 B，回應後直接 `setSittingId(created.id)` 混配考卷與場次 | `createSitting` 與 `refreshExams` 捕捉 `reqCourseId`/`reqExamId`，僅在仍維持原課程／原考卷時才套用新 `sittingId` 與提示 | `src/ClassroomInteraction.tsx:1126-1197` |

## 二、相關測試與靜態檢查結果

- `npm --prefix functions run build`：PASS（`67 個函式`）。
- `node --test functions/tests/zuvio-ext.test.cjs`：**16/16 PASS**（0 fail, 0 skipped；含新增「預檢後刪除」、「同版並行確認」、「清理失敗回傳與恢復」）。
- `./node_modules/.bin/tsx --test tests/zuvio-mood-ui.test.ts`：**5/5 PASS**（0 fail, 0 skipped；含新增「A → B → A 往返切場」與「A 建場未回切 B」）。
- `grep -nHE '/Users/|/private/tmp|/tmp/'`：4 支變更檔 0 命中。
- `git diff --check`：通過。
