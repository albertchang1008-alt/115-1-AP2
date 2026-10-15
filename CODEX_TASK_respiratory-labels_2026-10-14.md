# Codex 交辦：呼吸六份教材換新底圖＋標籤層＋資料層（2026-10-14，Claude 撰）

教師已核准。工作目錄 `/Users/HHC/Documents/ChatGPT/課程平台1.0`，分支 `feature/respiratory-infographics`（先 `git branch --show-current` 確認）。開工先讀 `handoff.md`。

本次分兩階段，**階段一做完就停下回報**，Claude 驗收、教師看過標籤樣式後，才做階段二。

## 範圍與禁止

- 教材：`lungs-pleura`、`breathing-mechanics`、`lung-function`、`gas-exchange`、`o2-co2-transport`、`respiratory-control`（呼吸道 `airway-structure` 只做階段一的小修）。
- **不改** content.json 的文字、節點、題目、答案與 ID（階段一任務 0 授權的兩處除外）。
- **不**畫解剖圖：底圖一律用 ChatGPT 已定稿的 PNG，不可用程式畫替代的解剖插圖。
- 不 `materials:build`、不寫 Excel、不登錄 `shared/materials.ts`、不 commit／push／部署、不動泌尿／體液與其他教材。

## 必讀

1. `docs/FIGURE_STYLE_GUIDE.md`：第三節箭頭文法、第四節標籤規則。
2. `docs/RESPIRATORY_FIGURES_V2_SPEC.md` 與 `docs/respiratory-v2-specs/<slug>.md`：每個圖位的「圖內標籤」「紅色粗體」「解剖／方向」要求。**標籤名稱照規格，不得自行增加構造名稱。**
3. `docs/IMAGE_REVIEW_lungs-pleura_2026-10-13.md`、`docs/IMAGE_REVIEW_respiratory_2026-10-14.md`：審圖紀錄與標籤注意事項。
4. `materials-src/figures/raster/_review.json`：28 張底圖都是 `pass`；`note` 欄是標籤層注意事項（摘要見第五節）。
5. 先例：`scripts/airway-figures.py`（底圖轉 WebP、data URI 嵌入、原生 SVG 中文標籤、依 `data-state` 切換紅字）。

## 一、底圖與圖位對照（34 個圖位）

底圖在 `materials-src/figures/raster/<slug>/incoming/IMG-<slug>-NN.png`（`_rejected/` 不要用）。

| 底圖 | 用在 |
|---|---|
| IMG-lungs-pleura-01 | lungs-pleura 總覽 state-1 |
| IMG-lungs-pleura-02 | 總覽 state-2、node-06 |
| IMG-lungs-pleura-03 | 總覽 state-3 |
| IMG-lungs-pleura-04～08 | node-01～05（依序） |
| IMG-breathing-mechanics-01 | 總覽 state-1、node-02、node-03 上格、node-06 |
| IMG-breathing-mechanics-02 | 總覽 state-2、node-03 中格 |
| IMG-breathing-mechanics-03 | 總覽 state-3、node-03 下格 |
| IMG-breathing-mechanics-04 | node-01（四格上下排，已是直式） |
| IMG-breathing-mechanics-05 | node-05（原圖三欄橫排：由程式切成三格，改上下排） |
| IMG-lung-function-01 | node-03 |
| IMG-gas-exchange-01／02／03 | 總覽 state-1／2／3（三張同構圖，可共用錨點） |
| IMG-gas-exchange-04／05／06／07 | node-01／02／03／06 |
| IMG-o2-co2-transport-01／02 | node-02／06 |
| IMG-respiratory-control-01 | 總覽三狀態共用（路線高亮由程式疊加） |
| IMG-respiratory-control-02～05 | node-01～04 |

- 轉檔：比照 airway，存到 `materials-src/figures/raster/<slug>/<英文名>.webp`（寬 1200、品質約 82），以 data URI 嵌入 SVG。同一張底圖用在多個圖位時，HTML 會重複嵌入；若單份 preview HTML 超過 1.5 MB，改成降品質或共用資源，並在報告寫明。
- breathing-mechanics 的 01（1122×1402）與 02／03（1198×1313）尺寸不同、沒有逐像素對齊：由程式補白到同一畫布尺寸，**每個狀態各自設定錨點**，不要套用同一組座標。

## 二、資料層（20 個圖位，教師 10/13 裁定 C1 方案 A）

以下圖位沒有 ChatGPT 底圖，改由**原生 SVG／HTML** 依 content.json 的數值產生：曲線、比例條、數表、公式卡、因果鏈。逐項依 `docs/RESPIRATORY_PROMPTS_CLAUDE_REVIEW.md` 第二、三節（C1、C2、C6）。

| 教材 | 圖位 |
|---|---|
| breathing-mechanics | node-04（順應性曲線） |
| lung-function | 總覽 state-1／2／3、node-01、02、04、05、06 |
| gas-exchange | node-04（擴散因素表）、node-05（V/Q） |
| o2-co2-transport | 總覽 state-1／2／3、node-01、03、04、05 |
| respiratory-control | node-05（公式卡）、node-06（因果鏈） |

- 氧解離曲線（o2 總覽、node-03、node-04）**保留 `materials-src/widgets/oxygen-curve.js` 現行契約**（480 viewBox、x＝60＋3.6·PO₂、y＝350－2.7·S、k 26／31／21、探針），只能重新配色，不可改成靜態圖。
- 比例必須精確：例如 97／3、70／23／7、0／4200／5100、肺容積 500／3100／1200／1200；0 要畫成空條，不可畫成非零小條。數值只取 content.json 與規格，不可自行新增。
- 配色與箭頭照風格指南（O₂ `#D55E00`、CO₂ `#0072B2`、調節訊號用深灰虛線）；文字一律黑色，重點標示見第三節。

## 三、標籤層規則

- 中文標籤用原生 SVG `<text>`，白色描邊底；引線末端用圓點對準構造。引線不可交叉，不可壓到其他標籤或錨點。
- **字級：390 寬手機圖內字 ≥12px，1280 寬 ≥13px。** 版面需求比照 airway：只針對這六份放寬 `.node-figure` 的高度限制。
- **重點標示**：教師尚未在 A（紅色粗體）、B（黑字＋淡橙色塊＋粗體）之間定案，先用 A。做成單一 CSS 變數或 class，之後改 B 只需改一處。
- 總覽三狀態依 `.state-figure[data-state]` 切換紅字與箭頭；respiratory-control 總覽的三條路線（腦幹／中樞受器、肺牽張／迷走、周邊受器／通氣）由程式疊加，非本狀態的路線淡化。
- 箭頭由程式疊加，照風格指南第三節：實心粗箭頭表示物質移動，細虛線表示調節；步驟用 ①②③ 編號圓點，圖下附同號說明。每張圖約 5–7 支以內。
- **錨點資料檔**：每份教材輸出 `materials-src/figures/raster/<slug>/labels.json`，內容包含每個圖位的標籤、錨點（底圖原始像素座標）、文字位置、紅字清單、狀態對應，供 Claude 逐點核對。

## 四、驗證

- `npm run materials:preview <slug>`、`npm run materials:shots <slug>`；截圖放 `docs/respiratory-screenshots/v2/<slug>/`，1280 與 390 各一張，涵蓋總覽三狀態與 6 節點。
- 比照 `scripts/airway-figures-verify.mjs`，寫一支能檢查這六份的 verify：最小字級、文字裁切、文字互疊、引線交叉、紅字與狀態是否相符、圖片沒有變形、沒有水平溢位、console 0 錯誤。
- `npm run materials:validate-nodes`、`node --import tsx --test tests/material*.test.ts`；用詞掃描（固定決策 23）。
- SHA 範圍檢查：除本交辦列出的檔案外，其他教材、Excel、`shared/materials.ts` 都不變。

## 五、標籤注意事項（取自 _review.json）

| 底圖 | 注意 |
|---|---|
| lungs-pleura-04、breathing-mechanics-01 | 「橫膈」錨點指上緣圓頂，不指下方凹面。 |
| lungs-pleura-07 | 細支氣管淡紅環紋是平滑肌，不要標成軟骨。 |
| breathing-mechanics-03 | 標籤或說明不要拿 state-1 與 state-3 比大小；呼氣用肺回縮、氣流向外的箭頭表達。 |
| breathing-mechanics-04 | 只標「肋間肌」位置，外層／內層由文字說明。 |
| breathing-mechanics-05 | 切成三格改上下排。 |
| lung-function-01 | 上段末端的灰色環帶不要標成軟骨。藍、紅括號保留，對應傳導區、呼吸區。 |
| gas-exchange-05 | 每格各自標高分壓／低分壓，不共用腔室名稱。 |
| gas-exchange-06 | 入肺側藍（經肺動脈）；離肺 95 放在流向說明，不用引線指肺靜脈管腔。 |
| gas-exchange-07 | 上格標「局部低氧」。 |
| respiratory-control-02 | 標籤錨點避開神經末端的小圓點。 |
| respiratory-control-04 | 頸動脈竇、主動脈竇若可見，不可標為化學受器。 |
| respiratory-control-05 | 「肺牽張受器」指主圖細支氣管上的末梢，不指放大框裡的肺泡。 |

---

## 階段一（做完停下）

**任務 0：呼吸道 V2 小修＋兩處 content**：全文照 `CODEX_TASK_post-review_2026-10-13.md` 的任務 1～3（A-01～A-06；airway 預測題選項；gas-exchange node-03「入肺靜脈血」改為「經肺動脈入肺的缺氧血」）。這份交辦還沒執行過。

**任務 1：試做 lungs-pleura 一份**：照第一、三、四節，做總覽三狀態與 6 節點（這份沒有資料層）。

交件：

- `docs/RESPIRATORY_LABELS_V2_REPORT.md`：每個圖位的標籤清單、紅字清單、最小字級、HTML 大小、verify 結果。
- 截圖與 `labels.json`。
- 更新 `handoff.md`、`DEVELOPMENT_LOG.md`（結尾 [Codex]）。
- **停下**，交 Claude 驗收錨點與解剖，再交教師看畫面並決定重點標示用 A 或 B。

## 階段二（Claude 通知後再做）

其餘五份：先完成標籤層（第一、三節），再做資料層（第二節）；驗證與交件格式同階段一。每做完一份就更新報告。全部做完後停下，交 Claude 驗收與教師看畫面。之後才 `materials:build`、寫 Excel、登錄。

---

## 階段二開工（2026-10-14 23:58，教師核准）

- 階段一已由 Claude 驗收通過（`docs/RESPIRATORY_LABELS_V2_CLAUDE_REVIEW.md`，含 23:20 複看與避頭點、B 截圖）。
- **重點樣式定案 A：紅色粗體**，`FOCUS_STYLE='red'`，不再切換。
- 範圍：breathing-mechanics、lung-function、gas-exchange、o2-co2-transport、respiratory-control 五份；照第一～五節。
- 沿用 lungs-pleura 已驗收的做法：`scripts/respiratory-labels.py`＋`labels.json`＋`scripts/respiratory-labels-verify.mjs`；圖下說明只用 content 原句並套用避頭點。
- 順序：每份先完成標籤層，再完成該份資料層（第二節），跑 preview／shots／verify，更新報告後換下一份。建議順序 gas-exchange → respiratory-control → breathing-mechanics → o2-co2-transport → lung-function（資料層最多的放最後）。
- 底圖以 `materials-src/figures/raster/_review.json` 全部 pass 的定稿 PNG 為準；`note` 欄是每張的標籤注意事項，必讀。
- 五份全部完成後停下，交 Claude 驗收與教師看畫面。仍不 build、不寫 Excel、不登錄、不 commit／push／部署。
