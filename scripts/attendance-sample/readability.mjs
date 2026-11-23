// 學生畫面閱讀規範量測（docs/READABILITY_STANDARD.md）：在瀏覽器頁面裡執行，回傳不合格項目。
// 內文≥18px、標題≥21px、次要說明（data-secondary）≥14px、p／li 行高≥1.6、可點區域高≥44px、無水平溢出與截斷、對比≥4.5。
export function measureReadability(scale) {
  const bad = [];
  const lum = (c) => {
    const v = c.map((x) => ((x /= 255) <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = rgb(getComputedStyle(e).backgroundColor);
      if (c.length === 3 || c[3] > 0.99) return c;
    }
    return [255, 255, 255];
  };
  if (document.documentElement.scrollWidth > innerWidth) bad.push(`水平捲動 ${document.documentElement.scrollWidth}>${innerWidth}`);
  for (const el of document.querySelectorAll('#root *')) {
    if (el.closest('[aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const label = `${tag}.${el.className || ''}「${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 14)}」`;
    if (r.right > innerWidth + 0.5 || r.left < -0.5) bad.push(`${label} 超出畫面`);
    if (['a', 'button', 'input', 'select'].includes(tag)) {
      if (r.height < 44) bad.push(`${label} 點擊高 ${r.height.toFixed(1)}<44`);
      if (el.scrollWidth > el.clientWidth + 1) bad.push(`${label} 文字被截斷`);
    }
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText && tag !== 'input') continue;
    const fs = parseFloat(cs.fontSize);
    const base = fs / scale;
    const min = /^h[12]$/.test(tag) ? 21 : el.closest('[data-secondary]') ? 14 : 18;
    if (base < min - 0.01) bad.push(`${label} 字級 ${base.toFixed(1)}<${min}`);
    if (['p', 'li'].includes(tag) && parseFloat(cs.lineHeight) / fs < 1.59) bad.push(`${label} 行高 ${(parseFloat(cs.lineHeight) / fs).toFixed(2)}<1.6`);
    const a = lum(rgb(cs.color).slice(0, 3)), b = lum(bgOf(el).slice(0, 3));
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 4.5) bad.push(`${label} 對比 ${ratio.toFixed(2)}<4.5`);
  }
  return bad;
}
