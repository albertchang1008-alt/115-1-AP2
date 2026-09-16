#!/bin/bash
# 雙擊這個檔案就會啟動「教材工作室」：自動開一個終端機視窗跑本機伺服器，
# 準備好後會自動跳出瀏覽器分頁（http://127.0.0.1:5183/）。
# 這個視窗開著＝工具在執行中；用完直接關閉這個終端機視窗（或按 Ctrl+C）即可結束，
# 不會留下背景程式，也不會執行任何 git 指令。
cd "$(dirname "$0")" || { echo '找不到專案資料夾'; read -p '按 Enter 關閉視窗'; exit 1; }
echo '正在啟動教材工作室…'
npm run materials:studio
status=$?
if [ $status -ne 0 ]; then
  echo ''
  echo '⚠️ 啟動失敗（結束代碼：'"$status"'）。'
  echo '可能是還沒安裝套件，請把上面的錯誤訊息截圖回報。'
  read -p '按 Enter 關閉視窗'
fi
