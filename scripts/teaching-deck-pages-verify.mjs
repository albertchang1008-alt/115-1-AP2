import { buildSync } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PAGES_PREFIX = 'https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/';

function buildSyntheticPayload(assetsDir) {
  const files = fs
    .readdirSync(assetsDir)
    .filter((f) => f.endsWith('.webp'))
    .sort();
  assert(files.length >= 26, `Expected at least 26 webp assets in ${assetsDir}, found ${files.length}`);

  const slideIds = [
    ...Array.from({ length: 14 }, (_, i) => `R-REV-${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 14 }, (_, i) => `U-REV-${String(i + 1).padStart(2, '0')}`),
  ];
  const interactiveIds = new Set([
    'R-REV-04',
    'R-REV-07',
    'R-REV-10',
    'R-REV-13',
    'U-REV-04',
    'U-REV-07',
    'U-REV-10',
    'U-REV-13',
  ]);
  const answerIds = new Set([
    'R-REV-05',
    'R-REV-08',
    'R-REV-11',
    'R-REV-14',
    'U-REV-05',
    'U-REV-08',
    'U-REV-11',
    'U-REV-14',
  ]);

  let assetIdx = 0;
  const slides = slideIds.map((id) => {
    const isInteractive = interactiveIds.has(id);
    const isAnswer = answerIds.has(id);
    const hasImg = !isInteractive || id === 'U-REV-10';
    const imgFile = files[assetIdx % files.length];
    if (hasImg) assetIdx++;
    const imgHtml = hasImg
      ? `<figure style="width:720px;height:680px;margin:0"><img src="${PAGES_PREFIX}${imgFile}" alt="${id}-fig" style="width:100%;height:100%;object-fit:contain"></figure>`
      : '';
    return {
      id,
      title: `合成投影片 ${id}`,
      html: `<style>html,body{margin:0;width:1920px;height:1080px;background:#fff;color:#142f3c;font-family:sans-serif}section{width:1920px;height:1080px;padding:48px;display:flex;gap:32px;align-items:center;justify-content:space-between}</style><section data-slide-id="${id}"><div><h1>${id} 合成投影片</h1><p>用於無私有路徑之乾淨環境驗收</p></div>${imgHtml}</section>`,
      notes: `講者備註 ${id}`,
      answerPage: isAnswer,
    };
  });

  const interactions = [...interactiveIds].map((slideId) =>
    slideId.endsWith('07')
      ? {
          slideId,
          title: `互動排序 ${slideId}`,
          fields: [
            {
              id: 'f1',
              label: `請排列 ${slideId} 四個步驟順序：`,
              kind: 'order',
              options: ['步驟甲', '步驟乙', '步驟丙', '步驟丁'],
            },
          ],
        }
      : {
          slideId,
          title: `互動單選 ${slideId}`,
          fields: [
            {
              id: 'f1',
              label: `請選擇 ${slideId} 正確敘述：`,
              kind: 'choice',
              options: ['選項一（正確）', '選項二（誘答）', '選項三（誘答）'],
            },
          ],
        },
  );

  const answerKeys = Object.fromEntries(
    interactions.map((d) => [
      d.slideId,
      {
        f1: {
          answer:
            d.fields[0].kind === 'order'
              ? ['步驟甲', '步驟乙', '步驟丙', '步驟丁']
              : '選項一（正確）',
          explanation: `${d.slideId} 合成解析說明文字。`,
        },
      },
    ]),
  );

  return {
    deck: { title: '合成 28 頁複習簡報', slides },
    interactions,
    answerKeys,
  };
}

export async function verifyTeachingDeckPages({
  deckPath = '',
  interactionsPath = '',
  answerKeysPath = '',
  outDir = '',
  checkAll28SlidesImages = false,
} = {}) {
  const assetsDir = path.resolve('public/materials/review-decks-assets');
  if (outDir) await fsp.mkdir(outDir, { recursive: true });

  const payload =
    deckPath && interactionsPath && answerKeysPath
      ? {
          deck: JSON.parse(await fsp.readFile(deckPath, 'utf8')),
          interactions: JSON.parse(await fsp.readFile(interactionsPath, 'utf8')),
          answerKeys: JSON.parse(await fsp.readFile(answerKeysPath, 'utf8')),
        }
      : buildSyntheticPayload(assetsDir);

  assert.equal(payload.deck.slides.length, 28, 'Deck 必須為 28 頁');

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
    const consoleMessages = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => consoleMessages.push(m.text()));

    // Route Pages image requests to local public/materials/review-decks-assets/
    await page.route(
      'https://albertchang1008-alt.github.io/115-1-AP2/materials/review-decks-assets/*',
      async (route) => {
        const url = new URL(route.request().url());
        const fileName = path.basename(url.pathname);
        const filePath = path.join(assetsDir, fileName);
        if (fs.existsSync(filePath)) {
          const body = await fsp.readFile(filePath);
          await route.fulfill({ status: 200, contentType: 'image/webp', body });
        } else {
          await route.fulfill({ status: 404, body: 'Not found' });
        }
      },
    );

    // Also route external evil domain to a valid webp so that ONLY CSP can block it
    const validWebpFile = fs.readdirSync(assetsDir).find((f) => f.endsWith('.webp'));
    const sampleWebpBuf = await fsp.readFile(path.join(assetsDir, validWebpFile));
    let evilNetworkRequested = false;
    await page.route('https://evil.example.com/**', async (route) => {
      evilNetworkRequested = true;
      await route.fulfill({ status: 200, contentType: 'image/webp', body: sampleWebpBuf });
    });

    await page.route('http://console.test/', (r) =>
      r.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>',
      }),
    );

    await page.goto('http://console.test/');
    await page.addStyleTag({ content: css });
    const initScript = `
      window.__INITIAL_TEACHING_DECK__ = ${JSON.stringify(payload.deck).replace(/</g, '\\u003c')};
      window.__INITIAL_INTERACTIONS__ = ${JSON.stringify(payload.interactions).replace(/</g, '\\u003c')};
      window.__INITIAL_ANSWER_KEYS__ = ${JSON.stringify(payload.answerKeys).replace(/</g, '\\u003c')};
    `;
    await page.addScriptTag({ content: initScript });
    await page.addScriptTag({ content: bundle });

    const selectSlide = page.getByLabel('選擇投影片');
    await selectSlide.waitFor();

    const optionCount = await selectSlide.locator('option').count();
    assert.equal(optionCount, 28, '下拉選單應有 28 頁');

    // Poll inside the sandbox="" iframe using CDP evaluate (since sandbox="" disables DOM event callbacks)
    const verifyCurrentSlideIframe = async (expectedSlideId, expectedIndex) => {
      const iframeEl = page.locator('.teaching-canvas iframe');
      await iframeEl.waitFor();
      assert.equal(await iframeEl.getAttribute('sandbox'), '', 'iframe sandbox 必須為空字串');
      const srcDoc = await iframeEl.getAttribute('srcdoc');
      assert(
        srcDoc.includes(
          `content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https://albertchang1008-alt.github.io https://storage.googleapis.com https://firebasestorage.googleapis.com; font-src 'none';"`,
        ),
        'iframe srcDoc 必須包含精確的 CSP 設定',
      );

      let imgStatus = [];
      for (let attempt = 0; attempt < 40; attempt++) {
        const frame = page.frames().find((f) => f !== page.mainFrame());
        if (frame) {
          try {
            const state = await frame.evaluate(() => {
              if (document.readyState !== 'complete') return null;
              const imgs = [...document.querySelectorAll('img')];
              if (!imgs.every((im) => im.complete)) return null;
              return imgs.map((im) => ({
                src: im.getAttribute('src'),
                complete: im.complete,
                naturalWidth: im.naturalWidth,
                naturalHeight: im.naturalHeight,
              }));
            });
            if (state !== null) {
              imgStatus = state;
              break;
            }
          } catch {
            // Frame might be mid-navigation
          }
        }
        await page.waitForTimeout(50);
      }

      const expectedImgCount = (
        payload.deck.slides[expectedIndex].html.match(/<img\b/gi) || []
      ).length;
      assert.equal(
        imgStatus.length,
        expectedImgCount,
        `${expectedSlideId}: 圖片數量不符 (expected ${expectedImgCount}, got ${imgStatus.length})`,
      );
      for (const im of imgStatus) {
        assert(
          im.src.startsWith(PAGES_PREFIX),
          `${expectedSlideId}: 圖片網址必須以 Pages 網域開頭 (${im.src})`,
        );
        assert(
          im.complete && im.naturalWidth > 0,
          `${expectedSlideId}: 圖片載入失敗 (${im.src})`,
        );
      }
      return imgStatus;
    };

    const goToSlideById = async (slideId) => {
      const idx = payload.deck.slides.findIndex((s) => s.id === slideId);
      assert(idx !== -1, `找不到投影片 ${slideId}`);
      await selectSlide.selectOption(String(idx));
      await page.getByText(new RegExp(`^${idx + 1}／28`)).waitFor();
      return verifyCurrentSlideIframe(slideId, idx);
    };

    const shot = async (name) => {
      if (outDir) {
        await page.evaluate((shotName) => {
          if (shotName.includes('reveal')) {
            const el = document.querySelector('.teaching-screen');
            if (el) el.scrollIntoView({ block: 'start' });
          } else {
            window.scrollTo(0, 0);
          }
        }, name);
        await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
      }
    };

    let totalVerifiedImages = 0;
    const slidesToCheck =
      checkAll28SlidesImages || Boolean(outDir)
        ? payload.deck.slides.map((s) => s.id)
        : [
            'R-REV-01',
            'R-REV-03',
            'R-REV-04',
            'R-REV-08',
            'U-REV-01',
            'U-REV-03',
            'U-REV-07',
            'U-REV-10',
          ];

    for (const sid of slidesToCheck) {
      const imgs = await goToSlideById(sid);
      totalVerifiedImages += imgs.length;
      if (
        outDir &&
        [
          'R-REV-01',
          'R-REV-03',
          'R-REV-08',
          'R-REV-11',
          'U-REV-01',
          'U-REV-03',
          'U-REV-05',
          'U-REV-10',
        ].includes(sid)
      ) {
        await shot(`${sid}-1920`);
      }
    }

    // Interactive Flow 1: R-REV-04 (choice question)
    await goToSlideById('R-REV-04');
    const consolePane = page.getByTestId('console-pane');
    const studentPane = page.getByTestId('student-pane');

    await consolePane.getByRole('button', { name: '開放作答', exact: true }).click();
    await consolePane.getByRole('button', { name: '結束作答', exact: true }).waitFor();

    // Student submits answer
    await studentPane.getByRole('button', { name: '進入互動', exact: true }).waitFor();
    await studentPane.getByRole('button', { name: '進入互動', exact: true }).click();
    const r04Expected = String(payload.answerKeys['R-REV-04'].f1.answer);
    await studentPane.getByRole('radio', { name: new RegExp(r04Expected.slice(0, 8)) }).check();
    await studentPane.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
    await studentPane.getByText('已送出，等待老師公佈答案', { exact: true }).waitFor();

    // Teacher closes round in console
    await consolePane.getByRole('button', { name: '結束作答', exact: true }).click();
    const revealBtn1 = consolePane.getByRole('button', { name: '公佈答案', exact: true });
    await revealBtn1.waitFor();

    // Show results before reveal for screenshot comparison
    await consolePane.getByRole('button', { name: '顯示結果', exact: true }).click();
    await consolePane.locator('.interaction-projection').waitFor();
    assert.equal(await consolePane.locator('.interaction-projection .tag-expected').count(), 0);
    await shot('R-REV-04-before-reveal-1920');

    // Teacher clicks 公佈答案
    await revealBtn1.click();
    const revealedBtn1 = consolePane.getByRole('button', { name: '已公佈', exact: true });
    await revealedBtn1.waitFor();
    assert.equal(await revealedBtn1.isDisabled(), true);
    await consolePane.locator('.interaction-projection .tag-expected').first().waitFor();
    await consolePane.locator('.interaction-projection .reveal-explanation').waitFor();
    await shot('R-REV-04-after-reveal-1920');

    // Verify student received reveal feedback
    await studentPane.locator('.reveal-summary.correct').waitFor({ timeout: 6000 });

    // Interactive Flow 2: U-REV-07 (order question)
    await goToSlideById('U-REV-07');
    await consolePane.getByRole('button', { name: '開放作答', exact: true }).click();
    await consolePane.getByRole('button', { name: '結束作答', exact: true }).waitFor();

    const u07Expected = payload.answerKeys['U-REV-07'].f1.answer;
    if (await studentPane.getByRole('button', { name: '進入互動', exact: true }).count()) {
      await studentPane.getByRole('button', { name: '進入互動', exact: true }).click();
    }
    const selects = studentPane.locator('.order-position select');
    await selects.first().waitFor({ timeout: 6000 });
    for (let i = 0; i < u07Expected.length; i++) {
      await selects.nth(i).selectOption(u07Expected[i]);
    }
    await studentPane.getByRole('button', { name: '確認送出並鎖定', exact: true }).click();
    await studentPane.getByText('已送出，等待老師公佈答案', { exact: true }).waitFor();

    await consolePane.getByRole('button', { name: '結束作答', exact: true }).click();
    const revealBtn2 = consolePane.getByRole('button', { name: '公佈答案', exact: true });
    await revealBtn2.waitFor();

    await consolePane.getByRole('button', { name: '顯示結果', exact: true }).click();
    await consolePane.locator('.interaction-projection').waitFor();
    assert.equal(await consolePane.locator('.interaction-projection .tag-expected').count(), 0);
    await shot('U-REV-07-before-reveal-1920');

    await revealBtn2.click();
    const revealedBtn2 = consolePane.getByRole('button', { name: '已公佈', exact: true });
    await revealedBtn2.waitFor();
    assert.equal(await revealedBtn2.isDisabled(), true);
    await consolePane.locator('.interaction-projection .tag-expected').first().waitFor();
    await consolePane.locator('.interaction-projection .reveal-expected-line').waitFor();
    await shot('U-REV-07-after-reveal-1920');

    // CSP Negative Test inside the slide iframe: external domain image MUST be blocked by CSP
    const slideFrame = page.frames().find((f) => f !== page.mainFrame());
    await slideFrame.evaluate((allowedUrl) => {
      const a = document.createElement('img');
      a.id = 'csp-test-allowed';
      a.src = allowedUrl;
      document.body.appendChild(a);

      const b = document.createElement('img');
      b.id = 'csp-test-blocked';
      b.src = 'https://evil.example.com/blocked.webp';
      document.body.appendChild(b);
    }, `${PAGES_PREFIX}${validWebpFile}`);

    let cspCheck = null;
    for (let i = 0; i < 40; i++) {
      const st = await slideFrame.evaluate(() => {
        const a = document.getElementById('csp-test-allowed');
        const b = document.getElementById('csp-test-blocked');
        if (!a || !b || !a.complete || !b.complete) return null;
        return {
          allowed: { loaded: a.naturalWidth > 0, width: a.naturalWidth },
          blocked: { loaded: b.naturalWidth > 0, width: b.naturalWidth },
        };
      });
      if (st) {
        cspCheck = st;
        break;
      }
      await page.waitForTimeout(50);
    }

    assert(cspCheck, 'CSP 圖片測試應完成');
    assert.equal(cspCheck.allowed.loaded, true, 'Pages 網域圖片應允許載入');
    assert(cspCheck.allowed.width > 0);
    assert.equal(cspCheck.blocked.loaded, false, '非白名單網域圖片必須被 CSP 阻擋');
    assert.equal(cspCheck.blocked.width, 0);
    assert.equal(evilNetworkRequested, false, '被 CSP 阻擋的外部圖片不應發出網路請求');
    assert(
      consoleMessages.some(
        (m) =>
          m.includes('https://evil.example.com/blocked.webp') &&
          m.includes('Content Security Policy') &&
          m.includes('img-src data: https://albertchang1008-alt.github.io'),
      ),
      '瀏覽器必須記錄 img-src CSP 阻擋訊息',
    );

    assert.deepEqual(errors, []);
    const summary = {
      passed: true,
      slideCount: payload.deck.slides.length,
      verifiedSlideCount: slidesToCheck.length,
      totalVerifiedImages,
      cspCheck: {
        ...cspCheck,
        evilNetworkRequested,
        cspConsoleLogged: true,
      },
      errors,
    };
    if (outDir) {
      await fsp.writeFile(
        path.join(outDir, 'verification.json'),
        JSON.stringify(summary, null, 2) + '\n',
      );
    }
    await page.close();
    return summary;
  } finally {
    await browser.close();
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : '';
  };
  verifyTeachingDeckPages({
    deckPath: get('--deck'),
    interactionsPath: get('--interactions'),
    answerKeysPath: get('--answer-keys'),
    outDir: get('--out'),
    checkAll28SlidesImages: true,
  })
    .then((res) => console.log(JSON.stringify(res, null, 2)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
