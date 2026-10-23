# 給 Claude 的摘要
- 教師新圖 G01／G02／G03 接入七個指定關卡；原圖不覆寫，SHA 與原生百分比錨點固定。
- 圖上定位同步延續：先選標籤，再點圖上熱區；過濾 N2 用新圖，壁層可單獨點選。
- 已通過：教材回歸 74/74；content-check 10/10；npm run check 前端163／Functions61，型別、版本及建置通過。
- PASS：十份 SCRIPT_DIFF 缺0多0；八尺寸 6552/6552，FAIL 0；七關雙尺寸作答前／答錯／答對截圖齊全。
- 缺圖：0。腳本／student-plan／題庫 JSON 未修改；未 push、合併、部署、改 Excel／reviewed。
- 偏離：無。密集原始錨點在圖框內捲動，整頁不橫向溢出。
- 抽查最多五項：fluid N1、urine N2／N3／N5、filtration N2。

## 底圖與錨點

[60 關對照表](../FIGURE_MAP.md) · [已結案缺圖清單](../MISSING_FIGURES.md) · [原圖 SHA 與尺寸](IMAGE_PROVENANCE.json)

| 圖 | 尺寸 | SHA-256 |
|---|---|---|
| IMG-filtration-clearance-90.png | 1536×1024 | `bf49822cf3323c6d9945c2752b4b7ae161a8ccebd06cff071341846cf0882cb1` |
| IMG-urine-concentration-90.png | 1086×1448 | `fe6a1df64de121a4bcd8b421c86b2b2f514c30551f9a7570e7c046094cf70bc4` |
| IMG-fluid-compartments-90.png | 1086×1448 | `58965abd57839aac98e6c2134a7b43cb6c706646c482813e80dfc278c0e35853` |

G01 → fluid-compartments N1。水位只疊在原圖輪廓內，輪廓取樣後向內縮；零值不先露60%。遮罩可由 `python3 scripts/trace-body-water-mask.py` 重建，輸入 PNG 的 SHA 必須相符。

G02 → urine-concentration N1／N2／N3／N5／N6。區域字標固定14px；皮髓分界與四階深度刻度疊在原圖上。下降枝出水、上升枝排 NaCl、ADH 集尿管出水各自分關；三條箭頭皆有箭頭尖。NaCl 終點在原圖x=73%，集尿管左緣約77%，不碰集尿管。

G03 → filtration-clearance N2。四個圖上熱區以原圖百分比定位：內皮(38%,45%)、基底膜(43%,45%)、足細胞(54%,45%)、壁層(95%,48%)。壁層獨立可選，但原腳本要求的正解仍僅內皮→基底膜→足細胞；選入壁層會答錯並整步重來。

## 驗證輸出

- [npm run check 完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/output/npm-check.txt)
- [教材74項回歸完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/output/material-tests.txt)
- [新底圖6項測試輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/output/new-figure-tests.txt)
- content-check 原始 JSON 與輸出：[content/](content/)



## 最終逐份結果

[十份試用入口](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/index.html) · [機器可讀結果](SUMMARY.json) · [定位盤點與前後圖](../LABEL_ON_FIGURE.md)

| 教材 | 八尺寸 PASS | SCRIPT_DIFF |
|---|---|---|
| kidney-anatomy | 652/652 | 必見83，缺0多0 |
| nephron-circulation | 675/675 | 必見76，缺0多0 |
| filtration-clearance | 628/628 | 必見78，缺0多0 |
| tubular-handling | 644/644 | 必見80，缺0多0 |
| urine-concentration | 654/654 | 必見87，缺0多0 |
| urinary-route-micturition | 701/701 | 必見80，缺0多0 |
| fluid-compartments | 618/618 | 必見69，缺0多0 |
| water-sodium-regulation | 659/659 | 必見79，缺0多0 |
| electrolyte-balance | 673/673 | 必見75，缺0多0 |
| acid-base-homeostasis | 648/648 | 必見149，缺0多0 |

八尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。逐狀態輸出：[第一組](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/output/eight-size-0.txt)、[第二組](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/output/eight-size-1.txt)、[第三組](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/output/eight-size-2.txt)。

## 新圖指定狀態截圖

- [fluid-compartments：指定關卡雙尺寸作答前／答錯／答對](final/fluid-compartments/NEW_FIGURE_SHOTS.md)
- [urine-concentration：指定關卡雙尺寸作答前／答錯／答對](final/urine-concentration/NEW_FIGURE_SHOTS.md)
- [filtration-clearance：指定關卡雙尺寸作答前／答錯／答對](final/filtration-clearance/NEW_FIGURE_SHOTS.md)

[壁層誤點與整步清空回歸手機圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/wall-regression/390x844-wall-wrong.png) · [密集標籤避碰手機圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/apply9-final/new-figures/wall-regression/390x844-correct-labels.png)。壁層專項在八尺寸均以真實點選重跑，層名不互遮。

## 圖面檢查與範圍

- 結構：三張均為教師新畫、Claude 已審圖通過的原 PNG；未以程式補畫器官。
- 區域：腎元疊固定14px皮質／髓質／越深越濃字標、分界與四階深度刻度；過濾各層錨點見對照表。
- 箭頭：每條獨立完整且有箭頭尖；NaCl止於間質，ADH僅集尿管出水；回歸檢查分關不殘留。
- 圖層：人形原始輪廓內縮遮罩，0／40／60／100%依滑桿更新；原圖位元組與SHA不變。
- 版面：八尺寸字級、邊界與溢出檢查通過；圖上定位圖寬≥80%、熱區≥44px。密集原圖可在圖框內捲動；固定標籤盤與送出鈕。

程式與自動版面證據不冒充另一AI獨立內容審查；原圖核可依本次任務檔。代表畫面已複核，完整狀態見上述截圖索引。

實作基底及共同圖上定位／新底圖提交：`6ea1896f`；本報告及新圖專項全量證據另存本機提交。`source-snapshot.json`記錄收工程式SHA；共同定位另有24步驟八尺寸錨點及72張三態專項圖，見定位報告。

收工：根目錄 #6j 維持停-等教師，備註「新圖已接入、圖上定位完成，請試用」；devlog已寫入2026-W43，check_handoff.py PASS。
