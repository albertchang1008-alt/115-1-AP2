# 1.7.0 第④段：錯題跨版本延續（補充規格）

作者：Claude（2026-10-06）｜執行：Codex｜分支：`feature/1.7.0-practice-modes`（接在 ①～③ 之後）
本檔**取代** `docs/PRACTICE_MODES_1.7.0.md` 第 3.6 節與盤點第 7 點的第二項前提；其餘章節不變。

## 0. 教師決定（2026-10-06）

1. ④ 要做；**1.7.0 完整（①～④）之後才部署**。
2. 綜合練習**不放寬**範圍，維持 `visibility === 'current'`。
3. 「不得新增 Firestore 讀取」的限制**只適用學生端**（首頁、練習、交卷、教師檢視學生進度）。**教師同步題庫時可以讀取舊版題庫**，這是低頻操作，成本可忽略。

## 1. 為什麼可行

- 題目 ID 跨版本固定（Codex 盤點第 7 點已確認）。
- 舊版題庫是不可變快照：`banks/{course}_{unit}_{oldVersion}`，其 `chunks/*` 有題目全文（選項文字、題型），`grading/answers` 有正解 ID。同步時直接讀即可，**不需要另外保存答案特徵**，部署後第一次同步就生效。

## 2. 同步時（`syncBankTabFromSheet`）

對每個分類，`publishBank` 回傳新版本後：

- 只有在 `existing?.bankVersion` 存在、且 ≠ `result.version`、且**不是複習考**時，才計算延續。
- 讀取舊版：`grading/answers`（正解 ID）＋ manifest 列出的全部 `chunks`（題目全文）。舊版 manifest 不存在或讀取失敗 → 該分類不延續（寫 `drop: '*'`），同步本身照常完成，結果訊息註明「舊版題庫讀取失敗，錯題重新計算」。
- 新版題目用記憶體中的 `questions`（不重讀）。
- 以題目 ID 比對，計算 `drop`（純函式，放 `shared/`，例如 `wrongCarryDrop(oldQuestions, oldAnswers, newQuestions)`）：
  - 新版沒有這個 ID → 列入（刪除）。
  - 正解選項的**文字**不同（去除前後空白、連續空白合併為一個後比較）→ 列入（正解改變）。用文字比，不用選項 ID，因為選項順序可能在 Sheet 調整過。
  - 選項數量不同 → 列入。
  - `questionType` 不同（未填視為 `single`）→ 列入。
  - 只改題幹、解析、錯字、干擾選項文字、圖片、題序 → **不列入**，延續。
- 寫入 Unit（在既有交易內，與 `bankVersion` 一起更新，`unitChanged` 時才寫）：
  ```ts
  wrongCarry?: Record<string /* newVersion */, { from: string /* oldVersion */; drop: string[] | '*' }>;
  ```
  - 只保留最近 10 筆（依寫入順序，刪最舊）。
  - 新增欄位要加進 `shared/model.ts` 的 `Unit` 型別。
- 教師勾選「這次改版後，錯題全部重新計算」時，所有本次有改版的分類一律寫 `drop: '*'`，且**不讀舊版**。
- **不得改寫任何學生的 progress**。
- 回傳結果每個分類加 `carry: { kept: number; changed: number; removed: number } | 'reset' | 'failed'`（題目數，不是學生數）。

### 草稿與發布
- 確認教師「發布課程」時 `wrongCarry` 會從 `draft.units` 原樣帶到 `published` 與各班 `forClass` 結果；若發布流程會挑欄位，補上 `wrongCarry`。
- 教師連續同步兩次才發布（v1→v2→v3，學生只看過 v1）：因為 v3 記錄 `from: v2`、v2 記錄 `from: v1`，鏈仍然完整，學生端可從 v3 一路追回 v1。

## 3. 讀取時（`effectiveWrong`，前後端共用）

`effectiveWrong(unitProgress, unitMeta, currentVersion)`（介面已在 ① 建立，現在補上延續）：

1. `wrong[currentVersion]` 存在 → 直接回傳（已實體化）。
2. 否則從 `currentVersion` 沿 `unitMeta.wrongCarry` 往回走：每一段累積 `drop`；遇到 `'*'`、找不到該版本的 `wrongCarry` 紀錄、或走超過 10 段 → 回傳空。
3. 走到某個 `from` 版本時，若 `wrong[from]` 存在 → 回傳 `wrong[from]` 扣掉累積 `drop` 的結果（`n`、`at`、`ok`、`rm` 原樣），並經過舊 `string[]` 相容轉換。
4. 防止循環（同一版本出現兩次即停止，回傳空）。

伺服器交卷時 `applyAttempt` 本來就把 `updateWrong(effectiveWrong(...))` 寫進 `wrong[currentVersion]`，因此第一次交卷就自然實體化；舊版本的 `wrong` 保留不刪。不需要改 `applyAttempt` 本身。

所有呼叫 `effectiveWrong`／`wrongEntries` 的地方都必須傳入 `unitMeta`（Unit 物件）；請全專案搜尋，未傳的補上（包含教師端學生進度與完成度匯出）。

## 4. 教師端畫面

- 題庫同步畫面加核取方塊「這次改版後，錯題全部重新計算」，**預設不勾**，旁邊一行說明：「不勾：只有正解改變或刪除的題目會從學生錯題中移除；勾選：所有改版分類的錯題重新計算」。
- 同步結果每個有改版的分類加一行：
  - 延續：「錯題延續：保留 x 題，重置 y 題（正解改變 a、刪除 b）」
  - 勾選重算：「錯題已全部重新計算」
  - 讀取失敗：「舊版題庫讀取失敗，錯題重新計算」
  - 沒有改版的分類不顯示。

## 5. 複習考

複習考（`buildReviewExam`）本次**不延續**：重建時題目池重新抽配，延續規則不明確。重建時不寫 `wrongCarry`，維持改版即重新計算。在 handoff 註明。

## 6. 不追溯

部署前已經發生過的同步沒有 `wrongCarry`，學生在那些舊版本的錯題不延續。部署後第一次同步起生效。

## 7. 測試

- `tests/core.test.ts`
  - `wrongCarryDrop`：刪除題、正解文字改變、選項數量改變、題型改變列入；只改題幹／解析／干擾選項／圖片／題序不列入；正解只有空白差異不列入；選項順序調換但正解文字相同不列入。
  - `effectiveWrong`：目前版本已有資料直接用；單段延續扣 `drop`；多段鏈（v1→v2→v3，只有 v1 資料）累積 `drop`；鏈中斷為空；`'*'` 為空；循環防護；超過 10 段為空；`n`／`at`／`ok`／`rm` 原樣；舊 `string[]` 經延續後相容。
  - `wrongCarry` 只保留 10 筆。
- `functions/tests`
  - 同步改版：寫入 `wrongCarry`、回傳 `carry` 統計；**不寫任何 `progress/*` 文件**。
  - 勾選重算：寫 `'*'` 且不讀舊版。
  - 舊版 manifest 不存在：寫 `'*'`、結果為 `failed`、同步仍成功。
  - 版本沒變：不寫 `wrongCarry`。
  - 新版本第一次交卷：先延續、再套用 `updateWrong`，寫入 `wrong[新版本]`；舊版本資料保留。
  - 前端 `effectiveWrong` 與伺服器結果一致（同一組 fixture）。
  - 發布課程後 `published` 與 `forClass` 保留 `wrongCarry`。
- `tests/preview.test.ts`：同步畫面核取方塊預設不勾；三種結果訊息。
- `npm run check`、`git diff --check` 通過。

## 8. 交接

- 一個 commit：「feat: 錯題跨版本延續（同步讀舊版比對正解）[Codex]」。
- 更新 `docs/PRACTICE_MODES_1.7.0_ACCEPTANCE.md`：加 ④ 段落與截圖（同步畫面核取方塊、三種結果訊息，桌機即可）。
- `handoff.md`：固定決策第 3 條改為「題庫改版時錯題依題目 ID 延續；正解文字／選項數／題型改變或刪除的題目重置；教師可勾選全部重新計算；同步時讀舊版題庫比對（僅教師操作）；複習考與部署前的同步不延續」。標示「1.7.0 ①～④ 待 Claude 驗收」。
- **不 push、不部署**。

## 不在這次範圍
複習考延續；追溯部署前的同步；最高分跨版本延續（既有規則已沿用）。
