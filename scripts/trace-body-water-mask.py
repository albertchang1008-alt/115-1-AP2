"""Extract an inset SVG clipping boundary; never modify the teacher PNG."""
from collections import deque
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageFilter
root=Path(__file__).resolve().parent.parent
manifest=root/'materials-src/apply-kit/teacher-figures.json'
data=json.loads(manifest.read_text())
entry=next(e for e in data['entries'] if e['key']=='fluid-compartments:N01')
raw=(root/entry['src']).read_bytes()
assert hashlib.sha256(raw).hexdigest()==entry['sha256']
im=Image.open(root/entry['src']).convert('RGB');w,h=im.size
# Tan/brown forms a closed barrier against the neutral background.
barrier=Image.new('L',(w,h));barrier.putdata([255 if r-b>14 and r>65 else 0 for r,g,b in im.getdata()])
barrier=barrier.filter(ImageFilter.MaxFilter(5));pixels=barrier.load()
visited=bytearray(w*h);q=deque([(0,0)]);visited[0]=1
while q:
 x,y=q.popleft()
 for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
  if 0<=nx<w and 0<=ny<h and not visited[ny*w+nx] and not pixels[nx,ny]:visited[ny*w+nx]=1;q.append((nx,ny))
filled=Image.new('L',(w,h));filled.putdata([0 if v else 255 for v in visited]);filled=filled.filter(ImageFilter.MinFilter(11))
px=filled.load();runs=[]
for y in range(h):
 x=0
 while x<w:
  if not px[x,y]:x+=1;continue
  start=x
  while x<w and px[x,y]:x+=1
  runs.append((start,y,x-start))
entry['bodyClip']=''.join(f'M{x} {y}h{length}v1h-{length}Z' for x,y,length in runs)
entry['bodyClipFrame']=[w,h]
entry['bodyClipMethod']='Source-colour closed outline, exterior flood fill, 3px inset; scripts/trace-body-water-mask.py'
manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print({'width':w,'height':h,'rowRuns':len(runs),'sourceSha256':entry['sha256']})
