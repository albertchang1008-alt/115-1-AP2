# 給 Claude 的摘要
- 基底 984cbdf；工作樹 .worktrees/acidbase-full，分支 codex/acidbase-full；本機 commit 見 git log -1。
- 已實作「丙」：操作／配合整步清空，確認題整關重來，結尾三格重來；先說明再顯示按鈕，每次重洗牌。
- 交換確認已改在該列下方〔交換兩列〕〔取消〕，沒有交換彈窗；取消不改答案。
- 腳本 v3.2；只修通用規則、版本及變更紀錄，各關題目／選項／提示／錯誤原句與正式兩階段考核不改。
- 檔案：student.js、student.css、student-script.mjs；ACIDBASE_STUDENT_SCRIPT.md、MATCHING_QUESTION_UI.md、scripts/_README.md；檢查器與測試。
- PASS：SCRIPT_DIFF v3.2，149 單元／69 引句，缺0、異文／多字0；content 210 欄／772 引句；8尺寸632畫面全部通過。
- PASS：教材42／42；npm run check 平台163／163、Functions61／61，版本與建置通過；三種重來、固定亂數仍換序、箭頭雙重設均驗證。
- PASS：重來18張、配合28張及橫向補查14張；既有182個未追蹤證據檔原位元組保留；偏離：無。
- 抽查1：strict-retry/390x844-step-explanation.png、step-restarted.png；含正確列也全部清空。
- 抽查2：strict-retry/390x844-node-explanation.png、node-restarted.png；回動作①且分枝未長。
- 抽查3：strict-retry/390x844-trace-explanation.png、trace-restarted.png；第三格錯也從第一格遮圖重來。
- 抽查4：strict-retry/matching/390x844-N01-exchange.png、landscape/844x390-N03-exchange.png；列下方明確交換／取消。
- 抽查5：SCRIPT_DIFF.txt、strict-retry/ 各檢查原始輸出；#6h 交 Antigravity 新手試做三種重來路徑。

## 實作範圍

三種失敗狀態保留原錯誤說明，說明先出現，400 ms 後才出現重來按鈕。等待重來時停用作答控制項，不能直接換答案或翻箭頭；重新整理仍維持待重來。配合題舊的「保留正確列」規則已取消，全部列清空後重新洗牌。第2關的分數卡片操作也遵守整步清空；第5關按重來後兩箭頭均回到原始錯向。

確認題指既有 v3 的五題小檢核（第5關無小檢核）：錯誤後清空該關動作、微檢核及 model 的 task/micro/edges 狀態，回到動作①。原動作②單選依操作步驟重來。心智圖只依已通過整關的 done 狀態長枝，配對剛全對時仍不長枝。

結尾錯誤沿用對應關卡已核定的錯誤說明：第1格用第1關動作②、第2格用第4關、第3格用第5關。按重來後 traceIndex=0、model.trace=false，三格與選取樣式全部清空，心智圖遮住。沒有增寫教學內容。

選項順序在一次作答過程保持穩定。每次重來對既有選項順序重新洗牌；若隨機結果恰與前次相同，循環移動一次保證順序改變。答案索引仍指原本選項，正式題庫配對、理由與全對門檻未更動。v3.2 使用新的進度儲存鍵，舊 v3.1 作答不會帶入新規則；首次操作引導的帳號／裝置隔離仍保留。

選到他列已用說明後，關閉選單，在發起列下方顯示使用者與交換／取消控制，焦點移至交換按鈕。只有明確交換才改兩列，取消保持原答案；改選別列時取消尚未確認的交換。

## 驗證與輸出

| 檢查 | 結果 | 證據 |
|---|---|---|
| 逐字比對 | v3.2 PASS，149單元，缺0／異文0／多字0 | [SCRIPT_DIFF](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-match/SCRIPT_DIFF.txt)、[JSON](SCRIPT_DIFF.json) |
| 內容來源 | PASS，210欄、772引句，0跳過 | [content-check.json](strict-retry/content-check.json) |
| 八尺寸版面 | 632／632 PASS，0裁切／越界／過小字，0例外 | [layout-results.json](strict-retry/layout/layout-results.json)、[原始輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-match/strict-retry/layout-check.log) |
| 三種重來畫面 | 390×844、1280×800、844×390，共18張 PASS | [strict-results.json](strict-retry/strict-results.json)、[截圖索引](strict-retry/SHOTS.md) |
| 配合題引導／交換 | 第1／3關共28張 PASS，橫向另14張 PASS | [matching-results](strict-retry/matching/matching-results.json)、[橫向結果](strict-retry/landscape/matching-results.json) |
| 教材完整測試 | 42／42 PASS，0 FAIL／skip | [material-tests.log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-match/strict-retry/material-tests.log) |
| 固定亂數／重整補驗 | 三種路徑 PASS；固定 RNG 驗證換序，包含重整及帳號初始化仍鎖題 | [guard-tests.log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-match/strict-retry/guard-tests.log) |
| npm run check | 平台163／163、Functions61／61、版本／build PASS | [npm-check.log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-match/strict-retry/npm-check.log) |
| 既有證據保留 | 182檔逐位元組一致 | [preserved-evidence.json](strict-retry/preserved-evidence.json) |

新增 `tests/acidbase-strict-retry.test.mjs` 三條實際瀏覽器路徑，沒有用改狀態繞過作答；原逐字／版面巡檢改為真的按重來並重做動作，仍遍歷所有核定錯誤回饋與正式考核。`tests/acidbase-matching.test.mjs` 也驗證列下方交換、取消及整步清空；以 git show 984cbdf 保護各關教學原文。

## 預覽與交接

直接開啟 [strict-preview.html](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-match/strict-retry/strict-preview.html) 可試作 v3.2；重新試作可清除該頁 localStorage。[v3.1 舊報告](V3_1_CODEX_REVIEW.md) 及既有 Antigravity NOVICE_TEST.md 保留為歷史證據，不代表本輪已經獨立驗收。

#6h 改為「停-等Antigravity」，請新手試做配合題與三種重來；本輪只有本機 commit，未 push、未合併、未部署，未 build／登錄／發布教材，未改教師 reviewed。學生腳本、共用配合規格與9份 README 同步到根目錄；根目錄既有教師15:04優先規則保留。根目錄 devlog 已寫入，`python3 scripts/check_handoff.py` PASS（1698/4000字、22/25件）；[原始輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-match/strict-retry/handoff-check.log)。
