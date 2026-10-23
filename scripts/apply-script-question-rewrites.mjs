import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
export function approvedQuestionRewrites(root = process.cwd()) {
  const file = path.join(root, 'docs/urinary-release/FIGURE_DEPENDENT_QUESTIONS.md'),
    raw = fs.readFileSync(file, 'utf8');
  const approvedHash = '4c60ff8f3aeb4e02a30321aad88390b87d7acbb80c1b3e914e15cffaf3c58643';
  if (crypto.createHash('sha256').update(raw).digest('hex') !== approvedHash)
    throw Error('Approved rewrite document changed; teacher authorization must be reviewed');
  const drafts = raw
    .split('## 誘答過於明顯清單')[0]
    .split(/^### /m)
    .slice(1)
    .map((section) => {
      const id = section.split('\n')[0].trim();
      const stem = section.match(/^草稿：(.+)$/m)?.[1];
      const opts = section.match(
        /^草稿選項：1\. (.*?)；2\. (.*?)；3\. (.*?)；4\. (.*?)；草稿答案第(\d)項。/m,
      );
      if (!stem || !opts) throw Error('Invalid approved rewrite ' + id);
      return {
        id,
        stem,
        options: opts.slice(1, 5),
        answer: Number(opts[5]) - 1,
        source: path.relative(root, file),
        sourceSha256: crypto.createHash('sha256').update(raw).digest('hex'),
        uid: [...section.matchAll(/依據 `([^`]+)`/g)].map((m) => m[1]),
      };
    });
  if (drafts.length !== 11) throw Error('Expected eleven teacher-approved rewrites');
  return drafts;
}
function contentHash(value) {
  const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}
function plainLanguageApprovals(root) {
  const raw = fs.readFileSync(path.join(root, 'docs/urinary-release/plain-language-apply/approved-content-hashes.json'), 'utf8');
  if (crypto.createHash('sha256').update(raw).digest('hex') !== 'c8e8ad7d9a870f21fdd3df057b59317ccbfeef05578d8c76f7657c3d581897c9')
    throw Error('Approved plain-language manifest changed; authorization must be reviewed');
  const list = JSON.parse(raw);
  if (list.length !== 110 || new Set(list.map(q => q.id)).size !== 110)
    throw Error('Expected exactly 110 approved plain-language questions');
  return new Map(list.map(q => [q.id, q]));
}
function answerEchoApprovals(root) {
  const raw = fs.readFileSync(path.join(root, 'docs/urinary-release/answer-echo-fix/approved-content-hashes.json'), 'utf8');
  if (crypto.createHash('sha256').update(raw).digest('hex') !== '3d58f2b8f5e0ed383fe8eb0f15f140c4c7c8c8052187660aa7cae401ed6c2135')
    throw Error('Approved answer-echo manifest changed; authorization must be reviewed');
  const list = JSON.parse(raw);
  if (list.length !== 8 || new Set(list.map(q => q.id)).size !== 8)
    throw Error('Expected exactly eight answer-echo question revisions');
  return new Map(list.map(q => [q.id, q]));
}
export function validateApprovedQuestionChanges(before, after, root = process.cwd()) {
  if (!Array.isArray(after) || before.length !== after.length) return false;
  const drafts = approvedQuestionRewrites(root), plain = plainLanguageApprovals(root), echo = answerEchoApprovals(root);
  return before.every((q, i) => {
    if (JSON.stringify(q) === JSON.stringify(after[i])) return true;
    const echoApproved = echo.get(q.id);
    if (echoApproved && contentHash(q) === echoApproved.baselineSha256 && contentHash(after[i]) === echoApproved.approvedSha256) return true;
    const approved = plain.get(q.id);
    if (approved && contentHash(q) === approved.baselineSha256 && contentHash(after[i]) === approved.approvedSha256) return true;
    const draft = drafts.find((d) => d.id === q.id);
    return (
      !!draft &&
      JSON.stringify({ ...q, stem: draft.stem, options: draft.options, answer: draft.answer }) ===
        JSON.stringify(after[i])
    );
  });
}
export function applyQuestionRewrites(slugs, { root = process.cwd(), write = false } = {}) {
  const drafts = approvedQuestionRewrites(root),
    changes = [];
  for (const slug of slugs) {
    const file = path.join(root, 'materials-src', slug, 'apply.json'),
      data = JSON.parse(fs.readFileSync(file));
    for (const stage of ['foundation', 'cases'])
      for (const wrapped of data.learning.questions[stage]) {
        const q = wrapped.value || wrapped,
          draft = drafts.find((d) => d.id === q.id);
        if (!draft) continue;
        const prior = structuredClone(q);
        Object.assign(q, { stem: draft.stem, options: draft.options, answer: draft.answer });
        // Preserve learning target, original hint, explanation and all reviewed-card evidence.
        changes.push({ slug, stage, id: q.id, prior, after: structuredClone(q), approved: draft });
      }
    if (write) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  }
  return { drafts, changes };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const slugs = process.argv.slice(2).filter((s) => s !== '--write');
  const r = applyQuestionRewrites(slugs, { write: process.argv.includes('--write') });
  console.log(JSON.stringify({ approved: r.drafts.length, applied: r.changes.map((c) => c.id) }));
}
