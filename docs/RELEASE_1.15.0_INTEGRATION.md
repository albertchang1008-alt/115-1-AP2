# release/1.15.0 整合報告（#39＋#41，2026-10-30）

## 給 Claude 的摘要
- 已由重新 fetch 的 `origin/main=45b9e266` 建立 `.worktrees/release-1.15.0`／`release/1.15.0`，根目錄分支未切換。
- 依序合併 #41 `02f2ba1f`、#39 `43e6156f`；兩份已核可分支均完整保留，不重作功能。
- 唯一衝突：`src/main.tsx` import 區；保留 UpdateBanner、兩份 CSS 與 `<UpdateBanner />`，其他產品檔無手改。
- 合併提交：`1a7e5cfd` → `18a40554`；版號及 release handoff 版本行均 1.15.0。
- 65 筆來源檔案比對：除 main.tsx 兩筆改作合併斷言，其餘 63 筆 bytes 完全相同；教材、reviewed 卡、rules／索引／Storage 變更 0。
- 獨立重跑：#41 瀏覽器 9 PASS、#39 UI 9 PASS、真實 Firestore Emulator 11 PASS；合併畫面 1920／390 PASS、0 pageerror。
- 乾淨 clone 完整 check：276 前端／共用＋99 Functions 全 PASS，0 fail／0 skipped、exit 0。
- 未 push、部署、匯入或寫正式資料；新證據保存在 repo 外至 2026-11-06。
- 偏離：無；依最新教師決定，兩功能統一 1.15.0，取代舊報告的單分支部署指令。
- 請抽查：main.tsx 合併、完整 check、作答鎖、單題交易／xlsx、三函式與單次前端部署順序。

## 1. 起點與合併

根目錄仍為 `feature/respiratory-infographics`，保留其所有未提交工作。正式工作在：
`/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/release-1.15.0`。

- main：`45b9e266a5651e3d9169bc1dc097fcffea901d76`（含 #40 1.14.0）。
- 第一個 merge `1a7e5cfd`：parents `45b9e266`、`02f2ba1f`，採 `--no-ff`。
- 第二個 merge `18a40554d14825ab1f9c8f5267653dbed29d3b09`：parents `1a7e5cfd`、`43e6156f`，採 `--no-ff`。
- 第二次 merge 只衝突 `src/main.tsx`；解法如下，`React.StrictMode` 裡保留 UpdateBanner 及 App：

```tsx
import UpdateBanner from './UpdateBanner';
import './update-banner.css';
import './question-manager-sample.css';
// 其餘原有 import 不變
// ...
<React.StrictMode>
  <UpdateBanner />
  <App />
</React.StrictMode>
```

`VERSION`、packages／locks、shared/version.ts、public/version.json、apps-script/version.gs 與文件版本行均沿用兩分支相同的 1.15.0。release 工作樹 handoff 的版本行為 1.15.0；根目錄仍為舊版工作區，不作部署來源。
來源分支不重寫、不 rebase、不改動。`origin/main` 為 release 的祖先，整合可快轉。

## 2. 保留驗證

以兩分支各自相對 main 的改動檔清單做 bytes／SHA-256 比較，共 65 筆，包含共用版本檔的重複比對：

- 63 筆非入口檔與來源分支完全相同。
- `src/main.tsx` 的兩筆則驗證兩邊新增的 import／元件各存在一次、原 App 保留、沒有衝突標記。
- 相對 main 共 51 個檔案改動（兩功能原有內容）。報告另以文件提交補入。
- materials-src、public/materials、firestore.rules、firestore.indexes.json、storage.rules 的 diff 為空。
- #39 的教師限定 transaction／expected 快照、學生拒讀、輪數警告、xlsx 往返原樣保留。
- #41 的前景／online／定時檢查、手動重載與所有作答／儲存鎖原樣保留，沒有自動重載。

## 3. 獨立驗證

所有執行都在本機乾淨 clone `/private/tmp/release-1150-clean`，從本機 release 分支以 `--no-hardlinks --single-branch` 複製，HEAD 為 `18a40554`。未借用原 worktree 的 node_modules、.env 或私有檔案。
兩端依賴各自 `npm ci --no-audit --no-fund`；Node 22.23.2。完整 check 結束後 clone git status 為空，version:check、TypeScript 與 Vite build 皆通過。

| 檢查 | 結果 |
|---|---|
| 乾淨 clone `npm run check` | 276／276 前端／共用＋99／99 Functions；0 fail／0 skipped；exit 0 |
| `node scripts/update-banner-verify.mjs --out <證據目錄>` | 9 PASS；0 pageerror、autoReload=false |
| `QM_OUT=<證據目錄> node scripts/question-manager-verify.mjs` | 9 PASS；0 pageerror；既有 Google 字型請求被攔截，未外連 |
| 真實 Firestore Emulator（下方指令） | 11 PASS、0 FAIL、exit 0，已正常停止 |
| UpdateBanner＋TeachingControl 同時顯示 | 1920／390 均 PASS，不遮控制台分頁、無水平溢出、0 pageerror |
| 來源保存／版本／diff 檢查 | PASS；63 筆原樣＋入口合併斷言；1.15.0；無衝突標記 |

```sh
firebase emulators:exec --project demo-question-manager --only firestore "node functions/scripts/verify-question-manager-emulator.cjs"
```

Emulator 僅連 `127.0.0.1` 與 demo 專案；確認教師保存、學生及未登入拒絕、同題並發一個成功／一個 aborted、不合法答案原子回滾、輪數、舊 reveal 不變、匿名與學生 JWT 的 Firestore REST 讀 answerKeys 403、xlsx 題目列經真正 #38 callable dryRun／保存完全一致、未寫入成績／progress／researchEvents。
#39 UI 實際下載 xlsx 後重新走正式 #38 匯入視窗，保留標題、答案與 legacy。
#41 瀏覽器涵蓋前景／online／30 分鐘、所有作答模式、提交解鎖、失敗靜默、390 與手動載入新版 bundle。

合併畫面抽查使用同一份 release 的真實 UpdateBanner＋TeachingControl 元件與入口 CSS 順序，課程 API 用本機假資料。抽查腳本存於 repo 外證據 `combined-smoke.mjs`；不宣稱是實體手機測試。

## 4. 證據與保存

截圖／原始輸出保存至 **2026-11-06**：
`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/release-1.15.0/`。

- `clean-check.log`、`clean-ci.log`、`clean-clone.log`：乾淨 clone 完整輸出。
- `source-audit.json`：來源檔案比對、base／整合 HEAD、SHA-256。
- `banner/verification.json`、`banner/*.png`：#41 的 1920／390 一般及作答畫面。
- `question-ui/ui-results.json`、`question-ui/*.png`：#39 總覽、編輯、差異（含輪數）、下載、衝突、390、完整匯入往返。
- `emulator-results.json`、`emulator.log`：11 項後端實測。
- `combined/combined-1920.png`、`combined/combined-390.png`、`combined/results.json`：兩功能同時顯示。
- `manifest.json`：檔案 bytes／SHA-256、保存日期、驗證摘要。

開工 prune-evidence dry-run：0 個可刪資料夾，未刪除證據。所有截圖、xlsx、原始輸出與私有產物均未進 git。

## 5. 合併後部署清單（教師核可後執行，本次未執行）

此段取代兩份原功能報告的分開部署指令。先請 Claude 複核本整合，再由教師決定部署。
本次只新增／更新三支 Functions，不部署規則、索引、Storage 或其他函式；後端成功後，單次 push release 更新前端。

```sh
cd '/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/release-1.15.0'
export PATH='/Users/HHC/.nvm/versions/node/v22.23.2/bin:'"$PATH"
git branch --show-current
# 必須為 release/1.15.0，且工作樹乾淨。
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
# 若前一行不是 0，先停止；整合新版 main 並重新驗證。
npm run check
npm --prefix functions run build
firebase deploy --project ap2-7ed91 --only functions:platform:updateClassroomQuestions,functions:platform:getClassroomConfig,functions:platform:saveTeachingDeck
git push origin release/1.15.0:main
```

三支函式用途：

1. `functions:platform:updateClassroomQuestions`：教師限定單題更新／刪除、transaction 與衝突檢查。
2. `functions:platform:getClassroomConfig`：教師題目管理的答案快照及輪數。
3. `functions:platform:saveTeachingDeck`：#39 匯出的完整版題目列交給 #38 正確保存。

前端由 GitHub Actions 發布；確認 build／deploy 成功後，教師用測試班確認：舊畫面回前景顯示新版提示→作答時不可重載→交卷後手動載入；題目管理縮圖／單題修改／衝突／下載再匯入正常。任何匯入、修改正式題目、課程發布都不包含在本次工作。

## 6. 交付

完成後根目錄 #39、#41 均改「停-等Claude／Claude」，指向本報告；週誌與 check_handoff 只維護根目錄。Claude 複核通過後再交教師，不由 Codex 自行上線。
