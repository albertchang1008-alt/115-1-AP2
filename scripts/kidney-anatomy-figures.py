#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kidney-only stage-two SVG labels; immutable original PNG pixels and native text.
Desktop direct labels / mobile numbered pins and whole-term legend. No global kit edits.
Change FOCUS_STYLE once and rerun to switch the entire kidney figure set.
"""
from pathlib import Path
import base64,json,html,re,struct,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'materials-src/figures';E=ROOT/'docs/urinary-release/stage2'
FOCUS_STYLE='red'  # the only switch: red, or block (black text on pale orange)
STYLE={'red':{'ink':'#b4233a','background':'transparent','weight':'700'},'block':{'ink':'#111111','background':'#ffedd5','weight':'700'}}[FOCUS_STYLE]
WIDTH=1700;DF=32;MF=76
esc=html.escape
# Every anchor is in original PNG pixels. Functional overview callouts have no
# anatomical anchor: the overview base does not depict individual hormone sites.
def L(text,x=None,y=None,side='left',offset=(-120,-65)):
 return dict(text=text,anchor=None if x is None else [x,y],side=side,mobileOffset=list(offset))
RECORDS={
'overview':dict(image=1,labels=[L('右腎',350,400),L('左腎',780,260,offset=(135,-70)),L('後腹腔',230,460,offset=(-100,90)),L('腎皮質',380,660),L('腎髓質',300,890),L('腎盂',435,1010,'left',(150,35)),L('腎素'),L('紅血球生成素（腎紅血球生成因子）'),L('活化維生素D')],states={'state-1':['右腎','左腎','後腹腔'],'state-2':['腎皮質','腎髓質','腎盂'],'state-3':['腎素','紅血球生成素（腎紅血球生成因子）','活化維生素D']},focus=[]),
'node-01':dict(image=2,labels=[L('右腎',350,330),L('左腎',773,230,'right',(140,-70)),L('脊柱',562,400,'right',(150,45)),L('腹膜',295,975),L('後腹腔',220,1165,'left',(-150,70))],focus=['後腹腔','右腎']),
'node-02':dict(image=3,labels=[L('腎皮質',843,194,'right',(140,-80)),L('腎髓質',750,300,'right',(160,60)),L('腎柱',515,280,'left',(-150,-80)),L('腎錐體',369,544,'left',(-150,40))],focus=['腎皮質','腎髓質','腎柱']),
'node-03':dict(image=3,labels=[L('腎乳頭',538,430,'left',(-150,-100)),L('小腎盞',565,455,'right',(150,75)),L('大腎盞',613,602,'left',(-150,70)),L('腎盂',725,712,'right',(160,30)),L('輸尿管',925,1110,'right',(130,30))],focus=['腎乳頭','小腎盞','大腎盞','腎盂']),
'node-04':dict(image=4,labels=[L('腎門',700,450,'right',(150,35)),L('腎被膜',319,888,'right',(40,150)),L('脂肪囊',319,843,'left',(-130,20)),L('腎筋膜',318,792,'left',(-200,-120))],focus=['腎門','腎被膜']),
'node-05':dict(image=5,labels=[L('腎臟',260,330,'left',(-120,-95)),L('輸尿管',385,680,'left',(-120,-60)),L('膀胱',559,1050,'right',(150,-90)),L('尿道',552,1280,'right',(150,-90)),L('形成',220,400,'left',(-120,90)),L('運送',401,800,'left',(-120,90)),L('儲存',480,1080,'left',(-150,90)),L('排出',553,1355,'left',(-150,-20))],focus=['腎臟','形成']),
'node-06':dict(image=6,labels=[L('腎素',750,240),L('紅血球生成素（腎紅血球生成因子）',445,650),L('活化維生素D',470,1060)],focus=['腎素','紅血球生成素（腎紅血球生成因子）','活化維生素D'])}
spec=(ROOT/'docs/urinary-fluid-specs/kidney-anatomy.md').read_text()
manifest={'slug':'kidney-anatomy','focusStyle':FOCUS_STYLE,'focusSwitch':'scripts/kidney-anatomy-figures.py: FOCUS_STYLE','breakpoint':768,'fontSizes':{'desktop':DF,'mobile':MF},'figures':{}}
for slot,r in RECORDS.items():
 if slot=='overview':expected=re.search(r'總覽圖內候選白名單：([^。]+)',spec).group(1).split('、')
 else:
  block=spec.split('## 節點'+slot[-2:]+'：',1)[1].split('\n## ',1)[0];expected=re.search(r'圖內標籤候選白名單\*\*：([^。]+)',block).group(1).split('、')
 assert [l['text'] for l in r['labels']]==expected,(slot,expected)
 p=OUT/f'raster/kidney-anatomy/incoming/IMG-kidney-anatomy-{r["image"]:02d}.png';data=p.read_bytes();iw,ih=struct.unpack('>II',data[16:24]);enc=base64.b64encode(data).decode();asset=f'ka-asset-{slot}'
 mh=round(1700*ih/iw);my=40;tableY=my+mh+110;hm=tableY+len(r['labels'])*120+65+(160 if slot=='overview' else 0)
 special=slot in ['overview','node-06'];dw=900 if slot=='overview' else 1000;dx=700 if slot=='overview' else 640 if slot=='node-06' else 350;dy=55;scale=dw/iw;hd=round(dy+ih*scale+80+(270 if slot=='overview' else 0))
 uid='ka-'+slot
 css=f'''#{uid}{{--ka-focus-ink:{STYLE['ink']};--ka-focus-background:{STYLE['background']};--ka-focus-weight:{STYLE['weight']};aspect-ratio:1700 / {hm};height:auto!important}}
#{uid} .ka-desktop{{display:none;width:1700px!important;height:{hm}px!important;max-width:none}} #{uid} .ka-label{{fill:#111111;stroke:#fff;stroke-width:3;paint-order:stroke;stroke-linejoin:round;font-size:calc({DF}px * var(--font-scale,1));font-weight:400}}
#{uid} .ka-mobile .ka-label,#{uid} .ka-number{{font-size:calc({MF}px * var(--font-scale,1))}}
#{uid} .ka-lead{{fill:none;stroke:#333333;stroke-width:2.5}} #{uid} .ka-halo{{fill:none;stroke:white;stroke-width:8}}
#{uid} .ka-dot{{fill:#222;stroke:white;stroke-width:2}} #{uid} .ka-pin{{fill:white;stroke:#222;stroke-width:5}}
#{uid} .ka-number{{fill:#111111;font-weight:600;stroke:none}} #{uid} .ka-focus-bg{{fill:transparent}}
#{uid} .is-focus .ka-label{{fill:var(--ka-focus-ink);font-weight:var(--ka-focus-weight)}} #{uid} .is-focus .ka-focus-bg{{fill:var(--ka-focus-background)}}
@media(max-width:767px){{#{uid} .ka-desktop .ka-label{{font-size:calc({MF}px * var(--font-scale,1))}}}}
@media(min-width:768px){{#{uid}{{aspect-ratio:1700 / {hd}}}#{uid}>.ka-mobile{{display:none}}#{uid}>.ka-desktop{{display:inline}}}}
'''
 for state,names in r.get('states',{}).items():
  for j,l in enumerate(r['labels']):
   if l['text'] in names:
    selector=f'.state-figure[data-state="{state}"] #{uid} .ka-l{j}'
    css+=f'{selector} .ka-label{{fill:var(--ka-focus-ink);font-weight:var(--ka-focus-weight)}}{selector} .ka-focus-bg{{fill:var(--ka-focus-background)}}\n'
 # Local styling only, scoped to kidney container. Native pairing is the same
 # inverse Y mapping used by the accepted respiratory responsive SVG renderer.
 css+='.kit[data-slug="kidney-anatomy"] :is(.state-figure,.node-figure){max-height:none;max-width:100%;margin-inline:auto}'
 desktop=[f'<image href="#{asset}"/>'] if False else [f'<use href="#{asset}" x="{dx}" y="{dy}" width="{dw}" height="{ih*scale}" transform="translate({dx},{dy}) scale({scale}) translate({-dx},{-dy})"/>']
 # Assets retain original dimensions; use a single uniform transform per layout.
 desktop=[f'<use href="#{asset}" transform="translate({dx},{dy}) scale({scale})" data-raster-layout="desktop"/>']
 mobile=[f'<use href="#{asset}" transform="translate(0,{my}) scale({1700/iw})" data-raster-layout="mobile"/>']
 if slot=='overview':
  bottom=dy+ih*scale
  desktop.append(f'<rect data-callout-box="true" x="45" y="{bottom+5}" width="1610" height="310" rx="20" fill="#f5f8fb" stroke="#64748b" stroke-width="2"/><text data-callout-title="true" x="80" y="{bottom+45}" font-size="32" fill="#334155">內分泌功能</text>')
  fy=tableY+6*120
  mobile.append(f'<rect data-callout-box="true" x="20" y="{fy+10}" width="1660" height="510" rx="20" fill="#f5f8fb" stroke="#64748b" stroke-width="3"/><text data-callout-title="true" x="65" y="{fy+100}" font-size="76" fill="#334155">內分泌功能</text>')
 rows=[]
 for j,l in enumerate(r['labels']):
  text=l['text'];name=esc(text);cls='is-focus' if text in r['focus'] else '';anchor=l['anchor'];common=f'class="ka-l{j} {cls}" data-label="{name}"'
  record={'label':text,'index':j+1,'sourceAnchor':anchor,'sourceFile':str(p.relative_to(ROOT)),'sourceSize':[iw,ih],'focus':text in r['focus'],'conceptCallout':anchor is None,'layouts':{}}
  if anchor:
   ax,ay=dx+anchor[0]*scale,dy+anchor[1]*scale
   right=l['side']=='right' and not special;tx=1420 if right else 650 if slot=='overview' else 600 if slot=='node-06' else 280;align='start' if right else 'end';ex=1400 if right else tx+20
   # Horizontal leaders remain inside a dedicated margin until the anatomy.
   desktop.append(f'<g {common}><polyline class="ka-halo" points="{ex},{ay} {ax},{ay}"/><polyline class="ka-lead" data-leader="{j+1}" points="{ex},{ay} {ax},{ay}"/><circle class="ka-dot" data-anchor="{j+1}" cx="{ax}" cy="{ay}" r="6"/><text class="ka-label" data-direct-label="{name}" x="{tx}" y="{ay+11}" text-anchor="{align}">{name}</text></g>')
   record['layouts']['desktop']={'anchor':[ax,ay],'text':[tx,ay+11],'leader':[[ex,ay],[ax,ay]]}
   ma=[anchor[0]*1700/iw,my+anchor[1]*1700/iw];cx,cy=ma[0]+l['mobileOffset'][0],ma[1]+l['mobileOffset'][1]
   mobile.append(f'<g {common}><polyline class="ka-halo" points="{cx},{cy} {ma[0]},{ma[1]}"/><polyline class="ka-lead" data-leader="{j+1}" points="{cx},{cy} {ma[0]},{ma[1]}"/><circle class="ka-dot" data-anchor="{j+1}" cx="{ma[0]}" cy="{ma[1]}" r="8"/><circle class="ka-pin" cx="{cx}" cy="{cy}" r="53"/><text class="ka-number" data-pin="{j+1}" x="{cx}" y="{cy+27}" text-anchor="middle">{j+1}</text></g>')
   record['layouts']['mobile']={'anchor':ma,'pin':[cx,cy],'leader':[[cx,cy],ma]}
  else:
   k=j-6;y=dy+ih*scale+100+k*80
   desktop.append(f'<g {common}><rect class="ka-focus-bg" x="90" y="{y-43}" width="1520" height="65" rx="12"/><text class="ka-label" data-direct-label="{name}" x="850" y="{y}" text-anchor="middle">{name}</text></g>')
   record['layouts']['desktop']={'text':[850,y],'leader':None};record['layouts']['mobile']={'leader':None}
  y=tableY+j*120+(160 if slot=='overview' and j>=6 else 0)
  mobile.append(f'<g {common} data-key="{j+1}"><rect class="ka-focus-bg" x="20" y="{y-10}" width="1660" height="110" rx="12"/><text class="ka-number" data-number-key="{j+1}" x="70" y="{y+72}">{j+1}</text><text class="ka-label" data-legend-label="{name}" x="180" y="{y+72}">{name}</text></g>')
  record['layouts']['mobile']['text']=[180,y+72];rows.append(record)
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" viewBox="0 0 1700 {hm}" preserveAspectRatio="none" role="img" aria-label="{esc(slot)} 腎臟教學圖" font-family="PingFang TC,Noto Sans TC,sans-serif"><style>{css}</style><defs><image id="{asset}" href="data:image/png;base64,{enc}" width="{iw}" height="{ih}"/></defs><g class="ka-mobile">{''.join(mobile)}</g><svg class="ka-desktop" x="0" y="0" width="1700" height="{hm}" viewBox="0 0 1700 {hd}" preserveAspectRatio="none">{''.join(desktop)}</svg></svg>\n'''
 (OUT/f'kidney-anatomy-{slot}.svg').write_text(svg)
 manifest['figures'][slot]={'source':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(data).hexdigest(),'sourceSize':[iw,ih],'viewBoxes':{'mobile':[1700,hm],'desktop':[1700,hd]},'imageTransforms':{'mobile':{'x':0,'y':my,'scale':1700/iw},'desktop':{'x':dx,'y':dy,'scale':scale}},'labels':rows,'states':r.get('states',{}),'focus':r['focus'],'arrows':[]}
E.mkdir(parents=True,exist_ok=True);(E/'anchors.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# B-authorized content keys only; A was already verified independently.
p=ROOT/'materials-src/kidney-anatomy/content.json';c=json.loads(p.read_text());c['lab']['figure']='kidney-anatomy-overview.svg';c['lab']['intro']='依序切換位置、切面與功能，先定位雙腎，再辨認皮質、髓質與收集區，最後連結腎臟的內分泌角色。'
captions=['前面觀與橫切面對照腎臟、脊柱及腹膜的位置關係。','腎臟切面中，辨認外圍皮質、內部髓質與錐體間的腎柱。','沿腎乳頭、小腎盞、大腎盞與腎盂追蹤尿液的收集通路。','對照內側腎門與由內而外的腎被膜、脂肪囊和腎筋膜。','將腎臟、輸尿管、膀胱與尿道配對形成、運送、儲存和排出尿液的分工。','三格依序呈現腎素、紅血球生成素（腎紅血球生成因子）與活化維生素D的功能訊息。']
for i,n in enumerate(c['nodes']):n['figure']=f'kidney-anatomy-node-{i+1:02d}.svg';n['caption']=captions[i]
c['credits'][1]='底圖由 ChatGPT 製作；中文標籤與引線以原生 SVG 呈現。';p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
print('Kidney-only seven responsive SVGs created; exact spec labels, 35 anchored leaders, three unanchored functional overview callouts; PNGs unchanged.')
