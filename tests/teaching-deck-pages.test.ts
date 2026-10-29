import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { slideDocument } from '../src/TeachingControl';
import {
  validateTeachingDeckPayload,
  diffTeachingDeck,
  getDefaultBackupDir,
  isInsideRepo,
  resolveRepoRoots,
} from '../scripts/import-teaching-deck.mjs';
import { verifyTeachingDeckPages } from '../scripts/teaching-deck-pages-verify.mjs';

test('review-decks-assets 圖片為內容雜湊命名之 WebP、單張 ≤ 500 KB 且不含非圖片檔', () => {
  const assetsDir = path.resolve('public/materials/review-decks-assets');
  assert(fs.existsSync(assetsDir), 'public/materials/review-decks-assets 目錄必須存在');
  const entries = fs.readdirSync(assetsDir);
  assert.equal(entries.length, 26, '兩份複習課簡報共 26 張不重複圖片');

  for (const name of entries) {
    assert.match(name, /^[a-f0-9]{64}\.webp$/, `檔名必須為 64 碼 SHA-256 雜湊 + .webp：${name}`);
    const fullPath = path.join(assetsDir, name);
    const buf = fs.readFileSync(fullPath);
    assert(buf.length > 0 && buf.length <= 500 * 1024, `${name} 大小 ${buf.length} 超過 500 KB`);
    // Check RIFF....WEBP header
    assert.equal(buf.subarray(0, 4).toString('ascii'), 'RIFF', `${name} 必須為有效 RIFF 容器`);
    assert.equal(buf.subarray(8, 12).toString('ascii'), 'WEBP', `${name} 必須為有效 WEBP 格式`);
    const actualSha = crypto.createHash('sha256').update(buf).digest('hex');
    assert.equal(`${actualSha}.webp`, name, `${name} 內容雜湊與檔名不一致`);
  }
});

test('slideDocument CSP 僅在 img-src 放行 data:、GitHub Pages 與受控 Firebase/GCS Storage，維持 default-src none', () => {
  const doc = slideDocument('<section><h1>測試</h1></section>');
  assert.match(
    doc,
    /<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https:\/\/albertchang1008-alt\.github\.io https:\/\/storage\.googleapis\.com https:\/\/firebasestorage\.googleapis\.com; font-src 'none';">/,
  );
});

test('import-teaching-deck 驗證規則：檢查 slideId 唯一、< 1 MiB、拒絕 data: 大圖與 inline SVG', () => {
  const sampleUrl =
    'https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/sample.webp';
  const validDeck = {
    title: '測試簡報',
    slides: [
      {
        id: 'R-REV-01',
        title: '第一頁',
        html: `<section><img src="${sampleUrl}" alt="fig"></section>`,
        notes: '備註',
        answerPage: false,
      },
      {
        id: 'R-REV-02',
        title: '第二頁',
        html: '<section><p>文字</p></section>',
        notes: '',
        answerPage: true,
      },
    ],
  };

  const res = validateTeachingDeckPayload(validDeck);
  assert.equal(res.slides.length, 2);
  assert(res.bytes < 900 * 1024);

  // Duplicate slideId rejected
  assert.throws(
    () =>
      validateTeachingDeckPayload({
        title: '重複 ID',
        slides: [validDeck.slides[0], { ...validDeck.slides[1], id: 'R-REV-01' }],
      }),
    /重複的 slideId：R-REV-01/,
  );

  // Embedded data:image rejected
  assert.throws(
    () =>
      validateTeachingDeckPayload({
        title: '內嵌圖',
        slides: [
          {
            ...validDeck.slides[0],
            html: '<section><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"></section>',
          },
        ],
      }),
    /含內嵌 data: 圖片/,
  );

  // Inline SVG rejected
  assert.throws(
    () =>
      validateTeachingDeckPayload({
        title: '內嵌 SVG',
        slides: [
          {
            ...validDeck.slides[0],
            html: '<section><svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg></section>',
          },
        ],
      }),
    /含 inline <svg>/,
  );

  // Deck >= 1 MiB rejected
  assert.throws(
    () =>
      validateTeachingDeckPayload({
        title: '超大簡報',
        slides: [
          {
            ...validDeck.slides[0],
            notes: 'A'.repeat(1024 * 1024),
          },
        ],
      }),
    /超過 1 MiB/,
  );

  // Diff calculation check
  const diff = diffTeachingDeck(
    {
      title: '舊簡報',
      slides: [
        validDeck.slides[0],
        { id: 'OLD-1', title: '舊頁', html: '<section></section>', notes: '', answerPage: false },
      ],
    },
    res,
  );
  assert.deepEqual(diff.unchangedSlideIds, ['R-REV-01']);
  assert.deepEqual(diff.addedSlideIds, ['R-REV-02']);
  assert.deepEqual(diff.removedSlideIds, ['OLD-1']);

  // Optional local private deck check when REVIEW_DECKS_DIR is set (never required in CI)
  const privateDir = process.env.REVIEW_DECKS_DIR;
  if (privateDir) {
    const combined = JSON.parse(
      fs.readFileSync(path.join(privateDir, 'review-combined.deck.json'), 'utf8'),
    );
    const validatedCombined = validateTeachingDeckPayload(combined);
    assert.equal(validatedCombined.slides.length, 28);
    assert(validatedCombined.bytes < 900 * 1024, 'review-combined.deck.json 必須 < 900 KB');
  }
});

test('import-teaching-deck CLI：預設 dry-run 不寫入，--write 先備份到 repo 外且不碰 classroomConfig', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-deck-test-'));
  try {
    const deckPath = path.join(tempDir, 'test.deck.json');
    const writesPath = path.join(tempDir, 'writes.json');
    const backupDir = path.join(tempDir, 'backups');
    const sampleDeck = {
      title: '合成 28 頁測試簡報',
      slides: Array.from({ length: 28 }, (_, i) => ({
        id: i < 14 ? `R-REV-${String(i + 1).padStart(2, '0')}` : `U-REV-${String(i - 13).padStart(2, '0')}`,
        title: `第 ${i + 1} 頁`,
        html: '<section><img src="https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/test.webp"></section>',
        notes: `備註 ${i + 1}`,
        answerPage: [5, 8, 11, 14].includes((i % 14) + 1),
      })),
    };
    fs.writeFileSync(deckPath, JSON.stringify(sampleDeck, null, 2));

    // 1. Default dry-run (no --write flag)
    const dryRun = spawnSync(
      process.execPath,
      [
        '--require',
        path.resolve('tests/fixtures/fake-ap2-firestore.cjs'),
        'scripts/import-teaching-deck.mjs',
        '--project',
        'ap2-7ed91',
        '--course',
        '115-1-AP2',
        '--deck',
        deckPath,
      ],
      { encoding: 'utf8', env: { ...process.env, FAKE_AP2_WRITES: writesPath } },
    );
    assert.equal(dryRun.status, 0, dryRun.stderr);
    const dryOut = JSON.parse(dryRun.stdout);
    assert.equal(dryOut.mode, 'dry-run');
    assert.equal(dryOut.newSlideCount, 28);
    assert.equal(dryOut.existingExists, true);
    assert.equal(dryOut.existingSlideCount, 2);
    assert.equal(dryOut.touchesClassroomConfig, false);
    assert.deepEqual(dryOut.changedSlideIds, ['R-REV-01']);
    assert.deepEqual(dryOut.removedSlideIds, ['OLD-ONLY-SLIDE']);
    assert.equal(dryOut.addedSlideIds.length, 27);
    assert.equal(fs.existsSync(writesPath), false, 'dry-run 不可執行任何 Firestore 寫入');

    // 2. Reject repo-inside backup directory (literal path)
    const badBackup = spawnSync(
      process.execPath,
      [
        '--require',
        path.resolve('tests/fixtures/fake-ap2-firestore.cjs'),
        'scripts/import-teaching-deck.mjs',
        '--project',
        'ap2-7ed91',
        '--course',
        '115-1-AP2',
        '--deck',
        deckPath,
        '--write',
        '--backup-dir',
        path.resolve('docs/bad-backup'),
      ],
      { encoding: 'utf8', env: { ...process.env, FAKE_AP2_WRITES: writesPath } },
    );
    assert.notEqual(badBackup.status, 0);
    assert.match(badBackup.stderr, /備份路徑不可位於 repo 內/);
    assert.equal(fs.existsSync(writesPath), false, '拒絕備份路徑時不可執行任何 Firestore 寫入');

    // 2b. Reject external symlink pointing inside repo (F1 regression test)
    const outsideSymlink = path.join(tempDir, 'outside-link');
    fs.symlinkSync(path.resolve('docs'), outsideSymlink, 'dir');
    const badSymlinkBackup = spawnSync(
      process.execPath,
      [
        '--require',
        path.resolve('tests/fixtures/fake-ap2-firestore.cjs'),
        'scripts/import-teaching-deck.mjs',
        '--project',
        'ap2-7ed91',
        '--course',
        '115-1-AP2',
        '--deck',
        deckPath,
        '--write',
        '--backup-dir',
        outsideSymlink,
      ],
      { encoding: 'utf8', env: { ...process.env, FAKE_AP2_WRITES: writesPath } },
    );
    assert.notEqual(badSymlinkBackup.status, 0, '指向 repo 內的外部符號連結必須拒絕');
    assert.match(badSymlinkBackup.stderr, /備份路徑不可位於 repo 內/);
    assert.equal(fs.existsSync(writesPath), false, '符號連結被拒絕時不可呼叫 set');

    // 2c. Reject external symlink with nested non-existent subdir inside repo
    const badNestedViaSymlink = path.join(outsideSymlink, 'nested-probe-backups');
    const badNestedRun = spawnSync(
      process.execPath,
      [
        '--require',
        path.resolve('tests/fixtures/fake-ap2-firestore.cjs'),
        'scripts/import-teaching-deck.mjs',
        '--project',
        'ap2-7ed91',
        '--course',
        '115-1-AP2',
        '--deck',
        deckPath,
        '--write',
        '--backup-dir',
        badNestedViaSymlink,
      ],
      { encoding: 'utf8', env: { ...process.env, FAKE_AP2_WRITES: writesPath } },
    );
    assert.notEqual(badNestedRun.status, 0, '經由外部符號連結指向 repo 內未建立子目錄也必須拒絕');
    assert.equal(fs.existsSync(path.resolve('docs/nested-probe-backups')), false);
    assert.equal(fs.existsSync(writesPath), false);

    // 2d. Worktree vs parent main checkout boundary & default backup path alignment
    const simParent = path.join(tempDir, 'sim-workspace');
    const simMainRepo = path.join(simParent, '課程平台1.0');
    const simWorktree = path.join(simMainRepo, '.worktrees', 'teaching-deck-pages');
    const simGitWorktreeDir = path.join(simMainRepo, '.git', 'worktrees', 'teaching-deck-pages');
    fs.mkdirSync(simWorktree, { recursive: true });
    fs.mkdirSync(simGitWorktreeDir, { recursive: true });
    fs.writeFileSync(path.join(simWorktree, '.git'), `gitdir: ${simGitWorktreeDir}\n`, 'utf8');

    const repoInfo = resolveRepoRoots(simWorktree);
    assert.equal(repoInfo.mainRepoRoot, simMainRepo);
    const defaultBackup = getDefaultBackupDir(simWorktree);
    assert.equal(
      defaultBackup,
      path.join(simParent, '課程平台-私有', 'review-decks', 'backups'),
      '預設備份路徑必須與報告一致且位於主 checkout 外',
    );
    assert.equal(isInsideRepo(defaultBackup, simWorktree), false);
    assert.equal(
      isInsideRepo(path.join(simMainRepo, '.worktrees', '課程平台-驗收證據'), simWorktree),
      true,
      '位於主 checkout .worktrees 下的路徑仍屬 repo 內，必須視為 repo 內並拒絕',
    );
    assert.equal(
      isInsideRepo(path.join(simMainRepo, '..codex-backups'), simWorktree),
      true,
      '主 checkout 下以 .. 開頭的普通子目錄仍屬 repo 內，必須視為 repo 內並拒絕',
    );
    assert.equal(
      isInsideRepo(path.join(simWorktree, '..codex-verify-backups'), simWorktree),
      true,
      'worktree 下以 .. 開頭的普通子目錄仍屬 repo 內，必須視為 repo 內並拒絕',
    );
    assert.equal(
      isInsideRepo(path.join(simParent, '課程平台1.0-outside'), simWorktree),
      false,
      '主 checkout 同層但名稱前綴相同的外部目錄不應誤判為 repo 內',
    );

    // 2e. F1b regression: direct repo-inside ..-prefixed directory must be rejected
    const dotPrefixedInside = path.resolve('..codex-verify-backups');
    const badDotPrefixRun = spawnSync(
      process.execPath,
      [
        '--require',
        path.resolve('tests/fixtures/fake-ap2-firestore.cjs'),
        'scripts/import-teaching-deck.mjs',
        '--project',
        'ap2-7ed91',
        '--course',
        '115-1-AP2',
        '--deck',
        deckPath,
        '--write',
        '--backup-dir',
        dotPrefixedInside,
      ],
      { encoding: 'utf8', env: { ...process.env, FAKE_AP2_WRITES: writesPath } },
    );
    assert.notEqual(badDotPrefixRun.status, 0, '直接指定 repo 內 .. 開頭子目錄必須拒絕');
    assert.match(badDotPrefixRun.stderr, /備份路徑不可位於 repo 內/);
    assert.equal(fs.existsSync(dotPrefixedInside), false, '拒絕時不可建立 ..codex-verify-backups');
    assert.equal(fs.existsSync(writesPath), false, '拒絕時不可呼叫 set');

    // 2f. F1b regression: external symlink pointing to repo-inside ..-prefixed directory must be rejected
    const dotLinkTargetInside = path.resolve('..codex-link-backups');
    const outsideDotSymlink = path.join(tempDir, 'external-dot-link');
    fs.symlinkSync(dotLinkTargetInside, outsideDotSymlink, 'dir');
    const badDotLinkRun = spawnSync(
      process.execPath,
      [
        '--require',
        path.resolve('tests/fixtures/fake-ap2-firestore.cjs'),
        'scripts/import-teaching-deck.mjs',
        '--project',
        'ap2-7ed91',
        '--course',
        '115-1-AP2',
        '--deck',
        deckPath,
        '--write',
        '--backup-dir',
        outsideDotSymlink,
      ],
      { encoding: 'utf8', env: { ...process.env, FAKE_AP2_WRITES: writesPath } },
    );
    assert.notEqual(badDotLinkRun.status, 0, '指向 repo 內 .. 開頭子目錄的外部符號連結必須拒絕');
    assert.match(badDotLinkRun.stderr, /備份路徑不可位於 repo 內/);
    assert.equal(fs.existsSync(dotLinkTargetInside), false, '拒絕時不可建立 ..codex-link-backups');
    assert.equal(fs.existsSync(writesPath), false, '拒絕時不可呼叫 set');

    // 3. --write mode backs up existing presentation outside repo and writes only teacherAssets/presentation
    const writeRun = spawnSync(
      process.execPath,
      [
        '--require',
        path.resolve('tests/fixtures/fake-ap2-firestore.cjs'),
        'scripts/import-teaching-deck.mjs',
        '--project',
        'ap2-7ed91',
        '--course',
        '115-1-AP2',
        '--deck',
        deckPath,
        '--write',
        '--backup-dir',
        backupDir,
      ],
      { encoding: 'utf8', env: { ...process.env, FAKE_AP2_WRITES: writesPath } },
    );
    assert.equal(writeRun.status, 0, writeRun.stderr);
    const writeOut = JSON.parse(writeRun.stdout);
    assert.equal(writeOut.mode, 'write');
    assert(fs.existsSync(writeOut.backupFile), '寫入前必須產生備份檔');
    const backupContent = JSON.parse(fs.readFileSync(writeOut.backupFile, 'utf8'));
    assert.equal(backupContent.exists, true);
    assert.equal(backupContent.data.title, '舊版測試簡報');
    assert.equal(backupContent.data.slides.length, 2);

    const writes = JSON.parse(fs.readFileSync(writesPath, 'utf8'));
    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, 'courses/115-1-AP2/teacherAssets/presentation');
    assert.equal(writes[0].data.slides.length, 28);
    assert(!writes.some((w: any) => w.path.includes('classroomConfig')));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('授課控制台瀏覽器驗收：載入 28 頁、Pages 圖片顯示、互動頁開題／收題／公佈答案、CSP 阻擋外部網域圖片', async () => {
  const res = await verifyTeachingDeckPages();
  assert.equal(res.passed, true);
  assert.equal(res.slideCount, 28);
  assert.equal(res.cspCheck.allowed.loaded, true);
  assert.equal(res.cspCheck.blocked.loaded, false);
});
