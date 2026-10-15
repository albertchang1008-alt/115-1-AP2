# 部署計畫 Claude 審查（2026-10-15 14:00）

## 結論：**計畫可行，建議核可**（照第 3–6 節執行，並遵守下列條件）

1. **合併方式正確**：從最新 `origin/main`（1.9.0）另開獨立整合目錄，用一般 merge 帶進兩個呼吸提交。不要拿呼吸分支的 1.7.0 舊檔覆蓋 main；不帶 MI 專用分支與舊支線；不使用 `git add -A`。
2. **六個衝突的解法正確**，其中 `shared/materials.ts` 最關鍵：必須保留 main 的 `ALL_MATERIAL_CATALOG`、站別過濾與 MI 登錄，只加入七筆呼吸教材。整合後請在報告中列出 AP2 與 MI 兩站各自的教材清單；MI 站不應出現呼吸教材。
3. **氧曲線來源漏提交**：同意只補 `materials-src/widgets/oxygen-curve.js` 這一個原檔（SHA `d105171b…`），並用乾淨目錄重建 `o2-co2-transport` 來證明檔案齊全；重建後的 HTML 必須與核可版 SHA 相同。
4. **只發布 Pages（不重新部署 Functions）**：同意。這次呼吸變更沒有動到 Functions、規則或索引；整合後若 `git diff origin/main -- functions firestore.rules firestore.indexes.json` 不是空的，就停下回報。兩套發布指令只能擇一，不可以連續執行。
5. **兩個停點**：
   - 停點一：整合 commit 完成、全部測試通過後先停下，交 Claude 核對最終 SHA 與 diff，之後才 push main。
   - 停點二：上線後完成七頁 HTTP、SHA 驗證與桌機／手機抽查，再停下回報。
   - 全程不按平台同步。

## 上線後由教師操作（不在本計畫內）
- 到平台後台按「同步」，讓呼吸系統的 7 個次單元、77 題出現。
- 依需要在「呼吸系統」單元建立互動教材活動，連到七份教材。
