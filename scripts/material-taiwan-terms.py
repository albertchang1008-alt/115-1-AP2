"""Apply teacher-approved Taiwan terms and prediction explanations; keep IDs/answers."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
CONFIG=json.loads((ROOT/'scripts/material-taiwan-terms.json').read_text())
def taiwan(s):
    for old,new in CONFIG['replacements'].items():s=s.replace(old,new)
    return s
# Kit source, SVG, ECG widget/reference and cached report text.
paths=[p for p in (ROOT/'materials-src').rglob('*') if p.is_file() and p.suffix in {'.json','.svg','.js','.html','.md'}]
# Keep source generators/specifications consistent so rebuilding cannot restore old terms.
paths += [ROOT/p for p in ['scripts/material-learning-refresh.py','scripts/stage1-content.py','scripts/stage1-figures.py','docs/STAGE1_SUPPLEMENT_SPEC.md']]
for p in paths:
    old=p.read_text();new=taiwan(old)
    if new!=old:p.write_text(new)
# Hand-authored student pages: values-only wording changes, no event/quiz logic edits.
for id in json.loads((ROOT/'materials-src/manual-presentation-targets.json').read_text()):
    p=ROOT/'public/materials'/id/'index.html';old=p.read_text();new=taiwan(old)
    if new!=old:p.write_text(new)
for slug,feedback in CONFIG['predictionFeedback'].items():
    p=ROOT/'materials-src'/slug/'content.json';d=json.loads(p.read_text())
    d['lab']['predict']['feedback']=feedback
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
