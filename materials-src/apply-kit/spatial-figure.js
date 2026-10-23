function renderSpatialFigure({node,step,state,txt,controls=true,order}) {
 const spec=step.spatial, [,,w,h]=spec.crop, m=state.locate||{values:[]};
 const picked=m.picked, placed=m.values.filter(v=>v!==null).length;
 const ui=(key)=>`<span data-interface="locate.${key}">${({guide:'先點一個標籤，再點圖上它所在的位置',help:'操作說明',skip:'略過引導',scroll:'可左右、上下捲動圖面，查看所有位置。',view:'查看位置'})[key]}</span>`;
 const asset={...node.teacherFigure,crop:spec.crop};
 let picture=spec.data?renderSpatialData(spec):renderTeacherFigure(asset);
 if(spec.directions){
   const arrows=step.cards.map((_,row)=>{
     if(m.values[row]===null||m.values[row]<0)return '';
     const [x,y]=spec.points[m.values[row]],v=spec.directionVectors[row],on=m.directions?.[row];
     const a=on?[x+v[0],y+v[1]]:[x+v[2],y+v[3]],b=on?[x+v[2],y+v[3]]:[x+v[0],y+v[1]];
     return `<path data-spatial-flow="${row}" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" fill="none" stroke="white" stroke-width="14"/><path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" fill="none" stroke="#397b91" stroke-width="7" marker-end="url(#teacher-arrow)"/>`;
   }).join('');picture=picture.replace(/<\/svg>$/,arrows+'</svg>');
 }
 const active=controls&&!state.retry&&state.phase==='action';
 const guide=active&&state.locateGuide?`<aside class="spatial-guide">${ui('guide')}<button id="locate-skip">${ui('skip')}</button></aside>`:'';
 const labels=(order||step.cards.map((_,i)=>i)).map(row=>{const id=step.cards[row];return `<button data-spatial-card="${row}" aria-pressed="${picked===row}" class="${picked===row?'picked':''} ${m.values[row]!==null?'placed':''}" ${active?'':'disabled'}>${txt(id)}</button>`;}).join('');
 const targets=spec.points.map(([x,y],index)=> {
   const rows=step.cards.map((_,r)=>r).filter(r=>m.values[r]===index);
   const caption=spec.captions?.[index];
   return `<button class="spatial-target" data-spatial-target="${index}" data-x="${x}" data-y="${y}" style="left:${x/w*100}%;top:${y/h*100}%" aria-label="圖上位置 ${String.fromCharCode(65+index)}" ${active?'':'disabled'}><span data-interface="locate.point${index}">${String.fromCharCode(65+index)}</span></button>${caption?`<div class="spatial-caption" style="left:${x/w*100}%;top:${Math.max(0,y/h*100-14)}%">${txt(caption)}</div>`:''}${rows.map(row=>`<div class="spatial-stamp" data-spatial-stamp="${row}" data-target="${index}" style="left:clamp(80px,${x/w*100}%,calc(100% - 80px));top:${y/h*100}%">${txt(step.cards[row])}</div>`).join('')}`;
 }).join('');
 const direction=spec.directions&&controls ? `<div class="spatial-directions">${step.cards.map((id,row)=>`<button data-spatial-direction="${row}" ${active&&m.values[row]!==null?'':'disabled'}>${txt(id)} <span data-interface="locate.arrow${(m.directions?.[row]?spec.directionVectors[row][2]>spec.directionVectors[row][0]:spec.directionVectors[row][2]<spec.directionVectors[row][0])?1:0}">${(m.directions?.[row]?spec.directionVectors[row][2]>spec.directionVectors[row][0]:spec.directionVectors[row][2]<spec.directionVectors[row][0])?'→':'←'}</span></button>`).join('')}</div>`:'';
 return `<div class="spatial-workspace" data-spatial-figure><div class="spatial-toolbar"><div class="spatial-labels">${labels}</div>${active?`<button id="locate-help">${ui('help')}</button>`:''}</div>${guide}${direction}<div class="spatial-navigation">${ui('scroll')}<div>${ui('view')}${spec.points.map((_,i)=>`<button data-spatial-view="${i}" aria-label="查看位置 ${String.fromCharCode(65+i)}"><span data-interface="locate.point${i}">${String.fromCharCode(65+i)}</span></button>`).join('')}</div></div><div class="spatial-scroll" data-spatial-scroll tabindex="0" aria-label="圖面，可捲動查看位置"><div class="spatial-canvas" style="aspect-ratio:${w}/${h};--canvas-min:${spec.minWidth||0}px">${picture}${targets}</div></div>${state.success&&step.slots?.length?`<ul class="answer-review-options">${step.slots.map(id=>`<li>${txt(id)}</li>`).join('')}</ul>`:''}</div>`;
}
function renderSpatialData(spec) {
 const [,,w,h]=spec.crop, count=spec.points.length;
 if(spec.data==='blood')return `<svg class="student-svg scripted-svg spatial-data" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect x="260" y="30" width="480" height="520" rx="50" fill="#f3da97" stroke="#8aa7b5" stroke-width="8"/><path d="M264 300H736V500Q736 546 690 546H310Q264 546 264 500Z" fill="#c47885"/></svg>`;
 const boxes=spec.points.map(([x,y],i)=>`<rect x="${x-w*.09}" y="${h*.18}" width="${w*.18}" height="${h*.65}" rx="15" fill="${['#badce8','#e0edf2','#efd5d9','#d9e8f0'][i%4]}" stroke="#648a9b" stroke-width="4"/>${spec.particles?Array.from({length:i+1},(_,k)=>`<circle cx="${x+(k-1)*25}" cy="${y}" r="9" fill="#796681"/>`).join(''):''}`).join('');
 return `<svg class="student-svg scripted-svg spatial-data" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${boxes}</svg>`;
}
// Keep placed words clear of every physical target and of earlier placed words.
// Leaders retain the true attachment when a dense group needs a label offset.
function layoutSpatialStamps() {
 const canvas=document.querySelector('.spatial-canvas');if(!canvas)return;
 canvas.querySelector('.spatial-leaders')?.remove();
 const frame=canvas.getBoundingClientRect(),targets=[...canvas.querySelectorAll('[data-spatial-target]')].map(b=>{const r=b.getBoundingClientRect();return{x:r.x-frame.x,y:r.y-frame.y,w:r.width,h:r.height};});
 const placed=[],lines=[];
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 for(const stamp of canvas.querySelectorAll('[data-spatial-stamp]')){
   const target=targets[Number(stamp.dataset.target)];if(!target)continue;
   const x=target.x+target.w/2,y=target.y+target.h/2,w=stamp.offsetWidth,h=stamp.offsetHeight;
   const candidates=[];
   for(const gap of [28,56,84,112,150])for(const [dx,dy]of [[-w/2,gap],[-w/2,-h-gap],[gap,-h/2],[-w-gap,-h/2],[-w-gap,gap],[gap,gap],[-w-gap,-h-gap],[gap,-h-gap]]){
     const r={x:Math.max(2,Math.min(frame.width-w-2,x+dx)),y:Math.max(2,Math.min(frame.height-h-2,y+dy)),w,h};
     const collision=[...targets,...placed].reduce((sum,b)=>sum+overlap(r,b),0);
     candidates.push({...r,score:collision*10000+Math.hypot(r.x+w/2-x,r.y+h/2-y)});
   }
   const best=candidates.sort((a,b)=>a.score-b.score)[0];placed.push(best);
   Object.assign(stamp.style,{left:best.x+'px',top:best.y+'px',transform:'none'});
   lines.push(`<path d="M${x} ${y}L${best.x+best.w/2} ${best.y+best.h/2}"/>`);
 }
 if(lines.length)canvas.insertAdjacentHTML('beforeend',`<svg class="spatial-leaders" viewBox="0 0 ${frame.width} ${frame.height}" preserveAspectRatio="none" aria-hidden="true">${lines.join('')}</svg>`);
}
