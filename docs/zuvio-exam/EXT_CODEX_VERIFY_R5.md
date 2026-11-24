# #65 程式驗證 R5（Codex，2026-11-23）

## 給 Claude 的摘要

- **FAIL，退回 Antigravity（Hydrogen）**。6 項審查中 5 PASS、1 FAIL。基準 `.worktrees/zuvio-exams`、`feature/zuvio-exams`／`62d31a44`（R4 `60ad5c99`），版本 1.15.9。
- D1 整場 300 人上限與單交易提交 PASS。R5 新增測試 2/2 PASS、0 fail、0 skipped。Antigravity 全套日誌核對前端 347／後端 154 全過、雙端建置 PASS、閱讀規範 17/17 指紋 PASS。
- **D1 P1**：舊分頁的「清理殘留成績」呼叫一般刪除。若另一分頁已重新匯入，這次重試會清掉新成績指標、摘要及明細。重匯清理失敗且仍有有效成績時，畫面也沒有清理入口。
- V3 建場成功與失敗皆受選擇序號保護。實跑同卷換場、切卷往返及手動清空考卷均保留較新的操作。
- 交件檔案為本報告、根目錄 `CODEX_QUEUE.md` 的 #65 與 `docs/devlog/2026-W48.md`。驗證界線：Chromium 首次受 macOS 沙箱阻擋，核准後重跑通過；P1 依程式時序判定。Ubuntu 非 root、Firestore Emulator 與教師手機實點本棒未驗。
- 抽查 5 項：①跨題人數與寫入 `functions/src/zuvioExams.ts:344–345,390–430`；②清理與版本 `:431–491`；③重試按鈕與 API `src/ZuvioExams.tsx:251–255`、`src/zuvioApi.ts:284`；④建場與清空 `src/ClassroomInteraction.tsx:1141–1157,1191–1222,1282–1317`；⑤新增測試 `functions/tests/zuvio-ext.test.cjs:1301–1406`、`tests/zuvio-mood-ui.test.ts:526–631`。

## 逐項結果

| 項目 | 判定 | 證據與界線 |
|---|---|---|
| D1 整場 300 人上限 | **PASS** | 預覽與確認共用 `computeImport`。以跨題去重後的作答學號計數，超過 300 人會在名冊查詢與產生預覽前拒絕。新增測試涵蓋每題皆未超限、整場合計 301 人。正向提交夾具為 2 人，恰好 300 人由程式條件核對。見 `functions/src/zuvioExams.ts:344–347,357–365`、`functions/tests/zuvio-ext.test.cjs:1319–1343`。 |
| D1 單交易原子提交 | **PASS** | 在交易內核對預覽、場次、revision、雜湊與封存後，寫入最多 300 筆明細、1 筆場次 metadata、至多 1 筆摘要並消耗 1 筆預覽，共最多 303 次寫入。交易內寫入拋錯時，新增測試核對明細未寫入、預覽仍在。模擬已提交但回應逾時，核對有效代、明細、摘要及預覽一致。見 `functions/src/zuvioExams.ts:390–430`、`functions/tests/zuvio-ext.test.cjs:1345–1370`。 |
| D1 刪除後無重匯可完成清理 | **PASS** | 查詢失敗後 `pendingCleanup` 保留，考卷頁會顯示入口。新增測試在沒有中途重匯時直接重試，舊列清空且旗標移除。旗標清除交易有 revision 檢查。見 `functions/src/zuvioExams.ts:442–458,479–496`、`src/ZuvioExams.tsx:254`、`functions/tests/zuvio-ext.test.cjs:1372–1405`。 |
| D1 清理重試對新成績的保護 | **FAIL（P1）** | 清理按鈕仍打 `zuvioDeleteResults`。後端用目前最新狀態另做一次刪除，故過期分頁的重試可刪除較新匯入。重匯後若仍需清理，現有按鈕條件也會隱藏重試入口。見 `src/ZuvioExams.tsx:253–254`、`src/zuvioApi.ts:284`、`functions/src/zuvioExams.ts:473–491`。 |
| V3 建場選擇序號 | **PASS** | 送出時記錄序號、課程、考卷與場次，清單刷新後再比對才更新選擇與成功訊息；失敗訊息使用同一條件。同卷換場和切卷往返實跑通過。往返測試最後換了場次；回到完全相同 ID 時的保護採選擇序號靜態確認。見 `src/ClassroomInteraction.tsx:1116–1120,1191–1222`、`tests/zuvio-mood-ui.test.ts:591–614`。 |
| V3 手動清空保護 | **PASS** | 清單自動選取限於未互動且請求時序仍相符的空白選擇。兩個下拉都同步更新序號與互動標記。新增測試驗證清空考卷後，晚到的建場及清單刷新仍維持兩欄空白；單獨清空場次的建場保護由相同序號條件核對。見 `src/ClassroomInteraction.tsx:1141–1157,1282–1317`、`tests/zuvio-mood-ui.test.ts:616–625`。 |

## D1 P1　重試清理可刪除後來匯入的成績

1. 分頁 A 刪除成績後，清理暫時失敗。A 取得 `pendingCleanup:true`、沒有 `results` 的場次狀態並顯示「清理殘留成績」。[考卷明細](../../src/ZuvioExams.tsx#L251) · [刪除與清理](../../functions/src/zuvioExams.ts#L479)
2. 分頁 B 匯入同場新成績。交易寫入新 `results`、分析摘要與新代明細。就算 B 的清理已完成並清除旗標，A 持有的考卷資料仍可顯示舊按鈕。[考卷明細讀取](../../src/ZuvioExams.tsx#L216) · [匯入交易](../../functions/src/zuvioExams.ts#L396)
3. A 點舊按鈕，只帶考卷與場次識別呼叫 `zuvioDeleteResults`。後端以 B 的 revision 加一，移除 `results` 與分析摘要，再刪除所有低於新刪除版本的列，包含 B 剛提交的新代明細。後段清除旗標的 revision 檢查發生在這些變更之後。若重匯後清理本身失敗，`results` 存在的畫面也只顯示一般刪除。新增測試只涵蓋無重匯的清理重試，因此可全部通過。[按鈕](../../src/ZuvioExams.tsx#L253) · [API](../../src/zuvioApi.ts#L284) · [後端](../../functions/src/zuvioExams.ts#L473) · [測試](../../functions/tests/zuvio-ext.test.cjs#L1372)

請以只能清理舊代的後端操作處理重試。由伺服器核對場次、`pendingCleanup` 與適用的 revision，使用已確認的版本作清理上界，保留有效 `results`、分析摘要、明細與預覽；清理完成後只在版本吻合時清掉旗標。`pendingCleanup` 存在時，教師能從考卷頁安全重試，包括場次已有新成績的情況。補定序測試涵蓋「刪除後未重匯」、「A 的舊清理在 B 重匯後送達」與「重匯後清理失敗，重試仍保留目前有效代」。

## 執行與證據

- macOS、Node v22.23.2。使用現有 R5 Functions 編譯輸出，只執行本輪新增兩項測試，各 1/1 PASS、0 fail、0 skipped。後端出現預期的 `cleanup transient error` 故障注入警告。前端首次於沙箱因 Chromium `bootstrap_check_in` 權限被拒而未進入測試，核准後以原指令重跑通過。

```sh
node --test '--test-name-pattern=^D1 R5 邊界' functions/tests/zuvio-ext.test.cjs
node --import tsx --test '--test-name-pattern=^V3 R5' tests/zuvio-mood-ui.test.ts
```

- `git diff --check 60ad5c99..62d31a44` PASS。可攜性 `grep` 比對 `/Users/`、`/private/tmp`、`/tmp/`，R5 變更的 6 份程式／測試及相對 `origin/main` 的 26 份程式／測試／腳本／設定，均 0 命中。
- 全套採 Antigravity R5 原始日誌，確認版本 1.15.9、Functions 67 個入口、前端 347／後端 154 全過、0 fail／0 skipped。Vite 日誌為 3.63 秒，實跑報告記 3.61 秒。閱讀規範 17/17 PASS，17 份沿用指紋快取，0 issue、0 畫面重跑。證據保存至 2026-11-30，本棒無新增截圖，開工證據清理 dry-run 0 項。[R5 全套報告](EXT_TEST_RUN_2026-11-23_r5.md) · [R5 原始日誌](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r5/npm-run-check.log>)
- 根目錄 `python3 scripts/check_handoff.py` PASS，佇列 25／25 件，週誌與索引合規。
