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

---

## 第二輪修正（2026-09-25，教師看過正式網站後退回）

教師意見：「問題如同之前一樣、佈局不對、點選之後請學生往下移動的部分沒有」。Claude 對照 `cardiac-conduction-v2`（教師認可的版型）與目前 `heart-structure-v2`，整理成下列必改項目。**內容凍結規則不變**（第 2 節）：只改版面與互動，不改任何教材文字、題目、ID。

### A. 版面改成與 `cardiac-conduction-v2` 相同的結構

直接以 `public/materials/cardiac-conduction-v2/index.html` 的 HTML／CSS／互動為樣板，順序為：

1. 頁首＋4 張數字卡。
2. 「互動資訊圖表／兩階段隨堂診斷」分頁鈕。
3. **閱讀提示** `reading-cue`：「↓ 往下閱讀：查看重點與補充說明」（照傳導系統的樣式與動畫）。
4. **6 張文字節點卡**一列（1280px 一列六張；窄版兩欄），卡片只放「編號＋標題＋一行摘要」，拿掉目前卡片上的小圖示。分類篩選可保留在節點卡上方。
5. **一張「情境實驗室｜讓血液走對路」大卡**，裡面依序是：
   - 主圖（大圖，與傳導系統的 `visual-focus` 相同尺寸與裁切方式），**隨選取的節點切換**；
   - 「已選：…」說明；
   - 選取節點的完整解說（核心概念、重點、補充框）＋該節點的示意圖；
   - 舒張期／收縮期切換、狀態說明、「先猜一猜」放在大卡最後。
   - 原本頂部那組 4 張小圖流程不再單獨一區；四格瓣膜流程改成主圖的來源。

### B. 節點與主圖的對應

素材放在 `public/materials/heart-structure-v2/assets/`（從 `html/assets/` 複製，教材內用相對路徑）：

| 節點 | 主圖 |
| --- | --- |
| 1 心包膜層次 | `heart-valve-flow-strip-v1.png` 第 1 格（整顆心臟剖面） |
| 2 心臟壁構造 | 同上第 1 格 |
| 3 四大心腔 | 同上第 2 格（房室瓣開啟，可見四腔） |
| 4 心臟瓣膜 | 同上第 3 格（房室瓣關閉） |
| 5 冠狀循環 | `coronary-overview-v2.png`（整張） |
| 6 傳導系統 | `cardiac-conduction-flow-strip-v1.png` 第 1 格 |

舒張期／收縮期切換時，主圖改顯示瓣膜四格的第 2 格（舒張）或第 4 格（收縮），「已選」說明跟著改。

### C. 「問題如同之前一樣」：節點示意圖的文字溢出框外

目前第一輪為了達到最小字級，把 SVG 文字放大，但方框沒跟著放大，字跑出框外（例如節點 3「上/下腔靜脈、冠狀竇注入」「唧血至肺動脈幹 (肺循環)」超出藍框）。改法：放大方框或 `viewBox`、必要時分兩行（`<tspan>`），**不可縮小字**；390px 渲染字級仍需 ≥ 11px，且所有 `<text>` 的外框必須落在所屬方框內。

### D. 點選節點後的引導

- 點節點卡：閱讀提示重新播放動畫；窄版（≤ 899px）自動平滑捲動到主圖頂端；寬版不自動捲動（與傳導系統相同）。
- 解說區加 `aria-live="polite"`，讓讀屏也知道內容換了。
- 第二關答錯的「前往對應圖卡複習」：切回資訊圖表、選取該節點並捲到主圖。

### E. 第一輪已完成、需保持的行為

載入 0 次 explore、點選才送；每節點一次；11 題全對才 complete；錯題回讀依題目 ID 對應；不出現「解析：解析」；窄版實驗室圖不可壓扁；導覽卡不可再出現小於 11px 的字。

### F. 驗收（Claude 會照這份驗）

- 1280px 與 390px 各截：初始畫面、點節點 3 後、點節點 5 後、點節點 6 後、第二關；與 `cardiac-conduction-v2` 同一步驟截圖並排比對版面結構。
- 自動檢查：所有 SVG `<text>` 的 bounding box 在所屬 `<rect>` 內（寫成 Playwright 檢查，放進報告）；390px 點節點後 `scrollY` 落在主圖頂端 ±40px。
- 第一輪的驗收項目全部重跑；`npm run check` 通過。
- 報告追加到 `docs/HEART_STRUCTURE_V2_ACCEPTANCE.md`「第二輪」一節；commit 結尾 `[Codex]`；不 push、不合併、不部署。
