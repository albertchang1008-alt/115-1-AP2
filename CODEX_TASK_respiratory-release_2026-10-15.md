# Codex 交辦：呼吸七份正式建置＋題目直接寫入 Google Sheet（2026-10-15，Claude 撰）

教師已看過畫面並核可（10/15）。分支 `feature/respiratory-infographics`，先 `git branch --show-current` 確認，開工先讀 `handoff.md`。

## 範圍

七份：`airway-structure`、`lungs-pleura`、`breathing-mechanics`、`lung-function`、`gas-exchange`、`o2-co2-transport`、`respiratory-control`。
**不** push、**不**部署、**不**按平台後台的「同步」，也不動其他教材與泌尿／體液。

## 一、正式建置與登錄

1. 依固定決策 22：七份各跑 `npm run materials:build <slug>`，用的是最新產生器（呼吸五份用 `scripts/respiratory-labels-r2.py`，呼吸道和肺與胸膜用階段一定稿版）。**不可以用舊產生器覆蓋雙版面。**
2. 登錄進 `shared/materials.ts`，路徑格式照 `public/materials/<slug>-vN/index.html`。
3. 驗證：七份 verify 全部重跑（包含底圖確實畫出的檢查），加上 `npm run materials:validate-nodes`、`node --import tsx --test tests/material*.test.ts`、`npm run check`。

## 二、Excel（保留為本機紀錄）

`html/資訊圖表題庫_上傳用.xlsx` 從第 229 列起新增 77 列，規則照 `claude/呼吸資訊圖表規格（Codex）` 的 A1 第 8 點：單元一律填「呼吸系統」，次單元照七份對照表，其餘欄位比照既有列。既有 1–228 列逐格不變；「說明」分頁新增 7 列，合計改為 304 題。

## 三、直接寫入 Google Sheet（教師新指示）

目標試算表：**＜教師貼上 Google Sheet 網址＞**。分頁名稱＝課程代碼，也就是平台同步時讀取的那一頁（handoff 第 11 條）。

**授權**：用教師本人 Google 帳號的授權（你環境中已經可用的 Google Sheets 連線，或 `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/cloud-platform`）。金鑰、token 一律**不可以**寫進 repo 或文件。如果沒有可用的授權方式，就停下來，告訴教師要執行的那一行指令，等教師授權完再繼續。

**步驟**：
1. **先唯讀檢查**：讀出該分頁的表頭和所有題目 ID，對照 Excel 1–305 列，列出三種狀態的清單：
   (a) Sheet 已經有的
   (b) Excel 有、但 Sheet 沒有的。handoff 提到第 108–228 列還沒貼進 Sheet，要確認實際狀況
   (c) Sheet 有、但 Excel 沒有的。這類只列出來，**不要動**
2. **備份**：寫入前，先把整個分頁匯出成 CSV，存到 `docs/sheet-backups/<日期時間>-<分頁>.csv`。這份備份不要 commit，請加進 `.gitignore`；因為裡面可能有教師資料。
3. **只新增、不修改**：把 (b) 的列依 Excel 的順序附加到最後一列之後（包含這次的 77 題，以及 108–228 列中實際缺少的部分）。欄位**依表頭名稱對應**，不要依欄位位置對應；Sheet 有、但 Excel 沒有的欄位留空。題目 ID 欄設成純文字（`@`）。
   - 不可以修改、刪除、重新排序任何既有的列。
   - 如果某個題目 ID 已經存在，就**跳過不寫**，並記錄下來。
   - 表頭對不上時（Excel 有、但 Sheet 沒有的欄位）就停下來回報，不可以自行在 Sheet 新增欄位。
4. **寫入後驗證**：重新讀取分頁，確認：
   - 原本的列逐格不變
   - 新增列數等於 (b) 的數量
   - 77 題的 ID、正確答案代碼、次單元與 Excel 完全一致
   - 沒有重複的 ID
   把結果存成 `docs/respiratory-release/sheet-write-verification.json`。

## 四、交件

- `docs/respiratory-release/REPORT.md` 要寫：build 和登錄的結果；Excel 的列數；Sheet 寫入前後的列數、(a)(b)(c) 三份清單、跳過的 ID、備份檔路徑，以及一個可以直接點開的 Sheet 連結。
- 更新 `handoff.md` 和 `DEVELOPMENT_LOG.md`，結尾加 [Codex]。
- 本機 commit 一次（範圍：七份教材、`shared/materials.ts`、Excel、報告；排除 Sheet 備份）。不 push。
- 停下來交 Claude 驗收。教師之後再到平台後台按「同步」，並另行決定是否部署。

---

## 補充（11:50，教師裁定欄位對應；取代第三節第 3 步「表頭不符就停」）

目標：試算表 `1JU-XoFaDHYGcBqmlmcflUsHswUmMJXk39yETk9o3QPk`，分頁 `115-1-AP2`（sheetId 1633868463）。對應方式依 `shared/sheets.ts` 的別名，平台同步讀得到。

| Excel 欄 | 寫到 Sheet | 理由 |
|---|---|---|
| 問題 | **題目** | 同步的別名 |
| ③回頭選答案 | **③對答案** | 同步的別名 |
| 題序 | **序號** | 同步的別名 |
| 課程代碼 | 省略 | 同步時以分頁名稱當課程代碼 |
| 啟用 | 省略 | 空白即視為啟用；77 題全部啟用 |
| 題型 | 省略 | 空白即為單選；77 題都是四選一。若有任何一題不是單選，就停下回報 |
| 圖片網址 | 省略 | 77 題都沒有圖片。若有任何一題有圖片，就停下回報 |
| 講義標題、講義連結、補救資源 | **在表頭最右邊（「發布狀態」之後）新增這三欄** | 教師同意 |

**Sheet 才有的欄位**（題庫、年度、考點、圖層、圖中角色、認知層次、zuvio、primary卡、引用卡片、教師覆核註記、發布狀態）：比照分頁中既有資訊圖表題（例如 `blood-composition-*`）的填法。這些題目如果在某欄全部留空，新題也留空；如果全部填同一個值（例如「題庫」或「發布狀態」），新題也填那個值；如果填法不一致，就留空，並寫進報告。

**補齊舊題（教師同意）**：Sheet 中已有的 227 題資訊圖表題，依題目 ID 對應 Excel，**只把新增的三欄**（講義標題、講義連結、補救資源）填上 Excel 的值。這些列的其他欄位、另外 175 題非資訊圖表題，都**一格都不能動**。

**驗證要加的項目**：
- 寫入前的 CSV 備份必須涵蓋整個分頁，包括第 476 列以內的空白列。
- 寫入後回讀整個分頁，逐格比對：除了新增的三欄、新增的 77 列之外，其他每一格都必須和備份完全相同。
- 新增三欄中，227 題舊題的值必須和 Excel 一致；175 題非資訊圖表題必須留空。
- 77 題逐欄比對 Excel；「題目」「③對答案」「序號」三欄要依上面的對應表比對。

其他照原交辦執行（建置、Excel 第 229 列起新增 77 題、報告、本機 commit，不 push、不部署、不按同步）。
