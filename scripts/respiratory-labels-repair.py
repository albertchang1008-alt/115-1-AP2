"""S2-1..S2-14: regenerate only the reviewed figure slots.
Original PNGs/content/widget and the five unaffected records/figures are preserved.
"""
from pathlib import Path
import importlib.util, json, re, html, math, base64, copy
from PIL import Image
SPEC=importlib.util.spec_from_file_location('respiratory_stage2',Path(__file__).with_name('respiratory-labels-stage2.py'))
b=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(b);b.FOCUS_STYLE='red'
ROOT=b.ROOT;OUT=b.OUT;FS=b.FS;W=b.W;INK=b.INK;O2=b.O2;CO2=b.CO2
STATES=['overview-state-'+str(i) for i in [1,2,3]]
AFFECTED={
 'gas-exchange':STATES+['node-%02d'%i for i in range(1,7)],
 'respiratory-control':STATES+['node-01','node-02','node-04','node-05','node-06'],
 'breathing-mechanics':STATES+['node-01','node-02','node-03','node-04','node-06'],
 'o2-co2-transport':STATES+['node-01','node-05','node-06'],
 'lung-function':STATES+['node-%02d'%i for i in range(1,7)],
}
TERMS=['中樞化學受器','周邊化學受器','終末細支氣管','呼吸性細支氣管','化學受器訊息','牽張受器訊息','肺牽張受器','腦脊髓液','血腦障壁','肺泡壓','肺內壓','胸膜內壓','胸內壓','肺間壓','外肋間肌','內肋間肌','肋間肌','胸鎖乳突肌','肺小動脈收縮','肺小動脈','肺微血管','組織微血管','血紅素','碳酸酐酶','碳醯胺基血紅素','血基質','肺餘容積','潮氣容積','吸氣儲備容積','呼氣儲備容積','呼吸性酸中毒','呼吸性鹼中毒','肺泡通氣量','死腔通氣量','總通氣量','頸動脈體','主動脈體','呼吸深度','呼吸頻率','順應性較大','順應性較小']
TOKEN=re.compile('|'.join(re.escape(t) for t in sorted(TERMS,key=len,reverse=True))+r'|(?:P(?:CO₂|O₂)\s*約?\s*)?\d+(?:\.\d+)?\s*(?:mmHg|mL/dL/mmHg|mL/min|次/min|mL|L/分|L|%)')
def nowrap(text):
 parts=[];at=0
 for m in TOKEN.finditer(text):parts.append(html.escape(text[at:m.start()]));parts.append('<span style="white-space:nowrap">'+html.escape(m.group())+'</span>');at=m.end()
 return ''.join(parts)+html.escape(text[at:])
def wrap(text,limit=22):
 # Figure labels have enough width to stay whole; long prose uses native HTML.
 return [text]
b.wrap=wrap
NEUTRAL=['#333333','#888888','#555555']
b.VOLUME_COLORS={'TV':'#CC79A7','IRV':'#E69F00','ERV':'#999999','RV':'#DDDDDD'}

def near_segment(p,a,c):
 dx=c[0]-a[0];dy=c[1]-a[1];u=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy or 1)))
 return math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy)
class RepairRenderer(b.Renderer):
 def __init__(self,slug):
  super().__init__(slug);self.old=json.loads((self.raster/'labels.json').read_text());self.records=copy.deepcopy(self.old['figures']);self.enabled=False
  # Shared images are retained even when the figure using them is unaffected.
  svg=(OUT/f'{slug}-overview.svg').read_text()
  for im in re.findall(r'<image\b[^>]+/>',svg):
   m=re.search(r'id="([^"]+)"',im)
   if m:self.assets[m.group(1)]=im
 def begin(self,name):
  super().begin(name);self.enabled=name in AFFECTED[self.slug];self.annotation_count=0
  if getattr(self,"desktop",False):self.uid+="-desktop"
 def cards(self,items,focus=(),columns=1):
  if not self.enabled:return
  if self.slug=='gas-exchange' and items==['O₂','CO₂']:return
  if self.slug=='gas-exchange' and self.name=='node-03':items=[t for t in items if t not in ['O₂','CO₂']]
  if self.slug=='gas-exchange' and self.name=='node-06' and items==['血流轉向']:return
  if self.slug=='respiratory-control' and self.name.startswith('overview-') and len(items)==3:return
  if self.slug=='o2-co2-transport' and self.name=='node-06' and items==['CO₂＋H₂O','H₂CO₃','H⁺＋HCO₃⁻']:return
  before=len(self.parts)
  super().cards(items,focus,columns)
  for j in range(before,len(self.parts)):
   # Longest acronym is selected once; RV must not match IRV/ERV.
   fragment=self.parts[j]
   for item in items:
    if f'data-html-label="{html.escape(item)}"' not in fragment:continue
    color=None
    if self.slug=='lung-function':
     match=re.search(r'(?<![A-Z])(IRV|ERV|TV|RV)(?![A-Z])',item)
     if match:color=b.VOLUME_COLORS[match[1]]
    if self.slug=='lung-function' and self.name=='node-06' and item in ['正常','阻塞性','限制性']:
     target={'正常':'#333333','阻塞性':'#009E73','限制性':'#CC79A7'}[item];fragment=re.sub(r'(border-left:35px (?:solid|dashed|dotted) )#[A-Fa-f0-9]+;',lambda m:m[1]+target+';',fragment)
    if item in self.record['notes']:fragment=re.sub(r'border-left:35px (?:solid|dashed|dotted) #[A-Fa-f0-9]+;','',fragment);color=None
    if color:fragment=re.sub(r'border-left:35px solid #[A-Fa-f0-9]+;',f'border-left:35px solid {color};',fragment)
    fragment=fragment.replace('>'+html.escape(item)+'</span>','>'+nowrap(item)+'</span>')
   self.parts[j]=fragment
 def bars(self,rows,maxvalue,unit,colors=None):
  if not self.enabled:return
  if self.slug=='o2-co2-transport':colors=[O2,'#E6A073'] if self.name=='node-01' else [CO2,'#66A8CE','#B2D4E7']
  elif self.slug=='gas-exchange':colors=['#333333','#999999']
  else:colors=['#333333' if n.startswith('總通氣') else '#999999' if '死腔' in n or n.startswith('VD') else '#777777' for n,v,f in rows]
  title={'%':self.content['nodes'][0 if self.name=='node-01' else 4]['title']+'（%）','L/分':'通氣V／血流Q（L/分）','mL/min':'每分鐘通氣量（mL/min）','mL／次':'每次容積（mL／次）'}[unit]
  self.record['labels'].append(self.text(title,850,self.y+FS));self.y+=125
  for i,(name,value,focus) in enumerate(rows):
   self.record['labels'].append(self.text(name,70,self.y+FS,focus,align='start'));self.y+=115
   self.parts.append(f'<rect x="80" y="{self.y}" width="1500" height="95" fill="#f1f3f5"/><rect class="data-bar" data-value="{value}" data-max="{maxvalue}" x="80" y="{self.y}" width="{1500*value/maxvalue}" height="95" fill="{colors[i%len(colors)]}"/>')
   self.record['data'].append(dict(type='bar',label=name,value=value,max=maxvalue,width=1500*value/maxvalue,unit=unit));self.y+=160
 def plate(self,num,labels,red=(),crop=None,arrows=(),headings=(),canvas=None,routes=None,frame=False,image_width=1560):
  if not self.enabled:return
  if self.slug=='respiratory-control' and self.name.startswith('overview-') and crop is None:return control_overview_plate(self,num,red)
  if self.slug=='gas-exchange' and self.name=='node-06':
   labels=[b.label('局部低氧',480,360,'left'),b.label('肺小動脈收縮',185,245,'left'),b.label('血流減少',233,366,'left'),b.label('通氣良好',480,1050,'left')];arrows=[dict(b.arrow([40,560],[40,965],INK,12),directLabel='血流轉向',labelAt=[135,790])];red=list(red)+['血流轉向']
  if self.slug=='breathing-mechanics':
   if self.name.startswith('overview-') or self.name=='node-03':
    muscle={1:[1004,655],2:[1046,594],3:[1054,620]}[num]
    for l in labels:
     if l['label']=='外肋間肌':l['anchor']=muscle
  # Preserve the accepted original-pixel anchors, except the explicit R2-2 correction.
  original=self.old['figures'][self.name]
  pi=len(self.record['plates'])
  previous=[l for l in original['labels'] if l.get('anchor') is not None and (l.get('plate',0)==pi)]
  used=set()
  for l in labels:
   match=next((o for j,o in enumerate(previous) if j not in used and o['label']==l['label']),None)
   if match is not None:used.add(next(j for j,o in enumerate(previous) if o is match))
   if match:l['anchor']=match['anchor'][:]
   if self.slug=='respiratory-control' and self.name.startswith('overview-') and crop and crop[0]==360 and l['label']=='中樞化學受器':l['anchor']=[566,250]
  desktop=getattr(self,'desktop',False)
  wide=desktop and self.slug=='breathing-mechanics' and self.name in ['node-01','node-03']
  if desktop:image_width=1100 if wide else 850
  alpha=any(a.get('step') for a in original.get('arrows',[])) or bool(original.get('captionSteps'))
  source=self.raster/'incoming'/f'IMG-{self.slug}-{num:02}.png';rv=self.review[source.stem];assert rv['verdict']=='pass';iw,ih=Image.open(source).size
  data=base64.b64encode((self.raster/f'plate-{num:02}.webp').read_bytes()).decode();asset=f'{self.slug}-plate-{num:02}';self.assets[asset]=f'<image id="{asset}" href="data:image/webp;base64,{data}" width="{iw}" height="{ih}" preserveAspectRatio="xMidYMid meet"/>'
  cx,cy,cw,ch=crop or (0,0,iw,ih);scale=image_width/(canvas[0] if canvas else cw);dx=(W-image_width)/2+((canvas[0]-cw)*scale/2 if canvas else 0)
  start=self.y
  for heading in headings:self.record['labels'].append(self.text(heading,850,self.y+FS,heading in red));self.y+=125
  dy=self.y+30+((canvas[1]-ch)*scale/2 if canvas else 0);bottom=self.y+30+(canvas[1] if canvas else ch)*scale
  self.parts.append(f'<svg x="{dx}" y="{dy}" width="{cw*scale}" height="{ch*scale}" viewBox="{cx} {cy} {cw} {ch}" overflow="hidden"><use href="#{asset}"/></svg>')
  T=lambda p:[dx+(p[0]-cx)*scale,dy+(p[1]-cy)*scale]
  paths=[];labels_drawn=[]
  for a in arrows:
   pp=[T(p) for p in a.get("points",[a["start"],a["end"]])];paths.extend(zip(pp,pp[1:]))
  for a in arrows:
   points=[T(p) for p in a.get('points',[a['start'],a['end']])];paths.extend(zip(points,points[1:]));color=a['color'];width=a['width'];key=f'{self.uid}-repair-arrow-{len(self.record["arrows"])}'
   # Step circles sit at the origin; begin visible arrow ink outside their text area.
   if a.get('step') and a.get('stepPosition',a['start'])==a['start']:
    ux,uy=points[1][0]-points[0][0],points[1][1]-points[0][1];length=math.hypot(ux,uy);points[0]=[points[0][0]+ux/length*85,points[0][1]+uy/length*85]
   terminal=f'<path d="M0 0L4 2L0 4Z" fill="{color}"/>' if a['terminal']=='arrow' else f'<path d="M3 0V4" stroke="{color}" stroke-width="1"/>'
   opacity=routes.get(a.get('route'),1) if routes else 1
   d='M'+'L'.join(f'{x},{y}' for x,y in points);dash='stroke-dasharray="15 12"' if a['signal'] else ''
   self.parts.append(f'<g class="route-{a.get("route")}" opacity="{opacity}"><defs><marker id="{key}" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">{terminal}</marker></defs><path d="{d}" fill="none" stroke="white" stroke-width="{width+8}"/><path class="flow-arrow" d="{d}" fill="none" stroke="{color}" stroke-width="{width}" {dash} marker-end="url(#{key})"/></g>')
   rec=dict(a,source=str(source.relative_to(ROOT)),svgPoints=points,svgStart=points[0],svgEnd=points[-1]);self.record['arrows'].append(rec)
   if a.get('directLabel'):
    x,y=T(a['labelAt']);name=a['directLabel'];self.record['labels'].append(self.text(name,x,y,name in red,align='start'));labels_drawn.append((x+len(name)*FS/2,y-FS*.3,len(name)*FS/2))
   if color in [O2,CO2] and not a.get('route') and not a.get('step'):
    name='O₂' if color==O2 else 'CO₂';p0,p1=points[0],points[-1];ux=p1[0]-p0[0];uy=p1[1]-p0[1];length=math.hypot(ux,uy);nx=-uy/length;ny=ux/length
    for sign,offset in [(sign,offset) for offset in [160,230,310,400] for sign in [1,-1]]:
     x=(p0[0]+p1[0])/2+nx*sign*offset;y=(p0[1]+p1[1])/2+ny*sign*offset+22
     if 140<x<1560 and dy+80<y<bottom-40 and not any(near_segment((x+ox,y-22+oy),p,q)<80 for p,q in paths for ox in [-65,0,65] for oy in [-25,25]) and not any(math.hypot(x-T(l['anchor'])[0],y-22-T(l['anchor'])[1])<130 for l in labels) and not any(math.hypot(x-px,y-22-py)<rad+100 for px,py,rad in labels_drawn):break
    if desktop and self.slug=='gas-exchange':
     fixed={'node-01':[[750,540],[780,130]] if pi==0 else [[750,1210],[750,790]],'node-02':[[600,870],[600,1380]],'node-03':[[800,860],[490,600]]}.get(self.name)
     if fixed:x,y=T(fixed[[O2,CO2].index(color)])
    self.record['labels'].append(self.text(name,x,y));self.parts[-1]=self.parts[-1].replace('<text ','<text style="font-size:calc(44px * var(--font-scale,1))" ') if desktop else self.parts[-1];labels_drawn.append((x,y-22,90))
   if a.get('step'):
    sx,sy=T(a.get('stepPosition',a['start']));self.parts.append(f'<circle cx="{sx}" cy="{sy}" r="46" fill="white" stroke="#17212b" stroke-width="3"/>');self.record['labels'].append(self.text(chr(0x2460+a['step']-1),sx,sy+22,lines=[str(a['step'])]));self.parts[-1]=self.parts[-1].replace('<text ',f'<text data-annotation-id="{a["step"]}" data-annotation-kind="step" ');labels_drawn.append((sx,sy,72))
  if desktop:
   # Direct labels occupy two outside columns; source geometry remains isotropic.
   groups={'left':[],'right':[]};leader_paths=[]
   for l in labels:
    ax,ay=T(l['anchor']);side='left' if ax<850 else 'right'
    if self.slug=='gas-exchange' and self.name=='node-06' and l['label'] in ['局部低氧','通氣良好']:side='right'
    groups[side].append((ay,l,ax))
   for side,items in groups.items():
    items.sort(key=lambda z:z[0]);cursor=dy+60
    for ay,l,ax in items:
     name=l['label'];lines=[name]
     # Only semantic boundaries; never split an anatomical term or numeric unit.
     if '（' in name:lines=[name.split('（')[0],'（'+name.split('（',1)[1]]
     elif re.search(r'P(?:CO₂|O₂)',name):
      at=re.search(r'P(?:CO₂|O₂)',name).start();lines=[name[:at],name[at:]] if at else [name]
     if l.get('lines'):
      value=''.join(l['lines'][1:]);value=re.sub(r'(\d)(mmHg)',r'\1 \2',value)
      if value:lines=[name,value]
     yy=max(cursor,ay);xx=(280 if side=='left' else 1420) if wide else (400 if side=='left' else 1300);end=xx+15 if side=='left' else xx-15
     origin=(end,yy-16);target=(ax,ay);edge=(295 if side=='left' else 1405) if wide else (420 if side=='left' else 1280)
     def cross(a,b,c,d):
      f=lambda p,q,r:(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
      return f(a,b,c)*f(a,b,d)<0 and f(c,d,a)*f(c,d,b)<0
     candidates=[[origin,target],[origin,(edge,origin[1]),(edge,ay),target]]
     for offset in [-120,120,-230,230]:candidates.append([origin,(edge,origin[1]),(edge,ay+offset),(ax,ay+offset),target])
     for pts in candidates:
      segments=list(zip(pts,pts[1:]))
      if any(cross(a,b,c,d) for a,b in segments for c,d in leader_paths):continue
      if any(near_segment((px,py),a,b)<rad+25 for a,b in segments for px,py,rad in labels_drawn):continue
      break
     leader_paths.extend(zip(pts,pts[1:]));path=' '.join(f'{px},{py}' for px,py in pts)
     self.parts.append(f'<g data-label="{html.escape(name)}"><polyline class="lead halo" points="{path}"/><polyline class="lead" points="{path}"/><circle class="dot" data-anchor="{len(self.record["labels"])}" cx="{ax}" cy="{ay}" r="6"/></g>')
     rec=self.text(name,xx,yy,name in red,lines=lines,align='end' if side=='left' else 'start');self.parts[-1]=self.parts[-1].replace('<text ','<text data-direct-label="true" style="font-size:calc(44px * var(--font-scale,1))" ');rec.update(anchor=l['anchor'],source=str(source.relative_to(ROOT)),svgAnchor=[ax,ay],plate=pi,renderAs='direct-label');self.record['labels'].append(rec)
     cursor=yy+len(lines)*FS*1.18+45
    bottom=max(bottom,cursor)
   self.y=bottom+90
  else:
   # Number markers use real source anchors. Short leaders preserve exact anatomy
   # while the number can move off an arrow or another number.
   for i,l in enumerate(labels,1):
    ax,ay=T(l['anchor']);mx,my=ax,ay
    candidates=[(ax,ay)]+[(ax+ox,ay+oy) for ox,oy in [(-95,-95),(95,-95),(-95,95),(95,95),(-150,0),(150,0),(0,-160),(0,160),(-180,-140),(180,140)]]
    for x,y in candidates:
     if not (65<x<W-65 and dy+55<y<bottom-45):continue
     if any(near_segment((x,y),p,q)<105 for p,q in paths):continue
     if any(math.hypot(x-px,y-py)<rad+70 for px,py,rad in labels_drawn):continue
     mx,my=x,y;break
    labels_drawn.append((mx,my,55));name=l['label'];esc=html.escape(name)
    self.parts.append(f'<g data-label="{esc}"><polyline class="lead halo" points="{mx},{my} {ax},{ay}"/><polyline class="lead" points="{mx},{my} {ax},{ay}"/><circle class="dot" data-anchor="{len(self.record["labels"])}" cx="{ax}" cy="{ay}" r="6"/><circle cx="{mx}" cy="{my}" r="43" fill="white" stroke="#444" stroke-width="3"/></g>')
    number=chr(64+self.annotation_count+i) if alpha else str(self.annotation_count+i)
    rec=self.text(name,mx,my+22,lines=[number]);self.parts[-1]=self.parts[-1].replace('<text ',f'<text data-annotation-id="{number}" data-annotation-kind="label" ');rec.update(anchor=l['anchor'],source=str(source.relative_to(ROOT)),svgAnchor=[ax,ay],number=i,renderAs='number-marker',plate=len(self.record['plates']));self.record['labels'].append(rec)
   self.y=bottom+90
   for i,l in enumerate(labels,1):
    name=l['label'];display=name
    if l.get('lines'):
     value=''.join(l['lines'][1:]);value=re.sub(r'(\d)(mmHg)',r'\1 \2',value);display=name+' '+value
    rec=self.text(name,90,self.y+FS,name in red,lines=[f'{chr(64+self.annotation_count+i) if alpha else self.annotation_count+i}　{display}'],align='start',kind='number-key');self.parts[-1]=self.parts[-1].replace('<text ','<text data-number-key="true" ');rec.update(anchor=None,number=i);self.record['labels'].append(rec);self.y+=115
  self.annotation_count+=len(labels)
  self.record['plates'].append(dict(source=str(source.relative_to(ROOT)),sourceSize=[iw,ih],crop=list(crop) if crop else None,imageTransform=dict(x=dx,y=dy,scale=scale),reviewNote=rv['note'],canvas=canvas,numberedKey=not desktop))
  if frame:self.parts.append(f'<rect x="35" y="{start}" width="1630" height="{self.y-start}" rx="18" fill="none" stroke="#999" stroke-width="4"/>')
  self.y+=50
 def finish(self):
  if not self.enabled:return (OUT/f'{self.slug}-{self.name}.svg').read_text() if not (self.slug=='o2-co2-transport' and self.name.startswith('overview-')) else ''
  fn=CUSTOM.get((self.slug,self.name))
  if fn:
   name=self.name;self.begin(name);fn(self)
  self.record['repair']='S2-1–S2-14'
  return super().finish()
 def manifest(self):
  p=OUT/f'{self.slug}-overview.svg';svg=p.read_text();svg=re.sub(r'<defs><image\b.*?</defs>','',svg,count=1,flags=re.S) if '<defs><image' in svg else svg
  pos=svg.index('>')+1;svg=svg[:pos]+'<defs>'+''.join(self.assets.values())+'</defs>'+svg[pos:];p.write_text(svg)
  (self.raster/'labels.json').write_text(json.dumps(dict(slug=self.slug,focusStyle='red',anchorCoordinates='original PNG pixels',figures=self.records),ensure_ascii=False,indent=2)+'\n')

def text(r,name,x,y,focus=False,align='middle',lines=None):r.record['labels'].append(r.text(name,x,y,focus,lines=lines,align=align))
def signal(r,points,width=6,end='arrow',dash=True):
 key=f'{r.uid}-signal-{len(r.parts)}';terminal='<path d="M0 0L4 2L0 4Z" fill="#444"/>' if end=='arrow' else '<path d="M3 0V4" stroke="#444" stroke-width="1"/>';d='M'+'L'.join(f'{x},{y}' for x,y in points)
 r.parts.append(f'<defs><marker id="{key}" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">{terminal}</marker></defs><path class="flow-arrow" d="{d}" fill="none" stroke="#444" stroke-width="{width}" '+('stroke-dasharray="12 10"' if dash else '')+f' marker-end="url(#{key})"/>')
def box(r,name,x,y,w=720,h=125,focus=False):
 r.parts.append(f'<rect x="{x-w/2}" y="{y-80}" width="{w}" height="{h}" rx="15" fill="#f5f7f8" stroke="#aaa" stroke-width="2"/>');text(r,name,x,y,focus)

def control_overview_plate(r,num,focus):
 i=int(r.name[-1]);opacity={k:1 if k==['central','stretch','peripheral'][i-1] else .3 for k in ['central','stretch','peripheral']}
 ls=[b.label('周邊化學受器',639,360,'right'),b.label('迷走神經',657,552,'right'),b.label('肺牽張受器',749,941,'right')]
 routes=[dict(b.arrow([480,310],[375,975],INK,6,True,route='central'),points=[[480,310],[466,620],[375,975]]),dict(b.arrow([715,905],[564,258],INK,6,True,end='inhibit',route='stretch'),points=[[715,905],[664,838],[656,695],[618,490],[614,360],[564,258]]),dict(b.arrow([613,402],[579,289],INK,6,True,route='peripheral'),points=[[613,402],[612,326],[579,289]]),dict(b.arrow([472,310],[373,975],INK,6,True,route='peripheral'),points=[[472,310],[458,620],[373,975]])]
 r.plate(1,ls,red=focus,crop=[0,0,1148,1371],arrows=routes,routes=opacity)
 # End-point labels belong on the diagram, not in disconnected cards.
 plate=r.record['plates'][-1];T=lambda p:[plate['imageTransform']['x']+p[0]*plate['imageTransform']['scale'],plate['imageTransform']['y']+p[1]*plate['imageTransform']['scale']]
 x,y=T([100,1130]);r.parts.append(f'<g opacity="{1 if i in [1,3] else .3}">');text(r,'換氣增加',x,y,i==3,align='start');r.parts.append('</g>')
 x,y=T([460,210]);r.parts.append(f'<g opacity="{opacity["stretch"]}">');text(r,'抑制吸氣',x,y,i==2,align='end');r.parts.append('</g>')
 # The original brainstem crop is enlarged about 2.9x relative to the main plate.
 inset=[b.label('橋腦',534,147,'left'),b.label('延髓',536,244,'left'),b.label('腦脊髓液H⁺',607,218,'right'),b.label('中樞化學受器',566,250,'right')]
 arr=[b.arrow([680,170],[603,215],CO2,10,route='central'),b.arrow([611,229],[566,250],INK,6,True,route='central')]
 r.plate(1,inset,red=focus,crop=[360,10,390,330],arrows=arr,routes={'central':opacity['central']},frame=True)
 p=r.record['plates'][-1];T=lambda q:[p['imageTransform']['x']+(q[0]-360)*p['imageTransform']['scale'],p['imageTransform']['y']+(q[1]-10)*p['imageTransform']['scale']]
 x,y=T([450,80] if getattr(r,'desktop',False) else [665,125]);text(r,'血腦障壁',x,y,align='middle')
 x,y=T([700,125] if getattr(r,"desktop",False) else [712,215]);r.parts.append(f'<g opacity="{opacity["central"]}">');text(r,'CO₂',x,y,i==1);r.parts.append('</g>')
 x1,y1=T([635,150]);x2,y2=T([635,215]);r.parts.append(f'<path d="M{x1} {y1}L{x2} {y2}" stroke="#888" stroke-width="5" stroke-dasharray="10 8"/>')

def gas_factors(r):
 for x,items,out in [(425,['膜面積↑','分壓差↑','溶解度↑'],'擴散↑'),(1275,['膜厚度↑','分子量平方根↑'],'擴散↓')]:
  r.parts.append(f'<rect x="{x-375}" y="70" width="750" height="450" rx="18" fill="#f5f7f8" stroke="#aaa" stroke-width="3"/>')
  for j,item in enumerate(items):text(r,item,x,180+j*125,item in ['膜面積↑','膜厚度↑'])
  signal(r,[(x,560),(x,710)]);box(r,out,x,850,focus=True)
 r.y=1000;r.cards(['CO₂溶解度約為O₂的20倍']);r.caption(r.content['nodes'][3]['concept'])
def control_exercise(r):
 box(r,'運動',425,160);text(r,'潮氣量增加',480,430,True);text(r,'呼吸頻率增加',480,660,True)
 signal(r,[(425,250),(120,250),(120,408),(200,408)]);signal(r,[(120,408),(120,638),(200,638)])
 box(r,'體溫升高',425,980);signal(r,[(425,1070),(425,1200)]);text(r,'促進呼吸',425,1330)
 r.parts.append('<path d="M850 60V1900" stroke="#ddd" stroke-width="4"/>')
 items=['初到高山','大氣壓降低','吸入氧分壓下降','周邊化學受器','換氣增加','CO₂排出增加','pH上升']
 for j,item in enumerate(items):
  y=160+j*270;box(r,item,1275,y,focus=item in ['吸入氧分壓下降','周邊化學受器','換氣增加'])
  if j<len(items)-1:signal(r,[(1275,y+85),(1275,y+150)])
 r.y=2050;r.caption(r.content['nodes'][5]['concept'])
def control_ph(r):
 for item in ['pH 7.35–7.45','pH＝pKa＋log（HCO₃⁻/H₂CO₃）','6.1＋log（26/1.3）≈7.4']:
  r.parts.append(f'<foreignObject x="50" y="{r.y}" width="1600" height="140"><div xmlns="http://www.w3.org/1999/xhtml" class="data-card"><span data-html-label="{html.escape(item)}">{nowrap(item)}</span></div></foreignObject>');r.record['labels'].append(dict(label=item,anchor=None,renderAs='html',textPosition=[50,r.y],lines=[item]));r.y+=160
 y=r.y+220
 r.parts.append(f'<rect x="550" y="{y-55}" width="600" height="110" fill="#eee"/><path d="M200 {y}H1500M550 {y-75}V{y+75}M1150 {y-75}V{y+75}" fill="none" stroke="#444" stroke-width="5"/>')
 text(r,'正常範圍',850,y+23);text(r,'35',550,y+150);text(r,'45',1150,y+150);text(r,'PCO₂（mmHg）',850,y-135)
 signal(r,[(520,y+240),(300,y+240)],dash=False);signal(r,[(1180,y+240),(1400,y+240)],dash=False)
 text(r,'PCO₂＜35 mmHg',425,y+390,True);text(r,'PCO₂＞45 mmHg',1275,y+390,True);text(r,'呼吸性鹼中毒方向',425,y+540,True);text(r,'呼吸性酸中毒方向',1275,y+540,True)
 signal(r,[(1275,y+620),(1275,y+730)]);text(r,'腎臟排酸留HCO₃⁻',1275,y+860)
 r.y=y+990;r.caption(r.content['nodes'][4]['concept']);r.record['data'].append(dict(type='PCO2-axis',normalRange=[35,45],positions=[550,1150]))
def compliance(r):
 r.cards(['C＝ΔV/ΔP'],focus=['C＝ΔV/ΔP']);y=r.y+80
 r.parts.append(f'<path d="M220 {y+50}V{y+950}H1090" fill="none" stroke="#444" stroke-width="5"/>')
 for name,control,end,color,focus in [('順應性較大',[560,180],[1050,100],'#333333',True),('順應性較小',[650,730],[1050,570],'#CC79A7',False)]:
  r.parts.append(f'<path class="compliance-curve" d="M220 {y+950}Q{control[0]} {y+control[1]} {end[0]} {y+end[1]}" fill="none" stroke="{color}" stroke-width="12"/>');text(r,name,1130,y+end[1]+22,focus,align='start')
  lo,hi=0,1
  for _ in range(60):
   t=(lo+hi)/2;x=(1-t)**2*220+2*(1-t)*t*control[0]+t*t*end[0]
   if x<850:lo=t
   else:hi=t
  yy=y+(1-t)**2*950+2*(1-t)*t*control[1]+t*t*end[1]
  r.parts.append(f'<circle class="compliance-point" cx="850" cy="{yy}" r="15" fill="{color}"/>')
 r.parts.append(f'<path d="M850 {y+20}V{y+950}" stroke="#888" stroke-width="4" stroke-dasharray="15 12"/>');text(r,'肺容積改變量ΔV',850,y-40);text(r,'肺間壓改變量ΔP',650,y+1070);r.y=y+1190;r.caption(r.content['nodes'][3]['concept'])

def lung_volumes(r):
 r.cards(['課本男性示例']);y=r.y+120;ph=1320;Y=lambda v:y+ph-v*ph/6000
 labels={'TV':'潮氣容積TV 500 mL','IRV':'吸氣儲備容積IRV 3100 mL','ERV':'呼氣儲備容積ERV 1200 mL','RV':'肺餘容積RV 1200 mL'}
 for key,lo,hi in [('RV',0,1200),('ERV',1200,2400),('TV',2400,2900),('IRV',2900,6000)]:
  r.parts.append(f'<rect class="volume-band" data-low="{lo}" data-high="{hi}" x="250" y="{Y(hi)}" width="790" height="{(hi-lo)*ph/6000}" fill="{b.VOLUME_COLORS[key]}" opacity=".18"/><path d="M1090 {Y(hi)}H1140V{Y(lo)}H1090" fill="none" stroke="#444" stroke-width="4"/>')
  rec=r.text(labels[key],1200,(Y(hi)+Y(lo))/2+22,True,lines=[f'{key} {hi-lo}'],align='start');r.record['labels'].append(rec);r.record['data'].append(dict(type='volume-band',label=key,low=lo,high=hi,height=(hi-lo)*ph/6000,scale=ph/6000))
 r.parts.append(f'<path d="M250 {y}V{Y(0)}H1050" stroke="#444" stroke-width="5" fill="none"/>')
 for v in [0,1200,2400,2900,6000]:r.parts.append(f'<path d="M250 {Y(v)}H1040" stroke="#aaa" stroke-width="3" stroke-dasharray="12 10"/>');text(r,str(v),215,Y(v)+20,align='end')
 pts=[(280,2400),(350,2900),(420,2400),(490,2900),(560,2400),(630,2900),(700,2400),(850,6000),(1040,1200),(1190,2900),(1310,2400),(1430,2900)];pts=[(250+(x-250)*.61,v) for x,v in pts];d=f'M{pts[0][0]} {Y(pts[0][1])}'
 for (x0,v0),(x1,v1) in zip(pts,pts[1:]):mid=(x0+x1)/2;d+=f'C{mid} {Y(v0)} {mid} {Y(v1)} {x1} {Y(v1)}'
 r.parts.append(f'<path class="volume-trace" d="{d}" fill="none" stroke="#444" stroke-width="12"/>');text(r,'容積（mL）',650,y-45);text(r,'時間',650,Y(0)+110);r.y=Y(0)+210;r.cards(list(labels.values()),focus=list(labels.values()));r.caption(r.content['nodes'][0]['concept'])
def aligned_stack(r,segments,maxvalue=6000):
 if not r.enabled:return
 offsets={'IRV':0,'TV':3100,'ERV':3600,'RV':4800};r.parts.append(f'<rect x="80" y="{r.y}" width="1500" height="110" fill="#fafafa" stroke="#ccc" stroke-width="2"/>')
 for key,value in segments:
  x=80+1500*offsets[key]/maxvalue;w=1500*value/maxvalue
  r.parts.append(f'<rect class="data-segment" data-key="{key}" data-value="{value}" data-max="{maxvalue}" x="{x}" y="{r.y}" width="{w}" height="110" fill="{b.VOLUME_COLORS[key]}"/>');r.record['data'].append(dict(type='segment',label=key,value=value,max=maxvalue,width=w,offset=offsets[key],x=x))
 r.y+=175
b.stacked=aligned_stack

def lung_fev(r):
 r.cards(['課本示範數值']);y=r.y+120;Y=lambda v:y+1000-v*200;T=4;X=lambda t:250+200*t
 r.parts.append(f'<path d="M250 {y}V{Y(0)}H1100M450 {y}V{Y(0)}" fill="none" stroke="#444" stroke-width="5"/>')
 for v in [0,1,4,5]:text(r,str(v),210,Y(v)+20,align='end')
 text(r,'呼出容積（L）',650,y-45);text(r,'1',450,Y(0)+100);text(r,'時間（秒）',850,Y(0)+100)
 for title,fev,fvc,color,dash,offset in [('正常',4,5,'#333333','',22),('阻塞性',1,2.8,'#009E73','stroke-dasharray="20 14"',130),('限制性',2.5,2.8,'#CC79A7','stroke-dasharray="4 12"',-110)]:
  p=math.log(1-fev/fvc)/math.log(1-1/T);V=lambda t:fvc*(1-(1-t/T)**p);D=lambda t:fvc*p/T*(1-t/T)**(p-1) if t<T else 0
  d=f'M250 {Y(0)}'
  for j in range(80):
   a=j*.05;c=(j+1)*.05;dt=c-a
   d+=f'C{X(a)+200*dt/3:.8f} {Y(V(a))-200*D(a)*dt/3:.8f} {X(c)-200*dt/3:.8f} {Y(V(c))+200*D(c)*dt/3:.8f} {X(c):.8f} {Y(V(c)):.8f}'
  r.parts.append(f'<path class="fev-curve" data-series="{title}" data-one-x="450" data-fev="{fev}" data-fvc="{fvc}" d="{d}" fill="none" stroke="{color}" stroke-width="12" {dash}/><circle class="fev-point" data-value="{fev}" cx="450" cy="{Y(fev)}" r="13" fill="{color}"/>')
  # Shared plateaus get separate short end labels, not overlapping text.
  r.parts.append(f'<g data-label="{title}"><polyline class="lead halo" points="1050,{Y(fvc)} 1130,{Y(fvc)+offset-22}"/><polyline class="lead" points="1050,{Y(fvc)} 1130,{Y(fvc)+offset-22}"/></g>');text(r,title,1180,Y(fvc)+offset,align='start')
  r.record['data'].append(dict(type='FEV curve',series=title,atOneSecond=fev,plateau=fvc,atOneSecondXY=[450,Y(fev)],plateauXY=[1050,Y(fvc)],scale=200,zeroY=Y(0),model='FVC*(1-(1-t/T)^p)',T=T,p=p,monotonic=True,concave=True))
 r.y=Y(0)+210
 table_y=r.y;rows=[['型態','FEV₁','FVC','FEV₁/FVC'],['正常','4 L','5 L','4/5＝0.8'],['阻塞性','1 L','2.8 L','1/2.8≈0.36'],['限制性','2.5 L','2.8 L','2.5/2.8≈0.89']];red=['FEV₁','FVC','4/5＝0.8','1/2.8≈0.36','2.5/2.8≈0.89']
 markup='<table xmlns="http://www.w3.org/1999/xhtml" style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:calc(66px * var(--font-scale,1));line-height:1.4"><colgroup><col style="width:21%"/><col style="width:20%"/><col style="width:20%"/><col style="width:39%"/></colgroup>'
 for j,row in enumerate(rows):
  markup+='<tr>'
  for i,item in enumerate(row):
   markup+='<td style="border:3px solid #ccc;padding:25px 15px;background:'+('#f5f7f8' if not j else 'white')+'"><span data-html-label="'+html.escape(item)+'" class="'+('focus' if item in red else '')+'" style="white-space:nowrap">'+html.escape(item)+'</span></td>'
   r.record['labels'].append(dict(label=item,anchor=None,renderAs='html',textPosition=[50+i*350,table_y+j*160],lines=[item]))
  markup+='</tr>'
 markup+='</table>';r.parts.append(f'<foreignObject x="50" y="{table_y}" width="1600" height="760">{markup}</foreignObject>');r.record['red']+=red;r.y+=820
 r.caption(r.content['nodes'][5]['concept'])
CUSTOM={('gas-exchange','node-04'):gas_factors,('respiratory-control','node-05'):control_ph,('respiratory-control','node-06'):control_exercise,('breathing-mechanics','node-04'):compliance,('lung-function','node-01'):lung_volumes,('lung-function','node-06'):lung_fev}

ORIGINAL_OXYGEN=b.oxygen_plot
def repaired_oxygen(r,name,*args,**kwargs):
 if name!='overview':return
 ORIGINAL_OXYGEN(r,name,*args,**kwargs)
 p=OUT/f'{r.slug}-overview.svg';svg=p.read_text()
 for i in [2,3]:
  marker=f'<g class="oxygen-panel oxygen-state-{i}">';annotation='<g data-label="正常"><polyline class="lead" points="420,87 443,110" fill="none" stroke="#777" stroke-width="1.5"/><text class="label" aria-label="正常" x="430" y="141" text-anchor="middle">正常</text></g>'
  svg=svg.replace(marker,marker+annotation);r.records[f'overview-state-{i}']['labels'].append(dict(label='正常',anchor=None,renderAs='curve-end',textPosition=[430,141],lines=['正常']))
 svg=re.sub(r'(<span[^>]*data-html-label="([^"]+)"[^>]*>)([^<]*)(</span>)',lambda m:m[1]+nowrap(html.unescape(m[3]))+m[4],svg)
 p.write_text(svg)
b.oxygen_plot=repaired_oxygen

def main(slug):
 r=RepairRenderer(slug);getattr(b,slug.replace('-','_'))(r);r.manifest();print('Repaired',slug,len(AFFECTED[slug]),'slots; unaffected records preserved.')
if __name__=='__main__':
 import sys
 main(sys.argv[1])
