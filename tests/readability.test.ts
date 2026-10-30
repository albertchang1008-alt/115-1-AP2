import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { readabilityMetrics } from '../scripts/lib/readability-metrics.mjs';
import { auditReadabilityCss } from '../scripts/lib/readability-static.mjs';
const css =
  '<style>html{--font-scale:1}body{font:17px/1.6 sans-serif;color:#111;background:white}h1{font-size:20px}p{font-size:17px;line-height:1.6}button{font-size:17px;min-height:44px;color:#111;background:white;border:1px solid #111}</style>';
test('閱讀量測：正確範例通過；實際小字、行高、對比、點擊高與裁字均檢出', async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.setContent(css + '<h1>標題</h1><p>內文與解析</p><button>選項</button>');
    assert.deepEqual((await p.evaluate(readabilityMetrics, {})).issues, []);
    await p.setContent(
      css +
        '<p style="font-size:16px;line-height:1.2;color:#bbb">重要回饋</p><button style="font-size:16px;height:30px;min-height:0;padding:0;width:40px;white-space:nowrap;overflow:hidden">無法完整顯示的長選項</button>',
    );
    const types = new Set((await p.evaluate(readabilityMetrics, {})).issues.map((i) => i.type));
    for (const t of ['font-size', 'line-height', 'contrast', 'target-height', 'control-clipped'])
      assert(types.has(t), t);
  } finally {
    await b.close();
  }
});
test('閱讀量測：字級未接平台設定即FAIL、真正calc後符合特大，重疊選項與水平溢出可檢出', async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.setContent(css + '<p>內文</p>');
    assert(
      (await p.evaluate(readabilityMetrics, { scale: 1.3 })).issues.some(
        (i) => i.type === 'platform-font-scale',
      ),
    );
    await p.addStyleTag({
      content: 'html{--font-scale:1.3}p{font-size:calc(17px * var(--font-scale))}',
    });
    const good = await p.evaluate(readabilityMetrics, { scale: 1.3 });
    assert.deepEqual(good.issues, []);
    assert.equal(good.texts[0].px, 22.1);
    await p.setContent(
      css +
        '<div style="width:500px;height:60px" class="options"><button style="position:absolute;left:0;top:0">甲</button><button style="position:absolute;left:0;top:0">乙</button></div>',
    );
    const types = new Set((await p.evaluate(readabilityMetrics, {})).issues.map((i) => i.type));
    assert(types.has('horizontal-overflow'));
    assert(types.has('choices-overlap'));
  } finally {
    await b.close();
  }
});
test('圖中文字保守檢查：未知點陣圖不得冒充量測PASS，有獨立放大控制才解除待核對', async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  try {
    const p = await b.newPage();
    await p.setContent(
      css +
        '<div class="diagram-region"><svg width="200" height="100"><image width="200" height="100" href="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="/></svg></div>',
    );
    assert(
      (await p.evaluate(readabilityMetrics, {})).issues.some(
        (i) => i.type === 'raster-labels-unverified',
      ),
    );
    await p
      .locator('.diagram-region')
      .evaluate((e) =>
        e.insertAdjacentHTML(
          'beforeend',
          '<button data-readability-zoom aria-label="放大圖像">🔍</button>',
        ),
      );
    assert(
      !(await p.evaluate(readabilityMetrics, {})).issues.some(
        (i) => i.type === 'raster-labels-unverified',
      ),
    );
  } finally {
    await b.close();
  }
});
test('CSS靜態門檻：固定font-size與font shorthand都報錯；白名單精確匹配且必須附理由', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'readability-css-'));
  try {
    fs.mkdirSync(path.join(root, 'src'));
    fs.mkdirSync(path.join(root, 'materials-src/apply-kit'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'src/style.css'),
      '.a{font-size:16px}.b{font-size:calc(17px * var(--font-scale,1))}',
    );
    fs.writeFileSync(path.join(root, 'src/answer-integrity.css'), '.c{font:16px/1.4 sans-serif}');
    fs.appendFileSync(
      path.join(root, 'src/style.css'),
      '.d{font-size:calc(17px + var(--font-scale,1))}',
    );
    const first = auditReadabilityCss(root);
    assert.equal(first.issues.length, 3);
    const allow = first.issues.map((i) => ({ ...i, reason: '合成測試白名單，不套用正式樣式' }));
    assert.equal(auditReadabilityCss(root, allow).issues.length, 0);
    assert.equal(
      auditReadabilityCss(
        root,
        allow.map((a) => ({ ...a, reason: '' })),
      ).issues.length,
      3,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
