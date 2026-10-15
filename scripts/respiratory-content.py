"""Transcribe only the teacher-approved respiratory spec, preserving question text."""
import re,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
spec=(ROOT/'docs/RESPIRATORY_INFOGRAPHICS_SPEC.md').read_text()
sections=re.findall(r'^## [①②③④⑤⑥⑦] (.*?) `([a-z0-9-]+)`\n(.*?)(?=^## |\Z)',spec,re.M|re.S)
for si,(title,slug,body) in enumerate(sections):
    field=lambda k:re.search(r'^- '+k+r'：(.*)$',body,re.M).group(1)
    stats=[{'value':m[0],'label':m[1].strip('／ ')} for m in re.findall(r'`([^`]+)`([^`]*)(?=／`|$)',field('stats'))]
    raw=re.search(r'^- 實驗室.*?：(.+)$',body,re.M).group(1)
    states=[{'id':f'state-{i+1}','label':x.split('：')[0].strip(),'explain':x.strip('；。 ')} for i,x in enumerate(re.split('[①②③]',raw)[1:])]
    question,correct=re.search(r'  預測：(.*?)→ (.*?)。',body).groups()
    c={'slug':slug,'version':'v1','experience':'guided','title':title,'subtitle':field('副標題'),'label':title+'｜互動資訊圖表','stats':stats,'lab':{'title':'情境實驗室','intro':'切換三種情境，對照模型與課本概念。','figure':slug+'-overview.svg','states':states,'predict':{'question':question.strip(),'options':[correct,'與模型所示方向相反','沒有變化','與此構造無關'],'answer':0,'feedback':correct}},'nodes':[],'foundation':[],'cases':[],'credits':[field('出處')]}
    lines=re.findall(r'^  \d+\. \*\*(.*?)\*\*（(.*?)）：(.*)$',body,re.M)
    assert len(lines)==6,(slug,len(lines))
    for i,(name,source,prose) in enumerate(lines):
        # A conditional instruction for the agent is not student content.
        prose=re.sub(r'（\*\*Codex.*?\*\*）','',prose)
        if slug=='respiratory-control' and i==2:prose='周邊化學受器包括頸動脈體與主動脈體；'+prose
        main,sep,application=prose.partition('應用：')
        if not sep:
            main,sep,application=prose.partition('臨床延伸：')
            if sep:application='臨床延伸：'+application
        clauses=[x.strip() for x in re.split('[；。]',main) if x.strip()]
        summary=clauses[0]
        points=clauses[1:]
        if not points:points=[name+'：'+main.strip()]
        c['nodes'].append({'id':f'{slug}-node-{i+1:02}','tag':f'{i+1:02}','title':name,'summary':summary,'figure':f'{slug}-node-{i+1:02}.svg','concept':main.strip(),'points':points,'clinical':{'title':'觀察與應用','text':application.strip() if sep else '對照圖中各構造與上述概念。'},'sources':[source],'reference':source})
    for kind,start,end in [('foundation','先備','情境'),('cases','情境','出處')]:
        block=body.split('- '+start+'：')[1].split('- '+end+'：')[0]
        for qi,line in enumerate(re.findall(r'^  [①②③④⑤⑥](.*)$',block,re.M)):
            ni=int(re.search(r'（n(\d)）$',line).group(1));line=re.sub(r'（n\d）$','',line)
            stem,opts=line.split('？',1) if '？' in line else line.split('＝',1)
            options=opts.split('／');assert len(options)==4,(slug,line)
            pos=(si*11+qi+(0 if kind=='foundation' else 6))%4
            right=options.pop(0);options.insert(pos,right)
            node=c['nodes'][ni-1]
            c[kind].append({'id':f'{slug}-{"foundation" if kind=="foundation" else "case"}-q{qi+1:02}','stem':stem+('？' if '？' in line else '＝？'),'options':options,'answer':pos,'hint':'回讀「'+node['title']+'」，再比較四個選項。','explain':node['concept']+(' '+node['clinical']['text'] if node['clinical']['text']!='對照圖中各構造與上述概念。' else ''),'nodeId':node['id']})
    assert len(c['foundation'])==6 and len(c['cases'])==5
    fixes=json.loads((ROOT/'scripts/respiratory-teaching-texts.json').read_text())[slug]
    for q,(hint,explain) in zip(c['foundation']+c['cases'],fixes['questions']):
        q.update(hint=hint,explain=explain)
    for index,prose in fixes['clinical'].items(): c['nodes'][int(index)-1]['clinical']['text']=prose
    for index,points in fixes['points'].items(): c['nodes'][int(index)-1]['points']=points
    c['lab']['predict']['feedback']=fixes['feedback']
    if slug=='lung-function':
        for state,label in zip(c['lab']['states'],['淺快','一般','深慢']): state['label']=label
    if slug=='respiratory-control':
        for stat in c['stats']:
            if '60' in stat['value']: stat.update(value='PO₂＜約 60 mmHg',label='周邊受器明顯反應')
    dest=ROOT/'materials-src'/slug;dest.mkdir(exist_ok=True)
    (dest/'content.json').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
    print(slug,len(stats),len(c['nodes']),len(c['foundation'])+len(c['cases']))
