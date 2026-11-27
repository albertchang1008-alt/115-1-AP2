# #75 第 80 行 minInstances 斷言覆核（Claude，2026-11-26）

## 給 Claude 的摘要
- 結論：程式設定正確，是斷言寫錯，交回 Codex 修斷言後補跑。
- 實測（本工作樹 functions/node_modules 的 firebase-functions）：
  - 不論是否覆寫 cpu／concurrency／maxInstances，onCall 的 `__endpoint.minInstances` 都是 `ResetValue` 物件，連只給 region 的函式也一樣。這是 SDK 對「未設定」的表示法。
  - 經 SDK 的 `runtime/manifest.js` `stackToWire()` 序列化成部署清單後，attendanceCheckIn 型態的設定為 `{minInstances:null, cpu:1, concurrency:80, maxInstances:20, availableMemoryMb:512}`。`null` 代表部署時重設為預設值 0，與交辦「不設 minInstances」一致。
- 修法：第 79–80 行改為比對序列化後的清單，以序列化結果為準，不比對 SDK 內部物件。做法擇一：
  1. 用 `stackToWire({ endpoints: { [name]: handlers[name].__endpoint }, specVersion: 'v1alpha1', requiredAPIs: [] })` 後比對 `{ cpu:1, concurrency:80, maxInstances:20, minInstances:null }`；
  2. 斷言 `minInstances instanceof ResetValue`（`require('firebase-functions/v2').RESET_VALUE` 不是同一實例，不可用 `===` 比對）。
- `manifest.js` 未列在套件 exports，須以絕對路徑 require，或改用第 2 種。
- 抽查到的其他點：warm 在授權與 Firestore 之前返回，只回 `{ok:true}`，未見洩漏或寫入。

## 第二次覆核：scripts/attendance-ui-check.mjs:151（Claude，2026-11-26 22:3x）
- 結論：**斷言保留，改實作**。「（測試班）」標示屬於班級身分，不是統計。依 isTestClass(classId) 判斷即可，零讀取，符合「班級層只給名稱」原則。
- 基準 f23f1932 的班級卡顯示 `classLabel(course,[id])` 加上 `c.test ? '（測試班）' : ''`，並由後端排序，測試班排最後。新版只顯示 `c.name`，測試標示與排序都消失，教師可能在測試班誤點正式點名。
- 核可修法：
  1. attendanceClassCards 每班回 `{ classId, name, test: isTestClass(classId) }`，依 test 排序，測試班在後；試務中心 zuvioClassDirectory 同樣處理。
  2. 前端班級卡在名稱後顯示「（測試班）」，名稱仍取課程設定的班級名稱，缺名稱時回落為班級代碼。
  3. emulator 腳本的 expect 加入 test 欄位。不得加回人數、出席率、場次數等統計。
- 重跑範圍：Functions 測試 → Mac npm run check → 點名瀏覽器 → 小考瀏覽器，全過才跑 Ubuntu 非 root；任一 FAIL 即停。改後 Emulator 只需補跑班級入口一項，確認仍在 10 ms 量級。
