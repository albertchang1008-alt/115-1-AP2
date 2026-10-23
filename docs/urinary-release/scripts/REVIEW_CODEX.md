# 給 Claude 的摘要
- 矛盾：`filtration-clearance.md:70` 把「血液」整體寫成穿過濾膜進鮑氏囊；卡限水與可通過溶質，正常濾液無血球／白蛋白。
- 正解不唯一風險：`urine-concentration.md:27–30` 問「可以通過」卻把 NaCl 作錯項；卡只說對溶質通透差，不能等同零通透。
- 無據／外延：`filtration-clearance.md:40` 泛稱靜水壓；`tubular-handling.md:29` 泛稱所有營養全回收；`urine-concentration.md:25` 混用剩餘東西的量與濃度。
- 無據圖／模型新增：`fluid-compartments.md:45` 的水／Na⁺跨微血管壁；`urine-concentration.md:46–47` 的U形與快直血流情境；`electrolyte-balance.md:17,20` 半透膜通則與水位上升。
- 無據定義／生活例：`nephron-circulation.md:4,7,9,25`；`water-sodium-regulation.md:9,19,20`；`urine-concentration.md:4`，均只判指定卡找不到完整支持，非一概判生理錯。
- 無法核對的空白回饋：`kidney-anatomy.md:24`、`filtration-clearance.md:42` 只說顯示正確說明，沒有實際回饋文句。

## 範圍與判準

本報告只覆核九份腳本，未修改腳本、apply.json、卡片或進度，未實作、build、commit、push、部署或發布。審查日 2026-10-21（Asia/Taipei）。事實判定只用「有據／無據／矛盾」；「無據」表示指定 reviewed 卡不足以支持完整說法，包含未核可的生活比喻／新模型，不表示已證明該句在醫學上錯誤。報告不以課外常識或外部網站替作者補據。

依 `_README.md`，來源先對到各 apply.json 的同一節點 concept／sources；主資料讀 `.worktrees/apply9-codex`（`codex/apply9-redo`，HEAD `a5773cc`）。九個 apply.json 與 `.worktrees/acidbase-full` 目前逐位元相同。水鈉資料在 `materials-src/apply-examples/water-sodium-regulation/apply.json`；其餘八份在 `materials-src/<slug>/apply.json`。

直接讀 `/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/` 的31張相關卡全文，並核對 `todo_all.jsonl`：31張卡的 frontmatter 與唯一進度列都是 reviewed。54個 concept 共139組不同 uid＋原句引用全部確實存在於卡內。這只是來源完整性，不等於腳本自動通過；下面的語意、前置資訊與選項判定是本次逐句人工覆核。

各句保留原文與行號；含數句的原行按句號拆列。問句只核對其前提與預期正解；刻意設計的錯誤選項不計為作者寫錯，所有確認題的完整選項另外逐題列出。純UI操作、過渡頁題名及「三格」欄名不作生理事實判定。卡片內的教學比喻不冒充課本逐字原文。跨節點補據、超出concept的語句另標記；沒有把來源卡存在當成學生畫面已先教過。

`electrolyte-osmolarity` 雖然 `review_status`／進度均 reviewed，frontmatter 另留 `needs_review: true`，卡內指向mEq公式單位待教師確認；本批腳本沒有拿該疑點公式做數值計算，未改動其狀態。

## 必須交裁決的地方

1. **過濾結語的主詞衝突**：`filtration-clearance.md:70` 前半不是可接受的「水和可過濾溶質」同義改寫。其後「大的蛋白質和血球留在血中」反而與前半互相衝突。依 GF1；後半菊糖的清除率等於GFR有據。只列問題，不在腳本代改。
2. **下降枝確認題邊界**：`urine-concentration.md:27–30` 選A「水」是正確的主要通透性，但B「NaCl」在題幹「可以通過」的字面下，無法由CC2的「對溶質通透差」排成完全不能過。這是唯一一題未能以目前文字保證唯一答案；不是宣稱卡已證明NaCl與水通透性相等。
3. **外延與模型**：泛稱靜水壓沒有分血管側／囊側（GR1）；「身體的營養全部拿回」超過TR1的特定物質、正常與負荷條件；下降枝水走只增加濃度，不能使剩下溶質的絕對量增加。U形幾何、水位上升及水／Na⁺穿特定微血管壁，不能用其他屏障的通透性補證。見逐句表。
4. **未寫完的錯誤回饋**：腎臟N02及過濾N04只要求彈回、顯示正確說明。可核對正確知識，但未有逐字文案，所以不能替將來實作自由補句背書。
5. **先教再問的缺口**：54關逐項見下表。來源有據但首答前未給資訊者，仍須由Claude決定如何補教，不能宣告「國中生可以從腳本推出」。實作尚未發生，不假設圖上另外藏有可用的標籤／數字。

## 全部54關：首答前資訊可否推出答案

判準：關內「先認識／提示」、前關已公開的成功說明、題幹已給條件可使用；同題的答錯回饋不可反過來當學生首次作答的前置教材。未列明先修順序，不假設學生已讀另外八份。只有水鈉N04明示引用上一份腎元教材，亦須實作提供先修／回看入口。

| 腳本 | 關 | 圖任務／動作的正解 | 首答前依據 | 確認題／第二動作 |
|---|---|---|---|---|
| [electrolyte-balance](electrolyte-balance.md) | N01 | 葡萄糖1／NaCl2／MgCl2 3粒子 | 可推：葡萄糖、NaCl、MgCl2三種粒子提示／符號可配；葡萄糖不解離須先認識電解質例外。 | 可推：答對後已教葡萄糖不解離。 |
| [electrolyte-balance](electrolyte-balance.md) | N02 | 水往較多粒子側（膜條件相同） | 可推：提示直接給水移向多粒子；水位上升另為無據模型。 | 可推：N01已明示解離後1／2／3粒子，B/C可排。 |
| [electrolyte-balance](electrolyte-balance.md) | N03 | Mg²⁺對Cl⁻配比兩倍；mEq考慮價數 | 可推：電荷數與提示可選Mg²⁺。 | 可推：先認識價數，再與粒子數比較。 |
| [electrolyte-balance](electrolyte-balance.md) | N04 | Na外／K內；醛固酮回鈉 | 可推：提示直接給內K外Na。動作②醛固酮回收哪種未先教。 | 無另確認；回鈉有據但非名字能推。 |
| [electrolyte-balance](electrolyte-balance.md) | N05 | Cl⁻為ECF主陰離子；此條件下隨Na被動吸收 | 可推：右上負號能在三離子中辨Cl⁻。動作②Cl跟鈉的被動吸收未先教。 | 無另確認；「間接」作用需保留範圍，勿泛指所有段被動。 |
| [electrolyte-balance](electrolyte-balance.md) | N06 | Mg²⁺細胞內；活化醣蛋白代謝酶 | 可推：提示已給細胞內主要電解質。動作②活化酶不能由此推出。 | 缺資訊：兩種神經反應方向尚未先教；成功文字也沒有列。 |
| [filtration-clearance](filtration-clearance.md) | N01 | 腎絲球血液中的可濾成分→鮑氏囊 | 可推：先認識說鮑氏囊接收濾液，得由血至囊。 | 缺資訊：未教皮質的腎小體定位；若必須先讀腎臟篇，需明列先修。 |
| [filtration-clearance](filtration-clearance.md) | N02 | 微血管內皮→基底膜→足細胞 | 缺資訊：提示只決定內皮在前，基底膜與足細胞的先後還無法唯一排。 | 附條件：動作完成圖若保留三層可排除壁層；不可只靠未顯示的卡片。 |
| [filtration-clearance](filtration-clearance.md) | N03 | 水／葡萄糖／胺基酸可濾；白蛋白／紅血球留血 | 缺資訊：大小提示未教白蛋白／血球相對大小，葡萄糖、胺基酸可過濾也未先教。 | 缺資訊：答對後已知濾液無血球，但未教「血漿本來無血球」，A對B仍需外部知識。 |
| [filtration-clearance](filtration-clearance.md) | N04 | 腎絲球靜水壓促濾；囊內壓及血漿膠體壓對抗 | 缺資訊：水壓比喻未交代囊內壓反向及蛋白膠體壓；三卡不能唯一分完。 | 無確認；三種方向有據。 |
| [filtration-clearance](filtration-clearance.md) | N05 | U尿濃度／V每分鐘尿量／P血漿濃度 | 缺資訊：提示只說U與V都跟尿有關，無法區分濃度與尿量。 | 缺資訊：公式和三符號定義不等於清除率的血漿體積意義，正解要先教。 |
| [filtration-clearance](filtration-clearance.md) | N06 | 菊糖只過濾；肌酸酐＋少量分泌；PAH過濾＋分泌；菊糖清除率＝GFR | 可推：三物質處理方式已列出；動作②靠只過濾提示選菊糖。 | 無另確認；GFR先認識僅展開簡稱，需留清除率意義前置。 |
| [fluid-compartments](fluid-compartments.md) | N01 | 標準總水60%體重 | 可推：三選項中只有60%超過一半。 | 缺資訊：此前只遇體重分母，還未介紹總水量／外液分母差異。 |
| [fluid-compartments](fluid-compartments.md) | N02 | ICF總水2/3／ECF1/3；Na外K內 | 可推：給2/3、1/3，細胞內較多可配。動作②Na／K分布尚未先教。 | 無另確認；Na外K內有據但首次操作需先教。 |
| [fluid-compartments](fluid-compartments.md) | N03 | 血漿ECF20%／間液80% | 可推：血管內少，可把20%配血漿。 | 可推：N01 60%×N02外液1/3＝體重20%，再乘血漿20%得4%。 |
| [fluid-compartments](fluid-compartments.md) | N04 | 體重ICF40／ECF20／血漿4／間液16% | 可推：前幾關比例和提示足以算40／20／4／16。 | 可推：先見本關答對說明，能選課本4／16；不需先背別書比例。 |
| [fluid-compartments](fluid-compartments.md) | N05 | 蛋白質留血漿；水／Na跨壁動畫未有直接卡據 | 附條件：提示只說大者不過，未教蛋白尺寸；新增水／Na跨壁動畫無直接卡據。 | 無另確認；蛋白差別本身有據。 |
| [fluid-compartments](fluid-compartments.md) | N06 | 女55／男65%；50×0.55×2/3＝18.33L | 可推：給55、65並提示男性較高；動作②假設完整且有算式。 | 無另確認；50×0.55×2/3＝18.333…L，選18.33唯一。 |
| [kidney-anatomy](kidney-anatomy.md) | N01 | 左高右低 | 缺資訊：肝在右不等於學生已知會讓右腎較低；缺高度因果。 | 可推：答對說明已給後腹腔與右低。 |
| [kidney-anatomy](kidney-anatomy.md) | N02 | 外皮質／內髓質／腎柱為伸入錐體間皮質 | 附條件：先認識與提示可找腎柱，皮質／髓質需切面確實呈外內。 | 可推：本關答對說明已給腎柱。 |
| [kidney-anatomy](kidney-anatomy.md) | N03 | 乳頭→小腎盞→大腎盞→腎盂 | 可推：動作直接給乳頭→小→大→盂順序。 | 缺資訊：前兩關未說腎盂接輸尿管；不能用答錯回饋當前置。 |
| [kidney-anatomy](kidney-anatomy.md) | N04 | 被膜→脂肪囊→筋膜；內側凹入為腎門 | 可推：動作①直接給包膜順序。動作②缺資訊：此前未教腎門。 | 動作②沒有另確認題；正解腎門有據但首答不可推。 |
| [kidney-anatomy](kidney-anatomy.md) | N05 | 腎製尿／輸尿管運送／膀胱儲存／尿道排出；尿素尿酸肌酸酐為廢物 | 缺資訊：提示只辨腎，輸尿管／尿道與儲存分工未先教；動作②廢物／營養分類也未先教。 | 動作②正解廢物三項有據；需另補前置。 |
| [kidney-anatomy](kidney-anatomy.md) | N06 | 腎素→血壓；EPO→紅血球；活化D→鈣 | 缺資訊：只可由字面配紅血球生成素；腎素與活化D剩兩項不能唯一配對。 | 可推：本關答對說明已給腎素配血壓。 |
| [nephron-circulation](nephron-circulation.md) | N01 | 腎小體＋腎小管；腎小體＝腎絲球＋鮑氏囊 | 附條件：圓球／長管提示可定位，但圖需明示構造；動作②的腎絲球＋囊未先教。 | 動作②正解有據，未另出確認。 |
| [nephron-circulation](nephron-circulation.md) | N02 | 近髓質長環深入髓質 | 可推：圖上長環配交界提示可選近髓質。 | 缺資訊：未教多數為皮質型，也未教兩型小體均在皮質；A、B、C須靠外部知識排除。 |
| [nephron-circulation](nephron-circulation.md) | N03 | 近曲刷狀緣；薄段扁平上皮 | 附條件：若圖能直接見刷狀緣可找近曲；動作②薄段扁平未先教。 | 無另確認；薄段答案有據但未給前置。 |
| [nephron-circulation](nephron-circulation.md) | N04 | 入球→腎絲球→出球→管周微血管 | 可推：題幹直接給四段路徑。 | 可推：由入球／出球「小動脈」得A。 |
| [nephron-circulation](nephron-circulation.md) | N05 | 入球壁近腎絲球細胞感壓分泌腎素；遠曲緻密斑感管液鈉 | 可推：動作①兩細胞資訊與位置由點擊顯示；動作②由剛顯示腎素可答。 | 無另確認；血壓下降的促分泌方向由題目與動作聯接。 |
| [nephron-circulation](nephron-circulation.md) | N06 | 只算血漿部分 | 可推：血漿／血球分層及名字提示可選。 | 可推：答對說明先給1200與四分之一。 |
| [tubular-handling](tubular-handling.md) | N01 | 過濾血→囊；回收管液→血；分泌血→管液 | 缺資訊：提示只給再吸收方向，過濾與分泌的起迄未先分清；開場只概括回收與送入。 | 可推：答對說明已給分泌方向。 |
| [tubular-handling](tubular-handling.md) | N02 | 過濾－再吸收＋分泌 | 可推：提示直接給扣回收、加分泌。 | 可推：題幹明給正常全回收，可推尿中幾乎沒有。 |
| [tubular-handling](tubular-handling.md) | N03 | 葡萄糖胺基酸正常全回收；尿素部分；肌酸酐不回收 | 缺資訊：只說營養／廢物，尿素部分與肌酸酐不回收仍不能推。 | 缺資訊：此前未教水依滲透回收。 |
| [tubular-handling](tubular-handling.md) | N04 | 正常模型下超375 mg/min出尿糖 | 可推：先認識375與滑桿結果支持動作②。 | 無另確認；這個模型條件內糖尿有據。 |
| [tubular-handling](tubular-handling.md) | N05 | 遠曲／集尿管；醛固酮促鉀分泌 | 附條件：後段提示及兩個已列名稱可定位，但需要圖有分段。動作②醛固酮促鉀分泌未先教。 | 缺資訊：若只給答錯回饋，正確首答者仍未見前段大量回收與後段調整；需明確成功後保留說明。 |
| [tubular-handling](tubular-handling.md) | N06 | 尿濃不一定分泌；清除率才與GFR同單位 | 附條件：曾有水被回收，提示可引導濃縮，但「濃度」與「量」尚需區分。 | 缺資訊：清除率未在本份先教，GFR只臨時給單位；必須明列過濾清除率篇先修。 |
| [urinary-route-micturition](urinary-route-micturition.md) | N01 | 輸尿管蠕動；斜入防逆流 | 可推：管壁逐段收縮提示可選蠕動。動作②斜入防逆流未給原理。 | 無另確認；動作②需先示範逆流受阻的機轉。 |
| [urinary-route-micturition](urinary-route-micturition.md) | N02 | 腎盂交接／髂外動靜脈交叉／進膀胱 | 附條件：三部位提示須配有清楚血管定位的圖。 | 缺資訊：答對說明沒給長度25–30；3.8／20還是下一關以後才教。 |
| [urinary-route-micturition](urinary-route-micturition.md) | N03 | 兩輸尿管口＋尿道內口；逼尿肌擠尿 | 可推：動作直接給三口。動作②逼尿肌名稱及功能未先教。 | 缺資訊：未先教三肌類型及外括約肌隨意控制，不能由肌名推骨骼肌。 |
| [urinary-route-micturition](urinary-route-micturition.md) | N04 | 女3.8cm／男20cm；男前列腺→膜→陰莖 | 可推：只有兩數字，男性長可唯一放置；動作②直接給順序。 | 缺資訊：此前未教陰部神經，不能用事後回饋當來源。 |
| [urinary-route-micturition](urinary-route-micturition.md) | N05 | 約300mL尿意；逼尿肌收縮、內括約肌鬆弛 | 可推：滑桿約300＋袋子擠出口開比喻支持肌肉方向。 | 缺資訊：副交感S2–S4與交感分工首次出現在確認／錯誤回饋。 |
| [urinary-route-micturition](urinary-route-micturition.md) | N06 | 1–2L／日、水95% | 附條件：幾乎全水能排除50%，可選第一組；但1–2L並未獨立先教。 | 缺資訊：稻草色與剛排透明沒有先教。 |
| [urine-concentration](urine-concentration.md) | N01 | 高張髓質＋集尿管可通水（ADH） | 可推：先認識＋提示給濃度梯度和管壁通水兩條件。 | 缺資訊：答對說明未給1200／四倍，數值無從推。 |
| [urine-concentration](urine-concentration.md) | N02 | 下降水移出→管液變濃 | 可推：移出水動畫支持濃度上升；提示「東西變多」有混淆風險。 | A水可推；但B NaCl非零通透不能由「差」排除，唯一性待裁決。 |
| [urine-concentration](urine-concentration.md) | N03 | 上升鹽移出、水留→管液變稀 | 可推：題幹／動畫已說鹽出水留，得變稀。 | 可推：N01先有外部濃度概念，可將移出的鹽接到髓質；需圖示鹽去向確在髓質。 |
| [urine-concentration](urine-concentration.md) | N04 | 慢速逆流交換減少髓質溶質流失 | 附條件：靠比喻可推慢流減少帶走，但U形的獨立依據缺。 | 缺資訊：此前未命名逆流「交換」與「增強」，只能猜名詞。 |
| [urine-concentration](urine-concentration.md) | N05 | ADH增加水通道 | 可推：開關動畫若明示新增水通道，且N01已講通水可答。 | 缺資訊：腦下垂體後葉從未在本份先認識、提示或成功說明出現。 |
| [urine-concentration](urine-concentration.md) | N06 | 承高張髓質，有ADH濃尿、無ADH稀尿 | 可推：承N01高張髓質，N05增加水通道可配有ADH濃尿。 | 缺資訊：本份未先教醛固酮回鈉；若需水鈉篇先修，必須明列。 |
| [water-sodium-regulation](water-sodium-regulation.md) | N01 | 飲水／食物水／代謝水 | 可推：喝、食物、自己產水對出去三項可辨。 | 缺資訊：未先給各項數值或總2500，不能靠名稱推平均量。 |
| [water-sodium-regulation](water-sodium-regulation.md) | N02 | 尿腎／呼氣肺／皮膚蒸散流汗／糞腸 | 可推：題幹直接給四器官配對。 | 缺資訊：前文只給來源／去路，沒有先說正常收支平衡。 |
| [water-sodium-regulation](water-sodium-regulation.md) | N03 | 口渴多攝取＋ADH少流失 | 可推：選項與一進一出提示可得口渴／ADH。 | 缺資訊：鈉總量與濃度之別尚未先教。 |
| [water-sodium-regulation](water-sodium-regulation.md) | N04 | 近腎絲球細胞→腎素；RAAS收縮血管留鈉水 | 附條件：明示引用上一份腎元教材可找近腎絲球細胞；需實際先修連結。動作②尚未教整條鏈最後效果。 | 無另確認；RAAS升壓有據，不能只給錯誤者看說明。 |
| [water-sodium-regulation](water-sodium-regulation.md) | N05 | 醛固酮回鈉；ADH增加通水 | 可推：兩配對做法在腳本明列且抗利尿名字可配水。 | 缺資訊：本份未先教鉀分泌，題幹保鈉不能推排鉀。 |
| [water-sodium-regulation](water-sodium-regulation.md) | N06 | ANP排鈉；醛固酮管鈉量容積／ADH管水濃度 | 可推：先認識與利鈉名字可選排鈉；體液下降需保留ANP完整路徑。動作②量／濃度分工此前未先說明。 | 無另確認；該分工有據但不應靠首答猜測。 |

## 全部確認題：正解與錯項唯一性

這裡保留全部選項逐項供查；各題標記正項皆為A，這是草稿標記，未替實作打亂。

| 腳本／行 | 題目與全部選項 | 來源 | 唯一性及理由 |
|---|---|---|---|
| [electrolyte-balance:11](electrolyte-balance.md#L11) | - **確認：**「葡萄糖溶在水裡會分開成離子嗎？」<br>- A 不會，仍是 1 顆（正）<br>- B 會，變成 2 顆 | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [electrolyte-balance:21](electrolyte-balance.md#L21) | - **確認：**「判斷滲透效果時，要看什麼？」<br>- A 解離後的粒子數（正）<br>- B 解離前的分子個數<br>- C 物質的重量 | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [electrolyte-balance:31](electrolyte-balance.md#L31) | - **確認：**「mEq/L 和滲透粒子數是同一件事嗎？」<br>- A 不是，mEq 還要考慮價數（正）<br>- B 是同一件事 | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [electrolyte-balance:53](electrolyte-balance.md#L53) | - **確認：**「低血鎂和高血鎂，神經的反應方向一樣嗎？」<br>- A 不一樣（正）<br>- B 一樣 | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [filtration-clearance:11](filtration-clearance.md#L11) | - **確認：**「濾液在哪裡形成？」<br>- A 皮質的腎小體（正）<br>- B 輸尿管<br>- C 腎盂 | [GF1](#e-gf1) `glomerular-filtration`<br>[GF3](#e-gf3) `glomerular-filtration`<br>[NH2](#e-nh2) `nephron-histology` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [filtration-clearance:22](filtration-clearance.md#L22) | - **確認：**「下面哪一個『不是』過濾膜的一層？」<br>- A 鮑氏囊壁層（正）<br>- B 基底膜<br>- C 足細胞 | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [filtration-clearance:32](filtration-clearance.md#L32) | - **確認：**「血漿和濾液最主要的差別是？」<br>- A 蛋白質（正）<br>- B 血球<br>- C 水 | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration` | **唯一（依本題選項、卡片及正常／標準示例條件）**；比較的是血漿而非全血；卡明定血漿本來無血球，B不可算對；水可過濾，C不可算對。 |
| [filtration-clearance:49](filtration-clearance.md#L49) | - **確認：**「清除率的意思是？」<br>- A 每分鐘排除某物質所相當的血漿體積（正）<br>- B 每分鐘尿量<br>- C 血漿裡這個物質的濃度 | [RC1](#e-rc1) `renal-clearance` | **唯一（依本題選項、卡片及正常／標準示例條件）**；A為所相當血漿體積／時間；B是公式中的V，C是P，兩者均不是清除率本義。 |
| [fluid-compartments:10](fluid-compartments.md#L10) | - **確認：**「遇到比例題，第一步要先弄清楚什麼？」<br>- A 這個比例的分母是體重、總水量，還是細胞外液（正）<br>- B 直接背答案<br>- C 分母一定是體重 | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF5](#e-bf5) `body-fluid-compartments` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [fluid-compartments:27](fluid-compartments.md#L27) | - **確認：**「血漿占細胞外液的 20%，那它占體重的幾 %？」<br>- A 4%（正）<br>- B 20%<br>- C 16% | [BF2](#e-bf2) `body-fluid-compartments` | **唯一（依本題選項、卡片及正常／標準示例條件）**；本份標準60%×1/3×20%＝4%；20%混淆分母，16%為組織間液占體重。 |
| [fluid-compartments:38](fluid-compartments.md#L38) | - **確認：**「有些書寫血漿 5%、組織間液 15%。本課本用的是？」<br>- A 4% 和 16%（正）<br>- B 5% 和 15% | [BF2](#e-bf2) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [kidney-anatomy:13](kidney-anatomy.md#L13) | - **確認：**「下面哪一句是對的？」<br>- A 腎臟在後腹腔，右腎比左腎低（正）<br>- B 腎臟在腹膜腔裡面<br>- C 左腎比右腎低 | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [kidney-anatomy:25](kidney-anatomy.md#L25) | - **確認：**「兩個腎錐體之間、跟外層相連的組織是？」<br>- A 腎柱（正）<br>- B 腎乳頭<br>- C 腎盂 | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [kidney-anatomy:36](kidney-anatomy.md#L36) | - **確認：**「腎盂接下來連到哪裡？」<br>- A 輸尿管（正）<br>- B 尿道<br>- C 腎乳頭 | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[UP2](#e-up2) `urine-pathway` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [kidney-anatomy:61](kidney-anatomy.md#L61) | - **確認：**「腎素主要和哪件事有關？」<br>- A 調節血壓（正）<br>- B 製造紅血球<br>- C 調節鈣 | [KE1](#e-ke1) `kidney-endocrine` | **唯一（依本題選項、卡片及正常／標準示例條件）**；問「主要」且給三種不同內分泌分工，選A；不能把下游間接鈣／造血影響當本題主要配對。 |
| [nephron-circulation:18](nephron-circulation.md#L18) | - **確認：**「下面哪一句是對的？」<br>- A 大多數腎元是皮質腎元（正）<br>- B 近髓質腎元整個都在髓質裡<br>- C 兩種腎元的腎小體都在髓質 | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [nephron-circulation:38](nephron-circulation.md#L38) | - **確認：**「腎絲球前後兩端是哪一種血管？」<br>- A 小動脈（正）<br>- B 靜脈<br>- C 微血管 | [RB2](#e-rb2) `renal-blood-flow` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [nephron-circulation:55](nephron-circulation.md#L55) | - **確認：**「下面哪一句是對的？」<br>- A 腎血流約 1200 mL/min，約占心輸出量四分之一（正）<br>- B 腎血流就等於全部的心輸出量<br>- C 腎血流和腎血漿流量是同一個數字 | [RB1](#e-rb1) `renal-blood-flow` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [tubular-handling:11](tubular-handling.md#L11) | - **確認：**「分泌是把物質從哪裡送到哪裡？」<br>- A 血液→管液（正）<br>- B 管液→血液<br>- C 鮑氏囊→血液 | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [tubular-handling:21](tubular-handling.md#L21) | - **確認：**「葡萄糖正常會全部被再吸收，所以尿中的葡萄糖會？」<br>- A 幾乎沒有（正）<br>- B 等於過濾量<br>- C 比過濾量更多 | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling`<br>[TR2](#e-tr2) `tubular-reabsorption` | **唯一（依本題選項、卡片及正常／標準示例條件）**；題幹已限定正常全部回收，A「幾乎沒有」而非一般病理尿糖，B/C不可算對。 |
| [tubular-handling:31](tubular-handling.md#L31) | - **確認：**「水主要靠什麼被回收？」<br>- A 滲透作用（正）<br>- B 分泌<br>- C 過濾 | [TR1](#e-tr1) `tubular-reabsorption` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [tubular-handling:49](tubular-handling.md#L49) | - **確認：**「最後尿裡的鉀，主要由什麼決定？」<br>- A 後段的分泌調整（正）<br>- B 只看一開始過濾多少 | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [tubular-handling:58](tubular-handling.md#L58) | - **確認：**「要拿來和 GFR（mL/min）比大小的，應該是？」<br>- A 清除率（正）<br>- B 排泄量<br>- C 尿中濃度 | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling` | **唯一（依本題選項、卡片及正常／標準示例條件）**；以量綱判斷：清除率與GFR同為mL/min，排泄量為物質量/時間、濃度為物質量/體積。 |
| [urinary-route-micturition:17](urinary-route-micturition.md#L17) | - **確認：**「輸尿管大約多長？」<br>- A 25–30 cm（正）<br>- B 3.8 cm<br>- C 20 cm | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions`<br>[UR1](#e-ur1) `urethra` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urinary-route-micturition:28](urinary-route-micturition.md#L28) | - **確認：**「哪一個是骨骼肌、可以自己控制？」<br>- A 外尿道括約肌（正）<br>- B 逼尿肌<br>- C 內尿道括約肌 | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urinary-route-micturition:38](urinary-route-micturition.md#L38) | - **確認：**「外尿道括約肌由哪條神經控制？」<br>- A 陰部神經（正）<br>- B 交感神經<br>- C 骨盆副交感神經 | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urinary-route-micturition:51](urinary-route-micturition.md#L51) | - **確認：**「排尿時，讓逼尿肌收縮的是？」<br>- A 骨盆副交感神經（S2–S4）（正）<br>- B 交感神經<br>- C 陰部神經 | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urinary-route-micturition:62](urinary-route-micturition.md#L62) | - **確認：**「剛排出的正常尿液看起來？」<br>- A 稻草色、透明（正）<br>- B 一定是混濁的<br>- C 紅色 | [PH1](#e-ph1) `urine-physical-properties`<br>[PH2](#e-ph2) `urine-physical-properties` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urine-concentration:15](urine-concentration.md#L15) | - **確認：**「課本說濃尿最高可以達到？」<br>- A 1200 mOsm/L，約血漿的四倍（正）<br>- B 跟血漿一樣<br>- C 比血漿稀 | [UC1](#e-uc1) `urine-concentration`<br>[UC2](#e-uc2) `urine-concentration`<br>[AD2](#e-ad2) `adh-water-reabsorption` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urine-concentration:27](urine-concentration.md#L27) | - **確認：**「下降枝可以讓什麼通過？」<br>- A 水（正）<br>- B NaCl<br>- C 都不行 | [CC2](#e-cc2) `countercurrent-mechanism` | **不能保證唯一**；A水有據；B NaCl不能由「對溶質通透差」推成完全不能通過，題幹又未問主要／高通透物質。請Claude裁決題目邊界。 |
| [urine-concentration:39](urine-concentration.md#L39) | - **確認：**「上升枝把鹽送出去，對髓質有什麼幫助？」<br>- A 讓髓質維持很濃（正）<br>- B 讓髓質變稀<br>- C 讓上升枝的水流出去 | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urine-concentration:49](urine-concentration.md#L49) | - **確認：**「直血管扮演的角色叫？」<br>- A 逆流交換（正）<br>- B 逆流增強<br>- C 過濾 | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urine-concentration:59](urine-concentration.md#L59) | - **確認：**「ADH 從哪裡釋放？」<br>- A 腦下垂體後葉（正）<br>- B 腎臟<br>- C 膀胱 | [AD1](#e-ad1) `adh-water-reabsorption` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [urine-concentration:68](urine-concentration.md#L68) | - **確認：**「ADH 和醛固酮都能保水，方法哪裡不同？」<br>- A ADH 直接讓水通過；醛固酮主要是回收鈉（正）<br>- B 兩個都只回收鈉<br>- C 兩個都直接打開水通道 | [UC1](#e-uc1) `urine-concentration`<br>[UC3](#e-uc3) `urine-concentration`<br>[AD3](#e-ad3) `adh-water-reabsorption` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [water-sodium-regulation:11](water-sodium-regulation.md#L11) | - **確認：**「課本說，平均每天總共攝取多少水？」<br>- A 約 2500 mL（正）<br>- B 約 250 mL<br>- C 約 25 L | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [water-sodium-regulation:21](water-sodium-regulation.md#L21) | - **確認：**「正常時，水的攝取和排出是什麼關係？」<br>- A 維持平衡（正）<br>- B 排出永遠比攝取多<br>- C 兩者沒有關係 | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output`<br>[WI3](#e-wi3) `water-intake-output` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [water-sodium-regulation:31](water-sodium-regulation.md#L31) | - **確認：**「『鈉的總量改變』和『鈉的濃度改變』，是同一件事嗎？」<br>- A 不是（正）<br>- B 是 | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |
| [water-sodium-regulation:48](water-sodium-regulation.md#L48) | - **確認：**「醛固酮讓鈉回收增加時，鉀會？」<br>- A 分泌增加（正）<br>- B 回收增加<br>- C 不變 | [SW2](#e-sw2) `sodium-water-balance`<br>[K2](#e-k2) `potassium-secretion` | **唯一（依本題選項、卡片及正常／標準示例條件）**；正項與本節來源相符；其餘選項均不符合題幹所問。 |

## ※項目全列：是否與卡片衝突

有據的比喻仍保留教師核可權；無據不自動等於矛盾。

| 位置 | 原文 | 三分判定 | 來源／相關片段 | 衝突判斷及範圍 |
|---|---|---|---|---|
| electrolyte-balance:17 | - **先認識：** 半透膜＝水可以通過、溶質不能通過的膜。※ | 無據 | [EO2](#e-eo2) `electrolyte-osmolarity` | 限本圖理想半透膜不衝突；不能外推所有膜；※ 水移動方向有據；「半透膜＝所有溶質不能通過」定義未見本教材卡句，只能是本圖理想化約定，不宜當所有生物膜的通則。 |
| electrolyte-balance:38 | - **💡提示：**「鈉在外、鉀在內。」※（口訣） | 有據 | [EO3](#e-eo3) `electrolyte-osmolarity` | 未見與卡片衝突；※ 口訣與卡列內K外Na相同；未見衝突。 |
| filtration-clearance:4 | 「腎臟像一個濾網：把血液裡的水和小東西濾出來，大的留在血液裡。※ 6 關之後，你會知道什麼過得去、什麼過不去，也會知道醫護人員怎麼用『清除率』看腎臟的工作量。」〔開始〕 | 有據 | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[RC1](#e-rc1) `renal-clearance` | 未見與卡片衝突；※ 濾網比喻對應大小限制；不是指所有小分子蛋白與白蛋白一樣。 |
| filtration-clearance:40 | - **💡提示：**「靜水壓就像水管裡的水壓，會往外推。」※ | 無據 | [GR1](#e-gr1) `gfr-regulation` | 泛稱有誤導風險：囊內靜水壓對抗過濾；限腎絲球側才成立；※ 腎絲球靜水壓向囊推有據，但本句未指明哪側；囊內靜水壓同樣是靜水壓，卻對抗過濾。泛稱會誤導。 |
| fluid-compartments:4 | 「你的身體有一大半是水。這些水分別放在哪裡？6 關之後，你能把身體的水分成幾個『水箱』，並算出各裝多少。※」〔開始〕 | 有據 | [BF1](#e-bf1) `body-fluid-compartments` | 未見與卡片衝突；※ 水箱比喻；標準示例大半為水有據，不外推每人固定60%。 |
| kidney-anatomy:52 | - **💡提示：**「只有一個器官會『做』尿，其他三個是管子或袋子。」※ | 有據 | [US1](#e-us1) `urinary-system-overview` | 未見與卡片衝突；※ 管子／袋子是教學比喻；四器官分工有據，未見衝突。 |
| tubular-handling:29 | - **💡提示：**「身體的營養會全部拿回；廢物不一定。」※ | 無據 | [TR1](#e-tr1) `tubular-reabsorption` | 超出卡的正常、特定物質與負荷條件；不可當所有營養的通則；※ 卡只支持葡萄糖、胺基酸「正常可全回收」；「身體的營養」全部回收的普遍化沒有依據，也漏負荷條件。 |
| tubular-handling:40 | - **💡提示：**「搬運工一次只能搬那麼多，多出來的就留下了。」※ | 有據 | [TR1](#e-tr1) `tubular-reabsorption` | 未見與卡片衝突；※ 搬運工為有上限轉運的比喻；卡有375 mg/min，未見衝突。 |
| urinary-route-micturition:49 | - **💡提示：**「要把尿擠出去：袋子要擠緊，出口要打開。」※ | 有據 | [UB2](#e-ub2) `urinary-bladder`<br>[MR1](#e-mr1) `micturition-reflex` | 未見與卡片衝突；※ 袋子擠、出口開對應逼尿肌收縮／內括約肌鬆弛，未見衝突；外括約肌另行控制。 |
| urine-concentration:4 | 「天氣熱、喝水少時，尿會變黃又少；喝很多水時，尿又多又淡。※ 腎臟怎麼做到的？6 關之後你就知道。」〔開始〕 | 無據 | [UC3](#e-uc3) `urine-concentration`<br>[PH2](#e-ph2) `urine-physical-properties` | 未見與卡片衝突；※ 缺水保水、尿色隨濃度有據；天熱必變黃、喝很多水必多且淡的整組生活情境未見直接卡句，勿當無條件規律。 |
| urine-concentration:7 | - **先認識：** 滲透＝水會往溶質（鹽、尿素等）比較多的地方移動。髓質梯度＝腎髓質越深越濃。※ | 有據 | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[CC3](#e-cc3) `countercurrent-mechanism` | 未見與卡片衝突；※ 為水移向較多溶質及髓質深部高滲透的簡化，未見相反敘述；未代表所有溶質、所有膜均有效。 |
| urine-concentration:47 | - **💡提示：**「如果血液又快又直地穿過去，髓質的鹽會怎樣？」※ | 無據 | [CC2](#e-cc2) `countercurrent-mechanism` | 未見與卡片衝突；※ 逆流緩慢有據，快速且直穿的反事實幾何情境卡未明述；未見直接衝突。 |
| water-sodium-regulation:9 | - **先認識：** 代謝水＝身體分解養分時自己產生的水。※ | 無據 | [WI1](#e-wi1) `water-intake-output`<br>[WI4](#e-wi4) `water-intake-output` | 未見與卡片衝突；※ 卡有「自己產生」與代謝水200mL，但未寫分解養分的生成機轉；此新增機轉非相反、待教師認可。 |
| water-sodium-regulation:19 | - **先認識：** 無知覺蒸散＝在不知不覺中，從皮膚和呼吸流失的水。※ | 無據 | [WI2](#e-wi2) `water-intake-output`<br>[WI3](#e-wi3) `water-intake-output` | 未見與卡片衝突；※ 卡將無知覺蒸散明列皮膚，肺呼氣另列；把名詞範圍擴大為皮膚＋呼吸在指定卡找不到，非據此斷定生理上錯。 |
| water-sodium-regulation:20 | - **💡提示：**「呼氣也會帶走水氣，冬天對著窗戶哈氣就看得到。」※ | 無據 | [WI2](#e-wi2) `water-intake-output` | 未見與卡片衝突；※ 呼氣失水有據；冬天向窗哈氣的生活示例未載，未見與卡衝突。 |

## 全部逐句表

下表來源碼均指向後附的「uid＋卡內逐字原句片段＋實際行號」。多分句合列時，相關引用覆蓋該句各部分；無據／矛盾列引用的是最接近但不足以支持的卡句或相反句，不冒稱它支持待審句。純題幹／操作的有據判定只指所要求的正解有來源，不表示學生作答前就能推得出。

### electrolyte-balance

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「鹽溶在水裡，會分成看不見的帶電小粒子。 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[MG2](#e-mg2) `magnesium-balance`<br>[K1](#e-k1) `potassium-secretion` | 帶電是離子用語釋義；神經／肌肉影響可由鎂、鉀卡補據，不是只有本教材N01 concept。 |
| L4.2 | 敘述／提示 | 這些粒子決定水往哪裡走，也影響神經和肌肉。 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[MG2](#e-mg2) `magnesium-balance`<br>[K1](#e-k1) `potassium-secretion` | 帶電是離子用語釋義；神經／肌肉影響可由鎂、鉀卡補據，不是只有本教材N01 concept。 |
| L4.3 | 敘述／提示 | 6 關之後，你能看懂主要的離子和它們的工作。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[MG2](#e-mg2) `magnesium-balance`<br>[K1](#e-k1) `potassium-secretion` | 帶電是離子用語釋義；神經／肌肉影響可由鎂、鉀卡補據，不是只有本教材N01 concept。 |
| L7.1 | 先認識 | - **先認識：** 電解質＝溶在水裡會分開成離子的物質，例如鹽；離子＝帶電的小粒子。 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L8.1 | 題幹／預期答案 | - **問題：**「一個葡萄糖、一個 NaCl、一個 MgCl₂ 溶進水裡，各會變成幾顆粒子？請放到 1／2／3 格。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L9.1 | 敘述／提示 | - **💡提示：**「NaCl 分成 Na⁺ 和 Cl⁻；MgCl₂ 裡有兩個 Cl。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L10.1 | 答對說明 | - **答對：**「葡萄糖不解離，仍是 1 顆；NaCl 變成 2 顆；MgCl₂ 變成 Mg²⁺ 加 2 個 Cl⁻，共 3 顆。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L12.1 | 確認題正解 | - A 不會，仍是 1 顆（正） | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L14.1 | 答錯回饋 | - 答錯回饋：「葡萄糖是非電解質，不會解離。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L17.1 | 先認識 | - **先認識：** 半透膜＝水可以通過、溶質不能通過的膜。 | **無據** | [EO2](#e-eo2) `electrolyte-osmolarity` | ※ 水移動方向有據；「半透膜＝所有溶質不能通過」定義未見本教材卡句，只能是本圖理想化約定，不宜當所有生物膜的通則。 |
| L18.1 | 題幹／預期答案 | - **問題：**「半透膜兩邊，一邊粒子多、一邊粒子少。 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L18.2 | 題幹／預期答案 | 水會往哪一邊走？請點箭頭。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L19.1 | 敘述／提示 | - **💡提示：**「課本說：水會移向離子或分子比較多的地方。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L20.1 | 答對說明 | - **答對：** 水往粒子多的那一邊移動，那一邊的水位上升。 | **無據** | [EO2](#e-eo2) `electrolyte-osmolarity` | 水移向多粒子側有據，但「該側水位上升」新增容器／液面幾何與可移動溶質條件，卡未明載；屬模型推論，待教師核可。 |
| L22.1 | 確認題正解 | - A 解離後的粒子數（正） | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L25.1 | 答錯回饋 | - 答錯回饋：「要看解離後的粒子數，不能只看未解離的分子個數或質量。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L28.1 | 先認識 | - **先認識：** mEq/L＝把離子帶幾個電荷（價數）也算進去的濃度單位。 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L29.1 | 題幹／預期答案 | - **問題：**「Mg²⁺ 帶 2 個正電，Na⁺ 帶 1 個。 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L29.2 | 題幹／預期答案 | 誰能吸引的 Cl⁻ 是對方的兩倍？」〔Mg²⁺〕〔Na⁺〕 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L30.1 | 敘述／提示 | - **💡提示：**「看右上角的數字：電荷越多，吸得越多。」 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity` | 只限本題Mg²⁺與Na⁺對Cl⁻的配比，不外推所有離子或所有吸引力大小。 |
| L32.1 | 確認題正解 | - A 不是，mEq 還要考慮價數（正） | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L34.1 | 答錯回饋 | - 答錯回饋：「mEq/L 考慮離子價數，和滲透粒子數不是同一件事。」 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L37.1 | 題幹／預期答案 | - **問題：**「請把 Na⁺ 和 K⁺ 分別放到它比較多的地方：細胞外、細胞內。」 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity`<br>[SW2](#e-sw2) `sodium-water-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L38.1 | 敘述／提示 | - **💡提示：**「鈉在外、鉀在內。」 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity` | ※ 口訣與卡列內K外Na相同；未見衝突。 |
| L38.2 | 敘述／提示 | ※（口訣） | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity` | ※ 口訣與卡列內K外Na相同；未見衝突。 |
| L39.1 | 題幹／預期答案 | - **動作 ②：**「醛固酮讓腎臟多回收哪一個？」〔鈉〕〔鉀〕 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity`<br>[SW2](#e-sw2) `sodium-water-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L40.1 | 答錯回饋 | - 答錯回饋：「醛固酮促進遠曲小管和集尿管回收鈉；水可以隨滲透作用一起回收。」 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity`<br>[SW2](#e-sw2) `sodium-water-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L43.1 | 題幹／預期答案 | - **問題：**「細胞外液最主要的『陰離子』是誰？」〔Cl⁻〕〔Na⁺〕〔K⁺〕 | **有據** | [CL1](#e-cl1) `chloride-balance`<br>[CL2](#e-cl2) `chloride-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L44.1 | 敘述／提示 | - **💡提示：**「陰離子帶負電，看符號右上角的『−』。」 | **有據** | [CL1](#e-cl1) `chloride-balance`<br>[EO3](#e-eo3) `electrolyte-osmolarity` | 陰離子／負號為該離子分類的符號釋義。 |
| L45.1 | 答對說明 | - **答對：**「Cl⁻ 是細胞外液主要的陰離子，課本正常血清濃度為 95–103 mEq/L。」 | **有據** | [CL1](#e-cl1) `chloride-balance`<br>[CL2](#e-cl2) `chloride-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L46.1 | 題幹／預期答案 | - **動作 ②：**「Na⁺ 被醛固酮回收時，Cl⁻ 會怎樣？」〔被動跟著被吸收〕〔被排出去〕 | **有據** | [CL1](#e-cl1) `chloride-balance`<br>[CL2](#e-cl2) `chloride-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L47.1 | 答錯回饋 | - 答錯回饋：「Na⁺ 被回收時，Cl⁻ 可以被動吸收，所以 Cl⁻ 的濃度也間接受醛固酮影響。」 | **有據** | [CL1](#e-cl1) `chloride-balance`<br>[CL2](#e-cl2) `chloride-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L50.1 | 題幹／預期答案 | - **問題：**「Mg²⁺ 主要在細胞內還是細胞外？」〔細胞內〕〔細胞外〕 | **有據** | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L51.1 | 敘述／提示 | - **💡提示：**「課本說它是『細胞內主要電解質之一』。」 | **有據** | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L52.1 | 題幹／預期答案 | - **動作 ②：**「Mg²⁺ 可以活化什麼？」〔醣類與蛋白質代謝的酶〕〔ADH 的分泌〕 | **有據** | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L54.1 | 確認題正解 | - A 不一樣（正） | **有據** | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L56.1 | 答錯回饋 | - 答錯回饋：「課本：低血鎂與高血鎂的神經反應方向不同。」 | **有據** | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L59.1 | 題幹／預期答案 | 1. 「NaCl 溶在水裡變成幾顆？」〔2 顆〕〔1 顆〕 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L60.1 | 題幹／預期答案 | 2. 「水往哪一邊走？」〔粒子多的一邊〕〔粒子少的一邊〕 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L61.1 | 題幹／預期答案 | 3. 「細胞外最多的陽離子是？」〔Na⁺〕〔K⁺〕 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity`<br>[SW1](#e-sw1) `sodium-water-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L63.1 | 結語 | - **結語：**「電解質在水中解離成離子；水往粒子多的地方走；細胞外以 Na⁺、Cl⁻ 為主，細胞內以 K⁺、Mg²⁺ 為主。」 | **有據** | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO3](#e-eo3) `electrolyte-osmolarity`<br>[MG1](#e-mg1) `magnesium-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L66.1 | 敘述／提示 | **給教師：** 本份節點 5 的標題是「氯與鈣磷」，但 reviewed 卡的內容只有氯，所以腳本只寫氯。 | **有據** | [CL1](#e-cl1) `chloride-balance` | 教師用範圍註記：N05引用chloride-balance，沒有把缺卡鈣磷寫入學生稿；未把「目前只有氯卡」擴大為全知識庫沒有任何鈣磷卡。 |
| L66.2 | 敘述／提示 | 鈣、磷要等卡片補齊後再加。 | **有據** | [CL1](#e-cl1) `chloride-balance` | 教師用範圍註記：N05引用chloride-balance，沒有把缺卡鈣磷寫入學生稿；未把「目前只有氯卡」擴大為全知識庫沒有任何鈣磷卡。 |

### filtration-clearance

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「腎臟像一個濾網：把血液裡的水和小東西濾出來，大的留在血液裡。 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[RC1](#e-rc1) `renal-clearance` | ※ 濾網比喻對應大小限制；不是指所有小分子蛋白與白蛋白一樣。 |
| L4.2 | 敘述／提示 | ※ 6 關之後，你會知道什麼過得去、什麼過不去，也會知道醫護人員怎麼用『清除率』看腎臟的工作量。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[RC1](#e-rc1) `renal-clearance` | ※ 濾網比喻對應大小限制；不是指所有小分子蛋白與白蛋白一樣。 |
| L7.1 | 先認識 | - **先認識：** 鮑氏囊＝包住腎絲球、接住濾出液體的囊。 | **有據** | [NH2](#e-nh2) `nephron-histology`<br>[GF1](#e-gf1) `glomerular-filtration` | 由腎小體構成與濾液流入鮑氏囊作功能釋義。 |
| L8.1 | 題幹／預期答案 | - **問題：**「過濾時，水和小分子是從腎絲球（血液）流到鮑氏囊，還是反過來？請點箭頭，讓它指向正確方向。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF3](#e-gf3) `glomerular-filtration`<br>[NH2](#e-nh2) `nephron-histology` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L9.1 | 敘述／提示 | - **💡提示：**「濾出來的液體最後會變成尿。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[UP1](#e-up1) `urine-pathway` | 指濾出液沿小管處理後形成尿，不是濾液即最終尿。 |
| L10.1 | 答對說明 | - **答對：**「血液裡的水和可以通過的溶質，經過濾膜進入鮑氏囊。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF3](#e-gf3) `glomerular-filtration`<br>[NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L12.1 | 確認題正解 | - A 皮質的腎小體（正） | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF3](#e-gf3) `glomerular-filtration`<br>[NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L15.1 | 答錯回饋 | - 答錯回饋：「形成濾液的位置是皮質的腎小體，不是輸尿管或腎盂。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF3](#e-gf3) `glomerular-filtration`<br>[NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L18.1 | 題幹／預期答案 | - **問題：**「請從血液那一側開始，依序點出過濾膜的三層。」 | **有據** | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L19.1 | 敘述／提示 | - **動作：** 微血管內皮 → 基底膜 → 足細胞（鮑氏囊臟層） | **有據** | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L20.1 | 敘述／提示 | - **💡提示：**「從血管自己的牆壁開始。」 | **有據** | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L21.1 | 答錯回饋 | - **答錯：**「依序是：微血管內皮、基底膜、鮑氏囊臟層足細胞。」 | **有據** | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L23.1 | 確認題正解 | - A 鮑氏囊壁層（正） | **有據** | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L26.1 | 答錯回饋 | - 答錯回饋：「鮑氏囊壁層不屬於三層過濾膜。」 | **有據** | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L29.1 | 題幹／預期答案 | - **問題：**「請把水、葡萄糖、胺基酸、白蛋白、紅血球，分到〔過得去〕或〔過不去〕。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L30.1 | 敘述／提示 | - **💡提示：**「太大的東西過不去。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L31.1 | 答對說明 | - **答對：**「葡萄糖、胺基酸和小分子可以過濾；正常濾液沒有血球，也沒有白蛋白。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L33.1 | 確認題正解 | - A 蛋白質（正） | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L36.1 | 答錯回饋 | - 答錯回饋：B「血漿本來就沒有血球，所以不能拿血球來比。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L36.2 | 答錯回饋 | C「水可以自由過濾。」 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L39.1 | 題幹／預期答案 | - **問題：**「請把三個壓力卡放到〔推進鮑氏囊〕或〔對抗過濾〕：腎絲球靜水壓、囊內壓、血漿膠體壓。」 | **有據** | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L40.1 | 敘述／提示 | - **💡提示：**「靜水壓就像水管裡的水壓，會往外推。」 | **無據** | [GR1](#e-gr1) `gfr-regulation` | ※ 腎絲球靜水壓向囊推有據，但本句未指明哪側；囊內靜水壓同樣是靜水壓，卻對抗過濾。泛稱會誤導。 |
| L41.1 | 答對說明 | - **答對：**「靜水壓促進過濾；囊內壓和血漿膠體壓對抗過濾。」 | **有據** | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation` | 「靜水壓」承題幹的腎絲球靜水壓；不可外推至囊內壓。 |
| L42.1 | 答錯回饋 | - **答錯：** 錯卡彈回，並顯示它的正確說明。 | **無據** | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation` | 未寫三卡各自實際答錯回饋，只指定彈回與說明，無法逐句覆核。 |
| L45.1 | 先認識 | - **先認識：** 清除率 C＝U×V／P。 | **有據** | [RC1](#e-rc1) `renal-clearance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L46.1 | 題幹／預期答案 | - **問題：**「請把『尿中濃度』『每分鐘尿量』『血漿濃度』放到 U、V、P。」 | **有據** | [RC1](#e-rc1) `renal-clearance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L47.1 | 敘述／提示 | - **💡提示：**「U 和 V 都跟尿有關，P 是血漿。」 | **有據** | [RC1](#e-rc1) `renal-clearance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L48.1 | 答對說明 | - **答對：**「U 是尿中濃度，V 是每分鐘尿量，P 是血漿濃度。」 | **有據** | [RC1](#e-rc1) `renal-clearance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L50.1 | 確認題正解 | - A 每分鐘排除某物質所相當的血漿體積（正） | **有據** | [RC1](#e-rc1) `renal-clearance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L53.1 | 答錯回饋 | - 答錯回饋：「清除率代表『每分鐘清掉多少體積的血漿』裡的這個物質。」 | **有據** | [RC1](#e-rc1) `renal-clearance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L56.1 | 先認識 | - **先認識：** GFR＝腎絲球過濾率。 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L57.1 | 題幹／預期答案 | - **問題：**「三種物質在腎臟的遭遇不同。 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L57.2 | 題幹／預期答案 | 請把它們配到正確的處理方式。」 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L58.1 | 敘述／提示 | - 菊糖：只過濾，不回收、不分泌 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L59.1 | 敘述／提示 | - 肌酸酐：過濾，再加少量分泌 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L60.1 | 敘述／提示 | - PAH：過濾＋分泌 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L61.1 | 敘述／提示 | - **💡提示：**「只被濾出來、什麼都不加減的，最能代表過濾量。」 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L62.1 | 題幹／預期答案 | - **動作 ②：**「哪一個的清除率剛好等於 GFR？」〔菊糖〕〔PAH〕 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L63.1 | 答錯回饋 | - 答錯回饋：「PAH 兼具過濾與分泌，用來估腎血漿流量；菊糖的清除率才等於 GFR。」 | **有據** | [RC2](#e-rc2) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L66.1 | 題幹／預期答案 | 1. 「過濾的方向？」〔腎絲球→鮑氏囊〕〔鮑氏囊→腎絲球〕 | **有據** | [GF1](#e-gf1) `glomerular-filtration` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L67.1 | 題幹／預期答案 | 2. 「過不去的是？」〔血球、白蛋白〕〔水、葡萄糖〕 | **有據** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L68.1 | 題幹／預期答案 | 3. 「清除率等於 GFR 的是？」〔菊糖〕〔PAH〕 | **有據** | [RC2](#e-rc2) `renal-clearance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L70.1 | 結語 | - **結語：**「血液經三層過濾膜進入鮑氏囊；大的蛋白質和血球留在血中；用菊糖的清除率可以知道 GFR。」 | **矛盾** | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[RC2](#e-rc2) `renal-clearance` | 「血液經三層過濾膜進入鮑氏囊」把血液整體當濾過物；卡明定只有水及可通過的溶質，正常濾液無血球、白蛋白。後半菊糖有據。 |

### fluid-compartments

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「你的身體有一大半是水。 | **有據** | [BF1](#e-bf1) `body-fluid-compartments` | ※ 水箱比喻；標準示例大半為水有據，不外推每人固定60%。 |
| L4.2 | 敘述／提示 | 這些水分別放在哪裡？6 關之後，你能把身體的水分成幾個『水箱』，並算出各裝多少。 | **有據** | [BF1](#e-bf1) `body-fluid-compartments` | ※ 水箱比喻；標準示例大半為水有據，不外推每人固定60%。 |
| L7.1 | 題幹／預期答案 | - **問題：**「依課本的標準例子，身體的總水量大約占體重多少？請把人形圖裡的水位拉到你的答案。」 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF5](#e-bf5) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L7.2 | 題幹／預期答案 | 〔60%〕〔40%〕〔20%〕 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF5](#e-bf5) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L8.1 | 敘述／提示 | - **💡提示：**「超過一半。」 | **有據** | [BF1](#e-bf1) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L9.1 | 答對說明 | - **答對：**「課本標準例子：總水量約占體重 60%。」 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF5](#e-bf5) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L11.1 | 確認題正解 | - A 這個比例的分母是體重、總水量，還是細胞外液（正） | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF5](#e-bf5) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L14.1 | 答錯回饋 | - 答錯回饋：「同一個百分比，分母不同，意思就不同。」 | **有據** | [BF4](#e-bf4) `body-fluid-compartments`<br>[BF5](#e-bf5) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L17.1 | 先認識 | - **先認識：** 細胞內液＝細胞裡面的水；細胞外液＝細胞外面的水。 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L18.1 | 題幹／預期答案 | - **問題：**「總水量裡，細胞內、細胞外各占多少？請把 2/3、1/3 放進去。」 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L19.1 | 敘述／提示 | - **💡提示：**「大部分的水在細胞裡。」 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L20.1 | 題幹／預期答案 | - **動作 ②：**「哪一種離子在細胞外比較多？」〔Na⁺〕〔K⁺〕 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L21.1 | 答錯回饋 | - 答錯回饋：「細胞外以 Na⁺ 較多，細胞內以 K⁺ 較多。」 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L24.1 | 先認識 | - **先認識：** 血漿＝血管裡血液的液體部分；組織間液＝細胞和細胞之間的水。 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments`<br>[RB1](#e-rb1) `renal-blood-flow` | 將液體所在區間作名稱釋義；不是宣稱所有細胞外液都只有這兩類。 |
| L25.1 | 題幹／預期答案 | - **問題：**「細胞外液分成血漿和組織間液。 | **有據** | [BF2](#e-bf2) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L25.2 | 題幹／預期答案 | 請把 20%、80% 放進去（這是占細胞外液的比例）。」 | **有據** | [BF2](#e-bf2) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L26.1 | 敘述／提示 | - **💡提示：**「血管裡的比較少。」 | **有據** | [BF2](#e-bf2) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L28.1 | 確認題正解 | - A 4%（正） | **有據** | [BF2](#e-bf2) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L31.1 | 答錯回饋 | - 答錯回饋：「細胞外液占體重 20%，再乘 20% 就是 4%。 | **有據** | [BF2](#e-bf2) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L31.2 | 答錯回饋 | 『占細胞外液 20%』不等於『占體重 20%』。」 | **有據** | [BF2](#e-bf2) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L34.1 | 題幹／預期答案 | - **問題：**「請在四個水箱填上占體重的比例：細胞內液、細胞外液、血漿、組織間液。」 | **有據** | [BF2](#e-bf2) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L35.1 | 敘述／提示 | - **動作：** 把 40%、20%、4%、16% 拖進對應的水箱。 | **有據** | [BF2](#e-bf2) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L36.1 | 敘述／提示 | - **💡提示：**「60% × 2/3 ＝ ？」 | **有據** | [BF2](#e-bf2) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L37.1 | 答對說明 | - **答對：**「細胞內液 40%、細胞外液 20%；血漿 4%、組織間液 16%。」 | **有據** | [BF2](#e-bf2) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L39.1 | 確認題正解 | - A 4% 和 16%（正） | **有據** | [BF2](#e-bf2) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L41.1 | 答錯回饋 | - 答錯回饋：「通用的 5%／15% 分法，和本課本的 4%／16% 不同，考試請依課本。」 | **有據** | [BF2](#e-bf2) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L44.1 | 題幹／預期答案 | - **問題：**「血漿和組織間液之間隔著微血管壁。 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L44.2 | 題幹／預期答案 | 哪一種東西過不去，所以主要留在血漿裡？」〔蛋白質〕〔水〕〔Na⁺〕 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L45.1 | 敘述／提示 | - **動作：** 點選後，該粒子試著穿過微血管壁：蛋白質被擋住，水和 Na⁺ 都能通過。 | **無據** | [EO3](#e-eo3) `electrolyte-osmolarity` | 蛋白質被擋有卡句；動畫新增「水和Na⁺都能穿過微血管壁」在本教材卡與補引EO卡未有該特定屏障的逐字支持。 |
| L46.1 | 敘述／提示 | - **💡提示：**「大的東西過不去。」 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L47.1 | 答對說明 | - **答對：**「血漿與組織間液最大的差別是蛋白質的量；微血管壁不讓蛋白質通過，所以蛋白質留在血漿裡。」 | **有據** | [EO3](#e-eo3) `electrolyte-osmolarity` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L50.1 | 題幹／預期答案 | - **問題：**「課本說，含水比例會隨年齡、性別不同。 | **有據** | [BF3](#e-bf3) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L50.2 | 題幹／預期答案 | 請把 55%、65% 分別放到女性、男性。」 | **有據** | [BF3](#e-bf3) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L51.1 | 敘述／提示 | - **💡提示：**「課本例子裡，男性的比例比較高。」 | **有據** | [BF3](#e-bf3) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L52.1 | 題幹／預期答案 | - **動作 ②：**「一位 50 kg 的女性，含水 55%，細胞內液占總水量 2/3。 | **有據** | [BF3](#e-bf3) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L52.2 | 題幹／預期答案 | 她的細胞內液大約多少？」〔約 18.33 L〕〔約 20 L〕〔約 27.5 L〕 | **有據** | [BF3](#e-bf3) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L53.1 | 敘述／提示 | - **💡提示：**「先算 50 × 0.55，再乘 2/3。」 | **有據** | [BF3](#e-bf3) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L54.1 | 答錯回饋 | - 答錯回饋：「27.5 L 是總水量；再乘 2/3 才是細胞內液，約 18.33 L。 | **有據** | [BF3](#e-bf3) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L54.2 | 答錯回饋 | 20 L 是直接套用體重 40%，忽略了題目給的假設。」 | **有據** | [BF3](#e-bf3) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L57.1 | 題幹／預期答案 | 1. 「總水量約占體重？」〔60%〕〔40%〕 | **有據** | [BF1](#e-bf1) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L58.1 | 題幹／預期答案 | 2. 「細胞內：細胞外？」〔2/3：1/3〕〔1/3：2/3〕 | **有據** | [BF1](#e-bf1) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L59.1 | 題幹／預期答案 | 3. 「血漿占體重？」〔4%〕〔20%〕 | **有據** | [BF2](#e-bf2) `body-fluid-compartments` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L61.1 | 結語 | - **結語：**「身體的水約占體重 60%：2/3 在細胞內、1/3 在細胞外；細胞外液再分成血漿（4%）和組織間液（16%）。」 | **有據** | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |

### kidney-anatomy

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「腎臟在身體哪裡？切開長什麼樣子？它做哪些工作？6 關之後，你能在圖上指出腎臟的各部分，並說出它們的工作。」 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KS1](#e-ks1) `kidney-structure`<br>[US1](#e-us1) `urinary-system-overview`<br>[KE1](#e-ke1) `kidney-endocrine` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L7.1 | 先認識 | - **先認識：** 後腹腔＝腹部後側、腹膜後面的空間。 | **有據** | [KP1](#e-kp1) `kidney-position` | 後腹腔為既有位置用語的白話釋義；身體左右是判圖操作約定。 |
| L7.2 | 先認識 | 圖上標有「身體右側／左側」，請不要用螢幕的左右來判斷。 | **有據** | [KP1](#e-kp1) `kidney-position` | 後腹腔為既有位置用語的白話釋義；身體左右是判圖操作約定。 |
| L8.1 | 題幹／預期答案 | - **問題：**「請把左腎、右腎放到背後脊柱兩側正確的高度。」 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L9.1 | 敘述／提示 | - **動作：** 點腎臟卡，再點高度格（較高／較低）。 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L10.1 | 敘述／提示 | - **💡提示：**「身體右邊上方有肝臟。」 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L11.1 | 答對說明 | - **答對：**「腎臟在後腹腔、脊柱兩側，大約 T12 到 L3；右腎比左腎低。」 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L12.1 | 答錯回饋 | - **答錯：**「肝臟在右側，所以右腎比較低。」 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L14.1 | 確認題正解 | - A 腎臟在後腹腔，右腎比左腎低（正） | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L17.1 | 答錯回饋 | - 答錯回饋：B「腎臟在腹膜後方，屬於後腹腔。」 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L17.2 | 答錯回饋 | C「是右腎比較低。」 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L20.1 | 先認識 | - **先認識：** 腎錐體＝髓質裡一個個三角形的構造，有 8–18 個。 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L21.1 | 題幹／預期答案 | - **問題：**「請把『皮質』『髓質』『腎柱』三個標籤，放到切面圖上的位置。」 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L22.1 | 敘述／提示 | - **💡提示：**「腎柱是外層伸到兩個錐體之間的部分。」 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L23.1 | 答對說明 | - **答對：**「外面是皮質，裡面是髓質；皮質伸進腎錐體之間的部分叫腎柱。」 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L24.1 | 答錯回饋 | - **答錯：** 錯的標籤彈回，並顯示它的正確說明。 | **無據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 未提供實際回饋句；只有「顯示正確說明」程序，不能替未寫文案核可。 |
| L26.1 | 確認題正解 | - A 腎柱（正） | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L29.1 | 答錯回饋 | - 答錯回饋：B「腎乳頭在錐體的尖端。」 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L29.2 | 答錯回饋 | C「腎盂在靠近腎門的收集區。」 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L32.1 | 題幹／預期答案 | - **問題：**「尿從腎錐體尖端流出來。 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[UP2](#e-up2) `urine-pathway` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L32.2 | 題幹／預期答案 | 請在圖上依序點出它經過的地方。」 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[UP2](#e-up2) `urine-pathway` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L33.1 | 敘述／提示 | - **動作：** 依序點「腎乳頭 → 小腎盞 → 大腎盞 → 腎盂」，每點對一個，尿滴就前進一格。 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[UP2](#e-up2) `urine-pathway` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L34.1 | 敘述／提示 | - **💡提示：**「先小後大：小腎盞在大腎盞前面。」 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[UP2](#e-up2) `urine-pathway` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L35.1 | 答錯回饋 | - **答錯：**「集尿管開口在乳頭，尿接著進小腎盞，再到大腎盞、腎盂。」 | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[UP2](#e-up2) `urine-pathway` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L37.1 | 確認題正解 | - A 輸尿管（正） | **有據** | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[UP2](#e-up2) `urine-pathway` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L40.1 | 答錯回饋 | - 答錯回饋：B「尿道在膀胱之後。」 | **有據** | [UP1](#e-up1) `urine-pathway`<br>[UP2](#e-up2) `urine-pathway` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L40.2 | 答錯回饋 | C「腎乳頭在腎盂的上游。」 | **有據** | [UP1](#e-up1) `urine-pathway`<br>[UP2](#e-up2) `urine-pathway` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L43.1 | 題幹／預期答案 | - **問題：**「腎臟外面包了三層保護。 | **有據** | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L43.2 | 題幹／預期答案 | 請從最裡面到最外面，依序點出來。」 | **有據** | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L44.1 | 敘述／提示 | - **動作 ①：** 依序點「腎被膜 → 脂肪囊 → 腎筋膜」。 | **有據** | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L45.1 | 敘述／提示 | - **💡提示：**「最貼著腎臟的是一層『膜』，最外面的是『筋膜』。」 | **有據** | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L46.1 | 答錯回饋 | - **答錯：**「由內到外依序是：腎被膜、脂肪囊、腎筋膜。」 | **有據** | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L47.1 | 題幹／預期答案 | - **動作 ②：**「腎臟內側凹進去的地方叫什麼？」〔腎門〕〔腎柱〕 | **有據** | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L48.1 | 答錯回饋 | - 答錯回饋：「腎柱在腎臟裡面；內側凹入處是腎門。」 | **有據** | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L51.1 | 題幹／預期答案 | - **問題：**「請把腎、輸尿管、膀胱、尿道，放到『製造尿／運送尿／儲存尿／排出尿』四格。」 | **有據** | [US1](#e-us1) `urinary-system-overview`<br>[US2](#e-us2) `urinary-system-overview`<br>[TR1](#e-tr1) `tubular-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L52.1 | 敘述／提示 | - **💡提示：**「只有一個器官會『做』尿，其他三個是管子或袋子。」 | **有據** | [US1](#e-us1) `urinary-system-overview` | ※ 管子／袋子是教學比喻；四器官分工有據，未見衝突。 |
| L53.1 | 答對說明 | - **答對：**「腎形成尿液；輸尿管運送、膀胱儲存、尿道排出。」 | **有據** | [US1](#e-us1) `urinary-system-overview`<br>[US2](#e-us2) `urinary-system-overview`<br>[TR1](#e-tr1) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L54.1 | 題幹／預期答案 | - **動作 ②：**「腎還會把哪些廢物排出去？」〔尿素、尿酸、肌酸酐〕〔葡萄糖、胺基酸〕 | **有據** | [US1](#e-us1) `urinary-system-overview`<br>[US2](#e-us2) `urinary-system-overview`<br>[TR1](#e-tr1) `tubular-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L55.1 | 答錯回饋 | - 答錯回饋：「葡萄糖、胺基酸正常會被回收，不是要排出的廢物。」 | **有據** | [TR1](#e-tr1) `tubular-reabsorption` | 跨教材補據；kidney N05 concept 本身沒有列這兩種營養物的回收。 |
| L58.1 | 題幹／預期答案 | - **問題：**「腎臟也會分泌物質。 | **有據** | [KE1](#e-ke1) `kidney-endocrine` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L58.2 | 題幹／預期答案 | 請把『腎素』『紅血球生成素』『活化維生素 D』，配到它影響的事：血壓、紅血球、鈣。」 | **有據** | [KE1](#e-ke1) `kidney-endocrine` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L59.1 | 敘述／提示 | - **💡提示：**「先看名字：紅血球生成素跟哪一個有關？」 | **有據** | [KE1](#e-ke1) `kidney-endocrine` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L60.1 | 答對說明 | - **答對：**「腎素啟動 RAAS 調節血壓；紅血球生成素促進紅血球生成；腎把維生素 D 轉成活性形式，參與鈣調節。」 | **有據** | [KE1](#e-ke1) `kidney-endocrine` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L62.1 | 確認題正解 | - A 調節血壓（正） | **有據** | [KE1](#e-ke1) `kidney-endocrine` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L65.1 | 答錯回饋 | - 答錯回饋：B「那是紅血球生成素。」 | **有據** | [KE1](#e-ke1) `kidney-endocrine` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L65.2 | 答錯回饋 | C「那是活化維生素 D。」 | **有據** | [KE1](#e-ke1) `kidney-endocrine` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L68.1 | 敘述／提示 | - **畫面：**「腎臟做好一滴尿，請依序回答。」 | **有據** | [UP1](#e-up1) `urine-pathway`<br>[UP2](#e-up2) `urine-pathway` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L70.1 | 題幹／預期答案 | 1. 「尿從錐體出來的路線是？」〔腎乳頭→腎盞→腎盂〕〔腎盂→腎盞→腎乳頭〕 | **有據** | [UP1](#e-up1) `urine-pathway`<br>[UP2](#e-up2) `urine-pathway` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L71.1 | 題幹／預期答案 | 2. 「腎盂之後去哪裡？」〔輸尿管→膀胱→尿道〕〔尿道→膀胱→輸尿管〕 | **有據** | [UP1](#e-up1) `urine-pathway` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L72.1 | 題幹／預期答案 | 3. 「腎臟除了做尿，還做什麼？」〔分泌腎素、紅血球生成素，活化維生素 D〕〔儲存尿液〕 | **有據** | [US2](#e-us2) `urinary-system-overview`<br>[KE1](#e-ke1) `kidney-endocrine` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L73.1 | 結語 | - **結語：**「腎在後腹腔，外層皮質、內層髓質；尿從乳頭經腎盞、腎盂進輸尿管；腎還負責內分泌工作。」 | **有據** | [KP1](#e-kp1) `kidney-position`<br>[KS1](#e-ks1) `kidney-structure`<br>[UP1](#e-up1) `urine-pathway`<br>[KE1](#e-ke1) `kidney-endocrine` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |

### nephron-circulation

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「腎臟裡有很多製造尿液的小單位，叫做『腎元』。 | **無據** | [NH1](#e-nh1) `nephron-histology` | 「製造尿液的小單位」可作機轉簡化，但所列卡未明寫基本單位／很多的定義；不能把構成句當逐字定義。 |
| L4.2 | 敘述／提示 | 血液怎麼流進腎臟？腎臟又怎麼知道血壓變低了？6 關之後你就知道。」 | **無據** | [NH1](#e-nh1) `nephron-histology` | 「製造尿液的小單位」可作機轉簡化，但所列卡未明寫基本單位／很多的定義；不能把構成句當逐字定義。 |
| L7.1 | 先認識 | - **先認識：** 腎元＝腎臟製造尿液的基本單位。 | **無據** | [NH1](#e-nh1) `nephron-histology` | 相關卡列腎元的組成，未明述「製造尿液的基本單位」；未見相反說法。 |
| L8.1 | 題幹／預期答案 | - **問題：**「請把『腎小體』和『腎小管』放到腎元圖上。」 | **有據** | [NH1](#e-nh1) `nephron-histology`<br>[NH2](#e-nh2) `nephron-histology` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L9.1 | 敘述／提示 | - **💡提示：**「腎小體是圓球那一端，腎小管是後面長長的管子。」 | **無據** | [NH2](#e-nh2) `nephron-histology` | 圓球端、長管形狀未在本教材引用卡文字明述；需圖面／教師補據，未見相反說法。 |
| L10.1 | 答對說明 | - **答對：**「腎元由腎小體和腎小管組成。」 | **有據** | [NH1](#e-nh1) `nephron-histology`<br>[NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L11.1 | 題幹／預期答案 | - **動作 ②：**「腎小體裡有哪兩個構造？」〔腎絲球＋鮑氏囊〕〔腎盂＋腎盞〕 | **有據** | [NH1](#e-nh1) `nephron-histology`<br>[NH2](#e-nh2) `nephron-histology` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L12.1 | 答錯回饋 | - 答錯回饋：「腎盂、腎盞是收集尿的地方；腎小體由腎絲球和鮑氏囊組成。」 | **有據** | [NH1](#e-nh1) `nephron-histology`<br>[NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L15.1 | 題幹／預期答案 | - **問題：**「圖上有兩個腎元。 | **有據** | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L15.2 | 題幹／預期答案 | 哪一個的亨利氏環比較長、伸到髓質深處？請點它，並選名字。」 | **有據** | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L15.3 | 題幹／預期答案 | 〔近髓質腎元〕〔皮質腎元〕 | **有據** | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L16.1 | 敘述／提示 | - **💡提示：**「『近髓質』表示位置靠近皮質和髓質的交界。」 | **有據** | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L17.1 | 答對說明 | - **答對：**「近髓質腎元的環長、深入髓質，配合直血管幫忙濃縮尿液。」 | **有據** | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L19.1 | 確認題正解 | - A 大多數腎元是皮質腎元（正） | **有據** | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L22.1 | 答錯回饋 | - 答錯回饋：B「近髓質是指靠近交界，它的腎小體仍在皮質。」 | **有據** | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L22.2 | 答錯回饋 | C「兩種腎元的腎小體都在皮質。」 | **有據** | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L25.1 | 先認識 | - **先認識：** 刷狀緣＝細胞表面密密麻麻的小突起（微絨毛）。 | **無據** | [NH2](#e-nh2) `nephron-histology` | 卡並列刷狀緣與遠曲無明顯微絨毛，未明述刷狀緣就是細胞表面微絨毛突起的定義。 |
| L26.1 | 題幹／預期答案 | - **問題：**「哪一段小管的細胞有刷狀緣？請在圖上點出來。」 | **有據** | [NH2](#e-nh2) `nephron-histology` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L27.1 | 敘述／提示 | - **💡提示：**「遠曲小管沒有明顯的微絨毛。」 | **有據** | [NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L28.1 | 答對說明 | - **答對：**「近曲小管是有刷狀緣的立方上皮。」 | **有據** | [NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L29.1 | 答錯回饋 | - **答錯：**「遠曲小管是立方上皮，但沒有明顯的微絨毛。」 | **有據** | [NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L30.1 | 題幹／預期答案 | - **動作 ②：**「亨利氏環的薄段，細胞是什麼形狀？」〔扁平〕〔立方〕 | **有據** | [NH2](#e-nh2) `nephron-histology` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L31.1 | 答錯回饋 | - 答錯回饋：「薄段是扁平上皮。」 | **有據** | [NH2](#e-nh2) `nephron-histology` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L34.1 | 題幹／預期答案 | - **問題：**「血液從大血管一路分支進來。 | **有據** | [RB2](#e-rb2) `renal-blood-flow` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L34.2 | 題幹／預期答案 | 請依序點出接下來的四段：入球小動脈 → 腎絲球 → 出球小動脈 → 管周微血管。」 | **有據** | [RB2](#e-rb2) `renal-blood-flow` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L35.1 | 敘述／提示 | - **💡提示：**「『入』是進來，『出』是出去。」 | **有據** | [RB2](#e-rb2) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L36.1 | 答錯回饋 | - **答錯：**「腎絲球前面是入球小動脈，後面是出球小動脈。」 | **有據** | [RB2](#e-rb2) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L37.1 | 答對說明 | - **答對：**「兩套微血管依序工作：腎絲球負責過濾，管周微血管負責和小管交換。」 | **有據** | [RB2](#e-rb2) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L39.1 | 確認題正解 | - A 小動脈（正） | **有據** | [RB2](#e-rb2) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L42.1 | 答錯回饋 | - 答錯回饋：「腎絲球的前後都是小動脈。」 | **有據** | [RB2](#e-rb2) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L45.1 | 題幹／預期答案 | - **問題：**「請在圖上找出兩種『感測器』：一種感受血壓，一種感受管液裡的鈉。」 | **有據** | [JG1](#e-jg1) `juxtaglomerular-apparatus`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L46.1 | 敘述／提示 | - **動作：** 點近腎絲球細胞，出現「在入球小動脈壁上，感受壓力、分泌腎素」；點緻密斑，出現「在遠曲小管，感受管液的鈉」。 | **有據** | [JG1](#e-jg1) `juxtaglomerular-apparatus`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L47.1 | 敘述／提示 | - **💡提示：**「一個在血管壁上，一個在小管上。」 | **有據** | [JG1](#e-jg1) `juxtaglomerular-apparatus`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L48.1 | 題幹／預期答案 | - **動作 ②：**「血壓變低時，近腎絲球細胞會分泌什麼？」〔腎素〕〔ADH〕 | **有據** | [JG1](#e-jg1) `juxtaglomerular-apparatus`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L49.1 | 答錯回饋 | - 答錯回饋：「血壓低或管液鈉低時，會促進腎素分泌。」 | **有據** | [JG1](#e-jg1) `juxtaglomerular-apparatus`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L52.1 | 題幹／預期答案 | - **問題：**「一管血分成血球和血漿兩層。 | **有據** | [RB1](#e-rb1) `renal-blood-flow` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L52.2 | 題幹／預期答案 | 腎血漿流量只算哪一部分？請點它。」 | **有據** | [RB1](#e-rb1) `renal-blood-flow` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L52.3 | 題幹／預期答案 | 〔血漿〕 | **有據** | [RB1](#e-rb1) `renal-blood-flow` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L53.1 | 敘述／提示 | - **💡提示：**「看名字：血『漿』流量。」 | **有據** | [RB1](#e-rb1) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L54.1 | 答對說明 | - **答對：**「課本腎血流每分鐘約 1200 mL，約占心輸出量的四分之一；腎血漿流量只算其中的血漿部分。」 | **有據** | [RB1](#e-rb1) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L56.1 | 確認題正解 | - A 腎血流約 1200 mL/min，約占心輸出量四分之一（正） | **有據** | [RB1](#e-rb1) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L59.1 | 答錯回饋 | - 答錯回饋：B「腎血流約占四分之一。」 | **有據** | [RB1](#e-rb1) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L59.2 | 答錯回饋 | C「血漿流量只算血漿那一部分。」 | **有據** | [RB1](#e-rb1) `renal-blood-flow` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L62.1 | 題幹／預期答案 | 1. 「腎元由什麼組成？」〔腎小體＋腎小管〕〔腎盂＋輸尿管〕 | **有據** | [NH1](#e-nh1) `nephron-histology` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L63.1 | 題幹／預期答案 | 2. 「血液經過腎絲球的順序？」〔入球→腎絲球→出球〕〔出球→腎絲球→入球〕 | **有據** | [RB2](#e-rb2) `renal-blood-flow` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L64.1 | 題幹／預期答案 | 3. 「血壓變低時？」〔近腎絲球細胞分泌腎素〕〔緻密斑分泌 ADH〕 | **有據** | [JG2](#e-jg2) `juxtaglomerular-apparatus` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L66.1 | 結語 | - **結語：**「腎元由腎小體和腎小管組成；血液經入球小動脈、腎絲球、出球小動脈；近腎絲球器感受血壓與鈉，並分泌腎素。」 | **有據** | [NH1](#e-nh1) `nephron-histology`<br>[RB2](#e-rb2) `renal-blood-flow`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |

### tubular-handling

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「濾出來的液體很多，但大部分會被拿回去。 | **有據** | [TR1](#e-tr1) `tubular-reabsorption`<br>[RH2](#e-rh2) `renal-handling` | 有用物質回收、多餘物質入管液是範例概括，不作所有物質必有同一處理方式的斷言。 |
| L4.2 | 敘述／提示 | 腎小管會把有用的東西還給血液，也會把多的東西送進尿裡。 | **有據** | [TR1](#e-tr1) `tubular-reabsorption`<br>[RH2](#e-rh2) `renal-handling` | 有用物質回收、多餘物質入管液是範例概括，不作所有物質必有同一處理方式的斷言。 |
| L4.3 | 敘述／提示 | 6 關之後，你會算出尿裡最後剩多少。」 | **有據** | [TR1](#e-tr1) `tubular-reabsorption`<br>[RH2](#e-rh2) `renal-handling` | 有用物質回收、多餘物質入管液是範例概括，不作所有物質必有同一處理方式的斷言。 |
| L7.1 | 先認識 | - **先認識：** 管液＝腎小管裡的液體，之後會變成尿。 | **有據** | [UP1](#e-up1) `urine-pathway`<br>[RH2](#e-rh2) `renal-handling` | 管液為小管內液體，沿路處理後成尿。 |
| L8.1 | 題幹／預期答案 | - **問題：**「請把『過濾』『再吸收』『分泌』三個箭頭放到圖上，並指向正確方向。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L9.1 | 敘述／提示 | - **💡提示：**「『再吸收』是拿回來，回到血液。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L10.1 | 答對說明 | - **答對：**「過濾：血液→鮑氏囊；再吸收：管液→血液；分泌：血液→管液。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L12.1 | 確認題正解 | - A 血液→管液（正） | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L15.1 | 答錯回饋 | - 答錯回饋：「管液→血液是再吸收。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L18.1 | 題幹／預期答案 | - **問題：**「排泄量＝過濾量 □ 再吸收量 □ 分泌量。 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling`<br>[TR2](#e-tr2) `tubular-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L18.2 | 題幹／預期答案 | 請在兩個框裡填上＋或－。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling`<br>[TR2](#e-tr2) `tubular-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L19.1 | 敘述／提示 | - **💡提示：**「拿回去的要扣掉，額外送進來的要加上。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling`<br>[TR2](#e-tr2) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L20.1 | 答對說明 | - **答對：**「排泄量＝過濾量－再吸收量＋分泌量。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling`<br>[TR2](#e-tr2) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L22.1 | 確認題正解 | - A 幾乎沒有（正） | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling`<br>[TR2](#e-tr2) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L25.1 | 答錯回饋 | - 答錯回饋：「全部回收，尿中就幾乎沒有。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling`<br>[TR2](#e-tr2) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L28.1 | 題幹／預期答案 | - **問題：**「請把葡萄糖、胺基酸、尿素、肌酸酐，分到〔正常全部回收〕〔部分回收〕〔不回收〕。」 | **有據** | [TR1](#e-tr1) `tubular-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L29.1 | 敘述／提示 | - **💡提示：**「身體的營養會全部拿回；廢物不一定。」 | **無據** | [TR1](#e-tr1) `tubular-reabsorption` | ※ 卡只支持葡萄糖、胺基酸「正常可全回收」；「身體的營養」全部回收的普遍化沒有依據，也漏負荷條件。 |
| L30.1 | 答對說明 | - **答對：**「葡萄糖、胺基酸正常全部回收；尿素部分回收；肌酸酐不被再吸收。」 | **有據** | [TR1](#e-tr1) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L32.1 | 確認題正解 | - A 滲透作用（正） | **有據** | [TR1](#e-tr1) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L35.1 | 答錯回饋 | - 答錯回饋：「水主要依滲透作用回收。」 | **有據** | [TR1](#e-tr1) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L38.1 | 先認識 | - **先認識：** 最大轉運量＝回收葡萄糖的能力上限，課本為 375 mg/min。 | **有據** | [TR1](#e-tr1) `tubular-reabsorption`<br>[TR2](#e-tr2) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L39.1 | 敘述／提示 | - **動作 ①：** 拖動「過濾出來的葡萄糖」滑桿：沒超過 375 時全部回收；超過後，尿中出現葡萄糖。 | **有據** | [TR1](#e-tr1) `tubular-reabsorption`<br>[TR2](#e-tr2) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L40.1 | 敘述／提示 | - **💡提示：**「搬運工一次只能搬那麼多，多出來的就留下了。」 | **有據** | [TR1](#e-tr1) `tubular-reabsorption` | ※ 搬運工為有上限轉運的比喻；卡有375 mg/min，未見衝突。 |
| L41.1 | 題幹／預期答案 | - **動作 ②：**「過濾出來的葡萄糖超過 375 mg/min，會怎樣？」〔出現糖尿〕〔還是全部回收〕 | **有據** | [TR1](#e-tr1) `tubular-reabsorption`<br>[TR2](#e-tr2) `tubular-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L42.1 | 答錯回饋 | - 答錯回饋：「過濾負荷超過回收能力時，就會出現糖尿。」 | **有據** | [TR1](#e-tr1) `tubular-reabsorption`<br>[TR2](#e-tr2) `tubular-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L45.1 | 題幹／預期答案 | - **問題：**「血鉀太高時，腎臟在哪兩段把 K⁺ 送進尿裡？請在圖上點出來。」 | **有據** | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L45.2 | 題幹／預期答案 | 〔遠曲小管〕〔集尿管〕 | **有據** | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L46.1 | 敘述／提示 | - **💡提示：**「是後段，不是一開始的近曲小管。」 | **有據** | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L47.1 | 題幹／預期答案 | - **動作 ②：**「醛固酮會讓 K⁺ 的分泌？」〔增加〕〔減少〕 | **有據** | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L48.1 | 答錯回饋 | - 答錯回饋：「醛固酮促進遠端鈉再吸收，同時增加鉀分泌。」 | **有據** | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L50.1 | 確認題正解 | - A 後段的分泌調整（正） | **有據** | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L52.1 | 答錯回饋 | - 答錯回饋：「前段大量回收鉀，最後的尿鉀仍受後段分泌調整。」 | **有據** | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L55.1 | 題幹／預期答案 | - **問題：**「某物質在尿中的濃度比血漿高，表示它一定被分泌嗎？」〔不一定〕〔一定〕 | **有據** | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L56.1 | 敘述／提示 | - **💡提示：**「如果水被拿回去很多，剩下的尿會變怎樣？」 | **有據** | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L57.1 | 答錯回饋 | - **答錯：**「水被回收也會讓尿變濃，濃度高不一定是分泌。」 | **有據** | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L59.1 | 確認題正解 | - A 清除率（正） | **有據** | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L62.1 | 答錯回饋 | - 答錯回饋：「清除率和 GFR 都用 mL/min，才能比較；排泄量是物質量／時間。」 | **有據** | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L65.1 | 題幹／預期答案 | 1. 「再吸收的方向？」〔管液→血液〕〔血液→管液〕 | **有據** | [RH2](#e-rh2) `renal-handling` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L66.1 | 題幹／預期答案 | 2. 「排泄量＝？」〔過濾－再吸收＋分泌〕〔過濾＋再吸收－分泌〕 | **有據** | [RH1](#e-rh1) `renal-handling` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L67.1 | 題幹／預期答案 | 3. 「出現糖尿是因為？」〔超過最大轉運量〕〔腎臟分泌葡萄糖〕 | **有據** | [TR1](#e-tr1) `tubular-reabsorption`<br>[TR2](#e-tr2) `tubular-reabsorption` | 承本份N04的正常轉運滑桿案例時，超過375造成糖尿有據；若題目獨立使用則須加模型前提，卡另列攜帶體異常，不可說是唯一病因。 |
| L69.1 | 結語 | - **結語：**「腎小管把有用的東西拿回血液、把多的送進尿；尿裡剩多少，要把過濾、再吸收、分泌三者一起算。」 | **有據** | [RH1](#e-rh1) `renal-handling`<br>[RH2](#e-rh2) `renal-handling` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |

### urinary-route-micturition

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「尿在腎臟做好以後，要經過哪些管子、存在哪裡、又怎麼排出來？6 關之後你就知道。」 | **有據** | [UP1](#e-up1) `urine-pathway`<br>[US1](#e-us1) `urinary-system-overview` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L7.1 | 題幹／預期答案 | - **問題：**「尿從腎盂到膀胱，輸尿管靠什麼把尿往下送？」〔蠕動〕〔只靠重力〕 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L8.1 | 敘述／提示 | - **💡提示：**「輸尿管的管壁會一段一段地收縮。」 | **有據** | [UT2](#e-ut2) `ureter-constrictions` | 蠕動為管壁波動收縮的白話機轉釋義。 |
| L9.1 | 答錯回饋 | - **答錯：**「輸尿管以蠕動送尿。」 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L10.1 | 題幹／預期答案 | - **動作 ②：**「輸尿管斜斜地穿進膀胱壁，有什麼好處？」〔防止尿逆流〕〔讓尿流更快〕 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L11.1 | 答錯回饋 | - 答錯回饋：「斜行穿入膀胱壁的構造有助於防止逆流。」 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L14.1 | 題幹／預期答案 | - **問題：**「輸尿管有三個比較窄的地方。 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions`<br>[UR1](#e-ur1) `urethra` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L14.2 | 題幹／預期答案 | 請在圖上點出來。」 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions`<br>[UR1](#e-ur1) `urethra` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L15.1 | 敘述／提示 | - **💡提示：**「起點一個、中間跨過血管一個、終點一個。」 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions`<br>[UR1](#e-ur1) `urethra` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L16.1 | 答對說明 | - **答對：**「三處分別在：腎盂交接處、和髂外動脈及靜脈交叉處、進入膀胱處。」 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions`<br>[UR1](#e-ur1) `urethra` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L18.1 | 確認題正解 | - A 25–30 cm（正） | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions`<br>[UR1](#e-ur1) `urethra` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L21.1 | 答錯回饋 | - 答錯回饋：B「3.8 cm 是女性尿道。」 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions`<br>[UR1](#e-ur1) `urethra` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L21.2 | 答錯回饋 | C「20 cm 是男性尿道。」 | **有據** | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions`<br>[UR1](#e-ur1) `urethra` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L24.1 | 題幹／預期答案 | - **問題：**「膀胱三角由哪三個開口圍成？請在圖上點出來。」 | **有據** | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L25.1 | 敘述／提示 | - **動作：** 點兩個輸尿管口，再點尿道內口。 | **有據** | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L26.1 | 敘述／提示 | - **💡提示：**「兩個開口進來、一個開口出去。」 | **有據** | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L27.1 | 題幹／預期答案 | - **動作 ②：**「膀胱壁負責把尿擠出去的肌肉叫？」〔逼尿肌〕〔外括約肌〕 | **有據** | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L29.1 | 確認題正解 | - A 外尿道括約肌（正） | **有據** | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L32.1 | 答錯回饋 | - 答錯回饋：「逼尿肌和內括約肌都是平滑肌；外括約肌是骨骼肌。」 | **有據** | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L35.1 | 題幹／預期答案 | - **問題：**「請把 3.8 cm 和 20 cm 分別放到女性尿道、男性尿道。」 | **有據** | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L36.1 | 敘述／提示 | - **💡提示：**「男性尿道要穿過陰莖，比較長。」 | **有據** | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | 依陰莖部構成與男女長度作解剖釋義。 |
| L37.1 | 題幹／預期答案 | - **動作 ②：**「請從膀胱往外，依序點出男性尿道三段：前列腺部 → 膜部 → 陰莖部。」 | **有據** | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L39.1 | 確認題正解 | - A 陰部神經（正） | **有據** | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L42.1 | 答錯回饋 | - 答錯回饋：「外括約肌屬骨骼肌，由陰部神經控制。」 | **有據** | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L45.1 | 敘述／提示 | - **動作 ①：** 拖動膀胱尿量滑桿。 | **有據** | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L45.2 | 敘述／提示 | 超過約 300 mL 時，畫面出現「想尿尿了」。 | **有據** | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L46.1 | 題幹／預期答案 | - **問題：**「要排尿時，逼尿肌和內括約肌各會怎樣？」 | **有據** | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L47.1 | 敘述／提示 | - 逼尿肌〔收縮〕〔放鬆〕 | **有據** | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L48.1 | 敘述／提示 | - 內括約肌〔放鬆〕〔收縮〕 | **有據** | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L49.1 | 敘述／提示 | - **💡提示：**「要把尿擠出去：袋子要擠緊，出口要打開。」 | **有據** | [UB2](#e-ub2) `urinary-bladder`<br>[MR1](#e-mr1) `micturition-reflex` | ※ 袋子擠、出口開對應逼尿肌收縮／內括約肌鬆弛，未見衝突；外括約肌另行控制。 |
| L50.1 | 答對說明 | - **答對：**「排尿反射讓逼尿肌收縮、內括約肌鬆弛。」 | **有據** | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L52.1 | 確認題正解 | - A 骨盆副交感神經（S2–S4）（正） | **有據** | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L55.1 | 答錯回饋 | - 答錯回饋：「儲尿時交感神經造成相反的反應；陰部神經控制外括約肌。」 | **有據** | [MR1](#e-mr1) `micturition-reflex`<br>[UB2](#e-ub2) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L58.1 | 題幹／預期答案 | - **問題：**「健康成人一天大約尿多少？尿裡大部分是什麼？」 | **有據** | [PH1](#e-ph1) `urine-physical-properties`<br>[PH2](#e-ph2) `urine-physical-properties` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L61.1 | 敘述／提示 | - **💡提示：**「尿裡幾乎都是水。」 | **有據** | [PH1](#e-ph1) `urine-physical-properties`<br>[PH2](#e-ph2) `urine-physical-properties` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L63.1 | 確認題正解 | - A 稻草色、透明（正） | **有據** | [PH1](#e-ph1) `urine-physical-properties`<br>[PH2](#e-ph2) `urine-physical-properties` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L66.1 | 答錯回饋 | - 答錯回饋：「剛排出時是透明的，放久了可能因細菌作用變混濁。」 | **有據** | [PH1](#e-ph1) `urine-physical-properties`<br>[PH2](#e-ph2) `urine-physical-properties` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L69.1 | 題幹／預期答案 | 1. 「尿的路線？」〔腎盂→輸尿管→膀胱→尿道〕〔腎盂→尿道→膀胱→輸尿管〕 | **有據** | [UP1](#e-up1) `urine-pathway` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L70.1 | 題幹／預期答案 | 2. 「排尿時？」〔逼尿肌收縮、內括約肌放鬆〕〔逼尿肌放鬆、內括約肌收縮〕 | **有據** | [UB2](#e-ub2) `urinary-bladder`<br>[MR1](#e-mr1) `micturition-reflex` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L71.1 | 題幹／預期答案 | 3. 「可以自己控制的是？」〔外括約肌〕〔逼尿肌〕 | **有據** | [UB3](#e-ub3) `urinary-bladder`<br>[UR2](#e-ur2) `urethra` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L73.1 | 結語 | - **結語：**「輸尿管蠕動把尿送到膀胱；膀胱滿了引起排尿反射，逼尿肌收縮、內括約肌放鬆；外括約肌可以由我們自己控制。」 | **有據** | [UT2](#e-ut2) `ureter-constrictions`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |

### urine-concentration

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「天氣熱、喝水少時，尿會變黃又少；喝很多水時，尿又多又淡。 | **無據** | [UC3](#e-uc3) `urine-concentration`<br>[PH2](#e-ph2) `urine-physical-properties` | ※ 缺水保水、尿色隨濃度有據；天熱必變黃、喝很多水必多且淡的整組生活情境未見直接卡句，勿當無條件規律。 |
| L4.2 | 敘述／提示 | ※ 腎臟怎麼做到的？6 關之後你就知道。」 | **無據** | [UC3](#e-uc3) `urine-concentration`<br>[PH2](#e-ph2) `urine-physical-properties` | ※ 缺水保水、尿色隨濃度有據；天熱必變黃、喝很多水必多且淡的整組生活情境未見直接卡句，勿當無條件規律。 |
| L7.1 | 先認識 | - **先認識：** 滲透＝水會往溶質（鹽、尿素等）比較多的地方移動。 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[CC3](#e-cc3) `countercurrent-mechanism` | ※ 為水移向較多溶質及髓質深部高滲透的簡化，未見相反敘述；未代表所有溶質、所有膜均有效。 |
| L7.2 | 先認識 | 髓質梯度＝腎髓質越深越濃。 | **有據** | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[CC3](#e-cc3) `countercurrent-mechanism` | ※ 為水移向較多溶質及髓質深部高滲透的簡化，未見相反敘述；未代表所有溶質、所有膜均有效。 |
| L8.1 | 題幹／預期答案 | - **問題：**「要做出很濃的尿，需要哪兩個條件同時成立？請從四張卡選兩張。」 | **有據** | [UC1](#e-uc1) `urine-concentration`<br>[UC2](#e-uc2) `urine-concentration`<br>[AD2](#e-ad2) `adh-water-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L13.1 | 敘述／提示 | - **💡提示：**「水要被『吸』出去：外面要夠濃，管壁也要讓水過。」 | **有據** | [UC1](#e-uc1) `urine-concentration`<br>[UC2](#e-uc2) `urine-concentration`<br>[AD2](#e-ad2) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L14.1 | 答對說明 | - **答對：**「濃縮需要髓質的高滲透梯度，加上集尿管可以調節水的通透性；ADH 增加水回收，形成濃尿。」 | **有據** | [UC1](#e-uc1) `urine-concentration`<br>[UC2](#e-uc2) `urine-concentration`<br>[AD2](#e-ad2) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L16.1 | 確認題正解 | - A 1200 mOsm/L，約血漿的四倍（正） | **有據** | [UC1](#e-uc1) `urine-concentration`<br>[UC2](#e-uc2) `urine-concentration`<br>[AD2](#e-ad2) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L19.1 | 答錯回饋 | - 答錯回饋：「課本：濃尿可達 1200 mOsm/L，約為血漿的四倍。」 | **有據** | [UC1](#e-uc1) `urine-concentration`<br>[UC2](#e-uc2) `urine-concentration`<br>[AD2](#e-ad2) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L22.1 | 題幹／預期答案 | - **問題：**「亨利氏環的下降枝會讓水通過。 | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L22.2 | 題幹／預期答案 | 管液往下流時，會變濃還是變稀？」 | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L23.1 | 敘述／提示 | - **動作 ①：** 點下降枝，水的箭頭往外移出。 | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L24.1 | 題幹／預期答案 | - **動作 ②：**〔變濃〕〔變稀〕 | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L25.1 | 敘述／提示 | - **💡提示：**「水走了，剩下的東西是變多還是變少？」 | **無據** | [CC2](#e-cc2) `countercurrent-mechanism` | 水移出使「濃度」增加有據，但剩下溶質的絕對量不會因此增加；「東西變多或少」混淆量與濃度。 |
| L26.1 | 答錯回饋 | - **答錯：**「下降枝讓水出去，管液變濃。」 | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L28.1 | 確認題正解 | - A 水（正） | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | A水有據；但題幹僅「可以通過」而B是NaCl，卡只說溶質通透差，不能確證B完全不能通過；確認題唯一性列疑點。 |
| L31.1 | 答錯回饋 | - 答錯回饋：「下降枝通水，但對溶質的通透性差。」 | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L34.1 | 題幹／預期答案 | - **問題：**「上升枝不讓水通過，但會把鹽（NaCl）送出去。 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L34.2 | 題幹／預期答案 | 管液會變稀還是變濃？」 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L35.1 | 敘述／提示 | - **動作 ①：** 點上升枝，鹽的箭頭往外移出。 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L36.1 | 題幹／預期答案 | - **動作 ②：**〔變稀〕〔變濃〕 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L37.1 | 敘述／提示 | - **💡提示：**「鹽走了，水留下來。」 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L38.1 | 答對說明 | - **補充（答對後顯示）：**「上升枝一次帶走一個 Na⁺、一個 K⁺、兩個 Cl⁻。」 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L40.1 | 確認題正解 | - A 讓髓質維持很濃（正） | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L43.1 | 答錯回饋 | - 答錯回饋：「亨利氏環的逆流增強作用，負責維持髓質的高張環境。」 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L46.1 | 題幹／預期答案 | - **問題：**「直血管彎成 U 形，而且血流得很慢。 | **無據** | [CC2](#e-cc2) `countercurrent-mechanism` | 緩慢逆流交換減少流失有據；卡文未寫U形幾何與其直接因果，不可只憑未審圖補足。 |
| L46.2 | 題幹／預期答案 | 這樣有什麼好處？」〔減少髓質的溶質被血液帶走〕〔把尿運出去〕 | **無據** | [CC2](#e-cc2) `countercurrent-mechanism` | 緩慢逆流交換減少流失有據；卡文未寫U形幾何與其直接因果，不可只憑未審圖補足。 |
| L47.1 | 敘述／提示 | - **💡提示：**「如果血液又快又直地穿過去，髓質的鹽會怎樣？」※ | **無據** | [CC2](#e-cc2) `countercurrent-mechanism` | ※ 逆流緩慢有據，快速且直穿的反事實幾何情境卡未明述；未見直接衝突。 |
| L48.1 | 答錯回饋 | - **答錯：**「直血管緩慢地逆流交換，可以減少髓質溶質流失。」 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L50.1 | 確認題正解 | - A 逆流交換（正） | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L53.1 | 答錯回饋 | - 答錯回饋：「逆流增強是亨利氏環；直血管負責逆流交換。」 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L56.1 | 題幹／預期答案 | - **問題：**「身體缺水時會釋放 ADH。 | **有據** | [AD1](#e-ad1) `adh-water-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L56.2 | 題幹／預期答案 | 請打開 ADH 開關，看看集尿管多了什麼？」〔水通道〕〔鈉通道〕 | **有據** | [AD1](#e-ad1) `adh-water-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L57.1 | 敘述／提示 | - **💡提示：**「ADH 叫『抗利尿』激素，作用是讓尿變少、水留在身體。」 | **有據** | [AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L58.1 | 答對說明 | - **答對：**「ADH 增加水通道，水沿髓質梯度被回收，形成濃尿。」 | **有據** | [AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L60.1 | 確認題正解 | - A 腦下垂體後葉（正） | **有據** | [AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L63.1 | 答錯回饋 | - 答錯回饋：「水不足時，由腦下垂體後葉釋放 ADH。」 | **有據** | [AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L66.1 | 題幹／預期答案 | - **問題：**「請把『濃尿』『稀尿』分到〔有 ADH〕和〔沒有 ADH〕。」 | **有據** | [UC1](#e-uc1) `urine-concentration`<br>[UC3](#e-uc3) `urine-concentration` | 必須承接N01的高張髓質條件；有ADH不能獨立保證濃尿，應在實作保留該前提。 |
| L67.1 | 敘述／提示 | - **💡提示：**「有 ADH，水被拿回去。」 | **有據** | [UC1](#e-uc1) `urine-concentration`<br>[UC3](#e-uc3) `urine-concentration`<br>[AD3](#e-ad3) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L69.1 | 確認題正解 | - A ADH 直接讓水通過；醛固酮主要是回收鈉（正） | **有據** | [AD3](#e-ad3) `adh-water-reabsorption`<br>[SW2](#e-sw2) `sodium-water-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L72.1 | 答錯回饋 | - 答錯回饋：「ADH 直接調整水的通透性；醛固酮主要促進鈉再吸收。」 | **有據** | [AD3](#e-ad3) `adh-water-reabsorption`<br>[SW2](#e-sw2) `sodium-water-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L75.1 | 題幹／預期答案 | 1. 「下降枝？」〔水出去、管液變濃〕〔鹽出去、管液變稀〕 | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L76.1 | 題幹／預期答案 | 2. 「上升枝？」〔鹽出去、管液變稀〕〔水出去、管液變濃〕 | **有據** | [CC2](#e-cc2) `countercurrent-mechanism` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L77.1 | 題幹／預期答案 | 3. 「有 ADH 時？」〔集尿管回收水、形成濃尿〕〔水排出、形成稀尿〕 | **有據** | [UC1](#e-uc1) `urine-concentration`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L79.1 | 結語 | - **結語：**「亨利氏環讓髓質變濃，直血管保住這個梯度，ADH 打開集尿管的水通道，水被吸回，尿就變濃。」 | **有據** | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |

### water-sodium-regulation

| 原行／句序 | 種類 | 腳本原文 | 判定 | uid與原句索引 | 說明 |
|---|---|---|---|---|---|
| L4.1 | 敘述／提示 | 「身體每天都在喝水、也在流失水。 | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[SW3](#e-sw3) `sodium-water-balance`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[AN2](#e-an2) `anp-volume-feedback` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L4.2 | 敘述／提示 | 缺水或血壓變低時，身體怎麼把水和鈉留住？太多時又怎麼排掉？6 關之後你就知道。」 | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[SW3](#e-sw3) `sodium-water-balance`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[AN2](#e-an2) `anp-volume-feedback` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L7.1 | 題幹／預期答案 | - **問題：**「請從六張卡中，選出水『進入』身體的三個來源。」 | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L9.1 | 先認識 | - **先認識：** 代謝水＝身體分解養分時自己產生的水。 | **無據** | [WI1](#e-wi1) `water-intake-output`<br>[WI4](#e-wi4) `water-intake-output` | ※ 卡有「自己產生」與代謝水200mL，但未寫分解養分的生成機轉；此新增機轉非相反、待教師認可。 |
| L10.1 | 敘述／提示 | - **💡提示：**「選『進來』的，不要選『出去』的。」 | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L12.1 | 確認題正解 | - A 約 2500 mL（正） | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L15.1 | 答錯回饋 | - 答錯回饋：「課本平均每日總攝取約 2500 mL。」 | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L18.1 | 題幹／預期答案 | - **問題：**「請把四條排出途徑，放到圖上對應的器官：尿液→腎、呼氣→肺、蒸散與流汗→皮膚、糞便→腸。」 | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output`<br>[WI3](#e-wi3) `water-intake-output` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L19.1 | 先認識 | - **先認識：** 無知覺蒸散＝在不知不覺中，從皮膚和呼吸流失的水。 | **無據** | [WI2](#e-wi2) `water-intake-output`<br>[WI3](#e-wi3) `water-intake-output` | ※ 卡將無知覺蒸散明列皮膚，肺呼氣另列；把名詞範圍擴大為皮膚＋呼吸在指定卡找不到，非據此斷定生理上錯。 |
| L20.1 | 敘述／提示 | - **💡提示：**「呼氣也會帶走水氣，冬天對著窗戶哈氣就看得到。」 | **無據** | [WI2](#e-wi2) `water-intake-output` | ※ 呼氣失水有據；冬天向窗哈氣的生活示例未載，未見與卡衝突。 |
| L22.1 | 確認題正解 | - A 維持平衡（正） | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output`<br>[WI3](#e-wi3) `water-intake-output` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L25.1 | 答錯回饋 | - 答錯回饋：「正常時，液體的攝取和排出維持平衡。」 | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output`<br>[WI3](#e-wi3) `water-intake-output` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L28.1 | 題幹／預期答案 | - **問題：**「身體缺水時，有兩個方法補救。 | **有據** | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L28.2 | 題幹／預期答案 | 請選出這兩個。」 | **有據** | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L28.3 | 題幹／預期答案 | 〔口渴，多喝水〕〔ADH，讓腎多保留水〕〔多流汗〕 | **有據** | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L29.1 | 敘述／提示 | - **💡提示：**「一個是讓水『多進來』，一個是讓水『少出去』。」 | **有據** | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L30.1 | 答對說明 | - **答對：**「口渴增加攝取，ADH 增加保水，兩者互相配合。」 | **有據** | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L32.1 | 確認題正解 | - A 不是（正） | **有據** | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L34.1 | 答錯回饋 | - 答錯回饋：「鈉的總量和鈉的濃度要分開看，不能當成同一件事。」 | **有據** | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L37.1 | 題幹／預期答案 | - **問題：**「血壓下降時，腎臟會啟動一連串反應。 | **有據** | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L37.2 | 題幹／預期答案 | 第一步，是哪個細胞釋放什麼？請在圖上點出來。」 | **有據** | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L38.1 | 敘述／提示 | - **動作 ①：** 點近腎絲球細胞，出現〔腎素〕。 | **有據** | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L39.1 | 敘述／提示 | - **💡提示：**「上一份教材（腎元）講過：入球小動脈壁上的細胞。」 | **有據** | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L40.1 | 題幹／預期答案 | - **動作 ②：**「這一串反應最後讓身體？」〔血管收縮、留住鈉和水，血壓回升〕〔血管放鬆、排掉鈉和水〕 | **有據** | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L41.1 | 答錯回饋 | - 答錯回饋：「失血、脫水讓血壓下降時，這條鏈讓血管收縮、留住鈉和水，把血壓撐回來。」 | **有據** | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L44.1 | 題幹／預期答案 | - **問題：**「請把兩個激素配到它的做法。」 | **有據** | [SW2](#e-sw2) `sodium-water-balance`<br>[K2](#e-k2) `potassium-secretion` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L45.1 | 敘述／提示 | - 醛固酮 →「讓腎多回收鈉，水跟著滲透回收」 | **有據** | [SW2](#e-sw2) `sodium-water-balance`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L46.1 | 敘述／提示 | - ADH →「直接讓集尿管讓水通過」 | **有據** | [SW2](#e-sw2) `sodium-water-balance`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L47.1 | 敘述／提示 | - **💡提示：**「名字裡有『抗利尿』的，是直接管水。」 | **有據** | [SW2](#e-sw2) `sodium-water-balance`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L49.1 | 確認題正解 | - A 分泌增加（正） | **有據** | [SW2](#e-sw2) `sodium-water-balance`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L52.1 | 答錯回饋 | - 答錯回饋：「醛固酮促進遠端鈉再吸收，同時增加鉀分泌。」 | **有據** | [SW2](#e-sw2) `sodium-water-balance`<br>[K2](#e-k2) `potassium-secretion` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L55.1 | 先認識 | - **先認識：** ANP（心房利鈉尿肽）＝心房分泌的激素，會讓鈉排出。 | **有據** | [AN1](#e-an1) `anp-volume-feedback`<br>[AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L56.1 | 敘述／提示 | - **動作 ①：** 打開 ANP 開關，觀察腎臟的變化。 | **有據** | [AN1](#e-an1) `anp-volume-feedback`<br>[AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L57.1 | 題幹／預期答案 | - **問題：**「ANP 作用後，身體會？」〔排出更多鈉，體液量減少〕〔留住更多鈉〕 | **有據** | [AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 體液量下降依完整ANP抑制ADH路徑補據；不能把排鈉與排水當同一直接作用。 |
| L58.1 | 敘述／提示 | - **💡提示：**「看名字：『利鈉尿』。」 | **有據** | [AN1](#e-an1) `anp-volume-feedback`<br>[AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L59.1 | 答對說明 | - **答對：**「ANP 增加腎絲球過濾，並促進鈉排泄。」 | **有據** | [AN1](#e-an1) `anp-volume-feedback`<br>[AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L60.1 | 題幹／預期答案 | - **動作 ②：**「誰主要管體液的『量』，誰主要管『濃度』？」把醛固酮、ADH 放到〔鈉含量與體液容積〕〔水與體液濃度〕。 | **有據** | [AN1](#e-an1) `anp-volume-feedback`<br>[AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L61.1 | 答錯回饋 | - 答錯回饋：「課本區分：醛固酮調節鈉含量與體液容積，ADH 調節水與體液濃度。」 | **有據** | [AN1](#e-an1) `anp-volume-feedback`<br>[AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |
| L64.1 | 題幹／預期答案 | 1. 「缺水時？」〔口渴＋ADH 保水〕〔多排尿〕 | **有據** | [SW3](#e-sw3) `sodium-water-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L65.1 | 題幹／預期答案 | 2. 「血壓變低時？」〔腎素啟動 RAAS，留鈉留水〕〔ANP 排鈉〕 | **有據** | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L66.1 | 題幹／預期答案 | 3. 「醛固酮主要管？」〔鈉與體液容積〕〔體液濃度〕 | **有據** | [SW1](#e-sw1) `sodium-water-balance` | 按題意核對預期正解；列出的錯項不是作者事實主張。 |
| L68.1 | 結語 | - **結語：**「水的進出要平衡；缺水靠口渴和 ADH，血壓低靠 RAAS 留住鈉和水，太多時 ANP 幫忙排鈉。」 | **有據** | [WI1](#e-wi1) `water-intake-output`<br>[SW3](#e-sw3) `sodium-water-balance`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[AN2](#e-an2) `anp-volume-feedback` | 與所列卡片內容相符；名詞白話釋義或直接機轉推論另依上下文理解。 |

## 來源片段目錄（均為卡內逐字，不是回譯）

以下片段直接從卡片核對存在並記錄行號；Markdown粗體照卡保留。每列uid指向已讀取的實體卡，reviewed與進度雙重檢查均通過。

| 索引 | 卡uid及實際行 | 卡內逐字原句片段 |
|---|---|---|
| <a id="e-kp1"></a>KP1 | [kidney-position](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-position.md:43>) L43 | 腎臟位於後腹腔、脊柱兩側，課本大致介於 T12 至 L3；右腎較左腎低。 |
| <a id="e-kp2"></a>KP2 | [kidney-position](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-position.md:51>) L51 | 肝臟相關位置使右側腎臟較低。 |
| <a id="e-kp3"></a>KP3 | [kidney-position](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-position.md:47>) L47 | 內側凹入處為腎門。 |
| <a id="e-ks1"></a>KS1 | [kidney-structure](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-structure.md:61>) L61 | 腎臟切面外為皮質、內為髓質；腎盂位於靠近腎門的收集部，接輸尿管。皮質伸入腎錐體間的部分稱腎柱。 |
| <a id="e-ks2"></a>KS2 | [kidney-structure](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-structure.md:65>) L65 | 皮質含腎絲球與曲小管；髓質由8–18個腎錐體組成，尖端為腎乳頭。集尿管開口於乳頭，尿經小腎盞、大腎盞至腎盂。外圍包覆依次腎被膜、脂肪囊、腎筋膜。 |
| <a id="e-up1"></a>UP1 | [urine-pathway](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-pathway.md:61>) L61 | 尿液由腎元管液經集尿管進入腎乳頭，再循腎盞、腎盂、輸尿管、膀胱與尿道排出。 |
| <a id="e-up2"></a>UP2 | [urine-pathway](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-pathway.md:65>) L65 | 乳頭開口入小腎盞，小腎盞合入大腎盞，再匯入腎盂。 |
| <a id="e-us1"></a>US1 | [urinary-system-overview](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-system-overview.md:67>) L67 | 泌尿系統含腎、輸尿管、膀胱與尿道；腎形成尿液，其餘構造運送、儲存或排出尿液。 |
| <a id="e-us2"></a>US2 | [urinary-system-overview](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-system-overview.md:71>) L71 | 排出尿素、尿酸與肌酸酐等廢物；並具腎素、紅血球生成素與活化維生素 D 的內分泌作用。 |
| <a id="e-ke1"></a>KE1 | [kidney-endocrine](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-endocrine.md:58>) L58 | 腎素促 RAAS 連鎖調節血壓與醛固酮；紅血球生成素促進紅血球生成；腎將維生素 D₃ 轉為具活性的形式，參與鈣調節。 |
| <a id="e-nh1"></a>NH1 | [nephron-histology](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-histology.md:55>) L55 | 腎元由腎小體與腎小管構成；管段的上皮差異配合不同再吸收與分泌功能。 |
| <a id="e-nh2"></a>NH2 | [nephron-histology](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-histology.md:59>) L59 | 近曲小管為有刷狀緣的立方上皮；遠曲小管立方上皮但無明顯微絨毛。亨利氏環薄段為扁平上皮，較厚管段可見立方或低柱狀上皮。腎小體包括腎絲球與鮑氏囊，足細胞形成過濾屏障的一部分。 |
| <a id="e-nt1"></a>NT1 | [nephron-types](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-types.md:50>) L50 | 腎元分皮質腎元與近髓質腎元；皮質腎元佔大多數，近髓質腎元位置靠皮質與髓質交界。 |
| <a id="e-nt2"></a>NT2 | [nephron-types](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-types.md:54>) L54 | 皮質腎元的亨利氏環較短；近髓質腎元的環深入髓質、較長，並配合直血管參與逆流濃縮。兩型腎小體均位於皮質，差異是靠近交界程度及環的走向。 |
| <a id="e-rb1"></a>RB1 | [renal-blood-flow](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-blood-flow.md:50>) L50 | 課本腎血流約 1200 mL/min、約心輸出量四分之一；腎血漿流量只計血流中的血漿部分。 |
| <a id="e-rb2"></a>RB2 | [renal-blood-flow](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-blood-flow.md:54>) L54 | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。腎絲球前後為小動脈，兩套微血管依序負責過濾與小管交換。 |
| <a id="e-jg1"></a>JG1 | [juxtaglomerular-apparatus](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/juxtaglomerular-apparatus.md:51>) L51 | 近腎絲球器包含入球小動脈的近腎絲球細胞、遠曲小管緻密斑及位於其間的 Lacis 細胞。 |
| <a id="e-jg2"></a>JG2 | [juxtaglomerular-apparatus](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/juxtaglomerular-apparatus.md:55>) L55 | 近腎絲球細胞為入球小動脈壁特化平滑肌細胞，感受壓力並分泌腎素；緻密斑感受管液鈉變化。低壓或低管液鈉可促進腎素，連動血管張力與醛固酮調節。 |
| <a id="e-gf1"></a>GF1 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:58>) L58 | 腎絲球過濾是血液中的水與可通過的溶質經過濾膜進入鮑氏囊；正常濾液不含血球及白蛋白。 |
| <a id="e-gf2"></a>GF2 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:62>) L62 | 過濾膜依序含微血管內皮、基底膜、鮑氏囊臟層足細胞。小孔與裂隙限制大小；解剖課本也記載帶電分子的通過差異。葡萄糖、胺基酸及小分子溶質可過濾。 |
| <a id="e-gf3"></a>GF3 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:66>) L66 | 形成濾液的位置是皮質的腎小體，不是輸尿管或腎盂。 |
| <a id="e-gf4"></a>GF4 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:70>) L70 | 鮑氏囊壁層不構成三層過濾膜 |
| <a id="e-gf5"></a>GF5 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:71>) L71 | 血漿與濾液主要差異為蛋白質 |
| <a id="e-gf6"></a>GF6 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:76>) L76 | 血漿本來就不包含血球，故比較「血漿與濾液」不能拿血球當主要成分差別。 |
| <a id="e-gf7"></a>GF7 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:72>) L72 | 靜水壓促進過濾，囊內壓與血漿膠體壓對抗 |
| <a id="e-gr1"></a>GR1 | [gfr-regulation](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/gfr-regulation.md:55>) L55 | 有效過濾壓＝腎絲球靜水壓＋鮑氏囊膠體滲透壓－鮑氏囊靜水壓－血漿膠體滲透壓。 |
| <a id="e-gr2"></a>GR2 | [gfr-regulation](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/gfr-regulation.md:51>) L51 | 腎絲球過濾率 GFR 是每分鐘形成的濾液體積 |
| <a id="e-rc1"></a>RC1 | [renal-clearance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-clearance.md:56>) L56 | 血漿清除率 C＝U×V/P，代表每分鐘排除某物質所相當的血漿體積；U 為尿濃度，V 為每分鐘尿量，P 為血漿濃度。 |
| <a id="e-rc2"></a>RC2 | [renal-clearance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-clearance.md:60>) L60 | 菊糖可自由過濾、不再吸收也不分泌，清除率等於 GFR。肌酸酐不再吸收但有少量分泌，可估 GFR；PAH 兼具過濾與分泌，可估腎血漿流量。葡萄糖正常全回收，尿素部分回收。 |
| <a id="e-rh1"></a>RH1 | [renal-handling](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-handling.md:55>) L55 | 腎臟處理物質包括腎絲球過濾、腎小管再吸收與分泌；排泄量＝過濾量－再吸收量＋分泌量。 |
| <a id="e-rh2"></a>RH2 | [renal-handling](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-handling.md:59>) L59 | 過濾把物質由血移入囊；再吸收把管液中物質送回血；分泌把血中物質送入管液。菊糖只過濾，葡萄糖正常全回收，肌酸酐有少量分泌，PAH 過濾加分泌。 |
| <a id="e-rh3"></a>RH3 | [renal-handling](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-handling.md:72>) L72 | 尿中濃度較高不等於一定分泌，水回收也會濃縮；物質排泄量不能直接與體積流率 GFR 比大小。 |
| <a id="e-rh4"></a>RH4 | [renal-handling](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-handling.md:68>) L68 | 比較清除率與 GFR 才能都用 mL/min |
| <a id="e-tr1"></a>TR1 | [tubular-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/tubular-reabsorption.md:70>) L70 | 近曲小管以 Na⁺共同運輸回收葡萄糖與胺基酸，正常可全回收；葡萄糖最大轉運量為 375 mg/min，過濾負荷超過能力即出現糖尿。水主要依滲透作用回收。肌酸酐不被再吸收，尿素部分回收。 |
| <a id="e-tr2"></a>TR2 | [tubular-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/tubular-reabsorption.md:74>) L74 | 正常尿中葡萄糖很少，使尿液／血漿濃度比很小；糖出現在尿裡也可能是攜帶體功能異常，不能只歸因血糖過高。 |
| <a id="e-k1"></a>K1 | [potassium-secretion](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/potassium-secretion.md:48>) L48 | 腎臟可藉遠曲小管與集尿管分泌 K⁺調節鉀排泄；醛固酮與血鉀升高可促進此作用。 |
| <a id="e-k2"></a>K2 | [potassium-secretion](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/potassium-secretion.md:52>) L52 | 醛固酮促進遠端鈉再吸收，同時增加鉀分泌。鉀在前段有大量再吸收，最終尿鉀仍受後段分泌調整，因此不能只由初次過濾量推算。 |
| <a id="e-uc1"></a>UC1 | [urine-concentration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-concentration.md:53>) L53 | 尿液濃縮需髓質高滲透梯度與集尿管可調節水通透性配合，ADH 增加水回收形成濃尿。 |
| <a id="e-uc2"></a>UC2 | [urine-concentration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-concentration.md:57>) L57 | 亨利氏環上升枝回收鹽而不透水，下降枝可通水；直血管減少梯度流失，尿素再循環補充髓質溶質。ADH 作用時集尿管水移出，尿液可達課本 1200 mOsm/L。 |
| <a id="e-uc3"></a>UC3 | [urine-concentration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-concentration.md:61>) L61 | 水攝取不足時 ADH 保水；即使可形成高張髓質，若末端不通水，也不能同樣濃縮。 |
| <a id="e-cc1"></a>CC1 | [countercurrent-mechanism](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/countercurrent-mechanism.md:56>) L56 | 尿液濃縮中的逆流機制由亨利氏環的逆流增強裝置與直血管的逆流交換裝置配合，維持髓質高張環境。 |
| <a id="e-cc2"></a>CC2 | [countercurrent-mechanism](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/countercurrent-mechanism.md:60>) L60 | 下降枝對水通透、對溶質通透差，水移出後管液變濃；上升枝不透水而再吸收 NaCl，管液變稀。上升枝共同運輸帶入一個 Na⁺、一個 K⁺與兩個 Cl⁻。直血管緩慢逆流交換，減少髓質溶質流失。 |
| <a id="e-cc3"></a>CC3 | [countercurrent-mechanism](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/countercurrent-mechanism.md:70>) L70 | 髓質深部可達 1200 mOsm/L，近曲小管液約 300 mOsm/L |
| <a id="e-ad1"></a>AD1 | [adh-water-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/adh-water-reabsorption.md:62>) L62 | ADH 作用於 V2 受器，提高腺苷酸環化酶活性、增加水通道數目，水沿髓質滲透梯度再吸收，形成濃尿。水不足時，腦下垂體後葉釋放 ADH，增加保水。 |
| <a id="e-ad2"></a>AD2 | [adh-water-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/adh-water-reabsorption.md:71>) L71 | 本課本濃尿可達 1200 mOsm/L，約為血漿的四倍 |
| <a id="e-ad3"></a>AD3 | [adh-water-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/adh-water-reabsorption.md:75>) L75 | ADH 直接調整水通透性；醛固酮主要促進鈉再吸收，兩者保水方式不同。 |
| <a id="e-ut1"></a>UT1 | [ureter-constrictions](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/ureter-constrictions.md:49>) L49 | 輸尿管由腎盂通至膀胱，課本長約 25–30 cm，沿途有三處生理性狹窄。 |
| <a id="e-ut2"></a>UT2 | [ureter-constrictions](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/ureter-constrictions.md:53>) L53 | 指定解剖來源三處為腎盂交接、與髂外動脈及靜脈交叉、進入膀胱處。輸尿管以蠕動送尿，斜行穿入膀胱壁的構造有助防逆流。 |
| <a id="e-ub1"></a>UB1 | [urinary-bladder](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-bladder.md:50>) L50 | 膀胱位於骨盆腔、恥骨後方，是暫存尿液的肌性器官；膀胱三角由兩輸尿管口與一尿道內口界定。 |
| <a id="e-ub2"></a>UB2 | [urinary-bladder](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-bladder.md:54>) L54 | 逼尿肌為平滑肌；內尿道括約肌亦為平滑肌，外括約肌為骨骼肌。充盈約 300 mL 可引發排尿感，課本容量約 700–800 mL。排尿反射使逼尿肌收縮與內括約肌鬆弛。 |
| <a id="e-ub3"></a>UB3 | [urinary-bladder](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-bladder.md:58>) L58 | 外括約肌提供有意識的控制。 |
| <a id="e-ur1"></a>UR1 | [urethra](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urethra.md:49>) L49 | 尿道把膀胱內尿液排至體外；課本女性約 3.8 cm，男性約 20 cm。男性另作精液通道。 |
| <a id="e-ur2"></a>UR2 | [urethra](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urethra.md:53>) L53 | 男性尿道分前列腺部、膜部與陰莖部，課本約 2.5、2、15 cm。外尿道括約肌位於泌尿生殖膈相關位置，屬骨骼肌，受陰部神經控制。 |
| <a id="e-mr1"></a>MR1 | [micturition-reflex](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/micturition-reflex.md:58>) L58 | 課本膀胱平均容量 700–800 mL，超過約 300 mL 可引起尿意。骨盆副交感神經 S2–S4 促逼尿肌收縮、內括約肌鬆弛；儲尿時交感神經促相反反應；陰神經體神經控制外括約肌。 |
| <a id="e-ph1"></a>PH1 | [urine-physical-properties](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-physical-properties.md:33>) L33 | 健康成人每日尿量約 1–2 L；尿液水分約佔 95% |
| <a id="e-ph2"></a>PH2 | [urine-physical-properties](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-physical-properties.md:37>) L37 | 剛排出透明或澄清，靜置後可因細菌作用混濁；顏色為稻草色，隨飲食與濃度改變。 |
| <a id="e-bf1"></a>BF1 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:47>) L47 | 體液分細胞內液與細胞外液；課本標準示例總水量約佔體重 60%，細胞內液佔總水量 2/3，細胞外液佔 1/3。 |
| <a id="e-bf2"></a>BF2 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:51>) L51 | 依標準示例，細胞內液佔體重 40%，細胞外液佔 20%；細胞外液再分血漿 20% 與組織間液 80%，換成體重比例為 4% 與 16%。細胞外以 Na⁺、細胞內以 K⁺較多。 |
| <a id="e-bf3"></a>BF3 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:55>) L55 | 實際總水比例隨年齡性別而異：課本女性約 55%、男性約 65%。50 kg 女性依 55% 與 2/3 計算，細胞內液約 18.33 L。 |
| <a id="e-bf4"></a>BF4 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:64>) L64 | 「血漿佔細胞外液 20%」不是佔體重 20%；通用的 5%/15% 分法與本課本 4%/16% 不同。 |
| <a id="e-bf5"></a>BF5 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:59>) L59 | 題目先辨比例分母是體重、總水量或細胞外液 |
| <a id="e-wi1"></a>WI1 | [water-intake-output](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/water-intake-output.md:39>) L39 | 正常液體攝取與排出維持平衡；課本平均每日總攝取約 2500 mL，來源包括飲入液體、食物含水與代謝水。 |
| <a id="e-wi2"></a>WI2 | [water-intake-output](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/water-intake-output.md:43>) L43 | 消化道吸收液體 1500 mL、食物含水 800 mL、代謝水 200 mL／日。排出途徑包括腎臟尿液、肺呼氣、皮膚蒸散與流汗、糞便。 |
| <a id="e-wi3"></a>WI3 | [water-intake-output](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/water-intake-output.md:51>) L51 | 皮膚 / 無知覺蒸散、有知覺流汗 / 400 mL、100 mL |
| <a id="e-wi4"></a>WI4 | [water-intake-output](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/water-intake-output.md:74>) L74 | 一天喝進來、吃進來和自己產生的水，會從尿、呼氣、皮膚及糞便離開。 |
| <a id="e-sw1"></a>SW1 | [sodium-water-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/sodium-water-balance.md:53>) L53 | 鈉量與水量共同影響細胞外液狀態；課本區分醛固酮調節鈉含量與體液容積，ADH 調節水與體液濃度。 |
| <a id="e-sw2"></a>SW2 | [sodium-water-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/sodium-water-balance.md:57>) L57 | 醛固酮促進遠曲小管及集尿管鈉回收，水可隨滲透作用回收；ADH 直接增加遠端與集尿管水通透性。 |
| <a id="e-sw3"></a>SW3 | [sodium-water-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/sodium-water-balance.md:61>) L61 | 水分不足時可由口渴增加攝取及 ADH 增加保水配合；鈉的總量改變與鈉濃度改變不能視為同一件事。 |
| <a id="e-ra1"></a>RA1 | [renin-angiotensin-aldosterone](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renin-angiotensin-aldosterone.md:36>) L36 | 血壓下降時，刺激腎臟的**近腎絲球細胞**釋放**腎素**； |
| <a id="e-ra2"></a>RA2 | [renin-angiotensin-aldosterone](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renin-angiotensin-aldosterone.md:65>) L65 | 失血、脫水使血壓下降時，靠這條鏈讓血管收縮、留住鈉和水，把血壓撐回來。 |
| <a id="e-an1"></a>AN1 | [anp-volume-feedback](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/anp-volume-feedback.md:42>) L42 | ANP主要由心房、少量由心室細胞分泌，整體功能為降血壓。 |
| <a id="e-an2"></a>AN2 | [anp-volume-feedback](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/anp-volume-feedback.md:42>) L42 | ANP也增加腎絲球過濾作用並促進鈉排泄；ADH受到抑制時，水分排泄增加，體內液體量減少。 |
| <a id="e-eo1"></a>EO1 | [electrolyte-osmolarity](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md:47>) L47 | 電解質如酸、鹼、鹽，溶於液體會解離成離子；非電解質如葡萄糖不解離。滲透效應須看解離後粒子數，離子濃度亦以 mEq/L 表示並考慮價數。 |
| <a id="e-eo2"></a>EO2 | [electrolyte-osmolarity](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md:51>) L51 | 等數目分子完全解離的課本例：葡萄糖為 1 粒子，NaCl 成 Na⁺、Cl⁻ 共 2 粒子，MgCl₂ 成 Mg²⁺、2Cl⁻ 共 3 粒子。水移向離子或分子較多區域；Mg²⁺ 吸引 Cl⁻ 的量為 Na⁺ 的兩倍，故不能只看未解離分子的個數或質量。 |
| <a id="e-eo3"></a>EO3 | [electrolyte-osmolarity](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md:55>) L55 | 血漿與組織間液最大差別為蛋白質陰離子量，微血管壁不通透蛋白質使其留在血漿。表 9-9 列細胞內主要陽離子 K⁺、細胞外 Na⁺，主要陰離子分別為磷酸根與 Cl⁻。 |
| <a id="e-eo4"></a>EO4 | [electrolyte-osmolarity](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md:67>) L67 | mEq/L 考慮離子價數，與滲透粒子數不是同一件事。 |
| <a id="e-cl1"></a>CL1 | [chloride-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/chloride-balance.md:41>) L41 | Cl⁻ 為細胞外液主要陰離子，課本正常血清濃度為 95–103 mEq/L |
| <a id="e-cl2"></a>CL2 | [chloride-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/chloride-balance.md:45>) L45 | Na⁺ 在醛固酮調節下再吸收時，Cl⁻ 可被動吸收，所以濃度間接受醛固酮影響 |
| <a id="e-mg1"></a>MG1 | [magnesium-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/magnesium-balance.md:40>) L40 | Mg²⁺ 是細胞內主要電解質之一，課本正常血漿濃度為 1.3–2.1 mEq/L；低血鎂與高血鎂的神經反應方向不同。 |
| <a id="e-mg2"></a>MG2 | [magnesium-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/magnesium-balance.md:44>) L44 | Mg²⁺ 活化醣類與蛋白質代謝的酶，參與 Na⁺–K⁺ 幫浦引發、核糖體製造、中樞神經傳遞及心肌功能。 |

## 覆蓋、來源與未改動證據

- 已讀9份腳本、54關；逐句表 396 列（按原行句號拆句；不是獨立生理命題數）：有據 374、無據 21、矛盾 1。一列同時含有據及無據部分時採整句較保守判定，說明欄點出範圍。
- 全部確認題 38 題：37 題依指定條件可選唯一正項，1題不能保證唯一；題目有唯一正解不等於前置教材足夠。結尾另27個二選回想，正項均可由前六關已教內容選出；尿濃縮須承N01高張髓質、體液比例須承標準例，尿糖題須承N04模型。
- ※原行 15 處全部列出；未把※標記視為已獲教師核可。
- 同節點139組不同concept引文存在性、31卡frontmatter reviewed及31個唯一reviewed進度列：通過。檢查只是讀取／比對，沒有改卡、進度或腳本。
- 未執行UI測試或npm check：這次只有文件事實覆核，沒有程式改動；不聲稱本稿已通過實機或學生可用性驗收。

### 腳本SHA256（覆核前後相同）

| 腳本 | SHA256 |
|---|---|
| electrolyte-balance.md | `1d7fbb4a7c5729310db3f1227779e1157e8794a5b51a4c547ef7854488df0e59` |
| filtration-clearance.md | `42ae959be0363beb283256fa33716b96da7f3d8c774903d725de28880a1cba8f` |
| fluid-compartments.md | `64a5e8eeb3abd2ec1f7cac024e2b2fc3160950290378ce1d50f5baad3e3ef501` |
| kidney-anatomy.md | `d656d0655db6d3ac55cbb17cdf1b7c21b463e69dd1060a476677d1b0b51d3302` |
| nephron-circulation.md | `d637c8f77fde15a231bc0d36bdd4e451541dadcc61a6cea95b39410bdbaec051` |
| tubular-handling.md | `7f3289d4ee4ca1133c724c40951d1844427ed709c8e64e1e6d3822c4d5822350` |
| urinary-route-micturition.md | `129179851fc0c3fd0b33ba4b09d85db10f82a57e4bd5c7fad81122715bcfacd8` |
| urine-concentration.md | `d99850144ed4c69cb2cee4846ac22b76a64e556c519b0598016507ec049eda09` |
| water-sodium-regulation.md | `57359d23f06d3e5fbd19c9b220662b381c9e98cd689ba4b86268e1f92828a3c7` |

### apply.json及卡片SHA256（覆核前後相同）

| 來源 | SHA256 |
|---|---|
| .worktrees/apply9-codex/materials-src/electrolyte-balance/apply.json | `057ecc731982186df06b12d98ee947511e0809ca3938f0c4e7c9103fad7424b9` |
| .worktrees/apply9-codex/materials-src/filtration-clearance/apply.json | `44baa829b36e3c9777566dfe4de708cf8caf79477e2a73e3f71cdf6ab1454be6` |
| .worktrees/apply9-codex/materials-src/fluid-compartments/apply.json | `1cca238cf4de19fbb3e3b4e74e2171ed77be4db1016a5080cea103a670d27c43` |
| .worktrees/apply9-codex/materials-src/kidney-anatomy/apply.json | `f7768c80e87330362e92750f31806ff30e84ff4807aaa30207ebfefa1abefbdd` |
| .worktrees/apply9-codex/materials-src/nephron-circulation/apply.json | `a6cf95aa3e66435e63db8431909ecfa8cc788dc863a061b2466c250a6d819b76` |
| .worktrees/apply9-codex/materials-src/tubular-handling/apply.json | `1ee8c50215461af282c9214a097f5e054e0b82e2888e4b912690ec052b3383df` |
| .worktrees/apply9-codex/materials-src/urinary-route-micturition/apply.json | `e84c582ccbfdfe9b6b82b1acf41c11cfd601167139383c4ee958274effb81877` |
| .worktrees/apply9-codex/materials-src/urine-concentration/apply.json | `41ccbe10f4f61008d1b59522bf5b37aa45689d82c7cb5306bf291c24f606fbd4` |
| .worktrees/apply9-codex/materials-src/apply-examples/water-sodium-regulation/apply.json | `9c7a6249792687b7e1bbb9c2a349029f4d7541b2330cd7944928f953328cdf8b` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/adh-water-reabsorption.md | `a1f7cca02c083e9840e4f425725f9dd2df7b1a3f8a1346e7df98f9b88bf6171e` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/anp-volume-feedback.md | `e39c01416984df88e867cce5d35d95c2df7ba41c2743e4dc1775321cb725b964` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md | `b982eab1ae3da9fd9729cd9082e592c9235a863cb7870bb8a97fe365f601d7c3` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/chloride-balance.md | `c33d26cfdf8591c03a3c39639b72668a767e42cdb1e600bd4bc382bbf0825aba` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/countercurrent-mechanism.md | `02b6a4d8746b4d544c61115e481fe5a3419fa8819365d35b13b96bdfe555f9a0` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md | `f9a30924e056d4efcb6d00dbc55aa6e831a1c13a85800e1497e73ff08e4b8663` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/gfr-regulation.md | `ee5e93ba46b3f62b78b9298a470f18d4522aca9f8afc5af464f12bab7668e222` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md | `063bc9d1b0004a74a7f6363cad30ce4ef466823006dab51e89a869d6a1a0394c` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/juxtaglomerular-apparatus.md | `224cf58536cf0059fee11073dfd7f861de62fc55ba49198ba580479eaa1bea43` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-endocrine.md | `961d483ff7382e7a36c4fadb84110f8f8781f19d964299117e34913f53d5adf2` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-position.md | `8019932fe175c54215bf54446b83adcd6d819d86917bb63e007f30e1664b43bf` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-structure.md | `c28d520d1621961faa84f68592c89518dcbf7c63f4fce07af11b4407cfdb6e40` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/magnesium-balance.md | `420407e37ebaf6da392cbd398d6c14c720aadcae8d415b5e423f05cb58c9822b` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/micturition-reflex.md | `e2368b9f5012c1aa9b223f8c49953f2468b207b19306d55dfca0339f7978557e` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-histology.md | `8151d10b835ba0c67d5db40d85e4294630d14d3a2b4a14e912f331971e27208e` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-types.md | `9235b84f7f19a9aec37240439c016b9952096cb05b08db8546ff1ecaa1c87965` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/potassium-secretion.md | `62c1542f8f71b8f284791c6068fc4643fca3c69c36c4cefc30fafde17ce66af5` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-blood-flow.md | `1433b2b05cdd418680613900921d7335f84764a86cfabb993afc54e98405644d` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-clearance.md | `228bb28648279779d7dc93fee9f1fc5871b7354ffad4de7203a2c9ad33485c4b` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-handling.md | `d54e16d970533cc5339d5c59a99d108ef5c03b7bb875a2efe72299cc4a068f4d` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renin-angiotensin-aldosterone.md | `6680d8e54750cdd64fc7add516928877c80762a2097e410e90e483bbf8109199` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/sodium-water-balance.md | `2d9decb591554ad7c81519597c732124cbed9463e8982f378e2b1b90c798ccdc` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/tubular-reabsorption.md | `21a527479868cb383801d6f3c16d4d43a1d83c4724def8d8c0a184e8436bd21f` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/ureter-constrictions.md | `a87aa10e72d3fa2fc8599cbc7aafba4c2bd73c9749d830ae10fe82dc071aae95` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urethra.md | `13a20cef36199364ae7e8714e5e449fea786ce01b52888153b68af7c54078ade` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-bladder.md | `a93a6ec5771412f21a96dd04503f62b9ee43ca1a2acbe8b79e292a31e8c19627` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-system-overview.md | `33431fe232dd6bdcdb7e1d9ad423dcfa0ab30404333efceff140de1d917aef8d` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-concentration.md | `17f6dae3942d3fdc86012f7a9ff0675fcbda8787e00a0dfed7e91f803f24b9ea` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-pathway.md | `a9baf6b2b7112fa68f13a49e84ded8f50fce7bb9cf2fb0686341ef52d9afee3e` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-physical-properties.md | `b8f7811abb5a1c466cf962589a85c30585fdae18ad24132ca9d9bf4251b3c63a` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/water-intake-output.md | `8893740c3029feda4cdee559e69f83b0214ead51c5fe3683e49efb0358a8a294` |
| /Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl | `08cd97af14a77035136c37be1a986a09214e85ebc9236bbe7350fc9951e1c13d` |
