# 1.15.10 合併報告：點名開關＋ag2 平台（佇列 #67）

## 給 3.8／Claude 的摘要
- 分支 codex/attendance-feature-toggle（.worktrees/attendance）；驗證對象 merge e23db762，本報告 commit 見佇列／交棒。
- 合併：5259e32e 併 origin/main 5e649242；e23db762 併 codex/platform-ag2-materials ddb98851（含 03c9c90f）。
- 祖先：origin/main、main(75f3b6af)、ddb98851 皆為 HEAD 祖先 PASS。版本衝突取 1.15.10；version:sync／version:check PASS。
- 功能：App.tsx「點名」勾選在；completionBoard.ts 1處＋activityHistory.ts 2處 /-ag\d+$/；materials.ts 4筆 ag2 目錄＋網址；MAX_COURSE_UNITS=120。PASS。
- 測試（Linux arm64、HEAD 乾淨副本 npm ci）：completion-board／material-ag2／course-unit-limit／attendance 20/20 PASS；functions build PASS（67函式）；activity-history 9/9 PASS。
- 未跑：scripts/attendance-ui-check.mjs（Playwright Chromium 下載被網路白名單擋）。該腳本與 App.tsx 自 cc4d49f1 起未被合併改動（Codex 當時 PASS），仍交 3.8 實跑。
- 未跑：全套 npm run check（前端 build、可讀性）交 3.8。
- 路徑 grep：本次合併新增的程式／測試檔無 /Users、/private/tmp。
- 偏離：工作樹 node_modules 是 macOS 版，Linux 殼無法直接跑；改在 /tmp 乾淨副本驗證，未動工作樹 node_modules。
- 抽查建議：①390寬開關點名勾選並保存 ②完成度看板 ag2 版本計入 ③學習紀錄 ag2 版本列出 ④課程單元 >120 被拒 ⑤四筆 ag2 網址指向 ap2-materials。
- 限制遵守：未 push、未併 main、未部署、未開正式課程點名旗標、未登錄活動。

## 細節
- 合併只在 handoff.md／DEVELOPMENT_LOG.md 有版本行衝突，取 1.15.10。
- App.tsx、scripts/attendance-ui-check.mjs、tests/fixtures/attendance-ui.tsx、tests/attendance.test.ts 與 cc4d49f1 完全相同（git diff 無差異）。
- 指令：npx tsx --test tests/completion-board.test.ts tests/material-ag2.test.ts tests/course-unit-limit.test.ts tests/attendance.test.ts；cd functions && npm run build && node --test tests/activity-history.test.cjs。
