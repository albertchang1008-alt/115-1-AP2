import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { platformPage } from './lib/readability-platform.mjs';
import { checkApplyScript } from './lib/apply-script-check.mjs';
import { checkScriptLayout } from './lib/acidbase-script-layout.mjs';
import { readabilityMetrics } from './lib/readability-metrics.mjs';
import { validateCapturedEvents } from './lib/release-tracking-proof.mjs';
import { auditReadabilityCss } from './lib/readability-static.mjs';
export const readabilitySlugs =
  'airway-structure lungs-pleura breathing-mechanics lung-function gas-exchange o2-co2-transport respiratory-control kidney-anatomy nephron-circulation filtration-clearance tubular-handling urine-concentration urinary-route-micturition fluid-compartments water-sodium-regulation electrolyte-balance acid-base-homeostasis'.split(
    ' ',
  );
const root = path.resolve(import.meta.dirname, '..');
const publishedVersion = (slug) => slug + (slug === 'urinary-route-micturition' ? '-v2' : '-v1');
export async function checkReadability({
  out = path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'course-readability'),
  slugs = readabilitySlugs,
  scales = [1, 1.3],
  sizes = [
    [390, 844],
    [1280, 800],
  ],
  onCapture: observer,
  staticCheck = true,
  overlay = true,
} = {}) {
  fs.mkdirSync(out, { recursive: true });
  const report = {
    materials: [],
    static: staticCheck
      ? auditReadabilityCss(
          root,
          JSON.parse(fs.readFileSync(path.join(root, 'scripts/readability-allowlist.json'))),
        )
      : null,
    errors: [],
    scope: slugs,
  };
  for (const slug of slugs) {
    const material = { slug, screens: [], errors: [] };
    report.materials.push(material);
    const publicFile = path.join(root, 'public/materials', publishedVersion(slug) + '/index.html');
    for (const scale of scales) {
      const scaleOut = path.join(out, slug, String(scale));
      fs.mkdirSync(scaleOut, { recursive: true });
      const onPage = async () => {};
      const createPage = (browser, { width, height }) =>
        platformPage(browser, { viewport: { width, height }, slug, scale, overlay });
      const measureOne = async (p, meta) => {
        const measured = await p.evaluate(readabilityMetrics, { scale });
        material.screens.push({ ...meta, ...measured, requestedScale: scale });
        if (meta.name === 'complete') {
          await p.platformPage.waitForFunction(() => window.completedCalls === 1);
          const messages = await p.platformPage.evaluate(() => window.platformMessages);
          const events = [
            ...new Map(
              messages
                .filter((m) => m.type === 'learning-events')
                .flatMap((m) => m.events)
                .map((e) => [e.id, e]),
            ).values(),
          ];
          const ids = await p.evaluate(() =>
            (
              document.querySelector('meta[name="material-assessment-ids"]') ||
              document.querySelector('meta[name="material-ids"]')
            ).content.split(','),
          );
          validateCapturedEvents(events, new Set(ids));
          fs.writeFileSync(
            path.join(scaleOut, `events-${meta.width}x${meta.height}.json`),
            JSON.stringify(
              {
                pass: true,
                completedCalls: await p.platformPage.evaluate(() => window.completedCalls),
                events,
              },
              null,
              2,
            ) + '\n',
          );
        }
        if (
          meta.width === 390 &&
          [
            'opening',
            'N1-before',
            'N1-passed',
            'transition',
            'foundation-0',
            'foundation-5-correct',
            'case-0',
            'complete',
          ].includes(meta.name)
        ) {
          const dir = path.join(out, 'shots');
          fs.mkdirSync(dir, { recursive: true });
          if (meta.name.startsWith('foundation') || meta.name === 'case-0')
            await p
              .locator(
                `.stage[data-kind="${meta.name === 'case-0' ? 'case' : 'foundation'}"][data-index="${meta.name.match(/^foundation-(\d+)/)?.[1] || '0'}"]`,
              )
              .scrollIntoViewIfNeeded();
          else
            await p.evaluate(() => {
              scrollTo(0, 0);
              document.body.scrollTop = 0;
            });
          await p.platformPage.evaluate(
            () => (document.querySelector('.reading-body').scrollTop = 0),
          );
          await p.screenshot({
            path: path.join(dir, `${slug}-${scale}-${meta.name}.png`),
            animations: 'disabled',
          });
        }
        if (observer) await observer(p, { slug, scale, ...meta, ...measured });
      };
      const capture = async (p, meta) => {
        await measureOne(p, meta);
        if (
          (await p.locator('.matching-guide[data-guide-step="1"]').count()) &&
          meta.name.endsWith('before')
        ) {
          await p.locator('[data-match-role]:enabled').first().click();
          await measureOne(p, { ...meta, name: meta.name + '-guide-2' });
          await p.locator('[data-match-choice]').first().click();
          await measureOne(p, { ...meta, name: meta.name + '-guide-3' });
          if (await p.locator('#match-understood').count())
            await p.locator('#match-understood').click();
          else if (await p.locator('#match-skip').count()) await p.locator('#match-skip').click();
        }
      };
      try {
        if (readabilitySlugs.indexOf(slug) >= 7) {
          const options = {
            out: scaleOut,
            sizes,
            shots: false,
            html: publicFile,
            onPage,
            onCapture: capture,
            observeOnly: true,
            createPage,
          };
          const base = path.join(root, 'materials-src', slug);
          if (slug === 'acid-base-homeostasis')
            await checkScriptLayout(JSON.parse(fs.readFileSync(path.join(base, 'full.json'))), {
              ...options,
              file: path.join(base, 'full.json'),
            });
          else await checkApplyScript(path.join(base, 'apply.json'), options);
        } else await walkRespiratory(slug, publicFile, sizes, onPage, capture, createPage);
      } catch (e) {
        material.errors.push(String(e.stack || e));
        report.errors.push({ slug, scale, error: String(e) });
      }
    }
    material.issueCount = material.screens.reduce((n, s) => n + s.issues.length, 0);
    material.minPx = Math.min(
      ...material.screens.flatMap((s) => (s.minPx === null ? [] : [s.minPx])),
    );
    material.pass = !material.issueCount && !material.errors.length;
    fs.writeFileSync(path.join(out, slug + '.json'), JSON.stringify(material, null, 2) + '\n');
    console.log(
      'READABILITY',
      slug,
      material.pass ? 'PASS' : 'FAIL',
      material.issueCount,
      'minPx',
      material.minPx,
    );
  }
  const targeted = new Set(readabilitySlugs.map(publishedVersion));
  report.warningMaterials = fs
    .readdirSync(path.join(root, 'public/materials'))
    .filter(
      (f) =>
        fs.existsSync(path.join(root, 'public/materials', f, 'index.html')) && !targeted.has(f),
    );
  report.summary = {
    materials: report.materials.length,
    pass: report.materials.filter((m) => m.pass).length,
    fail: report.materials.filter((m) => !m.pass).length,
    screens: report.materials.reduce((n, m) => n + m.screens.length, 0),
    issues: report.materials.reduce((n, m) => n + m.issueCount, 0),
    staticIssues: report.static?.issues.length || 0,
    errors: report.errors.length,
  };
  report.pass =
    report.summary.fail === 0 && report.summary.staticIssues === 0 && report.summary.errors === 0;
  const compact = {
    ...report,
    materials: report.materials.map(({ screens, ...m }) => ({ ...m, screens: screens.length })),
  };
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(compact, null, 2) + '\n');
  console.log(JSON.stringify(compact.summary));
  return compact;
}
async function walkRespiratory(slug, file, sizes, onPage, capture, createPage) {
  const content = JSON.parse(
      fs.readFileSync(path.join(root, 'materials-src', slug, 'content.json')),
    ),
    browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const [width, height] of sizes) {
      const p = createPage
        ? await createPage(browser, { width, height })
        : await browser.newPage({ viewport: { width, height } });
      p.setDefaultTimeout(8000);
      await onPage(p);
      await p.goto(pathToFileURL(file).href);
      const snap = (name) => capture(p, { name, width, height });
      await snap('opening');
      for (const state of content.lab.states || []) {
        await p.locator(`button[data-lab-state="${state.id}"]`).click();
        await snap('lab-' + state.id);
      }
      const predict = p.locator('.predict [data-answer]');
      if (await predict.count())
        for (const i of [
          content.lab.predict.answer,
          (content.lab.predict.answer + 1) % content.lab.predict.options.length,
        ]) {
          await p.locator(`.predict [data-answer="${i}"]`).click();
          await snap('predict-' + i);
        }
      for (const node of content.nodes) {
        await p.locator(`[data-node="${node.id}"]`).click();
        await snap('node-' + node.id);
        await p.locator(`[data-close-node="${node.id}"]`).click();
      }
      for (const [kind, rows] of [
        ['foundation', content.foundation],
        ['case', content.cases],
      ])
        for (let i = 0; i < rows.length; i++) {
          const q = rows[i],
            stage = p.locator(`[data-kind="${kind}"][data-index="${i}"]`);
          await stage.waitFor({ state: 'visible' });
          await snap(kind + '-' + i);
          await stage.locator(`[data-answer="${(q.answer + 1) % q.options.length}"]`).click();
          await snap(kind + '-' + i + '-wrong');
          if (kind === 'case') {
            await stage.getByText('前往對應節點複習', { exact: true }).click();
            await snap('review-' + i);
            await stage.getByText('重新挑戰本關', { exact: true }).click();
            for (let replay = 0; replay < i; replay++) {
              const prior = p.locator(`[data-kind="case"][data-index="${replay}"]`);
              await prior.locator(`[data-answer="${rows[replay].answer}"]`).click();
              const next = prior.locator('.feedback button');
              if (await next.count()) await next.click();
              else await p.waitForTimeout(300);
            }
          }
          await stage.locator(`[data-answer="${q.answer}"]`).click();
          await snap(kind + '-' + i + '-correct');
          const next = stage.locator('.feedback button');
          if (await next.count()) await next.click();
          else await p.waitForTimeout(300);
        }
      await snap('complete');
      await p.close();
    }
  } finally {
    await browser.close();
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2),
    value = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const result = await checkReadability({
    out: value('--out'),
    slugs: value('--slug') ? [value('--slug')] : undefined,
  });
  if (!result.pass) process.exitCode = 1;
}
