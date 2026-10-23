import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {renderApply} from '../materials-src/apply-kit/render.mjs';import {checkPreAnswerContent} from '../scripts/lib/pre-answer-audit.mjs';
test('content-check rejects a deliberately leaked correct sequence despite approved source words',async()=>{
 const baseDir=path.resolve('materials-src/filtration-clearance'),data=JSON.parse(fs.readFileSync(baseDir+'/apply.json'));
 let html=renderApply(data,{baseDir,view:'course'});
 const attack=`const originalFigure=renderScriptedFigure;renderScriptedFigure=args=>originalFigure(args)+(args.node.teacherFigure.key==='filtration-clearance:N02'&&args.state.phase==='action'&&!args.state.success?'<p>'+args.txt('n2.action.0.text')+'</p>':'');\n`;
 html=html.replace('mountApplyScripted({',attack+'mountApplyScripted({');
 const out=path.resolve('docs/urinary-release/release-today/A/bad-fixture');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/leaked-sequence.html',html);
 const r=await checkPreAnswerContent(data,{baseDir,html,out});assert.equal(r.pass,false);assert.ok(r.errors.some(e=>e.kind==='answer-before-response'&&e.node===2));
});
