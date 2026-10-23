# 給 Claude 的摘要
- A 全過：十份八尺寸、SCRIPT_DIFF 缺 0 多 0、content-check 全 PASS。
- 實際畫面檢查 6552 案、作答前逐步檢查 1048 案，全過。
- 75/75 教材回歸；npm run check 前端 163/163、Functions 61/61、build PASS。
- 修正順序指示與教學補充過早顯示、確認題殘留答案、裸文字清單及 44px 熱區。
- 故意注入同一核可順序文字：content-check 預期 FAIL、exit 1，證明不是只比來源字串。
- 檔案：materials-src/apply-kit/{scripted-player,student,spatial-figure,spatial-policy,scripted-compile,scripted.css}；新增 pre-answer 檢查與測試。
- 偏離：新增不提示答案的圖面捲動／查看位置導覽；學生腳本本身未改。
- 抽查：filtration N2 390/1280 作答前與正解後、fluid N1、確認題清空、D 可捲到。

## 修正與界線
順序、配對關係與比例教學說明延到答對或明確答錯後；進確認題清掉上一動作回饋與完成標記。選項、題幹及先教再問的認識頁仍保留。酸鹼 N6 第二步保留已完成的前一步反應式；不保留當步去向的答案。
熱區最少 44×44px，圖上位置中心距離最少 48px；圖框可雙向捲動，A–D 查看按鈕逐一置中。測試實際捲動確認各點完整進入可視範圍，不以 DOM 存在冒充可點。
裸文字是核可腳本內容，改為有樣式清單；未刪腳本文字。

## 實際輸出
完整逐案輸出：output/full-0.txt 至 full-2.txt、pre-0.txt 至 pre-2.txt；各份 verified/*/layout-results.json、SCRIPT_DIFF.json、pre-answer.json。
content/*.json 與 *.txt 為十份最終 content-check。output/tests.txt、npm-check.txt、negative-content-check.txt 保留原始輸出。
before/ 為 5c1dab18 原畫面；after/ 為最終修正版，含兩份 390、1280 的作答前及答對後。

|教材|八尺寸案數|作答前案數|結果|
|---|---:|---:|---|
|kidney-anatomy|652|96|PASS|
|nephron-circulation|675|104|PASS|
|filtration-clearance|628|88|PASS|
|tubular-handling|644|104|PASS|
|urine-concentration|654|120|PASS|
|urinary-route-micturition|701|120|PASS|
|fluid-compartments|618|88|PASS|
|water-sodium-regulation|659|104|PASS|
|electrolyte-balance|673|104|PASS|
|acid-base-homeostasis|648|120|PASS|
