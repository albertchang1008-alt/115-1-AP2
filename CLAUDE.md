# 給 AI agent 的指示

這是「課程平台1.0」（115-1 AP2 課程平台）的程式碼庫。開始任何工作之前：

1. 先讀 `handoff.md`——目前版本、固定決策、進行中的分支與待辦都記在那裡，
   不要只靠對話紀錄猜現況。
2. 開始改動前，先用 `git branch --show-current` 確認目前在哪個分支；未經
   使用者明確同意，不要 push、合併或部署到 `main`（正式環境，push 到 main
   會自動觸發 GitHub Pages 上線）。
3. **完成一段工作之後（不論是回答問題、改程式、寫文件），必須更新
   `handoff.md`**：把新的決策、這次做了什麼變更、目前分支/commit 狀態、
   下一步待辦寫進去，覆蓋掉過期內容。沒更新這份文件就結束工作＝沒有交接，
   下一個接手的 agent（不限 Claude，任何 AI coding agent）會從過期資訊
   開始工作。
4. 版本異動歷史記在 `DEVELOPMENT_LOG.md`（新版本寫最上面），跟 `handoff.md`
   分工不同：`DEVELOPMENT_LOG.md` 是流水帳，`handoff.md` 是「現在的狀態」。
5. Commit message 結尾附上身分標註（例如 Claude 系列用
   `Co-Authored-By: <model 名稱> <noreply@anthropic.com>`），方便回溯是哪個
   agent、哪次做的改動。不要用 `--no-verify`、不要強制推送、不要略過測試。

6. `handoff.md` 保持精簡（約 150 行內，只寫現況）；完成的項目移出並記入 `DEVELOPMENT_LOG.md`。
   舊交接歷史在 `docs/archive/`，平常不用讀。

以上規則對任何在這個 repo 工作的 AI agent 一律適用。
