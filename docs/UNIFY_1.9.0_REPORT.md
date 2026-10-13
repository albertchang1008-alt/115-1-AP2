# 課序 1.9.0 共用功能整合報告

2026-10-13，Codex。本機分支 `feature/1.9.0-unify`，worktree `.worktrees/unify-1.9.0`；從 `origin/main@a593796` 開始。

78cb5dc 已獲 Claude 有條件通過；本次完成 M-1、m-1、m-2、m-4，待 Claude 複驗與教師授權。未 push、部署或執行 migration 寫入；未讀寫兩站正式學生資料。最後本機 commit 可用 `git log -1` 查閱。

## Claude 驗收修正（2026-10-13）

- M-1：apply 讀回簡報改用 `presentationSnap`，存在檢查同步改名；交易仍展開檔頭載入的 `mi-slide-transforms.json`。
- 新增 CLI apply 回歸測試，以 preload 完全攔截 Firebase SDK，假 `runTransaction/tx.get/tx.set` 記錄兩筆寫入；斷言設定完全等於 `{ interactions, ...mi-slide-transforms.json }`、merge 為 true，且沒有 snapshot 欄位。測試另封鎖網路；沒有載入真實 SDK／憑證或連線任何 Firebase 專案。
- m-1：開啟正式前後測且任一來源空白，保存成功後提醒補齊來源；不阻擋保存。React 驗證涵蓋僅前測、僅後測、兩邊空白、兩邊完整及功能關閉。
- m-2：功能標題明示「保存草稿即對學生生效，不需發布」，桌機與手機均驗證。
- m-4：18 張截圖重拍；48px 白底標籤帶位於原始畫面上方，原介面內容不被覆蓋。驗證標籤與內容矩形不相交，並目視抽查手機反思／桌機設定畫面；兩站 guide 重新建置驗證。
- 驗收原文留在 `docs/unify-1.9.0/UNIFY_1.9.0_CLAUDE_ACCEPTANCE.md`；該文件針對 78cb5dc，不代表修正版已複驗。m-3 的 AP2 是否加入 MI 22 題留給教師決定，本次未改 Excel。
- 未 push、部署或執行真實 migration；下方 apply 測試僅為假 Firestore 測試，不是線上相容性驗證。

## 移植範圍

使用逐檔 patch 與三方整合；沒有 merge MI 網站分支。

|來源|納入內容|
|---|---|
|`fix/separate-115-MI-bank@54a1d3c`|還原 AP2 題庫 Excel；Git blob `cf13a66ac2f10817bf9ec45dde89a5b12130d9fa` 與該 commit 完全一致|
|`ec8947f`|1.8.0 反思資料模型、callable、學生／教師介面、快照／CSV、既有測試與驗證腳本|
|`fe814dd`、`c33dbe7`|私有正式前後測、手動開放／結束／公布、補考理由、配對 CSV|
|`1b3b4fe`|私有簡報授課控制台、黑屏、備註、全螢幕與進度／測驗控制|
|`c2c1b1e`、`70354e0`|選項式互動、排序、輪次快照、投影片綁定、常駐狀態、倒數與加時|
|`d48aac8`|影片等待雲端進度／失敗重試、正式測驗種類切換重設補考狀態|

版本已同步 VERSION、兩端 package／lock、shared/version.ts、apps-script/version.gs、public/version.json 與三份文件版本行。

## 共用化與資料保護

- `Course.features` 三項預設關閉。教師在「課程與教材」的課程功能設定勾選、保存；根文件 `features` 是後端的即時權威，bootstrap 與課堂更新回傳同一份開關。
- 全部新 callable 經既有 `access()`，再驗 features。關閉時拒絕，且不讀寫功能子集合。`getClassroomCourse` 需授課控制台或課堂互動其一開啟；排程到期結算仍維持原本的已開始測驗清理。
- 前後測來源由每門課自己的 `assessmentSources.pretest/posttest` 題目 ID 設定，保存後同步題庫抽出私有來源。支援各 1–100 題，已建立試卷不變。CSV 名稱為 `<課程代碼>_前後測配對.csv`。原 MI 私有來源欄位與子集合路徑不改。
- 私有題目隔離不因 feature 關閉而解除，避免回到一般練習。公布前不含答案／分數／解析，成績仍由後端私有答案計算。
- 每課 `teacherAssets/presentation` 保存私有簡報；沒有簡報回傳空 slides，控制台改顯示進度。測驗分頁另依 assessments 開關顯示。
- 互動定義從 `classroomConfig/interactions` 讀取，教師可在「課堂互動」設定 JSON、選题直接開放，也可綁定簡報 slideId。參與班級取自課程，不再限定 N551／N552。
- 輪次仍在 `courses/{courseId}/classroomState/current`、`classroomRounds`；不搬動資料。舊輪次沒有 deadlineAt、舊 state 沒有 latestBySlide 時均有相容路徑。
- MI 舊簡報的選項作答指示與備註前綴，移到 MI migration 資料 `slideTransforms/interactionNotesPrefix`；共用後端依資料轉換教師取得的簡報，不改私有原稿。新增測試與 `70354e0` 舊轉換逐頁比較，顯示完全一致。功能關閉則不套互動指示。
- 反思必修已完成：CRLF／CR 正規化為 LF、允許換行／壓縮連續空行、Tab 等控制字元仍拒絕；已送出與結果保留換行。未作答名單優先 uid／非空 studentId，缺學號才回退 email，換信箱不誤列。
- Firestore 仍全面拒絕直接讀写；所有資料經後端權限驗證。完成度公式維持 3。

## 兩站建置

`VITE_SITE_ID=ap2|mi`；省略預設 AP2，其他值拒絕。網站設定集中在 `shared/site.ts`，GitHub Pages workflow 使用 repo variable `VITE_SITE_ID`。

- AP2：保留原有完整教材原始檔／快照、目錄與 AP2 MATERIALS_BASE_URL，不發布 CHP。
- MI：目錄與 dist 教材目錄只含 `micro-bacteria-review-v1`、`immuno-concepts-review-v1`；MATERIALS_BASE_URL 指向 MI。三份舊 CHP 放 `site-assets/mi/`，僅 MI build 複製到 dist，不放進 AP2 公開目錄。
- AP2 原快照測試沒有刪除。教材登錄測試以完整來源目錄驗證，網站目錄另依設定測試；名稱與網址測試保留 AP2 原斷言，MI 使用其實際目錄／網址。

## 學生使用說明

- 共用 `public/guide/index.html`、站內 CSS／JS／圖片，純靜態、無 Firebase、無外部相依、不需登入，支援列印、七種色系與四級字級。build 帶入網站名稱與返回網址。
- 登入頁「第一次使用？看使用說明」；學生首頁 prefs-bar「？使用說明」。新視窗開啟，保留目前課序。
- Student.tsx 首次三張提示（待辦、分頁、完成度）可逐張閱讀或略過；只存 `course-guide-seen:<courseId>:<uid>`，storage 失敗仍可關閉，不寫雲端。
- 第三節 1–10 與 1.7.x 練習規則、1.9.0 正式前後測／互動／反思／影片續播已納入；條件功能清楚標示「老師有開放時才會看到」。反思說明依 allowEdit／截止與保存成功規則。
- 截圖由實際 React 元件搭配本機合成測試帳號／測試班、記憶體 API 產生；未登入正式帳號、未使用真實名冊。18 張有指示標籤的 1280／390 JPEG 放 `public/guide/img/`，共 **585,690 bytes**（約 0.56 MiB，低於 3 MB）。
- 兩站建置說明頁截圖：[AP2 1280](unify-1.9.0/guide-ap2-1280.png)、[AP2 390](unify-1.9.0/guide-ap2-390.png)、[MI 1280](unify-1.9.0/guide-mi-1280.png)、[MI 390](unify-1.9.0/guide-mi-390.png)。

## 驗證

|最終指令|前端測試|Functions|build／版本／後端入口|
|---|---:|---:|---|
|`VITE_SITE_ID=ap2 npm run check`|157 全過、0 skipped|54 全過、0 skipped|全過；51 個入口|
|`VITE_SITE_ID=mi npm run check`|157 全過、0 skipped|54 全過、0 skipped|全過；51 個入口|

完整輸出：[check-ap2.txt](unify-1.9.0/check-ap2.txt)、[check-mi.txt](unify-1.9.0/check-mi.txt)。

額外驗證 `node scripts/guide-site-verify.mjs ap2|mi`：1280／390 未登入讀取、全部說明圖片可載、無外部依賴請求、最小字級 **12.25px**（小字級）、預設／特大字級無溢位、夜間色系與列印展開／還原有效、0 pageerror；並檢查 dist 教材與 CHP 範圍。證據為 `guide-ap2-verification.json`、`guide-mi-verification.json`。React 驗證含三張提示、略過後不重現、課程帳號隔離、storage 拒絕時可略過、登入／首頁連結與來源 ID 逐字輸入。

## MI migration dry-run

migration 資料查核使用離線 dry-run；apply 僅在假 Firestore 回歸測試中執行：

```sh
node scripts/migrate-mi-1.9.0.mjs --project mi-bd885 --dry-run
```

完整輸出：[migration-dry-run.json](unify-1.9.0/migration-dry-run.json)。只預計開啟該 MI 課程三項 features、同步現存 draft/published 的 features、寫入原 12 題定義及舊簡報文字轉換；12 題逐字與 `70354e0:shared/classroom.ts` 一致。其他正式紀錄／私有來源／簡報不寫、不搬移。

`--apply` 拒絕非 `mi-bd885`，另需 `--confirm-mi-only`；寫入前查驗該課程現存 state、rounds、assessments、presentation，缺少任何路徑立即停止。正式執行會用 transaction 更新，不覆蓋課程其他欄位。**本次只在假 Firestore 執行 apply 測試，未執行正式 migration；正式資料相容性留待授權後核對，沒有把本機測試當成線上驗證。**

## 授權後的部署草稿（本次未執行）

共同前置：Claude 驗收本分支；教師核准部署。正式 secrets／Firebase 設定使用各站既有值，兩站 repo 使用同一來源版本，只讓網站建置設定／GitHub variables 不同。

AP2：設 `VITE_SITE_ID=ap2`，由教師依既有 `scripts/deploy.sh` 流程執行；該腳本 Functions 指令明確使用 `--project ap2-7ed91`。本版新課程功能預設關閉；既有課程未設 features 也關閉。需另核對 repo variable 為 ap2 或未設。

MI：先由教師核對 dry-run 與舊資料路徑／備份，再執行以下已授權寫入與部署；不能在 migration 尚未完成時先上新 Functions。

```sh
node scripts/migrate-mi-1.9.0.mjs --project mi-bd885 --apply --confirm-mi-only
VITE_SITE_ID=mi npm run check
firebase deploy --only functions --project mi-bd885
```

MI Pages 的 repo variable 設 `VITE_SITE_ID=mi`；教師以通過驗收的同一來源版本走 MI 既有發布流程。若規則／索引需隨版部署，明確使用 `firebase deploy --only firestore:rules,firestore:indexes --project mi-bd885`；AP2 同理指定 `--project ap2-7ed91`。

MI 上線後先核對舊正式前後測場次與紀錄、舊互動輪次／無 deadlineAt 場次、私有簡報／指示轉換均可讀，再由測試班確認倒數／加時與手機結果。AP2 用測試班核對功能關閉介面、新設定只影響指定課程，之後再製作 AP2 自己的題目／簡報；本次未代製課程內容。
