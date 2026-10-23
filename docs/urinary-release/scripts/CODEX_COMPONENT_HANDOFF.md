# 給 Claude 的摘要
- 交接給 Antigravity：共用元件由 Codex 在 `.worktrees/apply9-script` 維護，基底 0594eb3；共用定版 commit d8f4b64；五份自測通過，互審退修見 CODEX_APPLY9_RETURN_TO_ANTIGRAVITY.md。
- 共用檔：student-components.js、student-figures.js、scripted-compile.mjs、scripted-player.js、scripted-render.mjs、scripted.css；同時修改 student.js／student.css／render.mjs／full-render.mjs 接入。
- 每份只新增 `materials-src/<slug>/student-plan.json` 描述圖與動作；文字一律由 docs/urinary-release/scripts/<slug>.md 編譯，不在 renderer 另寫教學文案。
- 檢查：`node scripts/apply-script-check.mjs <slug> --quick` 跑手機負向流程；去掉 --quick 跑8尺寸及截圖。正式 layout-check 接線完成後同樣會跑學生腳本。
- 題目：`node scripts/apply-script-question-rewrites.mjs <slug...> --write` 逐字套11份教師稿，僅改符合 ID 的 stem/options/answer，保留其餘題目與來源；fluid U 題已於 DECISIONS 19:12 核可。
- 共用元件手機幾何與 SCRIPT_DIFF 覆蓋已定版；同步時保留作者四份圖形家族與 mL 滑桿擴充，再補圖上控制並重跑，不可整檔覆蓋丟失。
- 完成後請在根目錄本資料夾留 `ANTIGRAVITY_COMPONENT_HANDOFF.md`，列分支、commit、報告與四份預覽；Codex 會只操作畫面逐份互審，不改作者程式。

## student-plan.json 介面

`profile: apply-script-v1`，`nodes` 六項，每項 `figure` 與 `steps`。
動作 type：matching／point／choice／sequence／explore／multi／arrows／signs／slider。
matching：roles、choices、expected（每列的選項原索引）；多張卡歸同類設 unique:false，否則採明確列內交換。rowFeedback 若提供，必須為腳本原句。
選項：sourceOptions:"question" 使用原問題的〔選項〕，sourceOptions:"action" 搭 action:原動作零基索引；useActionQuestion:true 使用該動作的問題句。choices 為同份腳本的逐字片語。
順序題 expected 是正確索引序列；多選題 expected 是所需索引集合；探查題 reveals 是腳本核定顯示句。禁止 select、dialog、window.alert/confirm/prompt。
元件不預選，重來固定重洗；確認題由腳本「確認」欄自動處理，不能用改狀態跳過動作。
