# 給 Claude 的摘要
- 覆核對象：Antigravity 第二輪 `6598178`；結論 **FAIL**，不能依既有測試的 PASS 宣告驗收通過。
- 親自開完 ux-redo2 原有 12 張截圖，另重跑真實瀏覽器、grep、8 尺寸跑版與 25 個既有測試。
- 主要 FAIL：N01 SVG 高度僅桌面 36.8%／手機 48.3%，未達左欄 60%；手機 SVG 有效字級最低約 7.2px。
- 真實點選 N01 答錯微題仍有開啟中的 dialog；因此「答錯無彈窗」只在操作第一步成立。
- 已有改善：N01、N05 初始操作無 select、底部五分頁 DOM 已移除、N05 箭頭可點，這些項目 PASS。
- 舊檢查器重跑 464/464、25/25、0 skipped，但 SVG 文字原被略過，與驗收所需證據不等價。
- 後續由 Codex 重做，最新成果與測試見 ../ux-codex/REPORT.md；本檔保留第二輪的原始判定。
- 抽查：desktop-n01-before、mobile-n01-before、mobile-n05-wrong、../ux-codex/BASELINE_REVIEW.json、../ux-codex/baseline-390-wrong-micro.png。

## 實際檢查

工作樹 `.worktrees/acidbase-full`／分支 `codex/acidbase-full`，覆核時 HEAD 是 `6598178`。作者交件已存在，沒有採用「未交」分支。

`grep -c '<select' materials-src/apply-kit/full.js` 為 1（共用補連結仍使用下拉）；N01／N05 最初操作畫面中的 select 都是 0，兩者不可混為一談。`grep -n 'showModal' materials-src/apply-kit/full.js` 命中微題／補連結回饋和名詞彈窗；實際填好 N01 操作再答錯微題，`dialog[open]` 於兩尺寸均為 1。

N01 初始圖量測：1280×800 的 SVG 高 270px／左欄 734px＝36.8%；390×844 為 190px／左欄 393px＝48.3%。有效字級依 SVG 的 screen CTM 換算，分別約 12.95px 與 7.17px。證據在 `../ux-codex/BASELINE_REVIEW.json`；自行觸發的錯題彈窗截圖為 `../ux-codex/baseline-{1280,390}-wrong-micro.png`。

N01 圖另加入「數秒／數分鐘／數小時～數天」而未在作者資料掛上核定原句；重做時撤除這些圖面額外敘述。此處不是改寫核定題幹、選項、診斷或原句。

舊版獨立重跑最後五行、全部輸出見 `../ux-codex/logs/baseline-{layout,tests}.txt`：跑版 464/464，測試 25/25，0 skipped。這證實檢查器有缺口；Codex 新增有效 SVG 字級量測及對下拉／彈窗的回歸守門。舊碼跑新守門為 2 PASS／1 FAIL，新碼全綠，完整紅色輸出見 `../ux-codex/logs/regression-red.txt`。

## 十二張原交件逐張看圖紀錄

| 截圖 | 親眼看到的狀態 |
|---|---|
| desktop-n01-before.png | 圖只佔左欄上段，下方大片空白，槽位旁有調節時間。 |
| desktop-n01-wrong.png | 兩個錯槽位紅框，右側文字回饋重複出現，原標籤保留。 |
| desktop-n01-right.png | 三個槽位已填正確，右側直接換成微題，沒有這一步的「下一步」。 |
| mobile-n01-before.png | 三分工圖被縮小，槽位說明很細，圖與標籤之間留白。 |
| mobile-n01-wrong.png | 槽位紅框存在，但細字仍很小，右側回饋變成下方兩段重複文字。 |
| mobile-n01-right.png | 圖縮在上半部，右側微題移到下方，底部名詞與小圖並列。 |
| desktop-n05-before.png | 有血液／上皮／管液三欄和兩條錯箭頭，圖上文字壓在箭身附近。 |
| desktop-n05-wrong.png | H⁺已改對、HCO₃⁻仍錯且紅框，右側錯選項也有紅框。 |
| desktop-n05-right.png | 兩箭頭綠色，出現前往補連結的下一步按鈕。 |
| mobile-n05-before.png | 三欄與箭頭有畫出，欄名和次要說明字縮得很小。 |
| mobile-n05-wrong.png | 第二條箭頭紅框，診斷重複在下方兩處，未見此截圖本身有彈窗。 |
| mobile-n05-right.png | 兩箭頭校正成綠色，下方有前往補連結按鈕，名詞列在底。 |

## 獨立重跑的最後五行

`baseline-tests.txt`

```text
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 16640.04925
```

`baseline-layout.txt`

```text
844x390 glossary-resp-acid: PASS out=0 clip=0 small=0
844x390 glossary-resp-alk: PASS out=0 clip=0 small=0
844x390 glossary-met-acid: PASS out=0 clip=0 small=0
844x390 glossary-met-alk: PASS out=0 clip=0 small=0
{"cases":464,"pass":464,"fail":0,"skipped":0}
```
