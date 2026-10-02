"""Author 42 SVGs with independent, topic-specific visual models.

480-unit canvases and >=22-unit text keep the 390px layout readable.
All anatomy drawings are schematic; front views use image left = subject right.
"""
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'materials-src/figures'
RED='#ab2944'; BLUE='#216d9d'; PURPLE='#65428b'; GREEN='#24735c'

def text(x,y,s,size=22,color='#17212b',anchor='middle'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{escape(s)}</text>'
def path(d,color=RED,width=7,extra=''):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def circle(x,y,r,color):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/>'
def wrap(s,n=18):
    # Split for SVG lines without shrinking text. Explicit compact model labels.
    return [s[i:i+n] for i in range(0,len(s),n)]
def box(x,y,w,lines,fill='#fff',stroke='#d8cce5'):
    h=30+30*len(lines)
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{fill}" stroke="{stroke}"/>'+''.join(text(x+w/2,y+32+i*30,l) for i,l in enumerate(lines)),h
def svg(body,h=480):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 {h}" role="img" style="font-family:system-ui,sans-serif"><rect width="480" height="{h}" rx="22" fill="#f7f3fa"/>{body}</svg>'
def flow(title,steps):
    title_lines = ['前負荷與', 'Frank-Starling 定律'] if title == '前負荷與 Frank-Starling' else wrap(title,17)
    body=''.join(text(240,36+i*28,l,24) for i,l in enumerate(title_lines))
    y=62+28*(len(title_lines)-1)
    for i,step in enumerate(steps):
        lines=step if isinstance(step,list) else wrap(step)
        b,h=box(28,y,424,lines,fill='#fff' if i%2==0 else '#e4f0f6');body+=b;y+=h
        if i<len(steps)-1:
            body+=path(f'M240 {y+5} v18',PURPLE,3)+f'<path d="M232 {y+16} l8 12 l8 -12" fill="{PURPLE}"/>';y+=36
        else:y+=22
    return svg(body,y)

FLOWS={
'cardiac-output':[
 ('心輸出量', ['心率 HR（次／分）','× 每搏量 SV（mL）',['70 × 70 ≈ 4900 mL/min','靜息約 5 L/min'],'長時間左右心輸出量相等']),
 ('每搏量與射出分率',[['舒張末期 EDV','約 120 mL'],['− 收縮末期 ESV','約 50 mL'],['SV ≈ 70 mL','SV ÷ EDV ≈ 60%']]),
 ('前負荷與 Frank-Starling',['回心血量增加','EDV 增加 → 心肌拉長','生理範圍內收縮增強','每搏量增加']),
 ('相同前負荷下的收縮力',[['交感：正腎上腺素','腎上腺素'],'收縮力增加',['射出較多血液','SV ↑、ESV ↓']]),
 ('後負荷',['心室射血','克服動脈壓力',['其他條件不變','後負荷 ↑ → SV 傾向 ↓']]),
 ('自主神經與心率',[['交感作用 → 心率 ↑','迷走／乙醯膽鹼 → 心率 ↓'],['安靜時迷走作用較強','心率低於竇房結自身頻率'],['心率極快 → 舒張期縮短','充血時間減少']])],
'blood-pressure-measurement':[
 ('聽診法原理',['壓脈帶加壓','阻斷肱動脈血流','緩慢放氣','聽血流恢復的聲音']),
 ('柯氏音',['受壓變窄的肱動脈','血液斷續衝過','形成亂流','產生柯氏音']),
 ('收縮壓',['緩慢放氣','第一個規律柯氏音出現','此時壓力＝收縮壓']),
 ('舒張壓',['繼續放氣','血流恢復平順','柯氏音消失','此時壓力＝舒張壓']),
 ('測量步驟',[['坐姿休息、手臂與心臟同高','壓脈帶寬度合適'],['聽診器放肘窩肱動脈','橈動脈摸不到再加約 30 mmHg'],'每秒約 2–3 mmHg 放氣']),
 ('判讀與換算',[['120／80 mmHg','脈壓＝120−80＝40'],['MAP≈80＋40÷3','約 93 mmHg'],['手臂高於心臟 → 偏低','手臂低於心臟 → 偏高']])],
'capillary-exchange':[
 ('順濃度梯度擴散',[['O₂、CO₂、葡萄糖等','濃度較高的一側'],'通過微血管壁','濃度較低的一側']),
 ('通過管壁的途徑',[['脂溶性物質','穿過內皮細胞'],['水與小分子','經細胞間隙'],['大分子如血漿蛋白','不易通過']]),
 ('微血管靜水壓',['血液的壓力','把液體推出管壁','組織间隙']),
 ('血漿膠體滲透壓',['白蛋白不易穿過管壁','形成膠體滲透壓','把液體拉回血管']),
 ('淨過濾模型',[['動脈端 35−25＝10 mmHg','向外：淨濾出'],['靜脈端 18−25＝−7 mmHg','向內：淨回收']]),
 ('淋巴回收',[['濾出略多於回收','多出的組織液與少量蛋白質'],'淋巴微管','淋巴管 → 回到靜脈'])],
'blood-types':[
 ('血型與紅血球表面抗原',['紅血球表面','抗原（凝集原）','決定血型']),
 ('ABO 抗原與抗體',[['A 型：A 抗原／抗 B','B 型：B 抗原／抗 A'],['AB 型：A、B 抗原','無抗 A、抗 B'],['O 型：無 A、B 抗原','抗 A、抗 B']]),
 ('凝集反應',['抗原','遇到對應抗體','紅血球黏聚','進而破壞']),
 ('Rh 系統',[['有 D 抗原 → Rh 陽性','無 D 抗原 → Rh 陰性'],['Rh 陰性通常不天生帶抗 D','接觸 Rh 陽性血後才產生']]),
 ('輸血原則',[['以同型輸血為原則','輸入紅血球的抗原'],'不可遇受血者對應抗體',['O 型紅血球無 A、B 抗原','傳統：萬能捐血者／受血者']]),
 ('血型鑑定',['分別加入抗 A、抗 B、抗 D','看是否凝集','凝集表示具有對應抗原'])],
'lymphoid-organs':[
 ('初級與次級淋巴器官',[['初級：骨髓、胸腺','淋巴球生成與成熟'],['次級：淋巴結、脾臟、扁桃腺','黏膜相關淋巴組織'],['遇見抗原','啟動免疫防禦']]),
 ('胸腺',[['胸骨後方','縱膈前上部'],'T 細胞在此成熟',['青春期後逐漸退化','被脂肪組織取代']]),
 ('脾臟',[['人體左上腹','最大的淋巴器官'],['白髓：淋巴球參與免疫','紅髓：過濾血液'],['清除老舊紅血球','與淋巴結的過濾對象不同']]),
 ('淋巴結構造',[['多條輸入淋巴管','被膜'],['皮質：B 細胞濾泡','副皮質：T 細胞','髓質'],'輸出淋巴管由門部離開']),
 ('扁桃腺',[['咽扁桃腺','腭扁桃腺','舌扁桃腺'],'環繞咽部','形成入口防線']),
 ('黏膜相關淋巴組織',[['消化道與呼吸道黏膜','遇見抗原'],['小腸迴腸的培氏斑','闌尾'],'屬於次級淋巴器官'])]
}

def human():
    return circle(240,80,42,'#eee4dd')+f'<path d="M210 120 L180 140 L120 280 L145 292 L194 208 L195 345 L174 580 L211 580 L240 388 L269 580 L306 580 L285 345 L286 208 L335 292 L360 280 L300 140 L270 120 Z" fill="#eee4dd" stroke="#cec0b6"/>'

def vessels(topic=0):
    b=human()+text(88,36,'人體右',22)+text(388,36,'人體左',22)
    # Ascending aorta on subject right, arch to descending aorta on subject left.
    b+=path('M230 222 L216 176 Q224 144 258 158 Q279 162 274 190 L274 354 M274 354 L216 408 L205 500 L193 568 M274 354 L288 408 L279 500 L287 568')
    b+=path('M231 159 L218 132 L211 97 M218 132 L171 158 L139 246 M253 155 L252 99 M268 166 L302 156 L341 246')
    b+=path('M139 246 L125 284 M139 246 L148 289 M341 246 L332 290 M341 246 L355 284',RED,4)
    b+=path('M274 280 L238 273 M274 300 L228 309 M274 326 L249 340 M274 292 L294 292',RED,4)
    b+=path('M198 106 L202 159 L230 188 L230 226 M323 157 L230 188 M192 559 L210 411 L241 355 L241 248 M289 559 L276 411 L241 355',BLUE,6)
    b+=circle(228,225,15,RED)+text(72,614,'紅：動脈',22,RED,'start')+text(302,614,'藍：靜脈',22,BLUE,'start')
    groups=[
      [(80,165,'升主動脈',216,180),(350,196,'主動脈弓',270,168),(360,268,'胸主動脈',274,245),(356,353,'腹主動脈',274,340),(81,433,'髂總動脈',225,400)],
      [(82,83,'頭臂動脈',218,132),(345,83,'左頸總',252,108),(363,132,'左鎖骨下',301,158),(78,119,'右頸總',211,99),(75,187,'右鎖骨下',172,158)],
      [(82,152,'鎖骨下',173,158),(78,208,'腋動脈',162,196),(66,252,'肱動脈',139,242),(65,318,'橈、尺動脈',143,281)],
      [(72,260,'腹腔幹',240,273),(93,324,'上腸繫膜',228,309),(84,370,'下腸繫膜',249,340),(365,301,'腎動脈',294,292)],
      [(80,397,'髂外動脈',216,408),(82,466,'股動脈',209,460),(73,522,'膕動脈',204,501),(357,569,'脛前、脛後',283,549)],
      [(72,227,'上腔靜脈',230,188),(72,329,'下腔靜脈',241,311),(80,539,'大隱靜脈',203,525),(373,246,'上肢淺靜脈',323,157)]
    ]
    for x,y,label,tx,ty in groups[topic]:
        b+=path(f'M{x} {y+6} L{tx} {ty}','#73666e',1)+text(x,y,label)
    return svg(b,645)

def vesselOverview():
    # Same front-view topology, independent highlighted regions for the three states.
    base=vessels(1)
    body=base[base.index('>',base.index('<svg'))+1:base.rindex('</svg>')]
    labels=[('頭頸與上肢','主動脈弓的三條分支'),('腹部器官','腹腔幹／腸繫膜／腎動脈'),('下肢','髂總 → 股 → 膕 → 脛動脈')]
    # Make region overlays separate, so state selection is immediately visible.
    for i,(title,subtitle) in enumerate(labels):
        y=[125,270,415][i]
        body+=f'<g data-panel="state-{i+1}"><rect x="104" y="{y}" width="272" height="125" rx="14" fill="none" stroke="{PURPLE}" stroke-width="5" stroke-dasharray="8 6"/>'+text(240,676,title,24)+text(240,710,subtitle,22)+'</g>'
    return svg(body,740)

def bloodslides():
    b=''
    for state,label,aggs in [('state-1','A 型 Rh＋',[True,False,True]),('state-2','O 型 Rh＋',[False,False,True]),('state-3','AB 型 Rh−',[True,True,False])]:
        group=text(240,42,label,28)
        for i,(reagent,agg) in enumerate(zip(['抗 A','抗 B','抗 D'],aggs)):
            y=80+i*135
            group+=f'<rect x="28" y="{y}" width="424" height="110" rx="12" fill="#fff" stroke="#c8bacf"/>'+text(94,y+44,reagent,24)+text(94,y+80,'血清',22)
            positions=[(255,34),(268,42),(260,56),(281,58),(288,38),(295,60),(268,72)] if agg else [(230,26),(270,24),(310,25),(230,64),(272,64),(310,65)]
            for x,dy in positions:group+=circle(x,y+dy,9,RED)
            group+=text(365,y+62,'凝集' if agg else '不凝集')
        b+=f'<g data-panel="{state}">{group}</g>'
    return svg(b,510)

def cuff():
    b=''
    for i,(title,p,flow,sound) in enumerate([('高於收縮壓',150,'無血流','無聲'),('介於兩者之間',100,'收縮期斷續衝過','柯氏音'),('低於舒張壓',60,'恢復平順','聲音消失')]):
        group=text(240,42,title,26)+text(240,76,f'壓脈帶 {p} mmHg')
        group+=f'<rect x="195" y="95" width="90" height="140" rx="12" fill="#d2c5e2"/>'
        # Artery lumen under the cuff is closed / narrowed / fully patent.
        gap=[0,7,23][i]
        group+=path(f'M35 146 H174 Q195 {174-gap} 240 {174-gap} Q282 {174-gap} 306 146 H445',RED,6)
        group+=path(f'M35 202 H174 Q195 {174+gap} 240 {174+gap} Q282 {174+gap} 306 202 H445',RED,6)
        if i>0:
            group+=path('M65 174 H405',BLUE,5,'stroke-dasharray="10 8"' if i==1 else '')+f'<path d="M405 166 l15 8 l-15 8" fill="{BLUE}"/>'
        group+=text(240,268,'肱動脈剖面')+text(240,309,flow,24)+text(240,347,sound,24,PURPLE)
        group+=path('M55 390 H425','#9d8eaa',8)+text(70,429,'80',22)+text(350,429,'120',22)+text(240,467,'示例舒張壓／收縮壓 mmHg',22)
        x=55+(p-60)/100*370;group+=circle(x,390,10,RED)
        b+=f'<g data-panel="state-{i+1}">{group}</g>'
    return svg(b,490)

def organs():
    b=human()+text(76,36,'人體右')+text(376,36,'人體左')
    for i,(label,coords) in enumerate([
      ('初級：骨髓、胸腺',[(240,171),(199,485)]),
      ('次級：淋巴結、脾臟、扁桃腺',[(205,122),(275,122),(300,276),(183,192),(296,192),(223,362),(258,362)]),
      ('黏膜：扁桃腺、培氏斑、闌尾',[(240,119),(271,320),(209,332)])]):
        g=''
        for x,y in coords:g+=circle(x,y,12,GREEN)
        lines=wrap(label,17)
        for j,line in enumerate(lines):g+=text(240,622+j*30,line,24)
        b+=f'<g data-panel="state-{i+1}">{g}</g>'
    return svg(b,700)

def overview(slug):
    if slug=='major-vessels':return vesselOverview()
    if slug=='blood-types':return bloodslides()
    if slug=='blood-pressure-measurement':return cuff()
    if slug=='lymphoid-organs':return organs()
    data={
      'cardiac-output':[('交感興奮',['心率 ↑、收縮力 ↑','CO ↑']),('迷走興奮',['心率 ↓','CO ↓']),('回心血量增加',['EDV ↑','Frank-Starling → SV ↑'])],
      'capillary-exchange':[('動脈端',['靜水壓 35 ＞ 膠體滲透壓 25','向外淨濾出 10 mmHg']),('靜脈端',['靜水壓 18 ＜ 膠體滲透壓 25','向內淨回收 7 mmHg']),('淋巴回收',['濾出略多於回收','組織液與少量蛋白質','淋巴微管 → 回靜脈'])]
    }[slug]
    b=''
    for i,(title,steps) in enumerate(data):
        f=flow(title,steps);inner=f[f.index('>')+1:f.rindex('</svg>')];b+=f'<g data-panel="state-{i+1}">{inner}</g>'
    return svg(b,430)

if __name__=='__main__':
    for slug,nodes in FLOWS.items():
        for i,(title,steps) in enumerate(nodes):(OUT/f'{slug}-node-{i+1:02}.svg').write_text(flow(title,[s.replace('间','間') if isinstance(s,str) else s for s in steps]))
        (OUT/f'{slug}-overview.svg').write_text(overview(slug))
    for i in range(6):(OUT/f'major-vessels-node-{i+1:02}.svg').write_text(vessels(i))
    (OUT/'major-vessels-overview.svg').write_text(overview('major-vessels'))
    print('42 dedicated SVGs written')

    # Keep teacher-authorized explanations/tables and diagrams when regenerating sources.
    import runpy
    runpy.run_path(str(ROOT / "scripts/material-learning-refresh.py"), run_name="__main__")
