# 給 Claude 的摘要
- 本輪依15:47教師定位做第1–3項；第4項假圖重畫、任務門檻與舊句子排序更換均暫停。
- 十份110題盤點：2確定依圖、1待裁定、8文字自足但有媒介語氣；交11份草稿，原題一字未改、未補圖。
- 誘答過於明顯候選44題，逐列附原錯誤選項與人工理由，待教師判斷。
- 共用選項CSS加寬度限制、換行、字級放大與置中；第四凍結只含此修正及測試／格式更新。
- 原題66次修正前檢查未重現教師跑版；放大長公式壓力案例先紅後綠，不宣稱已重現同一成因。
- 共用40/40 PASS、0 skipped；兩樣張66原題＋6壓力＝72組PASS；實際文字行66組置中誤差<0.008px。
- 兩樣張內容檢查PASS；水鈉lab1280／390×3狀態6/6逐像素相同。
- 獨立酸鹼方案在DESIGN_PROPOSAL_CODEX.md：六節點、15題池、每輪3雙層、9合併稿；未讀對方方案。
- 偏離／未決：原跑版成因未重現；ADH較少反向推論及fluid-case-q03需教師核對；新設計未實作。
- 抽查5項：acid-case-q04草稿、fluid-foundation-q03、urine-case-q05、三寬度最長選項、酸鹼雙層題。

## 範圍及優先規則
工作位置為指定`.worktrees/apply9-codex`，分支`codex/apply9-redo`，從1998754接續。依最新決策，兩階段題屬獨立文字考核，因此不採用舊第1項「補圖」做法，也不新增「只要提圖就須有圖」的舊規則檢查器。先交改寫草稿，核定後才能套用；lab.predict保留學習角色及現有實驗室圖面，不入題庫。
第4項14張假圖沒有改；第5項被獨立提案取代，沒有產出NODE_INTERACTION_DESIGN.md，也沒有改動看圖門檻或現有句子排序。共同選項CSS適用套件所有使用者，本輪只生成電解質、腎臟構造兩份樣張供看畫面，沒有批次改八份教材資料。
已讀CLAUDE.md、handoff.md、AI_WORKFLOW_PLAN.md、CODEX_QUEUE.md及DECISIONS.md最後四條。未讀取DESIGN_PROPOSAL_ANTIGRAVITY.md。

## 交付文件
[需看圖題、11份草稿與44題誘答候選](</Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/FIGURE_DEPENDENT_QUESTIONS.md>)
[酸鹼獨立互動設計方案](</Users/HHC/Documents/ChatGPT/課程平台1.0/docs/urinary-release/DESIGN_PROPOSAL_CODEX.md>)
[110題完整原文、判定與來源JSON](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/question-audit.json>)
題目分類：D2題確定依圖；U1題保守交裁定；W8題雖用圖／模型／操作詞，但條件已足，可只看文字答；S99題未發現依圖缺口。不能用「圖」關鍵字數量當依圖題數，也不能把S／W自動當成已核准匯出。
11份草稿都有原題、原四選項與答案、草稿四選項與答案、判定原因及reviewed卡uid＋逐字原句。ADH較少原題已存在核定content，但現卡只明寫正向機轉，反向三項關係標為需教師確認。題庫既有列及原題JSON完全未動。
44題誘答候選是人工審稿建議，不是實測難度，也不據此推斷學生猜題。高優先39題、中優先5題；應以同層級可解釋迷思取代荒謬器官／單位或答案形式洩漏，但本輪沒有直接改這些原題。

## 選項跑版的實際發現與修正
修正前以現套件兩份原題在1280／820／390逐題操作66次，沒有量到按鈕超出容器或text-align不置中。教師看到的畫面與本機這個版本可能不同，本次沒有證據能指定同一根因。
另用測試專用長公式字串、font-scale=1.4檢查，1280即重現文字溢出。該字串只在測試DOM內，從未寫入教材題目或草稿。新回歸先FAIL，修正後PASS。
修改僅在apply-kit/learning.css：選項容器和按鈕設100%／max-width及min-width:0，文字可換行與overflow-wrap:anywhere；text-align:center及flex雙軸置中，最小按鈕高48px，選項字級使用font-scale。沒有改動learning.js、資料格式或通關條件。
修正後66次原題＋6個長公式／放大案例均不溢出；另以文字Range的每行實際邊界量測66次原題置中，最大中心差0.0078125px。截圖人工看過1280及390的最長選項，未切字；820同樣通過量測並附圖。

## 樣張與三寬度截圖
預覽是本機審查HTML，不是public輸出或教材build；原題尚未套用草稿，故仍可看到待核定的舊措辭。

| 樣張 | 本機預覽 | 1280最長選項／第二關 | 820最長選項／第二關 | 390最長選項／第二關 |
|---|---|---|---|---|
| electrolyte-balance | [course.html](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/electrolyte-balance/course.html>) | [最長](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/electrolyte-balance/longest-1280.png>)／[第二關](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/electrolyte-balance/cases-1280.png>) | [最長](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/electrolyte-balance/longest-820.png>)／[第二關](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/electrolyte-balance/cases-820.png>) | [最長](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/electrolyte-balance/longest-390.png>)／[第二關](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/electrolyte-balance/cases-390.png>) |
| kidney-anatomy | [course.html](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/kidney-anatomy/course.html>) | [最長](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/kidney-anatomy/longest-1280.png>)／[第二關](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/kidney-anatomy/cases-1280.png>) | [最長](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/kidney-anatomy/longest-820.png>)／[第二關](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/kidney-anatomy/cases-820.png>) | [最長](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/kidney-anatomy/longest-390.png>)／[第二關](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/kidney-anatomy/cases-390.png>) |

修正前原題（未重現的基準截圖）：
electrolyte-balance：[1280](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/before-electrolyte-balance-1280.png>)／[820](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/before-electrolyte-balance-820.png>)／[390](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/before-electrolyte-balance-390.png>)
kidney-anatomy：[1280](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/before-kidney-anatomy-1280.png>)／[820](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/before-kidney-anatomy-820.png>)／[390](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/before-kidney-anatomy-390.png>)

## 酸鹼獨立方案
只設計acid-base-homeostasis。總體原則一節約一頁；六節點每節點一列表格，各含目標、動作、圖面反應、解鎖文字、小檢核四選項、三個錯誤選項迷思與回饋、連回全貌及逐字來源。主線是「酸已被接住，為什麼仍要肺與腎？」。
第一關6題候選；第二關15題候選池＝五組各3題，每輪各抽1題，其中呼吸、腎方向、攜酸3題為答案＋理由兩層，兩層都對才算該題正確。9題雙層候選各附完整4選1合併版作題庫待審候選。列出兩層對／錯四種組合及回饋，不把答對理由錯標成猜題。
遊戲只保留六張關係卡及結尾修復；有提示、反機械連按、手機／鍵盤替代及reduced-motion設計。進度僅本機或既有SDK，不加平台欄位、公開排行或成績。沒有緩衝容量、代償速率或肺泡圖位依據的內容明列不實作；評估約6–9人日供教師選定後排程。

## 驗證與凍結
- 共用測試：40 PASS、0 FAIL、0 skipped；直接node測試，不用會觸發build的npm run check。
- 樣張選項：72／72（66原題＋6放大長公式）；另66次真實文字行置中通過。
- 樣張內容檢查：2／2 PASS（電解質529、腎臟591次逐字引用匹配）；原題完整紀錄與c8fb122一致。
- 水鈉lab像素：6／6相同；新CSS只在course選項，lab未改。
- 十份apply.json SHA全部與本輪起點相同；原content.json、PNG／SVG、JS互動及舊kit未改。
- 新增tests/apply-options.test.mjs；更新APPLY_FORMAT.md及FREEZE_MANIFEST.json為第四凍結。
- 酸鹼提案11段逐字引用全部卡frontmatter＋進度reviewed，15題池／9雙層／9合併稿結構自查通過。

證據：[紅燈](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/red.tap>)；[單獨綠燈](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/green.tap>)；[40項共用測試](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/shared-tests.tap>)；[原題修正前量測](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/before-options.json>)；[72組選項量測](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/after/options-results.json>)；[實際文字行置中](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/samples/text-centering-results.json>)
[電解質來源](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/electrolyte-content.json>)；[腎臟來源](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/kidney-content.json>)；[水鈉像素](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/water-parity/parity.json>)；[提案來源自查](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/design-source-check.json>)；[未改題保護](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/apply9-codex/docs/urinary-release/apply9-fix-round/protection.json>)

## 交Claude停點
請先核定11稿（尤其2題依圖、fluid-case-q03與ADH反向來源），再決定誘答修訂；另獨立審酸鹼方案及選擇互動形式。第四凍結只處理選項CSS，不表示新互動或假圖已完成。#6h停-等Claude；不build、不登錄、不發布、不push；handoff規則未改。
