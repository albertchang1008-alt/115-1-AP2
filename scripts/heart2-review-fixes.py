"""Targeted Heart II review fixes. Assessment IDs/questions and Excel are untouched."""
import json,re,html
from pathlib import Path
R=Path(__file__).resolve().parents[1];F=R/'materials-src/figures'
INK='#17212b';GREEN='#176b45';PURPLE='#8250a0';RED='#a71930'
def text(x,y,s,anchor='start',color=INK):return f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{color}">{html.escape(s)}</text>'
def path(d,c=INK,w=3):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def svg(title,body,w=400,h=400,size=18):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title}</title><style>text{{font-family:system-ui,sans-serif;font-size:calc({size}px * var(--font-scale,1))}}</style><rect width="{w}" height="{h}" rx="12" fill="#fafbfd"/>{text(12,32,title)}{body}</svg>'
def save(name,title,body,**kw): (F/name).write_text(svg(title,body,**kw))
# Same y axis, same baseline, exact volume segments; four columns in a single row.
states=[('base','基準',120,50),('preload','前負荷↑',140,50),('contractility','收縮力↑',120,35),('afterload','後負荷↑',120,65)]
b='<style>'+''.join(f'[data-state="{s}"] .volume:not(.{s}){{opacity:.25}}' for s,_,_,_ in states)+'</style>'
for v in range(0,161,40):
 y=370-v*1.8;b+=f'<path d="M85 {y}H588" stroke="#b9c4cd" stroke-width="1" stroke-dasharray="3 4"/>'+text(72,y+9,str(v),'end')
b+=text(12,66,'mL')
for i,(sid,name,edv,esv) in enumerate(states):
 x=110+i*120;top=370-edv*1.8;sv=edv-esv;split=370-esv*1.8
 b+=f'<g class="volume {sid}" data-volume="{sid}" data-edv="{edv}" data-esv="{esv}"><rect data-esv-segment x="{x}" y="{split}" width="70" height="{esv*1.8}" fill="#a5b2bf"/><rect data-sv-segment x="{x}" y="{top}" width="70" height="{sv*1.8}" fill="{GREEN}"/><rect x="{x}" y="{top}" width="70" height="{edv*1.8}" stroke="#64748b" fill="none"/>'+text(x+35,top-12,str(edv),'middle')+text(x+35,top+sv*.9+8,f'SV {sv}','middle','#fff')+text(x+35,split+esv*.9+8,f'ESV {esv}','middle')+text(x+35,407,name,'middle')+'</g>'
b+=text(12,448,'綠＝心搏量；灰＝剩餘量；總高＝EDV')
save('cardiac-output-overview.svg','四種心室容積｜示意數值',b,w=600,h=480,size=26)
# Opposing force arrows scale by value. Left side means outside, right side means inside.
def tug(a,b,y):
 winner='外' if a>b else '內';knot=250 if a>b else 350
 s=text(12,y+38,f'外側 ←　靜水壓 {a}　｜　膠體滲透壓 {b} → 血管內')
 s+=path(f'M95 {y+95}H505','#74828d',4)+f'<circle data-tug-knot cx="{knot}" cy="{y+95}" r="9" fill="{INK}"/>'
 s+=path(f'M{knot} {y+95}H65l20-13m-20 13 20 13',PURPLE,a/5)+path(f'M{knot} {y+95}H535l-20-13m20 13-20 13',PURPLE,b/5)
 x1,x2=(310,180) if a>b else (290,381)
 s+=path(f'M{x1} {y+155}H{x2}l{20 if a>b else -20}-12m{-20 if a>b else 20} 12l{20 if a>b else -20} 12',GREEN,6)
 s+=text(12,y+208,f'{"動脈端" if a>b else "靜脈端"}：向{winner} {abs(a-b)}（示意 mmHg）')
 return s
save('capillary-exchange-node-05.svg','拔河：外推與內拉的淨結果',tug(35,25,35)+tug(18,25,270),w=600,h=530,size=26)
# Three different hose pinch geometries and matching flow.
b=''
for i,(title,gap,flow) in enumerate([('捏死：無水流',0,''),('半捏：斷續衝過',9,'M255 231q14-17 27 0t27 0t27 0'),('放開：平順流動',32,'M255 371H355l-14-9m14 9-14 9')]):
 y=95+i*140;b+=text(14,y-24,title)
 top=y-16;bottom=y+16
 if gap==0: d=f'M25 {top}H145Q176 {top} 194 {y}H206Q224 {top} 255 {top}H275V{bottom}H255Q224 {bottom} 206 {y}H194Q176 {bottom} 145 {bottom}H25Z'
 else:d=f'M25 {top}H145Q175 {top} 194 {y-gap/2}H206Q225 {top} 255 {top}H275V{bottom}H255Q225 {bottom} 206 {y+gap/2}H194Q175 {bottom} 145 {bottom}H25Z'
 b+=f'<path d="{d}" fill="#f5cdd0" stroke="{RED}" stroke-width="3"/>'+path(f'M193 {y-45}L196 {y-gap/2-4}M207 {y+45}L204 {y+gap/2+4}',PURPLE,8)
 if flow:b+=path(flow,GREEN,4)
b+=text(12,450,'水管比喻：壓脈帶改變血管開放程度')
save('blood-pressure-measurement-node-01.svg','澆花水管：捏住到放開',b,h=480)
# Two pacemaker cycles, with gradual phase 4, a slower rising phase 0 and repolarization.
p=F/'cardiac-electrical-aligned.svg';s=p.read_text();s=s.replace('M30 165Q50 162 85 120L100 90L115 165H380','M30 165C45 162 68 148 88 125C98 110 108 92 119 86C130 83 143 122 153 165C169 162 195 147 216 125C228 109 238 93 249 86C260 83 273 123 283 165C308 160 335 146 355 125')
s=s.replace('M30 120H130','M30 125H380').replace('x="135" y="130"','x="20" y="189"').replace('閾值；去極化在 P 之前','緩慢節律電位 → 閾值 → 上升 → 再極化')
# The longer caption is split into two short lines at the source, without modifying teaching text.
s=s.replace('緩慢節律電位 → 閾值 → 上升 → 再極化</text>','節律電位 → 閾值</text><text x="225" y="189">上升 → 再極化</text>')
s=s.replace('M30 330H180L190 240L215 255H275L325 330H380','M30 330H155L163 240L174 255H190L220 330H285L293 240L304 255H320L350 330H380')
s=s.replace('M30 480H115q12-35 25 0H176l7 20 7-65 7 83 8-38H275q25-45 50 0H380','M30 480H115q12-35 25 0H150l7 20 6-65 7 83 8-38H190q16-45 30 0H245q12-35 25 0H280l7 20 6-65 7 83 8-38H320q16-45 30 0H380')
for old,new in [('158','142'),('206','171'),('245','193'),('300','207'),('355','245')]:
 s=s.replace(f'x="{old}" y="'+('310' if old=='158' else '241' if old in ['206','245'] else '285' if old=='300' else '315')+'"',f'x="{new}" y="'+('310' if old=='158' else '241' if old in ['206','245'] else '285' if old=='300' else '315')+'"')
for old,new in [('M190 230V520','M163 230V520'),('M250 230V520','M185 230V520'),('M310 230V520','M209 230V520')]:s=s.replace(old,new)
s=s.replace('x="168" y="420"','x="150" y="420"').replace('x="235" y="462"','x="185" y="462"').replace('x="297" y="430"','x="207" y="430"')
p.write_text(s)
p=F/'cardiac-electrical-relay.svg';s=p.read_text();s=re.sub(r'<g aria-label="接力棒".*?</g>', '', s);s=s.replace('</svg>','<g aria-label="接力棒" fill="#dfb74e" stroke="#806515" stroke-width="2">'+''.join(f'<rect x="28" y="{y}" width="24" height="8" rx="4" transform="rotate(-28 40 {y+4})"/>' for y in [110,195,280,365])+'</g></svg>');p.write_text(s)
# Only authorized prediction options/answer, two route display strings, and the new misconception.
answers={'cardiac-output':['增加','減少','不變','變為零'],'blood-pressure-measurement':['收縮壓','舒張壓','脈壓','平均動脈壓'],'capillary-exchange':['由血管往組織間隙','由組織間隙回到血管','不移動','直接進入淋巴管'],'major-vessels':['左鎖骨下動脈','頭臂動脈','左頸總動脈','右鎖骨下動脈'],'blood-types':['A 型','B 型','AB 型','O 型'],'lymphoid-organs':['胸腺','骨髓','脾臟','淋巴結']}
for slug,options in answers.items():
 p=R/'materials-src'/slug/'content.json';c=json.loads(p.read_text());order=[2,0,3,1];c['lab']['predict']['options']=[options[i] for i in order];c['lab']['predict']['answer']=order.index(0)
 if slug=='major-vessels':
  for state in c['lab']['states']:
   if state['id'] in ['left-foot','stomach']:state['explain']=state['explain'].replace('左心室→主動脈→腹主動脈','左心室→升主動脈→主動脈弓→胸主動脈→腹主動脈')
  row={'wrong':'主動脈所有彎曲的地方都叫主動脈弓','correct':'主動脈弓不是主動脈所有彎曲的地方；只指發出三條分支的那一段（頭臂動脈起點到左鎖骨下動脈起點之後）。'}
  if row not in c['misconceptions']:c['misconceptions'].append(row)
 p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
