# 心臟II 圖像化改版驗收交接

2026-10-03，Codex；`feature/cardiac-output-visuals`，基底 `f0f9028`（feature/stage1-supplement）。平台 1.6.3；未 push、未部署，待 Claude 驗收。

## 完成範圍

- 共用 kit：factor-tree 支援葉與分支 sign、增加／減少、心率過快、鍵盤、aria-live、相關節點及重設；bp-cuff 支援滑桿與每秒約 3 mmHg 自動放氣；extras／misconceptions；widget 模式照常渲染預測題。
- 心輸出量：四狀態容積長條圖、幫浦、彈簧三格、收縮力／後負荷比較、油門／煞車及公式樹。
- 主要動靜脈：六張區域圖、四目的地紅色去程／藍色回程、脈搏點位；節點 6 補畫頭靜脈、貴要靜脈、肘正中靜脈、大隱靜脈，胸前改左頭臂靜脈。所有指示端點落在實際血管，文字標籤無重疊；大隱沿內側上行於腹股溝匯入股靜脈。
- 血壓：放氣滑桿、120／80 壓力波與紫色虛線壓脈帶線、受壓動脈剖面、聲音指示、六張節點圖。
- 微血管：35→18 與 25 的 Starling 圖、59% 交點、濾出／回收色塊、拔河及擴散／管壁／淋巴圖、含負向淋巴分支的公式樹。
- 手工電性教材新增接力賽、房室結紅綠燈、竇房結／心室動作電位／ECG 同軸對齊三圖；保留九節點與十一題。
- 五份皆加純文字互參及誤解框，無跨教材連結；充氧血紅、缺氧血藍、電訊號琥珀、壓力紫、SV 綠，方向附箭頭或文字。

## 逐位元保留

使用者要求題目不改，優先於心輸出量規格中的預測選項換詞。原預測題幹、選項順序、答案與回饋全部保留，包含「相反方向／無法由此模型判斷」。

- 四份 JSON 的 foundation／cases 區塊與 lab.predict 原始 UTF-8 文字逐位元相同；節點 ID 序列相同。建置 HTML 嵌入目前來源完整資料。
- 手工教材 N／A／B 原始陣列、節點 ID 產生函式／追蹤前段／整段兩關作答程式相同；SDK 置頂、載入不送 explore。
- Excel 全檔、心電圖基礎 content／HTML、目錄、其餘公開教材與資產及其他 11 份 kit 來源均逐位元相同。
- [逐位元比對與完整掃描](HEART2_VISUALS_PRESERVATION.json) 保存各區塊 SHA-256 及未改公開檔清單。

## 檢查結果

- npm run check：115 前端／18 Functions 測試全過，前端及 Functions build 通過，version:check＝1.6.3。
- 既有五份公開快照測試改驗目前作答／通關核心及來源／目錄一致性；共用視覺擴充不要求重建其他已發布教材。
- 四份皆跑 materials:preview＋materials:shots；22／22／22／20 張標準截圖，字級／裁切／錯誤檢查通過。僅用 preview，未執行 build 登錄；既有目錄及分母不動。
- 新驗證：5 份 × 390／1280，114 張指定區域截圖；首次 explore 各 6 次（電性 9 次）、nodeTime、答錯須回讀後重試、最後答對即 complete，呈現結果不重送。
- 新元件／預測／補充圖與誤解框不送事件；公式樹「看相關節點」沿用既有閱讀及 explore／nodeTime。所有葉的增加／減少方向均檢查，含淋巴分支 − 的符號相乘。
- 血壓滑桿含 150／120／100／80／70、鍵盤及自動放氣；聲音邊界與三種血流狀態正確。
- 既有 stage1-drafts-verify.mjs 通過，含電性及紅血球；其報告與重產截圖保留於原位置，未修改紅血球教材。
- public/materials 與 materials-src 遞迴掃描：用語清單（含扁桃體）及草稿標記「⚠️／請教師／教師決定／待教師」皆 0。

| 教材 | 390 截圖 | 1280 截圖 | 390 最小圖字 |
|---|---:|---:|---:|
| 心輸出量 | 15 | 15 | 14.94px |
| 主要動靜脈 | 12 | 12 | 14.94px |
| 血壓測量 | 13 | 13 | 14.94px |
| 微血管交換 | 13 | 13 | 14.94px |
| 心臟電性活動 | 4 | 4 | 14.58px |

- [114 張截圖索引](heart2-visuals-screenshots/index.html)
- [完整互動及流程結果](HEART2_VISUALS_VERIFY.json)
- [既有手工流程回歸](STAGE1_DRAFTS_VERIFY.json)

## Claude 驗收入口

1. 依兩份規格看 390／1280 截圖，特別複核節點 6 淺靜脈的解剖位置、Starling 簡化模型及電性圖對齊。
2. node scripts/heart2-visuals-verify.mjs 重驗所有互動／流程／截圖；只驗比對及掃描可加 --preservation-only。
3. 來源重產：python3 scripts/heart2-visuals.py → python3 scripts/heart2-electrical-figures.py → 四份 npm run materials:preview <slug>。
4. 此分支待 Claude 驗收及教師看畫面；不阻擋原 feature/stage1-supplement 的 1.6.3 部署。
