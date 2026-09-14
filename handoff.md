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

目前版本：1.2.0（`feature/1.2.0-bank-import` 已上傳 GitHub；`main` 仍為 1.1.2）。
後端 Functions 已部署，待將分支合併進 `main` 觸發前端發布。

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
14.（1.2.0）`Explanations` 元件依 `audience` 區分學生／教師視角：學生看①～④與最後預設收合的「傳統解析」，不顯示⑤追溯原子卡；教師可看①～⑤，傳統解析直接展開。現行程式的蘇格拉底式各段仍為 details 收合，尚未實作教師各段全部展開。

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

## Git 與部署現況（2026-09-14）

- `feature/1.2.0-bank-import`：已透過 GitHub Desktop 發布到 GitHub；本機最新 HEAD 為 `fa660a8`，尚未合併到 `main`。
- 本機 `main` 領先 `origin/main` 1 個 commit（`1.1.2：新增測試學生帳號白名單`），
  這個是更早以前就沒推的，跟本次 1.2.0 工作無關，一併記錄避免被誤會
- 部署機制：push 到 `main` 會觸發 `.github/workflows/pages.yml` 自動重建並
  上線前端網站；後端 Firebase Cloud Functions **不會自動部署**，要手動
  `npx firebase-tools deploy --only functions`
- Firebase CLI 可存取 `ap2-7ed91`。2026-09-14 已直接部署 Functions：原始碼上傳成功，29 個 Node.js 22 函式均已更新到 `asia-east1`，並以 `functions:list` 唯讀確認。GitHub HTTPS 的命令列寫入憑證仍缺失，但 GitHub Desktop 可正常發布分支。
- `scripts/deploy.sh` 已修正為先預檢、測試與分支備份，再部署 Functions，最後快轉推送遠端 main。由於命令列 GitHub 憑證阻塞，本次採 GitHub Desktop 發布分支、CLI 部署 Functions 的等價順序；待以 Desktop 合併分支並推送 main，Pages 才會開始發布。

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

## 下一步需要的外部輸入（教師／使用者要做的事，不是程式問題）

- 使用者已授權正式部署；後端已完成。下一步用 GitHub Desktop 對 `feature/1.2.0-bank-import` 建立 Pull Request 並合併到 `main`，再確認 GitHub Actions 的 Pages 發布成功。
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
