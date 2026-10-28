import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_DECK_BYTES = 1024 * 1024; // 1 MiB Firestore document limit
const MAX_DATA_URI_LENGTH = 1024; // Reject embedded data: large images

function getArg(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  const val = args[idx + 1];
  return val.startsWith('--') ? undefined : val;
}

export function validateTeachingDeckPayload(deck) {
  if (!deck || typeof deck !== 'object' || Array.isArray(deck)) {
    throw new Error('Deck 必須為 JSON 物件');
  }
  if (typeof deck.title !== 'string' || !deck.title.trim()) {
    throw new Error('Deck 缺少有效 title');
  }
  if (!Array.isArray(deck.slides) || deck.slides.length === 0) {
    throw new Error('Deck slides 必須為非空陣列');
  }

  const seenIds = new Set();
  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      throw new Error(`第 ${i + 1} 頁格式無效`);
    }
    if (typeof s.id !== 'string' || !s.id.trim()) {
      throw new Error(`第 ${i + 1} 頁缺少有效 slideId`);
    }
    if (seenIds.has(s.id)) {
      throw new Error(`發現重複的 slideId：${s.id}`);
    }
    seenIds.add(s.id);

    if (typeof s.title !== 'string' || !s.title.trim()) {
      throw new Error(`投影片 ${s.id} 缺少有效 title`);
    }
    if (typeof s.html !== 'string' || !s.html.trim()) {
      throw new Error(`投影片 ${s.id} 缺少有效 html`);
    }
    if (typeof s.notes !== 'string') {
      throw new Error(`投影片 ${s.id} notes 必須為字串`);
    }
    if (typeof s.answerPage !== 'boolean') {
      throw new Error(`投影片 ${s.id} answerPage 必須為布林值`);
    }

    const dataMatches = [...s.html.matchAll(/data:[a-zA-Z0-9/+.-]+;[^\s"')>]+/gi)];
    for (const m of dataMatches) {
      if (m[0].length > MAX_DATA_URI_LENGTH || /^data:image\//i.test(m[0])) {
        throw new Error(`投影片 ${s.id} 含內嵌 data: 圖片（長度 ${m[0].length}），請改用 Pages 網址`);
      }
    }
    if (/<svg\b/i.test(s.html)) {
      throw new Error(`投影片 ${s.id} 含 inline <svg>，請改為外部圖檔`);
    }
  }

  const serialized = JSON.stringify({ title: deck.title, slides: deck.slides });
  const bytes = Buffer.byteLength(serialized, 'utf8');
  if (bytes >= MAX_DECK_BYTES) {
    throw new Error(`Deck 大小 ${bytes} bytes 超過 1 MiB (${MAX_DECK_BYTES} bytes) 上限`);
  }

  return {
    title: deck.title,
    slides: deck.slides.map((s) => ({
      id: s.id,
      title: s.title,
      html: s.html,
      notes: s.notes,
      answerPage: s.answerPage,
    })),
    bytes,
    sha256: crypto.createHash('sha256').update(serialized).digest('hex'),
  };
}

export function diffTeachingDeck(existing, next) {
  const oldSlides = Array.isArray(existing?.slides) ? existing.slides : [];
  const oldById = new Map(oldSlides.map((s) => [s.id, s]));
  const nextById = new Map(next.slides.map((s) => [s.id, s]));

  const addedSlideIds = [];
  const removedSlideIds = [];
  const changedSlideIds = [];
  const unchangedSlideIds = [];

  for (const s of next.slides) {
    const prev = oldById.get(s.id);
    if (!prev) {
      addedSlideIds.push(s.id);
    } else if (
      prev.title !== s.title ||
      prev.html !== s.html ||
      (prev.notes || '') !== s.notes ||
      Boolean(prev.answerPage) !== s.answerPage
    ) {
      changedSlideIds.push(s.id);
    } else {
      unchangedSlideIds.push(s.id);
    }
  }
  for (const s of oldSlides) {
    if (!nextById.has(s.id)) {
      removedSlideIds.push(s.id);
    }
  }

  const existingBytes = existing ? Buffer.byteLength(JSON.stringify(existing), 'utf8') : 0;

  return {
    existingExists: Boolean(existing),
    existingTitle: existing?.title ?? null,
    existingSlideCount: oldSlides.length,
    existingBytes,
    newTitle: next.title,
    newSlideCount: next.slides.length,
    newBytes: next.bytes,
    newSha256: next.sha256,
    addedSlideIds,
    removedSlideIds,
    changedSlideIds,
    unchangedSlideIds,
  };
}

function isPathUnderRoot(candidate, root) {
  const normRoot = path.resolve(root);
  const normCandidate = path.resolve(candidate);
  const rel = path.relative(normRoot, normCandidate);
  return (
    rel === '' ||
    (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel))
  );
}

function splitPathSegments(p) {
  return p.split(/[\\/]+/).filter(Boolean);
}

function resolveEffectivePathWithTrace(targetPath) {
  const abs = path.resolve(targetPath);
  const parsed = path.parse(abs);
  let current = parsed.root || path.sep;
  try {
    current = fs.realpathSync(current);
  } catch {
    // Keep root as-is
  }
  const queue = splitPathSegments(abs.slice(parsed.root.length));
  const visited = [abs];
  let symlinkHops = 0;

  while (queue.length > 0) {
    const seg = queue.shift();
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      current = path.dirname(current);
      visited.push(current);
      continue;
    }

    const nextPath = path.join(current, seg);
    visited.push(nextPath);

    let stat = null;
    try {
      stat = fs.lstatSync(nextPath);
    } catch {
      stat = null;
    }

    if (!stat) {
      current = nextPath;
      continue;
    }

    if (stat.isSymbolicLink()) {
      symlinkHops += 1;
      if (symlinkHops > 40) {
        throw new Error(`偵測到循環符號連結：${abs}`);
      }
      const rawTarget = fs.readlinkSync(nextPath);
      if (path.isAbsolute(rawTarget)) {
        const targetParsed = path.parse(rawTarget);
        current = targetParsed.root || path.sep;
        try {
          current = fs.realpathSync(current);
        } catch {
          // Keep root as-is
        }
        queue.unshift(...splitPathSegments(rawTarget.slice(targetParsed.root.length)));
      } else {
        queue.unshift(...splitPathSegments(rawTarget));
      }
      continue;
    }

    try {
      current = fs.realpathSync(nextPath);
    } catch {
      current = nextPath;
    }
    visited.push(current);
  }

  return {
    effectivePath: current,
    visited,
  };
}

export function resolveEffectivePath(targetPath) {
  return resolveEffectivePathWithTrace(targetPath).effectivePath;
}

export function resolveRepoRoots(baseRoot = ROOT) {
  const worktreeRoot = path.resolve(baseRoot);
  const candidates = [worktreeRoot];

  const gitEntry = path.join(worktreeRoot, '.git');
  try {
    const stat = fs.lstatSync(gitEntry);
    if (stat.isFile()) {
      const content = fs.readFileSync(gitEntry, 'utf8');
      const m = content.match(/^gitdir:\s*(.+)$/m);
      if (m) {
        const gitDir = path.resolve(worktreeRoot, m[1].trim());
        if (
          path.basename(path.dirname(gitDir)) === 'worktrees' &&
          path.basename(path.dirname(path.dirname(gitDir))) === '.git'
        ) {
          candidates.push(path.resolve(gitDir, '..', '..', '..'));
        }
      }
    }
  } catch {
    // Ignore if .git is not readable
  }

  if (path.basename(path.dirname(worktreeRoot)) === '.worktrees') {
    candidates.push(path.resolve(worktreeRoot, '..', '..'));
  }

  const allRoots = new Set();
  for (const c of candidates) {
    allRoots.add(path.resolve(c));
    try {
      allRoots.add(fs.realpathSync(c));
    } catch {
      // Ignore if path does not exist
    }
  }

  const mainRepoRoot = candidates[candidates.length - 1];
  let realMainRepoRoot = mainRepoRoot;
  try {
    realMainRepoRoot = fs.realpathSync(mainRepoRoot);
  } catch {
    // Fallback to resolved path
  }

  return {
    worktreeRoot,
    mainRepoRoot,
    realMainRepoRoot,
    roots: [...allRoots],
  };
}

export function getDefaultBackupDir(baseRoot = ROOT) {
  const { mainRepoRoot } = resolveRepoRoots(baseRoot);
  return path.resolve(mainRepoRoot, '..', '課程平台-私有', 'review-decks', 'backups');
}

export function isInsideRepo(targetPath, baseRoot = ROOT) {
  const { roots } = resolveRepoRoots(baseRoot);
  const literalPath = path.resolve(targetPath);
  const effectivePath = resolveEffectivePath(targetPath);
  return roots.some(
    (root) => isPathUnderRoot(literalPath, root) || isPathUnderRoot(effectivePath, root),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const project = getArg(args, '--project');
  const courseId = getArg(args, '--course');
  const deckFile = getArg(args, '--deck');
  const writeMode = args.includes('--write');
  const dryRunFlag = args.includes('--dry-run');

  if (writeMode && dryRunFlag) {
    throw new Error('不可同時指定 --dry-run 與 --write');
  }
  if (project !== 'ap2-7ed91') {
    throw new Error('必須明確指定 --project ap2-7ed91');
  }
  if (!courseId) {
    throw new Error('必須指定 --course <id>');
  }
  if (!deckFile) {
    throw new Error('必須指定 --deck <file>');
  }

  const resolvedDeck = path.resolve(deckFile);
  if (!fs.existsSync(resolvedDeck)) {
    throw new Error(`找不到 deck 檔案：${resolvedDeck}`);
  }

  const rawDeck = JSON.parse(fs.readFileSync(resolvedDeck, 'utf8'));
  const validated = validateTeachingDeckPayload(rawDeck);

  const require = createRequire(new URL('../functions/package.json', import.meta.url));
  const { initializeApp, applicationDefault } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');

  initializeApp({ projectId: project, credential: applicationDefault() });
  const db = getFirestore();

  const courseRef = db.doc(`courses/${courseId}`);
  const presentationRef = courseRef.collection('teacherAssets').doc('presentation');

  let existingData = null;
  let firestoreReadNote = 'ok';
  try {
    const snap = await presentationRef.get();
    existingData = snap.exists ? snap.data() : null;
  } catch (err) {
    if (writeMode) throw err;
    firestoreReadNote = `讀取遠端現有文件失敗（僅本機差異比對）：${err.message}`;
  }

  const diff = diffTeachingDeck(existingData, validated);
  const mode = writeMode ? 'write' : 'dry-run';

  if (!writeMode) {
    console.log(
      JSON.stringify(
        {
          mode,
          project,
          courseId,
          targetPath: `courses/${courseId}/teacherAssets/presentation`,
          touchesClassroomConfig: false,
          deckFile: path.basename(resolvedDeck),
          firestoreReadNote,
          ...diff,
        },
        null,
        2,
      ),
    );
    return;
  }

  const courseSnap = await courseRef.get();
  if (!courseSnap.exists) {
    throw new Error(`課程不存在：courses/${courseId}，拒絕寫入`);
  }

  const defaultBackupDir = getDefaultBackupDir();
  const rawBackupDir = path.resolve(getArg(args, '--backup-dir') || defaultBackupDir);
  if (isInsideRepo(rawBackupDir)) {
    throw new Error(`備份路徑不可位於 repo 內：${rawBackupDir}`);
  }
  const effectiveBackupDir = resolveEffectivePath(rawBackupDir);
  if (isInsideRepo(effectiveBackupDir)) {
    throw new Error(`備份路徑不可位於 repo 內：${effectiveBackupDir}`);
  }
  fs.mkdirSync(effectiveBackupDir, { recursive: true });
  const realBackupDir = fs.realpathSync(effectiveBackupDir);
  if (isInsideRepo(realBackupDir)) {
    throw new Error(`備份路徑不可位於 repo 內：${realBackupDir}`);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeCourse = courseId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const backupFile = path.join(realBackupDir, `${safeCourse}-presentation-backup-${stamp}.json`);
  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      {
        project,
        courseId,
        path: `courses/${courseId}/teacherAssets/presentation`,
        backedUpAt: new Date().toISOString(),
        exists: Boolean(existingData),
        data: existingData,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  await presentationRef.set({
    title: validated.title,
    slides: validated.slides,
  });

  console.log(
    JSON.stringify(
      {
        mode,
        project,
        courseId,
        targetPath: `courses/${courseId}/teacherAssets/presentation`,
        touchesClassroomConfig: false,
        backupFile,
        ...diff,
      },
      null,
      2,
    ),
  );
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
