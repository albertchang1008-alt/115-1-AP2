# 給 Claude 的摘要
- 依CODEX_TASK_reduce-function-costs-fix_2026-10-20.md修正兩個退回項目；前輪8255f29。
- 分支codex/reduce-function-costs；本輪修改commit見git log -1，未push／merge／部署。
- 後端functions/src/index.ts：研究accepted回全部ID，summary仍只計fresh；部署範圍前端＋Functions。
- 前端src/EventBatcher.ts、LearningBridge.ts、ResearchBridge.ts、Student.tsx：明確拒絕移出且防重送、提示重開教材。
- 測試tests/function-costs.test.ts：直接執行真實callable的學習／研究回應遺失重送，非accepted mock。
- 自我檢查：針對23／23；完整前端185／185、後端61／61，FAIL 0、skip 0，build／版本PASS。
- 偏離：無；不調CPU／記憶體，不讀寫正式學生資料，發布版本待教師核定。
- 抽查1：實際handler先commit後拋unavailable，重送accepted含舊ID、summary／寫入次數不增加。
- 抽查2：3種拒絕碼不重試／不假ack；localStorage只留放棄ID，iframe重送及重開不再連雲端。
- 抽查3：網路／unavailable／deadline-exceeded／internal保留佇列；版本過期顯示重開提示。
- 抽查4：部署先更新saveExplanationResearchEvents，再發布前端，不可只更新前端。
- 抽查5：學生閒置10秒仍待教師決定，最短30秒活動可能少約1/3作答時間。

## 改動與效果

一般學習紀錄與解析研究紀錄先寫入本機佇列，每30秒或滿30筆送一批。事件ID、順序、內容及後端權限驗證不變；成功與暫時失敗事件不合併、不捨棄，伺服器明確拒絕的該批則放棄。研究事件的accepted語意已修正為包含原已存在的ID，summary仍只計fresh。每一批仍不超過後端30筆上限。
教材的completed事件立即帶動佇列送出，只有收到伺服器accepted IDs後才回覆iframe，且不提前更新完成提示。預覽模式不呼叫雲端、不持久化正式紀錄。

重新連線、頁面隱藏、離開頁面及SPA元件卸載會嘗試補送；只有可重試錯誤的資料留在待送佇列。重新進入相同帳號／課程／單元／版本時重試。
快速返回同頁時，舊視圖的晚到回應會合併仍未確認的持久化ID，避免刪掉新視圖加入的事件。瀏覽器關閉時不保證網路送達，因此不能省略本機佇列。
儲存空間不可用時改為立即送雲端並顯示錯誤；網路和本機儲存同時不可用時，只能保留記憶體直到頁面關閉，沒有虛構「已儲存」。

課堂互動在活動開放時維持2秒輪詢；學生閒置由5秒改10秒，教師無活動由2秒改10秒。背景／離線不建立新的請求，回前景／恢復連線立即更新。
代價：閒置頁面發現新活動的延遲上限增加約5秒（另加網路時間）；最短30秒活動中，學生最慢約10秒才看到題目，可能少掉約1/3作答時間；仍由教師決定是否接受。可替代為學生閒置維持5秒，只省背景／離線及教師端輪詢；本輪未擅自裁定。已在途請求不強制取消；卸載後的舊回應不能更新元件。

## 能量化的改善與不能推論的事

- 合成測試：20筆同時產生的解析事件，由逐筆20次變為1次請求（該情境95%呼叫減少）；全部事件與ID仍保存。
- 可見閒置學生頁面：理論每分鐘約12次降為6次（50%）；教師閒置約30次降6次（80%）。活動中仍約30次／分鐘。
- 隱藏／離線頁面：除了既有在途請求，不再輪詢；恢復可用狀態時立即補查。
- 對15秒一筆的教材time事件，30秒視窗可把相鄰事件一起送；邊界、關頁、重試及通關立即送會影響實際批次數。
- 請求數減少不等於同百分比費用減少。事件個別文件仍需儲存，實際節省取決於固定權限讀取／交易／HTTP開銷、班級使用型態與免費額度。
- 前輪占比是運算用量，沒有SKU對帳，不估「每月省多少元」。本次沒有更改Functions資源配置；伺服器明確拒絕的事件依交辦移出待送佇列，不冒充成功保存。

## 本輪修正與部署範圍

1. `saveExplanationResearchEvents`回傳`accepted: events.map(e => e.id)`。已存在文件同樣代表伺服器已確認，首次寫入與summary更新仍只處理fresh。回應在commit後遺失時，下次可安全重送原ID。
2. `invalid-argument`、`failed-precondition`、`permission-denied`（支援Firebase的functions/前綴）移除該批。只將放棄ID寫入同帳號／課程／單元／版本佇列的`:discarded`鍵，最多保留最後2000個ID；不留被拒絕payload，不假裝已儲存。父頁可拒絕iframe的相同ID重播，重新建立佇列也不會再次發出網路請求。
3. 研究明確拒絕只提示一次；暫時失敗與明確拒絕各可提示一次，避免先發生暫時失敗後掩蓋永久拒絕。學習紀錄若為「教材版本已更新」，明確提示該批未儲存、請重新開啟教材，且不更新完成度。
4. 只重試`unavailable`、`deadline-exceeded`、`internal`與網路錯誤（包括無Firebase code的fetch／socket／offline等連線錯誤）；其他coded或無法辨識的send錯誤不自動重試。沒有accepted／部分accepted屬協定未確認，保留未確認部分重試，不當成已被伺服器明確拒絕。
5. 原本iframe在等待ack時，每次新增事件都會重新postMessage；父頁以ID去重，這些重複postMessage不會新增網路請求。明確拒絕的ID不回傳成功ack，而以放棄ID避免被重新排入網路佇列，學生需依提示重開舊教材。

**部署範圍：前端＋Functions（至少saveExplanationResearchEvents）。先部署後端accepted修正，再發布本輪前端。** 只發布前端仍會遇到舊研究handler對重送事件回傳空accepted的問題。本次不執行部署、不push，不調Functions資源配置，不執行資料遷移；版本仍1.9.1，正式發布版本由教師核定。

## 驗證

- 針對性：23／23 PASS，0 FAIL、0 skipped；輸出`docs/cost-investigation/fix-targeted-output.txt`。
- 真實後端重送測試：直接呼叫編譯後`saveLearningEvents.run`／`saveExplanationResearchEvents.run`；只替換Firestore I/O為既有transaction memory double，不用「accepted全回」mock替代handler。第一次真的完成交易後丟unavailable，前端保留佇列；第二次用同ID重送，清空佇列，驗證文件與summary快照、總寫入次數完全不變，learning完成回呼只在確認後執行一次。
- 紅→綠證據：修正前23項中的research回應遺失情境會留在localStorage，實測13項中12 PASS／1 FAIL；輸出`docs/cost-investigation/fix-red-output.txt`，修正後該案例及其餘項目全過。
- 其餘新增測試：三種永久拒絕碼、iframe同ID重播、重新開頁、計時／online／hidden／close不再重送；五種暫時錯誤保留與重試；教材版本過期不假通關；研究拒絕一次提示，之後不同新ID仍能正常送出。
- 最終`npm run check`：前端185／185、後端61／61，FAIL 0、skip 0；版本一致1.9.1、TypeScript及Vite建置PASS，exit 0；原始輸出`docs/cost-investigation/check-output.txt`。
- `git diff --check`：PASS。僅用本機合成帳號與Firestore記憶體double，未接正式雲端或讀寫學生資料；既有全套前端／Functions回歸照跑，未skip測試。

## 審查與後續

交辦與唯一現況在根目錄CODEX_TASK_reduce-function-costs-fix_2026-10-20.md及CODEX_QUEUE.md#27；worktree隨origin/main帶入的是舊交接格式，依教師本次規則不改handoff或DEVELOPMENT_LOG。
需Claude部署前審查此diff與測試證據，教師核定正式發布版本與部署；本次不自行發布。部署必須包含本輪Functions accepted修正及前端，不可只更新前端。
核准上線後，用同樣監控篩選比較相近課務使用量下的每活躍學生／每次教材活動請求量及計費時間；並抽查完成度與研究紀錄完整性，再用同期間SKU帳單確認省費。不要只比較學生數不同的日期總額。
