# 給 Claude 的摘要

- #65（合批 #61）1.16.0 A 段。`f901671e` 收錄未追蹤的 14 份 `EXT_*` 與 11/24 Claude 裁定；同日 Antigravity 原報告已隨 `28a95256` 提交。
- `af28ca63`、`71ad4d19` 修改 `src/ZuvioExams.tsx`、`tests/fixtures/zuvio-browser-fixture.tsx`、`scripts/zuvio-browser-e2e.mjs`，新增 `tests/zuvio-cleanup-ui.test.ts`。
- `npm run check` PASS。前端 351、後端 157、閱讀規範 17/17（4,864 畫面），皆 0 FAIL、0 skipped；版本維持 1.16.0，可攜性 grep 0 命中。
- 本機合成瀏覽器驗證 PASS：甲表 29 筆的平均數 21.1、SD 5.23，五種情緒逐一比對，12 張 PNG 與 manifest 相符。清理失敗提示與重試的前端專項 31/31 PASS。
- 偏離與未驗：06 改存仍有成績的清理前狀態並更名 `06-before-cleanup.png`；另修正既有夾具未使用的 `examId` 型別錯誤。真實 Firestore、Ubuntu 非 root 重播及 test 課程全流程留待後續驗收。
- 抽查：① 新增的清理失敗／重試測試。② `manifest.json` 的 `itemAnalysisStats`。③ `studentMoodOptions` 的五個完整標籤。④ 06–08 截圖的 SHA-256 與對應說明。⑤ 全套測試計數。

## 驗證方式與結果

| 檢查 | 實跑結果 |
|---|---|
| Zuvio 專項前端 | 31 PASS、0 FAIL、0 skipped，包含錯誤提示與重試 |
| `npm run check` 前端 | 351 PASS、0 FAIL、0 skipped |
| `npm run check` 建置 | `version:check` 1.16.0、TypeScript、Vite 均 PASS；Functions 載入 67 入口 |
| `npm run check` 後端 | 157 PASS、0 FAIL、0 skipped |
| `npm run check` 閱讀規範 | 17/17 PASS，4,864 畫面，0 FAIL、0 skipped、0 issues、0 staticIssues、0 errors |
| `node scripts/zuvio-browser-e2e.mjs --out <A 段證據目錄>` | PASS，12 張 PNG 與 manifest 檔名、說明、SHA-256 核對通過 |

- 甲表期望值取自夾具匿名匯出的 29 筆合成原始總分，分別計算平均 `21.103448275862068` 與樣本標準差 `5.2259300442683125`，與實際 DOM 數字比對，容許兩位小數的四捨五入誤差。JSON 同時保存實際值與期望值。
- 情緒卡逐一比對 `shared/zuvioExt.ts` 的選項文字及順序。送出第一個選項後驗證儲存代碼及對應回饋。390×844 預設量測題幹 21px、說明 18px、選項 18px／高 82px、回饋 18px，無水平溢出。既有前端可讀性測試另通過 390×844 預設與特大，涵蓋失敗、重試及回饋。
- 06 存證仍有成績、可點刪除；07 確認刪除後顯示「尚未匯入」與未遮擋的清理按鈕；08 確認清理按鈕已從 DOM 移除、匯入按鈕仍可點。存證前在操作按鈕的九個內部座標用 `elementFromPoint` 檢查，並驗證呼叫參數 `cleanupOnly: true`。
- 清理 API 拒絕時以既有 `notify` 顯示錯誤；按鈕保留供重試。重試成功後重新載入場次，測試確認按鈕消失且無瀏覽器 `pageerror`。
- macOS arm64、非 root、Node 26.13.1 實跑。可攜性自查 `grep -nHE '/Users/|/private/tmp|/var/folders/|/home/HHC/' scripts/zuvio-browser-e2e.mjs tests/fixtures/zuvio-browser-fixture.tsx tests/zuvio-cleanup-ui.test.ts src/ZuvioExams.tsx` 為 0 命中。瀏覽器腳本預設 `os.tmpdir()`，亦接受 `--out`。另用 Node 22.23.2 通過腳本語法與共用情緒定義載入檢查。

## A 段瀏覽器存證

於乾淨的 `71ad4d19` 執行 `node scripts/zuvio-browser-e2e.mjs --out <A 段證據目錄>`。`manifest.json` 由同一個截圖呼叫記錄檔名、說明與 SHA-256；另讀回 12 張 PNG 比對檔名與雜湊，並確認 `summary.pass: true` 與 `worktreeDirty: false`。存證目錄 `課程平台-驗收證據/2026-11-24/zuvio-1.16.0-release-prep-a/`，同目錄 `npm-check.log` 保存全套檢查輸出。截圖保存至 2026-12-01。

| 檔名 | 狀態 | SHA-256 前 12 碼 |
|---|---|---|
| `06-before-cleanup.png` | 刪除前仍有成績 | `f9df6b04658b` |
| `07-pending-cleanup.png` | 刪除後顯示未遮擋的清理按鈕 | `9ab946f9338d` |
| `08-after-cleanup.png` | 清理按鈕已移除，匯入按鈕可點 | `8f42bc936adf` |

截圖為自動存證，版面判定採 DOM 量測與點位檢查。Antigravity 3.8 依交辦 B 段在 `zuvio-1.16.0-r2/` 重跑並更新驗收報告。1.16.0 發布順序維持 #67（1.15.11）先上線。

## 驗證中修正

- 首次瀏覽器驗證遇到匿名 CSV 欄名帶防公式注入前綴。夾具解析時移除欄名前綴，瀏覽器重跑 PASS。
- 首次 `npm run check` 的 351 項前端測試通過後，因基準分支夾具的 `examId` 不屬於 `ActiveMoodPrompt`，建置在 TypeScript `TS2353` 停止。移除夾具的未使用欄位後，`npm run build` 與瀏覽器重跑均 PASS。
