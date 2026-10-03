"""Reproducible vector figures and visual-only content for the two Heart II specs."""
import json,html
from pathlib import Path
R=Path(__file__).resolve().parent.parent;F=R/'materials-src/figures'
RED='#a71930';BLUE='#1769aa';PURPLE='#8250a0';SV='#176b45';ORANGE='#9a5a00';SIGNAL='#b77900';INK='#17212b'
def text(x,y,s,size=18,color=INK,anchor='start'):
 return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{html.escape(s)}</text>'
def path(d,color=INK,w=3,extra=''):
 return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def rect(x,y,w,h,fill='#f1f5f9',stroke='#cbd5e1'):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fill}" stroke="{stroke}"/>'
def circle(x,y,r,color):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/>'
def svg(title,body,h=340,w=400):
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{html.escape(title)}"><title>{html.escape(title)}</title><style>text{{font-family:system-ui,sans-serif;font-size:calc(18px * var(--font-scale,1))}}.title{{font-weight:700}}</style><rect width="{w}" height="{h}" rx="14" fill="#fafbfd"/>{text(18,30,title)}{body}</svg>'
def save(name,title,body,h=340): (F/name).write_text(svg(title,body,h))
def label(x,y,s,tx,ty,color=INK):return text(x,y,s,color=color)+path(f'M{x} {y+6}H{tx}V{ty}',color,1.5)+circle(tx,ty,3,color)
def bar(x,edv,esv,name,y=245):
 scale=1.1;sv=edv-esv
 return rect(x,y-edv*scale,60,edv*scale,'#e2e8f0','#64748b')+rect(x,y-esv*scale,60,esv*scale,'#94a3b8','#64748b')+rect(x,y-edv*scale,60,sv*scale,SV,SV)+text(x+30,y-edv*scale-10,f'EDV {edv}',anchor='middle')+text(x+30,y-esv*scale-18,f'SV {sv}',color='white',anchor='middle')+text(x+30,y-15,f'ESV {esv}',anchor='middle')+text(x+30,y+28,name,anchor='middle')
def bars(name,items):save(name,'心室容積｜示意數值 mL',''.join(bar(x,a,b,n) for x,a,b,n in items)+text(20,325,'心搏量 SV＝EDV−ESV'),350)
# Four-state 2×2 graph; nonselected groups fade without relying on color alone.
states=[('base','基準',120,50),('preload','前負荷↑',140,50),('contractility','收縮力↑',120,35),('afterload','後負荷↑',120,65)]
body='<style>'+''.join(f'[data-state="{s}"] .volume:not(.{s}){{opacity:.22}}' for s,_,_,_ in states)+'</style>'
for i,(sid,n,a,b) in enumerate(states):
 x=65+(i%2)*195;y=245+(i//2)*255
 body+=f'<g class="volume {sid}">'+bar(x,a,b,n,y)+'</g>'
body+=text(18,565,'綠色上段＝射出的心搏量 SV')+text(18,590,'灰色下段＝留下的 ESV；外框＝EDV')
save('cardiac-output-overview.svg','心室容積比較｜示意數值 mL',body,615)
bars('cardiac-output-node-02.svg',[(165,120,50,'基準')])
bars('cardiac-output-node-04.svg',[(65,120,50,'基準'),(260,120,35,'收縮力↑')])
# Pump picture, intentional anatomical analogy, no framework boxes.
pump=path('M28 150H110',BLUE,10)+ '<ellipse cx="178" cy="150" rx="65" ry="42" fill="#fde8e8" stroke="#a71930" stroke-width="4"/>'+path('M242 150H345',SV,10)+path('M315 140L345 150L315 160',SV,4)+path('M140 70L165 115M215 70L192 115',PURPLE,5)+text(105,205,'每次出水＝心搏量 SV',color=SV)+text(15,255,'每分鐘擠幾次＝心率 HR')+text(15,287,'每分鐘出水＝心輸出量 CO')+text(15,80,'進水量：前負荷')+text(190,55,'擠壓力道：收縮力')+text(242,110,'出口：後負荷')+path('M40 110l10-10 10 20 10-20 10 20 10-10',PURPLE,2)+text(15,330,'速度：交感 NE 油門／迷走 ACh 煞車')
save('cardiac-output-node-01.svg','手擠水球幫浦比喻',pump,355)
# Springs: clear broken ends in the third panel.
body=''
for i,(name,length,result) in enumerate([('拉一點',130,'回彈小：收縮較弱'),('拉多一點',250,'回彈大：心搏量↑'),('拉過頭',280,'像被拉斷，彈不回來')]):
 y=90+i*135;body+=text(20,y-25,f'{i+1}. {name}')
 zig='M35 '+str(y)+' '+ ' '.join(f'L{35+j*length/12:.1f} {y+(-13 if j%2 else 13)}' for j in range(1,13))
 if i==2:zig=f'M35 {y}l25-13 25 26 25-26 25 26 25-13 M225 {y}l20-13 20 26 20-26 20 13';body+=path(f'M185 {y-18}l18 36m-18 0 18-36',ORANGE,4)
 body+=path(zig,ORANGE if i==2 else SV,4)+text(20,y+45,result)
body+=text(20,475,'超出生理範圍，收縮反而變弱',color=ORANGE)
save('cardiac-output-node-03.svg','Frank-Starling：彈簧三格',body,500)
body=bar(65,120,50,'基準')+bar(260,120,65,'後負荷↑')+text(15,325,'SV 70 → 55：心搏量↓',color=ORANGE)+path('M70 375H165L185 389H225L245 375H335',PURPLE,8)+path('M70 405H165L185 392H225L245 405H335',PURPLE,8)+text(25,450,'幫浦出口變窄 → 射血阻力↑')
save('cardiac-output-node-05.svg','後負荷｜示意數值 mL',body,475)
body=rect(20,65,360,105,'#edf8f0')+path('M50 135L70 90H110L130 135Z',SV,5)+text(145,100,'油門：交感節後 NE')+text(145,133,'心率↑、收縮力↑',color=SV)+rect(20,185,360,105,'#fff6e8')+rect(55,220,65,25,ORANGE,ORANGE)+text(145,220,'煞車：迷走節後 ACh')+text(145,255,'心率↓',color=ORANGE)+text(20,325,'另一條油門：腎上腺髓質')+text(20,353,'腎上腺素經血液 → 心臟')+text(20,395,'心率過快 → 舒張期縮短')+text(20,425,'充血不足 → EDV↓ → 心搏量↓')
save('cardiac-output-node-06.svg','自主神經：油門／煞車',body,450)
# Capillary graph / Starling simplified model.
body='<path d="M55 105L243 165H55Z" fill="#e3f3e7"/><path d="M243 165L375 207V165Z" fill="#edf0f7"/>'+path('M55 65V260H375','#64748b')+text(10,58,'mmHg')+path('M55 105L375 207',PURPLE,4)+path('M55 165H375',PURPLE,3,'stroke-dasharray="8 5"')+text(65,90,'35',color=PURPLE)+text(330,237,'18',color=PURPLE)+text(280,153,'25',color=PURPLE)+text(60,290,'動脈端 → 微血管 → 靜脈端')+text(65,130,'靜水壓',color=PURPLE)+text(70,192,'膠體滲透壓（虛線）',color=PURPLE)+path('M243 70V260','#64748b',2,'stroke-dasharray="5 5"')+text(245,65,'約 59%')
body+='<g class="arterial">'+rect(20,310,170,65,'#edf8f0')+text(30,335,'淨濾出區 ↑')+text(30,362,'35−25＝外 10')+'</g><g class="venous">'+rect(210,310,170,65,'#edf4ff')+text(220,335,'淨回收區 ↓')+text(220,362,'18−25＝內 7')+'</g><g class="lymph">'+text(20,410,'濾出略多於回收 → 淋巴收走多餘液體')+'</g>'+text(20,450,'示意數值（OpenStax 模型）')
body+='<style>[data-state="state-1"] .venous,[data-state="state-1"] .lymph,[data-state="state-2"] .arterial,[data-state="state-2"] .lymph,[data-state="state-3"] .arterial,[data-state="state-3"] .venous{opacity:.25}</style>'
save('capillary-exchange-overview.svg','Starling 力量沿微血管變化',body,475)
body=rect(25,65,350,150,'#fdeaea')+path('M25 140H375',RED,5)+''.join(circle(50+i*35,100,4,RED) for i in range(9))+''.join(circle(70+i*70,190,4,RED) for i in range(4))+text(40,60,'血液')+text(40,243,'組織')+path('M135 108V230l-8-12m8 12 8-12',SV,4)+path('M275 230V108l-8 12m8-12 8 12',ORANGE,4)+text(40,285,'O₂、葡萄糖 ↓；CO₂ ↑')+text(40,320,'各自沿高濃度 → 低濃度擴散')
save('capillary-exchange-node-01.svg','擴散：各物質看自己的濃度',body,345)
body=rect(40,100,140,70,'#fdeaea')+rect(200,100,160,70,'#fdeaea')+text(45,92,'內皮細胞')+text(45,200,'脂溶性 ↓ 穿過細胞')+path('M85 60V180',SV,4)+path('M190 65V220',BLUE,4)+text(180,247,'水、小分子 ↓')+text(180,275,'走細胞間隙')+circle(310,65,13,PURPLE)+path('M300 84l20 20m-20 0 20-20',ORANGE,4)+text(30,320,'血漿蛋白：通常留在血管內')
save('capillary-exchange-node-02.svg','通過管壁的三種情形',body,345)
def tug(a,b,subtitle):
 return path('M45 120H355','#64748b',5)+circle(200,120,9,INK)+path('M65 145L100 120L65 95',PURPLE,5)+path('M335 145L300 120L335 95',PURPLE,5)+text(20,70,f'外推：靜水壓 {a}',color=PURPLE)+text(20,200,f'內拉：膠體滲透壓 {b}',color=PURPLE)+text(20,250,subtitle)
save('capillary-exchange-node-03.svg','拔河：靜水壓把液體往外推',tug('↑','不變','外推力量↑ → 濾出↑'),290)
save('capillary-exchange-node-04.svg','拔河：白蛋白把液體往內拉',tug('不變','↑','內拉力量↑ → 濾出↓'),290)
save('capillary-exchange-node-05.svg','拔河：比較外推與內拉',tug('35','25','動脈端：向外 10（示意 mmHg）')+'<g transform="translate(0 250)">'+tug('18','25','靜脈端：向內 7（示意 mmHg）')+'</g>',550)
body=rect(30,75,340,55,'#fdeaea')+path('M35 104H360',RED,4)+text(30,65,'微血管')+''.join(circle(70+i*50,195,6,BLUE) for i in range(6))+path('M110 225q-20 20 0 35H365',SV,7)+path('M170 193V245l-8-10m8 10 8-10',SV,3)+text(20,300,'盲端淋巴微管 → 回收多出組織液')+rect(25,330,350,95,'#edf4ff')+''.join(circle(50+i*25,360,6,BLUE) for i in range(12))+text(35,405,'回收不及 → 液體堆積＝水腫')
save('capillary-exchange-node-06.svg','淋巴回收：液體回到循環',body,450)
# Pressure nodes: waveform coordinates match cuff widget.
def wave(y=210):return path(f'M45 {y}L65 {y-90}Q85 {y-55} 105 {y}L125 {y-90}Q145 {y-55} 165 {y}L185 {y-90}Q205 {y-55} 225 {y}L245 {y-90}Q265 {y-55} 285 {y}L305 {y-90}Q325 {y-55} 345 {y}',PURPLE,4)
body=''
for i,(name,flow) in enumerate([('捏死 → 沒水',''),('稍放鬆 → 斷續噴','M215 155h25m15 0h25m15 0h25'),('完全放開 → 平順','M215 250H355')]):
 y=65+i*95;body+=text(20,y,name)+path(f'M30 {y+30}H165l20 10 20-10',BLUE,8)+path(flow,BLUE,5)
save('blood-pressure-measurement-node-01.svg','澆花水管比喻',body,345)
body=path('M25 100H145L185 130H215L255 100H375',RED,5)+path('M25 190H145L185 155H215L255 190H375',RED,5)+rect(160,65,80,35,'#eee6f5',PURPLE)+path('M35 145H155q15-25 25 0t25 0t25 0H350',RED,4)+text(165,230,'♪ 亂流')+text(20,275,'受壓的肱動脈：收縮期斷續衝過')
save('blood-pressure-measurement-node-02.svg','柯氏音：血流亂流的聲音',body,315)
for num,pressure,title,caption in [(3,120,'第一聲＝收縮壓','線剛低於波峰 → ♪'),(4,80,'聲音消失＝舒張壓','線降到波谷 → 平順、無聲')]:
 y=210-(pressure-80)*2.25
 save(f'blood-pressure-measurement-node-0{num}.svg',title,wave()+path(f'M35 {y}H370',PURPLE,3)+text(40,75,'動脈壓 120／80（示意數值）')+text(40,255,f'壓脈帶 {pressure} mmHg',color=PURPLE)+text(40,295,caption),330)
body=circle(135,95,20,INK)+path('M135 118V235H265V310M135 165H240',INK,8)+path('M115 320H95V215',INK,5)+rect(105,245,70,12,'#64748b')+rect(170,145,40,30,'#eee6f5',PURPLE)+circle(135,155,7,RED)+path('M142 155H240',PURPLE,2,'stroke-dasharray="4 4"')+circle(218,164,6,INK)+path('M218 164L300 185',INK,2)+text(20,60,'坐姿：手臂與心臟同高')+text(20,355,'壓脈帶下緣距肘窩 2–3 cm')+text(20,390,'聽診器：肘窩肱動脈')
save('blood-pressure-measurement-node-05.svg','測量位置與坐姿',body,420)
body=''
for i,(name,end,read) in enumerate([('高於',90,'偏低 ↓'),('等於',170,'正確'),('低於',250,'偏高 ↑')]):
 x=65+i*130;body+=circle(x,160,7,RED)+path(f'M{x} 160L{x+35} {end}',PURPLE,5)+text(x-35,295,name)+text(x-35,325,read,color=SV if i==1 else ORANGE)
body+=path('M15 160H385','#64748b',2,'stroke-dasharray="5 5"')+text(15,55,'手臂相對心臟高度影響讀值')+text(15,370,'120／80 → 脈壓＝40 mmHg')+text(15,405,'MAP ≈ 80＋40÷3 ≈ 93 mmHg')
save('blood-pressure-measurement-node-06.svg','血液柱高度與判讀',body,435)
# Arterial regional drawings: distinct anatomy, not repeated full body.
body=path('M155 95V75Q175 45 225 85V295M225 295L170 355M225 295L280 355',RED,8)+label(20,130,'升主動脈',155,105,RED)+label(20,55,'主動脈弓',187,66,RED)+label(240,155,'胸主動脈',225,145,RED)+label(240,250,'腹主動脈',225,235,RED)+text(20,400,'約第 4 腰椎 → 左右髂總動脈')
save('major-vessels-node-01.svg','主動脈分段｜圖左＝人體右',body,435)
body=path('M145 270V210Q175 115 300 185V280',RED,8)+path('M183 163L170 105M170 105L105 105M170 105V65M230 155V65M277 165L340 90',RED,6)+label(15,215,'頭臂動脈',182,160,RED)+label(15,70,'右頸總',170,78,RED)+label(15,135,'右鎖骨下',110,105,RED)+label(205,50,'左頸總',230,75,RED)+label(285,115,'左鎖骨下',325,107,RED)+text(20,325,'右側多一段頭臂動脈')
save('major-vessels-node-02.svg','主動脈弓三分支',body,360)
body=path('M275 85H225L195 145L165 230L130 350M165 230L205 350',RED,7)+label(230,60,'鎖骨下',248,85,RED)+label(225,160,'腋動脈',195,145,RED)+label(20,210,'肱動脈',168,220,RED)+text(20,240,'量血壓')+label(20,350,'橈動脈',133,341,RED)+text(20,380,'拇指側／摸脈搏')+label(225,335,'尺動脈',200,336,RED)
save('major-vessels-node-03.svg','右上肢動脈放大',body,410)
body=path('M200 60V350M200 105H130L90 80M130 105L80 125M130 105L110 155M200 185H290M200 240H95M200 240H315M200 300H285',RED,7)+label(230,90,'腹腔幹',190,105,RED)+text(20,50,'胃、肝、脾')+label(225,170,'上腸繫膜',272,185,RED)+label(25,220,'成對腎動脈',110,240,RED)+label(215,330,'下腸繫膜',275,300,RED)
save('major-vessels-node-04.svg','腹主動脈分支｜由上而下',body,380)
body=path('M160 65L215 115L205 165L190 235L175 300L135 375M175 300L235 375M135 375L125 405',RED,7)+label(20,65,'髂總',165,70,RED)+label(255,135,'髂外',210,140,RED)+label(20,210,'股動脈',195,210,RED)+label(235,255,'膕動脈',183,265,RED)+label(20,345,'脛前',147,352,RED)+label(255,365,'脛後',222,359,RED)+label(20,440,'足背動脈',125,405,RED)
save('major-vessels-node-05.svg','下肢動脈放大',body,470)
# Full venous figure with leader endpoints guaranteed on drawn paths.
body=circle(200,90,28,'#e2e8f0')+path('M160 125H240L300 335M160 125L100 335M200 145V345M200 345L150 585M200 345L250 585','#e2e8f0',40)
body+=path('M175 155V235M175 235V345M145 132L175 160L250 132M175 345L155 420L140 560M175 345L230 420L250 560',BLUE,7)
# Human right arm on image left: cephalic outer thumb side and basilic inner side.
body+=path('M143 165L112 240L90 315M158 170L138 245L116 315M112 240L138 255',BLUE,4)
# Great saphenous follows medial calf/thigh, drains into femoral at groin.
body+=path('M161 570L177 495L175 430L169.67 365',BLUE,4)
body+=label(15,145,'上腔靜脈',175,182,BLUE)+label(255,128,'左頭臂靜脈',228,140,BLUE)+label(15,235,'頭靜脈',112,240,BLUE)+label(255,222,'貴要靜脈',145,227,BLUE)+label(15,285,'肘正中靜脈',126,250,BLUE)+text(15,312,'抽血常用')+label(255,325,'下腔靜脈',175,305,BLUE)+label(235,400,'股靜脈',155,420,BLUE)+label(230,495,'大隱靜脈',177,495,BLUE)+text(220,525,'人體最長靜脈')+text(20,615,'大隱：足內側 → 腹股溝匯入股靜脈')+text(20,650,'頭靜脈：外側／拇指側；貴要：內側')
save('major-vessels-node-06.svg','主要靜脈｜圖左＝人體右',body,680)
# Trace a drop: a whole body routes figure, highlighted red outbound/blue return.
body=circle(200,82,25,'#e2e8f0')+path('M155 130H245L320 285M155 130L80 285M200 150V350M200 350L150 565M200 350L250 565','#e2e8f0',35)+circle(198,190,20,'#f5c5ca')
for sid,artery,vein in [('right-hand','M205 190V150Q190 125 166 143L137 170L105 280','M95 280L128 170L165 150L180 190'),('left-hand','M205 190V150Q220 125 238 143L268 170L305 280','M315 280L280 165L240 150L180 190'),('left-foot','M205 190V350L248 550','M258 550L215 350V200'),('stomach','M205 190V260H247','M250 270L265 300L215 300V200')]:
 body+=f'<g class="route {sid}">'+path(artery,RED,6)+path(vein,BLUE,6)+'</g>'
body+=text(20,610,'紅：去程 →；藍：回程 →')+text(20,640,'胃的回程先經肝門靜脈 → 肝臟')+circle(265,300,13,'#9a5a00')+text(285,307,'肝臟')
body+='<style>'+''.join(f'[data-state="{s}"] .route:not(.{s}){{opacity:.13}}' for s in ['right-hand','left-hand','left-foot','stomach'])+'</style>'
save('major-vessels-overview.svg','追蹤一滴血｜圖左＝人體右',body,670)
body=circle(200,82,25,'#e2e8f0')+path('M155 130H245L320 310M155 130L80 310M200 150V350M200 350L150 565M200 350L250 565','#e2e8f0',35)
for x,y,s,tx,ty in [(20,55,'顳動脈',180,75),(245,122,'頸動脈',215,120),(15,205,'肱動脈',125,200),(245,290,'橈動脈',305,290),(15,375,'股動脈',190,380),(245,470,'膕動脈',233,465),(20,590,'足背動脈',153,560)]:body+=label(x,y,s,tx,ty,RED)
body+=text(15,640,'頸：緊急評估；肱：量血壓')+text(15,670,'橈：常規脈搏；足背：末梢循環')
save('major-vessels-pulse.svg','脈搏點位｜圖左＝人體右',body,700)
# Electrical: signal color across diagrams, aligned to same horizontal time axis.
body=''
for i,(name,desc) in enumerate([('竇房結起跑','發出電訊號'),('心房','先去極化、隨後收縮'),('房室結紅綠燈','停一下，讓心房先送血'),('希氏束／束支','接棒，朝心尖前進'),('浦金氏纖維','快速分送到心室')]):
 y=65+i*85;body+=circle(40,y+10,12,SIGNAL)+path(f'M40 {y+22}V{y+68}',SIGNAL,3)+text(70,y,name)+text(70,y+30,desc)
body+=text(20,510,'接力賽只是比喻：電先行，收縮隨後')
save('cardiac-electrical-relay.svg','電訊號的接力賽',body,540)
body=rect(25,60,90,235,'#17212b',INK)+circle(70,105,25,'#a71930')+circle(70,175,25,SIGNAL)+circle(70,245,25,SV)+text(140,100,'紅燈：房室結短暫延遲')+text(140,135,'心房先把血送進心室')+text(140,215,'綠燈：接著啟動心室')+path('M25 355H375',SIGNAL,3)+text(25,335,'PR 間隔：心房到心室前傳導')+text(25,400,'紅綠燈只是比喻')
save('cardiac-electrical-traffic.svg','房室結：先等一下再傳下去',body,430)
body=text(20,65,'竇房結節律細胞')+path('M30 165Q50 162 85 120L100 90L115 165H380',SIGNAL,4)+path('M30 120H130','#64748b',2,'stroke-dasharray="4 4"')+text(135,130,'閾值；去極化在 P 之前')
body+=text(20,210,'心室工作心肌：phase 0–4')+path('M30 330H180L190 240L215 255H275L325 330H380',SIGNAL,4)+text(158,310,'0')+text(206,241,'1')+text(245,241,'2')+text(300,285,'3')+text(355,315,'4')
body+=text(20,390,'心電圖：同一示意時間軸')+path('M30 480H115q12-35 25 0H176l7 20 7-65 7 83 8-38H275q25-45 50 0H380',SIGNAL,4)+text(120,425,'P')+text(168,420,'QRS')+text(235,462,'ST')+text(297,430,'T')
for x in [190,250,310]:body+=path(f'M{x} 230V520','#64748b',1.5,'stroke-dasharray="5 5"')
body+=text(20,565,'phase 0 ↔ QRS；phase 2 ↔ ST')+text(20,595,'phase 3 ↔ T；示意圖，非實測比例')
save('cardiac-electrical-aligned.svg','動作電位 × 心電圖對齊',body,625)
# Content additions only; preserve every assessment object, including lab prediction.
for slug in ['cardiac-output','blood-pressure-measurement','capillary-exchange','major-vessels']:
 p=R/'materials-src'/slug/'content.json';c=json.loads(p.read_text());n=c['nodes']
 if slug=='cardiac-output':
  c['lab']['intro']='點選四種狀態，比較心室容積。綠色上段是心搏量，灰色下段是 ESV；數字為示意數值。'
  c['lab']['states']=[dict(id=s,label=l,explain=x) for s,l,x in [('base','基準','心搏量＝EDV−ESV＝120−50＝70 mL（示意數值）。'),('preload','前負荷↑','回心血量增加使 EDV 變大，心肌被拉長；生理範圍內收縮更強，心搏量增加。'),('contractility','收縮力↑','交感（NE）或腎上腺素使收縮力增強，擠得更乾淨，ESV 變小，心搏量增加。'),('afterload','後負荷↑','動脈壓升高，心室射血要克服更大壓力，擠不出去的血變多，ESV 變大，心搏量減少。')]]
  n[0]['caption']='幫浦只是比喻；心臟是心肌主動收縮。';n[1]['caption']='射出分率＝70÷120≈58%，約 60%（示意數值）。';n[2]['caption']='心肌像彈簧：生理範圍內拉得越長，收縮越強。彈簧只是比喻，心肌是主動收縮。';n[2]['points']=list(dict.fromkeys(n[2]['points']+['心室被撐得過度時（超出生理範圍），收縮力反而下降。']));n[0]['reference']='延伸：血壓測量的平均動脈壓 MAP 也用到心輸出量。'
  def leaf(id,label,sign,num,up,down):return dict(id=id,label=label,sign=sign,nodeId=n[num-1]['id'],explainUp=up,explainDown=down)
  c['overview']=dict(type='factor-tree',title='公式樹總覽',root='心輸出量 CO',branches=[dict(id='hr',label='心率 HR ×',sign=1,children=[leaf('ne','交感 NE',1,6,'交感作用使心率增加。','交感作用減少使心率降低。'),leaf('ach','迷走 ACh',-1,6,'副交感主要降低心率。','迷走作用減少，對心率的煞車減弱。'),leaf('epinephrine','腎上腺素',1,6,'腎上腺髓質經血液送達心臟。','腎上腺素作用減少，心率傾向降低。')]),dict(id='sv',label='心搏量 SV',sign=1,children=[leaf('preload','前負荷',1,3,'生理範圍內，EDV 增加使收縮更強。','回心血量減少使 EDV 與心搏量減少。'),leaf('contractility','收縮力',1,4,'相同前負荷下，ESV 減少，心搏量增加。','收縮較弱使 ESV 增加，心搏量減少。'),leaf('afterload','後負荷',-1,5,'動脈壓升高使射血較困難，ESV 增加。','射血要克服的壓力減少，心搏量傾向增加。')])],specials=[dict(id='too-fast',label='心率過快',nodeId=n[5]['id'],explainUp='心率↑，但充血時間不足 → EDV↓ → 心搏量↓，CO 不一定增加。')])
  c['misconceptions']=[dict(wrong='心率越快，心輸出量一定越大',correct='過快時舒張期縮短、充血不足，心搏量下降。'),dict(wrong='心肌拉越長收縮越強，沒有上限',correct='超出生理範圍反而變弱。')]
 elif slug=='blood-pressure-measurement':
  c['lab']={k:v for k,v in c['lab'].items() if k not in ['figure','states']};c['lab']['widget']='bp-cuff';c['lab']['intro']='拖動壓脈帶壓力或自動放氣，觀察 120／80 示意模型的血流與柯氏音。';n[0]['caption']='水管只是比喻。';n[5]['reference']='延伸：心輸出量的調節說明 CO 如何影響平均動脈壓 MAP。'
  c['misconceptions']=[dict(wrong='聽到的是心跳聲（心音）',correct='是血液斷續衝過受壓動脈的柯氏音。'),dict(wrong='放氣越快越準',correct='太快可能錯過第一聲。')]
 elif slug=='capillary-exchange':
  for k in [2,3,4]:n[k]['caption']='拔河只是比喻。數值為 OpenStax 簡化模型的示意數值。'
  n[5]['reference']='延伸：淋巴系統說明組織液如何回到血液循環。'
  c['overview']=dict(type='factor-tree',title='組織液公式樹',root='組織液量（過多＝水腫）',branches=[dict(id='filtration',label='濾出',sign=1,children=[dict(id='hydrostatic',label='微血管靜水壓',sign=1,nodeId=n[2]['id'],explainUp='外推力量增加，濾出增加。',explainDown='外推力量減少，濾出減少。'),dict(id='oncotic',label='血漿膠體滲透壓',sign=-1,nodeId=n[3]['id'],explainUp='白蛋白的內拉力量增加，濾出減少。',explainDown='血漿白蛋白減少 → 膠體滲透壓↓ → 拉回的力量變小、濾出↑ → 組織液↑，過多時形成水腫。')]),dict(id='lymph-return',label='淋巴回收',sign=-1,children=[dict(id='lymph-flow',label='淋巴回流',sign=1,nodeId=n[5]['id'],explainUp='淋巴收走更多組織液，組織液量減少。',explainDown='淋巴回收減少，組織液量增加。')])])
  c['misconceptions']=[dict(wrong='液體在微血管只會往外流',correct='靜脈端會回收。'),dict(wrong='組織液全部回到微血管',correct='多出的由淋巴回收。')]
 else:
  routes=[('right-hand','右手','左心室→升主動脈→主動脈弓→頭臂動脈→右鎖骨下→腋→肱→橈、尺動脈','手部微血管→腋靜脈→右鎖骨下靜脈→右頭臂靜脈→上腔靜脈→右心房'),('left-hand','左手','左心室→升主動脈→主動脈弓→左鎖骨下→腋→肱→橈、尺動脈','手部微血管→腋靜脈→左鎖骨下靜脈→左頭臂靜脈→上腔靜脈→右心房'),('left-foot','左腳','左心室→主動脈→腹主動脈→左髂總→髂外→股→膕→脛前、脛後','足部微血管→股靜脈→髂外靜脈→髂總靜脈→下腔靜脈→右心房'),('stomach','胃','左心室→主動脈→腹主動脈→腹腔幹→胃的動脈','胃的微血管→肝門靜脈→肝臟→肝靜脈→下腔靜脈→右心房。延伸：循環路線的肝門脈循環')]
  c['lab']['intro']='追蹤一滴血：點選目的地，紅色高亮去程，藍色高亮回程。圖左是人體右側。';c['lab']['states']=[dict(id=s,label=l,explain=f'去程（紅）：{a}。回程（藍）：{b}。') for s,l,a,b in routes]
  c['extras']=[dict(title='脈搏點位圖',figure='major-vessels-pulse.svg',caption='圖左＝人體右。顳、頸、肱、橈、股、膕、足背動脈是可觸摸脈搏的位置。')]
  c['misconceptions']=[dict(wrong='主動脈弓左右兩側分支一樣',correct='右側先經頭臂動脈，左側直接分出左頸總、左鎖骨下。')]
 p.write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
print('Four kit sources and 31 vector figures generated; assessment objects retained.')
