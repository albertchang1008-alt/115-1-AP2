# 1.8.0 開放式反思活動：Claude 獨立驗收

2026-10-13，Claude。對象：`feature/1.8.0-reflection` @ `ec8947f`（含 `54a1d3c` 題庫分離）。

## 結論：**有條件通過**（修 2 項必修後即可整合，不需重驗全部）

## 實際做了什麼

- 以 `git archive ec8947f` 取得乾淨原始碼，在 Linux 雲端重新 `npm ci`（兩端）後跑 `npm run check`：
  **前端 144／144、Functions 34／34，0 fail／0 skipped；版本檢查、前端 build、Functions build 成功。**
  - 註：沙箱無外網，`src/style.css` 第 1 行 Google Fonts `@import` 會讓 Playwright `addStyleTag` 失敗（6 項 React 畫面測試）；只在測試副本移除該行即全過，與功能無關（同 1.7.x 驗收時情況）。
- 逐行讀 `shared/reflection.ts`、`functions/src/index.ts` 三個 callable、`firestore.rules`、`src/ReflectionPage.tsx`，並檢視 18 張截圖中的學生填寫（390）與教師結果（1280）。

## 符合規格（抽要）

- 權限：未登入／非名冊／教師預覽寫入一律拒絕；教師讀全班限 `access(…, true)`；rules 對 reflections 全拒。
- 交易：transaction 內重讀課程、名冊、舊答案、進度；答案與進度同筆寫入；`saveActivity` 禁止直接把反思標完成。
- 可見性：經 `forClass` 檢查 hidden／班級／開放；截止只擋寫入（讀取仍可）；`dueAt` 空白時 `NaN` 比較為 false，不會誤判截止。
- 快照：`promptsSnapshot` 每次送出保存；改題後教師結果仍顯示原題與舊選項票數。
- salt：`reflectionSalt` 存課程根文件，`bootstrap` 只回 `draft`，不外洩；其他寫入根文件都是 `tx.update`，不會清掉 salt，研究代碼可跨期穩定。
- CSV：UTF-8 BOM、雙引號跳脫、`=+@-` 開頭加 `'` 防公式注入。
- 完成度公式維持版本 3。

## 必修（Codex 修完、補測試後即可整合）

1. **文字題不能換行（實測重現）**：`validateReflectionAnswers` 的控制字元規則包含 `\n`。學生在多行輸入框按 Enter（手機尤其常見）會在送出時被拒絕「答案不能包含控制字元」，畫面上只有一句「不使用換行」的小字提醒。
   - 改法：答案先把 `\r\n`、`\r` 正規化為 `\n`；**允許 `\n`**，其餘控制字元（含 Tab）仍拒絕；連續 3 個以上空行壓成 2 個。字數以正規化後計。
   - 前端：拿掉「不使用換行或 Tab」說明；已送出答案與教師結果表格加 `white-space: pre-wrap`；CSV 保留換行（已在雙引號內，Excel 可正常顯示）。
   - 題目文字與選項維持不可含控制字元。
   - 測試：含換行可送出、`\r\n` 正規化、Tab 仍拒絕、字數上限以正規化後計算。
2. **未作答名單用 email 比對**：`summarizeReflections` 以 `x.email === r.email` 判斷是否作答。名冊換信箱修正（3f6d925）上線後，學生換信箱會被誤列「尚未作答」。
   - 改法：優先以 `studentId`（非空時）比對，否則才用 email；另以 `uid` 比對（名冊有 uid 時）。
   - 測試：學生作答後名冊信箱變更，不應出現在未作答名單。

## 建議（不擋整合）

- 結果頁的「送出時間」以 `toLocaleString('zh-TW')` 顯示「上午9:45:19」，可改 24 小時制與 CSV 一致。
- 教師結果表格中每格又重複印一次題目文字（截圖可見），窄欄時佔空間；可只在手機卡片模式顯示。

## 下一步

Codex 依上述 2 項必修改 `feature/1.8.0-reflection`，`npm run check` 全過後本機 commit，交 Claude 只複驗這兩項 → 教師決定部署。
MI 功能移植（1.9.0）以修正後的 1.8.0 為基底，見 `docs/AP2_MI_FEATURES_1.9.0_SPEC.md`。
