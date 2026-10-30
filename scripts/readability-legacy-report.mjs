import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { platformPage } from './lib/readability-platform.mjs';
import { readabilityMetrics } from './lib/readability-metrics.mjs';
import { readabilitySlugs } from './readability-check.mjs';
const i = process.argv.indexOf('--out'),
  out = path.resolve(i >= 0 ? process.argv[i + 1] : '/tmp/readability-legacy');
fs.mkdirSync(out, { recursive: true });
const onlyIndex = process.argv.indexOf('--version'),
  only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : null;
const targeted = new Set(
    readabilitySlugs.map((s) => s + (s === 'urinary-route-micturition' ? '-v2' : '-v1')),
  ),
  versions = fs
    .readdirSync('public/materials')
    .filter(
      (v) =>
        fs.existsSync(path.join('public/materials', v, 'index.html')) &&
        !targeted.has(v) &&
        (!only || v === only),
    ),
  results = [];
const b = await chromium.launch({ channel: 'chrome' });
try {
  for (const version of versions)
    for (const scale of [1, 1.3]) {
      const record = {
        version,
        scale,
        coverage: '390×844 initial screen only; later interactions not certified',
      };
      results.push(record);
      let p;
      try {
        p = await platformPage(b, {
          viewport: { width: 390, height: 844 },
          slug: version.replace(/-v\d+$/, ''),
          version,
          scale,
        });
        const errors = [];
        p.platformPage.on('pageerror', (e) => errors.push(e.message));
        await p.goto();
        Object.assign(record, await p.evaluate(readabilityMetrics, { scale }));
        record.blockedRequests = p.platformBlocked;
        record.pageErrors = errors;
        record.pass =
          record.issues.length === 0 &&
          errors.length === 0 &&
          p.platformBlocked.length === 0 &&
          record.textCount > 0;
        await p.screenshot({
          path: path.join(out, version + '-' + scale + '.png'),
          animations: 'disabled',
        });
      } catch (e) {
        record.error = String(e);
        record.pass = false;
        if (p)
          try {
            await p.screenshot({
              path: path.join(out, version + '-' + scale + '-error.png'),
              animations: 'disabled',
            });
          } catch {}
      } finally {
        if (p) await p.close();
      }
      console.log(version, scale, record.pass ? 'PASS' : 'WARN');
    }
} finally {
  await b.close();
}
fs.writeFileSync(
  path.join(out, 'legacy.json'),
  JSON.stringify({ blocking: false, versions: versions.length, results }, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    blocking: false,
    versions: versions.length,
    views: results.length,
    warnings: results.filter((r) => !r.pass).length,
  }),
);
