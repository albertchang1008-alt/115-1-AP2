# 開發紀錄

目前版本：1.0.5

## 1.0.5 — Google Sheet 一次性同步

- 課程、單元建立時改由教師輸入自訂代碼（英數字、-、_），取代原本自動產生的隨機 UUID；代碼建立後不可更改，用於對應 Google Sheet 的課程欄位與分頁名稱。
- 新增後端 `syncSheet`／`saveSheetConfig`／`getSyncStatus` 三個 callable：一份 Google Sheet 管理所有課程，「名冊」分頁固定存放班級、學號、姓名、Gmail，其餘分頁對應單元代碼並以「課程」欄位標明歸屬課程。
- 名冊同步採整份內容雜湊比對，未變動時完全跳過讀寫；有變動才整批寫入，寫入前仍會檢查每個班級的授權教師，避免誤觸他人班級資料。
- 題庫同步沿用既有 `publishBank` 內容雜湊分版機制，未變動的單元不會重新產生版本；有新版本時自動更新該課程草稿的題庫連接，不需再手動貼版本 ID。
- 讀取 Google Sheet 改用 Cloud Functions 執行身分呼叫 Sheets API（需將 Sheet 以檢視權限分享給該服務帳戶、並啟用 Sheets API），不在任何地方存放服務帳戶私鑰。
- 教師後台「平台設定」新增 Sheet ID 設定與「立即同步」按鈕，顯示上次同步時間與本次結果。
- 原本每課程各自的 Apps Script／HMAC 簽章發布流程（`apps-script/Code.gs`、`sheetsPublish`）維持可用，作為備用管道。

## 1.0.4 — 正式部署前檢查

- 修正新增教材元件測試缺少 Activity.description 的型別錯誤，部署前使用 Node 22 重跑完整檢查。
- 已確認新專案 ap2-7ed91 的預設資料庫為台灣 asia-east1、Firestore Native Standard。
- 移除被 Firestore 拒絕的 reports.classId／__name__ 多餘複合索引；該查詢使用既有單欄索引。
- 明確指定 gcp-build 驗證已編譯入口；TypeScript 與共用程式由本機 predeploy 編譯，避免雲端只收到 functions 目錄後重新編譯時找不到外部 shared 原始碼。
- 線上驗證發現空白交卷請求會回傳 INTERNAL；補上先檢查登入與作答物件，正確回傳未登入／格式錯誤。
- 實際部署結果另記於驗收文件。

## 1.0.3 — 教材改放 GitHub Pages

- HTML 活動改為 HTTPS 教材網址，教師預覽與學生端共用受限制 iframe；參與紀錄保存方式不變。
- 移除 ZIP 上傳、教材簽署與檔案轉送函式；部署不再包含 Storage，也不要求儲存桶或教材密鑰。
- 更新部署、教材版本資料夾流程、環境設定與驗收文件；同步全平台版本。
- Firebase Admin SDK 可能仍帶入 Storage 的間接套件，但應用程式不初始化或呼叫 Storage。

## 1.0.2 — 修復後端編譯

- 將 Firestore 與 Storage SDK 列為直接相依套件並更新鎖檔，避免 Firebase Admin 的選用相依套件在舊 Node 環境被跳過，造成型別缺失。
- 保留 TypeScript 嚴格檢查；建置前檢查 Node 版本與必要套件，建置後載入 24 個函式入口，確認編譯產物可啟動。
- 加入 `.nvmrc` 指定部署用 Node 22，同步全平台版本及部署狀態文件。
- 未執行正式部署，也未存取正式學習資料；驗證結果見 `docs/ACCEPTANCE.md`。

## 1.0.1 — 補齊部署說明

- README 加入從工具安裝到 Firebase、教師授權、GitHub Pages、資料初始化及更新的完整流程。
- 區分 Pages 發布與 Firebase 部署，標示尚未完成的後端修復及正式驗收。
- 修正教師授權工具的 firebase-admin 套件解析路徑，避免把 package exports 誤當成實體檔案路徑。
- 同步全平台版本；本次未執行任何正式部署或教師權限變更。

## 1.0.0 — 初始實作

- 建立獨立 React／TypeScript／Vite 平台及 Firebase Functions。
- 新教師工作區、課程編輯與共用學生前台預覽。
- 校內名冊驗證、整組作答、防重送、即時個人進度。
- 版本化题庫、Sheets 發布、互動 HTML 套件與 YouTube 片段。
- 增量報表、完成度看板、結算快照、匯出及版本檢查。
- 測試及雲端驗收狀態請參考 docs/ACCEPTANCE.md；不將尚未連接的外部服務列為完成部署。
