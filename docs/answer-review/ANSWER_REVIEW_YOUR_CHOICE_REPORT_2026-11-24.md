# 給 Claude 的摘要
- #71 完成九點。結果顯示選項原文、三態及分開計數。可略答的測驗手動交卷前確認，逾時交卷另註。資訊圖表引導依作答結果顯示。
- 程式檔 `src/AnswerReview.tsx`、`src/Student.tsx`、`src/PracticeModes.tsx`、`src/QuestionContent.tsx`、`src/style.css`。測試檔 `tests/answer-review.test.ts`、`tests/fixtures/answer-review.tsx`、`tests/preview.test.ts`。
- 11/25 已重基準至含 #69／#70 的 `origin/main@48a112d0`，三筆原提交的 patch 均一致，衝突 0。提交 `fa7787ec` 同步 1.17.1。
- 1.17.1 的 Mac `npm run check` PASS。前端 370/370、後端 158/158，0 skipped。Vite 與版號檢查通過。全量教材 17/17、4,864 畫面、0 問題。
- Ubuntu 非 root 全套 13 步驟 PASS、1 步驟 KNOWN K1，退出 1。前端 368/370，兩筆 FAIL 為同一 K1 的子測試及父測試。補跑建置與後端 158/158，閱讀規範 17/17，0 skipped。
- #70 小考已有作答與正解文字，仍可補逐題三態及三數。只做結果頁盤點。最終人眼確認待教師手機實點。
- 請抽查 `AnswerReview.tsx` 的 ID 回顯與三態、`Student.tsx` 的交卷確認、`PracticeModes.tsx` 的跨分類 ID、`QuestionContent.tsx` 的講義引導，以及 Ubuntu summary 的 K1 歸類。

## 實作與盤點

- 完整測驗與複習考沿用 `Quiz`。作答卡依已交答案的 `selected` 和 `correct` 呈現。未答使用中性底與「⚪ 未作答」。統計將空選項列入未作答，來源列維持各來源答對／總題數。總分、重批、完成度與離開紀錄計算沿用原流程。
- `mode === 'quiz' && full` 有空題時，手動交卷用既有 `.modal` 外觀，原生 `dialog` 保留鍵盤焦點與 Escape 取消。回到第一題未作答會聚焦第一個選項。計時器持續。逾時可關閉確認視窗並完成一次提交。逾時標記是頁面狀態。
- 單元抽題練習仍需每題先作答才能手動交卷，選後立即鎖定，時間到可依既有行為自動交卷。閃卡由 `Flashcards` 翻面，未選也可翻，並以文字顯示未作答及正解。看完頁維持張數摘要。
- `MixedPractice.tsx` 是路由與選題入口，結果和逐題回饋由 `PracticeSession` 或 `Flashcards` 顯示。綜合練習與隔日錯題複習的結果保留分分類答對數，另按原作答順序附每題選項與解析，採伺服器回傳的答案資料。既有 `Assessments.tsx` 前／後測公布頁已依 ID 顯示選項原文及未作答，公布資料未帶講義連結。
- 各結果卡及即時回饋將已知對錯交給 `Explanations`。有有效講義連結時，答對用鞏固句，答錯與未作答用圖解句。教師端、結果未知、無有效講義連結與補強教材沿用原顯示。

## 11/25 重基準後驗證

證據目錄為 `課程平台-驗收證據/2026-11-25/answer-review-your-choice/`。以 lockfile 安裝前後端依賴，Node 22.23.2 與系統 Chrome 執行 `READABILITY_ALL=1 npm run check`，原始輸出 `mac-check-r1.log`，完成檔 `mac-check-r1.done` 為 0。

| 項目 | Mac 1.17.1 |
|---|---|
| 前端 | 370/370 PASS，0 fail、0 skipped |
| 後端 | 158/158 PASS，0 fail、0 skipped |
| Vite 與版號 | PASS，版本一致 1.17.1 |
| 全量閱讀規範 | 17/17、4,864 畫面、0 issues、0 staticIssues、0 errors、0 skipped，見 `mac-readability-summary.json` |

重基準分支 `git diff --check` PASS。三份測試檔自查無 macOS 或個人絕對路徑。

### Ubuntu 非 root

Colima Ubuntu 24.04.5 x86_64、UID 1001，以系統 Chrome 重播 `fa7787ec`。容器還原 tree 和原提交均為 `a47e861db200d88fe5c3e368831c729ea4fd0321`。第一輪於 11:46:53 結束。證據在 `課程平台-驗收證據/2026-11-25/ubuntu-replay-fa7787ec-1106/`，入口為 `summary.txt`。外層完成檔 `answer-review-your-choice/ubuntu-full-r1.done` 記錄退出 1。

| 步驟 | 結果 |
|---|---|
| 00–05 環境、還原、tree、依賴、系統 Chrome | 6/6 PASS |
| 06 `READABILITY_ALL=1 npm run check` | KNOWN K1。前端 368/370、0 skipped，另兩筆為同一酸鹼 `-v1` 子測試與其父測試。三個 390 N02-micro 狀態各 `clip=2`，與 `48a112d0` 基線相符 |
| 06b 補跑建置及後端 | PASS，Vite 建置完成、後端 158/158、0 skipped |
| 07 獨立閱讀規範 | PASS，17/17、4,864 畫面、0 issues、0 staticIssues、0 errors、0 skipped |
| 08–12 版號、Zuvio、平台小考模擬器及瀏覽器、工作樹 | 5/5 PASS，版本一致 1.17.1 |

#72 的修正已在其分支通過 Ubuntu 全套，#71 仍以指定的 `48a112d0` 為基準。K1 依交辦標為 KNOWN，Ubuntu 無新增失敗。衝突解決 0/2 輪，Mac `npm run check` 首次通過，Ubuntu 使用 1/2 輪。

本次 bundle 為 `課程平台-驗收證據/2026-11-25/answer-review-your-choice/answer-review-1.17.1.bundle`。以 `48a112d0` 為前置提交，包含本機 `fix/answer-review-your-choice` 與本報告。原版合成測試截圖與保存日期見下節。

## 11/24 原版驗證

| 項目 | 結果與證據 |
|---|---|
| `READABILITY_ALL=1 npm run check`，Node 22.23.2 | 退出 0。前端 365/365，後端 157/157，0 failed、0 skipped。Vite 建置 PASS，有單一 chunk 超過 900 KB 的提示。全量教材 17/17、4,864 畫面、0 skipped、0 issues、0 staticIssues、0 errors。原始輸出 `npm-check-verified.log` 與 `course-readability/summary.json`。 |
| `npm run version:check` | PASS，版本一致 1.16.0 |
| `tsx --test tests/answer-review.test.ts` | 5/5 PASS，0 failed，0 skipped。原始輸出 `answer-review-browser.log`。以 ID 順序 b、a、d、c 驗證 D 洗牌到第 3。模擬計時、鍵盤、手動交卷與伺服器批改回傳。 |
| `tsx --test tests/preview.test.ts` | 41/41 PASS，0 failed，0 skipped。原始輸出 `preview-regressions.log`。 |
| 結果頁與未答確認視窗可讀性 | 7 色系 × 390×844／1280×800 × 預設／特大，共 28 組，各組量測字級、行高、按鈕高度、對比、橫向溢出，0 問題。 |
| `git diff --check` 與路徑自查 | PASS。路徑自查無命中（exit 1）。測試支援 `CHROME_PATH`，證據目錄由環境變數傳入。 |
| `python3 scripts/check_handoff.py`（共用工作樹） | PASS。handoff 2746/4000 字，佇列 25/25 件，週誌與索引合規。#71 已標記為停-等Claude。 |

路徑自查指令為 `grep -nE '/Users/|/private/tmp|/tmp/' tests/answer-review.test.ts tests/fixtures/answer-review.tsx tests/preview.test.ts`。

### 自修清單

1. 瀏覽器測試初版用一般 HTTP 測試網域，無法呼叫 `crypto.randomUUID()`，改以 Playwright 攔截 localhost，保留安全來源並維持零正式網路請求。
2. 手機分數旁的「分」呈現 20px，低於 21px 標題文字基準，調至 21px 隨平台字級放大。
3. 夜間原有解析底色覆蓋了主題底色，對比量到 1.02:1。修正學生作答回饋與結果解析的主題底色後，專項矩陣 28/28 PASS。
4. 全量檢查發現四處既有測試仍比對舊文案、元件位置與 CSS 排序。更新 `tests/preview.test.ts` 的斷言，保留原操作，獨立重跑 41/41 PASS。

## 11/24 原版截圖與 bundle

證據資料夾 `課程平台-驗收證據/2026-11-24/answer-review-your-choice/`。**截圖保存至 2026-12-01**。

| 檔案 | 狀態 |
|---|---|
| `390-blossom-default-results.png` | 手機預設，答對／答錯／未作答三卡、引導句、逾時註明 |
| `390-night-xlarge-confirm.png` | 手機特大、夜間，未作答交卷確認及雙按鈕 |
| `1280-night-default-results.png` | 桌面夜間，答對／答錯／未作答三卡、引導句、逾時註明 |
| `1280-night-default-confirm.png` | 桌面夜間，未作答交卷確認 |
| `answer-review-your-choice.bundle` | #71 本機分支及本報告。需有基線 commit `781bed78` |

在含 `781bed789c44bd93a8f5066fd36937294515d93e` 的 repo 驗證 `git bundle verify <bundle>`，將 `refs/heads/fix/answer-review-your-choice` 取至驗收分支。依共用工作樹的 `docs/UBUNTU_REPLAY.md` 使用 Ubuntu 非 root、Node 22、Chrome。依 CI 安裝前後端依賴與 Chromium 後，執行 `READABILITY_ALL=1 npm run check` 及 `npm run version:check`。如需再產專項截圖，以 `ANSWER_REVIEW_EVIDENCE` 指定證據目錄，執行 `npx tsx --test tests/answer-review.test.ts`。

## 11/25 版號與 #70 小考結果盤點

- `git rebase 48a112d0` 一次完成，0 衝突，`git range-diff` 顯示原本三筆提交均等價。以 `npm run version:sync` 同步 13 個版號檔，`npm run version:check` 確認 1.17.1。Functions 內的差異限套件版號。
- #70 的 `PlatformQuizStudent.tsx:113–125` 已用選項 ID 回查學生作答文字，空答案顯示「未作答」，另列正解與解析。若要與 #71 完全一致，仍需在結果頁補逐題三態、所選與正解的選項標記，以及答對／答錯／未作答三數。
- `QuizStudentView.result.questions` 已帶 `selected`、`answer`、`options`，可在呈現層比對 ID 計算三態，並採用 `YourAnswerLine`。既有小考結果資料沒有資訊圖表連結欄位；可呈現原本的解析。發布、計時與得分沿用 #70 流程。本次盤點只記入報告。
