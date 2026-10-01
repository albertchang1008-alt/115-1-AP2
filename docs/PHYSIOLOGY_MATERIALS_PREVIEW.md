# 三份生理教材修正報告（2026-10-01）

最新狀態（2026-10-02）：**已登錄、已 commit、待部署**；教師已核可五份畫面。五份公開 HTML（含新 kit）與增列 55 題的 Excel 待 Claude 驗收，最新證據見 `MATERIALS_REGISTRATION_ACCEPTANCE.md`。未 push／部署。

以下保留 2026-10-01 修正輪的內容與實測紀錄；當時「未登錄／Excel 未改」是歷史狀態，不是目前待辦。
教師已確認三份教材醫學範圍；本輪依交接12項全部修正，原列建議的5–9項亦完成。

## 十二項修正

| 項次 | 完成內容 |
|---|---|
| 1 | 共用kit於最後一題答對時立即呼叫CourseLearning.complete；結果鈕僅顯示結果。以completionSent防止結果鈕與換題回呼重送，重新挑戰會重設本輪旗標。 |
| 2 | 血液動力學主圖數值標籤移至管壁下方；粗管下緣205、標籤基線245，實測bbox留有空隙。 |
| 3 | 血液動力學節點5、6及情境解析移除疾病、聽診、個人診斷的字句，改寫為流線與估算條件。 |
| 4 | 三份JSON與21張SVG全面繁體掃描；修正條件、哪條管、長度、後續等，不僅掃單一字。 |
| 5 | 血壓預測題正解改為「心率下降、小動脈舒張」。 |
| 6 | 學生頁出處不寫NotebookLM，各別列OpenStax章節：血壓20.4、淋巴21.1、血液動力學20.2。 |
| 7 | 各別副標題與重點卡：血壓的神經／RAAS／ADH／ANP，淋巴的回收／兩路回流／防禦，血液動力學的Q／r⁴／v。 |
| 8 | 層流與擾流節點圖補成上下對照：平順流層／中央較快；不規則流線與渦旋。 |
| 9 | 淋巴情境主圖改小型userSpaceOnUse箭頭，終點在靜脈角前留白；下肢路徑沿中線上行再轉入左靜脈角，標明人體左右。 |
| 10 | blood-pressure-regulation-case-5改壓力受器負回饋情境，ID不變、四選一、含hint、nodeId=baroreflex與解析；節點2保留心房反射補充，全部題目不考心房反射。 |
| 11 | 重畫淋巴thoracic、nodes、pump三張：正面兩色引流分區＋左右靜脈角；多條輸入管／門部輸出管；骨骼肌擠壓與瓣葉朝回流方向開啟。origin、right-duct、lymphocytes仍為流程圖。 |
| 12 | 血液動力學節點6文字／SVG／先備第6題統一120／80：PP=40、MAP≈80+40／3≈93mmHg；正解「40、約93mmHg」，其餘三項重新擬定。 |

三份各6節點、6先備、5情境，節點及題目ID集合不變。題目與選項在JSON集中管理，前端仍以Fisher–Yates洗牌。

## 實測數字

Chrome，390×844與1280×844；截圖工具另以1280×800檢查。字級是CSS像素：
**computed font-size × SVG實際寬度 ÷ viewBox寬度**，不是截圖DPR像素或原始屬性值。

| 圖（依節點順序） | 血壓調控390px | 淋巴系統390px | 血液動力學390px |
|---|---:|---:|---:|
| 主圖：所有3情境的最小值 | 14.94 | 14.94 | 14.94 |
| 節點1 | 16.47 | 16.47 | 16.47 |
| 節點2 | 16.47 | 16.47 | 16.47 |
| 節點3 | 16.47 | 16.47 | 16.47 |
| 節點4 | 16.47 | 16.47 | 16.47 |
| 節點5 | 16.47 | 16.47 | 16.47 |
| 節點6 | 16.47 | 16.47 | 16.47 |

1280px三份主圖與全部展開節點最小均27px。所有文字≥12px，無SVG文字裁切；人工看過390px重畫的三張淋巴節點、下肢回流主圖、層流／擾流圖與粗管情境。

- 三份390／1280px：console error=0、pageerror=0、橫向溢位=0；最大字級選項仍無水平溢位。
- 三份各20張全頁截圖，共60張；另存54張主圖／節點局部圖，供直接核對標籤與路線。
- 每份兩種寬度各走「不按結果直接關頁」與「按結果顯示通關」兩條完整流程，共12條。
- 每個流程的6節點各送一次explore；重複開關不重送。
- 第二關答錯：complete=0、重試鈕disabled；按對應節點複習後才enabled。
- 最後一題答對：按結果鈕前complete=1。直接關頁，外部事件接收紀錄仍為1；按結果鈕後仍為1，不重送。
- 最後解析持續顯示；「查看通關結果」只收起解析、顯示通關訊息，不是送事件的前提。

證據：
- `docs/PHYSIOLOGY_MATERIALS_VERIFY.json`：12流程逐狀態與逐節點字級、explore／重試／關頁回報。
- `materials-src/<slug>/shots/report.json`：390／1280截圖、逐文字字級與裁切判斷。
- `shots/*-detail-lab-*.png`、`shots/*-detail-node-*.png`：主圖與節點局部圖。

## 共用kit相容性與前端檢查

- `npm test`：**110／110通過**，新增guided／舊MCQ／題型callback通關回歸，以及固定ID、四選一、換題與MAP範例檢查。
- `npm run build`：版本檢查、TypeScript及Vite建置通過。
- `node scripts/material-kit-regression-verify.mjs`：其他六份教材以目前kit在**記憶體**載入完整流程（heart-structure、cardiac-cycle、cardiac-conduction、ecg-basics、blood-vessels、circulation-routes）；皆6節點各一次探索、6題先備通過、錯題需複習才能重試、最後答對立即complete、換題不重送，無console／頁面錯誤。ECG使用真實模擬器與標示題元件。
- 結果 `docs/MATERIAL_KIT_REGRESSION_VERIFY.json`。沒有重新建置／改寫這六份公開HTML，特別是已驗收血管／循環教材未動。
- `git diff --check`通過；未執行Functions部署或真實學生端Firebase資料寫入。事件測試驗證SDK呼叫與接收，不等同後端儲存端到端驗證。

## 繁體掃描與Excel

`swift -module-cache-path /private/tmp/physiology-swift-cache scripts/physiology-traditional-audit.swift .`
掃描三份JSON與21張SVG（24檔），Hans-Hant未發現待修文字；原始source.rtf保留不改。
「胜肽」是臺灣生化術語，保留原字，避免ICU逐字誤改成勝負的「勝」；教育部[「胜鍵」詞條](https://dict.revised.moe.edu.tw/dictView.jsp?ID=132597&la=1&powerMode=0)亦使用「胜肽鍵」。掃描證據 `docs/PHYSIOLOGY_TRADITIONAL_AUDIT.json`。

使用試算表技能唯讀檢查 `html/資訊圖表題庫_上傳用.xlsx`的「題庫」與「說明」：沒有血液動力學／平均動脈壓／脈壓／MAP／120／90對應題目，本輪沒有可同步的既有題，故**未修改、未重存Excel**。
後續55題補登是交接的另一待辦，須先決定「單元」欄名稱並保留既有106題，本輪不自行增列。

## 保護檔案的SHA-256（開工／收工一致）

| 檔案 | SHA-256 |
|---|---|
| public/materials/blood-vessels-v1/index.html | 3313980de1c02c32f58c0af232933d38d321dcf47ef3672438e38f047d48394b |
| public/materials/circulation-routes-v1/index.html | 2139537ebb08ab8f5d3e9e74920d20479bc1b4113bcebcf11e11c7e55f485f1d |
| html/資訊圖表題庫_上傳用.xlsx | 2439401da543997d0bfb6b639e808e5e0b7cef19792973078cfb2ef13aeb216b |

## 交回驗收

僅修改三份`materials-src/<slug>/content.json`、使用的SVG與共用kit，再執行各slug的`materials:preview`及`materials:shots`；公開HTML均為建置產物。
新增測試與驗證腳本、更新報告／handoff／開發紀錄。2026-10-01 輪未授權登錄；2026-10-02 教師核可後，登錄與題庫補登已另輪完成，發布仍未授權。
