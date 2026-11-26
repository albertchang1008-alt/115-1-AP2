# #74 點名班級優先與試務中心實作驗證

## 給 Claude 的摘要
- 版本 1.17.2，基準 `98d58d4a`，功能提交 `da95628f`。分支 `feature/attendance-class-first`。
- 點名由班級進已點紀錄與明細。同日每次獨立計數。補點保留原始開始時間，學生頁只呈現本人。
- 已刪除紀錄立即退出統計、匯出及待通知。30 天內復原，逾期每日清除點名子集合與憑證，留教師稽核。
- 試務中心保留舊路由。出題次單元預設收起，支援半選、已選數及整批展收。
- 主要檔案為 `functions/src/attendance.ts`、`shared/attendance.ts`、`src/AttendanceAdmin.tsx`、`src/Attendance.tsx`、`src/ZuvioExams.tsx`、`src/xlsxWorkbook.ts`、`firestore.indexes.json`。
- Mac 全套 528/528、0 skipped，閱讀規範 17/17。Ubuntu 功能專項通過。全套重現 K1，水鈉單項復測兩個提交各 342 畫面通過。GitHub Actions #103 對 #73 已綠勾，課堂實點待教師。
- 樣稿連結未能讀取，依文字規格。既有資料無原始開始時間時保留舊節次標籤。全程合成資料，教師手機實點及雲端索引生效待後續。
- 抽查 1｜並行開場、補建、同日多次以及舊合班/補點的相容性。
- 抽查 2｜刪除、未到通知、恢復的交易及 30 天排程，見 Firestore Emulator 原始輸出。
- 抽查 3｜學生 390 預設／特大結果及 Excel 36 欄資料，見瀏覽器與 XML 結果。
- 抽查 4｜試務中心半選、鍵盤展收與舊出題全流程，見 Zuvio 瀏覽器 manifest。
- 抽查 5｜Ubuntu 非 root 摘要、失敗段與 K1 基準對照。

## 實作與相容性

- 教師頁保留平台的學期／課程切換。班級卡片讀取班級人數、今天狀態、待確認與待通知。測試班置底，班級專頁可驗證其資料，課程整體匯出與統計排除測試班。
- 一筆正式點名限一班。後端以台北日期、開始時間、班級雜湊與序號識別點名。每日班級序號在交易內分配，補建與開場共用計數器。補建填台北日期時間，依實際時間排入紀錄。匯出累加舊鍵保持穩定，補建不重排已存在序號。
- 再開放用獨立時間旋轉 QR／數字碼，畫面、彙整和信件仍取原始 `startedAt`。既有補建資料以建立時間寫入 `startedAt`，以及 #73 覆蓋原時刻的舊再開放資料，都保留舊節次標籤。
- 舊合班明細顯示整筆歷史名單，班級列表與總表只統計該班。從任一班刪舊合班時，對話框列出受影響班級及整筆人數。已標記學生或導師通知時另提示信件無法撤回。
- 刪除、復原、確認、取消確認及再開放均留教師修改紀錄。排程逐日清除到期紀錄的資料與憑證，稽核與通知史獨立保留。生產刪除與排程均未執行。若教師日後核准部署，`attendance.deletedAt` collection group 單欄索引須先就緒。 [Firestore 索引設定規格](https://firebase.google.com/docs/reference/firestore/indexes#fieldoverrides)
- 學生端回傳本人統計、簽到及補點時間與老師更正標記。教師身分、別班和額外查詢欄位的資料隔離由測試覆蓋。累加 CSV 原 13 欄順序保留。本筆 CSV 增列「補點時間」。Excel 保留統計及矩陣兩區，補點時間另列於同工作表下方，矩陣格及狀態欄維持「準時／未到」。
- 版號使用 `version:sync`，功能樹的三份版本行隨 1.17.2 同步。主工作目錄的 `handoff.md` 規則保留。

## 證據與查核

| 項目 | 結果 | 原始位置 |
|---|---|---|
| Mac 全量 `npm run check` | 前端 366/366、後端 162/162，0 skipped，建置通過。可讀性 17/17、4,864 畫面、0 問題。功能提交的 `npm run check` 同結果 | `mac-check.log`、`mac-final.log` |
| 專項 Functions | 21/21，0 skipped | `attendance-functions.log` |
| 點名 UI | 36 個學生狀態尺寸、10 個教師頁尺寸、9 項操作，0 問題、0 瀏覽器例外 | `attendance-ui-r2/ui-result.json` |
| 試務中心 UI | 收起元件測試與既有出題、成績、情緒全流程通過，新增兩張截圖 | `zuvio-ui-r2/manifest.json` |
| Firestore Emulator | 既有簽到＆提前結束腳本 2 回合／每回合 20 人，無測試失敗。本輪沒有同一回合同時出現接受與拒絕 | `attendance-emulator.log` |
| Firestore Emulator 專項 | 兩個同時開場只成立一筆。開場與補建並行序號 1–4。清除後序號續為 5 | `attendance-emulator-period.log` |
| 投影錄影入口 | 系統 Chrome 實跑 60 秒，倒數 1:42→0:42，簽到 45/60→56/60，QR 已換。只留採樣 | `attendance-projection-record.log`、`attendance-projection-record.json` |
| Excel 36 欄 | ZIP CRC 正確，最右 AM，學號保留前導零，數值是數值，文字無公式 | 本機以 Python `zipfile` 與 XML 讀回合成工作表 |
| 可攜性 | 變更的測試腳本 grep 零筆 `/Users`、`/private/tmp` 或硬寫 `/tmp/`。Node 22.23.2 版本同步通過 | `version-and-paths.log` |
| #73 已部署追蹤 | Actions #103 成功，對應 `98d58d4a`。課堂實點待教師 | [Publish course platform #103](https://github.com/albertchang1008-alt/115-1-AP2/actions/runs/45617801012) |

本機原始紀錄在同層 repo 外的 `課程平台-驗收證據/2026-11-25/attendance-class-first-74/`。截圖保存至 2026-12-02。點名外框抽看 `attendance-ui-r2/ui-teacher-classes-390.png` 一張，班級、今天狀態與待辦都可直接辨認。學生頁以 390 預設與特大自動量測為準，日期時間、簽到與補點標記均可讀，最後由教師在手機實點。試務中心以自動檢查確認展收按鈕高度 ≥44 px 與狀態切換。設計技能的靜態檢查仍標記三個原有簽到成功勾號。基準共有八處符號警示。

### Ubuntu 非 root 重播

完整重播為 2026-11-26 00:12 完成的 `課程平台-驗收證據/2026-11-25/ubuntu-replay-da95628f-2331/`。原始 `summary.txt` 共 15 步，13 PASS、2 FAIL。

- `06-check-all` 前端 364/366、0 skipped。兩個 FAIL 是同一個 K1 的子測試及上層聚合。與基準 `ubuntu-replay-98d58d4a-1929/06-check-all.log` 的三個 N02 畫面逐項一致。
- `06b-build-backend` 建置與 Functions 162/162、0 skipped。版號檢查、試務中心、點名 UI（46 個尺寸與狀態）、小考 Emulator／瀏覽器與工作樹核對都通過。
- `07-readability-hit` 單次全量 16/17，已量到 4,780 畫面、0 尺寸或靜態問題。水鈉教材等待完成事件超過 7 秒，見 `readability-hit/summary.json`。這次的基準原始全量結果為 17/17。
- 第二輪僅針對同一份水鈉教材，先測 `98d58d4a` 再測 `da95628f`。兩邊各通過 342 個畫面，0 閱讀問題、0 錯誤、0 skipped。教材與量測程式皆未改動，首輪逾時未重現。完整全量與專項是兩次獨立輸出。證據保存於 `attendance-class-first-74/ubuntu-round-2-water-sodium.log`。

### 自修清單

- 曾連到主工作目錄舊依賴，基準畫面找不到模組。改用與 `98d58d4a` 同基準的本機套件後，基準畫面 39 項通過，見 `baseline-attendance-ui.log`。
- Functions 專項首輪原有旗標測試仍期待 19 個 callable。更新斷言為 22 個 callable，另以獨立測試核對逾期排程。
- 點名 UI 首輪兩張明細截圖的定位同時命中列和操作鈕。限定至紀錄列後通過。試務中心首輪已走完操作，舊有 12 張截圖核對更新至 14 張後通過。

## 時程與交回

以交棒訊息的 11/26 12:30 前交回為截止。交棒另列 Claude 00:50、Codex 02:00 接手及 03:00 前交回，交辦檔與佇列另列 12:50、14:00 與 16:30。實作提交與證據先行交回，若 Claude 將 #74 改為「停-等Codex」，下輪依佇列與教師最新時段處理。
- 2026-11-26 教師改為保留 180 天（Claude）：ATTENDANCE_RESTORE_MS 30→180 天；刪除提示與逾期訊息同步改字。排程時間不變（每日 03:30）。
