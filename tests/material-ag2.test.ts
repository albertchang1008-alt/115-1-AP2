import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL_MATERIAL_CATALOG, MATERIAL_CATALOG, MATERIALS_BASE_URL, materialPageUrl } from '../shared/materials';
import { siteId } from '../shared/site';

const externalMaterials = [
  ['gi-wall-overview', '消化系統總覽與消化管壁', 24, 39],
  ['oral-cavity', '口腔、唾液腺與牙齒', 21, 36],
  ['swallowing-esophagus', '咽、吞嚥與食道', 20, 34],
  ['stomach', '胃：構造、胃液分泌與排空', 32, 37],
] as const;

test('D1–D4 ag2：教材目錄、分母、README 與獨立站網址一致', () => {
  const readme = fs.readFileSync('public/materials/README.md', 'utf8');
  for (const [slug, label, nodeTotal, questionTotal] of externalMaterials) {
    const version = `${slug}-ag2`;
    assert.deepEqual(ALL_MATERIAL_CATALOG[version], { label, tracking: 'interactive', nodeTotal, questionTotal });
    assert.equal(materialPageUrl(version), `https://albertchang1008-alt.github.io/ap2-materials/${slug}/index.html`);
    assert(readme.includes(`| \`${version}\` | ${label} | ${nodeTotal} 個學習節點；${questionTotal} 題 |`));
    assert.equal(Boolean(MATERIAL_CATALOG[version]), siteId() !== 'mi');
  }
});

test('其他教材及未知版本仍沿用原本站 materials 網址', () => {
  const externalVersions = new Set(externalMaterials.map(([slug]) => `${slug}-ag2`));
  for (const version of [...Object.keys(ALL_MATERIAL_CATALOG), 'unknown-ag2', 'stomach-ag1', 'stomach-ag3', 'toString', '__proto__']) {
    if (!externalVersions.has(version)) assert.equal(materialPageUrl(version), `${MATERIALS_BASE_URL}${version}/index.html`, version);
  }
});
