# #65 程式驗證 R4（Codex，2026-11-23）

## 給 Claude 的摘要

- **FAIL，退回 Antigravity（Hydrogen）**。6 個審查項目中 3 PASS、3 FAIL。基準 `.worktrees/zuvio-exams`、`feature/zuvio-exams`／`60ad5c99`，上一輪 `3f8ac043`，版本 1.15.9。
- R4 新增的後端和 Playwright 測試各 1 項，**2/2 PASS、0 fail、0 skipped**。Antigravity 全套原始日誌核對前端 346、後端 153 全過、雙端 build PASS。閱讀規範 17/17 指紋通過，17 份依快取跳過量測。
- **D1 P1**：交易例外可觸發刪除該次所有明細，即使提交已落地、只遺失回應。回收批次若失敗，遭拒的匯入仍可留下成績明細。
- **D1 P2**：刪除後清理出錯只記警告，後續得對同場操作才會重試，教師原本的刪除鈕已隱藏。
- **V3 P2**：情緒統計的 A → B → A 隔離通過。建場回應只比對課程與考卷，晚到時可覆蓋同卷切場或切卷往返後的選擇。
- 本棒只新增本報告、更新根目錄 `CODEX_QUEUE.md` 的 #65 與 `docs/devlog/2026-W48.md`。偏離與未驗：Chromium 首次被沙箱阻擋，核准重跑通過。退修項目由程式時序判定，Ubuntu 非 root、Firestore Emulator 與教師手機實點留待後續。
- 抽查 5 項：① 後端提交與回收 `functions/src/zuvioExams.ts:389–436`；② 刪除與清理 `:438–481`；③ 統計序號 `src/ClassroomInteraction.tsx:1101–1120,1157–1180,1216–1264`；④ 建場與刷新 `:1135–1151,1184–1214,1274–1301`；⑤ 新增測試 `functions/tests/zuvio-ext.test.cjs:1213–1299`、`tests/zuvio-mood-ui.test.ts:404–524`。

## 逐項結果

| 項目 | 判定 | 證據與界線 |
|---|---|---|
| D1 確定拒絕且回收批次成功 | **PASS** | 預檢後刪除與同版並行確認兩種時序均執行。拒絕的 `gen` 已移除，先提交的一代明細及摘要保留。見 `functions/tests/zuvio-ext.test.cjs:1230–1270`。 |
| D1 寫入、提交與回收一致性 | **FAIL** | 交易拋錯即按該次 `gen` 刪明細，未確認該代是否已成為有效代。預寫批次在 `try` 外，回收批次出錯也只有日誌。見 `functions/src/zuvioExams.ts:389–436`。 |
| D1 已知提交成功後的 callable 回覆 | **PASS** | 匯入與刪除的舊代清理出錯時仍回 `ok:true`。後續同場匯入可清走較低 revision。見 `functions/src/zuvioExams.ts:438–481`、`functions/tests/zuvio-ext.test.cjs:1272–1298`。 |
| D1 刪除後實際清理的恢復 | **FAIL** | 查詢或批次刪除出錯後，同場若無後續操作，原成績可持續留在 Firestore。教師畫面已隱藏刪除鈕。見 `functions/src/zuvioExams.ts:446–481`、`src/ZuvioExams.tsx:251–254`。 |
| V3 統計回應序號與單向跨卷建場 | **PASS** | A → B → A 放行舊查詢後保留新的 2/2。請求順序也阻擋較晚回來的舊查詢覆寫已套用的新結果。在 A 建場後停在 B，欄位與後續開啟請求仍使用 B 的場次。見 `src/ClassroomInteraction.tsx:1101–1120,1157–1180`、`tests/zuvio-mood-ui.test.ts:495–519`。 |
| V3 建場回應的場次及選擇序號 | **FAIL** | 建場完成與失敗訊息只比對課程及考卷。同卷切場、清空場次或切卷再回原卷時，舊建場仍能覆蓋當前選擇。見 `src/ClassroomInteraction.tsx:1184–1214,1274–1301`。 |

### D1 P1　交易回報異常時，回收可刪到已提交的有效明細

`functions/src/zuvioExams.ts:411–423` 提交有效 `gen`、摘要與預覽消耗。若伺服器已提交，但呼叫端收到提交逾時而交易最終拋錯，`:425–436` 便直接刪除這個 `gen` 的全部明細。這是依 gRPC 逾時語意和程式路徑推得的結果。本棒未連真實 Firestore 注入故障。明細被刪後，摘要和場次仍指向該 `gen`，報表在 `:1021–1024` 按 `gen` 取得空集合。現有測試只讓交易在前置條件處確定拒絕，並讓回收成功。 [gRPC 狀態碼](https://grpc.io/docs/guides/status-codes/#full-list-of-status-codes) · [提交與回收](../../functions/src/zuvioExams.ts#L400) · [明細查詢](../../functions/src/zuvioExams.ts#L1021) · [回歸測試](../../functions/tests/zuvio-ext.test.cjs#L1230)

另外，`:394–398` 的預寫在例外處理範圍外。#61 規格 §9.5 定義一場上限 300 人，但現有驗證在 `:305–317` 是每題上限，`shared/zuvio.ts:197–215` 再合併跨題學號，沒有整場 300 人檢查。若得到多個寫入批次，前批成功、後批失敗就會在到達例外處理前留下明細。交易確定拒絕且回收寫入同時失敗時，`:433–436` 也只記警告，沒有可重試的回收狀態。 [預寫](../../functions/src/zuvioExams.ts#L389) · [逐題人數上限](../../functions/src/zuvioExams.ts#L305) · [合併各題學號](../../shared/zuvio.ts#L197)

補修時按 §9.5 核對整場人數與交易邊界。若保留預寫，應先能辨別已提交與未提交，再回收確定無效的 `gen`，且回收中斷後可續作。補提交已落地但回應逾時、預寫或回收中斷的定序測試，核對預覽、場次 metadata、實際成績列與摘要。

### D1 P2　刪除後清理失敗，原始明細沒有可依賴的重試入口

`functions/src/zuvioExams.ts:466–481` 清掉場次指標與分析摘要後，清理失敗仍回成功。這解決已提交狀態的誤報，但日誌是唯一的失敗記錄，下一次清理得等同場再次匯入或刪除。教師頁只有 `s.results` 存在才顯示刪除鈕，教師刪完就離開時，原始答案與分數可持續留存。現有測試在清理恢復後再匯入，驗到的是重匯可清舊代。補可持續追蹤的重試或教師可用的重試入口，驗證刪除後即使沒有再匯入，也能清完該場舊代。 [刪除後清理](../../functions/src/zuvioExams.ts#L459) · [教師刪除鈕](../../src/ZuvioExams.tsx#L251) · [現有恢復測試](../../functions/tests/zuvio-ext.test.cjs#L1272)

### V3 P2　建場回應仍可覆蓋較新的選擇

教師在 A 卷 A1 場按「立即建場次」，回覆前改選同卷 A2。場次選單會增加 `selectionSeqRef`，但建場在 `src/ClassroomInteraction.tsx:1199–1205` 只比較課程／考卷，仍會自動跳到新建的場次並清掉 A2 的即時統計。A → B → A 或清空場次亦同。另 `:1135–1148` 的清單回覆遇到教師手動清空考卷時，仍會把第一份考卷設回選擇。建場的成功、失敗及刷新後的自動選擇需使用相同的選擇序號條件。清單可更新以顯示新場次，原有選擇由教師保留。補同卷換場、切卷往返與清空選擇的延遲回覆測試。 [建場回應](../../src/ClassroomInteraction.tsx#L1184) · [刷新考卷](../../src/ClassroomInteraction.tsx#L1135) · [場次下拉選單](../../src/ClassroomInteraction.tsx#L1292) · [既有跨卷測試](../../tests/zuvio-mood-ui.test.ts#L506)

## 執行與證據

- macOS、Node v22.23.2，後端使用既有 R4 編譯輸出。執行下列兩項，各 1/1 PASS、0 fail、0 skipped。首次 Chromium 啟動遭 macOS 沙箱拒絕，經核准以同一指令在沙箱外重跑通過。

```sh
node --test '--test-name-pattern=^D1 定序防護' functions/tests/zuvio-ext.test.cjs
node --import tsx --test '--test-name-pattern=^V3 定序回歸' tests/zuvio-mood-ui.test.ts
```

- `git diff --check 3f8ac043..60ad5c99` PASS。對 R4 的 4 份及相對 `origin/main` 的 26 份程式、測試、腳本與設定自查 `/Users/|/private/tmp`，均 0 命中。
- 全套採用 Antigravity R4 日誌，核對版本 1.15.9、Functions 67 個入口、Vite build PASS，以及閱讀規範 0 issue、0 畫面重跑。Vite 耗時以原始日誌的 3.58 秒為準，R4 實跑報告寫 3.47 秒。截圖保存至 2026-11-30（沿用前棒期限，本棒無新增截圖）。開工證據清理 dry-run 為 0 項。 [R4 實跑報告](EXT_TEST_RUN_2026-11-23_r4.md) · [R4 完整日誌](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r4/npm-run-check.log>)
- 根目錄 `python3 scripts/check_handoff.py` PASS。
