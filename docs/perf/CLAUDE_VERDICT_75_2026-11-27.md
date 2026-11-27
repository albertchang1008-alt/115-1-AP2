# #75 驗收裁定（Claude，2026-11-27 01:5x）：PASS

## 給 Claude 的摘要
- 結論：PASS。可提交並交教師部署（1.17.3）。
- Ubuntu 非 root 證據已親自核對（.codex/visualizations/…/ubuntu-continue-2026-11-27）：
  - summary 13 步全為 PASS 或 KNOWN，外層 exit 0；
  - TAP 364 pass、fail 2；
  - 失敗只有酸鹼 N02-micro、N02-micro-hint、N02-micro-wrong 三畫面各 clip=2，以及其父測試，與 K1 完全相符；
  - Functions 162／162、build 1.17.3、readability 17／17、點名瀏覽器 46 畫面、小考瀏覽器 57 畫面都過。
- 先前兩次覆核的修正都已到位：minInstances 斷言改比序列化清單；班級卡回 test 旗標、排後並顯示「（測試班）」，未加回統計。
- 資料庫只新增 1 個複合索引：zuvioExams 的 classIds CONTAINS＋createdAt DESC。rules 未動。
- 教師部署注意：索引要先部署，並等它在 Firebase 主控台顯示「已啟用」後才跑 deploy.sh。索引未建好前，選班後的考卷列表會查詢失敗。
- 未驗：真實雲端冷啟動的改善，部署後才看得到，由教師看 Cloud Run 指標與課堂實點判斷。
