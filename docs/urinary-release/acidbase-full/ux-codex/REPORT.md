# 給 Claude 的摘要
- Antigravity 第二輪 `6598178` 獨立覆核 **FAIL**；原因與親檢 12 圖紀錄在 [CODEX_REVIEW.md](../ux-redo2/CODEX_REVIEW.md)。
- Codex 重做 N01／N05，再把相同圖上操作、就地回饋、下一步流程推至 N02／N03／N04／N06／一滴酸追蹤。
- 實作 commit：`4d41128`（codex/acidbase-full）；本機預覽：http://127.0.0.1:8783/。
- 六關與結尾均有 SVG；節點及補連結皆無 select，沒有底部分頁或錯誤彈窗；心智圖常駐右下角，逐關加連結。
- 驗證 PASS：指定畫面 42/42、八尺寸跑版 464/464、套件與回歸 28/28；npm check 前端 162/162、後端 61/61；全部 0 skipped。
- 內容 PASS：786 次原句核對、210 顯示欄位；題目／選項／診斷／原句資料及 canonical 心智圖與 6598178 逐位元相同。
- 偏離／處理：第二輪未過，沒有沿用其驗收結論；撤除圖面未掛核定引文的調節時間，沒有修改核定題目資料。
- 截圖：本目錄 shots/ 共 42 張，每張一句描述見下表；實測量測 UX_RESULTS.json，測試與雜湊 CHECK_RESULTS.json。
- 抽查至多五組：N01 手機配對；N05 雙箭頭與答案共同送出；N03 緩衝所在；N06 排銨與留鹼；結尾遮住右下角小圖。
- #6h 停-等教師；下一步「教師試用＋找 1–2 位學生試做」。無 push／部署／合併／Excel／reviewed 修改。

## 預覽與工作位置

[開啟本機預覽](http://127.0.0.1:8783/)；工作位置 `/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/acidbase-full`，分支 `codex/acidbase-full`。

```sh
PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH node scripts/acidbase-full-preview.mjs
```

服務僅綁定 127.0.0.1，目前已啟動。要從零試用，在預覽頁開發者工具執行：

```js
localStorage.removeItem('acidbase-full:2026-10-20-v1'); location.reload();
```

根目錄只同步本輪報告／證據並改自己的 #6h 列與週誌，實作留在指定工作樹。既有未追蹤的 apply9 測試圖片未納入本次 commit。

## 第二輪覆核與本輪處理

第二輪確已交件。Codex 親自開完其 12 張原截圖、重跑兩支驗證與既有測試，另以瀏覽器實際觸發錯題。原檢查數字雖為 464/464、25/25，但 N01 SVG 左欄占比只有桌面 36.8%／手機 48.3%，手機有效 SVG 字級最低約 7.2px，且答錯微題仍出現 modal。這些獨立量測在 [BASELINE_REVIEW.json](BASELINE_REVIEW.json)，舊測試輸出在 logs/baseline-*.txt。

先重做兩關、確認圖上配對與雙箭頭可直接修正後，再套用其餘關卡。新增回歸守門對第二輪原碼會失敗（2 PASS／1 FAIL）；本輪為 3/3 PASS。此為刻意保留的歷史紅色證據，不是交件版本仍有失敗。舊 SVG 字級檢查會略過 SVGElement，本輪補上 screen CTM 換算，並以故意縮小的 SVG 反例證實抓得出來。

## 介面與互動變更

- N01：SVG 血液示意、緩衝標記、肺與腎示意，先點標籤再點圖中空位；點已放標籤可取回。圖占左欄桌面約 84.1%、手機約 75.6%，超過 60%。預測仍用原有「能／不能」選項文字。
- N02：在 SVG 分數圖上選分子與分母；N03：在 SVG 示意中承接 H⁺，配對緩衝所在；選項內容保留原值。
- N04：肺部 SVG 上選有效 CO₂ 排出條件，再做原有方向預測；沒有用呼吸次數代替有效排 CO₂。
- N05：血液｜腎小管壁｜管液三欄，SVG 箭頭真正左右換向，點選時有 0.3 秒動態；兩箭頭與原微題答案整組判定，修正後保留圖面與下一步。
- N06：SVG 反應與尿端示意上先點 H⁺ 再點 NH₃；NH₄⁺ 去向與排銨／留鹼關係都在圖上選，保留原選項。
- 答錯時以圖上紅框和原診斷就地提示，已填內容保留；同一畫面可修正，不用彈窗。答對顯示「下一步 →」，有箭頭的正確圖播放流向；reduced-motion 靜態。
- 心智圖固定右下角，完成每關指定連結後增加一段；仍直接使用 canonical nodes／edges，沒有新增關聯作者檔。補連結逐條做，移除下拉選單。
- 一滴酸追蹤改為 SVG 上三個功能分支選項；結尾先同時遮住主圖與右下角小圖，提交正確後揭圖。此處不是同一顆酸先由肺再由腎排出；圖上未畫三分支依次運送的路徑。
- 底部五分頁 DOM 移除；名詞透過藍色詞語按鈕展開就地說明。錯題回讀後有「回到考核」按鈕，學生可用實際操作回到相反配對題重試。

SVG 負責示意輪廓、反應配置與流向；圖上控制採固定 14px 以上 HTML 疊層，避免手機 SVG viewBox 連文字一起縮小。示意圖不代表治療或數值模擬。

## 資料保護

`materials-src/acid-base-homeostasis/{full.json,apply.json,content.json}` 與 `docs/classroom/mindmap-relay/acidbase.relay.json` 均與 `6598178` 逐位元相同。題幹、選項、正解、診斷 feedback、引用逐字原句未改；[CHECK_RESULTS.json](CHECK_RESULTS.json) 有 SHA-256，回歸測試亦直接與 git 基準比對。

未改 full-model 的過關門檻、其他九份教材或凍結 lab 核心。沒有來源卡寫入、reviewed、教材登錄、Excel／Sheet、正式學習事件或部署操作。npm check 使用既有檢查鏈，包含前後端建置驗證；未執行教材 build／發布。

## 驗證與證據

| 項目 | 結果 | 證據 |
|---|---|---|
| 內容／reviewed 原句／學生畫面 | PASS，786 次引用、210 欄位、0 error | [content-check.json](content-check.json) |
| 兩尺寸六關＋結尾，前／錯／對 | 42/42 PASS | [UX_RESULTS.json](UX_RESULTS.json) |
| 八尺寸完整流程 | 464/464 PASS | [layout-results.json](layout/layout-results.json) |
| 既有套件＋新增回歸 | 28/28 PASS | [tests.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/logs/tests.txt) |
| npm run check | 前端 162/162、後端 61/61，型別／版本／既有建置全過 | [npm-check.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/logs/npm-check.txt) |
| 新守門先紅 | 舊碼 2 PASS／1 FAIL，0 skipped | [regression-red.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/logs/regression-red.txt) |
| select／modal／底部分頁 | 靜態命中 0；42 個畫面的實際 DOM 均 0 | [grep](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/GREP_RESULTS.txt)、[UX_RESULTS](UX_RESULTS.json) |

全部交件版本測試 0 failed、0 skipped。8 尺寸為 360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。量測包括越界、截字、字級（含 SVG 有效字級）、心智圖徽章遮字、JS error；42 個畫面另驗 SVG、右下角圖、錯誤保留輸入、可直接改正及下一步。截圖是 Playwright 視窗模擬，真實教師與學生使用感受留待下一步試做。

既有互動測試仍驗 N05 不可只對一條箭頭或只對答案、缺關卡／連結不能過關、雙層理由錯誤要回讀、重新載入保留門檻、重試換相反題、遮圖前不能提早完成、SDK complete 只送一次。自動化 helper 改用真實按鈕，不注入完成狀態；回讀重試也使用學生可見的回到考核按鈕。

可重跑（Node 22.23.2；於本工作樹）：

```sh
node scripts/acidbase-ux-check.mjs
node scripts/apply-layout-check.mjs materials-src/acid-base-homeostasis/full.json --out docs/urinary-release/acidbase-full/ux-codex/layout
node scripts/apply-content-check.mjs materials-src/acid-base-homeostasis/full.json --cards '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge' --progress '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl' --out docs/urinary-release/acidbase-full/ux-codex/content-check.json
node --test tests/apply-*.test.mjs tests/acidbase-*.test.mjs
npm run check
```

輸出存 logs/（只去掉行尾空白）；大型自含 checked-full.html 為可重生的暫存，不納入提交。親檢原第二輪 12 圖詳見覆核表；本輪另開圖檢視 N01 前／對、N02 錯、N03 前、N04 對、N05 錯／對、N06 前、結尾遮／揭等桌機與手機代表畫面，其餘由逐圖量測檢查。

## 逐張截圖與一句描述

### 1280×800

| 截圖 | 畫面描述 |
|---|---|
| [N01-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N01-before.png) | N01 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N01-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N01-wrong.png) | N01 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N01-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N01-right.png) | N01 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N02-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N02-before.png) | N02 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N02-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N02-wrong.png) | N02 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N02-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N02-right.png) | N02 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N03-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N03-before.png) | N03 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N03-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N03-wrong.png) | N03 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N03-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N03-right.png) | N03 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N04-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N04-before.png) | N04 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N04-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N04-wrong.png) | N04 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N04-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N04-right.png) | N04 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N05-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N05-before.png) | N05 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N05-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N05-wrong.png) | N05 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N05-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N05-right.png) | N05 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N06-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N06-before.png) | N06 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N06-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N06-wrong.png) | N06 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N06-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-N06-right.png) | N06 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [trace-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-trace-before.png) | 一滴酸追蹤作答前：完整關係圖與右下角小圖都遮住，保留三個功能分支的 SVG 選項。 |
| [trace-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-trace-wrong.png) | 一滴酸追蹤答錯：錯誤功能分支用紅框標出，原圖仍遮住，無彈窗。 |
| [trace-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/1280x800-trace-right.png) | 一滴酸追蹤答對：揭開完整心智圖，分開核對緩衝、肺、腎的功能，沒有重複排出同一顆酸。 |

### 390×844

| 截圖 | 畫面描述 |
|---|---|
| [N01-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N01-before.png) | N01 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N01-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N01-wrong.png) | N01 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N01-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N01-right.png) | N01 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N02-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N02-before.png) | N02 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N02-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N02-wrong.png) | N02 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N02-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N02-right.png) | N02 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N03-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N03-before.png) | N03 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N03-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N03-wrong.png) | N03 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N03-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N03-right.png) | N03 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N04-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N04-before.png) | N04 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N04-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N04-wrong.png) | N04 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N04-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N04-right.png) | N04 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N05-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N05-before.png) | N05 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N05-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N05-wrong.png) | N05 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N05-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N05-right.png) | N05 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [N06-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N06-before.png) | N06 作答前：SVG 示意與圖上按鈕可操作，右下角保留已完成連結。 |
| [N06-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N06-wrong.png) | N06 答錯：錯處紅框、診斷就地顯示，已輸入內容保留且無彈窗。 |
| [N06-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-N06-right.png) | N06 答對：操作圖保留正確狀態，顯示「下一步 →」。 |
| [trace-before](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-trace-before.png) | 一滴酸追蹤作答前：完整關係圖與右下角小圖都遮住，保留三個功能分支的 SVG 選項。 |
| [trace-wrong](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-trace-wrong.png) | 一滴酸追蹤答錯：錯誤功能分支用紅框標出，原圖仍遮住，無彈窗。 |
| [trace-right](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-codex/shots/390x844-trace-right.png) | 一滴酸追蹤答對：揭開完整心智圖，分開核對緩衝、肺、腎的功能，沒有重複排出同一顆酸。 |

## 交接停點

交由教師開預覽試用，找 1–2 位學生試做；請觀察學生是否理解配對／翻箭頭／紅框修正／下一步，以及遮圖後是否能說出三系統分工。這一輪不自行發布，測試通過不取代教師的畫面與教學驗收。
