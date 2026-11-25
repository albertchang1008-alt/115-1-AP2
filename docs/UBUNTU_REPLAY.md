# Ubuntu 非 root 重播（Mac 本機 Colima＋Docker）

教師 2026-11-24 建立。用途：部署前在與 GitHub Actions `ubuntu-latest` 相同的環境（x86_64、Node 22、Google Chrome、非 root）跑全套檢查，抓出 Mac 測不到的問題（寫死 /Users 路徑、檔名大小寫、Chrome 量測差異、非 root 權限）。取代雲端重播（雲端 Bash 無法連 npm，且需搬 8 GB repo）。

## 一次性安裝（已在教師 Mac 完成，2026-11-24）
1. Homebrew：`brew -v`（教師機為 7.0.13）。
2. Rosetta：`softwareupdate --install-rosetta --agree-to-license`（Apple Silicon 跑 x86_64 容器需要；Chrome 沒有 ARM Linux 版）。
3. `brew install colima docker`（Colima 0.10.3、Docker CLI 29.10.0；Colima 開源免費，無 Docker Desktop／OrbStack 的授權疑慮）。
4. 第一次啟動：`colima start --vm-type vz --vz-rosetta --cpu 4 --memory 8 --disk 60`（設定會記住，之後只要 `colima start`）。
5. 驗證：`docker run --rm --platform linux/amd64 ubuntu:24.04 uname -m` → `x86_64`。

## 重播工具（repo 外）
位置：`~/Documents/ChatGPT/課程平台-私有/ubuntu-replay/`
- `Dockerfile`：映像 `ap2-replay:node22`＝Ubuntu 24.04 amd64、NodeSource Node 22、google-chrome-stable、Noto CJK 字型、JRE 21、Firebase CLI 15.36.0、使用者 `runner`（UID 1001）。第一次 build 約 3 分鐘，之後用快取。
- `ubuntu-replay.sh`：在 Mac 執行。`git archive` 打包指定 commit（不碰工作樹）→ build 映像 → 跑容器 → `docker cp` 取回證據。
- `in-container.sh`：容器內以 runner 依序跑 00-env、01-extract、02-tree（核對 tree 與 commit 相同）、03 `npm ci`（前後端）、04 Playwright 系統相依、05 驗證映像內的 Google Chrome（CHROME_PATH）、06 `READABILITY_ALL=1 npm run check`、07 `readability:check`（快取命中）、08 `version:check`、09 Zuvio e2e（`CHROME_PATH=/usr/bin/google-chrome`）、10 平台小考 Firestore 模擬器（僅 demo 專案）、11 平台小考瀏覽器驗收、12 工作樹乾淨。10／11 只在提交含其腳本時執行。任一步失敗結束碼 1；tree 不符即停止。

## 使用
```sh
colima start
caffeinate -i bash ~/Documents/ChatGPT/課程平台-私有/ubuntu-replay/ubuntu-replay.sh [commit，預設 781bed78] [repo 路徑]
colima stop   # 跑完釋放記憶體
```
- 證據：`課程平台-驗收證據/<日期>/ubuntu-replay-<sha8>-<HHMM>/`，含 `summary.txt` 與各步驟 log。小考輸出在 `10-quiz-emulator.log`、`11-quiz-browser.log` 及 `platform-quiz-browser/summary.json`。照 handoff 鐵則 13 保存 7 天。
- 全套約 30–60 分鐘（x86_64 經 Rosetta 轉譯，比 Mac 原生慢）。
- 執行者跑完交 Claude 審原始證據；執行者不得自判通過。

## 已知問題與維護
- macOS 內建 bash 3.2：變數後緊接中文字會被當成變數名（`$SHORT（` → unbound variable），一律寫 `${VAR}`。
- tree 核對：repo 有提交時即為 CRLF 的檔案（如 `tests/fixtures/zuvio/W8-import.csv`），`.gitattributes` 的 `text=auto` 會在重新 add 時轉 LF 造成 tree 不符；核對時以 `.git/info/attributes` 設 `* -text` 原樣比對。
- tree 核對：repo 有 419 個已追蹤但符合 `.gitignore` 的檔案（如 `docs/urinary-release/**/verify/*.json`），重新 add 必須用 `git add -A -f`，否則會漏檔。
- HEAD：重播複本只 init／add 不 commit 時，`git rev-parse HEAD` 失敗（Zuvio e2e 寫 manifest 用到）且 10-clean 全是 A；2026-11-24 已在 step 02 tree 相符後補本地 commit（HEAD 的 tree 與原提交相同，SHA 不同）。
- 更新 Chrome／Node：`docker build --no-cache --platform linux/amd64 -t ap2-replay:node22 ~/Documents/ChatGPT/課程平台-私有/ubuntu-replay`。
- 清磁碟：`docker system prune`；Colima 磁碟上限 60 GB。
- 待定：工具目前在 repo 外；若要納入版控，交 Codex 移到 `scripts/ubuntu-replay/` 並改預設 commit 為參數必填。
