# 1.9.0 AP2 發布與 MI 準備（2026-10-13）

## AP2：已發布並完成驗證（反思無既有線上案例）
- CI修正commit：7a6720e [Codex]，只改tests/。70354e0兩個原檔完整保存為.txt，README記來源與SHA-256，測試讀fixture且核對雜湊，無skip／條件略過。
- 乾淨shallow clone（不含70354e0）套用僅tests修正、npm ci後AP2完整check全過：前端158／Functions54、0 failed／0 skipped；unify AP2與MI check同結果。
- deploy.sh完整check同結果；普通push AP2備份分支／main至7a6720e。Functions CLI未變更者显示No changes detected，不是略過測試。
- Actions38424586178 build與deploy均success，Pages已發布1.9.0：
  https://github.com/albertchang1008-alt/115-1-AP2/actions/runs/38424586178
- 公開JS index-BI4EsoCH.js與使用GitHub相同公開環境設定的本機build SHA-256完全一致：
  ce1cdcc44513adef8ab8ec4b71cc46f80f0447c2d68840d12edb658027f35c7c
- 索引assessmentSessions(state ASC＋expiresAt ASC)、COLLECTION_GROUP，狀態READY（2026-10-13T15:43:36Z查核）。
- expireAssessments日誌15:36–15:43 UTC连续HTTP200，最新區間無缺索引錯誤；索引建置期間舊錯誤至15:35，未手動觸發排程。
- 僅取課程features設定的field mask唯讀確認115-1-AP2三旗標都關閉（缺欄位沿用預設false）；沒有開啟正式課程功能。
- Chrome實際test班登入1.9.0、首頁無前後測／互動入口；首次提示可略過、guide可開。十題既有完整測驗20分，顯示「已保存，完成度已更新」；僅test帳號資料寫入。
- 既有選看影片從20秒播放至38.64秒，暫停後重整iframe start=38，續播保存有效；僅test帳號。
- AP2已發布活動youtube14／html20／link1，reflection0；無既有線上反思可驗。本機反思React＋實際callable假資料回歸全過。不新增／修改正式課程活動，也不把本機測試冒充線上反思驗證。
- 證據docs/unify-1.9.0/ap2-live-verification.json與check-ci-clean-clone.txt、check-ap2-ci-fix.txt、check-mi-ci-fix.txt。

## MI：B段中止，未完成commit
- 從最新mi/main@70354e02d56076fd9a024a89c812e5d188b6bdeb建立release/mi-1.9.0，工作目錄.worktrees/release-mi-1.9.0。
- mi/main是比交辦d48aac8更新的commit，Git祖先檢查確認已包含d48aac8；影片續播與種類切換修正亦在unify版本中。
- git merge --no-commit --no-ff feature/1.9.0-unify（7a6720e）產生24個預期衝突。逐檔比較後將unify內容寫入工作檔；新CI fixtures已隨合併帶入。
- **停止點**：將24檔git add時使用了default sandbox，.git/worktrees/release-mi-1.9.0/index.lock不可寫，exit128。這是本機Git metadata權限問題，非自動審查拒絕／非追加教師授權需求；依任何一步失敗停下，沒有重試。
- index仍有24個unmerged entries，MERGE_HEAD保留，尚未完成MI專屬設定、完整check、dry-run或commit。
- .firebaserc在mi/main原本就仍為ap2-7ed91；workflow合併後也仍fallback ap2。**不可從此未完成目錄部署。**後續需改MI專屬專案mi-bd885、workflow fallback mi，並只核對MI GitHub variable（未設列待辦、不修改變數）。
- 自動合併仍保留MI刪除AP2公開教材／舊MI測試的差異；須在完成衝突後核對共用來源快照與網站建置分離，以免共用回歸所需檔案缺失。
- 合併過程未改Excel（相對mi/main沒有xlsx差異），未push mi、migration apply或MI Functions部署。

### 24個衝突處理紀錄（工作檔已寫入；尚未git add）
| 檔案 | 處理／理由 |
|---|---|
| `functions/scripts/check-entry.cjs` | 共用51入口清單，包含互動設定API。（已寫入unify內容，index仍unmerged） |
| `functions/src/assessments.ts` | 共用features權限與每課來源、保留試卷私有性及旧路徑。（已寫入unify內容，index仍unmerged） |
| `functions/src/classroom.ts` | 共用features與課程設定，保留輪次、倒數與加時。（已寫入unify內容，index仍unmerged） |
| `functions/src/index.ts` | 保留反思／來源同步／features及共用exports。（已寫入unify內容，index仍unmerged） |
| `functions/src/teaching.ts` | 按課程features讀取私有簡報、資料驅動文字轉換。（已寫入unify內容，index仍unmerged） |
| `functions/tests/assessments.test.cjs` | 每課來源與私有試卷回歸。（已寫入unify內容，index仍unmerged） |
| `functions/tests/classroom.test.cjs` | 資料驅動互動、倒數交易回歸。（已寫入unify內容，index仍unmerged） |
| `functions/tests/teaching.test.cjs` | features与缺簡報回歸。（已寫入unify內容，index仍unmerged） |
| `handoff.md` | 需重寫為MI release現況；目前只存停止交接。（已寫入unify內容，index仍unmerged） |
| `scripts/classroom-preview-client.tsx` | 以測試記憶體資料供通用互動預覽。（已寫入unify內容，index仍unmerged） |
| `shared/assessment.ts` | 移除MI固定題目ID，共用正式測驗模型。（已寫入unify內容，index仍unmerged） |
| `shared/classroom.ts` | 移除MI固定課程／題目，共用模型與驗證。（已寫入unify內容，index仍unmerged） |
| `shared/materials.ts` | 完整共用來源目錄與VITE_SITE_ID分站。（已寫入unify內容，index仍unmerged） |
| `src/App.tsx` | 反思、features介面、來源提醒與教師設定。（已寫入unify內容，index仍unmerged） |
| `src/Assessments.tsx` | 動態題數與課程CSV名稱；保留d48aac8種類切換重設。（已寫入unify內容，index仍unmerged） |
| `src/ClassroomInteraction.tsx` | 通用設定編輯與資料驅動；MI題目仍在migration資料。（已寫入unify內容，index仍unmerged） |
| `src/Student.tsx` | 首次提示／說明入口／反思／features。（已寫入unify內容，index仍unmerged） |
| `src/TeachingControl.tsx` | 按開關顯示分頁、無簡報相容、資料驅動互動。（已寫入unify內容，index仍unmerged） |
| `src/style.css` | 共用反思／首次提示與各功能樣式。（已寫入unify內容，index仍unmerged） |
| `tests/activity-editing.test.ts` | 雙站教材名稱測試。（已寫入unify內容，index仍unmerged） |
| `tests/classroom.test.ts` | 由MI測試資料驗證12題。（已寫入unify內容，index仍unmerged） |
| `tests/fixtures/interaction-status.tsx` | 本機合成API提供共用互動設定。（已寫入unify內容，index仍unmerged） |
| `tests/material-registration.test.ts` | 保留AP2來源快照測試，網站範圍由site測試另驗。（已寫入unify內容，index仍unmerged） |
| `tests/preview.test.ts` | 依網站設定驗證教材網址。（已寫入unify內容，index仍unmerged） |

## 下一步
1. 恢復B段時，以已授權的Git metadata權限完成暫存；核對24檔及非衝突差異、MI專屬設定與d48aac8。
2. VITE_SITE_ID=mi npm run check（全過、0 skipped）；離線migration dry-run保存證據；核對MI變數；更新報告與本機commit [Codex]。
3. 交Claude複驗。仍禁止push mi／apply／部署MI Functions。
4. 正式MI另行授權後順序migration→Functions→Pages。
root原教材未提交工作保留；本輪未修改正式學生資料／成績或Excel、不force push／no-verify／略過測試。
