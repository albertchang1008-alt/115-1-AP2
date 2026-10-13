# 1.9.0 AP2 部署與 MI 準備交接（2026-10-13）

## 現況：A 段中止，B 段未開始

教師已授權 1.9.0 部署，並裁定 AP2 不加入微生物 22 題（Excel 不動）。
依 CODEX_TASK_DEPLOY_1.9.0_2026-10-13.md 執行；任何一步失敗即停止。

已完成：
- Claude 對3a49056複驗通過的記錄，提交為40d3ec4（docs: Claude 1.9.0 複驗記錄 [Codex]）；部署前 unify 工作目錄乾淨。
- git fetch --multiple origin mi 成功；origin/main=a593796，是3a49056祖先。
- GitHub AP2 Repository variables 未設 VITE_SITE_ID，workflow 使用預設ap2；Environment variables 也未設定。
- 在unify worktree執行既有deploy.sh，明確限定ap2-7ed91；npm ci、完整check通過：前端157、Functions54，0 fail／0 skipped、版本與51後端入口通過。
- feature/1.9.0-unify 備份分支普通push成功。
- AP2 Functions全流程成功（Deploy complete），origin/main正常快轉a593796→40d3ec4；未force push／no-verify。

停止點：
- 準備執行 firebase deploy --only firestore:rules,firestore:indexes --project ap2-7ed91 --non-interactive 時，自動核准審查拒絕，指令未執行。
- 審查理由：此為正式Firestore安全邊界的獨立變更，未認定已获明確授權，且實際權限與影響範圍尚未核實。
- 本機diff：rules保留全面deny，增加反思子路徑的明確deny；indexes新增assessmentSessions集合群組的state＋expiresAt索引。拒絕後沒有重試或繞過。
- 依教師「任何一步失敗就停下」停止；不自行回退已成功的Functions／main。

尚未完成：
1. AP2規則／索引部署（需解除自動審查阻擋）。
2. GitHub Actions成功、線上JS與同網站環境設定本機build雜湊比對。
3. 測試班確認三項新功能關閉、guide可開；沒有開啟正式課程功能。
4. B段全部：release/mi-1.9.0合併、衝突報告、MI完整check、migration dry-run、網站變數確認、本機commit及Claude複驗。

MI注意事項：
- 實際fetch與git ls-remote顯示mi/main=70354e02d56076fd9a024a89c812e5d188b6bdeb，與交辦記載d48aac8不同，尚未改動MI。
- d48aac8仍在本機Git物件中；unify已移植其影片續播／測驗種類重設修正。B段開始時須重新核對遠端基底並在報告列明差異。
- 本輪沒有push mi、migration apply或MI Functions部署；沒有修改Excel、學生資料／成績。
- root保留原feature/respiratory-infographics與既有未提交教材工作；unify分支仍為feature/1.9.0-unify。此交接文件為部署後本機紀錄，不再次推main。
