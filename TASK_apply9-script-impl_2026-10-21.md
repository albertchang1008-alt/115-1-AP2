# 任務：泌尿＋體液 9 份照學生腳本實作（Codex 與 Antigravity 分工互審）2026-10-21

**前置：** 9 份腳本與 ※ 已於 10/21 14:22 經教師核可。須等 #6h 酸鹼配合題改版（MATCHING_QUESTION_UI）合入 codex/acidbase-full、Antigravity 新手試做通過後才開工，以沿用配合題元件。

**規格：**
- 每份腳本逐字照抄；元件、版面、規則與酸鹼樣張（分支 codex/acidbase-full，含 Codex 小修）完全相同。
- 規則依 DECISIONS 10/21：一次一個動作、上方大字問題、💡提示、就地回饋、心智圖逐關長出、結尾遮圖三格、過渡頁鼓勵。

**分工：**
- Codex：kidney-anatomy、nephron-circulation、filtration-clearance、tubular-handling、urine-concentration
- Antigravity：urinary-route-micturition、fluid-compartments、water-sodium-regulation、electrolyte-balance
- 從 codex/acidbase-full 各開分支：codex/apply9-script、antigravity/apply9-script。

**每份必做：**
1. 每一關都有 SVG 圖，動作都在圖上做；節點內不能有 <select>，也不能用彈窗。
2. SCRIPT_DIFF 對該份腳本：缺 0、多 0。
3. 跑 content-check、layout-check（8 種尺寸）與測試，全部通過。
4. 截圖：390×844 與 1280×800，每關拍動作前、提示、答錯、答對，加上結尾與過渡頁，每張附一句描述。
5. 兩階段考題：依教師 10/21 裁定，把 FIGURE_DEPENDENT_QUESTIONS.md 的 11 份改寫稿套進各份 apply.json 的兩階段題（逐字照抄稿件；fluid-case-q03 的 U 題也採用改寫稿（教師 19:12）；共 11 份改寫稿全部套用）。其餘題目不改；誘答過明顯的 44 題這次維持原樣。腳本中的配合題一律依 docs/MATCHING_QUESTION_UI.md；答錯重來一律依 DECISIONS 10/21 15:04（丙）。

**互審：**
- 兩邊都做完後交換。每一份都要逐關「新手試做」：只操作畫面，記錄卡在哪裡；並重跑 SCRIPT_DIFF。
- 結果寫成 REVIEW_<slug>.md。審的人不改程式，有問題退回作者修。

**交付：**
- 不 push main、不部署、不合併、不改 Excel。commit 訊息標記作者。
- CODEX_QUEUE #6j 改為「停-等Claude」；跑 devlog；報告開頭寫「給 Claude 的摘要」。

## 10/21 19:10 Claude 補充（酸鹼定版 0594eb3）
- 基底：從 codex/acidbase-full 的 0594eb3 開分支。配合題逐列選單、就地交換、答錯重來（丙）都直接沿用。
- 共通小修，9 份與酸鹼一起改，由 Codex 在自己的分支先改共用元件，Antigravity 合併後使用：
  1. 配合題有多列錯時，每一列錯誤列都要顯示自己的那句回饋。目前只顯示一句，例如第 1 關錯兩列只出現「腎」的說明。
  2. 手機版的配合題畫面上，該關的圖仍要看得到（可以縮小放在題目上方），作為對照。
