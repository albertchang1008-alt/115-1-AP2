# ECG 模擬器與標示題：Claude 驗收紀錄

驗收：Claude（2026-09-24）｜對象：`feature/ecg-basics` 工作樹（Codex 實作，**尚未 commit**）｜規格：`docs/ECG_SIM_LABEL_SPEC.md`

## 結論：不通過，退回 Codex

以 Playwright（Chromium，1280×800 與 390×844，DPR 2）開啟重新建置的 `public/materials/ecg-basics-v1/index.html`，平台 SDK 以假物件攔截記錄事件。

## A. 阻斷性問題（頁面無法使用）

1. **整頁空白**。`kit.js` 的 `sim()` → `draw()` 內同一區塊宣告兩次 `let b`（`let b=bs.find(...)` 與 `let rr=60/hr,b=makeBeat(...)`），瀏覽器報 `SyntaxError: Identifier 'b' has already been declared`，整段教材程式不執行，學生只看到空白頁。
2. **截圖驗收沒有擋下來**。`materials-src/ecg-basics/shots/1280.png`（4.7 KB）、`390.png`（2.7 KB）都是空白圖；`report.json` 仍是 9/23 的舊版（題目 ID 還是 q02、q03、q05、q06，`errors: []`）。截圖流程需要：收集 `pageerror` 並在有錯時失敗、每次重寫 report、偵測空白畫面。

## B. 修掉 A-1 之後（Claude 在本機副本改名變數再測）仍不符規格

**模擬器（§2）**
3. 沒有動畫：沒有 `requestAnimationFrame`，只是靜態重畫固定區間；「暫停」只換按鈕文字。所以「下一拍才換心率」、呼吸性竇性心律不整、反應時間兩個開關（有勾選框但沒有接任何程式）都沒有實作。
4. 讀數在修正變數後仍拋錯 `Cannot read properties of undefined (reading 'pr')`。
5. 方格只有一種線、沒有 5 mm 大格；水平線迴圈巢狀重複繪製；沒有校正方波保留區；沒有依心率分區的生理說明（§2.3）。
6. 放大檢視在未選拍時就顯示成一大片空白區（`hidden` 被 CSS 蓋掉）；放大比例＝一個 R-R 塞滿寬度，垂直方向 R 波約 12 mm×52 px/mm，遠超過 260 px 高的畫布；標示只有 P／QRS／T 三個同色方框，沒有標籤、沒有間隔與段、沒有 R-R、沒有機械事件；三個圖層勾選框沒有接程式；沒有碰撞避讓；沒有鍵盤 ←／→；沒有卡尺（§3 全部未達成）。

**標示題（§4.2）**
7. 拖曳換算錯誤：`offsetX/(clientWidth/秒數*25)` 多除了 25，拖 300 px 實測起訖值不變（應約 0.89 s）。學生幾乎無法用滑鼠作答。
8. 四題都用固定 75 bpm、固定起點的同一段圖（應每題隨機 60–95 bpm、隨機起點），答案位置可背。
9. 起訖 range 固定 max＝3，手機畫面只有 2 秒，可選到畫面外；判定沒有排除畫面外的波段。
10. 沒有：框選秒數／小格顯示、誤框辨識（「你框的比較像 PR 段」）、起點／終點差幾小格、錯 2 次顯示正確位置、綠色答案疊圖、顯示後仍須自己框對。每次答錯都送 `hint`（規格為第一次提示送一次）。

**元件庫回歸（影響所有用 kit 的教材，含 heart-structure）**
11. `render()` 不再使用 figures：節點按鈕與展開內容的圖都被拿掉。
12. 節點按鈕的 `aria-expanded`／`aria-controls` 被拿掉（改善計畫 P1-4 要求）。
13. `nodeTime` 停留時間回報與 `visibilitychange` 處理被刪除；`explore` 改成每次展開都送（應只送第一次）。

**流程**
14. 沒有新增 `tests/ecg-model.test.ts`，`tests/material-kit.test.ts` 未改（§6）。
15. 全部改動未 commit（§0、AGENTS.md 規定要 commit 並附 `[Codex]`）。

## 已符合的部分

- `materials-src/widgets/ecg-model.js` 的 `prFor`、`makeBeat`、`beatMv`、`features` 與規格 §2.1 數值一致。
- `content.json`：第一關 2 選擇＋4 標示的 ID、順序、target、tol 正確；case-q01 已換成舒張期題；node-05 已加句；題目分母仍為 11。
- 洗牌改為 Fisher–Yates；建置腳本會把模型 inline 進單檔。

## 退回時的要求

1. 以 `materials-src/ecg-basics/reference/ecg-sim-prototype.html` 的「B. 修正版」、放大檢視、`Q` 標示題模組為基礎**移植**，保留其動畫迴圈、逐像素繪製、下一拍排程、碰撞避讓與判定／回饋邏輯；不要重新精簡改寫。
2. `kit.js` 與 widget 原始碼請維持可讀格式（不要手寫成單行壓縮），建置時再組合。
3. 恢復 kit 既有的圖、ARIA 與 nodeTime 行為；heart-structure 重新建置後除洗牌外不得有差異（請附 diff）。
4. 截圖流程：`pageerror` 或 console error 即失敗、每次重寫 report、空白畫面判為失敗；補上規格 §6 的截圖清單。
5. 補齊 §6 單元測試，完成後 commit（附 `[Codex]`），再標示待驗收。

## 後續處理（2026-09-24）：教師決定改由 Claude 直接完成

- `kit.js` 以原本（HEAD）版本為基礎改寫成可讀格式，恢復節點圖、ARIA、nodeTime；新增 lab widget 與題型擴充點；`explore` 改為每節點只送第一次；實驗室切換同時設定 `data-state`（修正心臟構造「收縮期」按鈕原本不會切換圖的問題）。
- 新增 `materials-src/widgets/`：`ecg-model.js`（純模型＋判定）、`ecg-draw.js`、`ecg-sim.js`、`ecg-label.js`，由試作頁移植。
- 截圖流程改為：pageerror／console error／空白畫面／水平捲動／互動失敗皆判失敗；每次重寫報告；SDK 以本機副本載入。以 Codex 的空白頁版本實測，會正確判為失敗。
- 驗收結果：單元測試 10/10；四份教材截圖 0 錯誤；ECG 互動驗收（模擬器 4 種心率讀數、暫停選拍、放大、Esc、卡尺、暫停中改尺寸、6 題第一關含誤框辨識與顯示答案、第二關、SDK 事件序列）在 390／1280 皆通過；心臟構造渲染結果除新增 `data-state` 外與原版完全相同。
- 竇房結頻率統一為「安靜時約 70~80 次／分」（教師決定）。
