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

目前版本：`main` 分支仍是 **1.1.2**；**1.2.0 已完成實作，在
`feature/1.2.0-bank-import` 分支，尚未合併進 main、尚未部署**（見下方「Git 與
部署現況」）。

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
14.（1.2.0）`Explanations` 元件依 `audience` 區分學生／教師視角：學生只看得到①②③④，⑤追溯原子卡與「傳統解析」（解析欄）只有教師題目預覽（`audience="teacher"`）看得到全部且不收合；學生端「傳統解析」放最後、預設收合需點開。

## 1.2.0：題庫接軌（現況：已實作，未合併、未部署）

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
- `tests/core.test.ts`、`tests/platform.test.ts`：對應更新，25/25 通過（雲端
  沙箱重新 `npm ci` 驗證；device_bash 那台機器的 `npm test` 會因 esbuild
  darwin/linux 平台不符報錯，是環境問題，跟改動內容無關，不用理它）
- 兩個新工具（不是平台程式碼本身，是給教師手動操作用的）：
  - `apps-script/FillCourseAndUnit.gs`：綁在教師正式 Google Sheet 上跑的
    一次性工具，補齊空白的「課程代碼」欄與「單元」欄（依同一次單元已填的
    值自動帶入）
  - `scripts/deploy.sh`：一鍵上線腳本（本機測試→push→合併main→部署
    Functions），見下方「Git 與部署現況」

**還沒做的：**

- 教師端單元編輯畫面（`src/App.tsx`）還沒依 `Unit.group` 做視覺分組（學生端
  已做，教師端刻意先跳過，風險考量：`App.tsx` 檔案很大）
- 同考點抽題去重、題目作廢並重算分數——刻意排除在 1.2.0 之外，見建議書第
  5.4、5.5 節

## Git 與部署現況（2026-09-14）

- `feature/1.2.0-bank-import`：本機分支，領先 `main` 5 個 commit（3 個
  1.2.0 功能 commit ＋ 2 個工具 commit），**尚未 push 到 GitHub**（origin 上
  還看不到這個分支）
- 本機 `main` 領先 `origin/main` 1 個 commit（`1.1.2：新增測試學生帳號白名單`），
  這個是更早以前就沒推的，跟本次 1.2.0 工作無關，一併記錄避免被誤會
- 部署機制：push 到 `main` 會觸發 `.github/workflows/pages.yml` 自動重建並
  上線前端網站；後端 Firebase Cloud Functions **不會自動部署**，要手動
  `npx firebase-tools deploy --only functions`
- 這台電腦的 Firebase CLI **尚未登入**（`npx firebase-tools login:list` 顯示
  無帳號），要先手動跑過一次 `npx firebase-tools login` 才能部署 Functions
- `scripts/deploy.sh` 可以一次跑完「push → 合併進 main → 部署 Functions」，
  用法見腳本內註解；執行前會有一道確認提示，任一步失敗會停止，避免誤觸

## 下一步需要的外部輸入（教師／使用者要做的事，不是程式問題）

- 決定要不要現在跑 `scripts/deploy.sh` 上線 1.2.0（目前完全還沒推送，安全，
  隨時可以先看過再決定）
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
