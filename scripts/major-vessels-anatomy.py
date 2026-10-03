"""Original vector anatomy, constructed from coordinates (no reference-image tracing)."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'materials-src/figures'
parts=[]
def path(d,color,width,routes='',name='',dash=''):
    attrs=f' data-routes="{routes}"' if routes else ''
    parts.append(f'<path class="vessel"{attrs} data-vessel="{name}" d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
    if routes:
        parts.append(f'<g class="blood-arrow" data-routes="{routes}"><path d="M-4 -4L1 0L-4 4" fill="none" stroke="{color}" stroke-width="2"><animateMotion dur=".4s" begin="0s" repeatCount="indefinite" rotate="auto" path="{d}"/></path></g>')
red='#a71930';blue='#1769aa';all='right-hand left-hand left-foot stomach'
body='''<defs><linearGradient id="anatomy-skin" x2="1" y2="1"><stop stop-color="#f6eee5"/><stop offset="1" stop-color="#e5d9ca"/></linearGradient><linearGradient id="anatomy-liver"><stop stop-color="#bc8b74"/><stop offset="1" stop-color="#ddbaa5"/></linearGradient></defs>
<path class="body" fill="url(#anatomy-skin)" stroke="#cbbfac" stroke-width="1.2" d="M183 65C164 77 165 112 176 135L183 147L181 162C169 172 150 171 140 183C127 204 121 238 112 269L97 314L83 352C79 360 68 367 69 374L77 372L65 397Q63 403 67 405L79 385L70 410Q69 416 74 414L86 389L80 418Q82 423 86 417L94 391L92 414Q95 419 99 411L105 380Q111 365 109 355L124 318L143 273L153 237C152 263 154 287 161 315L155 355C146 375 155 400 161 418L157 478L157 529L165 590L167 649L164 710L151 734Q151 746 175 741L190 735L189 706L190 653L188 590L190 540L197 460L202 419L207 460L213 540L215 590L213 653L214 706L213 735L228 741Q252 746 252 734L239 710L236 649L238 590L246 529L246 478L241 418C248 400 257 375 248 355L242 315C249 287 251 263 250 237L260 273L279 318L294 355Q292 365 298 380L304 411Q308 419 311 414L309 391L317 417Q321 423 323 418L317 389L329 414Q334 416 333 410L324 385L336 405Q340 403 338 397L326 372L334 374Q335 367 326 362L320 352L306 314L291 269C282 238 276 204 263 183C253 171 234 172 222 162L220 147L227 135C238 112 239 77 220 65Q202 55 183 65Z"/>
<path d="M175 99Q185 94 192 99M211 99Q218 94 226 99M200 101L197 117L204 118M191 130Q201 135 213 129M158 194Q181 186 196 194M210 194Q228 186 247 194M158 263Q199 272 246 262" fill="none" stroke="#cabda9" stroke-width="1.3"/>
<path d="M191 201C175 197 165 217 163 250Q176 261 192 252Z M216 201C232 196 242 219 243 250Q229 261 217 252Z" fill="#d7e2e4" opacity=".55" stroke="#b6cbd0"/>
<path d="M196 218C203 209 213 213 217 221C231 212 239 226 233 244L225 267C211 261 189 244 188 232Q187 223 196 218Z" fill="#e9a4b0" stroke="#b97786" stroke-width="1.5"/>
<path d="M151 280C174 266 195 272 211 277L247 284Q235 299 214 299Q195 326 160 327L148 307Z" fill="url(#anatomy-liver)" stroke="#a47c64" stroke-width="1.3"/>
<path d="M243 276C240 290 252 295 258 300C278 300 280 320 273 338C265 359 240 358 232 344Q224 330 234 321Q241 332 250 324Q258 315 247 309C236 302 233 289 237 277Z" fill="#f0d4c1" stroke="#c49e88" stroke-width="1.3"/>
<path d="M180 337C159 345 161 365 177 368C204 372 230 336 232 355C233 375 162 370 174 384C184 399 234 367 226 390C223 404 187 398 180 410" fill="none" stroke="#e0ccb3" stroke-width="8" opacity=".6"/>
'''
# Aortic arch branches ordered from ascending to descending; patient right is image left.
path('M213 230C211 218 203 215 205 202C207 180 235 177 237 200L229 242L228 377',red,7,all,'aorta')
path('M211 189L201 172L191 161',red,5,'right-hand','brachiocephalic-artery')
path('M191 161C183 170 153 177 141 191',red,4.5,'right-hand','right-subclavian')
path('M191 161L187 126L184 99',red,3.5,'','right-carotid')
path('M184 109C177 105 176 94 179 84',red,2,'','right-temporal')
path('M221 183C218 163 216 140 216 117L219 99',red,3.5,'','left-carotid')
path('M232 188C244 174 255 176 262 190',red,4.5,'left-hand','left-subclavian')
for side,route in [('right','right-hand'),('left','left-hand')]:
    def mirror(d):
        # Coordinates are explicitly authored below rather than transformed labels.
        return d
    arm = [('M141 191C134 211 131 230 126 248',4,'axillary'),('M126 248C120 269 117 289 111 308',3.6,'brachial'),('M111 308C101 323 94 340 88 359L81 380',2.8,'radial'),('M111 308C111 332 107 350 101 372L99 387',2.4,'ulnar')] if side=='right' else [('M262 190C269 211 272 230 277 248',4,'axillary'),('M277 248C283 269 286 289 292 308',3.6,'brachial'),('M292 308C302 323 309 340 315 359L322 380',2.8,'radial'),('M292 308C292 332 296 350 302 372L304 387',2.4,'ulnar')]
    for d,w,n in arm:path(d,red,w,route,side+'-'+n)
    path('M95 378C101 353 116 322 120 304C130 269 139 216 148 194C159 184 180 177 187 179L191 219L194 232' if side=='right' else 'M309 378C304 353 289 322 285 304C275 269 266 216 255 194L237 180C225 172 210 178 187 179',blue,4,route,side+'-arm-return')
# Descending aorta, coeliac trunk, iliac and leg trees.
path('M228 286C233 283 239 284 241 292C242 299 255 302 262 313',red,3.2,'stomach','coeliac-gastric')
for side,route in [('right',''),('left','left-foot')]:
    if side=='right':
        segs=[('M228 377C212 386 197 397 187 419',4.5,'iliac'),('M187 419C177 449 172 484 174 527',4,'femoral'),('M174 527Q174 548 177 563',3.5,'popliteal'),('M177 563C173 602 174 650 172 713L163 734',2.7,'anterior-tibial'),('M177 563C185 606 183 663 182 714',2.4,'posterior-tibial')]
    else:
        segs=[('M228 377C237 387 248 397 253 419',4.5,'iliac'),('M253 419C238 449 232 484 230 527',4,'femoral'),('M230 527Q228 548 227 563',3.5,'popliteal'),('M227 563C231 602 230 650 232 713L241 734',2.7,'anterior-tibial'),('M227 563C218 606 220 663 222 714',2.4,'posterior-tibial')]
    for d,w,n in segs:path(d,red,w,route,side+'-'+n,'5 4' if n in ['popliteal','posterior-tibial'] else '')
path('M238 730C243 659 246 595 241 555C244 501 248 454 260 418C258 401 234 389 203 377',blue,4,'left-foot','left-leg-return')
path('M203 377L202 301L199 245L194 232',blue,5,'left-foot stomach','inferior-vena-cava')
path('M168 729C161 659 158 595 163 555C160 501 156 454 180 416C185 400 191 386 203 377',blue,4,'','right-leg-return')
path('M265 336C256 340 244 341 233 330L213 315Q199 313 186 308',blue,4,'stomach','portal-vein')
path('M203 385C213 363 221 348 233 330',blue,3,'stomach','intestinal-vein')
path('M172 295Q187 292 202 282M184 280L202 277M217 296L202 282',blue,3.4,'stomach','hepatic-veins')
path('M202 282L199 245L194 232',blue,5,'stomach','hepatic-cava')
path('M182 115C181 138 185 158 187 179',blue,3,'','right-jugular')
path('M226 116C226 146 229 163 237 180',blue,3,'','left-jugular')
base='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 810" role="img" aria-label="全身主要動靜脈解剖底圖"><title>全身主要動靜脈解剖底圖</title>'+body+''.join(parts)+'</svg>'
(root/'major-vessels-anatomy-base.svg').write_text(base)
def label(text,x,y,px,py,route='',color='#17212b'):
    px=px*.85+30
    side=x<200; x=4 if side else 310
    chunks=[text] if len(text)<=4 else [text[:3],text[3:]]
    end=x+max(map(len,chunks))*20 if side else x
    words=''.join(f'<tspan x="{x}" dy="{0 if i==0 else 20}">{t}</tspan>' for i,t in enumerate(chunks))
    return f'<g class="anatomy-label"'+(f' data-label-state="{route}"' if route else '')+f'><path d="M{px} {py}L{end} {y-6}" stroke="{color}" stroke-width="1" fill="none"/><circle cx="{px}" cy="{py}" r="2.2" fill="{color}"/><text x="{x}" y="{y}" fill="{color}">{words}</text></g>'
labels=''
for route,side in [('right-hand','right'),('left-hand','left')]:
    left=side=='right'; x=4 if left else 270
    items=[('頭臂動脈' if left else '左鎖骨下',174,201 if left else 254,172 if left else 179,red),('鎖骨下動脈' if left else '腋動脈',210 if left else 250,155 if left else 269,180 if left else 214,red),('鎖骨下靜脈',246 if left else 210,163 if left else 246,184,blue),('腋動脈' if left else '肱動脈',285 if left else 330,135 if left else 281,216 if left else 266,red),('腋靜脈',323 if left else 285,139 if left else 266,224,blue),('肱動脈' if left else '橈動脈',365 if left else 390,120 if left else 310,275 if left else 347,red),('橈、尺動脈' if left else '尺動脈',445,95 if left else 300,354 if left else 365,red)]
    for text,y,px,py,c in items:labels+=label(text,x,y+(45 if left and y>174 else 0),px,py,route,c)
    if left:labels+=label('右頭臂靜脈',4,210,187,179,route,blue)
    for text,y,px,py,c in [('主動脈弓',158,225,184,red),('右頭臂靜脈' if left else '左頭臂靜脈',110,187 if left else 223,179 if left else 177,blue),('上腔靜脈',218,191,219,blue)]:
        if not (left and text=='右頭臂靜脈'):labels+=label(text,270 if left else 4,y,px,py,route,c)
# Long return labels sit below the hand and are led through the outside margin.
for text,x,y,px,py in [('腹主動脈',4,284,228,307),('髂總動脈',270,390,238,388),('髂外動脈',270,425,251,412),('股動脈',270,480,238,470),('膕動脈',270,551,228,545),('脛前動脈',270,620,231,621),('脛後動脈',270,675,221,660),('下腔靜脈',4,243,202,264),('髂總靜脈',4,383,226,386),('髂外靜脈',4,436,258,420),('股靜脈',4,491,249,468)]:labels+=label(text,x,y,px,py,'left-foot',blue if '靜' in text else red)
for text,x,y,px,py in [('腹腔幹',270,276,238,287),('胃',270,363,266,324),('肝臟',4,305,163,309),('肝門靜脈',4,355,214,317),('肝靜脈',4,244,186,290),('下腔靜脈',270,225,199,253),('右心房',4,207,194,232)]:labels+=label(text,x,y,px,py,'stomach',blue if '靜' in text or text=='右心房' else '#17212b')
head='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 810" role="img" aria-label="全身主要動靜脈｜圖左＝人體右"><style>text{font-family:system-ui,sans-serif;font-size:calc(20px * var(--font-scale,1))} .anatomy-label path{opacity:.65}</style><text x="12" y="30">圖左＝人體右</text><g transform="translate(30 0) scale(.85 1)"><g data-anatomy-base="major-vessels-anatomy-base.svg"/></g>'
(root/'major-vessels-overview.svg').write_text(head+labels+'<text x="10" y="789">紅：去程；藍：回程</text></svg>')
pulse=''
for t,x,y,px,py in [('顳動脈',4,79,179,88),('頸動脈',270,130,217,130),('肱動脈',4,259,122,270),('橈動脈',270,403,315,359),('股動脈',4,465,180,442),('膕動脈',270,565,228,545),('足背動脈',4,733,169,724)]:
    pulse+=label(t,x,y,px,py,color=red)+f'<circle cx="{px*.85+30}" cy="{py}" r="6" fill="#fff" stroke="{red}" stroke-width="2"/>'
(root/'major-vessels-pulse.svg').write_text(head+pulse+'<text x="10" y="790">虛線：位於後側的血管</text></svg>')
