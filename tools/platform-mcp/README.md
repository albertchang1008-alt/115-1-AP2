# AP2 本機 MCP 連接器 1.9.1（第3階段／停點A）

本機程式與 Emulator 驗證版本，尚未部署。教師核可並完成 Functions／規則／Pages 發布後，才安裝到 Claude 桌面版並執行停點B。**本輪不對正式課程寫入，不提供發布工具。**

## 安裝、登入與 Claude 桌面設定
需要 macOS 與 Node.js 22。在本目錄執行：

```sh
npm ci
npm run check
npx --no-install platform-mcp login
```

登入由教師本人在 localhost 頁面操作學校 Google 帳號與鑰匙圈提示；不要把密碼、OTP 或 token 貼給 AI。使用與正式 AP2 相同的公開 Firebase 設定、inMemoryPersistence，驗證 Google 簽章、issuer、audience、expiry、teacher claim 與 refresh 同一身分。refresh token 僅存 macOS 鑰匙圈 service `platform-mcp-ap2`／account `firebase-refresh`；security 以 stdin 存入，不放 argv、檔案或 log。啟動與每次請求前刷新並驗證 teacher，連線中換教師身分時拒絕，須重啟與重新預覽。

學校、App Check 或401認證阻擋時停止，不改 authorized domains／OAuth／App Check／rules，不使用 debug token 或服務帳戶。正式連接器固定 ap2-7ed91／asia-east1，不能由參數切換站別、URL或使用 Emulator。

教師完成後續驗收與發布後，自行將以下節點併入 `~/Library/Application Support/Claude/claude_desktop_config.json` 的既有 mcpServers（不要覆蓋其他設定）：

```json
{
  "mcpServers": {
    "platform-mcp-ap2": {
      "command": "/Users/HHC/.nvm/versions/node/v22.23.2/bin/node",
      "args": ["/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/platform-mcp/tools/platform-mcp/dist/cli.js"]
    }
  }
}
```

設定無 env、無 token。移動 worktree 或換 Node 時更新絕對路徑，dist 不提交，先 npm run build。重新啟動 Claude 後應列出12工具：7唯讀、5標 destructive 的兩步寫入工具。無憑證時拒絕啟動，只有 stderr 安全錯誤，stdout 保留給 stdio 協定。本輪不替教師修改桌面設定。

## 七個唯讀工具
| 工具 | 輸入／內容 |
|---|---|
| list_courses | 無參數；教師管理的課程代碼、名稱、學期、草稿／發布旗標、revision |
| get_course_draft | courseId；課程草稿投影＋revision，不含名冊／teacherIds／Sheet網址 |
| get_published | courseId；已發布課程投影 |
| diff_draft_published | courseId；讀真實草稿與發布版本，回傳差異路徑摘要，忽略發布時間等metadata |
| get_sync_status | 專案級最近同步時間、數字／錯誤旗標、上次同步staleUnits；即時草稿另讀get_course_draft |
| list_materials | courseId；repo的38份AP2目錄及草稿／已發布活動的使用位置 |
| get_completion_summary | courseId、classId；由後端計算人數、完成數、各單元完成數、必做機會數，不把名冊／逐題資料傳回Mac |

純讀白名單固定為 listManagedCourses、getCourseDraft、getPublished、getSyncStatus、getCompletionSummary；舊 getCompletion 已移除。bootstrap 等帶副作用入口仍禁止。

## 五個寫入工具：一定先預覽
所有工具都有 `mode: "preview" | "apply"`；**套用前必須把預覽內容給教師看，並取得同意**。預覽不寫入，回傳改前→改後、expectedRevision、confirmationCode、expiresAt、requestId。確認碼只在這個MCP連線記憶體、10分鐘有效、一次性；重啟後失效。套用需同一工具與相同內容，加 confirmationCode 與 teacherApproved:true。讀回草稿／revision／同步狀態變動、內容改動、過期或重用均拒絕，必須重新預覽。

| 工具 | preview需要的內容 |
|---|---|
| add_activity | courseId、chapter（既有單元鍵）、activity（完整活動） |
| update_activity | courseId、chapter、activityId、patch |
| reorder_activities | courseId、chapter、activityIds（完整排列，不可漏項或重複） |
| update_chapter_settings | courseId、chapter、patch |
| sync_sheet | resetWrong（預設false）；範圍為此教師名下所有對應Sheet課程，不限單課程 |

activity欄位白名單：id（僅新增）、title/type/phase/url/start/end/description/tracking/required/reflection/materialVersion/nodeTotal/questionTotal。chapter設定白名單：title/description/required/threshold/opensAt/dueAt。不能用這些工具變更班級、名冊、題庫答案、課程功能或刪除單元。保存與patch使用共用課程驗證。

套用範例（確認前只能做第一步；代碼必須使用實際回傳值）：
```json
{"mode":"preview","courseId":"MCP-TEST","chapter":"呼吸系統","patch":{"required":true}}
```
教師看過預覽並同意後，使用同一工具：
```json
{"mode":"apply","courseId":"MCP-TEST","chapter":"呼吸系統","patch":{"required":true},"confirmationCode":"實際預覽回傳值","teacherApproved":true}
```

寫入白名單另列為 patchCourseDraft／syncSheet，沒有generic callable。patchCourseDraft在同一交易完成owner授權、expectedRevision、op驗證、revision遞增、auditLog及requestId去重；同requestId改payload或換教師一律拒絕。確認碼若已用但網路回應失敗，先讀草稿確認結果，不自動重送寫入。

sync_sheet預覽只顯示範圍／目前狀態，不預讀Sheet題目或假裝預估題數；套用前與後端取得lease前均核對所有管理課程revision及同步來源／狀態hash。既有同步最多100課，連接器超過此數會拒絕部分預覽。它同步題庫／草稿，不發布、不執行syncRoster。結果回 added／updated／retained／reset 題數；全部重算保持「不讀舊bank」保證，因此該情況前三項為null、reset為本次題數。舊bank不完整時未知項也為null，countsComplete=false；不捏造0。reset可能和其他項重疊，不是互斥加總。

## revision 與稽核
舊課程root沒有revision視為0。bootstrap／getCourseDraft回root revision；管理頁保存時帶讀取版本，成功後保存新版本，衝突顯示「草稿已在其他地方被修改，請重新整理後再編輯」，保留本機未保存內容，不自動覆寫或重試。其他草稿變更路徑也遞增revision。

saveCourse的expectedRevision依交辦保留可選，舊客戶端省略時仍可保存並遞增；**舊客戶端省略版本不具有衝突保護**。新版管理頁、MCP patch及複習考編輯會明確帶版本。升級後請重整管理頁。

auditLog只存時間、教師actorUid、來源、UUID requestId、op／欄位／數量、revision前後與hash；不存原始課程文字、token、名冊或作答。教師uid是交辦明定的稽核actor，不是學生uid。規則只允許該課owner教師讀，學生／其他教師不可讀、客戶端不可直接寫。

## 本機驗證（停點A）
```sh
# worktree根目錄：完整平台檢查
VITE_SITE_ID=ap2 npm run check
# 本工具目錄：獨立檢查
npm run check
# worktree根目錄：只可用demo Emulator，不需要正式登入
firebase emulators:exec --project demo-platform-mcp --only auth,functions,firestore --config firebase.platform-mcp-emulator.json 'GCLOUD_PROJECT=demo-platform-mcp node --import tsx tools/platform-mcp/emulator-flow.mts'
```

Emulator腳本硬檢查demo專案與127.0.0.1:9499／8480，callable固定localhost:5501，使用合成教師／學生與MCP-TEST資料，不從鑰匙圈取得正式token。流程包括7唯讀工具、4patch op、後台保存衝突、並行衝突／重送、確認碼過期、audit權限與個資掃描。外部Sheet同步套用只做mock契約與錯誤前置檢查，停點A不連正式Sheet；真實同步留停點B另行授權。

`npm run smoke`／`npm run smoke:stdio` 是後續部署後的正式**唯讀**驗證命令，本輪不執行；正式寫入只可用教師另外建立的測試課程。這輪不實作preview_publish／publish_course。

證據與限制：../../docs/platform-mcp/STAGE3_REPORT.md；STAGE2_REPORT及readonly-smoke是1.9.0歷史證據，不代表新後端已上線。所有輸出仍需投影／過濾與個資掃描；自由文字regex不是通用人名匿名化器。
