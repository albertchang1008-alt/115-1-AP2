# #67 後台點名開關修正（2026-11-23）

## 給 Claude 的摘要
- 未驗：Ubuntu 非 root、正式課程開關、正式點名、部署後手機實點；未 push、未合併 main、未部署、未讀寫正式資料。
- 原因：後端已支援 attendance，但 CourseEditor 的課程功能只列三個舊功能，教師無法自行啟用點名。
- 修正：src/App.tsx 僅補 attendance 鍵與「點名」標籤，沿用原保存草稿流程，不連帶啟用授課控制台，預設仍關閉。
- 回歸：scripts/attendance-ui-check.mjs、tests/fixtures/attendance-ui.tsx，新增真實 App＋CourseEditor 的完整開／關與入口案例，均為合成資料。
- 基準：原版 17190f46 跑新案例 FAIL（找不到點名 checkbox）；修正後 UI 39 畫面＋7 組互動 PASS，0 failures／pageErrors。
- 全套 npm run check PASS（exit 0）：前端測試／build／後端129/129；可讀性17/17、4864畫面、0 issues／staticIssues／errors。
- 路徑 grep：本次三個程式／測試檔 0 筆；git diff --check PASS。
- 版本先保留 1.15.9，本次為待審本機修正；發布前協調版本並由教師核准部署。
- 偏離：無；沒有代替教師開正式課程旗標。
- 抽查（3項）：CourseEditor 第四個開關；瀏覽器保存開／關與獨立入口；保存時沒有 publishCourse／attendanceStart 呼叫。

## 修正與測試
修改前，側欄只有 features.attendance === true 才顯示〔點名〕；但課程功能沒有相應 checkbox。
這是設定介面漏接，不需要更改後端、點名計算、預設值或學生端。

產品變更僅一行 JSX：既有功能鍵與顯示標籤陣列末尾分別加 attendance／點名；使用原 onChange、save、saveCourse、bootstrap 流程。
授課控制台與點名分開設定，教師可只開點名，直接由側欄進入。

新增瀏覽器案例使用真正 App／CourseEditor、既有 memoryApi 與合成點名回應，逐項斷言：
1. 預設不勾、側欄沒有點名；勾選但未保存時仍不開放。
2. 按〔保存草稿〕後資料保留 attendance:true，側欄出現〔點名〕。
3. teachingConsole:false 不變，側欄仍無授課控制台；原 classroomInteraction:true 不受影響。
4. 直接點側欄〔點名〕，能看到〔開始點名〕與〔試簽（不算點名）〕。
5. 重返課程編輯仍勾選，取消並保存後旗標為 false，側欄入口消失。
6. 開／關合計僅兩次 saveCourse，publishCourse 與 attendanceStart 各 0 次；不產生節次、不發布課程。
7. 390×844 預設／特大功能區不出框；僅存功能區域各一張。新增 checkbox 由原版測得 FAIL，再補產品程式後 PASS。

## 驗證結果
- Node v22.23.2，macOS。
- `node scripts/attendance-ui-check.mjs --out <系統暫存目錄>`：PASS；學生 34、教師 5，7 組互動（原6＋新1）；failures=[]、pageErrors=[]。
- `npm run check`：PASS（exit 0）；前端測試／前後端 build 通過，後端129/129、0 skipped；可讀性17/17、0 skipped、4864畫面、0 issues／staticIssues／errors。
- `grep -nE '/Users/|/private/tmp' src/App.tsx scripts/attendance-ui-check.mjs tests/fixtures/attendance-ui.tsx`：0 筆；腳本無新增個人路徑。
- `git diff --check`：PASS。
- 學生端未修改；沿用 390 預設／特大 34 畫面自動可讀性檢查 PASS，未逐張檢視學生截圖。
- 只查看受影響的教師功能區 390 預設截圖一張，〔點名〕標籤可辨識，沿用原有排版；特大以自動幾何檢查為準。
- 首次新增測試故意對原版跑出 FAIL；無繞過斷言或降低門檻。

## 部署後教師操作
1. 教師登入，進〔課程與教材〕選課程。
2. 在〔課程功能〕勾選〔點名〕，按〔保存草稿〕，不需要〔更新到學生端〕。
3. 左側點〔點名〕；選班級與節次，建議先按〔試簽（不算點名）〕。
4. 正式點名按〔開始點名〕，投影 QR／數字碼；結束後到〔節次與名冊〕核對並確認。
5. 如需通知，到〔通知〕自行開 Gmail 寄出，再標記已通知。

## 證據與限制
- 截圖保存至 2026-11-30；repo 外系統暫存目錄 attendance-feature-toggle-2026-11-23/。
- 本次功能區存證：ui-feature-toggle-390-default.png、ui-feature-toggle-390-xlarge.png；同目錄 ui-result.json 為自動結果，check-result.json 記錄完整檢查 exit 0 與可讀性統計。
- 未執行正式開關寫入；依前次交辦不 push／合併 main／部署限制，本次只能交付待核准的本機修正。
- 根目錄 CODEX_QUEUE.md 只改 #67，週誌由根目錄 scripts/devlog.py 追加，其他未提交工作保留。
