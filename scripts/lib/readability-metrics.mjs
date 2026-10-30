/** Runs in the browser; collect rendered text, including content in scrollable panes. */
export function readabilityMetrics({ scale = 1 } = {}) {
  const issues = [],
    texts = [],
    textElements = [],
    controls = [],
    seen = new Set(),
    styles = new WeakMap(),
    vis = new WeakMap(),
    rects = new WeakMap();
  const style = (e) => {
    if (!styles.has(e)) styles.set(e, getComputedStyle(e));
    return styles.get(e);
  };
  const rect = (e) => {
    if (!rects.has(e)) rects.set(e, e.getBoundingClientRect());
    return rects.get(e);
  };
  const path = (e) => {
    if (e.id) return '#' + e.id;
    const parts = [];
    for (let n = e; n && n !== document.body && parts.length < 5; n = n.parentElement) {
      const tag = n.tagName.toLowerCase(),
        same = [...(n.parentElement?.children || [])].filter((x) => x.tagName === n.tagName);
      parts.unshift(
        tag +
          (n.classList.length
            ? '.' + [...n.classList].slice(0, 2).join('.')
            : same.length > 1
              ? `:nth-of-type(${same.indexOf(n) + 1})`
              : ''),
      );
    }
    return parts.join(' > ');
  };
  const visible = (e) => {
    if (vis.has(e)) return vis.get(e);
    const s = style(e),
      b = rect(e),
      v =
        !e.hidden &&
        s.display !== 'none' &&
        s.visibility !== 'hidden' &&
        s.visibility !== 'collapse' &&
        s.clipPath !== 'inset(50%)' &&
        s.clip !== 'rect(0px, 0px, 0px, 0px)' &&
        Number(s.opacity) !== 0 &&
        (!e.parentElement || visibleAncestor(e.parentElement)) &&
        b.width > 0 &&
        b.height > 0;
    vis.set(e, v);
    return v;
  };
  const ancestry = new WeakMap();
  const visibleAncestor = (e) => {
    if (ancestry.has(e)) return ancestry.get(e);
    const s = style(e),
      v =
        !e.hidden &&
        s.display !== 'none' &&
        s.visibility !== 'hidden' &&
        s.visibility !== 'collapse' &&
        s.clipPath !== 'inset(50%)' &&
        s.clip !== 'rect(0px, 0px, 0px, 0px)' &&
        Number(s.opacity) !== 0 &&
        (!e.parentElement || visibleAncestor(e.parentElement));
    ancestry.set(e, v);
    return v;
  };
  const color = (s) => {
    const m = s.match(/^rgba?\(([^)]+)\)/);
    if (!m) return null;
    const a = m[1].split(/[ ,/]+/).map(Number);
    return [a[0], a[1], a[2], a[3] ?? 1];
  };
  const blend = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3]));
  const lum = (c) =>
    c
      .slice(0, 3)
      .map((x) => {
        x /= 255;
        return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      })
      .reduce((s, n, i) => s + n * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (fg, bg) => {
    const a = lum(fg),
      b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const add = (type, e, value, minimum, text) => {
    const key = type + '|' + path(e) + '|' + text;
    if (!seen.has(key)) {
      seen.add(key);
      issues.push({ type, selector: path(e), text: text.slice(0, 150), actual: value, minimum });
    }
  };
  const all = [...document.body.querySelectorAll('*')];
  for (const e of all) {
    if (['SCRIPT', 'STYLE', 'META', 'NOSCRIPT'].includes(e.tagName) || !e.firstChild) continue;
    const direct = [...e.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!direct || !visible(e)) continue;
    const s = style(e),
      svg = !!e.closest('svg'),
      button = e.closest('button,a[href],label,select,[role="button"],[role="radio"]');
    let role = svg
      ? 'diagram'
      : button
        ? 'control'
        : e.closest(
              '[data-screen="assessment"] .student-header,[data-screen="quiz"] .student-header,.stage > h3,.student-header h2,.action-question,.task-title',
            )
          ? 'question'
          : e.closest('h1,h2,h3,h4,h5,h6')
            ? 'heading'
            : e.closest(
                  'small,.figure-caption,.material-reference,.step-counter,.progress-indicator',
                )
              ? 'secondary'
              : 'body';
    const min = { diagram: 12, control: 18, question: 19, heading: 21, secondary: 14, body: 18 }[
      role
    ];
    let px = parseFloat(s.fontSize);
    if (svg) {
      const m = (
        e instanceof SVGElement ? e : e.closest('foreignObject,foreignobject') || e.closest('svg')
      )?.getScreenCTM?.();
      if (m) px *= Math.hypot(m.a, m.b);
    }
    const row = {
      selector: path(e),
      text: direct.slice(0, 150),
      role,
      px,
      cssPx: parseFloat(s.fontSize),
      lineHeight:
        s.lineHeight === 'normal' ? null : parseFloat(s.lineHeight) / parseFloat(s.fontSize),
    };
    texts.push(row);
    textElements.push(e);
    if (
      px + 0.05 < min &&
      !(
        role === 'diagram' &&
        e.closest('.node,.lab,.diagram-region')?.querySelector('[data-readability-zoom]')
      )
    )
      add('font-size', e, px, min, direct);
    if (role === 'body' && (row.lineHeight === null || row.lineHeight < 1.595))
      add('line-height', e, row.lineHeight, 1.6, direct);
    let stack = [],
      opacity = 1,
      unknown = false;
    for (let n = e; n; n = n.parentElement) {
      const cs = style(n);
      stack.unshift(color(cs.backgroundColor) || [0, 0, 0, 0]);
      opacity *= Number(cs.opacity);
      if (cs.backgroundImage !== 'none') unknown = true;
    }
    let bg = [255, 255, 255];
    for (const c of stack) bg = blend(c, bg);
    let fg = color(e instanceof SVGElement ? s.fill : s.color);
    if (fg) {
      fg = [...fg];
      fg[3] *= opacity;
      const ratio = contrast(blend(fg, bg), bg);
      row.contrast = ratio;
      if (ratio < 4.495) add('contrast', e, ratio, 4.5, direct);
    } else add('contrast-unverifiable', e, null, 4.5, direct);
    if (unknown && !svg) add('background-unverifiable', e, null, 4.5, direct);
    // Only horizontal clipping is forbidden; vertical text may be reached by normal scrolling.
    const range = document.createRange();
    range.selectNodeContents(e);
    const box = range.getBoundingClientRect();
    for (let n = e; n && n !== document.body; n = n.parentElement) {
      const cs = style(n);
      if (['hidden', 'clip'].includes(cs.overflowX)) {
        const b = rect(n);
        if (box.left < b.left - 1 || box.right > b.right + 1) {
          add('text-clipped', e, box.width, b.width, direct);
          break;
        }
      }
    }
  }
  for (const e of all.filter(
    (e) =>
      e.matches(
        'button,a[href],input:not([type="hidden"]),select,[role="button"],[role="radio"]',
      ) && visible(e),
  )) {
    const b = rect(e),
      t = (e.textContent || e.getAttribute('aria-label') || e.tagName).trim();
    controls.push({ selector: path(e), height: b.height, text: t.slice(0, 100) });
    if (b.height < 43.9) add('target-height', e, b.height, 44, t);
    if (e.scrollHeight > e.clientHeight + 2)
      add('control-clipped-vertical', e, e.scrollHeight, e.clientHeight, t);
    if (e.scrollWidth > e.clientWidth + 2)
      add('control-clipped', e, e.scrollWidth, e.clientWidth, t);
  }
  const rasterImages = all
    .filter((e) => (e.tagName === 'IMG' || e.tagName.toLowerCase() === 'image') && visible(e))
    .map((e) => {
      const region = e.closest('.diagram-region,.node-figure,.state-figure') || e.parentElement,
        zoom = !!region?.querySelector('[data-readability-zoom]');
      if (!zoom)
        add(
          'raster-labels-unverified',
          e,
          null,
          '可放大或圖外文字核對',
          e.getAttribute('aria-label') || '點陣圖片中的字無法由DOM量測',
        );
      return { selector: path(e), zoom };
    });
  const choices = all.filter(
    (e) =>
      e.matches('.answer-options button,.options button,[data-pool],[data-micro]') && visible(e),
  );
  for (let i = 0; i < choices.length; i++)
    for (let j = i + 1; j < choices.length; j++) {
      const a = choices[i],
        b = choices[j];
      if (a.contains(b) || b.contains(a)) continue;
      const x = a.getBoundingClientRect(),
        y = b.getBoundingClientRect();
      if (
        Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 &&
        Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1
      )
        add('choices-overlap', a, path(b), 0, a.textContent.trim());
    }
  if (document.documentElement.scrollWidth > innerWidth + 1)
    issues.push({
      type: 'horizontal-overflow',
      selector: 'html',
      actual: document.documentElement.scrollWidth,
      minimum: innerWidth,
      text: '',
    });
  const actualScale =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-scale')) || 1;
  if (Math.abs(actualScale - scale) > 0.01)
    issues.push({
      type: 'platform-font-scale',
      selector: 'html',
      actual: actualScale,
      minimum: scale,
      text: 'course-font-scale',
    });
  if (document.documentElement.dataset.readability === 'on') {
    const addedTools = [...document.querySelectorAll('[data-readability-zoom]')].map((e) => [
      e,
      e.style.display,
    ]);
    for (const [e] of addedTools) e.style.display = 'none';
    document.documentElement.removeAttribute('data-readability');
    if (window.StudentScriptUI) dispatchEvent(new Event('resize'));
    for (let i = 0; i < texts.length; i++) {
      const e = textElements[i];
      const original = parseFloat(getComputedStyle(e).fontSize);
      let renderedOriginal = original;
      if (e.closest('svg')) {
        const matrix = (
          e instanceof SVGElement ? e : e.closest('foreignObject,foreignobject') || e.closest('svg')
        )?.getScreenCTM?.();
        if (matrix) renderedOriginal *= Math.hypot(matrix.a, matrix.b);
      }
      texts[i].originalRenderedPx = renderedOriginal;
      if (texts[i].px + 0.05 < renderedOriginal)
        add('font-render-shrunk', e, texts[i].px, renderedOriginal, texts[i].text);
      texts[i].originalPx = original;
      if (texts[i].cssPx + 0.05 < original)
        add('font-shrunk', e, texts[i].cssPx, original, texts[i].text);
    }
    document.documentElement.dataset.readability = 'on';
    for (const [e, display] of addedTools) e.style.display = display;
    if (window.StudentScriptUI) dispatchEvent(new Event('resize'));
  }
  return {
    issues,
    rasterImages,
    textCount: texts.length,
    minPx: texts.length ? Math.min(...texts.map((x) => x.px)) : null,
    texts,
    controls,
    scale: actualScale,
    width: innerWidth,
    height: innerHeight,
  };
}
