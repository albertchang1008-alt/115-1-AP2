"""R2: retain source anchors and serve desktop direct labels / mobile keyed labels.
Run before materials:preview; this supersedes the S2-only generator entry point.
"""
from pathlib import Path
import importlib.util,copy,json,re,sys
SPEC=importlib.util.spec_from_file_location('repair',Path(__file__).with_name('respiratory-labels-repair.py'))
m=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(m)
OUT=m.OUT

def pair(mobile,desktop,uid,hm,hd,assets=None):
 if uid=="o2-co2-transport-node-02":
  # Each layout carries its own raster; no dependency on a hidden layout/defs.
  for asset,markup in (assets or {}).items():
   image=re.sub(r' id="[^"\n]+"','',markup,count=1)
   mobile=mobile.replace(f'<use href="#{asset}"/>',image)
   desktop=desktop.replace(f'<use href="#{asset}"/>',image)
 # Inverse nested Y mappings keep screen-space anatomy isotropic while CSS
 # switches the outer aspect ratio. No script or widget contract is involved.
 def inner(svg):return svg[svg.index('>')+1:svg.rfind('</svg>')]
 css=f'#{uid}{{aspect-ratio:1700 / {hm};height:auto!important}}#{uid}>.r2-desktop{{display:none}}@media(min-width:768px){{#{uid}{{aspect-ratio:1700 / {hd}}}#{uid}>.r2-mobile{{display:none}}#{uid}>.r2-desktop{{display:inline}}}}'
 if uid in ['breathing-mechanics-node-01','breathing-mechanics-node-03']:
  css+=f'@media(min-width:768px){{.kit[data-slug="breathing-mechanics"] #detail-{uid} .node-figure{{max-width:100%!important}}}}'
 return f'<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" class="r2-responsive" viewBox="0 0 1700 {hm}" preserveAspectRatio="none" role="img" font-family="PingFang TC,Noto Sans CJK TC,Noto Sans TC,sans-serif"><style>{css}</style><g class="r2-mobile">{inner(mobile)}</g><svg class="r2-desktop" x="0" y="0" width="1700" height="{hm}" viewBox="0 0 1700 {hd}" preserveAspectRatio="none"><g id="{uid}-desktop">{inner(desktop)}</g></svg></svg>'

def main(slug):
 old=json.loads((OUT/'raster'/slug/'labels.json').read_text());original={p:p.read_text() for p in OUT.glob(slug+'-*.svg')}
 slots=[n for n,r in old['figures'].items() if any(l.get('anchor') is not None for l in r['labels'])]
 if '--r3' in sys.argv:slots=[n for n in slots if n in {'o2-co2-transport':['node-02'],'breathing-mechanics':['node-01','node-03']}.get(slug,[])]
 if not slots:print(slug,'no affected R3 slots');return
 m.AFFECTED[slug]=slots
 # Data-only figures and their exact original paths are reused.
 m.b.oxygen_plot=lambda *args,**kwargs:None
 mobile=m.RepairRenderer(slug);getattr(m.b,slug.replace('-','_'))(mobile)
 ms={n:(OUT/f'{slug}-{n}.svg').read_text() for n in slots};mr=copy.deepcopy(mobile.records)
 desktop=m.RepairRenderer(slug);desktop.old=copy.deepcopy(old);desktop.desktop=True;getattr(m.b,slug.replace('-','_'))(desktop)
 ds={n:(OUT/f'{slug}-{n}.svg').read_text() for n in slots};dr=copy.deepcopy(desktop.records)
 for p,s in original.items():p.write_text(s)
 records=copy.deepcopy(old['figures'])
 for n in slots:
  hm=mr[n]['viewBox'][1];hd=dr[n]['viewBox'][1];uid=slug+'-'+n
  (OUT/f'{uid}.svg').write_text(pair(ms[n],ds[n],uid,hm,hd,mobile.assets))
  records[n]=mr[n];records[n]['layouts']={'mobile':copy.deepcopy(mr[n]),'desktop':dr[n]};records[n]['repair']='R3-1–R3-2' if '--r3' in sys.argv else 'R2-1–R2-4';records[n]['breakpoint']=768
 if any(n.startswith('overview-') for n in slots):
  # State panels share outer dimensions and select the paired responsive SVG.
  hm=max(mr[n]['viewBox'][1] for n in slots if n.startswith('overview-'));hd=max(dr[n]['viewBox'][1] for n in slots if n.startswith('overview-'))
  uid=slug+'-overview';css=f'#{uid}{{aspect-ratio:1700 / {hm};height:auto!important}}@media(min-width:768px){{#{uid}{{aspect-ratio:1700 / {hd}}}}}'+'.v2-panel{display:none}.v2-state-1{display:inline}'+''.join(f'.state-figure[data-state="state-{i}"] .v2-panel{{display:none}}.state-figure[data-state="state-{i}"] .v2-state-{i}{{display:inline}}' for i in [1,2,3])
  parts=[]
  for i in [1,2,3]:
   n='overview-state-'+str(i);s=(OUT/f'{slug}-{n}.svg').read_text();parts.append(f'<g class="v2-panel v2-state-{i}">'+s[s.index('>')+1:s.rfind('</svg>')]+'</g>')
   # Pair styles expect a parent uid. Preserve it on each state group.
   parts[-1]=parts[-1].replace(f'<g class="v2-panel v2-state-{i}">',f'<g class="v2-panel v2-state-{i}" id="{slug}-{n}">')
  s=f'<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" class="r2-responsive" viewBox="0 0 1700 {hm}" preserveAspectRatio="none" font-family="PingFang TC,Noto Sans CJK TC,Noto Sans TC,sans-serif"><style>{css}</style><defs>'+''.join(mobile.assets.values())+'</defs>'+''.join(parts)+'</svg>'
  (OUT/f'{slug}-overview.svg').write_text(s)
 (OUT/'raster'/slug/'labels.json').write_text(json.dumps(dict(slug=slug,focusStyle='red',anchorCoordinates='original PNG pixels',figures=records),ensure_ascii=False,indent=2)+'\n')
 print(slug,'responsive slots',slots)
if __name__=='__main__':main(sys.argv[1])
