// 閱讀規範檢查的「未變更就跳過」機制（2026-11-17；2026-11-23 縮小共用指紋範圍）。
//
// 原理：一份教材的檢查結果只取決於四樣東西——
//   1. 這份教材上線的檔案（public/materials/<版本>/）與它的腳本資料（materials-src/<代號>/）
//   2. 檢查程式本身與它用到的模組（由 esbuild 實際解析 import 得出，不是人工列表）
//      ※ 靜態 CSS 檢查（readability-static.mjs 與 allowlist）每次 npm run check 都會完整執行、不吃快取，
//        因此不列入教材走查的共用指紋；只改靜態檢查規則或 allowlist 不會讓 17 份教材重量。
//   3. 包住教材的平台播放器（src/Player、src/FontSizePicker 用到的檔案）、src/style.css、
//      public/materials 最上層的共用檔（course-learning.js、readability-overlay 等），
//      以及 package-lock.json 中「實際影響量測的套件」（播放器用到的 node_modules 套件、
//      檢查程式的外部套件及其遞移相依）的 name@version＋integrity。
//      ※ package-lock.json 的根套件版本號（version）或無關套件的新增／升級不影響共用指紋；
//        但 lock 缺檔、JSON 損毀或找不到對應套件時，共用指紋回傳空字串，強制全部重量。
//   4. 檢查過程中另外讀到的專案內檔案（例如 docs/ 裡的腳本稿）：不靠人工列表，
//      而是在實際檢查時記下 Node 讀了哪些檔、查了哪些路徑存不存在（traceReads）。
// 把 2＋3 算成一個「共用指紋」，每份教材的 1 算成一個「教材指紋」，4 逐檔記錄內容指紋。
// scripts/readability-cache.json 記錄「上次通過時」的這三樣。
// 全部和紀錄相同，表示內容與檢查方式逐位元相同，結果必然相同，才跳過；只要有一項不同就照常重量。
// 紀錄檔過期或遺失只會讓檢查變慢（全部重量），不會讓不合格的教材通過。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isBuiltin, syncBuiltinESMExports } from 'node:module';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

export const READABILITY_CACHE_FILE = 'scripts/readability-cache.json';
const sha = (data) => crypto.createHash('sha256').update(data).digest('hex');
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, out);
    else if (entry.isFile()) out.push(file);
  }
  return out;
}
// 2026-11-17 Claude 審查修正 F1：在 git 程式庫內只算「git 追蹤的＋新增但未被忽略的」檔案。
// 被 .gitignore 忽略的檔（例如 materials-src/<代號>/shots/ 截圖）不會部署、檢查也不讀，
// 若算進指紋，教師主程式庫和乾淨的 worktree／GitHub 算出的指紋會不同，導致每次都重量。
const gitTops = new Map();
function gitTop(root) {
  if (!gitTops.has(root)) {
    let top = null;
    try {
      top = fs.realpathSync(
        execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(),
      );
    } catch {
      top = null;
    }
    gitTops.set(root, top);
  }
  return gitTops.get(root);
}
/** 資料夾內要算進指紋的檔案：git 程式庫內用 git ls-files（追蹤＋未忽略的新檔），否則列出全部。一律不含 .DS_Store。 */
export function listMaterialFiles(root, dir) {
  if (!fs.existsSync(dir)) return [];
  let files = null;
  const top = gitTop(root);
  if (top && top === fs.realpathSync(root)) {
    try {
      const rel = path.relative(root, dir).split(path.sep).join('/');
      files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', rel], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 256 * 1024 * 1024,
      })
        .split('\0')
        .filter(Boolean)
        .map((f) => path.join(root, f))
        .filter((f) => {
          try {
            return fs.statSync(f).isFile();
          } catch {
            return false; // 已追蹤但本機已刪除
          }
        });
    } catch {
      files = null;
    }
  }
  return (files || walk(dir)).filter((f) => path.basename(f) !== '.DS_Store');
}
/** 一組檔案的指紋：相對路徑＋內容，順序固定；路徑一律用 /，在不同作業系統算出來相同。 */
function hashFiles(root, files) {
  const rows = [...new Set(files)]
    .map((file) => [path.relative(root, file).split(path.sep).join('/'), file])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([rel, file]) => `${rel}\0${sha(fs.readFileSync(file))}`);
  return sha(rows.join('\n'));
}
function realpathSafe(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}
function excludeModulesPlugin(root, relPaths) {
  const realRoot = realpathSafe(root);
  const targets = new Set([
    ...relPaths.map((p) => path.resolve(root, p)),
    ...relPaths.map((p) => path.resolve(realRoot, p)),
  ]);
  return {
    name: 'exclude-static-modules',
    setup(buildApi) {
      buildApi.onResolve({ filter: /.*/ }, (args) => {
        if (!args.path.startsWith('.') && !path.isAbsolute(args.path)) return null;
        const resolved = path.resolve(args.resolveDir || root, args.path);
        for (const candidate of [resolved, `${resolved}.mjs`, `${resolved}.js`, `${resolved}.ts`]) {
          if (targets.has(candidate) || targets.has(realpathSafe(candidate))) {
            return { path: candidate, namespace: 'excluded-static' };
          }
        }
        return null;
      });
      buildApi.onLoad({ filter: /.*/, namespace: 'excluded-static' }, () => ({
        contents: 'export function auditReadabilityCss() { return null; }\nexport default {};\n',
        loader: 'js',
      }));
    },
  };
}
function lockKeyFromInput(inputPath) {
  const normalized = inputPath.split(path.sep).join('/');
  const firstIdx = normalized.indexOf('node_modules/');
  if (firstIdx === -1) return null;
  const lastIdx = normalized.lastIndexOf('node_modules/');
  const prefix = normalized.slice(firstIdx, lastIdx + 'node_modules/'.length);
  const parts = normalized.slice(lastIdx + 'node_modules/'.length).split('/');
  if (!parts[0]) return null;
  const pkg = parts[0].startsWith('@') ? (parts[1] ? `${parts[0]}/${parts[1]}` : null) : parts[0];
  return pkg ? prefix + pkg : null;
}
function barePackageName(specifier) {
  if (!specifier || specifier.startsWith('.') || path.isAbsolute(specifier) || isBuiltin(specifier)) return null;
  const parts = specifier.split('/');
  if (specifier.startsWith('@')) return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
  return parts[0];
}
/** 用 esbuild 解析實際的 import，回傳專案內檔案、用到的 node_modules 鍵值、以及外部 bare import 套件名。 */
async function analyzeClosure(root, options) {
  const result = await build({
    bundle: true,
    write: false,
    metafile: true,
    logLevel: 'silent',
    absWorkingDir: root,
    outdir: path.join(root, '.readability-cache-unused'),
    loader: { '.css': 'empty', '.json': 'json' },
    ...options,
  });
  const inputs = result.metafile.inputs;
  const files = [];
  const nodeModuleKeys = new Set();
  const externalPackages = new Set();
  for (const [key, info] of Object.entries(inputs)) {
    if (key.startsWith('<') || key.startsWith('excluded-static:')) continue;
    if (key.includes('node_modules')) {
      const lockKey = lockKeyFromInput(key);
      if (lockKey) nodeModuleKeys.add(lockKey);
      continue;
    }
    const resolved = path.resolve(root, key);
    if (fs.existsSync(resolved)) files.push(resolved);
    for (const imp of info.imports || []) {
      if (imp.external) {
        const pkg = barePackageName(imp.path);
        if (pkg) externalPackages.add(pkg);
      }
    }
  }
  for (const out of Object.values(result.metafile.outputs || {})) {
    for (const imp of out.imports || []) {
      if (imp.external) {
        const pkg = barePackageName(imp.path);
        if (pkg) externalPackages.add(pkg);
      }
    }
  }
  return { files, nodeModuleKeys: [...nodeModuleKeys], externalPackages: [...externalPackages] };
}
function pkgNameFromLockKey(lockKey) {
  const idx = lockKey.lastIndexOf('node_modules/');
  return idx === -1 ? lockKey : lockKey.slice(idx + 'node_modules/'.length);
}
function resolveLockPackage(packages, parentKey, depName) {
  if (parentKey) {
    const nested = `${parentKey}/node_modules/${depName}`;
    if (Object.hasOwn(packages, nested)) return nested;
    let cursor = parentKey;
    while (cursor.includes('node_modules/')) {
      const idx = cursor.lastIndexOf('node_modules/');
      const prefix = cursor.slice(0, idx + 'node_modules/'.length);
      const candidate = prefix + depName;
      if (Object.hasOwn(packages, candidate)) return candidate;
      cursor = cursor.slice(0, idx).replace(/\/$/, '');
    }
  }
  const top = `node_modules/${depName}`;
  return Object.hasOwn(packages, top) ? top : null;
}
/**
 * 只雜湊「實際影響量測的套件」（name@version＋integrity），忽略根套件 version 與無關套件。
 * lock 缺檔、JSON 損毀或找不到對應項時回傳 null（視為變更、強制全部重量）。
 */
function lockFingerprint(root, { nodeModuleKeys, externalPackages }) {
  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  } catch {
    return null;
  }
  if (!lock || typeof lock !== 'object' || !lock.packages || typeof lock.packages !== 'object') return null;
  const packages = lock.packages;
  const queue = [];
  for (const key of nodeModuleKeys) {
    const resolved = Object.hasOwn(packages, key) ? key : resolveLockPackage(packages, '', pkgNameFromLockKey(key));
    if (!resolved) return null;
    queue.push(resolved);
  }
  for (const pkg of externalPackages) {
    const resolved = resolveLockPackage(packages, '', pkg);
    if (!resolved) return null;
    queue.push(resolved);
  }
  const visited = new Set();
  while (queue.length > 0) {
    const key = queue.shift();
    if (visited.has(key)) continue;
    visited.add(key);
    const entry = packages[key];
    if (!entry || typeof entry !== 'object' || typeof entry.version !== 'string') return null;
    for (const dep of Object.keys(entry.dependencies || {})) {
      const depKey = resolveLockPackage(packages, key, dep);
      if (!depKey) return null;
      if (!visited.has(depKey)) queue.push(depKey);
    }
    for (const dep of Object.keys(entry.optionalDependencies || {})) {
      const depKey = resolveLockPackage(packages, key, dep);
      if (depKey && !visited.has(depKey)) queue.push(depKey);
    }
  }
  const rows = [...visited].sort().map((key) => {
    const entry = packages[key];
    return `${key}\0${pkgNameFromLockKey(key)}@${entry.version}\0${entry.integrity || ''}`;
  });
  return sha(rows.join('\n'));
}
export async function readabilityFingerprints({
  root,
  slugs,
  publishedVersion,
  checkerEntry = 'scripts/readability-check.mjs',
  platformEntries = ['./src/Player', './src/FontSizePicker'],
  staticModules = ['scripts/lib/readability-static.mjs'],
}) {
  const checker = await analyzeClosure(root, {
    entryPoints: [checkerEntry],
    platform: 'node',
    format: 'esm',
    packages: 'external',
    plugins: staticModules.length ? [excludeModulesPlugin(root, staticModules)] : [],
  });
  const platform = await analyzeClosure(root, {
    stdin: { contents: platformEntries.map((p) => `import ${JSON.stringify(p)};`).join(''), resolveDir: root, loader: 'tsx' },
    platform: 'browser',
    format: 'iife',
  });
  const materialsDir = path.join(root, 'public/materials');
  // 根目錄的 Markdown 與純文字說明供維護者閱讀，播放器不會載入；編輯說明時可沿用量測結果。
  const sharedMaterialFiles = listMaterialFiles(root, materialsDir).filter(
    (file) => path.dirname(file) === materialsDir && !/\.(?:md|markdown|txt)$/i.test(file),
  );
  const extra = ['src/style.css'].map((f) => path.join(root, f)).filter((f) => fs.existsSync(f));
  const lockHash = lockFingerprint(root, {
    nodeModuleKeys: platform.nodeModuleKeys,
    externalPackages: checker.externalPackages,
  });
  const filesHash = hashFiles(root, [...checker.files, ...platform.files, ...sharedMaterialFiles, ...extra]);
  const common = lockHash === null ? '' : sha(`${filesHash}\nlock:${lockHash}`);
  const materials = {};
  for (const slug of slugs)
    materials[slug] = hashFiles(root, [
      ...listMaterialFiles(root, path.join(materialsDir, publishedVersion(slug))),
      ...listMaterialFiles(root, path.join(root, 'materials-src', slug)),
    ]);
  return {
    common,
    materials,
    commonFiles: checker.files.length + platform.files.length + sharedMaterialFiles.length + extra.length,
  };
}
/** 一個路徑目前的狀態：檔案＝內容指紋；資料夾＝檔名清單的指紋；不存在＝null。 */
export function pathState(root, rel) {
  const file = path.join(root, rel);
  try {
    const stat = fs.statSync(file);
    if (stat.isDirectory()) return 'dir:' + sha(fs.readdirSync(file).filter((n) => n !== '.DS_Store').sort().join('\n'));
    return stat.isFile() ? sha(fs.readFileSync(file)) : null;
  } catch {
    return null;
  }
}
/**
 * 記錄檢查過程中 Node 讀了哪些專案內的路徑（讀檔、列目錄、查是否存在）。
 * 回傳 { scope(name), stop() }：scope 切換目前歸屬的教材（'' 表示共用）；stop 還原並回傳 { 名稱: [相對路徑] }。
 * 不記 node_modules、紀錄檔本身、專案外的路徑，以及 ignore() 回 true 的路徑（已由資料夾指紋涵蓋的教材檔）。
 */
export function traceReads(root, ignore = () => false) {
  const seen = new Map();
  let current = '';
  const note = (target) => {
    try {
      if (typeof target !== 'string' && !(target instanceof URL) && !Buffer.isBuffer(target)) return;
      const file = path.resolve(target instanceof URL ? target.pathname && decodeURIComponent(target.pathname) : String(target));
      const rel = path.relative(root, file).split(path.sep).join('/');
      if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return;
      if (rel.includes('node_modules/') || rel === READABILITY_CACHE_FILE || rel.startsWith('.git/') || ignore(rel)) return;
      if (!seen.has(current)) seen.set(current, new Set());
      seen.get(current).add(rel);
    } catch {
      /* 記錄失敗不影響檢查 */
    }
  };
  const names = ['readFileSync', 'readFile', 'existsSync', 'statSync', 'lstatSync', 'readdirSync', 'openSync', 'createReadStream', 'accessSync', 'copyFileSync'];
  const originals = Object.fromEntries(names.map((n) => [n, fs[n]]));
  const promiseNames = ['readFile', 'stat', 'readdir', 'access', 'open'];
  const promiseOriginals = Object.fromEntries(promiseNames.map((n) => [n, fs.promises[n]]));
  for (const n of names)
    fs[n] = function (target, ...rest) {
      note(target);
      return originals[n].call(this, target, ...rest);
    };
  for (const n of promiseNames)
    fs.promises[n] = function (target, ...rest) {
      note(target);
      return promiseOriginals[n].call(this, target, ...rest);
    };
  syncBuiltinESMExports();
  return {
    scope(name) {
      current = name || '';
    },
    stop() {
      Object.assign(fs, originals);
      Object.assign(fs.promises, promiseOriginals);
      syncBuiltinESMExports();
      return Object.fromEntries([...seen].map(([k, v]) => [k, [...v].sort()]));
    },
  };
}
const statesOf = (root, paths) => Object.fromEntries(paths.map((rel) => [rel, pathState(root, rel)]));
const readsMatch = (root, reads) => !!reads && Object.entries(reads).every(([rel, state]) => pathState(root, rel) === state);

export function readReadabilityCache(root) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(root, READABILITY_CACHE_FILE), 'utf8'));
    return typeof data.common === 'string' && data.materials && typeof data.materials === 'object' ? data : { common: '', materials: {} };
  } catch {
    return { common: '', materials: {} };
  }
}
/** 紀錄是在哪個環境量的（S1）：作業系統與 Chrome 版本。不同環境只提醒、不強制重量。 */
export function environmentNote(saved, current) {
  if (!saved || !current) return '';
  if (saved.platform === current.platform && saved.chrome === current.chrome) return '';
  return `READABILITY 提醒：通過紀錄是在 ${saved.platform}／Chrome ${saved.chrome} 量的，本機為 ${current.platform}／Chrome ${current.chrome}；仍沿用紀錄（字型與 Chrome 版本可能影響結果，每週完整檢查會補量）。`;
}
/** 哪些教材可以跳過：共用指紋與共用讀取都相同，而且教材的檔案指紋與它讀過的每個路徑都和上次通過時相同。 */
export function planReadability(cache, fingerprints, slugs, root) {
  const sameCommon = !!cache.common && cache.common === fingerprints.common && readsMatch(root, cache.commonReads || {});
  const skip = slugs.filter((slug) => {
    const saved = cache.materials[slug];
    return sameCommon && !!saved && !!fingerprints.materials[slug] && saved.files === fingerprints.materials[slug] && readsMatch(root, saved.reads);
  });
  return { skip, run: slugs.filter((slug) => !skip.includes(slug)), sameCommon };
}
/**
 * 只記錄這次實際檢查並通過的教材（checked：{ 代號: 檢查時讀到的路徑 }）；因未變更而跳過的沿用舊紀錄。
 * 共用指紋變了，舊紀錄全部作廢。
 */
export function nextReadabilityCache(cache, fingerprints, checked, commonPaths, root, environment) {
  const same = cache.common === fingerprints.common;
  const materials = { ...(same ? cache.materials : {}) };
  for (const [slug, paths] of Object.entries(checked))
    materials[slug] = { files: fingerprints.materials[slug], reads: statesOf(root, paths) };
  return {
    note: '閱讀規範檢查的通過紀錄：由 npm run readability:record 產生，請勿手改。內容與檢查方式都和紀錄相同的教材在 npm run check 會跳過；說明見 scripts/lib/readability-cache.mjs。',
    ...(environment ? { environment } : cache.environment ? { environment: cache.environment } : {}),
    common: fingerprints.common,
    commonReads: { ...(same ? cache.commonReads || {} : {}), ...statesOf(root, commonPaths) },
    materials: Object.fromEntries(Object.entries(materials).sort(([a], [b]) => (a < b ? -1 : 1))),
  };
}
export function writeReadabilityCache(root, data) {
  fs.writeFileSync(path.join(root, READABILITY_CACHE_FILE), JSON.stringify(data, null, 2) + '\n');
}
