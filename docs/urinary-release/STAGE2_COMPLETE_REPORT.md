# 完整製作：階段二報告

五份標籤層完成。28張SVG、76個兩尺寸圖面案例、132張引線crop、100張標準全頁shots通過。原圖、題目及機器來源保留。

| 教材 | schema／NodeText／來源卡 | 幾何案例 | 標準shots | 錯誤 |
|---|---|---|---|---|
| nephron-circulation | 通過 | 16 | 20 | 0 |
| filtration-clearance | 通過 | 14 | 20 | 0 |
| tubular-handling | 通過 | 12 | 20 | 0 |
| urine-concentration | 通過 | 18 | 20 | 0 |
| urinary-route-micturition | 通過 | 16 | 20 | 0 |

- 白名單、原圖SHA與原像素錨點：labels/anchors.json；crop路徑與檢查結果：labels/verification.json；圖面：labels/screenshots/、labels/crops/。
- 六份來源／用詞：content-audit.json，來源卡全為reviewed、掃描無命中；本階段未重排題目選項。
- 鉀血→管液、鈉管液→血；膀胱頸旁腺體未標；男女圖原上下排列和白色間隔保留。
- 圖面複查修正血管分支、S2–S4、尿道等錨點；再次檢查一組引線交叉後，改小葉間動脈同支血管的近端落點，最後全76案例重跑通過。未改檢查門檻。
- 新錨點擷取腳本原將overview誤當slug前綴，StopIteration；按地圖實際overview欄位修正後成功（1/2次）。新圖層與驗證腳本無工具例外。
- 報告產生腳本遇非UTF-8 stdin，改用直接文字寫入（1/2次）；原階段二提交漏報告，補齊後amend同一階段提交。之後shell採set -e避免錯誤後繼續提交。
- 六個資料圖位留階段三替換。尿路第六節無底圖，caption維持「本節圖待製作」。非解剖概念列功能說明，沒有虛構解剖定位；底圖粒子顏色不作Na/K身分依據。

| 箭頭用途 | 色碼 | 文法 |
|---|---|---|
| 水／濾液 | #0072B2 | 實心粗箭頭 |
| 離子 | #CC79A7 | 實心粗箭頭 |
| 尿液 | #E69F00 | 實心粗箭頭 |
| 血流 | #D55E00 | 實心粗箭頭 |
| 神經／激素 | #444444 | 細虛線箭頭 |
| 引線／錨點 | #333333／#222222 | 引線＋圓點 |
| 重點 | #b4233a | 紅色粗體 |

本階段commit為git log「完成泌尿階段二」（amend後SHA以git log為準）。續做階段三。
