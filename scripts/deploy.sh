#!/usr/bin/env bash
set -euo pipefail

# 用法：bash scripts/deploy.sh（可從任何目錄執行）
# 先安裝 Firebase CLI 並登入：npm install -g firebase-tools && firebase login
# 也可使用已快取的 npx firebase-tools；本腳本不自動下載 CLI。
# 預檢 → 確認 → npm ci / check → 分支備份 → Functions → push main。
# 分支須包含本機與遠端 main；不在部署途中合併未測試的程式。
# main push 只觸發 Pages 工作流程，成功上線仍須查看 GitHub Actions。

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail() { echo "錯誤：$*" >&2; exit 1; }
for tool in git node npm; do
  command -v "${tool}" >/dev/null || fail "缺少 ${tool}。"
done
BRANCH=$(git branch --show-current)
[ -n "${BRANCH}" ] && [ "${BRANCH}" != main ] || fail "請切到要部署的功能分支（不可為 main 或 detached HEAD）。"
[ -z "$(git status --porcelain)" ] || fail "工作目錄有未提交或未追蹤的檔案，請先處理。"
REVISION=$(git rev-parse HEAD)
PROJECT=ap2-7ed91
node -e 'const fs=require("fs"); if(JSON.parse(fs.readFileSync(".firebaserc")).projects?.default !== process.argv[1]) process.exit(1)' "${PROJECT}" || fail ".firebaserc 的預設專案必須為 ${PROJECT}。"
if command -v firebase >/dev/null; then
  FIREBASE=(firebase)
else
  command -v npx >/dev/null || fail "請先安裝 Firebase CLI。"
  FIREBASE=(npx --no-install firebase-tools)
fi

STAGE=預檢
BACKEND_STARTED=0
FRONTEND_PUSHED=0
TMP_DIR=$(mktemp -d)
cleanup() {
  result=$?
  rm -rf "${TMP_DIR}"
  if [ "${result}" -ne 0 ]; then
    echo "部署未完成，停止於：${STAGE}。版本：${REVISION}" >&2
    if [ "${BACKEND_STARTED}" -eq 1 ] && [ "${FRONTEND_PUSHED}" -eq 0 ]; then
      echo "後端可能已全部或部分更新；前端 main 推送尚未確認成功。請檢查 Firebase 與遠端 main，勿視為已回復。" >&2
    fi
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# projects:list 會驗證目前憑證及專案可見性（不保證所有部署 IAM 權限）。
"${FIREBASE[@]}" projects:list --json --non-interactive > "${TMP_DIR}/projects.json" || fail "Firebase 憑證或專案查詢失敗；請先登入並確認權限。"
node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(process.argv[1])); if(p.status!=="success" || !Array.isArray(p.result) || !p.result.some(x=>x.projectId===process.argv[2])) process.exit(1)' "${TMP_DIR}/projects.json" "${PROJECT}" || fail "目前 Firebase 憑證無法存取 ${PROJECT}。"
git fetch origin refs/heads/main:refs/remotes/origin/main
for base in refs/heads/main refs/remotes/origin/main; do
  git merge-base --is-ancestor "${base}" "${REVISION}" || fail "待部署分支尚未包含 ${base}；請先整合變更後重新執行。"
done

echo "即將部署 ${BRANCH} (${REVISION}) 到 Firebase ${PROJECT}，再推送此版本到 origin/main。"
echo "main 推送會觸發正式網站發布；後端部署期間舊前端仍在線，變更必須向下相容。"
if ! read -r -p "確定繼續？[y/N] " CONFIRM || [[ "${CONFIRM}" != [yY] ]]; then
  echo "已取消，未推送或部署。"
  exit 0
fi
STAGE=安裝與驗證
# 依 lockfile 安裝，避免以過期本機依賴驗證；每次部署只跑一輪完整 check。
npm ci
npm --prefix functions ci
npm run check
[ "$(git rev-parse HEAD)" = "${REVISION}" ] && [ "$(git branch --show-current)" = "${BRANCH}" ] && [ -z "$(git status --porcelain)" ] || fail "驗證期間程式或分支已變動，請重新執行。"
STAGE=備份分支
git push origin "${REVISION}:refs/heads/${BRANCH}"
# 在後端變更前再次檢查遠端，降低發布期間其他人更新 main 的風險。
git fetch origin refs/heads/main:refs/remotes/origin/main
git merge-base --is-ancestor refs/remotes/origin/main "${REVISION}" || fail "遠端 main 已變動，請整合後重新執行。"
STAGE=部署後端
BACKEND_STARTED=1
"${FIREBASE[@]}" deploy --only functions --project "${PROJECT}" --non-interactive
STAGE=推送前端
# 普通快轉 push；若 main 同時有其他變更，拒絕覆寫。不切換或修改本機 main。
git push origin "${REVISION}:refs/heads/main"
FRONTEND_PUSHED=1
echo "Functions 部署成功，origin/main 已推送 ${REVISION}。"
echo "GitHub Pages 發布尚待 Actions 完成；請查看工作流程結果。本機仍停留在 ${BRANCH}，本機 main 未修改。"
