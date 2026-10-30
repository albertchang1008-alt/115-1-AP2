# 閱讀加大設定保存（原 #42b，已併 #42 全面版）

教師2026-10-30 15:19授權併入#42。本檔不再是獨立待辦；最新結果見docs/READABILITY_REPORT.md及CODEX_QUEUE.md的#42列。

## 實作

- functions/src/index.ts：saveCourse以既有教師權限、交易與revision保護，保存完整正規化features；bootstrap教師／學生分支回傳同一組設定。
- shared/features.ts：readabilityOverlay缺省true；排除清單缺省空陣列，回傳時複製；根features優先，舊資料缺欄時讀既有草稿／發布設定作相容。
- shared/courseValidation.ts：只接受布林與有界、去重、安全materialVersion陣列。既有三種功能保持獨立。
- 不批次更動正式課程、不改published教材或班級選取。

## 驗證

functions/tests/readability-settings.test.cjs測輸入與正規化。
scripts/readability-settings-verify.mjs拒絕非demo專案或非127.0.0.1 Emulator；以真實callable handler與Firestore Emulator測教師保存、教師／學生bootstrap、非教師／跨課程拒絕、缺省開、非法值及revision衝突。

部署只列入saveCourse、bootstrap，先於前端；實際部署仍由教師核准後執行。本輪不push、不部署、不寫正式資料。
