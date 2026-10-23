# Codex 交辦：泌尿階段二（2026-10-16，Claude）

## 基本設定

- 工作位置：`~/.codex/worktrees/urinary-stage1-2026-10-16/課程平台1.0`，分支 `feature/urinary-infographics`，基底 `1a8d405`。
- 開工前讀：
  - 主目錄 `docs/URINARY_STAGE1_CLAUDE_RECHECK_2026-10-16.md`
  - 本檔
  - `docs/FIGURE_STYLE_GUIDE.md`
  - `docs/urinary-fluid-specs/kidney-anatomy.md`
  - `docs/urinary-release/stage1-figure-map.json`
- 先把主目錄的 `docs/URINARY_STAGE1_CLAUDE_RECHECK_2026-10-16.md` 與本檔複製進分支的 `docs/`，和本輪成果一起提交。

## 本輪範圍

本輪分三段，**B 段只做腎臟一份試作**。Claude 看過試作的畫面與做法，才會交辦其餘四份，避免五份一起重做。

### A. 六份共同的內容小修

1. **出處列統一。**五份的節點 `reference` 與頁尾 `credits` 改成尿路那份的中文格式，例如：
   - 節點：「《解剖學》泌尿系統，第 2–3 頁；《生理學》腎臟與體液的恆定，第 2 頁。」
   - 頁碼合併成區間，去掉重複。
   - 不顯示卡片 uid，也不顯示 AB-05_15、CH09 這類代碼。
   - 機器可讀的 `sources` 欄位一律保留原值，不動。
2. **過濾 node-03 clinical** 的開頭「題目若指定比較血漿與濾液，」改為「比較血漿與濾液時，」，後半句不變。
3. **改完自動比對**：除了上面兩項，其他欄位必須與 1a8d405 完全相同。

### B. 標籤層試作：只做 `kidney-anatomy`

以呼吸道 V2 的做法為範本：`scripts/airway-figures.py` 和 `docs/AIRWAY_FIGURES_V2_REPORT.md`，也就是底圖加上原生中文 SVG 標籤。

1. **每個節點的標籤**
   - 照 spec 該節點的標籤清單逐一標注，不增不減。
   - 照 `FIGURE_STYLE_GUIDE.md` 第三、四節：標籤放在底圖外側欄或留白處，引線末端以圓點對準構造，文字一律黑色。
   - 手機 390 px 寬時圖內字 ≥ 12 px，1280 px 寬時 ≥ 13 px。
2. **遵守 `stage1-figure-map.json` 的逐圖審查備註**，特別是：
   - node-01 是前面觀，畫面左邊是身體右側。標籤要寫「右腎」「左腎」，不寫「畫面左／右」。
   - 底圖畫了腎上腺，但 spec 沒有列，**不要標**。
   - node-05 兩腎畫成等高，這張圖**不用來教**兩腎高低。
3. **總覽三個狀態**（位置、切面、功能）
   - 用紅字或高亮切換重點。
   - 重點標示方式教師還沒選定 A 或 B，**本輪沿用紅色粗體**，但要寫成單一 CSS 變數或 class。之後改成 B（黑字＋淡橙色塊）時，只需要改一處。
4. **箭頭**：只有 spec 有要求的圖才加箭頭，並遵守箭頭文法（顏色、虛實、粗細三級、①②③ 步驟編號）。
5. **換掉階段一佔位文字**
   - `lab.intro` 的「本階段共用無字底圖，圖上標籤與狀態圖層尚未製作」改成正式導讀。
   - 各節點 caption 的「無字底圖。」改成正式圖說，一句話說明這張圖在看什麼。
6. **驗證**
   - preview、shots（1280／390，含 3 個狀態和 6 個節點）。
   - 逐一檢查標籤文字框、引線、錨點：不重疊、不出界、字級合格、無水平捲動、0 pageerror。
   - 引線錨點要落在正確構造上：列出每條引線的錨點座標，並各做一張 crop 截圖給 Claude 核對。
7. **不能做的事**：不改底圖檔案本身，不重畫圖，不加入 spec 沒有的構造名稱。

### C. 只有在教師已核可卡片時才做（D2）

- 開工時檢查 `urine-physical-properties`。
- 若已經是 reviewed：
  - 補 `urinary-route-micturition` 的 node-06，以及 foundation-q06「每日尿量、比重、pH 是不同的量」、case-q05「尿量與比重不同」。
  - 正解位置延續 0→1→2→3 循環。
  - 數值只能用卡片上的數值。
  - 重跑這一份的 schema、preview、shots，以及全庫節點稽核。
- 若仍是 draft：完全不動，在報告寫「D2 仍待教師」。

## 收工

- 兩站共用的教材測試要通過，0 skipped；`git diff --check` 通過。
- 報告寫在 `docs/urinary-release/STAGE2_REPORT.md`，列出：
  - A 的比對結果；
  - B 的標籤清單對照 spec、錨點表與截圖路徑；
  - C 的狀態。
- 在 feature 分支本機 commit 一次，結尾 `[Codex]`，然後停下交 Claude 複驗。

## 一律禁止

- 不執行 `materials:build`、不登錄 `shared/materials.ts`、不寫 Excel／Sheet。
- 不 push、不合併 main、不部署。
- 不改卡片或進度檔，不改共用驗證器。
- 不做體液四份。
