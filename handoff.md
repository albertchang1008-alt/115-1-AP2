# 專案交接（AP2 本機 MCP 第3階段）
目前版本：1.9.1

## 目前狀態（2026-10-15）
- worktree `/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/platform-mcp`，分支feature/platform-mcp；前輪f0c1e7e，本輪commit見git log -1。開工fetch確認origin/main=4ed3778，已是本分支祖先，無需merge。
- **停點A完成，待Claude審查**：後端4新callable、root revision防覆蓋、共用驗證、交易auditLog／requestId去重、7唯讀＋5兩步寫入工具完成。本機1.9.1；未push／部署／正式課程寫入。
- 新純讀listManagedCourses／getCourseDraft不經bootstrap、不寫profile；getCompletionSummary在後端彙總，只傳統計，不傳名冊／個人progress到Mac。patchCourseDraft只接受4種op，不能改班級、題庫、功能或發布。
- patch在同一交易確認owner、expectedRevision、完整驗證、revision+1、audit及去重。同requestId同payload回原結果，換payload／actor拒絕。UUID v4 requestId；舊root revision缺值當0。
- saveCourse支援可選expectedRevision，寫入即遞增並稽核；新版後台一定傳版本，成功採新revision，衝突保留本機內容並提示重新整理，不自動重試。其他草稿變更路徑也遞增；複習考編輯帶版本避免掩蓋競態。
- audit只存教師actorUid（交辦例外）、來源、時間、UUID、revision、schema摘要／hash，不存學生個資、token或原始內容。Firestore僅owner教師讀，所有client寫拒絕。
- 連接器仍固定ap2-7ed91。純讀白名單5支新契約，移除getCompletion；寫入白名單僅patchCourseDraft／syncSheet。preview→教師同意→apply，10分鐘一次性確認碼綁工具／payload／真實草稿與revision／同步狀態。沒有發布工具。
- **相容注意**：舊客戶端省略expectedRevision仍可保存（依交辦），無版本保護；新版UI／MCP明確帶版本。同步全重算保持不讀舊bank，所以無法比較的新增／更新／保留題數回null，不假造0；詳報告。
- 驗證全過0 skipped：AP2前端162／Functions61；工具16；Auth＋Firestore＋Functions Emulator16項（含並行衝突／並行重送、後台helper拒存、audit規則與7唯讀工具），個資掃描0、正式呼叫0。
- 證據docs/platform-mcp/STAGE3_REPORT.md與stage3/；版本VERSION／三package與lock／shared／public／apps-script／三文件一致1.9.1，version:check已納入工具套件。
- 既有題庫／評分／錯題／教材回歸通過；未改Excel、教材來源／公開教材、站別設定或正式資料；不碰其他worktree。前輪鑰匙圈登入機制保留，本輪Emulator使用合成帳號，不取正式token。

## 固定決策
1. 本輪停點A只許本機程式、測試／Emulator與commit，不部署、不push、不merge main、不對正式課程寫入、不跑migration。
2. source/backend參數白名單固定；無generic callable、無Admin憑證用於正式連接器，不關App Check／學校限制。Emulator腳本只許demo專案與localhost。
3. 寫入工具套用前必須把預覽給教師看並取得同意，不能僅憑初始概括授權自動apply。確認碼失效／衝突／未知結果須先讀狀態再重新預覽。
4. sync_sheet為所有管理課程對應Sheet，不限單課程；目前上限100課，不發布、不同步名冊；正式成功同步測試留停點B。
5. 本機commit結尾[Codex]，不可force push／--no-verify或略過測試。Claude桌面設定不放token，由教師驗收與部署後自行加入。

## 下一步
- Claude獨立審查本輪diff與STAGE3_REPORT，重跑平台check、工具check、README的Emulator流程。特別核對legacy省略版本與同步未知題數限制。
- 教師另行核可後才合併／正式流程發布Functions、audit規則、AP2 Pages；部署影響清單已列報告。MI不部署。
- 停點B：部署後7唯讀正式smoke；寫入只用教師另建MCP-TEST課程，再驗新增／設定／衝突／過期／audit，正式課程禁止寫入。
