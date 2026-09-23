// 教材稽核／目錄同步腳本。
//
//   node --experimental-strip-types scripts/materials.mjs audit
//   node --experimental-strip-types scripts/materials.mjs sync-catalog
//
// 也可以用 package.json 裡的 `npm run materials:audit` / `npm run materials:sync`。
//
// audit：掃描 public/materials/ 底下每份教材，檢查有沒有接 course-learning.js、有沒有
// 呼叫 .complete()，並嘗試偵測節點數與題目數。節點偵測只認得下面兩種寫法：
// data-node-id="..." 或 data-node="..." 屬性、或字面的 .explore('固定字串') 呼叫。
// 教材如果是用變數或陣列迴圈組出節點 id（例如 explore(item.id)、
// explore("card:" + i + ":" + c.id)），腳本偵測不到，會老實印「無法自動偵測」，不會
// 用错的数字假裝有結果——那種情況要自己讀程式碼核對，寫進 shared/materials.ts 時
// 附註是怎麼算出來的（見該檔案 blood-pre-v1／blood-post-v1 兩筆的註解範例）。
// 題目數用比較寬鬆的規則：抓所有 `id: '...'` 裡結尾像 ...q12 的相異字串，這個規則
// 在目前 6 份教材上都準，因為不管節點怎麼寫，測驗題目 id 大家都用 ...q數字 這個慣例。
//
// sync-catalog：讀 shared/materials.ts 的 MATERIAL_CATALOG，重新產生
// public/materials/README.md 的「正式教材版本」表格，並印出跟 audit 偵測結果不一致
// 的地方供人工核對（不會自動覆寫 MATERIAL_CATALOG，只提醒差異）。
//
// 這個檔案的函式都有 export，是給 scripts/materials-studio.mjs（本機網頁版教材工作室，
// `npm run materials:studio`）重用的——那邊的匯入／稽核／寫入目錄／移除功能，底層邏輯
// 跟這裡的 CLI 是同一份，不是另外複製一份規則。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MATERIALS_DIR = path.join(ROOT, 'public/materials');
export const CATALOG_PATH = path.join(ROOT, 'shared/materials.ts');
export const README_PATH = path.join(ROOT, 'public/materials/README.md');

export function listMaterialSlugs() {
  return fs
    .readdirSync(MATERIALS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export function auditOne(slug) {
  const htmlPath = path.join(MATERIALS_DIR, slug, 'index.html');
  if (!fs.existsSync(htmlPath)) return { slug, error: '找不到 index.html' };
  const html = fs.readFileSync(htmlPath, 'utf8');
  const hasScript = /course-learning\.js/.test(html);
  const hasComplete = /\.complete\s*\(\s*\)/.test(html);

  const dataNodeId = [...new Set([...html.matchAll(/data-node-id="([^"]+)"/g)].map((m) => m[1]))];
  const dataNode = [...new Set([...html.matchAll(/data-node="([^"]+)"/g)].map((m) => m[1]))];
  const literalExplore = [...new Set([...html.matchAll(/\.explore\(\s*['"]([\w:-]+)['"]\s*\)/g)].map((m) => m[1]))];

  let nodeTotal = null, nodeConfidence = 'unknown', nodeNote = '';
  if (dataNodeId.length) {
    nodeTotal = dataNodeId.length; nodeConfidence = 'high'; nodeNote = `data-node-id 屬性 ${dataNodeId.length} 個相異值`;
  } else if (dataNode.length) {
    nodeTotal = dataNode.length; nodeConfidence = 'high'; nodeNote = `data-node 屬性 ${dataNode.length} 個相異值`;
  } else if (literalExplore.length) {
    nodeTotal = literalExplore.length; nodeConfidence = 'high'; nodeNote = `.explore() 字面呼叫 ${literalExplore.length} 個相異值`;
  } else {
    nodeNote = '偵測不到固定節點標記，可能用變數／多個資料陣列組成節點 id（例如迴圈或物件 key），需要人工閱讀程式碼核對後手動填入 shared/materials.ts';
  }

  const questionIds = [...new Set(
    [...html.matchAll(/id:\s*['"]([\w:-]+)['"]/g)]
      .map((m) => m[1])
      .filter((id) => /-?q\d{1,3}$/i.test(id))
  )].sort();
  const questionTotal = questionIds.length || null;

  return { slug, hasScript, hasComplete, nodeTotal, nodeConfidence, nodeNote, questionTotal, questionIds };
}

export function audit() {
  const results = listMaterialSlugs().map(auditOne);
  for (const r of results) {
    console.log(`\n■ ${r.slug}`);
    if (r.error) { console.log('  ' + r.error); continue; }
    console.log(`  course-learning.js：${r.hasScript ? '有引用' : '⚠️ 沒有引用'}`);
    console.log(`  .complete()：${r.hasComplete ? '有呼叫' : '⚠️ 沒有呼叫'}`);
    console.log(`  節點數：${r.nodeTotal ?? '無法自動偵測'}（信心：${r.nodeConfidence}）${r.nodeNote ? ' — ' + r.nodeNote : ''}`);
    console.log(`  題目數：${r.questionTotal ?? '無法自動偵測'}${r.questionTotal ? '（' + r.questionIds.join('、') + '）' : ''}`);
  }
  return results;
}

export function pathToFileUrl(p) {
  return new URL('file://' + path.resolve(p));
}

export async function loadCatalog() {
  // 用查詢字串幫每次 import 產生不同的模組快取鍵，避免長時間執行的行程（例如
  // materials-studio.mjs 的伺服器）在同一個 process 裡重複 import 同一個檔案時，
  // Node 的 ES module 快取回傳寫入前的舊內容——這個問題在純 CLI（每次執行都是新
  // process）不會出現，是這次幫教材工作室測試時才抓到的。
  const url = pathToFileUrl(CATALOG_PATH);
  url.searchParams.set('t', `${Date.now()}-${Math.random()}`);
  const mod = await import(url);
  return mod.MATERIAL_CATALOG;
}

export function renderReadmeTable(catalog) {
  const lines = [
    '| 教材版本 | 正式教材位置 | 驗收設定 |',
    '| --- | --- | --- |',
  ];
  for (const [slug, entry] of Object.entries(catalog)) {
    // 不假設「questionTotal 題全對才完成」對每份教材都成立：有些教材是先備知識題
    // （解鎖用）＋限時連勝題（通關用）兩層，完成條件跟題目總數不是同一件事，這種
    // 情況要靠 shared/materials.ts 裡人工填的 note 說清楚，不要用模板硬套一句話。
    const detail = entry.note ? `；${entry.note}` : '';
    lines.push(`| \`${slug}\` | ${entry.label} | ${entry.nodeTotal} 個學習節點；${entry.questionTotal} 題${detail} |`);
  }
  return lines.join('\n');
}

export async function syncCatalog() {
  const catalog = await loadCatalog();
  const readme = fs.readFileSync(README_PATH, 'utf8');
  const tableRe = /\| 教材版本 \| 正式教材位置 \| 驗收設定 \|\n\| --- \| --- \| --- \|\n(?:\|.*\|\n?)*/;
  if (!tableRe.test(readme)) {
    console.error('README 找不到「正式教材版本」表格，沒有更新。');
    process.exitCode = 1;
    return;
  }
  const newReadme = readme.replace(tableRe, renderReadmeTable(catalog) + '\n');
  fs.writeFileSync(README_PATH, newReadme);
  console.log('已依 shared/materials.ts 重新產生 public/materials/README.md 的表格。');

  console.log('\n跟 audit 偵測結果比對（不一致只是提醒，不會自動改 shared/materials.ts）：');
  const results = audit();
  for (const r of results) {
    const entry = catalog[r.slug];
    if (!entry) { console.log(`  ⚠️ ${r.slug} 不在 shared/materials.ts 目錄裡，README 不會列出這份教材，也不會出現在教師後台下拉選單。`); continue; }
    if (r.nodeTotal != null && r.nodeTotal !== entry.nodeTotal) {
      console.log(`  ⚠️ ${r.slug} 節點數不一致：目錄寫 ${entry.nodeTotal}，audit 偵測到 ${r.nodeTotal}`);
    }
    if (r.questionTotal != null && r.questionTotal !== entry.questionTotal) {
      console.log(`  ⚠️ ${r.slug} 題目數不一致：目錄寫 ${entry.questionTotal}，audit 偵測到 ${r.questionTotal}`);
    }
  }
}

function catalogEntryLine(slug, entry) {
  const noteStr = entry.note ? `, note: ${JSON.stringify(entry.note)}` : '';
  return `  '${slug}': { label: ${JSON.stringify(entry.label)}, tracking: 'interactive', nodeTotal: ${entry.nodeTotal}, questionTotal: ${entry.questionTotal}${noteStr} },`;
}

// 給教材工作室（materials-studio.mjs）用：在 shared/materials.ts 裡新增或取代一筆
// 教材目錄項目。已存在同代號就整行取代，不存在就插在 MATERIAL_CATALOG 結尾的 `};`
// 之前。只動這一行，不動其他手寫的註解與排版。
export function upsertCatalogEntry(slug, entry) {
  const src = fs.readFileSync(CATALOG_PATH, 'utf8');
  const lineRe = new RegExp(`^ {2}'${slug}':\\s*\\{[^\\n]*\\},\\s*$`, 'm');
  const newLine = catalogEntryLine(slug, entry);
  let newSrc;
  if (lineRe.test(src)) {
    newSrc = src.replace(lineRe, newLine);
  } else {
    const closeAt = src.indexOf('\n};', src.indexOf('export const MATERIAL_CATALOG'));
    if (closeAt < 0) {
      throw new Error('shared/materials.ts 格式跟預期不同，找不到 MATERIAL_CATALOG 的結尾，沒有寫入');
    }
    newSrc = src.slice(0, closeAt) + `\n${newLine}` + src.slice(closeAt);
  }
  fs.writeFileSync(CATALOG_PATH, newSrc);
}

// 給教材工作室用：移除 shared/materials.ts 裡指定代號那一行。回傳是否真的有刪到。
export function removeCatalogEntry(slug) {
  const src = fs.readFileSync(CATALOG_PATH, 'utf8');
  const lineRe = new RegExp(`^ {2}'${slug}':\\s*\\{[^\\n]*\\},\\n`, 'm');
  if (!lineRe.test(src)) return false;
  fs.writeFileSync(CATALOG_PATH, src.replace(lineRe, ''));
  return true;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileUrl(process.argv[1]).href;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  const cmd = process.argv[2];
  if (cmd === 'audit') {
    audit();
  } else if (cmd === 'sync-catalog') {
    await syncCatalog();
  } else {
    console.error('用法：node --experimental-strip-types scripts/materials.mjs <audit|sync-catalog>');
    process.exitCode = 1;
  }
}
