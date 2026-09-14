#!/usr/bin/env bash
set -euo pipefail

# 一鍵上線腳本：把目前分支合併進 main、推上 GitHub（GitHub Actions 會自動
# 重新建置並發布網站），再部署 Firebase Cloud Functions。
#
# 執行前必須先做過一次（只需一次，之後這台電腦都不用再做）：
#   npx firebase-tools login
# 用有 ap2-7ed91 專案權限的 Google 帳號登入，跳出瀏覽器視窗完成授權即可。
# 沒登入的話，最後一步部署 Functions 會失敗，前面 push/合併/網站部署不受影響。
#
# 用法：在專案根目錄執行
#   bash scripts/deploy.sh
#
# 會依序做：
#   1. 檢查工作目錄乾淨、目前不是在 main 上
#   2. 本機先跑一次測試、型別檢查、build（npm run check），有錯就停下來，
#      不會把有問題的版本推上去
#   3. push 目前分支到 GitHub 備份
#   4. 切換到 main、合併目前分支、push main（觸發網站自動上線）
#   5. 部署 Firebase Cloud Functions
#
# 任何一步失敗腳本就會停止，不會跳過繼續做。過程中會問一次「要不要繼續」，
# 輸入 y 才會真的動到 main 與正式環境。

BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ]; then
  echo "目前就在 main 分支上，沒有其他分支可以合併，中止。"
  echo "請先切到要上線的分支（例如 git checkout feature/1.2.0-bank-import）再執行。"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "工作目錄有未提交的變更，請先 commit 或處理乾淨再執行。"
  git status --short
  exit 1
fi

echo "== 即將把「$BRANCH」合併進 main 並上線 =="
echo "這會更新正式網站，也會部署正式 Firebase Cloud Functions。"
read -r -p "確定要繼續嗎？[y/N] " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "已取消，沒有做任何變更。"
  exit 0
fi

echo
echo "== 1/5 安裝套件 =="
npm ci
npm --prefix functions ci

echo
echo "== 2/5 本機測試、型別檢查、build（有錯就停） =="
npm run check

echo
echo "== 3/5 push 「$BRANCH」到 GitHub 備份 =="
git push origin "$BRANCH"

echo
echo "== 4/5 合併進 main 並 push（GitHub Actions 會自動重新建置並上線網站） =="
git checkout main
git pull origin main
git merge --no-ff "$BRANCH" -m "merge $BRANCH"
git push origin main
git checkout "$BRANCH"

echo
echo "== 5/5 部署 Firebase Cloud Functions =="
if ! npx firebase-tools login:list 2>&1 | grep -q '@'; then
  echo "尚未登入 Firebase CLI，略過 Functions 部署。"
  echo "請先執行「npx firebase-tools login」登入後，再手動執行："
  echo "  npx firebase-tools deploy --only functions"
else
  npx firebase-tools deploy --only functions
fi

echo
echo "== 完成 =="
echo "main 已推上 GitHub，網站幾分鐘後會自動重新上線，可以到 repo 的 Actions 分頁看進度。"
