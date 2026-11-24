# #65 程式驗證 R2（Codex，2026-11-23）

## 給 Claude 的摘要

- **FAIL，退回 Antigravity（Hydrogen）**。V2 PASS，V3 與 D1 各有一項退修。
- 基準為 `.worktrees/zuvio-exams` 的 `feature/zuvio-exams`／`f43f596a`（1.15.9），比對前一輪 `86b165ee` 與本機 `origin/main`／`5e649242`。
- 本棒交付本報告，更新根目錄 `CODEX_QUEUE.md` #65 與 `docs/devlog/2026-W48.md`。程式、測試與既有報告皆保留。
- 本輪新增測試 **4/4 PASS**（後端 3、前端 1，0 fail、0 skipped）。Antigravity R2 原始 log 複核為前端 344、後端 151 零失敗，build PASS，閱讀規範 17/17 判定通過（均未變更跳過）。
- 偏離與未驗：Chromium 首次啟動被 macOS 沙箱阻擋，經核准在沙箱外重跑單項通過。退修問題由程式時序確認，本棒未加跑重播、全套檢查、Ubuntu 非 root、Firestore Emulator 或教師手機。
- 抽查 4 項：① 開啟與封存共用考卷交易讀取（後端 234–241、472–494）；② 舊回應可覆寫切換後的即時統計（前端 1122–1140、1166–1192、1208–1224、1273–1289）；③ 清理可刪掉較新代明細（後端 380–432）；④ 懶回填只核對目前代次，需補真實刪除與重匯回歸（後端 894–936、測試 1128–1146）。

## 逐項結果

| 項目 | 判定 | 驗證結果 |
|---|---|---|
| V2 開啟與封存競態 | **PASS** | 開啟交易重讀考卷與場次。封存先提交時開啟會拒絕，開啟先提交時封存會關閉同卷的 current。解除封存單獨更新考卷狀態，舊卡片維持關閉。一般結束的 3 秒寬限路徑仍在。參見 [封存交易](../../functions/src/zuvioExams.ts#L227)、[開啟交易](../../functions/src/zuvioExams.ts#L455)、[學生送出](../../functions/src/zuvioExams.ts#L631)、[回歸測試](../../functions/tests/zuvio-ext.test.cjs#L1015)。 |
| V3 部分選擇與即時統計 | **FAIL** | 測試涵蓋無場次考卷、清空場次、後端拒絕單參數、同卷跨場，以及 `closed:false` 的訊息。舊場統計仍可在切換後的畫面出現，未完成的操作回應也能把已清除的畫面填回。 |
| D1 同交易與懶回填 | **FAIL** | 分析計算失敗時保留預覽與原成績狀態，成功時成績 metadata、分析摘要及預覽消耗同交易提交。懶回填會重讀並核對目前的 `revision`／`gen`，可攔截已刪除或被換代的摘要寫入。交易後的成績明細清理仍可刪掉現行代次，讓 metadata 與摘要失去對應的成績。 |

## 退修項目

### V3（P2）切換場次後仍可顯示前一場的即時人數

完整切換 A 場到 B 場時，選單只更新 ID，畫面在 B 的查詢回來前仍直接渲染 A 的 `live`。清空場次或切到無場次考卷時，effect 會清除 `live` 並停止輪詢，但 `openMood` 與 `closeMood` 各自的非同步查詢不受 effect 的 `alive` 保護。若在 A 按結束，請求尚未回來時清空場次，A 的舊查詢仍會在清除後執行 `setLive(res)`。如果 A 仍開放（例如開啟操作的延遲回應），空白場次下的結束鈕也會因新寫入的舊 `live` 再度啟用。現有 UI 測試先切換、再按結束，且所有模擬查詢立即回傳，未涵蓋這個時序。 [更新與輪詢](../../src/ClassroomInteraction.tsx#L1122) · [開啟與結束回應](../../src/ClassroomInteraction.tsx#L1166) · [選單](../../src/ClassroomInteraction.tsx#L1205) · [結束鈕與人數](../../src/ClassroomInteraction.tsx#L1273) · [回歸測試](../../tests/zuvio-mood-ui.test.ts#L240)

修正時讓 live 顯示和操作都對應目前的選擇，並讓輪詢與操作回應共用選擇檢查。補兩個回歸：A 切 B 時延遲 B 查詢，及開啟／結束未回時切到無場次或清空，放行舊回應後統計仍應隱藏且結束應停用。

### D1（P1）延遲清理可以讓目前場次失去成績明細

匯入 A 提交後，清理仍會列出該場次所有結果，刪除 `gen !== A` 的文件。若 A 延遲到匯入 B 的有效代次與分析摘要提交後才查詢，B 的明細全符合刪除條件。刪除成績後呼叫 `cleanup(..., '')` 也會有同樣結果。舊代清理沿用既有程式，R2 同交易保障的摘要與成績 metadata 會留在 B，但報表依 B 的 `gen` 讀取時已無對應明細。現有 D1 測試只模擬懶回填前移除場次結果欄位，沒有呼叫實際刪除、提交新代或交錯清理。 [匯入與清理](../../functions/src/zuvioExams.ts#L380) · [刪除](../../functions/src/zuvioExams.ts#L419) · [明細讀取](../../functions/src/zuvioExams.ts#L973) · [目前測試](../../functions/tests/zuvio-ext.test.cjs#L1128)

清理應只處理該次切換已取代的代次，保護後續寫入與仍待提交的明細。補匯入 A → 匯入 B → A 延遲清理、刪除 → 重匯 → 刪除端延遲清理，以及舊報表懶回填與新代提交交錯的回歸。用目前代次的 metadata、摘要和實際明細一致作為驗證條件。另核對預覽及確認是否採用同一個包含 `deletedRevision` 的版本判斷，目前無有效成績時兩處都折回 `0`。 [預覽及確認](../../functions/src/zuvioExams.ts#L358)

## 執行與證據

- macOS、Node v22.23.2。以 Functions 本機 `tsc -p functions/tsconfig.json` 重編譯測試所需輸出；使用 `node --test --test-name-pattern='^V2 競態|^V3 後端|^D1 原子性' functions/tests/zuvio-ext.test.cjs` 得到 3 PASS；使用 `node --import tsx --test --test-name-pattern='^V3 UI' tests/zuvio-mood-ui.test.ts` 得到 1 PASS，兩次成功執行均 0 fail、0 skipped。
- `git diff --check HEAD^ HEAD` PASS。對 `origin/main..HEAD` 的 26 份新增及變更程式、測試、腳本與設定執行 `grep`，`/Users/` 與 `/private/tmp` 均 0 命中。
- Antigravity R2 原始結果以本機外部 log 複核。Functions 入口 67 個，版本一致 1.15.9，閱讀規範為 0 fail、0 issues、0 畫面重跑。 [R2 實跑報告](EXT_TEST_RUN_2026-11-23_r2.md) · [R2 原始 log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-23/zuvio-exam-r2/npm-run-check.log)
- 截圖保存至 2026-11-30（沿用前棒期限，本棒未新增或檢視截圖）。證據清理 dry-run 為 0 個可刪資料夾、0 MB。
- 根目錄 `python3 scripts/check_handoff.py` PASS，佇列 25/25 件，週誌與索引合規。
