# 給 Claude 的摘要

- #7 B1–B2：以origin/main 5c4704ce（1.10.2）為底，分支codex/blood-flow-main，工作樹.worktrees/blood-flow-main。
- 最新血流交件的content、widget及7張SVG逐位元一致；只把血流建置擴充接入正式版，保留呼吸／泌尿及解析顯示。
- PASS：216狀態（136一般＋68減少動態＋12深色）、11稽核反例、兩尺寸六節點／11題／完成事件回歸；錯誤0。
- PASS：npm run check前端／共用234、Functions61，版本1.10.2及正式build全過；既有94檔逐檔差異0。
- 偏離：B3停在教師最新下載檔關卡；只找到舊teacher-download底稿，未把自產735檔當教師最新檔。
- 未製作11題增列xlsx／列範本，未繼續B4平台preview；沒有Sheet API、同步、平台寫入、push或部署。
- 抽查1：390／1280肺循環第4步；抽查2：體循環第6步；抽查3：出生後第2項。
- 抽查4：血流專屬build與其他94檔零變動；抽查5：216狀態與互動事件證據。

## 來源與乾淨移植

來源為.worktrees/blood-flow-routes的BLOOD_FLOW_TRAIL_ARROWS_REPORT.md與_FIX_REPORT.md最後方案C。
原工作樹保留，不rebase其未提交工作；新分支直接從origin/main建立。
content.json、blood-flow.js／css、overview及node-01～06 SVG與最新來源一致，source-provenance.json附SHA256。
教材整合提交：a2ebb20c [Codex]；未push或併入main，保留Claude驗收點。
未帶入截圖、_old、node_modules、舊handoff或週誌。未移植會覆蓋正式呼吸／泌尿功能的舊共用檔。

正式build新增public/materials/blood-flow-routes-v1/index.html，並登錄shared/materials.ts及public/materials/README.md。
scripts/blood-flow-build-kit.mjs只在lab.widget為blood-flow時套用3項擴充；共用kit.js／css保持原樣。
materials-build.mjs保留approvedUrinary及oxygen-curve分派；presentation.mjs只新增血流色相。
驗證腳本沿用已驗收版，僅增加BLOOD_EVIDENCE_DIR，讓截圖／JSON可輸出repo外；素材與測試資料保持來源內容。

## 實際驗證

Node 22.23.2；Google Chrome；Noto Sans TC由本機Airiti Reader既有字型載入。
首次一般沙箱的Chromium遭程序權限阻擋，之後以允許本機Chrome的權限重跑，未跳過驗證。

```sh
npm run materials:build -- blood-flow-routes
npm run materials:validate-nodes
export BLOOD_EVIDENCE_DIR=/tmp/blood-flow-main/shots
node scripts/blood-flow-v2-verify.mjs
node scripts/blood-flow-trail-regression.mjs
node scripts/blood-flow-trail-dark-verify.mjs
node scripts/blood-flow-v2-audit-selftest.mjs
node scripts/blood-flow-v2-regression.mjs
npm run check
```

npm run check：234／234前端及共用測試、61／61 Functions測試，0 failed、0 skipped；tsc、版本1.10.2、正式build全過，exit 0。

一般136狀態為兩字型×兩尺寸；減少動態68與深色12，合計216狀態，全部PASS、pageerror 0。
11稽核反例與3個trail反例能擋錯；UI回歸每尺寸6次explore／nodeTime、11題、1次complete，動畫操作SDK事件0。

既有教材與1.10.2零變動：unchanged.json列出94檔SHA256與相等結果，包含既有教材HTML、src、VERSION／package與lock、共用kit。
materials:validate-nodes檢查既有21份學生教材、全部kit來源（包含新血流來源）及10份核可腳本版本；血流實際六節點另由UI回歸逐一打開驗證。

## 關鍵截圖與保存

截圖保存至2026-10-31。原始輸出與manifest：/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main。

| 狀態 | 390×900 | 1280×900 |
|---|---|---|
| 肺循環第4步 | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-pulmonary-step-04-390.png) | [桌面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-pulmonary-step-04-1280.png) |
| 體循環第6步 | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-systemic-step-06-390.png) | [桌面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-systemic-step-06-1280.png) |
| 出生後第2項 | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-fetal-after-step-02-390.png) | [桌面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/blood-flow-main/shots/v2-fetal-after-step-02-1280.png) |

## B3停點

目前只有docs/sheet-backups/2026-10-24-115-1-AP2-teacher-download.xlsx舊底稿，以及本機產生的匯入檔。
沒有提供教師完成匯入後最新115-1-AP2下載檔；teacher-file-gate.json記錄檔名盤點。
依交辦在B3先停，不讀寫任何Sheet，不製作可能覆蓋新增資料的增列檔，不往後做平台preview。
教師提供最新單一分頁下載檔後，才可只新增11列、逐格比對並依#35五欄標準檢查；之後平台登錄仍只preview、不apply。
本輪B1–B2交Claude先驗收；#7停-等Claude，並明列B3等教師檔案的限制。

格式附註：首次git diff --cached --check指出來源3張SVG各1行空白尾端有空格；為保留核可SVG逐位元一致，本次保留，非測試失敗。
