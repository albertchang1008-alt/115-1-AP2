"""Deterministic derivatives of approved originals; originals are never overwritten."""
import hashlib, io, json, sys
from pathlib import Path
from PIL import Image, __version__, features
ROOT=Path(__file__).resolve().parents[1]
RECIPE={'maxLongEdge':1600,'format':'WEBP','quality':80,'method':6,'lossless':False,'exact':True,'resample':'LANCZOS','upscale':False}
def sha(b):return hashlib.sha256(b).hexdigest()
def generate(verify=False):
 entries=json.loads((ROOT/'materials-src/apply-kit/teacher-figures.json').read_text())['entries']; rows=[]
 for e in sorted({e['sha256']:e for e in entries if e['kind']=='anatomy'}.values(),key=lambda e:e['sha256']):
  raw=(ROOT/e['src']).read_bytes();assert sha(raw)==e['sha256'],e['src']
  im=Image.open(io.BytesIO(raw));before=list(im.size);im=im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
  if max(im.size)>1600:im.thumbnail((1600,1600),Image.Resampling.LANCZOS)
  out=io.BytesIO();im.save(out,format='WEBP',quality=80,method=6,lossless=False,exact=True);data=out.getvalue()
  rel='materials-src/figures/derived/'+e['sha256']+'.webp';p=ROOT/rel
  if verify:assert p.read_bytes()==data,rel
  else:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
  rows.append({'source':e['src'],'sourceSha256':e['sha256'],'sourceSize':before,'path':rel,'sha256':sha(data),'size':list(im.size),'bytes':len(data)})
 result={'recipe':RECIPE,'encoder':{'pillow':__version__,'libwebp':features.version('webp')},'images':rows};data=(json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode();p=ROOT/'materials-src/figures/derived/manifest.json'
 if verify:assert p.read_bytes()==data,'manifest differs from deterministic encoding'
 else:p.write_bytes(data)
 print(json.dumps({'pass':True,'mode':'verify' if verify else 'generate','images':len(rows),'derivedBytes':sum(r['bytes'] for r in rows),'manifestSha256':sha(data),'recipe':RECIPE}))
if __name__=='__main__':generate('--verify' in sys.argv)
