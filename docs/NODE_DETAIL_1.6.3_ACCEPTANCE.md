# 1.6.3 知識節點點擊體驗：交 Claude 驗收

- 分支：`hotfix/1.6.3-node-detail`，基底 `790e78f`（正式 main `119db4c`＋handoff）。平台版本 1.6.3；未 push、未部署。
- 規格依 2026-10-02 handoff 交辦；本次明確授權覆寫既有 v1。

## 修改

共用 kit 改為手風琴；開新節點關掉前一個，再點同卡收合。詳細內容插在被點卡所在列後，手機直接接該卡、桌面跨整列；卡片只留標題和摘要，完整圖只在詳細內容顯示。平滑捲動把精簡卡片及詳細內容頂端一起帶入視窗；底部「收合」回到卡片並恢復焦點。選取樣式、aria-expanded／aria-controls 同步。尺寸改變時重排詳細內容，不重送事件。

答錯的「前往對應節點複習」共用 revealNode；已開的節點只捲動，不重啟計時。首次開啟送一次 explore；手風琴關閉、再次點卡、底部收合均送 nodeTime。visibilitychange 前景計時規則保留，最後答對立即 complete 的邏輯保留。

## 建置範圍與不變性

透過 `npm run materials:build <slug>` 重建以下九份 v1：

- 已上線：blood-vessels、circulation-routes、blood-pressure-regulation、lymphatic-system、hemodynamics。
- 尚未發布：heart-structure、cardiac-conduction、cardiac-cycle、ecg-basics。

九份公開 HTML 的 mount 內嵌內容及圖解物件與 790e78f 完全相同（涵蓋節點／題目 ID、題幹、選項、答案、解析及 SVG）。所有其他追蹤中的公開教材 HTML（包括各 v2、coronary-circulation-v1）逐位元相同。`html/資訊圖表題庫_上傳用.xlsx` 逐位元相同；coagulation-v1 未追蹤、未納入。

版本已同步 VERSION、兩端 package／lock、shared/version.ts、apps-script/version.gs、public/version.json 與三份版本文件。

## 檢查

`npm run check` 完整通過：前端 115／115、Functions 18／18、前端及 Functions build、version:check（1.6.3）。

`node scripts/material-node-detail-verify.mjs` 對實際重建 HTML，在本機 Chrome 390×844／1280×844 驗證；SDK 由本機事件收集器替代，不寫入正式學生資料。

驗證項目：

- 節點 1、4 展開時卡片標題和詳細內容頂端在畫面內；詳細內容在該列下方且寬度等於整列。
- 切換只剩一份詳細內容，前一個收起；底部及再次點卡收合正常，aria-expanded 同步。
- 卡片沒有完整圖；詳細內容有一份 SVG。
- 切換／底部收合／再次點卡產生對應 nodeTime；重開不重送 explore，每節點 explore 各一次。
- 第一關包含 ECG 標示題可通過；第二關答錯必須先複習，複習走同一就地展開邏輯，才可重試。
- 最後答對即 complete，顯示結果不重送；無頁面／控制台錯誤、無水平溢位。

18／18 情境通過，共 72 張截圖。

詳細數值：`NODE_DETAIL_1.6.3_VERIFY.json`。截圖：`node-detail-1.6.3-screenshots/`，每份每寬度四張（node-1、node-4 為切換後、collapsed、review）。

## Claude 最後確認

請複核九份 390／1280 截圖與實際點擊，重點為節點 1／4 展開頂端可見、桌面跨列、手機接卡、切換與收合及答錯複習。驗收通過後由教師決定部署。
