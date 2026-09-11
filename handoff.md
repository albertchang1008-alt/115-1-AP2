# 專案交接

目前版本：1.0.5

## 固定決策

1. 學生入口 GitHub Pages，資料 Firebase；舊題庫資料完全隔離。
2. 前端判分；完整測驗與完整閃卡達標計入完成度，錯題複習不計入。
3. HTML 教材使用 GitHub Pages 網址，不使用 Storage；HTML 與影片僅記參與，YouTube 由教師提供連結。
4. 整組紀錄保存、內容版本快取、禁用全題庫掃描備援。
5. 報表按需增量彙整，每日 03:00 排程預設關閉；個人完成度即時更新。
6. 預覽使用學生共用元件；正式與預覽寫入分离。
7. 每次升版同步所有平台版本標示及文件。
8. 課程／單元 ID 一律由教師自訂（建立後不可改），用於對應 Google Sheet 課程欄位與分頁名稱；名冊同步只會新增/更新，不處理刪除。

## 下一步需要的外部輸入

1.0.4 後端已部署至 ap2-7ed91，21 個函式在 asia-east1 使用 Node 22，5 個索引已 READY。已建立 SHEETS_SYNC_KEY 第 1 版與 7 天映像清理政策。本機使用 Node 22.23.2 驗證；正式教學流程與前端上線仍待完成。

- 第一位教師 hhchang@ctcn.edu.tw 已驗證信箱並設定 teacher=true；使用者已確認重新登入成功進入教師後台。GitHub 儲存庫與 Pages 設定尚待完成。
- 新題庫、完整學校信箱名冊、GitHub Pages 教材網址、YouTube 影片連結。
- Sheets Script Properties、課程同步授權；Firebase 同步 secret 已建立，勿隨意覆蓋。
- Google Sheet 同步：需先在 Google Cloud 啟用 Sheets API，並把管理課程用的那份 Sheet 以檢視權限分享給 Cloud Functions 執行服務帳戶，再到教師後台「平台設定」填入 Sheet ID。

禁止在未授權情況下沿用舊 Firebase 管理員金鑰。實際部署與教材相容性驗收不可由示例頁替代。
