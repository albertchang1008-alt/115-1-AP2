# 作答時間統計＋離開畫面偵測 1.14.0：第一階段樣張

## 給 Claude 的摘要
- 結果：**樣張 PASS，停-等教師**；正式實作與獨立驗收待教師確認畫面後進行。
- 基準 origin/main `f01f9a09`；分支 feature/answer-integrity，worktree `.worktrees/answer-integrity`；根目錄分支未切換。
- 完成四個畫面：個人檔案時間新行、全班中位數＋⚠、學生返回提示、無效作答結果。
- Emulator 假資料含正常、偏快、離開 1 次、離開 4 次；另放舊作答、test 班、複習考與其他模式作排除對照。
- 自檢：TypeScript PASS、樣張投影單元 3/3、UI／Emulator 14 項 PASS；npm run check **251＋84，0 failed、0 skipped**。
- 四張 1920×1080 截圖與 390 寬提示檢查通過；證據保存至 **2026-11-05**。
- 樣張不改寫作答；沒有新增正式 callable、沒有監聽正式 visibility／blur 事件，也沒有改 submitAttempt／progress。
- 教師本輪更正「不用公告」：**不製作公告草稿**；未發布任何公告。
- 抽查：個人秒數、⚠ 說明、嚴格 >3／>60、無效100分仍保留舊80分、verification.json。

## 畫面與情境

| 畫面 | 展示內容 |
|---|---|
| 個人檔案 | 呼吸平均每題 30 秒、第一次 32 秒；泌尿平均／首次 35 秒、離開 1 次共 8 秒；保留最高有效分數與練習次數原行 |
| 全班總覽 | 4 位虛構學生，中位數 29 秒；首次100分且每題7秒的示範學生顯示 ⚠，hover 明示「僅供查看，不代表作弊」 |
| 學生離開提示 | 離開1次共12秒時可繼續；可切換至4次共42秒，顯示交卷後不列入成績的原因 |
| 無效作答結果 | 本次100分仍可看解析；最高有效分數維持舊80分、狀態待完成、練習次數照計2次，提供再作答一次 |

畫面使用平台既有深藍側欄與藍色操作色。全班的 ⚠ 只作查看提示，不因作答快取消成績；離開超限的結果另以「不列入成績」標示，兩者分開。

樣張頂部的四個切頁是供教師看不同角色畫面的示範控制器，不是正式學生導航或權限機制。所有資料都是虛構，沒有實際班級、名冊或學生個資。

## 樣張計算與邊界

本輪僅用於畫面投影；正式判分服務未改。樣張採以下明示範圍：
- 時間統計採單元完整 quiz；排除 test 班、review 單元與其他模式。每位學生以總答題秒數／總題數加權，班級取各學生平均的中位數。
- 有完整 answers[].seconds 時加總秒數，缺少可用秒數時以 duration 備援；第一次以 clientAt 排序。正式查詢範圍、效能與伺服器排序留待完整版。
- 以「第一次達滿分門檻，且第一次每題秒數 < 中位數一半」顯示 ⚠，不以它作違規判定。
- 離開 **3 次／60 秒仍有效；4 次或61秒才不列成績**。舊作答沒有 leaveCount 的資料保持有效；非完整單元模式與複習考不作廢。
- 時間統計包含未列成績的練習，讓教師仍能查看；最高有效分數的投影排除該次，練習次數仍包含。

## 實際假資料來源與隔離

真實 Firestore Emulator 專案 `demo-answer-integrity-sample`；假課程 `answer-integrity-sample`：11 筆 attempts、4 位示範學生＋1 位 test 對照、2 個示範單元＋1 個複習考對照。
個人檔案與總覽使用從 Emulator 回讀的資料計算；學生返回提示用頁面按鈕模擬，不安裝正式瀏覽器事件監聽。結果頁固定展示離開4次的假作答。

種子程式只允許 localhost／127.0.0.1 的 Emulator host 與 demo- 專案；樣張 HTTP 伺服器只綁 127.0.0.1，僅接受 GET。結束時回讀完整資料，與開始快照逐筆相同。

樣張入口獨立於 App.tsx；#39 檔案未修改，沒有共用區塊衝突。正式版本維持 1.12.0，1.14.0 升版留在完整版。未新增依賴；實際建置產物沒有 ai-view-tabs／AnswerIntegritySample。

## 自檢與實際輸出

```text
TypeScript: exit 0
樣張投影測試：tests 3 / pass 3 / fail 0 / skipped 0
UI＋Firestore Emulator：pass true，14 checks
fakeAttempts: 11 / cohortStudents: 4 / medianSeconds: 29 / flagged: 1
1920×1080 四圖；390×844 提示無水平溢出
npm run check: exit 0
# tests 251 / pass 251 / fail 0 / skipped 0
# tests 84 / pass 84 / fail 0 / skipped 0
```

單元測試涵蓋 >3／>60 邊界、舊紀錄、其他模式、test／複習排除、首次達門檻與偏快條件並存、舊80分與無效100分的投影。這些是**樣張計算測試，並非正式後端規則已驗收**。
UI 自檢確認提示可關閉、4次原因、仍可看解析、可重作、學生畫面不渲染總覽、Emulator 原資料不變與無瀏覽器例外。首次腳本未先關閉提示就切頁而逾時，修正操作順序重跑通過；初次輸出也保留。

## 證據與四張截圖

`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-29/answer-integrity-sample/`

**截圖保存至 2026-11-05**。四張均已人工檢視：
- ui/01-student-profile-1920.png
- ui/02-class-overview-1920.png（含 ⚠ tooltip）
- ui/03-student-return-prompt-1920.png
- ui/04-invalid-result-1920.png

ui/verification.json、unit.log、typecheck.log、emulator-ui.log、check.log 為實際輸出；manifest.json 附 SHA256。截圖與原始輸出只放 repo 外。

## 重開本機樣張

於 `.worktrees/answer-integrity`：

```sh
export PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-26.jdk/Contents/Home
firebase emulators:exec --only firestore --project demo-answer-integrity-sample 'node scripts/answer-integrity-sample.mjs --serve'
```

開啟 `http://127.0.0.1:4180/`；Ctrl+C 停止。重新自檢與截圖：

```sh
firebase emulators:exec --only firestore --project demo-answer-integrity-sample 'node scripts/answer-integrity-sample.mjs --out /tmp/answer-integrity-sample'
```

## 教師核可後的完整版

待核可後才實作正式教師限定統計查詢與學生隔離、visibilitychange／blur／focus 去重與計時、提交欄位驗證、後端 invalid 判定與 best／達標／passedAt 保護、其他模式僅記錄、正式手機實測、效能成本與乾淨 clone 驗證。樣張的前端角色切頁不代替伺服器權限驗證。
本輪沒有正式服務或部署清單可執行，不 push、不部署、不寫正式資料。

## 給教師的待辦

請查看四張截圖，確認時間新行、全班 ⚠ 的呈現、返回提示與無效結果的語氣／內容是否合用；畫面核可後才接續完整版。#40 停-等教師。
