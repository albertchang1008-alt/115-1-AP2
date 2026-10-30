# #42 閱讀加大應急方案一：三份平台iframe樣張

## 給 Claude 的摘要

- 本輪：13:15方案的三份樣張PASS，停-等教師；未擴全面，不能合併main。
- 分支feature/readability，接31eb47fc；版號保持1.14.0；根目錄分支未切換。
- 改動：Player／FontSizePicker、SDK course-learning.js、readability-overlay.css、features型別／驗證／設定UI、iframe檢查器。
- 手機樣張：腎臟、呼吸道、心輸出量；390×844外框、opaque iframe、預設／特大386狀態，0問題、0流程錯誤。
- 原版同情境：193狀態、11644次問題，無流程錯誤。
- 測試：前端271／後端98 PASS、0 skipped；最後核心7項重跑全過；最終build／version:check PASS。
- npm run check閱讀門檻仍FAIL：{'materials': 17, 'pass': 2, 'fail': 15, 'screens': 4864, 'issues': 128849, 'staticIssues': 175, 'errors': 0}；沒有放行或跳過17份門檻。
- 保護：49份HTML SHA全不變、49份均有實際SDK script標籤；SDK學習佇列與事件程式原文不變。
- 偏離／待辦：教師明確決定後端保存另列#42b；本機設定可驗證，正式全班保存尚不可交驗收。
- 抽查1–3：下方三組截圖、sample/*-sandbox.json與*-events.json、preservation.json。
- 證據：/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay；截圖保存至2026-11-06。

## 真正的平台情境

檢查器現在以實際`src/Player.tsx`的HtmlMaterial與FontSizePicker建成隔離閱讀頁，iframe使用與正式平台相同的`sandbox="allow-scripts"`，不加allow-same-origin。原HTML由本機route原封不動回傳其HTTPS網址；SDK與overlay也以各自原網址載入本機內容，不用srcdoc、修改HTML、跨frame改DOM或在教材端讀localStorage。所有網路由本機route處理，不連正式API。

九個完整走訪（3份×目前／預設／特大）的sandbox證據均確認`self.origin="null"`、localStorage遭拒；字級由父頁實際Player送出。`display-prefs`固定protocolVersion=1，只含字級與overlay布林值，不帶學生身分。SDK只接受parent來源、指定版本、合法字級與布林值，重送不重複掛CSS；overlay:false清除標記、CSS與放大控制，字級變數仍保留。

即時更新涵蓋FontSizePicker同頁事件及跨頁storage事件；非互動教材也會送display-prefs。晚到ready仍讀取最新課程開關／排除設定；互動init、session／activity／material檢核與ack保持原流程，非互動教材不額外啟動互動context。

## 三份樣張的量測

外層390×844，沿用平台48px閱讀列，iframe內容高度796px。下列只列教材內容；既有平台其他學生畫面仍受原來的src靜態門檻約束。

| 教材 | 字級 | 狀態數 | 最小內文px | 最小選項px | 最小點擊高px | 結果／問題 |
|---|---|---:|---:|---:|---:|---|
| kidney-anatomy-v1 | 預設 | 90 | 17.00 | 17.00 | 44.00 | PASS／0 |
| kidney-anatomy-v1 | 特大 | 90 | 22.10 | 22.10 | 44.00 | PASS／0 |
| airway-structure-v1 | 預設 | 51 | 17.00 | 17.00 | 44.00 | PASS／0 |
| airway-structure-v1 | 特大 | 51 | 22.10 | 22.10 | 44.00 | PASS／0 |
| cardiac-output-v1 | 預設 | 52 | 17.00 | 17.00 | 44.00 | PASS／0 |
| cardiac-output-v1 | 特大 | 52 | 22.10 | 22.10 | 44.00 | PASS／0 |

所有字級、行高、點擊高、對比、裁字、水平溢出與選項重疊探針均0問題。SVG原標籤的位置不動，低於圖字門檻時須有可操作的放大替代；點陣圖沒有放大入口即列FAIL，並未用OCR臆測字級。螢幕閱讀器用的clip-path:inset(50%)表頭不算可見文字，新增判定避免把原生1px隱藏表頭誤報為裁字。

### 390寬截圖比較

每組均由真正Player截圖，保留原生教材文字。呼吸／心輸出量的「第一關過關」是先備六題最後一題答對；原生沒有獨立轉場卡，因此「轉場」截第二關第一題開啟的實際畫面，不另造教材內容。腎臟第一關保留圖與高低文字在回饋之前，圖面在既有220px捲動框內平移，不移動SVG座標。

| 教材／畫面 | 目前 | 閱讀加大預設 | 閱讀加大特大 |
|---|---|---|---|
| 腎臟／第1關作答 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-before-first-question.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-default-first-question.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-xlarge-first-question.png) |
| 腎臟／第1關過關 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-before-first-passed.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-default-first-passed.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-xlarge-first-passed.png) |
| 腎臟／轉場 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-before-transition.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-default-transition.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/kidney-anatomy-xlarge-transition.png) |
| 呼吸道／第1關作答 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-before-first-question.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-default-first-question.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-xlarge-first-question.png) |
| 呼吸道／第1關過關 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-before-first-passed.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-default-first-passed.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-xlarge-first-passed.png) |
| 呼吸道／轉場 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-before-transition.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-default-transition.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/airway-structure-xlarge-transition.png) |
| 心輸出量／第1關作答 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-before-first-question.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-default-first-question.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-xlarge-first-question.png) |
| 心輸出量／第1關過關 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-before-first-passed.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-default-first-passed.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-xlarge-first-passed.png) |
| 心輸出量／轉場 | [目前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-before-transition.png) | [預設](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-default-transition.png) | [特大](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-30/readability-overlay/sample/cardiac-output-xlarge-transition.png) |

其他開場、完整通關及放置圖面截圖也保存在sample目錄，共54張。

## 樣式與範圍控制

- 所有overlay規則都在html[data-readability="on"]之下，分apply-kit-script、learning-kit、other。沒有order、flex-direction、grid-row或grid-column重排；核心測試也驗證第一關圖面在文字區前方。手機必要時沿原DOM順序往下排，保留垂直捲動。
- SVG標籤只調可讀的顏色／白描邊，不改x、y、dx、dy、transform等座標。心輸出量比較圖的非當前柱狀由.25透明改為.8，仍較淡但文字可讀，沒有改數值。
- 另加獨立放大入口，放大圖內可捲動，關閉前後闖關狀態深度相同比對。放大不改原圖的DOM位置或操作處理器。
- Player的readabilitySampleVersions目前只允許三份套overlay，其餘仍不套；課程缺省開啟，但全課關閉或排除清單優先。教師核可前不移除這個樣張保護。
- 31eb47fc的三個opt-in檔已移除，舊readability-sample.mjs改指向新iframe樣張腳本；原先直接開HTML、讀教材localStorage的結果不再作平台驗收依據。
- 正式教材HTML、文字、題目ID／答案、reviewed卡、闖關判定、節點／題數均不改；不重建教材、不改勾班、不寫Sheet或Firestore。

## 學習事件與保存限制

九次完整走訪的事件均通過既有validateCapturedEvents：六節點explore、實際答錯／答對、題目ID合法、completed恰好一次；reduceLearning亦驗證完成。Player onSave完成回報每次恰好一次。證據是實際SDK→postMessage→Player預覽bridge→ack，非偽造完成狀態或直接塞資料。timer與事件排序受正常操作時間影響，沒有宣稱時間值相同。

preservation.json逐檔比較49份發布HTML與31eb47fc，changedHtml=0，並列每份SHA256及實際SDK script URL，未載SDK者0份。SDK原學習佇列／init／ack／事件方法與timer程式比對原文一致（只新增獨立display分支）。

教師已回覆「本輪先完成樣張，後端支援另列待辦」。因此只做前端欄位與共用型別／輸入驗證，**沒有改functions/src/index.ts中的saveCourse或bootstrap實作**：現行正式saveCourse只保存三種既有布林功能，bootstrap又以根features覆蓋草稿，不能宣稱新開關／排除已可保存給全班。另列#42b與CODEX_TASK_readability-settings-backend_2026-10-30.md，待教師另行安排；部署條件日後需包含該後端支援。

## 實際摘要輸出

```text
{"materials":17,"pass":2,"fail":15,"screens":4864,"issues":128849,"staticIssues":175,"errors":0}
npm run check: exit 1（閱讀門檻）
{"materials":3,"pass":3,"fail":0,"screens":386,"issues":0,"staticIssues":0,"errors":0}
三份樣張: exit 0
```

## 驗證指令與限制

```sh
npm run check
# 前端271、後端98、0 skipped；閱讀門檻FAIL，尚不能合併main
node --experimental-strip-types scripts/readability-overlay-sample.mjs --out /tmp/readability-overlay-evidence3
# after: 3 PASS，386狀態，0問題／0流程錯誤；九次完成事件各一次
npx tsx --test tests/readability.test.ts tests/readability-platform.test.ts
# 最終核心7/7、0 skipped（含晚到ready與原順序）
npm run build
# 最後修改後version:check 1.14.0、tsc及Vite PASS
```

完整輸出見npm-check.log、targeted-final.log、build-final.log、sample.log與gate/summary.json。17份門檻未過的項目仍會擋住npm run check；學生共用src與原kit的175處靜態宣告也未豁免。新版overlay本身已加入靜態檢查且沒有未縮放字級，另有全部選擇器作用範圍／不重排測試。其餘舊教材保留警告清單，本輪只抽一份心輸出量，不宣稱全數已好讀。

本輪沒有push、部署、合併main或寫正式資料。待教師核可三份畫面後，再另行授權擴全面與後端保存支援；17份四種組合及學生端規範全PASS前不交上線驗收。
