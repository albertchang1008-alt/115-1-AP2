# 1.9.0 共用整合：Claude 獨立驗收（2026-10-13）

對象：`feature/1.9.0-unify` @ `78cb5dc`（worktree `.worktrees/unify-1.9.0`，基底 origin/main@a593796）
規格：`docs/unify-1.9.0/CODEX_TASK_UNIFY_FEATURES_AP2_2026-10-13.md`
做法：從 78cb5dc 匯出原始碼，在 Claude 隔離環境重跑全部檢查與建置；未 push、未部署、未執行 migration、未碰正式 Firebase。

## 結論：有條件通過

**必修 1 項**（M-1，只影響 MI migration 的 `--apply`）。修好、補測試、Claude 複驗後即可交教師授權部署。其餘為小項，可在部署前或後處理。

## 一、重跑結果

| 項目 | AP2（VITE_SITE_ID=ap2） | MI（VITE_SITE_ID=mi） |
|---|---|---|
| `npm run check` 前端 | 156／156 | 156／156 |
| Functions 測試 | 54／54 | 54／54 |
| skipped | 0 | 0 |
| 建置產物分離 | 31 份教材 | 2 份教材＋3 個 CHP |
| guide 頁驗證（guide-site-verify） | 通過 | 通過 |

隔離環境擋 Google Fonts、無 `70354e0` 歷史，曾有 9 項因環境失敗；只在隔離環境替換字型匯入與 git 呼叫後全過。repo 程式碼未改，屬環境因素。

## 二、逐項核對

| 規格項目 | 結果 | 依據 |
|---|---|---|
| `Course.features` 三旗標預設關閉；根課程文件為準 | 通過 | `functions/src/features.ts`、編輯器 fieldset |
| callable 一律經 `featureAccess` 擋關閉功能 | 通過 | assessments／classroom／teaching 皆有包裝；測試涵蓋關閉時拒絕 |
| 學生不能從一般練習取得前後測題 | 通過 | `assertPracticeBank`、`reservedQuestionIds` |
| 課堂互動：教師不能作答、班級限制、截止＋3 秒寬限、200 人上限、重複提交回原答案 | 通過 | `classroom.ts` submitClassroomInteraction |
| 反思：CRLF 換行、換信箱仍對到名冊、本機草稿 | 通過 | ReflectionPage.tsx 草稿 localStorage；Functions 測試 |
| Firestore rules：新集合預設拒絕、只走 callable | 通過 | rules 測試 |
| Excel 題庫：只新增列 | 通過 | 第 1–228 列與舊版逐格相同 |
| MI migration 限 `--project mi-bd885`；`--apply` 需 `--confirm-mi-only` | 通過 | 指定 ap2-7ed91 時 exit≠0（tests/site.test.ts:29） |
| MI dry-run 12 題與舊簡報指示逐字一致 | 通過（沿用 Codex 證據，抽查相符） | `docs/unify-1.9.0/migration-dry-run.json` |
| 學生使用說明：10 節＋模式比較表＋3 個條件節，與 `docs/STUDENT_GUIDE_PLAN.md` 及規格第 8 節一致 | 通過 | 建置後 `dist/guide/` 全文 |
| 18 張說明截圖不含真實個資 | 通過 | 均為「測試班／測試學生」示範資料 |

## 三、必修

### M-1　migration `--apply` 會寫錯資料（變數遮蔽）

`scripts/migrate-mi-1.9.0.mjs`：

- 第 10 行：`const presentation = JSON.parse(... mi-slide-transforms.json)`（要寫入的簡報文字轉換）。
- 第 28 行：`const [state, rounds, exams, presentation] = await Promise.all([... teacherAssets/presentation ...get()])` 在 apply 區塊內**重新宣告同名變數**，遮蔽了第 10 行。
- 第 39 行：`tx.set(classroomConfig/interactions, { interactions, ...presentation }, { merge: true })` 展開的是 Firestore **DocumentSnapshot**，不是轉換 JSON。結果：MI 的簡報轉換不會寫入，反而寫進 snapshot 的內部欄位（或寫入失敗）。

dry-run 用的是第 10 行的變數，所以 dry-run 報告看起來正確，**現有測試抓不到**。

**修法**：第 28 行改名為 `presentationSnap`（第 34 行的 `.exists` 檢查一併改）；第 39 行維持展開第 10 行的 JSON。
**補測試**：以假 Firestore（mock `runTransaction`／`tx.set`）跑一次 `--apply --confirm-mi-only`，斷言寫入 `classroomConfig/interactions` 的內容等於 `{ interactions, ...mi-slide-transforms.json }`。

## 四、小項（不擋部署，建議處理或由教師確認）

| 編號 | 內容 | 建議 |
|---|---|---|
| m-1 | 編輯器只填前測或只填後測來源時，`assessmentSources` 會把另一項補成空陣列；前後測必須成對才能完整運作，但介面沒有提示 | 保存時若開啟正式前後測而任一邊為空，顯示提醒（不阻擋） |
| m-2 | 功能勾選在「保存草稿」時即對學生生效（根文件為準），與一般教材要發布才生效的習慣不同 | 欄位標題已寫「保存後生效」；建議再加一句「不需發布」，避免教師誤會 |
| m-3 | AP2 教材清單含 micro 教材，但 AP2 Excel 未含其 22 列 MI 題 | **教師確認**：AP2 是否需要這 22 題；需要則另行只新增列 |
| m-4 | 說明截圖的提示標籤（如「待辦入口」「必做題填寫後送出」）壓到底下文字 | 標籤移到元素外側或加白底；純外觀 |

## 五、交接與部署前提

1. Codex 依 `CODEX_TASK_UNIFY_1.9.0_FIX_2026-10-13.md` 修 M-1、補測試（m-1、m-2、m-4 可一併）；兩站重跑 check。
2. Claude 複驗 M-1。
3. 教師確認 m-3。
4. 教師授權後依序：AP2 部署 → MI 部署 → MI migration 先 `--dry-run` 再 `--apply --confirm-mi-only`。各站 features 預設關閉，上線後由教師逐課開啟。

## 複驗（2026-10-13 23:15，對象 3a49056）：通過

- **M-1 已修**：apply 區塊改用 `presentationSnap`，寫入仍展開 `mi-slide-transforms.json`。
- **新測試有效**：用假 Firestore 跑 `--apply --confirm-mi-only`，斷言寫入內容等於 interactions＋transforms，且不含 snapshot 欄位；網路與未 mock 的 Firebase 模組一律拒絕。Claude 把修正暫時還原，該測試**確實失敗**，恢復後通過。
- m-1：保存或發布時，若開啟前後測而任一邊來源空白，顯示提醒（不阻擋）。m-2：欄位標題改為「保存草稿即對學生生效，不需發布」。m-4：18 張截圖的提示標籤移到上方，不再壓字。
- 兩站重跑 `npm run check`：前端 157／157、Functions 54／54、0 skipped。
- 剩 **m-3 待教師確認**（AP2 是否加 micro 的 22 題），不擋部署。

**結論：可交教師授權部署。** 順序：AP2 部署 → MI 部署 → MI migration 先 `--dry-run`、再 `--apply --confirm-mi-only`。
