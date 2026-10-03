# 1.6.4 後台單元／次單元選單驗收交接

2026-10-03，Codex；分支 `feature/cardiac-output-visuals`，基底 `e331e21`。未 push、未部署，待 Claude 驗收。

原本題庫與題目分析把所有 Unit 放在標為「單元」的下拉。現在先選 Chapter，再選該 Chapter 的次單元；單元順序取自 orderedChapters(course)，與看板一致，顯示 chapter.title／unit.title。

- 共用元件 `src/ChapterUnitPicker.tsx`：單元切換必定重設第一個次單元；空單元停用次單元，無課程分類時顯示空狀態；相容未建立 chapters 的舊課程。
- 題庫管理：清空題目預覽與搜尋，讀取按鈕／版本徽章取目前次單元；讀取或同步中停用選單；課程同步改變分類／版本時亦清空，較晚回來的舊結果不回填。
- 題目分析：保留「全部」，此時次單元停用；換單元清空摘要、分頁游標、彙整時間及題目明細並重新讀取。換次單元仍篩選已載入的同班摘要；getReports 的參數及 Unit ID 篩選／模式／排序邏輯保留。
- 研究資料：次單元以 optgroup 按看板單元順序分組，保留原 Unit ID 值及讀取方式。
- 不改資料結構、後端功能、完成度或題庫；Functions 僅同步 package／lock 版本號。

版本依 scripts/version.mjs 同步：VERSION、兩端 package／lock、shared/version.ts、apps-script/version.gs、public/version.json、README／handoff／DEVELOPMENT_LOG；全部為 1.6.4。

## 驗證

- npm run check：117 前端測試、18 Functions 測試、兩端 build 通過；version:check＝1.6.4。
- 新增前端測試直接在 Chrome 掛載實際 Bank、Analysis、ResearchEvidence React 元件，以假資料隔離外部服務。
- 覆蓋：章節順序與資料原順序不同、次單元只列所屬單元、換單元及回到原單元重設第一個、預覽清空、所選版本正確、空單元、全部停用、報表清空及重新讀取、模式／篩選保留、較晚的舊回覆不覆蓋新資料、研究頁 optgroup；另驗舊課程推導不改寫來源。
- 重驗：`npm run check`；單獨測試：`npx tsx --test tests/chapter-unit-picker.test.ts`。

## Claude 複驗

1. 題庫頁切換單元／次單元，讀取不同版本後換單元，確認預覽立即清空且次單元重設。
2. 題目分析由全部切至特定單元，確認次單元只列所屬分類；再選全部，確認次單元停用。模式、匯出、分頁及更新至最新沿用原行為。
3. 研究資料頁確認分組與看板順序一致。

心臟II 圖像化的 Claude 複驗修正項另列 handoff 待辦，本次未修改教材。
