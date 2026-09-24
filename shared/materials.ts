// 教材目錄的唯一資料來源（single source of truth）。
//
// public/materials/README.md 的「正式教材版本」表格、教師後台活動表單的「教材版本」
// 下拉選單，兩邊都從這裡讀，不要再各自維護一份容易兜不起來的數字。新增一份教材時：
// 1. 用 `npm run materials:audit` 核對節點數／題目數（有些教材的節點 id 是用變數或
//    陣列組出來的，腳本偵測不到，那種情況需要自己讀程式碼核對，見各筆條目的註解）。
// 2. 在下面加一筆，數字以核對過的為準，不要用猜的。
// 3. 跑 `npm run materials:sync` 讓 README 的表格自動跟上。
//
// scripts/materials.mjs 是用 Node 的 --experimental-strip-types 直接 import 這個檔案
// 拿到真正的 MATERIAL_CATALOG 物件（不是逐行規則讀取的簡易解析），所以排版不是重點，
// 但仍建議一筆一行，方便人眼比對與之後的 git diff。
export interface MaterialCatalogEntry {
  /** 對應 README「正式教材位置」欄；教師後台下拉選單也會顯示這個說明。 */
  label: string;
  tracking: 'interactive';
  nodeTotal: number;
  questionTotal: number;
  /**
   * 選填，補充「驗收設定」欄的完成規則說明。不是每份教材都是「questionTotal 題全對
   * 才完成」——有些教材是 foundation 題（先備知識，答對才能解鎖）＋case 題（限時
   * 連勝才算通關）兩層，這種情況完成條件跟 questionTotal（診斷分母）不是同一件事，
   * 不要自動假設兩者相等，留空就好，不要硬套「全對才完成」這句話。
   */
  note?: string;
}
export const MATERIAL_CATALOG: Record<string, MaterialCatalogEntry> = {
  'course-orientation-v1': { label: '課程介紹、規範、評量與參訪圖卡', tracking: 'interactive', nodeTotal: 8, questionTotal: 10, note: '10 題全對才送出完成' },
  // questionTotal=11 是「先備知識 6 題＋病例限時連勝 5 題」兩層的總和，用於診斷分母；
  // 實際「通關」判定是病例 5 題要在限時內全對（見 index.html 的 score === 5），
  // 不是 11 題全對，所以這裡不加 note，避免暗示兩者是同一件事。
  'hemostasis-mechanisms-v1': { label: '止血機制與凝血病理圖卡', tracking: 'interactive', nodeTotal: 6, questionTotal: 11 },
  // 跟 hemostasis-mechanisms-v1 同樣的先備知識＋限時連勝兩層結構，通關判定是
  // 病例 5 題限時全對，不是 11 題全對。
  'blood-gas-transport-v1': { label: '血液氣體運送圖卡', tracking: 'interactive', nodeTotal: 6, questionTotal: 11 },
  // 這份教材有兩層題目：foundationQuestions（6 題「先備知識」，要先全部答對才解鎖）
  // ＋ caseQuestions（5 題情境／陷阱題的限時連勝挑戰），兩層都會呼叫 CL.answer()，
  // 所以題目總數是 6+5=11，不是只算連勝挑戰的 5 題——這是這次用 audit 腳本重新核對
  // 才發現的，README 先前完全沒填實際數字（寫「既有正式版本」），不算修正錯誤數字。
  // 通關判定是 5 題限時連勝全對（見 index.html 的 finish(passed) 呼叫點），不是 11
  // 題全對，所以不加 note。
  'blood-composition-v1': { label: '血液的組成圖卡', tracking: 'interactive', nodeTotal: 6, questionTotal: 11 },
  // node 數是人工核對出來的：CARDS(12，每張卡用「card:索引:id」各自算一個節點，不會
  // 因為卡片共用同一個 id 而合併)＋TREE(5)＋SEQS(4)＋測驗過關(1) = 22，跟教材自己內部
  // 的 `var TOTAL = CARDS.length + TREE.length + SEQS.length + 1;` 進度條常數一致，
  // 可以互相對照。`npm run materials:audit` 偵測不到這份（節點 id 是變數組出來的），
  // 這裡的數字不是腳本自動產生的，之後改教材內容要記得回來同步這個數字。
  'blood-pre-v1': { label: '血液單元前測（血液組成、造血、止血、淋巴總複習）', tracking: 'interactive', nodeTotal: 22, questionTotal: 10, note: '10 題全對才送出完成' },
  // node 數同樣是人工核對：N 物件 32 個主題 key＋FLOWS 3 條裡只有 rbc-homeostasis
  // 不在 N 裡（另外 2 條 id 跟 N 的 key 重複，不會多算）＋PAIRS 10 組 = 43。
  // `npm run materials:audit` 一樣偵測不到（節點 id 來自物件 key 與陣列索引，不是
  // 固定 data-node-id 屬性），這裡的數字不是腳本自動產生的。
  'blood-post-v1': { label: '血液單元後測（全景地圖、機轉流程、易混淆配對、闖關）', tracking: 'interactive', nodeTotal: 43, questionTotal: 15, note: '5 關（每關 3 題）全部過關才送出完成' },
  'heart-structure-v1': { label: "心臟構造與解剖生理圖卡", tracking: 'interactive', nodeTotal: 6, questionTotal: 11, note: "先備 6 題逐題解鎖；病例 5 題全對才通關" },
  'ecg-basics-v1': { label: "心電圖基礎與心率調控", tracking: 'interactive', nodeTotal: 6, questionTotal: 11, note: "先備 6 題逐題解鎖；病例 5 題全對才通關" },
  'cardiac-conduction-v1': { label: "心臟的傳導系統", tracking: 'interactive', nodeTotal: 6, questionTotal: 11, note: "先備 6 題逐題解鎖；病例 5 題全對才通關" },
  'cardiac-cycle-v1': { label: "心動週期", tracking: 'interactive', nodeTotal: 6, questionTotal: 11, note: "先備 6 題逐題解鎖；病例 5 題全對才通關" },
  'cardiac-conduction-v2': { label: "心臟的傳導系統（圖像強化版）", tracking: 'interactive', nodeTotal: 6, questionTotal: 11, note: "先備 6 題逐題解鎖；病例 5 題全對才通關" },
  'cardiac-cycle-v2': { label: "心動週期（圖像強化版）", tracking: 'interactive', nodeTotal: 6, questionTotal: 11, note: "先備 6 題逐題解鎖；病例 5 題全對才通關" },
  'coronary-circulation-v1': { label: "心臟血液供應（圖像強化版）", tracking: 'interactive', nodeTotal: 6, questionTotal: 11, note: "先備 6 題逐題解鎖；病例 5 題全對才通關" },
};

// 正式教材都發布在 GitHub Pages 的 materials/<版本>/index.html；教師選教材版本時自動帶入。
export const MATERIALS_BASE_URL = 'https://albertchang1008-alt.github.io/115-1-AP2/materials/';
export function materialPageUrl(slug: string) {
  return `${MATERIALS_BASE_URL}${slug}/index.html`;
}
