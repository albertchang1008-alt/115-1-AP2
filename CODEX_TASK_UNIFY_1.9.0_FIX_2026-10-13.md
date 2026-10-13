# Codex 交辦：1.9.0 驗收修正（2026-10-13，Claude）

工作位置：`.worktrees/unify-1.9.0`／`feature/1.9.0-unify`（目前 78cb5dc）。先讀 `docs/unify-1.9.0/UNIFY_1.9.0_CLAUDE_ACCEPTANCE.md`。

## 必做

1. **M-1**：`scripts/migrate-mi-1.9.0.mjs` apply 區塊的 `const [state, rounds, exams, presentation]` 改為 `presentationSnap`，`.exists` 檢查同步改名；寫入 `classroomConfig/interactions` 時仍展開檔頭讀入的 `mi-slide-transforms.json`。
2. 新增測試：用假 Firestore（mock `runTransaction`、`tx.get`、`tx.set`）跑 `--apply --confirm-mi-only`，斷言寫入 `classroomConfig/interactions` 的內容等於 `{ interactions, ...mi-slide-transforms.json }`，且不含 snapshot 欄位。不得連線任何真實專案。

## 可一併做

3. **m-1**：課程編輯器開啟「正式前後測」時，若前測或後測來源任一為空，保存時顯示提醒（不阻擋保存）。
4. **m-2**：功能欄位標題改為「課程功能（預設關閉；保存草稿即對學生生效，不需發布）」。
5. **m-4**：說明截圖的提示標籤不要壓到內容文字（移到外側或加白底），重拍 18 張截圖並重跑 guide 驗證。

## 收工

- `VITE_SITE_ID=ap2` 與 `VITE_SITE_ID=mi` 各跑 `npm run check`，全過且 0 skipped。
- 更新 worktree 內報告與交接；commit 結尾 `[Codex]`。
- 不 push、不部署、不執行 migration、不改 Excel 既有列、不碰正式 Firebase。
- 完成後交 Claude 複驗。
