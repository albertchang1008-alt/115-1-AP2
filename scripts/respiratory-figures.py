"""Dedicated schematic diagrams from approved node concepts (no outside facts)."""
import json,re,math
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'materials-src/figures'
SLUGS=['airway-structure','lungs-pleura','breathing-mechanics','lung-function','gas-exchange','o2-co2-transport','respiratory-control']
def text(x,y,s,size=23,anchor='middle'):
 return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="#172b42">{escape(s)}</text>'
def path(d,color='#267899',w=7):return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'
def svg(body,h=480):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 {h}" role="img" style="font-family:system-ui,sans-serif"><rect width="480" height="{h}" rx="20" fill="#f0f7fa"/>{body}</svg>'
def lines(s):
 # Reading diagrams preserve source phrases, wrap at fixed readable type size.
 return [s[i:i+17] for i in range(0,len(s),17)]
def flow(title,items):
 body=text(240,37,title);y=65
 for i,item in enumerate(items):
  ls=lines(item);h=20+30*len(ls)
  body+=f'<rect x="20" y="{y}" width="440" height="{h}" rx="12" fill="white" stroke="#8cbcc8"/>'+''.join(text(240,y+30+j*30,l) for j,l in enumerate(ls));y+=h
  if i<len(items)-1:body+=path(f'M240 {y+4} v22',w=3)+f'<path d="M233 {y+17} l7 12 l7 -12" fill="#267899"/>';y+=38
 return svg(body,y+20)
def write(name,data):(OUT/name).write_text(data)
for slug in SLUGS:
 c=json.loads((ROOT/'materials-src'/slug/'content.json').read_text())
 for n in c['nodes']:
  items=[x.strip() for x in re.split('[；。]',n['concept']) if x.strip()]
  write(n['figure'],flow(n['title'],items))
 # State-specific panels inside the SVG; the existing kit changes data-state.
 panels='';maxh=0
 for i,s in enumerate(c['lab']['states']):
  items=[x.strip() for x in re.split('[；。]',s['explain'].split('：',1)[-1]) if x.strip()]
  panel=flow(s['label'],items);height=int(re.search(r'viewBox="0 0 480 (\d+)"',panel).group(1));maxh=max(maxh,height)
  panels+=f'<g class="resp-panel resp-state-{i+1}">'+re.sub(r'^<svg[^>]*>|</svg>$','',panel)+'</g>'
 style='<style>.resp-panel{display:none}'+''.join(f'.state-figure[data-state="state-{i}"] .resp-state-{i}{{display:block}}' for i in range(1,4))+'</style>'
 write(slug+'-overview.svg',svg(style+panels,maxh))
# Anatomical silhouettes and branching models replace prose-only charts where required.
# Face points left: anterior airway is image-left, posterior esophagus image-right.
head=path('M320 70 Q235 25 163 85 L139 119 L107 139 L142 153 L131 184 Q145 219 189 237 L189 345 M320 70 Q376 165 318 245 L313 345','#607e92',4)
head+=path('M148 140 Q191 117 249 137 L270 155 L270 223 L254 270 L254 345','#dc846c',13)
head+=path('M151 188 H241 M241 188 L259 203','#c36980',6)
head+=path('M279 230 L296 271 V345','#9c779f',12)
head+=path('M239 233 L250 215','#77a16c',8)
head+=text(75,88,'前',20)+text(394,88,'後',20)
head+=text(76,128,'鼻腔',20)+path('M104 125 L171 137',w=2)
head+=text(384,137,'鼻咽',20)+path('M350 134 L270 155',w=2)
head+='<circle cx="274" cy="158" r="5" fill="#267899"/>'+text(384,175,'耳咽管口',20)+path('M339 170 L280 158',w=2)
head+=text(75,185,'口腔',20)+text(74,225,'軟腭',20)+path('M108 219 L243 188',w=2)
head+=text(384,212,'口咽',20)+path('M349 208 L270 208',w=2)
head+=text(384,251,'喉咽',20)+path('M349 248 L269 233',w=2)
head+=text(76,271,'會厭',20)+path('M109 266 L243 225',w=2)
head+=text(178,307,'喉',20)+path('M193 300 L254 271',w=2)
head+=text(227,389,'氣管',20)+path('M242 365 L254 328',w=2)
head+=text(330,389,'食道',20)+path('M313 365 L296 328',w=2)
head+=text(240,442,'矢狀切面示意・構造非等比例',22)
for i,title in [(1,'咽的三段'),(2,'鼻咽與耳咽管'),(4,'聲帶與會厭・側視')]:
 write(f'airway-structure-node-{i:02}.svg',svg(text(240,32,title)+head))
write('airway-structure-node-03.svg',svg(text(240,32,'九塊喉軟骨・位置示意')+head+text(240,490,'單一：甲狀、會厭、環狀',22)+text(240,529,'成對：杓狀、小角、楔狀',22)+text(240,568,'甲狀軟骨形成喉結',22),600))
tree=path('M240 62 V137',w=17)+path('M240 137 L212 197',w=22)+path('M240 137 L324 217',w=14)+path('M212 197 L146 263 M212 197 L224 263 M324 217 L293 274 M324 217 L378 274',w=11)+path('M146 263 L98 320 M146 263 L164 320 M224 263 L223 320 M293 274 L270 320 M378 274 L400 320',w=9)
tree+=text(240,39,'主支氣管與支氣管樹')+text(152,175,'右')+text(365,187,'左')+text(240,359,'主 → 次級 → 三級')+text(240,394,'→ 細支氣管 → 終末')+text(240,435,'右側較短、寬、垂直')
write('airway-structure-node-06.svg',svg(tree))
# Right lung is image-left in the front-facing model.
lung=path('M208 64 Q71 88 64 293 Q74 362 211 329 Z','#267899',6)+path('M274 64 Q407 99 416 290 Q397 355 271 328 L271 219 Q323 218 287 169 Z','#c36980',6)
lung+=path('M208 211 H83 M83 211 L208 329',w=3)+path('M279 284 L395 190','#c36980',3)
lung+=text(145,133,'上葉')+text(167,245,'中葉')+text(113,292,'下葉')+text(338,132,'上葉')+text(344,294,'下葉')+text(120,393,'右肺・三葉')+text(355,393,'左肺・兩葉')+text(343,205,'心切跡',20)+path('M310 201 L283 206','#c36980',2)+text(240,442,'前視示意：圖左為人體右側')
write('lungs-pleura-node-01.svg',svg(text(240,32,'肺葉與肺裂')+lung))
cells='<ellipse cx="240" cy="235" rx="132" ry="105" fill="white" stroke="#267899" stroke-width="5"/><path d="M116 196 Q135 155 174 143" fill="none" stroke="#cb5478" stroke-width="10"/><ellipse cx="368" cy="259" rx="19" ry="25" fill="#deb95d" stroke="#ac852e" stroke-width="3"/><circle cx="235" cy="248" r="20" fill="#77bda6"/>'
cells+=text(240,38,'肺泡三種細胞')+text(142,93,'第一型：薄扁肺泡壁',21)+path('M143 105 L138 167','#cb5478',2)
cells+=text(318,387,'第二型：嵌在壁上',21)+path('M344 362 L366 286','#ac852e',2)
cells+=text(190,432,'巨噬細胞：游離腔內',21)+path('M198 406 L231 271','#77bda6',2)
write('lungs-pleura-node-04.svg',svg(cells))
# Curve anchored to the textbook 40 mmHg / ~75%; equation only draws a schematic.
def curve(shift=0):
 pts=[]
 for p in range(0,101,2):
  k=26+shift;s=100*p**2.7/(k**2.7+p**2.7) if p else 0
  pts.append(f'{60+p*3.6:.1f},{350-s*2.7:.1f}')
 return path('M'+' L'.join(pts),'#bb476a',5)
axes=path('M60 63 V350 H428','#607e92',3)+text(95,43,'飽和度 %')+text(350,399,'PO₂ mmHg')+text(43,352,'0',20)+text(43,88,'100',20)+text(60,381,'0',20)+text(204,381,'40',20)+text(420,381,'100',20)
write('o2-co2-transport-node-03.svg',svg(axes+curve()+text(240,443,'PO₂ 40 → 飽和度約 75%')))
write('o2-co2-transport-node-04.svg',svg(axes+curve(-5).replace('#bb476a','#267899')+curve()+curve(5).replace('#bb476a','#dc9851')+text(240,443,'左移：親和力 ↑　右移：釋氧 ↑')))
# Interactive lab: curves respond to state controls and pointer/range in kit.
normal=curve(0).replace('stroke-width="5"','stroke-width="3" stroke-dasharray="9 7"').replace('#bb476a','#607e92')
panels=''.join(f'<g class="resp-panel resp-state-{i}">'+(normal if shift else '')+curve(shift)+'</g>' for i,shift in [(1,0),(2,5),(3,-5)])
style='<style>.resp-panel{display:none}'+''.join(f'.state-figure[data-state="state-{i}"] .resp-state-{i}{{display:block}}' for i in range(1,4))+'</style>'
write('o2-co2-transport-overview.svg',svg(style+axes+panels+'<circle class="oxygen-probe" cx="204" cy="148" r="8" fill="#267899"/>'+text(240,443,'拖曳圖面或調整下方 PO₂')))
print('49 dedicated SVGs generated')
def state_svg(slug,panels,h=480):
 style='<style>.resp-panel{display:none}'+''.join(f'.state-figure[data-state="state-{i}"] .resp-state-{i}{{display:block}}' for i in range(1,4))+'</style>'
 write(slug+'-overview.svg',svg(style+''.join(f'<g class="resp-panel resp-state-{i+1}">{b}</g>' for i,b in enumerate(panels)),h))
# Alveolar sizes and required pressure: arrows encode direction, no added numbers.
panels=[]
for label,small,desc in [('張力相同',46,'小肺泡所需壓力較大'),('有表面張力素',66,'張力降低・減少塌陷'),('表面張力素不足',30,'肺泡不易維持擴張')]:
 panels.append(text(240,38,label)+f'<circle cx="130" cy="205" r="{small}" fill="#dcedf5" stroke="#267899" stroke-width="6"/><circle cx="340" cy="205" r="94" fill="#dcedf5" stroke="#267899" stroke-width="6"/>'+text(130,330,'小肺泡')+text(340,330,'大肺泡')+text(240,397,'P＝2T/r')+text(240,443,desc))
state_svg('lungs-pleura',panels)
panels=[]
for label,ip,pleural,direction in [('吸氣前',760,758,'肺內壓＝大氣壓・無氣流'),('吸氣',758,754,'肺內壓較低・空氣流入'),('平靜呼氣','較高','通常較低','肺內壓較高・空氣流出')]:
 b=text(240,32,label)+text(240,78,'口鼻端・大氣壓 760 mmHg',22)
 b+=path('M90 126 Q42 224 84 345 M390 126 Q438 224 396 345',w=5)+path('M84 345 Q240 383 396 345','#c36980',5)
 b+='<path d="M213 159 Q104 170 110 307 Q139 338 212 318 Z M267 159 Q376 170 370 307 Q341 338 268 318 Z" fill="#d7ebf1" stroke="#267899" stroke-width="4"/>'
 b+=path('M240 99 V149 M240 149 L187 184 M240 149 L293 184',w=8)
 b+=text(240,227,f'肺內壓 {ip}',22)+text(240,275,f'胸內壓 {pleural}',22)+path('M314 278 L399 294',w=2)
 b+=text(240,319,'胸膜腔位於肺與胸壁之間',20)+text(240,405,direction,22)
 if label=='吸氣':b+=path('M273 98 V133','#c36980',3)+'<path d="M267 124 l6 10 l6 -10" fill="#c36980"/>'
 elif label=='平靜呼氣':b+=path('M273 133 V98','#c36980',3)+'<path d="M267 108 l6 -10 l6 10" fill="#c36980"/>'
 panels.append(b+text(240,452,'胸廓、肺與胸膜腔示意',21))
state_svg('breathing-mechanics',panels)
panels=[]
for label,tv,f,va in [('淺快',150,40,0),('一般',500,12,4200),('深慢',1000,6,5100)]:
 b=text(240,38,label)+text(240,91,f'{tv} mL × {f} 次＝6000')+text(240,135,'總通氣量皆為 6000 mL/min')
 b+='<rect x="60" y="185" width="360" height="50" fill="#e3c498"/>'+f'<rect x="60" y="270" width="{360*va/6000}" height="50" fill="#267899"/>'
 b+=text(240,219,'總通氣 6000',22)+text(240,366,f'肺泡通氣 {va} mL/min')+text(240,421,'VA＝（TV－150）× F',22)
 panels.append(b)
state_svg('lung-function',panels)
panels=[]
for label,width,area in [('正常',12,300),('膜變厚',48,300),('交換面積減少',12,135)]:
 b=text(240,38,label)+f'<rect x="{240-width/2}" y="88" width="{width}" height="{area}" fill="#ceac9b"/>'+text(94,133,'肺泡')+text(378,133,'血液')
 b+=path('M99 213 H187','#c36980',4)+'<path d="M176 205 l12 8 l-12 8" fill="#c36980"/>'+text(131,192,'O₂')+path('M378 293 H289',w=4)+'<path d="M302 285 l-12 8 l12 8" fill="#267899"/>'+text(342,274,'CO₂')
 b+=text(240,421,'膜厚 ↑ 或面積 ↓ → 擴散 ↓',22)
 panels.append(b)
state_svg('gas-exchange',panels)
# Head/neck lab uses anatomy instead of a paragraph as the visual.
state_svg('airway-structure',[text(240,32,s)+head for s in ['鼻咽・耳咽管開口','喉・吞嚥保護','氣管・C 形軟骨環']])
# Third panel adds a true tracheal transverse schematic, posterior gap facing esophagus.
p='airway-structure-overview.svg';s=(OUT/p).read_text();a=s.index('<g class="resp-panel resp-state-3">');s=s[:a]+'<g class="resp-panel resp-state-3">'+text(240,32,'氣管橫切示意')+path('M165 118 A115 115 0 1 0 315 118','#267899',18)+path('M165 118 H315','#c36980',9)+'<ellipse cx="240" cy="75" rx="65" ry="28" fill="#edd6d9"/>'+text(240,83,'食道',21)+text(240,223,'氣管腔')+text(240,382,'缺口朝後方食道')+text(240,426,'軟骨環支撐・平滑肌相連')+'</g></svg>';(OUT/p).write_text(s)
