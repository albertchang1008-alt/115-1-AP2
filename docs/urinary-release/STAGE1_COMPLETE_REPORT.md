# 完整製作：階段一報告

完成 A 出處小修、B 腎臟標籤及 C 尿路第六節與兩題。依新交辦續作，舊停點與失敗證據保留在 stage2/history-before-complete/ 和舊 STAGE2_REPORT.md；舊報告不是本次最終狀態。

| 教材／範圍 | schema／NodeText | 截圖 | 幾何驗證 | 狀態 |
|---|---|---|---|---|
| 六份 A-only | 前輪 a-comparison.json 通過；來源欄位保留 | — | — | 沿用 |
| kidney-anatomy v1 | 通過 | 標準20張＋圖面18張、35 crops | 18案例通過，兩尺寸；無重疊／越界／水平捲動／pageerror | 完成 |
| urinary-route-micturition v2 C | 通過 | 標準20張 | 標準截圖檢查通過；其餘圖層待階段二 | 完成 C |

- 腎臟錨點表：stage2/ANCHOR_TABLE.md、anchors.json；截圖 stage2/screenshots/、stage2/crops/。
- 後腹腔移至 (230,460) 腎周區；腎皮質移至 (380,660) 外圍皮質；腹膜移至 (295,975)。腎被膜桌機文字改右欄，消除與脂肪囊文字重疊。未改底圖。
- 自寫驗證腳本第二次（最後一次）修正：crop 使用 fullPage:true 後裁取完整文件中的座標，排除視窗外 clip 例外；保留全部原檢查與18案例、兩尺寸門檻。首次修正記錄見舊報告。已用 2/2 次，之後若該腳本再有工具錯誤，依交辦停止。
- 環境 shell 找不到 npm，使用同一 scripts 的 Node 直接入口（--preview）執行；沒有執行 materials:build 或任何 build。此為呼叫環境修正，非腳本程式修正。
- 尿路新題正解位置依前交辦 C 為 foundation-q06=1、case-q05=2，既有選項無重排。新題無前版答案，不列重排比對。新增 ID 依原預覽版本保護升為 v2，未刪舊版。
- C 來源為 reviewed urine-physical-properties，採每日1–2L、比重1.008–1.030、pH約6.0及表列4.6–8.0；最低4.5另註不併成範圍。未納入疾病延伸，圖說依交辦為「本節圖待製作」。
- 全庫節點稽核通過：21已登錄教材、當時全部30份 kit sources（工具成功訊息固定寫15）；共用教材測試20通過、0 skipped。
- 階段一新增引線為深灰 #333333、圓點定位；沒有新增流程箭頭。重點 #b4233a 粗體。
- 本階段 commit 見 git log 的「完成泌尿階段一」；完成後繼續階段二。
