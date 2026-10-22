# 給 Claude 的摘要
- 結論：第四輪 Mac 覆核全部 PASS，可以本機 commit；分支 `codex/reduce-function-costs`，受測基底 `2e60f08e`。
- `npm run check` exit0：前端191/191、Functions61/61、版本1.9.1／TypeScript／Vite建置通過；0 FAIL、0 skipped。
- Codex 獨立測試8/8 PASS、0 skipped；採指定 `codex-r3-audit-relaxed.test.ts`，第8案補強 close→重開逐段呼叫與全部提示斷言。
- 第8案：初次失敗calls=1，close最後試送calls=2，重開仍2；持久化0、completed0，從未承諾已暫存，明確提醒勿關頁。
- 生產變更6檔：EventBatcher、LearningBridge、ResearchBridge、Student、ClassroomInteraction、function-costs測試；本輪Codex未修改其實作。
- 獨立副本決定：保留並提交relaxed版；刪除被取代的舊audit副本；前輪失敗報告／輸出／SHA另存r3-before-r4/。
- 部署裁定範圍：**Functions＋前端，先Functions後前端**；本輪只提交，未push／合併／部署／更改版本。
- 偏離：無；依教師指定commit訊息帶[Claude]並註明Codex覆核，執行檢查者為Codex。
- 抽查最多5項：persist成功才hold；無法暫存的提示；第8案close／重開；學生2000/5000與教師2000/10000；既有回應遺失後重送測試。

## 覆核範圍與環境

2026-10-22，Asia/Taipei；Mac `uname -s`＝Darwin，Node v22.23.2。工作目錄 `.worktrees/reduce-function-costs`，分支 `codex/reduce-function-costs`。讀取根目錄交接、工作流程、佇列、完整第四輪任務與Claude審查，再檢查六檔差異及批次／bridge邏輯。

worktree的AGENTS.md為舊式交接規則，依教師本次明示規則只改根目錄#27及週誌，handoff.md不動。所有故障、API及儲存測試使用本機合成資料與替身；未存取正式學生資料或正式服務。

受測七檔（六個待提交程式／測試＋獨立測試）的SHA256在 [CODEX_R3_REVIEWED_FILES.json](CODEX_R3_REVIEWED_FILES.json)。完整檢查後逐檔重新比對，全部一致。

## 第四輪修正確認

- `EventBatcher.ts`：可持久化的登入／權限／其他hold錯誤，先persist成功才暫停本頁送出。定時器、online、pagehide、visibilitychange、新增事件、flush及close都受hold阻擋；重開才恢復原事件ID。
- persist失敗時不進hold，事件保留於記憶體並走30秒重送；LearningBridge的volatile、pending、failed路徑均保留「請先不要關閉此頁」提醒，沒有被一般待同步訊息覆蓋。
- 僅invalid-argument、failed-precondition丟棄且記住ID；六碼暫時錯誤與無碼網路錯誤重試。帶權限代碼而訊息像網路錯誤仍hold。
- StudentInteraction active2000／idle5000ms；TeacherInteraction active2000／idle10000ms。獨立測試由TypeScript AST讀取實際usePoll參數，另跑真實visiblePoll配假時鐘，涵蓋背景停止與前景立即恢復。
- 既有真實handler測試仍通過：learning／research已寫入但回應遺失，重送接受同一批全部ID、後端不重複累計。

根目錄Claude「第四輪」文字仍記錄舊的提示限制；本次以實際受測程式為準：UNSAVED已明確提醒不要關頁，pending及failed不會覆寫成誤導提示。

## 第8案為何calls從1改2

採教師指定relaxed版本，沒有放寬持久化與提示要求。另補強：

1. 首次completed送出回unauthenticated，localStorage寫入失敗：calls=1、durableEntries=0、completed=0。
2. 呼叫close並排空Promise後，當場斷言calls=2；這是記憶體事件的最後一次best-effort送出。
3. 關閉後推進300000ms，calls仍2，證明重試計時器已移除。
4. 建立同context的新bridge，calls仍2，證明第二次不是重開恢復的送出。
5. 逐一檢查所有提示，不得包含「已暫存在這台裝置…紀錄會自動送出」，最後訊息必須提醒先不要關頁；全程不能觸發completed。

保留close最後一次送出有理由：只有記憶體而未同步的事件，可在離開前多一次成功機會；它不代表持久化成功，也不承諾關頁後必定恢復。正常durable hold的close不會再打雲端，獨立第5案及既有hold案例有驗證。若離開時登入或網路仍未恢復，且本機仍不能寫入，資料依然可能遺失；所以提示明確要求同步成功前不要關閉。

舊版audit副本的「close後calls仍1」與第四輪行為不符，已刪除，不保留一份預期必敗的測試。獨立測試未納入npm預設glob，但已另以明確指令跑過，完整輸出隨commit保留。

## 實際指令與完整輸出

於指定worktree執行，以下兩個命令均exit0：

```sh
export PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH
npm run check
node node_modules/tsx/dist/cli.mjs --test docs/cost-investigation/codex-r3-audit-relaxed.test.ts
```

| 檢查 | 結果 | 完整輸出 |
|---|---|---|
| npm run check | 前端191、Functions61；FAIL0／skipped0；型別與建置PASS | [Mac完整檢查](CODEX_R3_MAC_CHECK.txt) |
| Codex獨立8案 | PASS8／FAIL0／skipped0 | [獨立測試輸出](CODEX_R3_AUDIT.txt) |
| 生產／獨立測試SHA | 檢查前後一致 | [雜湊清單](CODEX_R3_REVIEWED_FILES.json) |
| 前輪未通過證據 | 保留歷史，非本輪結果 | [前輪報告](r3-before-r4/CODEX_R3_REVIEW.md) |

## 提交與部署停點

全部檢查通過後才提交六個待提交檔案、獨立測試與審查證據。訊息依教師要求使用 `[Claude]`，並寫明「Codex覆核」。沒有push、合併、部署、變更版本、修改正式資料。

#27改為「停-等教師」，下一步「部署裁定（先 Functions 後前端）」。部署範圍包含本分支先前修正的Functions accepted回覆及本次前端批次／提示／輪詢變更；不能只部署其中一端。根目錄週誌與check_handoff.py依收工規則處理。
