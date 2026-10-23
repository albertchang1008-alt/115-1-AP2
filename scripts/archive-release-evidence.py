"""Move evidence out of a checkout, preserving every byte and a SHA manifest."""
import hashlib,json,subprocess,sys
from pathlib import Path
from urllib.parse import unquote
import re
base=Path(sys.argv[1]).resolve();dest=Path(sys.argv[2]).resolve();namespace=sys.argv[3] if len(sys.argv)>3 else ''
assert (base/'docs').is_dir() and base!=dest and base not in dest.parents
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files=[p for p in (base/'docs').rglob('*') if p.is_file()];before=sum(p.stat().st_size for p in files)
selected=[p for p in files if p.suffix.lower()!='.md' and not(p.suffix.lower()=='.json' and p.stat().st_size<1_000_000)]
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=base,text=True).strip();mapping={};rows=[]
for p in selected:
 rel=p.relative_to(base);q=dest/namespace/rel;q.parent.mkdir(parents=True,exist_ok=True);digest=sha(p);size=p.stat().st_size
 assert not q.exists(),'Destination already exists: '+str(q)
 p.rename(q);assert sha(q)==digest and q.stat().st_size==size
 mapping[p]=q;rows.append({'path':str(Path(namespace)/rel),'source':str(p),'destination':str(q),'bytes':size,'sha256':digest,'commit':commit})
# Rewrite actual Markdown/HTML image links; documentation content and small JSON stay.
links=0
for p in (base/'docs').rglob('*.md'):
 original=p.read_text();
 def replace(m):
  global links
  value=m.group(1);target=unquote(value.strip('<>').split('#')[0]);resolved=Path(target) if target.startswith('/') else (p.parent/target).resolve()
  if resolved in mapping:links+=1;return m.group(0).replace(value,str(mapping[resolved]))
  if target.startswith('docs/') and (base/target) in mapping:links+=1;return m.group(0).replace(value,str(mapping[base/target]))
  return m.group(0)
 updated=re.sub(r'\]\((<?[^)\n]+>?)\)',replace,original)
 updated=re.sub(r'(?:src|href)="([^"]+)"',replace,updated)
 if updated!=original:p.write_text(updated)
after=sum(p.stat().st_size for p in (base/'docs').rglob('*') if p.is_file());result={'checkout':str(base),'commit':commit,'docsBytesBefore':before,'docsBytesAfter':after,'movedFiles':len(rows),'movedBytes':sum(r['bytes'] for r in rows),'rewrittenLinks':links,'files':rows}
manifest=dest/('manifest-source.json' if namespace else 'manifest-root.json');manifest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='files'},ensure_ascii=False));print('manifestSHA256 '+sha(manifest))
