import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

test('共用 kit 最後答對即通關，結果呈現不重送；guided、舊MCQ及題型callback相容', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const mode of ['guided', 'legacy', 'widget']) {
      const page = await browser.newPage();
      const node = { id: 'node-one', title: '節點', summary: '', figure: 'one.svg', concept: '', points: [], clinical: { title: '', text: '' } };
      const q = (id: string) => ({ id, stem: id, options: ['對', '錯', '其他', '以上皆非'], answer: 0, hint: '複習', nodeId: node.id, explain: '解析' });
      const content: any = { slug: 'test', title: 'Test', subtitle: '', label: '', stats: [], nodes: [node], foundation: [q('first')], cases: [q('last')], lab: { figure: 'one.svg', states: [{ id: 'rest', label: '觀察', explain: '' }], predict: { question: '', options: ['對'], answer: 0 } } };
      if (mode === 'guided') content.experience = 'guided';
      if (mode === 'widget') content.cases[0].type = 'label';
      await page.setContent('<html><body></body></html>');
      await page.addScriptTag({ content: 'window.events=[];window.CourseLearning=Object.fromEntries(["answer","hint","explore","nodeTime","complete"].map(k=>[k,(...args)=>events.push({k,args})]));window.EcgLabel={html:()=>"<button class=pass>通過</button>",mount:(el,q,CL,pass)=>el.querySelector("button").addEventListener("click",()=>{CL.answer(q.id,true);pass();})};' });
      await page.addScriptTag({ content: fs.readFileSync('materials-src/kit/kit.js', 'utf8').replace(/^export /gm, '') });
      await page.evaluate(({ content }) => (window as any).mount(content, { 'one.svg': '<svg viewBox="0 0 400 100"></svg>' }), { content });
      await page.locator('[data-kind="foundation"] [data-answer="0"]').click();
      if (mode === 'guided') await page.locator('.feedback button').click();
      const last = page.locator('[data-kind="case"]');
      await last.waitFor({ state: 'visible' });
      if (mode === 'widget') await last.locator('.pass').click();
      else {
        await last.locator('[data-answer="1"]').click();
        assert.equal(await page.evaluate(() => (window as any).events.filter((e: any) => e.k === 'complete').length), 0);
        assert.equal(await last.getByText('重新挑戰本關').isDisabled(), true);
        await last.getByText('前往對應節點複習').click();
        await last.getByText('重新挑戰本關').click();
        await last.locator('[data-answer="0"]').click();
      }
      assert.equal(await page.evaluate(() => (window as any).events.filter((e: any) => e.k === 'complete').length), 1, mode + '：不用按結果鈕');
      if (mode === 'guided') {
        await last.getByText('查看通關結果').click();
        assert.equal(await page.evaluate(() => (window as any).events.filter((e: any) => e.k === 'complete').length), 1);
      }
      await page.close();
    }
  } finally { await browser.close(); }
});
