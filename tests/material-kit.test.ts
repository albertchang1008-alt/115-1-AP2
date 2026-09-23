import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMaterialContent } from '../shared/materialKit';

const content = JSON.parse(fs.readFileSync('materials-src/heart-structure/content.json', 'utf8'));
test('教材內容檔驗證固定節點、題目 ID 與答案關聯', () => {
  assert.doesNotThrow(() => validateMaterialContent(content));
  assert.equal(content.nodes.length, 6); assert.equal(content.foundation.length + content.cases.length, 11);
  assert.throws(() => validateMaterialContent({ ...content, foundation: [...content.foundation, content.foundation[0]] }), /foundation.*預期|重複/);
  assert.throws(() => validateMaterialContent({ ...content, cases: content.cases.map((q: any, i: number) => i ? q : { ...q, answer: 99 }) }), /answer/);
  assert.throws(() => validateMaterialContent({ ...content, cases: content.cases.map((q: any, i: number) => i ? q : { ...q, nodeId: 'missing' }) }), /nodeId/);
});
test('心臟構造樣板是單檔、含 SDK、無 CDN 與固定教材 ID', () => {
  const html = fs.readFileSync('public/materials/heart-structure-v1/index.html', 'utf8');
  assert.match(html, /course-learning\.js/); assert.doesNotMatch(html, /cdn\./i); assert.doesNotMatch(html, /[🫀📊📝]/);
  for (const item of [...content.nodes, ...content.foundation, ...content.cases]) assert.match(html, new RegExp(item.id));
});
