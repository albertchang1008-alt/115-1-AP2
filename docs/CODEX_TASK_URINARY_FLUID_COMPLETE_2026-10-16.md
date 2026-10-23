# Codex 交辦：泌尿六份與體液四份做到「可看畫面」（2026-10-16，Claude）

教師希望一次做多一點、少來回。本交辦把泌尿與體液剩下的製作工作合成一份，**中途不停下等 Claude**，做到十份都能在預覽頁看完整畫面為止。

## 基本設定

- 工作位置：`~/.codex/worktrees/urinary-stage1-2026-10-16/課程平台1.0`，分支 `feature/urinary-infographics`。
- 開工前讀：
  - 主目錄 `CODEX_TASK_URINARY_STAGE2_2026-10-16.md`（本交辦的前一份）
  - `docs/URINARY_STAGE1_CLAUDE_RECHECK_2026-10-16.md`
  - `docs/FIGURE_STYLE_GUIDE.md`
  - `docs/URINARY_FLUID_INFOGRAPHICS_SPEC.md` 與 `docs/urinary-fluid-specs/`
  - 體液四份的詳細規格：依 10/15 盤點紀錄所在位置
  - `docs/urinary-release/stage1-figure-map.json`、`stage1-image-review.json`
- 範圍終點：十份都有完整的 preview 與截圖。**不 build、不登錄、不寫 Excel／Sheet、不 push、不合併 main、不部署**；正式登錄要等教師看過畫面。

## 工作規則

- **中途不停下。**每完成一個階段就寫進報告並本機 commit 一次，然後接著做下一階段。只有「一律停下」的情況才停。
- **Claude 平行審查。**你交出某一階段的報告後，Claude 可能先審。若在你做後面階段時收到 Claude 的修正（例如腎臟試作的問題），先做完手上那一份，再把修正一併套用到已完成和之後的每一份。
- **自己寫的腳本**若是腳本本身出錯，可以修好重跑，最多兩次；不得放寬或刪減檢查，報告要寫錯在哪、怎麼修。
- **教材不合格時不能硬過**：文字重疊、出界、字級不足、錨點錯位、pageerror 都要修正教材，不可以改檢查來通過。
- **有疑義的內容先跳過**（教師規則）：不寫進教材，在報告列出，不停下等裁定。
- **共用程式**：不修改共用驗證器、測試與 kit 核心；配色表只能新增鍵。

## 階段一：完成泌尿階段二（若前一份交辦已完成，就跳過已完成的部分）

1. A 段六份出處列與措辭小修。
2. B 段腎臟標籤層試作與驗證：截圖、錨點表、crop。
3. C 段尿路第 6 節與兩題。卡片 `urine-physical-properties` 已是 reviewed，規則照前一份交辦第 C 段。

## 階段二：泌尿其餘五份標籤層

對象：`nephron-circulation`、`filtration-clearance`、`tubular-handling`、`urine-concentration`、`urinary-route-micturition`。

做法與腎臟試作完全相同：
- 照 spec 標籤白名單，不增不減；照 `stage1-figure-map.json` 逐圖審查備註。特別注意：
  - tubular 03 的鉀、鈉方向由標籤層標示；
  - urinary 04 膀胱頸旁的腺體不標；
  - urinary 05 男女對照要上下維持，兩格之間保留白色間隔。
- 總覽三狀態，重點標示用**紅色粗體**（教師已選 A），維持單一變數。
- 箭頭照 `FIGURE_STYLE_GUIDE.md` 第三節的文法；尿液、水、離子等「其他物質」的顏色由你訂，全單元一致，並避免紅綠並用。顏色表寫進報告。
- 換掉所有階段一佔位文字（`lab.intro`、caption）。
- 尿路第 6 節若仍沒有底圖，維持佔位圖，caption 寫「本節圖待製作」。

## 階段三：泌尿的資料層（原生 SVG）

依 spec 與 10/13 教師裁定（C1：資料層改原生 SVG），泌尿各份中標為資料層的圖位一律用程式畫，不交給 ChatGPT。例如：
- 過濾壓的分項加總：55＋0－15－30＝10 mmHg
- 近曲小管再吸收比例：Na⁺ 約 67%、水約 75%
- 葡萄糖最大轉運量：375 mg/min

規則：
- 數值只用 spec 與 reviewed 卡上的數值；腎血流不標數字。
- 比例條或曲線的比例必須正確，座標軸標出單位。
- 和標籤層使用同一套字級、配色與箭頭文法。
- 每個資料層圖位列一筆對照：圖位 ID、資料來源卡、數值、截圖。

## 階段四：體液四份（從內容到標籤層一次做完）

對象：`fluid-compartments`、`water-sodium-regulation`、`electrolyte-balance`、`acid-base-homeostasis`。

六張體液卡（水攝取排出、電解質滲透、氯、鈣磷、鎂、尿液特性）已全部 reviewed。

1. **內容**：做法與泌尿階段一相同。
   - 每份 6 節點、先備 6 題、情境 5 題、總覽 3 狀態，只用 reviewed 卡。
   - 正解位置依 0→1→2→3 循環；六份預測接續泌尿的輪替。
   - 出處列用中文書名格式，學生可見文字不出現卡片 uid、課本代碼或編者語。
   - 教師附條件照辦：
     - `electrolyte-osmolarity` 不出 mEq 數值換算題；
     - `calcium-phosphate-balance` 不標降鈣素分泌細胞。
   - 用詞照教師裁定併呈：「逼尿肌（迫尿肌）」「紅血球生成素（腎紅血球生成因子）」。
2. **配色**：配色表新增四個體液 slug，同一色相 210（藍）。只新增鍵，不動其他。
3. **標籤層與資料層**：
   - 底圖用已通過審查的 14 張體液 ChatGPT 圖；
   - 規則同階段二、三；
   - 體液的比例圖（例如體液分布）用原生 SVG。
4. **和內分泌的重疊**：醛固酮、抗利尿激素在這裡照卡片教，不延伸到腺體構造。

## 驗證（每一份都要做）

- schema、validateNodeText、用詞掃描（含簡體字、大陸用語、疾病藥物處置詞）。
- preview，以及 shots：1280 與 390，含初始頁、3 狀態、6 節點。
- 文字框與引線不重疊、不出界；手機字 ≥ 12 px、桌機 ≥ 13 px；無水平捲動；0 pageerror。
- 錨點表與每條引線的 crop。
- 正解文字前後比對：只要有選項重排，就要逐題比對。
- 最後跑一次全庫節點稽核 `npm run materials:validate-nodes`，以及共用教材測試，0 skipped。

## 交件

`docs/urinary-release/COMPLETE_REPORT.md`，依階段一到四分節，每節列：
- 完成的份數與 commit；
- 驗證結果表（每份一列）；
- 錨點表與資料層對照的檔案路徑；
- 截圖總覽頁：**請產生一個 HTML 截圖集，十份並列，方便教師一次看完**；
- 跳過的疑義內容與原因；
- 箭頭顏色表。

全部完成後停下，交 Claude 總驗收，之後再由教師看畫面。

## 一律停下的情況

- 需要動共用驗證器、測試或 kit 核心才能過關。
- 需要使用未 reviewed 的卡，或 spec 沒有的數值。
- 底圖解剖有錯，必須重畫才能標注。
- 工具錯誤修兩次仍無法排除。

## 一律禁止

- 不執行 `materials:build`，不登錄 `shared/materials.ts`、manifest，不寫 Excel／Sheet。
- 不 push、不合併 main、不部署。
- 不改卡片或進度檔，不改底圖原檔，不自行畫解剖底圖。
