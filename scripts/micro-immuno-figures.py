"""Teacher-reviewed raster sources plus editable SVG labels; no source PNGs copied."""
from pathlib import Path
from PIL import Image
import base64, io, json, html, math, re, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'materials-src/figures'
SOURCE = Path('/Users/HHC/Downloads/fig/final')
data = {
 'B01': [('細胞壁',.20,.36),('細胞膜',.21,.373),('核區（環狀 DNA）',.27,.44),('核糖體（70S）',.27,.51),('質體',.40,.47),('鞭毛',.069751,.408840),('線毛',.222376,.309392),('細胞核',.70,.36),('核仁',.66,.33),('粒線體',.68,.14),('內質網',.82,.35),('高基氏體',.74,.57),('溶小體',.61,.56),('球菌（葡萄狀）',.13,.85),('球菌（鏈狀）',.35,.84),('桿菌',.60,.86),('螺旋菌',.82,.85)],
 'B02': [('磷壁酸',.32,.31),('厚肽聚醣',.22,.52),('細胞膜',.22,.70),('脂多糖（內毒素）',.647786,.308160),('外膜',.720703,.386285),('孔蛋白',.62,.42),('脂蛋白',.69,.49),('薄肽聚醣',.71,.53),('周質空間',.79,.59),('細胞膜',.779948,.664062)],
 'B03': [('細菌',.20,.39),('外毒素',.415,.552),('受體',.252,.608),('宿主細胞',.22,.75),('菌體破裂',.773480,.441989),('脂多糖',.80,.67),('紅血球',.76,.73)],
 'B04': [('傳染窩（第一床傷口）',.156,.546),('接觸傳播（手）',.419,.500),('共用聽診器',.442680,.610497),('潮濕水槽',.926,.405),('入口（第二床傷口）',.469,.296),('易感宿主',.454,.169),('手部衛生（乾洗手液）',.892,.244),('手部衛生（洗手台）',.946,.370)],
 'B05': [('滅菌：高壓蒸氣 121℃ 15 分鐘',.22,.48),('消毒：環境表面',.609807,.419890),('抗菌：皮膚',.83,.54)],
 'I01': [('第一道防線：皮膚與黏膜（城牆、護城河）',.55,.71),('正常菌叢（牆外居民）',.258,.765),('第二道防線：吞噬細胞（守衛）',.31,.395),('發炎與發燒（烽火）',.744,.143),('第三道防線：淋巴球（拿鑰匙的士兵＝專一性）',.43,.46),('記憶（紀錄簿）',.53,.475),('入侵的病原',.204,.583)],
 'I02': [('巨噬細胞',.23,.28),('嗜中性球',.18,.55),('自然殺手細胞',.15,.79),('B 細胞與抗體',.63,.26),('T 細胞',.63,.55),('記憶細胞',.77,.86)],
 'I03': [('天然主動（感染後康復）',.19,.22),('人工主動（疫苗）',.76,.295),('天然被動（胎盤 IgG）',.275,.784),('人工被動（抗蛇毒血清）',.827,.746)],
 'I04': [('骨髓',.29,.797),('造血幹細胞',.347,.824),('骨髓系：嗜中性球',.104,.29),('嗜酸性球',.22,.29),('嗜鹼性球',.344,.29),('單核球',.485,.302),('巨噬細胞',.485,.112),('樹突細胞',.667,.294),('淋巴系：B 細胞',.671,.510),('T 細胞',.677,.658),('胸腺',.759,.663),('自然殺手細胞',.675,.815),('次級淋巴器官：淋巴結',.923,.376),('脾臟',.923,.594),('扁桃腺',.925,.800)],
 'I05': [('抗原',.46,.55),('抗原決定位',.318,.546),('抗原決定位',.484,.322),('抗原決定位',.624,.575),('抗體（已結合）',.213,.556),('抗體（正在結合）',.801,.656),('不吻合的抗體',.737,.178)],
 'I06': [('1 抗原與 B 細胞受體結合',.078,.458),('2 輔助型 T 細胞給訊號',.296,.517),('3 增殖',.486,.518),('4 漿細胞分泌抗體',.657,.443),('4 記憶 B 細胞',.663,.710),('5 抗體功能：調理作用',.900,.320),('5 抗體功能：凝集',.90,.566),('5 抗體功能：中和',.905,.698)],
 'I08': [('樹突細胞',.114,.461),('MHC＋抗原片段',.176,.465),('輔助型 T 細胞',.240,.471),('細胞激素',.311,.421),('B 細胞',.403,.291),('巨噬細胞',.444,.500),('毒殺型 T 細胞',.402,.691),('受病毒感染的細胞',.813,.453),('細胞凋亡',.907,.317),('健康細胞',.735,.690)],
}
headers = {
 'B02':['革蘭氏陽性菌','革蘭氏陰性菌','細胞外'],
 'B03':['外毒素：活菌分泌的蛋白質','內毒素：菌體破裂釋出的脂多糖'],
 'I02':['先天免疫：立即、非專一','後天免疫：專一、有記憶'],
 'I08':['CD4 輔助型 T 細胞：指揮官','CD8 毒殺型 T 細胞：殺手'],
}
footnotes={'B01':'未依實際比例：細菌約 1–5 µm，人體細胞約 10–100 µm','B02':'細胞質','I05':'鎖＝抗原、鑰匙＝抗體'}
E=html.escape
def text(x,y,s,size=46,anchor='start',extra=''):
 return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" {extra}>{E(s)}</text>'
def wrap(s,limit=12):
 # Unit counts accommodate Latin names without splitting their words unnecessarily.
 lines=[];line='';units=0
 for ch in re.findall(r'[A-Za-z0-9µβ℃–]+(?: [A-Za-z0-9µβ℃–]+)*|.',s):
  w=sum(.52 if ord(c)<128 else 1 for c in ch)
  if units+w>limit and line:lines.append(line);line='';units=0
  line+=ch;units+=w
 if line:lines.append(line)
 return lines
def svg(body,h=900,style=''):
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 {h}" role="img"><style>text{{font-family:system-ui,sans-serif;fill:#24354a;font-weight:600;paint-order:stroke;stroke:#fff;stroke-width:5;stroke-linejoin:round}}{style}</style><rect width="1200" height="{h}" rx="24" fill="#fff"/>{body}</svg>'
# Round 3: numbered structures, single-column grouped legends, tight canvas.
from PIL import ImageFont
FONT=ImageFont.truetype('/tmp/micro-immuno-NotoSansCJKtc-Regular.otf',44)
RASTER_FONT=43.45
ROW=65.5
LEGEND_WIDTH=1080
def measured_wrap(value,width):
 lines=[];line=''
 for token in re.findall(r'[A-Za-z0-9µβ℃–]+|.',value):
  if line and FONT.getlength(line+token)>width:lines.append(line.rstrip());line=''
  line+=token
 if line:lines.append(line.rstrip())
 return lines
# indices refer to the approved labels; short display names omit only the repeated group prefix.
groups={
 'B01':[('細菌',list(range(7)),600,2),('人體細胞',list(range(7,13)),300,1),('細菌形態',list(range(13,17)),300,1)],
 'B02':[('革蘭氏陽性菌',list(range(3)),600,1),('革蘭氏陰性菌',list(range(3,10)),600,1)],
 'B03':[('外毒素',list(range(4)),600,1),('內毒素',list(range(4,7)),600,1)],
 'B04':[('院內傳播與阻斷',list(range(8)),1200,3)],
 'B05':[('滅菌',[0],400,1),('消毒',[1],400,1),('抗菌',[2],400,1)],
 'I01':[('第一道防線',[0,1],400,1),('第二道防線',[2,3],400,1),('第三道防線',[4,5],400,1),('病原',[6],1200,1)],
 'I02':[('先天免疫',list(range(3)),600,1),('後天免疫',list(range(3,6)),600,1)],
 'I03':[('天然主動',[0],300,1),('人工主動',[1],300,1),('天然被動',[2],300,1),('人工被動',[3],300,1)],
 'I04':[('骨髓',[0,1],300,1),('骨髓系',list(range(2,8)),300,1),('淋巴系',list(range(8,12)),300,1),('次級淋巴器官',list(range(12,15)),300,1)],
 'I05':[('抗原',list(range(4)),600,1),('抗體',[4,5,6,7],600,1)],
 'I06':[('步驟 1',[0],240,1),('步驟 2',[1],240,1),('步驟 3',[2],240,1),('步驟 4',[3,4],240,1),('步驟 5',[5,6,7],240,1)],
 'I08':[('CD4 輔助型 T 細胞',list(range(7)),600,2),('CD8 毒殺型 T 細胞',[10,7,8,9],600,1)],
}
# (title, left, top, available width): headings stay with the image's panels.
panel_titles={
 'B01':[('細菌',30,205,500),('人體細胞',640,5,530),('細菌形態',30,640,1130)],
 'B02':[('革蘭氏陽性菌',30,100,550),('革蘭氏陰性菌',640,100,530)],
 'B03':[(headers['B03'][0],30,45,540),(headers['B03'][1],640,45,530)],
 'B04':[('院內傳播與阻斷',30,20,460)],
 'B05':[(data['B05'][0][0],20,40,375),(data['B05'][1][0],425,40,365),(data['B05'][2][0],825,40,350)],
 'I01':[('三道防線與免疫記憶',20,5,570)],
 'I02':[(headers['I02'][0],20,5,560),(headers['I02'][1],640,5,530)],
 'I03':[(data['I03'][0][0],20,0,560),(data['I03'][1][0],640,0,530),(data['I03'][2][0],20,490,560),(data['I03'][3][0],640,490,530)],
 'I04':[('骨髓系',100,105,340),('淋巴系',735,365,180),('次級淋巴器官',900,100,285)],
 'I05':[('抗原與抗體的專一性',20,20,330)],
 'I06':[(f'步驟 {i+1}',i*240+15,125,210) for i in range(5)],
 'I08':[(headers['I08'][0],20,45,560),(headers['I08'][1],640,45,530)],
}
# Tight adjacent structures get short local offsets, never a long path to a label band.
offsets={('B01',0):(-43,-35),('B01',1):(-35,35),('B01',3):(35,0),('B01',7):(40,20),('B02',6):(-35,-8),('B02',8):(28,-16),('B04',3):(-32,28),('B04',7):(20,-33)}
# Exact connecting line / central peach periplasm / thymus next to T cell.
data['B02'][6]=('脂蛋白',1063/1536,569/1152)
data['B02'][8]=('周質空間',1210/1536,683/1152)
data['I04'][10]=('胸腺',1101/1448,719/1086)
def reading_order(key,labels,indices):
 # Adjacent marker centers within one marker diameter form a visual reading row.
 pending=list(indices);ordered=[]
 def position(i):
  dx,dy=offsets.get((key,i),(0,0));return labels[i][1]*1200+dx,labels[i][2]*900+dy
 while pending:
  top=min(position(i)[1] for i in pending)
  row=[i for i in pending if position(i)[1]<=top+60]
  ordered.extend(sorted(row,key=lambda i:position(i)[0]));pending=[i for i in pending if i not in row]
 return ordered
def short_label(key,label):
 if key in ['I01','I04']:label=re.sub(r'^(第一道防線|第二道防線|第三道防線|骨髓系|淋巴系|次級淋巴器官)：','',label)
 if key=='B05':label=label.split('：',1)[1]
 if key=='I03':label=label.split('（',1)[1].removesuffix('）')
 if key=='I06':label=re.sub(r'^\d+ ','',label).replace('抗體功能：','')
 return label
# Third review: anchors verified against the original colored structures.
data['B03'][5]=('脂多糖',1040/1448,618/1086)
data['I03'][0]=(data['I03'][0][0],300/1448,440/1086)
data['I04'][0]=('骨髓',310/1448,800/1086)
data['I05'].append(('抗體（正在結合）',650/1448,188/1086))
data['I08'].append(('毒殺型 T 細胞（CD8）',930/1448,490/1086))
GLOBAL_NUMBERING={'I01','I04','I05'}
metadata=[]
for key,labels in data.items():
 slug='micro-bacteria-review' if key[0]=='B' else 'immuno-concepts-review'
 file=f'{slug}-node-{key[1:]}.svg';im=Image.open(SOURCE/f'MI-{key[0]}-N{key[1:]}.png').convert('RGB');im.thumbnail((1200,1200))
 buf=io.BytesIO();im.save(buf,format='WEBP',quality=80,method=6);webp=buf.getvalue();uri=base64.b64encode(webp).decode()
 image_y=0;accent='hsl(22 65% 27%)' if key[0]=='B' else 'hsl(216 65% 27%)'
 # Remove only the source's near-white bottom margin, keeping original scale/coordinates.
 bands=im.split();mask=Image.eval(Image.merge('RGB',bands).convert('L'),lambda v:255 if v<235 else 0)
 bbox=mask.getbbox();visible_h=min(900,math.ceil(bbox[3]*900/im.height)+6)
 body=f'<defs><clipPath id="image-{key}"><rect width="1200" height="{visible_h}"/></clipPath></defs><image clip-path="url(#image-{key})" x="0" y="0" width="1200" height="900" href="data:image/webp;base64,{uri}"/>'
 if key=='I03':
  # Split only in the white separator (source y=525), with 60-unit heading bands.
  body=f'<defs><image id="source-{key}" width="1200" height="900" href="data:image/webp;base64,{uri}"/><clipPath id="upper-{key}"><rect y="60" width="1200" height="435"/></clipPath><clipPath id="lower-{key}"><rect y="555" width="1200" height="465"/></clipPath></defs><g clip-path="url(#upper-{key})"><use href="#source-{key}" y="60"/></g><g clip-path="url(#lower-{key})"><use href="#source-{key}" y="120"/></g>'
  visible_h=1020
 legend_y=visible_h;legend_baseline=legend_y+48
 for title,x,y,w in panel_titles[key]:
  lines=['抗原與抗體','的專一性'] if key=='I05' else measured_wrap(title,w-20);body+=f'<rect x="{x-8}" y="{y}" width="{w}" height="{43 if key=="I04" and title=="淋巴系" else 68 if key=="I03" else len(lines)*ROW+10}" rx="12" fill="#fff" fill-opacity=".9"/>'
  for j,line in enumerate(lines):body+=text(x,y+(37 if key=='I04' and title=='淋巴系' else 54)+j*ROW,line,RASTER_FONT,extra='class="panel-heading"')
 if key=='B02':
  body+=text(1020,205,'細胞外',RASTER_FONT)
  body+='<rect x="1008" y="688" width="172" height="58" rx="10" fill="#fff" fill-opacity=".95"/>'+text(1020,725,'細胞質',RASTER_FONT,extra='class="cytoplasm-note"')
  legend_baseline=max(legend_baseline,725+ROW+10)
 # Each group orders rows top to bottom and structures within the same row left to right.
 numbered={};legend_groups=[];legend_lines=[]
 global_numbers={idx:n for n,idx in enumerate([idx for _,indices,_,_ in groups[key] for idx in reading_order(key,labels,indices)],1)}
 for group,indices,w,columns in groups[key]:
  ordered=reading_order(key,labels,indices)
  if key=='I08' and group.startswith('CD8'):ordered=[10]+[i for i in ordered if i!=10]
  tokens=[];numbers=[]
  for local_number,idx in enumerate(ordered,1):
   number=global_numbers[idx] if key in GLOBAL_NUMBERING else local_number
   numbered[idx]=(number,group);numbers.append(number)
   tokens.append(chr(0x2460+number-1)+' '+short_label(key,labels[idx][0]))
  legend_groups.append({'name':group,'indices':ordered,'numbers':numbers})
  # Every group is an independent, full-width paragraph. Never reuse a row for another group.
  lines=[];line=group+'｜'
  for token in tokens:
   trial=line+' '+token
   if FONT.getlength(trial)>LEGEND_WIDTH and not line.endswith('｜'):lines.append(line);line=token
   else:line=trial
  lines.append(line)
  for line in lines:
   assert FONT.getlength(line)<=LEGEND_WIDTH,(key,line,FONT.getlength(line))
   legend_lines.append((group,line))
 for j,(group,line) in enumerate(legend_lines):
  body+=text(15,legend_baseline+j*ROW,line,RASTER_FONT,extra=f'class="legend-item" data-group="{E(group,quote=True)}"')
 last_baseline=legend_baseline+(len(legend_lines)-1)*ROW
 for idx,(label,ax,ay) in enumerate(labels):
  n,group=numbered[idx];px=round(ax*1200,2);py=round(ay*900+(60 if ay*900<435 else 120) if key=='I03' else ay*900,2)
  dx,dy=offsets.get((key,idx),(0,0));mx=px+dx;my=py+dy
  body+=f'<g class="callout" data-label="{E(label,quote=True)}" data-group="{E(group,quote=True)}" data-number="{n}" data-source-x="{ax}" data-source-y="{ay}" data-anchor-x="{px}" data-anchor-y="{py}">'
  if dx or dy:body+=f'<line class="leader" x1="{px}" y1="{py}" x2="{mx}" y2="{my}" stroke="{accent}" stroke-width="3"/>'
  body+=f'<circle cx="{mx}" cy="{my}" r="32" fill="{accent}" stroke="#fff" stroke-width="3"/>'+text(mx,my+16,str(n),46,'middle','class="marker-number" style="fill:#fff;stroke:none"')+'</g>'
 if key=='B01':
  last_baseline+=ROW;body+=text(15,last_baseline,footnotes[key],RASTER_FONT,extra='class="figure-footnote"')
 if key=='I05':body+=text(620,780,'鎖＝抗原',RASTER_FONT,extra='class="figure-footnote"')+text(620,847.5,'鑰匙＝抗體',RASTER_FONT,extra='class="figure-footnote"')
 H=math.ceil(last_baseline+16)
 assert H<=1305,(key,H,legend_lines)
 OUT.joinpath(file).write_text(svg(body,H).replace('role="img"','role="img" data-raster-height="900" data-marker-layout="grouped" data-numbering-mode="'+('group-continuous' if key in GLOBAL_NUMBERING else 'group')+'" data-priority-label="'+('毒殺型 T 細胞（CD8）' if key=='I08' else '')+'"'))
 metadata.append({'file':file,'source':f'MI-{key[0]}-N{key[1:]}.png','webpBytes':len(webp),'webpDimensions':list(im.size),'svgBytes':OUT.joinpath(file).stat().st_size,'viewBox':[0,0,1200,H],'imageBandY':image_y,'imageHeight':900,'visibleImageHeight':visible_h,'legendBaseline':legend_baseline,'numberingMode':'group-continuous' if key in GLOBAL_NUMBERING else 'group','heightRatio':H/900,'groups':legend_groups,'labels':[{'text':l,'xRatio':xx,'yRatio':yy,'number':numbered[i][0],'group':numbered[i][1],'markerOffset':list(offsets.get((key,i),(0,0)))} for i,(l,xx,yy) in enumerate(labels)]})

# Gram stain: colored organisms remain visible in all five states.
body='<circle cx="600" cy="400" r="325" fill="#f8fafc" stroke="#728496" stroke-width="9"/><path d="M600 80V720" stroke="#dde4eb" stroke-width="3" stroke-dasharray="10 12"/>'
for x,y in [(440,330),(475,370),(425,410),(495,435),(520,340),(400,355),(452,460),(540,395),(395,435),(490,300)]:body+=f'<circle class="gram-positive" cx="{x}" cy="{y}" r="25" stroke="#64748b" stroke-width="2"/>'
for x,y,a in [(700,280,25),(785,340,-20),(715,400,12),(790,475,35),(680,515,-20)]:body+=f'<rect class="gram-negative" x="{x-16}" y="{y-43}" width="32" height="86" rx="16" transform="rotate({a} {x} {y})" stroke="#64748b" stroke-width="2"/>'
body+=text(420,810,'陽性菌',anchor='middle')+text(780,810,'陰性菌',anchor='middle')
style=' .gram-positive,.gram-negative{fill:#e8ecf0;transition:fill .4s} [data-state="crystal-violet"] .gram-positive,[data-state="crystal-violet"] .gram-negative{fill:#9664ce} [data-state="iodine"] .gram-positive,[data-state="iodine"] .gram-negative{fill:#65328e} [data-state="decolorize"] .gram-positive,[data-state="safranin"] .gram-positive{fill:#70429c} [data-state="decolorize"] .gram-negative{fill:#f4f6f8} [data-state="safranin"] .gram-negative{fill:#e78fba} @media(prefers-reduced-motion:reduce){.gram-positive,.gram-negative{transition:none}}'
OUT.joinpath('micro-bacteria-review-lab.svg').write_text(svg(body,900,style))

# Antibiotic targets: exactly one 70S ribosome, separate stacked subunits.
body='<rect class="bacterium-outline" x="260" y="360" width="680" height="370" rx="180" fill="#cc9850" stroke="#7a542d" stroke-width="8"/><rect x="282" y="382" width="636" height="326" rx="156" fill="#e7b668" stroke="#997338" stroke-width="6"/><rect x="303" y="403" width="594" height="284" rx="132" fill="#f9e1a8" stroke="#bf9351" stroke-width="5"/><path d="M510 490C640 385 510 620 700 515S635 440 555 580S730 610 745 485" fill="none" stroke="#7654a3" stroke-width="10"/>'
body+='<g class="ribosome"><ellipse class="subunit-50s" cx="400" cy="530" rx="54" ry="32" fill="#17617e"/><ellipse class="subunit-30s" cx="400" cy="574" rx="44" ry="23" fill="#4192a6"/></g><path d="M740 630h55m-10-10 10 10-10 10" stroke="#599164" stroke-width="8" fill="none"/>'
targets=[(30,120,['細胞壁','β-內醯胺類、萬古黴素'],(235,225),(310,420)),(635,120,['DNA 旋轉酶','喹諾酮類'],(860,225),(680,470)),(10,270,['50S','巨環類、','clindamycin'],(240,480),(360,525)),(30,800,['30S','胺基醣苷類、四環黴素'],(250,740),(365,574)),(680,800,['葉酸合成','磺胺類、trimethoprim'],(850,740),(780,630))]
for x,y,lines,start,end in targets:
 body+=f'<line class="leader" x1="{start[0]}" y1="{start[1]}" x2="{end[0]}" y2="{end[1]}" stroke="#64748b" stroke-width="3"/><circle cx="{end[0]}" cy="{end[1]}" r="6" fill="#24354a"/>'
 for j,line in enumerate(lines):body+=text(x,y+j*(75 if lines[0]=='50S' else 80)+(4 if lines[0]=='50S' and j==0 else 0),line,RASTER_FONT if lines[0]=='50S' and j else 46,extra='class="drug-50s"' if lines[0]=='50S' and j else '')
body+=text(30,1030,'細菌的四種抗藥機轉')
mechanisms=[('分解藥物的酵素','β-內醯胺酶分解藥物'),('改變作用目標','改變作用目標（如 MRSA）'),('排出幫浦','排出幫浦把藥打出去'),('孔蛋白減少','孔蛋白減少，藥進不來')]
for i,(title,explain) in enumerate(mechanisms):
 x=25+(i%2)*600;y=1090+(i//2)*440
 body+=f'<rect x="{x}" y="{y}" width="550" height="410" rx="25" fill="#f2f6f9"/>'+text(x+20,y+60,title)
 # Explicit molecule, membrane and action drawings; no abstract stand-in icons.
 if i==0:
  body+=f'<circle cx="{x+115}" cy="{y+145}" r="24" fill="none" stroke="#599164" stroke-width="10"/><circle cx="{x+115}" cy="{y+220}" r="24" fill="none" stroke="#599164" stroke-width="10"/><path d="M{x+136} {y+160}L{x+255} {y+235}M{x+136} {y+205}L{x+255} {y+130}" stroke="#599164" stroke-width="12"/><circle cx="{x+190}" cy="{y+183}" r="9" fill="#336c42"/><path d="M{x+285} {y+145}h42v40h-42zM{x+360} {y+197}h42v40h-42z" fill="#b97529"/><path d="M{x+342} {y+154}l-12 30m10 20 12 30" stroke="#b97529" stroke-width="7"/>'
 if i==1:
  body+=f'<path d="M{x+115} {y+140}h65v65h-65z" fill="#b97529"/><path d="M{x+290} {y+125}h140v130h-140v-40l60-25-60-25z" fill="#7654a3"/><path d="M{x+205} {y+180}h55m-15-15 15 15-15 15" fill="none" stroke="#8293a2" stroke-width="6"/><path d="M{x+260} {y+220}l20-20m-20 0 20 20" stroke="#ad4538" stroke-width="7"/>'
 if i==2:
  body+=f'<path d="M{x+70} {y+170}h170m100 0h150M{x+70} {y+230}h170m100 0h150" stroke="#8db9d0" stroke-width="15"/><rect x="{x+245}" y="{y+147}" width="90" height="105" rx="15" fill="#4192a6"/><path d="M{x+280} {y+230}v-122m-18 20 18-20 18 20" stroke="#1769aa" stroke-width="9" fill="none"/><circle cx="{x+285}" cy="{y+268}" r="17" fill="#b97529"/><circle cx="{x+285}" cy="{y+85}" r="17" fill="#b97529"/>'
 if i==3:
  body+=f'<path d="M{x+70} {y+170}h170m100 0h150M{x+70} {y+230}h170m100 0h150" stroke="#8db9d0" stroke-width="15"/><rect x="{x+245}" y="{y+147}" width="90" height="105" rx="15" fill="#4192a6"/><path d="M{x+255} {y+182}h70M{x+255} {y+215}h70" stroke="#ad4538" stroke-width="14"/><circle cx="{x+285}" cy="{y+97}" r="17" fill="#b97529"/><path d="M{x+285} {y+115}v22m-15-12 15 12 15-12" stroke="#b97529" stroke-width="7" fill="none"/>'
 for j,line in enumerate(['改變作用目標','（如 MRSA）'] if i==1 else measured_wrap(explain,510)):body+=text(x+20,y+315+j*76,line)
OUT.joinpath('micro-bacteria-review-node-06.svg').write_text(svg(body,1990))

# Primary/secondary antibody response: qualitative time, no numerical ticks.
body='<path d="M150 150V780H1140" fill="none" stroke="#516b83" stroke-width="5"/>'+text(40,65,'抗體濃度')+text(1040,850,'時間（天）',anchor='middle')
body+='<path d="M240 780V170M655 780V170" stroke="#9eabb8" stroke-dasharray="8 12" stroke-width="3"/>'
body+=text(240,920,'第一次接觸抗原',anchor='middle')+text(750,990,'第二次接觸同一抗原',anchor='middle')
body+='<path class="igm-primary" d="M240 776L280 776C300 776 312 640 355 642S398 773 600 776" fill="none" stroke="#b97529" stroke-width="9" stroke-dasharray="18 12"/><path class="igg-primary" d="M240 776L322 776C350 776 385 665 420 673S480 768 610 775" fill="none" stroke="#24669e" stroke-width="9"/>'
body+=text(280,600,'IgM',extra='fill="#8b5519"')+text(465,625,'IgG',extra='fill="#18568c"')
body+='<g class="secondary-response"><path class="igm-secondary" d="M655 775C670 775 685 655 735 648S790 772 1120 774" fill="none" stroke="#b97529" stroke-width="9" stroke-dasharray="18 12"/><path class="igg-secondary" d="M655 775C675 770 690 185 790 175S1010 200 1120 285" fill="none" stroke="#24669e" stroke-width="9"/>'
body+=text(925,160,'IgG')+text(780,630,'IgM')+'</g>'
curve_body=body
handler="const s=this.closest('svg'),x=240+8.8*Number(this.value);s.querySelector('.time-cursor').setAttribute('d','M'+x+' 170V780');const state=s.closest('[data-state]')?.dataset.state;s.querySelector('.time-readout').textContent=x<300?'潛伏期':x<380?'主要抗體：IgM':x<610?'主要抗體：IgG':state==='secondary'?(x<685?'再次反應：潛伏期':x<840?'再次反應：IgG 高峰':'再次反應：IgG 維持'):'抗體濃度下降';"
body+='<path class="time-cursor" d="M240 170V780" stroke="#64748b" stroke-width="3" stroke-dasharray="3 7"/>'+text(35,1110,'拖動時間軸：觀察潛伏期與高峰',extra='class="time-readout"')
body+=f'<foreignObject x="80" y="1150" width="1040" height="80"><div xmlns="http://www.w3.org/1999/xhtml"><input aria-label="拖動免疫反應時間軸" type="range" min="0" max="100" value="0" style="width:100%;height:60px;accent-color:#24669e" oninput="{E(handler,quote=True)}"/></div></foreignObject>'
curve_style=' .secondary-response{display:none} [data-state="secondary"] .secondary-response{display:inline}'
OUT.joinpath('immuno-concepts-review-lab.svg').write_text(svg(body,1270,curve_style))
def Y(cx,cy,scale=1,rotation=0,color='#24669e'):
 return f'<g class="antibody-monomer" transform="translate({cx} {cy}) rotate({rotation}) scale({scale})"><path d="M-9 100V0L-75-90M9 100V0L75-90" fill="none" stroke="{color}" stroke-width="16" stroke-linejoin="round"/><path d="M-30 0L-90-80M30 0L90-80" fill="none" stroke="#75a6c9" stroke-width="11" stroke-linecap="round"/></g>'
body=text(35,60,'抗體結構')
# Two heavy chains, two light chains with separately colored variable tips.
body+='<path d="M585 670V430L425 230M615 670V430L775 230" fill="none" stroke="#24669e" stroke-width="23" stroke-linejoin="round"/><path d="M555 425L392 243M645 425L808 243" fill="none" stroke="#75a6c9" stroke-width="17" stroke-linecap="round"/><path d="M425 230L470 286M775 230L730 286M392 243L440 297M808 243L760 297" stroke="#c38330" stroke-width="20" fill="none"/><path d="M579 483h42M579 515h42M500 341l-22 16M700 341l22 16" stroke="#936437" stroke-width="7"/>'
labels=[(35,135,'抗原結合部位',425,230),(720,135,'抗原結合部位',775,230),(35,350,'Fab',475,300),(35,540,'輕鏈（×2）',465,325),(880,415,'絞鏈區',615,430),(880,540,'雙硫鍵',600,515),(50,690,'重鏈（×2）',585,610),(940,690,'Fc',615,650)]
for x,y,s,ax,ay in labels:
 body+=f'<path class="leader" d="M{x+50} {y+12}L{ax} {ay}" fill="none" stroke="#8293a2" stroke-width="3"/>'+text(x,y,s)
body+='<rect x="35" y="755" width="44" height="30" fill="#c38330"/><rect x="635" y="755" width="44" height="30" fill="#24669e"/>'+text(95,787,'可變區')+text(695,787,'恆定區')+text(35,900,'五種抗體（依血中含量排列）')
types=[('IgG','單體'),('IgA','雙體'),('IgM','五聚體'),('IgD','單體：插在 B 細胞膜上'),('IgE','單體：接在肥大細胞上')]
for i,(name,desc) in enumerate(types):
 y=1010+i*330;body+=f'<rect x="20" y="{y-20}" width="1160" height="300" rx="24" fill="#f3f7fa"/>'
 body+=text(540,y+65,name)+text(540,y+155,desc)
 if i==0:body+=Y(260,y+110)
 if i==1:
  body+='<g class="iga-dimer">'+Y(160,y+145,.8,-90)+Y(340,y+145,.8,90)+f'<path class="j-chain" d="M240 {y+145}H260" stroke="#41966d" stroke-width="12"/><path class="secretory-component" d="M180 {y+154}H233Q250 {y+182} 267 {y+154}H320" stroke="#c38330" stroke-width="14" fill="none" stroke-linecap="round"/></g>'+text(540,y+245,'J 鏈、分泌片')
 if i==2:
  cy=y+130;vertices=[];body+='<g class="igm-pentamer">'
  for a in range(0,360,72):
   rad=math.radians(a);vertices.append((250+46*math.sin(rad),cy-46*math.cos(rad)))
   body+=Y(250+90*math.sin(rad),cy-90*math.cos(rad),.44,a)
  polygon=' '.join(f'{x:.2f},{yy:.2f}' for x,yy in vertices)
  body+=f'<polygon class="fc-disulfide-ring" points="{polygon}" stroke="#936437" stroke-width="8" fill="none"/>'
  # One short, differently colored segment is the J chain; the remaining ring is S–S linkage.
  v1,v2=vertices[:2];jx=v1[0]*.45+v2[0]*.55;jy=v1[1]*.45+v2[1]*.55;kx=v1[0]*.1+v2[0]*.9;ky=v1[1]*.1+v2[1]*.9
  body+=f'<path class="j-chain" d="M{jx:.2f} {jy:.2f}L{kx:.2f} {ky:.2f}" stroke="#41966d" stroke-width="10"/></g>'+text(540,y+245,'J 鏈')
 if i==3:
  body+=f'<path d="M70 {y+220}H435M70 {y+240}H435" stroke="#8db9d0" stroke-width="12"/>'+Y(250,y+115,.9)
 if i==4:
  body+=f'<ellipse cx="250" cy="{y+255}" rx="160" ry="65" fill="#efc4b5" stroke="#b87968" stroke-width="4"/><circle cx="210" cy="{y+250}" r="9" fill="#7654a3"/><circle cx="300" cy="{y+260}" r="9" fill="#7654a3"/><path d="M231 {y+194}v-20h38v20" fill="none" stroke="#b87968" stroke-width="10"/>'+Y(250,y+86,.9)
OUT.joinpath('immuno-concepts-review-node-07.svg').write_text(svg(body,2700))

manifest=json.loads(OUT.joinpath('manifest.json').read_text())
files=[m['file'] for m in metadata]+['micro-bacteria-review-lab.svg','micro-bacteria-review-node-06.svg','immuno-concepts-review-lab.svg','immuno-concepts-review-node-07.svg']
manifest=[m for m in manifest if m['file'] not in files]
for file in files:
 raster=file in [m['file'] for m in metadata]
 manifest.append({'file':file,'title':file.removesuffix('.svg'),'source':'AI-generated (Gemini/ChatGPT), teacher-reviewed 2026-10-10' if raster else 'original','license':'教學用（教師核可本次 AI 插圖例外）' if raster else 'CC0','attribution':'插圖由 AI（Gemini／ChatGPT）生成，經授課教師審訂（2026-10-10）；中文標籤由課程平台疊加' if raster else '課程平台自繪 SVG','url':''})
import subprocess
original_manifest=subprocess.check_output(['git','show','HEAD:materials-src/figures/manifest.json'],cwd=ROOT).decode()
new_entries=[m for m in manifest if m['file'] in files]
OUT.joinpath('manifest.json').write_text(original_manifest.rstrip().removesuffix(']').rstrip()+',\n'+',\n'.join('  '+json.dumps(m,ensure_ascii=False) for m in new_entries)+'\n]\n')
(ROOT/'docs/micro-immuno-review/figure-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'rasterFigures':len(metadata),'originalFigures':4,'maxWebpBytes':max(m['webpBytes'] for m in metadata),'maxRasterSvgBytes':max(m['svgBytes'] for m in metadata)}))
