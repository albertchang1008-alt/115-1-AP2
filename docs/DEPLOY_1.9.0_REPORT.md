# 1.9.0 AP2 部署與 MI 準備交接（2026-10-13）

## 現況：A 段發現 Actions 失敗，B 段未開始

教師已授權部署1.9.0、AP2不加入微生物22題（Excel不動），並於本輪明確授權AP2規則／索引。
依交辦「任何一步失敗就停下」，本輪發現GitHub Actions失敗後停止；沒有自行修程式、重跑Actions或回退線上資料。

## 已完成
- Claude複驗3a49056通過，記錄提交40d3ec4；原deploy.sh前工作目錄乾淨。
- fetch兩遠端成功，origin/main@a593796是驗收版本祖先。AP2 VITE_SITE_ID未設，workflow預設ap2。
- 上輪deploy.sh完整check：前端157／Functions54，0 fail／0 skipped；版本與51後端入口通過。
- AP2 Functions部署成功，普通push備份分支與origin/main至40d3ec4。本機main未改。
- 本輪執行：
  firebase deploy --only firestore:rules,firestore:indexes --project ap2-7ed91 --non-interactive
  CLI exit0、Deploy complete，rules編譯／發布成功，indexes部署成功。
- 未加force；CLI没有提示刪除索引，沒有執行刪除。
- rules仍全面deny，增加反思子路徑明確deny；索引新增assessmentSessions集合群組state＋expiresAt。
- 上輪自動審查拒絕已由本輪教師明確授權解除；不再是當前停止原因。

## 當前停止原因
GitHub Actions：
https://github.com/albertchang1008-alt/115-1-AP2/actions/runs/38422029549
- 對象40d3ec489642031f06142eecff5e1969abb8de9e，run63，結論failure。
- build job115381569171的npm run check失敗：前端157項，155 pass／2 fail／0 skipped。
- tests/site.test.ts兩項歷史比對失敗：
  1. MI migration dry-run與70354e0常數比對：git show exit128（預期0）。
  2. MI簡報轉換與70354e0比對：interactiveSlideHTML is not a function。
- checkout日誌fetch-depth=1，僅抓AP2目前commit；新增測試依賴本機MI70354e0歷史，CI無該物件。本機完整Git物件庫的check不能代表此CI環境。
- configure-pages／upload-pages-artifact／deploy均skipped；不能宣稱1.9.0前端已發布。
- 最小失敗摘要存docs/unify-1.9.0/ap2-actions-failure.json。

## 尚未完成／後續方向
1. 修正CI歷史比對的依賴（保留完整測試與逐字比對，可用有來源／雜湊的歷史fixture或明確取得MI固定commit）；不能跳過測試。需教師指示後續修正與再發布。
2. 索引部署成功不等於READY；READY及expireAssessments缺索引錯誤消失尚未驗證。未手動觸發排程，未讀寫學生文件。
3. Actions成功後，再做同網站設定本機build與線上JS雜湊比對、測試班三新功能關閉與guide可開。
4. B段全部尚未開始：release/mi-1.9.0、合併／逐項衝突報告、MI完整check、離線migration dry-run、網站變數核對、本機commit、Claude複驗。
5. MI實際前輪fetch／ls-remote main=70354e0，非交辦d48aac8；後续須重查基底並保留影片續播與測驗種類重設修正（unify已移植）。

本輪未修改Excel、正式學生資料／成績；未push mi／apply／部署MI Functions；未force push／no-verify／略過測試。
root原feature/respiratory-infographics與既有未提交教材工作保留；unify的停止紀錄只本機commit，不再推main。
