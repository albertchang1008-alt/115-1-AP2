# 泌尿＋體液學生腳本實作驗收報告（Antigravity 4 份）

**執行日期：** 2026-10-21
**執行分支：** `antigravity/apply9-script` (base: `0594eb3`)

## 驗收結果總表

| 教材 (Slug) | 學生腳本編譯 | SCRIPT_DIFF | DOM 文字覆核 | 手機 (390×844) | 桌面 (1280×800) | 狀態 |
|---|---|---|---|---|---|---|
| `urinary-route-micturition` | PASS | 缺 0 多 0 | PASS | PASS | PASS | 通過 |
| `fluid-compartments` | PASS | 缺 0 多 0 | PASS | PASS | PASS | 通過 |
| `water-sodium-regulation` | PASS | 缺 0 多 0 | PASS | PASS | PASS | 通過 |
| `electrolyte-balance` | PASS | 缺 0 多 0 | PASS | PASS | PASS | 通過 |

## 兩階段題目改寫套用查核（FIGURE_DEPENDENT_QUESTIONS.md 7 題）

| 題目 ID | 原判定 | 改寫草稿重點 | 套用狀態 | 答案核對 |
|---|---|---|---|---|
| `urinary-route-micturition-case-q03` | W | 膀胱三角由哪三個開口界定 | 已套用 | 左右輸尿管口及尿道內口 (選項4) |
| `fluid-compartments-foundation-q03` | D | 血漿約20%與組織間液約80%是何者細分 | 已套用 | 細胞外液 (選項3) |
| `fluid-compartments-case-q03` | U | 4%與16%體重分法與其他分法整理原則 | 已套用 | 維持本示例的分母與比例一致 (選項1) |
| `fluid-compartments-case-q05` | W | 微血管不易讓蛋白質通過 | 已套用 | 微血管壁不易讓蛋白質通過，使其較多留在血漿 (選項3) |
| `water-sodium-regulation-case-q03` | W | 遠曲小管及集尿管Na再吸收與K分泌增加 | 已套用 | 醛固酮 (選項1) |
| `electrolyte-balance-case-q04` | W | 離子分布與鉀分泌方向分開判讀 | 已套用 | 細胞膜內外分布與血液／管液方向應分開判讀 (選項2) |
| `electrolyte-balance-case-q05` | W | 氯離子與PTH腎端作用配對 | 已套用 | Cl⁻為細胞外主要陰離子；PTH促鈣再吸收及磷排泄 (選項1) |

## 截圖清單與描述

### `urinary-route-micturition`

| 裝置尺寸 | 節點／關卡 | 階段 | 截圖檔名 | 畫面描述 |
|---|---|---|---|---|
| 390x844 | 01 | before | `urinary-route-micturition-390x844-N01-01-before.png` | 第 01 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 01 | hint | `urinary-route-micturition-390x844-N01-02-hint.png` | 第 01 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 01 | wrong | `urinary-route-micturition-390x844-N01-03-wrong.png` | 第 01 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 01 | correct | `urinary-route-micturition-390x844-N01-04-correct.png` | 第 01 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 02 | before | `urinary-route-micturition-390x844-N02-01-before.png` | 第 02 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 02 | hint | `urinary-route-micturition-390x844-N02-02-hint.png` | 第 02 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 02 | wrong | `urinary-route-micturition-390x844-N02-03-wrong.png` | 第 02 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 02 | correct | `urinary-route-micturition-390x844-N02-04-correct.png` | 第 02 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 03 | before | `urinary-route-micturition-390x844-N03-01-before.png` | 第 03 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 03 | hint | `urinary-route-micturition-390x844-N03-02-hint.png` | 第 03 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 03 | wrong | `urinary-route-micturition-390x844-N03-03-wrong.png` | 第 03 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 03 | correct | `urinary-route-micturition-390x844-N03-04-correct.png` | 第 03 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 04 | before | `urinary-route-micturition-390x844-N04-01-before.png` | 第 04 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 04 | hint | `urinary-route-micturition-390x844-N04-02-hint.png` | 第 04 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 04 | wrong | `urinary-route-micturition-390x844-N04-03-wrong.png` | 第 04 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 04 | correct | `urinary-route-micturition-390x844-N04-04-correct.png` | 第 04 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 05 | before | `urinary-route-micturition-390x844-N05-01-before.png` | 第 05 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 05 | hint | `urinary-route-micturition-390x844-N05-02-hint.png` | 第 05 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 05 | correct | `urinary-route-micturition-390x844-N05-04-correct.png` | 第 05 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 06 | before | `urinary-route-micturition-390x844-N06-01-before.png` | 第 06 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 06 | hint | `urinary-route-micturition-390x844-N06-02-hint.png` | 第 06 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 06 | wrong | `urinary-route-micturition-390x844-N06-03-wrong.png` | 第 06 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 06 | correct | `urinary-route-micturition-390x844-N06-04-correct.png` | 第 06 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | end | end | `urinary-route-micturition-390x844-end.png` | 結尾三格遮圖作答完成：呈現完整心智圖與通關結語 |
| 390x844 | transition | transition | `urinary-route-micturition-390x844-transition.png` | 過渡激勵頁面：顯示「準備考核」與過渡激勵語 |
| 1280x800 | 01 | before | `urinary-route-micturition-1280x800-N01-01-before.png` | 第 01 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 01 | hint | `urinary-route-micturition-1280x800-N01-02-hint.png` | 第 01 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 01 | wrong | `urinary-route-micturition-1280x800-N01-03-wrong.png` | 第 01 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 01 | correct | `urinary-route-micturition-1280x800-N01-04-correct.png` | 第 01 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 02 | before | `urinary-route-micturition-1280x800-N02-01-before.png` | 第 02 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 02 | hint | `urinary-route-micturition-1280x800-N02-02-hint.png` | 第 02 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 02 | wrong | `urinary-route-micturition-1280x800-N02-03-wrong.png` | 第 02 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 02 | correct | `urinary-route-micturition-1280x800-N02-04-correct.png` | 第 02 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 03 | before | `urinary-route-micturition-1280x800-N03-01-before.png` | 第 03 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 03 | hint | `urinary-route-micturition-1280x800-N03-02-hint.png` | 第 03 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 03 | wrong | `urinary-route-micturition-1280x800-N03-03-wrong.png` | 第 03 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 03 | correct | `urinary-route-micturition-1280x800-N03-04-correct.png` | 第 03 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 04 | before | `urinary-route-micturition-1280x800-N04-01-before.png` | 第 04 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 04 | hint | `urinary-route-micturition-1280x800-N04-02-hint.png` | 第 04 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 04 | wrong | `urinary-route-micturition-1280x800-N04-03-wrong.png` | 第 04 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 04 | correct | `urinary-route-micturition-1280x800-N04-04-correct.png` | 第 04 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 05 | before | `urinary-route-micturition-1280x800-N05-01-before.png` | 第 05 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 05 | hint | `urinary-route-micturition-1280x800-N05-02-hint.png` | 第 05 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 05 | correct | `urinary-route-micturition-1280x800-N05-04-correct.png` | 第 05 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 06 | before | `urinary-route-micturition-1280x800-N06-01-before.png` | 第 06 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 06 | hint | `urinary-route-micturition-1280x800-N06-02-hint.png` | 第 06 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 06 | wrong | `urinary-route-micturition-1280x800-N06-03-wrong.png` | 第 06 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 06 | correct | `urinary-route-micturition-1280x800-N06-04-correct.png` | 第 06 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | end | end | `urinary-route-micturition-1280x800-end.png` | 結尾三格遮圖作答完成：呈現完整心智圖與通關結語 |
| 1280x800 | transition | transition | `urinary-route-micturition-1280x800-transition.png` | 過渡激勵頁面：顯示「準備考核」與過渡激勵語 |

### `fluid-compartments`

| 裝置尺寸 | 節點／關卡 | 階段 | 截圖檔名 | 畫面描述 |
|---|---|---|---|---|
| 390x844 | 01 | before | `fluid-compartments-390x844-N01-01-before.png` | 第 01 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 01 | hint | `fluid-compartments-390x844-N01-02-hint.png` | 第 01 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 01 | wrong | `fluid-compartments-390x844-N01-03-wrong.png` | 第 01 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 01 | correct | `fluid-compartments-390x844-N01-04-correct.png` | 第 01 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 02 | before | `fluid-compartments-390x844-N02-01-before.png` | 第 02 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 02 | hint | `fluid-compartments-390x844-N02-02-hint.png` | 第 02 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 02 | wrong | `fluid-compartments-390x844-N02-03-wrong.png` | 第 02 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 02 | correct | `fluid-compartments-390x844-N02-04-correct.png` | 第 02 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 03 | before | `fluid-compartments-390x844-N03-01-before.png` | 第 03 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 03 | hint | `fluid-compartments-390x844-N03-02-hint.png` | 第 03 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 03 | wrong | `fluid-compartments-390x844-N03-03-wrong.png` | 第 03 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 03 | correct | `fluid-compartments-390x844-N03-04-correct.png` | 第 03 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 04 | before | `fluid-compartments-390x844-N04-01-before.png` | 第 04 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 04 | hint | `fluid-compartments-390x844-N04-02-hint.png` | 第 04 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 04 | wrong | `fluid-compartments-390x844-N04-03-wrong.png` | 第 04 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 04 | correct | `fluid-compartments-390x844-N04-04-correct.png` | 第 04 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 05 | before | `fluid-compartments-390x844-N05-01-before.png` | 第 05 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 05 | hint | `fluid-compartments-390x844-N05-02-hint.png` | 第 05 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 05 | wrong | `fluid-compartments-390x844-N05-03-wrong.png` | 第 05 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 05 | correct | `fluid-compartments-390x844-N05-04-correct.png` | 第 05 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 06 | before | `fluid-compartments-390x844-N06-01-before.png` | 第 06 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 06 | hint | `fluid-compartments-390x844-N06-02-hint.png` | 第 06 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 06 | wrong | `fluid-compartments-390x844-N06-03-wrong.png` | 第 06 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 06 | correct | `fluid-compartments-390x844-N06-04-correct.png` | 第 06 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | end | end | `fluid-compartments-390x844-end.png` | 結尾三格遮圖作答完成：呈現完整心智圖與通關結語 |
| 390x844 | transition | transition | `fluid-compartments-390x844-transition.png` | 過渡激勵頁面：顯示「準備考核」與過渡激勵語 |
| 1280x800 | 01 | before | `fluid-compartments-1280x800-N01-01-before.png` | 第 01 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 01 | hint | `fluid-compartments-1280x800-N01-02-hint.png` | 第 01 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 01 | wrong | `fluid-compartments-1280x800-N01-03-wrong.png` | 第 01 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 01 | correct | `fluid-compartments-1280x800-N01-04-correct.png` | 第 01 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 02 | before | `fluid-compartments-1280x800-N02-01-before.png` | 第 02 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 02 | hint | `fluid-compartments-1280x800-N02-02-hint.png` | 第 02 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 02 | wrong | `fluid-compartments-1280x800-N02-03-wrong.png` | 第 02 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 02 | correct | `fluid-compartments-1280x800-N02-04-correct.png` | 第 02 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 03 | before | `fluid-compartments-1280x800-N03-01-before.png` | 第 03 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 03 | hint | `fluid-compartments-1280x800-N03-02-hint.png` | 第 03 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 03 | wrong | `fluid-compartments-1280x800-N03-03-wrong.png` | 第 03 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 03 | correct | `fluid-compartments-1280x800-N03-04-correct.png` | 第 03 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 04 | before | `fluid-compartments-1280x800-N04-01-before.png` | 第 04 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 04 | hint | `fluid-compartments-1280x800-N04-02-hint.png` | 第 04 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 04 | wrong | `fluid-compartments-1280x800-N04-03-wrong.png` | 第 04 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 04 | correct | `fluid-compartments-1280x800-N04-04-correct.png` | 第 04 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 05 | before | `fluid-compartments-1280x800-N05-01-before.png` | 第 05 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 05 | hint | `fluid-compartments-1280x800-N05-02-hint.png` | 第 05 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 05 | wrong | `fluid-compartments-1280x800-N05-03-wrong.png` | 第 05 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 05 | correct | `fluid-compartments-1280x800-N05-04-correct.png` | 第 05 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 06 | before | `fluid-compartments-1280x800-N06-01-before.png` | 第 06 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 06 | hint | `fluid-compartments-1280x800-N06-02-hint.png` | 第 06 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 06 | wrong | `fluid-compartments-1280x800-N06-03-wrong.png` | 第 06 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 06 | correct | `fluid-compartments-1280x800-N06-04-correct.png` | 第 06 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | end | end | `fluid-compartments-1280x800-end.png` | 結尾三格遮圖作答完成：呈現完整心智圖與通關結語 |
| 1280x800 | transition | transition | `fluid-compartments-1280x800-transition.png` | 過渡激勵頁面：顯示「準備考核」與過渡激勵語 |

### `water-sodium-regulation`

| 裝置尺寸 | 節點／關卡 | 階段 | 截圖檔名 | 畫面描述 |
|---|---|---|---|---|
| 390x844 | 01 | before | `water-sodium-regulation-390x844-N01-01-before.png` | 第 01 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 01 | hint | `water-sodium-regulation-390x844-N01-02-hint.png` | 第 01 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 01 | wrong | `water-sodium-regulation-390x844-N01-03-wrong.png` | 第 01 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 01 | correct | `water-sodium-regulation-390x844-N01-04-correct.png` | 第 01 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 02 | before | `water-sodium-regulation-390x844-N02-01-before.png` | 第 02 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 02 | hint | `water-sodium-regulation-390x844-N02-02-hint.png` | 第 02 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 02 | wrong | `water-sodium-regulation-390x844-N02-03-wrong.png` | 第 02 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 02 | correct | `water-sodium-regulation-390x844-N02-04-correct.png` | 第 02 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 03 | before | `water-sodium-regulation-390x844-N03-01-before.png` | 第 03 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 03 | hint | `water-sodium-regulation-390x844-N03-02-hint.png` | 第 03 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 03 | wrong | `water-sodium-regulation-390x844-N03-03-wrong.png` | 第 03 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 03 | correct | `water-sodium-regulation-390x844-N03-04-correct.png` | 第 03 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 04 | before | `water-sodium-regulation-390x844-N04-01-before.png` | 第 04 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 04 | hint | `water-sodium-regulation-390x844-N04-02-hint.png` | 第 04 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 04 | wrong | `water-sodium-regulation-390x844-N04-03-wrong.png` | 第 04 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 04 | correct | `water-sodium-regulation-390x844-N04-04-correct.png` | 第 04 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 05 | before | `water-sodium-regulation-390x844-N05-01-before.png` | 第 05 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 05 | hint | `water-sodium-regulation-390x844-N05-02-hint.png` | 第 05 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 05 | wrong | `water-sodium-regulation-390x844-N05-03-wrong.png` | 第 05 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 05 | correct | `water-sodium-regulation-390x844-N05-04-correct.png` | 第 05 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 06 | before | `water-sodium-regulation-390x844-N06-01-before.png` | 第 06 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 06 | hint | `water-sodium-regulation-390x844-N06-02-hint.png` | 第 06 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 06 | wrong | `water-sodium-regulation-390x844-N06-03-wrong.png` | 第 06 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 06 | correct | `water-sodium-regulation-390x844-N06-04-correct.png` | 第 06 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | end | end | `water-sodium-regulation-390x844-end.png` | 結尾三格遮圖作答完成：呈現完整心智圖與通關結語 |
| 390x844 | transition | transition | `water-sodium-regulation-390x844-transition.png` | 過渡激勵頁面：顯示「準備考核」與過渡激勵語 |
| 1280x800 | 01 | before | `water-sodium-regulation-1280x800-N01-01-before.png` | 第 01 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 01 | hint | `water-sodium-regulation-1280x800-N01-02-hint.png` | 第 01 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 01 | wrong | `water-sodium-regulation-1280x800-N01-03-wrong.png` | 第 01 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 01 | correct | `water-sodium-regulation-1280x800-N01-04-correct.png` | 第 01 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 02 | before | `water-sodium-regulation-1280x800-N02-01-before.png` | 第 02 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 02 | hint | `water-sodium-regulation-1280x800-N02-02-hint.png` | 第 02 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 02 | wrong | `water-sodium-regulation-1280x800-N02-03-wrong.png` | 第 02 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 02 | correct | `water-sodium-regulation-1280x800-N02-04-correct.png` | 第 02 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 03 | before | `water-sodium-regulation-1280x800-N03-01-before.png` | 第 03 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 03 | hint | `water-sodium-regulation-1280x800-N03-02-hint.png` | 第 03 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 03 | wrong | `water-sodium-regulation-1280x800-N03-03-wrong.png` | 第 03 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 03 | correct | `water-sodium-regulation-1280x800-N03-04-correct.png` | 第 03 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 04 | before | `water-sodium-regulation-1280x800-N04-01-before.png` | 第 04 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 04 | hint | `water-sodium-regulation-1280x800-N04-02-hint.png` | 第 04 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 04 | wrong | `water-sodium-regulation-1280x800-N04-03-wrong.png` | 第 04 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 04 | correct | `water-sodium-regulation-1280x800-N04-04-correct.png` | 第 04 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 05 | before | `water-sodium-regulation-1280x800-N05-01-before.png` | 第 05 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 05 | hint | `water-sodium-regulation-1280x800-N05-02-hint.png` | 第 05 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 05 | wrong | `water-sodium-regulation-1280x800-N05-03-wrong.png` | 第 05 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 05 | correct | `water-sodium-regulation-1280x800-N05-04-correct.png` | 第 05 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 06 | before | `water-sodium-regulation-1280x800-N06-01-before.png` | 第 06 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 06 | hint | `water-sodium-regulation-1280x800-N06-02-hint.png` | 第 06 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 06 | wrong | `water-sodium-regulation-1280x800-N06-03-wrong.png` | 第 06 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 06 | correct | `water-sodium-regulation-1280x800-N06-04-correct.png` | 第 06 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | end | end | `water-sodium-regulation-1280x800-end.png` | 結尾三格遮圖作答完成：呈現完整心智圖與通關結語 |
| 1280x800 | transition | transition | `water-sodium-regulation-1280x800-transition.png` | 過渡激勵頁面：顯示「準備考核」與過渡激勵語 |

### `electrolyte-balance`

| 裝置尺寸 | 節點／關卡 | 階段 | 截圖檔名 | 畫面描述 |
|---|---|---|---|---|
| 390x844 | 01 | before | `electrolyte-balance-390x844-N01-01-before.png` | 第 01 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 01 | hint | `electrolyte-balance-390x844-N01-02-hint.png` | 第 01 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 01 | wrong | `electrolyte-balance-390x844-N01-03-wrong.png` | 第 01 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 01 | correct | `electrolyte-balance-390x844-N01-04-correct.png` | 第 01 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 02 | before | `electrolyte-balance-390x844-N02-01-before.png` | 第 02 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 02 | hint | `electrolyte-balance-390x844-N02-02-hint.png` | 第 02 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 02 | wrong | `electrolyte-balance-390x844-N02-03-wrong.png` | 第 02 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 02 | correct | `electrolyte-balance-390x844-N02-04-correct.png` | 第 02 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 03 | before | `electrolyte-balance-390x844-N03-01-before.png` | 第 03 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 03 | hint | `electrolyte-balance-390x844-N03-02-hint.png` | 第 03 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 03 | wrong | `electrolyte-balance-390x844-N03-03-wrong.png` | 第 03 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 03 | correct | `electrolyte-balance-390x844-N03-04-correct.png` | 第 03 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 04 | before | `electrolyte-balance-390x844-N04-01-before.png` | 第 04 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 04 | hint | `electrolyte-balance-390x844-N04-02-hint.png` | 第 04 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 04 | wrong | `electrolyte-balance-390x844-N04-03-wrong.png` | 第 04 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 04 | correct | `electrolyte-balance-390x844-N04-04-correct.png` | 第 04 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 05 | before | `electrolyte-balance-390x844-N05-01-before.png` | 第 05 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 05 | hint | `electrolyte-balance-390x844-N05-02-hint.png` | 第 05 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 05 | wrong | `electrolyte-balance-390x844-N05-03-wrong.png` | 第 05 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 05 | correct | `electrolyte-balance-390x844-N05-04-correct.png` | 第 05 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | 06 | before | `electrolyte-balance-390x844-N06-01-before.png` | 第 06 關作答前畫面：顯示題目、圖示與作答選項 |
| 390x844 | 06 | hint | `electrolyte-balance-390x844-N06-02-hint.png` | 第 06 關提示畫面：展開 💡提示 提示文字 |
| 390x844 | 06 | wrong | `electrolyte-balance-390x844-N06-03-wrong.png` | 第 06 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 390x844 | 06 | correct | `electrolyte-balance-390x844-N06-04-correct.png` | 第 06 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 390x844 | end | end | `electrolyte-balance-390x844-end.png` | 結尾三格遮圖作答完成：呈現完整心智圖與通關結語 |
| 390x844 | transition | transition | `electrolyte-balance-390x844-transition.png` | 過渡激勵頁面：顯示「準備考核」與過渡激勵語 |
| 1280x800 | 01 | before | `electrolyte-balance-1280x800-N01-01-before.png` | 第 01 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 01 | hint | `electrolyte-balance-1280x800-N01-02-hint.png` | 第 01 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 01 | wrong | `electrolyte-balance-1280x800-N01-03-wrong.png` | 第 01 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 01 | correct | `electrolyte-balance-1280x800-N01-04-correct.png` | 第 01 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 02 | before | `electrolyte-balance-1280x800-N02-01-before.png` | 第 02 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 02 | hint | `electrolyte-balance-1280x800-N02-02-hint.png` | 第 02 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 02 | wrong | `electrolyte-balance-1280x800-N02-03-wrong.png` | 第 02 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 02 | correct | `electrolyte-balance-1280x800-N02-04-correct.png` | 第 02 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 03 | before | `electrolyte-balance-1280x800-N03-01-before.png` | 第 03 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 03 | hint | `electrolyte-balance-1280x800-N03-02-hint.png` | 第 03 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 03 | wrong | `electrolyte-balance-1280x800-N03-03-wrong.png` | 第 03 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 03 | correct | `electrolyte-balance-1280x800-N03-04-correct.png` | 第 03 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 04 | before | `electrolyte-balance-1280x800-N04-01-before.png` | 第 04 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 04 | hint | `electrolyte-balance-1280x800-N04-02-hint.png` | 第 04 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 04 | wrong | `electrolyte-balance-1280x800-N04-03-wrong.png` | 第 04 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 04 | correct | `electrolyte-balance-1280x800-N04-04-correct.png` | 第 04 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 05 | before | `electrolyte-balance-1280x800-N05-01-before.png` | 第 05 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 05 | hint | `electrolyte-balance-1280x800-N05-02-hint.png` | 第 05 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 05 | wrong | `electrolyte-balance-1280x800-N05-03-wrong.png` | 第 05 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 05 | correct | `electrolyte-balance-1280x800-N05-04-correct.png` | 第 05 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | 06 | before | `electrolyte-balance-1280x800-N06-01-before.png` | 第 06 關作答前畫面：顯示題目、圖示與作答選項 |
| 1280x800 | 06 | hint | `electrolyte-balance-1280x800-N06-02-hint.png` | 第 06 關提示畫面：展開 💡提示 提示文字 |
| 1280x800 | 06 | wrong | `electrolyte-balance-1280x800-N06-03-wrong.png` | 第 06 關答錯重來畫面：顯示錯誤回饋與嚴格重試按鈕 |
| 1280x800 | 06 | correct | `electrolyte-balance-1280x800-N06-04-correct.png` | 第 06 關答對通關畫面：顯示正向回饋與下一關按鈕 |
| 1280x800 | end | end | `electrolyte-balance-1280x800-end.png` | 結尾三格遮圖作答完成：呈現完整心智圖與通關結語 |
| 1280x800 | transition | transition | `electrolyte-balance-1280x800-transition.png` | 過渡激勵頁面：顯示「準備考核」與過渡激勵語 |

