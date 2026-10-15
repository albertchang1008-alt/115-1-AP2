# 平台 MCP 第3階段報告：停點 A（2026-10-15）

目前版本：1.9.1。分支 `feature/platform-mcp`；worktree `/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/platform-mcp`。
基底為前輪本機 `f0c1e7e`，開工 fetch 確認 origin/main 仍為 `4ed3778` 且已是本分支祖先，無需 merge。本輪只本機 commit；**未部署、未 push、未對正式課程寫入**。

## 已完成
- 新增4支 callable：listManagedCourses、getCourseDraft、getCompletionSummary（純讀）、patchCourseDraft（局部寫入）。課程列表不再經會寫profile的bootstrap；完成度由後端彙總，不傳名冊／個人進度到Mac。
- getCourseDraft回傳course投影＋root revision，排除名冊、teacherIds、Sheet網址；listManagedCourses回代碼／名稱／學期／草稿發布旗標／revision。owner教師授權不因teacher claim而跳過。
- patchCourseDraft交易內完成授權、expectedRevision、4種op、共用saveCourse驗證、revision+1、auditLog與requestId去重。相同requestId及相同payload重送只回原結果；不同payload／actor拒絕。requestId要求UUID v4。
- 白名單op：addActivity、updateActivity、reorderActivities、updateChapterSettings。限定既有Chapter；不能改班級、teacherIds、題庫答案或發布。reorder需完整排列；updateActivity不可改ID；設定只允許title／description／required／threshold／opensAt／dueAt。
- saveCourse與patch共用shared/courseValidation.ts；root revision獨立於draft，舊文件缺值視為0，前端傳入的course.revision只作metadata不存入draft。
- saveCourse接受可選expectedRevision並在交易內核對、遞增、寫admin-ui稽核。新版bootstrap附revision；管理頁／預覽保存透過saveDraftWithRevision明確帶讀取版本，成功更新本地revision；衝突保留未保存內容、顯示「草稿已在其他地方被修改，請重新整理後再編輯」，不自動重試。
- 既有其他草稿變更路徑（合併／區域／公告／複習考／Sheet題庫與名冊班級同步）都遞增revision。複習考建立／刪除亦接受並由新版編輯器傳expectedRevision，避免採用新revision時掩蓋未見過的修改。
- auditLog：courses/{id}/auditLog/{autoId}，含時間、教師actorUid、來源、UUID requestId、revision前後、schema欄位／數量／hash差異摘要；不保存原始課程文字、email、學號、學生uid、名冊、token或作答。教師uid是交辦要求的稽核actor例外。另有私有patchRequests去重紀錄，同一交易提交。
- Firestore auditLog規則：僅該課teacherIds內且有teacher claim的教師可讀，學生／其他教師不可讀，所有用戶端直接寫入拒絕。

## 連接器與確認
- 純讀白名單：listManagedCourses、getCourseDraft、getPublished、getSyncStatus、getCompletionSummary；移除舊getCompletion。7個唯讀工具已補齊，diff使用真實草稿，教材目錄同時核對草稿／已發布使用位置。
- 寫入白名單獨立：僅patchCourseDraft／syncSheet。新增add_activity、update_activity、reorder_activities、update_chapter_settings、sync_sheet，標示destructive:true／readOnly:false，沒有發布或generic callable工具。
- 同一工具以mode=preview／apply兩步執行。預覽不寫入，顯示before→after／expectedRevision、UUID requestId、一次性confirmationCode與10分鐘期限。工具說明明定：套用前必須先將預覽給教師看並取得同意；apply需teacherApproved:true與原始參數。
- 伺服器連線記憶體只留payload／狀態hash、有效期、requestId，不快取raw草稿／同步錯誤。套用再讀狀態，差異／revision／工具／課程／內容變動、過期或已使用均拒絕；同一碼每次套用嘗試即消耗。換教師身分須重啟／重新預覽。
- 寫入輸入若含email、學號格式或JWT直接拒絕；輸出仍投影／遞迴過濾並掃描。regex不是通用人名辨識器，工具不接收名冊或學生作答。
- sync_sheet預覽明示全教師名下對應Sheet課程、resetWrong與目前狀態；不預讀Sheet題目、不承諾預估題數。apply再核對所有課程revision與同步來源／狀態hash，後端在取得同步lease的交易內重查。超過原同步100課上限拒絕部分預覽。
- sync結果回added／updated／retained／reset。**保留原「全部重算不讀舊bank」保證**：該情況前三項為null，reset為本次題數；舊bank不完整時未知值也為null，countsComplete=false，不捏造數字。reset依錯題延續規則計算，可能和其他題數重疊。

## 驗證（全部0 skipped）
| 檢查 | 結果 | 證據 |
|---|---|---|
| VITE_SITE_ID=ap2 npm run check | 前端162／162、Functions61／61，版本、前後端build與入口載入均成功 | stage3/platform-check.txt |
| tools/platform-mcp npm run check | 型別、16／16測試、CLI與登入client build成功 | stage3/connector-check.txt |
| Firebase Auth＋Firestore＋Functions Emulator | 16項流程全過，正式呼叫0 | stage3/emulator-results.json |
| 7唯讀工具接實際Emulator callable | 全部成功，個資掃描0 | stage3/emulator-readonly.json |
| 彙整結果與版本 | 1.9.1／停點A／未部署未push | stage3/verification.json |

Emulator用獨立設定firebase.platform-mcp-emulator.json、demo-platform-mcp與localhost 9499／8480／5501；腳本硬檢查專案與host，不從鑰匙圈讀正式token。所有教師／學生／MCP-TEST內容都是合成資料。
完整流程實際經HTTP callable：讀revision0→預覽→新增→同requestId重送→舊patch衝突→**呼叫實際管理頁保存helper**被拒→四種op→確認碼過期／狀態變更→新管理頁保存→並行兩patch只有一筆成功→並行相同requestId只套用一次→9筆auditLog→規則owner讀／非owner與學生讀拒絕／client寫拒絕→後端完成度→7唯讀工具。沒有把這項helper流程稱為正式教師端人工驗收或實機UI測試。

新增測試涵蓋revision衝突、非法op／欄位、requestId重送、非教師、跨課程、audit無學生個資、舊revision0、交易失敗原子性、確認碼內容綁定／過期／重用、欄位投影、未知同步題數。既有錯題延續與全部重算不讀舊bank測試保留通過；未略過或刪除失敗測試。

## 相容限制與未做事項
- 依交辦，saveCourse的expectedRevision保留可選；**舊客戶端省略時仍可保存，沒有衝突保護**。新管理頁／MCP必帶版本；後續部署後需重整管理頁。無migration，舊root自然由0開始。
- getCompletionSummary上限5000名冊列，超限整筆拒絕，不回半份統計；每名啟用學生使用平台forClass／完成度公式3。這是即時彙總，不宣稱一致時間點快照。
- sync_sheet的外部Google Sheet成功套用及正式桌面安裝留停點B：本輪只測mock輸出契約及Emulator內的衝突／狀態拒絕，**沒有讀寫正式Sheet或呼叫正式syncSheet**。外部Sheet可在預覽後變動，所以預覽只展示範圍與已知狀態，不假裝是精確題目差異預覽。
- 未實作preview_publish／publish_course；不跑migration、不改Excel、不操作正式輪次、名冊或成績，不部署MI。根目錄／其他worktree保留。
- STAGE2_REPORT與readonly-smoke為1.9.0歷史證據，不表示1.9.1後端已部署。第3階段只使用stage3/證據。

## 後續部署影響（只列清單，本輪不執行）
新增：listManagedCourses／getCourseDraft／getCompletionSummary／patchCourseDraft。
既有行為受影響：bootstrap、saveCourse、publishCourse、mergeChapter、setUnitVisibility／endCurrentExam、renameArchiveLabel、setStudentNotice、buildReviewExam／deleteReviewExam、syncRoster／syncSheet；理由為revision／metadata、共用驗證或同步確認／統計。Functions共用codebase打包可能使更多函式更新，不能把新增4支當作全部部署範圍。
另需發布auditLog規則與1.9.1前端；正式流程須教師在Claude核可後另行授權，本輪不merge main、不push、不部署。先Functions與規則，再前端；MI不部署。停點B只對教師另外建立的測試課程做寫入，不使用正式課程。

## Claude審查入口
先看本分支相對f0c1e7e的diff、shared/courseDraft.ts／courseValidation.ts、functions/src/platformMcp.ts、saveCourse／其他revision寫入、src/courseRevision.ts與CourseEditor，再看tools/platform-mcp/src/writes.ts及Emulator腳本。請特別核對可選legacy revision與同步未知題數的相容決策。
獨立重跑平台check、工具check與README的Emulator命令。教師之後才安裝Claude桌面版；本輪不自動改設定。

官方依據：[Firestore交易](https://firebase.google.com/docs/firestore/manage-data/transactions)、[Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)、[Firestore Emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore)。
