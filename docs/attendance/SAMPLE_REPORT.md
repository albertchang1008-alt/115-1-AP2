# 課堂點名 #67 第一階段：樣張報告（2026-11-16，Claude Fable）

## 給 Claude 的摘要
- 做了什麼：依規畫 v3 與交辦第 2 節，用合成資料做 8 張總覽截圖；未接任何後端、未改既有檔案（只加 `qrcode-generator` 依賴）。
- 新增檔：`src/AttendanceSample.tsx`、`src/attendance-sample.css`、`tests/fixtures/attendance-sample.tsx`、`scripts/attendance-sample.mjs`、`scripts/attendance-sample/seed.mjs`、本報告；改 `package.json`／`package-lock.json`。
- 分支／worktree：`feature/attendance`（自 origin/main bff2281a）／`.worktrees/attendance`；未 push、未合併、未部署。
- 自動檢查：學生畫面 11 個 × 390×844 × 字級預設與特大＝22 個畫面，字級／行高／點擊高 ≥44／水平溢出／截斷／對比 4.5 全部 PASS（0 項失敗）；頁面錯誤 0；`grep /Users|/private/tmp` 0 筆；新 CSS 的 font-size 52 處全部乘 `--font-scale`。
- **偏離交辦**：交辦寫「合成資料＋Emulator」。本次執行環境（Claude 桌面版的 Linux 工作區）無法下載 Firestore Emulator（storage.googleapis.com 被擋），所以樣張資料是腳本在記憶體內產生的同一份合成資料，**沒有經過 Emulator**。腳本已支援 Emulator：設定 `FIRESTORE_EMULATOR_HOST` 與 `GCLOUD_PROJECT=demo-*` 後會先寫入再讀回（此路徑本次未實跑）。
- 未跑：`npm run check`、既有測試（樣張階段不需要；第二階段照交辦跑）。
- 要看的項目：8 張圖；待教師回覆的 5 題見下方。

## 截圖（repo 外，保存至 2026-11-23）
`課程平台-驗收證據/2026-11-16/attendance/`：`01-投影畫面.png`～`08-通知信樣式.png`；`raw/` 為 22 張 390 寬單頁存證；`result.json` 為自動檢查結果。

重現：`node scripts/attendance-sample.mjs --out <資料夾>`（需先 `npm ci`；`--serve` 可開本機預覽）。

## 樣張裡多放的東西（規畫有寫、交辦第 2 節沒列）
- 樣張 1 上方加「開始點名」設定列與〔試簽〕按鈕。
- 樣張 3 除了三種錯誤，多放「重複簽到」「試簽成功」。
- 樣張 4 多放「輸入錯誤」「錯 5 次鎖住」「簽到完成」。
- 樣張 7 多放累加用明細檔的表頭與 3 列範例。
- 樣張 8 多放更正通知、未確認節次提醒、寄送紀錄。

## 待教師回覆
1. App 內建瀏覽器的〔複製網址〕：QR 裡的憑證 15 秒就過期，貼到 Safari 時多半已失效。樣張的做法是複製「不含憑證的簽到頁網址」，登入後輸入 4 位數字碼。可以嗎？
2. 「出席」能不能在後台改成「曠課」（例如同裝置提醒查證後確定是代簽）？規畫只寫了曠課↔曠課已取消。樣張目前三種狀態都能點。
3. 「非本班」訊息會顯示這一節點名的班級名稱，可以嗎？
4. 導師彙整信的人數寫法：「應到 60 人，出席 52 人，曠課 6 人，曠課已取消 2 人」，沒有用「實到」。可以嗎？
5. 新增前端依賴 `qrcode-generator`（MIT、無其他依賴）用來畫 QR，可以嗎？
