# CODEX_TASK：#70 平台作答小考 1.17.0（2026-11-24，Claude 撰）

執行：Codex（GPT-6.2，reasoning high）。驗證：Claude（讀程式差異與原始證據裁定，不由執行者自判）。
教師 11/24 22:36 改定分工：本件由 Codex 實作、Claude 驗證（取代 11/06「出題系統 Claude 實作」於本件的適用）。

## 目標
依 `docs/zuvio-exam/PLATFORM_QUIZ_PLAN_2026-11-24.md`（v1.1）實作「平台作答小考」，版本 1.17.0。規畫第三節、三之二、七之二、八、九（T1–T8）、QR、即時訊號均為教師定案，語意不得更改；樣稿 https://claude.ai/artifact/9NE5ARcftmueL8HRz5jA5k 為畫面依據（合成資料）。

## 背景（需要時讀）
- 規畫全文與 Codex 審查 `docs/zuvio-exam/PLATFORM_QUIZ_PLAN_CODEX_REVIEW_2026-11-24.md`（審查五點的定案在規畫第八節）。
- 既有：`functions/src/zuvioExams.ts`、`shared/zuvio.ts`、`shared/zuvioExt.ts`、`src/ZuvioExams.tsx`、`functions/src/assessments.ts`（計時與私有正解批改）、`src/leaveTracker.ts`＋`functions/src/answerIntegrity.ts`（離開偵測）、`functions/src/attendance.ts`＋`src/Attendance.tsx`（QR 與 App 內建瀏覽器偵測）、`src/App.tsx` 的 `StudentMoodGate`。
- 重播工具：`~/Documents/ChatGPT/課程平台-私有/ubuntu-replay/` 與 `docs/UBUNTU_REPLAY.md`。

## 前置
1. 教師 11/24 22:38 已核可樣稿，監看頁定用即時監聽（規畫第十一節）。
2. 先完成 #69：跟進含 1.16.0 的 main 為 1.16.1（另見 #69 交棒）。本件以 #69 進 main 後的主線開 worktree `.worktrees/platform-quiz`、分支 `feature/platform-quiz`。

## 必做範圍
1. 考卷層 `answerMode`（zuvio／platform，建立時凍結，冪等含 answerMode）；平台卷拒絕 CSV 匯出／匯入／重匯等 Zuvio 專用 callable。
2. 場次狀態機 prepared→announced→open→closing→released；全班統一截止（openedAt＋base＋全場延長）；個別延長（T7）；同場次補考輪（round、makeupIds、各輪統一截止）；結束與截止自動收卷、批改完成後一次寫入新 gen 的 results／analysis 並自動公布（T4）。
3. 學生端：等候卡（公告後）、小考卡、作答（每人打亂題序；選項沿用保序規則；送出前可改、seq 防舊覆蓋、即時存檔）、交卷確認、交卷後情緒卡（T8，需 zuvioMood；自動收卷者 30 分鐘內補跳一次）、已交卷、公布後回顧（依本人順序）。學生 DTO 不含正解／解析／分數直到 released。
4. 即時訊號：每班 `quizSignals/{courseId}_{classId}`（只含 sittingId、state、截止）；Security Rules 只開給該班已登入名冊學生讀；學生課程首頁 onSnapshot，離開首頁或場次結束即停止；等候卡附「重新檢查」鈕。
5. 教師端（監看頁用 onSnapshot 即時監聽本場摘要與離開事件，只開給授課教師讀，離頁／背景／結束即停止；不輪詢）：入口先選班級再列該班小考（七之二，Zuvio 卷同結構）；開考前頁（限時可改、預估截止、公告、開放、QR、名冊）；監看頁（三欄名單只顯示姓名、遮名預設關、切出畫面列表、全場與個別延長、結束、QR 放大投影）；結果頁單班（平均、中位數、最高最低、百分比 10 段分布、補考、沿用試題分析與考前練習）。
6. QR：深連結 `#/course/<課程>/quiz/<場次>`，不含權杖；沿用點名的 QR 產生與 App 內建瀏覽器提示。
7. 研究 CSV 最後加「補考」欄；舊欄位語意不變；新分布函式另寫並版本化分析快取。
8. 重播工具（repo 外）：Dockerfile 加 JRE（Firestore 模擬器）；in-container.sh 加一步「模擬器測試」，跑本件的壓測腳本；更新 `docs/UBUNTU_REPLAY.md`。

## 限制
- 不 push、不合併 main、不部署、不部署索引或規則、不開正式課旗標、不寫正式學生資料。commit 結尾 [Codex]，不用 --no-verify。
- 學生可見文字符合 `docs/READABILITY_STANDARD.md`（390 寬；題幹≥19、內文與選項≥18px、按鈕≥44px、特大不溢出）；作答只用按鈕。
- 腳本不寫死 /Users、/private/tmp；暫存用 os.tmpdir()／RUNNER_TEMP。
- 報告與證據不放真實考題文字或學生個資；測試一律合成資料。

## 完成標準
1. `npm run check` 全過、0 skipped；version 1.17.0 同步。
2. 模擬器（demo- 專案）測試並附原始輸出：54 人同秒開始與交卷（P95／P99、失敗數、對帳）、延長與結束同時、雙教師雙按、個別延長、同場次補考與舊輪請求被拒、截止自動收卷、即時訊號與監看監聽的權限（學生讀不到他班與教師資料）、關閉監看後零請求（審查第四節 6 情境）、一場實測讀寫次數對照規畫第八節⑤。
3. 瀏覽器自動檢查：學生 8 畫面＋教師 4 頁在 390×844 與 1280×800、預設與特大，可讀性 0 問題；截圖只存證（保存 7 天）。
4. Colima Ubuntu 非 root 重播（含新模擬器步驟）全部 PASS，證據夾附 summary。
5. 報告 `docs/zuvio-exam/PLATFORM_QUIZ_IMPL_REPORT_<日期>.md`，開頭「給 Claude 的摘要」≤15 行：檔案、PASS／FAIL、偏離、做不到或未驗、最多 5 個抽查點。
6. 佇列 #70 改「停-等Claude」，寫週誌、跑 `python3 scripts/check_handoff.py`，回覆末附交棒 prompt。
