import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { checkReadability } from './readability-check.mjs';
import { readabilityPreview } from '../materials-src/apply-kit/readability-preview.mjs';
import { approvedUrinaryDocument, approvedUrinarySlugs } from './urinary-release-build.mjs';
const outIndex = process.argv.indexOf('--out');
const out = path.resolve(
  outIndex >= 0 ? process.argv[outIndex + 1] : '/tmp/course-readability-sample',
);
fs.mkdirSync(out, { recursive: true });
const before = path.resolve('public/materials/kidney-anatomy-v1/index.html'),
  after = path.join(out, 'kidney-anatomy-preview.html');
fs.writeFileSync(after, readabilityPreview(fs.readFileSync(before, 'utf8')));
// Shared-kit rule: render ten previews without writing public/ or registering materials.
const rebuilds = [];
for (const slug of approvedUrinarySlugs) {
  const d = approvedUrinaryDocument(slug),
    dir = path.join(out, 'ten-previews');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, d.version + '.html'), d.html);
  rebuilds.push({
    slug,
    sha256: d.sha,
    nodeTotal: d.nodes.length,
    questionTotal: d.assessmentIds.length,
  });
}
fs.writeFileSync(path.join(out, 'ten-preview-builds.json'), JSON.stringify(rebuilds, null, 2));
const shot = async (p, m) => {
  if (m.width !== 390 || !['N1-passed', 'transition', 'opening', 'complete'].includes(m.name))
    return;
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({ path: path.join(out, `${m.label}-${m.name}.png`), animations: 'disabled' });
};
const base = await checkReadability({
  out: path.join(out, 'before'),
  slugs: ['kidney-anatomy'],
  scales: [1],
  sizes: [[390, 844]],
  staticCheck: false,
  onCapture: (p, m) => shot(p, { ...m, label: 'before' }),
});
const adjusted = await checkReadability({
  out: path.join(out, 'after'),
  slugs: ['kidney-anatomy'],
  htmlBySlug: { 'kidney-anatomy': after },
  sizes: [[390, 844]],
  staticCheck: false,
  onCapture: async (p, m) => {
    await shot(p, { ...m, label: m.scale === 1 ? 'after-default' : 'after-xlarge' });
    if (m.name === 'N1-passed') {
      const beforeState = await p.evaluate(() => window.StudentScriptUI.getState());
      await p.locator('[data-readability-zoom]').first().click();
      await p.locator('dialog.readability-zoom').waitFor();
      assert(
        await p
          .locator('.readability-zoom-pane > svg')
          .evaluate((e) => e.getBoundingClientRect().width >= 1000),
      );
      await p.getByRole('button', { name: '關閉放大圖像' }).click();
      assert.deepEqual(await p.evaluate(() => window.StudentScriptUI.getState()), beforeState);
      fs.writeFileSync(
        path.join(out, 'zoom-and-state-proof.json'),
        JSON.stringify({ pass: true, stateUnchanged: true, minZoomWidth: 1000 }, null, 2),
      );
    }
    if (m.name === 'opening') {
      const old = await p.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--font-scale'),
      );
      await p.evaluate(() => {
        localStorage.setItem('course-font-scale', 'xlarge');
        dispatchEvent(
          new StorageEvent('storage', { key: 'course-font-scale', newValue: 'xlarge' }),
        );
      });
      const live = await p.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--font-scale'),
      );
      if (Number(live) !== 1.3) throw Error('font storage event did not apply');
      await p.evaluate(
        (key) => {
          localStorage.setItem('course-font-scale', key);
          dispatchEvent(new StorageEvent('storage', { key: 'course-font-scale' }));
        },
        m.scale === 1 ? 'default' : 'xlarge',
      );
    }
  },
});
console.log(JSON.stringify({ before: base.summary, after: adjusted.summary }));
if (!adjusted.pass) process.exitCode = 1;
