# 給 Claude 的摘要
- 依「10/21 互動介面原則」①–⑥及交辦八項，完成六關＋結尾逐步引導；實作 commit `b19597b`，分支 `codex/acidbase-full`。
- 第1步完成前，答題題幹與選項不進 DOM；N05 改先翻兩箭頭，才出四選一，取代上一輪同時作答方式。
- 圖上方大字編號命令＋當前元件高亮；選好答案才亮送出，錯誤時重新亮起可修正處。
- N01 自動約3秒示範、復原後「換你了」及重播；功能格取 reviewed 卡逐字原句，不放器官名或器官圖示送答案。
- N05 箭頭直接可點，小字在旁且不蓋箭身；桌機第2步題目與選項放大；結尾三格依序亮起。
- 驗證 PASS：34/34 引導畫面、464/464 跑版、29/29 測試、npm check 前端162／後端61；全部0 skipped；789次原句核對。
- 新手自試：[NOVICE_SELF_TEST.md](NOVICE_SELF_TEST.md)，逐關只看截圖，曾遇卡點繼續修改，最終兩尺寸七段均「是」。
- 偏離：無；題目／選項／診斷資料與原句不改，四個保護檔與991c73b逐位元相同；新增功能格來源另存 guidance.json。
- 抽查最多五組：N01示範與功能格；N02配錯修正；N05第一步無四選一／箭頭完整；第2步只亮當前動作；結尾逐格引導。
- #6h 停-等Antigravity，下一步「新手試做覆核」；未push、部署、合併、改Excel或reviewed。

## 預覽與實作

[本機預覽](http://127.0.0.1:8783/)，工作位置 `/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/acidbase-full`。

```sh
PATH=/Users/HHC/.nvm/versions/node/v22.23.2/bin:$PATH node scripts/acidbase-full-preview.mjs
```

請用空白進度試新手流程；舊試用進度仍保留，需重試時可在此預覽頁開發者工具執行：

```js
localStorage.removeItem('acidbase-full:2026-10-20-v1'); location.reload();
```

修改檔：`materials-src/apply-kit/full.js`、`full.css`、`full-render.mjs`、`full-check.mjs`；新增作者資料 `materials-src/acid-base-homeostasis/guidance.json`；自動操作 helper 與既有 browser test 改走新流程；新增 `scripts/acidbase-guide-check.mjs` 與 `tests/acidbase-guide.test.mjs`。

## 逐條對照

| 交辦／原則 | 本輪實作與證據 |
|---|---|
| 1／① 一次一個動作 | 每關先做圖上操作，核對後才建立原題與選項 DOM；不是只停用按鈕。N05 四選一先前不存在；回歸測試逐關斷言。 |
| 2／② 上方大字編號指示 | 圖上方持續顯示當前命令，桌機20px／手機18px；刪除原底部操作小字。學科課本參考值保留。 |
| 3／③ 高亮下一步 | 指定目前的標籤、功能格、單一欄位或箭頭，其他暫時淡化並停用。點標籤後功能格一起亮，沒有直接暗示正確格。選完答案才亮送出；答錯則亮回錯處。 |
| 4／④ 首關示範 | N01 進入先示範點標籤→點功能格→標籤飛入，約3秒後歸位，顯示「換你了」。可重播，示範不送分。reduced-motion 不飛動但仍逐步顯示示範。 |
| 5／⑤ N01不送分 | 功能格改成下表的逐字原句片段，移除肺／腎圖案與器官名；標籤仍是原三系統。來源已納入 content-check。 |
| 6 N05箭頭不遮 | SVG 箭身有透明觸控區，可直接點／用鍵盤啟動；文字在旁邊，沒有大框覆住箭頭。初始不播放翻轉，點擊才0.3秒動畫，避免瞬間箭向與文字相反。 |
| 7 桌機右欄 | 第2步題幹22px、選項18px；手機保留可用空間，題幹18px、選項16px。題目出現後圖上操作鎖定並淡化。 |
| 8 結尾追蹤 | 先緩衝→再肺端→最後腎端，當下只亮一格；三格填完才亮提交。若答錯，只重新亮起錯的那格，能直接修正；主圖與右下角小圖保持遮住。 |
| ⑥ 新手試做 | 已逐關開啟兩尺寸第1步及第2步截圖，記錄「我知道要點哪裡嗎？」與理由；自試卡點與修正見 [紀錄](NOVICE_SELF_TEST.md)。 |

一個圖上操作若包含多個欄位，也拆成逐欄高亮。答題階段只有選項先亮，選定後才亮送出；指示同步改成「已選好，現在點送出」。既有微題與補連結同樣有目前動作的指示。上方進度與右下角心智圖保留。

## N01 功能格：uid＋逐字原句

這三段功能文字為卡片原句的連續片段，沒有自行改寫。檢查器要求卡片frontmatter與進度均reviewed、引用存在、格中文字包含於所引原句，且功能格不含器官名。學生畫面不顯示uid或來源原句。

| 功能格文字 | 卡 uid | 逐字原句 |
|---|---|---|
| 接收或釋放 H⁺ | `buffer-systems` | 緩衝系統以弱酸與其共軛鹼，接收或釋放 H⁺，減少血液與體液的 pH 波動。 |
| 增加 CO₂ 排出 | `acid-base-balance` | 碳酸系統以 HCO₃⁻/H₂CO₃ 比值影響 pH，課本 pH＝pKa＋log（鹼/酸），示例 6.1＋log（26/1.3）≈7.4。呼吸增加 CO₂ 排出可減酸；腎臟分泌 H⁺並回收 HCO₃⁻。 |
| 分泌 H⁺並回收 HCO₃⁻ | `acid-base-balance` | 碳酸系統以 HCO₃⁻/H₂CO₃ 比值影響 pH，課本 pH＝pKa＋log（鹼/酸），示例 6.1＋log（26/1.3）≈7.4。呼吸增加 CO₂ 排出可減酸；腎臟分泌 H⁺並回收 HCO₃⁻。 |

## 新手自試結果與資料保護

[逐關紀錄](NOVICE_SELF_TEST.md) 只依當下截圖的文字、高亮、淡化判斷，不用程式碼補足畫面缺失。N01至N06與結尾，1280／390皆能指出現在該點的元件。這是Codex自我試做；後續仍依交辦交Antigravity獨立做新手覆核。

自試曾有「否」，沒有直接交件：N05初始翻轉動畫會短暫顯示反向；選項和送出同時亮；N02配錯後高亮仍停在下一步；示範時重播按鈕誤亮。均修改後重拍、重試。N02配錯修正另外保留兩尺寸截圖。

`full.json`、`apply.json`、`content.json`、canonical `acidbase.relay.json` 與 `991c73b` 逐位元相同；題幹、選項、正解、診斷、原句資料未改。新增功能格單獨存 `guidance.json` 並走來源審核。過關模型未改；N05現在依本次明確裁定分先操作後答題，測試同步改驗這個門檻，沒有skip舊測試。

沒有改其他九份、根目錄呼吸實作、教師reviewed、版本或正式教材。根目錄只同步本輪報告與證據、更新自己的#6h列與週誌；既有未追蹤apply9測試圖片未加入提交。

## 驗證

| 檢查 | 結果 | 證據 |
|---|---|---|
| reviewed原句與學生畫面 | PASS，789次引用核對（原786＋功能格3），0錯誤 | [content-check.json](content-check.json) |
| 引導畫面 | 34/34 PASS | [GUIDE_RESULTS.json](GUIDE_RESULTS.json) |
| 八尺寸完整流程 | 464/464 PASS | [layout-results.json](layout/layout-results.json) |
| 套件與新手回歸 | 29/29 PASS，0 fail／skip | [tests.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/logs/tests.txt) |
| npm run check | 前端162/162、後端61/61及既有型別／版本／建置檢查PASS | [npm-check.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/logs/npm-check.txt) |
| 資料保護與驗證檔雜湊 | 四個保護檔不變；本次測試對應來源hash | [CHECK_RESULTS.json](CHECK_RESULTS.json) |

尺寸：360×667、390×844、414×896、768×1024、820×1180、1024×1366、1280×800、844×390。全部交件驗證0 skipped。跑版量測越界、截字、字級（含SVG實際縮放）、心智圖徽章遮字與JS錯誤。

新增新手回歸實際驗示範復原／重播均不送分、點標籤後三格亮起、逐關第1步無題目DOM、錯配分子分母能修正、N05是真SVG點擊而非遮箭頭的大按鈕、結尾後格停用與錯誤重選、reduced-motion。既有測試仍驗雙層理由、相反配對重試、回讀門檻、遮圖與complete僅一次。

```sh
node scripts/acidbase-guide-check.mjs
node scripts/apply-layout-check.mjs materials-src/acid-base-homeostasis/full.json --out docs/urinary-release/acidbase-full/ux-guide/layout
node scripts/apply-content-check.mjs materials-src/acid-base-homeostasis/full.json --cards '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge' --progress '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl' --out docs/urinary-release/acidbase-full/ux-guide/content-check.json
node --test tests/apply-*.test.mjs tests/acidbase-*.test.mjs
npm run check
```

npm check使用既有前後端檢查鏈；沒有教材build、登錄、發布、部署或Excel／Sheet寫入。大型自含預覽HTML由檢查器重生，不納入commit；logs僅去掉行尾空白。

## 截圖：每張一句描述

必要截圖26張（六關×兩步×兩尺寸＋示範兩張）；另附結尾三格6張與錯配修正2張，共34張。都在 `ux-guide/shots/`。

### 1280×800

| 截圖 | 畫面描述 |
|---|---|
| [N01-demo](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N01-demo.png) | N01 自動示範：上方說明點標籤、點功能格，標籤飛向功能格；學生尚未被要求答題。 |
| [N01-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N01-step1.png) | N01 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N01-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N01-step2.png) | N01 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N02-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N02-step1.png) | N02 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N02-repair](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N02-repair.png) | N02 圖上配錯後：分子格重新亮起，題目保持隱藏，可直接改正後繼續。 |
| [N02-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N02-step2.png) | N02 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N03-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N03-step1.png) | N03 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N03-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N03-step2.png) | N03 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N04-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N04-step1.png) | N04 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N04-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N04-step2.png) | N04 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N05-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N05-step1.png) | N05 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N05-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N05-step2.png) | N05 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N06-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N06-step1.png) | N06 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N06-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N06-step2.png) | N06 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [trace-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-trace-step1.png) | 結尾第1格：只亮緩衝判斷，後兩格暫時不能作答；完整圖與右下角小圖都遮住。 |
| [trace-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-trace-step2.png) | 結尾第2格：緩衝選定後，只亮肺端排出物。 |
| [trace-step3](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-trace-step3.png) | 結尾第3格：前兩格選定後，只亮腎端去向。 |

### 390×844

| 截圖 | 畫面描述 |
|---|---|
| [N01-demo](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N01-demo.png) | N01 自動示範：上方說明點標籤、點功能格，標籤飛向功能格；學生尚未被要求答題。 |
| [N01-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N01-step1.png) | N01 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N01-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N01-step2.png) | N01 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N02-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N02-step1.png) | N02 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N02-repair](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N02-repair.png) | N02 圖上配錯後：分子格重新亮起，題目保持隱藏，可直接改正後繼續。 |
| [N02-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N02-step2.png) | N02 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N03-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N03-step1.png) | N03 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N03-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N03-step2.png) | N03 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N04-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N04-step1.png) | N04 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N04-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N04-step2.png) | N04 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N05-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N05-step1.png) | N05 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N05-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N05-step2.png) | N05 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [N06-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N06-step1.png) | N06 第1步：只顯示圖上操作，上方命令指示與亮框指出現在要點哪裡，右側答題尚未出現。 |
| [N06-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N06-step2.png) | N06 第2步：完成圖上操作後才出現原題與原選項，圖面暫時淡化。 |
| [trace-step1](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-trace-step1.png) | 結尾第1格：只亮緩衝判斷，後兩格暫時不能作答；完整圖與右下角小圖都遮住。 |
| [trace-step2](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-trace-step2.png) | 結尾第2格：緩衝選定後，只亮肺端排出物。 |
| [trace-step3](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-trace-step3.png) | 結尾第3格：前兩格選定後，只亮腎端去向。 |

## 下一步

#6h停-等Antigravity，依 `ANTIGRAVITY_TASK_acidbase-novice-test_2026-10-21.md` 做「新手試做覆核」。請從空白進度出發，先只看畫面，若仍有不知道點哪裡的地方，記錄當下畫面與原因；本輪不代替獨立覆核或教師驗收。
