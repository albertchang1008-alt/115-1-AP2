# 新版提示橫幅 1.15.0（#41）

## 給 Claude 的摘要
- 已從重新fetch確認的origin/main **45b9e266（1.14.0）**建立feature/update-banner，worktree `.worktrees/update-banner`；根目錄分支未切換。
- 功能版號1.15.0：既有分支VERSION、標籤與提交查詢未使用；避開#39保留的1.13.0，#39日後整合時再重排版本。
- 學生／教師共用main入口橫幅，只有按鈕才reload；作答中禁用重載且不移動焦點、不改答案。
- 時機：初載、visible、online、前景30分鐘；60秒節流、no-store＋時間戳、失敗靜默。
- 檔案：src/UpdateBanner.tsx、updateVersion.ts、updateActivity.ts、update-banner.css；5個作答入口接狀態鎖。
- 定向單元4/4 PASS；Chrome實測一般頁、完整／複習／閃卡／練習／評量／課堂互動、390、實際重載新bundle PASS。
- worktree及全新clone npm run check均269＋98全過、0 failed／0 skipped；實作98138e10，文件提交另列於佇列。
- 1920兩圖與390×844兩圖在repo外2026-10-30/update-banner，保存至2026-11-06。
- 偏離：無；手機是Chrome尺寸模擬，未宣稱已在實體iOS主畫面App測試。
- 抽查：重載唯一入口、作答／儲存鎖、節流與失敗、前景重現、390頂部與提交按鈕位置。
- 不push、不部署、不寫正式資料；只需前端部署，functions邏輯未改。

## 實作

UpdateBanner放在src/main.tsx的App旁，登入前、學生與教師共用，不隨頁籤重掛。互動教材iframe自己的materials HTML沒有加入檢查或橫幅；未新增service worker、追蹤或後端查詢。

createVersionChecker對document.baseURI下的version.json發fetch，cache:'no-store'，加`?_=<Date.now()>`；比對shared/version.ts。只接受有限長度x.y.z字串。同版本不顯示，合法的不同部署版本才提示（也能提醒部署回復）；無效JSON、非成功狀態、離線及10秒中止皆靜默，不新增提示。已確認有新版時，後續離線不抹掉這項已知狀態。

初載檢查一次；visibilitychange只有visible時檢查並解除暫時關閉；online恢復也檢查；每30分鐘定時器僅前景執行。同一checker每次嘗試後至少60秒才再抓，進行中的請求不重疊；卸載時移除事件、計時器並中止請求。關閉橫幅不儲存永久偏好；下次前景會用已知狀態重現，即使仍在60秒節流內也不用再抓。

一般文字為「平台已更新，點這裡載入新版」。作答時文字為「平台已更新，交卷後再載入新版」，按鈕disabled；關閉仍可操作。aria-live polite／atomic只報提示變化，不自動focus。原生按鈕可鍵盤操作，最小44px操作區及focus-visible輪廓。

## 作答保護與版面

useUpdateProtection用layout effect登記外部作答鎖，卸載或結束釋放；多個同時存在的作答者須全部結束才解鎖。reloadIfIdle在點擊當下再讀一次鎖，避免陳舊可點畫面觸發reload。全src只有UpdateBanner這個location.reload呼叫點，沒有版本事件或計時器自動重載。

| 入口 | 鎖定範圍 |
|---|---|
| Student.Quiz | 完整測驗、複習考與同元件模式，直到result已出且儲存不再busy |
| PracticeModes.Flashcards | 尚有題卡時；完成或離開解鎖 |
| PracticeModes.PracticeSession | 錯題／綜合等共用流程，作答與儲存期間 |
| StudentAssessments | session active或start/save busy |
| StudentInteraction | 開題且尚未送出；離開元件釋放 |

版面以ResizeObserver量測橫幅高度，設CSS變數，為root、固定側欄、quiz、quiz-topbar、reading-page、assessment-overlay與設定入口預留空間。橫幅不覆蓋題幹、返回或底部提交；文字換行／字級改變時更新高度。暫時關閉或消失後還原偏移。

## 瀏覽器實測

`scripts/update-banner-verify.mjs`啟動僅綁localhost的HTTP伺服器，Chrome網路只放行該本機URL。頁面使用正式UpdateBanner、Quiz、Flashcards、PracticeSession、StudentAssessments與StudentInteraction；一般課程總覽外框為本機假資料fixture，沒有正式登入或API。

伺服器先送1.15.0 bundle及version.json，模擬部署變更為1.16.0；回到前景提示，鍵盤Enter按下後真的重新請求文件並載入1.16.0 bundle，頁面顯示的新版本與內建常數一起變更。不是攔截reload假裝成功。

驗證清單：
- 相同不提示；前景及online在同分鐘不重抓。
- 背景30分鐘無版本請求；前景30分鐘檢查。
- 關閉後下次前景重現，仍不繞過節流。
- 作答時按鈕disabled；即使程式呼叫原生button.click也不重載，已選答案不變。
- 交卷儲存500ms期間仍鎖，完成才解鎖，過程沒有自動重載。
- 複習考、閃卡、共用練習、正式評量及課堂互動皆逐一用正式元件確認鎖定／離開解鎖。
- 390視窗從一開始載入驗證，提示、返回與提交按鈕不相交，沒有水平溢出；另有1920圖。
- 503失敗無提示；網路恢復且過節流後可重新提示。pageerror 0。

```sh
npx tsx --test tests/update-banner.test.ts
node scripts/update-banner-verify.mjs --out /tmp/codex-update-banner/ui
npm run check
# 全新clone，無原worktree node_modules
unset REVIEW_DECKS_DIR
npm ci
npm --prefix functions ci
npm run check
```

### 最終實際輸出

```text
worktree npm run check: exit 0
clean npm ci: exit 0
clean npm --prefix functions ci: exit 0
clean npm run check: exit 0
前端／共用 tests269 / pass269 / fail0 / skipped0
後端 tests98 / pass98 / fail0 / skipped0
版本一致：1.15.0
TypeScript＋Vite build PASS
定向unit tests4 / pass4 / fail0 / skipped0
Chrome verification pass:true / errors:[] / autoReload:false
```

全新clone `/tmp/codex-update-banner-clean` 基準98138e10，unset REVIEW_DECKS_DIR，安裝兩端依賴後執行全套。clone追蹤檔無變動。npm ci既有audit與Vite chunk提示保留於原始log，沒有新增依賴或略過測試。

瀏覽器最終verification.json：current1.15.0、next1.16.0、versionRequests10、documents5、errors[]、autoReload:false。測試修正過HTTP回應等待時序，手機截圖採原生390視窗，避開桌面縮放過場殘影。正式功能未以延時或重試掩蓋問題。

## 截圖與證據

`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/update-banner/`，保存至 **2026-11-06**。

| 檔案 | 內容 |
|---|---|
| ui/01-normal-1920.png | 一般頁面可點橫幅，1920×1080 |
| ui/02-answering-1920.png | 作答中禁用重載，1920×1080 |
| ui/03-normal-390.png | 390×844一般頁面 |
| ui/04-answering-390.png | 390×844作答頁，選項／返回／提交均未遮擋 |
| ui/verification.json | 本機部署切換與作答保護結果 |
| unit.log、browser.log、typecheck.log、check.log | worktree定向／全套實際輸出 |
| clean-clone.log、clean-ci.log、clean-functions-ci.log、clean-check.log | 全新clone驗收 |
| SHA256SUMS.txt | 證據清單 |

## 部署與限制

僅前端。版本同步依既有腳本更新VERSION、兩端package／lock、shared/version.ts、public/version.json、apps-script版本標記與文件版本行；**functions/src及後端行為無改動，不需要部署functions**。根目錄handoff未改；worktree文件僅版本行依version:sync同步。

Claude驗收、教師核准且確認origin/main可快轉後，教師從本worktree執行：

```sh
git push origin feature/update-banner:main
```

本輪未執行。已開著的1.14.0舊分頁本來沒有此功能，須使用者先手動關閉／重開或重新整理一次載入1.15.0，之後才會收到新版提示；這是新增前端功能的生效邊界。實體iOS／Android主畫面行為尚待教師實機確認，未新增service worker。
