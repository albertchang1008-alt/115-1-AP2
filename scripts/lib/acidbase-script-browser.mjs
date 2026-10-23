export async function retryScript(page) {
  if ((await page.evaluate(() => window.StudentScriptUI.getState())).course.retry)
    await page.locator('#strict-retry').click();
}

export async function placeScriptCards(page, i, { wrong = false, onState } = {}) {
  await retryScript(page);
  if ([0, 2].includes(i)) {
    if (await page.locator('#match-skip').count()) await page.locator('#match-skip').click();
    for (let j = 0; j < 3; j++) {
      if (await page.locator(`[data-match-role="${j}"]`).isDisabled()) continue;
      await page.locator(`[data-match-role="${j}"]`).click();
      if (onState) await onState('menu-' + j);
      await page.locator(`[data-match-choice="${wrong ? (j + 1) % 3 : j}"]`).click();
      if (await page.locator('#match-swap').count()) await page.locator('#match-swap').click();
    }
    await page.locator('#match-check').click();
    if (!wrong) await page.locator('#match-next').click();
    return;
  }
  const count = 2;
  for (let j = 0; j < count; j++) {
    await page.locator(`[data-card="${j}"]`).click();
    await page.locator(`[data-slot="${wrong ? (j + 1) % count : j}"]`).click();
    if (wrong) break;
  }
}

export async function finishScriptMicro(page, script, i) {
  if (i === 4) return;
  const ans = script.nodes[i].micro.answer;
  await page.locator(`[data-micro="${ans}"]`).click();
  await page.locator('#micro-submit').click();
}

export async function finishScriptNode(page, script, i, { afterAction, skipMicro = false } = {}) {
  if (i < 3) await placeScriptCards(page, i);
  if (i === 0) {
    if (afterAction) await afterAction();
    await page.locator('[data-answer="1"]').click();
  }
  if (i === 1) {
    if (afterAction) await afterAction();
    await page.locator('#next-action').click();
    await page.locator('[data-answer="0"]').click();
  }
  if (i === 3) {
    await page.locator('#breathe').click();
    if (afterAction) await afterAction();
    await page.locator('[data-answer="0"]').click();
  }
  if (i === 4) {
    await page.locator('[data-arrow="0"]').click();
    await page.locator('[data-arrow="1"]').click();
    await page.locator('#submit-arrow').click();
  }
  if (i === 5) {
    await page.locator('[data-answer="0"]').click();
    if (afterAction) await afterAction();
    await page.locator('[data-answer="0"]').click();
  }
  if (!skipMicro) await finishScriptMicro(page, script, i);
}

export async function auditScriptText(page, script, data) {
  return page.evaluate(
    ({ script, data }) => {
      const visible = (e) => {
        const r = e.getBoundingClientRect(),
          s = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
      };
      const seen = [],
        errors = [];
      for (const e of document.querySelectorAll('[data-copy]'))
        if (visible(e)) {
          const id = e.dataset.copy,
            actual = e.textContent;
          seen.push(id);
          if (actual !== script.units[id]?.text)
            errors.push({ kind: 'changed', id, actual, expected: script.units[id]?.text });
        }
      const originals = new Set([
        ...data.pool.flatMap((q) => [
          q.stem,
          ...q.options,
          ...q.feedback,
          ...(q.reasons || []),
          ...(q.reasonFeedback || []),
        ]),
      ]);
      const generic = new Set([
        '送出',
        '下一步 →',
        '下一關 →',
        '💡提示',
        '返回',
        '再試一次',
        '回看第 1 關',
        '回看第 4 關',
        '回看第 5 關',
        '回看第 2 關',
        '回看第 3 關',
        '回看第 6 關',
      ]);
      for (const e of document.querySelectorAll('[data-original]'))
        if (visible(e) && !originals.has(e.textContent))
          errors.push({ kind: 'unapproved-original', actual: e.textContent });
      for (const e of document.querySelectorAll('[data-common]'))
        if (visible(e) && !generic.has(e.textContent))
          errors.push({ kind: 'unapproved-button', actual: e.textContent });
      for (const e of document.querySelectorAll('[data-interface]')) {
        if (!visible(e)) continue;
        const approved = script.interfaceCopy?.[e.dataset.interface];
        if (
          !approved ||
          e.textContent !== approved.text ||
          !(e.dataset.interface === 'transitionTitle'
            ? e.matches('[data-screen="transition"] > header > h1 > [data-interface]')
            : e.dataset.interface.startsWith('match.') &&
              !!e.closest('.matching-ui') &&
              [0, 2].includes(Number(document.querySelector('[data-screen="node"]')?.dataset.node)))
        )
          errors.push({ kind: 'unapproved-interface-copy', actual: e.textContent });
      }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const e = n.parentElement;
        if (
          !n.textContent.trim() ||
          !e ||
          !visible(e) ||
          e.closest('script,style,[data-copy],[data-original],[data-common],[data-interface]')
        )
          continue;
        errors.push({ kind: 'extra-text', actual: n.textContent });
      }
      return { seen: [...new Set(seen)], errors };
    },
    { script, data },
  );
}
