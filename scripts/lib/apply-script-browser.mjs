import assert from 'node:assert/strict';
export const state = (p) => p.evaluate(() => window.StudentScriptUI.getState().course);
export async function retryScripted(p) {
  if ((await state(p)).retry) await p.locator('#strict-retry').click();
}
export async function beginScripted(p) {
  if (await p.locator('#begin-action').count()) await p.locator('#begin-action').click();
}
export async function performScriptedStep(p, s, { wrong = false } = {}) {
  await retryScripted(p);
  if(s.type==='locate') {
    if(await p.locator('#locate-skip').count())await p.locator('#locate-skip').click();
    for(const row of s.spatial.required) {
      await p.locator(`[data-spatial-card="${row}"]`).click();
      if(wrong&&s.spatial.points.length===1)await p.locator('.spatial-canvas').click({position:{x:5,y:5}});
      else await p.locator(`[data-spatial-target="${wrong?(s.spatial.expected[row]+1)%s.spatial.points.length:s.spatial.expected[row]}"]`).click();
    }
    if(s.spatial.directions&&!wrong)for(const row of s.spatial.required)await p.locator(`[data-spatial-direction="${row}"]`).click();
    await p.locator('#locate-check').click();
  } else if (s.type === 'matching') {
    if (await p.locator('#match-skip').count()) await p.locator('#match-skip').click();
    for (let row = 0; row < s.cards.length; row++) {
      await p.locator(`[data-match-role="${row}"]`).click();
      const expected = s.expected[row],
        value = wrong ? (expected + 1) % s.slots.length : expected;
      await p.locator(`[data-match-choice="${value}"]`).click();
      if (await p.locator('#match-swap').count()) await p.locator('#match-swap').click();
    }
    await p.locator('#match-check').click();
  } else if (s.type === 'choice' || s.type === 'point')
    await p
      .locator(`[data-operation="${wrong ? (s.answer + 1) % s.options.length : s.answer}"]`)
      .click();
  else if (s.type === 'sequence') {
    if (wrong) await p.locator(`[data-operation="${s.expected[s.unorderedPrefix || 1]}"]`).click();
    else for (const j of s.expected) await p.locator(`[data-operation="${j}"]`).click();
  } else if (s.type === 'explore') {
    for (let j = 0; j < s.options.length; j++) await p.locator(`[data-operation="${j}"]`).click();
  } else if (s.type === 'multi') {
    const wrongList =
      s.expected.length === s.options.length
        ? s.expected.slice(0, Math.max(1, s.expected.length - 1))
        : s.expected.map((j) => (j + 1) % s.options.length);
    for (const j of wrong ? wrongList : s.expected)
      await p.locator(`[data-operation="${j}"]`).click();
    await p.locator('#operation-submit').click();
  } else if (s.type === 'arrows') {
    if (!wrong)
      for (let j = 0; j < s.expected.length; j++) await p.locator(`[data-arrow="${j}"]`).click();
    await p.locator('#operation-submit').click();
  } else if (s.type === 'signs') {
    for (let j = 0; j < s.expected.length; j++) {
      await p.locator(`[data-sign="${j}"]`).click();
      const wanted = wrong ? 1 - s.expected[j] : s.expected[j];
      if ((await state(p)).signs[j] !== wanted) await p.locator(`[data-sign="${j}"]`).click();
    }
    await p.locator('#operation-submit').click();
  } else if (s.type === 'slider') {
    if (s.unit === '%') {
      await p.locator('#glucose-slider').press('Home');
      const target = wrong ? 40 : s.threshold;
      for (let j=0;j<target/(s.stepVal||5);j++) await p.locator('#glucose-slider').press('ArrowRight');
      await p.locator('#glucose-slider').press('Enter');
    } else {
      await p.locator('#glucose-slider').press('End');
      await p.locator('#slider-next').click();
    }
  }
}
export async function finishScriptedActions(p, node, { start = 0 } = {}) {
  await beginScripted(p);
  for (let j = start; j < node.steps.length; j++) {
    await performScriptedStep(p, node.steps[j]);
    await p.locator('#next-step').click();
  }
}
export async function finishScriptedNode(p, node) {
  await finishScriptedActions(p, node);
  if (node.micro) {
    await p.locator(`[data-micro="${node.micro.answer}"]`).click();
    await p.locator('#micro-submit').click();
  }
}
export async function auditApplyScript(p, S, questions) {
  return p.evaluate(
    ({ S, questions }) => {
      const seen = [],
        errors = [],
        visible = (e) => {
          const r = e.getBoundingClientRect(),
            s = getComputedStyle(e);
          return !!r.width && !!r.height && s.display !== 'none' && s.visibility !== 'hidden';
        };
      for (const e of document.querySelectorAll('[data-copy]'))
        if (visible(e)) {
          const id = e.dataset.copy;
          if (e.textContent !== S.units[id]?.text)
            errors.push({ kind: 'changed', id, actual: e.textContent });
          else seen.push(id);
        }
      const common = new Set([
        '開始作答',
        '下一步 →',
        '下一關 →',
        '送出',
        '💡提示',
        '返回',
        '結尾',
        '準備考核',
        '開始考核',
        '看第二層引導',
        '回看對應節點',
        '□',
        '＝',
        ' →',
        ' ←',
      ]);
      for (const e of document.querySelectorAll('[data-common]'))
        if (visible(e) && !common.has(e.textContent) && !/^\d+\s*(mg\/min|%|mL)$/.test(e.textContent))
          errors.push({ kind: 'unapproved-common', text: e.textContent });
      for (const e of document.querySelectorAll('[data-interface]'))
        if (visible(e)) {
          const key = e.dataset.interface;
          let expected = S.common[key];
          if (key.startsWith('match.')) {
            const id = key.slice(6);
            const node = Number(document.querySelector('[data-node]')?.dataset.node), step = Number(document.querySelector('[data-step]')?.dataset.step);
            expected = S.nodes[node]?.steps[step]?.matchingCopy?.[id] || S.matching[id];
            if (/^progress\d+$/.test(id)) {
              const node = Number(document.querySelector('[data-node]')?.dataset.node),
                step = Number(document.querySelector('[data-step]')?.dataset.step),
                total = S.nodes[node]?.steps[step]?.cards.length;
              expected = `已完成 ${Number(id.slice(8))}／${total}`;
            }
          }
          if (e.textContent !== expected)
            errors.push({ kind: 'unapproved-interface', key, text: e.textContent, expected });
        }
      const originals = new Set(
        [...questions.foundation, ...questions.cases].flatMap((q) => [
          q.stem,
          ...q.options,
          q.hint,
          q.explain,
        ]),
      );
      for (const e of document.querySelectorAll('[data-original]'))
        if (visible(e) && !originals.has(e.textContent))
          errors.push({ kind: 'unapproved-original', text: e.textContent });
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walker.nextNode()))
        if (
          text.textContent.trim() &&
          visible(text.parentElement) &&
          !text.parentElement.closest(
            'script,style,[data-copy],[data-common],[data-interface],[data-original]',
          )
        )
          errors.push({ kind: 'extra', text: text.textContent });
      return { seen: [...new Set(seen)], errors };
    },
    { S, questions },
  );
}
