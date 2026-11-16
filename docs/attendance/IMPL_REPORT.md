# 課堂點名 #67 第二階段：實作報告（2026-11-17，Claude Fable）

## 給驗證者的摘要
- 範圍：規畫 v3＋第 0 節 23:10／23:16 教師決定（狀態只有「準時／未到」可互改留時間紀錄；寄信由老師現在寄、每次設定時間、每日預設時間）。後端、Apps Script、學生端與教師端畫面、測試一次交齊。
- 分支 `feature/attendance`（worktree `.worktrees/attendance`），未 push、未合併、未部署、未寄真信、未寫正式資料。版本號未改（交辦第 0 節）。
- 新檔：`shared/attendance.ts`、`functions/src/attendance.ts`、`src/Attendance.tsx`、`src/AttendanceAdmin.tsx`、`src/attendance.css`（由樣張 CSS 改名擴充）、`apps-script/AttendanceMailer.gs`、`docs/attendance/APPS_SCRIPT_SETUP.md`、`functions/tests/attendance.test.cjs`＋`helpers/attendance-memory.cjs`、`tests/attendance.test.ts`、`tests/fixtures/attendance-ui.tsx`、`scripts/attendance-ui-check.mjs`、`scripts/attendance-sample/readability.mjs`。
- 改檔：`shared/features.ts`（加旗標 attendance，預設關）、`functions/src/index.ts`（接線 18 個函式）、`src/App.tsx`、`src/TeachingControl.tsx`、`src/main.tsx`、`firestore.rules`、`scripts/lib/readability-static.mjs`（靜態檢查納入 attendance.css）、樣張腳本與 fixture。
- 實跑（雲端 Linux、非 root、Node 22）：後端 `attendance.test.cjs` 13/13 PASS；`tests/attendance.test.ts` 8/8 PASS；`tests/readability.test.ts` 5/5 PASS；`functions` build PASS（67 個函式載入）；`tsc -b` 我的檔案 0 錯；`attendance-ui-check.mjs` 學生 17 畫面×預設／特大＝34＋教師 5 分頁全 PASS、頁面錯誤 0；樣張腳本 PASS；新 CSS 靜態檢查 0 項；`grep /Users|/private/tmp` 0 筆。
- **沒有實跑**（工作區只有程式碼子集，沒有 docs／public／materials-src，也抓不到 Emulator）：整套 `npm run check`、`vite build` 完成階段、Firebase Emulator、Firestore 真實交易、rules、真的 Apps Script 寄信、手機實點。後端整套在此為 116/117，唯一失敗是 `classroom.test.cjs` 找不到 `docs/unify-1.9.0/mi-interactions.json`（工作區缺檔，非本件造成）。**教師 11/16 23:25 指定：Emulator 與 Mac 上整套測試交 Antigravity。**
- 偏離或拿不準：見下方「實作決定與偏離」9 項；最需要審的是第 2、5、6 項。
- 請關鍵審查看的四處：見下表（檔案與行號）。

## 關鍵審查四處（行號為本次 commit）
| 項目 | 位置 |
|---|---|
| 1 憑證與防偽造／防猜碼 | `functions/src/attendance.ts` 79–125（`attendanceCode`、`tokenSignature`、`tokenMatches`、`codeMatches`：HMAC-SHA256、每節隨機 32 位元組秘密值、timingSafeEqual）；603–669（簽到驗證順序、錯 5 次鎖住的交易）；`shared/attendance.ts` 86（`acceptedSteps`：目前與上一組） |
| 2 自動結束與簽到的同時寫入 | `functions/src/attendance.ts` 211–233（`materialize`：只補沒有紀錄的人）；234–262（`settle`：交易內關閉節次）；670–700（簽到交易內再讀節次並檢查開放與時間） |
| 3 寄信只寄未到且不重複 | `shared/attendance.ts` 206（`pendingStudentMail`）；`functions/src/attendance.ts` 314–362（`pendingMail`：只看已確認節次）；363–470（`runSend`：交易認領 → 寄 → 失敗還原）；1144（中斷的信放回待寄）；1170（排程 tick） |
| 4 權限與個資 | `functions/src/attendance.ts` 149（全部 callable 過旗標）；724–745（`attendanceMine` 只回自己的狀態與時間）；762–799（名冊只回提醒、不回裝置編號）；972（寄信設定：密鑰只寫不讀）；`shared/attendance.ts` 384–440（信件內容）；`firestore.rules` 11–17；`apps-script/AttendanceMailer.gs` 全檔 |

## 做了什麼
- **簽到**：QR 是 `#/attend?c=課程&t=節次.區段.簽章`；已登入自動送出，未登入先登入；App 內建瀏覽器（未登入時）顯示改用 Safari／Chrome 與〔複製網址〕（不含憑證，貼上後輸入數字碼）；過期／非本班／已結束／鎖住／重複／試簽各有訊息。首頁橫幅平常只有「我的出缺席」入口，點名中顯示 4 格數字碼與倒數（沿用 15 秒輪詢＋回到分頁時查一次）。
- **教師端**：後台新分頁〔點名〕（授課控制台另有〔開始點名〕按鈕連過來）：開始／試簽／投影（QR、數字碼、倒數、已簽到、提前結束、延長 1 分鐘、全螢幕）；節次與名冊（點狀態即改、多選、原因、同裝置提醒、鎖住標示、補建、本節 CSV、確認）；總表與修改紀錄；寄信（待寄、現在寄出／設定時間／每日預設時間、取消排定、寄送紀錄、導師與寄信程式設定）。
- **匯出**：累加用明細檔表頭固定 13 欄、學號以文字輸出、列鍵（課程代碼、日期、節次、學號）唯一；另有本節 CSV 與總表 CSV。封存課程教師仍可匯出。
- **給其他功能的接點（不接線）**：`readClosedAttendance(db, courseId)`、`recentAbsentCount`（最近 N 節未到次數）、`absentEmailsAt`（某節未到名單）。

## 測試對照（交辦第 3 節）
| # | 內容 | 位置 | 結果 |
|---|---|---|---|
| 1 | 碼與憑證：區段、目前與上一組、過期、偽造、錯 5 次鎖 | `attendance.test.cjs` 前 2 支 | PASS |
| 2 | 非本班／未開啟／已結束含寬限／教師拒絕；重複回原結果；自動結束＝未到；結束與簽到同時 | 第 3、4 支 | PASS（交易為記憶體模擬，見偏離 6） |
| 3 | 延長、提前結束、重新點名、補建 | 第 5 支 | PASS |
| 4 | 改狀態單筆／多筆、互改、修改紀錄、學生端看不到 | 第 6 支 | PASS |
| 5 | 同裝置提醒 | 第 7 支 | PASS |
| 6 | Email：只寄未到、更正信、導師彙整只含已確認、不重複、失敗重寄、排程、中斷放回、內容 | 第 8–10 支＋`tests/attendance.test.ts` | PASS（假寄信端點） |
| 7 | 旗標關閉全部拒絕、UI 不顯示 | 第 11 支＋`tests/attendance.test.ts` | PASS |
| 8 | 學生頁面閱讀規範 390 預設與特大 | `scripts/attendance-ui-check.mjs` | PASS（34 畫面） |
| 9 | `npm run check` | — | **未跑，交 Antigravity** |

## 實作決定與偏離（請審）
1. **紀錄以名冊信箱為鍵**（`records/{email}`），不是規畫寫的學號：名冊與登入都以信箱為準，寄信也要用；學號、姓名存在紀錄裡。
2. **寄信程式網址與密鑰存 Firestore**（`courses/{c}/attendanceSecrets/mailer`，rules 全拒、callable 只寫不讀），沒有用 Secret Manager：避免部署時因缺 secret 失敗，教師可在後台自己貼。網址限定 `https://script.google.com/macros/s/…/exec`。
3. **節次編號固定**（日期＋節次＋班級組合）：同一節再按〔開始點名〕沿用原紀錄（已簽到保留）；同一節班級有重疊但組合不同會拒絕；已確認的節次不能重新點名。
4. **自動結束不靠排程**：時間（含 5 秒寬限）一過簽到就被拒；「未到」紀錄在下一次有人讀取時補上（投影畫面輪詢、教師後台、學生首頁橫幅都會觸發）。
5. **新增排程函式 `attendanceMailTick`（每 5 分鐘）**：只查 `courses.attendanceNextSendAt` 到期的課程；沒有設定時間的課程不會被寄。這是 23:16 決定帶來的新範圍，部署會多一個 Cloud Scheduler 工作。一次性排定與每日預設時間到點時，寄出**全部**已確認節次的待寄信與當天導師彙整。
6. **「結束與簽到同時」的測試用記憶體交易模擬**（依序執行、先讀後寫），沒有在真的 Firestore／Emulator 上驗證鎖與重試。
7. **導師彙整每班每天一封**：當天寄出後又確認了別的節次，不會再寄第二封（畫面在寄出前會提醒還有未確認的節次）。準時改回未到的補寄、更正信都進「待寄」，不自動寄。
8. **旗標沒有後台開關**（與 assessments／classroomInteraction 相同，由資料設定）；放進 `featureNames` 後，存課程時的保留規則與既有旗標一致。
9. **信件裡的「我的出缺席」連結**：教師在〔寄信設定〕按儲存時，由瀏覽器帶入目前的平台網址；沒儲存過就不放連結。

## 給 Antigravity（跑測試）
- 在 worktree `npm ci`（根目錄與 functions），跑 `npm run check`、`node scripts/attendance-ui-check.mjs`、`node scripts/attendance-sample.mjs --out <暫存>`。
- Emulator：用 `demo-` 專案啟動 Firestore＋Functions＋Auth，開旗標後實走一次：開始點名 → 兩個學生帳號簽到（QR 與數字碼各一）→ 同時按〔提前結束〕與送出簽到 → 改狀態 → 確認 →（不設定寄信程式）確認寄信被拒。`scripts/attendance-sample.mjs` 的 Emulator 路徑（設 `FIRESTORE_EMULATOR_HOST`、`GCLOUD_PROJECT=demo-…`）也請實跑一次。
- 只跑不改，失敗退回 Fable。

## 截圖
`課程平台-驗收證據/2026-11-17/attendance/`（保存至 2026-11-24）：`ui-*.png` 22 張（學生 17 畫面 390 預設、教師 5 分頁 1440）與 `ui-result.json`。存證用，不逐張檢視；因為是新畫面，我看過其中 5 張（投影、節次與名冊、寄信、橫幅輸入錯誤、簽到頁輸入錯誤）。
