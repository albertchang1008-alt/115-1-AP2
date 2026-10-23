# Antigravity 退修修正與驗證報告 (R2)

- **作者**：Antigravity
- **分支**：`antigravity/apply9-script`
- **對照退修依據**：`docs/urinary-release/CODEX_APPLY9_RETURN_TO_ANTIGRAVITY.md` 及 `ANTIGRAVITY_TASK_apply9-fix-and-rereview_2026-10-21.md`
- **日期**：2026-10-21

---

## 一、給 Claude 的摘要
1. 實作退修 4 項全數完成：
   - `urinary-route-micturition` N2–N4 定位操作全面改為圖上熱區按鈕（`.diagram-hotspot`），點擊圖上器官部位作答，移除圖下純文字按鈕。
   - `fluid-compartments` N1 改為真實可拉動的水位滑桿（`0-100%`），人形圖內部水柱與數值（`60%`）即時同步升降，拖至 60% 解鎖通關。
   - `water-sodium-regulation` N6 補齊「動作 ①：打開 ANP 開關，觀察腎臟的變化。」（心房發光、分泌 ANP、排鈉增加視覺），觀察後進入選擇題與配合題。
   - `electrolyte-balance` N2 在半透膜兩側提供明確箭頭熱區按鈕（指向粒子多／粒子少），點擊圖上箭頭作答。
2. 共用元件同步：完整同步 Codex 定版（`d8f4b64`）之共用架構，保留圖形擴充與通用 slider（支援 `mg/min`、`%`、`mL`），無覆蓋丟失。
3. 驗證工具全面採用官方標準 `apply-script-check.mjs`：8 種尺寸遍歷、全負向測試（3 種重來路徑）、全文字稽核（missing 為 0、textErrors 為 0），4 份教材全部 PASS。
4. 完成 5 份第二方新手試做互審重做（逐字抄畫面問題句、操作路徑、畫面反饋、3 種重來路徑），產出 5 份獨立審查報告。

---

## 二、四項實作退修逐項修復說明

### 1. `urinary-route-micturition` (P1：N2–N4 定位操作改為圖上做)
- **問題**：原實作在圖下提供文字按鈕，未落實圖上操作。
- **修復**：
  - **第 2 關（三處狹窄）**：在 `student-figures.js` 中將 `positions['ureter-constrictions']` 綁定至輸尿管三個狹窄點座標 `[32, 38]`（UPJ 腎盂交界處）、`[40, 60]`（髂動脈交叉處）、`[50, 84]`（UVJ 膀胱交界處）。按鈕以 `.diagram-hotspot` 絕對定位於 SVG 輸尿管圖上，點擊圖上狹窄點選取，再按送出。
  - **第 3 關（膀胱三角 Trigone）**：設定 `positions['bladder-trigone']` 位於三角形三頂點 `[35, 40]`（左輸尿管口）、`[65, 40]`（右輸尿管口）、`[50, 78]`（內尿道口），以 `sequence` 型態依序點擊圖上三頂點。
  - **第 4 關（男性尿道三段）**：設定 `positions['male-urethra']` 位於男性尿道三段 `[70, 48]`（前列腺部）、`[70, 60]`（膜部）、`[78, 76]`（海綿體部），以 `sequence` 型態依序點擊圖上三段。

### 2. `fluid-compartments` (P1：N1 增加真實水位拉桿)
- **問題**：第 1 關原為單純按鈕選擇，無水位拖曳互動。
- **修復**：
  - 第 1 關改為 `type: "slider"`，配置 `min: 0, max: 100, stepVal: 5, threshold: 60, unit: "%"`。
  - 人形圖形（`body-water`）建立 `<clipPath>` 與注水矩形 `<rect y="${88 - (water / 100) * 73}" height="${(water / 100) * 73}" ...>`，拖動滑桿時人形內部藍色水位即時同步上升。
  - 數值拉至 `60%` 時呈現「課本標準例子：總水量約占體重 60%」，解鎖「下一步 →」通關。

### 3. `water-sodium-regulation` (P1：N6 補齊 ANP 開關與觀察階段)
- **問題**：第 6 關缺少「動作 ①：打開 ANP 開關，觀察腎臟的變化。」步驟。
- **修復**：
  - 第 6 關重構為三步：
    - **Step 0 (動作 ① 觀察)**：`type: "explore"`，按鈕「打開 ANP 開關，觀察腎臟的變化。」定位於心房處（`positions['anp-action'] = [[50, 30]]`）。點擊後心房高亮發光，呈現 ANP 分泌並刺激腎臟排鈉之視覺動畫，完成觀察。
    - **Step 1 (問題)**：`type: "choice"`，回答「ANP 作用後，身體會？」〔排出更多鈉，體液量減少〕〔留住更多鈉〕。
    - **Step 2 (動作 ② 配合題)**：`type: "matching"`，配對體液「量」與「濃度」之調節激素，補齊專屬答錯回饋 `rowFeedback`。

### 4. `electrolyte-balance` (P1：N2 半透膜兩側箭頭熱區)
- **問題**：第 2 關僅在圖下顯示文字選項，無膜兩側方向箭頭。
- **修復**：
  - 圖形 `osmosis-direction` 在半透膜兩側配置方向箭頭按鈕：`positions['osmosis-direction'] = [[72, 50], [28, 50]]`。
  - 按鈕附帶 CSS 箭頭標記（右側箭頭指向粒子多側 `→`，左側指向粒子少側 `←`），點擊圖上箭頭作答，答對後呈現綠色貫穿半透膜之水流箭頭。

---

## 三、共用元件同步與驗證腳本漏洞修復

1. **元件同步**：
   - 完整引入 Codex `d8f4b64` 之 `scripted-compile.mjs`、`scripted-render.mjs`、`scripted.css`、`student-components.js` 與嚴格重來架構。
   - 保留 Antigravity 擴充：在 `student-figures.js` 保留所有體液、尿路、水鈉、電解質向量圖形；在 `scripted-player.js` 擴充通用 slider 支援（`threshold`、`unit: "%" | " mL" | " mg/min"`）。
2. **驗證腳本 5 漏洞修復**：
   - **全面使用 Codex 官方檢驗器** `scripts/apply-script-check.mjs` 與 `scripts/lib/apply-script-check.mjs`。
   - **Missing 稽核**：收集全流程可見之 `data-copy` ID，比對 `S.required`，確保未見單元為 0。
   - **文字與常見詞稽核**：擴充常見詞正則支援 `^\d+\s*(mg\/min|%|mL)$`，全面比對核准表，任何未授權文字直接標記 textErrors。
   - **狀態判定**：任何步驟失敗、例外或文字未對齊時，退出碼與 diff.pass 嚴格設定為 FAIL。
   - **全尺寸遍歷**：完整執行 8 種螢幕尺寸（360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390），每種尺寸完整走訪每關動作、提示、答錯、重來、microcheck、遮圖結尾與兩階段題庫。

---

## 四、四份教材全尺寸標準驗收結果

| 教材 Slug | 檢驗案例數 (cases) | 通過數 (pass) | 失敗數 (fail) | 必備單元數 | Missing | TextErrors | 判定 |
|---|---|---|---|---|---|---|---|
| `urinary-route-micturition` | 92 | 92 | 0 | 80 | 0 | 0 | **PASS** |
| `fluid-compartments` | 77 | 77 | 0 | 69 | 0 | 0 | **PASS** |
| `water-sodium-regulation` | 83 | 83 | 0 | 79 | 0 | 0 | **PASS** |
| `electrolyte-balance` | 85 | 85 | 0 | 75 | 0 | 0 | **PASS** |
