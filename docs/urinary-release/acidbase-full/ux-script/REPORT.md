# 給 Claude 的摘要
- 檔案：新增 `student-script.mjs`、`student.js`、`student.css`；預設完整樣張改由教師核可腳本直接產生。
- PASS：手機 N01 顯示及快取回歸；8 尺寸 576/576；獨立文字比對 144/144，93 必要單元零缺漏、零改寫或額外教學文字。
- PASS：原句檢查 789 次；互動／套件 33/33；npm check 前端 162/162、後端 61/61；全部 0 skipped。
- PASS：原題目、選項、診斷與教材資料未改；其他九份教材 18/18 輸出逐位元相同。
- 證據：[SCRIPT_DIFF.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/SCRIPT_DIFF.txt)、[檢查摘要](CHECK_RESULTS.json)、[144 張截圖及逐張描述](SCREENSHOTS.md)。
- 限制：舊版 N01 空白未在 Chromium 重現；本輪驗證為 Chromium 視窗模擬，未取得 WebKit／實機 Safari 通過證據。
- 差異：新增腳本模式學習門檻；不插入腳本未指定的舊六題基礎階段，保留五個小檢核、排除 N05 小檢核，十題考核原文不變。
- 抽查五組：390 N01 重新整理；提示與逐字回饋；N05 箭頭與字；三格揭圖；A/B 答案＋理由及重試。
- 停點：#6h 停-等Antigravity，依 `ANTIGRAVITY_TASK_acidbase-script-check_2026-10-21.md` 獨立逐字覆核與國中生試做。

## 交件範圍與預覽

實作位置 `.worktrees/acidbase-full`，分支 `codex/acidbase-full`，起點 `81243fa`。本機預覽：[http://127.0.0.1:8783/](http://127.0.0.1:8783/)。

腳本為 `docs/urinary-release/ACIDBASE_STUDENT_SCRIPT.md`，SHA256：`a6f8ae051a98a0460f5ff6019a544d3146b50ecba4011414a7e880bf916c1a4d`；與根目錄教師核可檔逐位元相同。以腳本直接編譯文字，沒有另寫一份學生文案。107 個文字單元包含重用的圖面片段；其中 93 個必要單元都在實際操作過程中出現。來源中另直接擷取的 37 個引號文句全部有對應單元。

開場完整一頁；六關依動作順序出題，第一次到訪顯示該關先認識卡，提示預設收起。錯誤在原位置框紅；成功長出心智圖並提供下一關。保留五個原小檢核，N05 無小檢核。結尾三格循序回答、逐枝揭圖；原十題 A/B 題幹、選項、答案、理由和診斷一字未動，每輪仍為三題雙層及兩題單層，錯題回讀後換另一側。完成事件仍只送一次；reduced-motion 保留靜態結果。

為遵守不改寫：N02 成功回饋保留腳本未加引號的整句「顯示課本例：6.1＋log（26/1.3）≈7.4，正好在正常範圍。」；N03 錯卡彈回後只組合原卡片名稱與原位置文字，沒有另造診斷句。腳本的 Markdown 格式和教師用 ※ 註記不作學生正文。

## 手機 N01 與首次使用回歸

修改前先保存 [兩次新頁面量測](MOBILE_BEFORE.json)、[第一次截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/mobile-before-fresh.png)、[第二次截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/mobile-before-second.png)。兩次 Chromium 390×844 均未重現整頁空白（圖容器高約 451px、SVG 約 302px、無頁面例外）；這不是 Safari 根因證明。

新頁面獨立使用 `student.css` 的穩定高度網格與最小圖高，避免繼承舊版高度規則。HTML 先輸出完整開場備援，再掛載介面。進度使用新 key `acidbase-student-script:2026-10-21-v2`，同時驗證版本、腳本雜湊與進度形狀。配對尚未填完時的稀疏陣列會在 JSON 儲存後變成 null；讀取時正規化空格，避免存取卡片例外。回歸測試實際在第二工作格放卡、重新整理，確認仍有三張卡和三工作格；另驗證無效 JSON、無效進度結構和舊 key 不干擾。

[390×844 N01 作答前](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N01-before.png) 可見全關；卡片與選項預設無已選樣式。六關各種提示、答錯與答對都在 390×844 實際點選測過；N05 物質名稱為箭頭線上的 SVG 文字，依螢幕縮放保持至少 14px。已親自開啟手機 N01、N02、N03、N04、N05、N06 及結尾截圖覆核。

WebKit 預設執行檔版本與已安裝快取不同；另試現有版本未產生有效結果，已停止該嘗試。此項未列為 PASS，也沒有把任何測試設 skip；後續 Antigravity 應補實機 Safari 確認。

## 逐字比對與保護機制

獨立命令 `node scripts/acidbase-script-check.mjs` 實際操作 1280×800、390×844，共 144 狀態。[SCRIPT_DIFF.txt](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/SCRIPT_DIFF.txt) 逐項列來源行號、原文及 OK；[JSON](SCRIPT_DIFF.json) 與 [執行輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/logs/script-copy.txt) 保留機讀證據。每個顯示文字與來源逐字比較，同時反向掃描 DOM：不在核可腳本、任務明許的原小檢核／十題考核或通用按鈕清單中的正文即失敗。測試故意改字與插入額外教學句，確認會報錯。

`node scripts/apply-layout-check.mjs materials-src/acid-base-homeostasis/full.json --out docs/urinary-release/acidbase-full/ux-script` 完整檢查 8 尺寸、每尺寸 72 狀態。[量測](layout-results.json) 包含文字裁切、越界、整頁捲動、14px 下限、頁面例外和逐字結果。獨立文字命令輸出在 `text-check/`，不覆蓋完整 576 狀態量測。

## 測試證據

| 檢查 | 結果 | 證據 |
|---|---|---|
| 腳本文字雙向比對 | 144/144，93 單元、37 引號文句；缺漏／改寫／額外文字皆 0 | [SCRIPT_DIFF](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/SCRIPT_DIFF.txt) |
| 跑版＋文字 | 576/576，0 failed、0 skipped | [量測](layout-results.json)、[輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/logs/layout.txt) |
| 原句與內容檢查 | 789 次來源原句核對，210 個歷史顯示欄位，0 errors、0 skipped | [原句 JSON](content-check.json)、[輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/logs/content.txt) |
| 既有＋新增測試 | 33/33，0 failed、0 skipped | [TAP](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/logs/tests.txt) |
| npm run check | 前端 162/162、後端 61/61；版本、型別及既有檢查鏈通過，0 skipped | [輸出](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/logs/npm-check.txt) |
| 其他九份教材 | 18/18 lab／course 輸出與起點逐位元相同 | [相容性](LEGACY_PARITY.json) |
| 原資料與舊介面 | full.json、apply.json、content.json、心智圖、舊 full.js／full.css 不變 | [雜湊](PROTECTED_DATA.json) |

789 是原內容檢查器對保留作者資料／歷史介面引用的核對次數，並非 789 句新腳本；新學生畫面另外受 93 單元的雙向檢查約束。既有 29 項測試完整保留，涉及歷史介面的兩檔明確使用 `course-legacy` 渲染；新增 4 項直接驗證預設腳本介面、手機快取、逐字檢查反例、完整流程與完成門檻。未以歷史介面測試冒充新介面驗證。

完整樣張的 model 只新增 `scriptMode` 分流：新模式以六關操作、五小檢核、三格回想及五組第二階段作答完成為門檻；舊模式仍要求原六題基礎階段。原作者資料均保留。npm check 自身包含專案既有的前後端建置檢查；未做教材 build、登錄、發布或部署。

重跑互動測試：`node --test tests/apply-*.test.mjs tests/acidbase-full*.test.mjs tests/acidbase-guide.test.mjs tests/acidbase-script.test.mjs`。Node 使用 `/Users/HHC/.nvm/versions/node/v22.23.2/bin`。來源核對命令的 reviewed 卡片和進度位置沿用本案既有設定，未修改教師 reviewed。

## 截圖

[完整 144 張逐張描述](SCREENSHOTS.md)；每關以下四狀態均有桌機與手機，另外含第二動作、小檢核、結尾三枝、考核答案／理由、回讀與完成。

| 關卡／狀態 | 1280×800 | 390×844 |
|---|---|---|
| 開場 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-opening.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-opening.png) |
| N01 動作①前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N01-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N01-before.png) |
| N01 提示展開 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N01-hint.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N01-hint.png) |
| N01 答錯 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N01-wrong.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N01-wrong.png) |
| N01 答對 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N01-correct.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N01-correct.png) |
| N02 動作①前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N02-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N02-before.png) |
| N02 提示展開 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N02-hint.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N02-hint.png) |
| N02 答錯 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N02-wrong.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N02-wrong.png) |
| N02 答對 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N02-correct.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N02-correct.png) |
| N03 動作①前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N03-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N03-before.png) |
| N03 提示展開 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N03-hint.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N03-hint.png) |
| N03 答錯 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N03-wrong.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N03-wrong.png) |
| N03 答對 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N03-correct.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N03-correct.png) |
| N04 動作①前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N04-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N04-before.png) |
| N04 提示展開 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N04-hint.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N04-hint.png) |
| N04 答錯 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N04-wrong.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N04-wrong.png) |
| N04 答對 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N04-correct.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N04-correct.png) |
| N05 動作①前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N05-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N05-before.png) |
| N05 提示展開 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N05-hint.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N05-hint.png) |
| N05 答錯 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N05-wrong.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N05-wrong.png) |
| N05 答對 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N05-correct.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N05-correct.png) |
| N06 動作①前 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N06-before.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N06-before.png) |
| N06 提示展開 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N06-hint.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N06-hint.png) |
| N06 答錯 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N06-wrong.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N06-wrong.png) |
| N06 答對 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-N06-correct.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-N06-correct.png) |
| 結尾遮圖 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-ending-covered.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-ending-covered.png) |
| 結尾完整圖 | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/1280x800-ending-full.png) | [截圖](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-script/shots/390x844-ending-full.png) |

## 交接

清空本輪預覽進度：`localStorage.removeItem('acidbase-student-script:2026-10-21-v2'); location.reload();`。重新啟動預覽：在工作樹執行 `node scripts/acidbase-full-preview.mjs`，只綁定 127.0.0.1。

只在本機提交。根目錄僅同步本輪交件證據、自己的 #6h 與 devlog，handoff 未改；保留根目錄、其他工作樹及本工作樹原有 12 張未追蹤截圖。未 push、合併、部署、Excel／Sheet、正式登錄或發布，未改版本號、題目或 reviewed。
