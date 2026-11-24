# 給 Claude 的摘要
- #71 完成九點。結果顯示選項原文、三態及分開計數。可略答的測驗手動交卷前確認，逾時交卷另註。資訊圖表引導依作答結果顯示。
- 程式檔 `src/AnswerReview.tsx`、`src/Student.tsx`、`src/PracticeModes.tsx`、`src/QuestionContent.tsx`、`src/style.css`。測試檔 `tests/answer-review.test.ts`、`tests/fixtures/answer-review.tsx`、`tests/preview.test.ts`。
- 全套檢查 PASS。前端 365/365、後端 157/157、零失敗與零跳過，Vite 與 version:check PASS。全量教材 17/17、4,864 畫面、0 問題、0 skipped。學生結果／確認視窗 28/28 PASS，交接檢查 PASS。
- 基線 `origin/main@781bed78`（1.16.0）。#69 的 1.16.1 尚未合併，先保留基線版號驗證。跟進含 #69 的主線後擬排 1.16.2，再交 #70（1.17.0）。
- 偏離／待驗：本機使用合成題目與 Chromium，Ubuntu 非 root 待 Claude 重播，最終人眼確認待教師手機實點。截圖依教師規則存證。平台既有字型 CSS 的遠端請求在測試中攔截。前端設計 lint 的兩處 emoji 提示對應交辦指定的狀態符號。
- 抽查① `AnswerReview.tsx`：選項洗牌後依 ID 回顯、三態標記。② `Student.tsx`：鍵盤取消、回第一題未答、計時到仍只交一次。③ `PracticeModes.tsx`：綜合練習跨分類重複題 ID 依分類配對、閃卡未選可翻面。④ `QuestionContent.tsx`：有無講義、教師預覽、補強教材。⑤ 以 bundle 重播下列 npm 與可讀性檢查。

## 實作與盤點

- 完整測驗與複習考沿用 `Quiz`。作答卡依已交答案的 `selected` 和 `correct` 呈現。未答使用中性底與「⚪ 未作答」。統計將空選項列入未作答，來源列維持各來源答對／總題數。總分、重批、完成度與離開紀錄計算沿用原流程。
- `mode === 'quiz' && full` 有空題時，手動交卷用既有 `.modal` 外觀，原生 `dialog` 保留鍵盤焦點與 Escape 取消。回到第一題未作答會聚焦第一個選項。計時器持續。逾時可關閉確認視窗並完成一次提交。逾時標記是頁面狀態。
- 單元抽題練習仍需每題先作答才能手動交卷，選後立即鎖定，時間到可依既有行為自動交卷。閃卡由 `Flashcards` 翻面，未選也可翻，並以文字顯示未作答及正解。看完頁維持張數摘要。
- `MixedPractice.tsx` 是路由與選題入口，結果和逐題回饋由 `PracticeSession` 或 `Flashcards` 顯示。綜合練習與隔日錯題複習的結果保留分分類答對數，另按原作答順序附每題選項與解析，採伺服器回傳的答案資料。既有 `Assessments.tsx` 前／後測公布頁已依 ID 顯示選項原文及未作答，公布資料未帶講義連結。
- 各結果卡及即時回饋將已知對錯交給 `Explanations`。有有效講義連結時，答對用鞏固句，答錯與未作答用圖解句。教師端、結果未知、無有效講義連結與補強教材沿用原顯示。

## 驗證

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

## 截圖與重播

證據資料夾 `課程平台-驗收證據/2026-11-24/answer-review-your-choice/`。**截圖保存至 2026-12-01**。

| 檔案 | 狀態 |
|---|---|
| `390-blossom-default-results.png` | 手機預設，答對／答錯／未作答三卡、引導句、逾時註明 |
| `390-night-xlarge-confirm.png` | 手機特大、夜間，未作答交卷確認及雙按鈕 |
| `1280-night-default-results.png` | 桌面夜間，答對／答錯／未作答三卡、引導句、逾時註明 |
| `1280-night-default-confirm.png` | 桌面夜間，未作答交卷確認 |
| `answer-review-your-choice.bundle` | #71 本機分支及本報告。需有基線 commit `781bed78` |

在含 `781bed789c44bd93a8f5066fd36937294515d93e` 的 repo 驗證 `git bundle verify <bundle>`，將 `refs/heads/fix/answer-review-your-choice` 取至驗收分支。依共用工作樹的 `docs/UBUNTU_REPLAY.md` 使用 Ubuntu 非 root、Node 22、Chrome。依 CI 安裝前後端依賴與 Chromium 後，執行 `READABILITY_ALL=1 npm run check` 及 `npm run version:check`。如需再產專項截圖，以 `ANSWER_REVIEW_EVIDENCE` 指定證據目錄，執行 `npx tsx --test tests/answer-review.test.ts`。

## 版本與 #70 銜接

- `fix/answer-review-your-choice` 從 `origin/main@781bed78` 開工。#69 的 1.16.1 在 `codex/unit-category-order@56eaba58`（版號合併 commit 為 `1b6ce43a`）。先等 #69 進主線，再讓 #71 跟進，設定當時下一個可用 patch（預計 **1.16.2**），跑 `npm run version:sync`、`npm run version:check` 與完整檢查後複驗。兩件都改到 `src/style.css` 與 `tests/preview.test.ts` 的不同段落，本機三方比對無衝突標記，整合時仍要核對學生結果與教師分類排序。
- #70 預定 **1.17.0**，尚未實作。#71 改既有 `Student.Quiz` 和練習頁，沒有修改 #70 規格或現有 `Assessments.tsx`。#70 從含 #71 的主線開工。公布結果後可直接用 `YourAnswerLine` 傳 `options`／`selected`，若有相容題目與伺服器判定則可用 `AnswerReviewCard`。有講義連結時用 `Explanations.outcome`。#70 的伺服器權威計時、發布時機及得分由其本身流程管理。
