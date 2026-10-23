#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path
import json,re,html
R=Path(__file__).resolve().parents[1];O=R/'materials-src/figures';E=R/'docs/urinary-release/data'
def T(text,x,y,label=None):return f'<text x="{x}" y="{y}"'+(f' class="ka-label" data-label="{html.escape(label,quote=True)}"'if label else'')+'>'+html.escape(text)+'</text>'
def B(value,total,y,color='#0072B2',x=50,full=900,outline=False):
 assert full%total==0
 stroke=' stroke="#94a3b8" stroke-width="2"'if outline else''
 return f'<rect x="{x}" y="{y}" width="{full}" height="32" fill="#edf1f5"{stroke}/><rect x="{x}" y="{y}" width="{full//total*value}" height="32" fill="{color}" data-bar="true" data-value="{value}" data-total="{total}" data-full-width="{full}"/>'
def B2(v1,v2,total,y,c1='#0072B2',c2='#56B4E9',x=50,full=900):
 assert full%total==0 and v1+v2==total;w1=full//total*v1;w2=full//total*v2
 return f'<rect x="{x}" y="{y}" width="{w1}" height="32" fill="{c1}" data-bar="true" data-value="{v1}" data-total="{total}" data-full-width="{full}"/><rect x="{x+w1}" y="{y}" width="{w2}" height="32" fill="{c2}" data-bar="true" data-value="{v2}" data-total="{total}" data-full-width="{full}"/>'
rows=[]
for slug,slot in [('fluid-compartments','overview')]+[('fluid-compartments',f'node-{i:02d}')for i in [1,2,3,4,6]]+[('electrolyte-balance','node-03'),('acid-base-homeostasis','node-02')]:
 p=R/f'materials-src/{slug}/content.json';c=json.loads(p.read_text());spec=(R/f'docs/urinary-fluid-specs/{slug}.md').read_text();uid='ud-'+slug+'-'+slot;states={};focus=[]
 if slot=='overview':
  labels=re.search(r'總覽圖內候選白名單：([^。]+)',spec).group(1).split('、');sources=list(dict.fromkeys(s for n in c['nodes']for s in n['sources']))
  for line in spec.splitlines():
   if line.startswith('| state-'):
    a=[x.strip()for x in line.split('|')[1:-1]];states[a[0][:7]]=a[3].split('、')
 else:
  n=c['nodes'][int(slot[-2:])-1];sources=n['sources'];block=spec.split('## 節點'+slot[-2:]+'：')[1].split('\n## ')[0];labels=re.search(r'圖內標籤候選白名單\*\*：([^。]+)',block).group(1).split('、');focus=re.search(r'紅色粗體候選\*\*：([^。]+)',block).group(1).split('、')
 parts=[];values=[];height=1100
 if slug=='fluid-compartments' and slot=='overview':
  parts=[T('總水量',50,90,'總水量'),T('60%',200,90),T('體重',560,90,'體重'),T('100%',665,90),B(60,100,130,outline=True),T('全長＝體重；藍色段＝總水量 60%',50,240),T('細胞內液',50,420,'細胞內液'),T('2/3',240,420),T('細胞外液',650,420,'細胞外液'),T('1/3',840,420),B2(2,1,3,460),T('內液2/3（深藍）、外液1/3（淺藍）',50,570),T('血漿',50,750,'血漿'),T('20%',150,750),T('組織間液',320,750,'組織間液'),T('80%',510,750),B2(20,80,100,790),T('血漿20%（深藍）、組織間液80%（淺藍）',50,900),T('個別差異：皆以體重 100% 為分母',50,1080),T('成年男性65%',50,1210),B(65,100,1250,outline=True),T('成年女性55%',50,1400),B(55,100,1440,outline=True)];height=1560;values=[60,2/3,1/3,.2,.8,65,55]
 elif slug=='fluid-compartments' and slot=='node-01':
  parts=[T('總水量',50,120,labels[1]),T('60%標準示例',210,120,labels[2]),T('體重',560,120,labels[0]),T('100%',665,120),B(60,100,170,outline=True),T('全長＝體重；藍色段＝總水量 60%',50,310),T('分母：體重；單位：%',50,460),T('其餘 40% 底框部分不屬於總水量',50,610)];height=750;values=[60]
 elif slug=='fluid-compartments' and slot=='node-02':
  parts=[T('總水量',50,120,'總水量'),T('100%（共同分母）',200,120),T('細胞內液',50,290,'細胞內液'),T('2/3',240,290,'2/3'),T('細胞外液',650,290,'細胞外液'),T('1/3',840,290,'1/3'),B2(2,1,3,340),T('內液2/3（深藍）、外液1/3（淺藍）',50,480),T('共同分母：總水量',50,630)];height=770;values=[2/3,1/3]
 elif slug=='fluid-compartments' and slot=='node-03':
  parts=[T('細胞外液',50,100,'細胞外液'),T('血漿',50,300,'血漿'),T('20%',50,420,'20%'),B(20,100,470),T('組織間液',50,650,'組織間液'),T('80%',50,770,'80%'),B(80,100,820),T('共同分母：細胞外液；單位：%',50,1000)];values=[20,80]
 elif slug=='fluid-compartments' and slot=='node-04':
  for i,(label,value)in enumerate(zip(labels,[40,20,4,16])):
   parts.extend([T(label,50,100+i*220,label),B(value,100,150+i*220)])
  parts.extend([T('共同分母：體重；單位：%',50,1050),T('4%與16%已包含在外液20%內',50,1190)]);height=1280;values=[40,20,4,16]
 elif slug=='fluid-compartments':
  for i,(label,value)in enumerate(zip(labels[:4],[65,55,77,47])):parts.extend([T(label,50,100+i*220,label),B(value,100,150+i*220)])
  parts.extend([T('脂肪',50,1040,'脂肪'),T('比例不同，含水比例也會不同',50,1150),T('共同分母：體重；單位：%',50,1270)]);height=1360;values=[65,55,77,47]
 elif slug=='electrolyte-balance':
  parts=[T('mEq/L',50,100,'mEq/L'),T('電荷當量濃度',50,220),T('價數',50,430,'價數'),T('每種離子攜帶的電荷',50,550),T('滲透粒子數',50,760,'滲透粒子數'),T('計算所有解離後粒子',50,880),T('價數不等於粒子總數',50,1030)];height=1130
 else:
  parts=[T('HCO₃⁻',50,100,'HCO₃⁻'),T('鹼：放在分子',50,220),T('H₂CO₃',50,420,'H₂CO₃'),T('酸：放在分母',50,540),T(labels[2],50,770,labels[2]),T(labels[3],50,970,labels[3])];height=1080;values=[6.1,26,1.3,7.4]
 css=f'#{uid} text {{font-size:42px;fill:#111}}#{uid} .ka-label{{font-size:42px}}.kit[data-slug="{slug}"] :is(.state-figure,.node-figure){{max-height:none}}'
 for label in focus:
  css+=f'#{uid} [data-label="{label}"]{{fill:#b4233a;font-weight:700}}'
 for state,names in states.items():
  for label in names:css+=f'.state-figure[data-state="{state}"] #{uid} [data-label="{label}"]{{fill:#b4233a;font-weight:700}}'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" viewBox="0 0 1000 {height}" role="img" aria-label="{html.escape(slug+" "+slot)}" font-family="PingFang TC,Noto Sans TC,sans-serif"><style>{css}</style><rect width="1000" height="{height}" fill="white"/>'+''.join(parts)+'</svg>\n';file=slug+'-'+slot+'-data.svg';(O/file).write_text(svg)
 if slot=='overview':c['lab']['figure']=file
 else:c['nodes'][int(slot[-2:])-1]['figure']=file
 p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n');rows.append(dict(slug=slug,slot=slot,id=uid,figure=file,sources=sources,labels=labels,values=values,focus=focus,states=states,chart='native-svg'))
p=E/'slots.json';old=[x for x in json.loads(p.read_text())if x['slug']not in ['fluid-compartments','electrolyte-balance','acid-base-homeostasis']];p.write_text(json.dumps(old+rows,ensure_ascii=False,indent=2)+'\n');print('Created',len(rows),'native fluid data figures.')
p=R/'materials-src/kit/presentation.mjs';s=p.read_text();new=','.join("'"+slug+"':210"for slug in ['fluid-compartments','water-sodium-regulation','electrolyte-balance','acid-base-homeostasis'])
if "'fluid-compartments':210"not in s:
 assert "'urinary-route-micturition':176};"in s;s=s.replace("'urinary-route-micturition':176};","'urinary-route-micturition':176,"+new+'};');p.write_text(s)
