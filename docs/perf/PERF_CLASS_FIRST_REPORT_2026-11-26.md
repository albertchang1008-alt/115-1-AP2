# 給 Claude 的摘要

- #75（1.17.3）位於 `.worktrees/perf-class-first` 的 `feature/perf-class-first`，基準 `f23f1932`，變更未提交。11/27 補驗沿用 11/26 的同一 Ubuntu tree，44 個工作樹變更檔內容一致。
- Ubuntu 24.04.5 x86_64、UID 1001。重跑 `06-check-all` 的 `npm test` 為 364 PASS、2 KNOWN（K1 子測試與父測試）、0 新 FAIL。
- K1 僅限 390×844 的 `N02-micro`、`N02-micro-hint`、`N02-micro-wrong` 各 `clip=2 outside=0 text=0`。其他失敗 0。
- 接續 6 項 PASS。Functions 162／162、1.17.3 建置、全量可讀性 17／17 份與 4,864 畫面零問題、點名 46 與小考 57 畫面、重播工作樹乾淨。
- Mac：528／528，點名與小考瀏覽器通過。Emulator 班級入口 5／5 輪，點名 P50／P95 為 4.39／5.53 ms，試務中心為 0.19／0.34 ms。
- 本輪變更只有報告、佇列與週誌。請核對 K1 判定日誌、Ubuntu 各步摘要及 390×844 可讀性證據。#72 獨立處理 K1。

## 量測

Mac 本機，Node 22.23.2，Firestore Emulator 1.22.0，專案 `demo-perf-class-first`。5 輪各使用新建的合成課程，每輪有兩班各 54 人、24 筆已確認點名及 100 份合成考卷。每輪甲班 54 人同時簽到，數字碼與 QR 各半。量測在已部署入口形狀的 `.run()` 到 Firestore Emulator 往返，含後端授權與查詢，不含瀏覽器渲染、真人網路或 Cloud Run 容器啟動。改前與改後各 270 次簽到全部成功。

| 路徑 | 改前 P50／P95（ms） | 改後 P50／P95（ms） |
|---|---:|---:|
| 點名班級列表 | 61.69／132.83 | 2.83／4.83 |
| 進「班級小考」入口 | 18.86／36.89 | 0.05／0.10 |
| 選班後查該班考卷 | 入口一併載入 | 6.64／54.71 |
| 點進平台小考場次 | 12.73／16.64 | 10.41／23.63 |
| 公告給學生 | 32.79／45.79 | 35.33／65.44 |
| 開放作答（含同步快照） | 37.40／58.15 | 41.19／59.58 |
| 開始點名到收到第一組碼 | 33.38／45.42 | 21.52／41.65 |
| 投影更新（54 人已簽到） | 14.36／17.48 | 11.26／11.99 |
| 54 人同時簽到 | 117.10／217.24 | 122.04／219.38 |

改後每輪建立合成場次時已載入課程文件。結構化 log 顯示量測期間點名班級列表、試務中心名稱、開始點名及學生簽到均未再讀課程文件。因此試務中心入口的 0.05／0.10 ms 反映課程快取命中，選班後的 Firestore 查詢另列。每條教師路徑有 5 筆樣本，P95 為最慢一筆。同時簽到的 P50 增加 4.94 ms、P95 增加 2.14 ms，這次 Emulator 量測未見簽到延遲降低。

基準快照情境含 54 人與 20 題，合成課程沒有歷史練習作答。1 秒判斷取整個同步開放呼叫的上界，正式課程較長的歷史與真實冷啟動須另量。結構化 log 的 `coldStart` 表示該 callable 在程序內首次進入 handler，Cloud Run 啟動時間仍由上線後指標確認。

## 實作與待查

- 點名班級入口回傳班級代碼、名稱、測試班旗標及單一 state 的進行中資訊。開始、延長及再開放同步維護 state 摘要。只有節次 ID 的舊 state 可進投影再讀取。班級紀錄入口移入所屬班級的人數、出席率及待通知。
- 試務中心入口取發布班級的代碼、名稱與測試班旗標。選班限定 `classIds array-contains` 與投影欄位，同班報表也走選班查詢。考卷設定頁沿用原查詢。點名通知歷史的舊紀錄仍須讀取課程級資料再判斷歸屬，班級選擇入口不讀取該歷史。
- 共用 callable 包裝器比對布林 `warm: true` 後回 `{ ok: true }`，在函式業務處理、授權與 Firestore 前返回。匿名呼叫涵蓋 121／121 個 callable，回應斷言全過，121 筆結構化 log 的課程、名冊、交易耗時均為 0。頁面以 5 分鐘內不重送為限。
- 開始點名回當前與下一段憑證。投影以絕對切換時刻換碼，另行輪詢人數。現行名冊應到和已簽到用 `count()`。舊名冊保留 email 格式篩選的讀取路徑。
- 點名、小考採 60 秒課程快取和 5 分鐘名冊快取，合併同一鍵的併發讀取。簽到並行發送獨立讀取，保留交易內狀態重驗。學生首頁分頁隱藏時停止點名查詢，回前景立即讀取。
- 學生高併發六支函式在原部署選項上覆寫 `cpu: 1`、`concurrency: 80`、`maxInstances: 20`，沒有指定 `minInstances`。
- 本機 `main` 指向另一條歷史的 `75f3b6af`，工作樹依交辦使用明確指定的 `f23f1932`。原根目錄的 handoff 未編輯，交付工作樹的 handoff 只由版本同步工具更新版號。佇列與週誌維護於原根目錄。

## 測試班標示補驗

- 依 Claude 第二次覆核，`attendanceClassCards`、`zuvioClassDirectory` 的班級列包含 `classId`、`name`、`test`。測試班沿用 `isTestClass()` 判定並排在正式班後。前端在卡片名稱後顯示「（測試班）」。未設定名稱時顯示班級代碼。
- `scripts/attendance-ui-check.mjs:151` 保留。點名與小考的合成 fixture 提供新欄位。小考瀏覽器另外比對班級卡的名稱和順序。
- `node scripts/perf-class-first-emulator.mjs after --classes-only` 只補量兩個班級入口。五輪都驗證三個欄位、設定名稱、代碼回落與測試班排序。既有完整量測表保留作改前改後對照。

| 本輪重跑項目 | 結果 |
|---|---|
| `npm --prefix functions run build`、`npm --prefix functions test` | PASS，162／162 |
| Mac `npm run check` | PASS，366／366 前端及瀏覽器測試，162／162 Functions。建置通過。17／17 份教材共 4,864 畫面，0 問題，0 跳過。 |
| Mac 點名瀏覽器 | PASS，46 個畫面、9 項走查，0 失敗、0 頁面錯誤。原第 151 行及其後建立點名、首碼直接顯示、提前結束等流程皆通過。 |
| Mac 小考瀏覽器 | PASS，57 個畫面、6 項生命週期記錄，0 問題。班級卡測試通過。 |
| 班級入口 Emulator | PASS，5／5 輪。點名班級列表 P50／P95 為 4.39／5.53 ms，試務中心班級目錄為 0.19／0.34 ms。 |
| 腳本可攜性與 diff | PASS。以 `rg` 查本輪測試及驗證腳本，無寫死 `/Users/` 或 `/private/tmp`。 `git diff --check` 通過。 |
| Ubuntu 非 root（11/26 初跑） | KNOWN K1。環境、解包、tree、安裝及系統 Chrome 7 個步驟均過。原執行在 `npm test` 停下，364／366 通過，兩筆 K1 為同一酸鹼子測試及其父測試。 |

- [獨立 Functions 測試](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-functions.log)
- [Mac npm run check](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-mac-check.log)
- [Mac 教材可讀性摘要](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-mac-readability-summary.json)
- [Mac 點名瀏覽器](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-mac-attendance.log)
- [Mac 小考瀏覽器](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-mac-quiz.log)
- [班級入口 Emulator](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-emulator.log)

### Ubuntu 初跑停點（11/26）

Ubuntu 24.04.5 LTS x86_64，UID 1001（runner），Node 22.23.5，系統 Chrome 158.0.8127.88。本機工作樹以獨立快照重播，核對 tree `568f56fd914d814b0d1db21395e1489f911fa657` 一致，原分支維持未提交。測試採專案 Ubuntu 重播步驟，於第一個失敗步驟結束。

`tests/material-urinary-events.test.ts:28` 要求酸鹼教材失敗畫面數為 0，實際為 3。390×844 的 `N02-micro`、`N02-micro-hint`、`N02-micro-wrong` 各記錄 `clip=2 outside=0 text=0`。這組症狀與根目錄 `docs/KNOWN_BASELINE_FAILURES.md` 的 K1 一致，相關教材及測試檔與 `f23f1932` 相同。本輪依交辦遇 FAIL 即停，未另外重播基準提交。Ubuntu build、獨立 Functions、全量可讀性及瀏覽器後續步驟未啟動。Colima 已停止。

- [Ubuntu 重播摘要](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-ubuntu/summary.txt)
- [Ubuntu 三個畫面原始失敗](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-ubuntu/06-check-all.log:2637)
- [Ubuntu 非 root 和環境](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-ubuntu/00-env.log)
- [Ubuntu 快照差異](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-ubuntu-prep/replay-source.patch)
- [Mac 小考 390 預設截圖](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-mac-quiz/student-390-default.png)
- [Mac 小考 390 特大截圖](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/test-class-mac-quiz/student-390-xlarge.png)

本輪截圖與證據保存至 2026-12-03。

## 前一輪驗收證據與停點

| 項目 | 結果 |
|---|---|
| 改前 Emulator | PASS。最初啟動因沙盒禁止 loopback 改以已授權的指令啟動。合成課程代碼與小寫信箱鍵在基線量測準備階段修正後，完成 5 輪。 |
| 開發階段 TypeScript | PASS。修正共用包裝器泛型及匯入、調整測試 fixture 後，Functions build 和前端 `tsc --noEmit` 通過。 |
| 改後匿名預熱 | PASS。121 個 callable 的匿名回應均比對通過。 |
| 改後 Emulator | PASS。測試透過 SDK `stackToWire()` 序列化各函式選項的副本。6／6 部署設定、5／5 量測輪次、270／270 合成簽到通過。上輪直接比對 SDK 原始 `ResetValue` 的斷言已更正。 |
| Mac `READABILITY_ALL=1 npm run check` | PASS。前端及瀏覽器測試 366／366，版本與建置通過，Functions 162／162。17／17 份教材、4,864 畫面、0 跳過，畫面與靜態檢查合計 0 問題。涵蓋 390×844 預設與特大。 |
| Mac 點名瀏覽器 `node scripts/attendance-ui-check.mjs` | FAIL。學生 36 個畫面、教師 10 個畫面均完成量測，0 個頁面錯誤。獨立走查有 1 項失敗，`class-first` 在第 151 行仍要求最後一張班級卡含「測試班」。合成班級直接顯示 `test`。該走查後續的投影建立中、第一組碼直接顯示、提前結束等步驟未執行。另有投影 20 秒更新 QR 與人數的走查通過。 |
| 小考瀏覽器與 Ubuntu 非 root | 未啟動。依交辦在 Mac 第一項 FAIL 停止。 |
| 交付腳本路徑與 diff 自查 | PASS。`git diff --check` 無輸出。以 `rg -n '/Users/\|/private/tmp'` 查本次修改的測試與驗證腳本，無命中。 |

重播指令先執行 `npm --prefix functions run build`，在本機 demo 專案執行：

```sh
firebase emulators:exec --only firestore --project demo-perf-class-first "node scripts/perf-class-first-emulator.mjs before"
firebase emulators:exec --only firestore --project demo-perf-class-first "node scripts/perf-class-first-emulator.mjs after"
```

- [改前原始 log](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/baseline-3.log)
- [改後 Emulator 補驗與完整量測](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/after-manifest.log)
- [Mac 全套命令與測試摘要](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/mac-check.log:3971)
- [Mac 教材可讀性原始摘要](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/mac-readability-summary.json)
- [Mac 點名瀏覽器單一失敗](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/mac-attendance-ui.log:17)
- [上一輪預熱與斷言失敗](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/after.log:156)

前一輪證據保存至 2026-12-03。本回合沒有 push、合併、部署或正式學生資料寫入。1.18.0 等 #75 驗收。

## Ubuntu 接續補驗（2026-11-27）

Ubuntu 24.04.5 LTS x86_64、UID 1001，Node 22.23.5，系統 Chrome 158.0.8127.88。依 11/26 的保存 patch 重建相同 tree `568f56fd914d814b0d1db21395e1489f911fa657`。本次未更動 #75 程式或酸鹼教材。

`npm run check` 的串接會在 `npm test` 回傳 1 時停止。本輪依裁定將各步依序獨立執行，保留原始 TAP 結束碼。僅在三個指定畫面各 `clip=2 outside=0 text=0`，且 TAP 只有酸鹼子測試及其父測試兩筆失敗時，標為 KNOWN 後接續。判定程式以 11/26 日誌驗證，額外 TAP 失敗與不同裁字數均會拒絕。

| 步驟 | 結果 |
|---|---|
| 重播環境、解包、tree、依賴及系統 Chrome | PASS |
| `06-check-all` 的 `npm test` | **KNOWN K1**。366 筆中 364 PASS、2 KNOWN、0 新 FAIL、0 跳過。 |
| `npm --prefix functions test` | PASS，162／162。 |
| `npm run build` | PASS，版本確認為 1.17.3，TypeScript 與 Vite 建置通過。 |
| `npm run readability:all` | PASS，17／17 份、4,864 個畫面、0 跳過、0 問題，包含 390×844 預設與特大。 |
| `node scripts/attendance-ui-check.mjs` | PASS，46 個畫面、9 項走查、0 失敗、0 頁面錯誤。 |
| `node scripts/platform-quiz-browser.mjs` | PASS，57 個畫面、6 項生命週期記錄、0 問題。 |
| 重播工作樹檢查 | PASS，工作樹乾淨。 |

Ubuntu 重播在 01:38 結束，外層驗收回傳 0。容器已移除，這次啟動的 Colima 已停止。

- [Ubuntu 補驗摘要](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/summary.txt)
- [K1 判定](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/06-k1-classification.log)
- [三個裁字畫面的原始 TAP](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/06-check-all.log:2633)
- [Functions 測試](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/06b-functions.log)
- [建置輸出](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/06c-build.log)
- [全量可讀性摘要](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/readability-summary.json)
- [點名瀏覽器](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/06e-attendance-browser.log)
- [小考瀏覽器](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/06f-quiz-browser.log)
- [390 預設截圖](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/student-390-default.png)
- [390 特大截圖](/Users/HHC/.codex/visualizations/2026/11/26/01a217c5-c214-7133-ad42-3000f5b5ab03/perf-class-first/ubuntu-continue-2026-11-27/student-390-xlarge.png)

本次截圖及證據保存至 2026-12-04。

## Claude 裁定：Ubuntu 停點與 #72 銜接（2026-11-27 00:2x）
- **證據核對**：06-check-all.log 第 2637–2639 行為酸鹼 N02-micro、N02-micro-hint、N02-micro-wrong 各 `clip=2 outside=0 text=0`；not ok 只有酸鹼子測試與其父測試，`pass 364／fail 2`。與 docs/KNOWN_BASELINE_FAILURES.md 的 K1（Ubuntu＋系統 Chrome、Mac 通過）完全相符。#75 未改動酸鹼教材或其樣式。
- **判定**：依 handoff 鐵則 16，K1 標為 KNOWN，不算新失敗、不阻擋 #75，也不在 #75 修。#71 先例相同：Ubuntu 只有 K1，標 KNOWN。這次停在 npm test 是過嚴，但只停不改，沒有違規。
- **補驗範圍**：Ubuntu 非 root 從 06-check-all 的 npm test 之後的步驟接續跑完（Functions 測試、建置、可讀性、點名瀏覽器、小考瀏覽器）。npm test 重跑一次並確認失敗剛好是 K1 的兩筆（同三畫面、同 clip=2），多一筆或症狀不同即停。
- **#72 銜接**：#75 不等 #72。#72（fix/acidbase-390-clip，基準 48a112d0，只動酸鹼 CSS 與重建 HTML）待 Claude 另行覆核。驗收後以 #75 上線後的 main 重新基準，版本排在 1.17.3 之後；合併後刪除 K1 列並記週誌。#71 原寫重基準 1.17.3，版本順延，由教師決定上線順序。
