# 授課控制台簡報圖轉 Pages 網址與匯入工具結案報告（#6e）

## 給 Codex 的摘要

- **分支與版本**：Worktree `.worktrees/teaching-deck-pages`（分支 `feature/teaching-deck-pages`，基於 `origin/main` `0e3579b7`），版本升至 `1.11.1`（`npm run version:check` 通過），未修改任何 `functions/src/` 後端程式。
- **圖片轉移與新簡報檔**：從兩份私有複習簡報抽取 26 張不重複教材圖，轉為內容雜湊命名 WebP 存入 `public/materials/review-decks-assets/<sha256>.webp`（單檔 `30.8 KB`–`491.6 KB`，皆 ≤ 500 KB；不含答案頁與講者備註）。另產出 `/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/review-combined.deck.json`（28 頁、`109,179 bytes`、0 inline SVG、0 `data:` 圖），原私有檔完全未動。
- **控制台 CSP 與互動開關收公佈**：`src/TeachingControl.tsx` 的 `slideDocument()` 僅放行 `img-src data: https://albertchang1008-alt.github.io;`，維持 `sandbox=""`、`default-src 'none'`、`style-src 'unsafe-inline'`、`font-src 'none'`；Playwright 實測允許 Pages 網域載入並阻擋 `https://evil.example.com`。控制台 28 頁全數載入並跑通互動題「開放作答 → 學生送出 → 結束作答 → 公佈答案（已公佈）」。
- **匯入工具與真實 dry-run**：新增 `scripts/import-teaching-deck.mjs`（預設 `dry-run`，`--write` 先備份既有 `teacherAssets/presentation` 至倉庫外再寫入，不碰 `classroomConfig`）。已對正式 `ap2-7ed91` 跑 `dry-run`（未寫入），見第 5 節。
- **驗證與證據**：Worktree 與無私有路徑乾淨 clone 皆通過 `npm ci && npm run check`（`0 skipped`）。1920 寬度截圖與 `verification.json` 存於 `/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-28/teaching-deck-pages/`（截圖保存至 2026-11-04）。

---

## 1. 圖片轉移至 Pages 清單與含答案名詞之公開教材圖盤點（規格 1）

### 1.1 轉檔規格與結果

- **目標目錄**：`public/materials/review-decks-assets/`
- **圖片總數**：26 張不重複圖片（涵蓋呼吸 14 頁之 14 次引用、泌尿與體液 14 頁之 17 次引用，合計 31 次 `<img>` 引用）。
- **命名與格式**：以 WebP 檔案內容之 SHA-256 命名（`<sha256>.webp`），寬度 `1600px`–`2000px`，單檔大小介於 `30,774 bytes`（30.1 KB）至 `491,614 bytes`（480.1 KB），全數 ≤ 500 KB，26 檔合計 `6,002,526 bytes`（5.72 MB）。
- **不公開原則**：`public/materials/review-decks-assets/` 僅放置這 26 張無題幹／無解析之教材圖，不含任何投影片 HTML、答案頁文字或講者備註。

| # | 原教材圖來源 (`data-source`) | WebP 檔名 (`<sha256>.webp`) | 尺寸 (px) | 大小 (bytes) | 引用投影片 (`slideId`) |
| --- | --- | --- | --- | --- | --- |
| 1 | `airway-structure-node-01.svg` | `2df88dd2695a54cfc01c734a3b6b6e187ab445fcd395fe97807e1809884c59bc.webp` | 1600×1086 | 136,796 | `R-REV-01` |
| 2 | `airway-structure-node-06.svg` | `42209ca236e7c5665abcc314a3830339ce1bbc94c619fa12bcbce6cfc0e3e8ab.webp` | 2000×1160 | 153,966 | `R-REV-02`, `R-REV-05` |
| 3 | `lungs-pleura-node-04.svg` | `25a99b9e1d4b51ae1765eb4d1f709c8d1d9d985ea9c47961b39878dc53b4a0e8.webp` | 1700×1086 | 139,740 | `R-REV-03` |
| 4 | `lungs-pleura-node-03.svg` | `780a1dec5a2767a8797570b27e44a8e78c89b39887b913c102d2f33c8671307a.webp` | 1700×1276 | 187,942 | `R-REV-03` |
| 5 | `breathing-mechanics-node-01.svg` | `bcf739ef7b52d371fa4506455f48fa06098351a6c4dfee1e45d80efcabdb112d.webp` | 1700×4186 | 293,732 | `R-REV-06` |
| 6 | `breathing-mechanics-node-02.svg` | `b95d3f457fdfd2f37b114e1a2f2595c33fd6a4310d6a8845381b2633edcfb854.webp` | 1700×2017 | 244,362 | `R-REV-06` |
| 7 | `breathing-mechanics-node-03.svg` | `d63f9c0b966352594c0486552fd010387563076d7f28570cf2f196e5d4ba9775.webp` | 1700×7308 | 491,614 | `R-REV-08` |
| 8 | `o2-co2-transport-node-01.svg` | `86d62ea2c946257c1d8b5d3a1b7bdb97e2cc6e675a2dc6ecbe4757e5c5aeb2a5.webp` | 1700×1904 | 103,570 | `R-REV-09` |
| 9 | `o2-co2-transport-node-04.svg` | `0bc9da1d0286240961c27f7a2aab66e3a97822e50488e2ca5bd456b519001f74.webp` | 1600×5163 | 161,612 | `R-REV-09` |
| 10 | `o2-co2-transport-node-06.svg` | `34618a80c8e887b8084f7a172bc7aaac5453dd031703de8d1c14f64dcb9cc9cc.webp` | 1700×2050 | 211,396 | `R-REV-11` |
| 11 | `respiratory-control-node-02.svg` | `5cefc51d843bdd6e0d733e8d200c047b5e1ad20125163742e5df1bce0730119f.webp` | 1700×2105 | 271,716 | `R-REV-12`, `R-REV-14` |
| 12 | `respiratory-control-node-04.svg` | `190558ad66c32ae36edab0a82f772e8f78bb919a3b3e2ad7f309bb9785daa518.webp` | 1700×2054 | 259,730 | `R-REV-12` |
| 13 | `kidney-anatomy-node-01.svg` | `f649a938a21e2298c48dc2a5d4e7ca825dd49cff7f5378166985eb2cfbb6408a.webp` | 1700×2939 | 334,658 | `U-REV-01`, `U-REV-02` |
| 14 | `nephron-circulation-node-02.svg` | `a8ea597790cc36f1bb023704f1c6d4e999ec46983e231973835758c43bffe44e.webp` | 1700×3003 | 271,806 | `U-REV-02` |
| 15 | `nephron-circulation-node-05.svg` | `919e261e57fe216dbe2cc0cfa2c19a8140fbdc61c7798513050bc735efb50470.webp` | 1700×3144 | 381,646 | `U-REV-03` |
| 16 | `filtration-clearance-node-06.svg` | `71693d0e94921ee9951e0e7164816e525a544304f2e766f73882271e1bf17a31.webp` | 1700×3024 | 297,674 | `U-REV-03`, `U-REV-05` |
| 17 | `tubular-handling-node-01.svg` | `4b86708e7b8b9d9efa887689eb0e8f8871e162a74868d6a0624ba964712ebad2.webp` | 1700×3144 | 215,004 | `U-REV-06` |
| 18 | `tubular-handling-node-03.svg` | `f668a8aee29b2bef72f65a0e1958fc195f08cd449d1a8a10059b288cf097bccb.webp` | 1700×3704 | 332,426 | `U-REV-06` |
| 19 | `nephron-circulation-node-01.svg` | `5d580bbb0b1027e298ed9f295bc34623dc710ac959c9cec180aec5e6c0c556d1.webp` | 1700×3384 | 192,170 | `U-REV-08` |
| 20 | `kidney-anatomy-node-03.svg` | `16b39630a34567f06cc6ef865013e6033dd651a28dff2efadbf174944262832e.webp` | 1700×2939 | 261,360 | `U-REV-08` |
| 21 | `urine-concentration-node-01.svg` | `670835ecfb48749373238ec255765905d66ce88a88f0b02edad212e03f213bbb.webp` | 1700×2820 | 327,478 | `U-REV-09` |
| 22 | `fluid-compartments-node-01-data.svg` | `1eba1f4df8814c48a820c1c26f008d57bb125f1c67155b35f824fe061d3fe915.webp` | 1600×1200 | 46,260 | `U-REV-09`, `U-REV-10` |
| 23 | `fluid-compartments-node-03-data.svg` | `60826d6562ac9204eb9adeb1d54d5553f327d35988acf9476e09f7e6d433f1e2.webp` | 1600×1760 | 30,774 | `U-REV-11` |
| 24 | `urinary-route-micturition-node-02.svg` | `f82ece8548a9a7c1b3adeb7ab2c24d9f343455d5f3029b8bcd605a99c9a3fb4c.webp` | 1700×2784 | 305,700 | `U-REV-12` |
| 25 | `urinary-route-micturition-node-03.svg` | `fd87e0a0d9a6fb7d9884677eaf459fa547c8b15a192ecda0dd8a121ca6af9c7f.webp` | 1700×2904 | 312,070 | `U-REV-12` |
| 26 | `urinary-route-micturition-node-01.svg` | `d87df727944181720a8cbf5f9c5fc9973aa03f51587868c3cf18426969dcacc9.webp` | 1700×3264 | 237,322 | `U-REV-14` |

### 1.2 公開教材中本身含有答案名詞之圖片清單（規格 1 盤點）

以下圖片原本即存在於公開教材頁（`public/materials/` 對應單元 SVG）中，其圖面標籤帶有與對應互動題相關之專有名詞。**所有互動頁（`R-REV-04/07/10/13`、`U-REV-04/07/13`）皆已移除配圖（0 張圖）**，僅在重點講解頁或公佈答案後之答案頁顯示，且檔名採 SHA-256 雜湊、不含題號或單字：

1. **`o2-co2-transport-node-06.svg` (`34618a80...webp`)**：圖頂標題直接標示「**氯轉移**」及 `HCO3-` 移出、`Cl-` 移入紅血球箭頭（對應 `R-REV-10` 互動題正解；該圖**僅用於答案頁 `R-REV-11`**，`R-REV-10` 互動頁無圖片）。
2. **`airway-structure-node-06.svg` (`42209ca2...webp`)**：圖內標示「主支氣管 → 次級支氣管（肺葉） → 三級支氣管（肺節） → 細支氣管 → 終末細支氣管」階層與軟骨／平滑肌變化（用於重點頁 `R-REV-02` 與答案頁 `R-REV-05`；互動頁 `R-REV-04` 無圖片）。
3. **`breathing-mechanics-node-03.svg` (`d63f9c0b...webp`)**：圖內標示吸氣與呼氣時橫膈收縮、胸腔體積、肺泡內壓（`P_alv`）與氣流方向因果步驟（**僅用於答案頁 `R-REV-08`**；互動頁 `R-REV-07` 無圖片）。
4. **`respiratory-control-node-02.svg` (`5cefc51d...webp`)**：圖內標示血腦障壁（BBB）、`CO2` 擴散進入腦脊髓液（CSF）轉為 `H+` 刺激延腦中樞化學受器（用於重點頁 `R-REV-12` 與答案頁 `R-REV-14`；互動頁 `R-REV-13` 無圖片）。
5. **`filtration-clearance-node-06.svg` (`71693d0e...webp`)**：圖內標示菊糖（Inulin）清除率等於 GFR、PAH 清除率估算有效腎血漿流量 ERPF（用於重點頁 `U-REV-03` 與答案頁 `U-REV-05`；互動頁 `U-REV-04` 無圖片）。
6. **`nephron-circulation-node-01.svg` (`5d580bbb...webp`) 與 `kidney-anatomy-node-03.svg` (`16b39630...webp`)**：圖內標示鮑氏囊、近曲小管、亨利氏環、遠曲小管、集尿管至腎乳頭與小腎盞流向（**僅用於答案頁 `U-REV-08`**；互動頁 `U-REV-07` 無圖片）。
7. **`fluid-compartments-node-03-data.svg` (`60826d65...webp`)**：圖內直接標示「細胞內液 ICF 40%」與「細胞外液 ECF 20%」（**僅用於答案頁 `U-REV-11`**；互動頁 `U-REV-10` 改放僅顯示「總水量 60% 標準示例 / 體重 100%」而不含 40%/20% 答案拆分的 `fluid-compartments-node-01-data.svg` `1eba1f4d...webp`）。
8. **`urinary-route-micturition-node-01.svg` (`d87df727...webp`)**：圖內標示輸尿管斜穿膀胱壁形成生理性防逆流瓣膜（**僅用於答案頁 `U-REV-14`**；互動頁 `U-REV-13` 無圖片）。

---

## 2. 合併簡報檔與原私有檔案保護驗證（規格 2）

- **新產出合併簡報檔**：`/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/review-combined.deck.json`
  - 頁數：28 頁（`R-REV-01`..`R-REV-14`、`U-REV-01`..`U-REV-14`），`slideId` 與 `review-all.interactions.json`、`review-all.answerKeys.json` 100% 對齊。
  - 檔案大小：磁碟 `109,179 bytes`（106.6 KB），JSON 序列化 payload `107,766 bytes`（遠低於 `< 900 KB` 上限與 Firestore `1 MiB` 限制）。
  - 圖片引用格式：全數改為 `<img src="https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/<sha256>.webp" ...>`，`<svg>` 數量 = `0`、`data:` 圖片數量 = `0`。
  - 標題與內部 `<meta>` 清理：補齊 `U-REV-01..14` 原本缺失的頂層 `slide.title` 欄位（取自各頁 `.title` / `<h1>`），並移除原單機版 HTML 內嵌之 `<meta http-equiv="Content-Security-Policy" content="... img-src data:; ...">`，交由 `TeachingControl.tsx` 的 `slideDocument()` 統一控管 CSP。
- **原私有檔完全未動（SHA-256 核對）**：
  - `respiratory.deck.json`：`80b7088e5b619589989761ea67fd69c9bbeb02235569be9514f7267ba277d587`（未變）
  - `urinary-fluid.deck.json`：`ae96879c2118484dbc1eade92c040aa309a6b544cc404347432330904d1dd596`（未變）
  - `rehearsal.html`：`64576a2b655312a7fdf29aca7a64b86da1e044f4119f42b36dbab8934866280c`（未變）
  - `teacher-projector.html`：`2cbd77be4ef3b2fbac7a99b2fc8fe95a4b86214212c45d7e4e677eac634984c9`（未變）

---

## 3. 授課控制台 CSP 驗證（規格 3）

於 `src/TeachingControl.tsx` 的 `slideDocument(body: string)`：

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https://albertchang1008-alt.github.io; font-src 'none';">
```

- 保持 `<iframe sandbox="" ...>`、`default-src 'none'`、`style-src 'unsafe-inline'`、`font-src 'none'` 不變。
- 於 `scripts/teaching-deck-pages-verify.mjs` 與 `tests/teaching-deck-pages.test.ts` 中，在真實 Chromium `sandbox=""` iframe 內同時插入：
  - `https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/2df88dd2695a54cfc01c734a3b6b6e187ab445fcd395fe97807e1809884c59bc.webp` → `complete: true, naturalWidth: 1600`（成功載入）。
  - `https://evil.example.com/pixel.webp` → `complete: true, naturalWidth: 0, evilNetworkRequested: false, cspConsoleLogged: true`（被瀏覽器 CSP 攔截，未發出任何網路請求）。

---

## 4. 控制台互動整合驗證（規格 4）

於 `TeachingControl` 載入 28 頁簡報，逐頁驗證並於互動頁 `R-REV-04`（單選題）與 `U-REV-07`（排序題）完整執行：

1. **開放作答**：老師點擊控制台「開放作答」按鈕，狀態切換為進行中並顯示「結束作答」。
2. **學生送出**：模擬學生於學生端面板作答並點擊「確認送出並鎖定」，顯示「已送出，等待老師公佈答案」。
3. **結束作答**：老師點擊「結束作答」，控制台出現「公佈答案」按鈕；公佈前點擊「顯示結果」投影區僅顯示各選項票數與百分比，不顯示 `✓ 正解` 與解析。
4. **公佈答案**：老師點擊「公佈答案」，按鈕立即變為 disabled 的「`已公佈`」，投影區與學生端同步顯示綠色 `✓ 正解` 標籤與藍色「解析：...」區塊。

---

## 5. 匯入工具 `scripts/import-teaching-deck.mjs` 與真實 Dry-Run 輸出（規格 5）

- **安全防線**：
  - 預設 `dry-run`，不寫入 Firestore，僅讀取現有 `courses/<course>/teacherAssets/presentation` 並輸出新舊頁數、序列化位元組數、差異摘要與檢查結果。
  - 驗證 `slideId` 不重複、總序列化大小 `< 1,048,576 bytes`（1 MiB）、不含 `<svg>`、不含大型 `data:image/`，且所有外部圖片網址均以 `https://albertchang1008-alt.github.io/115-1-AP2/` 開頭。
  - 加上 `--write` 時，會先將既有 `teacherAssets/presentation` 備份至倉庫外（預設 `/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/backups/`），再寫入 `courses/<course>/teacherAssets/presentation`，**完全不讀寫 `classroomConfig`**。
- **對 `ap2-7ed91` (`115-1-AP2`) 執行真實 `dry-run` 輸出**：

```json
{
  "mode": "dry-run",
  "project": "ap2-7ed91",
  "courseId": "115-1-AP2",
  "targetPath": "courses/115-1-AP2/teacherAssets/presentation",
  "touchesClassroomConfig": false,
  "deckFile": "review-combined.deck.json",
  "firestoreReadNote": "ok",
  "existingExists": false,
  "existingTitle": null,
  "existingSlideCount": 0,
  "existingBytes": 0,
  "newTitle": "呼吸系統、泌尿系統與體液平衡 期中考快速複習（28頁合併版）",
  "newSlideCount": 28,
  "newBytes": 107766,
  "newSha256": "f4d1f0bc0863d52a6da523eeeecf68bff478d53c8933687c416146d0bac4ed7c",
  "addedSlideIds": [
    "R-REV-01",
    "R-REV-02",
    "R-REV-03",
    "R-REV-04",
    "R-REV-05",
    "R-REV-06",
    "R-REV-07",
    "R-REV-08",
    "R-REV-09",
    "R-REV-10",
    "R-REV-11",
    "R-REV-12",
    "R-REV-13",
    "R-REV-14",
    "U-REV-01",
    "U-REV-02",
    "U-REV-03",
    "U-REV-04",
    "U-REV-05",
    "U-REV-06",
    "U-REV-07",
    "U-REV-08",
    "U-REV-09",
    "U-REV-10",
    "U-REV-11",
    "U-REV-12",
    "U-REV-13",
    "U-REV-14"
  ],
  "removedSlideIds": [],
  "changedSlideIds": [],
  "unchangedSlideIds": []
}
```

---

## 6. 驗收證據截圖清單（保存至 2026-11-04）

存放目錄：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-28/teaching-deck-pages/`

| 檔案名稱 | 說明 | SHA-256 |
| --- | --- | --- |
| `R-REV-01-1920.png` | 呼吸單元導入頁（含 Pages 教材圖） | `8994e32f5830e8bd0944c076198d1d41cf5529f51b6e7b1d80ee5ff886eab41e` |
| `R-REV-03-1920.png` | 呼吸重點 2（雙圖並排渲染） | `4fe9911f3bcd339cefc7b99317ce38232d3b22999591183eb23064f594f26035` |
| `R-REV-08-1920.png` | 呼吸答案 2（長圖自適應縮放） | `3dd47b5666a61e4974067818051fd428901a0f5b2903a709256914151c1e336d` |
| `R-REV-11-1920.png` | 呼吸答案 3（氯轉移圖於答案頁渲染） | `b7d08e6468afdad6953f96ac7248f4c48e31d6a7518b2fcd990f2f549cbcbbda` |
| `U-REV-01-1920.png` | 泌尿單元導入頁（含 Pages 教材圖） | `8de627b3835800cb897540ccde37640db428c462f2a40fadc345facfcd01412b` |
| `U-REV-03-1920.png` | 泌尿重點 2（JGA 與腎清除率雙圖） | `adf9602ade02d995d5250c0aaf45a73d8614926337637455bada7fc8c2177c4f` |
| `U-REV-05-1920.png` | 泌尿答案 1（菊糖與 PAH 清除率解析頁） | `c3e6d41ead0528db9269e6e16b6d2aede3d55daa5b9b05240e1d6c3c8400b73d` |
| `U-REV-10-1920.png` | 泌尿互動 3（唯一保留無答案提示分室圖之互動頁） | `0d219d3a4237d8cbc8ad123e39f3d94ca9b696406727497e12b86bbf29e671fc` |
| `R-REV-04-before-reveal-1920.png` | `R-REV-04` 收題後、公佈答案前（無正解標籤） | `804374e2ecabde454e75d41f423154d4c15fd930167a389109fbd88603940ae6` |
| `R-REV-04-after-reveal-1920.png` | `R-REV-04` 點擊「公佈答案」後（顯示 `✓ 正解` 與解析） | `46562f79e97aa815a9266b3c673b8bee728432855a7b3841abbbfcb88b863d1c` |
| `U-REV-07-before-reveal-1920.png` | `U-REV-07` 排序題收題後、公佈答案前 | `00efe93aef4c08fffb5a6978968a89605467cf209879ce5e1e3740feb46d73c7` |
| `U-REV-07-after-reveal-1920.png` | `U-REV-07` 排序題公佈答案後（各步顯示 `✓ 正解`） | `af1ff6eaadc7d7254c60dace257d4cd764a9089d187f074823b01b2858634a9b` |
| `verification.json` | 28 頁載入、31 張圖驗證、CSP 測試與互動流程自動報告 | `969a9d094cd9f84e9da289627fb70a2a738472dd8254e38438db0f0e451c502c` |

---

## 7. 老師正式上場 4 步驟指南

Codex 驗收通過並合併回 `main` 後，老師只需依序執行以下 4 步即可在課堂使用：

1. **推送 `main` 分支**：
   ```bash
   git checkout main
   git push origin main
   ```
2. **等待 GitHub Pages 部署綠勾**：
   等待 GitHub Actions 完成 Pages 部署後，確認圖片網址可正常開啟（HTTP 200）：
   `https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/2df88dd2695a54cfc01c734a3b6b6e187ab445fcd395fe97807e1809884c59bc.webp`
3. **執行簡報匯入工具（先 `dry-run` 再 `--write`）**：
   ```bash
   # 3a. 先跑 dry-run 檢查頁數（28 頁）與大小（約 108 KB）
   node scripts/import-teaching-deck.mjs \
     --project ap2-7ed91 \
     --course 115-1-AP2 \
     --deck "/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/review-combined.deck.json"

   # 3b. 確認無誤後加 --write 寫入 Firestore（會自動先備份至私有 backups/ 目錄）
   node scripts/import-teaching-deck.mjs \
     --project ap2-7ed91 \
     --course 115-1-AP2 \
     --deck "/Users/HHC/Documents/ChatGPT/課程平台-私有/review-decks/review-combined.deck.json" \
     --write
   ```
4. **打開授課控制台試播**：
   登入平台進入「授課控制台 → 簡報播放」，確認 28 頁投影片圖片清晰顯示，並於互動頁測試「開放作答 → 結束作答 → 公佈答案」。
