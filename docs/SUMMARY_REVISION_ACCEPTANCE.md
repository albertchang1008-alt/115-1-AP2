# 六點修訂後兩項必修與配色複驗

2026-10-02，Codex；分支 `feature/stage1-supplement`，基底 `39f33b8`，平台版本 1.6.3。待 Claude 複驗，未 push、未部署。

## 草稿註記

- 血型保留核可的「萬能捐血者／萬能受血者」，刪除教師決策註記。
- 微血管交換改為「生成多於回收時組織間液體堆積，稱為水腫。」；主要血管刪除草稿 credits。
- 同步來源 JSON、整理表、規格，重建 kit；ECG 內部參考頁改為「教學設計參考」，避免全面搜尋殘留決策關鍵詞。
- 遞迴讀取 `public/materials`、`materials-src` 全部檔案，`⚠️`、`請教師`、`教師決定`、`待教師` 命中 **0**。

## 26 份整理表

- 共 **157 列**，390／1280 共 **52 組**：按句號、分號分句，正規化標點與空白，比對同列各內容欄的重複句；6 字以上也檢查完整句包含關係。重複 **0**。
- 不再把 clinical／題目解析追加為整理重點；點列內複合句拆開後只保留不同內容，避免 Rh、淋巴器官、血管路徑、血壓測量等重抄。
- ABO 列含 A、B、AB、O 四型的紅血球 A／B 抗原與對應抗體。AB 的「無抗體」明確限定為無抗 A／抗 B。
- 沒有額外事實時桌面用「—」，手機隱藏該空欄，保留關鍵概念。
- 字級 ≥16px、無橫向溢位、無頁面 JS 錯誤；此句子比對能證明文字與包含關係不重複，語意同義仍請 Claude 複核。
- kit render 與手工整理表產生程式均修正；stage1 產生程式保留 ABO 四型表。

## 配色及數學限制

學生版共 **21 份**（排除被 v2 取代的五個 v1）。全部都有固定不同強調色，動靜脈紅藍等醫學語意色保留。

| 教學群組 | 同群最小色相差 |
|---|---:|
| 心臟構造、傳導、週期、冠狀循環 | 90° |
| 心臟II 六教材 | 50° |
| 循環五教材 | 50° |
| 血液五教材 | 60° |
| 淋巴系統、淋巴器官 | 75° |

| 指定比較組 | 色相差 |
|---|---:|
| cardiac-conduction-v2／cardiac-electrical-v1 | 60° |
| circulation-routes-v1／blood-gas-transport-v2 | 30° |
| heart-structure-v2／coronary-circulation-v1 | 90° |

**全體兩兩 ≥25° 無法成立**：21 個色相在 360° 圓周上至少有一對 ≤360÷21≈17.14°，以 25° 間隔最多排 14 個。此次優先滿足同單元與指定跨群組；其餘跨單元低於 25° 的組合全列於機器結果 `palette.crossUnitPairsBelow25`，未宣稱全體達標。色相差也不是知覺色差指標，仍需畫面複核。

## 題庫保留與檢查

- 對 `39f33b8`：15 kit 的 foundation／cases 全物件與 lab.predict 完全相同；節點 ID 集合不變；11 手工教材 `<script>` 全文完全相同（含題目、答案及追蹤）。
- Excel 逐位元不變，SHA-256：`77dd8bb43b2a639698d22632bd72f0b48c4185a2d16b658cb1622f45d8b2e9ea`。
- `python3 scripts/stage1-audit.py` 通過：原 161 題／3864 格不變、新 66 題與 HTML／規格一致、總計 227、重複 ID 0。
- `npm run check` 通過：115 前端測試、前端 build、18 Functions 測試與 build、version:check 1.6.3。
- 可重跑 `node scripts/material-summary-revision-verify.mjs`：52 組視窗、26 表逐列文字、草稿註記、Excel／題目保留與配色檢查；結果 [SUMMARY_REVISION_VERIFY.json](SUMMARY_REVISION_VERIFY.json)。
- 截圖：[血型 390](summary-revision-screenshots/blood-types-v1-390.png)、[微血管交換 390](summary-revision-screenshots/capillary-exchange-v1-390.png)、[主要血管 390](summary-revision-screenshots/major-vessels-v1-390.png)，同目錄另有 1280。

請 Claude 複驗兩項必修、手機表格與配色，確認後再交教師部署。
