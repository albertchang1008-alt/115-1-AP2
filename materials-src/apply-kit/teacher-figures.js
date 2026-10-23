// All coordinates use the original raster frame, then project through the crop.
function teacherPoint(asset, label, index) {
  const aliases = {'環較長':'長環','環較短':'短環','足細胞（鮑氏囊臟層）':'足細胞','腎盂交接處':'腎盂交接','髂外動脈及靜脈交叉處':'髂外血管交叉','進入膀胱處':'進入膀胱','粒子多的一邊':'粒子較多','粒子少的一邊':'粒子較少','打開 ANP 開關，觀察腎臟的變化。':'ANP'};
  const point = asset.positions?.[index] || asset.anchors[aliases[label] || label];
  if (!point) throw Error('Unmapped teacher hotspot: '+asset.key+' '+label);
  const [x,y] = point, [cx,cy] = asset.crop;
  return [x/100*asset.width-cx,y/100*asset.height-cy];
}
function renderTeacherFigure(asset, {state={},step={},txt}={}) {
  const [cx,cy,w,h]=asset.crop;
  const found = step.blindHotspots ? (state.selected || []).map(i=> {
    const label=step.options?.[i];
    const [x,y]=teacherPoint(asset,label ? (txt?.(label)||label).replace(/<[^>]+>/g,'') : '',i);
    return `<circle data-found-location="${i}" cx="${x}" cy="${y}" r="${w*.012}" fill="#397b91" stroke="white" stroke-width="${w*.004}"/>`;
  }).join('') : '';
  let overlays='';
  const point=(label)=>teacherPoint(asset,label,999);
  const arrow=(a,b,color='#397b91')=>`<path data-teacher-flow d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" fill="none" stroke="white" stroke-width="${w*.016}"/><path data-direction-arrow d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" fill="none" stroke="${color}" stroke-width="${w*.008}" marker-end="url(#teacher-arrow)"/>`;
  if(asset.bodyClip) {
    const water=Math.max(0,Math.min(100,Number(state.slider)||0));
    // Inset trace of the teacher silhouette, in the declared source reference frame.
    // This clips the water overlay only; the original PNG remains byte-for-byte intact.
    overlays+=`<defs><clipPath id="teacher-body-water"><path transform="scale(${asset.width/(asset.bodyClipFrame?.[0]||900)} ${asset.height/(asset.bodyClipFrame?.[1]||1200)})" d="${asset.bodyClip}"/></clipPath></defs><g data-body-water clip-path="url(#teacher-body-water)"><rect data-water-level x="0" y="${asset.height*(.953-water*.932/100)}" width="${asset.width}" height="${asset.height*water*.932/100}" fill="#328fae" opacity=".65"/></g>`;
  }
  if(asset.slug==='urine-concentration' && asset.src.endsWith('-90.png')) {
    const sx=asset.width/100,sy=asset.height/100;
    overlays+='<path data-cortex-boundary d="M20 '+35*sy+'H'+(asset.width-20)+'" stroke="#765348" stroke-width="2" stroke-dasharray="6 5" fill="none"/>';
    overlays+=[48,62,76,90].map((y,i)=>`<path data-gradient-tick d="M${(14-i*2)*sx} ${y*sy}H${17*sx}" stroke="#765348" stroke-width="3"/>`).join('');
    const visible=state.visited?.length||state.success||step.type==='choice';
    const transport=(a,b,y,substance)=>`<path data-transport="${substance}" d="M${a*sx} ${y*sy}H${b*sx}" fill="none" stroke="white" stroke-width="14"/><path data-transport-arrow="${substance}" d="M${a*sx} ${y*sy}H${b*sx}" fill="none" stroke="${substance==='NaCl'?'#806224':'#276981'}" stroke-width="7" marker-end="url(#teacher-arrow)"/>`;
    if(visible&&asset.current==='loop-down')overlays+=[48,62,76].map(y=>transport(45,32,y,'water')).join('');
    if(visible&&asset.current==='loop-up')overlays+=[48,62,76].map(y=>transport(63,73,y,'NaCl')).join('');
    if(visible&&asset.current==='adh')overlays+=[48,62,76].map(y=>`<rect data-water-channel x="${77*sx}" y="${y*sy-9}" width="${8*sx}" height="18" rx="6" fill="#8ed5e1" stroke="#276981" stroke-width="3"/>`+transport(77,69,y,'water')).join('');
  }
  if(asset.current==='filter-direction') {
    const a=point('腎絲球'),b=point('濾液');overlays+=state.arrows?.[0]?arrow(a,b):arrow(b,a);
  }
  if(asset.current==='osmosis-direction' && (state.success || state.selected?.includes(0)))overlays+=arrow(point('粒子較少'),point('粒子較多'));
  if(asset.current==='anp-action' && (state.selected?.length || state.visited?.length || state.step>0))overlays+=arrow([w*.94,h*.73],[w*.94,h*.94]);
  if(!step.blindHotspots && ['sequence','point','explore'].includes(step.type))for(const i of state.selected||[]) {
    const label=step.options?.[i];
    // The displayed words are supplied by the approved script, never by this asset layer.
    const [x,y]=teacherPoint(asset, label ? (txt?.(label)||label).replace(/<[^>]+>/g,'') : '',i);
    overlays+=`<circle data-selected-region cx="${x}" cy="${y}" r="${w*.018}" fill="none" stroke="#397b91" stroke-width="${w*.008}"/>`;
  }
  return `<svg class="student-svg scripted-svg teacher-svg" data-teacher-image="${asset.key}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><marker id="teacher-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#397b91"/></marker></defs><svg viewBox="${cx} ${cy} ${w} ${h}" width="${w}" height="${h}"><image href="${asset.image}" width="${asset.width}" height="${asset.height}"/></svg>${found}${overlays}</svg>`;
}
