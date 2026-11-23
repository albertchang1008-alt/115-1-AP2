# 閱讀規範增量檢查「共用指紋」縮小範圍實作報告（#68 前置 68a）

## 給 Claude 的摘要
- 改動檔案：`scripts/lib/readability-cache.mjs`、`scripts/readability-cache.json`、`tests/readability-cache.test.ts`、`docs/READABILITY_FINGERPRINT_IMPL_REPORT.md`
- 測試與檢查：PASS（前端 317/317、後端 129/129、build PASS、`readability:record` 17/17 PASS 4864 screens 0 issues）
- 偏離交辦：無（未改 `-ag1`、量測門檻或版本號）
- Mac 實跑耗時：`npm run readability:record` 1067.76s；第二次 `npm run check` 273.46s（其中 `npm run readability:check` 單跑 1.46s，17/17 跳過）
- 只升版本號對照（`17190f46` 基礎）：修改前雜湊整份 `package-lock.json` → 17 份全跑（`skip: 0, run: 17`）；修改後只升 `1.15.9 → 1.15.10` → 17 份全跳過（`skip: 17, run: 0`，0 staticIssues）
- 抽查 1：`scripts/lib/readability-cache.mjs`（`lockFingerprint` 只取播放器 node_modules 與檢查程式外部套件及遞移相依）
- 抽查 2：`scripts/lib/readability-cache.mjs`（`excludeModulesPlugin` 排除 `readability-static.mjs` 及其專屬相依）
- 抽查 3：`scripts/readability-check.mjs#L58-L73`（確認 `auditReadabilityCss` 每次皆在 `planReadability` 與 `traceReads` 之前無條件執行）
- 抽查 4：`tests/readability-cache.test.ts`（10/10 PASS，含 `os.tmpdir()` 合成專案與合成 CSS 負例，無 `/Users` 或 `/private/tmp`）
- 抽查 5：`scripts/readability-cache.json`（Mac 實跑重建，17/17 PASS 紀錄）

---

## 1. 靜態 CSS 檢查查證（先查證、後實作）
- `scripts/readability-check.mjs` 第 58–63 行在 `checkReadability` 開頭即無條件呼叫 `auditReadabilityCss(root, JSON.parse(fs.readFileSync(path.join(root, 'scripts/readability-allowlist.json'))))`（`staticCheck` 預設 `true`），執行時機早於 `planReadability`（第 70 行）與 `traceReads`（第 73 行）。
- 即使 `planReadability` 跳過全部 17 份教材，`report.pass` 仍檢查 `report.summary.staticIssues === 0`（第 259 行），有違規即以 exit code 1 失敗。
- 因此無需修改 `readability-check.mjs` 流程；將 `scripts/lib/readability-static.mjs` 及其專屬相依從 `checker` closure 排除後，靜態檢查仍每次完整執行且不吃快取。

## 2. 實作重點
1. **`package-lock.json` 正規化（`lockFingerprint`）**：
   - 播放器 closure（`./src/Player`、`./src/FontSizePicker`）：從 `esbuild` `metafile.inputs` 提取實際用到的 `node_modules` 套件鍵值（支援 worktree symlink 路徑與巢狀 `node_modules`）。
   - 檢查程式 closure（`scripts/readability-check.mjs`）：從 `metafile.inputs` 與 `metafile.outputs` 提取 `external: true` 的 bare import（排除 Node 內建模組）。
   - 在 `package-lock.json` 的 `packages` 走訪上述套件的 `dependencies` 與現有 `optionalDependencies`，只雜湊 `${key}\0${name}@${version}\0${integrity || ''}`。
   - 根套件 `version` 與無關套件（如 `qrcode-generator`）異動不影響指紋；`package-lock.json` 缺檔、JSON 損毀、缺乏 `packages` 或找不到相依項時，`common` 回傳空字串 `''`（不拋例外，強制全部重量）。
2. **靜態檢查與教材走查分離（`excludeModulesPlugin`）**：
   - 於 `checker` closure 的 esbuild build 加入 `excludeModulesPlugin(root, ['scripts/lib/readability-static.mjs'])`（使用 `realpathSync` 兼容 macOS `/var` → `/private/var` symlink）。
   - `readability-static.mjs` 及其專屬模組／外部套件（`postcss`）不再進入 `checker` closure，`scripts/readability-allowlist.json` 亦不影響教材共用指紋。

## 3. 驗證與對照結果
- **單元測試**：`npx tsx --test tests/readability-cache.test.ts` → 10/10 PASS。
- **Mac 重建紀錄**：`npm run readability:record` → 17/17 PASS（4864 screens、0 issues、0 staticIssues、0 errors），耗時 `1067.76s`。
- **完整檢查**：`npm run check` → 前端 317/317 PASS、build PASS、functions 129/129 PASS、`readability:check` 跳過 17 份（0 staticIssues），總耗時 `273.46s`（單跑 `npm run readability:check` `1.46s`）。
- **同一 commit（`17190f46`）只升版本號對照**：
  - 修改前（`17190f46` 原腳本）：`package-lock.json` 整檔納入雜湊，`skip: 0, run: 17`。
  - 修改後（模擬將 `package-lock.json` 根 `version` 與 `packages[""].version` 改為 `1.15.10`）：`npm run readability:check` 輸出 `READABILITY 未變更跳過 17 份；需要檢查 0 份`，`staticIssues: 0`，隨即還原 `package-lock.json`。
- **可攜性自查**：`grep -rnE "/Users|/private/tmp" scripts/lib/readability-cache.mjs tests/readability-cache.test.ts` → 無命中（`GREP_CLEAN`）。
