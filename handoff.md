# 專案交接
目前版本：1.11.0；本工作樹分支 codex/acidbase-full，自 apply-kit 凍結 a5773cc 建立。酸鹼樣張僅本機預覽，未發布。

本工作樹同步2026-10-20現行規則；唯一現況與週誌維護於原根目錄 /Users/HHC/Documents/ChatGPT/課程平台1.0 的 CODEX_QUEUE.md 與 docs/devlog/，不以此工作樹舊佇列猜測。

## 給接手的 AI agent
1. 開工讀 CLAUDE.md、handoff.md、docs/AI_WORKFLOW_PLAN.md 與 CODEX_QUEUE.md；由上往下取第一件「可做」。
2. 改動前跑 git branch --show-current；確認工作目錄與交辦一致，保留他人未提交工作。
3. Codex 主做與自我檢查；Claude 審內容／上線把關／裁定；卡片第二 AI 驗證交 Antigravity，不能驗自己的卡，Claude 抽10%。
4. 需要 Claude 或教師時，在佇列改成停點並換下一件；內容取捨、reviewed、發布、部署、勾班由教師裁定。
5. 收工用 python3 scripts/devlog.py add 寫本週短誌，改寫自己的佇列列；handoff 只有規則改變時才改。
6. 每份報告開頭「給 Claude 的摘要」≤15行；跑 python3 scripts/check_handoff.py，沒過不收工；歷史用 grep -rn 關鍵字 docs/devlog/。

## 鐵則
1. 未經教師明確同意，不 push、合併或部署 main；push main 會自動上線。
2. 不略過測試、不用 --no-verify、不強制推送；commit 結尾 [Codex] 或對應 agent 身分。
3. 完整固定決策1–24原文在 docs/DECISIONS.md；有疑義先查原文，不自行改語意。
4. 已上傳題庫的 Excel 既有列不得改、刪或重排；新題僅在末尾增列，教師核可後才寫入；題庫題必須能獨立作答，互動練習與需看圖題不入題庫。
5. 卡片 reviewed 只能由教師核可；未核可卡不得自行補教材內容，節點標待卡片。
6. 新教材先 preview＋shots 交教師看畫面；核可後才 build、登錄及題庫增列，不直接改 public/materials HTML。
7. 一律台灣課本用語；學生畫面不留草稿警告，藥物／疾病題的國考延伸依固定決策24。
8. undefined 不寫 Firestore；成績由後端私有答案表重批；完整測驗才更新最高分／完成度。
9. 同步只讀課程同名分頁、FALSE略過、只新增／更新；名冊、學生資料與正式場次遵守交辦範圍。
10. Sheet「單元」是 Chapter、「次單元」是 Unit；題目分類必做，選做設定在 Chapter／Activity。
11. 教材只送去識別學習事件；診斷只作教學線索，不判定猜題／認真。
12. handoff≤4000字、每行≤220字；佇列≤25件、每行≤300字；新誌≤5行／筆、每行≤220字，由檢查腳本守門。

13. 驗收截圖與原始輸出只放 repo 外證據資料夾，保存 7 天；每次開工先跑 `python3 scripts/prune-evidence.py`（dry-run），有可刪項目時跑 `--apply` 並在週誌記錄刪了哪些日期、多少 MB。
14. 新報告註明「截圖保存至 <日期+7>」；過期證據刪除後，不必修改舊報告的截圖連結。

## 部署方式（教師執行）
```sh
zsh -ilc 'source ~/.nvm/nvm.sh && nvm use 22.23.2 >/dev/null && bash ~/Documents/ChatGPT/課程平台1.0/scripts/deploy.sh'
```
- deploy.sh：npm run check → 備份 → Functions → 快轉push main；Firebase帳號 hhchang@ctcn.edu.tw。
- VERSION／兩端package與lock／shared/version.ts／apps-script/version.gs／public/version.json／三份文件版本行須同步（version:sync／version:check）。
- 既有本機資料不要納入：public/materials/coagulation-v1、html五份RTF、html/心電圖與心律不整解析.html；exclude現況保留。
