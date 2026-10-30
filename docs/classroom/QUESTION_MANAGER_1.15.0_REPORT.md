# 題目管理完整版 1.15.0（#39）

## 給 Claude 的摘要
- 起點：2026-10-30 fetch 的 `origin/main=45b9e266`（含 #40 1.14.0）；獨立 `.worktrees/question-manager-v2`／`feature/question-manager-v2`，根目錄未切分支。
- 重新套用核可樣張 `c1009043`；正式入口、實際分頁、投影片縮圖、差異確認、單題增修刪與輪數警告完成。
- 核心：`src/QuestionManager*.tsx`、`shared/questionManager.ts`、`functions/src/classroom.ts`；教師限定 transaction，同題舊快照拒絕，其他題／legacy／已公佈快照保留。
- xlsx：`shared/questionWorkbook.ts`、`src/questionWorkbook.ts`、#38 `PptImportModal`／`pptImportFiles`／`shared/pptImport.ts`；真正檔案與正式視窗及後端 questionRows 往返一致。
- 工作樹完整 check：270＋99 PASS，0 fail／0 skipped；最後專項 7 PASS、UI 9 PASS、真實 Firestore Emulator 11 PASS。
- 乾淨 clone：271＋99 PASS，0 fail／0 skipped；最終實作完整通過。
- 無新增依賴，無正式資料讀寫、push、部署；reviewed 卡與教材內容未動。
- 偏離：依 10/30 追加改用 v2 分支與 1.15.0；原樣張報告保留，完整版另寫本檔。舊版無 PDF 頁碼群組支援編輯，xlsx 僅下載有對應簡報的題目。
- 抽查最多五項：交易及權限、兩分頁衝突、xlsx→#38、輪數／舊快照、1920 縮圖與差異截圖。

## 版本與範圍

實作提交：`7dab81e5`（`feat: complete classroom question manager 1.15.0 [Codex]`）。
原樣張分支 `feature/question-manager`／`c1009043` 未修改。已確認 main 仍為 `45b9e266a5651e3d9169bc1dc097fcffea901d76`，為本分支祖先，可快轉整合。根目錄 `feature/respiratory-infographics` 未切換。
工作樹只做 VERSION 必要的文件版本行同步；根目錄 handoff 與其他人檔案不變。#41 的 1.14.1 若先上線，部署前須整合其 commit，保留較新的 1.15.0，重跑檢查。

## 完成行為

1. 授課控制台的「題目管理」是真正入口，與「簡報播放／學生學習進度／前測／後測（依課程功能）／學生完成度」使用同一排控制按鈕。沒有樣張導航或無效分頁。
2. 依簡報選擇題目；左列頁碼、標題、題型、輪數；右側用 `getTeachingDeck` 的 HTML／圖片在 sandbox iframe 顯示縮圖，沿用播放器 CSP。沒有對應投影片的題目歸「其他／舊版」並明示無投影片。
3. 支援單選、排序、固定 ○ 對／✕ 錯；增刪／調序選項、欄位、題目。新增可指定空白頁。儲存及刪除都要核對舊→新差異，儲存中鎖定表單；失敗保留草稿。
4. COUNT 聚合取得每一 slideId 的既有輪數，包括新增頁若仍有舊作答輪次。顯示「已有 N 輪作答」及指定警告；不修改舊 round 或 reveal 快照。
5. 衝突時顯示 CONFLICT 與重新載入入口；不自動覆蓋他人修改。換簡報／換題會確認是否捨棄草稿。

## 儲存、隔離與驗證

- `updateClassroomQuestions` 先走既有 `access(..., true)` 與課程 `classroomInteraction` 功能權限；學生、其他教師、未登入均不能利用新增入口取得／修改答案。
- 請求帶 `slideId`、`expected={interaction,keys}`、`next={interaction,keys}`；新增的 expected.interaction 為 null，刪除的 next.interaction 為 null。
- Firestore transaction 同時讀 interactions／answerKeys，針對目標的內容快照做 canonical 比較；同一題併發只一個成功，另一個 `aborted`。其他題改動不會造成不必要的整份覆蓋或衝突。
- `validateInteractions`、`validateAnswerKeys` 驗證後才寫；拒絕正解不在選項、排序不是完整排列、局部改壞固定是非選項、非目標 ID、undefined。答案使用 validator 正規化結果，回傳儲存快照供下一次編輯。
- 只替換／刪除目標 Interaction／答案鍵，保留其他題、順序、legacy、其他簡報與 config metadata。沒有 round、成績、progress、passedAt、researchEvents 寫入。
- `getClassroomConfig` 的 `includeQuestionManager` 僅在原教師權限下提供原始答案快照及輪數；其他教師設定／學生讀取路徑維持原行為。
- Firestore rules 全域 client deny 維持原樣；Emulator 同時測未登入及帶學生身分 JWT 的 REST 讀 answerKeys 均 403。

## xlsx 匯出→#38 匯入

無新增套件：小型 ZIP／CRC32／inline-string XML 寫檔，沿用既有 ZIP/XML 讀取器。文字為 inline string，不產生公式。
前 11 欄保留 #38 格式；完整版附題目標題、fieldId、slideId、超過六選項時的完整選項／答案 JSON、解析欄存在旗標，保留同頁多欄與獨立題目標題。

- 2–6 選項沿用 A–F 與答案欄；是非維持固定選項。超過六選項的舊題需保留右側完整 JSON 欄，建議直接在題目管理編輯。
- 同頁多欄可多列，fieldId 必須唯一、標題一致；slideId 必須與相同簡報代碼＋頁碼吻合，防止匯入至錯誤簡報。
- 舊 #38 11 欄範本不變；完整版由 `managedCells` 傳給相同 `parseQuestionTableRows`，前後端共用驗證。
- 測試涵蓋 choice／order／是非、多欄、20 選項、特殊字、換行、空或省略解析、標題和答案鍵。
- 除直接解析下載 bytes，UI 還實際下載→正式 #38 匯入視窗→PDF／xlsx→預覽→確認提交；Emulator 再走真正 `saveTeachingDeck` dryRun／保存，完整比較標題、欄位、答案、解析、legacy、其他簡報及舊 reveal。

教師操作：授課控制台→題目管理→選簡報／頁面→編輯→檢視差異→確認儲存；備份按「下載題目表 .xlsx」。重新匯入時在簡報播放→匯入投影片＋題目表→選同份 PDF 與 xlsx，保留同一簡報代碼→核對預覽／差異→教師確認。
「其他／舊版」無 PDF 頁碼可直接看與改，不能把任意舊 slideId 假裝成新簡報頁碼匯入；其 xlsx 下載會清楚提示此限制。

## 驗證與證據

截圖保存至 **2026-11-06**。原始輸出、xlsx 與 PNG 全在 repo 外：
`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/question-manager-1.15.0/`。
本次開工證據清理 dry-run：0 個資料夾符合刪除條件，未刪檔。

| 驗證 | 結果 |
|---|---|
| 工作樹 `npm run check` | 270 前端／共用＋99 Functions，0 fail／0 skipped |
| 最後 `tsx --test tests/question-manager*.test.ts` | 7 PASS、0 fail／0 skipped |
| 正式 UI 假 API | 9 PASS；0 pageerror；既有 Google 字型請求被攔截，未外連 |
| 真實 Firestore Emulator | 11 PASS，demo 專案、127.0.0.1；結束後已停止 |
| 乾淨 clone `npm ci`（兩端）與 `npm run check` | 271 前端／共用＋99 Functions，0 fail／0 skipped，exit 0 |
| `version:check`／`git diff --check` | PASS，1.15.0 |

Emulator 指令（必須是 demo 專案）：
```sh
firebase emulators:exec --project demo-question-manager --only firestore "node functions/scripts/verify-question-manager-emulator.cjs"
```

UI 指令：`node scripts/question-manager-verify.mjs`；專項由 npm test 自動涵蓋。截圖位於 `ui/`：`01-overview-1920.png`、`02-editing-1920.png`、`03-diff-1920.png`（含輪數警告）、`04-downloaded-1920.png`、`05-conflict-1920.png`、`06-mobile-390.png`、`07-import-roundtrip-1920.png`。
首次完整檢查因元件 CSS import 使既有 esbuild 測試打包失敗；已移至 main 入口，保留既有測試方式，重跑全套通過。最後新增 #38 往返案例與儲存鎖定已由乾淨 clone 再完整驗證。
乾淨 clone 位於 `/private/tmp/question-manager-clean-1150`，`--no-hardlinks`、獨立 npm ci、HEAD=`7dab81e5cc74840181cb9b13a205e36f094ec56d`，結束後 git status 為空；未借用工作樹依賴或私有資料。

## 部署清單（僅供教師核可後執行，本次未執行）

先請 Claude 驗收。若 main 前進，先在本 worktree 整合並重新驗證，不在根目錄切換分支。
先部署 **三支**：新增 `updateClassroomQuestions`、更新 `getClassroomConfig`（輪數）、更新 `saveTeachingDeck`（完整版題目列）。規則、索引、Storage 皆無變更，不部署其他函式。

```sh
cd '/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/question-manager-v2'
export PATH='/Users/HHC/.nvm/versions/node/v22.23.2/bin:'"$PATH"
git branch --show-current
# 必須是 feature/question-manager-v2；工作樹須乾淨。
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
# 若前一行不是 0，停止：先整合新版 main，再跑所有檢查。
npm run check
npm --prefix functions run build
firebase deploy --project ap2-7ed91 --only functions:platform:updateClassroomQuestions,functions:platform:getClassroomConfig,functions:platform:saveTeachingDeck
git push origin feature/question-manager-v2:main
```

確認 GitHub Actions 成功，再由教師重新載入控制台，先用測試班假題驗證修改／衝突／下載再匯入，核對答案不在學生公佈前出現。沒有自動匯入資料或教材更新。
