# 給 Claude 的摘要
- Codex 以第一次使用的學生角度，逐關只看截圖重看「我知道要點哪裡嗎」；最終七段在兩尺寸皆為「是」。
- 本紀錄的判斷只依截圖中的文字、高亮與淡化，不以程式碼或交辦內容補足操作指示。
- 自試過程曾發現 N05 暫態箭向、選項／送出同時亮起、配錯後不能改等卡點；均繼續修正並重測。
- 本輪是 Codex 自我試做紀錄，下一關仍交 Antigravity 獨立新手試做覆核。

## 只看畫面的逐關紀錄

問題固定為：「我第一次看到這個畫面，知道現在要點哪裡嗎？」這裡記操作是否明確，沒有把答對學科題當成介面通過的證據。每段均打開 1280×800 與 390×844 的第1步截圖，再開第2步確認題目出現後也知道先選答案、再送出。

| 關卡 | 1280／390 | 只看畫面得到的理由 | 第1步證據 |
|---|---|---|---|
| N01 | 是／是 | 上方明寫「換你了！① 點一張標籤」，下方只有三張標籤有金框；功能格沒有器官名，也沒有肺／腎圖案直接送答案。 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N01-step1.png) · [390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N01-step1.png) |
| N02 | 是／是 | 上方叫我點分子格，只有分子選項亮起；分母暫時淡化，所以不會兩處一起做。 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N02-step1.png) · [390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N02-step1.png) |
| N03 | 是／是 | 「點圖上的緩衝物承接H⁺」與唯一金框按鈕文字相同，先按它，不必同時配下面三列。 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N03-step1.png) · [390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N03-step1.png) |
| N04 | 是／是 | 命令與唯一亮起的「有效CO₂排出增加」按鈕一致，右側還沒有問答。 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N04-step1.png) · [390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N04-step1.png) |
| N05 | 是／是 | 上方明寫點H⁺箭頭本體，第一條箭頭金色，第二條淡化；兩條箭頭完整可見，文字不蓋箭身。 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N05-step1.png) · [390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N05-step1.png) |
| N06 | 是／是 | 明寫先點H⁺，圖上的H⁺有金框，NH₃與去向選項尚不能點。 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-N06-step1.png) · [390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N06-step1.png) |
| trace | 是／是 | 上方叫我先選緩衝接住H⁺後的狀態，只亮第一格；後兩格淡化，不會以為要同時填三格。 | [1280](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/1280x800-trace-step1.png) · [390](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-trace-step1.png) |

第2步六關的上方均寫「② 第2步：點一個答案」，選項有金框、送出暫時淡化；選完才亮送出。N05 這一步才出四選一，箭頭已校正且文字與箭向一致。結尾選第一格後，上方改叫我選肺端排出物；再選完才叫我選腎端去向，三格選完才亮提交回憶。

## 曾出現「否」與繼續修改

| 卡點 | 當時為什麼不知道怎麼做 | 後續修改與再試 |
|---|---|---|
| N05 初版截圖 | 箭頭在初始動畫中與旁邊方向文字短暫不一致，無法確定到底哪個才是要翻的方向。 | 移除初始自動翻轉，只在點擊時播放0.3秒動畫；重拍前等有限動畫結束，再核對箭向與文字一致。 |
| 第2步初版 | 選項與送出鍵同時高亮，不知道是否可以直接送出。 | 先只亮選項；選完才亮送出，且上方改為「已選好，現在點送出」。錯誤答案仍能重新選。 |
| N02 圖上配錯 | 高亮仍停在開始答題，原欄位不能改，不知道怎麼回去修正。 | 上方重新叫我點分子格，紅框錯處中的選項重新亮起；修正後才回到開始答題。見 [390修正畫面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-23/.worktrees/plain-language-110/docs/urinary-release/acidbase-full/ux-guide/shots/390x844-N02-repair.png)。 |
| N01 示範初版 | 示範期間再看一次按鈕也亮起，可能以為要先按它。 | 示範中停用並淡化再看一次，只示意標籤與目標格；三秒後復原，顯示「換你了」。 |

最終自試無留下「否」。N01 示範結束後標籤歸位，沒有計入任務完成；另實際重播一次，仍不送分。圖上配錯、預測答錯、結尾第一格選錯的修正路徑亦用真實點選確認可走通，沒有用注入完成狀態跳過。
