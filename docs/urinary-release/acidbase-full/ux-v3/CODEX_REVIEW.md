# 給 Claude 的摘要
- 覆核基準：Antigravity `9d35b09`，在 `.worktrees/acidbase-full`／`codex/acidbase-full` 獨立重跑，未採用作者測試數字。
- PASS：v3 SCRIPT_DIFF 145 單元、69 引句，缺漏／改字／多字均 0；158 個畫面狀態逐字檢查通過。
- PASS：跑版 632/632；教材回歸 36/36；平台 `npm run check` 前端 162、後端 61，均 0 skipped。
- 修改：過渡頁標題「準備考核」、N05 標籤貼線並隨翻轉移位、刪除六個舊 `node.micro` 資料物件；現行五個小檢核只取 v3。
- 檔案：`materials-src/apply-kit/{student.js,student-script.mjs,full*.mjs,full.js}`、`materials-src/acid-base-homeostasis/full.json`、檢查器／測試；詳下文。
- 修改前後各獨立走完六關（每關故意答錯）、五個小檢核、結尾回看、過渡與正式考核；各 41 張手機截圖、0 頁面例外、完成事件各 1 次。
- 回歸先紅 3/3，再轉綠 3/3；正式題池、選項、診斷、原句、心智圖與教師 v3 腳本均未改寫。
- 偏離：無；新交辦明確核准的「準備考核」另列介面文字來源，不改 v3 腳本、不放寬教學文字比對。
- 抽查 1：`codex-review-before/manual/transition.png` → `codex-review-after/manual/transition.png`（390×844）。
- 抽查 2：`codex-review-before/manual/N05-correct.png` → `codex-review-after/manual/N05-correct.png`（390×844）。
- 抽查 3：`codex-review-after/manual/N05-one-flipped.png`（只翻 H⁺；另一標籤與箭頭不受影響）。
- 抽查 4：本目錄 `SCRIPT_DIFF.txt` 的 145 單元與唯一核准介面標題；`tests/acidbase-v3-review.test.mjs` 的反例測試。
- 抽查 5：`codex-review-after/manual/independent-results.json` 的逐關文字／描述／完成事件；等待教師試用。

## 覆核與實作範圍

日期：2026-10-21（Asia/Taipei）。本次依 `CODEX_TASK_acidbase-v3-review-fix_2026-10-21.md` 先 A 後 B。根目錄仍在原分支，程式修改只在 `codex/acidbase-full`。保留根目錄及其他 worktree 工作；開始前本 worktree 的 14 個既有未追蹤檔案逐一做雜湊保護，測試重拍其中六張圖後已還原原始內容，未納入提交。

## A：修改前獨立覆核

| 實際執行項目 | 修改前結果 | 證據 |
|---|---|---|
| v3 SCRIPT_DIFF | PASS，145 required units、69 quoted clauses、缺漏／異文／多字 0 | `codex-review-before/SCRIPT_DIFF.{txt,json}` |
| 腳本畫面檢查 | 158/158 PASS，0 skipped | `codex-review-before/copy-stdout.txt` |
| content-check | PASS，789 次原句核對、210 displayFields、0 errors、0 skipped | `codex-review-before/content-check.json`、`content-stdout.txt` |
| 八尺寸跑版 | 632/632 PASS，0 skipped | `codex-review-before/layout/layout-results.json`、`layout-stdout.txt` |
| 既有教材測試 | 33/33 PASS，0 skipped | `codex-review-before/tests-stdout.txt` |
| 自寫 Playwright 逐關操作 | 41 張截圖、0 頁面例外、完成事件 1 次 | `codex-review-before/manual/independent-results.json` |

操作腳本 `scripts/acidbase-v3-review.mjs` 使用真正點擊，不直接設定關卡完成狀態，也不呼叫作者的完成關卡捷徑。每關先錯一次再修正；五個 v3 小檢核各開提示、答錯、修正。結尾錯答後修正，實際回看關卡並返回；完成三段追蹤後進入過渡頁與考核，五組正式題（含有第二階段者）作答至結束。讀取考核資料僅供決定測試應點哪個既有選項。

親自開圖檢視：修改前過渡頁、N05；修改後過渡頁、N05 及 N01／N03／N04／N06 錯答截圖。其餘狀態的實際 DOM 文字與各張圖的描述保存在上述 JSON。未見額外阻斷流程問題；此結論限本次 Chromium 操作與指定矩陣，不代表教師／學生試用結果。

實際確認的三個問題：

1. 過渡頁仍沿用「結尾｜一滴酸的旅程」。
2. N05 白底標籤在 390×844 高約 81–85 px，離箭頭中心線約 50–53 px；翻轉後標籤仍停原位置。
3. `full.json` 仍內嵌六個 `micro-01`～`micro-06` 舊題物件。預設學生介面已採 v3，但舊版介面與其測試還讀取這些物件，不能只刪 JSON 而留下引用。

## B：修正與回歸

### 過渡頁標題

只把過渡頁標題改為交辦指定的「準備考核」；結尾頁仍是 v3 的「結尾｜一滴酸的旅程」。`student-script.mjs` 為這唯一介面標題附交辦檔名稱、行號與 SHA256；`SCRIPT_DIFF` 列出此例外來源。145 個教學文字單元仍逐字比對教師 v3 腳本，未修改腳本文字。

檢查器只允許該標題出現在過渡頁 header/h1 的特定元素。回歸測試故意加字、再把同一文字放到 main，兩者都必須報錯，避免介面標題成為略過文字稽核的通道。

### N05 標籤與箭頭

H⁺／HCO₃⁻ 白底標籤與其箭頭同屬各自 SVG group。保持 14 px 螢幕字級、24 px 背景高度；依 SVG 實際縮放計算位置，背景下緣距箭頭筆畫上緣約 3 px。方向改變時，該標籤的水平錨點一起改變；改另一箭頭不會移動此箭頭。視窗改尺寸後重新計算，背景不覆蓋箭身或箭頭尖端。

幾何回歸測八尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390；逐一檢查起始、翻轉、成功與再次改尺寸後的貼線距離／背景尺寸／邊界。注意操作紀錄 JSON 的 `gap` 是**箭頭中心線**至背景下緣距離；回歸測試另外扣除半個筆畫寬，檢查的是**實際筆畫上緣**的間距，兩者定義不同。

### 清除舊小檢核

- `full.json` 只刪六個 `nodes[].micro`，其他資料與 `9d35b09` 結構逐項相同。
- v3 的五個白話小檢核保留；N05 只操作兩條箭頭，沒有額外小檢核。
- 舊介面僅為既有回歸保留；其五個小檢核於產生畫面時由同一 v3 編譯結果取得，不再保留第二份舊題。其 N05 舊小檢核與 `micro_answer` 殘留處理也移除。
- content-check 拒絕任何重新加入的 `node.micro` 物件；壞資料測試確認會失敗。測試捷徑改取 v3 編譯結果／舊介面轉接資料，未硬留舊答案表。
- 原題保護測試僅允許這六個物件刪除；正式題池、基礎題、診斷、引用、`apply.json`、`content.json`、心智圖仍受完整比對。
- 已追蹤的本目錄兩份 `checked-student.html` 更新為修正後畫面；獨立稽核的臨時 HTML 可依指令重產，不重複收進證據。歷史報告／修改前證據保留為歷史，不是執行中的資料。

## 修改後檢查

| 項目 | 結果 | 證據 |
|---|---|---|
| 三個針對性測試先紅 | 0 PASS／3 FAIL／0 skipped | `codex-review-before/regression-red.txt` |
| 全教材測試（含三個回歸） | 36/36 PASS，0 skipped | `codex-review-after/tests-stdout.txt` |
| v3 SCRIPT_DIFF | PASS，145 單元、69 引句；缺漏／異文／多字 0 | 本目錄及 `codex-review-after/SCRIPT_DIFF.{txt,json}` |
| 腳本畫面檢查 | 158/158 PASS，0 skipped | `codex-review-after/copy-stdout.txt` |
| content-check | PASS，772 次原句核對、210 displayFields、0 errors、0 skipped | `codex-review-after/content-check.json`、`content-stdout.txt` |
| 八尺寸跑版 | 632/632 PASS，0 skipped | `codex-review-after/layout/layout-results.json`、`layout-stdout.txt` |
| 自寫逐關操作 | 41 張圖、0 頁面例外、完成事件 1 次；過渡標題「準備考核」 | `codex-review-after/manual/independent-results.json` |
| 平台 npm run check | 前端 162、後端 61 全過，0 skipped；型別／版本／平台編譯通過 | `codex-review-after/platform-check-stdout.txt` |

原句核對次數由 789 變為 772，是刪除六個舊題物件及其重複引文後的差異；v3 的 145 個教學單元與正式題原文都保留。`npm run check` 包含平台本機編譯，未執行教材 build、登錄、發布、部署或 push。

教師腳本 SHA256 前後相同：`3705725f11500321ca4ab8d9d6645bc7e6039515bc8d350c0aad366025a18816`。

## 修改前後手機截圖（均 390×844）

| 畫面 | 修改前 | 修改後 |
|---|---|---|
| 過渡頁：由結尾標題改為準備考核 | [修改前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-v3/codex-review-before/manual/transition.png) | [修改後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-v3/codex-review-after/manual/transition.png) |
| N05：兩箭頭校正成功，標籤貼近箭頭且箭身完整 | [修改前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-v3/codex-review-before/manual/N05-correct.png) | [修改後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-v3/codex-review-after/manual/N05-correct.png) |
| N05：只翻 H⁺，確認獨立標籤跟隨方向 | [修改前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-v3/codex-review-before/manual/N05-one-flipped.png) | [修改後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-v3/codex-review-after/manual/N05-one-flipped.png) |

每次逐關操作另外各有 41 張截圖；每張一句描述在其 `manual/independent-results.json` 的 `steps[].description`。

## 重跑指令

於 `.worktrees/acidbase-full`，Node 22.23.2；`OUT` 改成另一個證據目錄以免覆蓋本次截圖。

```sh
export PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH
OUT=/tmp/acidbase-v3-recheck
node scripts/acidbase-script-check.mjs "$OUT"
node scripts/apply-content-check.mjs materials-src/acid-base-homeostasis/full.json --cards '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge' --progress '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl' --out "$OUT/content-check.json"
node scripts/apply-layout-check.mjs materials-src/acid-base-homeostasis/full.json --out "$OUT/layout"
node scripts/acidbase-v3-review.mjs "$OUT/manual"
node --test tests/apply-*.test.mjs tests/acidbase-*.test.mjs
npm run check
```

瀏覽器命令須能啟動本機 Chromium。新增測試途中曾修正測試重設頁面的導航競爭，最後改為每個尺寸開獨立頁面；全部重跑後為 36/36，未略過或放寬幾何門檻。根目錄只更新 #6h 與週誌，handoff 不變；完成後停等教師試用。
