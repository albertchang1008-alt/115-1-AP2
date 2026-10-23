function mountApplyFlows(root,routes,{labTransform}={}){
 const NS='http://www.w3.org/2000/svg',groups=[];
 const el=(tag,attrs)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e};
 const frames=labTransform?[{parent:root,transform:labTransform}]:[...root.querySelectorAll('[data-raster-layout]')].map(e=>({parent:e.parentElement,transform:e.getAttribute('transform')}));
 for(const frame of frames)for(const route of routes||[]){
  const group=el('g',{'class':'flow-route','data-route-id':route.id,transform:frame.transform||'',role:'group','aria-label':route.segments.map(s=>s.from+' → '+s.to).join('；')});
  const defs=el('defs',{}),marker=el('marker',{id:'flow-'+(++mountApplyFlows.serial),viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:4,markerHeight:4,orient:'auto'});marker.append(el('path',{d:'M0 0L10 5L0 10Z',fill:'#006d91'}));defs.append(marker);group.append(defs);
  route.segments.forEach((s,i)=>{const d=s.points.map((pt,j)=>(j?'L':'M')+pt.join(' ')).join(' ');group.append(el('path',{d,fill:'none',stroke:'white','stroke-width':18,'stroke-linejoin':'round','class':'flow-route-halo','data-flow-segment':i}));group.append(el('path',{d,fill:'none',stroke:'#006d91','stroke-width':10,'stroke-linejoin':'round','stroke-dasharray':'18 12','marker-end':'url(#'+marker.id+')','class':'flow-route-path','data-flow-segment':i}));});
  // Before label groups, so leaders and text retain their original legibility.
  frame.parent.insertBefore(group,frame.parent.querySelector('g[data-label]'));groups.push(group);
 }
 let token=0;
 const media=matchMedia('(prefers-reduced-motion:reduce)');
 function stop(){token++;for(const g of groups){g.classList.remove('flow-once');g.dataset.playback='static';g.querySelectorAll('[data-flow-segment]').forEach(p=>{p.style.visibility='';p.classList.remove('flow-active')})}}
 media.addEventListener('change',()=>{if(media.matches)stop()});
 async function playOnce(){stop();if(media.matches)return;const run=token;groups.forEach(g=>{g.classList.add('flow-once');g.dataset.playback='playing';g.querySelectorAll('[data-flow-segment]').forEach(p=>p.style.visibility='hidden')});
  const count=Math.max(0,...routes.map(r=>r.segments.length));
  for(let i=0;i<count;i++){if(run!==token||media.matches)return;for(const g of groups)g.querySelectorAll('[data-flow-segment="'+i+'"]').forEach(p=>{p.style.visibility='visible';p.classList.add('flow-active')});await new Promise(r=>setTimeout(r,650));for(const g of groups)g.querySelectorAll('[data-flow-segment="'+i+'"]').forEach(p=>p.classList.remove('flow-active'));}
  if(run===token)groups.forEach(g=>g.dataset.playback='complete');
 }
 return {playOnce,stop};
}
mountApplyFlows.serial=0;
