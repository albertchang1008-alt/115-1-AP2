# #65 D1 單交易原子寫入／可重試清理與 V3 建場選擇序號修正報告（Hydrogen，2026-11-23）

## 給驗證者的摘要

- **分支與基底**：`.worktrees/zuvio-exams`（`feature/zuvio-exams`），基於 `60ad5c99`；保留 V1／V2／#61 關閉情緒匯入與保護題遮蔽，版本維持 `1.15.9`。
- **修改檔案**：`functions/src/zuvioExams.ts`、`src/zuvioApi.ts`、`src/ZuvioExams.tsx`、`src/ClassroomInteraction.tsx`、`functions/tests/zuvio-ext.test.cjs`、`tests/zuvio-mood-ui.test.ts`、`docs/zuvio-exam/EXT_V3D1_REFIX_R5_REPORT_2026-11-23.md`。
- **D1 P1（整場 300 人上限＋單交易原子寫入）**：`computeImport` 檢查去重後 `ids.length <= LIMITS.students`（300）；`zuvioImportResults` 改將全部明細寫入（≤300）、場次 metadata、分析摘要與預覽刪除放進同一 `db.runTransaction`（≤303 ops ≤ 500）。取消交易外預寫與失敗後整批 rollback，徹底杜絕預寫中斷殘留或交易逾時誤刪已提交 `gen`。
- **D1 P2（刪除／匯入後可追蹤與無重匯清理重試）**：交易中於場次標記 `pendingCleanup: true`（舊代需清理時），待 `cleanup` 完成再由 `clearPendingCleanup` 核對版本後清除；若 `cleanup` 失敗仍回傳 `{ ok: true }` 並保留 `pendingCleanup: true`，`ZuvioExams.tsx` 對 `!s.results && s.pendingCleanup` 提供「清理殘留成績」按鈕呼叫 `deleteResults` 完成清理。
- **V3 P2（建場與清單刷新序號保護）**：`createSitting` 以 `sameSelection(reqSeq, reqCourseId, reqExamId, reqSittingId)` 判斷成功與失敗更新；`refreshExams` 新增 `hasInteractedRef` 與 `sameSelection(reqSeq, reqCourseId, '', '')` 條件，同卷換場、切卷往返或手動清空選擇皆保留最新選擇。
- **相關測試與型別 PASS**：`npm --prefix functions run build` PASS（67 函式）、`./node_modules/.bin/tsc -b` PASS、`zuvio-ext.test.cjs` **17/17 PASS**（0 skipped）、`zuvio-mood-ui.test.ts` **6/6 PASS**（0 skipped）。
- **可攜性與未驗**：6 支修改檔 `grep -nHE '/Users/|/private/tmp|/tmp/'` 0 命中（`GREP_CLEAN`）、`git diff --check` PASS。全套 `npm run check`／`build`／`readability:check` 交 Gemini 3.8 Flash 新對話；Ubuntu 非 root、Firestore Emulator 與教師手機實點留待後續。
- **抽查 5 項**：① `functions/src/zuvioExams.ts:344-346,390-482`；② `src/ZuvioExams.tsx:252-255`；③ `src/ClassroomInteraction.tsx:1101-1215,1285-1305`；④ `functions/tests/zuvio-ext.test.cjs:1301-1404`；⑤ `tests/zuvio-mood-ui.test.ts:526-629`。

---

## 一、修正明細

| 項目 | 問題說明 | 修法說明 | 檔案與位置 |
|---|---|---|---|
| **D1 300 人上限** | 僅逐題檢查 `LIMITS.students`，跨題去重可能超過 300 人 | `computeImport` 新增 `ids.length > LIMITS.students` 檢查並拋出 `invalid-argument` | `functions/src/zuvioExams.ts:344-346` |
| **D1 原子提交** | 交易外預寫與例外刪除 `gen` 可能因預寫中斷殘留或交易逾時誤刪有效明細 | 將全部明細 `tx.set` 移入 `db.runTransaction`（≤303 ops），移除交易外預寫與 rollback | `functions/src/zuvioExams.ts:390-436` |
| **D1 清理追蹤** | 刪除後若 `cleanup` 失敗，教師頁無 `s.results` 導致無重試入口 | 場次增設 `pendingCleanup` 旗標與 `clearPendingCleanup`；`ZuvioExams.tsx` 顯示「清理殘留成績」呼叫 `deleteResults` | `functions/src/zuvioExams.ts:437-490`、`src/zuvioApi.ts:10`、`src/ZuvioExams.tsx:252-255` |
| **V3 建場與清單** | 建場回應僅比對考卷未比對 `seq`，且手動清空考卷後刷新會重選第一份 | `createSitting` 改用 `sameSelection(reqSeq, ...)`；`refreshExams` 以 `hasInteractedRef`＋`reqSeq` 保護初始自動選擇 | `src/ClassroomInteraction.tsx:1101-1215,1285-1305` |

## 二、相關測試結果

- `npm --prefix functions run build`：PASS（67 函式）。
- `./node_modules/.bin/tsc -b`：PASS（0 errors）。
- `node --test functions/tests/zuvio-ext.test.cjs`：**17/17 PASS**（0 fail, 0 skipped；含新增「整場 300 人上限」、「寫入中斷無殘留」、「提交成功但回應逾時不誤刪」、「刪除後無重匯直接重試完成清理」）。
- `./node_modules/.bin/tsx --test tests/zuvio-mood-ui.test.ts`：**6/6 PASS**（0 fail, 0 skipped；含新增「同卷換場 A2 → A1」、「切卷往返 e1 → e2 → e1/s1b」、「手動清空考卷」）。
- `grep -nHE '/Users/|/private/tmp|/tmp/'`：0 命中（`GREP_CLEAN`）；`git diff --check`：PASS。
