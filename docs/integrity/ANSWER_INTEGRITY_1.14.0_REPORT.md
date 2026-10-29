# 作答時間統計、離開畫面偵測與使用情況 1.14.0：完整版

## 給 Claude 的摘要
- 結果：**Codex 自檢 PASS，停-等Claude**，交 Claude 獨立驗收；未 push、部署或寫正式資料，未製作學生公告。
- 分支 feature/answer-integrity，worktree `.worktrees/answer-integrity`；起點 origin/main f01f9a09，根目錄分支未切換。
- 完成正式 visibility／blur 偵測、後端不列成績、教師個人／班級時間統計與三項調整。
- 同時完成任務文末 10/30 00:00 使用情況：28 天每日／每週人數、時段熱度、截止比例、最近10分鐘；無 GA、新心跳或新增學生追蹤。
- 核心檔：shared/answerIntegrity.ts、src/leaveTracker.ts、src/LeaveTracking.tsx、functions/src/answerIntegrity.ts、functions/src/index.ts。
- 教師畫面：src/AnswerIntegrityPanel.tsx、src/ClassUsagePanel.tsx、shared/usageStats.ts、functions/src/usageStats.ts；版號同步1.14.0。
- 乾淨clone npm run check：261＋94全過、0 failed／0 skipped；version:check 1.14.0；Emulator＋正式元件 PASS。
- 截圖／原始輸出在 repo 外 `課程平台-驗收證據/2026-10-30/answer-integrity-full/`，保存至2026-11-06。
- 偏離：無功能省略；真實 Firestore Emulator＋callable .run，非遠端／Functions HTTP Emulator；手機為390×844瀏覽器模擬。
- 抽查1–5：門檻與舊紀錄、教師權限、CV／排序、使用情況口徑及讀取成本、部署清單。

## 範圍與實作

正式學生 Quiz 在完整單元測驗監聽 visibilitychange、blur、focus，以單一離開區間去重；回到畫面才顯示次數及秒數。手機 visible 時即使沒有 focus 也會結束該區間。以 performance.now 累積，秒數向上取整；交卷／結束卸載即移除監聽。

第3次回來顯示「再離開1次」，累計≥45秒預警；兩者同時符合會同時說明。參數集中 ANSWER_INTEGRITY，修改門檻時提示與判分一起變動。提示可鍵盤關閉，焦點限制在對話框內；390寬無水平溢出。

伺服器依私有答案表重批並確認 full，再清除客戶端 integrity、驗證 leaveCount／leaveSeconds 型別和範圍，最後自行決定 integrity:'left-screen'。僅單元完整 quiz 超過3次或60秒才不列成績。3次／60秒仍有效；4次或61秒無效。練習次數及完整作答次數照計、答案照存、錯題更新照舊；best與passedAt不提高，原有達標保留。結果頁照看分數與解析，附原因及「再作答一次」。

沒有離開欄位的舊資料保持有效，不做回溯寫入。只給一個欄位、字串／負數／NaN／過大值、離開秒數大於總作答時間+2秒等會拒絕；客戶端不能自行送有效／無效標記決定結果。這仍是瀏覽器端回報，並非防竄改監考機制；相容舊客戶端的缺欄位資料不會自動作廢。

其他模式：抽題、錯題、綜合、複習考只記錄離開，不因離開作廢。純閃卡不交卷，使用 recordPracticeLeaves 留 session metadata；不建立分數，不動 progress。離開閃卡或完成時儲存，失敗提示可重試；直接關閉分頁未保證傳送。API preview 不寫。未新增第三方分析追蹤。

每題秒數改為每次停留累加，跨題返回不覆蓋前值；自動交卷讀目前題目 ref，避免計入初始題。統計偏快僅是教師線索，不會自動取消成績。

## 教師統計與權限

getAnswerIntegrityStats、getClassUsageStats 先經現有 access(...,true) 確認教師及課程 teacherIds，不能只靠前端隱藏。班級須屬已發布課程，test排除；個人查詢另驗證屬該班名冊，停用及test成員排除。舊名冊沒有uid時由profiles email解析、uid去重。前端換班／個人後丟棄舊請求結果。

時間統計僅算單元完整quiz，不含review單元、其他模式、test班。平均以作答總duration除總題數，包含離開；duration不可用則以完整answers.seconds備援；首次按clientAt及id排序。全班中位數取每位有資料學生的平均；最高有效分數讀正式progress保留舊制成績，統計不重算progress。

⚠ 條件為首次100分且符合任一：首次每題平均<全班中位數×2/3；至少8題且每題seconds完整、母體變異係數CV<0.25。缺秒數或零平均不判CV，等於邊界不標記。hover／focus分別寫偏快／每題時間平均，明示僅供查看、不代表作弊。可依平均、首次平均、次數、最高有效分數及學生排序；空值置後。「只看有標記」為⚠或有未列成績紀錄的聯集。

兩個統計callable只讀既有資料、無快取寫入。Firestore原有規則未放行attempts、practiceLeaves或新統計集合，學生不能直接讀老師統計資料。不存在可讓學生讀取的聚合快取。

## 使用情況口徑、限制與成本

新增教師全班總覽上方「使用情況」，沿用班級選擇、預設收合，展開／手動刷新才讀，沒有輪詢。台灣時間含今日近28個日曆日；每日按uid去重，週一開始的每週再去重，首尾週僅計視窗範圍。時段為星期一至日×12個兩小時格。

來源為目前實際 schema：courses/{course}/attempts、diagnostics/{summary}/events（saveLearningEvents寫入的事件）、progress.activities[].updatedAt。並無獨立learningEvents集合，故不查不存在的集合。作答優先receivedAt（Firestore Timestamp），無則clientAt；教材事件優先receivedAt；活動進度只取已有updatedAt。不新增心跳或追蹤事件。近10分鐘名單按最新既有事件估計，顯示產生時間，明示不代表仍在線上。

活動進度只存最新timestamp，無法補出每次歷史使用；缺timestamp不推估。每日／每週人數不因同學生多事件重複計算，熱度則明示為紀錄筆數，同一活動可能同時有教材事件及進度紀錄。截止前24小時比例分母為28天該單元作答數，含未列成績作答；無分母顯示尚無作答，不捏造0%。無截止時間不列。複習考不列入使用情況。

讀取估算（均另加現有權限、課程讀取與空查詢最低計費）：
- 時間班級統計：M份該單元作答＋N名冊＋最多N profiles＋N progress，約M+3N；個人為該生全部作答＋全班名冊/profiles、不讀其餘progress。
- 使用情況：A班級作答＋D教材summary＋E事件＋N名冊＋最多N profiles＋N progress，約A+D+E+3N。先界限查詢、再於記憶體裁28天，故**讀取包含較早紀錄**，不宣稱只付28天的成本。
- 上限：時間作答10000／名冊2000；使用情況作答10000、summary1000、事件合計20000、名冊及profiles各2000。超限回resource-exhausted，不顯示截斷統計。資料成長後若遇上限，下一輪可做教師限定日彙總；本輪未寫快取或backfill。
- 假資料實測時間統計 attempts4+roster/profiles8+progress4=16；使用情況attempts4+diagnostics1+events2+roster4+profiles4+progress4=19，讀取明細附verification.json。

## 驗證命令與證據

```sh
# Node 22.23.2；下列均本機執行
npx tsx --test tests/answer-integrity.test.ts tests/usage-stats.test.ts
npm --prefix functions run build
npm --prefix functions test
firebase emulators:exec --only firestore --project demo-answer-integrity-full \
 'node scripts/answer-integrity-full-verify.mjs --out /tmp/codex-answer-integrity-full/ui'
# 乾淨 clone，無 node_modules、無私有路徑設定
unset REVIEW_DECKS_DIR
npm ci
npm --prefix functions ci
npm run check
```

Emulator是實際Firestore及實際規則，使用真實callable handler .run與既有access身份檢查；測試HTTP轉接器僅綁localhost、僅允許白名單API及固定假角色。Firestore client mockUserToken實際驗證學生讀attempts／practiceLeaves被permission-denied。並非遠端部署或假資料庫測試取代Emulator。

Emulator＋Chrome以正式Quiz、StudentDetail、時間總覽、使用情況與Flashcards元件測試（非舊樣張元件）：
- 教師成功；學生、未登入、其他課程教師被拒。非法leaveCount字串沒有落地attempt。
- 真實瀏覽器事件依序離開1／1／43／16秒；hidden與blur共用區間，不重複計數。第三次45秒預警、手機390提示、第四次61秒送出。
- 伺服器重批100分且保存integrity，progress best80、attempts2、無passedAt；結果頁停止監聽。
- 純閃卡leaveCount1只存practiceLeaves；progress次數仍2。
- ⚠／無效聯集篩選得到3列，平均欄升降排序比對數值，偏快／平均原因可查看。
- 使用情況今日／昨日事件依台灣日期分桶、近10分鐘1人，排除test事件。
- 瀏覽器pageerror 0。手機為Chrome390×844模擬，未宣稱已在實體手機驗證。

### 最終實際輸出

實作提交 **71353b3c**；乾淨clone `/tmp/codex-answer-integrity-full-clean` 先npm ci與functions ci，依賴安裝後從83e55172快轉至71353b3c（lock無變更），unset REVIEW_DECKS_DIR後從頭跑完整檢查。git status --short無追蹤檔變動。

```text
npm ci: exit 0，added 168 packages
npm --prefix functions ci: exit 0，added 267 packages
npm run check: exit 0
後端入口載入通過：57 個函式（未連接雲端）
前端／共用 tests 261 / pass 261 / fail 0 / skipped 0
版本一致：1.14.0
TypeScript + Vite build: exit 0
後端 tests 94 / pass 94 / fail 0 / skipped 0
定向 answer-integrity + usage-stats: tests 10 / pass 10 / fail 0 / skipped 0
真實 Firestore Emulator: pass true / errors []
invalidAttempt: leaveCount 4 / leaveSeconds 61 / score 100
progress: best 80 / attempts 2 / passedAtPresent false
studentUnauthForeignTeacherDenied true / rulesStudentReadsDenied true
usageStats true / flashcardRecordOnly true / sortingAndFilter true
timeoutCurrentQuestionTiming true
```

驗證過程找出並修正CSS入口相容性，以及開始測驗的重複路由載入重置問題；原失敗輸出與中止舊版本測試的輸出保留為before-*及regression紀錄。CSS改由main入口載入，僅再作答時重置Quiz；使用說明回歸1/1通過，最終乾淨clone全套如上。另以瀏覽器計時器驗證停在第2題自動交卷，秒數確實記到第2題，不回寫至初始題。

npm ci的既有audit提示與Vite大chunk提示保留在原始輸出；本輪未新增依賴或跳過檢查。

### 截圖與檔案

證據根目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/answer-integrity-full/`，截圖保存至 **2026-11-06**。

| 檔案 | 內容 |
|---|---|
| ui/01-profile-1920.png | 正式個人檔案新增時間行 |
| ui/02-class-flags-1920.png | sortable總覽與CV原因tooltip |
| ui/03-third-leave-warning-1920.png | 第3次及45秒雙預警 |
| ui/03-third-leave-warning-390.png | 390×844提示無溢出 |
| ui/04-invalid-result-1920.png | 100分照看、超限不列成績、可再作答 |
| ui/05-usage-1920.png | 28天人數、週去重、熱度、近10分鐘（1920寬長圖） |
| ui/verification.json | 真實Emulator數值與權限結果 |
| unit.log、functions-unit.log、emulator-ui.log | 定向測試與Emulator實際輸出 |
| clean-npm-ci.log、clean-functions-ci.log、clean-check.log | 乾淨clone安裝及全套驗證輸出 |
| SHA256SUMS.txt | 證據檔案hash清單 |

## 部署清單（僅供教師核准後執行，本輪未執行）

版本1.14.0；Functions codebase為platform，Firebase專案ap2-7ed91。先完成Claude獨立驗收、教師確認上線，再從本worktree執行。不要切根目錄main。

1. Firestore indexes新增3個複合索引：attempts classId+unitId、attempts classId+uid、enrollments courseId+classId；先部署並等索引就緒。
2. 後端先上線：submitAttempt、submitMixedAttempts、getAnswerIntegrityStats、getClassUsageStats、recordPracticeLeaves。
3. 最後教師推前端（push main會自動上線）。

```sh
firebase deploy --project ap2-7ed91 --only firestore:indexes
firebase deploy --project ap2-7ed91 --only functions:platform:submitAttempt,functions:platform:submitMixedAttempts,functions:platform:getAnswerIntegrityStats,functions:platform:getClassUsageStats,functions:platform:recordPracticeLeaves
git push origin feature/answer-integrity:main
```

無Storage／Firestore rules變更、無migration、無GA、無公告。併main前須確認遠端最新提交可快轉並整合其他已核可工作；本報告不授權push。若分支已有其他未部署變更，教師應依其部署報告一併確認。

## 提交與獨立驗收

實作提交83e55172，CSS入口修正c65d3c6a，路由重置與超時計時驗證71353b3c；最終文件提交僅補報告，無實作變更。原樣張保留於提交523abaef及既有外部10/29證據；本報告取代舊樣張報告的現況。#39仍獨立分支，本輪僅更動StudentDetail時間行與CompletionBoard統計掛載，未整合#39題目管理。
