# 五份資訊圖表登錄與題庫補登（2026-10-02）

分支：`codex/blood-vessel-infographic`。教師核可五份畫面後完成正式建置與登錄，已 commit、待部署；提交識別見本分支 `git log -1`。版本維持 1.6.1，未 push、合併、部署或上傳題庫到平台。

## 交回 Claude 驗收的檔案

| HTML title／單元＝次單元 | 公開 HTML | 新增 Excel 實體列（不含標題列） |
|---|---|---|
| 血管構造解析 | `public/materials/blood-vessels-v1/index.html` | 108–118 |
| 循環路線 | `public/materials/circulation-routes-v1/index.html` | 119–129 |
| 血壓的調控 | `public/materials/blood-pressure-regulation-v1/index.html` | 130–140 |
| 淋巴系統 | `public/materials/lymphatic-system-v1/index.html` | 141–151 |
| 血液動力學 | `public/materials/hemodynamics-v1/index.html` | 152–162 |

每份 6 節點、6 先備＋5 情境，共 30 節點／55 題。先備題序 1–6、情境 7–11。`shared/materials.ts` 五筆分母皆為 nodeTotal=6、questionTotal=11；`public/materials/README.md` 同步。`material-ids`、HTML mount payload 與 `materials-src/<slug>/content.json` 的 85 個固定 ID 完全一致，無跨教材重複。公開檔皆內嵌目前 `materials-src/kit/kit.js`。

實際執行五份 `npm run materials:build <slug>`，沒有手改公開 HTML。原已核可的 content／35 張 SVG／kit 修正及來源快照一併 commit。五份原始 RTF 快照以限定路徑的 `.gitattributes` binary 規則保存，防止 Git 換行正規化改動原稿；原文件內容與尾端空白不重寫。工作樹沒有 `public/materials/coagulation-v1/`，未建立、複製或更動該資料夾；主工作目錄的既有資料不在本輪範圍。

## 題庫安全比對

檔案：`html/資訊圖表題庫_上傳用.xlsx`。只在既有 106 題（Excel 第 2–107 列）之後加入第 108–162 列，合計 161 題。原有工作表名稱、順序、欄寬、凍結窗格、驗證、格式與其他 ZIP 元件原封保留。

- 原 106 題 × 24 欄＝**2,544 格，逐格差異 0**；含標題列的原 107 列 XML 原文完全一致。不是僅比對題目 ID。
- **新增 55 題 ID／題幹／四選項內容／正解，與建置後 HTML 全部一致**。HTML 每次顯示會洗牌，Excel 也打散，所以比較選項集合與正確選項文字，不要求兩者固定順序相同。
- 全表 ID 161 個、重複 0。新 55 題選項順序全部異於 HTML 初始陣列；正解位置 A=14、B=13、C=14、D=14，代碼與 Zuvio 序號逐題換算。
- 課程代碼空白、啟用文字 TRUE、單選、四選一；解析與①～④完整，⑤／圖片網址／補救資源留空。V 欄講義標題取 HTML title，W 欄為指定 GitHub Pages 教材網址。
- 「說明」原 A1:B23 只有 **B23：106 題→161 題**；A24:B28 尾端增列五個來源。原說明即使有歷史描述也未順手改寫。
- 保護方式：Artifact Tool 匯入、複製既有列格式、寫入新列並重算與匯出；僅將新列移入原始 OOXML，避免完整重存會正規化舊列。所有原非 worksheet ZIP 元件逐位元相同。新列沿用 Arial 11pt、既有樣式與欄寬，只對新列換行及調整高度。已重新匯入最終檔案，比對原 106 題與全部 55 題，再渲染檢查。
- 新題、MAP 引導解析、末題解析與新增來源的視覺驗證圖在 `docs/materials-registration/`；原格式的欄寬較窄，新解析以換行呈現，沒有改全表欄寬。

修改前 SHA-256：`2439401da543997d0bfb6b639e808e5e0b7cef19792973078cfb2ef13aeb216b`。
修改後 SHA-256：`18a78f73e40117a111356c8579be30e4d115dd5ca8a5d39e8a37386021eb73f2`。
逐格與 HTML 核對證據：`MATERIALS_REGISTRATION_VERIFY.json`。

Claude 可獨立重跑唯讀驗收：`python3 scripts/materials-question-bank-audit.py HEAD^`。此命令從本輪提交的父 commit 取得原 106 題，逐格／原始 XML 比對現有 Excel，再直接解析五份公開 HTML 核對新增 55 題，不會修改或匯出檔案。

作者工具：`scripts/materials-question-bank.mjs`（需 bundled `@oai/artifact-tool`）；保護／比對：`scripts/materials-question-bank-preserve.py`（標準 ZIP/XML，沒有用其他試算表函式庫編輯）。此輪工具限定使用 **原始 106 題快照**，不供日後任意覆寫新題庫；下一輪仍須重新建立當時快照，只在新尾端增加。

## 登錄後的公開 HTML 實測

Chrome，390×844／1280×844。圖內最小字級為 CSS font-size × SVG 實際寬度 ÷ viewBox 寬度，不是原始 SVG 字級或截圖像素。

| 圖 | 血管 390px | 循環 390px | 血壓 390px | 淋巴 390px | 血液動力學 390px |
|---|---:|---:|---:|---:|---:|
| 主圖（所有情境的最小值） | 13.28 | 13.28 | 14.94 | 14.94 | 14.94 |
| 節點 1 | 14.64 | 14.64 | 16.47 | 16.47 | 16.47 |
| 節點 2 | 14.64 | 14.64 | 16.47 | 16.47 | 16.47 |
| 節點 3 | 14.64 | 14.64 | 16.47 | 16.47 | 16.47 |
| 節點 4 | 14.64 | 14.64 | 16.47 | 16.47 | 16.47 |
| 節點 5 | 14.64 | 14.64 | 16.47 | 16.47 | 16.47 |
| 節點 6 | 14.64 | 14.64 | 16.47 | 16.47 | 16.47 |

1280px：血管／循環主圖與各節點最小均 24px，三份新生理教材均 27px。全部 ≥12px。

- 五份、兩種寬度共 10 條公開 HTML 完整流程：console error=0、pageerror=0、水平溢位=0。
- 6 節點各送一次 explore；重複開關不重送。第一關全對解鎖第二關。
- 第二關刻意答錯：complete=0，重試 disabled；按「前往對應節點複習」後才可重新挑戰。
- 最後一題答對立即 complete=1；不按結果鈕，直接關頁，外部接收紀錄仍為 1。舊兩份自動換題亦不重送。
- 三份新教材另各寬度跑「按結果鈕」與「不按直接關頁」兩種流程共 12 條；結果鈕只呈現結果，不重送 complete。最大字級亦無水平溢位。
- 五份 `materials:shots` 各 20 張，共 100 張全頁截圖；報告含逐文字字級與裁切檢查。截圖存於 `materials-src/<slug>/shots/`，依既有 gitignore 不提交。
- 六份其他 kit 教材完整記憶體回歸（含真正 ECG 模擬與標示元件）通過，沒有重建那些公開檔。

證據：`MATERIALS_REGISTERED_BROWSER_VERIFY.json`（五份公開頁）、`PHYSIOLOGY_MATERIALS_VERIFY.json`（三份兩種結果流程）、`MATERIAL_KIT_REGRESSION_VERIFY.json`（六份相容性）、`CIRCULATION_ROUTE_MINOR_VERIFY.json`（循環主圖幾何）、各 shots/report.json。

事件驗證以本機替身接收 SDK 呼叫，沒有寫入真實學生 Firebase 資料，不代表伺服器端儲存 E2E 驗證或網站已部署。

## 測試與交接

- `npm test`：**111／111 通過**，包含共用 kit 即時通關、固定 ID／120／80 範例、五份 HTML／來源／kit／目錄一致性。
- `npm run build`：version:check、TypeScript、Vite 均通過。版本 1.6.1，1610 模組，沒有建置失敗。
- `git diff --check` 通過。公開 HTML 與 Excel 待 Claude 最後驗收；教師決定後才可部署／匯入題庫，本輪沒有進行。
- 此輪沒有實作 handoff 中另案 1.6.2 學生姓名功能，保留其交辦內容。
