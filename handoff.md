# 專案交接（現況）
目前版本：1.9.0
> 本檔是 unify worktree 的交接；其他教材任務見原工作目錄的 handoff.md。歷史見 DEVELOPMENT_LOG.md。

## 開工規則
1. 開工讀本檔與 git log -5；改動前確認分支。
2. 未經教師授權，不 push、合併／部署 main；不執行正式 migration。
3. 收工更新 handoff.md／DEVELOPMENT_LOG.md；commit 結尾 [Codex]；不可略過測試。
4. Claude 獨立驗收，Codex 實作，教師決定課程內容與部署。

## 目前任務（2026-10-13）
- worktree：`.worktrees/unify-1.9.0`；分支 `feature/1.9.0-unify`，基底 `origin/main@a593796`。
- 78cb5dc 已獲 Claude 有條件通過；M-1／m-1／m-2／m-4 修正完成，待 Claude 複驗；最後 commit 用 `git log -1` 查閱。沒有 push／部署／正式 migration apply。
- 手動移植：54a1d3c 題庫分離、ec8947f 反思、fe814dd／c33dbe7 正式前後測、1b3b4fe 控制台、c2c1b1e／70354e0 互動、d48aac8 續播與種類切換修正。沒有 merge MI 網站分支。
- 反思兩項必修已修：文字換行正規化／保留，未作答名單優先 uid／studentId，換 email 不誤列。
- 共用 API features 權限、課程前後測來源設定、私有簡報、資料驅動互動／獨立教師互動設定頁已完成。私有題庫隔離不因開關關閉而解除。
- 學生說明已完成：純靜態 guide、登入／首頁入口、一次性三張提示，18 張測試班截圖（重拍，標籤白底帶在畫面外側）；兩站各有 1280／390 建置截圖與驗證。
- 兩站完整 check 最終結果與畫面證據見 `docs/UNIFY_1.9.0_REPORT.md`、`docs/unify-1.9.0/check-{ap2,mi}.txt`。
- MI dry-run 見 `docs/unify-1.9.0/migration-dry-run.json`；12 題與原常數逐字一致。MI 舊簡報選項指示轉換也移到 migration 資料，共用程式不含 MI 課程內容。
- M-1 的 presentationSnap 修正與假 Firestore CLI apply 回歸測試完成；SDK／憑證不載入、網路封鎖，JSON 完全一致且無 snapshot 欄位。
- m-1 來源任一空白保存成功後提醒；m-2 明示保存草稿即對學生生效、不需發布；桌機／手機均驗證。
- 兩站完整 check：前端157／Functions54 全過、0 skipped；guide 圖片585690 bytes、最小字級12.25px、無溢位／外部請求。
- 正式資料沒有讀寫；上線後的舊紀錄核對尚未執行。
- 原工作目錄仍是 feature/respiratory-infographics@e8805f8，其未提交教材改動保留；不要從原工作目錄發布本版。

## 固定決策
1. **兩課程共用 1.9.0 主程式；新功能以課程 features 開關；網站差異只放在建置設定。**
2. `features.assessments / teachingConsole / classroomInteraction` 預設全關；根課程文件是後端權威，教師保存課程功能設定生效。
3. `VITE_SITE_ID=ap2|mi`，預設 AP2。AP2 保留完整教材；MI 只發布微免兩份教材與 site-assets/mi 的 CHP；兩站說明頁同來源、帶入各站名稱／網址。
4. 正式前後測來源由各課設定；試卷建立即凍結；答案／成績由後端私有來源判定，公布前不揭曉。一般練習仍排除正式來源。
5. 互動定義在 courses/{id}/classroomConfig/interactions；state／rounds 原路徑保留，不搬資料；互動不計分／完成度。
6. 簡報位於各課 teacherAssets/presentation，只供授權教師；沒有簡報時隱藏播放分頁。MI 指示轉換以課程資料在教師讀取時套用，不改原稿。
7. 完成度公式仍為 3：完整測驗最高分達標＋必做活動。閃卡／抽題／錯題／綜合練習不計最高分與完成度；錯題隔日答對才移除。
8. Sheet 單元＝Chapter、次單元＝Unit；chapter 活動進度鍵 chapter:<名稱>_<activityId>；已發布快照不可變。
9. 台灣時區 +08:00；Firestore 不寫 undefined。字級沿用 --font-scale；登入 prompt select_account。
10. 學生說明不需登入、不連 Firebase、無外部相依；提示只存 courseId＋uid 的 localStorage，try/catch，略過即可關閉。
11. 禁未授權部署；Firebase 指令須明確指定專案。MI 要先 migration，再部署 Functions／前端；AP2 依既有 deploy.sh 流程。

## 下一步
1. Claude 複驗 M-1／假 Firestore apply 測試，以及 m-1／m-2／m-4；報告 docs/UNIFY_1.9.0_REPORT.md。
2. 教師確認 m-3：AP2 是否需要 MI 的 22 題；本次未改 Excel。
3. 教師核准後才做正式備份、migration apply、Functions／Pages 發布；MI 必須先確認舊 state、rounds、assessments、presentation 路徑，再寫 features／定義。
4. 發布後核對 MI 舊紀錄與私有簡報相容；AP2 用測試班驗證預設關閉與單課開關。
5. AP2 的前後測題目／互動內容／簡報由 Claude 擬、教師審，後續另案處理。
