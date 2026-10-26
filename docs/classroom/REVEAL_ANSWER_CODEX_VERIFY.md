# 給 Claude 的摘要
- #37 退修覆驗，2026-10-26；受驗 `f9d56df2`／`feature/classroom-reveal`，版本 1.11.0；**產品碼只驗不修**。
- 結論：**8/8 PASS、0 FAIL**；前輪 F1、F2 均已修復，根目錄 #37 改 **待驗收／Claude**。
- F1 後端刪鍵／選項失效皆不再回傳 true、reveal 拒絕碼為 failed-precondition；恢復合法鍵後可公佈；已公佈快照經刪改鍵及重按後不變。
- F1 真實教師元件 5 種獨立情境通過，含空鍵／失效鍵搭配過期 hasAnswerKey:true、恢復鍵、已公佈後刪／改鍵。
- F2 獨立加入 150 輪別班與 151 輪本班資料，本班完整取得 153 輪，別班 150 輪；時序、跨班／跨生隔離及偽造 uid／classId 忽略皆通過。
- 完整 check：前端 236、後端 78，兩端 0 fail／0 skipped；指定 Emulator 13 項 PASS，另以隔離 demo Emulator 補測通過。
- 1440／390 UI、前揭答不洩漏、三態與排序回饋、私有 8 題來源及彩排／合併同步均通過；22 份私有檔 SHA 不變。
- 本輪無正式資料讀寫、未改 reviewed 卡、未 push／部署；工作樹與根目錄覆驗報告同步，佇列／週誌僅維護根目錄。
- 非產品治理調整：既有 check_handoff 不接受教師指定「待驗收」，僅新增此狀態白名單，其他檢查與產品碼不改。
- 抽查 5 項：independent.json、f1-ui.json／截圖、check.log、emulator-roundtrip.json、approved-keys.json／私有 UI 證據。

## 依據與證據

已讀根目錄 handoff、AI_WORKFLOW_PLAN、CODEX_QUEUE、`CODEX_TASK_classroom-reveal-answer_2026-10-26.md`，以及工作樹實作報告與前輪覆驗報告。
指定工作樹為 `/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/classroom-reveal`，開工分支 `feature/classroom-reveal`、HEAD `f9d56df2`，工作目錄乾淨。
前輪 `4bfcb8b4` 的兩個 FAIL 歷史保留於本報告 `d1c8ed48` 版本及舊證據，本輪已重新實測，不以實作者自檢取代覆驗。

證據根目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-26/classroom-reveal/`。
本輪獨立子目錄：**`codex-reverify-f9d56df2/`**；下文檔名以此為根。**截圖保存至 2026-11-02**，`manifest.json` 記錄證據大小及 SHA；未納入 git。

## 八項驗證結論

| 項 | 判定 | 獨立覆驗結果 |
|---|---|---|
| 1 answerKeys 分存／驗證／Rules | PASS | 與 interactions 分開存取；獨立 11 組 validator 檢查及實際 8 題通過，非法 slide／field、choice／order、301 字解析被拒；輸出無 undefined，client 直讀 Emulator 答案文件回 403。 |
| 2 教師答案設定與公佈鍵 | PASS | 刪鍵與選項失效均隱藏未公佈輪次公佈鍵，含過期旗標；恢復合法鍵後出現，已公佈快照狀態保留。F1 詳見下節。 |
| 3 reveal 條件／冪等／快照 | PASS | open 拒絕，closed 才可公佈；快照僅第一次建立；事後改鍵、刪鍵與重複 reveal 皆不改既有快照。 |
| 4 洩漏負向與學生回饋 | PASS | 公佈前正常 open／closed 回傳不含 reveal／answer／explanation／judgement；已送出等待公佈；三態、排序逐步 ✓✗、正解／解析與全班統計通過。 |
| 5 本班完整紀錄／隔離 | PASS | 直接依 classIds array-contains 查本班，未先全課程 limit100；別班 >100 輪不擠掉本班，本班 153 輪完整、排序正確，未公佈排除、跨班／跨生隔離。 |
| 6 不計分與舊資料相容 | PASS | 仍只寫 classroomConfig／State／Rounds／responses，無新增成績、progress、passedAt、researchEvents 寫入；Emulator progress 空；舊無 reveal 輪次及既有 interactions 測試通過。 |
| 7 私有 8 題與工具 | PASS | 8 題答案符合核定大綱、解析原句逐句匹配且 ≤300 字；雙單元 choice／order 公佈／紀錄、舊鍵保留及衝突停止實頁通過；22 檔 SHA 未變。 |
| 8 完整 check／版本／Emulator／證據 | PASS | 1.11.0 一致；前端 236＋後端 78 全過、0 fail／0 skipped；指定 Emulator 13 項及獨立補測成功；1440／390 UI 和更新後原 17 張證據已核對。 |

## F1：刪鍵／失效／恢復與已公佈保留

### 後端獨立 Emulator

使用自建合成題與獨立 demo 專案，實際呼叫受驗 Callable handlers 與真實 Firestore Emulator：

1. 保存合法鍵、開題、兩位 A 班學生分別作答後收題；額外在輪次文件注入舊 `hasAnswerKey:true`，重現前輪資料相容情境。
2. `saveClassroomConfig({answerKeys:{}})` 後 report 不再回傳 `hasAnswerKey:true`，reveal 以 **failed-precondition** 拒絕。
3. 重新保存合法鍵，report 恢復 true、reveal 成功。
4. 已公佈輪次先刪鍵，再改成另一合法鍵／解析，再重複 reveal；原 `reveal` 快照逐物件 deep equal，已公佈 report 仍有合法已公佈狀態。
5. 另開第二輪收題，改 options 使原鍵失效；report 不為 true、reveal 仍以 failed-precondition 拒絕。恢復原題與合法鍵後可公佈。

以上全通過，見 **`independent.json.f1`** 與 `independent.cjs`。指定原 Emulator 腳本也包含移除／失效／恢復及快照回歸，全數 PASS。

原碼查核：後端 `decorateRoundWithKey` 捨棄未公佈輪次舊旗標，使用 `extractValidSlideKey` 決定目前是否可公佈；已 reveal 則保留快照。保存變更題目時亦移除不再合法的鍵。
前端根據最新答案設定、合法鍵與後端回傳決定按鈕，不再僅信任舊旗標；未修改產品碼。

### 真實教師元件獨立 UI

另外掛載受驗 TeacherInteraction，以本機假 API 固定提供過期 `hasAnswerKey:true`，檢查按鈕實際 DOM，而非只看原碼：

| 情境 | 公佈答案鍵數 | 已公佈鍵數 | 結果 |
|---|---:|---:|---|
| 空 answerKeys＋過期 true | 0 | 0 | PASS |
| 選項不合法答案＋過期 true | 0 | 0 | PASS |
| 恢復合法答案鍵 | 1 | 0 | PASS |
| 已有 reveal 快照，事後刪鍵 | 0 | 1 | PASS |
| 已有 reveal 快照，事後改鍵 | 0 | 1 | PASS |

見 **`f1-ui.json`** 與五張 `f1-*.png`。另重跑實作者 1440／390 UI 流程，包含實際編輯保存、刪除、恢復與過期旗標，兩寬度皆 PASS、0 pageerror。

## F2：超過 100 輪與隔離

獨立 Emulator 初始 A 班有 2 輪已公佈紀錄：

- 再寫入 **150 輪較新的 B 班已公佈紀錄**，A 班仍取得 2 輪。
- 再寫入 **151 輪 A 班已公佈紀錄**，A 班完整取得 **153 輪**；B 班只取得自身 **150 輪**。
- 額外 A 班 closed 未 reveal 輪次不出現在紀錄中；紀錄按 openedAt 排序。
- A 生 1／A 生 2 第一輪各自答案不同，查回各自原作答；在 A 生 1 請求資料中偽造 A 生 2 uid／B 班 classId 不改變授權身份或回傳範圍。
- 直接讀答案文件仍 403；progress 集合仍空。

見 **`independent.json.f2`**。原指定 Emulator 另驗證 B 班 105 輪及 A 班 108 輪，亦全部通過。
原碼已改為 `.where('classIds','array-contains',p.classId).get()`，再篩 closed＋reveal 並排序；沒有全課程先 limit100 的截斷。

## 完整測試執行

在指定工作樹、Node 22.23.2 執行：

```sh
npm run version:check
npm run check
firebase emulators:exec --project course-platform-reveal-test --only firestore "node functions/scripts/verify-classroom-reveal-emulator.cjs"
node scripts/classroom-reveal-verify.mjs /private/tmp/reveal37-r2/ui
```

- `version.log`：版本一致 1.11.0。
- **`check.log`：前端 tests/pass 236、後端 78，兩端 fail 0、skipped 0**，含 TypeScript／Vite build，整體 exit 0。
- 指定 Emulator 使用 **127.0.0.1:8080**、專案 `course-platform-reveal-test`，輸出改存本輪暫存路徑，13 項 PASS，exit 0，見 `emulator.log`／`emulator-roundtrip.json`；沒有覆寫原證據。
- 獨立補測使用 **127.0.0.1:18137**、`demo-codex-reveal37-r2`，見 `independent.log`／JSON；兩套 Emulator 都正常關閉，未連正式環境。
- `validate-keys.json`：11 組獨立 validator 檢查 PASS，包含實際私有 8 題。
- `ui/ui-verification.json`：1440／390 皆 passed，errors 空；教師設定、公佈前後、三種學生狀態、排序逐格判定與紀錄皆有新截圖。
- `original-images.json`／`original-contact.jpg`：已核對原證據根目錄更新後的 17 張 PNG，含新增過期旗標修正截圖。

## 私有檔與資料來源

`approved-keys.json` 逐題核對實際答案／排序與核定大綱的相鄰答案頁 R05／08／11／14、U05／08／11／14；8 題均一致。
解析長度 60–134 字，各句移除末句號後與「正解／重點」欄原句逐字匹配，不用語意相近代替；本報告未抄題目或答案文字。

`private-ui.json` 實測呼吸／泌尿各 choice／order 共 4 輪：公佈前無禁用欄位、當前回饋區為 0；公佈後三手機為答對／答錯／未作答，排序錯項為 ✓✗✗✓，可回看紀錄。
合併工具保留既有題與答案鍵，合併為 9 題／9 鍵且原資料 deep equal；解析衝突時兩輸出均清空、顯示 diff、複製停用。
`private-before.json`／`private-unchanged.json`：**22 份既有私有頂層檔 SHA 全不變**。

延續前輪非阻擋現況：私有彩排仍會取用 Google Fonts，`private-ui.json.external` 有字型請求；未宣稱整個套件零外連。本輪沒有正式平台 API／正式資料庫請求，沒有修改此私有檔。

## 交棒與治理紀錄

**8/8 PASS，沒有待修產品項目；根目錄 #37 改「待驗收／Claude」**。由 Claude 最終驗收，通過後交教師決定部署／匯入；本輪未 push、未部署、未寫正式環境、未改 reviewed 卡。
依教師本次明確要求，工作樹與根目錄 `docs/classroom/REVEAL_ANSWER_CODEX_VERIFY.md` 內容相同；佇列與週誌只維護根目錄。
原 `scripts/check_handoff.py` 狀態白名單未包含「待驗收」，本輪僅在根目錄新增這個治理狀態以符合指定佇列與檢查要求；未放寬長度／件數／週誌等限制，未改產品碼或產品測試。
依規寫週誌並跑根目錄 check_handoff.py；證據清理 dry-run 可刪 0，未刪資料。其他工作的未提交修改均保留。
