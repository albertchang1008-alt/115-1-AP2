# 完成度看板：必做活動明細、狀態篩選、預設遮名（1.15.4）

## 給 Claude 的摘要
- 執行者：Claude（Codex 算力用完，教師 11:37 指示接手）。基底 main e178f7cf（1.15.3），分支 feature/completion-activity-detail，版本 1.15.4。
- Codex 已完成：版本同步、chapterRequiredActivityProgress（共用完成判定）、completionBoardCourse（看板保留舊鍵相容）、Student.tsx YouTube 必做／選看與已完成。
- Claude 完成：
  - 看板 UI：狀態篩選，預設只勾進行中；明細逐項列出題目分類與必做活動，依篩選隱藏；預設遮名，「顯示姓名」不記憶。
  - 使用情況、作答時間統計兩個面板同步遮名。
- 計量：全部勾選時與 1.15.3 完全相同（單元測試 deepEqual）。篩選時各章比率為「符合人數／全班」，人數欄為「符合／全班」；全部完成與平均完成仍以完整名冊計算。CSV 一律不受篩選影響。
- 測試：
  - 新增 tests/completion-board-filter.test.ts（6 項），既有 completion-board.test.ts（5 項）全過。
  - completion-board-verify（瀏覽器 1280／390）全過，含預設勾選、DOM 無完整姓名（含 title、aria-label）、只剩進行中格子、明細隱藏已達標、390 無溢位。
- 未在雲端容器跑完整 npm run check（缺教材原始檔與 mac 原生套件）。tsc 已在本機通過；deploy.sh 會在教師 Mac 上跑完整 check，沒過就不會部署。
- 已知：
  - 「查看」開啟的學生完整紀錄仍顯示姓名，屬教師主動操作，不遮。
  - 活動「紀錄時間」取自 progress.updatedAt，不另造完成時間。
- 截圖：課程平台-驗收證據/2026-11-05/w59/shots/。
