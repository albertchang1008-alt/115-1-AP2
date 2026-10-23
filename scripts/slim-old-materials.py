"""Reproducible WebP derivatives for oversized legacy material assets; default verifies."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess
from PIL import Image, __version__, features

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT/'materials-src/figures/derived/old-materials-manifest.json'
RECIPE = dict(maxLongEdge=1600, format='WEBP', quality=80, method=6, lossless=False, exact=True, resample='LANCZOS', upscale=False)
def sha(data): return hashlib.sha256(data).hexdigest()
def git_bytes(commit, path): return subprocess.check_output(['git','show',f'{commit}:{path}'],cwd=ROOT)
def inventory():
    return [dict(material=p.parent.name, htmlBytes=p.stat().st_size,
                 resourceBytes=sum(f.stat().st_size for f in p.parent.rglob('*') if f.is_file()))
            for p in sorted((ROOT/'public/materials').glob('*/index.html'))]
def run(write=False):
    if write:
        assert not MANIFEST.exists(), 'Manifest exists; use verification instead of rewriting baseline'
        baseline=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
        scanned=inventory();targets=[r['material'] for r in scanned if max(r['htmlBytes'],r['resourceBytes'])>3_000_000]
    else:
        m=json.loads(MANIFEST.read_text());baseline=m['baseCommit'];scanned=m['inventoryBefore'];targets=[r['material'] for r in m['materials']]
    rows=[];images=[]
    for slug in targets:
        rel=f'public/materials/{slug}/index.html';before=git_bytes(baseline,rel).decode();after=before
        files=subprocess.check_output(['git','ls-tree','-r','--name-only',baseline,'--',f'public/materials/{slug}/assets'],cwd=ROOT,text=True).splitlines()
        asset_after=0
        for file in files:
            raw=git_bytes(baseline,file);src='html/assets/'+Path(file).name
            assert (ROOT/src).read_bytes()==raw, 'Original must remain bit-identical in html/assets'
            im=Image.open(io.BytesIO(raw));size=list(im.size);im=im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
            if max(im.size)>1600:im.thumbnail((1600,1600),Image.Resampling.LANCZOS)
            buf=io.BytesIO();im.save(buf,'WEBP',quality=80,method=6,lossless=False,exact=True);data=buf.getvalue()
            dest=str(Path(file).with_suffix('.webp'));after=after.replace('assets/'+Path(file).name,'assets/'+Path(dest).name)
            if write:(ROOT/dest).write_bytes(data);(ROOT/file).unlink()
            else:assert (ROOT/dest).read_bytes()==data and not (ROOT/file).exists(),dest
            asset_after+=len(data)
            images.append(dict(material=slug,source=src,sourceSha256=sha(raw),sourceBytes=len(raw),sourceSize=size,path=dest,sha256=sha(data),bytes=len(data),size=list(im.size)))
        if write:(ROOT/rel).write_text(after)
        else:assert (ROOT/rel).read_bytes()==after.encode(), 'Only image references may change: '+slug
        # Normalize only the enumerated image URLs; all other HTML bytes are identical.
        restored=after
        for image in images:
            if image['material']==slug:restored=restored.replace('assets/'+Path(image['path']).name,'assets/'+Path(image['source']).name)
        assert restored==before
        rows.append(dict(material=slug,path=rel,beforeHtmlBytes=len(before.encode()),afterHtmlBytes=len(after.encode()),beforeResourceBytes=next(r['resourceBytes'] for r in scanned if r['material']==slug),afterResourceBytes=len(after.encode())+asset_after,nonImageHtmlSha256=sha(restored.encode()),onlyImageReferencesChanged=True))
    result=dict(baseCommit=baseline,recipe=RECIPE,encoder=dict(pillow=__version__,libwebp=features.version('webp')),inventoryBefore=scanned,materials=rows,images=images)
    data=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
    if write:MANIFEST.parent.mkdir(parents=True,exist_ok=True);MANIFEST.write_text(data)
    else:assert MANIFEST.read_text()==data, 'Deterministic manifest changed'
    print(json.dumps(dict(passCheck=True,mode='write' if write else 'verify',materials=rows,images=len(images),originalsPreserved=True),ensure_ascii=False))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--write',action='store_true');run(p.parse_args().write)
