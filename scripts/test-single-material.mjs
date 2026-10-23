import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { compileApplyStudentScript } from '../materials-src/apply-kit/scripted-compile.mjs';

const slug = process.argv[2] || 'urinary-route-micturition';
const baseDir = path.resolve('materials-src', slug);
const data = JSON.parse(fs.readFileSync(path.join(baseDir, 'apply.json'), 'utf8'));
const script = compileApplyStudentScript(baseDir);

const outDir = path.resolve('test-output', slug);
fs.mkdirSync(outDir, { recursive: true });
const htmlFile = path.join(outDir, 'course.html');
fs.writeFileSync(htmlFile, renderApply(data, { baseDir, view: 'course' }));

console.log(`Testing ${slug} with ${script.nodes.length} nodes...`);

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto(pathToFileURL(htmlFile).href);
  await page.waitForSelector('#start');
  console.log('Intro page loaded successfully.');
  
  await page.click('#start');
  await page.waitForSelector('[data-screen="node"]');
  console.log('Entered Node 1.');

  // Check if basics phase is active
  if (await page.locator('#begin-action').count()) {
    console.log('Basics phase present, clicking begin-action...');
    await page.click('#begin-action');
  }

  // Node 1 Step 0: Choice
  console.log('Testing Hint in Node 1...');
  await page.click('#hint-toggle');
  const hintText = await page.locator('.hint-box').innerText();
  console.log('Hint text:', hintText);
  await page.click('#hint-toggle');

  console.log('Solving Step 0...');
  // Option 0 is correct
  await page.click('[data-operation="0"]');
  await page.waitForSelector('#next-step');
  await page.click('#next-step');

  // Step 1: Choice
  console.log('Solving Step 1...');
  await page.click('[data-operation="0"]');
  await page.waitForSelector('#next-node');
  await page.click('#next-node');

  console.log('Node 1 completed! Currently at Node:', await page.locator('[data-screen="node"]').getAttribute('data-node'));

  await browser.close();
  console.log('Test completed cleanly!');
}

run().catch(e => {
  console.error('Test Failed:', e);
  process.exit(1);
});
