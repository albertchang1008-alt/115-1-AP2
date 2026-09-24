import fs from 'node:fs'; import path from 'node:path'; import { ROOT } from './materials.mjs';
// 教材截圖驗收：390／1280 兩種寬度。任何 pageerror、console error、水平捲動或空白畫面都判為失敗。
const slug = process.argv[2]; if (!slug) throw Error('用法：npm run materials:shots <slug>');
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'materials-src', slug, 'content.json'), 'utf8'));
const shots = path.join(ROOT, 'materials-src', slug, 'shots');
fs.rmSync(shots, { recursive: true, force: true }); fs.mkdirSync(shots, { recursive: true }); // 每次重寫，避免殘留舊報告
let chromium; try { ({ chromium } = await import('playwright')); } catch { throw Error('找不到 playwright；請先 npm install -D playwright'); }
const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const errors = [];
const report = { slug, builtAt: new Date().toISOString(), viewports: [], shots: [], errors, nodeIds: content.nodes.map(n => n.id), questionIds: [...content.foundation, ...content.cases].map(q => q.id) };
const url = new URL(`file://${path.join(ROOT, 'public/materials', `${slug}-${content.version}`, 'index.html')}`).href;
const isEcg = content.lab.widget === 'ecg-sim';

for (const [width, height] of [[390, 844], [1280, 800]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() === 'error') errors.push(`${width}px console：${m.text()}`); });
  page.on('pageerror', e => errors.push(`${width}px pageerror：${e.message}`));
  // 平台 SDK 改用本機副本，離線或網路受限時也能驗收
  await page.route('**/materials/course-learning.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(ROOT, 'public/materials/course-learning.js'), 'utf8') }));
  await page.goto(url); await page.waitForTimeout(800);
  const shot = async name => { const file = `${width}-${name}.png`; await page.screenshot({ path: path.join(shots, file), fullPage: true }); report.shots.push(file); };
  if ((await page.evaluate(() => document.body.innerText.trim().length)) < 100) errors.push(`${width}px 畫面空白（內容未渲染）`);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errors.push(`${width}px 水平捲動`);
  await shot('page'); report.viewports.push({ width, height });
  try {
  if (isEcg) {
    for (const hr of [40, 75, 150, 195]) { await page.locator(`.ecg-chip[data-hr="${hr}"]`).click(); await page.waitForTimeout(3000); await shot(`lab-${hr}`); }
    await page.locator('.ecg-pause').click();
    await page.locator('.ecg-over').scrollIntoViewIfNeeded(); const box = await page.locator('.ecg-over').boundingBox();
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5); await page.waitForTimeout(300);
    if (await page.locator('.ecg-zoom-wrap').isHidden()) errors.push(`${width}px 暫停選拍後沒有出現放大檢視`);
    else { await page.locator('.ecg-lay-mech').check(); await page.waitForTimeout(200); }
    await shot('lab-paused-zoom');
    await page.locator('.ecg-pause').click();
    // 各標示題（暫時顯示該題以截圖）
    for (const q of content.foundation.filter(x => x.type === 'label')) {
      const i = content.foundation.indexOf(q);
      await page.evaluate(i => { document.querySelectorAll('.stage').forEach(s => { s.hidden = true; }); const s = document.querySelector(`.stage[data-kind="foundation"][data-index="${i}"]`); s.hidden = false; s.dispatchEvent(new CustomEvent('stage-show')); }, i);
      await page.waitForTimeout(200); await shot(`label-${q.id}`);
    }
  } else {
    for (const state of content.lab.states) { await page.locator(`button[data-lab-state="${state.id}"]`).click(); await shot(`lab-${state.id}`); }
  }
  for (const n of content.nodes) { await page.locator(`[data-node="${n.id}"]`).click(); await shot(`node-${n.id}`); await page.locator(`[data-node="${n.id}"]`).click(); }
  } catch (e) { errors.push(`${width}px 互動失敗：${String(e.message).split('\n')[0]}`); }
  await page.close();
}
report.ok = !errors.length;
fs.writeFileSync(path.join(shots, 'report.json'), JSON.stringify(report, null, 2));
await browser.close(); console.log(JSON.stringify({ ok: report.ok, errors, shots: report.shots.length }));
if (errors.length) process.exitCode = 1;
