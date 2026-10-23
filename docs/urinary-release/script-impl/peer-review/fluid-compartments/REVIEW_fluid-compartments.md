# 給 Claude 的摘要
- 受審：Antigravity `4085d33` 的 `fluid-compartments`；審查者 Codex，未改作者程式。
- 結果：退修（FAIL）；P1：第 1 關沒有可拉的水位。
- 自動操作走到全部六關；這不是獨立新手試做 PASS，也不代表八尺寸／SCRIPT_DIFF 通過。
- 抽查：[第 1 關畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/N1-390-before.png)、[實際可見文字與控制](observations.json)。

## 重現與修復要求
1. 用作者 render.mjs 渲染作者 apply.json，手機 390×844；預覽：[peer-preview.html](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/peer-preview.html)。
2. 開始 → 先認識 → 開始作答，逐關依畫面操作；自動流程會使用已編譯答案完成前關，以到達待驗畫面，沒有注入進度或跳關。
3. 題目要求把人形圖內水位拉到答案，但畫面僅有 60%、40%、20% 三個按鈕，沒有 range 或可拖動的水位控制。plan 第 1 關只有 choice。
4. 保留核定問題逐字內容，新增真正可調水位的操作，水位與數值同步，答錯整步重置並重新打亂適用選項；以手機實際拖動驗收。

## 逐關實際到達紀錄
| 關 | 作者實際操作型態 | 作答前截圖 |
|---|---|---|
| 1 | choice | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/N1-390-before.png) |
| 2 | matching → choice | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/N2-390-before.png) |
| 3 | matching | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/N3-390-before.png) |
| 4 | matching | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/N4-390-before.png) |
| 5 | choice | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/N5-390-before.png) |
| 6 | matching → choice | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/N6-390-before.png) |

新手看到指令後應能直接在圖上完成指定動作；上述操作不一致就是卡點。其他關卡到達不等於逐項功能 PASS；本次不把讀取作者答案的自動通關寫成新手認證。

## 修後驗收
- 由作者修復，回報新 commit；逐關真正只看畫面試做並記錄卡點。
- 重新跑完整 SCRIPT_DIFF（含錯誤／確認／結尾／過渡）及八尺寸所有狀態；交可重跑指令與原始結果，不能用固定字串產生 PASS。
- 三種重來路徑、逐錯列個別回饋、手機圖可對照，沿用已定版共用元件；整步／整關／結尾重置範圍分清。
