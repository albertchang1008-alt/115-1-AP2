# 作答誠信、使用情況與統計彙總 1.14.0

## 給 Claude 的摘要
- #40完整版及10/30 01:04追加已實作；自檢PASS，交Claude獨立驗收，不push／部署／公告。
- 分支feature/answer-integrity，worktree `.worktrees/answer-integrity`；根目錄分支未切換，版本1.14.0。
- 離開>3次或>60秒：作答照存、分數解析照看，不提高best／passedAt，次數照計；舊紀錄不回溯。
- 教師個人及班級時間統計、首次100分且偏快或CV<0.25提示、排序與聯集篩選均保留。
- 01:04追加改為progress.timing交卷累加、usageDaily每日＋當日、completionDaily＋立即更新、rebuildStats預覽確認。
- dailyReports改迴圈與積壓紀錄，研究證據完整分頁；AP2正式dailyReports欄位不存在，僅唯讀回報未改開關。
- worktree及乾淨clone全套264＋98全過，0 failed／0 skipped；真實Emulator累加＝重算、229份報表及2109份研究追蹤PASS。
- 詳細新報告：docs/integrity/STATS_AGGREGATION_1.14.0_REPORT.md（成本、補算步驟、新部署清單以此為準）。
- 新證據：repo外2026-10-30/stats-aggregation；1920新圖、390離開提示、實際輸出保存至2026-11-06。
- 偏離：無；手機為390×844瀏覽器模擬、Emulator使用實際handler .run，未宣稱遠端Functions HTTP或實體手機驗證。
- 抽查：離開門檻／舊成績、timing保密與一致性、日期摘要與成本、補算預覽／確認、排程與研究證據。

## 已完成的學生與教師流程

Quiz以visibilitychange、blur／focus追蹤單次離開區間；hidden＋blur不重複計次。手機visible時可結束區間，即使沒有focus事件。交卷或離開元件停止監聽。

第三次回來提示「再離開1次」；累計≥45秒預警，兩者可並列。門檻統一在shared/answerIntegrity.ts；3次／60秒有效，4次或61秒才不列成績。學生結果頁照看分數與解析，附原因及再作答按鈕。原有best、passedAt保留；舊缺欄位作答有效，不回溯作廢。

submitAttempt依私有答案重批、確認full、清除客戶端integrity後自行判定；離開欄位驗型別與合理範圍。其他模式（抽題、錯題、綜合、複習考）只記錄，不因此作廢。純閃卡以recordPracticeLeaves存session metadata，不寫分數或progress；退出／完成儲存失敗可重試，直接關頁未保證送出。此為瀏覽器端回報，相容缺欄位舊客戶端，並非防竄改監考機制。

教師時間統計只算單元完整quiz，排除test與複習考；平均為總秒數÷總題數，包含離開。首次按clientAt＋id排序；首次100分且每題平均<班級中位數2/3，或至少8題完整seconds且CV<0.25，才標⚠；缺秒數不判CV。偏快／每題平均原因分開說明，明示僅供查看、不代表作弊。標記不直接取消成績；排序與「⚠或未列成績」聯集篩選保留。

## 01:04統計彙總與現況

詳見[統計彙總報告](STATS_AGGREGATION_1.14.0_REPORT.md)。這份追加報告取代1f93c0ec階段的統計讀法、成本及部署清單。

- 作答時間隨既有progress交易累加，不增加交卷寫入次數；個人／班級改讀progress，不掃歷史attempts。學生回應剝除timing，舊進度待教師補算時明示缺資料。
- 每日03:10台灣時間產生前一日usageDaily及completionDaily。使用面板讀27份歷史＋即時今天，最近10分鐘依既有紀錄估計，不新增心跳或GA。
- 看板頂部新增班級摘要、立即更新、補算預覽／取消／確認；逐人看板仍分頁。MCP優先讀有效摘要。
- rebuildStats預設dryRun，確認須planHash＋confirm:true；依cursor分批補本學期timing、28天usage及完成度。未執行正式補算。
- dailyReports預留60秒前持續處理，jobs記積壓；研究證據classId＋unitId分頁，上限明確報錯。
- 正式環境本輪唯一讀取為AP2課程dailyReports欄位遮罩GET；欄位不存在，未修改，也未讀名冊或作答。

## 驗證摘要

實作5af58b0a；最終乾淨clone輸出及文件提交見追加報告。原1f93c0ec階段261＋94是歷史結果，本輪以264＋98與新證據為準。

Emulator仍驗證：第3次45秒預警、4次61秒100分照存而best80／attempts2／無passedAt；學生、未登入及外課教師無統計權限；閃卡不動progress；結果頁停止監聽；當前題目自動交卷計時正確。新增累加＝重算、重送冪等、併發abort重試、排程重跑、229份待處理清空、2109份研究證據、新集合學生讀寫6項拒絕。

證據：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/stats-aggregation/`，保存至2026-11-06。
- ui/01-profile-1920.png、02-class-flags-1920.png：正式個人及班級統計。
- ui/03-third-leave-warning-1920.png及390.png、04-invalid-result-1920.png：離開與結果。
- ui/05-usage-1920.png、06-completion-daily-1920.png、07-rebuild-preview-1920.png：本輪新增流程。
- ui/verification.json、aggregation-verification.json與各測試log：實際輸出。

## 部署與交棒

[新的完整部署清單](STATS_AGGREGATION_1.14.0_REPORT.md)涵蓋本輪及前輪所有待部署函式、索引與教師逐班補算步驟；請勿沿用1f93c0ec舊清單。Claude通過後仍由教師決定push／部署及AP2 dailyReports開關。不切根目錄main，不做公告。
