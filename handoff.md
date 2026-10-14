# 專案交接（現況）
目前版本：1.9.0
> 本檔是 unify worktree 的交接；其他教材任務見原工作目錄的 handoff.md。歷史見 DEVELOPMENT_LOG.md。

## 開工規則
1. 開工讀本檔與 git log -5；改動前確認分支。
2. 未經教師授權，不 push、合併／部署 main；不執行正式 migration。
3. 收工更新 handoff.md／DEVELOPMENT_LOG.md；commit 結尾 [Codex]；不可略過測試。
4. Claude 獨立驗收，Codex 實作，教師決定課程內容與部署。

## 目前任務（2026-10-14）
- feature/1.9.0-unify：新增學生說明「2. 加到手機主畫面」，逐字使用交辦內容；原2–10改3–11與id。
- guide.css補手機清單／小標字級≥16px與列印樣式；guide-verify核對11節、兩份5步清單、5則注意、兩種字級無溢位與列印。
- 完整檢查與兩站截圖證據見docs/GUIDE_HOMESCREEN_2026-10-14_REPORT.md；只本機提交，待合併MI後Claude複驗。
- 目前manifest standalone、Apple圖示與title具備；src/service.ts仍signInWithPopup，登入程式未改。
- iPhone／Android主畫面登入需教師test帳號真機實測；若iPhone失敗依交辦修改注意第3點，另列redirect評估。
- AP2正式main仍7a6720e，本次不push、不部署；原CI歷史fixture及分站教材測試均保留。
- MI release已由Claude驗收510b6ad；後續migration成功，Functions59操作成功但deleteCourse失敗（exit2），部署停在step2；不可重跑apply／自行回退。
- MI規則索引／Pages尚未執行；本次guide任務不續部署。所有MI Firebase指令須--project mi-bd885，.firebaserc不改。
- MI公開教材保持兩份＋三CHP，GitHub VITE_SITE_ID未设、workflow fallback mi不改。
- Excel、學生資料與root教材工作均未動。

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
1. guide合併MI並完整MI check後，交Claude複驗。
2. 教師用test帳號真機驗證iPhone與Android：加到主畫面→開圖示→Google登入→一題練習保存→關閉重開保持登入。
3. 本次不push／部署；後續發布需另行交辦，MI不可重跑migration。
