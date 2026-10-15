# 呼吸道的構造：換成 ChatGPT 底圖＋中文標籤層（2026-10-11 交辦）

工作目錄：主資料夾 `課程平台1.0`，分支 `feature/respiratory-infographics`（呼吸 7 份 preview 尚未提交，不要動其他 6 份）。開工先讀 `handoff.md`。
教材：`materials-src/airway-structure/`（v1，preview 階段）。只換 7 張圖，**不改 content.json 的文字、6 節點、11 題、ID**。

## 一、素材（教師與 Claude 已逐張驗收解剖）

底圖（ChatGPT 生成，無文字）在 `呼吸系統圖/`；Claude 的標籤試作與產生器在 `呼吸系統圖/labeltools/`（`lab.py` 為共用函式；各圖錨點座標以底圖原始像素為準，已核對解剖位置，請沿用）。

| 圖檔（取代） | 底圖 | 參考 Claude 試作 |
|---|---|---|
| airway-structure-overview.svg | 頭頸部矢狀剖面解剖圖.png | 呼吸1-咽部-標籤v3.svg（座標見 呼吸1-咽部-標籤產生器.py） |
| airway-structure-node-01.svg 咽的三段 | 同上 | 同上 |
| airway-structure-node-02.svg 耳咽管 | 同上 | 同上 |
| airway-structure-node-03.svg 喉軟骨 | 喉部軟骨與氣管解剖圖.png | 呼吸1-喉軟骨-標籤v1.svg／f_lar.py |
| airway-structure-node-04.svg 聲帶與會厭 | 喉部與吞嚥解剖示意圖.png | 呼吸1-聲帶與會厭-標籤v1.svg／f_vf.py |
| airway-structure-node-05.svg 氣管 | 呼吸系統與氣道剖面圖.png，**只裁右側橫切面** crop=(830,160,1440,920) | 呼吸1-氣管橫切面-標籤v1.svg／f_tr.py |
| airway-structure-node-06.svg 主支氣管與支氣管樹 | 對稱肺部與氣管解剖插圖.png | 呼吸1-支氣管樹-標籤v1.svg／f_bt.py |

把底圖複製到 `materials-src/figures/raster/airway-structure/`（英文檔名），產生器改成 repo 內可重跑的腳本（例如 `scripts/airway-figures.py`），輸出到 `materials-src/figures/`。底圖縮到寬 1200、WebP 品質約 82，以 data URI 嵌入 SVG。

## 二、每張圖只放該節點需要的標籤（紅色粗體＝當步重點）

| 圖 | 標籤 | 紅色 |
|---|---|---|
| overview（情境實驗室） | 鼻咽、耳咽管口、軟腭、口咽、喉咽、會厭、喉、氣管、食道 | 依 lab 狀態切換（見第三節） |
| node-01 咽的三段 | 鼻腔、口腔、軟腭、鼻咽、口咽、喉咽、會厭、食道 | 鼻咽、口咽、喉咽 |
| node-02 耳咽管 | 鼻咽、耳咽管口、咽扁桃體、軟腭、口咽 | 耳咽管口、鼻咽 |
| node-03 喉軟骨 | 前面觀：會厭軟骨、甲狀軟骨、喉結、環狀軟骨；後面觀：杓狀軟骨、小角軟骨、楔狀軟骨 | 甲狀軟骨、喉結 |
| node-04 聲帶與會厭 | 左：會厭、前庭皺襞、聲帶皺襞（真聲帶）、聲門、杓狀軟骨；右：會厭、食團、食道、氣管 | 聲帶皺襞（真聲帶）、杓狀軟骨、兩格的會厭 |
| node-05 氣管 | C 形透明軟骨、氣管平滑肌、食道、黏膜層（偽複層纖毛柱狀上皮）、氣管腔 | C 形透明軟骨、氣管平滑肌、食道 |
| node-06 支氣管樹 | 氣管、隆凸、右主支氣管、左主支氣管、次級支氣管（肺葉）、三級支氣管（肺節）、細支氣管 | 右主支氣管 |

- 標籤名稱一律照上表（課本用詞）；不得新增課本沒有的構造（例如「耳咽管圓枕」「咽隱窩」只畫不標）。
- 方位字：矢狀圖不加；喉鏡視角加「前／後」；氣管橫切面加「前／後」；喉軟骨兩格下方加「前面觀／後面觀」。
- 引線不可互相交叉、不可壓在其他標籤上；標籤文字加白色描邊底。

## 三、overview 的 lab 狀態

lab 有 3 個狀態（state-1 鼻咽、state-2 喉、state-3 氣管），kit 會在 `.state-figure` 設 `data-state`。在 overview SVG 內用 `<style>` 依 `data-state` 切換紅色標籤：

- state-1：鼻咽、耳咽管口、軟腭
- state-2：喉、會厭
- state-3：氣管、食道

其他標籤維持一般色。

## 四、字級與版面（必須）

- **390 寬手機：圖內字 ≥ 12px**；1280 桌機 ≥ 13px。現在 `.node-figure{max-height:340px}` 會把寬圖縮得太小，請只針對 `[data-slug="airway-structure"]` 放寬（例如 `max-height:none; max-width:760px; margin-inline:auto`），不影響其他教材。
- 為達到手機字級，可：裁掉底圖四周空白、縮小左右留白、調大字級（約 48–60 viewBox 單位）、減少每張標籤（已在第二節精簡）。不可為了字級把底圖縮成看不清。
- 用既有 materials-shots 的字框量測（minPx、clipped）與文字互疊檢查；另加「文字框不可壓在引線端點以外的其他錨點上」。

## 五、檢查與交件

- `npm run materials:preview airway-structure` 產出 preview；`materials:validate-nodes`、materials 測試通過。
- 截圖：overview 三個狀態＋6 節點，1280 與 390 各一張，放 `docs/respiratory-screenshots/airway-v2/`。
- 報告 `docs/AIRWAY_FIGURES_V2_REPORT.md`：每張圖的標籤清單、紅色清單、手機最小字級、HTML 檔案大小（目標 ≤ 1.2 MB）。
- 仍停在 preview：不正式 build、不寫 Excel、不登錄、不 commit／push／部署。待 Claude 驗收與教師看畫面。
