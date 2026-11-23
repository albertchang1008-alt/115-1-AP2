# #67 課堂點名（半自動通知）Claude 最後驗收（2026-11-23）

## 給教師的摘要
- 裁定：**PASS，可交教師合併與部署**（feature/attendance／bf57a3a8；bf57a3a8 相對 b0915d02 只多一份報告）。
- 版本仍 1.15.8；旗標 attendance 預設關；未 push、未合併、未部署、未寄信、未寫正式資料。
- 本檔未 commit（裝置沙盒不允許 git 刪鎖檔）；合併前請一併 commit 或保留於工作樹。

## Claude 獨立重跑（Linux aarch64、非 root、Node 22.23.5，bf57a3a8 git archive 乾淨 npm ci）
| 檢查 | 結果 |
|---|---|
| `npm --prefix functions run build` | PASS，67 函式 |
| `node --test functions/tests/attendance.test.cjs` | 17/17 PASS、0 fail、0 skipped |
| `npx tsx --test tests/attendance.test.ts` | 10/10 PASS、0 skipped |
| 點名專屬 10 檔個人路徑 grep | 0 筆 |
| 產品程式代寄信符號 grep | 0 筆 |
- 雲端容器另以同 SHA 原始碼 build 67 函式 PASS（attendance.ts c162bcb9…、shared f37f314c…、race 腳本 5ff5b301…）。

## 未能獨立重跑（以 Gemini 第二輪 Mac 實跑為準）
- 真 Firestore Emulator race：VM 只有 Java 11（firebase-tools 15 需 ≥21，下載 JDK 被安全規則擋下）；雲端容器有 Java 21，但 Emulator jar 來源 storage.googleapis.com 不在白名單。
- 半自動 7/7 實走、UI 39 畫面＋6 組互動：需 Chrome／Emulator，同上；採 SEMIAUTO_TEST_RUN_2.md 與 IMPL_REPORT Codex 實跑。
- 以靜態審查補強：race 腳本每回合直接讀 Firestore 原始紀錄，驗每生 1 筆、準時≤closedAt＋寬限、counts 三方一致、回覆與紀錄一致；sawRace 要求同回合有成功也有被擋，判定不寬鬆。Gemini 第 4 回合 28／2 符合此條件。

## 程式抽查（Codex 列 5 項）
1. markDigest：交易內重讀導師設定與每個目標節次（closed＋confirmedAt＋日期／節次／班級）→ PASS。
2. UndoNotified：導師 logId 必須 `digest__…#索引`，且索引＝最新未撤銷標記，否則拒絕；24 小時限制 → PASS。
3. 學生 canUndo：`status==='marked' && notifySeq===seq && 24h內`；後端同條件拒絕、序號不倒退 → PASS。
4. 控制台待通知徽章、三種複製路徑：依 UI 檢查報告，未獨立重跑。
5. race present／absent 逐欄比對：腳本第 104 行起確認 → PASS。

## 給教師的待辦
1. 手機實點：學生「我的出缺席」390 預設／特大；教師〔通知〕分頁複製、開啟 Gmail、標記與撤銷。
2. 合併 feature/attendance 前確認 origin/main 未前進；與 #61／#63 版本號協調（本分支 1.15.8，後部署者升版）。
3. 部署後於課程設定開旗標 attendance，先以試簽節次走一次。
