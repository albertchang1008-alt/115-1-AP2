#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Native data layers: source-approved quantities only; no anatomy drawing."""
from pathlib import Path
import json,html,re
R=Path(__file__).resolve().parents[1];O=R/'materials-src/figures';E=R/'docs/urinary-release/data';E.mkdir(exist_ok=True)
def T(text,x,y,label=None,**attrs):
 label=label or (text if text in LABELS else None)
 emphasis=''
 if label:
  emphasis=' class="ka-label" data-label="'+html.escape(label,quote=True)+'"'
  if label in FOCUS:emphasis+=' style="fill:#b4233a;font-weight:700"'
 return '<text x="'+str(x)+'" y="'+str(y)+'"'+emphasis+' '+ ' '.join(k.replace('_','-')+'="'+str(v)+'"'for k,v in attrs.items())+'>'+html.escape(text)+'</text>'

def rect(x,y,w,h,fill,**attrs):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" '+ ' '.join(k.replace('_','-')+'="'+str(v)+'"'for k,v in attrs.items())+'/>'
def B(value,total,y,color='#0072B2'):
 unit=880//total;full=unit*total
 return rect(60,y,full,30,'#edf1f5')+rect(60,y,unit*value,30,color,data_bar='true',data_value=value,data_total=total,data_full_width=full)
rows=[]
for slug,number in [('nephron-circulation',6),('filtration-clearance',4),('filtration-clearance',5),('tubular-handling',2),('tubular-handling',4),('tubular-handling',6)]:
 slot=f'node-{number:02d}';uid='ud-'+slug+'-'+slot;cpath=R/f'materials-src/{slug}/content.json';c=json.loads(cpath.read_text());node=c['nodes'][number-1];spec=(R/f'docs/urinary-fluid-specs/{slug}.md').read_text().split('## 節點'+f'{number:02d}'+'：')[1].split('\n## ')[0];labels=re.search(r'圖內標籤候選白名單\*\*：([^。]+)',spec).group(1).split('、');LABELS=labels;candidate=re.search(r'紅色粗體候選\*\*：([^。]+)',spec).group(1).split('、');FOCUS=[label for label in labels if any(label.startswith(f) for f in candidate)]
 parts=[];values=[];height=1000
 if slug=='nephron-circulation':
  for i,label in enumerate(labels):parts.append(T(label,60,100+i*180))
  parts.extend([B(660,660,350),B(125,660,530),T('同一體積流量尺度（mL/分）',60,830),T('125 ÷ 660 ≈ 0.19',60,930)]);values=[660,125,125/660]
 elif slug=='filtration-clearance' and number==4:
  height=1250
  for i,(label,value,sign)in enumerate(zip(labels,[55,15,30,0,10],['＋','－','－','＋','＝'])):
   y=110+i*190;parts.extend([T(sign+' '+label,50,y,label=label),B(value,55,y+35,'#0072B2'if sign in ['＋','＝']else'#777777')])
  parts.extend([T('壓力（mmHg）；各條同一尺度',60,1110),T('55 ＋ 0 － 15 － 30 ＝ 10 mmHg',60,1200)]);values=[55,0,-15,-30,10]
 elif slug=='filtration-clearance':
  for i,label in enumerate(labels):parts.append(T(label,60,100+i*125))
  parts.extend([T('U＝18 mg/mL；V＝1 mL/min',60,790),T('P＝0.26 mg/mL',60,880),T('C ≈ 69 mL/min',60,970)]);height=1040;values=[18,1,.26,18/.26]
 elif number==2:
  parts=[T(labels[0],50,120),T('同一物質；同一時間範圍',60,300),T('過濾量',100,480),T('－ 再吸收量',100,650),T('＋ 分泌量',100,820),T('＝ 排泄量',100,990),T('單位：物質量／時間',60,1170)];height=1250
 elif number==4:
  parts=[T('葡萄糖',60,100),T('最大轉運量',60,210),T('375 mg/min',600,210),T('再吸收量（mg/min）',60,330),'<path d="M100 420V900H940" fill="none" stroke="#222" stroke-width="4"/>','<path data-tmax="375" d="M100 900L850 420H940" fill="none" stroke="#0072B2" stroke-width="9"/>','<path d="M100 420H940" fill="none" stroke="#777" stroke-width="3" stroke-dasharray="10 10"/>',T('375',4,435),T('0',55,930),T('375',805,970),T('過濾負荷（mg/min）',300,1060,label='過濾負荷'),T('超過運輸上限後，回收量不再隨負荷增加',60,1190)];height=1280;values=[375]
 else:
  entries=[('U/P','尿／血漿濃度比；無單位'),('尿流量','V；mL/min'),('排泄量','U × V；mg/min'),('清除率','U × V/P；mL/min')]
  for i,(a,b)in enumerate(entries):parts.extend([T(a,60,100+i*240),T(b,60,200+i*240)])
  height=1020
 file=f'{slug}-{slot}-data.svg';svg=f'<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" viewBox="0 0 1000 {height}" role="img" aria-label="{html.escape(node["title"])}" font-family="PingFang TC,Noto Sans TC,sans-serif"><style>#{uid} text {{font-size:42px;fill:#111}}.kit[data-slug="{slug}"] .node-figure{{max-height:none}}</style><rect width="1000" height="{height}" fill="white"/>'+''.join(parts)+'</svg>\n';(O/file).write_text(svg)
 node['figure']=file;node['caption']=node['summary'].rstrip('。')+'。';cpath.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n');rows.append(dict(slug=slug,slot=slot,id=uid,figure=file,sources=node['sources'],labels=labels,values=values,focus=FOCUS,states={},chart='native-svg',screenshot=f'{slug}-1280-{slot}.png'))
c=json.loads((R/'materials-src/tubular-handling/content.json').read_text());n=c['nodes'][2]
rows.append(dict(slug='tubular-handling',slot='node-03',id='ul-tubular-handling-node-03',figure=n['figure'],sources=n['sources'],labels=['Na⁺約67%','水約75%'],values=[67,75],chart='native-svg-over-approved-raster',screenshot='tubular-handling-1280-node-03.png'))
(E/'slots.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print('Created',len(rows),'native data slots.')
