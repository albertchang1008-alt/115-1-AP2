# 給 Claude 的摘要
- 十份兩階段共110題逐題盤點；分類：{'S：文字自足': 99, 'D：確定依圖': 2, 'W：媒介用語但文字自足': 8, 'U：待教師裁定': 1}。
- 產出11份改寫／措辭草稿，均未套用；其中D確定依圖2題、U待裁定1題，其餘W文字自足但有媒介語氣。
- 誘答過於明顯候選44題，為人工審稿清單，不是難度統計，不代表題目答錯。
- 每稿含原題、四選項、答案、理由、reviewed卡uid與逐字原句；ADH較少反向推論仍需教師確認。
- 未補圖、未改題、未寫Excel／Sheet；10題lab.predict屬學習，排除題庫。
- 建議抽查：acid-case-q04、fluid-foundation-q03、fluid-case-q03、urine-case-q05、water-case-q03。

## 判準與範圍
D＝不可沿用未隨題的圖面指涉；U＝文字指涉／條件有疑義，交教師裁定；W＝有圖、圈選或操作措辭但資訊自足，提供清理草稿；S＝未發現依圖依互動缺口。S／W不等於已核准入庫，仍須教師核定與誘答檢查。分類不是單靠關鍵字：例如文字完整描述切面或膜條件即可不看圖作答。
兩階段是考核；節點任務、小檢核、心智圖、lab.predict屬學習，一律不作Excel／Sheet來源。此次只交草稿，不把新字句套入apply.json／content.json，既有已上傳列亦不動。

## 改寫草稿（待教師核定）

### acid-base-homeostasis-case-q04
判定：D：確定依圖；「圖上」「另一條箭頭」以未顯示的圖作共同參照，應改成文字考核。
原題：【雙箭頭】圖上H⁺朝管液，另一條HCO₃⁻箭頭應朝哪裡？
原選項：1. 一律進入膀胱壁肌；2. 血液；3. 一律朝尿液出口；4. 一律朝呼氣管腔；原答案第2項。
草稿：腎臟藉分泌H⁺與回收HCO₃⁻調整酸鹼時，下列物質移動方向何者正確？
草稿選項：1. H⁺進入管液，HCO₃⁻回到血液；2. H⁺回到血液，HCO₃⁻進入管液；3. H⁺與HCO₃⁻都進入管液；4. H⁺與HCO₃⁻都回到血液；草稿答案第1項。
僅草稿，待教師核定；未套用原題。
依據 `renal-acid-base-compensation`：「近曲小管以 Na⁺－H⁺相對運送分泌 H⁺；遠曲小管與集尿管主動分泌 H⁺，受醛固酮調節。NH₃ 結合 H⁺成 NH₄⁺，磷酸鹽也能承接 H⁺排出；同時 HCO₃⁻回到血液。」

### fluid-compartments-foundation-q03
判定：D：確定依圖；「外液細分圖」未隨題顯示；20%在本書有多個分母，不能依賴原圖才判定。
原題：「血漿20%」在外液細分圖的分母為何？
原選項：1. 細胞內液；2. 紅血球總量；3. 細胞外液；4. 體重；原答案第3項。
草稿：體液分布中，血漿約20%與組織間液約80%這一組比例，是下列何者的細分？
草稿選項：1. 總水量；2. 細胞內液；3. 細胞外液；4. 體重；草稿答案第3項。
僅草稿，待教師核定；未套用原題。
依據 `body-fluid-compartments`：「依標準示例，細胞內液佔體重 40%，細胞外液佔 20%；細胞外液再分血漿 20% 與組織間液 80%，換成體重比例為 4% 與 16%。」

### fluid-compartments-case-q03
判定：U：待教師裁定；數值及分母已給，但「其他分法」未具體說明；原句可考一致性，也可能指未隨題的對照圖，保守列草稿。
原題：【比例核對】同一60%示例已採4%與16%的體重分法，應怎麼處理其他分法？
原選項：1. 維持本示例一致的分母與比例；2. 任意將兩項換成別組比例；3. 再把4%與16%加到內外液總和上；4. 將4%解釋成總水量比例；原答案第1項。
草稿：採用總水量占體重60%的課本示例時，已列血漿占體重4%、組織間液占16%。若另一本資料採其他比例，如何整理最恰當？
草稿選項：1. 維持本示例的分母與比例一致，另列其他假設；2. 任意換成另一組比例而不說明假設；3. 把4%與16%額外加到細胞外液20%之外；4. 把4%改解釋為總水量的比例；草稿答案第1項。
選項仍有明顯措辭，已列入誘答清單；本草稿先解決不明指涉，仍待教師調整難度。
依據 `body-fluid-compartments`：「依標準示例，細胞內液佔體重 40%，細胞外液佔 20%；細胞外液再分血漿 20% 與組織間液 80%，換成體重比例為 4% 與 16%。」
依據 `body-fluid-compartments`：「體液分細胞內液與細胞外液；課本標準示例總水量約佔體重 60%，細胞內液佔總水量 2/3，細胞外液佔 1/3。」

### electrolyte-balance-case-q04
判定：W：媒介用語但文字自足；題目條件可獨立作答；選項用「畫成」易被誤當看圖練習，屬措辭清理草稿。
原題：【雙界線】細胞內外離子分布與小管鉀分泌，應如何整理？
原選項：1. 把鉀分泌畫成管液回血；2. 分開細胞膜的內外與血／管液方向；3. 將細胞外直接等同於尿液；4. 將細胞內直接等同於血漿；原答案第2項。
草稿：比較體液離子分布與腎小管鉀分泌時，下列整理原則何者正確？
草稿選項：1. 鉀分泌是鉀由管液移回血液；2. 細胞膜內外分布與血液／管液方向應分開判讀；3. 細胞外液就是小管內的尿液；4. 細胞內液就是血漿；草稿答案第2項。
僅草稿，待教師核定；未套用原題。
依據 `potassium-secretion`：「分泌是從血進管液，再吸收是反方向；不能把醛固酮的排鉀作用寫成保鉀。」
依據 `body-fluid-compartments`：「依標準示例，細胞內液佔體重 40%，細胞外液佔 20%；細胞外液再分血漿 20% 與組織間液 80%，換成體重比例為 4% 與 16%。」

### electrolyte-balance-case-q05
判定：W：媒介用語但文字自足；「一圖」是表達媒介，不是缺少的條件；Cl⁻與PTH作用在文字中可直接考核。
原題：【方向配對】一圖要同時呈現Cl⁻與PTH作用，何者正確？
原選項：1. PTH使鈣與磷一律同向；2. 必須標出降鈣素分泌細胞才可判讀；3. Cl⁻是重要外液陰離子，PTH促回鈣排磷；4. Cl⁻是主要細胞外陽離子；原答案第3項。
草稿：關於氯離子與副甲狀腺素的腎端作用，下列配對何者正確？
草稿選項：1. Cl⁻是細胞外主要陰離子；PTH促鈣再吸收及磷排泄；2. Cl⁻是細胞外主要陽離子；PTH促鈣再吸收及磷排泄；3. Cl⁻是細胞外主要陰離子；PTH促鈣排泄及磷再吸收；4. Cl⁻是細胞外主要陰離子；PTH促鈣與磷都再吸收；草稿答案第1項。
僅草稿，待教師核定；未套用原題。
依據 `chloride-balance`：「Cl⁻ 為細胞外液主要陰離子」
依據 `calcium-phosphate-balance`：「加強腎小管回收 Ca²⁺ 並排 HPO₄²⁻。」

### fluid-compartments-case-q05
判定：W：媒介用語但文字自足；原題已用文字描述微血管內外及大分子分布；僅標題寫圖面，不須補圖。
原題：【圖面判讀】微血管內外都有小離子，管內另有較多大分子，最適合解釋為何？
原選項：1. 血漿都在紅血球內；2. 大分子一定都能自由穿過微血管壁；3. 蛋白質較多保留在血漿；4. 組織間液沒有任何溶質；原答案第3項。
草稿：正常血漿與組織間液都含有小離子，但血漿有較多蛋白質，最合適的解釋為何？
草稿選項：1. 血漿蛋白質主要位於紅血球內；2. 微血管壁讓蛋白質自由通過而無差別；3. 微血管壁不易讓蛋白質通過，使其較多留在血漿；4. 組織間液不含任何溶質；草稿答案第3項。
僅草稿，待教師核定；未套用原題。
依據 `electrolyte-osmolarity`：「血漿與組織間液最大差別為蛋白質陰離子量，微血管壁不通透蛋白質使其留在血漿。」

### kidney-anatomy-case-q04
判定：W：媒介用語但文字自足；腎上腺鄰近腎的文字條件完整；不需要另看模型，改掉觀察媒介稱呼即可。
原題：【模型觀察】腎上腺位於腎臟附近。哪種判讀符合器官定位？
原選項：1. 是腎錐體的尖端；2. 鄰近腎臟，仍是另一個器官；3. 是深入髓質的腎柱；4. 就是腎門內的腎盂；原答案第2項。
草稿：腎上腺位於腎臟附近，下列關於兩者的關係何者正確？
草稿選項：1. 腎上腺就是腎錐體的尖端；2. 腎上腺鄰近腎臟，仍是另一個器官；3. 腎上腺是深入髓質的腎柱；4. 腎上腺就是腎門內的腎盂；草稿答案第2項。
僅草稿，待教師核定；未套用原題。
依據 `kidney-position`：「腎上腺位於腎附近但不是腎葉或腎元；不能把腎位置當膀胱的骨盆位置。」

### water-sodium-regulation-case-q03
判定：W：媒介用語但文字自足；標題提箭頭，題幹已明寫Na⁺回收與K⁺分泌；不依賴圖面箭頭。
原題：【箭頭配對】遠端小管同時增加Na⁺回收與K⁺分泌，應配哪個訊號？
原選項：1. 醛固酮；2. 只有口渴行為；3. 只靠皮膚蒸散；4. 食物中的代謝水；原答案第1項。
草稿：遠曲小管及集尿管的Na⁺再吸收與K⁺分泌同時增加，最符合哪項激素作用？
草稿選項：1. 醛固酮；2. 只有口渴行為；3. 只靠皮膚蒸散；4. 食物中的代謝水；草稿答案第1項。
保留原選項以對照同概念，但三項誘答過於遙遠；教師核定前不套用。
依據 `potassium-secretion`：「醛固酮促進遠端鈉再吸收，同時增加鉀分泌。」

### urine-concentration-case-q05
判定：W：媒介用語但文字自足；ADH由較多到較少的條件已完整；「切到」有操作語氣，但不需實際畫面。
原題：【模型比較】其他條件相同，由 ADH 較多切到較少時，合理方向為何？
原選項：1. 水回收增加、尿量減少、尿較濃；2. 水回收不變、尿量與濃度都必定不變；3. 水回收減少、尿量增加、尿較稀；4. 水回收減少、尿量減少、尿較濃；原答案第3項。
草稿：其他條件相同，ADH較少時，相較於ADH較多的情況，下列水回收與尿液變化何者合理？
草稿選項：1. 水回收增加、尿量減少、尿較濃；2. 水回收不變、尿量與濃度必定不變；3. 水回收減少、尿量增加、尿較稀；4. 水回收減少、尿量減少、尿較濃；草稿答案第3項。
原核定content已有較少ADH的答案；reviewed原句只明寫正向機轉，較少ADH三項反向推論仍需教師確認，不宣稱已有逐字反向原句。
依據 `adh-water-reabsorption`：「ADH 作用於 V2 受器，提高腺苷酸環化酶活性、增加水通道數目，水沿髓質滲透梯度再吸收，形成濃尿。」

### urinary-route-micturition-case-q03
判定：W：媒介用語但文字自足；原題問膀胱三角的構成開口，選項全為文字；內面圖／圈選是媒介詞，非必要資料。
原題：【內面圖觀察】要在膀胱內面圈出三角，應連接何者？
原選項：1. 左右腎盂及尿道外口；2. 左右腎門及輸尿管上端；3. 左右外括約肌及腎乳頭；4. 左右輸尿管口及尿道內口；原答案第4項。
草稿：膀胱三角的範圍由哪三個開口界定？
草稿選項：1. 左右腎盂及尿道外口；2. 左右腎門及輸尿管上端；3. 左右外括約肌及腎乳頭；4. 左右輸尿管口及尿道內口；草稿答案第4項。
僅草稿，待教師核定；未套用原題。
依據 `urinary-bladder`：「膀胱三角由兩輸尿管口與一尿道內口界定。」

### nephron-circulation-case-q04
判定：W：媒介用語但文字自足；「標出」「位置」未引用圖中代號；選項已明列構造，可獨立考來源。
原題：【訊號配對】要在近腎絲球器標出腎素分泌來源，應選哪個位置？
原選項：1. 遠曲小管緻密斑；2. 入球小動脈壁的近腎絲球細胞；3. 腎盂內面；4. 鮑氏囊壁層；原答案第2項。
草稿：近腎絲球器中，分泌腎素的主要細胞位於何處？
草稿選項：1. 遠曲小管的緻密斑；2. 入球小動脈壁的近腎絲球細胞；3. 腎盂內面；4. 鮑氏囊壁層；草稿答案第2項。
僅草稿，待教師核定；未套用原題。
依據 `juxtaglomerular-apparatus`：「近腎絲球細胞為入球小動脈壁特化平滑肌細胞，感受壓力並分泌腎素；緻密斑感受管液鈉變化。」

## 誘答過於明顯清單（不直接改題）
「高」優先重寫同層級迷思選項；「中」可能適合入門辨識，需教師決定。未把所有絕對詞都判為壞題，亦不據此推斷學生猜題。

| 題目ID | 題幹 | 需檢視的原錯誤選項 | 理由／優先度 |
|---|---|---|---|
| acid-base-homeostasis-foundation-q01 | 維持酸鹼平衡的三系統為何？ | 第3項「只有尿液顏色」；第4項「只有骨骼肌收縮」 | 尿色與骨骼肌收縮無法與緩衝／肺腎形成同層級的系統比較。（高） |
| acid-base-homeostasis-foundation-q02 | 碳酸系統公式中的比值如何放置？ | 第1項「把血球數放分母」；第4項「把尿量放分子」 | 血球數及尿量不在鹼／酸比值內，無需理解公式就可剔除。（高） |
| acid-base-homeostasis-foundation-q04 | 呼吸速率增加、CO₂排出增加時，本節定性方向為何？ | 第2項「腎臟停止所有作用」；第3項「CO₂全部改由尿道呼出」 | 腎完全停用及由尿道呼出CO₂，屬跨系統荒謬敘述。（高） |
| acid-base-homeostasis-foundation-q05 | 腎臟排酸留鹼的方向為何？ | 第4項「兩者都只從肺排出」 | 兩種離子全部由肺排出，與腎端作用題幹不在同一層級。（高） |
| acid-base-homeostasis-case-q01 | 【公式核對】示例6.1＋log（26／1.3）中，應優先確認什麼？ | 第1項「改用尿流量作分母」；第2項「將所有單位省略後視為任何情境都適用」 | 尿流量與「任何情境都適用」讓公式核對退化成措辭排除。（高） |
| acid-base-homeostasis-case-q02 | 【緩衝觀察】緩衝物接住H⁺後，能說酸已全部離開身體嗎？ | 第1項「能，所有酸都立刻消失」；第2項「能，肺與腎不再有作用」；第3項「能，所有緩衝都發生在尿外」 | 全部立刻消失／器官不再作用／尿外緩衝三項皆極端，未診斷緩衝與排出的細緻混淆。（高） |
| acid-base-homeostasis-case-q03 | 【途徑配對】要說明CO₂離開身體，應沿哪條路徑？ | 第2項「血液到尿道，直接呼出」；第3項「血紅素離開細胞後變成尿液」 | 尿道呼氣、血紅素變尿液可憑常識排除。（高） |
| acid-base-homeostasis-case-q04 | 【雙箭頭】圖上H⁺朝管液，另一條HCO₃⁻箭頭應朝哪裡？ | 第1項「一律進入膀胱壁肌」；第3項「一律朝尿液出口」；第4項「一律朝呼氣管腔」 | 「一律」＋膀胱壁肌／呼氣管腔等遙遠去向，只有正解像生理敘述。（高） |
| acid-base-homeostasis-case-q05 | 【血尿區分】尿液承接並排出更多H⁺時，對血液方向應如何理解？ | 第1項「代表緩衝物完全不再需要」 | 排酸不等於不再需要緩衝；「完全不再」措辭過於絕對。（高） |
| electrolyte-balance-foundation-q01 | 相同起始分子數且完全解離時，MgCl₂每個分子形成幾個粒子？ | 第4項「只依Mg²⁺的價數判斷而不計Cl⁻」 | 三項是粒子數，一項是作答方法評論，選項形式不平行。（中） |
| electrolyte-balance-foundation-q03 | mEq/L與滲透粒子數應如何區分？ | 第1項「兩者只描述水的體積」；第2項「mEq/L直接表示尿流量」 | 水體積與尿流量不是價數／粒子數的同層比較。（高） |
| electrolyte-balance-foundation-q04 | 主要陽離子的細胞內外分布為何？ | 第3項「兩者都不存在細胞內」 | 兩離子都不存在細胞內的斷言太極端。（高） |
| electrolyte-balance-foundation-q05 | 副甲狀腺素的腎端鈣磷作用應如何配對？ | 第4項「只改變尿液顏色」 | 只改尿色不涉及鈣磷腎端處理。（高） |
| electrolyte-balance-foundation-q06 | 鎂的角色包含何者？ | 第3項「完全沒有細胞內作用」；第4項「只是尿液顏色來源」 | 完全無細胞內作用／只造成尿色，難以測出鎂功能迷思。（高） |
| electrolyte-balance-case-q02 | 【概念核對】把Mg²⁺的「二價」寫成MgCl₂「兩粒子」，錯在哪裡？ | 第1項「忽略葡萄糖也有固定二價」；第3項「應只看水的多少而不看溶質」 | 葡萄糖固定二價與完全只看水，偏離價數／粒子數的概念比較。（高） |
| electrolyte-balance-case-q05 | 【方向配對】一圖要同時呈現Cl⁻與PTH作用，何者正確？ | 第2項「必須標出降鈣素分泌細胞才可判讀」 | 強加降鈣素分泌細胞與本題Cl⁻／PTH腎作用不相干。（高） |
| fluid-compartments-foundation-q02 | 以總水量為分母，內液與外液如何分配？ | 第1項「內液與外液都各佔全部總水量」；第4項「全部都是血漿」 | 各占全部及全是血漿非常極端，難區分2/3與1/3的真正混淆。（高） |
| fluid-compartments-foundation-q05 | 血漿與組織間液的重要差別是什麼？ | 第3項「血漿就是紅血球內液」；第4項「組織間液就是尿液」 | 血漿＝紅血球內液、組織間液＝尿液，與蛋白質比較層級差距大。（中） |
| fluid-compartments-case-q03 | 【比例核對】同一60%示例已採4%與16%的體重分法，應怎麼處理其他分法？ | 第2項「任意將兩項換成別組比例」；第3項「再把4%與16%加到內外液總和上」 | 「任意」及「再加」明示不當程序；應改為可比較的分母／假設錯誤。（高） |
| fluid-compartments-case-q04 | 【條件比較】相同體重下比較成年男女的課本含水比例，哪個因素應納入？ | 第1項「只看當次尿液顏色」；第4項「只看血管的長度」 | 尿色及血管長度與性別含水比例關係過遠。（高） |
| fluid-compartments-case-q05 | 【圖面判讀】微血管內外都有小離子，管內另有較多大分子，最適合解釋為何？ | 第1項「血漿都在紅血球內」；第4項「組織間液沒有任何溶質」 | 血漿都在紅血球內、間液無任何溶質太極端。（高） |
| kidney-anatomy-foundation-q06 | 腎臟的紅血球生成素（腎紅血球生成因子）主要參與何種功能？ | 第1項「將尿液由膀胱運至腎盂」；第3項「直接作為膀胱壁肌肉」；第4項「使腎乳頭轉變為腎柱」 | 尿路逆送、直接當壁肌、乳頭變腎柱均非內分泌訊號的可比功能。（高） |
| nephron-circulation-case-q02 | 【血流追蹤】血液剛離開出球小動脈，下一段應接何者？ | 第1項「鮑氏囊腔」；第2項「輸尿管」 | 鮑氏囊腔／輸尿管是尿路，若學生已分清血尿即可剔除，建議教師評估難度。（中） |
| nephron-circulation-case-q05 | 【流量判讀】同學以 GFR 除以全部腎血流量來算 FF，應修正哪個項目？ | 第2項「把兩者都改成尿中物質濃度」 | 尿中物質濃度與FF分子分母的流量概念不相干。（高） |
| tubular-handling-foundation-q03 | 近曲小管回收葡萄糖與水的機轉配對，何者正確？ | 第1項「葡萄糖只靠水通道，水只靠腎素分泌」；第2項「葡萄糖由血分泌入管液，水完全不回收」；第4項「葡萄糖與水均由膀胱形成」 | 腎素運水、完全不回收、膀胱形成葡萄糖水均偏離正常回收機轉。（高） |
| tubular-handling-foundation-q06 | 僅見尿中某物質濃度較高，能否直接判定其分泌增加？ | 第4項「不能，因尿中不含任何溶質」 | 尿液不含任何溶質屬荒謬前提。（高） |
| tubular-handling-case-q02 | 【收支比較】其他量固定，再吸收量增加時，最終物質排泄量如何改變？ | 第3項「必定等於 GFR 的數值」 | 排泄量與GFR的量綱不同，無須使用收支關係即可排除。（高） |
| tubular-handling-case-q04 | 【能力比較】正常葡萄糖過濾負荷未超過小管回收能力且運輸功能完整時，預期為何？ | 第3項「葡萄糖只停在腎盂不進小管」；第4項「最大轉運量會變成尿流量」 | 糖停腎盂及最大轉運量變成尿流量，與回收能力假設無關。（高） |
| urinary-route-micturition-foundation-q03 | 膀胱三角由哪三個開口界定？ | 第2項「兩個腎乳頭與一個腎門」；第4項「兩個腎盂與一個尿道外口」 | 腎乳頭／腎門／腎盂不是膀胱開口，容易只用位置排除。（中） |
| urinary-route-micturition-case-q03 | 【內面圖觀察】要在膀胱內面圈出三角，應連接何者？ | 第1項「左右腎盂及尿道外口」；第2項「左右腎門及輸尿管上端」；第3項「左右外括約肌及腎乳頭」 | 三項均含膀胱內不存在的遠端構造，無需掌握三角邊界即可排除。（高） |
| urinary-route-micturition-case-q04 | 【控制配對】想說明可用意識暫時控制排尿出口，應連到哪一組？ | 第2項「骨盆副交感神經與腎被膜」；第3項「腎素與膀胱三角」；第4項「緻密斑與輸尿管壁」 | 骨盆神經配腎被膜、腎素配三角、緻密斑配尿管皆不在出口隨意控制層級。（高） |
| urine-concentration-foundation-q01 | 濃縮尿液需配合哪一組條件？ | 第3項「只有膀胱收縮，無需小管水移動」；第4項「只有輸尿管蠕動，無需髓質環境」 | 膀胱收縮／輸尿管蠕動無法與髓質梯度及通透性同層比較。（高） |
| urine-concentration-foundation-q02 | 亨利氏環下降枝的主要特性為何？ | 第3項「把血液直接排入尿道」；第4項「只負責儲存最終尿液」 | 血液直接排尿道／只儲尿與亨利氏環特性無關。（高） |
| urine-concentration-foundation-q04 | 直血管在逆流機制中的主要角色為何？ | 第1項「取代鮑氏囊形成管液」；第2項「直接將尿液送至膀胱」；第3項「製造輸尿管的蠕動」 | 三錯項皆把血管改成尿路或蠕動，正確功能過度突出。（高） |
| urine-concentration-foundation-q05 | ADH 增加集尿管水回收的直接機轉為何？ | 第2項「使外尿道括約肌收縮」；第3項「直接把水從腎盂推回血管」 | 外括約肌與腎盂推水不能診斷ADH／通透性的真正混淆。（高） |
| urine-concentration-case-q02 | 【角色配對】同學將亨利氏環與直血管都寫成「逆流交換血管」，應如何修正？ | 第1項「兩者都是輸尿管的分支」；第2項「直血管是小管，亨利氏環是動脈」；第3項「兩者都直接構成過濾膜」 | 尿管分支、交換型別完全互換、都變過濾膜，僅正解完整且較長。（高） |
| urine-concentration-case-q03 | 【訊號觀察】集尿管水通道增加，水通透性上升，哪項最直接符合此變化？ | 第2項「外括約肌隨意收縮」；第3項「輸尿管三處狹窄變化」；第4項「腎門包覆層增厚」 | 出口、狹窄、包覆層都不是水通道訊號。（高） |
| water-sodium-regulation-foundation-q03 | 口渴與ADH的主要分工為何？ | 第1項「ADH只增加食物含水量」；第2項「兩者只改變糞便排水」；第4項「口渴直接取代水通道」 | ADH只增食物水／只改糞便／口渴代替水通道皆不屬同一機轉層級。（高） |
| water-sodium-regulation-foundation-q05 | 醛固酮與ADH的直接作用配對，何者正確？ | 第4項「兩者都只促糞便排鈉」 | 只促糞便排鈉與腎端作用配對無關。（高） |
| water-sodium-regulation-foundation-q06 | 判斷鈉濃度時應同時考慮什麼？ | 第4項「只看容器材質」 | 只看容器材質可憑常識剔除，未診斷鈉量／水量。（高） |
| water-sodium-regulation-case-q01 | 【收支表】1500 mL液體、800 mL食物水與200 mL代謝水，合計為何？ | 第1項「只採800 mL/日」；第2項「只採200 mL/日」；第4項「只採1500 mL/日」 | 各只取一部分而非總和，屬基礎收支入門題，是否保留給教師。（中） |
| water-sodium-regulation-case-q03 | 【箭頭配對】遠端小管同時增加Na⁺回收與K⁺分泌，應配哪個訊號？ | 第2項「只有口渴行為」；第3項「只靠皮膚蒸散」；第4項「食物中的代謝水」 | 只有正解是激素，其他是行為／途徑／食物詞，形式即洩漏答案。（高） |
| water-sodium-regulation-case-q04 | 【流程核對】腎素之後的鏈條應如何追蹤？ | 第1項「先將腎素當成尿中廢物排出」；第4項「完全跳過血管收縮素I」 | 當廢物排出／完全跳步用語明顯；可改為可比的轉化步驟迷思。（高） |
| water-sodium-regulation-case-q05 | 【容器比較】鈉總量相同但水量增加，能直接說鈉濃度不變嗎？ | 第2項「能，ANP就是鈉濃度的單位」 | ANP是濃度單位屬類別錯置。（高） |

## 110題逐題清單（以完整題幹人工判定）

| 題目ID | 階段／節點 | 原題幹 | 分類與理由 | 誘答候選 |
|---|---|---|---|
| acid-base-homeostasis-foundation-q01 | foundation／acid-base-homeostasis-node-01 | 維持酸鹼平衡的三系統為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| acid-base-homeostasis-foundation-q02 | foundation／acid-base-homeostasis-node-02 | 碳酸系統公式中的比值如何放置？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| acid-base-homeostasis-foundation-q03 | foundation／acid-base-homeostasis-node-03 | 血紅素緩衝主要應定位在哪裡？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| acid-base-homeostasis-foundation-q04 | foundation／acid-base-homeostasis-node-04 | 呼吸速率增加、CO₂排出增加時，本節定性方向為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| acid-base-homeostasis-foundation-q05 | foundation／acid-base-homeostasis-node-05 | 腎臟排酸留鹼的方向為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| acid-base-homeostasis-foundation-q06 | foundation／acid-base-homeostasis-node-06 | NH₃承接H⁺後形成何者？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| acid-base-homeostasis-case-q01 | cases／acid-base-homeostasis-node-02 | 【公式核對】示例6.1＋log（26／1.3）中，應優先確認什麼？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| acid-base-homeostasis-case-q02 | cases／acid-base-homeostasis-node-01 | 【緩衝觀察】緩衝物接住H⁺後，能說酸已全部離開身體嗎？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| acid-base-homeostasis-case-q03 | cases／acid-base-homeostasis-node-04 | 【途徑配對】要說明CO₂離開身體，應沿哪條路徑？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| acid-base-homeostasis-case-q04 | cases／acid-base-homeostasis-node-05 | 【雙箭頭】圖上H⁺朝管液，另一條HCO₃⁻箭頭應朝哪裡？ | D：確定依圖：「圖上」「另一條箭頭」以未顯示的圖作共同參照，應改成文字考核。 | 是 |
| acid-base-homeostasis-case-q05 | cases／acid-base-homeostasis-node-06 | 【血尿區分】尿液承接並排出更多H⁺時，對血液方向應如何理解？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| electrolyte-balance-foundation-q01 | foundation／electrolyte-balance-node-01 | 相同起始分子數且完全解離時，MgCl₂每個分子形成幾個粒子？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| electrolyte-balance-foundation-q02 | foundation／electrolyte-balance-node-02 | 只通水、不通溶質的膜模型中，水淨移動朝哪側？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| electrolyte-balance-foundation-q03 | foundation／electrolyte-balance-node-03 | mEq/L與滲透粒子數應如何區分？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| electrolyte-balance-foundation-q04 | foundation／electrolyte-balance-node-04 | 主要陽離子的細胞內外分布為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| electrolyte-balance-foundation-q05 | foundation／electrolyte-balance-node-05 | 副甲狀腺素的腎端鈣磷作用應如何配對？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| electrolyte-balance-foundation-q06 | foundation／electrolyte-balance-node-06 | 鎂的角色包含何者？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| electrolyte-balance-case-q01 | cases／electrolyte-balance-node-01 | 【粒子模型】等起始分子數比較葡萄糖與NaCl，哪項前提不可漏？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| electrolyte-balance-case-q02 | cases／electrolyte-balance-node-01 | 【概念核對】把Mg²⁺的「二價」寫成MgCl₂「兩粒子」，錯在哪裡？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| electrolyte-balance-case-q03 | cases／electrolyte-balance-node-02 | 【膜條件】兩側粒子不同，要用本節模型判斷水流，應先確認何者？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| electrolyte-balance-case-q04 | cases／electrolyte-balance-node-04 | 【雙界線】細胞內外離子分布與小管鉀分泌，應如何整理？ | W：媒介用語但文字自足：題目條件可獨立作答；選項用「畫成」易被誤當看圖練習，屬措辭清理草稿。 | 未列 |
| electrolyte-balance-case-q05 | cases／electrolyte-balance-node-05 | 【方向配對】一圖要同時呈現Cl⁻與PTH作用，何者正確？ | W：媒介用語但文字自足：「一圖」是表達媒介，不是缺少的條件；Cl⁻與PTH作用在文字中可直接考核。 | 是 |
| filtration-clearance-foundation-q01 | foundation／filtration-clearance-node-01 | 腎絲球過濾的主要方向為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-foundation-q02 | foundation／filtration-clearance-node-02 | 哪一組構成三層過濾膜？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-foundation-q03 | foundation／filtration-clearance-node-03 | 比較正常血漿與腎絲球濾液，哪一項較能顯示兩者差別？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-foundation-q04 | foundation／filtration-clearance-node-04 | 哪種壓力促進腎絲球過濾？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-foundation-q05 | foundation／filtration-clearance-node-05 | C＝U×V／P 計算出的清除率，表示哪種量？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-foundation-q06 | foundation／filtration-clearance-node-06 | 哪種物質只過濾、不再吸收也不分泌，可用其清除率對應 GFR？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-case-q01 | cases／filtration-clearance-node-05 | 【單位整理】收集一小時尿液後，要把尿量帶入以 mL/min 為單位的 V，應如何處理？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-case-q02 | cases／filtration-clearance-node-05 | 【結果判讀】計算得到清除率 69 mL/min，哪種說明符合其意義？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-case-q03 | cases／filtration-clearance-node-06 | 【指標比較】菊糖與肌酸酐都可用來理解 GFR，哪項差異正確？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-case-q04 | cases／filtration-clearance-node-06 | 【流量配對】將 PAH 清除率直接標為全部腎血流量，問題在哪裡？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| filtration-clearance-case-q05 | cases／filtration-clearance-node-03 | 【成分比較】測得鮑氏囊濾液的葡萄糖濃度與血漿相近，最合理的解釋為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| fluid-compartments-foundation-q01 | foundation／fluid-compartments-node-01 | 標準示例的總水量60%，分母是什麼？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| fluid-compartments-foundation-q02 | foundation／fluid-compartments-node-02 | 以總水量為分母，內液與外液如何分配？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| fluid-compartments-foundation-q03 | foundation／fluid-compartments-node-03 | 「血漿20%」在外液細分圖的分母為何？ | D：確定依圖：「外液細分圖」未隨題顯示；20%在本書有多個分母，不能依賴原圖才判定。 | 未列 |
| fluid-compartments-foundation-q04 | foundation／fluid-compartments-node-04 | 標準示例中血漿4%與組織間液16%，應如何合併？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| fluid-compartments-foundation-q05 | foundation／fluid-compartments-node-05 | 血漿與組織間液的重要差別是什麼？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| fluid-compartments-foundation-q06 | foundation／fluid-compartments-node-06 | 女性約55%、男性約65%的含水比例，應如何理解？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| fluid-compartments-case-q01 | cases／fluid-compartments-node-01 | 【分母核對】資料先給體重，再註明採60%標準示例，第一步要算什麼？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| fluid-compartments-case-q02 | cases／fluid-compartments-node-02 | 【分類整理】將血漿放在「血管內」後，還應歸入哪一類？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| fluid-compartments-case-q03 | cases／fluid-compartments-node-04 | 【比例核對】同一60%示例已採4%與16%的體重分法，應怎麼處理其他分法？ | U：待教師裁定：數值及分母已給，但「其他分法」未具體說明；原句可考一致性，也可能指未隨題的對照圖，保守列草稿。 | 是 |
| fluid-compartments-case-q04 | cases／fluid-compartments-node-06 | 【條件比較】相同體重下比較成年男女的課本含水比例，哪個因素應納入？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| fluid-compartments-case-q05 | cases／fluid-compartments-node-05 | 【圖面判讀】微血管內外都有小離子，管內另有較多大分子，最適合解釋為何？ | W：媒介用語但文字自足：原題已用文字描述微血管內外及大分子分布；僅標題寫圖面，不須補圖。 | 是 |
| kidney-anatomy-foundation-q01 | foundation／kidney-anatomy-node-01 | 關於腎臟位置，哪一項正確？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| kidney-anatomy-foundation-q02 | foundation／kidney-anatomy-node-02 | 腎柱是什麼構造？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| kidney-anatomy-foundation-q03 | foundation／kidney-anatomy-node-03 | 腎乳頭流出的尿液先由哪個構造承接？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| kidney-anatomy-foundation-q04 | foundation／kidney-anatomy-node-04 | 腎外包覆層由內而外的順序為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| kidney-anatomy-foundation-q05 | foundation／kidney-anatomy-node-05 | 哪個配對符合泌尿系統器官分工？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| kidney-anatomy-foundation-q06 | foundation／kidney-anatomy-node-06 | 腎臟的紅血球生成素（腎紅血球生成因子）主要參與何種功能？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| kidney-anatomy-case-q01 | cases／kidney-anatomy-node-02 | 【切面觀察】兩個腎錐體之間的組織與外圍皮質相連，應辨認為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| kidney-anatomy-case-q02 | cases／kidney-anatomy-node-03 | 【路徑觀察】由集尿管出口沿尿液方向追蹤，經乳頭後的正確順序為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| kidney-anatomy-case-q03 | cases／kidney-anatomy-node-05 | 【器官配對】尿液已離開腎盂，正被送往膀胱；排到體外時又經另一條管道。兩者依序為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| kidney-anatomy-case-q04 | cases／kidney-anatomy-node-04 | 【模型觀察】腎上腺位於腎臟附近。哪種判讀符合器官定位？ | W：媒介用語但文字自足：腎上腺鄰近腎的文字條件完整；不需要另看模型，改掉觀察媒介稱呼即可。 | 未列 |
| kidney-anatomy-case-q05 | cases／kidney-anatomy-node-06 | 【概念整理】只以尿量整理腎臟功能，會漏掉下列哪一組角色？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-foundation-q01 | foundation／nephron-circulation-node-01 | 腎元的基本組成為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-foundation-q02 | foundation／nephron-circulation-node-02 | 比較皮質與近髓質腎元，哪一項正確？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-foundation-q03 | foundation／nephron-circulation-node-03 | 有明顯刷狀緣的立方上皮，最符合哪個管段？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-foundation-q04 | foundation／nephron-circulation-node-04 | 腎絲球前後相接的血管依序為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-foundation-q05 | foundation／nephron-circulation-node-05 | 近腎絲球器中，感受管液鈉變化的是何者？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-foundation-q06 | foundation／nephron-circulation-node-06 | 過濾分率 FF 的算法為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-case-q01 | cases／nephron-circulation-node-02 | 【定位觀察】某腎元的長環深入髓質，腎小體靠近皮髓交界。腎小體仍應標在哪一區？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-case-q02 | cases／nephron-circulation-node-04 | 【血流追蹤】血液剛離開出球小動脈，下一段應接何者？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| nephron-circulation-case-q03 | cases／nephron-circulation-node-03 | 【切片觀察】一段位於髓質深處的細管，管壁為扁平上皮，最可能是哪段？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| nephron-circulation-case-q04 | cases／nephron-circulation-node-05 | 【訊號配對】要在近腎絲球器標出腎素分泌來源，應選哪個位置？ | W：媒介用語但文字自足：「標出」「位置」未引用圖中代號；選項已明列構造，可獨立考來源。 | 未列 |
| nephron-circulation-case-q05 | cases／nephron-circulation-node-06 | 【流量判讀】同學以 GFR 除以全部腎血流量來算 FF，應修正哪個項目？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| tubular-handling-foundation-q01 | foundation／tubular-handling-node-01 | 物質從小管管液移回血液，稱為何者？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| tubular-handling-foundation-q02 | foundation／tubular-handling-node-02 | 同一物質的排泄量收支式為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| tubular-handling-foundation-q03 | foundation／tubular-handling-node-03 | 近曲小管回收葡萄糖與水的機轉配對，何者正確？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| tubular-handling-foundation-q04 | foundation／tubular-handling-node-04 | 葡萄糖最大轉運量代表何種意義？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| tubular-handling-foundation-q05 | foundation／tubular-handling-node-05 | 醛固酮對遠端 Na⁺與 K⁺處理的作用為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| tubular-handling-foundation-q06 | foundation／tubular-handling-node-06 | 僅見尿中某物質濃度較高，能否直接判定其分泌增加？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| tubular-handling-case-q01 | cases／tubular-handling-node-01 | 【方向判讀】某物質由管周血液移入小管管液，應標哪個動詞？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| tubular-handling-case-q02 | cases／tubular-handling-node-02 | 【收支比較】其他量固定，再吸收量增加時，最終物質排泄量如何改變？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| tubular-handling-case-q03 | cases／tubular-handling-node-06 | 【尿樣比較】兩份尿樣中同一物質的尿濃度相同，甲的每分鐘尿流量較大，何者正確？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| tubular-handling-case-q04 | cases／tubular-handling-node-04 | 【能力比較】正常葡萄糖過濾負荷未超過小管回收能力且運輸功能完整時，預期為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| tubular-handling-case-q05 | cases／tubular-handling-node-05 | 【方向配對】醛固酮作用增加時，遠端的鈉與鉀移動應如何配對？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urinary-route-micturition-foundation-q01 | foundation／urinary-route-micturition-node-01 | 輸尿管送尿及防逆流的配對，何者正確？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urinary-route-micturition-foundation-q02 | foundation／urinary-route-micturition-node-02 | 輸尿管三處狹窄中，位於中段的一處在哪裡？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urinary-route-micturition-foundation-q03 | foundation／urinary-route-micturition-node-03 | 膀胱三角由哪三個開口界定？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| urinary-route-micturition-foundation-q04 | foundation／urinary-route-micturition-node-04 | 哪個尿道括約肌具有骨骼肌及隨意控制特性？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urinary-route-micturition-foundation-q05 | foundation／urinary-route-micturition-node-05 | 排尿反射時，哪種組合有利排出尿液？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urinary-route-micturition-foundation-q06 | foundation／urinary-route-micturition-node-06 | 每日尿量、比重與 pH 的意義，何者正確？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urinary-route-micturition-case-q01 | cases／urinary-route-micturition-node-01 | 【通路觀察】輸尿管斜行穿入膀胱壁，膀胱內壓增加可使該段受壓閉合，應如何理解？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urinary-route-micturition-case-q02 | cases／urinary-route-micturition-node-02 | 【路徑追蹤】一滴尿液隨尿流由腎盂往膀胱移動，依序會通過輸尿管的哪三處狹窄？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urinary-route-micturition-case-q03 | cases／urinary-route-micturition-node-03 | 【內面圖觀察】要在膀胱內面圈出三角，應連接何者？ | W：媒介用語但文字自足：原題問膀胱三角的構成開口，選項全為文字；內面圖／圈選是媒介詞，非必要資料。 | 是 |
| urinary-route-micturition-case-q04 | cases／urinary-route-micturition-node-05 | 【控制配對】想說明可用意識暫時控制排尿出口，應連到哪一組？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| urinary-route-micturition-case-q05 | cases／urinary-route-micturition-node-06 | 【紀錄比較】紀錄列出每日尿量與尿比重，應如何閱讀？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urine-concentration-foundation-q01 | foundation／urine-concentration-node-01 | 濃縮尿液需配合哪一組條件？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| urine-concentration-foundation-q02 | foundation／urine-concentration-node-02 | 亨利氏環下降枝的主要特性為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| urine-concentration-foundation-q03 | foundation／urine-concentration-node-03 | 亨利氏環上升枝回收 NaCl 時，水的通透性為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urine-concentration-foundation-q04 | foundation／urine-concentration-node-04 | 直血管在逆流機制中的主要角色為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| urine-concentration-foundation-q05 | foundation／urine-concentration-node-05 | ADH 增加集尿管水回收的直接機轉為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| urine-concentration-foundation-q06 | foundation／urine-concentration-node-06 | 其他條件相同，ADH 較多時尿量與濃度的方向為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urine-concentration-case-q01 | cases／urine-concentration-node-03 | 【管段比較】某段回收 NaCl，水卻無法隨之通過，最符合哪個管段？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urine-concentration-case-q02 | cases／urine-concentration-node-04 | 【角色配對】同學將亨利氏環與直血管都寫成「逆流交換血管」，應如何修正？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| urine-concentration-case-q03 | cases／urine-concentration-node-05 | 【訊號觀察】集尿管水通道增加，水通透性上升，哪項最直接符合此變化？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| urine-concentration-case-q04 | cases／urine-concentration-node-01 | 【條件推論】髓質已有高滲透梯度，但集尿管仍不易通水，能否只靠梯度得到同樣濃縮效果？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| urine-concentration-case-q05 | cases／urine-concentration-node-06 | 【模型比較】其他條件相同，由 ADH 較多切到較少時，合理方向為何？ | W：媒介用語但文字自足：ADH由較多到較少的條件已完整；「切到」有操作語氣，但不需實際畫面。 | 未列 |
| water-sodium-regulation-foundation-q01 | foundation／water-sodium-regulation-node-01 | 每日攝取示例應包含哪三項？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| water-sodium-regulation-foundation-q02 | foundation／water-sodium-regulation-node-02 | 沒有明顯流汗時，皮膚排水如何理解？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| water-sodium-regulation-foundation-q03 | foundation／water-sodium-regulation-node-03 | 口渴與ADH的主要分工為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| water-sodium-regulation-foundation-q04 | foundation／water-sodium-regulation-node-04 | RAAS中真正具有直接血管收縮作用者為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| water-sodium-regulation-foundation-q05 | foundation／water-sodium-regulation-node-05 | 醛固酮與ADH的直接作用配對，何者正確？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| water-sodium-regulation-foundation-q06 | foundation／water-sodium-regulation-node-06 | 判斷鈉濃度時應同時考慮什麼？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| water-sodium-regulation-case-q01 | cases／water-sodium-regulation-node-01 | 【收支表】1500 mL液體、800 mL食物水與200 mL代謝水，合計為何？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| water-sodium-regulation-case-q02 | cases／water-sodium-regulation-node-02 | 【途徑辨識】有人把「沒有流汗」寫成「沒有皮膚失水」，應如何修正？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 未列 |
| water-sodium-regulation-case-q03 | cases／water-sodium-regulation-node-05 | 【箭頭配對】遠端小管同時增加Na⁺回收與K⁺分泌，應配哪個訊號？ | W：媒介用語但文字自足：標題提箭頭，題幹已明寫Na⁺回收與K⁺分泌；不依賴圖面箭頭。 | 是 |
| water-sodium-regulation-case-q04 | cases／water-sodium-regulation-node-04 | 【流程核對】腎素之後的鏈條應如何追蹤？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |
| water-sodium-regulation-case-q05 | cases／water-sodium-regulation-node-06 | 【容器比較】鈉總量相同但水量增加，能直接說鈉濃度不變嗎？ | S：文字自足：題幹與選項已給出必要條件；只需教材知識，不需辨認畫面標號、箭頭或狀態。 | 是 |

## 學習題排除清單（非110題分母）

- acid-base-homeostasis-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- electrolyte-balance-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- filtration-clearance-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- fluid-compartments-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- kidney-anatomy-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- nephron-circulation-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- tubular-handling-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- urinary-route-micturition-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- urine-concentration-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。
- water-sodium-regulation-predict：情境實驗室預測，學習用；不列入兩階段110題，不作題庫來源。

## 驗證
110題ID唯一；每稿4選1、答案有效；44題誘答候選所列皆為原錯誤選項；每筆草稿引用均查卡frontmatter＋進度reviewed、逐字引文存在。來源SHA列在apply9-fix-round/question-audit.json，收工再比對題檔未改。
