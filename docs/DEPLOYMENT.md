# 部署與初始化

完整依序操作請先看 [README 的正式部署章節](../README.md#正式部署firebase-後端github-pages-前端)。本文補充資料格式及教材細節。上線前必須使用 Node.js 22.12+ 的 22.x 並通過 `npm run check`；1.0.4 後端已部署到 `ap2-7ed91`，前端與正式教學流程仍待完成。

## 1. 建立隔離的新 Firebase 專案

啟用 Blaze（Cloud Functions 仍需要）、Google Authentication、Firestore Native。Firestore 選 `asia-east1`；HTML 教材放 GitHub Pages，不需建立 Storage。Functions 程式目前使用 `asia-east1`。本機 Firebase CLI 選定新專案，不使用舊題庫 project。

建立 Web App，把公開 SDK 設定填入 `.env.local`。Authentication Authorized domains 加入 GitHub Pages 的主機名稱（不含路徑）與本機 localhost。Google 登入使用 popup；學校限制和名冊比對由後端執行。

預算通知不等於停機上限。Functions 設定最多 5 instances；先觀察試行班級用量再調整。不要開放公開資料庫規則。

## 2. 教師授權

教師先使用 Google 登入取得 UID。透過受控管理環境、Application Default Credentials 執行：

```sh
gcloud auth application-default login
node scripts/set-teacher.cjs NEW_PROJECT_ID TEACHER_UID
```

授權後教師重新登入以更新 token。一般教師只能管理其 `teacherIds` 包含自己的課程；名冊匯入會建立所屬班級授權。不要把金鑰 JSON 放入此儲存庫。

## 3. Firebase 部署

```sh
npm ci --prefix functions
npm --prefix functions run build
firebase functions:secrets:set SHEETS_SYNC_KEY --project NEW_PROJECT_ID
firebase deploy --only functions,firestore --project NEW_PROJECT_ID
```


`firestore.rules` 拒絕所有客戶端直接讀寫；前端統一使用檢查身分與課程權限的 callable。教材直接由 GitHub Pages 提供，不經 Firebase 傳送。

唯一需要的應用程式 secret 為 `SHEETS_SYNC_KEY`，僅提供給受控 Apps Script。

`SHEETS_SYNC_KEY` 已在新專案建立第 1 版；設定 Apps Script 時由有權限的教師在 Secret Manager 取得，不必重新產生或貼到對話／程式庫。`gcp-artifacts` 已設定 7 天映像清理政策。Functions 的部署來源桶與映像檔是 Google 部署基礎設施，不是教材儲存桶。

本機 predeploy 編譯 TypeScript 與共用程式到 `functions/lib`；雲端 `gcp-build` 僅驗證編譯產物可載入。請勿略過 predeploy 或手動上傳過期的 lib。

`dailyReports` 排程每日 03:00 執行，但只處理 `dailyReports=true` 的課程；每課最多 200 組／次，更多積壓可以手動接續。

## 4. GitHub Pages

建立新 repository，於 Settings → Pages 選 GitHub Actions。新增 repository variables：

`VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID`、`VITE_FIREBASE_APP_ID`。

推送 main 會執行檢查及 Pages 發布。前端 `base: './'` 搭配 hash 路由支援 repository 子路徑。

Firebase 後端部署與 Pages 發布分別進行。避免公開新版頁面時仍使用不相容舊後端；先部署相容後端、檢查、再發布前端。

## 5. Sheets 題庫

建立新 Sheet，欄位：`id,text,a,b,c,d,answer,explanation,concept,image`，正解為小寫選項 ID。每工作表對應一單元，最多 100 題，超過拆單元。

貼入 `apps-script/Code.gs` 與 `version.gs`。Script Properties 設定：

- PUBLISH_ENDPOINT：部署回傳的 sheetsPublish HTTPS URL。
- SHEETS_SYNC_KEY：與 Firebase secret 相同。
- COURSE_ID、UNIT_ID：從教師後台及課程設定取得。

在 Firestore Console 建立 `syncAllowlist/{courseId}`，內容 `{enabled:true}`，僅授權此課程使用同步。Sheet 選單檢查並發布後，將版本 ID 貼到教師後台的題庫管理，驗證、連接草稿、發布課程。未改變內容則不重複上傳。

## 6. GitHub Pages 教材

1. 在本專案 `public/materials/` 內為每份教材建立版本資料夾，例如 `chapter1-v1/`。
2. 放入解壓後的 `index.html`、CSS、JavaScript、圖片等，保留教材內相對路徑。
3. 跟隨本專案的 GitHub Actions 發布。教材網址為 `https://GITHUB_OWNER.github.io/REPOSITORY/materials/chapter1-v1/index.html`；請以實際 Pages 網址為準。也可使用另一個已發布的教材 Pages 儲存庫。
4. 教師後台建立 HTML 活動，貼上 HTTPS 教材入口網址，保存草稿、預覽、發布課程。不要貼 GitHub 的 `blob` 原始碼頁面。
5. 更新時建立 `chapter1-v2/` 並修改活動網址，可保留舊教材版本且避免快取混用。平台發布仍須同步平台版本。

教材網址可公開存取，課程草稿權限不會保護已發布到 Pages 的檔案；不要把名冊、學生紀錄或平台憑證放進教材。平台仍透過 Firebase 保存參與紀錄與作答。

HTML 使用 `sandbox="allow-scripts"` iframe，不授予平台來源權限；某些依賴瀏覽器儲存、ES modules／fetch 的教材需相容調整，必須以實際教材預覽驗證。教材可接收 `{type:'init', activityId}`，回傳帶相同 `activityId` 的 `ready`、`progress`、`completed` 事件；平台會驗證來源視窗。沒有事件介面時使用「確認已閱讀」。

## 7. 本機 Emulator

需要 Firebase CLI 與 Java（Firestore Emulator）。`.env.local` 設定 VITE_USE_EMULATORS=true，使用 demo project ID。

```sh
firebase emulators:start --project demo-course-platform
```

使用 Emulator 驗證規則與後端不等於正式 Google OAuth／YouTube／GitHub Pages 教材 部署驗收。
