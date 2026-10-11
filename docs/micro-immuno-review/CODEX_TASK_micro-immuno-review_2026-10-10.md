# 115-MI 微免總複習：兩份互動資訊圖表（2026-10-10 交辦，Claude 撰寫）

開工先讀 `handoff.md` 與 `docs/MATERIAL_KIT_1.md`。上課日：**2026-10-12（一）**；教師截止：**10/11（日）12:00 前要能看 preview**。

## 0. 分支與工作目錄

- 新開 worktree：`.worktrees/micro-immuno-review`，分支 `feature/micro-immuno-review`，**基底 e8805f8**（與 1.7.0／1.7.1 同基底）。
- 不要動主目錄（目前在 `feature/respiratory-infographics`，有未提交的呼吸改動）與其他 worktree。
- 本交辦資料夾 `docs/micro-immuno-review/`（在主目錄，未追蹤）整個複製進新 worktree 的同路徑後再開工。

## 1. 教師決定（不要改）

1. 兩份教材：
   - `micro-bacteria-review`（第一小時，細菌 Ch1–6；王先生燒燙傷案例）：6 節點、6 先備、5 情境。
   - `immuno-concepts-review`（第二小時，免疫；新生兒小安案例）：**8 節點**、6 先備、5 情境，內容檔已寫 `rules` 覆寫。
2. **內容已定稿**：`docs/micro-immuno-review/*.content.json` 是 Claude 依教師核可內容產生的草稿，直接放成 `materials-src/<slug>/content.json`。
   - 文字、題目、選項、答案、提示、解析一律不改。
   - 若驗證器要求的欄位缺少或格式不同（例如 `sources`、`reference`、`credits` 結構、`explain` 是否允許、`rules` 寫法），只調欄位形狀並在報告列出，不得改寫教學內容，也不得編造頁碼。
   - 表格內容已轉成以「｜」分隔的 points，維持原樣顯示即可。
3. **插圖例外（教師 10/10 決定）**：本次節點插圖使用 AI 生成點陣圖（Gemini／ChatGPT），經 Claude 逐張驗收、教師同意。這是 `MATERIAL_KIT_1.md` §3「不用 AI 點陣插圖」的明確例外，只適用這兩份教材。
   - `figures/manifest.json` 的 source 寫 `AI-generated (Gemini/ChatGPT), teacher-reviewed 2026-10-10`。
   - Credits 顯示「插圖由 AI 生成，經授課教師審訂」。
4. 圖上文字全部用 SVG `<text>` 疊加，不得把字畫進點陣圖。

## 2. 圖檔來源與對應

點陣圖在 `/Users/HHC/Downloads/fig/final/`（均為 4:3，1448×1086 或 1536×1152）。

| 教材圖檔（figures/） | 來源 | 類型 |
|---|---|---|
| micro-bacteria-review-lab.svg | 自繪 | SVG 互動（§4-1） |
| micro-bacteria-review-node-01.svg | MI-B-N01.png | 點陣＋標籤 |
| micro-bacteria-review-node-02.svg | MI-B-N02.png | 點陣＋標籤 |
| micro-bacteria-review-node-03.svg | MI-B-N03.png | 點陣＋標籤 |
| micro-bacteria-review-node-04.svg | MI-B-N04.png | 點陣＋標籤 |
| micro-bacteria-review-node-05.svg | MI-B-N05.png | 點陣＋標籤 |
| micro-bacteria-review-node-06.svg | 自繪 | SVG（§4-2） |
| immuno-concepts-review-lab.svg | 自繪 | SVG 互動（§4-3） |
| immuno-concepts-review-node-01～06.svg | MI-I-N01～N06.png | 點陣＋標籤 |
| immuno-concepts-review-node-07.svg | 自繪 | SVG（§4-4） |
| immuno-concepts-review-node-08.svg | MI-I-N08.png | 點陣＋標籤 |

- `MI-B-COVER.png`、`MI-I-COVER.png` 是投影片用，**不放進教材**（kit 若沒有封面圖欄位，不要為此擴充 kit）。
- 點陣轉檔：轉成 WebP，長邊 1200px、品質約 80，以 data URI 嵌入對應 SVG 的 `<image>`，SVG viewBox 依圖片比例。每張目標 ≤180KB；單份 index.html 總大小請在報告列出。
- 原始 PNG 不進 git；WebP 或內嵌後的 SVG 進 `materials-src/figures/`。

## 3. 點陣圖的標籤疊加規則

- 每張圖疊下表標籤：小圓點錨在結構上，細引線拉到空白處放字。字有白色描邊或半透明白底，深淺兩色模式都可讀。
- 字級：桌機 ≥14px、手機 390 寬 ≥12px（沿用 kit 規範）；標籤不得互相重疊、不得蓋住主體結構、不得超出 viewBox。
- 位置由你依圖判斷；**錨點必須真的落在該結構上**，這是 Claude 驗收重點。

| 圖 | 標籤 |
|---|---|
| B-N01 | 細胞壁、細胞膜、核區（環狀 DNA）、核糖體（70S）、質體、鞭毛、線毛／細胞核、核仁、粒線體、內質網、高基氏體、溶小體／球菌（葡萄狀）、球菌（鏈狀）、桿菌、螺旋菌。**另加圖註一行**：「未依實際比例：細菌約 1–5 µm，人體細胞約 10–100 µm」 |
| B-N02 | 左側標題「革蘭氏陽性菌」：磷壁酸、厚肽聚醣、細胞膜。右側標題「革蘭氏陰性菌」：脂多糖（內毒素）、外膜、孔蛋白、脂蛋白、薄肽聚醣、周質空間、細胞膜。上方標「細胞外」，下方標「細胞質」 |
| B-N03 | 左標題「外毒素：活菌分泌的蛋白質」：細菌、外毒素、受體、宿主細胞。右標題「內毒素：菌體破裂釋出的脂多糖」：菌體破裂、脂多糖、紅血球 |
| B-N04 | 傳染窩（第一床傷口）、接觸傳播（手）、共用聽診器、潮濕水槽、入口（第二床傷口）、易感宿主、手部衛生（乾洗手液、洗手台） |
| B-N05 | 三格標題：「滅菌：高壓蒸氣 121℃ 15 分鐘」「消毒：環境表面」「抗菌：皮膚」 |
| I-N01 | 第一道防線：皮膚與黏膜（城牆、護城河）、正常菌叢（牆外居民）；第二道防線：吞噬細胞（守衛）、發炎與發燒（烽火）；第三道防線：淋巴球（拿鑰匙的士兵＝專一性）、記憶（紀錄簿）；入侵的病原 |
| I-N02 | 左標題「先天免疫：立即、非專一」：巨噬細胞、嗜中性球、自然殺手細胞。右標題「後天免疫：專一、有記憶」：B 細胞與抗體、T 細胞、記憶細胞 |
| I-N03 | 四格標題：天然主動（感染後康復）、人工主動（疫苗）、天然被動（胎盤 IgG）、人工被動（抗蛇毒血清） |
| I-N04 | 骨髓、造血幹細胞；骨髓系：嗜中性球、嗜酸性球、嗜鹼性球、單核球、巨噬細胞、樹突細胞；淋巴系：B 細胞、T 細胞、胸腺、自然殺手細胞；次級淋巴器官：淋巴結、脾臟、扁桃腺 |
| I-N05 | 抗原、抗原決定位（三處各標一次）、抗體（已結合）、抗體（正在結合）、不吻合的抗體；角落「鎖＝抗原、鑰匙＝抗體」 |
| I-N06 | 五步驟編號 1–5：抗原與 B 細胞受體結合、輔助型 T 細胞給訊號、增殖、漿細胞分泌抗體／記憶 B 細胞、抗體功能（調理作用、凝集、中和） |
| I-N08 | 左標題「CD4 輔助型 T 細胞：指揮官」：樹突細胞、MHC＋抗原片段、輔助型 T 細胞、細胞激素、B 細胞、巨噬細胞、毒殺型 T 細胞。右標題「CD8 毒殺型 T 細胞：殺手」：受病毒感染的細胞、細胞凋亡、健康細胞 |

注意（不必修圖，標籤要正確）：
- I-N06 與 I-N08 兩張圖中，粉紅色細胞分別代表輔助型 T 細胞和 B 細胞，以標籤為準，不要依顏色推論。
- I-N04 的脾臟形狀近似腎臟，標籤要明確。

## 4. 自繪 SVG（照 kit 既有風格；線條、配色與點陣圖協調）

1. **micro-bacteria-review-lab.svg（革蘭氏染色）**
   - 圓形顯微視野：左半一簇陽性球菌，右半 4–6 隻陰性桿菌。
   - 依 `data-state` 切換：`unstained`（兩者近透明淡灰）、`crystal-violet`（兩者紫）、`iodine`（兩者深紫）、`decolorize`（陽性紫、陰性無色）、`safranin`（陽性紫、陰性粉紅）。
   - 顏色淡入 0.4s，`prefers-reduced-motion` 直接切換。視野下方標「陽性菌」「陰性菌」。
2. **micro-bacteria-review-node-06.svg（抗生素作用目標）**
   - 一隻細菌剖面，五個目標各有引線與藥名：
     - 細胞壁：β-內醯胺類、萬古黴素
     - 30S：胺基醣苷類、四環黴素
     - 50S：巨環類、clindamycin
     - DNA 旋轉酶：喹諾酮類
     - 葉酸合成：磺胺類、trimethoprim
   - 下方一列四個小圖示，各配一行字：分解藥物的酵素、改變作用目標、排出幫浦、孔蛋白減少。
3. **immuno-concepts-review-lab.svg（初次與再次免疫反應）**
   - 橫軸「時間（天）」，縱軸「抗體濃度」，不畫刻度數字。標示「第一次接觸抗原」「第二次接觸同一抗原」兩個時間點。
   - `primary` 狀態：只畫第一段。潛伏期約 7–10 天，IgM 先升、IgG 後升，兩者都低。
   - `secondary` 狀態：加畫第二段。潛伏期短，IgG 高且持久，IgM 小幅。
   - IgM、IgG 用不同顏色並加線型區分（不可只靠顏色），曲線旁直接標名稱。
4. **immuno-concepts-review-node-07.svg（抗體結構與五種抗體）**
   - 左：Y 字結構。兩條重鏈、兩條輕鏈、雙硫鍵；可變區與恆定區用顏色區分；標 Fab、Fc、絞鏈區、抗原結合部位（×2）。
   - 右：五種形態，依血中含量排列並標名稱：
     - IgG 單體
     - IgA 雙體（J 鏈、分泌片）
     - IgM 五聚體（J 鏈）
     - IgD 單體（插在 B 細胞膜上）
     - IgE 單體（接在肥大細胞上）

## 5. 流程與檢查

1. 放好兩份 content.json → `npm run materials:validate-nodes` 及內容檔驗證通過。
2. 做圖 → `npm run materials:preview <slug>` → `npm run materials:shots <slug>`。
   - 兩寬（1280、390）、每個 lab 狀態、每個節點各截一張。
   - 深色模式各一張；390 減少動態一張。
3. 自動檢查（沿用血流教材的做法，用 system-ui 與 Noto Sans CJK TC 各跑一次）：
   - 標籤文字框彼此間距 ≥3 viewBox 單位；
   - 不超出圖框；
   - 390 寬圖內字 ≥12px；
   - pageerror 0、手機無水平溢位；
   - SDK：首次展開記探索、作答回報、病例全對才 complete，行為與既有教材一致。
4. 交件報告 `docs/MICRO_IMMUNO_REVIEW_REPORT.md`：兩份截圖集連結、檢查原始結果、單份 HTML 大小、與本交辦不同之處及原因。另做一頁 `docs/micro-immuno-review-preview.html`（截圖集），讓教師直接看。
5. **停在 preview**：
   - 不正式 build、不寫 Excel、不登錄、不 commit／push／部署。
   - 不擴大 `materials-src/kit/*`、`scripts/materials-build.mjs`。若真的需要（例如 8 節點或 data URI 圖片無法通過驗證），先停下，在報告說明最小改法，等 Claude／教師同意。
6. 收工更新 worktree 的 `handoff.md` 與 `DEVELOPMENT_LOG.md`：「115-MI 微免兩份資訊圖表 preview 完成，待 Claude 驗收與教師看畫面」。

## 6. 之後（教師核可後才做，本次不做）

- 正式 build＋登錄 `shared/materials.ts`。
- 兩份各 6＋5 題追加到 `html/資訊圖表題庫_上傳用.xlsx` 末列之後（不改既有列）。
- commit。

上線需要部署，部署與合併由教師決定。

## 7. Claude 驗收時會看

- 內容與 content.json 逐字一致。
- 每個標籤錨點落在正確結構上。
- 四項自動檢查的原始結果。
- 互動狀態正確：染色五狀態、反應曲線兩狀態。
- 兩種主題、兩種寬度都可讀。
