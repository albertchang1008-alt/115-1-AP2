# 呼吸道構造圖 V2 preview 報告

日期：2026-10-11。分支 `feature/respiratory-infographics`；HEAD `e8805f8`；本輪未 commit。

已完成七張 SVG 的 ChatGPT 底圖＋中文標籤層，仍為教材 v1 preview，待 Claude 獨立驗收及教師看畫面。

## 圖面與標籤

下表紅色皆為粗體；其他標籤為一般色。喉軟骨前／後面觀、聲帶／吞嚥兩格改為上下排列，使手機維持解剖圖與字級。長標籤分行，完整用詞保留於 SVG aria-label／data-label。

| 圖 | 標籤 | 紅色粗體 | 390px 最小字級 | 1280px 最小字級 |
|---|---|---|---:|---:|
| overview | 軟腭、會厭、喉、氣管、鼻咽、耳咽管口、口咽、喉咽、食道 | state-1：鼻咽、耳咽管口、軟腭；state-2：喉、會厭；state-3：氣管、食道 | 13.28px | 30.40px |
| node-01 | 鼻腔、軟腭、口腔、會厭、鼻咽、口咽、喉咽、食道 | 鼻咽、口咽、喉咽 | 13.28px | 30.40px |
| node-02 | 軟腭、咽扁桃體、鼻咽、耳咽管口、口咽 | 耳咽管口、鼻咽 | 13.28px | 30.40px |
| node-03 | 會厭軟骨、喉結、甲狀軟骨、環狀軟骨、楔狀軟骨、小角軟骨、杓狀軟骨 | 甲狀軟骨、喉結 | 13.81px | 31.62px |
| node-04 | 上格：會厭、前庭皺襞、聲帶皺襞（真聲帶）、聲門、杓狀軟骨；下格：會厭、食團、食道、氣管 | 聲帶皺襞（真聲帶）、杓狀軟骨、上下兩格會厭 | 13.81px | 31.62px |
| node-05 | C 形透明軟骨、黏膜層（偽複層纖毛柱狀上皮）、氣管腔、氣管平滑肌、食道 | C 形透明軟骨、氣管平滑肌、食道 | 13.77px | 31.53px |
| node-06 | 右主支氣管、次級支氣管（肺葉）、三級支氣管（肺節）、細支氣管、氣管、隆凸、左主支氣管 | 右主支氣管 | 13.28px | 30.40px |

## 實作與重跑

- 產生器：`scripts/airway-figures.py`（Python 3＋Pillow）；由 repo 根目錄執行 `python3 scripts/airway-figures.py`。repo 內 WebP 足以重跑，原始 `呼吸系統圖` 若存在則重新壓縮。
- 五張底圖：`materials-src/figures/raster/airway-structure/*.webp`；寬 1200px，quality 82。氣管僅使用指定右側 crop `(830,160,1440,920)`；其他原始底圖完整保存於 WebP，喉軟骨及聲帶兩格以 SVG 裁切視窗重新排列。
- 解剖錨點完全沿用 `呼吸1-咽部-標籤產生器.py` 與 `labeltools/f_*.py`；只有等量平移以配合裁切／上下排列。標籤文字加白色描邊。
- overview 以 SVG 內 `<style>` 選擇 `.state-figure[data-state]` 切換紅色；各 SVG 使用獨立 ID 限定樣式，避免其他圖同步變色。
- 高度與寬度調整限定 `.kit[data-slug="airway-structure"]`：`max-height:none; max-width:760px; margin-inline:auto`。
- HTML：**1,124,370 bytes（1.124 MB）**，小於 1.2 MB 目標。WebP 以 data URI 嵌入，圖檔沒有額外網路依賴。

## 驗證

- `npm run materials:preview airway-structure`：成功；僅生成指定教材 preview。
- `npm run materials:validate-nodes`：通過（21 份既有教材及所有 kit sources）。
- `node --import tsx --test tests/material*.test.ts`：20／20 通過。
- `npm run materials:shots airway-structure`：20 張全頁截圖；minPx／clipped 檢查通過，既有量測報告在 `materials-src/airway-structure/shots/report.json`。
- `node scripts/airway-figures-verify.mjs`：18 個實際呈現狀態全部通過。逐張檢查文字框越界／文字互疊、引線互相交叉、引線壓到其他文字框、文字框壓到其他錨點、紅色且粗體標籤與狀態、pageerror／console error／水平溢位。完整結果：[verification.json](respiratory-screenshots/airway-v2/verification.json)。
- 手機最小 13.28px；桌機最小 30.40px（預設字級）。截圖 deviceScaleFactor=2，表中數值為 CSS px。
- 已人工查看手機／桌機圖面，確認中文、紅字、解剖底圖與引線可辨識。Chrome 在受限 sandbox 無法啟動，獲准執行本機 browser 後完成上述驗證。
- SHA-256 比對 **183 個檔案**：`content.json`、其他六份呼吸教材來源／圖／preview、`shared/materials.ts`、Excel 均與開工前相同。證據：[scope-integrity.json](respiratory-screenshots/airway-v2/scope-integrity.json)。

## 截圖

每個尺寸 9 張圖面截圖（overview 三狀態＋六節點），共 18 張，位於 `docs/respiratory-screenshots/airway-v2/`。另外既有 materials-shots 保存兩尺寸完整頁面，便於確認頁面版型。

| 圖／狀態 | 1280 | 390 |
|---|---|---|
| overview-state-1 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-overview-state-1.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-overview-state-1.png) |
| overview-state-2 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-overview-state-2.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-overview-state-2.png) |
| overview-state-3 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-overview-state-3.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-overview-state-3.png) |
| node-01 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-node-01.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-01.png) |
| node-02 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-node-02.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-02.png) |
| node-03 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-node-03.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-03.png) |
| node-04 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-node-04.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-04.png) |
| node-05 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-node-05.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-05.png) |
| node-06 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-node-06.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-06.png) |

## 待驗收

Claude 請確認標籤用詞、沿用錨點與兩格改為上下排列後的閱讀效果，再由教師看 preview。未正式 build、未寫 Excel、未登錄、未 commit／push／部署。

## 10/13 修正（2026-10-14 執行，階段一任務 0）

A-01～A-06 全部套用：杓狀軟骨 `(680,745)→(749,803)` 指藍色本體；「後」移至 `(830,880)`，新增上面觀／吞嚥時圖說；後面觀置中 `(374,2240)`；下格會厭 `(470,1720)→(457,1720)` 內移；鼻咽共用錨點 `(750,282)→(760,325)` 移入腔內；node-06 左欄改次級→三級→細支氣管，錨點不動，以折線避開交叉。verify 同步檢查折線每一段。

授權 content：airway 預測選項改「會厭／聲帶／軟腭／甲狀軟骨」，answer 仍 0、題幹／feedback 保留；gas-exchange node-03 concept 與 points 各一處「入肺靜脈血」改「經肺動脈入肺的缺氧血」。還原這兩項後 SHA 與開工時完全一致。

兩份 preview／shots 重跑通過（各20全頁截圖）；airway verify18狀態、節點稽核21／15、materials測試20／20通過。Airway HTML 1,124,868 bytes；最小手機13.28／桌機30.40px。更新 [node-02](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-02.png)、[node-03](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-03.png)、[node-04](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-04.png) 截圖，對應1280圖在同資料夾；node-06亦更新。範圍證據 [scope-integrity.json](respiratory-screenshots/airway-v2/scope-integrity.json) 另列同期外部作圖變更，未覆蓋那些檔案。

本次同批完成 lungs-pleura 標籤試做，詳 [RESPIRATORY_LABELS_V2_REPORT.md](RESPIRATORY_LABELS_V2_REPORT.md)。停在階段一，待Claude複看與教師看畫面；未build／Excel／登錄／commit／push／部署。[Codex]

## R-6 複修（2026-10-14）

依 Claude 複驗，node-06 細支氣管錨點移至下葉細分支 SVG `(618,798)`（底圖原始像素 `(338,798)`）；引線直接連接，移除沿肺外緣垂直走的折線。標籤文字、位置與其他圖位保持不變。preview／shots、18狀態verify通過，HTML 1,124,832 bytes；最小390字級13.28px。更新 [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/1280-node-06.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/airway-v2/390-node-06.png) 截圖。gas-exchange summary的R-7與其餘R項見 [呼吸標籤報告](RESPIRATORY_LABELS_V2_REPORT.md)。待Claude複驗，未build／登錄／Excel／commit。[Codex]
