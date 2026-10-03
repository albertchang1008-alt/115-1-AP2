"""Refresh new diagrams only; original manual quiz/tracking scripts remain untouched."""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=root/'public/materials/cardiac-electrical-v1/index.html'
figs={k:(root/'materials-src/figures'/f'cardiac-electrical-{v}.svg').read_text().replace('<svg ', '<svg class="heart2-figure" ',1) for k,v in [('map','relay'),('av','traffic'),('ap','aligned')]}
s=p.read_text();replacement='const HEART2_VISUALS='+json.dumps(figs,ensure_ascii=False)+';\n'
s,count=re.subn(r'const HEART2_VISUALS=.*?;\n',lambda _:replacement,s,count=1)
assert count==1,'New diagram integration must already exist'
p.write_text(s)
