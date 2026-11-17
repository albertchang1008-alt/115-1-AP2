# 部署變慢的原因與「未變更就跳過」修改報告（2026-11-17，Claude Fable）

## 給 Claude 的摘要
- 教師問題：每次部署都要很久。原因：`npm run check` 裡的教材閱讀規範檢查每次把 17 份教材全部重量，而且 `deploy.sh`（本機）與 GitHub Actions 各跑一次。
- 本件做的事（教師 11/17 選定）：閱讀規範檢查改成「內容與檢查方式都沒變的教材跳過」。分支 `perf/readability-incremental`（自 origin/main bff2281a），worktree `.worktrees/readability-incremental`；未 push、未合併、未部署。
- 改檔：`scripts/readability-check.mjs`、`package.json`（加 `readability:record`、`readability:all`）、`docs/READABILITY_STANDARD.md`；新檔：`scripts/lib/readability-cache.mjs`＋`.d.mts`、`scripts/readability-cache.json`（17 份的通過紀錄）、`tests/readability-cache.test.ts`、本報告。**每週完整檢查的流程檔沒有加進去**：`.github/workflows/` 是受保護的位置，我這邊的工具不能寫入；內容附在本報告最後，要由教師或在 Mac 上工作的 agent 建檔。
- 實跑（雲端 Linux、非 root、Chrome）：17 份教材逐一完整檢查並記錄，17/17 PASS；之後再跑 `readability:check`：跳過 17 份，0.6 秒（原本 17 份完整量一次，依其中兩份實測 27 秒與 1 分 48 秒推估約 20 分鐘）。改一份教材的檔案 → 只重量那一份；改 `src/App.tsx` 或新增別的 CSS → 仍跳過 17 份；改 `src/style.css` → 17 份全部重量。新測試 5/5、既有 `tests/readability.test.ts` 5/5、`tsc -b` 0 錯。
- **沒有實跑**：整套 `npm run check`（我的工作區缺 `materials-src/figures`、`html/` 等，前端 300 支裡 27 支因缺檔失敗，與本件無關，但因此量不到整套時間）；Mac 與 GitHub Actions 上的實際時間；紀錄檔在 Mac／GitHub 上是否算出相同指紋（理論上相同，因為只看檔案內容；請驗證者看輸出是否為「未變更跳過 17 份」）。
- 偏離或拿不準：見「風險與取捨」4 點。另有一個不在本件範圍、但影響更大的發現（下方「發現」）。

## 量到的數字（GitHub Actions，公開紀錄）
| 上線時間 | 整個流程 |
|---|---|
| 10/30 中午以前 3 次 | 6.1–6.5 分鐘 |
| 10/30 下午（47766f4a，加入閱讀規範檢查）之後 9 次 | 23.6–39.6 分鐘 |
| 最近一次（11/8，bff2281a） | 30.6 分鐘，其中 `npm run check` 28.9 分鐘；安裝、上傳、發布合計不到 2 分鐘 |

`deploy.sh` 在本機先跑同一套 `npm ci`×2＋`npm run check`，再部署全部後端函式、推 main，然後 GitHub 重跑一次。本機那一段沒有量測紀錄。

## 發現：被量的是舊版教材，學生用的版本不在這項檢查裡
- `scripts/readability-check.mjs` 量的是 `public/materials/<代號>-v1`（尿液通路為 `-v2`）共 17 份。
- 目前發布的課程（平台連線工具唯讀查詢，2026-11-17）：呼吸 7、泌尿 6、體液 4 共 17 份活動，網址全部是 `-ag1` 版；沒有任何活動指向上述 `-v1`／`-v2`。
- 檢查程式自己也把 49 個資料夾列為「未納入」（`warningMaterials`），其中包含全部 17 份 `-ag1`。
- 也就是：每次部署花近半小時量的版本，學生已經不會打開；學生在用的版本不受 `npm run check` 的閱讀規範把關（Antigravity 另有自己的驗證紀錄，不在本檢查內）。
- 本件沒有改變檢查範圍。要不要把 `-ag1` 納入、舊版要不要停止檢查或下架，請教師與 Claude 決定。

## 做法
一份教材的檢查結果只取決於：
1. 這份教材的檔案：`public/materials/<版本>/` 與 `materials-src/<代號>/`。
2. 檢查程式與它實際 import 的模組（用 esbuild 解析，不是人工列表）。
3. 包住教材的平台播放器（`src/Player`、`src/FontSizePicker` 實際用到的檔案）、`src/style.css`、`public/materials/` 最上層共用檔、`package-lock.json`。
4. 檢查過程中另外讀到的專案內檔案。這項是實際檢查時記錄 Node 讀了哪些路徑得出的；目前記到的有 `docs/urinary-release/scripts/*.md`、`docs/urinary-release/ACIDBASE_STUDENT_SCRIPT.md`、`docs/MATCHING_QUESTION_UI.md`、`materials-src/apply-kit/teacher-figures.json`，以及根目錄的 `CODEX_TASK_acidbase-v3-review-fix_2026-10-21.md`。

2＋3 合成一個「共用指紋」，1 是「教材指紋」，4 逐檔記錄。`scripts/readability-cache.json` 存的是上次通過時的這三樣；全部相同才跳過，任何一項不同就照常重量。

- `npm run readability:check`（`npm run check` 用的）：只讀紀錄、不寫檔，所以不會弄髒工作目錄，`deploy.sh` 的「檢查後工作目錄必須乾淨」不受影響。
- `npm run readability:record`：重量有變的教材，全部通過才更新紀錄檔；要一起 commit。
- `npm run readability:all` 或環境變數 `READABILITY_ALL=1`：不看紀錄，全部重量。
- 靜態 CSS 檢查每次都跑（很快）。
- 從程式裡呼叫 `checkReadability()` 預設不使用紀錄，既有測試行為不變。

## 風險與取捨
1. **GitHub 不再獨立重量沒變的教材**：以前每次上線 GitHub 都在自己的環境重量一次；現在沒變的教材沿用紀錄（紀錄可能是在別的環境量的）。指紋包含 Playwright 版本（`package-lock.json`），但不包含 Chrome 版本。補救：建議加一個每週一次的完整檢查流程，失敗時 GitHub 會寄信，也可手動執行。**這個流程檔本件沒有加成**（見摘要），在它加上之前，這項保險不存在；需要時請手動跑 `npm run readability:all`。
2. **紀錄檔是提交進程式庫的檔案**：理論上可以被手改成「假通過」。它存的是內容指紋，改教材後指紋就對不上，所以不會意外放行；但刻意竄改擋不住。審查時請看這個檔的 diff 是否只在教材或檢查程式有改動時才變。
3. **忘了跑 `readability:record`**：不會出錯，只是那次部署會重量有變的部分（本機與 GitHub 各一次）。
4. **改 `src/style.css` 或播放器會讓 17 份全部重量**：這是必要的（樣式會影響教材外框），但代表動到全站樣式的平台改版仍然慢。新功能的樣式放獨立 CSS 檔（例如點名的 `src/attendance.css`）就不受影響。

另外提醒：`CODEX_TASK_acidbase-v3-review-fix_2026-10-21.md` 這個根目錄交辦檔被酸鹼教材的檢查讀取；整理根目錄交辦檔時不能直接搬走它，否則檢查會失敗。

## 還可以做、但沒做的
- GitHub 不重跑整套檢查（本機跑過就只建置與發布）：可再省一半，代價是少一道乾淨環境的保險。教師未選。
- 後端只部署有改的函式：`deploy.sh` 目前每次部署全部 67 個，這段沒有量測數字。教師未選。
- 教材搬到另一個專案：見 Claude 專案文件「平台檢視與資訊圖表搬遷規畫.md」。

## 請驗證者做的事
1. 在 worktree `npm ci`（根目錄與 functions）後跑 `npm run check`：看閱讀規範那一段是否印出「未變更跳過 17 份；需要檢查 0 份」，並記錄整套耗時。
2. 若不是 17 份：跑 `npm run readability:record`，看哪些被重量、是否通過，回報紀錄檔的 diff（代表我這邊算的指紋和 Mac 上不同，要查原因）。
3. 跑 `npm run readability:all` 一次，確認 17/17 PASS 並記錄耗時（這是原本每次部署的成本）。

## 附：每週完整檢查的流程檔（尚未建立）
建議存成 `.github/workflows/readability-full.yml`：
```yaml
# 每週把全部教材的閱讀規範重新量一次（不跳過、不發布）。失敗時 GitHub 會寄信通知；也可以在 Actions 頁面手動執行。
name: Readability full check
on:
  schedule:
    - cron: '0 19 * * 6' # 每週日 03:00（Asia/Taipei）
  workflow_dispatch:
permissions:
  contents: read
jobs:
  readability:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run readability:all
```
註：檢查程式用 `chromium.launch({ channel: 'chrome' })`，實際用的是 GitHub runner 預裝的 Google Chrome，版本由 GitHub 決定（與 `pages.yml` 相同的安裝寫法即可）；這也是紀錄檔要記環境（審查修正 S1）的原因。

## 審查修正（2026-11-17，Claude Opus 依教師指示直接修改）
審查報告：`docs/READABILITY_INCREMENTAL_CLAUDE_REVIEW_2026-11-17.md`。
- **F1（必修）**：`listMaterialFiles()`：在 git 程式庫內，教材資料夾與 `public/materials/` 最上層共用檔只算 `git ls-files --cached --others --exclude-standard`（追蹤的＋新增但未忽略的），不在 git 內才列出全部；一律不算 `.DS_Store`。被忽略的 `materials-src/<代號>/shots/` 不再讓主程式庫每次重量 7 份呼吸教材。
- **S1**：record 時在紀錄檔寫 `environment`（作業系統-架構、實際使用的 Chrome 版本）；cache 模式若有教材要跳過且環境不同，印一行提醒，仍沿用紀錄。
- **S2**：新增測試，`checkReadability({ cache: true })` 不新增、不修改程式庫內任何檔。
- 新增 `scripts/readability-check.d.mts`（測試以 TypeScript 匯入檢查程式，`tsc -b` 需要型別）。
- 測試：新增 3 支（F1、環境提醒、S2）。雲端 Linux 以單檔跑 `tests/readability-cache.test.ts`：前 7 支 PASS、0 skipped；S2 需要完整程式庫，在雲端無法跑，交 Mac 驗證。`tsc` 型別檢查 PASS。
- **紀錄檔尚未更新**：指紋算法改了，共用指紋必然改變，目前的 `scripts/readability-cache.json` 會全部失效（只會重量，不會放行）。由驗證者在 Mac 跑 `npm run readability:record` 重建，並一起 commit。
