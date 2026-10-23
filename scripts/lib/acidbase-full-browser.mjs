export const chooseFullValue = (page, id, value) =>
  page.locator(`[data-field="${id}"][data-value=${JSON.stringify(value)}]`).click();
export async function performFullOperation(page, i) {
  const select = (id, value) => chooseFullValue(page, id, value);
  if (i === 0) {
    await page.locator('[data-tag="化學緩衝"]').click();
    await page.locator('#slot-buffer').click();
    await page.locator('[data-tag="肺"]').click();
    await page.locator('#slot-lung').click();
    await page.locator('[data-tag="腎臟"]').click();
    await page.locator('#slot-kidney').click();
  }
  if (i === 1) {
    await select('numerator', 'HCO₃⁻');
    await select('denominator', 'H₂CO₃');
  }
  if (i === 2) {
    await page.locator('#accept-h').click();
    await select('carbonate', '細胞外');
    await select('hemoglobin', '血球');
    await select('phosphate', '尿端攜酸');
  }
  if (i === 3) {
    await page.locator('#effective').click();
  }
  if (i === 4) {
    await page.locator('#flip-h').click();
    await page.locator('#flip-bicarb').click();
  }
  if (i === 5) {
    await page.locator('#pick-h').click();
    await page.locator('#nh3').click();
    await select('destination', '尿端');
  }
}
export async function performFullNode(
  page,
  config,
  graph,
  i,
  { afterTask, afterOperation, resume = false } = {},
) {
  if (!resume) await page.locator(`[data-node="${i}"]`).click();
  await performFullOperation(page, i);
  await page.locator('#diagram-next').click();
  if (afterOperation) await afterOperation();
  if (i === 0) await page.locator('[data-boundary="不能"]').click();
  if (i === 1) await chooseFullValue(page, 'prediction', '上升');
  if (i === 2) await chooseFullValue(page, 'boundary', '否');
  if (i === 3) await chooseFullValue(page, 'prediction', '減酸、pH朝上升方向');
  if (i === 5) await chooseFullValue(page, 'retain', '同方向排酸留鹼');
  await page.locator('#task-submit').click();
  if (i === 4) {
    if (afterTask) await afterTask();
    await page.locator('#corrected-next').click();
  } else {
    if (afterTask) await afterTask();
    await page.locator('#task-next').click();
    const q = config.nodes[i].micro;
    await page.getByRole('button', { name: q.options[q.answer], exact: true }).click();
    await page.locator('#micro-submit').click();
  }
  for (const [j, id] of config.nodes[i].edges.entries()) {
    const edge = graph.edges.find((e) => e.id === id);
    const value =
      edge.sign === 'up' && j % 2 === 0 ? '↑' : graph.nodes.find((n) => n.id === edge.from).label;
    await chooseFullValue(page, 'gap-' + j, value);
    await page.locator('#gap-submit').click();
  }
}
export async function metrics(page) {
  return page.evaluate(() => {
    const visible = (e) => {
      const r = e.getBoundingClientRect(),
        s = getComputedStyle(e);
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const outside = [],
      clipping = [],
      small = [];
    for (const e of document.querySelectorAll('body *')) {
      if (
        !visible(e) ||
        e instanceof SVGElement ||
        ['SCRIPT', 'STYLE', 'OPTION'].includes(e.tagName)
      )
        continue;
      const r = e.getBoundingClientRect(),
        s = getComputedStyle(e),
        text = [...e.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent.trim())
          .join('');
      const name = e.id || e.className || e.tagName;
      if (
        (!e.closest('[data-spatial-scroll]') || e.matches('[data-spatial-scroll]')) && (r.left < -0.75 ||
        r.top < -0.75 ||
        r.right > innerWidth + 0.75 ||
        r.bottom > innerHeight + 0.75)
      )
        outside.push({
          name,
          text: text.slice(0, 70),
          box: { x: r.x, y: r.y, right: r.right, bottom: r.bottom },
        });
      if (
        (text || ['SELECT', 'BUTTON'].includes(e.tagName)) &&
        (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)
      )
        clipping.push({
          name,
          text: text.slice(0, 70),
          sw: e.scrollWidth,
          cw: e.clientWidth,
          sh: e.scrollHeight,
          ch: e.clientHeight,
        });
      if (text && parseFloat(s.fontSize) < 14) small.push({ name, text, size: s.fontSize });
    }
    // SVG text must be judged in screen pixels; inherited CSS pixels alone can hide tiny labels.
    for (const e of document.querySelectorAll('svg text')) {
      if (!visible(e)) continue;
      const matrix = e.getScreenCTM();
      const effective =
        parseFloat(getComputedStyle(e).fontSize) *
        Math.min(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d));
      if (effective < 13.99) small.push({ name: 'svg-text', text: e.textContent, size: effective });
      const r = e.getBoundingClientRect(),
        parent = e.ownerSVGElement.getBoundingClientRect();
      if (
        r.left < parent.left - 0.75 ||
        r.right > parent.right + 0.75 ||
        r.top < parent.top - 0.75 ||
        r.bottom > parent.bottom + 0.75
      )
        clipping.push({ name: 'svg-text-outside', text: e.textContent });
    }
    for (const badge of document.querySelectorAll('[data-map-sign]')) {
      const a = badge.getBoundingClientRect();
      for (const label of document.querySelectorAll('[data-map-node]')) {
        const b = label.getBoundingClientRect();
        if (
          Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
        )
          clipping.push({
            name: 'map-sign-label-overlap',
            text: badge.textContent,
            label: label.textContent,
          });
      }
    }
    const canvas=document.querySelector('.spatial-canvas');
    if(canvas){
      const r=canvas.getBoundingClientRect();
      if(r.width<innerWidth*.8)clipping.push({name:'spatial-image-under-80-percent',width:r.width});
      for(const target of document.querySelectorAll('[data-spatial-target]')){
        const b=target.getBoundingClientRect();
        if(b.width<44||b.height<44)clipping.push({name:'spatial-target-under-44px'});
      }
    }
    return {
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      outside,
      clipping,
      small,
    };
  });
}
