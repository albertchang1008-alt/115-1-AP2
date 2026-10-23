## 2026-10-17 泌尿體液圖面收尾、驗證與交件文件 [Codex]

- 基底36fcbec；A補腎素6號顆粒錨點、靜脈側CO₂入肺、體液短說明。原文字實際在總覽與node-01，node-02核對正常。
- B十份preview／200標準shots、180圖面案例＋20初始頁全部通過，0 errors/pageerror；全庫節點21版／34來源通過，共用測試20 pass、0 fail、0 skipped。40組截圖集／400圖片載入正常。
- 16列前後對照，git show 649b98b取40張原截圖，F-7另補完整state-3頁證明explain刪頁碼；新腎素錨點crop、COMPLETE_REPORT及handoff同步。
- 176保護檔案及所有content.json不變；保留開工時既有dirty截圖與紀錄。本輪無腳本失敗或修復；無build／登錄／Excel或Sheet／push／merge／部署。
- 本輪commit訊息「泌尿體液圖面收尾、驗證與交件文件 [Codex]」。C為另一卡片專案，依序於此commit後執行並另報結果。

## 2026-10-17 Antigravity圖面修訂（36fcbec）[Antigravity，Codex補記]

- Antigravity提交36fcbec完成U-1～U-4與F-1～F-9：功能框、手機圖例間距、再吸收箭頭、刪無目標虛線、RAAS編號、集尿管端點、Na／K說明、氣管呼出、兩色比例條、刪課本頁碼、空白格裁切／淡化及引線重排。
- Claude於ANTIGRAVITY_HANDOFF_CLAUDE_ACCEPTANCE_2026-10-17.md大致通過，留腎素缺6號、CO₂入肺起點、體重底框用語三小修與交件文件待補。本次收尾已處理；舊D「失敗未提交」已移出現況交接，保留歷史。

## 2026-10-17 停止已執行的一次性排程重複觸發 [Codex]

- automation-2於台北01:01再次喚醒，核對目前handoff後未執行過期階段一交辦；原排程改PAUSED，其餘欄位保留。
- 僅補本交接紀錄，保留目前D圖面失敗停點及所有未提交工作；未改教材／來源卡、未開分支、未commit／push／部署。

## 2026-10-16 期末卡修正與泌尿續作：D失敗停止 [Codex]

U-1–U-4修圖與四份preview完成嘗試，腎臟18例通過；其他44例中5例手機圖例標題與首列文字重疊，驗證exit1。依教師「任何一步失敗就停下」保留dirty、未commit、不修後重跑，後續體液與共用測試未執行。STOP_REPORT記錄實際截圖及失敗，不以649b98b舊PASS代替。卡片專案A31修正、B26清理、C3PASS／12REVISE及auditPASS已完成，詳該專案05_review執行報告。未push、merge或部署。

## 2026-10-16 泌尿完整製作：階段四與十份畫面交件 [Codex]

- RAAS訊號步驟①–⑤，手機結構標籤A–G；修正圖層避讓後18案例通過。

- 四份體液24節點、44題、4預測完成；14張已pass原圖的標籤／箭頭與原生資料層，配色僅增四個210鍵。
- 十份共60節點、110題＋10預測；200最終截圖、180圖面案例、264引線crop通過。HTML十份並列，40切換／400次圖片載入及預覽連結、放大通過。
- 精確6→6／12／18粒子；編號避讓原分子與原生粒子，四個實際渲染案例0遮擋。酸鹼尿腔補原生符號。原PNG不改。
- 33卡及唯一進度列均reviewed；電解質與鈣磷兩卡仍needs_review=true，依交辦附條件使用，疑義公式與分泌細胞身分已排除，原旗標不改。繁體2963段0差異。
- 160保護檔案SHA通過；全庫節點21版／實際34來源及20共用測試（0 skipped）通過。既有工具訊息固定15，未改工具。
- 交件docs/urinary-release/COMPLETE_REPORT.md及screenshots.html；階段四本機commit後停Claude總驗收。無build／登錄／Excel／Sheet／push／merge／部署／卡片或進度寫入。

## 2026-10-16 泌尿完整製作：階段三 [Codex]

六個原生資料圖及PCT67%／75%比例條完成，14資料圖面、60標準shots通過；全庫節點與20共用測試（0 skipped）通過。資料源與截圖對照見data/SLOT_MAP.md，續做四份體液。

## 2026-10-16 泌尿完整製作：階段二 [Codex]

五份標籤及箭頭完成，76圖面案例、132 crops、100標準shots通過；六份來源卡與用詞通過。題目及來源不變，續做資料層。詳STAGE2_COMPLETE_REPORT.md。

## 2026-10-16 泌尿完整製作：階段一 [Codex]

A沿用、腎臟標籤及35錨點crops通過，尿路C補第六節與兩題、預覽v2。標準40 screenshots；全庫節點稽核及20共用教材測試通過，0 skipped。詳 docs/urinary-release/STAGE1_COMPLETE_REPORT.md。舊證據保留，繼續階段二。

## 2026-10-16 泌尿階段二續作：腳本修正後發現教材錨點錯位，停止 [Codex]

- A成果保留。開工確認urine-physical-properties frontmatter及todo_all.jsonl唯一列均reviewed，SHA記resume-checks且收工未變。
- 依新規則第一次修本輪驗證腳本：measure(svg)正確接SVG，補例外及完整案例條件，保留並增強檢查。重跑出1280初始頁／overview state1與3crop後遇crop範圍錯誤；原錯及修法留history／log，尚未用第二次修正。
- 人工檢視overview state1發現後腹腔(170,510)引線落在髂骨上緣，屬教材實際錨點錯位；按新規則立即停止，不修教材／不再重跑／不繼續C。
- C資格成立但未補內容，尿路仍與A快照相同；未完成B案例、完整截圖與crop、C與全庫稽核／共用測試／diffcheck，不commit。STAGE2_REPORT分A/B/C及handoff已更新，所有未提交成果保留；未build／登錄／Excel／Sheet／push／部署／同步，未動來源卡或todo。

## 2026-10-16 泌尿階段二 A 完成／B 驗證失敗依令停止 [Codex]

- feature/urinary-infographics@1a8d405指定worktree，兩交辦文件原樣複製docs/待提交。A完成中文reference／credits及filtration node03開頭修改；六份A-only JSON比對通過、sources保留。
- B產生kidney七張響應式原生SVG標籤、35預定引線與3功能說明，白名單比對通過、原PNG不變；單一FOCUS_STYLE控制紅粗體。只kidney改figure／導讀／caption／圖層credit，preview成功。
- 新視覺驗證腳本locator.evaluate錯把this當SVG，TypeError svg.getBoundingClientRect is not a function，exit1。依教師「任何一步失敗就停下回報」立即停止，未修後重跑、未做shots／共用測試／diffcheck／commit。證據finally原錯寫ok=true，收工按真實exit/log改false，不改實作。
- C仍draft，不補尿路節點或兩題。STAGE2_REPORT與stage2/預定錨點表及失敗證據、handoff已交接；工作留未提交，單次commit尚未使用。原根目錄／底圖／卡片不變，無build／登錄／Excel／Sheet／push／部署／同步。待教師續作指示。

## 2026-10-16 泌尿階段一 Claude R 修正與 D1 預覽 [Codex]

- 在指定feature/urinary-infographics／fc174f1 worktree依審稿處理R1–R5。64題及6預測重排：70／70保持正解文字及題目說明；R2／R3三題依指定改正解，另foundation02修編者語，前後證據分開記錄。尿路可見來源代碼改中文引用，sources不變；R4卡沒有中文Lacis名稱，依例外保留。
- D1只新增presentation.mjs hues六個泌尿鍵，全部176青綠色，不改其餘共用程式。五份preview及標準100張390／1280截圖通過，另10張視窗圖交件；110題渲染正解與10預測對應全過，無頁面錯誤。
- D2卡仍draft，node06與兩缺題維持原佔位；第六份preview與全庫節點稽核仍題數失敗，不放寬驗證。前五schema過、六nodeText無錯、用詞0命中，kit測試7／7通過0skip。
- STAGE1_CONTENT_REPORT新增「R 修正」，r-fixes含答案比對、驗證、截圖及保護證據，handoff覆寫過期現況。原根目錄、來源卡、catalog／manifest／Excel與validator不變；只preview、不build／登錄／寫Sheet／push／部署／同步。一次本機commit後停Claude複驗。

## 2026-10-16 泌尿教材階段一內容交件（preview受阻） [Codex]

- 01:00 automation-2單次執行；fetch origin/main=460ca11600b68108415d88e7468404d4271fa121，獨立managed worktree／feature/urinary-infographics，原根目錄與呼吸分支未改。
- 建立六份content：35教學節點＋1待核卡佔位、64四選一題＋6預測，逐卡reviewed與來源頁碼；26通過底圖原樣嵌入SVG、資料位空白，未做標籤或資料層，體液不做。
- 五份schema通過，最後一份按交辦略過先備06與情境05，只留5＋4題，不放寬驗證。五份preview因缺共用palette失敗，最後一份因題數失敗；六次validate-nodes都停同一題數限制，無新HTML或截圖。完整記錄並依停止條件交付，不自行改共用程式或卡。
- 六份nodeText無重複錯誤、用詞掃描0、64題與6預測來源正解全首項（作者規則）；runtime洗牌保留，新頁分布未驗。首次Node測試解析失敗後改專案tsx，kit相關測試7／7過0skip。
- 報告docs/urinary-release/STAGE1_CONTENT_REPORT.md與來源／圖位／SHA／驗證證據；原追蹤檔及來源卡SHA不變，catalog／manifest／Excel／共用kit與公開教材未改。未build／寫Excel或Sheet／push／部署／同步；一次feature本機commit，更新交接後停Claude審。

# 2026-10-15：平台MCP第3階段完成停點A，交Claude審查 [Codex]
目前版本：1.10.1

- 沿用feature/platform-mcp獨立worktree；fetch確認origin/main4ed3778無新提交，前輪f0c1e7e為基底。只本機commit，不push／部署／merge main或正式資料寫入。
- 新增listManagedCourses／getCourseDraft／getCompletionSummary純讀與patchCourseDraft；saveCourse／patch共用驗證，root revision0相容、交易比較與遞增、UUID requestId重送去重、auditLog同交易；稽核只存教師actor與schema／hash摘要，規則僅owner教師讀、client寫拒絕。
- 後台明確傳讀取revision並保留衝突時的本機編輯；其他草稿變更路徑遞增，複習考建立／刪除也帶版本與回傳新revision。revision為metadata，不存入draft。舊客戶端省略expectedRevision仍相容但無衝突保護，報告明列。
- 連接器7唯讀補齊，移除舊getCompletion個資傳輸；新增5個destructive兩步工具，教師預覽同意＋10分鐘一次性碼，綁payload／真實草稿／revision／同步來源狀態，失效或變動拒絕。寫入白名單只有patchCourseDraft／syncSheet，沒有發布工具。
- 同步保留既有全重算不讀舊bank保證；未知新增／更新／保留題數回null、reset已知值，不捏造數字。外部Sheet成功套用只測mock契約，留停點B由教師另授權測試課程，不對正式課程同步。
- 完整AP2 check前端162／Functions61，工具check16，全部0 skipped；demo-platform-mcp的Auth／Firestore／Functions Emulator16項真實HTTP流程通過，包含並行衝突與重送、後台保存helper拒絕、audit規則、7唯讀工具，個資掃描0，正式呼叫0。
- 版本升1.9.1，version:check納入工具package／lock；未變更依賴版本、Excel、教材、站別與其他worktree。報告docs/platform-mcp/STAGE3_REPORT.md、stage3證據，README安裝與停點規則更新。停止交Claude，桌面設定未修改、未部署MI。

# 2026-10-15：AP2 本機 MCP 第1–2階段，唯讀驗證完成並列明後端缺口 [Codex]
目前版本：1.9.0

- 從最新origin/main4ed3778開獨立feature/platform-mcp／.worktrees/platform-mcp；不動原呼吸工作目錄。完整盤點functions/src五檔57個callable；bootstrap／getReflections／getAssessments／assessmentReport均因實際寫入排除。
- 新增tools/platform-mcp：官方TypeScript SDK、stdio、固定AP2專案、三支硬白名單、工具投影／個資過濾／掃描；完成度沿用平台forClass與公式3在記憶體分頁，只輸出數字。依賴限工具自己的package與lock。
- 教師本人Google學校帳號登入；簽章與teacher驗證、refresh同身分；refresh token僅macOS鑰匙圈，security stdin不帶token argv。首次popup-closed-by-user後本人重試成功；未遇學校／App Check拒絕，未變更安全設定。
- 獨立check型別／14測試／build全過0 skipped；正式AP2七工具smoke：4 PASS、3依後端缺口固定unavailable；官方SDK真正stdio握手與get_published成功，8份JSON個資掃描0。完成度只讀test班2人，未開輪或作答。
- 3受限工具是list_courses／get_course_draft／diff_draft_published；目前無純讀列表／草稿入口，不能用會寫profile的bootstrap或Admin／REST繞過。list_materials只確認published使用，sync只回歷史staleUnits和錯誤旗標；這些限制明列供Claude裁定，未宣稱7工具全功能可用。
- docs/platform-mcp含CALLABLE_INVENTORY、STAGE2_REPORT、check／smoke紀錄、JSON與無帳號／token登入錯誤截圖。成功頁教師已關閉，以程式成功與live smoke佐證，不補造畫面。
- 對functions、前端／shared、根與functions package／lock、安全規則及部署設定比對基底零差異；未實作寫入、改學生資料／Excel、push／部署／同步。保存本機commit後交Claude驗收，桌面設定由教師自行加入。第3階段僅列patchCourseDraft／auditLog與補唯讀後端建議。

# 2026-10-15：呼吸七份整合完成，停點一待核對 [Codex]
目前版本：1.9.0

- 教師核可Pages-only計畫；以origin/main8e61f58建獨立codex/respiratory-release-2026-10-15，一般merge呼吸f541b29，解六衝突並保留main站別／MI登錄；只補oxygen-curve.js原檔d105171b…。
- AP2 check158／54、materials20、節點21／15、七份乾淨重建SHA、126狀態與五份10頁作答回歸全過。AP2 catalog／dist38，MI catalog／dist2與3CHP，沒有呼吸教材；MI build通過。
- 額外MI裁切副本全量check149過9敗；未整合main相同9敗、零新增，為AP2快照／SDK假設，完整記錄，未改測試或MI程式。
- functions／rules／indexes、src／版本／Firebase／站別／Actions與main零差異；main既有公開67檔與呼吸來源圖檔Excel均保持，七HTML SHA不變。目錄CLI用tsx載入相容，不改程式。
- 完整證據docs/respiratory-release/INTEGRATION_REPORT.md、integration-verification.json；正常本機merge commit後停下交Claude核對最終SHA與diff，不push／部署／同步，不操作正式學生或Sheet。

# 呼吸分支既有歷史（完整保留）

## 2026-10-15 Codex：呼吸發布唯讀預檢，表頭不符依交辦停止

## 2026-10-15 呼吸77題②提問鏈：階段二寫入 [Codex]

- Claude審稿通過，兩題依指定整句替換，其餘75題保留；77題定稿自動檢查全過，2問／51–76字，見chain-rewrite-draft-verification.json。
- Excel只改Q229:Q305的77格②；其他7325格值／型別／樣式不變、全部格樣式不變；9個其他ZIP成員與題庫XML非目標區逐位元不變。
- Sheet115-1-AP2完整480×32先備份CSV／原生與值JSON／原Excel到docs/sheet-backups/（忽略不提交），單一原子批次只改U404:U480的userEnteredValue。全表回讀其他15283格零差異、目標格式與驗證不變；77格最終Excel／Sheet／定稿一致，仍479題。
- 完整證據docs/respiratory-release/chain-rewrite-write-verification.json；REPORT.md已附加新節，來源與教材751檔雜湊不變，Excel與Google100%原生畫面核對通過。未build／push／部署／平台同步。
- feature/respiratory-infographics，本輪單一本機commit（父f71a45b，以git log -1為準），停下交Claude驗收。


## 2026-10-15 呼吸77題②提問鏈：階段一起草 [Codex]

- 依 CODEX_TASK_respiratory-chain-rewrite_2026-10-15.md 僅起草；唯讀讀取Excel第2–228列②與229–305列現有題目，對照七份content節點／解析／④，完成 docs/respiratory-release/chain-rewrite-draft.md。
- 每題一列，完整77題ID／題幹／正解／①／新②／依據；每題2問，以→連接，51–73字。77題問句結構、①與完整答案排除（含正規化）、完整題幹排除、台灣用詞、A2掃描、數值出處與節點ID均通過；檢查結果寫入草稿開頭。字串檢查不代替Claude語意審稿。
- Excel唯讀且SHA256不變，61份受保護content／教材／登錄／Excel檔案雜湊不變；未存取Google Sheet，未改既有發布報告或驗證證據。僅新增草稿、更新交接與日誌。
- feature/respiratory-infographics／HEAD f71a45b，本輪未commit／push／部署／同步；停下交Claude審稿，尚未執行階段二寫入。


## 2026-10-15 呼吸七份正式建置與題庫發布（本機 release）[Codex]

- 教師11:50欄位裁定取代預檢停點；七份build／登錄，沿用驗收圖層，content與其他教材不變。
- Excel229–305列增77題，共304題；說明增7列，既有5472格值／型別／樣式不變。
- Sheet全476×29含空白列先備份，忽略不提交；插入AC–AE三欄，227舊題只補新欄，175其他題不動；404–480增77題，402→479題。完整回讀值／公式與11687原生格零差異，77新ID純文字且無重複。首次結構批次審核拒絕未執行，改插入保留舊欄後成功。
- 七份126狀態含實際底圖檢查全過；通用verify支援呼吸道舊manifest。節點21／15、materials20、完整check134／26，零skip，兩端build通過。
- 詳docs/respiratory-release/REPORT.md；feature/respiratory-infographics，以單一本機release commit交件，停下交Claude。未push／部署／平台同步。

- 讀release交辦與handoff，確認feature/respiratory-infographics／e8805f8；教師已核可畫面並授權本機正式build／登錄／Excel77題／Sheet附加／一次commit，不push／部署／同步。
- 使用學校Google Drive連線，profile／目標metadata／A1:AC3表頭及C1:C476 ID唯讀成功。實際分頁115-1-AP2／gid1633868463，402題無重複；Excel現227題全在Sheet，包含先前待貼108–228列121題，Sheet另175題不動；呼吸77 ID尚未在兩邊，未冒稱已寫Excel。
- Sheet缺Excel10個同名欄位，含問題／③回頭選答案的別名差異及講義標題／講義連結／啟用／題型等缺欄。依交辦三.3「表頭對不上就停下，不自行新增欄位」，停止資料作業並請教師指定目標分頁或欄位對應／省略／補齊方式。
- 新增docs/respiratory-release/REPORT.md、sheet-preflight.json（含三份ID清單及77待新增ID），更新handoff；未build／登錄／Excel／Sheet寫入／CSV備份／commit，未push／部署／按平台同步，未保存金鑰token。待教師回覆後從完整比對與備份續作。[Codex]

## 2026-10-15 Codex：第三次修正 R3-1／R3-2，待 Claude 兩項複查
- 血紅素o2-co2-transport node-02原雙版面引用不存在plate-01；改每版獨立內嵌WebP image，不依賴另一層use／defs。手機／桌機實際非白約61%，各自移除另一層後仍顯示，原像素錨點不變。
- breathing-mechanics node-01／03僅放寬指定桌機容器與圖片，四格實測650.94 CSS px，三格609.65／650.94／650.94，皆≥600；側欄直標保留，手機layout記錄及截圖SHA不變。r2.py新增--r3限制只重產三圖位，完整入口亦保留修正。
- 新增respiratory-raster-verify.mjs：實際截圖裁切SVG視窗、256×256取樣非白>20%，另驗圖片decode／原圖尺寸／寬高比及資源不在隱藏層。舊版preview實測1280／390非白0.67%／0.59%、缺圖片資源，兩版皆明確失敗；舊失敗JSON保存。6個正反例含白圖、缺引用、隱藏層與兩版各自獨立顯示，全通過。
- 五份45狀態×兩尺寸90狀態全數重跑通過，72底圖視窗最低47.81%；幾何／拆詞／單字／單位／撞號／箭頭／比例／氧曲線互動亦過。節點21／15、materials20／20無skip；本輪不重跑R2已通過10頁完整作答，原證據保留。
- 只改三SVG、兩manifest的三記錄、兩preview與本輪證據；其他42圖位／84圖面截圖、所有原像素錨點、content、PNG／WebP、氧曲線JS、其他教材、共用CSS／教材JS、登錄不變。報告新增「第三次修正」附截圖，r3-scope-integrity.json及r3-old-version-rejection.json保存證據。
- feature/respiratory-infographics／HEAD e8805f8，未build／Excel／登錄／commit／push／部署；更新handoff後停下，交Claude僅複查R3-1／R3-2，尚未核可。[Codex]

## 2026-10-15 Codex：階段二再修，桌機／手機雙版面與 R2-1～R2-4 完成待再驗
- 依教師方案甲，五份教材24個有解剖標籤的狀態改為≥768px中文引線直標、<768px全寬圖＋編號對照；資料圖直接命名保留。新增scripts/respiratory-labels-r2.py，沿用repair／stage2基礎，保存兩版labels記錄。
- R2-1：氯轉移手機標籤A～G搭步驟①②③，多格圖整圖連續編號，verify新增同圖重複編號及版面顯示檢查。R2-2：三總覽中樞受器原像素(601,253)→(566,250)，落在延髓表面靠CSF側，H⁺箭頭終點同步移；其他原像素錨點逐項保持。R2-3：刪浮空T，迷走傳入以T端止於延髓，文字與非當前路線一起淡化0.3。
- 390／1280共90圖面狀態、767／768邊界90狀態全過，拆詞／單字行／數值單位／箭頭間距／撞號均0；fixture7／7。五份preview同步，48受影響圖面截圖重拍，21未受影響記錄／SVG／42張圖不變，另更新3氧曲線桌機互動截圖；原全頁shots不覆寫。
- R2-4：最終版本五份×兩尺寸10頁完整作答回歸全過，探索6節點、6先備＋5情境、答錯回讀／重試、最後complete僅一次；節點21／15、materials20／20無skip。圖表數值／比例與氧曲線互動仍過。
- 報告新增「階段二再修」逐項截圖，r2-breakpoint-verification.json與r2-scope-integrity.json保存邊界、SHA及錨點證據。content、incoming PNG／WebP、氧曲線JS、共用CSS／教材JS、其他教材與登錄未變。
- feature/respiratory-infographics／HEAD e8805f8，未build／Excel／登錄／commit／push／部署；更新handoff後停下，交Claude再驗及教師看畫面，尚未核可。[Codex]

## 2026-10-15 Codex：呼吸標籤 V2 階段二 S2-1～S2-14 複修，待 Claude 再驗
- 依Claude階段二未通過審查修正全部14項：低氧血管與轉向、呼吸調控路線／腦幹放大／T抑制、六處資料圖因果與曲線、醫學詞換行、配色及氣體符號間距；另修四格肌肉放大、外肋間肌錨點、正常虛線尾標、去重、固定容量區段與手機編號對照。
- 新增scripts/respiratory-labels-repair.py，限制40受影響狀態；保留5未受影響SVG／labels記錄／10張截圖。五份preview同步，80張圖面截圖重拍，另3張氧曲線桌機滑桿／探針完整截圖；既有全頁圖不覆寫。
- verify新增文字與箭身／marker頭部至少4 CSS px、醫學詞／數值單位拆行與單字成行檢查；90狀態通過、5個正反例fixture全過；FEV₁精確一秒點／終點、單調與凹性／容量位置／比例及氧曲線互動通過。節點21／15、materials20／20無skip；未重跑先前10頁完整作答回歸。
- 報告新增「階段二複修」逐項截圖；SHA證據stage2-repair-scope-integrity.json：1021開工檔中883不變、138限定圖層／manifest／preview／圖面證據與圖庫異動，無非預期／遺失。content、定稿PNG、WebP、氧曲線JS、共用CSS／教材JS、其他教材不變。
- feature/respiratory-infographics／HEAD e8805f8，未build／Excel／登錄／commit／push／部署；更新handoff後停下交Claude再驗，尚未核可。[Codex]

## 2026-10-15 Codex：呼吸標籤 V2 階段二五份完成，停下待驗收
- 教師定案 A 紅色粗體後，依序完成 gas-exchange、respiratory-control、breathing-mechanics、o2-co2-transport、lung-function，每份先標籤、再資料層、preview／shots／verify、報告後換下一份；共20資料圖位、三狀態＋六節點各兩尺寸90圖面與100全頁截圖。
- 沿用 respiratory-labels.py 入口、FOCUS_STYLE=red 與 labels.json／verify，stage2 模組使用20張incoming定稿PNG（PNG不改）、原生SVG標籤／引線／圓點、HTML原文圖說及嚴格避頭點。力學三狀態補白同畫布、獨立錨點；四格肌肉按實際分界裁切、三欄順應性上下排；共用SVG圖像資源使HTML2.57MB→0.92MB。95無引線、分壓各格獨立、化學受器避竇、牽張受器指細支氣管。
- 精確資料圖：V/Q同尺度；97／3、70／23／7；肺泡通氣0空條、4200／5100；四容積與四容量；一秒FEV₁ 4／1／2.5與終點5／2.8／2.8。氧曲線保留480寬及k26／31／21、slider／pointer／probe，oxygen-curve.js原檔SHA不變；兩尺寸三狀態0／40／100與pointer70通過。氯轉移①②③對應原句分段，圖說來源逐字重組驗證通過。
- 圖面驗證90狀態通過：手機最小12.89px、裁切／重疊／引線／錨點／紅字／等比例／溢位／console／pageerror／避頭點無錯；資料比例與曲線座標實測通過。節點21學生教材／15sources、materials20／20（0skip）、10頁六節點／11題／答錯回讀／最後complete只一次回歸全過。Chrome測試使用已存在的依賴符號連結與sandbox escalation，未install或改package／lock。
- 報告 docs/RESPIRATORY_LABELS_V2_REPORT.md（每份完成即更新）；驗收入口 docs/respiratory-screenshots/v2/stage2-index.html。SHA證據stage2-scope-integrity.json：344保護檔不變（含content／氧widget／PNG／其他教材／Excel／登錄），41既有檔案僅授權圖層／preview／限定CSS異動；先前未提交工作保留。
- feature/respiratory-infographics／HEAD e8805f8；未build／Excel／登錄／commit／push／部署。階段二尚未經Claude／教師驗收，停下等待錨點、解剖、資料層比例複驗。[Codex]

## 2026-10-14 Codex：階段一 R-1～R-8 複修與 A／B 比較完成
- lungs-pleura：張力／T指內襯；state-1不顯示表面張力素，state-2／3指連續／斷續薄層；公式無引線圖下caption，r指半徑線中段，小肺泡指壁、P移至偏心腔內；淋巴管指綠色構造。圖下說明從既有content讀取，僅換行、未改肺／胸膜content，labels.json同步。
- airway R-6：細支氣管錨點SVG618,798（底圖338,798），直接引線、不沿肺緣。gas-exchange R-7：只改node-03 summary單一詞組，還原後JSON與開工版本一致。
- 三份preview／shots各20圖、兩支verify各18狀態全過；21教材／15 sources稽核、materials20／20測試通過0skip。手機最小airway13.28、lungs12.89px；HTML1,124,832／1,214,268 bytes。暫存測試preload停用平滑捲動穩定截圖，未改教材JS／verify原始碼。
- FOCUS_STYLE=block產node-01與overview-state-1兩尺寸4圖，B黑字／橙塊／粗體／字級驗證通過；並排頁docs/respiratory-screenshots/v2/lungs-pleura/style-B/index.html。設定與產物恢復red，SVG／labels.json／preview SHA與已驗A版一致。
- 報告與airway報告更新；新scope證據review-fixes-scope-integrity.json保留其他呼吸教材／底圖、Excel及登錄SHA。同期外部作圖日誌／審圖／泌尿05三檔變動另列、未覆蓋。
- feature/respiratory-infographics／e8805f8，未build／Excel／登錄／commit／push／部署；停在階段一，待Claude複驗及教師選A／B，未開始階段二。[Codex]

## 2026-10-14 Codex：呼吸標籤 V2 階段一完成，停下待驗收
- 任務0：airway A-01～A-06錨點／圖說／標籤順序小修，verify支援折線逐段；預測選項改會厭／聲帶／軟腭／甲狀軟骨，gas-exchange node-03 concept／points兩處用詞改經肺動脈入肺的缺氧血；還原授權修改後content SHA與開工一致。
- 任務1：lungs-pleura 8張定稿PNG轉1200寬WebP quality70（82時HTML過1.5MB），總覽三狀態＋6節點中文SVG／引線／張力箭頭／半徑線；node-04裁切既有放大框。原始像素anchors及文字位置保存在labels.json；FOCUS_STYLE單一設定可換紅字／黑字橙塊，當前紅色粗體。
- 三份preview／shots全過；airway／lungs各18狀態verify全過，節點稽核21份教材／15 sources、materials20／20通過0skip。手機字級13.28／12.89px；HTML1,124,868／1,214,309 bytes。報告docs/RESPIRATORY_LABELS_V2_REPORT.md，兩尺寸截圖docs/respiratory-screenshots/v2/lungs-pleura/；airway報告追加10/13修正節。
- SHA：其他呼吸教材、Excel、shared/materials.ts、8張incoming PNG不變；工作期間另觀察作圖日誌／_review及泌尿底圖9個既有檔案外部變動，列scope-integrity.json並保留，未由本任務寫入。
- feature/respiratory-infographics／e8805f8，未commit／push／部署；未materials:build、Excel、登錄或登入。停在階段一，待Claude錨點／解剖與content複驗、教師看畫面決定A／B；沒有開始階段二。[Codex]

## 2026-10-14 22:15 Claude：泌尿／體液底圖審查、助手略過照片
- 審 37 張：29 通過、3 小修、5 重畫（urinary-route 01–04 為誤存私人照片，05 畫成總覽）；結論與修圖 prompt 寫入 _review.json；紀錄 docs/IMAGE_REVIEW_urinary-fluid_2026-10-14.md。
- scripts/chatgpt_assist.py：略過 .jpg/.jpeg/.heic 與長邊 >3000 px 的下載檔（以假下載測試通過）。私人照片 6 檔待教師手動刪除，勿 commit。

## 2026-10-14 22:10 Claude：呼吸標籤層交辦
- 新增 CODEX_TASK_respiratory-labels_2026-10-14.md：28 張底圖對應 34 圖位、20 資料層圖位（原生 SVG／HTML，氧曲線保留 oxygen-curve.js）、標籤／箭頭規則、labels.json 錨點檔、驗證項目；階段一含尚未執行的 post-review 小修與 lungs-pleura 試做。

## 2026-10-14 22:05 Claude：呼吸28張底圖定稿
- rc-01 修好通過；bm-03 新版定稿；bm-05 被 rc-01 下載檔誤蓋，已復原。_review.json 28 張全部 pass。

## 2026-10-14 Claude：作圖助手接上審圖結果、呼吸修圖複看
- scripts/chatgpt_assist.py 讀 materials-src/figures/raster/_review.json：清單標通過／待審／要重畫／要小修；點要修項目移舊圖並改放修圖prompt；審查後重存即回待審；點已存好的圖先確認；/review 顯示結論。說明見 docs/CHATGPT_ASSIST_USAGE.md。
- 21:23／21:46 複看：bm-01／02（新）、bm-05、o2-02 通過；bm-03 待教師決定（Claude 先前 prompt 要求「比 01 小」有誤）；rc-01 待小修。rc-02、bm-05 曾被移到 _rejected，已放回。
- 注意：同一暫存檔名第二次寫回裝置時送出的是舊版，17:00 與 21:21 的交接、審查檔、_review.json 更新曾遺失，21:47 以新檔名重寫。

## 2026-10-14 Claude：呼吸其餘20張底圖審查
- 對照唯一底圖指令包、風格指南與content審breathing-mechanics 5、lung-function 1、gas-exchange 7、o2-co2-transport 2、respiratory-control 5。15通過；5待處理：bm-02／03重畫（構圖與01不同，灰階差異30–36；gas-exchange三狀態僅9–11）、o2-02重畫（交換蛋白畫成兩個、Hb帶O₂、尺度）、bm-05移除箭頭、rc-01補主動脈體。紀錄與修圖prompt：docs/IMAGE_REVIEW_respiratory_2026-10-14.md。未改圖檔、content或程式。

## 2026-10-14 Claude：主畫面說明複驗
- MI release@1ba1743 相對線上 b64217d 只改 guide 三檔；說明內容與交辦逐字相同。乾淨匯出重跑 MI 150／54、AP2 unify@8e61f58 158／54 全過、0 skipped；390px 字級16px、無水平捲動。通過，可發布兩站前端；教師真機實測後再通知學生。

## 2026-10-14 Codex：MI主畫面說明本機合併完成，交Claude複驗
- A教師端項目由教師親自驗證：test報表／CSV、互動題目／倒數／加時／送出／結束／統計正常，正式班未操作。Codex既有雜湊證據一致，不將教師親驗列自動化通過。
- release/mi-1.9.0本機merge 1ba1743（efeb1e7＋8e61f58）；雙方紀錄完整存archive並合入開發log。合併後MI check150＋54全過0fail／skipped，guide1280／390、11節、16px、無溢位／錯誤、列印／資源200通過。正式mi/main仍b64217d，不push／部署。
- 報告與Claude交辦在release worktree docs/GUIDE_HOMESCREEN_MI_MERGE_2026-10-14_REPORT.md及CLAUDE_REVIEW_GUIDE_HOMESCREEN_MI_2026-10-14.md；其工作區乾淨。本輪只同步root／unify交接文件，不提交其他教材改動。

## 本輪移出root handoff的先前停止紀錄（完整保留）
- **學生說明主畫面（10/14 Codex）**：共用e2dd36c已完成，AP2 check158／54、MI乾淨匯出150／54及兩站guide1280／390通過。教師續作後用提升權限merge-tree預檢exit1：handoff.md／DEVELOPMENT_LOG.md內容衝突（非權限錯誤）；依指示停止，未實際merge或跑合併後MI check。unify HEAD8e61f58／MI release b64217d不變；本輪只有交接更新未提交，待續作指示。不push／部署。
- **MI1.9.0授權上線（10/14 Codex，migration成功、Functions部分失敗停止）**：教師結束後測後09:03:07重新step0確認open測驗／active session／open互動全0，四份唯讀本機備份完成并Git排除、dry-run一致；原腳本apply成功，三處features一致、12互動＋轉換與JSON一致無snapshot欄位。Functions明確mi-bd885部署，predeploy通過，59操作成功（5create／54update），deleteCourse更新失敗／CLI exit2；依指示停在step2，不重apply、不回退。規則索引／Pages／上線驗證未開始，未改mi/main或變數，MI1.9.0尚未上線完成；deleteCourse最終revision待核對。報告docs/DEPLOY_MI_1.9.0_REPORT.md，續作前重新檢查無活動，再處理Functions失敗項。Excel、正式學生作答成績未改，私有備份不提交。本輪交接只本機commit。

## 2026-10-14 13:09 Codex：MI續上線，停在雜湊驗證
- 13:04:08重新查MI open測驗／active session／open互動均0；未沿用09:03。
- deleteCourse唯讀查ACTIVE／deletecourse-00004-zac／updateTime 2026-10-13T11:48:34.464920870Z；單獨重試一次成功，新ACTIVE／deletecourse-00005-xis／updateTime 2026-10-14T05:06:06.501867296Z，未重試整批。
- 規則索引部署成功，無刪索引提示；一般push mi/main到b64217d。Actions38514907129 build/deploy全綠；assessmentSessions索引READY；05:07UTC新排程HTTP200、查得日誌無缺索引錯誤。
- **步驟4失敗停止**：線上JS index-Dbnb149l.js，本機MI build index-C4gGzaUt.js；比對腳本找不到線上同名本機檔ENOENT／exit1，SHA未比對，原因未核對。不重建、不重新部署、不回退。
- test班互動／前後測／影片與guide驗證、N551／N552唯讀確認尚未完成；只登入既有test帳號，未新建輪次或作答。
- 未重跑migration apply、未改Excel／學生資料／GitHub variables；主畫面guide尚未合併。報告docs/DEPLOY_MI_1.9.0_REPORT.md與unify-1.9.0/mi-resume-*證據；後續需教師指示。

## 2026-10-14 Codex：手機主畫面說明續作，合併預檢衝突停止
- 教師重新交辦後完整讀取handoff與CODEX_TASK_GUIDE_HOMESCREEN_2026-10-14.md；既有e2dd36c實作與兩站check／guide證據保留，沒有重改程式。
- 以提升權限執行git merge-tree --write-tree --name-only release/mi-1.9.0 feature/1.9.0-unify，exit1；衝突僅DEVELOPMENT_LOG.md與handoff.md，暫存合併樹2ee5cecd9538b9bd3d8047749b46d95834fd5987。此為內容衝突，不是權限拒絕。
- 依「任何一步失敗就停下」停止；未執行git merge、未跑合併後MI check，未push／部署，未改登入／Excel／學生資料。共用HEAD8e61f58，MI release HEADb64217d，均未移動。待教師續作指示後整合兩份交接文件，再合併、MI check、交Claude複驗。

# 2026-10-14：學生說明主畫面停止點 [Codex]

- 共用guide主畫面說明已提交e2dd36c；AP2 check158／54、MI乾淨匯出check150／54及兩站guide1280／390通過、0 skipped。合併前git merge-tree預檢以預設sandbox執行，因Git中繼資料暫存檔權限失敗（exit128）；依教師指示停止，未實際merge、未跑合併後MI check。應使用已授權提升權限，待教師續作指示後合併；不push／部署。

## 2026-10-14 Claude：MI 1.9.0 release 複驗
- release/mi-1.9.0@510b6ad 乾淨匯出重跑 MI check 150／54、unify@178f862 AP2 158／54 全過；程式碼與共用分支一致、含 d48aac8、無 xlsx 變動、MI 不含 AP2 公開檔。通過，交辦 MI 上線（CODEX_TASK_DEPLOY_MI_1.9.0_2026-10-14.md）。

## 1.9.0 MI migration成功、Functions部分失敗停止（2026-10-14，Codex）
- 教師結束後測後重新step0：09:03:07 open測驗／active session／open互動全0，四份唯讀本機備份完成、Git排除，dry-run逐位元一致。
- 原腳本apply成功；三處features一致、12題＋簡報轉換與JSON一致、無snapshot欄位，未改學生作答／成績。
- Functions明確mi-bd885／non-interactive，predeploy51入口通過；59操作成功（5create／54update），deleteCourse更新失敗，CLI exit2。
- 依任何一步失敗停下：規則索引／Pages未執行，不重apply、不回退、不改變數。狀態及完整stdout docs/unify-1.9.0/mi-deployment-status.json／mi-functions-deploy-failure.txt。
- 私有備份不提交；報告docs/DEPLOY_MI_1.9.0_REPORT.md。教師續作前重新確認無活動，再處理Functions失敗項。

## 1.9.0 MI授權上線，正式後測open而停止（2026-10-14，Codex）
- Claude複驗510b6ad通過、教師授權上線；開工唯讀檢查08:29:50發現後測open，班級N551／N552／test；active session0／open互動0。
- 依交辦停在步驟0，不關閉場次。備份、dry-run、migration、Firebase與Pages均未開始；備份路徑只加入本機Git排除。
- 只讀場次／輪次metadata，未讀寫學生作答成績、未改Excel或GitHub變數。報告docs/DEPLOY_MI_1.9.0_REPORT.md。
- 教師結束後測後重新檢查，再依備份→dry-run→apply→Functions→規則索引→Pages；任何失敗停下，不自行回退。

## 2026-10-13 Claude：1.9.0 部署交辦
- 教師裁定 AP2 不加微生物22題並授權部署。發現 mi/main 含 d48aac8 且非 3a49056 祖先，MI 需先合併；交辦 CODEX_TASK_DEPLOY_1.9.0_2026-10-13.md（AP2 直接部署、MI 準備後交 Claude 複驗）。

## 1.9.0 MI本機準備完成（2026-10-14，Codex；待Claude複驗）
- 移出29個未追蹤AP2公开教材、不提交；指定4檔回原暫存。分站測試AP2維持五份斷言／MI兩份一致且AP2公開檔不存在，無skip；回補unify178f862。
- MI纯暫存checkout-index匯出乾淨安裝check150／54、0 fail／skipped，dist2教材＋3CHP；共用AP2 check158／54通過，不重新部署AP2。
- 24衝突已解決、d48aac8保留；workflow fallback mi，.firebaserc不改，MI指令必--project mi-bd885。變數未設唯讀列待辦。
- 離線dry-run重跑成功；引用Claude.xlsx無變動稽核，不修工具。報告docs/MI_1.9.0_RELEASE_PREPARATION.md。
- 本機merge510b6ad（70354e0＋7a6720e），MI工作目錄乾淨，交Claude複驗；不push mi／apply／部署MI／讀寫正式學生資料／改Excel。

## 1.9.0 MI check通過、補充稽核工具失敗停止（2026-10-14，Codex）
- 24衝突無標記、授權Git metadata暫存成功；workflow fallback mi，.firebaserc依教師指示不改；MI變數未設唯讀列待辦。
- 保留d48aac8全部新增行與2份原fixture；補42快照／還原3完整共用測試，不skip。MI dist僅2教材＋3 CHP。
- 完整MI check158／Functions54、0 fail／skipped、版本／build／51入口通過；離線dry-run mi-bd885成功12題＋簡報轉換。
- 補充Excel逐位元稽核未處理Git中文路徑轉義、FileNotFoundError，依任一步失敗停下。尚未最終暫存／合併commit；不是測試失敗，無需追加Git授權。
- 報告docs/MI_1.9.0_RELEASE_PREPARATION.md；未push／apply／部署MI／改Excel或正式學生資料。

## 1.9.0 CI修正與AP2成功發布、MI暫存失敗（2026-10-13，Codex）
- 7a6720e僅tests修正：MI70354e0兩份原檔.txt＋README SHA-256，讀fixture比對與雜湊檢查、無skip。
- 無70354e0乾淨shallow clone與unify兩站完整check158／54、0 fail／skipped；deploy.sh同結果。
- AP2 Actions38424586178 build/deploy全綠、Pages1.9.0成功；JS SHA與同設定本機build一致；索引READY、排程15:36–15:43 UTC連續200。
- test班三新開關均關閉、guide可開、既有10題作答保存成功；影片20→38秒重整續播。AP2既有reflection0，反思僅本機React/callable回歸，不新增正式活动。
- MI release/mi-1.9.0自70354e0（含d48aac8）開worktree，合併unify產24衝突；內容寫入後git add因default sandbox index.lock不可寫失敗，依指示停止。MERGE_HEAD／24unmerged保留，尚未check／dry-run／commit，不可部署。
- 報告docs/DEPLOY_1.9.0_REPORT.md；未push mi／apply／部署MI／改Excel或正式學生資料。

## 1.9.0 規則／索引成功，Actions失敗停止（2026-10-13，Codex）
- 教師明確授權AP2規則／索引，CLI限定ap2-7ed91、non-interactive部署成功；未加force、無刪除提示、未刪索引。
- 查40d3ec4的Actions38422029549：build的check前端155／157通過、2 fail、0 skipped；兩項site.test依賴MI70354e0，本機有該歷史但CI depth1沒有。Pages deploy跳過。
- 依任何一步失敗停下，沒有修測試／重跑Actions／回退。READY與排程log、線上雜湊／測試班驗證尚未完成，B段未開始。
- 更新docs/DEPLOY_1.9.0_REPORT.md與Actions失敗摘要；未改Excel／學生資料／push mi／apply／部署MI。

## 1.9.0 AP2 部署中止（2026-10-13，Codex）
- 教師授權部署，AP2不加MI22題、Excel不動；Claude複驗記錄提交40d3ec4，fetch兩遠端及origin祖先檢查通過。
- AP2變數未設VITE_SITE_ID，workflow預設ap2；deploy.sh完整check157／54、0 fail／skipped通過，ap2-7ed91 Functions成功，普通push備份分支與origin/main至40d3ec4。
- Firestore規則／索引部署被自動審查拒絕（獨立安全邊界變更授權／影響未核實），指令未執行；依任一步失敗停下，未繞過／回退。Actions、線上雜湊、測試班開關／guide驗證未完成。
- B段未開始；實際mi/main=70354e0，與交辦d48aac8不同，後續需核對。未push mi／apply／部署MI／修改Excel或學生資料。
- 停止點与待辦見docs/DEPLOY_1.9.0_REPORT.md；root教材工作保留。

## 2026-10-13 Claude：1.9.0 修正複驗（3a49056）
- M-1 migration 變數遮蔽已修並有 mock apply 測試（還原修正時測試失敗，證明有效）；m-1／m-2／m-4 完成；AP2／MI check 前端157、Functions54 全過。結論可交教師授權部署；m-3 待教師。

## 2026-10-13 Claude：肺與胸膜新畫風8張審圖
- 教師以新畫風重畫7張（01–03、05–08），連同04共8張全部通過；無字、無箭頭、無引線，肺循環配色、胸膜層次、肺泡三細胞、呼吸膜五層均正確。lungs-pleura 底圖定稿，可開始其餘60張。

## 2026-10-13 Claude：1.9.0 共用整合獨立驗收
- 對象 feature/1.9.0-unify@78cb5dc；隔離環境重跑 AP2／MI check（前端156、Functions54、0 skipped）、guide 驗證、dist 分離（AP2 31 教材／MI 2＋3 CHP）。
- 結論有條件通過；必修 M-1：MI migration `--apply` 變數遮蔽寫錯資料，需改名並補 mock 測試。小項：前後測來源單邊空白無提示、features 保存草稿即生效、AP2 micro 22 題待教師確認、說明截圖標籤壓字。
- 報告與 Codex 交辦在 .worktrees/unify-1.9.0；未 commit／push／部署／執行 migration。

## 2026-10-13 Claude：教材圖風格定案
- 教師定案底圖為手繪解剖圖譜畫風、箭頭標籤由程式依Nature式文法疊加。新增 docs/FIGURE_STYLE_GUIDE.md；唯一底圖版開場指令加入畫風、單一尺度與「不畫箭頭」，68段prompt末尾加提醒；肺與胸膜#04以教師試畫新版取代，其餘7張舊版移至_rejected待重畫。發布風格樣張Artifact（A紅字／B黑字色塊）待選。

## 2026-10-13 Claude：肺與胸膜試畫審查

## 1.9.0 共用整合本機交件（2026-10-13，Codex；正式環境未部署）

- 指定隔離 worktree `.worktrees/unify-1.9.0`／feature/1.9.0-unify 已完成並 commit 78cb5dc；反思必修與 MI 功能通用化、分站建置、學生使用說明一併完成。AP2／MI 各 check 前端156、Functions54全過、0 skipped；只有 migration 離線 dry-run，未 apply／push／部署。
- 完整變更歷史、現況、截圖與部署草稿見該 worktree 的 DEVELOPMENT_LOG.md／handoff.md／docs/UNIFY_1.9.0_REPORT.md；根工作目錄版本與既有教材任務保留，Claude 接手請到指定 worktree 驗收。

- 教師以作圖助手完成8張；Claude審圖：3通過、5重畫（01–03箭頭方向與細支氣管軟骨環、05肺動脈靜脈配色、07引線與分泌箭頭）。報告 docs/IMAGE_REVIEW_lungs-pleura_2026-10-13.md；唯一底圖版開場指令補不畫箭頭引線與肺循環配色。

## 2026-10-13 Claude：ChatGPT半自動作圖助手
- 新增 scripts/chatgpt_assist.py（Python標準庫＋Pillow，本機網頁介面）與 docs/CHATGPT_ASSIST_USAGE.md。教師因帳號條款風險選半自動：教師自行操作ChatGPT，助手放剪貼簿、監看下載資料夾、轉PNG改名、重畫／略過／續跑、審圖總覽。Claude以假下載檔測試存檔、重畫、紀錄與1280／390畫面通過。後續：埠號被占用時自動改用下一個或開啟已執行的助手；預設讀docs/最新符合格式的指令包、網頁下拉切換指令包／次單元、編號支援3位數；新增 docs/CHATGPT_PROMPT_PACK_FORMAT.md。未commit。

## 2026-10-13 Codex：反覆Cloudflare驗證，停止製圖等待
- 教師回報人類驗證一直出現；停止本次generate等待並保留進度，不代按／繞過驗證、不反覆啟動。尚未送prompt；先前Chrome啟動／聊天框只讀測試成功不能視為實際批次流程可用。
- 說明Playwright方案目前網站驗證未通過，提議一般Chrome擴充功能直接在本人正常登入分頁操作，仍不保證免驗證；待教師選擇後才改架構。未新增擴充功能／產圖／commit／push／部署；feature/respiratory-infographics／e8805f8。

## 2026-10-13 Codex：Cloudflare驗證狀態說明
- 教師截圖為ChatGPT Cloudflare「驗證您是人類」。只讀控制台確認mode=generate／busy=true，日誌仍等待聊天框，尚未送出prompt；說明由本人勾選驗證，製圖階段保持視窗開啟，聊天框就緒後腳本續行，逾時才重新開始。
- 不操作／繞過驗證、不重啟瀏覽器或修改流程；僅更新交接，feature/respiratory-infographics／e8805f8，未commit／push／部署。

## 2026-10-13 Codex：Chrome既有工作階段／設定檔佔用修正
- 教師回報launch_persistent_context TargetClosed與「正於現有瀏覽器工作階段中開啟」。核對SingletonLock與ps，確認PID67361是工具開啟的普通登入Chrome，仍持有獨立profile，新的自動化Chrome只轉交開頁後退出。
- 登入完成按鈕改為正常關閉工具自行啟動的登入Chrome（SIGTERM，15秒逾時需本人退出，不強制kill）；生成與登入前共用profile佔用檢查，保守提示PID。僅同主機且確認PID不存在才讓Chrome自行回收殘留鎖，不手動刪鎖檔。生成移除mock-keychain／password-store=basic，與普通Chrome登入保持相同系統keychain設定；網頁按鈕／說明更新。
- 已比對完整程序命令後，正常關閉67361；以既有profile做一次真實Chrome只讀啟動測試，persistent context成功且ChatGPT聊天框存在，完成即關閉，未送prompt／產圖。14項核心＋本機HTTP＋Chromium fixture通過，新增占用前置攔截／死亡PID鎖保留／完成登入正常退出測試。
- 保留提示詞／生成進度，不讀取帳密、不commit／push／部署；feature/respiratory-infographics／e8805f8。下一步教師刷新控制台後單張續跑。

## 2026-10-13 Codex：Google登入拒絕修正
- 教師截圖顯示Google「目前無法登入帳戶／瀏覽器或應用程式可能有安全疑慮」。核對Google官方說明，自動化控制瀏覽器可能被拒絕登入，不是ChatGPT圖片配額訊息。
- 將CLI --login-only／網頁登入改為一般Chrome／Chromium直接啟動、同一工具獨立profile，不使用Playwright控制、remote debugging或帳密自動填入；本人登入後先退出Chrome（macOS⌘Q），再按完成。確認程序已退出才允許交接；設定檔佔用不強制解除，不強制關閉本人一般Chrome。生成期間遇到Google登入網址會停止並提示使用新流程。
- 更新網頁按鈕／操作說明；新增正常瀏覽器參數、待退出、SingletonLock攔截測試。12項本機核心／HTTP／Chromium fixture全過，未實際驗證教師Google登入成功，不保證網站登入許可。
- 已從本機控制台重新啟動一般Chrome登入工作供本人操作；保留原MD與生成進度，未讀取帳密／產圖／commit／push／部署。feature/respiratory-infographics／e8805f8，handoff更新登入步驟。

## 2026-10-13 Codex：ChatGPT製圖本機網頁控制台
- 教師提供Downloads提示詞MD，核對68圖／16slug，與repo包SHA256一致。新增chatgpt_illustrator_web.py及tools/illustrator-web/HTML／CSS／JS；Python標準庫localhost服務，網頁載入MD、選單元／張數／瀏覽器／ChatGPT網址、登入完成、dry-run清單、開始／續跑／停止、即時日誌、圖庫預覽／下載。
- MD只作資料解析不執行，4MB上限，按內容雜湊保存獨立進度／共用登入profile，固定輸出incoming；操作採結構化subprocess argv，單工作限制、同源token／Host檢查、圖片ID白名單與路徑保護。關閉頁面不中斷工作，關閉服務才停止；更新操作說明。
- 新增tests/test_chatgpt_illustrator_web.py；專案.venv-illustrator安裝Playwright1.60.0／Pillow11.3.0成功。10項命令列＋HTTP＋Chromium測試通過；子程序pipe釋放修正後網頁4項重跑通過；1280／390畫面檢視、0pageerror／手機0溢位。所有生成控制測試只用dry-run／fixture，未登入ChatGPT或產圖。
- 已啟動127.0.0.1:8765載入教師Downloads檔，Codex瀏覽器開啟已queued；待本人登入與單張正式網站實測。不部署雲端、不改教材／Excel／登錄、不commit／push；feature/respiratory-infographics／e8805f8。handoff更新現況與重新啟動方式。

## 2026-10-13 Codex：ChatGPT本機批次製圖輔助腳本
- 新增 chatgpt_auto_illustrator.py、requirements-chatgpt-illustrator.txt、docs/CHATGPT_AUTO_ILLUSTRATOR.md、tests/test_chatgpt_auto_illustrator.py；.gitignore 排除登入profile／進度／截圖、venv與Python快取。
- 解析68張唯一底圖與修改自依賴，提供Persistent Context／獨立設定檔、slug分對話與網址記錄、單張送出與新assistant圖片穩定檢查、下載按鈕／來源fallback、Pillow真PNG轉檔／驗證／原子存檔、既有跳過、續跑不重送、下載重試、用量限制停止、10–15秒冷卻、執行鎖及控制參數。
- 官方Playwright已核對Chrome日常預設設定檔不受支援；改以獨立profile首次本人登入後沿用，不能保證免Cloudflare。未使用API／教師ChatGPT帳號或產圖；正式網頁selector與專案頁待首次--limit 1實測。
- 驗證：5核心測試（68／8張解析、引用、錯誤prompt、PNG、鎖、續跑不重送）＋1本機Chromium fixture（新圖判定／限制／逾時）通過；Python編譯與dry-run通過。pip安裝受沙箱網路限制，核心用bundled Python/Pillow、fixture用既有Playwright；瀏覽器fixture沙箱MachPort拒絕後，以經自動審核允許的沙箱外本機測試通過，不接觸正式網頁。
- feature/respiratory-infographics／HEAD e8805f8；未commit／push／部署，不改既有教材／Excel／登錄；handoff更新下一步登入與肺胸膜單張試跑。

## 2026-10-13 Claude：ChatGPT唯一底圖版指令包
- 新增 docs/CHATGPT_PROMPT_PACK_UNIQUE_2026-10-13.md：108段合併為68張唯一底圖（總覽狀態共用、節點共用底圖），每張列出使用圖位，程式檢查108圖位全數涵蓋。僅文件，未改其他檔。

## 2026-10-13 Claude：教師裁定落實、ChatGPT指令包、Codex交辦、學生說明規畫
- 教師16:45裁定審查建議全採、用詞併呈、兩處content授權修改。Claude改規格：泌尿U1三處去重（route node-01改輸尿管蠕動與生理瓣膜、tubular總覽state-1改Na⁺與水、fluid node-05改血漿vs組織間液蛋白質）、fluid node-06刪50kg自編例、PCT／RBF／過濾壓數值、併呈用詞；RESPIRATORY_INFOGRAPHICS_SPEC.md與gas-exchange規格「入肺靜脈血」改字；四份報告補裁定節；兩份CLAUDE_EDITS diff重產。
- 新增 docs/CHATGPT_PROMPT_PACK_2026-10-13.md（108段）、CODEX_TASK_post-review_2026-10-13.md、docs/STUDENT_GUIDE_PLAN.md；外部專案新增六卡核可勾選清單（未執行狀態變更）。
- 未改content／程式／Excel／登錄／卡片狀態，未commit／push／部署。feature/respiratory-infographics／e8805f8。

## 2026-10-13 Claude：呼吸道V2驗收、呼吸六份prompts與泌尿／體液規格審查
- 依CODEX_TASK_RESPIRATORY_URINARY_CLAUDE_REVIEW_2026-10-13.md完成三份詳細報告＋摘要：docs/AIRWAY_FIGURES_V2_CLAUDE_REVIEW.md、RESPIRATORY_PROMPTS_CLAUDE_REVIEW.md、URINARY_FLUID_CLAUDE_REVIEW.md、RESPIRATORY_URINARY_REVIEW_SUMMARY_2026-10-13.md。
- 回核原PDF：AB-05_13、CH06（呼吸）、AB-05_15、CH09（泌尿／體液）及六張待審卡。呼吸道V2有條件通過（A-01～A-04小修）；Claude工作區Playwright重跑兩尺寸18狀態通過。呼吸prompts 34可交／20待C1；泌尿體液63可交（待U1）／13待資料層／14待來源或數值。
- 直接修正規格文件（簡體字、重複狀態名、總覽紅字錯位、RAAS來源頁、ACE依原書、V/Q單位、周邊受器位置、prompt內審查者指示等），差異存兩個CLAUDE_EDITS_2026-10-13.diff；總規格各補第七節審查結果。
- 未改content／preview／程式／Excel／登錄／原子卡／進度；183、258、33檔SHA核對不變。未產圖、未commit／push／部署。feature/respiratory-infographics／e8805f8。

## 2026-10-13 Codex：呼吸／泌尿Claude交接prompt
- 新增CODEX_TASK_RESPIRATORY_URINARY_CLAUDE_REVIEW_2026-10-13.md，整合新版呼吸道圖驗收、六份呼吸prompts與泌尿／體液規格及來源審查，列來源、權限範圍、未核可卡與四份報告要求。
- 僅交接文件，教師自行交Claude；未啟動審查／產圖／實作／commit／push／部署。feature/respiratory-infographics／e8805f8。

## 2026-10-13 Codex：呼吸與泌尿開發缺項盤點（僅檢視）
- 核對handoff、呼吸預覽／V2報告、六篇製圖規格與泌尿／體液十篇規格。實檔呼吸7份content／preview存在，shared/materials.ts尚未登錄；泌尿無content實作，指定兩份新版Claude審查報告未找到。
- 區分10/8舊呼吸驗收與10/11ChatGPT圖待審；泌尿6篇66題與體液4篇44題皆僅藍圖，6待教師來源及U1–G2需裁定。整理製圖、接合、內容與命題、驗收、題庫增列、登錄及部署缺項。
- 僅查檔與交接文件；未重跑功能測試、未改教材／圖／Excel／程式，未commit／push／部署，feature/respiratory-infographics／e8805f8。

## 2026-10-13 Codex：115-MI兩項修正發布成功
- 教師授權「現在可以更新」，d48aac87正常push mi/main；Actions38317348554建置及Pages部署success。前端135＋Functions42全過0跳過、版本／兩端編譯／49入口成功。
- 線上首頁／新JS200，新JS SHA256與本機已驗build逐位元一致。Chrome正式前測補考填理由後切後測，來源回一般正式測驗且理由欄消失，未建立新場次；截图teacher-kind-switch-fixed-live.png。
- 影片等待進度／失敗重試同批發布，前輪本機原生Chrome延遲／失敗／重試已驗，本輪未新增線上學生播放。證據fixes-release-verification.json。
- 只更新MI前端，未部署Functions、未改課程／名冊／場次／成績；版本仍1.7.1。MI HEAD與remote main=d48aac87，後續證據與交接未提交；根目錄e8805f8維持原狀。

## 2026-10-13 Codex：補考切換缺陷操作說明
- 核對Assessments表單與後端種類檢查；說明僅前測補考來源殘留使後測建立遭拒，既有試卷／成績不受影響。現場重整後直接選後測、一般正式測驗及正式班級再建立；本機清空來源／理由修正尚未部署。
- 僅說明與交接，feature/respiratory-infographics／e8805f8，未改功能／雲端、未commit／push／部署。

## 2026-10-13 Codex：115-MI教師控制台實機驗收
- 正式Chrome教師UI僅test班完成前測補考／後測建立、開放、預覽、結束及公布，雲端audit一致；作答報表及55筆8欄配對CSV下載正常。授課38頁、互動開關／再投、換頁、黑屏、全螢幕內結束與備註隱藏通過。
- 發現前測補考切後測殘留makeup/reason，建立遭拒；MI Assessments.tsx切種類清空兩欄，本機真實React fixture回歸成功。現場先重整正式測驗頁再建立一般後測。此修正及影片續播修正均未部署。
- 僅驗收test場次，0新作答；兩試卷closed／released並收回classIds，互動closed／入口清空，原正式前測prepared未公布與N551/N552/test恢復。學生重新登入／重整未再見internal。跨裝置／54人承載未實測。
- 報告主目錄docs/mi-exam-review/TEACHER_ACCEPTANCE.md、去識別JSON與3張截圖；前端編譯/build、59前端＋42Functions通過，先前4headless受阻不列通過。主目錄e8805f8／MI75801d1，未commit／push／部署，待新修正上線授權。

## 2026-10-13 Codex：115-MI當日授課狀態答覆
- 10/13授課就緒確認：只讀雲端正式前測仍prepared／未公布，N551/N552/test設定正常，沒有開放中的課堂互動。已實測學生主要流程可用；上課由教師開放前測／結束前測後開後測、選互動頁開放及結束統整。影片可播放，直接重整續播缺陷本機已修、未部署；教師控制台實機、多人跨裝置及其餘影片仍未完整驗證，不保證全部零問題。此輪無程式／雲端設定變更、未commit／push／部署。

## 2026-10-13 Codex：115-MI真實學生前後測／課堂互動驗收與影片修正
- test已可進入；前測6/7=86、後測7/7=100，儲存重載、交卷鎖定、延後公布、前測未結束阻擋後測通過。兩輪不計分單選／排序各1回答，未作答驗證、送出鎖定、重整保存與結束統計通過。
- 一般2題完整測驗100分後端持久、閃卡不增次數、選做不增必做；TB24秒雲端位置與重新進入續播通過。直接重整start=0已重現，MI Student.tsx本機修正等待進度／失敗重試，延遲fixture0→1次/start42通過，未上線。
- 正式前測原班級／prepared恢復、驗收測驗收回班級且保留作答稽核、互動closed並清空latest；不動N551/N552成績。報告STUDENT_ACCEPTANCE.md及去識別JSON／4截圖。59前端與42Functions測試、兩端編譯／49入口通過；選定100項前端96通過4headless沙箱受阻，不列通過。非54人或跨裝置；其餘影片／HTML完整通關另列。
- 根目錄feature/respiratory-infographics=e8805f8，MI codex/115-mi-assessments=75801d1，未commit／push／部署；新修正發布需教師明確授權。

## 2026-10-13 Codex：test名冊信箱差異確認
- 使用者截圖及115-MI班級名冊A56:E56均为albertchang@gmail.com，已同步enabled enrollment到test班；實際登入albertchang1008@gmail.com無membership。確定為信箱不一致，而非未發布或全班未同步。
- 尚未更正Sheet或帳號資格；feature/respiratory-infographics／HEAD e8805f8，未commit／push／部署。

## 2026-10-13 Codex：test空課程清單原因定位
- 指定test帳號profile同名hhchang chang／teacher=false，無enrollment也無legacy roster；課程已發布且包含test班。原因為未加入啟用課程名冊。
- bootstrap依enabled enrollment找課程，空清單UI統一顯示未發布，教師預覽不驗證真實帳號會員資格；補足此前「test可見」只驗證班級設定的限制。
- 未修改名冊／權限／課程；正式學生端驗收待建立test membership。更新STUDENT_ACCEPTANCE.md與handoff；feature/respiratory-infographics／HEAD e8805f8，未commit／push／部署。

## 2026-10-13 Codex：115-MI學生介面實測
- 教師預覽實際操作通過：三班365題、六新增單元25分類、1影片播放32秒、閃卡、两題100分完整交卷、選做不增必做完成度、手機寬度交卷畫面。
- 真實學生端驗收未完成：教師登入且測試白名單空，已請教師登入可用學生測試帳號；不將預覽結果當正式後端驗收。正式學生成績／名冊／白名單未動。
- 報告docs/mi-exam-review/STUDENT_ACCEPTANCE.md與3張截圖；feature/respiratory-infographics／HEAD e8805f8，未commit／push／部署main。

## 2026-10-13 Codex：115-MI未完成工作盤點
- 確認本輪題庫／影片佈建已發布且bank驗證完成。未做真實學生端完整操作驗收；14前後測僅Sheet；8疑義題依指示排除、42停用。
- Claude覆核Excel保留原審查版本，最新可用內容在Sheet／reviewed-bank.json；文件與資料未commit，分支feature/respiratory-infographics／HEAD e8805f8，無push／程式部署。

## 2026-10-13 Codex：微免Claude修訂與Google Sheet寫入
- 依教師選擇，74修訂全部套用，69可用、5待裁定排除；另291通過中3未決排除，42停用，357来源可用／50排除。
- 115-MI Sheet新增297題，更新60既有解析，修復既有TH選項，停用1題；380資料列／379啟用，逐格回讀與真實parser驗證通過。原列及ID保留。
- reviewed-bank.json、revisions-applied.json、deployment-selection.json可追溯；同步與發布完成：30分類365題、25新分類current、47YouTube、六選做單元，N551／N552／test可見。實際bank分塊驗證全部297新增ID及排除50來源／1既有停用題通過；14前後測維持僅Sheet。未commit／push／程式部署。

## 115-MI影片活動與407題Claude覆核包完成（2026-10-12，Codex）

- 依教師授權在明確mi-bd885課程交易追加六選做Chapter、47課後YouTube草稿（20／20／3／0／4／0），原5分類／69題、兩份教材與published快照保留；Chrome確認免疫20影片選看。未發布，新單元尚無核可分類。
- 407題新解析與①–⑤完成；官方23卷逐題定位、逐格核答案，18差異／更正與4列學名C.誤切錯欄候選；402唯一答案、5非唯一留白，全部FALSE。重新分類377題／25章、30非微免延伸待裁定，43題建議保留停用。原20欄逐格及來源SHA保留。
- 新增Claude覆核版Excel（五頁、標準24＋17備查欄）、完整407題MD／JSON、407列空白回填CSV、優先爭點／答案／錯欄／去重清單與交辦檔。教師選擇自行交Claude；未代稱已收件或通過。交付ZIP含本輪審查檔案，不含外部原卷與課本，Claude須依交辦路徑讀來源。
- Google Drive學校帳號只讀115-MI確定目標sheetId 0、83題；59題題幹／選項集合一致、4同幹異選項，尚需近似題人工核對。未讀名冊／寫Sheet；覆核後重讀、去重追加，既有列／ID保留。
- 五頁視覺檢查、匯出407ID及原文／來源SHA、四組驗證／凍結、概要快取26／407／47與公式錯誤0通過；repo實際parser全FALSE如預期無題，記憶體模擬364題六單元／25分類及五段解析成功。內容未經Claude覆核。更新課程規畫與handoff；分支feature/respiratory-infographics／HEAD e8805f8，未commit／push／部署／同步／發布。

## 115-MI國考題庫課序格式與規畫（2026-10-12，Codex）

- 教師選擇加入目前國考精準對焦課程；新規畫保留2輔導單元／69題，追加6選做單元／24章節題目分類；來源407題、105–114年、46原細分類，2缺答案，解析多套版且有分類疑點。
- 新增docs/115-MI-national-exam-course-plan.md與outputs/01a13058-c172-7e62-9a0a-98bd6448f46b/微免國考題庫_課序格式_規畫版.xlsx；4分頁含標準24欄＋11備查欄、原始20欄、47影片重新配置、課程規畫。原檔與原題／選項／答案不改，解析原文留原始頁，新解析欄留白；全部FALSE待核對，不可覆蓋既有Sheet。
- 實際parseBankSheet記憶體模擬405題成功（6單元／24分類），407 ID唯一，逐格原值及來源SHA一致；公式變動／復原及保存快取24／407／2／47、資料驗證與4頁渲染通過。格式驗證不等於官方答案／醫學內容已核對。未改程式或對外同步／發布／commit／push／部署；待教師確認規畫與內容核對。

## 115-MI影片活動規畫（2026-10-12，Codex）

- 只讀教師後台，確認115-MI站v1.7.1、唯一課程115-1-MI-國考精準對焦、細菌38題／免疫31題，各已有1個必做互動教材，無課前／課後活動。
- 新增 docs/115-MI-youtube-activity-plan.md，47支逐片對應23細菌／20免疫／4病毒待建單元；建議課後YouTube選做，先草稿驗收再教師授權發布。核對47列與23＋20＋4合計；教師確認前未建立／保存／發布；無程式修改／commit／push／部署。

## Moodle課程YouTube清單（2026-10-12，Codex）

- 教師在學校Chrome設定檔登入後，以原生Chrome逐項查看課程1080「114-2 微生物與免疫學小考專區 新店」的64個期中前／期中後補充活動；58個活動含影片，依YouTube影片ID合併11個複製活動，整理47支不同影片。
- 新增 docs/moodle-1080-youtube-list.md，依章節排列並附YouTube及Moodle來源；另列6個Drive資源（未開Drive檔案）。Ch3生長的iframe雖顯示為文字仍取得ID；Ch5資料夾說明內影片亦納入。未逐支播放或驗證全片可用性。
- 自動審核拒絕儲存完整私人課程HTML至暫存資料夾，已取消儲存、改直接讀頁面；輸出僅所需影片索引。核對64活動無漏查、47個ID各11字元且不重複；僅文件，不涉及程式測試。feature/respiratory-infographics／HEAD e8805f8；未commit／push／部署。

## 泌尿、體液次單元與ChatGPT製圖規格（2026-10-11，Codex）

- 新增總規格、十份詳細作者規格及Claude交辦：建議泌尿6＋體液4，60教學節點、70圖位、90段ChatGPT prompts（60節點＋30總覽狀態）、110題考點藍圖；逐圖候選標籤／紅字、來源、解剖方向驗收、預測活動與跨篇分工已列，尚未命題或實作。
- 記錄33來源卡狀態與SHA、67個Q4候選題號映射；27卡reviewed、6卡仍待教師，未重核PDF，需Claude核對U1–G2來源／數值／解剖爭點。教師指定ChatGPT製圖、Claude先審，無產圖或自畫替代圖。
- SPEC_SELF_CHECK通過十篇結構／90prompts／標籤紅字／文件連結；258教材／圖／preview／Excel／登錄檔與33外部卡SHA不變。僅文件與交接，無preview／build／Excel／登錄／commit／push／部署。feature/respiratory-infographics／HEAD e8805f8；Claude審查報告待產生。

## 呼吸六份ChatGPT製圖prompt規格（2026-10-11，Codex）

- 新增總規格、六份逐圖詳細規格與Claude交辦；42教材圖位／54段可複製prompts（36節點＋18總覽狀態），含標籤白名單、紅字、解剖／數值驗收、來源與66題覆蓋。教師明定由ChatGPT製圖，撤除草稿Codex繪圖安排；本回合僅文件。
- 258個教材／圖／preview／登錄／Excel檔案SHA不變；未產圖／改教材／preview／build／Excel／登錄／commit／push／部署。feature/respiratory-infographics／HEAD e8805f8；待Claude審，審查結果尚未產生，C1–C6列待裁定。

## 呼吸教材規畫數量確認（2026-10-11，Codex）

- 依呼吸規格A1確認：呼吸系統7次單元對應7份資訊圖表，每份6節點、7圖與11題；呼吸道構造為其中1次單元／1份教材。僅核對與更新交接，未修改教材或登錄。

## 呼吸道剩餘工作確認（2026-10-11，Codex）

- 核對交接與V2報告：本輪七圖實作、preview、測試與截圖已完成；剩Claude獨立驗收及教師看畫面。正式build／11題Excel增列／登錄／commit／部署仍待後續授權；本次只更新交接，未修改教材。

## 呼吸道構造圖 V2（2026-10-11，Codex，版本不變）

- 依 CODEX_TASK_airway-figures_2026-10-11.md，七圖換成指定 ChatGPT 底圖＋中文 SVG 標籤；沿用 Claude 已核可錨點，標籤與紅字限定規格清單，overview 隨三狀態切換。喉軟骨及聲帶兩格上下排；氣管僅裁指定橫切面。新增 repo 可重跑產生器、五張1200px品質82 WebP、圖面驗證腳本；CSS限airway-structure。
- preview、materials20／20、節點稽核、既有shots與額外18狀態幾何檢查通過；手機最小13.28px、桌機30.40px，HTML約1.124MB。兩尺寸各9張圖面；報告 docs/AIRWAY_FIGURES_V2_REPORT.md。content、其他六份呼吸教材及Excel／登錄檔SHA不變。
- feature/respiratory-infographics／HEAD e8805f8，未commit；待Claude及教師驗收。未正式build／Excel／登錄／push／部署。

## 大腦循環雙視圖重做（2026-10-08，Codex，版本不變）

- 教師「接下去做」授權接續大腦；第1～6步頸部前視＋腦底仰視，額／顳葉、小腦、腦幹及中心標记；第7步獨立前視靜脈回流，左頭臂靜脈跨中線匯右側上腔。不再上下疊長圖，皆400×430。
- 保留核可供血拓樸；第4步六分支同步、第5步前交通1／後交通2、第6步七段環本體，中大腦環外註記且淡化遠端；交通粒子往返註明不是固定流向。方案D最多30顆，標準1秒／慢1.6／快0.6、減少動態無粒子、暫停凍結。節點5／6同步，字卡／6節點11題／SDK保留，其他三模式幾何未改。
- 21張大腦圖（14逐步／4雙視圖深色／2填色中途／1減少動態）、四模式Playwright及節點文字驗證通過；測試遠端字型5秒逾時後用既定本機備援。報告 docs/BLOOD_FLOW_CEREBRAL_PREVIEW.md；截圖集現收四模式92張。feature/blood-flow-routes／HEAD e8805f8未提交。四模式已分次完成preview，等整體人工核可才教材登錄／Excel／commit；未push／部署。


## 胎兒循環依視覺計畫重做（2026-10-08，Codex，版本不變）

- 教師交辦「胎兒循環」，接續只做出生前8步及出生後6步。另畫胎兒四腔／心房中隔、塌陷肺、右大肝葉、膀胱、圓盤胎盤與三條螺旋臍血管；卵圓孔在心房中隔、導管接左鎖骨下遠側、臍動脈由髂內分支；移除成人無關標籤。
- 方案D紫色深淺、同步填色＋粒子；卵圓孔與右室4對8顆，導管90%與到肺總10%為18對2顆；最多20顆。胎盤藍轉紅，臍靜脈紅／臍動脈藍；出生後累積變灰與改名、末步紅藍分開；註明閉鎖對照順序不是實際時序。節點3／4同步，字卡、6節點11題與SDK保留。
- 35張交件（28兩寬逐步／4出生前後深色／2填色中途／1減少動態）；胎兒Playwright、肺／體回歸、節點文字檢查通過。報告 docs/BLOOD_FLOW_FETAL_PREVIEW.md，截圖集 docs/blood-flow-routes-preview.html。feature/blood-flow-routes／HEAD e8805f8，未提交；停preview待胎兒人工核可才大腦，未登錄／Excel／commit／push／部署。


## 體循環依視覺計畫重做（2026-10-08，Codex，版本不變）

- 教師「可以」核可肺循環方案D，授權接續體循環。僅重做體模式及節點2：淡色人體四腔心臟、弓三起點及頭臂再分支、腹主動脈圖右／下腔圖左、左右頭臂靜脈匯上腔、上下半身微血管網、升主動脈根部冠狀動脈、左側瓣膜。
- 共用方案D同步填色＋粒子流，體模式最多30顆；標準1秒／慢1.6／快0.6，微血管紅轉藍、暫停凍結、減少動態填滿無粒子。字卡、6節點11題與SDK保留，肺專用回歸檢查保留。
- 19張體圖（14逐步／2深色／2填色中途／1減少動態）與Playwright、肺回歸、節點文字驗證均通過；節點2樣式限定於獨立圖，避免污染深色動畫配色。報告 docs/BLOOD_FLOW_SYSTEMIC_PREVIEW.md，截圖集 docs/blood-flow-routes-preview.html。feature/blood-flow-routes／HEAD e8805f8，未提交；停preview待體模式核可才胎兒，未登錄／Excel／commit／push／部署。


## 肺循環方案D：填色推進與粒子流（2026-10-08，Codex，版本不變）

- 依四之一及方案D，只修改肺模式；同一步全部路徑同步dashoffset填色（標準1秒ease-in-out），填滿後各分支5顆半徑3粒子持續流，週期1.4秒隨慢／快調整。肺動脈拆4完整分支、四肺靜脈及上下腔同時動，最多20顆；單血滴移除。肺泡藍轉紅、減少動態直接填滿無粒子，保留SDK事件0。
- 第6步左室400字重、左房加粗；主幹與肺靜脈標籤移近血管，後者分兩行。17張交件圖（12逐步／2深色／2填色中途／1減少動態），Playwright查同步填色、粒子移動／上限、暫停凍結、標籤bbox及手機同屏。深色控制項改用專用配色變數，避免kit局部變數干擾。報告／交接更新，待核可後才體模式；未登錄／Excel／commit／push／部署。

## 血流肺模式依視覺樣張重做（2026-10-08，Codex，版本不變）

- 教師限定只做肺模式。依樣張改完整雙肺、冠狀切面四腔；肺動脈幹由右室上端出、避開右房，左右肺靜脈各二獨立路徑入左房。不畫主動脈、無引線／發光，當步路線與必要標籤明亮。
- 圖→字卡→控制列；最多8標籤；標準1秒、慢1.6／快0.6、0.7秒停留、ease-in-out與深色。節點1同步；字卡／11題／SDK保留，其他模式／節點圖未重做。12張兩尺寸逐步＋2深色圖，bbox零碰撞／裁切、手機同屏圖字卡下一步、SDK步驟0、速度與node驗證通過。
- 最新報告 `docs/BLOOD_FLOW_PULMONARY_PREVIEW.md`；舊全模式圖面Claude未通過，不可沿用舊驗收結論。停preview，待肺核可才體→胎兒→大腦；未登錄／Excel／commit／push／部署。

## 血流動畫加速與 UI 視覺升級（2026-10-08，Codex，平台版本不變）

- 依教師貼上要求，動畫基準4200→1600ms、手動提示2600→1000ms；速度選單改0.75／1／1.5（預設推薦）／2×。CSS僅作用於血流教材，套膠囊分頁、柔和陰影／漸層、毛玻璃說明卡、狀態徽章、圓形步驟及血滴發光；保留最小44px觸控、font-scale與減少動態停播規則。手機畫布縮小內距以維持圖字≥12px。
- 預覽與84張交件圖／82標準圖刷新；兩尺寸功能、字體／裁切、SDK與倍速檢查通過。新增推薦預設／四檔選單與2×實際步進時間檢查。完整專案check134／26沿用此前通過結果；未登錄／Excel／commit／push／部署，仍待畫面驗收。

## 血流標籤與胎兒引線三處修正（2026-10-08，Codex，平台版本不變）

- 套用教師指定標籤背景陰影、文字600粗體與不可選取、引線4／2虛線及0.85透明度；SVG另將引線群置於血管與器官下層。卵圓孔引線水平M-5 369→185 369、標籤377；動脈導管引線M438 340→275 320、標籤350；右鎖骨下156、頭臂動脈236。配合挪開肺靜脈、左頭臂與T4標籤避免新碰撞。
- 改來源CSS／SVG生成器後重建本機preview、刷新84交件圖與82標準圖，兩尺寸功能／裁切／SDK檢查通過；未直接修生成HTML，後續重建可保留修訂。交接與預覽報告更新，仍待驗收，未登錄／Excel／commit／push／部署。

## 血流預覽圖面修訂：解剖標示與標籤排版（2026-10-08，Codex，平台版本不變）

- 依教師截圖意見，區分頭臂靜脈左右各一與肺靜脈左右各二；威利氏環近端路徑與環外遠端拆分，中大腦於環步驟淡化並註明環外分支。各圖加側邊標籤引線及頂層底色、前方肺動脈幹隔離描邊，肺泡交換註解移回肺旁；胎兒補胎兒端／胎盤端。
- 核定字卡、題目與追蹤規則保留；重建 preview、84交件圖及標準82圖，更新報告與來源稽核。測試文字邊界採SVG實際座標轉換，手機最小字12.69px；功能／SDK、node驗證、check134／26與兩端build通過。未build登錄、Excel、commit、push或部署；待Claude與教師驗收。

## 血流路徑動畫階段 2：預覽與截圖交件（2026-10-08，Codex，平台版本不變）

- 從 e8805f8 建 `feature/blood-flow-routes`，隔離於 `.worktrees/blood-flow-routes`；依核定階段1來源完成肺／體／胎兒／大腦四模式、34步與單血滴播放、倍速、暫停、步驟點、瓣膜及減少動態；胎兒6項出生後閉鎖與名稱切換，全閉鎖成人紅藍。6節點／6先備＋5模型觀察題，提示解析待Claude逐題驗收。
- 7張SVG與元件庫條件載入、截圖／功能驗證腳本；所有字卡對照核定版一致。84張交件PNG（68逐步＋12節點＋2通關＋2動態），標準shots82張errors0。check前端134／Functions26、兩端build／版本、node驗證及功能驗證通過；SDK動畫事件0、6節點探索／停留、全對complete一次；手機圖字最小16.6px、控制最小44px、無橫向溢位。台灣用語／疾病藥物指定詞掃描0。
- 報告 `docs/BLOOD_FLOW_ROUTES_PREVIEW.md`、截圖索引 `docs/blood-flow-routes-preview.html`、來源／掃描稽核JSON均在血流worktree。保留既有循環路線、目錄與Excel零改動；未commit／push／部署，依教師要求停在preview＋shots，待Claude解剖／內容獨立驗收與教師看畫面。主目錄仍為呼吸分支，不混入血流程式。

## 2026-10-08｜血流路徑階段1：四卡重驗與原句表 [Codex]

- 依docs/BLOOD_FLOW_ROUTES_SPEC.md只做階段1：pulmonary／systemic／fetal／cerebral四卡逐項重修、補來源，經progress_cli回self_checked，frontmatter同步。胎兒補分流比例與六項出生後變化；移除肺動脈高壓、先天異常與庫辛氏反射，庫辛氏另列國考延伸候選。
- 外部知識庫05_review/blood_flow_steps_sources.md涵蓋34列；附quotes JSON、17頁來源chunks、4頁PDF圖、QC／狀態日誌與保護檔驗證。機械QC四卡PASS（0 error／warn），其他201檔（卡片與解析Excel）及其他todo列不變，保留四卡與todo原檔備份。
- 指出「臍靜脈純充氧」頁碼11-40；大腦第4步完整來源配對的文字原句缺口標無出處，保留原書圖示出處與needs_review供Claude裁定。不自升awaiting_teacher_review／reviewed。
- 更新handoff後停止，待Claude複驗與教師抽查；未開始階段2、未改平台程式或教材、未push／部署。

## 2026-10-07｜Claude 驗收後呼吸與看板修正 [Codex]

- 呼吸R1圖解重畫、77題提示／解析、7預測回饋、12應用句與42節點重點修訂，題目身份不變；教學文字保存於可重建來源。
- 7份preview／shots、節點稽核、14頁互動驗證與用語／A2掃描更新；教材仍未build、登錄、寫Excel或commit，待Claude複驗。
- 看板獨立worktree三項修正提交ed08854，check140／26與兩尺寸截圖通過。main未push／部署，B報告未動。


## 2026-10-07 Codex 工作2交件（獨立1.7.1分支）
- feature/1.7.1-completion-board＝4a76a1f，從e8805f8分出；.worktrees/completion-board工作目錄乾淨，各班比較／學生單元矩陣／逾期明細／兩種CSV完成。版本1.7.1、check139／26、兩端build通過，報告與6張截圖在該worktree docs/COMPLETION_BOARD_1.7.1_ACCEPTANCE.md。待Claude驗收，未push／部署。
- 原工作目錄維持feature/respiratory-infographics／1.7.0，呼吸七份預覽與六題報告完成，等待教師看畫面核可，未登錄／Excel／commit教材。兩工作未混在同一分支。

## 2026-10-07 Codex 工作1：呼吸教材預覽與疑點研究（待教師看畫面）
- feature/respiratory-infographics，基底e8805f8；七份6節點／11題、49張SVG、氧解離曲線拖曳；未登錄、未寫Excel，教材依交辦暫不commit。
- 六題研究報告交Dropbox專案05_review/Q3疑點研究_6題.md，原始Excel／卡片／進度未改，B結論未套A；CH06 p.31已核對頸動脈體與主動脈體。
- 將handoff整理為目前狀態，移除已完成與過期重複驗收資訊；先前功能歷史仍在本log。


# main 既有歷史（完整保留）

# 2026-10-14：主畫面說明合併前停止 [Codex]

- 共用guide主畫面說明已提交e2dd36c；AP2 check158／54、MI乾淨匯出check150／54及兩站guide1280／390通過、0 skipped。合併前git merge-tree預檢以預設sandbox執行，因Git中繼資料暫存檔權限失敗（exit128）；依教師指示停止，未實際merge、未跑合併後MI check。應使用已授權提升權限，待教師續作指示後合併；不push／部署。

# 2026-10-14：學生說明加入手機主畫面 [Codex]

- 共用guide逐字加入iPhone／Android操作，舊節與id改3–11；字級≥16px、列印樣式。
- guide-verify新增11節、清單、字級／無溢位／print，以及產物在Pages子路徑HTTP200的檢查；登入程式未改。
- 檢查結果與真機待辦見docs/GUIDE_HOMESCREEN_2026-10-14_REPORT.md；本機提交後合併MI，待Claude複驗，不push／部署。

# 開發紀錄
目前版本：1.9.0

## 1.9.0 共用分站教材測試回補（2026-10-14，Codex）
- material-registration依站別核對：AP2保留原五份生理教材斷言；MI兩份微免HTML／來源／ID／目錄／SDK一致，且AP2公開檔不存在，無skip。
- 與MI release相同測試檔；共用AP2完整check158／54、0 fail／skipped通過，純暫存MI匯出150／54、0 fail／skipped通過。
- 本機回補commit，不push、不重新部署AP2。MI報告與待Claude複驗在release工作目錄。

## 1.9.0 CI修正與AP2成功發布、MI暫存失敗（2026-10-13，Codex）
- 7a6720e僅tests修正：MI70354e0兩份原檔.txt＋README SHA-256，讀fixture比對與雜湊檢查、無skip。
- 無70354e0乾淨shallow clone與unify兩站完整check158／54、0 fail／skipped；deploy.sh同結果。
- AP2 Actions38424586178 build/deploy全綠、Pages1.9.0成功；JS SHA與同設定本機build一致；索引READY、排程15:36–15:43 UTC連續200。
- test班三新開關均關閉、guide可開、既有10題作答保存成功；影片20→38秒重整續播。AP2既有reflection0，反思僅本機React/callable回歸，不新增正式活动。
- MI release/mi-1.9.0自70354e0（含d48aac8）開worktree，合併unify產24衝突；內容寫入後git add因default sandbox index.lock不可寫失敗，依指示停止。MERGE_HEAD／24unmerged保留，尚未check／dry-run／commit，不可部署。
- 報告docs/DEPLOY_1.9.0_REPORT.md；未push mi／apply／部署MI／改Excel或正式學生資料。

## 1.9.0 規則／索引成功，Actions失敗停止（2026-10-13，Codex）
- 教師明確授權AP2規則／索引，CLI限定ap2-7ed91、non-interactive部署成功；未加force、無刪除提示、未刪索引。
- 查40d3ec4的Actions38422029549：build的check前端155／157通過、2 fail、0 skipped；兩項site.test依賴MI70354e0，本機有該歷史但CI depth1沒有。Pages deploy跳過。
- 依任何一步失敗停下，沒有修測試／重跑Actions／回退。READY與排程log、線上雜湊／測試班驗證尚未完成，B段未開始。
- 更新docs/DEPLOY_1.9.0_REPORT.md與Actions失敗摘要；未改Excel／學生資料／push mi／apply／部署MI。

## 1.9.0 AP2 部署中止（2026-10-13，Codex）
- 教師授權部署，AP2不加MI22題、Excel不動；Claude複驗記錄提交40d3ec4，fetch兩遠端及origin祖先檢查通過。
- AP2變數未設VITE_SITE_ID，workflow預設ap2；deploy.sh完整check157／54、0 fail／skipped通過，ap2-7ed91 Functions成功，普通push備份分支與origin/main至40d3ec4。
- Firestore規則／索引部署被自動審查拒絕（獨立安全邊界變更授權／影響未核實），指令未執行；依任一步失敗停下，未繞過／回退。Actions、線上雜湊、測試班開關／guide驗證未完成。
- B段未開始；實際mi/main=70354e0，與交辦d48aac8不同，後續需核對。未push mi／apply／部署MI／修改Excel或學生資料。
- 停止點与待辦見docs/DEPLOY_1.9.0_REPORT.md；root教材工作保留。

## 1.9.0 驗收修正（2026-10-13，Codex；本機待 Claude 複驗）
- 依 Claude 對78cb5dc的驗收修 M-1：presentationSnap 不遮蔽簡報轉換 JSON；假 Firestore 跑 CLI apply，交易設定精確一致、不含 snapshot 欄位，全程封鎖網路與真實 SDK／憑證。
- m-1 前／後測任一來源空白時保存成功後提醒，不阻擋；m-2 標題明示保存草稿即對學生生效、不需發布。
- m-4 重拍18張測試班截圖，提示標籤移至48px白底外側；桌機／手機來源提醒與標籤不相交驗證通過。
- AP2／MI 完整 check：前端157／Functions54、0 fail／0 skipped；兩站 guide 驗證通過，圖片585690 bytes、最小12.25px、無溢位／外部請求。
- 更新報告與交接；未改 Excel、未 push／部署／執行正式 migration／接觸正式 Firebase。待 Claude 複驗 M-1，m-3 留教師決定。

## 1.9.0（2026-10-13，Codex；本機待 Claude 驗收）
- 從 origin/main@a593796 建 feature/1.9.0-unify／.worktrees/unify-1.9.0，逐檔移植題庫分離、1.8.0 反思與指定 MI 功能 commit；沒有 merge MI 網站分支。
- 功能改為課程 features（預設關閉）、後端 access＋features 驗證、課程來源題目設定與私有簡報、資料驅動互動，保留舊輪次／試卷紀錄路徑。
- 修反思換行與換信箱未作答判斷；影片等待雲端進度、補考種類切換、倒數／加時一併移植。
- VITE_SITE_ID 分開 AP2／MI 目錄、網址及 CHP 建置；AP2 原快照全部保留。MI 簡報選項指示改為課程 migration 資料，顯示與舊版逐頁一致。
- 共用靜態學生說明、登入／首頁入口與本機三張提示；18 張測試班指示截圖、兩站桌機／手機建置截圖；無正式學生資料。
- AP2／MI 各跑完整 check，前端156／Functions54、0 fail／0 skipped，版本／build／51入口通過；guide 最小12.25px、無溢位／外部請求、色系字級／列印有效；圖片584447 bytes。
- migration 只產離線 dry-run，12題逐字一致；未 apply、push 或部署。報告 docs/UNIFY_1.9.0_REPORT.md，待 Claude 獨立驗收。

## 1.7.1 看板＋微免release整合完成（2026-10-11，Codex）

- 由ed08854建立指定release worktree與codex/release-1.7.1-micro-immuno，依序合併微免 465c375c40f9170559e01db6e3f2dee485ad82b7 與最新main 3f6d92574c0c29b64a3cad2a352e9ce4add4b962。handoff衝突已整合；版本維持1.7.1、看板檔及名冊後端與錯誤詳情UI逐項比對通過。
- 微免142張本機截圖從未推送提交移出版控且.gitignore；教材內嵌圖不變。Excel與Claude核可檔完全相同249題（229–239細菌、240–250免疫），登錄與dist正式輸出一致；沒有呼吸／血流未核可教材。
- 乾淨npm ci／functions ci、materials:sync、完整check通過：前端140／Functions29，0fail／skipped，版本與兩端build通過。報告、完整check與結構驗證交件；本機commit結尾[Codex]，停在乾淨release分支，未push／部署，教師自行執行deploy.sh。

## 2026-10-07｜1.7.1 Claude 驗收後修正 [Codex]

- 選看與不可計分單元排除逾期標記、人数、排序／篩選及CSV；補回歸測試。
- 圖例分項加間距；最高分／門檻與作答次數加分隔。
- check140／26、兩端build、版本檢查及兩尺寸截圖通過，待Claude複驗，未push／部署。



## 1.7.1 — 2026-10-07 完成度看板：各班比較＋學生單元矩陣 [Codex]
- 從e8805f8獨立建立feature/1.7.1-completion-board（.worktrees/completion-board），純前端；逐班讀完getCompletion分頁、頁面快取、各班／總人數加權完成率、姓名固定矩陣、逾期／未開放／進行中格子、明細抽屜、搜尋排序篩選及兩種CSV，保留StudentDetail。
- 新增shared/completionBoard.ts顯示純函式與測試，不改公式v3、後端、Firestore、學生端或分析；版本全檔同步1.7.1。
- check前端139／Functions26、兩端build、版本與diff檢查通過。兩班18人一致性／React操作、53人分頁及失敗、真實CSV下載、6張1280／390截圖見docs/COMPLETION_BOARD_1.7.1_ACCEPTANCE.md，待Claude驗收；未push／部署。

## 2026-10-07 Codex 工作1：呼吸教材預覽與疑點研究（待教師看畫面）
- feature/respiratory-infographics，基底e8805f8；七份6節點／11題、49張SVG、氧解離曲線拖曳；未登錄、未寫Excel，教材依交辦暫不commit。
- 六題研究報告交Dropbox專案05_review/Q3疑點研究_6題.md，原始Excel／卡片／進度未改，B結論未套A；CH06 p.31已核對頸動脈體與主動脈體。
- 將handoff整理為目前狀態，移除已完成與過期重複驗收資訊；先前功能歷史仍在本log。

## 微免截圖移出版控與release整合授權（2026-10-11，Codex，版本不變）

- Claude正式交件通過，22題Excel獨立逐題比對0錯；教師授權整合，但不push、不執行deploy.sh。
- 微免47MB截圖以git rm --cached移出版控，檔案保留本機、加入.gitignore；報告與截圖集頁面註明本機限定，amend尚未推送的9b301be。教材內嵌教學圖與Excel不變。
- 下一步自ed08854建立codex/release-1.7.1-micro-immuno，依序整合微免與最新origin/main、保留看板及名冊同步修正與版本1.7.1，全check後本機commit，交教師部署。

## 115-MI 微免正式建置與22題追加（2026-10-11，Codex，版本不變）

- 教師核可兩份畫面後，在指定worktree執行兩份materials:build及materials:sync，正式輸出SHA與核可preview相同；catalog／教材README各新增兩筆（6／8節點、各11題）。教師定稿原文不改，唯一kit改動仍為核可hues22／216，credits僅核可形狀與署名。
- Excel追加細菌229–239列、免疫240–250列，共22題，總249題；既有題庫228列與說明34列原始XML、所有原有儲存格與其他ZIP parts完整保留，說明只增35–37列來源與新合計。Excel選項換位、答案代碼／Zuvio序號與核可正解逐題匹配；單元及次單元沿原標題，課程代碼留空。存檔重新匯入及渲染檢視通過。
- npm run check成功：前端134、Functions26全部通過，0 fail／skipped，版本一致及前後端build通過；完整紀錄與逐列Excel證據納入交件。核可preview三字型／兩寬252狀態、SDK4、46標準shots／140圖截圖集因正式輸出SHA相同仍適用。
- 報告／截圖集狀態／handoff更新；本機commit結尾[Codex]，不push／合併／部署。讀取時main及origin/main已為3f6d925，獨立看板ed08854未包含名冊修正；建議新codex/release-1.7.1-micro-immuno由看板整合微免＋最新main，保留1.7.1並重驗後教師部署。具體命令於formal-delivery.md，待教師決定，未建立整合分支或修改其他worktree。

## 115-MI 教師核可與上傳流程釐清（2026-10-11，Codex，版本不變）

- 教師核可兩份畫面，授權指定worktree正式build／教材登錄與sync、Excel追加22題、完整check及commit；不push／合併／部署。上述正式作業尚待執行。
- 回答上傳目的地：教材透過GitHub Pages發布；Excel題目追加至課程Google Sheet，再由教師後台同步題庫。Zuvio解答僅為匯出欄位。尚未上傳任何外部平台，主目錄與其他worktree未修改。

## 115-MI 第三輪複驗四點修正（2026-10-11，Codex，版本不變）

- Claude醫學內容與104錨點已通過，本輪僅修四點：所有圖例Noto量測≤1080、只在完整項目間換行，移除textLength；B-N02細胞質移到圖像外右下、圖例上方獨立白底列；I-N01／04／05依圖例分組接續編號，I-N04骨髓1–2→骨髓系3–8→淋巴系9–12→次級器官13–15，淋巴標題對準B/T/NK列；50S藥名與外框淨距最小23.03單位≥12（扣描邊）。
- 驗證擴為system-ui、Noto Sans CJK TC、Arial-sans-serif fallback三字型，兩寬／兩色系252狀態全通過，手機字≥12.02、字框間距≥3；既有圈／圖例不重疊、引線不交叉、高度≤1.45與結構檢查全過。新增Noto90%行寬、細胞質獨立列、分組接續順序、淋巴標題位置與50S字框外框淨距檢查；SDK4流程、20測試、節點驗證、標準shots24＋22均過。
- 截圖集新增fallback、共140張，兩寬篩選與載入通過；報告依四點列數值，round4-four-point-checks／anchor-preservation／asset-sha交件。104錨點文字／比例／偏移與第三輪逐欄相同，其他三張自繪SVG SHA不變；定稿JSON／其他kit／建置程式／Excel／教材登錄保護檔案不變。
- handoff與報告更新，下一步Claude只複驗四點、教師看畫面。指定worktree／feature/micro-immuno-review／HEAD e8805f8未提交；仍停preview，未正式build／Excel／登錄／commit／push／部署，主目錄與其他worktree未改；唯一kit仍核可hues22／216，credits維持核可形狀與署名。

## 115-MI 微免第三輪圖面修正完成（2026-10-10，Codex，版本不變）

- 依Claude第二輪複驗，12張點陣圖的圖例全部改為單欄、每組獨立段落，修正B-N01人體細胞／細菌形態並排交錯；I-N01／I-N04／I-N05改為全圖連續編號，其他保留區塊編號。I-N05補紫色圓頭旁正在結合的抗體，I-N08補右側藍色CD8細胞並置於該組首項，共104個標記。
- I-N04三個標題放回對應細胞／器官上方，骨髓標記落在紅色組織（來源310,800），與造血幹細胞分開；B-N03脂多糖移至粉紅色鏈分子（1040,618，RGB232/103/139）。I-N05標題避開抗體、鎖／鑰匙說明移至鎖旁；B-N02細胞質移至右側膜下方、I-N03第一個標記移離小孩臉部。B-N06藥名在外框左側分行、MRSA整個括號同一行。
- 點陣viewBox依實際內容收緊877–1303（原圖900，≤1.45）；只除去近白底部留白。I-N03於白色分隔帶拆兩排，各留60單位標題帶，保留全圖；圖例四組單欄。B-N01形態圖例以textLength略收水平字距，字高保留，比例圖註仍在最後。
- 最終雙字型／1280與390／預設與冷色168狀態、SDK4流程、既有20測試、節點驗證與標準shots24＋22通過；手機字≥12.02px、越界／錯誤／水平溢位0。新增編號圓圈含描邊兩兩不重疊、圖例文字框兩兩不重疊與單欄檢查；原引線／高度／間距／字級／結構檢查全部重跑。98圖截圖集兩尺寸載入與篩選通過，來源像素、第三輪16圖SHA與保護檔案證據更新。
- 報告、截圖集、handoff更新；指定worktree／feature/micro-immuno-review／HEAD e8805f8未提交，定稿內容與其他kit未改，唯一kit仍核可hues22／216、credits保持核可形狀與署名。仍停preview，未正式build／Excel／登錄／commit／push／部署，未修改主目錄或其他worktree工作檔。

## 115-MI 微免圖面第二輪修正完成（2026-10-10，Codex，版本不變）

- Claude 前輪已通過內容、唯一 kit 改動、SDK與自動檢查；本輪依圖面意見將12張點陣圖改為102個實心編號＋分組圖例，區塊標題留在圖面上，各組獨立閱讀順序；viewBox高1305≤900×1.45。8條短引線最大55.44單位，所有引線互不相交。B-N01比例圖註保留；I-N03兩個原圖半幅各留100單位標題空間，所有原圖像素保留。
- B-N02脂蛋白錨到來源1063,569黑色連接線，周質空間1210,683桃色中央；I-N04胸腺1101,719橘色器官。抗生素圖只留一個50S上／30S下核糖體，四抗藥機轉改為具象示意與指定說明。IgM五Fc連五邊形環、J鏈色段；IgA雙Fc接J鏈、分泌片貼合；實驗室IgG移離曲線。節點06重複曲線移除以符合高度上限，實驗室互動曲線完整保留。
- 最終雙字型／1280與390／預設與冷色168狀態、SDK4流程、既有20測試及標準shots24＋22全通過；手機字≥12.02px、字框距≥5.47、越界／錯誤／水平溢位0。新增引線相交、短引線長度、高度上限、編號順序、核糖體／IgM Fc環／IgA接觸幾何檢查；98圖截圖集兩尺寸篩選與載入檢查通過，原始結果與16圖SHA交件。
- 報告 docs/MICRO_IMMUNO_REVIEW_REPORT.md、截圖集 docs/micro-immuno-review-preview.html 已更新；待Claude圖面複驗與教師看畫面。指定worktree／feature/micro-immuno-review／HEAD e8805f8未提交；定稿與kit本輪未改，唯一kit仍為核可hues22／216。未正式build／寫Excel／登錄／commit／push／部署，主目錄與其他worktree工作檔未改；深色主題限制如前。

## 115-MI 微免兩份資訊圖表 preview 完成（2026-10-10，Codex，版本不變）

- 指定 e8805f8／feature/micro-immuno-review 獨立 worktree：細菌6、免疫8節點，各6先備＋5情境；定稿文字／題目／答案／來源不變，僅核可 credits 形狀與署名；唯一 kit 改動為 presentation.mjs 的 hues 新增22／216。
- 12張1200px／quality80 WebP 內嵌SVG、102個中文錨點標籤、4張自繪 SVG，染色五狀態、反應兩狀態與原生時間軸、節點06重用曲線；manifest僅增16筆。
- preview／標準shots（24＋22）通過；正式 Noto Sans CJK TC 與 system-ui、兩寬、冷色共168狀態／SDK4流程及20既有測試通過，手機最小字 12.73px、文字間距 ≥6.33、無裁切／溢位／pageerror。98張檢視圖、報告及原始結果已交件。
- 既有 kit 無真正深色主題，本輪未超出核可範圍，系統深色偏好仍淺色；限制明列。報告 docs/MICRO_IMMUNO_REVIEW_REPORT.md，截圖集 docs/micro-immuno-review-preview.html，待 Claude 與教師驗收。HEAD e8805f8，未build／Excel／登錄／commit／push／部署，主目錄與其他worktree工作檔未改。
- 截圖集最後檢查：390／1280 篩選、98張引用與可見圖片載入通過，無水平溢位或錯誤；本機檢視入口為 http://127.0.0.1:8769/docs/micro-immuno-review-preview.html（伺服器關閉後可由檔案重開）。

## 115-MI 微免兩份資訊圖表前置檢查：依規定停工（2026-10-10，Codex）

- 從 e8805f8 開獨立 worktree `.worktrees/micro-immuno-review`／`feature/micro-immuno-review`，完整複製交辦資料。兩份 content.json 逐位元組一致，既有內容／節點驗證通過（6／8 節點，各11題）；主目錄與其他 worktree 工作檔案未改。
- 實際配色函式對兩個 slug 拋 Missing material palette；依交辦禁止擴大 kit 並要求先停下的規則，僅提出在 presentation.mjs 的 hues 新增兩筆方案，待 Claude／教師同意，未套用。
- 交件 docs/MICRO_IMMUNO_REVIEW_REPORT.md、docs/micro-immuno-review/preflight-results.json；preview.html 為阻塞說明入口，尚無截圖，preview 未完成。未轉圖、未 build／Excel／登錄／commit／push／部署；HEAD e8805f8，版本1.7.0不變。

## 期中考第四輪：26張章節缺口卡整批交件（2026-10-07，Codex，平台版本不變）

- 依教師核定18項缺口拆26張，逐頁讀指定課本、26張獨立卡一次生成，26組來源樣本逐字自檢及42筆primary／supporting原文配對；新卡群related雙向連結、比較純文字表、五段講義不照抄。全數self_checked、review_status draft，整批QC及寫回後QC均0 error／warn，blocked=0／合併=0；未自驗或推reviewed。
- 報告 `05_review/midterm_cards_round4_report.md`，含逐卡出處、來源限制、QC／stats；6張原書文字或涵蓋界限標needs_review。check_data 172→198，原172筆不變；todo204列僅26筆pending→drafted→self_checked，原178列不變。3更新檔先備份，543個既有卡／PDF／xlsx／索引／舊日誌等SHA-256不變；17題疑點、原5項無出處及教師退回左右主支氣管皆未處理，第五輪未開始。
- 最新全專案88 awaiting_teacher_review／41 self_checked／69 reviewed／6 blocked（教師此前已有69 reviewed）；待Claude獨立驗新26張、教師確認來源與抽查，再依另行交辦進入第五輪。平台分支feature/1.7.0-practice-modes／HEAD8429640，僅交接與開發紀錄更新，未改程式／commit／push／部署。

## 期中考第三輪：僅重驗 RAAS（2026-10-07，Codex，平台版本不變）

- 重讀交辦第三輪與 Claude 修訂版 RAAS，實際 fetch CH05 p.66–67、逐條比對五個專業段落及講義；前輪三項缺出處延伸已移除，5 段引文逐字吻合，裁決 PASS→awaiting_teacher_review（verifier codex）。指定日誌 `05_review/verification_log_midterm_round2_codex.md` 保留前輪 REVISE、追加本輪 PASS，verify_audit 0 error／warn、exit 0；兩列皆同一 uid，本輪僅驗一張。
- 只更新 RAAS 進度、指定驗證日誌及交辦執行紀錄；177 個其他進度列及 534 個其他檔案保持不變，未改卡／check_data／PDF／Excel／索引／reviewed。66 張期中卡＋RAAS 共67張待教師抽查；全專案157 awaiting_teacher_review／15 self_checked／5 blocked／1 reviewed。平台分支 feature/1.7.0-practice-modes／HEAD 8429640，僅交接紀錄更新，未 commit／push／部署。

## 期中考原子卡第二輪修訂與 RAAS 獨立驗證（2026-10-07，Codex，平台版本不變）

- Dropbox「072026 新的專案」依第二輪逐列完成：7 張 REVISE 修正後重送 self_checked；8 張指定台灣課本用語、2 張補 supporting；63 張刪 393 處來源括號，整批 QC PASS（0 error／warn）。PASS 卡逐字限制比對通過，未自驗自生卡；報告 `05_review/midterm_cards_round2_report.md`，含各卡逐字 diff。
- Claude 生成 RAAS 卡以 Codex 獨立裁決 REVISE→blocked：ACE 抑制劑延伸、感壓反射「數秒」及高血壓藥物「大半」未獲指定來源支持；3 段逐字引文確認存在，verify_audit PASS。卡片原文保留；原 5 項無出處不變。全專案進度 149 awaiting_teacher_review／22 self_checked／6 blocked／1 reviewed。
- check_data 維持 172 筆，其他 109 筆不變；178 進度列中其餘 170 列不變。66 個既有修訂檔先備份，197 個非目標卡／PDF／xlsx／索引／舊日誌等 SHA-256 不變；寫回後再次 QC／audit 通過。待 Claude 重驗 7 張、核對 PASS 用語並修 RAAS、教師抽查與來源裁定；平台分支 feature/1.7.0-practice-modes／HEAD 8429640，僅更新本交接紀錄，未改程式／commit／push／部署。

## 期中考原子卡整批交件（2026-10-07，Codex，平台版本不變）

- Dropbox「072026 新的專案」依交辦處理68項：63張新卡通過QC（error=0、warn=0），進度self_checked；5項來源不足blocked，未造無來源卡。完整報告 `05_review/midterm_cards_report.md`，附130頁稽核、18項章節缺口清單與每卡題目／來源／限制。
- check_data由106增至169，279個卡片來源頁引用均核對原文完整收錄；154個既有卡／PDF／題庫Excel等保護檔案SHA-256不變，既有進度列不變。三個更新檔已有同專案backup；待Claude獨立驗證及教師抽查，未發布。平台程式未改，分支feature/1.7.0-practice-modes／HEAD 8429640，未commit／push／部署。

## 1.7.0 ④ 錯題跨版本延續（2026-10-06，Codex，①～④ 待 Claude 驗收）

- 依 `docs/WRONG_CARRY_1.7.0.md` 取代原跳過④的結論：教師同步可讀舊版 manifest／私有grading／chunks，按正解文字、選項數、題型、刪題判斷重置；展示內容變更保留。
- Unit wrongCarry 與版本同交易更新，wrongCarryOrder 保存最近10筆順序。effectiveWrong 共用最多10段鏈／累積drop／防循環，rm與累計保留；伺服器重批後首次交卷實體化新版本、保留舊資料。同步零 progress 寫入，學生零新增讀取。
- 發布與forClass保留完整鏈；教師同步新增預設不勾的全部重算及三種結果。複習考重建與部署前同步不延續。所有讀取入口確認傳Unit，wrongEntries第四參數必填。
- 補充規格第7節測試與本機合成驗收：前端134／Functions26、build、版本一致性及git diff --check通過；驗收報告增加④與4張教師桌機截圖（原16張學生桌機／手機圖保留）。一個commit、未push／部署，既有Excel不納入。下一步Claude驗收。

## 1.7.0 練習模式（2026-10-06，Codex，待 Claude 驗收）

- 依第三版 `docs/PRACTICE_MODES_1.7.0.md` 完成七項盤點，結果見 handoff。①錯題共用規則／後端／測試 `b65418b`；②單元閃卡／錯題重做／移除時間範圍 `819b237`；③綜合範圍／三模式／手機與版本交接。
- 閃卡改純翻卡（題幹＋選項、可先標記答案、翻面焦點與空白鍵、再看一次本輪最多多排一次），不提交作答、不寫 progress／attempted／研究事件。
- 錯題新增 ok／rm，同日答對保留、台北隔日答對標 rm，累計 n 保留；再次答錯清 ok／rm、接續累加。有效錯題只計未移除，全部錯題讀取共用 effectiveWrong；後端採私有答案表重批，結果摘要由伺服器回傳，重送沿用已保存摘要。
- 錯題複習只出待複習，10／20／30／50／≤50非檔位全部；依 n 多→at 早取前 N 再洗牌。今天剛錯先翻卡，複習考維持無閃卡。review 寫錯題、不寫 attempted／best／fullAttempts／passedAt；舊 flashcard callable 相容。
- 綜合練習候選維持 current＋已發布、排除複習考，包含選看／已達標；三態單元分組、預設收合／全選、courseId＋uid 本機存排除 ID；摘要只用既有課程／progress，題庫按開始後只載所選分類。閃卡今天→待複習→未作答→其他；抽題待複習→未作答→其他；review 跨分類排序後取前 N。全部不計分，手機三列／44px／安全區。
- **①～③當時④未做（已由上方補充規格實作取代）**：舊快照仍在，但同步現有讀取只有課程與新版本 manifest，未取得舊正解文字／數量／題型；比較須新增 Firestore 讀取，違反硬性限制。依第7點保留①～③、未加 wrongCarry／教師重置選項／延續訊息。替代方案為另案先保存伺服器專用答案特徵於既有課程文件，再用既有讀取比較；不追溯舊同步。本次題庫同步流程與學生 progress 無變更。
- 驗收證據：`docs/PRACTICE_MODES_1.7.0_ACCEPTANCE.md`，16張1280／390截圖，實際 React／Student 操作與 callable 行為測試；沒有連正式資料、push 或部署。Excel 既有未提交修改未碰、未加入提交。

## 1.6.5 後台學習活動編輯改善（2026-10-03，Claude）

- 活動標題列直接顯示類型與「必做／選做」標籤；未手動設定者標「（依類型）」。「學習活動」標題下顯示必做／選做數量。
- 「新增活動」改為先跳出視窗：必選課前／課堂／課後，選類型；互動教材可直接選資訊圖表，名稱、網址、紀錄方式、節點數、題數自動帶入（名稱去掉結尾「圖卡」）；可指定必做／選做。新活動插在同階段最後並自動展開。
- 進入單元時活動預設全部收合，依課前／課堂／課後分組顯示數量；上移／下移限同階段內；清單上下各有「新增活動」。
- 既有活動改選「教材版本」時，名稱為「新活動」、空白或上一份教材的自動名稱才換成新教材名稱，教師自訂名稱不覆蓋。
- 只改後台畫面（`src/activityEditing.ts`、`App.tsx`、`style.css`）；資料格式、學生端、完成度不變。新增 `tests/activity-editing.test.ts`。

## 1.6.4 心臟II C1–C7 複驗修正（2026-10-03，Codex，未部署）

- feature/cardiac-output-visuals／基底 f589505：六份 34 節點改三條不同重點與具體判讀，僅依 STAGE1 規格／既有教材；137 筆逐句對照待 Claude 醫學複核。新增共用正規化去重驗證、回歸測試及 21 份學生教材／15 kit 來源稽核。
- 主動脈全段與弓原創加粗紅漸層、淺灰未選段、黑點虛線／括號、左右冠狀動脈，三處動脈紅一致；修正弓引線／淡框、脈搏與右頭臂靜脈標籤；手工電性卡片解除桌面高度截斷。
- 題目／選項／答案／預測、所有 ID 與 Excel 不變；電性只改 CSS，SDK／完成度不動。check 120／19、兩端 build、version:check 過；129 節點、26 張指定與 22 張標準截圖、用語／草稿 0、逐位元結果見 docs/HEART2_C_REVIEW_ACCEPTANCE.md。未 push／部署，交 Claude 複驗。

## 1.6.4 心臟II 與合併單元 Claude 複驗修正（2026-10-03，Codex，未部署）

- 基底 e86761f／feature/cardiac-output-visuals，完成 A1–A10（含 A9）、M1，及先前必修 1／3／4、建議 5–8。原創共用解剖圖／肝門放大圖／主動脈立體分段與弓；修正高亮、標籤、脈搏、股血管。心輸出量四長條、拔河、水管、公式樹、兩週期電位與接力棒改善，六預測選項與 answer 改教師指定並洗牌。
- 節點／題目 ID、正式題目內容、Excel 不變；教師另授權兩條路徑顯示文字與主動脈弓誤解句。手工電性只有視覺常數改動，追蹤全保留；新點選不送 CourseLearning、不改完成度分母。
- M1 預覽辨識已發布版本仍有次單元，明確提示先發布、停用確認，補 callable／React 測試；流程同步→發布→合併，保留原進度遷移與權杖保障。
- npm run check：119 前端／19 Functions、兩端 build、version:check 全過；390／1280 指定截圖與六份完整作答、用語／草稿掃描 0、逐位元結果見 docs/HEART2_REVIEW_ACCEPTANCE.md、docs/HEART2_REVIEW_VERIFY.json。交 Claude 複驗，未 push／部署。

## 1.6.4 合併空單元與學生完成紀錄遷移（2026-10-03，Codex，未部署）

- 空單元可選目標、預覽活動／人數並確認；教師 mergeChapter transaction 合併草稿與發布版設定／活動（目標優先、同 ID 不重複），搬移全體學生精確活動鍵，舊 key 保留、已完成不降級。研究／診斷不動，新增合併操作紀錄；預覽設定／學生變動須重確認，未保存不能合併。
- 補實際 callable 與 React 操作、部分／已完成進度、目標既有完成、去重、權限、班級設定與完成度測試；check 119／19、兩端 build、version:check 全過，版本維持 1.6.4。報告 docs/CHAPTER_MERGE_1.6.4_ACCEPTANCE.md，交 Claude 驗收，未操作正式資料，未 push／部署。

## 1.6.4 全身主要動靜脈原創解剖底圖（2026-10-03，Codex，未部署）

- 追蹤、脈搏及 overview 共用原創 SVG，補胃的肝門循環放大圖、高亮／重播／減少動畫支援，取代心臟II 必修 2。content.json、Excel、其他教材逐位元不變，14 張截圖及兩寬度完整作答通過；check 117／18 與 build 通過，用語／草稿掃描 0，報告 docs/MAJOR_VESSELS_ANATOMY_ACCEPTANCE.md，交 Claude 複驗。未 push／部署；合併單元追加工作接續處理。

## 1.6.4 後台單元／次單元選單（2026-10-03，Codex，未部署）

- 題庫管理及題目分析採 ChapterUnitPicker 共用兩層選單，單元順序同看板；切換重設第一個次單元並清空已載入資料，非同步舊結果不覆蓋新選擇。報表保留全部，研究資料下拉依單元分組；未改資料結構／後端功能／完成度。
- 所有版本檔同步 1.6.4；新增真實 React 元件操作及空單元／舊課程測試。check 117 前端／18 Functions、兩端 build、version:check 全過；報告 docs/CHAPTER_UNIT_PICKER_1.6.4_ACCEPTANCE.md，待 Claude 驗收。保留 Claude 同時新增的圖像複驗修正待辦，未 push／部署。
- handoff 移出重複的教師六點修訂與第一階段已通過驗收紀錄（2026-10-02）；原實作與驗證詳先前本檔紀錄及相關驗收報告，教師部署後待辦保留。

## 心臟II 圖像化改版（2026-10-03，Codex，平台 1.6.3，未部署）

- 新分支 feature/cardiac-output-visuals（基底 f0f9028）完成兩份視覺規格；共用 factor-tree／bp-cuff／extras／misconceptions 與 widget 預測修正。四份 kit preview 重建，手工電性新增三圖；主要靜脈補畫及指示端點必修完成。
- 題目與 ID／原預測／Excel 保留，其他教材與目錄不變；114 張指定截圖、四份標準 shots、10 組完整流程及既有手工回歸通過，check 115／18 與兩端 build 全過；台灣用語／草稿標記 0。報告 docs/HEART2_VISUALS_ACCEPTANCE.md，待 Claude 驗收與教師看畫面；未 push、未部署。

## 台灣用語交辦再次核對（2026-10-03，Codex，未部署）

- 開工確認 `feature/stage1-supplement` 乾淨，1–5 項已由 `33e7700` 完成；重新驗證 43 詞零命中、六份回饋 12 組畫面、題目 ID／答案保留與 Excel 指定 10 格換詞，其餘 5,396 格及其他 ZIP parts 不變。
- 重跑 `npm run check` 全過；更新 handoff 明確標示實作 commit 與待 Claude 複驗。未 push、未部署。

## 台灣用語與預測回饋（2026-10-03，Codex，平台 1.6.3，未部署）

- 依固定決策 23 統一心搏量、網路、點選，來源／SVG／ECG／手工提示與 aria-label／整理表同步；六新教材預測答對回饋改教師指定說明句；產生腳本保留修訂。
- Artifact Tool 產生／重新匯入驗證新值，再精準替換原 OOXML；題庫僅 163／164／169 列共 10 格換詞，其他 5,396 格及所有其他 ZIP parts 不變。題目 ID／正解代碼不變、43 詞掃描 0；前後測扁桃體保留待決定。未追蹤 coagulation 僅本機提示換詞，不 commit。
- npm run check 全過（115 前端、18 Functions、兩端 build、version 1.6.3）；六預測 12 組視窗與兩 SVG 材料共 40 張檢查通過；原 161 題不變，新 66 題／教材一致。報告 `docs/TAIWAN_TERMS_ACCEPTANCE.md`，待 Claude 複驗，未 push／部署。

## 六點修訂後兩項必修與配色（2026-10-02，Codex，平台 1.6.3，未部署）

- 清除血型、微血管交換、主要血管草稿註記，同步規格與來源；26 份整理表按句去重、補 ABO 四型，改產生程式避免重建復發。手機隱藏無額外資訊的欄位。
- 21 份學生版依同單元拉開色相，同單元最低 50°，指定三組 60°／30°／90°；21 份無法在 360° 色環全體兩兩 ≥25°，跨單元未達組合明列報告，不宣稱全體達標。
- npm run check 全過（115 前端／18 Functions、兩端建置、version 1.6.3）；26 表／157 列與 52 組視窗檢查通過，草稿關鍵詞 0、題目／答案／ID／Excel 未變。驗證 `docs/SUMMARY_REVISION_ACCEPTANCE.md`，待 Claude 複驗，未 push／部署。

## 教師六點教材修訂（2026-10-02，Codex，平台 1.6.3，未部署）

- 補心輸出量的心臟交感節後 NE／副交感節後 ACh，與腎上腺素內分泌來源區分；血壓補 ANP／BNP 排鈉利尿、血容量與回心血量因果鏈、ADH／醛固酮保留方向。紅血球 EPO 流程改 4 個完整獨立 SVG 與手機箭頭、負回饋。
- 15 kit＋11 手工資訊圖表固定不同配色並加重點整理表；手機逐列卡片。情境預測明確正誤文字及樣式，移除 kit 色系選單。回歸發現電性教材節點可被捲出頂端，已修正。課程介紹、前後測、coagulation 不變。
- 完整 check 通過（115 前端／18 Functions、兩端 build、version 1.6.3），52 組新畫面檢查、110 張截圖；14 kit＋4 手工完整作答／追蹤回歸。所有題目／節點 ID 與題目內容不變，Excel 逐位元不變。報告 `docs/LEARNING_REFRESH_ACCEPTANCE.md`；待 Claude 驗收，未 push／部署。

## 第一階段部署前小修 3：血管譯名（2026-10-02，Codex，未部署）

- 依教師決定統一「頭臂動脈」，同步 major-vessels 內容、兩張 SVG、產生程式及規格，重建 v1；專案文字搜尋舊譯名零筆。前兩項名稱／標題修正維持。
- Artifact Tool 產生新值，精準保留原 XML：只改題庫第 196、204 列 I／O／P／Q／R／S 的 12 格；其他 5,394 格、說明頁、格式及 ZIP parts 完全不變。前 161 題與新 66 題／教材一致性再次通過。
- npm run check 全過（115 前端／18 Functions、兩端 build、版本 1.6.3）；major-vessels 390／1280 截圖 20 張通過，最小字 15.22px、無裁切／溢位／錯誤。交接已改待 Claude 複驗，未 push／部署。

## 第一階段部署前小修 1、2（2026-10-02，Codex，未部署）

- ECG title／label／目錄改「心電圖基礎」；cardiac-output 節點 3 圖標題改「前負荷與」／「Frank-Starling 定律」兩行，產圖程式同步；兩份重建 v1。協作期間程式由 Claude 的 01f7256 收錄；本次補驗證／交接，不重寫歷史。
- npm run check 全過（115 前端／18 Functions、兩端 build、version 1.6.3）；cardiac-output 390／1280 截圖 20 張通過，390 標題 16.6px／最小字 15.22px、無裁切；ECG 畫面名稱確認。Excel 逐位元不變。待 Claude 複驗，未 push／部署。

## 第一階段補齊教材（2026-10-02，Codex，平台 1.6.3，未部署）

- 從已提交的 1.6.3 `f7b97a7` 建 `feature/stage1-supplement`，一併納入 Claude 規格。完成 6 新 kit（36 節點、66 題、42 張 SVG）及 preview／shots／build 登錄；電性活動、紅血球草稿複製上平台並保留教學資料／既有題目 ID，補追蹤及複習重試 gate。ECG 與兩草稿 SVG 調整字級／排版，使 390px 字達 12px。
- Artifact Tool 增列題庫第 163–228 列，227 題；前 161 題 3,864 格與 162 列原 XML 零變動，66 新題與規格／公開 HTML 一致；說明頁只更新合計、附加來源。
- npm run check 全過（115 前端／18 Functions、兩端 build、version:check）；9 份 × 390／1280 共 18 情境及 188 張截圖，追蹤／通關／錯題複習／捲動與無溢位通過。報告 `docs/STAGE1_SUPPLEMENT_ACCEPTANCE.md`。
- 待 Claude 驗收：規格 4 項教師決策原文保留；RBC 原稿肝素錯誤選項、血液檢查情境未自行刪改。未 push／部署，不動 main、RTF、coagulation。部署後教師同步 Sheet 新 66 題、建立心臟II 及各單元活動。

## 1.6.3 — 知識節點就地展開與手風琴（2026-10-02，Codex，未部署）

- 從 790e78f 建 hotfix/1.6.3-node-detail。共用 kit 精簡卡片，詳細內容插在點擊卡片所在列之下、桌面跨整列；同時僅開一節點，平滑捲動保留標題，底部收合及答錯複習共用邏輯。首次 explore／關閉 nodeTime 不變。
- 依教師授權以 materials:build 覆寫五份已上線與四份未發布 kit v1；九份內嵌內容、圖解、ID 完全不變，手工教材及題庫 xlsx 逐位元未變；版本同步 1.6.3。
- npm run check 全通過（前端 115／Functions 18、兩端建置、版本檢查）；九份 × 390／1280 的 18 組實際 HTML 互動與追蹤驗證通過，72 張截圖。檢查與截圖結果見 docs/NODE_DETAIL_1.6.3_ACCEPTANCE.md；待 Claude 驗收，不 push、不部署。

## 1.6.2 部署前合併（2026-10-02，Codex，未部署）

- 在 hotfix/1.6.2-student-name 以一般 merge 合併 codex/blood-vessel-infographic（aabb2d2）；僅 handoff.md 衝突，保留雙方最新狀態與固定決策、移除過期待辦。README／開發紀錄自動合併，版本統一 1.6.2。
- 合併驗證：npm run check 全通過（前端 115／Functions 18、兩端建置、版本檢查）；題庫及公開 HTML 與教材分支逐位元相同、原 106 題逐格不變；學生端姓名及五份教材 Chrome 390／1280 預覽通過。五個 html RTF 草稿及 coagulation-v1 未納入。
- 教師已核定五份畫面及內容（Bainbridge 保留補充不出題、MAP 120／80），Claude 已驗收姓名、五份教材及題庫；交 Claude 做部署前最後確認。

## 1.6.2 — 已完成單元卡顯示學生姓名（2026-10-02，Codex，未部署）

- 從 `hotfix/1.6.1-quiz-scroll` 建立 `hotfix/1.6.2-student-name`。bootstrap 每門課回傳本人名冊姓名，空白時使用 Google 名稱，再無則空字串；相容舊 roster，不回其他學生姓名、不新增資料庫讀取。
- 完成／逾期完成卡在狀態下方顯示中性姓名標籤；教師預覽顯示「預覽學生」，未完成不顯示。修正超長姓名撐寬卡片，選看單元須確實完成才顯示（不改完成度算法）。
- 同步版本 1.6.2；前端112與Functions18測試、兩端建置、版本檢查通過。390／1280三種狀態含最大字級12張截圖與4個邊界測試通過。報告 `docs/STUDENT_NAME_1.6.2_ACCEPTANCE.md`；已 commit，待 Claude 驗收，未 push／部署。

## 循環主圖驗收附帶小修（2026-10-01，Codex，未發布）

- 在 `codex/blood-vessel-infographic` 工作樹完成Claude交辦3項修訂：肺動脈淡化完整、冠狀動脈文字／外緣路徑、線字避讓。390px主圖最小13.28px；26張截圖、淡化與幾何驗證、108前端測試及建置通過。已更新工作樹第三輪報告，待小修複驗及教師核定；未登錄／commit／push／部署。

## 三份生理教材預覽（2026-10-01，Codex，未發布）

- 在 `codex/blood-vessel-infographic` managed工作樹完成血壓調控、淋巴系統、血液動力學三份獨立預覽；各6節點與11題、21张SVG，390px主圖最小14.94px、節點16.47px。108前端測試、建置、60張截圖與互動驗證通過；來源修訂与複核限制見該工作樹 `docs/PHYSIOLOGY_MATERIALS_PREVIEW.md`。未登錄／commit／發布。

## 五份資訊圖表登錄與題庫補登（2026-10-02，Codex，未部署）

- 依教師核可執行五份 materials:build，登錄 shared/materials.ts 並更新 README；公開 HTML 全部帶入目前 kit。每份 6 節點、6 先備＋5 情境，85 個節點／題目 ID 與來源、目錄一致。
- Excel 僅增列 55 題，總計 161；原 106 題 2,544 格與原始列 XML 不變，新題／選項集合／正解與公開 HTML 全數一致。選項打散，答案代碼／Zuvio 序號同步；含傳統及①～④引導式解析、來源連結。說明頁僅更新合計與附加來源。
- 五份 390／1280 公開 HTML 實測無錯誤／溢位，explore 各一次、複習後重試、最後答對直接關頁仍送 complete；各 20 張截圖。111 前端測試及建置通過；六份其他 kit 回歸亦通過。報告 `docs/MATERIALS_REGISTRATION_ACCEPTANCE.md`。本輪 commit 收錄先前核可的來源／圖解／kit 修正，未 push、未部署、未改 coagulation-v1。

## 三份新生理教材12項驗收修正（2026-10-01，Codex，未發布）

- 完成共用kit最後答對立即complete／結果呈現去重、三份內容與頁首／出處／繁體整理、血壓case-5換題、MAP120／80、淋巴3張圖解及中線回流／箭頭避讓、層流擾流對照與粗管標籤避讓；ID不變。詳見 `docs/PHYSIOLOGY_MATERIALS_PREVIEW.md`。
- 390／1280無錯誤／橫向溢位；390主圖最小14.94px、18節點各16.47px；12完整互動流程、其他6份kit記憶體回歸、24檔繁體掃描、110前端測試與建置通過。已驗收血管／循環及Excel雜湊不變；未登錄／commit／發布，交回Claude驗收。

## 循環主圖第三輪驗收附帶小修（2026-10-01，Codex，未發布）

- 完成3項交辦：整條肺動脈納入pulmonary群組並避開右心室文字；冠狀動脈文字改為「分布到心肌」，路徑沿心臟外緣，不穿心房；心房至心室箭頭保留於標籤間空隙。
- 重建circulation-routes預覽與20張390／1280截圖，另6張主圖裁切圖；新增幾何／淡化回歸脚本及JSON，3狀態肺動脈opacity為1／0.18／0.18、零線字交疊／文字裁切，390px主圖最小13.28px。108前端測試、建置通過。待複驗及教師核定，未登錄／commit／push／部署。

## 血壓調控／淋巴系統／血液動力學獨立預覽（2026-10-01，未發布）

- 教師追加三份 NotebookLM 初稿，整理為各6節點＋6先備＋5情境，新增21張SVG與三態情境圖；保留來源快照。增加新教材 opt-in 字級／色系、答對解析、全對通關訊息與整關重試洗牌。醫學初稿修訂及來源限制詳見 `docs/PHYSIOLOGY_MATERIALS_PREVIEW.md`。
- 前端108／108、建置、三份各20張390／1280截圖與互動事件驗證通過；390px主圖所有情境最小14.94px、展開節點16.47px。未登錄、未commit、未發布，待教师／Claude驗收。

## 血管／循環路線預覽第三輪修正（2026-09-30，未發布）

- 重畫 14 張 SVG 與第三輪指定構造／路線，改為 400 寬直式圖；390px 主圖最小 13.28px、各節點 14.64px。截圖工具增加實際縮放字級與裁切紀錄。前端測試 108/108、建置與兩份各 20 張截圖通過。詳見 `docs/BLOOD_CIRCULATION_ROUND3.md`，待 Claude／教師複驗，未登錄、未 commit。

## 1.6.1 — 隨堂診斷按鈕捲動修正（2026-09-29）

- 教師手機實測：心臟構造教材按「兩階段隨堂診斷」後畫面不動，題目在下方，學生會以為按鈕沒反應。`heart-structure-v2`、`cardiac-cycle-v2`、`cardiac-conduction-v2` 與對應 `html/` 來源，切換到隨堂診斷後捲到題目區（比照 `coronary-circulation-v1` 既有做法）。只改互動，不改教材文字、題目與 ID，故沿用原版本路徑。

## 1.6.0 — 學習進度一目了然（2026-09-29，已上線）

- 第二輪依 `docs/PROGRESS_UI_1.6.0_ACCEPTANCE.md` 按 A → B → C 修正：新增完成度公式 v4（只計必做且已發布分類，v3 原樣保留）、統一首頁／正式完成度／舊活動鍵、排除鎖定待辦，補回複習考與定位回練習。
- 首頁展開明細加入分類完成收合、活動依課前／課堂／課後分組與線條狀態圖示；練習列補分數差距、完整測驗次數、手機雙按鈕與單一展開選單。正式資料唯讀比較 101 份 progress：v3→v4 影響 0 位學生／0 個單元。
- 補齊模型、介面與 Functions 完整閃卡不寫 `passedAt` 測試；桌機首頁收合／展開、桌機練習、手機選單截圖存於 `docs/progress-ui-1.6.0-screenshots/`，390px 實測無水平溢位。未 push、未合併、未部署。
- 第一階段：新增活動 `required?: boolean` 覆寫（未設定沿用原推導）、共用的進度狀態彙整函式、完整測驗次數；只有完整測驗更新最高分與通關，完整閃卡仍記錄練習、錯題與看過題數，既有閃卡分數不回算。
- 學生首頁仍只讀既有的一份 progress 文件，新增 Firestore 讀取為 0。
- 完成首頁待辦列、必做／選看卡與展開明細；單元練習頁改成必做／選做分區、計分與練習分組按鈕，並完成窄版直向排列驗證。三個 commit 均先跑 `npm run check` 與 `git diff --check`；未 push、未合併、未部署。

## 教材 — 心臟構造圖像強化版 v2（2026-09-25，Codex）

- 依 `docs/HEART_STRUCTURE_V2_SPEC.md` 建立未發布的 `public/materials/heart-structure-v2/`，複製瓣膜血流圖資產，並同步 `html/心臟構造.html`；目錄新增 v2，`materials:sync` 更新 README。
- 情境實驗室窄版改橫向 scroll-snap；六個知識節點改選一顯示、分類篩選與行動版回捲；SVG 最小字級 12px。SDK 在 inline script 前載入，節點探索只由點選觸發；修正解析前綴與錯題回讀 ID 對應。
- Playwright 390／1280 實測無錯誤、無橫向溢位、資產載入、六節點 explore、11 題全對只完成一次與錯題 q04→node06；`npm run check` 通過（前端 100、Functions 15）。驗收報告與截圖在 `docs/HEART_STRUCTURE_V2_ACCEPTANCE.md`、`docs/heart-structure-v2-screenshots/`。
- Excel 題庫與既有凍結來源的題幹序號、選項排列、提示及兩處解析有既有差異；依規格未更改內容，留待教師／Claude 決定。未 push、未合併、未部署。
- 第二輪改為與 `cardiac-conduction-v2` 相同的「閱讀提示、六張文字導覽卡、單一主圖大卡」結構；主圖依節點與舒張／收縮切換，窄版點選後捲到大卡，解說區具 aria-live。390／1280 實測無錯誤／溢位，最小 SVG CSS 字級 12px，`npm run check` 通過；待 Claude 驗收。

## 1.5.1 — 學生練習計分說明（2026-09-23）

- 起因：學生反映做了練習，練習分頁卻顯示「最高分 -1」。-1 是「尚無完整作答」的內部值（抽題、錯題、綜合練習不更新最高分），學生端直接顯示出來；教師端原本已處理。
- 學生練習分頁（一般分類與複習考）未完整作答時顯示「最高分 尚未完整作答」。
- 抽題（第 1 題與成績頁）、錯題閃卡、綜合練習顯示提示：「這是練習，不計入最高分與達標。要取得成績，請按完整測驗或完整閃卡並做完全部 N 題。」
- 只改學生端顯示，不動計分與後端。自 `origin/main`（1.5.0）開 `hotfix/1.5.1-practice-hint`，cherry-pick `feature/material-kit` 上的兩個提交；`feature/material-kit` 之後須併入新的 main 才能部署。
- 驗證：Mac 上以乾淨 `npm ci` 跑 `npm run check`。

## 教材草稿 — 心臟的電性活動（2026-09-25）

- 以既有 `html/心臟電性活動.html` 草稿重建完整 HTML 架構，移除末尾混入的題庫表格文字；不再限六節點，改用 9 個循序節點串起正常電傳導、細胞分工、心室動作電位與基本 ECG 對照。加入單張主圖、圖下解說、情境實驗室、閱讀提示與兩階段（6＋5 題）診斷；只涵蓋正常生理與生活情境，不作疾病判讀。新增 9 個 explore、11 個 answer、全對才 complete 的追蹤與 metadata。Chrome 390px 實測 9 節點、題目切換、無頁面錯誤或橫向溢位；未登錄、未 push、未部署。
- ECG 對照節點改為 P／PR、QRS、ST、T 時間軸與四張心臟事件卡（窄版 2×2）。後續以 390px 實測時間軸顯示、11 題全對通關與控制台；無橫向溢位或錯誤。
- 互動體驗補強：桌面節點與解說改雙欄 sticky、行動點擊節點回捲主圖；情境實驗室新增 1.2 秒自動播放／暫停與回到第一步；預測題加入正誤狀態與鎖定；ECG 卡片窄版改水平 snap 捲動；第二關本輪任一錯誤即顯示對應節點的直達復習鈕。以 390px／1280px 實測上述流程，無控制台錯誤。
- 題目選項統一為四選一：教材的預測題與 6＋5 題診斷均補足四個選項，並將相同 11 題（含正解與解析）新增至 `html/資訊圖表題庫_上傳用.xlsx` 的「心臟的電性活動」分類；說明頁題數更新為 106。移除教材頁尾「教學範圍」句子；實測所有題目均為 4 選項、無控制台錯誤。

## 驗收 — 三份心臟圖像強化教材（2026-09-25，Claude）

- `cardiac-conduction-v2`、`cardiac-cycle-v2`、`coronary-circulation-v1` 以 Playwright 390／1280 實測：無錯誤、無橫向溢位、圖檔皆載入、explore 每節點一次、第二關全對才送 complete。修正冠狀循環頁（與 `html/心臟血液供應.html`、`html/心臟構造.html`、`html/紅血球的恆定機制.html`）載入即顯示通關／未通關橫幅的 CSS。
- 教材工作室：新增 `/api/version`；`.command`／`.app` 啟動器發現程式檔比執行中服務新就自動重開（修正教師匯入時沿用舊稽核邏輯的問題）。

## 教材視覺優化 — 心臟傳導系統與心動週期（2026-09-24）

- 教師驗收後建立新、未發布的本機教材版本：`cardiac-conduction-v2`、`cardiac-cycle-v2`、`coronary-circulation-v1`；保留既有 v1，不覆寫。三份已登錄 `shared/materials.ts`、同步 `public/materials/README.md`，並將所有圖檔複製到各自版本目錄。前兩份補上 CourseLearning 節點探索、逐次作答與通關追蹤，以及固定 `material-ids` metadata。`materials:sync` 稽核確認三份各有 6 節點、11 題、`course-learning.js` 與 `.complete()`；Chrome 實點圖像、解說及冠狀灌流診斷跳題均通過，`npm run check`（前端 99、Functions 15）通過；未 push、未部署。
- `html/心臟血液供應.html` 同步重構為六選鈕 → 單張等比例冠狀循環圖 → 圖下完整解說；選項上方的閱讀提示於點選時浮動三次，並移除分散閱讀的篩選列與詳細卡重複呈現。新增 4 張 ImageGen 生成的無文字 3:4 醫學圖（總覽、LCA 分支、舒張期灌流、粥狀硬化）至 `html/assets/coronary-*-v2.png`；Chrome 實測 6 個節點、390／1280px、無橫向溢位與頁面錯誤。修正三頁既有多格圖的切換位移，改由 JavaScript 直接設定位移，避免 CSS 計算式造成相鄰圖格混入。
- 再修正心臟血液供應頂端情境實驗室：四格流程圖原先以固定橫向高度顯示，導致原始 3:4 圖格被壓扁；改為 `aspect-ratio: 3 / 4` 與等比例背景裁切，桌機與手機均無變形或水平溢位。
- 「兩階段隨堂診斷」切換後會在面板顯示完成的下一個畫面捲至第一題題幹，避免學生停留在模式切換鈕而看不到題目；Chrome 實測題幹位於畫面頂端、無錯誤。
- 教師選用「向下閱讀」動畫提示：學生實際點選任一節點後，選項列上方的箭頭與提示文字會向下浮動三次，接著保留靜態提示；不觸發自動捲動，且遵守減少動態效果偏好。兩頁 Chrome 實測按鈕、圖片、解說與提示均同步更新，無頁面錯誤。
- 教師選定版型 1 後，兩份互動資訊圖表統一為「六個節點選鈕 → 對應單張主圖 → 緊接完整解說」的單一閱讀區；隱藏篩選列與重複詳細卡，選取狀態、圖像與解說同步更新，不再自動捲動。以已安裝 Chrome 在 390／1280px 實測兩頁所有六個按鈕，無水平溢位、頁面錯誤或文字空白；未 push、未部署。
- `html/心臟的傳導系統 I.html` 新增四格傳導路徑情境圖（竇房結、房室結延遲、希氏束、浦金埃氏纖維）；`html/心動週期.html` 新增四格瓣膜／血流時相圖（充血、心房收縮、等容收縮、射血）。兩組無文字醫學圖由 ImageGen 生成，存於 `html/assets/cardiac-*-flow-strip-v1.png`，桌機橫排、手機改直式。
- 驗證：Playwright 在 390px 與 1280px 載入兩頁，無水平捲動及頁面錯誤；`git diff --check` 通過。未 push、未部署、未匯入教材工作室。
- 後續排版與互動修正：兩頁頂端節點卡改用可換行的 HTML 標題／說明，隱藏 SVG 內易溢字的文字；點選任一節點會切換並高亮情境實驗室主圖，再捲動至對應詳細卡。心動週期的等容舒張期保留提示，指向下方的四瓣膜詳細圖。390／1280px 點選所有代表卡驗證通過。
- 圖像比例修正：四格橫圖不再用 `background-size: 400% 100%` 強制拉伸；改為 3:4 等比例裁切元件，縮圖與主圖都顯示完整心臟單格。Playwright 截圖人工檢視、390／1280px 互動與無溢位檢查通過。
- 全面文字巡檢：兩頁所有詳細卡 SVG 的內嵌文字一律隱藏，避免長句在 SVG 固定座標中互相覆蓋；完整文字保留於每張卡的 HTML 概念段落、重點清單與臨床框。以 390／768／1280px 檢查無可見 SVG 文字、無橫向溢位與頁面錯誤。
- 互動修正：點選心動週期或傳導系統節點時不再自動捲到下方詳細卡，確保剛切換的主圖留在畫面中；以頁內原生 click 驗證主圖更新且 scrollY 不變。
- 修正回饋：恢復詳細 SVG 圖內標示文字；每頁新增「所選項目解說」區，點選任一期別／節點即在主圖下方呈現該詳細卡的概念、重點與臨床說明。驗證六張節點卡可更新圖片與解說，且分類篩選與「全部知識節點」均正常運作。

## 修正 — 教材工作室啟動器（2026-09-24）

- `.command` 與 `.app` 啟動器現在都明確載入 `~/.nvm/nvm.sh`、選用 Node 22.23.2，修正使用 bash 或 macOS GUI 環境時 `npm: command not found`。驗證 Node v22.23.2、npm 10.9.8、兩個 shell 腳本語法與 `git diff --check` 通過；未 push、未部署。
- 若 5183 已有健康的本機工作室，兩個啟動器會改為直接開啟既有服務，避免第二次啟動顯示 `EADDRINUSE`。
- 匯入區新增點擊選檔與拖放 HTML 檔案，讀取後只填入程式碼欄並更新預覽；使用者仍須按匯入才會寫入本機教材檔案。驗證工作室頁面含新控制項與 `git diff --check` 通過。

## 教材 — ECG 模擬器與標示題、心臟傳導系統、心動週期（2026-09-24，未發布）

- Codex 初版（未 commit）驗收不通過：頁面 SyntaxError 整頁空白、模擬器無動畫、標示題拖曳換算錯誤、kit 移除圖／ARIA／nodeTime（`docs/ECG_SIM_LABEL_ACCEPTANCE.md`）。
- Claude 依 `docs/ECG_SIM_LABEL_SPEC.md` 完成：kit 可讀化與擴充點（lab widget、題型）、Fisher–Yates、`explore` 僅首次、`data-state` 狀態切換；`materials-src/widgets/` 四檔；`ecg-basics-v1` 重建；截圖流程改為錯誤／空白即失敗。
- 新增 `cardiac-conduction-v1`、`cardiac-cycle-v1`（題目來自教師題目集單元一、二）與 4 張自繪 SVG。
- 驗證：`tests/ecg-model.test.ts`＋`tests/material-kit.test.ts` 10/10、四份教材截圖 0 錯誤、ECG 互動驗收 390／1280 通過。未 push、未部署。
- 教師試用回饋修正：三份教材的知識節點改為每節點專屬示意圖（原本共用同一張，ECG 節點 5 的節律圖在圖片模式下全黑）；模擬器新增即時狀態列（這一拍心率、呼吸相位、自律神經調整中）；標示圖層移入放大檢視。

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
