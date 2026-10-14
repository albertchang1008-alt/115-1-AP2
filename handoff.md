# 專案交接（現況）
目前版本：1.9.0
> 本檔是 unify worktree 的交接；其他教材任務見原工作目錄的 handoff.md。歷史見 DEVELOPMENT_LOG.md。

## 開工規則
1. 開工讀本檔與 git log -5；改動前確認分支。
2. 未經教師授權，不 push、合併／部署 main；不執行正式 migration。
3. 收工更新 handoff.md／DEVELOPMENT_LOG.md；commit 結尾 [Codex]；不可略過測試。
4. Claude 獨立驗收，Codex 實作，教師決定課程內容與部署。

## 目前任務（2026-10-14）
- feature/1.9.0-unify；CI修正7a6720e僅tests，兩份MI歷史.txt＋README SHA，無skip。
- 不含70354e0乾淨clone AP2 check與本目錄兩站check158／Functions54、0 fail／skipped全過。
- AP2 deploy.sh成功；origin/main與備份分支7a6720e，Actions38424586178 build/deploy success，Pages1.9.0、JS SHA同本機production build。
- 索引READY；排程15:36–15:43 UTC連續HTTP200，缺索引舊錯誤已停止。
- test班三新開關均關閉、guide／首次提示、既有10題測驗雲端保存、影片重整38秒續播驗證通過。
- AP2既有反思活動0；反思以本機React/callable回歸驗證，未新增正式活動。
- 分站教材測試已回補：AP2保持原五份physiology斷言；MI核對兩教材HTML／來源／ID／目錄、SDK，以及AP2公開檔不存在；兩站都有斷言，無skip。
- 本輪共用AP2完整check158／Functions54、0 fail／skipped通過；AP2不重新部署，origin/main仍7a6720e。
- MI release/.worktrees/release-mi-1.9.0已移出29個未追蹤AP2資料夾并還原指定4檔；不帶AP2公開教材進MI。
- MI純暫存checkout-index匯出完整check150／54、0 fail／skipped通過，dist兩教材＋三CHP，離線dry-run成功；待本機merge commit后交Claude。
- MI .firebaserc依新指示不改；所有MI Firebase指令必帶--project mi-bd885。GitHub VITE_SITE_ID未設唯讀列待辦，不改變數。
- Excel引用Claude已完成稽核：暫存相對mi/main沒有.xlsx變动。不再執行補充工具。
- 最新MI報告見release worktree docs/MI_1.9.0_RELEASE_PREPARATION.md；未push mi／apply／部署MI。
- root教材工作保留；本輪交接只本機commit，不再push main。

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
1. 分站測試回補只本機commit；AP2不重新部署。
2. MI本機合併commit後交Claude複驗；未設VITE_SITE_ID列教師發布前待辦。
3. MI仍禁止push／apply／Functions或rules/indexes部署；另行指示後migration→Functions→Pages。
