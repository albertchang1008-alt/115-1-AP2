"""Transcribe the approved Stage 1 spec; figures are authored separately.

Keep original node prose verbatim in concept, and question/option strings verbatim.
Supplementary hints/explanations point back to the specified node; no new scope.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC = (ROOT / 'docs/STAGE1_SUPPLEMENT_SPEC.md').read_text()
SLUGS = ['cardiac-output', 'blood-pressure-measurement', 'capillary-exchange', 'major-vessels', 'blood-types', 'lymphoid-organs']
NODE_NAMES = {
    'blood-types': ['血型與紅血球抗原', 'ABO 系統', '凝集反應', 'Rh 系統', '輸血原則', '血型鑑定'],
}
MAPS = [([1,2,3,4,6,5],[1,3,4,5,6]),([1,2,3,4,5,6],[3,2,6,5,6]),([1,3,4,4,5,6],[5,5,4,3,1]),([2,3,4,5,6,6],[3,6,2,6,4]),([1,2,2,2,4,3],[6,6,3,4,5]),([1,2,3,3,5,6],[1,2,5,3,6])]
HINTS = [
 ['回想每分鐘的搏動次數與每次射出的血量。','用舒張末期容積減去收縮末期容積。','注意生理範圍內心肌拉長與收縮的關係。','比較交感作用對心率與收縮力的方向。','回想安靜時迷走神經的作用。','分清射血前的充血與射血時要克服的壓力。','先乘心率與每搏量，再將 mL 換成 L。','把回心血量、EDV 與 Frank-Starling 連起來。','收縮更強時，收縮末期留下的血量較多還是較少？','其他條件固定，心室要克服的壓力增加。','心率變快時，每次舒張可用的時間會變短。'],
 ['找肘窩聽診器對應的動脈。','想想血液衝過受壓管腔時的流動。','對照壓脈帶放氣時聲音剛出現的時刻。','對照血流變平順後聲音的變化。','比較手臂高度與心臟高度。','用收縮壓減舒張壓。','記錄聲音開始與消失的壓力，不是最高加壓值。','收縮時的壓力才能衝過壓脈帶。','對照節點 6 的手臂高度與讀值。','第一聲只在放氣過程中的特定壓力出現。','先算脈壓，再將三分之一加到舒張壓。'],
 ['想想物質順濃度梯度移動的方式。','哪個力把液體從血管推出？','哪個力把液體拉回血管？','找血漿內不易通過管壁的蛋白質。','比較動脈端 35 與 25 mmHg。','濾出略多於回收，多出的液體如何回靜脈？','用向外的 35 減向內的 25。','比較向外 18 與向內 25，哪個較大？','白蛋白減少時，拉回液體的力會怎麼變？','推出液體的靜水壓增加。','肌肉內 CO₂ 較多，順濃度梯度移動。'],
 ['分清主動脈弓直接分支與頭臂動脈的分支。','由軀幹走向手指，按血管位置排序。','成對表示左、右各有一條。','由骨盆往膝後追蹤動脈。','上腔靜脈收集橫膈以上的主要回流。','回想下肢的長淺層靜脈。','拇指側對應橈骨一側。','找肘窩的淺層靜脈名稱。','人體右側先經頭臂動脈。','腳的回流經下腔靜脈進右心房。','對照腹腔幹與腎動脈的供應部位。'],
 ['看紅血球表面，而非血漿顏色。','A 型具有 A 抗原，血漿抗體對應哪個另一種抗原？','O 型在 ABO 系統中不帶哪兩種抗原？','AB 型同時具有 A 與 B 抗原。','Rh 系統的關鍵是 D 抗原。','分清紅血球凝集與血小板作用。','凝集表示玻片抗體找到對應抗原。','兩種 ABO 血清都不凝集，表示哪兩種抗原都沒有？','B 型血漿有抗 A 抗體，輸入的是 A 型紅血球。','Rh 陰性通常不天生帶抗 D。','注意這是 ABO 紅血球抗原的傳統用語。'],
 ['初級器官負責生成與成熟。','T 細胞與 B 細胞的成熟位置不同。','比較胸腺、脾臟與單個淋巴結。','分清脾臟白髓與紅髓。','找口咽入口兩側的淋巴組織。','培氏斑是消化道黏膜的淋巴組織。','分清血液過濾與淋巴過濾。','回想胸腺在青春期後的變化。','經口鼻進入先到咽部入口。','白髓富含淋巴球。','分清成熟淋巴球與遇見抗原的位置。']
]
EXPLAINS = [
 ['CO＝HR×SV，表示一側心室每分鐘射出的血量。','SV＝EDV−ESV＝120−50＝70 mL。','生理範圍內，前負荷增加使心肌拉長，依 Frank-Starling 收縮增強。','交感作用使心率與收縮力增加。','迷走神經以乙醯膽鹼降低心率。','後負荷是心室射血必須克服的動脈壓力。','140×100＝14000 mL/min＝14 L/min。','回心血量增加使 EDV 增加，生理範圍內 SV 增加。','相同前負荷下收縮力增强，射出較多血，ESV 減少。','主動脈壓升高使後負荷增加，其他條件不變時 SV 傾向減少。','心率極快使舒張期縮短，充血時間減少，EDV 可能下降。'],
 ['聽診法在肘窩的肱動脈聽取血流聲音。','柯氏音由血液斷續衝過被壓窄動脈形成的亂流產生。','放氣時第一個規律柯氏音的壓力是收縮壓。','柯氏音消失時的壓力是舒張壓。','手臂應與心臟同高，以避免高度影響讀值。','脈壓＝120−80＝40 mmHg。','第一聲在 118、消失在 76，記為 118/76 mmHg。','壓脈帶壓力介於兩者時，只有收縮期血液能斷續衝過。','手臂高於心臟時讀值偏低，低於心臟則偏高。','放氣太快可能錯過第一聲，造成判讀不準。','MAP≈80＋(120−80)÷3≈93 mmHg。'],
 ['O₂、CO₂、葡萄糖等順濃度梯度擴散，是最主要交換方式。','微血管靜水壓把液體推出血管。','血漿膠體滲透壓把液體拉回血管。','膠體滲透壓主要由不易通過管壁的白蛋白形成。','模型動脈端靜水壓大於膠體滲透壓，液體淨濾出。','多出的組織液由淋巴管回收並送回靜脈。','35−25＝10 mmHg，淨方向向外。','18 小於 25 mmHg，向內的力較大，液體淨回收。','白蛋白減少使膠體滲透壓減少，回收液體減少、組織液增加。','下肢靜水壓升高使推出液體的力增加，組織液生成增加。','肌肉內 CO₂ 濃度增加，順濃度梯度擴散到微血管。'],
 ['頭臂動脈直接由主動脈弓分出，再分為右頸總與右鎖骨下動脈。','上肢動脈由鎖骨下、腋、肱，接到橈與尺動脈。','左右腎動脈是腹主動脈的成對分支。','下肢動脈由髂外到股，再到膝後的膕動脈。','上腔靜脈收集頭頸與上肢的血液。','大隱靜脈是人體最長的靜脈。','手腕拇指側可摸到橈動脈脈搏。','肘正中靜脈是肘窩常用的淺靜脈。','右上肢由頭臂動脈經右鎖骨下、腋、肱動脈供血。','下肢靜脈經股、髂外、髂總、下腔靜脈回右心房。','腹腔幹供應胃、肝、脾等上腹部器官。'],
 ['血型由紅血球表面抗原（凝集原）決定。','A 型有 A 抗原與抗 B 抗體。','O 型紅血球無 A、B 抗原。','AB 型有 A、B 抗原，血漿無對應的抗 A、抗 B 抗體。','具有 D 抗原為 Rh 陽性。','抗原與對應抗體結合，使紅血球黏聚而發生凝集。','抗 A 凝集、抗 B 不凝集表示有 A、無 B 抗原，是 A 型。','抗 A、抗 B 都不凝集表示無 A、B 抗原，是 O 型。','B 型血漿中的抗 A 抗體與輸入 A 型紅血球抗原結合，造成凝集。','Rh 陰性者通常不天生帶抗 D，接觸 Rh 陽性血後才逐漸產生。','傳統用語來自 O 型紅血球無 A、B 抗原；輸血仍以同型為原則。'],
 ['骨髓與胸腺是初級淋巴器官，負責生成與成熟。','T 細胞在胸腺成熟。','脾臟位於左上腹，是最大的淋巴器官。','紅髓過濾血液並清除老舊紅血球。','腭扁桃腺位於口咽兩側。','培氏斑位於小腸迴腸黏膜。','脾臟過濾血液，淋巴結過濾淋巴。','胸腺青春期後逐漸退化，被脂肪組織取代。','扁桃腺環繞咽部，形成入口防線。','白髓富含淋巴球，參與免疫反應。','培氏斑是黏膜相關淋巴組織，屬次級淋巴器官。']
]

def parse():
    output=[]
    sections=re.split(r'^### \d+\. ',SPEC,flags=re.M)[1:]
    for si,(slug,section) in enumerate(zip(SLUGS,sections)):
        title=section.split(' `')[0]
        field=lambda label: re.search(rf'^- {label}：(.*)$',section,re.M).group(1)
        subtitle=field('副標題')
        statparts=field('stats').split('／')
        stats=[]
        for part in statparts:
            # Slash inside a backtick-delimited value is significant (none here).
            value=re.search(r'`(.*?)`',part).group(1)
            stats.append({'value':value,'label':re.sub(r'`.*?`','',part).strip() or value})
        labraw=re.search(r'^- 實驗室.*?：(.+)\n',section,re.M).group(1)
        states=[]
        for i,raw in enumerate(re.split('[①②③]',labraw)[1:]):
            raw=raw.strip('；。 ')
            label=raw.split('：')[0]
            states.append({'id':f'state-{i+1}','label':label,'explain':raw})
        pred=re.search(r'  預測：(.*?)→ (.*?)。',section).groups()
        c={'slug':slug,'version':'v1','experience':'guided','title':title,'subtitle':subtitle,'label':title+'｜互動資訊圖表','stats':stats,'lab':{'title':'情境實驗室','intro':'切換情境，比較圖中的路徑、數值與反應。','figure':f'{slug}-overview.svg','states':states,'predict':{'question':pred[0].strip(),'options':[pred[1],'不變','相反方向','無法由此模型判斷'],'answer':0,'feedback':pred[1]}},'nodes':[],'foundation':[],'cases':[],'credits':[field('出處')]}
        nodeblock=section.split('- 節點：\n')[1].split('- 先備：')[0]
        for i,raw in enumerate(re.findall(r'^  \d+\. (.*)$',nodeblock,re.M)):
            titleNode=raw.split('：')[0] if '：' in raw else NODE_NAMES.get(slug,[raw]*6)[i]
            body=raw.split('：',1)[1] if '：' in raw else raw
            parts=[x.strip() for x in re.split('[；。]',body) if x.strip()]
            c['nodes'].append({'id':f'{slug}-node-{i+1:02}','tag':f'{i+1:02}','title':titleNode,'summary':parts[0],'figure':f'{slug}-node-{i+1:02}.svg','concept':raw,'points':(parts+[body]*3)[:3],'clinical':{'title':'觀察與應用','text':EXPLAINS[si][MAPS[si][0].index(i+1)] if i+1 in MAPS[si][0] else body}})
        for kind,label in [('foundation','先備'),('cases','情境')]:
            for qi,raw in enumerate(re.split('[①②③④⑤⑥]',field(label))[1:]):
                stem,opts=raw.strip().split('？',1);options=opts.split('／');assert len(options)==4,(slug,raw)
                pos=[2,0,3,1][(si*11+qi+(0 if kind=='foundation' else 6))%4];correct=options.pop(0);options=options[1:]+options[:1];options.insert(pos,correct)
                seq=qi if kind=='foundation' else qi+6
                ni=MAPS[si][0 if kind=='foundation' else 1][qi]
                c[kind].append({'id':f'{slug}-{"foundation" if kind=="foundation" else "case"}-q{qi+1:02}','stem':stem+'？','options':options,'answer':pos,'hint':HINTS[si][seq],'explain':EXPLAINS[si][seq].replace('增强','增強'),'nodeId':f'{slug}-node-{ni:02}'})
        # Prediction choices also shuffled, with source answer retained exactly.
        correct=c['lab']['predict']['options'][0]; c['lab']['predict']['options']=[c['lab']['predict']['options'][2],correct,c['lab']['predict']['options'][1],c['lab']['predict']['options'][3]];c['lab']['predict']['answer']=1
        if slug=='blood-types':
            c['summaryTable']={'headers':['主題','關鍵概念','整理重點'],'rows':[[n['title'],n['summary'],'；'.join(n['points'])] for n in c['nodes']]}
            c['summaryTable']['rows'][1]=['ABO 系統','依紅血球上的 A、B 抗原區分四型','A 型：A 抗原、抗 B 抗體；B 型：B 抗原、抗 A 抗體；AB 型：A、B 抗原，無抗 A／抗 B 抗體；O 型：無 A、B 抗原，有抗 A／抗 B 抗體']
        output.append(c)
    return output

if __name__=='__main__':
    for c in parse():
        dest=ROOT/'materials-src'/c['slug'];dest.mkdir(exist_ok=True)
        (dest/'content.json').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
        print(c['slug'],len(c['nodes']),len(c['foundation'])+len(c['cases']))

    # Keep teacher-authorized explanations/tables and diagrams when regenerating sources.
    import runpy
    runpy.run_path(str(ROOT / "scripts/material-learning-refresh.py"), run_name="__main__")
