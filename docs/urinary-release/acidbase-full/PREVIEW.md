# 給 Claude 的摘要
- 10/21 核可學生腳本逐字實作：[ux-script/REPORT.md](ux-script/REPORT.md)；[SCRIPT_DIFF](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/SCRIPT_DIFF.txt)。
- 10/21 先前逐步引導、首關示範與新手自試：見 [ux-guide/REPORT.md](ux-guide/REPORT.md)。
- 10/21 最新圖上互動重做與教師試用入口：見 [ux-codex/REPORT.md](ux-codex/REPORT.md)（下文保留原完整樣張紀錄）。
- 完成酸鹼 N01–N06、N05 圖與答案共同送出、內建 8 節點／11 連結心智圖、遮圖回想與揭圖。
- 預覽：http://127.0.0.1:8783/；分支 codex/acidbase-full；工作樹 .worktrees/acidbase-full。
- 來源 PASS：7 張 reviewed 卡，786 次原句核對（含原情境面板），0 錯誤；來源與 UID 不顯示於學生畫面。
- 跑版 PASS：完整樣張 464/464、原情境面板 24/24；互動與套件測試 25/25；npm check 前端 162/162、後端 61/61；全部 0 skipped。
- 相容 PASS：32 個受保護檔不變；另九份教材 18 個既有輸出逐位元相同。
- 差異：新增完整樣張 profile，三個渲染／檢查入口分流；僅新工作樹同步現行交接規則，程式版本未改。
- 證據：CHECK_RESULTS.json、content-check.json、FREEZE_COMPATIBILITY.json、LEGACY_PARITY.json；截圖見下表。
- 抽查（最多五組）：N05 原錯圖與真箭頭翻轉；N03 緩衝不等於排出；N04 有效排 CO₂；A/B 雙層重試門檻；手機圖面與結尾遮圖。
- 停點：#6h 停-等Antigravity，下一步 Antigravity 截圖覆核，再交 Claude 驗收；未 push、未部署、未登錄、未改 reviewed。

## 本機預覽與修改位置

預覽入口：[酸鹼完整樣張](http://127.0.0.1:8783/)。伺服器僅綁定 127.0.0.1，現在已啟動；重新啟動請在 `/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/acidbase-full` 執行：

```sh
PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH node scripts/acidbase-full-preview.mjs
```

分支 `codex/acidbase-full` 自 `a5773cc` 建立。實作位於該工作樹，根目錄僅放交件證據、更新本列佇列與週誌；根目錄呼吸分支及其他工作樹的既有未提交改動保留。

作者資料為 `materials-src/acid-base-homeostasis/full.json`。共用實作為 `materials-src/apply-kit/full-{model,render,check}.mjs`、`full.js`、`full.css`。原 `apply.json` 與教材 `content.json` 未改，原情境面板仍由既有套件產生。正式教材未替換，學習事件不寫正式登錄或成績。

預覽以 localStorage 保存進度；需要從零覆核時，在此預覽頁開發者工具執行：

```js
localStorage.removeItem('acidbase-full:2026-10-20-v1'); location.reload();
```

## 教學與互動

六關分別處理三系統分工、鹼酸比、緩衝、有效排 CO₂、腎排酸留鹼、排銨。每關先操作圖面，再答微題，再由學生補圖的指定連結；未完成不能進入正式題目。N05 預設明示「這是錯的圖」，學生點擊會同時翻轉左右箭頭與目的地，兩個去向與答案必須整組正確才接受。成功後保留修正圖供核對。

心智圖直接讀取 `docs/classroom/mindmap-relay/acidbase.relay.json` 的 nodes／edges；該檔與根目錄逐位元相同，沒有另建第二份關聯資料。學生循序補足 11 條連結，畫面不自由拖曳，8 個圖節點與六個教學關卡分開。收尾先遮圖，分別回想緩衝、肺、腎的功能分支，再揭圖核對；不把同一顆酸寫成先後排出兩次。

基礎題 6 題；第二關使用設計稿的 5 組 A/B 共 10 題，每輪每組抽一題、打散順序，固定 3 題雙層次與 2 題單層次。雙層次答案與理由都對才算正確。失誤後須回讀相關關卡，再換另一側配對題並重新排題；節點和基礎關保留。過關須六關圖任務／微題／連結完成、第二關全對與遮圖回想正確。SDK `complete` 僅送一次；測試以 spy 驗證既有 `window.CourseLearning` 介面，未連正式學生成績。

沿用凍結套件的一屏面板幾何與固定字級；完整樣張新增自身 CSS，所有受測學生文字至少 14px。圖面標籤採 HTML、↑↓ 採徽章；圖線接實際卡片邊界，徽章避讓文字；化學式不任意斷行。流向動畫遵守 reduced-motion 靜態呈現。手機及橫向空間以版面分配調整，不放大裁切圖。截圖是 Playwright 視窗模擬，後續仍由 Antigravity 作獨立畫面覆核。

情境只使用急診病人主線，未加入治療、藥物、程序或自行編造的容量／速度／病人數值。畫面上的 pH 與比值出自已核定資料。

## 來源與檢查器

核定設計稿為 `docs/urinary-release/DESIGN_ACIDBASE_FINAL.md`，與根目錄版本相同。7 張卡為 `acid-base-balance`、`buffer-systems`、`renal-acid-base-compensation`、`hypercapnia`、`abg-interpretation`、`respiratory-alkalosis`、`metabolic-alkalosis`。未採用未 reviewed 的 metabolic-acidosis 卡；相關判讀取 reviewed 的 ABG 原句。

[content-check.json](content-check.json) 列每個作者欄位的卡 UID、逐字原句與卡片行號；共 786 次原句出現核對，包含重複引用與舊情境面板，並非 786 條獨立知識。來源卡 frontmatter 與進度都須 reviewed，重複 UID、原句不存在均失敗。學生資料會去除 UID、quote、sources。

原檢查器對舊題目鎖定 `c8fb122`，本次核定設計稿要求新題池，因此新增 `acidbase-full-v1` 分流，以核定設計稿逐項比對新題幹／選項／答案／理由。原題目鎖定保留；完整樣張內嵌的舊情境面板也再跑原規則。壞原句、錯答案、缺 A/B、圖 ID 不合／覆蓋不全的反例均由測試證實會報錯，沒有 skip 或放寬舊 profile。

## 驗證結果

| 項目 | 結果與證據 |
|---|---|
| 內容＋原句＋學生畫面 | PASS，210 顯示欄位／786 次原句／7 張 reviewed 卡，錯誤 0；[結果](content-check.json) |
| 完整樣張 | 8 尺寸 × 58 狀態＝464/464 PASS；[原始量測](layout/layout-results.json) |
| 原凍結情境面板 | 8 尺寸 × 3 狀態＝24/24 PASS；[原始量測](frozen-lab/layout-results.json) |
| 套件與新增互動測試 | 25/25 PASS；[TAP](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/logs/apply-and-full-tests.txt) |
| npm run check | 前端 162/162、後端 61/61；版本、型別與既有建置檢查全過；[完整紀錄](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/logs/npm-check.txt) |
| 其他九份相容 | 18/18 lab／course 輸出逐位元相同；[證據](LEGACY_PARITY.json) |
| 凍結範圍 | 32 檔不變、3 入口新增 profile 分流；[逐檔 hash](FREEZE_COMPATIBILITY.json) |

全部 0 failed、0 skipped。尺寸為 360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。58 狀態涵蓋六關前／操作後／完成、圖面三階段、基礎題、10 題配對答案與雙層理由、錯題回讀、9 個名詞、遮圖與最終完成。檢查包括整頁與文字容器越界／截切、14px 下限、徽章遮住圖卡及 JavaScript 錯誤。

瀏覽器測試以實際點選完成：先試錯圖／缺先決條件／錯連結／錯理由，確認不能過關；確認遮圖不能取巧早送完成，重開保留回讀門檻，配對重試全換另一側，最後完整通過且完成事件只有一次。reduced-motion 另驗靜態。

可重跑命令（於本工作樹，Node 22.23.2）：

```sh
node scripts/apply-content-check.mjs materials-src/acid-base-homeostasis/full.json --cards '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge' --progress '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl' --out docs/urinary-release/acidbase-full/content-check.json
node scripts/apply-layout-check.mjs materials-src/acid-base-homeostasis/full.json --out docs/urinary-release/acidbase-full/layout
node scripts/apply-layout-check.mjs materials-src/acid-base-homeostasis/apply.json --out docs/urinary-release/acidbase-full/frozen-lab
node --test tests/apply-*.test.mjs tests/acidbase-full*.test.mjs
npm run check
```

上述 npm check 使用專案既有檢查鏈（包含前後端建置），沒有執行教材 build、登錄或發布。生成的大型自含預覽 HTML 不納入 commit；檢查器可重新產生，所有量測與截圖均隨交件保留。

## 截圖索引

完整樣張共 116 張，見 `layout/shots/`；下表列教師要求的主要畫面。每個關卡另外保留 `node-XX-after-task.png`，可核對已操作圖與尚未送出的微題。N05 修正後的箭頭尤其看此階段。

| 狀態 | 1280×800 | 390×844 |
|---|---|---|
| N01 作答前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-01-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-01-before.png) |
| N01 作答後 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-01-after.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-01-after.png) |
| N02 作答前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-02-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-02-before.png) |
| N02 作答後 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-02-after.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-02-after.png) |
| N03 作答前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-03-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-03-before.png) |
| N03 作答後 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-03-after.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-03-after.png) |
| N04 作答前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-04-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-04-before.png) |
| N04 作答後 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-04-after.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-04-after.png) |
| N05 作答前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-05-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-05-before.png) |
| N05 作答後 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-05-after.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-05-after.png) |
| N06 作答前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-06-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-06-before.png) |
| N06 作答後 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-06-after.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-06-after.png) |
| N05 翻轉圖核對 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-node-05-after-task.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-node-05-after-task.png) |
| 心智圖階段 1：2 連結 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-mindmap-stage-1.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-mindmap-stage-1.png) |
| 心智圖階段 3：4 連結 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-mindmap-stage-3.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-mindmap-stage-3.png) |
| 心智圖階段 6：11 連結 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-mindmap-stage-6.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-mindmap-stage-6.png) |
| 結尾遮圖回想 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-final-trace-covered.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-final-trace-covered.png) |
| 結尾揭圖／完成 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/1280x800-completed.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/layout/shots/390x844-completed.png) |

## 範圍差異與交接

既有凍結 CSS／JS、model、flow 與 FREEZE_MANIFEST 未改；`render.mjs`、`apply-content-check.mjs`、`apply-layout-check.mjs` 三個入口新增完整 profile 分流，逐檔新舊 hash 已揭露。其他九份資料與圖片不變，原渲染 lab／course 全部逐位元相同。

`a5773cc` 帶的是舊交接規則與舊版本敘述，本工作樹的 `AGENTS.md`、`CLAUDE.md`、`handoff.md` 已同步目前教師提供的規則。handoff 只在本工作樹同步規則與其既有 1.9.1 版本描述，解決既有版本檢查不一致；沒有改 VERSION、package 或應用程式版本，根目錄 handoff 未動。現況與週誌統一更新於原根目錄，不以工作樹舊佇列取代現況。

後續依 `ANTIGRAVITY_TASK_review-acidbase-full_2026-10-20.md` 先作獨立截圖覆核，再交 Claude；本輪不代替第二 AI 或教師驗收，不改卡片 reviewed。主動傳訊其他聊天、push、合併、部署、Excel／Sheet 皆未執行。
