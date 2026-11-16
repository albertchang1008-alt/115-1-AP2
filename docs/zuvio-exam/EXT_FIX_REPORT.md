# #65 Zuvio 延伸功能 F1–F9 修正報告（2026-11-16）

## 給驗證者的摘要
1. 分支與基底：`.worktrees/zuvio-exams`（`feature/zuvio-exams`，基於 `origin/main` `bff2281a` 1.15.8；版本號未改）。
2. 判定：F1–F9 全部修正完成，相關單檔測試全數通過（`tests/zuvio-ext.test.ts` 10/10、`tests/zuvio-mood-ui.test.ts` 1/1、`functions/tests/zuvio-ext.test.cjs` 3/3），`tsc --noEmit` 與 `functions run build`（67 函式）PASS。
3. 尚未跑全套 `npm run check`（依分工交由第 3 棒 Gemini 3.8 Flash 執行）。
4. F1（最優先）：保留 `attempts.answers` 逐題對錯並計算 `practiced`/`practiced_wrong`/`none`、覆蓋率、`summarizePreExamReport` 聚合及完整研究 CSV 欄位。
5. F2–F3：關心名單改依規畫 4.2（高分＋黃、低分＋藍與連續、低分＋綠、最近 3 場皆灰不看分數）及三型分類，跨同課程僅計應參與場次；80% 門檻改比對百分比。
6. F4–F5：情緒問句、告知（「此題不計分，老師會看到你的選擇，用來調整教學」）與五狀態文字還原附錄原文；`ZuvioMoodOverlay` 補齊 `.zext-*` 響應式樣式，390 預設與特大經 Playwright 實測達標。
7. F6–F9：未來場次快取不凍結、兩場情緒比較排序去重、考前截止只採信 `receivedAt` 並補 `(classId, unitId, receivedAt)` 索引、圖表僅計考卷相關次單元活動鍵。
8. 抽查 1–5：① `shared/zuvioExt.ts` 逐題分類與原文常數；② `functions/src/zuvioExams.ts` `ensureSittingPrep`/`zuvioCareList`/`zuvioReport`；③ `src/zuvio-ext-sample.css` `.zext-*`；④ `firestore.indexes.json` 複合索引；⑤ 新增測試與 `grep` 零個人路徑。

## 逐項修正明細（F1–F9）

| 編號 | 問題摘要 | 修法說明 | 修改檔案與行號 | 新增／更新測試名稱 |
|---|---|---|---|---|
| **F1** | 考前練習只記次單元、研究 CSV 缺欄位 | `ensureSittingPrep` 保留 `attempts.answers` 逐題對錯；`classifyPreExamPractice` 產出 `itemStatuses`（`practiced`/`practiced_wrong`/`none`）、`coverage`、`passedUnits`、`completedActivities`，同單元別題不誤算；新增 `summarizePreExamReport` 供 `zuvioReport` 回傳逐題與覆蓋率分布；`researchCsv` 補齊情緒填答時間、分數百分比、覆蓋率、次單元達標、圖表走完與逐題 `Q#_作答/對錯/考前練習`。 | `shared/zuvioExt.ts:308-498, 837-898`<br>`functions/src/zuvioExams.ts:614-755, 806-912, 1005-1075`<br>`src/zuvioApi.ts:5-20` | `tests/zuvio-ext.test.ts`: `F1：逐題考前練習（練過／練過且答錯過／沒練過）、同單元別題不誤算、聚合報表與研究CSV欄位`<br>`functions/tests/zuvio-ext.test.cjs`: `F1/F2/F6/F7/F8 後端驗證...` |
| **F2** | 關心名單條件與跨卷場次不符規畫 | `buildCareList` 嚴格依規畫 4.2（表現好但緊繃、可能需要鷹架〔含連續 2 場〕、自評與表現有落差、持續疏離〔最近 3 場 `gray_fog` 不看分數〕）與四之二三型分類；`zuvioCareList` 改查同課程所有未封存考卷，僅過濾學生所屬班級應參與之歷史場次。 | `shared/zuvioExt.ts:653-772`<br>`functions/src/zuvioExams.ts:914-1003` | `tests/zuvio-ext.test.ts`: `summarizeMoodResults & buildCareList：門檻切換、跨場變化與 4 標籤規則`<br>`functions/tests/zuvio-ext.test.cjs`: `F1/F2/F6/F7/F8 後端驗證...` |
| **F3** | 80% 門檻誤用原始分數 | 新增 `calcScorePercentage`；`summarizeMoodResults`、`buildCareList`、`zuvioReport`、`zuvioCareList` 統一使用分數百分比（`score/maxScore*100` 或 `correct/itemCount*100`）與門檻比較，原始 `score` 仍保留。 | `shared/zuvioExt.ts:500-510, 560-575, 700-715`<br>`functions/src/zuvioExams.ts:840-870, 975-995` | `tests/zuvio-ext.test.ts`: `F3：80%門檻以百分比比較（滿分10、100、136），非原始分數` |
| **F4** | 告知宣稱不記名、五狀態文字改寫 | `MOOD_QUESTION`、`MOOD_SUBNOTE`（「此題不計分，老師會看到你的選擇，用來調整教學」）與 `MOOD_STATES` 五種狀態標題／教師標註／回饋語全數還原為交辦附錄原文。 | `shared/zuvioExt.ts:4-64` | `tests/zuvio-ext.test.ts`: `F4：學生告知不得宣稱不記名且五狀態文字須完全符合附錄原文` |
| **F5** | 正式元件未套用手機可讀性樣式 | 於 `src/zuvio-ext-sample.css` 補齊 `.zext-student-card`、`.zext-q`（21px）、`.zext-subnote`（18px）、`.zext-mood-btn`（18px、min-height 52px、`.is-selected`）、`.zext-submit`（18px、min-height 48px）且全乘 `--font-scale`，390 預設／特大無溢出、對比 ≥4.5:1。 | `src/zuvio-ext-sample.css:338-445` | `tests/zuvio-mood-ui.test.ts`: `F5：實際 ZuvioMoodOverlay 手機390預設與特大可讀性（字級>=18px、按鈕高>=44px、無溢出、選取狀態）` |
| **F6** | 未開考報表快取永久凍結 | `ensureSittingPrep` 寫入 `finalized: Date.now() >= startsAt`，僅當 `d.finalized === true` 才命中快取；未開考前每次查詢即時重算，開考後首次計算才定稿凍結。 | `functions/src/zuvioExams.ts:660-682, 740-753` | `functions/tests/zuvio-ext.test.cjs`: `F1/F2/F6/F7/F8 後端驗證...` |
| **F7** | 兩場情緒轉變重複配對與順序問題 | `zuvioReport` 先依 `startsAt`／`date` 排序兩場次，將後場去重資料透過 `shiftLaterPairs` 獨立傳入 `summarizeMoodResults`，`shifts` 迴圈依 `uid` 去重只配對一次。 | `shared/zuvioExt.ts:555-645`<br>`functions/src/zuvioExams.ts:825-895` | `tests/zuvio-ext.test.ts`: `F7：兩場情緒轉變只配對後場一次、去重學號不膨脹`<br>`functions/tests/zuvio-ext.test.cjs`: `F1/F2/F6/F7/F8 後端驗證...` |
| **F8** | 採信 `clientAt` 與查詢無時間截斷／上限 | `ensureSittingPrep` 移除 `clientAt`，只取 `receivedAt`；Firestore 查詢加入 `.where('receivedAt', '<', cutoffTs).orderBy('receivedAt', 'desc').limit(5000)`，並於 `firestore.indexes.json` 補上 `(classId, unitId, receivedAt)` 複合索引（單場讀取維持約 200–300 reads 級距）。 | `functions/src/zuvioExams.ts:690-715`<br>`firestore.indexes.json:71-87` | `functions/tests/zuvio-ext.test.cjs`: `F1/F2/F6/F7/F8 後端驗證...` |
| **F9** | 無關單元圖表也計入考前已看圖 | 新增 `allowedActivityKeysForUnits` 由 `c.published`（chapter 與 unit 活動）算出考卷相關次單元的活動鍵集合傳入 `classifyPreExamPractice`，未傳入允許鍵的圖表不計入。 | `functions/src/zuvioExams.ts:635-660, 730-740`<br>`shared/zuvioExt.ts:360-375` | `tests/zuvio-ext.test.ts`: `F9：圖表考前走完僅計入考卷相關次單元` |

## 開發期間單檔驗證結果（完整 `npm run check` 交由第 3 棒 3.8 執行）
- `npx tsc --noEmit`：PASS
- `npm --prefix functions run build`：PASS（67 個函式入口載入通過）
- `npx tsx --test tests/zuvio-ext.test.ts`：10/10 PASS，0 skipped
- `npx tsx --test tests/zuvio-mood-ui.test.ts`：1/1 PASS，0 skipped
- `node --test functions/tests/zuvio-ext.test.cjs`：3/3 PASS，0 skipped
- `grep -rn "/Users\|/private/tmp"`（本次改動目錄）：0 命中（無硬編碼個人路徑）
