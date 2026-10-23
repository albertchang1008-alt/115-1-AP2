# 給 Claude 的摘要
- 已完成 A 抽查修正＋B 接手四份；整合分支 codex/apply9-final，父系含 993d21c 與 df77a38。
- 程式提交 e1dafe58（合併＋點名修正）、ffecea67（逐關圖形／指令補修）、2c3b0e09（最後洩答修正）；未合併 main、未 push／部署／改 Excel／reviewed。
- 檔案：materials-src/apply-kit/{scripted-compile.mjs,scripted-player.js,student-figures.js,scripted.css,semantics.mjs}、四份 plan、scripts/lib/apply-script-*、tests/apply-final-ui.test.mjs。
- PASS：9 份 SCRIPT_DIFF 共 707 單位，全部缺 0 多 0；八尺寸 5872/5872；content-check 9/9。
- PASS：npm run check 前端 163／Functions 61，教材回歸 58；11 題改寫逐欄覆核保留。
- 偏離：未改教師腳本；新增修復逐關發現的佔位圖、提前指令與舊版水鈉資料缺件，詳下文；無待修項目。
- 請教師試用 9 份。抽查：濾過 N3、腎管 N4、體液 N1、尿路 N2–N4、水鈉 N6／電解質 N2（最多五組）。

## 教師試用
[九份預覽首頁](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/index.html)；[54 關檢查表](NODE_CHECKLIST.md)。目前僅本機預覽，正式教材／題庫與平台尚未變更。

| 教材 | 八尺寸狀態 | SCRIPT_DIFF 必見單位 | 本機預覽與截圖 |
|---|---|---|---|
| kidney-anatomy | 652/652 | 83／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/kidney-anatomy/preview.html)・[截圖](final/kidney-anatomy/SHOTS.md) |
| nephron-circulation | 659/659 | 76／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/nephron-circulation/preview.html)・[截圖](final/nephron-circulation/SHOTS.md) |
| filtration-clearance | 628/628 | 78／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/filtration-clearance/preview.html)・[截圖](final/filtration-clearance/SHOTS.md) |
| tubular-handling | 644/644 | 80／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/tubular-handling/preview.html)・[截圖](final/tubular-handling/SHOTS.md) |
| urine-concentration | 654/654 | 87／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/urine-concentration/preview.html)・[截圖](final/urine-concentration/SHOTS.md) |
| urinary-route-micturition | 701/701 | 80／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/urinary-route-micturition/preview.html)・[截圖](final/urinary-route-micturition/SHOTS.md) |
| fluid-compartments | 618/618 | 69／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/fluid-compartments/preview.html)・[截圖](final/fluid-compartments/SHOTS.md) |
| water-sodium-regulation | 643/643 | 79／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/water-sodium-regulation/preview.html)・[截圖](final/water-sodium-regulation/SHOTS.md) |
| electrolyte-balance | 673/673 | 75／缺 0 多 0 | [預覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/electrolyte-balance/preview.html)・[截圖](final/electrolyte-balance/SHOTS.md) |

每份 final/<slug>/ 內有 SCRIPT_DIFF.json/txt、layout-results.json、preview.html、SHOTS.md 與 shots/。390×844 每關都有作答前、錯誤與正確；多步關卡以 S1／S2 分別記錄，探索／滑桿步驟的錯誤由該關後續可判錯動作留證；體液 N1 本身直接測放開判分。1280×800 另附完整狀態。
八尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。

## A：Codex 抽查修正
| 項目 | 修正 | 390×844 前後 |
|---|---|---|
| 濾過 N3 | 引導改為「先點選一個物質，再選它過得去還是過不去。」；寬幅參考圖實際圖形寬至少八成，血液／濾液標籤與圖分開 | [前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/before/filtration-clearance/N3-390-before.png)・[後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/filtration-clearance/shots/390x844-N3-before.png) |
| 腎管 N4 | 補 x／y 軸名稱、藍橘圖例與 375 刻度；起初只有座標軸，曲線只畫到目前負荷，超過 375 才出現尿糖橘線；作用結論指令也延至操作完成後顯示；標籤跟隨圖座標且不攔點擊 | [前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/before/tubular-handling/N4-390-before.png)・[後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/tubular-handling/shots/390x844-N4-before.png) |
| 五份共通 | 分類引導以「項目」稱呼，物質分類再用專用文案；配合參考圖只列角色／物質名，不先把待配的數值擺成答案對應 | [五份逐關表](NODE_CHECKLIST.md) |

原五份其他關沒有新增數值曲線；同樣檢查預選、答案高亮、引導與版面。題幹明示的知識或先認識內容保留，不改教師核定腳本。

## B：接手四份與逐關追加修正
| 教材／關 | 修正與實際覆核 | 證據 |
|---|---|---|
| 體液 N1 | 起始 0%，只顯示目前滑桿值；人形內水位同步升降；拖動中不判分，放開判分，鍵盤調整後 Enter 送出；錯誤整步清零 | [前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/before/fluid-compartments/N1-390-before.png)・[後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/fluid-compartments/shots/390x844-N1-before.png)・[錯誤](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/fluid-compartments/shots/390x844-N1-S1-wrong.png) |
| 尿路 N2 | 作答前無橘點或名稱、無圖下文字答案；透明熱區至少 44×44，直接點圖，選對才顯示標記名稱；點錯空白部位整步重來 | [前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/before/urinary-route-micturition/N2-390-before.png)・[後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/urinary-route-micturition/shots/390x844-N2-before.png)・[答對](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/urinary-route-micturition/shots/390x844-N2-S1-correct.png) |
| 尿路 N3 | 改成三個開口分別點擊；先點任一輸尿管口均可，再點另一口，最後尿道內口；不先畫正確三角或選中色 | [答前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/urinary-route-micturition/shots/390x844-N3-before.png)・[答對](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/urinary-route-micturition/shots/390x844-N3-S1-correct.png) |
| 尿路 N4 | 長度配合尚未完成時不提早顯示男性三段指令；完成後另一步直接點圖上三段，標籤於點選後出現 | [答前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/urinary-route-micturition/shots/390x844-N4-before.png)・[三段操作](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/urinary-route-micturition/shots/390x844-N4-S2-correct.png) |
| 水鈉 N6 | 實際點 ANP 開關，心房／腎圖變化後才回答後續問題及配合題；不只有顯示開關指令 | [答前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/water-sodium-regulation/shots/390x844-N6-before.png)・[開啟後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/water-sodium-regulation/shots/390x844-N6-S1-correct.png) |
| 電解質 N2 | 可直接點圖上兩方向箭頭，兩個選項作答前同為中性色（含舊 CSS 優先序覆蓋的瀏覽器斷言）；答對後才顯示向粒子多側的水流 | [答前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/electrolyte-balance/shots/390x844-N2-before.png)・[答對](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/final/electrolyte-balance/shots/390x844-N2-S1-correct.png) |
| 額外逐關修復 | 尿路 N6、水鈉 N3、電解質 N1/N3–N6 原本落入通用佔位圖，已補尿杯、缺水／腎圖、粒子容器、價數示意與細胞膜。水鈉 N4 改用腎元近腎絲球圖與匿名熱區；體液 N3 調整血漿／組織間液色塊位置，N4 確實畫四個水箱；體液 N5 的蛋白質阻擋指令／效果只在作答後出現 | [24 關操作紀錄](visual-review/)・[全部關卡索引](NODE_CHECKLIST.md) |

水鈉的舊 apply.json 引用了未帶入的圖片，已從基底原樣張補齊六張 SVG 與 overview。舊版樣張凍結規則僅精確允許教師已核定的那題 stem/options/answer，其他來源／文字／提示仍鎖定；有負向測試證明任意改標題或提示會 FAIL。沒有放寬來源審查，沒有為通過而改 reviewed。

## 驗證指令與原始輸出
- `npm run check`：[完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/npm-check.txt)，163／61 PASS、型別／版本／建置 PASS。
- `node --test tests/apply-*.test.mjs tests/acidbase-*.test.mjs`：[58 項輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/material-tests.txt)。包含真實拖動、放開判分、44px、錯點重置、三開口順序、分步指令、80%圖寬與標籤分離、曲線及凍結規則的負向測試。
- `node scripts/apply-script-check.mjs <slug> --out docs/urinary-release/apply9-final/final/<slug>`：[批次 A](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/batch-a.txt)、[B](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/batch-b.txt)、[C](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/batch-c.txt)、[D](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/batch-d.txt)。使用 Codex 檢查器，未採用作者原先固定列 PASS 的結論。最後兩項補修另附 [腎管重驗](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/tubular-final.txt)、[電解質重驗](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/electrolyte-final.txt)，以 final/ 最新 JSON 為準。
- `node scripts/apply-content-check.mjs materials-src/<slug>/apply.json --cards <01_knowledge> --progress <todo_all.jsonl> --out ...`：[9 份完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/content-check.txt)與 content/*.json。卡片只讀，未改知識庫。
- [11 題改寫逐欄覆核](question-rewrite-review.json)：只動核定 ID 的 stem/options/answer，其餘欄位及 44 題原樣保留。
- [來源與結果清單](MANIFEST.json)：原腳本 SHA、必見單位數、預覽 SHA、各關圖型與步驟。

四份逐關覆核是 Codex 接手後的畫面／操作檢查，部分自動到達流程使用編譯答案，沒有注入進度；不宣稱為另一方的獨立新手認證。本次教師已授權 Codex 接手完成，交付停點改為教師試用。

## 交接
CODEX_QUEUE #6j：停-等教師；備註「Codex 抽查修正完成；教師試用 9 份」。週誌透過 devlog 工具寫入；[check_handoff 輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/output/check-handoff.txt)。不 push、不合併 main、不部署、不改 Excel；待教師看畫面核可後另走正式建置／登錄流程。
