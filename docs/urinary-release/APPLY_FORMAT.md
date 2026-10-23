# 九份套用資料格式（第0步，schemaVersion 1）

共用套件位於`materials-src/apply-kit/`；完整範例是`materials-src/apply-examples/water-sodium-regulation/apply.json`。
這是新的、獨立的教材套件，不取代舊`materials-src/kit/`；呼吸七份繼續走舊路徑。只產生docs內離線preview，不寫public、不登錄。

## 內容與證據

所有顯示用文字採`{text, sources:[{uid,quote}]}`，例如：
```json
{"text":"抗利尿激素（ADH）幫助保水。","sources":[{"uid":"adh-water-reabsorption","quote":"水不足時，腦下垂體後葉釋放 ADH，增加保水。"}]}
```
數值或原封不動的題目採`{value: ..., sources:[...]}`。`value`內的題目是不可改動的整筆原題（包括原sources欄），和c8fb122逐字／結構比較；不是重新出題。
渲染器剝除證據及舊uid／sources，不把卡片UID放在學生HTML裡。資料檔內可保留出處，學生只見text/value。

不是內容的控制值不包證據：slug／version／id、資產src、寬高、座標、side、direction、type、term/terms、compactTerms、targetStateId、from/to、correctOrder、布林旗標及流程分隔符→／＝。
座標、方向與圖上的語意仍需在該元件的sources、文字或edges中給出原句；不能因為是控制值就自行創造學理關係。
UI固定操作文字（例如「下一步」「點節點看說明」）由套件提供，不是課本知識欄位。

quote必須逐字存在於該uid卡片，卡片檔頭review_status及todo_all.jsonl同uid的status都必須reviewed；第二AI PASS或self_checked不等於reviewed。
引文匹配是機械檢查，**不能保證白話改寫或整合箭頭在意義上正確**；整合、條件及反向關係仍要在報告說明並交第二方審查。

## 頂層

| 欄位 | 規格 |
|---|---|
| schemaVersion | 固定1 |
| slug、version | 對應原教材；slug以a-z／0-9／-組成，不改版號 |
| title | 有sources的標題文字 |
| lab | 下述實驗室資料 |
| learning | 下述節點、任務、題目與心智圖資料 |

## lab：定稿的單屏實驗室

| 欄位 | 填法 |
|---|---|
| header | 頂欄文字，Text |
| initialState | states中的id；不在套件寫死state-1等內容 |
| figure | `{src,width,height}`，完整底圖相對apply.json的位置與原始尺寸；套件保持完整比例，不依狀態裁切 |
| referenceHeading | 常駐數值區的標題，Text；可填攝取基準或其他教材參數 |
| glossary | `{key:{name:Text,text:Text}}`，每項2–3句、全名＋簡稱；所有被引用的term都要存在 |
| compactTerms | 例如`{"thirst":"retainSignals","renin":"hormonesDown"}`；手機合併節點對應完整說明，鍵值都是glossary的key |
| states | 任意非空狀態陣列，每個id唯一、a-z／0-9／- |

每個state：

| 欄位 | 填法 |
|---|---|
| id／name／banner | id為控制值；name與banner為Text |
| changes | `{name:Text,detail:Text,direction, badge:Text,terms:[key],termLabels:[Text]}`；direction只能same／up／down，termLabels與terms等長；第一項是該態預設說明 |
| labels | `{id,short:Text,full:Text,side,y,direction,anchor?,circulating?,sources}`；side為left/right，y是完整圖高的0–1比例，anchor為原底圖x/y的0–1座標；circulating=true不得有anchor或器官引線 |
| indicators | `{a:[x,y],dir,sources}`；以原底圖正規化座標定位器官大箭頭，不能把循環激素指成某個器官 |
| intake | 常駐數值列：`{name:Text,amount:Value,unit:Text,status:Text,sources}`；可用其他教材基準量，名稱與單位由資料提供，數值不可自行推算；狀態文字須依教材／教師裁定 |
| flowStages | 依序的層與連接符；一層是節點陣列，層間放→或＝；同層節點等寬。節點為`{term,label:Text,compactLabel:Text,direction,sources}`，direction為up/down/null，compactLabel空字串表示手機隱藏並由compactTerms合併 |
| edges | `{from:[term],to:[term],relation:Text,sources}`；每一個分支的關係獨立引用，不能只替整張圖放一個來源。flowStages決定階層排版，edges記錄對應的知識關係 |
| teacherNote | 是否在教師預覽模式顯示已核可來源提示，布林；學生畫面不顯示 |

實驗室使用完整全身圖＋固定像素HTML疊字，標籤至少14px，圖旁徽章至少12px。因果小圖節點與徽章自適應14–20px；有空間時撐開，窄手機維持單行。

## learning：節點、三種看圖任務與排序

`nodes`每筆：`{id,title:Text,summary:Text,concept:Text,figure:{src,sources},lookTask}`。
figure是核定教材SVG的相對路徑；水鈉範例把六張原圖逐byte複製到自身figures/以固定依賴，不寫入原圖。不改圖稿、題目或既有材料ID。引用的既有SVG亦需做台灣用語／圖面稽核，不能把來源資料欄的PASS當成圖中每個標籤都已核對。

lookTask三種：
- structure：`{type:"structure",instruction:Text}`，找構造／路徑，不計分。
- state：`{type:"state",instruction:Text,targetStateId}`，回實驗室切到指定狀態觀察；不改完成分母。
- sequence：`{type:"sequence",instruction:Text,steps:[Text],correctOrder:[0,...]}`，correctOrder必須是所有步驟索引的完整排列。套件洗牌後用上下按鈕排序，再核對；不以排序取代第二關或心智圖。

範例沒有搬入卡片未載的AQP2／基底側膜細節；看圖任務與心智圖改用reviewed原句組織。這些是新範例的學習資料，原content.json完全不改；原題則一律保留。

## 原題與心智圖

`learning.questions`包含foundation／cases兩個陣列及predict單筆，每筆採`Value`封裝原題；`unwrap`後必須與`git show c8fb122:materials-src/<slug>/content.json`的foundation／cases／lab.predict完全相同（包含題幹、選項、順序、答案、提示、解析及原sources）。

`learning.mindmap`：`{center:Text,branches:[{title:Text,items:[{text:Text,isBlank:boolean}]}]}`。
至少有一個挖空項目；套件支援點選／拖曳標籤、取回及重新配對、錯誤提示、核對全部挖空。
通關必須同時成立：第二關全部答對＋心智圖全部配對正確；CourseLearning.complete()只送一次。看圖、因果小圖及排序不計分。
錯題先顯示第一層提示，再開第二層說明／回節點複習；未複習不得重新挑戰。首次三步導覽及練習規則框為套件功能。
preview沒有載入正式SDK、沒有登入或網路寫入；正式整合時由可信宿主提供window.CourseLearning，這一步不做發布或登錄。

## 執行與證據

在外部worktree根目錄，先讓Node 22可用：
```sh
node scripts/apply-preview.mjs materials-src/apply-examples/water-sodium-regulation/apply.json docs/urinary-release/apply9-step0/preview
node scripts/apply-layout-check.mjs materials-src/apply-examples/water-sodium-regulation/apply.json --out docs/urinary-release/apply9-step0/layout
node scripts/apply-content-check.mjs materials-src/apply-examples/water-sodium-regulation/apply.json --cards "/本機卡片專案/01_knowledge" --progress "/本機卡片專案/todo_all.jsonl" --out docs/urinary-release/apply9-step0/content-result.json
node --test tests/apply-kit.test.mjs
```

lab.html是定稿實驗室的單屏preview，course.html是整份教材元件的操作preview。版面檢查只對單屏lab契約跑8尺寸×所有狀態；完整教材本來可以閱讀捲動，不把整份多章節內容硬塞一屏。
套件只產生傳入docs輸出位置的離線preview；不呼叫materials-build、npm build、目錄同步或發布。

`apply-layout-check`保留原凍結recheck的字級／溢出／捲動門檻，新增JS錯誤與文件捲動檢查；任一案例FAIL就exit 1。`--html`只供故意壞版面的負向測試，不改資料欄位或降低門檻。
`apply-content-check`核對schema、所有來源、雙重reviewed、原題、學生可見UID及台灣用語黑名單；任一錯誤exit 1。`--student-html`只供可見UID負向測試。
台灣用語表在`materials-src/apply-kit/taiwan-terms.json`；教師已定稿用語「心房利鈉尿肽」明列可用，避免被舊子字串「鈉尿肽」誤判。簡體檢查是明列字表＋專案黑名單，不能取代人工用語審查。

重跑本輪證據：
```sh
node scripts/apply-step0-verify.mjs parity docs/urinary-release/apply9-step0
node scripts/apply-step0-verify.mjs negative docs/urinary-release/apply9-step0 "/本機卡片專案/01_knowledge" "/本機卡片專案/todo_all.jsonl"
node scripts/apply-step0-verify.mjs respiratory docs/urinary-release/apply9-step0
```
negative會故意製造壞引文／改題／缺來源／黑名單／UID露出與8px字級；預期每支子命令exit 1，總驗證成功才exit 0。
呼吸驗證只在docs重產現有legacy renderer的前後preview，對390／1280逐狀態PNG及通關操作比對；不覆寫已發布教材。

## 凍結與後續分工

本機凍結commit及SHA以根目錄`docs/urinary-release/APPLY9_STEP0_REPORT.md`為準。`FREEZE_MANIFEST.json`列套件、檢查器與測試的雜湊；交付後兩邊都不得修改，遇需求回報Codex／Claude。
未經第0步Claude驗收，不開始其餘九份。後續各自從同一凍結commit開獨立worktree，只新增／修改自己負責的apply資料及素材；不改套件、檢查器、題目或另一方資料。
這一步沒有套用其他九份，也不push、build、登錄或發布。

## 2026-10-20 新凍結：schemaVersion 2

v1只保留教師已定稿且資料物件完全相同的水鈉相容樣本，變更任何欄位即須v2，不得冒用水鈉slug繞過新檢查；畫面與原題不可變；其餘新套用必須v2。這項相容例外不適用九份重做。

- 每態加`mode: "focus"|"change"`及`relation: "parallel"|"cause"`。
- `changes`、`labels`及小圖節點皆必填穩定`id`與`kind: "focus"|"change"`。focus不帶direction或badge，不畫方向動畫；focus態不得混入change。change.direction為up/down/same，預設對應↑上升／↓下降／＝不變。
- changes的名詞採`bindings:[{id,term,label:Text}]`，id必須等於glossary key與term，label必須與該glossary.name相同。小圖`id===term`，label同樣核對glossary.name。排序及手機都不改id；v2不准compactTerms重導向。compactLabel可縮短名稱，全文仍由同一id取得。
- `flowStages`維持原結構。parallel採單層多節點，不放→等連接符；不畫因果箭頭。cause可分層連接，edges的relation須與態一致；每邊加`description:Text`、sources及`fromSources`／`toSources`兩端逐字引文，少任一端FAIL。
- change項必附`directionSources:[{uid,quote}]`，雙reviewed及逐字存在外，還必須命中該方向明確字詞。up：增加／上升／促進／升高／興奮／升壓；down：減少／降低／下降／抑制／減酸／較少；same：維持／平衡／不變／等於。這只是必要條件，不能證明引文主詞、否定或比較條件正確，仍需第二方審內容。
- 教師例外用`directionApproval`引用凍結`direction-approvals.json`，須id、slug、itemId、direction全相符；目前無新增例外，不能在資料檔自稱核定。要加入例外須另附教師裁定並重新凍結，不能改既有凍結檔。
- 圖上labels必附`anchorRef`（既有ANCHOR_TABLE的具名結構），以原圖正規化anchor對照原表像素點±0.5px。figure.anchorView預設overview；體液底圖是node-05，須明填node-05。label不准跨view取點；indicators也需anchorRef。原表沒有面積區，採精確點容差，不自行發明區域。
- `anchor-assets.json`固定原既有SVG內PNG的SHA／原始寬高／來源路徑。CLI核對實際PNG與尺寸，避免套上另一張圖或錯誤長寬比仍通過座標檢查。未有原表錨點的概念只用面板，或circulating:true不拉器官線；不得為有圖而任意補錨點。
- focus不顯示↑↓▲▼；檢查器拒絕focus項、focus常駐數值內的方向符號。layout另核對focus態沒有徽章／shape marker／器官箭頭，parallel沒有因果連接元素，原字級、溢出、捲動門檻全保留。

新測試：`node --test tests/apply-kit.test.mjs tests/apply-neutral.test.mjs`。
新壞資料CLI證明：`node scripts/apply-neutral-proof.mjs <evidence> <cards> <progress>`；每項要求exit 1及對應錯誤，沒有skip。逐字引文存在、方向字詞與精確錨點仍不能取代內容意義審查。

## 第三凍結點：flowRoutes（2026-10-20）
節點或 lab.states 可有 `flowRoutes` 陣列，與 `direction` 趨勢徽章分離；focus 可顯示有原句依據的物質流向，不能因此加入增加／下降。
每條 `{id,width,height,segments}` 的 width/height 必須等於原 SVG 的 image 像素尺寸（lab 為 figure 尺寸）。每段 `{from:Text,to:Text,points:[[x,y],...],sources:[{uid,quote}]}`，points 使用原底圖像素座標，不得使用畫面座標；套件沿既有 desktop/mobile raster transform 注入，不改原 SVG。
每段 from/to 使用原句中的逐字名稱（可移除 Markdown 粗體），同一則 reviewed 原句必須以相同先後次序明寫兩端與移動／轉換／順序關係；未寫方向的並列句不得當依據。檢查器同時查卡與進度 reviewed、逐字原句、端點先後、連接詞及尺寸／邊界；否定句（例如「不會轉成」）不得作正向路徑依據；文字判讀與座標仍須人工複核。
預設虛線沿箭頭方向循環。sequence 排對後依資料 segments 順序逐段播放一次，每段650ms，播放後停在靜態；排錯不播放、不影響計分。無 flowRoutes 的排序（例如概念分類／算式）不硬加物質路徑。`prefers-reduced-motion:reduce` 全程顯示靜態實線箭頭，不做逐段閃現；切換偏好會立即停止播放。來源 uid/quote 不進學生 HTML。

## 第四凍結點：兩階段選項容器（2026-10-20）
本輪只新增選項寬度、換行及置中規則，字級可隨font-scale放大；不改題目資料。圖依賴題先交獨立作答改寫草稿，教師核定前不套用，不用補圖保留圖依賴考核。互動設計僅一份酸鹼提案；假圖重畫與新任務門檻均尚未實作。
