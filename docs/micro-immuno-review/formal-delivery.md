## 教師核可後正式交件（2026-10-11）

教師已核可兩份教材畫面，並授權正式 build、教材登錄、Excel 追加、完整 check 及本機 commit。本次平台版本仍為 1.7.0；分支為 `feature/micro-immuno-review`，基底 `e8805f8`。未 push、合併或部署，其他工作目錄未修改。

- `materials:build micro-bacteria-review`、`materials:build immuno-concepts-review` 與 `materials:sync` 成功。`shared/materials.ts` 與教材 README 各新增兩筆；細菌 6 節點／11 題、免疫 8 節點／11 題。截圖只存本機：docs/micro-immuno-review-screenshots/ 已排除版控；截圖集頁面須搭配本機檔案使用，repository／正式網站不提供截圖。教材內嵌教學圖照常保留。正式 HTML 的 SHA 與教師核可 preview 完全相同，既有 252 狀態／4 SDK 流程／46 標準 screenshots／140 張截圖集驗證適用同一份輸出。
- Excel「題庫」新增 **229–239 列：細菌；240–250 列：免疫**，各 6 先備＋5 情境，共 22 題，合計 249 題。題庫既有 1–228 列、說明既有 1–34 列原始 XML 逐列相同，原有值、公式、樣式、欄寬、凍結窗格與驗證設定保留；其他 ZIP parts 逐位元相同。
- 「說明」只追加 A35:B37：兩份來源與新的 249 題合計，原有 B23 的歷史合計 227 題保留。未指定單元代碼，沿用既有「單元＝次單元＝教材原標題」慣例；課程代碼留空供教師匯入時指定。Excel 選項僅循環換位，原文與正解不變；答案代碼與 Zuvio 序號同步映射，定稿 content.json 不改。解析及①～④欄使用核可 hint／node summary／explain，未新增醫學敘述或頁碼。
- 儲存後重新匯入 Artifact Tool，兩張工作表原有值逐格相同、新增 22 列逐格一致、無公式錯誤，新增題目及引導欄與來源合計已渲染檢視。[逐列保存與22題對照證據](question-bank-verification.json)。
- **`npm run check` exit 0：前端 134／134、Functions 26／26，全數通過、0 fail、0 skipped；版本檢查與前後端 build 成功（後端 34 個入口可載入，未連雲端）。** [完整 check 紀錄](full-check.txt)。
- 教師核可的唯一 kit 改動仍只有 hues 22／216；credits 僅核可形狀與 AI 署名。`protected-files.json` 是正式建置前的 preview 保護證據，Excel／catalog／README 已依本次授權更新，以本節及 question-bank-verification.json 為最新狀態。

### 星期一（2026-10-12）整合與上線建議——待教師決定，尚未執行

建議使用新分支 **`codex/release-1.7.1-micro-immuno`** 與獨立 worktree `.worktrees/release-1.7.1-micro-immuno`，從完成度看板 `ed08854` 開始，合併本次 `feature/micro-immuno-review` 及最新 `origin/main`。目前本機 `main`／`origin/main` 已為 `3f6d925`（名冊換信箱修正），不是舊交接的 dc8c045；看板尚未包含此修正，直接執行 deploy.sh 會被 ancestor 預檢擋下。

教師同意後，依序執行（此處僅列步驟）：

```sh
cd /Users/HHC/Documents/ChatGPT/課程平台1.0
git fetch origin refs/heads/main:refs/remotes/origin/main
git worktree add -b codex/release-1.7.1-micro-immuno .worktrees/release-1.7.1-micro-immuno ed08854
cd .worktrees/release-1.7.1-micro-immuno
git merge --no-ff feature/micro-immuno-review -m "merge: 整合微免教材與看板 [Codex]"
# 若交接／開發紀錄衝突，保留雙方功能與歷史並重寫現況；版本維持 1.7.1。
git merge --no-ff origin/main -m "merge: 納入最新正式分支修正 [Codex]"
# 若 src/App.tsx 衝突，保留完成度看板與名冊同步錯誤詳情兩項功能。
npm ci
npm --prefix functions ci
npm run materials:sync
npm run check
```

整合後核對兩份教材登錄、Excel 249 題、完成度看板與名冊同步修正；解決衝突與文件更新後 commit（結尾 [Codex]），確認乾淨工作目錄、VERSION／所有版本檔為 1.7.1，且 `git merge-base --is-ancestor main HEAD` 與 `git merge-base --is-ancestor origin/main HEAD` 均成功。保留兩個原 worktree；不納入尚待核可的呼吸／血流教材。

教師確認整合驗收與部署後，**從新 release worktree** 執行 `bash scripts/deploy.sh`。腳本會確認 Firebase 權限、再跑安裝與完整 check、備份分支、部署 Functions，再快轉 push origin/main 觸發 GitHub Pages；須看 GitHub Actions 成功、線上版本與教材可用，才算上線。不要從主目錄呼吸分支或未整合的看板 worktree 部署。教材部署成功後才由教師把新增 Excel 列追加至課程 Google Sheet，核對課程／單元代碼，再同步題庫與發布課程；本次沒有外部題庫上傳授權。
