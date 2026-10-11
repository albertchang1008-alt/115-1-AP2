# 115-MI 微免教材正式交件報告

## 教師核可後正式交件（2026-10-11）

教師已核可兩份教材畫面，並授權正式 build、教材登錄、Excel 追加、完整 check 及本機 commit。本次平台版本仍為 1.7.0；分支為 `feature/micro-immuno-review`，基底 `e8805f8`。未 push、合併或部署，其他工作目錄未修改。

- `materials:build micro-bacteria-review`、`materials:build immuno-concepts-review` 與 `materials:sync` 成功。`shared/materials.ts` 與教材 README 各新增兩筆；細菌 6 節點／11 題、免疫 8 節點／11 題。截圖只存本機：docs/micro-immuno-review-screenshots/ 已排除版控；截圖集頁面須搭配本機檔案使用，repository／正式網站不提供截圖。教材內嵌教學圖照常保留。正式 HTML 的 SHA 與教師核可 preview 完全相同，既有 252 狀態／4 SDK 流程／46 標準 screenshots／140 張截圖集驗證適用同一份輸出。
- Excel「題庫」新增 **229–239 列：細菌；240–250 列：免疫**，各 6 先備＋5 情境，共 22 題，合計 249 題。題庫既有 1–228 列、說明既有 1–34 列原始 XML 逐列相同，原有值、公式、樣式、欄寬、凍結窗格與驗證設定保留；其他 ZIP parts 逐位元相同。
- 「說明」只追加 A35:B37：兩份來源與新的 249 題合計，原有 B23 的歷史合計 227 題保留。未指定單元代碼，沿用既有「單元＝次單元＝教材原標題」慣例；課程代碼留空供教師匯入時指定。Excel 選項僅循環換位，原文與正解不變；答案代碼與 Zuvio 序號同步映射，定稿 content.json 不改。解析及①～④欄使用核可 hint／node summary／explain，未新增醫學敘述或頁碼。
- 儲存後重新匯入 Artifact Tool，兩張工作表原有值逐格相同、新增 22 列逐格一致、無公式錯誤，新增題目及引導欄與來源合計已渲染檢視。[逐列保存與22題對照證據](micro-immuno-review/question-bank-verification.json)。
- **`npm run check` exit 0：前端 134／134、Functions 26／26，全數通過、0 fail、0 skipped；版本檢查與前後端 build 成功（後端 34 個入口可載入，未連雲端）。** [完整 check 紀錄](micro-immuno-review/full-check.txt)。
- 教師核可的唯一 kit 改動仍只有 hues 22／216；credits 僅核可形狀與 AI 署名。`protected-files.json` 是正式建置前的 preview 保護證據，Excel／catalog／README 已依本次授權更新，以本節及 question-bank-verification.json 為最新狀態。

### 星期一（2026-10-12）整合與上線建議——待教師決定，尚未執行

建議使用新分支 **`codex/release-1.7.1-micro-immuno`** 與獨立 worktree `.worktrees/release-1.7.1-micro-immuno`，從完成度看板 `ed08854` 開始，合併本次 `feature/micro-immuno-review` 及最新 `origin/main`。目前本機 `main`／`origin/main` 已為 `3f6d925`（名冊換信箱修正），不是舊交接的 dc8c045；看板尚未包含此修正，直接執行 deploy.sh 會被 ancestor 預檢擋下。

教師同意後，依序執行（此處僅列步驟）：

```sh
cd /Users/HHC/Documents/ChatGPT/課程平台1.0
git fetch origin refs/heads/main:refs/remotes/origin/main
git worktree add -b codex/release-1.7.1-micro-immuno .worktrees/release-1.7.1-micro-immuno ed08854
cd .worktrees/release-1.7.1-micro-immuno
git merge --no-ff feature/micro-immuno-review -m "merge: 整合微免教材與看板 [Codex]"
# 若交接／開發紀錄衝突，保留雙方功能與歷史並重寫現況；版本維持 1.7.1。
git merge --no-ff origin/main -m "merge: 納入最新正式分支修正 [Codex]"
# 若 src/App.tsx 衝突，保留完成度看板與名冊同步錯誤詳情兩項功能。
npm ci
npm --prefix functions ci
npm run materials:sync
npm run check
```

整合後核對兩份教材登錄、Excel 249 題、完成度看板與名冊同步修正；解決衝突與文件更新後 commit（結尾 [Codex]），確認乾淨工作目錄、VERSION／所有版本檔為 1.7.1，且 `git merge-base --is-ancestor main HEAD` 與 `git merge-base --is-ancestor origin/main HEAD` 均成功。保留兩個原 worktree；不納入尚待核可的呼吸／血流教材。

教師確認整合驗收與部署後，**從新 release worktree** 執行 `bash scripts/deploy.sh`。腳本會確認 Firebase 權限、再跑安裝與完整 check、備份分支、部署 Functions，再快轉 push origin/main 觸發 GitHub Pages；須看 GitHub Actions 成功、線上版本與教材可用，才算上線。不要從主目錄呼吸分支或未整合的看板 worktree 部署。教材部署成功後才由教師把新增 Excel 列追加至課程 Google Sheet，核對課程／單元代碼，再同步題庫與發布課程；本次沒有外部題庫上傳授權。


---

以下保留教師核可前的圖面驗證紀錄；其待核可／未正式建置狀態已由上方正式交件更新取代。

# 115-MI 微免總複習：第三輪複驗四點修正報告

2026-10-11｜平台版本1.7.0｜`feature/micro-immuno-review`｜HEAD `e8805f8`，未提交。

**四點修正已完成 preview＋shots，待 Claude 只複驗下列四點，再給教師看畫面。Claude 第三輪已通過醫學內容與錨點；本輪104個錨點、定稿內容、其他三張自繪SVG均保持不變。**

## 教師檢視入口

- [140張截圖集](micro-immuno-review-preview.html)：可切換兩份教材、390／1280、system-ui／Noto Sans CJK TC／Arial-sans-serif fallback、實驗室／節點／完整頁面。
- [細菌互動 preview](../public/materials/micro-bacteria-review-v1/index.html)／[免疫互動 preview](../public/materials/immuno-concepts-review-v1/index.html)
- 標準shots另有46張全頁圖（細菌24、免疫22）。

| 教材 | 節點 | 先備＋情境 | HTML大小 |
|---|---:|---:|---:|
| micro-bacteria-review | 6 | 6＋5 | 601,062 bytes（587.0 KiB） |
| immuno-concepts-review | 8 | 6＋5 | 722,749 bytes（705.8 KiB） |

## Claude此次只複驗四點

1. **圖例防裁切**：全部圖例以Noto Sans CJK TC量測≤1080（viewBox寬1200的90%），超過即在完整項目之間換行；每組單欄獨立段落，取消textLength擠字。三種字型、兩尺寸均無越界；實測Noto最寬圖例行 **1057.74**。B-N01人體細胞、I-N04骨髓系、I-N05抗原、I-N08 CD8行均已拆開。B-N01比例原文保留於最後一行。
2. **B-N02細胞質**：右下角圖像外、圖例區上方的白底小標籤，獨立一行。文字基線725，圖例首行800.5，三種字型均驗證細胞質字框底端與圖例字框頂端分開≥3單位，沒有與任何圖例同行。
3. **依圖例分組接續編號**：組內仍由左至右、由上至下。I-N04＝骨髓1–2→骨髓系3–8→淋巴系9–12→次級淋巴器官13–15；I-N01＝第一道防線1–2→第二道3–4→第三道5–6→病原7；I-N05＝抗原1–4→抗體5–8。I-N04淋巴系標題中心對準B／T／NK細胞列（x≈800），位置在B細胞上方；不再靠近淋巴結。其他圖維持區塊編號，I-N08右側CD8仍為該組第一項。
4. **B-N06 50S藥名留距**：藥名移至細菌外框左上側，巨環類／clindamycin保持分行。以4097個外框採樣點計算字框與外框最短距離，扣除外框與文字描邊；三種字型最小淨距 **23.03單位**，大於要求12。50S標題與上方文字亦通過間距檢查；單一核糖體與30S／50S指向保持不變。

- [四點專項檢查數值](micro-immuno-review/round4-four-point-checks.json)
- [教師核可錨點保留證明](micro-immuno-review/round4-anchor-preservation.json)：104個標籤文字、來源比例座標、偏移均與第三輪完全相同；染色／免疫曲線／抗體結構三張自繪SVG SHA亦不變。

## 全部檢查結果

- 三字型×兩尺寸×預設／冷色樣式 **252個SVG狀態全過**；越界、圖例字框／編號圓圈重疊、引線相交、水平溢位、pageerror／console error均0。
- 手機字≥**12.02px**，桌機字≥14px；字框最小距離 **3.36 viewBox單位**（門檻3）。圖例單欄、Noto90%寬度、分組編號順序、細胞質獨立列、淋巴標題位置、50S淨距≥12均有自動檢查。
- 點陣viewBox收緊為 **859–1305**，均≤原圖900×1.45。圖例列距65.5，原字級43.45不變；圖片與錨點維持原比例，只保留既有近白底部留白裁切及I-N03標題帶。
- 核糖體／IgM五Fc連環／IgA J鏈與分泌片接觸檢查全過；醫學圖面已由Claude第三輪核可，本次只改四點排版。
- SDK **4組完整DOM流程全過**：展開首次explore、停留nodeTime、每次answer、錯題回讀與重挑戰、全對最後一題才complete；實驗室／預測／時間軸不送學習事件。使用本機recorder，未連正式平台。
- 節點驗證與既有 **20／20測試**、標準shots24＋22、`git diff --check`通過；截圖集140張引用、三字型篩選與兩尺寸圖片載入檢查通過。

## 內容與範圍保護

- 兩份教師定稿JSON文字、題目、選項、答案、提示、解析、來源及頁碼均未改；preview mount payload與輸入一致。
- credits仍維持核可形狀：原物件各文字值以「｜」串成字串陣列，原文保留，追加「插圖由 AI（Gemini／ChatGPT）生成，經授課教師審訂（2026-10-10）」。未再新增內容。
- **經教師／Claude同意的唯一kit改動**仍為presentation.mjs hues新增 `'micro-bacteria-review':22`、`'immuno-concepts-review':216`。palette邏輯、其他kit、materials-build.mjs未改。
- 12張PNG仍為1200×900／quality80 WebP內嵌SVG，最大WebP 101,236 bytes、點陣SVG 141,069 bytes；不使用兩張COVER。manifest原有項目不變，僅新增16筆。
- [保護檔案證據](micro-immuno-review/protected-files.json)：Excel、shared/materials.ts、教材README與其他kit／建置程式保持HEAD內容。只改指定worktree與測試暫存檔，主目錄及其他worktree工作檔未改。
- 既有kit仍沒有真正深色主題；冷色是測試時設定既有data-theme，系統深色偏好截圖實際仍淺色。本輪未擴大kit範圍。

## 原始結果與重跑

- [252狀態、字框與SDK事件](micro-immuno-review/verification-results.json)／[截圖集檢查](micro-immuno-review/gallery-checks.json)
- [圖片與104個錨點](micro-immuno-review/figure-metadata.json)／[來源像素](micro-immuno-review/anchor-source-checks.json)／[本輪16圖SHA](micro-immuno-review/round4-asset-sha.json)
- [細菌shots](micro-immuno-review/micro-bacteria-review-shots-report.json)／[免疫shots](micro-immuno-review/immuno-concepts-review-shots-report.json)
- [20項測試](micro-immuno-review/material-tests.tap)／[節點文字驗證](micro-immuno-review/node-text-validation.txt)／[字型來源與SHA](micro-immuno-review/font-audit.json)

```sh
npm run materials:preview micro-bacteria-review
npm run materials:preview immuno-concepts-review
npm run materials:shots micro-bacteria-review
npm run materials:shots immuno-concepts-review
MI_CJK_FONT=/absolute/path/NotoSansCJKtc-Regular.otf node --experimental-strip-types scripts/micro-immuno-verify.mjs
python3 scripts/micro-immuno-gallery.py
node scripts/micro-immuno-gallery-verify.mjs
```

使用Node22.23.2、bundled Pillow Python。**仍停preview：未正式build、未寫Excel、未登錄、未commit／push／部署。** handoff與DEVELOPMENT_LOG已更新；下一步Claude只複驗上述四點、教師看畫面。
