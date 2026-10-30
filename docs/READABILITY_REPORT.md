# 暫停紀錄（教師2026-10-30 20:16）

- #42停-等教師，改做#44；未push、部署、刪檔或寫正式資料。
- 暫停前HEAD：027dad343310e9381380c05819c885285ffbd465；本紀錄隨WIP提交保存，WIP HEAD以根目錄CODEX_QUEUE.md位置欄為準。
- 17份已完成全面overlay與四組合驗證；背景命令在暫停指令讀取前已自然結束exit0：17/17、4864狀態、閱讀／靜態／流程問題0。
- 已過：整合origin/main 7bc637a1、升1.15.1；npm run check前端284／後端101、0 skipped；Emulator7組；49份雙字級截圖；20檔grep路徑／指令自查0命中；HTML與教材來源0變動。
- 未跑：Linux實跑（教師指定待Claude用git bundle、雲端非root驗收）；未做正式環境驗證。尚未產生最終bundle與完整證據manifest，未交Claude；報告自動定稿在事件檔數量斷言失敗，需接續核對事件檔範圍後才可定稿。
- 下次從本WIP接續：先讀根目錄佇列與教師新決定；補齊最終gate輸出／截圖至repo外證據、重新核對保護雜湊與報告、產生bundle及manifest，再依教師授權交Claude。不需重寫已完成內容；有新整合或改碼才重跑受影響驗證。
- 最後完整輸出仍在/tmp/readability-full/integrated-check.log，gate原始資料在/tmp/course-readability；既有外部證據見下文。暫存目錄可能清除，已保存的外部證據保存至2026-11-06。

---

# #42 閱讀加大全面版與設定保存

## 給 Claude 的摘要

- 以下為暫停前草稿，最終驗證數字以最上方暫停紀錄與原始log為準，尚未完成交驗定稿。
- 以36de9666為內容保護基準；新版主線整合及版號依任務15:56追加處理。
- 不改教材HTML、題目、答案、reviewed卡與闖關判定；不push、不部署、不寫正式資料。
- 後端只需部署saveCourse、bootstrap；前端由教師核准後推送。
- 其他舊教材僅初始畫面警告報告，不宣稱完整流程合格。
- 證據資料夾：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-full/`；截圖保存至2026-11-06。

## 平台情境與字級保護

實際Player的HtmlMaterial與FontSizePicker在本機隔離頁運作，沿用`sandbox="allow-scripts"`，不加allow-same-origin、不用srcdoc。教材不能讀平台localStorage；由Player透過protocolVersion=1的display-prefs送字級與overlay布林。SDK只接受parent、合法字級與布林，初次載入、ready、字級切換與設定變動均送出；晚到ready使用最新設定。非互動教材同樣接收顯示偏好。

取消三份樣張限制，全部實際載入SDK的49份教材可套用。CSS限定data-readability=on，分apply-kit-script／learning-kit／other。缺省開啟，教師可關閉或指定materialVersion排除。關閉時清除CSS、標記及放大工具，既有學習context與事件流程保留。

SDK在原樣式情境逐元素量出計算字級，透過自訂變數讓CSS取max(原字級,規範字級×scale)。內文與選項18、題幹19、標題21、行高1.6、點擊高44；不把原來較大的標題壓小。檢查器同時比較CSS字級與SVG實際螢幕字級，若小於原版同元素即FAIL。參考量測呼叫原教材自己的responsive resize，使原生箭頭標籤使用正確縮放比例；沒有硬改SVG標籤座標。

不改DOM版面順序。短訊息垂直置中，圖面依自然高度伸展；空間標示題保留原生平移座標。低於圖字門檻的圖須有獨立可操作的放大入口；點陣圖不能以font-size推斷文字大小，無放大替代即FAIL。放大複本為唯讀圖像，關閉後原題狀態不變。

## 檢查涵蓋與保護

17份以390×844、1280×800外框，各預設與特大四組合完整走訪；平台閱讀列48px，iframe高度分別796、752。涵蓋引導、六節點、錯答／正答、回饋、過關、轉場、考核與完成；按畫面量測字級、行高、對比、水平溢出、選項重疊、按鈕水平與垂直裁字。測試會檢查同一元素原版／overlay字級，不以單一全頁最小值代替角色門檻。圖字可低於內文18px，仍須符合圖字12px或放大替代規則。

68份事件紀錄須各有completedCalls=1、有效questionId／nodeId、錯答與正答、六節點及reduceLearning結果。HTML與materials-src逐檔比對36de9666；SDK從let context起的學習佇列與事件程式原文不變。原HTML的重建與雜湊測試照常執行。

靜態檢查保留169筆既有apply-kit來源宣告白名單：依13:15決定不改原HTML及其來源，改由SDK overlay接管字級。每筆列出檔案、selector、property、value與理由；動態17份四組合仍是必過門檻，未將動態閱讀失敗加入白名單。學生端src新增的固定字級已改為乘font-scale。

## 開關後端保存（原#42b）

saveCourse沿用既有教師權限、課程teacherIds、交易與expectedRevision；正規化並保存readabilityOverlay與排除清單，缺省true及空陣列。bootstrap的教師及學生分支回傳相同設定；既有三個features布林維持獨立。根層設定優先，缺欄時相容既有draft／published設定；不改published教材、不批次遷移課程，不更動班級勾選。

驗證含非教師與跨課程拒絕、true／false＋排除清單往返、缺省開啟、非法型別／路徑／重複／過量項目拒絕、revision衝突不覆寫。真實Firestore Emulator使用demo-readability、127.0.0.1:8157及合成教師／學生，腳本對非demo專案與非本機Emulator會先拒絕。未連正式Firestore。

## 舊教材警告的範圍

其餘32份僅量390寬初始畫面，預設／特大共64組；不是完整作答流程驗收。所有外部字型、舊GA及其他非本機資源請求均由測試攔截，不會為驗收產生正式追蹤。依任務這些警告不擋17份期中教材，但仍列出具體問題，不能視為所有教材已達標。
