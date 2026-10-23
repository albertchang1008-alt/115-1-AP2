import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderApply } from '../materials-src/apply-kit/render.mjs';

const SLUGS = [
  'urinary-route-micturition',
  'fluid-compartments',
  'water-sodium-regulation',
  'electrolyte-balance',
];

const SIZES = [
  [360, 667],
  [390, 844],
  [414, 896],
  [768, 1024],
  [820, 1180],
  [1024, 1366],
  [1280, 800],
  [844, 390],
];

async function checkLayout() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const slug of SLUGS) {
    const baseDir = path.resolve('materials-src', slug);
    const data = JSON.parse(fs.readFileSync(path.join(baseDir, 'apply.json'), 'utf8'));
    const html = renderApply(data, { baseDir, view: 'course' });
    const htmlPath = path.resolve('test-output', slug, 'course.html');
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, html);

    console.log(`Checking 8 viewports for ${slug}...`);

    for (const [w, h] of SIZES) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));

      await page.goto(pathToFileURL(htmlPath).href);
      await page.waitForSelector('#start');
      await page.click('#start');
      await page.waitForSelector('[data-screen="node"]');

      const checkMetrics = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const scrollW = Math.max(body.scrollWidth, html.scrollWidth);
        const clientW = html.clientWidth;
        const header = document.querySelector('.student-header')?.getBoundingClientRect();
        const main = document.querySelector('.student-main')?.getBoundingClientRect();
        const footer = document.querySelector('.student-footer')?.getBoundingClientRect();

        return {
          scrollW,
          clientW,
          overflowX: scrollW > clientW + 1,
          headerOk: header ? header.width <= clientW + 1 : true,
          mainOk: main ? main.width <= clientW + 1 : true,
          footerOk: footer ? footer.width <= clientW + 1 : true,
        };
      });

      if (checkMetrics.overflowX || errors.length > 0) {
        console.error(`  [FAIL] ${slug} at ${w}x${h}:`, { checkMetrics, errors });
        results.push({ slug, size: `${w}x${h}`, pass: false, checkMetrics, errors });
      } else {
        results.push({ slug, size: `${w}x${h}`, pass: true });
      }

      await page.close();
    }
  }

  await browser.close();

  const allPass = results.every(r => r.pass);
  console.log(`\nAll 8 viewports check: ${allPass ? 'ALL PASS (32/32)' : 'FAILURES DETECTED'}`);
  return results;
}

checkLayout().then(r => {
  if (r.some(x => !x.pass)) process.exit(1);
});
