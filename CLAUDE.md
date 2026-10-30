# 給 AI agent 的指示

這是「課程平台1.0」（115-1 AP2 課程平台）的程式碼庫；CLAUDE.md 與 AGENTS.md 規則相同。

1. 開工讀 handoff.md、docs/AI_WORKFLOW_PLAN.md、CODEX_QUEUE.md；現況只看佇列，不靠對話猜測。
2. 改動前用 git branch --show-current 確認分支；未經教師明確同意，不 push、合併或部署 main（push main 自動上線）。
3. 收工時：①用 `python3 scripts/devlog.py add "<標題>" "<內容>"` 寫本週 devlog；②只改寫 CODEX_QUEUE.md 自己工作的那一列（完成刪列，新工作加列），handoff.md 除非規則改變否則不動；③跑 `python3 scripts/check_handoff.py`，沒過不准收工。
4. 開工不讀 DEVELOPMENT_LOG.md；需要查歷史時只用 `grep -rn 關鍵字 docs/devlog/`，讀命中的附近幾行。新紀錄每筆≤5行、每行≤220字；細節寫報告，索引不寫內容。
5. Commit message 結尾附 agent 身分（Codex 用 [Codex]）；不用 --no-verify、不強制推送、不略過測試。
6. handoff.md≤4000字、每行≤220字；CODEX_QUEUE.md每行≤300字且≤25件，由 scripts/check_handoff.py 檢查。固定決策全文在 docs/DECISIONS.md；舊交接在 docs/archive/，平常不讀。
7. Codex 從上往下執行第一件「可做」；缺交辦檔先自寫。遇 Claude／教師停點標記後換下一件；每份報告開頭「給 Claude 的摘要」≤15行，列檔案、PASS／FAIL、偏離與最多5個抽查項目。
8. 現況只寫 CODEX_QUEUE.md；週誌用 docs/devlog/<ISO年>-W<週>.md，日期採 Asia/Taipei。不改教師 reviewed，不自行發布／部署／勾班。
9. 交棒：收工時給教師的最後回覆末尾，附一個標題「交給下一個 AI」的程式碼區塊，教師可整段貼給下一棒（Codex／Antigravity／Claude）。內容須獨立可讀：對象、佇列編號、要讀的檔（handoff、佇列、交辦、報告）、要做什麼、限制、完成後佇列怎麼改，並要求對方同樣附交棒 prompt；停在教師時改寫「給教師的待辦」。不得放期中考題文字或學生個資。
10. 學生可見的文字一律符合 docs/READABILITY_STANDARD.md（手機390寬：內文≥18px、選項≥18px且點擊高≥44px、跟隨平台字級、特大不溢出、只放大不縮小）；交付須附390寬預設＋特大截圖與自動檢查結果，未達標不得交驗收。

11. 測試與驗證腳本必須能在 GitHub Actions（Ubuntu、非 root）執行：不得寫死 /private/tmp、/Users 等 macOS 或個人路徑，暫存一律用 os.tmpdir()／RUNNER_TEMP；交付前註明已用 Linux 環境跑過 npm run check（10/30 1.15.0 曾因此建置失敗）。

以上規則對任何在這個 repo 工作的 AI agent 一律適用。
