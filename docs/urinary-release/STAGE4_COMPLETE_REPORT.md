# 完整製作：階段四報告

四份體液教材完成：24節點、44題與4題預測；各6先備＋5情境、總覽3態。四份各有20張最終截圖，合計80張。

| 教材 | schema／NodeText／reviewed來源 | 最終圖面案例 | 標準shots | 預測正解位置 |
|---|---|---|---|---|
| fluid-compartments | 通過 | 18／18 | 20／20 | 2 |
| water-sodium-regulation | 通過 | 18／18 | 20／20 | 3 |
| electrolyte-balance | 通過 | 18／18 | 20／20 | 0 |
| acid-base-homeostasis | 通過 | 18／18 | 20／20 | 1 |

- 最終十份並列截圖集：[screenshots.html](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/screenshots.html)。寬度與畫面選單可讀全部200張圖；點圖放大，附十份完整preview連結。
- 14張體液原圖的審查快照及SHA：fluid/asset-review.json；主目錄原檔與worktree副本均未改。
- 錨點／crop：[ANCHOR_TABLE.md](ANCHOR_TABLE.md)；資料層：[data/SLOT_MAP.md](data/SLOT_MAP.md)。
- 電解質01照審查只顯示左欄原分子，原右側錯誤粒子數以SVG clip隱去；精確原生模型為同6份起始分子對應6、12、18粒子，每份以外框分組。手機編號避開所有分子與粒子；final/particle-visibility.json在兩尺寸、兩圖證明36粒子可見且0編號遮擋。原圖檔未裁改。
- 酸鹼06於管腔側原生疊加NH₃、NH₄⁺及磷酸鹽符號，H⁺承接和尿液排出方向分開。
- RAAS依①–⑤標明訊號順序，手機結構標籤改A–G避免混淆；兩尺寸18案例通過。
- 水與離子箭頭通過相應通道；ADH與口渴用功能說明，避免誤指水分子或腦幹。激素只教作用，不延伸腺體構造。
- 比例圖共同分母清楚；14獨立原生SVG＋PCT條涵蓋全部核定資料位。全系列箭頭色表見COMPLETE_REPORT。
- 選項輪替前後48筆正解文字逐題相同：fluid/answer-text-comparison.json；44題循環0→1→2→3，預測接續為2、3、0、1。
- 中文出處列用書名及合併頁碼；RAAS使用實際reviewed卡的第5章來源，不把舊spec的CH09頁碼冒充該卡frontmatter。
- 用詞掃描只有「鈉尿肽」子字串命中，完整詞為spec明定的「心房利鈉尿肽」，人工核對通過，掃描設定不修改；疾病、藥物、處置詞無命中。
- electrolyte-osmolarity與calcium-phosphate-balance雖reviewed仍保留needs_review=true；依交辦附條件使用，疑義公式與分泌細胞身分已排除，旗標不改。見final/conditional-source-flags.json。
- Hans-Hant完整稽核：十份與70圖檔、2963段文字，0差異。首次Swift快取無寫入權，將module cache指定/tmp後同一支腳本成功，未改檢查。
- 新最終擷取腳本初次DOM定位漏掉anatomy-main容器，修正定位後200張與180案例成功（1/2次）；沒有刪除檢查。
- 保護範圍：160既有檔案SHA比對；共用程式僅四個210藍色配色新增鍵，其餘共用核心／驗證器／測試、原圖及既有來源卡不變。
- 本階段commit為本報告所在提交，訊息「完成階段四與十份教材畫面交付 [Codex]」。停止交Claude總驗收。
