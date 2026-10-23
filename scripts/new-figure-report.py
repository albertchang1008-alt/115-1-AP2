"""Assemble inspectable evidence from the completed eight-size browser runs."""
from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parent.parent
out=root/'docs/urinary-release/apply9-final/new-figures'
manifest=json.loads((root/'materials-src/apply-kit/teacher-figures.json').read_text())['entries']
slugs=list(dict.fromkeys(e['slug'] for e in manifest));rows=[];links=[]
for slug in slugs:
 folder=out/'final'/slug
 layout=json.loads((folder/'layout-results.json').read_text());diff=json.loads((folder/'SCRIPT_DIFF.json').read_text())
 assert layout['summary']['fail']==0,(slug,layout['summary'])
 assert diff['pass'] and not diff['missing'] and not diff['textErrors'],slug
 assert len({(r['width'],r['height']) for r in layout['results']})==8,slug
 content=json.loads((out/'content'/(slug+'.json')).read_text());assert content['pass'],slug
 preview='checked-student.html' if slug=='acid-base-homeostasis' else 'preview.html'
 rows.append(dict(slug=slug,layout=layout['summary'],required=diff['requiredUnits'],missing=0,extra=0,previewSha256=hashlib.sha256((folder/preview).read_bytes()).hexdigest()))
 links.append(f'<li><a href="final/{slug}/{preview}">{slug}</a></li>')
 shotlines=['# 給 Claude 的摘要','- 指定新圖關卡：390×844／1280×800 作答前、答錯、答對。','- 腎元 N2／N3／N5 的探索步驟沒有錯答；錯答證據取同關第二步。','- 區域標籤、箭頭分關及水位遮罩另有來源、程式測試與代表畫面複核。','','| 尺寸與關卡 | 作答前 | 答錯 | 答對 |','|---|---|---|---|']
 if slug in ('fluid-compartments','urine-concentration','filtration-clearance'):
  ns=[1] if slug=='fluid-compartments' else [2] if slug=='filtration-clearance' else [1,2,3,5,6]
  for n in ns:
   for size in ('390x844','1280x800'):
    step=2 if slug=='urine-concentration' and n in (2,3,5) else 1
    names=[f'{size}-N{n}-before.png',f'{size}-N{n}-S{step}-wrong.png',f'{size}-N{n}-S{step}-correct.png']
    for name in names:assert (folder/'shots'/name).is_file(),name
    shotlines.append(f'| {size} N{n} | '+' | '.join(f'[{label}](shots/{name})' for name,label in zip(names,['作答前','答錯','答對']))+' |')
  (folder/'NEW_FIGURE_SHOTS.md').write_text('\n'.join(shotlines)+'\n')
(out/'index.html').write_text('<!doctype html><html lang="zh-TW"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>新底圖與圖上定位試用</title><style>body{font:18px system-ui;max-width:900px;margin:30px auto;padding:16px;background:#eef5f8;color:#173d4a}li{margin:18px 0}a{color:#165a70}</style><h1>新底圖與圖上定位試用</h1><p>原缺圖 G01、G02、G03 已補齊。先選標籤，再選圖上位置；密集圖可在圖框內捲動。</p><ul>'+''.join(links)+'</ul></html>')
(out/'SUMMARY.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'subjects':len(rows),'cases':sum(r['layout']['cases'] for r in rows),'pass':sum(r['layout']['pass'] for r in rows),'fail':sum(r['layout']['fail'] for r in rows)},ensure_ascii=False))
