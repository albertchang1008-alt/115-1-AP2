# #65 Zuvio 延伸功能 F1–F9 及續修 R1–R7 修正報告（2026-11-16）

## 給驗證者的摘要
1. 分支與基底：`.worktrees/zuvio-exams`（`feature/zuvio-exams`，基於 `origin/main` `bff2281a` 1.15.8）。
2. 版本偏離處理：實際 `VERSION` 與 `package.json` 維持 `1.15.8`（與原交辦草稿 `1.16.0` 不同）。依 `MOOD_CHECK_PLAN_2026-11-13.md` 第〇之二節及本次交辦「版本號先不改，不自行決定部署順序」，本輪維持 `1.15.8` 不改版號，待教師與 `#63` 協調部署順序時統一指定。
3. 判定：F1–F9 與續修 R1–R7 全數修正完成（保留已通過之 F3、F4、F6、F7、F9），相關單檔測試 17/17 PASS（`tests/zuvio-ext.test.ts` 11/11、`tests/zuvio-mood-ui.test.ts` 2/2、`functions/tests/zuvio-ext.test.cjs` 4/4），`tsc --noEmit` 與 `functions run build`（67 函式）PASS。
4. R1–R2：前端 `Report` 接上 `preExamDetail`（含練過／沒練過鑑別度 `D` 及覆蓋率分布）並開放無成績場次查看，門檻標籤改 `%`；`zuvioCareList` 按各班取歷史不再跨班截斷，`hasPracticed` 不以 `passed` 代替本卷練過，UI 顯示覆蓋率與三型分類。
5. R3–R4：`ensureSittingPrep` 改用游標分頁讀取（預設每頁 2000 筆、每班×單元上限 20000 筆），超量時標記 `incomplete: true` 且 `finalized: false` 不永久定稿；`.zext-err` 調為 18px 並補錯誤→重試→完成態 390 實測。
6. R5–R7：`zuvioUpdateSittingStart`／`zuvioCareList`／`zuvioExportCsv` 改用 `moodTeacher`，`zuvioReport` 與 `ZuvioExams` 在 `zuvioMood=false` 時回退 `#61` 並隱藏擴充 UI；補齊 `P`/`D`/`r_pb` 核定提醒與 `highWrong > highKey` 疑似錯鍵；情緒分布與轉變不依賴已匯入成績。
7. 尚未跑全套 `npm run check`（交由第 3 棒 Gemini 3.8 Flash 另開新對話執行）。
8. 抽查 1–5：① `src/ZuvioExams.tsx` `Report` 無成績場次／`preExamDetail`／旗標隱藏；② `functions/src/zuvioExams.ts` `ensureSittingPrep` 游標分頁與 `zuvioCareList` 分班歷史；③ `shared/zuvioExt.ts` `analyzeExam` 提醒與 `summarizeMoodResults` 無成績處理；④ `src/zuvio-ext-sample.css` `.zext-err` 18px；⑤ 新增測試與 `grep` 零個人路徑。

## 一、R1–R7 逐項修正明細

| 編號 | 問題摘要 | 修法說明 | 修改檔案與行號 | 新增／更新測試名稱 |
|---|---|---|---|---|
| **R1** | 報表未接 `preExamDetail`、無成績場次不能選、門檻單位 | `shared/zuvioExt.ts` 於 `summarizePreExamReport` 新增 `hasResults`、`practicedD`、`unpracticedD`，無成績不計入答對率僅計覆蓋率；`src/ZuvioExams.tsx` `Report` 開放全部場次勾選（標示「尚無成績」）、接入覆蓋率分布與逐題練過／沒練過答對率與 `D`、門檻標籤改 `高分門檻 (%)`。 | `shared/zuvioExt.ts:410-550`<br>`src/ZuvioExams.tsx:317-635`<br>`src/zuvioApi.ts:13-22, 165-205` | `tests/zuvio-ext.test.ts`: `R1/R2/R6/R7：逐題鑑別度與無成績覆蓋率...`<br>`tests/zuvio-mood-ui.test.ts`: `R1/R2/R5：Report 元件實際渲染無成績場次、逐題練過比較...` |
| **R2** | 多班歷史先混班截斷、`passed` 誤算本卷練過、UI 缺新欄位 | `zuvioCareList` 改對目標場次各班級分別取前 2 場歷史後合併去重（上限 30 場），不被他班擠掉；`buildCareList` 當有逐題計數時只認 `practicedItemCount`/`coverage`，不以 `passed` 代替本卷練過；`ZuvioExams.tsx` 關懷表補「考前狀態／覆蓋率」與「練習分類」。 | `functions/src/zuvioExams.ts:990-1065`<br>`shared/zuvioExt.ts:766-770`<br>`src/ZuvioExams.tsx:610-635` | `tests/zuvio-ext.test.ts`: `R1/R2/R6/R7...`<br>`functions/tests/zuvio-ext.test.cjs`: `R2/R3/R5/R7 後端驗證：多班歷史不遮蔽...`<br>`tests/zuvio-mood-ui.test.ts`: `R1/R2/R5...` |
| **R3** | `limit(5000)` 靜默截斷並永久定稿 | `ensureSittingPrep` 改用 `startAfter` 游標分頁（預設 `prepPageSize=2000`、`prepMaxAttempts=20000`／每組班級×單元），超過時探測下一筆並標記 `incomplete: true`、`finalized: false`（不定稿），回傳 `preExamIncomplete` 供前端提示。 | `functions/src/zuvioExams.ts:690-810` | `functions/tests/zuvio-ext.test.cjs`: `R2/R3/R5/R7 後端驗證...`（含 7 筆跨頁與超量不定稿案例） |
| **R4** | `.zext-err` 16px 不合規範、缺錯誤／重試測試 | `.zext-err` 調為 `calc(18px * var(--font-scale, 1))`、`line-height: 1.6`；測試實作「選取→首次送出失敗（量測 `.zext-err` ≥18px）→重試成功（量測完成態 ≥18px／44px）」完整流程於 390 預設與 1.3 倍。 | `src/zuvio-ext-sample.css:462-467` | `tests/zuvio-mood-ui.test.ts`: `F5/R4：實際 ZuvioMoodOverlay 手機390預設與特大可讀性（含錯誤態>=18px、重試與完成態）` |
| **R5** | `zuvioMood` 關閉後部分新增 API 與報表 UI 仍可用 | `moodTeacher` 同步要求 `zuvioExams`；`zuvioUpdateSittingStart`、`zuvioCareList`、`zuvioExportCsv` 改用 `moodTeacher`；`zuvioReport` 當 `!zuvioMood` 時只回 `{ report, compare, moodEnabled: false }`；`App.tsx` 傳入 `moodEnabled` 至 `ZuvioExams` 隱藏擴充按鈕與區塊。 | `functions/src/zuvioExams.ts:46-66, 274, 860-875, 955, 1085`<br>`src/App.tsx:700`<br>`src/ZuvioExams.tsx:25-45, 317-445` | `functions/tests/zuvio-ext.test.cjs`: `R2/R3/R5/R7 後端驗證...`<br>`tests/zuvio-mood-ui.test.ts`: `R1/R2/R5...` |
| **R6** | 缺 `P`/`D`/`r_pb` 核定提醒、`疑似錯鍵` 條件過嚴 | `analyzeExam` 補上 `P>0.9`（太簡單）、`P<0.25`（太難）、`D<0.2`（鑑別度低）、`r_pb<0.15`（低點二系列相關）；`keySuspect` 修正為 `!isKey && total > 0 && high > keyHigh`。 | `shared/zuvioExt.ts:250-272` | `tests/zuvio-ext.test.ts`: `R1/R2/R6/R7...`（含 `highWrong > highKey && highWrong <= lowWrong` 案例與 W8 Q30/Q15 驗證） |
| **R7** | 情緒分布與轉變依賴已匯入成績 | `summarizeMoodResults` 允許 `score: null`／`hasResult: false`，無成績填答者照常計入 `counts`、`totalResponded` 與 `shifts`，不計入 `byScore` 與 `byQuestion`；`zuvioReport` 遍歷所有有成績或有填情緒之學生並支援無成績場次。 | `shared/zuvioExt.ts:574-670`<br>`functions/src/zuvioExams.ts:895-955` | `tests/zuvio-ext.test.ts`: `R1/R2/R6/R7...`<br>`functions/tests/zuvio-ext.test.cjs`: `R2/R3/R5/R7 後端驗證...` |

## 二、F1–F9 前輪保留項目對照
- **已通過保留**：F3（百分比門檻）、F4（核可原文與告知）、F6（未來場次快取不凍結）、F7（兩場情緒轉變排序去重）、F9（圖表只計相關次單元）。
- **F1、F2、F5、F8 遺留點**：已分別由上述 R1／R7、R2、R4、R3 完整補齊。

## 三、Firestore 查詢讀取估算（更新版）
- **常見單場情境**（50 人、1 班、3 次單元、每單元 `attempts` 100–200 筆）：
  - 首次計算並定稿：名冊約 50 reads ＋ `attempts` 分頁查詢 300–600 reads ＋ `progress` 50 reads ＝ **約 400–700 reads**（寫入 1 筆 `prep` 快取）。
  - 開考後定稿命中快取：**1 read**。
- **高負載上限情境**（單場多班 × 多單元，每組 `(classId, unitId)` 達硬上限 `prepMaxAttempts = 20000` 筆時）：
  - 單一 `(classId, unitId)` 最多讀 10 頁（每頁 2000 筆）＋ 1 筆探測 ＝ **20001 reads**；若超過則自動設 `incomplete: true` 且 `finalized: false`，不會把殘缺資料永久定稿。

## 四、開發期間單檔驗證結果（Node v22.23.2）
- `npx tsc --noEmit`：PASS
- `npm --prefix functions run build`：PASS（67 個函式入口載入通過）
- `npx tsx --test tests/zuvio-ext.test.ts`：11/11 PASS，0 skipped
- `npx tsx --test tests/zuvio-mood-ui.test.ts`：2/2 PASS，0 skipped
- `node --test functions/tests/zuvio-ext.test.cjs`：4/4 PASS，0 skipped
- 路徑 grep（本次新增／修改之程式、測試、樣式檔）：0 命中 `/Users` 或 `/private/tmp`
