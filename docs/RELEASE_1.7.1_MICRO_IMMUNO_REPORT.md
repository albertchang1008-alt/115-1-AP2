# 1.7.1 看板＋微免整合交件（2026-10-11）

教師已授權整合，完成後停在本機乾淨的 `codex/release-1.7.1-micro-immuno`；本次不 push、不執行 deploy.sh。工作目錄 `.worktrees/release-1.7.1-micro-immuno`，版本 1.7.1。

- 從看板 ed08854 開始，依序合併微免 465c375c40f9170559e01db6e3f2dee485ad82b7 與最新 origin/main 3f6d92574c0c29b64a3cad2a352e9ce4add4b962。只有第一個合併的 handoff.md 衝突：保留最新交接並改為1.7.1；main 程式碼自動合併後核對，完成度看板與名冊同步錯誤詳情均完整保留。
- 微免原未推送 9b301be 已 amend 為 465c375c40f9170559e01db6e3f2dee485ad82b7：142張 PNG（約47MB）以 git rm --cached 移出版控、加入.gitignore，本機檔案保留在微免原 worktree。該提交新增 PNG／WebP 截圖 **0**，教材內嵌圖不改。Release 不複製此截圖資料夾；截圖集頁面與報告註明只供本機使用。其他既有教材／看板的歷史圖片不在本次移除範圍。
- 兩份微免 catalog 及正式 HTML 已保留：細菌6節點／11題、免疫8節點／11題；SHA 與教師核可輸出相同，dist內發布副本也相同。Excel完全等同Claude核可檔，共249題、無重複ID；細菌229–239、免疫240–250，沒有新增或修改題目。
- 看板來源檔與ed08854相同；Functions名冊修正及回歸測試與最新main相同，RosterPage錯誤詳情UI逐字相同。未納入其他worktree未核可的呼吸／血流教材來源或正式輸出。
- npm ci、functions ci、materials:sync及完整 npm run check 成功：**前端140／140、Functions29／29，0失敗、0跳過；版本一致1.7.1，兩端build成功，34個後端入口載入成功（未連雲端）**。完整紀錄：[check](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/micro-immuno-review/release-check.txt)、[結構核對](micro-immuno-review/release-integration-verification.json)。npm ci沿既有lockfile提示既有依賴漏洞，本次未擅自升級依賴。

下一步：教師在此release worktree執行 `bash scripts/deploy.sh`。腳本會重新確認最新main祖先與乾淨狀態、安裝及check、備份分支、部署Functions及推送main；確認GitHub Actions與線上版本後才算上線。本次沒有任何推送、雲端部署或Google Sheet修改。
