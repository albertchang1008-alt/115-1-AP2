import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const root=process.cwd(),base='materials-src/apply-examples/water-sodium-regulation',original=JSON.parse(fs.readFileSync(base+'/apply.json')),out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});const rows=[];
for(const mode of['missing','reverse','neutral','bogus-quote','outside','negated']){
 const d=structuredClone(original),s=d.learning.nodes[3].flowRoutes[0].segments[0];
 if(mode==='missing')s.sources=[];
 if(mode==='reverse')[s.from,s.to]=[s.to,s.from];
 if(mode==='neutral')s.sources=[{uid:'renin-angiotensin-aldosterone',quote:'腎素本身不直接收縮血管'}];
 if(mode==='bogus-quote')s.sources[0].quote='這是故意不存在的方向原句';
 if(mode==='negated'){const r={uid:'renin-angiotensin-aldosterone',quote:'腎素本身不直接收縮血管'};s.sources=[r];s.from={text:'腎素',sources:[r]};s.to={text:'血管',sources:[r]};}
 if(mode==='outside')s.points[0]=[-1,0];
 const file=path.join(base,'.flow-negative.json');try{fs.writeFileSync(file,JSON.stringify(d));const result=spawnSync(process.execPath,['scripts/apply-content-check.mjs',file,'--cards',process.argv[3],'--progress',process.argv[4],'--out',path.join(out,mode+'.json')],{cwd:root,encoding:'utf8'});assert.equal(result.status,1,result.stdout+result.stderr);const r=JSON.parse(fs.readFileSync(path.join(out,mode+'.json')));assert(!r.pass);assert(r.errors.some(e=>/flow evidence|flowRoutes|quote not found/.test(e)));rows.push({mode,exitCode:result.status,errors:r.errors,skipped:0});}finally{fs.rmSync(file,{force:true})}
}
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({pass:true,expectedFailures:rows,skipped:0},null,2));console.log('PASS: 6/6 malformed flow data rejected with exit 1');
