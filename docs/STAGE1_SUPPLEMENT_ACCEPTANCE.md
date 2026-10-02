# 第一階段補齊教材：待 Claude 驗收

2026-10-02，Codex。平台版本 1.6.3；分支 `feature/stage1-supplement`，基底為已完成並提交的節點修正 `f7b97a7`。依 `STAGE1_SUPPLEMENT_SPEC.md` 製作，未 push、未部署。

## 交付

| 材料 | 單元／次單元 | 節點／題目 |
|---|---|---|
| cardiac-output-v1 | 心臟II／心輸出量的調節 | 6／11 |
| blood-pressure-measurement-v1 | 心臟II／血壓測量 | 6／11 |
| capillary-exchange-v1 | 心臟II／微血管物質交換與組織液 | 6／11 |
| major-vessels-v1 | 心臟II／全身主要動脈與靜脈 | 6／11 |
| blood-types-v1 | 血液／血型與輸血 | 6／11 |
| lymphoid-organs-v1 | 淋巴系統／淋巴器官 | 6／11 |
| cardiac-electrical-v1 | 心臟II 活動；既有 Sheet 分類不改 | 9／11 |
| rbc-homeostasis-v1 | 血液活動；既有 Sheet 分類不改 | 6／11 |
| ecg-basics-v1 | 心臟II 活動；既有 Sheet 7 題不改 | 6／11 |

六份 kit 各有 content.json、6 張專屬節點 SVG 與一張主圖；36 節點完整原文、66 題題幹／選項／正解逐項對照規格。答案位置打散；每題 hint、explain、nodeId 齊全。先 preview＋shots，再 build 登錄。主圖包含人體正面血管（圖左為人體右）、抗 A／B／D 玻片與壓脈帶壓力／肱動脈血流對照。

兩份手工草稿只複製到公開路徑並修技術串接，原 html 草稿不變。電性活動附傳導四格 PNG；RBC 附原本依賴的 EPO feedback PNG。原稿及公開版本教學陣列逐項相同，靜態文字除空白外完全相同，11 個題目 ID 各自與既有 Excel 一致。SDK 置頂、載入不送 explore、首次節點探索、nodeTime、answer、hint、complete 正常。答錯先複習才能重試，最後答對立即送 complete 並去重。

ECG 六張節點 SVG 只調字級及導程標籤位置；RBC 小圖放大並將原標籤排在圖下，電性活動 SVG 放大字級。未修改教學文字、題目或既有手工 v2。

## 檢查

- `npm run check`：前端 115／115、Functions 18／18、兩端 build、version:check（1.6.3）全通過。
- 9 份 × 390／1280 共 18 組實際公開 HTML Chrome 測試，188 張截圖。無控制台／頁面錯誤、橫向溢位或圖檔載入失敗；所有節點與各 lab 狀態的 SVG 可見文字達 12px，kit 另檢查圖內文字裁切。
- kit 第 1、4 節點展開頂端在可視範圍；切換只留一個展開，底部收合正常；手工教材各節點既有呈現頂端可見。
- 首次 explore 各一次、nodeTime 有送；第一關通過、答錯被複習 gate 擋住、複習後可重試、最後一題答對即 complete，不須再按下一題。ECG 第一關標示互動也通過。
- 追蹤以替換 SDK 的事件收集器確認呼叫與參數；真實學生登入、Firestore 與 Sheet 同步留待教師上線實測。
- `STAGE1_SPEC_AUDIT.json`：基底題庫前 161 題 3,864 格及 162 列 XML 完全不變；新 66 題與 content.json／公開 HTML／規格一致，總計 227、ID 無重複。說明頁只改合計及末尾來源。未新增電性活動、ECG、RBC 題目。
- 兩份既有手工教學資料核對見 `STAGE1_DRAFTS_SOURCE_AUDIT.json`；互動原始報告為 `STAGE1_KIT_VERIFY.json`、`STAGE1_DRAFTS_VERIFY.json`。截圖位於 [stage1-screenshots](stage1-screenshots/)。

可重跑 `python3 scripts/stage1-audit.py`、`node scripts/stage1-kit-verify.mjs`、`node scripts/stage1-drafts-verify.mjs`。題庫工具使用 bundled Artifact Tool，保存原 XML 的處理在 `stage1-question-bank-preserve.py`。

## 交 Claude／教師確認

教師已決定血管譯名採「頭臂動脈」，內容／圖／規格／題庫已同步；淋巴系統尚未作答，新增次單元不影響既有完成度。水腫用語、萬能捐／受血者仍待教師決定。

RBC 原稿仍有兩處內容疑點，遵照指示保留：第 609 行的錯誤選項「釋放肝素，抑制脾臟吞噬紅血球」；第 699 行 case-q03 的「進行血液檢查」情境。未發現題目 ID 不一致。請 Claude 判斷是否要另案修訂，既有題庫不可直接覆改。

部署後教師：把題庫第 163–228 列貼入 Sheet 後同步；建立「心臟II」單元；依上表建立各單元教材活動與節點／題目分母。淋巴系統必做設定須先確認；血液依規格為選看。電性活動與 ECG 的既有 Sheet 列維持原分類。
