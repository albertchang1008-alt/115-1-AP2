"""Reflow only tiny SVG labels in the published RBC copy, retaining every label.

Original shapes stay above their labels. This avoids shrinking long text into
unreadable 64px navigation thumbnails or 180px detail figures.
"""
import re
import html
from pathlib import Path
p=Path(__file__).resolve().parent.parent/'public/materials/rbc-homeostasis-v1/index.html'
s=p.read_text()

def reflow(m):
    raw=m[0]
    if 'rbc-overview-' in raw or 'data-stage1-readable' in raw:return raw
    attrs=re.search(r'<svg([^>]*)>',raw)[1]
    view=re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"',attrs)
    if not view:return raw
    labels=re.findall(r'<text\b[^>]*>(.*?)</text>',raw,re.S)
    if not labels:return raw
    width,height=map(float,view.groups());scale=480/width
    inner=raw[raw.index('>')+1:raw.rindex('</svg>')]
    inner=re.sub(r'<text\b[^>]*>.*?</text>','',inner,flags=re.S)
    y=height*scale+32;legend=''
    for label in labels:
        # Original label text is preserved verbatim across tspans.
        txt=html.unescape(re.sub('<[^>]*>','',label))
        chunks=[txt[i:i+17] for i in range(0,len(txt),17)]
        ts=''.join(f'<tspan x="24" y="{y+j*30}">{html.escape(chunk)}</tspan>' for j,chunk in enumerate(chunks))
        legend+=f'<text font-family="system-ui,sans-serif" font-size="24" fill="#17212b">{ts}</text>'
        y+=len(chunks)*30+12
    attrs=re.sub(r'viewBox="[^"]+"',f'viewBox="0 0 480 {y+12}"',attrs)
    return f'<svg{attrs} data-stage1-readable="true"><g transform="scale({scale})">{inner}</g>{legend}</svg>'

s=re.sub(r'<svg\b.*?</svg>',reflow,s,flags=re.S)
css='''<style>
/* 原圖與原標籤保留；圖例換行、取消縮圖尺寸上限，讓 390px 可讀。 */
.flow-grid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
.flow-nav-card svg{width:100%;height:auto}
.card-svg-container svg{max-height:none}
@media(max-width:760px){.flow-grid,.detail-cards-grid{grid-template-columns:minmax(0,1fr)}}
</style>'''
if '.flow-nav-card svg{width:100%;height:auto}' not in s:s=s.replace('</head>',css+'</head>')
p.write_text(s)
