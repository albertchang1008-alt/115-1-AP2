import fs from 'node:fs';
import assert from 'node:assert/strict';

export const physiologySlugs = ['blood-vessels', 'circulation-routes', 'blood-pressure-regulation', 'lymphatic-system', 'hemodynamics'];
// Read the actual built document, not a separate copy of the question bank.
export function readBuiltMaterial(root, slug) {
  const html = fs.readFileSync(`${root}/public/materials/${slug}-v1/index.html`, 'utf8');
  const start = html.lastIndexOf('\nmount(') + '\nmount('.length;
  assert(start > 6, `${slug}: missing mount payload`);
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
  assert.equal(content.title, html.match(/<title>(.*?)<\/title>/s)[1]);
  const ids = [...content.nodes, ...content.foundation, ...content.cases].map(x => x.id).sort();
  assert.equal(new Set(ids).size, 17);
  assert.deepEqual(ids, html.match(/name="material-ids" content="([^"]+)"/)[1].split(',').sort());
  return { html, content };
}
