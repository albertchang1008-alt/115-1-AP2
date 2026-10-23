# 給 Claude 的摘要
- Codex 五份＋酸鹼共通修正已完成；分支 `codex/apply9-script`，基底 `0594eb3`，實作 commit `d8f4b64`。
- 檔案：materials-src/apply-kit 共用元件、五份 student-plan.json、核定題目改寫、scripts/apply-script-*、tests/apply-script.test.mjs。
- 自測 PASS：npm run check（前端 163、Functions 61）；教材測試 48；五份八尺寸 3237/3237；SCRIPT_DIFF 404 單位缺 0 多 0；酸鹼 648/648、149 單位。
- content-check：五份＋酸鹼 6/6 PASS；11 題改寫逐欄覆核 PASS，無授權以外題目變動。
- 偏離／停點：Antigravity 四份實作退修、五份互審報告不符合實際腳本；不能宣稱九份互審全部通過。
- 教師已指示寫報告後由教師轉交修正；未修改作者程式、未 push／合併／部署／改 Excel／reviewed。
- 請抽查：腎臟 N2 配合圖、濾過 N3 多對一、腎管 N4 滑桿、酸鹼多列回饋、[作者退修清單](RETURN_TO_ANTIGRAVITY.md)。

## 完成內容與證據
五份各六關，逐字編譯核定腳本；先認識、圖上操作、提示、逐列配合、行內交換／取消、三種嚴格重來、結尾三格、過渡與兩階段全對通關皆納入流程。

酸鹼與五份共用配合／重來元件；手機保留參考圖，多列錯誤各顯示自己的句子。重來先解析、400ms 後按鈕；操作整步、確認整關、結尾三格全清，各次重洗選項。SVG 保持比例，點圖控制以圖上熱區定位。

| 教材 | 八尺寸狀態檢查 | SCRIPT_DIFF 必見單位 | 截圖索引 |
|---|---|---|---|
| kidney-anatomy | 652/652 | 83，缺 0 多 0 | [kidney-anatomy 證據](kidney-anatomy/release/SHOTS.md) |
| nephron-circulation | 659/659 | 76，缺 0 多 0 | [nephron-circulation 證據](nephron-circulation/release/SHOTS.md) |
| filtration-clearance | 628/628 | 78，缺 0 多 0 | [filtration-clearance 證據](filtration-clearance/release/SHOTS.md) |
| tubular-handling | 644/644 | 80，缺 0 多 0 | [tubular-handling 證據](tubular-handling/release/SHOTS.md) |
| urine-concentration | 654/654 | 87，缺 0 多 0 | [urine-concentration 證據](urine-concentration/release/SHOTS.md) |

八尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。每份 release/ 內有 preview.html、layout-results.json、SCRIPT_DIFF.json/txt 及 shots/；390／1280 包括作答前、提示、錯誤、重做、正確、確認、結尾及過渡。自動檢查不是獨立新手認證。

酸鹼：[逐字與版面結果](common/acidbase-release/)、[原始輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/check-output/acid-release.txt)。核定學生腳本原句與 SHA 保留；required units 的全流程可見性及逐字一致同時檢查。

## 測試指令及輸出
- `npm run check`：[完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/check-output/npm-check.txt)。前端／Functions 測試、型別、版本與建置通過。
- `node --test tests/apply-*.test.mjs tests/acidbase-*.test.mjs`：[48/48 完整輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/check-output/material-tests.txt)。包括舊版引擎及新腳本，不以新引擎遮蔽舊版測試。
- `node scripts/apply-script-check.mjs <slug> --out docs/urinary-release/script-impl/<slug>/release`：各份 release 結果；[批次 A](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/check-output/release-a.txt)、[B](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/check-output/release-b.txt)、[C](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/check-output/release-c.txt)。
- content-check 以 scripts/apply-content-check.mjs 的來源檢查介面逐份執行：[6 份輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/check-output/content-check.txt)，逐份 JSON 在各教材資料夾。
- 11 題改寫：[獨立比對](question-rewrite-review.json)，3 題在我方五份、1 題在酸鹼、7 題在作者四份；其餘題目完整比對保留，44 題誘答此次不改。

## 互審與退修狀態
[給 Antigravity 的完整退修報告](RETURN_TO_ANTIGRAVITY.md) 附四份各六關畫面、可見文字／控制紀錄，列明實作問題、互審敘述錯置及驗證腳本漏檢。審查使用作者 4085d33 的 renderer／compiler／apply.json，沒有以我方改良引擎代替作者受審程式。

24 關均以 UI 操作到達，未注入或改寫進度；該自動程序讀取作者編譯答案供到達定位畫面，已明確標為自動檢查。真正只看畫面的新手試做及修後完整 SCRIPT_DIFF 仍待作者修正後交換覆驗，不記為 PASS。

## 後續
佇列 #6j 維持交辦的「停-等Claude」，下一步清楚寫退修未全過；教師轉交作者。修後回報 commit 並重新互審，通過後才供教師看畫面。未 build 正式教材／登錄／題庫寫入／push／部署。

週誌已寫入根目錄 docs/devlog/2026-W43.md；[check_handoff 原始輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/check-output/check-handoff.txt) PASS（1698/4000 字、22/25 件）。
