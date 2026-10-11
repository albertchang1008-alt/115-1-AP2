# 專案交接（現況）
目前版本：1.7.1
> 只寫現況（約 150 行內）；歷史見 DEVELOPMENT_LOG.md 與 docs/archive/。

## 給接手的 AI agent
1. 開工讀本檔＋git log --oneline -5，需要功能細節再讀 docs 規格。
2. 改動前確認分支；未經教師明確同意，不 push、合併或部署 main（push main 自動上線）。
3. 每段工作收工更新本檔與 DEVELOPMENT_LOG.md；commit 結尾 [Codex]；不略過測試。
4. Claude 寫規格／獨立驗收，Codex 實作，教師裁定內容與部署。

## 目前狀態（2026-10-11）
- Release整合完成：`.worktrees/release-1.7.1-micro-immuno`／`codex/release-1.7.1-micro-immuno`／1.7.1；自ed08854依序整合微免 465c375c40f9170559e01db6e3f2dee485ad82b7 與最新main 3f6d92574c0c29b64a3cad2a352e9ce4add4b962。本次本機merge commit訊息結尾[Codex]，工作目錄乾淨；main／origin/main均為提交的祖先，待教師在本worktree執行scripts/deploy.sh。本次不push、不部署。
- npm ci／functions ci／materials:sync與完整check全通過：前端140、Functions29，0fail／skipped，版本檢查與兩端build成功。兩份微免登錄、Excel249題、看板及名冊修正逐項核對；未納入呼吸／血流未核可教材。報告`docs/RELEASE_1.7.1_465c375c40f9170559e01db6e3f2dee485ad82b7_IMMUNO_REPORT.md`，數據`docs/micro-immuno-review/release-integration-verification.json`。
- 微免截圖只存本機，142張PNG已由amend移出版控並.gitignore；原本機檔案仍在微免worktree，release沒有此資料夾。微免提交新增PNG／WebP截圖0，教材內嵌圖不改；主目錄、看板與血流worktree工作檔未動。
- 115-MI 微免：教師10/11核可畫面，兩份正式build＋shared/materials.ts登錄＋materials:sync完成；正式HTML SHA與核可preview相同。`feature/micro-immuno-review`自e8805f8，已本機提交，訊息「feat: 正式登錄微免兩份教材並追加22題 [Codex]」，工作目錄乾淨（SHA由git rev-parse HEAD取得），未push／合併／部署。主目錄及其他worktree未改。
- Excel新增22題：細菌「題庫」229–239列、免疫240–250列；每份6先備＋5情境，總249題。既有題庫228列與說明34列原始XML未變；說明只追加35–37列來源與新合計。Excel選項換位且正解映射核對，教師定稿JSON原文不改；未指定單元代碼，單元／次單元沿用原標題、課程代碼留空供教師匯入設定。
- `npm run check`前端134／Functions26全過，0fail／skipped，版本與兩端build成功；前輪三字型／兩寬252狀態、SDK4、46標準圖／140圖截圖集對應相同HTML。唯一kit仍核可hues22／216，credits僅核可形狀與署名。報告`docs/MICRO_IMMUNO_REVIEW_REPORT.md`、Excel保存證據`docs/micro-immuno-review/question-bank-verification.json`、完整check紀錄`full-check.txt`。
- Claude正式交件驗收通過（22題獨立逐題0錯），教師授權的整合已完成；只待教師從release worktree部署，截圖集只供原微免worktree本機檢視。
- 本次未變更正式站；讀取時本機main／origin/main＝3f6d925（版本檔1.7.0），已含名冊換信箱修正；本次未push／部署。
- 1.7.0 ①～④於10/6 Claude驗收通過；目前main已含此基底與名冊修正，上線請依上方release整合流程，不從舊功能分支直接部署。前端134／Functions26測試及兩端build通過；同步後會清除「全部重算」勾選。驗收 docs/PRACTICE_MODES_1.7.0_ACCEPTANCE.md。
- 任務基底 feature/1.7.0-practice-modes＝e8805f8（先依交辦提交既有交接及兩份規格，訊息 docs: 交接更新 [Claude]）。Git 過期 index.lock 已確認無 Git 程序後清除。
- 工作1分支 feature/respiratory-infographics：7份preview（各6節點／11題）與49張SVG、可拖曳氧解離曲線；未build、未登錄、Excel未動。教材實作依規格須等教師看畫面才commit，目前改動留本機。
- 工作1B報告：/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/05_review/Q3疑點研究_6題.md。Q3-28答案有爭議，其餘五題答案成立但需修解析；僅報告，未改Excel／卡片／進度，B未套入A。
- 原子卡第四輪26張已 self_checked，QC 0 error／warn；報告位於上述外部專案05_review/midterm_cards_round4_report.md，待Claude獨立驗收；總數88 awaiting_teacher_review／41 self_checked／69 reviewed／6 blocked。right-left-main-bronchi已由教師更正核可為reviewed。
- 工作2已完成：feature/1.7.1-completion-board＝ed08854，基底e8805f8；獨立工作目錄 /Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/completion-board（乾淨）。版本1.7.1、前端140／Functions26、兩端build／版本檢查通過，報告為該worktree內 docs/COMPLETION_BOARD_1.7.1_ACCEPTANCE.md（含6張1280／390圖），Claude10/8複驗通過，未push／部署；須先整合最新main及微免再部署，原目錄仍為呼吸分支1.7.0。

- **Claude 複驗通過（2026-10-08）**：呼吸 7 份 77 題仍與規格一致；提示／解析／預測回饋／12 句應用／重點拆分／狀態名稱／stats 均已改；解剖圖（矢狀切面、右主支氣管、右肺斜裂、肺泡三細胞標註、曲線虛線對照、胸廓壓力位置）已正確。**下一步：教師看 `docs/respiratory-preview.html`**，核可後才 build＋Excel 第229列起77題＋登錄＋commit。完成度看板 1.7.1（ed08854）複驗通過，上線需先在新release worktree整合微免及最新main，再由教師執行`scripts/deploy.sh`（見上方待辦）。

- 血流路徑動畫（2026-10-08 教師決定：一份教材四模式＝肺／體／胎兒／大腦；胎兒混合血紫色；含出生後閉鎖；先獨立；單元未定）：Codex 規格 `docs/BLOOD_FLOW_ROUTES_SPEC.md`。**階段 1 經 Claude 驗證通過**（35 句原文全核、解剖無誤、大腦第 4 步依表 11-2＋圖 11-17 核可、needs_review 已解除），教師抽查 4 張全核可（2026-10-08），已 reviewed（進度檔＋frontmatter）。**階段 2 已做至 preview＋shots，待 Claude 解剖／11題驗收與教師看畫面。** 視覺計畫 `docs/BLOOD_FLOW_ROUTES_VISUAL_PLAN.md`（worktree）為準；肺模式方案D與三小修教師已核可；依教師接續交辦，體／胎兒／大腦均已分次交preview，待整體圖面人工驗收。

- 血流階段2：`.worktrees/blood-flow-routes`／`feature/blood-flow-routes`／HEAD e8805f8，未提交。教師 10/9 判定第三輪美感不足，Claude 畫四模式樣張 v2（`docs/blood-flow-sample/blood-flow-sample-v2.html`；胎盤左側、臍動脈修圓），Codex 依樣張重畫完成（報告 `docs/BLOOD_FLOW_ROUTES_V2_REPORT.md`）。**Claude 10/9 驗收通過**：畫面與樣張逐步一致（僅三個心腔座標微調）；content.json／presentation.mjs／materials-build.mjs SHA 不變；Claude 以 Noto Sans CJK TC 補跑 1280／390 共 66 狀態：文字不壓當步血管、間距、越界、手機字 ≥12.5px、pageerror、水平溢位全過（僅肺第6步肺靜脈在心臟邊緣貼近心房名，屬可接受）。**下一步：教師看畫面**（`public/materials/blood-flow-routes-v1/index.html` 或截圖集 `docs/blood-flow-routes-preview.html`），核可後才 build＋Excel 新增 6 先備＋5 情境題＋登錄＋commit。

## 部署方式（教師執行）
```sh
zsh -ilc 'source ~/.nvm/nvm.sh && nvm use 22.23.2 >/dev/null && bash ~/Documents/ChatGPT/課程平台1.0/.worktrees/release-1.7.1-micro-immuno/scripts/deploy.sh'
```
- deploy.sh：npm run check → 備份 → Functions → 快轉push main；Firebase帳號 hhchang@ctcn.edu.tw。
- VERSION／兩端package與lock／shared/version.ts／apps-script/version.gs／public/version.json／三份文件版本行須同步（version:sync／version:check）。
- 既有本機資料不要納入：public/materials/coagulation-v1、html五份RTF、html/心電圖與心律不整解析.html；exclude現況保留。

## 固定決策（精簡版；細節見各 docs）

**資料與架構**
1. 學生入口 GitHub Pages，資料 Firebase（專案 `ap2-7ed91`，asia-east1）；舊題庫系統資料完全隔離。
2. 成績一律由後端以私有答案表重批，前端分數不採信。完整作答才更新最高分；錯題複習、抽題、綜合練習不更新最高分與完成度。
3. 題庫改版時錯題依題目 ID 延續；正解文字／選項數／題型改變或刪除的題目重置；教師可勾選全部重新計算；同步時讀舊版題庫比對（僅教師操作）；複習考與部署前的同步不延續。已發布快照不可變、最高分跨版沿用。所有錯題經 effectiveWrong；rm保留n，再錯累加；同日ok，Asia/Taipei隔日答對才移除。
4. 代碼（課程／單元／班級）由教師自訂，可中文、英數、`-`、`_`，不可空白標點，≤50 字，建立後不改。題目 ID 等仍限英數。
5. 時間欄位（datetime-local 無時區）一律以台灣 +08:00 解讀（`parseCourseTime`）。
6. Firestore 不接受 undefined 欄位：要清除的欄位直接省略。

**單元模型（1.4.0，`docs/UNIT_MODEL_1.4.0.md`）**
7. Sheet「單元」＝`Chapter`：開放、期限、門檻、必做、班級覆寫、活動、看板移動、完成度計數都在此層。Sheet「次單元」＝`Unit`（題目分類）：題庫版本、進度、錯題、完整測驗範圍。
8. 單元完成＝底下每個已發布題目分類的完整測驗最高分 ≥ 單元門檻，且必做活動完成。題目分類一律必做（沒有選做分類）；「選做／選看」只在單元（`Chapter.required`，可班級覆寫）與活動（`Activity.required` 覆寫，未設定沿用類型推導）兩個層級，不計完成度。1.7.0 閃卡＝翻卡、不寫入任何資料（含 attempted），舊閃卡分數保留。錯題複習＝逐題重做，只出昨天以前待複習，選10／20／30／50／≤50非檔位全部題數；時間範圍已移除，今天剛錯先看閃卡（複習考仍無閃卡）。完成度公式版本 3（`CURRENT_COMPLETION_FORMULA_VERSION`）。
9. 單元活動進度鍵 `chapter:<單元名>_<activityId>`。綜合練習只含看板「目前」、已發布的分類（含選看／已達標），不含複習考；可按單元／分類勾範圍，預設全選、以courseId＋uid本機存排除ID；閃卡／抽題／錯題複習全部不計分，題庫只在按練習後載所選。

**複習考（1.5.0，`docs/REVIEW_EXAM_1.5.0.md`）**
10. 複習考＝教師選多個分類組成的獨立 `Unit`（`unit.review`），題目複製成快照題目池；每次依比例隨機抽 N 題（未考過優先），抽滿配額才算完整作答；最高分 ≥ 門檻完成；逾期仍完成但標「逾期完成」（`progress.units[id].passedAt`）。來源更新需教師按「重新組卷」。一般單元不放題目練習活動。

**題庫同步與題目**
11. 同步只讀與課程代碼同名的分頁；「單元」欄是分組、「次單元」欄是分類；「啟用」欄 FALSE 的列略過；同步只新增／更新，不自動刪除（舊分類以 `staleUnits` 提示教師清理）。分類名稱跟隨 Sheet 次單元。
12. 選項每次洗牌；測驗選項不顯示 A/B/C/D。完整測驗作答中不揭曉正解，交卷後才看；翻卡翻面顯示，抽題／錯題複習送出單題後顯示。
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
24. **藥物與疾病（教師決定 2026-10-07）：Q1–Q8 任何題目內容和藥物或疾病有關，一律納入「國考延伸」補充教材**（9/25「正式教材不放疾病藥物」的配套）；出處第一順位指定課本、第二順位其他課本並逐句註明。規格見 Project 文件「期中考國考延伸補充教材規格」第 5 節。
## 待辦
- 微免＋看板release已驗證且本機提交；下一步教師從release worktree執行deploy.sh。
- 血流：v2 已由 Claude 驗收通過，待教師看畫面；核可後依固定決策 22 正式 build、Excel 末列新增 11 題、登錄、commit。
- 工作1：最終兩尺寸截圖／作答驗證已通過（14頁全流程，check134／26），預覽見docs/RESPIRATORY_INFOGRAPHICS_PREVIEW.md，10/8Claude複驗通過，待教師看畫面；核可前不build、登錄、寫Excel或commit教材。核可後Excel僅第229列起增77題，既有列不可改。
- 工作1B：Claude已核對報告引句，待教師裁定六題與資訊圖表修訂；教師原決定Q3／Q4先不上平台仍有效。
- 工作2：三項修正已提交ed08854，check140／26及Claude複驗通過；教師決定部署。
- 第四輪26張原子卡待Claude獨立驗；國考延伸兩份教材與補建卡另開單，這次不做。
- 1.7.0部署後教師實測：改一題錯字同步顯示保留／重置0題；閃卡不改最高分；完整測驗完成度、逾期與首頁定位。
- 題庫Excel第108–228列待教師貼Sheet並同步；後台依 docs/LIVE_INFOGRAPHICS_CLASSIFICATION.md 建活動；血液氣體運送／止血機制活動改連v2。
- feature/heart-structure-v2（9/25驗收）及feature/material-kit（待驗）未部署；部署前合併最新main。其他已完成階段細節查DEVELOPMENT_LOG。
- 快照INTERNAL：教師10/6決定本輪不修。下輪先查正式log；已本機重現forClass無條件research:undefined造成Firestore拒絕，需省略欄位＋真實序列化回歸測試，保留進度。
- 未排程：passedAt首次達標後端行為測試、題目作廢重算、diagnostics.summary索引排除、firebase-functions升級、App拆檔、真實學生端到端驗收。
- 研究前後測／等值遷移題及Google Sheet名冊、單元欄由教師提供。
