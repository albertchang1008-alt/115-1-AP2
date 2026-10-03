# 心臟II／合併單元複驗修正（2026-10-03，Codex）

版本 1.6.4；分支 `feature/cardiac-output-visuals`，比對基底 `e86761f`。本次完成 Claude 複驗 b31b36d／9fd996d 的 A1–A10（含 A9 建議）、M1，以及先前心臟II 必修 1、3、4 與建議 5–8。未 push、未部署、未操作正式學生資料，交 Claude 複驗。

## 修正勾核

| 項目 | 完成內容 |
|---|---|
| A1 | 共用底圖與放大圖使用圓錐形心臟，心底在上、心尖朝人體左下；右心房獨立，大血管從心底出入。 |
| A2 | 四段各有獨立曲線／分界；短升主動脈、寬弓、三分支、胸段到橫膈、腹段到髂分叉；引線指各段；左腳／胃顯示路徑補足四段。 |
| A3 | 寬標籤區、單行完整標籤、垂直間距至少一行；左鎖骨下動脈只標一次，移除重複交叉引線。四狀態可見引線交叉數 0。 |
| A4 | 右手只高亮升段／弓／頭臂與上肢血管，胸段／腹段保持淡色。 |
| A5 | 較大 J 形胃、短腹腔幹與胃小彎動脈；胃靜脈單一平滑曲線通往人體右側肝門。 |
| A6 | 放大圖上下腔靜脈分別終止於右心房上下；加主動脈／腹腔幹；肝臟與主圖同楔形、放大。 |
| A7 | 顳脈搏點移至耳前、顴弓上方；膕動脈標示「膝後」。 |
| A8 | 股靜脈位於股動脈內側；髂外／股動脈通過腹股溝中點後走大腿內側。 |
| A9 | 頸動靜脈留在頸部兩側，臉側分支不跨過臉部中線。 |
| A10 | 原創漸層管狀全段圖／弓放大圖、三分支／冠狀開口／穹頂橫膈／L4；四按鈕顯示起訖、aria-pressed、鍵盤／重點一次還原，未選段 .3；新增指定誤解句。 |
| M1 | draft 空但 published 非空時，預覽顯示「學生端（已發布版本）的「X」仍有次單元，請先發布後再合併」，確認停用、無權杖；偽造提交也拒絕。同步→保存／發布→合併。 |
| 必修 1 | 四長條共同基線、同一 mL 軸；EDV／ESV／SV 按 120/50/70、140/50/90、120/35/85、120/65/55 的比例。 |
| 必修 3 | 六份預測替換指定四選項與 answer，呈現時再洗牌；題幹／答對回饋保留。 |
| 必修 4 | 拔河繩結移向勝方，35/25 與 18/25 箭頭粗細按力大小；淨向外 10、向內 7。 |
| 建議 5 | 樹上標「與心輸出量／組織液量同向（＋）／反向（−）」並移除多餘箭頭。 |
| 建議 6 | 水管捏死／半捏／放開與無流／少量流／通暢箭頭。 |
| 建議 7 | 竇房結兩週期節律電位到閾值、較緩上升／再極化；工作心肌與心電圖同一時間軸、兩週期。 |
| 建議 8 | 接力圖加入四支接力棒。 |

新主動脈點選、總覽、重播與既有視覺互動不送 CourseLearning，不新增節點或完成度分母。全身血管三處共用同一 SVG 底圖；圖形以程式自行設計曲線與器官輪廓，沒有描圖或嵌入課本影像。

## 解剖規格第 2 節自我勾核

- [x] 升主動脈從心底向上，寬弓朝人體左後方。
- [x] 弓三分支依序頭臂／左頸總／左鎖骨下；頭臂分右頸總與右鎖骨下。
- [x] 胸主動脈位於中線偏人體左側，橫膈以下為腹主動脈。
- [x] 腹段約 L4 分左右髂總→髂外→股→膕→脛前／脛後；膕段虛線代表膝後。
- [x] 腹腔幹在橫膈下方，短支接胃動脈。
- [x] 上肢鎖骨下→腋→肱→橈／尺；分叉在肘部，兩側依解剖姿勢鏡像。
- [x] 上腔靜脈在升主動脈人體右側，終止右心房；左右頭臂靜脈，左側較長。
- [x] 下腔靜脈在腹主動脈人體右側，經肝後向右心房；肝靜脈短支匯入下腔靜脈。
- [x] 胃腸匯流至肝門靜脈，往人體右側進入肝下緣。
- [x] 下肢股靜脈→髂外→髂總→下腔靜脈，股靜脈在動脈內側。

## 第 5.1 節自我勾核

- [x] 根部到 L4 全段、紅漸層管狀、短粗升段、寬弓／後段重疊、胸段下行、腹段略細。
- [x] 升段：根部→頭臂起點；弓：頭臂起點→左鎖骨下之後；胸段：其後→橫膈；腹段：橫膈→約 L4。
- [x] 三條上緣短分支、三處點虛線、淡粉穹頂橫膈與 L4 標示、冠狀開口／心臟血液供應互參、三個血流箭頭。
- [x] 預設全顯示；四段點選其他段 .3，定義正確，再按還原；Enter 可操作、aria-pressed 正確，事件數不增加。
- [x] 節點 2 弓範圍兩虛線、右側頭臂再分叉／淡底框、圖左＝人體右；只有中文標籤。

## 保留與測試結果

可重跑 `node scripts/heart2-review-verify.mjs`；原始結果 [HEART2_REVIEW_VERIFY.json](HEART2_REVIEW_VERIFY.json)。

- 比對基底 e86761f：六份 content.json 的 nodes／foundation／cases 全部深度相等；正式 foundation／cases JSON 區段逐位元相同（SHA-256 附 JSON）。其他教材 content、未修改教材及所有受版控 Excel 逐位元相同。
- 六份僅預測 options／answer 改動；major-vessels 另有教師明確授權的左腳／胃兩段顯示文字，以及一條主動脈弓誤解句。除這些例外外，整份 content.json 深度相等。預測題 ID／題幹／回饋未改。
- 手工 cardiac-electrical-v1 除 HEART2_VISUALS 視覺常數外，HTML 所有位元一致：9 節點 ID、11 題、作答與 SDK 追蹤保持原狀；心電圖基礎教材逐位元不變。
- 六份各在 390／1280 完整探索、6 先備＋5 情境作答、預測答對說明、僅最後正確作答送 complete 通過；無 pageerror／橫向溢位。可見 SVG 文字 ≥14px 且無裁切，四狀態標籤引線無交叉。
- npm run check 全過：119 前端／19 Functions、兩端 build、version:check（1.6.4）。M1 另以 callable 測試 draft 空／published 非空之阻擋、無寫入／防偽提交；React 測試先阻擋、發布後重新預覽可確認。舊進度不刪、completed 不降級、同 ID 去重及 v3 完成度測試仍通過。
- public/materials 與 materials-src 全樹台灣用語清單／草稿註記掃描 0；字體樣式加各圖作用範圍，避免 inline SVG 的 text 字級污染其他圖。標準 materials:shots 排除初始隱藏放大圖的零寬度文字，仍檢查實際顯示文字。

## 指定截圖（390／1280）

共 58 張指定截圖，原圖位於 [heart2-review-screenshots](heart2-review-screenshots)，以下每項提供兩種寬度；標準 materials:shots 22 張通過，另有 materials-src/major-vessels/shots 的標準截圖（本機忽略）。

- major-vessels／right-hand：[390](heart2-review-screenshots/390-major-vessels-right-hand.png)、[1280](heart2-review-screenshots/1280-major-vessels-right-hand.png)
- major-vessels／left-hand：[390](heart2-review-screenshots/390-major-vessels-left-hand.png)、[1280](heart2-review-screenshots/1280-major-vessels-left-hand.png)
- major-vessels／left-foot：[390](heart2-review-screenshots/390-major-vessels-left-foot.png)、[1280](heart2-review-screenshots/1280-major-vessels-left-foot.png)
- major-vessels／stomach：[390](heart2-review-screenshots/390-major-vessels-stomach.png)、[1280](heart2-review-screenshots/1280-major-vessels-stomach.png)
- major-vessels／portal：[390](heart2-review-screenshots/390-major-vessels-portal.png)、[1280](heart2-review-screenshots/1280-major-vessels-portal.png)
- major-vessels／pulse：[390](heart2-review-screenshots/390-major-vessels-pulse.png)、[1280](heart2-review-screenshots/1280-major-vessels-pulse.png)
- major-vessels／overview：[390](heart2-review-screenshots/390-major-vessels-overview.png)、[1280](heart2-review-screenshots/1280-major-vessels-overview.png)
- major-vessels／aorta-default：[390](heart2-review-screenshots/390-major-vessels-aorta-default.png)、[1280](heart2-review-screenshots/1280-major-vessels-aorta-default.png)
- major-vessels／aorta-ascending：[390](heart2-review-screenshots/390-major-vessels-aorta-ascending.png)、[1280](heart2-review-screenshots/1280-major-vessels-aorta-ascending.png)
- major-vessels／aorta-arch：[390](heart2-review-screenshots/390-major-vessels-aorta-arch.png)、[1280](heart2-review-screenshots/1280-major-vessels-aorta-arch.png)
- major-vessels／aorta-thoracic：[390](heart2-review-screenshots/390-major-vessels-aorta-thoracic.png)、[1280](heart2-review-screenshots/1280-major-vessels-aorta-thoracic.png)
- major-vessels／aorta-abdominal：[390](heart2-review-screenshots/390-major-vessels-aorta-abdominal.png)、[1280](heart2-review-screenshots/1280-major-vessels-aorta-abdominal.png)
- major-vessels／arch-closeup：[390](heart2-review-screenshots/390-major-vessels-arch-closeup.png)、[1280](heart2-review-screenshots/1280-major-vessels-arch-closeup.png)
- major-vessels／prediction：[390](heart2-review-screenshots/390-major-vessels-prediction.png)、[1280](heart2-review-screenshots/1280-major-vessels-prediction.png)
- cardiac-output／bar-base：[390](heart2-review-screenshots/390-cardiac-output-bar-base.png)、[1280](heart2-review-screenshots/1280-cardiac-output-bar-base.png)
- cardiac-output／bar-preload：[390](heart2-review-screenshots/390-cardiac-output-bar-preload.png)、[1280](heart2-review-screenshots/1280-cardiac-output-bar-preload.png)
- cardiac-output／bar-contractility：[390](heart2-review-screenshots/390-cardiac-output-bar-contractility.png)、[1280](heart2-review-screenshots/1280-cardiac-output-bar-contractility.png)
- cardiac-output／bar-afterload：[390](heart2-review-screenshots/390-cardiac-output-bar-afterload.png)、[1280](heart2-review-screenshots/1280-cardiac-output-bar-afterload.png)
- cardiac-output／factor-tree：[390](heart2-review-screenshots/390-cardiac-output-factor-tree.png)、[1280](heart2-review-screenshots/1280-cardiac-output-factor-tree.png)
- cardiac-output／prediction：[390](heart2-review-screenshots/390-cardiac-output-prediction.png)、[1280](heart2-review-screenshots/1280-cardiac-output-prediction.png)
- capillary-exchange／tug-both：[390](heart2-review-screenshots/390-capillary-exchange-tug-both.png)、[1280](heart2-review-screenshots/1280-capillary-exchange-tug-both.png)
- capillary-exchange／factor-tree：[390](heart2-review-screenshots/390-capillary-exchange-factor-tree.png)、[1280](heart2-review-screenshots/1280-capillary-exchange-factor-tree.png)
- capillary-exchange／prediction：[390](heart2-review-screenshots/390-capillary-exchange-prediction.png)、[1280](heart2-review-screenshots/1280-capillary-exchange-prediction.png)
- blood-pressure-measurement／hose：[390](heart2-review-screenshots/390-blood-pressure-measurement-hose.png)、[1280](heart2-review-screenshots/1280-blood-pressure-measurement-hose.png)
- blood-pressure-measurement／prediction：[390](heart2-review-screenshots/390-blood-pressure-measurement-prediction.png)、[1280](heart2-review-screenshots/1280-blood-pressure-measurement-prediction.png)
- blood-types／prediction：[390](heart2-review-screenshots/390-blood-types-prediction.png)、[1280](heart2-review-screenshots/1280-blood-types-prediction.png)
- lymphoid-organs／prediction：[390](heart2-review-screenshots/390-lymphoid-organs-prediction.png)、[1280](heart2-review-screenshots/1280-lymphoid-organs-prediction.png)
- cardiac-electrical／relay：[390](heart2-review-screenshots/390-cardiac-electrical-relay.png)、[1280](heart2-review-screenshots/1280-cardiac-electrical-relay.png)
- cardiac-electrical／aligned：[390](heart2-review-screenshots/390-cardiac-electrical-aligned.png)、[1280](heart2-review-screenshots/1280-cardiac-electrical-aligned.png)
