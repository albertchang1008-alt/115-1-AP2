# 給 Claude 的摘要

- 分支fix/acidbase-asterisk，以origin/main 5c4704ce（1.10.2）為底；根目錄未提交工作不動。
- 檔案：ACIDBASE_STUDENT_SCRIPT.md、重建acid-base-homeostasis-v1/index.html、acidbase-script.test.mjs。
- PASS：酸鹼4/4；content-check 210欄／801引句，錯誤0、跳過0；163腳本單元與14個實際畫面狀態的※均0。
- PASS：npm run check，234個前端／共用測試、61個Functions測試全過；版本1.10.2及正式build通過。
- 保留pKa白話句子、題目選項及答案；其他審稿記號改為教師10/24核可註記。
- 偏離：無；第一次沙箱阻擋Chromium／tsx本機IPC，允許本機測試權限後重跑通過，未跳過測試。
- 抽查：第2關確認題390×844截圖及pKa句子；分支diff只有三個實作檔與本報告，不push。

## 修改與驗證

確認題為「pKa 是公式裡固定的數字。pKa 不變時，如果鹼／酸的比值變大，pH 會怎樣？」。
開場pH越小越酸、接球比喻及pKa說明文字保留；移除的僅審稿標記與註記，不改醫學內容。
腳本編譯後163個學生文字單元均不含※；透過實際操作六關，包含第2關確認題，14個狀態可見文字※為0。
sources課本引文保持原樣；full.json、配對結構、選項及答案都沒有變更。
新增兩個斷言：所有學生單元不含※、pKa確認題全文精確相等。

實際指令：
```sh
npm run materials:build -- acid-base-homeostasis
node --test tests/acidbase-script.test.mjs
node scripts/apply-content-check.mjs materials-src/acid-base-homeostasis/full.json --cards '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/01_knowledge' --progress '/Users/HHC/Dropbox/耕莘/antigravity/072026 新的專案/todo_all.jsonl' --student-html public/materials/acid-base-homeostasis-v1/index.html --out /tmp/acidbase-asterisk/content-check.json
npm run check
```
Node 22.23.2。最後補齊教師核可註記後重建，酸鹼4項測試、可見文字與content-check再次通過；學生句子與程式邏輯未再改動。

## 截圖與原始輸出

![第2關確認題390×844](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/acidbase-asterisk/N02-confirm-390x844.png)

證據在repo外：/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/acidbase-asterisk。
包含build、script-test、content-check、npm-check實際輸出及visible-text-check.json。
截圖保存至2026-10-31；manifest列檔名、大小、SHA256。
停在Claude驗收，不push、不部署、不同步。
