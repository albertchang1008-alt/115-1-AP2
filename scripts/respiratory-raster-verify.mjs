// Check the actually painted plate viewport, independently of labels/manifest text.
// Sampling a real Chrome screenshot catches unresolved or hidden <use> targets
// even when their source file decodes and their SVG geometry looks valid.
export async function measureRasterPlates(figure, plates) {
  const viewports = await figure.evaluate(svg => [...svg.querySelectorAll('svg')].flatMap((s,index) => {
    if(!s.querySelector(':scope > use,:scope > image'))return [];
    for(let p=s;p;p=p.parentElement)if(getComputedStyle(p).display==='none'||getComputedStyle(p).visibility==='hidden')return [];
    // SVG getBoundingClientRect can describe the *uncropped referenced image*,
    // not this nested SVG viewport. Transform its viewport attributes instead.
    const m=s.parentElement.getScreenCTM();if(!m)return [];
    const p=new DOMPoint(s.x.baseVal.value,s.y.baseVal.value).matrixTransform(m);
    const width=s.width.baseVal.value*Math.hypot(m.a,m.b),height=s.height.baseVal.value*Math.hypot(m.c,m.d);
    return width>0&&height>0?[{index,widthCss:width,heightCss:height,clip:{x:p.x+scrollX,y:p.y+scrollY,width,height}}]:[];
  }));
  const checks=[];
  for (const [plateIndex,plate] of plates.entries()) {
    const viewport=viewports[plateIndex];
    if(!viewport){checks.push({plateIndex,source:plate.source,ok:false,reason:'missing visible plate viewport'});continue;}
    const region=figure.locator('svg').nth(viewport.index);
    const screenshot=await figure.page().screenshot({clip:viewport.clip,fullPage:true,animations:'disabled'});
    const pixels=await figure.page().evaluate(async base64=>{
      const im=new Image();im.src='data:image/png;base64,'+base64;await im.decode();
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,256,256);ctx.drawImage(im,0,0,256,256);
      const data=ctx.getImageData(0,0,256,256).data;let count=0;
      for(let i=0;i<data.length;i+=4)if(Math.min(data[i],data[i+1],data[i+2])<245)count++;
      return {nonWhiteRatio:count/(256*256),samplePixels:256*256,threshold:.2};
    },screenshot.toString('base64'));
    const image=await region.evaluate(async (s,expected)=>{
      const use=s.querySelector(':scope > use'),direct=s.querySelector(':scope > image');
      const source=direct||(use&&document.getElementById((use.getAttribute('href')||'').slice(1)));
      if(!source||source.tagName.toLowerCase()!=='image')return {decoded:false,dimensionsCorrect:false,reason:'missing image resource'};
      let sourceLayerVisible=true;
      for(let p=source.parentElement;p;p=p.parentElement)if(p.tagName.toLowerCase()!=='defs'&&getComputedStyle(p).display==='none')sourceLayerVisible=false;
      const width=Number(source.getAttribute('width')),height=Number(source.getAttribute('height'));
      const im=new Image();im.src=source.getAttribute('href')||source.getAttributeNS('http://www.w3.org/1999/xlink','href')||'';
      try{await im.decode();}catch{return {decoded:false,dimensionsCorrect:false,sourceLayerVisible,reason:'image decode failed'};}
      const dimensionsCorrect=width===expected[0]&&height===expected[1]&&im.naturalWidth>0&&im.naturalHeight>0&&Math.abs(im.naturalWidth/im.naturalHeight-width/height)<.002;
      return {decoded:true,dimensionsCorrect,sourceLayerVisible,svgSize:[width,height],decodedSize:[im.naturalWidth,im.naturalHeight],inline:!!direct};
    },plate.sourceSize);
    checks.push({plateIndex,source:plate.source,...viewport,...pixels,...image,ok:pixels.nonWhiteRatio>.2&&image.decoded&&image.dimensionsCorrect&&image.sourceLayerVisible});
  }
  if(viewports.length!==plates.length)checks.push({ok:false,reason:'plate count mismatch',expected:plates.length,actual:viewports.length});
  return checks;
}
