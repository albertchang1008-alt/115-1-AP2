# Codex 任務：酸鹼互動資訊圖表｜完整樣張（含內建心智圖）2026-10-20

先讀：handoff.md、docs/DECISIONS.md（10/20 角色、10/20 酸鹼、10/20 心智圖、決策 24/26）、docs/urinary-release/DESIGN_ACIDBASE_FINAL.md（已經 Claude 核對：94 處原句 PASS）。

## 目標
依 DESIGN_ACIDBASE_FINAL.md，把 materials-src/acid-base-homeostasis 做成一份完整可操作的樣張。它是之後其他 9 份的範本。

## 範圍
1. **六個節點 N01–N06：** 按設計稿實作。N05 是「這是錯的圖」找錯、翻轉，並與答案一起送出。看圖任務作為答題門檻；不做句子排序。
2. **內建心智圖：** 放在已定稿版面的心智圖區塊，不另開頁。
   - 學生每完成一個節點，心智圖就多一段連結。連結由學生補（選方向、選 ↑ 或 ↓、或補缺節點），不能自由拖拉。節點上限 8。
   - 結尾先把圖遮住，讓學生憑記憶做「一滴酸追蹤」，再揭開核對。
   - 關聯資料直接重用 docs/classroom/mindmap-relay/acidbase.relay.json 的 nodes／edges。若需要修改，改同一份，不另建第二份。
3. **遊戲化：** 按設計稿（急診病人情境、找錯、配對題池），不加計時壓力。
4. **兩階段問答：** 按設計稿的 5 組配對共 10 題，每輪 3 題兩層次＋2 題單層次。每題都要能獨立作答、不看圖。過關＝第二關全對＋心智圖完成。
5. **版面：** 沿用已凍結的 apply-kit 版面，包括 ↑↓ 徽章、名詞框、流向動畫、一屏顯示、不放大。

## 驗證
- 跑 `scripts/apply-content-check.mjs`、`scripts/apply-layout-check.mjs`（8 種尺寸 × 各狀態）和現有測試，全部通過才交。
- 附截圖：每個節點的作答前與作答後、心智圖逐步長出的 3 個階段、結尾的遮圖與揭開。
- 預覽連結寫在 `docs/urinary-release/acidbase-full/PREVIEW.md`。

## 禁止
不 push main、不部署、不合併、不改 Excel、不用 --no-verify。內容只能取自 reviewed 卡；不准自己編數字。

## 完成後
- 在分支 `codex/acidbase-full` 上 commit（含 [Codex]）。
- CODEX_QUEUE #6h 改「停-等Antigravity」，備註寫「Antigravity 截圖覆核」。報告開頭寫「給 Claude 的摘要」（≤15 行）。
- `python3 scripts/devlog.py add ...`
