import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_MATERIAL_CATALOG as MATERIAL_CATALOG, MATERIAL_CATALOG as SITE_MATERIAL_CATALOG, MATERIALS_BASE_URL } from '../shared/materials';
import { siteId, miMaterialSlugs } from '../shared/site';
import { validateMaterialContent } from '../shared/materialKit';
import { physiologySlugs, readBuiltMaterial } from '../scripts/materials-html-content.mjs';

test('依站別核對已登錄教材的HTML、來源、節點／題目ID及目錄分母一致；MI不含AP2公開檔', () => {
  const root=process.cwd(), ids=new Set<string>();
  const kit=fs.readFileSync('materials-src/kit/kit.js','utf8').replace(/^export /gm,'');
  const readme=fs.readFileSync('public/materials/README.md','utf8');
  if (siteId() === 'mi') {
    assert.deepEqual(Object.keys(SITE_MATERIAL_CATALOG).sort(), [...miMaterialSlugs].sort());
    assert.deepEqual(fs.readdirSync('public/materials', { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort(), [...miMaterialSlugs].sort());
    for (const slug of physiologySlugs) assert.equal(fs.existsSync(path.join('public/materials', slug + '-v1', 'index.html')), false, slug + ': AP2 公開檔不得帶入 MI');
    for (const version of miMaterialSlugs) {
      const slug = version.replace(/-v1$/, '');
      const html = fs.readFileSync(path.join('public/materials', version, 'index.html'), 'utf8');
      const marker = '\nmount(', start = html.lastIndexOf(marker) + marker.length;
      assert(start >= marker.length, version + ': missing mount payload');
      let quoted = false, escaped = false, depth = 0, end = start;
      for (; end < html.length; end++) {
        const char = html[end];
        if (quoted) {
          if (escaped) escaped = false;
          else if (char === '\\') escaped = true;
          else if (char === '"') quoted = false;
        } else if (char === '"') quoted = true;
        else if (char === '{' || char === '[') depth++;
        else if ((char === '}' || char === ']') && --depth === 0) { end++; break; }
      }
      const content = JSON.parse(html.slice(start, end));
      validateMaterialContent(content);
      assert.deepEqual(content, JSON.parse(fs.readFileSync(path.join('materials-src', slug, 'content.json'), 'utf8')));
      assert.equal(content.title, html.match(/<title>(.*?)<\/title>/s)![1]);
      assert.equal(content.nodes.length, slug === 'micro-bacteria-review' ? 6 : 8);
      assert.equal(content.foundation.length, 6);
      assert.equal(content.cases.length, 5);
      const catalog = SITE_MATERIAL_CATALOG[version];
      assert(catalog);
      assert.equal(catalog.nodeTotal, content.nodes.length);
      assert.equal(catalog.questionTotal, 11);
      assert.equal(catalog.label, content.label);
      assert.equal(catalog.tracking, 'interactive');
      assert(html.includes(kit.slice(kit.indexOf('  // 兩關題目'))));
      assert(html.includes('<script src="' + MATERIALS_BASE_URL + 'course-learning.js"></script>'));
      assert(readme.includes(version));
      const rows = [...content.nodes, ...content.foundation, ...content.cases];
      assert.deepEqual(rows.map(row => row.id).sort(), html.match(/name="material-ids" content="([^"]+)"/)![1].split(',').sort());
      for (const row of rows) {
        assert(!ids.has(row.id), 'ID collision: ' + row.id);
        ids.add(row.id);
      }
    }
    assert.equal(ids.size, 36);
  } else {
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
  }
});
