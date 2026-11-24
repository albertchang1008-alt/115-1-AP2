# #65 第4棒程式驗證（Codex，2026-11-23）

## 給 Claude 的摘要
- **FAIL，退回Hydrogen**：發現3項可重現問題（V1–V3），另有1項v3快取要求未實作（D1）；不進入最後驗收／部署。
- 基準：`feature/zuvio-exams`／`fe9c31b9`，程式基底`50ddfdd7`；相對`origin/main`／`5e649242`審查。兩個HEAD之間只有第三棒報告差異。
- 未驗：Ubuntu非root、教師手機、正式平台與學生資料均未操作；依交辦不重跑全套check／build／17份教材。
- 本輪新增測試 **21/21 PASS、0 skipped**：純函式12、後端7、UI2；測試通過不能覆蓋下列未被測到的缺陷。
- **V1／P1**：正式名冊沒有必備uid；考前練習卻直接依賴enrollment.uid，已練／已達標學生變成none、覆蓋率0並永久定稿。
- **V2／P2**：封存考卷未關閉快篩，學生仍取得active=true並成功送出。
- **V3／P2**：查已關閉A場時混用開放B場的state／eligibleCount，重現「已填2／應填1、開放中」。
- **D1／規畫偏離**：試題分析仍每次report／CSV重算，沒有v3四之三F要求的匯入時計算及摘要快取。
- 檔案：本工作樹僅新增本報告；根目錄僅改#65與本週短誌。未改程式／測試、未push／部署。
- 偏離：僅新增測試外，另以既有memoryDb合成資料重現V1–V3；腳本與結果在repo外，不新增產品測試、不讀正式資料。
- 抽查最多5項：①V1真實名冊結構與定稿快取 ②V2封存交易 ③V3場次選擇 ④統計公式／W8 Q30 ⑤旗標、CSV與MCP投影。

## 範圍與依據

已讀根目錄`handoff.md`、`docs/AI_WORKFLOW_PLAN.md`、`CODEX_QUEUE.md`、`CODEX_TASK_zuvio-ext_2026-11-13.md`、`docs/zuvio-exam/MOOD_CHECK_PLAN_2026-11-13.md`（v3），以及本工作樹`EXT_IMPL_REPORT.md`、`EXT_FIX_REPORT.md`、`MAIN_MERGE_REPORT_2026-11-23.md`、`EXT_TEST_RUN_2026-11-23.md`。交辦與v3規畫在根目錄，本工作樹未收錄，不以舊報告代替。

本機`origin/main`為`5e649242118b1f24371f42806b438a02f7753dc3`，本輪依指定基準審查，未fetch、merge或rebase。版本沿用1.15.9。程式、測試、執行腳本相對該基準逐檔列出後，重點讀取後端、shared統計與CSV、學生卡片、App gate、課堂控制台、報表及旗標保存／MCP路徑。批次B延後項不作為缺陷。

第三棒記錄：前端343／後端144、build與check退出0；可讀性17份快取跳過、實跑0畫面，不能寫成本輪重新量過17份。本輪未重跑其整套工作。

## 需修問題

### V1 — P1：實際名冊缺uid時，考前練習被誤算並定稿

- 位置：`functions/src/zuvioExams.ts:756`只收`r.uid`去讀progress；`:768`以`sid:<學號>`代替缺失uid，但`:774`、`:775`仍因缺`r.uid`丟棄所有attempts／progress；`:786`至`:795`將錯誤結果finalized。現有命中條件在`:681`至`:689`不再補算。
- 真實資料來源：`shared/sheets.ts:24`產生的名冊只有courseId、classId、studentId、name、email、enabled；`functions/src/index.ts:404`至`:406`按此寫enrollments。Roster的uid是選填（`shared/model.ts:158`），一般匯入及bootstrap沒有替每個enrollment補uid。既有完成度流程會另以email映射profiles UID（`functions/src/index.ts:1092`至`:1103`）。
- 重現：沿用既有測試setup，去除enrollment中測試額外灌入的uid，保留email；建立對應profiles、考前q0正答attempt及u1.passedAt。查場次報表，學號S01得到`status=none`、`coverage=0`、`finalized=true`、全班passed=0；應為`passed`、100%、passed=1。
- 影響：練習覆蓋率、考前達標、圖表走完、關心分類與研究CSV均可能失真；有uid的測試夾具遮蔽了真實名冊整合問題。
- 修正要求：依正式名冊email建立可靠UID映射，再讀該UID的attempts與progress；有來源可解析時不得以缺enrollment.uid當成未練。**既有錯誤finalized快取亦需版本失效或安全重算**，只改新計算路徑仍會命中舊錯誤資料。不可自行批次改正式名冊／快取。
- 回歸須含：沒有uid但profiles／attempts／progress齊全、無登入profile、以及修正前的錯誤定稿快取；保留班級、次單元、開考時間及不完整資料保護。

### V2 — P2：封存考卷後，開啟中的快篩仍能寫入

- 位置：`functions/src/zuvioExams.ts:227`至`:238`只改考卷archived；`:538`至`:565`只讀獨立current狀態；`:579`至`:605`提交交易不檢查考卷封存。
- 重現：B場開啟快篩後封存考卷，再以B班學生查詢與提交；`exam.archived=true`，卻仍回`active=true`且接受新作答。
- 依據：v3第五節「封存考卷時情緒一併封存」。`zuvioOpenMood`會拒絕已封存考卷，但擋不住先開後封存。
- 修正要求：封存應一致終止該考卷的開放指標；學生讀／寫也要防止舊指標繼續有效，處理封存與送出的競態。保留已存情緒供教師歷史查閱，不以刪資料代替封存。
- 回歸須含：先開再封存、封存後學生查詢／提交、封存別份考卷不影響現行場次、與原有結束3秒寬限區分。

### V3 — P2：即時人數與狀態取自不同場次

- 位置：`functions/src/zuvioExams.ts:492`至`:515`：responses按請求examId／sittingId讀，state、eligibleCount卻直接取課程current，未檢查是否同一場。
- 前端會觸發：`src/ClassroomInteraction.tsx:1127`將所選場次傳入getMoodLive，並由`:1200`至`:1204`允許切換考卷／場次。
- 重現：A場2人已填後關閉，開啟B場（應填1人）；查A場得到A場2筆作答，但state屬B場、open=true、eligibleCount=1，畫面可顯示2／1。
- 修正要求：回傳狀態、分母和作答計數必須對應同一examId＋sittingId。歷史場次需使用其班級名冊／可稽核的場次資料，不能借用當前場；選取與正在開放場次不同時，結束按鈕的行為也應保持一致。
- 回歸須含：同考卷不同班場次、不同考卷、明確指定與省略場次參數；檢查state識別、open、eligible及counts整組一致。

## 逐條核對交辦第2、4節與v3

| 要求 | 結果 | 程式／證據與界線 |
|---|---|---|
| 同考卷／同場次整合成績、情緒、練習 | PASS（邏輯關聯） | `zuvioExams.ts:799`至`:817`將情緒轉為studentId索引，`:911`至`:945`按學號聯集。情緒實體文件以uid為ID，學號存欄位；prep按學號建表，與v3示意文件路徑不同，未發現本身造成錯配；V1另列FAIL |
| zuvioMood預設關、saveCourse漏鍵保留、明確false關閉 | PASS（靜態） | `shared/features.ts:14`嚴格true；`functions/src/index.ts:248`至`:253`分別保留兩鍵；沒有執行saveCourse真實服務寫入 |
| MCP投影與patch不清旗標 | PASS（靜態） | `functions/src/platformMcp.ts:27`以頂層features投影、`:86`只更新draft等；`shared/courseDraft.ts:63`及`tools/platform-mcp/src/course.ts:2`保留整個features |
| 教師限定、課程授權、輸入白名單 | PASS（抽查） | `zuvioExams.ts:32`、`:49`至`:64`；新增端點逐一obj白名單與UUID／數值驗證；`index.ts:179`限制課程teacherIds。既有新測試涵蓋關旗標、越權與跨班；未將memoryDb稱為Firestore emulator |
| 學生只能讀開放卡片與自己的選擇 | PASS | `zuvioExams.ts:539`只收courseId，`:549`限班、`:552`只讀p.uid；回傳不含他人答案、成績或teacherNote；Firestore規則維持預設全拒 |
| 送出後不能更改、重送原答案、結束3秒寬限 | PASS | `zuvioExams.ts:568`至`:612`交易、班級及教師送出拒絕、時間窗；新增後端測試1通過 |
| 封存考卷時情緒一併封存 | **FAIL：V2** | current指標仍開放，讀／寫未阻擋已封存考卷 |
| 課堂互動建立場次、開考時間預設現在、開啟時啟動輪詢 | PASS（靜態） | `ClassroomInteraction.tsx:1138`建立場次帶startsAt；`zuvioExams.ts:460`至`:465`延長既有輪詢3小時；`:438`預設10分鐘 |
| 場次即時應填／已填及五狀態人數 | **FAIL：V3** | 聚合不含個資，但狀態／分母會錯場 |
| 學生選取、確認、回饋、無略過鈕、結束消失、手機規範 | PASS（既有新增測試＋靜態） | `ZuvioMoodCard.tsx`、`App.tsx:2108`以下；UI2項通過，含390預設／1.3倍、錯誤／重試／完成。未做教師手機實點，未重新驗所有App路由 |
| 練習只計本卷題、班級／次單元、receivedAt早於startsAt | PASS（純函式／查詢界線） | `zuvioExt.ts:334`至`:407`、`zuvioExams.ts:713`至`:749`；F1／F2／F9通過，與V1真實名冊映射FAIL分開 |
| 實際名冊能串至attempts／progress | **FAIL：V1** | 生產匯入不保證uid，夾具額外uid使舊測試未捕捉 |
| 練習快取、開考時間更新失效、未來不定稿、超量標不完整 | PASS（現有測試） | `zuvioExams.ts:274`至`:293`、`:681`至`:795`；V1錯誤舊快取的修復仍須補 |
| P、前後27%D、扣該題點二系列、KR-20、SEM、SD、提醒 | PASS | `zuvioExt.ts:143`至`:310`；P用全體含未答，D各組round(n×.27)，rpb以correct−該題作相關，KR20用題分人口變異、SD為樣本SD；低樣本與提醒測試通過 |
| W8去識別夾具第30題 | PASS | 本輪輸出n35、P=.2000、D=.2222、rpb=.2141；高組C=5、正解D=2，標太難／疑似錯鍵；整卷KR20=.8782、SEM=9.87。不附題目原文 |
| 單場／多場合併、兩場情緒配對、未匯入不當成低分 | PASS（抽查） | `zuvioExams.ts:855`至`:968`、`zuvioExt.ts:611`至`:712`；F7／R7通過。多場樣本為學生場次筆數，非唯一學生數 |
| 關心名單、80%門檻、遮名、同課程跨卷最近場次 | PASS（規則／既有新測試） | `zuvioExt.ts:760`至`:845`、`zuvioExams.ts:1008`至`:1097`；B1／B2／C1通過；真實練習資料錯誤仍受V1影響 |
| 具名／去識別／試題分析CSV、逐題練習與對錯、公式防注入 | PASS（欄位及防護） | `zuvioExt.ts:848`至`:975`文字一律單引號及雙引號跳脫；`zuvioExams.ts:1157`至`:1181`具名檔名含個資、去識別採同reflectionSalt及同HMAC輸入。真實練習欄位正確性仍受V1影響 |
| 試題分析匯入時計算一次並存場次摘要（v3四之三F） | **FAIL：D1規畫偏離** | `zuvioExams.ts:384`只存匯入metadata；`:870`、`:1122`每次呼叫analyzeExam，未見分析摘要快取。須補實作或取得明確裁定，不將此寫成已完成 |
| 批次B／第三期延後項 | PASS（範圍） | C2平台首答比較、D累積題目表現／待複核頁及第三期不列本輪缺陷；保留正式成績與題庫不變 |

## 本輪實際執行

環境：macOS／Node22.23.2。只執行本次擴充的三個測試檔；後端使用第三棒已編譯的lib，`50ddfdd7..fe9c31b9`只有文件差異，未再build。

| 指令 | 結果 |
|---|---|
| `node --import tsx --test tests/zuvio-ext.test.ts tests/zuvio-mood-ui.test.ts` | 沙箱內純函式12通過，UI2因Chromium MachPort Permission denied啟動失敗；不是斷言失敗 |
| `node --import tsx --test tests/zuvio-mood-ui.test.ts`（獲准沙箱外） | UI2／2 PASS、0 fail、0 skipped；兩測試均finally關閉瀏覽器 |
| `node --test functions/tests/zuvio-ext.test.cjs` | 後端7／7 PASS、0 fail、0 skipped |
| 唯一測試總數 | **21項PASS**；不重複累計UI重跑，不把第一次沙箱失敗隱去 |
| 合成memoryDb重現V1–V3 | 3項缺陷均重現，重播退出0表示成功產出觀察結果，不表示產品通過 |
| 變更程式／測試／腳本的`grep -nHE '/Users/\|/private/tmp'` | 0命中（grep退出1）；未掃文件中的證據位置。repo外重播腳本亦無個人／macOS暫存路徑 |
| 核心擴充檔`git diff --check 5e649242..HEAD -- ...` | PASS；不重寫既有CSV CRLF或他人文件 |

## 證據與限制

repo外證據位於本次Codex附件目錄`zuvio-ext-review/`（本對話visualizations資料夾）：`manifest.json`記基準與6個受審檔SHA-256；`replay.cjs`借用既有memoryDb／setup且跳過測試註冊，不修改原測試；`replay-result.json`只有合成觀察值。可用`node <證據目錄>/replay.cjs <本工作樹>`重現，需先依lockfile準備依賴並完成Functions編譯。測試原始輸出見本輪工具執行記錄；`verification-results.json`為人工整理的結果摘要，不宣稱為原始日誌。

可直接開啟：[重播腳本](/Users/HHC/.codex/visualizations/2026/11/23/01a2076d-5cc2-7db0-9bdb-be044e399fb4/zuvio-ext-review/replay.cjs)、[三項實際重現結果](/Users/HHC/.codex/visualizations/2026/11/23/01a2076d-5cc2-7db0-9bdb-be044e399fb4/zuvio-ext-review/replay-result.json)、[檔案指紋](/Users/HHC/.codex/visualizations/2026/11/23/01a2076d-5cc2-7db0-9bdb-be044e399fb4/zuvio-ext-review/manifest.json)、[測試結果摘要](/Users/HHC/.codex/visualizations/2026/11/23/01a2076d-5cc2-7db0-9bdb-be044e399fb4/zuvio-ext-review/verification-results.json)。

本棒無新增截圖、無目視看圖；截圖保存至 **2026-11-30**（僅沿用第三棒期限，本棒未產生）。本輪repo外重播與摘要亦保存至同日。prune dry-run可刪0個日期／0MB，未刪資料。Linux非root、emulator、正式服務、真實手機未驗，不列PASS。後續修正後仍要交3.8完整實跑、Codex複審，最後才由Claude跑Linux驗收。

收工檢查：根目錄`check_handoff.py` PASS（handoff2493／4000、queue25／25、週誌合規）；佇列其他列雜湊不變，僅#65改為可做／Antigravity（下一步指定Hydrogen）；本週短誌已寫。21份變更程式／測試／腳本路徑grep零命中，工作樹僅本報告新增，受審程式／測試指紋未變。

## 交給下一個 AI

```text
【模型：Hydrogen】對象：Antigravity｜佇列#65，修正後重新走第3、4、5棒。
目標：修好EXT_CODEX_VERIFY.md的V1–V3，處理D1規畫偏離，補能捕捉真實整合問題的回歸測試。
背景：根目錄課程平台1.0；工作樹.worktrees/zuvio-exams，feature/zuvio-exams／fe9c31b9，程式基底50ddfdd7，相對origin/main 5e649242。
先讀根目錄handoff.md、CODEX_QUEUE.md #65、docs/AI_WORKFLOW_PLAN.md、CODEX_TASK_zuvio-ext_2026-11-13.md第2、4、5節、docs/zuvio-exam/MOOD_CHECK_PLAN_2026-11-13.md v3；工作樹讀EXT_CODEX_VERIFY.md、EXT_FIX_REPORT.md、MAIN_MERGE_REPORT_2026-11-23.md、EXT_TEST_RUN_2026-11-23.md。
V1：依正式名冊email解析UID；無enrollment.uid但有考前attempt／progress時須算正確；修復版需使錯誤定稿快取失效，不改正式名冊。參考既有statsRoster／profiles映射，保持跨班及時間界線。
V2：先開快篩再封存考卷，學生須不再取得有效卡片或成功新增情緒；處理交易競態，保留歷史情緒，封存其他考卷不能誤關目前場次。
V3：getMoodLive回傳state、eligibleCount、counts必須同examId＋sittingId；補A場2人已填且關閉、B場1人開放後回查A場等案例。
D1：v3四之三F要求匯入時計算與存摘要，目前每次report／CSV重算；補具版本／結果代次失效的快取，或交Claude取得明確裁定並記錄，不能自行忽略規畫。
限制：先確認分支與git status，保留本報告及他人工作；不push、不合併main、不部署、不改題庫／reviewed／圖檔／正式學生資料、不放寬檢查；不自行改版本。暫存用os.tmpdir()/RUNNER_TEMP。
完成標準：實作者只跑相關測試，報告逐項修法與證據；#65改停-等Antigravity，由Gemini3.8新對話跑完整check，再交Codex複審；未經複審不直接交Claude放行。只改根目錄#65，寫週誌，check_handoff.py須PASS。
每棒回覆末尾同樣附獨立可貼的交棒prompt。
```
