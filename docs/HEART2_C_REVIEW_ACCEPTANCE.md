# Claude 複驗 2f78ae2：C1–C7 修正驗收（2026-10-03，Codex）

版本 1.6.4，分支 feature/cardiac-output-visuals，比對基底 f589505。C1–C4／C7 必修與 C5–C6 建議皆完成，交 Claude 複驗。未 push、未部署；題目／預測題、選項、答案、節點與題目 ID、Excel 保留。

## 變更與依據

| 項目 | 修正與驗證 |
|---|---|
| C1 | 六份新教材 34 個節點改為三條不同重點、具體應用或判讀。僅取材自 STAGE1_SUPPLEMENT_SPEC.md 第三節與同教材既有內容；心輸出量節點 04／06 已無重複，保留。逐句對照共 137 筆（包含第四條併入第一條的紀錄），交 Claude 做醫學複核。 |
| C2 | shared/materialKit.ts 共用 validateNodeText 正規化句號／空白，拒絕重複 point、point 等於 summary／concept、clinical 等於 summary；建置時強制驗證。新增回歸測試。全 21 份學生教材 129 節點通過，另全 15 份 kit 來源也通過。 |
| C3 | 弓放大圖引線從文字外緣起，六條引線交叉數 0；淡框包住頭臂動脈主幹與分叉位置。 |
| C4 | 手工電性圖的閱讀卡片取消高度上限／內部截斷，改為正常頁面捲動；SVG 保持比例、最大寬 440px。390／1280 SVG 完整位於卡片內，心電圖與下方兩行完整可見；附卡片與完整頁面。 |
| C5 | 肱動脈路徑／點位移到肘窩內側；顳動脈點移到更外側的耳前。 |
| C6 | 右頭臂靜脈標籤移到圖左，與其他人體右側血管同側；頭臂動脈／靜脈分開上下排列。 |
| C7 | 全段／弓圖改鮮明紅色圓柱漸層，背景白、橫膈淡粉紫；動脈主色 #D7263D、暗邊 #A3182C、亮部 #F06A7E，同步人體與肝門圖主色。選段時其他段淺灰 #D9DDE3，改色而非降低透明度。 |

[節點／舊句／新句／取材對照](HEART2_C1_TEXT_COMPARISON.md)。保留前負荷超出生理範圍的提醒，併入第一條，沒有刪除這項既有知識。來源產生程式同步載入已複核的節點文字檔，避免重新產生舊重複句；本次沒有重跑整份舊題庫產生程式。

## C7 圖面自我勾核

- [x] 全段升主動脈／弓管徑 66（600 viewBox，換算 400 寬約 44）；胸段 57（約 38）；腹段 45（約 30）；髂總 30（約 20）；弓分支 26（約 17）；冠狀 14（約 9）。
- [x] 弓放大圖主幹 105（換算約 70），分支 42（約 28）。主動脈是圖中最粗的結構；人體圖主幹 12，明顯粗於其他動脈 2.4–5。
- [x] 三處黑色點虛線（600 圖 3.75＝400 圖 2.5），橫跨管徑並延伸兩端，清楚標分界；四段細括號及段名標出範圍。
- [x] 移除管內白線與白箭頭，深灰小箭頭置於管外。
- [x] 略膨大的主動脈竇、左右各一開口及一小段冠狀動脈；右冠狀往圖左，左冠狀往圖右，分別標名，另有「→心臟血液供應」。
- [x] 各圖使用獨立漸層 ID，避免另一張隱藏 SVG 影響漸層。四段點選／再次還原／Enter／aria-pressed 正常；新視覺控制不送 CourseLearning，完成度分母不變。

## 驗證

- `npm run materials:validate-nodes`：全部 21 份學生教材（依 studentPaletteGroups 去重，包含手工版）129 節點、全部 15 份 kit 來源通過。手工教材以實際 concept／條列／應用欄位對應，不補造不存在的 summary。原始結果 [HEART2_C2_NODE_AUDIT.json](HEART2_C2_NODE_AUDIT.json)。
- `node scripts/heart2-c-review-verify.mjs`：26 張指定截圖、灰色切換、鍵盤還原、引線無交叉、電性卡片不截斷、可見字 ≥14px、無文字裁切／頁面錯誤／橫向溢位通過。
- 相對 f589505，六份 content 只改 points／clinical；其餘整份深度相同，含 lab／預測題、所有正式題目與選項／答案／ID。手工電性 HTML 除新增 CSS 外逐位元相同；其餘 content、其他教材與 Excel 逐位元相同，SHA-256 附 [HEART2_C_REVIEW_VERIFY.json](HEART2_C_REVIEW_VERIFY.json)。
- public/materials、materials-src 的全部文字來源／SVG 按用語清單與草稿詞掃描：0。二進位截圖不作文字關鍵詞掃描。
- `npm run check`：120 前端／19 Functions、兩端 build、version:check（1.6.4）通過。標準 `materials:shots major-vessels` 22 張通過（本機忽略）。

## 指定截圖

26 張位於 [heart2-c-review-screenshots](heart2-c-review-screenshots)，以下含兩種寬度：

- aorta-default：[390](heart2-c-review-screenshots/390-aorta-default.png)、[1280](heart2-c-review-screenshots/1280-aorta-default.png)
- aorta-ascending：[390](heart2-c-review-screenshots/390-aorta-ascending.png)、[1280](heart2-c-review-screenshots/1280-aorta-ascending.png)
- aorta-arch：[390](heart2-c-review-screenshots/390-aorta-arch.png)、[1280](heart2-c-review-screenshots/1280-aorta-arch.png)
- aorta-thoracic：[390](heart2-c-review-screenshots/390-aorta-thoracic.png)、[1280](heart2-c-review-screenshots/1280-aorta-thoracic.png)
- aorta-abdominal：[390](heart2-c-review-screenshots/390-aorta-abdominal.png)、[1280](heart2-c-review-screenshots/1280-aorta-abdominal.png)
- arch-closeup：[390](heart2-c-review-screenshots/390-arch-closeup.png)、[1280](heart2-c-review-screenshots/1280-arch-closeup.png)
- electrical-aligned：[390](heart2-c-review-screenshots/390-electrical-aligned.png)、[1280](heart2-c-review-screenshots/1280-electrical-aligned.png)
- electrical-aligned-full-page：[390](heart2-c-review-screenshots/390-electrical-aligned-full-page.png)、[1280](heart2-c-review-screenshots/1280-electrical-aligned-full-page.png)
- pulse：[390](heart2-c-review-screenshots/390-pulse.png)、[1280](heart2-c-review-screenshots/1280-pulse.png)
- right-hand：[390](heart2-c-review-screenshots/390-right-hand.png)、[1280](heart2-c-review-screenshots/1280-right-hand.png)
- blood-pressure-measurement-node-01：[390](heart2-c-review-screenshots/390-blood-pressure-measurement-node-01.png)、[1280](heart2-c-review-screenshots/1280-blood-pressure-measurement-node-01.png)
- blood-types-node-01：[390](heart2-c-review-screenshots/390-blood-types-node-01.png)、[1280](heart2-c-review-screenshots/1280-blood-types-node-01.png)
- capillary-exchange-node-01：[390](heart2-c-review-screenshots/390-capillary-exchange-node-01.png)、[1280](heart2-c-review-screenshots/1280-capillary-exchange-node-01.png)
