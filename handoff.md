# 專案交接（現況）
目前版本：1.7.0
> 只寫現況（約 150 行內）；歷史見 DEVELOPMENT_LOG.md 與 docs/archive/。

## 給接手的 AI agent
1. 開工讀本檔＋git log --oneline -5，需要功能細節再讀 docs 規格。
2. 改動前確認分支；未經教師明確同意，不 push、合併或部署 main（push main 自動上線）。
3. 每段工作收工更新本檔與 DEVELOPMENT_LOG.md；commit 結尾 [Codex]；不略過測試。
4. Claude 寫規格／獨立驗收，Codex 實作，教師裁定內容與部署。

## 目前狀態（2026-10-15）
- **10/15 呼吸七份發布已完成，停下交 Claude 驗收**：依教師11:50裁定，七份build／登錄，Excel229–305列增77題共304，舊5472格不變；Sheet115-1-AP2完整476列CSV已備份（docs/sheet-backups/忽略不提交），AC–AE增三欄、227舊題只補三欄、175其他題不動、404–480列增77題，共479題。全表值／公式及11687原生儲存格逐格零差異，77 ID純文字且無重複；完整證據docs/respiratory-release/REPORT.md及JSON。七份126狀態verify、節點21／15、materials20、check前端134／Functions26均過0skip。feature/respiratory-infographics，本機單一release commit以git log -1為準（基底e8805f8）；不push／部署／平台同步。下一步Claude驗收，教師另決同步與部署。[Codex]
- **ChatGPT 底圖 68 張已全通過**（_review.json 全 pass；呼吸28、泌尿／體液40），私人照片已移除。呼吸兩階段實作完成見上；泌尿／體液尚無 content.json，另開交辦，不進教材實作。
- **肺與胸膜階段一已由 Claude 驗收通過**（含 R-1～R-8、避頭點與 B 比較截圖），教師已選 A。舊複修紀錄見 DEVELOPMENT_LOG.md、docs/RESPIRATORY_LABELS_V2_CLAUDE_REVIEW.md；本輪不重畫肺／胸膜與呼吸道；release正式build更新兩份HTML，圖層來源保持。
- **學生說明主畫面（10/14 Codex，B完成）**：A教師端項目由教師親自驗證正常，正式班未操作；MI release本機merge 1ba1743（efeb1e7＋8e61f58）保留雙方全部紀錄，合併後check150／54全過0 skipped、guide1280／390及列印／MI子路徑200通過。停在本機commit，待Claude複驗，不push／部署；交辦與報告在.worktrees/release-mi-1.9.0/docs/。
- **MI1.9.0上線（10/14，A完成）**：migration已成功不可重跑；deleteCourse單項重試成功、規則索引／Actions38514907129／Pages成功，正式mi/main=b64217d。同公開variables乾淨重建的線上JS雜湊一致，教師親驗test正常。詳release worktree handoff與A報告；本輪不再部署、Excel／正式學生資料未改。
- **1.9.0準備已驗收**：MI .worktrees/release-mi-1.9.0／release/mi-1.9.0本機510b6ad（parents70354e0＋7a6720e），共用測試回補178f862；24衝突解決、d48aac8保留，29個未追蹤AP2公開教材移repo外不提交；純暫存匯出MI check150／54、dist2教材＋3CHP、離線dry-run均通過。Claude.xlsx無變動稽核採用。.firebaserc不改、MI指令必--project mi-bd885。AP2正式main7a6720e已發布驗證不變，root教材工作保留。
- **ChatGPT本機製圖輔助／網頁控制台（10/13 Codex）**：chatgpt_auto_illustrator.py＋chatgpt_illustrator_web.py，說明 docs/CHATGPT_AUTO_ILLUSTRATOR.md。教師提供 /Users/HHC/Downloads/CHATGPT_PROMPT_PACK_UNIQUE_2026-10-13.md，與repo版SHA一致（68張／16單元）；網頁預設載入此檔，支援上傳MD、slug／張數／網址、登入完成、開始／續跑／停止、日誌與圖庫。Persistent獨立profile共用、每包雜湊獨立進度；不保證免驗證，Chrome日常預設profile不支援。Google拒絕自動化瀏覽器登入後已改一般Chrome本人登入（不啟用Playwright／remote-debugging），登入完成按鈕會正常關閉工具登入Chrome後才續跑；生成前檢查鎖PID，死程序鎖交Chrome原生回收不刪鎖。14項本機測試全過，桌機1280／手機390無pageerror或溢位；虛擬環境.venv-illustrator已安裝Playwright1.60／Pillow11.3。控制台本次已啟動 http://127.0.0.1:8765（exec session62696）；重開用 .venv-illustrator/bin/python chatgpt_illustrator_web.py。教師後續回報existing-session錯誤，已核對並正常關閉工具登入Chrome PID67361，修正keychain旗標；實際persistent Chrome啟動／ChatGPT聊天框載入成功（無prompt）。教師回報Cloudflare驗證反覆出現，已停止該次generate等待並保留進度，尚未送prompt；Playwright實際網站可用性未通過，不再反覆啟動重試。下一步待教師選擇一般Chrome擴充功能版（仍不能保證免驗證）或保留工具暫停；再登入時按「登入完成，關閉登入視窗」。未操作帳密／產圖。feature/respiratory-infographics／e8805f8，未commit／push／部署。
- **10/13 Claude 審查呼吸／泌尿／體液（已完成，未commit）**：摘要 docs/RESPIRATORY_URINARY_REVIEW_SUMMARY_2026-10-13.md（含教師待答6題）。①呼吸道V2 docs/AIRWAY_FIGURES_V2_CLAUDE_REVIEW.md：**有條件通過、可交教師看畫面**，無解剖錯誤；Claude獨立重跑1280／390（0錯誤、最小30.40／13.28px、紅字18狀態吻合、無變形），183檔SHA不變；Codex小修A-01～A-04（node-04杓狀軟骨錨點、「後」與圖說、會厭錨點；node-03後面觀圖說），只改scripts/airway-figures.py圖層。②呼吸六份prompts docs/RESPIRATORY_PROMPTS_CLAUDE_REVIEW.md：54段中34段可交ChatGPT、20段待教師C1（資料層建議原生SVG）；C2氧曲線保留oxygen-curve.js程式；C3–C5已依CH06修文（V/Q單位L/分、頸動脈體位置p.30、95不指肺靜脈）。③泌尿／體液 docs/URINARY_FLUID_CLAUDE_REVIEW.md：90段中63段可交（待教師確認U1）、13段待資料層、14段待六卡核可或數值擇一（PCT 67%／75%、RBF 1200／1100、50kg自編例）；六卡經CH09原頁核對均相符、建議核可但Claude未改卡片／進度。Claude已直接修規格文件（簡體字、重複狀態名、3份總覽紅字錯位、RAAS空白來源、prompt內審查者指示等），差異 docs/respiratory-v2-specs/、docs/urinary-fluid-specs/ 各 CLAUDE_EDITS_2026-10-13.diff；content／Excel／登錄／258與33來源SHA均未變。
- **10/13 16:45 教師裁定（呼吸／泌尿／體液）**：審查建議全採；用詞併呈「逼尿肌（迫尿肌）」「紅血球生成素（腎紅血球生成因子）」；C1資料層改原生SVG（呼吸20、泌尿體液16圖位）。Claude已改規格（U1去重、PCT 67%／75%、RBF不標、過濾壓p.12、刪50kg例）並產 docs/CHATGPT_PROMPT_PACK_2026-10-13.md（108段）；作圖改用唯一底圖版 docs/CHATGPT_PROMPT_PACK_UNIQUE_2026-10-13.md（68張：呼吸28＋泌尿體液40，涵蓋全部108圖位，箭頭／紅字／路線由程式疊加），教師自行貼ChatGPT，肺與胸膜8張已試畫（審查 docs/IMAGE_REVIEW_lungs-pleura_2026-10-13.md：04／06／08通過，8張重畫後全部通過、底圖定稿；開場指令已補「不畫箭頭／引線、肺動脈藍肺靜脈紅」）；半自動作圖助手 scripts/chatgpt_assist.py（本機網頁 localhost:8765，自動放剪貼簿、監看下載資料夾轉PNG改名到 incoming/，說明 docs/CHATGPT_ASSIST_USAGE.md；新指令包格式 docs/CHATGPT_PROMPT_PACK_FORMAT.md，助手自動讀docs/最新符合格式的指令包、網頁可切換；不操作ChatGPT網頁、不用API）。六卡核可勾選清單已寫 072026專案 05_review/教師核可_泌尿體液六卡_20261013.md，**待教師本人跑 apply_teacher_review.py**（dry-run已過）。post-review交辦已於10/14階段一完成（見上），待Claude複驗；不build／Excel／登錄／commit。學生端使用說明規畫 docs/STUDENT_GUIDE_PLAN.md，待教師答4題。
- **教材圖風格（10/13 22:45 教師定案）**：底圖改手繪解剖圖譜畫風（不透明水彩、霧面、光源左上、圖譜配色、單一尺度），箭頭與標籤一律由程式疊加（Nature式箭頭文法、色盲友善）；指南 docs/FIGURE_STYLE_GUIDE.md，開場指令與68段prompt已更新。肺與胸膜8張新畫風全部通過、底圖定稿（10/13 23:05 Claude，審查記錄 docs/IMAGE_REVIEW_lungs-pleura_2026-10-13.md 末節）；其餘呼吸20張亦已於10/14定稿；泌尿／體液素材由教師續作。教師10/14已定案重點 A 紅色粗體。
- 10/13修正已上線：教師授權後提交d48aac87並正常push mi/main；Actions38317348554 build/deploy成功。前端135＋Functions42全過0跳過、版本／兩端編譯／49入口通過；線上index-Cq6saXmE.js SHA256與本機已測build逐位元相同。正式Chrome選前測補考＋理由再切後測，自動回一般正式測驗、理由消失。影片重整等待進度修正同批上線（延遲／失敗重試本機fixture已驗，本輪未新增線上學生播放）。僅前端更新，不部署Functions、不操作正式場次或成績；版本仍1.7.1。MI codex/115-mi-assessments HEAD與mi/main=d48aac87，發布後證據交接留本機未提交；根目錄e8805f8不部署。證據docs/mi-exam-review/fixes-release-verification.json及teacher-kind-switch-fixed-live.png。
- 115-MI國考佈建（10/13 Codex，已完成）：教師已指定套用74題Claude修訂、仍有疑義排除。74題已套入reviewed-bank.json，69可用／5待裁定排除；通過291另3待裁定排除，合計357來源題可用、50排除（42停用＋8未決）。現行資料核對128／171／223／235，修正171入學前疫苗DTaP-IPV及223移除過時累計數。Sheet115-MI／115-1-MI-國考精準對焦已寫入並逐格驗證：原83列ID保留、新增297、60既有解析更新、2既有題幹／選項修訂、1停用，共380列／379啟用；parser32分類（原5＋25新＋前後測2）。reports：docs/mi-exam-review/revisions-applied.json、deployment-selection.json。47課後YouTube已發布於mi-bd885六選做Chapter，原2小時教材保留。課序同步並發布完成：30分類／365題（原68＋新增297）、47影片、6選做Chapter，25新分類visibility=current；N551／N552／test可見。前後測14題已同步私有assessmentSources，各7題；正式前測待開放。實際bank分塊驗證297新ID存在、50排除來源ID及停用micro-111-1-r0274均未出現；報告deployment-completed.json及deployed-bank-verification.json、畫面course-published.png。分支feature/respiratory-infographics／HEAD e8805f8，未commit／push／程式部署。
- 泌尿／體液下一批規格（10/11 Codex）：docs/URINARY_FLUID_INFOGRAPHICS_SPEC.md＋docs/urinary-fluid-specs/十份詳細作者草案；建議泌尿6＋體液4＝10次單元／10份資訊圖表、60節點／70圖位／90段ChatGPT prompts／110題考點藍圖（未命正式題）。33來源卡中27 reviewed、6待教師；比例／解剖／單位爭點列U1–G2，待Claude回核原PDF。10/13 Claude 已審（見上）。僅文件，258保護檔及33來源卡SHA不變，未產圖或改教材／Excel／登錄；分支feature/respiratory-infographics／HEAD e8805f8、未commit。
- 呼吸其餘六份製圖規格（10/11 Codex）：docs/RESPIRATORY_FIGURES_V2_SPEC.md＋docs/respiratory-v2-specs/六份詳細規格，42圖位／54段ChatGPT prompts（含18個總覽狀態），標籤／紅字／出處／題目覆蓋與驗收已列。教師指定圖由ChatGPT做，Codex只寫prompt；先Claude審，不產圖或實作。Claude交辦 CODEX_TASK_respiratory-prompts_CLAUDE_REVIEW_2026-10-11.md，10/13 Claude 已審（見上）。258檔SHA不變；曲線互動接合等C1–C6待裁定。分支仍feature/respiratory-infographics／HEAD e8805f8，未commit。
- 呼吸道構造圖 V2（10/11 Codex）：七圖已換 ChatGPT WebP 底圖＋原生中文 SVG 標籤，overview 三狀態紅字切換；喉軟骨／聲帶兩格上下排，手機最小13.28px，HTML約1.124MB。preview、節點稽核、materials20測試、18狀態字框／引線／錨點檢查通過；報告 docs/AIRWAY_FIGURES_V2_REPORT.md，截圖 docs/respiratory-screenshots/airway-v2/。content與其他六份來源／preview、Excel、登錄檔SHA不變。分支 feature/respiratory-infographics／HEAD e8805f8，未commit；10/11狀態確認：本輪圖面實作已完成，剩Claude獨立驗收＋教師看畫面；核可後另行授權正式build、11題增列Excel、登錄、commit與部署。現仍不build／Excel／登錄／push／部署。
- origin/main7a6720e（AP2 1.9.0已發布驗證），本機main仍a593796；root程式仍1.7.0，不从root部署。
- 1.7.0 ①～④於 10/6 Claude 驗收通過，待教師從 feature/1.7.0-practice-modes 執行 deploy.sh。前端134／Functions26測試及兩端build通過；同步後會清除「全部重算」勾選。驗收 docs/PRACTICE_MODES_1.7.0_ACCEPTANCE.md。
- 任務基底 feature/1.7.0-practice-modes＝e8805f8（先依交辦提交既有交接及兩份規格，訊息 docs: 交接更新 [Claude]）。Git 過期 index.lock 已確認無 Git 程序後清除。
- 呼吸系統規畫確認（10/11）：依 docs/RESPIRATORY_INFOGRAPHICS_SPEC.md A1，單元「呼吸系統」下7次單元，一對一7份資訊圖表；每份6節點＋1總覽（7圖）、11題。呼吸道的構造本身是其中1次單元／1份教材，6節點不另拆次單元。
- 工作1B報告：/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/05_review/Q3疑點研究_6題.md。Q3-28答案有爭議，其餘五題答案成立但需修解析；僅報告，未改Excel／卡片／進度，B未套入A。
- 原子卡第四輪26張已 self_checked，QC 0 error／warn；報告位於上述外部專案05_review/midterm_cards_round4_report.md，待Claude獨立驗收；總數88 awaiting_teacher_review／41 self_checked／69 reviewed／6 blocked。right-left-main-bronchi已由教師更正核可為reviewed。
- 工作2已完成：feature/1.7.1-completion-board＝ed08854，基底e8805f8；獨立工作目錄 /Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/completion-board（乾淨）。版本1.7.1、前端140／Functions26、兩端build／版本檢查通過，報告為該worktree內 docs/COMPLETION_BOARD_1.7.1_ACCEPTANCE.md（含6張1280／390圖），待Claude獨立驗收，未push／部署。原目錄仍是呼吸分支1.7.0，不可直接從此部署看板。


- 血流路徑動畫（2026-10-08 教師決定：一份教材四模式＝肺／體／胎兒／大腦；胎兒混合血紫色；含出生後閉鎖；先獨立；單元未定）：Codex 規格 `docs/BLOOD_FLOW_ROUTES_SPEC.md`。**階段 1 經 Claude 驗證通過**（35 句原文全核、解剖無誤、大腦第 4 步依表 11-2＋圖 11-17 核可、needs_review 已解除），教師抽查 4 張全核可（2026-10-08），已 reviewed（進度檔＋frontmatter）。**階段 2 已做至 preview＋shots，待 Claude 解剖／11題驗收與教師看畫面。** 視覺計畫 `docs/BLOOD_FLOW_ROUTES_VISUAL_PLAN.md`（worktree）為準；肺模式方案D與三小修教師已核可；依教師接續交辦，體／胎兒／大腦均已分次交preview，待整體圖面人工驗收。

- 血流階段2：`.worktrees/blood-flow-routes`／`feature/blood-flow-routes`／HEAD e8805f8，未提交。教師 10/9 判定第三輪美感不足，Claude 畫四模式樣張 v2（`docs/blood-flow-sample/blood-flow-sample-v2.html`；胎盤左側、臍動脈修圓），Codex 依樣張重畫完成（報告 `docs/BLOOD_FLOW_ROUTES_V2_REPORT.md`）。**Claude 10/9 驗收通過**：畫面與樣張逐步一致（僅三個心腔座標微調）；content.json／presentation.mjs／materials-build.mjs SHA 不變；Claude 以 Noto Sans CJK TC 補跑 1280／390 共 66 狀態：文字不壓當步血管、間距、越界、手機字 ≥12.5px、pageerror、水平溢位全過（僅肺第6步肺靜脈在心臟邊緣貼近心房名，屬可接受）。**下一步：教師看畫面**（`public/materials/blood-flow-routes-v1/index.html` 或截圖集 `docs/blood-flow-routes-preview.html`），核可後才 build＋Excel 新增 6 先備＋5 情境題＋登錄＋commit。

## 部署方式（教師執行）
```sh
zsh -ilc 'source ~/.nvm/nvm.sh && nvm use 22.23.2 >/dev/null && bash ~/Documents/ChatGPT/課程平台1.0/scripts/deploy.sh'
```
- deploy.sh：npm run check → 備份 → Functions → 快轉push main；Firebase帳號 hhchang@ctcn.edu.tw。
- VERSION／兩端package與lock／shared/version.ts／apps-script/version.gs／public/version.json／三份文件版本行須同步（version:sync／version:check）。
- 既有本機資料不要納入：public/materials/coagulation-v1、html五份RTF、html/心電圖與心律不整解析.html；exclude現況保留。

## 固定決策（精簡版；細節見各 docs）

- **1.9.0 固定決策（Claude已複驗、AP2部署待完成驗證）**：兩課程共用 1.9.0 主程式；新功能以課程 features 開關；網站差異只放在建置設定。

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
- 115-MI實測：學生前測86／後測100、單選／排序各1票、完整測驗100雲端保存、閃卡不增次數、選做不增必做；教師測驗控制／CSV／38頁簡報／互動再投／黑屏／全螢幕／備註通過。test驗收已收回，原正式前測prepared未公布、三班恢復、互動入口空；私有前後各7題來源就緒，原正式後測未建立。影片續播及種類切換修正已上線，仍待跨裝置、真實手機、46其餘影片及HTML全通關；報告STUDENT_ACCEPTANCE.md／TEACHER_ACCEPTANCE.md。
- 泌尿／體液底圖（10/14 22:15 Claude 審 37 張，docs/IMAGE_REVIEW_urinary-fluid_2026-10-14.md）：29 通過、3 小修（nephron-circulation-01、water-sodium-02／04）、urinary-route 01–05 重畫、酸鹼 3 張未畫。**urinary-route 01–04 與兩個 _rejected 檔是作圖助手誤存的私人照片，教師須手動刪除，不可 commit。** 助手已改為略過 jpg／heic 與超大圖。
- 泌尿／體液：教師10/13已裁定；74段可交ChatGPT（指令包），16資料層圖位待底圖回來後原生SVG；六卡待教師執行apply；無content，不進教材實作。
- 血流：v2 已由 Claude 驗收通過，待教師看畫面；核可後依固定決策 22 正式 build、Excel 末列新增 11 題、登錄、commit。
- 工作1B：Claude已核對報告引句，待教師裁定六題與資訊圖表修訂；教師原決定Q3／Q4先不上平台仍有效。
- 工作2：三項修正已提交ed08854，check140／26及Claude複驗通過；教師決定部署。
- 第四輪26張原子卡待Claude獨立驗；國考延伸兩份教材與補建卡另開單，這次不做。
- 1.7.0部署後教師實測：改一題錯字同步顯示保留／重置0題；閃卡不改最高分；完整測驗完成度、逾期與首頁定位。
- 題庫Excel既有227題已確認全在Sheet；本輪呼吸77題也已追加，教師驗收後再決定平台同步。後台依 docs/LIVE_INFOGRAPHICS_CLASSIFICATION.md 建活動；血液氣體運送／止血機制活動改連v2。
- feature/heart-structure-v2（9/25驗收）及feature/material-kit（待驗）未部署；部署前合併最新main。其他已完成階段細節查DEVELOPMENT_LOG。
- 快照INTERNAL：教師10/6決定本輪不修。下輪先查正式log；已本機重現forClass無條件research:undefined造成Firestore拒絕，需省略欄位＋真實序列化回歸測試，保留進度。
- 未排程：passedAt首次達標後端行為測試、題目作廢重算、diagnostics.summary索引排除、firebase-functions升級、App拆檔、真實學生端到端驗收。
- 研究前後測／等值遷移題及Google Sheet名冊、單元欄由教師提供。

- 學生端使用說明：教師10/13決定站內靜態頁＋登入頁／首頁連結＋首次提示卡3張、兩站共用、併入1.9.0上線；已寫入 unify 規格第8節（docs/STUDENT_GUIDE_PLAN.md 文末記決定）。
