# 專案交接（現況）
目前版本：1.9.0
> 本檔是 unify worktree 的交接；其他教材任務見原工作目錄的 handoff.md。歷史見 DEVELOPMENT_LOG.md。

## 開工規則
1. 開工讀本檔與 git log -5；改動前確認分支。
2. 未經教師授權，不 push、合併／部署 main；不執行正式 migration。
3. 收工更新 handoff.md／DEVELOPMENT_LOG.md；commit 結尾 [Codex]；不可略過測試。
4. Claude 獨立驗收，Codex 實作，教師決定課程內容與部署。

## 目前任務（2026-10-13）
- feature/1.9.0-unify；基底origin/main@a593796。3a49056已由Claude複驗通過，複驗記錄提交40d3ec4。
- 教師授權部署，m-3定案AP2不加微生物22題；Excel不動。
- deploy.sh完整check157／Functions54、0 fail／skipped通過；AP2 Functions部署成功，origin/main與備份分支普通push40d3ec4。本機main未改。
- AP2變數未設VITE_SITE_ID，workflow預設ap2。
- 規則／索引部署遭自動審查拒絕，指令未執行；理由為未認定獨立安全邊界變更已明確授權／影響未核實。依教師要求停止，沒有重試或回退。
- Actions／線上JS雜湊／測試班三新功能關閉與guide尚未驗證；A段未完成驗收。
- B段未開始，沒有release/mi-1.9.0合併、MI check或migration dry-run；未push mi／apply／部署MI。
- 實際fetch與ls-remote確認mi/main=70354e0，非交辦記載d48aac8；後續重新核對並保留其續播／種類切換修正（unify已移植）。
- 本轮未改Excel或正式學生資料。root原feature/respiratory-infographics及教材未提交工作保留。
- 詳細停止紀錄docs/DEPLOY_1.9.0_REPORT.md；原整合報告docs/UNIFY_1.9.0_REPORT.md。
- 此交接為部署後本機紀錄，最後commit以git log -1查閱，不再次推main。

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
1. 教師解除AP2規則／索引部署的自動審查阻擋後再續；不得自行回退。
2. 完成A段：規則／索引、Actions成功、同環境本機build與線上雜湊、測試班三新功能關閉與guide。
3. 再做B段：重新核對mi/main，開release/mi-1.9.0合併unify，逐項報告衝突，MI check＋離線dry-run＋變數核對＋本機commit，交Claude。
4. MI仍不得push／apply／部署Functions；需另行指示，順序migration→Functions→Pages。
