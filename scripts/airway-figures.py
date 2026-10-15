#!/usr/bin/env python3
"""Rebuild only airway figures. Requires Pillow; coordinates from approved Claude labeltools.
Raster inputs are copied to the repo as 1200px WebP quality 82. Labels remain native SVG.
"""
from pathlib import Path
from PIL import Image
import base64, json, html
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'materials-src/figures'
RASTER=OUT/'raster/airway-structure'
SOURCES={'sagittal':'頭頸部矢狀剖面解剖圖.png','cartilage':'喉部軟骨與氣管解剖圖.png','swallow':'喉部與吞嚥解剖示意圖.png','trachea':'呼吸系統與氣道剖面圖.png','bronchi':'對稱肺部與氣管解剖插圖.png'}
RASTER.mkdir(parents=True,exist_ok=True)
meta={}
for key,filename in SOURCES.items():
    target=RASTER/(key+'.webp')
    # Existing repo assets allow a rerun without the original Chinese source directory.
    source=ROOT/'呼吸系統圖'/filename
    if source.exists():
        im=Image.open(source).convert('RGB')
        if key=='trachea': im=im.crop((830,160,1440,920))
        meta[key]=list(im.size)
        im.resize((1200,round(1200*im.height/im.width)),Image.Resampling.LANCZOS).save(target,'WEBP',quality=82,method=6)
    else: meta[key]=json.loads((RASTER/'dimensions.json').read_text())[key]
(RASTER/'dimensions.json').write_text(json.dumps(meta,indent=2)+'\n')
MANIFEST={}

def panel(key,crop,dx,dy):
    # Translate the original-pixel coordinate system; anatomy anchors never move within it.
    x,y,w,h=crop; W,H=meta[key]
    data=base64.b64encode((RASTER/(key+'.webp')).read_bytes()).decode()
    return f'<svg x="{dx}" y="{dy}" width="{w}" height="{h}" viewBox="{x} {y} {w} {h}" overflow="hidden"><image href="data:image/webp;base64,{data}" width="{W}" height="{H}"/></svg>'

def build(name,width,height,fs,images,labels,red=(),directions=(),states=None):
    uid='airway-'+name
    css=f'#{uid} .label{{font-size:calc({fs}px * var(--font-scale,1));fill:#2f4858;stroke:#fff;stroke-width:9;paint-order:stroke;stroke-linejoin:round}} #{uid} .lead{{fill:none;stroke:#2f4858;stroke-width:3}} #{uid} .halo{{stroke:#fff;stroke-width:9}} #{uid} .dot{{fill:#2f4858;stroke:#fff;stroke-width:3}} #{uid} .focus .label{{fill:#b4233a;font-weight:700}} #{uid} .focus .lead{{stroke:#b4233a}} #{uid} .focus .dot{{fill:#b4233a}}'
    if states:
        for state,names in states.items():
            for i,(label,*_) in enumerate(labels):
                if label in names:
                    prefix=f'.state-figure[data-state="{state}"] #{uid} .l{i}'
                    css+=f'{prefix} .label{{fill:#b4233a;font-weight:700}}{prefix} .lead{{stroke:#b4233a}}{prefix} .dot{{fill:#b4233a}}'
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" id="{uid}" viewBox="0 0 {width} {height}" font-family="PingFang TC,Noto Sans CJK TC,Noto Sans TC,sans-serif" role="img" aria-label="呼吸道構造教學圖">',f'<style>{css}</style>',f'<rect width="{width}" height="{height}" fill="#eaf6fc"/>',*images]
    for i,(label,anchor,pos,align,lines) in enumerate(labels):
        ax,ay=anchor; tx,ty=pos
        ex=tx+18 if align=='end' else tx-18
        liney=ty-fs*.34
        pts=f'{ex},{liney} {ax},{ay}'
        cls='focus' if label in red else ''
        # Explicit short lines keep the full specified term accessible, with no new labels.
        spans=''.join(f'<tspan x="{tx}" dy="{0 if j==0 else fs*1.14}">{html.escape(line)}</tspan>' for j,line in enumerate(lines or [label]))
        out.append(f'<g class="l{i} {cls}" data-label="{html.escape(label)}"><polyline class="lead halo" points="{pts}"/><polyline class="lead" points="{pts}"/><circle class="dot" data-anchor="{i}" cx="{ax}" cy="{ay}" r="7"/><text class="label" x="{tx}" y="{ty}" text-anchor="{align}" aria-label="{html.escape(label)}">{spans}</text></g>')
    for label,x,y in directions: out.append(f'<text class="label direction" x="{x}" y="{y}" text-anchor="middle">{label}</text>')
    out.append('</svg>')
    (OUT/('airway-structure-'+name+'.svg')).write_text('\n'.join(out)+'\n')
    MANIFEST[name]={'labels':[l[0] for l in labels],'red':list(red),'states':states,'viewBox':[width,height],'fontSize':fs}

def L(name,ax,ay,tx,ty,align='end',lines=None): return(name,(ax,ay),(tx,ty),align,lines)
# Original anchors: 呼吸1-咽部-標籤產生器.py.
sag={'鼻腔':(560,235),'口腔':(520,395),'軟腭':(775,385),'鼻咽':(760,325),'耳咽管口':(820,350),'咽扁桃體':(810,255),'口咽':(840,522),'喉咽':(845,625),'會厭':(800,555),'喉':(765,745),'氣管':(790,880),'食道':(880,820)}
def sagittal(name,left,right,red=(),states=None):
 labels=[L(n,*sag[n],300,y) for n,y in left]+[L(n,*sag[n],1130,y,'start') for n,y in right]
 build(name,1600,1086,64,[panel('sagittal',(0,0,1448,1086),0,0)],labels,red,states=states)
sagittal('overview',[('軟腭',300),('會厭',610),('喉',750),('氣管',890)],[('鼻咽',170),('耳咽管口',310),('口咽',490),('喉咽',640),('食道',840)],states={'state-1':['鼻咽','耳咽管口','軟腭'],'state-2':['喉','會厭'],'state-3':['氣管','食道']})
sagittal('node-01',[('鼻腔',200),('軟腭',320),('口腔',450),('會厭',620)],[('鼻咽',180),('口咽',490),('喉咽',640),('食道',840)],['鼻咽','口咽','喉咽'])
sagittal('node-02',[('軟腭',370)],[('咽扁桃體',100),('鼻咽',230),('耳咽管口',370),('口咽',560)],['耳咽管口','鼻咽'])
# Stack the approved two views without changing source coordinates.
labels=[L('會厭軟骨',640,112,360,150),L('喉結',648,412,360,420),L('甲狀軟骨',505,470,360,560),L('環狀軟骨',540,705,360,760),L('楔狀軟骨',326,1535,750,1480,'start'),L('小角軟骨',358,1587,750,1630,'start'),L('杓狀軟骨',365,1685,750,1800,'start')]
build('node-03',1250,2280,52,[panel('cartilage',(180,0,540,1086),400,0),panel('cartilage',(800,0,648,1086),50,1140)],labels,['甲狀軟骨','喉結'],[('前面觀',650,1060),('後面觀',374,2240)])
labels=[L('會厭',780,260,410,260),L('前庭皺襞',640,470,410,410),L('聲帶皺襞（真聲帶）',750,520,410,560,lines=['聲帶皺襞','（真聲帶）']),L('聲門',820,600,410,720),L('杓狀軟骨',749,803,410,860),L('食團',410,1610,800,1560,'start'),L('會厭',457,1720,800,1720,'start'),L('食道',490,1860,800,1880,'start'),L('氣管',415,1970,800,2040,'start')]
build('node-04',1250,2270,52,[panel('swallow',(0,0,720,1086),450,0),panel('swallow',(760,0,688,1086),40,1140)],labels,['聲帶皺襞（真聲帶）','杓狀軟骨','會厭'],[('前',830,65),('後',830,880),('上面觀（由上往下看喉入口）',625,1095),('吞嚥時',384,2230)])
labels=[L('C 形透明軟骨',440,400,360,400,lines=['C 形','透明軟骨']),L('黏膜層（偽複層纖毛柱狀上皮）',525,440,360,600,lines=['黏膜層','（偽複層','纖毛柱狀','上皮）']),L('氣管腔',690,360,1040,300,'start'),L('氣管平滑肌',690,550,1040,520,'start',['氣管','平滑肌']),L('食道',690,680,1040,750,'start')]
build('node-05',1350,980,56,[panel('trachea',(0,0,610,760),400,60)],labels,['C 形透明軟骨','氣管平滑肌','食道'],[('前',690,85),('後',690,920)])
labels=[L('右主支氣管',920,505,550,300,lines=['右主','支氣管']),L('次級支氣管（肺葉）',800,577,550,530,lines=['次級支氣管','（肺葉）']),L('細支氣管',618,798,550,1000),L('三級支氣管（肺節）',725,695,550,790,lines=['三級支氣管','（肺節）']),L('氣管',1002,330,1580,250,'start'),L('隆凸',992,470,1580,410,'start'),L('左主支氣管',1120,505,1580,570,'start',['左主','支氣管'])]
build('node-06',2000,1160,80,[panel('bronchi',(0,0,1448,1086),280,0)],labels,['右主支氣管'])
(RASTER/'labels.json').write_text(json.dumps(MANIFEST,ensure_ascii=False,indent=2)+'\n')
print('Generated seven airway SVGs and five WebP assets.')
