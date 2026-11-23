# 1.15.10 發布驗收：點名開關（#67）＋D1–D4 ag2 平台對接（#5）（Claude，2026-11-24 00:50）

## 給 Claude 的摘要
- **PASS，交教師部署。** 發布候選 `codex/attendance-feature-toggle`：程式提交 e23db762，之後 2804f51c、f44d1669 只加兩份報告（docs/attendance，160 行），無程式變更。
- tree 核對：e23db762 與 Codex 已驗的 a3db8657 皆為 `a848b0fc…`，逐位元相同。
- 環境：雲端 Ubuntu 24.04.5、**非 root（uid 30033）**、Node 22.23.5；程式以 e23db762 tree 的快照提交打包 git bundle（sha256 2a53e00b…），clone 後 tree 相符；根目錄與 functions 都 npm ci。
- `npm run check` 原樣：前端 310/320，10 項全為 `src/style.css` 第 1 行 Google Fonts `@import` 被雲端出網白名單擋下（`page.addStyleTag: Event`），屬環境因素；同 #65 驗收所見。
- 只暫刪該 `@import` 重跑前端：**320/320 PASS、0 skipped**（288s），已還原、工作目錄乾淨。
- 原樣 tree：`npm run build` PASS；後端 **131/131、0 skipped**；Functions 67 入口；閱讀規範 **17/17、4,864 畫面、0 issues／staticIssues／errors、0 跳過**（1,265s，全量重測）。
- `node scripts/attendance-ui-check.mjs` PASS：學生 34＋教師 5 畫面、7 組互動，含「feature-toggle: save on/off, independent navigation, no publish」，0 failures／pageErrors。`npm run version:check`：1.15.10。
- 教材：預覽 136 檔清單雜湊重算 = `9638f392…`，與 3.8 R4、Codex R4 一致（候選端在 .local-review，Claude 依規不讀，採 Codex 逐檔比對）。
- 四筆目錄：`shared/materials.ts` 的 label、nodeTotal、questionTotal、materialVersion 與預覽 `materials.json` 全部一致（24/39、21/36、20/34、32/37）；網址指向 ap2-materials 四個 slug。
- 播放器回執：教材 SDK（course-learning.js，sha256 0cc5ab72… = sdk-version.json）收 `init`、送 `ready`／`learning-events`（protocolVersion 1，帶 materialVersion）、收 `learning-ack`；平台 `Player.tsx` 比對 protocolVersion、sessionId、activityId、materialVersion 後回 ack，協定相符。字級由共用外框 shell.js 接 `display-prefs`（1、1.15、1.3），只放大不縮小。
- 未驗：正式網址（教材站仍空 repo，待首發推送）、教師手機實點、正式資料。

## 發布順序（依 2026-11-23 22:36 決策）
1. 教師部署 1.15.10（一次）：先上點名開關與 ag2 目錄。
2. 教師手機實點 D1–D4 ag2（預覽）。
3. 教材站首發 commit（ap2-materials-site，交 Codex 準備）→ 教師推送 → 確認四個正式網址可開。
4. 才登錄四筆活動到「消化系統」章，勾班。
