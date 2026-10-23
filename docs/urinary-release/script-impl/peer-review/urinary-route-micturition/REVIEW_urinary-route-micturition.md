# 給 Claude 的摘要
- 受審：Antigravity `4085d33` 的 `urinary-route-micturition`；審查者 Codex，未改作者程式。
- 結果：退修（FAIL）；P1：第 2、3、4 關的定位操作仍在圖下文字按鈕。
- 自動操作走到全部六關；這不是獨立新手試做 PASS，也不代表八尺寸／SCRIPT_DIFF 通過。
- 抽查：[第 2 關畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/N2-390-before.png)、[實際可見文字與控制](observations.json)。

## 重現與修復要求
1. 用作者 render.mjs 渲染作者 apply.json，手機 390×844；預覽：[peer-preview.html](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/peer-preview.html)。
2. 開始 → 先認識 → 開始作答，逐關依畫面操作；自動流程會使用已編譯答案完成前關，以到達待驗畫面，沒有注入進度或跳關。
3. 第 2 關說「請在圖上點出來」，橘色狹窄點不是作答按鈕，實際要勾選圖下三個文字項目。第 3、4 關點位置／順序的操作也由圖下按鈕完成。
4. 把三處狹窄、三角開口及男性尿道三段的控制綁到相應圖上位置；點對才更新圖與作答狀態，文字可作無障礙名稱。

## 逐關實際到達紀錄
| 關 | 作者實際操作型態 | 作答前截圖 |
|---|---|---|
| 1 | choice → choice | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/N1-390-before.png) |
| 2 | multi | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/N2-390-before.png) |
| 3 | sequence → choice | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/N3-390-before.png) |
| 4 | matching → sequence | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/N4-390-before.png) |
| 5 | slider → matching | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/N5-390-before.png) |
| 6 | choice | [畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/N6-390-before.png) |

新手看到指令後應能直接在圖上完成指定動作；上述操作不一致就是卡點。其他關卡到達不等於逐項功能 PASS；本次不把讀取作者答案的自動通關寫成新手認證。

## 修後驗收
- 由作者修復，回報新 commit；逐關真正只看畫面試做並記錄卡點。
- 重新跑完整 SCRIPT_DIFF（含錯誤／確認／結尾／過渡）及八尺寸所有狀態；交可重跑指令與原始結果，不能用固定字串產生 PASS。
- 三種重來路徑、逐錯列個別回饋、手機圖可對照，沿用已定版共用元件；整步／整關／結尾重置範圍分清。
