# 課堂點名 #67 第二階段：實作報告（2026-11-19 更新 M1-b 退修）

## 給 Claude 的摘要
- 本次完成 #67 **M1-b 退修**（依 `M1B_CODEX_VERIFY_2026-11-19.md`）：修正屬性空間或寫入配額耗盡時「先寄後寫失敗導致重寄」問題，保留 **180 天**去重期限。
- 變更檔：`apps-script/AttendanceMailer.gs`、`functions/tests/attendance.test.cjs`、`docs/attendance/IMPL_REPORT.md`（保留既有未提交之 `docs/attendance/CLAUDE_KEY_REVIEW.md`）。
- 實跑指令：`node --test functions/tests/attendance.test.cjs`（Node v22.23.2），結果 **20/20 PASS**（含新增容量／寫入配額耗盡、寄信失敗清占位、寄出前中斷重試共 2 支回歸測試，合成資料＋假時鐘，未寄真信）。
- 偏離：無（`CacheService` 已移除，改於 `MailApp.sendEmail` 前以 `pending:<ts>` 預留去重鍵）。
- 抽查項（最多 5 項）：
  1. `apps-script/AttendanceMailer.gs`：鎖內清理過期鍵 → 查重（忽略 `pending:`）→ `props.setProperty(sentKey, 'pending:' + now)` 預留失敗即中止（`MailApp` 呼叫 0 次）→ `MailApp` 失敗清占位 → 成功後覆寫正式時間戳。
  2. `functions/tests/attendance.test.cjs`：512,000 B 滿載與寫入配額耗盡時，新信拒寄（`MailApp` 0 次）、已寄信正常去重、180 天有效紀錄全保留。
  3. `functions/tests/attendance.test.cjs`：寄信拋錯清除 `pending:`、寄出前中斷殘留 `pending:` 時同一 `mailId` 仍可重試並正式入帳。
  4. 本報告「返修 M1-b」補齊每次 `getProperty('MAIL_KEY')` 與預留／正式寫入的讀寫次數估算。
  5. `git status` 確認 `docs/attendance/CLAUDE_KEY_REVIEW.md` 未提交審查紀錄完整保留。

---

## 返修 M1-b（2026-11-19，Antigravity Hydrogen；含 Codex 退修）
- **實作**：`apps-script/AttendanceMailer.gs` 改用 `PropertiesService.getScriptProperties()` 保存 180 天去重紀錄。於 `LockService` 鎖內依序執行：① 清理已滿 180 天（`now - ts >= 180 * 86400_000`）的 `sent:` 鍵（保留 `MAIL_KEY` 與其他設定）② 查詢同 `mailId` 且非 `pending:` 則直接回 `{ok:true, duplicate:true}` 且不刷新時間戳 ③ 檢查每日寄信額度 ④ 先寫入 `pending:<now>` 預留紀錄（若空間滿或寫入配額耗盡直接拋錯回傳可重試失敗，`MailApp.sendEmail` 呼叫 **0 次**）⑤ 呼叫 `MailApp.sendEmail`（若失敗則刪除 `pending:` 占位後回報失敗）⑥ 成功後覆寫為正式毫秒時間戳 `String(Date.now())`。
- **180 天容量估算**（依 Google 官方 Apps Script 配額 <https://developers.google.com/apps-script/guides/services/quotas>）：
  - 官方上限：Properties total storage **500 KB**（512,000 bytes）per property store；Properties read/write 為 **500,000 次／日**（Google Workspace 帳號）。
  - 實際鍵值大小：鍵 `sent:` (5 B) + `Utilities.base64EncodeWebSafe(SHA-256 32B)` (44 B) = **49 B**；正式值 `String(Date.now())` = **13 B**（原始 **62 B／筆**）；暫存 `pending:<ms>` 為 **21 B**，正式寫入後覆寫為較短的 13 B，不額外增加存儲上限風險。另計 `MAIL_KEY` 與系統保留約 1,000 B。
  - 公式：$\text{最大筆數} = \lfloor (\text{總容量} - \text{固定保留}) / \text{單筆大小} \rfloor$，$\text{可承受日均寄送量} = \text{最大筆數} / 180$
    - **保守估算（含序列化開銷，80 B／筆）**：$\lfloor (512,000 - 1,000) / 80 \rfloor = 6,387$ 筆 → 180 天可承受平均約 **35.4 封／日**（每日含假日）。
    - **原始鍵值（62 B／筆）**：$\lfloor (512,000 - 1,000) / 62 \rfloor = 8,241$ 筆 → 約 **45.7 封／日**。
    - 讀寫次數：每封新信固定 `getProperty('MAIL_KEY')` (1 讀) + `getProperties()` (1 讀) + `setProperty` 預留與正式寫入 (2 寫)，外加過期鍵刪除，遠低於 Workspace 500,000 次／日上限。
  - 結論：點名寄信為上課日個位數至十數封，容量充裕，無須縮短期限或更換儲存方案。
- **已知限制（保留 Claude 已接受之兩項）**：
  1. `MailApp.sendEmail` 成功寄出後、寫入 `PropertiesService` 前的極短空窗若發生中斷，仍可能重寄。
  2. 寄送結果不明（其實已寄出）且教師在重試前就把學生改回準時時，平台可能不會寄出更正信；學生可在「我的出缺席」看到最新狀態，教師可在寄送紀錄看到該筆 `failed`。

---

## 原 2026-11-17 實作報告（Claude Fable）
### 給驗證者的摘要（原版）
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

## 返修 M1（2026-11-17，Claude Fable；依 CLAUDE_KEY_REVIEW.md 第三節 M1、第五節第 5、6 項）

**給 Claude 的摘要**
- M1 已修：每封信帶認領時的 `mailId`；寄信程式對同一個 `mailId` 只寄一次；平台端 30 秒逾時；失敗還原時連序號一起還原，所以重送用的是**同一個** `mailId`。
- 另加：Emulator 並行腳本 `scripts/attendance-emulator-race.mjs`；排程執行後記錄「上次自動寄送」並顯示在寄信分頁。
- 實跑（雲端 Linux、非 root）：`functions/tests/attendance.test.cjs` 16/16 PASS（原 13＋新 3）；`tests/attendance.test.ts` 8/8；functions build PASS；`tsc -b` 我的檔案 0 錯；`attendance-ui-check.mjs` PASS；`grep /Users|/private/tmp` 0 筆。
- **沒有實跑**：Emulator 並行腳本只用 `--memory`（記憶體模擬）確認腳本本身能跑完，**真正的 Emulator 並行驗證還沒做**，留給 Antigravity，列為必須 PASS。整套 `npm run check` 仍未跑。真的 Apps Script 沒有部署過。
- 偏離或拿不準：見下方 3 點。

**改檔**
| 檔案 | 改了什麼 |
|---|---|
| `functions/src/attendance.ts` | `appsScriptMailer` 加 `AbortSignal.timeout(30000)`（57 行）並回傳 `duplicate`；`deliver` 把 `mailId` 送給寄信程式、去重的信在寄送紀錄標 `deduped`（約 384 行）；失敗還原與「放回待寄」都把 `notifySeq` 減回去（約 452、1184 行）；排程寫入 `lastAuto`（約 1213 行）；`attendanceMailStatus` 回傳 `lastAuto` |
| `apps-script/AttendanceMailer.gs` | 驗證 `mailId`（必填、≤400 字、無控制字元）；`LockService` 一次處理一封；`CacheService.getScriptCache()` 以 `mailId` 的 SHA-256 為鍵查詢，寄過回 `{ok:true, duplicate:true}`；`MailApp.sendEmail` 成功後才 `cache.put(…, 21600)` |
| `functions/tests/attendance.test.cjs` | 寄信端點改成**直接在 Node 裡執行 `AttendanceMailer.gs`**（Google 服務換成假的），所以去重測的是會部署的那份程式；新增 3 支測試 |
| `scripts/attendance-emulator-race.mjs` | 新檔，見下 |
| `src/AttendanceAdmin.tsx`、`tests/fixtures/attendance-ui.tsx`、`scripts/attendance-ui-check.mjs` | 寄信分頁顯示「上次自動寄送」 |
| `docs/attendance/APPS_SCRIPT_SETUP.md` | 改版後必須重新部署成新版本；必須用學校帳號（個人 Gmail 每天約 100 位收件人） |

**新增測試**
1. 寄信程式：同一個 `mailId` 送兩次（含內容不同）只寄一封；不同 `mailId` 照寄；400 字的編號可去重；密鑰、收件人、主旨、內容、編號驗證；額度用完不記錄、之後可寄；鎖有釋放。
2. 結果不明不重寄：寄信程式已寄出但平台沒收到回應 → 平台標失敗、還原 → 重送的 `mailId` 與第一次相同 → 學生只收到一封，寄送紀錄標 `deduped`。連續兩次遺失回應、更正通知、導師彙整各驗一次；真的沒送到（連線失敗）的信重送會寄出。
3. 排程：未設定寄信程式時記錄錯誤；設定後記錄寄出與失敗數；回應不含密鑰。

**Emulator 並行腳本（留給 Antigravity，必須 PASS）**
```
npm --prefix functions run build
npx firebase emulators:exec --only firestore --project demo-attendance-race "node scripts/attendance-emulator-race.mjs"
```
- 預設 6 回合、每回合 30 位合成學生（掃 QR 與數字碼各半）同時簽到，並在 0–75 毫秒後呼叫 `attendanceControl`（action: end，等同審查文件寫的 attendanceEnd(force)）。
- 檢查：①每位學生只有 1 筆紀錄 ②準時紀錄的 `signedAt` ≤ `closedAt`＋寬限 ③ `counts` 與實際紀錄一致，回覆簽到成功的人都是準時、回覆失敗的人都是未到。
- 輸出 JSON：`pass`、`sawRaceWithinARound`（至少一回合同時有成功與被擋下，才算測到同時發生；為 false 時請加大 `--rounds` 重跑）、`warnings`（被拒原因不是「已結束」的簽到，例如交易競爭；不算失敗但請回報）。
- 這支腳本直接呼叫已編譯的 handler，搭配真的 Firestore（Emulator）與假的身分檢查；沒有經過 Functions／Auth Emulator。目的只在驗證 Firestore 交易的鎖與重試。

**拿不準的地方**
1. 快取只保留 6 小時（CacheService 上限）。結果不明的信如果超過 6 小時才重送，寄信程式已經不記得，會再寄一次。一般是當下或當天排程重送，機率低；要更長就得改用 PropertiesService 並自己清理，這次沒做。
2. 寄信程式「信已寄出、但在寫入快取前中斷」的極短空窗仍可能重寄；`sendEmail` 與 `cache.put` 之間沒有別的動作。
3. 結果不明的未到通知如果其實寄出了，而老師在重送前把學生改成準時：平台認為沒通知過，所以不會寄更正通知。學生會留著一封未到通知，要看「我的出缺席」才知道已改。要補這個洞得把「結果不明」另記一種狀態，這次沒做，請裁定要不要。

行號提醒：本節之前的「關鍵審查四處」行號是 0761747b 的；返修後 `functions/src/attendance.ts` 363 行以後的位置往後移了約 10–50 行。
