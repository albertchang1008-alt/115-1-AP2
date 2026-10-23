# 給 Claude 的摘要
- 退回 Antigravity `4085d33` 的四份實作與五份互審報告；本報告可直接交給作者修。
- 四份都有畫面證據；未修改對方分支。Codex 五份自測通過，第二方新手覆驗仍未成立。
- 不採信現有「9 份全 PASS」：互審敘述與核定腳本／實作不符，驗證腳本亦有漏檢。
- 抽查：fluid 第 1 關、水鈉第 6 關、尿路第 2 關、電解質第 2 關，以及 kidney／urine 互審敘述。

## 作者要修的四個實作項目
| 教材 | 退修項目 | 證據及驗收要求 |
|---|---|---|
| urinary-route-micturition | P1：第 2、3、4 關的定位操作仍在圖下文字按鈕 | [逐份報告](peer-review/urinary-route-micturition/REVIEW_urinary-route-micturition.md)、[截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/urinary-route-micturition/N2-390-before.png) |
| fluid-compartments | P1：第 1 關沒有可拉的水位 | [逐份報告](peer-review/fluid-compartments/REVIEW_fluid-compartments.md)、[截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/fluid-compartments/N1-390-before.png) |
| water-sodium-regulation | P1：第 6 關缺少 ANP 開關與觀察階段 | [逐份報告](peer-review/water-sodium-regulation/REVIEW_water-sodium-regulation.md)、[截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/water-sodium-regulation/N6-390-before.png) |
| electrolyte-balance | P1：第 2 關要求點箭頭，實際只有圖下文字可選 | [逐份報告](peer-review/electrolyte-balance/REVIEW_electrolyte-balance.md)、[截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/script-impl/peer-review/electrolyte-balance/N2-390-before.png) |

## 五份互審報告必須重做
受審應是 Codex `d8f4b64`，而非只寫基底 `0594eb3`。現有報告原樣封存於 [incoming-reports](peer-review/incoming-reports/)，不覆寫作者紀錄。

| 報告 | 現有敘述 | 核定腳本與本次實作 |
|---|---|---|
| REVIEW_kidney-anatomy | 第 2 關皮質／髓質／腎盂；第 3 關血管與腎門；第 4 關微觀放大 | 第 2 關皮質／髓質／腎柱；第 3 關尿液收集順序；第 4 關腎外保護層 |
| REVIEW_nephron-circulation | 第 2 關腎小管分段；第 3 關兩套毛細血管網；第 4 關直管 | 第 2 關兩種腎元；第 3 關小管形態；第 4 關血液路徑 |
| REVIEW_filtration-clearance | 第 1 關寫三層屏障、第 3 關入出球口徑調節，且只列到第 5 關 | 第 1 關是過濾方向、第 3 關粒子能否過濾；實際有六關，沒有入出球口徑操作關卡 |
| REVIEW_tubular-handling | 第 2 關逆流乘增；第 4 關 ADH 水通道；第 5 關酸鹼分泌 | 第 2 關排泄公式；第 4 關葡萄糖最大轉運量；第 5 關醛固酮作用位置 |
| REVIEW_urine-concentration | 開場駱駝；第 2 關 200 mOsm 單一效應；第 4 關尿素循環 | 開場天熱喝水；第 2 關下降枝；第 4 關直血管，沒有獨立尿素循環關卡 |

腎臟及濃縮報告還把 Step 2 答錯寫成回 Step 1，與本次規則不合：操作錯只清空當步，確認錯整關，結尾錯從第 1 格。三者都須先顯示解析再出現按鈕並重新洗牌。

修後報告每份須附：受審 commit、390×844 與 1280×800 操作證據、每關實際按鈕／卡點、三種重來路徑、SCRIPT_DIFF 原始 JSON。未到達寫未到達，遇不到的狀態寫未驗證；不以自動使用答案的流程冒充新手試做。

## 自動驗證腳本也要修
來源：作者 `scripts/verify-and-screenshot-antigravity.mjs`、`scripts/verify-8-viewports.mjs`。
1. auditDOM 只在各關通關畫面呼叫；未把所有 required units 收集後算 missing，所以該腳本不能支持缺 0。
2. `if (script.units[id]?.text && ...)` 會忽略未知 data-copy ID；data-common／data-interface／data-original 的文字也直接跳過而未比核定表。
3. DOM 錯誤只 console.error，沒有改失敗狀態；最終報告各欄固定印 PASS，可能帶錯誤仍宣告通過。
4. 八尺寸腳本開始後只到第 1 關先認識，就檢查水平寬度；沒有遍歷各關／錯誤／配合選單，也沒檢查高度、截斷、小字。32/32 只代表該一個畫面，不代表完整驗收。
5. 截圖驗證對未看到錯誤的情況 catch 後繼續；slider 不留答錯截圖；正式兩階段只進入考核，沒有走完兩階段。請補足證據或縮小報告宣稱。

## 同步共用元件時的注意事項
Codex 共用定版在 `d8f4b64`，包括真正圖上熱區、SVG 等比縮放、手機配合圖、逐錯列回饋、嚴格重來及完整 DOM／版面檢查。作者四份有自己的圖形家族與 mL 滑桿擴充，不能直接整檔覆蓋丟失；請保留擴充後同步，再重跑四份。

11 題教師改寫已獨立逐欄核對通過；[question-rewrite-review.json](question-rewrite-review.json) 證明僅核定題的 stem/options/answer 改動，其餘題欄位保留。水鈉原始比較來源為基底的 materials-src/apply-examples/water-sodium-regulation/apply.json。

本輪結論：退修；完整雙方互審／新手試做尚未完成。依教師「寫在報告，我再給它修」，由教師轉交作者，不代修、不自行合併或部署。
