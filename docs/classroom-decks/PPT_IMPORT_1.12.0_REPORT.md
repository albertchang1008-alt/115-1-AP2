# 1.12.0 F1b／F4 接手完成報告

## 給 Claude 的摘要
- Codex 接續 worktree 既有未提交修正，完成 F1b／F4；實作提交 `35c71a28`，驗收相容更新 `4fa8ab3e`，版本維持 1.12.0。
- F1b：圖片每塊最多 400,000 字元，逐塊還原；保留舊版未分塊圖片讀取相容性。
- F4：iframe img-src 加入 GCS／Firebase Storage，保留 default-src none、sandbox 與其他網域阻擋。
- 變更：functions/src/teaching.ts、src/TeachingControl.tsx、Functions 測試／Emulator 腳本、瀏覽器驗證腳本與 fixture／CSP 測試與舊版 28 頁驗收腳本（8 檔）。
- 最終乾淨 clone：248＋84 全過，0 failed、0 skipped；version:check PASS；所有探針 PASS。
- 真實 Firestore：有效 900,624 bytes PDF＋3 張各 1,623,034 bytes WebP 分塊後完整回讀；14 個探針案例 PASS。
- 真實 sandbox iframe：Storage 圖 naturalWidth=1920、naturalHeight=1080；GCS／Firebase 可載入，evil.example.com 被擋。
- F2／F3 回歸 PASS；沒有改答案、啟用或正式資料；無 push／部署。
- 本輪為實作後自檢，請 Claude 獨立驗收；未宣稱第二方審查已通過。
- 抽查：圖片分塊與舊資料、逐圖回讀、sandbox iframe CSP、F2／F3 探針、乾淨 clone 輸出。

## 完整版功能範圍

1. 控制台多份簡報選單，原有 28 頁合併版相容，可拆分為呼吸與泌尿＋體液各 14 頁。
2. 瀏覽器 PDF 轉圖＋xlsx 題目表＋選填 pptx 備忘稿；單選、排序、是非（○ 對／✕ 錯，底層 choice）。先預覽及錯誤阻擋，確認後合併舊題；重匯列差異、公佈輪次維持快照。
3. M／S／L／Z 工具、同鍵及 Esc、觸控列、互動快捷鍵讓位；M／Z 由 PDF 向量重繪。4:3 完整等比置中與放大座標保持。
4. 原始 PDF 與圖片走授權教師 Storage 路徑，getTeachingDeck 短期簽章；Storage 不可用時大檔分塊備援。版本 1.12.0，後端部署範圍見文末。

## 修正內容

接手時 `813e1611` worktree 已有 7 檔未提交修改；保留並完成這些修改，再補舊格式回讀測試與真正 sandbox iframe 的檢查。測試原先用 contentDocument 存取 sandbox iframe，會因 opaque origin 取得 null；改由 Playwright frameLocator 進入檢查，**沒有放寬 sandbox**。

圖片備援以 `imageBlobChunks` 記錄區塊數，每塊存到 `teachingDeckBlobs/{deckId}__slide__{page}__{chunk}`；讀取時依序組合。舊版 `hasImageBlob` 且沒有區塊數的資料仍走原本單文件讀取。PDF 原有分塊、Storage 成功時主文件只存引用的行為保持。

控制台 CSP 只新增兩個圖片來源 `https://storage.googleapis.com`、`https://firebasestorage.googleapis.com`，保留 GitHub Pages 與 data:，其他內容政策不變。新增實際 iframe 成功載入與不允許網域被擋的瀏覽器檢查，測試網路全部攔截為合成素材。

## 實際驗證

| 檢查 | 結果 |
|---|---|
| Functions 定向測試 | 6/6、0 skipped，含分塊與舊版圖片回讀 |
| 完整工作目錄 check | 初次 247/248，舊驗收腳本預期失敗；修正後以乾淨 clone 全套重跑通過 |
| 乾淨 clone | npm ci、functions ci、check exit 0；248＋84、0 failed、0 skipped，version:check 1.12.0 PASS |
| 真實 Firestore＋記錄型 Storage | 900,624 bytes PDF＋3 張有效 1920×1080 WebP；主文件 2,149 bytes，無 Base64；3 張簽章圖片引用 |
| 真實 Firestore、Storage 故障備援 | 每張 WebP 1,623,034 bytes／data URL 2,164,071 bytes；每圖 6 塊、PDF 4 塊，主文件 2,297 bytes；PDF 及所有圖片字串與輸入完全相同 |
| F2 | 10 個非法 pdf/image 路徑皆 permission-denied；既存跨課程路徑未發出任何簽章呼叫 |
| F3 | 4:3 紅藍帶各 113,602 像素；M 重繪後各 115,200；Z 目標中心為紅色 [255,0,0,255] |
| 瀏覽器 | 實際授課 iframe Storage 圖 1920×1080；GCS/Firebase 來源載入成功；非允許網域 naturalWidth=0 |
| 原有 Emulator 匯入回歸 | largePdfSaved、crossCoursePathRejected、revealedSnapshotPreserved true，exit 0 |

14 個獨立探針案例見 recheck.json 的 pass=true；兩種 Storage 成功／故障由記錄器模擬，但使用真實 callable handler、權限檢查與 Firestore Emulator。沒有真實雲端 Storage 上傳、正式帳號資料操作或外接投影機測試。
Functions 單元／原有 Emulator 回歸的超大圖片是大小壓力資料；有效 WebP 另由 Chrome Canvas 0.88 品質生成，獨立探針確認位元完整回讀，CSP 探針確認可以解碼。

乾淨 clone 先安裝 `35c71a28` 依賴，再快轉到只改驗收預期的 `4fa8ab3e`，驗收相容更新 `4fa8ab3e`，unset REVIEW_DECKS_DIR，執行 npm ci、npm --prefix functions ci、npm run check；不讀取教師私有路徑。後續報告提交只改文件。
完整檢查初次揭露舊 28 頁腳本硬編碼舊 CSP（247/248）；更新精確預期後，獨立重跑該腳本通過，再重跑完整 check。初次失敗 log 也保留，未略過任何測試。

主要重現指令（於 worktree 執行，Node 22.23.2、Java 26）：

```sh
npm --prefix functions run build
node --test functions/tests/ppt-import.test.cjs
node scripts/ppt-import-1.12.0-verify.mjs --out /tmp/codex-ppt-finish/ui
node scripts/teaching-deck-pages-verify.mjs
firebase emulators:exec --only firestore --project demo-codex-pptfinish 'node /tmp/codex-ppt-finish/recheck.cjs'
firebase emulators:exec --only firestore --project demo-codex-pptfinish-regression 'node functions/scripts/verify-ppt-import-emulator.cjs'
```

若 /tmp 已清除，可從證據資料夾複製回同名位置。獨立探針已加失敗時非 0 退出，逐圖比較輸入與回讀是否完全相同。

## 證據與截圖

`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-29/ppt-import-1.12.0/codex-finish-35c71a28/`

**截圖保存至 2026-11-05**。原輸出 `/tmp/codex-ppt-finish/`，證據附 SHA256 manifest。
- check.log／clean-check.log／npm-ci.log／functions-ci.log：完整執行輸出。
- recheck.cjs／recheck.json／recheck.log：有效高畫質圖＋PDF、Storage 成功／故障及 F2 探針。
- pdf-browser-probe.mjs／pdf-browser.json／four-three-crop.png：4:3、M／Z 座標。
- csp-probe.mjs／csp.json／05-storage-csp-1920.png：修正前反例的修正後對照。
- ui.log 與 ui/01～04 截圖：多份簡報、預覽、播放／向量放大與是非互動。已人工查看播放畫面，原先 undefined 消失、主投影片與放大鏡均有圖。
- emulator.log：完整匯入、重匯、合併舊題與公佈快照回歸。

既有失敗證據仍在 codex-recheck-813e1611，沒有刪除；前後對照可看各目錄 05-storage-csp-1920.png 與 ui/03-pointer-tools-and-true-false-1920.png。

## 部署清單（僅供 Claude／教師後續裁定，尚未執行）

需部署 Storage 規則與 platform codebase 的 saveTeachingDeck／getTeachingDeck。依 firebase.json 的 codebase 及本機 Firebase CLI selector 實作修正原報告未指定 codebase 的指令：

```sh
firebase deploy --project ap2-7ed91 --only storage
firebase deploy --project ap2-7ed91 --only functions:platform:saveTeachingDeck,functions:platform:getTeachingDeck
```

前端也需隨核可版本發布才能套用 CSP。本輪不部署、不 push、不匯入正式資料。#38 停-等Claude；請獨立抽查後裁定是否交教師。
