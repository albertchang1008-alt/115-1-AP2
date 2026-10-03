import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MATERIAL_CATALOG } from '../shared/materials';
import { validateMaterialContent } from '../shared/materialKit';
import { physiologySlugs, readBuiltMaterial } from '../scripts/materials-html-content.mjs';

test('五份已登錄教材的HTML、來源、節點／題目ID及目錄分母完全一致，公開檔保留目前 kit 的作答與通關邏輯', () => {
  const root=process.cwd(), ids=new Set<string>();
  const kit=fs.readFileSync('materials-src/kit/kit.js','utf8').replace(/^export /gm,'');
  const readme=fs.readFileSync('public/materials/README.md','utf8');
  for(const slug of physiologySlugs) {
    const {html,content}=readBuiltMaterial(root,slug);
    validateMaterialContent(content);
    assert.deepEqual(content,JSON.parse(fs.readFileSync(path.join('materials-src',slug,'content.json'),'utf8')));
    assert.equal(content.nodes.length,6);
    assert.equal(content.foundation.length,6);
    assert.equal(content.cases.length,5);
    const catalog=MATERIAL_CATALOG[slug+'-v1'];
    assert(catalog);
    assert.equal(catalog.nodeTotal,content.nodes.length);
    assert.equal(catalog.questionTotal,content.foundation.length+content.cases.length);
    assert.equal(catalog.label,content.label);
    assert.equal(catalog.tracking,'interactive');
    // 公開教材是版本快照；純視覺元件只重建此次授權的教材。
    // 作答／通關核心仍必須一致，避免舊快照採用不同計分行為。
    assert(html.includes(kit.slice(kit.indexOf('  // 兩關題目'))));
    assert(readme.includes(slug+'-v1'));
    for(const row of [...content.nodes,...content.foundation,...content.cases]) {
      assert(!ids.has(row.id),`ID collision: ${row.id}`);
      ids.add(row.id);
    }
  }
  assert.equal(ids.size,85);
});
