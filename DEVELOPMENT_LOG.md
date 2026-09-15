# 開發紀錄

目前版本：1.2.8

## 1.2.8 — 修正夜間色系按鍵對比不足（2026-09-15）

- 使用者實測夜間色系後截圖回報：測驗選項按鍵看不清楚。
- 根因：`.options button` 原本跟 `.workspace`、`.student-nav` 等整頁區塊共用同一條夜間覆寫規則，背景色都設成 `var(--page)`，導致選項按鈕跟頁面背景幾乎同色，只剩一條細邊框；而且這條規則的優先順序比 `.options button.chosen` 的淺色底（`#ecf6fe`）更高，選了但還沒交卷的「已選擇」狀態在夜間模式下背景會被蓋掉、幾乎看不出有選。
- 修正（僅 `src/style.css`）：
  - `.options button` 從夜間共用的整頁背景規則中移除，改用跟其他按鈕一致的 `var(--surface)`（比頁面背景亮一階），並補上 `border-color: var(--line)`。
  - 新增 `.options button.chosen` 的夜間專屬底色（`#24425c`）與框線（`var(--blue)`），選了但還沒揭曉答案時清楚可見。
  - `.options button b`（選項字母徽章 A/B/C/D）補上固定文字色 `#304957`——原本沒有指定顏色，夜間模式下徽章背景維持淺色但文字會跟著父層變成淺色，導致字母幾乎看不見。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純 CSS 調整，不影響邏輯測試）。實際對比度／可讀性需要使用者部署後在夜間色系下親自確認。
- 純前端變更，不需要重新部署 Functions。

## 1.2.7 — 色系／字級選單從右下角浮動移到頁面最上方（2026-09-15）

- 使用者實測 1.2.6 後回報：右下角浮動的「字級」「色系」選單會蓋住頁面內容（截圖顯示蓋住「抽10題」文字），要求移到上方。
- `src/style.css`：拿掉 `.theme-picker`／`.fontsize-picker` 的 `position: fixed`，改成放進新的 `.prefs-bar`（`position: sticky; top: 0;`）常駐列，水平排列在頁面最上方、往右靠齊；捲動時會貼齊頂端但不會像原本 fixed 疊在任意內容上面。
- `src/main.tsx`：`<ThemePicker />`、`<FontSizePicker />` 包進 `<div className="prefs-bar">`，放在 `<App />` 之前，教師後台／學生端／登入畫面都會出現在最上方。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純版面調整，不影響邏輯測試）。
- 純前端變更，不需要重新部署 Functions；實際視覺效果需要使用者部署後親自確認選單位置與是否還會蓋住內容。

## 1.2.6 — 完整測驗恢復交卷後才揭曉、傳統解析改回收合、新增字級設定（2026-09-15）

- 使用者實測 1.2.3 的「一次給到位」後回報：完整測驗作答中就能逐題看到正解與解析，跟閃卡沒有差別，這樣不對；同時希望傳統解析預設收合、要點才展開（引導式解析維持直接展開）。
- `src/Student.tsx`：`choose()` 改回 `if (mode !== 'quiz') setLocked(...)`——quiz 模式（完整測驗／抽題練習）作答中不鎖定、不揭曉，交卷後才看得到；閃卡／複習模式不受影響，維持選了就立刻看到。
- `src/QuestionContent.tsx`：`Explanations` 的傳統解析改用 `<details><summary>傳統解析</summary>...</details>`，預設收合；引導式解析維持不用點擊、直接展開。
- 新增使用者要求的字級設定：`src/style.css` 所有 `font-size: Npx` 改成 `font-size: calc(Npx * var(--font-scale, 1))`（含一處 `clamp()`），`:root` 新增 `--font-scale: 1`；新增 `src/FontSizePicker.tsx`（比照 `ThemePicker.tsx`，`localStorage` key `course-font-scale`，小／預設／大／特大四檔），`src/main.tsx` 掛載，`.fontsize-picker` 樣式放在色系選單正上方。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（quiz 鎖定邏輯與 Explanations 元件本身沒有被單元測試覆蓋，屬 React 元件行為，需人工/部署後驗證）。
- 純前端變更，未動到 Cloud Functions 或資料結構，不需要重新部署 Functions，push 後 GitHub Pages 重新發布即可生效。

## 1.2.5 — 名冊信箱不再限制網域，一般 Gmail 也可通過（2026-09-15）

- 使用者部署 1.2.4 後實測，看到具體錯誤訊息「名冊格式錯誤：第 1 列：信箱、姓名、學號或班級不完整」，找到真正卡住的原因：平台原本寫死信箱必須是 `@ctcn.edu.tw`，但班級名冊分頁的欄位其實叫「Gmail」。使用者明確要求取消這個網域限制，理由是「反正有名單」——真正能不能用某堂課，是由該課程自己的班級名冊（enrollments）決定，不是信箱網域。
- 確認 `access()` 一定會另外檢查 `enrollments/{courseId}__{email}` 是否 `enabled` 且班級在已發布班級清單中，移除網域限制不會讓沒登記的人看到課程內容。
- 修正：`shared/model.ts` 的 `allowedEmail()` 拿掉 `@ctcn.edu.tw` 網域檢查，改成只檢查基本信箱格式（有 `@` 與網域）；`functions/src/index.ts` 對應的錯誤訊息文字同步更新，不再暗示網域限制。
- 更新 `tests/core.test.ts`、`tests/platform.test.ts` 裡原本斷言「非學校信箱會被拒絕」的兩個測試案例，改成斷言新的預期行為（一般信箱通過、格式不對才擋下）。
- 驗證：根目錄 `npx tsc -b` 無錯誤；`npm test` 28/28（含更新過的測試）；`functions/` 底下 `npm run build`（29 個函式）與 `npm test`（5 項）皆通過。
- 下一步：需要使用者重新部署 Functions（`npx firebase-tools deploy --only functions --project ap2-7ed91`）才會生效；部署後如果班級名冊四欄格式都正確，這次應該能真的同步成功。

## 1.2.4 — 修正「同步班級名冊」未攔截例外導致 internal/500（2026-09-15）

- 使用者實測回報：按「同步班級名冊」出現「internal」錯誤；補上先前漏部署的 `syncRoster` 並重新部署後，改成瀏覽器 Console 顯示 `Failed to load resource...status of 500`。
- 根因：`syncRosterFromSheet` 呼叫 `parseRosterSheet` 時，若名冊分頁格式或內容不合法（缺欄位、信箱或學號重複等）會丟出一般 `Error`；`syncRoster` 這個 onCall 沒有 try/catch 接住，整個函式以未處理例外結束，Firebase 只回傳籠統的 `internal`／HTTP 500，看不到真正原因。
- 修正：`syncRosterFromSheet` 改用 `try/catch` 包住 `parseRosterSheet` 呼叫，轉成 `fail()`（`HttpsError`），前端才能顯示具體的中文錯誤訊息；找不到「班級名冊」分頁時也改用 `fail()` 而不是直接 `throw Error`。
- 驗證：`npm --prefix functions run build`（tsc＋29 個入口載入）與 `npm --prefix functions test`（5 項）皆通過；未新增針對這個 try/catch 的獨立測試（`syncRosterFromSheet` 會呼叫 Google Sheets API，直接測試需額外 mock `fetch`，超出這次修正的風險/效益，已在 handoff.md 記錄）。
- 下一步：部署後麻煩使用者重新按「同步班級名冊」，這次應該會看到具體錯誤訊息而不是 internal；再依訊息內容判斷是 Sheet 欄位還是資料格式的問題。

## 1.2.3 — 解析改名為「引導式解析」，答案與解析一律直接顯示（2026-09-15）

- 「蘇格拉底式解析」改名為「引導式解析」（欄位鍵名 `socratic.*` 不變，Sheet 匯入欄位名稱也不變）。
- 傳統解析與引導式解析在所有畫面（一般測驗作答中、閃卡、錯題複習、交卷後複習、教師題庫預覽）一律直接展開顯示，移除原本的 `<details>` 收合互動，不需要點擊。
- 一般測驗（quiz）作答中選了答案就立刻鎖定並顯示正解與解析，不用等交卷——這是使用者明確要求的改動，刻意放棄「作答中不能偷看答案」的防呆設計。
- 純前端變更（`src/QuestionContent.tsx`、`src/Student.tsx`、`src/App.tsx`、`src/style.css`），未動到 Cloud Functions 或資料結構，不需要重新部署 Functions。

## 1.2.2 — 同步操作移至題庫與名冊頁（2026-09-15，待發布）

- 「同步題庫」改放在「題庫管理」，只同步課程代碼同名的題庫分頁；同步後仍可按次單元讀取已連接版本預覽。
- 「同步班級名冊」改放在「班級名冊」，只讀取 `班級名冊` 分頁；同步後可讀取與搜尋已同步資料。
- 平台設定只負責保存 Google Sheet ID；兩個頁面皆移除 CSV／JSON 與舊名冊移轉等手動資料入口，避免出現兩個資料來源。

## 1.2.1 — Google Sheet 分頁增量同步（2026-09-15，GitHub Pages 已發布；Functions 待部署）

- 題庫分頁以課程代碼命名並獨立同步；正式題庫欄位相容 `題目`、`正確答案文字`、`序號` 與 `③對答案`。
- 新增獨立「同步班級名冊」流程，讀取 `班級名冊` 的授課班級、學號、姓名、Gmail；題庫與名冊都只在內容有變更時寫入。
- 前端版本已發布為 1.2.1；`syncSheet`／`syncRoster` callable 要生效仍需部署 Firebase Functions。

## 1.2.0 — 部署腳本修正（2026-09-14）

- 先驗證 Firebase 憑證與固定專案、Git 狀態及 main 祖先關係；Functions 成功後才發布遠端 main，同一個已測試 commit 貫穿流程。
- 部署不再切換／合併本機 main；失敗停止並說明後端可能部分更新，Pages 成功須查看 Actions。保留正式部署前確認。
- Bash 語法及 10 個隔離部署情境驗證通過；無正式推送或部署。

## 1.2.0 — 題庫接軌與接手修正

- 前次分支實作：單元／次單元兩層、題序穩定排序、啟用欄、學生自選抽題、選項洗牌、解析五段與新舊欄位相容。
- 接手修正：交卷上限與題庫統一為 500 題，調整請求大小容納完整答案。
- 題序空白不產生 Firestore 不接受的 undefined；非數字題序回報列號。
- 補上本機 callable 整合驗證，涵蓋 500 題發布與交卷、重送去重、超量拒絕。
- 將原本仍為 1.1.2 的版本標示統一升為 1.2.0；目前未合併或部署。

## 1.1.2 — 測試學生帳號白名單

- 新增 `config/testStudents` 文件（欄位 `emails` 為信箱陣列），列在其中的信箱可以學生身分登入，用於上線前實測；清空即立即失效。
- 白名單只放寬信箱網域，仍要求 Google 登入且信箱已驗證；其餘名冊、班級、發布與權限檢查完全不變。
- 名單存在 Firestore，不進入前端程式碼與公開發布的 bundle；後端以 60 秒快取讀取，學校信箱登入不會多一次讀取。
- 測試帳號的 profile 標記 `test: true`；報表、完成度與結算皆以班級為單位，建議把測試帳號放在專屬測試班隔離。
- 名冊驗證（Sheet 同步、CSV 匯入、教師後台預覽）改為接受白名單信箱，預設仍只收學校信箱。

## 1.1.1 — 課程、單元、班級代碼可用中文

- 新增 safeCode 驗證：教師自訂的課程、單元、班級代碼可使用中文、英數字、`-` 與 `_`，長度上限 50，仍禁止空白、斜線、句點與其他標點，確保可安全作為 Firestore 文件 ID 與 Google Sheet 分頁名稱。
- 前端建立課程／單元／班級，以及後端 saveCourse、getRoster、getHistory、getBank、題庫發布、名冊與題庫同步、互動教材事件的代碼檢查一併改用 safeCode。
- 題目 ID、學號、題庫版本、快照與活動 ID 等系統識別碼維持原本英數字規則。
- 既有英數字代碼不受影響，不需要資料移轉。

## 1.1.0 — 課程分班、Sheet 與互動教材整合

- 課程下建立班級、各班勾選單元，課程複製／封存、單元整理與保存提示。
- 名冊採課程歸屬，舊名冊先預覽後轉換；草稿保存不改學生發布權限。
- Sheet 相容 v1.9 中文題庫、傳統／蘇格拉底式解析與圖片題。
- 互動教材事件 SDK、去重及補送、班級與個人診斷；YouTube 標為選看。
- 海洋藍、森林綠、紫羅蘭、夜間色系；範本與上線指南見 docs/IMPLEMENTATION_GUIDE.md。
- 修正 tests/material.test.ts 未同步 HtmlMaterial 新增的 api／courseId／unitId／uid 必填 props，避免型別檢查與 CI 失敗。
- 驗證及正式部署狀態另見 docs/ACCEPTANCE.md。

## 1.0.7 — 修正班級 ID 輸入無法打逗號

- 「班級 ID（逗號分隔）」輸入框原本直接把已解析、過濾空字串後的陣列 join 回輸入框，導致輸入逗號後立刻被清掉，實際上完全無法打出逗號。
- 改為輸入框顯示獨立保存的原始文字狀態，解析後的 classIds 陣列在背景同步更新，輸入過程不再被即時清洗覆蓋。

## 1.0.6 — 課程刪除功能

- 新增後端 `deleteCourse` callable：僅課程授權教師可刪除課程文件本身，刪除前沿用既有 `access()` 教師權限檢查。
- 教師後台「課程與教材」新增「刪除課程」按鈕，刪除前需二次確認；刪除後自動切換到清單中的其他課程。
- 刪除課程不會回收已發布的題庫版本（`banks/*`）與歷史作答紀錄，維持既有內容雜湊版本不可變的設計。

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
