# 課序｜課程平台

目前版本：1.2.4

新平台獨立於舊題庫系統。GitHub Pages 提供 React 前端，Firebase 提供身分、權限、整組紀錄、個人完成度及增量報表。未設定 Firebase 時，只能進入清楚標示的操作示例；示例資料僅在本次頁面記憶體中。

## 本機開發

需求：Node.js 22.12 以上的 22.x（Cloud Functions 部署 runtime）、npm；已提供 `.nvmrc`，使用 nvm 時先執行 `nvm install`、`nvm use`。

```sh
npm ci
npm ci --prefix functions
cp .env.example .env.local
npm run dev
```

未填雲端設定也可查看操作示例。正式環境需填寫 `.env.local` 的 Firebase Web App 公開設定；不可填服務帳戶金鑰。

```sh
npm run check
```

驗證包括核心資料規則測試、全平台版本檢查、TypeScript、前端與後端建置。雲端整合驗證與實際教材驗證見 `docs/ACCEPTANCE.md`。

## 介面

- 學生：課程 → 單元 → 課前／課中／課後活動、測驗、閃卡、錯題與歷程。
- 教師：總覽、課程教材、題庫、名冊、完成度、題目分析、結算與設定。
- 預覽：教師可保存草稿後，以學生共用畫面試用；桌面／平板／手機與虛擬進度均不寫正式學習資料。

## 版本更新

修改 `VERSION` 後執行 `npm run version:sync`，再更新 `DEVELOPMENT_LOG.md` 與 `handoff.md` 變更內容。`npm run version:check` 檢查套件、鎖檔、前後端共用版本、Apps Script 與文件。Vite 產物以內容雜湊更新；題庫快取使用獨立題庫版本，不因平台升版而全數重讀。

## 正式部署：Firebase 後端＋GitHub Pages 前端

**目前狀態：1.0.4 後端已部署至 `ap2-7ed91`（asia-east1），第一位教師權限已設定。GitHub Pages 前端、正式題庫與名冊尚待完成；後端部署不代表完整教學流程已驗收。每次發布前仍須讓 `npm run check` 全部通過。**

所有指令均在本專案根目錄執行。請將 `NEW_PROJECT_ID`、`TEACHER_UID`、`GITHUB_OWNER`、`REPOSITORY` 換成自己的值；不要使用舊題庫的 Firebase 專案或金鑰。

### 1. 準備工具與帳號

- Node.js **22.12 以上的 22.x** 與 npm；舊的 Node.js 20 可能跳過新版 Firebase 需要的相依套件。
- 有權管理新 Firebase 專案的 Google 帳號，以及可設定 Pages 的 GitHub 儲存庫。
- Firebase CLI；教師授權另需 Google Cloud CLI（`gcloud`）。

```sh
node --version
npm install -g firebase-tools
firebase login
firebase projects:list
npm ci
npm ci --prefix functions
npm run check
```

若安裝、測試或編譯失敗，先修正再往下進行。此專案已有 `firebase.json`、Rules 與索引，不必重新執行 `firebase init` 覆蓋它們。CLI 安裝與登入參考 [Firebase 官方文件](https://firebase.google.com/docs/cli)。

### 2. 建立新的 Firebase 專案

在 Firebase Console 中：

1. 建立新專案並啟用 Blaze 計費方案。
2. 在 Authentication 啟用 **Google** 登入。
3. 建立 **Cloud Firestore**，位置選 `asia-east1`；教材放 GitHub Pages，不需建立 Storage；Functions 程式目前使用 `asia-east1`。
4. 新增 Web App，取得下表的公開設定。
5. 在 Authentication → Settings → Authorized domains 加入 `localhost`、`127.0.0.1` 及 `GITHUB_OWNER.github.io`，只填主機名稱，不填 `https://` 或儲存庫路徑。

| 本機環境變數／GitHub Variable | Firebase Web App 設定 |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

本機使用 `.env.example` 複製成的 `.env.local`，另設 `VITE_FUNCTIONS_REGION=asia-east1`、`VITE_USE_EMULATORS=false`。若 `.env.local` 已存在，直接編輯，不再用複製指令覆蓋。

Firebase Web App 公開設定可以進入前端；**服務帳戶金鑰、Sheets 同步密鑰不能放入任何 `VITE_` 變數**。

### 3. 設定密鑰並部署 Firebase 後端

準備 Sheets 同步使用的強隨機密鑰，透過 CLI 互動提示輸入，不貼進程式或文件：

```sh
firebase functions:secrets:set SHEETS_SYNC_KEY --project NEW_PROJECT_ID
npm --prefix functions run build
firebase deploy --only functions,firestore --project NEW_PROJECT_ID
```

- `SHEETS_SYNC_KEY`：供 Apps Script 驗證題庫發布。
- 每次明確使用 `--project`，避免發到其他專案。
- `firebase deploy` 會部署 Functions、Firestore Rules／索引，**不會發布 GitHub Pages**。
- 部署後確認 Functions 成功、Firestore 索引建立完成。學生前端經過受保護的 Functions 存取資料，不要把 Rules 改成公開讀寫來排除錯誤。

### 4. 授權第一位教師

1. 填好本機 `.env.local` 並啟動 `npm run dev`。
2. 用教師 Google 帳號登入一次。尚未授權時即使平台顯示無權進入，Authentication 通常已建立該使用者；到 Firebase Console → Authentication → Users 找到該帳號的 UID。
3. 在自己的受控電腦使用有權管理該專案的帳號設定 ADC，執行教師授權工具：

```sh
gcloud auth application-default login
node scripts/set-teacher.cjs NEW_PROJECT_ID TEACHER_UID
```

Firebase CLI 的 `firebase login` 與這裡的 ADC 是不同用途，前者不能取代後者。參考 [Google Cloud ADC 登入文件](https://docs.cloud.google.com/sdk/gcloud/reference/auth/application-default/login)。

4. 教師登出再登入，使 `teacher` 權限生效。授權腳本需要 Firebase Authentication 使用者管理權限；不要把 ADC 憑證或服務帳戶金鑰加入 Git。

### 5. 設定並發布 GitHub Pages

1. 把專案放入新的 GitHub repository，使用 `main` 分支；保留兩份 `package-lock.json`，不要提交 `.env.local`、`node_modules` 或任何管理員憑證。
2. 在 repository → **Settings → Secrets and variables → Actions → Variables** 新增上表的四個 `VITE_FIREBASE_*` 變數，值使用新 Firebase Web App 的設定。
3. 在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。這符合本專案的 [Pages 工作流程](.github/workflows/pages.yml)，不需另建 `gh-pages` 分支。[GitHub 官方說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
4. 推送 `main`，或在 **Actions → Publish course platform → Run workflow** 手動發布。
5. 等 `build` 與 `deploy` 都成功，開啟 deployment 提供的網址，通常是 `https://GITHUB_OWNER.github.io/REPOSITORY/`。

工作流程會安裝套件、檢查版本、執行測試、建置前後端，再把 `dist` 發布到 Pages。**它只驗證後端能編譯，不會自動把 Functions 部署到 Firebase**，因此第 3 步仍需另外執行。

GitHub Variables 修改後必須重新執行 workflow，前端才會帶入新設定。若線上仍顯示「尚未連接 Firebase」，先檢查變數是否填在 **Variables**，而不是同名的 Secrets。

### 6. 建立課程並連接正式資料

1. 教師登入後建立課程，輸入自訂課程代碼（英數字、`-`、`_`，建立後不可更改）；單元同樣輸入自訂代碼。這兩組代碼之後會直接對應 Google Sheet 的內容。保存草稿。
2. 建立一份 Google Sheet 供所有課程共用：開一個「名冊」分頁，欄位為班級、學號、姓名、Gmail；每個單元各開一個分頁，分頁名稱就是單元代碼，欄位除題目本身外要有「課程」欄，填入對應的課程代碼。
3. 啟用 Google Cloud 專案的 Sheets API，並把這份 Sheet 以「檢視者」權限分享給 Cloud Functions 的執行服務帳戶（到 Google Cloud Console → Cloud Functions（或 Cloud Run）任一函式的設定頁查詢「執行階段服務帳戶」）。
4. 在教師後台「平台設定」貼上這份 Sheet 的 ID（試算表網址中 `/d/` 與 `/edit` 之間那一段），保存後按「立即同步」。名冊沒有變動時會直接跳過寫入；題庫沿用既有版本雜湊，內容沒改也不會重新產生版本。
5. 同步結果會列出每個（課程、單元）配對是否成功連接題庫版本；有錯誤（例如課程代碼打錯、格式不符）會個別列出，不影響其他單元。
6. 將 HTML 教材發布到 GitHub Pages，於活動填入 HTTPS 教材入口網址，填入 YouTube 連結與需要的起訖秒數。
7. 用「保存並預覽草稿」檢查教材、一般測驗與閃卡；確認後按「發布課程」，學生才看得到。

題庫欄位、GitHub Pages 教材發布方式、Emulator 詳細說明，以及每課程各自的 Apps Script 備用發布流程，見 [部署與初始化](docs/DEPLOYMENT.md)。

### 7. 上線檢查與日後更新

- 使用名冊中的學生帳號驗證登入、課程權限、整組作答與即時完成度。
- 驗證未列名冊及校外帳號無法進入，教師預覽不新增正式作答。
- 驗證報表更新、HTML 真實套件、YouTube 影片及手機顯示；完整清單見 [驗收文件](docs/ACCEPTANCE.md)。
- 查看 Firebase 實際讀寫量與錯誤紀錄後，再擴大到全班使用。

日後發布順序：**更新版本與文件 → `npm run version:sync` → `npm run check` → 如有後端變更先部署 Firebase → 發布 GitHub Pages → 檢查線上版本及登入作答**。Apps Script 若有變更，也要同步貼上新程式與 `version.gs`。

常見問題：

| 現象 | 先檢查 |
|---|---|
| 後端 TypeScript 錯誤或缺少 Firestore 套件 | Node.js 是否為 22.12+ 的 22.x；使用正確版本重新安裝，不能略過檢查發布 |
| Google 顯示 unauthorized-domain | Authentication 是否加入實際 Pages 主機名称 |
| 登入後顯示無權進入 | 教師 claim 是否已刷新，或學生是否在啟用名冊中 |
| 頁面可開但資料請求失敗 | Functions 是否部署至新專案的 `asia-east1`，前端變數是否一致 |
| 題目發布後學生看不到 | 題庫版本是否連接草稿，課程是否再次發布 |
| 教材無法顯示 | 確認 Pages 已發布、入口及相對路徑正確；使用教師預覽驗證 iframe 相容性 |

## 文件

- [部署與初始化](docs/DEPLOYMENT.md)：新專案、教師權限、Secret、GitHub Pages 教材與部署。
- [資料設計](docs/DATA.md)：資料模型、報表定義、讀寫與教材通訊。
- [驗收清單](docs/ACCEPTANCE.md)：驗收、限制與待提供項目。
- `apps-script/Code.gs`：Sheets 發布；`apps-script/version.gs` 為自動同步版本。

本專案不包含任何舊名冊、成績、題庫或管理員憑證。正式上線前需提供新資料與授權，不能將示例模式當成已串接成功。
