# D：失敗停點（2026-10-16）

依本輪交辦「任何一步失敗就停下回報」，本次在U-1–U-4圖面驗證後停止，沒有修好重跑、放寬檢查或執行後續階段。

## 分支與提交

- 主目錄仍feature/respiratory-infographics且dirty，完全未改。依前輪既有工作位置使用feature/urinary-infographics worktree。
- 起始／最後已提交版本649b98b；本輪D沒有commit，修圖與preview保留未提交。
- 體液第4階段原成果已於649b98b完成；本輪尚未複驗、未處理新審查F-1–F-9。

## 已嘗試修正

- U-1：腎臟總覽功能詞、腎元總覽及node-05腎素加具標題圖例框。
- U-2：腎小管node-03再吸收箭頭由[425,750]指向管周微血管[600,640]，不再以橫切小圖為終點。
- U-3：刪除尿路node-05無標的虛線箭頭。
- U-4：腎小管node-03四物質改為框內圖例、移除粒子引線；未改底圖。

## 驗證結果

- preview四份均成功，未登錄。
- 腎臟：18案例、35crop通過。
- 其他：44案例中5例allTextOverlaps失敗、0 pageerror；39例未報錯，但本輪整體不通過。
- 失敗原因均為新手機圖例標題「構造與功能圖例」與第一列編號／名稱重疊。
- 後續標準shots、共用測試、全庫節點稽核、體液複驗均未執行，不能以先前PASS抵作本輪PASS。

| 教材 | 寬度 | 圖位／狀態 | 重疊 |
|---|---|---|---|
| nephron-circulation | 390 | overview / state-1 | [['構造與功能圖例', '1'], ['構造與功能圖例', '皮質腎元']] |
| nephron-circulation | 390 | overview / state-2 | [['構造與功能圖例', '1'], ['構造與功能圖例', '皮質腎元']] |
| nephron-circulation | 390 | overview / state-3 | [['構造與功能圖例', '1'], ['構造與功能圖例', '皮質腎元']] |
| nephron-circulation | 390 | node-05 / None | [['構造與功能圖例', '1'], ['構造與功能圖例', '入球小動脈']] |
| tubular-handling | 390 | node-03 / None | [['構造與功能圖例', '1'], ['構造與功能圖例', '近曲小管']] |

驗證JSON：../labels/verification-nephron-circulation_tubular-handling_urinary-route-micturition.json；失敗截圖：../labels/screenshots/nephron-circulation-390-overview-state-{1,2,3}.png、nephron-circulation-390-node-05.png、tubular-handling-390-node-03.png。

原COMPLETE_REPORT及screenshots.html記錄的是649b98b的先前交付；本次dirty preview與該截圖集不同，不可當成本輪通過證據。

下一步：由教師決定續修；需先處理手機圖例標題與第一列的間距，再按新交辦重跑驗證。未push、merge、部署或修改任何共用驗證器／測試／原圖。
