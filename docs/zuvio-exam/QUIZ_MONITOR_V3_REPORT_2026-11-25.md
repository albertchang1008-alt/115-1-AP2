# #73 1.17.1：小考監看 v3＋切出紀錄保留＋點名再開放（Claude 實作，2026-11-25）

## 給驗收者的摘要
- 分支 fix/quiz-monitor-wide（自 48a112d0），worktree .worktrees/quiz-monitor-wide；版號 1.17.1（version:check PASS）。
- 實作者 Claude（教師 16:16 指示直接開工）。依分工驗收不得由 Claude 自判，交 Codex 驗收。
- A 監看頁照樣稿 v3：src/PlatformQuizTeacher.tsx、src/platform-quiz.css。
- C 切出紀錄：functions/src/platformQuiz.ts、src/platformQuizApi.ts、shared/platformQuiz.ts、firestore.rules（events list 上限 80→500）。
- B 點名再開放：functions/src/attendance.ts（新 callable attendanceReopen）、shared/attendance.ts、src/AttendanceAdmin.tsx、src/attendance.css。
- 已跑 PASS：
  - functions 全套 159/159（Mac VM）、tsc -b（Mac VM）。
  - tsx 單元 32/32（含新 summarizeQuizLeaves／CSV）。
  - platform-quiz-browser 57 畫面 0 問題、lifecycle 6 項、1920×1080 54 人不捲動。
  - attendance-ui-check 39 項 0 失敗（雲端 Linux 非 root、系統 Chrome）。
- 未跑（需 Mac／Colima）：
  - vite build（雲端缺 linux rollup）
  - npm run check 全套、readability 17/17
  - quiz:emulator（需 firebase CLI）
  - Colima Ubuntu 全套
- 偏離：firestore.rules 放寬 events list 上限 80→500（仍只限該課教師）。原因：54 人時 80 筆只涵蓋約 40 次離開，「需要注意」會漏算。部署需含 rules。
- 抽查建議：
  1. attendanceReopen 撤銷確認與稽核欄位（action／unconfirmed）
  2. 再開放後 records.reopened 只標在補簽者
  3. quizTeacherGet 在 open 以外回傳 events（6000 上限）
  4. summarizeQuizLeaves 的 awaySince 判定
  5. 監看頁 390 單欄與 1280／1920 版面

## 做了什麼
A. 監看頁 v3（例外導向）
- 標題列：遮名、延長…、結束測驗（保留確認）、關閉監看、重新整理。
- 延長面板：全場或點名字個別延長，＋1／＋3／自訂（1–60 分）。
- 進度列：大倒數（含截止時刻、個別延長最晚）、三段進度條＋三個大數字、小 QR＋放大 QR。放大 QR 為全螢幕大 QR＋倒數，Esc 關閉。
- 需要注意：還沒進入、現在離開畫面（已離開時間）、離開 2 次以上；三組皆空顯示「目前沒有需要處理的人」。
- 作答中：名字膠囊，離開中排最前；已交卷收合、可展開。
- <1024px 改單欄。名字 ≥18px，按鈕 ≥44px（瀏覽器腳本自動檢查）。

C. 切出紀錄
- 根因：資料沒被刪；教師端只在 state=open 時監聽 events，結束後畫面不再載入。
- 修正：quizTeacherGet 在 closing／released 讀回本場全部 events（依時間）；成績頁新增「切出畫面紀錄」表（每人次數、總秒數、各次時間），可下載 CSV。
- 學生仍讀不到 events（規則未放寬讀者）。模擬器腳本補斷言：公布後 events=324、依時間排序；limit 500 可讀、501 拒。

B. 點名再開放
- 範圍：今天、已結束的正式點名；已確認者也可，會撤銷確認。
- 修改紀錄寫 action=reopen、minutes、unconfirmed（原確認時間）、byName。
- 已簽到保留；補簽者記 reopened:true，名冊備註顯示「再開放補簽」。
- 拒絕情況：有進行中點名、試簽、非今天（含補建）、分鐘數不在 1–30 整數。
- 介面：節次頁「再開放 N 分鐘」（預設 3），按下先跳確認（已確認者另加撤銷說明），成功後切回點名投影。修改紀錄表顯示再開放列。
- 通知：通知為差異制（lastNotified）。已寄未到通知者若補簽，重新確認後會出現「更正」草稿，不會重寄未到。是否需要額外提示，請教師決定。

## 驗證輸出（repo 外）
課程平台-驗收證據/2026-11-25/quiz-monitor-wide-1.17.1/：
- functions-tests-vm.log、tsc-vm.log
- cloud/tsx-tests.log、cloud/platform-quiz-browser.log、cloud/browser-summary.json、cloud/attendance-ui-result.json
- 截圖：teacher-crowd-1920／1280／390、teacher-qr-1920、student-390-default、teacher-monitor-390（合成名單）
- grep 自查：新改測試與腳本無 /Users、/private/tmp。

## 部署前（教師）
在本 worktree：firebase deploy --only firestore:rules → deploy.sh（含 Functions attendanceReopen 與 quizTeacherGet）。
