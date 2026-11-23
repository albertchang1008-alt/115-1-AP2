# #65 D1 隔離清理殘留成績重試修正報告（Hydrogen，2026-11-23）

## 給驗證者的摘要

- **分支與基底**：`.worktrees/zuvio-exams`（`feature/zuvio-exams`），基於 `62d31a44`；保留已驗過的 D1 單交易原子提交、#61 關閉情緒匯入／保護題遮蔽與 V3 行為，版本維持 `1.15.9`。
- **修改檔案**：`functions/src/zuvioExams.ts`、`src/zuvioApi.ts`、`src/ZuvioExams.tsx`、`functions/tests/zuvio-ext.test.cjs`、`docs/zuvio-exam/EXT_V3D1_REFIX_R6_REPORT_2026-11-23.md`。
- **後端 `cleanupOnly` 隔離**：`zuvioDeleteResults` 支援白名單選填布林 `cleanupOnly`。當 `cleanupOnly === true` 時，伺服器讀取場次狀態核對 `pendingCleanup`，若未設旗標則安全回傳 `{ ok: true, cleaned: false }`；若已設旗標則以已確認之 `Math.max(results?.revision || 0, deletedRevision || 0)` 為上界呼叫 `cleanup` 只刪舊代明細，再由 `clearPendingCleanup` 依版本吻合才清除旗標，**完全不動有效成績、分析摘要、預覽或 `deletedRevision`**。
- **前端重試入口**：`src/zuvioApi.ts` 與 `src/ZuvioExams.tsx` 對所有 `s.pendingCleanup` 為 `true` 的場次（含已有有效成績時）顯示「清理殘留成績」並呼叫 `deleteResults(examId, s.id, true)`。
- **相關測試與型別 PASS**：`npm --prefix functions run build` PASS（67 函式）、`./node_modules/.bin/tsc -b` PASS、`zuvio-ext.test.cjs` **18/18 PASS**（0 skipped；涵蓋刪除後無重匯、舊分頁重試晚於新匯入、重匯後清理失敗再重試）。
- **可攜性與未驗**：4 支修改檔 `grep -nHE '/Users/|/private/tmp|/tmp/'` 0 命中（`GREP_CLEAN`）、`git diff --check` PASS。全套 `npm run check`／`build`／`readability:check` 交 Gemini 3.8 Flash 新對話；Ubuntu 非 root、Firestore Emulator 與教師手機實點留待後續。
- **抽查 5 項**：① `functions/src/zuvioExams.ts:473-495`；② `src/zuvioApi.ts:39,147-159,289-290`；③ `src/ZuvioExams.tsx:252-255`；④ `functions/tests/zuvio-ext.test.cjs:1407-1505`；⑤ `zuvio-ext.test.cjs` 18/18 實跑結果。

---

## 一、修正明細

| 項目 | 問題說明 | 修法說明 | 檔案與位置 |
|---|---|---|---|
| **後端隔離** | 「清理殘留成績」呼叫一般 `zuvioDeleteResults` 會遞增 `deletedRevision` 並刪除新匯入成績 | 白名單新增選填 `cleanupOnly?: boolean`；`cleanupOnly === true` 僅核對 `pendingCleanup` 與當前版本上界 `targetRev`，只刪 `rev < targetRev` 舊代明細並在版本吻合時清除旗標 | `functions/src/zuvioExams.ts:473-495` |
| **前端重試** | `ZuvioExams.tsx` 僅在 `!s.results && s.pendingCleanup` 顯示重試且呼叫一般刪除 | 改為 `s.pendingCleanup` 即顯示「清理殘留成績」（場次已有有效成績時亦顯示），並傳入 `cleanupOnly: true` | `src/zuvioApi.ts:39,147-159,289-290`、`src/ZuvioExams.tsx:252-255` |

## 二、相關測試與檢查結果

- `npm --prefix functions run build`：PASS（67 函式）。
- `./node_modules/.bin/tsc -b`：PASS（0 errors）。
- `node --test functions/tests/zuvio-ext.test.cjs`：**18/18 PASS**（0 fail, 0 skipped；含新增 `D1 R6 隔離清理定序` 三情境）。
- `grep -nHE '/Users/|/private/tmp|/tmp/'`：0 命中（`GREP_CLEAN`）；`git diff --check`：PASS。
