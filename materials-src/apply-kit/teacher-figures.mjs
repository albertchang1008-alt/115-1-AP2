import {derivedImage} from './derived-images.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const kit = path.dirname(fileURLToPath(import.meta.url));
const DATA_FIGURES = new Set(['blood-tube','clearance','equation','glucose-slider','concentration','compartments-beaker','ecf-breakdown','icf-ecf-ions','fluid-summary','electrolyte-dissociation','meq-valency','ratio-board','reaction-svg']);
export function validateTeacherFigurePolicies(entries) {
  const keys=new Set();
  for(const entry of entries) {
    if(keys.has(entry.key))throw Error('Duplicate figure policy '+entry.key);
    keys.add(entry.key);
    if(!['anatomy','data','missing'].includes(entry.kind))throw Error('Unknown figure policy '+entry.key);
    if(entry.kind==='data' && !DATA_FIGURES.has(entry.current))throw Error('Anatomy is not in data whitelist: '+entry.key);
    if(entry.kind==='missing') {
      const allowed=entry.missingId==='G01' && entry.key==='fluid-compartments:N01'
        || entry.missingId==='G02' && entry.slug==='urine-concentration' && [1,2,3,5,6].includes(entry.node)
        || entry.missingId==='G03' && entry.key==='filtration-clearance:N02';
      if(!allowed || !entry.reason)throw Error('Unlisted missing-figure exception: '+entry.key);
    }
  }
}
export function loadTeacherFigures(baseDir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(kit, 'teacher-figures.json')));
  validateTeacherFigurePolicies(manifest.entries);
  const root = path.resolve(baseDir, '../..');
  const entries=manifest.entries.filter(e=>e.slug===path.basename(baseDir));
  if(entries.length!==6) throw Error('Six explicit teacher figure policies required: '+path.basename(baseDir));
  return entries.map(e=> {
    if (e.kind!=='anatomy') return e;
    const raw=fs.readFileSync(path.join(root,e.src));
    if(createHash('sha256').update(raw).digest('hex')!==e.sha256) throw Error('Teacher image SHA mismatch: '+e.key);
    return {...e, image:derivedImage(e,root)};
  });
}
