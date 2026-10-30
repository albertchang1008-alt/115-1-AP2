> 本頁保留 c1009043 已核可樣張；1.15.0 完整版與部署清單見 [QUESTION_MANAGER_1.15.0_REPORT.md](QUESTION_MANAGER_1.15.0_REPORT.md)。

# 題目管理 1.13.0：第一階段互動樣張

## 給 Claude 的摘要
- 結果：**樣張 PASS，停-等教師**；這是畫面與操作方向確認，尚未進入完整版驗收。
- 基準：origin/main 與指定 `f01f9a09` 一致；新增 `feature/question-manager`、`.worktrees/question-manager`，根目錄分支未切換。
- 完成：選簡報／舊版分組、單選／排序／是非編輯、差異預覽、已有作答警告、新增／刪除的互動示範。
- Emulator：demo-question-manager-sample，7 個虛構活動題、5 輪假資料；操作只改頁面狀態，原資料逐筆相同。
- 自檢：TypeScript PASS；差異預覽單元測試 2/2；UI／Emulator 12 項 PASS；npm run check **250＋84，0 failed、0 skipped**。
- 四張 1920×1080 截圖：總覽、編輯中、差異預覽、已有作答警告，保存至 **2026-11-05**。
- 偏離：無；正式版仍 1.12.0，1.13.0 升版與新 callable／xlsx 匯出屬教師核可後的完整版。
- 抽查：總覽儲存入口、舊→新差異、作答警告、是非唯讀選項、verification.json 的原資料不變斷言。

## 本輪完成範圍

畫面沿用平台深藍側欄、藍色操作與淺灰底色。選擇「呼吸複習」「泌尿＋體液複習」或「其他／舊版」後，左側顯示有題目的頁碼、標題、題型、作答輪數；右側直接編輯。

可試用標題、題幹、選項、正解、解析；單選點選正解，排序題分開顯示題目選項與答案順序。是非選項固定為「○ 對」「✕ 錯」。可新增／移除欄位，亦可新增、刪除整題。刪除最後一題會顯示空白引導。

儲存先列修改前→修改後，再確認；有作答輪次的題目同時在編輯及差異預覽顯示指定警告，不阻擋確認。未儲存切換題目時提示捨棄。所有確認僅修改本頁狀態，重新整理還原。

樣張為獨立入口，沒有接到正式 TeachingControl；檢查產物 dist/assets 沒有 qm-app／QuestionManagerSample，正式前端入口、Functions 與規則均未修改。未新增依賴。

## Emulator 假資料與界線

資料使用現有集合形狀：
- courses/question-manager-sample/teachingDecks：兩份虛構簡報。
- classroomConfig/interactions 與 answerKeys：7 題活動流程示範（包含 R-REV-04、U-REV-07）。
- classroomRounds：5 輪虛構紀錄，沒有學生名冊或個人資料。

種子程式限制為 localhost／127.0.0.1 的 FIRESTORE_EMULATOR_HOST，且 projectId 必須 demo- 開頭；HTTP 樣張伺服器只綁 127.0.0.1、只接受 GET。頁面讀出的題目、答案與輪數皆來自真實 Firestore Emulator。
編輯確認不呼叫寫入服務。自檢結束再回讀 Emulator，與開始的完整資料比對一致。

## 四張 1920 截圖

證據目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-29/question-manager-sample/`。
**截圖保存至 2026-11-05**。已逐張人工查看，沒有水平溢出，總覽與編輯頁的底部儲存按鈕完整入鏡。

| 畫面 | 檔案 |
|---|---|
| 總覽 | ui/01-overview-1920.png |
| 編輯中 | ui/02-editing-1920.png |
| 差異預覽 | ui/03-diff-preview-1920.png |
| 已有作答警告 | ui/04-round-warning-1920.png |

## 自檢實際輸出

```text
TypeScript: exit 0
差異預覽單元：tests 2 / pass 2 / fail 0 / skipped 0
UI＋Firestore Emulator: pass true / 12 checks / 1920×1080 / overflow false
npm run check: exit 0
# tests 250 / pass 250 / fail 0 / skipped 0
# tests 84 / pass 84 / fail 0 / skipped 0
sample_in_production_bundle: []
```

原始輸出：typecheck.log、unit.log、emulator-ui.log、check.log；UI 詳情在 ui/verification.json。Emulator 測試同時驗證確認狀態、兩種 legacy 題目保留、是非選項唯讀、排序顯示、新增／刪除、刪空引導與原資料不變。詳細輸出與截圖只放 repo 外。
完整 check 之後補了樣張的刪空引導，已另跑 TypeScript 與整套樣張 Emulator 操作通過；正式程式沒有變更。

## 在本機重開樣張

於 `.worktrees/question-manager`，使用 Node 22.23.2 與 Java 26：

```sh
export PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-26.jdk/Contents/Home
firebase emulators:exec --only firestore --project demo-question-manager-sample 'node scripts/question-manager-sample.mjs --serve'
```

開啟 `http://127.0.0.1:4179/`，停止時按 Ctrl+C。重新擷取截圖／自檢：

```sh
firebase emulators:exec --only firestore --project demo-question-manager-sample 'node scripts/question-manager-sample.mjs --out /tmp/question-manager-sample'
```

## 教師核可後才做的完整版

正式控制台入口、教師限定 updateClassroomQuestions callable、只更新目標 slideId 的 transaction／並發衝突處理、正式作答輪數查詢、學生權限與答案隔離測試、xlsx 匯出→匯入 round-trip、乾淨 clone 完整驗證及正式升版 1.13.0，均留至教師看過樣張後。
「下載題目表 .xlsx」目前為停用的版面預留，不會產生假下載。正式部署清單也待完整版完成後提供，本輪沒有部署步驟。

## 給教師的待辦

請看四張截圖，確認選簡報／左側列表與右側編輯、差異預覽、已有作答警告這個方向是否合用；可直接指出要改的位置。畫面確認後，才授權接續完整版。
#39 停-等教師；本輪不 push、不部署、不寫正式資料。
