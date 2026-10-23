# Codex 任務：酸鹼 v3 獨立覆核＋三個小修 2026-10-21

v3 實作是 Antigravity 做的（9d35b091，分支 codex/acidbase-full）。你不是作者，請先覆核，再修正。

## A. 覆核
- 自己重跑：SCRIPT_DIFF（對 v3 腳本）、content-check、layout-check、測試。
- 親自操作一輪：開場 → 第 1–6 關（各答錯一次）→ 結尾 → 過渡頁 → 考核。
- 只寫看到的事，寫在 ux-v3/CODEX_REVIEW.md。

## B. 小修（Claude 抽查發現）
1. 過渡頁頂端的標題不能再是「結尾｜一滴酸的旅程」，改成「準備考核」。
2. 第 5 關：H⁺、HCO₃⁻ 的標籤要緊貼各自箭頭的正上方，跟著箭頭一起翻轉；箭頭本體要完整可見。
3. 清除程式資料裡已經不用的舊版大學程度小檢核（micro-01 等舊 stem、options），並確認畫面與測試都不再引用。
- 加上 A 覆核發現的任何問題。

## 交付
- SCRIPT_DIFF 對 v3 PASS；全部測試通過。
- 附修改前、後截圖：390×844 的過渡頁、第 5 關。
- commit 訊息帶 [Codex]。不 push main、不部署、不合併。
- 完成後，CODEX_QUEUE #6h 備註補「Codex 覆核＋小修完成」，狀態維持「停-等教師」；跑 devlog；報告開頭寫「給 Claude 的摘要」。
