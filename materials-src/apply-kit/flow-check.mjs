// A literal reviewed citation alone is insufficient: it must order these endpoints.
import fs from 'node:fs';
import path from 'node:path';
const plain=s=>String(s??'').replace(/\*\*/g,'').replace(/\s+/g,' ').trim();
export function checkFlowRoutes(data,{cite,baseDir}={}){
 const errors=[];
 for(const owner of [...(data.learning?.nodes||[]),...(data.lab?.states||[])])for(const route of owner.flowRoutes||[]){
  const prefix=owner.id+'.flowRoutes.'+route.id;
  if(baseDir){const figure=owner.figure||data.lab.figure;const f=path.resolve(baseDir,figure.src);if(f.endsWith('.svg')){const svg=fs.readFileSync(f,'utf8');const image=svg.match(/<image\b[^>]*>/)?.[0];const number=k=>Number(image?.match(new RegExp('\\b'+k+'="([0-9.]+)"'))?.[1]);if(number('width')!==route.width||number('height')!==route.height)errors.push(prefix+': raster dimensions differ from SVG image');if(!svg.includes('data-raster-layout='))errors.push(prefix+': SVG raster coordinate frame required');}else if(route.width!==figure.width||route.height!==figure.height)errors.push(prefix+': raster dimensions differ from lab figure');}
  for(const[i,s]of route.segments.entries()){
   const p=prefix+'.segments['+i+']';cite(s.sources,p);
   const from=plain(s.from?.text??s.from),to=plain(s.to?.text??s.to);
   if(!from||!to||from===to||!s.sources?.some(ref=>{
    const q=plain(ref.quote);
    // Repeated endpoint mentions (e.g. PCO₂ ... CO₂) cannot force the wrong occurrence.
    for(let a=q.indexOf(from);a>=0;a=q.indexOf(from,a+from.length))for(let b=q.indexOf(to,a+from.length);b>=0;b=q.indexOf(to,b+to.length)){
     const between=q.slice(a+from.length,b);if(/[。；不非無勿]/.test(between))continue;
     if(/→|移|進|經|至|入|回|送|接|循|分泌|轉|釋|沿|向|開口|收縮|排/.test(between)||(/依序/.test(q.slice(q.lastIndexOf('。',a)+1,a))&&/^[、，\s]*$/.test(between)))return true;
    }
    return false;
   }))errors.push(p+': flow evidence must explicitly order from → to');
  }
 }
 return errors;
}
