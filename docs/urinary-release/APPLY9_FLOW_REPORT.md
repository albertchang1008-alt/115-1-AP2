# 給 Claude 的摘要
- #6h：套件第三凍結 `3dfdc37`；本機分支 `codex/apply9-redo`、指定 `.worktrees/apply9-codex`。
- 新增 flowRoutes、排序成功逐段單次播放、reduced-motion 靜態箭頭與逐段方向依據檢查。
- 17處：8完成、5部分完成、4缺來源／圖位依據；不是17/17完成，詳見下表，未硬補。
- 回歸先紅後綠；共用39/39 PASS、0 skipped；6組壞資料均exit 1。
- 水鈉lab逐像素6/6相同；十份內容10/10 PASS；版面240/240 PASS、0 skipped。
- 13處有據路徑＋1額外排序節點：1280／390共28組PASS、84張動畫／靜態截圖；下表有完整路徑。
- B僅8份apply.json新增flowRoutes，fluid-compartments未改；原題目、PNG／SVG、舊kit／呼吸七份未改。
- 未build、登錄、發布、push或更動reviewed；根目錄既有未提交工作及其他worktree保留。
- 抽查建議（最多5處）：腎臟03、過濾01、腎血流04、排尿05、水鈉RAAS04。
- 請Claude核對下列來源／圖位缺口及動線後，再交教師看畫面；#6h停-等Claude。

## 交付與範圍
本次沿指定 worktree 的 `3898974` 接續，保留先前通過的九份內容。A 為第三凍結 commit，B 只補資料；沒有從根目錄呼吸分支取資料。
[套件凍結紀錄](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/APPLY9_FLOW_KIT_FREEZE.md>)；[格式](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/APPLY_FORMAT.md>)；[凍結SHA清單](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/materials-src/apply-kit/FREEZE_MANIFEST.json>)。
學生畫面不顯示來源uid／quote。flowRoutes以原底圖像素座標描述，沿原SVG的desktop/mobile transform注入；原圖不裁切、不改圖文，物質流動箭頭不等同增加／下降徽章。

## 17處完成／缺依據與截圖
每個有據節點在兩種寬度各附t1、t2及reduced-motion；t1/t2為150／450ms動畫相位。缺依據處沒有偽造動畫或用skip冒充通過。部分完成不代表候選全部細節已有依據。

| 項目 | 節點 | 結果與範圍／缺口 | 1280 | 390 |
|---|---|---|---|---|
| 必做1 | `kidney-anatomy-node-03` | **完成**。原句支持所列方向。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/kidney-anatomy/kidney-anatomy-node-03-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/kidney-anatomy/kidney-anatomy-node-03-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/kidney-anatomy/kidney-anatomy-node-03-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/kidney-anatomy/kidney-anatomy-node-03-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/kidney-anatomy/kidney-anatomy-node-03-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/kidney-anatomy/kidney-anatomy-node-03-390-reduced.png>) |
| 必做2 | `filtration-clearance-node-01` | **完成**。原句支持所列方向。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-01-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-01-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-01-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-01-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-01-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-01-390-reduced.png>) |
| 候選1 | `nephron-circulation-node-04` | **完成**。皮質腎元與近髓質腎元分別顯示管周微血管與直血管；未把二者串接，也未由同一個出球血管跨接兩個腎元。多點折線為方向示意。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/nephron-circulation/nephron-circulation-node-04-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/nephron-circulation/nephron-circulation-node-04-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/nephron-circulation/nephron-circulation-node-04-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/nephron-circulation/nephron-circulation-node-04-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/nephron-circulation/nephron-circulation-node-04-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/nephron-circulation/nephron-circulation-node-04-390-reduced.png>) |
| 候選2 | `tubular-handling-node-01` | **完成**。三種處理分開顯示，未把三者畫成同一物質必經的連續路徑。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-01-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-01-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-01-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-01-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-01-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-01-390-reduced.png>) |
| 候選3 | `tubular-handling-node-03` | **完成**。顯示共同回收方向；Na⁺／葡萄糖共同運輸與水滲透不畫成同一跨膜機制。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-03-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-03-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-03-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-03-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-03-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-03-390-reduced.png>) |
| 候選4 | `tubular-handling-node-05` | **部分完成**。已畫血→管液的鉀分泌；缺細胞內K⁺→管腔的逐段來源，不補細胞內支線。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-05-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-05-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-05-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-05-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-05-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/tubular-handling/tubular-handling-node-05-390-reduced.png>) |
| 候選5 | `urine-concentration-node-02` | **缺依據**。countercurrent-mechanism只寫下降枝水通透及水移出；未明寫皮質→髓質的管液路徑或移出後到間質的完整端點，不用名稱猜流向。 | 未畫（缺依據） | 未畫（缺依據） |
| 候選6 | `urine-concentration-node-03` | **缺依據**。countercurrent-mechanism只寫上升枝不透水／再吸收NaCl及共同運輸帶入離子；未明寫髓質→皮質管液路徑與NaCl外移兩端。 | 未畫（缺依據） | 未畫（缺依據） |
| 候選7 | `urine-concentration-node-04` | **缺依據**。countercurrent-mechanism只寫直血管緩慢逆流交換，沒有降枝／升枝的確切血流端點與順序，不能自行畫成雙向循環。 | 未畫（缺依據） | 未畫（缺依據） |
| 候選8 | `urine-concentration-node-05` | **部分完成**。已畫ADH存在時集尿管水→高張間質；reviewed卡寫水通道但未寫AQP2，不標AQP2／細胞內通路。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urine-concentration/urine-concentration-node-05-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urine-concentration/urine-concentration-node-05-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urine-concentration/urine-concentration-node-05-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urine-concentration/urine-concentration-node-05-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urine-concentration/urine-concentration-node-05-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urine-concentration/urine-concentration-node-05-390-reduced.png>) |
| 候選9 | `urinary-route-micturition-node-01` | **部分完成**。已畫腎盂→輸尿管→膀胱；缺斜穿膀胱壁防逆流的明確原句，不畫逆流阻斷效果。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-01-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-01-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-01-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-01-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-01-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-01-390-reduced.png>) |
| 候選10 | `urinary-route-micturition-node-04` | **部分完成**。兩性皆畫膀胱沿尿道向體外；缺內口／外口逐段名稱與位置依據，不新增內外口標示。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-04-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-04-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-04-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-04-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-04-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-04-390-reduced.png>) |
| 候選11 | `urinary-route-micturition-node-05` | **完成**。只在原圖下半排尿圖示畫尿流，上半儲尿圖示不畫尿流；反射神經線未當作尿路。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-05-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-05-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-05-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-05-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-05-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/urinary-route-micturition/urinary-route-micturition-node-05-390-reduced.png>) |
| 候選12 | `water-sodium-regulation-node-04` | **完成**。第三凍結內RAAS接力；分開顯示釋放與轉換，不把腎素本身畫成血管收縮素。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/water-sodium-regulation/water-sodium-regulation-node-04-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/water-sodium-regulation/water-sodium-regulation-node-04-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/water-sodium-regulation/water-sodium-regulation-node-04-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/water-sodium-regulation/water-sodium-regulation-node-04-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/water-sodium-regulation/water-sodium-regulation-node-04-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/water-sodium-regulation/water-sodium-regulation-node-04-390-reduced.png>) |
| 候選13 | `electrolyte-balance-node-02` | **完成**。依原圖粒子少→多側顯示淨移動，不擴寫未核定濃度或壓力數值。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/electrolyte-balance/electrolyte-balance-node-02-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/electrolyte-balance/electrolyte-balance-node-02-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/electrolyte-balance/electrolyte-balance-node-02-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/electrolyte-balance/electrolyte-balance-node-02-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/electrolyte-balance/electrolyte-balance-node-02-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/electrolyte-balance/electrolyte-balance-node-02-390-reduced.png>) |
| 候選14 | `acid-base-homeostasis-node-04` | **缺依據**。已找到external-respiration明寫CO₂移入肺泡，但原圖沒有可辨認的肺泡交換剖面座標；不把箭頭畫在肺門大血管與支氣管間冒充肺泡交換。H₂CO₃肺端分解及肺泡→體外亦缺逐段原句。 | 未畫（缺依據） | 未畫（缺依據） |
| 候選15 | `acid-base-homeostasis-node-05` | **部分完成**。已畫HCO₃⁻回到血液；H⁺原句寫小管分泌，但未明寫管壁細胞內→管腔兩端，不以一般血→管液定義冒充H⁺細胞內來源。 | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/acid-base-homeostasis/acid-base-homeostasis-node-05-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/acid-base-homeostasis/acid-base-homeostasis-node-05-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/acid-base-homeostasis/acid-base-homeostasis-node-05-1280-reduced.png>) | [t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/acid-base-homeostasis/acid-base-homeostasis-node-05-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/acid-base-homeostasis/acid-base-homeostasis-node-05-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/acid-base-homeostasis/acid-base-homeostasis-node-05-390-reduced.png>) |

## 額外排序節點
`filtration-clearance-node-02`：依序微血管內皮→基底膜→鮑氏囊臟層足細胞；排序正確後依序播放一次。未改原排序文字或題庫，不列入17處。
[t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-02-1280-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-02-1280-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-02-1280-reduced.png>)；[t1](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-02-390-t1.png>)／[t2](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-02-390-t2.png>)／[靜態](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/filtration-clearance/filtration-clearance-node-02-390-reduced.png>)

## 逐段uid＋逐字原句
每段from/to與來源均保留於作者資料；下列原句包含原卡Markdown符號。檢查同時確認卡片與進度為reviewed、quote逐字存在；檢查器只允許明確先後／方向連接，拒絕無來源、反向、無關、未寫順序及否定原句。語意與圖位仍須人工核對。

| 項目／route／段 | 箭頭兩端（原句用語） | 卡uid | 逐字原句 |
|---|---|---|---|
| 必做1／flow-03-1／1 | 乳頭 → 小腎盞 | `urine-pathway` | 乳頭開口入小腎盞，小腎盞合入大腎盞，再匯入腎盂。 |
| 必做1／flow-03-1／2 | 小腎盞 → 大腎盞 | `urine-pathway` | 乳頭開口入小腎盞，小腎盞合入大腎盞，再匯入腎盂。 |
| 必做1／flow-03-1／3 | 大腎盞 → 腎盂 | `urine-pathway` | 乳頭開口入小腎盞，小腎盞合入大腎盞，再匯入腎盂。 |
| 必做1／flow-03-1／4 | 腎盂 → 輸尿管 | `kidney-structure` | 腎盂位於靠近腎門的收集部，接輸尿管。 |
| 必做2／flow-01-1／1 | 血液 → 過濾膜 | `glomerular-filtration` | 腎絲球過濾是血液中的水與可通過的溶質經過濾膜進入鮑氏囊；正常濾液不含血球及白蛋白。 |
| 必做2／flow-01-1／2 | 過濾膜 → 鮑氏囊 | `glomerular-filtration` | 腎絲球過濾是血液中的水與可通過的溶質經過濾膜進入鮑氏囊；正常濾液不含血球及白蛋白。 |
| 候選1／flow-04-1／1 | 腎動脈 → 葉間 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-1／2 | 葉間 → 弓狀 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-1／3 | 弓狀 → 小葉間動脈 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-1／4 | 小葉間動脈 → 入球小動脈 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-1／5 | 入球小動脈 → 腎絲球 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-1／6 | 腎絲球 → 出球小動脈 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-1／7 | 出球小動脈 → 管周微血管 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-1／8 | 管周微血管 → 靜脈回流 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-2／1 | 出球小動脈 → 直血管 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選1／flow-04-2／2 | 直血管 → 靜脈回流 | `renal-blood-flow` | 腎動脈→葉間→弓狀→小葉間動脈→入球小動脈→腎絲球→出球小動脈→管周微血管或直血管，再入靜脈回流。 |
| 候選2／flow-01-1／1 | 血 → 囊 | `renal-handling` | 過濾把物質由血移入囊；再吸收把管液中物質送回血；分泌把血中物質送入管液。 |
| 候選2／flow-01-2／1 | 管液 → 血 | `renal-handling` | 過濾把物質由血移入囊；再吸收把管液中物質送回血；分泌把血中物質送入管液。 |
| 候選2／flow-01-3／1 | 血 → 管液 | `renal-handling` | 分泌把血中物質送入管液。 |
| 候選3／flow-03-1／1 | 濾液中的水與特定溶質 → 血液 | `tubular-reabsorption` | 腎小管再吸收是將濾液中的水與特定溶質移回血液；可用主動或被動運輸。 |
| 候選4／flow-05-1／1 | 血 → 管液 | `potassium-secretion` | 分泌是從血進管液，再吸收是反方向；不能把醛固酮的排鉀作用寫成保鉀。 |
| 候選8／flow-05-1／1 | 集尿管水 → 高張間質 | `countercurrent-mechanism` | ADH 存在時，集尿管水可進入高張間質；NaCl 與尿素共同參與濃縮環境。 |
| 候選9／flow-01-1／1 | 腎盂 → 輸尿管 | `kidney-structure` | 腎盂位於靠近腎門的收集部，接輸尿管。 |
| 候選9／flow-01-1／2 | 輸尿管 → 膀胱 | `urine-pathway` | 輸尿管蠕動送尿至膀胱，尿道負責由膀胱排至體外。 |
| 候選10／flow-04-1／1 | 膀胱 → 體外 | `urine-pathway` | 輸尿管蠕動送尿至膀胱，尿道負責由膀胱排至體外。 |
| 候選10／flow-04-2／1 | 膀胱 → 體外 | `urine-pathway` | 輸尿管蠕動送尿至膀胱，尿道負責由膀胱排至體外。 |
| 候選11／flow-05-1／1 | 膀胱 → 體外 | `urine-pathway` | 輸尿管蠕動送尿至膀胱，尿道負責由膀胱排至體外。 |
| 候選12／raas-relay／1 | 近腎絲球細胞 → 腎素 | `renin-angiotensin-aldosterone` | 血壓下降時，刺激腎臟的**近腎絲球細胞**釋放**腎素**；腎素催化血液中的**血管收縮素原**轉換成**血管收縮素 I**，再經由位於**肺臟**的血管收縮素轉化酶（ACE）轉變成具活性的**血管收縮素 II**。 |
| 候選12／raas-relay／2 | 血管收縮素原 → 血管收縮素 I | `renin-angiotensin-aldosterone` | 血壓下降時，刺激腎臟的**近腎絲球細胞**釋放**腎素**；腎素催化血液中的**血管收縮素原**轉換成**血管收縮素 I**，再經由位於**肺臟**的血管收縮素轉化酶（ACE）轉變成具活性的**血管收縮素 II**。 |
| 候選12／raas-relay／3 | 血管收縮素 I → 血管收縮素 II | `renin-angiotensin-aldosterone` | 血壓下降時，刺激腎臟的**近腎絲球細胞**釋放**腎素**；腎素催化血液中的**血管收縮素原**轉換成**血管收縮素 I**，再經由位於**肺臟**的血管收縮素轉化酶（ACE）轉變成具活性的**血管收縮素 II**。 |
| 候選13／flow-02-1／1 | 水 → 離子或分子較多區域 | `electrolyte-osmolarity` | 水移向離子或分子較多區域； |
| 候選15／flow-05-1／1 | HCO₃⁻ → 血液 | `renal-acid-base-compensation` | 同時 HCO₃⁻回到血液。 |
| 排序補強／flow-02-1／1 | 微血管內皮 → 基底膜 | `glomerular-filtration` | 過濾膜依序含微血管內皮、基底膜、鮑氏囊臟層足細胞。 |
| 排序補強／flow-02-1／2 | 基底膜 → 鮑氏囊臟層足細胞 | `glomerular-filtration` | 過濾膜依序含微血管內皮、基底膜、鮑氏囊臟層足細胞。 |

## 不足處的現有原句與判斷
候選5–7的 `countercurrent-mechanism` 原句：
> 下降枝對水通透、對溶質通透差，水移出後管液變濃；上升枝不透水而再吸收 NaCl，管液變稀。
> 直血管緩慢逆流交換，減少髓質溶質流失。
這兩句未列出皮質／髓質管液先後路徑、直血管降升枝確切循環；不以構造名稱自行補完整流向。
候選14 `external-respiration` 原句：
> 血中 PCO₂ 約 45，高於肺泡約 40，CO₂ 移入肺泡。
該句支持肺端交換方向，但本圖只有器官總覽與酸鹼物質圓形示意，缺可辨認的肺泡交換剖面與對應端點。已撤回會落在肺門大血管／支氣管旁的試畫箭頭；未把血液中CO₂形成碳酸的原句自行反轉成肺端分解。
候選4缺細胞內K⁺支線；候選8缺AQP2名稱；候選9缺斜穿壁防逆流；候選10缺內／外口逐段依據；候選15只畫明寫的HCO₃⁻回血，不把一般「分泌把血中物質送入管液」冒充H⁺的細胞內起點。

## 驗證結果與方法
- 實作前流向回歸2/2 FAIL、0 skipped；否定句回歸亦先紅（4 PASS／1 FAIL、0 skipped）。修正後共用39/39 PASS、流向5/5 PASS，均0 skipped。
- 六組CLI壞資料：缺來源、反向、無關引用、假原句、座標超界、真實reviewed否定句；全部exit 1。未改錯誤資料為skip。
- 十份內容：10/10 PASS、5889次逐字引文匹配；學生HTML無uid、禁用詞或頁面錯誤。題庫整筆與c8fb122比較相同。
- 凍結版面檢查器：九份216/216＋水鈉24/24＝240/240 PASS、0 skipped；8尺寸含820寬與手機／橫式，三狀態均檢查。
- 水鈉lab：1280／390×三狀態，6/6 PNG byte-identical；只有知識node-04新增RAAS流程，未更動lab畫面。
- 有流向14個節點×兩寬＝28組動畫／reduced-motion PASS，共84張。每頁先驗正常動畫stroke-dashoffset隨真實時間變動，再以CSS暫停及負延遲擷取150／450ms相位；兩張PNG SHA均不同。擷取後移除相位控制，實際點排序按鈕確認播放後停住。
- Chromium／Playwright截圖準備會重新同步SVG動畫，單用延遲截圖曾拍到同相位。最終用同一Playwright頁面的CDP截圖，CSS相位與PNG SHA一併記錄，沒有用單一靜態箭頭冒充動態。
- 4個有路徑的sequence節點×兩寬＝8組：用原往前／往後按鈕排對、點核對順序、確認逐段播放與complete後無active段；reduced-motion無動畫且不逐段閃現。排錯不播放由共用回歸驗證；無流向依據的分類／算式排序不硬加路徑。
- 手機審圖：完整圖例保留，新增箭頭不遮掉字；28組均無橫向overflow、無JS錯誤。排尿05只在下半排尿圖畫尿流，上半儲尿圖不畫。腎血流區分兩類腎元的回流，不把管周微血管與直血管串成同一管路。
- B對3898974逐欄比較：只有flowRoutes新增；圖檔、原版content.json、題目、舊kit／widget未變。35個凍結檔案SHA一致。未執行會觸發build的npm run check，改跑直接共用測試與凍結兩支檢查器。

證據：
[紅燈](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/red.tap>)；[否定句紅燈](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/negation-red.tap>)；[39項測試](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/shared-tests.tap>)；[壞資料](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/A/negative/summary.json>)；[水鈉像素比對](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/A/parity/parity.json>)
[內容摘要](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/content-summary.json>)；[九份版面](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/layout-summary.json>)；[水鈉版面](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/A/layout/layout-results.json>)；[動畫取樣與84張索引](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/animation-results.json>)；[保護檢查](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/B/protection.json>)
[資料重現腳本](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/author-flows.py>)；[內容重驗腳本](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/verify-content.mjs>)；[動畫操作與截圖腳本](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-flow/capture.mjs>)

## 本機重現（不build）
在指定worktree使用Node v22.23.2：
```bash
node --import tsx --test tests/apply*.test.mjs tests/material*.test.ts
node docs/urinary-release/apply9-flow/verify-content.mjs
node docs/urinary-release/apply9-flow/capture.mjs
```
版面逐份使用 `scripts/apply-layout-check.mjs <apply.json> --out <evidence-dir>`；水鈉來源在 `materials-src/apply-examples/water-sodium-regulation/apply.json`。所有檢查僅輸出審查證據，沒有生成public教材。

## 停點
請Claude獨立核對17處表格、逐段原句與路徑。缺口需補reviewed原句及可辨識圖位後才能補畫；本次不自行改教師reviewed，也不交其他聊天。#6h停-等Claude。收工週誌與佇列只在根目錄更新本列，handoff規則未改。
