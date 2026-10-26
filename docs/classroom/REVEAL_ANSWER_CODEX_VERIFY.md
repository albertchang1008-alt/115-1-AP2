# 給 Claude 的摘要
- #37，2026-10-26，受驗 `4bfcb8b4`／`feature/classroom-reveal`；以 `75f3b6af` 為底，版本 1.11.0；**只驗不修**。
- 結論：**6 項 PASS、2 項 FAIL**（教師設定按鈕、學生紀錄完整性），交回 Antigravity，不先交 Claude 最終驗收。
- 獨立 `npm run check`：前端 236／後端 78 全過、0 fail、0 skipped；`version:check` 通過 1.11.0。
- 指定 Firestore Emulator roundtrip 全過，另用獨立 demo 專案補測正常設定變更及 100 輪跨班資料，重現兩個缺口。
- F1：清空未公佈題目的 answerKeys 後，舊 `hasAnswerKey:true` 仍讓教師看到公佈鍵，按下才被後端拒絕。
- F2：紀錄先取全課程最近 100 輪才篩班級；加入 100 輪別班資料後，本班原有 1 輪已公佈紀錄回傳 0 輪。
- 正常公佈前不洩漏、closed 限制、快照冪等／不受改鍵影響、三態與排序回饋、跨生隔離等通過。
- 私有 8 題答案與核定大綱一致，解析各句出自相鄰答案頁；彩排／合併同步功能通過，22 份原私有頂層檔 SHA 未變。
- 偏離：無修碼；工作樹 handoff 指定佇列／週誌在原根目錄維護。另記錄彩排 Google Fonts 請求，不冒稱全程零外連。
- 抽查最多 5 項：F1、F2、check.log、UI 1440／390、answers-verified／key-sources。#37 改可做／Antigravity。

## 依據與範圍

開工確認工作樹 `/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/classroom-reveal`，分支 `feature/classroom-reveal`、HEAD `4bfcb8b4`，原始工作目錄乾淨。
已讀工作樹 handoff／AGENTS、原根目錄 handoff／AI_WORKFLOW_PLAN／CODEX_QUEUE／交辦檔，以及 DECISIONS 的 2026-10-26 21:15 甲案與原完成報告。
工作樹沒有 CODEX_QUEUE、交辦檔；依該 handoff 的明文指示，以原根目錄為唯一現況、週誌來源，未建立另一份佇列。

證據根：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal/`。
本輪獨立子目錄：**`codex-verify-4bfcb8b4/`**。下文證據檔名以此為根；**截圖保存至 2026-11-02**，證據未納入 git。
原 Antigravity 報告與證據保留；未將其 PASS 當成本輪結論。

## 八項核對（依教師本次清單編號）

| 項 | 判定 | 結果 |
|---|---|---|
| 1 答案分存、驗證、Rules | PASS | answerKeys 與 interactions 分別保存；11 組獨立 validator 檢查含非法 slide／field、choice／order、300／301 字、undefined 輸出與實際私有 8 題通過；預設 client deny，Emulator REST 直接讀答案文件回 403。 |
| 2 教師編輯與無答案鍵按鈕 | **FAIL** | 新建無鍵題不顯示按鈕、編輯保存正常；但既有輪次移除答案鍵後，過期 hasAnswerKey 仍顯示公佈鍵。F1 有後端與真實前端重現。 |
| 3 reveal 條件與快照 | PASS | open 拒絕、closed 才公佈、只記第一次、快照保存答案／解析；改答案鍵後已公佈輪次不變，指定 Emulator 實跑通過。 |
| 4 洩漏負向與學生回饋 | PASS | 正常 open／closed 未 reveal 不含 reveal／answer／explanation／judgement；已送出顯示等待老師公佈；公佈後三態、排序逐步 ✓✗、正解／解析／全班統計通過。 |
| 5 本班已公佈紀錄與隔離 | **FAIL** | 小量資料的時序與跨班／跨生隔離通過；但全課程 limit(100) 在篩班級／公佈前執行，會漏掉本班既有紀錄，未滿足「所有已公佈輪次」，見 F2。 |
| 6 成績／progress 等不變條件 | PASS | 新增寫入僅 classroomConfig／State／Rounds／responses；無 progress、passedAt、researchEvents 或成績更新路徑。單元測試、Emulator progress 空集合與舊輪次測試通過；interactions 格式未改。 |
| 7 私有 8 題與工具 | PASS（同步功能） | 8 題 choice／order 正解對上核定大綱，解析 60–134 字、各句均出自答案頁正解／重點欄；雙單元 choice／order 彩排、紀錄與答案鍵合併／衝突停止實頁通過。另見外部字型現況。 |
| 8 版本、完整 check、Emulator、截圖 | PASS | 1.11.0 一致；完整 check 236＋78、0 fail／0 skipped；指定 Emulator 完整一輪 exit 0；另獨立跑 1440／390 真實 UI，無水平溢位、無 pageerror；原 16 張證據已核對。 |

## F1：移除答案鍵後仍顯示「公佈答案」（規格 2）

**位置**：`functions/src/classroom.ts:390`（decorate）、`:392`（hasKey），以及 `src/ClassroomInteraction.tsx:718`／`:945` 的顯示判斷。

獨立 Emulator 使用合成 choice 題，依正常操作：保存題目及合法答案鍵→開題→收題→保存 `answerKeys:{}`→讀教師 report。
實際 `getClassroomConfig.answerKeys` 已空，但 report 仍 `hasAnswerKey:true`；呼叫 reveal 被後端以「此題尚未設定答案與解析」拒絕。
真實 TeacherInteraction 使用相同回傳狀態掛載，確認仍有 **1 個「公佈答案」按鈕**，不是僅由原碼推測。

原因：report 將已存輪次 `r.hasAnswerKey` 與當前可用鍵做 OR；前端又以同旗標顯示按鈕，舊旗標不會因鍵移除或失效而變 false。
本題尚未 reveal；不是要求移除已公佈快照或隱藏合法的「已公佈」狀態。

證據：`extra-emulator.json` 的 staleAnswerKey 三值皆 true、`stale-ui.json`、`stale-answer-key-button.png`。

**退修驗收**：未公佈輪次的按鈕須依目前真正可公佈的合法鍵決定。補鍵刪除／鍵失效後按鈕消失、重新保存合法鍵後出現；已公佈快照仍保持不變的回歸測試。

## F2：其他班級新輪次使本班舊紀錄消失（規格 5）

**位置**：`functions/src/classroom.ts:316` 先 `.orderBy('openedAt','desc').limit(100)`，`:317–319` 才篩本班及 reveal；前端沒有游標或載入更早紀錄。

獨立 Emulator 正常建立 A 班 1 輪並公佈，學生 A 查 history 得 1 輪。再建立 100 輪較新的 B 班已公佈合成資料，A 班原有輪次仍在資料庫、班級與公佈狀態皆未變，學生 A 再查得到 **0 輪**。

證據：`extra-emulator.json`：`ownRevealedBefore:1`、`ownRevealedAfter100OtherClassRounds:0`；`extra-emulator.cjs` 可在獨立 demo Emulator 重跑。
這是查詢範圍造成的漏紀錄，沒有跨班答案外洩；亦不只是「超過 100 輪時只保留最近本班紀錄」，因其他班輪次就能完全擠掉本班資料。

**退修驗收**：依所屬班級／已公佈條件正確取得全部紀錄，或提供可用且完整的分頁，不能先全課程截斷再篩選。補 100 輪別班資料與本班超過 100 輪測試，維持個人作答隔離與時間順序。

## 獨立執行紀錄

在指定工作樹執行，Node 22.23.2 路徑加入 PATH：

```sh
npm run version:check
npm run check
firebase emulators:exec --project demo-codex-reveal37 --config /private/tmp/reveal37-verify/firebase.json --only firestore 'node functions/scripts/verify-classroom-reveal-emulator.cjs'
node scripts/classroom-reveal-verify.mjs /private/tmp/reveal37-verify/ui
```

- `version.log`：版本一致 1.11.0。
- `check.log`：前端 tests/pass 236，後端 78；兩端 fail 0、skipped 0；包含 TypeScript／Vite build，整體 exit 0。
- `emulator.log`、`emulator-roundtrip.json`：指定完整流程全部 PASS，使用本機 **127.0.0.1:18137** 及 `demo-codex-reveal37`，未使用正式環境；實際 Callable handler 搭配真實 Firestore Emulator。
- `extra-emulator.log`／JSON：第二輪獨立 Emulator 補測 F1、F2 與 Rules；同樣正常結束並關閉 Emulator。
- `ui/`：獨立生成教師公佈前後、學生未答／答對／答錯、排序、紀錄之 1440／390 截圖；`ui-verification.json` 兩寬度通過、errors 空。
- `validate-keys.json`：11 項獨立 validator 檢查通過；此結果不代表 F1、F2 已被原測試覆蓋。

### 私有資料與工具

`answers-verified.json` 逐題記錄選項索引／排序對照；`key-sources.json` 對照 R05／08／11／14、U05／08／11／14 答案頁。
解析僅以各欄原句串接並加句號，核對時只去末句號，未以語意近似代替正文比對；未在本報告抄錄題目或答案文字。

`private-ui.json`：呼吸與泌尿各 choice／order 一輪，共 4 輪；公佈前回傳禁用欄位清單空、當前回饋區 0，公佈後三手機依次答對／答錯／未答，排序錯答步驟為 ✓✗✗✓，紀錄頁可回看。
合併工具獨立驗證既有 1 題＋答案鍵合併為 9 題／9 鍵，原題與原鍵 deep equal；既有答案解析衝突時停止、兩輸出均空、diff 有內容且複製停用。

**外部字型現況（不列為本輪兩項阻擋）**：新版私有彩排實頁會請求 Google Fonts CSS 及 gstatic 字型，見 `private-ui.json.external`，所以不能宣稱私有套件零外連。本輪沒有正式平台 API／正式資料庫請求；既有本機離線定位若要求完全無外部依賴，請併入後續修訂。

原證據共 16 張，寬度包含 1440／390，metadata 與畫面已核對；`original-evidence-images.json`、`original-evidence-contact.jpg` 保留核對紀錄。小量正常流程的截圖／PASS 與本輪兩個邊界失敗並不矛盾。

## 收工與處置

**#37 改可做／Antigravity**，修 F1、F2 後交 Codex 再覆驗，全數通過才停-等Claude；未部署、未 push、未匯入。
本輪未改任何程式碼或私有檔；`private-before.json`／`private-unchanged.json` 確認 22 份既有私有頂層檔案 SHA 全部不變，工作樹測試後仍無程式碼 diff。
覆驗報告在本工作樹；佇列與週誌依 handoff 只維護原根目錄，保留其他工作的未提交修改。清理 dry-run 可刪 0；依規寫週誌並跑根目錄 check_handoff.py。
