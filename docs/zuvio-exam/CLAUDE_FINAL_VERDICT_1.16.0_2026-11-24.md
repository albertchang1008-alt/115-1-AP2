# #65（合批 #61）1.16.0 最終裁定（Claude，2026-11-24 11:40）

## 給 Claude 的摘要
- **有條件 PASS：程式可上線，但部署程序有 1 項必做前置，順序上要等 #67。** 基準 `feature/zuvio-exams`／`28a95256`，含 origin/main e08096c4（1.15.10），超前 20 提交。
- 程式面：Hydrogen 合併只解 `src/App.tsx` 功能勾選列一處衝突；3.8 全套前端 350／後端 157／閱讀 17/17 與 11/23 Claude 雲端非 root 347／155 一致遞增，可信。
- **必做前置（擋部署）**：本分支新增 `attempts`（classId↑ unitId↑ receivedAt↓）複合索引，`functions/src/zuvioExams.ts:854–888` 考前練習覆蓋率查詢依賴它；`deploy.sh` 只跑 `deploy --only functions`，不會部署索引。須教師另行授權 `firebase deploy --only firestore:indexes --project ap2-7ed91`，確認 READY 後再跑 deploy.sh（比照 1.9.0 W42 前例）。
- **順序**：#67（1.15.11）先上；本分支再併 origin/main，版本維持 1.16.0，重跑 `npm run check`。
- **工作樹不乾淨**：10 份 `EXT_CODEX_*`／`EXT_*RUN*` 報告未追蹤，deploy.sh 會拒絕；併版時一併 commit。
- 3.8 瀏覽器報告問題（不擋程式，但證據降級）：①報告甲表「平均 62.5、SD 47.87」與截圖 09（11/3 呼吸小考，平均 21.1、SD 5.23）不符；②情緒卡寫「四個按鈕／微風」，實際 UI 為五種（火山／橡皮筋／毛毛蟲／小船／霧）；③夾具 toast 行內樣式與正式 `.toast` 疊加成大藍塊，蓋住 06–09 場次列；06 與 07 雜湊相同。清理流程的證據只剩腳本斷言（按鈕出現→點擊→卸載、`cleanupOnly:true`），截圖無法佐證。
- 未驗：真 Firestore／Emulator、test 課程真實後端全流程（佇列原訂，3.8 改用 mock 夾具）。
- 放行條件：`zuvioExams`／`zuvioMood` 預設 false（`shared/features.ts` normalize 只認 `=== true`），部署後學生無感。正式課 115-1-AP2 開旗標前，教師先在 test 課走一次：出題→匯入→刪除→報表（含考前練習覆蓋率，驗索引）→學生情緒卡。
- 證據保存至 2026-12-01。

## 不擋的小瑕疵（沿用）
- 清理按鈕失敗無錯誤提示（R6 已記）。
- 夾具 toast 應移除行內定位或改 class，下次 e2e 前修（Codex，非本版）。
