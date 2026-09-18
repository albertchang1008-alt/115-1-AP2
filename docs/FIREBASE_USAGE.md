# Firebase 用量盤點｜1.3.0

本表以程式碼目前的 Callable 實作盤點；讀寫是 Firestore 文件次數，不含 Auth、網路快取與 Cloud Functions 呼叫本身。

| 操作 | 入口 | 讀取 | 寫入 | 最佳化後 |
|---|---|---:|---:|---|
| 學生登入取得課程 | `bootstrap` | 會員、課程各 1（每門課另 1） | 0 | 課程含版本，題庫由本機快取避免重讀 |
| 讀取進度 | `getProgress` | profile/課程/進度約 3 | 0 | 不因 tab 切換呼叫 |
| 開始同版本題庫 | `getBank` | manifest + chunk 數 | 0 | cache 命中 0；首次為 1 + chunk 數 |
| 一般交卷 | `submitAttempt` | profile/課程/manifest/grading/attempt/progress，約 6 | attempt、progress 各 1 | 題數無關；舊題庫 fallback 多 chunk 數讀取 |
| 綜合練習交卷（U 個次單元） | `submitMixedAttempts` | profile/課程 + `U × (manifest + grading + attempt)` + progress，約 `3+3U` | `U` attempts + progress 1 | 單次交易；避免沿用一般入口的 `6U` 讀取與 `2U` 寫入 |
| 互動教材事件 | `saveLearningEvents` | profile/課程/diagnostic + event 去重（每批最多 30） | summary + 每個新 event + 視需要 progress | SDK 每 15 秒批次，快速捲動最多每批 30 |
| YouTube 位置 | `saveActivity` | profile/課程 | progress 1 | 播放器只在位置變化至少 2 秒才寫 |
| 教師讀報表 | `getReports` | report page ≤50 | 0 | 分頁 |
| 建立結算 | `createSnapshot` | 每批名冊 30、每人 profile/進度 | snapshot rows 30 | 依學生數線性 |

## 日用量估算

假設每次作答一次交卷、30% 是綜合練習、每位每日 3／5 次教材閱讀、另有 5 次錯題閃卡（命中 cache、無函式寫入）。最佳化前交卷約 `5 + chunk數` 讀取；以平均 2 chunk 計，改後約 6。

| 情境 | 作答 | 最佳化前讀取 | 最佳化後讀取 | 寫入（約） | 免費額度比例（讀／寫） |
|---|---:|---:|---:|---:|---|
| 日常 | 4,000 | 28,000 | 24,000 | 8,000 + 教材事件 | 48%／40% 前的教材事件 |
| 考前 | 10,000 | 70,000 | 60,000 | 20,000 + 教材事件 | 120%／100% 以上 |
| 最壞 | 20,000 | 140,000 | 120,000 | 40,000 + 教材事件 | 240%／200% 以上 |

最壞情況若一半集中 2 小時，約每分鐘 1,000 次交卷，約 6,000 讀／2,000 寫每分鐘；需留意 Functions 與 Firestore 配額。綜合練習若一次含 U 個單元，開始時未命中快取為各題庫 `U × (1 + chunk數)`；交卷使用單一 `submitMixedAttempts`，每份 grading 一讀、每位進度只寫一次。實作限制為最多 10 個次單元，並將單次練習題數限制為 10／20／30／50。

## 索引與後續建議

`diagnostics.summary` 已加入索引排除，既有文件不需搬移；部署 indexes 後才生效。仍建議教師決定：以學生／課程版本快取 bootstrap、為事件摘要設定保存期限、為考前尖峰啟用配額告警。
