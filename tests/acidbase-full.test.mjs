import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createAcidbaseModel } from '../materials-src/apply-kit/full-model.mjs';
import { checkFullContent } from '../materials-src/apply-kit/full-check.mjs';
const base = path.resolve('materials-src/acid-base-homeostasis'),
  data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'), 'utf8'));
const M = createAcidbaseModel();
function ready() {
  const s = M.fresh();
  for (let i = 0; i < 6; i++) {
    M.markNode(s, i, 'task', true);
    M.markNode(s, i, 'micro', true);
    M.markNode(s, i, 'edges', true);
    M.answerFoundation(s, i, true);
  }
  return s;
}
test('all diagram, microcheck, and graph prerequisites prevent answering and completion', () => {
  const s = M.fresh();
  assert.equal(M.markNode(s, 0, 'micro', true), false);
  assert.equal(M.markNode(s, 0, 'edges', true), false);
  assert.equal(M.answerFoundation(s, 0, true), false);
  assert.equal(M.answerCase(s, data.pool[0], data.pool[0].answer), false);
  s.casePassed = true;
  s.trace = true;
  assert.equal(M.complete(s), false);
});
test('two tiers are atomic and retry flips every group, resets cases/trace but retains node work', () => {
  const s = ready();
  s.order = ['P', 'R', 'K', 'N', 'S'];
  const a = M.pair(data, s);
  assert.equal(a.length, 5);
  assert.equal(a.filter((q) => q.reasons).length, 3);
  const q = a[1];
  assert.equal(M.answerCase(s, q, q.answer, q.reasonAnswer), false); // wrong group order cannot pass
  M.answerCase(s, a[0], a[0].answer);
  assert.equal(M.answerCase(s, q, q.answer, (q.reasonAnswer + 1) % 4), false);
  assert.equal(s.cases.length, 1);
  s.trace = true;
  M.retry(s);
  assert.equal(s.trace, false);
  assert.equal(s.cases.length, 0);
  assert.ok(M.allNodes(s));
  assert.equal(s.foundation.length, 6);
  assert.ok(
    M.pair(data, s).every((q) => q.id !== a.find((previous) => previous.group === q.group).id),
  );
});
test('second stage alone never completes; full graph, trace and both correct tiers emit once', () => {
  const s = ready();
  for (const q of M.pair(data, s)) assert.equal(M.answerCase(s, q, q.answer, q.reasonAnswer), true);
  assert.equal(s.casePassed, true);
  assert.equal(M.complete(s), false);
  s.trace = true;
  assert.equal(M.complete(s), true);
  assert.equal(M.complete(s), false);
});
test('approved full profile checks sources, question baseline, and actual graph integrity; bad data fails', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acidbase-source-test-'));
  try {
    const graph = JSON.parse(fs.readFileSync(path.resolve(base, data.mindmapSource), 'utf8')),
      refs = [...data.sources, ...graph.edges.map(({ uid, quote }) => ({ uid, quote }))];
    const uids = [...new Set(refs.map((r) => r.uid))];
    for (const uid of uids)
      fs.writeFileSync(
        path.join(dir, uid + '.md'),
        `---\nuid: ${uid}\nreview_status: reviewed\n---\n` +
          refs
            .filter((r) => r.uid === uid)
            .map((r) => r.quote)
            .join('\n'),
      );
    const progress = path.join(dir, 'todo.jsonl');
    fs.writeFileSync(
      progress,
      uids.map((uid) => JSON.stringify({ uid, status: 'reviewed' })).join('\n'),
    );
    const check = (d) =>
      checkFullContent(d, { cardsDir: dir, progressPath: progress, baseDir: base });
    assert.deepEqual(check(data).errors, []);
    for (const mutate of [
      (d) => (d.nodes[0].micro = { stem: 'obsolete' }),
      (d) => (d.pool[0].answer = 1),
      (d) => (d.pool[0].options[0] = 'invented'),
      (d) => (d.foundation[0].stem += 'extra'),
      (d) => (d.pool[0].feedback[0] += 'extra'),
      (d) => (d.pool[2].reasons[0] += 'extra'),
      (d) => (d.pool[2].reasonFeedback[0] += 'extra'),
      (d) => (d.glossary[0].text += 'extra'),
      (d) => (d.pool[1].side = 'A'),
      (d) => d.nodes[0].edges.push(d.nodes[1].edges[0]),
      (d) => (d.nodes[0].sources[0].quote = 'invented'),
    ]) {
      const d = structuredClone(data);
      mutate(d);
      assert.equal(check(d).pass, false);
    }
    fs.writeFileSync(path.join(dir, uids[0] + '.md'), '---\nreview_status: draft\n---');
    assert.equal(check(data).pass, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
