# 給 Claude 的摘要
- A：十份教材 149,267,299 → 12,657,567 bytes（減少 91.52%）；每份 456,678–1,712,487 bytes，全部 ≤3,000,000。
- 原圖與 SHA 保留；39 份核可 PNG 以固定 WebP 品質80產生衍生圖，48 次內嵌全部核對核可雜湊，錨點／尺寸／題目不變。
- PASS：十份 verify、SCRIPT_DIFF、content-check、126 題 answer-echo、80 流程／6552 畫面、2648 validEvent，無 skipped。
- PASS：乾淨分支 npm run check：前端217、Functions61、建置；來源最終輸出另附。
- B：`release/urinary-clean`，唯一父提交 `origin/main` ba41abbb；單一 squash。實際 commit／物件大小見 [release-proof.json](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/release-proof.json>)。
- 產品八目錄完全相同；固定發布訊息符合交辦，不 push、不按同步。
- 截圖／原始輸出共16,291項（含2個連結）移出並核對SHA，總4,898,094,493 bytes；未刪原分支或證據。
- 檔案：derived-images.mjs、derive-teacher-images.py、衍生manifest、十份正式HTML、基準fixture、CI、測試、ignore／handoff。
- 偏離：無。修補舊commit基準依賴、補型別及CI Chromium，維持原測試；Finder改寫一份.DS_Store的註記見manifest。
- 抽查（5）：過濾膜三層、腎元刻度、原圖SHA、80流程事件、乾淨提交物件量。

# 教材容量與圖片

依13:05教師補充先完成A，B不含驗收截圖。1 MB = 1,000,000 bytes，長邊上限1600px、不放大。
所有原圖實際長邊皆小於1600；因此39份衍生圖像素尺寸完全相同，長寬比／百分比錨點／裁切區／熱區均未改。
固定參數：Pillow12.3.0／libwebp1.6.0、WebP quality80、method6、lossless=false、exact=true、LANCZOS（本輪無需縮放）。
原始teacher-figures.json、raster PNG、原SVG、十份apply/full/content.json與9205d12e比對無差異。
來源SHA→衍生SHA、尺寸、品質完整保存在 `materials-src/figures/derived/manifest.json`。
content-check核對不可任改的manifest SHA、固定recipe、核可原圖路徑與SHA、衍生SHA、尺寸與覆蓋；本機另逐張重編碼，驗證bytes相等。
CI不依賴Pillow，不接受任意圖片。39份衍生檔合計6,766,536 bytes。酸鹼舊lab中的同一核可PNG也使用衍生檔，原SVG與原圖不覆蓋。

| 教材 | HTML前 bytes | HTML後 bytes | 圖片次數 | 前／後圖片base64占比 | 減少 |
|---|---:|---:|---:|---:|---:|
| kidney-anatomy | 18,044,280 | 1,355,606 | 6 | 99.19%／89.28% | 92.49% |
| nephron-circulation | 14,488,998 | 1,184,831 | 5 | 99.01%／87.87% | 91.82% |
| filtration-clearance | 16,546,012 | 1,419,493 | 5 | 99.13%／89.87% | 91.42% |
| tubular-handling | 9,185,845 | 885,464 | 3 | 98.45%／83.92% | 90.36% |
| urine-concentration | 20,886,365 | 1,712,487 | 6 | 99.32%／91.66% | 91.80% |
| urinary-route-micturition | 17,238,008 | 1,367,538 | 6 | 99.16%／89.38% | 92.07% |
| fluid-compartments | 4,949,124 | 456,678 | 2 | 96.12%／57.97% | 90.77% |
| water-sodium-regulation | 18,272,963 | 1,557,765 | 6 | 99.21%／90.75% | 91.48% |
| electrolyte-balance | 13,931,845 | 1,257,933 | 4 | 98.99%／88.76% | 90.97% |
| acid-base-homeostasis | 15,723,859 | 1,459,772 | 5 | 99.08%／90.05% | 90.72% |

各次內嵌的原始像素與位元組（相同圖重複內嵌仍逐次列出；HTML占比依base64長度計）：

| 教材／圖序 | 原始與衍生尺寸 px | PNG bytes | WebP bytes | 原SHA→衍生SHA（前12碼） |
|---|---|---:|---:|---|
| kidney-anatomy #1 | 1122×1402 | 2,483,066 | 179,944 | 4d0c9c41c9a9→95d200415862 |
| kidney-anatomy #2 | 1122×1402 | 2,120,792 | 135,564 | 5dbaf942116a→4df841fb01a3 |
| kidney-anatomy #3 | 1122×1402 | 2,120,792 | 135,564 | 5dbaf942116a→4df841fb01a3 |
| kidney-anatomy #4 | 1122×1402 | 2,250,172 | 137,326 | 273a708b8232→7335fb4c8c7a |
| kidney-anatomy #5 | 1122×1402 | 1,933,479 | 99,140 | 2170a8bd1650→40f452eb5a82 |
| kidney-anatomy #6 | 1122×1402 | 2,515,928 | 220,182 | 12ea9b21c5ae→de6675407042 |
| nephron-circulation #1 | 1122×1402 | 1,431,531 | 76,962 | b3a0e95a1409→daf70eb4ac79 |
| nephron-circulation #2 | 1198×1313 | 2,129,149 | 143,274 | 31c0148ba5b4→7d11add353ca |
| nephron-circulation #3 | 1122×1402 | 1,808,251 | 101,374 | 68d815ed4a22→bb0dc3736c04 |
| nephron-circulation #4 | 1122×1402 | 2,775,489 | 263,762 | f059e299b556→32eadc459d52 |
| nephron-circulation #5 | 1122×1402 | 2,614,571 | 195,492 | 6ae6d69b5dd7→bc593ebdc527 |
| filtration-clearance #1 | 1122×1402 | 2,248,176 | 172,536 | ab901c65e6f3→2c61a1d03829 |
| filtration-clearance #2 | 1536×1024 | 2,612,521 | 176,964 | bf49822cf332→dc61a3fceb55 |
| filtration-clearance #3 | 1254×1254 | 2,717,003 | 235,196 | 195d46d9f013→1aaa97e85cb6 |
| filtration-clearance #4 | 1122×1402 | 2,248,176 | 172,536 | ab901c65e6f3→2c61a1d03829 |
| filtration-clearance #5 | 1122×1402 | 2,475,824 | 199,578 | f35ad194ef9e→63facb2d9f40 |
| tubular-handling #1 | 1122×1402 | 1,633,362 | 107,366 | d4e5f7330759→12b7ef817f69 |
| tubular-handling #2 | 1122×1402 | 2,553,116 | 245,802 | 6c8f0df805aa→1a3abeed9fa7 |
| tubular-handling #3 | 1122×1402 | 2,596,119 | 204,140 | bddac3a6d1df→a64b5b1317f7 |
| urine-concentration #1 | 1086×1448 | 2,641,041 | 194,728 | fe6a1df64de1→83bd354ad4b5 |
| urine-concentration #2 | 1086×1448 | 2,641,041 | 194,728 | fe6a1df64de1→83bd354ad4b5 |
| urine-concentration #3 | 1086×1448 | 2,641,041 | 194,728 | fe6a1df64de1→83bd354ad4b5 |
| urine-concentration #4 | 1145×1374 | 2,352,411 | 203,552 | 8d6176b33bab→30348305e34a |
| urine-concentration #5 | 1086×1448 | 2,641,041 | 194,728 | fe6a1df64de1→83bd354ad4b5 |
| urine-concentration #6 | 1086×1448 | 2,641,041 | 194,728 | fe6a1df64de1→83bd354ad4b5 |
| urinary-route-micturition #1 | 1122×1402 | 2,070,871 | 130,944 | d9e66ae035fc→8c835287a909 |
| urinary-route-micturition #2 | 1122×1402 | 2,495,335 | 181,418 | 4606697afee3→3370480aeb5f |
| urinary-route-micturition #3 | 1122×1402 | 2,349,421 | 179,834 | fd9a45efffb1→b5ae748e5ed5 |
| urinary-route-micturition #4 | 1055×1493 | 2,451,140 | 193,004 | 3714cecc0e59→4a4d7d85bf85 |
| urinary-route-micturition #5 | 1122×1402 | 2,515,984 | 207,314 | 10f8ca26a0e2→1ea02a74be2c |
| urinary-route-micturition #6 | 1055×1491 | 936,812 | 24,198 | 7804d8d44ca9→07df073be78d |
| fluid-compartments #1 | 1086×1448 | 1,083,930 | 18,928 | 58965abd5783→263385e91cb5 |
| fluid-compartments #2 | 1254×1254 | 2,483,941 | 179,606 | 40ee546dcbd2→e8d8f34123b1 |
| water-sodium-regulation #1 | 1122×1402 | 2,142,131 | 175,590 | 349654f87ca0→5d82bf168298 |
| water-sodium-regulation #2 | 1122×1402 | 2,142,131 | 175,590 | 349654f87ca0→5d82bf168298 |
| water-sodium-regulation #3 | 1198×1313 | 2,640,000 | 203,140 | bc112855ea9f→1a4ffd14e63d |
| water-sodium-regulation #4 | 1122×1402 | 2,476,422 | 219,828 | ef293b2e782f→76cf5100a641 |
| water-sodium-regulation #5 | 1198×1313 | 2,147,683 | 121,866 | cb30ea18b0ed→7fd99855371a |
| water-sodium-regulation #6 | 1122×1402 | 2,048,284 | 164,236 | aedeb3a6726b→9ac0455b1e2c |
| electrolyte-balance #1 | 1122×1402 | 2,061,621 | 90,250 | 08e83ddf7cd4→1f25de6d6d63 |
| electrolyte-balance #2 | 1122×1402 | 2,878,320 | 266,146 | 02047e4d62d0→5ac91db92b3a |
| electrolyte-balance #3 | 1122×1402 | 2,742,292 | 230,762 | fd9e52dd3e0e→b8f729ac6647 |
| electrolyte-balance #4 | 1122×1402 | 2,660,653 | 250,290 | fa7242780cc2→25ef2804ccd7 |
| acid-base-homeostasis #1 | 1122×1402 | 2,131,863 | 174,766 | 12441ff2c296→0a09804dc7b2 |
| acid-base-homeostasis #2 | 1122×1402 | 2,688,006 | 237,486 | 9527c96eca56→ab44ddf79277 |
| acid-base-homeostasis #3 | 1122×1402 | 2,131,863 | 174,766 | 12441ff2c296→0a09804dc7b2 |
| acid-base-homeostasis #4 | 1122×1402 | 2,600,313 | 224,048 | 87df55559e75→9216030c7bba |
| acid-base-homeostasis #5 | 1122×1402 | 2,131,863 | 174,766 | 12441ff2c296→0a09804dc7b2 |

全SHA、原始／衍生尺寸與bytes：[images-before.json](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/plain-language-110/docs/urinary-release/clean-release/images-before.json>)、[images-after.json](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/plain-language-110/docs/urinary-release/clean-release/images-after.json>)。

## 其他教材只量測

教師舉例的10.8／5.9 MiB是本機教材目錄（含外部PNG）容量，並非HTML本身；本件沒有修改。

| 教材 | HTML bytes | 目錄 bytes | 外部PNG數 | PNG bytes |
|---|---:|---:|---:|---:|
| coronary-circulation-v1 | 77,364 | 11,352,557 | 5 | 11,275,193 |
| heart-structure-v2 | 76,059 | 6,170,071 | 3 | 6,094,012 |

詳細像素／大小／SHA與9205d12e無差異證明：[other-materials.json](</Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/plain-language-110/docs/urinary-release/clean-release/other-materials.json>)。

# 實拍：相同畫面前後

Chromium同流程，第1關與第2關細節，390×844與1280×800共12對／24張；等待排版穩定後截圖。
人工檢視過濾膜三層、腎臟標籤、腎元刻度；文字及細節可辨，標題與首圖位置尺寸前後完全相同。

| 教材／尺寸 | 開場底圖前／後 | 第二關細節前／後 |
|---|---|---|
| urine-concentration 390x844 | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/urine-concentration-390x844-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/urine-concentration-390x844-after.png>) | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/urine-concentration-390x844-detail-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/urine-concentration-390x844-detail-after.png>) |
| urine-concentration 1280x800 | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/urine-concentration-1280x800-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/urine-concentration-1280x800-after.png>) | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/urine-concentration-1280x800-detail-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/urine-concentration-1280x800-detail-after.png>) |
| kidney-anatomy 390x844 | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/kidney-anatomy-390x844-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/kidney-anatomy-390x844-after.png>) | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/kidney-anatomy-390x844-detail-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/kidney-anatomy-390x844-detail-after.png>) |
| kidney-anatomy 1280x800 | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/kidney-anatomy-1280x800-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/kidney-anatomy-1280x800-after.png>) | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/kidney-anatomy-1280x800-detail-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/kidney-anatomy-1280x800-detail-after.png>) |
| filtration-clearance 390x844 | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/filtration-clearance-390x844-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/filtration-clearance-390x844-after.png>) | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/filtration-clearance-390x844-detail-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/filtration-clearance-390x844-detail-after.png>) |
| filtration-clearance 1280x800 | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/filtration-clearance-1280x800-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/filtration-clearance-1280x800-after.png>) | [前](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/filtration-clearance-1280x800-detail-before.png>) ／ [後](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/comparison/filtration-clearance-1280x800-detail-after.png>) |

# 全部驗證：命令與實際輸出

以下命令在來源分支執行（Node22.23.2），`RELEASE_EVIDENCE` 設為本機外部 clean-release 資料夾。全部瀏覽器事件以唯讀攔截器驗證，沒有提交真實學生資料。

```sh
python3 scripts/derive-teacher-images.py --verify # 使用附Pillow12.3.0的Python
node --import tsx scripts/clean-release/content-browser-check.mjs
node --import tsx scripts/answer-echo-check.mjs
node --import tsx scripts/clean-release/verify-eight.mjs
node --import tsx scripts/clean-release/verify-ten.mjs
node --import tsx --test tests/derived-images.test.ts tests/teacher-figures.test.mjs
npm run check # 來源及乾淨工作樹各執行
```

實際彙整輸出：

```json
{"pass": true, "materials": 10, "embeddedImages": 48, "unapprovedImages": 0, "ordinaryRebuilt": 9, "acidFullRewritten": true, "viewports": 8, "materialViewportFlows": 80, "layoutCases": 6552, "events": 2648, "invalidEvents": 0}
{"pass":true,"questions":126,"flagged":2,"allowed":2,"unresolved":0}
{"pass": true, "mode": "verify", "images": 39, "derivedBytes": 6766536, "manifestSha256": "b391b9c0d6113e53a095a771a22850db06f41ce2b788837899134db6d5febceb", "recipe": {"maxLongEdge": 1600, "format": "WEBP", "quality": 80, "method": 6, "lossless": false, "exact": true, "resample": "LANCZOS", "upscale": false}}
```

八尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。
十份SCRIPT_DIFF各missing=0、changedOrExtra=0；content-check各PASS，事件2648筆 invalid=0、每份每尺寸completed=1。
選項與題幹距離仍由80流程原檢查逐畫面判定，所有畫面無溢出／裁切／小字；無略過。

| 實際原始輸出 | 位置 |
|---|---|
| 十份verify彙整 | [verify-ten.json](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/verify-ten.json>) |
| 逐份verify輸出 | [verify-ten.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/verify-ten.log>) |
| 80流程逐畫面輸出 | [eighty-flows.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/eighty-flows.log>) |
| 十份content-check | [content-check.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/content-check.log>) |
| 126題answer-echo | [clean-answer-echo.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/clean-answer-echo.log>) |
| 逐張固定參數重編碼 | [derive-verify.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/derive-verify.log>) |
| 衍生圖負例及原熱區測試（7/7） | [clean-derivative-tests.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/clean-derivative-tests.log>) |
| 來源最終npm run check | [source-final-npm-check.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/source-final-npm-check.log>) |
| 乾淨分支npm run check | [clean-npm-check.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/clean-npm-check.log>) |

乾淨分支完整命令exit0：前端217／217、Functions61／61，版本1.9.1一致，tsc＋Vite成功。
初次來源檢查前端217通過，但tsc指出兩個新mjs缺宣告；補d.mts與型別縮限後建置通過，再完整重跑來源與乾淨分支。原失敗輸出也保留，沒有跳過或刪除測試。

# 證據搬移與清單

只搬移，不刪資料。原路徑保留於日期目錄；來源工作樹以 `.worktrees/plain-language-110/` 區隔同名路徑。
報告.md與單檔<1MB JSON留在repo；圖片、影片、HTML、log、tap、CSV、Excel驗收輸出等原始檔都在外部。
產品題庫Excel `html/資訊圖表題庫_上傳用.xlsx` 保留，與來源完全相同；未修改Sheet。
原有報告共12,163個實際圖片／輸出連結改指外部路徑。

| 工作目錄 | docs搬移前 bytes | docs搬移後 bytes | 搬出一般檔案 | 搬出 bytes |
|---|---:|---:|---:|---:|
| 原根目錄 | 1,355,635,280 | 41,460,765 | 3,885 | 1,314,255,920 |
| plain-language-110 | 3,656,804,016 | 74,742,154 | 12,404 | 3,583,838,403 |

上表為搬移當下大小；後續新增本報告與小JSON會略增。兩邊docs圖片／影片均為0；乾淨分支版控docs圖片／影片亦為0。
另搬出2個既有node_modules符號連結，連結目標及其文字SHA亦列清單；總16,291項／4,898,094,493 bytes。
[完整 manifest.json](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/manifest.json>) 記錄來源、外部位置、bytes、SHA、搬移當下checkout commit。
[archive-verify.json](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/archive-verify.json>)：missing=0、SHA mismatch=0，全部外部檔案重讀核對。
唯一OS註記：Finder曾自動改寫一份.DS_Store；已用.preserved凍結，清單同列搬移當下與目前SHA；截圖及原始輸出無變動。
`.gitignore` 加入shots／verify／output與所有圖片影片、HTML／log等；未放行任何docs圖片。handoff固定規則已加入外存要求。

# 乾淨提交與可重跑性

來源保留在 `codex/plain-language-110`，`release/urinary-clean` 從origin/main ba41abbb建立，只有一個發布提交。
訊息完全為：`release: 泌尿＋體液十份教材、110題白話題庫、降費前端 [Codex]`。
兩邊產品目錄src、shared、functions、public、materials-src、scripts、tests、html完全一致，最終diff與精確容量見 [release-proof.json](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/clean-release/release-proof.json>)。
Git新增物件未壓縮容量約428 MB（<1 GB）；精確命令結果於提交後附在外部證明，避免報告本身SHA自我引用。

舊檢查的 `git show c8fb122` 改為逐byte取自該commit的94,557-byte固定基準，鎖SHA84285ceee8ef1cf8b061615b8e77d274caae71125ede1f1de4df0cd3f7bf7ce5。
原110題正例及額外修改stem／選項／正解／解析負例全部保留；新clone無需取得原分支歷史或截圖。
事件測試輸出改用os.tmpdir，CI補 `npx playwright install --with-deps chromium`，不需要外部證據目錄即可npm run check。
本機npm check沿用現有鎖檔依賴；GitHub workflow維持npm ci及functions npm ci，未執行雲端工作流程。

沒有push、同步、部署、合併main；教師／Claude審核後決定發布。佇列與週誌在原根目錄維護。
