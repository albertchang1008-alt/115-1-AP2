# 閱讀規範檢查「未變更就跳過」Claude 審查（2026-11-17）

對象：`perf/readability-incremental`／8cab59e7（自 origin/main bff2281a），worktree `.worktrees/readability-incremental`。
依據：本 worktree 的 `docs/DEPLOY_SPEED_REPORT_2026-11-17.md`、`scripts/lib/readability-cache.mjs`、`scripts/readability-check.mjs`、`scripts/lib/readability-platform.mjs`、`tests/readability-cache.test.ts`、`scripts/readability-cache.json`、`scripts/deploy.sh`。只讀程式，未重跑測試。

## 給 Claude Fable 的摘要
- 判定：**退回，1 項必修（F1）＋2 項建議（S1、S2）**。安全方向的設計正確：任何輸入改變都只會「重量」，不會讓不合格教材通過。
- F1：教材指紋把**被 git 忽略的檔案**也算進去。教師的主程式庫在 7 份呼吸教材的 `materials-src/<代號>/shots/` 有被忽略的截圖資料夾，從主程式庫執行 `deploy.sh` 時，這 7 份會每次都重量，抵銷大部分省下的時間。
- S1：檢查用的是**系統安裝的 Chrome**（`channel: 'chrome'`），而且 Google Fonts 被攔截、改用作業系統字型；兩者都不在指紋裡。建議把環境資訊寫進紀錄檔，環境不同時印提醒（不強制重量）。
- S2：補一支測試，證明 `npm run check` 預設模式不會寫任何檔案。
- 裁定（a）（b）（c）見第三節。
- 修完不必再交 Claude 審，直接交 Antigravity（3.8）實跑（第四節）。

## 一、逐項審查

### 1. 指紋涵蓋範圍（`readability-cache.mjs`）
| 輸入 | 是否涵蓋 | 說明 |
|---|---|---|
| 教材上線檔 `public/materials/<版本>/`、`materials-src/<代號>/` | 是（walk 整個資料夾） | **但包含被 git 忽略的檔案 → F1** |
| 檢查程式與它 import 的模組 | 是 | esbuild 實際解析，含 `readability-platform.mjs`、metrics、各 lib |
| 平台播放器（Player、FontSizePicker 的 import 範圍） | 是 | 與 `readability-platform.mjs` 實際打包的入口相同 |
| `src/style.css` | 是 | 播放頁用 `fs.readFileSync` 內嵌；它的 `@import` 只有 Google Fonts（外部網址，見 S1） |
| `public/materials/` 最上層共用檔 | 是 | 17 份 HTML 對外引用只有 `../course-learning.js`，已涵蓋 |
| react、esbuild、Playwright 等套件 | 是（`package-lock.json`） | |
| 檢查時另外讀到的專案檔 | 是（traceReads，逐檔記內容） | 已記到酸鹼教材讀根目錄交辦檔等；報告已提醒不能任意搬動 |
| 瀏覽器直接讀的檔 | 大致涵蓋 | 呼吸教材用 `file://` 開，瀏覽器直接讀；但只讀自己資料夾與 `../course-learning.js`，都在指紋內。其他教材經 `page.route` 由 Node 端送檔，在 `public/materials/` 之內 |
| **Chrome 版本** | **否** | `chromium.launch({ channel: 'chrome' })` 用系統 Chrome，不是 Playwright 固定的版本 → S1 |
| **字型** | **否** | Google Fonts 被 route 攔截（非 127.0.0.1、非 /materials/ 一律 abort），實際用 Mac／Ubuntu 各自的系統字型，換行與寬度可能不同 → S1 |
| 靜態 CSS 檢查與 allowlist | 不需要 | 每次都跑 |

### 2. 跳過與記錄的條件（`readability-check.mjs`）
- 跳過：共用指紋相同、共用讀取相同、教材指紋相同、教材讀過的每個路徑狀態相同，四者都成立才跳過。**正確。**
- 記錄：只在 `--record` 且整體通過時寫入；只記這次實際量過並通過的教材；共用指紋變了，舊紀錄全部作廢。**正確。**
- 預設 `npm run check`（cache 模式）：只讀紀錄。指紋計算用 esbuild `write:false`；輸出資料夾預設 `RUNNER_TEMP`／`os.tmpdir()`，在程式庫外；tracer 只在 record 模式啟用。**不寫檔，符合 deploy.sh 檢查後工作目錄必須乾淨的要求。**（缺一支測試證明 → S2）
- `--all`／`READABILITY_ALL=1` 全部重量；程式內呼叫預設不用紀錄，既有測試行為不變。**正確。**

### 3. 測試（`tests/readability-cache.test.ts`，5 支）
- 有測到：相同內容同指紋、只改一份只影響那份；共用輸入改變會變、無關檔不影響；四個跳過條件；讀取追蹤依教材分開；紀錄只記通過者、跳過沿用、共用變更作廢、讀寫往返、損毀當作沒有紀錄。
- 沒測到：被 git 忽略的檔案不影響指紋（F1 修完要補）；cache 模式全部跳過時不寫任何檔（S2）。

## 二、必修與建議

### F1（必修）教材指紋只算 git 追蹤或未忽略的檔案
- 現況：`walk()` 列出資料夾內所有檔案（只排除 `.DS_Store`）。教師主程式庫的 `materials-src/{airway-structure,breathing-mechanics,gas-exchange,lung-function,lungs-pleura,o2-co2-transport,respiratory-control}/shots/` 是被 git 忽略的截圖資料夾，會讓這 7 份的指紋和紀錄不同 → 從主程式庫跑 `deploy.sh` 時每次重量這 7 份。
- 這些檔不會部署（GitHub 從 git 建置），瀏覽器檢查也不讀它們。
- 修法：在 git 程式庫內，教材檔案清單改用 `git ls-files -z --cached --others --exclude-standard -- <資料夾>`（追蹤的＋新增但未忽略的），不在 git 內時才退回 `walk()`。新增未提交的檔仍算進去，忽略的不算。
- 補測試：在暫存 git 程式庫建一份教材，加一個被 `.gitignore` 忽略的檔，指紋不變；加一個未追蹤但未忽略的檔，指紋改變。
- 改了指紋算法 → 共用指紋必然改變 → 需重跑 `readability:record` 更新紀錄檔。

### S1（建議）紀錄環境資訊並提醒
- 紀錄檔加 `environment: { platform, chrome: browser.version() }`（record 時寫入）。
- cache 模式下若目前環境不同，印一行「紀錄是在 <環境> 量的，本機為 <環境>；仍沿用紀錄，每週完整檢查會補量」，**不強制重量**（否則 GitHub 永遠不會命中，失去一半效益）。
- 好處：審查與每週檢查失敗時，看得出紀錄是在哪個環境量的。

### S2（建議）補「檢查模式不寫檔」測試
- 用全部命中紀錄的情境（不會開瀏覽器），呼叫 `checkReadability({ cache: true, out: <暫存> })`，斷言程式庫內（含 `scripts/readability-cache.json`）沒有任何檔案被新增或修改。

## 三、裁定

**(a) GitHub 不再獨立重量未變更教材：可接受，但要建立每週完整檢查。**
- 理由：一份教材只要內容、檢查程式、播放器、樣式、套件都沒變，換環境量出不同結果的來源只剩 Chrome 版本與系統字型（S1）。這屬於低頻變動，用每週完整檢查兜住即可，不值得每次部署多花半小時。
- **要建立**報告附錄的 `.github/workflows/readability-full.yml`：`.github` 受保護，需由教師在 Mac 上建立並 commit（或授權 Codex 在 Mac 建立）。注意流程檔裡要安裝**系統 Chrome**（因為檢查用 `channel: 'chrome'`）：`npx playwright install --with-deps chrome`，不是 `chromium`。請 Fable 在修 F1 時一併把附錄改正。
- 每週檢查失敗時，處理方式：在本機 `npm run readability:all` 重現；若是環境差異造成，修教材或樣式，不改門檻。

**(b) 檢查範圍：-ag1 應該納入；-v1 舊版停止檢查，但另開一件做，不放在本分支。**
- 學生打開的是 -ag1（17 份），目前部署前的閱讀規範把關量的卻是沒人用的 -v1，等於花時間量錯對象。
- 但 -ag1 由 Antigravity 以另一套模板重建，現有檢查流程（例如 `walkRespiratory` 讀 `content.lab`、`data-node` 等）不一定能直接走 -ag1，需要逐份確認、可能要改走查腳本，這是獨立工作量。
- 建議：本分支只做快取（範圍不變；有快取後 -v1 的成本幾乎是 0，不急）。另開一件「閱讀規範檢查改量 -ag1、-v1 退出檢查」：版本對照改成設定檔（例如 `scripts/readability-scope.json`），先確認走查能跑完 17 份 -ag1，再移除 -v1。**需教師同意並排佇列（目前 25/25 已滿，要先結案一件）。**
- 在那之前，學生實際使用的 -ag1 仍只有 Antigravity 自己的驗證紀錄，請教師知悉。

**(c) `scripts/readability-cache.json` 進版控：可接受，風險可控。**
- 必須進版控：GitHub 要讀到紀錄才能跳過。
- 風險 1：刻意手改成「假通過」擋不住。對策：Codex 與 Claude 審查時，**紀錄檔有 diff 就要看到同一個 commit 也改了教材或檢查程式**，否則退回；每週完整檢查會抓到。
- 風險 2：兩個分支各自 record，合併時衝突。對策：衝突時不手改，以合併後的內容重跑 `npm run readability:record`。教材依代號排序，衝突範圍小。
- 風險 3：紀錄過期或遺失：只會變慢，不會放行。

## 四、修完後的下一棒
F1 修完、補測試、重跑 `readability:record` 後，直接交 Antigravity（新對話，Gemini 3.8 Flash）在 Mac 的 worktree 實跑，不必再回 Claude。實跑內容見回覆最後的交棒 prompt。最後的 Linux 驗收與部署前檢查，照一般流程。

## 五、後續（2026-11-17 13:52 教師指示：由 Claude 直接修）
F1、S1、S2 已由 Claude 直接修改，未退回 Fable；細節見 `docs/DEPLOY_SPEED_REPORT_2026-11-17.md`「審查修正」一節。下一棒改為 Antigravity（Gemini 3.8 Flash）在 Mac 實跑。
