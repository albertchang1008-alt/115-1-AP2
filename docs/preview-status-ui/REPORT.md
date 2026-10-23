# 給 Claude 的摘要

- #31完成；feature/preview-status-ui從origin/main（099df60d）建立，版本1.9.1→1.10.0；未push、未部署。
- 主要檔：src/App.tsx、ProgressBoard.tsx、CourseStatusOverview.tsx、UpdateStudentDialog.tsx、usePublishedCourse.ts、previewPreferences.ts、shared/courseStatus.ts及測試。
- PASS：npm run check，前端226／Functions61、build；新純函式8案（含27組狀態矩陣）與React兩尺寸完整流程。
- 預覽班級按教師＋課程記憶，無紀錄選勾選最多的班級；模擬開關預設關，只產生不回寫的衍生畫面，班級勾選仍有效。
- 總覽分開顯示草稿設定／更新差異／學生實際可見班級；getPublished讀失敗不冒充「尚未更新」，更新按鈕暫停並可重讀。
- 更新先讀最新學生端快照並確認增改移除數及兩種警告；取消不保存、不更新，確認只呼叫一次publishCourse。
- 全程本機MCP-TEST合成資料與API替身；新流程所有外部網路皆攔阻，未讀寫115-1-AP2、Sheet或學生資料。
- 截圖12張＋原始輸出僅放repo外驗收證據資料夾；repo保留本報告、小型verification.json與可重跑的測試程式。
- 偏離：無。版本規則要求的Functions／MCP套件及鎖檔只同步版本中繼資料，Functions程式、規則、資料格式與callable名稱未變。
- 建議抽查5項：預覽開關與班級排除、草稿／學生端班級差異、確認取消零寫入、學習進度新單元提示、兩尺寸截圖。

## 功能與語意

### 預覽

教師後台「預覽前台」讀學生端版本，使用既有forClass過濾；「保存並預覽草稿／預覽單元／預覽活動」保留明確的草稿來源標記與既有保存行為，進入後仍套班級與開放狀態過濾。學生真正看得到的內容與草稿預覽不混用。

localStorage以教師UID＋課程ID隔離，讀寫均try/catch。記憶的班級不存在時改選目前勾選單元最多的班級；沒有classUnits列等於全選，空陣列等於沒有勾選，計數不納入已刪除的分類ID；同數按classIds原順序。無班級時安全回傳空選項。

「把尚未開放的單元當作已開放」預設關，每次重新開啟或重設預覽都回關。開啟只複製hidden為current後交forClass，沒有修改原Course，沒有寫回草稿或學生資料；已考完仍為已考完、未勾選班級仍排除。頂端明示「預覽模擬：尚未開放的單元也顯示，學生目前看不到」。預覽班級顯示名稱與學生端一致。

### 課程與教材總覽

總覽逐章節／單元列出「尚未開放／目前學習／已考完」、草稿開放班級、學生端更新狀態，以及實際看得到的班級。更新狀態只採「已更新到學生端／有修改未更新／尚未更新到學生端」。草稿新增或移除、內容、題庫、活動、章節設定、班級勾選與班級覆寫均會比對；revision、publishedAt及立即生效的開放狀態／首頁提示不當成內容未更新。

「學生現在看得到」只用getPublished回應＋forClass計算，不拿草稿勾選冒充已生效；沒有班級可見時列「尚未開放／尚未更新到學生端／沒有勾選班級」。已考完依既有學生端規則可回看，因此列為可見，不代表能開始新的目前學習。草稿已移除但學生端仍有的單元也列出，避免誤認學生端已移除。

學生端讀取錯誤會明示、提供重讀，且阻止更新，只有既有API明確回「尚未發布課程」才認定無學生端版本。切換課程／離開頁面後的舊請求不會覆蓋另一課程。

### 更新到學生端與學習進度

教師端的原「發布」按鈕、提示、空狀態、通知及合併阻擋訊息均改為更新到學生端系列用語；後端字串只在前端呈現時轉換，publishCourse識別字不改。

更新按鈕先重新讀取學生端快照，確認框顯示新增／修改／移除的章節、單元、活動數；舊課程推導Chapter的活動鏡像不重複計數。清單列更新後仍尚未開放的單元，並警告「目前學習但沒有班級勾選」與「已勾選班級但仍尚未開放」。確認框採原生modal dialog，支援鍵盤焦點與Esc，取消無saveCourse／publishCourse。只有確認後才保存已審閱快照、呼叫既有publishCourse；保存後沿用草稿revision，避免下一次編輯丟失版本資訊。

學習進度標題下新增「這裡的變更會立即對學生生效，不需要更新到學生端」。每張單元卡標示底下分類是否已在學生端；尚未更新的新單元移到目前學習時，仍照原本API改開放狀態，並明示「學生端還沒有這個單元，請先到課程與教材更新到學生端」。本頁不代替內容更新。

## 驗證範圍與實際輸出

所有新增測試資料的courseId固定MCP-TEST，API替身拒絕其他課程ID，瀏覽器環境不帶Firebase設定，路由拒絕一切外部網路。沒有開正式平台或呼叫正式課程寫入。標準npm check原有的callable測試仍使用既有demo／記憶體測試環境。這不是實際學生或正式MCP課程的上線驗收。

- 班級記憶、教師／課程隔離、不可用storage、刪除班級與預設最多勾選。
- hidden模擬不改資料、不解除班級排除、不改已考完。
- 27組：三種開放狀態×三種更新狀態×勾選／不勾／未設列。
- 確認清單增改移除、兩類警告與活動鏡像去重。
- 兩尺寸React實際流程：總覽、取消零寫入、預覽關／開、換班仍排除、重開記住班級且模擬回關、學習進度提示、學生端讀取失敗／恢復、確認一次更新。
- 首輪兩個既有UI測試仍找舊文字／一步發布流程；已更新精確文案、加入確認動作及測試替身的教師getPublished權限，沒有略過既有斷言。首輪失敗輸出保留於repo外npm-check-first.log。
- 手機驗收另修固定外觀列遮住後台選單、確認框警告的橫向排版，以及學習進度三欄卡片壓窄下拉選單；截圖完成側欄動畫後才擷取，不拍中間幀。

最後整套npm run check的實際摘要：

~~~text
# tests 226
# suites 0
# pass 226
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 212582.834125

# tests 61
# suites 0
# pass 61
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 542.696334
~~~

完整輸出：[npm-check.log](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/npm-check.log)；[瀏覽器輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/browser-output.log)；[原始JSON](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/browser-verification.json)。小型核對結果：[verification.json](verification.json)。

重跑（在此worktree，需可啟動本機瀏覽器的權限；不需Firebase憑證）：

~~~sh
npm run check
node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs --test tests/preview-status.test.ts tests/preview-status-react.test.ts
PREVIEW_STATUS_EVIDENCE='/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23' node scripts/preview-status-verify.mjs --shots
~~~

## 手機與電腦截圖

各圖viewport為1280×800或390×844，未縮小字體、無水平溢位。全部為MCP-TEST合成資料。

| 場景 | 電腦1280×800 | 手機390×844 |
|---|---|---|
| 課程與教材總覽 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/overview-1280x800.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/overview-390x844.png) |
| 確認框 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/update-confirm-1280x800.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/update-confirm-390x844.png) |
| 學習進度說明 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/progress-1280x800.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/progress-390x844.png) |
| 新單元未更新提示 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/progress-missing-1280x800.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/progress-missing-390x844.png) |
| 預覽開關關 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/preview-off-1280x800.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/preview-off-390x844.png) |
| 預覽開關開 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/preview-on-1280x800.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/preview-on-390x844.png) |

![電腦總覽](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/overview-1280x800.png)

![手機確認框](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/update-confirm-390x844.png)

![手機預覽模擬](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/preview-status-ui-2026-10-23/preview-on-390x844.png)

## 版本、改動邊界與交接

1.9.1升一個次版號為1.10.0，依scripts/version.mjs同步VERSION、前端package／lock、shared/version.ts、public/version.json、README、三份文件的版本行與既有共用版本中繼資料（Functions及platform-mcp的package／lock、apps-script/version.gs）。Functions/src、Firestore規則、shared/model.ts、後端callable與儲存資料格式逐檔不變；不部署Functions。

原始輸出及PNG不commit；分支只提交程式、測試、報告與小JSON。根目錄有報告鏡像，實作在.worktrees/preview-status-ui。完成後佇列31交Claude抽查／裁定；沒有push、部署、同步題庫、讀寫115-1-AP2或修改正式班級勾選。
