import os from 'node:os';
import assert from 'node:assert/strict';
import { validateCapturedEvents } from './lib/release-tracking-proof.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { checkReadability } from './readability-check.mjs';
const outIndex = process.argv.indexOf('--out');
const out = path.resolve(
  outIndex >= 0
    ? process.argv[outIndex + 1]
    : path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'readability-overlay'),
);
fs.mkdirSync(out, { recursive: true });
const slugs = ['kidney-anatomy', 'airway-structure', 'cardiac-output'];
const saved = new Set();
const capture = async (p, m) => {
  if (m.name === 'opening') {
    const proof = await p.evaluate(() => {
      let blocked = false;
      try {
        localStorage.getItem('course-font-scale');
      } catch {
        blocked = true;
      }
      return {
        origin: self.origin,
        localStorageDenied: blocked,
        kit: document.documentElement.dataset.readabilityKit,
        scale: document.documentElement.style.getPropertyValue('--font-scale'),
        css: document.getElementById('course-readability-overlay')?.href,
      };
    });
    assert.equal(proof.origin, 'null');
    assert(proof.localStorageDenied);
    fs.writeFileSync(
      path.join(out, `${m.slug}-${m.overlay ? 'after' : 'before'}-${m.scale}-sandbox.json`),
      JSON.stringify(proof, null, 2),
    );
  }
  if (m.name === 'complete') {
    await p.platformPage.waitForFunction(() => window.completedCalls === 1);
    const messages = await p.platformPage.evaluate(() => window.platformMessages),
      events = [
        ...new Map(
          messages
            .filter((m) => m.type === 'learning-events')
            .flatMap((m) => m.events)
            .map((e) => [e.id, e]),
        ).values(),
      ];
    const ids = new Set(
      (
        await p.evaluate(
          () =>
            (
              document.querySelector('meta[name="material-assessment-ids"]') ||
              document.querySelector('meta[name="material-ids"]')
            ).content,
        )
      ).split(','),
    );
    validateCapturedEvents(events, ids);
    assert.equal(await p.platformPage.evaluate(() => window.completedCalls), 1);
    fs.writeFileSync(
      path.join(out, `${m.slug}-${m.overlay ? 'after' : 'before'}-${m.scale}-events.json`),
      JSON.stringify({ events, completedCalls: 1, pass: true }, null, 2),
    );
  }
  if (m.overlay && m.slug === 'kidney-anatomy' && m.name === 'N1-passed') {
    const before = await p.evaluate(() => window.StudentScriptUI.getState());
    await p.locator('[data-readability-zoom]').first().click();
    await p.locator('dialog.course-readability-zoom').waitFor();
    assert(
      await p
        .locator('.course-readability-zoom-pane > svg')
        .evaluate((e) => e.getBoundingClientRect().width >= 1200),
    );
    await p.getByRole('button', { name: '關閉放大圖像' }).click();
    assert.deepEqual(await p.evaluate(() => window.StudentScriptUI.getState()), before);
  }
  const label = m.overlay ? (m.scale === 1 ? 'default' : 'xlarge') : 'before';
  const mapping = {
    opening: 'opening',
    'N1-before': 'first-question',
    'N1-passed': 'first-passed',
    'N1-located': 'height-question',
    transition: 'transition',
    'foundation-0': 'first-question',
    'foundation-0-correct': 'first-answer',
    'foundation-5-correct': 'first-passed',
    'case-0': 'transition',
    complete: 'complete',
  };
  const scene = mapping[m.name];
  if (!scene) return;
  const key = m.slug + '-' + label + '-' + scene;
  if (saved.has(key)) return;
  saved.add(key);
  if (m.name.startsWith('foundation') || m.name === 'case-0')
    await p
      .locator(
        `.stage[data-kind="${m.name === 'case-0' ? 'case' : 'foundation'}"][data-index="${m.name.match(/^foundation-(\d+)/)?.[1] || '0'}"]`,
      )
      .scrollIntoViewIfNeeded();
  else if (m.name === 'complete' && m.slug !== 'kidney-anatomy')
    await p.locator('.complete-banner').scrollIntoViewIfNeeded();
  else await p.evaluate(() => scrollTo(0, 0));
  await p.platformPage.evaluate(() => {
    document.querySelector('.reading-body').scrollTop = 0;
    scrollTo(0, 0);
  });
  await p.screenshot({ path: path.join(out, key + '.png'), animations: 'disabled' });
};
for (const overlay of [false, true]) {
  const result = await checkReadability({
    out: path.join(out, overlay ? 'after' : 'before'),
    slugs,
    scales: overlay ? [1, 1.3] : [1],
    sizes: [[390, 844]],
    overlay,
    staticCheck: false,
    onCapture: (p, m) => capture(p, { ...m, overlay }),
  });
  if (overlay && !result.pass) process.exitCode = 1;
}
