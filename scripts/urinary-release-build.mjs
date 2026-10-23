import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {renderApply} from '../materials-src/apply-kit/render.mjs';
import {unwrap} from '../materials-src/apply-kit/model.mjs';
import {compileApplyStudentScript} from '../materials-src/apply-kit/scripted-compile.mjs';
import {compileStudentScript} from '../materials-src/apply-kit/student-script.mjs';
import {ROOT,MATERIALS_DIR,upsertCatalogEntry,syncCatalog} from './materials.mjs';

export const approvedUrinarySlugs='kidney-anatomy nephron-circulation filtration-clearance tubular-handling urine-concentration urinary-route-micturition fluid-compartments water-sodium-regulation electrolyte-balance acid-base-homeostasis'.split(' ');
export function approvedUrinaryDocument(slug){
 if(!approvedUrinarySlugs.includes(slug))throw Error('Not an approved urinary release: '+slug);
 const baseDir=path.join(ROOT,'materials-src',slug);
 const source=JSON.parse(fs.readFileSync(path.join(baseDir,'apply.json'),'utf8')),c=unwrap(source);
 const acid=slug==='acid-base-homeostasis',data=acid?JSON.parse(fs.readFileSync(path.join(baseDir,'full.json'),'utf8')):source;
 const nodes=c.learning.nodes.map(n=>n.id),bank=[...c.learning.questions.foundation,...c.learning.questions.cases];
 const ids=[...nodes,...bank.map(q=>q.id)].sort();
 const script=acid?compileStudentScript(baseDir):compileApplyStudentScript(baseDir);
 const microIds=script.nodes.flatMap((n,i)=>n.micro?[acid?`n${i+1}-micro`:`${slug}-node-0${i+1}-micro`]:[]);
 // 診斷分母涵蓋所有實際 CourseLearning.answer ID；獨立題庫仍只取6＋5。
 const assessmentIds=[...(acid?data.pool.map(q=>q.id):bank.map(q=>q.id)),...microIds];
 const course=renderApply(data,{baseDir,view:'course'});
 const sha=createHash('sha256').update(course).digest('hex');
 const meta=`<meta name="material-ids" content="${ids.join(',')}"><meta name="material-assessment-ids" content="${assessmentIds.join(',')}"><meta name="material-render-sha256" content="${sha}">`;
 const sdk='<script src="https://albertchang1008-alt.github.io/115-1-AP2/materials/course-learning.js"></script>';
 const html=course.replace('</head>',meta+'</head>').replace('<body>','<body>'+sdk);
 return {html,ids,assessmentIds,nodes,c,sha,version:`${slug}-${c.version}`,label:JSON.parse(fs.readFileSync(path.join(baseDir,'content.json'))).label};
}
export async function buildApprovedUrinary(slug,{preview=false}={}){
 const d=approvedUrinaryDocument(slug),out=path.join(MATERIALS_DIR,d.version),file=path.join(out,'index.html');
 if(fs.existsSync(file)){
  const old=fs.readFileSync(file,'utf8').match(/<meta name="material-ids" content="([^"]*)"/);
  if(!old||old[1].split(',').sort().join(',')!==d.ids.join(','))throw Error(`${d.version}: ID 集合變動，請改版號`);
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(file,d.html);
 if(!preview){
  upsertCatalogEntry(d.version,{label:d.label,nodeTotal:d.nodes.length,questionTotal:d.assessmentIds.length,note:slug==='acid-base-homeostasis'?'診斷含5確認題（ID為n1-micro至n4-micro及n6-micro）＋10題配對池；每輪5組兩層考核；獨立題庫另採核可6＋5題':'診斷含節點確認題及先備6＋病例5；獨立題庫僅收兩階段11題；教師核可v3.2腳本'});
  await syncCatalog();
 }
 console.log(JSON.stringify({slug,path:path.relative(ROOT,file),renderer:'approved-student-script',nodeTotal:d.nodes.length,questionTotal:d.assessmentIds.length,sha256:d.sha,registered:!preview}));
}
