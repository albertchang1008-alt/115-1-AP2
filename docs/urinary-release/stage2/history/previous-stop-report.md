# 泌尿階段二報告（2026-10-16，失敗停點）

**本輪未完成。B 段新增的視覺驗證腳本發生例外，依教師「任何一步失敗就停下回報」已停止；未修補、未重跑、未執行後續步驟、未 commit。**

- 工作目錄：`~/.codex/worktrees/urinary-stage1-2026-10-16/課程平台1.0`；分支 `feature/urinary-infographics`；HEAD 仍為 `1a8d405`。
- 原根目錄既有追蹤檔及原 PNG SHA 不變，來源卡不變。所有未完成程式、內容及文件保留本 worktree 未提交，未 stash 或刪除。

## 已完成的 A 段

- 六份節點 reference 與 credits[0] 改為中文書名、章名與合併／去重頁碼。無來源的尿路 node-06 仍保留「待教師核可卡片」。
- filtration-clearance node-03 clinical 只將開頭「題目若指定比較血漿與濾液，」換成「比較血漿與濾液時，」，後半句不變。
- A 執行完畢即以六份完整 JSON 比對：還原 reference、credits[0] 及上述 clinical 後，與 1a8d405 完全相同；sources 每筆保留原值。結果在 stage2/a-comparison.json，六份 after-a.json 保留 B 開始前的快照。這項通過只適用 A 當下，B 的額外圖位／圖說變更另列如下。

## B 段做到哪裡

- 已新增 kidney-only 產生器 scripts/kidney-anatomy-figures.py，以及七張 kidney-anatomy-overview／node-01…06.svg。原始 PNG 不壓縮、不裁切、不重畫；圖層以原生 SVG 文字、引線及圓點疊加。
- 產生器在寫圖時檢查每張標籤陣列與 spec 白名單相同：節點依序 5／4／5／4／8／3 個，總覽 9 個，未增列腎上腺。此為資料白名單檢查，尚非圖面驗收。
- 桌機設計為中文直接標籤；手機設計為錨點旁編號與圖下完整詞對照表。響應式 SVG 沿用呼吸圖的 inverse-Y 配對方式，但本輪尚未完成實際比例檢查。
- FOCUS_STYLE 單一變數目前 red；另一樣式 block 集中於同一設定表，供下一輪核可後切換。總覽依 state-1／2／3 切紅字；無新增流程箭頭（本份 spec 未指定需另畫的物質／調節箭頭，引線不是流向箭頭）。
- 預定 35 條引線，另 3 個總覽功能說明不指向特定構造；不將腎素、紅血球生成素或活化維生素D誤畫為底圖上的解剖構造。所有座標在 [預定錨點表](stage2/ANCHOR_TABLE.md) 及 anchors.json。**座標尚未完成圖面／語意驗收，不可當成核定錨點。**
- 圖面沿用逐圖備註：node-01 前面觀右腎標在身體右側；不標腎上腺；node-05 不用來教兩腎高低。尚待 Claude 以實際圖面核對位置。
- 只修改 kidney 的七個 figure 欄位、lab.intro、六個 caption 及原先稱未加標籤的 credits[1]；教學概念與題目未作 B 改題。這些變更尚待最終範圍與 schema 複核。
- `npm run materials:preview kidney-anatomy` 成功，僅更新該份本機 HTML；完整 log：stage2/kidney-preview.log。尚未呼叫 materials:shots。

## 失敗與停止原因

- 指令：`node scripts/kidney-anatomy-verify.mjs`，exit code **1**。
- 第一個 locator.evaluate 呼叫報：`locator.evaluate: TypeError: svg.getBoundingClientRect is not a function`。
- 原因是本輪新增腳本將 `this` 當成傳入的 SVG 元素；Playwright 的 locator.evaluate 應以函式第一參數接收元素。這是 Codex 寫的驗證腳本錯誤，不能據此認定教材圖面通過或不通過。
- 已保留原錯誤腳本及 visual-verify.log，不按一行修正後繼續重跑。依使用者停止要求，本輪不再執行實作或驗證。
- 驗證腳本 finally 在未捕獲例外時原先錯寫 ok=true；交接時已依 exit code 與 log 將 visual-verification.json 記為 ok=false／instrumentation_exception_before_first_case。這只是修正證據狀態，沒有修腳本或重驗。
- 實際完成圖面案例 **0**、正式截圖 **0**、錨點 crop **0**。字框、引線互疊、錨點落點、手機12px／桌機13px、水平捲動、0 pageerror與圖片比例等檢查**均未完成**。
- 後續 materials:shots、兩站共用教材測試與 git diff --check 尚未執行，不宣稱通過。沒有使用 skip／no-verify 逃避測試；因明確停止要求而未進入收工提交步驟。

## C 狀態

**D2 仍待教師。** 開工讀卡 urine-physical-properties 仍為 draft，收工 SHA 不變；沒有補 node-06、foundation-q06 或 case-q05，也沒有改卡片／進度。A 的出處統一不變更該佔位節點及相關缺題。

## 文件、提交與範圍

- 兩份要求的交辦文件已原樣複製到本 worktree 的 docs/，SHA 相同，待後續與成果一起提交：CODEX_TASK_URINARY_STAGE2_2026-10-16.md、URINARY_STAGE1_CLAUDE_RECHECK_2026-10-16.md。
- handoff 與 DEVELOPMENT_LOG 已更新失敗停點；本輪**尚未 commit**，以免在未跑完必需驗證下提交為完成品。原單次提交額度尚未使用。
- 不 build、不登錄、不寫 Excel／Sheet、不 push、不合併 main、不部署、不改卡片或共用驗證器、不做體液四份。
- 下一輪需使用者明確指示續作，才修驗證器並重跑 B；通過全部指定檢查後，才將目前保留的 A／B／文件一次 commit。
