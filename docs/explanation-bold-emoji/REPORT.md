# 給 Claude 的摘要

- #36 完成於 `feat/explanation-bold-emoji`，起點 `origin/main`＝`4107921a`，版本 1.10.1 → 1.10.2；未 push。
- 檔案：src/QuestionContent.tsx、shared/explanationText.ts、tests/explanation-text.test.ts，以及版本中繼資料。
- PASS：npm run check，前端／shared 233 測試、build、functions 61 測試均過；新增 3 個渲染測試均過。
- PASS：390×844、1280×800 各測 Q1／資訊圖表；無橫向溢位，兩種題目皆有 strong；學生不顯示⑤、教師有⑤。
- PASS：guided 曝光、traditional 展開／收合研究事件仍有送出；原本事件邏輯不變。
- 偏離：無。截圖用本機預覽頁直接載入正式共用元件及 CSS，未連線發布課程或改後端行為。
- 抽查：未配對星號保留、script/img 字串跳脫、br 換行、emoji aria-hidden、研究事件。

## 改動與安全邊界

共用純函式只辨識成對 `**文字**`，由 React 子節點產生 `<strong>`；其餘文字由 React 跳脫，沒有使用 dangerouslySetInnerHTML。
未配對標記、三個星號、其他 Markdown 原樣保留；`<br>`、`<br/>`、`<br />` 不分大小寫轉為換行，沿用 preserve-lines。
①～④、傳統解析與教師⑤使用同一渲染元件。標題 emoji 是 aria-hidden 的 span，文字標題仍供讀屏讀取。

研究事件的計時、effect、details onToggle 邏輯未改動；瀏覽器以穩定 callback 實測三秒引導曝光及傳統解析開關。
除必須一致升版的 package／lock／version.gs／README 等版本數字外，沒有改後端或同步邏輯。
版本腳本對交接及舊索引的附帶變更已撤回；本工作不改 handoff.md 規則或 DEVELOPMENT_LOG.md。

## 實際驗證

`npm run check` exit 0。完整原始輸出存 repo 外 `explanation-check.log`；以下為摘要行：

```text
# tests 233
# pass 233
# fail 0
✓ built in 1.35s
# tests 61
# pass 61
# fail 0
```

```text
node --import tsx --test tests/explanation-text.test.ts
# tests 3
# pass 3
# fail 0
```

測試涵蓋多段、成對／未配對／三星號、其他 Markdown、script/img 字串、三種 br 寫法，以及學生／教師標題與 aria。
完整檢查初次在沙箱因 tsx 本機 IPC 被擋；已以允許本機測試權限重跑並全過。測試無外部資料寫入。

瀏覽器實際輸出：

```json
{
  "pass": true,
  "screenshots": [
    "/tmp/explanation-Q1-390.png",
    "/tmp/explanation-Q1-390-full.png",
    "/tmp/explanation-info-390.png",
    "/tmp/explanation-info-390-full.png",
    "/tmp/explanation-Q1-1280.png",
    "/tmp/explanation-Q1-1280-full.png",
    "/tmp/explanation-info-1280.png",
    "/tmp/explanation-info-1280-full.png"
  ],
  "teacherTrace": true,
  "cases": [
    {
      "q": 0,
      "width": 390,
      "height": 844,
      "strongCount": 2,
      "horizontalOverflow": false,
      "events": [
        {
          "format": "traditional",
          "action": "opened"
        },
        {
          "format": "guided",
          "action": "exposed",
          "seconds": 3
        },
        {
          "format": "traditional",
          "action": "closed",
          "seconds": 3
        }
      ]
    },
    {
      "q": 1,
      "width": 390,
      "height": 844,
      "strongCount": 1,
      "horizontalOverflow": false,
      "events": [
        {
          "format": "traditional",
          "action": "opened"
        },
        {
          "format": "guided",
          "action": "exposed",
          "seconds": 3
        },
        {
          "format": "traditional",
          "action": "closed",
          "seconds": 3
        }
      ]
    },
    {
      "q": 0,
      "width": 1280,
      "height": 800,
      "strongCount": 2,
      "horizontalOverflow": false,
      "events": [
        {
          "format": "traditional",
          "action": "opened"
        },
        {
          "format": "guided",
          "action": "exposed",
          "seconds": 3
        },
        {
          "format": "traditional",
          "action": "closed",
          "seconds": 3
        }
      ]
    },
    {
      "q": 1,
      "width": 1280,
      "height": 800,
      "strongCount": 1,
      "horizontalOverflow": false,
      "events": [
        {
          "format": "traditional",
          "action": "opened"
        },
        {
          "format": "guided",
          "action": "exposed",
          "seconds": 3
        },
        {
          "format": "traditional",
          "action": "closed",
          "seconds": 3
        }
      ]
    }
  ]
}
```

預覽使用 Q1 ID 2543795 的底稿原文，以及資訊圖表 heart-structure-foundation-q01 的 #35 本批草稿；只是本機 fixture，未寫題庫。
正式共用元件、CSS 與事件邏輯均直接由此分支載入。這是元件整合畫面驗收，沒有登入線上課程或部署。

## 截圖與證據清單

證據資料夾：`/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/explanation-bold-emoji/`，保存到 2026-10-31。
MANIFEST.json 列每檔大小與 SHA256；含 8 張圖片（4 張精確 viewport、4 張全頁）、兩份測試輸出、瀏覽器結果與重跑腳本、3 份預覽 fixture。

| 題目 | 390×844 | 1280×800 |
|---|---|---|
| Q1 | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/explanation-bold-emoji/explanation-Q1-390.png) | [桌面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/explanation-bold-emoji/explanation-Q1-1280.png) |
| 資訊圖表 | [手機](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/explanation-bold-emoji/explanation-info-390.png) | [桌面](/Users/HHC/Documents/ChatGPT/課程平台-驗收證據/2026-10-24/explanation-bold-emoji/explanation-info-1280.png) |

同名 `-full.png` 是全頁版，方便檢視折線與傳統解析底部。四組已實際開圖檢視。

## Claude 交接

獨立 worktree：`/Users/HHC/Documents/ChatGPT/課程平台1.0/.worktrees/explanation-bold-emoji`。
請抽查純函式的標記邊界與 React 跳脫，以及教師預覽共用元件；全部驗證通過後仍由教師決定後續推送。
