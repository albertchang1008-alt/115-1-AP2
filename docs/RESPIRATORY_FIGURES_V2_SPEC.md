# 呼吸其餘六次單元：ChatGPT 製圖 prompt 規格

2026-10-11，Codex 整理。**待 Claude 審核，尚未製圖，也未授權教材實作。**

教師最新決定：圖交給 ChatGPT 製作；Codex 只寫 prompt，不自行繪圖。先讓 Claude 審過，再將核可的 prompts 交給 ChatGPT。這項決定取代草稿內「Codex 繪製 SVG 曲線／概念圖」的安排。

## 一、範圍與交件

「呼吸道的構造」已有獨立V2報告，這次不重做。其餘六次單元各1份資訊圖表、6節點、11題；共36節點、66題、42個教材圖位。每份總覽有3個狀態，故這次有 **54段可複製的ChatGPT prompts**（36節點＋18總覽狀態），不是新增54份教材。

| 次單元 | 詳細規格／ChatGPT prompts | 教材圖位 | prompts |
|---|---|---:|---:|
| 肺與胸膜 | [lungs-pleura](respiratory-v2-specs/lungs-pleura.md) | 7 | 9 |
| 肺通氣與呼吸力學 | [breathing-mechanics](respiratory-v2-specs/breathing-mechanics.md) | 7 | 9 |
| 肺容積與肺功能 | [lung-function](respiratory-v2-specs/lung-function.md) | 7 | 9 |
| 氣體交換 | [gas-exchange](respiratory-v2-specs/gas-exchange.md) | 7 | 9 |
| 氧與二氧化碳的運輸 | [o2-co2-transport](respiratory-v2-specs/o2-co2-transport.md) | 7 | 9 |
| 呼吸調節 | [respiratory-control](respiratory-v2-specs/respiratory-control.md) | 7 | 9 |

每個圖位已列：畫面構成、標籤白名單、紅色粗體、三狀態差異、解剖／數值驗收、出處及對應題目ID。每段prompt可獨立貼給ChatGPT，狀態图須維持同構圖與比例；实际底圖可共用，54段不是最低必要獨立檔案數。

## 二、內容依據與固定界線

1. 基準為現行六份 `materials-src/<slug>/content.json`（10/8修正核可後），並對照 [原內容規格](RESPIRATORY_INFOGRAPHICS_SPEC.md)、`CODEX_FIX_2026-10-07.md` 及 [既有preview報告](RESPIRATORY_INFOGRAPHICS_PREVIEW.md)。保留所有文字、stats、節點、題目、答案、hint／explain、預測回饋、ID、SDK與互動。
2. [CONTENT_BASELINE.json](respiratory-v2-specs/CONTENT_BASELINE.json) 保存完整現行內容，包含66題及nodeId；[來源雜湊](respiratory-v2-specs/SCOPE_BASELINE_SHA256.json) 保存教材／圖／preview／登錄與Excel唯讀基準。它是既有內容快照，不是新課本證據。
3. 新圖不得加入A2或文末排除項：FEV₁/FVC診斷門檻、阻塞性FVC不變、紙袋處置、O₂ 98.5/1.5、高山／貧血曲線位移結論、斜角肌、70mmHg低氧收縮門檻、ARDS非心因性機轉等。既有規格明文疾病例子可視覺化，不能延伸診斷或治療。研究B結論不自行套入。
4. 本次出處為既有核定教材記載的課本頁碼；Claude需回查指定課本／reviewed原子卡。Codex未在此回合重新核對原PDF，不將頁碼標記冒稱為新的原文驗證。
5. 相對名稱、方向、分壓、反應式、曲線位移、比例長度都須能逐項核對；ChatGPT未能符合時應改prompt重新生成，不由Codex自行畫圖替代。

## 三、給ChatGPT的製圖共同要求

- 只用ChatGPT產圖；本回合不呼叫ImageGen、不生成圖檔、不編寫圖形產生器。圖像風格為清楚的醫學教科書插畫或乾淨的概念／數值圖，不使用段落框當解剖圖。
- 先產無字底圖，圖內不含中文字、英數字、標籤、引線或水印；每節的白名單供後續中文標籤位置驗收。底圖與中文字層的接合是下一階段工作，尚未授權。
- 大小／比例／座標有教學意義時必須依prompt；無指定值時不得補數字。圖內箭頭僅可依已核定流程，不能造出新的解剖連通。
- 直式或近方形、至少1200px寬；多格上下排，保留標籤空間。外框不裁斷必要器官，不能為留白把主體縮到看不清。
- 標籤後續採台灣課本用詞，長字可分行；紅字為當步重點、加粗；含氧／缺氧血流仍保持醫學語意，不能把所有重點血管改成同一色。
- 素材完成後才定原始像素錨點；現在不預造座標或宣稱已有Claude驗收位置。既有「呼吸系統圖」素材主要是呼吸道，不能直接宣稱適用於這六份所有圖。

## 四、後續圖面驗收要求（本次只規畫）

- 390px預設字級圖內中文、公式、單位與軸標均≥12px，1280px≥13px；以實際render的CSS px量測。白色描邊保護標籤，文字不裁切、不互疊；引線不交叉、不穿過其他文字框；文字框不可壓其他解剖錨點。
- 每教材7圖位，總覽3狀態＋6節點，1280／390各9張；六份合計108張實際狀態截圖。標籤數較多時上下分格，不以縮小字級解決。
- 狀態標籤與動態變化必須一起正確：壓力／氣流、膜厚／面積、比例條、受器路徑不能只改紅字而沒有對應圖面。
- 氧解離曲線保留現行滑桿／pointer與模型（k26／31／21、40約75%、正常虛線對照）。ChatGPT圖面與數學探針接合尚未定案，先請Claude審查，不能把互動直接改成靜態圖片。
- 未來檔案大小目標每教材HTML≤1.2MB。可共用底圖／裁切，底圖WebP寬1200、品質約82作後續壓縮基準；這次不壓縮、不複製或嵌入新圖。
- 圖層版面設定只作用於當份slug；本回合不改共用CSS。實作時須跑preview、materials:validate-nodes、materials測試、shots與完整作答回歸，再交Claude及教師。

## 五、Claude必須裁定的事項

| 編號 | 問題 | 所需裁定 |
|---|---|---|
| C1 | ChatGPT量化圖可能與精確資料比例不一致 | 審各prompt是否足以驗比例；無法可靠產圖時先列需教師裁定，不自行退回Codex繪圖。 |
| C2 | 氧曲線已有可拖曳模型，原480寬viewBox與探針座標有契約 | 核定ChatGPT底圖範圍與保留互動的接合方式；此次只審需求，不能靜態替代或先修改JS。 |
| C3 | 氣體交換現行concept的「入肺靜脈血」容易被誤讀為肺靜脈 | 圖面以經肺動脈入肺的低氧血標示，離肺為肺靜脈；請确认符合原文。本次不修改content。 |
| C4 | V/Q的0.24／0.07與0.82／1.29在現行concept未標單位 | 回查CH06 p.21–22；未確認前不在圖內加推測單位。 |
| C5 | 周邊受器解剖錨點尚無新底圖 | 核對CH06 p.31名稱與位置；不混頸動脈體、頸動脈竇及壓力受器。 |
| C6 | 每圖白名單較完整，可能手機擁擠 | 確認必要標籤及上下分格安排；要刪改標籤先修規格，不到實作時臨時縮字。 |

## 六、審核交件與目前狀態

Claude交辦：[CODEX_TASK_respiratory-prompts_CLAUDE_REVIEW_2026-10-11.md](../CODEX_TASK_respiratory-prompts_CLAUDE_REVIEW_2026-10-11.md)。審核結果請寫 `docs/RESPIRATORY_PROMPTS_CLAUDE_REVIEW.md`，逐教材／圖位／prompt列通過、需修改、需教師裁定與來源；結果尚未產生，不能視為審核通過。

自查：[SPEC_SELF_CHECK.json](respiratory-v2-specs/SPEC_SELF_CHECK.json)。目前只是規格與prompt文件交接；未改教材，未產圖，未preview／build、Excel、登錄、commit／push／部署。

## 七、Claude 審查結果（2026-10-13）

詳見 [RESPIRATORY_PROMPTS_CLAUDE_REVIEW.md](RESPIRATORY_PROMPTS_CLAUDE_REVIEW.md)。54 段中 **34 段可交 ChatGPT**（解剖／示意插畫）；**20 段待教師裁定 C1／C2**（曲線、比例條、公式、因果鏈）。

- C1：建議插畫交 ChatGPT，資料層（曲線、比例條、數表、公式、因果鏈）由原生 SVG／HTML 文字層依 content 數值產生；待教師裁定。
- C2：氧解離曲線、軸與探針一律保留 `oxygen-curve.js` 契約（480 viewBox、x＝60＋3.6·PO₂、y＝350－2.7·S、k 26／31／21），不交 ChatGPT。
- C3：圖面「入肺血」標經肺動脈；95 為 CH06 表 6-4「充氧血」，不以引線指肺靜脈（圖 6-15 肺靜脈為 100）。content 用詞建議留教師。
- C4：V/Q 單位為 L/分（CH06 p.22 圖 6-18），已補。
- C5：頸動脈體在頸總動脈分叉、主動脈體在主動脈弓（CH06 p.30 圖 6-25）；竇為壓力受器，不標為化學受器。已補。
- C6：o2 04 成因卡、lung-function 06 比值表、respiratory-control 05 公式改圖下 HTML 卡；多格圖每格分開產圖或直接上下堆疊（點陣圖不會隨手機重排），不縮字。

> **教師裁定（2026-10-13 16:45）**：C1 採方案 A——曲線、比例條、數表、公式、因果鏈改由原生 SVG／HTML 資料層產生，🟨 圖位不交 ChatGPT；可交 ChatGPT 的 prompt 已彙整於 [CHATGPT_PROMPT_PACK_2026-10-13.md](CHATGPT_PROMPT_PACK_2026-10-13.md)。gas-exchange content「入肺靜脈血」改為「經肺動脈入肺的缺氧血」（授權交 Codex）。
