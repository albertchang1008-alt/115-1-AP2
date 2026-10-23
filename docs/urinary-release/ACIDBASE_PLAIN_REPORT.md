# 給 Claude 的摘要

- #29：酸鹼full的16題、6題第二層理由與9個glossary詞條已白話化；nodes、sources、ID、答案位置與每輪5組配對不變。
- 檔案：materials-src/acid-base-homeostasis/full.json、apply-kit/full-check.mjs、scripted.css、acidbase-assessment.css、full-render.mjs、兩個layout檢查器、10份既有HTML、檢查器負例。
- 獨立題庫11題、全部apply.json、Excel、Sheet、教師reviewed狀態與版本均未改。
- 選項間距檢查直接加入全流程檢查器：每題及答錯回饋畫面必須0–24px，十份教材考核以外CSS不變。
- PASS：十份verify／content-check／SCRIPT_DIFF、80條八尺寸全流程、6552畫面、2650事件，無效事件0；間距最大18px。
- PASS：npm run check前端208／Functions61、build；檢查器33項＋最終雜湊4項；FAIL 0。
- 偏離：交辦未逐列列出reasons／reasonFeedback，但其學生畫面也有舊術語，一併改寫；索引與數量不動；酸鹼播放器也有同樣空白，依教師本輪手機要求一併限定在考核畫面修正。
- 抽查最多5項：F2算式、P-A/B酸鹼方向、R-A/B名稱、K-A/B排酸留鹼、三份手機前後截圖。
- 在codex/plain-language-110提交；根目錄只更新共享#29、週誌及報告鏡像，handoff未改；不push、不部署、不按同步。

## 修改內容與依據

每題以原有reviewed卡引文為依據；下方引文保持原文，其中pKa、log、代償等只存在未修改的來源與本報告舊稿，並非本次改寫的學生題文。正解語意保留，換掉的誘答對應酸鹼方向、器官分工、物質去向、相加／相除及接住／排出的常見混淆。
新的迷思沒有課本以外的正確敘述：P組「先反向再回原值」混淆了固定其他條件的直接效果；R／S組維持四種酸鹼名稱，不能只憑酸或鹼猜原因。
K組保留排酸與留鹼互相配合；N組仍比較形成銨與真正隨尿排出。F2第四項由只看酸改成相減，與相除為同一算式比較。正解答案格填完整回饋，不影響原有判分。

## F1

正解位置：0（0起算）不變；原正解「緩衝減少波動、肺調 CO₂、腎排酸留鹼」→「先接酸、肺排二氧化碳、腎排酸留鹼」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 三系統如何分工？ | 身體有緩衝（先接住多出的酸）、肺和腎臟，它們怎麼合作維持血液的酸鹼？ |
| 選項1 | 緩衝減少波動、肺調 CO₂、腎排酸留鹼 | 先接酸、肺排二氧化碳、腎排酸留鹼 |
| 選項2 | 緩衝即排酸，肺腎無須作用 | 先接酸、肺回收鹼、腎排二氧化碳 |
| 選項3 | 肺負責回收 HCO₃⁻ | 先排酸、肺接住酸、腎回收鹼 |
| 選項4 | 腎把酸留血可取代緩衝 | 先留酸、肺排二氧化碳、腎排掉鹼 |
| 回饋1 | （空白） | 三者分工合作：先接住酸，再由肺和腎臟調整酸的去路。 |
| 回饋2 | 結合＝排出→回看體內界線 | 肺負責排二氧化碳，回收鹼是腎臟的工作。 |
| 回饋3 | 肺腎角色互換→肺是CO₂端 | 先接住酸還不等於排出酸，肺負責排二氧化碳。 |
| 回饋4 | 留酸＝排酸→腎須有尿端去路 | 先接住酸能減少酸鹼變動，腎臟還會把鹼留回血液。 |

reviewed依據：

- `acid-base-balance`：「酸鹼平衡維持血液 pH 約 7.35–7.45，由化學緩衝、呼吸調整 CO₂ 與腎臟調整 H⁺/HCO₃⁻配合。」
- `buffer-systems`：「緩衝先降低 pH 波動，再由呼吸排 CO₂、腎臟排酸調整；尿中 NH₄⁺與磷酸鹽攜酸與腎臟功能相連。」
- `renal-acid-base-compensation`：「近曲小管以 Na⁺－H⁺相對運送分泌 H⁺；遠曲小管與集尿管主動分泌 H⁺，受醛固酮調節。NH₃ 結合 H⁺成 NH₄⁺，磷酸鹽也能承接 H⁺排出；同時 HCO₃⁻回到血液。」

## F2

正解位置：1（0起算）不變；原正解「HCO₃⁻／H₂CO₃」→「碳酸氫根的量 ÷ 碳酸的量」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 課本公式中的鹼／酸比？ | 碳酸氫根（HCO₃⁻）是接酸的鹼，碳酸（H₂CO₃）是酸；用課本算式比較兩者時，要怎麼算？ |
| 選項1 | H₂CO₃／HCO₃⁻ | 碳酸的量 ÷ 碳酸氫根的量 |
| 選項2 | HCO₃⁻／H₂CO₃ | 碳酸氫根的量 ÷ 碳酸的量 |
| 選項3 | HCO₃⁻＋H₂CO₃ | 碳酸氫根的量 ＋ 碳酸的量 |
| 選項4 | 僅 H₂CO₃ | 碳酸氫根的量 − 碳酸的量 |
| 回饋1 | 分子分母顛倒→鹼在上 | 你把上下放反了：要把接酸的碳酸氫根放在上面。 |
| 回饋2 | （空白） | 把接酸的碳酸氫根放上面、碳酸放下面，再相除。 |
| 回饋3 | 比值當相加→需比較兩端 | 這裡要比較鹼是酸的多少倍，所以用相除，不是相加。 |
| 回饋4 | 漏鹼→公式同時需要鹼與酸 | 這裡要比較鹼是酸的多少倍，所以用相除，不是相減。 |

reviewed依據：

- `acid-base-balance`：「碳酸系統以 HCO₃⁻/H₂CO₃ 比值影響 pH，課本 pH＝pKa＋log（鹼/酸），示例 6.1＋log（26/1.3）≈7.4。呼吸增加 CO₂ 排出可減酸；腎臟分泌 H⁺並回收 HCO₃⁻。」

## F3

正解位置：2（0起算）不變；原正解「減少體液 pH 波動」→「讓酸不酸的數字（pH）較少變動」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 緩衝接收或釋放 H⁺的直接作用？ | 氫離子（H⁺）越多越酸；緩衝系統像接球一樣接住或放出氫離子，直接有什麼幫助？ |
| 選項1 | 酸全部離體 | 讓酸隨著尿液排出體外 |
| 選項2 | 取代肺腎 | 讓二氧化碳隨呼氣排出 |
| 選項3 | 減少體液 pH 波動 | 讓酸不酸的數字（pH）較少變動 |
| 選項4 | 每種緩衝都只能接收不能釋放 | 讓血液與尿液一起變酸 |
| 回饋1 | 承接當離體→仍要看去路 | 先接住酸還沒有把酸排出，隨尿排出需要腎臟幫忙。 |
| 回饋2 | 互補當替代→三系統配合 | 先接住酸還沒有把二氧化碳呼出，呼出需要肺幫忙。 |
| 回饋3 | （空白） | 接住或放出氫離子，可讓表示酸不酸的數字（pH）較少變動。 |
| 回饋4 | 單向化→原句同時有接收與釋放 | 先接住或放出氫離子，是減少酸鹼變動，不是讓血液和尿液一起變酸。 |

reviewed依據：

- `buffer-systems`：「緩衝系統以弱酸與其共軛鹼，接收或釋放 H⁺，減少血液與體液的 pH 波動。」
- `buffer-systems`：「緩衝先降低 pH 波動，再由呼吸排 CO₂、腎臟排酸調整；尿中 NH₄⁺與磷酸鹽攜酸與腎臟功能相連。」

## F4

正解位置：3（0起算）不變；原正解「可減酸」→「酸減少，血液比較不酸」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 其他條件相同且有效 CO₂排出增加時？ | 其他條件一樣，肺真正排出的二氧化碳（CO₂，會影響血液酸不酸的氣體）增加時，對血液有什麼影響？ |
| 選項1 | 酸負荷增加 | 酸增加，血液比較酸 |
| 選項2 | 肺停止參與 | 酸不變，只有尿液變酸 |
| 選項3 | 呼吸次數即可給精確 pH | 酸不變，只是呼吸變快 |
| 選項4 | 可減酸 | 酸減少，血液比較不酸 |
| 回饋1 | 方向反轉→排出CO₂可減酸 | 二氧化碳排出增加會減少酸，不是增加酸。 |
| 回饋2 | 功能反轉→排出正是肺端作用 | 這裡改變的是肺排出的二氧化碳，會影響血液的酸鹼。 |
| 回饋3 | 頻率代換→須有效排出，亦無數值足供計算 | 要看真正排出多少二氧化碳，不能只看呼吸快慢。 |
| 回饋4 | （空白） | 肺排出更多二氧化碳，可以讓血液比較不酸。 |

reviewed依據：

- `acid-base-balance`：「碳酸系統以 HCO₃⁻/H₂CO₃ 比值影響 pH，課本 pH＝pKa＋log（鹼/酸），示例 6.1＋log（26/1.3）≈7.4。呼吸增加 CO₂ 排出可減酸；腎臟分泌 H⁺並回收 HCO₃⁻。」
- `hypercapnia`：「若有效肺泡換氣不足，CO₂ 排出受限，需用 PCO₂ 與 pH 評估，而非只看呼吸次數。」

## F5

正解位置：0（0起算）不變；原正解「H⁺進管液、HCO₃⁻回血」→「氫離子進腎小管液，碳酸氫根回血液」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | H⁺與 HCO₃⁻正確去向？ | 腎臟幫血液減酸時，氫離子（H⁺，讓液體變酸）和碳酸氫根（HCO₃⁻，接酸的鹼）各往哪裡去？ |
| 選項1 | H⁺進管液、HCO₃⁻回血 | 氫離子進腎小管液，碳酸氫根回血液 |
| 選項2 | 都進管液 | 氫離子進腎小管液，碳酸氫根也進管液 |
| 選項3 | 都回血 | 氫離子回血液，碳酸氫根也回血液 |
| 選項4 | H⁺回血、HCO₃⁻進管液 | 氫離子回血液，碳酸氫根進腎小管液 |
| 回饋1 | （空白） | 腎臟把氫離子送進管液，並把接酸的碳酸氫根留回血液。 |
| 回饋2 | 鹼也排掉→辨認回收 | 碳酸氫根要留回血液，才能幫血液接住酸。 |
| 回饋3 | 酸也留血→辨認分泌 | 氫離子要送進管液排出，才能幫血液減酸。 |
| 回饋4 | 完全反向→兩箭頭同時比對血／管液 | 你把兩者的去向放反了：氫離子進管液，碳酸氫根回血液。 |

reviewed依據：

- `renal-acid-base-compensation`：「近曲小管以 Na⁺－H⁺相對運送分泌 H⁺；遠曲小管與集尿管主動分泌 H⁺，受醛固酮調節。NH₃ 結合 H⁺成 NH₄⁺，磷酸鹽也能承接 H⁺排出；同時 HCO₃⁻回到血液。」

## F6

正解位置：1（0起算）不變；原正解「形成 NH₄⁺配合尿中排酸」→「形成銨（NH₄⁺），隨尿帶走酸」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | NH₃承接 H⁺的作用？ | 氨（NH₃）會接住氫離子（H⁺，讓液體變酸）；這能怎麼幫腎臟排酸？ |
| 選項1 | 等同排掉 HCO₃⁻ | 形成碳酸氫根，隨尿帶走酸 |
| 選項2 | 形成 NH₄⁺配合尿中排酸 | 形成銨（NH₄⁺），隨尿帶走酸 |
| 選項3 | 尿液變酸必使血液更酸 | 形成銨（NH₄⁺），回血液帶走酸 |
| 選項4 | 只需結合而不需排出 | 形成碳酸，回血液帶走酸 |
| 回饋1 | 銨與鹼互換→形成物為NH₄⁺ | 氨接住氫離子後形成的是銨，不是碳酸氫根。 |
| 回饋2 | （空白） | 氨接住氫離子形成銨，再隨尿排出，就能帶走酸。 |
| 回饋3 | 混同區間→尿端排酸可協助血液 | 銨要隨尿排到體外，才算把酸帶走。 |
| 回饋4 | 結合當排出→仍須尿端去路 | 氨接住氫離子形成的是銨，要隨尿排出才能帶走酸。 |

reviewed依據：

- `renal-acid-base-compensation`：「腎臟藉分泌 H⁺、排出銨與可滴定酸，以及回收或產生 HCO₃⁻，調整血液酸鹼。」
- `renal-acid-base-compensation`：「近曲小管以 Na⁺－H⁺相對運送分泌 H⁺；遠曲小管與集尿管主動分泌 H⁺，受醛固酮調節。NH₃ 結合 H⁺成 NH₄⁺，磷酸鹽也能承接 H⁺排出；同時 HCO₃⁻回到血液。」
- `renal-acid-base-compensation`：「尿液變酸與血液變酸不是同方向的判斷；排掉酸性尿液是協助血液 pH 回升。」

## P-A

正解位置：0（0起算）不變；原正解「上升」→「變大，血液比較不酸」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 相同 pKa 下，鹼／酸比增加；其餘比較條件相同。pH 的方向為何？ | 其他條件一樣，碳酸（酸）的量不變，碳酸氫根（接酸的鹼）增加；表示酸不酸的數字（pH）會怎麼變？ |
| 選項1 | 上升 | 變大，血液比較不酸 |
| 選項2 | 下降 | 變小，血液比較酸 |
| 選項3 | 維持不變 | 不變，鹼的量不影響它 |
| 選項4 | 只憑方向即可算出精確 pH | 先變小，最後回到原來的值 |
| 回饋1 | （空白） | 接酸的鹼增加、酸不變時，血液比較不酸，pH會變大。 |
| 回饋2 | 分子分母方向反轉→鹼／酸比增加使 pH 上升 | 接酸的鹼增加會讓血液比較不酸，所以pH變大，不是變小。 |
| 回饋3 | 忽略比值→相同 pKa 下比值改變會改變 pH | 酸的量不變，但接酸的鹼增加也會讓pH變大。 |
| 回饋4 | 方向當數值→沒有實際新比值不能算精確 pH | 其他條件一樣時，接酸的鹼增加會使pH變大，沒有先變酸再回復的步驟。 |

reviewed依據：

- `acid-base-balance`：「碳酸系統以 HCO₃⁻/H₂CO₃ 比值影響 pH，課本 pH＝pKa＋log（鹼/酸），示例 6.1＋log（26/1.3）≈7.4。呼吸增加 CO₂ 排出可減酸；腎臟分泌 H⁺並回收 HCO₃⁻。」
- `buffer-systems`：「鹼/酸比增加使 pH 上升」

## P-B

正解位置：2（0起算）不變；原正解「下降」→「變小，血液比較酸」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 相同 pKa 下，鹼／酸比減少；其餘比較條件相同。pH 的方向為何？ | 其他條件一樣，碳酸（酸）的量不變，碳酸氫根（接酸的鹼）減少；表示酸不酸的數字（pH）會怎麼變？ |
| 選項1 | 維持不變 | 不變，鹼的量不影響它 |
| 選項2 | 上升 | 變大，血液比較不酸 |
| 選項3 | 下降 | 變小，血液比較酸 |
| 選項4 | 只憑方向即可算出精確 pH | 先變大，最後回到原來的值 |
| 回饋1 | 忽略比值→對數項會隨比值改變 | 酸的量不變，但接酸的鹼減少也會讓pH變小。 |
| 回饋2 | 方向顛倒→同 pKa 下對數隨比值減小 | 接酸的鹼減少會讓血液比較酸，所以pH變小，不是變大。 |
| 回饋3 | （空白） | 接酸的鹼減少、酸不變時，血液比較酸，pH會變小。 |
| 回饋4 | 方向當數值→只能判定方向，不能給出精確值 | 其他條件一樣時，接酸的鹼減少會使pH變小，沒有先減酸再回復的步驟。 |

reviewed依據：

- `acid-base-balance`：「碳酸系統以 HCO₃⁻/H₂CO₃ 比值影響 pH，課本 pH＝pKa＋log（鹼/酸），示例 6.1＋log（26/1.3）≈7.4。呼吸增加 CO₂ 排出可減酸；腎臟分泌 H⁺並回收 HCO₃⁻。」

## R-A

正解位置：1（0起算）不變；原正解「呼吸性酸中毒」→「呼吸性酸中毒（呼吸排不掉二氧化碳而變酸）」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 獨立比較：已知主要呼吸端變化為血中 CO₂增加，pH 偏低；題設為單純型。最符合哪個方向？ | 這次血液變酸的主要原因是呼吸排不掉二氧化碳（CO₂），血中二氧化碳增加，pH（越小越酸）偏低；最符合哪種酸鹼異常？ |
| 選項1 | 代謝性鹼中毒 | 代謝性鹼中毒（身體的酸減少或鹼增加） |
| 選項2 | 呼吸性酸中毒 | 呼吸性酸中毒（呼吸排不掉二氧化碳而變酸） |
| 選項3 | 呼吸性鹼中毒 | 呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸） |
| 選項4 | 代謝性酸中毒 | 代謝性酸中毒（身體的酸增加或鹼減少） |
| 回饋1 | 把呼吸端當代謝端且酸鹼反轉→核對CO₂與低pH | 這次是呼吸排不掉二氧化碳而變酸，不是身體的鹼增加。 |
| 回饋2 | （空白） | 二氧化碳增加讓血液變酸，主要原因在呼吸，符合呼吸性酸中毒。 |
| 回饋3 | 把高CO₂當低CO₂→本題是酸方向 | 二氧化碳增加讓血液變酸，不是呼出較多二氧化碳而變不酸。 |
| 回饋4 | 只見低pH就選代謝端→本題主要變化已指定CO₂ | 兩種情況都可能變酸，但這次已知主要原因是呼吸排不掉二氧化碳。 |
| 第二層理由1 | 因主要變化在 HCO₃⁻增加 | 因為主要變化是接酸的鹼增加 |
| 第二層理由2 | 因 CO₂增加使酸度增加，且本題主要變化在呼吸端 | 因為呼吸排不掉二氧化碳，血液因此變酸 |
| 第二層理由3 | 因只要呼吸次數多便一定排出更多 CO₂ | 因為呼吸變快，血液就會比較酸 |
| 第二層理由4 | 因 CO₂增加使酸度減少 | 因為二氧化碳增加會讓血液比較不酸 |
| 理由回饋1 | 錯換變數→題幹是CO₂增加，未給HCO₃⁻主變化 | 這次主要變化是二氧化碳增加，不是接酸的鹼增加。 |
| 理由回饋2 | （空白） | 主要原因在呼吸，二氧化碳留在血中增加會使血液變酸。 |
| 理由回饋3 | 頻率代換→不能用次數取代有效排出與血氣條件 | 呼吸快慢不能直接代表二氧化碳排出多少，要看實際排出。 |
| 理由回饋4 | 酸鹼反向→CO₂增加與酸度增加相連 | 二氧化碳增加會使血液比較酸，不是比較不酸。 |

理由正解位置：1（0起算）不變。

reviewed依據：

- `abg-interpretation`：「pH 低先判酸血症，pH 高先判鹼血症；CO₂ 增加使酸度增加，HCO₃⁻增加使鹼度增加。CO₂ 對應呼吸端，HCO₃⁻對應代謝端，再看另一端是否同時朝代償方向改變。」
- `abg-interpretation`：「高 CO₂ 配低 pH 為呼吸性酸方向」
- `hypercapnia`：「若有效肺泡換氣不足，CO₂ 排出受限，需用 PCO₂ 與 pH 評估，而非只看呼吸次數。」

## R-B

正解位置：0（0起算）不變；原正解「呼吸性鹼中毒」→「呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸）」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 獨立比較：已知主要呼吸端變化為血中 CO₂減少，pH 偏高；題設為單純型。最符合哪個方向？ | 這次血液變不酸的主要原因是呼吸排出較多二氧化碳（CO₂），血中二氧化碳減少，pH（越小越酸）偏高；最符合哪種酸鹼異常？ |
| 選項1 | 呼吸性鹼中毒 | 呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸） |
| 選項2 | 代謝性酸中毒 | 代謝性酸中毒（身體的酸增加或鹼減少） |
| 選項3 | 代謝性鹼中毒 | 代謝性鹼中毒（身體的酸減少或鹼增加） |
| 選項4 | 呼吸性酸中毒 | 呼吸性酸中毒（呼吸排不掉二氧化碳而變酸） |
| 回饋1 | （空白） | 呼出較多二氧化碳讓血液比較不酸，符合呼吸性鹼中毒。 |
| 回饋2 | 把呼吸端當代謝端且酸鹼反轉→核對低CO₂與高pH | 這次血液比較不酸，主要原因是呼吸排出較多二氧化碳。 |
| 回饋3 | 只見高pH就選代謝端→題幹主要變化指定CO₂ | 兩種情況都可能比較不酸，但這次已知主要原因在呼吸。 |
| 回饋4 | 把低CO₂當高CO₂→本題為鹼方向 | 這次是二氧化碳減少而比較不酸，不是二氧化碳增加而變酸。 |
| 第二層理由1 | 因 HCO₃⁻下降就是本題的主要呼吸變化 | 因為接酸的鹼減少，所以血液比較不酸 |
| 第二層理由2 | 因 CO₂減少必使 H⁺增加 | 因為二氧化碳減少，所以氫離子（讓液體變酸的小顆粒）增加 |
| 第二層理由3 | 因呼出 CO₂增多可使 H⁺減少，pH 上升 | 因為呼出較多二氧化碳，氫離子（讓液體變酸的小顆粒）減少，血液比較不酸 |
| 第二層理由4 | 因肺直接回收尿中 HCO₃⁻ | 因為肺把接酸的鹼留回血液 |
| 理由回饋1 | 角色互換→HCO₃⁻不是本題指定的主要呼吸變數 | 接酸的鹼減少會使血液比較酸，這次主要變化是二氧化碳減少。 |
| 理由回饋2 | 方向反轉→本題CO₂減少伴隨往減酸方向 | 氫離子是讓液體變酸的小顆粒，呼出較多二氧化碳會讓它減少。 |
| 理由回饋3 | （空白） | 氫離子是讓液體變酸的小顆粒，呼出較多二氧化碳可讓它減少，pH變大。 |
| 理由回饋4 | 器官與去路互換→肺端是CO₂，回血HCO₃⁻屬腎端 | 把接酸的鹼留回血液是腎臟的工作，肺負責排二氧化碳。 |

理由正解位置：2（0起算）不變。

reviewed依據：

- `respiratory-alkalosis`：「呼出 CO₂ 增多，使碳酸系統往減少 H⁺的方向改變，pH 上升。若伴隨代償，腎臟對酸與碳酸氫根的調節須與主要呼吸變化分開判讀。」
- `respiratory-alkalosis`：「低 CO₂ 與高 pH 配呼吸性鹼方向」
- `abg-interpretation`：「pH 低先判酸血症，pH 高先判鹼血症；CO₂ 增加使酸度增加，HCO₃⁻增加使鹼度增加。CO₂ 對應呼吸端，HCO₃⁻對應代謝端，再看另一端是否同時朝代償方向改變。」

## K-A

正解位置：2（0起算）不變；原正解「排酸留鹼，可協助血液 pH 回升」→「排酸留鹼，幫血液比較不酸」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 教學比較：呼吸性酸中毒已出現腎代償。從排出側觀察，酸性銨排泄增加，同時血漿 HCO₃⁻增加；整體功能最符合哪項？ | 呼吸性酸中毒是呼吸排不掉二氧化碳而讓血液變酸；腎臟把更多銨（帶著酸的NH₄⁺）排進尿液，也把更多碳酸氫根（HCO₃⁻，接酸的鹼）留回血液，這有什麼幫助？ |
| 選項1 | 只憑尿液變酸即可判定血液必定更酸 | 尿液更酸，也讓血液更酸 |
| 選項2 | 把 HCO₃⁻排掉 | 把鹼排掉，讓血液比較不酸 |
| 選項3 | 排酸留鹼，可協助血液 pH 回升 | 排酸留鹼，幫血液比較不酸 |
| 選項4 | 酸與鹼全留在血液 | 把酸留住，讓血液的鹼增加 |
| 回饋1 | 尿血同向迷思→排掉酸性尿液可協助血液 | 尿液帶走更多酸，可以幫血液減酸，不是讓血液也更酸。 |
| 回饋2 | 把回收當排掉→HCO₃⁻目的地是血 | 這裡是把碳酸氫根這種鹼留回血液，不是排掉鹼。 |
| 回饋3 | （空白） | 把酸排到尿裡、把鹼留回血液，可幫表示酸不酸的數字（pH）回升。 |
| 回饋4 | 把分泌當留血→H⁺已朝尿端 | 銨是帶著酸排出，不是把酸留在血液裡。 |
| 第二層理由1 | 因尿與血是同一個酸鹼區間 | 因為尿液變酸，血液也跟著變酸 |
| 第二層理由2 | 因 HCO₃⁻回血表示保留的是酸 | 因為留住碳酸氫根就是留住酸 |
| 第二層理由3 | 因只要緩衝結合就已排出全部酸 | 因為氫離子（讓液體變酸的小顆粒）被接住就已離開身體 |
| 第二層理由4 | 因 H⁺朝尿端、HCO₃⁻回血，兩種去向互補 | 因為氫離子（讓液體變酸的小顆粒）送進尿裡、碳酸氫根留回血液，都幫血液減酸 |
| 理由回饋1 | 區間合併→先分血與管液再判斷 | 尿液把酸帶走，可以幫血液比較不酸。 |
| 理由回饋2 | 把鹼當酸→保留HCO₃⁻不是保留H⁺ | 碳酸氫根是接酸的鹼，留住它不是留住酸。 |
| 理由回饋3 | 暫存當排出→本題談尿端去路，不是單純結合 | 氫離子只是被接住還沒離開身體，仍要排到體外。 |
| 理由回饋4 | （空白） | 把氫離子排出、把接酸的碳酸氫根留下，都能幫血液減酸。 |

理由正解位置：3（0起算）不變。

reviewed依據：

- `renal-acid-base-compensation`：「近曲小管以 Na⁺－H⁺相對運送分泌 H⁺；遠曲小管與集尿管主動分泌 H⁺，受醛固酮調節。NH₃ 結合 H⁺成 NH₄⁺，磷酸鹽也能承接 H⁺排出；同時 HCO₃⁻回到血液。」
- `renal-acid-base-compensation`：「排銨增加與保留碳酸氫根增加是同方向的排酸留鹼」
- `renal-acid-base-compensation`：「尿液變酸與血液變酸不是同方向的判斷；排掉酸性尿液是協助血液 pH 回升。」
- `renal-acid-base-compensation`：「呼吸性酸中毒可由腎臟增加酸性銨排泄與血漿 HCO₃⁻來代償；血液 pH 降低時腎小管排酸作用增加。」

## K-B

正解位置：0（0起算）不變；原正解「共同完成排酸留鹼」→「一起排酸留鹼，讓血液比較不酸」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 同一呼吸性酸中毒的腎代償，改從保留側觀察：HCO₃⁻回到血液，並非隨尿排掉。它與 H⁺排入管液的功能關係為何？ | 呼吸性酸中毒是呼吸排不掉二氧化碳而讓血液變酸；腎臟把碳酸氫根（HCO₃⁻，接酸的鹼）留回血液，也把氫離子（H⁺，讓液體變酸）送進管液，這兩件事怎麼配合？ |
| 選項1 | 共同完成排酸留鹼 | 一起排酸留鹼，讓血液比較不酸 |
| 選項2 | 兩者都在增加血中酸負荷 | 一起把酸留住，讓血液比較酸 |
| 選項3 | 回血與排尿都表示酸鹼全部離體 | 一起把鹼排掉，讓血液比較酸 |
| 選項4 | 回收 HCO₃⁻會抵銷腎臟排酸 | 留下鹼會抵銷排酸，血液酸鹼不變 |
| 回饋1 | （空白） | 留下接酸的鹼、排出氫離子，都能幫血液比較不酸。 |
| 回饋2 | 把保鹼與留酸混同→區別HCO₃⁻與H⁺ | 碳酸氫根是接酸的鹼，氫離子則送進管液，並沒有一起留酸。 |
| 回饋3 | 混同兩端去向→回血不等於離體 | 碳酸氫根是留回血液，不是和氫離子一起排掉。 |
| 回饋4 | 把互補當抵銷→保鹼與排酸同方向 | 留鹼與排酸都幫血液減酸，兩者不會互相抵銷。 |
| 第二層理由1 | 因保留鹼與排出酸互補，而非互相抵銷 | 因為留住接酸的鹼、排出酸，都幫血液減酸 |
| 第二層理由2 | 因 HCO₃⁻與 H⁺都必須回到血液 | 因為接酸的鹼和氫離子，都要留回血液 |
| 第二層理由3 | 因回收就是把 HCO₃⁻排到尿中 | 因為回收碳酸氫根，就是把它排進尿裡 |
| 第二層理由4 | 因尿液與血液 pH 必須同向改變 | 因為尿液變酸，血液也要一起變酸 |
| 理由回饋1 | （空白） | 留鹼與排酸都幫血液比較不酸，兩者可以一起作用。 |
| 理由回饋2 | 去向混同→H⁺分泌往管液 | 氫離子要送進管液排出，碳酸氫根才是留回血液。 |
| 理由回饋3 | 回收顛倒→HCO₃⁻目的地為血 | 回收是把碳酸氫根留回血液，不是排到尿裡。 |
| 理由回饋4 | 區間混同→不可由尿液方向直接推血液 | 尿液帶走酸，能幫血液減酸，兩者不必一起變酸。 |

理由正解位置：0（0起算）不變。

reviewed依據：

- `renal-acid-base-compensation`：「近曲小管以 Na⁺－H⁺相對運送分泌 H⁺；遠曲小管與集尿管主動分泌 H⁺，受醛固酮調節。NH₃ 結合 H⁺成 NH₄⁺，磷酸鹽也能承接 H⁺排出；同時 HCO₃⁻回到血液。」
- `renal-acid-base-compensation`：「排銨增加與保留碳酸氫根增加是同方向的排酸留鹼」
- `renal-acid-base-compensation`：「尿液變酸與血液變酸不是同方向的判斷；排掉酸性尿液是協助血液 pH 回升。」
- `renal-acid-base-compensation`：「呼吸性酸中毒可由腎臟增加酸性銨排泄與血漿 HCO₃⁻來代償；血液 pH 降低時腎小管排酸作用增加。」

## N-A

正解位置：3（0起算）不變；原正解「不能，形成與排出須分開」→「不能，接住酸和排出酸是兩件事」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | NH₃已結合 H⁺形成 NH₄⁺，但題設指出形成物仍在體內，尚未隨尿排出。能否僅據結合就說酸已離體？ | 氨（NH₃）接住氫離子（H⁺，讓液體變酸）形成銨（NH₄⁺），銨還在體內，尚未隨尿排出；這時能說酸已排出體外嗎？ |
| 選項1 | 能，結合即代表酸消失 | 能，接住酸就等於酸已消失 |
| 選項2 | 能，尿與血不需區分 | 能，形成銨就等於尿已排出 |
| 選項3 | 不能，因 NH₃無法結合 H⁺ | 不能，因為氨還沒接住氫離子 |
| 選項4 | 不能，形成與排出須分開 | 不能，接住酸和排出酸是兩件事 |
| 回饋1 | 結合當離體→仍未越過體外界線 | 接住酸只是改變它的形式，酸沒有因此消失。 |
| 回饋2 | 混同區間→仍須辨認尿端排出 | 形成銨之後還要隨尿排到體外，才算把酸排出。 |
| 回饋3 | 否定正確形成反應→NH₃可結合H⁺成NH₄⁺ | 氨已經接住氫離子形成銨，接下來還要隨尿排出。 |
| 回饋4 | （空白） | 銨仍在體內，還要隨尿排出才算把酸帶走。 |
| 第二層理由1 | 因緩衝物結合後都已經排出體外 | 因為酸一被接住，就已經離開身體 |
| 第二層理由2 | 因形成 NH₄⁺與將銨排出是不同步驟 | 因為先形成銨，再隨尿排出，是兩個步驟 |
| 第二層理由3 | 因所有緩衝都不能承接 H⁺ | 因為銨還留在體內，就表示氨沒有接住酸 |
| 第二層理由4 | 因 NH₄⁺就是 HCO₃⁻ | 因為氨接住氫離子後，形成的是碳酸氫根 |
| 理由回饋1 | 越界推論→本題明說仍在體內 | 酸被接住後還在體內，要隨尿排出才算離開身體。 |
| 理由回饋2 | （空白） | 銨已形成但還在體內，所以還要隨尿排出才能帶走酸。 |
| 理由回饋3 | 否定緩衝功能→承接與離體不同 | 氨已接住氫離子形成銨，只是銨還沒隨尿排出。 |
| 理由回饋4 | 物質混同→NH₄⁺為銨，HCO₃⁻為碳酸氫根 | 氨接住氫離子形成的是銨，不是接酸的碳酸氫根。 |

理由正解位置：1（0起算）不變。

reviewed依據：

- `buffer-systems`：「化學暫時接住 H⁺與真正排出酸不同；細胞外、血球與尿液中緩衝的所在不可混同。」
- `renal-acid-base-compensation`：「腎臟藉分泌 H⁺、排出銨與可滴定酸，以及回收或產生 HCO₃⁻，調整血液酸鹼。」
- `renal-acid-base-compensation`：「近曲小管以 Na⁺－H⁺相對運送分泌 H⁺；遠曲小管與集尿管主動分泌 H⁺，受醛固酮調節。NH₃ 結合 H⁺成 NH₄⁺，磷酸鹽也能承接 H⁺排出；同時 HCO₃⁻回到血液。」

## N-B

正解位置：2（0起算）不變；原正解「本題具有尿端攜酸排出的去路」→「銨帶著酸，已隨尿排到體外」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 相反邊界條件：題設明示已形成的 NH₄⁺隨尿排出體外。它與僅在體內暫時承接 H⁺有何不同？ | 銨（NH₄⁺，由氨接住讓液體變酸的氫離子而形成）已隨尿排出體外；與只在體內接住酸相比，有什麼不同？ |
| 選項1 | 兩者都只在體內暫存 | 酸還在體內，只是換成銨的形式 |
| 選項2 | 排出 NH₄⁺不涉及腎臟排酸 | 只有水排出，銨帶著的酸仍在體內 |
| 選項3 | 本題具有尿端攜酸排出的去路 | 銨帶著酸，已隨尿排到體外 |
| 選項4 | NH₄⁺排出必然把全部 HCO₃⁻一併排掉 | 酸和接酸的鹼，都要一起隨尿排出 |
| 回饋1 | 忽略體外界線→本題已明示隨尿離體 | 這次銨已隨尿排到體外，帶著的酸也離開了身體。 |
| 回饋2 | 否定銨排酸→腎臟排銨可調整酸鹼 | 銨不是只有水，它也能隨尿把酸帶到體外。 |
| 回饋3 | （空白） | 銨隨尿離開身體，才能把接住的酸帶到體外。 |
| 回饋4 | 物質綁定迷思→排銨與保留HCO₃⁻可同方向 | 排銨能帶走酸，腎臟同時可以把接酸的碳酸氫根留回血液。 |
| 第二層理由1 | 因尿中銨可攜酸排出，不能把此去路與體內暫存混為一談 | 因為銨已隨尿把酸帶出身體，不只是接住酸 |
| 第二層理由2 | 因在體內結合就等同尿已排出 | 因為接住酸就等於尿液已離開身體 |
| 第二層理由3 | 因磷酸鹽參與後銨就不能攜酸 | 因為銨隨尿排出時，只會帶走水 |
| 第二層理由4 | 因排出酸必須把鹼全部排掉 | 因為排出銨時，也要把接酸的鹼全部排掉 |
| 理由回饋1 | （空白） | 這次銨已隨尿排出，帶著的酸也離開了身體。 |
| 理由回饋2 | 結合當排出→與題設的兩種邊界條件不符 | 接住酸還需要排尿這一步，才算把酸帶到體外。 |
| 理由回饋3 | 互補當互斥→原句列銨與磷酸鹽皆有角色 | 銨可以隨尿把酸帶走，不是只排出水。 |
| 理由回饋4 | 排酸等於排鹼→保留HCO₃⁻與排銨可互補 | 排銨帶走酸的同時，腎臟可以把接酸的鹼留回血液。 |

理由正解位置：0（0起算）不變。

reviewed依據：

- `buffer-systems`：「緩衝先降低 pH 波動，再由呼吸排 CO₂、腎臟排酸調整；尿中 NH₄⁺與磷酸鹽攜酸與腎臟功能相連。」
- `renal-acid-base-compensation`：「腎臟藉分泌 H⁺、排出銨與可滴定酸，以及回收或產生 HCO₃⁻，調整血液酸鹼。」
- `renal-acid-base-compensation`：「排銨增加與保留碳酸氫根增加是同方向的排酸留鹼」

## S-A

正解位置：1（0起算）不變；原正解「代謝性酸中毒」→「代謝性酸中毒（身體的酸增加或鹼減少）」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 獨立比較：題設為單純型，主要代謝端變化是 HCO₃⁻減少，血液 pH 偏低。哪項最符合？ | 這次血液變酸的主要原因是碳酸氫根（HCO₃⁻，接酸的鹼）減少，pH（越小越酸）偏低；最符合哪種酸鹼異常？ |
| 選項1 | 呼吸性酸中毒 | 呼吸性酸中毒（呼吸排不掉二氧化碳而變酸） |
| 選項2 | 代謝性酸中毒 | 代謝性酸中毒（身體的酸增加或鹼減少） |
| 選項3 | 代謝性鹼中毒 | 代謝性鹼中毒（身體的酸減少或鹼增加） |
| 選項4 | 只由 pH 低即可確定 CO₂是主要原因 | 呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸） |
| 回饋1 | 把代謝端當呼吸端→題幹主要變化是HCO₃⁻ | 這次主要是接酸的鹼減少，不是呼吸排不掉二氧化碳。 |
| 回饋2 | （空白） | 接酸的碳酸氫根減少、血液變酸，符合代謝性酸中毒。 |
| 回饋3 | 酸鹼反轉→低HCO₃⁻配低pH為代謝性酸方向 | 這次接酸的鹼減少，血液是變酸，不是比較不酸。 |
| 回饋4 | 單看pH猜來源→題目已給HCO₃⁻主變化，需一起讀條件 | 這次接酸的鹼減少而變酸，不是呼吸排出較多二氧化碳。 |

reviewed依據：

- `abg-interpretation`：「pH 低先判酸血症，pH 高先判鹼血症；CO₂ 增加使酸度增加，HCO₃⁻增加使鹼度增加。CO₂ 對應呼吸端，HCO₃⁻對應代謝端，再看另一端是否同時朝代償方向改變。」
- `abg-interpretation`：「低 HCO₃⁻配低 pH 為代謝性酸方向」
- `abg-interpretation`：「pH 靠近正常不能單獨排除代償；指定頁面沒有完整混合型判讀與代償預測公式，不能僅靠本卡做全部臨床判斷。」

## S-B

正解位置：3（0起算）不變；原正解「代謝性鹼中毒」→「代謝性鹼中毒（身體的酸減少或鹼增加）」，同一觀念。

| 欄位 | 舊 | 新 |
|---|---|---|
| 題幹 | 獨立比較：題設為單純型，主要代謝端變化是 HCO₃⁻增加，血液 pH 偏高。哪項最符合？ | 這次血液變不酸的主要原因是碳酸氫根（HCO₃⁻，接酸的鹼）增加，pH（越小越酸）偏高；最符合哪種酸鹼異常？ |
| 選項1 | 只要 pH 高就是呼吸性鹼中毒 | 呼吸性鹼中毒（呼吸排出較多二氧化碳而變不酸） |
| 選項2 | 代謝性酸中毒 | 代謝性酸中毒（身體的酸增加或鹼減少） |
| 選項3 | 呼吸性酸中毒 | 呼吸性酸中毒（呼吸排不掉二氧化碳而變酸） |
| 選項4 | 代謝性鹼中毒 | 代謝性鹼中毒（身體的酸減少或鹼增加） |
| 回饋1 | 單看pH忽略來源→本題主變化是HCO₃⁻ | 這次主要是接酸的鹼增加，不是呼吸排出較多二氧化碳。 |
| 回饋2 | 酸鹼反轉→本題是鹼方向 | 接酸的鹼增加讓血液比較不酸，不是鹼減少而變酸。 |
| 回饋3 | 來源與酸鹼都反轉→題幹為代謝端偏鹼 | 這次是接酸的鹼增加，不是呼吸排不掉二氧化碳而變酸。 |
| 回饋4 | （空白） | 接酸的碳酸氫根增加、血液比較不酸，符合代謝性鹼中毒。 |

reviewed依據：

- `abg-interpretation`：「pH 低先判酸血症，pH 高先判鹼血症；CO₂ 增加使酸度增加，HCO₃⁻增加使鹼度增加。CO₂ 對應呼吸端，HCO₃⁻對應代謝端，再看另一端是否同時朝代償方向改變。」
- `metabolic-alkalosis`：「代謝性鹼中毒是代謝端酸減少或鹼增加，使血液 pH 朝高值偏移，常見 HCO₃⁻增加。」

## Glossary舊新對照

| 詞條 | 舊 | 新 |
|---|---|---|
| buffer | 以弱酸與共軛鹼接收或釋放氫離子（H⁺），減少酸鹼值（pH）波動。接住酸不等於已將酸排出體外。 | 緩衝像接球：先接住多出的氫離子（H⁺，讓液體變酸的小顆粒），需要時也能放出，讓pH（表示酸不酸的數字，越小越酸）較少變動。接住酸後，仍需要肺或腎臟幫忙排出。 |
| ratio | 碳酸氫根（HCO₃⁻）是鹼，碳酸（H₂CO₃）是酸。相同pKa下，鹼／酸比增加使pH上升。 | 碳酸氫根（HCO₃⁻）是接酸的鹼，碳酸（H₂CO₃）是酸。課本算式把鹼的量放上面、酸的量放下面相除。其他條件一樣，鹼相對於酸變多，pH（表示酸不酸的數字，越小越酸）就變大。 |
| resp | 呼吸可將二氧化碳（CO₂）排出。有效CO₂排出增加可減酸，不能只用呼吸次數判斷。 | 肺能把二氧化碳（CO₂，會影響血液酸不酸的氣體）呼出。真正排出的二氧化碳增加，可以減少血液的酸；呼吸變快不代表排出一定增加。 |
| renal | 腎小管分泌氫離子（H⁺）到管液，碳酸氫根（HCO₃⁻）回到血液。尿液變酸不能直接推論血液也變酸。 | 腎臟把氫離子（H⁺，讓液體變酸的小顆粒）送進管液，之後隨尿排出；把碳酸氫根（HCO₃⁻，接酸的鹼）留回血液。尿液帶走酸，可幫血液比較不酸。 |
| ammonium | 氨（NH₃）結合氫離子（H⁺）形成銨（NH₄⁺）。腎臟排銨與保留碳酸氫根（HCO₃⁻）共同排酸留鹼。 | 氨（NH₃）接住氫離子（H⁺，讓液體變酸的小顆粒）後，形成銨（NH₄⁺）。銨隨尿排出才能把酸帶走；腎臟同時可留下碳酸氫根（HCO₃⁻，接酸的鹼）。 |
| resp-acid | 主要呼吸端CO₂增加、血液pH偏低，是呼吸性酸中毒方向。腎代償可增加酸性銨排泄與血漿HCO₃⁻。 | 呼吸性酸中毒：呼吸排不掉二氧化碳（CO₂），血液因此變酸，pH（表示酸不酸的數字，越小越酸）偏低。腎臟可增加銨（NH₄⁺，帶著酸）的排出，並留下更多碳酸氫根（HCO₃⁻，接酸的鹼）幫血液減酸。 |
| resp-alk | CO₂減少、血液pH偏高，是呼吸性鹼中毒方向。呼吸次數不能取代實際有效換氣的判斷。 | 呼吸性鹼中毒：呼吸排出較多二氧化碳（CO₂），血液因此比較不酸，pH（表示酸不酸的數字，越小越酸）偏高。要看真正排出的二氧化碳，不能只看呼吸快慢。 |
| met-acid | 主要代謝端HCO₃⁻減少、血液pH偏低，是代謝性酸中毒方向。要把主要變化和另一端的代償分開讀。 | 代謝性酸中毒：身體的酸增加或鹼減少，讓血液變酸。碳酸氫根（HCO₃⁻）是接酸的鹼；它減少時，pH（表示酸不酸的數字，越小越酸）會往低值變。 |
| met-alk | 代謝端酸減少或鹼增加，使血液pH偏高，常見HCO₃⁻增加。不能只看到pH高就選呼吸性異常。 | 代謝性鹼中毒：身體的酸減少或鹼增加，讓血液比較不酸。常見碳酸氫根（HCO₃⁻，接酸的鹼）增加，pH（表示酸不酸的數字，越小越酸）往高值變。 |

詞條沿用各自的sources：buffer→buffer-systems；ratio→acid-base-balance／buffer-systems；resp→acid-base-balance／hypercapnia；renal、ammonium→renal-acid-base-compensation；resp-acid→abg-interpretation／renal-acid-base-compensation；resp-alk→respiratory-alkalosis／hypercapnia；met-acid→abg-interpretation；met-alk→metabolic-alkalosis／abg-interpretation。精確引文見full-before.json及content/acid-base-homeostasis-full.json。

## 手機390×844修改前後

選項排列順序由播放器打亂；保留data-pool原始索引判分，因此回饋不提選項字母。酸鹼配對池會抽題，前後assessment可能不同題；同一題的逐字差異以本報告舊新表為準。

### 酸鹼assessment

修改前：
![修改前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/before/acid-base-homeostasis/shots/390x844-assessment.png)

修改後：
![修改後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/verify/acid-base-homeostasis/shots/390x844-assessment.png)

### 腎臟第一題

修改前：
![修改前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/before/kidney-anatomy/shots/390x844-foundation-1.png)

修改後：
![修改後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/verify/kidney-anatomy/shots/390x844-foundation-1.png)

### 尿液濃縮第一題

修改前：
![修改前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/before/urine-concentration/shots/390x844-foundation-1.png)

修改後：
![修改後](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/verify/urine-concentration/shots/390x844-foundation-1.png)

## 驗證與實際輸出

- 來源使用既有外部01_knowledge與todo_all.jsonl，content-check逐條確認reviewed、引文原句與來源UID；未改來源卡。
- 完整精確文件SHA核可，只對該文件略過舊設計文字比對；結構、答案範圍、配對、reviewed與圖關聯仍照常檢查；多改任一字、答案或來源會落回原設計檢查而FAIL。
- 八尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。
- 酸鹼最後補上選項間距後重跑八尺寸，最終證據以acid-final-eight.log及verify/acid-base-homeostasis為準；其他九份HTML與已驗證版本逐byte相同。
- 本機攔截course-learning.js事件，逐筆validEvent與reduceLearning；答錯、重來、回讀、五組配對與完成都實走，無正式學生資料寫入。
- 修改前截圖由77ff0dd9的正式HTML與full-before.json重跑，舊版的大間距會被新增量測標成預期FAIL；不是本次版本FAIL。首次捕圖錯用新題文比舊HTML，原輸出before-initial.log保留，後以相符的舊題文重跑before.log。

### 結構／禁用詞／化學首次解釋

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/validation.log)

```text
{
  "unexplainedChemistry": [],
  "pass": true,
  "questions": 16,
  "glossary": 9,
  "structuralChanges": 0,
  "sourcesOrNodesChanges": 0,
  "bannedTerms": 0,
  "documentSha256": "37a46c4efd2074337098f78b090ea74833946801fdd515f87fabd2f4a2aef2d1"
}
```

### 十份content-check

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/content.log)

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

### 十份verify／SCRIPT_DIFF／八尺寸／事件

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/verify-ten-output.txt)

```text
{"slug":"kidney-anatomy","pass":true,"version":"kidney-anatomy-v1","formalSha256":"db793d205b06f2bb68ea5d5c60867bd859022ec614921e0986f0e9e202850a41","cases":652,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":29,"invalid":0,"completed":1},{"size":[390,844],"events":34,"invalid":0,"completed":1},{"size":[414,896],"events":29,"invalid":0,"completed":1},{"size":[768,1024],"events":29,"invalid":0,"completed":1},{"size":[820,1180],"events":29,"invalid":0,"completed":1},{"size":[1024,1366],"events":29,"invalid":0,"completed":1},{"size":[1280,800],"events":29,"invalid":0,"completed":1},{"size":[844,390],"events":29,"invalid":0,"completed":1}]}
{"slug":"nephron-circulation","pass":true,"version":"nephron-circulation-v1","formalSha256":"0865551f9598900c83e6fee53c7bba5d0e4b2cab9a4eba93911b787d70a37fe9","cases":675,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":14},"contentCheck":true,"events":[{"size":[360,667],"events":27,"invalid":0,"completed":1},{"size":[390,844],"events":30,"invalid":0,"completed":1},{"size":[414,896],"events":27,"invalid":0,"completed":1},{"size":[768,1024],"events":27,"invalid":0,"completed":1},{"size":[820,1180],"events":27,"invalid":0,"completed":1},{"size":[1024,1366],"events":27,"invalid":0,"completed":1},{"size":[1280,800],"events":27,"invalid":0,"completed":1},{"size":[844,390],"events":27,"invalid":0,"completed":1}]}
{"slug":"filtration-clearance","pass":true,"version":"filtration-clearance-v1","formalSha256":"5acc1704a056331c6ec619ec363e2434b8ad51a51d54f7a4ebee755c2d4eaf30","cases":628,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":29,"invalid":0,"completed":1},{"size":[390,844],"events":33,"invalid":0,"completed":1},{"size":[414,896],"events":29,"invalid":0,"completed":1},{"size":[768,1024],"events":29,"invalid":0,"completed":1},{"size":[820,1180],"events":29,"invalid":0,"completed":1},{"size":[1024,1366],"events":29,"invalid":0,"completed":1},{"size":[1280,800],"events":29,"invalid":0,"completed":1},{"size":[844,390],"events":29,"invalid":0,"completed":1}]}
{"slug":"tubular-handling","pass":true,"version":"tubular-handling-v1","formalSha256":"8d11318fa6a1951142b6bf9e0dda815269df029dc0b9af088fb4f07c7698912f","cases":644,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":16},"contentCheck":true,"events":[{"size":[360,667],"events":31,"invalid":0,"completed":1},{"size":[390,844],"events":35,"invalid":0,"completed":1},{"size":[414,896],"events":31,"invalid":0,"completed":1},{"size":[768,1024],"events":31,"invalid":0,"completed":1},{"size":[820,1180],"events":31,"invalid":0,"completed":1},{"size":[1024,1366],"events":31,"invalid":0,"completed":1},{"size":[1280,800],"events":31,"invalid":0,"completed":1},{"size":[844,390],"events":31,"invalid":0,"completed":1}]}
{"slug":"urine-concentration","pass":true,"version":"urine-concentration-v1","formalSha256":"e3f231159ae0fc108a3f490da7e04831ca3648b783726693b1d5cb587efb5d87","cases":654,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":17},"contentCheck":true,"events":[{"size":[360,667],"events":33,"invalid":0,"completed":1},{"size":[390,844],"events":39,"invalid":0,"completed":1},{"size":[414,896],"events":33,"invalid":0,"completed":1},{"size":[768,1024],"events":33,"invalid":0,"completed":1},{"size":[820,1180],"events":33,"invalid":0,"completed":1},{"size":[1024,1366],"events":33,"invalid":0,"completed":1},{"size":[1280,800],"events":33,"invalid":0,"completed":1},{"size":[844,390],"events":33,"invalid":0,"completed":1}]}
{"slug":"urinary-route-micturition","pass":true,"version":"urinary-route-micturition-v2","formalSha256":"9ad732ceeda575ca2684405fbc4105ff1b6f592f5a37436d78e4f98874099972","cases":701,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":16},"contentCheck":true,"events":[{"size":[360,667],"events":31,"invalid":0,"completed":1},{"size":[390,844],"events":36,"invalid":0,"completed":1},{"size":[414,896],"events":31,"invalid":0,"completed":1},{"size":[768,1024],"events":31,"invalid":0,"completed":1},{"size":[820,1180],"events":31,"invalid":0,"completed":1},{"size":[1024,1366],"events":31,"invalid":0,"completed":1},{"size":[1280,800],"events":31,"invalid":0,"completed":1},{"size":[844,390],"events":31,"invalid":0,"completed":1}]}
{"slug":"fluid-compartments","pass":true,"version":"fluid-compartments-v1","formalSha256":"bf7ee8d149a538fb991751ed2fcf5a5f8101daea97e5b0e0ce6e286c6275425c","cases":618,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":14},"contentCheck":true,"events":[{"size":[360,667],"events":27,"invalid":0,"completed":1},{"size":[390,844],"events":29,"invalid":0,"completed":1},{"size":[414,896],"events":27,"invalid":0,"completed":1},{"size":[768,1024],"events":27,"invalid":0,"completed":1},{"size":[820,1180],"events":27,"invalid":0,"completed":1},{"size":[1024,1366],"events":27,"invalid":0,"completed":1},{"size":[1280,800],"events":27,"invalid":0,"completed":1},{"size":[844,390],"events":27,"invalid":0,"completed":1}]}
{"slug":"water-sodium-regulation","pass":true,"version":"water-sodium-regulation-v1","formalSha256":"216988546dee8d2a535f2f313f7b5cb2b8d6e73d85abf128a7a912817aedb78d","cases":659,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":29,"invalid":0,"completed":1},{"size":[390,844],"events":32,"invalid":0,"completed":1},{"size":[414,896],"events":29,"invalid":0,"completed":1},{"size":[768,1024],"events":29,"invalid":0,"completed":1},{"size":[820,1180],"events":29,"invalid":0,"completed":1},{"size":[1024,1366],"events":29,"invalid":0,"completed":1},{"size":[1280,800],"events":29,"invalid":0,"completed":1},{"size":[844,390],"events":29,"invalid":0,"completed":1}]}
{"slug":"electrolyte-balance","pass":true,"version":"electrolyte-balance-v1","formalSha256":"3bd34712140d6986e2c26dcc68b2b5f2dc6d28b93f2b8598328102cbe403a1bd","cases":673,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":29,"invalid":0,"completed":1},{"size":[390,844],"events":30,"invalid":0,"completed":1},{"size":[414,896],"events":29,"invalid":0,"completed":1},{"size":[768,1024],"events":29,"invalid":0,"completed":1},{"size":[820,1180],"events":29,"invalid":0,"completed":1},{"size":[1024,1366],"events":29,"invalid":0,"completed":1},{"size":[1280,800],"events":29,"invalid":0,"completed":1},{"size":[844,390],"events":29,"invalid":0,"completed":1}]}
{"slug":"acid-base-homeostasis","pass":true,"version":"acid-base-homeostasis-v1","formalSha256":"172c4c07cbe24ca3a4b8829cae66a719cb8f331a4f9e2412925a1182e10b7197","cases":648,"SCRIPT_DIFF":{"missing":0,"changedOrExtra":0,"pass":true},"registration":{"nodeTotal":6,"questionTotal":15},"contentCheck":true,"events":[{"size":[360,667],"events":63,"invalid":0,"completed":1},{"size":[390,844],"events":62,"invalid":0,"completed":1},{"size":[414,896],"events":62,"invalid":0,"completed":1},{"size":[768,1024],"events":62,"invalid":0,"completed":1},{"size":[820,1180],"events":62,"invalid":0,"completed":1},{"size":[1024,1366],"events":62,"invalid":0,"completed":1},{"size":[1280,800],"events":62,"invalid":0,"completed":1},{"size":[844,390],"events":62,"invalid":0,"completed":1}]}
{"pass":true,"materials":10,"ordinaryRebuilt":9,"acidFullRewritten":true,"viewports":8,"materialViewportFlows":80,"layoutCases":6552,"events":2650,"invalidEvents":0}
```

### 檢查器回歸

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/checker-tests.log)

```text
1..33
# tests 33
# suites 0
# pass 33
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 14311.452708
```

### npm run check

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/npm-check.log)

```text
# tests 208
# pass 208
# fail 0
# skipped 0
# duration_ms 221876.314292
✓ built in 1.43s
# tests 61
# pass 61
# fail 0
# skipped 0
# duration_ms 535.674583
```

### 交接守門

[完整實際輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-plain/check-handoff.log)

```text
PASS handoff: 1698/4000字；queue: 23/25件；週誌與索引合規
```

## 重現指令

```sh
export PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH
python3 docs/urinary-release/acidbase-plain/validate.py
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/acidbase-plain/content-browser-check.mjs
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/acidbase-plain/verify-eight.mjs
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs docs/urinary-release/acidbase-plain/verify-ten.mjs
node --test tests/acidbase-full.test.mjs tests/apply-final-ui.test.mjs tests/apply-neutral.test.mjs tests/apply-kit.test.mjs
npm run check
```


## 最終統計

```json
{
  "pass": true,
  "materials": 10,
  "viewports": 8,
  "flows": 80,
  "layoutCases": 6552,
  "events": 2650,
  "invalidEvents": 0,
  "measuredAssessmentScreens": 1208,
  "maxGapPx": 18,
  "minGapPx": 5,
  "phoneComparisons": [
    {
      "slug": "kidney-anatomy",
      "beforePx": 295.609375,
      "afterPx": 16
    },
    {
      "slug": "urine-concentration",
      "beforePx": 283.90625,
      "afterPx": 16
    }
  ]
}
```

一般教材其他畫面逐byte比對見[範圍證據](acidbase-plain/unchanged-other-screens.json)；十份HTML的meta render SHA均由建置器重算。
