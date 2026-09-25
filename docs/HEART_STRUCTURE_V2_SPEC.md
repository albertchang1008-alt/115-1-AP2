# 心臟構造 heart-structure-v2 規格（交給 Codex）

> 2026-09-25 Claude 撰寫，教師同意發包。分支：`feature/heart-structure-v2`（由 main `8a0e357` 建立）。不 push、不合併、不部署。

## 1. 為什麼要做

- 目前登錄的 `heart-structure-v1` 是教材元件庫樣板（`materials-src/heart-structure` 建置），實測問題：情境實驗室的 SVG 箭頭變成巨大黑色三角形並蓋住文字（「三尖瓣開」「上／下腔靜脈」「肺靜脈」都被遮住）；6 個知識節點圖完全相同；整體比同單元其他圖像強化版教材簡陋。
- `html/心臟構造.html`（手工圖像強化版）版面與內容都比較好，且內容已由教師逐項複核（入門程度、無病理藥理、11 題與題庫 Excel 一致）。
- 決定：以 `html/心臟構造.html` 為來源，做成正式版本 `heart-structure-v2`，版型比照 `cardiac-conduction-v2`／`cardiac-cycle-v2`。`heart-structure-v1` 檔案保留、不發布。

## 2. 內容凍結（不可改）

- 6 個知識節點的標題、核心概念、重點、補充框文字；11 題的題幹、選項、正解、提示、解析；數字卡。
- 以上文字已與 `html/資訊圖表題庫_上傳用.xlsx` 同步，改了會和題庫不一致。發現內容錯誤請寫在交付報告，不要自行改。
- ID 不變：`heart-structure-node-01`～`06`、`heart-structure-foundation-q01`～`q06`、`heart-structure-case-q01`～`q05`。

## 3. 要做的事

1. 建立 `public/materials/heart-structure-v2/index.html`，並把 `html/assets/heart-valve-flow-strip-v1.png` 複製到 `public/materials/heart-structure-v2/assets/`（相對路徑 `assets/…`）。`html/心臟構造.html` 同步成相同內容（圖檔路徑維持 `assets/…`）。
2. **情境實驗室**：4 張圖在 1280px 維持一列；在 ≤620px 改為水平 scroll-snap（一次一張半）或 2×2，不可 4 張全寬直排（目前 390px 整頁高 7,379px，主因之一）。保留舒張／收縮切換與「先猜一猜」。
3. **知識節點改為「選一個看一個」**：比照 `cardiac-conduction-v2` 的 `flow-nav-card`＋`selected-explanation`：上方 6 張節點卡＋分類篩選，下方只顯示目前選取節點的完整解說（示意圖、核心概念、重點、補充框），不要 6 張詳細卡全部展開。手機點節點後捲到解說區開頭。
4. **節點示意圖文字放大**：各節點 SVG 內文字在 390px 實際渲染不得小於 11px；放不下就精簡字，不可縮小到看不清。
5. **平台紀錄**：
   - `course-learning.js` 放在所有 inline script 之前載入。
   - `explore` 只在學生**點選**節點時送、每節點一次；頁面載入時預設顯示節點 1 **不算**探索（`心臟電性活動` 驗收發現的同類錯誤：載入即標記已看，導致節點 1 永遠記不到）。
   - 每次選答送 `answer`；第二關本輪 5 題都第一次就答對才送 `complete`。
   - 第二關答錯的「回讀節點」以**題目 ID** 對應節點，不可用洗牌後的題序索引（現行 `CASE_REVIEW_NODE_IDS[s2CurrentIndex]` 在題目洗牌後會對錯節點）。對應：case-q01→node-05、q02→node-04、q03→node-01、q04→node-06、q05→node-02。
6. **解析重複字**：畫面目前會出現「正解解析：解析：…」。資料保留原文，顯示時去掉開頭的「解析：」（或改 UI 標籤），不可改題庫文字。
7. **登錄**：`shared/materials.ts` 新增 `'heart-structure-v2': { label: '心臟構造與解剖生理圖卡（圖像強化版）', tracking: 'interactive', nodeTotal: 6, questionTotal: 11 }`，註明 v1 為元件庫樣板、不發布；執行 `npm run materials:sync` 更新 README。不要刪 v1。
8. 測試：`tests/material.test.ts` 對 `html/心臟構造.html` 的既有斷言若因版型改寫而失效，改為對 v2 檔案斷言同等行為（情境實驗室、先猜一猜、6＋5 題 ID、trackComplete），不可單純刪斷言。

## 4. 驗收標準（Claude 會照這份驗）

- Playwright 390／1280：無 pageerror、console error、橫向捲動；圖檔載入。
- 點 6 個節點 → 6 次 explore；載入後未點任何節點 → 0 次 explore。
- 11 題全對 → 1 次 complete；第二關錯 1 題 → 不送 complete，並列出正確的回讀節點。
- 390px 整頁高度 ≤ 4,500px（知識節點只展開一個時量測）。
- 節點 SVG 文字 390px 渲染 ≥ 11px。
- 內容文字與 `html/資訊圖表題庫_上傳用.xlsx` 心臟構造 11 題逐字一致（題幹、選項、解析去掉「解析：」前綴後比對）。
- `npm run check` 通過。
- 交付：截圖（390／1280 各：頁首、實驗室、選取節點 3、第二關）、驗收報告寫在 `docs/HEART_STRUCTURE_V2_ACCEPTANCE.md`；commit 訊息結尾 `[Codex]`；更新 `handoff.md`「待 Claude 驗收」。
