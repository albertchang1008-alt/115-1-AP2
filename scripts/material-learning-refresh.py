# -*- coding: utf-8 -*-
"""Teacher-authorized explanations and independent readable diagrams (2026-10-02)."""
from pathlib import Path
from html import escape
import json

ROOT=Path(__file__).resolve().parent.parent
def load(slug):return json.loads((ROOT/f'materials-src/{slug}/content.json').read_text())
def save(c):(ROOT/f"materials-src/{c['slug']}/content.json").write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
co=load('cardiac-output')
n=co['nodes'][3]
n.update(summary='交感節後神經釋放 NE；腎上腺髓質的腎上腺素由血液送達心臟',concept='收縮力：相同前負荷下，心臟交感神經的節後神經末梢釋放正腎上腺素（NE），使收縮力增強 → SV↑、ESV↓。腎上腺髓質另外把腎上腺素釋放到血液，隨循環到達心臟，也可增強收縮力；這是內分泌作用，須與神經末梢的傳導物質分開。',points=['心臟交感節後神經末梢：釋放正腎上腺素（NE），作用於心臟。','腎上腺髓質：把腎上腺素釋放到血液，以荷爾蒙方式作用於心臟。','相同前負荷下收縮力增強，射出較多血液，SV↑、ESV↓。'])
n['clinical']['text']='先辨認來源：神經末梢釋放 NE；腎上腺髓質的腎上腺素經血液運送。'
n=co['nodes'][5]
n.update(summary='交感節後神經釋放 NE；副交感節後神經釋放 ACh',concept='自主神經與心率：心臟交感神經的節後神經末梢釋放正腎上腺素（NE），使心率↑；迷走神經所屬的副交感節後神經末梢釋放乙醯膽鹼（ACh），使心率↓。安靜時迷走作用較強，心率低於竇房結自身頻率。應用：心率過快時舒張期縮短、心室充血時間減少。',points=['交感節後神經末梢 → 正腎上腺素 NE → 心率↑、收縮力↑。','副交感／迷走節後神經末梢 → 乙醯膽鹼 ACh → 主要使心率↓。','安靜時迷走作用較強；心率極快會縮短舒張期與心室充血時間。'])
n['clinical']['text']='同樣是節後神經，心臟交感用 NE，副交感用 ACh；腎上腺素則由腎上腺髓質經血液運送。'
co['lab']['states'][0]['explain']='心臟交感節後神經釋放正腎上腺素 NE → 心率↑、收縮力↑ → CO↑。'
co['lab']['states'][1]['explain']='迷走所屬副交感節後神經釋放乙醯膽鹼 ACh → 心率↓ → CO 傾向↓。'
co['summaryTable']={'headers':['調節來源','釋放的物質','主要作用','結果'],'rows':[['心臟交感節後神經','正腎上腺素 NE','心率↑、收縮力↑','CO↑'],['心臟副交感節後神經','乙醯膽鹼 ACh','主要使心率↓','其他條件相同時 CO 傾向↓'],['腎上腺髓質','腎上腺素進入血液','心率↑、收縮力↑','CO↑'],['回心血量增加','不是傳導物質的變化','EDV↑；Frank-Starling 作用','生理範圍內 SV↑'],['後負荷增加','心室面對較高動脈壓','射血須克服較大壓力','其他條件相同時 SV 傾向↓']]}
save(co)
p=ROOT/'docs/STAGE1_SUPPLEMENT_SPEC.md';lines=p.read_text().splitlines()
for i,line in enumerate(lines):
    if line.startswith('  4. 收縮力：'):lines[i]='  4. '+co['nodes'][3]['concept']
    if line.startswith('  6. 自主神經與心率：'):lines[i]='  6. '+co['nodes'][5]['concept']
p.write_text('\n'.join(lines)+'\n')
bp=load('blood-pressure-regulation');n=bp['nodes'][4]
n.update(summary='ANP／BNP 促進排鈉、利尿，協助降低體液與血容量',concept='體液包含細胞內液與細胞外液；血漿是細胞外液的一部分。心房伸展促進 ANP 釋放，心室伸展可促進 B 型排鈉胜肽 BNP 釋放；兩者有助排鈉、排水（利尿），降低過多體液與血容量。',points=['利尿是尿量增加；ANP／BNP 促進排鈉，水隨鈉排出。','排鈉、排水↑ → 細胞外液與血容量↓ → 回心血量↓ → 心搏量與 CO 傾向↓ → 血壓傾向↓。','RAAS／醛固酮偏向保鈉留水；ADH 偏向保水、減少尿量，方向與 ANP／BNP 相對。'])
n['clinical']['text']='連接體液與血壓時，要指出血容量與回心血量的變化；身體仍有其他補償機制，所以說血壓「傾向」下降。'
for i,line in [(3,'ADH 作用增加 → 水再吸收↑、尿量↓；ADH 作用減少 → 水再吸收↓、尿量↑。'),(2,'醛固酮促進鈉再吸收，水隨鈉保留 → 細胞外液與血容量增加，協助維持血壓。'),(5,'排尿造成血容量下降時，回心血量與心搏量傾向下降，再連到 CO 與血壓。')]:
    if line not in bp['nodes'][i]['points']:bp['nodes'][i]['points'].append(line)
bp['lab']['intro']='切換情境，分清神經反射與腎臟體液調節；體液變化要連到血容量、回心血量與血壓。'
bp['lab']['states'][2]['explain']='ANP／BNP 促進排鈉利尿 → 體液／血容量↓ → 回心血量↓ → CO 與血壓傾向↓。相對地，醛固酮保鈉留水、ADH 抗利尿，協助保留體液。'
bp['summaryTable']={'headers':['物質／來源','腎臟作用','體液／血容量','血壓方向'],'rows':[['ANP／心房','排鈉、排水↑（利尿）','↓','回心血量與 CO 傾向↓，血壓傾向↓'],['BNP／心室','促進排鈉、排水','↓','協助降低過多血容量與血壓'],['醛固酮／腎上腺皮質','鈉再吸收↑，水隨鈉保留','↑','協助維持／升高血壓'],['ADH／下視丘製造、腦下垂體後葉釋放','水再吸收↑，尿量↓','保留水分','協助維持血容量與血壓'],['ADH 作用減少','水再吸收↓，尿量↑','水分流失增加','其他條件相同時血壓傾向↓']]}
credit='體液補充：OpenStax A&P 2e 25.8／25.9（排鈉胜肽、ADH、醛固酮與血容量）。'
if credit not in bp['credits']:bp['credits'].append(credit)
save(bp)

def text(x,y,s,size=24):return f'<text x="{x}" y="{y}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="{size}" fill="#17212b">{escape(s)}</text>'
def frame(body,height):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 {height}" role="img"><rect width="480" height="{height}" rx="20" fill="#f5f0fa"/>{body}</svg>'
def flow(title,steps):
    body=text(240,36,title);y=58
    for i,step in enumerate(steps):
        rows=step if isinstance(step,list) else [step];h=30+30*len(rows)
        body+=f'<rect x="24" y="{y}" width="432" height="{h}" rx="12" fill="'+('#fff' if i%2==0 else '#e4eff9')+'" stroke="#bba9cb"/>'
        body+=''.join(text(240,y+32+j*30,s,22) for j,s in enumerate(rows));y+=h
        if i<len(steps)-1:body+=f'<path d="M240 {y+3}v20m-8-8 8 8 8-8" stroke="#5b3b8c" fill="none" stroke-width="3"/>';y+=28
    return frame(body,y+22)
fig=ROOT/'materials-src/figures'
(fig/'cardiac-output-node-04.svg').write_text(flow('分清神經與內分泌來源',[['交感節後神經末梢','釋放正腎上腺素 NE'],['腎上腺髓質（另一來源）','腎上腺素 → 血液 → 心臟'],['相同前負荷下收縮力↑','SV↑、ESV↓']]))
(fig/'cardiac-output-node-06.svg').write_text(flow('自主神經的節後傳導物質',[['交感節後末梢 → NE','心率↑、收縮力↑'],['副交感／迷走節後末梢 → ACh','主要使心率↓'],['安靜時迷走作用較強','心率低於竇房結自身頻率']]))
# Separate comparison cards must not imply NE→adrenal epinephrine or sympathetic→parasympathetic.
import re
for name in ['cardiac-output-node-04.svg','cardiac-output-node-06.svg']:
    p=fig/name;p.write_text(re.sub(r'<path\b.*?/>','',p.read_text()))
p=fig/'cardiac-output-overview.svg';s=p.read_text().replace('>交感興奮</text>','>交感節後末梢 → NE</text>').replace('>迷走興奮</text>','>副交感節後末梢 → ACh</text>');p.write_text(s)
(fig/'blood-pressure-regulation-anp.svg').write_text(flow('排鈉、利尿如何影響血壓',[['心房 ANP／心室 BNP','促進腎臟排鈉、排水'],['尿量↑（利尿）','細胞外液與血容量↓'],'回心血量↓',['心搏量、心輸出量傾向↓','其他條件相同時血壓傾向↓']]))
# Replace the formerly sequential RAAS→ADH→ANP panel with two separate directions.
p=fig/'blood-pressure-regulation-overview.svg';s=p.read_text();import re
panel='<g data-panel="volume">'+text(200,66,'體液調節：兩個相反方向',22)
for x,title,rows in [(12,'保留體液',['醛固酮保鈉','ADH 保水','尿中流失減少','血容量維持／↑']),(210,'排出體液',['ANP／BNP','排鈉、利尿↑','血容量↓','回心血量↓'])]:
    panel+=f'<rect x="{x}" y="90" width="178" height="250" rx="14" fill="#fff" stroke="#bba9cb"/>'+text(x+89,120,title,20)
    for j,line in enumerate(rows):panel+=text(x+89,160+j*45,line,18)
panel+=text(200,377,'排出方向：回心血量↓ → CO↓',18)+text(200,410,'血壓傾向↓；仍有其他補償機制',18)+'</g>'
s=re.sub(r'<g data-panel="volume">.*?</g>',lambda _:panel,s,flags=re.S);p.write_text(s)

# Preserve approved Taiwan terminology and six prediction explanations after regeneration.
import runpy
runpy.run_path(str(ROOT / "scripts/material-taiwan-terms.py"), run_name="__main__")
