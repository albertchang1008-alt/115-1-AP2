# 手機主畫面說明實作報告（2026-10-14）

## 修改
- `public/guide/index.html` 在登入後逐字加入交辦HTML「2. 加到手機主畫面」；本節不放截圖。原2–10標題與id順延為3–11。
- `guide.css` 清單16px、小標18px，行距1.8／1.5；列印避免小標和步驟斷裂。
- `guide-verify.mjs` 同步11節、清單數量、手機字級、預設／特大無水平溢位、列印可讀、產物站別與子路徑資源HTTP200。
- 登入程式、Excel及學生資料未改；未push或部署。

## 技術核對
- `public/manifest.webmanifest` 為`display: standalone`，start_url／scope皆相對路徑。
- `index.html` 已有apple-touch-icon與apple-mobile-web-app-title（課序）。
- `src/service.ts` 仍使用signInWithPopup，這次不改登入方式。
- AP2／MI build實際manifest、apple圖示與192／512圖示，透過本機HTTP server分別掛在`/115-1-AP2/`與`/115-MI/`，所有解析後路徑留在站別子路徑並取得HTTP200。這是本機產物檢查，未發布新版。

## 驗證
- AP2完整check：前端158、Functions54，0 fail／0 skipped。
- MI乾淨release匯出套入本次三份共用修改完整check：前端150、Functions54，0 fail／0 skipped。目錄`/private/tmp/guide-homescreen-mi-q0zv6kni`，無Git或未追蹤教材；共用分支保留AP2教材，MI需用其專屬教材樹檢查。
- 兩站guide驗證：1280／390皆11節、主畫面清單10步／5注意、最小16px、預設／特大無水平捲動、無pageerror、print通過。全文含「加入主畫面」與「加到主畫面」。
- 證據：`docs/unify-1.9.0/guide-homescreen-{ap2,mi}/`有全頁截圖、A4列印PDF及verification.json；同層check／verify.txt完整輸出。
- 合併後MI check結果由MI交接補充；兩站共用guide來源一致，待Claude複驗。

## 教師真機實測（尚待教師執行，Codex不代做）
使用test帳號，iPhone（Safari）與Android（Chrome）各完成：
1. 按說明加入主畫面。
2. 從課序圖示開啟。
3. Google登入。
4. 做一題練習，確認紀錄保存。
5. 關掉再開，確認仍在登入狀態。

iPhone standalone下popup可能失敗；若教師實測失敗，依交辦把注意第3點改為「若主畫面圖示無法登入，請改用 Safari 直接開網址」，另列待辦評估standalone redirect登入。本次保留交辦原文；真機結果未取得。

## 發布界線
本次只本機提交與合併release/mi-1.9.0，停下交Claude複驗；不續作部署。MI前次migration已成功，不可重跑apply；Functions的deleteCourse失敗仍為獨立部署阻塞。
