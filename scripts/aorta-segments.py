"""Original thick cylindrical aortic diagrams. Authored curves, no image tracing."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]/'materials-src/figures'
def txt(x,y,s):return f'<text x="{x}" y="{y}">{s}</text>'
def line(d):return f'<path class="label-leader" d="{d}" stroke="#61707c" stroke-width="1.5" fill="none"/>'
def tube(d,segment='',w=66):
 return f'<g data-aortic-segment="{segment}"><path class="aortic-edge" d="{d}" fill="none" stroke="#A3182C" stroke-width="{w+3}" stroke-linecap="round"/><path class="aortic-tube" d="{d}" fill="none" stroke="url(#aorta-red)" stroke-width="{w}" stroke-linecap="round"/></g>'
def head(title,h):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 {h}" role="img" aria-label="{title}"><title>{title}</title><style>text{{font-family:system-ui,sans-serif;font-size:calc(26px * var(--font-scale,1));fill:#17212b}}.aortic-dim .aortic-tube{{stroke:#D9DDE3}}.aortic-dim .aortic-edge{{stroke:#C5CBD4}}.aortic-dim ellipse{{fill:#D9DDE3;stroke:#C5CBD4}}</style><defs><linearGradient id="aorta-red"><stop stop-color="#A3182C"/><stop offset=".45" stop-color="#F06A7E"/><stop offset=".7" stop-color="#D7263D"/><stop offset="1" stop-color="#A3182C"/></linearGradient></defs>'+txt(12,36,'圖左＝人體右')
def boundary(d):return f'<path class="aortic-boundary" d="{d}" stroke="#111" stroke-width="3.75" stroke-dasharray="1 10" stroke-linecap="round" fill="none"/>'
def bracket(d):return f'<path d="{d}" fill="none" stroke="#485561" stroke-width="1.5"/>'
def arrow(d):return f'<path d="{d}" stroke="#485561" stroke-width="2.5" fill="none"/>'
import math
def bez(P,t):
 a,b,c,d=P;u=1-t;return (u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1])
def tan(P,t):
 a,b,c,d=P;u=1-t;x=3*u*u*(b[0]-a[0])+6*u*t*(c[0]-b[0])+3*t*t*(d[0]-c[0]);y=3*u*u*(b[1]-a[1])+6*u*t*(c[1]-b[1])+3*t*t*(d[1]-c[1]);n=math.hypot(x,y);return (x/n,y/n)
def cpath(P):return 'M{:.1f} {:.1f}C{:.1f} {:.1f} {:.1f} {:.1f} {:.1f} {:.1f}'.format(*P[0],*P[1],*P[2],*P[3])
def seg(d,segment,w,cap='butt'):
 return f'<g data-aortic-segment="{segment}"><path class="aortic-edge" d="{d}" fill="none" stroke="#A3182C" stroke-width="{w+3}" stroke-linecap="{cap}"/><path class="aortic-tube" d="{d}" fill="none" stroke="url(#aorta-red)" stroke-width="{w}" stroke-linecap="{cap}"/></g>'
def cut(P,t,half):
 (x,y),(tx,ty)=bez(P,t),tan(P,t);nx,ny=-ty,tx;return boundary(f'M{x-nx*half:.1f} {y-ny*half:.1f}L{x+nx*half:.1f} {y+ny*half:.1f}')
def branch(P,t,length,ang,w):
 x,y=bez(P,t);return f'M{x:.1f} {y+8:.1f}L{x+length*math.sin(ang):.1f} {y-length*math.cos(ang):.1f}',(x,y)
# One continuous centreline split at the true boundaries: butt caps meet exactly, so colour changes where the dotted line is.
ASC=[(270,300),(262,262),(262,206),(272,172)]
ARC=[(272,172),(296,88),(468,128),(452,208)]
THO=[(452,208),(440,268),(385,392),(385,452)]
ABD='M385 452L379 685'
s=head('主動脈全段：左右冠狀動脈與四段範圍',800)
s+='<path d="M195 471Q338 405 463 471L463 490Q338 435 195 490Z" fill="#eee1ef" fill-opacity=".7" stroke="#ceb7d0"/>'
# Arch branches first so the arch tube covers their roots; brachiocephalic sits just after the start, left subclavian just before the end.
for t,ang,L in [(0.16,-0.25,62),(0.42,0.05,58),(0.68,0.35,58)]:
 d,_=branch(ARC,t,L,ang,26);s+=seg(d,'arch',26,'round')
s+=seg(ABD,'abdominal',45)+seg(cpath(THO),'thoracic',57)+seg(cpath(ARC),'arch',66)+seg(cpath(ASC),'ascending',66)
s+=seg('M379 685Q359 713 334 732','abdominal',30,'round')+seg('M379 685Q396 712 420 732','abdominal',30,'round')
# Slightly expanded aortic sinuses and two ostia, each continuing into a coronary artery.
s+='<g data-aortic-segment="ascending"><ellipse class="aortic-tube" cx="270" cy="296" rx="38" ry="30" fill="url(#aorta-red)" stroke="#A3182C" stroke-width="2"/><ellipse cx="247" cy="298" rx="5" ry="8" fill="#A3182C"/><ellipse cx="293" cy="298" rx="5" ry="8" fill="#A3182C"/></g>'
s+=seg('M247 298Q222 309 208 333','ascending',14,'round')+seg('M293 298Q325 305 348 328','ascending',14,'round')
s+=cut(ASC,1,48)+cut(ARC,1,48)+cut(THO,1,42)
s+=bracket('M200 172h-10v128h10')+txt(12,246,'升主動脈')
s+=bracket('M476 92h10v112h-10')+txt(492,156,'主動脈弓')
s+=bracket('M470 222h12v222h-12')+txt(496,340,'胸主動脈')
s+=bracket('M455 466h12v218h-12')+txt(481,580,'腹主動脈')
s+=line('M208 333L169 364')+txt(12,380,'右冠狀動脈')+line('M343 334L150 420')+txt(12,428,'左冠狀動脈')+txt(12,476,'→心臟血液供應')
s+=line('M195 480L95 515')+txt(12,530,'橫膈')+txt(12,776,'約第 4 腰椎：分為左右髂總動脈')
for d in ['M380 76h24M404 76l-8-6M404 76l-8 6','M486 248l-8 19-4-10M478 267l11-3','M424 610v24l-7-8M424 634l7-8']:s+=arrow(d)
(R/'major-vessels-node-01.svg').write_text((s+'</svg>').replace('aorta-red','aorta-red-full'))
s=head('主動脈弓三分支：頭臂動脈先分叉',600)
# Same rule as the full view: the arch starts just before the brachiocephalic trunk and ends just after the left subclavian artery.
A_ASC=[(250,450),(244,390),(240,330),(258,282)]
A_ARC=[(258,282),(290,196),(430,196),(462,286)]
A_DES=[(462,286),(472,315),(450,390),(440,450)]
s+='<rect x="196" y="96" width="104" height="146" rx="12" fill="#fff0e7" stroke="#e5c7b4"/>'
bct=bez(A_ARC,0.14);lcc=bez(A_ARC,0.5);lsa=bez(A_ARC,0.84)
fork=(250,130)
s+=seg(f'M{fork[0]} {fork[1]}L246 62','arch',34,'round')+seg(f'M{fork[0]} {fork[1]}Q214 128 186 156','arch',34,'round')
s+=seg(f'M{bct[0]:.0f} {bct[1]+10:.0f}L{fork[0]} {fork[1]}','arch',44,'round')
s+=seg(f'M{lcc[0]:.0f} {lcc[1]+10:.0f}L{lcc[0]-2:.0f} 96','arch',40,'round')+seg(f'M{lsa[0]:.0f} {lsa[1]+10:.0f}L{lsa[0]+38:.0f} 150','arch',40,'round')
s+=seg(cpath(A_DES),'thoracic',90)+seg(cpath(A_ARC),'arch',100)+seg(cpath(A_ASC),'ascending',100)
s+=cut(A_ASC,1,70)+cut(A_ARC,1,70)
for t,x,y,d in [('右頸總動脈',12,72,'M236 80L168 64'),('右鎖骨下動脈',12,190,'M196 152L160 178'),('頭臂動脈',12,262,f'M{bct[0]-4:.0f} {bct[1]-40:.0f}L130 254'),('左頸總動脈',300,60,f'M{lcc[0]+12:.0f} 106L{lcc[0]+30:.0f} 70'),('左鎖骨下動脈',414,112,f'M{lsa[0]+40:.0f} 160L480 122'),('主動脈弓',12,371,'M330 236L132 361'),('升主動脈',12,430,'M206 400L132 420'),('胸主動脈',478,500,'M452 440L492 474')]:s+=line(d)+txt(x,y,t)
s+=txt(12,507,'淡框：右側多一段頭臂動脈')+txt(12,551,'兩條點虛線之間＝主動脈弓')
(R/'major-vessels-node-02.svg').write_text((s+'</svg>').replace('aorta-red','aorta-red-arch'))
