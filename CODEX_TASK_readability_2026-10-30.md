# CODEX_TASK：教材字級放大＋閱讀規範自動檢查（佇列 #42）

對象：Codex；建立：2026-10-30 Claude；教師 09:37 反映手機上資訊圖表字太小，09:43 要求加入防範機制。

## 規範
以 docs/READABILITY_STANDARD.md 為準（AGENTS.md／CLAUDE.md 第 10 條）。

## 起點
從最新 origin/main（若 release/1.15.0 已合併則以其為底）開 feature/readability，worktree `.worktrees/readability`；不要切換根目錄分支；不 push、不部署、不寫正式資料；不改教材文字內容、題目、答案、reviewed 卡、闖關判定。

## A. 自動檢查（先做，用來量出現況）
1. `scripts/readability-check.mjs`：Playwright 開啟 public/materials 下期中範圍 17 份（呼吸 7、泌尿 6、體液 4）每個畫面（含引導、節點、題目、回饋、過關、轉場、考核），390×844 與 1280×800、字級預設與特大；量測規範各項，輸出 JSON＋摘要。
2. 靜態檢查：apply-kit／src CSS 未乘 `--font-scale` 的 font-size 報錯（白名單附理由）。
3. 併入 `npm run check`；先只對 17 份與學生端 src 生效，其他舊教材（心臟、血液等）列為警告清單不擋。
4. 先跑一次現況，報告列出不合格數量與最小字級（作為修改前基準）。

## B. 樣張（教師點頭前不全面套用）
以「腎臟位置構造與功能」kidney-anatomy-v1 做樣張：修改 apply-kit 樣式（字級依規範、全部改 `calc(... var(--font-scale,1))`、讀取 localStorage `course-font-scale` 並監聽 storage 事件、短訊息畫面放大或垂直置中）。附 390 寬三組截圖：目前／調整後預設／調整後特大，畫面含「恭喜過關」回饋與「開始考核」轉場。
樣張完成 → #42 停-等教師。

## C. 完整版（教師核可樣張後）
套用到 17 份並重建；`npm test` 的教材重建比對與 sha 一併更新；確認已通關紀錄、事件格式、questionTotal／nodeTotal 不變；自動檢查 17 份全數 PASS；平台學生端 src 同步符合規範（若有不合格項一併修）。報告 docs/READABILITY_REPORT.md，附前後對照與部署（只前端：git push origin feature/readability:main；不得寫 git checkout main）。完成後 #42 停-等Claude。

## 2026-10-30 13:15 教師決定：改走「應急方案一」（取代原 C；樣板化留到期中後）
先用平台層「閱讀加大」讓全部教材期中前好讀；教材原檔不改。Claude 已查好架構，請照下列做。

### 架構事實（Claude 已核對 origin/main 45b9e266）
- 平台 src/Player.tsx 以 `<iframe sandbox="allow-scripts">` 載入教材＝不透明來源：平台**不能**直接改 iframe DOM，教材也**讀不到** localStorage。B 樣張的 readability.js 讀 localStorage 的做法在平台內會失效，必須改用 postMessage。
- 幾乎所有教材都載入共用 `public/materials/course-learning.js`（絕對網址），清冊見 docs/readability/MATERIAL_INVENTORY.md（請複核哪些份實際未載入）。Player 已有 ready→init 的 postMessage 握手（protocolVersion 1）。
- 因此最省事的掛勾點是 **course-learning.js**：改它一個檔，全部教材生效，不必改 51 份 HTML，也不必 srcdoc 加工。

### 要做的事
1. **平台送字級**：Player 在 init 後送 `{type:'display-prefs', protocolVersion:1, fontScale, overlay:true|false}`；學生切換平台字級（FontSizePicker／course-font-scale）時再送一次。非互動教材（tracking≠interactive）也要送。
2. **course-learning.js 接收**：收到 display-prefs 後設定 `document.documentElement.style --font-scale`，overlay 為 true 時載入共用 `public/materials/readability-overlay.css`（同目錄絕對網址）並在 <html> 加 `data-readability="on"` 與 kit 標記（依清冊三類：apply-kit-script／learning-kit／other）。overlay 為 false 時移除。不得影響既有 learning-events、init、ack 流程。
3. **readability-overlay.css**：依 docs/READABILITY_STANDARD.md，分三組選擇器（apply-kit-script、learning-kit、other）；所有規則限定在 `html[data-readability="on"]` 底下，乘 `var(--font-scale,1)`；按鈕／選項 min-height 44px；過關、轉場短訊息放大並垂直置中。**不改版面順序**（B 樣張第1關把回饋移到圖上方、圖與「較高／較低」被推出畫面，這不可接受）；不硬改 SVG 標籤位置。
4. **開關**：課程 features 加 `readabilityOverlay`（預設開，教師後台可關），另支援「排除教材清單」（materialVersion 陣列）。關閉時 Player 送 overlay:false。
5. **驗收**：沿用 feature/readability 的檢查器，但改在「平台 iframe＋postMessage」情境量測（不能直接開教材網址假裝通過）；期中 17 份 4 組合必須 PASS，其餘舊教材出報告、不擋上線；每份附 390 寬預設＋特大截圖；確認闖關、learning-events、完成回報不變；`npm run check` 全過。
6. **樣張先行**：先做 kidney-anatomy-v1、airway-structure-v1（呼吸）、cardiac-output-v1（舊教材）各一份，390 寬目前／預設／特大截圖（含第1關作答與過關、轉場）→ #42 停-等教師。核可後再擴到全部。
7. 分支：沿用 feature/readability（31eb47fc）繼續；B 的 opt-in 檔可沿用或移除，報告說明。檢查門檻在 17 份全 PASS 前不得合併 main（GitHub 建置會失敗）。只需前端部署。

## 2026-10-30 15:19 教師核可三份樣張方向，做全面版（含 #42b）
1. **只放大、不縮小**：overlay 每條規則的結果不得小於教材原本的計算字級（例：用 max(原值, 規範值×scale) 的寫法或依類別只對小於下限者覆寫）；檢查器新增「overlay 後任何文字 font-size 不得小於原版同元素」比對，違反即 FAIL。呼吸道樣張「第一關｜先備知識」等標題縮小的情況須修正。
2. **字級提高**：依修訂後 docs/READABILITY_STANDARD.md——內文／解析／回饋／選項 ≥18px、題幹 ≥19px、標題 ≥21px（皆乘 --font-scale）；特大不溢出。
3. **#42b 併入本輪**：後端 saveCourse／bootstrap 支援 readabilityOverlay 開關與排除清單的保存與回傳（最小改動、教師限定、有測試），讓教師在正式環境可隨時關閉或排除某份教材。報告列出要部署的 functions。
4. 全面套用：移除 readabilitySampleVersions 三份限制，套到全部載入 course-learning.js 的教材；期中範圍 17 份四組合必須 PASS（閱讀門檻 17 份全過，npm run check 全綠），其餘舊教材出報告（不擋）；每份附 390 寬預設＋特大截圖。
5. 不改教材 HTML、題目、答案、reviewed 卡與判定；不 push、不部署、不寫正式資料。完成後 #42 停-等Claude。

## 2026-10-30 15:56 起點更新
main 已為 7bc637a1（1.15.0＋測試路徑修正）。全面版請先把 feature/readability 重新對齊最新 origin/main，版號取 1.15.x 之後的下一版並在報告說明；遵守 AGENTS.md 第 11 條（Linux 可執行）。
