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

目前版本：1.3.0。2026-09-18 已完成學生端 UI 改版 1.3.0 第二階段：`src/Student.tsx` 增加課前／課堂／課後／練習 hash 分頁、活動卡與完成文字、100dvh 獨立閱讀頁、完整／抽題／閃卡／錯題共用作答外框；新增 `src/studentRoute.ts` 統一解析／還原 hash，作答中的瀏覽器返回先顯示離開確認。第一階段的可見性、完成度第 2 版與後端重新批改均保留；本輪測試另確認竄改前端 correct/score 不影響伺服器成績。`npm run check` 已通過（前端 43、後端 5）；第二階段本機 commit 已建立（以 `git log -1` 取得目前 hash），未 push、未 deploy。規格檔 `docs/STUDENT_UI_REDESIGN_1.3.0.md` 仍是使用者未追蹤檔案，不納入提交；下一步由教師部署 Functions 與推送 Pages。
2026-09-18（第七版，測試補強）：使用者已授權錯題結構與答案表資料變更。`Progress.wrong` 已升為 `{questionId:{n,at}}`，舊陣列相容為 `{n:1,at:0}`、答對移除；新發布題庫建立私有 `grading/answers`，交卷優先讀答案表、舊題庫 fallback chunk 並只警告一次；題庫快取使用 localStorage 版本鍵（1 MB 單筆、3 MB LRU、登出清除）。學生端移除錯題複習作答入口、加入純前端錯題閃卡及首頁錯題／綜合練習入口；`submitMixedAttempts` 以單筆 progress transaction 處理最多 10 個次單元。已補上錯題篩選／排序、快取命中與 LRU、毀損及配額回退、首頁排序、答案表私有性與混合交易邊界測試；`npm run check` 通過（前端 49、Functions 7）。規格原檔仍是使用者未追蹤檔，禁止納入 commit。實機 UI 與真正 Firestore transaction rollback 仍需用 Emulator 或正式測試專案驗收；目前記憶體後端只驗證交易結構，不能模擬 Firestore 的 abort 提交保證。
2026-09-18（第二階段最終驗證）：後端測試總數已增至 6（含「區域 transaction 不複製 draft 其他內容」靜態防護），前端測試 43；完整 `npm run check` 已通過。第二階段本機 commit 已建立，未 push、未部署。
2026-09-18（第二版規格調查，未改程式／未 commit）：`docs/STUDENT_UI_REDESIGN_1.3.0.md` 已提供；按其第 11 節先核對後，**第 2 項不成立**：`createSnapshot()` 把課程適用次單元與各學生 progress 寫入 `courses/{courseId}/snapshots/{snapshotId}`，匯出時仍以當下 `completion()` 重算，完成度新規則會使舊快照的匯出結果改變；**第 3 項亦不成立**：Unit 內嵌在 `courses/{courseId}` 的 `draft` 與 `published`，學生只讀 published，單改 draft 不會即時生效。已依使用者規則停下，尚待教師決定：是否接受 `setUnitVisibility` 原子同步更新 draft＋published（不重發題庫／不按一般流程重新發布），及舊結算快照應固定既有規則／重算／只允許新快照採新規則。先前確認的 SDK 0 秒 `node_time` 缺陷仍有效（`public/materials/course-learning.js` 的 `nodeTime()`）；修正為取整後 0 不送即可。指定規格檔目前是未追蹤使用者檔案，勿在本次 commit 納入，除非教師另行確認。
2026-09-16（第九輪，1.3.8）：修正先前誤判——`course-orientation-v1`（課程簡介圖卡）其實已接上 `course-learning.js`，並非完全沒有追蹤；把它的探索節點從 1 個整頁節點拆成 8 個，改用 `IntersectionObserver` 捲動偵測，保留原本長條捲動版面。詳見下方「第九輪」小節。
2026-09-16（第十輪，1.3.9）：使用者想要「把已經建好的資訊圖表自動化匯入」，查證後發現目前 6 份教材其實都已經接好追蹤（不是想像中的積壓件），於是把心力改放在建立可重用工具：新增 `shared/materials.ts`（教材目錄唯一資料來源）、`scripts/materials.mjs`（`npm run materials:audit`／`materials:sync`，稽核＋重新產生 README）、`course-learning.js` 新增共用的 `trackScrollNodes()`、教師後台「教材版本」改成下拉選單自動帶出節點／題目數。順便核對出 `blood-composition-v1` 題目總數應為 11（不是 5）、補上 `blood-pre-v1`（22 節點／10 題）與 `blood-post-v1`（43 節點／15 題）的登記與測試。詳見下方「第十輪」小節。
2026-09-16（第十一輪，1.3.10）：延續第十輪的教材匯入自動化，使用者進一步要求「有一個地方可以直接貼程式碼、打標題、按按鍵跑完，還要能預覽、能移除重來」，於是把 `materials:audit`／`materials:sync` 包成一個本機網頁工具：`npm run materials:studio`（新增 `scripts/materials-studio.mjs`＋`scripts/materials-studio.html`），瀏覽器打開 `http://127.0.0.1:5183/` 後依序①匯入②稽核③寫入教材目錄，畫面下方可個別移除檔案／目錄項目重來。只在本機執行（綁定 127.0.0.1），不進部署產物，也不執行任何 git 指令。
2026-09-16（第十二輪，1.3.11）：使用者不想打開終端機打指令，於是新增專案根目錄的「`教材工作室.command`」——雙擊即可自動開終端機視窗跑 `npm run materials:studio`，伺服器準備好會自動開瀏覽器分頁，關掉終端機視窗就結束；`public/materials/README.md` 改成以雙擊這個檔案為首選說明。純新增一個 shell script／文件更新。
2026-09-16（第十三輪，1.3.12）：完成「`教材工作室.app`」無終端機啟動器：由 macOS LaunchServices 背景啟動本機教材工作室，找不到 Node 或啟動失敗時顯示原生提示；README 改以 App 為首選，`.command` 保留為可查看錯誤的備用方式。版本已同步至前後端與文件；`npm run materials:audit`、`npm run check`（前端 35、後端 5）、`plutil -lint`、`git diff --check` 均通過。此版沒有後端變更，不需部署 Functions。已建立本機提交 `d24ed9b`（新增無終端機教材工作室 App，Codex GPT-5）；**尚未推送**，因為推送受保護 `main` 會觸發 GitHub Pages 正式發布，需使用者再作明確發布確認。
2026-09-16：依使用者提供的 YouTube〈115學年度解剖生理學與實驗2 課程介紹〉製作未發布的課程資訊圖卡草稿：`html/115學年度解剖生理學與實驗2_課程介紹資訊圖卡.html`，並附同名背景 PNG。內容逐段核對影片投影片，含第 5／9／10／12／14／17／18 週節點、40/30/30 成績結構、一般／彈性平時評量與不及格規則。**使用者後續提供「大體參訪時間更新」公告，已以此覆蓋影片中的舊時程：第一梯次 12/04（週五）下午、第二梯次 12/05（週六）上午。**同頁新增 6 題本機課程理解驗收（選項每輪洗牌、逐題解析、完成後顯示分數；不計正式成績，也尚未串接平台資料）。因這是課程介紹而非已定義的正式互動教材，尚未放進 `public/materials/`、未建立版本或活動設定、未提交。HTML 關鍵資料檢查、內嵌測驗 JavaScript 語法與 `git diff --check` 已通過；本機 `file://` 預覽被 browser security policy 阻擋，未繞過限制。工作樹另有使用者既存未追蹤的 `html/止血機制與凝血病理.html`，不得納入此草稿。
2026-09-16（後續更新）：使用者提供《課程內容、課堂規範與評量方式》PDF 與 ZUVIo 單選題 CSV 範本。已將圖卡以 PDF 的正式內容擴充／校正：四階段考試範圍與日期、學習目標、兩本課本、手機／出席規範、Q1–Q8 線上小考與截止時間、免參訪評量調整；測驗改為 10 題、每題 10 分、總分 100 分。另產生可直接匯入的 Big5 編碼題本 `html/115學年度解剖生理學與實驗2_ZUVIo題本.csv`，沿用範本前五欄、每題 4 個選項與正解索引。已驗證 HTML 10 題與測驗 JavaScript 語法、CSV 10 題／100 分／欄位／正解索引、以及 `git diff --check`；仍在 `main` 的未追蹤草稿，未提交、推送或部署。PDF 視覺檢視使用 Poppler 轉圖，僅讀取原始檔、不變更 PDF。
2026-09-16（最新圖卡互動調整）：使用者要求移除圖卡可見的資訊來源文字；「課程理解驗收」改為按「開始」後全螢幕獨立顯示，背景圖卡完全被遮蔽，僅保留題目、選項、進度、返回與下一題控制。使用者明確指定不及格條件題採嚴格的「四次考試平均 < 40 分且 PR < 33」：已同步改掉圖卡規則、HTML 第 7 題與 Big5 ZUVIo CSV 第 7 題（正解為 39 分／PR 32）。這與 PDF 原文的 `≤ 40`／`≤ 33` 不同，後續如再修正需以教師最新明確指示為準。
2026-09-16（正式教材納入）：依使用者指示，已將所有不重複的資訊圖卡納入 `public/materials/` 的獨立版本資料夾：`course-orientation-v1/`（課程介紹；含背景圖、10 題、10 題全對才呼叫 `CourseLearning.complete()`）、`hemostasis-mechanisms-v1/`（止血與凝血；6 節點、6 題基礎＋5 題病例）與 `blood-gas-transport-v1/`（血液氣體運送；6 節點、6 題基礎＋5 題病例）。`blood-composition-v1/` 已是既有的正式「血液的組成」版本，故沒有重複建立。`public/materials/README.md` 已登錄版本與驗收分母，`tests/material.test.ts` 已加入三個教材的靜態驗證，並調整血液組成既有測試以符合已實作的兩層題目變數名稱。正式後台 HTML 活動設定時，課程介紹填教材版本 `course-orientation-v1`、節點 1、題目 10；另兩份分別填各自版本、節點 6、題目 11。原始 `html/` 檔及 ZUVIo CSV 均保留；尚未提交、推送或部署。驗證：`npm test` 32/32、`npm run build`、`git diff --check` 皆通過。
2026-09-16（發布操作說明）：已向使用者說明正式發佈需先將本機變更提交並推送至 `main`（會觸發 GitHub Pages），待 GitHub Actions 的 Publish course platform 成功後，使用 `https://albertchang1008-alt.github.io/115-1-AP2/materials/<material-version>/index.html` 作為教師後台 HTML 活動網址；在教師後台保存草稿、預覽 iframe、設定診斷分母、發布課程，再以真實學生帳號驗收事件。此說明不包含提交、推送或部署操作。
本輪驗證已通過：`npm test` 29/29、`npm run build`（含版本一致性、TypeScript 與 Vite production build）、`git diff --check`。未部署 Functions（沒有後端變更）。待 Pages 發布後，教師須新增 HTML 活動，使用 `blood-composition-v1/index.html`、互動診斷模式、版本 `blood-composition-v1`、節點 6、題目 5，並以真實學生帳號完成一次 iframe 端到端事件驗收。`html/` 原始資料夾屬使用者內容；2026-09-16 依使用者明確要求，已修改其中未追蹤的 `止血機制與凝血病理.html`，但未納入 Git 或部署。
2026-09-15 這一輪之前，`origin/main` 已經跟本機同步到 `fcd38b2`（1.2.2：同步按鈕搬到題庫管理／班級名冊頁），git 比對顯示 0 個落差（雙向皆 0），代表 GitHub Desktop 已經推送過；但這次沒能像先前那樣用公開 GitHub Actions API 驗證 Pages workflow 是否跑成功——這個雲端沙箱這次呼叫 `api.github.com` 被 proxy 擋下（回傳「GitHub access to this repository is not enabled for this session」），麻煩使用者自行到 GitHub 的 Actions 分頁確認「Publish course platform」是綠燈。
後端 Functions：**1.2.4 已部署且確認生效**（使用者實測「同步班級名冊」看到具體的「名冊格式錯誤：...」訊息，取代了原本的 internal/500，證實修正有效）。**1.2.5（移除信箱網域限制）已於 2026-09-16 部署並經使用者實測確認 OK**——她回報部署完成後又按過「同步班級名冊」，結果正常，這條待辦已經關閉，之後不用再提。
**1.2.6～1.3.9（這之後每一輪）都只改前端／腳本／文件**（quiz 模式恢復交卷後才揭曉、傳統解析改回收合、新增字級設定、1.2.7 把色系／字級選單移到頁面最上方、1.2.8 修正夜間色系按鍵對比、1.2.9 切換 Google 帳號、1.3.0 拿掉 ABCD 字母徽章、1.3.8 課程簡介圖卡拆分探索節點、1.3.9 教材匯入自動化），完全沒有動到 `functions/`，**不需要再部署 Functions**。1.2.5 之後就沒有其他 Functions 部署待辦了，只需要 GitHub Desktop push 讓 Pages 重新發布即可生效。

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
14.（1.2.0，2026-09-15 兩次更新）`Explanations` 元件依 `audience` 區分學生／教師視角：學生看①～④，教師另外多看⑤追溯原子卡（教師備課用的溯源資訊，學生端不顯示）。這段解析原本叫「蘇格拉底式解析」，2026-09-15 改名為「引導式解析」（只改畫面標籤，`socratic.*` 欄位鍵名與 Sheet 匯入欄位名稱都不變）。**引導式解析①～⑤在所有畫面一律直接展開顯示，不用點擊**——使用者明確要求「一次給到位」。**傳統解析（2026-09-15 第二次調整，1.2.6）改回預設收合、要點 `<summary>` 才展開**（原本 1.2.3 也曾改成直接展開，使用者實測後認為分不清楚跟引導式解析的差別，要求改回收合）。**quiz 模式（完整測驗／抽題練習）作答中不揭曉正解與解析，要交卷後才看得到**（1.2.3 曾一度改成作答中就立刻顯示，使用者實測後發現這樣跟閃卡沒有差別，1.2.6 改回原本設計）；閃卡、複習模式維持選了就立刻鎖定並顯示，不受影響。
15.（2026-09-15）題庫同步以**課程代碼分頁名稱**辨識來源：例如課程代碼 `115-1-AP2` 就只讀同名分頁；不再掃描所有看起來像題庫的工作表，`題庫ext` 等輔助分頁會略過。「同步題庫」固定放在**題庫管理**頁，「同步班級名冊」固定放在**班級名冊**頁，只有按鈕才讀取對應分頁；每次皆為增量同步，未變更內容不重複寫入。兩頁不保留 CSV／JSON 或舊名冊轉換等手動資料入口。正式題庫分頁的每列不必填課程代碼，`單元` 是顯示分組，`次單元` 是可練習、計完成度並各自發布版本的題庫單位。課程本身仍必須先手動建立，且分頁名稱須與它的代碼完全相同。
16.（2026-09-15，1.2.5）`allowedEmail()` 不再限制信箱網域（原本只接受 `@ctcn.edu.tw`），一般 `@gmail.com` 等信箱只要格式正確就能通過；真正能不能用某堂課，由該課程自己的班級名冊（`enrollments`）決定。
17.（2026-09-15，1.2.6／1.2.7）全平台文字大小可由使用者自行調整：「字級」下拉選單（小／預設／大／特大），比照既有「色系」選單的做法，用 CSS 變數 `--font-scale` 搭配 `localStorage`（key `course-font-scale`）記住偏好，教師後台與學生端共用同一個設定。`src/style.css` 所有 `font-size` 都要寫成 `calc(Npx * var(--font-scale, 1))` 的形式，之後新增樣式規則也要照這個寫法，不要再寫死 `font-size: Npx`，否則新文字不會跟著縮放。**位置（1.2.7 更新）：色系／字級選單不是各自 `position: fixed` 浮動在右下角了，而是一起放進 `.prefs-bar`（`position: sticky; top: 0;`）常駐列，固定在頁面最上方、貼齊頂端捲動**——1.2.6 版本用 fixed 右下角會蓋住頁面內容（使用者截圖回報蓋住「抽10題」文字），1.2.7 改成這樣解決。
18.（2026-09-15，1.2.9）登入（`src/service.ts` 的 `login()`）呼叫 `signInWithPopup` 時固定帶 `prompt: 'select_account'`，讓 Google 彈窗每次都強制列出帳號選擇畫面，不會因為瀏覽器已有登入狀態就悄悄沿用同一帳號。新增 `switchAccount()`（先 `signOut` 再呼叫 `login()`），並在學生端 `student-nav`、教師端側欄的「登出」按鈕旁新增「切換帳號」（教師端預覽模式不顯示，因為那不是真的 Google 登入狀態）。之後如果要再新增任何登入相關按鈕，沿用 `App.tsx` 裡已有的 `doSwitchAccount()`／`error`／`loading` 這組 state，不要另外重造。
19.（2026-09-15，1.3.0）測驗選項按鈕不再顯示 A/B/C/D 字母徽章，`src/Student.tsx` 選項清單只渲染選項文字（`<b>{String.fromCharCode(65+j)}</b>` 已移除，對應的 `.options button b` CSS 規則也一併拿掉）。這個元件是 quiz／閃卡／複習／教師預覽共用的同一份，改一處就會套用到所有畫面。注意：固定決策 12「選項每次都重新洗牌，避免學生背 ABCD 位置」講的是選項**順序**洗牌邏輯（`shared/model.ts` 的 shuffle），跟這次拿掉的字母**顯示**標籤是兩件事，洗牌邏輯本身沒有改動、還是照樣每次重排。
20.（2026-09-15，1.3.1～1.3.5）新增教材 `public/materials/blood-composition-v1/index.html`，是「血液的組成」獨立互動活動，與既有 `blood-pre-v1`／`blood-post-v1` 並存。它以六張資訊卡作探索分母，五題固定 ID（`blood-composition-q01`～`q05`）的首次答案作診斷；五題全對才呼叫 `CourseLearning.complete()`，重做不覆寫首次答案。教師新增 HTML 活動時，網址指向該資料夾的 `index.html`，紀錄方式選「闖關與學習診斷」、版本填 `blood-composition-v1`、探索節點總數 6、闖關題目總數 5。此教材通關只記教材活動完成，不影響題庫完整測驗的單元完成度規則。GA4 已啟用去識別的探索／首次答題／通關事件，絕不可傳姓名、信箱、學號或登入資訊。
21.（2026-09-15，1.3.6）`LearningEvent` 新增 `node_time`（`nodeId`＋每批 1–60 秒），`LearningSummary.nodeSeconds` 累積逐節點有效停留。SDK 新增 `CourseLearning.nodeTime()`；新教材在單一開啟圖卡中每 15 秒結算、切換／隱藏時結算，閒置超過 60 秒不計。血液組成教材學生端的六顆星來自六張圖卡首次探索，「血液探索家」在六星全得時解鎖，「限時連勝王」在五題限時連勝時解鎖並觸發煙火與 `complete()`。每次重做的作答皆回報，後端保留 `firstCorrect` 同時累積 attempts。教師診斷的 Mastery v1 是探索覆蓋 40%＋首次答對 60%，嘗試／重試與節點停留分開呈現，不作正式成績。**此版需要 GitHub Pages 發布與 `npx firebase-tools deploy --only functions --project ap2-7ed91`，否則新版教材送出的 `node_time` 事件會被舊 Functions 拒絕。**
21.（2026-09-15）互動教材診斷只能提供教學線索，不能把行為直接判定為「猜題」或「認真」。現有血液教材能看六個探索節點、各題首次對錯、有效前景時間與通關；它刻意只回傳每題第一次作答，所以後台「嘗試」通常不代表重做次數，且尚未回傳提示使用或各節點停留時間。若要更細緻地分析重試與閱讀行為，需另行實作多次作答、提示及節點停留事件，並以中性標籤呈現。
22.（2026-09-15，1.3.6）GA4 用於去識別的全班／教材趨勢，不傳學生姓名、學號、信箱或可回連名冊的 User-ID；個別學生的教學支持僅在有課程與班級授權的 Firestore 教師診斷頁進行。GA4 目前送探索、逐圖卡停留、每次答題（含 `attempt`／`first_attempt`）與通關事件；尚未送出單輪彙總的 `explored_nodes_count`、`first_try_wins` 或 `total_guess_attempts`，且「猜題」與「真正看懂」不得由系統自動判定。
23.（2026-09-15）四項診斷擴充評估：平台既有散點圖已可呈現探索比例×首次答對比例，新增四象限輔助線、名稱與中性教學行動只需前端；1.3.6 已能蒐集重試與逐圖卡有效停留，但需重新部署 Functions 並以真實帳號驗收，舊紀錄不會補齊；Mastery 是探索 40%＋首次答對 60% 的診斷指標，不可稱為真實精熟或正式成績；若要在 GA4 做匿名四象限，需另送單輪彙總事件並在 GA4 登錄自訂指標，不能與平台學生姓名對照。
24.（2026-09-16，1.3.10）`npm run materials:studio` 是本機限定的教材匯入小工具（純 Node 內建模組、無額外套件，綁定 127.0.0.1），不是平台功能，不會出現在部署的 GitHub Pages 網站上，也不會執行任何 git 指令；它的匯入／稽核／目錄讀寫邏輯重用 `scripts/materials.mjs` 的 export，兩邊規則要保持同一份，不要各自維護一套。之後如果要再幫這個工具加功能，沿用 `scripts/materials-studio.mjs` 既有的 `/api/*` 路由風格與 `scripts/materials-studio.html` 的原生 JS（沒有框架），不要引入新的建置流程。
25.（2026-09-16，1.3.12）教材工作室首選啟動器是專案根目錄的「`教材工作室.app`」：它是 `LSUIElement` 的 macOS App，雙擊不開終端機，背景啟動 `npm run materials:studio` 並由工作室自動開啟瀏覽器。找不到 Node 或啟動失敗會顯示原生提示；第一次可能需在 Finder Control-點按後選「打開」。`教材工作室.command` 保留作為除錯備用方式（會開終端機印出錯誤）。兩者只服務本機教材匯入，絕不執行 git 或正式部署。
24.（2026-09-15）延伸至全課程活動的教學實踐研究資料評估：互動 HTML 的探索／首次表現／重試／有效時間、題庫的題目作答與時間、影片的有效觀看里程碑、外部連結的閱讀確認，足以作為形成性診斷、介入紀錄及過程證據；但不能單獨證明教學介入造成學習提升。若以教學實踐研究計畫主張成效，需在實施前明定學習目標與主要成果指標，補做前測－後測（或既有可比基準）及至少一種交叉證據，例如短反思、訪談、開放題或情境遷移題；完成資格與 GA4 匿名趨勢均不可取代上述成效評量。
25.（2026-09-15）題庫解析評估建議：引導式解析目前直接顯示、傳統解析為可展開區塊，現行資料只有作答正誤與作答時間，不能評估哪種解析有助理解。後續優先新增每題解析曝光／展開、粗粒度有效停留、補強資源點擊與解析後單題理解檢核；真正成效以延後的等值遷移題或下次首次作答驗證，而非解析開啟率。避免蒐集逐字輸入、完整捲動軌跡或以停留時間判定「有沒有認真讀」；分析匯出需去識別化，教師個案頁維持授權存取。
26.（2026-09-15）可將「引導式解析投入相較於只看傳統解析，是否提升解題能力」定為教學實踐研究問題，但停留時間與自選展開均有自我選擇偏差，不能直接作因果結論。建議用依概念群交叉平衡的隨機預設解析順序：一組先看引導式、另一組先看傳統，完成短檢核後皆可看完整內容；保存 `condition` 與解析行為。主要結果為同概念等值近遷移題、不同情境遠遷移題與一週後保留題的首次正確率／時間；控制前測、題目與概念，並將解析後同題答對僅列為次要立即理解指標。
27.（2026-09-15，1.3.7）題庫解析研究資料能力已實作：所有單元預設蒐集（教師可逐單元關閉），`Explanations` 在引導式解析顯示滿 3 秒時寫入 exposure，傳統解析寫入展開與收合間的 1–600 秒粗粒度停留；前端用 `saveExplanationResearchEvents` 保存至後端，事件以學生／班級／單元／題庫版本隔離。教師「解析研究資料」頁以授權班級與次單元讀取彙總。資料不影響成績、完成資格或題庫報表，且不可作為注意力或精熟判定。此版修改 Cloud Functions，正式使用需 Pages 發布後重新部署 Functions；等值遷移題、隨機呈現條件與前後測仍是下一階段研究設計。
28.（2026-09-15，1.3.7）解析研究頁同時以每題最後一次解析事件為界，串接既有題庫作答紀錄，彙總該事件之後「同題後續作答數、後續再錯率、至少一次答對的已改正題數」。沒有後續同題作答時，後續再錯率顯示資料不足；此指標能用於學生個人縱向改正趨勢，仍不能排除自我選擇偏差或取代等值遷移題。
29.（2026-09-15，1.3.7）「解析研究資料」頁已改名為「HTML→題庫解析研究資料」並合併相同班級／次單元的互動 HTML 診斷：探索節點、首次答對與有效時間，接著並列引導式／傳統解析秒數、解析後同題作答、再錯率與改正題數。僅呈現已產生解析研究事件的學生；HTML 與題庫資料仍分欄，不冒充嚴格的因果先後證明。此變更同樣需要重新部署 Functions。
30.（2026-09-15）功能盤點：已完成血液組成互動教材、HTML 診斷、題庫解析事件、同題後續改正率及 HTML→題庫研究頁；尚未完成跨所有活動的整合（YouTube 有效觀看里程碑、外部連結以外的理解證據）、所有教材的統一 GA4 匿名事件、研究用隨機／交叉呈現條件、等值近遷移題／病例遠遷移題／延後保留題、前後測與去識別研究匯出、解析事件離線佇列及正式學生端到端驗收。1.3.7 尚未推送 Pages 或部署新版 Functions，舊資料也不會回填新事件。
31.（2026-09-15）使用者要求實作完整研究資料規畫。後續平台工作應先提供可由題庫匯入的研究題型／開放機制與資料管線；等值題、病例題、前後測的題幹、選項、正解、概念標籤與開放時間屬教師研究工具內容，不能由平台自行杜撰後當作正式量測。既有版本先以 HTML→題庫同題改正趨勢作可用基線。
32.（2026-09-15）NotebookLM 產生新互動 HTML 時使用平台串接提示模板：教材以 `https://albertchang1008-alt.github.io/115-1-AP2/materials/course-learning.js` 載入公開 SDK，不傳學生身分或 GA4；固定英數字節點／題目 ID、首次展開探索、前景有效節點停留、每次作答與全對才通關。產物放於 `public/materials/<material-version>/index.html`，教師後台再填相同教材版本及實際節點／題目分母。
33.（2026-09-16，待實作）檢視 NotebookLM 產生的 `html/血液氣體運送.html` 與 `html/止血機制與凝血病理.html`，兩者的「點擊展開詳細說明 ▼」都是不能互動的 `<div>`，實際切換事件只綁在卡片標題 `.node-card-header`；造成提示文字與可點區域不一致。下輪應將提示改為同一個可操作的 `<button>`（或把它納入唯一的標題按鈕），由 JavaScript 以 `aria-expanded` 驅動文字與箭頭，不再寫入 `textContent` 覆蓋節點；並改用 `addEventListener` 取代 inline `onclick`，驗證滑鼠、鍵盤、觸控、篩選後與 iframe 事件各只送一次探索。
34.（2026-09-16，待實作）五專學生版本的互動 HTML 要加強具教學功能的圖像，而非裝飾圖：每個核心節點至少有一張標示關係／流程／部位的圖解，展開後再提供放大圖與「圖像→名詞→機制→臨床情境」的短說明。血液氣體運送優先使用紅血球－肺泡－組織的氧／二氧化碳流向圖、Hb 結合示意與貧血比較；止血優先使用血管受傷到血小板栓、凝血網、纖溶的時間流程圖與內外在路徑匯流圖。需先確認可合法使用的圖片來源或由教師提供圖檔；平台記錄仍只記節點探索／有效停留，不把圖片點擊當作理解證據。
35.（2026-09-16）止血教材第一版圖像化已在使用者原始檔 `html/止血機制與凝血病理.html` 實作：加入六步可點式 SVG 流程圖（血管痙攣、血小板栓、內外在路徑匯流、纖維蛋白網、抗凝調控、纖溶）。**最後版面決策（2026-09-16）：詳細圖不收合，且由 DOM 載入時移到每張卡片內容最上方，採「圖→核心概念→重點→臨床意義」的閱讀順序；完全移除六個展開／收合按鈕。**上方流程圖改為選取卡片、捲動定位、藍框標出目前焦點，並首次記探索、在選取期間記節點有效時間；不需要讓學生對同一件事點兩次。六張詳細圖依序解釋管徑縮小、血小板黏附聚集、內外在路徑匯流、纖維蛋白網固定、維生素 K／肝臟／抗凝調控、tPA 纖溶；不重複使用上方導覽小圖。已通過內嵌 JavaScript 語法、六個流程按鈕、零個展開控制、六張詳細圖與 `git diff --check` 檢查；browser automation 因 `file://` 安全政策無法讀取本機頁面，仍需使用者實機預覽。此檔仍未追蹤；若決定正式發布，須先複製為 `public/materials/hemostasis-mechanisms-v1/index.html` 再納入版本控制與部署。
36.（2026-09-16）新增 `docs/NOTEBOOKLM_HTML_WORKFLOW.md`，定義「NotebookLM 內容初稿→本平台修飾→正式發布」的可重複流程與初稿提示詞。初稿階段不串接追蹤，正式版才補視覺教學化、可近用互動、CourseLearning 事件、闖關規則與 iframe 驗收；NotebookLM 產物不可直接發布。
37.（2026-09-16）對外操作採三方分工：教師先填章節／目標／版本／節點與題目分母並把初稿交給 NotebookLM；教師把產出的單檔 HTML 交給平台維護者，平台維護者進行內容校對、圖像與互動修飾、SDK 串接及驗收；教師預覽確認後才由平台維護者放進 `public/materials/<version>/index.html`、提交／推送，最後教師在後台新增活動並以真實帳號驗收。任何一個教材內容重大變更建立新版本，不能覆寫舊版。
38.（2026-09-16，教材原型已實作；平台分層報表未實作）止血教材的 `html/止血機制與凝血病理.html` 已改兩層：第一層「先備知識建構」6 題依流程圖排列的低門檻辨識／順序／名詞－功能題，答錯立即給短提示、該錯誤選項不能重按、改答正確才前往下一題；六題完成才解鎖。第二層保留 5 題隨機的實務病例／易混淆應用題，病例層全對才呼叫教材 `complete()`。題目 ID 採 `hemostasis-foundation-q01...q06` 與 `hemostasis-case-q01...q05`，每層各有可見進度。現有 `answer(questionId, correct)` 會保存 11 題所有作答事件；若教師確認此流程並正式發布，活動題目分母需由 5 改 11，且後續應擴充教師診斷頁依 ID 前綴分列基礎層與病例層首次正確／重試，避免混成一個分數。不可用重試數或時間直接判定學生是否認真。
39.（2026-09-16，進行中）使用者要求把兩階段題目流程套用至全部現有教材。已完成止血原始檔、正式發布用 `public/materials/blood-composition-v1/index.html` 與 `html/血液氣體運送.html` 的題庫分層：各新增 6 題基礎題、原有 5 題改病例層，病例層需先備層完成才解鎖。血液組成正式版與氣體運送已通過內嵌 script 語法檢查。`html/血液的組成.html` 仍是舊的未串接原稿，尚未完成改造；前後測 `blood-pre-v1`、`blood-post-v1` 刻意不改，因為它們是維持可比較性的測量工具。正式發布前仍需內容校對、把氣體運送／血液組成原稿的圖文閱讀順序同步成止血版，並調整活動題目分母為 11、教師診斷分層呈現。

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

## Claude 接手狀態（2026-09-15，第四輪：quiz 恢復交卷後揭曉／傳統解析改回收合／新增字級設定）

- 起因：使用者實測 1.2.3「一次給到位」的效果後，認為完整測驗作答中就能
  逐題看到正解與解析，跟閃卡沒有差別，要求 quiz 模式恢復成交卷後才揭曉；
  同時要求傳統解析改回預設收合、要點才展開（引導式解析維持不用點擊直接
  展開，這部分沒有要改）。另外詢問並確認要新增「字級可由使用者自行調整」
  這個新功能，範圍是全平台文字，介面比照既有色系選單、用預設檔位下拉
  選單（不是連續滑桿）。這次先用 EnterPlanMode 規劃過，使用者確認後才動手
  （計畫檔：本機 session 的 `inherited-kindling-sunset.md`，內容已併入這裡
  跟 DEVELOPMENT_LOG.md，不需要另外保存）。
- 改動：
  - `src/Student.tsx`：`choose()` 從不分模式一律鎖定，改回
    `if (mode !== 'quiz') setLocked(...)`——quiz 模式（完整測驗／抽題
    練習皆用這個 mode，靠 `full` 參數分完整度計算）作答中選項不會 disable
    （交卷前可改答案），也不會顯示正解／解析的 `feedback` 區塊；閃卡／
    複習模式不受影響。交卷後的 `result`／`reviewanswers` 區塊本來就跟
    `locked` 無關，一律顯示正解與解析，這次沒有改。
  - `src/QuestionContent.tsx`：`Explanations` 的傳統解析從 `<section>`
    改回 `<details><summary>傳統解析</summary>...</details>`，預設收合；
    引導式解析①～⑤維持不變、仍直接展開。`Explanations` 是教師預覽／測驗
    即時回饋／交卷後複習／閃卡共用的唯一元件，這裡改一處全部生效。
  - 新增字級設定：`src/style.css` 把所有 88 處 `font-size: Npx`（含一處
    `clamp(30px, 3.8vw, 54px)`）改成 `calc(Npx * var(--font-scale, 1))`
    形式（用腳本批次轉換，不是手動改），`:root` 新增 `--font-scale: 1`。
    **之後新增或修改樣式規則時，`font-size` 都要照這個 `calc(...)` 寫法，
    不要再寫死 px，否則新文字不會跟著字級設定縮放。**
  - 新增 `src/FontSizePicker.tsx`：完全比照 `src/ThemePicker.tsx` 的寫法
    （`useState`／`useEffect`／`localStorage`），下拉選單「小／預設／大／
    特大」四檔（比例 0.875／1／1.15／1.3），`localStorage` key
    `course-font-scale`；套用方式是設定 `document.documentElement.style`
    的 `--font-scale` CSS 變數。
  - `src/main.tsx`：掛載 `<FontSizePicker />`（跟 `<ThemePicker />` 一樣
    全站生效，教師後台與學生端共用）。
  - `src/style.css`：新增 `.fontsize-picker` 樣式（固定在右下角、色系
    選單正上方），含手機版 `@media(max-width:600px)` 的位置調整。
  - `docs/QUESTION_BANK_PLAN.md`「兩種解析」一節、`handoff.md` 固定決策
    14／新增 17：同步更新用詞與行為說明。
- 驗證：根目錄 `npx tsc -b` 無錯誤；`npm test`（前端／共用邏輯）28/28
  全過。quiz 鎖定邏輯與 `Explanations`／`FontSizePicker` 這幾個 React
  元件的實際互動行為（作答中是否真的看不到解析、字級切換是否真的變大
  縮小）**不在單元測試覆蓋範圍內**，需要使用者部署到 GitHub Pages 後
  親自檢查確認。CSS 轉換完後有用 grep 抽查過，確認沒有殘留漏改的裸 px
  `font-size` 規則。
- 版本：`VERSION` 由 1.2.5 升到 **1.2.6**，`node scripts/version.mjs` 已
  同步所有版本檔案，`DEVELOPMENT_LOG.md` 已新增 1.2.6 條目，
  `node scripts/version.mjs --check` 通過。
- **這輪（1.2.6）只動前端（`src/*.tsx`、`src/style.css`），完全沒有碰
  `functions/`，不需要重新部署 Cloud Functions**——但別忘了上一輪
  （1.2.5）的 Functions 部署還沒做，那個還是要跑，兩個是各自獨立的待辦。
  這輪只需要使用者用 GitHub Desktop push 這個新 commit，GitHub Pages
  重新發布後就會生效。

## Claude 接手狀態（2026-09-15，第五輪：色系／字級選單移到最上方，1.2.7）

- 起因：使用者部署 1.2.6 後用手機截圖回報，右下角浮動的「字級」「色系」
  下拉選單會蓋住頁面內容（截圖可見蓋住「抽10題」那行字），要求移到上方。
- 改動：`src/style.css` 把 `.theme-picker`／`.fontsize-picker` 原本各自
  `position: fixed; right:...; bottom:...;` 的寫法拿掉，改成兩個一起包進
  新的 `.prefs-bar`（`position: sticky; top: 0; z-index: 130;`，水平排列、
  靠右對齊），放在頁面最上方；捲動時會貼齊頂端，但因為是佔掉自己的一列
  高度（不是蓋在別的內容上面），不會再遮住任何文字。`src/main.tsx` 對應
  改成 `<div className="prefs-bar"><ThemePicker /><FontSizePicker /></div>`
  放在 `<App />` 之前，教師後台、學生端、登入畫面都會套用。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純版面／CSS 調整，不影響
  邏輯測試）。實際視覺效果——選單是否真的貼在最上方、是否還會蓋住任何
  內容——**需要使用者部署後親自檢查**，這個沙箱沒有辦法跑起完整前端來看
  實際畫面。
- 版本：`VERSION` 由 1.2.6 升到 **1.2.7**，`node scripts/version.mjs` 已
  同步所有版本檔案，`DEVELOPMENT_LOG.md` 已新增 1.2.7 條目，固定決策 17
  同步更新。
- 純前端變更，不需要重新部署 Cloud Functions；只需要 GitHub Desktop push
  讓 GitHub Pages 重新發布即可生效（1.2.5 的 Functions 部署待辦依然沒變，
  還是要記得跑）。

## Claude 接手狀態（2026-09-15，第六輪：修正夜間色系按鍵對比，1.2.8）

- 起因：使用者截圖回報夜間色系下測驗選項按鍵看不清楚，要求改善配色。
- 根因（`src/style.css`）：`.options button` 原本被歸在
  `:root[data-theme='night'] :is(.workspace,.student-nav,...,.options
  button,...)` 這條夜間覆寫規則裡，跟整頁區塊共用 `background-color:
  var(--page)`——結果選項按鈕背景跟頁面背景幾乎同色，只剩一條細邊框看得
  出是按鈕。而且這條規則的 CSS 優先順序比 `.options button.chosen` 原本的
  淺藍底（`#ecf6fe`）更高，導致「已選擇但還沒揭曉」的狀態在夜間模式下
  背景直接被蓋回跟頁面同色，選了幾乎看不出來。另外 `.options button b`
  （選項字母徽章）沒有指定文字顏色，夜間模式下徽章背景維持淺色、文字卻
  跟著父層變淺色，字母幾乎看不見。
- 修正：
  - 把 `.options button` 從那條共用的夜間整頁背景規則中移除，改成獨立一條
    `:root[data-theme='night'] .options button { background-color:
    var(--surface); border-color: var(--line); }`（跟其他按鈕一致，比頁面
    背景亮一階，看得出是可點擊的按鈕）。
  - 新增 `:root[data-theme='night'] .options button.chosen` 夜間專屬底色
    `#24425c`＋框線 `var(--blue)`，選了但還沒交卷時清楚看得出來。
  - `.options button b` 補上固定 `color: #304957`（不分色系），讓徽章文字
    在任何色系底下都看得清楚。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純 CSS 調整）。**這個沙箱
  沒辦法實際跑起前端看畫面**，對比度是否足夠、選項按鍵是否真的看得清楚，
  需要使用者部署後在夜間色系下親自確認截圖。
- 版本：`VERSION` 由 1.2.7 升到 **1.2.8**，`node scripts/version.mjs` 已
  同步所有版本檔案，`DEVELOPMENT_LOG.md` 已新增 1.2.8 條目。
- 純前端變更（只動 `src/style.css`），不需要重新部署 Cloud Functions；
  只需要 GitHub Desktop push 讓 GitHub Pages 重新發布即可生效（1.2.5 的
  Functions 部署待辦依然沒變，還是要記得跑）。

## Claude 接手狀態（2026-09-15，第七輪：登入新增「切換 Google 帳號」，1.2.9）

- 起因：使用者反映登入時找不到地方切換 Google 帳號。
- 根因：`login()`（`src/service.ts`）呼叫 `signInWithPopup` 沒帶
  `prompt` 參數，加上 Firebase Auth 預設把登入狀態記在瀏覽器
  （`App.tsx` 的 `watchAuth`/`onAuthStateChanged`），已登入過的瀏覽器
  下次打開網站會直接跳過登入頁；回到登入頁重新點按鈕，Google 彈窗也可能
  因為瀏覽器已有有效登入狀態而悄悄沿用同一帳號，不會跳出選擇畫面。
- 修正（規畫已用 `AskUserQuestion` 跟使用者確認要「強制彈窗選帳號」＋
  「已登入畫面加切換帳號按鈕」兩者都做）：
  - `src/service.ts`：`login()` 改成
    `provider.setCustomParameters({ prompt: 'select_account' })` 再
    `signInWithPopup`；新增 `switchAccount()`（`signOut` 後立刻呼叫
    `login()`）。
  - `src/App.tsx`：import 加 `switchAccount`；新增 `doSwitchAccount()`
    （沿用既有 `error`/`loading` state，失敗訊息會顯示在切回的登入頁）。
    學生端 `student-nav`「登出」按鈕旁新增文字按鈕「切換帳號」
    （`RefreshCw` 圖示，已有 import）；教師端側欄「登出」圖示按鈕旁新增
    同樣邏輯的圖示按鈕（`aria-label="切換帳號"`），`api.preview`（教師
    預覽模式）時不顯示。登入頁按鈕下方補一行提示文字，說明登入時會列出
    瀏覽器裡的 Google 帳號。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純前端 UI／OAuth 參數調整，
  不影響既有邏輯測試）。**這個沙箱沒有真的 Firebase 專案、也無法開真實
  瀏覽器跑 Google OAuth 彈窗**，彈窗是否真的列出帳號清單、切換帳號是否
  真的能換成別的身份登入，需要使用者部署後在瀏覽器裡登入多個 Google
  帳號的情況下親自測試確認。
- 版本：`VERSION` 由 1.2.8 升到 **1.2.9**，`node scripts/version.mjs` 已
  同步所有版本檔案，`DEVELOPMENT_LOG.md` 已新增 1.2.9 條目。
- 純前端變更（`src/service.ts`、`src/App.tsx`），不需要重新部署 Cloud
  Functions；只需要 GitHub Desktop push 讓 GitHub Pages 重新發布即可
  生效（1.2.5 的 Functions 部署待辦依然沒變，還是要記得跑）。
- 順帶一提（不在這次改動範圍內，僅供參考）：登入頁 388 行附近的說明文字
  還寫著「@ctcn.edu.tw · 需列入課程名冊」，跟 1.2.5 拿掉信箱網域限制的
  決定不完全一致（現在其實接受任何格式正確的信箱，重點是要在課程名冊
  裡）；這次沒有主動改這行文案，因為不確定使用者是否還想保留這句話當作
  「主要對象」的提示，如果覺得容易造成誤會，之後可以再請 Claude 調整。

## Claude 接手狀態（2026-09-15，第八輪：測驗選項拿掉 A/B/C/D 字母徽章，1.3.0）

- 起因：使用者直接要求「選項ABCD請拿掉」，判斷是指測驗選項按鈕上的
  A/B/C/D 字母徽章（`.options button b`，1.2.8 才剛修過夜間對比色）。
- 修正：
  - `src/Student.tsx`：選項清單只有這一處會渲染字母徽章（全檔案搜尋
    `fromCharCode` 只有一筆），移除
    `<b>{String.fromCharCode(65 + j)}</b>`，只剩 `{o.text}`。這個元件是
    quiz（完整測驗／抽題練習）、閃卡、複習、教師預覽共用的同一份，改一
    處就套用到所有畫面。
  - `src/style.css`：同步移除已經沒有元素可套用的 `.options button b`
    樣式規則（原本定義徽章的底色、文字色、圓角與置中），避免留下死
    CSS。`.options button` 本身的 `padding`／`gap` 等排版不受影響，拿掉
    徽章後按鈕只是少一個子元素。
  - 選項的**洗牌順序**邏輯（固定決策 12，`shared/model.ts`）沒有改動，
    只是不再顯示 A/B/C/D 這個視覺標籤，跟洗牌是兩回事。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純前端顯示調整，不影響
  既有邏輯測試）。實際畫面需要使用者部署後親自確認選項按鈕不再顯示
  字母、版面沒有跑掉。
- 版本：`VERSION` 由 1.2.9 升到 **1.3.0**（拿掉一個一直存在的 UI 元素，
  依慣例升次要版號而非修訂號），`node scripts/version.mjs` 已同步所有
  版本檔案，`DEVELOPMENT_LOG.md` 已新增 1.3.0 條目。
- 純前端變更（`src/Student.tsx`、`src/style.css`），不需要重新部署 Cloud
  Functions；只需要 GitHub Desktop push 讓 GitHub Pages 重新發布即可
  生效（1.2.5 的 Functions 部署待辦依然沒變，還是要記得跑）。

## Claude 接手狀態（2026-09-16，第九輪：課程簡介圖卡拆分探索節點，1.3.8）

- 起因：使用者填「課程簡介」活動的教師後台表單時問「探索節點總數」「闖關題目
  總數」怎麼填。我一開始用 `WebFetch` 抓正式網址，誤判這份教材完全沒有接上
  平台的學習追蹤協定，因而建議把「教材紀錄方式」改回「一般閱讀」——**這個
  判斷後來證實是錯的**，`WebFetch` 抓到的可能是舊快取或部署還沒跑完。直接
  查本機檔案才發現 `public/materials/course-orientation-v1/index.html` 早就
  引用共用的 `public/materials/course-learning.js`，10 題測驗每題都會呼叫
  `CourseLearning.answer(q.id, isCorrect)`、10 題全對時呼叫
  `CourseLearning.complete()`——這部分本來就是對的，不需要改回「一般閱讀」。
- 唯一真正的落差：探索節點只有 1 個「整頁」節點（點「開始課程理解驗收」時
  才送一次 `explore('course-orientation-overview')`），比另外兩份教材
  （`hemostasis-mechanisms-v1`、`blood-gas-transport-v1`，都拆成 6 個節點＋
  `nodeTime` 停留秒數）明顯簡略。已用 `AskUserQuestion` 跟使用者確認範圍只做
  課程簡介這一份（不動 `blood-composition-v1`／`blood-pre-v1`／
  `blood-post-v1`），節點偵測方式用捲動偵測（不是改成點選式概念圖）。
- 修正（`public/materials/course-orientation-v1/index.html`）：
  - 依版面實際的 8 個內容區塊，各自加上 `data-node-id`：
    `course-orientation-highlights`（這學期要學會什麼）、`-stages`（四階段
    考試）、`-timeline`（學期重要節點）、`-grading`（總成績比例）、
    `-visit`（大體參訪時程）、`-rules`（課堂與數位學習規範）、
    `-online-quiz`（數位學習網線上小考）、`-failing-rule`（不及格判定）。
    成績比例與參訪時程原本同在一個 `<section class="grid">` 裡的兩個
    `<article class="panel">`，改成各自標記才能分開偵測。
  - 新增一段獨立的 `<script>`（`course-learning.js` 引用之後、原本測驗
    `<script>` 之前）：建立 `IntersectionObserver`（threshold 0.4）觀察 8 個
    節點，第一次進入畫面呼叫一次 `CourseLearning.explore(nodeId)`（用
    `Set` 防止捲動來回重複呼叫），並用進出邊界累計每個節點的可見秒數，
    離開或 `visibilitychange` 隱藏時呼叫 `CourseLearning.nodeTime(nodeId,
    seconds)`（秒數上限由 `course-learning.js` 內部處理，呼叫端不用另外
    clamp）。
  - 移除原本掛在「開始課程理解驗收」按鈕 click handler 上的
    `explore('course-orientation-overview')` 整頁節點呼叫。
  - 沒有改 `course-learning.js`、`shared/learning.ts` 或測驗作答／完成的
    邏輯。**附帶確認**：先前懷疑的 `node_time` 事件型別（`validEvent()`
    不認得 `'node_time'`）其實已經在 1.3.6（`shared/learning.ts` 新增
    `nodeSeconds` 欄位那次）修掉了，目前 `validEvent()`／`reduceLearning()`
    都已支援 `node_time`，不是本輪要處理的問題，這裡只是記錄一下這個先前
    在探索過程中懷疑、後來發現已經修好的疑點，避免下一個 agent 重複懷疑。
- 連帶更新：
  - `public/materials/README.md`：`course-orientation-v1` 那一列的驗收設定
    改成「8 個學習節點；10 題；10 題全對才送出完成」，跟另外兩份教材的寫法
    一致。
  - `tests/material.test.ts`：既有「課程介紹圖卡以十題全對作為教材完成
    條件」測試新增 4 條斷言（8 個 `data-node-id`、`IntersectionObserver`、
    `CourseLearning.explore?.(nodeId)`、`CourseLearning.nodeTime?.(nodeId,
    seconds)`），確認新版節點拆分邏輯有留在檔案裡。
- 驗證：`npx tsc -b` 無錯誤。**本機這個 device shell（Linux VM）的
  `node_modules/esbuild` 是替 darwin-arm64（macOS）裝的，跟這個 VM 的
  linux-arm64 不符，`npm test`／`npm run build` 在這裡會直接因為 esbuild
  原生執行檔架構不符而中止**（`tsx --test` 底層用 esbuild）——這不是這次
  改動造成的，是這個殼層本身的既有環境問題。因為沒辦法在這裡完整跑
  `npm test`，改用 Python 把 `tests/material.test.ts` 這次新增的每一條
  斷言直接對 `course-orientation-v1/index.html` 的實際內容跑一次 regex，
  全部符合預期；`grep` 過其他測試檔沒有引用 `course-orientation` 相關內容
  會被這次改動影響。**麻煩使用者之後有機會在自己的 Mac 終端機（node_modules
  架構正確）跑一次 `npm test`／`npm run check` 做最終確認**，理論上應該會
  過，但這次沒能在這個沙箱裡親自驗證完整測試套件。
- 教師後台表單要手動調整（不是程式碼異動，使用者自己在後台操作）：
  「探索節點總數」1 → 8、「闖關題目總數」0 → 10（原本就填錯，跟實際 10 題
  不符）。改完兩個欄位記得先「保存草稿」再「發布課程」。
- 這次只改前端靜態教材檔案（`public/materials/` 底下）與測試／文件，沒有動
  `functions/`、`src/`、`shared/`，不需要重新部署 Cloud Functions；只需要
  GitHub Desktop push 讓 GitHub Pages 重新發布即可生效（1.2.5 的 Functions
  部署待辦依然沒變，還是要記得跑）。
- 版本：`VERSION` 由 1.3.7 升到 **1.3.8**，`node scripts/version.mjs` 已
  同步所有版本檔案（`package.json`／`functions/package.json`／鎖檔／
  `shared/version.ts`／`apps-script/version.gs`／`public/version.json`／
  README／DEVELOPMENT_LOG／handoff 的「目前版本」字樣），`node
  scripts/version.mjs --check` 已確認一致。

## Claude 接手狀態（2026-09-16，第十輪：教材匯入自動化，1.3.9）

- 起因：使用者說「想建立一個腳本，或是有其它的方案，自動化把已經建好的資訊圖表
  匯入」。先用 `AskUserQuestion` 釐清：(1) 要自動化「檔案端整合」跟「教師後台活動
  設定」兩段；(2) 原本猜 `blood-composition-v1`／`blood-pre-v1`／`blood-post-v1`
  是還沒接好追蹤的候選——**查證後發現這個猜測是錯的**，這三份其實都已經完整接上
  `course-learning.js`（用 `const CL = window.CourseLearning` 別名寫法），
  `html/` 資料夾的 4 份草稿也都已經有對應正式版本，目前真的沒有已建好但還沒匯入
  的圖卡。確認方向：先建可重用工具，以後有新圖卡直接套用；並順便補上
  `blood-pre-v1`／`blood-post-v1` 原本完全沒有的靜態測試。
- 新增 `shared/materials.ts`：`MATERIAL_CATALOG` 常數，每筆教材記 `label`／
  `tracking`／`nodeTotal`／`questionTotal`／選填的 `note`（完成規則說明，不是每份
  教材都適用「X 題全對才完成」，例如止血機制／血液氣體運送／血液的組成這三份是
  「先備知識題（解鎖用）＋限時連勝題（通關用）」兩層，通關只看連勝那幾題全對，跟
  `questionTotal`（診斷分母）不是同一件事，這種情況刻意不加 note，避免文件講錯）。
  `public/materials/README.md`、`src/App.tsx` 教師後台表單都改成從這裡讀。
- 新增 `scripts/materials.mjs`（`npm run materials:audit`／`npm run materials:sync`，
  用 Node 的 `--experimental-strip-types` 直接 `import` `shared/materials.ts`，不是
  逐行規則解析）：
  - `audit`：掃每份教材的 `index.html`，檢查有沒有接 `course-learning.js`、有沒有
    呼叫 `.complete()`；節點數偵測分三層（`data-node-id` 屬性 → `data-node` 屬性
    → 字面 `.explore('固定字串')` 呼叫），偵測不到就老實印「無法自動偵測」，不會
    亂猜；題目數用比較寬鬆但目前 6 份教材都準的規則（抓 `id: '...'` 裡結尾像
    `...q12` 的相異字串）。
  - `sync-catalog`：依 `shared/materials.ts` 重新產生 README 的「正式教材版本」
    表格，並印出跟 `audit` 偵測結果不一致的地方（只提醒，不會自動覆寫
    `shared/materials.ts`，避免誤判蓋掉人工核對過的正確數字）。
  - 實際跑過一次，6 份教材全部核對一致，過程中順便發現並修正
    `blood-composition-v1` 的題目總數其實是 **11**（先備知識 6 題＋病例限時連勝
    5 題，兩層都會呼叫 `CL.answer()`），不是原本以為的 5（README 先前完全沒填
    實際數字，寫「既有正式版本」，這不算修正錯誤，是第一次補上正確數字）。
  - `blood-pre-v1`（22 節點／10 題）、`blood-post-v1`（43 節點／15 題）這兩份的
    節點數，`audit` 值測不到（節點 id 是用變數或陣列迴圈組出來的，不是固定屬性），
    是人工讀程式碼核對出來的，`shared/materials.ts` 對應條目的註解裡寫了怎麼算的
    （`blood-pre-v1` 用教材自己內部的 `TOTAL = CARDS.length + TREE.length +
    SEQS.length + 1` 常數互相對照；`blood-post-v1` 沒有這種內部常數，是用
    Python 腳本精準數過 `N` 物件的 32 個 key、`FLOWS`／`PAIRS` 陣列筆數）。
- `public/materials/course-learning.js` 新增 `CourseLearning.trackScrollNodes
  (selector = '[data-node-id]', threshold = 0.4)`：把上一輪（1.3.8）幫
  `course-orientation-v1` 寫的那段 `IntersectionObserver` 邏輯抽成共用方法，
  以後長條捲動型的新教材只要加 `data-node-id` 屬性、呼叫一行
  `CourseLearning.trackScrollNodes()`，不用再自己刻一次觀察器。
  `course-orientation-v1/index.html` 已經改成呼叫這個共用方法（行為不變，純粹
  去重複），`tests/material.test.ts` 對應斷言也跟著改成檢查這個呼叫，並新增一則
  驗證 `trackScrollNodes` 本身邏輯的測試。點選式概念圖教材（止血機制、血液氣體
  運送）跟卡片展開型教材（血液的組成、血液前後測）的現有寫法都沒有動到，它們的
  `explore`／`answer`／`nodeTime` 呼叫綁在點擊／展開事件上，不是捲動，用不到也
  不需要這個新方法。
- 教師後台（`src/App.tsx`）：「教材版本」欄位從自由文字 `<input>` 改成
  `<select>`，選項來自 `MATERIAL_CATALOG`（顯示「說明（slug）」），選定後一次
  透過 `patchActivity` 帶入 `materialVersion`／`tracking`／`nodeTotal`／
  `questionTotal` 四個欄位；下面「探索節點總數」「闖關題目總數」數字輸入框保留、
  仍可手動覆寫（不鎖死教師想調整分母的彈性），只是預設值不再是容易忘記填或打錯
  的 0；目錄裡沒有的教材保留「其他／自訂教材版本」選項，切回原本的自由文字輸入。
- `tests/material.test.ts` 新增兩則涵蓋（`blood-pre-v1`、`blood-post-v1` 原本
  完全沒有靜態測試，跟其他 4 份教材不一致，這次補齊），並修正
  `blood-pre-v1` 那則一開始寫錯的正規表示式（`CARDS` 陣列跟 `QUIZ` 陣列的物件都有
  `q:` 欄位，一開始沒切開陣列範圍直接對整份檔案數，會把兩邊混在一起數成 22 筆；
  改成先用 `var CARDS`／`var TREE`／`var SEQS`／`var QUIZ` 這幾個標記切出各自的
  文字範圍再數，驗證後正確）。
- 驗證：`npx tsc -b` 全程無錯誤（跑了好幾次，每個階段改完都跑一次）；
  `npm run materials:audit`／`npm run materials:sync` 實際執行過，輸出符合預期、
  README 表格重新產生後跟人工核對的數字一致。**這個沙箱一樣因為 esbuild 架構不符
  沒辦法跑 `npm test`**（既有環境限制，見上一輪說明），這次額外寫了一段 Python
  腳本，把 `tests/material.test.ts` 新增／修改的每一條斷言直接對實際 HTML／JS
  檔案內容跑一次，全部通過，包含發現並修正 `blood-pre-v1` 那則測試一開始寫錯的
  地方。**麻煩使用者之後有機會在自己電腦跑一次 `npm test`／`npm run check` 做
  最終確認**，理論上應該全過。
- 這次全部是前端靜態檔案／腳本／文件變更（`public/materials/`、`shared/`、
  `scripts/`、`src/App.tsx`、`tests/`），沒有動 `functions/`，不需要重新部署
  Cloud Functions；只需要 GitHub Desktop push 讓 GitHub Pages 重新發布即可生效
  （1.2.5 的 Functions 部署待辦依然沒變，還是要記得跑）。
- 版本：`VERSION` 由 1.3.8 升到 **1.3.9**，`node scripts/version.mjs` 已同步所有
  版本檔案，`node scripts/version.mjs --check` 已確認一致。

## 下一步需要的外部輸入（教師／使用者要做的事，不是程式問題）

- **實測確認（1.2.6～1.3.0，前端，不需要重新部署 Functions）**：等這次
  改動 push 到 GitHub、GitHub Pages 重新發布後，麻煩確認七件事：(1) 完整
  測驗作答中選了答案後不會立刻看到正解或解析、可以在交卷前改答案，交卷
  後才看得到；(2) 傳統解析預設是收合的，要點「傳統解析」那一行才展開，
  引導式解析仍然是直接展開；(3)「字級」下拉選單切換小／預設／大／特大
  時，畫面文字大小真的有跟著變化；(4)「色系」「字級」選單現在應該貼在
  頁面最上方（不是右下角浮動），捲動頁面時選單會貼齊頂端、不會再蓋住任何
  文字內容；(5) 切到「夜間」色系時，測驗選項按鍵、已選擇的選項狀態都看得
  清楚，不會跟背景糊在一起；(6) 登入頁點「使用 Google 帳號登入」會跳出
  帳號選擇畫面（瀏覽器裡登入多個 Google 帳號的情況下），已登入時學生端／
  教師端都能看到「切換帳號」，點了會先登出再馬上跳出帳號選擇彈窗，選別的
  帳號能正確切換身份登入；(7) 測驗選項按鈕上原本的 A/B/C/D 字母徽章已經
  拿掉，只顯示選項文字，按鈕版面看起來正常、沒有跑版。有任何一項跟預期
  不同麻煩截圖回報。
- **實測確認（1.3.8，課程簡介圖卡探索節點，前端，不需要重新部署
  Functions）**：先在教師後台把「課程簡介」活動的「探索節點總數」改成 8、
  「闖關題目總數」改成 10，保存草稿並發布課程；等這次改動 push 到
  GitHub、GitHub Pages 重新發布後，用學生帳號打開「課程簡介」這個活動，
  實際從頭捲到尾捲過全部 8 個區塊（學習重點、四階段考試、學期節點、總
  成績比例、大體參訪時程、課堂規範、線上小考、不及格判定），再到教師
  後台「教材診斷」頁確認：(1) 該學生的探索節點數有隨著捲動逐步累積到
  8（不是一次跳到 8）；(2) 完成 10 題測驗後通關狀態顯示正常，跟拆節點前
  一樣。另外請找機會在正確架構的終端機（例如使用者自己的 Mac）跑一次
  `npm test`／`npm run check`，因為這次沒辦法在雲端沙箱裡完整跑過測試
  套件（見上方第九輪說明），麻煩確認 28 項以上測試全過。
- **實測確認（1.3.9，教材匯入自動化，前端，不需要重新部署 Functions）**：等
  這次改動 push 到 GitHub、GitHub Pages 重新發布後，麻煩到教師後台任一課程的
  「學習活動」編輯畫面，把某個 HTML 活動的「教材版本」下拉選單切換看看，確認：
  (1) 選單裡列得出目前 6 份教材（課程簡介、止血機制、血液氣體運送、血液的組成、
  血液前測、血液後測）；(2) 選定後「探索節點總數」「闖關題目總數」有正確自動帶出
  （例如選課程簡介應該變成 8／10）；(3) 這兩個數字欄位選完之後仍然可以手動改；
  (4) 選「其他／自訂教材版本」時會出現文字輸入框，可以打自訂字串。另外如果之後
  想幫其他教材（例如 `blood-composition-v1` 之外的其他血液單元教材）核對節點與
  題目數，可以請下一位 agent 跑 `npm run materials:audit` 看報告，不用再手動
  `grep` 逐份檢查。
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
