#!/bin/bash
# 雙擊這個檔案就會啟動「教材工作室」：自動開一個終端機視窗跑本機伺服器，
# 準備好後會自動跳出瀏覽器分頁（http://127.0.0.1:5183/）。
# 這個視窗開著＝工具在執行中；用完直接關閉這個終端機視窗（或按 Ctrl+C）即可結束，
# 不會留下背景程式，也不會執行任何 git 指令。
cd "$(dirname "$0")" || { echo '找不到專案資料夾'; read -p '按 Enter 關閉視窗'; exit 1; }
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  nvm use 22.23.2 >/dev/null 2>&1
fi
# 已有服務時：程式檔沒更新就直接開啟；程式檔比服務新（或是不支援版本檢查的舊服務）就關掉重開，
# 避免沿用舊的稽核邏輯（例如把元件庫教材誤判成 1 個節點）。
if curl -fsS http://127.0.0.1:5183/ >/dev/null 2>&1; then
  running="$(curl -fsS http://127.0.0.1:5183/api/version 2>/dev/null | sed -n 's/.*"version":\([0-9]*\).*/\1/p')"
  latest="$(stat -f %m scripts/materials.mjs scripts/materials-studio.mjs scripts/materials-studio.html 2>/dev/null | sort -n | tail -1)"
  if [ -n "$running" ] && [ -n "$latest" ] && [ "$running" -ge "$latest" ]; then
    echo '教材工作室已在執行，正在開啟瀏覽器…'
    open 'http://127.0.0.1:5183/'
    exit 0
  fi
  echo '偵測到教材工作室程式已更新，正在重新啟動…'
  lsof -ti tcp:5183 | xargs kill 2>/dev/null
  sleep 1
fi
echo '正在啟動教材工作室…'
npm run materials:studio
status=$?
if [ $status -ne 0 ]; then
  echo ''
  echo '⚠️ 啟動失敗（結束代碼：'"$status"'）。'
  echo '可能是還沒安裝套件，請把上面的錯誤訊息截圖回報。'
  read -p '按 Enter 關閉視窗'
fi
