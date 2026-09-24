// 教材工作室：本機限定的小型網頁工具，讓「貼上教材程式碼→匯入→稽核→寫入教材目錄→
// （必要時）移除」這幾個步驟不用再手動下指令或改檔案。純 Node 內建模組
// （http/fs/path/url/child_process），沒有額外套件，也不會被打進 `npm run build` 的
// 部署產物——只在本機執行、關掉終端機視窗就沒了，不會影響 GitHub Pages 上線的網站，
// 也不會執行任何 git 指令。
//
//   npm run materials:studio
//
// 啟動後用瀏覽器打開印出來的網址（預設 http://127.0.0.1:5183/），照畫面上
// ①匯入 ②稽核 ③寫入教材目錄 的順序操作；貼錯、匯錯了，用畫面最下面的教材清單
// 「移除」重來。跑完記得自己用 GitHub Desktop 確認變更並 push——這個工具只碰本機
// 檔案，不會幫你 commit 或推送。
//
// 底層的匯入/稽核/目錄讀寫邏輯直接重用 scripts/materials.mjs 的 export，不是另外
// 複製一份規則。

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import {
  MATERIALS_DIR,
  listMaterialSlugs,
  auditOne,
  loadCatalog,
  upsertCatalogEntry,
  removeCatalogEntry,
  syncCatalog,
} from './materials.mjs';

const PORT = Number(process.env.MATERIALS_STUDIO_PORT) || 5183;
const UI_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'materials-studio.html');
// 啟動當下工作室程式檔的最新修改時間（秒）。啟動器用 /api/version 比對：
// 程式檔更新過就關掉舊服務重開，避免沿用舊的稽核邏輯。
const CODE_VERSION = Math.max(...['materials.mjs', 'materials-studio.mjs', 'materials-studio.html']
  .map((f) => Math.floor(fs.statSync(path.join(path.dirname(fileURLToPath(import.meta.url)), f)).mtimeMs / 1000)));
const SLUG_RE = /^[a-z][a-z0-9-]{1,49}$/;

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5_000_000) { req.destroy(); reject(new Error('內容過大（超過 5MB），教材檔案請控制在合理大小內')); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('請求格式錯誤（不是合法的 JSON）')); }
    });
    req.on('error', reject);
  });
}

function validateSlug(slug) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    throw new Error('教材代號格式不對：只能用小寫英文字母開頭，接英數字與連字號，例如 xxx-v1');
  }
  return slug;
}

async function handleList(req, res) {
  const catalog = await loadCatalog();
  const slugs = new Set([...listMaterialSlugs(), ...Object.keys(catalog)]);
  const items = [...slugs].sort().map((slug) => {
    const hasFile = fs.existsSync(path.join(MATERIALS_DIR, slug, 'index.html'));
    const entry = catalog[slug];
    return {
      slug,
      hasFile,
      inCatalog: Boolean(entry),
      label: entry?.label ?? null,
      nodeTotal: entry?.nodeTotal ?? null,
      questionTotal: entry?.questionTotal ?? null,
      note: entry?.note ?? null,
    };
  });
  sendJson(res, 200, { items });
}

async function handleImport(req, res) {
  const body = await readJsonBody(req);
  const slug = validateSlug(body.slug);
  const code = typeof body.code === 'string' ? body.code : '';
  if (!code.trim()) throw new Error('程式碼內容是空的，請先貼上教材的 HTML 程式碼');
  const dir = path.join(MATERIALS_DIR, slug);
  const filePath = path.join(dir, 'index.html');
  const exists = fs.existsSync(filePath);
  if (exists && !body.overwrite) {
    sendJson(res, 409, { error: `教材代號「${slug}」已經有檔案了`, needsOverwriteConfirm: true });
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, code);
  sendJson(res, 200, { ok: true, path: `public/materials/${slug}/index.html`, overwritten: exists });
}

async function handleAudit(req, res, url) {
  const slug = validateSlug(url.searchParams.get('slug') ?? '');
  sendJson(res, 200, auditOne(slug));
}

async function handleCatalog(req, res) {
  const body = await readJsonBody(req);
  const slug = validateSlug(body.slug);
  const label = String(body.label ?? '').trim();
  if (!label) throw new Error('教材標題不能空白');
  const nodeTotal = Number(body.nodeTotal);
  const questionTotal = Number(body.questionTotal);
  if (!Number.isFinite(nodeTotal) || nodeTotal < 0) throw new Error('節點數要是不小於 0 的數字');
  if (!Number.isFinite(questionTotal) || questionTotal < 0) throw new Error('題目數要是不小於 0 的數字');
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : undefined;
  upsertCatalogEntry(slug, { label, tracking: 'interactive', nodeTotal, questionTotal, note });
  await syncCatalog();
  sendJson(res, 200, { ok: true });
}

async function handleRemove(req, res) {
  const body = await readJsonBody(req);
  const slug = validateSlug(body.slug);
  const removeFile = body.removeFile !== false;
  const removeCatalogFlag = body.removeCatalog !== false;
  let fileRemoved = false;
  let catalogRemoved = false;
  if (removeFile) {
    const dir = path.join(MATERIALS_DIR, slug);
    if (fs.existsSync(dir)) { fs.rmSync(dir, { recursive: true, force: true }); fileRemoved = true; }
  }
  if (removeCatalogFlag) {
    catalogRemoved = removeCatalogEntry(slug);
    if (catalogRemoved) await syncCatalog();
  }
  sendJson(res, 200, { ok: true, fileRemoved, catalogRemoved });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(UI_PATH, 'utf8'));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/version') return sendJson(res, 200, { version: CODE_VERSION });
    if (req.method === 'GET' && url.pathname === '/api/list') return await handleList(req, res);
    if (req.method === 'POST' && url.pathname === '/api/import') return await handleImport(req, res);
    if (req.method === 'GET' && url.pathname === '/api/audit') return await handleAudit(req, res, url);
    if (req.method === 'POST' && url.pathname === '/api/catalog') return await handleCatalog(req, res);
    if (req.method === 'POST' && url.pathname === '/api/remove') return await handleRemove(req, res);
    sendJson(res, 404, { error: '找不到這個路徑' });
  } catch (err) {
    sendJson(res, 400, { error: err.message || String(err) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log(`教材工作室已啟動：${url}`);
  console.log('只有這台電腦能連線；按 Ctrl+C 結束。');
  exec(`open "${url}"`, () => {}); // macOS 自動開瀏覽器分頁，失敗就算了，上面已經印出網址可以手動打開
});
