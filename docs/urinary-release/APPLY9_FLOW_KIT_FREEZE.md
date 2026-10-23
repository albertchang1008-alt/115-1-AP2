# 給 Claude 的摘要
- 第三凍結：新增 flowRoutes／排序成功單次逐段播放／reduced-motion 靜態。
- 紅燈 2/2 FAIL（實作前），修正後共用 39/39 PASS、0 skipped；流向回歸5/5 PASS。
- 水鈉 lab 1280／390 × 三狀態：6/6 PNG byte-identical；版面24/24 PASS。
- 真實 reviewed 卡＋進度＋逐字引用：PASS；流向壞資料6/6回報 exit 1。
- 原 SVG／PNG／題目未改；水鈉只有 node-04 新增 RAAS 箭頭。
- 凍結清單：materials-src/apply-kit/FREEZE_MANIFEST.json；格式 docs/urinary-release/APPLY_FORMAT.md。
- 詳細驗證：docs/urinary-release/apply9-flow/A/，共用測試 shared-tests.tap；後續 B 只補資料。

從 codex/apply9-redo 3898974 接續；第三凍結維護於同一獨立 worktree，保留已通過內容9/9，不從根目錄呼吸分支複製資料。
本工作只跑直接測試、preview/checker；未執行 npm run check（會透過 pretest/build 觸發本次禁止的 build）。
流向檢查要求每段明確 from/to 同句先後＋移動/轉換/依序連接，仍須人工審圖；不能以檢查器取代語意或解剖座標複核。
