# 1.7.1 完成度看板：Codex 自查，交 Claude 驗收

2026-10-07。分支 `feature/1.7.1-completion-board`，基底 `e8805f8`（`feature/1.7.0-practice-modes`）；獨立工作目錄 `.worktrees/completion-board`。沒有混入呼吸教材，未 push、合併或部署 main。

## 完成的行為

- 預設各班比較：人數、全部完成、有逾期、平均完成、各單元完成率；單元依全課程排序，百分比與底色並列，期限相同顯示日期、覆寫不同顯示「各班不同」。點完成率可查期限；班級不可見為「—」、選看灰字並排除完成數。
- 「更新全部班級」逐班讀既有 `getCompletion`，每班 `next` 讀完才存完整快取，顯示班名與已讀人數。班級間一律依序；不增加後端。分頁讀取失敗不回傳部分名冊，重複游標會中止；讀取期間課程重發布會提示重讀。
- 頁面初次進入不自動大量讀資料；未載入班級／加總顯示「—／未載入」。全部班級讀完才顯示加總並啟用比較 CSV。快取僅頁面狀態，換課程或離開即失效；進班級不重讀，按更新才重讀。
- 學生矩陣：單元一格、選看放最右、固定姓名／學號欄、不斷行查看按鈕；整頁不橫向捲動，矩陣可橫捲。●／◐／○／⊘都有 aria-label，逾期未完成紅框加「逾」、逾期完成灰字「逾」。停用名冊仍顯示並標停用。
- 點格子顯示該單元題目分類的最高分／門檻／作答次數／首次達標及必做活動進度；沒有成績顯示「尚無」，沒有 passedAt 不補造時間。桌機小視窗、手機底部抽屜；Escape 關閉、焦點返回原格子，Tab 留在視窗。
- 姓名／學號搜尋、學號／完成數少→多／逾期數多→少排序、只看有逾期。矩陣 CSV 只匯出篩選後名單；全班完成率維持完整名冊。兩種 CSV 都有 UTF-8 BOM。查看沿用原 StudentDetail 與 getHistory。
- `shared/completionBoard.ts` 的 `chapterCellState` 只做顯示；未開放但已完成仍是 done；未開放的必做單元仍在 m。完成度、班級覆寫、活動相容與最高分全部沿用原模型。
- 後端程式、`shared/model.ts`、學生畫面、分析報表、Firestore、完成度公式版本3及 `getCompletion` 介面均未改；Functions package／lock只同步版本1.7.1。

## 10/7 Claude 驗收後修正

- 選看／不可計分單元不標逾期（含逾期完成）；新增回歸測試涵蓋格子、班級人數與 CSV。
- 圖例改用分項 flex 與 gap，手機換行保留間隔。
- 明細顯示「最高分 95／門檻 80｜作答 2 次」。
- 重跑完整 check、兩尺寸 React 操作與 6 張截圖均通過；待 Claude 複驗。

## 一致性與測試

合成資料：護二甲8人、護二乙10人；含兩個血液分類、必做互動活動、未來開放呼吸單元、選看補充、不同期限及可見性、未登入、停用、缺 passedAt、逾期完成／未完成。所有資料均為本機合成資料，未讀正式學生資料。

| 核對項目 | 結果 |
|---|---|
| 每生 n／m | 每列 done＝ eligible 的●格數，total＝eligible格數，18人全部一致 |
| 同班同單元兩層完成率 | 1280／390 實際 React DOM 全欄一致 |
| 全部班級 | 18人、全部完成3人、有逾期12人；各班加總後重算 |
| 血液完成率 | 甲2/8＝25%，乙2/10＝20%；合計4/18≈22%，不是班百分比平均22.5% |
| 隱藏單元 | 乙不顯示呼吸單元；該欄加總分母8人 |
| 平均完成 | 甲4/8＝0.5／3、乙6/10＝0.6／2；全部10/18≈0.6／(44/18≈2.4) |
| 覆寫必做 | 純函式另測乙將補充改必做，乙total變3、甲仍選看 |
| 未登入／無成績 | 名冊分母仍8／10；未將不存在的分數寫成0 |
| 分頁 | 53人測試讀50＋3，after依序傳空字串／49；失敗、重複游標、重發布皆測試 |
| CSV | 實際下載兩種CSV核對；搜尋陳盈宥只匯出1人、n/m與狀態正確 |
| 更新失敗 | 保留前次完整快取並提示錯誤，不呈現部分班級名冊 |
| 原學生紀錄 | 查看開原StudentDetail，按讀取走getHistory，關閉返回矩陣 |

- `chapterCellState` 測試含未開放、已完成、作答進行中、活動進行中、未開始、逾期未完成、逾期完成、無 passedAt，另測期限相等與過期1ms邊界，不改來源資料。
- React 測試包含第一層→班級→格子明細→返回、鍵盤關閉、快取與覆寫、三種排序／逾期篩選、真實CSV下載、學生紀錄與API失敗。
- `npm run check`：前端 **140／140**、Functions **26／26**，兩端 build、`version:check`＝1.7.1 通過；`git diff --check`通過。
- 重跑方式：`npm run check`；`node scripts/completion-board-verify.mjs` 產生下列截圖與 `checks.json`。需要本機 Chrome。

## 截圖（已目視檢查）

| 畫面 | 1280 | 390 |
|---|---|---|
| 各班比較 | [桌機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/completion-board-1.7.1-screenshots/comparison-1280.png) | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/completion-board-1.7.1-screenshots/comparison-390.png) |
| 學生矩陣 | [桌機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/completion-board-1.7.1-screenshots/matrix-1280.png) | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/completion-board-1.7.1-screenshots/matrix-390.png) |
| 格子明細 | [桌機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/completion-board-1.7.1-screenshots/popover-1280.png) | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/completion-board-1.7.1-screenshots/popover-390.png) |

`docs/completion-board-1.7.1-screenshots/checks.json`：兩尺寸均無 pageerror／console error／整頁橫向溢位。手機姓名橫排、搜尋欄完整、按鈕不斷行、明細抽屜可捲動。

## 規格解讀與限制（供 Claude 核對）

- 原 API 沒有名冊總人數，因此分頁中顯示「載入中：班名 N 人」，不用尚未知曉的分母；讀完後才顯示完整名冊人數。例「50／44」不能由既有回應可靠產生。
- 各班應完成單元數可能不同；加總列平均完成採總已完成／總人數，分母採總應完成／總人數，並在畫面註明人數加權。個別班仍顯示本班整數total。
- 不可見單元不算該欄完成率分母；選看仍顯示完成率，但不計入n/m。依 10/7 修正單，只有必做且 eligible 的單元判逾期；選看或不可計分單元不加逾期標記，不計入逾期人數、排序、篩選或 CSV 逾期狀態。
- 完成與逾期時間一律用台灣時區；刷新資料時間顯示在矩陣下方。頁面不自動輪詢，實際多班／多頁讀取量仍由教師的更新操作決定。
- 僅本機合成資料驗收；正式名冊／Firebase端到端待教師部署後確認。此報告為Codex自查，仍須Claude獨立驗收。
