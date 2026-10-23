#!/usr/bin/env python3
"""Native responsive annotations over immutable, reviewed anatomy rasters.
No source PNG or shared renderer is changed. Coordinates are original pixels.
"""
from pathlib import Path
import json,base64,struct,hashlib,html,math
R=Path(__file__).resolve().parents[1];O=R/'materials-src/figures';E=R/'docs/urinary-release/labels';E.mkdir(exist_ok=True)
PLAN=json.loads((R/'docs/urinary-release/stage2-label-plan.json').read_text())
COLORS={'water':'#0072B2','ions':'#CC79A7','urine':'#E69F00','blood':'#D55E00','signal':'#444444'}
# Start/end points are source pixels. Movement is thick solid; signals thin dashed.
ARROWS={
('nephron-circulation','node-04'):[('blood',[(130,710),(300,710)])],
('filtration-clearance','node-01'):[('water',[(625,800),(805,850)])],
('tubular-handling','node-01'):[('water',[(380,300),(450,330)]),('water',[(560,720),(630,720)]),('ions',[(800,800),(720,800)]),('urine',[(965,1220),(965,1340)])],
('tubular-handling','node-03'):[('water',[(425,750),(600,640)])],
('tubular-handling','node-05'):[('ions',[(965,975),(655,975)]),('ions',[(650,1160),(965,1160)])],
('urine-concentration','node-02'):[('water',[(530,850),(430,850)])],
('urine-concentration','node-03'):[('ions',[(700,780),(800,780)])],
('urine-concentration','node-04'):[('blood',[(735,800),(735,950)]),('blood',[(585,1000),(585,850)])],
('urine-concentration','node-05'):[('signal',[(805,760),(685,800)]),('water',[(440,1000),(760,1000)])],
('urinary-route-micturition','node-01'):[('urine',[(480,430),(480,580)])],
('urinary-route-micturition','node-05'):[]}
ARROWS.update({
('water-sodium-regulation','node-03'):[('water',[(400,1000),(900,1000)])],
('water-sodium-regulation','node-04'):[('signal',[(360,300),(350,450)]),('signal',[(500,530),(660,530)]),('signal',[(750,610),(750,800)]),('signal',[(800,860),(890,900)]),('signal',[(920,965),(980,1050)])],
('water-sodium-regulation','node-05'):[('ions',[(340,175),(400,175),(600,315),(900,315)]),('ions',[(900,490),(620,490),(400,470),(340,470)]),('water',[(340,940),(400,940),(590,1000),(900,1000)]),('signal',[(700,760),(610,800)]),('signal',[(700,140),(590,200)])],
('water-sodium-regulation','node-06'):[('signal',[(480,235),(720,170)]),('urine',[(1050,580),(1050,640)])],
('electrolyte-balance','node-02'):[('water',[(430,390),(660,390)])],
('electrolyte-balance','node-04'):[('ions',[(400,1100),(850,1100)]),('ions',[(850,1000),(400,1000)])],
('electrolyte-balance','node-05'):[('ions',[(550,760),(950,760)]),('ions',[(400,850),(250,850)])],
('acid-base-homeostasis','node-04'):[('water',[(560,445),(430,350)]),('water',[(430,280),(280,150)])],
('acid-base-homeostasis','node-05'):[('ions',[(800,200),(450,200)]),('ions',[(800,300),(1000,300)])],
('acid-base-homeostasis','node-06'):[('ions',[(245,1025),(455,1080)]),('ions',[(430,975),(480,1055)]),('urine',[(440,1130),(100,1160)])]})

ARROWS[('water-sodium-regulation','node-04')]=[('signal',[(500,165),(340,260)]),('signal',[(500,530),(660,530)]),('signal',[(750,530),(750,800),(890,900)]),('signal',[(880,930),(420,1180)]),('signal',[(1000,930),(980,1090)])]
# 2026-10-16 final-review fixes (source pixels).
# F-4: tails/heads moved off the orange K⁺ particles; native captions name each arrow.
ARROWS[('electrolyte-balance','node-04')]=[('ions',[(460,1100),(850,1100)]),('ions',[(850,970),(417,970)])]
# F-5: CO₂ leaves from the venous side (IVC beside the heart) to the lung, then exits up the trachea.
ARROWS[('acid-base-homeostasis','node-04')]=[('water',[(540,275),(440,240)]),('water',[(470,250),(555,170),(560,20)])]
# F-2: RAAS step badges sit on ① JG cells ② angiotensinogen→I ③ lung ACE ④ constricted arteriole ⑤ adrenal.
BADGES={('water-sodium-regulation','node-04'):[(440,95),(440,460),(680,760),(560,1240),(880,1230)]}
CAPTIONS={('electrolyte-balance','node-04'):[('K⁺分泌',640,935),('Na⁺再吸收',640,1160)]}
# F-8: hide the unannotated duplicate panel / de-emphasise unused panels (PNG untouched).
CROPS={('electrolyte-balance','node-05'):965}
FADES={('acid-base-homeostasis','node-06'):890}
# U-1/F-1: every unanchored functional label must sit inside a titled callout box.
CALLOUTS={('filtration-clearance','overview'):'清除率與過濾指標',('filtration-clearance','node-06'):'清除率對應指標',('tubular-handling','node-05'):'內分泌調節',('urine-concentration','overview'):'抗利尿激素與尿液變化',('urine-concentration','node-02'):'下降枝濃縮重點',('urine-concentration','node-03'):'上升枝稀釋重點',('urine-concentration','node-04'):'直血管功能',('urine-concentration','node-06'):'ADH與尿液變化',('urinary-route-micturition','node-01'):'運送與防逆流機制',('water-sodium-regulation','overview'):'保水與保鈉調節激素',('water-sodium-regulation','node-01'):'每日攝取合計',('water-sodium-regulation','node-03'):'調節訊號與雙路徑',('electrolyte-balance','overview'):'本節關鍵概念',('electrolyte-balance','node-05'):'內分泌調節',('acid-base-homeostasis','node-01'):'血液酸鹼正常範圍',('acid-base-homeostasis','node-04'):'呼吸調節方向'}

def native_shapes(slug,slot):
 parts=[]
 if slug=='electrolyte-balance' and slot in ['overview','node-01']:
  for group,count,top in [('glucose',6,80),('NaCl',12,520),('MgCl2',18,960)]:
   cols=3 if count==6 else 4 if count==12 else 6;dx=150 if count==6 else 100 if count==12 else 75;start=700 if count==6 else 690 if count==12 else 660
   parts.append(f'<g data-beaker="{group}" data-count="{count}"><path d="M620 {top}V{top+320}H1080V{top}" fill="#f5faff" stroke="#777" stroke-width="3"/>')
   for gy in range(3 if count in [12,18] else 0):
    for gx in range(2):
     rx=(650 if count==12 else 630)+gx*(200 if count==12 else 225);ry=top+50+gy*100;rw=180 if count==12 else 210
     parts.append(f'<rect data-molecule-group="true" x="{rx}" y="{ry}" width="{rw}" height="80" rx="14" fill="none" stroke="#c4cbd2" stroke-width="2"/>')
   for j in range(count):
    x=start+(j%cols)*dx;y=top+90+(j//cols)*100
    species='glucose'if group=='glucose'else ('Na'if j%2==0 else'Cl')if group=='NaCl'else('Mg'if j%3==0 else'Cl');color={'glucose':'#555555','Na':'#0072B2','Cl':'#009E73','Mg':'#E69F00'}[species]
    parts.append(f'<circle data-particle="{species}" cx="{x}" cy="{y}" r="23" fill="{color}" stroke="white" stroke-width="3"/>')
   parts.append('</g>')
 if slug=='acid-base-homeostasis' and slot=='node-06':
  parts.extend(['<circle data-native-ion="NH3" cx="200" cy="1000" r="45" fill="white" stroke="#0072B2" stroke-width="7"/>','<circle data-native-ion="NH4" cx="500" cy="1100" r="45" fill="#CC79A7" stroke="white" stroke-width="7"/>','<path data-native-ion="phosphate" d="M205 1250L227 1210H273L295 1250L273 1290H227Z" fill="#E69F00" stroke="white" stroke-width="7"/>'])
 return ''.join(parts)

def cross(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def intersects(a,b,c,d):return cross(a,b,c)*cross(a,b,d)<0 and cross(c,d,a)*cross(c,d,b)<0
def esc(s):return html.escape(s,quote=True)
allrecords=[]
for row in PLAN:
 slug,slot=row['slug'],row['slot'];src=R/row['source'];data=src.read_bytes();iw,fullh=struct.unpack('>II',data[16:24]);ih=CROPS.get((slug,slot),fullh);uid='ul-'+slug+'-'+slot
 labels=row['labels'];focus=row['focus'];states=row['states'];dw=950;dx=700;dy=60;scale=dw/iw
 withbars=slug=='tubular-handling' and slot=='node-03';rowgap=160 if withbars else 120;conceptgap=140 if withbars else 85
 # Pack the label column while preserving endpoint order. Each text remains whole.
 anchored=sorted([(i,l)for i,l in enumerate(labels)if l['sourceAnchor']],key=lambda t:t[1]['sourceAnchor'][1]);ys={};last=-30
 for i,l in anchored:
  y=max(dy+l['sourceAnchor'][1]*scale,last+78);ys[i]=y;last=y
 hd=max(dy+ih*scale+80,last+60);concepts=[i for i,l in enumerate(labels)if not l['sourceAnchor']]
 calloutTitle=row.get('calloutTitle')or CALLOUTS.get((slug,slot));conceptStart=hd
 assert calloutTitle or not concepts,(slug,slot,'unanchored labels need a titled callout box')
 for k,i in enumerate(concepts):ys[i]=hd+(130 if calloutTitle else 60)+k*conceptgap
 hd+=len(concepts)*conceptgap+(150 if calloutTitle else 80) if concepts else 0
 mh=round(1700*ih/iw);tableY=40+mh+180;hm=tableY+len(labels)*rowgap+80
 steps=['① 近腎絲球細胞釋放腎素','② 腎素促血管收縮素原形成I','③ 轉化酶（肺臟）使I形成II','④ 血管收縮素II促血管收縮','⑤ 血管收縮素II促醛固酮']if slug=='water-sodium-regulation'and slot=='node-04'else []
 dstepY=hd+20;mstepY=hm+20
 if steps:hd+=len(steps)*85+100;hm+=len(steps)*120+100
 style=f'''#{uid}{{--focus-ink:#b4233a;--focus-weight:700;aspect-ratio:1700 / {hm};height:auto!important}}#{uid} .ul-desktop{{display:none;width:1700px!important;height:{hm}px!important;max-width:none}}#{uid} .ka-label{{font-size:calc(32px * var(--font-scale,1));fill:#111;stroke:white;stroke-width:3;paint-order:stroke;font-weight:400}}#{uid} .ul-mobile .ka-label,#{uid} .ka-number{{font-size:calc(76px * var(--font-scale,1))}}#{uid} .ka-number{{fill:#111;font-weight:600}}#{uid} .ka-lead{{stroke:#333;stroke-width:2.5;fill:none}}#{uid} .ka-halo{{stroke:white;stroke-width:9;fill:none}}#{uid} .ka-dot{{fill:#222;stroke:white;stroke-width:2}}#{uid} .ka-pin{{fill:white;stroke:#222;stroke-width:5}}#{uid} .is-focus .ka-label{{fill:var(--focus-ink);font-weight:var(--focus-weight)}}@media(max-width:767px){{#{uid} .ul-desktop .ka-label{{font-size:calc(76px * var(--font-scale,1))}}}}@media(min-width:768px){{#{uid}{{aspect-ratio:1700 / {hd}}}#{uid}>.ul-mobile{{display:none}}#{uid}>.ul-desktop{{display:inline}}}}.kit[data-slug="{slug}"] :is(.state-figure,.node-figure){{max-height:none;max-width:100%;margin-inline:auto}}'''
 if (slug,slot) in CAPTIONS:style+=f'#{uid} .ul-cap{{font-size:32px;fill:#111;font-weight:600;stroke:white;stroke-width:6;paint-order:stroke}}#{uid} .ul-mobile .ul-cap{{font-size:70px;stroke-width:12}}@media(max-width:767px){{#{uid} .ul-desktop .ul-cap{{font-size:70px}}}}'
 if steps:style+=f'#{uid} .ul-step{{font-size:32px;fill:#111}}#{uid} .ul-mobile .ul-step{{font-size:76px}}@media(max-width:767px){{#{uid} .ul-desktop .ul-step{{font-size:76px}}}}'
 for state,names in states.items():
  for i,l in enumerate(labels):
   if l['label'] in names:style+=f'.state-figure[data-state="{state}"] #{uid} .ul-l{i} .ka-label{{fill:var(--focus-ink);font-weight:var(--focus-weight)}}'
 asset=uid+'-raster';clipped=slug=='electrolyte-balance' and slot in ['overview','node-01'];clipdefs=f'<clipPath id="{uid}-left-only"><rect width="560" height="{ih}"/></clipPath>'if clipped else '';clipattrs=f' clip-path="url(#{uid}-left-only)"'if clipped else ''
 if ih!=fullh:clipdefs=f'<clipPath id="{uid}-crop"><rect width="{iw}" height="{ih}"/></clipPath>';clipattrs=f' clip-path="url(#{uid}-crop)"'
 desktop=[f'<use href="#{asset}" transform="translate({dx},{dy}) scale({scale})" data-raster-layout="desktop"/>'];mobile=[f'<use href="#{asset}" transform="translate(0,40) scale({1700/iw})" data-raster-layout="mobile"/>'];pinboxes=[];pinlines=[];records=[]
 if calloutTitle:
  desktop.append(f'<rect data-callout-box="true" x="45" y="{conceptStart+10}" width="1610" height="{len(concepts)*conceptgap+120}" rx="20" fill="#f5f8fb" stroke="#64748b" stroke-width="2"/><text data-callout-title="true" x="80" y="{conceptStart+65}" font-size="32" fill="#334155">{esc(calloutTitle)}</text>')
 mobile.append(f'<rect data-legend-box="true" x="20" y="{tableY-150}" width="1660" height="{len(labels)*rowgap+220}" rx="20" fill="#f5f8fb" stroke="#64748b" stroke-width="3"/><text data-callout-title="true" x="65" y="{tableY-60}" font-size="76" fill="#334155">構造與功能圖例</text>')
 obstacles=[]
 if clipped:
  for ys0,rad in [([150,300],100),([580,750],80),([1050,1230],90)]:
   for yy in ys0:
    for xx in [110,285,455]:obstacles.append((xx*1700/iw,40+yy*1700/iw,rad*1700/iw))
  for count,top in [(6,80),(12,520),(18,960)]:
   cols=3 if count==6 else 4 if count==12 else 6;gap=150 if count==6 else 100 if count==12 else 75;start=700 if count==6 else 690 if count==12 else 660
   for j in range(count):obstacles.append(((start+(j%cols)*gap)*1700/iw,40+(top+90+(j//cols)*100)*1700/iw,23*1700/iw))
 if steps:
  for bx,by in BADGES[(slug,slot)]:obstacles.append((bx*1700/iw,40+by*1700/iw,100))
 for text,cx0,cy0 in CAPTIONS.get((slug,slot),[]):obstacles.append((cx0*1700/iw,40+(cy0-20)*1700/iw,200))
 fade=FADES.get((slug,slot))
 if fade:
  for parts,sc,tx,ty in [(desktop,scale,dx,dy),(mobile,1700/iw,0,40)]:parts.append(f'<rect data-fade="true" x="0" y="0" width="{iw}" height="{fade}" fill="white" fill-opacity="0.72" transform="translate({tx},{ty}) scale({sc})"/>')
 native=native_shapes(slug,slot)
 if native:
  desktop.append(f'<g transform="translate({dx},{dy}) scale({scale})" data-native-model="desktop">{native}</g>');mobile.append(f'<g transform="translate(0,40) scale({1700/iw})" data-native-model="mobile">{native}</g>')
 arrows=ARROWS.get((slug,slot),[])
 for mode,parts,sc,tx,ty in [('desktop',desktop,scale,dx,dy),('mobile',mobile,1700/iw,0,40)]:
  for j,(kind,points)in enumerate(arrows):
   pp=[(tx+x*sc,ty+y*sc)for x,y in points];a,b=pp[0],pp[-1];col=COLORS[kind];width=4 if kind=='signal' else 12;dash='stroke-dasharray="15 11"' if kind=='signal' else '';mid=f'{uid}-{mode}-{j}'
   parts.append(f'<defs><marker id="{mid}" markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto"><path d="M0 0L4 2L0 4Z" fill="{col}"/></marker></defs><polyline points="'+ ' '.join(f'{x},{y}'for x,y in pp)+f'" fill="none" stroke="white" stroke-width="{width+8}"/><polyline data-flow="{kind}" points="'+' '.join(f'{x},{y}'for x,y in pp)+f'" fill="none" stroke="{col}" stroke-width="{width}" {dash} marker-end="url(#{mid})"/>')
   if steps:
    bx,by=BADGES[(slug,slot)][j];sx=tx+bx*sc;sy=ty+by*sc;rr=22 if mode=='desktop'else 46;baseline=11 if mode=='desktop'else 27
    parts.append(f'<circle cx="{sx}" cy="{sy}" r="{rr}" fill="white" stroke="#111" stroke-width="2.5"/><text class="ul-step" data-step="{j+1}" x="{sx}" y="{sy+baseline}" text-anchor="middle">{chr(9312+j)}</text>')
 for mode,parts,sc,tx,ty in [('desktop',desktop,scale,dx,dy),('mobile',mobile,1700/iw,0,40)]:
  for text,cx0,cy0 in CAPTIONS.get((slug,slot),[]):parts.append(f'<text class="ul-cap" data-arrow-caption="true" x="{tx+cx0*sc}" y="{ty+cy0*sc}" text-anchor="middle">{esc(text)}</text>')
 for mode,parts,sy,gap in [('desktop',desktop,dstepY,85),('mobile',mobile,mstepY,120)]:
  for k,caption in enumerate(steps):parts.append(f'<text class="ul-step" x="80" y="{sy+80+k*gap}" data-step-caption="{k+1}">{caption}</text>')
 for i,l in enumerate(labels):
  key=chr(65+i)if steps else str(i+1)
  label=l['label'];name=esc(label);a=l['sourceAnchor'];cl='is-focus'if label in focus else '';common=f'class="ul-l{i} {cl}" data-label="{name}"';y=ys[i]
  rec=dict(l,index=i+1,conceptCallout=a is None,layouts={})
  if a:
   ax,ay=dx+a[0]*scale,dy+a[1]*scale;points=[(640,y),(660,y),(ax,ay)];pp=' '.join(f'{x},{z}'for x,z in points)
   desktop.append(f'<g {common}><polyline class="ka-halo" points="{pp}"/><polyline class="ka-lead" data-leader="{i+1}" points="{pp}"/><circle class="ka-dot" data-anchor="{i+1}" cx="{ax}" cy="{ay}" r="6"/><text class="ka-label" x="620" y="{y+11}" text-anchor="end">{name}</text></g>');rec['layouts']['desktop']={'anchor':[ax,ay],'text':[620,y+11],'leader':points}
   ma=(a[0]*1700/iw,40+a[1]*1700/iw);candidates=[]
   for radius in [130,190,270,350,450,600,800,1000]:
    for angle in range(0,360,30):
     px=ma[0]+radius*math.cos(math.radians(angle));py=ma[1]+radius*math.sin(math.radians(angle));box=(px-55,py-48,110,96)
     if px<70 or px>1630 or py<100 or py>mh-10:continue
     if any(math.hypot(px-ox,py-oy)<53+radius0+12 for ox,oy,radius0 in obstacles):continue
     if any(box[0]<b[0]+b[2]+20 and box[0]+box[2]+20>b[0] and box[1]<b[1]+b[3]+20 and box[1]+box[3]+20>b[1]for b in pinboxes):continue
     if any(intersects((px,py),ma,*line)for line in pinlines):continue
     candidates.append((radius,px,py,box))
    if candidates:break
   assert candidates,(slug,slot,label,'mobile pin packing failed')
   _,cx,cy,box=candidates[0];pinboxes.append(box);pinlines.append(((cx,cy),ma));pp=f'{cx},{cy} {ma[0]},{ma[1]}'
   mobile.append(f'<g {common}><polyline class="ka-halo" points="{pp}"/><polyline class="ka-lead" data-leader="{i+1}" points="{pp}"/><circle class="ka-dot" data-anchor="{i+1}" cx="{ma[0]}" cy="{ma[1]}" r="8"/><circle class="ka-pin" cx="{cx}" cy="{cy}" r="53"/><text class="ka-number" data-pin="{i+1}" x="{cx}" y="{cy+27}" text-anchor="middle">{key}</text></g>');rec['layouts']['mobile']={'anchor':ma,'pin':[cx,cy],'leader':[[cx,cy],ma]}
  else:
   desktop.append(f'<g {common}><text class="ka-label" x="850" y="{y}" text-anchor="middle">{name}</text></g>');rec['layouts']['desktop']={'text':[850,y],'leader':None};rec['layouts']['mobile']={'leader':None}
  ly=tableY+i*rowgap
  mobile.append(f'<g {common}><text class="ka-number" data-number-key="{i+1}" x="65" y="{ly+72}">{key}</text><text class="ka-label" x="180" y="{ly+72}">{name}</text></g>');records.append(rec)
  if withbars and label in ['Na⁺約67%','水約75%']:
   value=67 if label.startswith('Na') else 75
   for target,x,bary,w in [(desktop,500,y+22,700),(mobile,180,ly+110,1450)]:
    target.append(f'<rect x="{x}" y="{bary}" width="{w}" height="20" fill="#edf1f5"/><rect x="{x}" y="{bary}" width="{w*value/100}" height="20" fill="#0072B2" data-bar="true" data-value="{value}" data-total="100" data-full-width="{w}"/>')

 svg=f'<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" viewBox="0 0 1700 {hm}" preserveAspectRatio="none" role="img" aria-label="{esc(slug+" "+slot)}" font-family="PingFang TC,Noto Sans TC,sans-serif"><style>{style}</style><defs>{clipdefs}<image id="{asset}"{clipattrs} href="data:image/png;base64,{base64.b64encode(data).decode()}" width="{iw}" height="{fullh}"/></defs><g class="ul-mobile">'+''.join(mobile)+f'</g><svg class="ul-desktop" x="0" y="0" width="1700" height="{hm}" viewBox="0 0 1700 {hd}" preserveAspectRatio="none">'+''.join(desktop)+'</svg></svg>\n'
 filename=f'{slug}-{slot}.svg';(O/filename).write_text(svg)
 row.update(stepCaptions=steps,id=uid,figure=filename,sha256=hashlib.sha256(data).hexdigest(),sourceSize=[iw,ih],labels=records,arrows=arrows);allrecords.append(row)
 p=R/f'materials-src/{slug}/content.json';c=json.loads(p.read_text())
 if slot=='overview':c['lab']['figure']=filename;c['lab']['intro']='切換三個閱讀主題，沿圖中構造與方向建立關係；紅色粗體標出本次觀察的重點。'
 else:
  node=c['nodes'][int(slot[-2:])-1];node['figure']=filename;node['caption']=node['summary'].rstrip('。')+'。'
  if slug=='electrolyte-balance' and slot=='node-01':node['caption']='相同起始分子數且完全解離時，比較每個分子形成的粒子數；右側各外框對應一個起始分子。'
 c['credits'][1]='底圖由 ChatGPT 製作；中文標籤、引線與方向箭頭以原生 SVG 呈現。';p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
(E/'anchors.json').write_text(json.dumps(allrecords,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(allrecords),'responsive label figures; original rasters unchanged.')
