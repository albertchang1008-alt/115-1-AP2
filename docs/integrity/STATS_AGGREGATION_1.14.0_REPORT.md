# 1.14.0 統計彙總追加驗收

## 給 Claude 的摘要
- #40接1f93c0ec，完成01:04追加；版本維持1.14.0，根目錄分支未切換。
- 作答時間改為既有progress交易累加；教師查詢只讀N份progress，學生回應剝除timing。
- usageDaily台灣03:10排程、當日receivedAt即時查詢；completionDaily＋教師立即更新、MCP優先摘要。
- dailyReports迴圈清空或預留60秒，jobs/aggregate記積壓；研究證據classId+unitId分頁，超限報錯。
- rebuildStats預設dryRun、planHash＋confirm才套用；教師有預覽／取消／確認按鈕、自動分批續跑。
- 實際AP2唯讀：dailyReports欄位不存在（不是true），未修改正式開關，未讀學生資料。
- 自檢PASS：乾淨clone 264＋98全過、0 failed／0 skipped；Emulator累加＝重算、229份報表與2109筆研究追蹤PASS。
- 新集合usageDaily／completionDaily／statsPrivate學生讀寫皆拒絕；正式資料零寫入、不push／部署／公告。
- 偏離：無；歷史活動僅存最新時間，無法重建過去每次開啟；缺摘要明示待補算，不冒充無活動。
- 抽查：shared/timingStats.ts、functions/src/statsAggregation.ts、reportDrain.ts、usageStats.ts、外部aggregation-verification.json。
- 1920新圖與原始輸出在repo外2026-10-30/stats-aggregation，保存至2026-11-06。

## 實作與一致性

shared/timingStats.ts提供同一個addTiming給交卷累加與重算。submitAttempt由後端重批並確認full後，隨既有progress交易寫入timing；submitMixedAttempts非完整，不增加完整測驗的timing。沒有新增每份交卷的寫入次數。統計包含未列成績的完整單元quiz，保留既有best／passedAt政策、練習次數及錯題處理；review、抽題、錯題及綜合不混入完整測驗時間。

timing含schema、classId、complete、總秒數／題數／作答數、首次id／clientAt／分數／秒數／題數／CV、離開次數／秒數、未列成績數。首次以clientAt及id決定，亂序重送與同時戳記也有穩定結果。新作答UID／classId由後端覆寫；班級變動時標為待補算，避免跨班沿用平均。無timing的舊進度若已有作答，首次新增只標partial，教師畫面明示歷史待補算，不能以部分值標⚠。

getAnswerIntegrityStats改讀教師限定名冊對應快取及progress，無attempt查詢；中位數、CV與排序／篩選維持原規則。學生getProgress、submitAttempt（含duplicate）、submitMixedAttempts及saveReflection回應剝除timing；Firestore直接讀仍全部拒絕。

## 每日摘要與當日查詢

- 新dailyStats：Asia/Taipei每天03:10，使用前一天日期覆寫usageDaily；同一排程更新completionDaily。與03:00 dailyReports錯開。test及archived課程略過，錯誤或時間不足記jobs/stats_{class} pending與error，方便教師發現待重跑。
- usageDaily/{classId}_{yyyymmdd}存日期、去重uid、12個兩小時筆數、各次單元作答與截止前24小時數。每天覆寫，重跑不加倍；週人數用每日uid聯集，不能把每日人數相加。
- 面板讀27份歷史摘要，加今天即時計算，共28天；午夜前10分鐘跨日查詢會往前延伸，最近活動再依10分鐘篩選。缺歷史摘要顯示待補算，圖表零值不被宣稱為已驗證無活動。
- attempts以classId＋receivedAt Timestamp範圍查詢；教材summary以classId＋updatedAt找近期父文件，events以receivedAt毫秒範圍查詢；活動progress以classId＋activityUpdatedAt查近期文件，再篩已有activities.updatedAt。
- activityUpdatedAt在既有saveActivity／saveLearningEvents完成／saveReflection寫入中同步更新，不增加學生端事件或心跳。舊資料補算時讀原有activities.updatedAt補索引；沒有時間戳記不推估。
- 活動進度只有最新時間；歷史補算不能還原被覆蓋的多次活動。熱度明示為紀錄數，同一活動可能有事件及進度兩種紀錄。統計排除複習考及test，沿用原範圍。

completionDaily/{classId}存各次單元已達標／待完成／逾期、既有看板比較摘要、MCP章完成度摘要、課程指紋與更新時間。未登入但啟用的學生也算待完成。看板頂部新增摘要面板，先按「查看班級摘要」只讀摘要；「立即更新班級摘要」才掃目前名冊及progress並覆寫。逐人看板仍原50筆分頁。交卷不即時重算班級完成度，畫面明示更新時間。

MCP getCompletionSummary優先讀有效指紋的摘要；沒有摘要時保留既有完整查詢相容路徑。課程發布內容或名冊修訂不同，摘要失效；超過一天仍顯示其時間與stale，教師可立即更新。

statsPrivate/roster_{class}保存email→uid、有效名冊與未登入資料，僅教師後端使用；24小時到期、名冊更新及sync/status最後名冊同步時間改變會失效。有尚未解析的帳號不沿用快取，避免學生新登入後仍無uid。getCompletion分頁共用對應，不再每頁查profiles。

## 補算操作與併發

教師在班級完成度摘要按「預覽補算統計」。rebuildStats省略dryRun即true，讀取計畫但不寫任何文件，回傳文件數、每批名冊讀取與來源上限估算、planHash。

「確認補算本班統計」送dryRun:false、confirm:true、原planHash；每批最多5個工作，UI用3個，自動帶nextCursor直到null。工作順序：每位已登入學生timing→28天usageDaily（含今日）→completionDaily與名冊快取。單班計畫文件數＝N份progress＋28份每日摘要＋1完成度＋1對應快取。沒有補算全課程或自動寫正式資料；教師逐班操作。planHash綁課程、班級、名冊及日期範圍，變動須重新預覽。

重算只替換timing、補activityUpdatedAt；best、passedAt、作答次數與答案不動。先讀學生progress基準，再分頁讀該生本班全學期attempts；寫入交易重新比對作答數與updatedAt。有新交卷會回aborted，重試相同cursor，避免蓋掉新累加。每批途中失敗可重試或重跑已完成工作；覆寫與首次穩定排序保證冪等。

來源上限明確拒絕，不截斷：每生補算50000份attempt、使用情況單批10000份attempt／2000份summary／20000事件／2000progress；名冊2000。研究資料5000份、研究attempt50000、診斷各查詢5000。超出上限本次回resource-exhausted，教師需另規劃分段處理。

## dailyReports與研究證據

已在2026-10-30 01:14台灣時間，以Firebase CLI既有登入做單一Firestore GET，field mask只有dailyReports。回傳：

```json
{"courseId":"115-1-AP2","dailyReports":null,"fieldPresent":false,"method":"GET single course document; mask=dailyReports; writes=0"}
```

因此正式AP2目前不會被dailyReports==true排程選中。本輪沒有幫教師開啟；若要題目統計每天自動更新，須教師另外決定開關。原始唯讀結果ap2-dailyReports-readonly.json。

dailyReports排程仍03:00，timeout540秒、處理預算480秒，保留60秒。每批20份，反覆aggregateBatch到清空或預算到；各課程jobs/aggregate回報processedRun、batches、backlog、timedOut、error。backlog用Firestore count聚合，並非只看最後一批長度。課程查詢也分頁、超過500明確報錯。單課失敗留錯誤及積壓，其他課程可繼續；updateReports手動單批功能保留。

getExplanationResearchEvidence的research及attempts改classId＋unitId、__name__穩定分頁；診斷依classId＋unitId及classId＋chapterName分兩路、按id去重。移除無排序limit2000及先整班篩單元的讀法。大於上限明確失敗，不回部分證據冒充完整。真實Emulator 2109份追蹤作答完整回傳。

## 成本前後比較

定義N為有UID學生、R為名冊（含未登入）、M為歷史作答、D為教材summary、E為事件；A₀/D₀/E₀/P₀為當日範圍結果。讀取計費另含權限／課程讀取、空查詢最低計費與index entry；下列是文件數估算，不宣稱帳單精確相同。

| 查詢 | 追加前 | 彙總後 |
|---|---|---|
| 時間統計整班 | M＋約3N | 對應熱快取2＋N progress；不讀attempts |
| 時間統計個人 | 該生全部attempt＋約2N | 對應熱快取2＋1 progress |
| 使用情況28天 | 整班歷史A＋D＋E＋約3N，另受10000上限 | 27摘要＋熱快取2＋A₀＋D₀＋E₀＋P₀；當日超限仍明確錯誤 |
| 完成度摘要／MCP | 約R＋profiles＋N progress | 有效摘要1份；立即更新／每日掃一次R＋profiles＋N並寫摘要 |
| 逐人完成度明細 | 每頁名冊＋profiles＋progress | 每頁名冊＋快取2＋progress；冷快取需額外建名冊對應 |
| 題目統計排程 | 最多200份，積壓隨日增加 | 讀實際待處理份數到清空／時間預算，另count積壓 |

假資料實測：時間統計原16份→6份（attempt0、roster/cache2、progress4）；使用情況原19份→31份（27摘要、cache2、當日summary1、event1）。小資料摘要固定成本可能較高；優勢在歷史累積後不反覆讀全部事件。例如N=60、歷史A=20000/D=2000/E=50000，原約72180份且會碰上限；若當日A₀=100/D₀=5/E₀=150/P₀=10，新約294份，不含權限及查詢最低計費。

寫入成本：交卷progress本就寫，不增加次數；每日每班usage1＋completion1＋名冊對應最多1，再加jobs狀態。首次補算一次性N＋30份文件；每批重新驗證名冊，若有未登入帳號尚無對應，會多讀profiles，估算於dryRun及各批回報，不把最壞來源上限當預期用量。無GA、無新增學生端追蹤。

## 驗證與證據

實作提交 **5af58b0a**；獨立全新clone `/tmp/codex-stats-aggregation-clean` 從該提交安裝兩端依賴，unset REVIEW_DECKS_DIR後執行檢查。版本維持1.14.0，clone追蹤檔無變更。

```text
worktree npm run check: exit 0
clean npm ci: exit 0
clean npm --prefix functions ci: exit 0
clean npm run check: exit 0
前端／共用 tests 264 / pass 264 / fail 0 / skipped 0
後端 tests 98 / pass 98 / fail 0 / skipped 0
版本一致：1.14.0；TypeScript＋Vite build PASS
入口檢查63個已列函式可載入（未連雲端）
定向共用測試13 / pass13 / fail0 / skipped0
realFirestore true / incrementEqualsRebuild true / replayIdempotent true
concurrentRebuildAborts true / dryRunNoWrites true / scheduleIdempotent true
evidenceFollowUp 2109 / evidenceNoTruncation true
reportsProcessed 229 / reportsBatches 12 / reportsBacklog 0
studentRulesReadWriteDenied 6 / teacherOnlyCalls true
個人時間 reads: attempts0 / roster-cache2 / progress1
班級時間 reads: attempts0 / roster-cache2 / progress4
completionSource: completionDaily
```

指令：`npm run check`；`firebase emulators:exec --only firestore --project demo-stats-aggregation 'node scripts/answer-integrity-full-verify.mjs --out /tmp/codex-stats-aggregation/ui && node scripts/stats-aggregation-verify.mjs --out /tmp/codex-stats-aggregation'`；另跑獨立aggregation腳本確認getProgress剝除timing。

初次Emulator驗證找到缺省Chapter.dueAt會把undefined寫入摘要，已在摘要序列化移除缺省欄位後重跑PASS；其餘一次是假作答漏correct欄位，補齊符合既有API格式後重跑。最終驗證結果如上。npm ci既有audit提示與Vite chunk提示完整留在log；未新增依賴或略過測試。

實際Emulator使用demo-stats-aggregation，handler .run＋真實Firestore與真實規則（非Functions HTTP Emulator）。用同批經submitAttempt重批的假作答比對timing；重送ID不增加統計、首次同時戳記按ID穩定。於重算scan後插入真實交卷，aborted後重試一致。dailyStats重跑同日資料相同（比較去除generatedAt）。dailyReports實際12批處理229份、backlog0。新集合usageDaily／completionDaily／statsPrivate各測學生讀與寫被permission-denied，共6項。

證據目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/stats-aggregation/`，保存至2026-11-06。
- ui/05-usage-1920.png：摘要＋即時當日使用情況。
- ui/06-completion-daily-1920.png：完成度摘要與立即更新。
- ui/07-rebuild-preview-1920.png：教師補算預覽；另驗證取消及確認後分批完成。
- ui/verification.json、aggregation-verification.json：實際數值與權限結果。
- ap2-dailyReports-readonly.json：正式AP2僅開關欄位唯讀。
- emulator-final.log、shared-tests.log、functions-tests.log、check.log、clean-check.log：實際輸出。
- SHA256SUMS.txt：證據清單。

## 新部署清單（取代上一輪清單；本輪未執行）

1. 教師先等Claude驗收，確認最新origin/main並整合；版本維持1.14.0。
2. 部署firestore:indexes，等待就緒：本輪新增attempts classId+receivedAt ASC、diagnostics classId+updatedAt、progress classId+activityUpdatedAt、research classId+unitId、diagnostics classId+unitId、diagnostics classId+chapterName；前輪三個索引仍保留。
3. 部署以下後端（包含原1.14.0待部署部分），先後端後前端。
4. 教師推前端，再逐班按預覽補算→確認。不要在本輪自動補算正式資料。AP2 dailyReports是否啟用另由教師決定。

```sh
firebase deploy --project ap2-7ed91 --only firestore:indexes
firebase deploy --project ap2-7ed91 --only functions:platform:submitAttempt,functions:platform:submitMixedAttempts,functions:platform:getAnswerIntegrityStats,functions:platform:recordPracticeLeaves,functions:platform:getClassUsageStats,functions:platform:getCompletion,functions:platform:getCompletionSummary,functions:platform:getCompletionDaily,functions:platform:rebuildStats,functions:platform:dailyStats,functions:platform:dailyReports,functions:platform:getExplanationResearchEvidence,functions:platform:saveActivity,functions:platform:saveLearningEvents,functions:platform:saveReflection,functions:platform:importRoster,functions:platform:migrateRoster,functions:platform:syncRoster
git push origin feature/answer-integrity:main
```

規則仍以既有預設拒絕保護新集合，無需新增客戶端放行；無Storage改動。未切換根目錄分支、未push／部署、未寫正式資料、未做公告。對正式環境唯一讀取是AP2 dailyReports單欄，未讀名冊或作答。
