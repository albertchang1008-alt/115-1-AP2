# 泌尿階段二報告（2026-10-16 續作，教材錨點不合格停點）

**本輪未完成。** 已修正本輪驗證腳本的 SVG 取用方式，但在實際總覽圖發現「後腹腔」錨點落在髂骨上緣，屬教材錨點錯位，依教師規則停止，不移動錨點或繼續 C。擷取腳本另發生 crop 範圍錯誤，亦保留證據。

工作位置：`~/.codex/worktrees/urinary-stage1-2026-10-16/課程平台1.0`，分支 `feature/urinary-infographics`，HEAD 仍為 `1a8d405`。A／B 未提交成果完整保留；本輪未 commit、未 push。兩份要求的交辦文件仍已複製在 docs/，尚待後續與成果一起提交。

## A. 六份共同小修（保留，不重做）

- 六份節點 reference 與 credits[0] 為中文書名、章名及合併去重頁碼；sources 保持原值。
- filtration-clearance node-03 clinical 只改指定開頭，後半句保持。
- A-only 的六份完整 JSON 比對已於前輪通過，除上述欄位之外與 1a8d405 一致；證據 stage2/a-comparison.json 及六份 after-a.json。
- 本次續作沒有再修改 A 的內容。尿路 content 與 A 後快照完整相同（resume-checks.json），未提前混入 C。

## B. kidney-anatomy 標籤層驗證（實際不合格，停止）

### 驗證腳本修正紀錄

1. 原錯誤：locator.evaluate 的量測函式以 this 取 SVG，導致 `svg.getBoundingClientRect is not a function`。
2. 第一次修正：改為 `measure(svg)` 由回呼第一參數接收 SVG；補例外寫入 errors，且必須完整 18 圖面案例、兩個尺寸才可 ok=true。增加初始頁截圖、所有文字框相撞及引線點越界檢查；原檢查與字級門檻沒有刪減或放寬。僅修改本輪新寫的 scripts/kidney-anatomy-verify.mjs，沒有改共用驗證器或測試。
3. 修正後重跑一次，另遇本輪擷取腳本錯誤：`page.screenshot: Clipped area is either empty or outside the resulting image`。這是 crop 擷取尚未完成的腳本錯誤，沒有據此宣稱圖面通過。
4. 本輪允許的兩次腳本修正目前只用 **1 次**。因同時已在圖面確認教材錨點不合格，不使用第二次修正繼續驗收，也不修教材後重跑。

原錯誤腳本／log／JSON 保存於 stage2/history/；第一次修正後 log 為 stage2/visual-verify-resume-1.log。visual-verification.json 保留例外並記 ok=false；沒有重複前輪 finally 誤寫成功的情況。

### 實際教材問題

- 圖位：總覽 overview，state-1，1280 桌機。
- 標籤：「後腹腔」。
- 底圖：IMG-kidney-anatomy-01.png。
- 原圖錨點座標：**(170, 510)**。
- 圖面所見：引線圓點落在左下方髂骨上緣／骨性區，沒有指向腹膜後方的腎周區域。
- 結論：屬教師明定須停止的「錨點錯位」。未改點位、未改底圖，留 Claude／教師判定下一步。
- 證據：[桌機總覽 state-1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/stage2/screenshots/1280-overview-state-1.png)、stage2/manual-review-failure.json。

### 本輪實際輸出與未完成項目

- 已有 1280 初始全頁截圖及 1280 總覽 state-1 圖面截圖。
- 已輸出 3 張 overview crop，但擷取程序未完成且範圍處理有錯，因此不宣稱這三張都能正確核對對應錨點；其餘 32 條引線尚無 crop。
- 腎臟標籤產生器、七張 SVG、35 條預定引線及三個不作解剖錨點的功能說明保持原樣。白名單資料比對前輪已過，但不等於幾何／錨點驗收。
- [預定錨點表](stage2/ANCHOR_TABLE.md) 與 anchors.json 仍保留；全部座標均尚未核定，尤其上述錯點不能再沿用為已驗收座標。
- 正式完整案例紀錄為 0（第一個案例在 crop 例外前未完成落盤）；沒有完成兩尺寸、三狀態、六節點的 20 張驗收組合，沒有執行標準 materials:shots。
- 字框／引線互疊、全圖越界、所有字級、水平捲動、0 pageerror、比例與紅字狀態切換等檢查未完成，均不宣稱通過。

## C. 尿路第六節（資格已確認，尚未實作）

- 開工已確認 frontmatter `review_status: reviewed`。
- 根目錄 todo_all.jsonl 的唯一 uid=urine-physical-properties 紀錄 `status: reviewed`。
- 完整狀態列、檔案路徑與 SHA 見 stage2/resume-checks.json；停止時卡片與 todo SHA 都與本輪開工相同，未修改卡片或進度。
- 因 B 已發現實際教材不合格而必須停止，本輪尚未開始 C。node-06 與兩題仍維持前輪狀態，未補數值、未清除 pendingSources，stats 未套用新指定內容。
- 不可將本報告的「已核可來源」誤讀為「C 已完成」。原 node-06、兩題、stats 與完整尿路驗證仍待下一輪。

## 規則與收工狀態

- 教師補充規則已寫入 handoff，之後各輪適用：本輪自寫驗證／擷取腳本錯誤最多修兩次，須保留錯誤與修法；不得刪減檢查；教材不合格立即停止，共用驗證器與測試不可改。
- 本輪依該停止條件未繼續 C，也未執行全庫節點稽核、兩站共用教材測試、git diff --check 或 commit；不宣稱這些檢查通過。
- 所有未完成成果與兩份交辦文件仍在 feature worktree 未提交，單次本機 commit 尚未使用；handoff 與 DEVELOPMENT_LOG 記錄最新停點。
- 未 build、未登錄 shared/materials.ts、未寫 Excel／Sheet、未 push、未合併 main、未部署、未改來源卡／todo、未做體液四份。
- 下一步需教師明確續作指示，包含是否修教材錨點；圖面合格後再完成 C、全部指定測試與一次本機 commit，停 Claude 複驗。
