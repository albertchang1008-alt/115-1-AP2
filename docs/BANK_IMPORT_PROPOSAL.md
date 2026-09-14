# 蘇格拉底式解析總表 接軌課程平台題庫｜建議書

對象：115-1 AP2 課程平台 1.0（現行版本 1.1.2）
依據：`115-1_Q1-Q2_蘇格拉底式解析總表.xlsx`、本機 `~/Documents/ChatGPT/課程平台1.0` 的實際程式碼、本機舊系統 `題庫系統-v1.9` 的 `Code.gs`／`index.html`／`firebase-v1685.js`、教師正在使用的 Google Sheet《115-1-AP2課程平台》
日期：2026-09-14（第三版：核對正式 Google Sheet 後，補上「單元／次單元」兩層架構設計）

---

## 0. 你的決定

1. 題庫集中在同一個分頁，新增「單元」欄位與單元內題序欄位，系統本身不設題數上限
2. 改平台欄位去配合 Excel 的五段解析
3. 抽題題數由學生自己選（仿 v1.9），不是教師固定一個數字
4. 「已考過優先」排序邏輯要帶進新平台（仿 v1.9）
5. 完整測驗＝考完該單元全部題目才算完成度，這件事**不改**，維持現況（也是 v1.9 的做法）
6. **單元是真正的兩層結構**：單元（大分類，例如「血液」「心臟」）底下有許多次單元，各自是獨立題庫，學生依學習進度一個一個次單元練習。這跟 v1.9 的「科目→章節」是同一個設計，不是新發明。
7. 這份文件只做建議，不動程式

以下全部圍繞這七點展開。所有「現況」都是從程式碼讀出來的，不是推測。

**本版新增：核對了教師正在使用的正式 Google Sheet**（《115-1-AP2課程平台》，見第 3.5 節），發現實際欄位跟 Excel 有出入，第 3 節的單元設計已經改寫。

---

## 1. Excel 現況盤點

| 項目 | 數值 |
|---|---|
| 總題數 | 165（Q1 84、Q2 81） |
| 題目 ID | 165 個，無重複，純數字字串（符合平台 `safeId` 規則） |
| 細分單元 | 15 個（心臟構造、心輸出量與調節…微血管與組織液） |
| 認知層次 | 記憶 70、了解 38、應用 17、分析 40 |
| 圖層 | 課前骨架 71、課後整合 94 |
| 圖中角色 | 主線 65、對照 51、陷阱 27、詞卡 22 |
| 年度 | 17–26 共 10 個年度，每年 12–22 題 |
| 引用原子卡 | 99 張唯一卡片 |
| 待覆核 | 23 筆＝缺原子卡 4、建議修改 2、重複考點 17 |
| 正解分布 | A 46、B 44、C 45、D 30 |

解析五段的平均長度：①關鍵字 59 字、②提問鏈 157 字、③回頭選答案 31 字、④一句話記憶 102 字、⑤追溯原子卡 103 字。

按平台 `Question` 模型換算成 JSON 後的實際體積：**Q1 132 KB、Q2 123 KB，合併 165 題約 255 KB**。這個數字在第 5 節會用到。

---

## 2. 現行平台的硬規則（不改程式的話你會撞到的牆）

讀自 `shared/sheets.ts`、`shared/model.ts`、`functions/src/index.ts`：

**分頁即單元**
`parseBankSheet(rows, unitId)` 的 `unitId` 就是分頁名稱，而且會先過 `safeCode()`。沒有任何欄位可以指定單元。

**每個非「名冊」分頁都會被當成題庫**
`syncSheet` 的迴圈是 `for (const title of titles) { if (title === '名冊') continue; ... }`。所以你這份 Excel 若直接設成同步來源，「雙向細目表」「教師覆核清單」「使用說明」三個分頁會各報一次錯，整次同步 `hasErrors` 為 true。**這是你現在就會遇到的第一個問題。**

**必填欄位四個**
課程代碼、題目ID、問題、解答。你的 Excel **完全沒有「課程代碼」欄**，同步會在第一列就中斷。

**每單元 1–100 題**
`validateQuestions` 寫死 `qs.length > 100` 就報錯。

**題庫版本是內容雜湊**
`version = sha256(JSON.stringify(questions)).slice(0, 20)`。**陣列順序會進雜湊**，所以在 Sheet 上拖動列的順序、即使一字未改，也會產生新版本。

**版本綁定學生成績**
`progress.units[unitId].best` 與 `wrong[version]` 都綁在版本上。換版本＝錯題複習清單歸零、最高分沿用但錯題記錄斷。

**完整測驗＝出全部題目才算完成度**
`Student.tsx` 的 `start()`：`full = !sample && m !== 'review'`，而 `applyAttempt` 只在 `a.full` 時更新 `best`。**這件事本次確認不改**——第 5 節會說明這其實跟 v1.9 的設計一致。

**抽題練習有 bug**
`qs.slice(0, Math.floor(qs.length / 2))` 在 `shuffle` **之前**執行，所以抽題練習永遠是同樣的前半段題目，不是隨機抽樣。第 5 節會用 v1.9 的做法整個換掉。

**同步前單元必須已存在**
`syncBankTabFromSheet` 會檢查 `draft.units` 是否有該 unitId，否則報「請先建立並保存單元」。

**體積上限 600 KB**
`publishBank` 呼叫 `size(questions, 600000)`。

---

## 3. 改動方案一：題庫集中在單一分頁 ＋ 單元／次單元兩層結構

### 3.1 為什麼是兩層，不是一層

第一版建議書假設「單元」是平面的一層，對應平台 `Unit`。實際核對你正在用的 Google Sheet 後發現不是——你要的是：

- **單元**＝大分類（目前看到「血液」「心臟構造」），純粹用來分組、給學生瀏覽
- **次單元**＝真正的題庫單位（「紅血球與血紅素」「心動週期與心音」…），學生依學習進度一個一個次單元練習、各自獨立計算完成度

這正好對上 v1.9 原本就有的「科目（subject）→章節（chapter）」兩層設計——`CreateQuestionBankSheet.gs` 的表頭就是「科目ID／科目名稱／章節ID／章節名稱」，`index.html` 的學生端也是先選科目、再選章節進去作答。**你要的兩層不是新需求，是新平台把 v1.9 原本就有的分組層拿掉了，這次補回來。**

對應到平台的完整測驗規則（第 5 節確認不改）：完整測驗的範圍是**次單元**，不是單元——這樣「血液」底下五個次單元，學生是分開五次做完，不會變成一次要考完血液全部題目。單元本身不是一個可測驗的實體，只是導覽用的分組標籤。

### 3.2 要改的檔案

| 檔案 | 改什麼 |
|---|---|
| `shared/model.ts` | `Unit` 加一個可選欄位 `group?: string`（＝單元／大分類的顯示名稱），沒有值時維持現況、UI 平鋪顯示，向後相容 |
| `shared/sheets.ts` | `parseBankSheet` 讀「單元」「次單元」兩欄；分組鍵（也就是 `unitId`）用**次單元**；「單元」欄的值原樣帶出，回傳結構讓呼叫端可以把它寫進對應 Unit 的 `group` |
| `functions/src/index.ts` | `syncBankTabFromSheet` 改為對一個分頁內的多個次單元各呼叫一次 `publishBank`，並在寫回 `draft.units` 時一併更新該 unit 的 `group`；`syncSheet` 改為只讀指定的題庫分頁名，其餘一律略過 |
| `src/CourseSetup.tsx` | 單元列表依 `group` 分組顯示／摺疊（沒有 `group` 的維持平鋪） |
| `src/Student.tsx` | topic-section 學生端單元列表比照，依 `group` 分組瀏覽 |
| `apps-script/CreateCourseTemplate.gs` | 範本分頁名改為「題庫」，headers 加入「單元」「次單元」「題序」 |
| `docs/QUESTION_BANK_PLAN.md` | 欄位對照表更新 |

### 3.3 四個設計要點

**次單元值仍須過 `safeCode`。** 你 Excel／Sheet 裡的次單元名（「心輸出量與調節」等）是中文無空白無標點，1.1.1 放寬後全部合法，可直接當 unitId 用。

**「單元」欄不需要過 `safeCode`。** 它只是顯示用的分組字串，不當路由代碼，不必限制字元——但建議同步時 trim 一次，避免全形空白之類的差異讓同一個單元被拆成兩組。

**單元欄可以空白，不擋同步。** 你現在的 Sheet 有 65% 的列「單元」欄還沒填。比照 v1.9 的做法（`chapterName || chapter || category || name || "未分類"`），空白時歸入「未分類」，不要因為這欄沒填完就擋住次單元的同步——你可以之後再慢慢把分類補齊。

**同一個次單元的單元歸屬要一致。** 如果同一個「次單元」值在不同列填了不同的「單元」，代表教師打錯字，建議同步時明確報錯（例如「次單元『心動週期與心音』同時出現在『單元：血液』與『單元：心臟』，請統一」），不要靜默用最後一筆蓋掉。

**分頁掃描規則要一起改。** 建議 `syncSheet` 只處理白名單分頁：`名冊` 與 `題庫`（或 `sync/config` 裡教師設定的分頁名清單）。這同時解決第 2 節「附表分頁報錯」的問題。

### 3.4 一個要提醒的後果

單一分頁後，**同步的錯誤定位會變難**。目前錯誤訊息是「第 N 列」，N 是該分頁的列號；題目擠在一個分頁時，錯誤訊息應該同時帶上次單元與題目 ID，否則你要在一大串列裡找特定那一列。建議錯誤訊息格式改成 `題庫 第 87 列（單元 血液／次單元 紅血球與血紅素、題目 2543849）：…`。

### 3.5 核對正式 Google Sheet 後發現的落差

你貼的《115-1-AP2課程平台》（owner hhchang@ctcn.edu.tw）是實際在用的檔案，不是 Excel 匯出的一次性快照。核對後有幾個跟 Excel 不一樣、需要你知道的地方：

| 項目 | 現況 |
|---|---|
| 題庫分頁 | Q1、Q2 已經合併在同一張表（用「題庫」欄區分），符合單一分頁的方向 |
| 題數 | 目前 93 題，不是 165 題，看起來搬移到一半 |
| 單元欄 | 已存在，但只填了「血液」「心臟構造」兩種值，65% 的列空白 |
| 次單元欄 | 已存在，看到 10 種值（Excel 原本是 15 個單元名），也還沒搬完 |
| 課程代碼欄 | **沒有**——跟 Excel 同樣的問題，這份正式 Sheet 一樣會在同步第一列中斷 |
| 名冊分頁 | 只有表頭（班級／學號／姓名／Gmail），沒有學生資料；也缺「課程代碼」欄 |
| 題序、啟用欄 | 都還沒加，跟建議書原本預期一致 |

這代表：你不需要先把 Excel 加工好再倒進 Sheet——這份 Sheet 本身就是你在編輯的地方，建議直接在這份 Sheet 上把「課程代碼」欄補上、把「單元」欄填完，其餘照第 3.3 節的規則走。

---

## 4. 改動方案二：題序欄位

### 4.1 題序要拿來做什麼，先講清楚

學生端一律 `shuffle`，這是防止記選項位置的設計，不建議取消。所以題序的真正用途是：

- 教師後台題庫預覽的顯示順序
- **穩定版本雜湊**（見下）
- 未來若要做「依順序的教學型闖關」才會用到出題順序

### 4.2 這是目前就存在的隱患

因為 `version` 是 `JSON.stringify(questions)` 的雜湊，而 `parseBankSheet` 是按列序 push 的，**教師在 Sheet 上排序或插入一列，即使內容沒變也會換版本**，學生的錯題複習清單會整批失效。

建議：`publishBank` 在計算雜湊前，先依 `(unitId, order, id)` 做穩定排序。這樣列序變動不再產生新版本，只有真正改了內容才會。**這一項比題序欄位本身更重要，建議一起做。**

### 4.3 欄位設計

`Question` 加 `order?: number`，Sheet 欄名「題序」。空白時以列序遞補。題序只需在單元內唯一，不需跨單元連號——你 Excel 的「序號」欄是 Q1 1–84、Q2 1–81，本來就是單元內編號，可以直接用。

---

## 5. 改動方案三：抽題練習（仿 v1.9），完整測驗規則維持不變

這一節在核對 v1.9 原始程式碼後整個重寫，跟第一版建議書的方向不同，先講清楚差異在哪。

### 5.1 v1.9 實際上是怎麼做的

讀自 `index.html` 的 `orderQuestionsForQuiz` 與 `startConfiguredQuiz`：

```js
function orderQuestionsForQuiz(data, requestedCount) {
  const attemptedMap = myProgressCache?.attemptedQuestions || {};
  const unseen = data.filter(q => !hasAttemptedQuestion(attemptedMap, getQuestionKey(q)));
  const seen   = data.filter(q =>  hasAttemptedQuestion(attemptedMap, getQuestionKey(q)));
  const ordered = [...shuffle(unseen), ...shuffle(seen)];
  return requestedCount === "all" ? ordered : ordered.slice(0, Number(requestedCount));
}
```

畫面上是「10 題／20 題／30 題／50 題／全部題目」五顆按鈕，題庫題數不夠某個檔位時按鈕會 disable。學生自己選。

**`attemptedQuestions` 是每個學生永久累積的「考過哪些題目」記錄**，儲存在 `studentProgress/{studentId}` 文件裡，答題送出後合併寫入（`mergeAttemptedQuestions`，只會新增、不會被清空）。所以「已考過優先」的實際行為是：還沒考過的題目永遠洗牌排前面；等整個題庫都被這個學生考過一輪之後，這個記錄不會重置，之後每次都自然變成純隨機（因為全部都在「已考過」那一批裡）。**這不是「輪完一圈就重洗」的循環機制，只是一次性的「優先出新題」。**

**最關鍵的一行**：

```js
currentQuizCountsTowardScore = requestedCount === "all" && topic !== "綜合練習";
```

**只有選「全部題目」才算正式成績、才計入完成度。** 10/20/30/50 題是不計分的練習模式。也就是說 v1.9 從來沒有繞過「要考完全部題目才算數」這條規則——跟現行新平台的 `full = !sample && m !== 'review'` 是同一個設計精神。第一版建議書把 `quizCount` 設計成「教師固定、直接影響完成度」是我看錯的方向，這次改正。

### 5.2 新平台要補的東西

**A．抽題練習改成學生自選題數，並套用「已考過優先」**

`Student.tsx` 的 `start()` 目前的抽題練習：

```ts
if (sample) qs = qs.slice(0, Math.max(1, Math.floor(qs.length / 2)));
```

改為：

```ts
function orderForPractice(qs: Question[], attempted: Set<string>) {
  const unseen = qs.filter(q => !attempted.has(q.id));
  const seen = qs.filter(q => attempted.has(q.id));
  return [...shuffle(unseen), ...shuffle(seen)];
}
// start() 內：
if (practiceCount) qs = orderForPractice(qs, attemptedSet).slice(0, practiceCount);
else qs = shuffle(qs); // 完整測驗：不減量，只洗牌
full = !practiceCount && m !== 'review';
```

UI 從現在單一顆「抽題練習」按鈕，改成類似 v1.9 的題數選單（可以先簡化成 10／20／30／全部，依單元題庫題數自動 disable 超過的檔位）。

**B．`Progress` 要加一個不受版本影響的「已考過」記錄**

現有 `progress.units[unitId].wrong` 是按版本分的（`wrong: Record<version, string[]>`），這是對的——因為換版本後舊錯題不一定還適用。但「已考過」不應該這樣設計：教師改了一題不代表其他 99 題要重新「解鎖」成優先出題。建議新增獨立欄位、以 unitId 為鍵，不跟版本綁：

```ts
interface Progress {
  units: Record<string, {...}>; // 不變
  activities: Record<string, {...}>; // 不變
  attempted?: Record<string, Record<string, true>>; // unitId -> questionId -> true，跨版本保留
}
```

每次交卷（完整測驗與練習皆算，錯題複習模式不算——這點也是照抄 v1.9 的 `if (!myProgressCache || isRetryMode) return;`）把這次出現過的題目 ID 併入 `attempted[unitId]`。

**C．這跟第一版建議書「取消題數上限」的關係**

因為完整測驗規則不變，「一個單元塞很多題」的代價還是「學生要一次做完全部題目才計完成度」——這件事你已經確認不改，而且你也說不會一次塞 165 題，所以這件事目前不急。建議書仍然主張把 `validateQuestions` 的 `> 100` 上限放寬（原因見 5.3 的體積分析），但放寬的理由不再是「反正抽題只出一部分」，而是單純讓題庫大小的彈性回到你手上，由你自己決定怎麼切單元。

### 5.3 體積上的牆（跟題數上限有關，供你抓感覺）

| 牆 | 位置 | 165 題的現況 | 什麼時候會撞到 |
|---|---|---|---|
| 體積 600 KB | `publishBank` 的 `size()` | 255 KB，42% | 約 400 題 |
| Firestore 單文件 1 MB | bank 主文件的 `questionOptions` | 幾 KB | 數千題 |
| 讀取流量 | `getBank` 一次撈完所有 chunk | 9 個 chunk | 題數愈多，每次開始測驗的讀取量線性成長 |

v1.9 的 `Code.gs` 本身也沒有對每章題數設任何業務邏輯上限（只有寫入 Firestore 時的批次大小限制，50 筆或 700 KB 一批，純粹是寫入效能考量，不是題數上限）。所以「系統不設題數上限」這個決定跟 v1.9 的前例一致，可以放心維持。

### 5.4 抽題會牽動的地方

- **報表**：`aggregate` 以題目為單位統計 `students`，抽題後每題的作答人數會不同，這點現有邏輯已經是逐題累加，沒問題
- **最高分**：`best` 只在完整測驗（`full`）時更新，抽題練習不影響，跟 v1.9 一致
- **重複考點**：你 Excel 標了 17 組重複考點，抽題練習是隨機的，同一次練習仍可能抽到同考點的兩三題。若要避免，需要在 `Question` 加「考點」欄並在抽題時做同考點去重——這是可選進階功能，建議先不做

### 5.5 順帶建議：加一個「啟用」欄

你有 4 題卡在「缺原子卡」不得發布、17 題重複考點希望擇一。目前平台沒有「不出題」的表達方式，只能刪列——刪了就沒有紀錄。建議 Sheet 加「啟用」欄（沿用名冊分頁的 TRUE/FALSE 慣例），同步時 FALSE 的列直接略過。這樣覆核紀錄留在 Sheet 上，不必刪題。

這也順便解掉你 handoff 裡「題目作廢並重算」的一半需求——**但只解一半**：停用只是之後不再出，已經發生的作答與分數仍需要重算才收得回來。重算那部分仍是獨立的一塊，你 handoff 已經列為待辦，不在這次範圍。

---

## 6. 改動方案四：解析欄位改成 Excel 的五段

### 6.1 對照表

| Excel 欄 | 現行平台鍵 | 現行標籤 | 建議新鍵 | 建議新標籤 |
|---|---|---|---|---|
| ①先想關鍵字 | `socratic.hint1` | ① 先看題幹 | `socratic.keyword` | ① 先想關鍵字 |
| ②提問鏈 | `socratic.hint2` | ② 比較觀念 | `socratic.chain` | ② 提問鏈 |
| ③回頭選答案 | `socratic.hint3` | ③ 推回答案 | `socratic.decide` | ③ 回頭選答案 |
| ④一句話記憶 | `socratic.concept` | 核心概念 | `socratic.memory` | ④ 一句話記憶 |
| ⑤追溯原子卡 | `socratic.misconception` | 常見誤解 | `socratic.trace` | ⑤ 追溯原子卡 |
| 考點 | `concept` | （不顯示） | `concept` | 不變 |

五段對五欄，數量剛好，不需要新增欄位——只是語意全換。

### 6.2 要改的檔案

`shared/model.ts`（介面）、`shared/sheets.ts`（`get()` 的別名清單）、`src/QuestionContent.tsx`（`labels` 常數與 `items` 的排列順序）、`apps-script/CreateCourseTemplate.gs`（headers）、`docs/QUESTION_BANK_PLAN.md`（對照表）。改動點不多，主要是機械性替換。

### 6.3 不能省的相容層

**已發布的 bank 文件是不可變快照。** `publishBank` 寫進 `banks/{courseId}_{unitId}_{version}/chunks/*` 之後就不再改寫，舊版本題庫裡的 socratic 是舊鍵名。若 `QuestionContent.tsx` 只認新鍵名，**學生回看歷史版本的測驗解析會整片消失**。

建議 `QuestionContent.tsx` 的讀取寫成 `q.socratic?.keyword ?? q.socratic?.hint1`，五個欄位都做一次。標籤則以有值的鍵決定顯示哪個名稱。這層相容碼建議保留至少一學期。

### 6.4 順序問題

`QuestionContent.tsx` 目前的 `items` 是照 `labels` 物件的鍵順序展開（concept、misconception、hint1、hint2、hint3）。改成五段後順序必須是 ①②③④⑤，所以 `labels` 的鍵順序要跟著調，不能只改文字。

### 6.5 ⑤追溯原子卡的內容格式

你的內容長這樣：

```
`heart-location`（AB-05_11 p.2，primary）｜`heart-sound`（AB-05_11 p.13）
```

裡面有 Markdown 反引號，但 `QuestionContent.tsx` 是用 `<p className="preserve-lines">{...}</p>` 純文字渲染，**反引號會原樣印出來**。兩個選擇：同步時剝掉反引號，或在 Excel 端改用不需要標記的寫法。建議前者，在 `parseBankSheet` 做一次 `replace(/`/g, '')`，Excel 不用動。

另外 `⑤追溯原子卡` 的值末尾有 `\n\n---` 的殘留分隔線，也建議在同步時 trim 掉。

---

## 7. Excel 這邊要先修的四件事

| # | 問題 | 影響 | 建議 |
|---|---|---|---|
| 1 | **缺「課程代碼」欄** | 同步第一列就中斷 | 加一欄，整欄填同一個課程代碼 |
| 2 | **22 題題幹英文被吃掉空白** | 直接印在學生眼前 | 見下 |
| 3 | 題目 ID 是數字 | Google Sheet 會存成數值 | 上傳後把該欄設為純文字格式（範本已有 `setNumberFormat('@')` 的作法） |
| 4 | 4 題缺原子卡、17 題重複考點 | 目前無法表達 | 等 5.5 的「啟用」欄，或暫時手動處理 |

第 2 項的實例：`apexofheart`、`Frank-Starlinglawoftheheart`、`systolicvolume`、`atrioventricular`、`erythropoietin`、`aorticsemilunarvalve`、`circleofWillis`、`immunoglobulin`、`internalthoracicartery`、`tissuemetabolicactivity`、`lymphoidorgans`、`leftcoronaryartery`、`Starlingforces` 等。這是上游 CSV（`115_AP2_2_題庫總表.csv`）在轉檔時吃掉空白造成的，**建議回源頭修**，否則每次重新產生 Excel 都要再修一次。

---

## 8. 建議的落地順序：合併為單一版本 1.2.0

不再分 1.1.3／1.2.0／1.2.1 三批，以下項目一次收進 **1.2.0**：

- 分頁掃描白名單（只處理「名冊」與「題庫」分頁）
- 單一分頁 ＋ 單元／次單元兩層結構（`Unit.group` 欄位、`parseBankSheet` 以次單元分組、單元欄允許空白歸入「未分類」）
- 課程設定頁與學生端單元列表依 `group` 分組顯示
- 題序欄位 ＋ 發布前穩定排序（version 雜湊不再受列序影響）
- 解析五段改名（`keyword`／`chain`／`decide`／`memory`／`trace`）＋ 舊鍵相容層
- 錯誤訊息帶單元／次單元與題目 ID
- 抽題練習改為學生自選題數 ＋「已考過優先」排序 ＋ `Progress.attempted` 欄位
- 放寬 `validateQuestions` 的 100 題上限（建議放到 500，並保留明確的體積錯誤訊息）
- 「啟用」欄（同步時略過 FALSE 的列）

**建議不要現在做的**
同考點去重抽題、題目作廢並重算分數。前者要先有考點欄位與實際使用經驗才知道怎麼設計；後者是獨立的一塊，你 handoff 已經列為待辦。

---

## 9. 跟 10/12 小考的時間關係

小期中考 10/12、線上小考 Q1/Q2 截止 10/12 12:00。今天 9/14，還有四週。

你確認不會一次把 165 題塞進一個單元，加上完整測驗規則維持不變，時間壓力比第一版建議書估的小：只要 Excel 補上「課程代碼」欄，並依你自己想切的單元大小分好「單元」欄，這次的 1.2.0 改完就能直接用，不需要為了趕考試日期而先做半套。

---

## 10. 摘要

- 你現在就會撞到的三件事：附表分頁被當題庫、缺課程代碼欄、22 題題幹黏字——核對過你正在用的正式 Google Sheet，這些問題在那份 Sheet 上同樣存在，不是 Excel 匯出才有的
- **單元其實是兩層**：單元（大分類，血液／心臟）底下有多個次單元，各自是獨立題庫、獨立完成度。次單元＝平台的 `unitId`，單元只是分組顯示用的 `Unit.group`。這對應 v1.9 原本就有的「科目→章節」設計，這次是補回來，不是新發明
- 完整測驗的範圍是**次單元**、不是單元，所以「單元底下題目很多」不會變成一次要考完全部——這件事跟「完整測驗＝考完全部題目才算完成度」這條不變的規則並不衝突
- 你要的改動都可行，合併成單一版本 1.2.0，改動點集中在 `shared/sheets.ts`、`functions/src/index.ts`、`src/QuestionContent.tsx`、`src/Student.tsx`、`src/CourseSetup.tsx`、`shared/model.ts` 六個檔案
- 抽題練習仿 v1.9：學生自選題數、已考過的題目自然排到後面（不是「輪完重洗」，是一次性的優先出新題），需要新增 `Progress.attempted` 欄位，跨題庫版本保留，且不計入完成度
- 兩個目前就存在、這次順手可以修掉的隱患：版本雜湊受列序影響、抽題練習的 slice 在 shuffle 之前（本次直接用 v1.9 邏輯取代，一併修掉）
- 解析欄位改名務必留相容層，否則歷史版本的解析會整片消失
- 你正在編輯的 Sheet 目前只有 93/165 題、單元欄六成空白、名冊是空的——這些是你接下來自己要填的資料，不是程式問題
