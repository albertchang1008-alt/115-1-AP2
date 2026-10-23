# 給 Claude 的摘要

- #33完成；從origin/main 6e264cf7開fix/status-tags-in-unit-list；版本1.10.1，本機commit [Codex]，不push／部署。
- 刪除CourseStatusOverview表格元件；左側單元安排與右側分類改用UnitStatusTags，沿用shared/courseStatus既有比對函式。
- 全同狀態只一枚標籤，混合顯示數量；三色跨主題固定；只列尚未更新到學生端／有修改未更新，不列班級或已更新標籤。
- 讀取失敗顯示學生端狀態讀取失敗，單元安排有重新讀取按鈕；編輯仍可操作，原更新確認流程保留。
- PASS：新增4純函式案＋既有8案；完整check前端230／Functions61、build全過；兩尺寸完整React流程無溢位／錯誤／外部網路。
- PASS：狀態全同／混合、三個主題三色、列表內部裁切、已更新不顯示、表格移除、讀取失敗仍可編輯與重讀均有斷言。
- 主要檔：src/App.tsx、UnitStatusTags.tsx、style.css、shared/courseStatus.ts、tests/status-tags.test.ts與MCP-TEST fixture／瀏覽器驗證。
- 偏離：無；依既有版本同步規則，只同步Functions／MCP套件版本中繼資料，未改後端程式、資料格式、規則或callable名稱。
- 抽查5項：左列混合數量、右列逐分類、只顯示待注意學生端狀態、讀失敗可編輯、兩尺寸截圖。

## 內容與邊界

依docs/DECISIONS 10/23 21:08決定，不另做開放狀態總覽表格；刪除該React元件與表格CSS，但shared/courseStatus.ts既有計算函式及原測試全部保留。
新增openingStatusTags：以既有unitVisibility解讀分類；全同時不加數量，混合時各狀態加數量，例如目前學習3、尚未開放1，已考完亦同；沒有分類時不捏造開放狀態。
新增attentionStatusTags：沿用studentUpdateStatus，按分類彙總、去重，只顯示兩種需注意狀態。多個分類同一狀態只顯示一枚；正常已更新不顯示。
左右共用UnitStatusTags：左側附於各章節按鈕下方，右側在分類名稱／題數之下。沒有新增班級資訊；原本用來編輯班級與個別門檻的設定維持原功能，並非本次要刪除的狀態表格。
狀態讀取使用既有getPublished hook，loading不冒充未更新；失敗時顯示指定錯誤標籤，單元安排有重新讀取按鈕。讀取失敗不禁用欄位或保存草稿，既有更新到學生端按鈕仍依1.10.0規則等待讀取成功。
學生視角預覽／班級記憶／模擬開放、更新到學生端確認框、學習進度說明與立即生效操作的產品程式未改；瀏覽器驗證保留原流程及零預覽寫入斷言。
版本1.10.0→1.10.1，依version:sync更新統一版本欄位／鎖檔；functions/src、Firestore規則、shared/model.ts與src/service.ts不變。

## 版面與視覺檢查

初輪截圖發現舊手機單元安排為橫向捲動、章節按鈕為橫排，新增標籤會被內部裁切；既有主題也會把三色覆蓋成單色。已限制在編輯清單內改為直向排列與換行，為狀態標籤加足夠CSS優先度，未更動其他畫面主題。
驗證額外檢查單元安排scrollWidth與標籤boundingBox，三個blossom系列主題的三種開放狀態背景色均不同。這補上只檢查document水平溢位時無法察覺的內部裁切。
所有原有1.10.0預覽、取消確認、立即生效與確認更新測試繼續執行；使用MCP-TEST本機記憶體API替身，所有API拒絕非MCP-TEST，瀏覽器封鎖外部網路；沒有讀寫115-1-AP2。

## 驗證實際輸出

新增純函式4案：全同不加數量／混合精確數量／舊未設visibility及不改原資料／學生端只列需注意且去重。既有8案含27組狀態矩陣全部保留。
瀏覽器1280×800及390×844各跑：清單與右分類、表格不存在、不顯示健康更新標籤與班級、讀失敗→編輯欄位→重讀、確認取消零寫入、預覽記憶／開關、學習進度立即生效、新單元提示及確認僅更新一次。
首輪完整check在編譯時發現新增測試factory缺必填bankVersion；已補齊，先單獨build通過，再重跑最後完整check。首輪輸出保留npm-check-first.log，沒有略過編譯或測試。
npm run check完整實際摘要：

~~~text
# tests 230
# suites 0
# pass 230
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 212092.331167

# tests 61
# suites 0
# pass 61
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 549.695
~~~

原始輸出：
- [npm-check.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/npm-check.log>)
- [瀏覽器輸出](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/browser.log>)、[逐尺寸JSON](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/browser-verification.json>)

## 手機與電腦截圖

截圖保存至 **2026-10-30**。20張PNG與原始輸出存repo外日期資料夾，不commit；文字報告與小JSON保留於repo。
unit-list-full截取清單本身，保留全部範例；其餘圖為指定1280×800／390×844 viewport。

| 場景 | 電腦 | 手機 |
|---|---|---|
| 完整單元安排：三狀態、混合與待更新 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/unit-list-full-1280x800.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/unit-list-full-390x844.png>) |
| 單元安排與編輯頁 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/unit-list-1280x800.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/unit-list-390x844.png>) |
| 右側混合分類清單 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/classifications-1280x800.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/classifications-390x844.png>) |
| 新分類＋尚未更新 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/classification-new-1280x800.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/classification-new-390x844.png>) |
| 讀取失敗提示 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/read-error-1280x800.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/read-error-390x844.png>) |
| 更新確認仍可用 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/update-confirm-1280x800.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/update-confirm-390x844.png>) |
| 學生預覽模擬仍可用 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/preview-on-1280x800.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/preview-on-390x844.png>) |

![手機單元安排](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/unit-list-full-390x844.png>)

![電腦分類清單](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags/classifications-1280x800.png>)

## 重跑與交接

~~~sh
npm run check
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs --test tests/status-tags.test.ts tests/preview-status.test.ts
PREVIEW_STATUS_EVIDENCE='/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/status-tags' node scripts/preview-status-verify.mjs --shots
~~~

工作分支在.worktrees/status-tags-in-unit-list。完成後#33停-等Claude，週誌與check_handoff於根目錄執行；未push、部署、同步或修改正式課程。
