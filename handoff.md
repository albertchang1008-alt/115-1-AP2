# 專案交接（AP2 本機 MCP）
目前版本：1.9.0

## 目前狀態（2026-10-15）
- 分支 `feature/platform-mcp`；獨立 worktree `/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/platform-mcp`；基底 `origin/main@4ed3778e67a630dfe9cc8ea13096cc220a616868`。本輪本機 commit 見 git log -1，未 push／部署。
- 依 CODEX_TASK_platform-mcp-stage1-2_2026-10-15.md 實作盤點與唯讀連接器。根目錄原分支與大量未提交工作不動；原呼吸整合紀錄保留於 DEVELOPMENT_LOG／Git基底。
- 第1階段：讀完 functions/src 五檔，共57支callable，盤點 docs/platform-mcp/CALLABLE_INVENTORY.md，程式對照57支無漏列。
- 第2階段：tools/platform-mcp/ 使用官方 TypeScript MCP SDK，stdio；依賴只在其 package／lock。硬白名單 getPublished／getSyncStatus／getCompletion，所有其他callable在token或網路前拒絕。
- **3工具有後端缺口**：list_courses／get_course_draft／diff_draft_published固定available:false。bootstrap會寫profile，沒有純讀教師草稿入口；Firestore client rules全deny，不用Admin／REST繞過。此3項不能列完整可用，交Claude裁定後續另案。
- 4可用工具：get_published課程投影、get_sync_status專案級狀態與錯誤旗標／歷史staleUnits、list_materials38份AP2目錄及「已發布」使用位置（草稿未知）、get_completion_summary在記憶體分頁／公式3彙總後只回數字。
- 教師本人已完成本機學校Google登入；ID token驗簽章／issuer／audience／expiry／teacher claim，refresh同一身分。refresh token只存macOS鑰匙圈service platform-mcp-ap2；無token檔案／log／設定，未借用網站session。
- 第一次彈窗收到auth/popup-closed-by-user後重新操作成功；不是學校拒絕。實際callable／stdio均成功，本次未遇App Check或學校拒絕，沒有改安全設定。本機登入server已結束。
- 驗證：工具獨立npm run check（型別＋14測試＋build）全過、0 skipped；7工具實際smoke（4 PASS／3 unavailable）及官方SDK stdio握手＋get_published成功。8份JSON皆個資掃描0，test完成度只讀2人彙總；沒有開輪／作答／改課程。
- 證據：docs/platform-mcp/STAGE2_REPORT.md、unit-check.txt、live-smoke.txt、readonly-smoke/*.json、login-popup-closed.jpg；截圖只含本機安全錯誤，成功頁教師已關閉，不補造成功畫面。
- 程式／functions／rules／indexes／根與functions package／lock／站別／部署設定相對基底零差異；新增只在tools/platform-mcp與docs/platform-mcp，另更新本交接／DEVELOPMENT_LOG。

## 固定決策
1. 不實作寫入、不改functions、不部署、不push、不按平台同步；不動Excel／學生資料／MI。
2. 固定ap2-7ed91／asia-east1，不能透過參數切換站別／URL。沒有generic callable工具。
3. 所有MCP輸出投影／彙總／過濾並掃描；名冊／逐題作答／uid不輸出；同步錯誤全文可能含人名，僅回旗標。
4. 發現學校或App Check阻擋就停下，不改authorized domains／OAuth／App Check／rules，不用debug token。
5. 每次啟動／請求刷新並驗teacher；無權限拒絕啟動。Claude桌面設定由教師驗收後自行加入，設定不能放token。
6. 本機commit結尾[Codex]；不使用force push／--no-verify，不略過測試。

## 下一步
- 停下交Claude獨立驗收（工具README與STAGE2_REPORT有操作及證據），尤其確認3項後端缺口與PII邊界，不能宣稱全部7工具可用。
- 第3階段另案：listManagedCourses／getCourseDraft純讀入口、patchCourseDraft expectedRevision／欄位白名單、auditLog同交易；本輪只寫建議，未實作。
- 教師驗收後自行將本機連接器加入Claude桌面試用；無部署需求。
