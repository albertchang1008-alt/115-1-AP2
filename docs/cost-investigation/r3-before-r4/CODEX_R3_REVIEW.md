# 給 Claude 的摘要
- 結論：**獨立覆核未全過，暫不 commit／部署**；Claude 的六個程式／測試檔未修改。
- 位置：`.worktrees/reduce-function-costs`，分支 `codex/reduce-function-costs`，HEAD `2e60f08e`。
- Mac `npm run check` PASS：前端 190/190、Functions 61/61、版本／TypeScript／Vite 編譯通過，0 skipped。
- Codex 自寫獨立測試：7 PASS／1 FAIL／0 skipped；不是採信 Claude 的 32/32 結果。
- PASS：discard 僅兩碼；retry 六碼與無碼網路錯誤；其餘 hold；正常可寫本機時保留 ID、阻擋所有送出入口、重開恢復。
- PASS：學生 active/idle 為 2000/5000 ms；教師 2000/10000 ms，另以真實 visiblePoll＋假時鐘驗證閒置節奏。
- **P1：localStorage 寫入失敗＋hold 時仍顯示「已暫存、重開會送出」，實際重開後 completed 已無法恢復。**
- 證據：`CODEX_R3_AUDIT.txt` 的 `quota-plus-held` 與第 8 案；事件未持久化，重開後呼叫數仍為 1。
- 偏離：未達「全部通過才 commit」條件，因此不提交；未擅自修正，也未推送／部署。
- 抽查 1：`src/EventBatcher.ts:81–85` 忽略 persist() 的 false，仍走已暫存回呼。
- 抽查 2：`src/LearningBridge.ts:32`、`src/ResearchBridge.ts:14`、`src/Student.tsx:136–137` 的已暫存／重開提示。
- 抽查 3：`docs/cost-investigation/codex-r3-audit.test.ts` 與兩份完整測試輸出。
- #27 依交辦標「停-等教師」；部署裁定（先 Functions 後前端）暫緩，需先交 Claude 處理阻擋項再覆核。

## 審查基準與範圍

日期：2026-10-21（Asia/Taipei）。先讀根目錄 CLAUDE.md、handoff.md、AI_WORKFLOW_PLAN.md、CODEX_QUEUE.md 與完整交辦。工作目錄的 AGENTS.md 為舊式交接規則；依本次使用者明確提供的最新規則，根目錄只更新 #27 與週誌，handoff 不改。

Claude「第三輪」說明位於**根目錄** `docs/cost-investigation/CLAUDE_REVIEW.md`；指定 worktree 沒有該文件。已讀根目錄全文，再逐一看指定六檔 git diff 與完整佇列／bridge 邏輯。Mac 核對 `uname -s` 為 Darwin；實際 Node v22.23.2。所有 API 回應與儲存故障測試都用合成資料與本機替身，未讀寫正式學生資料或呼叫正式服務。

`CODEX_R3_REVIEWED_FILES.json` 記錄六檔 SHA256、分支與基底，方便 Claude 比對此次覆核的內容。新增的審查測試及證據在本目錄，原六檔保持原樣。

## 通過的部分

### 三分類

| 分類 | 實作 | 覆核 |
|---|---|---|
| discard | invalid-argument、failed-precondition；支援 functions/ 前綴，記住丟棄 ID，不回 accepted | 差異及既有拒絕／重開測試通過 |
| retry | unavailable、deadline-exceeded、internal、network-request-failed、resource-exhausted、aborted；無代碼且訊息符合網路失敗也重試 | 完整套件通過；獨立另測 resource-exhausted／aborted 含／不含前綴，30000 ms 前不重送、到時重送原 ID |
| hold | 其餘代碼及無碼非網路錯誤，包含登入、權限、not-found | 既有五種錯誤測試通過；獨立研究紀錄測試補充進行中新增事件、重複 ID 與所有觸發入口 |

已確認正常可寫 localStorage 時：hold 不加入 discarded，不回成功確認；定時器、online、pagehide、visibilitychange、直接 flush、新增 urgent 事件、close 都不再呼叫 send。研究紀錄在第一次請求進行中及 hold 後新增的事件，連同原事件都保留完整內容；重開新 bridge 才送出，收到 accepted 後移除。具有 permission-denied 代碼、但訊息含 network unavailable 的錯誤仍進 hold，沒有誤分類成 retry。

學習 completed 的正常 hold／重開案例由本次實際重跑的既有測試驗證：hold 時不呼叫完成回呼；重開成功後才完成。先前後端回應遺失後重送的兩個真實 handler 測試也在完整套件內通過。

### 輪詢

以 TypeScript AST 找到 StudentInteraction 與 TeacherInteraction 中真正的 usePoll 第三參數，確認 active 都是 2000、idle 分別 5000／10000。再把抽出的 idle 數值送進實際 visiblePoll，以假時鐘檢查首查立即、間隔前不查、間隔到才查、背景停止、前景恢復立即查。這是本機邏輯測試，不宣稱做過正式課堂的真人連線實測。

## 阻擋項 P1：儲存失敗時誤報已持久化，依提示重開後遺失完成事件

位置：`src/EventBatcher.ts:81–85`；相關訊息 `src/LearningBridge.ts:32`。研究分支共用同一批次處理與無條件已暫存回呼，亦需一併確認。

重現步驟（獨立測試第 8 案）：

1. 讓 localStorage.setItem 拋出 QuotaExceededError，模擬裝置額度不足／不能寫入；讀取仍正常。
2. 提交一筆合法 completed 事件，伺服器替身回 functions/unauthenticated。
3. 初次 persist 失敗；送出進 hold 後再次 persist 仍失敗。
4. hold 分支沒有檢查 persist 的 false，仍顯示「學習紀錄已暫存在這台裝置；請重新登入後再開啟教材，紀錄會自動送出」。此時 durableEntries=0，完成回呼=0。
5. 關閉舊 bridge、建立同 context 的新 bridge。沒有任何本機事件可恢復，API 呼叫總數仍為 1；completed 只曾留在舊 bridge 記憶體裡。

`CODEX_R3_AUDIT.txt` 保留實際狀態與訊息。第 8 案明確失敗，不 skip、不改成預期失敗。這不否定正常可寫入時的七個通過案例，但無法認定「hold 事件不會遺失」及「全部通過」。

建議交 Claude 處理：分開「確實持久化」和「只剩頁面記憶體」的提示與恢復方式；不能在儲存失敗時承諾重新開啟會恢復，應明確提醒避免離開並提供可行的保存／重新驗證路徑，同時維持 hold 不自動打雲端。本輪依交辦只報告、不擅改實作。

## 實際執行與輸出

| 檢查 | 結果 | 證據 |
|---|---|---|
| npm run check（Mac） | exit 0；前端 190、Functions 61 全過；0 skipped | `CODEX_R3_MAC_CHECK.txt` |
| Codex 獨立覆核 | exit 1；7 PASS／1 FAIL／0 skipped | `CODEX_R3_AUDIT.txt`、`codex-r3-audit.test.ts` |
| 程式碼修正 | 未執行 | 六檔雜湊見 `CODEX_R3_REVIEWED_FILES.json` |
| commit | **未執行**，因未全通過 | HEAD 仍 `2e60f08e`，六檔保持待提交 |

重跑（於 `.worktrees/reduce-function-costs`）：

```sh
export PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH
npm run check
node node_modules/tsx/dist/cli.mjs --test docs/cost-investigation/codex-r3-audit.test.ts
```

後續：Claude 修復阻擋項後保留第 8 案重跑；全部通過才依教師交辦提交，訊息帶 `[Claude]` 並註明 Codex 覆核。部署仍須教師裁定，順序先 Functions 後前端；本次沒有 push、部署、合併或變更版本。
