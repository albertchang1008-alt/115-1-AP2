# 專案交接（現況）

目前版本：1.6.4

> 這份文件只寫「現在」：版本、分支、固定決策、待辦。**上限約 150 行。**
> 完成或過期的項目直接刪掉，改記在 `DEVELOPMENT_LOG.md`（新版本在最上面）。
> 2026-09-23 以前的完整交接歷史：`docs/archive/handoff-2026-09-23.md`（需要查舊決策脈絡時才讀，平常不用讀）。

## 給接手的 AI agent

1. 開工只需讀本檔＋`git log --oneline -5`；需要某功能細節時再讀對應 `docs/*.md`。不要整份讀 `DEVELOPMENT_LOG.md` 或 archive。
2. 改動前 `git branch --show-current`；未經教師明確同意，不 push、不合併、不部署 `main`（push main＝GitHub Pages 自動上線）。
3. 收工前更新本檔：改「目前狀態」「待辦」，把完成的項目移出（一兩行寫進 `DEVELOPMENT_LOG.md`）。不要在本檔追加流水帳。
4. Commit 結尾附身分標註（Claude：`Co-Authored-By: <model> <noreply@anthropic.com>`＋session 連結；Codex：`[Codex]`）。不用 `--no-verify`、不強推、不略過測試。
5. 分工：Claude 寫規格與驗收；Codex 實作；教師做決策與部署。規格放 `docs/`，交辦寫在本檔「待辦」。

## 目前狀態（2026-10-03）

| 項目 | 狀態 |
|---|---|
| 正式站 | **1.6.2**。`origin/main`＝`119db4c`（2026-10-02 部署：Functions Deploy complete；Pages `version.json`＝1.6.2；五份新教材線上可開啟，Claude 確認） |
| 1.6.3 知識節點點擊體驗 | `hotfix/1.6.3-node-detail`＝`f7b97a7`：**2026-10-02 Claude 驗收通過**（點節點後詳細內容就地展開於卡片正下方且在畫面內、同時只開一個、收合正常、explore／nodeTime 正常）。已併入 `feature/stage1-supplement`，隨其部署 |
| 心臟II 圖像化改版 | 本次完成 A1–A10、必修 1／3／4、建議 5–8；原創解剖與主動脈立體圖，待 Claude 依 `docs/HEART2_REVIEW_ACCEPTANCE.md` 複驗；未部署 |
| 1.6.4 後台兩層選單 | `feature/cardiac-output-visuals`（`7e69ce9`）：題庫／報表兩層連動、研究頁分組完成，待 Claude 驗收；未 push／部署。報告 `docs/CHAPTER_UNIT_PICKER_1.6.4_ACCEPTANCE.md` |
| 第一階段補齊教材 | `feature/stage1-supplement`（33e7700＋交接）：**2026-10-03 Claude 複驗全部通過，可由教師執行 deploy.sh 部署（版本 1.6.3）**。origin/main 可快轉 |
| 開發分支 | `feature/1.6.0-progress-ui` 已等於正式 main（之後僅本行 handoff 更新）；本機 `main` 未更新（deploy.sh 不動本機 main）。其他功能分支（`feature/heart-structure-v2`、`feature/material-kit`、`feature/ecg-basics`）下次部署前需先 `git merge` 最新 main |
| 1.5.0 複習考 | 已上線。規格 `docs/REVIEW_EXAM_1.5.0.md` |
| 1.6.1 隨堂診斷捲動 | **已上線**（origin/main 7e4732b）。三份心臟教材按「兩階段隨堂診斷」後自動捲到題目 |
| 1.6.2 單元卡姓名 | **已上線（2026-10-02）**。已完成／已完成（逾期）時狀態標籤下方顯示本人名冊姓名，與標籤同大小。報告 `docs/STUDENT_NAME_1.6.2_ACCEPTANCE.md` |
| NotebookLM 教材初稿流程 | 2026-09-30 已提供教師「互動式資訊圖表」內容整理提示（含明確範圍、排除項目與來源依據要求）；NotebookLM 僅整理可教學內容、圖表建議與題目草案，後續由 AI agent 依平台元件、追蹤與建置流程實作。 |
| 五份新教材 | `blood-vessels-v1`、`circulation-routes-v1`、`blood-pressure-regulation-v1`、`lymphatic-system-v1`、`hemodynamics-v1`（來源分支 aabb2d2）：已登錄、已 commit。**已上線（2026-10-02）**（同上）。 |
| 資訊圖表題庫補登 | **已上線（2026-10-02）**：以 git 7e4732b 對 2d8fcd5 逐格比對，既有 106 題零變動、說明頁僅合計 106→161；新 55 題與教材 HTML 題幹／選項／正解／題序一致、ID 不重複、Zuvio 序號正確。**待教師把第 108–162 列貼到 Google Sheet 題庫分頁後同步** |
| 1.6.0 學習進度介面 | **已上線（2026-09-29）**。完整閃卡不計分（舊分數保留）、題目分類一律必做、選做只在單元與活動層級、完成度公式維持 v3。規格 `docs/1.6.0-學習進度介面規格.md`，驗收 `docs/PROGRESS_UI_1.6.0_ACCEPTANCE.md`。**上線後待實測**：測試學生帳號完整閃卡滿分後最高分不變；完整測驗達標後單元變為已完成；首頁待辦、逾期標示與「去練習」定位。 |
| 教材元件庫 v1 | `feature/material-kit`：心臟構造樣板已完成，待 Claude 驗收；其他教材尚未轉換 |
| 心臟構造圖像強化版 v2 | `feature/heart-structure-v2`：第二輪（版型比照傳導系統 v2、閱讀提示與窄版捲動）**2026-09-25 Claude 驗收通過**；Claude 將節點示意圖改為 HTML 方塊修正文字溢框。已登錄目錄。待教師以 deploy.sh 從此分支部署。 |
| 未追蹤檔 | 五個 `html/*.rtf` 草稿維持未追蹤、不 commit； `public/materials/coagulation-v1/`：既有資料，不要碰、不要 commit（已列入本機 `.git/info/exclude`，deploy.sh 的乾淨檢查不會被擋） |
| 教材工作室 | 2026-09-24 已健康檢查：`npm run materials:studio` 可在 `127.0.0.1:5183` 提供 `/api/list`；目前列出 11 份本機教材，其中 `coagulation-v1` 有檔案但未登錄目錄（既有狀態，勿處理）。匯入區可貼上、點擊選取或拖放 `.html/.htm/.xhtml`；檔案先填入程式碼欄與預覽，需按匯入才寫檔。`.command` 與 `.app` 會主動載入 Node 22.23.2，若 5183 已有健康服務則直接開啟。僅本機匯入／稽核／目錄管理，不跑 git、push 或部署。 2026-09-25 起啟動器會比對 `/api/version`：程式檔比執行中的服務新（或舊服務不支援版本檢查）就自動關掉重開，避免沿用舊稽核邏輯。 |
| ECG 基礎教材 | `ecg-basics-v1`：**2026-10-02 教師複核通過**（導程說明、示意模型說明、credits 維持原狀）；title／label／目錄已改「心電圖基礎」並重建 v1，待 Claude 複驗。放「心臟II」活動，既有 Sheet 7 題不動 |
| 三份心臟圖像強化教材 | `feature/ecg-basics`：`cardiac-conduction-v2`、`cardiac-cycle-v2`、`coronary-circulation-v1`（Codex 手工單檔版，教師已看過並同意登錄）。**2026-09-25 Claude 驗收通過**：390／1280 無錯誤與橫向溢位、圖檔皆載入、6 節點各送一次 explore、第二關全對才 complete（錯一題不送）、題目 ID 與目錄一致；傳導系統與心動週期的 11 題與題目集完全一致。驗收時修正冠狀循環頁載入即同時顯示「通關／未通關」橫幅的 CSS（`html/心臟血液供應.html` 同步；`html/心臟構造.html`、`html/紅血球的恆定機制.html` 同一問題一併修正）。未發布。 |
| 心臟的電性活動／紅血球恆定 | 本分支已登錄 `cardiac-electrical-v1`（9 節點／11 題）、`rbc-homeostasis-v1`（6／11），包含各自 PNG。教學內容及題目 ID 保留；補 SDK、nodeTime、複習重試與立即 complete。未發布；原草稿未改。 |
| 傳導系統／心動週期版本 | **教師決定（2026-09-25）：發布圖像強化版 `cardiac-conduction-v2`、`cardiac-cycle-v2`**。元件庫版 `-v1` 保留原名與檔案作為參考，不發布、不在後台建立活動。 |
| 心動週期 v2／冠狀循環 v1 入門化 | **教師決定（2026-09-25）**：對象為第一次學解剖生理的五專生，尚未學病理與藥理。兩份教材 22 題改為入門題（第二關改為生活情境），知識節點移除疾病、檢查與藥物內容（冠狀循環節點 6 改為「運動時的心肌供血」、心動週期節點 6 改為「心音聽診入門」）；Excel 題庫同步並打散選項。教師已逐項複核勾選。 |
| 全面去除病理與藥理 | **教師決定（2026-09-25）**：心電圖基礎、心臟傳導系統 v2、心臟構造、紅血球的恆定機制（html 草稿）、血液氣體運送、止血機制全部移除疾病、檢查、藥物內容，Excel 共換掉 18 題。已發布的 `blood-gas-transport-v1`、`hemostasis-mechanisms-v1` 保留不動，改好的內容為新的 `-v2`（已登錄目錄）；教師確認後後台活動改連 v2。`blood-composition-v1` 無病理題，未改。教師已逐項複核勾選。 |
| 止血機制 v2 例外與名稱 | **教師決定（2026-09-25）**：止血機制 v2 保留阿斯匹靈、肝硬化與血友病、華法林三段補充說明；名稱統一為「止血機制與凝血」（Excel 次單元、html 草稿檔名 `html/止血機制與凝血.html`）。 |
| 1.5.1 練習計分說明 | `hotfix/1.5.1-practice-hint`：學生端「尚未完整作答」與練習不計分提示，已部署（main `cc0dc3b`）；2026-09-25 已併入 `feature/ecg-basics`。部署後 `feature/material-kit` 需先 `git merge main` 才能再部署 |
| 本機 exclude | `.git/info/exclude` 暫列 `html/心電圖與心律不整解析.html`（教師新教材，尚未進 git）與 `materials-src/heart-structure/shots/`；要納入心電圖教材時先從 exclude 移除 |

## 部署方式（教師在自己的 Mac 執行）

```
zsh -ilc 'source ~/.nvm/nvm.sh && nvm use 22.23.2 >/dev/null && bash ~/Documents/ChatGPT/課程平台1.0/scripts/deploy.sh'
```
- deploy.sh：`npm run check` → 備份分支 → 部署 Functions → 快轉推送 main。Firebase 帳號須為 **hhchang@ctcn.edu.tw**；GitHub 推送需個人權杖。
- 部署後確認正式站 `version.json` 版本號。deploy.sh 偶發單一函式 `ENOTFOUND`（Mac 網路暫時失敗）：重跑即可，未變更的函式會 Skipped。
- `handoff.md`、`README.md`、`DEVELOPMENT_LOG.md` 都必須保留「目前版本：x.y.z」一行，`version:check` 會檢查。
- agent 的沙箱（Claude VM／Codex）沒有 GitHub 寫入憑證；Claude VM 內 `node_modules` 是 macOS 版，前端 `npm test`／`vite build` 跑不起來（Functions build/test 可以）。前端驗證以教師或 Codex 在 Mac 上跑的結果為準。
- 本機 `file://` 預覽在 CUA 被擋；要看教材畫面，Claude 可在雲端用 Playwright 截圖。

## 固定決策（精簡版；細節見各 docs）

**資料與架構**
1. 學生入口 GitHub Pages，資料 Firebase（專案 `ap2-7ed91`，asia-east1）；舊題庫系統資料完全隔離。
2. 成績一律由後端以私有答案表重批，前端分數不採信。完整作答才更新最高分；錯題複習、抽題、綜合練習不更新最高分與完成度。
3. 已發布題庫是不可變快照（版本＝內容雜湊，先依題序／ID 排序）；換版本時最高分沿用、錯題按版本分開。
4. 代碼（課程／單元／班級）由教師自訂，可中文、英數、`-`、`_`，不可空白標點，≤50 字，建立後不改。題目 ID 等仍限英數。
5. 時間欄位（datetime-local 無時區）一律以台灣 +08:00 解讀（`parseCourseTime`）。
6. Firestore 不接受 undefined 欄位：要清除的欄位直接省略。

**單元模型（1.4.0，`docs/UNIT_MODEL_1.4.0.md`）**
7. Sheet「單元」＝`Chapter`：開放、期限、門檻、必做、班級覆寫、活動、看板移動、完成度計數都在此層。Sheet「次單元」＝`Unit`（題目分類）：題庫版本、進度、錯題、完整測驗範圍。
8. 單元完成＝底下每個已發布題目分類的完整測驗最高分 ≥ 單元門檻，且必做活動完成。題目分類一律必做（沒有選做分類）；「選做／選看」只在單元（`Chapter.required`，可班級覆寫）與活動（`Activity.required` 覆寫，未設定沿用類型推導）兩個層級，不計完成度。1.6.0 起完整閃卡只作練習，舊閃卡最高分保留、不重算。完成度公式版本 3（`CURRENT_COMPLETION_FORMULA_VERSION`）。
9. 單元活動進度鍵 `chapter:<單元名>_<activityId>`。綜合練習只含看板「目前」的分類，且不含複習考。

**複習考（1.5.0，`docs/REVIEW_EXAM_1.5.0.md`）**
10. 複習考＝教師選多個分類組成的獨立 `Unit`（`unit.review`），題目複製成快照題目池；每次依比例隨機抽 N 題（未考過優先），抽滿配額才算完整作答；最高分 ≥ 門檻完成；逾期仍完成但標「逾期完成」（`progress.units[id].passedAt`）。來源更新需教師按「重新組卷」。一般單元不放題目練習活動。

**題庫同步與題目**
11. 同步只讀與課程代碼同名的分頁；「單元」欄是分組、「次單元」欄是分類；「啟用」欄 FALSE 的列略過；同步只新增／更新，不自動刪除（舊分類以 `staleUnits` 提示教師清理）。分類名稱跟隨 Sheet 次單元。
12. 選項每次洗牌；測驗選項不顯示 A/B/C/D。完整測驗作答中不揭曉正解，交卷後才看；閃卡／複習選了即顯示。
13. 解析五段鍵 `keyword/chain/decide/memory/trace`（保留舊鍵相容）；畫面稱「引導式解析」，一律展開；學生看①～④，教師另看⑤。傳統解析預設收合。

**前端**
14. 所有 `font-size` 寫成 `calc(Npx * var(--font-scale, 1))`；色系／字級選單在頂端 `.prefs-bar`。
15. 登入固定 `prompt: 'select_account'`；「切換帳號」沿用 `doSwitchAccount()`。
16. 教材卡：一般閱讀 HTML 標「閱讀教材」，只有 `tracking === 'interactive'` 標「互動資訊圖表」。

**互動教材與研究資料**
17. 教材以公開 SDK `materials/course-learning.js` 回報探索、節點停留、每次作答、通關；不傳姓名／學號／信箱。發布路徑 `public/materials/<slug>-vN/index.html`，登錄於 `shared/materials.ts`，內容重大變更開新版本不覆寫。教師後台填節點／題目分母（寫入時快照，事後不回溯）。
18. 教材格式：六個固定節點＋教學圖；卡片內「圖→概念→重點→臨床」；第一關 6 題先備逐題解鎖、第二關 5 題病例全對通關（答錯只給提示並要求回讀）。節點／題目 ID 固定英數。NotebookLM 只產初稿，不含追蹤；流程見 `docs/NOTEBOOKLM_HTML_WORKFLOW.md`。
19. 教材工作室（`教材工作室.app`／`npm run materials:studio`）只做本機匯入與稽核，不跑 git、不部署；規則與 `scripts/materials.mjs` 共用。
20. 診斷與研究資料只作教學線索：不得判定「猜題／認真」，Mastery 不是正式成績；GA4 只送去識別事件。研究設計見 Project 文件「教學實踐研究設計與平台資料蒐集評估」。
21. 測試學生帳號用 `config/testStudents` 白名單，只放寬信箱網域，放專屬測試班。
22. 教材建置流程：agent 先用 `npm run materials:preview <slug>`（只產生教材檔、不登錄教材目錄）＋`npm run materials:shots <slug>`，**停下來請教師看畫面**；教師滿意後才執行 `npm run materials:build <slug>` 完成登錄並 commit。不要直接改 `public/materials/` 的 HTML，也不要用教材工作室重複匯入元件庫建置的教材。 **教師決定（2026-10-01）：每份新資訊圖表定稿後，必須把 6 先備＋5 情境題寫入 `html/資訊圖表題庫_上傳用.xlsx`**（欄位同既有列：題目 ID 與教材一致、單選四選一、正確答案代碼與 Zuvio 序號、解析＋①～④引導式解析、講義標題與教材連結；選項打散；「說明」分頁更新次單元來源與合計題數），未寫入題庫不算完成。**只能在最後增列新列，既有列一律不得修改、刪除或重新排序（已上傳平台、學生已在作答；改動會讓該分類產生新題庫版本）。**
23. **用語（教師決定 2026-10-03）：一律使用台灣課本用語，不用大陸用語**（例：心搏量非每搏量、紅血球非紅細胞、微血管非毛細血管、受器非感受器、黏度非粘度、點選非點擊）。新教材與修改都要掃描用語；學生看得到的地方不得留下「⚠️」「請教師決定」等草稿註記。

## 待辦

**部署後教師待辦（1.6.2 已於 2026-10-02 上線）**
- ①題庫 `html/資訊圖表題庫_上傳用.xlsx` 第 108–162 列（55 題）貼到 Google Sheet 題庫分頁後按同步；②後台為五個新單元（血管構造解析、循環路線、血壓的調控、淋巴系統、血液動力學）建立互動教材活動（連各 `<slug>-v1`，6 節點／11 題）。
- `feature/heart-structure-v2`（心臟構造 v2，已驗收）未含在本次部署；要上線前先 merge 最新 main。
- 本機 `.git/info/exclude` 已加入 `html/` 五份 NotebookLM 原稿 RTF（來源已快照在 `materials-src/<slug>/source.rtf`）。
**可部署（2026-10-03 Claude 複驗 33e7700 通過）**：用語清單掃描 public/materials、materials-src、figures 全為 0（「扁桃體」已改為「扁桃腺」）；心搏量已統一（心輸出量、血壓調控、心電圖模擬器）；6 份預測回饋為說明句並實測顯示；題庫僅第 163、164、169 列共 10 格「每搏量→心搏量」，其餘逐格不變；所有題目 ID／答案不變；抽測 6 份無錯誤／溢位。在主資料夾確認分支 `feature/stage1-supplement` 後執行 deploy.sh。
- **教師決定（2026-10-03）：統一用「扁桃腺」**。Claude 已直接改 blood-pre-v1（2 處）、blood-post-v1（4 處），僅顯示文字，前測題目答案位置不變；用語檢查腳本已把「扁桃體」列為禁用詞。
**心臟II／Claude 複驗 b31b36d／9fd996d：修正完成，待 Claude 驗收**
- 本次基底 `e86761f`，分支 `feature/cardiac-output-visuals`；A1–A10（含 A9 建議）與心臟II 必修 1、3、4／建議 5–8 已完成，未 push／部署。
- 原創解剖心臟／血管與肝門放大圖、正確主動脈四段與立體點選、單行引線、路徑高亮、脈搏點與股靜脈位置完成；四狀態長條、拔河、六預測選項洗牌、公式樹、水管、電位兩週期與接力棒修正。
- 節點／題目 ID、正式 6＋5 題及 Excel 保留；只改六預測 options／answer，以及教師授權的兩條路徑顯示文字／新增主動脈弓誤解。手工電性 HTML 僅視覺常數不同，追蹤保留。
- 390／1280 截圖、完整作答、逐位元結果與第 2／5.1 節勾核見 `docs/HEART2_REVIEW_ACCEPTANCE.md`、`docs/HEART2_REVIEW_VERIFY.json`。check 119／19、兩端 build、version:check 通過；用語／草稿掃描 0。
- M1 已修：draft 空但 published 仍有次單元時，預覽顯示請先發布並停用確認；教師順序 **同步→保存／發布→合併**。Functions／React／記憶體 API 同步測試，詳 `docs/CHAPTER_MERGE_1.6.4_ACCEPTANCE.md`。
- 下一步：Claude 依新報告與截圖複驗，教師確認後才部署；固定決策 22 的本次 commit 依教師明確交辦執行，目錄未重登錄。
**Claude 複驗 2f78ae2（2026-10-03）**
通過：心輸出量長條依 mL 比例；6 份預測選項；拔河結點偏向贏方＋淨移動箭頭；水管三種捏法；竇房結兩週期；主動脈四段點選與定義、冠狀動脈開口、弓放大圖分支順序；右手狀態標籤不再重疊、只亮本路徑；肝門放大圖上下腔靜脈分別入右心房；股靜脈在內側；M1（未發布時提示並停用確認，測試涵蓋）。
必修（與 1.6.3 一起修，1.6.3 尚未部署）：
- C1 **節點內容重複**（1.6.3 起就有，Claude 先前驗收漏檢）：6 份新教材 34 個節點的第 1 個 point 都等於 summary；其中 15 個節點（血壓測量 01–04、血型 01／03／06、微血管 01／03／04／05、淋巴器官 05／06、主要動靜脈 01／02）points 有完全重複的句子，血型 01／06、主要動靜脈 01 的「觀察與應用」也只是重述 summary。改為：points 3 條彼此不同、不得等於 summary 或 concept 整句；「觀察與應用」寫應用或判讀，不重述。新文字只能取材自 `docs/STAGE1_SUPPLEMENT_SPEC.md` 與該教材既有內容，不得自行增加課本外知識；改動的每一句列成對照表（節點／舊／新）給 Claude 做醫學複核。
- C2 content 驗證腳本加檢查：同節點 points 正規化（去句號、空白）後重複、point 等於 summary／concept、clinical 等於 summary，一律報錯；全 21 份教材跑過。
- C3 主動脈弓放大圖：「左頸總」「左鎖骨下」的引線從字上穿過，「主動脈弓」引線與頭臂動脈引線交叉 → 引線從文字外緣起、彼此不交叉；「右側多一段頭臂動脈」改為框住頭臂動脈本身的淡色底框（目前只是旁邊的標籤框）。
- C4 電性活動對齊圖 1280 截圖的心電圖被卡片下緣截斷（390 正常）→ 確認實際頁面無 overflow 截斷，修正後附 1280 截圖。
- C7 **主動脈全段圖與弓放大圖的配色、分界、冠狀動脈**（教師 2026-10-03：「虛線標示很不清楚，整體顏色也很奇怪」「冠狀動脈的開口是二個，一個左一個右」）：
  - 配色：改成鮮明的動脈紅（參考教科書圖），例如主色 #D7263D、邊緣暗紅 #A3182C、中線亮部 #F06A7E，用柔和的圓柱漸層；去掉目前的暗栗色／褐紅、白色條紋與管內白色箭頭。背景白，橫膈淡粉紫半透明。
  - 點選某一段時：該段維持鮮紅，其他段改淺灰（#D9DDE3），不要用淡粉紅（目前看起來像褪色）。
  - 分界線：改為黑色點虛線（約 2.5px、點距明顯），橫跨整個血管寬度並向兩側各伸出約 10px，像參考圖一樣一眼看得到；每段旁邊另加細括號（或側邊色條）＋段名，標出該段起訖範圍。
  - 血流方向箭頭：改在血管外側（深灰、小），不要畫在管內。
  - 冠狀動脈：主動脈根部畫出略膨大的主動脈竇，**左、右各一個開口**，各接一小段血管：右冠狀動脈往圖左（人體右）、左冠狀動脈往圖右（人體左）；標「右冠狀動脈」「左冠狀動脈」，下方一行小字「→心臟血液供應」。
  - 弓放大圖、肝門放大圖與人體圖的動脈紅同步改用同一組顏色，三處一致。
  - **管徑加粗**（教師：「太細了，主動脈應該要粗一點，就像我貼給你的圖」）：比例參考教科書圖，主動脈是圖中最粗的結構。以 400 寬 viewBox 為準：全段圖升主動脈／弓直徑約 44px，胸主動脈約 38px、向下漸細到分叉處約 30px，髂總動脈約 20px，弓三分支約 16–18px（約主幹的 40%）；弓放大圖弓直徑約 70px、分支約 28px；冠狀動脈約 8–10px。版面需隨之放大，引線與標籤不可重疊。人體圖中主動脈也要明顯粗於其他動脈。
建議：
- C5 脈搏圖：肱動脈點在上臂外側，應在內側（肘窩內側）；顳動脈點再往外移到耳前。
- C6 右手狀態「右頭臂靜脈」標籤放在圖右（人體左側），改放圖左與其他右側血管同側。
**1.6.4 合併單元：完成，待 Claude 驗收（本次提交）**
- 空單元才顯示合併；預覽活動／受影響學生後確認。教師 callable 交易分別合併草稿／已發布活動與班級設定（目標優先），全體 progress 複製至目標、舊鍵保留、completed 不降級；研究／診斷不動。
- check 119 前端／19 Functions、兩端 build、version:check 過；行為／React／完成度測試與詳情見 `docs/CHAPTER_MERGE_1.6.4_ACCEPTANCE.md`。版本 1.6.4，未 push／部署；下一步 Claude 驗收。
**1.6.4 後台「單元／次單元」兩層選單：待 Claude 驗收**
- ChapterUnitPicker 共用兩層選單：單元依 orderedChapters／看板順序，次單元只列該單元分類；換單元重設第一個，清空題庫預覽／報表摘要與明細，舊非同步結果不覆蓋新選擇。
- 題庫讀取／版本徽章沿所選次單元；報表保留「全部」，此時次單元停用，仍依 Unit ID 篩選；研究資料頁依單元 optgroup 分組。
- 純前端顯示；資料結構／後端功能／完成度不變。版本檔全部同步 1.6.4；check 117 前端／18 Functions 及兩端 build 通過，新增實際 React 頁面操作測試。
- 報告 `docs/CHAPTER_UNIT_PICKER_1.6.4_ACCEPTANCE.md`；下一步 Claude 驗收選單。圖像修正本次完成待複驗，未 push／部署、main 未動。

- **部署後教師**：①第 108–162 列（若尚未貼）與第 163–228 列貼上 Sheet 題庫分頁並同步；②建立「心臟II」單元；③教材活動：心臟II＝電性活動、心電圖基礎、心輸出量、血壓測量、微血管交換、主要動靜脈；血液＝紅血球恆定、血型與輸血；淋巴系統＝淋巴器官。
**待 Claude 驗收**
- 教材元件庫 v1：`feature/material-kit` 的心臟構造樣板、內容驗證、建置／截圖工具已完成（最新提交 `feat: 建立教材元件庫與心臟構造樣板 [Codex]`）；截圖與報告在 `materials-src/heart-structure/shots/`（本機 gitignore）。驗收前不要轉換其他教材、不要 push 或部署。既有 `html/心臟構造.html` 與既有 `public/materials/` 版本未改。
**等教師決定**
- 待教師處理：後台血液氣體運送、止血機制活動改連 v2。
- 1.5.0 上線後實測：用測試學生帳號走一次「未達標→達標→逾期達標」確認標示。
- 長期流程其餘項目（未排程）：規格決策清單、把流程寫成 Skill、`App.tsx` 拆檔。
**技術待辦（未排程）**
- 題目作廢並重算（標記作廢題、重算分數／最高分／passedAt）。
- 後端 callable 缺行為測試（目前多為原始碼字串比對），`passedAt` 首次達標邏輯尚無行為測試。
- `diagnostics` 的 `summary` 欄位補索引排除；firebase-functions 版本升級。
- `html/血液氣體運送.html`、`html/止血機制與凝血病理.html`、`html/血液的組成.html` 的兩關改造與圖像化尚未全部完成、未正式發布。
- 端到端驗收（真實學生登入、名冊、同步、教材事件、報表、用量）。
**需要教師提供**
- Google Sheet：補齊單元欄、名冊資料。
- 研究用前後測、等值／遷移題內容（平台不自行杜撰）。
