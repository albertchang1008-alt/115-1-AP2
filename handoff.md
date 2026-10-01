# 專案交接（現況）

目前版本：1.6.2

> 這份文件只寫「現在」：版本、分支、固定決策、待辦。**上限約 150 行。**
> 完成或過期的項目直接刪掉，改記在 `DEVELOPMENT_LOG.md`（新版本在最上面）。
> 2026-09-23 以前的完整交接歷史：`docs/archive/handoff-2026-09-23.md`（需要查舊決策脈絡時才讀，平常不用讀）。

## 給接手的 AI agent

1. 開工只需讀本檔＋`git log --oneline -5`；需要某功能細節時再讀對應 `docs/*.md`。不要整份讀 `DEVELOPMENT_LOG.md` 或 archive。
2. 改動前 `git branch --show-current`；未經教師明確同意，不 push、不合併、不部署 `main`（push main＝GitHub Pages 自動上線）。
3. 收工前更新本檔：改「目前狀態」「待辦」，把完成的項目移出（一兩行寫進 `DEVELOPMENT_LOG.md`）。不要在本檔追加流水帳。
4. Commit 結尾附身分標註（Claude：`Co-Authored-By: <model> <noreply@anthropic.com>`＋session 連結；Codex：`[Codex]`）。不用 `--no-verify`、不強推、不略過測試。
5. 分工：Claude 寫規格與驗收；Codex 實作；教師做決策與部署。規格放 `docs/`，交辦寫在本檔「待辦」。

## 目前狀態（2026-10-02）

| 項目 | 狀態 |
|---|---|
| 正式站 | **1.6.1**。`origin/main`＝`7e4732b`（正式站 `version.json`＝1.6.1，2026-10-02 Claude 確認） |
| 可部署分支 | `hotfix/1.6.2-student-name`（合併 `b00041d`＋交接 `5f41c1f`）：1.6.2 姓名＋五份教材＋題庫 55 新題。**2026-10-02 Claude 部署前確認通過**：origin/main 可快轉；教材／題庫／目錄與 aabb2d2 逐位元相同；1.6.2 程式與 0205baa 相同；版本全 1.6.2；coagulation-v1 未追蹤。**可由教師執行 deploy.sh** |
| 開發分支 | `feature/1.6.0-progress-ui` 已等於正式 main（之後僅本行 handoff 更新）；本機 `main` 未更新（deploy.sh 不動本機 main）。其他功能分支（`feature/heart-structure-v2`、`feature/material-kit`、`feature/ecg-basics`）下次部署前需先 `git merge` 最新 main |
| 1.5.0 複習考 | 已上線。規格 `docs/REVIEW_EXAM_1.5.0.md` |
| 1.6.1 隨堂診斷捲動 | **已上線**（origin/main 7e4732b）。三份心臟教材按「兩階段隨堂診斷」後自動捲到題目 |
| 1.6.2 單元卡姓名 | `hotfix/1.6.2-student-name`（5071f44，由 1.6.1 建立）：**Claude 驗收通過、待部署（2026-10-02）**。已完成／已完成（逾期）時狀態標籤下方顯示本人名冊姓名，與標籤同字級（12／最大字級 15.6px）同高；未完成不顯示；教師預覽「預覽學生」；bootstrap 只回本人姓名。未 push／部署。報告 `docs/STUDENT_NAME_1.6.2_ACCEPTANCE.md`。 |
| NotebookLM 教材初稿流程 | 2026-09-30 已提供教師「互動式資訊圖表」內容整理提示（含明確範圍、排除項目與來源依據要求）；NotebookLM 僅整理可教學內容、圖表建議與題目草案，後續由 AI agent 依平台元件、追蹤與建置流程實作。 |
| 五份新教材 | `blood-vessels-v1`、`circulation-routes-v1`、`blood-pressure-regulation-v1`、`lymphatic-system-v1`、`hemodynamics-v1`（來源分支 aabb2d2）：已登錄、已 commit。**Claude 驗收通過、待部署（2026-10-02）**（同上）。待部署 |
| 資訊圖表題庫補登 | **Claude 驗收通過、待部署（2026-10-02）**：以 git 7e4732b 對 2d8fcd5 逐格比對，既有 106 題零變動、說明頁僅合計 106→161；新 55 題與教材 HTML 題幹／選項／正解／題序一致、ID 不重複、Zuvio 序號正確。**待教師把第 108–162 列貼到 Google Sheet 題庫分頁後同步** |
| 1.6.0 學習進度介面 | **已上線（2026-09-29）**。完整閃卡不計分（舊分數保留）、題目分類一律必做、選做只在單元與活動層級、完成度公式維持 v3。規格 `docs/1.6.0-學習進度介面規格.md`，驗收 `docs/PROGRESS_UI_1.6.0_ACCEPTANCE.md`。**上線後待實測**：測試學生帳號完整閃卡滿分後最高分不變；完整測驗達標後單元變為已完成；首頁待辦、逾期標示與「去練習」定位。 |
| 教材元件庫 v1 | `feature/material-kit`：心臟構造樣板已完成，待 Claude 驗收；其他教材尚未轉換 |
| 心臟構造圖像強化版 v2 | `feature/heart-structure-v2`：第二輪（版型比照傳導系統 v2、閱讀提示與窄版捲動）**2026-09-25 Claude 驗收通過**；Claude 將節點示意圖改為 HTML 方塊修正文字溢框。已登錄目錄。待教師以 deploy.sh 從此分支部署。 |
| 未追蹤檔 | 五個 `html/*.rtf` 草稿維持未追蹤、不 commit； `public/materials/coagulation-v1/`：既有資料，不要碰、不要 commit（已列入本機 `.git/info/exclude`，deploy.sh 的乾淨檢查不會被擋） |
| 教材工作室 | 2026-09-24 已健康檢查：`npm run materials:studio` 可在 `127.0.0.1:5183` 提供 `/api/list`；目前列出 11 份本機教材，其中 `coagulation-v1` 有檔案但未登錄目錄（既有狀態，勿處理）。匯入區可貼上、點擊選取或拖放 `.html/.htm/.xhtml`；檔案先填入程式碼欄與預覽，需按匯入才寫檔。`.command` 與 `.app` 會主動載入 Node 22.23.2，若 5183 已有健康服務則直接開啟。僅本機匯入／稽核／目錄管理，不跑 git、push 或部署。 2026-09-25 起啟動器會比對 `/api/version`：程式檔比執行中的服務新（或舊服務不支援版本檢查）就自動關掉重開，避免沿用舊稽核邏輯。 |
| ECG 基礎教材 | `feature/ecg-basics`：`ecg-basics-v1`（未發布）。2026-09-24 Codex 實作驗收不通過後，**由 Claude 依規格完成**（模擬器、暫停選拍／放大標示、卡尺、第一關 2 選擇＋4 標示），驗收紀錄 `docs/ECG_SIM_LABEL_ACCEPTANCE.md`。待教師醫學內容複核後才可發布。 |
| 三份心臟圖像強化教材 | `feature/ecg-basics`：`cardiac-conduction-v2`、`cardiac-cycle-v2`、`coronary-circulation-v1`（Codex 手工單檔版，教師已看過並同意登錄）。**2026-09-25 Claude 驗收通過**：390／1280 無錯誤與橫向溢位、圖檔皆載入、6 節點各送一次 explore、第二關全對才 complete（錯一題不送）、題目 ID 與目錄一致；傳導系統與心動週期的 11 題與題目集完全一致。驗收時修正冠狀循環頁載入即同時顯示「通關／未通關」橫幅的 CSS（`html/心臟血液供應.html` 同步；`html/心臟構造.html`、`html/紅血球的恆定機制.html` 同一問題一併修正）。未發布。 |
| 心臟的電性活動 | `html/心臟電性活動.html` 已由原草稿重建為 9 節點互動資訊圖表：起搏、心房傳導、房室結暫緩、希氏束／束支、浦金氏纖維、兩類心肌細胞、動作電位高原期、P／QRS／T 對照；保留 6 題先備＋5 題生活情境題與 CourseLearning 追蹤。390px Chrome 實測 9 節點、診斷切換、無錯誤／橫向溢位。**僅原始教材草稿，未登錄、未發布；待教師看版型與內容後才決定版本號與目錄登錄。** |
| 心臟的電性活動補修 | 2026-09-25 補上工作心肌 phase 0–4、L 型 Ca²⁺ 通道、phase 2 Ca²⁺／K⁺ 暫時平衡及 ST 間段對照；初始情境圖與傳導節點改直接顯示既有四格心臟傳導素材，不必先點選才切換。Chrome 無錯誤；未登錄、未發布。 |
| 心臟的電性活動互動優化 | 桌面（≥900px）為節點欄＋sticky 主圖解說雙欄；行動點擊節點會回捲主圖。情境實驗室有 1.2 秒自動播放／暫停，結束回第一步；預測題有正誤樣式與鎖定。ECG 四卡窄版（≤620px）改水平 snap 捲動。第二關任一答錯會列出對應節點的直達復習鈕（本輪全對才通關）。2026-09-25 以 390px／1280px 實測，無錯誤或橫向溢位；未登錄、未發布。 |
| 心臟的電性活動題庫 | 教材內的預測題及 11 題兩階段診斷均統一為四選一；相同 11 題已新增至 `html/資訊圖表題庫_上傳用.xlsx`（「心臟構造／心臟的電性活動」，題序 1–11，含正解與解析），說明頁合計更新為 106 題。頁尾教學範圍句子已移除。2026-09-25 實測 11 題皆 4 選項且無控制台錯誤；未登錄、未發布。 |
| 心臟的電性活動驗收 | **2026-09-25 Claude 驗收與修正**（教師確認：節點數不限 6 個，本份 9 個為教師指定）。修正：①平台 SDK 移到頁首、頁面載入不再自動送 explore（原本節點 1 永遠記不到，探索最多 8／9）；②答對後顯示解析；③四段互相覆寫的程式整併為單一版本（資料集中在 N／A／B，公平洗牌、addEventListener、按鈕 type 與 aria-pressed），頁尾改在 HTML 移除；④P／QRS 卡改為「隨後心房／心室收縮」，移除「不作疾病判讀」；⑤竇房結數字卡改為 70~80 次／分（教師決定）；⑥第二關標籤統一為【生活情境】【實驗觀察】【模型觀察】【生理判讀】；⑦Excel 11 題選項打散。390／1280 實測：9 節點各送一次 explore、11 題皆四選一、全對才 complete、答錯列出復習節點、無錯誤與橫向溢位。發布時需一併複製 `html/assets/cardiac-conduction-flow-strip-v1.png` 到教材資料夾的 `assets/`。浦金氏／浦金埃氏纖維名稱待教師決定。 |
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

## 合併驗證（2026-10-02 Codex）

- `npm run check`：前端 115／Functions 18 測試、兩端建置、version:check 全通過。
- 題庫及五份公開 HTML／目錄與 aabb2d2 逐位元相同；原 106 題 2,544 格與列 XML 不變，合計 161 題；coagulation-v1 未納入。
- 本機真實 Student 預覽 390／1280、完成／逾期／進行中及最大字級、教師預覽等邊界通過，無錯誤；五份教材 Chrome 390／1280 開啟與互動通過（explore、複習後重試、最後答對 complete、無錯誤／溢位）。

## 待辦

**可部署：等教師執行（2026-10-02 Claude 確認通過）**
- 在 Mac 確認主資料夾目前分支為 `hotfix/1.6.2-student-name`，再執行上方「部署方式」的 deploy.sh 指令；完成後確認正式站 `version.json`＝1.6.2。
- 部署後教師兩件事：①題庫 `html/資訊圖表題庫_上傳用.xlsx` 第 108–162 列貼到 Sheet 題庫分頁後同步；②後台為五個新單元建立互動教材活動（連各 `<slug>-v1`，6 節點／11 題）。
- 本次**不含** `feature/heart-structure-v2`（心臟構造 v2，已驗收待部署）；它與本分支分開，下次部署前需先 merge 最新 main。

**待 Claude 驗收**
- 教材元件庫 v1：`feature/material-kit` 的心臟構造樣板、內容驗證、建置／截圖工具已完成（最新提交 `feat: 建立教材元件庫與心臟構造樣板 [Codex]`）；截圖與報告在 `materials-src/heart-structure/shots/`（本機 gitignore）。驗收前不要轉換其他教材、不要 push 或部署。既有 `html/心臟構造.html` 與既有 `public/materials/` 版本未改。

**等教師決定**
- 待教師處理：後台血液氣體運送、止血機制活動改連 v2。
- 1.5.0 上線後實測：用測試學生帳號走一次「未達標→達標→逾期達標」確認標示。
- ECG 基礎教材內容複核：請確認採六節點 `ecg-basics-v1`，並確認進階異常波形另案醫學審稿；核定前不發布。
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
