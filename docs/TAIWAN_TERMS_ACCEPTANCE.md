# 台灣用語與六份預測回饋複驗

2026-10-03，Codex；分支 `feature/stage1-supplement`，基底 `99bca1d`，平台 1.6.3；待 Claude 複驗，未 push／部署。

1. 心搏量：心輸出量 JSON／SVG／整理表（含 SV 定義）、血壓節點與整理表、ECG 元件及參考頁統一；規格及產生脚本同步。
2. 血管教材「大面積網路」已修正。
3. 手工教材提示／aria-label 改「點選」；涵蓋血液氣體運送 v1／v2、傳導 v2、心動週期 v2、冠狀循環 v1、心臟構造 v2、紅血球恆定 v1。
4. 六份預測答對回饋逐字使用 handoff 指定說明，保留 kit 的正誤樣式與「✓ 答對了！」前綴；390／1280 共 12 組實點錯誤／正確選項，文字完全一致、無 JS 錯誤／橫向溢位、字級至少 16px、未增加追蹤事件。截圖在 `docs/taiwan-terms-screenshots/`。
5. 遞迴掃描 public/materials 與 materials-src 全部檔案：43 詞零命中；「扁桃體」前測 2／後測 4 處保留待教師決定。未追蹤且 exclude 的 coagulation-v1 本機提示也有「點擊」，已依這次全面掃描要求換「點選」；仍不納入 commit、未變更教學與題目。

## Excel 精準變更

| 列 | 變動儲存格 |
|---|---|
| 163 | I、K、L、P、Q、R |
| 164 | P、Q |
| 169 | P、Q |

共 **10 格**只將指定舊詞換成心搏量；其他 **5,396 個題庫儲存格**的完整 XML 不變，說明頁與所有其他 ZIP parts 逐位元不變。分頁、題序、樣式、尺寸、篩選／格式等保留。正解代碼與題目 ID 不變。

Artifact Tool 產生新值、匯出後重新匯入核對 10 格；以原工作簿 ZIP 精準替換這 10 格文字，避免全檔重存產生額外變動。已看修改前後儲存格圖，字數縮短、原版型保持。

- [逐格及 ZIP parts 比對](TAIWAN_TERMS_XLSX_VERIFY.json)
- [43 詞掃描、題目保留與預測畫面檢查](TAIWAN_TERMS_VERIFY.json)
- 基底 SHA-256：`77dd8bb43b2a639698d22632bd72f0b48c4185a2d16b658cb1622f45d8b2e9ea`
- 修訂後 SHA-256：`48dca2aa0cbc98c858591aa7489c80baf018fa359fd4ef1d56faa401578fee2e`

## 其他檢查

- npm run check：115 前端測試、18 Functions 測試、前端與 Functions build 全過，version:check 1.6.3。
- 15 kit foundation／cases 完整物件與基底比對，只接受這次指定換詞；節點 ID、題目 ID、正解代碼與預測選項／正解不變。11 手工教材 scripts 完全文字比對不變（正規化指定詞後）。
- stage1-audit：原 161 題／3,864 格不變、新 66 題與 HTML／規格一致、總 227 題、重複 ID 0。
- materials:shots：心輸出量與血壓調控各 20 張、無錯誤／裁切、字級檢查通過；原始機器報告保存在 `TAIWAN_TERMS_CARDIAC_OUTPUT_SHOTS.json`、`TAIWAN_TERMS_BLOOD_PRESSURE_REGULATION_SHOTS.json`。
- `scripts/material-taiwan-terms.py` 保存詞彙與六說明句，來源重產後仍保留教師決策。執行 `node scripts/material-taiwan-verify.mjs` 可重驗掃描與學生端回饋。

下一步交 Claude 複驗 1–5 項。扁桃體／扁桃腺維持待教師決定。
