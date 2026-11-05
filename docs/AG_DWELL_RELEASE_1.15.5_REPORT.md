# Antigravity 閱讀等待調整上線準備 1.15.5

## 給 Claude 的摘要
- 分支 `release/ag-dwell-2026-11-05`，worktree `.worktrees/ag-dwell-release`。
- 從最新 origin/main 1.15.4（fc65849f）建立，含 #57 與已上線的 #59。
- 只複製 17 份教案包 index.html，版本升 1.15.5 並同步版本檔。
- 複製前 EXACT 17/17，複製後 EXACT 17/17，102/102 段替換均只命中一次。
- 完整 npm run check PASS，前端 294、Functions 105 全過且 0 skipped，可讀性 17/17、4,864 畫面、0 問題。
- 內容及圖檔沿用 Claude 的 MD5 驗收，這次 git diff 確認圖檔、SDK、活動登錄及應用程式碼零變更。
- 偏離原交辦舊基準的原因為 main 已發布 1.15.4，本次在其上升 patch。
- 待教師執行本文 deploy.sh 指令，部署後核對 Pages 1.15.5。
- 請抽查 EXACT 證據、版本檔、完整 check、兩項已知行為及部署分支。

## 驗收來源與檔案核對

Claude 的 `AG_DWELL_ACCEPTANCE_2026-11-05.md` 位於 repo 外 `../課程平台-驗收證據/2026-11-05/ag-dwell/`。報告結論為 PASS。原 17 份內容與全部圖檔 MD5 一致，Ubuntu 非 root 的通用行為測試 17/17 PASS。這次沿用該驗收，以打包差異與完整專案檢查確認可交部署。

基底完整 SHA 為 `fc65849f91cd4e35d32db29d55e8d607a9921f22`。建立工作樹前已 fetch，`main` 與 `origin/main` 的 ancestor 檢查均通過。已核對 Pages #89 success 與正式 version.json=1.15.4。

來源使用根目錄 handoff 指定的 `教案包-2026-11-03/<NN-名稱>/index.html`。以 AST 讀出 patch_engine.py 的六對 src/dst 字串，沒有執行其改寫來源檔案的主程式。每份從基底 Git blob 逐段替換，要求各 src 恰好命中一次，再與來源 bytes 比較。17 份全部通過才複製，複製後再次比較 bytes。

patch_engine.py SHA-256 為 `d3e5174e82f9b0604e757faa9c8d3d31b4061c001bbdd813582476126b3c8e16`。

| 單元 | 發布 slug | 複製前等於基底六段替換 | 複製後等於來源 |
|---|---|---|---|
| 01 | nephron-circulation-ag1 | PASS | PASS |
| 02 | filtration-clearance-ag1 | PASS | PASS |
| 03 | tubular-handling-ag1 | PASS | PASS |
| 04 | urine-concentration-ag1 | PASS | PASS |
| 05 | fluid-compartments-ag1 | PASS | PASS |
| 06 | electrolyte-balance-ag1 | PASS | PASS |
| 07 | water-sodium-regulation-ag1 | PASS | PASS |
| 08 | acid-base-homeostasis-ag1 | PASS | PASS |
| 09 | airway-structure-ag1 | PASS | PASS |
| 10 | lungs-pleura-ag1 | PASS | PASS |
| 11 | breathing-mechanics-ag1 | PASS | PASS |
| 12 | lung-function-ag1 | PASS | PASS |
| 13 | gas-exchange-ag1 | PASS | PASS |
| 14 | o2-co2-transport-ag1 | PASS | PASS |
| 15 | respiratory-control-ag1 | PASS | PASS |
| 16 | kidney-anatomy-ag1 | PASS | PASS |
| 17 | urinary-route-micturition-ag1 | PASS | PASS |

每個 slug 僅變動一個 index.html。新增等待常數為 15 字／秒、最多 6 秒。教學按鈕與圖例看過後不重等，保持既有 SDK 呼叫。content.json、教案.md 與 figures 均未複製。活動 slug 與課程活動設定保持原值。

## 檢查結果

- `npm run version:sync` 與 `npm run version:check` PASS，所有版本欄位為 1.15.5。functions、platform-mcp 的 package 與 lock 僅同步版本字串。handoff 與 DEVELOPMENT_LOG 也僅由既有同步腳本更新版本欄位，工作佇列及週誌維護於原根目錄。
- `git diff --check` PASS。
- `git diff --exit-code HEAD -- src shared/model.ts shared/learning.ts shared/materials.ts public/materials/course-learning.js functions/src public/materials/*-ag1/figures` PASS，無程式碼／SDK／活動登錄／圖檔差異。
- 本次沒有新增或修改測試／驗證腳本。交付前以 grep 核對這類檔案的 diff 清單為空，無新增硬寫個人路徑。
- 完整 `npm run check` exit 0。前端 294/294、Functions 105/105，全數通過、0 skipped。TypeScript／Vite 建置通過。可讀性 17/17，共 4,864 畫面，issues／staticIssues／errors 均為 0。既有 readability:check 覆蓋 v1／尿路 v2 教材，AG 等待行為沿用上述 Claude 驗收及 EXACT 比對。
- 本次沒有圖檔或外框外觀改動，未人工檢視截圖。證據保存至 2026-11-12。

本次原始證據位於 repo 外 `../課程平台-驗收證據/2026-11-05/ag-dwell/release-1.15.5/`，包含 `exact-17.json`、`npm-check.log`、`readability-summary.json`。

## 教師部署與已知行為

Claude 驗收記錄兩項觀察，請教師沿用其判斷。

- 教學按鈕的「看過」保存在記憶體。重新整理或手機切 App 導致重載後，說明會再等一次，上限 6 秒。
- 圖例的「看過」依圖例內容保存於瀏覽器。上線後已看過舊圖例的學生，第一次可能再等一次，上限 6 秒，之後重開可立即關閉。

部署由教師從本工作樹執行，請核對分支 `release/ag-dwell-2026-11-05`。

```sh
zsh -ilc 'source ~/.nvm/nvm.sh && nvm use 22.23.2 >/dev/null && bash ~/Documents/ChatGPT/課程平台1.0/.worktrees/ag-dwell-release/scripts/deploy.sh'
```

腳本會完整檢查、備份並部署 Functions，接著快轉 push main 觸發 Pages。若 main 在本次準備後前進，須先處理其差異並依腳本要求重驗，避免遺失其他發布。部署後由教師／Claude 確認 Actions success 與線上 version.json=1.15.5。
