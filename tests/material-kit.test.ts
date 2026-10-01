import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMaterialContent } from '../shared/materialKit';

test('三份生理教材維持固定ID與四選一，採教師核定的換題及120／80範例', () => {
  const slugs = ['blood-pressure-regulation', 'lymphatic-system', 'hemodynamics'];
  for (const slug of slugs) {
    const c = JSON.parse(fs.readFileSync('materials-src/' + slug + '/content.json', 'utf8'));
    assert.doesNotThrow(() => validateMaterialContent(c));
    assert.equal(c.nodes.length, 6);
    for (const [kind, rows] of [['foundation', c.foundation], ['case', c.cases]] as const) {
      rows.forEach((q: any, i: number) => {
        assert.equal(q.id, slug + '-' + kind + '-' + (i + 1));
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options).size, 4);
        assert.ok(q.hint); assert.ok(q.nodeId); assert.ok(q.explain);
      });
    }
    assert.doesNotMatch(JSON.stringify(c), /NotebookLM|120／90|个人|条件|长度|后续|推断|哪条/);
  }
  const bp = JSON.parse(fs.readFileSync('materials-src/blood-pressure-regulation/content.json', 'utf8'));
  assert.equal(bp.cases[4].nodeId, 'baroreflex');
  assert.match(bp.cases[4].stem, /壓力受器/);
  assert.doesNotMatch(JSON.stringify([...bp.foundation, ...bp.cases]), /心房反射/);
  assert.ok(bp.nodes[1].points.includes('心房伸展可引起心房反射，使心率增加。'));
  assert.equal(bp.lab.predict.options[bp.lab.predict.answer], '心率下降、小動脈舒張');
  const h = JSON.parse(fs.readFileSync('materials-src/hemodynamics/content.json', 'utf8'));
  assert.equal(h.foundation[5].options[h.foundation[5].answer], '40、約 93 mmHg');
  assert.match(h.nodes[5].points[1], /120／80/);
  assert.doesNotMatch(JSON.stringify(h), /診斷|聽診|疾病|病理/);
});

const content = JSON.parse(fs.readFileSync('materials-src/heart-structure/content.json', 'utf8'));
const ecg = JSON.parse(fs.readFileSync('materials-src/ecg-basics/content.json', 'utf8'));
test('教材內容檔驗證固定節點、題目 ID 與答案關聯', () => {
  assert.doesNotThrow(() => validateMaterialContent(content));
  assert.equal(content.nodes.length, 6); assert.equal(content.foundation.length + content.cases.length, 11);
  assert.throws(() => validateMaterialContent({ ...content, foundation: [...content.foundation, content.foundation[0]] }), /foundation.*預期|重複/);
  assert.throws(() => validateMaterialContent({ ...content, cases: content.cases.map((q: any, i: number) => i ? q : { ...q, answer: 99 }) }), /answer/);
  assert.throws(() => validateMaterialContent({ ...content, cases: content.cases.map((q: any, i: number) => i ? q : { ...q, nodeId: 'missing' }) }), /nodeId/);
});
test('ECG 基礎教材維持六節點、十一題與非診斷內容界線', () => {
  assert.doesNotThrow(() => validateMaterialContent(ecg));
  assert.equal(ecg.nodes.length, 6); assert.equal(ecg.foundation.length + ecg.cases.length, 11);
  assert.ok(ecg.nodes.some((node: any) => node.id === 'ecg-basics-node-06'));
  assert.ok(ecg.credits.some((credit: string) => credit.includes('審核')));
});
test('心臟構造樣板是單檔、含 SDK、無 CDN 與固定教材 ID', () => {
  const html = fs.readFileSync('public/materials/heart-structure-v1/index.html', 'utf8');
  assert.match(html, /course-learning\.js/); assert.doesNotMatch(html, /cdn\./i); assert.doesNotMatch(html, /[🫀📊📝]/);
  for (const item of [...content.nodes, ...content.foundation, ...content.cases]) assert.match(html, new RegExp(item.id));
});

test('標示題型驗證與元件庫洗牌', () => {
  const label = ecg.foundation.find((q: any) => q.type === 'label');
  assert.throws(() => validateMaterialContent({ ...ecg, foundation: ecg.foundation.map((q: any) => q === label ? { ...q, target: 'XX' } : q) }), /標示題/);
  assert.throws(() => validateMaterialContent({ ...ecg, foundation: ecg.foundation.map((q: any) => q === label ? { ...q, tol: 0.2 } : q) }), /標示題/);
  const kit = fs.readFileSync('materials-src/kit/kit.js', 'utf8');
  assert.doesNotMatch(kit, /sort\(\(\)\s*=>\s*Math\.random/); assert.match(kit, /Math\.floor\(Math\.random\(\) \* \(i \+ 1\)\)/);
  assert.match(kit, /aria-expanded/); assert.match(kit, /nodeTime/);
});
