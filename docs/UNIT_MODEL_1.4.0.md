# 1.4.0 單元模型簡化規格（教師 2026-09-18 決定，第二版）

## 教師的決定

1. **設定與活動都在「單元」這一層**：開放時間、期限、達標分數、必做、班級、學習活動，每個單元只設定一次。
2. **次單元只是題目分類**，教師不需要替它做任何設定。
3. **完整測驗以次單元為範圍**（題目比較少）。學生要把單元底下每個次單元的完整測驗都考到達標。

## 名詞

| Sheet | 畫面名稱 | 程式內部 |
|---|---|---|
| 單元（E 欄） | 單元 | 新增 `Chapter`（`Course.chapters`），以單元名稱為 key |
| 次單元（F 欄） | 題目分類 | 維持現有 `Unit`（`Unit.group`＝所屬單元），題庫版本、作答進度、錯題仍以它為 key |
| 次單元空白 | 單元本身就是唯一的分類 | 1.3.1 已修：`Unit.id`＝單元名稱 |

內部保留 `Unit` 當題庫與進度的單位，是為了**不動題庫發布、後端批改、Progress、錯題、報表**這些已驗證過的資料結構，只在上面加一層單元設定。

## 資料結構

```ts
interface Chapter {            // 以單元名稱為 key：Course.chapters[name]
  title: string;               // 預設＝Sheet 單元名稱
  description: string;
  required: boolean;
  threshold: number;           // 套用到底下每個題目分類的完整測驗
  opensAt: string;
  dueAt: string;
  activities: Activity[];      // 教師自己加的 HTML 教材、影片、連結
  research?: { enabled: boolean };
}
Course.chapters?: Record<string, Chapter>;
Course.chapterOverrides?: Record<classId, Record<chapterName, { threshold?, opensAt?, dueAt?, required? }>>;
Course.chapterOrder?: string[]; // 單元顯示順序
```

- **生效設定**：`forClass()` 產生學生看到的課程時，每個 `Unit` 的 `required/threshold/opensAt/dueAt/research` 一律由所屬 Chapter（＋該班 chapterOverrides）覆寫。Unit 自己的這些欄位保留在資料裡，但畫面不再顯示、不再編輯。
- 沒有 `chapters` 的舊課程：以 `Unit.group` 自動推出 Chapter，設定取該組第一個 Unit 的值（相容讀取，不改寫舊資料）。
- 同步建立新題目分類時，若所屬單元還沒有 Chapter，就自動建一個（`required: true, threshold: 80`，沿用現行 `newUnitFromSheet` 預設）。

## 完成度（取代固定決策 10、11 的範圍說明）

- 一個**單元完成**＝底下每個題目分類的完整測驗（或完整閃卡）最高分 ≥ 單元達標分數，**且**單元的必做活動都完成。
- 課程完成度（`completion()`）改以**單元**為計數單位：分母＝必做且有題庫或必做活動的單元數。
- 單元活動的進度鍵：`progress.activities['chapter:' + 單元名稱 + '_' + activityId]`，與舊的 `unitId_activityId` 分開，避免單元名稱等於題目分類名稱時撞鍵。
- 後端 `recordActivity`／完成度相關 callable 要接受 chapter 活動鍵並驗證該活動存在於 published chapter。
- 完成度公式版本升為 3（`CURRENT_COMPLETION_FORMULA_VERSION`），舊結算快照仍用原版本計算。

## 畫面

### 教師端「課程與教材」
- 左側：**只列單元**（可上移下移），每列顯示「N 個分類、M 題」。
- 右側單元設定：名稱、說明、開放時間、期限、達標分數、必做、研究資料、各班覆寫、**學習活動**。
- 下方唯讀區塊「題目分類（來自 Sheet 次單元）」：分類名稱＋題數＋題庫版本，不可編輯；只有舊資料警示（見下）才有按鈕。
- 「班級與適用單元」對照表：**列＝單元**，打勾代表該班適用此單元底下全部分類（寫入 `classUnits` 時展開成所有分類 ID）。
- 學習進度看板：以單元為單位移動區域（沿用 1.3.0 的整組移動，移除個別分類移動）。

### 學生端
- 首頁列單元；點進單元看到：單元說明、學習活動、以及「題目分類」清單，每個分類一張卡：完整測驗、完整閃卡（計入完成）、抽題、錯題閃卡（僅練習）。
- 單元卡片顯示「已達標分類 x / y」與活動完成數。

### 綜合練習（教師 2026-09-18 補充）
- 題目範圍＝**目前開放中**（學習進度看板「目前」區，`visibility: 'current'`）的單元底下所有題目分類的已發布題庫。
- **不含**已移到歷史區（`archived`，學生端「已考完的單元」）的單元，也不含 `hidden`。
- 單元的可見性以單元為單位設定，底下所有題目分類一起移動（沿用看板整組移動）。
- 現況：前端 `MixedPractice` 已只取 `current`；但後端 `submitMixedAttempts` 沒有檢查可見性。1.4.0 要在後端補上：任何 attempt 的 unitId 若為 hidden 或 archived，整批拒絕，並加測試。
- 仍不影響最高成績與完成度（不變）。

## 舊結構清理

- 1.3.x 時期存在草稿 Unit 上的活動（例如課程簡介 HTML 教材掛在代碼「血液成分與血漿」上）不自動搬。教師後台若偵測到任何 Unit 仍有 `activities`，在該單元設定上方顯示提示：「以下活動掛在舊的題目分類上，請搬到單元」，每個活動一顆「搬到此單元」按鈕（移到 chapter.activities，並從 Unit 移除）。
- Sheet 已無對應的舊 Unit（同步結果回傳 `staleUnits`）：單元清單上方黃色提示＋「全部移除」按鈕（confirm 列出名單）。同步本身不自動刪除。
- 教師已確認學期初無學生作答，不需搬移進度。

## 需要改的地方

- `shared/model.ts`：`Chapter`、`Course.chapters/chapterOverrides/chapterOrder`、`chaptersOf(course)`（含舊資料推導）、`forClass()` 套用 chapter 設定、`chapterCompletion()`、`completion()` 改以單元計數（公式 v3）。
- `functions/src/index.ts`：同步時確保 Chapter 存在、回傳 `staleUnits`；`publishCourse` 一併發布 chapters；活動紀錄接受 chapter 活動鍵；伺服器端完成度與結算改用 v3。
- `src/App.tsx`、`src/CourseSetup.tsx`：單元清單、單元設定（含活動編輯器，重用現有 Activity 編輯元件）、題目分類唯讀區、對照表列改單元、舊資料提示。
- `src/Student.tsx`：單元頁（活動＋分類卡）、完成度顯示。
- `src/ProgressBoard.tsx`、報表／完成度看板：以單元彙總，可展開看各分類分數。
- 測試：chapter 設定覆寫 Unit、舊資料推導、單元完成度（全部分類達標＋活動）、chapter 活動鍵、對照表展開、同步自動建 Chapter 與 staleUnits、公式 v1/v2 舊快照不變。
- 文件：`handoff.md` 固定決策 10、11 改寫；`docs/QUESTION_BANK_PLAN.md`、`CreateCourseTemplate.gs` 欄位說明。
