#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[1];E=R/'docs/urinary-release';assets=json.loads((E/'fluid/asset-review.json').read_text());A={Path(x['copy']).stem:x for x in assets}
# image index, source-pixel anchors in exact spec label order. None=functional callout.
P={'fluid-compartments': {'node-05': (1, [[440, 500], [1050, 800], [870, 610], [620, 450]])}, 'water-sodium-regulation': {'overview': (1, [[150, 200], [150, 450], [130, 650], [550, 180], None, [430, 870], None, None, [560, 650]]), 'node-01': (1, [[150, 200], [150, 450], [130, 650], None]), 'node-02': (1, [[980, 1170], [970, 410], [972, 528], [1032, 665], [1060, 1000]]), 'node-03': (2, [None, [270, 200], None, [230, 930], [820, 1000]]), 'node-04': (3, [[490, 165], [360, 265], [320, 530], [750, 530], [790, 850], [920, 920], [1010, 1110]]), 'node-05': (4, [[730, 120], [900, 315], [340, 470], [730, 730], [400, 940]]), 'node-06': (5, [[475, 235], [1070, 625], [1030, 595], [340, 810], [820, 810], [340, 1170], [880, 1230]])}, 'electrolyte-balance': {'overview': (1, [[150, 150], [150, 590], [150, 1025], [790, 710], None, None]), 'node-01': (1, [[150, 150], [150, 590], [150, 1025], [850, 270], [740, 710], [735, 1150]]), 'node-02': (2, [[560, 350], [430, 425], [209, 526], [775, 292]]), 'node-04': (3, [[150, 120], [570, 370], [150, 200], [750, 420], [715, 750]]), 'node-05': (4, [[130, 120], [965, 800], [210, 650], None, [860, 750], [350, 740]]), 'node-06': (5, [[450, 200], [650, 250], [500, 600], [550, 1100]])}, 'acid-base-homeostasis': {'overview': (1, [[170, 1120], [565, 1120], [940, 1120], [570, 445], [400, 350], [1010, 845], [570, 680], [550, 940]]), 'node-01': (1, [[170, 1120], [400, 350], [410, 640], None]), 'node-03': (2, [[500, 200], [650, 700], [300, 1100], [950, 1110]]), 'node-04': (1, [[527, 480], [400, 350], None, None, None]), 'node-05': (3, [[430, 200], [940, 260], [1070, 150], [350, 600], [550, 200], [590, 720], [650, 1150]]), 'node-06': (3, [[200, 1000], [430, 950], [500, 1100], [250, 1250], [100, 1160]])}}
rows=[]
for slug,slots in P.items():
 spec=(R/f'docs/urinary-fluid-specs/{slug}.md').read_text()
 for slot,(im,anchors)in slots.items():
  states={};focus=[]
  if slot=='overview':
   labels=re.search(r'總覽圖內候選白名單：([^。]+)',spec).group(1).split('、')
   for line in spec.splitlines():
    if line.startswith('| state-'):
     a=[x.strip()for x in line.split('|')[1:-1]];states[a[0][:7]]=a[3].split('、')
  else:
   block=spec.split('## 節點'+slot[-2:]+'：')[1].split('\n## ')[0];labels=re.search(r'圖內標籤候選白名單\*\*：([^。]+)',block).group(1).split('、');focus=re.search(r'紅色粗體候選\*\*：([^。]+)',block).group(1).split('、')
  assert len(labels)==len(anchors),(slug,slot,labels)
  a=A[f'IMG-{slug}-{im:02d}'];rows.append(dict(slug=slug,slot=slot,source=a['copy'],review=a['review'],labels=[dict(label=t,sourceAnchor=v)for t,v in zip(labels,anchors)],focus=focus,states=states))
p=E/'stage2-label-plan.json';old=[x for x in json.loads(p.read_text())if x['slug']not in P];p.write_text(json.dumps(old+rows,ensure_ascii=False,indent=2)+'\n');print(len(rows),'fluid label plans added')
