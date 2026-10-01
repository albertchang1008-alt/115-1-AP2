# 血管構造／循環路線第三輪修正（2026-09-30）

- 最新狀態（2026-10-02）：`codex/blood-vessel-infographic` 已登錄、已 commit、待部署；公開 HTML 已帶入新 kit，與題庫新增 55 題一併待 Claude 驗收，見 `MATERIALS_REGISTRATION_ACCEPTANCE.md`。以下為第三輪修正的歷史紀錄。
- 390px Chrome 實測：主圖有效寬 332px／viewBox 400，最小字級 16 × 0.83 = **13.28px**。
- 展開節點圖有效寬 366px／viewBox 400，最小字級 16 × 0.915 = **14.64px**。
- 量測為 CSS 像素（非截圖的 deviceScaleFactor 2 像素）；使用 computed font-size 乘 SVG 實際寬度／viewBox 寬度。
- 截圖工具新增主圖與展開節點最小字級、逐字紀錄及節點圖裁切檢查。

| 教材／圖 | 390px 最小字級 |
|---|---:|
| 血管主圖 | 13.28px |
| 血管節點 01–06（每張） | 14.64px |
| 循環主圖 | 13.28px |
| 循環節點 01–06（每張） | 14.64px |

## 修正內容

1. 14 張 SVG 改為 400 寬、獨立文字屬性，移除手機覆寫與互相污染的通用樣式。主圖與節點圖採直式／減字布局。
2. 血管壁：腔外依序為薄內膜、中膜、外膜，標籤引線各指自己的層。
3. 循環主圖：分開四個心腔，肺靜脈直接接左心房、腔靜脈接右心房；冠狀動脈從升主動脈根部分支至心肌。肝門脈支線以順序圖表達。
4. 動脈：大動脈擴張／回彈與小動脈管腔大小對照。靜脈：兩瓣葉開口向心臟，肌肉與說明分離。胎兒：畫出肺動脈幹、主動脈與連接兩者的動脈導管，出生後名稱分行呈現。

## 驗證與交接

- 前端測試 108/108、前端建置、`git diff --check` 通過。
- 兩份 `materials:preview` 成功；`materials:shots` 各 20 張，390／1280 無錯誤與水平溢位，節點圖文字無裁切。
- 數值原始紀錄：`materials-src/blood-vessels/shots/report.json`、`materials-src/circulation-routes/shots/report.json`。
- 2026-10-01 Claude第三輪驗收通過，附3項主圖小修；Codex已完成下節修訂，待小修複驗及教師複核後才登錄並commit。

## 2026-10-01：驗收附带三項小修完成

1. 肺動脈全部放入同一pulmonary群組，移除未受淡化的獨立起始段；沿右心室左下外緣出流，避開標籤。肺靜脈紅線維持連到左心房側邊，移除原藍線重複覆蓋段。
2. 冠狀動脈標籤改為「冠狀動脈由主動脈根部分布到心肌」，移至心臟下方；路線經心臟右外緣抵達心室外壁，不再斜穿左心房。
3. 房→室箭頭在心房標籤下、心室標籤上；肺動脈與箭頭均不壓到「右心室」文字。

驗證：`materials:preview circulation-routes`、`materials:shots circulation-routes`（20張全頁），加跑 `scripts/circulation-route-verify.mjs`（6張390／1280主圖）。
所有狀態皆無主圖文字裁切；肺動脈有效opacity在肺／體／特殊狀態分別1／0.18／0.18；採樣path幾何與文字bbox，確認右心室、冠狀路線無線字交疊。390px主圖最小13.28px、節點14.64px；108前端測試、建置通過。
證據：`docs/CIRCULATION_ROUTE_MINOR_VERIFY.json`、`materials-src/circulation-routes/shots/*-overview-*.png`。未改節點／題目ID、未登錄／commit／發布。血管主圖三格文字流程版是否接受、五份教材醫學內容／版面核定，仍由教師決定。
