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

## 第二輪（2026-09-25）

- 版面重構為「頁籤、閱讀提示、六張文字節點卡、單一情境實驗室大卡」，寬版六欄、窄版兩欄；大卡內依選取節點切換主圖、已選標示、完整解說與示意圖。
- 主圖對應節點 1～6 的瓣膜四格、冠狀總覽與傳導圖；舒張／收縮控制會改用瓣膜第 2／4 格。
- Playwright 390／1280：無 pageerror、console error、水平捲動；390px 高度 2,760px。行動版點節點 3 後等待動畫完成，主圖大卡頂端為 -0.3px；1280px 維持 scrollY 0。選取解說 SVG 最小 CSS 字級為 12px。
- `npm run check` 通過（前端 100 tests、前端與 Functions build、Functions 15 tests）。

## Claude 驗收（2026-09-25）

結論：**通過**（含 Claude 兩項修正）。

| 項目 | 結果 |
| --- | --- |
| 內容凍結 | 題目資料區塊與 `d69bad0` 來源逐字相同；頁面文字行無增刪 |
| 390／1280 | 無錯誤、無橫向捲動；390px 高 2,967px |
| 探索 | 載入 0 次；點 6 節點 6 次 |
| 通關 | 全對 11 answer、1 complete；第二關錯 1 題不送 complete，並顯示對應節點的回讀按鈕 |
| 解析重複字 | 未再出現「解析：解析」 |

Claude 修正：
1. 390px 情境實驗室圖被壓成直條（窄版沿用直向 400% 裁切，但素材是橫向四格）→ 窄版改橫向裁切，高 150px。
2. 節點導覽卡小圖內文字實際只有 5.8～6.4px → 導覽卡小圖隱藏文字（下方已有標題）。修正後節點示意圖最小 10.9px（1280px 為 13.5px）。

題庫同步：Excel 心臟構造 11 題講義改連 `heart-structure-v2`；foundation-q05、case-q01 解析改為教材原文（「及心室間隔前 2/3」）。Codex 列出的其餘差異（題號前綴、選項順序、Excel 無提示欄）屬預期，不需處理。

## Claude 驗收：第二輪（2026-09-25）

結論：**通過**（含 Claude 一項修正）。

- 版面已與 `cardiac-conduction-v2` 同結構：頁籤 → 閱讀提示 → 六張文字節點卡 → 單一情境實驗室大卡（主圖隨節點切換、已選標示、解說）；1280px 點節點不捲動，390px 點節點捲到實驗室大卡頂端。
- 內容凍結：題目資料與 `d69bad0` 逐字相同；頁面文字（含示意圖）無增刪，僅新增閱讀提示。
- 390／1280：無錯誤、無橫向捲動；載入 0 次 explore、點 6 節點 6 次；全對 1 complete、錯 1 題 0 complete 並顯示回讀按鈕。
- **未通過項目（規格 C）**：節點 3「上/下腔靜脈、冠狀竇注入」、節點 6「(Bundle of His)」「浦金埃氏纖維」「每分鐘自發產生 70~80 次動作電位…」仍超出方框；Codex 報告未附規格 F 要求的「文字在框內」自動檢查。
- Claude 修正：六個節點示意圖由 SVG 改為 HTML 方塊（文字與配色不變，可自動換行），傳導路徑窄版改 2×2；移除為放大 SVG 字而加的 CSS。修正後無文字溢框，`tests/material.test.ts` 12 項通過。
