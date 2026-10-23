# 呼吸七份整合報告：停點一（2026-10-15）

**整合已完成；本機merge commit以本目錄git log -1為準，本次不push。** 最終SHA請以此目錄 `git log -1` 與交件訊息為準，Claude核對最終SHA、diff及下列證據後，才可另行授權Pages-only發布。沒有部署Functions／rules／indexes，沒有平台同步或Google Sheet寫入。

## 整合方式與範圍

- 獨立目錄：`/Users/HHC/.codex/worktrees/respiratory-release-2026-10-15/課程平台1.0`。
- 分支 `codex/respiratory-release-2026-10-15`；第一父提交為最新main `8e61f58`，第二父提交為呼吸 `f541b29`（包含f71a45b）。一般merge保留歷史，原呼吸分支與其他worktree未切換／清除。
- 六個衝突依核可計畫逐檔處理：忽略規則取兩邊聯集；catalog保留main的ALL目錄、MI過濾、SITE網址與兩筆MI登錄，只加七份呼吸；palette保留兩筆MI色相再加七筆呼吸；README從整合目錄重生、只多七列；交接採1.9.0現況，日誌保留main及呼吸兩邊全部新增歷史。
- 只補一個先前漏追蹤的執行來源 `materials-src/widgets/oxygen-curve.js`，SHA `d105171bd96c72f95a6652fe76b3c79970cafdc3505a54dcba6a1f7e9cd163a9`；不改曲線。其他新增檔是審查／計畫／驗證文件。
- `git diff origin/main -- functions firestore.rules firestore.indexes.json` **完全空白**，暫存區同樣空白差異。src、Actions、Vite站別、shared/site、Firebase設定與版本／套件鎖檔亦無差異。
- main既有公開教材、SDK、guide等67檔逐位元不變；呼吸來源／圖檔／Excel保護檔逐位元對應f541b29，七份HTML均保持核可SHA，Excel仍304題。本輪沒有重新寫入題庫。

[完整diff路徑](integration/changed-paths.json)、[runtime diff（閱讀用）](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/integration/runtime-diff.txt)、[完整驗證](integration-verification.json)、[範圍保護](integration/scope-integrity.json)、[兩站清單JSON](integration/site-materials.json)。

## 必要驗證結果

| 檢查 | 結果 |
|---|---|
| npm ci／functions ci | 依鎖檔全新安裝成功，未改鎖檔 |
| 版本 | 1.9.0一致 |
| 節點稽核 | 21學生教材／15 kit來源通過 |
| materials測試 | 20／20，零skip |
| AP2完整npm run check | 前端158／158、Functions54／54，零fail／skip，兩端build通過 |
| 乾淨來源重建 | 僅取Git追蹤來源的暫存複本，七份逐一preview，七份HTML SHA均與f541b29相同；含o2-co2-transport |
| 七份圖面verify | 7×18＝126狀態（1280／390），底圖與標籤等全部通過 |
| 完整作答回歸 | 五份×兩尺寸＝10頁，全部通過，攔截SDK不寫正式學生資料 |
| AP2打包 | dist/site.json為ap2，38份教材，七份新增HTML SHA與核可版相同 |
| MI站別與打包 | catalog僅2筆、隔離build成功，dist僅2份MI教材＋3份CHP；呼吸教材零筆 |

完整紀錄在 [AP2 check](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/integration/integration-check.log.txt)、[materials測試](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/integration/integration-material-tests.log.txt)、[乾淨重建](integration/rebuild.json)、七份 `integration/verify-<slug>.json`、[作答回歸](integration/interaction-verification.json)、[MI build](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/integration/mi-build.log.txt)。

**額外MI全量測試的既有限制，請Claude一併核對**：本次發布對象是AP2；額外將AP2 repo裁成MI兩份公開教材後跑整套check，158項中149過、9敗，未修改的origin/main相同裁切亦149過、同9項失敗、零skip，新增失敗0。8項依賴被裁掉的AP2教材快照，另1項MI登錄測試期待MI SDK URL，但AP2主線保留的MI教材快照使用AP2 URL。這不是本次合併新增的差異；沒有改測試、補入AP2公開教材或聲稱MI完整check通過。MI目前正式分支不在本次整合／部署範圍。兩份完整log及9項同名對照見 [MI實驗](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/integration/mi-check.log.txt)、[main基準](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/respiratory-release/integration/mi-main-baseline-check.log.txt)、驗證JSON。

目錄同步CLI另遇main既有extensionless TypeScript import問題，使用已安裝tsx的 `NODE_OPTIONS='--import tsx' VITE_SITE_ID=ap2 npm run materials:sync` 成功，未為此修改共用程式。這是本機目錄重生，不是平台後台同步。

## AP2實際教材清單（38筆）

保留main31筆，新增呼吸7筆；AP2既有兩份MI教材仍依main原設計保留，沒有刪除。下列目錄清單同時對應runtime catalog與AP2 dist：

| slug | 本次 |
|---|---|
| `airway-structure-v1` | 新增呼吸 |
| `blood-composition-v1` | 保留main |
| `blood-gas-transport-v1` | 保留main |
| `blood-gas-transport-v2` | 保留main |
| `blood-post-v1` | 保留main |
| `blood-pre-v1` | 保留main |
| `blood-pressure-measurement-v1` | 保留main |
| `blood-pressure-regulation-v1` | 保留main |
| `blood-types-v1` | 保留main |
| `blood-vessels-v1` | 保留main |
| `breathing-mechanics-v1` | 新增呼吸 |
| `capillary-exchange-v1` | 保留main |
| `cardiac-conduction-v1` | 保留main |
| `cardiac-conduction-v2` | 保留main |
| `cardiac-cycle-v1` | 保留main |
| `cardiac-cycle-v2` | 保留main |
| `cardiac-electrical-v1` | 保留main |
| `cardiac-output-v1` | 保留main |
| `circulation-routes-v1` | 保留main |
| `coronary-circulation-v1` | 保留main |
| `course-orientation-v1` | 保留main |
| `ecg-basics-v1` | 保留main |
| `gas-exchange-v1` | 新增呼吸 |
| `heart-structure-v1` | 保留main |
| `heart-structure-v2` | 保留main |
| `hemodynamics-v1` | 保留main |
| `hemostasis-mechanisms-v1` | 保留main |
| `hemostasis-mechanisms-v2` | 保留main |
| `immuno-concepts-review-v1` | 保留main |
| `lung-function-v1` | 新增呼吸 |
| `lungs-pleura-v1` | 新增呼吸 |
| `lymphatic-system-v1` | 保留main |
| `lymphoid-organs-v1` | 保留main |
| `major-vessels-v1` | 保留main |
| `micro-bacteria-review-v1` | 保留main |
| `o2-co2-transport-v1` | 新增呼吸 |
| `rbc-homeostasis-v1` | 保留main |
| `respiratory-control-v1` | 新增呼吸 |

## MI實際教材清單（2筆）

| slug | 本次 |
|---|---|
| `immuno-concepts-review-v1` | 保留main；非呼吸 |
| `micro-bacteria-review-v1` | 保留main；非呼吸 |

MI基底網址為 `https://albertchang1008-alt.github.io/115-MI/materials/`，AP2基底為 `https://albertchang1008-alt.github.io/115-1-AP2/materials/`。MI驗證產物只有這兩個教材目錄，外加 `CHP07_immune_infographic.html`、`CHP08_hypersensitivity_infographic.html`、`CHP16_mycology_infographic.html`；完整清單在site-materials.json。未向MI remote或Firebase部署。

## 停點與下一步

正常commit完成後，交Claude檢查該SHA的雙親、相對8e61f58的diff、兩站清單、後端零差異、七份快照與上列額外MI限制；**未取得最終SHA核可前不push任何分支或main**。本機整合目錄將保持乾淨，原根目錄的其他工作保留。若後續origin/main改動，重新整合／驗證，不沿用此SHA直接force。

教師已核可Pages-only路徑，因此後續只能依計畫第6節核准SHA的普通push，不執行deploy.sh、Functions部署或migration；發布後再依第7節七頁HTTP／SHA與桌手機檢查停點二。平台同步始終由教師另行操作。[Codex]
