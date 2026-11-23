import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  environmentNote,
  listMaterialFiles,
  nextReadabilityCache,
  pathState,
  planReadability,
  traceReads,
  readReadabilityCache,
  readabilityFingerprints,
  writeReadabilityCache,
} from '../scripts/lib/readability-cache.mjs';
import { auditReadabilityCss } from '../scripts/lib/readability-static.mjs';

// 合成的小專案：兩份教材、一支檢查程式（含 metrics、static 與外部套件）、平台播放器（含 node_modules 套件）。
function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'readability-cache-'));
  const write = (file: string, text: string) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  };
  write(
    'scripts/readability-check.mjs',
    [
      "import { helper } from './lib/helper.mjs';",
      "import { readabilityMetrics } from './lib/readability-metrics.mjs';",
      "import { auditReadabilityCss } from './lib/readability-static.mjs';",
      "import checkerPkg from 'fake-checker';",
      'console.log(helper, readabilityMetrics, auditReadabilityCss, checkerPkg);',
    ].join('\n') + '\n',
  );
  write('scripts/lib/helper.mjs', 'export const helper = 1;\n');
  write('scripts/lib/readability-metrics.mjs', 'export const readabilityMetrics = () => ({ minPx: 18 });\n');
  write(
    'scripts/lib/readability-static.mjs',
    "import { staticOnly } from './static-only.mjs';\nexport const auditReadabilityCss = () => staticOnly;\n",
  );
  write('scripts/lib/static-only.mjs', 'export const staticOnly = 1;\n');
  write('scripts/lib/unused.mjs', 'export const unused = 1;\n');
  write('scripts/readability-allowlist.json', '[]\n');
  write('node_modules/fake-ui/package.json', '{"name":"fake-ui","version":"1.0.0","main":"index.js"}\n');
  write('node_modules/fake-ui/index.js', 'export const ui = 1;\n');
  write('src/Player.tsx', "import { scale } from './scale';\nimport { ui } from 'fake-ui';\nexport const Player = () => scale + ui;\n");
  write('src/FontSizePicker.tsx', 'export default function FontSizePicker() { return null; }\n');
  write('src/scale.ts', 'export const scale = 1;\n');
  write('src/App.tsx', 'export const App = 1;\n');
  write('src/style.css', 'p{font-size:calc(18px * var(--font-scale, 1))}\n');
  write('src/answer-integrity.css', 'p{color:inherit}\n');
  write('materials-src/apply-kit/base.css', 'p{color:inherit}\n');
  write(
    'package-lock.json',
    JSON.stringify(
      {
        lockfileVersion: 3,
        packages: {
          '': { version: '1.0.0' },
          'node_modules/fake-ui': { version: '1.0.0', integrity: 'sha512-fakeui1' },
          'node_modules/fake-checker': {
            version: '2.0.0',
            integrity: 'sha512-fakechecker1',
            dependencies: { 'fake-dep': '1.0.0' },
          },
          'node_modules/fake-dep': { version: '1.0.0', integrity: 'sha512-fakedep1' },
          'node_modules/unused-pkg': { version: '1.0.0', integrity: 'sha512-unused1' },
        },
      },
      null,
      2,
    ) + '\n',
  );
  write('public/materials/course-learning.js', '// sdk\n');
  write('public/materials/a-v1/index.html', '<p>a</p>');
  write('public/materials/a-v1/img/x.svg', '<svg/>');
  write('public/materials/b-v1/index.html', '<p>b</p>');
  write('materials-src/a/content.json', '{}');
  write('materials-src/b/content.json', '{}');
  return { root, write };
}
const options = (root: string) => ({ root, slugs: ['a', 'b'], publishedVersion: (slug: string) => slug + '-v1' });

test('指紋：相同內容算出相同結果；只改一份教材只影響那一份', async () => {
  const { root, write } = makeRoot();
  try {
    const first = await readabilityFingerprints(options(root));
    assert.deepEqual(await readabilityFingerprints(options(root)), first, '重算結果相同');
    assert.match(first.common, /^[0-9a-f]{64}$/);
    write('public/materials/a-v1/img/x.svg', '<svg><g/></svg>');
    const changedA = await readabilityFingerprints(options(root));
    assert.equal(changedA.common, first.common);
    assert.notEqual(changedA.materials.a, first.materials.a);
    assert.equal(changedA.materials.b, first.materials.b);
    write('materials-src/b/content.json', '{"x":1}');
    assert.notEqual((await readabilityFingerprints(options(root))).materials.b, first.materials.b, '腳本資料改了也算變更');
    write('public/materials/a-v1/new.png', 'x');
    assert.notEqual((await readabilityFingerprints(options(root))).materials.a, changedA.materials.a, '新增檔案也算變更');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('共用指紋：檢查程式、它 import 的模組、metrics、播放器用到的檔、style.css、共用教材檔改了都會變；沒用到的檔與靜態檢查模組不影響', async () => {
  const { root, write } = makeRoot();
  try {
    const base = await readabilityFingerprints(options(root));
    const changes: [string, string, boolean][] = [
      [
        'scripts/readability-check.mjs',
        "import { helper } from './lib/helper.mjs';\nimport { readabilityMetrics } from './lib/readability-metrics.mjs';\nimport { auditReadabilityCss } from './lib/readability-static.mjs';\nimport checkerPkg from 'fake-checker';\nconsole.log(helper, readabilityMetrics, auditReadabilityCss, checkerPkg, 2);\n",
        true,
      ],
      ['scripts/lib/helper.mjs', 'export const helper = 2;\n', true],
      ['scripts/lib/readability-metrics.mjs', 'export const readabilityMetrics = () => ({ minPx: 19 });\n', true],
      ['src/scale.ts', 'export const scale = 1.3;\n', true],
      ['src/Player.tsx', "import { scale } from './scale';\nimport { ui } from 'fake-ui';\nexport const Player = () => scale + ui + 1;\n", true],
      ['src/style.css', 'p{font-size:calc(19px * var(--font-scale, 1))}\n', true],
      ['public/materials/course-learning.js', '// sdk 2\n', true],
      ['src/App.tsx', 'export const App = 2;\n', false],
      ['scripts/lib/unused.mjs', 'export const unused = 2;\n', false],
      ['scripts/readability-cache.json', '{}\n', false],
      ['src/attendance.css', 'p{color:red}\n', false],
      ['scripts/lib/readability-static.mjs', "import { staticOnly } from './static-only.mjs';\nexport const auditReadabilityCss = () => staticOnly + 1;\n", false],
      ['scripts/lib/static-only.mjs', 'export const staticOnly = 2;\n', false],
      ['scripts/readability-allowlist.json', '[{"file":"src/style.css"}]\n', false],
    ];
    let previous = base.common;
    for (const [file, text, affects] of changes) {
      write(file, text);
      const now = (await readabilityFingerprints(options(root))).common;
      assert.equal(now !== previous, affects, file);
      previous = now;
    }
    assert.deepEqual((await readabilityFingerprints(options(root))).materials, base.materials, '共用檔變更不影響教材指紋');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('共用指紋 package-lock 正規化：根版本與無關套件不影響；播放器／檢查程式相依與遞移相依變更或 lock 異常則全部重量', async () => {
  const { root, write } = makeRoot();
  try {
    const readLock = () => JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
    const writeLock = (data: unknown) => write('package-lock.json', JSON.stringify(data, null, 2) + '\n');
    const base = await readabilityFingerprints(options(root));
    const saved = {
      common: base.common,
      commonReads: {},
      materials: { a: { files: base.materials.a, reads: {} }, b: { files: base.materials.b, reads: {} } },
    };

    // 1. 只改根版本號 → 共用指紋不變，教材全部跳過
    const lock1 = readLock();
    lock1.packages[''].version = '9.9.9';
    writeLock(lock1);
    const fpRootBump = await readabilityFingerprints(options(root));
    assert.equal(fpRootBump.common, base.common, '只改根版本號不影響共用指紋');
    assert.deepEqual(planReadability(saved, fpRootBump, ['a', 'b'], root), { skip: ['a', 'b'], run: [], sameCommon: true });

    // 2. 新增無關套件 → 共用指紋不變
    const lock2 = readLock();
    lock2.packages['node_modules/qrcode-generator'] = { version: '2.0.4', integrity: 'sha512-qr1' };
    writeLock(lock2);
    assert.equal((await readabilityFingerprints(options(root))).common, base.common, '新增無關套件不影響共用指紋');

    // 3. 改播放器實際用到的套件版本／integrity → 變（全部重量）
    const lock3 = readLock();
    lock3.packages['node_modules/fake-ui'].integrity = 'sha512-fakeui2';
    writeLock(lock3);
    const fpUi = await readabilityFingerprints(options(root));
    assert.notEqual(fpUi.common, base.common, '改播放器套件 integrity 會變');
    assert.deepEqual(planReadability(saved, fpUi, ['a', 'b'], root), { skip: [], run: ['a', 'b'], sameCommon: false });

    // 4. 改檢查程式外部套件的遞移相依 → 變
    writeLock(lock2); // 還原
    const lock4 = readLock();
    lock4.packages['node_modules/fake-dep'].version = '1.0.1';
    writeLock(lock4);
    const fpTransitive = await readabilityFingerprints(options(root));
    assert.notEqual(fpTransitive.common, base.common, '改檢查程式遞移相依會變');
    assert.deepEqual(planReadability(saved, fpTransitive, ['a', 'b'], root).run, ['a', 'b']);

    // 5. lock JSON 損毀 → 變（且不丟例外中斷，強制全部重量）
    write('package-lock.json', '{broken json');
    const fpBroken = await readabilityFingerprints(options(root));
    assert.equal(fpBroken.common, '');
    assert.notEqual(fpBroken.common, base.common);
    assert.deepEqual(planReadability(saved, fpBroken, ['a', 'b'], root), { skip: [], run: ['a', 'b'], sameCommon: false });

    // 6. lock 缺檔 → 變（且不丟例外中斷，強制全部重量）
    fs.rmSync(path.join(root, 'package-lock.json'));
    const fpMissing = await readabilityFingerprints(options(root));
    assert.equal(fpMissing.common, '');
    assert.deepEqual(planReadability(saved, fpMissing, ['a', 'b'], root), { skip: [], run: ['a', 'b'], sameCommon: false });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('靜態檢查與教材走查分離：改 readability-static 或 allowlist 不改共用指紋，但靜態檢查仍能抓到合成 CSS 違規', async () => {
  const { root, write } = makeRoot();
  try {
    const base = await readabilityFingerprints(options(root));
    write('scripts/lib/readability-static.mjs', 'export const auditReadabilityCss = () => ({ pass: true });\n');
    write('scripts/readability-allowlist.json', '[{"file":"src/style.css","selector":"p","property":"font-size","value":"12px","reason":"x"}]\n');
    assert.equal((await readabilityFingerprints(options(root))).common, base.common, '不影響教材共用指紋');

    write('src/attendance.css', '.bad { font-size: 12px; }\n');
    const staticResult = auditReadabilityCss(root, []);
    assert.equal(staticResult.pass, false);
    assert.equal(staticResult.issues.length, 1);
    assert.equal(staticResult.issues[0].file, 'src/attendance.css');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('跳過規則：共用指紋、教材檔案指紋、檢查時讀過的每個路徑都相同才跳過', () => {
  const { root, write } = makeRoot();
  try {
    write('docs/script-a.md', 'v1');
    const fp = { common: 'c1', materials: { a: 'a1', b: 'b1' } };
    const slugs = ['a', 'b'];
    const entry = (files: string, reads: Record<string, string | null> = {}) => ({ files, reads });
    const good = { common: 'c1', commonReads: {}, materials: { a: entry('a1', { 'docs/script-a.md': pathState(root, 'docs/script-a.md'), 'docs/missing.md': null }), b: entry('b1') } };
    assert.deepEqual(planReadability(good, fp, slugs, root), { skip: ['a', 'b'], run: [], sameCommon: true });
    assert.deepEqual(planReadability({ ...good, materials: { ...good.materials, a: entry('a0') } }, fp, slugs, root).run, ['a'], '教材檔案變了');
    assert.deepEqual(planReadability({ ...good, materials: { b: entry('b1') } }, fp, slugs, root).run, ['a'], '沒有紀錄的教材要檢查');
    assert.deepEqual(planReadability({ ...good, common: 'c0' }, fp, slugs, root), { skip: [], run: ['a', 'b'], sameCommon: false });
    assert.deepEqual(planReadability({ common: '', materials: {} }, fp, slugs, root).run, ['a', 'b'], '沒有紀錄檔');
    assert.deepEqual(planReadability({ common: '', materials: { a: entry('a1') } }, { common: '', materials: { a: 'a1' } }, ['a'], root).run, ['a'], '空白指紋不算相同');
    assert.deepEqual(planReadability({ ...good, materials: { a: 'a1', b: entry('b1') } } as never, fp, slugs, root).run, ['a'], '舊格式的紀錄不採用');
    // 檢查時讀過的檔案（不在教材資料夾裡）內容改了 → 只有那份教材要重新檢查
    write('docs/script-a.md', 'v2');
    assert.deepEqual(planReadability(good, fp, slugs, root), { skip: ['b'], run: ['a'], sameCommon: true });
    write('docs/script-a.md', 'v1');
    // 當時不存在的檔案後來出現 → 也要重新檢查
    write('docs/missing.md', 'now here');
    assert.deepEqual(planReadability(good, fp, slugs, root).run, ['a']);
    fs.rmSync(path.join(root, 'docs/missing.md'));
    assert.deepEqual(planReadability(good, fp, slugs, root).run, []);
    // 共用的讀取（不屬於任何一份教材）變了 → 全部重新檢查
    const withCommon = { ...good, commonReads: { 'docs/script-a.md': pathState(root, 'docs/script-a.md') } };
    assert.deepEqual(planReadability(withCommon, fp, slugs, root).run, []);
    write('docs/script-a.md', 'v3');
    assert.deepEqual(planReadability(withCommon, fp, slugs, root), { skip: [], run: ['a', 'b'], sameCommon: false });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('路徑狀態與讀取追蹤：記下檢查時讀了哪些專案內的檔案，依教材分開', () => {
  const { root, write } = makeRoot();
  try {
    write('docs/x.md', 'x');
    assert.match(pathState(root, 'docs/x.md') as string, /^[0-9a-f]{64}$/);
    assert.match(pathState(root, 'docs') as string, /^dir:[0-9a-f]{64}$/);
    assert.equal(pathState(root, 'docs/none.md'), null);
    const before = pathState(root, 'docs');
    write('docs/y.md', 'y');
    assert.notEqual(pathState(root, 'docs'), before, '資料夾多了檔案算變更');
    const tracer = traceReads(root, (rel) => rel.startsWith('public/materials/a-v1/'));
    let traced: Record<string, string[]> = {};
    try {
      fs.readFileSync(path.join(root, 'src/style.css'));
      tracer.scope('a');
      fs.readFileSync(path.join(root, 'docs/x.md'), 'utf8');
      fs.existsSync(path.join(root, 'docs/none.md'));
      fs.readFileSync(path.join(root, 'public/materials/a-v1/index.html'));
      fs.readFileSync(path.join(os.tmpdir(), path.basename(root), 'docs/y.md'));
      tracer.scope('b');
      fs.readdirSync(path.join(root, 'docs'));
      fs.existsSync(path.join(root, 'node_modules/x/index.js'));
      fs.existsSync(path.join(root, 'scripts/readability-cache.json'));
      tracer.scope('');
    } finally {
      traced = tracer.stop();
    }
    assert.deepEqual(traced, { '': ['src/style.css'], a: ['docs/none.md', 'docs/x.md', 'docs/y.md'], b: ['docs'] });
    fs.readFileSync(path.join(root, 'docs/x.md'));
    assert.equal(fs.readFileSync(path.join(root, 'docs/x.md'), 'utf8'), 'x', '停止後 fs 恢復原狀');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('紀錄：只記這次檢查通過的教材；跳過的沿用舊紀錄；共用指紋變了舊紀錄作廢；讀寫往返；損毀當作沒有紀錄', () => {
  const { root, write } = makeRoot();
  try {
    write('docs/x.md', 'x');
    const fp = { common: 'c2', materials: { a: 'a2', b: 'b2' } };
    const old = { common: 'c2', commonReads: { 'src/style.css': 'old' }, materials: { b: { files: 'b-old', reads: {} }, z: { files: 'z1', reads: {} } } };
    const same = nextReadabilityCache(old, fp, { a: ['docs/x.md', 'docs/none.md'] }, ['src/style.css'], root);
    assert.deepEqual(same.materials, { a: { files: 'a2', reads: { 'docs/x.md': pathState(root, 'docs/x.md'), 'docs/none.md': null } }, b: { files: 'b-old', reads: {} }, z: { files: 'z1', reads: {} } });
    assert.equal(same.commonReads['src/style.css'], pathState(root, 'src/style.css'));
    const reset = nextReadabilityCache({ ...old, common: 'c1' }, fp, { a: [] }, [], root);
    assert.deepEqual([reset.common, reset.materials, reset.commonReads], ['c2', { a: { files: 'a2', reads: {} } }, {}], '共用指紋不同：沒重新通過的不保留');
    assert.deepEqual(nextReadabilityCache({ common: 'c2', materials: {} }, fp, {}, [], root).materials, {}, '沒通過就不記');
    assert.deepEqual(readReadabilityCache(root), { common: '', materials: {} });
    writeReadabilityCache(root, same);
    assert.deepEqual(readReadabilityCache(root), same);
    fs.writeFileSync(path.join(root, 'scripts/readability-cache.json'), '{broken');
    assert.deepEqual(readReadabilityCache(root), { common: '', materials: {} });
    fs.writeFileSync(path.join(root, 'scripts/readability-cache.json'), '{"common":5,"materials":[]}');
    assert.equal(readReadabilityCache(root).common, '');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// 2026-11-17 Claude 審查修正 F1：被 git 忽略的檔不影響指紋；未追蹤但未忽略的新檔會影響。
test('指紋：git 程式庫內不算被忽略的檔，未追蹤的新檔照算；.DS_Store 一律不算', async (t) => {
  const { root, write } = makeRoot();
  try {
    try {
      const env = { ...process.env };
      delete env.GIT_DIR;
      delete env.GIT_WORK_TREE;
      const git = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'ignore', env });
      git('init', '-q');
      write('.gitignore', 'materials-src/*/shots/\n');
      git('add', '-A');
      git('-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'init');
    } catch {
      t.skip('此環境沒有 git');
      return;
    }
    const first = await readabilityFingerprints(options(root));
    write('materials-src/a/shots/01.png', 'ignored');
    write('public/materials/a-v1/.DS_Store', 'finder');
    assert.equal((await readabilityFingerprints(options(root))).materials.a, first.materials.a, '忽略的檔與 .DS_Store 不影響');
    assert.ok(!listMaterialFiles(root, path.join(root, 'materials-src/a')).some((f) => f.includes('shots')));
    write('public/materials/a-v1/new.svg', '<svg/>');
    assert.notEqual((await readabilityFingerprints(options(root))).materials.a, first.materials.a, '未追蹤但未忽略的新檔要算');
    assert.equal((await readabilityFingerprints(options(root))).materials.b, first.materials.b);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('環境提醒：作業系統或 Chrome 版本不同才提醒；缺資料不提醒', () => {
  const mac = { platform: 'darwin-arm64', chrome: '131.0' };
  assert.equal(environmentNote(mac, { ...mac }), '');
  assert.match(environmentNote(mac, { platform: 'linux-x64', chrome: '131.0' }), /仍沿用紀錄/);
  assert.match(environmentNote(mac, { ...mac, chrome: '132.0' }), /Chrome 132\.0/);
  assert.equal(environmentNote(undefined, mac), '');
  const next = nextReadabilityCache({ common: '', materials: {} }, { common: 'c', materials: {} }, {}, [], os.tmpdir(), mac);
  assert.deepEqual(next.environment, mac);
  assert.deepEqual(nextReadabilityCache(next, { common: 'c', materials: {} }, {}, [], os.tmpdir()).environment, mac, '沒給新環境時沿用');
});

// S2：npm run check 用的模式（cache）只讀紀錄、不寫專案內任何檔（deploy.sh 要求檢查後工作目錄乾淨）。
test('檢查模式不寫專案內的檔：只讀通過紀錄', async () => {
  const { checkReadability } = await import('../scripts/readability-check.mjs');
  const repo = path.resolve(import.meta.dirname, '..');
  const cacheFile = path.join(repo, 'scripts/readability-cache.json');
  const snapshot = () => ({
    cache: fs.existsSync(cacheFile) ? fs.readFileSync(cacheFile, 'utf8') : null,
    cacheMtime: fs.existsSync(cacheFile) ? fs.statSync(cacheFile).mtimeMs : null,
    rootEntries: fs.readdirSync(repo).sort(),
    scriptEntries: fs.readdirSync(path.join(repo, 'scripts')).sort(),
  });
  const before = snapshot();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'readability-nowrite-'));
  try {
    await checkReadability({ slugs: [], cache: true, out, overlay: false });
    assert.deepEqual(snapshot(), before);
    assert.ok(!fs.existsSync(path.join(repo, '.readability-cache-unused')));
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
