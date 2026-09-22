# 教材元件庫 v1 規格（教師 2026-09-23 交辦，Claude 撰寫）

執行：Codex｜分支：自 `feature/1.5.0-review-exam` 目前 HEAD 開 `feature/material-kit`｜**不 push、不部署**

## 目標

把互動教材從「每份一個 60–85KB 手寫 HTML」改成：

```
materials-src/
  kit/            共用元件：樣式（設計規範）、互動與串接 JS、HTML 版型
  figures/        共用 SVG 教學圖庫＋授權清單 manifest.json
  <slug>/content.json   每份教材只剩內容：文字、節點、題目 ID、要用的圖
        ↓  npm run materials:build <slug>
public/materials/<slug>-vN/index.html   單檔、自足（kit 與圖在建置時內嵌）
        ↓  npm run materials:shots <slug>
截圖（390／1280）＋自動檢查報告
```

效益：新教材只寫內容；視覺改一次 kit，重建即可套用到所有教材；節點／題目數由建置自動算出並寫入教材目錄，不再人工核對。

**本任務範圍＝第一階段**：做出 kit、建置與截圖檢查工具，並以「心臟構造」做第一份樣板。完成後停下，由教師看截圖核定視覺，**不要**轉換其他教材。

## 1. 內容檔 `materials-src/<slug>/content.json`

在 `shared/materialKit.ts` 定義 TypeScript 型別與驗證函式（前端測試可直接 import）。欄位：

- `slug`（例 `heart-structure`）、`version`（例 `v2`，輸出資料夾＝`<slug>-<version>`）、`title`、`subtitle`、`label`（教材目錄顯示名稱）
- `stats`：2–4 個 `{ value, label }`
- `lab`（情境實驗室）：`{ title, intro, figure, states: [{ id, label, explain }], predict: { question, options, answer, feedback } }`；`figure` 指向 `figures/` 的狀態圖，`states[].id` 對應圖內狀態
- `nodes`：固定 ID 的知識節點 `[{ id, tag, title, summary, figure, concept, points: string[], clinical: { title, text } }]`
- `foundation`：先備題 `[{ id, stem, options, answer, hint, nodeId }]`（逐題答對才前進）
- `cases`：病例題 `[{ id, stem, options, answer, hint, nodeId }]`（全對才 `complete()`；答錯只給提示並要求回讀 `nodeId` 對應節點，沿用現行 A＋C 規則）
- `credits`：使用到的外部圖片出處（由 figures manifest 自動帶入亦可）

驗證規則：ID 皆為 `[a-z0-9-]`、全檔唯一；`answer` 必須是 `options` 之一；`nodeId` 必須存在；節點 6、先備 6、病例 5 為預設（可在內容檔以 `rules` 覆寫，但須明確寫出）。錯誤訊息點名欄位與 ID。

## 2. 元件庫 `materials-src/kit/`

純 HTML／CSS／原生 JS，**教材執行時不得依賴任何框架或外部 CDN**（`course-learning.js` 除外，沿用現行公開網址）。

**設計規範（CSS 變數，寫在 `kit.css` 開頭並另存 `docs/MATERIAL_DESIGN.md` 說明）**
- 色彩：`--oxy`（含氧血紅）、`--deoxy`（缺氧血藍）、`--tissue`（組織中性暖灰）、`--accent`（唯一強調色）、`--ok`、`--warn`、背景與文字；對比度 ≥ 4.5:1。
- 字級：內文 16px；手機上任何文字（含 SVG 圖內文字）渲染後 ≥ 12px，桌機 ≥ 14px。
- 圖示：一律內嵌 SVG（可取自已安裝的 `lucide` 圖示路徑），**不使用 emoji 當圖示**。
- 動畫：尊重 `prefers-reduced-motion`；互動元件可用鍵盤操作並有 `aria` 標示。
- 版面：桌機最大寬 1100px；≤760px 單欄；任何寬度不得出現水平捲動。

**元件**（每個元件一個函式，輸入內容物件、輸出 DOM／HTML 字串）
- `Header`（標題＋副標）、`StatTiles`
- `LabSection`：`StateFigure`＋狀態切換按鈕＋說明文字＋預測題（預測題與切換不送診斷事件）
- `StateFigure`：同一張 SVG，依 `data-state` 切換 CSS class 顯示不同狀態（例：瓣膜開合、血流箭頭方向與動畫）。**取代「四張相似插圖」的流程卡。**
- `NodeGrid`＋`NodeCard`：格子中只放圖示＋標題＋一句摘要；開啟節點後顯示大圖（寬度填滿卡片，文字可讀）→概念→重點→臨床。
- `QuizStages`：第一關先備、第二關病例，進度可見；沿用現行解鎖、回讀、通關規則。
- `Credits`：頁尾列出圖片出處與授權。

**串接（`kit.js`）**：統一包裝 `CourseLearning.explore / nodeTime / answer / complete`，節點 ID＝`<slug>-node-01…`、題目 ID 取內容檔；行為必須與現行三份教材一致（首次展開記探索、前景有效停留、每次作答回報、病例全對才通關）。

## 3. 圖庫 `materials-src/figures/`

- 每張圖一個 `.svg`，`manifest.json` 記錄 `{ file, title, source: 'original' | 外部來源名稱, license, attribution, url }`。
- 教學圖**不使用 AI 生成的點陣插圖**；自繪 SVG 示意圖為主。若使用外部醫學圖庫（例如 Servier Medical Art，CC BY），必須在 manifest 記錄授權與出處並顯示於 Credits；授權不明的圖不得使用。
- 圖內文字用 `<text>`（可被截圖檢查測量），不要把文字畫成路徑。

## 4. 建置與檢查工具

- `npm run materials:build <slug>`（`scripts/materials-build.mjs`，只用 Node 內建模組）：驗證內容檔 → 組版型 → 內嵌 kit CSS/JS 與用到的 SVG → 輸出 `public/materials/<slug>-<version>/index.html` → 以既有 `upsertCatalogEntry()` 寫入 `shared/materials.ts`（nodeTotal／questionTotal 由內容檔計算）→ `materials:sync` 更新 README。
- **版本規則**：輸出資料夾已存在時，只有「節點與題目 ID 集合完全相同」的純視覺／文字修訂才可覆寫（工具比對後允許，並在終端印出提醒）；ID 有任何增減一律拒絕，要求改 `version`。
- `npm run materials:shots <slug>`（`scripts/materials-shots.mjs`，devDependency 加 `playwright`；優先 `channel: 'chrome'` 使用本機 Chrome，失敗再用 Playwright 內建瀏覽器）：
  - 在 390×844 與 1280×800 各截全頁圖，並切換每個 lab 狀態、展開每個節點各截一張，存到 `materials-src/<slug>/shots/`（加入 `.gitignore`）。
  - 自動檢查並輸出 `report.json`＋終端摘要，任一失敗 exit code 非 0：無水平捲動；所有可見文字（含 SVG `<text>`）渲染字高符合字級下限；同一張 SVG 內 `<text>` 彼此不重疊、不被其他圖形元素遮蓋（以 bbox 交集判斷）；頁面 console 無錯誤；頁面上的節點數與題目 ID 與內容檔一致。
  - `course-learning.js` 在檢查時以本機 stub 取代（不連正式網址），並記錄收到的事件，檢查「展開一個節點只送一次 explore」。

## 5. 第一份樣板：心臟構造

- 建立 `materials-src/heart-structure/content.json`：內容從 `html/心臟構造.html` 搬移，**節點 ID（`heart-structure-node-01…06`）與題目 ID（`heart-structure-foundation-q01…q06`、`heart-structure-case-q01…q05`）完全不變**；文字照原檔，不自行改寫醫學內容。`version` 設 `v1`（尚未有正式發布版）。
- 情境實驗室改用 `StateFigure`：自繪**心臟冠狀切面示意圖**（非寫實插畫），必須正確呈現：
  - 觀看者左側為右心，右側為左心；左心室壁明顯厚於右心室。
  - 上／下腔靜脈→右心房、肺靜脈→左心房、右心室→肺動脈幹、左心室→主動脈。
  - 三尖瓣、二尖瓣（房室瓣）與肺動脈瓣、主動脈瓣（半月瓣）四組瓣膜位置清楚並標名。
  - 狀態至少兩個：**舒張期**（房室瓣開、半月瓣關，血流由心房入心室）與**收縮期**（房室瓣關、半月瓣開，血流射入動脈）；含氧血用 `--oxy`、缺氧血用 `--deoxy`，箭頭顯示方向，有動畫且支援減少動態。
- 六個節點的圖依原檔內容重畫為可讀的大圖（取代目前字只有 6–8px 的小圖）。
- 輸出到 `public/materials/heart-structure-v1/index.html`；**不要**刪除或改動 `html/心臟構造.html` 與 `html/assets/*.png`（等教師核定後另行處理）。
- 跑 `materials:shots heart-structure`，全部檢查通過。

## 6. 測試與交接

- `tests/material.test.ts`：內容檔驗證（缺欄位、重複 ID、answer 不在選項、nodeId 不存在皆報錯）；心臟構造建置結果含 6 節點＋11 題 ID、無外部 CDN、無 emoji 圖示字元；版本覆寫規則（ID 相同允許、不同拒絕）。
- 既有教材（`public/materials/` 下既有資料夾）**一律不動**；`public/materials/coagulation-v1/` 是未追蹤檔，不要碰、不要 commit。
- 不改平台前端 `src/`、Functions、Firestore；平台版本號不升。
- 驗證：`npm run check`、`npm run materials:shots heart-structure`、`git diff --check`。
- 在 `DEVELOPMENT_LOG.md` 記一段「教材元件庫 v1」；更新 `handoff.md` 待辦，標示「教材元件庫 v1 待 Claude 驗收」，並附上截圖資料夾路徑，方便 Claude 與教師檢視。
- 若自繪心臟圖在解剖正確性上沒有把握，先在 handoff 標註疑點，不要猜。

## 不在本任務範圍

轉換其他五份教材；更換教材工作室匯入流程；平台後台的教材預覽功能；深色主題。
