# 1.6.0 學習進度介面驗收（第一輪）

驗收者：Claude（2026-09-29）｜對象：`feature/1.6.0-progress-ui` `3520b89..959af99`｜結果：**未通過，需修正後再驗收**

已通過：`applyAttempt` 只讓完整測驗更新最高分並累計 `fullAttempts`；`passedAt` 排除閃卡；`Activity.required` 覆寫與 `isRequiredActivity()`；`saveCourse` 型別驗證；教師後台三選一；首頁新增讀取 0 次；綜合練習仍為 `full === false`。

## A. 錯誤（必修）

1. **正式完成度與畫面不一致（最重要）**。`chapterCompletion()` 以 `units.every(...)` 檢查**所有**題目分類，沒排除選做分類；新介面則排除。結果：學生畫面顯示「已完成」，教師完成度看板仍是未完成。
   修正：`chapterCompletion()` 只計 `u.required && u.bankVersion` 的分類。這會改變既有完成度結果，請**新增 `CURRENT_COMPLETION_FORMULA_VERSION = 4`**，v3 原樣保留供舊紀錄比對（沿用平台既有的公式版本做法），`totalRequired` 同步。加測試：含選做分類的單元在 v3 未完成、v4 完成。
2. **首頁把沒有題庫的分類算成永遠未完成**。`summarizeUnit` 的 `categories` 未排除 `!u.bankVersion`，而 `chapterCompletion` 視為已通過。請排除。
3. **首頁與 `chapterCompletion` 必須一致**：加測試，對同一組 course／progress，`summarizeUnit(...).state === 'done'` ⇔ `chapterCompletion(...).done`（必做、有題庫、無題庫、選做分類、選做活動、舊課程 `unitId_activityId` 鍵各一例）。`itemStatusForActivity` 目前只讀 `chapter:` 鍵，請補上 `chapterCompletion` 的舊鍵 fallback。
4. **練習分頁選做分類永遠顯示「還沒看過」、「選做分類看過」永遠 0**：`PracticePanel` 的 `state()` 取 `summarizeUnit(unit).requiredItems[0]`，選做分類沒有 requiredItems。改用 `itemStatusForCategory(...)`。
5. **練習分頁門檻來源不一致**：`state()` 用分類自己的 `threshold`，徽章「已達標」用 `chapter.threshold`（該生可見門檻）。一律用 `chapter.threshold`。
6. **練習分頁標籤分母錯誤**：「必做 x / y 達標」目前用全部 `chapterUnits`，應只算 `required && bankVersion` 的分類。
7. **未開放單元的項目出現在待辦**：`todoItems`／`soonItems` 未排除 `state === 'locked'` 的單元。
8. **選看單元卡**：單元 `required === false` 時，其下所有項目都應視為選做（目前分類若 `required: true` 會進 requiredItems，導致「看過 0 / 0」）；且不應顯示狀態徽章、下一步、期限。
9. **複習考卡片退化**：1.5.0 的「作業・複習考」「每次 N 題・需達 X 分」「已完成（逾期）」標示在新卡片中消失，請補回（規格第三節最後一段）。
10. **「去練習」沒有定位**：從首頁進入練習分頁需捲動到該分類列並高亮 2 秒（規格第四節 4）。可用 `?tab=practice&focus=<unitId>`，列已有 `id="practice-…"`。

## B. 規格未完成

11. **首頁展開內容**（規格第三節）：活動需依課前／課堂／課後分組並顯示「課堂・2 / 3 完成」；已完成項目要收合（「已達標 2 個：心臟構造 86、心臟血液供應 82 ▾」、「已完成 k 項 ▾」、整組完成縮成「課前・3 項都完成」）；分類說明要用「最高 17・還差 63 分・錯題 5」「只做過練習，還沒完整測驗」「還沒開始」。
12. **互動教材說明**：目前「進度 {position} / {nodeTotal}」。若 progress 有節點與題目計數就顯示「節點 x / y・題目 x / y」；沒有就維持但改稱「節點 x / y」，並在 handoff 註明缺哪個資料。
13. **練習列**（規格第四節 3）：加狀態圖示；分數下方小字「還差 X 分／已達標／只做過練習」；說明行加「完整測驗 k 次」（`fullAttempts` 有值時）；錯題 0 按鈕改虛線淡字樣式（點擊後既有「目前沒有錯題」畫面可沿用）。
14. **手機版練習列**（規格第五節）：目前把全部按鈕排成兩欄格子。應改為兩顆等寬按鈕「完整測驗・計分」「練習 ▾」，展開列內選單（閃卡（整份 N 張）、抽題 10／20／30 題、錯題複習（k 題），每項 44px），一次只展開一個；「必做・已達標」「選做」兩區在手機預設收合。
15. **展開按鈕**：用向下／向上箭頭，`aria-expanded`，`aria-label` 隨狀態切換「展開／收合」。
16. **圖示**：狀態用線條圖示（lucide 已有：`CheckCircle2`、`Circle`、`CircleDashed` 或自繪半圓、`AlertCircle`、`Lock`、`Eye`），不要用 ✓ ◐ ○ 字元。

## C. 測試與交付

17. 補上規格第九節缺的測試：上述 1–8 各一例；`functions/tests` 中 `submitAttempt` 以 flashcard 完整作答**不寫 `passedAt`**。
18. **截圖未附**：請附首頁（收合、展開）、練習分頁、手機版練習選單展開，放在 `docs/progress-ui-1.6.0-screenshots/`。
19. `tests/preview.test.ts` 仍在比對舊文案（如 `/已達標分類/`、`最高分 \{bestLabel\}`）；請更新為新介面實際文案，避免測試保護到已移除的畫面。

修正完成後在 handoff 標示「1.6.0 第二輪待 Claude 驗收」。仍不 push、不部署。
