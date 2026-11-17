# #65 Zuvio 延伸功能 F1–F9、R1–R7、B1–B2 及 C1 修正報告（2026-11-17）

## 給驗證者的摘要
1. 分支與基底：`.worktrees/zuvio-exams`（`feature/zuvio-exams`，基於 `origin/main` `bff2281a` 1.15.8；版本號未改）。
2. 判定：C1 修正完成，並保留已通過之 B1（每批 10 場、16 班／32 場）、B2（不完整傳遞與拒絕研究匯出）、R1、R4–R7 及 F3、F4、F6、F7、F9。
3. C1（共享歷史時間排序）：`zuvioCareList` 在 `neededMap` 去重聯集後，以 `bySittingDesc`（`startsAt` 降序再 `date` 降序）排序 `neededHistory` 與載入後之 `histData`，不再依 `Map` 插入順序決定最近場次。
4. 新增測試：`functions/tests/zuvio-ext.test.cjs` 新增 `C1：共享歷史與單班歷史混用按時間排序，全班／單班及目標班序 [A,B] 與 [B,A] 皆一致`（H3 僅 B 藍、H2/H1 共用 A+B 灰、目標場 T 灰），驗證全班／單班及 `[A,B]`／`[B,A]` 均一致且 B 不誤標持續疏離。
5. 單檔驗證（Node v22.23.2）：`npm --prefix functions run build`（67 函式）PASS、`node --test functions/tests/zuvio-ext.test.cjs` 7/7 PASS，0 skipped。
6. 尚未跑全套 `npm run check`（交由 Gemini 3.8 Flash 新對話執行）。
7. 路徑 grep：`functions/src/zuvioExams.ts`、`functions/tests/zuvio-ext.test.cjs` 0 命中 `/Users` 或 `/private/tmp`。
8. 抽查 1–3：① `functions/src/zuvioExams.ts:1036-1065` `bySittingDesc` 排序與每批 10 場保留；② `functions/tests/zuvio-ext.test.cjs` C1 案例；③ `EXT_FIX_REPORT.md`。

## 一、C1 修正明細（2026-11-17）

| 編號 | 問題摘要 | 修法說明 | 修改檔案與行號 | 新增測試名稱 |
|---|---|---|---|---|
| **C1** | `neededMap` 依班級迴圈插入造成共用歷史與單班歷史錯序 | 於 `neededMap` 去重聯集後明確以 `bySittingDesc`（`b.startsAt - a.startsAt \|\| b.sitting.date.localeCompare(a.sitting.date)`）排序 `neededHistory`，並於分批（每批 10 場）載入 `histData` 後再次依 `bySittingDesc` 排序，確保各班 `.filter().slice(0, 2)` 永遠取到該班最新 2 場歷史。 | `functions/src/zuvioExams.ts:1036-1065` | `functions/tests/zuvio-ext.test.cjs`: `C1：共享歷史與單班歷史混用按時間排序，全班／單班及目標班序 [A,B] 與 [B,A] 皆一致` |

## 二、既有通過項保留摘要
- **B1／B2（2026-11-17）**：保留每批 10 場載入、16 班／32 個不同歷史場次案例、關心清單不完整標記、兩種研究 CSV 拒絕與試題分析 CSV 保留、UI 停用與警告。
- **R1、R4–R7 與 F3、F4、F6、F7、F9**：完整保留通過行為；版本維持 `1.15.8` 不改。

## 三、開發期間單檔驗證結果（Node v22.23.2）
- `npm --prefix functions run build`：PASS（67 個函式入口載入通過）
- `node --test functions/tests/zuvio-ext.test.cjs`：7/7 PASS，0 skipped
- 路徑 grep（本次修改之 `functions/src/zuvioExams.ts`、`functions/tests/zuvio-ext.test.cjs`）：0 命中 `/Users` 或 `/private/tmp`
