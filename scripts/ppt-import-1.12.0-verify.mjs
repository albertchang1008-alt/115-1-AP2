import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function buildMinimalMultiPagePdf(pageCount = 14) {
  // Build a valid multi-page vector PDF (1920x1080 pt) with vector text per page
  const objects = [];
  const addObj = (body) => {
    const id = objects.length + 1;
    objects.push({ id, body });
    return id;
  };

  const catalogId = addObj(''); // 1
  const pagesId = addObj(''); // 2
  const fontId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'); // 3

  const pageIds = [];
  for (let i = 1; i <= pageCount; i++) {
    const streamText = [
      'q',
      '0.12 0.16 0.20 rg',
      '0 0 1920 1080 re f',
      '0.95 0.97 0.99 rg',
      '80 80 1760 920 re f',
      'BT',
      '/F1 54 Tf',
      '0.08 0.25 0.38 Td',
      '0.08 0.22 0.35 rg',
      '140 880 Td',
      `(Respiratory Review Slide P.${String(i).padStart(2, '0')} - Vector PDF 1920x1080) Tj`,
      '0 -90 Td',
      '/F1 36 Tf',
      `(High-DPI Vector Text Verification for Magnifier [M] & Box Zoom [Z]) Tj`,
      'ET',
      'Q',
    ].join('\n');
    const contentId = addObj(
      `<< /Length ${Buffer.byteLength(streamText, 'ascii')} >>\nstream\n${streamText}\nendstream`,
    );
    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 1920 1080] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[catalogId - 1].body = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1].body = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`;

  let out = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(out, 'ascii'));
    out += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }
  const xrefPos = Buffer.byteLength(out, 'ascii');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(out, 'ascii');
}

export async function verifyPptImport1120({ outDir = '' } = {}) {
  if (outDir) await fsp.mkdir(outDir, { recursive: true });

  const assetsDir = path.resolve('public/materials/review-decks-assets');
  const files = fs
    .readdirSync(assetsDir)
    .filter((f) => f.endsWith('.webp'))
    .sort();
  const pagesPrefix = 'https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/';

  const slideIds = [
    ...Array.from({ length: 14 }, (_, i) => `R-REV-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 14 }, (_, i) => `U-REV-${String(i + 1).padStart(2, '0')}`),
  ];

  const initialDeck = {
    title: '期中複習簡報（呼吸＋泌尿 28 頁）',
    slides: slideIds.map((id, i) => ({
      id,
      title: i < 14 ? `呼吸複習 ${id}` : `泌尿＋體液複習 ${id}`,
      html: `<section style="width:1920px;height:1080px;background:#f8fafc;color:#0f172a;padding:60px;font-family:sans-serif"><h1>${id} 授課投影片</h1><img src="${pagesPrefix}${files[i % files.length]}" alt="${id}" style="height:720px;object-fit:contain"></section>`,
      notes: `講者備註 ${id}`,
      answerPage: false,
    })),
  };

  const initialInteractions = [
    {
      slideId: 'U-REV-04',
      title: '泌尿既有互動題 U-REV-04',
      fields: [
        {
          id: 'f1',
          label: '泌尿既有題幹：腎絲球過濾率受何者調控？',
          kind: 'choice',
          options: ['入球小動脈阻力', '輸尿管蠕動'],
        },
      ],
    },
  ];
  const initialAnswerKeys = {
    'U-REV-04': {
      f1: { answer: '入球小動脈阻力', explanation: '既有泌尿題解析。' },
    },
  };

  const bundle = buildSync({
    entryPoints: ['tests/fixtures/teaching-deck-pages.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  }).outputFiles[0].text;
  const css = await fsp.readFile('src/style.css', 'utf8');

  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--disable-site-isolation-trials'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.route(
      'https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/*',
      async (route) => {
        const fileName = path.basename(new URL(route.request().url()).pathname);
        const filePath = path.join(assetsDir, fileName);
        if (fs.existsSync(filePath)) {
          await route.fulfill({
            status: 200,
            contentType: 'image/webp',
            body: await fsp.readFile(filePath),
          });
        } else {
          await route.fulfill({ status: 404, body: 'Not found' });
        }
      },
    );

    await page.route('http://console.test/', (r) =>
      r.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>',
      }),
    );

    await page.goto('http://console.test/');
    await page.addStyleTag({ content: css });
    await page.addScriptTag({
      content: `
        window.__INITIAL_TEACHING_DECK__ = ${JSON.stringify(initialDeck).replace(/</g, '\\u003c')};
        window.__INITIAL_INTERACTIONS__ = ${JSON.stringify(initialInteractions).replace(/</g, '\\u003c')};
        window.__INITIAL_ANSWER_KEYS__ = ${JSON.stringify(initialAnswerKeys).replace(/</g, '\\u003c')};
      `,
    });
    await page.addScriptTag({ content: bundle });

    // 1. Verify multi-deck selector & 28-page migration button
    const selectDeck = page.getByLabel('選擇簡報');
    await selectDeck.waitFor();
    await page.getByRole('button', { name: /拆分為「呼吸複習」「泌尿＋體液複習」/ }).click();
    await page.getByText('1／14').waitFor();

    // Switch between 呼吸複習 and 泌尿＋體液複習
    await selectDeck.selectOption('urinary-fluid-review');
    await page.getByRole('heading', { name: '泌尿＋體液複習' }).waitFor();
    await selectDeck.selectOption('respiratory-review');
    await page.getByRole('heading', { name: '呼吸複習' }).waitFor();

    if (outDir) {
      await page.screenshot({
        path: path.join(outDir, '01-multi-deck-selector-1920.png'),
        fullPage: false,
      });
    }

    // 2. Open browser-side PPT + XLSX Import Modal
    await page.getByRole('button', { name: '＋ 匯入投影片＋題目表' }).click();
    const modal = page.getByTestId('ppt-import-modal');
    await modal.waitFor();

    const nameInput = modal.getByLabel('簡報名稱');
    await nameInput.fill('呼吸系統 30 分鐘複習樣本');
    const codeInput = modal.getByLabel('簡報代碼');
    await codeInput.fill('resp-sample-112');

    const pdfBuf = buildMinimalMultiPagePdf(14);
    const xlsxBuf = await fsp.readFile(path.resolve('docs/classroom-decks/題目表範本.xlsx'));

    await modal.getByLabel('投影片 PDF').setInputFiles({
      name: '呼吸複習14頁.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuf,
    });
    await modal.getByLabel('題目表 (.xlsx)').setInputFiles({
      name: '題目表範本.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: xlsxBuf,
    });

    const preview = modal.getByTestId('ppt-import-preview');
    await preview.waitFor({ timeout: 15000 });
    await preview.getByText('題目表預覽（共 3 題）').waitFor();
    // Verify True/False large buttons appear in preview
    assert.equal(await preview.locator('.tf-large-btn').count(), 2);

    if (outDir) {
      await page.screenshot({
        path: path.join(outDir, '02-browser-import-preview-1920.png'),
        fullPage: false,
      });
    }

    // Confirm import
    await modal.getByRole('button', { name: '確認匯入並合併題目' }).click();
    await modal.waitFor({ state: 'detached' });

    // 3. Navigate to Page 13 (True/False interactive slide in template: page 13, 0-based index 12)
    const selectSlide = page.getByLabel('選擇投影片');
    await selectSlide.selectOption('12'); // 0-based index 12 = Page 13

    // Open interaction on Page 11 (是非題)
    const consolePane = page.getByTestId('console-pane');
    const studentPane = page.getByTestId('student-pane');
    await consolePane.getByRole('button', { name: '開放作答', exact: true }).click();
    await consolePane.getByRole('button', { name: '結束作答', exact: true }).waitFor();

    // Student opens interaction and sees 2 large True/False buttons (○ 對 / ✕ 錯)
    await studentPane.getByRole('button', { name: '進入互動', exact: true }).click();
    await studentPane.locator('.interaction-options.true-false-options').waitFor();
    assert.equal(await studentPane.locator('label.true-false-btn').count(), 2);
    await studentPane.getByRole('radio', { name: '○ 對' }).check();
    await studentPane.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
    await studentPane.getByText('已送出，等待老師公佈答案', { exact: true }).waitFor();

    // 4. Test all 4 pointer tools (M, S, L, Z) & Esc / bottom buttons
    // Scroll so slide canvas, bottom pointer toolbar, and student true/false buttons are visible
    await page.evaluate(() => {
      window.scrollTo(0, 420);
    });
    await page.waitForTimeout(100);

    // Activate Magnifier (M) via keyboard
    await page.keyboard.press('m');
    const overlay = page.getByTestId('slide-pointer-overlay');
    await overlay.waitFor();
    assert.equal(await overlay.getAttribute('data-active-tool'), 'magnifier');
    assert.equal(await overlay.getAttribute('data-vector-mode'), 'pdf-vector');
    await page.getByTestId('pointer-magnifier-lens').waitFor();

    // Move mouse directly over the PDF vector heading text (y ≈ 20% from top of slide)
    const canvasBox = await overlay.boundingBox();
    if (canvasBox) {
      await page.mouse.move(
        canvasBox.x + canvasBox.width * 0.36,
        canvasBox.y + canvasBox.height * 0.21,
      );
    }
    await page.waitForTimeout(350);

    if (outDir) {
      await page.screenshot({
        path: path.join(outDir, '03-pointer-tools-and-true-false-1920.png'),
        fullPage: false,
      });
      await page.evaluate(() => {
        window.scrollTo(0, 760);
      });
      await page.waitForTimeout(100);
      await page.screenshot({
        path: path.join(outDir, '04-true-false-and-pointer-toolbar-1920.png'),
        fullPage: false,
      });
      await page.evaluate(() => {
        window.scrollTo(0, 420);
      });
      await page.waitForTimeout(100);
    }

    // Switch to Spotlight (S)
    await page.keyboard.press('s');
    assert.equal(await overlay.getAttribute('data-active-tool'), 'spotlight');
    await page.getByTestId('pointer-spotlight-mask').waitFor();

    // Switch to Laser (L)
    await page.keyboard.press('l');
    assert.equal(await overlay.getAttribute('data-active-tool'), 'laser');
    await page.getByTestId('pointer-laser-dot').waitFor();

    // Switch to Box Zoom (Z) via bottom button and drag a box on overlay
    await page.getByRole('button', { name: '框選放大 (Z)' }).click();
    assert.equal(await overlay.getAttribute('data-active-tool'), 'zoombox');
    await overlay.scrollIntoViewIfNeeded();
    const box2 = await overlay.boundingBox();
    if (box2) {
      await page.mouse.move(box2.x + 120, box2.y + 80);
      await page.mouse.down();
      await page.mouse.move(box2.x + 420, box2.y + 260);
      await page.mouse.up();
    }
    await page.getByTestId('pointer-zoombox-stage').waitFor();

    // First Esc exits zoomed box back to full slide, second Esc closes tool
    await page.keyboard.press('Escape');
    await page.getByTestId('pointer-zoombox-stage').waitFor({ state: 'detached' });
    assert.equal(await overlay.getAttribute('data-active-tool'), 'zoombox');
    await page.keyboard.press('Escape');
    await overlay.waitFor({ state: 'detached' });

    assert.deepEqual(errors, []);
    return {
      passed: true,
      screenshots: outDir
        ? [
            '01-multi-deck-selector-1920.png',
            '02-browser-import-preview-1920.png',
            '03-pointer-tools-and-true-false-1920.png',
            '04-true-false-and-pointer-toolbar-1920.png',
          ]
        : [],
    };
  } finally {
    await browser.close();
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const outIdx = process.argv.indexOf('--out');
  const outDir = outIdx !== -1 ? process.argv[outIdx + 1] : '';
  verifyPptImport1120({ outDir })
    .then((res) => console.log(JSON.stringify(res, null, 2)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
