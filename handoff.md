# 專案交接（現況）
目前版本：1.9.0
> 此為呼吸發布獨立整合目錄；未發布，停點為整合commit後交Claude核對。

## 開工規則
1. 先讀本檔與git log -5；改動前確認分支。
2. 本輪授權一般合併／驗證／本機commit；未經最終SHA核可不push，且不部署Functions／rules／indexes。
3. 收工更新handoff／DEVELOPMENT_LOG；commit結尾[Codex]，不可略過測試。
4. 不操作平台同步、正式學生或Google Sheet；Claude獨立驗收，教師裁定。

## 目前狀態（2026-10-15）
- 分支codex/respiratory-release-2026-10-15，origin/main基準8e61f58，呼吸來源f541b29；一般merge本機commit以git log -1為準，雙親保留兩邊。
- 教師已核可Pages-only計畫；只合併呼吸兩提交，解六衝突，保留main1.9.0與兩站設定／MI登錄。
- 只補oxygen-curve.js原檔（SHA d105171b…），七份HTML／content／Excel保持核可快照。
- 77題②已由Claude核可f541b29，Excel304題與Sheet479題就緒；本輪不再寫入。
- 主站呼吸七頁仍待部署，根目錄其他未提交工作不動；血流／泌尿／作圖工具／私人備份排除。
- 必要驗證全過：AP2 check158／54、materials20、節點21／15、七份乾淨重建SHA、126狀態、五份10頁回歸。AP2 catalog／dist38，MI catalog／dist2＋3CHP，無呼吸；functions／rules／indexes與main零差異。
- 額外MI全量測試在裁切副本149過9敗，未整合main亦同9敗（AP2快照依賴及SDK站別假設），新增失敗0；不聲稱MI完整check過。報告docs/respiratory-release/INTEGRATION_REPORT.md與integration-verification.json。
- 已停下交Claude核對最終SHA、diff與額外MI限制，確認前不push任何分支／main，不部署／同步。

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
- Claude核對最終commit及本次報告；核可後再由教師指示Pages-only push。
- 不執行通用deploy.sh（會部署Functions），不push／部署／同步。
[Codex]
