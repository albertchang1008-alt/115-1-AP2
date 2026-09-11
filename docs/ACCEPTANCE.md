# 驗收與狀態

## 自動驗證

### 1.1.0 本機驗證（2026-09-11）

- 版本一致性檢查通過，全平台標示 1.1.0。
- 單元測試 16 項全部通過（core、material、platform、preview），含班級單元勾選與完成度、v1.9 中文題庫雙解析與圖片題、名冊跨課程與單一課程重複班級檢查、互動教材重玩不覆蓋首次結果與事件格式上限。
- 前端 TypeScript 型別檢查通過；後端 TypeScript 編譯通過，入口載入 29 個函式（雲端目前為 1.0.4 的 21 個，8 個新函式尚未部署）。
- 修正 tests/material.test.ts 未跟上 HtmlMaterial 新增的 api／courseId／unitId／uid 必填 props；未修正前 `npm run build` 與 GitHub Actions 的 `npm run check` 都會失敗。
- 新功能已確認接線：ClassManager／NewCourse 於教師後台、Diagnostics 於課程頁、ThemePicker 於進入點、QuestionContent 於學生與預覽、LearningBridge 於 HtmlMaterial；後端 saveLearningEvents 以事件 ID 在交易內去重，getLearningDiagnostics 檢查班級歸屬。
- 本次未執行 vite 前端打包（驗證環境與 macOS node_modules 的原生套件平台不符），需在本機或 CI 補跑完整 `npm run check`。
- 本次未執行雲端部署，也未變更任何線上資料；線上仍為 1.0.4。
- 待辦建議：diagnostics 文件的 summary 欄位尚未加入索引排除設定，與 attempts.answers 的既有作法不一致，節點與題目數量成長時會增加索引成本。


### 1.0.4 部署驗證（2026-09-11）

- Node.js 22.23.2 完整 `npm run check` 通過：12 項測試、前後端建置與版本一致性。
- 修正最後新增教材測試缺少 description 的型別錯誤；1.0.3 的建置是在新增最後一項測試之前執行，本次已涵蓋完整測試檔的型別檢查。
- Firebase 專案 ap2-7ed91：21 個函式 ACTIVE，Node.js 22、第 2 代、asia-east1；Firestore 規則發布成功、5 個複合索引 READY，4 個大型欄位索引排除設定已套用。
- Secret Manager 已建立 SHEETS_SYNC_KEY 第 1 版並授權執行身分；部署映像清理政策為 7 天。
- 空白交卷的未登入／格式錯誤檢查在本機通過，未呼叫資料庫。
- 最後一次 CLI 部署回傳 Deploy complete；bootstrap、getReports、submitAttempt 三個線上端點皆對未登入空請求回傳 HTTP 401 / UNAUTHENTICATED，未建立學習資料。
- 第一位教師 hhchang@ctcn.edu.tw 已完成 Google 登入，確認 emailVerified，已設定並回讀 teacher=true（保留其他 claims）；使用者已確認重新登入成功進入教師後台。
- 後端部署不等於完整上線：學生 Google 登入、名冊、題庫、教材、報表正確性與實際讀寫量仍待端到端驗證。

### 1.0.3 GitHub Pages 教材驗證（2026-09-11）

- Node.js 24.19.0：前後端建置、版本一致性通過；新增教材元件驗證後共 12 項測試全部通過。
- 教材接受 HTTPS Pages 子路徑、自訂網域與版本參數，拒絕非 HTTPS、帳密與無效網址。
- 學生／預覽共用元件直接顯示教材網址，保留受限制 iframe；無效網址不建立 iframe，也不能確認已閱讀。
- 21 個後端入口在未提供 storageBucket 的設定下成功載入；已移除教材上傳、簽署、轉送函式及 Storage 部署目標。
- 本次未部署雲端，尚未提供實際 GitHub 教材；真實教材的載入、互動、相對路徑、事件與手機相容性仍待驗證。

執行 `npm run check`：YouTube 解析、名冊與題庫驗證、首次去重、模式分離、複習統計、完成度計算、版本一致性及前後端編譯。實際執行結果於交付時記錄。

### 1.0.2 本機驗證（2026-09-11）

- 使用 Node.js 24.19.0 執行 `npm run check`，10 項測試全部通過。
- 全平台版本一致性、前端 TypeScript／Vite 建置、後端 TypeScript 編譯全部通過。
- 後端編譯產物的 24 個函式入口全部成功載入；未呼叫雲端 API。
- 使用本機預設 Node.js 20.12.2 執行前置檢查，正確阻擋並提示切換版本。
- 正式部署仍指定 Node.js 22.12 以上的 22.x；本次未在 Node 22、Firebase Emulator 或正式 Firebase 執行整合驗證。

## 正式環境待驗證（需要新專案與資料）

- Google OAuth：校內已列名冊、未列名冊、校外帳號、停用帳號與教師。
- 跨班／跨課程讀取與匯入、教師只能預覽獲授權草稿。
- 一般測驗完整／抽題、閃卡首次答題即時回饋、錯題紀錄。
- 斷線補送、同 ID 重送、換帳號不能重送他人作答。
- 教師預覽實際操作後，正式 attempts、progress 與 reports 筆數不增加。
- 增量報表失敗重試／同時更新不重複計入、晚到資料補入。
- HTML 真實套件、YouTube 片段、失效影片與行動瀏覽器。
- 結算過程與匯出完整性；快照採集期間是批次，不宣稱全班同一毫秒原子快照。
- Firebase 用量面板量測題庫初次／重複載入、交卷、報表查詢與增量更新。

## 邊界

- 前端分數是練習資料，不提供防作弊或正式考試保證。
- HTML 套件不支援使用平台登入憑證；opaque sandbox 下儲存、模組／fetch 需依真實教材驗證。
- 題庫新版本不改歷史作答；不載入舊題庫系統資料。
- 初版題庫每單元 100 題、課程 50 單元、活動每單元 30 個；先用上限確保摘要文件不無限成長。
- 未設定 Firebase 時的操作示例不代表正式環境已部署。

## 本次整合待驗收：互動教材與選看影片（2026-09-12）

以下尚未執行，不代表已通過。

- [ ] 通關回饋、活動完成與教師診斷分別保存，診斷低分不撤銷星星、徽章或通關。
- [ ] 診斷包含未通關者，重玩不覆寫首次結果，離線補送及重送不重複計數。
- [ ] 教師只能查看授權課程／班級資料，預覽不寫入學生正式紀錄。
- [ ] 未勾選單元不顯示、不計分；互動活動 100% 不直接等於整門課 100%。
- [ ] YouTube 清楚標示選看，未看、部分觀看、跳至結尾或外站觀看不影響完成度與成績。
- [ ] YouTube 接續播放正常，嵌入失敗不阻擋學習，不將未觀看學生標為落後。
- [ ] 各色系下題目圖片、雙解析、遊戲回饋與診斷報表可讀。
