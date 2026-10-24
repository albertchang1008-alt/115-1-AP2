# 給 Claude 的摘要

- #3已以origin/main 5c4704ce（1.10.2）為底整合原54bfc4d9／650edec8的程式與測試；分支fix/snapshot-main。
- 程式：shared/model.ts、functions/src/index.ts；測試：snapshot-memory.cjs、snapshot-undefined.test.cjs、passed-at.test.cjs。
- PASS：原main案例7/7失敗→修正後7/7通過；本機Firestore emulator7/7、passedAt9/9；全測試無跳過。
- PASS：npm run check前端／共用234、Functions77，1.10.2版本及build全過。
- 偏離：採路徑限定的等價移植，沒有帶入原兩筆中的舊handoff／DEVELOPMENT_LOG／大型輸出；未push或部署。
- 部署僅3個持久化入口：createSnapshot、buildReviewExam、patchCourseDraft；CLI選擇器已離線解析核對。
- 抽查1：紅→綠與SDK序列化／emulator實際create-get-delete證據。
- 抽查2：false／0／空字串與班級覆寫保持、不回退舊Unit設定、未修改輸入。
- 抽查3：passedAt9案例檢查實際後端時間與儲存，不以clientAt替代。
- 抽查4：指定部署函式差異與下方教師命令；不呼叫根目錄舊版deploy.sh。
- 抽查5：main本機整合紀錄、origin/main及遠端未推送；其他工作樹不變。

## 整合範圍

工作目錄：/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/snapshot-main。
以origin/main 5c4704ce為底，限定移植兩筆提交的5個程式／測試檔，排除舊交接與原始證據。
程式修正commit：15dbee31；另commit passedAt測試及本報告。根目錄仍在原feature/respiratory-infographics，未提交工作保持。
本機main快轉至本分支整合提交；僅本機，不push。正式部署停在Claude驗收。
原#11完成度看板及1.10.2解析顯示沿用origin/main，不額外改寫。

## 根因、差異與部署清單

| 部署函式 | 差異／必要性 |
|---|---|
| createSnapshot | forClass省略未設定的threshold／opensAt／dueAt／research，推導舊Chapter也省略未設定research，使快照Course可通過Firestore嚴格序列化。 |
| buildReviewExam | 重建既有複習考時原本不存在chapterOrder就不寫該欄，避免draft.chapterOrder=undefined；新建及已有順序者維持原值。 |
| patchCourseDraft | 使用applyDraftOps→chaptersOf推導舊章節的同類寫入，需同時包含不產生undefined研究設定的模型修正。 |

forClass另被bootstrap、getBank、getProgress、進度及研究事件等讀取流程使用；有值設定保持，傳輸序列化原本即省略undefined，不將這些未改持久化行為的入口列為本輪部署目標。
沒有改passedAt正式邏輯；新增9項測試只驗證既有後端決策。沒有更新Hosting、Firestore規則、索引或其他函式。

## 實際驗證

- 還原origin/main兩個正式檔、保留新測試後build：快照7題0過7失敗，exit1；失敗為Firestore undefined欄位拒絕。
- 恢復修正後重新build：7題7過0失敗、0 skipped。
- passedAt：9題9過0失敗、0 skipped；涵蓋首次達標、重送、部分測驗、綜合練習與複習考期限後首次達標。
- emulator：Firestore v1.22.0、127.0.0.1:18083、demo-snapshot-fix；7題全過，實際寫入／讀回／刪除兩類快照。完成後已關閉程序，未連正式Firestore。
- npm run check：234／234前端及共用測試、77／77 Functions測試；tsc、Vite正式build、版本1.10.2全通過。
- git diff --check通過；只有模型、Functions一行更新及回歸測試，src解析顯示／版本檔／教材未改。

原始輸出：/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/snapshot-main。
red.txt、green.txt、emulator-green.txt、passed-at.txt、npm-check.txt及deploy-selectors.json；manifest列大小與SHA256。
截圖保存至2026-10-31（此段為後端修正，無新增截圖），原始輸出同日到期。

## 教師執行命令（Claude驗收通過後）

先核對本報告列出的三個函式。以下命令只部署platform codebase的這三個函式，不推Git，不更新Hosting：

```sh
cd '/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/snapshot-main'
export PATH='/Users/HHC/.nvm/versions/node/v22.23.2/bin:'"$PATH"
git status --short
npm --prefix functions run build
firebase deploy --project ap2-7ed91 --only functions:platform:createSnapshot,functions:platform:buildReviewExam,functions:platform:patchCourseDraft
```

CLI的getEndpointFilters已在本機離線解析為platform下的3個精確ID，結果在deploy-selectors.json。沒有實際執行firebase deploy。
部署後由教師用測試課程建立快照與重建既有複習考確認；正式資料操作不在本輪執行範圍。
目前#3停-等Claude，不自行部署、同步或push。
