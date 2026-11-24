# #65（合批 #61）Zuvio 出題＋擴充 1.16.0 全套與真實瀏覽器驗收（Antigravity 3.8，2026-11-24）

> **【註：本報告已由修正版 [ANTIGRAVITY_ACCEPTANCE_1.16.0_R2_2026-11-24.md](ANTIGRAVITY_ACCEPTANCE_1.16.0_R2_2026-11-24.md) 取代】**  
> 舊報告中甲表平均數與 SD、情緒選項數（誤植為 4 個，實為 5 個）以及 06 截圖時機與檔名，已於 R2 報告完整依最新 manifest 修正。原始紀錄保留備查。

## 給 Claude 的摘要
- **PASS（全套驗證與真實瀏覽器全流程全數通過，0 fail / 0 skipped），交 Claude 最終複審。** 分支 `feature/zuvio-exams`，版本 `1.16.0`。
- `npm run check` 全套通過：前端測試 **350/350 PASS**（0 fail / 0 skipped）；Functions 編譯通過 67 個函式入口；後端測試 **157/157 PASS**（0 fail / 0 skipped）；閱讀規範實測 **17/17 PASS**（4,864 畫面，0 issues / 0 staticIssues / 0 errors）；靜態建置 `tsc -b && vite build` PASS。
- `node scripts/attendance-ui-check.mjs` 通過：`pass: true`，39 畫面、0 failures、0 pageErrors。
- 真實瀏覽器（Chromium）全流程實跑 **10/10 PASS**：①出題（次單元分配、抽題、下載 CSV）；②建立場次；③匯入示範成績（29人相符、1人已停用未匯入）；④重新匯入（確認取代原成績）；⑤刪除成績；⑥清理殘留成績（點擊清理並驗證 `cleanupOnly: true` 呼叫）；⑦試題分析甲表（KR-20、SEM、平均數、SD、覆蓋率、分數分布）與乙表（難度 P、鑑別度 D、r_pb、誘答分析、CSV 匯出）；⑧情緒分布交叉表、逐題答對率與關懷名單（點擊顯示真實學號/姓名）；⑨學生端情緒卡（390 寬度字級 21px/18px、選項按鈕高 82px、無水平溢出、送出後回饋卡）。
- 截圖證據：存於 repo 外 `/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-24/zuvio-1.16.0/`（共 12 張截圖＋`manifest.json`，保存至 2026-12-01）。
- 偏離與未驗：未啟用正式課程 `115-1-AP2` 的 `zuvioExams`／`zuvioMood` 旗標；未寫入正式學生資料；未 push、未合併 main、未部署。
- 抽查 5 項：① `01-make-exam.png` 抽題 7 題與次單元比例表；② `04-imported-results.png` 場次顯示「已匯入 29 人」；③ `07-pending-cleanup.png` 與 `08-after-cleanup.png` 清理按鈕出現與點擊後消失；④ `09-report-item-analysis.png` 甲表與乙表指標；⑤ `11-student-mood-card-initial.png` 手機 390 寬度情緒卡與按鈕高度。

## 實跑數據與指令

| 驗證項目 | 執行指令 | 結果 | 詳細數據與狀態 |
|---|---|---|---|
| 前端全套測試 | `npm test`（`tsx --test --test-concurrency=2 tests/*.test.ts`） | **PASS** | 350 passed, 0 failed, 0 skipped |
| 後端函式建置 | `npm --prefix functions run build` | **PASS** | 67 個函式入口載入通過 |
| 後端全套測試 | `npm --prefix functions test`（`node --test tests/*.test.cjs`） | **PASS** | 157 passed, 0 failed, 0 skipped（含 R6 隔離清理定序測試） |
| 前端建置與版本 | `npm run build`（`version:check && tsc -b && vite build`） | **PASS** | 版本 1.16.0 同步通過，Vite 打包通過 |
| 閱讀規範檢查 | `npm run readability:check` | **PASS** | 17/17 份教材通過、4,864 畫面、0 issues、0 staticIssues、0 errors |
| 點名 UI 檢查 | `node scripts/attendance-ui-check.mjs` | **PASS** | 39 畫面、7 項功能檢查通過、0 failures、0 pageErrors |
| 真實瀏覽器全流程 | `node scripts/zuvio-browser-e2e.mjs --out <證據路徑>` | **PASS** | 12 張截圖全部產出、9 大步驟與可讀性全部通過 |

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
5. **刪除成績 (Delete Results)**：
   - 點擊「刪除成績」，確認彈窗提示「刪除這一場的成績？」，確認後成績清空。
   - 場次狀態恢復為「尚未匯入」。
   - 存證：`06-deleted-results.png`。
6. **清理殘留成績 (Cleanup Residual)**：
   - 模擬刪除後保留 `pendingCleanup: true`，場次操作列出現「清理殘留成績」按鈕。
   - 存證：`07-pending-cleanup.png`。
   - 點擊「清理殘留成績」，API 帶參數 `{ cleanupOnly: true }` 呼叫完成，按鈕自動卸載消失。
   - 存證：`08-after-cleanup.png`。
7. **試題分析頁 (Report & Item Analysis)**：
   - 切換至「報表」分頁，選取具成績之場次。
   - **甲表**：顯示整卷統計與信度（平均數 62.5、SD 47.87、KR-20、SEM、考前練習覆蓋率、分數分布直方圖、次單元答對率長條圖）。
   - **乙表**：顯示逐題難度 P、鑑別度 D、點二系列相關 r_pb、高低分組誘答選項人次（例如 `a:14(8/6)`）與異常警示。
   - 點擊「試題分析 CSV」按鈕正常觸發匯出。
   - 存證：`09-report-item-analysis.png`。
8. **課前情緒分布與關懷名單**：
   - 報表完整呈現「考前情緒分布與成績交叉表」（微風、平靜、緊張、疲累、挫折之高分門檻百分比與人數）。
   - 逐題答對率 × 情緒狀態交叉矩陣正常渲染。
   - 關懷名單：預設顯示遮碼姓名（例如「示OO」），點擊按鈕可即時切換展開真實姓名與學號。
   - 存證：`10-report-mood-distribution.png`。

### 2. 學生端情緒卡手機可讀性與互動（390×844）
1. **可讀性規範檢查 (docs/READABILITY_STANDARD.md)**：
   - 題幹字級：`21px`（標準要求 ≥ 18px，**PASS**）。
   - 說明文字字級：`18px`（標準要求 ≥ 18px，**PASS**）。
   - 四個心情按鈕最小點擊高度：`82px`（標準要求 ≥ 44px，**PASS**）。
   - 心情按鈕標籤字級：`18px`（標準要求 ≥ 18px，**PASS**）。
   - 水平溢位：`overflow: false`（`scrollWidth <= innerWidth`，**PASS**）。
   - 存證：`11-student-mood-card-initial.png`。
2. **互動與送出**：
   - 點擊「微風：充滿活力、進入心流」，按鈕呈現選取狀態（`is-selected`）。
   - 送出按鈕解除 disabled，點擊「送出（送出後不可更改）」。
   - 送出後即時轉換為回饋卡，顯示對應回饋語：「很棒的節奏！帶著平穩清晰的思緒，專注在當下的每道題目上。」，回饋文字字級 `18px`，附「回到課程畫面」關閉按鈕。
   - 存證：`12-student-mood-card-feedback.png`。

## 截圖證據清單

證據目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-11-24/zuvio-1.16.0/`（保存至 2026-12-01）
- `01-make-exam.png`：出題勾選次單元、比例配置與 7 題預覽
- `02-exam-detail-sittings.png`：考卷明細與新增甲班第 1 次場次
- `03-import-preview.png`：匯入示範成績比對通過與預覽（29人相符、1人停用）
- `04-imported-results.png`：確認匯入後場次顯示已匯入 29 人與操作鈕
- `05-reimport-preview.png`：重新匯入預覽與「確認匯入（取代這一場原有成績）」按鈕
- `06-deleted-results.png`：刪除成績後恢復為尚未匯入
- `07-pending-cleanup.png`：顯示「清理殘留成績」按鈕
- `08-after-cleanup.png`：清理完成後按鈕安全移除
- `09-report-item-analysis.png`：試題分析甲表（信度/統計）與乙表（難度/鑑別度/誘答）
- `10-report-mood-distribution.png`：課前情緒交叉表、逐題矩陣與關懷名單遮碼展開
- `11-student-mood-card-initial.png`：學生端 390 寬度課前情緒卡（字級與 44px 點擊區規範）
- `12-student-mood-card-feedback.png`：學生端送出後正向回饋語卡片
- `manifest.json`：實測數據雜湊、提交 HEAD 與各項 PASS 標記

## 腳本可攜性自查（AGENTS.md 規則 11）
- 比對 `scripts/zuvio-browser-e2e.mjs` 與 `tests/fixtures/zuvio-browser-fixture.tsx`：
  - `grep -nHE '/Users/|/private/tmp' scripts/zuvio-browser-e2e.mjs tests/fixtures/zuvio-browser-fixture.tsx` 得到 **0 命中**。
  - 暫存路徑使用 `os.tmpdir()`，外部證據資料夾採 `--out <dir>` 命令列參數動態指定，可在 Ubuntu 非 root 環境執行。
