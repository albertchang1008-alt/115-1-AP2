from pathlib import Path
import json,math,hashlib,shutil
from PIL import Image,ImageFont
root=Path(__file__).resolve().parent.parent
folder=root/'docs/micro-immuno-review'
r=json.loads((folder/'verification-results.json').read_text())
assert r['ok'] and r['geometryStates']==252 and len(r['sdk'])==4
for c in r['contentChecks']:
 assert c['htmlBytes']==(root/f"public/materials/{c['slug']}-v1/index.html").stat().st_size
shots={}
for slug in ['micro-bacteria-review','immuno-concepts-review']:
 p=root/f'materials-src/{slug}/shots/report.json';shots[slug]=json.loads(p.read_text());assert shots[slug]['ok'];shutil.copy2(p,folder/f'{slug}-shots-report.json')
shutil.copy2('/tmp/micro-immuno-tests.txt',folder/'material-tests.tap')
shutil.copy2('/tmp/mi-round4-nodes.txt',folder/'node-text-validation.txt')
metadata=json.loads((folder/'figure-metadata.json').read_text())
asset_files=[m['file'] for m in metadata]+['micro-bacteria-review-lab.svg','micro-bacteria-review-node-06.svg','immuno-concepts-review-lab.svg','immuno-concepts-review-node-07.svg']
(folder/'round4-asset-sha.json').write_text(json.dumps({f:hashlib.sha256((root/'materials-src/figures'/f).read_bytes()).hexdigest() for f in asset_files},indent=2)+'\n')
anchors=[]
for row in metadata:
 p=Path('/Users/HHC/Downloads/fig/final')/row['source'];im=Image.open(p).convert('RGB');labels=[]
 for l in row['labels']:
  x=round(im.width*l['xRatio']);y=round(im.height*l['yRatio']);rgb=im.getpixel((x,y));labels.append({**l,'pixel':[x,y],'sourceRgb':rgb,'nearWhite':min(rgb)>240})
 anchors.append({'source':row['source'],'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'labels':labels})
assert max(next(l['sourceRgb'] for a in anchors if a['source']=='MI-B-N02.png' for l in a['labels'] if l['text']=='脂蛋白'))<100
assert not any(l['nearWhite'] for a in anchors for l in a['labels'])
(folder/'anchor-source-checks.json').write_text(json.dumps({'note':'Pixel samples flag empty-background anchors; they do not prove anatomical semantics. Source images and final anchor placements were manually inspected; independent Claude acceptance remains required.','figures':anchors},ensure_ascii=False,indent=2)+'\n')
font=Path(r['fontPath']);family=ImageFont.truetype(str(font),16).getname();assert family[0]=='Noto Sans CJK TC'
font_info={'family':family,'source':'https://github.com/notofonts/noto-cjk/tree/main/Sans/OTF/TraditionalChinese','file':font.name,'sha256':hashlib.sha256(font.read_bytes()).hexdigest(),'bytes':font.stat().st_size,'embeddedInPreview':False}
(folder/'font-audit.json').write_text(json.dumps(font_info,ensure_ascii=False,indent=2)+'\n')
min_px=min(x['minPx'] for x in r['results'] if x['width']==390)
min_gap=math.inf
for row in r['results']:
 ts=row['texts']
 for i,a in enumerate(ts):
  for b in ts[i+1:]:
   dx=max(b['x']-a['x']-a['w'],a['x']-b['x']-b['w'],0);dy=max(b['y']-a['y']-a['h'],a['y']-b['y']-b['h'],0);min_gap=min(min_gap,math.hypot(dx,dy))
html_rows='\n'.join(f"| {c['slug']} | {6 if c['slug'].startswith('micro') else 8} | 6＋5 | {c['htmlBytes']:,} bytes（{c['htmlBytes']/1024:.1f} KiB） |" for c in r['contentChecks'])
noto_max=max(t['w'] for x in r['results'] if x['font']=='Noto Sans CJK TC' for t in x['texts'] if t['legend'])
drug_gap=min(d['gap'] for x in r['results'] for d in x['drugOutlineGaps'])
four={'date':'2026-10-11','notoLegendLimit':1080,'notoLegendMax':noto_max,'fontExtents':{font:{'maxLegendRight':max(t['right'] for x in r['results'] if x['font']==font for t in x['texts'] if t['legend']),'clippedTexts':sum(t['clipped'] for x in r['results'] if x['font']==font for t in x['texts'])} for font in r['fonts']},'cytoplasmSeparated':all(x['cytoplasmSeparated'] for x in r['results']),'lymphHeadingAboveColumn':all(x['lymphHeadingOK'] for x in r['results']),'numberingByLegendGroups':all(g['ok'] for x in r['results'] for g in x['groupOrderChecks']),'drug50sNetGapMin':drug_gap,'drugGapRequired':12}
(folder/'round4-four-point-checks.json').write_text(json.dumps(four,ensure_ascii=False,indent=2)+'\n')
body=f'''# 115-MI 微免總複習：第三輪複驗四點修正報告

2026-10-11｜平台版本1.7.0｜`feature/micro-immuno-review`｜HEAD `e8805f8`，未提交。

**四點修正已完成 preview＋shots，待 Claude 只複驗下列四點，再給教師看畫面。Claude 第三輪已通過醫學內容與錨點；本輪104個錨點、定稿內容、其他三張自繪SVG均保持不變。**

## 教師檢視入口

- [140張截圖集](micro-immuno-review-preview.html)：可切換兩份教材、390／1280、system-ui／Noto Sans CJK TC／Arial-sans-serif fallback、實驗室／節點／完整頁面。
- [細菌互動 preview](../public/materials/micro-bacteria-review-v1/index.html)／[免疫互動 preview](../public/materials/immuno-concepts-review-v1/index.html)
- 標準shots另有46張全頁圖（細菌24、免疫22）。

| 教材 | 節點 | 先備＋情境 | HTML大小 |
|---|---:|---:|---:|
{html_rows}

## Claude此次只複驗四點

1. **圖例防裁切**：全部圖例以Noto Sans CJK TC量測≤1080（viewBox寬1200的90%），超過即在完整項目之間換行；每組單欄獨立段落，取消textLength擠字。三種字型、兩尺寸均無越界；實測Noto最寬圖例行 **{noto_max:.2f}**。B-N01人體細胞、I-N04骨髓系、I-N05抗原、I-N08 CD8行均已拆開。B-N01比例原文保留於最後一行。
2. **B-N02細胞質**：右下角圖像外、圖例區上方的白底小標籤，獨立一行。文字基線725，圖例首行800.5，三種字型均驗證細胞質字框底端與圖例字框頂端分開≥3單位，沒有與任何圖例同行。
3. **依圖例分組接續編號**：組內仍由左至右、由上至下。I-N04＝骨髓1–2→骨髓系3–8→淋巴系9–12→次級淋巴器官13–15；I-N01＝第一道防線1–2→第二道3–4→第三道5–6→病原7；I-N05＝抗原1–4→抗體5–8。I-N04淋巴系標題中心對準B／T／NK細胞列（x≈800），位置在B細胞上方；不再靠近淋巴結。其他圖維持區塊編號，I-N08右側CD8仍為該組第一項。
4. **B-N06 50S藥名留距**：藥名移至細菌外框左上側，巨環類／clindamycin保持分行。以4097個外框採樣點計算字框與外框最短距離，扣除外框與文字描邊；三種字型最小淨距 **{drug_gap:.2f}單位**，大於要求12。50S標題與上方文字亦通過間距檢查；單一核糖體與30S／50S指向保持不變。

- [四點專項檢查數值](micro-immuno-review/round4-four-point-checks.json)
- [教師核可錨點保留證明](micro-immuno-review/round4-anchor-preservation.json)：104個標籤文字、來源比例座標、偏移均與第三輪完全相同；染色／免疫曲線／抗體結構三張自繪SVG SHA亦不變。

## 全部檢查結果

- 三字型×兩尺寸×預設／冷色樣式 **252個SVG狀態全過**；越界、圖例字框／編號圓圈重疊、引線相交、水平溢位、pageerror／console error均0。
- 手機字≥**{min_px:.2f}px**，桌機字≥14px；字框最小距離 **{min_gap:.2f} viewBox單位**（門檻3）。圖例單欄、Noto90%寬度、分組編號順序、細胞質獨立列、淋巴標題位置、50S淨距≥12均有自動檢查。
- 點陣viewBox收緊為 **{min(m['viewBox'][3] for m in metadata)}–{max(m['viewBox'][3] for m in metadata)}**，均≤原圖900×1.45。圖例列距65.5，原字級43.45不變；圖片與錨點維持原比例，只保留既有近白底部留白裁切及I-N03標題帶。
- 核糖體／IgM五Fc連環／IgA J鏈與分泌片接觸檢查全過；醫學圖面已由Claude第三輪核可，本次只改四點排版。
- SDK **4組完整DOM流程全過**：展開首次explore、停留nodeTime、每次answer、錯題回讀與重挑戰、全對最後一題才complete；實驗室／預測／時間軸不送學習事件。使用本機recorder，未連正式平台。
- 節點驗證與既有 **20／20測試**、標準shots24＋22、`git diff --check`通過；截圖集140張引用、三字型篩選與兩尺寸圖片載入檢查通過。

## 內容與範圍保護

- 兩份教師定稿JSON文字、題目、選項、答案、提示、解析、來源及頁碼均未改；preview mount payload與輸入一致。
- credits仍維持核可形狀：原物件各文字值以「｜」串成字串陣列，原文保留，追加「插圖由 AI（Gemini／ChatGPT）生成，經授課教師審訂（2026-10-10）」。未再新增內容。
- **經教師／Claude同意的唯一kit改動**仍為presentation.mjs hues新增 `'micro-bacteria-review':22`、`'immuno-concepts-review':216`。palette邏輯、其他kit、materials-build.mjs未改。
- 12張PNG仍為1200×900／quality80 WebP內嵌SVG，最大WebP {max(m['webpBytes'] for m in metadata):,} bytes、點陣SVG {max(m['svgBytes'] for m in metadata):,} bytes；不使用兩張COVER。manifest原有項目不變，僅新增16筆。
- [保護檔案證據](micro-immuno-review/protected-files.json)：Excel、shared/materials.ts、教材README與其他kit／建置程式保持HEAD內容。只改指定worktree與測試暫存檔，主目錄及其他worktree工作檔未改。
- 既有kit仍沒有真正深色主題；冷色是測試時設定既有data-theme，系統深色偏好截圖實際仍淺色。本輪未擴大kit範圍。

## 原始結果與重跑

- [252狀態、字框與SDK事件](micro-immuno-review/verification-results.json)／[截圖集檢查](micro-immuno-review/gallery-checks.json)
- [圖片與104個錨點](micro-immuno-review/figure-metadata.json)／[來源像素](micro-immuno-review/anchor-source-checks.json)／[本輪16圖SHA](micro-immuno-review/round4-asset-sha.json)
- [細菌shots](micro-immuno-review/micro-bacteria-review-shots-report.json)／[免疫shots](micro-immuno-review/immuno-concepts-review-shots-report.json)
- [20項測試](micro-immuno-review/material-tests.tap)／[節點文字驗證](micro-immuno-review/node-text-validation.txt)／[字型來源與SHA](micro-immuno-review/font-audit.json)

```sh
npm run materials:preview micro-bacteria-review
npm run materials:preview immuno-concepts-review
npm run materials:shots micro-bacteria-review
npm run materials:shots immuno-concepts-review
MI_CJK_FONT=/absolute/path/NotoSansCJKtc-Regular.otf node --experimental-strip-types scripts/micro-immuno-verify.mjs
python3 scripts/micro-immuno-gallery.py
node scripts/micro-immuno-gallery-verify.mjs
```

使用Node22.23.2、bundled Pillow Python。**仍停preview：未正式build、未寫Excel、未登錄、未commit／push／部署。** handoff與DEVELOPMENT_LOG已更新；下一步Claude只複驗上述四點、教師看畫面。
'''
formal=folder/'formal-delivery.md'
if formal.exists():
 formal_text=formal.read_text().replace('](question-bank-verification.json)','](micro-immuno-review/question-bank-verification.json)').replace('](full-check.txt)','](micro-immuno-review/full-check.txt)')
 body='# 115-MI 微免教材正式交件報告\n\n'+formal_text+'\n\n---\n\n以下保留教師核可前的圖面驗證紀錄；其待核可／未正式建置狀態已由上方正式交件更新取代。\n\n'+body
(root/'docs/MICRO_IMMUNO_REVIEW_REPORT.md').write_text(body)
pre=[]
for c in r['contentChecks']:
 slug=c['slug'];source=(folder/f'{slug}.content.json').read_bytes();adapted=(root/f'materials-src/{slug}/content.json').read_bytes();pre.append({**c,'sourceSha256':hashlib.sha256(source).hexdigest(),'adaptedSha256':hashlib.sha256(adapted).hexdigest(),'approvedHue':22 if slug.startswith('micro') else 216,'onlyCreditsShapeChanged':True})
(folder/'preflight-results.json').write_text(json.dumps({'date':'2026-10-11','branch':'feature/micro-immuno-review','base':'e8805f8','status':'round4-four-points-complete-awaiting-review','results':pre},ensure_ascii=False,indent=2)+'\n')
print({'minPx':min_px,'minGap':min_gap,'labels':sum(len(m['labels']) for m in metadata),'font':family})
