# 1.6.2 單元卡姓名：交回 Claude 驗收

2026-10-02；分支 `hotfix/1.6.2-student-name`，從 `hotfix/1.6.1-quiz-scroll`（7e4732b）建立。已實作並提交，未 push、合併或部署。

## 實作範圍

- bootstrap 的每門學生課程回傳 `studentName`：使用該課程本人的 enrollment.name（舊課程使用本人 roster.name），去頭尾空白；無姓名時使用 Google token.name，再無則空字串。沿用 access 的本人文件查詢，沒有新增 Firestore 讀取，不接受 request.data 指定其他身份。
- ProgressUnitCard 完成／逾期完成狀態下方新增中性姓名標籤，同字級、內距、高度與左緣；未完成及空姓名不顯示。教師預覽一律「預覽學生」。超長姓名省略顯示，title 與 aria-label 保留全文，不擠出卡片。
- 選看單元的空必做集合會讓既有 summary.state 為 done，因此只在選看項目確實全部完成後顯示標籤；沒有修改正式完成度計算、成績、期限或寫入邏輯。
- VERSION 與前後端套件、共用版本、Apps Script、公開 version.json、README／handoff／DEVELOPMENT_LOG 同步 1.6.2。未更動 coagulation-v1 或另一工作樹的教材。

## 驗證

`npm run check` 完整成功，含 `npm test`（112/112）、`npm run build`（TypeScript／Vite／version:check）、`npm --prefix functions run build`（runtime 載入33個匯出函式）、`npm --prefix functions test`（18/18）。

前端新增4項真實元件 render 測試：完成／逾期完成、各未完成狀態、空白／HTML文字／預覽姓名、選看單元；Functions新增2項 actual bootstrap callable + 記憶體 Firestore 測試：每課本人姓名隔離、停用排除、偽造身份不採用、舊 roster、Google／空字串備援。

`node scripts/student-name-verify.mjs` 使用真實 Student 介面、Chrome 與本機 fixture API，無登入或正式資料寫入。390px及1280px × 已完成／已完成（逾期）／進行中 × 預設／實際設定選單最大字級，共12張截圖：控制台與頁面錯誤0、橫向溢位0、姓名與狀態左緣差0px。另加390px最大字級的教師預覽、超長姓名、選看完成、選看未開始4種邊界檢查。

| 兩種視窗寬度均相同 | 姓名／完成標籤字級 | 姓名／完成標籤高度 | 內距（上／右／下／左） |
|---|---|---|---|
| 預設 | 12px | 25.796875px | 3／8／3／8px |
| 最大字級（1.3倍） | 15.6px | 31.71875px | 3／8／3／8px |

字級來源共用 `.status` 的 `calc(12px * var(--font-scale, 1))`，量測詳見 [report.json](student-name-1.6.2-screenshots/report.json)。已目視檢查手機完成、手機逾期完成最大字級、桌機進行中，版面正常。此為本機資料驗證，不是正式 Firebase 登入端到端驗收；教師部署後仍可確認真實名冊名稱。

## 指定截圖

| 狀態 | 390px | 1280px |
|---|---|---|
| 已完成 | [截圖](student-name-1.6.2-screenshots/390-done-default.png) | [截圖](student-name-1.6.2-screenshots/1280-done-default.png) |
| 已完成（逾期） | [截圖](student-name-1.6.2-screenshots/390-late-default.png) | [截圖](student-name-1.6.2-screenshots/1280-late-default.png) |
| 進行中 | [截圖](student-name-1.6.2-screenshots/390-inProgress-default.png) | [截圖](student-name-1.6.2-screenshots/1280-inProgress-default.png) |

同目錄 `*-xlarge.png` 為以上六種畫面的最大字級版本。

## 下一步

待 Claude 驗收上述程式與截圖；教師授權前不 push／部署。根目錄五份既有 RTF 草稿保留未追蹤，不納入本次提交。
