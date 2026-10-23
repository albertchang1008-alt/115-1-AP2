# 呼吸標籤層 V2：階段一與階段二報告

更新：2026-10-15。分支 `feature/respiratory-infographics`，HEAD `e8805f8`，本次未提交。

**第三次修正完成：R3-1 血紅素底圖、R3-2 力學圖片寬度已修，停下待 Claude 複查。** 教師已定案 A 紅色粗體；`FOCUS_STYLE='red'` 維持紅色粗體，最新產生器入口為 `scripts/respiratory-labels-r2.py`。依 gas-exchange → respiratory-control → breathing-mechanics → o2-co2-transport → lung-function 順序，每份完成標籤層、資料層、preview／shots／verify 後更新本報告。未 build、Excel、登錄、commit／push／部署。

[**逐份驗收入口：390／1280、90 張圖面截圖**](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/stage2-index.html)。各份 labels.json 及逐圖標籤／紅字／最小字級／截圖清單見下方「階段二」各節。

## 第三次修正（2026-10-15，R3-1／R3-2）

依 [Claude「第三次驗收」](RESPIRATORY_LABELS_V2_STAGE2_CLAUDE_REVIEW.md) 只重做三個受影響圖位，**停下待 Claude 複查 R3-1、R3-2，尚未核可**。先前「90狀態全過」未涵蓋底圖實際繪出，不能用來證明底圖存在；本輪已補上此缺口。

| 項目 | 修正與結果 | 截圖 |
|---|---|---|
| R3-1：血紅素底圖 | o2-co2-transport node-02 的兩版原先都引用不存在的plate-01；頁面只有plate-02定義。現在每個版面都內嵌自己的WebP `<image>`，不借用另一層的 `<use>`／defs。桌機及手機底圖區域非白像素分別60.79%／60.69%，解碼及尺寸檢查通過；移除另一版面後，兩版仍各自正常顯示。 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-02.png)／[390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-02.png) |
| R3-2：四格呼吸肌 | 只放寬node-01桌機圖位容器及圖片，保留側欄中文直標、原裁切與原像素錨點；1280px下四格圖片均650.94 CSS px。手機版幾何、labels記錄與截圖保持原值。 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-01.png)／[390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-01.png) |
| R3-2：三格壓力變化 | node-03同樣放寬桌機圖位：1280px下三格實際圖片寬609.65／650.94／650.94 CSS px，皆≥600；第一格因原圖補白略窄。手機版及所有原像素錨點保留。 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-03.png)／[390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-03.png) |

### 新增「底圖確實畫出」檢查

- `scripts/respiratory-raster-verify.mjs`由既有verify呼叫，每個有底圖的狀態都必須找齊manifest指定的可見底圖視窗，從**Chrome實際頁面截圖**裁出該視窗，縮成256×256取樣；RGB任一通道<245算非白，比例必須**>20%**。另要求圖片資源存在、decode成功、SVG尺寸等於原圖記錄、解碼後寬高比相符，且資源不在被display:none隱藏的版面中。
- 裁切範圍用nested SVG的x／y／width／height與父層screen CTM計算，不用可能包含「裁切外完整圖片」的getBoundingClientRect。資料圖沒有點陣底圖時會記錄空清單；缺失的預期底圖不會被略過。
- **修正前版本確實會被新檢查判為失敗**：保留舊preview獨立執行，1280與390的node-02各失敗一次，非白比例僅0.67%／0.59%，且圖片資源不存在。[舊版失敗證據](respiratory-screenshots/v2/r3-old-version-rejection.json)。修正前的失敗不是推測，也沒有用新圖替換負例後才測。
- [6項檢查正反例及獨立顯示](respiratory-screenshots/v2/r3-raster-fixtures.json)：有效底圖通過；可解碼的白圖、失效use與隱藏層資源均被攔下；血紅素desktop／mobile分別移除另一層後，仍單獨通過。測試入口 `node scripts/respiratory-raster-verify-fixtures.mjs`。

### 本輪驗證與修改範圍

- **五份45狀態×兩尺寸＝90狀態全部重跑並通過**，共72個實際底圖視窗通過取樣／解碼／尺寸／可見資源檢查，最低非白比例47.81%。既有標籤幾何、拆詞／單字行／數值單位、撞號、箭頭間距、比例／FEV₁及氧曲線slider／pointer也全部通過。
- verify加上1280px指定力學圖位的圖片寬度≥600 CSS px檢查；七格實測值如上。兩份preview成功；節點稽核21份學生教材／15份kit sources、materials測試20／20，0 skipped。依第三次驗收範圍，本輪沒有重跑R2已通過的10頁完整作答回歸，原證據保留。
- 產物只改node-02血紅素、node-01／03力學的SVG與相應manifest記錄，以及兩份preview。42個其他狀態的SVG、labels記錄、84張圖面截圖保持原值；三個修正圖位拍兩尺寸，力學手機兩張與開工SHA相同。五份verification.json更新為本輪結果；未覆寫其他截圖或既有回歸證據。
- [本輪範圍與錨點SHA證據](respiratory-screenshots/v2/r3-scope-integrity.json)：1028個開工檔，1011個不變、17個限定圖層／manifest／preview／圖面與驗證證據／圖庫異動，無非預期或遺失。所有原像素錨點均不變；兩個力學圖位的手機layout記錄也完全一致。content.json、incoming PNG、WebP、oxygen-curve.js、其他教材、共用CSS／教材互動JS、登錄保持開工值。
- 本輪限定重建：`.venv-illustrator/bin/python scripts/respiratory-labels-r2.py <slug> --r3`（只接受o2-co2-transport node-02與breathing-mechanics node-01／03），接 `npm run materials:preview <slug>`。全五份驗證：`node scripts/respiratory-labels-verify.mjs <slug> --repair --r3`，檢查全部狀態、只覆寫這三圖位截圖；`--html-file <path> --audit-only`可驗舊preview。完整雙版面入口仍為r2.py，已納入這兩項修正。
- 分支 `feature/respiratory-infographics`／HEAD `e8805f8`，未提交。未改content.json，未build、Excel、登錄、commit／push／部署。到此停下交Claude針對R3-1／R3-2複查，通過後再交教師看畫面。[Codex]

逐份本輪驗證：[gas-exchange](respiratory-screenshots/v2/gas-exchange/verification.json)；[respiratory-control](respiratory-screenshots/v2/respiratory-control/verification.json)；[breathing-mechanics](respiratory-screenshots/v2/breathing-mechanics/verification.json)；[o2-co2-transport](respiratory-screenshots/v2/o2-co2-transport/verification.json)；[lung-function](respiratory-screenshots/v2/lung-function/verification.json)。

## 階段二再修（2026-10-15，教師方案甲／R2-1～R2-4）

依 [Claude「再驗」](RESPIRATORY_LABELS_V2_STAGE2_CLAUDE_REVIEW.md) 與 [標籤呈現方式](FIGURE_STYLE_GUIDE.md) 完成再修，**尚待 Claude 獨立再驗，停在本機 preview**。本節為最新交接；下方「階段二複修」及初交件段落中的舊產生器入口、截圖數與回歸狀態均屬歷史。

### 教師裁定：五份雙版面

桌機 ≥768px 使用中文直標與引線，名稱放在底圖外側欄；手機 <768px 使用大圖、錨點旁圓圈與圖下對照表。共24個有解剖標籤的圖面狀態改為雙版面，資料圖／曲線原有的直接命名保留。桌機不顯示標籤編號或對照表；手機重點名稱仍為紅色粗體。兩版均套完整醫學詞、數值與單位不得拆行規則。

| 教材／代表圖位 | 桌機中文直標 | 手機編號對照 |
|---|---|---|
| gas-exchange／node-03 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-node-03.png) | [390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-03.png) |
| respiratory-control／overview-state-2 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-overview-state-2.png) | [390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-2.png) |
| breathing-mechanics／node-01 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-01.png) | [390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-01.png) |
| o2-co2-transport／node-02 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-02.png) | [390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-02.png) |
| lung-function／node-03 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-node-03.png) | [390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-03.png) |

### 再驗項目修正

| 項目 | 本輪修正 | 截圖／證據 |
|---|---|---|
| R2-1 | 同圖有步驟編號時，手機標籤使用A、B、C…；氯轉移為A～G，步驟維持①②③。多格圖的標籤在整張圖內接續編號。verify只計圖上的步驟／標籤標記，對照表同號屬配對而非重複。新增 `duplicateNumbers`，重複編號失敗、步驟數字＋標籤字母通過。 | [390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-06.png)／[1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-06.png)；[7個正反例](respiratory-screenshots/v2/repair-verifier-fixtures.json) |
| R2-2 | 總覽三狀態放大框「中樞化學受器」從原像素(601,253)改至(566,250)：延髓表面、靠藍色腦脊髓液的一側，避開黃色神經；H⁺虛線箭頭終點同步移至此點。其他錨點逐項對比均保留。 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-overview-state-1.png)／[390px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-1.png) |
| R2-3 | 刪除浮空短T線，迷走傳入沿原神經路徑、直接以T端止於延髓(564,258)，「抑制吸氣」標在旁邊。非當前路線文字與線同為opacity=0.3；state-2「換氣增加」亦淡化。 | [1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-overview-state-1.png)；[1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-overview-state-2.png)；[1280px](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-overview-state-3.png) |
| R2-4 | 最終圖面完成後重跑五份×390／1280，共10頁完整作答回歸：總覽切換、六節點探索、6先備＋5情境、答錯回讀後重試、最後一題才發complete且只一次；無console／pageerror／水平溢位。 | [10頁逐項結果](respiratory-screenshots/v2/regression/interaction-verification.json)；[390回讀畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/regression/gas-exchange-390-review.png)／[1280回讀畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/regression/gas-exchange-1280-review.png) |

### 本輪驗證與範圍

- 五份preview成功。390／1280各45狀態，共90狀態verify全過；再以767／768各45狀態測切換邊界，全90狀態通過：[邊界驗證](respiratory-screenshots/v2/r2-breakpoint-verification.json)。`duplicateNumbers`、`wordBreaks`、`singleCharacterLines`、`arrowTextHits`、文字／引線／錨點互疊與越界皆為0，桌機編號／對照表隱藏、手機中文直標隱藏也有檢查。最小字級：390為12.89 CSS px，1280為19.67 CSS px。
- 新版verify用實際畫面座標量測文字、引線與錨點，處理兩版不同的SVG座標轉換；數據條、肺容積與FEV₁仍按各自原生座標驗比例與數值。氧曲線slider／pointer／探針契約仍過。
- 節點稽核21份學生教材／15份kit sources通過；materials測試20／20、0 skipped。Chrome測試使用既有依賴及允許啟動瀏覽器的執行環境；未安裝套件、未修改package／lock。
- 重拍24個受影響狀態×兩尺寸＝48張圖面；其餘21狀態的SVG、labels記錄與42張圖面截圖保持開工值。另更新3張氧曲線桌機完整互動截圖與10頁作答回歸截圖；原materials-src各份shots全頁截圖未覆寫。
- [本輪SHA與錨點證據](respiratory-screenshots/v2/r2-scope-integrity.json)：1026個開工檔，811個不變、215個限定圖層／manifest／preview／驗證截圖／圖庫異動，無非預期或遺失。只有3個總覽狀態×2版的中樞化學受器錨點改動；其他原像素錨點不變。content.json、incoming PNG、WebP、oxygen-curve.js、其他教材、共用CSS／教材互動JS及登錄檔保持原值。
- 最新入口：`.venv-illustrator/bin/python scripts/respiratory-labels-r2.py <slug>` → `npm run materials:preview <slug>` → `node scripts/respiratory-labels-verify.mjs <slug> --repair --r2 --check-fixtures`。重建時使用r2入口，避免舊版產生器覆蓋雙版面。邊界稽核加 `--breakpoints --audit-only`；完整作答使用 `node scripts/respiratory-kit-stage2-verify.mjs`。
- 分支 `feature/respiratory-infographics`／HEAD `e8805f8`，未提交。未改content.json，未build、Excel、登錄、commit／push／部署。交Claude再驗並待教師看畫面；本輪到此停下。[Codex]

逐份圖面驗證：[gas-exchange](respiratory-screenshots/v2/gas-exchange/verification.json)；[respiratory-control](respiratory-screenshots/v2/respiratory-control/verification.json)；[breathing-mechanics](respiratory-screenshots/v2/breathing-mechanics/verification.json)；[o2-co2-transport](respiratory-screenshots/v2/o2-co2-transport/verification.json)；[lung-function](respiratory-screenshots/v2/lung-function/verification.json)。

## 階段二複修（2026-10-15，S2-1～S2-14）

Claude 初驗未通過，依 [階段二審查](RESPIRATORY_LABELS_V2_STAGE2_CLAUDE_REVIEW.md) 完成本輪複修，**停下待 Claude 再驗，尚未核可**。以下取代初交件摘要中對這些問題的完成判斷；既有完整頁面截圖與互動回歸是初交件歷史證據。

只重產受影響的40個圖面狀態、80張390／1280圖面截圖，另增3張氧曲線桌機互動截圖。未受影響的 control node-03、mechanics node-05、oxygen node-02／03／04，其SVG、labels.json記錄與10張截圖均保留原值。總覽合成SVG與五份preview同步更新；原100張全頁截圖未覆寫。

| 審查項 | 本輪修正 | 截圖 |
|---|---|---|
| S2-1 | 肺動脈錨點改指左側藍色上支；左側由上往下的血流轉向箭頭旁直接標紅字，刪除獨立卡。 | [gas-exchange node-06／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-06.png)；[gas-exchange node-06／1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-node-06.png) |
| S2-2 | 三條呼吸調控路線同時保留，非當前路線 opacity=0.3；迷走傳入沿神經入延髓，T 端旁標抑制吸氣。腦幹放大框約原主圖的2.9倍，四個標籤、BBB／CO₂與化學訊號箭頭集中框內，換氣增加標在肺端。 | [respiratory-control overview-state-1／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-1.png)；[respiratory-control overview-state-2／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-2.png)；[respiratory-control overview-state-3／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-3.png) |
| S2-3 | 氣體擴散雙欄因果；運動與高地分欄、體溫獨立；酸鹼公式下用PCO₂正常區間軸與左右方向，酸中毒接腎代償；順應性曲線尾端命名、同ΔP交點；肺容積右側區間括號；FEV₁曲線平滑、單調、斜率遞減並穿過一秒數值，尾端命名。 | [gas-exchange node-04／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-04.png)；[respiratory-control node-05／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-05.png)；[respiratory-control node-06／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-06.png)；[breathing-mechanics node-04／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-04.png)；[lung-function node-01／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-01.png)；[lung-function node-06／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-06.png) |
| S2-4 | 醫學詞和數值＋單位保持完整；圖內長標籤改編號對照、標籤整行，圖說用原文HTML避頭點。新增實際渲染行的拆詞與孤立單字檢查。 | [gas-exchange node-03／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-03.png)；[respiratory-control node-01／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-01.png)；[lung-function node-03／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-03.png) |
| S2-5 | O₂運輸兩形式用橙色深淺、CO₂三形式用藍色深淺；其他資料用中性／綠／洋紅，總通氣量統一深灰；容量圖例按完整縮寫匹配。 | [o2-co2-transport node-01／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-01.png)；[o2-co2-transport node-05／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-05.png)；[lung-function node-04／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-04.png)；[lung-function node-06／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-06.png) |
| S2-6 | O₂／CO₂符號移到箭頭側邊，保留白色描邊；新增文字至箭身和實際marker箭頭頭部至少4 CSS px檢查。 | [gas-exchange overview-state-1／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-overview-state-1.png)；[gas-exchange node-02／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-02.png)；[respiratory-control node-02／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-02.png) |
| S2-7 | 移除空白O₂／CO₂卡；數量單位放進對應標題，避免無內容卡佔位。 | [gas-exchange overview-state-1／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-overview-state-1.png)；[gas-exchange node-05／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-05.png) |
| S2-8 | 四格呼吸肌依原圖分界裁切後各用全寬，上下排列並附完整名稱對照。 | [breathing-mechanics node-01／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-01.png) |
| S2-9 | 三張呼吸力學底圖的外肋間肌錨點改到兩肋骨切面間紅色肌肉，避開外側皮膚與脂肪。 | [breathing-mechanics overview-state-2／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-overview-state-2.png)；[breathing-mechanics node-03／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-03.png) |
| S2-10 | 右移與左移總覽的正常虛線於尾端加「正常」文字與引線，原曲線模型不變。 | [o2-co2-transport overview-state-2／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-overview-state-2.png)；[o2-co2-transport overview-state-3／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-overview-state-3.png) |
| S2-11 | 刪除重複的三個反應卡，保留氯轉移流程與content原句分段說明。 | [o2-co2-transport node-06／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-06.png) |
| S2-12 | 所有容量條共用IRV｜TV｜ERV｜RV固定位置與6000尺度；不包含的成分留白，保留顏色對照。 | [lung-function node-02／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-02.png)；[lung-function node-02／1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-node-02.png) |
| S2-13 | 手機使用完整大圖＋錨點旁編號，名稱對照移到圖下，保留原像素錨點供再驗。 | [gas-exchange node-03／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-03.png)；[respiratory-control overview-state-1／390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-1.png) |
| S2-14 | 追加桌機總覽三狀態完整互動畫面，包含曲線、探針、滑桿與讀數。 | [o2-co2-transport overview-state-1-interactive／1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-overview-state-1-interactive.png)；[o2-co2-transport overview-state-2-interactive／1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-overview-state-2-interactive.png)；[o2-co2-transport overview-state-3-interactive／1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-overview-state-3-interactive.png) |

### 複修驗證與再現

- 五份preview重產成功；verify全90個圖面狀態通過，errors=0。新增 `arrowTextHits`（箭身／箭頭頭部含4 CSS px間距）、`wordBreaks`（受保護醫學詞與數值單位）、`singleCharacterLines`，並輸出 `renderedLines` 供人工覆核。詞庫檢查範圍可在verify中檢視；解剖與語意仍須Claude獨立驗收。
- 五個正反例fixture通過：拆醫學詞／孤立單字、拆數值單位、只碰marker頭部均成功攔下；足夠間距與合法分行不誤報。[fixture結果](respiratory-screenshots/v2/repair-verifier-fixtures.json)。
- 比例、容量區段位置、FEV₁一秒與終點、單調性／凹性、O₂ slider／pointer均通過。教材節點21／15與materials測試20／20、0 skipped通過；本輪未重跑初交件10頁完整作答回歸。
- [範圍SHA證據](respiratory-screenshots/v2/stage2-repair-scope-integrity.json)：開工1021檔，138檔在限定圖層／manifest／preview／圖面證據與圖庫內變更，883檔不變，無遺失或非預期變更。content.json、incoming PNG、WebP、oxygen-curve.js、其他教材與既有全頁截圖不變。未改共用CSS／教材互動JS。
- 最新修正產生器入口為 `.venv-illustrator/bin/python scripts/respiratory-labels-repair.py <slug>`，依賴既有stage2模組與labels.json；接 `npm run materials:preview <slug>`、`node scripts/respiratory-labels-verify.mjs <slug> --repair`。`--repair`只覆寫本輪受影響截圖；`--audit-only --check-fixtures`可另驗fixture。不要用舊產生器覆蓋本輪複修。
- 報告逐項連結使用手機圖；[驗收圖庫](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/stage2-index.html)可切桌機看全部90張，另附3張完整氧曲線桌機互動截圖。
- 分支 `feature/respiratory-infographics`／HEAD `e8805f8`，既有未提交工作保留；未build、Excel、登錄、commit／push／部署。下一步由Claude逐項再驗，教師裁定；本輪到此停下。[Codex]

逐份本輪驗證：[gas-exchange](respiratory-screenshots/v2/gas-exchange/verification.json)；[respiratory-control](respiratory-screenshots/v2/respiratory-control/verification.json)；[breathing-mechanics](respiratory-screenshots/v2/breathing-mechanics/verification.json)；[o2-co2-transport](respiratory-screenshots/v2/o2-co2-transport/verification.json)；[lung-function](respiratory-screenshots/v2/lung-function/verification.json)。

## 階段二交件摘要（2026-10-15）

- 五份各三狀態＋六節點，兩尺寸共 **90 圖面狀態**；`materials:shots` 共 **100 全頁截圖**。文字裁切／互疊、引線交叉／壓文字／壓錨點、紅字、圖片等比例、水平溢位、console／pageerror、HTML 避頭點全部通過。手機全系列最小 12.89 px；一般 SVG 桌機 29.51 px，480 寬氧曲線 33.25／14.53 px。
- **20 資料層圖位完成**：gas 2、control 2、mechanics 1、o2 7、lung 8（包含總覽狀態）。原生 SVG／HTML：V/Q 共軸 0.24／0.07／0.82／1.29 L/分；比例 97／3、70／23／7；零通氣條寬為 0；肺容積分界 0／1200／2400／2900／6000，容量共用 6000 尺度；FEV₁ 一秒點 4／1／2.5 L、終點 5／2.8／2.8 L。verify 實際量測條長、區間高度、曲線座標，不以標示值代替圖形檢查。
- **氧曲線 JS 原檔 SHA 不變**：480 寬、x＝60＋3.6·PO₂、y＝350－2.7·S、k26／31／21；保留滑桿、pointer、探針與正常虛線。兩尺寸三狀態均測 PO₂ 0／40／100 與 pointer PO₂ 70；總覽／node-03／04 路徑由原模型產生，沒有換成點陣或移除互動。
- 圖說只讀 content 的 explain／concept 原句，以原生 HTML `line-break:strict` 套避頭點；氯轉移①②③僅按原句分號分段，移除編號後逐字重組為原 concept。caption 原文一致性另經範圍腳本核對。
- WebP 寬 1200、quality 68；incoming 原 PNG 不改。breathing-mechanics 原本重複嵌入約 2.57 MB，改共用 `<defs><image>`／`<use>`，preview 約 0.92 MB，並驗證全部引用可解析、等比例、截圖可見。**其 SVG 的點陣定義集中於總覽，節點 SVG 應在 preview 中核對**；labels.json 保留各裁切與原像素座標。其餘各份均低於 1.5 MB（control 約 1.29 MB，超過 1.2 MB 目標但未達交辦 1.5 MB 壓縮門檻）。
- 01／02／03 力學底圖補白至 1198×1402 原像素畫布，不伸縮、不借用錨點；橫膈指上緣圓頂、肋間肌避開骨切面。四格呼吸肌使用實際分界裁切，肋間肌只標位置，外／內層由原文及名稱卡說明。05 三欄原圖切為上下三格。
- gas-05 各列高／低分壓獨立；95 為無引線說明卡；低氧收縮上格標局部低氧。control 化學受器錨點指頸分叉與主動脈弓的顆粒，不指竇；肺牽張指主圖細支氣管神經末梢。總覽三路線保留且依狀態高亮／淡化，抑制用 T 端。運動的潮氣量／頻率為並列結果，不畫成彼此因果。
- 21 份學生教材／15 kit sources 節點稽核通過；`node --import tsx --test tests/material*.test.ts` **20／20、0 skipped**。五份×兩尺寸 **10 頁完整互動回歸**（六節點探索、11 題、答錯強制回讀、最後答對只送一次 complete）通過：[互動證據](respiratory-screenshots/v2/regression/interaction-verification.json)。
- [SHA 範圍證據](respiratory-screenshots/v2/stage2-scope-integrity.json)：344 個受保護檔案保持開工 SHA，包含五份 content、氧曲線 JS、定稿 PNG、其他教材、Excel、`shared/materials.ts`；41 個開工既有檔案的變更全部在授權 SVG／五份 preview／限定 CSS 範圍。用詞掃描無指定大陸用語或學生草稿註記。既有未提交工作保留。
- 本機原 node_modules 為空；驗證使用已存在的 Node 22.23.2、Bundled Playwright 及暫存乾淨 checkout 的套件符號連結，沒有 install、修改 package／lock 或執行 build。Chrome 測試以 sandbox escalation 執行；所有測試成功，未略過。

**Claude 下一步**：逐份核對 labels.json 原像素錨點、解剖、箭頭方向／淡化，以及資料層比例；教師從驗收入口查看畫面。尚無階段二 Claude／教師核可，不進正式 build／Excel／登錄／commit／部署。[Codex]

## 階段一歷史驗收記錄

以下保留肺與胸膜階段一與複修紀錄；當時「未開始階段二／待選 A／B」為歷史狀態，目前以上方摘要為準。

## 實作

- 底圖僅使用 incoming 的 IMG-lungs-pleura-01～08 定稿 PNG，不使用退件圖，沒有繪製或修改解剖底圖。01／02／03＝總覽 state-1／2／3；04～08＝node-01～05；02 同時用於 node-06。
- WebP 寬 1200、quality 70，保存原比例。quality 82 時 HTML 約 1.72 MB，降品質後約 1.21 MB，低於交辦的 1.5 MB 上限。
- node-04 只顯示既有 PNG 的細胞放大框，crop `(0,530,1145,844)`；其餘使用完整底圖。
- 中文為原生 SVG text、白色描邊；引線末端圓點。標籤限定規格白名單，長名稱分行，完整名稱保留於 aria-label／data-label。左右肺的上／下葉分別標示。
- 三狀態各用定稿底圖與錨點紀錄，依 `.state-figure[data-state]` 顯示；張力箭頭向內，state-2 使用較細箭頭表示 T 降低，仍保留張力。半徑線沒有新增數值；圖下說明直接取現有 content；不再顯示重複的①②說明。
- **重點樣式只改一處**：`scripts/respiratory-labels.py` 的 `FOCUS_STYLE='red'`。改為 `'block'` 後重跑產生器與 preview，即切成黑字＋淡橙色塊＋粗體；不用逐張改 CSS 或標籤。本次保留紅色粗體。
- 新 CSS 只限定 `.kit[data-slug="lungs-pleura"]`，放寬圖高、最大寬 760。
- [labels.json](../materials-src/figures/raster/lungs-pleura/labels.json) 保存每圖標籤、原始 PNG 像素錨點、SVG 文字位置／分行、原圖尺寸、crop／scale、紅字、狀態、箭頭與半徑線，供 Claude 逐點核對；公式為 caption，anchor=null，不拉引線。

## 驗證

- 三份 preview（airway-structure、gas-exchange、lungs-pleura）成功，只產 preview。
- 三份 materials:shots 各 20 張全頁截圖，均 0 錯誤。
- airway verify：18 狀態通過，最小字級 1280＝30.40px／390＝13.28px。
- respiratory-labels verify：肺與胸膜 18 狀態通過，最小字級 1280＝29.51px／390＝12.89px。檢查可見文字裁切／互疊、文字壓錨點、引線壓文字、折線各段交叉、紅字清單、圖像 CTM 等比例、水平溢位與 console／pageerror。完整結果：[verification.json](respiratory-screenshots/v2/lungs-pleura/verification.json)。
- `scripts/respiratory-labels-verify.mjs <slug>` 支援其他五份接上相同 labels.json 契約；本輪僅實作肺與胸膜。
- 節點稽核：21 份學生教材、15 份 kit sources 全過。materials 測試：20／20 通過，0 skipped。
- 三份 content 與兩支產生器用詞掃描未找到指定大陸用詞或學生草稿註記。
- 人工查看兩尺寸圖面後修正肺尖／肺裂／心切跡／肺底、肺根／神經位置。解剖與錨點的獨立驗收仍交 Claude，不以 geometry 檢查取代。
- 截圖 deviceScaleFactor=2，字級量測為 CSS px。

## 範圍核對

- 初次階段一與本輪複修均保存開工 SHA。初次兩份 content 的修改範圍見原 scope 證據；本輪只新增 gas-exchange summary 的 R-7 修正，其餘 content 不變。題幹／feedback／答案／ID 保留。
- 其他呼吸教材來源／圖／preview、8 張肺與胸膜 incoming PNG、Excel、`shared/materials.ts` 均保持開工 SHA。證據：[scope-integrity.json](respiratory-screenshots/v2/lungs-pleura/scope-integrity.json)。
- 同期外部變更另列：作圖助手日誌、`_review.json`、泌尿底圖／退件圖共 9 個開工已有檔案發生變動。本任務未寫入，保留現況；未宣稱整個工作區所有範圍外檔案均未變動。`externalConcurrentChanges` 保留前後雜湊。
- 未 materials:build、未寫 Excel、未登錄、未登入、未 commit／push／部署；沒有開始階段二。

呼吸道修正詳 [AIRWAY_FIGURES_V2_REPORT.md](AIRWAY_FIGURES_V2_REPORT.md)「10/13 修正」節；氣體交換全頁截圖在 `materials-src/gas-exchange/shots/`。

下一步：Claude 複看 A-01～A-06、gas-exchange node-03 用詞與肺／胸膜逐點錨點，再交教師看 preview 並選重點樣式；收到後續交辦才開始階段二。[Codex]

## 每圖標籤與重點

| 圖位 | 標籤清單（重複名稱合併） | 紅色粗體 | 1280 CSS px | 390 CSS px |
|---|---|---|---:|---:|
| overview-state-1 | 大肺泡、小肺泡、表面張力、P＝2T/r | 表面張力、P＝2T/r | 29.51 | 12.89 |
| overview-state-2 | 大肺泡、小肺泡、表面張力、表面張力素、P＝2T/r | 表面張力素 | 29.51 | 12.89 |
| overview-state-3 | 大肺泡、小肺泡、表面張力、表面張力素、P＝2T/r | 表面張力、表面張力素 | 29.51 | 12.89 |
| node-01 | 肺尖、右肺、上葉、水平裂、中葉、斜裂、下葉、左肺、心切跡、肺底 | 右肺、左肺、水平裂、斜裂、心切跡 | 29.51 | 12.89 |
| node-02 | 肺門、肺根、肺血管、淋巴管、支氣管、神經 | 肺門、肺根 | 29.51 | 12.89 |
| node-03 | 胸腔壁、壁層胸膜、胸膜腔、臟層胸膜、肺、胸內壓低於大氣壓 | 壁層胸膜、胸膜腔、臟層胸膜 | 29.51 | 12.89 |
| node-04 | 第二型肺泡細胞（中隔細胞）、表面張力素、第一型肺泡細胞、肺泡巨噬細胞（灰塵細胞）、肺泡腔 | 第一型肺泡細胞、第二型肺泡細胞（中隔細胞）、肺泡巨噬細胞（灰塵細胞） | 29.51 | 12.89 |
| node-05 | 肺泡側、第一型肺泡細胞、肺泡細胞基底膜、間質、微血管基底膜、內皮細胞、血液側、厚度通常不超過0.5 μm | 第一型肺泡細胞、肺泡細胞基底膜、間質、微血管基底膜、內皮細胞 | 29.51 | 12.89 |
| node-06 | 大肺泡、小肺泡、表面張力素、T、r、P、P＝2T/r | 表面張力素、P＝2T/r | 29.51 | 12.89 |

## HTML 大小

| Preview | bytes | 上限 |
|---|---:|---:|
| airway-structure | 1,124,832 | 1.2 MB |
| gas-exchange | 66,596 | 1.2 MB |
| lungs-pleura | 1,214,268 | 1.5 MB |

## 截圖

| 圖位 | 1280 | 390 |
|---|---|---|
| overview-state-1 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-overview-state-1.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-overview-state-1.png) |
| overview-state-2 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-overview-state-2.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-overview-state-2.png) |
| overview-state-3 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-overview-state-3.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-overview-state-3.png) |
| node-01 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-node-01.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-node-01.png) |
| node-02 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-node-02.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-node-02.png) |
| node-03 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-node-03.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-node-03.png) |
| node-04 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-node-04.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-node-04.png) |
| node-05 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-node-05.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-node-05.png) |
| node-06 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/1280-node-06.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/390-node-06.png) |

## Claude 複修 R-1～R-8 與樣式 B（2026-10-14）

| 項目 | 最終修正 |
|---|---|
| R-1 | 總覽「表面張力」與 node-06「T」改到大肺泡內表面淡藍內襯 `(800,638)`。 |
| R-2 | state-1 隱藏表面張力素；state-2／node-06 指小肺泡連續內襯 `(648,1262)`，state-3 指斷續片段 `(681,1230)`。 |
| R-3 | P＝2T/r 改圖下 caption，anchor=null、無引線；小肺泡指壁 `(370,1110)`；P 指偏離中心的腔內 `(590,1190)`。 |
| R-4 | r 指半徑線正中 `(685,435)`，文字位置 `(380,620)`，避開張力箭頭。 |
| R-5 | 淋巴管改指放大框內綠色淋巴構造 `(831,465)`。 |
| R-6 | airway 細支氣管 SVG 錨點 `(652,600)→(618,798)`（原圖像素 `(338,798)`），指下葉細分支；引線直接連到錨點，移除沿肺緣折線。 |
| R-7 | gas-exchange node-03 summary 的「入肺靜脈血」改為「經肺動脈入肺的缺氧血」，其他欄位／文字不動。JSON 結構還原此一詞組後與開工版本完全一致。 |
| R-8 | 三狀態圖下說明讀取 `content.lab.states[i].explain`；node-06 讀取既有 concept，公式拆至獨立 caption，其餘原文僅換行。未更改 lungs-pleura content。 |

表中 lungs-pleura 錨點為定稿 PNG 原始像素；文字位置為 SVG 座標。labels.json 已同步可見標籤、caption、錨點與說明。

三份 preview／shots 重跑通過（各20全頁圖），兩支 verify 各18狀態全過。21份學生教材／15 kit sources 節點稽核、20／20材料測試通過，0 skipped。人工查看總覽、node-02／06、airway node-06 與 B 比較圖；解剖仍待 Claude 複驗。截圖測試使用暫存 preload，將 kit 的平滑捲動改為即時捲動以穩定擷取；未更改教材 JS 或兩支 verify 的原始碼。

**B 樣式已完成四張**：node-01／overview-state-1 的1280／390。B檢查確認黑字、粗體、淡橙色背景、字級門檻、無文字裁切／水平溢位／console錯誤；[B驗證](respiratory-screenshots/v2/lungs-pleura/style-B/verification.json)。

| 圖位 | B 1280 | B 390 |
|---|---|---|
| node-01 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/style-B/1280-node-01.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/style-B/390-node-01.png) |
| overview-state-1 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/style-B/1280-overview-state-1.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/style-B/390-overview-state-1.png) |

[**A／B 並排比較頁**](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lungs-pleura/style-B/index.html)。產完已恢復 `FOCUS_STYLE='red'`、重新產生 SVG／labels.json／preview；全部輸出 SHA 與製作 B 前的已驗紅字版完全一致，B只保留於比較截圖資料夾。

本輪範圍證據：[review-fixes-scope-integrity.json](respiratory-screenshots/v2/lungs-pleura/review-fixes-scope-integrity.json)。其他呼吸教材、Excel、登錄與定稿呼吸底圖保持開工SHA；同期作圖助手日誌／審圖及泌尿05底圖的3個外部變更另列，不覆蓋。未build、Excel、登錄、commit／push／部署，未開始階段二；待Claude複驗與教師選A／B。[Codex]


## 階段二 gas-exchange（2026-10-15）

已完成標籤層與資料層；preview 成功，shots 20 張／verify 18 個狀態通過，console／pageerror／水平溢位 0。HTML 1,169,178 bytes。

[labels.json](../materials-src/figures/raster/gas-exchange/labels.json)／[完整量測](respiratory-screenshots/v2/gas-exchange/verification.json)。圖下說明直接取 content 原句，HTML line-break:strict 避頭點。

| 圖位 | 標籤（完整名） | 紅色粗體 | 1280／390 CSS px | 截圖 |
|---|---|---|---|---|
| overview-state-1 | 膜薄、肺泡、呼吸膜、肺微血管、O₂、CO₂ | 膜薄 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-overview-state-1.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-overview-state-1.png) |
| overview-state-2 | 膜變厚、擴散減少、肺泡、呼吸膜、肺微血管、O₂、CO₂ | 膜變厚、擴散減少 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-overview-state-2.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-overview-state-2.png) |
| overview-state-3 | 交換面積減少、擴散減少、肺泡、呼吸膜、肺微血管、O₂、CO₂ | 交換面積減少、擴散減少 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-overview-state-3.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-overview-state-3.png) |
| node-01 | 外呼吸、肺泡、肺微血管、O₂、CO₂、內呼吸、組織細胞、組織微血管 | 外呼吸、內呼吸 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-node-01.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-01.png) |
| node-02 | 混合氣體、高分壓、低分壓、O₂、CO₂、總壓、O₂分壓、CO₂分壓、各自的分壓差 | O₂分壓、CO₂分壓、各自的分壓差 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-node-02.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-02.png) |
| node-03 | 肺動脈、肺泡PO₂約100 mmHg、入肺血PO₂約40 mmHg、入肺血PCO₂約45 mmHg、肺靜脈、肺泡PCO₂約40 mmHg、O₂、CO₂、離肺血PO₂約95 mmHg | 肺泡PO₂約100 mmHg、入肺血PO₂約40 mmHg、入肺血PCO₂約45 mmHg、肺泡PCO₂約40 mmHg | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-node-03.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-03.png) |
| node-06 | 局部低氧、通氣良好、肺小動脈收縮、血流減少、血流轉向 | 局部低氧、肺小動脈收縮、血流轉向 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-node-06.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-06.png) |
| node-04 | 膜面積↑、分壓差↑、溶解度↑、擴散↑、膜厚度↑、分子量平方根↑、擴散↓、CO₂溶解度約為O₂的20倍 | 膜面積↑、擴散↑、膜厚度↑、擴散↓ | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-node-04.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-04.png) |
| node-05 | 站立、肺尖0.24/0.07≈3.4、L/分、肺尖 通氣V 0.24、肺尖 血流Q 0.07、肺底0.82/1.29≈0.63、肺底 通氣V 0.82、肺底 血流Q 1.29 | 肺尖0.24/0.07≈3.4、肺底0.82/1.29≈0.63 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/1280-node-05.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/gas-exchange/390-node-05.png) |

僅圖層與 preview，content／題目／答案／ID 未改；解剖與錨點仍待 Claude 獨立驗收。[Codex]

## 階段二 respiratory-control（2026-10-15）

已完成標籤層與資料層；preview 成功，shots 20 張／verify 18 個狀態通過，console／pageerror／水平溢位 0。HTML 1,293,644 bytes。

[labels.json](../materials-src/figures/raster/respiratory-control/labels.json)／[完整量測](respiratory-screenshots/v2/respiratory-control/verification.json)。圖下說明直接取 content 原句，HTML line-break:strict 避頭點。

| 圖位 | 標籤（完整名） | 紅色粗體 | 1280／390 CSS px | 截圖 |
|---|---|---|---|---|
| overview-state-1 | 橋腦、延髓、腦脊髓液H⁺、中樞化學受器、周邊化學受器、迷走神經、肺牽張受器、血腦障壁、CO₂、換氣增加 | 腦脊髓液H⁺、中樞化學受器、CO₂ | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-overview-state-1.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-1.png) |
| overview-state-2 | 橋腦、延髓、腦脊髓液H⁺、中樞化學受器、周邊化學受器、迷走神經、肺牽張受器、血腦障壁、CO₂、抑制吸氣 | 迷走神經、肺牽張受器、抑制吸氣 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-overview-state-2.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-2.png) |
| overview-state-3 | 橋腦、延髓、腦脊髓液H⁺、中樞化學受器、周邊化學受器、迷走神經、肺牽張受器、血腦障壁、CO₂、換氣增加 | 周邊化學受器、換氣增加 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-overview-state-3.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-overview-state-3.png) |
| node-01 | 呼吸中樞、橋腦、延髓、化學受器訊息、牽張受器訊息、呼吸深度、呼吸頻率 | 呼吸中樞、橋腦、延髓 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-node-01.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-01.png) |
| node-02 | 血液、血腦障壁、腦脊髓液H⁺增加、CO₂、中樞化學受器、血中H⁺不易直接穿越、促進呼吸 | 腦脊髓液H⁺增加、CO₂、中樞化學受器 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-node-02.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-02.png) |
| node-03 | 周邊化學受器、頸動脈體、主動脈體、血中H⁺、CO₂、低氧、PO₂低於約60 mmHg | 頸動脈體、主動脈體、PO₂低於約60 mmHg | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-node-03.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-03.png) |
| node-04 | 赫鮑二氏反射、橋腦、延髓、迷走神經、肺牽張受器、抑制吸氣、避免肺過度擴張 | 迷走神經、肺牽張受器、抑制吸氣 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-node-04.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-04.png) |
| node-05 | pH 7.35–7.45、pH＝pKa＋log（HCO₃⁻/H₂CO₃）、6.1＋log（26/1.3）≈7.4、PCO₂＞45 mmHg、呼吸性酸中毒方向、腎臟排酸留HCO₃⁻、PCO₂＜35 mmHg、呼吸性鹼中毒方向 | PCO₂＞45 mmHg、呼吸性酸中毒方向、PCO₂＜35 mmHg、呼吸性鹼中毒方向 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-node-05.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-05.png) |
| node-06 | 運動、潮氣量增加、呼吸頻率增加、體溫升高、初到高山、大氣壓降低、吸入氧分壓下降、周邊化學受器、換氣增加、CO₂排出增加、pH上升 | 潮氣量增加、呼吸頻率增加、吸入氧分壓下降、周邊化學受器、換氣增加 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/1280-node-06.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/respiratory-control/390-node-06.png) |

僅圖層與 preview，content／題目／答案／ID 未改；解剖與錨點仍待 Claude 獨立驗收。[Codex]

## 階段二 breathing-mechanics（2026-10-15）

已完成標籤層與資料層；preview 成功，shots 20 張／verify 18 個狀態通過，console／pageerror／水平溢位 0。HTML 917,195 bytes。

[labels.json](../materials-src/figures/raster/breathing-mechanics/labels.json)／[完整量測](respiratory-screenshots/v2/breathing-mechanics/verification.json)。圖下說明直接取 content 原句，HTML line-break:strict 避頭點。

| 圖位 | 標籤（完整名） | 紅色粗體 | 1280／390 CSS px | 截圖 |
|---|---|---|---|---|
| overview-state-1 | 肺內壓、胸內壓、大氣壓、外肋間肌、橫膈、無氣流 | 無氣流 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-overview-state-1.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-overview-state-1.png) |
| overview-state-2 | 肺內壓、胸內壓、大氣壓、外肋間肌、橫膈、空氣流入 | 肺內壓、胸內壓、外肋間肌、橫膈、空氣流入 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-overview-state-2.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-overview-state-2.png) |
| overview-state-3 | 肺內壓、胸內壓、大氣壓、外肋間肌、橫膈、空氣流出 | 空氣流出 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-overview-state-3.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-overview-state-3.png) |
| node-01 | 平靜吸氣、肋間肌、橫膈、外肋間肌、平靜呼氣、彈性回縮、用力吸氣、胸鎖乳突肌、用力呼氣、腹直肌、內肋間肌 | 橫膈、外肋間肌、彈性回縮 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-01.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-01.png) |
| node-02 | 肺內壓（肺泡壓）、胸內壓（胸膜內壓）、大氣壓、肺間壓＝肺內壓－胸內壓、相對大氣壓較低 | 肺內壓（肺泡壓）、胸內壓（胸膜內壓）、大氣壓、肺間壓＝肺內壓－胸內壓 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-02.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-02.png) |
| node-03 | 吸氣前、肺內壓、胸內壓、大氣壓、外肋間肌、橫膈、無氣流、吸氣、空氣流入、平靜呼氣、空氣流出、肺內壓760→758 mmHg、胸內壓758→754 mmHg、肺內壓低於大氣壓、肺內壓高於大氣壓 | 無氣流、肺內壓、胸內壓、外肋間肌、橫膈、空氣流入、空氣流出、肺內壓760→758 mmHg、胸內壓758→754 mmHg | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-03.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-03.png) |
| node-05 | 正常、肺氣腫、順應性增加、回縮變差、氣體滯留、肺餘容積增加、纖維化、順應性降低 | 順應性增加、回縮變差、順應性降低 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-05.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-05.png) |
| node-06 | 胸膜腔密閉、胸內壓低於大氣壓、胸內壓更負、肺間壓增加、肺容積增加 | 胸膜腔密閉、肺間壓增加、肺容積增加 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-06.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-06.png) |
| node-04 | C＝ΔV/ΔP、肺容積改變量ΔV、肺間壓改變量ΔP、順應性較大、順應性較小 | C＝ΔV/ΔP、順應性較大 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/1280-node-04.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/breathing-mechanics/390-node-04.png) |

僅圖層與 preview，content／題目／答案／ID 未改；解剖與錨點仍待 Claude 獨立驗收。[Codex]

## 階段二 o2-co2-transport（2026-10-15）

已完成標籤層與資料層；preview 成功，shots 20 張／verify 18 個狀態通過，console／pageerror／水平溢位 0。HTML 477,049 bytes。

[labels.json](../materials-src/figures/raster/o2-co2-transport/labels.json)／[完整量測](respiratory-screenshots/v2/o2-co2-transport/verification.json)。圖下說明直接取 content 原句，HTML line-break:strict 避頭點。

| 圖位 | 標籤（完整名） | 紅色粗體 | 1280／390 CSS px | 截圖 |
|---|---|---|---|---|
| node-02 | 血紅素、四條肽鏈、四個血基質、二價鐵Fe²⁺、四分子O₂、可逆結合 | 四個血基質、二價鐵Fe²⁺、四分子O₂ | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-02.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-02.png) |
| node-06 | 氯轉移、碳酸酐酶、H⁺、紅血球、血紅素緩衝、血漿、HCO₃⁻、Cl⁻、①、②、③、CO₂＋H₂O、H₂CO₃、H⁺＋HCO₃⁻、① 紅血球內碳酸酐酶催化 CO₂＋H₂O → H₂CO₃ → H⁺＋HCO₃⁻；、② H⁺由血紅素緩衝；、③ HCO₃⁻移出紅血球時 Cl⁻進入，稱氯轉移。 | 氯轉移、碳酸酐酶、HCO₃⁻、Cl⁻ | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-06.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-06.png) |
| node-01 | %、與血紅素結合約97%、溶於血漿約3%、血紅素、血漿、每克血紅素約攜1.34 mL氧、溶解係數約0.003 mL/dL/mmHg | 與血紅素結合約97%、溶於血漿約3% | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-01.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-01.png) |
| node-05 | %、HCO₃⁻在血漿約70%、碳醯胺基血紅素約23%、直接溶解約7%、血紅素蛋白胺基、血漿 | HCO₃⁻在血漿約70%、碳醯胺基血紅素約23%、直接溶解約7% | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-05.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-05.png) |
| overview-state-1 | 血紅素氧飽和度（%）、PO₂（mmHg）、0、100、40、正常、PO₂ 40 mmHg、飽和度約75% | 正常、PO₂ 40 mmHg、飽和度約75% | 33.25／14.53 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-overview-state-1.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-overview-state-1.png) |
| overview-state-2 | 血紅素氧飽和度（%）、PO₂（mmHg）、0、100、40、右移 | 右移 | 33.25／14.53 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-overview-state-2.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-overview-state-2.png) |
| overview-state-3 | 血紅素氧飽和度（%）、PO₂（mmHg）、0、100、40、左移 | 左移 | 33.25／14.53 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-overview-state-3.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-overview-state-3.png) |
| node-03 | 血紅素氧飽和度（%）、PO₂（mmHg）、0、100、40、PO₂ 40 mmHg、飽和度約75% | PO₂ 40 mmHg、飽和度約75% | 33.25／14.53 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-03.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-03.png) |
| node-04 | 血紅素氧飽和度（%）、PO₂（mmHg）、0、100、40、正常、右移、H⁺增加（pH降低）、CO₂增加、溫度升高、2,3-DPG增加、親和力降低、利於釋氧、波爾效應、左移、相反條件、親和力增加 | 右移、親和力降低、利於釋氧、左移、親和力增加 | 33.25／14.53 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/1280-node-04.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/o2-co2-transport/390-node-04.png) |

僅圖層與 preview，content／題目／答案／ID 未改；解剖與錨點仍待 Claude 獨立驗收。[Codex]

## 階段二 lung-function（2026-10-15）

已完成標籤層與資料層；preview 成功，shots 20 張／verify 18 個狀態通過，console／pageerror／水平溢位 0。HTML 234,144 bytes。

[labels.json](../materials-src/figures/raster/lung-function/labels.json)／[完整量測](respiratory-screenshots/v2/lung-function/verification.json)。圖下說明直接取 content 原句，HTML line-break:strict 避頭點。

| 圖位 | 標籤（完整名） | 紅色粗體 | 1280／390 CSS px | 截圖 |
|---|---|---|---|---|
| node-03 | 鼻腔、肺泡、傳導區、終末細支氣管、呼吸性細支氣管、呼吸區、不交換氣體、氣體交換 | 傳導區、終末細支氣管、呼吸性細支氣管、呼吸區 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-node-03.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-03.png) |
| overview-state-1 | 淺快、TV 150 mL／VD 150 mL／F 40 次/min、VA＝（TV－VD）×F、mL/min、總通氣量、死腔通氣量、肺泡通氣量、總通氣量 6000／死腔通氣量 6000／肺泡通氣量 0 mL/min | 淺快、肺泡通氣量 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-overview-state-1.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-overview-state-1.png) |
| overview-state-2 | 一般、TV 500 mL／VD 150 mL／F 12 次/min、VA＝（TV－VD）×F、mL/min、總通氣量、死腔通氣量、肺泡通氣量、總通氣量 6000／死腔通氣量 1800／肺泡通氣量 4200 mL/min | 一般、肺泡通氣量 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-overview-state-2.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-overview-state-2.png) |
| overview-state-3 | 深慢、TV 1000 mL／VD 150 mL／F 6 次/min、VA＝（TV－VD）×F、mL/min、總通氣量、死腔通氣量、肺泡通氣量、總通氣量 6000／死腔通氣量 900／肺泡通氣量 5100 mL/min | 深慢、肺泡通氣量 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-overview-state-3.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-overview-state-3.png) |
| node-01 | 課本男性示例、0、1200、2400、2900、6000、容積（mL）、時間、潮氣容積TV 500 mL、吸氣儲備容積IRV 3100 mL、呼氣儲備容積ERV 1200 mL、肺餘容積RV 1200 mL | 潮氣容積TV 500 mL、吸氣儲備容積IRV 3100 mL、呼氣儲備容積ERV 1200 mL、肺餘容積RV 1200 mL | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-node-01.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-01.png) |
| node-02 | IC＝TV＋IRV＝3600 mL、FRC＝ERV＋RV＝2400 mL、VC＝IRV＋TV＋ERV＝4800 mL、TLC＝VC＋RV＝6000 mL、TV 500 mL、IRV 3100 mL、ERV 1200 mL、RV 1200 mL、平靜呼氣末FRC、平靜吸氣末FRC＋TV | IC＝TV＋IRV＝3600 mL、FRC＝ERV＋RV＝2400 mL、VC＝IRV＋TV＋ERV＝4800 mL、TLC＝VC＋RV＝6000 mL | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-node-02.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-02.png) |
| node-04 | mL／次、TV 500 mL、VD 150 mL、到達肺泡350 mL、F 12次/min、VA＝（TV－VD）×F、mL/min、總通氣6000 mL/min、肺泡通氣4200 mL/min | VD 150 mL、VA＝（TV－VD）×F、肺泡通氣4200 mL/min | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-node-04.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-04.png) |
| node-05 | 淺快150×40、mL/min、總通氣6000 mL/min、肺泡通氣0 mL/min、一般500×12、肺泡通氣4200 mL/min、深慢1000×6、肺泡通氣5100 mL/min | 肺泡通氣0 mL/min、肺泡通氣4200 mL/min、肺泡通氣5100 mL/min | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-node-05.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-05.png) |
| node-06 | 課本示範數值、0、1、4、5、呼出容積（L）、時間（秒）、FEV₁、FVC、正常、FEV₁ 4 L／FVC 5 L、4/5＝0.8、阻塞性、FEV₁ 1 L／FVC 2.8 L、1/2.8≈0.36、限制性、FEV₁ 2.5 L／FVC 2.8 L、2.5/2.8≈0.89 | FEV₁、FVC、4/5＝0.8、1/2.8≈0.36、2.5/2.8≈0.89 | 29.51／12.89 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/1280-node-06.png)／[390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-screenshots/v2/lung-function/390-node-06.png) |

僅圖層與 preview，content／題目／答案／ID 未改；解剖與錨點仍待 Claude 獨立驗收。[Codex]
