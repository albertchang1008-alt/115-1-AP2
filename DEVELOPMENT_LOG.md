# 開發紀錄

目前版本：1.5.0

## 教材 — ECG 模擬器與標示題、心臟傳導系統、心動週期（2026-09-24，未發布）

- Codex 初版（未 commit）驗收不通過：頁面 SyntaxError 整頁空白、模擬器無動畫、標示題拖曳換算錯誤、kit 移除圖／ARIA／nodeTime（`docs/ECG_SIM_LABEL_ACCEPTANCE.md`）。
- Claude 依 `docs/ECG_SIM_LABEL_SPEC.md` 完成：kit 可讀化與擴充點（lab widget、題型）、Fisher–Yates、`explore` 僅首次、`data-state` 狀態切換；`materials-src/widgets/` 四檔；`ecg-basics-v1` 重建；截圖流程改為錯誤／空白即失敗。
- 新增 `cardiac-conduction-v1`、`cardiac-cycle-v1`（題目來自教師題目集單元一、二）與 4 張自繪 SVG。
- 驗證：`tests/ecg-model.test.ts`＋`tests/material-kit.test.ts` 10/10、四份教材截圖 0 錯誤、ECG 互動驗收 390／1280 通過。未 push、未部署。

## 文件 — 心電圖教材改善計畫（2026-09-23）

- 已檢視教師提供的單檔 ECG 初稿，並建立 `docs/ECG_MATERIAL_IMPROVEMENT_PLAN.md`。計畫採六節點、6 題先備＋5 題病例的 `ecg-basics-v1` 建議，將異常波形臨床判讀改為後續、需來源與專業審稿的範圍。
- 計畫列出教材元件庫重建、canvas 時距與可近用性修正、CourseLearning 診斷串接、截圖／iframe／真實帳號驗收；未匯入教材、未改產品程式、未發布。

## 1.5.0 — ECG 基礎教材 v1（2026-09-23）

- 新增 `ecg-basics-v1`：六個 ECG 基礎節點、6 題先備題與 5 題情境題；明確保留非診斷界線，未納入單一異常波形直接對應疾病的內容。
- 元件庫題目流程改為先完成先備題才解鎖病例題、選項洗牌、錯答送 hint、全數病例答對才 complete；節點展開累積實際停留時間。建置稽核能讀取生成教材的固定 ID metadata。
- 驗證：`npm run materials:build ecg-basics`、`npm run materials:shots ecg-basics`（390／1280、所有 lab 狀態與節點通過）、`npm run check`、`git diff --check` 通過；未 push、未部署，待教師內容複核。
- 後續修補：節律實驗室的慢／安靜／快三種狀態改為不同 R-R 間距與流動波形，解決原本控制鈕只更新文字的問題；截圖驗收再次通過。
- 再修補：SVG 內嵌樣式無法可靠讀取外層狀態，改由元件庫在初始化與按鈕點擊時直接切換三組波形顯示；避免節律密度示意器空白或無反應。

## 1.5.0 — 教材元件庫 v1（2026-09-23）

- 新增 `materials-src/kit/` 原生 HTML/CSS/JS 元件庫、SVG 圖庫與授權 manifest、`shared/materialKit.ts` 內容型別／驗證，以及 `materials:build`／`materials:shots` 建置與 Playwright 截圖工具。
- 首份樣板 `heart-structure-v1` 從內容檔生成單檔教材，保留 6 個既有節點 ID 與 11 個題目 ID；教材目錄及 README 自動同步。既有 `html/心臟構造.html`、既有正式教材均未修改。
- 驗證：`npm run check`（前端 91、Functions 15）、`npm run materials:shots heart-structure`、`git diff --check` 通過。截圖與報告在 `materials-src/heart-structure/shots/`（gitignore）；未 push、未部署。

## 1.5.0 — 複習考（作業）（2026-09-23）

- **已上線（2026-09-23）**：教師執行 deploy.sh，Functions 39 個（新增 buildReviewExam、deleteReviewExam）Deploy complete；第一次因 saveSheetConfig 一次性 ENOTFOUND 中斷，重跑成功。`origin/main` fe766c6..82e7140，Pages Actions 成功，正式站 `version.json`＝1.5.0。

- 新增教師限定的複習考組卷：從多個已發布的一般題目分類凍結複本為獨立 `Unit`，保留來源與當時題庫版本；最大餘數法按比例分配每次 N 題，每個來源至少一題，且同來源未考過題目優先。
- `buildReviewExam`／`deleteReviewExam` 管理獨立題目池；題庫 manifest 儲存題目來源。同步 Sheet 不會把複習考列為舊分類，且同名衝突會明確拒絕。
- 複習考交卷必須抽滿歷史設定中的 N 題與各來源配額才更新最高分；首次完整達標寫入 `passedAt`。期限後首次達標仍計完成，學生端顯示「逾期完成」。一般分類原有完整測驗、完成度與綜合練習行為不變；複習考被前後端排除於綜合練習。
- 教師「課程與教材」可新增、改組與刪除複習考；學生端顯示作業標籤、每次抽題數、只提供開始作答與錯題閃卡，結果依來源顯示答對數。
- 驗證：`npm run check`（前端 88、Functions 14）、`git diff --check` 通過；未 push、未部署。

### Claude 驗收補修（2026-09-23）

- 教師設定頁會比對題目池來源的目前版本；來源更新時提示受影響分類與目前來源題數，提供一次確認後的「依目前題庫重新組卷」。修改來源／N 與重新組卷均說明最高分保留、舊版錯題不帶入。
- 刪除複習考時前後端都清除各班 `classUnits` 的 ID，後續可保存草稿。Sheet 的「單元」或「次單元」同名複習考都會被拒絕。
- 學生卡片正確優先顯示準時達標／逾期完成／尚未開放；教師完成度看板及 CSV 會顯示逾期完成。開始作答 URL 統一使用完整測驗模式。
- 抽出 `reviewAttemptIsFull()` 為純函式，覆蓋目前與歷史組卷版本的題數／來源配額；Functions 測試新增 callable 防線檢查。`npm run check` 通過（前端 89、Functions 15）。

## 1.4.1 — 三份教材任務 3：視覺流程卡與重試回讀（2026-09-22）

- 教師核定執行任務 3。三份 `html/` 教材的情境實驗室改為四張醫學視覺流程卡：`心臟構造`（回流、房室瓣、收縮、半月瓣）、`心臟血液供應`（收縮、血管受壓、舒張、冠狀灌流）、`紅血球恆定`（缺氧、腎臟 EPO、紅骨髓、攜氧恢復）。桌機維持四欄箭頭，窄版堆疊；既有時相／缺氧控制仍高亮相應卡片。
- 使用 built-in ImageGen 製作不含文字的 4 格醫學教學插圖，存入 `html/assets/heart-valve-flow-strip-v1.png`、`coronary-perfusion-flow-strip-v1.png`、`rbc-epo-feedback-strip-v1.png`；所有中文說明仍由 HTML 輸出，避免圖片中文字失真並保留可及性。
- 第二關採先前建議的 A＋C：答錯不再顯示正確選項或完整解析，僅顯示提示並要求前往對應圖卡複習；完成短暫回讀後才可重新挑戰。題目／節點 ID、首次診斷事件、6 節點／11 題分母與通關條件均不變。
- 驗證：三份內嵌 JavaScript 語法檢查、`npm test` 85 項、`npm run build`、`git diff --check` 通過。尚未 push、部署或匯入教材工作室。

## 1.4.1 — 教材改善任務 1、2 與任務 3 待核定方案（2026-09-22）

- 任務 1：`html/紅血球的恆定機制.html` 在 ≤760px 改顯示獨立的直式 SVG，全程保留缺氧、腎臟 EPO、紅骨髓、循環、網狀內皮系統、globin／heme 回收與綠色負回饋；窄版不再有水平捲動，字級不低於 13px。桌機維持既有橫式圖。
- 任務 2：三份教材第一關在每次呈現題目時，以既有 `shuffleArray` 洗牌選項；正確答案改由 `{ text, isCorrect }` 判斷，題目順序、11 個題目 ID、6 個節點 ID、首次診斷事件與通關規則均未改動。
- 任務 3（未實作，待教師核定）擴大為三份教材共同的「情境實驗室視覺重構」：心臟構造、心臟血液供應、紅血球恆定均採四張具有醫學插圖主角的因果流程卡、桌機橫向箭頭、手機直式堆疊與即時控制回饋；紅血球以教師提供的 EPO 視覺稿為準。另保留第二關重試鑑別度的 A／B／C 方案，詳見 `handoff.md`；本輪沒有實作任務 3。
- 驗證：三份內嵌 JavaScript 語法檢查、`npm test` 84 項、`npm run build`、`git diff --check` 通過；本機 `file://` 預覽仍受 CUA Browser URL policy 阻擋，未完成 390px／桌機人工巡覽。未 push、未部署、未匯入教材工作室。

## 1.4.1 — 活動卡：一般閱讀 HTML 改標「閱讀教材」（2026-09-21，Claude）

- Codex 的內容類型標籤把所有 `html` 活動都標成「互動資訊圖表」；教師若把教材紀錄方式設為「一般閱讀」，該教材沒有闖關與診斷，標籤會誤導。改為只有 `tracking === 'interactive'` 才顯示「互動資訊圖表」，其餘 HTML 顯示「閱讀教材」。純前端，靜態測試已補。

## 1.4.1 — 修正紅血球血紅素構造與教材窄版排版（2026-09-21）

- `html/紅血球的恆定機制.html` 的 Hb 圖改為成人主要 HbA 的 `α₂β₂` 四聚體：2 個 α、2 個 β 珠蛋白次單元；每一個次單元包覆 1 個含 Fe²⁺ 的 heme，因此 1 個 Hb 最多可逆結合 4 個 O₂。二氧化碳三種運輸比例改為分開的資訊標籤，避免原本單列文字擁擠。
- 同份教材新增「紅血球恆定全流程」統整圖，連結缺氧、腎臟 EPO、紅骨髓造血、血液循環、網狀內皮系統的成分回收、鐵回送與膽紅素排出，並畫出負回饋路徑；EPO 文字同步改為腎臟感氧細胞直接增加 EPO 分泌。
- 三份新教材的情境流程卡改為桌機四張卡＋固定箭頭、窄畫面單欄堆疊且隱藏裝飾箭頭，修正文字被壓成直排或超出框的問題。
- 新增靜態測試驗證 HbA、全流程圖與響應式規則；內嵌 JavaScript 語法檢查、`npm test`（84 項）、`npm run build`、`git diff --check` 通過。教材原始檔尚未匯入正式 `public/materials/` 目錄；未 push、未部署。

## 1.4.1 — 心臟／紅血球互動教材情境實驗室（2026-09-21）

- 完成 `html/心臟構造.html`、`html/心臟血液供應.html`、`html/紅血球的恆定機制.html` 的活潑互動版：分別加入瓣膜與心跳時相、冠狀循環灌流時相、EPO 負回饋缺氧控制器；三份皆有即時因果回饋與不計分的預測題。
- 三份教材改接 `course-learning.js`，流程節點以教材專屬 ID 記錄探索；既有 6 題先備＋5 題病例維持為正式診斷分母，五題病例全對才呼叫通關。預測題與滑桿刻意不寫入診斷事件，避免混入 11 題分母。
- 新增靜態測試；三份內嵌 JavaScript 語法檢查、`npm test` 83 項、`npm run build` 與 `git diff --check` 通過。Mac 鎖定，未完成人工瀏覽器畫面巡覽。

## 1.4.1 — 學習活動內容類型標籤（2026-09-21）

- 學生端單元的活動卡，新增與「必做／選看」分開的內容類型標籤與圖示：`YouTube 影片`、`互動資訊圖表`、`外部連結`、`小測驗`。學生可在開啟活動前判斷內容形式；既有完成要求與完成狀態不變。
- 新增靜態測試，驗證四種內容類型與標籤樣式；`npm test` 82 項、`npm run build`、`git diff --check` 通過。

## 1.4.1 — 教材診斷／快照分頁 INTERNAL（2026-09-20）

- 症狀：教材診斷按「更新診斷」回 INTERNAL，永遠 0 筆。
- 根因：`getLearningDiagnostics` 以 `orderBy('__name__').startAfter(req.data.after || '')` 查詢，第一頁游標是空字串；Firestore 對 `__name__` 游標要求合法文件 ID，空字串直接丟錯 → INTERNAL。快照列表（`snapshots/{id}/rows`）同樣寫法，同樣會壞。
- 修正：兩處都改為只有帶游標時才 `startAfter`。其餘 `orderBy('studentId')` 的分頁不受影響（空字串在該欄位合法）。
- **需部署 Functions**；純後端修正，前端不變。

## 1.4.1 — 題目分類名稱一律跟隨 Sheet 次單元（2026-09-20）

- 症狀：題庫管理的次單元選單出現「課程簡介」（5 題）與「115-1課程簡介」（10 題）兩筆，Sheet 只有後者，但同步沒有把前者列入 staleUnits。
- 根因：「課程簡介」其實是代碼 `血液成分與血漿` 的 Unit，title 停在 1.3.x 時期被改成的名稱（當時課程簡介教材掛在該代碼上，見 `docs/UNIT_MODEL_1.4.0.md`）。代碼仍在 Sheet 內所以不算 stale；而 `syncBankTabFromSheet` 更新既有 Unit 時只寫 bankVersion／questionCount／group，從不更新 title，後台與學生端因此長期顯示錯誤名稱。
- 修正：同步既有 Unit 時一併 `title: unitId`，並把 title 差異納入 `unitChanged`，避免版本未變時不寫回。教師設定（必修、門檻、開放時間、期限、可見性）不受影響。分類名稱後台本來就不可編輯，Sheet 是唯一來源。
- 測試：新增「1.3.x 留下的舊分類名稱會被 Sheet 次單元覆蓋」案例，並更新既有「既有次單元再次同步」案例的預期（title 改為跟隨 Sheet）。Functions 14 項通過、`tsc -b` 通過。**需部署 Functions**。

## 1.4.1 — All 改為單元共用設定（2026-09-19）

- 教師確認 `All` 不再代表「把相同覆寫複製給每一班」，而是直接編輯 `chapters[name]` 的單元共用門檻、開放時間、期限與必做。修改任一欄位時，會從所有班級同一單元的覆寫移除該欄位；覆寫物件已空時也會一併清除，讓每班立刻讀到新的共用值。
- All 的「恢復共用設定」會清除該單元所有班級覆寫；選擇單一班級仍只寫入該班覆寫，且優先於共用值。All 畫面會列出仍有覆寫的班級與欄位，並與上方單元共用欄位使用同一份草稿狀態。
- 新增模型與畫面行為測試，涵蓋 All 改開放時間後各班 `forClass()` 讀到新共用值、單一班覆寫優先、恢復後覆寫清空；`npm run check` 通過（前端 81、Functions 13）。未部署、未推送 main。**All 修正待 Claude 驗收（實作 commit `340c39e`）。**

## 1.4.1 — 晴空粉三方案與班級覆寫 All（2026-09-19）

- 原本單一「晴空粉」改為三個可切換的前端色系：A「雲朵晴空」（預設、天藍主色）、B「櫻花藍調」（桃紅主色／天藍輔色）、C「粉霧紫光」（紫色主色／桃紅提示）。三者皆採白底側欄、淡色分隔線、白色學生頂部列、圓角卡片與高對比深色文字；既有海洋藍、森林綠、紫羅蘭與夜間模式沒有變更。
- 教師「各班級的門檻與開放安排」之「設定班級」新增並預設 `All`。在 All 狀態修改門檻、開放時間、期限或必做會一次套用到課程的每個班級；「恢復共用設定」亦會一次移除所有班級的該單元覆寫，單一班級選項仍可用於個別調整。
- 新增靜態測試覆蓋三套色系、淺色側欄／學生頂部列、勾選控制項主色，以及 All 的批次套用／恢復邏輯；`npm run check` 通過（前端 80、Functions 13）。未部署、未推送 main。
- 三方案視覺稿與核定色票收錄於 `docs/BLOSSOM_THEME_FIX.md` 與 `docs/blossom-theme-options.png`，供 Claude 驗收時對照。

## 1.4.1 — 學習進度看板依單元順序排列（2026-09-19）

- **根因修正：先開過單元教材的學生，之後每次交卷都回 INTERNAL。** saveActivity 以 merge 建立的 progress 文件只有 activities、沒有 units；`applyAttempt` 讀 `p.units[...]` 丟錯。1.4.0 起教材掛在單元（Chapter）層、學生容易先開教材，故大量觸發（例：護525 張家瑄 23 組卡在本機）。新增 `normalizeProgress()`，submitAttempt／submitMixedAttempts／applyAttempt／wrongEntries 一律先補空物件。需部署 Functions；部署後學生按「重新同步」即補送。
- **緊急修正：學生交卷被伺服器拒絕（學習紀錄空白、畫面顯示待同步）。** 開放時間是沒有時區的 datetime-local 字串，Cloud Functions 以 UTC 解讀，比台灣晚 8 小時才判定開放，期間 submitAttempt 回「單元尚未開放」。新增 `parseCourseTime()` 一律以 +08:00 解讀，伺服器五處開放判斷與學生端鎖定／逾期顯示改用它。已排隊在學生瀏覽器的作答會在部署後重新送出。
- **修正：重新同步遇到第一筆被拒就整批中斷。** 學生端「重新同步」改為逐筆送出，被拒的紀錄保留在本機並顯示伺服器原因與筆數，其餘照常保存。
- **修正：完成度看板整頁空白。** 只交過測驗、從未開過教材的學生，progress 沒有 activities 欄位，單元有必做活動時完成度計算丟錯；`unitCompletion`／`chapterCompletion` 先補空物件。
- **修正：「尚未開放」的單元無法移到「目前學習」（INTERNAL）。** `patchVisibility` 把 archiveLabel／archivedAt 設成 undefined，Firestore 拒絕 undefined 欄位值；改為直接省略欄位。同步新建的單元預設 hidden，所以第一次開放必定觸發。學生首頁提示清空時的 studentNotice 也有同樣問題，一併修正。需部署 Functions。
- 學習進度看板原本依題目分類在資料中的先後分組，忽略教師在「課程與教材」以上移／下移設定的單元順序（chapterOrder）；改用 `orderedChapters()`，與學生首頁順序一致。純前端變更，不需部署 Functions。
- 活動編輯器選擇「教材版本」時，自動帶入 `https://albertchang1008-alt.github.io/115-1-AP2/materials/<版本>/index.html`（網址空白或原本是平台教材網址才覆寫，自訂外部網址保留）；已選版本但網址不同時顯示建議網址與「帶入此網址」按鈕。
- 單元學習活動新增上移／下移（學生端各階段分頁依此順序顯示）。
- 新增色系「晴空粉」：比照舊版 v1.9 題庫系統（Tailwind 色票：淺灰底、白卡淡粉框、天藍主色與分數、桃紅小標與進度膠囊、紫色單元標籤）。
- 「晴空粉」設為預設色系（沒選過色系的使用者一律套用；自己選過的仍保留）；並修正學生端色系原本要打開「顯示設定」面板才會套用的問題，改為開頁即套用。
- 測驗結果頁：答對／答錯題數分色顯示；逐題改為綠色「答對」／紅色「答錯」卡片，列出全部選項並標示（正確答案）與（本次選擇）。所有色系共用。

## 1.4.0 — Chapter 單元模型（2026-09-18）

- 新增 `Chapter` 與 `Course.chapters`／`chapterOverrides`／`chapterOrder`：題庫、作答進度與錯題仍由 `Unit`（Sheet 次單元）持有；設定、活動、班級選用與完成度改由 Sheet 單元（Chapter）持有。舊資料在讀取時由同組第一個分類推導，不改寫既有課程。
- 完成度公式升為 v3：每個必做 Chapter 的所有已發布題目分類須達標，且其必做活動完成，才計一個完成單元；v1/v2 結算快照仍沿用舊公式。
- 題庫同步為新 Sheet 單元建立預設 Chapter，並回傳 `staleUnits` 供教師確認清理；班級對照表與學習進度看板以單元整組展開／移動。
- 綜合練習在 Functions 端強制只接受 `visibility: current` 且已開放的分類；hidden、archived 或未開放任一 attempt 都會在寫入前拒絕整批。
- Claude 首次驗收退回的 9 項已補齊：教師課程編輯器與總覽、學生首頁／單元頁、班級覆寫、Chapter 活動進度／互動教材事件，均改以 Chapter 為單元層。教師預覽的 Chapter 卡也可在不改寫正式 hash 路由的情況下開啟內容頁。
- `saveCourse` 新增 Chapter、順序與班級覆寫驗證；`visibleProgress`、`saveLearningEvents` 與教師診斷／研究查詢保留並識別 Chapter 活動鍵。
- 題庫同步即使版本未變也會補齊 Chapter，新單元追加至 `chapterOrder`，並在草稿保存 `staleUnits`；課程與教材頁提供黃色舊分類提示、全部移除與舊活動搬移操作。
- 第二次驗收補齊 Chapter 活動編輯器：恢復教材目錄下拉與節點／題目總數自動帶入、YouTube 開始／結束秒數、學習說明；類型改為中文標籤並移除 quiz 選項。新 CourseEditor 恢復未保存的 `beforeunload` 提醒，並刪除已停用的 `LegacyCourseEditor` 及專用 helper/import。
- 上線前精簡學生練習分頁：每個題目分類改為單列，整合最高分／門檻與已達標狀態、完整測驗、完整閃卡、10／20／30 題抽題和錯題入口；保留原路由、計分與完成度規則。同步將教師副標改為「單元設定」，班級對照表總計改為「N 個分類」。
- 修正 600px 以下的練習列排版：分類／分數、測驗／閃卡、抽題與錯題分行呈現，取消橫向捲動，避免手機 390px 寬度下抽題與錯題按鈕被擠出畫面。

## 1.3.1 — 教師後台單元結構重整（2026-09-18）

- 修正匯入：Sheet「次單元」空白時，改以「單元」本身當作一節（例如「115-1課程簡介」）；只有單元與次單元都空白的舊格式，才退回用分頁名稱。先前會把這類題目建成以課程代碼 `115-1-AP2` 命名的假單元。
- 課程與教材頁的「單元安排」改為依 Sheet 單元分組的可收合樹；沒有細分的單元以單一節點呈現。上移／下移只在同一單元內移動。
- 「課程班級與適用單元」改為班級 × 單元對照表（每欄一班、每列一個單元／次單元，組列與全部列為三態勾選），取代每班重複一整塊勾選格。
- 單元設定顯示「位置：單元 › 次單元」與 Sheet 次單元代碼；名稱與 Sheet 不一致、或為舊版匯入殘留（代碼＝課程代碼）時顯示提醒，並提供「改回 Sheet 名稱」。
- 此版修改 `shared/sheets.ts`，需重新部署 `functions:platform:syncSheet` 才會在同步時生效。

## 1.3.0 — 學生端學習流程、可見性與完成度規則（2026-09-18）

- 本日收工：1.3.0 程式與題庫同步改善均已完成本機提交；最後完整檢查 `npm run check` 通過（前端 57、Functions 8）。已部署唯一需要更新的正式 Cloud Function `platform:syncSheet`（asia-east1），未 push GitHub Pages、未修改 Google Sheet。仍待具 Java Runtime 的環境執行 Firestore Emulator 混合交卷 rollback 驗證。
- 依第七版授權，錯題改為次數／最後答錯時間物件，舊陣列相容讀成 `n:1, at:0`；新題庫寫入私有 `grading/answers`，交卷優先一讀批改、舊題庫讀 chunk fallback。題庫快取改用 localStorage 的版本鍵、1 MB 單筆與 3 MB LRU 上限，登出清除。
- 移除學生端錯題複習作答路由，改為不寫入的錯題閃卡；新增首頁錯題與綜合練習入口，`submitMixedAttempts` 以單次交易寫回各次單元的錯題／已作答資料，不更新最高成績或完成度。
- 補上錯題結構／時間範圍、localStorage 快取命中與 LRU、配額／毀損回退、首頁順序、私有答案表與混合交易邊界測試；前端測試增至 49、Functions 測試增至 7。
- 新增獨立的真實 Firestore Emulator 混合交卷原子性驗證腳本；本機 Firebase CLI 15.30.0 可用，但執行環境尚未安裝 Java Runtime，Emulator 無法啟動，未能取得真實 transaction 結果。
- 修正 iPhone 實測的學生端版面：作答頂部列固定顯示離開、名稱、題號與進度；底部操作列避開 safe area。學生的色系／字級收為右上顯示設定按鈕與底部面板，返回鍵及點擊遮罩可關閉；教師端保留既有偏好列。
- 修正前一項教師端偏好列誤放入 `.app` grid 而造成側欄／內容錯位：偏好列改回 `.app` 外的同層元素，恢復兩欄教師工作區結構。
- 再修正教師端偏好列仍在正常文件流造成頂部留白：改為右上固定控制，桌機 topbar 預留空間，避免覆蓋登入狀態與操作按鈕。
- 學習進度看板的每個單元 group 新增「整組移到…」選單，一次傳送該 group 全部次單元 ID 到既有區域 transaction；個別次單元移動仍保留。
- 題庫管理頁新增「同步檔案設定」入口，可直接貼上 Google Sheet 完整網址或 ID、讀取既有設定並儲存，不必再回到平台設定頁；同步時仍要求工作表分頁名稱完全等於課程代碼。
- 教師側欄的「平台設定」改為底部固定入口，長導覽清單本身可捲動，避免在高字級或較矮畫面中被擠出可視範圍。
- 題庫同步的「找不到分頁」診斷改為回傳並顯示 Google Sheets 實際讀到的分頁名稱；分頁名稱只忽略前後空白，保留其餘嚴格比對。同步時若表內仍有舊「課程代碼」欄且值與分頁對應課程不同，明確拒絕而不寫入其他課程。
- 題庫同步已有項目失敗時，教師端改顯示前三項的次單元／分頁與實際後端錯誤，避免泛用提示遮蔽可修正的 Sheet 欄位問題。
- 正式 Google Sheet 的課程簡介列將正解字母保存在「原始答案字母(僅對照)」、而「正確答案文字」留白；匯入器在文字答案空白時回退採用原始答案字母，文字答案存在時仍優先使用文字答案。
- 依教師決策，題庫欄位統一為「正確答案代碼」（A–H／1–8）作唯一正式答案來源；新增「Zuvio解答」供教師另行出題／匯出，平台刻意忽略且不寫入資料庫。題庫範本、補欄 Apps Script、文件與測試同步更新。
- 教師完成工作表調整後，已唯讀核對 `115-1-AP2` 分頁的「正確答案代碼」值；經教師再次明確授權，已成功部署正式環境的 `platform:syncSheet`（asia-east1）。未修改 Google Sheet、未推送 GitHub Pages。
- 補齊學生端後半 UI：課前／課堂／課後／練習 hash 分頁、活動卡與完成文字、完整／抽題／閃卡／錯題共用全螢幕作答外框、閱讀頁與閱讀全螢幕按鈕；重新整理與瀏覽器返回依 hash 還原，作答中返回會先要求確認。
- 新增路由、預設分頁、回饋時機與「還沒完成」五項截斷的測試；後端題庫整合測試改為刻意竄改 `correct`，確認伺服器重新批改仍得正確分數。

- 新增次單元可見性（尚未開放／目前學習／已考完）、歷史標籤與學生首頁提示；教師後台新增「學習進度」看板。專用 Callable Functions 在 transaction 中只同步 `draft`、`published` 的可見性欄位與提示文字，不重新發布課程或題庫。
- 學生可見資料一律排除 `hidden` 次單元：`forClass()`、`getProgress()`、`getHistory()` 及既有題庫、交卷、教材事件入口均受同一條後端防線保護。新 Sheet 次單元預設 `hidden`，既有同步不覆寫其區域欄位。
- 完成度規則升為第 2 版：必做次單元須同時達標、完成每個互動教材並確認每個外部連結；保留第 1 版供舊快照重算。新結算快照記錄版本，匯出依快照版本計算（缺欄位視為第 1 版）。
- `submitAttempt` 改由後端讀取已發布題庫快照重新批改 `selected`，忽略前端傳入的 `score`／`correct`；完整作答題數與既有 progress 規則不變。
- 修正教材 SDK 快速捲動時把 0 秒 `node_time` 送出的問題；前端改為一次、通用的儲存失敗提示。補上模型、同步與教材靜態測試。

## 1.3.12 — 教材工作室新增真正無終端機的 App（2026-09-16）

- 使用者不想在啟動教材工作室時看到終端機視窗（連雙擊 `.command` 自動跳出的都不想看到），
  新增手工打包的 `教材工作室.app`（`Contents/Info.plist` ＋ `Contents/MacOS/launcher`
  shell script，`LSUIElement` 設為 true）：雙擊後由 macOS LaunchServices 直接執行，
  不經過 Terminal.app，完全不會有終端機視窗。啟動器會補上常見的 Node 安裝路徑
  （Homebrew／`/usr/local/bin`）並嘗試載入使用者的 shell 設定檔（涵蓋 nvm 之類的
  PATH 設定方式），找不到 `npm` 或啟動 3 秒後還沒回應，會用 `osascript display dialog`
  跳出原生提示，不會靜靜地毫無反應；成功的話一樣由伺服器本身（既有的
  `materials-studio.mjs`）自動開瀏覽器分頁。
- `public/materials/README.md` 的「新增教材」說明改成以雙擊 `教材工作室.app` 為首選，
  並提醒第一次雙擊可能會遇到 macOS「無法驗證開發者」的警告（需要在 Finder 按住
  Control 點一下、選「打開」繞過一次）；`教材工作室.command`（會開終端機視窗）保留
  作為除錯用的備用方式，找不到 Node 或 App 沒反應時可以改用它看實際錯誤訊息。
- 純新增一個本機啟動用的 App 打包／文件更新，不影響 `functions/`，不需要重新部署
  Cloud Functions。

## 1.3.11 — 教材工作室新增雙擊啟動器（2026-09-16）

- 新增專案根目錄的「`教材工作室.command`」：雙擊即可（Finder 會自動開一個終端機視窗）
  啟動 `npm run materials:studio`，不用自己打開終端機、也不用記或打指令。伺服器準備好
  後一樣會自動跳出瀏覽器分頁；用完關掉那個終端機視窗（或按 Ctrl+C）即可結束，行為跟
  直接下指令完全一樣，只是不用打字。
- `public/materials/README.md` 的「新增教材」說明改成以雙擊這個檔案為首選方式，手動
  下指令列為備用。
- 純新增一個本機啟動用的 shell script／文件更新，不影響 `functions/`，不需要重新部署
  Cloud Functions。

## 1.3.10 — 教材工作室：本機網頁介面匯入新教材（2026-09-16）

- 新增 `npm run materials:studio`（`scripts/materials-studio.mjs` ＋
  `scripts/materials-studio.html`）：本機限定的小型網頁工具，取代「手動下指令、手動改
  檔案」的流程。啟動後用瀏覽器打開 `http://127.0.0.1:5183/`，畫面上依序：貼上教材
  HTML 程式碼＋填代號與標題、即時 iframe 預覽 → ①匯入（寫入
  `public/materials/<slug>/index.html`） → ②執行稽核（沿用既有 `materials:audit`
  邏輯，偵測節點數／題目數並帶入可編輯欄位） → ③寫入教材目錄（沿用既有
  `materials:sync` 邏輯，更新 `shared/materials.ts` 與 `public/materials/README.md`）。
  畫面下方「現有教材清單」可以個別移除檔案／目錄項目，貼錯、匯錯了能整個重來。
- `scripts/materials.mjs` 的核心函式（`auditOne`、`loadCatalog`、`renderReadmeTable`、
  `syncCatalog` 等）改成 `export`，並新增 `upsertCatalogEntry()`／
  `removeCatalogEntry()` 兩個給工作室重用的函式；CLI 既有的
  `materials:audit`／`materials:sync` 指令行為完全不變。
- 這個工具只在本機執行（綁定 127.0.0.1，不對外開放），不會被打進 `npm run build` 的
  部署產物，也不會執行任何 git 指令——寫完檔案後仍需要使用者自己用 GitHub Desktop
  確認變更並 push。
- 純腳本／文件變更，不影響 `functions/`，不需要重新部署 Cloud Functions。

## 1.3.9 — 教材匯入自動化：稽核腳本＋教材目錄＋後台下拉選單（2026-09-16）

- 新增 `shared/materials.ts`：教材目錄唯一資料來源（MATERIAL_CATALOG），列出每份教材的
  說明、追蹤模式、探索節點總數、闖關題目總數，`public/materials/README.md` 的表格與
  教師後台表單都從這裡讀，不再各自維護一份容易兜不起來的數字。
- 新增 `scripts/materials.mjs`（`npm run materials:audit` / `npm run materials:sync`）：
  audit 掃描每份教材，偵測是否接好 course-learning.js、是否呼叫 complete()、嘗試偵測
  節點數與題目數（偵測不到會老實說「無法自動偵測」，不會亂猜）；sync-catalog 依
  `shared/materials.ts` 重新產生 README 的「正式教材版本」表格，並列出跟 audit 結果
  不一致的地方供人工核對。
- `public/materials/course-learning.js` 新增可重用方法 `CourseLearning.trackScrollNodes()`，
  把「用 IntersectionObserver 偵測捲動進度、進節點送 explore、離開送 nodeTime」這段
  邏輯抽成共用方法；`course-orientation-v1/index.html` 改成呼叫這個共用方法，不再自己
  內嵌一份幾乎一樣的觀察器程式碼。
- 教師後台（`src/App.tsx`）：「教材版本」原本是自由文字輸入，改成下拉選單，列出
  `MATERIAL_CATALOG` 裡登記的教材；選定後一次帶出「教材紀錄方式」「探索節點總數」
  「闖關題目總數」，下面兩個數字欄位仍可手動覆寫，不鎖死彈性；目錄外的自訂教材版本
  保留「其他／自訂」選項切回文字輸入。
- 用稽核腳本重新核對 6 份既有教材，順便修正兩個先前沒人記錄過的數字：
  `blood-composition-v1` 的題目總數其實是 11（先備知識 6 題＋病例限時連勝 5 題兩層，
  README 先前完全沒填數字，不算修正錯誤）；新增 `blood-pre-v1`（22 節點／10 題）、
  `blood-post-v1`（43 節點／15 題）兩份教材的登記——這兩份節點 id 是用變數／陣列組
  出來的，稽核腳本值測不到，數字是人工讀程式碼核對，並在 `shared/materials.ts` 的
  註解裡寫清楚怎麼算的。
- `tests/material.test.ts`：course-orientation-v1 的斷言改成檢查
  `trackScrollNodes()` 呼叫（取代原本檢查內嵌 IntersectionObserver 程式碼的斷言）；
  新增一則驗證 `trackScrollNodes` 本身的測試；新增 `blood-pre-v1`／`blood-post-v1`
  兩份教材原本完全沒有涵蓋的靜態測試。
- 純前端／腳本／文件變更，不影響 `functions/`，不需要重新部署 Cloud Functions。

## 1.3.8 — 課程簡介圖卡拆分探索節點（2026-09-16）

- 修正先前誤判：`course-orientation-v1` 其實已接上 `course-learning.js`（10 題作答／全對完成事件皆已存在），並非完全沒有追蹤，故不建議改回「一般閱讀」。
- 探索節點由 1 個整頁節點拆成 8 個（`course-orientation-highlights`／`-stages`／`-timeline`／`-grading`／`-visit`／`-rules`／`-online-quiz`／`-failing-rule`），比照 `hemostasis-mechanisms-v1` 已用過的 `CourseLearning.explore`／`nodeTime`，改用 `IntersectionObserver`（threshold 0.4）偵測捲動進度，保留原本長條捲動版面，不改成點選式概念圖。
- 移除原本掛在「開始課程理解驗收」按鈕上的整頁 `explore('course-orientation-overview')` 呼叫；測驗作答與全對完成事件不變。
- `public/materials/README.md` 更新該教材的驗收設定為「8 個學習節點；10 題；10 題全對才送出完成」；`tests/material.test.ts` 新增對應斷言（8 個 `data-node-id`、`IntersectionObserver`、`explore`／`nodeTime` 呼叫）。
- 教師後台表單需手動調整：「探索節點總數」1→8、「闖關題目總數」0→10（原本就填錯），改完需重新保存草稿並發布課程。

## 1.3.7 — 題庫解析研究資料（2026-09-15）

- 單元預設蒐集引導式解析曝光與傳統解析展開／停留；教師可逐單元關閉，資料不影響成績或完成資格。
- 新增教師後台「解析研究資料」頁與教師限定查詢；除互動資料外，還顯示解析事件後同一題的後續作答數、再錯率與已改正題數。
- 研究頁整合同一次單元的互動 HTML 診斷：探索節點、首次答對與有效時間可與題庫解析投入、後續再錯率並列判讀。
- 新增 `saveExplanationResearchEvents` Cloud Function，事件以題目、解析格式、動作與粗粒度秒數保存；不蒐集逐字輸入或捲動軌跡。

## 1.3.6 — 互動教材雙軌遊戲與診斷完備（2026-09-15）

- 學生端血液組成教材新增六顆探索星星、全圖卡探索徽章、限時連勝徽章及通關煙火；五題連勝仍是平台活動完成資格。
- 新增 `node_time` 學習事件，記錄開啟中圖卡的有效互動停留秒數；背景／閒置超過 60 秒不累計，切換圖卡時先結算前一張。
- 教材重試會回報每次作答，平台保留首次正誤並累積總嘗試次數；GA4 事件加入匿名的嘗試序號與逐卡秒數。
- 教師診斷頁將既有「探索 40%＋首次答對 60%」明確命名為 Mastery，新增嘗試／重試欄與逐圖卡有效停留明細；仍僅供教學診斷，不作正式成績。
- 此版更新共用事件協定與 Cloud Functions，發布 Pages 後還必須重新部署 Functions 才能保存 `node_time`。

## 1.3.5 — 啟用血液組成教材 GA4（2026-09-15）

- 依教師提供的 GA4 Measurement ID `G-VQVRD53N2N` 啟用血液組成互動教材的 GA4 載入與去識別事件。
- 僅送教材識別、探索節點、題目 ID、首次作答對錯與通關；不送姓名、信箱、學號、登入憑證或平台使用者 ID。

## 1.3.4 — 限時挑戰題序隨機化（2026-09-15）

- 血液組成限時連勝挑戰在首次開啟與每次重新挑戰時，均以 Fisher–Yates 洗牌隨機排列五題；同一輪不重複題目。
- 題目 ID、正解與平台診斷事件不變，資料仍可穩定對應各考點。

## 1.3.3 — 血液組成限時連勝挑戰（2026-09-15）

- 隨堂測驗改為逐題 45 秒的五題連勝挑戰，避免學生先看見後續題目的選項。
- 五題改為情境病例與易混淆陷阱題；答錯或逾時會顯示正解解析並中斷本輪，重新挑戰由第一題開始。
- 五題均在限時內答對才呼叫既有的互動教材完成事件，因此平台會顯示該 HTML 活動已通關；不改題庫測驗或單元完成度規則。

## 1.3.2 — 精簡血液組成教材測驗說明（2026-09-15）

- 移除血液組成互動教材中「首次作答會保存為學習診斷；重新挑戰不會覆寫首次結果」的學生可見說明；測驗只保留「五題全對才通關」。

## 1.3.1 — 新增血液組成互動教材與學習診斷（2026-09-15）

- 新增 `public/materials/blood-composition-v1/index.html`，將原始「血液的組成」圖表整理成可由 GitHub Pages 發布的獨立教材；不改既有 blood-pre-v1／blood-post-v1。
- 教材載入 `course-learning.js`：六張資訊圖表卡首次展開記錄探索；五題測驗使用固定 `blood-composition-q01`～`q05`，首次作答保存對錯。
- 五題全對才送出教材通關事件；未滿分可重新挑戰，但不覆寫首次作答診斷。
- 預留 `GA4_MEASUREMENT_ID` 與動態載入邏輯；預設留白，不載入 GA4、不送出任何資料。日後填入有效 `G-...` ID 才送去識別的探索、答題、通關事件。
- 新增靜態教材測試，驗證 SDK 路徑、6 個診斷節點、5 題固定 ID、滿分完成條件及 GA4 預設停用。

## 1.3.0 — 測驗選項拿掉 A/B/C/D 字母徽章（2026-09-15）

- 使用者要求：選項的 A/B/C/D 標籤拿掉。
- `src/Student.tsx`：測驗作答（quiz／閃卡／複習／教師預覽共用同一個選項
  清單元件）的每個選項按鈕不再渲染 `<b>{String.fromCharCode(65 + j)}</b>`
  字母徽章，只顯示選項文字本身。
- `src/style.css`：同步移除已經沒有元素可套用的 `.options button b` 樣式
  規則（原本在 1.2.8 修過夜間對比色，隨字母徽章一起拿掉）。
- 選項按鈕本身的排版（`padding`、`gap` 等）不受影響，拿掉徽章後按鈕只是
  少一個子元素，不需要調整版面。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純前端顯示調整，不影響
  既有邏輯測試）。
- 純前端變更，不需要重新部署 Functions。

## 1.2.9 — 登入新增「切換 Google 帳號」（2026-09-15）

- 使用者反映：登入時找不到地方切換 Google 帳號。
- 根因：`login()`（`src/service.ts`）呼叫 `signInWithPopup` 時沒有帶
  `prompt` 參數，加上 Firebase Auth 預設會把登入狀態記在瀏覽器
  （`onAuthStateChanged`），所以已登入過的瀏覽器下次打開網站會直接跳過
  登入頁；就算回到登入頁重新點按鈕，Google 彈窗也可能因為瀏覽器裡已有
  有效登入狀態而悄悄用同一帳號完成登入，不會跳出帳號選擇畫面。
- 修正：
  - `src/service.ts`：`login()` 改成帶
    `provider.setCustomParameters({ prompt: 'select_account' })`，讓
    Google 彈窗每次都強制列出帳號選擇畫面（含「使用其他帳戶」）。新增
    `switchAccount()`：先 `signOut` 再呼叫 `login()`，把「登出＋重新
    選帳號」合併成一次呼叫。
  - `src/App.tsx`：學生端 `student-nav` 與教師端側欄的「登出」按鈕旁
    新增「切換帳號」（教師端為圖示按鈕，預覽模式不顯示，因為那不是真的
    Google 登入狀態），呼叫新的 `doSwitchAccount()`（沿用既有
    `error`/`loading` state，失敗時錯誤訊息會顯示在切回的登入頁）；
    登入頁按鈕下方補一行提示文字，說明登入時會列出瀏覽器裡的帳號。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28。Google OAuth 彈窗的實際
  帳號選擇畫面與切換後是否正確登入不同身份，這個沙箱無法用真實瀏覽器
  測試，需要使用者部署後親自確認。
- 純前端變更，不需要重新部署 Functions。

## 1.2.8 — 修正夜間色系按鍵對比不足（2026-09-15）

- 使用者實測夜間色系後截圖回報：測驗選項按鍵看不清楚。
- 根因：`.options button` 原本跟 `.workspace`、`.student-nav` 等整頁區塊共用同一條夜間覆寫規則，背景色都設成 `var(--page)`，導致選項按鈕跟頁面背景幾乎同色，只剩一條細邊框；而且這條規則的優先順序比 `.options button.chosen` 的淺色底（`#ecf6fe`）更高，選了但還沒交卷的「已選擇」狀態在夜間模式下背景會被蓋掉、幾乎看不出有選。
- 修正（僅 `src/style.css`）：
  - `.options button` 從夜間共用的整頁背景規則中移除，改用跟其他按鈕一致的 `var(--surface)`（比頁面背景亮一階），並補上 `border-color: var(--line)`。
  - 新增 `.options button.chosen` 的夜間專屬底色（`#24425c`）與框線（`var(--blue)`），選了但還沒揭曉答案時清楚可見。
  - `.options button b`（選項字母徽章 A/B/C/D）補上固定文字色 `#304957`——原本沒有指定顏色，夜間模式下徽章背景維持淺色但文字會跟著父層變成淺色，導致字母幾乎看不見。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純 CSS 調整，不影響邏輯測試）。實際對比度／可讀性需要使用者部署後在夜間色系下親自確認。
- 純前端變更，不需要重新部署 Functions。

## 1.2.7 — 色系／字級選單從右下角浮動移到頁面最上方（2026-09-15）

- 使用者實測 1.2.6 後回報：右下角浮動的「字級」「色系」選單會蓋住頁面內容（截圖顯示蓋住「抽10題」文字），要求移到上方。
- `src/style.css`：拿掉 `.theme-picker`／`.fontsize-picker` 的 `position: fixed`，改成放進新的 `.prefs-bar`（`position: sticky; top: 0;`）常駐列，水平排列在頁面最上方、往右靠齊；捲動時會貼齊頂端但不會像原本 fixed 疊在任意內容上面。
- `src/main.tsx`：`<ThemePicker />`、`<FontSizePicker />` 包進 `<div className="prefs-bar">`，放在 `<App />` 之前，教師後台／學生端／登入畫面都會出現在最上方。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（純版面調整，不影響邏輯測試）。
- 純前端變更，不需要重新部署 Functions；實際視覺效果需要使用者部署後親自確認選單位置與是否還會蓋住內容。

## 1.2.6 — 完整測驗恢復交卷後才揭曉、傳統解析改回收合、新增字級設定（2026-09-15）

- 使用者實測 1.2.3 的「一次給到位」後回報：完整測驗作答中就能逐題看到正解與解析，跟閃卡沒有差別，這樣不對；同時希望傳統解析預設收合、要點才展開（引導式解析維持直接展開）。
- `src/Student.tsx`：`choose()` 改回 `if (mode !== 'quiz') setLocked(...)`——quiz 模式（完整測驗／抽題練習）作答中不鎖定、不揭曉，交卷後才看得到；閃卡／複習模式不受影響，維持選了就立刻看到。
- `src/QuestionContent.tsx`：`Explanations` 的傳統解析改用 `<details><summary>傳統解析</summary>...</details>`，預設收合；引導式解析維持不用點擊、直接展開。
- 新增使用者要求的字級設定：`src/style.css` 所有 `font-size: Npx` 改成 `font-size: calc(Npx * var(--font-scale, 1))`（含一處 `clamp()`），`:root` 新增 `--font-scale: 1`；新增 `src/FontSizePicker.tsx`（比照 `ThemePicker.tsx`，`localStorage` key `course-font-scale`，小／預設／大／特大四檔），`src/main.tsx` 掛載，`.fontsize-picker` 樣式放在色系選單正上方。
- 驗證：`npx tsc -b` 無錯誤；`npm test` 28/28（quiz 鎖定邏輯與 Explanations 元件本身沒有被單元測試覆蓋，屬 React 元件行為，需人工/部署後驗證）。
- 純前端變更，未動到 Cloud Functions 或資料結構，不需要重新部署 Functions，push 後 GitHub Pages 重新發布即可生效。

## 1.2.5 — 名冊信箱不再限制網域，一般 Gmail 也可通過（2026-09-15）

- 使用者部署 1.2.4 後實測，看到具體錯誤訊息「名冊格式錯誤：第 1 列：信箱、姓名、學號或班級不完整」，找到真正卡住的原因：平台原本寫死信箱必須是 `@ctcn.edu.tw`，但班級名冊分頁的欄位其實叫「Gmail」。使用者明確要求取消這個網域限制，理由是「反正有名單」——真正能不能用某堂課，是由該課程自己的班級名冊（enrollments）決定，不是信箱網域。
- 確認 `access()` 一定會另外檢查 `enrollments/{courseId}__{email}` 是否 `enabled` 且班級在已發布班級清單中，移除網域限制不會讓沒登記的人看到課程內容。
- 修正：`shared/model.ts` 的 `allowedEmail()` 拿掉 `@ctcn.edu.tw` 網域檢查，改成只檢查基本信箱格式（有 `@` 與網域）；`functions/src/index.ts` 對應的錯誤訊息文字同步更新，不再暗示網域限制。
- 更新 `tests/core.test.ts`、`tests/platform.test.ts` 裡原本斷言「非學校信箱會被拒絕」的兩個測試案例，改成斷言新的預期行為（一般信箱通過、格式不對才擋下）。
- 驗證：根目錄 `npx tsc -b` 無錯誤；`npm test` 28/28（含更新過的測試）；`functions/` 底下 `npm run build`（29 個函式）與 `npm test`（5 項）皆通過。
- 下一步：需要使用者重新部署 Functions（`npx firebase-tools deploy --only functions --project ap2-7ed91`）才會生效；部署後如果班級名冊四欄格式都正確，這次應該能真的同步成功。

## 1.2.4 — 修正「同步班級名冊」未攔截例外導致 internal/500（2026-09-15）

- 使用者實測回報：按「同步班級名冊」出現「internal」錯誤；補上先前漏部署的 `syncRoster` 並重新部署後，改成瀏覽器 Console 顯示 `Failed to load resource...status of 500`。
- 根因：`syncRosterFromSheet` 呼叫 `parseRosterSheet` 時，若名冊分頁格式或內容不合法（缺欄位、信箱或學號重複等）會丟出一般 `Error`；`syncRoster` 這個 onCall 沒有 try/catch 接住，整個函式以未處理例外結束，Firebase 只回傳籠統的 `internal`／HTTP 500，看不到真正原因。
- 修正：`syncRosterFromSheet` 改用 `try/catch` 包住 `parseRosterSheet` 呼叫，轉成 `fail()`（`HttpsError`），前端才能顯示具體的中文錯誤訊息；找不到「班級名冊」分頁時也改用 `fail()` 而不是直接 `throw Error`。
- 驗證：`npm --prefix functions run build`（tsc＋29 個入口載入）與 `npm --prefix functions test`（5 項）皆通過；未新增針對這個 try/catch 的獨立測試（`syncRosterFromSheet` 會呼叫 Google Sheets API，直接測試需額外 mock `fetch`，超出這次修正的風險/效益，已在 handoff.md 記錄）。
- 下一步：部署後麻煩使用者重新按「同步班級名冊」，這次應該會看到具體錯誤訊息而不是 internal；再依訊息內容判斷是 Sheet 欄位還是資料格式的問題。

## 1.2.3 — 解析改名為「引導式解析」，答案與解析一律直接顯示（2026-09-15）

- 「蘇格拉底式解析」改名為「引導式解析」（欄位鍵名 `socratic.*` 不變，Sheet 匯入欄位名稱也不變）。
- 傳統解析與引導式解析在所有畫面（一般測驗作答中、閃卡、錯題複習、交卷後複習、教師題庫預覽）一律直接展開顯示，移除原本的 `<details>` 收合互動，不需要點擊。
- 一般測驗（quiz）作答中選了答案就立刻鎖定並顯示正解與解析，不用等交卷——這是使用者明確要求的改動，刻意放棄「作答中不能偷看答案」的防呆設計。
- 純前端變更（`src/QuestionContent.tsx`、`src/Student.tsx`、`src/App.tsx`、`src/style.css`），未動到 Cloud Functions 或資料結構，不需要重新部署 Functions。

## 1.2.2 — 同步操作移至題庫與名冊頁（2026-09-15，待發布）

- 「同步題庫」改放在「題庫管理」，只同步課程代碼同名的題庫分頁；同步後仍可按次單元讀取已連接版本預覽。
- 「同步班級名冊」改放在「班級名冊」，只讀取 `班級名冊` 分頁；同步後可讀取與搜尋已同步資料。
- 平台設定只負責保存 Google Sheet ID；兩個頁面皆移除 CSV／JSON 與舊名冊移轉等手動資料入口，避免出現兩個資料來源。

## 1.2.1 — Google Sheet 分頁增量同步（2026-09-15，GitHub Pages 已發布；Functions 待部署）

- 題庫分頁以課程代碼命名並獨立同步；正式題庫欄位相容 `題目`、`正確答案文字`、`序號` 與 `③對答案`。
- 新增獨立「同步班級名冊」流程，讀取 `班級名冊` 的授課班級、學號、姓名、Gmail；題庫與名冊都只在內容有變更時寫入。
- 前端版本已發布為 1.2.1；`syncSheet`／`syncRoster` callable 要生效仍需部署 Firebase Functions。

## 1.2.0 — 部署腳本修正（2026-09-14）

- 先驗證 Firebase 憑證與固定專案、Git 狀態及 main 祖先關係；Functions 成功後才發布遠端 main，同一個已測試 commit 貫穿流程。
- 部署不再切換／合併本機 main；失敗停止並說明後端可能部分更新，Pages 成功須查看 Actions。保留正式部署前確認。
- Bash 語法及 10 個隔離部署情境驗證通過；無正式推送或部署。

## 1.2.0 — 題庫接軌與接手修正

- 前次分支實作：單元／次單元兩層、題序穩定排序、啟用欄、學生自選抽題、選項洗牌、解析五段與新舊欄位相容。
- 接手修正：交卷上限與題庫統一為 500 題，調整請求大小容納完整答案。
- 題序空白不產生 Firestore 不接受的 undefined；非數字題序回報列號。
- 補上本機 callable 整合驗證，涵蓋 500 題發布與交卷、重送去重、超量拒絕。
- 將原本仍為 1.1.2 的版本標示統一升為 1.2.0；目前未合併或部署。

## 1.1.2 — 測試學生帳號白名單

- 新增 `config/testStudents` 文件（欄位 `emails` 為信箱陣列），列在其中的信箱可以學生身分登入，用於上線前實測；清空即立即失效。
- 白名單只放寬信箱網域，仍要求 Google 登入且信箱已驗證；其餘名冊、班級、發布與權限檢查完全不變。
- 名單存在 Firestore，不進入前端程式碼與公開發布的 bundle；後端以 60 秒快取讀取，學校信箱登入不會多一次讀取。
- 測試帳號的 profile 標記 `test: true`；報表、完成度與結算皆以班級為單位，建議把測試帳號放在專屬測試班隔離。
- 名冊驗證（Sheet 同步、CSV 匯入、教師後台預覽）改為接受白名單信箱，預設仍只收學校信箱。

## 1.1.1 — 課程、單元、班級代碼可用中文

- 新增 safeCode 驗證：教師自訂的課程、單元、班級代碼可使用中文、英數字、`-` 與 `_`，長度上限 50，仍禁止空白、斜線、句點與其他標點，確保可安全作為 Firestore 文件 ID 與 Google Sheet 分頁名稱。
- 前端建立課程／單元／班級，以及後端 saveCourse、getRoster、getHistory、getBank、題庫發布、名冊與題庫同步、互動教材事件的代碼檢查一併改用 safeCode。
- 題目 ID、學號、題庫版本、快照與活動 ID 等系統識別碼維持原本英數字規則。
- 既有英數字代碼不受影響，不需要資料移轉。

## 1.1.0 — 課程分班、Sheet 與互動教材整合

- 課程下建立班級、各班勾選單元，課程複製／封存、單元整理與保存提示。
- 名冊採課程歸屬，舊名冊先預覽後轉換；草稿保存不改學生發布權限。
- Sheet 相容 v1.9 中文題庫、傳統／蘇格拉底式解析與圖片題。
- 互動教材事件 SDK、去重及補送、班級與個人診斷；YouTube 標為選看。
- 海洋藍、森林綠、紫羅蘭、夜間色系；範本與上線指南見 docs/IMPLEMENTATION_GUIDE.md。
- 修正 tests/material.test.ts 未同步 HtmlMaterial 新增的 api／courseId／unitId／uid 必填 props，避免型別檢查與 CI 失敗。
- 驗證及正式部署狀態另見 docs/ACCEPTANCE.md。

## 1.0.7 — 修正班級 ID 輸入無法打逗號

- 「班級 ID（逗號分隔）」輸入框原本直接把已解析、過濾空字串後的陣列 join 回輸入框，導致輸入逗號後立刻被清掉，實際上完全無法打出逗號。
- 改為輸入框顯示獨立保存的原始文字狀態，解析後的 classIds 陣列在背景同步更新，輸入過程不再被即時清洗覆蓋。

## 1.0.6 — 課程刪除功能

- 新增後端 `deleteCourse` callable：僅課程授權教師可刪除課程文件本身，刪除前沿用既有 `access()` 教師權限檢查。
- 教師後台「課程與教材」新增「刪除課程」按鈕，刪除前需二次確認；刪除後自動切換到清單中的其他課程。
- 刪除課程不會回收已發布的題庫版本（`banks/*`）與歷史作答紀錄，維持既有內容雜湊版本不可變的設計。

## 1.0.5 — Google Sheet 一次性同步

- 課程、單元建立時改由教師輸入自訂代碼（英數字、-、_），取代原本自動產生的隨機 UUID；代碼建立後不可更改，用於對應 Google Sheet 的課程欄位與分頁名稱。
- 新增後端 `syncSheet`／`saveSheetConfig`／`getSyncStatus` 三個 callable：一份 Google Sheet 管理所有課程，「名冊」分頁固定存放班級、學號、姓名、Gmail，其餘分頁對應單元代碼並以「課程」欄位標明歸屬課程。
- 名冊同步採整份內容雜湊比對，未變動時完全跳過讀寫；有變動才整批寫入，寫入前仍會檢查每個班級的授權教師，避免誤觸他人班級資料。
- 題庫同步沿用既有 `publishBank` 內容雜湊分版機制，未變動的單元不會重新產生版本；有新版本時自動更新該課程草稿的題庫連接，不需再手動貼版本 ID。
- 讀取 Google Sheet 改用 Cloud Functions 執行身分呼叫 Sheets API（需將 Sheet 以檢視權限分享給該服務帳戶、並啟用 Sheets API），不在任何地方存放服務帳戶私鑰。
- 教師後台「平台設定」新增 Sheet ID 設定與「立即同步」按鈕，顯示上次同步時間與本次結果。
- 原本每課程各自的 Apps Script／HMAC 簽章發布流程（`apps-script/Code.gs`、`sheetsPublish`）維持可用，作為備用管道。

## 1.0.4 — 正式部署前檢查

- 修正新增教材元件測試缺少 Activity.description 的型別錯誤，部署前使用 Node 22 重跑完整檢查。
- 已確認新專案 ap2-7ed91 的預設資料庫為台灣 asia-east1、Firestore Native Standard。
- 移除被 Firestore 拒絕的 reports.classId／__name__ 多餘複合索引；該查詢使用既有單欄索引。
- 明確指定 gcp-build 驗證已編譯入口；TypeScript 與共用程式由本機 predeploy 編譯，避免雲端只收到 functions 目錄後重新編譯時找不到外部 shared 原始碼。
- 線上驗證發現空白交卷請求會回傳 INTERNAL；補上先檢查登入與作答物件，正確回傳未登入／格式錯誤。
- 實際部署結果另記於驗收文件。

## 1.0.3 — 教材改放 GitHub Pages

- HTML 活動改為 HTTPS 教材網址，教師預覽與學生端共用受限制 iframe；參與紀錄保存方式不變。
- 移除 ZIP 上傳、教材簽署與檔案轉送函式；部署不再包含 Storage，也不要求儲存桶或教材密鑰。
- 更新部署、教材版本資料夾流程、環境設定與驗收文件；同步全平台版本。
- Firebase Admin SDK 可能仍帶入 Storage 的間接套件，但應用程式不初始化或呼叫 Storage。

## 1.0.2 — 修復後端編譯

- 將 Firestore 與 Storage SDK 列為直接相依套件並更新鎖檔，避免 Firebase Admin 的選用相依套件在舊 Node 環境被跳過，造成型別缺失。
- 保留 TypeScript 嚴格檢查；建置前檢查 Node 版本與必要套件，建置後載入 24 個函式入口，確認編譯產物可啟動。
- 加入 `.nvmrc` 指定部署用 Node 22，同步全平台版本及部署狀態文件。
- 未執行正式部署，也未存取正式學習資料；驗證結果見 `docs/ACCEPTANCE.md`。

## 1.0.1 — 補齊部署說明

- README 加入從工具安裝到 Firebase、教師授權、GitHub Pages、資料初始化及更新的完整流程。
- 區分 Pages 發布與 Firebase 部署，標示尚未完成的後端修復及正式驗收。
- 修正教師授權工具的 firebase-admin 套件解析路徑，避免把 package exports 誤當成實體檔案路徑。
- 同步全平台版本；本次未執行任何正式部署或教師權限變更。

## 1.0.0 — 初始實作

- 建立獨立 React／TypeScript／Vite 平台及 Firebase Functions。
- 新教師工作區、課程編輯與共用學生前台預覽。
- 校內名冊驗證、整組作答、防重送、即時個人進度。
- 版本化题庫、Sheets 發布、互動 HTML 套件與 YouTube 片段。
- 增量報表、完成度看板、結算快照、匯出及版本檢查。
- 測試及雲端驗收狀態請參考 docs/ACCEPTANCE.md；不將尚未連接的外部服務列為完成部署。
