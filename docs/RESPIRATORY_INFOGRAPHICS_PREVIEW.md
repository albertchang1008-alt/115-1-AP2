# 呼吸系統七份教材：教師預覽與自查

2026-10-07。分支 `feature/respiratory-infographics`，基底 `e8805f8`。**教材尚未 commit**：依交辦 A1.2，等教師看畫面核可才 build／登錄／Excel／commit。

- 每份 nodeTotal 6、questionTotal 11，共42節點／77題。
- 7份 `materials:preview`＋`materials:shots`：1280／390各3實驗室狀態與6節點，140張圖，無錯誤／頁面溢位／文字裁切；圖內字均≥12px。
- `scripts/respiratory-kit-verify.mjs`：14份實際頁面，所有77題兩尺寸作答、6節點探索／停留、錯題須回讀才能重挑戰、最後答對只送一次complete、所有狀態圖與節點字級裁切檢查通過。結果 `docs/RESPIRATORY_KIT_VERIFY.json`，182張局部與互動畫面；兩關另28張題目圖。
- `npm run materials:validate-nodes`：既有21份及全部新舊kit來源通過。
- `npm run check`：前端134／Functions26測試、兩端build、version:check通過；`git diff --check`通過。
- 正解位置0／1／2／3：20／19／19／19。
- JSON用語／A2／草稿掃描（感受器、接受器、毛細血管、紅細胞、每搏量、斜角肌、12–14、70 mmHg、非心因性、98.5、1.5%、紙袋、0.75、待教師、⚠️）：0。貧血／高山移曲線、FVC不變、診斷門檻均未加入。
- `shared/materials.ts`、Excel與既有教材零改動；只preview產生7份本機HTML。配色只新增slug色值，未登錄目錄。氧曲線JS僅在該slug建置時納入。

## 10/7 Claude 驗收後修正（待複驗）

- R1：重畫面朝左的矢狀切面（節點1–4／實驗室），標出咽三段、軟腭、耳咽管口、會厭，以及前方喉／氣管與後方食道；右主支氣管改短、粗、較垂直。
- 右肺水平裂接外側斜裂，斜裂向內下至肺底，中葉呈楔形；心切跡標籤移至左肺前緣。肺泡三類細胞逐一加引線，第二型嵌壁、巨噬細胞在腔內。
- 氧曲線右移／左移時同時顯示正常虛線，26／31／21的模型常數與滑桿數值不變。胸廓外口鼻端標大氣壓，胸廓內分畫肺與胸膜腔、標兩種壓力。
- R2：77題各自的 hint／1–2句 explain、7份預測回饋、12句指定觀察與應用已修；42節點均有2–3短重點。淺快／一般／深慢標籤與PO₂＜約60統計已修。
- 提示與解析以 `scripts/respiratory-teaching-texts.json` 保存，來源產生器重跑不會還原為制式文字。77題 ID／題幹／選項／正解／nodeId 與修正前快照逐欄比對完全相同。
- 自查摘要 `docs/RESPIRATORY_FIX_AUDIT.json`；用語／A2／草稿掃描0。已刪除4張 `_cb_*.png`，其餘截圖更新。
- 7份 preview／shots、validate-nodes、14頁互動驗證及28張題目截圖重新通過；已目視檢查修正的解剖圖。
- 仍未 materials:build、未登錄、未改Excel與B報告、未commit教材；下一步先由Claude複驗，再交教師看畫面。

## 教師看畫面

[七份預覽總覽](respiratory-preview.html)；每列都有獨立本機教材與手機／桌機圖。`materials-src/<slug>/shots/`另有每份完整頁面圖（本機ignored），`docs/respiratory-screenshots/`有清楚的局部圖。

| 教材 | slug | 手機實驗室 | 桌機節點 | 節點／題數 |
|---|---|---|---|---|
| 呼吸道的構造 | `airway-structure` | [390](respiratory-screenshots/airway-structure-390-lab-state-1.png) | [1280](respiratory-screenshots/airway-structure-1280-node-1.png) | 6／11 |
| 肺與胸膜 | `lungs-pleura` | [390](respiratory-screenshots/lungs-pleura-390-lab-state-1.png) | [1280](respiratory-screenshots/lungs-pleura-1280-node-1.png) | 6／11 |
| 肺通氣與呼吸力學 | `breathing-mechanics` | [390](respiratory-screenshots/breathing-mechanics-390-lab-state-1.png) | [1280](respiratory-screenshots/breathing-mechanics-1280-node-1.png) | 6／11 |
| 肺容積與肺功能 | `lung-function` | [390](respiratory-screenshots/lung-function-390-lab-state-1.png) | [1280](respiratory-screenshots/lung-function-1280-node-1.png) | 6／11 |
| 氣體交換 | `gas-exchange` | [390](respiratory-screenshots/gas-exchange-390-lab-state-1.png) | [1280](respiratory-screenshots/gas-exchange-1280-node-1.png) | 6／11 |
| 氧與二氧化碳的運輸 | `o2-co2-transport` | [390](respiratory-screenshots/o2-co2-transport-390-lab-state-1.png) | [1280](respiratory-screenshots/o2-co2-transport-1280-node-1.png) | 6／11 |
| 呼吸調節 | `respiratory-control` | [390](respiratory-screenshots/respiratory-control-390-lab-state-1.png) | [1280](respiratory-screenshots/respiratory-control-1280-node-1.png) | 6／11 |

## 已核對與待教師裁定

- ⑦節點3：CH06 p.31原句有「即頸動脈體和主動脈體」，已依規格加入名稱；所有42節點都有sources與可見reference。
- ①喉側視、主支氣管分級、②左右肺葉與心切跡、肺泡三種細胞、⑥可拖曳S曲線已完成。曲線為課本概念示意，滑桿標示模型值，不作臨床計算。
- 原12個制式「觀察與應用」已全部依修正單指定文字替換。
- 來源標記依規格的頁碼；不是再次把42張原子卡提升review狀態。
- B報告已交 `/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/05_review/Q3疑點研究_6題.md`；報告原句以既有可辨識文字證據查核，PDF部分字型映射有缺字，未以缺字結果補造引文。Q3-28原答案有爭議；另外五題仍可作答，解析待修。B未套A。
- 正式教材保留本規格明文指定的疾病例子／氣喘等，未新增藥物或疾病。A2及文末排除内容優先，不寫國考延伸機轉。
- 下一步：Claude複驗後，教師看畫面；核可後才能materials:build、Excel第229列起77題、登錄、commit。Q3/Q4仍不上平台。
