# #65（合批 #61）最後驗收（Claude，2026-11-23 23:59）

## 給 Claude 的摘要
- **PASS，交教師。** 基準 `feature/zuvio-exams`／`a7dcb3a1`，版本 1.15.9；與 origin/main（5e649242）落後 0。
- 環境：雲端 Ubuntu 24.04.5、**非 root（uid 30033）**、Node 22.23.5、npm ci（根目錄與 functions）。程式來源為 git bundle：以 a7dcb3a1 的 tree（968b0352…）建立單一快照提交後打包，clone 後 tree 雜湊逐位元一致。
- `npm run check` 原樣：前端 347 中 337 PASS、10 FAIL、0 skipped。10 項全是同一原因：`src/style.css` 第 1 行 `@import` Google Fonts，在雲端沙箱被出網白名單擋下，`page.addStyleTag` 拋 `Event`。屬環境因素，與 #65 改動無關（#41 課堂、#49 看板、#145 MI、#197 簡報、#244–247 練習、#273 反思、#297 授課控制台）。
- 只在本機暫時刪掉該 `@import` 重跑前端：**347/347 PASS、0 skipped**，296s；跑完已還原，工作目錄乾淨。
- 其餘步驟在原樣 tree 上：`npm run build` PASS；後端 **155/155 PASS、0 skipped**；Functions build 67 個入口；閱讀規範 17/17（皆 SKIP 未變更，指紋相符），0 issues；`version:check` 1.15.9。
- 重點抽查 PASS：①舊分頁在重匯後才按「清理殘留成績」→回 `cleaned:false`，B 的 results.gen、2 筆明細、分析摘要、待用預覽都保留；②場次已有有效成績且 pendingCleanup 時，按鈕仍顯示並只傳 `cleanupOnly:true`，只刪 `revision < 現行` 舊代；③清理中遇較新提交：上界固定、`clearPendingCleanup` 交易內比對版本，不誤清新旗標。
- `zuvio-ext.test.cjs` 18/18；R5／R6 兩支定序測試 2/2。
- 小瑕疵（不擋）：清理按鈕呼叫失敗時沒有錯誤提示，按鈕仍在可重試（Codex R6 已記）。
- 未驗：Firestore Emulator、教師手機實點、正式資料。

## 逐項
| 項目 | 結果 | 證據 |
|---|---|---|
| cleanupOnly 權限與白名單 | PASS | `functions/src/zuvioExams.ts` zuvioDeleteResults：先 teacher()、obj() 白名單、布林檢查 |
| 舊分頁晚於重匯 | PASS | 無旗標早返；測試 1465–1485 斷言 gen、明細 2 筆、analysis、preview |
| 已有成績時重試 | PASS | `src/ZuvioExams.tsx` `s.pendingCleanup &&` 按鈕→`deleteResults(examId, s.id, true)`；`src/zuvioApi.ts` 只在 true 時帶 `cleanupOnly`；測試 1487–1507 |
| 一般刪除 | PASS | 仍須 confirm、遞增 deletedRevision、刪 analysis；未受 cleanupOnly 影響 |
| 全套 check | PASS（環境因素 10 項已排除） | 見摘要 |

## 部署前提醒
- 版本：#67 點名＋ag2 平台已占 1.15.10。本件是新功能，建議 1.16.0；#63 心智圖 A 段原也標 1.16.0，後部署者改 1.17.0。
- 部署前要依當時 origin/main 合併、升版、重跑 check（交 Codex）。
