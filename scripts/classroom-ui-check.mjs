import { chromium } from 'playwright';
import fs from 'node:fs';
import { strict as assert } from 'node:assert';
const base = 'http://127.0.0.1:8771/.classroom-preview/index.html',
  dir = '.classroom-preview/shots';
fs.mkdirSync(dir, { recursive: true });
const deck = JSON.parse(fs.readFileSync('.classroom-preview/teacher-deck.json', 'utf8'));
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }),
  teacher = await ctx.newPage(),
  student = await ctx.newPage();
const errors = [];
ctx.on('page', (p) => p.on('pageerror', (e) => errors.push(e.message)));
teacher.on('pageerror', (e) => errors.push(e.message));
student.on('pageerror', (e) => errors.push(e.message));
const key = '115-mi-classroom-local-preview-v2';
await teacher.goto(base + '?role=teacher');
await teacher.evaluate((k) => localStorage.removeItem(k), key);
await teacher.reload();
await teacher.getByLabel('選擇投影片').waitFor();
const enterFull = async () => {
  await teacher.bringToFront();
  if (!(await teacher.evaluate(() => !!document.fullscreenElement)))
    await teacher.getByRole('button', { name: '全螢幕簡報', exact: true }).click();
  await teacher.getByRole('button', { name: '回控制台', exact: true }).waitFor();
};
const leaveFull = async () => {
  if (await teacher.evaluate(() => !!document.fullscreenElement))
    await teacher.getByRole('button', { name: '回控制台', exact: true }).click();
};
const choose = async (id) => {
  await teacher
    .getByLabel('選擇投影片')
    .selectOption(String(deck.slides.findIndex((s) => s.id === id)));
};
await choose('c1-predict');
await enterFull();
await teacher.getByRole('button', { name: '開放作答', exact: true }).click();
await student.setViewportSize({ width: 390, height: 844 });
await student.goto(base + '?role=student&uid=student-1');
await student.getByRole('button', { name: '進入互動', exact: true }).click();
await student.getByRole('radio').first().check();
await student.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
await student.getByText('已送出，作答已鎖定。等待教師統整。').waitFor();
assert.equal(await student.getByRole('radio').first().isDisabled(), true);
assert.equal(await student.locator('.poll-results').count(), 0);
await teacher.locator('.poll-total strong').filter({ hasText: '1' }).waitFor();
await enterFull();
await teacher.screenshot({ path: dir + '/teacher-live-1280.png' });
await student.screenshot({ path: dir + '/student-locked-390.png', fullPage: true });
await teacher.getByRole('button', { name: '結束作答', exact: true }).click();
await student.locator('.poll-results').waitFor({ timeout: 10000 });
await teacher.getByRole('button', { name: '再投一輪', exact: true }).click();
await teacher.locator('.poll-total strong').filter({ hasText: '0' }).waitFor();
await teacher.getByRole('button', { name: '結束作答', exact: true }).click();
await leaveFull();
const ids = [
  'c1-predict',
  'c1-toxin',
  'c1-spread',
  'c1-sterile',
  'c1-drug',
  'c1-resist',
  'c2-predict',
  'c2-newborn',
  'c2-first',
  'c2-tcell',
  'c2-hiv',
  'reflect',
];
const checks = [];
for (const id of ids) {
  await choose(id);
  if (id === 'c1-toxin') {
    const frame = teacher.frameLocator('iframe');
    await frame.getByText('A　內毒素').waitFor();
    assert.equal(await frame.locator('table').count(), 0);
  }
  if (id === 'c1-resist') {
    await teacher
      .frameLocator('iframe')
      .getByText(/在自己的課序選擇適當的衛教說明/)
      .waitFor();
    assert.equal(
      await teacher
        .frameLocator('iframe')
        .getByText(/一人當王先生/)
        .count(),
      0,
    );
  }
  await teacher.getByRole('button', { name: '開放作答', exact: true }).click();
  await student.goto(base + '?role=student&uid=qa-' + id);
  await student.getByRole('button', { name: '進入互動', exact: true }).click();
  assert.equal(
    await student.locator('textarea,input[type="text"],[contenteditable="true"]').count(),
    0,
    id + ' has free input',
  );
  const fields = student.locator('.interaction-field');
  for (let i = 0; i < (await fields.count()); i++) {
    const f = fields.nth(i),
      radios = f.getByRole('radio');
    if (await radios.count()) await radios.first().check();
    else {
      const selects = f.getByRole('combobox');
      for (let j = 0; j < (await selects.count()); j++)
        await selects.nth(j).selectOption({ index: j + 1 });
    }
  }
  // Network failure must not claim a successful response; retry keeps the draft.
  if (id === 'c1-toxin') {
    await student.evaluate(() => localStorage.setItem('115-mi-classroom-preview-offline', 'true'));
    await student.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
    await student.getByRole('alert').filter({ hasText: '連線中斷' }).waitFor();
    assert.equal(await student.getByRole('radio').first().isEnabled(), true);
    await student.evaluate(() => localStorage.removeItem('115-mi-classroom-preview-offline'));
  }
  await student.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
  await student.getByText('已送出，作答已鎖定。等待教師統整。').waitFor();
  await teacher.locator('.poll-total strong').filter({ hasText: '1' }).waitFor({ timeout: 10000 });
  if (id === 'c1-toxin') {
    const other = await ctx.newPage();
    await other.setViewportSize({ width: 390, height: 844 });
    await other.goto(base + '?role=student&uid=qa-toxin-second');
    await other.getByRole('button', { name: '進入互動', exact: true }).click();
    await other.getByRole('radio').nth(1).check();
    await other.locator('.interaction-field').nth(1).getByRole('radio').nth(1).check();
    await other.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
    await other.getByText('已送出，作答已鎖定。等待教師統整。').waitFor();
    await teacher.locator('.poll-total strong').filter({ hasText: '2' }).waitFor();
    await other.screenshot({ path: dir + '/' + id + '-student-390.png', fullPage: true });
    await other.close();
  }
  if (id !== 'c1-toxin')
    await student.screenshot({ path: dir + '/' + id + '-student-390.png', fullPage: true });
  const studentBounds = await student.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert(studentBounds.scroll <= studentBounds.width, id + ' student overflow');
  await enterFull();
  await teacher.screenshot({ path: dir + '/' + id + '-teacher-1280.png' });
  assert.equal(await teacher.getByRole('button', { name: /私人參與紀錄/ }).count(), 0);
  assert.equal(await teacher.locator('.teaching-notes').count(), 0);
  await teacher.getByRole('button', { name: '暫時黑屏', exact: true }).click();
  assert.equal(await teacher.locator('.interaction-projection').count(), 0);
  await teacher.getByRole('button', { name: '恢復投影片', exact: true }).click();
  await leaveFull();
  await teacher.getByRole('button', { name: '結束作答', exact: true }).click();
  checks.push({ id, studentBounds });
}
// Both widths / larger type: the native controls must fit, independent of the private slides.
for (const width of [1280, 390]) {
  await teacher.setViewportSize({ width, height: 900 });
  await teacher.evaluate(() => document.documentElement.style.setProperty('--font-scale', '1.2'));
  await choose('c1-toxin');
  await teacher.getByRole('button', { name: '開放作答', exact: true }).click();
  const bounds = await teacher.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert(bounds.scroll <= width, 'teacher overflow ' + width);
  await teacher.screenshot({ path: dir + '/teacher-' + width + '-large-type.png', fullPage: true });
  await teacher.getByRole('button', { name: '結束作答', exact: true }).click();
}
// A delayed private response cannot reappear after entering/leaving fullscreen.
await teacher.setViewportSize({ width: 1280, height: 900 });
await teacher.evaluate(() =>
  localStorage.setItem('115-mi-classroom-preview-records-delay', '1500'),
);
await teacher.getByRole('button', { name: '私人參與紀錄（請先暫停投影）', exact: true }).click();
await enterFull();
await teacher.waitForTimeout(1800);
assert.equal(await teacher.locator('.classroom-private').count(), 0);
await leaveFull();
assert.equal(await teacher.locator('.classroom-private p').count(), 0);
await teacher.evaluate(() => localStorage.removeItem('115-mi-classroom-preview-records-delay'));
assert.equal(errors.length, 0, errors.join('\n'));
fs.writeFileSync(
  'docs/deploy-115-MI-evidence/classroom-ui.json',
  JSON.stringify(
    {
      testedAt: new Date().toISOString(),
      localOnly: true,
      checks,
      widths: [1280, 390],
      fontScale: 1.2,
      errors,
      scenarios: [
        'submit lock',
        'live counts',
        'student results hidden until closed',
        'new round zero with history retained',
        'offline retry',
        'all 12 pages have no free text inputs',
        'fixed choice reason votes',
        'fullscreen privacy',
        'late private response discarded',
        'blackout',
      ],
    },
    null,
    2,
  ) + '\n',
);
await browser.close();
console.log('12互動頁、1280/390、送出鎖定／新輪／斷線／全選項／全螢幕檢查通過。');
