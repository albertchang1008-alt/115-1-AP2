# AP2 callable 盤點（第 1 階段）

日期：2026-10-15；基底 `origin/main@4ed3778e67a630dfe9cc8ea13096cc220a616868`。
逐一讀取 functions/src/ 的五份 TypeScript：index、assessments、classroom、teaching、features（共 2311 行）。
以下 57 個 callable 逐項區分實際副作用，不能單憑 get 開頭判定唯讀。原始碼與規則均不修改。

## 呼叫方式、權限與 App Check
- 固定 POST `https://asia-east1-ap2-7ed91.cloudfunctions.net/<callableName>`，JSON `{"data":{...}}`；Authorization: Bearer Firebase ID token。回應 result／data 或 error。
- functions/src/index.ts:54 options 統一 region asia-east1；未設定 enforceAppCheck／consumeAppCheck，所有 onCall 都沿用 options。整份 functions/src/ 無 App Check 設定，src/service.ts 無 App Check 初始化。
- **此為原始碼結論，不能推定部署端所有政策**。實測若遇 App Check 或 401，連接器會停止後續請求；不提供 debug token、不關閉 App Check、不修改安全設定。
- index.ts:118 identity 以 `req.auth.token.teacher === true` 判教師。取得 claim 的既有管理腳本 scripts/set-teacher.cjs 用 ADC 執行 Admin SDK setCustomUserClaims，保留既有 claims 加 teacher:true；本輪不執行該腳本、不授權新教師。
- 課程權限另由 access 核對根文件 teacherIds 包含 caller uid；僅 claim 不代表能讀所有課程。getSyncStatus 例外：所有教師讀專案級同步狀態。
- 所有 Firestore client 規則 deny read/write，故不得改走 REST 直接讀課程，也不使用 Admin SDK／ADC 繞過 callable 權限。

## 全部 callable
「owner教師」表示 teacher claim 加該課程 teacherIds；「條件寫」即不符合強制唯讀要求。
| 名稱 | 權限 | 輸入重點 | 輸出重點 | 副作用 | 個資／敏感內容 | 本輪處置 |
|---|---|---|---|---|---|---|
| bootstrap | 師／生 | 無 | profile、courses、testEmails、version | 寫 | profile／測試信箱；courses含教師設定 | 排除：每次寫 profiles |
| saveCourse | 教師；舊課需owner | course | ok | 寫 | 輸入可含teacher設定／課程文字 | 草稿整份覆蓋 |
| publishCourse | owner教師 | courseId | published Course | 寫 | 課程自由文字／班級設定 | 發布 |
| mergeChapter | owner教師 | courseId、sourceName、targetName、preview、expectedDraft、confirmationToken | 預覽或course | 條件寫 | 內部讀學生progress；輸出人數／活動 | 即使preview可唯讀，整支仍排除 |
| setUnitVisibility | owner教師 | courseId、unitIds、visibility、archiveLabel | units、visibility | 寫 | actorUid寫log | 排除 |
| endCurrentExam | owner教師 | courseId、archiveLabel | units、visibility | 寫 | actorUid寫log | 排除 |
| renameArchiveLabel | owner教師 | courseId、from、to | ok | 寫 | actorUid寫log | 排除 |
| setStudentNotice | owner教師 | courseId、text | text | 寫 | 自由文字可能個資 | 排除 |
| deleteCourse | owner教師 | courseId | ok | 寫 | 刪root | 排除 |
| importRoster | owner教師 | courseId、rows | count、updated、emailChanged | 寫 | 姓名／學號／email | 排除 |
| migrateRoster | owner教師 | courseId、apply | done、count、rows | 條件寫 | 名冊姓名／學號／email | apply=false也不白名單 |
| archiveCourse | owner教師 | courseId、archived | ok | 寫 | 無直接學生資料 | 排除 |
| getRoster | owner教師 | courseId、classId、after | rows、next | 讀 | 名冊個資；next學號 | 不需要，排除 |
| getPublished | owner教師 | courseId | published Course | 讀 | 未含名冊；自由文字可能個資 | 白名單；projection＋filter |
| buildReviewExam | owner教師 | courseId、name、sourceUnitIds、drawCount | version、count、allocation、builtAt | 寫 | 題目內容 | 排除 |
| deleteReviewExam | owner教師 | courseId、name | ok | 寫 | 課程草稿 | 排除 |
| publishQuestions | owner教師 | courseId、unitId、questions | version、count | 寫 | 題目與答案 | 排除 |
| getBank | owner教師／有選課學生 | courseId、unitId、version、draft | questions | 讀 | 題庫答案；不含個人逐題作答 | 不需要，排除 |
| getProgress | owner教師／學生本人 | courseId、uid? | Progress | 讀 | 可識別個人進度／錯題 | 排除 |
| submitAttempt | 學生；拒教師 | attempt | progress、attempt、wrongSummary | 寫 | uid、逐題作答 | 排除 |
| submitMixedAttempts | 學生；拒教師 | attempts | progress、attempts、summaries | 寫 | uid、逐題作答 | 排除 |
| saveActivity | 學生；拒教師 | courseId、unitId/chapterName、activityId、position、completed | ok | 寫 | 個人進度 | 排除 |
| saveReflection | 學生；拒教師 | courseId、chapterId、activityId、answers | response、progress | 寫 | 具名自由文字、uid | 排除 |
| getMyReflection | 學生本人 | courseId、chapterId、activityId | response | 讀 | 本人具名反思 | 排除 |
| getReflections | owner教師 | courseId、chapterId、activityId、classId? | 反思彙整、rows／missing等 | 條件寫 | 具名反思、名冊／researchId | 排除：首次建立 reflectionSalt |
| saveExplanationResearchEvents | 學生；拒教師 | courseId、unitId、version、events | accepted、summary | 寫 | uid、學號、姓名、逐題曝光 | 排除 |
| getExplanationResearchEvidence | owner教師 | courseId、classId、unitId | rows含html、followUp | 讀 | 姓名／學號／uid、逐題與追蹤 | 排除 |
| getHistory | owner教師／學生本人 | courseId、classId、uid?、after | rows、next | 讀 | uid、逐題作答、游標 | 排除 |
| updateReports | owner教師 | courseId | processed、hasMore、updatedAt | 寫 | 讀逐題作答／改processed | 排除 |
| getReports | owner教師 | courseId、classId、after | rows、next、job | 讀 | 預先彙總題目選項數；非具名名冊 | 可安全彙總但本輪工具不用 |
| setSchedule | owner教師 | courseId、enabled | ok | 寫 | 無直接學生資料 | 排除 |
| getCompletion | owner教師 | courseId、classId、after(學號) | course、rows、next | 讀 | 姓名／學號／email／uid、個人進度、next學號 | 白名單；記憶體分頁彙總，只輸出數字 |
| createSnapshot | owner教師 | courseId、classId、snapshotId | done、snapshotId | 寫 | 具名名冊／個人進度 | 排除 |
| getSnapshots | owner教師 | courseId、snapshotId?、after | rows 或 meta、rows、next | 讀 | 快照含createdBy；明細具名進度 | 排除 |
| questionStudents | owner教師 | courseId、classId、unitId、version、questionId、after | rows、next | 讀 | 姓名／學號／uid、指定題作答 | 排除 |
| saveSheetConfig | 任一teacher claim | sheetId | ok、sheetId | 寫 | updatedBy、Sheet識別碼 | 排除 |
| getSyncStatus | 任一teacher claim | 無 | sheetId、status | 讀 | 錯誤可能含姓名／學號／email | 白名單；不輸出sheetId及錯誤全文／roster明細 |
| syncRoster | 任一teacher claim，course teacherIds過濾 | 無 | roster、hasErrors、lastSyncedAt | 寫 | 名冊個資 | 排除 |
| syncSheet | 任一teacher claim，course teacherIds過濾 | resetWrong? | banks、hasErrors、lastSyncedAt、availableTabs | 寫 | Sheet錯誤自由文字可能含個資 | 排除 |
| saveLearningEvents | 學生；拒教師 | courseId、unitId/chapterName、activityId、materialVersion、events | accepted、summary | 寫 | 姓名／學號／email／uid、逐題學習 | 排除 |
| getLearningDiagnostics | owner教師 | courseId、classId、after | rows、next | 讀 | 姓名／學號／email／uid、個人逐題學習 | 排除 |
| getAssessments | owner教師／有選課學生；需features.assessments | courseId | assessments | 條件寫 | 本人session作答／公布後結果 | 排除：逾時session自動結算 |
| prepareAssessment | owner教師；需feature | courseId、kind、classIds、makeupOf?、reason? | id | 寫 | createdBy、私有題目 | 排除 |
| controlAssessment | owner教師；需feature | courseId、examId、action(open/close/release) | ok | 寫 | audit uid | 排除 |
| startAssessment | 學生；需feature | courseId、examId | 試卷dto、session | 寫 | 具名session／逐題作答 | 排除 |
| saveAssessment | 學生；需feature | courseId、examId、revision、answers、submit? | 試卷dto、session | 寫 | 逐題作答 | 排除 |
| previewAssessment | owner教師；需feature | courseId、examId | questions、title | 讀 | 正式答案／解析；非個人作答 | 排除 |
| assessmentReport | owner教師；需feature | courseId | sessions、roster | 條件寫 | 姓名／學號／uid、分數 | 排除：逾時session自動結算 |
| getTeachingDeck | owner教師；需teachingConsole | courseId | title、slides | 讀 | 教師資產自由文字可能個資 | 排除 |
| getClassroomCourse | 學生；拒教師；需任一課堂feature | courseId | 班級過濾Course、studentName | 讀 | 本人名冊姓名 | 不能用來讀教師草稿 |
| getClassroomConfig | owner教師；需classroomInteraction | courseId | interactions | 讀 | 題目自由文字，非具名作答 | 排除 |
| saveClassroomConfig | owner教師；需feature | courseId、interactions | ok | 寫 | 題目內容 | 排除 |
| controlClassroomInteraction | owner教師；需feature | courseId、action、slideId、classIds、durationSeconds、roundId、replaceRoundId | round、serverNow | 寫 | 班級統計 | 排除 |
| getClassroomInteraction | 學生；拒教師；需feature | courseId | round、submitted、answers、results? | 讀 | 本人作答／投票選擇 | 排除 |
| submitClassroomInteraction | 學生；拒教師；需feature | courseId、roundId、answers | submitted、answers | 寫 | 姓名／學號／uid、投票 | 排除 |
| classroomInteractionReport | owner教師；需feature | courseId、roundId?/slideId?、history? | round、activeRound、rounds?、serverNow | 讀 | 班級彙總，題目自由文字 | 排除；無寫入（eligibleCount只在記憶體補） |
| classroomInteractionRecords | owner教師；需feature | courseId、roundId | rows | 讀 | 姓名／學號／uid、逐題投票 | 排除 |

## 非 callable 與共用 helper
- dailyReports：onSchedule，會寫報表與處理狀態；expireAssessments：onSchedule，寫入逾時session。
- sheetsPublish：onRequest，HMAC 授權，寫題庫；不是 callable。
- syncBankTabFromSheet／storeAssessmentSources 等 export helper 不是 callable，不列可連線工具。
- features.ts 無 callable，只有 requireFeature／featureAccess 授權包裝。

## 草稿結構與併發保護
- 根 courses/{courseId}：draft:Course、published?:Course、teacherIds、features、classIds、rosterVersion、updatedAt，另有私有 assessmentSources 等。
- Course（shared/model.ts:117）：id/title/description/term/classIds/classNames/classUnits/units/chapters/chapterOrder/classOverrides/chapterOverrides/staleUnits；Unit 是題目分類，Chapter 是教師單元，兩者都有 activities。Activity 有 id/title/type/phase/url/required/start/end/tracking/materialVersion 等。
- saveCourse（index.ts:189–321）在交易中檢查 owner，但整份 `draft: course` 覆寫；根 updatedAt=Date.now()，**輸入沒有 expectedVersion/expectedUpdatedAt，也不比較舊草稿**，所以不能用現有 saveCourse 安全 patch。
- updatedAt 也不是可靠全域草稿 revision：syncBankTabFromSheet 等路徑寫 draft 時沒有同步更新。publishedAt 是發布時間，不能替代草稿版本。
- publishCourse 在交易內用 JSON.stringify 比較先前讀取的 draft；mergeChapter 有 expectedDraft fingerprint 與 confirmationToken。這些保護不能推論成 saveCourse 已具備。

## 第 2 階段可行性與限制
- bootstrap 每次寫 profiles/{uid}；因此課程列表、get_course_draft 與 diff_draft_published 沒有可用的純唯讀入口。本輪保留工具名稱，但固定回傳 available:false／READONLY_BACKEND_GAP，**不呼叫 bootstrap、不偽造列表或草稿**。
- get_published 使用 getPublished；list_materials 由 repo shared/materials.ts AP2 目錄載入（38份），只核對指定課程已發布活動，草稿使用情況明確 unknown。
- get_sync_status 可回最後同步時間與結果數量、錯誤存在旗標、上次 bank 結果中的 staleUnits；不輸出 sheetId、名冊結果明細或錯誤全文。後者可能含人名且無法可靠用 regex 辨識，故直接捨棄；不把歷史 staleUnits 宣稱為目前草稿。
- getCompletion 是純讀，但會回傳具名名冊、個別 progress，沒有後端 aggregate-only 參數。可在本機逐頁處理且不落檔，使用 shared/model.ts 的 forClass／completion（公式3）彙總後只輸出學生數／啟用數／完成數／已完成必做單元數／必做單元機會數／頁數。游標學號只留記憶體，超限或游標循環直接失敗，不回半份統計。
- getReports 是預先彙總的題目選項數，可讀但不能代替完成度；updateReports 會寫入，嚴禁先呼叫刷新。
- 實際可呼叫硬白名單只有 getPublished、getSyncStatus、getCompletion；所有其餘入口（含有條件唯讀模式）一律拒絕。

## 第 3 階段建議（本輪不實作）
1. 先另案提供 listManagedCourses／getCourseDraft 純唯讀 callable，回傳最小投影與 owner 授權；否則本地課程列表／草稿／diff 功能無法驗收完整。
2. patchCourseDraft 在單一 Firestore 交易內做 owner 授權＋嚴格 patch 欄位白名單＋expectedRevision 比對，伺服器遞增 draftRevision；所有 draft 寫入路徑須一致更新 revision。
3. auditLog 同交易寫入 actor、時間、操作種類、requestId、revision前後值與已清理的差異，限制教師／管理者讀取；不記 token、名冊或原始學生作答。寫入再另行設計明確預覽與確認流程。
4. 可新增 aggregateCompletion 唯讀後端，降低具名名冊離開後端的必要；當前只在連接器記憶體處理，不對 MCP 回傳個人資料。

參考：[Firebase callable 協定](https://firebase.google.com/docs/functions/callable-reference)、[Firebase App Check callable](https://firebase.google.com/docs/app-check/cloud-functions)、[官方 MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/server)。
