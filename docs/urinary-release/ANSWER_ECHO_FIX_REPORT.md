# 給 Claude 的摘要

- #6b，基底3e524158：126題掃描命中12題；修正其中10題，另依A段修S-A／S-B；共改full 4題選項、題庫8題；2題附理由精確放行。
- 長字串命中3題、關鍵詞命中10題，兩者重疊1題；最終長字串命中0、關鍵詞2題均逐題放行，未處理0。
- 檔案：酸鹼full.json、6份apply.json、7份HTML、answer-echo-check.mjs／型別／測試、精確核可與題庫匯出器、Excel。
- Sheet與Excel各只改8列23格；21184／9894格比對通過；其餘102題、正解位置、ID、來源、節點、②⑤不變。
- PASS：126題檢查、負例CLI exit 1、7項新測試、33項檢查器回歸、十份content-check、990個三方欄位、實際Sheet parseBankSheet 655題／本批110題。
- PASS：十份verify／content-check／SCRIPT_DIFF、80條八尺寸流程、6552畫面、2648事件，無效0；間距最大18px。npm前端215／Functions61與build通過。
- 偏離：無；初輪npm發現匯出器仍鎖前稿，已加入本次八題整份核可稿SHA並重跑，未放寬成任意改題。
- 抽查5項：R-A手機選項、腎臟case-q04、過濾foundation-q01／q04／q05、排尿foundation-q06、兩項關鍵詞放行理由。
- 不push、不按同步、不部署、不讀寫學生資料、不改reviewed；完成停-等Claude。

## 掃描方法

自動腳本：`scripts/answer-echo-check.mjs`，七項測試已納入npm test。
1. 以Unicode NFKC統一同形符號、英文大小寫，移除標點與空白；逐字計算題幹與四個選項的最長連續相同字串。正解長度≥6且大於所有誘答，列longest-exclusive。
2. 對題幹、選項掃描明列的解剖／生理名詞與化學符號詞表；只在題幹與正解出現、其餘三個誘答都沒有的詞，另列keyword-exclusive。詞表完整列在腳本與scan JSON；這是可檢視的詞表規則，不冒稱涵蓋所有未定義自然語言關鍵詞。
3. 標記是審稿線索；不直接等同題目錯誤。放行必須逐題寫理由，並同時綁scope、ID及stem／options／answer精確SHA；多改任一字、移動答案或增加新規則命中都不能套用舊放行。
4. 原始16題full與110題bank各自保留scope，不能因觀念相同漏掃或合併；最終來源／結構由validate-source.mjs獨立比對3e524158。

[126題修改前完整掃描](answer-echo-fix/before-scan.json)｜[126題最終逐題掃描](answer-echo-fix/final-scan.json)｜[掃描實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/final-scan.log)

## A：四種酸鹼名稱選項

四題題幹維持原本白話的原因與pH變化；glossary、feedback、reasons、reasonFeedback都保留本輪開工時的版本。題幹沒有正解名稱的整串字，選項也不再重述題幹原因。

| 題目 | 原選項 | 最終選項 | 正解索引（0起算） |
|---|---|---|---|
| R-A | 代謝性鹼中毒（身體的酸減少或鹼增加）；呼吸性酸中毒（呼吸排不掉二氧化碳而變酸）；呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸）；代謝性酸中毒（身體的酸增加或鹼減少） | 代謝性鹼中毒；呼吸性酸中毒；呼吸性鹼中毒；代謝性酸中毒 | 1不變 |
| R-B | 呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸）；代謝性酸中毒（身體的酸增加或鹼減少）；代謝性鹼中毒（身體的酸減少或鹼增加）；呼吸性酸中毒（呼吸排不掉二氧化碳而變酸） | 呼吸性鹼中毒；代謝性酸中毒；代謝性鹼中毒；呼吸性酸中毒 | 0不變 |
| S-A | 呼吸性酸中毒（呼吸排不掉二氧化碳而變酸）；代謝性酸中毒（身體的酸增加或鹼減少）；代謝性鹼中毒（身體的酸減少或鹼增加）；呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸） | 呼吸性酸中毒；代謝性酸中毒；代謝性鹼中毒；呼吸性鹼中毒 | 1不變 |
| S-B | 呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸）；代謝性酸中毒（身體的酸增加或鹼減少）；呼吸性酸中毒（呼吸排不掉二氧化碳而變酸）；代謝性鹼中毒（身體的酸減少或鹼增加） | 呼吸性鹼中毒；代謝性酸中毒；呼吸性酸中毒；代謝性鹼中毒 | 3不變 |

## B：全部命中題的處理

| scope／題目 | 命中 | 決定 |
|---|---|---|
| full／R-A | 連續9字「呼吸排不掉二氧化碳」，誘答最長4字 | 修正：去除選項括號原因，四種名稱一致 |
| full／R-B | 連續10字「呼吸排出較多二氧化碳」，誘答最長4字 | 修正：去除選項括號原因，四種名稱一致 |
| bank／kidney-anatomy-case-q04 | 連續6字「腎上腺在腎臟」，誘答最長3字；正解獨有詞：腎臟 | 修正：詳以下逐題舊新及依據 |
| bank／nephron-circulation-case-q01 | 正解獨有詞：皮質 | 放行：題幹同時寫皮質與髓質，錯誤選項「髓質深處」也逐字出現，且共用字串4字比正解「皮質」2字更長；沒有可優先挑皮質的字面提示，必須分清腎小體與長環的位置。依據nephron-types：兩型腎小體均位於皮質，差異是靠近交界程度及環的走向。 |
| bank／nephron-circulation-case-q04 | 正解獨有詞：腎絲球 | 修正：詳以下逐題舊新及依據 |
| bank／filtration-clearance-foundation-q01 | 正解獨有詞：腎絲球 | 修正：詳以下逐題舊新及依據 |
| bank／filtration-clearance-foundation-q04 | 正解獨有詞：腎絲球 | 修正：詳以下逐題舊新及依據 |
| bank／filtration-clearance-foundation-q05 | 正解獨有詞：血漿 | 修正：詳以下逐題舊新及依據 |
| bank／urine-concentration-case-q04 | 正解獨有詞：集尿管 | 修正：詳以下逐題舊新及依據 |
| bank／urinary-route-micturition-foundation-q06 | 正解獨有詞：尿量 | 修正：詳以下逐題舊新及依據 |
| bank／fluid-compartments-foundation-q05 | 正解獨有詞：血漿 | 放行：題幹並列血漿與組織間液，錯誤選項也重複組織間液（4字），比正解只重複血漿（2字）更長；題幹沒有說哪邊蛋白質多，需知道血管壁較不讓蛋白質通過。依據electrolyte-osmolarity：血漿與組織間液最大差別為蛋白質陰離子量，微血管壁不通透蛋白質使其留在血漿。 |
| bank／electrolyte-balance-case-q01 | 正解獨有詞：氯化鈉 | 修正：詳以下逐題舊新及依據 |

兩個放行案例的誘答共用字串都比正解更長，題幹也同列兩個比較對象；不是只看到正解那一邊。放行僅代表Codex在本交辦下的審稿判斷，留待Claude抽查，不改卡片reviewed。

## kidney-anatomy-case-q04

| 欄位 | 舊 | 新 |
|---|---|---|
| stem | 腎上腺在腎臟附近，這表示它和腎臟有什麼關係？ | 腎上腺與腎臟有什麼關係？ |
| 選項1 | 腎上腺就是腎錐體的尖端 | 它是腎臟的腎錐體尖端 |
| 選項2 | 腎上腺在腎臟旁邊，是另一個器官 | 它靠近腎臟，但屬另一個器官 |
| 選項3 | 腎上腺就是伸進髓質的腎柱 | 它是腎臟伸進髓質的腎柱 |
| 選項4 | 腎上腺就是收集尿液的腎盂 | 它是腎臟收集尿液的腎盂 |
| explain | 因為腎上腺雖在腎臟附近，仍是另一個器官，所以選「腎上腺在腎臟旁邊，是另一個器官」。選「腎上腺就是腎錐體的尖端」的同學，說的腎錐體尖端叫腎乳頭，並不是腎上腺。 | 因為腎上腺雖在腎臟附近，仍是另一個器官，所以選「它靠近腎臟，但屬另一個器官」。選「它是腎臟的腎錐體尖端」的同學，說的腎錐體尖端叫腎乳頭，並不是腎上腺。 |

正解索引：1不變；③：答案是「它靠近腎臟，但屬另一個器官」，因為腎上腺鄰近腎臟，但兩者是不同器官。。①②④⑤沿用；只有腎臟case-q04的正解文字變動，③跟著更新。

reviewed依據：

- `kidney-structure`：「外圍包覆依次腎被膜、脂肪囊、腎筋膜。」
- `kidney-position`：「腎上腺位於腎附近但不是腎葉或腎元」
- `kidney-structure`：「尖端為腎乳頭。集尿管開口於乳頭，尿經小腎盞、大腎盞至腎盂。」

## nephron-circulation-case-q04

| 欄位 | 舊 | 新 |
|---|---|---|
| stem | 近腎絲球器會幫忙調節腎臟的血流，其中分泌腎素的細胞在哪裡？ | 腎臟需要調節血流時，會由哪個位置的細胞分泌腎素？ |

正解索引：1不變；③：答案是「入球小動脈壁的近腎絲球細胞」，因為腎素由入球小動脈壁的近腎絲球細胞分泌。。①②④⑤沿用；只有腎臟case-q04的正解文字變動，③跟著更新。

reviewed依據：

- `juxtaglomerular-apparatus`：「近腎絲球器包含入球小動脈的近腎絲球細胞、遠曲小管緻密斑及位於其間的 Lacis 細胞。」
- `juxtaglomerular-apparatus`：「近腎絲球細胞為入球小動脈壁特化平滑肌細胞，感受壓力並分泌腎素；緻密斑感受管液鈉變化。」

## filtration-clearance-foundation-q01

| 欄位 | 舊 | 新 |
|---|---|---|
| 選項2 | 從鮑氏囊腔進入入球小動脈 | 從腎絲球微血管進入入球小動脈 |
| 選項3 | 從腎盂進入腎皮質 | 從腎絲球微血管進入腎盂 |
| 選項4 | 從膀胱進入輸尿管 | 從腎絲球微血管進入輸尿管 |
| explain | 因為水和能通過的物質會從腎絲球血管進入鮑氏囊，所以選「從腎絲球微血管進入鮑氏囊腔」。選「從鮑氏囊腔進入入球小動脈」的同學，把血管到囊腔的方向寫反了。 | 因為水和能通過的物質會從腎絲球血管進入鮑氏囊，所以選「從腎絲球微血管進入鮑氏囊腔」。選「從腎絲球微血管進入入球小動脈」的同學，把濾液的去處選成了血管，濾液應進入鮑氏囊。 |

正解索引：0不變；③：答案是「從腎絲球微血管進入鮑氏囊腔」，因為過濾是從腎絲球微血管到鮑氏囊腔。。①②④⑤沿用；只有腎臟case-q04的正解文字變動，③跟著更新。

reviewed依據：

- `glomerular-filtration`：「腎絲球過濾是血液中的水與可通過的溶質經過濾膜進入鮑氏囊；正常濾液不含血球及白蛋白。」
- `glomerular-filtration`：「腎絲球過濾是血液中的水與可通過的溶質經過濾膜進入鮑氏囊」

## filtration-clearance-foundation-q04

| 欄位 | 舊 | 新 |
|---|---|---|
| 選項2 | 血漿蛋白把水拉回血管的力量（膠體滲透壓） | 腎絲球血管內蛋白質拉住水的力量（膠體滲透壓） |
| explain | 因為腎絲球血管內往外推的水壓會促進過濾，所以要選這股往囊裡推的力量。選「血漿蛋白把水拉回血管的力量（膠體滲透壓）」的同學，選的是把水拉回血管的力量，方向相反。 | 因為腎絲球血管內往外推的水壓會促進過濾，所以要選這股往囊裡推的力量。選「腎絲球血管內蛋白質拉住水的力量（膠體滲透壓）」的同學，選的是把水留在血管內的力量，方向相反。 |

正解索引：3不變；③：答案是「腎絲球血管裡的水往外推的壓力（靜水壓）」，因為腎絲球血管內的靜水壓把水往囊裡推。。①②④⑤沿用；只有腎臟case-q04的正解文字變動，③跟著更新。

reviewed依據：

- `gfr-regulation`：「有效過濾壓＝腎絲球靜水壓＋鮑氏囊膠體滲透壓－鮑氏囊靜水壓－血漿膠體滲透壓。課本示例為 55＋0－15－30＝10 mmHg。」
- `glomerular-filtration`：「靜水壓促進過濾，囊內壓與血漿膠體壓對抗」
- `gfr-regulation`：「每分鐘濾出多少水，取決於往囊裡推與往血裡拉的力量怎麼相抵。」

## filtration-clearance-foundation-q05

| 欄位 | 舊 | 新 |
|---|---|---|
| 選項2 | 每分鐘從尿裡排掉多少毫克的那種物質 | 每分鐘從血漿移到尿裡多少毫克的那種物質 |
| explain | 因為清除率是把尿裡排掉的物質換算回血漿體積，所以選「每分鐘相當清掉多少毫升血漿裡的那種物質」。選「每分鐘從尿裡排掉多少毫克的那種物質」的同學，在說每分鐘排掉的物質重量，和每分鐘相當多少血漿是不同的量。 | 因為清除率是把尿裡排掉的物質換算回血漿體積，所以選「每分鐘相當清掉多少毫升血漿裡的那種物質」。選「每分鐘從血漿移到尿裡多少毫克的那種物質」的同學，在說每分鐘排掉的物質重量，和每分鐘相當多少血漿是不同的量。 |

正解索引：0不變；③：答案是「每分鐘相當清掉多少毫升血漿裡的那種物質」，因為清除率表示每分鐘相當被清除的血漿體積。。①②④⑤沿用；只有腎臟case-q04的正解文字變動，③跟著更新。

reviewed依據：

- `renal-clearance`：「血漿清除率 C＝U×V/P，代表每分鐘排除某物質所相當的血漿體積；U 為尿濃度，V 為每分鐘尿量，P 為血漿濃度。」
- `renal-clearance`：「血漿清除率 C＝U×V/P，代表每分鐘排除某物質所相當的血漿體積」
- `renal-clearance`：「U 為尿濃度，V 為每分鐘尿量，P 為血漿濃度。」
- `renal-clearance`：「把尿裡帶走的某物質，換算成原來多少血漿才裝得下它。」
- `renal-clearance`：「清除率的 mL/min 是血漿體積，不是 mg/min 的物質排泄量」

## urine-concentration-case-q04

| 欄位 | 舊 | 新 |
|---|---|---|
| 選項1 | 能，外面的濃淡差可以代替水通道 | 能，集尿管外的濃淡差可以代替水通道 |
| explain | 因為水還得穿過集尿管的管壁才能回血液，所以選「不能，集尿管也要能讓水通過」。選「能，外面的濃淡差可以代替水通道」的同學，把外面的吸水條件當成已經替管壁開好了門。 | 因為水還得穿過集尿管的管壁才能回血液，所以選「不能，集尿管也要能讓水通過」。選「能，集尿管外的濃淡差可以代替水通道」的同學，把外面的吸水條件當成已經替管壁開好了門。 |

正解索引：1不變；③：答案是「不能，集尿管也要能讓水通過」，因為集尿管水通透性（水穿過管壁有多容易，叫做水通透性）是濃縮尿液的必要條件。。①②④⑤沿用；只有腎臟case-q04的正解文字變動，③跟著更新。

reviewed依據：

- `urine-concentration`：「尿液濃縮需髓質高滲透梯度與集尿管可調節水通透性配合，ADH 增加水回收形成濃尿。」
- `urine-concentration`：「尿液濃縮需髓質高滲透梯度與集尿管可調節水通透性配合」
- `adh-water-reabsorption`：「可增加遠曲小管近集尿管段及皮質集尿管對水的通透性」
- `adh-water-reabsorption`：「ADH 作用於 V2 受器，提高腺苷酸環化酶活性、增加水通道數目」

## urinary-route-micturition-foundation-q06

| 欄位 | 舊 | 新 |
|---|---|---|
| 選項1 | 三個都在說一天排出幾毫升尿 | 尿量看酸鹼，比重看每日容量，pH看相對密度 |
| 選項3 | 尿比重的單位是每天幾公升 | 尿量看相對密度，比重看酸鹼，pH看每日容量 |
| 選項4 | pH是在說一天排出多少物質 | 尿量看每日容量，比重看酸鹼，pH看相對密度 |
| explain | 因為每日尿量、比重與pH（酸不酸的數字叫pH，數字越小越酸）描述不同事情，所以選「尿量看每日容量，比重看相對密度，pH看酸鹼」。選「尿比重的單位是每天幾公升」的同學，把比重這種相對密度，寫成一天排出的尿量單位。 | 因為每日尿量、比重與pH（酸不酸的數字，越小越酸）分別描述容量、相對密度與酸鹼，所以選「尿量看每日容量，比重看相對密度，pH看酸鹼」。選「尿量看相對密度，比重看酸鹼，pH看每日容量」的同學，把三個項目的意思錯配了。 |

正解索引：1不變；③：答案是「尿量看每日容量，比重看相對密度，pH看酸鹼」，因為尿量是每日容量，比重是相對密度，pH（酸不酸的數字叫pH，數字越小越酸）是酸鹼性。。①②④⑤沿用；只有腎臟case-q04的正解文字變動，③跟著更新。

reviewed依據：

- `urine-physical-properties`：「健康成人每日尿量約 1–2 L；尿液水分約佔 95%，其餘 5% 為細胞代謝溶質及外來物質。」
- `urine-physical-properties`：「尿液的比重、pH 與每日溶質排出量各有不同意義」
- `urine-physical-properties`：「把每日容量、比重、酸鹼值及澄清度分開配對」
- `acid-base-balance`：「碳酸系統以 HCO₃⁻/H₂CO₃ 比值影響 pH，課本 pH＝pKa＋log（鹼/酸）」

## electrolyte-balance-case-q01

| 欄位 | 舊 | 新 |
|---|---|---|
| 選項2 | 把兩種物質都當成不會拆開 | 把葡萄糖和氯化鈉都當成不會拆開 |

正解索引：2不變；③：答案是「確認氯化鈉拆開，鈉和氯兩種都要數」，因為氯化鈉拆開後，鈉與氯兩種粒子都要數。。①②④⑤沿用；只有腎臟case-q04的正解文字變動，③跟著更新。

reviewed依據：

- `electrolyte-osmolarity`：「電解質如酸、鹼、鹽，溶於液體會解離成離子；非電解質如葡萄糖不解離。」
- `electrolyte-osmolarity`：「葡萄糖為 1 粒子，NaCl 成 Na⁺、Cl⁻ 共 2 粒子，MgCl₂ 成 Mg²⁺、2Cl⁻ 共 3 粒子。」

## 自動檢查負例

[實際負例輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/negative-probe.log)與[JSON](answer-echo-fix/negative-probe.json)顯示pass:false、unresolved:1；程序退出碼1已由測試assert。
測試涵蓋忽略標點／空白、NFKC符號、6字門檻、5字不列、同長誘答不列、短關鍵詞正解獨有、精確放行失效、答案移位、scope不同、空理由、126題完整覆蓋，以及四題名稱與配對不變。
內容核可仍比對精確SHA：新增8題完整內容核可清單，匯出器額外鎖本次changes.json整份SHA。full清單保留3e524158核可SHA並加入本次SHA；額外改字仍FAIL。

## Excel／Sheet寫回與備份

Sheet目標為「課程平台1.0」的115-1-AP2分頁（sheetId 1633868463）；沒有操作班級名冊等其他分頁。
- ID定位8列：Sheet 562、573、575、578、579、606、613、647；Excel 315、326、328、331、332、359、366、400。
- 僅寫實際變動23格：Sheet L、O:R、S、V中必要格；Excel H、I:L、O、R中必要格。允許欄中的其他未變值也不重寫；不碰ID、正解代碼、Zuvio解答、分類、②、⑤或其他列。
- Sheet先讀完整662×32矩陣，複製整個目標分頁到新原生備份並回讀相等，再讀目標格公式／驗證／格式，確認無公式與驗證限制；寫入前再讀一次原值。
- 一次23個updateCells，fields僅userEnteredValue；回讀21184格只有23格不同。176個目標與鄰格的格式／驗證逐格不變。
- Excel先完整備份，以Artifact Tool編輯與回讀23格、重算、掃描公式錯誤0項；為保留原檔其他功能，將Artifact Tool產出的23個值嵌回原ZIP，原有9894個儲存格值逐一比較。
- Excel只有xl/worksheets/sheet1.xml變動，其他ZIP成員逐byte相同，目標格原style屬性不變；Sheet與Excel各保留原行高、欄寬、凍結、換行。
- 來源、題庫匯出器、Excel與Sheet的110題990欄位值一致；②⑤與正解代碼一致。實際回讀矩陣跑parseBankSheet通過，啟用655題中本批110題全部找到。
- 教師前輪確認尚未同步、本批尚無作答，本輪也不按同步；沒有讀寫學生資料或加入錯題承接遷移。

[寫回前原生整頁備份](https://docs.google.com/spreadsheets/d/1KBuJmguDl97Tvq8txG_boZ9chC4OQlqjmzgrq_tEU8s/edit?usp=drivesdk)；本機Excel及原始矩陣保存在git忽略的docs/sheet-backups/answer-echo-fix/，不commit。

[Sheet逐格證據](answer-echo-fix/sheet-verification.json)｜[Excel逐格證據](answer-echo-fix/excel-verification.json)｜[三方比對](answer-echo-fix/bank-consistency.json)｜[實際Sheet解析](answer-echo-fix/parse-sheet.json)｜[176格格式及原生QA](answer-echo-fix/sheet-native-qa.json)

原生Google Sheet於100%縮放檢查8個變動列，文字換行及鄰格均正常，未調整格式：
![Sheet修改後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/sheet-native-after.png)

## 酸鹼 R-A，390×844

來自真實正式HTML的完整通關與配對流程；R-A可能在第一輪或重試翻邊後出現，截圖依實際題目ID擷取，不用只看第一題的隨機截圖替代。
![酸鹼R-A](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/verify/acid-base-homeostasis/shots/390x844-R-A.png)

## 驗證與實際輸出

八尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。正式HTML與重建值逐byte比對、SCRIPT_DIFF缺漏／多字／改字0；本機攔截CourseLearning佇列，實走錯答、重來、回讀與完成，逐筆validEvent與reduceLearning檢查，不送正式學生事件。

首次npm因題庫匯出器仍比舊稿而FAIL 1；完整原輸出留在npm-check-first.log，修正匯出器精確核可後重新跑全部測試；沒有刪掉舊比對或略過測試。

### 來源與固定欄位

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/source-validation.log)

```text
{
  "pass": true,
  "fullChangedQuestions": 4,
  "fullOnlyOptionsChanged": true,
  "fullIdsAnswersPairingNodesSourcesGlossaryFeedbackUnchanged": true,
  "bankChangedQuestions": 8,
  "unchangedBankQuestions": 102,
  "applyFilesChanged": 6,
  "contentJsonFilesUnchanged": 10,
  "metadataAnswersCitationsAndNodesUnchanged": true,
  "exportSheetConsistentQuestions": 110,
  "exportSheetTextCellsCompared": 990
}
```

### 126題最終掃描

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/final-scan.log)

```text
{"pass":true,"questions":126,"flagged":2,"allowed":2,"unresolved":0}
{"scope":"bank","id":"nephron-circulation-case-q01","disposition":"REVIEWED_ALLOW","findings":[{"rule":"keyword-exclusive","keywords":["皮質"]}]}
{"scope":"bank","id":"fluid-compartments-foundation-q05","disposition":"REVIEWED_ALLOW","findings":[{"rule":"keyword-exclusive","keywords":["血漿"]}]}
```

### 7項新回歸

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/echo-tests.log)

```text
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 230.401167
```

### 預期FAIL的負例

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/negative-probe.log)

```text
{"pass":false,"questions":1,"flagged":1,"allowed":0,"unresolved":1}
{"scope":"fixture","id":"negative-answer-echo","disposition":"FAIL","findings":[{"rule":"longest-exclusive","correct":{"length":10,"text":"氫離子增加讓血液變酸"},"distractorMax":2},{"rule":"keyword-exclusive","keywords":["氫離子"]}]}
```

### 十份content-check

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/content.log)

```text
nephron-circulation/apply: PASS
kidney-anatomy/apply: PASS
tubular-handling/apply: PASS
filtration-clearance/apply: PASS
urine-concentration/apply: PASS
urinary-route-micturition/apply: PASS
fluid-compartments/apply: PASS
water-sodium-regulation/apply: PASS
electrolyte-balance/apply: PASS
acid-base-homeostasis/full: PASS
```

### Excel逐格

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/excel-verification.log)

```text
{
  "pass": true,
  "author": "@oai/artifact-tool",
  "questionRows": 8,
  "comparedCells": 9894,
  "changedCells": 23,
  "otherCellValuesUnchanged": true,
  "changedZipMembers": [
    "xl/worksheets/sheet1.xml"
  ],
  "styleAndOtherZipMembersByteIdentical": true,
  "sha256": "a1a36e39f287595edc2b1d34420f763877ae3e2eb59b72f55db98b2ca632d539"
}
```

### 三方110題

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/bank-consistency.log)

```text
{
  "pass": true,
  "questions": 110,
  "threeWayComparedTextFields": 990,
  "changedQuestions": 8,
  "unchangedQuestions": 102,
  "answerPositionsAndGuidanceChainTraceUnchanged": true,
  "excelSha256": "a1a36e39f287595edc2b1d34420f763877ae3e2eb59b72f55db98b2ca632d539"
}
```

### 實際Sheet解析

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/parse-sheet.log)

```text
{
  "pass": true,
  "source": "actual Google Sheets readback, 662 rows × 32 columns",
  "course": "115-1-AP2",
  "enabledQuestions": 655,
  "approvedQuestionsParsed": 110,
  "changedQuestionsParsed": 8,
  "unchangedQuestions": 102
}
```

### 十份verify／八尺寸／事件

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/verify-ten-output.txt)

```text
{"slug":"kidney-anatomy","pass":true,"version":"kidney-anatomy-v1","formalSha256":"f6f5fe72839debb15d12c11e39d5fb108b4e7ddc367913f73591e8fcbf796734","cases":652,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":29,"invalid":0,"completed":1},{"size":[390,844],"events":33,"invalid":0,"completed":1},{"size":[414,896],"events":29,"invalid":0,"completed":1},{"size":[768,1024],"events":29,"invalid":0,"completed":1},{"size":[820,1180],"events":29,"invalid":0,"completed":1},{"size":[1024,1366],"events":29,"invalid":0,"completed":1},{"size":[1280,800],"events":29,"invalid":0,"completed":1},{"size":[844,390],"events":29,"invalid":0,"completed":1}]}
{"slug":"nephron-circulation","pass":true,"version":"nephron-circulation-v1","formalSha256":"3fd9fb695dfa091b9f3e70c449c99b2c00388e94407b8eb2f78ca0230e5fa6df","cases":675,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":14},"contentCheck":true,"events":[{"size":[360,667],"events":27,"invalid":0,"completed":1},{"size":[390,844],"events":30,"invalid":0,"completed":1},{"size":[414,896],"events":27,"invalid":0,"completed":1},{"size":[768,1024],"events":27,"invalid":0,"completed":1},{"size":[820,1180],"events":27,"invalid":0,"completed":1},{"size":[1024,1366],"events":27,"invalid":0,"completed":1},{"size":[1280,800],"events":27,"invalid":0,"completed":1},{"size":[844,390],"events":27,"invalid":0,"completed":1}]}
{"slug":"filtration-clearance","pass":true,"version":"filtration-clearance-v1","formalSha256":"805d043b209af7771c50ae2e83d34314dfd2d5a28c7c6c73871541e51bf3c11d","cases":628,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":29,"invalid":0,"completed":1},{"size":[390,844],"events":33,"invalid":0,"completed":1},{"size":[414,896],"events":29,"invalid":0,"completed":1},{"size":[768,1024],"events":29,"invalid":0,"completed":1},{"size":[820,1180],"events":29,"invalid":0,"completed":1},{"size":[1024,1366],"events":29,"invalid":0,"completed":1},{"size":[1280,800],"events":29,"invalid":0,"completed":1},{"size":[844,390],"events":29,"invalid":0,"completed":1}]}
{"slug":"tubular-handling","pass":true,"version":"tubular-handling-v1","formalSha256":"8d11318fa6a1951142b6bf9e0dda815269df029dc0b9af088fb4f07c7698912f","cases":644,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":16},"contentCheck":true,"events":[{"size":[360,667],"events":31,"invalid":0,"completed":1},{"size":[390,844],"events":35,"invalid":0,"completed":1},{"size":[414,896],"events":31,"invalid":0,"completed":1},{"size":[768,1024],"events":31,"invalid":0,"completed":1},{"size":[820,1180],"events":31,"invalid":0,"completed":1},{"size":[1024,1366],"events":31,"invalid":0,"completed":1},{"size":[1280,800],"events":31,"invalid":0,"completed":1},{"size":[844,390],"events":31,"invalid":0,"completed":1}]}
{"slug":"urine-concentration","pass":true,"version":"urine-concentration-v1","formalSha256":"3046b355635ccaecbeedef9888e180a256617fdd7bcdb8d48f6acc43cc70453a","cases":654,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":17},"contentCheck":true,"events":[{"size":[360,667],"events":33,"invalid":0,"completed":1},{"size":[390,844],"events":39,"invalid":0,"completed":1},{"size":[414,896],"events":33,"invalid":0,"completed":1},{"size":[768,1024],"events":33,"invalid":0,"completed":1},{"size":[820,1180],"events":33,"invalid":0,"completed":1},{"size":[1024,1366],"events":33,"invalid":0,"completed":1},{"size":[1280,800],"events":33,"invalid":0,"completed":1},{"size":[844,390],"events":33,"invalid":0,"completed":1}]}
{"slug":"urinary-route-micturition","pass":true,"version":"urinary-route-micturition-v2","formalSha256":"67fb2e06e0a05fb253640943bfd5bea79dbea67eef63238e5572305bf0ae0a3b","cases":701,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":16},"contentCheck":true,"events":[{"size":[360,667],"events":31,"invalid":0,"completed":1},{"size":[390,844],"events":36,"invalid":0,"completed":1},{"size":[414,896],"events":31,"invalid":0,"completed":1},{"size":[768,1024],"events":31,"invalid":0,"completed":1},{"size":[820,1180],"events":31,"invalid":0,"completed":1},{"size":[1024,1366],"events":31,"invalid":0,"completed":1},{"size":[1280,800],"events":31,"invalid":0,"completed":1},{"size":[844,390],"events":31,"invalid":0,"completed":1}]}
{"slug":"fluid-compartments","pass":true,"version":"fluid-compartments-v1","formalSha256":"bf7ee8d149a538fb991751ed2fcf5a5f8101daea97e5b0e0ce6e286c6275425c","cases":618,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":14},"contentCheck":true,"events":[{"size":[360,667],"events":27,"invalid":0,"completed":1},{"size":[390,844],"events":29,"invalid":0,"completed":1},{"size":[414,896],"events":27,"invalid":0,"completed":1},{"size":[768,1024],"events":27,"invalid":0,"completed":1},{"size":[820,1180],"events":27,"invalid":0,"completed":1},{"size":[1024,1366],"events":27,"invalid":0,"completed":1},{"size":[1280,800],"events":27,"invalid":0,"completed":1},{"size":[844,390],"events":27,"invalid":0,"completed":1}]}
{"slug":"water-sodium-regulation","pass":true,"version":"water-sodium-regulation-v1","formalSha256":"216988546dee8d2a535f2f313f7b5cb2b8d6e73d85abf128a7a912817aedb78d","cases":659,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":29,"invalid":0,"completed":1},{"size":[390,844],"events":32,"invalid":0,"completed":1},{"size":[414,896],"events":29,"invalid":0,"completed":1},{"size":[768,1024],"events":29,"invalid":0,"completed":1},{"size":[820,1180],"events":29,"invalid":0,"completed":1},{"size":[1024,1366],"events":29,"invalid":0,"completed":1},{"size":[1280,800],"events":29,"invalid":0,"completed":1},{"size":[844,390],"events":29,"invalid":0,"completed":1}]}
{"slug":"electrolyte-balance","pass":true,"version":"electrolyte-balance-v1","formalSha256":"91395ed96a703bf48197ecef83ac39c86f675c7af30cb3ff32309d5fc9e7660a","cases":673,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":29,"invalid":0,"completed":1},{"size":[390,844],"events":30,"invalid":0,"completed":1},{"size":[414,896],"events":29,"invalid":0,"completed":1},{"size":[768,1024],"events":29,"invalid":0,"completed":1},{"size":[820,1180],"events":29,"invalid":0,"completed":1},{"size":[1024,1366],"events":29,"invalid":0,"completed":1},{"size":[1280,800],"events":29,"invalid":0,"completed":1},{"size":[844,390],"events":29,"invalid":0,"completed":1}]}
{"slug":"acid-base-homeostasis","pass":true,"version":"acid-base-homeostasis-v1","formalSha256":"7a2b0d913dcba7e589d9870cb16b9b2971969008e11f6bf2a95d1aecc0b6c2e4","cases":648,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":62,"invalid":0,"completed":1},{"size":[390,844],"events":62,"invalid":0,"completed":1},{"size":[414,896],"events":62,"invalid":0,"completed":1},{"size":[768,1024],"events":62,"invalid":0,"completed":1},{"size":[820,1180],"events":62,"invalid":0,"completed":1},{"size":[1024,1366],"events":62,"invalid":0,"completed":1},{"size":[1280,800],"events":62,"invalid":0,"completed":1},{"size":[844,390],"events":62,"invalid":0,"completed":1}]}
{"pass":true,"materials":10,"ordinaryRebuilt":9,"acidFullRewritten":true,"viewports":8,"materialViewportFlows":80,"layoutCases":6552,"events":2648,"invalidEvents":0}
```

### 33項檢查器回歸

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/checker-tests.log)

```text
1..33
# tests 33
# suites 0
# pass 33
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 20368.8165
```

### 最終npm run check

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/npm-check.log)

```text
# tests 215
# pass 215
# fail 0
# skipped 0
# duration_ms 223871.141791
✓ built in 1.55s
# tests 61
# pass 61
# fail 0
# skipped 0
# duration_ms 566.1475
```

### 交接守門

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/answer-echo-fix/check-handoff.log)

```text
PASS handoff: 1698/4000字；queue: 22/25件；週誌與索引合規
```

## 最終統計

```json
{
  "pass": true,
  "materials": 10,
  "viewports": 8,
  "flows": 80,
  "layoutCases": 6552,
  "events": 2648,
  "invalidEvents": 0,
  "measuredAssessmentScreens": 1208,
  "maxGapPx": 18,
  "minGapPx": 5
}
```

## 重現指令

```sh
export PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH
node scripts/answer-echo-check.mjs --out /tmp/answer-echo-scan.json
node scripts/answer-echo-check.mjs --negative-probe # 預期exit 1
node docs/urinary-release/answer-echo-fix/validate-source.mjs
python3 docs/urinary-release/answer-echo-fix/verify-bank.py
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/answer-echo-fix/parse-sheet.mjs
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/answer-echo-fix/content-browser-check.mjs
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/answer-echo-fix/verify-eight.mjs
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/answer-echo-fix/verify-ten.mjs
npm run check
```

核可寫回腳本apply-fixes.py／edit-excel.mjs／finish-excel.py為本輪一次性產製與備份流程，重現驗證不應再次覆蓋目前檔案；以固定3e524158基底比對。
