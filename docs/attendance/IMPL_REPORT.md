# 課堂點名 #67：實作報告（2026-11-19 更新：半自動通知）

## Codex 審查與修正（11/23）
### 給 Claude 的摘要
- 未驗：整套 `npm run check`、真 Firestore Emulator、Ubuntu 非 root、教師手機實點，依交辦留給 3.8／Claude／教師；記憶體 race 不當成真並行 PASS。
- 限制：本次 10 個程式／測試檔個人路徑 grep **0 筆**；全範圍 grep **11 筆既有命中**，與 50c5ead9 相同，未修改其他工作的腳本。
- 審查修正四項：點名中的節次阻擋導師提示；學生舊紀錄不顯示撤銷；導師撤銷綁單次標記以擋舊分頁／雙按；導師標記在交易內重讀確認狀態。
- 檔案：`functions/src/attendance.ts`、`functions/tests/attendance.test.cjs`；`shared/attendance.ts`、`src/{TeachingControl,AttendancePendingBadge,AttendanceAdmin}.tsx`。
- 檔案：`tests/attendance.test.ts`、`tests/fixtures/attendance-ui.tsx`、`scripts/{attendance-ui-check,attendance-emulator-race}.mjs`；本報告。
- 新增後端回歸 4 支，每項各一支；套回原版 50c5ead9 四支均 FAIL，修正後後端 **17/17 PASS**；前端點名 **10/10 PASS**，皆 0 skipped。
- 自跑：functions build（67 函式）、前端 build（版本仍 1.15.8）、UI 39 畫面＋6 組互動回歸 **PASS**；記憶體 race 6×30 **pass:true**。
- 原第 8–10 支確有驗內容與資料寫入、expect、並行標記、防越權、撤銷、補充只含新節次，並非只驗回傳形狀；不足之處由上述 4 支補強。
- 未改：主旨「（補充）」、gmailAccount 及既有信件範本，依本次交辦明確接受；旗標仍預設關、無部署／寄信／正式資料寫入。
- 偏離：全範圍 grep 既有 11 筆不能報 0；其餘無。舊測試報告先原樣 commit `3b54ab74 [Antigravity]`。
- 抽查（最多 5 項）：①markDigest 交易重讀；②UndoNotified 的 digest logId；③學生 canUndo；④控制台數字與三種複製操作；⑤race present／absent 逐欄比對。

### 審查發現與修正對照
| 問題 | 修正與回歸證據 |
|---|---|
| 導師提示先過濾為 closed，漏掉同班正在點名且尚未確認的節次 | 保留當天全部正式節次判斷 ready／unconfirmed，只有 closed＋confirmed 的內容進草稿。新測試驗 open 阻擋提示、確認後恢復、trial 不影響。 |
| 學生歷史通知都回 canUndo:true，後端卻只允許最新序號 | 讀目前該節該生的 notifySeq 決定 canUndo。新測試驗舊筆不顯示且後端拒絕、拒絕無寫入、24 小時整仍可撤銷、序號不倒退。 |
| 導師歷次標記回相同 logId，撤銷總是作用於當下最新一筆，舊頁或重送可能撤到別筆 | 回應 log.id 改為文件 ID 加 `#標記索引`；交易內要求索引等於最新未撤銷標記。新測試驗舊頁拒絕、兩次並行撤銷僅一次成功、原先節次仍保留，另驗並行標記只記一次。 |
| 導師標記在交易外查節次與設定，可使用與取消確認並行時的舊快照 | 交易內重讀每一個目標節次與導師設定，再判定可標記。新測試在查詢後／交易前取消確認，要求 stale=1 且不建立通知文件。 |
| 控制台開始點名旁缺待通知數字 | 新元件 AttendancePendingBadge 使用與通知分頁相同的 pendingNotificationCount；回到頁面焦點／可見時重讀，卸載與較舊回應不能覆蓋新狀態。旗標關／preview 不請求。 |
| race 以 JSON 字串比較 counts，鍵順序不同誤判 | 只改兩處比對條件為 present／absent 各自嚴格比較，未放寬其餘檢查。 |

### 實跑與自修紀錄
環境：macOS、Node v22.23.2。第一次 functions build／後端測試由宿主 Node v26.13.1 執行且 PASS，最終 functions build／後端測試改用指定 Node 22 重跑，前端 build／測試／UI 亦用 Node 22。

| 指令／檢查 | 結果 |
|---|---|
| `npm --prefix functions run build` | PASS，67 函式，未連雲端 |
| `node --test functions/tests/attendance.test.cjs` | 17 tests、17 PASS、0 FAIL、0 skipped |
| `npx tsx --test tests/attendance.test.ts` | 10 tests、10 PASS、0 FAIL、0 skipped |
| `npm run build` | PASS，version:check 1.15.8、tsc、vite；既有 bundle >900kB 提醒仍在 |
| `node scripts/attendance-ui-check.mjs --out <os.tmpdir()/attendance-review-2026-11-23>` | pass:true；學生 34（390×844 預設／特大）＋教師 5＝39 畫面；6 組互動 PASS；failures／pageErrors 均空 |
| `node scripts/attendance-emulator-race.mjs --memory` | pass:true、sawRaceWithinARound:true、6×30、failures／warnings 均空；只是腳本自檢 |
| 鍵順序回歸（僅暫存 preload，將記憶體 counts 回傳改為 absent,present） | 6 回合 pass:true，與逐欄比對無關的檢查保留；暫存已清除 |
| 原版注入對照（只在暫存中 transpile 50c5ead9 attendance.ts，未覆寫原始檔或編譯檔） | 4 支新增後端測試 0 PASS／4 FAIL；暫存已清除 |
| `node --import tsx --test tests/teaching-deck-pages.test.ts` | 5 tests、5 PASS、0 FAIL、0 skipped（含 Chrome 28 頁授課流程） |
| `git diff --check` | PASS |

- UI 自修：第一次控制台關旗標案例等待了會被合成簡報標題替換的 heading，因此 timeout；改等待固定「授課控制台」heading，所有案例已重跑 PASS。沒有放寬功能斷言。
- 沙箱自修：tsx CLI 的 IPC 與 Chrome 啟動被沙箱限制；以已核准的本機測試執行方式重跑通過。無需連正式資料或外部郵件。
- 三個複製鍵逐一點選並比對原內容，分別驗證 Clipboard 正常、writeText 拒絕、Clipboard API 缺少三條路徑；退路 textarea 用完移除，兩秒後按鈕文字復原。
- Gmail 只讀 href，不開外部頁面；比對收件人、主旨、含換行內文與帳號。另由前端第 9 支測試驗中文、換行、&、#、?、= 的 URL 往返。
- 每張展開卡的複製三鍵、Gmail、標記合計五個操作高度皆 ≥44px。
- 控制台真實元件驗初始 3、導師 ready 後回焦變 4、待通知清空隱藏、點開始點名導向；旗標關與 preview 不顯示入口、不讀點名 API。
- 本次未改學生畫面文字／CSS；390 預設與特大自動可讀性全通過。按規則僅查看本次受影響的控制台徽章截圖一張，數字與「開始點名」並列無重疊；學生截圖只存證，教師手機實點仍待進行。

### 路徑／移除代寄信自查
- `grep -nE '/Users/|/private/tmp'` 對本次 10 個程式／測試檔：0 筆；新增行自查同為 0 筆，腳本使用系統暫存輸出參數，不寫死個人路徑。
- `grep -rnE '/Users/|/private/tmp' functions/src src shared scripts tests`：11 筆；`git grep` 同範圍對 50c5ead9 也是 11 筆，皆為未修改的其他工作檔（含 prune-evidence、clean-release、classroom-reveal、micro-immuno、fluid／urinary 與 apply-final-ui）。此範圍不能聲稱 0。
- 代寄信關鍵字自查：產品程式 0 筆；測試中仍保留確認舊端點不存在／舊設定被拒的負例斷言，不刪測試湊 0。

### 證據與下一棒
- 截圖保存至 **2026-11-30**；repo 外系統暫存目錄 `attendance-review-2026-11-23/`：`ui-result.json`、`ui-my-390-default.png`、`ui-my-390-xlarge.png`、`ui-control-pending-1440.png`。未將截圖／原始輸出加入 repo。
- 根目錄協調檔與此 worktree 為不同工作樹；只改根目錄佇列 #67 並以根目錄 scripts/devlog.py 記週誌，保留其他未提交工作。
- 交 Gemini 3.8 Flash 依 `ANTIGRAVITY_TASK_attendance-semiauto-test_ag38_2026-11-19.md` 重跑 A–D，以目前 feature/attendance HEAD 為準；正式 race 必須 pass:true 且 sawRaceWithinARound:true。
- Emulator 撤銷一律傳 NotifyDrafts 回傳的 log.id；導師現在含 `#索引`，不可自行重組為文件 ID。
- 第二輪報告寫 worktree `docs/attendance/SEMIAUTO_TEST_RUN_2.md`，保留舊報告。全套／Emulator／Linux 尚未由本次審查宣稱通過。

---

## 半自動通知（2026-11-19 晚，Claude Opus 實作；教師 19:34 同意由 Claude 直接做）
### 給審查者的摘要
- 依據：DECISIONS「2026-11-19 12:42 點名通知改半自動」與 `CODEX_TASK_attendance-semiauto_2026-11-19.md`（教師 3 題照推薦：一人一封、有〔開啟 Gmail〕、導師彙整全部節次確認後才提示）。
- 移除代寄信：刪 `apps-script/AttendanceMailer.gs`、`docs/attendance/APPS_SCRIPT_SETUP.md`；後端刪寄信本體、`attendanceSendMail`、`attendanceMailTick`（排程）、寄信程式網址／密鑰、每日時間、上次自動寄送；shared 刪 `validDailyTime`／`nextDailySend`／`nextSendAt`；測試刪 M1／M1-b 等 13 支寄信測試。從未部署，雲端不需刪函式。
- 新增 callable：`attendanceNotifyDrafts`（信件內容當場產生、不存內文）、`attendanceMarkNotified`（expect 核對、重按回 already、狀態變了回 stale）、`attendanceUndoNotified`（24 小時內、學生信只撤銷最新一筆、序號不倒退）。函式總數仍 18（全站 67）。
- 後台：〔寄信〕改〔通知〕＋待通知徽章；信件卡三個複製鈕（clipboard 失敗退回 execCommand）、〔開啟 Gmail〕（`gmailComposeUrl`，authuser 預設教師登入帳號）、〔已寄，標記已通知〕、每節批次標記；名冊確認後出現「N 位待通知→前往通知」。
- 實跑：Mac 工作區 `npm --prefix functions run build` PASS（67 函式）、`node --test functions/tests/attendance.test.cjs` 13/13 PASS；雲端 Linux 非 root（同檔 SHA 一致）：`tests/attendance.test.ts` 9/9、`tsc -b` 點名檔 0 錯、`attendance-ui-check.mjs` 學生 34＋教師 5 畫面 PASS、頁面錯誤 0。
- 未跑：整套 `npm run check`、Emulator（交 Gemini 3.8）。移除 grep 0 筆（index.ts 的 onSchedule 屬既有 dailyReports）；個人路徑 grep 0 筆。
- 偏離：①授課控制台〔開始點名〕旁未加待通知數字（只在點名頁分頁徽章）；②導師彙整補充版以主旨加「（補充）」區分；③設定新增 `gmailAccount`。
- 抽查：`functions/src/attendance.ts` 的 `markStudent`／`markDigest`／`attendanceUndoNotified`；`src/AttendanceAdmin.tsx` 的 `NotifyView`；測試第 8–10 支。
- 自己寫的程式不自己審：審查交 Codex。

### 已知限制
- 「已通知」是老師自己按的，系統無法知道 Gmail 是否真的寄出；按錯可 24 小時內撤銷。
- 信件內文每次即時產生，學生姓名、名冊或設定改了，內容會跟著變；已寄出的信以 Gmail 寄件備份為準。

---


## 給 Claude 的摘要
- 完成 #67 **M1-b 選項 B 退修**（依 `M1B_CODEX_VERIFY_2026-11-19.md` 0525a497 選項 B 複驗），保留 **180 天**去重與既有未提交之 `docs/attendance/CLAUDE_KEY_REVIEW.md`。
- 變更檔：`functions/src/attendance.ts`、`src/AttendanceAdmin.tsx`、`functions/tests/attendance.test.cjs`、`docs/attendance/IMPL_REPORT.md`。
- 實跑指令：`npm --prefix functions run build` PASS（67 函式）、`node --test functions/tests/attendance.test.cjs`（Node v22.23.2）**25/25 PASS**（合成資料＋假時鐘，未寄真信）。
- 偏離：無（依教師裁定選 B）。
- 抽查項（最多 5 項）：
  1. `functions/src/attendance.ts:1215–1335`：`confirmSent` 與 `resendOne` 皆在 `db.runTransaction` 認領 `status === 'uncertain'`，以 `resendSeq` 確保完成／失敗只套用於該次認領；`resendOne` 認領前核對學生現況與 `notifySeq`，過時通知拒絕重送。
  2. `src/AttendanceAdmin.tsx:1002, 1131–1182`：新增 `busyMailId` 鎖定按鈕，避免連續點擊重送或確認。
  3. `functions/tests/attendance.test.cjs:1647–1745`：驗證並行 `resendOne`（含寄後寫入失敗）只寄 1 次、`confirmSent` 與 `resendOne` 互斥，以及改準時／寄更正後舊未到通知不可重送。
  4. `git status` 確認 `docs/attendance/CLAUDE_KEY_REVIEW.md` 未提交審查紀錄完整保留。

---

## 返修 M1-b（2026-11-19，Antigravity Hydrogen；教師裁定選項 B）
- **Apps Script（`apps-script/AttendanceMailer.gs`）**：改用 `PropertiesService` 保存 180 天去重紀錄；清理其他過期鍵 `deleteProperty` 採 `try/catch` 不擋有效去重；寄前預留 `pending:<now>`（空間或寫入配額耗盡即拒寄、`MailApp` 0 次）；`MailApp.sendEmail` 成功後，覆寫正式時間戳與查詢 `getRemainingDailyQuota()` 皆以 `try/catch` 分離，不因寄後查詢或第二次寫入失敗而回報失敗。若鎖內發現殘留 `pending:` 且 `body.forceResend !== true`，不自動重寄，回傳 `{ok:false, uncertain:true}`。
- **平台後端與後台（`functions/src/attendance.ts`、`src/AttendanceAdmin.tsx`）**：`appsScriptMailer` 識別 `body.uncertain === true`；`deliver` 收到 `uncertain` 時將寄送紀錄設為 `status:'uncertain'` 且不還原 `notifySeq`（同時 `pendingMail`／`runSend` 亦跳過 `uncertain` 之導師彙整），使排程與整批手動寄送皆不再自動重寄。教師於後台寄送紀錄可點〔確認已寄〕（`mode:'confirmSent'`）或確認未寄後點〔確認未寄，單封重送〕（`mode:'resendOne'`，帶 `forceResend:true`）。
- **實跑結果（2026-11-19）**：`npm --prefix functions run build` PASS（67 個函式）；`node --test functions/tests/attendance.test.cjs` **23/23 PASS**（0 failed, 0 skipped）。（舊版「待教師裁定 A／B」已結案。）
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
