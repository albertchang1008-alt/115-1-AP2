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
s=head('主動脈全段：左右冠狀動脈與四段範圍',800)
s+='<path d="M195 471Q338 405 463 471L463 490Q338 435 195 490Z" fill="#eee1ef" fill-opacity=".7" stroke="#ceb7d0"/>'
s+=tube('M446 185C432 240 380 305 380 450','thoracic',57)+tube('M380 450L373 685','abdominal',45)
s+=tube('M285 150C318 98 400 99 432 138Q460 158 446 185','arch')
s+=tube('M274 291C260 270 249 232 254 199Q260 170 285 150','ascending')
# Slightly expanded aortic sinuses and two ostia, each continuing into a coronary artery.
s+='<g data-aortic-segment="ascending"><ellipse class="aortic-tube" cx="269" cy="279" rx="36" ry="32" fill="url(#aorta-red)" stroke="#A3182C" stroke-width="2"/><ellipse cx="247" cy="280" rx="5" ry="8" fill="#A3182C"/><ellipse cx="292" cy="280" rx="5" ry="8" fill="#A3182C"/></g>'
s+=tube('M247 280Q220 291 206 315','ascending',14)+tube('M292 280Q325 287 349 310','ascending',14)
for d in ['M285 150L266 113','M354 114L349 73','M421 132L441 92']:s+=tube(d,'arch',26)
s+=tube('M373 685Q353 713 328 732','abdominal',30)+tube('M373 685Q390 712 414 732','abdominal',30)
s+=boundary('M244 130L326 174')+boundary('M397 171L489 198')+boundary('M337 450H423')
s+=bracket('M190 166h-10v145h10')+txt(12,244,'升主動脈')
s+=bracket('M466 113h10v80h-10')+txt(480,148,'主動脈弓')
s+=bracket('M450 212h12v216h-12')+txt(476,327,'胸主動脈')
s+=bracket('M450 466h12v218h-12')+txt(476,580,'腹主動脈')
s+=line('M206 315L169 346')+txt(12,362,'右冠狀動脈')+line('M349 310L415 347')+txt(417,370,'左冠狀動脈')+txt(12,410,'→心臟血液供應')
s+=line('M195 471L95 491')+txt(12,505,'橫膈')+txt(12,776,'約第 4 腰椎：分為左右髂總動脈')
for d in ['M315 78l22-3-8-7M337 75l-7 10','M475 238l-8 19-4-10M467 257l11-3','M419 610v24l-7-8M419 634l7-8']:s+=arrow(d)
(R/'major-vessels-node-01.svg').write_text((s+'</svg>').replace('aorta-red','aorta-red-full'))
s=head('主動脈弓三分支：頭臂動脈先分叉',600)
# The tinted box surrounds the brachiocephalic trunk itself, rather than its label.
s+='<rect x="174" y="106" width="124" height="124" rx="12" fill="#fff0e7" stroke="#e5c7b4"/>'
s+=tube('M247 443L240 337Q239 280 270 240',w=100)+tube('M270 240C313 194 389 205 428 258Q461 291 450 330',w=105)+tube('M450 330Q436 385 426 443',w=87)
s+=tube('M270 240L258 184L249 168',w=42)+tube('M249 168L225 141L223 114',w=36)+tube('M249 168Q216 162 189 183',w=36)
s+=tube('M333 216L328 147',w=42)+tube('M425 251L458 192',w=42)
s+=boundary('M206 219L324 261')+boundary('M387 310L513 350')
for t,x,y,d in [('右頸總動脈',12,82,'M223 123L168 88'),('右鎖骨下動脈',12,206,'M205 175L166 212'),('頭臂動脈',12,280,'M258 193L130 286'),('左頸總動脈',300,82,'M352 93L330 165'),('左鎖骨下動脈',417,137,'M470 148L450 207'),('主動脈弓',12,371,'M328 221L132 377')]:s+=line(d)+txt(x,y,t)
s+=txt(12,507,'淡框：右側多一段頭臂動脈')+txt(12,551,'兩條點虛線之間＝主動脈弓')
(R/'major-vessels-node-02.svg').write_text((s+'</svg>').replace('aorta-red','aorta-red-arch'))
