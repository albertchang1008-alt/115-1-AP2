# #65（合批 #61）Zuvio 出題＋擴充 1.16.0 全套與真實瀏覽器驗收 R2 修正報告（Antigravity 3.8，2026-11-24）

> **【說明】本報告取代前版 [ANTIGRAVITY_ACCEPTANCE_1.16.0_2026-11-24.md](ANTIGRAVITY_ACCEPTANCE_1.16.0_2026-11-24.md)**。修正前版中甲表平均與 SD 數值、情緒卡按鈕數（修正為 5 個）與完整文字標籤、06 檔名（更名為 `06-before-cleanup.png`，存證刪除前狀態）與 06–08 雜湊比對，並同步 A 段新增測試後的前端測試計數（351 PASS）。

## 給 Claude 的摘要
- **PASS（全套驗證與真實瀏覽器全流程全數通過，0 fail / 0 skipped），交 Claude 最終複審。** 分支 `feature/zuvio-exams`，版本 `1.16.0`。
- `npm run check` 全套通過：前端測試 **351/351 PASS**（含清理失敗提示與重試）；Functions 編譯通過 67 個入口；後端測試 **157/157 PASS**；閱讀規範 **17/17 PASS**（4,864 畫面，0 issues / 0 staticIssues / 0 errors）；靜態建置與版本 check PASS。
- `node scripts/attendance-ui-check.mjs` 通過：`pass: true`，39 畫面、0 failures、0 pageErrors。
- 真實瀏覽器（Chromium）全流程實跑 **PASS**（12 張 PNG 與 manifest 相符）：甲表 29 筆平均數 21.1、SD 5.23；情緒卡 5 選項逐一比對；06–08 雜湊互異、按鈕於 07 可見且未被遮擋、08 消失。
- 截圖證據：repo 外 `/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-24/zuvio-1.16.0-r2/`（12 張截圖＋`manifest.json`，保存至 2026-12-01）。
- 偏離與未驗：未啟用正式課 `115-1-AP2` 旗標；未寫正式學生資料；不 push、不合併 main、不部署。等 #67 先上線。
- 抽查 5 項：① 新增的清理失敗提示與重試前端測試（31/31 PASS）；② `manifest.json` 甲表平均 21.1 與 SD 5.23（期望值 21.103/5.226）；③ 情緒卡 5 個完整標籤與 390 寬度按鈕高 82px；④ 06–08 截圖狀態與雜湊；⑤ 全套測試計數（前端 351、後端 157、閱讀規範 17/17）。

## 實跑數據與指令

| 驗證項目 | 執行指令 | 結果 | 詳細數據與狀態 |
|---|---|---|---|
| 前端全套測試 | `npm test`（`tsx --test --test-concurrency=2 tests/*.test.ts`） | **PASS** | 351 passed, 0 failed, 0 skipped（含新增清理失敗提示與重試） |
| 後端函式建置 | `npm --prefix functions run build` | **PASS** | 67 個函式入口載入通過 |
| 後端全套測試 | `npm --prefix functions test`（`node --test tests/*.test.cjs`） | **PASS** | 157 passed, 0 failed, 0 skipped（含 R6 隔離清理定序測試） |
| 前端建置與版本 | `npm run build`（`version:check && tsc -b && vite build`） | **PASS** | 版本 1.16.0 同步通過，Vite 打包通過 |
| 閱讀規範檢查 | `npm run readability:check` | **PASS** | 17/17 份教材通過、4,864 畫面、0 issues、0 staticIssues、0 errors |
| 點名 UI 檢查 | `node scripts/attendance-ui-check.mjs` | **PASS** | 39 畫面、7 項功能檢查通過、0 failures、0 pageErrors |
| 真實瀏覽器全流程 | `node scripts/zuvio-browser-e2e.mjs --out <證據目錄>` | **PASS** | 12 張截圖全部產出、9 大步驟、甲表期望值核對與可讀性通過 |

## 真實瀏覽器實測記錄（Chromium）

測試腳本：`scripts/zuvio-browser-e2e.mjs`、測試夾具：`tests/fixtures/zuvio-browser-fixture.tsx`。  
執行環境：macOS Darwin-arm64、Node.js v26.13.1、Chromium (Playwright)。

### 1. 教師端後台流程（1280×800）
1. **出題 (Make Exam)**：
   - 勾選次單元後依題庫數自動分配比例。
   - 點擊「抽題（7 題）」，預覽產生 7 題（含題幹、4 選項與正解標籤）。
   - 設定考卷名稱「115-1 呼吸與排泄隨堂測驗」，每題 5 分，總分 35 分。
   - 點擊「建立考卷並下載 CSV」，觸發 CSV 下載並切換至考卷分頁。
   - 存證：`01-make-exam.png`。
2. **考卷明細與新增場次**：
   - 開啟建立完成之考卷，明細完整顯示題目、配分與適用班級。
   - 新增場次：「甲班 第1次」，勾選「甲班」，點擊新增。
   - 場次表格列出「甲班 第1次」，初始狀態為「尚未匯入」。
   - 存證：`02-exam-detail-sittings.png`。
3. **匯入示範成績 (Import Results)**：
   - 點擊「匯入成績」開啟匯入面板。
   - 點擊「載入示範成績檔」，即時於瀏覽器完成解析與比對。
   - 預覽結果：「考卷比對通過：7 題全部相符」、「可匯入 29 人。已停用 1 人」（依據合成名冊 T007 為停用狀態）。
   - 點擊「確認匯入」，場次狀態更新為「已匯入 29 人」，顯示「重新匯入」與「刪除成績」按鈕。
   - 存證：`03-import-preview.png`、`04-imported-results.png`。
4. **重新匯入 (Re-import Results)**：
   - 點擊「重新匯入」載入成績，預覽確認按鈕文案自動轉為「確認匯入（取代這一場原有成績）」。
   - 點擊確認取代，成績重新寫入，場次保持有效。
   - 存證：`05-reimport-preview.png`。
5. **刪除成績前存證與執行刪除 (Before Cleanup & Delete Results)**：
   - 場次仍有成績，顯示「重新匯入」與「刪除成績」按鈕。
   - 存證：`06-before-cleanup.png`（記錄刪除前狀態）。
   - 點擊「刪除成績」，確認彈窗提示「刪除這一場的成績？」，確認後成績清空。
6. **清理殘留成績 (Cleanup Residual)**：
   - 刪除後保留 `pendingCleanup: true`，場次操作列出現「清理殘留成績」按鈕，狀態顯示為「尚未匯入」。經 `elementFromPoint` 檢查確認未被任何浮層遮擋。
   - 存證：`07-pending-cleanup.png`。
   - 點擊「清理殘留成績」，API 帶參數 `{ cleanupOnly: true }` 呼叫完成，按鈕自動卸載消失，匯入按鈕恢復可點。
   - 存證：`08-after-cleanup.png`。
7. **試題分析頁 (Report & Item Analysis)**：
   - 切換至「報表」分頁，選取具 29 筆合成成績之場次。
   - **甲表**：畫面顯示平均數 `21.1`、SD `5.23`（與夾具 29 筆期望值平均 `21.103448...`、樣本標準差 `5.225930...` 在四捨五入兩位小數誤差內完全一致），另含 KR-20、SEM、考前練習覆蓋率、分數分布直方圖、次單元答對率長條圖。
   - **乙表**：顯示逐題難度 P、鑑別度 D、點二系列相關 r_pb、高低分組誘答選項人次與異常警示。點擊「試題分析 CSV」正常觸發匯出。
   - 存證：`09-report-item-analysis.png`。
8. **課前情緒分布與關懷名單**：
   - 報表完整呈現「考前情緒分布與成績交叉表」及逐題答對率 × 情緒狀態交叉矩陣。
   - 關懷名單：點擊展開遮碼後可查看學號與姓名。
   - 存證：`10-report-mood-distribution.png`。

### 2. 學生端情緒卡手機可讀性與互動（390×844）
1. **情緒選項完整核對（5 種選項對齊 `shared/zuvioExt.ts`）**：
   - 1: 像快噴發的火山（煩躁、不甘心、覺得題目很刁鑽）
   - 2: 像拉滿的橡皮筋（心跳快、腦袋還在高速運轉、怕粗心）
   - 3: 像沒電的毛毛蟲（腦袋一片空白、無力、想直接放棄）
   - 4: 像順流的小船／跳跳糖（寫得很順、有掌握感、甚至有點興奮）
   - 5: 像隔著一層霧／碎玻璃（說不上來、沒什麼感覺、只是想趕快交卷）
2. **可讀性規範檢查 (docs/READABILITY_STANDARD.md)**：
   - 題幹字級：`21px`（標準要求 ≥ 18px，**PASS**）。
   - 說明文字字級：`18px`（標準要求 ≥ 18px，**PASS**）。
   - 五個心情按鈕最小點擊高度：`82px`（標準要求 ≥ 44px，**PASS**）。
   - 心情按鈕標籤字級：`18px`（標準要求 ≥ 18px，**PASS**）。
   - 水平溢位：`overflow: false`（`scrollWidth <= innerWidth`，**PASS**）。
   - 存證：`11-student-mood-card-initial.png`。
3. **互動與送出**：
   - 點擊第一個選項「像快噴發的火山（煩躁、不甘心、覺得題目很刁鑽）」，呈現選取態。
   - 點擊「送出（送出後不可更改）」，即時轉換為回饋卡。
   - 回饋文字字級 `18px`，顯示對應回饋：「先停三秒深呼吸。刁鑽的題目大家都不容易拿分，先把握自己會的，穩穩拿下基本盤！」，附「回到課程畫面」關閉按鈕。
   - 存證：`12-student-mood-card-feedback.png`。

## 截圖證據清單

證據目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-24/zuvio-1.16.0-r2/`（保存至 2026-12-01）

| 檔名 | 說明 | SHA-256 |
|---|---|---|
| `01-make-exam.png` | 次單元比例與 7 題出題預覽 | `e7e8b36a004a3284ef483d14c4efcafcd05cc2ccaea8fd6385c86915d72a0a5d` |
| `02-exam-detail-sittings.png` | 考卷明細與新增的甲班第 1 次場次 | `2733fa5747a7cd00f005d70ef778f57b0415cf11254fd99e4ef331cd08583fee` |
| `03-import-preview.png` | 示範成績比對通過與匯入預覽 | `f002cecaf2e423a6e491ec75e15f7f7af5094a431aee6476e7a9f0c8813cd5fb` |
| `04-imported-results.png` | 確認匯入後的場次狀態「已匯入 29 人」 | `fa4fd87a7db8a39928979a722e195aed48a4d1d9e2099679b917a4315cc53ce1` |
| `05-reimport-preview.png` | 重新匯入預覽與取代原有成績確認按鈕 | `797d0c39addc408fe248bbeed4c216025f750df7c8acf3ccd559f72178d9af03` |
| `06-before-cleanup.png` | 刪除前，場次仍有成績並可執行刪除 | `451b7631a25f8105ff928dda11ea1c214beb080e318e7b3e6a9b551a6165056f` |
| `07-pending-cleanup.png` | 成績已刪除，清理殘留成績按鈕可見且未被遮擋 | `348f56518425581a3eb25ea29d5f21db4975b4fdd8f8e74c308bed3a7aa0eb1d` |
| `08-after-cleanup.png` | 清理完成，清理按鈕已移除，匯入按鈕未被遮擋 | `5742600c4682108dbb308207eb94607eaba8af24eb5530e3ebc23000d4177277` |
| `09-report-item-analysis.png` | 合成場次甲表平均數 21.1、SD 5.23，以及乙表試題分析 | `73c45a3c1a49585a0d8f1396f0865b2ebeb6e75254f16ffd325138d6db716a4c` |
| `10-report-mood-distribution.png` | 情緒分布交叉表與展開遮碼後的合成關懷名單 | `5826b98c038cd37cdee107124dd7fece2d452b518392ceb589aa46301d02bc1f` |
| `11-student-mood-card-initial.png` | 390px 手機畫面，顯示 5 個共用情緒選項 | `5af085a87c345ce00c15b7e6068b3b43492c6277da50fc342992a3abfe72bf3c` |
| `12-student-mood-card-feedback.png` | 送出「像快噴發的火山」後的對應回饋 | `b56e568a7ee7e61f85bdcecf8f8d0bf361ed0a4822603df303ed6523da91942f` |
| `manifest.json` | 實測數據雜湊、提交 HEAD `a1780472` 與各項 PASS 標記 | 完整結構對齊 |

### 06–08 狀態與雜湊比對
- `06-before-cleanup.png`：`451b7631a25f8105ff928dda11ea1c214beb080e318e7b3e6a9b551a6165056f`（刪除前仍有成績）
- `07-pending-cleanup.png`：`348f56518425581a3eb25ea29d5f21db4975b4fdd8f8e74c308bed3a7aa0eb1d`（待清理殘留）
- `08-after-cleanup.png`：`5742600c4682108dbb308207eb94607eaba8af24eb5530e3ebc23000d4177277`（清理完成）
- 三者雜湊兩兩完全不同，清理按鈕於 07 可見、08 安全移除。

## 腳本可攜性自查（AGENTS.md 規則 11）
- 比對 `scripts/zuvio-browser-e2e.mjs`、`tests/fixtures/zuvio-browser-fixture.tsx` 與 `tests/zuvio-cleanup-ui.test.ts`：
  - `grep -nHE '/Users/|/private/tmp' scripts/zuvio-browser-e2e.mjs tests/fixtures/zuvio-browser-fixture.tsx tests/zuvio-cleanup-ui.test.ts` 為 **0 命中**。
  - 暫存路徑使用 `os.tmpdir()`，外部證據資料夾採 `--out <dir>` 參數動態指定，可在 Ubuntu 非 root 環境執行。
