# #65 修正後複審（Codex，2026-11-23）

## 給 Claude 的摘要

- **FAIL，退回 Hydrogen**。V1 PASS；V2、V3 的原案例 PASS，封存競態與教師選擇流程仍有缺陷；D1 的快取命中與失效 PASS，匯入／刪除一致性 FAIL。
- 基準為 `.worktrees/zuvio-exams`、`feature/zuvio-exams`／`86b165ee`，比對退修版 `fe9c31b9`，本機 `origin/main` 為 `5e649242`。版本為 1.15.9。
- 審查 `functions/src/zuvioExams.ts`、`src/ClassroomInteraction.tsx`、`src/zuvioApi.ts`、`functions/tests/zuvio-ext.test.cjs`；本棒新增複審報告、repo 外合成證據，更新根目錄 #65 與週誌。
- Functions build 67 入口 PASS，指定後端測試 11/11 PASS、0 skipped。Antigravity 同程式基準全套前 343、後 148 零 FAIL，build PASS，可讀 17/17 均為未變更跳過。
- 偏離與未驗範圍：加跑 memoryDb 合成重播，教師選擇畫面以程式路徑核對；Ubuntu 非 root、Firestore Emulator、教師手機與正式服務留待後續。
- 抽查 4 項：① V1 UID 與定稿鍵（後端 734–747、814–882）② V2 開啟／封存交易（227–242、454–488）③ V3 單參數請求與畫面（後端 510–519、前端 1122–1134、1265–1276）④ D1 提交順序與回填（後端 380–431、886–923）。

## 逐項結果

| 項目 | 判定 | 已驗證的行為及剩餘問題 |
|---|---|---|
| V1 名冊 UID 與考前練習 | **PASS** | 正式學生登入以小寫 email 寫 `profiles/{uid}`（`functions/src/index.ts:154`、`:199`–`:201`）；正式匯入名冊可以沒有 uid（同檔 `:380`–`:408`）。名冊缺 uid 時以 email 找到 profile 文件 ID，將原按班級／次單元／開考前取得的 attempts 與該 UID 的 progress 連回學號。舊定稿的 `prepVersion` 缺失會觸發重算。回歸與原重播均驗出已達標、覆蓋率 100；無 profile 維持 `none`。 |
| V2 封存情緒 | **FAIL** | 順序封存、封存其他卷、封存後學生讀寫阻擋、歷史情緒保留與一般結束 3 秒寬限均 PASS。開啟與封存交錯仍能寫入開放指標，解除封存後舊快篩復活。 |
| V3 同卷同場即時統計 | **FAIL** | 完整指定卷／場與兩者均省略時，狀態、分母和計數已一致。原 A 場回查為 2/2、關閉，另有不同考卷回歸。教師可以只選考卷或清空場次，這條正常 UI 路徑仍保留舊場畫面，結束操作也可能失去場次限制。 |
| D1 試題分析快取 | **FAIL** | 正常匯入會寫摘要；單場未篩選的報表和 CSV 命中同一快取。版本、revision、gen、maskedKey 任一不符會重算，多場動態彙總。匯入在分析成功前已提交成績，刪除也能被延遲寫入重建快取。 |

## 退修項目

### V2（P2）開啟與封存需要共用交易前提

`functions/src/zuvioExams.ts:461`–`:467` 在交易外讀考卷與名冊，`:481`–`:487` 的開啟交易只讀 classroomState。合成重播在開啟進入交易前暫停，先完成封存，再讓開啟繼續，結果開啟回報成功、current 存成 `open: true`。封存期間學生讀取仍被擋住，教師解除封存後學生重新取得舊卡片。

修正要求：開啟的交易內重新確認考卷未封存、場次有效；保留送出對考卷與 current 的交易檢查，以及獨立的一般結束寬限。補兩種交易順序與解除封存後不恢復舊卡片的回歸。

### V3（P2）部分選擇留下上一場統計與無指定場次的結束操作

`functions/src/zuvioExams.ts:515`–`:519` 對只帶其中一個 ID 的請求回 `invalid-argument`，此端點契約本身合理。教師選一份沒有場次的考卷，或在有考卷時把場次下拉選成空白（`src/ClassroomInteraction.tsx:1197`–`:1221`），前端卻會送出 examId 單參數（`:1122`–`:1134`、`src/zuvioApi.ts:296`–`:298`）。錯誤被忽略，畫面繼續顯示上個 `live`。若它仍開放，`:1265`–`:1276` 在 `sittingId` 空白時仍可啟用結束鈕；`:1176`–`:1184` 會送出沒有場次的結束請求，後端會結束實際 current（後端 `:491`–`:507`）。

修正要求：UI 明確處理選擇完整、選擇未完成與無選擇查看 current 三種情況。切換時舊資料不得顯示為新場資料，結束時應綁定畫面所示場次並處理 `closed: false`。補同卷跨場、切到沒有場次的卷、清空場次及結束前 current 改變的回歸。

### D1（P1）匯入回報失敗但成績已經生效

`functions/src/zuvioExams.ts:380`–`:392` 已切換有效 gen、消耗預覽並清理舊代，`:393`–`:406` 才讀保護題及題庫、計算並寫分析。既有保護名單查詢在正式測驗文件超過 50 筆時會拒絕（`:93`–`:98`）。以合成課程加入 51 筆空測驗文件後確認匯入，實際回 `failed-precondition`，但成績已生效、預覽剩 0、分析不存在。這條確認匯入路徑沒有情緒功能旗標條件，會影響 #61 的成績匯入。

### D1（P2）延遲寫入會在刪除後重建摘要

`functions/src/zuvioExams.ts:399`–`:406` 是交易外寫入，與 `:424`–`:431` 刪除不互斥。合成重播暫停已提交的匯入於分析前，完成刪除後再放行，結果成績仍已刪除但分析文件重新出現。報表／CSV 的懶回填（`:911`–`:920`）同樣直接 set，未於寫入時核對場次的目前 gen。讀取鍵檢查能拒絕不合版本的快取，無法防止延遲寫入覆蓋目前摘要。

修正要求：將分析的必要讀取與計算移到切換有效代次前，分析摘要與成績 metadata 同交易提交；懶回填必須核對目前 revision／gen 或採按代次隔離的寫法，讓刪除與較新的匯入能安全完成。補摘要失敗、覆寫新代與刪除交錯回歸；以 11/13 v3 四之三 F 與 #61 v2 9.5 為準。

## 執行與證據

- macOS／Node v22.23.2。執行 `npm --prefix functions run build`（67 函式入口）與 `node --test functions/tests/zuvio-ext.test.cjs`（11 PASS、0 fail、0 skipped）。
- `git diff --check fe9c31b9..86b165ee -- functions/src/zuvioExams.ts functions/tests/zuvio-ext.test.cjs src/ClassroomInteraction.tsx` PASS。相對 `5e649242` 的 23 份程式／測試／腳本，與另存的重播腳本，`grep -nHE '/Users/|/private/tmp'` 均 0 命中。
- Antigravity 全套結果來源為同工作樹 `EXT_FULLCHECK_RUN_2026-11-23.md`，採用其中前端 343、後端 148、build 與可讀性統計；本棒實跑範圍為後端建置、指定測試與合成重播。開工時兩份前棒報告 `EXT_CODEX_VERIFY.md`、`EXT_FULLCHECK_RUN_2026-11-23.md` 已在工作樹且未追蹤，予以保留。
- 合成資料在既有 memoryDb 執行，無正式讀寫。以 Node 22 執行 `node <證據目錄>/replay.cjs <工作樹>` 可重播。回傳 JSON 為觀察結果；退出碼 0 代表重播完成。 [重播腳本](/Users/HHC/.codex/visualizations/2026/11/23/01a2085c-c816-7013-bf06-133e4a3db8f1/zuvio-ext-rereview/replay.cjs) · [複審結果](/Users/HHC/.codex/visualizations/2026/11/23/01a2085c-c816-7013-bf06-133e4a3db8f1/zuvio-ext-rereview/replay-result.json) · [原案例回歸](/Users/HHC/.codex/visualizations/2026/11/23/01a2085c-c816-7013-bf06-133e4a3db8f1/zuvio-ext-rereview/original-replay-result.json)
- 截圖保存至 2026-11-30（沿用前棒期限，本輪未新增或檢視截圖）。本輪合成證據亦保存至同日；開工清理 dry-run 為 0 個可刪資料夾、0 MB。
