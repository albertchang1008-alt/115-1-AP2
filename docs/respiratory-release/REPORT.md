# 呼吸七份發布報告（2026-10-15）

教師 11:50 欄位裁定已全部執行。七份完成正式建置與登錄，Excel 追加 77 題，Google Sheet 備份、補欄、補舊題與新增題完成，逐格回讀全過。本機以單一 release commit 交件（SHA 以 `git log -1` 為準），停下交 Claude 驗收；未 push、未部署、未按平台同步。版本維持 1.7.0。

## 教材與驗證

| 教材 slug | 節點／題目 | 1280／390 狀態檢查 |
|---|---|---|
| airway-structure | 6／11 | [18 狀態全過](verify-airway-structure.json) |
| lungs-pleura | 6／11 | [18 狀態全過](verify-lungs-pleura.json) |
| breathing-mechanics | 6／11 | [18 狀態全過](verify-breathing-mechanics.json) |
| lung-function | 6／11 | [18 狀態全過](verify-lung-function.json) |
| gas-exchange | 6／11 | [18 狀態全過](verify-gas-exchange.json) |
| o2-co2-transport | 6／11 | [18 狀態全過](verify-o2-co2-transport.json) |
| respiratory-control | 6／11 | [18 狀態全過](verify-respiratory-control.json) |

七份 `materials:build` 成功，登錄於 `shared/materials.ts` 與 `public/materials/README.md`。沿用已驗收的圖層，未以舊產生器重畫。所有 content.json、SVG、PNG、WebP、oxygen-curve.js 與其他教材相對開工快照均不變；呼吸道與肺／胸膜 HTML 因正式 build 更新，其餘五份 HTML 雜湊不變。[範圍比對](scope-integrity.json)

七份共 126 狀態（每份 9 × 兩尺寸）verify 全過，包含底圖實際畫出檢查。通用 verify 補上呼吸道 manifest 的舊欄位相容及可見底圖 viewport 尺寸推導。[建置紀錄](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/build.log.txt)、[節點 21／來源 15 稽核](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/node-audit.log.txt)、[materials 20 測試](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/material-tests.log.txt)、[完整 check](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/check.log.txt)：前端 134／Functions 26，零 skip，兩端編譯與版本檢查通過。[總驗證](verification-summary.json)

## Excel

`html/資訊圖表題庫_上傳用.xlsx` 的題庫第 229–305 列新增七份共 77 題，總計 304 題（含表頭 305 列）。題目 ID、選項順序、答案代碼、Zuvio 序號、解析、五段引導及教材連結依 content 寫入。全部啟用、四選一、無圖片。說明分頁追加第 35–41 列七份來源，B23 更新為 304 題。

既有 1–228 列共 5,472 儲存格的值、型別、樣式逐格不變；以 artifact-tool 編輯，合併時保留原 OOXML 舊列及其他 ZIP 成員。已視覺檢查追加列與原模板。[Excel 驗證](excel-verification.json)

## Google Sheet

[開啟 115-1-AP2 分頁](https://docs.google.com/spreadsheets/d/1JU-XoFaDHYGcBqmlmcflUsHswUmMJXk39yETk9o3QPk/edit#gid=1633868463)。使用已連線的學校 Google 帳號；未存入金鑰或 token。

| 比對分類 | 數量 | 處理 |
|---|---:|---|
| (a) Excel 舊題、Sheet 已有 | 227 | 跳過新增；只補新三欄 |
| (b) Excel 有、Sheet 缺少 | 77 | 按 Excel 順序追加至第 404–480 列 |
| (c) Sheet 有、Excel 沒有 | 175 | 原列與新三欄保持原值／空白 |

三份完整 ID 清單及跳過 ID 見 [sheet-write-verification.json](sheet-write-verification.json)，計畫與逐欄策略見 [sheet-plan-summary.json](sheet-plan-summary.json)。原 Excel 第 108–228 列實際早已在 Sheet，無須重寫。Sheet 402 → 479 題；含表頭有效列 403 → 480，最終格線 480 × 32。沒有重複 ID。

寫入前完整備份為 `docs/sheet-backups/2026-10-15-120508-before-115-1-AP2.csv`，涵蓋原分頁 476 列 × 29 欄，包括末端 73 空白列。SHA256：`b42cb18aac70d2bc047849983cb558d4219de563bc914c84ca80d0395283feb2`。另保留原生儲存格與回讀 JSON 及原 Excel 備份；整個備份目錄已忽略，不納入 commit。

在原 AB「發布狀態」後插入 AC「講義標題」、AD「講義連結」、AE「補救資源」，原 AC 空白欄保留到 AF。別名依裁定：問題→題目、③回頭選答案→③對答案、題序→序號；省略課程代碼／啟用／題型／圖片網址。題庫與年度均比照既有 227 題填「資訊圖表」；考點、圖層、圖中角色、認知層次、發布狀態皆空白；zuvio、primary卡、引用卡片、教師覆核註記填法不一致，依裁定留空（Zuvio解答仍完整對應）。

最初一個結構批次被自動審核拒絕，沒有執行；唯讀確認 AC 為空後改用「插入三欄」保留原欄，後續成功。共 14 個成功批次（結構與表頭 1、舊題 4、新題 8、追加列格式 1），每批資料回讀比對，再完整讀回 A1:AF480 的值／公式及原生格式、驗證、註記等欄位。原先 11,687 個受保護原生儲存格零差異，原空白 AC 對照 AF；227 題新欄與 Excel 一致，175 題新欄全空，77 題全部 31 欄逐格一致，題目 ID 全部為純文字 `@`。新增列沿用既有資訊圖表題格式並自動列高；Google Sheets 100% 畫面確認三欄表頭與第 404 列內容可讀。[完整寫後驗證](sheet-write-verification.json)

## 交接

交付本機 commit 一次；Sheet 備份、泌尿／體液素材及其他既有未提交工作排除。全域底圖審查檔只提交呼吸 28 筆，工作區其餘審查資料保留。Claude 下一步檢查七份登錄與教材、Excel 77 題、Sheet 欄位和回讀證據；教師另行決定平台同步與部署。[Codex]


## ②提問鏈改寫：階段二寫入（2026-10-15）

依 [Claude 審稿](chain-rewrite-claude-review.md) 已整句替換 `breathing-mechanics-foundation-q06` 與 `lung-function-case-q04`，其餘75題沿用草稿。77題重新檢查全部通過：每題2問、51–76字，以→串接且每句以？結尾；不含①原句、正解完整文字或完整題幹（含去標點正規化比對），台灣用詞／A2／數值出處與節點ID檢查全過。[定稿表](chain-rewrite-draft.md)、[草稿檢查](chain-rewrite-draft-verification.json)

| 目標 | 實際修改範圍 | 修改數 | 其他格比對 |
|---|---|---:|---|
| Excel「題庫」 | Q229:Q305（②提問鏈） | 77 | 7,325格值／型別／樣式不變；所有格樣式不變 |
| Sheet「115-1-AP2」 | U404:U480（②提問鏈） | 77 | 15,283格原生資料零差異；目標格格式／驗證等也不變 |

寫入前重新讀取原生儲存格，確認表頭、77個ID、欄位限制與即時值。Sheet 寫入前完整480×32分頁CSV備份：`docs/sheet-backups/20261015-052830-chain-rewrite-before-115-1-AP2.csv`（時間戳為UTC），SHA256 `4d2ff50f6741910c7392fb76831d20015fa2476bf89c3d9525182dbef13502af`。另存原生格式／公式／驗證／註記／富文字／chip與值JSON、原Excel及回讀快照；均放已忽略的 `docs/sheet-backups/`，不commit。

Excel 用 artifact-tool 寫入候選，再保留原OOXML，只置換77格的字串值；其餘9個ZIP成員逐位元一致，題庫XML除77個c元素外也逐位元一致。重新開啟最終Excel逐格比較，包含第1–228列及整份「說明」分頁皆不變，仍為304題。寫前SHA256 `f4263b222c24b3c404f5748276880ce89a5ee448603540e664e4862f63614a8e`，寫後 `04498f115cb3d512825ec01606282c633e308ff19b906297769df40861849215`。

Sheet 以單一原子批次 `updateCells`，僅 `fields: userEnteredValue` 更新U404:U480；沒有格式、列高、欄寬或結構寫入。寫後完整讀回A1:AF480，逐格比對值／公式、格式、驗證、註記、chip、富文字；恰好只有77格②的值改變，Sheet屬性不變，仍479題。逐題直接對照「最終Excel、Sheet回讀、定稿」77格完全一致。

已查看Excel原樣式與修改後兩段渲染，並在Google Sheets原生100%畫面核對U431、U446兩句定稿與換行。教材來源／圖檔／公開HTML／登錄等 751 檔雜湊不變；這輪只跑與77格資料修改相關的定稿、檔案保護及讀回檢查，未重新build教材。完整逐格驗證、77個ID與兩邊儲存格座標見 [階段二驗證](chain-rewrite-write-verification.json)。

`handoff.md`、`DEVELOPMENT_LOG.md` 已更新，本輪另做單一本機commit（以git log -1為準，父commit f71a45b）。停下交Claude驗收；未push、未部署、未按平台同步。[Codex]
