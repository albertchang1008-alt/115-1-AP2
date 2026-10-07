# Codex 交辦（2026-10-07，Claude 開單，教師已核准實作）

開始前照 `AGENTS.md`：先讀 `handoff.md`、確認分支；不 push、不合併、不部署 main；每段工作完成就更新 `handoff.md`（≤150 行）與 `DEVELOPMENT_LOG.md`；commit 結尾 `[Codex]`。

兩項工作**依序做、各開各的分支**，都從 `feature/1.7.0-practice-modes`（目前 HEAD）分出。開工前先 `git status` 確認工作目錄；`handoff.md`、`DEVELOPMENT_LOG.md` 若有未提交的交接修改，先 commit（訊息「docs: 交接更新 [Claude]」）再開分支。

## 工作 1：呼吸系統 7 份資訊圖表＋Q3 六題疑點研究

- 規格：`docs/RESPIRATORY_INFOGRAPHICS_SPEC.md`（以磁碟上這份為準，2026-10-07 下午已更新：左右主支氣管併回 ①）。
- 分支：`feature/respiratory-infographics`。
- **A 部分**：7 份 `materials:preview`＋`materials:shots` 全部做完就**停下來回報，等教師看畫面**（固定決策 22）。教師核可前不要 `materials:build`、不要寫 Excel、不要登錄教材目錄。
- **B 部分**：Q3-2／28／39／49／52／60 疑點研究，只產出報告 `../072026 新的專案/05_review/Q3疑點研究_6題.md`，不改任何 Excel、卡片或進度檔。B 的結論不要套進 A。
- 規格第 A2 節「不碰的內容」與文末「正式教材不寫」的項目（ARDS 非心因性、斜角肌、氣管 12–14 cm、70 mmHg、高山 2,3-DPG 等）一律不寫；這些已改由國考延伸補充教材處理，不在本次範圍。

## 工作 2：1.7.1 完成度看板改版

- 規格：`docs/COMPLETION_BOARD_1.7.1_SPEC.md`。
- 分支：`feature/1.7.1-completion-board`（從 `feature/1.7.0-practice-modes` 分出，**不要**從工作 1 的分支分出）。
- 只改前端；新增 `shared/` 純函式 `chapterCellState` 與測試；版本號 1.7.1。
- 完成後寫 `docs/COMPLETION_BOARD_1.7.1_ACCEPTANCE.md`（含 1280／390 截圖與一致性檢查結果），交 Claude 驗收。

## 本次不做

- 國考延伸補充教材（兩份）與補建卡：要等 Claude 驗完第四輪 26 張卡後才開工，屆時另開單。
- Q3／Q4 132 題上平台：教師決定先不發布。

## 回報格式

每項工作完成時回報：分支／commit、截圖或報告路徑、測試結果、任何規格疑問（列出，不要自行改內容）。
