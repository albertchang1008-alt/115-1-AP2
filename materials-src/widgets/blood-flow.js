// Local diagram state; cards/predictions/SDK continue to use immutable content.json.
window.BloodFlow=(()=>{
 const NS='http://www.w3.org/2000/svg';
 const COMMUNICATING=new Set(['c-acom','c-pcom-r','c-pcom-l']);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function html(lab,figures){return `<div class="blood-flow"><div class="flow-tabs" role="group" aria-label="循環模式">${lab.modes.map(m=>`<button type="button" data-flow-mode="${m.id}">${esc(m.label)}</button>`).join('')}</div><div class="flow-birth" hidden role="group" aria-label="出生前後"><button data-birth="before">出生前</button><button data-birth="after">出生後</button></div><div class="flow-legend" aria-label="含氧圖例"><span><i class="deoxy"></i>缺氧血</span><span><i class="oxy"></i>充氧血</span><span data-legend-mixed><i class="mixed"></i>混合血</span><span data-legend-closed><i class="closed"></i>已閉鎖</span><span data-legend-view></span></div><div class="flow-layout"><div class="flow-map">${figures[lab.figure]}</div><section class="flow-card" aria-live="polite"><p class="flow-count"></p><h3></h3><p class="flow-small"></p><p class="flow-oxygen"></p><p class="flow-source"></p></section></div><div class="flow-controls"><button data-flow-prev>上一步</button><button data-flow-next>下一步</button><button data-flow-play aria-pressed="false">播放</button><label>速度 <select data-flow-speed aria-label="播放速度"><option value="1.6">慢</option><option value="1" selected>標準</option><option value="0.6">快</option></select></label><button data-flow-reset>重新開始</button></div><div class="flow-dots" role="group" aria-label="直接選擇步驟"></div><div class="flow-status" aria-live="polite"></div><p class="flow-note"></p><p class="flow-watched" aria-live="polite"></p></div>`;}
 function mount(root,lab){
  const box=root.querySelector('.blood-flow'),svg=box.querySelector('svg'),dots=box.querySelector('.flow-dots'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const predict=root.closest('.lab').querySelector('.flow-prediction');predict.hidden=true;
  const watched=new Set(),visited=new Map(lab.modes.map(m=>[m.id,new Set()]));
  const STRUCT={fo:['f-fo-flow'],da:['f-da'],dv:['f-dv'],uv:['f-uv-body'],ua:['f-ua-r','f-ua-l'],urachus:['f-urachus']};
  const ADULT={'f-ivc':'deoxy','f-svc':'deoxy','f-pv-r':'oxy','f-pv-l':'oxy','f-pa-r':'deoxy','f-pa-l':'deoxy','f-body-head-r':'oxy','f-body-head-l':'oxy','f-body-lower-r':'oxy','f-body-lower-l':'oxy','f-rv-flow-focus':'deoxy'};
  let mode='pulmonary',birth='before',index=0,playing=false,frame=0,animation=null;
  const rows=()=>mode==='fetal'&&birth==='after'?lab.postnatal:lab.modes.find(m=>m.id===mode).steps;
  const speed=()=>Number(box.querySelector('[data-flow-speed]').value);
  const currentView=()=>svg.querySelector(`g[data-flow-mode="${mode}"] [data-view="${{pulmonary:'pulm',systemic:'sys',fetal:'fetal',cerebral:index===6?'cvein':'cart'}[mode]}"]`);
  const meta=()=>JSON.parse(currentView().dataset.stepMeta)[birth==='after'?'post':'steps'][index];
  function el(tag,attrs,host){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));host.append(e);return e;}
  function arrowShape(w){const z=w>=9?1.3:w>=7?1.05:.85;return `M${-4*z},${-3.4*z} L${4*z},0 L${-4*z},${3.4*z} L${-2*z},0 Z`;}
  function place(marker,path,d){const length=path.getTotalLength(),p=path.getPointAtLength(d),a=path.getPointAtLength(Math.max(0,d-.1)),b=path.getPointAtLength(Math.min(length,d+.1)),angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;marker.setAttribute('transform',`translate(${p.x},${p.y}) rotate(${angle})`);marker.dataset.distance=String(d);}
  function labelMask(view){
   svg.querySelectorAll('.flow-arrow-mask').forEach(n=>n.remove());
   const id='blood-flow-arrow-label-mask',mask=el('mask',{id,class:'flow-arrow-mask',maskUnits:'userSpaceOnUse',x:0,y:0,width:600,height:650},svg);
   el('rect',{x:0,y:0,width:600,height:650,fill:'white'},mask);
   for(const text of view.querySelectorAll('text')){
    if((text.classList.contains('callout')||text.classList.contains('only-on'))&&!text.classList.contains('on'))continue;
    const b=text.getBBox();el('rect',{x:b.x-2,y:b.y-2,width:b.width+4,height:b.height+4,fill:'black','data-label':text.id||text.textContent},mask);
   }
   return `url(#${id})`;
  }
  function stationary(base,host,kind,opacity){
   if(COMMUNICATING.has(base.id))return;
   const length=base.getTotalLength(),n=length>140?2:1,w=Number(base.getAttribute('stroke-width'));
   for(let j=1;j<=n;j++){const arrow=el('path',{d:arrowShape(w),fill:'var(--particle)',opacity,class:kind,'data-base':base.id},host);if(base.style.visibility==='hidden')arrow.style.visibility='hidden';place(arrow,base,length*j/(n+1));}
  }
  function trails(view,step){
   const all=JSON.parse(view.dataset.stepMeta).steps;
   for(let j=0;j<index;j++)for(const id of rows()[j].paths){
    const base=view.querySelector('#'+id);if(!base||step.paths.includes(id))continue;
    const previous=all[j],shift=previous.shift0?.[id]||previous.shift;
    base.setAttribute('stroke',`var(--${shift?.[1]||base.dataset.k})`);base.style.opacity='.7';base.classList.add('is-trail');
    if(step.paths.some(pid=>view.querySelector('#'+pid)?.getAttribute('d')===base.getAttribute('d')))base.style.visibility='hidden';
   }
  }
  function stop(){playing=false;cancelAnimationFrame(frame);frame=0;box.querySelector('[data-flow-play]').textContent='播放';box.querySelector('[data-flow-play]').setAttribute('aria-pressed','false');}
  function clear(){cancelAnimationFrame(frame);svg.querySelectorAll('.flow-fill-layer,.flow-arrow-mask').forEach(n=>n.remove());animation=null;delete svg.dataset.travelComplete;delete svg.dataset.travelStart;}
  function postnatal(view,s){
   const order=lab.postnatal.map(x=>x.structure),k=order.indexOf(rows()[index].structure);
   for(const [id,col] of Object.entries(ADULT))view.querySelector('#'+id)?.setAttribute('stroke',`var(--${col}${k===5?'':'-soft'})`);
   for(const id of ['f-da','f-dv','f-urachus'])view.querySelector('#'+id).setAttribute('stroke','var(--mixed-soft)');
   view.querySelector('#f-uv-body').setAttribute('stroke','var(--oxy-soft)');
   for(const id of ['f-ua-r','f-ua-l'])view.querySelector('#'+id).setAttribute('stroke','var(--deoxy-soft)');
   view.querySelector('#f-urachus').style.opacity=k>=5?'1':'0';
   view.querySelector('#fo-mark').style.opacity='0';
   order.forEach((st,j)=>{if(j>k||st==='fo')return;for(const id of STRUCT[st]){const p=view.querySelector('#'+id);p.setAttribute('stroke',`var(--${j===k?'closed':'closed-soft'})`);p.classList.add('is-closed');if(j===k)p.classList.add('is-current');}});
   let fo=view.querySelector('#fo-closed');if(!fo)fo=el('path',{id:'fo-closed',d:'M216,148 L216,168','stroke-width':5,'stroke-linecap':'round'},view.querySelector('.valves'));
   fo.style.opacity='1';fo.setAttribute('stroke',`var(--${k===0?'closed':'closed-soft'})`);fo.classList.toggle('is-current',k===0);
  }
  function flowRun(reset=true){
   cancelAnimationFrame(frame);
   const view=currentView(),s=meta();
   if(reset||!animation){
    svg.querySelectorAll('.flow-fill-layer').forEach(n=>n.remove());
    const layers=Object.fromEntries(['back','front'].map(name=>[name,el('g',{class:'flow-fill-layer','data-layer':name},view.querySelector('.'+name))]));
    const paths=rows()[index].paths.map(id=>{
     const base=view.querySelector('#'+id),shift=s.shift0?.[id]||s.shift,k=base.dataset.k;
     const p=el('path',{d:base.getAttribute('d'),class:'live flow-fill','data-base':id,'stroke-width':base.getAttribute('stroke-width'),stroke:`var(--${shift?.[0]||k})`,opacity:s.fade?.includes(id)?'.55':'1'},layers[base.dataset.layer]);
     const w=Number(p.getAttribute('stroke-width')),count=s.n?.[id]||(w>=9?5:w>=7?4:3),length=p.getTotalLength();
     p.style.strokeDasharray=length;p.style.strokeDashoffset=motion.matches?'0':length;
     return {path:p,base,length,count,w,shift,k,layer:layers[base.dataset.layer]};
    });
    const mask=labelMask(view);view.querySelectorAll('.base.is-trail').forEach(p=>p.setAttribute('mask',mask));const arrowLayers=Object.fromEntries(['back','front'].map(name=>[name,el('g',{class:'flow-arrow-layer',mask},layers[name])]));
    paths.forEach(o=>o.arrowLayer=arrowLayers[o.base.dataset.layer]);
    animation={paths,particles:[],elapsed:0,clock:null,complete:false};
    view.querySelectorAll('.base.is-trail').forEach(base=>stationary(base,arrowLayers[base.dataset.layer],'trail-arrow','.9'));
    delete svg.dataset.travelComplete;delete svg.dataset.travelStart;
   }
   const state=animation,T=1000*speed(),period=1400*speed();
   if(motion.matches){state.paths.forEach(o=>{o.path.style.strokeDashoffset='0';o.path.setAttribute('stroke',`var(--${o.shift?.[1]||o.k})`);});state.paths.forEach(o=>stationary(o.base,o.arrowLayer,'current-static-arrow',s.fade?.includes(o.base.id)?'.55':'.9'));svg.dataset.fillProgress='1';return;}
   state.clock=null;
   const rgb=name=>{const hex=getComputedStyle(box).getPropertyValue('--'+name).trim().slice(1);return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));};
   function tick(now){
    if(document.hidden||motion.matches)return;
    if(state.clock===null){state.clock=now;svg.dataset.travelStart=String(now-state.elapsed);}else{state.elapsed+=now-state.clock;state.clock=now;}
    const q=Math.min(1,state.elapsed/T),ease=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;svg.dataset.fillProgress=String(q);
    state.paths.forEach(o=>{o.path.style.strokeDashoffset=o.length*(1-ease);if(o.shift){const a=rgb(o.shift[0]),b=rgb(o.shift[1]),mix=Math.min(1,state.elapsed/(900*speed()));o.path.setAttribute('stroke',`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*mix)).join(',')})`);}});
    if(q===1){
     if(!state.complete){state.complete=true;svg.dataset.travelComplete=String(now);state.paths.forEach(o=>{for(let j=0;j<o.count;j++){const communicating=COMMUNICATING.has(o.base.id),c=el(communicating?'circle':'path',communicating?{r:o.w>=9?2.6:o.w>=7?2:1.6,fill:'var(--particle)',opacity:'.95',class:'flow-particle flow-oscillator','data-base':o.base.id}:{d:arrowShape(o.w),fill:'var(--particle)',opacity:s.fade?.includes(o.base.id)?'.55':'.95',class:'flow-particle moving-arrow','data-base':o.base.id},o.arrowLayer);state.particles.push({circle:c,path:o.path,length:o.length,offset:j/o.count});}});}
     state.particles.forEach(o=>{const phase=((state.elapsed-T)/period+o.offset)%1;if(COMMUNICATING.has(o.circle.dataset.base)){const t=phase<.5?phase*2:2-phase*2,p=o.path.getPointAtLength(t*o.length);o.circle.setAttribute('cx',p.x);o.circle.setAttribute('cy',p.y);o.circle.dataset.distance=String(t*o.length);}else place(o.circle,o.path,phase*o.length);});
    }
    if(playing&&state.elapsed>=T+700*speed()){if(index<rows().length-1){index++;render();return;}playing=false;box.querySelector('[data-flow-play]').textContent='播放';box.querySelector('[data-flow-play]').setAttribute('aria-pressed','false');}
    frame=requestAnimationFrame(tick);
   }
   frame=requestAnimationFrame(tick);
  }
  function render(){
   clear();box.dataset.mode=mode;svg.dataset.birth=birth;
   svg.querySelectorAll('g[data-flow-mode]').forEach(g=>g.style.display=g.dataset.flowMode===mode?'':'none');
   const view=currentView(),s=meta(),step=rows()[index],closing=mode==='fetal'&&birth==='after';
   svg.querySelectorAll('[data-view]').forEach(v=>v.style.display=v===view?'':'none');
   svg.setAttribute('viewBox',view.dataset.viewbox);svg.setAttribute('aria-label',lab.modes.find(m=>m.id===mode).label+'・'+(closing?'出生後':view.dataset.view==='cvein'?'靜脈回流前視':'血流路徑示意'));box.dataset.cerebralView=index===6?'venous':'arterial';svg.dataset.adult=String(closing&&index===5);
   view.classList.toggle('after',closing);
   view.querySelectorAll('.callout').forEach(t=>t.classList.toggle('on',s.l?.includes(t.id)));
   view.querySelectorAll('.chamber').forEach(t=>t.classList.toggle('on',!!s.ch?.includes(t.id)));
   view.querySelectorAll('.valve').forEach(t=>t.classList.toggle('on',!!s.v?.includes(t.id)));
   view.querySelectorAll('circle.alv').forEach(c=>c.setAttribute('fill',`var(--${s.alv?'oxy':s.after?'oxy-soft':'deoxy-soft'})`));
   view.querySelectorAll('.base').forEach(p=>{p.setAttribute('stroke',`var(--${p.dataset.k}-soft)`);p.setAttribute('stroke-dasharray','');p.classList.remove('is-current','is-closed','is-trail');p.style.removeProperty('opacity');p.style.removeProperty('visibility');p.removeAttribute('mask');if(!closing&&step.paths.includes(p.id))p.classList.add('is-current');});
   if(!closing)trails(view,step);
   if(closing)postnatal(view,s);else if(mode==='fetal'){view.querySelector('#fo-mark').style.opacity='1';view.querySelector('#fo-closed')?.remove();}
   if(s.ring)for(const id of ['c-mca-r','c-mca-l'])view.querySelector('#'+id).setAttribute('stroke-dasharray','2 6');
   box.querySelector('.flow-birth').hidden=mode!=='fetal';
   for(const b of box.querySelectorAll('[data-flow-mode]'))b.setAttribute('aria-pressed',String(b.dataset.flowMode===mode));
   for(const b of box.querySelectorAll('button[data-birth]'))b.setAttribute('aria-pressed',String(b.dataset.birth===birth));
   box.querySelector('[data-legend-mixed]').style.display=mode==='fetal'&&!closing?'':'none';box.querySelector('[data-legend-closed]').style.display=closing?'':'none';box.querySelector('[data-legend-view]').textContent=view.dataset.view==='cart'?'上：腦底仰視・下：頸部前視・圖左＝人體右側':'前視・圖左＝人體右側';
   dots.innerHTML=rows().map((r,i)=>`<button data-step="${i}" aria-label="第${i+1}步：${esc(r.title)}" aria-current="${i===index?'step':'false'}">${i+1}</button>`).join('');
   box.querySelector('.flow-count').textContent=closing?`出生後・第 ${index+1}／6 項`:`第 ${index+1}／${rows().length} 步`;
   box.querySelector('.flow-card h3').textContent=step.title;box.querySelector('.flow-small').textContent=step.text;box.querySelector('.flow-source').textContent=step.source;
   box.querySelector('[data-flow-prev]').disabled=index===0;box.querySelector('[data-flow-next]').disabled=index===rows().length-1;box.querySelector('[data-flow-play]').disabled=closing||motion.matches||index===rows().length-1;
   box.querySelector('.flow-note').textContent=closing?'出生後六項閉鎖為教學對照順序，非實際閉鎖時序；灰色表示已閉鎖。':mode==='cerebral'&&[4,5].includes(index)?'交通動脈連接左右與前後，不代表固定流向。':'簡化示意，構造非等比例，非實際心跳時序。';
   if(!closing){visited.get(mode).add(index);if(visited.get(mode).size===rows().length)watched.add(mode);}predict.hidden=watched.size!==4;
   box.querySelector('.flow-watched').textContent=`已看完 ${watched.size}／4 模式：${lab.modes.filter(m=>watched.has(m.id)).map(m=>m.label).join('、')||'尚未看完第一個模式'}`;
   if(!closing)flowRun();
  }
  box.querySelector('.flow-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-flow-mode]');if(!b)return;stop();mode=b.dataset.flowMode;birth='before';index=0;box.querySelector('[data-flow-speed]').value='1';render();});
  box.querySelector('.flow-birth').addEventListener('click',e=>{const b=e.target.closest('[data-birth]');if(!b)return;stop();birth=b.dataset.birth;index=0;render();});
  box.querySelector('[data-flow-prev]').onclick=()=>{stop();index=Math.max(0,index-1);render();};
  box.querySelector('[data-flow-next]').onclick=()=>{stop();index=Math.min(rows().length-1,index+1);render();};
  box.querySelector('[data-flow-reset]').onclick=()=>{stop();index=0;render();};
  dots.onclick=e=>{const b=e.target.closest('[data-step]');if(!b)return;stop();index=Number(b.dataset.step);render();};
  box.querySelector('[data-flow-play]').onclick=()=>{if(playing){stop();return;}if(motion.matches||birth==='after')return;playing=true;box.querySelector('[data-flow-play]').textContent='暫停';box.querySelector('[data-flow-play]').setAttribute('aria-pressed','true');flowRun(false);};
  box.querySelector('[data-flow-speed]').onchange=()=>{if(birth!=='after')flowRun();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});motion.addEventListener('change',()=>{stop();render();});render();
 }
 return {html,mount};
})();
