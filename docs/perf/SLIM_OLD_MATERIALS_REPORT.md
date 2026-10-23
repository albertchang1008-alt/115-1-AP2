# 給 Claude 的摘要

- #32完成；只執行有效old-slim交辦，從origin/main 83e9d950開perf/slim-old-materials；版本維持1.10.0，不push／部署。
- 冠狀循環：11,352,557→846,224 bytes（11.35→0.85 MB）；心臟構造：6,170,071→397,027 bytes（6.17→0.40 MB）；合計減少92.9%。
- PASS：清理腳本預設dry-run，保存7天；4案測試通過，本次可刪0、實際刪0，未呼叫--apply。
- PASS：48份index與資源盤點，兩份教材8個PNG副本轉WebP；原始PNG仍在html/assets且SHA逐一相同。
- PASS：固定quality80／method6／長邊≤1600／不放大；重跑衍生圖逐byte可重現，manifest記來源與衍生SHA。
- PASS：兩份HTML正規化圖片路徑後逐byte等於基準；教材路徑、materialVersion、題目、節點、事件ID、CSS與其他邏輯不變。
- PASS：八尺寸×2份完整答題16流程、384事件逐筆validEvent、4組前後版面比對；npm check前端226／Functions61全過。
- 主要檔：scripts/prune-evidence.py、slim-old-materials.py、slim-old-materials-verify.mjs、兩份HTML／8張WebP、old-materials-manifest.json、handoff規則。
- 偏離／釐清：目前main的HTML已外部化圖片，單檔皆未超3MB；依實際整份資源大小處理交辦指定兩份，僅將圖片引用png改webp。
- 抽查5項：dry-run邊界、原圖SHA、HTML非圖片diff、兩份前後截圖、validEvent與完整check輸出。

## 保存期限與實作範圍

截圖保存至 **2026-10-30**。截圖及原始輸出均放repo外的日期資料夾；文字報告與小JSON／圖片來源manifest保留於repo。依早於今天減7天的嚴格日期比較，10/23只可列10/15及之前，10/16不列刪除；不靠檔案mtime。
本次沒有push、部署、發布、平台資料寫入、題庫修改或升版。根目錄既有大量其他未提交工作未納入本分支。

## A：證據清理

新增scripts/prune-evidence.py，只掃指定root直接一層YYYY-MM-DD資料夾；預設DRY-RUN，列日期、bytes／MB、manifest位置與commit。只有明確--apply才刪除當次清單，刪前重核inode與路徑，拒絕repo內／repo祖先／home／根目錄／symlink根目錄。
不追symlink，不刪非日期名稱或非法日期；無法讀取manifest時仍列unknown，不輸出可能含認證資料的原文。today採Asia/Taipei，可用--today覆核日期邊界。
4案：嚴格七日邊界＋未來／非法日期；manifest commit＋symlink不追蹤；CLI預設不刪；拒絕repo根目錄。測試只跑dry-run，沒有對真實或測試資料夾執行--apply。
handoff鐵則13改成保存7天及開工dry-run／之後apply留週誌，14新增報告保存期限與過期連結政策。本回合教師特別要求只列清單，故不執行刪除。

實際dry-run輸出：

~~~text
DRY-RUN root=/Users/HHC/Documents/ChatGPT/課程平台-驗收證據 today=2026-10-23 cutoff(exclusive)=2026-10-16
KEEP 2026-10-23 5019977384 bytes (5019.977 MB) commits=099df60d75e7c658333dece01d487b8b3e23a141,1c7ab2f67c339ae524d87c292eb0d261b8d28c75,9205d12e4c7abbdc6c54dd32d55d861f83ae2ee2,9e5383975c761a3e3200f4a3f1385f2b979a202e manifests=manifest-root.json,manifest-source.json,manifest.json,clean-release/manifest.json
IGNORED (not date folders or symlinks): .DS_Store, preview-status-ui-2026-10-23, urinary-platform-setup-2026-10-23
Eligible: 0 folders; 0 bytes (0.000 MB)
Deleted: 0
~~~

測試實際輸出：

~~~text
test_cli_default_is_non_destructive (test_prune_evidence.EvidenceTests) ... ok
test_manifest_commits_and_symlinks_never_followed (test_prune_evidence.EvidenceTests) ... ok
test_protected_repository_root_is_rejected (test_prune_evidence.EvidenceTests) ... ok
test_strict_seven_day_boundary_and_invalid_dates (test_prune_evidence.EvidenceTests) ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.082s

OK
~~~

## B：教材載入資源減肥

掃描全部48份public/materials/*/index.html，最大HTML為urine-concentration-v1的1,712,487 bytes；單檔沒有>3,000,000 bytes。兩份交辦點名教材已在乾淨發布版把點陣圖外部化，連同PNG資源才是原11.35／6.17 MB。其餘46份整份資源亦未超過3MB，完整盤點留在old-materials-manifest.json.inventoryBefore。

| 教材（路徑／版本不動） | HTML前→後 bytes | 全部資源前→後 bytes | 減少 |
|---|---:|---:|---:|
| coronary-circulation-v1 | 77,364→77,372 | 11,352,557→846,224 | 92.55% |
| heart-structure-v2 | 76,059→76,067 | 6,170,071→397,027 | 93.57% |

HTML增加每個引用1 byte（.png→.webp），但圖片總量大幅減少；表中全部資源含HTML與該資料夾所有assets，不是只挑已載入圖片計算。原本public/assets內8個PNG都是html/assets原圖的逐byte副本，現在改為8張WebP；原圖未刪未改，共7個唯一來源。
採與泌尿衍生相同參數：WebP quality80、method6、lossless=false、exact=true、LANCZOS、長邊≤1600、不放大；直式1448維持原尺寸，2172長條降為1600（整數尺寸四捨五入最多1pixel誤差）。不裁切／旋轉／改圖文，版面CSS不改。
manifest保存baseCommit、Pillow／libwebp版本、來源路徑與SHA、原尺寸／大小、衍生路徑與SHA、衍生尺寸／大小。scripts/slim-old-materials.py預設驗證；--write只供無manifest的首次生成，拒絕覆寫既有基準。
verify用git show讀原始HTML，只將列舉圖片引用換回原始PNG路徑，再逐byte比對；所有題目文字／陣列、節點／事件ID、CSS、判分與追蹤程式均因此維持原文。既有tests/material.test.ts僅把心臟圖檔名斷言改成webp，其餘斷言保留。

## 實際驗證與限制

- 兩份各八尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。
- 每尺寸：初始、六節點、時相切換、先備答錯再答對、六題先備、病例答錯→複習→重試、五題全對→completed；檢查圖片完成解碼、無水平溢位、無pageerror、無外部網路。
- 真實course-learning.js在本機攔截queue，384事件逐筆validEvent及reduceLearning通過；每流程6個唯一explore、11個診斷ID、錯／對答案與恰1個completed。沒有發送正式學習事件。
- 手機／電腦的4組origin/main與改後情境實驗室boundingBox完全相同，已視覺抽查兩份圖片與截圖。既有冠狀循環手機長條圖採直向背景裁切，基準截圖也相同；本次僅減肥，保留該版面行為，並未宣稱修好此既有顯示問題。
- 第一輪新增瀏覽器驗證在切圖後未等待解碼而誤判破圖，已補等待；同時校正測試取用既有shuffledOpts屬性。未改教材行為；首輪輸出保留browser-first.log。

npm run check實際摘要：

~~~text
# tests 226
# suites 0
# pass 226
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 213413.596084

# tests 61
# suites 0
# pass 61
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 539.456292
~~~

完整原始輸出與截圖：
[驗收證據資料夾](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials>)
- [npm-check.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/npm-check.log>)
- [browser.log](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/browser.log>)、[逐尺寸／事件結果](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/browser-results.json>)
- [衍生圖可重現輸出](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/derivatives-verify.log>)、[前後版面核對](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/before-after-layout.json>)
- 56張PNG：八尺寸每份initial／node6／completed共48張，加手機／電腦lab前後對照8張。

| 教材 | 手機減肥前 | 手機減肥後 | 電腦減肥後 |
|---|---|---|---|
| coronary-circulation-v1 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/coronary-circulation-v1-390-lab-before.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/coronary-circulation-v1-390-lab-after.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/coronary-circulation-v1-1280-lab-after.png>) |
| heart-structure-v2 | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/heart-structure-v2-390-lab-before.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/heart-structure-v2-390-lab-after.png>) | [截圖](</Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials/heart-structure-v2-1280-lab-after.png>) |

## 重跑指令

~~~sh
python3 scripts/prune-evidence.py
python3 -m unittest discover -s tests -p 'test_prune_evidence.py' -v
python3 scripts/slim-old-materials.py
SLIM_EVIDENCE='/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/slim-old-materials' node --import /Users/HHC/Documents/ChatGPT/課程平台1.0/node_modules/tsx/dist/loader.mjs scripts/slim-old-materials-verify.mjs
npm run check
~~~

收工：#32停-等Claude；本機commit [Codex]，不push；週誌與check_handoff依根目錄工具執行。
