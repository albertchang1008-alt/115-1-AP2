// Evidence stays in authoring data; student HTML receives only unwrapped values.
export function unwrap(value) {
 if(Array.isArray(value))return value.map(unwrap);
 if(value&&typeof value==='object'){
  if(Object.hasOwn(value,'text')&&Array.isArray(value.sources))return value.text;
  if(Object.hasOwn(value,'value')&&Array.isArray(value.sources))return value.value;
  return Object.fromEntries(Object.entries(value).filter(([k])=>!['sources','directionSources','fromSources','toSources','directionApproval'].includes(k)).map(([k,v])=>[k,unwrap(v)]));
 }
 return value;
}
export function validateApply(data){
 const errors=[]; const fail=(p,m)=>errors.push(`${p}: ${m}`);
 if(![1,2].includes(data?.schemaVersion))fail('schemaVersion','must be 1 or 2');
 const modern=data.schemaVersion===2;
 const c=unwrap(data);if(!/^[a-z0-9-]+$/.test(c?.slug||''))fail('slug','invalid');
 const lab=c?.lab;if(!lab||!Array.isArray(lab.states)||!lab.states.length)return [...errors,'lab.states: required'];
 const ids=new Set();for(const s of lab.states){if(!/^[a-z0-9-]+$/.test(s.id||'')||ids.has(s.id))fail('states','duplicate/missing id');ids.add(s.id)}
 if(!ids.has(lab.initialState))fail('lab.initialState','unknown state');
 if(!(lab.figure?.width>0&&lab.figure?.height>0&&lab.figure?.src))fail('lab.figure','dimensions and src required');
 const glossary=lab.glossary||{};for(const[k,v]of Object.entries(glossary))if(typeof v.name!=='string'||typeof v.text!=='string'||!v.text)fail(k,'glossary name/text required');
 if(typeof lab.referenceHeading!=='string'||!lab.referenceHeading)fail('referenceHeading','required');
 for(const s of lab.states){
  if(!s.name||!Array.isArray(s.changes)||!s.changes.length)fail(s.id,'name/changes required');
  if(!Array.isArray(s.intake))fail(s.id,'intake must be an array');
  for(const change of s.changes||[]){if(!modern&&!['same','up','down'].includes(change.direction))fail(s.id,'invalid direction');if(!modern&&(!change.terms?.length||change.terms.some(k=>!glossary[k])))fail(s.id,'unknown change term');if(!modern&&change.termLabels?.length!==change.terms?.length)fail(s.id,'termLabels length');}
  for(const label of s.labels||[]){if(!modern&&!['up','down'].includes(label.direction))fail(s.id,'label direction');if(!['left','right'].includes(label.side))fail(s.id,'label side');if(label.y<0||label.y>1)fail(s.id,'label y must be normalized');if(!label.circulating&&(!Array.isArray(label.anchor)||label.anchor.length!==2||label.anchor.some(x=>x<0||x>1)))fail(s.id,'anchor must be normalized');if(label.circulating&&label.anchor)fail(s.id,'circulating signal cannot target an organ');}
  for(const stage of s.flowStages||[])if(Array.isArray(stage))for(const n of stage){if(!glossary[n.term])fail(s.id,'unknown flow term');if(n.direction!=null&&!['up','down','same'].includes(n.direction))fail(s.id,'flow direction');}
  for(const edge of s.edges||[])if(!edge.from?.length||!edge.to?.length||[...edge.from,...edge.to].some(k=>!glossary[k]))fail(s.id,'edge endpoints must reference glossary terms');
  if(!s.flowStages?.length||!s.edges?.length)fail(s.id,'flowStages and sourced edges required');
 }
 if(modern&&Object.keys(lab.compactTerms||{}).length)fail('compactTerms','v2 binding ids cannot be remapped on mobile');
 if(modern)for(const s of lab.states){
  if(!['focus','change'].includes(s.mode))fail(s.id,'mode focus/change required');
  if(!['parallel','cause'].includes(s.relation))fail(s.id,'relation parallel/cause required');
  const itemIds=new Set();
  const item=(x,p)=>{if(!x.id||itemIds.has(p+':'+x.id))fail(p,'unique item id required');itemIds.add(p+':'+x.id);if(!['focus','change'].includes(x.kind))fail(p,'kind required');if(x.kind==='focus'&&(x.direction!=null||x.badge!=null))fail(p,'focus cannot have direction/badge');if(s.mode==='focus'&&x.kind!=='focus')fail(p,'focus state cannot contain change');if(x.kind==='change'&&!['up','down','same'].includes(x.direction))fail(p,'change direction required')};
  for(const c of s.changes||[]){item(c,s.id+'.changes');if(!c.bindings?.length)fail(c.id,'id bindings required');const bs=new Set();for(const b of c.bindings||[]){if(bs.has(b.id)||b.id!==b.term||!glossary[b.id]||b.label!==glossary[b.id]?.name)fail(c.id,'binding id/term/label mismatch');bs.add(b.id)}}
  for(const l of s.labels||[])item(l,s.id+'.labels');
  for(const a of s.flowStages||[])if(Array.isArray(a))for(const n of a){item(n,s.id+'.flow');if(n.id!==n.term||n.label!==glossary[n.id]?.name)fail(n.id,'flow binding id/term/name mismatch')}
  if(s.mode==='focus'&&s.indicators?.length)fail(s.id,'focus cannot contain directional indicators');
  for(const e of s.edges||[])if(!['parallel','cause'].includes(e.relation)||e.relation!==s.relation)fail(s.id,'edge relation must match flow relation');
  if(s.relation==='parallel'&&s.flowStages.some(x=>typeof x==='string'))fail(s.id,'parallel cannot contain causal connectors');
 }
 for(const [k,v]of Object.entries(lab.compactTerms||{}))if(!glossary[k]||!glossary[v])fail('compactTerms','unknown term');
 const learn=c.learning;if(!learn?.nodes?.length||!learn?.mindmap?.branches?.length||!learn?.questions?.foundation?.length||!learn?.questions?.cases?.length)fail('learning','nodes, questions, mindmap required');
 if(!learn?.mindmap?.branches?.some(b=>b.items?.some(i=>i.isBlank)))fail('mindmap','at least one blank is required');
 const nodeIds=new Set();for(const n of learn?.nodes||[]){if(nodeIds.has(n.id))fail(n.id,'duplicate node');nodeIds.add(n.id)}
 for(const kind of['foundation','cases'])for(const q of learn?.questions?.[kind]||[])if(!nodeIds.has(q.nodeId)||q.options?.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)fail(kind,'question node/options/answer invalid');
 for(const n of learn?.nodes||[]){const task=n.lookTask;if(!n.figure?.src)fail(n.id,'figure required');if(task?.type==='state'&&!ids.has(task.targetStateId))fail(n.id,'unknown task state');if(!task||!['structure','state','sequence'].includes(task.type))fail(n.id,'invalid lookTask');if(task?.type==='sequence'&&(!task.steps?.length||JSON.stringify([...task.correctOrder].sort((a,b)=>a-b))!==JSON.stringify(task.steps.map((_,i)=>i))))fail(n.id,'sequence correctOrder must be a permutation');}
 const owners=[...(learn?.nodes||[]),...(lab.states||[])];
 for(const owner of owners){const routes=owner.flowRoutes;if(routes==null)continue;const p=owner.id+'.flowRoutes';if(!Array.isArray(routes)){fail(p,'must be array');continue}const used=new Set();for(const r of routes){if(!/^[a-z0-9-]+$/.test(r.id||'')||used.has(r.id))fail(p,'unique route id required');used.add(r.id);if(!(r.width>0&&r.height>0)||!r.segments?.length)fail(p,'raster dimensions and segments required');for(const segment of r.segments||[]){if(!segment.from||!segment.to)fail(p,'from/to required');if(!Array.isArray(segment.points)||segment.points.length<2||segment.points.some(pt=>!Array.isArray(pt)||pt.length!==2||pt.some((v,i)=>!Number.isFinite(v)||v<0||v>(i?r.height:r.width))))fail(p,'points must be in raster coordinates');}}
 }
 return errors;
}
