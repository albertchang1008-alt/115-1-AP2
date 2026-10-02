# 教師六點教材修訂：待 Claude 驗收

2026-10-02，Codex。`feature/stage1-supplement`，基底 `11cc8d0`，平台 1.6.3。依教師在本輪確認的計畫修訂；未 push、未部署，不動 main。

## 六點交付

1. **心輸出量**：節點 4、6、情境說明／圖與整理表，明寫心臟交感節後末梢釋放 NE、副交感節後末梢釋放 ACh；腎上腺髓質的腎上腺素另經血液送達。兩種來源及交感／副交感以獨立比較卡呈現，避免畫成前後相接的生理鏈。
2. **情境預測回饋**：kit 答對明示「✓ 答對了！」及原解析；錯誤明示「✗ 尚未答對」與重讀提示。選項與回饋框有正誤樣式／aria-live，文字可獨立辨識。RBC 預測同步明示正誤。預測未加入新的通關計分或題目分母。
3. **教材固定配色**：26 份資訊圖表各有獨立強調色及淡背景；15 kit、11 手工。由 `presentation.mjs` 統一管理，build 時只將 kit 中性紫色圖框／箭頭／背景換色，動靜脈、含氧／缺氧及正誤語意保留。kit 移除色系選單，仍可調字級。課程介紹、血液前後測及未登錄 coagulation 不在此次範圍。
4. **紅血球流程圖**：移除四個步驟對同一 PNG 的背景裁切；改為獨立完整 SVG，組織供氧不足、腎臟 EPO、紅骨髓、紅血球送氧，各只突出該步驟主角。手機直排保留流程箭頭；補「供氧改善→缺氧刺激減少→EPO 回降」負回饋與造血需要時間的說明。
5. **體液與血壓**：補體液／細胞外液／血漿的關係；ANP、BNP 排鈉利尿→血容量下降→回心血量下降→每搏量／CO 與血壓傾向下降。與醛固酮保鈉留水、ADH 抗利尿及 ADH 作用減少對照。保留與排出是相反方向，主圖不再以 RAAS→ADH→ANP 一條鏈表示。
6. **整理表**：閱讀頁知識節點後、診斷前呈現；CO 比較神經／內分泌來源及調節因素，血壓比較物質／來源、腎作用、容量、血壓方向，RBC 比較刺激、反應、作用與回饋，其餘以既有節點比較關鍵概念。桌面表格；390px 逐列卡片並重複欄名，16px 起，不縮小整張表或增加完成門檻。

教學依據：[NCBI Neuroscience：心血管自主神經調節](https://www.ncbi.nlm.nih.gov/books/NBK11075/)；[OpenStax A&P 2e 25.8：腎臟內分泌調節](https://openstax.org/books/anatomy-and-physiology-2e/pages/25-8-endocrine-regulation-of-kidney-function)、[25.9：體液量與組成](https://openstax.org/books/anatomy-and-physiology-2e/pages/25-9-regulation-of-fluid-volume-and-composition)。不加入利尿藥物或疾病判讀。

## 驗證與範圍

- `npm run check` 全通過：115 前端、18 Functions、兩端 build、version:check 1.6.3。
- `LEARNING_REFRESH_VERIFY.json`：26 份 × 390／1280 共 52 情境，表可見、字 ≥16px、無橫向溢位、無 console/page errors，26 套強調色不重複；kit 預測先錯再對均有可辨識回饋。手機 caption 正常橫排換行，另加幾何檢查避免逐字直排。
- `LEARNING_REFRESH_*_SHOTS.json`：CO 與血壓各 20 張材料截圖；390px 圖字最小 15.22／14.94px，無裁切／溢位。RBC 四步圖為四個不同 SVG、無 bitmap 背景裁切，圖字 ≥12px。
- `STAGE1_KIT_VERIFY.json`：14 組完整流程通過（六份新增＋ECG，390／1280）；手風琴、收合、節點頂端可見、首次 explore、nodeTime、先複習才能重試及最後答對即 complete 不變。
- `STAGE1_DRAFTS_VERIFY.json`：電性活動／RBC 的 4 組完整作答與追蹤通過。補電性活動 scroll 邊界：窄版或詳細內容頂端在畫面外時，捲到 start，避免新增表格後 nearest 留下負的頂端座標。
- `LEARNING_REFRESH_CONTENT_VERIFY.json`：15 kit 的 foundation／cases 陣列與基底完整相同、節點 ID 相同；其他手工程式完全不變，電性只有捲動、RBC 只有預測回饋的程式修正。Excel 與基底逐位元相同（SHA256 `77dd8bb43b2a639698d22632bd72f0b48c4185a2d16b658cb1622f45d8b2e9ea`），無題庫列增修。
- 110 張新增截圖見 [learning-refresh-screenshots](learning-refresh-screenshots/)。已有 kit／手工回歸截圖亦更新。

本輪回報追蹤以 SDK stub 收集呼叫；真實帳號／Firestore 上線實測仍由教師進行。所有既有題目內容、正解、ID 及完成門檻保留；未 commit RTF 或 coagulation。原手工 html 草稿保留，本輪公開版本修訂以 `public/materials/` 與產生腳本為準。
