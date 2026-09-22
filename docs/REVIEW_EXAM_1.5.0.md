# 1.5.0「複習考（作業）」規格（草案，待教師核定）

作者：Claude（2026-09-22）｜執行：Codex｜分支：自 `feature/1.4.0-unit-model` 目前 HEAD 開 `feature/1.5.0-review-exam`

## 教師的決定（2026-09-22）

1. 教師可在後台**新增「複習考」**，性質是**必須完成的作業**：選擇**多個題目分類**（題庫中任一個次單元，可跨單元），設定**每次作答題數 N** 與**達標分數**。
2. 建立時，把所選分類**當下的全部題目複製成複習考自己的題目池**；複習考從此是**獨立的一份考卷**，有自己的成績、錯題與題目分析。之後 Sheet 修改來源題目，不會自動改到複習考。
3. **每次作答都從題目池重新隨機抽 N 題**；各分類依題數比例自動分配，每個分類至少 1 題；分類內「沒考過的題目優先」（沿用既有 `orderForPractice`）。
4. 單次作答分數＝答對題數 ÷ N × 100；**最高分 ≥ 門檻**即達標。不限作答次數。
5. 複習考是一個單元：有名稱、說明、開放時間、期限、必做、各班覆寫、適用班級、學習進度看板位置，並以**一個單元**計入課程完成度。
6. **逾期**：期限過後才達標，**仍算完成**，但報表與學生端標記「逾期完成」。
7. 一般單元內**不**新增「題目練習活動」（`Activity.type` 既有的 `'quiz'` 值維持現狀）。**綜合練習**保留不變，但不含複習考。

**Claude 提出的預設（教師可改）：**
- 重新組卷（來源有更新或改選分類）時，學生已有的最高分保留、舊版本錯題不帶過去（與 Sheet 更新題目的既有規則相同）。
- 複習考的練習分頁只提供「開始作答（N 題）」與「錯題閃卡」，不提供完整閃卡與抽題練習，讓它單純是作業。
- 新建的複習考預設在看板「尚未開放」、必做、門檻 80、N＝min(40, 題目池題數)。

## 核心設計：複習考＝一個「自己組卷」的題目分類（Unit）

平台的題目分類（`Unit`）本來就是「一份有版本的考卷」；最高分、達標、錯題、題目分析、看板、班級適用、完成度都以它為單位並已驗證過。所以複習考**直接做成一個 `Unit`**，題庫由後端把來源分類的題目合併後，用既有 `publishBank()` 發布到複習考自己的 `unitId`。與一般分類只差兩點：**(a) 完整作答的定義是「按分配抽滿 N 題」而非「全部題目」；(b) 記錄首次達標時間以判斷逾期**。

## 資料結構（`shared/model.ts`）

```ts
interface Question {
  // 新增：只有複習考題目池使用，值＝來源分類 Unit.id
  source?: string;
}
interface Unit {
  // 新增：
  review?: {
    sourceUnitIds: string[];                // 依教師選擇順序
    sourceVersions: Record<string, string>; // 組卷當下各來源 bankVersion
    drawCount: number;                      // N
    allocation: Record<string, number>;     // 各來源每次抽幾題，總和＝N
    builtAt: number;
    // 最近 10 次組卷設定（新的在前）。交卷時依「該次作答的 bankVersion」比對，
    // 避免教師在學生作答途中重新組卷或改 N，導致正在作答的學生交卷後不被採計。
    history: { version: string; drawCount: number; allocation: Record<string, number>; builtAt: number }[];
  };
}
Progress.units[unitId] // 新增欄位：
  passedAt?: number;   // 第一次「完整作答且分數 ≥ 當時門檻」的伺服器時間；一般分類也一併記錄（無害），本版只在複習考顯示
export function isReviewUnit(u: Unit): boolean;
export function allocateDraw(poolCounts: Record<string, number>, n: number): Record<string, number>;
// 最大餘數法依比例分配；n ≥ 分類數時每類至少 1 題；每類不超過該類題數；總和恆＝n；結果穩定（同輸入同輸出，並列時依 sourceUnitIds 順序）
export function drawReviewQuestions(pool: Question[], allocation, attemptedIds): Question[];
// 每個來源：orderForPractice(該來源題目, attemptedIds).slice(0, allocation[來源])；合併後 shuffle
```

- `CURRENT_COMPLETION_FORMULA_VERSION` **維持 3**；完成度仍是「最高分 ≥ 門檻」，逾期只是標記。
- `isOverdue(unit, progressEntry)`：`dueAt` 有設定、`passedAt` 存在且 `passedAt > parseCourseTime(dueAt)`。

## 後端（`functions/src/index.ts`）

**`publishBank`**：若題目帶 `source`，manifest 額外寫 `questionSources: { [questionId]: source }`（與 `questionOptions` 並列，submitAttempt 已經會讀 manifest，不增加讀取）。一般題庫行為不變。

**新 callable `buildReviewExam({ courseId, name, sourceUnitIds, drawCount })`**（教師限定）
1. `name` 符合 `safeCode`；新建時不得與任何既有 `Unit.id` 或 `chapterName` 相同；更新時必須是既有複習考。
2. `sourceUnitIds` 1–30 個、不重複；每個都是 draft 中**非複習考**且有 `bankVersion` 的分類。
3. 讀各來源題庫 chunks，依來源順序、原題序合併，每題加上 `source`、重寫 `order`（1…總數）。
4. 題目 ID 跨來源重複 → 失敗並列出 ID 與所屬分類。題目池 ≤ 500 題。
5. `drawCount` 為整數、`sourceUnitIds.length ≤ drawCount ≤ 題目池題數`；`allocation = allocateDraw(...)`。
6. `publishBank(courseId, name, questions)`（同內容＝同版本，冪等）。
7. 交易內寫回 draft：
   - 新建：`{ id: name, title: name, group: name, description: '', required: true, threshold: 80, opensAt: '', dueAt: '', bankVersion, questionCount: drawCount, activities: [], visibility: 'hidden', review: {...} }`（`questionCount` 顯示每次作答題數）；建立 `chapters[name]`（同 sync 最小 Chapter）並加入 `chapterOrder` 尾端。
   - 更新：只改 `bankVersion`、`questionCount`、`review`（`history` 前插本次設定，保留 10 筆）；Chapter 設定不動。
8. 不自動發布課程。

**`submitAttempt`**（僅對複習考分支，一般分類不變）
- 只接受 `mode === 'quiz'`（`flashcard` 拒絕：「複習考僅提供作答」；`review` 模式本就不寫 progress，照舊允許）。
- `full` 判定改為：在 `review.history` 中找 `version === a.version` 的任一筆設定，`answers.length === drawCount` 且依 manifest `questionSources` 統計各來源題數**恰好等於**該筆 `allocation`；都不符則 `full = false`（照常寫錯題，但不更新最高分）。同版本不同 N 的多筆設定皆可採計。
- 分數照舊由伺服器重批。
- **`passedAt`**（所有分類通用）：`full` 且 `score ≥ 該生可見 unit.threshold`，且 progress 中尚無 `passedAt` → 寫入 `Date.now()`。在 `applyAttempt` 之後、同一交易內處理（`applyAttempt` 不知道門檻，不改它的簽名；可在 submitAttempt 內補欄位）。

**`submitMixedAttempts`**：拒絕複習考的 unitId（「複習考不列入綜合練習」）。

**同步（`syncBankTabFromSheet`）**：Sheet 的次單元或單元名稱與既有複習考同名 → 該群組報錯「名稱『X』已被複習考使用，請改名」；計算 `staleUnits` 時排除複習考。

**`saveCourse`**：驗證 `review` 結構（陣列／物件／整數型別、`allocation` 總和＝`drawCount`）；不驗證來源是否仍存在。

**刪除**：新增 `deleteReviewExam({ courseId, name })`（教師限定）：從 draft 移除該 Unit、其 Chapter、`chapterOrder` 項目與各班 `classUnits` 中的 ID；學生紀錄保留。

## 教師後台（`src/App.tsx`）

- 「課程與教材」單元清單上方加「**新增複習考**」→ 對話框：
  - 名稱。
  - **來源分類**：依單元分組多選，每項顯示題數；未發布者停用；複習考本身不列入。
  - **每次作答題數 N**（預設 min(40, 題目池)），即時顯示分配結果，例如「紅血球 8、血紅素 10、心動週期 12、冠狀循環 10」與「題目池共 100 題」。
  - 即時顯示「門檻 80 分＝N 題需答對 ⌈N × 0.8⌉ 題」（門檻在單元設定改）。
  - 「建立」→ `buildReviewExam`；成功提示提醒到看板開放、若有班級適用設定需勾選。
- 單元清單中複習考標「作業・複習考」徽章。設定頁與一般單元相同（名稱、說明、開放、期限、達標、必做、各班覆寫、研究資料、學習活動），唯讀區塊改顯示：
  - 「題目池 100 題（紅血球 20、血紅素 25…），每次抽 40 題，組卷於 2026/10/01 14:00」。
  - 任一來源 `bankVersion` ≠ `sourceVersions` → 黃色提示「來源題庫已更新（…），題目池仍是組卷當時內容」＋「**依目前題庫重新組卷**」。
  - 「**修改來源與題數**」（同一對話框）。
  - 重新組卷前 confirm：「會產生新的考卷版本。學生已考到的最高分保留；舊版本的錯題不帶到新版本。」
  - 「刪除複習考」（confirm）。
- 完成度看板／學生明細：複習考欄位顯示最高分；已達標且逾期者顯示「逾期完成」標記（完成數照算）。完成度 CSV 匯出若有，加「逾期」欄。
- 學習進度看板與班級對照表：複習考照一般單元處理。

## 學生端（`src/Student.tsx`）

- 首頁單元卡：「作業・複習考｜每次 N 題・需達 X 分・期限 …」；完成後若逾期顯示「已完成（逾期）」。
- 複習考單元頁的練習分頁：只顯示一列——最高分 / 門檻、作答次數、「**開始作答（N 題）**」、「錯題 k」。不顯示完整閃卡與抽題。
- `start()`：複習考時用 `drawReviewQuestions(pool, unit.review.allocation, attempted)` 取代全部題目；`full = true`；選項照舊洗牌。
- 結果頁照既有 `Quiz`（分數、逐題解析）；額外顯示各來源分類答對數（依 `question.source`）。
- 綜合練習：`MixedPractice` 過濾 `isReviewUnit`。
- 路由不需新增（複習考有 `unitId`）；`/unit/{id}/flashcard` 與 `mode=draw` 對複習考導回單元頁。

## 測試

- `tests/core.test.ts`：`allocateDraw`（比例、每類至少 1、上限、總和＝N、穩定性、N＝池總數）；`drawReviewQuestions`（各來源數量、未考過優先）；`isOverdue`；複習考完成度走 v3（最高分 ≥ 門檻）。
- `functions/tests`：`buildReviewExam`（合併順序、source、order、ID 重複、> 500、N 範圍、來源不可為複習考、名稱衝突、更新只改三欄、冪等）；`publishBank` 寫 `questionSources`；`submitAttempt` 複習考（抽滿且分配正確＝full 更新最高分、題數或分配不符＝不更新最高分、flashcard 拒絕）；`passedAt` 只在首次達標寫入、未達標不寫；一般分類行為不變（既有測試原樣通過）；`submitMixedAttempts` 拒絕複習考；同步同名報錯、`staleUnits` 排除；`deleteReviewExam`。
- `tests/preview.test.ts`：複習考卡片標示、練習分頁只有作答與錯題、逾期標記、綜合練習排除。

## 版本與交接

- 版本 1.5.0（`npm run version:sync`）。`DEVELOPMENT_LOG.md` 最上方新增一節；`handoff.md` 更新固定決策（複習考＝組卷的 Unit、每次隨機抽 N 題、逾期標記、綜合練習排除、一般單元不放題目練習活動）；`docs/UNIT_MODEL_1.4.0.md` 加註指向本文件。
- 建議分 2 個 commit：①model＋後端＋測試 ②教師後台＋學生端。每個 commit 前 `npm run check`、`git diff --check`。
- **不 push、不部署**；完成後在 handoff 標示「1.5.0 複習考待 Claude 驗收」。

## 題目有誤時的處理流程（教師 2026-09-22 詢問後補充）

1. 教師在 Sheet 修正該題（或把「啟用」設為 FALSE 停用）→ 同步 → 來源分類產生新版本。
2. 複習考設定頁出現「來源題庫已更新」→ 按「依目前題庫重新組卷」→ 複習考產生新版本，之後的作答都用修正後的題目池。
3. 重新組卷當下正在作答的學生，交卷時以其作答版本比對 `review.history`，仍正常採計。
4. 已發生的作答**不重算**（平台既有限制，與一般分類相同）：因該題被冤枉的學生可重考補回；因錯誤答案鍵多拿的分收不回；首次達標時間（逾期判定）也不重算。每次作答抽 N 題，一題錯誤對單次分數的影響為 100 ÷ N 分（N＝40 時為 2.5 分）。
5. 「題目作廢並重算」（標記某題作廢、重算所有受影響作答的分數、最高分、`passedAt`）仍列為獨立待辦，不在 1.5.0 範圍。

## 已知限制（寫進 handoff）

- 每次抽到的題目不同，難度會有差異；學生可重考到達標。這是作業性質的設計取捨。
- 教師事後提高門檻時，已記錄的 `passedAt` 不會重算；逾期標記以首次達標時的門檻為準。
- 作答中途離開仍需重新作答（平台既有限制）；建議 N 控制在 40–50 題以內。

## 不在這次範圍

- 各分類手動指定題數；限制作答次數或作答時間；作答中斷後續作；期限後達標不計完成；來源更新時自動重新組卷；複習考錯題寫回原分類。
