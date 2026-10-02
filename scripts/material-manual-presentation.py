"""Keep existing manual teaching/quiz scripts; add comparison tables and readable EPO steps."""
from pathlib import Path
from bs4 import BeautifulSoup
from html.parser import HTMLParser
from html import escape
import json,re
ROOT=Path(__file__).resolve().parent.parent
EXCLUDED={'course-orientation-v1','blood-pre-v1','blood-post-v1','coagulation-v1'}

def table(rows,title):
    heads=['主題','關鍵概念','整理重點']
    return '<section class="learning-summary" aria-labelledby="summary-title"><h2 id="summary-title">重點整理表</h2><table><caption>'+escape(title)+'｜概念比較</caption><thead><tr>'+''.join('<th scope="col">'+h+'</th>' for h in heads)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<th scope="row">'+escape(c)+'</th>' if i==0 else '<td data-label="'+heads[i]+'">'+escape(c)+'</td>' for i,c in enumerate(row))+'</tr>' for row in rows)+'</tbody></table></section>'

class EndOfPane(HTMLParser):
    def __init__(self,source,target):
        super().__init__();self.stack=[];self.target=target;self.source=source;self.end=None
        self.offsets=[0]+[m.end() for m in re.finditer('\n',source)]
    def handle_starttag(self,tag,attrs):
        if tag not in ['meta','img','input','br','hr','link','source','wbr','area','base','embed','param','track']:
            self.stack.append((tag,dict(attrs).get('id')))
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag:
                if self.stack[i][1]==self.target:
                    line,col=self.getpos();self.end=self.offsets[line-1]+col
                self.stack=self.stack[:i];break

def icon(kind):
    # Each step is an independent full illustration, never a slice of a common bitmap.
    art=[
      '<rect x="44" y="32" width="152" height="76" rx="18" fill="#fce7ef" stroke="#9d174d" stroke-width="3"/><circle cx="83" cy="68" r="18" fill="#fff" stroke="#9d174d"/><circle cx="153" cy="68" r="18" fill="#fff" stroke="#9d174d"/><text x="120" y="140">組織：可用 O₂ 減少</text>',
      '<path d="M80 25c-60 0-65 86-16 90 35 4 43-25 21-40 25-18 15-50-5-50zM160 25c60 0 65 86 16 90-35 4-43-25-21-40-25-18-15-50 5-50z" fill="#d69c91" stroke="#7f1d1d" stroke-width="3"/><rect x="88" y="66" width="64" height="36" rx="10" fill="#fff"/><text x="120" y="91">EPO</text><text x="120" y="140">腎臟：釋放造血訊號</text>',
      '<path d="M80 24q-30-15-35 10t20 24v55q-20 5-20 22t35 10h80q30 15 35-10t-20-22V58q20-5 20-22t-35-12z" fill="#fff3d7" stroke="#9a6420" stroke-width="3"/><rect x="82" y="42" width="76" height="83" rx="12" fill="#fda4af"/><circle cx="109" cy="65" r="12" fill="#be123c"/><circle cx="135" cy="95" r="12" fill="#be123c"/><text x="120" y="156">紅骨髓：紅血球生成↑</text>',
      '<ellipse cx="60" cy="73" rx="38" ry="27" fill="#be123c"/><ellipse cx="60" cy="73" rx="17" ry="12" fill="#fda4af"/><path d="M106 73h40m-12-10 12 10-12 10" stroke="#9d174d" stroke-width="4" fill="none"/><rect x="161" y="43" width="59" height="60" rx="15" fill="#e4f4ed" stroke="#176b45" stroke-width="3"/><text x="122" y="55">O₂</text><text x="120" y="140">紅血球把 O₂ 送給組織</text>'
    ][kind]
    if kind==2:art=art.replace('<path','<g transform="translate(0,-15)"><path',1).replace('<text x="120" y="156">','</g><text x="120" y="156">')
    return '<svg viewBox="0 0 240 170" role="img" aria-label="'+['組織可用氧氣減少','腎臟增加 EPO 分泌','紅骨髓增加紅血球生成','紅血球運送氧氣至組織'][kind]+'"><g font-family="system-ui,sans-serif" font-size="19" text-anchor="middle" fill="#17212b">'+art+'</g></svg>'

paletteTargets=[]
for p in sorted((ROOT/'public/materials').glob('*/index.html')):
    source=p.read_text();slug=p.parent.name
    if 'mount(' in source or slug in EXCLUDED:continue
    doc=BeautifulSoup(source,'html.parser');rows=[]
    if slug=='cardiac-electrical-v1':
        nodes,_=json.JSONDecoder().raw_decode(source.split('const N=',1)[1])
        rows=[[n['title'],n['concept'],'；'.join(v for _,v in n['f'])] for n in nodes]
    elif slug=='blood-composition-v1':
        rows=[['血漿','血液的液體部分','水、蛋白質與溶質；負責運輸'],['紅血球','以血紅素攜帶氧氣','成熟紅血球無核、呈雙凹圓盤'],['白血球','防禦與免疫','不同種類各有功能，回看節點比較'],['血小板','巨核細胞的細胞碎片','參與止血'],['離心後的分層','血漿、白膜層、紅血球','白膜層含白血球與血小板'],['血比容 Hct','紅血球體積占全血的比例','分清血漿比例與紅血球比例']]
    elif slug=='rbc-homeostasis-v1':
        rows=[['刺激','組織氧氣供應不足','腎臟感測供氧不足'],['反應器官','腎臟增加 EPO 分泌','EPO 經血液送到紅骨髓'],['作用','紅骨髓增加紅血球生成','紅血球數量增加、攜氧改善'],['負回饋','組織供氧改善','缺氧刺激減少，EPO 分泌回降'],['老化與回收','老舊紅血球由脾臟／肝臟吞噬','鐵與胺基酸回收；血基質另形成膽紅素'],['造血原料','鐵、維生素 B₁₂、葉酸等','造血需要足夠原料，不只需要 EPO 訊號']]
    else:
        for card in doc.select('.detail-card,.node-card'):
            heading=card.select_one('h3,h2,.card-title');lead=card.select_one('.card-summary,.core-concept,.concept-text,.concept-box,p');points=card.select('li')
            if heading:
                key=lead.get_text(' ',strip=True) if lead else (points[0].get_text(' ',strip=True) if points else '')
                detail='；'.join(x.get_text(' ',strip=True) for x in points[:2])
                rows.append([heading.get_text(' ',strip=True),key,detail])
    assert rows,(slug,'No summary source')
    if 'class="learning-summary"' not in source:
        pane=doc.select_one('#pane-infographic,#infographic-pane,#infographic,#pinfo')
        assert pane,slug
        parser=EndOfPane(source,pane['id']);parser.feed(source);assert parser.end,slug
        source=source[:parser.end]+table(rows,doc.title.get_text())+source[parser.end:]
    if slug=='rbc-homeostasis-v1':
        for i in range(4):
            pattern=r'(<div class="sim-step visual-flow-card" data-rbc-step="'+str(i)+r'"[^>]*>)<div class="visual-art">.*?</div>'
            source,count=re.subn(pattern,lambda m:m[1]+'<div class="visual-art">'+icon(i)+'</div>',source,count=1,flags=re.S)
            assert count==1
        css='.visual-art{height:auto!important;background-image:none!important;background-size:auto!important}.visual-art svg{display:block;width:100%;height:auto}.visual-flow .sim-arrow{display:block}.rbc-feedback-loop{padding:14px;border:2px solid #176b45;border-radius:12px;background:#edf8f0;color:#14532d;font-weight:700}@media(max-width:760px){.visual-flow .sim-arrow{transform:rotate(90deg);font-size:24px;margin:4px;line-height:1}.visual-art svg{max-width:300px;margin:auto}}'
        source=source.replace('</head>','<style id="rbc-clear-flow">'+css+'</style></head>') if 'id="rbc-clear-flow"' not in source else source
        if 'class="rbc-feedback-loop"' not in source:
            source=source.replace('<div class="hypoxia-control">','<p class="rbc-feedback-loop">↶ 負回饋：供氧改善 → 缺氧刺激減少 → 腎臟 EPO 分泌回降。紅血球生成需要時間，不是立即完成。</p><div class="hypoxia-control">')
        old="document.getElementById('rbc-predict-feedback').textContent = correct ? '答對了：高海拔低氧會刺激腎臟增加 EPO，進而提高紅血球生成。' : '再想想：缺氧是腎臟增加 EPO 分泌的關鍵刺激。';"
        new="const feedback = document.getElementById('rbc-predict-feedback'); feedback.className = 'predict-feedback predict-result ' + (correct ? 'ok' : 'warn'); feedback.textContent = correct ? '✓ 答對了！高海拔低氧會刺激腎臟增加 EPO，進而提高紅血球生成。' : '✗ 尚未答對。缺氧是腎臟增加 EPO 分泌的關鍵刺激，再想一想。';"
        source=source.replace(old,new)
    p.write_text(source);paletteTargets.append(slug)
(ROOT/'materials-src/manual-presentation-targets.json').write_text(json.dumps(paletteTargets,ensure_ascii=False,indent=2)+'\n')
