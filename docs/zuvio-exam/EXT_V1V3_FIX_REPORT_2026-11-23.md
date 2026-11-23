# #65 V1–V3 缺陷與 D1 分析快取修正報告（Hydrogen，2026-11-23）

## 給驗證者的摘要
- 分支與基底：`.worktrees/zuvio-exams`（`feature/zuvio-exams`），基於 `fe9c31b9`（程式 `50ddfdd7`，相對 `origin/main` `5e649242`）；版本維持 `1.15.9`。
- 改動檔案：`functions/src/zuvioExams.ts`、`src/ClassroomInteraction.tsx`、`functions/tests/zuvio-ext.test.cjs`、`docs/zuvio-exam/EXT_V1V3_FIX_REPORT_2026-11-23.md`。
- V1／V2／V3／D1 全部修正完成並通過相關測試（後端 11/11 PASS、共用與 UI 14/14 PASS，0 skipped；`functions` build 67 函式通過；前端 `npm run build` 通過）。
- 合成重播驗證 PASS：以 Codex 提供的 `replay.cjs` 重播，`uidlessRosterMismatch`（`passed`／`100`／`1`）、`liveMismatch`（`returnedStateIsOtherSitting: false`／`open: false`／`2/2`）、`archiveMismatch`（`active: false`／送出拒絕）全數符合預期。
- 可攜性 grep：本次修改之程式與測試檔案 `/Users/`、`/private/tmp` **0 命中**。
- 未驗：全套 `npm run check`（交 Gemini 3.8 Flash 新對話跑）、Ubuntu 非 root 與教師手機實點。
- 抽查 5 項：① `functions/src/zuvioExams.ts:739,814-874`（V1 email→UID 與 `PREP_CACHE_VERSION=2`）；② `:227-239,599-639`（V2 封存交易與讀寫阻擋）；③ `:510-564`（V3 同場次狀態／分母）；④ `:393-409,886-924,999-1001,1255-1257`（D1 匯入計算與分析快取）；⑤ `functions/tests/zuvio-ext.test.cjs:803-1020`。

---

## 一、修正明細與精確行號

| 編號 | 問題 | 修法說明 | 檔案與行號 |
|---|---|---|---|
| **V1** | 正式名冊缺 `enrollment.uid` 誤算並永久定稿 | `ensureSittingPrep` 比照 `statsRoster` 批次查詢 `profiles`（`where('email', 'in', ...)`，每批 30 筆）建立 `email→uid` 映射（含小寫相容）；無登入 `profile` 者維持 `none`。新增 `PREP_CACHE_VERSION = 2`，舊版無 `prepVersion` 的錯誤定稿快取一律失效重算。 | `functions/src/zuvioExams.ts:436,739,814-874` |
| **V2** | 封存考卷後開啟中快篩仍可讀寫 | `zuvioArchiveExam` 於交易內同步檢查並關閉屬於該 `examId` 的 `zuvioMoodState/current`（保留 `responses` 歷史，不誤關其他考卷）；`zuvioGetActiveMood` 與 `zuvioSubmitMood` 交易內亦驗證 `exam.archived !== true`。 | `functions/src/zuvioExams.ts:227-239,599-601,634-639` |
| **V3** | `zuvioGetMoodLive` 狀態與人數錯場 | 明確檢查請求 `(examId, sittingId)` 是否與 `current` 一致；非 `current` 的歷史／他場改讀該考卷場次與 `classRosterDocs` 計算 `eligibleCount` 與 `open: false`，並於前端 `ClassroomInteraction.tsx` 同步防呆停用〔結束〕鈕。 | `functions/src/zuvioExams.ts:510-564`；`src/ClassroomInteraction.tsx:1265-1269` |
| **D1** | 試題分析未於匯入時計算快取（v3 四之三 F） | `zuvioImportResults` 確認匯入時計算單場分析並寫入 `analysis/{sittingId}`（以 `revision`、`gen`、`maskedKey`、`ANALYSIS_CACHE_VERSION=1` 控管失效）；`zuvioDeleteResults` 同步刪除；單場未篩選的 `zuvioReport`／`itemAnalysis` CSV 命中快取，多場合併或依班篩選動態彙總。 | `functions/src/zuvioExams.ts:393-409,432,437,886-924,999-1001,1255-1257` |

## 二、相關測試與合成重播結果
1. **編譯與相關測試**（Node v22.23.2）：
   - `npm --prefix functions run build`：PASS（67 函式入口）
   - `npm run build`：PASS（`version:check` 1.15.9、`tsc -b`、`vite build`）
   - `node --test functions/tests/zuvio-ext.test.cjs`：**11/11 PASS**（原 7 項＋新增 V1、V2、V3、D1 回歸 4 項，0 skipped）
   - `./node_modules/.bin/tsx --test tests/zuvio-ext.test.ts tests/zuvio-mood-ui.test.ts`：**14/14 PASS**（純函式 12＋UI 2，0 skipped）
2. **合成重播**（腳本：`/Users/HHC/.codex/visualizations/2026/11/23/01a2076d-5cc2-7db0-9bdb-be044e399fb4/zuvio-ext-review/replay.cjs`）：
   - `uidlessRosterMismatch`：`cachedStatus: "passed"`, `cachedCoverage: 100`, `cachedAsFinal: true`, `reportedPassedCount: 1`
   - `liveMismatch`：`returnedStateIsOtherSitting: false`, `returnedOpen: false`, `responded: 2`, `eligible: 2`
   - `archiveMismatch`：`examArchived: true`, `studentPromptActiveAfterArchive: false`, `studentSubmissionAcceptedAfterArchive: false`
3. **可攜性 grep**：`grep -rnE '(/Users/|/private/tmp)' functions/src/zuvioExams.ts functions/tests/zuvio-ext.test.cjs src/ClassroomInteraction.tsx` → 0 命中。
