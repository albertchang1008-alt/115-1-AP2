# 專案交接

## 給接手的 AI agent

1. 先讀完這份文件、`DEVELOPMENT_LOG.md`（版本流水帳，新版本在最上面）與目前
   所在分支的最新幾個 commit，再開始工作。
2. 改動前務必先確認 `git branch --show-current`；未經使用者明確同意，不要
   push、合併或部署到 `main`（這是正式環境，push 到 main 會自動觸發
   GitHub Pages 重新上線，細節見下方「Git 與部署現況」）。
3. **收工前（不論是回答一個問題、改一段程式、還是做完一整批功能）都要更新
   這份 handoff.md**：把新的固定決策、這次做了什麼、目前分支與 commit 狀態、
   下一步待辦寫進去，覆蓋掉過期的內容。這份文件永遠代表「現在」，不是歷史
   紀錄——歷史紀錄放 `DEVELOPMENT_LOG.md`。沒有更新這份文件就結束工作，等於
   沒有交接，下一個 agent（不限 Claude，任何 AI coding agent）會從過期資訊
   開始工作。
4. Commit message 結尾請附上你的身分標註（例如 Claude 系列用
   `Co-Authored-By: <model 名稱> <noreply@anthropic.com>` 與對應的 session
   連結），方便回溯是哪次、哪個 agent 做的改動。

---

目前版本：1.2.5（本機 `main` 最新，本輪 Claude 剛做完，尚待推送）。
2026-09-15 這一輪之前，`origin/main` 已經跟本機同步到 `fcd38b2`（1.2.2：同步按鈕搬到題庫管理／班級名冊頁），git 比對顯示 0 個落差（雙向皆 0），代表 GitHub Desktop 已經推送過；但這次沒能像先前那樣用公開 GitHub Actions API 驗證 Pages workflow 是否跑成功——這個雲端沙箱這次呼叫 `api.github.com` 被 proxy 擋下（回傳「GitHub access to this repository is not enabled for this session」），麻煩使用者自行到 GitHub 的 Actions 分頁確認「Publish course platform」是綠燈。
後端 Functions：**1.2.4 已部署且確認生效**（使用者實測「同步班級名冊」看到具體的「名冊格式錯誤：...」訊息，取代了原本的 internal/500，證實修正有效）。**1.2.5（本輪，移除信箱網域限制）又動到 `functions/src/index.ts` 與 `shared/model.ts`，還沒部署，需要使用者再跑一次
`npx firebase-tools deploy --only functions --project ap2-7ed91`** 才會生效（見下方「Claude 接手狀態（2026-09-15，第三輪）」）。
本輪（1.2.5）只動到後端邏輯（`allowedEmail` 不再限制信箱網域），前端沒有變更，不需要重新 push 就能讓後端修正生效（但這次 commit 本身仍需要用 GitHub Desktop push，才會讓 GitHub 上的原始碼跟本機一致）。

## 固定決策

1. 學生入口 GitHub Pages，資料 Firebase；舊題庫資料完全隔離。
2. 前端判分；完整測驗與完整閃卡達標計入完成度，錯題複習不計入。
3. HTML 教材使用 GitHub Pages 網址，不使用 Storage；HTML 與影片僅記參與，YouTube 由教師提供連結。
4. 整組紀錄保存、內容版本快取、禁用全題庫掃描備援。
5. 報表按需增量彙整，每日 03:00 排程預設關閉；個人完成度即時更新。
6. 預覽使用學生共用元件；正式與預覽寫入分離。
7. 每次升版同步所有平台版本標示及文件。
8. 課程／單元／班級代碼一律由教師自訂（建立後不可改），可使用中文、英數字、- 與 _，不可有空白或其他標點，長度上限 50；用於對應 Google Sheet 課程欄位與分頁名稱；名冊同步只會新增/更新，不處理刪除。
9. 測試學生帳號以 `config/testStudents` 白名單放行，只放寬信箱網域；測試帳號放專屬測試班隔離，測完清空名單。
10.（1.2.0）單元是真正的兩層結構：單元（`Unit.group`，大分類、純顯示分組）底下有多個次單元（`Unit.id`，真正的題庫單位），比照 v1.9 的科目→章節設計。完整測驗與完成度的範圍是**次單元**，不是單元。
11.（1.2.0）抽題練習題數由學生自選（比照 v1.9：10/20/30/全部），只有「全部題目」算入完成度；已作答過的題目自然排到後面（`Progress.attempted`，跨題庫版本保留，不是「輪完重洗」的循環機制）。「完整測驗才算完成度」這條規則本身**不改**，維持跟 1.1.2 以前及 v1.9 一致。
12.（1.2.0）選項每次都重新洗牌，不固定順序，避免學生背 ABCD 位置。
13.（1.2.0）蘇格拉底式解析五段改名為 `keyword/chain/decide/memory/trace`，保留舊鍵名（`hint1/hint2/hint3/concept/misconception`）相容層，讀取時新鍵優先、沒值才退回舊鍵——1.2.0 以前發布的題庫快照解析不會消失。
14.（1.2.0，2026-09-15 更新）`Explanations` 元件依 `audience` 區分學生／教師視角：學生看①～④，教師另外多看⑤追溯原子卡（教師備課用的溯源資訊，學生端不顯示）。**2026-09-15 起：不論傳統解析或①～⑤這五段，在所有畫面（一般測驗作答中、閃卡、錯題複習、交卷後複習、教師題庫預覽）一律直接展開顯示，不再用 `<details>` 收合、不需要點擊**——這是使用者明確要求「一次給到位」，連一般測驗作答中也要立即看到正解與解析，刻意放棄先前「作答中不能偷看答案」的防呆設計；如果之後要恢復，需要另外討論。這段解析原本叫「蘇格拉底式解析」，同一天改名為「引導式解析」（只改畫面標籤，`socratic.*` 欄位鍵名與 Sheet 匯入欄位名稱都不變）。
15.（2026-09-15）題庫同步以**課程代碼分頁名稱**辨識來源：例如課程代碼 `115-1-AP2` 就只讀同名分頁；不再掃描所有看起來像題庫的工作表，`題庫ext` 等輔助分頁會略過。「同步題庫」固定放在**題庫管理**頁，「同步班級名冊」固定放在**班級名冊**頁，只有按鈕才讀取對應分頁；每次皆為增量同步，未變更內容不重複寫入。兩頁不保留 CSV／JSON 或舊名冊轉換等手動資料入口。正式題庫分頁的每列不必填課程代碼，`單元` 是顯示分組，`次單元` 是可練習、計完成度並各自發布版本的題庫單位。課程本身仍必須先手動建立，且分頁名稱須與它的代碼完全相同。

## 1.2.0：題庫接軌（現況：已實作，後端已部署，待合併前端）

背景與完整設計見 `docs/BANK_IMPORT_PROPOSAL.md`（建議書）與
`docs/QUESTION_BANK_PLAN.md`（欄位對照與規畫，已更新到 1.2.0）。

**已完成、在 `feature/1.2.0-bank-import` 分支上：**

- `shared/model.ts`：`Question.order`、`Unit.group`、`Progress.attempted`、
  `orderForPractice`/`mergeAttempted`/`shuffle`、題數上限放寬到 500
- `shared/sheets.ts`：`parseBankSheet` 改成讀「單元／次單元」兩層、`題序`
  穩定排序、`啟用` 欄可略過整列、`looksLikeBankSheet` 白名單判斷、解析五段
  新舊鍵相容、清除⑤追溯原子卡的反引號與殘留分隔線
- `functions/src/index.ts`：`publishBank` 依 `(order, id)` 穩定排序再算版本
  雜湊；`syncBankTabFromSheet` 改成對次單元逐一處理並同步寫回 `group`；
  `syncSheet` 只處理看起來像題庫的分頁，其餘靜默略過
- `src/Student.tsx`：抽題練習改學生自選題數（10/20/30）＋已考過優先排序；
  單元瀏覽依 `group` 分組
- `src/QuestionContent.tsx`：`Explanations` 新增 `audience` 參數，見固定決策 14
- `apps-script/CreateCourseTemplate.gs`：範本表頭更新為單元/次單元/題序/啟用
  與新解析欄名
- 本機 2026-09-14 接手驗證：Node 22.23.2、darwin arm64，既有套件可用，未重新安裝。完整 `npm run check` 通過：26 項前端／共用邏輯測試、前後端建置、29 個後端入口載入、1 項後端 callable 整合測試。原本交接所述 esbuild 平台錯誤本輪未重現。
- 兩個新工具（不是平台程式碼本身，是給教師手動操作用的）：
  - `apps-script/FillCourseAndUnit.gs`：綁在教師正式 Google Sheet 上跑的
    一次性工具，補齊空白的「課程代碼」欄與「單元」欄（依同一次單元已填的
    值自動帶入）
  - `scripts/deploy.sh`：一鍵上線腳本（憑證／Git 預檢→本機測試→分支備份→
    Functions→快轉推送遠端 main），見下方「Git 與部署現況」

**還沒做的：**

- 教師端單元編輯畫面（`src/App.tsx`）還沒依 `Unit.group` 做視覺分組（學生端
  已做，教師端刻意先跳過，風險考量：`App.tsx` 檔案很大）
- 同考點抽題去重、題目作廢並重算分數——刻意排除在 1.2.0 之外，見建議書第
  5.4、5.5 節

## Git 與部署現況（2026-09-14，Claude 更新）

- `main` 已合併 1.2.0（PR #1，見上方「目前版本」），Pages 已成功重新發布，
  Functions 已部署。這是**目前正式上線的狀態**。
- 本機 `main` 現在比 `origin/main` 多 2 個未推送的 commit：
  1. `修正 FillCourseAndUnit.gs：課程代碼欄完全不存在時也要能補上`——純手動
     工具腳本，不影響前端 build 或 Functions 部署，沒有正式環境風險，可以
     隨時單獨推送，不需要重新部署 Functions。
  2.（待這次改動完成後會再新增一個）`syncBankTabFromSheet` 自動建立缺少的
     單元——**這個有動到 Cloud Functions 程式碼，推送 main 前端會自動重發
     沒問題，但要讓行為真的生效，必須額外重新
     `npx firebase-tools deploy --only functions` 一次**，光 push/合併不會
     讓新的 Functions 邏輯上線。
- 本機用 `git push origin main` 會失敗（`fatal: could not read Username for
  'https://github.com'`）——這台 device_bash 的沙箱沒有存 GitHub 的 HTTPS
  寫入憑證，跟 Codex 遇到的狀況一樣。目前確認可行的推送方式是使用者自己在
  電腦上開 **GitHub Desktop**，選 `main`，會看到待推送的 commit，按
  「Push origin」。
- Firebase CLI（`npx firebase-tools`）在這台裝置上**可以**部署（不受上面
  GitHub 憑證問題影響，用的是不同的登入），2026-09-14 已用它成功部署過一次
  Functions；下一次需要部署時可以直接用，或透過 `scripts/deploy.sh`（會先
  跑測試、備份分支，再部署 Functions，最後嘗試快轉推送 main——但 main 推送
  那一步一樣會卡在 GitHub 憑證，需要使用者用 Desktop 補推）。

## Codex 接手狀態（2026-09-14）

- 分支 `feature/1.2.0-bank-import`，HEAD `fa660a8`；已發布到 GitHub、未合併。Functions 已部署，前端尚未發布。
- 修正交卷仍只接受 100 題的遺漏，與題庫共用 `MAX_BANK_QUESTIONS = 500`；請求大小上限調為 300 KB，容納長題目 ID 的 500 題答案。
- 修正題序空白被解析成 `order: undefined`，避免 Firestore 拒絕整批寫入；非法題序回報列號。
- 實際版本檔、套件、README 與開發紀錄原仍為 1.1.2，本輪全部同步 1.2.0。
- 新增 `functions/tests/bank-boundary.test.cjs`：使用實際 callable 配合記憶體資料庫測試 500 題發布、完整交卷、列重排維持版本、重送去重、501 題拒絕；不連線正式資料庫。已接入 `npm run check`。
- 完整檢查通過，無需未改動就反覆重跑；驗證範圍不包含真實 Google Sheet、Firebase Emulator 或正式端到端流程。
- 工作區原有未追蹤 `Claude outputs/`，本輪未讀取或更動；不應未確認就加入提交。
- 部署腳本修正已完成；`bash -n scripts/deploy.sh` 與 `node --test scripts/deploy.test.cjs` 通過。10 個情境使用暫存 Git 倉庫及模擬 npm／Firebase，涵蓋成功順序、取消、憑證／專案失敗、髒工作區、detached HEAD、main 分歧、測試／後端／main 推送失敗；未連線雲端，未重跑無關的平台完整測試。
- 本次已提交 `5aa4f37`（題庫接軌與安全部署腳本）、`4e5a99f`、`fa660a8`（交接紀錄）。實際部署前重跑完整檢查：26 項前端／共用測試、前端建置、29 個後端入口、1 項 callable 整合測試皆通過。Functions 部署後也以清單確認；既有 `Claude outputs/` 僅在本機 `.git/info/exclude` 排除，未刪除、未提交。
- 下一步：教師端大單元分組視覺與真實 Sheet 資料補齊仍待處理。原先列為 1.2.0 範圍外的同考點去重、作廢重算不擅自加入。
- 先前實驗性 Codex 上下文管理設定請求僅完成當時的能力檢查，未確認寫入或執行期生效；與本次平台修復分開處理，不宣稱已開啟。

## Claude 接手狀態（2026-09-14，晚）

- 起因：使用者實際照著平台介面操作同步，發現「請先建立並保存單元」這條規則
  很不順手，明確要求「應該是依 google sheet 上的題庫分頁建立題庫，單元和
  次單元都依上面標的」。
- 改動 `functions/src/index.ts` 的 `syncBankTabFromSheet`：次單元在課程草稿
  裡不存在時自動建立（id＝次單元、title＝次單元、group＝單元欄），不再
  fail；並把 `syncBankTabFromSheet` 從模組內部函式改成具名 export，方便
  測試直接呼叫（不是 onCall，Firebase 部署不會把它當成雲端函式）。課程本身
  仍必須已存在才會同步（否則報「課程不存在，請先在課程與教材建立課程」），
  這點刻意沒有放寬——title/term/teacherIds 沒有合理預設值。
- 新增 `functions/tests/sync-auto-unit.test.cjs`：4 個情境（自動建立新單元
  且欄位正確、已存在單元只更新版本與分組不重複新增、課程不存在明確報錯、
  非授權教師報錯且不寫入），都是用實際 `syncBankTabFromSheet` 配合記憶體
  Firestore mock，不連線正式資料庫。
- 驗證：本機（雲端沙箱）重新同步了 Codex 那輪修改後的完整檔案（之前我的
  沙箱副本是舊的，缺少他們新增的 `functions/scripts/*.cjs`、
  `scripts/version.mjs` 等檔案，已補齊）。`npm test`（前端/共用邏輯）
  26/26、`npm --prefix functions run build`（tsc＋29 個入口載入）通過、
  `npm --prefix functions test`（含新舊兩個測試檔）5＋1＝6 項全過。前端
  `vite build` 在這個雲端沙箱副本裡因為原本就沒有同步 `index.html` 等靜態
  檔案而失敗，這是沙箱副本本來就有的限制，不是這次改動造成的，不用理它。
- Git：commit 已建立在本機 `main` 上（`f6137c5`），但沒有 push——這台
  Cowork 沙箱裝置沒有 GitHub HTTPS 寫入憑證，也**沒有 Firebase 登入**（連
  `firebase login` 本身在這個沙箱裡都連不上驗證伺服器，應該是沙箱網路限制）。
  這點很重要：**這個沙箱裝置（device_bash）不能拿來部署 Functions**，只能
  拿來讀寫檔案、跑 git（push 除外）；部署一定要請使用者在他自己電腦「真正
  的」Terminal 裡執行指令，那邊才有登入過的 Firebase 憑證。
- 部署已完成：使用者在自己電腦的 Terminal 執行
  `npx firebase-tools deploy --only functions --project ap2-7ed91`，29 個
  函式全部 Successful update operation，`Deploy complete!`。**自動建單元的
  新邏輯已經在正式環境生效**，可以請使用者直接在平台設定重新同步測試。
- 還沒做：`main` 的 2 個本機 commit（`bd03201`、`f6137c5`）還沒推上
  GitHub——Functions 已經是新版，但 GitHub 上的原始碼還停在舊版，兩邊不
  同步。需要使用者用 GitHub Desktop 推送補上，避免下次有人對照 GitHub 上的
  程式碼時搞錯正式環境實際在跑什麼。

## Codex Sheet 分頁同步修正（2026-09-15，1.2.2 待部署）

- 使用者將規則定為「課程代碼即題庫分頁名稱」：`115-1-AP2` 分頁同步至 `courses/115-1-AP2`；系統僅處理目前教師有權管理且名稱完全相符的分頁。其他工作表（包含 `題庫ext`）都不再嘗試匯入。
- 已由使用者提供的公開 Sheet `115-1-AP2課程平台` 核對正式欄位：`題庫`（Q1/Q2）、`序號`、`題目ID`、`單元`、`次單元`、`題目`、`正確答案文字`、`原始答案字母(僅對照)`、選項 A-D、解析與五段解析等。`shared/sheets.ts` 已相容這些欄名；正確答案文字可直接對應選項，`序號` 作穩定題序，`③對答案` 會對應蘇格拉底式第 ③ 段。
- 改動檔案：`functions/src/index.ts`、`shared/sheets.ts`、`src/App.tsx`、`tests/platform.test.ts`。新增正式格式解析測試；完整驗證通過：前端／共用 27 項、Functions 編譯與 29 個入口、Functions 5 項測試。前端 Vite 建置也通過。
- 使用者已將正式題庫分頁改名為 `115-1-AP2`、名冊分頁改名為 `班級名冊`（2026-09-15）。本輪新增 `syncRoster` callable 與後台「同步班級名冊」按鈕；一般「同步題庫」不再讀名冊。班級名冊欄位為 `授課班級／學號／姓名／Gmail`，在同一份 Sheet 僅有一個對應課程分頁時會以該分頁名稱作課程代碼，並自動新增名冊中出現的班級代碼。名冊與題庫都比對既有內容做增量同步：無變動不重複寫入、不新建題庫版本。
- GitHub 已發布 `1.2.1`（commit `6da1c46`），但使用者截圖確認同步按鈕仍錯放在「平台設定」，題庫／名冊頁仍是舊手動匯入介面。`1.2.2` 已將「同步題庫」移至題庫管理、將「同步班級名冊」移至班級名冊，並移除兩頁的 JSON／CSV／舊名冊轉換入口；平台設定只保留 Sheet ID。此修正將以本機 `main` 的新提交待推送。本輪驗證已通過：前端／共用 28 項、Functions 5 項測試、Functions TypeScript 編譯與 29 個入口載入、Vite production build；版本一致性檢查也通過。下一步是用 GitHub Desktop Push origin，確認 Pages workflow 成功；Functions 同步 callable 仍必須在含 Firebase 登入憑證的本機 Terminal 執行 `npx firebase-tools deploy --only functions --project ap2-7ed91`。需確認平台中已存在同代碼且教師可管理的課程。

## Claude 接手狀態（2026-09-15）

- 起因：使用者實際操作「題庫管理」「班級名冊」頁面，回報兩頁都「沒功用」；
  來回用截圖排查後確認**題庫同步其實已經成功**（15 個次單元、含正確題庫
  版本，教師端下拉選單與「讀取已連接版本」都正常）——真正還沒確認能動的
  只剩「班級名冊」同步，最可能原因是 1.2.1／1.2.2 新增的 `syncRoster`
  callable 還沒部署到正式 Functions（見上方「目前版本」段落，這點還沒能
  實際驗證，需要使用者跑一次部署確認）。
- 排查途中使用者臨時提出新需求（截圖題目預覽的「蘇格拉底式解析」畫面）：
  1. 「蘇格拉底式解析」改名為「引導式解析」。
  2. 引導式解析與傳統解析都不要用點擊展開，「一次給到位」。
  3. 使用者明確選擇最大範圍：**所有畫面都要改，包括一般測驗（quiz）作答
     中也要立刻顯示正解與解析**（用 AskUserQuestion 確認過，使用者清楚
     知道這會讓學生作答時就直接看到正解，仍選擇這個選項）。
- 改動（純前端，未動到 Cloud Functions 或資料結構）：
  - `src/QuestionContent.tsx`：`Explanations` 元件改名標籤、移除所有
    `<details>`／`<summary>`，一律用 `<section>`／`<div className=
    "explanationstep">` 直接展開；`socratic.*` 欄位鍵名不變。
  - `src/Student.tsx`：`choose()` 移除 `mode !== 'quiz'` 判斷，不分模式選
    了就鎖定並顯示解析；交卷後的 `reviewanswers` 列表移除逐題
    `<details>` 收合，正解與解析直接顯示。
  - `src/App.tsx`：教師「題庫管理」頁的「題目預覽」列表同樣移除
    `<details>` 收合。
  - `src/style.css`：補上原本 `<details>` 提供的分隔線／間距／淺色底
    （新增 `.reviewanswer`、`.questionpreview`、`.explanationstep` 規則，
    亮／暗色主題都有對應樣式）。
  - `docs/QUESTION_BANK_PLAN.md`、`handoff.md` 固定決策 14：同步更新用詞
    與行為說明，並記錄這是刻意放棄「作答中防偷看答案」設計換來的體驗。
- 驗證：`npm test`（前端／共用邏輯）28/28 全過；`npx tsc -b` 無錯誤。這個
  雲端沙箱副本沒有 `index.html` 等靜態檔案，`vite build` 本來就會失敗，
  是既有限制不是這次改動造成的（前幾輪交接都有記錄）。未動 Functions，
  不需要重新部署 Functions；`npm --prefix functions test` 這輪未重跑
  （沒有改動 functions/ 底下任何檔案）。
- 版本：`VERSION` 由 1.2.2 升到 **1.2.3**，`node scripts/version.mjs`
  已同步 `package.json`、`functions/package.json`、對應 `package-lock.json`、
  `shared/version.ts`、`apps-script/version.gs`、`public/version.json`、
  `README.md`、`DEVELOPMENT_LOG.md`、`handoff.md`；`node scripts/
  version.mjs --check` 通過。`DEVELOPMENT_LOG.md` 已新增 1.2.3 條目。
- Git：改動已 commit 在本機 `main` 上，commit hash 見下方最新一次 `git
  log`；**尚未推上 GitHub**，需要使用者用 GitHub Desktop 推送。這次沒能
  用公開 GitHub Actions API 驗證先前 push 的 Pages workflow 是否成功
  （這個雲端沙箱這次連 `api.github.com` 被 proxy 擋下），麻煩使用者自行
  到 GitHub 網頁的 Actions 分頁確認。
- 已完成（2026-09-15 這輪之內）：
  1. Functions 部署（見上方，syncRoster 已確認存在且成功部署）。
  2. GitHub Desktop 推送——使用者截圖確認前端已顯示 v1.2.3（左下角版本
     號），代表 push 與 GitHub Pages 重新發布都已成功，不用再等確認。
- 還沒做／需要使用者確認：
  1. ~~在「同步班級名冊」按鈕重新測試~~ ——使用者實測後回報：錯誤從
     「internal」變成 Console 出現 `Failed to load resource: the server
     responded with a status of 500 ()`（見下方 1.2.4 段落，已找到原因並
     修正，但還沒重新部署）。
  2.「一般測驗作答中就直接看到正解」這個改動幅度不小，等使用者實際用過
     幾次之後，如果覺得跟原本設計的初衷（避免用測驗當練習、想留一點防
     偷看）衝突，隨時可以再要求改回「交卷後才顯示」，只需要把
     `Student.tsx` 的 `choose()` 改回原本 `if (mode !== 'quiz')` 的判斷
     即可，不是不能回頭的決定。

## Claude 接手狀態（2026-09-15，第二輪：修正 syncRoster 500 錯誤）

- 起因：上一輪部署完 `syncRoster` 後，使用者點「同步班級名冊」，錯誤從
  「internal」變成 Chrome DevTools Console 顯示
  `Failed to load resource: the server responded with a status of 500 ()`
  （針對 `syncRoster` 這個 callable）。截圖只看得到瀏覽器端的通用錯誤，
  看不到後端真正原因，所以直接讀 `functions/src/index.ts` 找根因。
- 根因：`syncRosterFromSheet()` 裡呼叫 `parseRosterSheet(...)` 沒有包
  try/catch；這個函式在名冊格式或內容不合法時（例如缺欄位、Email 或學號
  重複、格式不符）會丟一般 `Error`，不是這個 repo 慣用的 `fail()`
  （`HttpsError('failed-precondition', ...)`）。Firebase Functions v2 的
  `onCall` 遇到「沒被接住的例外」只會讓前端看到通用的 internal／HTTP 500，
  真正的錯誤訊息會被吞掉——這跟同一個檔案裡 `syncSheet` 的錯誤處理方式不
  一致（`syncSheet` 有妥善用 `fail()` 包起來）。「找不到班級名冊分頁」那個
  檢查也是類似狀況，原本用 `fail(...)` 但沒有讓 TypeScript 知道會中斷執行
  的地方需要留意（已一併確認沒問題）。
- 修正：把 `parseRosterSheet(...)` 的呼叫包進 try/catch，例外訊息轉成
  `fail('名冊格式錯誤：' + (e as Error).message)`，讓前端能看到「名冊格式
  錯誤：xxx」這種具體訊息，而不是不明的 internal/500。**這個修正還沒解決
  「名冊到底哪裡不合法」這個問題本身**——只是讓下次同步失敗時，錯誤訊息
  會變成可讀的中文，我們才能根據那個訊息知道要修資料還是修程式。
- 改動檔案：只有 `functions/src/index.ts`（`syncRosterFromSheet` 函式）。
- 驗證：`functions/` 底下 `npm run build` 編譯乾淨（29 個函式都能載入）；
  `npm test` 5/5 通過（`bank-boundary.test.cjs`＋`sync-auto-unit.test.cjs`，
  這兩個測試沒有直接打到 `syncRosterFromSheet`，所以這次沒有新增專門測試
  這個修正的案例——如果之後知道使用者名冊格式問題的具體樣態，建議之後幫
  這個路徑補一個回歸測試）。
- 版本：`VERSION` 由 1.2.3 升到 **1.2.4**，`node scripts/version.mjs` 已
  同步所有版本檔案（`package.json`、`functions/package.json`、對應
  `package-lock.json`、`shared/version.ts`、`apps-script/version.gs`、
  `public/version.json`、`README.md`），`DEVELOPMENT_LOG.md` 已新增 1.2.4
  條目，`node scripts/version.mjs --check` 通過。
- **這輪跟 1.2.0～1.2.3 不一樣：這次動到 `functions/src/index.ts`，前端
  完全沒改。** 也就是說：
  1. 使用者仍需要用 GitHub Desktop 推送這個新 commit（跟前幾輪一樣），
     但即使不 push、不等 GitHub Pages 重新發布，光是「重新部署 Functions」
     就能讓修正生效（因為前端程式碼沒變，UI 版本號不會變成 1.2.4）。
  2. **使用者需要在自己電腦 Terminal 再跑一次
     `npx firebase-tools deploy --only functions --project ap2-7ed91`**，
     這個修正才會真正上線。部署完再點一次「同步班級名冊」，這次如果還
     是失敗，Console／畫面上應該會出現具體的中文錯誤訊息（例如「名冊格式
     錯誤：...」），那則訊息就是下一步要修的真正線索，麻煩使用者連同
     訊息內容回報，才能繼續往下查。
  3. Git：改動已在本機 `main` commit（見下方 `git log`），**尚未推上
     GitHub**。
- **後續確認**：使用者部署後實測「同步班級名冊」，錯誤已經從不明的
  internal/500 變成具體訊息「名冊格式錯誤：第 1 列：信箱、姓名、學號或
  班級不完整」——證實 1.2.4 這個修正本身確實生效、確實有效（原本會被吞掉
  的錯誤現在看得到了）。往下的真正資料問題見下一輪（1.2.5）。

## Claude 接手狀態（2026-09-15，第三輪：名冊信箱不再限制網域）

- 起因：上一輪的具體錯誤訊息「信箱、姓名、學號或班級不完整」讓使用者發現
  真正卡住的是信箱網域限制——平台原本寫死只接受 `@ctcn.edu.tw`，但使用者
  的「班級名冊」分頁欄位其實是 `Gmail`（見固定決策，欄位本來就叫
  Gmail）。使用者明確要求「把『平台目前只接受學校網域信箱當學生帳號，不
  接受一般 @gmail.com』取消，反正有名單」——也就是不要再限制信箱網域，
  因為真正能不能用某堂課，本來就是由該課程自己的班級名冊（enrollments）
  決定，不是信箱網域。
- 確認影響範圍後才動手：`functions/src/index.ts` 的 `access()` 在學生走
  非教師路徑時，一定會另外查 `enrollments/{courseId}__{email}`（或舊版
  `roster/{email}`），要 `enabled` 且 `classId` 在該課程已發布班級中才准
  進去（見 `access()` 第 99-107 行）。也就是說：就算信箱網域限制拿掉，
  沒被同步進班級名冊、沒被啟用的信箱依然完全進不去任何課程——移除網域
  限制不會打開一個沒有名單把關的後門，只是不再多一層「網域一定要是
  @ctcn.edu.tw」的限制。
- 改動：
  - `shared/model.ts`：`allowedEmail()` 移除 `@ctcn.edu.tw` 網域檢查
    （原本的 `SCHOOL_EMAIL` 正規表達式），改成只檢查「像不像一個信箱」
    （`EMAIL_FORMAT`，要有 `@` 和網域），一般 `@gmail.com` 等信箱现在可以
    通過。`testEmails`／`config/testStudents` 白名單參數維持相容，但因為
    現在任何格式正確的信箱都會過，這個白名單實質上不再是唯一能放行非
    校方信箱的管道了（不影響既有呼叫方式，只是意義變淡）。
  - `functions/src/index.ts`：`identity()` 裡兩句錯誤訊息「請使用已驗證的
    學校 Google 帳號」改成「請使用已驗證的 Google 帳號」／「信箱格式無效」，
    避免文字仍暗示網域限制、誤導使用者。
  - `tests/core.test.ts`、`tests/platform.test.ts`：更新對應測試——原本
    斷言「非學校信箱會被拒絕」的兩個測試案例，改成斷言「一般信箱會通過、
    但格式不對（例如缺 `@`）仍會被擋下」，反映新的預期行為，不是被規避的
    失敗測試。
- 驗證：根目錄 `npx tsc -b` 無錯誤；`npm test`（前端／共用邏輯）28/28 全
  過（含上述兩個更新過的案例）；`functions/` 底下 `npm run build`（29 個
  函式）與 `npm test`（5/5）皆通過。
- 版本：`VERSION` 由 1.2.4 升到 **1.2.5**，`node scripts/version.mjs` 已
  同步所有版本檔案，`DEVELOPMENT_LOG.md` 已新增 1.2.5 條目，
  `node scripts/version.mjs --check` 通過。
- **這輪跟 1.2.4 一樣，只動到 `functions/src/index.ts` 與共用的
  `shared/model.ts`（`shared/` 同時被前端與後端引用，但前端目前沒有任何
  地方呼叫 `allowedEmail`，只有 `functions/src/index.ts` 用它），沒有動
  UI，前端版本號不會變成 1.2.5，但 Firestore/Functions 的行為改了。**
  1. 使用者需要用 GitHub Desktop 推送這個新 commit。
  2. **使用者需要在自己電腦 Terminal 再跑一次
     `npx firebase-tools deploy --only functions --project ap2-7ed91`**，
     這個放寬信箱網域的修正才會生效。
  3. 部署後預期：使用者的「班級名冊」分頁裡如果 Gmail／學號／姓名／班級
     四欄都填好格式正確（尤其學號只能半形英數字/底線/連字號、班級代碼
     不能有空白或斜線等符號），這次應該就能真的同步成功；如果還有欄位
     不符合格式，畫面會顯示具體是第幾列、什麼問題（1.2.4 那次修正的
     效果），麻煩使用者把訊息回報以便繼續排查。

## 下一步需要的外部輸入（教師／使用者要做的事，不是程式問題）

- **實測確認（1.2.5）**：等這次改動 push 到 GitHub 且 Functions 重新部署
  （`npx firebase-tools deploy --only functions --project ap2-7ed91`）後，
  麻煩在「班級名冊」頁重新按一次「同步班級名冊」。信箱網域限制已經拿掉，
  如果還是失敗，畫面應該會指出是第幾列、哪一類欄位問題（學號格式、班級
  代碼格式、姓名空白等），麻煩把訊息內容回報，才能判斷下一步。
- 正式 Google Sheet《115-1-AP2課程平台》：課程代碼欄全空、單元欄 65% 空白、
  名冊是空的——可以用 `apps-script/FillCourseAndUnit.gs` 批次補課程代碼與
  單元欄，但「從沒填過單元的次單元」該歸哪一類，仍要人工決定
- 1.0.4 後端已部署至 ap2-7ed91，21 個函式在 asia-east1 使用 Node 22，5 個
  索引已 READY。已建立 SHEETS_SYNC_KEY 第 1 版與 7 天映像清理政策。
- 第一位教師 hhchang@ctcn.edu.tw 已驗證信箱並設定 teacher=true
- Google Sheet 同步：需先在 Google Cloud 啟用 Sheets API，並把管理課程用的
  那份 Sheet 以檢視權限分享給 Cloud Functions 執行服務帳戶，再到教師後台
  「平台設定」填入 Sheet ID
- 新題庫、完整學校信箱名冊、GitHub Pages 教材網址、YouTube 影片連結

禁止在未授權情況下沿用舊 Firebase 管理員金鑰。實際部署與教材相容性驗收不可
由示例頁替代。
