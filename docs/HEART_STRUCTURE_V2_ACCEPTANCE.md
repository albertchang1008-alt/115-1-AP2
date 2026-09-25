# heart-structure-v2 驗收報告

日期：2026-09-25  
分支：`feature/heart-structure-v2`

## 結果

功能與版面驗收通過；題庫逐字比對未通過，原因是既有 `html/心臟構造.html` 原文與 Excel 已有差異。依規格第 2 節，未修改凍結的教材文字或題目。

## 自測紀錄

| 項目 | 結果 |
| --- | --- |
| Playwright 390px／1280px | 無 pageerror、console error 或水平捲動；圖檔背景資產載入成功 |
| 行動版高度 | 390px 為 2,983px，低於 4,500px |
| 節點 SVG | 最小實際字級 12px，符合至少 11px |
| 預設與探索事件 | 載入後 0 次 explore；依序點六節點得到 6 個不重複的 `heart-structure-node-01`～`06` explore 事件 |
| 11 題全對 | 11 個 `answer` 事件、1 個 `complete` 事件，並顯示通關畫面 |
| 第二關錯題 | 錯一題時 `complete` 為 0；實測 case-q04 回讀至 node-06。程式以題目 ID 對應 q01→05、q02→04、q03→01、q04→06、q05→02 |
| `npm run check` | 通過：前端 100 tests、前端建置、Functions build、Functions 15 tests |

截圖已保存於 [`docs/heart-structure-v2-screenshots/`](heart-structure-v2-screenshots/)：390px 與 1280px 各含 `header`、`lab`、`node-03`、`stage-2` 四張。

## 題庫比對例外（未修改）

以 `html/資訊圖表題庫_上傳用.xlsx` 的「題庫」工作表，依 11 個 `heart-structure-*` ID 比對：既有來源與 Excel 在所有題目都存在題幹前置序號或選項排列差異，且 11 題提示文字均不同。另有兩處解析文字差異：foundation-q05 的「及心室間隔前 2/3」與 Excel 的「與心室間隔」，以及 case-q01 的「及」與 Excel 的「與」。這些差異在本分支開始前即存在於來源檔；為遵守內容凍結，留待教師決定要以哪一份為準。

## 交付狀態

- 已建立正式頁面 `public/materials/heart-structure-v2/index.html` 與本地 assets。
- 已同步來源 `html/心臟構造.html`（SDK 路徑為來源頁所需的正式 URL；正式頁使用相對路徑）。
- 已登錄教材目錄並同步 `public/materials/README.md`。
- 未 push、未合併、未部署。待 Claude 驗收。
