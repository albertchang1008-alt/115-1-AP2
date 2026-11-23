# #67：補課程點名開關（2026-11-23，Codex）

## 目標
教師無法從後台開啟點名。補上課程與教材→課程功能→點名，沿用保存草稿後即生效的既有流程；不依賴授課控制台開關。

## 背景
教師本聊天 11/23 連續回報「看不到授課控制台」「那怎麼點名？」；現況見 CODEX_QUEUE.md #67，1.15.9 已部署。
工作樹 .worktrees/attendance；以 17190f46 建 codex/attendance-feature-toggle。需要時讀 src/App.tsx 的 CourseEditor、shared/features.ts。

## 限制
不 push、不合併 main、不部署、不開正式課程旗標、不讀寫學生資料；只用本機合成資料。不改預設開關與後端點名規則。
沿用既有課程功能版面與保存流程；不自動連帶啟用授課控制台或其他功能。版本先維持 1.15.9，發布前依現況處理。

## 完成標準
- 真瀏覽器驗證：預設關閉；勾選未保存不開放；保存後可從側欄直接進點名、看見試簽；重新進編輯保留；關閉後入口隱藏；不呼叫 publishCourse／attendanceStart；其他開關不受影響。
- 390 預設／特大功能區不出框，僅保存受影響區域各一張；學生端沿用既有 39 畫面自動檢查。
- 實跑 npm run check、attendance-ui-check，修好因本件造成的失敗；個人路徑與 diff 檢查。
- 報告 docs/attendance/FEATURE_TOGGLE_FIX_2026-11-23.md 開頭「給 Claude 的摘要」≤15行，列未驗、檔案、結果及抽查項目≤5。
- commit 結尾 [Codex]；只改 #67 列交 Claude 審核；用根目錄 devlog.py 記週誌、check_handoff.py PASS。
