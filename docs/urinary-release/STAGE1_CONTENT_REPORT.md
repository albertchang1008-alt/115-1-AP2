# 泌尿六份教材階段一：內容交件報告

日期：2026-10-16（台北時間）。初交來源：automation-2，01:00 單次排程。

> 最新進度見文末「R 修正（2026-10-16）」；以下初交結果保留為修正前基準。

**交件狀態：六份 content.json 初稿完成；preview 驗證未通過，依無人值守規則保留阻擋點並停止，交 Claude 審查，不宣稱完成預覽或可發布。**

- 最新遠端基底：`origin/main`＝`460ca11600b68108415d88e7468404d4271fa121`，已於本輪 fetch 核實；未依舊文件的描述另取舊版。
- worktree：`/Users/HHC/.codex/worktrees/urinary-stage1-2026-10-16/課程平台1.0`；分支 `feature/urinary-infographics`。
- 35 個節點有教學內容，另 1 個節點僅佔位；64 題四選一（先備 35、情境 29），另 6 題總覽預測。
- 六份均含副標題、3 個 stats、3 個總覽狀態與預測題；每個已寫節點含概念、獨立重點與觀察應用，以及卡片 uid／課本頁碼；題目另附 sources、hint、explain、nodeId。
- 圖面只用已 pass 的 26 張原 PNG；以 SVG 容器原樣嵌入，未裁切或重畫，未新增標籤、箭頭、數字或資料圖。資料圖位留空白佔位，總覽僅切換說明文字，底圖不隨狀態變化。

## 驗證結果

| 教材 | 節點 | 先備／情境 | JSON 結構 | preview | 全庫節點稽核 |
|---|---:|---:|---|---|---|
| kidney-anatomy | 6 | 6／5 | 通過 | 缺配色 | 題數未滿 |
| nephron-circulation | 6 | 6／5 | 通過 | 缺配色 | 題數未滿 |
| filtration-clearance | 6 | 6／5 | 通過 | 缺配色 | 題數未滿 |
| tubular-handling | 6 | 6／5 | 通過 | 缺配色 | 題數未滿 |
| urine-concentration | 6 | 6／5 | 通過 | 缺配色 | 題數未滿 |
| urinary-route-micturition | 6 | 5／4 | 題數未滿，保留失敗 | 題數未滿，未進配色階段 | 題數未滿 |

- 每份均實際跑 `npm run materials:preview <slug>` 及 `npm run materials:validate-nodes`；完整 stdout／stderr 留同目錄 `<slug>-preview.log`、`<slug>-node-audit.log`。六次全庫稽核均已走過既有教材瀏覽器擷取，最後在全部來源結構驗證時遇到最後一份題數不足而退出，不能記為全庫通過。
- 獨立呼叫未修改的 `validateMaterialContent`：前五份通過；最後一份只報先備 5／6、情境 4／5。六份 `validateNodeText` 均為空錯誤陣列（見 schema.log）。
- 用詞／範圍掃描：六份 0 命中禁用大陸用詞與所掃描的疾病、藥物／處置詞；檢查每題四個不同選項、hint／explain 非空、來源非空、無重複題目 ID。掃描是字串檢查，不能取代 Claude 的逐題內容審核。
- 正解位置：依交辦「正解先寫第一選項」，64 題均 answer=0；另 6 題預測也均 answer=0。學生選項由未改動 `kit.js` 的 shuffle 在 render 時洗牌；本輪無成功新 preview，因此未宣稱已驗證新頁面的實際位置分布。
- 額外教材共用測試：首次 Node 原生執行器因既有無副檔名匯入而失敗（保留 material-kit-tests.log），改用專案既定 `tsx --test tests/material-kit.test.ts tests/material-kit-completion.test.ts` 後 **7／7 通過、0 skip**（material-kit-tests-tsx.log）。未執行 build。

## 阻擋、跳過與待裁定清單

1. **預覽缺配色**：前五份的 preview 皆在 `materials-src/kit/presentation.mjs` 報 `Missing material palette: <slug>-v1`，無 HTML 寫出。該共用表尚無六個泌尿 slug。這是內容以外的共用程式變更；本輪僅 content／preview，不自行選色或修改共用表，也未改用其他教材 slug 規避。最後一份在較早的題數檢查即停止，同樣未產頁。待教師另行交辦／裁定配色後重跑。
2. **未核可節點**：`urinary-route-micturition-node-06` 只留「待教師核可卡片」，`sources=[]`、pendingSources 指向 urine-physical-properties，沒有尿量／比重／pH 數值或相關題目。略過 `urinary-route-micturition-foundation-q06` 及 `urinary-route-micturition-case-q05`，不改其他題 ID、不補造題。
3. **題數與驗證規則衝突**：既有預設要求 6＋5 題；本輪授權要求略過上述兩題且不放寬保護，因此最後一份保留 5＋4 題。沒有增設 rules 例外，沒有改 shared/materialKit.ts、驗證器或 kit。這使六次全庫節點稽核全數停在此處；待教師處理卡片核可及後續內容流程後重跑。
4. **標🟨／🟧的歷史註記**：以各 spec 10/13 16:45 教師裁定為準；資料層製作已另定原生 SVG，本輪只寫已核定的文字概念，資料圖仍佔位。近曲採 Na⁺約67%、水約75%，RBF 不寫數字，過濾壓只用 55＋0－15－30＝10 mmHg。375 mg/min 已有 Claude 原頁回核與 reviewed 卡支持。未把舊表的「待資料層」誤當成數值未核定，也未新增任何尚待數值裁定。
5. **圖面審查備註留給下一輪**：kidney 01 為前面觀、畫面左為身體右，05 的兩腎等高不教高低；tubular 03 的鉀／鈉方向需標籤層；urinary 04 膀胱頸旁腺體不標；urinary 05 依最新審查紀錄已由 Claude 將修正女性上格與原下格接回，兩格間有白色間隔，標籤層需維持男女對照。完整逐圖審查備註留 stage1-figure-map.json 與 stage1-image-review.json，本輪不做圖面取捨或補圖。
6. **驗收限制**：沒有新教材 HTML，故未做新頁的桌機／手機截圖、總覽狀態圖層、逐題通關及追蹤驗收；不能把既有共用 kit 測試當作新教材頁面已驗收。

## 來源卡稽核

卡片是本機唯讀來源；沒有回改卡片或進度。這輪使用的卡片須逐一為 reviewed；唯一 draft 只作跳過依據，不作教學來源。stage1-baseline.json 保留各卡路徑、狀態與 SHA256；stage1-protection.json 確認來源未變。

| uid | 開工狀態 | 用途 |
|---|---|---|
| adh-water-reabsorption | reviewed | 授課／題目來源 |
| countercurrent-mechanism | reviewed | 授課／題目來源 |
| gfr-regulation | reviewed | 授課／題目來源 |
| glomerular-filtration | reviewed | 授課／題目來源 |
| juxtaglomerular-apparatus | reviewed | 授課／題目來源 |
| kidney-endocrine | reviewed | 授課／題目來源 |
| kidney-position | reviewed | 授課／題目來源 |
| kidney-structure | reviewed | 授課／題目來源 |
| micturition-reflex | reviewed | 授課／題目來源 |
| nephron-histology | reviewed | 授課／題目來源 |
| nephron-types | reviewed | 授課／題目來源 |
| potassium-secretion | reviewed | 授課／題目來源 |
| renal-blood-flow | reviewed | 授課／題目來源 |
| renal-clearance | reviewed | 授課／題目來源 |
| renal-handling | reviewed | 授課／題目來源 |
| tubular-reabsorption | reviewed | 授課／題目來源 |
| ureter-constrictions | reviewed | 授課／題目來源 |
| urethra | reviewed | 授課／題目來源 |
| urinary-bladder | reviewed | 授課／題目來源 |
| urinary-system-overview | reviewed | 授課／題目來源 |
| urine-concentration | reviewed | 授課／題目來源 |
| urine-physical-properties | draft | 僅稽核、未引用授課內容 |

過濾壓節點額外引用 reviewed 的 gfr-regulation，讓核定計算例有直接卡片依據；腎上腺與腎臟區別題依 reviewed kidney-position 的器官區別，未擴寫腎上腺激素。各題來源完整頁碼在 content.json；下列列出節點與圖位供審查。

## 腎臟位置、構造與功能 `kidney-anatomy`

| 節點 | 標題 | 底圖／佔位 | 來源卡 |
|---|---|---|---|
| 01 | 腎臟的位置 | IMG-kidney-anatomy-02.png | kidney-position |
| 02 | 皮質、髓質與腎柱 | IMG-kidney-anatomy-03.png | kidney-structure |
| 03 | 乳頭、腎盞與腎盂 | IMG-kidney-anatomy-03.png | kidney-structure |
| 04 | 腎門與保護層 | IMG-kidney-anatomy-04.png | kidney-structure、kidney-position |
| 05 | 器官分工與尿液形成 | IMG-kidney-anatomy-05.png | urinary-system-overview |
| 06 | 腎臟的內分泌功能 | IMG-kidney-anatomy-06.png | kidney-endocrine |

總覽三狀態：位置／切面／功能；共用 IMG-kidney-anatomy-01.png。

| 題目 ID | 題幹 | 正解 | 對應節點 |
|---|---|---|---|
| kidney-anatomy-foundation-q01 | 關於腎臟位置，哪一項正確？ | 位於後腹腔，右腎通常較低 | kidney-anatomy-node-01 |
| kidney-anatomy-foundation-q02 | 腎柱是什麼構造？ | 深入腎錐體之間的皮質 | kidney-anatomy-node-02 |
| kidney-anatomy-foundation-q03 | 腎乳頭流出的尿液先由哪個構造承接？ | 小腎盞 | kidney-anatomy-node-03 |
| kidney-anatomy-foundation-q04 | 腎外包覆層由內而外的順序為何？ | 腎被膜、脂肪囊、腎筋膜 | kidney-anatomy-node-04 |
| kidney-anatomy-foundation-q05 | 哪個配對符合泌尿系統器官分工？ | 腎臟形成尿液，膀胱儲存尿液 | kidney-anatomy-node-05 |
| kidney-anatomy-foundation-q06 | 腎臟的紅血球生成素（腎紅血球生成因子）主要參與何種功能？ | 促進紅血球生成 | kidney-anatomy-node-06 |
| kidney-anatomy-case-q01 | 【切面觀察】兩個腎錐體之間的組織與外圍皮質相連，應辨認為何？ | 腎柱 | kidney-anatomy-node-02 |
| kidney-anatomy-case-q02 | 【路徑觀察】由集尿管出口沿尿液方向追蹤，經乳頭後的正確順序為何？ | 小腎盞、大腎盞、腎盂 | kidney-anatomy-node-03 |
| kidney-anatomy-case-q03 | 【器官配對】尿液已離開腎盂，正被送往膀胱；排到體外時又經另一條管道。兩者依序為何？ | 輸尿管、尿道 | kidney-anatomy-node-05 |
| kidney-anatomy-case-q04 | 【模型觀察】腎上腺位於腎臟附近。哪種判讀符合器官定位？ | 鄰近腎臟，仍是另一個器官 | kidney-anatomy-node-04 |
| kidney-anatomy-case-q05 | 【概念整理】只以尿量整理腎臟功能，會漏掉下列哪一組角色？ | 造血訊號與維生素 D 活化 | kidney-anatomy-node-06 |

總覽預測：由「位置」切到「切面」閱讀主題，應改以哪項關係為主？ 正解：外皮質、內髓質及尿液收集區。

## 腎元、腎血流與近腎絲球器 `nephron-circulation`

| 節點 | 標題 | 底圖／佔位 | 來源卡 |
|---|---|---|---|
| 01 | 腎元基本構造 | IMG-nephron-circulation-02.png | nephron-histology |
| 02 | 皮質與近髓質腎元 | IMG-nephron-circulation-01.png | nephron-types |
| 03 | 腎小管各段上皮 | IMG-nephron-circulation-03.png | nephron-histology |
| 04 | 腎臟血流路徑 | IMG-nephron-circulation-04.png | renal-blood-flow |
| 05 | 近腎絲球器的位置與細胞 | IMG-nephron-circulation-05.png | juxtaglomerular-apparatus |
| 06 | 血流、血漿流量與過濾分率 | 佔位（本輪不做資料／標籤層） | renal-blood-flow |

總覽三狀態：短環／長環／訊號；共用 IMG-nephron-circulation-01.png。

| 題目 ID | 題幹 | 正解 | 對應節點 |
|---|---|---|---|
| nephron-circulation-foundation-q01 | 腎元的基本組成為何？ | 腎小體與腎小管 | nephron-circulation-node-01 |
| nephron-circulation-foundation-q02 | 比較皮質與近髓質腎元，哪一項正確？ | 兩型腎小體都位於皮質 | nephron-circulation-node-02 |
| nephron-circulation-foundation-q03 | 有明顯刷狀緣的立方上皮，最符合哪個管段？ | 近曲小管 | nephron-circulation-node-03 |
| nephron-circulation-foundation-q04 | 腎絲球前後相接的血管依序為何？ | 入球小動脈、出球小動脈 | nephron-circulation-node-04 |
| nephron-circulation-foundation-q05 | 近腎絲球器中，感受管液鈉變化的是何者？ | 遠曲小管的緻密斑 | nephron-circulation-node-05 |
| nephron-circulation-foundation-q06 | 過濾分率 FF 的算法為何？ | GFR／RPF | nephron-circulation-node-06 |
| nephron-circulation-case-q01 | 【定位觀察】某腎元的長環深入髓質，腎小體靠近皮髓交界。腎小體仍應標在哪一區？ | 皮質 | nephron-circulation-node-02 |
| nephron-circulation-case-q02 | 【血流追蹤】血液剛離開出球小動脈，下一段應接何者？ | 管周微血管或直血管 | nephron-circulation-node-04 |
| nephron-circulation-case-q03 | 【切片觀察】一段腎小管為立方上皮，管腔面有密集刷狀緣，最可能為何？ | 近曲小管 | nephron-circulation-node-03 |
| nephron-circulation-case-q04 | 【訊號配對】要在近腎絲球器標出腎素分泌來源，應選哪個位置？ | 入球小動脈壁的近腎絲球細胞 | nephron-circulation-node-05 |
| nephron-circulation-case-q05 | 【流量判讀】同學以 GFR 除以全部腎血流量來算 FF，應修正哪個項目？ | 分母改為腎血漿流量 | nephron-circulation-node-06 |

總覽預測：由「短環」切到「長環」閱讀主題，哪個比較正確？ 正解：近髓質腎元的長環較深入髓質。

## 腎絲球過濾與清除率 `filtration-clearance`

| 節點 | 標題 | 底圖／佔位 | 來源卡 |
|---|---|---|---|
| 01 | 過濾位置與方向 | IMG-filtration-clearance-01.png | glomerular-filtration |
| 02 | 三層過濾膜 | IMG-filtration-clearance-02.png | glomerular-filtration |
| 03 | 血漿與濾液成分 | IMG-filtration-clearance-03.png | glomerular-filtration |
| 04 | 促進與對抗過濾的壓力 | 佔位（本輪不做資料／標籤層） | glomerular-filtration、gfr-regulation |
| 05 | 清除率的量與單位 | 佔位（本輪不做資料／標籤層） | renal-clearance |
| 06 | 菊糖、肌酸酐與PAH | IMG-filtration-clearance-04.png | renal-clearance |

總覽三狀態：過濾／排泄／計算；共用 IMG-filtration-clearance-01.png。

| 題目 ID | 題幹 | 正解 | 對應節點 |
|---|---|---|---|
| filtration-clearance-foundation-q01 | 腎絲球過濾的主要方向為何？ | 腎絲球微血管到鮑氏囊腔 | filtration-clearance-node-01 |
| filtration-clearance-foundation-q02 | 哪一組構成三層過濾膜？ | 微血管內皮、基底膜、足細胞 | filtration-clearance-node-02 |
| filtration-clearance-foundation-q03 | 比較正常血漿與腎絲球濾液，哪一項較能顯示兩者差別？ | 白蛋白的含量 | filtration-clearance-node-03 |
| filtration-clearance-foundation-q04 | 哪種壓力促進腎絲球過濾？ | 腎絲球微血管靜水壓 | filtration-clearance-node-04 |
| filtration-clearance-foundation-q05 | C＝U×V／P 計算出的清除率，表示哪種量？ | 每分鐘相當被清除的血漿體積 | filtration-clearance-node-05 |
| filtration-clearance-foundation-q06 | 哪種物質只過濾、不再吸收也不分泌，可用其清除率對應 GFR？ | 菊糖 | filtration-clearance-node-06 |
| filtration-clearance-case-q01 | 【單位整理】收集一小時尿液後，要把尿量帶入以 mL/min 為單位的 V，應如何處理？ | 一小時尿量除以 60 | filtration-clearance-node-05 |
| filtration-clearance-case-q02 | 【結果判讀】計算得到清除率 69 mL/min，哪種說明符合其意義？ | 每分鐘相當清除 69 mL 血漿中的該物質 | filtration-clearance-node-05 |
| filtration-clearance-case-q03 | 【指標比較】菊糖與肌酸酐都可用來理解 GFR，哪項差異正確？ | 肌酸酐另有少量分泌，菊糖不分泌 | filtration-clearance-node-06 |
| filtration-clearance-case-q04 | 【流量配對】將 PAH 清除率直接標為全部腎血流量，問題在哪裡？ | 它估的是腎血漿流量，換算血流還需血漿比例 | filtration-clearance-node-06 |
| filtration-clearance-case-q05 | 【成分比較】同學說「濾液與血漿不同，因為濾液移除了血漿中的血球」，應如何修正？ | 血漿原本不含血球，應著重蛋白質差異 | filtration-clearance-node-03 |

總覽預測：由過濾方向改看菊糖的排泄，應預測哪種小管處理？ 正解：只過濾，不再吸收也不分泌。

## 腎小管再吸收、分泌與排泄 `tubular-handling`

| 節點 | 標題 | 底圖／佔位 | 來源卡 |
|---|---|---|---|
| 01 | 三種物質移動 | IMG-tubular-handling-01.png | renal-handling |
| 02 | 排泄量的收支 | 佔位（本輪不做資料／標籤層） | renal-handling |
| 03 | 近曲小管的回收 | IMG-tubular-handling-02.png | tubular-reabsorption |
| 04 | 葡萄糖的最大轉運量 | 佔位（本輪不做資料／標籤層） | tubular-reabsorption |
| 05 | 鉀的調節性分泌 | IMG-tubular-handling-03.png | potassium-secretion |
| 06 | 濃度比與排泄量 | 佔位（本輪不做資料／標籤層） | renal-handling、tubular-reabsorption |

總覽三狀態：大量回收／回收／分泌；共用 IMG-tubular-handling-01.png。

| 題目 ID | 題幹 | 正解 | 對應節點 |
|---|---|---|---|
| tubular-handling-foundation-q01 | 物質從小管管液移回血液，稱為何者？ | 再吸收 | tubular-handling-node-01 |
| tubular-handling-foundation-q02 | 同一物質的排泄量收支式為何？ | 過濾量－再吸收量＋分泌量 | tubular-handling-node-02 |
| tubular-handling-foundation-q03 | 近曲小管回收葡萄糖與水的機轉配對，何者正確？ | 葡萄糖隨 Na⁺共同運輸，水依滲透作用回收 | tubular-handling-node-03 |
| tubular-handling-foundation-q04 | 葡萄糖最大轉運量代表何種意義？ | 每分鐘可運輸的葡萄糖量上限 | tubular-handling-node-04 |
| tubular-handling-foundation-q05 | 醛固酮對遠端 Na⁺與 K⁺處理的作用為何？ | 增加 Na⁺再吸收及 K⁺分泌 | tubular-handling-node-05 |
| tubular-handling-foundation-q06 | 僅見尿中某物質濃度較高，能否直接判定其分泌增加？ | 不能，水回收與尿流量也影響判讀 | tubular-handling-node-06 |
| tubular-handling-case-q01 | 【方向判讀】某物質由管周血液移入小管管液，應標哪個動詞？ | 分泌 | tubular-handling-node-01 |
| tubular-handling-case-q02 | 【收支比較】其他量固定，再吸收量增加時，最終物質排泄量如何改變？ | 減少 | tubular-handling-node-02 |
| tubular-handling-case-q03 | 【尿樣比較】兩份尿樣中同一物質的尿濃度相同，甲的每分鐘尿流量較大，何者正確？ | 甲每分鐘排出的物質量較多 | tubular-handling-node-06 |
| tubular-handling-case-q04 | 【能力比較】正常葡萄糖過濾負荷未超過小管回收能力且運輸功能完整時，預期為何？ | 葡萄糖可被回收 | tubular-handling-node-04 |
| tubular-handling-case-q05 | 【方向配對】醛固酮作用增加時，遠端的鈉與鉀移動應如何配對？ | 鈉由管液回血，鉀由血入管液 | tubular-handling-node-05 |

總覽預測：切到葡萄糖「回收」主題，正常運輸功能完整且負荷未超能力時，物質移動方向為何？ 正解：由管液回血液。

## 逆流機制與尿液濃縮 `urine-concentration`

| 節點 | 標題 | 底圖／佔位 | 來源卡 |
|---|---|---|---|
| 01 | 髓質梯度與濃縮條件 | IMG-urine-concentration-01.png | urine-concentration |
| 02 | 亨利氏環下降枝 | IMG-urine-concentration-01.png | countercurrent-mechanism |
| 03 | 亨利氏環上升枝 | IMG-urine-concentration-01.png | countercurrent-mechanism |
| 04 | 直血管逆流交換 | IMG-urine-concentration-01.png | countercurrent-mechanism |
| 05 | ADH與水通道 | IMG-urine-concentration-02.png | adh-water-reabsorption |
| 06 | 濃尿與稀尿條件比較 | IMG-urine-concentration-02.png | urine-concentration、adh-water-reabsorption |

總覽三狀態：少水／較多水／有梯度但不通水；共用 IMG-urine-concentration-01.png。

| 題目 ID | 題幹 | 正解 | 對應節點 |
|---|---|---|---|
| urine-concentration-foundation-q01 | 濃縮尿液需配合哪一組條件？ | 髓質滲透梯度與可通水的集尿管 | urine-concentration-node-01 |
| urine-concentration-foundation-q02 | 亨利氏環下降枝的主要特性為何？ | 對水通透，水可沿梯度移出 | urine-concentration-node-02 |
| urine-concentration-foundation-q03 | 亨利氏環上升枝回收 NaCl 時，水的通透性為何？ | 不透水 | urine-concentration-node-03 |
| urine-concentration-foundation-q04 | 直血管在逆流機制中的主要角色為何？ | 逆流交換以減少髓質梯度流失 | urine-concentration-node-04 |
| urine-concentration-foundation-q05 | ADH 增加集尿管水回收的直接機轉為何？ | 經 V2 受器增加水通道與水通透性 | urine-concentration-node-05 |
| urine-concentration-foundation-q06 | 其他條件相同，ADH 較多時尿量與濃度的方向為何？ | 尿量較少、尿較濃 | urine-concentration-node-06 |
| urine-concentration-case-q01 | 【管段比較】某段回收 NaCl，水卻無法隨之通過，最符合哪個管段？ | 亨利氏環上升枝 | urine-concentration-node-03 |
| urine-concentration-case-q02 | 【角色配對】同學將亨利氏環與直血管都寫成「逆流交換血管」，應如何修正？ | 亨利氏環為小管逆流增強，直血管為血管逆流交換 | urine-concentration-node-04 |
| urine-concentration-case-q03 | 【訊號觀察】集尿管水通道增加，水通透性上升，哪項最直接符合此變化？ | ADH 經 V2 受器作用 | urine-concentration-node-05 |
| urine-concentration-case-q04 | 【條件推論】髓質已有高滲透梯度，但集尿管仍不易通水，能否只靠梯度得到同樣濃縮效果？ | 不能，末端水通透性仍是必要條件 | urine-concentration-node-01 |
| urine-concentration-case-q05 | 【模型比較】其他條件相同，由 ADH 較多切到較少時，合理方向為何？ | 水回收減少、尿量增加、尿較稀 | urine-concentration-node-06 |

總覽預測：其他條件相同，由較少水切到較多水、ADH 較少的比較狀態時，預測哪個方向？ 正解：水回收減少，尿量增加且較稀。

## 尿液通路與排尿控制 `urinary-route-micturition`

| 節點 | 標題 | 底圖／佔位 | 來源卡 |
|---|---|---|---|
| 01 | 輸尿管的蠕動與防逆流 | IMG-urinary-route-micturition-02.png | ureter-constrictions |
| 02 | 輸尿管三處狹窄 | IMG-urinary-route-micturition-03.png | ureter-constrictions |
| 03 | 膀胱三角與逼尿肌（迫尿肌） | IMG-urinary-route-micturition-04.png | urinary-bladder |
| 04 | 男女尿道與括約肌 | IMG-urinary-route-micturition-05.png | urethra |
| 05 | 儲尿與排尿反射 | IMG-urinary-route-micturition-06.png | micturition-reflex |
| 06 | 尿液特性與尿量 | 佔位（本輪不做資料／標籤層） | 未引用；待教師核可卡片 |

總覽三狀態：流經／儲尿／排尿；共用 IMG-urinary-route-micturition-01.png。

| 題目 ID | 題幹 | 正解 | 對應節點 |
|---|---|---|---|
| urinary-route-micturition-foundation-q01 | 輸尿管送尿及防逆流的配對，何者正確？ | 靠蠕動送尿，斜行穿入膀胱壁有助防逆流 | urinary-route-micturition-node-01 |
| urinary-route-micturition-foundation-q02 | 依 AB-05_15 指定來源，輸尿管中段狹窄位於哪裡？ | 與髂外動脈及靜脈交叉處 | urinary-route-micturition-node-02 |
| urinary-route-micturition-foundation-q03 | 膀胱三角由哪三個開口界定？ | 兩個輸尿管口與一個尿道內口 | urinary-route-micturition-node-03 |
| urinary-route-micturition-foundation-q04 | 哪個尿道括約肌具有骨骼肌及隨意控制特性？ | 外括約肌 | urinary-route-micturition-node-04 |
| urinary-route-micturition-foundation-q05 | 排尿反射時，哪種組合有利排出尿液？ | 逼尿肌（迫尿肌）收縮、出口放鬆 | urinary-route-micturition-node-05 |
| urinary-route-micturition-case-q01 | 【通路觀察】輸尿管斜行穿入膀胱壁，膀胱內壓增加可使該段受壓閉合，應如何理解？ | 有助防逆流的生理性瓣膜作用 | urinary-route-micturition-node-01 |
| urinary-route-micturition-case-q02 | 【來源核對】教材採 AB-05_15，三處狹窄的中間一處應保留哪種文字？ | 與髂外動脈及靜脈交叉處 | urinary-route-micturition-node-02 |
| urinary-route-micturition-case-q03 | 【內面圖觀察】要在膀胱內面圈出三角，應連接何者？ | 左右輸尿管口及尿道內口 | urinary-route-micturition-node-03 |
| urinary-route-micturition-case-q04 | 【控制配對】想說明可用意識暫時控制排尿出口，應連到哪一組？ | 陰神經與尿道外括約肌 | urinary-route-micturition-node-05 |

總覽預測：從流經路徑改看「儲尿」狀態，何種壁肌與出口配合較符合？ 正解：逼尿肌（迫尿肌）放鬆，出口保持控制。

## 保護與交接

- 原根目錄 1830 個既有追蹤檔 SHA 不變，仍在 feature/respiratory-infographics；原未追蹤檔案只唯讀拷貝必要指定檔案，未刪改。
- 六份 spec、總規格、Claude review 及風格指南以原檔複製，SHA 相同；交辦讀取原根目錄檔，未納入本輪 commit；只複製六份泌尿原圖，不含 _rejected 或體液四份。報告證據不擷取私人照片。
- shared/materials.ts、figures/manifest.json、共用配色／驗證器與 Excel SHA 都與最新 main 基底一致；public/materials 沒有新增泌尿頁。未對 Google Sheet 或平台做任何讀寫。
- 未執行 materials:build、登錄、Excel／Sheet 寫入、push、merge main、部署或平台同步；未動正式資料，未新增標籤／資料層。
- 本輪只做一次 feature 分支本機 commit，末尾 [Codex]；實際 SHA 以本 worktree git log -1 為準。handoff 與 DEVELOPMENT_LOG 同筆提交；完成後停止交 Claude，無自動後續跑。
- Claude 下一步先審六份文字、64 題與6題預測的來源與題意；兩項技術阻擋（配色與缺題）待教師裁定後另行修復及重驗。本次 content 屬初稿，不是可發布版本。

## R 修正（2026-10-16）

**最新交件：R1–R5 已按審查處理；D1 已完成指定配色變更及五份預覽／截圖；D2 卡片仍 draft，依法保留佔位。五份可供本機預覽，第六份與全庫節點稽核仍停在缺題檢查，未放寬驗證規則。**

- 分支 `feature/urinary-infographics`；本輪基底 `fc174f1`。所有變更只在指定 worktree，本輪本機 commit 一次（SHA 見本分支 git log -1），未 push／合併／部署。

### R1：資料中的正解位置與前後比對

- 每份按先備題後接情境題，正解位置從 0→1→2→3 循環；五份完整 11 題的分布均為 0:3、1:3、2:3、3:2。尿路九題為 0:3、1:2、2:2、3:2（保留缺題，不重新編 ID）。
- 六份預測依教材順序輪替為 0、1、2、3、0、1。所有題目仍各四個不同選項。
- **只比較選項重排這一步：70／70 題的正解文字、題幹／hint／explain（預測為 question／feedback）及選項集合均不變**。證據 `r-fixes/before-shuffle.json` 與 `r1-answer-comparison.json`。
- 與本輪最初的 fc174f1 比較：67／70 題正解文字完全相同；另外三題正解變更正是 R2 case-q02 與 R3 兩題的指定重寫。共四題 stem／hint／explain 改寫（含 R2 foundation-q02），全部白名單核對，其餘無意外文字改變。完整前後文字見 `intentional-question-rewrites.json`，不將指定改題誤報為 R1 正解漂移。
- 五份實際預覽在 1280／390 測得 **110 個題目按鈕對應＋10 個預測正解對應全部正確**，即使 runtime 洗牌，data-answer 仍對應來源的正解文字；見 browser-verification.json。

### R2：尿路教材學生文字

- node-02 的 concept 與學生卡 summary 刪除「依指定解剖課本」，points[1] 與 clinical 改為審稿指定文字。
- foundation-q02 改為中段狹窄定位題，hint／explain 同步去除「指定來源」及編者比對指示；正解文字不變。
- case-q02 改成「一滴尿液」路徑追蹤，正解為腎盂交接→髂外動靜脈交叉→膀胱壁，三個干擾項為倒序／混入尿道內口；對應 node-02、來源卡不變，不寫症狀或處置。
- node-04 points[2] 改為「女性尿道較短且只供排尿；男性尿道兼為生殖管道。」已核對 reviewed urethra 卡的尿道排尿、男女長度及男性精液通路敘述。stats[2] 改為「三處／輸尿管狹窄」。
- 正常學生引用列 reference 與頁尾改為中文書名、章名及頁碼，不顯示卡片 uid／AB-05／CH09；機器可讀 sources 保留原值，仍可追來源。尿路學生可見欄位掃描無課本代碼／來源核對／指定來源等編者語。未核可節點的「待教師核可卡片」依 D2 明確保留。

### R3：兩題換角度

- nephron-circulation-case-q03 改為髓質薄管的扁平上皮，正解「亨利氏環薄段」；對應 node-03／nephron-histology。
- filtration-clearance-case-q05 改為初始濾液葡萄糖與血漿濃度相近，正解「葡萄糖可自由通過過濾膜」；對應 node-03／glomerular-filtration。
- 四選項及 hint／explain 依新角度更新，其他先備／情境題不更換考點。

### R4：Lacis 用語

- 本輪完整讀取 reviewed juxtaglomerular-apparatus 卡：只有「Lacis 細胞」，未提供中文名稱。因此依 R4 例外維持原文，不自行加入中文譯名，也不修改來源卡。卡片 SHA 與狀態見 baseline.json，收工卡片 SHA 不變。

### R5、D1 與 D2 驗證

| 教材 | schema | validateNodeText | 用詞掃描 | preview | 390／1280 標準截圖 |
|---|---|---|---|---|---|
| kidney-anatomy | 通過 | 無錯誤 | 0 命中 | 通過 | 20 張通過 |
| nephron-circulation | 通過 | 無錯誤 | 0 命中 | 通過 | 20 張通過 |
| filtration-clearance | 通過 | 無錯誤 | 0 命中 | 通過 | 20 張通過 |
| tubular-handling | 通過 | 無錯誤 | 0 命中 | 通過 | 20 張通過 |
| urine-concentration | 通過 | 無錯誤 | 0 命中 | 通過 | 20 張通過 |
| urinary-route-micturition | 依 D2 保留題數失敗 | 無錯誤 | 0 命中 | 題數失敗 | 無：未產生 HTML |

- D1 只在 `materials-src/kit/presentation.mjs` 的 `hues` 表新增六個泌尿 slug，全部 hue=176（青綠色系）；既有鍵值、studentPaletteGroups、函式及其他共用程式完全不變。以移除六個新鍵後逐位元等於基底原檔核對。沒有改 catalog、manifest 或驗證器。
- 六份 `npm run materials:preview <slug>` 都實際執行；前五份成功，第六份因 5＋4 題在結構檢查停止，未建立或偽造其 preview。
- 五份標準 `npm run materials:shots <slug>` 共 100 張（每份 2 尺寸×初始頁、3 狀態、6 節點），全部 ok=true、0 console／pageerror，初始頁無水平捲動；圖層仍是本階段原始無字底圖／空白佔位，不宣稱標籤可讀性或圖層製作完成。每份 shots-report.json 已複製到 r-fixes 供 commit 後檢閱；100 張完整 PNG 在各 materials-src/<slug>/shots/（既有 ignored 產物，不納入 commit）。另有下表 10 張視窗截圖納入交件。
- D2：開工與收工檢查 urine-physical-properties 皆為 draft，卡片 SHA 不變；node-06、pendingSources、佔位文字完整不變，foundation-q06／case-q05 仍未建立。無 rules 例外，不用其他卡繞過，不補數值。
- `npm run materials:validate-nodes` 已重跑；既有教材瀏覽器擷取及其後來源檢查走到尿路題數時，仍只因 foundation 5／6、cases 4／5 退出。這是 D2 的保留失敗，不能記為全庫通過。完整 log 在 all-node-audit.log。
- 教材共用測試 `tsx --test tests/material-kit.test.ts tests/material-kit-completion.test.ts` **7／7 通過，0 skipped**；`git diff --check` 通過。
- 本輪詞彙掃描含紅細胞／毛細血管／每搏量／感受器／粘度／點擊及疾病藥物處置詞，六份 0 命中；不取代 Claude 最終逐句複驗。

### 桌機與手機截圖

| 教材 | 桌機 1280 | 手機 390 |
|---|---|---|
| kidney-anatomy | [桌機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/kidney-anatomy-1280.png) | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/kidney-anatomy-390.png) |
| nephron-circulation | [桌機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/nephron-circulation-1280.png) | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/nephron-circulation-390.png) |
| filtration-clearance | [桌機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/filtration-clearance-1280.png) | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/filtration-clearance-390.png) |
| tubular-handling | [桌機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/tubular-handling-1280.png) | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/tubular-handling-390.png) |
| urine-concentration | [桌機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/urine-concentration-1280.png) | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/r-fixes/screenshots/urine-concentration-390.png) |

尿路教材因 D2 尚無可產生的預覽，沒有截圖。其餘五份已抽看桌機／手機畫面，完整 100 張供 Claude 於本機接續核對。手機長標題及雙欄 stats 會依既有版型自動換行，抽查可見「腎絲球器」「分泌」等詞被跨行拆開；本輪禁止修改其他共用程式，因此未調整共同版型，留後續版面驗收處理，不將無溢位等同所有文字斷行已完善。

### 範圍保護與下一步

- 原根目錄 1830 個已追蹤檔 SHA 不變；三張本輪查核卡 SHA 不變。原底圖與其他教材來源未改。
- shared/materials.ts、figures/manifest.json、shared/materialKit.ts、preview／audit 腳本與 Excel 相對 fc174f1 完全不變；共用程式 diff 只有指定的配色表新增。完整保護證據在 protection-and-summary.json。
- 只產生 preview（public/materials 下五份 HTML），沒有執行 materials:build，沒有登錄、Excel／Sheet 寫入、push、部署或平台同步。沒有做標籤／資料層，也沒有進入體液四份。
- 交件後停 Claude 複驗 R1–R5、D1 配色與截圖；D2 待教師核可來源卡，屆時另交辦補節點與兩題、重跑最後一份 preview 及全庫稽核。審稿允許保留的階段一 lab.intro／caption 本輪不改，下一輪正式圖層仍須替換。
