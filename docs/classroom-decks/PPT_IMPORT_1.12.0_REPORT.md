# 授課控制台「匯入投影片＋題目表」、多份簡報與四種指示工具（1.12.0）實作報告

## 給 Claude 的摘要
- **版本與分支**：已於 `.worktrees/ppt-import-sample`（分支 `feature/ppt-import-sample`）完成 **1.12.0** 完整版實作與升版同步（`version:sync` / `version:check` 通過）。
- **多份簡報與儲存**：`TeachingControl.tsx` 頂部新增「選擇簡報」選單與「拆分為『呼吸複習』『泌尿＋體液複習』」一鍵遷移按鈕；簡報圖與原始 PDF 存於 `courses/{courseId}/teachingDecks/{deckId}/...`（`storage.rules` 限授權教師讀寫，播放回傳 2 小時短期有效網址，保留原始 PDF 向量供放大工具重繪）。
- **瀏覽器端一次匯入**：`PptImportModal.tsx` 在前端用 `pdfjs-dist` 將 PDF 每頁轉為 1920×1080 投影圖、讀取 `.xlsx` 題目表與選填 `.pptx` 備忘稿；支援 **單選、排序、是非**（選項欄留空自動產生 `○ 對`／`✕ 錯`，答案接受 `對/錯/O/X`，底層以 `choice` 存入 `classroomConfig`，預覽與學生手機顯示兩個大按鈕）。
- **防呆、合併與重匯差異**：完整檢查頁碼超界、選項 `<2` 或 `>6`、答案超界、排序不完整、是非答案無效、解析 `>300` 字、同頁重複出題（有錯鎖定匯入）；確認後自動合併進 `classroomConfig` 並保留其他簡報舊題；重匯同名簡報列出「新增／變更／刪除」頁與題，已公佈輪次維持不可變快照。
- **四種指示工具**：播放（含全螢幕）支援 **放大鏡（M，2–3× 滾輪調整）**、**聚光燈（S，滾輪調光圈）**、**雷射筆（L）**、**框選放大（Z，拉框全畫面放大、Esc 回原頁）**；放大鏡與框選放大直接從 PDF 向量重繪，再按同鍵或 Esc 關閉，底部附四顆觸控按鈕，不影響講者備註與開題／收題／公佈答案。
- **後端部署清單（本次未部署）**：① `firebase deploy --only storage`（部署 `storage.rules`）；② `firebase deploy --only functions:saveTeachingDeck,functions:getTeachingDeck`（新增 `saveTeachingDeck`、更新 `getTeachingDeck`）。
- **驗證與截圖**：全套 `npm run check`、乾淨 clone `npm ci && npm run check`（零私有路徑依賴）、真實 Firestore Emulator 匯入與重匯驗證皆通過；1920 總覽截圖存於 `/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-28/ppt-import-1.12.0/`（保存至 **2026-11-04**，即 +7 天）。

---

## 一、功能實作明細

### 1. 多份簡報選單與 Firebase Storage 儲存
- **簡報選單（`src/TeachingControl.tsx`）**：控制台上方提供「選擇簡報」下拉選單，可切換不同複習或單元簡報（如「呼吸複習」、「泌尿＋體液複習」）。
- **28 頁合併版相容與拆分遷移**：既有 `teacherAssets/presentation`（28 頁合併版）可直接原狀播放，亦可點選「拆分為『呼吸複習』『泌尿＋體液複習』」呼叫 `saveTeachingDeck({ action: 'migrateLegacy28' })`，拆為 `respiratory-review`（14 頁）與 `urinary-fluid-review`（14 頁）兩份獨立簡報，且既有 `classroomConfig` 題目與答案完全保留。
- **Storage 路徑與短期有效網址**：
  - 原始向量 PDF：`courses/{courseId}/teachingDecks/{deckId}/source.pdf`
  - 每頁 1920 寬投影圖：`courses/{courseId}/teachingDecks/{deckId}/slides/page-XX.webp`
  - `getTeachingDeck` 僅限該課程授權教師呼叫，讀取時產生 2 小時短期有效網址（`urlExpiresAt`）。

### 2. 瀏覽器端匯入流程与是非題支援
- **前端處理（`src/pdfVectorRenderer.ts`、`src/pptImportFiles.ts`、`src/PptImportModal.tsx`）**：
  - 選取 `.pdf` 後在瀏覽器端以 `pdf.js` 轉為 1920×1080 圖片，同時保留原始 PDF 供向量放大重繪。
  - 選取 `.xlsx` 題目表（可直接使用 `docs/classroom-decks/題目表範本.xlsx`）後，前端即時解析並執行防呆檢查。
  - 選填 `.pptx` 時，自動從 `ppt/notesSlides/notesSlideN.xml` 與 `ppt/slides/slideN.xml` 擷取講者備忘稿與頁面標題。
- **三種題型（單選／排序／是非）**：
  - **單選**：答案填 `A`–`F`。
  - **排序**：答案填完整順序字母（如 `B D C A`）。
  - **是非**：選項 1～6 留空，系統自動產生 `['○ 對', '✕ 錯']`，答案接受 `對`、`錯`、`O`、`X`（不分大小寫）；底層仍以 `kind: 'choice'` 存入 `classroomConfig`，預覽畫面與學生手機端（`src/ClassroomInteraction.tsx`）自動渲染為「○ 對／✕ 錯」兩個大按鈕。
- **合併與重匯差異（`shared/pptImport.ts`）**：
  - 系統以 `buildDeckSlideId(deckId, pageNumber)` 產生不撞號的 `slideId`（如 `resp-sample-112-P07`）。
  - `mergeDeckClassroomConfig` 自動將本簡報題目與正解合併進 `classroomConfig/interactions` 與 `classroomConfig/answerKeys`，其他簡報的舊題 100% 保留。
  - 重新匯入同一份簡報時，預覽與後端皆透過 `computeDeckReimportDiff` 列出「新增、變更、刪除」的投影片與題目；`classroomRounds` 中已公佈過答案的歷史輪次維持原本 `round.reveal` 快照不變。

### 3. 授課控制台四種指示工具（`src/SlidePointerTools.tsx`）
| 工具 | 快捷鍵 | 觸控／底部按鈕 | 功能與規格 |
| :--- | :---: | :---: | :--- |
| **放大鏡** | `M` | `放大鏡 (M)` | 圓形鏡片跟隨游標／觸控移動，預設 `2.5×`，滾輪可調 `2.0×–3.0×`；直接由 PDF 向量重繪（`renderPdfPageVectorZoom`），放大後文字清晰不模糊。 |
| **聚光燈** | `S` | `聚光燈 (S)` | 整頁變暗，僅保留游標周圍亮圈，滾輪可調整光圈半徑（`80px–360px`）。 |
| **雷射筆** | `L` | `雷射筆 (L)` | 高亮紅點跟隨滑鼠或觸控移動。 |
| **框選放大** | `Z` | `框選放大 (Z)` | 拖曳拉出矩形框（或平板單點局部），將該區以 PDF 向量重繪放大至全畫面；按一次 `Esc` 返回原頁，再按 `Z` 或 `Esc` 關閉工具。 |

- **快捷鍵讓位原則（Conflict Yielding Policy）**：
  1. 當焦點位於表單控制項（`input`、`textarea`、`select`、`button`、`[contenteditable="true"]`）或匯入預覽視窗（`.ppt-import-modal`）開啟時，指示工具快捷鍵 `M`/`S`/`L`/`Z` 自動讓位，不攔截鍵盤輸入。
  2. 按住 `Ctrl`、`Alt`、`Meta`（Cmd）組合鍵時自動讓位，不干擾瀏覽器系統快捷鍵。
  3. 換頁（`ArrowLeft`/`ArrowRight`/`PageUp`/`PageDown`/`Space`）、黑屏（`B`）及課堂互動按鈕（開放作答、結束作答、公佈答案）完全不受影響。

---

## 二、後端部署清單（Deployment Checklist）

> 本次僅在 worktree 完成實作與本地／Emulator 驗證，**未執行任何雲端部署**。後續正式部署時需依序執行：

1. **Firebase Storage 安全規則（`storage.rules`）**
   - 路徑規則：`/courses/{courseId}/teachingDecks/{deckId}/{allPaths=**}` 僅允許 `isCourseTeacher(courseId)` 讀寫，其餘路徑一律拒絕。
   - 部署指令：`firebase deploy --only storage`
2. **Cloud Functions Callables（`functions/src/teaching.ts`、`functions/src/index.ts`）**
   - 新增 callable：`saveTeachingDeck`（支援簡報與 PDF/圖片寫入、題目表驗證與 `classroomConfig` 合併、重匯差異計算、以及 `migrateLegacy28` 拆分遷移）。
   - 更新 callable：`getTeachingDeck`（支援 `deckId` 多簡報切換、`decks` 清單回傳、Storage 短期有效網址簽發）。
   - 部署指令：`firebase deploy --only functions:saveTeachingDeck,functions:getTeachingDeck`

---

## 三、測試與驗收證據

1. **單元與整合測試**：
   - `tests/ppt-import.test.ts`：涵蓋單選／排序／是非題解析、8 種題目表錯誤阻擋、合併保留舊題、重匯差異計算、`docs/classroom-decks/題目表範本.xlsx` 讀取、28 頁拆分、四種指示工具狀態機與快捷鍵讓位、以及瀏覽器端 Playwright 全流程驗收。
   - `functions/tests/ppt-import.test.cjs`：涵蓋 `saveTeachingDeck` / `getTeachingDeck` 多份簡報、短期有效網址、28 頁拆分、錯誤題目表拒絕、重匯差異與已公佈輪次快照不可變、學生公佈前讀不到答案與權限隔離。
2. **真實 Firestore Emulator 端到端驗證**：
   - 腳本：`functions/scripts/verify-ppt-import-emulator.cjs`
   - 執行：`npx firebase emulators:exec --only firestore --project course-platform-ppt-import-test "node functions/scripts/verify-ppt-import-emulator.cjs"` → **通過**。
3. **1920 總覽截圖（保存至 2026-11-04，即 +7 天）**：
   - 目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-28/ppt-import-1.12.0/`
   - `01-multi-deck-selector-1920.png`：多份簡報選單（「呼吸複習」「泌尿＋體液複習」）與控制台頂部匯入入口。
   - `02-browser-import-preview-1920.png`：瀏覽器端 PDF 轉 1920 寬圖＋`.xlsx` 題目表（單選、排序、是非大按鈕）預覽畫面。
   - `03-pointer-tools-and-true-false-1920.png`：播放時 PDF 向量重繪放大鏡（M，2.5× 清晰文字）與互動開題狀態。
   - `04-true-false-and-pointer-toolbar-1920.png`：畫面底部四顆指示工具觸控按鈕（放大鏡／聚光燈／雷射筆／框選放大）與學生端「○ 對／✕ 錯」兩個大按鈕互動畫面。
