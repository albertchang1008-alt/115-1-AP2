"""Stage two renderer: approved PNG plates and exact native data layers.
Invoked through respiratory-labels.py; does not touch content or other slugs.
"""
from pathlib import Path
from PIL import Image
import base64, html, json, re
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'materials-src/figures'
W=1700; FS=66; FOCUS_STYLE=None; INK='#17212b'; O2='#D55E00'; CO2='#0072B2'

def wrap(text,limit=5):
 # Keep Latin formula tokens together, and punctuation off the next line's head.
 tokens=re.findall(r'[A-Za-z0-9₂₃₁⁺⁻²/＝≈.％%↑↓]+|.',text)
 lines=[];line=''
 for t in tokens:
  if len(line)+len(t)>limit and line and t not in '，。、；：）)]%％':lines.append(line);line=''
  line+=t
 if line:lines.append(line)
 return lines

def label(name,x,y,side):return dict(label=name,anchor=[x,y],side=side)
def arrow(a,b,color=INK,width=12,signal=False,end='arrow',route=None):return dict(start=a,end=b,color=color,width=width,signal=signal,terminal=end,route=route)
class Renderer:
 def __init__(self,slug):
  self.assets={};self.slug=slug;self.raster=OUT/'raster'/slug;self.records={};self.content=json.loads((ROOT/'materials-src'/slug/'content.json').read_text());self.review=json.loads((OUT/'raster/_review.json').read_text())['items']
 def begin(self,name):
  self.name=name;self.uid=self.slug+'-'+name;self.y=45;self.parts=[];self.record=dict(state=name.split('overview-')[-1] if name.startswith('overview-') else None,viewBox=None,fontSize=FS,red=[],labels=[],plates=[],arrows=[],notes=[],data=[])
 def text(self,name,x,y,focus=False,lines=None,align='middle',kind='label'):
  ls=lines or [name];cl='focus' if focus else ''
  self.parts.append(f'<text class="label {cl}" data-label="{html.escape(name)}" aria-label="{html.escape(name)}" x="{x}" y="{y}" text-anchor="{align}">'+''.join(f'<tspan x="{x}" dy="{0 if i==0 else FS*1.18}">{html.escape(s)}</tspan>' for i,s in enumerate(ls))+'</text>')
  if focus and name not in self.record['red']:self.record['red'].append(name)
  return dict(label=name,anchor=None,textPosition=[x,y],align=align,lines=ls,renderAs=kind)
 def cards(self,items,focus=(),columns=1):
  # Native HTML cards inside SVG keep readable, strict CJK line breaking.
  for item in items:
   lines=max(1,(len(item)+21)//22);height=lines*88+65
   swatch=''
   if self.slug=='lung-function':
    for key in VOLUME_COLORS:
     if (item.startswith(('潮氣','吸氣儲備','呼氣儲備','肺餘')) and key in item) or item.startswith(key+' '):swatch=f'border-left:35px solid {VOLUME_COLORS[key]};'
    if self.name=='node-06' and item in ['正常','阻塞性','限制性']:swatch={'正常':'border-left:35px solid #444;','阻塞性':'border-left:35px dashed #0072B2;','限制性':'border-left:35px dotted #D55E00;'}[item]
   self.parts.append(f'<foreignObject x="50" y="{self.y}" width="1600" height="{height}"><div xmlns="http://www.w3.org/1999/xhtml" class="data-card" style="{swatch}"><span data-html-label="{html.escape(item)}" class="{"focus" if item in focus else ""}">{html.escape(item)}</span></div></foreignObject>')
   self.record['labels'].append(dict(label=item,anchor=None,renderAs='html',textPosition=[50,self.y],lines=[item]));self.y+=height+25
   if item in focus and item not in self.record['red']:self.record['red'].append(item)
 def caption(self,text,steps=False):
  self.record['notes'].append(text)
  if steps:
   fragments=re.findall(r'[^；]+；?',text)
   assert ''.join(fragments)==text
   self.record['captionSteps']=[dict(step=i+1,text=t) for i,t in enumerate(fragments)]
   self.cards([f'{chr(0x2460+i)} {t}' for i,t in enumerate(fragments)])
  else:self.cards([text])
 def plate(self,num,labels,red=(),crop=None,arrows=(),headings=(),canvas=None,routes=None):
  source=self.raster/'incoming'/f'IMG-{self.slug}-{num:02}.png';rv=self.review[source.stem];assert rv['verdict']=='pass'
  im=Image.open(source).convert('RGB');iw,ih=im.size;webp=self.raster/f'plate-{num:02}.webp'
  im.resize((1200,round(1200*ih/iw)),Image.Resampling.LANCZOS).save(webp,'WEBP',quality=68,method=6)
  data=base64.b64encode(webp.read_bytes()).decode();cx,cy,cw,ch=crop or (0,0,iw,ih);s=850/(canvas[0] if canvas else cw)
  for h in headings:self.record['labels'].append(self.text(h,850,self.y+FS,h in red,wrap(h,21)));self.y+=FS*1.18*len(wrap(h,21))+40
  top=self.y+30;dx=425+((canvas[0]-cw)*s/2 if canvas else 0);dy=top
  if canvas:dy+=(canvas[1]-ch)*s/2
  imageheight=(canvas[1] if canvas else ch)*s
  laid=[];bottom=top+imageheight
  for side in ['left','right']:
   previous=top-FS
   for l in sorted((l for l in labels if l['side']==side),key=lambda l:l['anchor'][1]):
    ls=l.get('lines') or wrap(l['label']);target=dy+(l['anchor'][1]-cy)*s+FS*.3;ty=max(top+FS,target,previous+FS*1.18+45);previous=ty+(len(ls)-1)*FS*1.18;bottom=max(bottom,previous+45)
    laid.append((l,ls,ty))
  asset=f'{self.slug}-plate-{num:02}'
  image=f'<image id="{asset}" href="data:image/webp;base64,{data}" width="{iw}" height="{ih}" preserveAspectRatio="xMidYMid meet"/>'
  self.assets[asset]=image
  image=f'<use href="#{asset}"/>' if self.slug=='breathing-mechanics' else image.replace(f' id="{asset}"','')
  self.parts.append(f'<svg x="{dx}" y="{dy}" width="{cw*s}" height="{ch*s}" viewBox="{cx} {cy} {cw} {ch}" overflow="hidden">{image}</svg>')
  for l,ls,ty in laid:
   ax=dx+(l['anchor'][0]-cx)*s;ay=dy+(l['anchor'][1]-cy)*s;tx=380 if l['side']=='left' else 1320;align='end' if l['side']=='left' else 'start';ex=tx+22 if align=='end' else tx-22
   escaped=html.escape(l['label']);self.parts.append(f'<g data-label="{escaped}"><polyline class="lead halo" points="{ex},{ty-FS*.34} {ax},{ay}"/><polyline class="lead" points="{ex},{ty-FS*.34} {ax},{ay}"/><circle class="dot" data-anchor="{len(self.record["labels"])}" cx="{ax}" cy="{ay}" r="6"/></g>')
   rec=self.text(l['label'],tx,ty,l['label'] in red,ls,align);rec.update(anchor=l['anchor'],source=str(source.relative_to(ROOT)),plate=len(self.record['plates']),svgAnchor=[ax,ay]);self.record['labels'].append(rec)
  for i,a in enumerate(arrows):
   x1=dx+(a['start'][0]-cx)*s;y1=dy+(a['start'][1]-cy)*s;x2=dx+(a['end'][0]-cx)*s;y2=dy+(a['end'][1]-cy)*s;key=f'{self.uid}-arrow-{len(self.record["arrows"])}';color=a['color'];width=a['width'];dash='stroke-dasharray="15 12"' if a['signal'] else ''
   terminal=f'<path d="M0 0L4 2L0 4Z" fill="{color}"/>' if a['terminal']=='arrow' else f'<path d="M3 0V4" stroke="{color}" stroke-width="1"/>'
   opacity=f'opacity="{routes.get(a["route"],1)}"' if routes and a.get('route') else ''
   self.parts.append(f'<g class="route-{a.get("route")}" {opacity}><defs><marker id="{key}" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">{terminal}</marker></defs><path d="M{x1},{y1}L{x2},{y2}" fill="none" stroke="white" stroke-width="{width+8}"/><path class="flow-arrow" d="M{x1},{y1}L{x2},{y2}" fill="none" stroke="{color}" stroke-width="{width}" {dash} marker-end="url(#{key})"/></g>')
   if color in [O2,CO2] and not a.get("route") and not a.get("step"):
    gas='O₂' if color==O2 else 'CO₂'
    self.record['labels'].append(self.text(gas,(x1+x2)/2-85,(y1+y2)/2-45))
   if a.get('step'):
    step=a['step'];sx,sy=a.get('stepPosition',a['start']);sx=dx+(sx-cx)*s;sy=dy+(sy-cy)*s
    self.parts.append(f'<circle class="step-number" cx="{sx}" cy="{sy}" r="46" fill="white" stroke="#17212b" stroke-width="3"/>')
    self.record['labels'].append(self.text(chr(0x2460+step-1),sx,sy+FS*.34,lines=[str(step)]))
   self.record['arrows'].append(dict(a,source=str(source.relative_to(ROOT)),svgStart=[x1,y1],svgEnd=[x2,y2]))
  self.record['plates'].append(dict(source=str(source.relative_to(ROOT)),sourceSize=[iw,ih],crop=list(crop) if crop else None,imageTransform=dict(x=dx,y=dy,scale=s),reviewNote=rv['note'],canvas=canvas))
  self.y=bottom+80
 def bars(self,rows,maxvalue,unit,colors=None):
  colors=colors or [O2,CO2,'#999999']
  # Common linear scale, exact zero widths. No pixel minimum for small shares.
  self.record['labels'].append(self.text(unit,850,self.y+FS));self.y+=125
  for i,(name,value,focus) in enumerate(rows):
   self.record['labels'].append(self.text(name,70,self.y+FS,focus,wrap(name,22),align='start'));self.y+=FS*1.18*len(wrap(name,22))+30
   self.parts.append(f'<rect x="80" y="{self.y}" width="1500" height="95" fill="#f1f3f5"/><rect class="data-bar" data-value="{value}" data-max="{maxvalue}" x="80" y="{self.y}" width="{1500*value/maxvalue}" height="95" fill="{colors[i%len(colors)]}"/>')
   self.record['data'].append(dict(type='bar',label=name,value=value,max=maxvalue,width=1500*value/maxvalue,unit=unit));self.y+=160
 def finish(self):
  h=round(self.y+30);self.record['viewBox']=[W,h];self.records[self.name]=self.record
  css=f'#{self.uid} .label{{font-size:calc({FS}px * var(--font-scale,1));fill:{INK};stroke:white;stroke-width:8;paint-order:stroke;stroke-linejoin:round}}#{self.uid} .focus{{fill:#b4233a;color:#b4233a;font-weight:700}}#{self.uid} .lead{{fill:none;stroke:#444;stroke-width:3}}#{self.uid} .halo{{stroke:white;stroke-width:10}}#{self.uid} .dot{{fill:#444;stroke:white;stroke-width:3}}#{self.uid} .data-card{{font-size:calc({FS}px * var(--font-scale,1));line-height:1.3;color:{INK};background:#f5f7f8;padding:20px 30px;border-radius:20px;line-break:strict;word-break:normal;overflow-wrap:normal;hanging-punctuation:allow-end}}'
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" id="{self.uid}" viewBox="0 0 {W} {h}" role="img" font-family="PingFang TC,Noto Sans CJK TC,Noto Sans TC,sans-serif" aria-label="{html.escape(self.content["title"])}"><style>{css}</style><rect width="100%" height="100%" fill="white"/>'+''.join(self.parts)+'</svg>'
  (OUT/f'{self.slug}-{self.name}.svg').write_text(svg);return svg
 def overview(self,svgs):
  h=max(self.records['overview-state-'+str(i)]['viewBox'][1] for i in [1,2,3]);parts=[]
  for i,svg in enumerate(svgs,1):parts.append(f'<g class="v2-panel v2-state-{i}" id="{self.slug}-overview-state-{i}">'+svg[svg.index('>')+1:svg.rfind('</svg>')]+'</g>')
  css='.v2-panel{display:none}.v2-state-1{display:block}'+''.join(f'.state-figure[data-state="state-{i}"] .v2-panel{{display:none}}.state-figure[data-state="state-{i}"] .v2-state-{i}{{display:block}}' for i in [1,2,3])
  (OUT/f'{self.slug}-overview.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}" font-family="PingFang TC,Noto Sans CJK TC,Noto Sans TC,sans-serif"><style>{css}</style>'+''.join(parts)+'</svg>')
 def manifest(self):
  if self.slug=='breathing-mechanics':
   p=OUT/f'{self.slug}-overview.svg';svg=p.read_text();pos=svg.index('>')+1;svg=svg[:pos]+'<defs>'+''.join(self.assets.values())+'</defs>'+svg[pos:];p.write_text(svg)
  (self.raster/'labels.json').write_text(json.dumps(dict(slug=self.slug,focusStyle=FOCUS_STYLE,anchorCoordinates='original PNG pixels',figures=self.records),ensure_ascii=False,indent=2)+'\n')

def gas_exchange(r):
 svgs=[]
 for i,focus in enumerate([['膜薄'],['膜變厚','擴散減少'],['交換面積減少','擴散減少']],1):
  r.begin('overview-state-'+str(i));r.plate(i,[label('肺泡',530,410,'left'),label('呼吸膜',887,610,'left'),label('肺微血管',1050,690,'right')],headings=focus,red=focus,arrows=[arrow([675,500],[1080,770],O2,14 if i==1 else 7),arrow([1050,490],[705,320],CO2,14 if i==1 else 7)])
  r.cards(['O₂','CO₂']);r.caption(r.content['lab']['states'][i-1]['explain']);svgs.append(r.finish())
 r.overview(svgs)
 r.begin('node-01');r.plate(4,[label('肺泡',390,365,'left'),label('肺微血管',922,340,'right')],crop=[0,0,1122,700],headings=['外呼吸'],red=['外呼吸'],arrows=[arrow([600,380],[910,460],O2),arrow([920,245],[645,245],CO2)])
 r.plate(4,[label('組織細胞',480,1010,'left'),label('組織微血管',925,1070,'right')],crop=[0,700,1122,702],headings=['內呼吸'],red=['內呼吸'],arrows=[arrow([930,1080],[610,1110],O2),arrow([580,870],[920,870],CO2)])
 r.caption(r.content['nodes'][0]['concept']);r.finish()
 r.begin('node-02');r.plate(5,[label('混合氣體',495,235,'left'),label('高分壓',330,660,'left'),label('低分壓',870,660,'right'),label('高分壓',325,1160,'left'),label('低分壓',870,1160,'right')],arrows=[arrow([290,745],[905,745],O2),arrow([290,1260],[905,1260],CO2)])
 r.cards(['總壓','O₂分壓','CO₂分壓','各自的分壓差'],focus=['O₂分壓','CO₂分壓','各自的分壓差']);r.caption(r.content['nodes'][1]['concept']);r.finish()
 r.begin('node-03');r.plate(6,[label('肺泡PO₂約100 mmHg',650,455,'left'),label('肺泡PCO₂約40 mmHg',820,570,'right'),label('肺動脈',183,332,'left'),label('入肺血PO₂約40 mmHg',231,727,'left'),label('入肺血PCO₂約45 mmHg',387,917,'left'),label('肺靜脈',1085,370,'right')],red=['肺泡PO₂約100 mmHg','入肺血PO₂約40 mmHg','入肺血PCO₂約45 mmHg','肺泡PCO₂約40 mmHg'],arrows=[arrow([710,760],[715,1020],O2),arrow([490,990],[490,730],CO2)])
 r.cards(['O₂','CO₂','離肺血PO₂約95 mmHg']);r.caption(r.content['nodes'][2]['concept']);r.finish()
 r.begin('node-06');r.plate(7,[label('局部低氧',480,360,'left'),label('肺小動脈收縮',857,420,'right'),label('血流減少',698,620,'right'),label('通氣良好',480,1050,'left')],red=['局部低氧','肺小動脈收縮'],arrows=[arrow([1060,670],[1060,1020],INK,12)]);r.cards(['血流轉向'],focus=['血流轉向']);r.caption(r.content['nodes'][5]['concept']);r.finish()

 # Data layers after all anatomy layers.
 r.begin('node-04');r.cards(['膜面積↑','分壓差↑','溶解度↑','擴散↑','膜厚度↑','分子量平方根↑','擴散↓','CO₂溶解度約為O₂的20倍'],focus=['膜面積↑','膜厚度↑','擴散↑','擴散↓']);r.caption(r.content['nodes'][3]['concept']);r.finish()
 r.begin('node-05');r.cards(['站立','肺尖0.24/0.07≈3.4'],focus=['肺尖0.24/0.07≈3.4']);r.bars([('肺尖 通氣V 0.24',.24,False),('肺尖 血流Q 0.07',.07,False)],1.29,'L/分');r.cards(['肺底0.82/1.29≈0.63'],focus=['肺底0.82/1.29≈0.63']);r.bars([('肺底 通氣V 0.82',.82,False),('肺底 血流Q 1.29',1.29,False)],1.29,'L/分');r.caption(r.content['nodes'][4]['concept']);r.finish()

def main(slug,focus_style):
 global FOCUS_STYLE
 FOCUS_STYLE=focus_style
 assert FOCUS_STYLE=='red'
 r=Renderer(slug)
 globals()[slug.replace('-','_')](r)
 r.manifest();print(f'Generated {slug}: three states and six nodes.')

def respiratory_control(r):
 labels=[label('橋腦',534,147,'left'),label('延髓',536,244,'left'),label('中樞化學受器',601,253,'right'),label('腦脊髓液H⁺',607,218,'right'),label('周邊化學受器',639,360,'right'),label('迷走神經',657,552,'right'),label('肺牽張受器',749,941,'right')]
 routes=[arrow([623,162],[582,209],CO2,9,route='central'),arrow([582,225],[555,258],INK,6,True,route='central'),arrow([747,939],[660,820],INK,6,True,route='stretch'),arrow([642,595],[557,281],INK,6,True,route='stretch'),arrow([563,271],[599,446],INK,6,True,end='inhibit',route='stretch'),arrow([638,357],[578,278],INK,6,True,route='peripheral'),arrow([626,685],[579,295],INK,6,True,route='peripheral')]
 svgs=[]
 for i,focus in enumerate([['CO₂','腦脊髓液H⁺','中樞化學受器'],['肺牽張受器','迷走神經','抑制吸氣'],['周邊化學受器','換氣增加']],1):
  r.begin('overview-state-'+str(i));r.plate(1,labels,red=focus,arrows=routes,routes={k:1 if k==['central','stretch','peripheral'][i-1] else .13 for k in ['central','stretch','peripheral']})
  # All structure labels stay visible; signal output is state specific.
  r.cards(['血腦障壁','CO₂','抑制吸氣' if i==2 else '換氣增加'],focus=focus);r.caption(r.content['lab']['states'][i-1]['explain']);svgs.append(r.finish())
 r.overview(svgs)
 r.begin('node-01');r.plate(2,[label('橋腦',684,247,'left'),label('延髓',700,381,'left'),label('化學受器訊息',405,599,'left'),label('牽張受器訊息',874,1080,'right')],red=['橋腦','延髓','呼吸中樞'],headings=['呼吸中樞'],arrows=[arrow([415,600],[633,287],INK,6,True),arrow([905,1075],[690,431],INK,6,True)])
 r.cards(['呼吸深度','呼吸頻率']);r.caption(r.content['nodes'][0]['concept']);r.finish()
 r.begin('node-02');r.plate(3,[label('血液',240,170,'left'),label('血腦障壁',352,497,'left'),label('CO₂',488,345,'right'),label('腦脊髓液H⁺增加',676,839,'left'),label('中樞化學受器',883,960,'right')],red=['CO₂','腦脊髓液H⁺增加','中樞化學受器'],arrows=[arrow([258,467],[494,467],CO2,10),arrow([670,800],[807,877],INK,6,True),arrow([245,720],[349,720],INK,6,True,end='inhibit')])
 r.cards(['血中H⁺不易直接穿越','促進呼吸']);r.caption(r.content['nodes'][1]['concept']);r.finish()
 r.begin('node-03');r.plate(4,[label('頸動脈體',571,201,'left'),label('主動脈體',696,749,'right')],red=['頸動脈體','主動脈體'],headings=['周邊化學受器']);r.cards(['血中H⁺','CO₂','低氧','PO₂低於約60 mmHg'],focus=['PO₂低於約60 mmHg']);r.caption(r.content['nodes'][2]['concept']);r.finish()
 r.begin('node-04');r.plate(5,[label('橋腦',358,142,'left'),label('延髓',242,223,'left'),label('迷走神經',343,534,'left'),label('肺牽張受器',490,947,'left')],red=['迷走神經','肺牽張受器'],headings=['赫鮑二氏反射'],arrows=[arrow([439,936],[330,609],INK,6,True),arrow([333,595],[315,247],INK,6,True)])
 r.cards(['抑制吸氣','避免肺過度擴張'],focus=['抑制吸氣']);r.caption(r.content['nodes'][3]['concept']);r.finish()
 # Data layers: formula cards and independent exercise/high-altitude chains.
 r.begin('node-05');r.cards(['pH 7.35–7.45','pH＝pKa＋log（HCO₃⁻/H₂CO₃）','6.1＋log（26/1.3）≈7.4','PCO₂＞45 mmHg','呼吸性酸中毒方向','腎臟排酸留HCO₃⁻','PCO₂＜35 mmHg','呼吸性鹼中毒方向'],focus=['PCO₂＞45 mmHg','呼吸性酸中毒方向','PCO₂＜35 mmHg','呼吸性鹼中毒方向']);r.caption(r.content['nodes'][4]['concept']);r.finish()
 r.begin('node-06');r.cards(['運動']);r.cards(['潮氣量增加','呼吸頻率增加'],focus=['潮氣量增加','呼吸頻率增加']);r.cards(['體溫升高','初到高山']);chain(r,['大氣壓降低','吸入氧分壓下降','周邊化學受器','換氣增加','CO₂排出增加','pH上升'],['吸入氧分壓下降','周邊化學受器','換氣增加']);r.caption(r.content['nodes'][5]['concept']);r.finish()

def chain(r,items,focus=()):
 for i,item in enumerate(items):
  r.cards([item],focus=focus)
  if i<len(items)-1:
   r.parts.append(f'<path d="M850 {r.y}v65m-18 -18l18 18 18 -18" fill="none" stroke="#444" stroke-width="5" stroke-dasharray="10 8"/>');r.y+=100

def breathing_mechanics(r):
 # State-specific original pixels, padded to one 1198 x 1402 source canvas.
 anchors=[dict(lung=[360,620],pleura=[150,750],diaphragm=[550,895],muscle=[1031,655],air=[1040,280]),dict(lung=[348,590],pleura=[135,720],diaphragm=[555,920],muscle=[1109,600],air=[1090,250]),dict(lung=[347,532],pleura=[179,650],diaphragm=[563,840],muscle=[1110,600],air=[1100,200])]
 def panel(i,headings=False):
  a=anchors[i-1];ls=[label('橫膈',*a['diaphragm'],'right'),label('外肋間肌',*a['muscle'],'right'),label('大氣壓',*a['air'],'right'),label('肺內壓',*a['lung'],'left'),label('胸內壓',*a['pleura'],'left')]
  values=[['760 mmHg','760 mmHg','758 mmHg'],['760 mmHg','758 mmHg','754 mmHg'],['760 mmHg','高於大氣壓','通常較低']][i-1]
  for l in ls:
   if l['label'] in ['大氣壓','肺內壓','胸內壓']:l['lines']=wrap(l['label'])+wrap(values[['大氣壓','肺內壓','胸內壓'].index(l['label'])],5)
  focus=[['無氣流'],['橫膈','外肋間肌','肺內壓','胸內壓','空氣流入'],['空氣流出']][i-1]
  arr=[] if i==1 else ([arrow([623,90],[623,357],INK),arrow([570,934],[570,1090],INK,8)] if i==2 else [arrow([624,355],[624,87],INK),arrow([237,453],[362,492],INK,8),arrow([972,453],[835,492],INK,8)])
  r.plate(i,ls,red=focus,arrows=arr,headings=[r.content['lab']['states'][i-1]['label']] if headings else (),canvas=[1198,1402])
  r.cards([['無氣流','空氣流入','空氣流出'][i-1]],focus=focus)
  r.caption(r.content['lab']['states'][i-1]['explain'])
 svgs=[]
 for i in [1,2,3]:r.begin('overview-state-'+str(i));panel(i);svgs.append(r.finish())
 r.overview(svgs)
 r.begin('node-01')
 # Four original raster panels; each keeps its original crop and its own labels.
 for i,title in enumerate(['平靜吸氣','平靜呼氣','用力吸氣','用力呼氣']):
  cy,ch=[(0,394),(395,381),(776,438),(1214,458)][i]
  ls=[label('橫膈',*[ [462,286],[462,642],[464,1110],[466,1423] ][i],'right')]
  if i in [0,3]:ls.append(label('肋間肌',*[ [661,161],[619,1370] ][i==3],'left'))
  if i==2:ls.append(label('胸鎖乳突肌',542,829,'left'))
  if i==3:ls.append(label('腹直肌',445,1540,'left'))
  r.plate(4,ls,red=['橫膈'] if i==0 else [],crop=[0,cy,941,ch],headings=[title])
  if i==0:r.cards(['外肋間肌'],focus=['外肋間肌'])
  elif i==1:r.cards(['彈性回縮'],focus=['彈性回縮'])
  elif i==3:r.cards(['內肋間肌'])
 r.caption(r.content['nodes'][0]['concept']);r.finish()
 r.begin('node-02');a=anchors[0];r.plate(1,[label('大氣壓',*a['air'],'right'),label('肺內壓（肺泡壓）',*a['lung'],'left'),label('胸內壓（胸膜內壓）',*a['pleura'],'left')],red=['大氣壓','肺內壓（肺泡壓）','胸內壓（胸膜內壓）']);r.cards(['肺間壓＝肺內壓－胸內壓','相對大氣壓較低'],focus=['肺間壓＝肺內壓－胸內壓']);r.caption(r.content['nodes'][1]['concept']);r.finish()
 r.begin('node-03')
 for i in [1,2,3]:panel(i,True)
 r.cards(['肺內壓760→758 mmHg','胸內壓758→754 mmHg','肺內壓低於大氣壓','肺內壓高於大氣壓'],focus=['肺內壓760→758 mmHg','胸內壓758→754 mmHg']);r.caption(r.content['nodes'][2]['concept']);r.finish()
 r.begin('node-05')
 for i,title in enumerate(['正常','肺氣腫','纖維化']):
  cx=[0,591,1182][i];r.plate(5,[],crop=[cx,0,591 if i<2 else 592,887],headings=[title])
  if i==1:r.cards(['順應性增加','回縮變差','氣體滯留','肺餘容積增加'],focus=['順應性增加','回縮變差'])
  if i==2:r.cards(['順應性降低'],focus=['順應性降低'])
 r.caption(r.content['nodes'][4]['concept']);r.finish()
 r.begin('node-06');r.plate(1,[label('胸膜腔密閉',*anchors[0]['pleura'],'left')],red=['胸膜腔密閉']);r.cards(['胸內壓低於大氣壓']);chain(r,['胸內壓更負','肺間壓增加','肺容積增加'],['肺間壓增加','肺容積增加']);r.caption(r.content['nodes'][5]['concept']);r.finish()
 # Native pressure-volume concept plot (no invented numerical ticks).
 r.begin('node-04');r.cards(['C＝ΔV/ΔP'],focus=['C＝ΔV/ΔP']);y=r.y
 r.parts.append(f'<path d="M280 {y+80}V{y+920}H1500" fill="none" stroke="#444" stroke-width="5"/><path class="compliance-high" d="M280 {y+920}Q690 {y+250} 1390 {y+150}" fill="none" stroke="{O2}" stroke-width="14"/><path class="compliance-low" d="M280 {y+920}Q760 {y+755} 1390 {y+600}" fill="none" stroke="{CO2}" stroke-width="14"/><path d="M1030 {y+140}V{y+920}" stroke="#888" stroke-width="4" stroke-dasharray="15 12"/>')
 r.record['labels'].append(r.text('肺容積改變量ΔV',850,y+FS));r.record['labels'].append(r.text('肺間壓改變量ΔP',850,y+1040));r.y=y+1140;r.cards(['順應性較大','順應性較小'],focus=['順應性較大']);r.caption(r.content['nodes'][3]['concept']);r.record['data'].append(dict(type='qualitative pressure-volume',sameDeltaP=True,numericTicks=False));r.finish()

def oxygen_plot(r,name,states=(1,),overview=False):
 import math
 width=480;fs=21;uid=r.slug+'-'+name;parts=[];records={}
 def t(label,x,y,focus=False,anchor='middle'):
  return f'<text class="label {"focus" if focus else ""}" aria-label="{html.escape(label)}" x="{x}" y="{y}" text-anchor="{anchor}">{html.escape(label)}</text>'
 axes='<path d="M60 63V350H428" fill="none" stroke="#444" stroke-width="2"/>'+t('血紅素氧飽和度（%）',240,32)+t('PO₂（mmHg）',300,403)+t('0',40,355)+t('100',33,88)+t('0',60,381)+t('40',204,381)+t('100',420,381)
 def curve(k,color,dash=False):
  pts=[]
  for p in range(101):
   saturation=100*p**2.7/(k**2.7+p**2.7) if p else 0;pts.append(f'{60+3.6*p:.4f},{350-2.7*saturation:.4f}')
  return f'<path data-oxygen-k="{k}" d="M'+ 'L'.join(pts)+f'" fill="none" stroke="{color}" stroke-width="3" '+('stroke-dasharray="7 5"' if dash else '')+'/>'
 def record(red,labels,notes,h):return dict(state=None,viewBox=[480,h],fontSize=fs,red=red,labels=[dict(label=l,anchor=None,renderAs='data') for l in labels],plates=[],notes=notes,data=[dict(type='oxygen-curve',k=[26,31,21],x='60+3.6*PO2',y='350-2.7*S')])
 def cards(items,red,start):
  out='';y=start
  for item in items:
   h=math.ceil(len(item)/19)*30+35
   swatch={'正常':'border-left:9px dashed #999;','右移':'border-left:9px solid #D55E00;','左移':'border-left:9px solid #666;'}.get(item,'')
   out+=f'<foreignObject x="14" y="{y}" width="452" height="{h}"><div xmlns="http://www.w3.org/1999/xhtml" class="oxygen-card" style="{swatch}"><span class="{"focus" if item in red else ""}" data-html-label="{html.escape(item)}">{html.escape(item)}</span></div></foreignObject>';y+=h+12
  return out,y
 axlabels=['血紅素氧飽和度（%）','PO₂（mmHg）','0','100','40']
 if overview:
  maxh=0
  for i in [1,2,3]:
   k=[26,31,21][i-1];labelname=['正常','右移','左移'][i-1];red=[labelname]+(['PO₂ 40 mmHg','飽和度約75%'] if i==1 else []);notes=[r.content['lab']['states'][i-1]['explain']]
   body=(curve(26,'#777',True) if i!=1 else '')+curve(k,O2)+t(labelname,370,61,True)
   items=(['PO₂ 40 mmHg','飽和度約75%'] if i==1 else [])+notes;card,h=cards(items,red,428);body+=card
   parts.append(f'<g class="oxygen-panel oxygen-state-{i}">{body}</g>');rec=record(red,axlabels+[labelname]+items,notes,h);rec['state']='state-'+str(i)
   for l in rec['labels']:
    if l['label'] in items:l['renderAs']='html'
   r.records['overview-state-'+str(i)]=rec;maxh=max(maxh,h)
  css='.oxygen-panel{display:none}.oxygen-state-1{display:block}'+''.join(f'.state-figure[data-state="state-{i}"] .oxygen-panel{{display:none}}.state-figure[data-state="state-{i}"] .oxygen-state-{i}{{display:block}}' for i in [1,2,3])
  parts.insert(0,f'<style>{css}</style>');parts.append('<circle class="oxygen-probe" cx="204" cy="148" r="6" fill="#17212b" stroke="white" stroke-width="2"/>');h=maxh
 elif name=='node-03':
  red=['PO₂ 40 mmHg','飽和度約75%'];notes=[r.content['nodes'][2]['concept']];parts=[curve(26,O2),'<path d="M204 350V145H60" fill="none" stroke="#888" stroke-width="1.5" stroke-dasharray="5 5"/>'];items=red+notes;card,h=cards(items,red,428);parts.append(card);r.records[name]=record(red,axlabels+items,notes,h)
 else:
  red=['右移','親和力降低','利於釋氧','左移','親和力增加'];notes=[r.content['nodes'][3]['concept']];parts=[curve(21,'#666'),curve(26,'#999',True),curve(31,O2),'<path d="M204 63V350" fill="none" stroke="#888" stroke-width="1.5" stroke-dasharray="5 5"/>']
  items=['正常','右移','H⁺增加（pH降低）','CO₂增加','溫度升高','2,3-DPG增加','親和力降低','利於釋氧','波爾效應','左移','相反條件','親和力增加']+notes;card,h=cards(items,red,428);parts.append(card);r.records[name]=record(red,axlabels+items,notes,h)
 if not overview:
  for l in r.records[name]['labels']:
   if l['label'] in items:l['renderAs']='html'
 css=f'#{uid} .label{{font-size:calc(21px * var(--font-scale,1));fill:#17212b;stroke:white;stroke-width:2;paint-order:stroke}}#{uid} .oxygen-card{{font-size:calc(21px * var(--font-scale,1));line-height:1.4;color:#17212b;background:#f5f7f8;padding:10px;line-break:strict;word-break:normal}}#{uid} .focus{{fill:#b4233a;color:#b4233a;font-weight:700}}'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" viewBox="0 0 480 {h}" font-family="PingFang TC,Noto Sans CJK TC,Noto Sans TC,sans-serif"><style>{css}</style><rect width="100%" height="100%" fill="white"/>'+axes+''.join(parts)+'</svg>'; (OUT/f'{r.slug}-{name}.svg').write_text(svg)

def o2_co2_transport(r):
 r.begin('node-02');r.plate(1,[label('四條肽鏈',242,356,'left'),label('四個血基質',312,502,'left'),label('二價鐵Fe²⁺',817,500,'right'),label('四分子O₂',833,852,'right')],red=['四個血基質','二價鐵Fe²⁺','四分子O₂'],headings=['血紅素']);r.cards(['可逆結合']);r.caption(r.content['nodes'][1]['concept']);r.finish()
 r.begin('node-06');r.plate(2,[label('血漿',1180,272,'right'),label('紅血球',533,713,'left'),label('碳酸酐酶',776,524,'left'),label('H⁺',806,669,'left'),label('血紅素緩衝',706,795,'left'),label('HCO₃⁻',1148,606,'right'),label('Cl⁻',1130,664,'right')],red=['碳酸酐酶','HCO₃⁻','Cl⁻','氯轉移'],headings=['氯轉移'],arrows=[dict(arrow([401,378],[651,445],CO2),step=1,stepPosition=[401,378]),dict(arrow([818,684],[735,765],INK,10),step=2,stepPosition=[874,750]),dict(arrow([983,582],[1181,582],INK,10),step=3,stepPosition=[983,582]),arrow([1197,692],[990,692],INK,10)])
 r.cards(['CO₂＋H₂O','H₂CO₃','H⁺＋HCO₃⁻']);r.caption(r.content['nodes'][5]['concept'],steps=True);r.finish()
 # Native proportions and mathematical curves follow the anatomy phase.
 r.begin('node-01');r.bars([('與血紅素結合約97%',97,True),('溶於血漿約3%',3,True)],100,'%');r.cards(['血紅素','血漿','每克血紅素約攜1.34 mL氧','溶解係數約0.003 mL/dL/mmHg']);r.caption(r.content['nodes'][0]['concept']);r.finish()
 r.begin('node-05');r.bars([('HCO₃⁻在血漿約70%',70,True),('碳醯胺基血紅素約23%',23,True),('直接溶解約7%',7,True)],100,'%');r.cards(['血紅素蛋白胺基','血漿']);r.caption(r.content['nodes'][4]['concept']);r.finish()
 oxygen_plot(r,'overview',overview=True);oxygen_plot(r,'node-03');oxygen_plot(r,'node-04')

VOLUME_COLORS={'TV':'#0072B2','IRV':'#E69F00','ERV':'#999999','RV':'#56B4E9'}
def stacked(r,segments,maxvalue=6000):
 x=80
 for labelname,value in segments:
  w=1500*value/maxvalue
  r.parts.append(f'<rect class="data-segment" data-value="{value}" data-max="{maxvalue}" x="{x}" y="{r.y}" width="{w}" height="110" fill="{VOLUME_COLORS[labelname]}"/>');r.record['data'].append(dict(type='segment',label=labelname,value=value,max=maxvalue,width=w));x+=w
 r.y+=175

def lung_function(r):
 r.begin('node-03');r.plate(1,[label('鼻腔',236,105,'left'),label('傳導區',980,415,'right'),label('終末細支氣管',830,778,'right'),label('呼吸性細支氣管',826,853,'right'),label('肺泡',683,1209,'left'),label('呼吸區',980,1110,'right')],red=['傳導區','終末細支氣管','呼吸性細支氣管','呼吸區']);r.cards(['不交換氣體','氣體交換']);r.caption(r.content['nodes'][2]['concept']);r.finish()
 svgs=[]
 for i,(name,tv,f,va) in enumerate([('淺快',150,40,0),('一般',500,12,4200),('深慢',1000,6,5100)],1):
  r.begin('overview-state-'+str(i));r.cards([name],focus=[name]);r.cards([f'TV {tv} mL／VD 150 mL／F {f} 次/min','VA＝（TV－VD）×F'])
  # Name and numerical result are separate labels so focus matches the approved whitelist.
  r.bars([('總通氣量',6000,False),('死腔通氣量',6000-va,False),('肺泡通氣量',va,True)],6000,'mL/min',colors=['#333','#999',CO2]);r.cards([f'總通氣量 6000／死腔通氣量 {6000-va}／肺泡通氣量 {va} mL/min']);r.caption(r.content['lab']['states'][i-1]['explain']);svgs.append(r.finish())
 r.overview(svgs)
 r.begin('node-01');r.cards(['課本男性示例']);y=r.y+120;ph=1320;Y=lambda v:y+ph-v*ph/6000
 # Exact volume bands (0,1200,2400,2900,6000); time is only schematic.
 for key,lo,hi in [('RV',0,1200),('ERV',1200,2400),('TV',2400,2900),('IRV',2900,6000)]:
  r.parts.append(f'<rect class="volume-band" data-low="{lo}" data-high="{hi}" x="250" y="{Y(hi)}" width="1210" height="{(hi-lo)*ph/6000}" fill="{VOLUME_COLORS[key]}" opacity=".14"/>');r.record['data'].append(dict(type='volume-band',label=key,low=lo,high=hi,height=(hi-lo)*ph/6000,scale=ph/6000))
 r.parts.append(f'<path d="M250 {y}V{Y(0)}H1470" stroke="#444" stroke-width="5" fill="none"/>')
 for v in [0,1200,2400,2900,6000]:
  r.parts.append(f'<path d="M250 {Y(v)}H1460" stroke="#aaa" stroke-width="3" stroke-dasharray="12 10"/>');r.record['labels'].append(r.text(str(v),215,Y(v)+20,align='end'))
 pts=[(280,2400),(350,2900),(420,2400),(490,2900),(560,2400),(630,2900),(700,2400),(850,6000),(1040,1200),(1190,2900),(1310,2400),(1430,2900)]
 # Smooth qualitative time progression, with exact y values at all stated boundaries.
 d=f'M{pts[0][0]} {Y(pts[0][1])}'
 for (x0,v0),(x1,v1) in zip(pts,pts[1:]):mid=(x0+x1)/2;d+=f'C{mid} {Y(v0)} {mid} {Y(v1)} {x1} {Y(v1)}'
 r.parts.append(f'<path class="volume-trace" d="{d}" fill="none" stroke="#444" stroke-width="12"/>');r.record['labels'].append(r.text('容積（mL）',850,y-45));r.record['labels'].append(r.text('時間',850,Y(0)+110));r.y=Y(0)+210
 r.cards(['潮氣容積TV 500 mL','吸氣儲備容積IRV 3100 mL','呼氣儲備容積ERV 1200 mL','肺餘容積RV 1200 mL'],focus=['潮氣容積TV 500 mL','吸氣儲備容積IRV 3100 mL','呼氣儲備容積ERV 1200 mL','肺餘容積RV 1200 mL']);r.caption(r.content['nodes'][0]['concept']);r.finish()
 r.begin('node-02')
 for labelname,segments in [('IC＝TV＋IRV＝3600 mL',[('TV',500),('IRV',3100)]),('FRC＝ERV＋RV＝2400 mL',[('ERV',1200),('RV',1200)]),('VC＝IRV＋TV＋ERV＝4800 mL',[('IRV',3100),('TV',500),('ERV',1200)]),('TLC＝VC＋RV＝6000 mL',[('IRV',3100),('TV',500),('ERV',1200),('RV',1200)])]:
  r.cards([labelname],focus=[labelname]);stacked(r,segments)
 r.cards(['TV 500 mL','IRV 3100 mL','ERV 1200 mL','RV 1200 mL','平靜呼氣末FRC','平靜吸氣末FRC＋TV']);r.caption(r.content['nodes'][1]['concept']);r.finish()
 r.begin('node-04');r.bars([('TV 500 mL',500,False),('VD 150 mL',150,True),('到達肺泡350 mL',350,False)],500,'mL／次',colors=['#333','#999',CO2]);r.cards(['F 12次/min','VA＝（TV－VD）×F'],focus=['VA＝（TV－VD）×F']);r.bars([('總通氣6000 mL/min',6000,False),('肺泡通氣4200 mL/min',4200,True)],6000,'mL/min');r.caption(r.content['nodes'][3]['concept']);r.finish()
 r.begin('node-05')
 for title,tv,f,va in [('淺快150×40',150,40,0),('一般500×12',500,12,4200),('深慢1000×6',1000,6,5100)]:
  r.cards([title]);r.bars([('總通氣6000 mL/min',6000,False),(f'肺泡通氣{va} mL/min',va,True)],6000,'mL/min',colors=['#999',CO2])
 r.caption(r.content['nodes'][4]['concept']);r.finish()
 r.begin('node-06');r.cards(['課本示範數值']);y=r.y+120;Y=lambda v:y+1000-v*200
 r.parts.append(f'<path d="M250 {y}V{Y(0)}H1490" fill="none" stroke="#444" stroke-width="5"/><path d="M600 {y}V{Y(0)}" stroke="#888" stroke-width="4" stroke-dasharray="15 12"/>')
 for v in [0,1,4,5]:r.record['labels'].append(r.text(str(v),210,Y(v)+20,align='end'))
 r.record['labels'].append(r.text('呼出容積（L）',850,y-45));r.record['labels'].append(r.text('1',600,Y(0)+100));r.record['labels'].append(r.text('時間（秒）',1100,Y(0)+100))
 for title,fev,fvc,color,dash in [('正常',4,5,'#444',''),('阻塞性',1,2.8,CO2,'stroke-dasharray="20 14"'),('限制性',2.5,2.8,O2,'stroke-dasharray="4 12"')]:
  d=f'M250 {Y(0)} C360 {Y(fev)+150} 530 {Y(fev)+50} 600 {Y(fev)} C850 {Y(fvc)+50} 1200 {Y(fvc)} 1450 {Y(fvc)}'
  r.parts.append(f'<path class="fev-curve" data-series="{title}" data-fev="{fev}" data-fvc="{fvc}" d="{d}" fill="none" stroke="{color}" stroke-width="12" {dash}/><circle class="fev-point" data-value="{fev}" cx="600" cy="{Y(fev)}" r="13" fill="{color}"/>');r.record['data'].append(dict(type='FEV curve',series=title,atOneSecond=fev,plateau=fvc,atOneSecondXY=[600,Y(fev)],plateauXY=[1450,Y(fvc)],scale=200,zeroY=Y(0)))
 r.y=Y(0)+210
 r.cards(['FEV₁','FVC'],focus=['FEV₁','FVC'])
 # Native HTML table becomes stacked cards on the mobile-width figure.
 for title,fev,fvc,ratio in [('正常',4,5,'4/5＝0.8'),('阻塞性',1,2.8,'1/2.8≈0.36'),('限制性',2.5,2.8,'2.5/2.8≈0.89')]:r.cards([title,f'FEV₁ {fev} L／FVC {fvc} L',ratio],focus=[ratio])
 r.caption(r.content['nodes'][5]['concept']);r.finish()
