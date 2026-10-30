# #42b：閱讀加大設定的後端保存（待教師另行安排）

教師10/30回覆：本輪先完成#42三份樣張，後端支援另列待辦。本檔不代表現在可以實作、部署或寫入正式資料。

先讀根目錄handoff.md、CODEX_QUEUE.md、CODEX_TASK_readability_2026-10-30.md（13:15）、docs/READABILITY_REPORT.md。
位置：.worktrees/readability（feature/readability）；不要切換根目錄分支。

## 已證實的落差

- functions/src/index.ts 的 saveCourse 只將 featureNames 三個既有布林值寫到根 features。
- bootstrap／listCourses 以根features覆蓋draft／published的features；只在draft存新欄位無法對全班生效。
- #42本機樣張已加入前端欄位、共用型別／輸入驗證；正式saveCourse與bootstrap實作尚未變更。

## 教師授權後的最小範圍

1. saveCourse以交易、既有revision保護與教師權限保存readabilityOverlay（缺省true）及readabilityOverlayExclusions（materialVersion字串陣列）。
2. 保留既有三種features及所有其他課程內容；不得把新開關缺省當false。
3. bootstrap／listCourses／必要的草稿與學生投影回傳相同設定，排除陣列不得遺失；依既有資料的缺省規則讀取，不自行批次改正式課程。
4. 加Emulator測試：授權教師開／關／排除、學生可讀設定、非教師與跨課程拒絕、非法／過長／重複排除值、缺省開啟及revision衝突。
5. 說明真正需要部署的callable清單與順序；不得再標成「只需前端」而省略保存能力。

未經教師授權不push、不部署、不寫正式資料、不變更勾班或教材原檔。完成實作與自檢後停-等Claude，寫devlog、跑check_handoff.py，附下一棒交棒prompt。
