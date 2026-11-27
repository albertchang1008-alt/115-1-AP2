# 給 Claude 的摘要

- #72 實作提交 `523752e9`。依教師 09:47 核准，只在 `materials-src/apply-kit/acidbase-assessment.css` 加一條行高規則，重建 `public/materials/acid-base-homeostasis-v1/index.html`。
- Ubuntu 非 root 專項 3/3 PASS。390×844 三狀態各兩個標籤，`sh/ch` 均由 `18/16` 變為 `20/20`，`clip` 均由 2 變為 0。Mac 專項 1/1、340 畫面、0 問題。390 預設／特大各一張。
- Ubuntu 非 root 全套 13/13 步驟 PASS。前端 365/365、後端 158/158、0 skipped。兩次全量閱讀規範均為 17/17、4,864 畫面、0 問題。
- 偏離與待驗：基線的 16 份快取已失效，Mac 用 `--slug` 限定實測。最終手機實點待教師。
- 請抽查專用 CSS 的選擇器與載入位置、產物位元組比對、Ubuntu 兩份專項尺寸輸出，以及全套 summary。

## 根因與範圍

工作樹為 `fix/acidbase-390-clip`，基準 `48a112d015671d61a421d078739fc4e639673d40`。

- `tests/material-urinary-events.test.ts:21–26` 以 `approvedUrinaryDocument` 選定 `public/materials/acid-base-homeostasis-v1/index.html`，再以 `checkScriptLayout` 重播。獨立的 readability 同樣由 `scripts/readability-check.mjs:38,107,201–216` 選到 `-v1`。交辦指定的 `-ag1` 為 Antigravity 教案包出產的另一份教材，基線公開檔與教案包的 `08-酸鹼平衡/index.html` SHA-256 同為 `a908be5d255e657526bb516ba658d6df1167560ae19d14b5fb946b049984aca0`。
- 兩個標籤都符合 `[data-screen="node"][data-node="1"][data-action="micro"] button.work-slot[data-slot] > span[data-copy]`，`data-slot` 分別為 `0` 與 `1`。`student.js:281–287` 在本節點產生兩個槽位。
- 390 寬時，共用 `materials-src/apply-kit/student.css:521–526` 的 `.student-main.micro-mode .work-slot` 為父按鈕指定 `font-size: 14px`、`line-height: 1.15`。標籤繼承 16.1px 的行高，計算高度 16.0938px，Linux Chrome 的 `scrollHeight` 為 18px。標籤 computed `overflow` 為 `visible`，重播仍依 `sh > ch + 1` 判 FAIL。兩個渲染器都載入這份 CSS，見 `full-render.mjs:62` 與 `scripted-render.mjs:21–23`。
- `acidbase-assessment.css` 只由 `full-render.mjs` 的非 legacy 酸鹼渲染路徑載入。新增規則作用於手機寬度、N02 micro 的槽位 0／1 的直接子標籤，`line-height: 1.4`，在原生畫面為 19.6px。以 `buildApprovedUrinary('acid-base-homeostasis', { preview: true })` 重建單一教材，目錄註冊設定維持原值。去除新增規則並正規化產物指紋後，新舊 HTML 位元組一致。

## Colima Ubuntu 基線量測

以 `ap2-replay:node22`（linux/amd64）、UID 1001、`CHROME_PATH=/usr/bin/google-chrome` 執行既有 `checkScriptLayout`，以觀測回呼擷取尺寸。完成檔的 `0` 表示診斷程式正常結束，版面檢查本身為 3 個 FAIL。

| 390×844 狀態 | 槽位 0 基線 → 修後 sh/ch | 槽位 1 基線 → 修後 sh/ch | clip 基線 → 修後 |
|---|---:|---:|---:|
| `N02-micro` | 18/16 → 20/20 | 18/16 → 20/20 | 2 → 0 |
| `N02-micro-hint` | 18/16 → 20/20 | 18/16 → 20/20 | 2 → 0 |
| `N02-micro-wrong` | 18/16 → 20/20 | 18/16 → 20/20 | 2 → 0 |

修後同為 UID 1001，Chrome 158.0.8127.88。三狀態均 `sw/cw=28/28`。實測採用原生教材畫面，與 `tests/material-urinary-events.test.ts` 的版面檢查條件一致。

## Mac 閱讀規範與存證

`npm run readability:check -- --slug acid-base-homeostasis` 退出 0，1/1 教材、340 畫面、0 issues、0 staticIssues、0 errors。未改動的 `48a112d0` 與本提交具有同一份共用新指紋，均和提交內的快取舊指紋不同。限定 slug 保留原快取，Mac 實際只量酸鹼一份。

在平台播放器內量測，每個標籤預設為 18px、`sh/ch=29/29`，特大為 23.4px、`sh/ch=37/37`。原始輸出及兩張 N02-micro 截圖都在 repo 外的 `課程平台-驗收證據/2026-11-25/acidbase-390-clip/`。**截圖保存至 2026-12-02**。

| 證據 | 檔案 |
|---|---|
| Ubuntu 390 基線與修後 | `ubuntu-48a112d0-k1.log`、`ubuntu-target.log` |
| Mac 閱讀規範與尺寸 | `mac-readability-summary.json`、`mac-target.log` |
| 390×844 預設／特大 | `390-default.png`、`390-xlarge.png` |

量測程式路徑以 grep 查核，macOS 或個人絕對路徑 0 命中，暫存用 `os.tmpdir()`。CSS 試法使用 1/2 種。K1 仍適用於尚未包含本提交的 `origin/main@48a112d0` 和由它重基準的工作。

## Ubuntu 非 root 全套

Colima Ubuntu x86_64 第 1/2 輪於 11:04:39 結束，退出 0。匯出提交 `523752e9` 的 tree 為 `cdb9bc8785b583af7f6935cce1fbcc6312515603`，與容器還原 tree 一致。證據在 `課程平台-驗收證據/2026-11-25/ubuntu-replay-523752e9-0958/`，入口為 `summary.txt`，完成檔為前述 #72 證據夾的 `ubuntu-full-r1.done`。

| 步驟 | 結果 |
|---|---|
| 00–05 環境、還原、tree、依賴、系統 Chrome | 6/6 PASS，測試以 UID 1001 運行 |
| 06 `READABILITY_ALL=1 npm run check` | PASS。365/365 前端、158/158 後端；0 skipped。三個 N02 狀態 `clip=0`；閱讀規範 17/17 |
| 07 `npm run readability:check` | PASS。17/17、4,864 畫面、0 issues、0 staticIssues、0 errors、0 skipped |
| 08–12 版本、Zuvio 瀏覽器、平台小考模擬器與瀏覽器、工作樹 | 5/5 PASS |
