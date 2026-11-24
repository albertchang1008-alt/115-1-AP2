# 給 Claude 的摘要

- **#65 複審 FAIL，退 Hydrogen。** V1、V2 PASS。V3 仍會顯示上一場統計，D1 的代次清理與重送會造成明細和摘要不一致。#61 另有可重現的成績確認匯入退步。
- 實測 `feature/zuvio-exams`／`f43f596a`。開工時 `86b165ee` 上已有 Hydrogen 修補，修補於全套檢查前提交。fetch 後 `origin/main` 仍是 `5e649242`，領先 13、落後 0。
- Node 22.23.2 兩處 `npm ci` PASS。全套 4 分 39.004 秒，前端 344/344、後端 151/151，測試 0 FAIL、0 skipped，兩端 build PASS。
- 閱讀規範另關快取實測 17/17 PASS、0 FAIL、0 skipped，共 4,864 個畫面，17 分 55.923 秒。
- 變更為本報告、根目錄 `CODEX_QUEUE.md` #65 與週誌。版本維持 1.15.9，**上線前依當時正式版定號**。
- 偏離與未驗範圍為採用開工期間已提交的修補、額外停用閱讀指紋實測、合成重播。Ubuntu 非 root、Firestore Emulator、正式環境及教師手機實點未驗。
- 抽查 5 項：① `functions/src/zuvioExams.ts:745–755,822–888` V1 ② 同檔 `:227–242,455–496,599–660` V2 ③ `src/ClassroomInteraction.tsx:1122–1140,1166–1197` V3 ④ 後端 `:363–432,894–936` D1 ⑤ #61 基準前後的 51 份保護名單重播。

## 基底與檢查

在 `.worktrees/zuvio-exams` 驗證。開工的四個本機程式／測試修改由 Hydrogen 後續提交為 `f43f596a`，本次 `npm run check` 於該提交完成後開始。保留他人未追蹤報告。並行的 Codex R2 複審亦判 V3 切場與 D1 清理退修，佇列 #65 以本輪實跑及重播的完整報告接續。已讀根目錄的 handoff、AI workflow、佇列、#65 交辦、v3 規畫及 #61 v2 規格，以及既有修正、合併與驗證報告。

`git fetch origin` 後 `origin/main` = `5e649242118b1f24371f42806b438a02f7753dc3`，已是受審分支的祖先，收工前再次 fetch 確認相同。點名實作／測試、120 上限驗證／測試與閱讀檢查／指紋測試相對正式基底一致。交叉核對點名的後端 exports、旗標、導航及 CSS 入口，並由全套測試驗證 120 可用、121 拒絕。#67 的後台開關仍屬獨立待上線補丁。

本輪保留 `1.15.9`。#67 點名後台開關與 ag2 平台目前皆占用 `1.15.10`，**上線前依當時正式版定號**。本輪未 push、合併 main 或部署。

| 指令／階段 | 結果 |
|---|---|
| 根目錄 `npm ci` | PASS，169 套件，4.627 秒 |
| `functions/` 的 `npm ci` | PASS，267 套件，2.485 秒 |
| `npm run check` | 退出 0，實耗 4 分 39.004 秒，macOS、Node 22.23.2、npm 10.9.8 |
| 前端測試 | 344/344 PASS，0 FAIL、0 skipped，259.220 秒 |
| 後端測試 | 151/151 PASS，0 FAIL、0 skipped，1.703 秒 |
| Build | Functions 編譯與 67 個入口載入 PASS。前端版本檢查、TypeScript、Vite PASS，Vite 打包 4.67 秒 |
| 全套內的 `readability:check` | 指紋驗證 17/17 PASS，按原本機制跳過量測 17 份，0 issues、0 staticIssues、0 errors |
| 另跑 `npm run readability:all -- --out <證據目錄>` | 退出 0。實測 17/17 PASS、0 FAIL、0 skipped，4,864 畫面，0 issues、0 staticIssues、0 errors，17 分 55.923 秒 |
| Zuvio 學生卡 | Playwright 在 390×844 預設與特大驗證初始、失敗重試、完成態，內文／選項字級、44 px 點擊區及無水平溢出 PASS |
| 可攜性與差異 | 對 `origin/main` 比對的 21 份程式／測試／腳本與 3 份 repo 外重播／檢查腳本，`grep -nHE '/Users/\|/private/tmp'` 0 命中。修補提交 `git diff --check 86b165ee..HEAD` PASS |

## V1–V3、D1 複審

| 項目 | 判定 | 核對結果 |
|---|---|---|
| V1 名冊 UID 與考前定稿 | PASS | `functions/src/zuvioExams.ts:745–755,822–888` 核對以 email 解析 profile UID、無 profile 維持未練、舊定稿版本失效。原 `replay.cjs` 得到 `passed`、覆蓋率 100、已定稿、報表 1 人，與預期一致。 |
| V2 開啟、封存與學生讀寫 | PASS | `:227–242,455–496,599–660` 核對開啟與封存共用考卷交易前提。原重播中封存後學生無卡且送出被拒。補充重播讓封存先完成，開啟回 `failed-precondition`，解除封存後學生仍無卡。套件測試亦通過反向順序、其他考卷與一般結束 3 秒寬限。 |
| V3 場次統計與教師選擇 | FAIL | `:518–573` 核對原 A／B 場回查為同一場，關閉 A 場仍為 2/2。單參數拒絕，空選可查看 current，單純清空下拉及 `closed:false` 的 UI 回歸通過。另見下方非同步回覆缺陷。 |
| D1 匯入與分析快取 | FAIL | `:363–406,894–936,1012–1015,1267–1271` 核對成績指標、摘要與預覽同交易，延遲回填重驗當前代次，合成重播確認較新匯入的摘要未被覆蓋。報表／CSV 共用快取，版本、revision、gen、遮蔽鍵改變各會重算，合併或依班篩選仍動態分析。成績列仍有代次競態，另有 #61 匯入退步。 |

## 退修項目

1. **D1／P1，已確認的新成績可被較早操作的清理刪除。** `functions/src/zuvioExams.ts:407–432` 的 `cleanup` 刪除同場所有非呼叫方 `keepGen` 的成績列。合成重播在舊匯入提交後暫停清理，讓第二次匯入成功，再放行舊清理。另一重播在刪除提交後暫停清理，再讓新匯入完成。兩案均得到新代次明細 0 列、匯入 metadata 1 人、分析 1 人、成績報表 0 人。以交易限定退役代次，並驗證舊匯入和舊刪除均無法移除新的有效或待提交代次。
2. **D1／P1，確認失敗仍可改寫已生效的成績。** `:366–406` 在核對預覽前使用 `previewId` 作成績代次並先落列。以不同答案重送已成功消耗的預覽，得到 `failed-precondition`，成績報表答對人數卻由 1 變 0、快取答對率仍是 1。另在空場次建立預覽、刪除，再確認舊預覽，仍被接受。預覽建立和確認的 revision 都須反映刪除代次。失敗、過期、竄改或重送不得改動有效成績與摘要。
3. **#61／P1，D1 新增的保護名單讀取阻斷既有確認匯入。** `:93–98,366–373` 的合成案例在預覽完成後，以 51 筆空正式測驗文件觸發上限，且 `zuvioMood=false`。#61 基準 `9389e5d0` 的 handler 已確認可匯入，現版拒絕並保留預覽，成績無法回收。這與修正後「摘要失敗不半提交」同時成立。修正應保留題目遮蔽檢查，並讓原本可匯入的有效成績可完成，補同條件前後的回歸。
4. **V3／P2，較早操作回覆覆蓋教師目前所選場次。** `src/ClassroomInteraction.tsx:1166–1197,1205–1223,1281–1289` 的開啟／結束流程用發送時的選擇重抓，再直接 `setLive`。Playwright 在 A 場按結束並延遲回覆，切換到 B 且看到 3/4，再送回 A 的成功回覆。下拉仍為 B，統計變成 A 的 1/2。將畫面與操作回覆綁定當前課程、考卷及場次，補延遲開啟與結束期間切換的回歸。

## #61 基本功能與證據

- 出題常態路徑 PASS。匿名 W8 出題 CSV 逐位元一致，建立與重新下載一致，考卷建立冪等、題庫保護與班級限制已由現有測試覆蓋。
- 成績回收常態路徑 PASS。匿名 W8 XLSX bytes 經解析、對卷與選項還原，每題答對數一致。預覽不改成績、確認後報表、拒錯卷、順序重匯與刪除、雙場比較通過。**完整回歸 FAIL**，以上四項退修中的成績問題仍影響 #61。
- 依原報告重播 `zuvio-ext-review/replay.cjs` 退出 0，原 V1–V3 觀察值全數符合預期。另執行上一輪 `zuvio-ext-rereview/replay.cjs`，舊腳本在 V2 預設開啟會成功，遇修正後的 `failed-precondition` 退出 1。補充腳本有接住該預期拒絕，並執行其餘快取鍵與一致性案例。第一次 UI 探針未量到開啟競態，報告採可穩定重播的結束案例。
- 合成記憶體資料庫與 Playwright mock 無正式寫入。原始輸出及截圖存於 repo 外的本次 `zuvio-fullcheck` 證據資料夾，保存至 2026-11-30。截圖保存至 2026-11-30，17 份各存 390 開場預設與特大各一張，共 34 張，只作存證。為此使用外部 Node 載入鉤子限制出圖，量測、判定與指紋檔仍用原程式。開工證據清理 dry-run 為 0 個可刪目錄、0 MB。

- 執行輸出：[完整 check](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/npm-run-check.log)、[閱讀實測](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/readability-all.log)、[閱讀實測摘要](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/readability-all/summary.json)、[原重播](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/original-replay.json)、[補充重播結果](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/fullcheck-replay.json)、[#61 對照結果](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/baseline-import-replay.json)、[教師切換重播](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/v3-ui-replay.json)。
- 重播指令為 `node <證據目錄>/fullcheck-replay.cjs "$PWD"`，附 `9389e5d0` 可重跑 #61 舊 handler 對照。UI 重播以 `node <證據目錄>/v3-ui-replay.cjs` 從工作樹執行。先安裝兩處依賴並建置 Functions。 [後端重播腳本](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/fullcheck-replay.cjs) · [UI 重播腳本](/Users/HHC/.codex/visualizations/2026/11/23/01a2086c-6f9d-7eb2-a076-dcbb2fbcce75/zuvio-fullcheck/v3-ui-replay.cjs)

## 交給下一個 AI

```text
對象　Antigravity／Hydrogen，佇列 #65（合批 #61）

目標　修正 Zuvio 成績一致性、原本可用的確認匯入以及教師場次切換。

背景　根目錄 /Users/HHC/Documents/ChatGPT/課程平台1.0。
先讀根目錄 handoff.md、CODEX_QUEUE.md #61／#65、docs/AI_WORKFLOW_PLAN.md、
CODEX_TASK_zuvio-ext_2026-11-13.md、docs/zuvio-exam/ZUVIO_EXAM_SPEC_1.16.0.md §9.5
及 MOOD_CHECK_PLAN_2026-11-13.md 四之三 F。
在 .worktrees/zuvio-exams 的 feature/zuvio-exams／f43f596a 工作。
讀工作樹 docs/zuvio-exam/EXT_CODEX_FULLCHECK_2026-11-23.md 與
EXT_V2V3D1_REFIX_REPORT_2026-11-23.md。以全套複審報告所附腳本重播和比對。

限制　先確認分支與 git status，保留他人工作。不得 push、合併 main、部署或操作正式資料。
暫用 1.15.9，上線前依當時正式版定號。保留點名、單元上限 120 與閱讀檢查。
測試暫存用 os.tmpdir()／RUNNER_TEMP，只用合成或去識別夾具，不放寬閱讀規範或保護題遮蔽。

完成標準　舊匯入與刪除清理不得移除後來的有效或待提交代次。
預覽確認失敗、內容改變或刪除前建立的過期預覽不得改寫成績、影響目前摘要。
修復在情緒旗標關閉、51 份正式測驗資料下的 #61 確認匯入退步。
教師切換卷／場後，較早的開啟或結束回覆不得覆蓋當前畫面。
補回歸、重播，並用 Node 22.23.2 跑 npm run check。報告含變更與證據。
根目錄佇列只更新 #65，修後停-等Codex，再由 Codex 複審決定是否交 Claude。
用 scripts/devlog.py add 寫週誌，scripts/check_handoff.py 必須通過。
最後同樣附可整段貼用的「交給下一個 AI」prompt。
```
