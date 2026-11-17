# #65 Zuvio 延伸功能 F1–F9、R1–R7 及 B1–B2 修正報告（2026-11-17）

## 給驗證者的摘要
1. 分支與基底：`.worktrees/zuvio-exams`（`feature/zuvio-exams`，基於 `origin/main` `bff2281a` 1.15.8；版本號未改）。
2. 判定：B1 與 B2 修正完成，並保留已通過之 R1、R4–R7 與 F3、F4、F6、F7、F9。
3. 單檔驗證（Node v22.23.2）：`tests/zuvio-ext.test.ts` 12/12、`tests/zuvio-mood-ui.test.ts` 2/2、`functions/tests/zuvio-ext.test.cjs` 6/6，合計 20/20 PASS，0 skipped；`tsc --noEmit` 與 `functions run build`（67 函式）PASS。
4. B1（多班歷史不漏列）：移除 `zuvioCareList` 全域 `slice(0, 30)` 截斷，改為保留全部目標班級各自前 2 場歷史並以每批 10 場並行載入，補 16 班／32 個獨立歷史場次測試驗證全班與逐班一致。
5. B2（`prep incomplete` 傳遞與防誤判）：`zuvioCareList` 傳遞 `preExamIncomplete` 至 `buildCareList`（未知狀態改標「練習資料不完整」而非「沒練習＋低分＋藍色」）；`zuvioExportCsv` 在 `preExamIncomplete=true` 時拒絕 `researchAnon`/`researchNamed` 匯出，保留不依賴 `prep` 的 `itemAnalysis` CSV；前端同步停用研究 CSV 按鈕並顯示警告。
6. 尚未跑全套 `npm run check`（交由 Gemini 3.8 Flash 新對話執行）。
7. 路徑 grep：本次新增／修改檔案 0 命中 `/Users` 或 `/private/tmp`。
8. 抽查 1–5：① `functions/src/zuvioExams.ts` `zuvioCareList` 分批載入與 `zuvioExportCsv` 拒絕邏輯；② `shared/zuvioExt.ts` `buildCareList` 不完整處理；③ `src/ZuvioExams.tsx` 按鈕停用與關懷警告；④ `functions/tests/zuvio-ext.test.cjs` B1 16 班與 B2 超量測試；⑤ `tests/zuvio-mood-ui.test.ts` 不完整模式。

## 一、B1／B2 修正明細（2026-11-17）

| 編號 | 問題摘要 | 修法說明 | 修改檔案與行號 | 新增／更新測試名稱 |
|---|---|---|---|---|
| **B1** | `zuvioCareList` 全域 `slice(0, 30)` 造成 16 班以上漏列後面班級 | 移除 `.slice(0, 30)`，保留全部目標班級各取前 2 場之歷史聯集，並改以每批 10 場（`for (i += 10)`）分批載入 `histData`，兼顧並發安全與完整性；全班查詢與逐班查詢結果完全一致。 | `functions/src/zuvioExams.ts:1025-1065` | `functions/tests/zuvio-ext.test.cjs`: `B1：16班／32個不同歷史場次不截斷，全班與逐班查詢一致` |
| **B2** | `prep incomplete` 未傳至關心清單與研究 CSV，將未知判為確定未練 | `CareStudentInput` 與 `CareListEntry` 新增 `preExamIncomplete?: boolean`；`buildCareList` 於 `preExamIncomplete && !hasPracticed` 時將低分＋藍色標為 `'練習資料不完整'`（絕不標 `'沒練習＋低分＋藍色'`）。`zuvioCareList` 回傳 `preExamIncomplete`；`zuvioExportCsv` 於 `preExamIncomplete=true` 時拒絕 `researchAnon`/`researchNamed`，保留 `itemAnalysis` CSV。`ZuvioExams.tsx` 於 `incomplete` 時停用兩顆研究 CSV 按鈕並在關懷名單顯示警告。 | `shared/zuvioExt.ts:724-750, 818-842`<br>`functions/src/zuvioExams.ts:997-1135`<br>`src/zuvioApi.ts:42`<br>`src/ZuvioExams.tsx:325-400, 588-620` | `tests/zuvio-ext.test.ts`: `B2：buildCareList 在 preExamIncomplete 且未讀到練習時不得判為「沒練習＋低分＋藍色」`<br>`functions/tests/zuvio-ext.test.cjs`: `B2：超量不完整資料同時驗證 Report、CareList、researchAnon、researchNamed 與 itemAnalysis`<br>`tests/zuvio-mood-ui.test.ts`: `R1/R2/R5：Report 元件...`（含 `incomplete` 模式） |

## 二、R1–R7 與 F1–F9 保留項摘要
- **版本偏離**：維持 `1.15.8` 不改（依規畫〇之二與交辦，待教師統一排定 `#61`／`#63` 部署順序）。
- **已通過保留**：R1（考前詳細報表與無成績入口）、R4（錯誤態 18px 與重試完成態）、R5（`zuvioMood` 全旗標保護）、R6（核定統計提醒與疑似錯鍵）、R7（無成績情緒分布與轉變），以及前輪 F3、F4、F6、F7、F9。

## 三、開發期間單檔驗證結果（Node v22.23.2）
- `npx tsc --noEmit`：PASS
- `npm --prefix functions run build`：PASS（67 個函式入口載入通過）
- `npx tsx --test tests/zuvio-ext.test.ts`：12/12 PASS，0 skipped
- `npx tsx --test tests/zuvio-mood-ui.test.ts`：2/2 PASS，0 skipped
- `node --test functions/tests/zuvio-ext.test.cjs`：6/6 PASS，0 skipped
- 路徑 grep（修改及新增之程式、樣式與測試檔）：0 命中 `/Users` 或 `/private/tmp`
