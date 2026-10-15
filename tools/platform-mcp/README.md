# AP2 本機唯讀 MCP 連接器（階段 1–2）

僅 macOS／Node.js 22，以官方 MCP TypeScript SDK 的 stdio 提供工具。固定專案 ap2-7ed91、asia-east1，不支援 MI 或傳入自訂 URL／projectId。未修改 Functions，不能部署。

## 安裝與登入

在此目錄執行（依賴只存在此目錄；根目錄與 functions 的 package／lock 不變）：

```sh
npm ci
npm run check
npx --no-install platform-mcp login
```

首次會開啟 localhost 頁面，請**教師本人**按「以學校 Google 帳號登入」，選已有 teacher claim 的 ctcn.edu.tw Google 帳號。Google 密碼、驗證碼或鑰匙圈提示由本人操作。不要把 token 貼給 AI，也不要把 token 放入設定檔。

登入使用與正式 AP2 網站相同的公開 Firebase 設定，瀏覽器使用 inMemoryPersistence；ID token／refresh token 只在記憶體，refresh token 存於 macOS 鑰匙圈 service `platform-mcp-ap2`、account `firebase-refresh`。security -i 透過 stdin 存入，不把 token 放 process argv、檔案或 log。ID token 以 Google 公鑰驗 RS256、issuer、audience、有效期及 teacher===true；登入另外核對學校信箱／Google provider，並確認 refresh token 與登入教師相同。

每次 stdio 啟動、每次 callable 請求前都從鑰匙圈換新 ID token 並驗 teacher claim；未登入或權限不足拒絕啟動。refresh token 輪替時更新同一鑰匙圈項目；不使用 Admin SDK、服務帳戶、ADC、既有網站 session 或 App Check debug token。

若學校帳號、auth/unauthorized-domain、App Check 或其他認證限制擋下，**停下回報實際代碼**。不改 authorized domains／Google OAuth／App Check／Firestore rules，不換私人帳號繞過。401 或 App Check 錯誤會鎖住該連線後續 callable。

## 加入 Claude 桌面版

教師驗收後自行編輯 `~/Library/Application Support/Claude/claude_desktop_config.json`，將以下節點併入既有 mcpServers；不要覆蓋其他連接器：

```json
{
  "mcpServers": {
    "platform-mcp-ap2": {
      "command": "/Users/HHC/.nvm/versions/node/v22.23.2/bin/node",
      "args": [
        "/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/platform-mcp/tools/platform-mcp/dist/cli.js"
      ]
    }
  }
}
```

不需要 env，不包含任何 token。更換 Node 版本或移動 worktree 時自行更新絕對路徑。編譯產物 dist 忽略版控，首次使用前須 npm run build。本輪不替教師修改 Claude 設定，也不安裝至全域。

重新啟動 Claude 桌面版後，確認連接器顯示已連線、工具列表有下列七個名稱。也可用 `npm start` 檢查：有 teacher token 時會等待 stdio MCP 協定輸入（不向 stdout 印文字），無 token 時 stderr 顯示安全錯誤碼並結束。不要將手動啟動的 stdio 視窗當作 HTTP 服務。

## 工具與既有後端限制

| 工具 | 可用範圍 |
|---|---|
| list_courses | available:false；bootstrap 會寫 profile，不能使用 |
| get_course_draft | available:false；無純唯讀草稿入口 |
| get_published | 指定 courseId；單元、分類、活動與班級設定投影，不含名冊 |
| diff_draft_published | available:false；未取得可靠草稿，不能計算線上差異 |
| get_sync_status | 專案級最近同步結果數量／錯誤旗標／歷史 staleUnits；捨棄錯誤全文和名冊 |
| list_materials | 指定 courseId；repo AP2 目錄38份及已發布活動使用位置；草稿使用情況 unknown |
| get_completion_summary | courseId、classId；分頁讀取後僅回傳數字，沿用平台完成度公式3 |

list_courses 等工具雖保留介面，**不是完整功能已驗收**。本輪沒有純唯讀方式取得真實草稿，故 diffSummary 純函式只做離線單元測試，線上工具不要求 AI 傳入草稿快照冒充目前資料。詳細盤點見 `../../docs/platform-mcp/CALLABLE_INVENTORY.md`。

完成度後端回應必然包含學生名冊與進度，只有本機記憶體接觸；不回傳個別學生、游標或逐題資料。只統計 enabled===true 的完成度，students 另外保留總列數，零必做項目不算「完成學生」。若超過100頁、游標循環或任何頁讀取失敗，整個工具失敗，不回半份總數。這是即時分頁讀取，不是同一時間點快照。

所有 MCP 輸出經 course 投影／工具專用彙總，再經遞迴過濾（email、學號、姓名、uid、名冊、逐題作答、token等）與 email／8–12位學號／JWT 掃描；未知例外不回傳原始訊息。自由文字 regex 無法辨識所有人名，所以不收名冊／錯誤全文／個人資料工具，也不能將本工具視為任意資料的通用匿名化器。

## 測試與實際驗證

```sh
npm run check
npm run smoke
npm run smoke:stdio
```

check 包含型別、單元／官方 SDK 協定測試、CLI與登入頁建置；每次測試都禁止寫入類 callable 並檢查去識別與 teacher claim。

smoke 必須先由本人完成登入，只對正式 AP2 課程 `115-1-AP2` 執行；完成度指定 test 班，不開輪、不作答、不改成績。輸出先過濾和掃描，0 findings 才寫入 `docs/platform-mcp/readonly-smoke/*.json`，包含 live 標記。三個受限工具記錄 unavailable，不算實際後端通過。任何錯誤即停止，不跳過或填入模擬資料。

登入流程截圖只記錄無帳號／token 的本機等待、成功或安全錯誤頁；不截取 Google 帳號選單、密碼、驗證碼或鑰匙圈秘密。

## 安全邊界與後續

唯讀白名單：getPublished、getSyncStatus、getCompletion。bootstrap、getReflections、getAssessments、assessmentReport 都有寫入副作用，禁止使用。即使原始碼某模式只讀，整支具寫入能力的 callable 仍不開放。未提供 generic call、寫入工具或自訂 endpoint。

第3階段 patchCourseDraft／auditLog，以及補齊 listManagedCourses／getCourseDraft／後端完成度彙總，必須另案授權。不要從此工具直接修改正式資料。

官方參考：[MCP SDK](https://ts.sdk.modelcontextprotocol.io/server)、[Firebase callable](https://firebase.google.com/docs/functions/callable-reference)、[Firebase token refresh](https://firebase.google.com/docs/reference/rest/auth#section-refresh-token)、[Firebase Google 登入](https://firebase.google.com/docs/auth/web/google-signin)。
