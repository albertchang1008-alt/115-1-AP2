"""Original vector anatomy. All paths are authored coordinates, never image tracing."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]/'materials-src/figures'
RED='#D7263D';BLUE='#1769aa';INK='#17212b';parts=[]
def vessel(d,color,width,routes='',name='',segment='',dash=''):
    attrs=f' data-routes="{routes}"' if routes else ''
    if segment:attrs+=f' data-aortic-segment="{segment}"'
    parts.append(f'<path class="vessel"{attrs} data-vessel="{name}" d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
    if routes:parts.append(f'<g class="blood-arrow" data-routes="{routes}"><path d="M-4 -4L1 0L-4 4" fill="none" stroke="{color}" stroke-width="2"><animateMotion dur=".4s" begin="0s" repeatCount="indefinite" rotate="auto" path="{d}"/></path></g>')
# The canonical body and organs are shared by the route lab, pulse map and overview.
body='<defs><linearGradient id="anatomy-skin" x2="1" y2="1"><stop stop-color="#f6eee5"/><stop offset="1" stop-color="#e5d9ca"/></linearGradient><linearGradient id="anatomy-liver"><stop stop-color="#bc8b74"/><stop offset="1" stop-color="#ddbaa5"/></linearGradient></defs>\n<path class="body" fill="url(#anatomy-skin)" stroke="#cbbfac" stroke-width="1.2" d="M183 65C164 77 165 112 176 135L183 147L181 162C169 172 150 171 140 183C127 204 121 238 112 269L97 314L83 352C79 360 68 367 69 374L77 372L65 397Q63 403 67 405L79 385L70 410Q69 416 74 414L86 389L80 418Q82 423 86 417L94 391L92 414Q95 419 99 411L105 380Q111 365 109 355L124 318L143 273L153 237C152 263 154 287 161 315L155 355C146 375 155 400 161 418L157 478L157 529L165 590L167 649L164 710L151 734Q151 746 175 741L190 735L189 706L190 653L188 590L190 540L197 460L202 419L207 460L213 540L215 590L213 653L214 706L213 735L228 741Q252 746 252 734L239 710L236 649L238 590L246 529L246 478L241 418C248 400 257 375 248 355L242 315C249 287 251 263 250 237L260 273L279 318L294 355Q292 365 298 380L304 411Q308 419 311 414L309 391L317 417Q321 423 323 418L317 389L329 414Q334 416 333 410L324 385L336 405Q340 403 338 397L326 372L334 374Q335 367 326 362L320 352L306 314L291 269C282 238 276 204 263 183C253 171 234 172 222 162L220 147L227 135C238 112 239 77 220 65Q202 55 183 65Z"/>\n<path d="M175 99Q185 94 192 99M211 99Q218 94 226 99M200 101L197 117L204 118M191 130Q201 135 213 129M158 194Q181 186 196 194M210 194Q228 186 247 194M158 263Q199 272 246 262" fill="none" stroke="#cabda9" stroke-width="1.3"/>\n<path d="M191 201C175 197 165 217 163 250Q176 261 192 252Z M216 201C232 196 242 219 243 250Q229 261 217 252Z" fill="#d7e2e4" opacity=".55" stroke="#b6cbd0"/>\n<path d="M196 218C203 209 213 213 217 221C231 212 239 226 233 244L225 267C211 261 189 244 188 232Q187 223 196 218Z" fill="#e9a4b0" stroke="#b97786" stroke-width="1.5"/>\n<path d="M151 280C174 266 195 272 211 277L247 284Q235 299 214 299Q195 326 160 327L148 307Z" fill="url(#anatomy-liver)" stroke="#a47c64" stroke-width="1.3"/>\n<path d="M243 276C240 290 252 295 258 300C278 300 280 320 273 338C265 359 240 358 232 344Q224 330 234 321Q241 332 250 324Q258 315 247 309C236 302 233 289 237 277Z" fill="#f0d4c1" stroke="#c49e88" stroke-width="1.3"/>\n<path d="M180 337C159 345 161 365 177 368C204 372 230 336 232 355C233 375 162 370 174 384C184 399 234 367 226 390C223 404 187 398 180 410" fill="none" stroke="#e0ccb3" stroke-width="8" opacity=".6"/>\n'
# Cone-shaped heart: superior/right base and inferior/left apex, not a heart symbol.
old=r'<path d="M196 218.*?/>\n'
heart='''<g data-organ="heart"><path d="M189 216C201 212 216 214 227 223C238 234 242 252 237 269C224 266 203 255 191 242C184 234 183 224 189 216Z" fill="#e2a3aa" stroke="#a96c79" stroke-width="1.3"/><path d="M187 215C177 217 178 230 186 237L195 235L197 218Z" fill="#ecc0bf" stroke="#a96c79" stroke-width="1"/><path d="M198 219C202 233 214 249 237 269" fill="none" stroke="#bb7e89" stroke-width="1"/></g>\n'''
body=re.sub(old,heart,body)
body=body.replace('L242 315C249 287 251 263 250 237','L258 315C266 287 260 263 250 237')
body=re.sub(r'<path d="M151 280.*?/>', '<path data-organ="liver" d="M151 280C173 267 197 272 211 278L235 283Q232 294 211 298Q193 322 158 325L148 306Z" fill="url(#anatomy-liver)" stroke="#a47c64" stroke-width="1.3"/>',body)
body=re.sub(r'<path d="M243 276.*?/>','<path data-organ="stomach" d="M239 279C237 294 244 305 254 306C274 303 280 325 269 345C258 368 232 363 224 344Q220 331 230 324Q240 343 252 332Q264 319 245 314C232 308 231 292 234 279Z" fill="#f0d4c1" stroke="#c49e88" stroke-width="1.3"/>',body)
body+='<path d="M157 271Q204 260 253 272" stroke="#b9a899" stroke-width="1" fill="none" stroke-dasharray="3 3"/>'
all_routes='right-hand left-hand left-foot stomach'
# The arch is a wide curve, with its own exact limits and three superior branches.
segments=[('ascending','M202 225C198 219 190 212 190 202Q189 192 197 184',all_routes),('arch','M197 184C207 169 232 169 249 179Q269 186 266 207',all_routes),('thoracic','M266 207C258 226 238 235 233 255L231 280','left-foot stomach'),('abdominal','M231 280L230 300','left-foot stomach'),('abdominal','M230 300L228 377','left-foot')]
for name,d,rs in segments:vessel(d,RED,12,rs,'aorta-'+name,name)
for d in ['M190 180L203 188','M258 204L274 210','M223 280L239 280']:
    parts.append(f'<path class="segment-mark" d="{d}" fill="none" stroke="#6d7880" stroke-width="1" stroke-dasharray="1 2"/>')
vessel('M197 184C193 176 192 168 191 161',RED,5,'right-hand','brachiocephalic-artery')
vessel('M191 161C183 170 153 177 141 191',RED,4.5,'right-hand','right-subclavian')
vessel('M191 161C184 150 177 140 178 126L176 109',RED,3.5,'','right-carotid')
vessel('M176 109C171 104 171 94 173 88',RED,2,'','right-temporal')
vessel('M226 174C224 157 224 142 226 126L228 109',RED,3.5,'','left-carotid')
vessel('M257 185C257 177 260 177 262 190',RED,4.5,'left-hand','left-subclavian')
for side,route in [('right','right-hand'),('left','left-hand')]:
    arm=[('M141 191C134 211 131 230 126 248',4,'axillary'),('M126 248C139 270 142 288 132 294L111 308',3.6,'brachial'),('M111 308C101 323 94 340 88 359L81 380',2.8,'radial'),('M111 308C111 332 107 350 101 372L99 387',2.4,'ulnar')] if side=='right' else [('M262 190C269 211 272 230 277 248',4,'axillary'),('M277 248C283 269 286 289 292 308',3.6,'brachial'),('M292 308C302 323 309 340 315 359L322 380',2.8,'radial'),('M292 308C292 332 296 350 302 372L304 387',2.4,'ulnar')]
    for d,w,n in arm:vessel(d,RED,w,route,side+'-'+n)
    vessel('M95 378C101 353 116 322 120 304C130 269 139 216 148 194C159 184 180 177 187 179' if side=='right' else 'M309 378C304 353 289 322 285 304C275 269 266 216 255 194L237 180C225 172 210 178 187 179',BLUE,4,route,side+'-arm-return')
vessel('M187 179C188 195 189 214 188 225',BLUE,5,'right-hand left-hand','superior-vena-cava')
vessel('M230 300C236 295 238 297 240 302',RED,3.4,'stomach','coeliac-trunk')
vessel('M240 302C248 301 253 313 245 323',RED,2.8,'stomach','gastric-artery')
for side,route in [('right',''),('left','left-foot')]:
    segs=[('M228 377C212 386 197 397 187 419',4.5,'iliac'),('M187 419C177 449 172 484 174 527',4,'femoral'),('M174 527Q174 548 177 563',3.5,'popliteal'),('M177 563C173 602 174 650 172 713L163 734',2.7,'anterior-tibial'),('M177 563C185 606 183 663 182 714',2.4,'posterior-tibial')] if side=='right' else [('M228 377C239 386 240 400 235 419',4.5,'iliac'),('M235 419C229 443 224 484 230 527',4,'femoral'),('M230 527Q228 548 227 563',3.5,'popliteal'),('M227 563C231 602 230 650 232 713L241 734',2.7,'anterior-tibial'),('M227 563C218 606 220 663 222 714',2.4,'posterior-tibial')]
    for d,w,n in segs:vessel(d,RED,w,route,side+'-'+n,'','5 4' if n in ['popliteal','posterior-tibial'] else '')
vessel('M227 730C224 659 220 595 216 555C216 501 216 454 227 418C226 400 217 389 203 377',BLUE,4,'left-foot','left-leg-return')
vessel('M182 729C185 659 184 595 187 555C189 501 190 454 195 418C198 400 200 389 203 377',BLUE,4,'','right-leg-return')
vessel('M203 377L202 301',BLUE,5,'left-foot','lower-vena-cava')
vessel('M202 301C200 280 196 260 188 234',BLUE,5,'left-foot stomach','inferior-vena-cava')
vessel('M264 341C246 354 217 342 189 315',BLUE,4,'stomach','portal-vein')
vessel('M203 387C213 350 199 332 189 315',BLUE,3,'','intestinal-vein')
vessel('M172 289Q187 281 201 278M184 278L201 274M215 288L201 278',BLUE,3.4,'stomach','hepatic-veins')
vessel('M177 137C179 153 184 169 187 179',BLUE,3,'','right-jugular')
vessel('M231 137C229 151 232 167 237 180',BLUE,3,'','left-jugular')
base='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 810" role="img" aria-label="全身主要動靜脈解剖底圖"><title>全身主要動靜脈解剖底圖</title>'+body+''.join(parts)+'</svg>'
(root/'major-vessels-anatomy-base.svg').write_text(base)
# Wide label gutters permit full labels on one line at >=14 px on phones.
def label(text,side,y,px,py,route='',color=INK):
    px=px*.8+140;x=8 if side=='left' else 420;end=x+len(text)*28 if side=='left' else x
    return f'<g class="anatomy-label"'+(f' data-label-state="{route}"' if route else '')+f'><path d="M{px} {py}L{end} {y-8}" stroke="{color}" stroke-width="1.2" fill="none"/><circle cx="{px}" cy="{py}" r="2.2" fill="{color}"/><text x="{x}" y="{y}" fill="{color}">{text}</text></g>'
labels=''
for route,right in [('right-hand',True),('left-hand',False)]:
    side='left' if right else 'right';other='right' if right else 'left'
    items=[('頭臂動脈' if right else '左鎖骨下',130 if right else 175,195 if right else 259,176 if right else 183,RED),('鎖骨下動脈',220,157 if right else 260,180,RED),('鎖骨下靜脈',265,163 if right else 246,184 if right else 187,BLUE),('腋動脈',310,135 if right else 269,216,RED),('腋靜脈',355,139 if right else 266,224,BLUE),('肱動脈',420,137 if right else 281,275 if right else 266,RED),('橈、尺動脈',495,95 if right else 301,354 if right else 365,RED)]
    if not right:
        # One full label for the same left subclavian artery avoids duplicate crossing leaders.
        items=items[1:]
        items[0]=('左鎖骨下動脈',220,260,180,RED)
    for t,y,px,py,c in items:labels+=label(t,side,y,px,py,route,c)
    labels+=label('右頭臂靜脈' if right else '左頭臂靜脈',side if right else other,175 if right else 205,180 if right else 218,178 if right else 176,route,BLUE)
    labels+=label('升主動脈',other,240,190,205,route,RED)+label('上腔靜脈',other,300,188,218,route,BLUE)+label('主動脈弓',other,100,240,175,route,RED)
for route in ['left-foot','stomach','overview']:
    for t,y,px,py in [('升主動脈',145,190,205),('主動脈弓',100,240,175),('胸主動脈',220,245,236),('腹主動脈',280,230,291)]:labels+=label(t,'right',y,px,py,route,RED)
for t,side,y,px,py in [('髂總動脈','right',385,238,389),('髂外動脈','right',430,237,409),('股動脈','right',480,227,467),('膕動脈','right',553,228,545),('脛前動脈','right',620,231,621),('脛後動脈','right',679,221,660),('下腔靜脈','left',248,197,267),('髂總靜脈','left',374,213,388),('髂外靜脈','left',432,227,418),('股靜脈','left',498,217,469)]:labels+=label(t,side,y,px,py,'left-foot',BLUE if '靜' in t else RED)
for t,side,y,px,py in [('腹腔幹','right',325,236,298),('胃','right',382,260,330),('肝臟','left',317,165,309),('肝門靜脈','left',376,233,342),('肝靜脈','left',268,186,282),('下腔靜脈','left',220,194,254),('右心房','left',167,188,225)]:labels+=label(t,side,y,px,py,'stomach',BLUE if '靜' in t or t=='右心房' else INK)
head='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 810" role="img" aria-label="全身主要動靜脈｜圖左＝人體右"><style>text{font-family:system-ui,sans-serif;font-size:calc(28px * var(--font-scale,1))}.anatomy-label path{opacity:.65}[data-label-state]{display:none}[data-label-state="overview"]{display:block}</style><text x="12" y="35">圖左＝人體右</text><g transform="translate(140 0) scale(.8 1)"><g data-anatomy-base="major-vessels-anatomy-base.svg"/></g>'
(root/'major-vessels-overview.svg').write_text(head+labels+'<text x="10" y="789">紅：去程；藍：回程</text></svg>')
pulse=''
for t,side,y,px,py in [('顳動脈','left',83,169,94),('頸動脈','right',132,225,132),('肱動脈','left',290,132,294),('橈動脈','right',407,315,359),('股動脈','left',464,180,442),('膕（膝後）','right',560,228,545),('足背動脈','left',731,169,724)]:
    pulse+=label(t,side,y,px,py,color=RED)+f'<circle cx="{px*.8+140}" cy="{py}" r="6" fill="#fff" stroke="{RED}" stroke-width="2"/>'
(root/'major-vessels-pulse.svg').write_text(head+pulse+'<text x="10" y="790">虛線：位於後側的血管</text></svg>')
# Portal inset reuses the exact organ silhouettes, with separate superior/inferior entries.
liver=re.search(r'<path data-organ="liver".*?/>',body).group().replace('url(#anatomy-liver)','#c79a80')
stomach=re.search(r'<path data-organ="stomach".*?/>',body).group()
zoom='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="肝門循環放大圖｜圖左＝人體右"><style>text{font-family:system-ui,sans-serif;font-size:calc(28px * var(--font-scale,1))}</style><text x="12" y="35">肝門循環放大圖</text><text x="12" y="70">圖左＝人體右</text>'
zoom+='<g transform="translate(-2.6 -135.5) scale(1.3)">'+heart+'</g><g transform="translate(-200 -310) scale(2)">'+liver+'</g><g transform="translate(-180 -215) scale(2)">'+stomach+'</g>'
zoom_paths=[('M260 157C252 147 244 133 246 119C255 95 294 92 320 110Q344 122 337 146C327 177 318 213 318 282L317 430',RED,8),('M318 282C324 277 332 280 334 287',RED,5),('M334 287C319 312 306 356 315 415',RED,4),('M230 106Q236 128 236 155',BLUE,8),('M238 267C238 231 236 206 236 173',BLUE,8),('M145 273Q188 257 238 267M181 263L238 263M209 280L238 267',BLUE,5),('M358 427C329 430 264 391 178 320',BLUE,7)]
for d,c,w in zoom_paths:zoom+=f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
for d in [zoom_paths[-1][0],'M145 273Q188 257 238 267',zoom_paths[4][0]]:zoom+=f'<g class="portal-arrow"><path d="M-5 -5L2 0L-5 5" stroke="{BLUE}" stroke-width="3" fill="none"><animateMotion path="{d}" dur=".4s" repeatCount="indefinite" rotate="auto"/></path></g>'
def zlabel(t,x,y,px,py):
    end=x+len(t)*28 if x<300 else x
    return f'<path d="M{px} {py}L{end} {y-8}" fill="none" stroke="#64748b" stroke-width="1.2"/><text x="{x}" y="{y}">{t}</text>'
for t,x,y,px,py in [('上腔靜脈',8,127,233,130),('下腔靜脈',8,211,238,216),('肝靜脈',8,246,180,264),('肝門靜脈',8,401,270,389),('心臟',435,158,272,174),('主動脈',420,232,320,224),('腹腔幹',420,310,330,282),('胃',435,478,352,444)]:zoom+=zlabel(t,x,y,px,py)
zoom+='<text x="132" y="301">肝臟</text><text x="12" y="560">紅：去程；藍：回程</text></svg>'
(root/'major-vessels-portal.svg').write_text(zoom)
