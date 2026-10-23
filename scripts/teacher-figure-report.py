"""Index per-screenshot figure checks; distinguish code/layout evidence from art approval."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/urinary-release/apply9-final'
ART = OUT / 'teacher-figures'
manifest = json.loads((ROOT / 'materials-src/apply-kit/teacher-figures.json').read_text())
slugs = list(dict.fromkeys(e['slug'] for e in manifest['entries']))
entries = {(e['slug'], e['node']): e for e in manifest['entries']}
summary = []
index = []
shot_records = []
for slug in slugs:
    folder = ART / slug
    layout = json.loads((folder / 'layout-results.json').read_text())
    diff = json.loads((folder / 'SCRIPT_DIFF.json').read_text())
    assert layout['summary']['fail'] == 0, (slug, layout['summary'])
    assert diff['pass'], slug
    assert len({(r['width'], r['height']) for r in layout['results']}) == 8, slug
    (folder / 'first-failure.json').unlink(missing_ok=True)
    preview = 'checked-student.html' if slug == 'acid-base-homeostasis' else 'preview.html'
    summary.append({'slug': slug, 'layout': layout['summary'], 'requiredUnits': diff['requiredUnits'],
                    'missing': len(diff['missing']), 'extra': len(diff['textErrors']),
                    'previewSha256': hashlib.sha256((folder / preview).read_bytes()).hexdigest()})
    index.append(f'<li><a href="{slug}/{preview}">{slug}</a> · <a href="{slug}/SHOTS.md">截圖</a> · <a href="{slug}/FIGURE_CHECKLIST.md">五項檢查</a></li>')
    lines = ['# 給 Claude 的摘要', '- 每張 390×844／1280×800 截圖逐項列入；缺圖不冒充底圖核可。',
             '- ✓源圖：沿用既有審過的原始 PNG；✓程式：圖層與箭頭回歸；✓版面：八尺寸字級／溢出及代表狀態截圖複核。',
             '- 自動紀錄不能取代獨立解剖審查；G01／G02／G03 依作圖單交教師補圖。', '',
             '| 截圖／狀態 | 結構連續 | 方位／區域 | 箭頭尖與方向 | 本關元素 | 標籤／手機 |',
             '|---|---|---|---|---|---|']
    shots = []
    for r in layout['results']:
        if not r.get('file') or r['width'] not in (390, 1280):
            continue
        shot = folder / r['file']
        assert shot.is_file(), shot
        match = re.match(r'N0?(\d+)(?:-|$)', r['name'])
        entry = entries.get((slug, int(match[1]))) if match else None
        if entry:
            structure = f"待補 {entry['missingId']}" if entry['kind'] == 'missing' else ('✓源圖' if entry['kind'] == 'anatomy' else '✓程式')
            checks = [structure, '✓腳本區域／圖下角色', '✓程式（無箭頭者不適用）', '✓逐關重置', '✓版面']
        else:
            checks = ['不適用（非關卡圖）'] * 5
        label = f"{r['width']}×{r['height']} {r['name']}"
        lines.append(f"| [{label}]({r['file']}) | " + ' | '.join(checks) + ' |')
        shots.append(f"- [{label}]({r['file']})：{r['description']}")
        shot_records.append({'slug':slug,'name':r['name'],'size':[r['width'],r['height']],
                             'file':str(shot.relative_to(OUT)), 'checks':checks})
    (folder / 'FIGURE_CHECKLIST.md').write_text('\n'.join(lines) + '\n')
    (folder / 'SHOTS.md').write_text('# 截圖\n\n' + '\n'.join(shots) + '\n')
    for n in range(1,7):
        for size in ('390x844','1280x800'):
            assert (folder/'shots'/f'{size}-N{n}-before.png').exists() or (folder/'shots'/f'{size}-N{n:02}-before.png').exists(), (slug,n,size)
(ART / 'index.html').write_text('<!doctype html><html lang="zh-TW"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>原圖版試用</title><style>body{font:18px system-ui;max-width:900px;margin:32px auto;padding:16px;background:#eef5f8;color:#173d4a}li{margin:20px 0}a{color:#165a70}</style><h1>泌尿＋體液原圖版</h1><p>九份＋酸鹼；缺圖 G01、G02、G03 見補圖單。</p><ul>'+''.join(index)+'</ul></html>')
(OUT / 'FIGURE_CHECKLIST.md').write_text('''# 給 Claude 的摘要
- 60 關都有兩個指定尺寸的作答前截圖；每張截圖在各教材檢查表對應五個項目。
- 複核方式分開標註：源圖沿用、程式回歸、版面檢查與代表狀態畫面；不聲稱另一 AI 獨立驗收。
- 缺圖 G01／G02／G03 明列「待補」，未作底圖核可；G02 暫留圖的五個指定問題另有測試與前後畫面。
- 每關區域可在圖內、引線標籤或圖下角色列；數學／化學資料圖以符號、分子與分母或圖例識別。
- 教師新增五項：結構連續、區域／方位、箭頭尖與方向、只留本關元素、標籤不壓線且手機可讀。
- 詳細狀態與說明以各 SHOTS.md、layout-results.json 和 FIGURE_CHECKLIST.md 為準。

''' + '\n'.join(f'- [{s} 五項逐張檢查](teacher-figures/{s}/FIGURE_CHECKLIST.md)' for s in slugs) + '\n')
(OUT / 'FIGURE_CHECKLIST.json').write_text(json.dumps(shot_records,ensure_ascii=False,indent=2)+'\n')
(ART / 'SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
for generated in ART.rglob('*'):
    if generated.suffix in ('.md', '.txt'):
        generated.write_text(generated.read_text().rstrip() + '\n')
print(json.dumps({'nodes':len(entries),'shots':len(shot_records),'layoutCases':sum(r['layout']['cases'] for r in summary),'fail':sum(r['layout']['fail'] for r in summary)},ensure_ascii=False))
