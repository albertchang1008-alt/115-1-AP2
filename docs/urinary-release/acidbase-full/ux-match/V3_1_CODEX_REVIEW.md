# 給 Claude 的摘要
- 依CODEX_TASK_acidbase-matching-ui_2026-10-21.md；基底ddab3e5，codex/acidbase-full，本輪commit見git log -1。
- 第1／3關改角色→說明逐列選單、首次三步實作引導、略過／重看、明確交換／取消及保留正確列。
- 全組檢查後才亮圖／長心智圖枝；按下一步才出後續動作②或確認題，未預選或逐列洩答。
- 學生腳本v3.1：只改版本及兩處動作指示，檔尾列原句→新句；題目／提示／回饋／選項未改。
- 檔案：student.js／student.css／student-script.mjs、Player.tsx／matchingGuideScope.ts、腳本及9份README、檢查器與測試。
- PASS：v3.1 SCRIPT_DIFF 146單元、69引句，缺0／異文與多字0；指定28張畫面通過，0頁面例外。
- PASS：教材39／39，平台前端163／後端61，0 FAIL／skip，版本與build通過；八尺寸632／632 PASS。
- 偏離：為落實帳號隔離，父頁額外傳入本機隨機opaque guideScope；不含uid／姓名／學號／信箱，不新增雲端資料。
- 第2關分數上下格也有配合性質，依交辦只列出未改；結尾是逐題判斷，沒有配對需改。
- 抽查1：390x844-N01-guide1／guide2／guide3.png，首次引導確實由學生點選。
- 抽查2：1280x800-N03-exchange.png，交換前後與取消不暗改答案。
- 抽查3：390x844-N01-retry-wrong-rows.png、correct.png，固定正確列與通關前後。
- 抽查4：SCRIPT_DIFF.txt／json與v3.1變更表；tests/acidbase-matching.test.mjs保護非操作文字原文。
- 抽查5：matching-results.json／SHOTS.md、測試及layout原始輸出；待Antigravity新手試做配合題。

## 完成內容

本輪只改酸鹼第1關緩衝／肺／腎配三份工作，以及第3關三種緩衝配三個場所。配對每列以角色為主；點角色或說明欄展開相同的三段說明選單，選項無預選，顯示完成數，全部選完才啟用檢查。
選單順序洗牌並於該次作答保留；角色內容與各說明、題目、提示及教學回饋沿用原文。

每題第一次進入自動顯示三步引導：點角色→自行選說明→繼續完成並檢查。選擇是真實作答，不代填、不判定第一組正誤。可略過，亦可點操作說明重看；完成／略過後同一引導namespace與同題不再自動顯示。

已用說明標出目前配給的角色，選取時先出「交換兩列／取消」，未確認前不改原答案。檢查時統一顯示原回饋與錯誤列，正確列固定、其說明不再能被錯誤列取走。只修改錯誤列後再檢查。
全對後圖上三區亮起、心智圖長枝；仍須按下一步才出第1關動作②或第3關確認題，沒有跳過既有關卡及正式考核。

手機以緊湊三列及上方小對照圖呈現；桌面保留圖與作答區左右對照。844×390橫向將檢查按鈕與進度列並排，避免錯誤回饋擠到頁尾。

## 帳號隔離與隱私

既有教材iframe不接收身分資訊，無法自行辨認帳號；因此在平台端新增matchingGuideScope(uid)，以每帳號本機儲存的隨機UUID作namespace，隨既有init訊息傳給教材。
教材只接收父視窗送來且格式符合的opaque字串；不傳原始uid／姓名／學號／信箱，也沒有新增Firestore結構或請求。每題用獨立引導key保存完成／略過。
獨立樣張無登入帳號，使用preview本機namespace。瀏覽器禁止／清除localStorage時，引導可能再次顯示，不能保證跨裝置只顯示一次；這與教師核定「同帳號同裝置同題」範圍一致。

## 腳本與逐字檢查

docs/urinary-release/ACIDBASE_STUDENT_SCRIPT.md標為v3.1，新增檔尾v3.1變更表：第1關原「點一張卡，再點一個工作格。」改為核定指示；第3關新增同一動作指示。
保護測試對ddab3e5逐行比對，排除標題、這兩個動作行與變更表後，其他全文必須完全相同。
SCRIPT_DIFF用v3.1實際腳本SHA256，僅排除檔尾變更紀錄的歷史原句；不排除活動中的教學文字。教學單元由145增至146，是第3關新增動作①，非額外題目。
操作導覽、選單按鈕與進度等使用獨立interfaceCopy，記錄教師配合題規範來源與SHA，檢查器限制只能出現在第1／3關matching-ui容器；原過渡標題仍只許出現在過渡頁header。反例測試確認改字與亂加文字仍會FAIL。

## 驗證與證據

| 項目 | 結果 | 證據 |
|---|---|---|
| content-check | PASS，210 displayFields、772次原句核對，0錯誤／skip | content-check.json；logs/content-check.txt |
| v3.1 SCRIPT_DIFF | PASS，146單元、69引句、缺0、多／改0 | SCRIPT_DIFF.txt、SCRIPT_DIFF.json；logs/script-check.txt |
| 指定尺寸操作 | 28／28畫面，390×844與1280×800，頁面例外0 | 本目錄PNG、SHOTS.md、matching-results.json |
| 八尺寸layout-check | 632／632 PASS，0 FAIL／skip | layout/layout-results.json；logs/layout-check.txt |
| 教材測試 | 39／39 PASS，0 FAIL／skip | logs/material-tests.txt |
| 平台npm run check | 前端163／後端61 PASS，0 FAIL／skip；build／版本1.9.1 PASS | logs/platform-check.txt |
| 原有未追蹤證據 | 14件雜湊保護，測試改到7件後已還原 | PRESERVED_EVIDENCE.json |
| diff格式 | git diff --check PASS | 本輪實際輸出 |

指令均在.worktrees/acidbase-full、Node22.23.2下執行：

```sh
node scripts/apply-content-check.mjs materials-src/acid-base-homeostasis/full.json --cards '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge' --progress '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl' --out docs/urinary-release/acidbase-full/ux-match/content-check.json
node scripts/acidbase-script-check.mjs docs/urinary-release/acidbase-full/ux-match
node scripts/apply-layout-check.mjs materials-src/acid-base-homeostasis/full.json --out docs/urinary-release/acidbase-full/ux-match/layout
node scripts/acidbase-matching-check.mjs docs/urinary-release/acidbase-full/ux-match
node --test tests/apply-*.test.mjs tests/acidbase-*.test.mjs
npm run check
```

過程中完整回歸抓到結尾事件綁定引用錯誤，已修復並重跑39項全過；八尺寸也抓到橫向錯誤回饋擠壓檢查按鈕，修正後先獨立79狀態通過，再重跑完整矩陣。未略過測試或放寬文字／幾何門檻。

## 未改與交接

第2關HCO₃⁻／H₂CO₃配分數上下格也可視為配合題，但交辦只允許列出，因此維持原操作。結尾三題依序判斷，無配對需改。
9份學生腳本README新增將來配合題同規格說明；未實作其餘9份、未改知識卡reviewed、題庫Excel／Sheet、正式資料或發布目錄。
僅本機預覽與測試，未教材build／登錄／push／部署／合併。完成後#6h停-等Antigravity，新手試做配合題；本輪自我測試不能替代獨立新手試做。
