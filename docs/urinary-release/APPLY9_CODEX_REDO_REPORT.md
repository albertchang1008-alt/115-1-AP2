# 套件中性模式與九份重做報告（2026-10-20）

## 給 Claude 的摘要
1. A：最終新凍結 `0e0997bd96ddb3879daa19f1733e44d787d334c4`，分支codex/apply-kit-neutral；31個凍結檔（含manifest）。
2. B：`.worktrees/apply9-codex`／codex/apply9-redo，從此新凍結點接續；九份依交辦順序重做，未做份數0。
3. 套件新增focus/change、parallel/cause、穩定id名詞綁定；方向原句、因果兩端、原表錨點與原PNG更嚴核對。
4. 水鈉6組PNG逐byte相同、24/24版面PASS；新增回歸先紅3/3→共用14/14綠，含舊教材合計34/34，0 skipped。
5. 壞資料8/8按預期拒絕（7種內容、1種偽造focus版面；該版面24/24 FAIL），沒有降低門檻或skip。
6. B：內容9/9、版面216/216 PASS；三寬度互動27/27 PASS、0 skipped；81張指定尺寸／狀態圖按slug存放。
7. 原題含predict／提示／解析／選項完整保持c8fb122；原content、54張既有SVG、原PNG、呼吸七份及舊kit未改。
8. 逐條回覆舊審查28項見下；七份構造概念型全focus，酸鹼／尿濃縮只有直接有據的項目標方向。
9. 縮限：尿濃縮較少ADH未有直接方向原句，刪其新增動態，保留原題；其他未有據句、數值與內液錨點明列缺依據。
10. 抽查最多5項：①酸負荷↓／排銨↑原句；②尿量1–2L且ADH比較縮限；③體液4%／16%與錨點；④腎造血素點擊；⑤focus全無方向及原題保護。
11. 本機A／B提交，無push、build、登錄、發布、版本或reviewed變更；#6h停-等Antigravity，待其獨立內容審查。

## 工作位置與新凍結

A在`.worktrees/apply-kit-neutral`從1fded9e獨立實作；B指定worktree基於最終`0e0997b`，沒有取用呼吸根分支或合併11a6ef5。
A的本機凍結commit在交付前補齊「新增引用不進學生HTML」及「舊v1入口不可繞過」測試，因此以本報告最終SHA為準，取代過程中的暫時SHA。
B參考Antigravity的原題封裝／任務資料，逐項重新判斷；內容以實際reviewed卡重新撰寫，PNG／SVG直接引用新凍結基底已有的核定原資產，沒有複製整份工作區。

A改動：`materials-src/apply-kit/{model,render,lab,semantics,anchor-assets,direction-approvals}`、`scripts/apply-{content-check,layout-check,neutral-proof}.mjs`、`tests/apply-neutral.test.mjs`、`docs/urinary-release/APPLY_FORMAT.md`及manifest。
B新增：九份`materials-src/<slug>/apply.json`、本報告及`docs/urinary-release/apply9-redo/author-data.py`。未修改凍結檔、原content或原圖。

- format：[新格式說明](/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/APPLY_FORMAT.md)；各`changes`用bindings的穩定id，小圖id=term=glossary key、標題名稱也核對一致。
- focus沒有方向、徽章與器官箭頭；parallel同層並列不放因果線。cause兩端都要逐字引文；change必須有明確方向字詞，教師例外須存在凍結核准清單（本輪無新增例外）。
- 錨點原表只有點而無區域，因此採原像素點±0.5px；以anchorRef指名，不准跨view。實際PNG的SHA及原始寬高也核對，不能錯用1122×1402套1254×1254底圖。
- v1只容許資料完全相同的教師定稿水鈉；任一欄更動都要求v2，避免以舊slug規避新規則。

## A 實際驗證

證據根目錄：`docs/urinary-release/apply9-redo/A/`。

| 驗證 | 結果 | 證據 |
|---|---|---|
| 新功能實作前回歸 | 3 FAIL／0 skipped，證明原版不支援v2 | [red.tap](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/A/red.tap) |
| 最終新舊共用套件 | 14 PASS／0 FAIL／0 skipped | [green.tap](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/A/green.tap) |
| 含舊教材、完成門檻、登錄保護 | 34 PASS／0 FAIL／0 skipped | [material-tests.tap](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/material-tests.tap) |
| 水鈉定稿1280／390×3態 | 6/6 PNG逐byte相同 | [parity.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/A/parity/parity.json) |
| 水鈉8尺寸×3態 | 24/24 PASS | [layout-results.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/A/water-layout/layout-results.json) |
| 水鈉內容及原題 | PASS，617引用 | [water-content.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/A/water-content.json) |
| 壞資料CLI負向證明 | 8/8拒絕、每支exit1；偽造focus徽章24/24 FAIL | [negative/summary.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/A/negative/summary.json) |

壞資料分別測focus方向字形、focus方向欄、缺方向原句、中性原句冒充增減、cause缺端點引用、錯誤id綁定、合法結構名下的錯座標，以及繞過資料層偽造HTML徽章。
原字級／溢出／捲動等門檻沒有放寬；新版另檢查focus無徽章、parallel無因果連接元素。

```sh
# A cwd .worktrees/apply-kit-neutral；Node 22.23.2
node --test tests/apply-kit.test.mjs tests/apply-neutral.test.mjs
node scripts/apply-step0-verify.mjs parity <root>/docs/urinary-release/apply9-redo/A/parity
node scripts/apply-neutral-proof.mjs <root>/docs/urinary-release/apply9-redo/A/negative <cards> <progress>
node scripts/apply-layout-check.mjs materials-src/apply-examples/water-sodium-regulation/apply.json --out <root>/docs/urinary-release/apply9-redo/A/water-layout
# B direct tests，避免npm check包含禁止執行的build
node node_modules/tsx/dist/cli.mjs --test tests/material-kit.test.ts tests/material-kit-completion.test.ts tests/material.test.ts tests/material-registration.test.ts tests/apply-kit.test.mjs tests/apply-neutral.test.mjs
```

## B 逐份交付與檢查

| 順序／教材 | 類型 | 內容／引文數 | 版面 | 原題 |
|---|---|---|---|---|
| 1. acid-base-homeostasis | 變化＋重點 | PASS／601 | 24/24 PASS | 不變 |
| 2. urine-concentration | 變化＋重點 | PASS／563 | 24/24 PASS | 不變 |
| 3. filtration-clearance | 構造／概念focus | PASS／565 | 24/24 PASS | 不變 |
| 4. tubular-handling | 構造／概念focus | PASS／546 | 24/24 PASS | 不變 |
| 5. nephron-circulation | 構造／概念focus | PASS／546 | 24/24 PASS | 不變 |
| 6. fluid-compartments | 構造／概念focus | PASS／530 | 24/24 PASS | 不變 |
| 7. electrolyte-balance | 構造／概念focus | PASS／525 | 24/24 PASS | 不變 |
| 8. kidney-anatomy | 構造／概念focus | PASS／575 | 24/24 PASS | 不變 |
| 9. urinary-route-micturition | 構造／概念focus | PASS／685 | 24/24 PASS | 不變 |

九份共5136次引文匹配；比對的是實際卡片與progress的reviewed狀態，不以對方報告代替。參見[summary.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/summary.json)。

完整argv、exit code：[commands.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/commands.json)。各份完整輸出為`B/<slug>/content.log`、`layout.log`及對應JSON；最後酸鹼精確名詞校正的同命令輸出亦在該目錄。

```sh
# cwd .worktrees/apply9-codex；cards及progress為唯讀
node scripts/apply-content-check.mjs materials-src/<slug>/apply.json --cards "/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge" --progress "/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl" --out <root>/docs/urinary-release/apply9-redo/B/<slug>/content.json
node scripts/apply-layout-check.mjs materials-src/<slug>/apply.json --out <root>/docs/urinary-release/apply9-redo/B/<slug>/layout
```

### 指定三寬度與互動

全部`<slug>`均提供下列三態原尺寸截圖：

- `docs/urinary-release/apply9-redo/B/<slug>/layout/shots/1280x800-state-{1,2,3}.png`
- 同目錄`820x1180-state-{1,2,3}.png`、`390x844-state-{1,2,3}.png`。另有`B/contact-{1280,820,390}-{1,2,3}.png`九張總覽供快速抽查。
- 三寬度實際操作課程的截圖在`B/<slug>/interaction/<width>-state-{1,2,3}.png`及`<width>-completion.png`。

實際操作27/27組PASS、0 skipped：[interactions.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/interactions.json)；[可重跑腳本](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/interaction.mjs)。每尺寸三態、每個清單／小圖節點、全部六知識節點、排序上下移動與正確回饋、答錯→第二層→回節點→重試、兩階段全答與心智圖空白拒絕／填入／取回／重填皆實際操作；完成只送一次，無JS錯誤或課程橫向溢出。focus態另驗證零徽章、零器官箭頭、零因果線。酸鹼名詞精確化及電解質常駐條件寫全後，另重跑其六組，最終JSON只保留最新27組，沒有遺漏。

尿路第一輪在768／820的第三態長標題溢出，保留[layout-first-attempt.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/urinary-route-micturition/layout/layout-first-attempt.json)，未skip。改為副交感／外括約肌兩個並列概念，逼尿肌仍有原錨點標籤與說明；重跑24/24通過。沒有縮字到14px以下或放寬界線。

### 每個新增方向徽章的逐字原句

同一id的清單與小圖使用同一方向依據；圖上器官標籤全中性，沒有另外添加方向。完整資料見[direction-evidence.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/direction-evidence.json)。

| 教材／狀態／項目 | 方向 | 卡uid＋逐字原句 | 增減字詞 |
|---|---|---|---|
| acid-base-homeostasis／state-2／呼吸排CO₂ | ↑ | `acid-base-balance`：呼吸增加 CO₂ 排出可減酸；腎臟分泌 H⁺並回收 HCO₃⁻。 | 增加 |
| acid-base-homeostasis／state-2／血液酸負荷 | ↓ | `acid-base-balance`：呼吸增加 CO₂ 排出可減酸；腎臟分泌 H⁺並回收 HCO₃⁻。 | 減酸 |
| acid-base-homeostasis／state-3／銨排泄 | ↑ | `renal-acid-base-compensation`：排銨增加與保留碳酸氫根增加是同方向的排酸留鹼 | 排銨增加 |
| acid-base-homeostasis／state-3／碳酸氫根保留 | ↑ | `renal-acid-base-compensation`：排銨增加與保留碳酸氫根增加是同方向的排酸留鹼 | 保留碳酸氫根增加 |
| urine-concentration／state-1／集尿管水回收 | ↑ | `adh-water-reabsorption`：腺苷酸環化酶活性與水分再吸收均增加 | 水分再吸收均增加 |

## 舊審查28項逐條對照

原問題以`APPLY9_REVIEW_BY_CODEX.md`及其content-findings.json為索引；「刪除／縮限」也列明理由，沒有用PASS掩蓋找不到依據的內容。

### acid-base-homeostasis

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.states[1].flowStages[2][0].direction` | 已修：呼吸排CO₂為上升、血液酸負荷為下降，分別引用「增加／減酸」。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/acid-base-homeostasis/layout/shots/390x844-state-1.png)；`materials-src/acid-base-homeostasis/apply.json` |
| `learning.nodes[5].summary` | 已修：新摘要採renal-acid-base-compensation定義原句，銨／磷酸鹽排酸不再寫成尿酸。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/acid-base-homeostasis/layout/shots/390x844-state-2.png)；`materials-src/acid-base-homeostasis/apply.json` |
| `lab.states[1].labels[0].anchor` | 已修：肺標籤引用既有「肺」[400,350]錨點，不再指腹部。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/acid-base-homeostasis/layout/shots/390x844-state-3.png)；`materials-src/acid-base-homeostasis/apply.json` |
| `lab.states[0].flowStages` | 已修：緩衝基準採focus＋並列，不標上升。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/acid-base-homeostasis/layout/shots/390x844-state-1.png)；`materials-src/acid-base-homeostasis/apply.json` |

### urine-concentration

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.states[*].intake[0].amount / status` | 已修：刪除1.5固定值；常駐區改正常1–2L/日「正常參照」，不是三態尿量相等。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/urine-concentration/layout/shots/390x844-state-1.png)；`materials-src/urine-concentration/apply.json` |
| `lab.states[1].changes / labels / flowStages` | 已修（縮限）：ADH保水態只對原句明載的水再吸收標上升；另兩態改「環段特性／濃縮條件」focus。缺少ADH較少的直接方向原句，未假稱完成多水動態。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/urine-concentration/layout/shots/390x844-state-2.png)；`materials-src/urine-concentration/apply.json` |
| `lab.states[2].flowStages / edges` | 已修：移除直血管→尿素的虛構因果鏈，條件改並列。原機制仍在知識原句中。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/urine-concentration/layout/shots/390x844-state-3.png)；`materials-src/urine-concentration/apply.json` |

### filtration-clearance

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.states[1].changes / labels / flowStages` | 已修：菊糖清除率與GFR採focus並列、文字等於；沒有方向徽章。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/filtration-clearance/layout/shots/390x844-state-1.png)；`materials-src/filtration-clearance/apply.json` |
| `lab.states[2].changes / flowStages` | 已修：尿素69為計算例，不再標上升；U×V/P與單位分開說明。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/filtration-clearance/layout/shots/390x844-state-2.png)；`materials-src/filtration-clearance/apply.json` |
| `lab.glossary.filtrationMembrane.text / inulinCompact.text` | 已修：刪除所掛引文未支持的電荷篩選／黃金標準表述。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/filtration-clearance/layout/shots/390x844-state-3.png)；`materials-src/filtration-clearance/apply.json` |

### tubular-handling

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.states[0..1].labels / changes / flowStages` | 已修：三態均focus，移動方向、全回收比例與負荷不再用同一↑表示。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/tubular-handling/layout/shots/390x844-state-1.png)；`materials-src/tubular-handling/apply.json` |
| `lab.states[0].edges[0].relation` | 已修：刪除「濾液經微血管進小管」整條錯掛邊，改原卡血→囊／管→血／血→管的知識原句。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/tubular-handling/layout/shots/390x844-state-2.png)；`materials-src/tubular-handling/apply.json` |
| `learning.nodes[2].lookTask / lab.glossary.sodiumWaterReabsorption` | 已修：刪除絕大多數的擴張形容，保留原卡大量回收及375mg/min條件；排序也移除泛稱主動分泌。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/tubular-handling/layout/shots/390x844-state-3.png)；`materials-src/tubular-handling/apply.json` |

### nephron-circulation

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.states[0].labels / flowStages` | 已修：短／長環分類均focus，無生理變化徽章或動畫。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/nephron-circulation/layout/shots/390x844-state-1.png)；`materials-src/nephron-circulation/apply.json` |
| `lab.states[2].flowStages / changes` | 已修：獨立說明低壓或低管液鈉，並列JGA三構成及感測／分泌；沒有一般灌流→腎素上升圖。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/nephron-circulation/layout/shots/390x844-state-2.png)；`materials-src/nephron-circulation/apply.json` |
| `lab.glossary.shortLoop / longLoop` | 已修：刪除短環外層／一般運送及長環至乳頭等未由所掛原句直接支持的新增句；採原卡短長、交界、深入髓質。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/nephron-circulation/layout/shots/390x844-state-3.png)；`materials-src/nephron-circulation/apply.json` |

### fluid-compartments

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.glossary.icfEcf.text` | 已修：內液40%／外液20%、血漿4%／組織間液16%分別指名，不刪主詞接錯比例。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/fluid-compartments/layout/shots/390x844-state-1.png)；`materials-src/fluid-compartments/apply.json` |
| `lab.states[0].labels[0].anchor` | 已修：底圖實際1254×1254、anchorView=node-05，血漿[440,500]與組織間液[1050,800]各指正確區。內液無原表錨點，移除其器官引線。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/fluid-compartments/layout/shots/390x844-state-2.png)；`materials-src/fluid-compartments/apply.json` |
| `lab.states[*].labels / flowStages` | 已修：三態全focus，固定比例與男女示例沒有上升。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/fluid-compartments/layout/shots/390x844-state-3.png)；`materials-src/fluid-compartments/apply.json` |

### electrolyte-balance

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.states[0].labels[0].anchor` | 已修：葡萄糖改原表[150,150]，NaCl[150,590]，MgCl₂[150,1025]。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/electrolyte-balance/layout/shots/390x844-state-1.png)；`materials-src/electrolyte-balance/apply.json` |
| `lab.states[0].labels / flowStages` | 已修：三態全focus；不解離、單粒子與粒子比較都沒有方向徽章。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/electrolyte-balance/layout/shots/390x844-state-2.png)；`materials-src/electrolyte-balance/apply.json` |
| `lab.states[1..2].banner / flowStages` | 已修：比較條件在常駐參照區「等數目分子、完全解離」持續可見，點其他名詞後仍保留；banner亦保留條件。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/electrolyte-balance/layout/shots/390x844-state-3.png)；`materials-src/electrolyte-balance/apply.json` |

### kidney-anatomy

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.states[2].flowStages / edges` | 已修：腎素、紅血球生成素、D活化是三個並列focus節點，沒有腎素→造血素因果箭頭。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/kidney-anatomy/layout/shots/390x844-state-1.png)；`materials-src/kidney-anatomy/apply.json` |
| `lab.states[2].flowStages[2][0].term` | 已修：epo節點的id／term／標籤／名詞內容一致，點擊顯示造血素，沒有跳到尿路分工。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/kidney-anatomy/layout/shots/390x844-state-2.png)；`materials-src/kidney-anatomy/apply.json` |
| `lab.states[0..2].labels / intake` | 已修：位置／切面全中性；刪除「1活性型」假數值，常駐改課本T12–L3位置參照。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/kidney-anatomy/layout/shots/390x844-state-3.png)；`materials-src/kidney-anatomy/apply.json` |

### urinary-route-micturition

| 原問題路徑 | 處理結果與理由 | 截圖／資料 |
|---|---|---|
| `lab.states[1..2].flowStages / labels` | 已修：路徑、儲尿與排尿分工全focus，不把收縮、鬆弛與尿流量混標上升。 | [390態1](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/urinary-route-micturition/layout/shots/390x844-state-1.png)；`materials-src/urinary-route-micturition/apply.json` |
| `lab.states[2].edges / changes` | 已修：骨盆副交感的逼尿肌／內括約肌，與陰部體神經的外括約肌分開；排尿圖不畫副交感→內外括約肌的錯邊。 | [390態2](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/urinary-route-micturition/layout/shots/390x844-state-2.png)；`materials-src/urinary-route-micturition/apply.json` |
| `lab.states[0..1].intake` | 已修：輸尿管25–30cm完整保留；700–800mL與約300mL在知識原句完整保留，不取下限當固定基準。 | [390態3](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/urinary-route-micturition/layout/shots/390x844-state-3.png)；`materials-src/urinary-route-micturition/apply.json` |

## 缺依據／未擅自補寫清單

不是0項。完整機讀表：[missing-evidence.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/B/missing-evidence.json)。已刪除的錯誤內容，不因刪除而冒稱原先有據。

| 教材 | 刪除／縮限 | 缺什麼／後續 |
|---|---|---|
| urine-concentration | 三態1.5L固定尿量 | 來源只有正常1–2L/日，不能挑中點當核定單值。 保留正常範圍作參照。 |
| urine-concentration | ADH較少→水回收下降的新增動態徽章 | 本輪reviewed卡有ADH增加保水原句，未找到明寫「ADH較少」及比較方向的原句；不把逆向推論充作逐字依據。 若教師要恢復原較多水動態，需補核可卡或具體教師方向裁定並另凍結；原題及predict完全保留。 |
| urine-concentration | 直血管→尿素再循環因果／管液深部1200排序步驟 | 直血管保梯度引文不證明尿素由其引起；髓質深部1200不直接等於該排序步驟的管液值。 改濃縮必要條件並列，排序採水外移後管液變濃。 |
| nephron-circulation | 短環皮質髓質外層、一般運送、長環至腎乳頭 | 原掛nephron-types未直接敘述這些新增範圍／功能。 刪除，保留該卡短／長、交界、深入髓質。 |
| filtration-clearance | 電荷篩選／濾液純淨／黃金標準 | 原掛引文只支持三層膜、菊糖只過濾等關係。 刪除，沒有自行補其他教材來源。 |
| fluid-compartments | 細胞內液在血管腔的引線及新增內液錨點 | overview沒有該內液錨點；既有node-05只給血漿、組織間液等點。 內外液比例只在概念區，外液細分用既有點。 |
| fluid-compartments | 女性因脂肪較高的新增看圖指令 | 所掛body-fluid-compartments原句只給年齡性別比例。 新指令僅對照已載比例；原題及解析不改。 |
| tubular-handling | 絕大多數水鹽與微血管進小管邊 | 大量回收短句不支持擴張比例或整條途徑。 改原卡方向與大量回收表述。 |

上述清單刻意保留ADH較少動態的供料缺口：本輪不把反向推論或原題解析當成新reviewed卡原句；原predict及全部原題仍逐字保留。是否補卡或提供教師核定方向，由第二方／教師決定。

## 保護與交接

[protection.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/protection.json)已確認：31/31凍結檔與新凍結點逐byte相同；九份原content整檔仍與c8fb122相同；54張原SVG相同；原PNG由canonical SHA核對。B提交前沒有既有追蹤檔變更，A與Antigravity worktree乾淨。原呼吸七份及舊kit未改，舊教材20個相關測試也全過。

交接檢查：PASS：handoff 1673/4000字、queue 18/25件，週誌與索引合規（python3 scripts/check_handoff.py）。只改根目錄#6h及本週週誌，不改handoff規則。B提交為codex/apply9-redo在新凍結點之後的一筆本機commit；具體SHA另存[delivery.json](/Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/apply9-redo/delivery.json)，避免在自身commit內循環嵌入SHA。

學生只讀課本概念與操作說明；原句引用與uid留在作者資料／本報告，名詞與小圖不顯示來源uid。機械關鍵字、字面引用及點座標只能守必要條件，無法證明語意蘊涵，必須交Antigravity獨立內容審查，之後Claude抽查與教師看畫面。

未執行npm check，因其會跑npm build及functions pretest build，與本次禁止build衝突；實際執行的是上列全部教材相關34個測試，沒有skip或改測試門檻。沒有push、發布、登錄、部署、版本變更或教師reviewed變更。
