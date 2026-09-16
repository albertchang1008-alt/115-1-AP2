# 教材目錄

每份教材使用獨立版本資料夾，例如 `chapter1-v1/index.html`，保留 CSS、JavaScript 與圖片的相對路徑。

GitHub Pages 發布後，將該 HTML 的 HTTPS 網址填入教師後台的 HTML 活動。此目錄中的檔案會公開發布，請勿放入名冊、學生紀錄或金鑰。

完整步驟見專案的 `docs/DEPLOYMENT.md`。

## 新增教材

最簡單的方式：在專案資料夾裡直接雙擊「`教材工作室.command`」，會自動開一個終端機視窗、
啟動本機工具，準備好後跳出瀏覽器分頁（`http://127.0.0.1:5183/`）。照畫面上①匯入②稽核
③寫入教材目錄的順序操作，中途可預覽，貼錯或匯錯了可以在畫面下方的教材清單移除重來。
用完直接關掉那個終端機視窗（或按 Ctrl+C）就會結束，不會留下背景程式，也不會執行任何
git 指令；跑完仍要自己用 GitHub Desktop 確認變更並 push。

也可以自己開終端機下指令，效果一樣：`npm run materials:studio`（跟雙擊「教材工作室.command」
做的事一樣）、`npm run materials:audit`（單獨稽核既有教材）、`npm run materials:sync`
（依 `shared/materials.ts` 單獨重新產生下面的表格）。

## 正式教材版本

| 教材版本 | 正式教材位置 | 驗收設定 |
| --- | --- | --- |
| `course-orientation-v1` | 課程介紹、規範、評量與參訪圖卡 | 8 個學習節點；10 題；10 題全對才送出完成 |
| `hemostasis-mechanisms-v1` | 止血機制與凝血病理圖卡 | 6 個學習節點；11 題 |
| `blood-gas-transport-v1` | 血液氣體運送圖卡 | 6 個學習節點；11 題 |
| `blood-composition-v1` | 血液的組成圖卡 | 6 個學習節點；11 題 |
| `blood-pre-v1` | 血液單元前測（血液組成、造血、止血、淋巴總複習） | 22 個學習節點；10 題；10 題全對才送出完成 |
| `blood-post-v1` | 血液單元後測（全景地圖、機轉流程、易混淆配對、闖關） | 43 個學習節點；15 題；5 關（每關 3 題）全部過關才送出完成 |
