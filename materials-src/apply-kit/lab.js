function mountApplyLab(config){

const STATES=Object.fromEntries(config.states.map(s=>[s.id,{name:s.name,banner:s.banner,changes:s.changes.map((c,i)=>({...c,id:c.id||`${s.id}-item-${i}`,bindings:c.bindings||c.terms.map((term,j)=>({id:term,term,label:c.termLabels[j]}))}))}]));
let current=config.initialState;const svg=document.querySelector('svg'),NS='http://www.w3.org/2000/svg';
function el(tag,attrs={},text=''){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e}
// Both trend shapes exist; a down trend is activated only when an approved state supplies it.
function indicator(x,y,direction){const outer=el('g',{class:'organ-indicator indicator-'+direction,transform:`translate(${x},${y})`});const inner=el('g',{class:direction==='down'?'motion-down':'motion-up'});inner.append(el('circle',{class:'organ-glow',cx:0,cy:0,r:17}));inner.append(el('path',{class:'organ-arrow-shape',d:direction==='down'?'M -9 -5 L -4 -5 L -4 -14 L 4 -14 L 4 -5 L 9 -5 L 0 9 Z':'M -9 5 L -4 5 L -4 14 L 4 14 L 4 5 L 9 5 L 0 -9 Z'}));outer.append(inner);return outer}
const LABELS=Object.fromEntries(config.states.map(s=>[s.id,s.labels]));
function draw(){const W=svg.clientWidth,H=svg.clientHeight;if(!W||!H)return;svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('class','st-'+current);
 // The same complete raster is contained in every state; no cropping or state-dependent transform.
 svg.append(el('image',{href:config.figure.src,x:0,y:0,width:W,height:H,preserveAspectRatio:'xMidYMid meet','data-full-body':'true'}));
 const k=Math.min(W/config.figure.width,H/config.figure.height),iw=config.figure.width*k,ih=config.figure.height*k,ox=(W-iw)/2,oy=(H-ih)/2;
 const compact=matchMedia('(max-width:767px), (max-height:500px)').matches,layer=document.querySelector('.label-layer');layer.replaceChildren();
 for(const d of LABELS[current]){
  const tag=document.createElement('div');tag.className='plot-label '+(d.kind==='focus'?'focus':d.direction);tag.dataset.tag=d.id;tag.style[d.side]='2%';tag.style.top=`${(oy+ih*d.y)/H*100}%`;
  tag.innerHTML=`<span class="label-name">${compact?d.short:d.full}</span>${d.kind==='focus'?'':`<span class="solid-badge badge-solid-${d.direction}">${d.direction==='up'?'↑ 上升':d.direction==='same'?'＝不變':'↓ 下降'}</span>`}`;layer.append(tag);
  if(d.circulating){tag.dataset.circulating='true';continue;}
  const r=tag.getBoundingClientRect(),lr=layer.getBoundingClientRect(),ax=ox+d.anchor[0]*iw,ay=oy+d.anchor[1]*ih;
  const tx=d.side==='left'?r.right-lr.left:r.left-lr.left,ty=r.top-lr.top+r.height/2;
  svg.append(el('polyline',{'data-leader-for':d.id,points:`${tx},${ty} ${ax},${ay}`,fill:'none',stroke:d.kind==='focus'?'#247a85':d.direction==='up'?'#bd2648':'#12609b','stroke-width':1.5}));svg.append(el('circle',{'data-anchor-for':d.id,cx:ax,cy:ay,r:3,fill:d.kind==='focus'?'#247a85':d.direction==='up'?'#bd2648':'#12609b'}));
 }
 const flowRoutes=config.states.find(s=>s.id===current).flowRoutes;if(flowRoutes?.length)mountApplyFlows(svg,flowRoutes,{labTransform:`translate(${ox},${oy}) scale(${k})`});
 const organStates=config.states.find(s=>s.id===current).indicators;
 for(const o of organStates)svg.append(indicator(ox+o.a[0]*iw,oy+o.a[1]*ih,o.dir));
}
const GLOSSARY=config.glossary;
const INTAKE=Object.fromEntries(config.states.map(s=>[s.id,s.intake.map(x=>[x.name,x.amount,x.status,x.unit])]));
const FLOWS=Object.fromEntries(config.states.map(s=>[s.id,s.flowStages.map(stage=>typeof stage==='string'?stage:stage.map(n=>[n.term,n.label,n.compactLabel,n.kind==='focus'?null:n.direction]))]));
function drawFlow(s){document.querySelector('#causal-flow').dataset.relation=config.states.find(x=>x.id===s).relation||'cause';document.querySelector('#causal-flow').innerHTML=FLOWS[s].map(stage=>typeof stage==='string'?`<span class="causal-link" ${stage==='＝'?'data-equal':''} aria-hidden="true"><span class="flow-link-glyph">${stage}</span></span>`:`<div class="causal-stage">${stage.map(([key,label,short,dir],i)=>`<button type="button" class="causal-node ${short?'':'desktop-node'}" data-causal-term="${key}" data-compact-term="${config.compactTerms[key]||key}" aria-label="${GLOSSARY[config.compactTerms[key]||key].name}${dir==='up'?'上升':dir==='down'?'下降':''}" aria-pressed="false"><span class="flow-full">${label}</span><span class="flow-short">${short}</span>${dir?`<span class="solid-badge flow-badge badge-solid-${dir}">${dir==='up'?'↑':dir==='same'?'＝':'↓'}</span>`:''}</button>`).join('')}</div>`).join('');}
// Fit real CSS text to the available flow area; no transforms shrink the text.
const flowMeasure=document.createElement('canvas').getContext('2d');
function fitFlow(){
 const flow=document.querySelector('#causal-flow');if(!flow||!flow.children.length)return;
 const compact=matchMedia('(max-width:767px) and (orientation:portrait), (max-height:500px) and (orientation:landscape)').matches;
 const stages=[...flow.querySelectorAll('.causal-stage')],links=[...flow.querySelectorAll('.causal-link')],W=flow.clientWidth,H=flow.clientHeight;
 const family=getComputedStyle(flow).fontFamily;
 const nodesFor=stage=>[...stage.querySelectorAll('.causal-node')].filter(b=>getComputedStyle(b).display!=='none');
 const natural=(node,f)=>{flowMeasure.font=`600 ${f}px ${family}`;const name=node.querySelector(compact?'.flow-short':'.flow-full').textContent;return flowMeasure.measureText(name).width+(node.querySelector('.flow-badge')?flowMeasure.measureText('↑').width+6+2:0)+2;};
 flow.dataset.layout=compact?'compact':'spread';
 if(compact){
  flow.style.removeProperty('grid-template-rows');
  const nodes=stages.flatMap(nodesFor);let font=20;
  while(font>14&&nodes.reduce((sum,n)=>sum+natural(n,font),0)+links.length*8>W)font--;
  const nodeH=Math.max(22,H*.9);
  stages.forEach(stage=>{const ns=nodesFor(stage);stage.style.width='auto';stage.style.height=`${nodeH}px`;ns.forEach(n=>{n.style.fontSize=`${font}px`;n.style.lineHeight='1.25';n.style.padding='0';n.style.height='100%';n.style.minWidth='0';n.style.flex='0 0 auto';n.querySelectorAll('.flow-badge').forEach(b=>{b.style.fontSize=`${font}px`})})});
 }else{
  const nodeH=Math.max(22,(H-(stages.length-1)*8)/stages.length*.7);
  flow.style.gridTemplateRows=[...flow.children].map(e=>e.classList.contains('causal-stage')?`${nodeH}px`:'minmax(8px,1fr)').join(' ');
  stages.forEach(stage=>{stage.style.width='100%';stage.style.height='100%';const ns=nodesFor(stage),slot=(W-(ns.length-1)*6)/ns.length;let font=Math.min(20,Math.max(14,Math.floor((nodeH-4)/1.25)));
   while(font>14&&Math.max(...ns.map(n=>natural(n,font)))+8>slot)font--;
   ns.forEach(n=>{n.style.fontSize=`${font}px`;n.style.lineHeight='1.25';n.style.height='100%';n.style.padding='0 4px';n.style.flex='1 1 0';n.style.minWidth='0';n.querySelectorAll('.flow-badge').forEach(b=>{b.style.fontSize=`${font}px`})});
  });
 }
 flow.dataset.fittedWidth=String(W);flow.dataset.fittedHeight=String(H);
}
new ResizeObserver(()=>requestAnimationFrame(fitFlow)).observe(document.querySelector('.causal-box'));
const ITEM_MAP=Object.fromEntries(Object.entries(STATES).flatMap(([state,s])=>s.changes.map(c=>[`${state}:${c.id}`,c])));
function selectTerm(key){document.querySelector('#term-description').textContent=GLOSSARY[key].text;document.querySelectorAll('.term-select').forEach(b=>{const selected=b.dataset.term===key;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',selected)});document.querySelectorAll('.factor-card').forEach(c=>c.classList.toggle('selected',!!c.querySelector('.term-select.active')));document.querySelector('.term-box').dataset.selected=key;document.querySelectorAll('.causal-node').forEach(b=>{const match=b.dataset.causalTerm===key||b.dataset.compactTerm===key;b.classList.toggle('active',match);b.setAttribute('aria-pressed',match)});}
function switchState(s){current=s;const d=STATES[s];document.querySelectorAll('.btn-tab').forEach(b=>{b.classList.toggle('active',b.dataset.state===s);b.setAttribute('aria-pressed',b.dataset.state===s)});document.querySelector('#p2p-banner').textContent=d.banner;document.querySelector('#p2p-changes-list').innerHTML=d.changes.map(c=>{const focus=c.kind==='focus',type=c.direction;return `<div role="group" data-item-id="${s}:${c.id}" data-default-term="${c.bindings[0].term}" class="factor-card ${type==='same'||focus?'':type+'-card'}">${focus?'':`<span class="shape-marker ${type==='same'?'':'marker-'+type}">${type==='up'?'↑':type==='down'?'↓':'＝'}</span>`}<div class="factor-info"><div class="factor-name">${c.bindings.map(b=>`<button type="button" class="term-select" data-binding-id="${b.id}" data-term="${b.term}" aria-pressed="false">${b.label}</button>`).join('<span aria-hidden="true">／</span>')}</div><div class="factor-desc">${c.detail}</div></div>${focus?'':`<span class="solid-badge ${type==='same'?'':'badge-solid-'+type}">${c.badge||({up:'↑ 上升',down:'↓ 下降',same:'＝不變'})[type]}</span>`}</div>`}).join('');document.querySelector('#p2p-unchanged-tags').innerHTML=INTAKE[s].map(([name,value,status,unit])=>`<div class="intake-row"><span>${name} ${value} ${unit}</span><span>${status}</span></div>`).join('');document.querySelector('.teacher-note').classList.toggle('show',config.states.find(state=>state.id===s).teacherNote===true);drawFlow(s);fitFlow();selectTerm(d.changes[0].bindings[0].term);draw()}
if(new URLSearchParams(location.search).get('teacher')==='1')document.body.classList.add('teacher-preview');
document.querySelectorAll('.btn-tab').forEach(b=>b.addEventListener('click',()=>switchState(b.dataset.state)));document.querySelector('#p2p-changes-list').addEventListener('click',e=>{const target=e.target.closest('.term-select');const row=e.target.closest('.factor-card');if(target)selectTerm(target.dataset.term);else if(row)selectTerm(ITEM_MAP[row.dataset.itemId].bindings[0].term)});document.querySelector('#causal-flow').addEventListener('click',e=>{const b=e.target.closest('.causal-node');if(b)selectTerm(matchMedia('(max-width:767px) and (orientation:portrait), (max-height:500px) and (orientation:landscape)').matches?b.dataset.compactTerm:b.dataset.causalTerm)});new ResizeObserver(draw).observe(document.querySelector('.figure-pane'));switchState(current);

}
