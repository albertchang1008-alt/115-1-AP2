# 1.7.0 練習模式待 Claude 驗收

2026-10-06｜分支 `feature/1.7.0-practice-modes`｜基底 `0cca83f`｜未 push、未部署。

依 [第三版規格](PRACTICE_MODES_1.7.0.md) 完成①～③。① `b65418b`；② `819b237`；③提交標題「綜合練習選範圍與三種模式及手機驗收」。版本檔同步為 1.7.0。七項盤點完整結果在 [handoff](../handoff.md)。

## 第④段不做的原因

ID 來自 Sheet 題目ID、內容雜湊僅決定 bankVersion，ID 可跨版本沿用。舊題庫／答案表是不可變快照，未被覆寫；**但現有同步讀取沒有取出舊正解**。`syncBankTabFromSheet` 讀課程→`publishBank` 讀**新版本** manifest→課程交易。舊答案 ID 在 grading 文件，正解文字／選項數量／題型在 chunks，課程 Unit 沒有答案特徵；要取得它們須新增 Firestore 讀取。

因此「在不得新增讀取下，同步能同時取得新舊正解」不成立，依交辦跳過④。未新增 wrongCarry、教師全部重新計算核取方塊或延續訊息；教師同步後的延續畫面因此沒有截圖。`effectiveWrong` 保留介面，目前僅讀指定版本；改版仍分版本，不追溯。同步流程完全未改，亦未改寫任何學生 progress。

替代方案：另案制定伺服器專用答案特徵，隨既有課程文件保存，學生回應剔除；未來同步用既有課程讀取比較，第一輪沒有舊特徵不延續。需先確認文件大小與併發／發布一致性。本次不自行引入此額外資料模型。

## 行為與驗證

- 閃卡正面含選項，可先標記或直接翻面；空白鍵、翻面按鈕、正解文字與焦點轉移；「再看一次」本輪每張最多多排一次。「看了 N 張」計每次翻看，M 計不同卡片。自評只在記憶體，不呼叫提交／研究 API、不寫任何進度。
- 錯題讀取只有 shared `effectiveWrong` 可存取原始版本資料；`wrongEntries` 經它排除 rm，所有首頁、分類狀態、教師學生進度及其完成度匯出走同一路。歷史研究報表的「首次答錯人數」是不可變作答統計，不是錯題清單，維持其原意。
- 所有錯題更新用伺服器重批答案與收到交卷的時間。UTC+8 日界線、同日 ok、隔日 rm、已移除後再錯累加 n、舊 string[]、at:0、passedAt 保留均有純函式測試。實際 callable 測試驗證故意偽造 correct 無效、review 不寫 attempted／成績、混合逐分類更新、複習考拒絕與既有讀取路徑。
- 單元與複習考錯題按鈕開啟畫面內題數列：10／20／30／50，大於待複習數停用，≤50且非檔位顯示全部；先取 n 多、at 早的 N 題再洗牌。手機從既有「練習」選單進入同一題數列。複習考維持沒有閃卡與抽題。
- 只有今天剛錯時提示明天重做，一般分類可轉今天錯題閃卡。錯題複習結果為伺服器回傳的「已移除／仍答錯」，抽題／完整測驗另顯示「移除／今天已答對」。重送採已保存批改與摘要，避免累計重複。
- 時間範圍選單及 range 路由欄位移除，舊網址參數忽略。綜合候選維持 `current && bankVersion && !isReviewUnit`，包括仍在 current 的已達標與選看分類。
- 範圍依首頁單元順序、三態勾選、預設全選／收合、courseId＋uid 本機存排除ID；新增分類預設包含、過期ID忽略、讀寫失敗安全退回。不選分類時全部停用，少於10題時顯示全部。
- 範圍數字只用課程／progress；按練習後僅載選取分類。閃卡今天→待複習→未作答→其他；抽題待複習→未作答→其他（今天錯題不進未作答群）；錯題重做跨分類排序後取N。全部不計分，手機三列、44px觸控與閃卡底部安全區。

完整檢查：每個 commit 前 `npm run check` 與 `git diff --check`，最終前端129個／Functions20個測試、兩端build、版本一致性與diff檢查全部通過；涵蓋純函式、實際 React 操作、Student 導覽、Functions callable 行為與兩端 build。沒有使用正式學生帳號或正式 Firestore；仍需 Claude 驗收與教師另行決定部署。

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

教師同步延續畫面：第④段依前提不成立跳過，沒有對應畫面。正式題庫同步畫面保持原功能。
