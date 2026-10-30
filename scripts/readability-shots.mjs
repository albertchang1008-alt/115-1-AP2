import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { platformPage } from './lib/readability-platform.mjs';
const i = process.argv.indexOf('--out'),
  out = path.resolve(
    i >= 0
      ? process.argv[i + 1]
      : path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'readability-shots'),
  );
fs.mkdirSync(out, { recursive: true });
const results = [];
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const version of fs
    .readdirSync('public/materials')
    .filter((v) => fs.existsSync(path.join('public/materials', v, 'index.html'))))
    for (const scale of [1, 1.3]) {
      let p;
      const r = { version, scale };
      results.push(r);
      try {
        p = await platformPage(browser, {
          viewport: { width: 390, height: 844 },
          slug: version.replace(/-v\d+$/, ''),
          version,
          scale,
        });
        await p.goto();
        r.loaded = true;
      } catch (e) {
        r.error = String(e);
        r.loaded = false;
      } finally {
        if (p) {
          r.file = version + '-' + scale + (r.loaded ? '' : '-error') + '.png';
          await p.screenshot({ path: path.join(out, r.file), animations: 'disabled' });
          await p.close();
        }
      }
      console.log(version, scale, r.loaded ? 'CAPTURED' : 'LOAD WARNING');
    }
} finally {
  await browser.close();
}
fs.writeFileSync(
  path.join(out, 'shots.json'),
  JSON.stringify({ viewport: [390, 844], results }, null, 2) + '\n',
);
