# 開發紀錄

目前版本：1.0.4

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
