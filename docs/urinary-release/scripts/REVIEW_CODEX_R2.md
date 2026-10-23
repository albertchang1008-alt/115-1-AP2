# 給 Claude 的摘要
- 九份腳本：70處文字修訂＋2處題前位置調整，共72筆，[逐處原句→新句](CHANGELOG.md)。
- PASS：11條裁決文件處理完成；原30個缺資訊關卡全補，17個生詞補先認識，7個指定洩答提示改引導。
- R2只覆核改句：有據101句、程序11句；未標※的無據0、矛盾0；※部分獨立列出，未冒稱教師核可。
- PASS：原下降枝歧義已排除；確認題維持38題，文件層面的正解不唯一疑點0；①②原句／數目未改。
- 新增※12個標記：kidney N02；nephron開場、N01（先認識／提示）、N02、N03、N06。
- 新增※續：filtration N02；urine N02、N04（標題／題幹）；electrolyte N03。
- ※現存共26處：原水管比喻移到先認識；electrolyte N04舊口訣隨洩答提示移除，生理事實保留在先認識。
- 偏離：無；①②依序解鎖、實際版面與新手操作仍屬下一輪實作，不宣稱已驗前端。
- 抽查5組：過濾結語／壓力；下降枝ABC；30處先教再問；7處提示；新增※待教師清單。
- 停點：#6j停-等Antigravity，改後可讀性複查，再交Claude抽查及教師核可。

## 本輪範圍與結果的限制

依 `CODEX_TASK_scripts9-revise_2026-10-21.md` 的11條裁決修訂；讀取R1事實覆核及Antigravity可讀性覆核，保留兩份原報告。只改九份腳本與本輪文件。根目錄分支 `feature/respiratory-infographics` 的既有未提交工作保留，未commit、push、build、發布或更改apply.json／卡片／Excel。

事實來源仍為31張reviewed卡，frontmatter與唯一進度列皆為reviewed；原54個節點concept的139組不同uid＋引文重新核對存在。原來源檔SHA與R1相同。補寫文字不等於宣稱逐字抄課本：下面附每個改句的卡uid與卡內逐字片段，白話定義／生活比喻沒有完整卡據時依裁決4標※、另列待教師；不能用這些※當通過來源審查的證據。

`plasma`、`intestinal-villi` 另查為draft／awaiting_teacher_review，本輪**未引用**；血漿液體部分與刷狀緣突起的白話定義保留※。未改任何reviewed狀態。mEq的「數字越大代表越濃」依裁決10加註，同時限定同一種離子與相同單位，保留價數及與滲透粒子數不同的說明，不使用卡片尚待確認的換算式。

改句的生理內容由本次重新逐句判讀；腳本驗證程式只負責引用存在、狀態、覆蓋、行號、規則與未改動檢查，**不會因找到相同字詞就自動判事實正確**。本輪沒有程式變更，不跑或聲稱通過UI／npm測試，亦不以任何skip避過檢查。

## 11條裁決逐條交付

| 裁決 | 完成內容 | 結果 |
|---|---|---|
| 1 | 過濾結語改為血液中的水與可通過小分子過濾；血球與白蛋白留血；後半菊糖原句保留。 | PASS |
| 2 | 下降枝題幹不動；A水可過，B鹽可過但水不行，C兩者都不行。卡明寫水可通過，B/C均不對，A唯一。 | PASS |
| 3 | 靜水壓全限定為「腎絲球（微血管內）的靜水壓」；營養限定葡萄糖／胺基酸正常情況；下降枝提示改問水少後濃／稀。 | PASS |
| 4 | 只留蛋白質被擋、水移向多粒子側；刪未據穿透與水位上升。U形／快直情境保留※；未有據定義也標※。 | PASS；※另待教師 |
| 5 | kidney N02及filtration N04各有三卡完整一句回饋，事實只用同節點concept。 | PASS |
| 6 | 原30個缺資訊關卡逐項補題前先認識；水鈉N01／N02原在問題後的先認識亦移到問題前。 | PASS，30/30 |
| 7 | 17個摘要生詞補白話、位置或功能；菊糖／PAH以可核對的用途說明，不自行加未列卡的完整化學名稱。 | PASS；部分定義※另列 |
| 8 | 指定7處提示改為指出看哪裡、回想什麼；另把過濾N04水管比喻移到先認識，提示只引導力的來源與方向。 | PASS |
| 9 | tubular N04補上裁決指定的完整問題句。 | PASS |
| 10 | mOsm/L、mEq/L首次出現加指定註解，mEq仍保留價數／同種離子比較條件。 | PASS |
| 11 | 不改①②原句、數目；依序解鎖留實作執行，現有DECISIONS規則不另改。 | 文件PASS；UI未實作 |

## 30個缺資訊關卡逐項閉合

下列原缺口以R1原行為準；把事實補在問題前，不把事後答錯回饋當先教。每列新先認識全文在變更紀錄及逐句表，位置已重新核對。補事實後，配對／看圖應用仍需實作呈現對應圖；本輪不冒充實際學生試做。

| 腳本／關 | R1缺口 | 修訂後題前依據及新行 | 對應改動 | 結果 |
|---|---|---|---|---|
| kidney-anatomy N01 | 缺資訊：肝在右不等於學生已知會讓右腎較低；缺高度因果。；可推：答對說明已給後腹腔與右低。 | L7：- **先認識：** 後腹腔＝腹部後側、腹膜後面的空間。圖上標有「身體右側／左側」，請不要用螢幕的左右來判斷。腎臟位於脊柱兩側；肝臟相關位置使右腎較左腎低。 | C001 | 已補，可由先認識及前關作答 |
| kidney-anatomy N03 | 可推：動作直接給乳頭→小→大→盂順序。；缺資訊：前兩關未說腎盂接輸尿管；不能用答錯回饋當前置。 | L34：- **先認識：** 腎盂位於靠近腎門的收集部，接輸尿管；輸尿管再把尿送到膀胱。 | C005 | 已補，可由先認識及前關作答 |
| kidney-anatomy N04 | 可推：動作①直接給包膜順序。動作②缺資訊：此前未教腎門。；動作②沒有另確認題；正解腎門有據但首答不可推。 | L46：- **先認識：** 腎臟外圍由內到外依次為腎被膜、脂肪囊、腎筋膜；內側凹入處為腎門。腎柱是在腎臟裡面、深入腎錐體間的皮質。 | C006 | 已補，可由先認識及前關作答 |
| kidney-anatomy N05 | 缺資訊：提示只辨腎，輸尿管／尿道與儲存分工未先教；動作②廢物／營養分類也未先教。；動作②正解廢物三項有據；需另補前置。 | L55：- **先認識：** 腎形成尿液；輸尿管把尿送到膀胱，膀胱暫存尿液，尿道把尿排至體外。尿素、尿酸、肌酸酐是腎會排出的代謝廢物；肌酸酐與肌肉代謝有關。葡萄糖、胺基酸正常可被全部回收。 | C008 | 已補，可由先認識及前關作答 |
| kidney-anatomy N06 | 缺資訊：只可由字面配紅血球生成素；腎素與活化D剩兩項不能唯一配對。；可推：本關答對說明已給腎素配血壓。 | L63：- **先認識：** 腎素啟動 RAAS（腎素—血管收縮素—醛固酮系統），這條連鎖反應調節血壓；紅血球生成素促進紅血球生成；腎將維生素 D 轉為具活性的形式，參與鈣調節。 | C009 | 已補，可由先認識及前關作答 |
| nephron-circulation N02 | 可推：圖上長環配交界提示可選近髓質。；缺資訊：未教多數為皮質型，也未教兩型小體均在皮質；A、B、C須靠外部知識排除。 | L15：- **先認識：** 亨利氏環＝腎小管往下延伸、再折返的一段。※ 皮質腎元佔大多數；近髓質腎元靠近皮質與髓質交界。皮質腎元的環較短，近髓質腎元的環較長、深入髓質；兩型腎小體都在皮質。 | C012 | 已補，可由先認識及前關作答 |
| filtration-clearance N01 | 可推：先認識說鮑氏囊接收濾液，得由血至囊。；缺資訊：未教皮質的腎小體定位；若必須先讀腎臟篇，需明列先修。 | L7：- **先認識：** 鮑氏囊＝包住腎絲球、接住濾出液體的囊。腎小體由腎絲球與鮑氏囊組成，位於皮質；血液中的水和可以通過的溶質經過濾膜進入鮑氏囊。 | C017 | 已補，可由先認識及前關作答 |
| filtration-clearance N02 | 缺資訊：提示只決定內皮在前，基底膜與足細胞的先後還無法唯一排。；附條件：動作完成圖若保留三層可排除壁層；不可只靠未顯示的卡片。 | L18：- **先認識：** 過濾膜從血液側依序是微血管內皮、基底膜、鮑氏囊臟層足細胞。白話認圖：內皮是血管的內襯，基底膜在中間；足細胞是囊靠腎絲球那側（臟層）的細胞，壁層是囊的外壁。※ 鮑氏囊壁層不構成三層過濾膜。 | C018 | 已補，可由先認識及前關作答 |
| filtration-clearance N03 | 缺資訊：大小提示未教白蛋白／血球相對大小，葡萄糖、胺基酸可過濾也未先教。；缺資訊：答對後已知濾液無血球，但未教「血漿本來無血球」，A對B仍需外部知識。 | L30：- **先認識：** 白蛋白是本關要辨認的血漿蛋白；正常濾液不含血球及白蛋白，水、葡萄糖、胺基酸與小分子溶質可以過濾。血漿本來就不包含血球，比較血漿和濾液時，要看蛋白質的差別。 | C019 | 已補，可由先認識及前關作答 |
| filtration-clearance N04 | 缺資訊：水壓比喻未交代囊內壓反向及蛋白膠體壓；三卡不能唯一分完。；無確認；三種方向有據。 | L41：- **先認識：** 腎絲球（微血管內）的靜水壓，像水管裡往外推的水壓。※ 這股力量把水推進鮑氏囊；囊內壓是囊內液體對抗過濾的壓力。血漿膠體壓可想成血漿蛋白質把水拉回血管的力量，會對抗過濾。 | C021 | 已補，可由先認識及前關作答 |
| filtration-clearance N05 | 缺資訊：提示只說U與V都跟尿有關，無法區分濃度與尿量。；缺資訊：公式和三符號定義不等於清除率的血漿體積意義，正解要先教。 | L50：- **先認識：** 清除率 C＝U×V／P，代表每分鐘排除某物質所相當的血漿體積。U 是尿中濃度，V 是每分鐘尿量，P 是血漿濃度；清除率不是每分鐘尿量本身。 | C025 | 已補，可由先認識及前關作答 |
| tubular-handling N01 | 缺資訊：提示只給再吸收方向，過濾與分泌的起迄未先分清；開場只概括回收與送入。；可推：答對說明已給分泌方向。 | L7：- **先認識：** 管液＝腎小管裡的液體，之後會變成尿。過濾把物質由血液移入鮑氏囊；再吸收把管液中的物質送回血液；分泌把血液中的物質送入管液。 | C028 | 已補，可由先認識及前關作答 |
| tubular-handling N03 | 缺資訊：只說營養／廢物，尿素部分與肌酸酐不回收仍不能推。；缺資訊：此前未教水依滲透回收。 | L28：- **先認識：** 葡萄糖、胺基酸正常可全部回收；尿素部分回收，肌酸酐不被再吸收。尿素和肌酸酐是代謝廢物，肌酸酐與肌肉代謝有關。水主要依滲透作用回收，也就是水移向溶質較多的地方。 | C029 | 已補，可由先認識及前關作答 |
| tubular-handling N05 | 附條件：後段提示及兩個已列名稱可定位，但需要圖有分段。動作②醛固酮促鉀分泌未先教。；缺資訊：若只給答錯回饋，正確首答者仍未見前段大量回收與後段調整；需明確成功後保留說明。 | L47：- **先認識：** K⁺ 是鉀離子。鉀在小管前段大量回收，最後尿鉀仍受後段分泌調整；遠曲小管與集尿管可把鉀分泌到管液。醛固酮是調節鈉、鉀處理的激素，促進鈉再吸收，同時增加鉀分泌。 | C032 | 已補，可由先認識及前關作答 |
| tubular-handling N06 | 附條件：曾有水被回收，提示可引導濃縮，但「濃度」與「量」尚需區分。；缺資訊：清除率未在本份先教，GFR只臨時給單位；必須明列過濾清除率篇先修。 | L58：- **先認識：** 濃度與排出的物質量不同；水回收也會使尿液變濃，不一定是另加物質進去。GFR＝腎絲球過濾率，指每分鐘形成的濾液體積；清除率是每分鐘排除某物質所相當的血漿體積，兩者可用 mL/min 比較。物質排泄量則是物質量／時間。 | C034 | 已補，可由先認識及前關作答 |
| urine-concentration N01 | 可推：先認識＋提示給濃度梯度和管壁通水兩條件。；缺資訊：答對說明未給1200／四倍，數值無從推。 | L7：- **先認識：** 滲透＝水會往溶質（鹽、尿素等）比較多的地方移動。髓質梯度＝腎髓質越深越濃。※ ADH＝抗利尿激素，可增加集尿管對水的通透性。濃尿可達 1200 mOsm/L（數字越大代表越濃），約為血漿的四倍；mOsm/L 是本關比較滲透濃度的單位。 | C035 | 已補，可由先認識及前關作答 |
| urine-concentration N04 | 附條件：靠比喻可推慢流減少帶走，但U形的獨立依據缺。；缺資訊：此前未命名逆流「交換」與「增強」，只能猜名詞。 | L47：- **先認識：** 亨利氏環的逆流增強裝置維持髓質高張環境；直血管以緩慢的逆流交換減少髓質溶質流失。「逆流」先理解成液體沿相反方向流動。 | C039 | 已補，可由先認識及前關作答 |
| urine-concentration N05 | 可推：開關動畫若明示新增水通道，且N01已講通水可答。；缺資訊：腦下垂體後葉從未在本份先認識、提示或成功說明出現。 | L58：- **先認識：** ADH 是抗利尿激素。水不足時，腦下垂體後葉釋放 ADH；它增加水通道，讓水沿髓質梯度再吸收，形成濃尿。 | C042 | 已補，可由先認識及前關作答 |
| urine-concentration N06 | 可推：承N01高張髓質，N05增加水通道可配有ADH濃尿。；缺資訊：本份未先教醛固酮回鈉；若需水鈉篇先修，必須明列。 | L69：- **先認識：** 這裡把髓質高滲透梯度維持相同，只比較末端能不能讓水通過。ADH 直接調整水的通透性；醛固酮主要促進鈉再吸收，水可隨滲透作用回收，兩者保水方式不同。 | C043 | 已補，可由先認識及前關作答 |
| urinary-route-micturition N02 | 附條件：三部位提示須配有清楚血管定位的圖。；缺資訊：答對說明沒給長度25–30；3.8／20還是下一關以後才教。 | L15：- **先認識：** 輸尿管長約 25–30 cm。髂外動脈及靜脈，就是本圖中與輸尿管交叉的血管；課本列出的三處狹窄在腎盂交接、髂外動靜脈交叉、進入膀胱處。 | C045 | 已補，可由先認識及前關作答 |
| urinary-route-micturition N03 | 可推：動作直接給三口。動作②逼尿肌名稱及功能未先教。；缺資訊：未先教三肌類型及外括約肌隨意控制，不能由肌名推骨骼肌。 | L26：- **先認識：** 膀胱三角由兩個輸尿管口和一個尿道內口圍成。逼尿肌是膀胱壁的平滑肌；內尿道括約肌也是平滑肌，外尿道括約肌是骨骼肌，能由意識控制。 | C046 | 已補，可由先認識及前關作答 |
| urinary-route-micturition N04 | 可推：只有兩數字，男性長可唯一放置；動作②直接給順序。；缺資訊：此前未教陰部神經，不能用事後回饋當來源。 | L38：- **先認識：** 女性尿道約 3.8 cm，男性約 20 cm。男性尿道由內到外依序是前列腺部、膜部、陰莖部；膜部是這三段中位於前列腺部與陰莖部之間的一段。陰部神經是控制外尿道括約肌的神經，該肌肉屬骨骼肌。 | C047 | 已補，可由先認識及前關作答 |
| urinary-route-micturition N05 | 可推：滑桿約300＋袋子擠出口開比喻支持肌肉方向。；缺資訊：副交感S2–S4與交感分工首次出現在確認／錯誤回饋。 | L49：- **先認識：** 骨盆副交感神經（S2–S4）促使逼尿肌收縮、內括約肌鬆弛；儲尿時交感神經促使相反反應。陰部神經控制外尿道括約肌，這是能由意識控制的出口肌肉。 | C048 | 已補，可由先認識及前關作答 |
| urinary-route-micturition N06 | 附條件：幾乎全水能排除50%，可選第一組；但1–2L並未獨立先教。；缺資訊：稻草色與剛排透明沒有先教。 | L63：- **先認識：** 健康成人每日尿量約 1–2 L，水分約佔 95%。剛排出的正常尿呈稻草色、透明；放久後可因細菌作用變混濁。 | C049 | 已補，可由先認識及前關作答 |
| fluid-compartments N01 | 可推：三選項中只有60%超過一半。；缺資訊：此前只遇體重分母，還未介紹總水量／外液分母差異。 | L7：- **先認識：** 課本標準例子的總水量約佔體重 60%。看比例要先辨認分母：是體重、總水量，還是細胞外液；同一百分比用不同總量作基準，意思不同。 | C050 | 已補，可由先認識及前關作答 |
| water-sodium-regulation N01 | 可推：喝、食物、自己產水對出去三項可辨。；缺資訊：未先給各項數值或總2500，不能靠名稱推平均量。 | L7：- **先認識：** 代謝水＝身體分解養分時自己產生的水。※ 課本每日攝取的平衡例為飲入液體 1500 mL、食物含水 800 mL、代謝水 200 mL，合計約 2500 mL。 | C054 | 已補，可由先認識及前關作答 |
| water-sodium-regulation N02 | 可推：題幹直接給四器官配對。；缺資訊：前文只給來源／去路，沒有先說正常收支平衡。 | L18：- **先認識：** 無知覺蒸散＝在不知不覺中，從皮膚和呼吸流失的水。※ 課本將皮膚無知覺蒸散和流汗分開列，肺另列呼氣失水；正常時液體的攝取與排出維持平衡。 | C055 | 已補，可由先認識及前關作答 |
| water-sodium-regulation N03 | 可推：選項與一進一出提示可得口渴／ADH。；缺資訊：鈉總量與濃度之別尚未先教。 | L28：- **先認識：** ADH＝抗利尿激素，水不足時由腦下垂體後葉釋放，可增加保水；口渴增加水的攝取。鈉的總量是有多少鈉，鈉濃度則是鈉量與水量的比例，兩者不能當同一件事。 | C056 | 已補，可由先認識及前關作答 |
| water-sodium-regulation N05 | 可推：兩配對做法在腳本明列且抗利尿名字可配水。；缺資訊：本份未先教鉀分泌，題幹保鈉不能推排鉀。 | L46：- **先認識：** 醛固酮是調節鈉、鉀處理的激素，促進遠端鈉再吸收，同時增加鉀分泌；分泌是從血液送入管液。ADH 直接增加遠端與集尿管對水的通透性。 | C058 | 已補，可由先認識及前關作答 |
| electrolyte-balance N06 | 可推：提示已給細胞內主要電解質。動作②活化酶不能由此推出。；缺資訊：兩種神經反應方向尚未先教；成功文字也沒有列。 | L52：- **先認識：** Mg²⁺ 是鎂離子，是細胞內主要電解質之一；可活化醣類與蛋白質代謝的酶。低血鎂與高血鎂的神經反應方向不同。 | C068 | 已補，可由先認識及前關作答 |

## 17個生詞與7處提示核對

| 生詞 | 題前位置 |
|---|---|
| 基底膜 | filtration-clearance N02 先認識 |
| 足細胞 | filtration-clearance N02 先認識 |
| 壁層 | filtration-clearance N02 先認識 |
| 臟層 | filtration-clearance N02 先認識 |
| 微血管內皮 | filtration-clearance N02 先認識 |
| 膠體壓 | filtration-clearance N04 先認識 |
| 菊糖 | filtration-clearance N06 先認識 |
| PAH | filtration-clearance N06 先認識 |
| 亨利氏環 | nephron-circulation N02 先認識 |
| 近腎絲球細胞 | nephron-circulation N05 先認識 |
| 緻密斑 | nephron-circulation N05 先認識 |
| 醛固酮 | tubular-handling N05 先認識 |
| 髂外動脈及靜脈 | urinary-route-micturition N02 先認識 |
| 膜部 | urinary-route-micturition N04 先認識 |
| 陰部神經 | urinary-route-micturition N04 先認識 |
| mEq/L | electrolyte-balance N03 先認識 |
| 價數 | electrolyte-balance N03 先認識 |

| 提示位置 | 新提示原句 |
|---|---|
| kidney-anatomy N02 | 「先看切面的外圈和內部，再沿著外圈的組織找它往裡延伸到哪裡；回看先認識的三個名稱。」 |
| kidney-anatomy N04 | 「從貼著腎臟表面的地方往外看，對照先認識的包覆順序；內側凹入處是另一個位置，別混在保護層裡。」 |
| nephron-circulation N06 | 「先辨認圖上兩層各代表什麼，再想這個流量要把整管都算進去，還是只算其中一部分；回看先認識。」 |
| tubular-handling N05 | 「沿圖上的管液流向，回看先認識中『最後調整』的功能，再把它對到兩個管段。」 |
| electrolyte-balance N04 | 「回想體液那份：細胞外液和細胞內液，各以哪種離子較多？」 |
| electrolyte-balance N05 | 「回看先認識中細胞外液的離子分工，再把卡片名稱和作用對起來。」 |
| electrolyte-balance N06 | 「回看先認識：先分清鎂分布的位置，再把它參與的工作和選項比對。」 |

裁決3指定的tubular N03提示仍保留「葡萄糖、胺基酸這些營養，正常會全部拿回」；這是裁決要求的特定改句，不擴大成全部營養。這個指定句與裁決8要求改的7個洩答提示分開處理，未自行改掉裁決原意。

## ※總表（所有26處，含新增12處）

「新增」指這個位置本輪新增標記；腎元開場／N01及尿濃縮N04標題／題幹有重複標同一範圍，因此12個新增標記是10組內容。慢速逆流交換本身有卡據，U形與快直反事實另待教師。下列沒有相反卡句者寫「未見衝突」，不等於有據或教師已核可。

| 位置 | 新增／保留 | 帶※的原句 | 改動編號 | 與卡片衝突？ |
|---|---|---|---|---|
| kidney-anatomy L20 N02 | 新增 | - **先認識：** 腎錐體＝髓質裡一個個三角形的構造，有 8–18 個。※ 腎臟切面外為皮質、內為髓質；皮質伸入腎錐體間的部分稱腎柱。 | C002 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| kidney-anatomy L57 N05 | 保留／隨原句調整 | - **💡提示：**「只有一個器官會『做』尿，其他三個是管子或袋子。」※ | 原稿保留 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| nephron-circulation L4 開場 | 新增 | 「腎臟裡有很多製造尿液的小單位，叫做『腎元』。※ 血液怎麼流進腎臟？腎臟又怎麼知道血壓變低了？6 關之後你就知道。」〔開始〕 | C070 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| nephron-circulation L7 N01 | 新增 | - **先認識：** 腎元＝腎臟製造尿液的基本單位。※ 腎元由腎小體與腎小管構成；腎小體包括腎絲球與鮑氏囊。腎盂、腎盞是收集尿液的構造。 | C010 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| nephron-circulation L9 N01 | 新增 | - **💡提示：**「腎小體是圓球那一端，腎小管是後面長長的管子。」※ | C011 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| nephron-circulation L15 N02 | 新增 | - **先認識：** 亨利氏環＝腎小管往下延伸、再折返的一段。※ 皮質腎元佔大多數；近髓質腎元靠近皮質與髓質交界。皮質腎元的環較短，近髓質腎元的環較長、深入髓質；兩型腎小體都在皮質。 | C012 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| nephron-circulation L26 N03 | 新增 | - **先認識：** 刷狀緣＝細胞表面密密麻麻的小突起（微絨毛）。※ 近曲小管是有刷狀緣的立方上皮；遠曲小管也是立方上皮，但沒有明顯微絨毛。亨利氏環薄段是扁平上皮。 | C013 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| nephron-circulation L54 N06 | 新增 | - **先認識：** 血漿是血液裡的液體部分。※ 腎血流計整體血流，腎血漿流量只計其中的血漿部分。 | C015 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| filtration-clearance L4 開場 | 保留／隨原句調整 | 「腎臟像一個濾網：把血液裡的水和小東西濾出來，大的留在血液裡。※ 6 關之後，你會知道什麼過得去、什麼過不去，也會知道醫護人員怎麼用『清除率』看腎臟的工作量。」〔開始〕 | 原稿保留 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| filtration-clearance L18 N02 | 新增 | - **先認識：** 過濾膜從血液側依序是微血管內皮、基底膜、鮑氏囊臟層足細胞。白話認圖：內皮是血管的內襯，基底膜在中間；足細胞是囊靠腎絲球那側（臟層）的細胞，壁層是囊的外壁。※ 鮑氏囊壁層不構成三層過濾膜。 | C018 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| filtration-clearance L41 N04 | 移位（原水管比喻由提示移至先認識） | - **先認識：** 腎絲球（微血管內）的靜水壓，像水管裡往外推的水壓。※ 這股力量把水推進鮑氏囊；囊內壓是囊內液體對抗過濾的壓力。血漿膠體壓可想成血漿蛋白質把水拉回血管的力量，會對抗過濾。 | C021 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| tubular-handling L30 N03 | 保留／隨原句調整 | - **💡提示：**「葡萄糖、胺基酸這些營養，正常會全部拿回；廢物不一定。」※ | C030 | 已限葡萄糖／胺基酸、正常條件；有TR1支持特定事實，原※仍保留教師確認。 |
| tubular-handling L42 N04 | 保留／隨原句調整 | - **💡提示：**「搬運工一次只能搬那麼多，多出來的就留下了。」※ | 原稿保留 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| urine-concentration L4 開場 | 保留／隨原句調整 | 「天氣熱、喝水少時，尿會變黃又少；喝很多水時，尿又多又淡。※ 腎臟怎麼做到的？6 關之後你就知道。」〔開始〕 | 原稿保留 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| urine-concentration L7 N01 | 保留／隨原句調整 | - **先認識：** 滲透＝水會往溶質（鹽、尿素等）比較多的地方移動。髓質梯度＝腎髓質越深越濃。※ ADH＝抗利尿激素，可增加集尿管對水的通透性。濃尿可達 1200 mOsm/L（數字越大代表越濃），約為血漿的四倍；mOsm/L 是本關比較滲透濃度的單位。 | C035 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| urine-concentration L22 N02 | 新增 | - **先認識：** 亨利氏環是腎小管向下延伸再折返的一段。※ 下降枝可通水、對溶質通透差；水移出後管液會變濃。 | C036 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| urine-concentration L46 N04 | 新增 | ## 第 4 關｜直血管為什麼彎成 U 形？※ | C040 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| urine-concentration L48 N04 | 新增 | - **問題：**「直血管彎成 U 形，而且血流得很慢。這樣有什麼好處？」〔減少髓質的溶質被血液帶走〕〔把尿運出去〕※ | C041 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| urine-concentration L49 N04 | 保留 | - **💡提示：**「如果血液又快又直地穿過去，髓質的鹽會怎樣？」※ | 原稿保留 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| urinary-route-micturition L54 N05 | 保留／隨原句調整 | - **💡提示：**「要把尿擠出去：袋子要擠緊，出口要打開。」※ | 原稿保留 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| fluid-compartments L4 開場 | 保留／隨原句調整 | 「你的身體有一大半是水。這些水分別放在哪裡？6 關之後，你能把身體的水分成幾個『水箱』，並算出各裝多少。※」〔開始〕 | 原稿保留 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| water-sodium-regulation L7 N01 | 保留／隨原句調整 | - **先認識：** 代謝水＝身體分解養分時自己產生的水。※ 課本每日攝取的平衡例為飲入液體 1500 mL、食物含水 800 mL、代謝水 200 mL，合計約 2500 mL。 | C054,C071 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| water-sodium-regulation L18 N02 | 保留／隨原句調整 | - **先認識：** 無知覺蒸散＝在不知不覺中，從皮膚和呼吸流失的水。※ 課本將皮膚無知覺蒸散和流汗分開列，肺另列呼氣失水；正常時液體的攝取與排出維持平衡。 | C055,C072 | 皮膚＋呼吸的名詞範圍未有完整卡據；卡表肺另列，文字並列說清楚，不裁成生理矛盾。 |
| water-sodium-regulation L20 N02 | 保留／隨原句調整 | - **💡提示：**「呼氣也會帶走水氣，冬天對著窗戶哈氣就看得到。」※ | 原稿保留 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |
| electrolyte-balance L17 N02 | 保留／隨原句調整 | - **先認識：** 本圖把半透膜當作水可以通過、溶質不能通過的膜。※ 這是本圖的模型約定，不是所有生物膜都相同。 | C061 | 限本圖的理想半透膜，不外推全部生物膜。 |
| electrolyte-balance L28 N03 | 新增 | - **先認識：** mEq/L（數字越大代表越濃）是把離子帶幾個電荷（價數）也算進去的濃度單位；比較時要用同一種離子、相同單位。價數先理解成一個離子帶電荷的數目。※ mEq/L 和滲透粒子數不是同一件事，不能把兩者當成同一種數法。 | C063 | 未見與相關卡相反；完整白話／比喻或模型另待教師核可。 |

## 改句逐句事實覆核

70處文字修訂拆成127個有變化的句段／選項；2處純移位不重算句子。未改過的原句不重做全稿判讀。生理內容有據101，無據0、矛盾0；程序11，※句段15另列。這是本次修改範圍的結果，不能把※或未改稿段一併宣稱全稿來源零問題。

「有據」引文均在後面的卡片片段表；對含※的整句只列※待教師，沒有把相鄰有據事實偷算成全句通過。確認題的B/C是刻意錯項，判定的是錯項設計有依據，並非把其字面當生理真話。

| 改動／新行 | 改後句段原文 | 判定／範圍 | uid及原句索引 | 核對說明 |
|---|---|---|---|---|
| C001.3 kidney-anatomy:L7 | 腎臟位於脊柱兩側；肝臟相關位置使右腎較左腎低。 | 有據 | [KP1](#e-kp1) `kidney-position`<br>[KP2](#e-kp2) `kidney-position` | 補在作答前；提示不代替先認識。 |
| C002.1 kidney-anatomy:L20 | - **先認識：** 腎錐體＝髓質裡一個個三角形的構造，有 8–18 個。※ | ※另列 | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C002.2 kidney-anatomy:L20 | 腎臟切面外為皮質、內為髓質；皮質伸入腎錐體間的部分稱腎柱。 | 有據 | [KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure` | 保留錐體白話形狀並標※；構造位置由卡片補在題前。 |
| C003.1 kidney-anatomy:L22 | - **💡提示：**「先看切面的外圈和內部，再沿著外圈的組織找它往裡延伸到哪裡；回看先認識的三個名稱。」 | 程序 | [KS1](#e-ks1) `kidney-structure` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C004.1 kidney-anatomy:L24 | - **答錯（皮質卡）：**「腎臟切面外為皮質。」 | 有據 | [KS1](#e-ks1) `kidney-structure` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C004.2 kidney-anatomy:L24 | - **答錯（髓質卡）：**「腎臟切面內為髓質。」 | 有據 | [KS1](#e-ks1) `kidney-structure` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C004.3 kidney-anatomy:L24 | - **答錯（腎柱卡）：**「皮質伸入腎錐體間的部分稱腎柱。」 | 有據 | [KS1](#e-ks1) `kidney-structure` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C005.1 kidney-anatomy:L34 | - **先認識：** 腎盂位於靠近腎門的收集部，接輸尿管；輸尿管再把尿送到膀胱。 | 有據 | [KS1](#e-ks1) `kidney-structure`<br>[UP1](#e-up1) `urine-pathway` | 補在作答前；提示不代替先認識。 |
| C006.1 kidney-anatomy:L46 | - **先認識：** 腎臟外圍由內到外依次為腎被膜、脂肪囊、腎筋膜；內側凹入處為腎門。 | 有據 | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position`<br>[KS1](#e-ks1) `kidney-structure` | 補在作答前；提示不代替先認識。 |
| C006.2 kidney-anatomy:L46 | 腎柱是在腎臟裡面、深入腎錐體間的皮質。 | 有據 | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position`<br>[KS1](#e-ks1) `kidney-structure` | 補在作答前；提示不代替先認識。 |
| C007.1 kidney-anatomy:L49 | - **💡提示：**「從貼著腎臟表面的地方往外看，對照先認識的包覆順序；內側凹入處是另一個位置，別混在保護層裡。」 | 程序 | [KS2](#e-ks2) `kidney-structure`<br>[KP3](#e-kp3) `kidney-position` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C008.1 kidney-anatomy:L55 | - **先認識：** 腎形成尿液；輸尿管把尿送到膀胱，膀胱暫存尿液，尿道把尿排至體外。 | 有據 | [US1](#e-us1) `urinary-system-overview`<br>[US2](#e-us2) `urinary-system-overview`<br>[UP1](#e-up1) `urine-pathway`<br>[TR1](#e-tr1) `tubular-reabsorption`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C008.2 kidney-anatomy:L55 | 尿素、尿酸、肌酸酐是腎會排出的代謝廢物；肌酸酐與肌肉代謝有關。 | 有據 | [US1](#e-us1) `urinary-system-overview`<br>[US2](#e-us2) `urinary-system-overview`<br>[UP1](#e-up1) `urine-pathway`<br>[TR1](#e-tr1) `tubular-reabsorption`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C008.3 kidney-anatomy:L55 | 葡萄糖、胺基酸正常可被全部回收。 | 有據 | [US1](#e-us1) `urinary-system-overview`<br>[US2](#e-us2) `urinary-system-overview`<br>[UP1](#e-up1) `urine-pathway`<br>[TR1](#e-tr1) `tubular-reabsorption`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C009.1 kidney-anatomy:L63 | - **先認識：** 腎素啟動 RAAS（腎素—血管收縮素—醛固酮系統），這條連鎖反應調節血壓；紅血球生成素促進紅血球生成；腎將維生素 D 轉為具活性的形式，參與鈣調節。 | 有據 | [KE1](#e-ke1) `kidney-endocrine`<br>[RA0](#e-ra0) `renin-angiotensin-aldosterone` | 補在作答前；提示不代替先認識。 |
| C010.1 nephron-circulation:L7 | - **先認識：** 腎元＝腎臟製造尿液的基本單位。※ | ※另列 | [NH1](#e-nh1) `nephron-histology`<br>[NH2](#e-nh2) `nephron-histology`<br>[KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[KS3](#e-ks3) `kidney-structure` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C010.2 nephron-circulation:L7 | 腎元由腎小體與腎小管構成；腎小體包括腎絲球與鮑氏囊。 | 有據 | [NH1](#e-nh1) `nephron-histology`<br>[NH2](#e-nh2) `nephron-histology`<br>[KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[KS3](#e-ks3) `kidney-structure` | 補在作答前；提示不代替先認識。 |
| C010.3 nephron-circulation:L7 | 腎盂、腎盞是收集尿液的構造。 | 有據 | [NH1](#e-nh1) `nephron-histology`<br>[NH2](#e-nh2) `nephron-histology`<br>[KS1](#e-ks1) `kidney-structure`<br>[KS2](#e-ks2) `kidney-structure`<br>[KS3](#e-ks3) `kidney-structure` | 補在作答前；提示不代替先認識。 |
| C011.1 nephron-circulation:L9 | - **💡提示：**「腎小體是圓球那一端，腎小管是後面長長的管子。」※ | ※另列 | [NH1](#e-nh1) `nephron-histology`<br>[NH2](#e-nh2) `nephron-histology` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C012.1 nephron-circulation:L15 | - **先認識：** 亨利氏環＝腎小管往下延伸、再折返的一段。※ | ※另列 | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C012.2 nephron-circulation:L15 | 皮質腎元佔大多數；近髓質腎元靠近皮質與髓質交界。 | 有據 | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 補在作答前；提示不代替先認識。 |
| C012.3 nephron-circulation:L15 | 皮質腎元的環較短，近髓質腎元的環較長、深入髓質；兩型腎小體都在皮質。 | 有據 | [NT1](#e-nt1) `nephron-types`<br>[NT2](#e-nt2) `nephron-types` | 補在作答前；提示不代替先認識。 |
| C013.1 nephron-circulation:L26 | - **先認識：** 刷狀緣＝細胞表面密密麻麻的小突起（微絨毛）。※ | ※另列 | [NH2](#e-nh2) `nephron-histology` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C013.2 nephron-circulation:L26 | 近曲小管是有刷狀緣的立方上皮；遠曲小管也是立方上皮，但沒有明顯微絨毛。 | 有據 | [NH2](#e-nh2) `nephron-histology` | 補在作答前；提示不代替先認識。 |
| C013.3 nephron-circulation:L26 | 亨利氏環薄段是扁平上皮。 | 有據 | [NH2](#e-nh2) `nephron-histology` | 補在作答前；提示不代替先認識。 |
| C014.1 nephron-circulation:L46 | - **先認識：** 管液是腎小管裡的液體。 | 有據 | [JG1](#e-jg1) `juxtaglomerular-apparatus`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus`<br>[UP1](#e-up1) `urine-pathway` | 補在作答前；提示不代替先認識。 |
| C014.2 nephron-circulation:L46 | 近腎絲球細胞在入球小動脈壁上，感受壓力並分泌腎素；緻密斑在遠曲小管，感受管液的鈉變化。 | 有據 | [JG1](#e-jg1) `juxtaglomerular-apparatus`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus`<br>[UP1](#e-up1) `urine-pathway` | 補在作答前；提示不代替先認識。 |
| C014.3 nephron-circulation:L46 | 血壓低或管液鈉低可促進腎素分泌。 | 有據 | [JG1](#e-jg1) `juxtaglomerular-apparatus`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus`<br>[UP1](#e-up1) `urine-pathway` | 補在作答前；提示不代替先認識。 |
| C015.1 nephron-circulation:L54 | - **先認識：** 血漿是血液裡的液體部分。※ | ※另列 | [RB1](#e-rb1) `renal-blood-flow` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C015.2 nephron-circulation:L54 | 腎血流計整體血流，腎血漿流量只計其中的血漿部分。 | 有據 | [RB1](#e-rb1) `renal-blood-flow` | 血漿白話定義標※；未使用尚未reviewed的plasma卡。 |
| C016.1 nephron-circulation:L56 | - **💡提示：**「先辨認圖上兩層各代表什麼，再想這個流量要把整管都算進去，還是只算其中一部分；回看先認識。」 | 程序 | [RB1](#e-rb1) `renal-blood-flow` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C017.2 filtration-clearance:L7 | 腎小體由腎絲球與鮑氏囊組成，位於皮質；血液中的水和可以通過的溶質經過濾膜進入鮑氏囊。 | 有據 | [GF1](#e-gf1) `glomerular-filtration`<br>[GF3](#e-gf3) `glomerular-filtration`<br>[NH2](#e-nh2) `nephron-histology` | 補在作答前；提示不代替先認識。 |
| C018.1 filtration-clearance:L18 | - **先認識：** 過濾膜從血液側依序是微血管內皮、基底膜、鮑氏囊臟層足細胞。 | 有據 | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 補在作答前；提示不代替先認識。 |
| C018.2 filtration-clearance:L18 | 白話認圖：內皮是血管的內襯，基底膜在中間；足細胞是囊靠腎絲球那側（臟層）的細胞，壁層是囊的外壁。※ | ※另列 | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C018.3 filtration-clearance:L18 | 鮑氏囊壁層不構成三層過濾膜。 | 有據 | [GF2](#e-gf2) `glomerular-filtration`<br>[GF4](#e-gf4) `glomerular-filtration` | 補在作答前；提示不代替先認識。 |
| C019.1 filtration-clearance:L30 | - **先認識：** 白蛋白是本關要辨認的血漿蛋白；正常濾液不含血球及白蛋白，水、葡萄糖、胺基酸與小分子溶質可以過濾。 | 有據 | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration`<br>[GR4](#e-gr4) `gfr-regulation` | 補在作答前；提示不代替先認識。 |
| C019.2 filtration-clearance:L30 | 血漿本來就不包含血球，比較血漿和濾液時，要看蛋白質的差別。 | 有據 | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[GF5](#e-gf5) `glomerular-filtration`<br>[GF6](#e-gf6) `glomerular-filtration`<br>[GR4](#e-gr4) `gfr-regulation` | 補在作答前；提示不代替先認識。 |
| C020.1 filtration-clearance:L42 | - **問題：**「請把三個壓力卡放到〔推進鮑氏囊〕或〔對抗過濾〕：腎絲球（微血管內）的靜水壓、囊內壓、血漿膠體壓。」 | 程序 | [GR1](#e-gr1) `gfr-regulation` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C021.1 filtration-clearance:L41 | - **先認識：** 腎絲球（微血管內）的靜水壓，像水管裡往外推的水壓。※ | ※另列 | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation`<br>[GR3](#e-gr3) `gfr-regulation` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C021.2 filtration-clearance:L41 | 這股力量把水推進鮑氏囊；囊內壓是囊內液體對抗過濾的壓力。 | 有據 | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation`<br>[GR3](#e-gr3) `gfr-regulation` | 原水管比喻移至先認識並限定微血管內；膠體壓依gfr-regulation教學講義補據。 |
| C021.3 filtration-clearance:L41 | 血漿膠體壓可想成血漿蛋白質把水拉回血管的力量，會對抗過濾。 | 有據 | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation`<br>[GR3](#e-gr3) `gfr-regulation` | 原水管比喻移至先認識並限定微血管內；膠體壓依gfr-regulation教學講義補據。 |
| C022.1 filtration-clearance:L43 | - **💡提示：**「先找每股力量從哪一側作用，再對照先認識，想它把水推進囊內，還是留在血液。」 | 程序 | [GR1](#e-gr1) `gfr-regulation` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C023.1 filtration-clearance:L44 | - **答對：**「腎絲球（微血管內）的靜水壓促進過濾；囊內壓和血漿膠體壓對抗過濾。」 | 有據 | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C024.1 filtration-clearance:L45 | - **答錯（腎絲球壓力卡）：**「腎絲球（微血管內）的靜水壓促進過濾。」 | 有據 | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C024.2 filtration-clearance:L45 | - **答錯（囊內壓卡）：**「囊內壓對抗過濾。」 | 有據 | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C024.3 filtration-clearance:L45 | - **答錯（血漿膠體壓卡）：**「血漿膠體壓對抗過濾。」 | 有據 | [GF7](#e-gf7) `glomerular-filtration`<br>[GR1](#e-gr1) `gfr-regulation` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C025.1 filtration-clearance:L50 | - **先認識：** 清除率 C＝U×V／P，代表每分鐘排除某物質所相當的血漿體積。 | 有據 | [RC1](#e-rc1) `renal-clearance` | 補在作答前；提示不代替先認識。 |
| C025.2 filtration-clearance:L50 | U 是尿中濃度，V 是每分鐘尿量，P 是血漿濃度；清除率不是每分鐘尿量本身。 | 有據 | [RC1](#e-rc1) `renal-clearance` | 補在作答前；提示不代替先認識。 |
| C026.1 filtration-clearance:L61 | - **先認識：** GFR＝腎絲球過濾率，指每分鐘形成的濾液體積。 | 有據 | [GR2](#e-gr2) `gfr-regulation`<br>[RC2](#e-rc2) `renal-clearance`<br>[US2](#e-us2) `urinary-system-overview`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C026.2 filtration-clearance:L61 | 菊糖在這裡是用來當過濾指標的物質，只過濾、不再吸收也不分泌；PAH 是兼具過濾與分泌、可用來估腎血漿流量的物質。 | 有據 | [GR2](#e-gr2) `gfr-regulation`<br>[RC2](#e-rc2) `renal-clearance`<br>[US2](#e-us2) `urinary-system-overview`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C026.3 filtration-clearance:L61 | 肌酸酐與肌肉代謝有關，不被再吸收，但有少量分泌。 | 有據 | [GR2](#e-gr2) `gfr-regulation`<br>[RC2](#e-rc2) `renal-clearance`<br>[US2](#e-us2) `urinary-system-overview`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C027.1 filtration-clearance:L75 | - **結語：**「血液中的水和可以通過的小分子，經三層過濾膜進入鮑氏囊；血球和白蛋白留在血液裡。 | 有據 | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[RC2](#e-rc2) `renal-clearance` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C027.2 filtration-clearance:L75 | 用菊糖的清除率可以知道 GFR。」 | 有據 | [GF1](#e-gf1) `glomerular-filtration`<br>[GF2](#e-gf2) `glomerular-filtration`<br>[RC2](#e-rc2) `renal-clearance` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C028.2 tubular-handling:L7 | 過濾把物質由血液移入鮑氏囊；再吸收把管液中的物質送回血液；分泌把血液中的物質送入管液。 | 有據 | [RH2](#e-rh2) `renal-handling`<br>[UP1](#e-up1) `urine-pathway` | 補在作答前；提示不代替先認識。 |
| C029.1 tubular-handling:L28 | - **先認識：** 葡萄糖、胺基酸正常可全部回收；尿素部分回收，肌酸酐不被再吸收。 | 有據 | [TR1](#e-tr1) `tubular-reabsorption`<br>[US2](#e-us2) `urinary-system-overview`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C029.2 tubular-handling:L28 | 尿素和肌酸酐是代謝廢物，肌酸酐與肌肉代謝有關。 | 有據 | [TR1](#e-tr1) `tubular-reabsorption`<br>[US2](#e-us2) `urinary-system-overview`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C029.3 tubular-handling:L28 | 水主要依滲透作用回收，也就是水移向溶質較多的地方。 | 有據 | [TR1](#e-tr1) `tubular-reabsorption`<br>[US2](#e-us2) `urinary-system-overview`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[US3](#e-us3) `urinary-system-overview` | 補在作答前；提示不代替先認識。 |
| C030.1 tubular-handling:L30 | - **💡提示：**「葡萄糖、胺基酸這些營養，正常會全部拿回；廢物不一定。」※ | ※另列 | [TR1](#e-tr1) `tubular-reabsorption` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C031.1 tubular-handling:L40 | - **問題：**「如果過濾出來的葡萄糖越來越多，超過腎小管回收的上限，會發生什麼事？」 | 程序 | [TR1](#e-tr1) `tubular-reabsorption` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C032.1 tubular-handling:L47 | - **先認識：** K⁺ 是鉀離子。 | 有據 | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 補在作答前；提示不代替先認識。 |
| C032.2 tubular-handling:L47 | 鉀在小管前段大量回收，最後尿鉀仍受後段分泌調整；遠曲小管與集尿管可把鉀分泌到管液。 | 有據 | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 補在作答前；提示不代替先認識。 |
| C032.3 tubular-handling:L47 | 醛固酮是調節鈉、鉀處理的激素，促進鈉再吸收，同時增加鉀分泌。 | 有據 | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 補在作答前；提示不代替先認識。 |
| C033.1 tubular-handling:L49 | - **💡提示：**「沿圖上的管液流向，回看先認識中『最後調整』的功能，再把它對到兩個管段。」 | 程序 | [K1](#e-k1) `potassium-secretion`<br>[K2](#e-k2) `potassium-secretion` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C034.1 tubular-handling:L58 | - **先認識：** 濃度與排出的物質量不同；水回收也會使尿液變濃，不一定是另加物質進去。 | 有據 | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling`<br>[RC1](#e-rc1) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 補在作答前；提示不代替先認識。 |
| C034.2 tubular-handling:L58 | GFR＝腎絲球過濾率，指每分鐘形成的濾液體積；清除率是每分鐘排除某物質所相當的血漿體積，兩者可用 mL/min 比較。 | 有據 | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling`<br>[RC1](#e-rc1) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 補在作答前；提示不代替先認識。 |
| C034.3 tubular-handling:L58 | 物質排泄量則是物質量／時間。 | 有據 | [RH3](#e-rh3) `renal-handling`<br>[RH4](#e-rh4) `renal-handling`<br>[RC1](#e-rc1) `renal-clearance`<br>[GR2](#e-gr2) `gfr-regulation` | 補在作答前；提示不代替先認識。 |
| C035.3 urine-concentration:L7 | ADH＝抗利尿激素，可增加集尿管對水的通透性。 | 有據 | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[CC3](#e-cc3) `countercurrent-mechanism`<br>[UC1](#e-uc1) `urine-concentration`<br>[AD2](#e-ad2) `adh-water-reabsorption`<br>[AD0](#e-ad0) `adh-water-reabsorption` | 補在作答前；提示不代替先認識。 |
| C035.4 urine-concentration:L7 | 濃尿可達 1200 mOsm/L（數字越大代表越濃），約為血漿的四倍；mOsm/L 是本關比較滲透濃度的單位。 | 有據 | [EO2](#e-eo2) `electrolyte-osmolarity`<br>[CC3](#e-cc3) `countercurrent-mechanism`<br>[UC1](#e-uc1) `urine-concentration`<br>[AD2](#e-ad2) `adh-water-reabsorption`<br>[AD0](#e-ad0) `adh-water-reabsorption` | 補在作答前；提示不代替先認識。 |
| C036.1 urine-concentration:L22 | - **先認識：** 亨利氏環是腎小管向下延伸再折返的一段。※ | ※另列 | [CC2](#e-cc2) `countercurrent-mechanism` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C036.2 urine-concentration:L22 | 下降枝可通水、對溶質通透差；水移出後管液會變濃。 | 有據 | [CC2](#e-cc2) `countercurrent-mechanism` | 補在作答前；提示不代替先認識。 |
| C037.1 urine-concentration:L26 | - **💡提示：**「水走了，管液裡的水變少，會變濃還是變稀？」 | 程序 | [CC2](#e-cc2) `countercurrent-mechanism` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C038.1 urine-concentration:L29 | - A 水可以通過（正） | 有據 | [CC2](#e-cc2) `countercurrent-mechanism` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C038.2 urine-concentration:L29 | - B 鹽可以通過，水不行 | 有據 | [CC2](#e-cc2) `countercurrent-mechanism` | 這是刻意設計的錯項；卡明定下降枝可通水，B與C所說水不能過皆錯，故A唯一。 |
| C038.3 urine-concentration:L29 | - C 兩者都不行 | 有據 | [CC2](#e-cc2) `countercurrent-mechanism` | 這是刻意設計的錯項；卡明定下降枝可通水，B與C所說水不能過皆錯，故A唯一。 |
| C039.1 urine-concentration:L47 | - **先認識：** 亨利氏環的逆流增強裝置維持髓質高張環境；直血管以緩慢的逆流交換減少髓質溶質流失。 | 有據 | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism`<br>[CC4](#e-cc4) `countercurrent-mechanism` | 補在作答前；提示不代替先認識。 |
| C039.2 urine-concentration:L47 | 「逆流」先理解成液體沿相反方向流動。 | 有據 | [CC1](#e-cc1) `countercurrent-mechanism`<br>[CC2](#e-cc2) `countercurrent-mechanism`<br>[CC4](#e-cc4) `countercurrent-mechanism` | 補在作答前；提示不代替先認識。 |
| C040.1 urine-concentration:L46 | ## 第 4 關｜直血管為什麼彎成 U 形？※ | ※另列 | [CC2](#e-cc2) `countercurrent-mechanism` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C041.2 urine-concentration:L48 | 這樣有什麼好處？」〔減少髓質的溶質被血液帶走〕〔把尿運出去〕※ | ※另列 | [CC2](#e-cc2) `countercurrent-mechanism` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C042.1 urine-concentration:L58 | - **先認識：** ADH 是抗利尿激素。 | 有據 | [AD1](#e-ad1) `adh-water-reabsorption`<br>[AD0](#e-ad0) `adh-water-reabsorption` | 補在作答前；提示不代替先認識。 |
| C042.2 urine-concentration:L58 | 水不足時，腦下垂體後葉釋放 ADH；它增加水通道，讓水沿髓質梯度再吸收，形成濃尿。 | 有據 | [AD1](#e-ad1) `adh-water-reabsorption`<br>[AD0](#e-ad0) `adh-water-reabsorption` | 補在作答前；提示不代替先認識。 |
| C043.1 urine-concentration:L69 | - **先認識：** 這裡把髓質高滲透梯度維持相同，只比較末端能不能讓水通過。 | 有據 | [UC1](#e-uc1) `urine-concentration`<br>[UC3](#e-uc3) `urine-concentration`<br>[AD3](#e-ad3) `adh-water-reabsorption`<br>[SW2](#e-sw2) `sodium-water-balance` | 補在作答前；提示不代替先認識。 |
| C043.2 urine-concentration:L69 | ADH 直接調整水的通透性；醛固酮主要促進鈉再吸收，水可隨滲透作用回收，兩者保水方式不同。 | 有據 | [UC1](#e-uc1) `urine-concentration`<br>[UC3](#e-uc3) `urine-concentration`<br>[AD3](#e-ad3) `adh-water-reabsorption`<br>[SW2](#e-sw2) `sodium-water-balance` | 補在作答前；提示不代替先認識。 |
| C044.1 urinary-route-micturition:L7 | - **先認識：** 輸尿管由腎盂通至膀胱，以蠕動送尿；斜行穿入膀胱壁的構造有助於防止逆流。 | 有據 | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions` | 補同關第二動作的防逆流依據，避免靠事後回饋才學到。 |
| C045.1 urinary-route-micturition:L15 | - **先認識：** 輸尿管長約 25–30 cm。 | 有據 | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions` | 補在作答前；提示不代替先認識。 |
| C045.2 urinary-route-micturition:L15 | 髂外動脈及靜脈，就是本圖中與輸尿管交叉的血管；課本列出的三處狹窄在腎盂交接、髂外動靜脈交叉、進入膀胱處。 | 有據 | [UT1](#e-ut1) `ureter-constrictions`<br>[UT2](#e-ut2) `ureter-constrictions` | 補在作答前；提示不代替先認識。 |
| C046.1 urinary-route-micturition:L26 | - **先認識：** 膀胱三角由兩個輸尿管口和一個尿道內口圍成。 | 有據 | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 補在作答前；提示不代替先認識。 |
| C046.2 urinary-route-micturition:L26 | 逼尿肌是膀胱壁的平滑肌；內尿道括約肌也是平滑肌，外尿道括約肌是骨骼肌，能由意識控制。 | 有據 | [UB1](#e-ub1) `urinary-bladder`<br>[UB2](#e-ub2) `urinary-bladder`<br>[UB3](#e-ub3) `urinary-bladder` | 補在作答前；提示不代替先認識。 |
| C047.1 urinary-route-micturition:L38 | - **先認識：** 女性尿道約 3.8 cm，男性約 20 cm。 | 有據 | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | 補在作答前；提示不代替先認識。 |
| C047.2 urinary-route-micturition:L38 | 男性尿道由內到外依序是前列腺部、膜部、陰莖部；膜部是這三段中位於前列腺部與陰莖部之間的一段。 | 有據 | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | 補在作答前；提示不代替先認識。 |
| C047.3 urinary-route-micturition:L38 | 陰部神經是控制外尿道括約肌的神經，該肌肉屬骨骼肌。 | 有據 | [UR1](#e-ur1) `urethra`<br>[UR2](#e-ur2) `urethra` | 補在作答前；提示不代替先認識。 |
| C048.1 urinary-route-micturition:L49 | - **先認識：** 骨盆副交感神經（S2–S4）促使逼尿肌收縮、內括約肌鬆弛；儲尿時交感神經促使相反反應。 | 有據 | [MR1](#e-mr1) `micturition-reflex`<br>[UB3](#e-ub3) `urinary-bladder`<br>[UR2](#e-ur2) `urethra` | 補在作答前；提示不代替先認識。 |
| C048.2 urinary-route-micturition:L49 | 陰部神經控制外尿道括約肌，這是能由意識控制的出口肌肉。 | 有據 | [MR1](#e-mr1) `micturition-reflex`<br>[UB3](#e-ub3) `urinary-bladder`<br>[UR2](#e-ur2) `urethra` | 補在作答前；提示不代替先認識。 |
| C049.1 urinary-route-micturition:L63 | - **先認識：** 健康成人每日尿量約 1–2 L，水分約佔 95%。 | 有據 | [PH1](#e-ph1) `urine-physical-properties`<br>[PH2](#e-ph2) `urine-physical-properties` | 補在作答前；提示不代替先認識。 |
| C049.2 urinary-route-micturition:L63 | 剛排出的正常尿呈稻草色、透明；放久後可因細菌作用變混濁。 | 有據 | [PH1](#e-ph1) `urine-physical-properties`<br>[PH2](#e-ph2) `urine-physical-properties` | 補在作答前；提示不代替先認識。 |
| C050.1 fluid-compartments:L7 | - **先認識：** 課本標準例子的總水量約佔體重 60%。 | 有據 | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF5](#e-bf5) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | 補在作答前；提示不代替先認識。 |
| C050.2 fluid-compartments:L7 | 看比例要先辨認分母：是體重、總水量，還是細胞外液；同一百分比用不同總量作基準，意思不同。 | 有據 | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF5](#e-bf5) `body-fluid-compartments`<br>[BF4](#e-bf4) `body-fluid-compartments` | 補在作答前；提示不代替先認識。 |
| C051.2 fluid-compartments:L18 | 標準例子中，細胞內液佔總水量 2/3，細胞外液佔 1/3。 | 有據 | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments` | 補在作答前；提示不代替先認識。 |
| C051.3 fluid-compartments:L18 | Na⁺ 是鈉離子，在細胞外較多；K⁺ 是鉀離子，在細胞內較多。 | 有據 | [BF1](#e-bf1) `body-fluid-compartments`<br>[BF2](#e-bf2) `body-fluid-compartments` | 補在作答前；提示不代替先認識。 |
| C052.1 fluid-compartments:L45 | - **先認識：** 血漿與組織間液最大的差別是蛋白質的量；課本這裡說微血管壁不通透蛋白質，使它留在血漿。 | 有據 | [EO3](#e-eo3) `electrolyte-osmolarity` | 補在作答前；提示不代替先認識。 |
| C053.1 fluid-compartments:L47 | - **動作：** 點選後，只呈現蛋白質試著穿過微血管壁、被擋住的畫面。 | 有據 | [EO3](#e-eo3) `electrolyte-osmolarity` | 僅保留有據的阻擋；後半是實作範圍約定，不是學生生理說明。 |
| C054.2 water-sodium-regulation:L7 | 課本每日攝取的平衡例為飲入液體 1500 mL、食物含水 800 mL、代謝水 200 mL，合計約 2500 mL。 | 有據 | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output` | 補在作答前；提示不代替先認識。 |
| C055.2 water-sodium-regulation:L18 | 課本將皮膚無知覺蒸散和流汗分開列，肺另列呼氣失水；正常時液體的攝取與排出維持平衡。 | 有據 | [WI1](#e-wi1) `water-intake-output`<br>[WI2](#e-wi2) `water-intake-output`<br>[WI3](#e-wi3) `water-intake-output` | 補在作答前；提示不代替先認識。 |
| C056.1 water-sodium-regulation:L28 | - **先認識：** ADH＝抗利尿激素，水不足時由腦下垂體後葉釋放，可增加保水；口渴增加水的攝取。 | 有據 | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption`<br>[SW4](#e-sw4) `sodium-water-balance`<br>[AD0](#e-ad0) `adh-water-reabsorption` | 補在作答前；提示不代替先認識。 |
| C056.2 water-sodium-regulation:L28 | 鈉的總量是有多少鈉，鈉濃度則是鈉量與水量的比例，兩者不能當同一件事。 | 有據 | [SW3](#e-sw3) `sodium-water-balance`<br>[AD1](#e-ad1) `adh-water-reabsorption`<br>[SW4](#e-sw4) `sodium-water-balance`<br>[AD0](#e-ad0) `adh-water-reabsorption` | 補在作答前；提示不代替先認識。 |
| C057.1 water-sodium-regulation:L38 | - **先認識：** RAAS＝腎素—血管收縮素—醛固酮系統，是一條調節血壓的連鎖反應。 | 有據 | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 補在作答前；提示不代替先認識。 |
| C057.2 water-sodium-regulation:L38 | 近腎絲球細胞在入球小動脈壁上；血壓下降時釋放腎素，啟動讓血管收縮、留住鈉和水的反應，使血壓回升。 | 有據 | [RA1](#e-ra1) `renin-angiotensin-aldosterone`<br>[RA2](#e-ra2) `renin-angiotensin-aldosterone`<br>[JG2](#e-jg2) `juxtaglomerular-apparatus` | 補在作答前；提示不代替先認識。 |
| C058.1 water-sodium-regulation:L46 | - **先認識：** 醛固酮是調節鈉、鉀處理的激素，促進遠端鈉再吸收，同時增加鉀分泌；分泌是從血液送入管液。 | 有據 | [K2](#e-k2) `potassium-secretion`<br>[RH2](#e-rh2) `renal-handling`<br>[SW2](#e-sw2) `sodium-water-balance` | 補在作答前；提示不代替先認識。 |
| C058.2 water-sodium-regulation:L46 | ADH 直接增加遠端與集尿管對水的通透性。 | 有據 | [K2](#e-k2) `potassium-secretion`<br>[RH2](#e-rh2) `renal-handling`<br>[SW2](#e-sw2) `sodium-water-balance` | 補在作答前；提示不代替先認識。 |
| C059.2 water-sodium-regulation:L58 | ANP 也可抑制 ADH，使水分排泄增加、體內液體量減少。 | 有據 | [AN1](#e-an1) `anp-volume-feedback`<br>[AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 補在作答前；提示不代替先認識。 |
| C059.3 water-sodium-regulation:L58 | 課本區分：醛固酮主要調節鈉含量與體液容積，ADH 主要調節水與體液濃度。 | 有據 | [AN1](#e-an1) `anp-volume-feedback`<br>[AN2](#e-an2) `anp-volume-feedback`<br>[SW1](#e-sw1) `sodium-water-balance` | 補在作答前；提示不代替先認識。 |
| C060.2 electrolyte-balance:L7 | 葡萄糖是非電解質，不會解離。 | 有據 | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity` | 補在作答前；提示不代替先認識。 |
| C061.1 electrolyte-balance:L17 | - **先認識：** 本圖把半透膜當作水可以通過、溶質不能通過的膜。※ | ※另列 | [EO2](#e-eo2) `electrolyte-osmolarity` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C061.2 electrolyte-balance:L17 | 這是本圖的模型約定，不是所有生物膜都相同。 | 有據 | [EO2](#e-eo2) `electrolyte-osmolarity` | 保留定義並限定模型，不冒充卡片對所有膜的規律。 |
| C062.1 electrolyte-balance:L20 | - **答對：** 水往粒子多的那一邊移動；水的箭頭指向粒子多的一邊。 | 有據 | [EO2](#e-eo2) `electrolyte-osmolarity` | 對照所列reviewed卡，為原句事實的白話表述、條件化應用或裁決指定改句。 |
| C063.1 electrolyte-balance:L28 | - **先認識：** mEq/L（數字越大代表越濃）是把離子帶幾個電荷（價數）也算進去的濃度單位；比較時要用同一種離子、相同單位。 | 有據 | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | 數字比較加同種離子條件；價數白話定義標※，不使用卡片待確認的換算公式。 |
| C063.2 electrolyte-balance:L28 | 價數先理解成一個離子帶電荷的數目。※ | ※另列 | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |
| C063.3 electrolyte-balance:L28 | mEq/L 和滲透粒子數不是同一件事，不能把兩者當成同一種數法。 | 有據 | [EO1](#e-eo1) `electrolyte-osmolarity`<br>[EO2](#e-eo2) `electrolyte-osmolarity`<br>[EO4](#e-eo4) `electrolyte-osmolarity` | 數字比較加同種離子條件；價數白話定義標※，不使用卡片待確認的換算公式。 |
| C064.1 electrolyte-balance:L37 | - **先認識：** 細胞外以 Na⁺（鈉離子）較多，細胞內以 K⁺（鉀離子）較多。 | 有據 | [EO3](#e-eo3) `electrolyte-osmolarity`<br>[SW2](#e-sw2) `sodium-water-balance` | 補在作答前；提示不代替先認識。 |
| C064.2 electrolyte-balance:L37 | 醛固酮是促進腎臟回收鈉的激素，水可隨滲透作用回收。 | 有據 | [EO3](#e-eo3) `electrolyte-osmolarity`<br>[SW2](#e-sw2) `sodium-water-balance` | 補在作答前；提示不代替先認識。 |
| C065.1 electrolyte-balance:L39 | - **💡提示：**「回想體液那份：細胞外液和細胞內液，各以哪種離子較多？」 | 程序 | [EO3](#e-eo3) `electrolyte-osmolarity` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C066.1 electrolyte-balance:L44 | - **先認識：** Cl⁻ 是氯離子，是細胞外液主要的陰離子；陰離子帶負電。 | 有據 | [CL1](#e-cl1) `chloride-balance`<br>[CL2](#e-cl2) `chloride-balance`<br>[EO3](#e-eo3) `electrolyte-osmolarity` | 補在作答前；提示不代替先認識。 |
| C066.2 electrolyte-balance:L44 | Na⁺ 在醛固酮調節下再吸收時，Cl⁻ 可被動吸收，所以濃度間接受醛固酮影響；這不表示所有腎管段的氯運輸都被動。 | 有據 | [CL1](#e-cl1) `chloride-balance`<br>[CL2](#e-cl2) `chloride-balance`<br>[EO3](#e-eo3) `electrolyte-osmolarity` | 補在作答前；提示不代替先認識。 |
| C067.1 electrolyte-balance:L46 | - **💡提示：**「回看先認識中細胞外液的離子分工，再把卡片名稱和作用對起來。」 | 程序 | [CL1](#e-cl1) `chloride-balance`<br>[EO3](#e-eo3) `electrolyte-osmolarity` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C068.1 electrolyte-balance:L52 | - **先認識：** Mg²⁺ 是鎂離子，是細胞內主要電解質之一；可活化醣類與蛋白質代謝的酶。 | 有據 | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | 補在作答前；提示不代替先認識。 |
| C068.2 electrolyte-balance:L52 | 低血鎂與高血鎂的神經反應方向不同。 | 有據 | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | 補在作答前；提示不代替先認識。 |
| C069.1 electrolyte-balance:L54 | - **💡提示：**「回看先認識：先分清鎂分布的位置，再把它參與的工作和選項比對。」 | 程序 | [MG1](#e-mg1) `magnesium-balance`<br>[MG2](#e-mg2) `magnesium-balance` | 引導觀察／配對／應用，不是新增生理斷言；所引用知識由題前先認識及列出卡片支撐。 |
| C070.1 nephron-circulation:L4 | 「腎臟裡有很多製造尿液的小單位，叫做『腎元』。※ | ※另列 | [NH1](#e-nh1) `nephron-histology` | 依裁決4保留／標註；不列入有據或零缺據的分母，待教師確認。 |

## 本輪使用的卡內逐字原句片段

每段均從實體卡重新確認存在；文字保留卡內Markdown符號，不是學生腳本的改寫。

| 索引 | reviewed卡uid／實際行 | 卡內原句片段 |
|---|---|---|
| <a id="e-ad0"></a>AD0 | [adh-water-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/adh-water-reabsorption.md:58>) | 抗利尿激素 ADH 又稱血管加壓素，可增加遠曲小管近集尿管段及皮質集尿管對水的通透性 |
| <a id="e-ad1"></a>AD1 | [adh-water-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/adh-water-reabsorption.md:62>) | ADH 作用於 V2 受器，提高腺苷酸環化酶活性、增加水通道數目，水沿髓質滲透梯度再吸收，形成濃尿。水不足時，腦下垂體後葉釋放 ADH，增加保水。 |
| <a id="e-ad2"></a>AD2 | [adh-water-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/adh-water-reabsorption.md:71>) | 本課本濃尿可達 1200 mOsm/L，約為血漿的四倍 |
| <a id="e-ad3"></a>AD3 | [adh-water-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/adh-water-reabsorption.md:75>) | ADH 直接調整水通透性；醛固酮主要促進鈉再吸收，兩者保水方式不同。 |
| <a id="e-an1"></a>AN1 | [anp-volume-feedback](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/anp-volume-feedback.md:42>) | ANP主要由心房、少量由心室細胞分泌，整體功能為降血壓。 |
| <a id="e-an2"></a>AN2 | [anp-volume-feedback](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/anp-volume-feedback.md:42>) | ANP也增加腎絲球過濾作用並促進鈉排泄；ADH受到抑制時，水分排泄增加，體內液體量減少。 |
| <a id="e-bf1"></a>BF1 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:47>) | 體液分細胞內液與細胞外液；課本標準示例總水量約佔體重 60%，細胞內液佔總水量 2/3，細胞外液佔 1/3。 |
| <a id="e-bf2"></a>BF2 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:51>) | 依標準示例，細胞內液佔體重 40%，細胞外液佔 20%；細胞外液再分血漿 20% 與組織間液 80%，換成體重比例為 4% 與 16%。細胞外以 Na⁺、細胞內以 K⁺較多。 |
| <a id="e-bf4"></a>BF4 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:64>) | 「血漿佔細胞外液 20%」不是佔體重 20%；通用的 5%/15% 分法與本課本 4%/16% 不同。 |
| <a id="e-bf5"></a>BF5 | [body-fluid-compartments](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/body-fluid-compartments.md:59>) | 題目先辨比例分母是體重、總水量或細胞外液 |
| <a id="e-cc1"></a>CC1 | [countercurrent-mechanism](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/countercurrent-mechanism.md:56>) | 尿液濃縮中的逆流機制由亨利氏環的逆流增強裝置與直血管的逆流交換裝置配合，維持髓質高張環境。 |
| <a id="e-cc2"></a>CC2 | [countercurrent-mechanism](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/countercurrent-mechanism.md:60>) | 下降枝對水通透、對溶質通透差，水移出後管液變濃；上升枝不透水而再吸收 NaCl，管液變稀。上升枝共同運輸帶入一個 Na⁺、一個 K⁺與兩個 Cl⁻。直血管緩慢逆流交換，減少髓質溶質流失。 |
| <a id="e-cc3"></a>CC3 | [countercurrent-mechanism](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/countercurrent-mechanism.md:70>) | 髓質深部可達 1200 mOsm/L，近曲小管液約 300 mOsm/L |
| <a id="e-cc4"></a>CC4 | [countercurrent-mechanism](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/countercurrent-mechanism.md:87>) | 兩條相反方向流動的管路，讓鹽分與水分有不同的進出機會。 |
| <a id="e-cl1"></a>CL1 | [chloride-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/chloride-balance.md:41>) | Cl⁻ 為細胞外液主要陰離子，課本正常血清濃度為 95–103 mEq/L |
| <a id="e-cl2"></a>CL2 | [chloride-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/chloride-balance.md:45>) | Na⁺ 在醛固酮調節下再吸收時，Cl⁻ 可被動吸收，所以濃度間接受醛固酮影響 |
| <a id="e-eo1"></a>EO1 | [electrolyte-osmolarity](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md:47>) | 電解質如酸、鹼、鹽，溶於液體會解離成離子；非電解質如葡萄糖不解離。滲透效應須看解離後粒子數，離子濃度亦以 mEq/L 表示並考慮價數。 |
| <a id="e-eo2"></a>EO2 | [electrolyte-osmolarity](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md:51>) | 等數目分子完全解離的課本例：葡萄糖為 1 粒子，NaCl 成 Na⁺、Cl⁻ 共 2 粒子，MgCl₂ 成 Mg²⁺、2Cl⁻ 共 3 粒子。水移向離子或分子較多區域；Mg²⁺ 吸引 Cl⁻ 的量為 Na⁺ 的兩倍，故不能只看未解離分子的個數或質量。 |
| <a id="e-eo3"></a>EO3 | [electrolyte-osmolarity](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md:55>) | 血漿與組織間液最大差別為蛋白質陰離子量，微血管壁不通透蛋白質使其留在血漿。表 9-9 列細胞內主要陽離子 K⁺、細胞外 Na⁺，主要陰離子分別為磷酸根與 Cl⁻。 |
| <a id="e-eo4"></a>EO4 | [electrolyte-osmolarity](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/electrolyte-osmolarity.md:67>) | mEq/L 考慮離子價數，與滲透粒子數不是同一件事。 |
| <a id="e-gf1"></a>GF1 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:58>) | 腎絲球過濾是血液中的水與可通過的溶質經過濾膜進入鮑氏囊；正常濾液不含血球及白蛋白。 |
| <a id="e-gf2"></a>GF2 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:62>) | 過濾膜依序含微血管內皮、基底膜、鮑氏囊臟層足細胞。小孔與裂隙限制大小；解剖課本也記載帶電分子的通過差異。葡萄糖、胺基酸及小分子溶質可過濾。 |
| <a id="e-gf3"></a>GF3 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:66>) | 形成濾液的位置是皮質的腎小體，不是輸尿管或腎盂。 |
| <a id="e-gf4"></a>GF4 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:70>) | 鮑氏囊壁層不構成三層過濾膜 |
| <a id="e-gf5"></a>GF5 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:71>) | 血漿與濾液主要差異為蛋白質 |
| <a id="e-gf6"></a>GF6 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:76>) | 血漿本來就不包含血球，故比較「血漿與濾液」不能拿血球當主要成分差別。 |
| <a id="e-gf7"></a>GF7 | [glomerular-filtration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/glomerular-filtration.md:72>) | 靜水壓促進過濾，囊內壓與血漿膠體壓對抗 |
| <a id="e-gr1"></a>GR1 | [gfr-regulation](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/gfr-regulation.md:55>) | 有效過濾壓＝腎絲球靜水壓＋鮑氏囊膠體滲透壓－鮑氏囊靜水壓－血漿膠體滲透壓。 |
| <a id="e-gr2"></a>GR2 | [gfr-regulation](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/gfr-regulation.md:51>) | 腎絲球過濾率 GFR 是每分鐘形成的濾液體積 |
| <a id="e-gr3"></a>GR3 | [gfr-regulation](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/gfr-regulation.md:90>) | 白蛋白變多是拉回血管的力變大 |
| <a id="e-gr4"></a>GR4 | [gfr-regulation](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/gfr-regulation.md:63>) | 血漿白蛋白增加，提高膠體滲透壓，使 GFR 下降 |
| <a id="e-jg1"></a>JG1 | [juxtaglomerular-apparatus](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/juxtaglomerular-apparatus.md:51>) | 近腎絲球器包含入球小動脈的近腎絲球細胞、遠曲小管緻密斑及位於其間的 Lacis 細胞。 |
| <a id="e-jg2"></a>JG2 | [juxtaglomerular-apparatus](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/juxtaglomerular-apparatus.md:55>) | 近腎絲球細胞為入球小動脈壁特化平滑肌細胞，感受壓力並分泌腎素；緻密斑感受管液鈉變化。低壓或低管液鈉可促進腎素，連動血管張力與醛固酮調節。 |
| <a id="e-k1"></a>K1 | [potassium-secretion](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/potassium-secretion.md:48>) | 腎臟可藉遠曲小管與集尿管分泌 K⁺調節鉀排泄；醛固酮與血鉀升高可促進此作用。 |
| <a id="e-k2"></a>K2 | [potassium-secretion](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/potassium-secretion.md:52>) | 醛固酮促進遠端鈉再吸收，同時增加鉀分泌。鉀在前段有大量再吸收，最終尿鉀仍受後段分泌調整，因此不能只由初次過濾量推算。 |
| <a id="e-ke1"></a>KE1 | [kidney-endocrine](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-endocrine.md:58>) | 腎素促 RAAS 連鎖調節血壓與醛固酮；紅血球生成素促進紅血球生成；腎將維生素 D₃ 轉為具活性的形式，參與鈣調節。 |
| <a id="e-kp1"></a>KP1 | [kidney-position](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-position.md:43>) | 腎臟位於後腹腔、脊柱兩側，課本大致介於 T12 至 L3；右腎較左腎低。 |
| <a id="e-kp2"></a>KP2 | [kidney-position](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-position.md:51>) | 肝臟相關位置使右側腎臟較低。 |
| <a id="e-kp3"></a>KP3 | [kidney-position](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-position.md:47>) | 內側凹入處為腎門。 |
| <a id="e-ks1"></a>KS1 | [kidney-structure](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-structure.md:61>) | 腎臟切面外為皮質、內為髓質；腎盂位於靠近腎門的收集部，接輸尿管。皮質伸入腎錐體間的部分稱腎柱。 |
| <a id="e-ks2"></a>KS2 | [kidney-structure](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-structure.md:65>) | 皮質含腎絲球與曲小管；髓質由8–18個腎錐體組成，尖端為腎乳頭。集尿管開口於乳頭，尿經小腎盞、大腎盞至腎盂。外圍包覆依次腎被膜、脂肪囊、腎筋膜。 |
| <a id="e-ks3"></a>KS3 | [kidney-structure](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/kidney-structure.md:69>) | 收集尿液的腎盞、腎盂與製造濾液的位置不同。 |
| <a id="e-mg1"></a>MG1 | [magnesium-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/magnesium-balance.md:40>) | Mg²⁺ 是細胞內主要電解質之一，課本正常血漿濃度為 1.3–2.1 mEq/L；低血鎂與高血鎂的神經反應方向不同。 |
| <a id="e-mg2"></a>MG2 | [magnesium-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/magnesium-balance.md:44>) | Mg²⁺ 活化醣類與蛋白質代謝的酶，參與 Na⁺–K⁺ 幫浦引發、核糖體製造、中樞神經傳遞及心肌功能。 |
| <a id="e-mr1"></a>MR1 | [micturition-reflex](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/micturition-reflex.md:58>) | 課本膀胱平均容量 700–800 mL，超過約 300 mL 可引起尿意。骨盆副交感神經 S2–S4 促逼尿肌收縮、內括約肌鬆弛；儲尿時交感神經促相反反應；陰神經體神經控制外括約肌。 |
| <a id="e-nh1"></a>NH1 | [nephron-histology](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-histology.md:55>) | 腎元由腎小體與腎小管構成；管段的上皮差異配合不同再吸收與分泌功能。 |
| <a id="e-nh2"></a>NH2 | [nephron-histology](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-histology.md:59>) | 近曲小管為有刷狀緣的立方上皮；遠曲小管立方上皮但無明顯微絨毛。亨利氏環薄段為扁平上皮，較厚管段可見立方或低柱狀上皮。腎小體包括腎絲球與鮑氏囊，足細胞形成過濾屏障的一部分。 |
| <a id="e-nt1"></a>NT1 | [nephron-types](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-types.md:50>) | 腎元分皮質腎元與近髓質腎元；皮質腎元佔大多數，近髓質腎元位置靠皮質與髓質交界。 |
| <a id="e-nt2"></a>NT2 | [nephron-types](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/nephron-types.md:54>) | 皮質腎元的亨利氏環較短；近髓質腎元的環深入髓質、較長，並配合直血管參與逆流濃縮。兩型腎小體均位於皮質，差異是靠近交界程度及環的走向。 |
| <a id="e-ph1"></a>PH1 | [urine-physical-properties](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-physical-properties.md:33>) | 健康成人每日尿量約 1–2 L；尿液水分約佔 95% |
| <a id="e-ph2"></a>PH2 | [urine-physical-properties](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-physical-properties.md:37>) | 剛排出透明或澄清，靜置後可因細菌作用混濁；顏色為稻草色，隨飲食與濃度改變。 |
| <a id="e-ra0"></a>RA0 | [renin-angiotensin-aldosterone](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renin-angiotensin-aldosterone.md:32>) | 腎素—血管收縮素—醛固酮系統（RAAS） |
| <a id="e-ra1"></a>RA1 | [renin-angiotensin-aldosterone](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renin-angiotensin-aldosterone.md:36>) | 血壓下降時，刺激腎臟的**近腎絲球細胞**釋放**腎素**； |
| <a id="e-ra2"></a>RA2 | [renin-angiotensin-aldosterone](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renin-angiotensin-aldosterone.md:65>) | 失血、脫水使血壓下降時，靠這條鏈讓血管收縮、留住鈉和水，把血壓撐回來。 |
| <a id="e-rb1"></a>RB1 | [renal-blood-flow](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-blood-flow.md:50>) | 課本腎血流約 1200 mL/min、約心輸出量四分之一；腎血漿流量只計血流中的血漿部分。 |
| <a id="e-rc1"></a>RC1 | [renal-clearance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-clearance.md:56>) | 血漿清除率 C＝U×V/P，代表每分鐘排除某物質所相當的血漿體積；U 為尿濃度，V 為每分鐘尿量，P 為血漿濃度。 |
| <a id="e-rc2"></a>RC2 | [renal-clearance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-clearance.md:60>) | 菊糖可自由過濾、不再吸收也不分泌，清除率等於 GFR。肌酸酐不再吸收但有少量分泌，可估 GFR；PAH 兼具過濾與分泌，可估腎血漿流量。葡萄糖正常全回收，尿素部分回收。 |
| <a id="e-rh2"></a>RH2 | [renal-handling](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-handling.md:59>) | 過濾把物質由血移入囊；再吸收把管液中物質送回血；分泌把血中物質送入管液。菊糖只過濾，葡萄糖正常全回收，肌酸酐有少量分泌，PAH 過濾加分泌。 |
| <a id="e-rh3"></a>RH3 | [renal-handling](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-handling.md:72>) | 尿中濃度較高不等於一定分泌，水回收也會濃縮；物質排泄量不能直接與體積流率 GFR 比大小。 |
| <a id="e-rh4"></a>RH4 | [renal-handling](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/renal-handling.md:68>) | 比較清除率與 GFR 才能都用 mL/min |
| <a id="e-sw1"></a>SW1 | [sodium-water-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/sodium-water-balance.md:53>) | 鈉量與水量共同影響細胞外液狀態；課本區分醛固酮調節鈉含量與體液容積，ADH 調節水與體液濃度。 |
| <a id="e-sw2"></a>SW2 | [sodium-water-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/sodium-water-balance.md:57>) | 醛固酮促進遠曲小管及集尿管鈉回收，水可隨滲透作用回收；ADH 直接增加遠端與集尿管水通透性。 |
| <a id="e-sw3"></a>SW3 | [sodium-water-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/sodium-water-balance.md:61>) | 水分不足時可由口渴增加攝取及 ADH 增加保水配合；鈉的總量改變與鈉濃度改變不能視為同一件事。 |
| <a id="e-sw4"></a>SW4 | [sodium-water-balance](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/sodium-water-balance.md:70>) | 濃度是溶質量與水量的比例，不是只看鈉總量。 |
| <a id="e-tr1"></a>TR1 | [tubular-reabsorption](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/tubular-reabsorption.md:70>) | 近曲小管以 Na⁺共同運輸回收葡萄糖與胺基酸，正常可全回收；葡萄糖最大轉運量為 375 mg/min，過濾負荷超過能力即出現糖尿。水主要依滲透作用回收。肌酸酐不被再吸收，尿素部分回收。 |
| <a id="e-ub1"></a>UB1 | [urinary-bladder](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-bladder.md:50>) | 膀胱位於骨盆腔、恥骨後方，是暫存尿液的肌性器官；膀胱三角由兩輸尿管口與一尿道內口界定。 |
| <a id="e-ub2"></a>UB2 | [urinary-bladder](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-bladder.md:54>) | 逼尿肌為平滑肌；內尿道括約肌亦為平滑肌，外括約肌為骨骼肌。充盈約 300 mL 可引發排尿感，課本容量約 700–800 mL。排尿反射使逼尿肌收縮與內括約肌鬆弛。 |
| <a id="e-ub3"></a>UB3 | [urinary-bladder](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-bladder.md:58>) | 外括約肌提供有意識的控制。 |
| <a id="e-uc1"></a>UC1 | [urine-concentration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-concentration.md:53>) | 尿液濃縮需髓質高滲透梯度與集尿管可調節水通透性配合，ADH 增加水回收形成濃尿。 |
| <a id="e-uc3"></a>UC3 | [urine-concentration](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-concentration.md:61>) | 水攝取不足時 ADH 保水；即使可形成高張髓質，若末端不通水，也不能同樣濃縮。 |
| <a id="e-up1"></a>UP1 | [urine-pathway](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urine-pathway.md:61>) | 尿液由腎元管液經集尿管進入腎乳頭，再循腎盞、腎盂、輸尿管、膀胱與尿道排出。 |
| <a id="e-ur1"></a>UR1 | [urethra](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urethra.md:49>) | 尿道把膀胱內尿液排至體外；課本女性約 3.8 cm，男性約 20 cm。男性另作精液通道。 |
| <a id="e-ur2"></a>UR2 | [urethra](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urethra.md:53>) | 男性尿道分前列腺部、膜部與陰莖部，課本約 2.5、2、15 cm。外尿道括約肌位於泌尿生殖膈相關位置，屬骨骼肌，受陰部神經控制。 |
| <a id="e-us1"></a>US1 | [urinary-system-overview](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-system-overview.md:67>) | 泌尿系統含腎、輸尿管、膀胱與尿道；腎形成尿液，其餘構造運送、儲存或排出尿液。 |
| <a id="e-us2"></a>US2 | [urinary-system-overview](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-system-overview.md:71>) | 排出尿素、尿酸與肌酸酐等廢物；並具腎素、紅血球生成素與活化維生素 D 的內分泌作用。 |
| <a id="e-us3"></a>US3 | [urinary-system-overview](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/urinary-system-overview.md:80>) | 尿素主要源自胺基酸代謝，尿酸與核酸、肌酸酐與肌肉代謝相關 |
| <a id="e-ut1"></a>UT1 | [ureter-constrictions](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/ureter-constrictions.md:49>) | 輸尿管由腎盂通至膀胱，課本長約 25–30 cm，沿途有三處生理性狹窄。 |
| <a id="e-ut2"></a>UT2 | [ureter-constrictions](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/ureter-constrictions.md:53>) | 指定解剖來源三處為腎盂交接、與髂外動脈及靜脈交叉、進入膀胱處。輸尿管以蠕動送尿，斜行穿入膀胱壁的構造有助防逆流。 |
| <a id="e-wi1"></a>WI1 | [water-intake-output](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/water-intake-output.md:39>) | 正常液體攝取與排出維持平衡；課本平均每日總攝取約 2500 mL，來源包括飲入液體、食物含水與代謝水。 |
| <a id="e-wi2"></a>WI2 | [water-intake-output](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/water-intake-output.md:43>) | 消化道吸收液體 1500 mL、食物含水 800 mL、代謝水 200 mL／日。排出途徑包括腎臟尿液、肺呼氣、皮膚蒸散與流汗、糞便。 |
| <a id="e-wi3"></a>WI3 | [water-intake-output](</Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge/water-intake-output.md:51>) | 皮膚 / 無知覺蒸散、有知覺流汗 / 400 mL、100 mL |

## 實際自查與未改動證據

執行 `python3 /tmp/scripts9-r2-audit.py`（本輪只讀自查及報告產生器），下列每項實際assert通過，無省略／skip。程式不代替上述語意人工判讀。

- PASS：裁決1：過濾結語主詞修正，後半菊糖原句保留。
- PASS：裁決2：下降枝題幹不變，三選項逐字符合裁決。
- PASS：裁決3：靜水壓無未限定的舊稱。
- PASS：裁決3：營養限定改句與下降枝提示逐字符合裁決。
- PASS：裁決4：刪除未據穿透／水位模型；U形題幹標※。
- PASS：裁決5：兩關各三個逐卡完整回饋，無空白模板。
- PASS：裁決6：30個原缺資訊關卡均有改過、位於作答前的先認識。
- PASS：裁決7：摘要列出的17個生詞皆有題前先認識。
- PASS：裁決8：指定7處提示與R1原句均不同。
- PASS：裁決9：tubular N04新增指定問題句。
- PASS：裁決10：兩單位首次出現有指定註解，mEq保留價數且限定同種離子。
- PASS：kidney-anatomy：6關與①②原句不變。
- PASS：kidney-anatomy：確認題數不變。
- PASS：nephron-circulation：6關與①②原句不變。
- PASS：nephron-circulation：確認題數不變。
- PASS：filtration-clearance：6關與①②原句不變。
- PASS：filtration-clearance：確認題數不變。
- PASS：tubular-handling：6關與①②原句不變。
- PASS：tubular-handling：確認題數不變。
- PASS：urine-concentration：6關與①②原句不變。
- PASS：urine-concentration：確認題數不變。
- PASS：urinary-route-micturition：6關與①②原句不變。
- PASS：urinary-route-micturition：確認題數不變。
- PASS：fluid-compartments：6關與①②原句不變。
- PASS：fluid-compartments：確認題數不變。
- PASS：water-sodium-regulation：6關與①②原句不變。
- PASS：water-sodium-regulation：確認題數不變。
- PASS：electrolyte-balance：6關與①②原句不變。
- PASS：electrolyte-balance：確認題數不變。
- PASS：確認題總數38不變。
- PASS：逐處變更覆蓋：所有新增／替換行都記入CHANGELOG。
- PASS：逐處變更覆蓋：所有刪除／換掉的原行也有原句紀錄。

全部38題確認題數與R1一致，只有下降枝ABC依裁決修改；其他選項與原來的唯一正解判定保留。原①②文字沒有換題或併步，實作需遵守第①步完成才顯示第②步。

### 九稿修訂前後SHA256

| 腳本 | 本輪前 | 本輪後 |
|---|---|---|
| kidney-anatomy | `d656d0655db6d3ac55cbb17cdf1b7c21b463e69dd1060a476677d1b0b51d3302` | `825e0b45b608bd8758196ee579915866df1077819ea0803c21d10565067e0806` |
| nephron-circulation | `d637c8f77fde15a231bc0d36bdd4e451541dadcc61a6cea95b39410bdbaec051` | `6655bd6252cfafb73df66d7b3aeb1be2d1638164c6b1a4757f82dd8399fd5ab4` |
| filtration-clearance | `42ae959be0363beb283256fa33716b96da7f3d8c774903d725de28880a1cba8f` | `606f163268e70d23dc06cbe5b6c722b6efe85c60909394e21c13bfaca884763e` |
| tubular-handling | `7f3289d4ee4ca1133c724c40951d1844427ed709c8e64e1e6d3822c4d5822350` | `3be10265249655da0807892cbc1a7bb4c777afeb2a7a37ec7c688353f2e3263e` |
| urine-concentration | `d99850144ed4c69cb2cee4846ac22b76a64e556c519b0598016507ec049eda09` | `8e98833469f3f6a8d9417ed2d268807b471d428c4c396a2d737b63fece2e8750` |
| urinary-route-micturition | `129179851fc0c3fd0b33ba4b09d85db10f82a57e4bd5c7fad81122715bcfacd8` | `c7324512a92e253177aab25d4b68a37d1d4efee976f233fc2357897086eee20c` |
| fluid-compartments | `64a5e8eeb3abd2ec1f7cac024e2b2fc3160950290378ce1d50f5baad3e3ef501` | `79846ead765ea7a07f3cac106e86a8490531e344296ce7426d1b602354f76886` |
| water-sodium-regulation | `57359d23f06d3e5fbd19c9b220662b381c9e98cd689ba4b86268e1f92828a3c7` | `b1bedd49167b7ba8ae0a9634eecc24a90bb3a13a7da126ad7b0e25189eae543c` |
| electrolyte-balance | `1d7fbb4a7c5729310db3f1227779e1157e8794a5b51a4c547ef7854488df0e59` | `3c8c180914c58ccaeb715ac1c10bd4d41a72249192fe582fba43129dd8329227` |

### 保護來源SHA256（前後相同）

9個apply.json、31張卡與進度來源都未變；下表使用R1保存的來源SHA重新比對。根目錄handoff／README／兩份R1報告不改，現況只寫#6j；未動其他worktree。

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

## 後續停點

Antigravity依 `ANTIGRAVITY_TASK_scripts9-reread_2026-10-21.md` 做改後可讀性複查，特別看新先認識是否太長、是否能在首次作答前用到、提示是否仍有洩答。再由Claude抽查、教師核可（含※）後才進下一輪實作。本輪沒有實作，也未以本人的自查取代另一方覆核。
