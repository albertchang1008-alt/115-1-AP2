"""Original tubular aortic diagrams, authored as vector curves, no image tracing."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'materials-src/figures'
RED='#a71930'
def text(x,y,s):return f'<text x="{x}" y="{y}">{s}</text>'
def line(d):return f'<path d="{d}" stroke="#61707c" stroke-width="1.5" fill="none"/>'
def tube(d,segment='',w=24):
    return (f'<g data-aortic-segment="{segment}">' if segment else '<g>')+f'<path d="{d}" fill="none" stroke="#7d2131" stroke-width="{w+3}" stroke-linecap="round"/><path d="{d}" fill="none" stroke="url(#aorta-tube)" stroke-width="{w}" stroke-linecap="round"/><path d="{d}" fill="none" stroke="#ffd4cd" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/></g>'
def head(title,h):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 {h}" role="img" aria-label="{title}"><title>{title}</title><style>text{{font-family:system-ui,sans-serif;font-size:calc(26px * var(--font-scale,1));fill:#17212b}}</style><defs><linearGradient id="aorta-tube" x1="0" x2="1"><stop stop-color="#85253a"/><stop offset=".4" stop-color="#ee837b"/><stop offset=".65" stop-color="#ca4a52"/><stop offset="1" stop-color="#81273a"/></linearGradient></defs>'+text(12,36,'圖左＝人體右')
def marks(d):return f'<path class="aortic-boundary" d="{d}" stroke="#51606b" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round" fill="none"/>'
segments={'ascending':'M235 210C226 191 210 178 210 153Q209 136 225 123','arch':'M225 123C255 80 337 74 378 104Q413 119 404 151','thoracic':'M404 151C392 205 349 268 350 385','abdominal':'M350 385L342 580'}
s=head('主動脈全段立體示意',700)
# Posterior segment first, with the front half laid over the junction for depth.
s+='<path d="M170 410Q312 340 480 410L480 431Q312 370 170 431Z" fill="#f3d8d9" stroke="#d0a4aa"/>'
for k in ['thoracic','abdominal','arch','ascending']:s+=tube(segments[k],k,24 if k!='abdominal' else 21)
for d in ['M225 123L213 94','M303 90L299 60','M378 104L388 76']:s+=tube(d,w=12)
s+=tube('M342 580Q324 600 306 620',w=18)+tube('M342 580Q356 601 379 620',w=18)
s+=marks('M208 115L242 135')+marks('M385 148L425 158')+marks('M320 385H382')
s+='<ellipse cx="231" cy="199" rx="5" ry="8" fill="#6c1828" stroke="#ffccc3" stroke-width="2"/>'
for t,x,y,px,py in [('升主動脈',10,188,213,166),('主動脈弓',10,90,273,93),('胸主動脈',420,281,368,277),('腹主動脈',420,495,346,483),('橫膈',12,420,216,399)]:s+=line(f'M{px} {py}L{x+len(t)*26 if x<300 else x} {y-8}')+text(x,y,t)
s+=line('M231 199L75 230')+text(12,259,'冠狀動脈開口')+text(12,293,'→心臟血液供應')
s+=text(12,654,'約第 4 腰椎：分為左右髂總動脈')
for d in ['M272 98l14-5-7-9','M397 216l-2 17-10-10','M350 458l-1 17-10-11']:s+=f'<path d="{d}" fill="none" stroke="#fff8f1" stroke-width="3"/>'
s+='</svg>';(root/'major-vessels-node-01.svg').write_text(s)
s=head('主動脈弓三分支立體示意',510)
s+='<rect x="8" y="55" width="225" height="96" rx="12" fill="#fff1e2"/>'+text(18,86,'右側多一段')+text(18,121,'頭臂動脈')
s+=tube('M260 380L255 300Q254 263 279 233',w=27)+tube('M279 233C314 193 400 190 445 224Q482 247 469 294',w=27)+tube('M469 294Q454 337 445 382',w=25)
s+=tube('M279 233L264 189L258 172',w=15)+tube('M258 172L245 149L244 115',w=11)+tube('M258 172Q207 172 189 184',w=11)
s+=tube('M356 202L350 137',w=12)+tube('M439 222L461 174',w=12)
s+=marks('M260 223L296 244')+marks('M450 287L490 298')
for t,x,y,px,py in [('右頸總',14,180,244,133),('右鎖骨下',14,225,205,174),('頭臂動脈',14,278,267,198),('左頸總',300,91,354,164),('左鎖骨下',388,137,453,192),('主動脈弓',10,346,369,202)]:s+=line(f'M{px} {py}L{x+len(t)*26 if x<300 else x} {y-8}')+text(x,y,t)
s+=text(12,462,'兩條點虛線之間＝主動脈弓')+'</svg>';(root/'major-vessels-node-02.svg').write_text(s)
