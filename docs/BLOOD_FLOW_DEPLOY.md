# 給 Claude 的摘要

- #7 B3與#6h／#3整合完成：本機main工作樹.worktrees/snapshot-main，版本1.10.3；未push。
- 已合併b723d73c與7a85b9e4，快照206fc95c保留；合併提交0c0b0006／6eff35f5。
- PASS：整合後npm run check，前端／共用234、Functions77，全部通過，0 failed、0 skipped；版本與build通過。
- 11列貼上範本：docs/bank-fixes/BLOOD_FLOW_11_PASTE.tsv，無表頭，32欄，貼A748:AF758，序號86–96。
- PASS：既有23904格不變；正式解析器投影啟用748／停用9（底稿737／9），既有45次單元逐題不變。
- PASS：五欄字數／句型／粗體／重複、④人工關鍵詞、負例；編輯用語、選項字母、br均0。
- 偏離：五題情境題去掉看圖依賴，改為獨立題幹；ID、選項、答案位置沿用核可教材，教材本身不改。
- B4依教師本輪指示未做；須教師貼上及同步後才做platform preview，不apply。
- 抽查1：合併與版本；2：範本32欄及貼入位置；3：情境題獨立性；4：五欄及④核對表；5：解析器／0 skipped輸出。

## 2026-10-25 整合與版本決定

教師明確授權併入本機main；以206fc95c保留#3修正，再合併酸鹼b723d73c及血流分支7a85b9e4，均無衝突。
合併提交為0c0b0006、6eff35f5。根目錄仍在feature/respiratory-infographics，其他未提交工作不帶入main。
此輪將已核可的快照修補與教材整合成下一個可交付版本，沿用專案修補版號慣例升1.10.3，版本提交c6a21041。
在main工作樹執行npm run version:sync，更新VERSION、兩端及platform-mcp的package／lock、shared/version.ts、apps-script/version.gs、public/version.json及既有三份文件的版本行；沒有改交接規則或寫舊式週誌。
完整npm run check退出0：234／234前端及共用測試、77／77 Functions測試，失敗0、跳過0；版本一致1.10.3，TypeScript與Vite正式build通過。
origin/main仍為5c4704ce，沒有push、部署、同步或任何Sheet API操作。

## B3：11列貼上範本

底稿：根目錄docs/sheet-backups/課程平台1.0 - 115-1-AP2-10241645.csv（教師10/24 16:45匯入後下載，Claude已比對）。
底稿SHA256：62af69bd3e63420fe609f988bd6a7435aa06dfb40cf6349a28f5da96e09ef3b2。
共747列含表頭；既有746題，32欄。末列為Q4-42R，序號85。
範本只含新增11列，沒有表頭；352格，貼入A748:AF758，序號連續86–96，沒有重排或覆寫任何既有列。
範本SHA256：7061c692db21fe1f5ba6737c0e91e29143b61a5aeffd95350849a029fa2effa6。

分類沿用既有Chapter「心臟II」，新增Unit「血流路徑動畫」。保留教材11題的ID、選項順序與正解；不洗牌。
⑤與卡片欄依已核可教材節點reference及credits填寫，沒有自行新增知識或標記教師覆核。

### 32欄對照

| 欄 | 底稿表頭 | 本範本內容／用途 |
|---|---|---|
| A | 題庫 | 資訊圖表 |
| B | 序號 | 86–96，接續底稿末列85 |
| C | 題目ID | 核可教材原ID，與既有列無重複 |
| D | 年度 | 資訊圖表，沿用同來源年度慣例 |
| E | 單元 | 心臟II，既有Chapter |
| F | 次單元 | 血流路徑動畫，新Unit |
| G | 考點 | 對應六節點標題 |
| H | 圖層 | 留空，不依賴圖片圖層 |
| I | 圖中角色 | 留空，不依賴圖中角色 |
| J | 認知層次 | 留空，來源未指定認知層次 |
| K | zuvio | 留空，不預填Zuvio資料 |
| L | 題目 | 獨立可作答題幹；五題去掉看圖字樣 |
| M | 正確答案代碼 | 核可教材正解代碼A–D |
| N | Zuvio解答 | 對應1–4，與正解代碼一致 |
| O | 選項A | 原選項第1個，不洗牌 |
| P | 選項B | 原選項第2個，不洗牌 |
| Q | 選項C | 原選項第3個，不洗牌 |
| R | 選項D | 原選項第4個，不洗牌 |
| S | 解析 | 兩至四句，說明正解及主要迷思 |
| T | ①先想關鍵字 | 題幹線索＋引導，不洩完整正解 |
| U | ②提問鏈 | 兩至三步，統一→ |
| V | ③對答案 | 因為…，所以答案是「正解」 |
| W | ④一句話記憶 | 25字內記憶句，含人工指定關鍵詞，無句號 |
| X | ⑤追溯原子卡 | 核可主卡ID與節點reference課本頁碼 |
| Y | primary卡 | 核可教材credits對應主卡ID |
| Z | 引用卡片 | 同一張直接來源主卡ID |
| AA | 教師覆核註記 | 留空，不自行填教師覆核 |
| AB | 發布狀態 | 留空，不宣稱已發布 |
| AC | 講義標題 | 血流路徑動畫 |
| AD | 講義連結 | 正式教材blood-flow-routes-v1網址 |
| AE | 補救資源 | 留空，來源未指定補救連結 |
| AF | 啟用 | TRUE，11題貼上後可被同步；本輪未同步 |

### 教師貼上步驟（Claude核可後）

1. 開啟115-1-AP2分頁，確認目前最後有資料列仍為747，末列ID仍為Q4-42R、序號85；若有新增列先停，重新提供下載檔比對。
2. 在目前最後一列下方準備11個空白列；確認A748:AF758沒有既有資料，可先設純文字，保留ID與文字原樣。
3. 用文字編輯器開啟BLOOD_FLOW_11_PASTE.tsv，全選內容複製，點A748貼上；不要把表頭或報告一起貼入。
4. 確認11列、32欄分開對齊，序號86–96，AF為TRUE，M與N對應；若整行集中一格，先復原，再依定位字元分欄。
5. 教師確認貼上結果後再自行同步。本輪未寫Sheet、未同步；B4平台preview須等貼上與同步完成後另外執行。

### 逐題④人工核對及獨立題幹

| 新列 | ID | ④ | 指定關鍵詞 | 人工核對 |
|---|---|---|---|---|
| 748 | blood-flow-routes-foundation-q01 | 肺循環：右室出發，左房收回 | 肺循環 | 把肺循環起點與終點連起來，保留肺循環這個題幹關鍵詞。 PASS |
| 749 | blood-flow-routes-foundation-q02 | 主動脈弓分頭臂、左頸總與左鎖骨下 | 主動脈弓 | 口訣列出弓的三條直接分支，不把頭臂的下一級分支混入。 PASS |
| 750 | blood-flow-routes-foundation-q03 | 動脈導管把肺動脈血導向主動脈 | 動脈導管 | 寫出動脈導管的名稱及兩端連接方向。 PASS |
| 751 | blood-flow-routes-foundation-q04 | 兩條臍動脈，留下內側臍韌帶 | 內側臍韌帶 | 保留內側臍韌帶全名，並指明來源是成對的臍動脈。 PASS |
| 752 | blood-flow-routes-foundation-q05 | 前、中大腦動脈由頸內動脈分出 | 頸內動脈 | 保留頸內動脈名稱，連結前、中大腦動脈的來源。 PASS |
| 753 | blood-flow-routes-foundation-q06 | 前交通動脈牽起左右前大腦動脈 | 前交通動脈 | 以前交通動脈全名連接左右前大腦動脈。 PASS |
| 754 | blood-flow-routes-case-q01 | 肺靜脈帶充氧血，回到左心房 | 肺靜脈 | 寫出肺靜脈全名、充氧血與回流心房。 PASS |
| 755 | blood-flow-routes-case-q02 | 左頸總動脈直接接主動脈弓 | 左頸總動脈 | 以左頸總動脈全名提醒直接由主動脈弓分出。 PASS |
| 756 | blood-flow-routes-case-q03 | 胎兒卵圓孔，右房直通左房 | 卵圓孔 | 以卵圓孔全名與右房到左房的方向對照。 PASS |
| 757 | blood-flow-routes-case-q04 | 卵圓孔閉合，留下卵圓窩 | 卵圓孔 | 以卵圓孔閉合連結卵圓窩，沒有改成模糊代稱。 PASS |
| 758 | blood-flow-routes-case-q05 | 後交通動脈連頸內與後大腦動脈 | 後交通動脈 | 寫出後交通動脈全名與相連動脈，避免與前交通混淆。 PASS |

五題情境題的題幹調整（只改增列範本，正式互動教材不改）：

| ID | 教材原題幹 | 題庫獨立題幹 |
|---|---|---|
| blood-flow-routes-case-q01 | 【模型觀察】一滴血在肺泡周圍微血管取得氧後，接下來經哪條路徑回心臟？ | 一滴血在肺泡周圍微血管取得氧後，接下來經哪條路徑回心臟？ |
| blood-flow-routes-case-q02 | 【模型觀察】圖中左頸總動脈要接回哪個直接來源？ | 左頸總動脈直接由哪條血管分出？ |
| blood-flow-routes-case-q03 | 【模型觀察】胎兒一滴血由下腔靜脈入右心房，可經哪個開口直接到左心房？ | 胎兒一滴血由下腔靜脈入右心房，可經哪個開口直接到左心房？ |
| blood-flow-routes-case-q04 | 【模型觀察】出生後左心房壓力增高，使哪個構造閉合成卵圓窩？ | 出生後左心房壓力增高，使哪個構造閉合成卵圓窩？ |
| blood-flow-routes-case-q05 | 【模型觀察】腦底圖上一條血管連頸內動脈與後大腦動脈，這條連接是？ | 連接頸內動脈與後大腦動脈的血管是？ |

### 自檢與實際輸出

- Artifact Tool讀取CSV並建構11×32範本，再逐格回讀352格；獨立Python CSV reader核對實際TSV及本機投影，原747×32＝23904格全部相等，範圍外變更0，底稿SHA256不變。
- 五欄全部通過#35規格：①40字、②90字及箭頭步數、③因果句與完整正解、④25字及關鍵詞、解析150字及2–4句；粗體每欄最多2處，無br與選項字母，②③④無連續10字抄寫。
- ④另由check_bank_memory_keywords.py驗證11筆作者逐題核對、原文依據及6個正負例；缺關鍵詞、偽造依據、未核對與重複ID均會FAIL。
- 範本獨立檢查8個負例全部擋住：編輯用語、選項字母、br、④缺詞、答案、欄數、重複、範圍外變更。
- parseBankSheet對底稿及追加投影均PASS：啟用737→748，停用9→9；既有45次單元的完整解析資料逐題相等，新血流次單元11題、五欄均讀入。
- 新增題庫檔僅供人工貼上；沒有把投影CSV／整份題庫作為可匯入檔交出，避免覆蓋既有列。

交驗檔案：docs/bank-fixes/BLOOD_FLOW_11_PASTE.tsv、BLOOD_FLOW_11_CHECK.json、BLOOD_FLOW_11.json、BLOOD_FLOW_11_MEMORY_REVIEW.json；DRAFT為人工五欄原稿。
重現腳本：scripts/blood-flow-bank-template.mjs（使用bundled artifact-tool；執行時複製到有bundled node_modules連結的tmp目錄）、scripts/check-blood-flow-bank.py。
原始輸出、解析投影、parser程式與manifest：/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-25/blood-flow-integration，保留至2026-11-01。
本輪未重拍教材，10/24核可截圖仍保存至2026-10-31。
#7停-等Claude驗收範本與整合；#6h／#3保留教師驗收通過、等待教師後續push／部署的停點。

## 10/24 已驗收的教材與畫面證據

以下為Claude已通過的B1–B2紀錄；其中版本、工作分支及尚未併main的文字只描述10/24當時，現況以上方10/25整合為準。

## 來源與乾淨移植

來源為.worktrees/blood-flow-routes的BLOOD_FLOW_TRAIL_ARROWS_REPORT.md與_FIX_REPORT.md最後方案C。
原工作樹保留，不rebase其未提交工作；新分支直接從origin/main建立。
content.json、blood-flow.js／css、overview及node-01～06 SVG與最新來源一致，source-provenance.json附SHA256。
教材整合提交：a2ebb20c [Codex]；未push或併入main，保留Claude驗收點。
未帶入截圖、_old、node_modules、舊handoff或週誌。未移植會覆蓋正式呼吸／泌尿功能的舊共用檔。

正式build新增public/materials/blood-flow-routes-v1/index.html，並登錄shared/materials.ts及public/materials/README.md。
scripts/blood-flow-build-kit.mjs只在lab.widget為blood-flow時套用3項擴充；共用kit.js／css保持原樣。
materials-build.mjs保留approvedUrinary及oxygen-curve分派；presentation.mjs只新增血流色相。
驗證腳本沿用已驗收版，僅增加BLOOD_EVIDENCE_DIR，讓截圖／JSON可輸出repo外；素材與測試資料保持來源內容。

## 實際驗證

Node 22.23.2；Google Chrome；Noto Sans TC由本機Airiti Reader既有字型載入。
首次一般沙箱的Chromium遭程序權限阻擋，之後以允許本機Chrome的權限重跑，未跳過驗證。

```sh
npm run materials:build -- blood-flow-routes
npm run materials:validate-nodes
export BLOOD_EVIDENCE_DIR=/tmp/blood-flow-main/shots
node scripts/blood-flow-v2-verify.mjs
node scripts/blood-flow-trail-regression.mjs
node scripts/blood-flow-trail-dark-verify.mjs
node scripts/blood-flow-v2-audit-selftest.mjs
node scripts/blood-flow-v2-regression.mjs
npm run check
```

npm run check：234／234前端及共用測試、61／61 Functions測試，0 failed、0 skipped；tsc、版本1.10.2、正式build全過，exit 0。

一般136狀態為兩字型×兩尺寸；減少動態68與深色12，合計216狀態，全部PASS、pageerror 0。
11稽核反例與3個trail反例能擋錯；UI回歸每尺寸6次explore／nodeTime、11題、1次complete，動畫操作SDK事件0。

既有教材與1.10.2零變動：unchanged.json列出94檔SHA256與相等結果，包含既有教材HTML、src、VERSION／package與lock、共用kit。
materials:validate-nodes檢查既有21份學生教材、全部kit來源（包含新血流來源）及10份核可腳本版本；血流實際六節點另由UI回歸逐一打開驗證。

## 關鍵截圖與保存

截圖保存至2026-10-31。原始輸出與manifest：/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main。

| 狀態 | 390×900 | 1280×900 |
|---|---|---|
| 肺循環第4步 | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-pulmonary-step-04-390.png) | [桌面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-pulmonary-step-04-1280.png) |
| 體循環第6步 | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-systemic-step-06-390.png) | [桌面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-systemic-step-06-1280.png) |
| 出生後第2項 | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-fetal-after-step-02-390.png) | [桌面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-fetal-after-step-02-1280.png) |
