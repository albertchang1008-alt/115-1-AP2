# 資料與讀寫設計

## 結構

- courses/{courseId}：teacherIds、classIds、draft、published、dailyReports。
- roster/{email}：姓名、學號、班級、enabled；profiles/{uid} 為登入時建立的 UID 對應。
- classes/{classId}：班級管理教師。
- banks/{course_unit_hash}/chunks/{chunk}：immutable、每片最多 20 題；題庫版本最多 100 題。
- courses/{id}/attempts/{attemptId}：一組作答，mode 區分 quiz、flashcard、review；processed 初始 false。
- courses/{id}/progress/{uid}：個人單元最高分、作答次數及活動參與。
- courses/{id}/reports/{class_unit_version}：各題的 all／quiz／flashcard／review 計數。
- courses/{id}/statStates/{class_uid_unit_version}：首次與最近複習的學生題目狀態，避免重複學生計數。
- courses/{id}/jobs/aggregate：交易序列化及上次增量更新時間。
- courses/{id}/snapshots/{id}/rows/{studentId}：完成度結算；metadata 固定單元與門檻。
- HTML 活動使用 `activity.url` 保存 GitHub Pages HTTPS 入口；教材檔案不寫入 Firebase。
- sync/config：Google Sheet 同步設定（sheetId）；sync/status：同步狀態（rosterHash、lastSyncedAt、syncing 鎖）。

Firestore 客戶端規則全部拒絕；callable 內以 Google token、即時名冊及課程權限驗證。bootstrap 的 profiles 寫入用於教師名冊／UID 對應，非判分。

## 報表定義

首次：依伺服器接收時間與紀錄 ID 的穩定順序，學生對同題版本第一次有效提交。all 模式合併 quiz 與 flashcard 去重；各自模式另外保留首次。

複習：review 不列首次分母；保存每位學生最近一次複習對錯，並累積實際複習次數。沒有複習不當作改善。摘要分子分母直接累計，不平均百分比。

每批最多 20 組，在交易内讀取尚未處理紀錄及其影響的摘要／學生狀態，合併寫入與 processed 標記。交易失敗不部分記帳；同一 job 文件使並行工作重試。原紀錄不允許由客戶端更新或刪除。正常彙整不重讀已處理歷史。

摘要更新時間是資料涵蓋到的接收時間；job.updatedAt 是最後執行完成時間。資料量超過單次 UI 更新上限會提示再次接續。

## 成本不是「一次 API = 一次讀取」

callable 每次需驗證名冊／課程等。題庫首次讀 manifest + chunks；同頁 session 快取命中不再請求題庫。交卷讀防重文件與進度，保存整組及進度；複習只保存整組。彙整讀新紀錄、去重狀態、摘要及 job，並更新 processed；開報表只讀分頁摘要與 job。

完成度看板按名冊分頁（50），對已登入學生取其進度；匯出預設只匯出已載入名單，快照匯出可依分頁取全份快照。大量作答集中於同課程時需量測交易競爭，再決定是否改排程批次或分工作鎖。

## 教材通訊

平台在 iframe load 後傳送 `{type:'init', activityId}`。教材可以回傳：

```js
window.addEventListener('message', event => {
  if (event.source !== parent || event.data.type !== 'init') return;
  const activityId = event.data.activityId;
  // 學生完成互動時呼叫：
  parent.postMessage({type:'completed', activityId, position:1}, '*');
});
```

平台驗證來源 window、activityId 與值；sandbox opaque origin 不能使用 origin 白名單取代來源驗證。progress 最短 15 秒才同步；確認閱讀也可獨立保存。教材事件不更動單元完成度。

YouTube API 僅用於播放器事件，不使用資料 API 金鑰。不逐秒同步，暫停／結束／頁面隱藏時保存位置。頁面強制結束可能遺失最後一次進度，不能把影片看完等同掌握。
