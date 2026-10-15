# 呼吸七份部署計畫（2026-10-15；待 Claude 與教師確認）

**本輪只檢查與寫計畫，沒有合併、切換分支、commit、push、build、部署或平台同步。** 建議核可後，從最新 `origin/main` 建立獨立整合分支，合併呼吸兩個提交、處理六個衝突與氧曲線來源漏提交，再驗證並只發布 AP2 Pages。不要直接從目前根目錄執行部署腳本。

## 1. 已核實的版本與線上基準

| 項目 | 核實結果 |
|---|---|
| 工作分支／HEAD | `feature/respiratory-infographics`／`f541b296f17e352cacdddca09a161ee05a891af9` |
| 呼吸兩個提交 | `f71a45b`（建置、登錄、77題），`f541b29`（77題②定稿寫入） |
| 遠端 main | `8e61f58ff7d6a44feea85cc7ec98b4a3b1c5aa4d`，以 `git ls-remote --heads origin` 即時確認，等於本機 origin/main |
| 共同祖先 | `e8805f8`；main 獨有16個提交，呼吸分支獨有2個 |
| 程式版本 | 呼吸分支1.7.0，main及正式站已是1.9.0；整合後必須維持1.9.0 |
| 正式站基準 | 2026-10-15 13:43（Asia/Taipei）：version.json為1.9.0；心臟v2與guide為200；呼吸七頁全為404 |
| ②提問鏈驗收 | Claude已在 RESPIRATORY_RELEASE_CLAUDE_REVIEW.md 13:45節註記f541b29通過（此工作區文件尚有未提交更新） |

目前分支不包含最新main，不能快轉到正式main。直接比較兩個tip有924個檔案差異（含179個刪除路徑；Git另判定3個rename），這反映呼吸分支缺少後續主程式，不能把它當發布快照覆蓋main。以共同祖先比較，呼吸真正新增／修改的範圍是719個檔案，main後續改了214個檔案，交集恰為下列六個衝突。

證據：[部署預檢JSON](deployment-preflight.json)。模擬用 `git merge-tree --write-tree`，把新物件寫在 `/tmp/respiratory-deploy-plan/objects`，以唯讀alternate讀原repo；沒有改原repo的objects、refs、index或工作檔。這是**文字整合模擬**，尚未解衝突、編譯或跑整合測試。

## 2. 與其他分支的關係

以下「已在main」指提交祖先關係，不代表工作區未提交檔案已上線。衝突為**直接與呼吸HEAD模擬合併**的結果；已在main的分支不必再合併。

| 分支／位置 | SHA | main以外提交 | 與呼吸HEAD模擬 | 本輪處理 |
|---|---|---:|---|---|
| `feature/1.9.0-unify` | `7203513` | 1 | 6個衝突 | 本機只多7203513的3份發布證據文件；遠端同名分支等於main，不另合併 |
| `feature/heart-structure-v2` | `e08483f` | 0 | 乾淨 | e08483f已在main，不另合併 |
| `feature/material-kit` | `56d299f` | 0 | 乾淨 | 56d299f已在main，不另合併 |
| `feature/1.7.1-completion-board` | `ed08854` | 0 | 2個衝突 | 已在main；直接合舊分支只會碰交接／日誌，不必重合 |
| `feature/1.8.0-reflection` | `ec8947f` | 2 | 6個衝突 | 舊反思／MI分離歷史；主線已有統一功能，不另帶入舊分支 |
| `feature/micro-immuno-review` | `465c375` | 0 | 7個衝突 | 已在main；直接合會多出Excel衝突，不另合併 |
| `feature/blood-flow-routes` | `e8805f8` | 0 | 乾淨 | HEAD只是共同祖先；另有77筆未提交狀態，含widget與preview，本輪不納入 |

所有 `origin/*` 遠端追蹤分支也已確認為origin/main祖先；`mi/main`屬另一站，排除。其他尚非main祖先的本機分支也已模擬：

| 分支 | main以外提交 | 與呼吸HEAD的衝突 | 本輪處理 |
|---|---:|---|---|
| `codex/115-mi-assessments` | 23 | 同六個主要衝突 | MI專用，排除 |
| `deploy/115-MI-site` | 11 | 同六個主要衝突 | MI專用，排除 |
| `release/mi-1.9.0` | 30 | 同六個主要衝突 | MI專用，排除 |
| `fix/separate-115-MI-bank` | 1 | 同六個主要衝突 | MI專用，排除 |
| `feature/1.2.0-bank-import` | 1 | `apps-script/FillCourseAndUnit.gs` | 舊支線，排除 |
| `hotfix/1.5.1-practice-hint` | 1 | `handoff.md` | 舊支線，排除 |

其中MI專用分支不可為了消除衝突而整支合進AP2。其餘本機分支均已是main祖先，完整SHA與祖先判定在預檢JSON。工作區裡未追蹤的泌尿／體液、作圖工具、血流教材、私人備份與其他產物也不會因「合併已提交分支」而帶入；禁止使用 `git add -A` 或複製整個工作目錄。

## 3. 六個衝突的預定解法

| 檔案 | 整合規則 |
|---|---|
| `.gitignore` | 保留main的微免截圖忽略，加入呼吸的 `docs/sheet-backups/`；根目錄未提交的作圖工具忽略規則不混入 |
| `shared/materials.ts` | 保留main的 `ALL_MATERIAL_CATALOG`、`SITE`／`siteId()`／`miMaterialSlugs`、MI過濾與基底網址；只把七筆呼吸條目加進ALL目錄。不整檔選呼吸版，避免回退成AP2硬編碼 |
| `materials-src/kit/presentation.mjs` | 合併main兩筆微免色相與呼吸七筆色相，保留其餘palette函式與群組。不能選單一側而漏掉另一批 |
| `public/materials/README.md` | 先解登錄檔，再以 `VITE_SITE_ID=ap2 npm run materials:sync` 重生，保留main既有條目並加七份；這只同步本機教材目錄，不是平台題庫同步 |
| `DEVELOPMENT_LOG.md` | 保留兩邊歷史，版本行維持1.9.0；補本次整合與核准資訊 |
| `handoff.md` | 以main的1.9.0現況為基礎加入呼吸已驗收／待發布狀態，去掉舊1.7.0部署指令的現況含義，維持150行內 |

其他呼吸來源、SVG、底圖、七份HTML及建置腳本在此main基準下可自動整合；不表示已通過整合後功能驗證。使用一般merge保留兩個呼吸提交的追溯，不必另外合heart、material-kit或舊unify分支，也不需重演MI migration。

## 4. 部署會帶上的內容與必先處理項目

**相對現在正式main的新上線內容**：

- 七個 `public/materials/<slug>-v1/index.html`。呼吸桌機中文引線標籤、手機編號對照、R3底圖／寬度修正與氧曲線互動都已內嵌在HTML。
- `shared/materials.ts` 七筆登錄進入前端bundle，教師活動編輯器可選新教材；不會自行建立課程活動或執行題庫同步。
- `public/materials/README.md` 也在public，會一併公開更新。

**進repo但不由Vite直接發布到Pages**：Excel304題（含新77題與定稿②）、七份content、SVG／底圖與labels、產生器／verify、報告／截圖／交辦、忽略規則與交接。719檔中有496個檔案在 `docs/respiratory-screenshots/`，134個在 `materials-src/figures/`；不能把719檔都稱為網站功能修改。共享kit CSS新增的選擇器只套七份呼吸；palette增加七個slug；materials-build增加氧曲線載入。既有其他教材快照不重新產生。

**從main保留、會再次打包但已在線的功能**：1.7.1完成度看板與選看逾期修正、名冊換信箱同步修正、1.8反思、1.9測驗控制／前後測／課堂互動／兩站feature設定、學生guide與手機主畫面說明、MI兩份教材登錄及站別過濾、CI修正。這些來自main的16個後續提交，不能用呼吸1.7.0舊檔覆蓋。正確合併後，`src/`、`functions/`、規則／索引、VERSION／套件版本、Vite站別與Actions設定相對main應無新差異。

**必處理：氧曲線來源漏提交**。`materials-src/widgets/oxygen-curve.js` 目前是未追蹤檔，f541b29與origin/main都沒有；`scripts/materials-build.mjs` 卻以 `readFileSync` 直接讀它。乾淨checkout重建 `o2-co2-transport` 會缺檔；一般 `npm run check` 使用已產生HTML，無法揭露這點。現有來源的全文確實已內嵌在核可HTML，SHA256為 `d105171bd96c72f95a6652fe76b3c79970cafdc3505a54dcba6a1f7e9cd163a9`。核可執行階段須只補進這個來源原檔、納入本機commit並驗證可重建，不改曲線公式／門檻，也不把其他未追蹤檔帶進去。本輪只指出，尚未修補或提交。

本機根目錄另有未提交的Claude最終驗收註記、作圖ignore、含泌尿的全域review與大量其他檔案；現行deploy.sh會因不乾淨直接停下。使用獨立乾淨整合目錄保留它們，依檔案明確帶入呼吸最終驗收記錄與本計畫即可，不stash、不清除使用者工作。

## 5. 核可後才執行：合併與整合驗證

以下是**待確認指令，不是本輪執行紀錄**。建議branch `codex/respiratory-release-2026-10-15`；先重新確認remote未變，若變動須更新本計畫與衝突模擬。

```sh
cd '/Users/HHC/Documents/ChatGPT/課程平台1.0'
git fetch origin
# 目前核准main基準應為8e61f58；若不同先重新預檢
# 呼吸來源應仍為f541b29；若不同先重新預檢
git worktree add -b codex/respiratory-release-2026-10-15   '../課程平台1.0-respiratory-release' origin/main
cd '../課程平台1.0-respiratory-release'
git merge --no-ff --no-commit feature/respiratory-infographics
```

merge預期停在上列六個衝突；依第3節逐檔整合。補入上節同SHA的oxygen-curve.js、更新1.9.0交接／報告並只暫存明確範圍。保留七份核可HTML、七份content、Excel及其他既有教材的SHA作稽核；對合併結果做一次完整測試：

```sh
# 使用Node 22.23.2與AP2既有公開VITE環境變數，VITE_SITE_ID必須ap2
npm ci
npm --prefix functions ci
VITE_SITE_ID=ap2 npm run materials:sync
VITE_SITE_ID=ap2 npm run version:check
VITE_SITE_ID=ap2 npm run materials:validate-nodes
VITE_SITE_ID=ap2 node --import tsx --test tests/material*.test.ts
VITE_SITE_ID=ap2 npm run check
```

另在整合目錄的暫存複本，用七份現有content與圖層逐一 `npm run materials:preview <slug>` 證明來源齊全與重建相同；不要跑舊圖面產生器。七份HTML若與核可SHA不符，先查明並交Claude確認，不能直接替換；預期只因新增無關slug的palette資料，不應改七份輸出。跑七份 `node scripts/respiratory-labels-verify.mjs <slug> --audit-only`，重驗126狀態（含底圖、桌手機標籤與拆詞等），以及五份作答回歸 `node scripts/respiratory-kit-stage2-verify.mjs`。工具產出的截圖／稽核檔放暫存複本或獨立證據目錄，保留核可截圖。

核對 `dist/site.json` 的id為ap2、七份 `dist/materials/` 檔案SHA與核可快照一致、所有main既有public教材／guide／course-learning.js未變。檢查 `git diff origin/main`：除了呼吸允許範圍與本次文件，不得有其他網站功能、後端、規則、索引、版本回退或MI部署設定變更。完整check預期應以1.9.0測試集為準，不能沿用呼吸1.7.0的134／26測試數作為本輪通過證據。

最後以正常commit完成merge／必要補檔，訊息附 `[Codex]`，不用 `--no-verify`。保留一般merge兩邊歷史，部署前工作區必須乾淨；記下最終SHA與完整diff給Claude／教師確認。新增來源補檔與解衝突必須包含在最終已測SHA，不部署f541b29原tip。

## 6. 核可後才執行：部署指令與範圍

**建議：本次只推送AP2 Pages**。呼吸兩提交沒有Functions、規則或索引變動，正確整合後這些檔案也應與最新main相同。現行 `scripts/deploy.sh` 每次都會部署Functions再push main；本計畫建議經教師核可，採下面較小發布範圍。它與通用腳本不同，須一併確認，不能未經核可自行選擇。

```sh
# 以下在已驗證、乾淨的獨立整合目錄執行
set -euo pipefail
APPROVED_SHA='<待Claude與教師核准後填入完整SHA>'
RELEASE_BRANCH=$(git branch --show-current)
RELEASE_SHA=$(git rev-parse HEAD)
test "$RELEASE_SHA" = "$APPROVED_SHA"
test "$RELEASE_BRANCH" = codex/respiratory-release-2026-10-15
test -z "$(git status --porcelain)"
git fetch origin refs/heads/main:refs/remotes/origin/main
git merge-base --is-ancestor origin/main "$RELEASE_SHA"
# 確認此SHA就是測試、diff與教師核可的SHA，且main未變
# 先備份功能分支；不使用force
git push origin "$RELEASE_SHA:refs/heads/$RELEASE_BRANCH"
# 此步才觸發正式AP2 Pages；只在Claude與教師核可後執行
git push origin "$RELEASE_SHA:refs/heads/main"
```

main push會觸發 `.github/workflows/pages.yml`：Node22 → 兩端npm ci → AP2環境的npm run check → 上傳dist → Deploy Pages。等待該**最終SHA**的build及deploy兩job成功才算網站發布成功，不能以push成功代替。GitHub Actions由[此工作流程](https://github.com/albertchang1008-alt/115-1-AP2/actions/workflows/pages.yml)查看；本機未找到gh CLI，無須為本計畫安裝。

若教師要求仍用通用流程，改在同一乾淨整合目錄執行 `VITE_SITE_ID=ap2 bash scripts/deploy.sh`；它會再npm ci／check、推備份分支、對 `ap2-7ed91` 部署Functions、再push origin/main，且有互動確認。這會擴大到後端重部署，須明確核可；不可把兩套發布指令都連續執行。兩套皆不操作MI remote、不跑migration、不部署rules／indexes，不碰平台同步。

## 7. 上線後七頁驗證

| 教材 | 正式網址 | 本輪部署前基準 | 上線後必達 |
|---|---|---|---|
| 呼吸道的構造 | [開啟](https://albertchang1008-alt.github.io/115-1-AP2/materials/airway-structure-v1/index.html) | 404 | 200＋標題／17個ID／SHA一致 |
| 肺與胸膜 | [開啟](https://albertchang1008-alt.github.io/115-1-AP2/materials/lungs-pleura-v1/index.html) | 404 | 200＋標題／17個ID／SHA一致 |
| 肺通氣與呼吸力學 | [開啟](https://albertchang1008-alt.github.io/115-1-AP2/materials/breathing-mechanics-v1/index.html) | 404 | 200＋標題／17個ID／SHA一致 |
| 肺容積與肺功能 | [開啟](https://albertchang1008-alt.github.io/115-1-AP2/materials/lung-function-v1/index.html) | 404 | 200＋標題／17個ID／SHA一致 |
| 氣體交換 | [開啟](https://albertchang1008-alt.github.io/115-1-AP2/materials/gas-exchange-v1/index.html) | 404 | 200＋標題／17個ID／SHA一致 |
| 氧與二氧化碳的運輸 | [開啟](https://albertchang1008-alt.github.io/115-1-AP2/materials/o2-co2-transport-v1/index.html) | 404 | 200＋標題／17個ID／SHA一致 |
| 呼吸調節 | [開啟](https://albertchang1008-alt.github.io/115-1-AP2/materials/respiratory-control-v1/index.html) | 404 | 200＋標題／17個ID／SHA一致 |

[七頁預期SHA與ID分母](deployment-expected-materials.json)固定採f541b29已驗收HTML。部署後以HTTP GET逐頁確認不是404模板，無錯誤導向，標題及 `material-ids`（6節點＋11題）正確，內容SHA與核准版本相同；如核准整合時允許HTML變更，先更新此預期證據再發布。可執行：

```sh
# 在已發布的同一整合目錄執行；全部唯讀HTTP GET
python3 - <<'PYVERIFY'
import json, hashlib, urllib.request, re
from pathlib import Path
for x in json.loads(Path('docs/respiratory-release/deployment-expected-materials.json').read_text()):
    with urllib.request.urlopen(x['url'], timeout=30) as r:
        body=r.read()
        assert r.status == 200 and r.geturl() == x['url'], x['slug']
        ids=re.search(rb'<meta name="material-ids" content="([^"]+)"', body).group(1).decode().split(',')
        assert len(ids) == 17 and len(set(ids)) == 17, x['slug']
        assert sum('-node-' in ident for ident in ids) == 6, x['slug']
        assert sum('-q' in ident for ident in ids) == 11, x['slug']
        assert hashlib.sha256(body).hexdigest() == x['sha256'], x['slug']
        assert ('<title>'+x['title']+'</title>').encode() in body, x['slug']
        print('PASS', x['slug'], r.status)
PYVERIFY
```

HTTP與SHA通過後，瀏覽器在1280與390各看七頁：底圖確實出現，桌機直接中文標籤、手機對照表，三種狀態與節點切換正常；血紅素兩版底圖可見，力學桌機多格圖寬度符合R3，氧曲線滑桿／拖曳可運作，開發者錯誤及水平溢位為零。只用本機攔截SDK或既有隔離測試方式完成作答回歸，不對正式學生帳號製造作答資料。另抽查既有heart-structure-v2、guide首頁與手機主畫面說明、version.json仍1.9.0、site.json仍ap2。記錄Actions URL／SHA、七頁HTTP與SHA、桌手機截圖及錯誤檢查到發布驗證報告。

**保持平台未同步。** 教材上線檢查完成後交Claude／教師驗收，由教師另行決定題庫同步。網址可開啟與題庫／活動已同步是不同的結果，不在本計畫順便操作後台。

## 8. 失敗處理與本輪停點

- merge／測試／快照不符：停在本機，不push；保留原呼吸分支與其他工作區。main若新增提交，更新整合與重驗，不force。
- Actions失敗：記錄失敗步驟與SHA，不聲稱上線成功。Pages若未成功發布，先查仍在線的部署，不推定已回復。
- Pages已發布但驗證失敗：停止後台同步；另交核准的修正或revert計畫，正常commit／push，不reset或force。建議Pages-only路徑沒有後端變動需回滾。

本輪已完成唯讀分支／衝突／工作區／部署腳本與線上HTTP檢查，僅寫本計畫、JSON證據及交接／日誌。**停下交Claude與教師確認第3–6節（六衝突整合、來源漏提交補檔與Pages-only發布路徑），確認前不執行任何合併或部署。** [Codex]


## 核可後執行紀錄（停點一）

教師已核可Pages-only路徑，獨立整合與本機驗證見 [INTEGRATION_REPORT.md](INTEGRATION_REPORT.md)。實際worktree由Codex管理，與第5節示例路徑不同；尚未push／部署／同步。目錄同步命令須用已安裝tsx載入：`NODE_OPTIONS="--import tsx" VITE_SITE_ID=ap2 npm run materials:sync`。[Codex]
