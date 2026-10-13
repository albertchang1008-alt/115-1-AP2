import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { transformSync } from 'esbuild';
import { sites, siteId, miMaterialSlugs } from '../shared/site';
import { ALL_MATERIAL_CATALOG, MATERIAL_CATALOG, MATERIALS_BASE_URL } from '../shared/materials';
import { interactions } from '../scripts/mi-interactions';
import { validateInteractions } from '../shared/classroom';
test('網站設定保留 AP2 全目錄，MI 兩筆目錄與網址依建置選擇', () => {
  const id = siteId();
  assert.equal(MATERIALS_BASE_URL, sites[id].materials);
  assert.deepEqual(Object.keys(MATERIAL_CATALOG).sort(), (id === 'mi' ? miMaterialSlugs : Object.keys(ALL_MATERIAL_CATALOG)).sort());
  for (const slug of miMaterialSlugs) assert(fs.existsSync(`public/materials/${slug}/index.html`));
  assert.throws(() => siteId('unknown'));
});
test('MI migration dry-run 12 題與 70354e0 常數逐字一致，拒絕 AP2 專案', () => {
  const old = fs.readFileSync('tests/fixtures/mi-70354e0/classroom.ts.txt', 'utf8');
  const code = transformSync(old, { loader:'ts', format:'cjs' }).code;
  const source = { exports: {} as any };
  new Function('module','exports', code)(source, source.exports);
  assert.equal(interactions.length, 12);
  assert.deepEqual(interactions, source.exports.interactions);
  assert.deepEqual(validateInteractions(interactions), interactions);
  assert.deepEqual(JSON.parse(fs.readFileSync('docs/unify-1.9.0/mi-interactions.json','utf8')).interactions, interactions);
  const run = spawnSync(process.execPath, ['scripts/migrate-mi-1.9.0.mjs','--project','mi-bd885','--dry-run'], { encoding:'utf8' });
  assert.equal(run.status, 0); assert.deepEqual(JSON.parse(run.stdout).writes[1].interactions, interactions);
  assert.notEqual(spawnSync(process.execPath, ['scripts/migrate-mi-1.9.0.mjs','--project','ap2-7ed91','--dry-run']).status,0);
});
test('課堂設定拒絕重複 ID、無效格式與過大題目，保留選項／排序', () => {
  assert.throws(() => validateInteractions([interactions[0], interactions[0]]));
  assert.throws(() => validateInteractions([{ ...interactions[0], fields: [{ ...interactions[0].fields[0], kind:'text' }] }]));
  assert.throws(() => validateInteractions(Array(101).fill(interactions[0])));
});

test('MI 舊簡報選項指示轉換與備註移為 migration 資料，與 70354e0 顯示完全相同', async () => {
  const { classroomDeckSlides } = await import('../shared/presentation');
  const source = fs.readFileSync('tests/fixtures/mi-70354e0/ClassroomInteraction.tsx.txt', 'utf8');
  const tail = 'const interactions = '+JSON.stringify(interactions)+';\n'+source.slice(source.indexOf('export function interactiveSlideHTML'));
  const module={exports:{} as any};new Function('module','exports',transformSync(tail,{loader:'ts',format:'cjs'}).code)(module,module.exports);
  const config = {...JSON.parse(fs.readFileSync('docs/unify-1.9.0/mi-slide-transforms.json','utf8')),interactions};
  for(const id of ['cover',...interactions.map(d=>d.slideId)]) {
    const html = (config.slideTransforms[id]?.replaceText || []).map((pair:string[])=>pair[0]).join('<p>')+'<table><tr><td>legacy</td></tr></table>';
    const [result] = classroomDeckSlides([{id,html,notes:'原有備註'}],config);
    assert.equal(result.html,module.exports.interactiveSlideHTML(html,id));
    assert.equal(result.notes,module.exports.interactiveSlideNotes('原有備註',id));
  }
});

test('MI migration apply 使用假 Firestore 寫入 JSON 定義與轉換，不展開 snapshot', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mi-apply-test-'));
  try {
    const output = path.join(temp, 'writes.json');
    const run = spawnSync(process.execPath, [
      '--require', path.resolve('tests/fixtures/fake-mi-firestore.cjs'),
      'scripts/migrate-mi-1.9.0.mjs', '--project', 'mi-bd885', '--apply', '--confirm-mi-only',
    ], { encoding: 'utf8', env: { ...process.env, FAKE_MI_WRITES: output } });
    assert.equal(run.status, 0, run.stderr);
    const writes = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.equal(writes.length, 2);
    assert.equal(writes[0].operation, 'update');
    const config = writes[1];
    assert.equal(config.path, 'courses/115-1-MI-國考精準對焦/classroomConfig/interactions');
    assert.equal(config.operation, 'set');
    assert.deepEqual(config.options, { merge: true });
    assert.deepEqual(config.data, {
      ...JSON.parse(fs.readFileSync('docs/unify-1.9.0/mi-interactions.json', 'utf8')),
      ...JSON.parse(fs.readFileSync('docs/unify-1.9.0/mi-slide-transforms.json', 'utf8')),
    });
    for (const key of ['exists', '_snapshotMarker', '_reference', 'data']) assert.equal(key in config.data, false);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('MI 70354e0 歷史測試資料 SHA-256 與 README 記錄一致', () => {
  const folder = 'tests/fixtures/mi-70354e0';
  const readme = fs.readFileSync(folder + '/README.md', 'utf8');
  for (const file of ['classroom.ts.txt', 'ClassroomInteraction.tsx.txt']) {
    const row = readme.split('\n').find(line => line.startsWith('| `' + file + '` |'));
    assert(row, file + ': README 必須記錄來源與雜湊');
    const expected = row.match(/`([a-f0-9]{64})`/);
    assert(expected, file + ': README 必須含 SHA-256');
    assert.equal(createHash('sha256').update(fs.readFileSync(folder + '/' + file)).digest('hex'), expected[1], file);
  }
});
