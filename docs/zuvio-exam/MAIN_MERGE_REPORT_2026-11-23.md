# 給 Claude 的摘要
- #65：將最新 `origin/main` `5e649242118b1f24371f42806b438a02f7753dc3` 合併至 `feature/zuvio-exams`；合併前 HEAD `249e5b0f`，原落後 24 commits。
- 未驗：本棒未跑全套 `npm run check`、教材完整閱讀檢查、Linux 非 root 或教師手機實點；交 Antigravity Gemini 3.8 Flash 新對話跑全套。
- 手動解衝突僅四檔：`functions/src/index.ts`、`shared/features.ts`、`src/App.tsx`、`src/main.tsx`；保留點名與 Zuvio 的入口、旗標、導覽及樣式。
- 正式版單元上限 120、閱讀檢查與指紋檔案均原樣保留；未改教材、圖檔、題庫、reviewed 或正式資料。
- 版本沿用合併進來的正式版 `1.15.9`，未另升號；`version:check` PASS。舊報告的 `1.15.8` 是歷史記錄。
- 必要檢查 PASS：Functions build（既有入口檢查 67 項）、指定擴充測試 7/7、前端 build；另驗 18 點名＋18 Zuvio exports。
- 合併相關回歸 PASS：前端 45/45、後端 24/24（含上述擴充 7 項）；0 fail、0 skipped。
- 自修：前端缺正式版新增套件 `qrcode-generator`，依 lockfile 執行 `npm ci --ignore-scripts --no-audit --no-fund` 後 build PASS；未改套件檔。
- 可攜性 grep：本次自 HEAD 帶入／修改的 18 份程式、測試、腳本，個人／macOS 暫存路徑 0 命中；無新增測試腳本。
- 偏離：無；未 push、未合併 main、未部署。根目錄其他未提交工作保留；僅更新管理佇列 #65 與本週誌。
- 抽查 4 項：四檔衝突解法、36 個後端入口、120 上限／閱讀指紋與正式版一致、擴充測試 C1／B1／B2。

## 合併內容與界線

日期：2026-11-23（Asia/Taipei）。已成功 fetch origin，取到 `5e649242`；使用 merge 保留既有擴充提交，不重寫分支歷史。

| 檔案 | 衝突解法 |
|---|---|
| `functions/src/index.ts` | 同時保留 `createZuvioHandlers` 與 `createAttendanceHandlers` 的 import 及各 18 個 callable export。 |
| `shared/features.ts` | `CourseFeatures` 與 `featureNames` 同時保留 `zuvioExams`、`zuvioMood`、`attendance`；不改閱讀設定的正規化。 |
| `src/App.tsx` | 導覽同時套用點名旗標與 Zuvio 旗標／預覽條件；自動合併的學生點名、情緒簽到及教師分頁均保留。 |
| `src/main.tsx` | 同時載入點名與 Zuvio CSS，保留 Zuvio 樣本分支和正常 App／UpdateBanner。 |

`shared/courseValidation.ts`、`tests/course-unit-limit.test.ts`、`scripts/readability-check.mjs`、`scripts/lib/readability-cache.mjs`、`scripts/lib/readability-static.mjs`、`scripts/readability-cache.json`、`tests/readability-cache.test.ts` 與所合併的 origin/main 完全一致。

本棒沒有修改學生文案或重新設計外框，未新增／修改圖片，未拍攝或目視檢視截圖。完整閱讀檢查留給下一棒，不能以本次指紋單元測試代替 17 份教材驗收。#67 尚未在 main 的後台點名開關補丁不在本棒範圍。

## 實際檢查

環境：macOS；Node v22.23.2、npm v10.9.8。以下結果均來自合併後的程式。

| 指令／核對 | 結果 |
|---|---|
| `npm run version:check` | PASS，1.15.9 所有版本來源一致。 |
| `npm --prefix functions run build` | PASS，既有 check-entry 列出 67 個入口；另直接載入編譯入口，18 點名＋18 Zuvio callable 均為 function（未連雲端）。 |
| `node --test functions/tests/zuvio-ext.test.cjs` | PASS，7 tests／7 pass／0 fail／0 skipped，含 C1 共享歷史排序、B1 與 B2。 |
| `node --test functions/tests/zuvio-ext.test.cjs functions/tests/attendance.test.cjs` | PASS，24/24；其中 7 項與前一列重複，不重複累計。 |
| `./node_modules/.bin/tsx --test tests/attendance.test.ts tests/course-unit-limit.test.ts tests/readability-cache.test.ts tests/zuvio.test.ts tests/zuvio-ext.test.ts` | PASS，45/45、0 skipped；含 120 通過／121 拒絕及指紋判定。 |
| `npm run build` | PASS，tsc＋Vite；保留既有 bundle 大小提醒。 |
| `git diff --cached --check -- functions/src/index.ts shared/features.ts src/App.tsx src/main.tsx` | PASS，四個衝突解法無空白錯誤。 |
| 18 份變更程式／測試／腳本的 `grep -nHE '(/Users/\|/private/tmp)'` | PASS，0 命中；文件中的本機證據位置不列入程式可攜性檢查。 |

全差異空白檢查仍會指出既有 CSV 的 CRLF，以及上游 `docs/READABILITY_INCREMENTAL_TEST_RUN.md` 尾空白；本棒未重排逐位元比對的 CSV 或修改上游歷史報告。

## 自修與既有檔案保存

1. tsx 首次啟動因沙箱禁止本機 IPC 而失敗；獲准在沙箱外重跑，45/45 PASS。這是執行環境限制，未更動測試。
2. 初次前端 build 的 TS2307 缺 `qrcode-generator`；按合併後 lockfile 補裝依賴，重跑 build PASS，未改 package 或 lockfile。
3. 開工原有四組未追蹤檔案已移至 repo 外 `preexisting/`，保留相對路徑與內容：舊 `EXT_CODEX_VERIFY.md`、`EXT_TEST_RUN.md`、`test-output/`、尿路 bad-fixture 的 `pre-answer.json`。未把舊報告計入本輪驗證。
4. 開工 prune-evidence dry-run：可刪 0 日期資料夾／0 MB，未執行刪除。

證據目錄：`/Users/HHC/.codex/visualizations/2026/11/23/01a20755-c044-72a3-9152-37fdb0750d4c/zuvio-main-merge/`。
本次 raw logs 為 `backend-targeted.log`、`zuvio-ext.log`、`frontend-build.log`、`npm-ci.log`；其餘指令結果與數字列於本報告和執行對話。
截圖保存至 2026-11-30（本棒無新增截圖）；原始輸出保存至同日。`preexisting/` 為他人未追蹤檔案備份，未經教師同意不得隨一般證據清理刪除。

## 交給下一個 AI

```text
對象：Antigravity／Gemini 3.8 Flash 新對話｜佇列 #65（#61 擴充）全套驗證。

目標：在 feature/zuvio-exams 合併正式版後，實際跑完 npm run check，只跑、記錄並交 Codex 複審。

背景：根目錄 /Users/HHC/Documents/ChatGPT/課程平台1.0；工作樹 .worktrees/zuvio-exams。
先讀根目錄 handoff.md、CODEX_QUEUE.md #61／#65、docs/AI_WORKFLOW_PLAN.md；讀工作樹 docs/zuvio-exam/EXT_FIX_REPORT.md 與 MAIN_MERGE_REPORT_2026-11-23.md。
交辦讀根目錄 CODEX_TASK_zuvio-ext_2026-11-13.md；其原始版本決策僅作背景，本棒合併與版本以本報告及教師本次交辦為準。
需要時讀 EXT_IMPL_REPORT.md、EXT_SAMPLES_REPORT_2026-11-13.md 及 docs/READABILITY_STANDARD.md。
Codex 已 merge origin/main 5e649242；版本沿用正式 1.15.9，未另升號；指定擴充 7/7、前端相關 45/45、後端相關 24/24、兩端 build PASS。

限制：先確認 git branch --show-current 及 git status --short；保留他人工作。
只跑只記錄，不改程式、測試、題庫、reviewed 或校正圖；不為通過而放寬檢查或更新快取，不升版本。
不 push、不合併 main、不部署、不操作正式平台／學生資料；佇列只能改根目錄 #65。
正式版若又前進，先記錄差距交 Codex，不自行 rebase／merge。
截圖與 raw logs 放 repo 外，保存 7 日；測試暫存沿用 os.tmpdir()/RUNNER_TEMP，不把絕對個人路徑寫入腳本。

完成標準：
1. Node 22.23.2；有依賴缺漏按 lockfile 補裝，不修改 lockfile。執行 npm run version:check。
2. 以 bash set -o pipefail，執行 npm run check 2>&1 | tee "repo外完整log路徑"，取得真正 exit code；不得只看 tail 或引用上輪結果。
3. 記錄前／後端 pass、fail、skipped、build、readability pass／skip／重跑教材數、issues、staticIssues 和環境；可讀性跳過與測試 skipped 分開列。
4. 新報告 docs/zuvio-exam/EXT_TEST_RUN_2026-11-23.md 開頭「給 Claude 的摘要」≤15行，列未驗／限制、PASS／FAIL、偏離與最多5個抽查點，附 commit／指令／證據位置與保存日。
5. FAIL 不改測試也不宣稱通過，記下首個錯誤和重現條件交 Codex；PASS 亦交 Codex 複審→Claude 最後驗收，Linux 非root 不可聲稱已驗。
6. 只改 #65 為停-等Codex，指向新報告；根目錄 python3 scripts/devlog.py add 寫週誌，跑 python3 scripts/check_handoff.py 必須 PASS。
7. 如有提交，結尾 [Antigravity]；工作樹乾淨，停止自行啟動的背景程序。最後附同樣可獨立貼用的「交給下一個 AI」prompt。
```
