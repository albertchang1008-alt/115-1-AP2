# #65 程式驗證 R6（Codex，2026-11-23）

## 給 Claude 的摘要

- **PASS，交 Claude 最後驗收**。6 項審查均通過，R5 的 D1 P1 已修正。基準 `feature/zuvio-exams`／`a7dcb3a1`（R5 `62d31a44`），版本 `1.15.9`。
- `cleanupOnly` 依場次旗標與 revision 清除舊代明細，保留有效成績、摘要、預覽與 `deletedRevision`。待清理的場次即使已有有效成績，教師仍可使用清理按鈕。
- R6 新增後端測試 **1/1 PASS、0 fail、0 skipped**，涵蓋無重匯、舊分頁晚於重匯、重匯清理失敗三種情境。核對全套日誌前端 347／後端 155 全過、雙端建置 PASS、閱讀規範 17/17 指紋 PASS。
- 交件檔案為本報告、根目錄 `CODEX_QUEUE.md` 的 #65 與 `docs/devlog/2026-W48.md`。偏離無。前端按鈕與清理中途遇重匯採靜態核對。再次清理失敗時按鈕仍可重試，畫面沒有錯誤提示；不影響本輪隔離驗收。Ubuntu 非 root、Firestore Emulator 與教師實點本棒未驗。
- 抽查 5 項：①權限與模式 `functions/src/zuvioExams.ts:473–489`；②清理上界與旗標 `:442–471`；③按鈕與傳參 `src/ZuvioExams.tsx:253–254`、`src/zuvioApi.ts:289–290`；④三情境斷言 `functions/tests/zuvio-ext.test.cjs:1450–1507`；⑤ [R6 全套日誌](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r6/npm-run-check.log>)。

## 逐項結果

| 項目 | 判定 | 證據與界線 |
|---|---|---|
| 教師權限、輸入與一般刪除 | **PASS** | 兩種模式皆先走既有教師權限及 `zuvioExams` 旗標，白名單只新增選填布林 `cleanupOnly`。只有 `true` 進隔離模式，既有一般刪除呼叫維持原路徑。見 `functions/src/zuvioExams.ts:46–55,473–508`。 |
| 刪除後無重匯的清理 | **PASS** | 測試注入刪除後清理失敗，再以隔離模式重試。舊成績列清空、旗標移除，`deletedRevision` 保持原值。見 `functions/tests/zuvio-ext.test.cjs:1450–1463`。 |
| 舊分頁在重匯完成後重試 | **PASS** | 無旗標時早返 `{ ok: true, cleaned: false }`。測試確認新有效代、兩筆明細、摘要與待用預覽均保留。見 `functions/src/zuvioExams.ts:480–489`、`functions/tests/zuvio-ext.test.cjs:1465–1485`。 |
| 已有有效成績的清理重試 | **PASS** | 重匯清理失敗後仍可清掉舊代。測試確認有效代明細、分析摘要及預覽仍在，旗標移除。靜態核對清理分支沒有更新 `results` 或 revision，也沒有寫入摘要或預覽。見 `functions/src/zuvioExams.ts:442–489`、`functions/tests/zuvio-ext.test.cjs:1487–1507`。 |
| 清理執行中遇到較新提交 | **PASS** | 靜態核對：匯入及刪除在交易中遞增 revision；清理固定使用讀到的上界、只刪同場 `revision < targetRev` 的明細；清除旗標時交易重新比對版本。因此晚完成的舊清理保留新代明細及其待清理旗標。見 `functions/src/zuvioExams.ts:390–430,442–488,491–500`。 |
| 教師頁面重試入口 | **PASS** | 靜態核對：考卷明細帶回 `sittings`，只要 `pendingCleanup` 存在即顯示按鈕，點擊傳 `cleanupOnly:true`，成功後重讀考卷。一般刪除仍須確認。若 callable 拒絕，會停在 `await`，保留畫面與入口，沒有顯示錯誤提示；此路徑未作瀏覽器實點。見 `functions/src/zuvioExams.ts:117,211–224`、`src/ZuvioExams.tsx:216,251–254`、`src/zuvioApi.ts:147–157,289–290`。 |

## 執行與證據

- macOS、Node `v22.23.2`，使用現有 R6 Functions 編譯輸出。只執行下列新增測試，1/1 PASS、0 fail、0 skipped。三筆 `cleanup transient error` 為測試預期的故障注入。

```sh
node --test '--test-name-pattern=^D1 R6 隔離清理定序' functions/tests/zuvio-ext.test.cjs
```

- `git diff --check 62d31a44..a7dcb3a1` PASS。對 R6 的 4 份程式與測試及相對 `origin/main` 的 26 份程式、測試、腳本與設定，用 `grep` 查 `/Users/`、`/private/tmp`、`/tmp/` 均 0 命中。
- 全套採 Antigravity R6 原始日誌。前端 347／後端 155 全過，0 fail、0 skipped，Functions 67 個入口載入通過。Vite 原始日誌為 3.72 秒，實跑報告記 3.56 秒。閱讀規範 17/17 PASS，17 份依指紋沿用快取，0 issue、0 畫面重跑。證據保存至 2026-11-30，本棒無新增截圖，開工證據清理 dry-run 0 項。[R6 全套報告](EXT_TEST_RUN_2026-11-23_r6.md)
- 根目錄 `python3 scripts/check_handoff.py` PASS。
