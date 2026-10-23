import fs from 'node:fs';import path from 'node:path';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=b=>createHash('sha256').update(b).digest('hex');
// Frozen certificate of scripts/derive-teacher-images.py (Pillow 12.3.0 / libwebp 1.6.0).
const CERTIFICATE='b391b9c0d6113e53a095a771a22850db06f41ce2b788837899134db6d5febceb';
export function verifyDerivedImages(root=ROOT){
 const raw=fs.readFileSync(path.join(root,'materials-src/figures/derived/manifest.json'));
 if(sha(raw)!==CERTIFICATE)throw Error('Derivative certificate mismatch');
 const m=JSON.parse(raw),approved=JSON.parse(fs.readFileSync(path.join(root,'materials-src/apply-kit/teacher-figures.json'))).entries.filter(e=>e.kind==='anatomy');
 if(JSON.stringify(m.recipe)!==JSON.stringify({maxLongEdge:1600,format:'WEBP',quality:80,method:6,lossless:false,exact:true,resample:'LANCZOS',upscale:false}))throw Error('Derivative recipe mismatch');
 if(m.images.length!==new Set(approved.map(e=>e.sha256)).size)throw Error('Derivative coverage mismatch');
 for(const e of approved){const d=m.images.find(d=>d.sourceSha256===e.sha256);if(!d||d.source!==e.src)throw Error('Unapproved derivative source: '+e.key);}
 for(const d of m.images){const src=fs.readFileSync(path.join(root,d.source)),webp=fs.readFileSync(path.join(root,d.path));
 if(sha(src)!==d.sourceSha256||sha(webp)!==d.sha256)throw Error('Derivative/source SHA mismatch: '+d.path);
 if(src.toString('hex',0,8)!=='89504e470d0a1a0a'||src.readUInt32BE(16)!==d.sourceSize[0]||src.readUInt32BE(20)!==d.sourceSize[1])throw Error('Source dimensions mismatch');
 if(webp.toString('ascii',0,4)!=='RIFF'||webp.toString('ascii',8,12)!=='WEBP'||webp.length!==d.bytes)throw Error('Invalid derived WebP');
 if(Math.max(...d.size)>1600||d.size.some((n,i)=>n>d.sourceSize[i])||Math.abs(d.size[0]/d.size[1]-d.sourceSize[0]/d.sourceSize[1])>.002)throw Error('Derivative geometry mismatch');
 }
 return m;
}
export function derivedImage(entry,root=ROOT){const m=verifyDerivedImages(root),d=m.images.find(d=>d.sourceSha256===entry.sha256);if(!d)throw Error('Unapproved derivative');return'data:image/webp;base64,'+fs.readFileSync(path.join(root,d.path)).toString('base64');}
