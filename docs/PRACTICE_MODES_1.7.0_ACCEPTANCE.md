# 1.7.0 ①～④ 待 Claude 驗收

2026-10-06｜分支 `feature/1.7.0-practice-modes`｜基底 `0cca83f`｜未 push、未部署。

依 [第三版規格](PRACTICE_MODES_1.7.0.md) 完成①～④（①～③已由 Claude 驗收通過，④待驗收）。① `b65418b`；② `819b237`；③ `3ed3d7a`；④提交標題「錯題跨版本延續（同步讀舊版比對正解）」。版本檔同步為 1.7.0。七項盤點完整結果在 [handoff](../handoff.md)。

## ④ 錯題跨版本延續

依 [補充規格](WRONG_CARRY_1.7.0.md) 實作，取代主規格第3.6節與盤點第7點第二前提。教師已允許同步讀取舊版 manifest、grading/answers、全部 chunks；新題使用記憶體內容。只有分類改版才比對：正解文字（合併空白）、選項數、題型改變或刪題重置；題幹、解析、干擾項、圖片、題序、正解相同的選項代碼調換保留。

- `wrongCarry` 與新 bankVersion 同交易更新；額外 `wrongCarryOrder` 保存寫入順序，避免 Firestore map 依雜湊鍵排序後錯刪最近版本，最多10筆。舊版讀取失敗寫 `'*'`，同步仍成功；勾選全部重算時直接寫 `'*'`，不讀舊版。
- 共用 `effectiveWrong` 沿最多10段追溯、累積 drop，防循環；新版已實體化（包括空物件）直接使用。n／at／ok／rm 保留、string[] 相容。`wrongEntries` 的 Unit 參數改必填；全專案搜尋確認學生、教師進度與匯出共用路徑都傳 Unit。
- `publishCourse` 與 `forClass` 原本完整展開 Unit，無須補欄位；實際 callable 測試確認兩次草稿同步後發布保留完整鏈。同步不讀寫任何 progress；學生首頁、練習與交卷不新增 Firestore 讀取。首次交卷由私有答案表重批，再透過既有 applyAttempt 實體化新版 wrong，舊版紀錄保留。
- 複習考重建清除延續欄位，維持改版重新計算；部署前未記錄鏈的同步不追溯。日期仍使用 Asia/Taipei 日曆日，綜合練習範圍維持 current。
- 教師核取方塊預設不勾，API 傳 `resetWrong`；每個改版分類顯示延續／全部重算／讀取失敗訊息，未改版不顯示。

新增測試涵蓋補充規格第7節：所有比較條件、單段／多段／中斷／重算／循環／10段界線、最近10筆排序；實際同步／發布／交卷／複習考重建 callable；前後端共用 `tests/fixtures/wrong-carry.json` 比對；React 預設與三種結果。資料庫替身記錄 reads/writes，檢查同步零 progress 寫入、重算不讀舊版、學生交卷只讀新版既有文件。全部測試使用本機合成資料。

## 行為與驗證

- 閃卡正面含選項，可先標記或直接翻面；空白鍵、翻面按鈕、正解文字與焦點轉移；「再看一次」本輪每張最多多排一次。「看了 N 張」計每次翻看，M 計不同卡片。自評只在記憶體，不呼叫提交／研究 API、不寫任何進度。
- 錯題讀取只有 shared `effectiveWrong` 可存取原始版本資料；`wrongEntries` 經它排除 rm，所有首頁、分類狀態、教師學生進度及其完成度匯出走同一路。歷史研究報表的「首次答錯人數」是不可變作答統計，不是錯題清單，維持其原意。
- 所有錯題更新用伺服器重批答案與收到交卷的時間。UTC+8 日界線、同日 ok、隔日 rm、已移除後再錯累加 n、舊 string[]、at:0、passedAt 保留均有純函式測試。實際 callable 測試驗證故意偽造 correct 無效、review 不寫 attempted／成績、混合逐分類更新、複習考拒絕與既有讀取路徑。
- 單元與複習考錯題按鈕開啟畫面內題數列：10／20／30／50，大於待複習數停用，≤50且非檔位顯示全部；先取 n 多、at 早的 N 題再洗牌。手機從既有「練習」選單進入同一題數列。複習考維持沒有閃卡與抽題。
- 只有今天剛錯時提示明天重做，一般分類可轉今天錯題閃卡。錯題複習結果為伺服器回傳的「已移除／仍答錯」，抽題／完整測驗另顯示「移除／今天已答對」。重送採已保存批改與摘要，避免累計重複。
- 時間範圍選單及 range 路由欄位移除，舊網址參數忽略。綜合候選維持 `current && bankVersion && !isReviewUnit`，包括仍在 current 的已達標與選看分類。
- 範圍依首頁單元順序、三態勾選、預設全選／收合、courseId＋uid 本機存排除ID；新增分類預設包含、過期ID忽略、讀寫失敗安全退回。不選分類時全部停用，少於10題時顯示全部。
- 範圍數字只用課程／progress；按練習後僅載選取分類。閃卡今天→待複習→未作答→其他；抽題待複習→未作答→其他（今天錯題不進未作答群）；錯題重做跨分類排序後取N。全部不計分，手機三列、44px觸控與閃卡底部安全區。

完整檢查：每個 commit 前 `npm run check` 與 `git diff --check`，④最終前端134個／Functions26個測試、兩端build、版本一致性與diff檢查全部通過；涵蓋純函式、實際 React 操作、Student 導覽、Functions callable 行為與兩端 build。沒有使用正式學生帳號或正式 Firestore；仍需 Claude 驗收與教師另行決定部署。

## 桌機與手機截圖

使用平台實際 React 元件與本機合成資料（非正式學生資料），桌機1280×900、手機390×844。所有截圖頁面無 JavaScript 錯誤、無橫向溢位。重產：`node scripts/practice-modes-shots.mjs`（Node22／本機Chrome）；機器驗證紀錄 [checks.json](practice-modes-1.7.0-screenshots/checks.json)。

| 狀態 | 桌機 | 手機 |
|---|---|---|
| 閃卡正面 | [截圖](practice-modes-1.7.0-screenshots/flashcard-front-desktop.png) | [截圖](practice-modes-1.7.0-screenshots/flashcard-front-mobile.png) |
| 閃卡翻面（先選錯誤選項） | [截圖](practice-modes-1.7.0-screenshots/flashcard-back-desktop.png) | [截圖](practice-modes-1.7.0-screenshots/flashcard-back-mobile.png) |
| 錯題複習題數選擇 | [截圖](practice-modes-1.7.0-screenshots/wrong-choices-desktop.png) | [截圖](practice-modes-1.7.0-screenshots/wrong-choices-mobile.png) |
| 錯題複習結果 | [截圖](practice-modes-1.7.0-screenshots/wrong-result-desktop.png) | [截圖](practice-modes-1.7.0-screenshots/wrong-result-mobile.png) |
| 只有今天剛錯 | [截圖](practice-modes-1.7.0-screenshots/today-only-desktop.png) | [截圖](practice-modes-1.7.0-screenshots/today-only-mobile.png) |
| 綜合練習預設 | [截圖](practice-modes-1.7.0-screenshots/mixed-default-desktop.png) | [截圖](practice-modes-1.7.0-screenshots/mixed-default-mobile.png) |
| 綜合練習部分勾選 | [截圖](practice-modes-1.7.0-screenshots/mixed-partial-desktop.png) | [截圖](practice-modes-1.7.0-screenshots/mixed-partial-mobile.png) |
| 綜合練習全不選 | [截圖](practice-modes-1.7.0-screenshots/mixed-none-desktop.png) | [截圖](practice-modes-1.7.0-screenshots/mixed-none-mobile.png) |

## ④ 教師同步桌機截圖

實際 Bank React 元件，本機合成同步回應；1280×1000。無 JavaScript 錯誤／橫向溢位，未連正式 Sheet 或 Firestore。重產：`node scripts/wrong-carry-shots.mjs`；[機器紀錄](practice-modes-1.7.0-screenshots/wrong-carry-checks.json)。

| 狀態 | 桌機 |
|---|---|
| 核取方塊預設不勾與說明 | [截圖](practice-modes-1.7.0-screenshots/sync-checkbox-desktop.png) |
| 延續：保留37、重置3（改答案2、刪除1） | [截圖](practice-modes-1.7.0-screenshots/sync-carry-desktop.png) |
| 勾選全部重算 | [截圖](practice-modes-1.7.0-screenshots/sync-reset-desktop.png) |
| 舊版讀取失敗，同步完成並重算 | [截圖](practice-modes-1.7.0-screenshots/sync-failed-desktop.png) |
