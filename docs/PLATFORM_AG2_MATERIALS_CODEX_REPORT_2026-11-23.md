# 給 Claude 的摘要
- 範圍：11/23 14:43 更新；平台 1.15.10，無佇列編號，既有佇列 25 列保留。
- 未驗／限制：本機 Darwin arm64、UID 502；Ubuntu 非 root 尚未實跑，交 Claude 以本報告 bundle 重播；未部署或登錄活動。
- 分支：`codex/platform-ag2-materials`；程式提交 `03c9c90f`；基底 `origin/main` = `5e649242118b1f24371f42806b438a02f7753dc3`（1.15.9）。
- 程式：`shared/completionBoard.ts`、`functions/src/activityHistory.ts` 的三個正規表示式改為 `/-ag\d+$/`，同步註解與錯誤訊息。
- 目錄：`shared/materials.ts` 新增四筆 ag2 與四筆獨立站網址映射；`public/materials/README.md` 已 materials:sync。
- 測試：`tests/completion-board.test.ts`＋`tests/material-ag2.test.ts` 8/8 PASS；後端 `functions/tests/activity-history.test.cjs` 9/9 PASS；MI 隔離 2/2 PASS。
- 版本檔：VERSION、三組 package／lock、shared/version.ts、apps-script/version.gs、public/version.json、三份文件版本行由 version:sync 同步。
- 自動檢查：前端 320/320、後端 131/131 PASS，0 FAIL／skipped；建置與版本 PASS；閱讀規範17/17、4,864畫面、0違規／靜態問題／錯誤、0跳過 PASS；Ubuntu 未驗不列 PASS。
- 偏離：無功能範圍變更；Linux 依 AGENTS 第11條交 Claude；既有 check 會自動多截圖，封存僅取每份390預設／特大各1張，未閱圖；佇列與週誌在根目錄維護。
- 抽查最多5項：①三處 agN 篩選；②後端 callable ag2 與錯誤測試；③四筆分母；④四筆網址及既有網址回歸；⑤版本一致與 Ubuntu 重播。

## 實作與範圍

`recordedMaterial` 與 `backfillVersions` 接受以 `-agN` 結尾的版本；N 為一位以上數字。原本 ag1 紀錄繼續計入，ag2 可顯示看板細目並參與補登版本查詢。補登仍只收 `tracking: interactive`，維持去重、排序與教師權限。

四個已知 ag2 版本才改用獨立站網址。`materialPageUrl` 未改預設 `MATERIALS_BASE_URL`，其餘已知或未知版本沿用原網址；MI 站目錄仍依既有清單篩選。後台既有選擇教材時的自動標題、分母與建議網址流程可直接使用新目錄，沒有修改表單程式。

標題對照本機教案包資料的 title；節點／題數採教師 14:43 指定值。本任務沒有重新驗收外站教材內容、校正圖或題庫，也沒有寫入平台、Firestore、Sheet、卡片或學生資料。

## 活動登錄清單

課程：115-1 AP2；章：**消化系統**。四筆皆為 HTML 互動教材，`tracking=interactive`。本表是待教師核可的登錄清單；尚未 add_activity、發布或勾班。必做、階段與期限由教師決定。

| 教材標題 | 網址 | materialVersion | nodeTotal | questionTotal |
|---|---|---|---:|---:|
| 消化系統總覽與消化管壁 | https://albertchang1008-alt.github.io/ap2-materials/gi-wall-overview/index.html | gi-wall-overview-ag2 | 24 | 39 |
| 口腔、唾液腺與牙齒 | https://albertchang1008-alt.github.io/ap2-materials/oral-cavity/index.html | oral-cavity-ag2 | 21 | 36 |
| 咽、吞嚥與食道 | https://albertchang1008-alt.github.io/ap2-materials/swallowing-esophagus/index.html | swallowing-esophagus-ag2 | 20 | 34 |
| 胃：構造、胃液分泌與排空 | https://albertchang1008-alt.github.io/ap2-materials/stomach/index.html | stomach-ag2 | 32 | 37 |

## 檢查與證據

- 本機 Node 22.23.2；根與 functions 均依 lock 以 `npm ci --offline` 安裝成功。
- `npm run materials:sync`：PASS。README 新增四列；腳本同時輸出既有教材的稽核提醒，不將它們當成本次新增的錯誤或外站內容驗收。
- `npm run check`：前端 320/320、後端 131/131，均 0 FAIL／skipped；Functions build（67 個函式入口）、前端 TypeScript／Vite build PASS；閱讀規範17/17、4,864畫面、0違規／靜態問題／錯誤、0跳過 PASS。
- `npm run version:check`：PASS，1.15.10。
- `git diff --check`：PASS。
- 針對本次修改：前端看板／目錄 8/8 PASS、後端活動歷史 9/9 PASS；另以 `VITE_SITE_ID=mi` 執行 ag2 目錄測試 2/2 PASS，確認 MI 隔離與網址回歸。
- 可攜性自查：`grep -nE '/private/tmp|/Users/|/sessions/|[A-Z]:\\' tests/material-ag2.test.ts tests/completion-board.test.ts functions/tests/activity-history.test.cjs` 無命中（exit 1）；新增測試未使用暫存路徑或 root 權限，也未新增驗證腳本。
- `python3 scripts/check_handoff.py`：在原工作目錄執行，PASS（handoff 2493/4000字、queue 25/25件，週誌與索引合規）；CODEX_QUEUE.md 無本任務列，依交辦不增刪既有列。
- 截圖：本次未改學生畫面、CSS、播放器、外框或圖檔，未額外手動截圖／看圖。既有 `npm run check` 的閱讀腳本會自動產生多張390截圖（上游既有行為，本任務未改腳本）；封存只取每份390預設與特大各1張（一般教材取 complete，酸鹼僅有 opening，取 opening），不逐圖檢視。學生能否看懂外站教材圖上標示仍待教師手機實點，本次未驗。
- 原始輸出與 bundle：repo 外 `課程平台-驗收證據/2026-11-23/platform-ag2-materials/`（與原 repo 同層）。檔名 `platform-ag2-check.log`、`platform-ag2-targeted-front.log`、`platform-ag2-history.log`、`platform-ag2-mi.log`、`platform-ag2-version.log`、`platform-ag2-materials-sync.log`、兩端 ci log、`platform-ag2-handoff.log`、`summary.json`、每份390預設／特大各1張自動截圖（一般 complete，酸鹼 opening），以及 `platform-ag2-materials.bundle`。截圖與原始證據保存至 **2026-11-30**。

## 自修清單

1. 初次 npm 安裝使用空暫存快取後等待網路；已停止該任務程序，改用本機既有快取離線依 lock 安裝兩端，成功且未改依賴。
2. 沙箱內單獨啟動 tsx 遭 IPC `EPERM`；完整檢查以允許本機 IPC／瀏覽器的執行環境重跑，未修改或略過測試。
3. 教材標題以本機 lesson-data title 核對後填入；不使用縮寫標題。
4. 新增 callable 測試初稿把回傳 versions 當數量；既有 API 實際回傳版本陣列，已修正測試預期為 `['stomach-ag2']`，不改正式 API。

## Ubuntu 非 root：Claude 複審待辦

本機沒有 docker、podman、colima、limactl、orb 或已設定的 SSH Linux 主機；未建立雲端工作、未上傳到外部服務。依 AGENTS 第11條，本次將 Ubuntu 實跑留給 Claude，**在該結果 PASS 前，不可視為完成上線前驗收**。

以 bundle 匯入既有 Linux checkout 後切至本分支（或先準備相同基底 clone）。bundle 為相對 `5e649242` 的增量，Linux checkout 必須已有該基底。用 `git bundle verify /path/to/platform-ag2-materials.bundle` 檢查，再 `git fetch /path/to/platform-ag2-materials.bundle refs/heads/codex/platform-ag2-materials:refs/heads/codex/review-platform-ag2-materials`，切到 `codex/review-platform-ag2-materials`；也可另開 worktree。來源 clone 不應混入其他未提交變更。

使用 Ubuntu 一般使用者、Node 22.23.2、Chrome stable／Playwright 所需瀏覽器，先記錄 `cat /etc/os-release`、`id -u`、`node -v`，確認 UID 非 0，再執行：

```sh
npm ci
npm --prefix functions ci
npm run check
npm run version:check
git diff --check
```

本分支沿用既有 `channel: chrome` 測試；只裝 Chromium 不保證足夠，請使用具 Chrome 的既有雲端 Linux 環境。不要為了通過修改既有測試或改測試範圍。版本、測試數與閱讀規範結果須與本報告對照，差異列明。

## 教師部署指令與順序（尚未執行）

先完成 Claude 複審及 Ubuntu 非 root 驗證。部署前確認最新 origin/main；若其他工作已上線，先整合最新版、必要時升號並重跑檢查，不能直接覆蓋。

```sh
zsh -ilc 'source ~/.nvm/nvm.sh && nvm use 22.23.2 >/dev/null && bash "$HOME/Documents/ChatGPT/課程平台1.0/.worktrees/platform-ag2-materials/scripts/deploy.sh"'
```

指令明確使用本任務 worktree 的 deploy.sh；腳本會預檢、確認、npm ci／check、備份分支、部署 Functions，再快轉 push main；教師執行後仍須確認 Actions 綠勾。

依 14:43 範圍修正版本後的順序：推送 ap2-materials（ag2）→ 部署平台 **1.15.10** → 題庫同步（建立／確認消化系統章）→ 登錄四筆活動 → 上傳資訊圖表題庫 → Claude 正式活動手機實點。這是後續順序，並非本任務完成紀錄；題庫與活動寫入仍需教師明確授權。

## 交接與提交

程式提交：`03c9c90f`（`feat: support agN history and D1-D4 ag2 materials in 1.15.10 [Codex]`），20 檔、116 新增／24 刪除。報告另做本機文件提交；最終 HEAD 以 `git log -1` 或 bundle 內分支為準。週誌保存在原根目錄 `docs/devlog/2026-W48.md`，不搬動原工作目錄其他未提交內容。
原根目錄 handoff.md 保持原樣；worktree handoff.md 與 DEVELOPMENT_LOG.md 僅依 version:sync 更新版本行，未改寫原文內容。CODEX_QUEUE.md 保留既有列，無新編號。交 Claude 複審後，由接手者同樣附交棒 prompt。
