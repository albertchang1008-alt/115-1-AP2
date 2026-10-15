#!/usr/bin/env python3
"""Approved raster anatomy + native labels for six respiratory materials.
Lungs-pleura keeps its accepted renderer; the five stage-two slugs dispatch to
respiratory-labels-stage2.py. FOCUS_STYLE is the shared, approved red setting.
All anatomy anchors are original PNG pixels; source proportions are preserved.
"""
from pathlib import Path
from PIL import Image
import base64, html, json
FOCUS_STYLE='red'
import sys, runpy
if len(sys.argv)>1 and sys.argv[1]!='lungs-pleura':
 stage=runpy.run_path(str(Path(__file__).with_name('respiratory-labels-stage2.py')))
 stage['main'](sys.argv[1], FOCUS_STYLE)
 sys.exit(0)
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'materials-src/figures'
RASTER=OUT/'raster/lungs-pleura'
FS=66
W=1700
MANIFEST={}
CONTENT=json.loads((ROOT/'materials-src/lungs-pleura/content.json').read_text())

def caption_lines(text):
 # Preserve the exact content wording; wrap only for mobile readability.
 lines=[]
 while len(text)>20:
  stops=[i+1 for i,c in enumerate(text[:20]) if c in '：，、；。' and i>=5]
  cut=stops[-1] if stops else 20
  lines.append(text[:cut]);text=text[cut:]
 if text:lines.append(text)
 return lines

def L(name,ax,ay,side,y,lines=None):
 return {'label':name,'anchor':[ax,ay],'textPosition':[380 if side=='left' else 1320,y], 'align':'end' if side=='left' else 'start','lines':lines or [name]}

def build(name,num,labels,red=(),state=None,crop=None,arrows=(),notes=()):
 source=RASTER/'incoming'/f'IMG-lungs-pleura-{num:02}.png'
 im=Image.open(source).convert('RGB'); iw,ih=im.size
 webp=RASTER/f'plate-{num:02}.webp'
 im.resize((1200,round(1200*ih/iw)),Image.Resampling.LANCZOS).save(webp,'WEBP',quality=70,method=6)
 data=base64.b64encode(webp.read_bytes()).decode()
 cx,cy,cw,ch=crop or (0,0,iw,ih)
 scale=850/cw; dx=425;dy=100
 H=max(round(ch*scale+230),max(l['textPosition'][1]+FS*len(l['lines']) for l in labels)+140)
 H+=len(notes)*110
 uid='lp-'+name
 css=f'''#{uid} .label{{font-size:calc({FS}px * var(--font-scale,1));fill:#17212b;stroke:white;stroke-width:8;paint-order:stroke;stroke-linejoin:round}} #{uid} .lead{{fill:none;stroke:#444;stroke-width:3}} #{uid} .halo{{stroke:white;stroke-width:10}} #{uid} .dot{{fill:#444;stroke:white;stroke-width:3}} #{uid} .focus .label{{fill:{'#b4233a' if FOCUS_STYLE=='red' else '#17212b'};font-weight:700}} #{uid} .focus-bg{{fill:#ffead2;display:{'none' if FOCUS_STYLE=='red' else 'block'}}}'''
 out=[f'<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" viewBox="0 0 {W} {H}" font-family="PingFang TC,Noto Sans CJK TC,Noto Sans TC,sans-serif" role="img" aria-label="肺與胸膜教學圖">',f'<style>{css}</style>','<rect width="100%" height="100%" fill="white"/>',f'<svg x="{dx}" y="{dy}" width="850" height="{ch*scale}" viewBox="{cx} {cy} {cw} {ch}" overflow="hidden"><image href="data:image/webp;base64,{data}" width="{iw}" height="{ih}" preserveAspectRatio="xMidYMid meet"/></svg>']
 for i,l in enumerate(labels):
  ax,ay=l['anchor']; ax=dx+(ax-cx)*scale;ay=dy+(ay-cy)*scale
  tx,ty=l['textPosition'];ex=tx+18 if l['align']=='end' else tx-18
  spans=''.join(f'<tspan x="{tx}" dy="{0 if j==0 else FS*1.12}">{html.escape(t)}</tspan>' for j,t in enumerate(l['lines']))
  focus='focus' if l['label'] in red else ''
  tw=max(len(t) for t in l['lines'])*FS
  rx=tx-tw-8 if l['align']=='end' else tx-8
  out.append(f'<g class="l{i} {focus}" data-label="{html.escape(l["label"])}"><rect class="focus-bg" x="{rx}" y="{ty-FS}" width="{tw+16}" height="{FS*1.12*len(l["lines"])+10}" style="{"" if focus else "display:none"}"/><polyline class="lead halo" points="{ex},{ty-FS*.34} {ax},{ay}"/><polyline class="lead" points="{ex},{ty-FS*.34} {ax},{ay}"/><circle class="dot" data-anchor="{i}" cx="{ax}" cy="{ay}" r="6"/><text class="label" x="{tx}" y="{ty}" text-anchor="{l["align"]}" aria-label="{html.escape(l["label"])}">{spans}</text></g>')
 # Solid inward arrows express surface tension without inventing values.
 out.append(f'<defs><marker id="{uid}-arrow" markerWidth="4" markerHeight="4" refX="3.3" refY="2" orient="auto"><path d="M0 0L4 2L0 4Z" fill="#444"/></marker></defs>')
 for a,b,thick in arrows:
  x1,y1=dx+(a[0]-cx)*scale,dy+(a[1]-cy)*scale;x2,y2=dx+(b[0]-cx)*scale,dy+(b[1]-cy)*scale
  out.extend([f'<path d="M{x1},{y1}L{x2},{y2}" stroke="white" stroke-width="{thick+8}"/>',f'<path class="tension-arrow" d="M{x1},{y1}L{x2},{y2}" stroke="#444" stroke-width="{thick}" marker-end="url(#{uid}-arrow)"/>'])
 if arrows:
  # Native radius indicator; no numerical magnitude is inferred from the picture.
  x1,y1=dx+(550-cx)*scale,dy+(520-cy)*scale;x2,y2=dx+(820-cx)*scale,dy+(350-cy)*scale
  out.append(f'<path class="radius" d="M{x1},{y1}L{x2},{y2}" fill="none" stroke="white" stroke-width="8"/><path class="radius" d="M{x1},{y1}L{x2},{y2}" fill="none" stroke="#444" stroke-width="3"/>')
 caption_labels=[]
 for j,note in enumerate(notes):
  y=H-90-(len(notes)-1-j)*110
  focus='focus' if note in red else ''
  tw=len(note)*FS
  out.append(f'<g class="{focus}" data-label="{html.escape(note)}"><rect class="focus-bg" x="{850-tw/2-8}" y="{y-FS}" width="{tw+16}" height="{FS+28}" style="{"" if focus else "display:none"}"/><text class="label direction" x="850" y="{y}" text-anchor="middle" aria-label="{html.escape(note)}">{html.escape(note)}</text></g>')
  if note=='P＝2T/r':caption_labels.append({'label':note,'anchor':None,'textPosition':[850,y],'align':'middle','lines':[note],'renderAs':'caption'})
 out.append('</svg>')
 record={'source':str(source.relative_to(ROOT)),'sourceSize':[iw,ih],'crop':list(crop) if crop else None,'viewBox':[W,H],'fontSize':FS,'state':state,'red':list(red),'labels':labels+caption_labels,'imageTransform':{'x':dx,'y':dy,'scale':scale},'arrows':[{'start':a,'end':b,'width':t} for a,b,t in arrows],'notes':list(notes),'radius':{'start':[550,520],'end':[820,350]} if arrows else None}
 MANIFEST[name]=record
 return '\n'.join(out)+'\n'

def save(name,svg): (OUT/f'lungs-pleura-{name}.svg').write_text(svg)
# Each state has its own record and original-pixel anchors.
for num,state,red in [(1,'state-1',['表面張力','P＝2T/r']),(2,'state-2',['表面張力素']),(3,'state-3',['表面張力','表面張力素'])]:
 labels=[L('大肺泡',550,430,'left',240),L('小肺泡',370,1110,'left',850),L('表面張力',800,638,'right',440)]
 if num!=1:labels.append(L('表面張力素',648 if num==2 else 681,1262 if num==2 else 1230,'right',1030))
 arrows=[((240,490),(370,490),7 if num==2 else 13),((870,490),(740,490),7 if num==2 else 13),((350,1110),(450,1110),7 if num==2 else 13),((740,1110),(640,1110),7 if num==2 else 13)]
 svg=build('overview-'+state,num,labels,red,state=state,arrows=arrows,notes=['P＝2T/r']+caption_lines(CONTENT['lab']['states'][num-1]['explain']))
 save('overview-'+state,svg)
# Embed three state SVGs in the existing overview contract; assets share the same source dimensions.
parts=[]
for state in ['state-1','state-2','state-3']:
 svg=(OUT/f'lungs-pleura-overview-{state}.svg').read_text()
 # Extract inner SVG markup; state subgroup keeps all scoped IDs.
 inner=svg[svg.index('>')+1:svg.rfind('</svg>')]
 parts.append(f'<g class="lp-state lp-{state}" id="lp-overview-{state}">{inner}</g>')
h=MANIFEST['overview-state-1']['viewBox'][1]
css='.lp-state{display:none}.lp-state.lp-state-1{display:block}'
for s in ['state-1','state-2','state-3']:
 css+=f'.state-figure[data-state="{s}"] .lp-state{{display:none}}.state-figure[data-state="{s}"] .lp-{s}{{display:block}}'
save('overview',f'<svg xmlns="http://www.w3.org/2000/svg" id="lp-overview" viewBox="0 0 {W} {h}" font-family="PingFang TC,Noto Sans CJK TC,Noto Sans TC,sans-serif" role="img" aria-label="大小肺泡與表面張力"><style>{css}</style>'+''.join(parts)+'</svg>')
labels=[L('肺尖',440,280,'left',140),L('右肺',300,430,'left',290),L('上葉',330,550,'left',440),L('水平裂',355,609,'left',600),L('中葉',400,760,'left',770),L('斜裂',365,807,'left',930),L('下葉',200,940,'left',1090),L('左肺',820,430,'right',290),L('上葉',780,560,'right',450),L('心切跡',739,744,'right',660),L('斜裂',820,765,'right',850),L('下葉',840,910,'right',1030),L('肺底',825,947,'right',1190)]
save('node-01',build('node-01',4,labels,['右肺','左肺','水平裂','斜裂','心切跡']))
labels=[L('肺門',455,570,'left',350),L('肺根',735,300,'right',180),L('肺血管',1000,350,'right',350),L('淋巴管',831,465,'right',520),L('支氣管',970,535,'right',750),L('神經',855,595,'right',940)]
save('node-02',build('node-02',5,labels,['肺門','肺根']))
labels=[L('胸腔壁',315,590,'left',300),L('壁層胸膜',525,575,'left',620),L('胸膜腔',590,675,'left',940),L('臟層胸膜',660,635,'right',580),L('肺',920,830,'right',960)]
save('node-03',build('node-03',6,labels,['壁層胸膜','胸膜腔','臟層胸膜'],notes=['胸內壓低於大氣壓']))
labels=[L('第二型肺泡細胞（中隔細胞）',320,695,'left',220,['第二型','肺泡細胞','（中隔','細胞）']),L('表面張力素',550,1245,'left',720,['表面','張力素']),L('第一型肺泡細胞',655,585,'right',190,['第一型','肺泡細胞']),L('肺泡巨噬細胞（灰塵細胞）',810,900,'right',490,['肺泡巨噬','細胞','（灰塵','細胞）']),L('肺泡腔',670,1090,'right',880)]
save('node-04',build('node-04',7,labels,['第一型肺泡細胞','第二型肺泡細胞（中隔細胞）','肺泡巨噬細胞（灰塵細胞）'],crop=(0,530,1145,844)))
labels=[L('肺泡側',700,300,'left',160),L('第一型肺泡細胞',460,545,'right',200,['第一型','肺泡細胞']),L('肺泡細胞基底膜',580,590,'right',410,['肺泡細胞','基底膜']),L('間質',690,643,'right',620),L('微血管基底膜',770,690,'right',800,['微血管','基底膜']),L('內皮細胞',810,728,'right',1000),L('血液側',470,1000,'left',880)]
save('node-05',build('node-05',8,labels,['第一型肺泡細胞','肺泡細胞基底膜','間質','微血管基底膜','內皮細胞'],notes=['厚度通常不超過0.5 μm']))
labels=[L('大肺泡',550,430,'left',240),L('小肺泡',370,1110,'left',850),L('表面張力素',648,1262,'right',1030,['表面','張力素']),L('T',800,638,'right',440),L('r',685,435,'left',620),L('P',590,1190,'right',900)]
save('node-06',build('node-06',2,labels,['表面張力素','P＝2T/r'],arrows=[((240,490),(370,490),7),((870,490),(740,490),7),((350,1110),(450,1110),7),((740,1110),(640,1110),7)],notes=['P＝2T/r']+caption_lines(CONTENT['nodes'][5]['concept'].split('，',1)[1])))
(RASTER/'labels.json').write_text(json.dumps({'slug':'lungs-pleura','focusStyle':FOCUS_STYLE,'anchorCoordinates':'original PNG pixels','figures':MANIFEST},ensure_ascii=False,indent=2)+'\n')
print('Generated lungs-pleura: three states and six nodes.')
